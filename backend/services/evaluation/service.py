"""Evaluation service orchestrator.

Matches responses to questions, runs NLP baseline analysis, and delegates
to the configured EvaluationProvider.
"""

from config import Config
from .interface import EvaluationProvider
from .gemini_eval_provider import GeminiEvaluationProvider
from .nlp_metrics import extract_nlp_features


def _get_eval_provider() -> EvaluationProvider:
    provider_name = Config.LLM_PROVIDER.lower()
    if provider_name == "gemini":
        return GeminiEvaluationProvider(api_key=Config.LLM_API_KEY, model=Config.LLM_MODEL)
    # Default fallback to Gemini
    return GeminiEvaluationProvider(api_key=Config.LLM_API_KEY, model=Config.LLM_MODEL)


class EvaluationService:
    """Orchestrates response evaluation for an interview session."""

    def __init__(self, provider: EvaluationProvider | None = None):
        self.provider = provider or _get_eval_provider()

    def evaluate_single_response(self, question: dict, response: dict) -> dict:
        q_type = response.get("question_type", question.get("type", "conversational"))
        q_id = response.get("question_id", question.get("id"))

        if q_type == "coding_task":
            submitted_code = response.get("submitted_code", "")
            language = response.get("language", "python")
            approach_explanation = response.get("approach_explanation", "")

            eval_res = self.provider.evaluate_coding_task(
                question=question,
                submitted_code=submitted_code,
                language=language,
                approach_explanation=approach_explanation,
            )
            return {
                "question_id": q_id,
                "question_type": "coding_task",
                "submitted_code": submitted_code,
                "language": language,
                "approach_explanation": approach_explanation,
                "communication": eval_res["communication"],
                "confidence": eval_res["confidence"],
                "technical_accuracy": eval_res["technical_accuracy"],
                "coding_metrics": eval_res["coding_metrics"],
                "feedback": eval_res["feedback"],
                "strengths": eval_res["strengths"],
                "areas_for_improvement": eval_res["areas_for_improvement"],
            }
        else:
            answer_text = response.get("answer_text", "")
            nlp_metrics = extract_nlp_features(answer_text, question.get("text", ""))

            eval_res = self.provider.evaluate_conversational(
                question=question,
                answer_text=answer_text,
                nlp_metrics=nlp_metrics,
            )
            return {
                "question_id": q_id,
                "question_type": "conversational",
                "answer_text": answer_text,
                "source": response.get("source", "text"),
                "nlp_metrics": nlp_metrics,
                "communication": eval_res["communication"],
                "confidence": eval_res["confidence"],
                "technical_accuracy": eval_res["technical_accuracy"],
                "feedback": eval_res["feedback"],
                "strengths": eval_res["strengths"],
                "areas_for_improvement": eval_res["areas_for_improvement"],
            }

    def evaluate_session(self, session: dict) -> list[dict]:
        """Evaluate all answered questions in an interview session concurrently."""
        from concurrent.futures import ThreadPoolExecutor

        questions_by_id = {q["id"]: q for q in session.get("questions", []) if "id" in q}
        responses = session.get("responses", [])

        tasks = []
        for resp in responses:
            qid = resp.get("question_id")
            question = questions_by_id.get(qid)
            if question:
                tasks.append((question, resp))

        if not tasks:
            return []

        def _eval_task(pair):
            question, resp = pair
            try:
                evaluation = self.evaluate_single_response(question, resp)
                evaluation["question_text"] = question.get("text") or question.get("title", "")
                evaluation["question_difficulty"] = question.get("difficulty", "medium")
                evaluation["question_category"] = question.get("category", "Technical")
                if question.get("problem_statement"):
                    evaluation["problem_statement"] = question.get("problem_statement")
                    evaluation["constraints"] = question.get("constraints")
                return evaluation
            except Exception as e:
                # Do NOT silently mask failure with fake 70% scores
                raise RuntimeError(f"Evaluation failed for question {resp.get('question_id')}: {str(e)}")

        max_workers = min(5, len(tasks))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            evaluated_list = list(executor.map(_eval_task, tasks))

        return evaluated_list
