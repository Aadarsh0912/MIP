import ssl
import certifi
from flask import Flask, request, Response
from flask_cors import CORS
from config import Config
from extensions import mongo, jwt
from routes.auth import auth_bp
from routes.user import user_bp
from pymongo import MongoClient


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── CORS — manual headers guarantee coverage on ALL responses ─────────────
    @app.after_request
    def add_cors(response):
        origin = request.headers.get("Origin", "")
        allowed = app.config.get("CORS_ORIGINS", [])
        if origin in allowed:
            response.headers["Access-Control-Allow-Origin"]      = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"]     = "Content-Type, Authorization"
            response.headers["Access-Control-Allow-Methods"]     = "GET, POST, PUT, DELETE, OPTIONS"
        return response

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            origin = request.headers.get("Origin", "")
            allowed = app.config.get("CORS_ORIGINS", [])
            res = Response()
            if origin in allowed:
                res.headers["Access-Control-Allow-Origin"]      = origin
                res.headers["Access-Control-Allow-Credentials"] = "true"
                res.headers["Access-Control-Allow-Headers"]     = "Content-Type, Authorization"
                res.headers["Access-Control-Allow-Methods"]     = "GET, POST, PUT, DELETE, OPTIONS"
            return res, 204

    # ── MongoDB with SSL fix ──────────────────────────────────────────────────
    ca = certifi.where()
    client = MongoClient(
        app.config["MONGO_URI"],
        tlsCAFile=ca,
    )
    app.config["MONGO_CLIENT"] = client

    mongo.init_app(app)
    try:
        db_name = app.config["MONGO_URI"].split("/")[-1].split("?")[0] or "prompt_mastery"
        mongo.db = client[db_name]
        mongo.cx = client
    except Exception:
        pass

    # ── JWT ───────────────────────────────────────────────────────────────────
    jwt.init_app(app)

    from bson import ObjectId

    @jwt.user_identity_loader
    def user_identity(user_id):
        return str(user_id)

    @jwt.user_lookup_loader
    def user_lookup(_jwt_header, jwt_data):
        user_id = jwt_data["sub"]
        return mongo.db.users.find_one({"_id": ObjectId(user_id)})

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(_jwt_header, jwt_data):
        jti = jwt_data["jti"]
        return mongo.db.revoked_tokens.find_one({"jti": jti}) is not None

    # ── Blueprints ────────────────────────────────────────────────────────────
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/user")

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/")
    def health():
        return {"status": "ok", "message": "Prompt Mastery API is running"}, 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)