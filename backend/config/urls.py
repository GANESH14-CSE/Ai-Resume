from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from common.views import HealthCheckView, AuthLoginView, CurrentUserView, GoogleAuthView
from resumes.views import AutoApplySendView

api_v1_patterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/google/', GoogleAuthView.as_view(), name='auth-google'),
    path('profile/', include('profiles.urls')),
    path('jobs/', include('jobs.urls')),
    path('resumes/', include('resumes.urls')),
    path('applications/send/', AutoApplySendView.as_view(), name='auto-apply-send'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
