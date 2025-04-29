import logging
import os
import importlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth_backend.auth import auth_router, collection_router
from auth_backend.database import init_db
from auth_backend.config.settings import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

# Initialize FastAPI app
app = FastAPI(title="Auth API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the images directory exists
os.makedirs(settings.IMAGES_DIR, exist_ok=True)
logging.info(f"Ensuring images directory exists at: {settings.IMAGES_DIR}")

# Initialize database
init_db()

# Run migrations using Alembic
try:
    logging.info("Running database migrations...")
    import subprocess
    import os
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Run the Alembic migration
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=current_dir,
        capture_output=True,
        text=True,
        check=True
    )
    
    # Log the output
    logging.info(f"Alembic migration output:\n{result.stdout}")
    if result.stderr:
        logging.warning(f"Alembic migration stderr:\n{result.stderr}")
    
    logging.info("Database migrations completed successfully")
except subprocess.CalledProcessError as e:
    logging.error(f"Error running Alembic migrations: {e}")
    if hasattr(e, 'stdout'):
        logging.error(f"Stdout: {e.stdout}")
    if hasattr(e, 'stderr'):
        logging.error(f"Stderr: {e.stderr}")
    logging.error("Migration failed but application will continue to run.")
except Exception as e:
    logging.error(f"Error running migrations: {e}")
    logging.error("Migration failed but application will continue to run.")


# Include routers
app.include_router(auth_router.router)
app.include_router(collection_router.router)

@app.get("/")
def read_root():
    return {"message": "Auth API is running"}
