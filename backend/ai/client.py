import json
import logging
from django.conf import settings
from .prompts import (
    JD_ANALYSIS_SYSTEM_PROMPT,
    RESUME_TAILORING_SYSTEM_PROMPT,
    RESUME_PARSE_SYSTEM_PROMPT,
    RESUME_SUGGESTIONS_SYSTEM_PROMPT
)
from .validator import TruthfulnessValidator

logger = logging.getLogger(__name__)

class AIClient:
    """
    OpenAI client wrapper for structured, truthful JD analysis, resume parsing,
    comparison with suggestions, and resume tailoring.
    """

    def __init__(self):
        self.provider = getattr(settings, 'LLM_PROVIDER', 'openai')
        self.openai_api_key = getattr(settings, 'OPENAI_API_KEY', '')
        self.gemini_api_key = getattr(settings, 'GEMINI_API_KEY', '')
        
        # Select active key based on provider
        if self.provider.lower() == 'gemini':
            self.api_key = self.gemini_api_key
        else:
            self.api_key = self.openai_api_key
            
        self.model = getattr(settings, 'LLM_MODEL', 'gpt-4o-mini')
        self.temperature = getattr(settings, 'LLM_TEMPERATURE', 0.2)
        self.mock_mode = getattr(settings, 'MOCK_LLM', False) or (not bool(self.openai_api_key) and not bool(self.gemini_api_key))

    def _get_openai_client(self, provider_override=None):
        provider = provider_override or self.provider
        api_key = self.gemini_api_key if provider.lower() == 'gemini' else self.openai_api_key
        
        if not api_key:
            return None
            
        try:
            from openai import OpenAI
            if provider.lower() == 'gemini':
                return OpenAI(api_key=api_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/")
            return OpenAI(api_key=api_key)
        except Exception as e:
            logger.error(f"Error initializing {provider} client: {e}")
            return None

    def _execute_chat_completion(self, messages, temperature, response_format=None):
        providers = [self.provider.lower()]
        fallback = 'openai' if self.provider.lower() == 'gemini' else 'gemini'
        
        if fallback == 'openai' and self.openai_api_key:
            providers.append('openai')
        elif fallback == 'gemini' and self.gemini_api_key:
            providers.append('gemini')
            
        last_error = None
        
        for provider in providers:
            client = self._get_openai_client(provider)
            if not client:
                continue
                
            try:
                # Assign default models per provider if falling back
                model = self.model if provider == self.provider.lower() else ("gpt-4o-mini" if provider == "openai" else "gemini-1.5-flash")
                
                kwargs = {
                    "model": model,
                    "messages": messages,
                    "temperature": temperature
                }
                if response_format:
                    kwargs["response_format"] = response_format
                    
                response = client.chat.completions.create(**kwargs)
                return response.choices[0].message.content
            except Exception as e:
                logger.warning(f"LLM call failed with {provider}: {e}. Trying fallback if available...")
                last_error = e
                
        raise Exception(f"All LLM providers failed. Last error: {last_error}")

    def analyze_screenshot(self, image_base64: str) -> dict:
        """Uses Vision model to extract JD and company name from a screenshot."""
        if self.mock_mode:
            return self._fallback_analyze_jd("Software Engineer")

        try:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract the company name, job title, and key requirements from this job posting screenshot. Return as JSON with keys: company, job_title, required_skills, nice_to_have_skills, keywords, responsibilities, summary."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }
            ]
            content = self._execute_chat_completion(messages, temperature=0.1, response_format={"type": "json_object"})
            return json.loads(content)
        except Exception as e:
            logger.error(f"Vision JD analysis failed: {e}")
            return self._fallback_analyze_jd("Software Engineer")

    def generate_cover_letter(self, master_profile: dict, job_analysis: dict) -> str:
        if self.mock_mode:
            return f"Dear Hiring Team,\n\nI am writing to apply for the {job_analysis.get('job_title', 'Role')} position at {job_analysis.get('company', 'your company')}. Please find my resume attached.\n\nBest,\n{master_profile.get('name', 'Candidate')}"
            
        prompt = (
            f"Write a professional, concise, and highly converting cold email/cover letter for {master_profile.get('name')} "
            f"applying for {job_analysis.get('job_title')} at {job_analysis.get('company')}. "
            f"RULES:\n"
            f"1. Always start the email exactly with 'Dear Hiring Team,'.\n"
            f"2. Do NOT put portfolio or GitHub links inline within the paragraphs.\n"
            f"3. Place all links (LinkedIn, GitHub, Portfolio) neatly at the very bottom of the email, after the signature block.\n"
            f"Use facts from this profile: {json.dumps(master_profile, default=str)} and target these requirements: {json.dumps(job_analysis, default=str)}."
        )
        try:
            messages = [{"role": "user", "content": prompt}]
            return self._execute_chat_completion(messages, temperature=0.7)
        except Exception as e:
            logger.error(f"Cover letter generation failed: {e}")
            return "Please find my resume attached."

    def analyze_job_description(self, jd_text: str) -> dict:
        """
        Parses Job Description text and returns structured requirements.
        """
        if self.mock_mode:
            return self._fallback_analyze_jd(jd_text)

        try:
            messages = [
                {"role": "system", "content": JD_ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this Job Description:\n\n{jd_text}"}
            ]
            content = self._execute_chat_completion(messages, temperature=self.temperature, response_format={"type": "json_object"})
            return json.loads(content)
        except Exception as e:
            logger.error(f"OpenAI JD analysis failed: {e}. Falling back to deterministic parser.")
            return self._fallback_analyze_jd(jd_text)

    def parse_raw_resume(self, raw_text: str) -> dict:
        """
        Parses raw text extracted from an uploaded resume (PDF/DOCX/TXT) into structured resume JSON.
        """
        if self.mock_mode:
            return self._fallback_parse_resume(raw_text)

        try:
            messages = [
                {"role": "system", "content": RESUME_PARSE_SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract structured facts from this resume text:\n\n{raw_text[:12000]}"}
            ]
            content = self._execute_chat_completion(messages, temperature=0.1, response_format={"type": "json_object"})
            return json.loads(content)
        except Exception as e:
            logger.error(f"OpenAI resume parsing failed: {e}. Using fallback parser.")
            return self._fallback_parse_resume(raw_text)

    def compare_resume_and_jd(self, resume_data: dict, jd_text: str, job_analysis: dict = None) -> dict:
        """
        Compares existing resume with JD.
        Returns matching skills/keywords and interactive suggestions.
        """
        if not job_analysis:
            job_analysis = self.analyze_job_description(jd_text)

        if self.mock_mode:
            res = self._fallback_compare_and_suggest(resume_data, job_analysis)
            res["job_analysis"] = job_analysis
            return res

        payload = {
            "existing_resume": resume_data,
            "target_job_requirements": job_analysis
        }

        try:
            messages = [
                {"role": "system", "content": RESUME_SUGGESTIONS_SYSTEM_PROMPT},
                {"role": "user", "content": f"Compare this resume with the Job Description requirements:\n\n{json.dumps(payload, indent=2, default=str)}"}
            ]
            content = self._execute_chat_completion(messages, temperature=0.2, response_format={"type": "json_object"})
            result = json.loads(content)
            result["job_analysis"] = job_analysis
            return result
        except Exception as e:
            logger.error(f"OpenAI compare & suggest failed: {e}. Using deterministic fallback.")
            res = self._fallback_compare_and_suggest(resume_data, job_analysis)
            res["job_analysis"] = job_analysis
            return res

    def tailor_resume(
        self,
        master_profile: dict,
        job_analysis: dict,
        matched_skills: list,
        missing_skills: list,
        approved_suggestions: list = None
    ) -> tuple[dict, dict]:
        """
        Tailors candidate's resume strictly using facts from master_profile + approved suggestions.
        Audits and sanitizes output to guarantee truthfulness.
        Returns: (tailored_resume_content, audit_report)
        """
        # Augment candidate skills with any user-approved skill suggestions
        augmented_profile = json.loads(json.dumps(master_profile, default=str))
        if approved_suggestions:
            existing_skill_names = {
                (s.get('name', '') if isinstance(s, dict) else str(s)).lower()
                for s in augmented_profile.get('skills', [])
            }
            for sug in approved_suggestions:
                if sug.get('type') == 'skill' and sug.get('content'):
                    sug_name = sug['content'].strip()
                    if sug_name.lower() not in existing_skill_names:
                        augmented_profile['skills'].append({
                            'name': sug_name,
                            'category': sug.get('category', 'tool')
                        })
                        existing_skill_names.add(sug_name.lower())

        if self.mock_mode:
            raw_resume = self._fallback_tailor_resume(augmented_profile, job_analysis, matched_skills)
        else:
            prompt_payload = {
                "master_profile": augmented_profile,
                "target_job_requirements": job_analysis,
                "matched_skills": matched_skills,
                "missing_skills_to_omit": missing_skills,
                "approved_customizations": approved_suggestions or []
            }

            user_prompt = (
                "Please generate the truthful tailored resume conforming strictly to the requested JSON schema.\n"
                "Preserve existing work history and projects, incorporate approved customizations, and polish for ATS.\n"
                "Here is the verified data and target job:\n\n" + json.dumps(prompt_payload, indent=2, default=str)
            )

            try:
                messages = [
                    {"role": "system", "content": RESUME_TAILORING_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ]
                content = self._execute_chat_completion(messages, temperature=self.temperature, response_format={"type": "json_object"})
                raw_resume = json.loads(content)
            except Exception as e:
                logger.error(f"OpenAI resume tailoring failed: {e}. Using deterministic fallback.")
                raw_resume = self._fallback_tailor_resume(augmented_profile, job_analysis, matched_skills)

        # Deterministic Truthfulness Audit & Sanitization
        sanitized_resume, audit_report = TruthfulnessValidator.audit_and_sanitize(raw_resume, augmented_profile)
        return sanitized_resume, audit_report

    def _fallback_analyze_jd(self, jd_text: str) -> dict:
        """Deterministic keyword extractor fallback."""
        lines = [l.strip() for l in jd_text.split('\n') if l.strip()]
        title = "Software Engineer"
        for line in lines[:5]:
            if any(term in line.lower() for term in ['engineer', 'developer', 'architect', 'lead', 'analyst']):
                title = line
                break

        tech_keywords = [
            'Python', 'Django', 'Flask', 'FastAPI', 'React', 'TypeScript', 'JavaScript',
            'Node.js', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
            'AWS', 'Azure', 'GCP', 'GraphQL', 'REST API', 'Git', 'Linux', 'CI/CD',
            'Tailwind CSS', 'Next.js', 'PyTorch', 'TensorFlow', 'Java', 'Spring Boot', 'C++'
        ]
        found_skills = [kw for kw in tech_keywords if kw.lower() in jd_text.lower()]

        return {
            "job_title": title,
            "company": "",
            "seniority": "Mid-Senior",
            "domain": "Software Engineering",
            "required_skills": found_skills[:8] or ["Python", "JavaScript", "SQL"],
            "nice_to_have_skills": found_skills[8:] or [],
            "keywords": found_skills + ["Agile", "REST API", "Clean Code"],
            "responsibilities": ["Design and develop software components", "Collaborate with cross-functional teams"],
            "summary": "Engineering role focused on delivering reliable technical solutions."
        }

    def _fallback_parse_resume(self, raw_text: str) -> dict:
        """Deterministic fallback parser for raw resume text."""
        lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
        name = lines[0] if lines else "Candidate"
        
        # Look for skills
        tech_keywords = [
            'Python', 'Django', 'React', 'TypeScript', 'JavaScript',
            'PostgreSQL', 'MySQL', 'Docker', 'AWS', 'Git', 'REST API', 'Redis'
        ]
        found_skills = [
            {"name": kw, "category": "language" if kw in ['Python', 'JavaScript', 'TypeScript'] else "framework" if kw in ['Django', 'React'] else "database" if kw in ['PostgreSQL', 'MySQL', 'Redis'] else "tool"}
            for kw in tech_keywords if kw.lower() in raw_text.lower()
        ]

        return {
            "name": name,
            "title": "Software Engineer",
            "email": "",
            "phone": "",
            "location": "",
            "linkedin": "",
            "github": "",
            "portfolio": "",
            "summary": "Experienced software developer with a strong track record of engineering scalable applications.",
            "skills": found_skills,
            "experiences": [],
            "projects": [],
            "education": [],
            "certifications": [],
            "achievements": []
        }

    def _fallback_compare_and_suggest(self, resume_data: dict, job_analysis: dict) -> dict:
        """Deterministic comparison and suggestion builder."""
        cand_skills = {
            (s.get('name', '') if isinstance(s, dict) else str(s)).lower()
            for s in resume_data.get('skills', [])
        }
        jd_skills = job_analysis.get('required_skills', []) + job_analysis.get('nice_to_have_skills', [])

        matched = [s for s in jd_skills if s.lower() in cand_skills]
        missing = [s for s in jd_skills if s.lower() not in cand_skills]

        suggestions = []
        for idx, m in enumerate(missing[:6]):
            suggestions.append({
                "id": f"sug-{idx+1}",
                "type": "skill",
                "category": "tool",
                "title": f"Add {m}",
                "content": m,
                "reason": f"Required in target Job Description ({job_analysis.get('job_title', 'Role')})",
                "default_selected": True
            })

        for kw in job_analysis.get('keywords', [])[:3]:
            if kw.lower() not in cand_skills:
                suggestions.append({
                    "id": f"kw-{kw.lower()}",
                    "type": "keyword",
                    "title": f"Target Keyword: {kw}",
                    "content": kw,
                    "reason": "High frequency ATS keyword in target JD",
                    "default_selected": True
                })

        return {
            "matching_skills": matched,
            "matching_keywords": [k for k in job_analysis.get('keywords', []) if k.lower() in cand_skills],
            "suggestions": suggestions
        }

    def _fallback_tailor_resume(self, master_profile: dict, job_analysis: dict, matched_skills: list) -> dict:
        """Deterministic fallback builder adhering strictly to master profile facts."""
        skills = master_profile.get('skills', [])
        categorized_skills = {
            'languages': [],
            'frameworks': [],
            'databases': [],
            'tools': [],
            'other': []
        }

        matched_set = set(s.lower() for s in matched_skills)
        for s in skills:
            name = s.get('name', '') if isinstance(s, dict) else str(s)
            cat = s.get('category', 'other') if isinstance(s, dict) else 'other'
            target_cat = cat + 's' if cat in ['language', 'framework', 'database', 'tool'] else 'other'
            if target_cat not in categorized_skills:
                target_cat = 'other'

            if name.lower() in matched_set:
                categorized_skills[target_cat].insert(0, name)
            else:
                categorized_skills[target_cat].append(name)

        target_role = job_analysis.get('job_title', master_profile.get('title', 'Software Engineer'))

        experiences = []
        for exp in master_profile.get('experiences', []):
            bullets = exp.get('description_points', [])
            experiences.append({
                "role": exp.get('role', ''),
                "company": exp.get('company', ''),
                "employment_type": exp.get('employment_type', 'job'),
                "location": exp.get('location', ''),
                "start_date": exp.get('start_date'),
                "end_date": exp.get('end_date'),
                "bullets": bullets
            })

        projects = []
        for proj in master_profile.get('projects', []):
            bullets = proj.get('description_points', [])
            projects.append({
                "name": proj.get('name', ''),
                "domain": proj.get('domain', ''),
                "github_url": proj.get('github_url', ''),
                "live_url": proj.get('live_url', ''),
                "technologies": [t.get('name', '') if isinstance(t, dict) else str(t) for t in proj.get('technologies', [])],
                "bullets": bullets
            })

        return {
            "target_role": target_role,
            "target_company": job_analysis.get('company', ''),
            "header": {
                "name": master_profile.get('name', ''),
                "title": target_role,
                "email": master_profile.get('email', ''),
                "phone": master_profile.get('phone', ''),
                "location": master_profile.get('location', ''),
                "linkedin": master_profile.get('linkedin', ''),
                "github": master_profile.get('github', ''),
                "portfolio": master_profile.get('portfolio', '')
            },
            "summary": master_profile.get('summary', ''),
            "skills": categorized_skills,
            "experiences": experiences,
            "projects": projects,
            "education": master_profile.get('education', []),
            "certifications": master_profile.get('certifications', []),
            "achievements": master_profile.get('achievements', [])
        }
