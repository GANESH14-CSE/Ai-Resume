from django.urls import path
from .views import MasterProfileView, ResetProfileView

urlpatterns = [
    path('', MasterProfileView.as_view(), name='master-profile'),
    path('reset/', ResetProfileView.as_view(), name='reset-profile'),
]
