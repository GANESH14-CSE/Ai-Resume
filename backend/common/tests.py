import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_health_check_endpoint():
    client = APIClient()
    url = reverse('health-check')
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'
    assert 'llm_provider' in data
    assert 'version' in data

@pytest.mark.django_db
def test_auth_login_and_current_user():
    # Create test user
    user = User.objects.create_user(username='testpilot', password='secretpassword123', email='pilot@example.com')
    client = APIClient()

    # Attempt login
    login_url = reverse('auth-login')
    response = client.post(login_url, {'username': 'testpilot', 'password': 'secretpassword123'}, format='json')
    assert response.status_code == 200
    token = response.json().get('token')
    assert token is not None

    # Access auth-protected endpoint without token (should fail)
    me_url = reverse('auth-me')
    unauth_response = client.get(me_url)
    assert unauth_response.status_code == 401

    # Access auth-protected endpoint with token (should succeed)
    client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
    auth_response = client.get(me_url)
    assert auth_response.status_code == 200
    assert auth_response.json()['username'] == 'testpilot'
