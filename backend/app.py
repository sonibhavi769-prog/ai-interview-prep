"""Flask application factory."""

from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS — allow the Vite dev server origin, with credentials for refresh cookies
    CORS(
        app,
        origins=[Config.FRONTEND_URL],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # MongoDB connection
    client = MongoClient(Config.MONGO_URI)
    app.db = client[Config.DB_NAME]

    # Ensure indexes
    app.db.users.create_index("email", unique=True)
    app.db.interview_sessions.create_index("session_id", unique=True)
    app.db.interview_sessions.create_index("user_id")

    from routes.auth import auth_bp
    from routes.users import users_bp
    from routes.interviews import interviews_bp
    from routes.progress import progress_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(interviews_bp, url_prefix="/api/interviews")
    app.register_blueprint(progress_bp, url_prefix="/api/progress")

    return app
