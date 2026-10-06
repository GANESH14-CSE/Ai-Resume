from django.urls import path
from .views import JobPostingListView, JobPostingDetailView

urlpatterns = [
    path('', JobPostingListView.as_view(), name='job-list'),
    path('<uuid:pk>/', JobPostingDetailView.as_view(), name='job-detail'),
]
