"""Interview-session data-access layer — MongoDB operations for interview_sessions."""

from datetime import datetime, timezone
import uuid
from bson import ObjectId


class SessionModel:
    def __init__(self, db):
        self.collection = db.interview_sessions

    # ── Create ────────────────────────────────────────────────────────
    def create(self, user_id, role, domain, interview_type, questions):
        session = {
            "session_id": str(uuid.uuid4()),
            "user_id": ObjectId(user_id),
            "role": role,
            "domain": domain,
            "interview_type": interview_type,
            "questions": questions,
            "responses": [],
            "status": "in_progress",
            "created_at": datetime.now(timezone.utc),
            "ended_at": None,
        }
        self.collection.insert_one(session)
        return session

    # ── Read ──────────────────────────────────────────────────────────
    def find_by_session_id(self, session_id, user_id):
        return self.collection.find_one(
            {"session_id": session_id, "user_id": ObjectId(user_id)}
        )

    def find_by_user(self, user_id):
        return list(
            self.collection.find(
                {"user_id": ObjectId(user_id)},
                {"questions": 0},  # Exclude full questions from list view
            ).sort("created_at", -1)
        )

    # ── Update ────────────────────────────────────────────────────────
    def add_response(self, session_id, user_id, response):
        response["submitted_at"] = datetime.now(timezone.utc)
        return self.collection.update_one(
            {"session_id": session_id, "user_id": ObjectId(user_id)},
            {"$push": {"responses": response}},
        )

    def complete(self, session_id, user_id):
        return self.collection.update_one(
            {"session_id": session_id, "user_id": ObjectId(user_id)},
            {"$set": {"status": "completed", "ended_at": datetime.now(timezone.utc)}},
        )

    def abandon(self, session_id, user_id):
        return self.collection.update_one(
            {"session_id": session_id, "user_id": ObjectId(user_id)},
            {"$set": {"status": "abandoned", "ended_at": datetime.now(timezone.utc)}},
        )

    def save_evaluation(self, session_id, user_id, evaluation_data):
        evaluation_data["evaluated_at"] = datetime.now(timezone.utc)
        return self.collection.update_one(
            {"session_id": session_id, "user_id": ObjectId(user_id)},
            {"$set": {"evaluation": evaluation_data}},
        )

    def find_evaluations_by_user(self, user_id):
        return list(
            self.collection.find(
                {"user_id": ObjectId(user_id), "evaluation": {"$exists": True}},
                {"questions": 0},
            ).sort("created_at", -1)
        )

    # ── Serialise ─────────────────────────────────────────────────────
    @staticmethod
    def to_dict(session):
        result = {
            "session_id": session["session_id"],
            "user_id": str(session["user_id"]),
            "role": session["role"],
            "domain": session["domain"],
            "interview_type": session["interview_type"],
            "status": session["status"],
            "created_at": (
                session["created_at"].isoformat()
                if session.get("created_at")
                else None
            ),
            "ended_at": (
                session["ended_at"].isoformat() if session.get("ended_at") else None
            ),
        }
        if "questions" in session:
            result["questions"] = session["questions"]
        if "responses" in session:
            result["responses"] = [
                {
                    **r,
                    "submitted_at": (
                        r["submitted_at"].isoformat()
                        if r.get("submitted_at")
                        else None
                    ),
                }
                for r in session.get("responses", [])
            ]
        if "evaluation" in session and session["evaluation"]:
            ev = dict(session["evaluation"])
            if "evaluated_at" in ev and ev["evaluated_at"]:
                ev["evaluated_at"] = ev["evaluated_at"].isoformat()
            result["evaluation"] = ev
        return result
