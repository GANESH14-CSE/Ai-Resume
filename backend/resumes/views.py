import os
import json
from django.core.files.base import ContentFile
from django.http import HttpResponse, FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction

from profiles.models import (
    Profile,
    Skill,
    Experience,
    Project,
    Education,
    Certification,
    Achievement,
    SkillCategory,
    EmploymentType
)
from profiles.views import get_current_app_user
from profiles.serializers import MasterProfileSerializer
from jobs.models import JobPosting
from .models import TailoredResume
from .serializers import TailoredResumeSerializer

from ai.client import AIClient
from matching.services import MatchingEngine
from pdf.generator import AtsPdfGenerator
from common.parsers import extract_text_from_file

class UploadResumeView(APIView):
    """
    Accepts an uploaded resume file (PDF, DOCX, TXT) or raw text.
    Extracts text and parses it into structured resume format.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        raw_text = request.data.get('raw_text', '')

        if uploaded_file:
            raw_text = extract_text_from_file(uploaded_file, filename=uploaded_file.name)

        raw_text = (raw_text or '').strip()
        if not raw_text:
            return Response(
                {"error": {"code": "EMPTY_INPUT", "message": "No file or text provided to parse."}},
                status=400
            )

        ai_client = AIClient()
        parsed_resume = ai_client.parse_raw_resume(raw_text)

        return Response({
            "message": "Resume successfully parsed.",
            "parsed_resume": parsed_resume,
            "raw_text_length": len(raw_text)
        })

class AnalyzeCompareView(APIView):
    """
    Analyzes existing resume + target Job Description.
    Returns:
    - matching_skills
    - matching_keywords
    - suggestions checklist (skills to add, keywords to target, phrasing enhancements)
    - job_analysis
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user = get_current_app_user(request)
        jd_text = (request.data.get('job_description_text') or '').strip()
        if not jd_text:
            return Response(
                {"error": {"code": "JD_REQUIRED", "message": "Please paste a Job Description."}},
                status=400
            )

        # Resume source: either provided in request body, or fallback to saved Master Profile
        resume_content = request.data.get('resume_content')
        if not resume_content and user:
            profile_obj = Profile.objects.filter(user=user).first()
            if profile_obj:
                resume_content = MasterProfileSerializer(profile_obj).data

        if not resume_content:
            return Response(
                {"error": {"code": "RESUME_REQUIRED", "message": "No existing resume or Master Profile found."}},
                status=400
            )

        ai_client = AIClient()
        comparison = ai_client.compare_resume_and_jd(resume_content, jd_text)
        return Response(comparison)

