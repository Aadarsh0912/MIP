import logging

# pyrefly: ignore [missing-import]
import certifi
# pyrefly: ignore [missing-import]
from bson import ObjectId
# pyrefly: ignore [missing-import]
from flask import Flask, request, Response
# pyrefly: ignore [missing-import]
from pymongo import MongoClient
# pyrefly: ignore [missing-import]
from pymongo.errors import ConnectionFailure

from config import Config
from extensions import mongo, jwt
from routes.auth import auth_bp
from routes.user import user_bp

logger = logging.getLogger(__name__)


def create_app(config_object: object = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)

    _register_cors(app)
    _init_mongo(app)
    _init_jwt(app)
    _register_blueprints(app)
    _register_health(app)

    return app


# ── CORS ──────────────────────────────────────────────────────────────────────

def _cors_headers(response: Response, origin: str) -> Response:
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


def _register_cors(app: Flask) -> None:
    allowed: list = app.config.get("CORS_ORIGINS") or []

    # Normalise — strip trailing slashes so comparisons are reliable
    allowed = [o.rstrip("/") for o in allowed]

    if not allowed:
        logger.warning("CORS_ORIGINS is empty — all cross-origin requests will be blocked.")

    @app.before_request
    def handle_preflight():
        if request.method != "OPTIONS":
            return None  # let the request continue normally

        origin = request.headers.get("Origin", "").rstrip("/")
        res = Response()
        res.status_code = 204  # ← fix: set on object, not as tuple

        if origin in allowed:
            _cors_headers(res, origin)

        return res

    @app.after_request
    def add_cors(response: Response) -> Response:
        origin = request.headers.get("Origin", "").rstrip("/")
        if origin in allowed:
            _cors_headers(response, origin)
        return response


# ── MongoDB ───────────────────────────────────────────────────────────────────

def _init_mongo(app: Flask) -> None:
    ca = certifi.where()

    try:
        client = MongoClient(
            app.config["MONGO_URI"],
            serverSelectionTimeoutMS=5_000,  # fail fast instead of hanging
        )
        # Eagerly verify the connection so misconfiguration surfaces at startup
        client.admin.command("ping")
        logger.info("MongoDB connection established.")
    except ConnectionFailure as exc:
        logger.error("Could not connect to MongoDB: %s", exc)
        raise

    app.config["MONGO_CLIENT"] = client

    mongo.init_app(app)

    try:
        db_name = (
            app.config["MONGO_URI"].split("/")[-1].split("?")[0]
            or "prompt_mastery"
        )
        mongo.db = client[db_name]
        mongo.cx = client
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not assign mongo.db / mongo.cx: %s", exc)


# ── JWT ───────────────────────────────────────────────────────────────────────

def _init_jwt(app: Flask) -> None:
    jwt.init_app(app)

    @jwt.user_identity_loader
    def user_identity(user_id) -> str:
        return str(user_id)

    @jwt.user_lookup_loader
    def user_lookup(_jwt_header, jwt_data):
        user_id = jwt_data.get("sub")
        if not user_id:
            return None
        try:
            return mongo.db.users.find_one({"_id": ObjectId(user_id)})
        except Exception as exc:  # noqa: BLE001
            logger.warning("user_lookup failed for sub=%s: %s", user_id, exc)
            return None

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(_jwt_header, jwt_data) -> bool:
        jti = jwt_data.get("jti")
        if not jti:
            return False
        return mongo.db.revoked_tokens.find_one({"jti": jti}) is not None


# ── Blueprints ────────────────────────────────────────────────────────────────

def _register_blueprints(app: Flask) -> None:
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/user")


# ── Health check ──────────────────────────────────────────────────────────────

def _register_health(app: Flask) -> None:
    @app.get("/")
    def health():
        return {"status": "ok", "message": "Prompt Mastery API is running"}, 200


# ── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    application = create_app()
    application.run(debug=True, host="0.0.0.0", port=5001)