from django.urls import path
from .views import (
    GenerateResumeView,
    ResumeDetailView,
    ResumeListView,
    ResumePdfDownloadView,
    UploadResumeView,
    AnalyzeCompareView,
    ApplyAndGenerateView
)

urlpatterns = [
    path('', ResumeListView.as_view(), name='resume-list'),
    path('generate/', GenerateResumeView.as_view(), name='resume-generate'),
    path('upload-parse/', UploadResumeView.as_view(), name='resume-upload-parse'),
    path('analyze-compare/', AnalyzeCompareView.as_view(), name='resume-analyze-compare'),
    path('apply-and-generate/', ApplyAndGenerateView.as_view(), name='resume-apply-and-generate'),
    path('<uuid:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
    path('<uuid:pk>/pdf/', ResumePdfDownloadView.as_view(), name='resume-pdf-download'),
]
