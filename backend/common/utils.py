import hashlib
import re

def compute_sha256(text: str) -> str:
    """Compute normalized SHA256 hash of a string."""
    normalized = re.sub(r'\s+', ' ', (text or '').strip()).lower()
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

def sanitize_job_description_text(text: str, max_chars: int = 15000) -> tuple[str, bool]:
    """
    Sanitize untrusted JD input:
    - Strip control characters
    - Normalize whitespace
    - Check length limit and truncate if exceeded.
    Returns: (cleaned_text, was_truncated)
    """
    if not text:
        return "", False

    # Remove non-printable control characters except newline and tab
    cleaned = re.sub(r'[^\x20-\x7E\t\n\r]', ' ', text)
    cleaned = cleaned.strip()

    was_truncated = len(cleaned) > max_chars
    if was_truncated:
        cleaned = cleaned[:max_chars]

    return cleaned, was_truncated
