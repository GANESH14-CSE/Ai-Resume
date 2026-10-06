from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import JobPosting
from .serializers import JobPostingSerializer
from profiles.views import get_current_app_user

class JobPostingListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = get_current_app_user(request)
        if not user:
            return Response([])
        jobs = JobPosting.objects.filter(user=user).order_by('-created_at')
        serializer = JobPostingSerializer(jobs, many=True)
        return Response(serializer.data)

class JobPostingDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = get_current_app_user(request)
        job = JobPosting.objects.filter(id=pk, user=user).first()
        if not job:
            return Response({"error": "Job posting not found"}, status=404)
        return Response(JobPostingSerializer(job).data)
