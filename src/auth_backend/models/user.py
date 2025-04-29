from sqlalchemy import Column, Integer, String, DateTime, func # type: ignore
from sqlalchemy.ext.declarative import declarative_base # type: ignore

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    gpu_endpoint = Column(String, nullable=False)
    openai_api_key = Column(String, nullable=True)
    port = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class CollectionItem(Base):
    __tablename__ = "collection_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    game_name = Column(String, nullable=False)
    image_data = Column(String, nullable=False)  # BGG ID
    image_path = Column(String, nullable=True)  # Path to the image file
    shelf = Column(String, nullable=True)  # Shelf identifier
    case = Column(String, nullable=True)  # Case identifier
    created_at = Column(DateTime, server_default=func.now())
