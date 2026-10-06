import uuid
from django.db import models
from django.contrib.auth.models import User
from jobs.models import JobPosting

class TailoredResume(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tailored_resumes')
    job = models.ForeignKey(JobPosting, on_delete=models.SET_NULL, null=True, blank=True, related_name='resumes')
    target_role = models.CharField(max_length=255, default='Tailored Software Engineer')
    target_company = models.CharField(max_length=255, blank=True, default='')
    
    resume_content = models.JSONField(
        default=dict,
        help_text="Structured truthful tailored resume content."
    )
    
    matched_skills = models.JSONField(
        default=list,
        help_text="Skills present in both JD and Master Profile."
    )
    
    missing_skills = models.JSONField(
        default=list,
        help_text="Skills in JD that are missing from Master Profile (omitted from resume)."
    )
    
    ats_score = models.FloatField(
        default=0.0,
        help_text="Estimated ATS Compatibility Score (0-100)."
    )
    
    ats_breakdown = models.JSONField(
        default=dict,
        help_text="Detailed ATS scoring criteria, category breakdowns, and advice."
    )
    
    pdf_file = models.FileField(upload_to='resumes_pdf/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Resume: {self.target_role} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
