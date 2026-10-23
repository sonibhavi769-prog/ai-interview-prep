"""Stub Speech-to-Text provider.

Returns a "not yet supported" message.  Replace this file with a real
implementation once the STT vendor decision is made (PRD §11).
"""

from .interface import STTProvider


class StubSTTProvider(STTProvider):
    def transcribe(self, audio_blob: bytes) -> str:  # noqa: ARG002
        return "Voice input is not yet supported. Please type your response."
