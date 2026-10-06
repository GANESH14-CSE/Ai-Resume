from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.contrib.auth.models import User
from .models import (
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
from .serializers import MasterProfileSerializer
from common.parsers import extract_text_from_file
from ai.client import AIClient
from rest_framework.parsers import MultiPartParser, FormParser

def get_current_app_user(request):
    """
    Returns authenticated user, or default admin user for personal/single-user desktop use.
    """
    if request.user and request.user.is_authenticated:
        return request.user
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.first()
    return admin_user

class MasterProfileView(APIView):
    """
    Endpoint for reading and atomically saving the complete Master Profile.
    Single source of truth for all job applications.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = get_current_app_user(request)
        if not user:
            return Response({"exists": False, "profile": None})

        profile = Profile.objects.filter(user=user).first()
        if not profile:
            return Response({"exists": False, "profile": None})

        serializer = MasterProfileSerializer(profile)
        return Response({
            "exists": True,
            "profile": serializer.data
        })

    def post(self, request):
        return self.save_master_profile(request)

    def put(self, request):
        return self.save_master_profile(request)

    @transaction.atomic
    def save_master_profile(self, request):
        user = get_current_app_user(request)
        if not user:
            return Response(
                {"error": {"code": "USER_NOT_FOUND", "message": "No active user account found."}},
                status=400
            )

        data = request.data
        if not data.get('name'):
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Name is required for Master Profile."}},
                status=400
            )

        # 1. Update or create Profile base record
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.name = (data.get('name') or '').strip()
        profile.title = (data.get('title') or '').strip()
        profile.email = (data.get('email') or '').strip()
        profile.phone = (data.get('phone') or '').strip()
        profile.location = (data.get('location') or '').strip()
        profile.linkedin = (data.get('linkedin') or '').strip()
        profile.github = (data.get('github') or '').strip()
        profile.portfolio = (data.get('portfolio') or '').strip()
        profile.summary = (data.get('summary') or '').strip()
        profile.other_info = (data.get('other_info') or '').strip()
        profile.save()

        # 2. Sync Skills
        raw_skills = data.get('skills', [])
        # Delete existing skills or replace
        Skill.objects.filter(user=user).delete()
        skill_map = {}
        for s in raw_skills:
            s_name = (s.get('name') if isinstance(s, dict) else s or '').strip()
            if not s_name:
                continue
            cat = s.get('category', SkillCategory.OTHER) if isinstance(s, dict) else SkillCategory.OTHER
            prof = s.get('proficiency', '') if isinstance(s, dict) else ''
            aliases = s.get('aliases', []) if isinstance(s, dict) else []
            skill_obj = Skill.objects.create(
                user=user,
                name=s_name,
                category=cat,
                proficiency=prof,
                aliases=aliases
            )
            skill_map[s_name.lower()] = skill_obj

        # 3. Sync Experiences (Jobs & Internships)
        raw_experiences = data.get('experiences', [])
        Experience.objects.filter(user=user).delete()
        for idx, exp in enumerate(raw_experiences):
            company = (exp.get('company') or '').strip()
            role = (exp.get('role') or '').strip()
            if not company and not role:
                continue
            
            bullets = exp.get('description_points', [])
            if isinstance(bullets, str):
                bullets = [b.strip() for b in bullets.split('\n') if b.strip()]

            exp_obj = Experience.objects.create(
                user=user,
                company=company,
                role=role,
                employment_type=exp.get('employment_type', EmploymentType.JOB),
                location=(exp.get('location') or '').strip(),
                start_date=exp.get('start_date') or None,
                end_date=exp.get('end_date') or None,
                description_points=bullets,
                order=idx
            )
            # Associate tech
            tech_names = exp.get('technologies', [])
            for t in tech_names:
                t_clean = (t if isinstance(t, str) else t.get('name', '')).strip().lower()
                if t_clean in skill_map:
                    exp_obj.technologies.add(skill_map[t_clean])

        # 4. Sync Projects
        raw_projects = data.get('projects', [])
        Project.objects.filter(user=user).delete()
        for proj in raw_projects:
            name = (proj.get('name') or '').strip()
            if not name:
                continue
            bullets = proj.get('description_points', [])
            if isinstance(bullets, str):
                bullets = [b.strip() for b in bullets.split('\n') if b.strip()]

            proj_obj = Project.objects.create(
                user=user,
                name=name,
                domain=(proj.get('domain') or '').strip(),
                github_url=(proj.get('github_url') or '').strip(),
                live_url=(proj.get('live_url') or '').strip(),
                start_date=proj.get('start_date') or None,
                end_date=proj.get('end_date') or None,
                description_points=bullets
            )
            tech_names = proj.get('technologies', [])
            for t in tech_names:
                t_clean = (t if isinstance(t, str) else t.get('name', '')).strip().lower()
                if t_clean in skill_map:
                    proj_obj.technologies.add(skill_map[t_clean])

        # 5. Sync Education
        raw_education = data.get('education', [])
        Education.objects.filter(user=user).delete()
        for edu in raw_education:
            inst = (edu.get('institution') or '').strip()
            deg = (edu.get('degree') or '').strip()
            field = (edu.get('field') or '').strip()
            if not inst and not deg:
                continue
            Education.objects.create(
                user=user,
                institution=inst,
                degree=deg,
                field=field,
                start_year=edu.get('start_year') or None,
                end_year=edu.get('end_year') or None,
                grade=(edu.get('grade') or '').strip()
            )

        # 6. Sync Certifications
        raw_certs = data.get('certifications', [])
        Certification.objects.filter(user=user).delete()
        for c in raw_certs:
            c_name = (c.get('name') or '').strip()
            if not c_name:
                continue
            Certification.objects.create(
                user=user,
                name=c_name,
                issuer=(c.get('issuer') or '').strip(),
                date=c.get('date') or None,
                credential_url=(c.get('credential_url') or '').strip()
            )

        # 7. Sync Achievements
        raw_achievements = data.get('achievements', [])
        Achievement.objects.filter(user=user).delete()
        for a in raw_achievements:
            title = (a.get('title') or '').strip()
            desc = (a.get('description') or '').strip()
            if not title and not desc:
                continue
            Achievement.objects.create(
                user=user,
                title=title,
                description=desc,
                date=a.get('date') or None
            )

        serializer = MasterProfileSerializer(profile)
        return Response({
            "message": "Master Profile saved successfully. Single source of truth updated.",
            "exists": True,
            "profile": serializer.data
        })

class ResetProfileView(APIView):
    """Allows user to clear all profile data to start fresh."""
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        user = get_current_app_user(request)
        if user:
            Profile.objects.filter(user=user).delete()
            Skill.objects.filter(user=user).delete()
            Experience.objects.filter(user=user).delete()
            Project.objects.filter(user=user).delete()
            Education.objects.filter(user=user).delete()
            Certification.objects.filter(user=user).delete()
            Achievement.objects.filter(user=user).delete()
        return Response({"message": "Master Profile reset successfully."})

class ExtractProfileView(APIView):
    """
    Extracts structured Master Profile JSON from an uploaded resume file (PDF, DOCX) using AI.
    """
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        user = get_current_app_user(request)
        if not user:
            return Response({"error": "No active user account found."}, status=400)
            
        file_obj = request.FILES.get('resume')
        if not file_obj:
            return Response({"error": "No resume file provided."}, status=400)
            
        try:
            raw_text = extract_text_from_file(file_obj, file_obj.name)
            if not raw_text.strip():
                return Response({"error": "Could not extract text from the file."}, status=400)
                
            client = AIClient()
            profile_data = client.parse_raw_resume(raw_text)
            
            # Make sure we don't return null for arrays
            if not profile_data.get('skills'): profile_data['skills'] = []
            if not profile_data.get('experiences'): profile_data['experiences'] = []
            if not profile_data.get('projects'): profile_data['projects'] = []
            if not profile_data.get('education'): profile_data['education'] = []
            if not profile_data.get('certifications'): profile_data['certifications'] = []
            if not profile_data.get('achievements'): profile_data['achievements'] = []
            
            return Response(profile_data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

