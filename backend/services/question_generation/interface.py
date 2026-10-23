"""Abstract interface for LLM providers.

Concrete implementations (OpenAI, Gemini, etc.) must inherit from this class.
The active provider is resolved at runtime from the LLM_PROVIDER env var so
the rest of the codebase never imports a specific vendor directly.
"""

from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, config: dict | None = None) -> str:
        """Send *prompt* to the LLM and return the raw text response.

        Parameters
        ----------
        prompt : str
            The full prompt string.
        config : dict, optional
            Provider-specific overrides (temperature, max_tokens, …).

        Returns
        -------
        str
            Raw text output from the model.
        """
        ...
