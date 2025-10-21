from functools import lru_cache
from pathlib import Path

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    # Google AI Studio
    google_api_key: str = Field("", env="GOOGLE_API_KEY")
    model_provider: str = Field("google", env="MODEL_PROVIDER")
    model_id: str = Field("gemini-2.5-flash", env="MODEL_ID")
    
    # Legacy OpenRouter (fallback)
    openrouter_api_key: str = Field("", env="OPENROUTER_API_KEY")
    glm_model_id: str = Field("z-ai/glm-4.5-air", env="GLM_MODEL_ID")

    # Optional Keras facial emotion model path
    emo_model_path: str = Field("", env="EMO_MODEL_PATH")
    
    # Database
    database_url: str = Field("sqlite+aiosqlite:///./braincell_sessions.db", env="DATABASE_URL")

    class Config:
        # Always read environment from the backend folder's .env regardless of CWD
        env_file = str(Path(__file__).resolve().parents[1] / ".env")
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
