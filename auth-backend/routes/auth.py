import secrets
from datetime import datetime, timezone, timedelta

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt,
    get_jwt_identity,
    get_current_user,
)

from extensions import mongo
from auth import verify_password
from models.user import (
    create_user,
    find_user_by_email,
    find_user_by_id,
    update_user_password,
    email_exists,
    serialize_user,
    now_utc,
)
from utils.validators import validate_signup_payload, validate_login_payload
from utils.email import send_reset_email

auth_bp = Blueprint("auth", __name__)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/signup
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.post("/signup")
def signup():
    data = request.get_json(silent=True) or {}

    errors = validate_signup_payload(data)
    if errors:
        return jsonify({"error": errors}), 422

    if email_exists(data["email"]):
        return jsonify({"error": "An account with that email already exists."}), 409

    user = create_user(
        name=data.get("name", ""),
        email=data["email"],
        password=data["password"],
    )

    access_token  = create_access_token(identity=str(user["_id"]))
    refresh_token = create_refresh_token(identity=str(user["_id"]))

    return jsonify({
        "message":       "Account created successfully.",
        "user":          serialize_user(user),
        "access_token":  access_token,
        "refresh_token": refresh_token,
    }), 201


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}

    errors = validate_login_payload(data)
    if errors:
        return jsonify({"error": errors}), 422

    user = find_user_by_email(data["email"])

    if not user or not verify_password(data["password"], user["password"]):
        return jsonify({"error": "Invalid email or password."}), 401

    if not user.get("is_active", True):
        return jsonify({"error": "This account has been deactivated."}), 403

    access_token  = create_access_token(identity=str(user["_id"]))
    refresh_token = create_refresh_token(identity=str(user["_id"]))

    return jsonify({
        "message":       "Signed in successfully.",
        "user":          serialize_user(user),
        "access_token":  access_token,
        "refresh_token": refresh_token,
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/refresh
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id      = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token}), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/logout
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.post("/logout")
@jwt_required(verify_type=False)
def logout():
    token = get_jwt()
    mongo.db.revoked_tokens.insert_one({
        "jti":        token["jti"],
        "type":       token["type"],
        "revoked_at": now_utc(),
        "expires_at": datetime.fromtimestamp(token["exp"], tz=timezone.utc),
    })
    return jsonify({"message": "Logged out successfully."}), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/forgot-password
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.post("/forgot-password")
def forgot_password():
    data  = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required."}), 422

    user = find_user_by_email(email)

    if user:
        token      = secrets.token_urlsafe(36)
        expires_at = now_utc() + timedelta(
            minutes=current_app.config["RESET_TOKEN_EXPIRES_MINUTES"]
        )

        mongo.db.password_resets.update_one(
            {"user_id": str(user["_id"])},
            {"$set": {
                "token":      token,
                "expires_at": expires_at,
                "used":       False,
            }},
            upsert=True,
        )

        send_reset_email(
            to_email=email,
            name=user.get("name", "there"),
            token=token,
        )

    return jsonify({
        "message": "If that email is registered, a reset link has been sent."
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/reset-password
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.post("/reset-password")
def reset_password():
    data             = request.get_json(silent=True) or {}
    token            = (data.get("token") or "").strip()
    password         = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not token:
        return jsonify({"error": "Reset token is required."}), 422
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 422
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 422

    record = mongo.db.password_resets.find_one({"token": token, "used": False})

    if not record:
        return jsonify({"error": "Invalid or expired reset token."}), 400

    if record["expires_at"].replace(tzinfo=timezone.utc) < now_utc():
        return jsonify({"error": "This reset link has expired. Please request a new one."}), 400

    updated = update_user_password(record["user_id"], password)
    if not updated:
        return jsonify({"error": "User not found."}), 404

    mongo.db.password_resets.update_one(
        {"_id": record["_id"]},
        {"$set": {"used": True}}
    )

    mongo.db.users.update_one(
        {"_id": record["user_id"]},
        {"$set": {"pw_changed_at": now_utc()}}
    )

    return jsonify({"message": "Password reset successfully. You can now sign in."}), 200


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/auth/me
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.get("/me")
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": serialize_user(user)}), 200