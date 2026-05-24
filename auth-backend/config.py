import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Flask ──────────────────────────────────────────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
    DEBUG      = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # ── MongoDB ────────────────────────────────────────────────────────────────
    MONGO_URI  = os.getenv("MONGO_URI", "mongodb://localhost:27017/prompt_mastery")

    # ── JWT ────────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY               = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES     = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES",  "30")))
    JWT_REFRESH_TOKEN_EXPIRES    = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS",       "30")))
    JWT_TOKEN_LOCATION           = ["headers"]
    JWT_HEADER_NAME              = "Authorization"
    JWT_HEADER_TYPE              = "Bearer"
    JWT_BLACKLIST_ENABLED        = True
    JWT_BLACKLIST_TOKEN_CHECKS   = ["access", "refresh"]

    # ── CORS ───────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins in .env:
    #   CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # ── Password reset ─────────────────────────────────────────────────────────
    # How long a password-reset token stays valid (minutes)
    RESET_TOKEN_EXPIRES_MINUTES  = int(os.getenv("RESET_TOKEN_MINUTES", "15"))

    # ── Email (for password-reset emails) ─────────────────────────────────────
    MAIL_SERVER   = os.getenv("MAIL_SERVER",   "smtp.gmail.com")
    MAIL_PORT     = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS  = True
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")   # your Gmail address
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")   # Gmail app password
    MAIL_SENDER   = os.getenv("MAIL_SENDER",   "noreply@promptmastery.app")
