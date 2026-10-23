"""Abstract interface for Evaluation providers.

Concrete implementations (Gemini, OpenAI, etc.) must implement methods
for evaluating both conversational responses and coding tasks.
"""

from abc import ABC, abstractmethod


class EvaluationProvider(ABC):
    """Abstract base class for LLM-based evaluation providers."""

    @abstractmethod
    def evaluate_conversational(
        self,
        question: dict,
        answer_text: str,
        nlp_metrics: dict | None = None,
    ) -> dict:
        """Evaluate a conversational interview response.

        Returns a dictionary containing:
        - communication: int (0-100)
        - confidence: int (0-100)
        - technical_accuracy: int (0-100)
        - feedback: str
        - strengths: list[str]
        - areas_for_improvement: list[str]
        """
        ...

    @abstractmethod
    def evaluate_coding_task(
        self,
        question: dict,
        submitted_code: str,
        language: str,
        approach_explanation: str,
    ) -> dict:
        """Evaluate a coding task submission.

        Returns a dictionary containing:
        - communication: int (0-100)
        - confidence: int (0-100)
        - technical_accuracy: int (0-100)
        - coding_metrics: dict with {correctness, code_quality, edge_cases, efficiency}
        - feedback: str
        - strengths: list[str]
        - areas_for_improvement: list[str]
        """
        ...
