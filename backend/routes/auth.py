"""Authentication routes — signup, login, logout, token refresh, current user."""

import re
from datetime import datetime, timezone, timedelta

import jwt
from flask import Blueprint, request, jsonify, current_app, make_response

from config import Config
from models.user import UserModel

auth_bp = Blueprint("auth", __name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _generate_tokens(user_id):
    """Create an access token (short-lived) and a refresh token (long-lived)."""
    access_token = jwt.encode(
        {
            "user_id": str(user_id),
            "exp": datetime.now(timezone.utc)
            + timedelta(seconds=Config.JWT_ACCESS_EXPIRY),
        },
        Config.JWT_SECRET,
        algorithm="HS256",
    )
    refresh_token = jwt.encode(
        {
            "user_id": str(user_id),
            "type": "refresh",
            "exp": datetime.now(timezone.utc)
            + timedelta(seconds=Config.JWT_REFRESH_EXPIRY),
        },
        Config.JWT_SECRET,
        algorithm="HS256",
    )
    return access_token, refresh_token


def _validate_email(email):
    return re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email)


def _validate_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit"
    return True, ""


def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=False,  # Set True in production (requires HTTPS)
        samesite="Lax",
        max_age=Config.JWT_REFRESH_EXPIRY,
    )
    return response


# ── Routes ────────────────────────────────────────────────────────────────────

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    email = data.get("email", "").strip()
    password = data.get("password", "")
    name = data.get("name", "").strip()

    if not email or not password or not name:
        return jsonify({"error": "Name, email, and password are required"}), 400
    if not _validate_email(email):
        return jsonify({"error": "Please enter a valid email address"}), 400

    ok, msg = _validate_password(password)
    if not ok:
        return jsonify({"error": msg}), 400

    user_model = UserModel(current_app.db)
    if user_model.find_by_email(email):
        return jsonify({"error": "An account with this email already exists"}), 409

    user = user_model.create(email, password, name)
    access_token, refresh_token = _generate_tokens(user["_id"])

    resp = make_response(
        jsonify({"user": user_model.to_dict(user), "access_token": access_token}), 201
    )
    return _set_refresh_cookie(resp, refresh_token)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user_model = UserModel(current_app.db)
    user = user_model.find_by_email(email)

    if not user or not user_model.verify_password(user, password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token, refresh_token = _generate_tokens(user["_id"])

    resp = make_response(
        jsonify({"user": user_model.to_dict(user), "access_token": access_token}), 200
    )
    return _set_refresh_cookie(resp, refresh_token)


@auth_bp.route("/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"message": "Logged out successfully"}))
    resp.delete_cookie("refresh_token")
    return resp, 200


@auth_bp.route("/me", methods=["GET"])
def me():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authentication required"}), 401

    token = auth_header[7:]
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
        user_model = UserModel(current_app.db)
        user = user_model.find_by_id(payload["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 401
        return jsonify({"user": user_model.to_dict(user)}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        return jsonify({"error": "Refresh token required"}), 401

    try:
        payload = jwt.decode(refresh_token, Config.JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            return jsonify({"error": "Invalid token type"}), 401

        user_model = UserModel(current_app.db)
        user = user_model.find_by_id(payload["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 401

        access_token, new_refresh = _generate_tokens(user["_id"])
        resp = make_response(
            jsonify({"user": user_model.to_dict(user), "access_token": access_token}),
            200,
        )
        return _set_refresh_cookie(resp, new_refresh)
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Refresh token expired, please log in again"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid refresh token"}), 401
