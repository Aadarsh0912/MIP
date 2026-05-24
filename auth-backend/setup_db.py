"""
Run this ONCE before starting the server:
    python setup_db.py

Creates all necessary MongoDB indexes including the TTL index that
auto-expires revoked tokens so the revoked_tokens collection never grows unbounded.
"""

from app import create_app
from extensions import mongo


def setup_indexes():
    app = create_app()
    with app.app_context():
        db = mongo.db

        # ── users ─────────────────────────────────────────────────────────────
        db.users.create_index("email", unique=True, name="email_unique")
        print("✓  users.email        — unique index")

        # ── revoked_tokens ────────────────────────────────────────────────────
        # TTL index: MongoDB auto-deletes documents when expires_at is reached.
        db.revoked_tokens.create_index(
            "expires_at",
            expireAfterSeconds=0,
            name="revoked_token_ttl",
        )
        db.revoked_tokens.create_index("jti", unique=True, name="jti_unique")
        print("✓  revoked_tokens.expires_at — TTL index (auto-cleanup)")
        print("✓  revoked_tokens.jti        — unique index")

        # ── password_resets ───────────────────────────────────────────────────
        db.password_resets.create_index(
            "expires_at",
            expireAfterSeconds=0,
            name="reset_token_ttl",
        )
        db.password_resets.create_index("token",   name="token_lookup")
        db.password_resets.create_index("user_id", name="user_id_lookup")
        print("✓  password_resets.expires_at — TTL index (auto-cleanup)")
        print("✓  password_resets.token      — index")

        print("\n✅  All indexes created. You're ready to run the server.")


if __name__ == "__main__":
    setup_indexes()
