from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings
import sys

class HealthCheckView(APIView):
    """Public health check endpoint."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "Truthful AI Resume Tailor API",
            "version": "1.0.0",
            "python_version": sys.version.split()[0],
            "llm_provider": getattr(settings, 'LLM_PROVIDER', 'mock'),
            "mock_llm": getattr(settings, 'MOCK_LLM', True),
        })

class AuthLoginView(APIView):
    """Authenticate single user and return token."""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"error": {"code": "INVALID_CREDENTIALS", "message": "Username and password required.", "details": {}}},
                status=400
            )

        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {"error": {"code": "INVALID_CREDENTIALS", "message": "Invalid username or password.", "details": {}}},
                status=401
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        })

class CurrentUserView(APIView):
    """Return currently authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        })
