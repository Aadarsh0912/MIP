from datetime import datetime, timezone
from bson import ObjectId
from extensions import mongo
from auth import hash_password


# ── Helpers ────────────────────────────────────────────────────────────────────

def now_utc():
    return datetime.now(timezone.utc)


def serialize_user(user: dict) -> dict:
    """Return a safe public representation (no password hash)."""
    return {
        "id":         str(user["_id"]),
        "name":       user.get("name", ""),
        "email":      user["email"],
        "created_at": user.get("created_at", "").isoformat()
                      if isinstance(user.get("created_at"), datetime) else "",
    }


# ── CRUD ───────────────────────────────────────────────────────────────────────

def create_user(name: str, email: str, password: str) -> dict:
    """Insert a new user document and return it."""
    doc = {
        "name":         name.strip(),
        "email":        email.lower().strip(),
        "password":     hash_password(password),
        "created_at":   now_utc(),
        "updated_at":   now_utc(),
        "is_active":    True,
        "xp":           0,
        "level":        1,
        "streak":       0,
        "completed":    [],
        "stageStars":   {},
    }
    result = mongo.db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def find_user_by_email(email: str) -> dict | None:
    return mongo.db.users.find_one({"email": email.lower().strip()})


def find_user_by_id(user_id: str) -> dict | None:
    try:
        return mongo.db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def update_user_password(user_id: str, new_password: str) -> bool:
    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "password":   hash_password(new_password),
            "updated_at": now_utc(),
        }}
    )
    return result.modified_count > 0


def email_exists(email: str) -> bool:
    return mongo.db.users.find_one(
        {"email": email.lower().strip()},
        {"_id": 1}
    ) is not None