class ApplyAndGenerateView(APIView):
    """
    Takes existing resume + approved suggestions + Job Description.
    Updates the resume, calculates ATS score, generates PDF, and saves record.
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        user = get_current_app_user(request)
        if not user:
            return Response({"error": {"code": "USER_NOT_FOUND", "message": "User not found."}}, status=400)

        jd_text = (request.data.get('job_description_text') or '').strip()
        if not jd_text:
            return Response({"error": {"code": "JD_REQUIRED", "message": "Job Description is required."}}, status=400)

        resume_content = request.data.get('resume_content')
        if not resume_content:
            profile_obj = Profile.objects.filter(user=user).first()
            if profile_obj:
                resume_content = MasterProfileSerializer(profile_obj).data

        if not resume_content:
            return Response({"error": {"code": "RESUME_REQUIRED", "message": "Resume data is required."}}, status=400)

        approved_suggestions = request.data.get('approved_suggestions', [])
        save_as_master = request.data.get('save_as_master_profile', False)

        ai_client = AIClient()
        job_analysis = request.data.get('job_analysis') or ai_client.analyze_job_description(jd_text)

        target_role = (
            request.data.get('target_role') or
            job_analysis.get('job_title') or
            resume_content.get('title') or
            'Software Engineer'
        ).strip()

        target_company = (
            request.data.get('target_company') or
            job_analysis.get('company') or
            ''
        ).strip()

        # Deterministic match
        cand_skills = resume_content.get('skills', [])
        # Add approved skills to candidate skills list for matching
        for sug in approved_suggestions:
            if sug.get('type') == 'skill' and sug.get('content'):
                cand_skills.append({'name': sug['content'], 'category': sug.get('category', 'tool')})

        jd_req_skills = job_analysis.get('required_skills', [])
        jd_opt_skills = job_analysis.get('nice_to_have_skills', [])

        matched_skills, missing_skills, match_ratio = MatchingEngine.match_skills(
            candidate_skills=cand_skills,
            jd_required_skills=jd_req_skills,
            jd_nice_to_have_skills=jd_opt_skills
        )

        # Tailor with approved suggestions
        tailored_content, audit_report = ai_client.tailor_resume(
            master_profile=resume_content,
            job_analysis=job_analysis,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            approved_suggestions=approved_suggestions
        )

        # Compute ATS score
        ats_breakdown = MatchingEngine.calculate_ats_score(
            candidate_profile=resume_content,
            job_analysis=job_analysis,
            matched_skills=matched_skills,
            missing_skills=missing_skills
        )
        ats_score = ats_breakdown.get('overall_score', 85.0)

        # Save Job Posting
        job_posting = JobPosting.objects.create(
            user=user,
            title=target_role,
            company=target_company,
            raw_text=jd_text,
            extracted_data=job_analysis
        )

        # Generate ATS PDF
        pdf_stream = AtsPdfGenerator.generate(tailored_content)
        cand_name = tailored_content.get('header', {}).get('name', 'Candidate')
        pdf_filename = f"resume_{cand_name.replace(' ', '_')}_{target_role.replace(' ', '_')}.pdf"

        tailored_resume = TailoredResume(
            user=user,
            job=job_posting,
            target_role=target_role,
            target_company=target_company,
            resume_content=tailored_content,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            ats_score=ats_score,
            ats_breakdown=ats_breakdown
        )
        tailored_resume.pdf_file.save(pdf_filename, ContentFile(pdf_stream.getvalue()), save=True)

        # Optionally save as master profile if requested
        if save_as_master:
            profile_obj, _ = Profile.objects.get_or_create(user=user)
            profile_obj.name = cand_name
            profile_obj.title = target_role
            header = tailored_content.get('header', {})
            profile_obj.email = header.get('email', '')
            profile_obj.phone = header.get('phone', '')
            profile_obj.location = header.get('location', '')
            profile_obj.summary = tailored_content.get('summary', '')
            profile_obj.save()

        return Response({
            "id": tailored_resume.id,
            "target_role": target_role,
            "target_company": target_company,
            "ats_score": ats_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "ats_breakdown": ats_breakdown,
            "audit_report": audit_report,
            "resume_content": tailored_content,
            "job_analysis": job_analysis,
            "pdf_url": f"/api/v1/resumes/{tailored_resume.id}/pdf/",
            "created_at": tailored_resume.created_at
        })

class GenerateResumeView(APIView):
    """
    One-step generator: Master Profile + JD -> Tailored Resume
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        user = get_current_app_user(request)
        if not user:
            return Response(
                {"error": {"code": "USER_NOT_FOUND", "message": "No active user found."}},
                status=400
            )

        profile_obj = Profile.objects.filter(user=user).first()
        if not profile_obj or not profile_obj.name:
            return Response(
                {
                    "error": {
                        "code": "PROFILE_REQUIRED",
                        "message": "Master Profile not found. Please enter and save your real Master Profile first before generating resumes."
                    }
                },
                status=400
            )

        profile_data = MasterProfileSerializer(profile_obj).data

        jd_text = (request.data.get('job_description_text') or '').strip()
        if not jd_text:
            return Response(
                {
                    "error": {
                        "code": "JD_REQUIRED",
                        "message": "Please paste a Job Description to generate your tailored resume."
                    }
                },
                status=400
            )

        ai_client = AIClient()
        job_analysis = ai_client.analyze_job_description(jd_text)

        target_role = (
            request.data.get('target_role') or
            job_analysis.get('job_title') or
            profile_data.get('title') or
            'Software Engineer'
        ).strip()

        target_company = (
            request.data.get('target_company') or
            job_analysis.get('company') or
            ''
        ).strip()

        job_posting = JobPosting.objects.create(
            user=user,
            title=target_role,
            company=target_company,
            raw_text=jd_text,
            extracted_data=job_analysis
        )

        cand_skills = profile_data.get('skills', [])
        jd_req_skills = job_analysis.get('required_skills', [])
        jd_opt_skills = job_analysis.get('nice_to_have_skills', [])

        matched_skills, missing_skills, match_ratio = MatchingEngine.match_skills(
            candidate_skills=cand_skills,
            jd_required_skills=jd_req_skills,
            jd_nice_to_have_skills=jd_opt_skills
        )

        tailored_content, audit_report = ai_client.tailor_resume(
            master_profile=profile_data,
            job_analysis=job_analysis,
            matched_skills=matched_skills,
            missing_skills=missing_skills
        )

        ats_breakdown = MatchingEngine.calculate_ats_score(
            candidate_profile=profile_data,
            job_analysis=job_analysis,
            matched_skills=matched_skills,
            missing_skills=missing_skills
        )
        ats_score = ats_breakdown.get('overall_score', 85.0)

        pdf_stream = AtsPdfGenerator.generate(tailored_content)
        pdf_filename = f"resume_{profile_obj.name.replace(' ', '_')}_{target_role.replace(' ', '_')}.pdf"

        tailored_resume = TailoredResume(
            user=user,
            job=job_posting,
            target_role=target_role,
            target_company=target_company,
            resume_content=tailored_content,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            ats_score=ats_score,
            ats_breakdown=ats_breakdown
        )
        tailored_resume.pdf_file.save(pdf_filename, ContentFile(pdf_stream.getvalue()), save=True)

        return Response({
            "id": tailored_resume.id,
            "target_role": target_role,
            "target_company": target_company,
            "ats_score": ats_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "ats_breakdown": ats_breakdown,
            "audit_report": audit_report,
            "resume_content": tailored_content,
            "job_analysis": job_analysis,
            "pdf_url": f"/api/v1/resumes/{tailored_resume.id}/pdf/",
            "created_at": tailored_resume.created_at
        })

class ResumeDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = get_current_app_user(request)
        resume = TailoredResume.objects.filter(id=pk, user=user).first()
        if not resume:
            return Response({"error": "Tailored resume not found"}, status=404)
        data = TailoredResumeSerializer(resume).data
        data['pdf_url'] = f"/api/v1/resumes/{resume.id}/pdf/"
        return Response(data)

class ResumeListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = get_current_app_user(request)
        if not user:
            return Response([])
        resumes = TailoredResume.objects.filter(user=user).order_by('-created_at')
        result = []
        for r in resumes:
            d = TailoredResumeSerializer(r).data
            d['pdf_url'] = f"/api/v1/resumes/{r.id}/pdf/"
            result.append(d)
        return Response(result)

class ResumePdfDownloadView(APIView):
    """Streams the ATS-compliant PDF directly for download."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = get_current_app_user(request)
        resume = TailoredResume.objects.filter(id=pk, user=user).first()
        if not resume or not resume.pdf_file:
            if resume and resume.resume_content:
                pdf_stream = AtsPdfGenerator.generate(resume.resume_content)
                filename = f"Resume_{resume.target_role.replace(' ', '_')}.pdf"
                response = HttpResponse(pdf_stream.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
            return Response({"error": "PDF not available"}, status=404)

        try:
            return FileResponse(
                resume.pdf_file.open('rb'),
                as_attachment=True,
                filename=os.path.basename(resume.pdf_file.name),
                content_type='application/pdf'
            )
        except Exception:
            pdf_stream = AtsPdfGenerator.generate(resume.resume_content)
            filename = f"Resume_{resume.target_role.replace(' ', '_')}.pdf"
            response = HttpResponse(pdf_stream.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
