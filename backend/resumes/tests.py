import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from profiles.models import Profile, Skill, Experience, Project

@pytest.mark.django_db
def test_generate_resume_requires_profile():
    user = User.objects.create_user(username='no_profile_user', password='password123')
    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse('resume-generate')
    response = client.post(url, {"job_description_text": "Looking for Python Django developer"}, format='json')
    assert response.status_code == 400
    assert response.json()['error']['code'] == 'PROFILE_REQUIRED'

@pytest.mark.django_db
def test_generate_truthful_resume_e2e(monkeypatch):
    user = User.objects.create_user(username='gen_user', password='password123')
    client = APIClient()
    client.force_authenticate(user=user)

    # 1. Create real profile
    profile = Profile.objects.create(
        user=user,
        name="Alex Smith",
        title="Python Backend Developer",
        email="alex.smith@example.com",
        phone="+1 555-0144",
        location="Austin, TX",
        summary="Backend engineer specializing in Django and REST APIs."
    )
    py_skill = Skill.objects.create(user=user, name="Python", category="language")
    dj_skill = Skill.objects.create(user=user, name="Django", category="framework")
    pg_skill = Skill.objects.create(user=user, name="PostgreSQL", category="database")

    exp = Experience.objects.create(
        user=user,
        company="Startup Co",
        role="Backend Developer",
        employment_type="job",
        start_date="2022-01-01",
        description_points=["Built REST APIs and donation processing with Razorpay integration."]
    )
    exp.technologies.add(py_skill, dj_skill)

    proj = Project.objects.create(
        user=user,
        name="Donation Platform",
        domain="FinTech",
        description_points=["Developed Django donation portal."]
    )
    proj.technologies.add(py_skill, dj_skill)

    # 2. Post Job Description that asks for Python, Django, REST API, but also Kubernetes and AWS
    jd_text = """
    Job Title: Python / Django Backend Developer
    Company: FinTech Global
    Requirements:
    - 3+ years of Python and Django
    - Experience designing REST APIs and PostgreSQL databases
    - Experience with Kubernetes and AWS (mandatory)
    """

    url = reverse('resume-generate')
    response = client.post(url, {"job_description_text": jd_text}, format='json')
    assert response.status_code == 200
    data = response.json()

    assert data['target_role'] == "Python / Django Backend Developer"
    assert "Python" in data['matched_skills']
    assert "Django" in data['matched_skills']
    assert "Kubernetes" in data['missing_skills']  # Missing skill captured!
    assert "AWS" in data['missing_skills']

    # AI must NEVER put Kubernetes or AWS into the candidate resume
    skills = data['resume_content']['skills']
    all_res_skills = (
        skills.get('languages', []) +
        skills.get('frameworks', []) +
        skills.get('databases', []) +
        skills.get('tools', []) +
        skills.get('other', [])
    )
    assert "Kubernetes" not in all_res_skills
    assert "AWS" not in all_res_skills

    # ATS score must be present
    assert data['ats_score'] > 0
    assert 'recommendations' in data['ats_breakdown']

    # Download PDF
    resume_id = data['id']
    pdf_url = reverse('resume-pdf-download', kwargs={'pk': resume_id})
    pdf_response = client.get(pdf_url)
    assert pdf_response.status_code == 200
    assert pdf_response['Content-Type'] == 'application/pdf'

@pytest.mark.django_db
def test_custom_resume_compare_and_apply_flow():
    user = User.objects.create_user(username='custom_flow_user', password='password123')
    client = APIClient()
    client.force_authenticate(user=user)

    existing_resume = {
        "name": "Sarah Connor",
        "title": "Full Stack Developer",
        "email": "sarah@example.com",
        "phone": "+1 555-9000",
        "location": "Los Angeles, CA",
        "summary": "Full Stack Engineer with React, TypeScript, and Node.js experience.",
        "skills": [
            {"name": "React", "category": "framework"},
            {"name": "TypeScript", "category": "language"},
            {"name": "Node.js", "category": "framework"}
        ],
        "experiences": [
            {
                "company": "Cyberdyne Systems",
                "role": "Frontend Engineer",
                "employment_type": "job",
                "start_date": "2021-01-01",
                "description_points": ["Developed responsive dashboards with React and TypeScript."]
            }
        ],
        "projects": [
            {
                "name": "Defense Net UI",
                "domain": "Security",
                "technologies": ["React", "TypeScript"],
                "description_points": ["Created real-time monitoring interface."]
            }
        ]
    }

    jd_text = """
    Job Title: Senior React / TypeScript Developer
    Requirements:
    - Deep expertise in React and TypeScript
    - Experience with GraphQL and Docker (recommended)
    - Strong understanding of state management
    """

    # 1. Step: Analyze & Compare
    compare_url = reverse('resume-analyze-compare')
    compare_res = client.post(compare_url, {
        "resume_content": existing_resume,
        "job_description_text": jd_text
    }, format='json')
    assert compare_res.status_code == 200
    comp_data = compare_res.json()

    assert "React" in comp_data['matching_skills']
    assert "TypeScript" in comp_data['matching_skills']
    assert len(comp_data['suggestions']) > 0

    # User reviews suggestions and approves e.g. "GraphQL"
    approved_suggestions = [
        s for s in comp_data['suggestions'] if 'graphql' in s.get('content', '').lower()
    ]
    if not approved_suggestions and comp_data['suggestions']:
        approved_suggestions = [comp_data['suggestions'][0]]

    # 2. Step: Apply & Generate Final PDF Resume
    apply_url = reverse('resume-apply-and-generate')
    apply_res = client.post(apply_url, {
        "resume_content": existing_resume,
        "job_description_text": jd_text,
        "approved_suggestions": approved_suggestions,
        "save_as_master_profile": False
    }, format='json')

    assert apply_res.status_code == 200
    res_data = apply_res.json()
    assert res_data['id'] is not None
    assert res_data['ats_score'] > 0
    assert res_data['pdf_url'] is not None

    # Check PDF download
    pdf_res = client.get(res_data['pdf_url'])
    assert pdf_res.status_code == 200
    assert pdf_res['Content-Type'] == 'application/pdf'
