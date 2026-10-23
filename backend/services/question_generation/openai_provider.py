"""OpenAI-backed LLM provider."""

from .interface import LLMProvider


class OpenAIProvider(LLMProvider):
    """Calls the OpenAI Chat Completions API."""

    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        self.api_key = api_key
        self.model = model

    def generate(self, prompt: str, config: dict | None = None) -> str:
        try:
            import openai

            client = openai.OpenAI(api_key=self.api_key)
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert interview question generator. "
                            "Always respond with valid JSON only — no markdown "
                            "fences, no explanation, just the JSON array."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=(config or {}).get("temperature", 0.7),
                max_tokens=(config or {}).get("max_tokens", 4000),
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"OpenAI API call failed: {e}")
