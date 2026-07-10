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


# ── Progress endpoints ─────────────────────────────────────────────────────────

@user_bp.get("/progress")
@jwt_required()
def get_progress():
    """Return the user's full progress state."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "progress": {
            "completed":             user.get("completed", []),
            "stageStars":            user.get("stageStars", {}),
            "streak":                user.get("streak", 0),
            "streakDays":            user.get("streakDays", [False]*7),
            "challengesDone":        user.get("challengesDone", 0),
            "completedChallengeIds": user.get("completedChallengeIds", []),
            "lastActiveDate":        user.get("lastActiveDate", ""),
        }
    }), 200


@user_bp.post("/progress")
@jwt_required()
def save_progress():
    """Save the user's full progress state."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json(silent=True) or {}

    updates = {
        "updated_at": now_utc(),
    }

    # Only update fields that are present in the request
    allowed = [
        "completed", "stageStars", "streak", "streakDays",
        "challengesDone", "completedChallengeIds", "lastActiveDate"
    ]
    for field in allowed:
        if field in data:
            updates[field] = data[field]

    mongo.db.users.update_one(
        {"_id": user["_id"]},
        {"$set": updates}
    )

    return jsonify({"message": "Progress saved."}), 200


# ── Prompt History endpoints ────────────────────────────────────────────────

@user_bp.get("/prompt-history")
@jwt_required()
def get_prompt_history():
    """Return all saved prompt-lab history entries for the current user."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    entries = list(
        mongo.db.prompt_history
        .find({"user_id": str(user["_id"])}, {"_id": 1, "prompt": 1, "response": 1, "quality": 1, "intent": 1, "ts": 1})
        .sort("ts", -1)
        .limit(100)
    )
    for e in entries:
        e["id"] = str(e.pop("_id"))

    return jsonify({"history": entries}), 200


@user_bp.post("/prompt-history")
@jwt_required()
def save_prompt_history_entry():
    """Append a new prompt-lab history entry for the current user."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    prompt   = (data.get("prompt")   or "").strip()
    response = (data.get("response") or "").strip()

    if not prompt:
        return jsonify({"error": "prompt is required."}), 422

    entry = {
        "user_id":  str(user["_id"]),
        "prompt":   prompt,
        "response": response,
        "quality":  data.get("quality"),
        "intent":   data.get("intent"),
        "ts":       data.get("ts") or now_utc().isoformat(),
    }
    result = mongo.db.prompt_history.insert_one(entry)

    # Cap per-user history at 100 entries (delete oldest beyond limit)
    count = mongo.db.prompt_history.count_documents({"user_id": str(user["_id"])})
    if count > 100:
        oldest = list(
            mongo.db.prompt_history
            .find({"user_id": str(user["_id"])}, {"_id": 1})
            .sort("ts", 1)
            .limit(count - 100)
        )
        mongo.db.prompt_history.delete_many({"_id": {"$in": [o["_id"] for o in oldest]}})

    return jsonify({"ok": True, "id": str(result.inserted_id)}), 201


@user_bp.delete("/prompt-history/<entry_id>")
@jwt_required()
def delete_prompt_history_entry(entry_id):
    """Delete a single prompt-lab history entry by id."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    try:
        oid = ObjectId(entry_id)
    except Exception:
        return jsonify({"error": "Invalid id."}), 422

    mongo.db.prompt_history.delete_one({"_id": oid, "user_id": str(user["_id"])})
    return jsonify({"ok": True}), 200


@user_bp.delete("/prompt-history")
@jwt_required()
def clear_prompt_history():
    """Delete ALL prompt-lab history entries for the current user (called on logout)."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    mongo.db.prompt_history.delete_many({"user_id": str(user["_id"])})
    return jsonify({"ok": True}), 200


# ── Saved Prompts endpoints ─────────────────────────────────────────────────

@user_bp.get("/saved-prompts")
@jwt_required()
def get_saved_prompts():
    """Return all saved prompts for the current user."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    entries = list(
        mongo.db.saved_prompts
        .find({"user_id": str(user["_id"])}, {"_id": 1, "prompt": 1, "ts": 1})
        .sort("ts", -1)
        .limit(200)
    )
    for e in entries:
        e["id"] = str(e.pop("_id"))

    return jsonify({"saved": entries}), 200


@user_bp.post("/saved-prompts")
@jwt_required()
def save_prompt_entry():
    """Save a prompt for the current user."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    data   = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "prompt is required."}), 422

    # Prevent exact duplicates
    existing = mongo.db.saved_prompts.find_one({"user_id": str(user["_id"]), "prompt": prompt})
    if existing:
        return jsonify({"ok": True, "id": str(existing["_id"]), "duplicate": True}), 200

    entry = {
        "user_id": str(user["_id"]),
        "prompt":  prompt,
        "ts":      data.get("ts") or now_utc().isoformat(),
    }
    result = mongo.db.saved_prompts.insert_one(entry)

    # Cap at 200 entries
    count = mongo.db.saved_prompts.count_documents({"user_id": str(user["_id"])})
    if count > 200:
        oldest = list(
            mongo.db.saved_prompts
            .find({"user_id": str(user["_id"])}, {"_id": 1})
            .sort("ts", 1)
            .limit(count - 200)
        )
        mongo.db.saved_prompts.delete_many({"_id": {"$in": [o["_id"] for o in oldest]}})

    return jsonify({"ok": True, "id": str(result.inserted_id)}), 201


@user_bp.delete("/saved-prompts/<entry_id>")
@jwt_required()
def delete_saved_prompt(entry_id):
    """Delete a single saved prompt by id."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    try:
        oid = ObjectId(entry_id)
    except Exception:
        return jsonify({"error": "Invalid id."}), 422

    mongo.db.saved_prompts.delete_one({"_id": oid, "user_id": str(user["_id"])})
    return jsonify({"ok": True}), 200


@user_bp.delete("/saved-prompts")
@jwt_required()
def clear_saved_prompts():
    """Delete ALL saved prompts for the current user (called on logout)."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404

    mongo.db.saved_prompts.delete_many({"user_id": str(user["_id"])})
    return jsonify({"ok": True}), 200