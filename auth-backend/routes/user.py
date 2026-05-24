from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_current_user
from bson import ObjectId

from extensions import mongo
from auth import verify_password
from models.user import (
    update_user_password,
    serialize_user,
    now_utc,
)

user_bp = Blueprint("user", __name__)


@user_bp.get("/profile")
@jwt_required()
def get_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": serialize_user(user)}), 200


@user_bp.patch("/profile")
@jwt_required()
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    data    = request.get_json(silent=True) or {}
    updates = {}

    if "name" in data:
        name = data["name"].strip()
        if not name:
            return jsonify({"error": "Name cannot be empty."}), 422
        updates["name"] = name

    if not updates:
        return jsonify({"error": "Nothing to update."}), 422

    updates["updated_at"] = now_utc()
    mongo.db.users.update_one({"_id": user["_id"]}, {"$set": updates})

    updated_user = mongo.db.users.find_one({"_id": user["_id"]})
    return jsonify({
        "message": "Profile updated.",
        "user":    serialize_user(updated_user),
    }), 200


@user_bp.post("/change-password")
@jwt_required()
def change_password():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    data    = request.get_json(silent=True) or {}
    current = data.get("current_password",    "")
    new_pw  = data.get("new_password",         "")
    confirm = data.get("confirm_new_password", "")

    if not current:
        return jsonify({"error": "Current password is required."}), 422
    if len(new_pw) < 8:
        return jsonify({"error": "New password must be at least 8 characters."}), 422
    if new_pw != confirm:
        return jsonify({"error": "New passwords do not match."}), 422
    if not verify_password(current, user["password"]):
        return jsonify({"error": "Current password is incorrect."}), 401
    if current == new_pw:
        return jsonify({"error": "New password must differ from the current one."}), 422

    update_user_password(str(user["_id"]), new_pw)
    return jsonify({"message": "Password changed successfully."}), 200


@user_bp.delete("/account")
@jwt_required()
def delete_account():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    mongo.db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_active": False, "updated_at": now_utc()}}
    )
    return jsonify({"message": "Account deactivated."}), 200