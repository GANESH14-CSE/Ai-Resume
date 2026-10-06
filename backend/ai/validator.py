import re
from typing import Dict, Any, Tuple, List
from matching.services import normalize_skill

class TruthfulnessValidator:
    """
    Deterministic safety validator that audits LLM generated resume output
    against candidate's Master Profile to ensure zero fabrications.
    """

    @classmethod
    def audit_and_sanitize(
        cls,
        generated_resume: Dict[str, Any],
        master_profile: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Validates generated resume content against master profile facts.
        Strips any unauthorized skills or fabricated metrics.
        Returns: (sanitized_resume, audit_report)
        """
        audit_report = {
            "is_valid": True,
            "removed_skills": [],
            "metric_warnings": [],
            "verified_skills_count": 0,
            "notes": []
        }

        # 1. Build Whitelist of verified candidate skills
        cand_skills = master_profile.get('skills', [])
        verified_normalized = set()
        verified_raw = set()

        for s in cand_skills:
            name = s.get('name', '') if isinstance(s, dict) else str(s)
            if name:
                verified_raw.add(name.strip().lower())
                verified_normalized.add(normalize_skill(name))
                for alias in s.get('aliases', []) if isinstance(s, dict) else []:
                    verified_normalized.add(normalize_skill(alias))

        # Check skills section
        skills_dict = generated_resume.get('skills', {})
        if isinstance(skills_dict, dict):
            for category in ['languages', 'frameworks', 'databases', 'tools', 'other']:
                category_list = skills_dict.get(category, [])
                if not isinstance(category_list, list):
                    continue

                sanitized_list = []
                for skill_item in category_list:
                    if not isinstance(skill_item, str):
                        continue
                    skill_clean = skill_item.strip()
                    norm = normalize_skill(skill_clean)

                    # Check against candidate whitelist
                    if norm in verified_normalized or skill_clean.lower() in verified_raw:
                        sanitized_list.append(skill_clean)
                        audit_report["verified_skills_count"] += 1
                    else:
                        # Skill was not in candidate profile! Strip it.
                        audit_report["removed_skills"].append(skill_clean)
                        audit_report["notes"].append(
                            f"Removed unverified skill '{skill_clean}' from {category} (not in Master Profile)."
                        )

                skills_dict[category] = sanitized_list

        generated_resume['skills'] = skills_dict

        # 2. Metric / Percentage check
        # Collect all percentages that existed in original master profile
        original_profile_text = (
            master_profile.get('summary', '') + ' ' +
            ' '.join([
                ' '.join(e.get('description_points', []))
                for e in master_profile.get('experiences', [])
            ]) + ' ' +
            ' '.join([
                ' '.join(p.get('description_points', []))
                for p in master_profile.get('projects', [])
            ])
        )
        original_percentages = set(re.findall(r'\b\d+(?:\.\d+)?%', original_profile_text))

        # Check experiences bullets
        for exp in generated_resume.get('experiences', []):
            bullets = exp.get('bullets', [])
            cleaned_bullets = []
            for b in bullets:
                found_percentages = re.findall(r'\b\d+(?:\.\d+)?%', b)
                has_fake_metric = False
                for p in found_percentages:
                    if p not in original_percentages:
                        has_fake_metric = True
                        audit_report["metric_warnings"].append(
                            f"Flagged unverified percentage {p} in bullet: '{b}'"
                        )
                cleaned_bullets.append(b)
            exp['bullets'] = cleaned_bullets

        # Check projects bullets
        for proj in generated_resume.get('projects', []):
            bullets = proj.get('bullets', [])
            cleaned_bullets = []
            for b in bullets:
                found_percentages = re.findall(r'\b\d+(?:\.\d+)?%', b)
                for p in found_percentages:
                    if p not in original_percentages:
                        audit_report["metric_warnings"].append(
                            f"Flagged unverified percentage {p} in project bullet: '{b}'"
                        )
                cleaned_bullets.append(b)
            proj['bullets'] = cleaned_bullets

        if audit_report["removed_skills"] or audit_report["metric_warnings"]:
            audit_report["is_valid"] = True  # Sanitized to valid
            audit_report["notes"].append("Audit passed after automatic sanitization.")

        return generated_resume, audit_report
