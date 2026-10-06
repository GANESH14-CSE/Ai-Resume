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
    """Return currently authenticated user or fallback admin."""
    permission_classes = [AllowAny]

    def get(self, request):
        from profiles.views import get_current_app_user
        user = get_current_app_user(request)
        if not user:
            return Response({"error": "No user found"}, status=400)
            
        google_connected = hasattr(user, 'google_credentials')
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "google_connected": google_connected
        })

from google_auth_oauthlib.flow import Flow
from profiles.models import GoogleCredentials
from profiles.views import get_current_app_user

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = get_current_app_user(request)
        if not user:
            return Response({"error": "User not found"}, status=400)

        code = request.data.get('code')
        if not code:
            return Response({"error": "No auth code provided"}, status=400)

        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')

        if not client_id or not client_secret:
            return Response({"error": "Google OAuth is not configured on the backend"}, status=500)

        # Create client config dictionary in-memory
        client_config = {
            "web": {
                "client_id": client_id,
                "project_id": "resume-tailor",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": client_secret
            }
        }

        try:
            import os
            os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
            
            flow = Flow.from_client_config(
                client_config,
                scopes=['https://www.googleapis.com/auth/gmail.send'],
                redirect_uri='postmessage'
            )
            flow.fetch_token(code=code)
            credentials = flow.credentials

            # Save to DB
            gc, created = GoogleCredentials.objects.get_or_create(user=user)
            gc.token = credentials.token
            gc.refresh_token = credentials.refresh_token or gc.refresh_token
            gc.token_uri = credentials.token_uri
            gc.client_id = credentials.client_id
            gc.client_secret = credentials.client_secret
            gc.scopes = credentials.scopes
            gc.save()

            return Response({"message": "Google credentials saved successfully"})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": {"message": str(e)}}, status=400)

