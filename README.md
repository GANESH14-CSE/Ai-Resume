# Truthful AI Resume Tailor

> A personal, single-user production tool that tailors your resume to any Job Description (JD) using **strictly verified facts** from your master profile. Zero hallucinations, source-bound claims, ATS-safe PDF/DOCX generation.

---

## 1. Truthfulness Contract

1. **ID-Referenced Generation:** Every profile item (experience, project, skill, education, certification) has a stable ID. The LLM must select IDs, never invent free-text items.
2. **Source-Bound Bullets:** Every generated bullet point points directly to its source entry (`source_id`, `source_field`).
3. **Deterministic Post-Generation Validator:** Rejects output if:
   - Any technology or skill is not in the master profile.
   - Any number, metric, or currency value is introduced that wasn't in the source text.
   - Any company, title, date, or institution doesn't match the profile.
   - Any referenced `source_id` is invalid.
4. **Retry & Fail-Safe Policy:** On violation, retries once with violation feedback; if still failing, halts with an error. Never ships unverified output.
5. **Missing Skills Isolated:** Missing skills are only surfaced in analysis and advice; they are strictly barred from entering the generated resume.

---

## 2. Pipeline Architecture

```
[ Job Description (Untrusted Input) ]
                 │
                 ▼
    1. JD Extraction (LLM Structured JSON)
       - Title, Seniority, Required/Preferred Skills, Responsibilities, Domain
                 │
                 ▼
    2. Normalize Skills (Python Alias Map)
       - Canonicalizes variants (e.g. "postgres" -> "PostgreSQL")
                 │
                 ▼
    3. Profile ↔ JD Matching (Deterministic Python)
       - Matched skills, missing skills, keyword coverage, project & experience ranking
                 │
                 ▼
    4. Resume Content Generation (LLM JSON with ID Selections)
       - Role-tailored summary, categorized verified skills, source-bound bullets
                 │
                 ▼
    5. Truthfulness Validator (Deterministic Python)
       - Rigorous audit: zero fabricated skills, metrics, dates, or companies
                 │
                 ▼
    6. ATS Scoring & Audit (Python + Advice)
       - Sub-scores (keywords, skills, experience, projects) + overall score
                 │
                 ▼
    7. Clean ATS-Safe Render (WeasyPrint / ReportLab & python-docx)
       - 1-2 pages, single column, real selectable text, no tables/graphics
```

---

## 3. Technology Stack

- **Frontend:** React 18 + TypeScript (strict), Vite, React Router, Axios, Tailwind CSS, TanStack Query, Lucide icons.
- **Backend:** Python 3.11+, Django 5, Django REST Framework, django-cors-headers, Pydantic, python-docx, ReportLab / WeasyPrint.
- **Database:** PostgreSQL (with SQLite local development fallback).
- **Authentication:** Single-user TokenAuth / SessionAuth with object-level isolation.
- **LLM Engine:** Provider adapter interface (`Anthropic`, with built-in `MockLLM` for fast local testing and verification).

---

## 4. Quickstart Guide

### Option A: Running with Docker Compose

1. Clone and copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
2. Start the services:
   ```bash
   docker compose up --build
   ```
3. Open the frontend at `http://localhost:5173` and backend API at `http://localhost:8000/api/v1/health/`.

### Option B: Running Locally (Development Mode)

1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py init_superuser
   python manage.py runserver 8000
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 5. Running Tests

- Backend tests:
  ```bash
  cd backend
  pytest
  ```
- Frontend type check:
  ```bash
  cd frontend
  npm run build
  ```
