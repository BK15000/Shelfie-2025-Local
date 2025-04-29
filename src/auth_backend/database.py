from sqlalchemy import create_engine # type: ignore
from sqlalchemy.ext.declarative import declarative_base # type: ignore
from sqlalchemy.orm import sessionmaker # type: ignore
import os
import logging

def get_db_url():
    """Get database URL from environment variable or use default"""
    return os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@db:5432/postgres")

# Create SQLAlchemy engine
engine = create_engine(get_db_url())

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Initialize database
def init_db():
    """Create all tables in the database"""
    from auth_backend.models.user import Base
    logging.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logging.info("Database tables created successfully")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
