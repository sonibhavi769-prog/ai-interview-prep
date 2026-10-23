"""Interview routes — create session, get session, submit response, complete, abandon."""

from flask import Blueprint, request, jsonify, current_app, g

from middleware.auth import jwt_required
from models.session import SessionModel
from services.question_generation.service import QuestionGenerationService
from services.evaluation.service import EvaluationService
from services.feedback.aggregator import aggregate_scores
from services.feedback.recommendations import generate_recommendations
from routes.users import CODING_DOMAINS

interviews_bp = Blueprint("interviews", __name__)


def _run_evaluation(session, session_model):
    """Run batched evaluation for session responses and persist results."""
    responses = session.get("responses", [])
    if not responses:
        empty_eval = {
            "status": "completed",
            "per_question": [],
            "aggregate": aggregate_scores([]),
            "recommendations": generate_recommendations([], {}),
        }
        session_model.save_evaluation(session["session_id"], session["user_id"], empty_eval)
        return empty_eval

    eval_service = EvaluationService()
    try:
        evaluations = eval_service.evaluate_session(session)
        agg_scores = aggregate_scores(evaluations)
        recommendations = generate_recommendations(evaluations, agg_scores)

        eval_data = {
            "status": "completed",
            "per_question": evaluations,
            "aggregate": agg_scores,
            "recommendations": recommendations,
        }
        session_model.save_evaluation(session["session_id"], session["user_id"], eval_data)
        return eval_data
    except Exception as e:
        eval_data = {
            "status": "failed",
            "error": "EVALUATION_PROVIDER_ERROR",
            "message": f"Interview evaluation is temporarily unavailable: {str(e)}",
            "per_question": [],
            "aggregate": {},
            "recommendations": [],
        }
        session_model.save_evaluation(session["session_id"], session["user_id"], eval_data)
        return eval_data


