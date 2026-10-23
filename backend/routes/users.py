"""User-profile routes — update role/domain, fetch option lists."""

from flask import Blueprint, request, jsonify, current_app, g

from middleware.auth import jwt_required
from models.user import UserModel

users_bp = Blueprint("users", __name__)

# ── Reference data ────────────────────────────────────────────────────────────

VALID_ROLES = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Scientist",
    "Data Analyst",
    "ML Engineer",
    "DevOps Engineer",
    "Product Manager",
    "Business Analyst",
    "QA Engineer",
    "System Administrator",
]

VALID_DOMAINS = [
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "Data Structures & Algorithms",
    "Machine Learning",
    "Data Science",
    "Database Management",
    "Cloud Computing",
    "DevOps & CI/CD",
    "System Design",
    "General HR",
]

# Domains that support coding-task questions
CODING_DOMAINS = [
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "Data Structures & Algorithms",
    "Machine Learning",
    "Data Science",
    "Database Management",
]


# ── Routes ────────────────────────────────────────────────────────────────────

@users_bp.route("/me/profile", methods=["PUT"])
@jwt_required
def update_profile():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    allowed = {"role", "domain"}
    update_data = {k: v for k, v in data.items() if k in allowed and v}

    if not update_data:
        return jsonify({"error": "At least one of role or domain is required"}), 400

    if "role" in update_data and update_data["role"] not in VALID_ROLES:
        return (
            jsonify(
                {"error": f"Invalid role. Choose from: {', '.join(VALID_ROLES)}"}
            ),
            400,
        )

    if "domain" in update_data and update_data["domain"] not in VALID_DOMAINS:
        return (
            jsonify(
                {"error": f"Invalid domain. Choose from: {', '.join(VALID_DOMAINS)}"}
            ),
            400,
        )

    update_data["has_completed_onboarding"] = True

    user_model = UserModel(current_app.db)
    user_model.update_profile(g.user_id, update_data)

    updated = user_model.find_by_id(g.user_id)
    return jsonify({"user": user_model.to_dict(updated)}), 200


@users_bp.route("/me/options", methods=["GET"])
@jwt_required
def get_options():
    """Return the lists of valid roles, domains, and which domains support coding tasks."""
    return jsonify(
        {
            "roles": VALID_ROLES,
            "domains": VALID_DOMAINS,
            "coding_domains": CODING_DOMAINS,
        }
    ), 200
