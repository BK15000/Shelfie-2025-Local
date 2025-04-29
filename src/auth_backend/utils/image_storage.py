import os
import base64
import uuid
from datetime import datetime
from auth_backend.config.settings import settings

def save_base64_image(base64_data: str, user_id: int) -> str:
    """
    Save a base64 encoded image to the filesystem.
    
    Args:
        base64_data (str): Base64 encoded image data
        user_id (int): ID of the user who owns the image
        
    Returns:
        str: Path to the saved image file
    """
    # Create user directory if it doesn't exist
    user_dir = os.path.join(settings.IMAGES_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    
    # Generate a unique filename
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{timestamp}_{unique_id}.jpg"
    
    # Full path to save the image
    file_path = os.path.join(user_dir, filename)
    
    # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    if "," in base64_data:
        base64_data = base64_data.split(",", 1)[1]
    
    # Decode and save the image
    image_data = base64.b64decode(base64_data)
    with open(file_path, "wb") as f:
        f.write(image_data)
    
    # Return the relative path from the IMAGES_DIR
    return os.path.join(str(user_id), filename)

def get_full_image_path(relative_path: str) -> str:
    """
    Get the full path to an image file.
    
    Args:
        relative_path (str): Relative path from the IMAGES_DIR
        
    Returns:
        str: Full path to the image file
    """
    return os.path.join(settings.IMAGES_DIR, relative_path)

def delete_image(relative_path: str) -> bool:
    """
    Delete an image file.
    
    Args:
        relative_path (str): Relative path from the IMAGES_DIR
        
    Returns:
        bool: True if the file was deleted, False otherwise
    """
    full_path = get_full_image_path(relative_path)
    try:
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
    except Exception:
        pass
    return False

def get_base64_image(relative_path: str) -> str:
    """
    Get a base64 encoded image from a file.
    
    Args:
        relative_path (str): Relative path from the IMAGES_DIR
        
    Returns:
        str: Base64 encoded image data
    """
    full_path = get_full_image_path(relative_path)
    try:
        with open(full_path, "rb") as f:
            image_data = f.read()
        return base64.b64encode(image_data).decode("utf-8")
    except Exception:
        return ""