@interviews_bp.route("", methods=["POST"])
@jwt_required
def create_interview():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    role = data.get("role") or g.user.get("role")
    domain = data.get("domain") or g.user.get("domain")
    interview_type = data.get("interview_type", "Mixed")
    total_questions = data.get("total_questions", 10)
    coding_ratio = data.get("coding_ratio")  # explicit count, or None → default

    if not role or not domain:
        return jsonify({"error": "Role and domain are required"}), 400
    if interview_type not in ("Technical", "HR", "Mixed"):
        return jsonify({"error": "interview_type must be Technical, HR, or Mixed"}), 400
    if not isinstance(total_questions, int) or not 5 <= total_questions <= 20:
        return jsonify({"error": "total_questions must be between 5 and 20"}), 400

    # Determine coding-task count
    coding_count = 0
    if interview_type in ("Technical", "Mixed") and domain in CODING_DOMAINS:
        if coding_ratio is not None:
            coding_count = max(0, min(int(coding_ratio), total_questions - 1))
        else:
            # Default ≈ 20 %: 1 coding task per 5 questions, minimum 1
            coding_count = max(1, total_questions // 5)

    try:
        service = QuestionGenerationService()
        questions = service.generate(
            role=role,
            domain=domain,
            interview_type=interview_type,
            total_count=total_questions,
            coding_count=coding_count,
        )
    except Exception as e:
        return jsonify({"error": f"Failed to generate questions: {str(e)}"}), 500

    session_model = SessionModel(current_app.db)
    session = session_model.create(
        user_id=g.user_id,
        role=role,
        domain=domain,
        interview_type=interview_type,
        questions=questions,
    )

    return jsonify(
        {"session_id": session["session_id"], "total_questions": len(questions)}
    ), 201


@interviews_bp.route("/<session_id>", methods=["GET"])
@jwt_required
def get_interview(session_id):
    session_model = SessionModel(current_app.db)
    session = session_model.find_by_session_id(session_id, g.user_id)
    if not session:
        return jsonify({"error": "Interview session not found"}), 404
    return jsonify({"session": session_model.to_dict(session)}), 200


@interviews_bp.route("/<session_id>/responses", methods=["POST"])
@jwt_required
def submit_response(session_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    session_model = SessionModel(current_app.db)
    session = session_model.find_by_session_id(session_id, g.user_id)
    if not session:
        return jsonify({"error": "Interview session not found"}), 404
    if session["status"] != "in_progress":
        return jsonify({"error": "This interview session is no longer active"}), 400

    question_id = data.get("question_id")
    question_type = data.get("question_type")
    if not question_id or not question_type:
        return jsonify({"error": "question_id and question_type are required"}), 400

    response = {"question_id": question_id, "question_type": question_type}

    if question_type == "conversational":
        response["answer_text"] = data.get("answer_text", "")
        response["source"] = data.get("source", "text")
    elif question_type == "coding_task":
        response["submitted_code"] = data.get("submitted_code", "")
        response["language"] = data.get("language", "")
        response["approach_explanation"] = data.get("approach_explanation", "")
    else:
        return jsonify({"error": "question_type must be conversational or coding_task"}), 400

    session_model.add_response(session_id, g.user_id, response)
    return jsonify({"message": "Response recorded"}), 201


@interviews_bp.route("/<session_id>/complete", methods=["PATCH"])
@jwt_required
def complete_interview(session_id):
    session_model = SessionModel(current_app.db)
    session = session_model.find_by_session_id(session_id, g.user_id)
    if not session:
        return jsonify({"error": "Interview session not found"}), 404
    if session["status"] != "in_progress":
        return jsonify({"error": "This interview session is no longer active"}), 400

    session_model.complete(session_id, g.user_id)
    # Refresh session object with latest responses
    updated_session = session_model.find_by_session_id(session_id, g.user_id)
    eval_data = _run_evaluation(updated_session, session_model)

    return jsonify({
        "message": "Interview completed and evaluated" if eval_data.get("status") == "completed" else "Interview completed (evaluation pending)",
        "session_id": session_id,
        "evaluation_status": eval_data.get("status", "completed"),
        "overall_score": eval_data.get("aggregate", {}).get("overall_score"),
        "error": eval_data.get("error"),
        "error_message": eval_data.get("message"),
    }), 200


@interviews_bp.route("/<session_id>/abandon", methods=["PATCH"])
@jwt_required
def abandon_interview(session_id):
    session_model = SessionModel(current_app.db)
    session = session_model.find_by_session_id(session_id, g.user_id)
    if not session:
        return jsonify({"error": "Interview session not found"}), 404
    if session["status"] != "in_progress":
        return jsonify({"error": "This interview session is no longer active"}), 400

    session_model.abandon(session_id, g.user_id)
    updated_session = session_model.find_by_session_id(session_id, g.user_id)
    eval_data = _run_evaluation(updated_session, session_model)

    return jsonify({
        "message": "Interview abandoned",
        "session_id": session_id,
        "evaluation_status": eval_data.get("status", "completed"),
        "overall_score": eval_data.get("aggregate", {}).get("overall_score"),
    }), 200


@interviews_bp.route("/<session_id>/results", methods=["GET"])
@jwt_required
def get_interview_results(session_id):
    session_model = SessionModel(current_app.db)
    session = session_model.find_by_session_id(session_id, g.user_id)
    if not session:
        return jsonify({"error": "Interview session not found"}), 404

    # If evaluation was not run yet (e.g. legacy session or pending), run lazily
    evaluation = session.get("evaluation")
    if not evaluation and session.get("responses"):
        evaluation = _run_evaluation(session, session_model)
        session = session_model.find_by_session_id(session_id, g.user_id)

    return jsonify({
        "session": session_model.to_dict(session),
        "evaluation": evaluation or {
            "status": "empty",
            "per_question": [],
            "aggregate": aggregate_scores([]),
            "recommendations": generate_recommendations([], {}),
        }
    }), 200


@interviews_bp.route("/<session_id>/retry-eval", methods=["POST"])
@jwt_required
def retry_evaluation(session_id):
    session_model = SessionModel(current_app.db)
    session = session_model.find_by_session_id(session_id, g.user_id)
    if not session:
        return jsonify({"error": "Interview session not found"}), 404
    if not session.get("responses"):
        return jsonify({"error": "No responses to evaluate"}), 400

    eval_data = _run_evaluation(session, session_model)
    updated = session_model.find_by_session_id(session_id, g.user_id)
    return jsonify({
        "session": session_model.to_dict(updated),
        "evaluation": eval_data,
    }), 200
