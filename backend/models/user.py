"""User data-access layer — all MongoDB operations for the users collection."""

from datetime import datetime, timezone
import bcrypt
from bson import ObjectId


class UserModel:
    def __init__(self, db):
        self.collection = db.users

    # ── Create ────────────────────────────────────────────────────────
    def create(self, email, password, name):
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")
        user = {
            "email": email.lower().strip(),
            "password_hash": password_hash,
            "name": name.strip(),
            "role": None,
            "domain": None,
            "has_completed_onboarding": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        result = self.collection.insert_one(user)
        user["_id"] = result.inserted_id
        return user

    # ── Read ──────────────────────────────────────────────────────────
    def find_by_email(self, email):
        return self.collection.find_one({"email": email.lower().strip()})

    def find_by_id(self, user_id):
        return self.collection.find_one({"_id": ObjectId(user_id)})

    # ── Verify ────────────────────────────────────────────────────────
    def verify_password(self, user, password):
        return bcrypt.checkpw(
            password.encode("utf-8"),
            user["password_hash"].encode("utf-8"),
        )

    # ── Update ────────────────────────────────────────────────────────
    def update_profile(self, user_id, data):
        update = {"$set": {**data, "updated_at": datetime.now(timezone.utc)}}
        return self.collection.update_one({"_id": ObjectId(user_id)}, update)

    # ── Serialise ─────────────────────────────────────────────────────
    @staticmethod
    def to_dict(user):
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role"),
            "domain": user.get("domain"),
            "has_completed_onboarding": user.get("has_completed_onboarding", False),
            "created_at": (
                user["created_at"].isoformat() if user.get("created_at") else None
            ),
        }
