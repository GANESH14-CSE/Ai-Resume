import re
from typing import Dict, List, Tuple, Any

COMMON_ALIASES = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'react.js': 'react',
    'reactjs': 'react',
    'vue.js': 'vue',
    'vuejs': 'vue',
    'node.js': 'node',
    'nodejs': 'node',
    'postgres': 'postgresql',
    'pgsql': 'postgresql',
    'mongo': 'mongodb',
    'drf': 'django rest framework',
    'k8s': 'kubernetes',
    'gcp': 'google cloud platform',
    'aws': 'amazon web services',
    'rest': 'rest api',
    'restful': 'rest api',
    'restful api': 'rest api',
    'rest apis': 'rest api',
    'ci/cd': 'cicd',
    'tailwind': 'tailwindcss',
}

def normalize_skill(name: str) -> str:
    """Normalize skill name for robust matching."""
    if not name:
        return ""
    clean = name.strip().lower()
    clean = re.sub(r'[\(\)\[\]\{\}]', '', clean)
    clean = re.sub(r'\s+', ' ', clean)
    return COMMON_ALIASES.get(clean, clean)

class MatchingEngine:
    """
    Deterministic matching engine for comparing Master Profile facts
    with Job Description requirements and computing an honest ATS score.
    """

    @classmethod
    def match_skills(
        cls,
        candidate_skills: List[Dict[str, Any]],
        jd_required_skills: List[str],
        jd_nice_to_have_skills: List[str] = None
    ) -> Tuple[List[str], List[str], float]:
        """
        Compares candidate skills with JD skills.
        Returns: (matched_skills, missing_skills, match_ratio)
        """
        all_jd_skills = list(jd_required_skills or [])
        if jd_nice_to_have_skills:
            all_jd_skills.extend(jd_nice_to_have_skills)

        # De-duplicate while preserving order
        unique_jd_skills = []
        seen = set()
        for s in all_jd_skills:
            s_clean = s.strip()
            if s_clean and s_clean.lower() not in seen:
                seen.add(s_clean.lower())
                unique_jd_skills.append(s_clean)

        if not unique_jd_skills:
            return [], [], 1.0

        # Build candidate skill lookup
        cand_map = {}
        for cs in candidate_skills:
            name = cs.get('name', '') if isinstance(cs, dict) else str(cs)
            norm = normalize_skill(name)
            cand_map[norm] = name
            # Also register aliases
            aliases = cs.get('aliases', []) if isinstance(cs, dict) else []
            for alias in aliases:
                cand_map[normalize_skill(alias)] = name

        matched = []
        missing = []

        for req in unique_jd_skills:
            norm_req = normalize_skill(req)
            if norm_req in cand_map:
                matched.append(cand_map[norm_req])
            elif any(norm_req in cand_norm or cand_norm in norm_req for cand_norm in cand_map):
                # Substring/partial match (e.g. "Django" in "Django REST Framework")
                match_val = next(cand_map[cand_norm] for cand_norm in cand_map if norm_req in cand_norm or cand_norm in norm_req)
                matched.append(match_val)
            else:
                missing.append(req)

        # Remove duplicates from matched
        final_matched = []
        for m in matched:
            if m not in final_matched:
                final_matched.append(m)

        ratio = len(final_matched) / len(unique_jd_skills) if unique_jd_skills else 1.0
        return final_matched, missing, round(ratio, 4)

    @classmethod
    def calculate_ats_score(
        cls,
        candidate_profile: Dict[str, Any],
        job_analysis: Dict[str, Any],
        matched_skills: List[str],
        missing_skills: List[str]
    ) -> Dict[str, Any]:
        """
        Calculates a realistic, truthful ATS compatibility score (0-100).
        Evaluates:
        1. Required & Core Skill Coverage (45 pts)
        2. Technical Keyword Density (25 pts)
        3. Experience & Role Relevance (20 pts)
        4. ATS Resume Structure & Single-Column Compliance (10 pts)
        """
        total_skills_count = len(matched_skills) + len(missing_skills)
        skill_coverage_ratio = (len(matched_skills) / total_skills_count) if total_skills_count > 0 else 0.8
        skill_score = round(skill_coverage_ratio * 45, 1)

        # Keyword coverage
        keywords = job_analysis.get('keywords', [])
        profile_text = (
            (candidate_profile.get('summary') or '') + ' ' +
            ' '.join([s.get('name', '') for s in candidate_profile.get('skills', [])]) + ' ' +
            ' '.join([' '.join(e.get('description_points', [])) for e in candidate_profile.get('experiences', [])]) + ' ' +
            ' '.join([' '.join(p.get('description_points', [])) for p in candidate_profile.get('projects', [])])
        ).lower()

        matched_keywords = []
        for kw in keywords:
            if kw.strip().lower() in profile_text:
                matched_keywords.append(kw.strip())

        kw_ratio = (len(matched_keywords) / len(keywords)) if keywords else 0.85
        keyword_score = round(kw_ratio * 25, 1)

        # Role & Experience relevance
        target_role = (job_analysis.get('job_title') or '').lower()
        cand_title = (candidate_profile.get('title') or '').lower()
        role_alignment = 0.7
        if target_role and cand_title:
            target_words = set(re.findall(r'\w+', target_role))
            cand_words = set(re.findall(r'\w+', cand_title))
            common = target_words.intersection(cand_words)
            if common:
                role_alignment = min(1.0, 0.7 + (len(common) / len(target_words)) * 0.3)

        has_experience = len(candidate_profile.get('experiences', [])) > 0
        has_projects = len(candidate_profile.get('projects', [])) > 0
        exp_weight = 1.0 if (has_experience and has_projects) else (0.8 if has_experience or has_projects else 0.5)
        experience_score = round(role_alignment * exp_weight * 20, 1)

        # Structure & ATS formatting
        structure_score = 10.0  # System automatically enforces clean single-column ATS layout

        total_score = round(skill_score + keyword_score + experience_score + structure_score, 1)
        total_score = max(20.0, min(99.0, total_score))

        # Recommendations
        recommendations = []
        if missing_skills:
            recommendations.append(
                f"Missing {len(missing_skills)} target JD skills: {', '.join(missing_skills[:4])}. Gaining verifiable experience in these would boost ATS score."
            )
        if kw_ratio < 0.7:
            recommendations.append(
                "Incorporate more domain-specific terminology from the job description into your project descriptions where truthful."
            )
        if not candidate_profile.get('summary'):
            recommendations.append("Adding a targeted professional summary strengthens ATS keyword scanning.")

        return {
            "overall_score": total_score,
            "skill_score": skill_score,
            "skill_max": 45,
            "keyword_score": keyword_score,
            "keyword_max": 25,
            "experience_score": experience_score,
            "experience_max": 20,
            "structure_score": structure_score,
            "structure_max": 10,
            "matched_keywords_count": len(matched_keywords),
            "total_keywords_count": len(keywords),
            "recommendations": recommendations,
            "disclaimer": "Estimated ATS Compatibility based on keyword, skill, and structural metrics. Actual ATS parsers vary between systems."
        }
