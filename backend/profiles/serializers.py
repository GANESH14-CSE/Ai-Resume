from rest_framework import serializers
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

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'proficiency', 'aliases']

class ExperienceSerializer(serializers.ModelSerializer):
    technologies = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all(),
        required=False
    )
    technologies_detail = SkillSerializer(source='technologies', many=True, read_only=True)

    class Meta:
        model = Experience
        fields = [
            'id', 'company', 'role', 'employment_type', 'location',
            'start_date', 'end_date', 'description_points',
            'technologies', 'technologies_detail', 'order'
        ]

class ProjectSerializer(serializers.ModelSerializer):
    technologies = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all(),
        required=False
    )
    technologies_detail = SkillSerializer(source='technologies', many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description_points', 'github_url',
            'live_url', 'start_date', 'end_date', 'domain',
            'technologies', 'technologies_detail'
        ]

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'institution', 'degree', 'field', 'start_year', 'end_year', 'grade']

class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'name', 'issuer', 'date', 'credential_url']

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'title', 'description', 'date']

class MasterProfileSerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()
    experiences = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    education = serializers.SerializerMethodField()
    certifications = serializers.SerializerMethodField()
    achievements = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'name', 'title', 'email', 'phone', 'location',
            'linkedin', 'github', 'portfolio', 'summary', 'other_info',
            'skills', 'experiences', 'projects', 'education',
            'certifications', 'achievements', 'created_at', 'updated_at'
        ]

    def get_skills(self, obj):
        return SkillSerializer(obj.user.skills.all(), many=True).data

    def get_experiences(self, obj):
        return ExperienceSerializer(obj.user.experiences.all(), many=True).data

    def get_projects(self, obj):
        return ProjectSerializer(obj.user.projects.all(), many=True).data

    def get_education(self, obj):
        return EducationSerializer(obj.user.education.all(), many=True).data

    def get_certifications(self, obj):
        return CertificationSerializer(obj.user.certifications.all(), many=True).data

    def get_achievements(self, obj):
        return AchievementSerializer(obj.user.achievements.all(), many=True).data
