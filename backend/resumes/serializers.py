from rest_framework import serializers
from .models import TailoredResume

class TailoredResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TailoredResume
        fields = [
            'id', 'target_role', 'target_company', 'resume_content',
            'matched_skills', 'missing_skills', 'ats_score',
            'ats_breakdown', 'pdf_file', 'created_at'
        ]
