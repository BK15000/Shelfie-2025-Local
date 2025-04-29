from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    gpu_endpoint: str
    openai_api_key: Optional[str] = None
    port: Optional[str] = None

class UserLogin(UserBase):
    password: str

class UserUpdate(BaseModel):
    gpu_endpoint: Optional[str] = None
    openai_api_key: Optional[str] = None
    port: Optional[str] = None

class UserResponse(UserBase):
    id: int
    gpu_endpoint: str
    openai_api_key: Optional[str] = None
    port: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CollectionItemCreate(BaseModel):
    game_name: str
    image_data: str  # Base64 encoded image (will be converted to file and stored as path)
    shelf: Optional[str] = None
    case: Optional[str] = None

class CollectionItemUpdate(BaseModel):
    game_name: Optional[str] = None
    image_data: Optional[str] = None  # Base64 encoded image

class CollectionItemResponse(BaseModel):
    id: int
    game_name: str
    image_path: str  # Path to the image file
    created_at: datetime
    game_id: Optional[str] = None  # ID from the boardgames_ranks.csv file
    shelf: Optional[str] = None
    case: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class LogoutRequest(BaseModel):
    token: str
