import pytest
from matching.services import MatchingEngine
from ai.validator import TruthfulnessValidator
from pdf.generator import AtsPdfGenerator

def test_deterministic_skill_matching():
    candidate_skills = [
        {"name": "Python", "aliases": ["py"]},
        {"name": "Django", "aliases": ["drf"]},
        {"name": "PostgreSQL", "aliases": ["postgres", "pgsql"]}
    ]
    jd_required = ["Python", "Django", "Kubernetes", "AWS"]
    jd_nice = ["PostgreSQL", "Kafka"]

    matched, missing, ratio = MatchingEngine.match_skills(
        candidate_skills=candidate_skills,
        jd_required_skills=jd_required,
        jd_nice_to_have_skills=jd_nice
    )

    assert "Python" in matched
    assert "Django" in matched
    assert "PostgreSQL" in matched
    assert "Kubernetes" in missing
    assert "AWS" in missing
    assert "Kafka" in missing
    assert len(matched) == 3
    assert len(missing) == 3

def test_truthfulness_validator_strips_hallucinated_skills():
    master_profile = {
        "summary": "Django developer with experience in payments.",
        "skills": [
            {"name": "Python"},
            {"name": "Django"}
        ],
        "experiences": [
            {"bullets": ["Built Razorpay donation gateway"]}
        ],
        "projects": [
            {"bullets": ["Donation site in Django"]}
        ]
    }

    # An LLM that hallucinated Kubernetes and AWS and 40% metric
    hallucinated_resume = {
        "skills": {
            "languages": ["Python"],
            "frameworks": ["Django"],
            "tools": ["Kubernetes", "AWS"]  # NOT in profile!
        },
        "experiences": [
            {
                "bullets": [
                    "Engineered Razorpay payment platform, improving conversion by 40%"  # 40% not in profile!
                ]
            }
        ],
        "projects": []
    }

    sanitized, report = TruthfulnessValidator.audit_and_sanitize(
        generated_resume=hallucinated_resume,
        master_profile=master_profile
    )

    # Hallucinated skills must be removed
    assert "Kubernetes" in report["removed_skills"]
    assert "AWS" in report["removed_skills"]
    assert "Kubernetes" not in sanitized["skills"]["tools"]
    assert "AWS" not in sanitized["skills"]["tools"]

    # 40% metric must be flagged
    assert len(report["metric_warnings"]) > 0

def test_ats_pdf_generator():
    resume_data = {
        "header": {
            "name": "Alex Developer",
            "title": "Backend Engineer",
            "email": "alex@example.com",
            "phone": "+1 555-0100",
            "location": "New York, NY",
            "github": "https://github.com/alex"
        },
        "summary": "Proven track record in building resilient backend services.",
        "skills": {
            "languages": ["Python", "SQL"],
            "frameworks": ["Django", "FastAPI"],
            "databases": ["PostgreSQL"],
            "tools": ["Docker", "Git"]
        },
        "experiences": [
            {
                "role": "Software Engineer",
                "company": "Tech Innovations",
                "start_date": "2021",
                "end_date": "2024",
                "bullets": ["Architected core data pipeline."]
            }
        ],
        "projects": [
            {
                "name": "Payment Gateway",
                "technologies": ["Python", "Django"],
                "bullets": ["Implemented secure transaction handler."]
            }
        ],
        "education": [
            {
                "institution": "University of Technology",
                "degree": "B.S. in Computer Science"
            }
        ]
    }

    pdf_stream = AtsPdfGenerator.generate(resume_data)
    pdf_bytes = pdf_stream.getvalue()
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b'%PDF')
