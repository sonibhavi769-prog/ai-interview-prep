"""Gemini-backed LLM provider via Google Generative Language REST API."""

import json
import logging
import httpx
from .interface import LLMProvider

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """Calls the Google Gemini API using native structured JSON generation."""

    def __init__(self, api_key: str, model: str = "gemini-flash-lite-latest"):
        self.api_key = api_key
        if model.startswith("models/"):
            model = model[len("models/"):]
        self.model = model
        # Candidate models to try in case of 503/429 capacity spikes
        self.models_to_try = []
        for m in [self.model, "gemma-4-26b-a4b-it", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-lite-latest", "gemini-flash-latest"]:
            if m and m not in self.models_to_try:
                self.models_to_try.append(m)

    def generate(self, prompt: str, config: dict | None = None) -> str:
        cfg = config or {}
        temperature = cfg.get("temperature", 0.7)
        max_tokens = cfg.get("max_tokens", 4000)

        last_error = None
        with httpx.Client(timeout=35.0) as client:
            for model_name in self.models_to_try:
                is_gemma = model_name.startswith("gemma")
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{
                                "text": (
                                    "You are an expert interview question generator. "
                                    "Always respond with a valid JSON array of question objects only — "
                                    "no markdown fences, no commentary, just the raw JSON array.\n\n" + prompt
                                ) if is_gemma else prompt
                            }],
                        }
                    ],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens,
                    },
                }
                if not is_gemma:
                    payload["systemInstruction"] = {
                        "parts": [
                            {
                                "text": (
                                    "You are an expert interview question generator. "
                                    "Always respond with a valid JSON array of question objects only — "
                                    "no markdown fences, no explanation, just the raw JSON array."
                                )
                            }
                        ]
                    }
                    payload["generationConfig"]["responseMimeType"] = "application/json"

                endpoint = (
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
                )
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

                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        for part in content_parts:
                            if "text" in part:
                                return part["text"]
                    elif response.status_code in (429, 503):
                        logger.warning(
                            f"Model {model_name} returned {response.status_code}, trying fallback..."
                        )
                        last_error = f"{response.status_code}: {response.text}"
                        continue
                    else:
                        raise RuntimeError(
                            f"Gemini API returned status {response.status_code}: {response.text}"
                        )
                except httpx.HTTPError as e:
                    last_error = str(e)
                    continue

        raise RuntimeError(f"Gemini API call failed after trying models {self.models_to_try}: {last_error}")
