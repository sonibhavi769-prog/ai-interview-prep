"""Progress tracking routes — session history, score trends, and summary statistics."""

from flask import Blueprint, jsonify, current_app, g
from middleware.auth import jwt_required
from models.session import SessionModel

progress_bp = Blueprint("progress", __name__)


@progress_bp.route("/history", methods=["GET"])
@jwt_required
def get_history():
    """Retrieve session history for the authenticated user, newest first."""
    session_model = SessionModel(current_app.db)
    raw_sessions = session_model.find_by_user(g.user_id)

    history = []
    for s in raw_sessions:
        eval_data = s.get("evaluation", {})
        agg = eval_data.get("aggregate", {})

        history.append({
            "session_id": s["session_id"],
            "role": s["role"],
            "domain": s["domain"],
            "interview_type": s["interview_type"],
            "status": s["status"],
            "created_at": s["created_at"].isoformat() if s.get("created_at") else None,
            "ended_at": s["ended_at"].isoformat() if s.get("ended_at") else None,
            "overall_score": agg.get("overall_score") if agg else None,
            "communication": agg.get("communication") if agg else None,
            "confidence": agg.get("confidence") if agg else None,
            "technical_accuracy": agg.get("technical_accuracy") if agg else None,
            "total_questions": len(s.get("questions", [])),
            "answered_questions": len(s.get("responses", [])),
            "has_evaluation": bool(eval_data),
        })

    return jsonify({"history": history}), 200


@progress_bp.route("/trends", methods=["GET"])
@jwt_required
def get_trends():
    """Retrieve chronological trend points for score sparklines and charts."""
    session_model = SessionModel(current_app.db)
    # Retrieve user's sessions in chronological order
    user_sessions = session_model.find_by_user(g.user_id)
    # Filter those with evaluation and reverse to chronological (oldest to newest)
    evaluated = [
        s for s in user_sessions
        if s.get("evaluation") and s["evaluation"].get("aggregate") and s["evaluation"]["aggregate"].get("overall_score") is not None
    ]
    evaluated.reverse()  # now chronological

    trends = []
    for idx, s in enumerate(evaluated, 1):
        agg = s["evaluation"]["aggregate"]
        trends.append({
            "session_number": idx,
            "session_id": s["session_id"],
            "date": s["created_at"].strftime("%b %d") if s.get("created_at") else f"Session {idx}",
            "overall_score": agg.get("overall_score", 0),
            "communication": agg.get("communication", 0),
            "confidence": agg.get("confidence", 0),
            "technical_accuracy": agg.get("technical_accuracy", 0),
            "role": s.get("role", ""),
        })

    return jsonify({"trends": trends}), 200


@progress_bp.route("/stats", methods=["GET"])
@jwt_required
def get_stats():
    """Calculate high-level performance metrics for the authenticated user."""
    session_model = SessionModel(current_app.db)
    user_sessions = session_model.find_by_user(g.user_id)

    completed_count = sum(1 for s in user_sessions if s.get("status") == "completed")
    scores = [
        s["evaluation"]["aggregate"]["overall_score"]
        for s in user_sessions
        if s.get("evaluation") and s["evaluation"].get("aggregate") and s["evaluation"]["aggregate"].get("overall_score") is not None
    ]

    comm_scores = [
        s["evaluation"]["aggregate"]["communication"]
        for s in user_sessions
        if s.get("evaluation") and s["evaluation"].get("aggregate") and s["evaluation"]["aggregate"].get("communication") is not None
    ]
    conf_scores = [
        s["evaluation"]["aggregate"]["confidence"]
        for s in user_sessions
        if s.get("evaluation") and s["evaluation"].get("aggregate") and s["evaluation"]["aggregate"].get("confidence") is not None
    ]
    tech_scores = [
        s["evaluation"]["aggregate"]["technical_accuracy"]
        for s in user_sessions
        if s.get("evaluation") and s["evaluation"].get("aggregate") and s["evaluation"]["aggregate"].get("technical_accuracy") is not None
    ]

    avg_score = round(sum(scores) / len(scores)) if scores else 0
    highest_score = max(scores) if scores else 0

    dimensions = {
        "Technical Accuracy": round(sum(tech_scores) / len(tech_scores)) if tech_scores else 0,
        "Communication": round(sum(comm_scores) / len(comm_scores)) if comm_scores else 0,
        "Confidence": round(sum(conf_scores) / len(conf_scores)) if conf_scores else 0,
    }

    strongest = max(dimensions, key=dimensions.get) if scores else None
    weakest = min(dimensions, key=dimensions.get) if scores else None

    return jsonify({
        "stats": {
            "total_sessions": len(user_sessions),
            "completed_sessions": completed_count,
            "average_score": avg_score,
            "highest_score": highest_score,
            "strongest_dimension": strongest,
            "weakest_dimension": weakest,
            "dimension_averages": dimensions,
        }
    }), 200
