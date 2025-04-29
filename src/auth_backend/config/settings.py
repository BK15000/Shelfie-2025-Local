from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8080

    # CORS
    
    # Image Storage
    IMAGES_DIR: str = "/src/data/images"
    

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
