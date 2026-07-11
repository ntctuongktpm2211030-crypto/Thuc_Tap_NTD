import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    OPENAI_API_KEY: str = ""
    OPENAI_API_BASE_URL: str = ""
    OPENAI_MODEL_NAME: str = "gpt-4o-mini"

    class Config:
        env_file = "../backend/.env"
        extra = "ignore"

settings = Settings()
