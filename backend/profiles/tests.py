import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from profiles.models import Profile, Skill, Experience, Project

@pytest.mark.django_db
def test_master_profile_get_when_empty():
    user = User.objects.create_user(username='profileuser', password='password123')
    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse('master-profile')
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    assert data['exists'] is False
    assert data['profile'] is None

@pytest.mark.django_db
def test_master_profile_save_and_retrieve():
    user = User.objects.create_user(username='profileuser2', password='password123')
    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse('master-profile')
    payload = {
        "name": "Jane Doe",
        "title": "Senior Python Backend Engineer",
        "email": "jane@example.com",
        "phone": "+1 555-0199",
        "location": "San Francisco, CA",
        "linkedin": "https://linkedin.com/in/janedoe",
        "github": "https://github.com/janedoe",
        "portfolio": "https://janedoe.dev",
        "summary": "Experienced backend engineer specializing in high performance distributed systems.",
        "skills": [
            {"name": "Python", "category": "language", "proficiency": "Expert"},
            {"name": "Django", "category": "framework", "proficiency": "Expert"},
            {"name": "PostgreSQL", "category": "database", "proficiency": "Advanced"}
        ],
        "experiences": [
            {
                "company": "Acme Corp",
                "role": "Backend Engineer",
                "employment_type": "job",
                "location": "Remote",
                "start_date": "2022-01-01",
                "end_date": None,
                "description_points": ["Engineered core payment microservices handling 10k RPS."],
                "technologies": ["Python", "Django", "PostgreSQL"]
            }
        ],
        "projects": [
            {
                "name": "Donation Engine",
                "domain": "FinTech",
                "github_url": "https://github.com/janedoe/donation-engine",
                "live_url": "https://donation.janedoe.dev",
                "description_points": ["Developed a donation processing backend with Razorpay integration."],
                "technologies": ["Python", "Django"]
            }
        ],
        "education": [
            {
                "institution": "State University",
                "degree": "B.S.",
                "field": "Computer Science",
                "start_year": 2018,
                "end_year": 2022,
                "grade": "3.9 GPA"
            }
        ],
        "certifications": [
            {
                "name": "AWS Certified Solutions Architect",
                "issuer": "Amazon Web Services",
                "date": "2023-05-01"
            }
        ],
        "achievements": [
            {
                "title": "Hackathon Winner",
                "description": "Won 1st place in university-wide hackathon for distributed cache project.",
                "date": "2021-11-15"
            }
        ]
    }

    save_response = client.post(url, payload, format='json')
    assert save_response.status_code == 200
    saved_data = save_response.json()
    assert saved_data['exists'] is True
    assert saved_data['profile']['name'] == "Jane Doe"
    assert len(saved_data['profile']['skills']) == 3
    assert len(saved_data['profile']['experiences']) == 1
    assert len(saved_data['profile']['projects']) == 1

    # Verify retrieval
    get_response = client.get(url)
    assert get_response.status_code == 200
    retrieved = get_response.json()
    assert retrieved['exists'] is True
    assert retrieved['profile']['title'] == "Senior Python Backend Engineer"
