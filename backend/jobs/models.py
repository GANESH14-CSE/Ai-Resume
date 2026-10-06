import uuid
from django.db import models
from django.contrib.auth.models import User

class JobPosting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_postings')
    title = models.CharField(max_length=255, default='Target Role')
    company = models.CharField(max_length=255, blank=True, default='')
    raw_text = models.TextField(help_text="Original raw Job Description provided by the user.")
    extracted_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured analysis: required_skills, nice_to_have_skills, keywords, domain, summary."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.company}" if self.company else self.title
