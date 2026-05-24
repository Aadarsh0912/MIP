import re

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def validate_signup_payload(data: dict) -> str | None:
    """Return an error string, or None if the payload is valid."""
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip()
    password = data.get("password", "")

    if not name:
        return "Name is required."
    if len(name) < 2:
        return "Name must be at least 2 characters."
    if len(name) > 80:
        return "Name must be under 80 characters."

    if not email:
        return "Email is required."
    if not EMAIL_RE.match(email):
        return "Please enter a valid email address."

    if not password:
        return "Password is required."
    if len(password) < 8:
        return "Password must be at least 8 characters."
    if len(password) > 128:
        return "Password must be under 128 characters."
    if not re.search(r"[A-Za-z]", password):
        return "Password must contain at least one letter."
    if not re.search(r"\d", password):
        return "Password must contain at least one number."

    return None


def validate_login_payload(data: dict) -> str | None:
    """Return an error string, or None if the payload is valid."""
    email    = (data.get("email") or "").strip()
    password = data.get("password", "")

    if not email:
        return "Email is required."
    if not EMAIL_RE.match(email):
        return "Please enter a valid email address."
    if not password:
        return "Password is required."

    return None
