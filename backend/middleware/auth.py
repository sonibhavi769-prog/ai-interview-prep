"""JWT authentication decorator for protected routes."""

import jwt
from functools import wraps
from flask import request, jsonify, current_app, g
from bson import ObjectId
from config import Config


def jwt_required(f):
    """Decorator that verifies the JWT access token from the Authorization header
    and populates g.user / g.user_id for the wrapped route handler."""

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

        if not token:
            return jsonify({"error": "Authentication required"}), 401

        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
            user = current_app.db.users.find_one({"_id": ObjectId(payload["user_id"])})
            if not user:
                return jsonify({"error": "User not found"}), 401
            g.user = user
            g.user_id = str(user["_id"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated
