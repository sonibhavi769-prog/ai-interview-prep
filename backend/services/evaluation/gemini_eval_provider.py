"""Gemini-backed Evaluation Provider.

Evaluates conversational responses and coding tasks using Google Gemini
with structured JSON generation and fallback models.
"""

import json
import logging
import httpx
from .interface import EvaluationProvider

logger = logging.getLogger(__name__)


class GeminiEvaluationProvider(EvaluationProvider):
    """Evaluates interview responses using Gemini REST API."""

    def __init__(self, api_key: str, model: str = "gemini-flash-lite-latest"):
        self.api_key = api_key
        if model.startswith("models/"):
            model = model[len("models/"):]
        self.model = model
        self.models_to_try = []
        for m in [self.model, "gemma-4-26b-a4b-it", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-lite-latest", "gemini-flash-latest"]:
            if m and m not in self.models_to_try:
                self.models_to_try.append(m)

    def _call_gemini_json(self, system_instruction: str, prompt: str) -> dict:
        last_error = None
        with httpx.Client(timeout=35.0) as client:
            for model_name in self.models_to_try:
                is_gemma = model_name.startswith("gemma")
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{
                                "text": (system_instruction + "\n\n" + prompt) if is_gemma else prompt
                            }],
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 3000,
                    },
                }
                if not is_gemma:
                    payload["systemInstruction"] = {
                        "parts": [{"text": system_instruction}],
                    }
                    payload["generationConfig"]["responseMimeType"] = "application/json"

                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
                try:
                    response = client.post(
                        endpoint,
                        params={"key": self.api_key},
                        json=payload,
                    )

                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if not candidates:
                            continue
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            if "text" in part:
                                raw_text = part["text"].strip()
                                # Clean potential fences
                                if "```" in raw_text:
                                    import re
                                    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
                                    if match:
                                        raw_text = match.group(1).strip()
                                # Locate outermost object brackets
                                start = raw_text.find("{")
                                end = raw_text.rfind("}")
                                if start != -1 and end != -1 and end > start:
                                    raw_text = raw_text[start : end + 1]
                                return json.loads(raw_text)

                    elif response.status_code in (429, 503):
                        logger.warning(f"Model {model_name} returned {response.status_code}, trying fallback...")
                        last_error = f"{response.status_code}: {response.text}"
                        continue
                    else:
                        raise RuntimeError(f"Gemini API returned {response.status_code}: {response.text}")
                except Exception as e:
                    last_error = str(e)
                    continue

        raise RuntimeError(f"Gemini evaluation call failed across models {self.models_to_try}: {last_error}")

    def evaluate_conversational(
        self,
        question: dict,
        answer_text: str,
        nlp_metrics: dict | None = None,
    ) -> dict:
        system_instruction = (
            "You are an expert technical and HR interview evaluator. "
            "Analyze the candidate's response rigorously but constructively. "
            "Output MUST be a single JSON object with these exact keys:\n"
            "- communication: integer 0 to 100\n"
            "- confidence: integer 0 to 100\n"
            "- technical_accuracy: integer 0 to 100\n"
            "- feedback: concise 2-4 sentence summary of performance\n"
            "- strengths: list of 1-3 specific positive observations\n"
            "- areas_for_improvement: list of 1-3 specific actionable improvements"
        )

        prompt = (
            f"Question Category: {question.get('category', 'Technical')}\n"
            f"Difficulty: {question.get('difficulty', 'medium')}\n"
            f"Interview Question: {question.get('text', '')}\n\n"
            f"Candidate's Answer:\n\"{answer_text}\"\n\n"
            f"NLP Baseline Stats: {json.dumps(nlp_metrics or {})}\n\n"
            "Score guidelines:\n"
            "- communication: clarity, structure, articulation, vocabulary appropriateness.\n"
            "- confidence: decisiveness, lack of hesitation/filler words, conviction.\n"
            "- technical_accuracy: factual correctness, completeness, depth of knowledge.\n"
            "If the answer is completely off-topic or empty, assign scores below 30."
        )

        result = self._call_gemini_json(system_instruction, prompt)
        return {
            "communication": int(result.get("communication", 70)),
            "confidence": int(result.get("confidence", 70)),
            "technical_accuracy": int(result.get("technical_accuracy", 70)),
            "feedback": str(result.get("feedback", "Good effort.")),
            "strengths": list(result.get("strengths", [])),
            "areas_for_improvement": list(result.get("areas_for_improvement", [])),
        }

    def evaluate_coding_task(
        self,
        question: dict,
        submitted_code: str,
        language: str,
        approach_explanation: str,
    ) -> dict:
        system_instruction = (
            "You are a senior software engineer conducting a technical code review. "
            "Evaluate the candidate's code submission against the problem statement and constraints. "
            "Output MUST be a single JSON object with these exact keys:\n"
            "- communication: integer 0 to 100 (explanation clarity and code readability/naming)\n"
            "- confidence: integer 0 to 100 (solution completeness and architectural decisiveness)\n"
            "- technical_accuracy: integer 0 to 100 (algorithmic correctness, constraints, efficiency)\n"
            "- coding_metrics: object with integer keys { correctness: 0-100, code_quality: 0-100, edge_cases: 0-100, efficiency: 0-100 }\n"
            "- feedback: concise 2-4 sentence code review feedback\n"
            "- strengths: list of 1-3 specific strengths in code or approach\n"
            "- areas_for_improvement: list of 1-3 specific areas for improvement (e.g. edge cases, Big-O)"
        )

        prompt = (
            f"Problem Title: {question.get('title', 'Coding Task')}\n"
            f"Problem Statement:\n{question.get('problem_statement', '')}\n"
            f"Constraints:\n{question.get('constraints', '')}\n"
            f"Difficulty: {question.get('difficulty', 'medium')}\n\n"
            f"Programming Language: {language}\n"
            f"Candidate Approach Explanation:\n{approach_explanation}\n\n"
            f"Candidate Submitted Code:\n```\n{submitted_code}\n```\n\n"
            "Review guidelines:\n"
            "- correctness: Does the logic solve the stated problem?\n"
            "- code_quality: Clean naming, idiomatic syntax, readability.\n"
            "- edge_cases: Handling null/empty inputs, boundary limits.\n"
            "- efficiency: Optimal time and space complexity for constraints."
        )

        result = self._call_gemini_json(system_instruction, prompt)
        metrics = result.get("coding_metrics", {})
        return {
            "communication": int(result.get("communication", 70)),
            "confidence": int(result.get("confidence", 70)),
            "technical_accuracy": int(result.get("technical_accuracy", 70)),
            "coding_metrics": {
                "correctness": int(metrics.get("correctness", 75)),
                "code_quality": int(metrics.get("code_quality", 75)),
                "edge_cases": int(metrics.get("edge_cases", 70)),
                "efficiency": int(metrics.get("efficiency", 75)),
            },
            "feedback": str(result.get("feedback", "Code reviewed successfully.")),
            "strengths": list(result.get("strengths", [])),
            "areas_for_improvement": list(result.get("areas_for_improvement", [])),
        }
