from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session # type: ignore
from typing import List
import os
from auth_backend.database import get_db
from auth_backend.models import schemas, user
from auth_backend.auth import jwt_service
from auth_backend.utils.image_storage import save_base64_image, delete_image, get_base64_image
from auth_backend.utils.game_lookup import get_instance as get_game_lookup
from auth_backend.config.settings import settings
from typing import Optional

router = APIRouter(prefix="/collection", tags=["Collection"])

# Ensure the images directory exists
os.makedirs(settings.IMAGES_DIR, exist_ok=True)

@router.get("/items", response_model=List[schemas.CollectionItemResponse])
def get_collection_items(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    # Extract token from Authorization header if present
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    try:
        # Try to verify the token
        current_user = jwt_service.verify_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    """Get all items in the user's collection"""
    items = db.query(user.CollectionItem).filter(
        user.CollectionItem.user_id == int(current_user["sub"])
    ).all()
    
    # Manually convert database models to response models
    response_items = []
    for item in items:
        # Use the stored image path if available, otherwise fallback to a default path
        image_path = item.image_path if item.image_path else f"{item.user_id}/{item.id}.jpg"
        
        # Create response model with game_id from image_data
        response_item = schemas.CollectionItemResponse(
            id=item.id,
            game_name=item.game_name,
            image_path=image_path,
            created_at=item.created_at,
            game_id=item.image_data,  # Use image_data as game_id
            shelf=item.shelf,
            case=item.case
        )
        response_items.append(response_item)
    
    return response_items

@router.post("/items", response_model=schemas.CollectionItemResponse)
def add_collection_item(
    item: schemas.CollectionItemCreate,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    # Extract token from Authorization header if present
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    try:
        # Try to verify the token
        current_user = jwt_service.verify_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    """Add a new item to the user's collection"""
    user_id = int(current_user["sub"])
    
    # Save the image to the filesystem and get the relative path
    image_path = save_base64_image(item.image_data, user_id)
    
    # Look up the game ID from the name
    game_lookup = get_game_lookup()
    game_id = game_lookup.get_game_id(item.game_name)
    
    # Create the collection item with the game ID as image_data and store the image path
    db_item = user.CollectionItem(
        user_id=user_id,
        game_name=item.game_name,
        image_data=game_id,  # Use the game ID from the CSV lookup
        image_path=image_path,  # Store the actual image path
        shelf=item.shelf,  # Store the shelf identifier
        case=item.case  # Store the case identifier
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Create response model with the image path and game_id
    response_item = schemas.CollectionItemResponse(
        id=db_item.id,
        game_name=db_item.game_name,
        image_path=image_path,
        created_at=db_item.created_at,
        game_id=game_id,  # Include the game ID in the response
        shelf=db_item.shelf,
        case=db_item.case
    )
    
    return response_item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection_item(
    item_id: int,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    # Extract token from Authorization header if present
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    try:
        # Try to verify the token
        current_user = jwt_service.verify_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    """Delete an item from the user's collection"""
    db_item = db.query(user.CollectionItem).filter(
        user.CollectionItem.id == item_id,
        user.CollectionItem.user_id == int(current_user["sub"])
    ).first()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in collection"
        )
    
    # Use the stored image path if available, otherwise use a default path
    image_path = db_item.image_path if db_item.image_path else f"{db_item.user_id}/{db_item.id}.jpg"
    
    # Delete the image file from the filesystem
    delete_image(image_path)
    
    # Delete the database record
    db.delete(db_item)
    db.commit()
    return None

@router.put("/items/{item_id}", response_model=schemas.CollectionItemResponse)
def update_collection_item(
    item_id: int,
    item: schemas.CollectionItemUpdate,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    # Extract token from Authorization header if present
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    try:
        # Try to verify the token
        current_user = jwt_service.verify_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

    # Get the existing item
    db_item = db.query(user.CollectionItem).filter(
        user.CollectionItem.id == item_id,
        user.CollectionItem.user_id == int(current_user["sub"])
    ).first()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in collection"
        )

    # Update game name if provided
    if item.game_name is not None:
        # Look up the game ID from the name
        game_lookup = get_game_lookup()
        game_id = game_lookup.get_game_id(item.game_name)
        db_item.game_name = item.game_name
        db_item.image_data = game_id  # Update the game ID

    # Update image if provided
    if item.image_data is not None:
        # Save the new image and get its path
        image_path = save_base64_image(item.image_data, int(current_user["sub"]))
        # Delete the old image if it exists
        if db_item.image_path:
            delete_image(db_item.image_path)
        db_item.image_path = image_path

    db.commit()
    db.refresh(db_item)

    # Create response model
    response_item = schemas.CollectionItemResponse(
        id=db_item.id,
        game_name=db_item.game_name,
        image_path=db_item.image_path,
        created_at=db_item.created_at,
        game_id=db_item.image_data,  # Use image_data as game_id
        shelf=db_item.shelf,
        case=db_item.case
    )

    return response_item

@router.get("/items/{item_id}/image", response_model=dict)
def get_item_image(
    item_id: int,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    # Extract token from Authorization header if present
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    try:
        # Try to verify the token
        current_user = jwt_service.verify_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    """Get the base64 encoded image for a collection item"""
    db_item = db.query(user.CollectionItem).filter(
        user.CollectionItem.id == item_id,
        user.CollectionItem.user_id == int(current_user["sub"])
    ).first()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in collection"
        )
    
    # Use the stored image path if available
    if db_item.image_path:
        # Get the base64 image data from the file system using the stored path
        base64_image = get_base64_image(db_item.image_path)
        if base64_image:
            return {"image_data": f"data:image/jpeg;base64,{base64_image}"}
    
    # Fallback: Try to find any image file for this item
    user_id = int(current_user["sub"])
    user_dir = os.path.join(settings.IMAGES_DIR, str(user_id))
    
    if os.path.exists(user_dir):
        # Look for files that might contain the item id
        for filename in os.listdir(user_dir):
            if filename.endswith('.jpg'):
                # Use this file
                image_path = f"{user_id}/{filename}"
                
                # Get the base64 image data from the file system
                base64_image = get_base64_image(image_path)
                
                if base64_image:
                    # Update the image_path in the database for future use
                    db_item.image_path = image_path
                    db.commit()
                    
                    return {"image_data": f"data:image/jpeg;base64,{base64_image}"}
    
    # If we get here, no image was found
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Image file not found"
    )
