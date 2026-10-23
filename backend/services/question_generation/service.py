"""Question-generation service.

Builds a structured prompt from (role, domain, type, counts), calls the
configured LLM provider, and parses the JSON response into a validated
list of question dicts ready to store on the interview session.
"""

import json
import uuid

from config import Config
from .interface import LLMProvider
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider


def _get_provider() -> LLMProvider:
    """Resolve the active LLM provider from config."""
    name = Config.LLM_PROVIDER.lower()
    if name == "gemini":
        return GeminiProvider(api_key=Config.LLM_API_KEY, model=Config.LLM_MODEL)
    if name == "openai":
        return OpenAIProvider(api_key=Config.LLM_API_KEY, model=Config.LLM_MODEL)
    raise ValueError(f"Unsupported LLM_PROVIDER: {name!r}")


class QuestionGenerationService:
    """Generate interview questions through the configured LLM adapter."""

    def __init__(self, provider: LLMProvider | None = None):
        self.provider = provider or _get_provider()

    # ── Public API ────────────────────────────────────────────────────

    def generate(
        self,
        role: str,
        domain: str,
        interview_type: str,
        total_count: int,
        coding_count: int = 0,
    ) -> list[dict]:
        conv_count = total_count - coding_count
        prompt = self._build_prompt(role, domain, interview_type, conv_count, coding_count)
        raw = self.provider.generate(prompt, {"temperature": 0.7, "max_tokens": 4000})
        questions = self._parse_response(raw)

        # Assign stable IDs
        for q in questions:
            q["id"] = str(uuid.uuid4())

        return questions[:total_count]

    # ── Prompt construction ───────────────────────────────────────────

    @staticmethod
    def _build_prompt(
        role: str,
        domain: str,
        interview_type: str,
        conv_count: int,
        coding_count: int,
    ) -> str:
        lines: list[str] = [
            f"Generate interview questions for a **{role}** position in the "
            f"**{domain}** domain.",
            f"Interview type: {interview_type}.",
            "",
            "Return a JSON array of question objects.  Each object MUST contain "
            "the fields described below.  Return ONLY the JSON array — no "
            "markdown, no commentary.",
            "",
        ]

        if conv_count > 0:
            cat = {
                "Technical": 'category must be "Technical".',
                "HR": 'category must be "HR".',
                "Mixed": 'use a mix — roughly 60 % "Technical", 40 % "HR".',
            }[interview_type]
            lines += [
                f"### Conversational questions ({conv_count})",
                "Fields:",
                '  • "type": "conversational"',
                '  • "text": the interview question',
                f'  • "category": "Technical" or "HR" — {cat}',
                '  • "difficulty": "easy" | "medium" | "hard"',
                "",
            ]

        if coding_count > 0:
            lines += [
                f"### Coding-task questions ({coding_count})",
                "Fields:",
                '  • "type": "coding_task"',
                '  • "title": short problem title',
                '  • "problem_statement": detailed description with examples',
                '  • "constraints": input/output constraints & limits',
                '  • "starter_code": optional starter template (string, may be "")',
                '  • "allowed_languages": ["python", "javascript", "java", "cpp"]',
                '  • "difficulty": "easy" | "medium" | "hard"',
                "",
                "Make coding tasks practical and relevant to the role/domain.",
                "",
            ]

        lines += [
            "General rules:",
            "- Distribute difficulty across easy / medium / hard.",
            "- Questions must be realistic, not trivia.",
            f"- Total questions: exactly {conv_count + coding_count}.",
        ]

        return "\n".join(lines)

    # ── Response parsing ──────────────────────────────────────────────

    @staticmethod
    def _parse_response(raw: str) -> list[dict]:
        text = raw.strip()
        # Strip markdown code fences if present
        if "```" in text:
            import re
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()

        # Locate outermost array brackets
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]

        try:
            result = json.loads(text)
            if not isinstance(result, list):
                raise ValueError("Expected a JSON array of questions")
            return result
        except (json.JSONDecodeError, ValueError) as exc:
            raise RuntimeError(f"Failed to parse LLM output as JSON: {exc} | Raw output preview: {raw[:300]}")
