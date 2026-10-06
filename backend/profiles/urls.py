from django.urls import path
from .views import MasterProfileView, ResetProfileView, ExtractProfileView

urlpatterns = [
    path('', MasterProfileView.as_view(), name='master-profile'),
    path('reset/', ResetProfileView.as_view(), name='reset-profile'),
    path('extract/', ExtractProfileView.as_view(), name='extract-profile'),
]
