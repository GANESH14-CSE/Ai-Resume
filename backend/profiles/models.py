import uuid
from django.db import models
from django.contrib.auth.models import User

class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Profile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=255, blank=True)
    linkedin = models.URLField(blank=True)
    github = models.URLField(blank=True)
    portfolio = models.URLField(blank=True)
    summary = models.TextField(blank=True, help_text="Master factual summary of experience and core strengths.")
    other_info = models.TextField(blank=True, default='', help_text="Additional factual details, awards, or custom notes.")

    def __str__(self):
        return f"{self.name} ({self.title})"

class SkillCategory(models.TextChoices):
    LANGUAGE = 'language', 'Programming Language'
    FRAMEWORK = 'framework', 'Framework / Library'
    DATABASE = 'database', 'Database'
    TOOL = 'tool', 'Tool / DevOps / Cloud'
    OTHER = 'other', 'Other'

class Skill(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=20,
        choices=SkillCategory.choices,
        default=SkillCategory.OTHER
    )
    proficiency = models.CharField(max_length=50, blank=True)
    aliases = models.JSONField(default=list, blank=True, help_text="Alternative names or spellings, e.g. ['postgres', 'pgsql']")

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.category})"

class EmploymentType(models.TextChoices):
    JOB = 'job', 'Full-time / Part-time'
    INTERNSHIP = 'internship', 'Internship'
    CONTRACT = 'contract', 'Contract / Freelance'

class Experience(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    company = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.JOB
    )
    location = models.CharField(max_length=255, blank=True)
    start_date = models.CharField(max_length=50, blank=True, null=True)
    end_date = models.CharField(max_length=50, blank=True, null=True, help_text="Blank if current role")
    description_points = models.JSONField(default=list, help_text="List of verifiable factual bullet points.")
    technologies = models.ManyToManyField(Skill, blank=True, related_name='experiences')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', '-start_date']

    def __str__(self):
        return f"{self.role} at {self.company}"

class Project(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=255)
    description_points = models.JSONField(default=list, help_text="List of verifiable project facts and achievements.")
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    start_date = models.CharField(max_length=50, blank=True, null=True)
    end_date = models.CharField(max_length=50, blank=True, null=True)
    domain = models.CharField(max_length=100, blank=True, help_text="E.g. FinTech, AI/ML, E-Commerce")
    technologies = models.ManyToManyField(Skill, blank=True, related_name='projects')

    class Meta:
        ordering = ['-end_date', '-start_date', 'name']

    def __str__(self):
        return self.name

class Education(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='education')
    institution = models.CharField(max_length=255)
    degree = models.CharField(max_length=255)
    field = models.CharField(max_length=255)
    start_year = models.CharField(max_length=50, blank=True, null=True)
    end_year = models.CharField(max_length=50, blank=True, null=True)
    grade = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ['-end_year', '-start_year']

    def __str__(self):
        return f"{self.degree} in {self.field} - {self.institution}"

class Certification(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certifications')
    name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    date = models.CharField(max_length=50, blank=True, null=True)
    credential_url = models.URLField(blank=True)

    class Meta:
        ordering = ['-date', 'name']

    def __str__(self):
        return f"{self.name} ({self.issuer})"

class Achievement(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        ordering = ['-date', 'title']

    def __str__(self):
        return self.title

class GoogleCredentials(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='google_credentials')
    token = models.CharField(max_length=2048)
    refresh_token = models.CharField(max_length=2048, blank=True, null=True)
    token_uri = models.CharField(max_length=255, default='https://oauth2.googleapis.com/token')
    client_id = models.CharField(max_length=255, blank=True, null=True)
    client_secret = models.CharField(max_length=255, blank=True, null=True)
    scopes = models.JSONField(default=list)

    def __str__(self):
        return f"Google Credentials for {self.user.username}"
