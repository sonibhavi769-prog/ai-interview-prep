"""Abstract interface for Speech-to-Text providers.

A future real provider (Google Cloud STT, Whisper, etc.) will implement
this class.  See `stub.py` for the current placeholder.
"""

from abc import ABC, abstractmethod


class STTProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_blob: bytes) -> str:
        """Transcribe raw audio bytes to text.

        Parameters
        ----------
        audio_blob : bytes
            Raw audio data (format TBD by provider).

        Returns
        -------
        str
            Transcribed text.
        """
        ...
