"""Application configuration — all values sourced from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "ai_interview_prep")

    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_ACCESS_EXPIRY = int(os.getenv("JWT_ACCESS_EXPIRY", "3600"))        # 1 hour
    JWT_REFRESH_EXPIRY = int(os.getenv("JWT_REFRESH_EXPIRY", "604800"))    # 7 days

    # LLM
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
    LLM_API_KEY = os.getenv("LLM_API_KEY", "")
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini-flash-latest")

    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
