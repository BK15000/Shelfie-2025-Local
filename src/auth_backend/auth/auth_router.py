from fastapi import APIRouter, Depends, HTTPException, status, Response, Header, Body
from sqlalchemy.orm import Session # type: ignore
from typing import List
from jose import jwt # type: ignore
from auth_backend.database import get_db
from auth_backend.models import schemas, user
from auth_backend.auth import jwt_service
from auth_backend.config.settings import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])



@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(user.User).filter(user.User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = jwt_service.get_password_hash(user_data.password)
    db_user = user.User(
        email=user_data.email,
        password=hashed_password,
        gpu_endpoint=user_data.gpu_endpoint,
        openai_api_key=user_data.openai_api_key,
        port=user_data.port
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    print(f"New user registered: {user_data.email} (ID: {db_user.id})")
    return db_user

@router.post("/login", response_model=schemas.Token)
def login(response: Response, user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # Verify user exists
    db_user = db.query(user.User).filter(user.User.email == user_data.email).first()
    if not db_user:
        print(f"Failed login attempt for non-existent user: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not jwt_service.verify_password(user_data.password, db_user.password):
        print(f"Failed login attempt (incorrect password) for user: {user_data.email} (ID: {db_user.id})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create tokens
    access_token, refresh_token = jwt_service.create_tokens(db_user.id)
    
    # Set cookies
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        max_age=60 * 24 * 7,  # 7 days
        samesite="lax"
    )
    
    print(f"User logged in: {db_user.email} (ID: {db_user.id})")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=schemas.Token)
def refresh_token(response: Response, request_data: dict = Body(...), db: Session = Depends(get_db)):
    try:
        # Extract refresh token from request body
        if not request_data or "refresh_token" not in request_data:
            print("Refresh token missing from request body")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Refresh token is required"
            )
            
        refresh_token = request_data["refresh_token"]
        
        # Strip quotes if they exist
        if isinstance(refresh_token, str) and refresh_token.startswith('"') and refresh_token.endswith('"'):
            refresh_token = refresh_token[1:-1]
        
        print(f"Processing refresh token: {refresh_token[:10]}...")
            
        payload = jwt_service.verify_token(refresh_token)
        user_id = int(payload.get("sub"))
        
        # Verify user exists
        db_user = db.query(user.User).filter(user.User.id == user_id).first()
        if not db_user:
            print(f"Token refresh attempt for non-existent user ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Create new tokens
        access_token, new_refresh_token = jwt_service.create_tokens(db_user.id)
        
        # Update refresh token cookie
        response.set_cookie(
            "refresh_token",
            new_refresh_token,
            httponly=True,
            max_age=60 * 24 * 7,  # 7 days
            samesite="lax"
        )
        
        print(f"Token refreshed for user: {db_user.email} (ID: {db_user.id})")
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        print(f"Invalid refresh token attempt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid refresh token: {str(e)}"
        )


@router.get("/gpu-endpoint", response_model=schemas.UserResponse)
def get_gpu_endpoint(
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
    db_user = db.query(user.User).filter(user.User.id == int(current_user["sub"])).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return db_user

@router.put("/gpu-endpoint", response_model=schemas.UserResponse)
def update_gpu_endpoint(
    gpu_data: schemas.UserUpdate,
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
    db_user = db.query(user.User).filter(user.User.id == int(current_user["sub"])).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if gpu_data.gpu_endpoint:
        db_user.gpu_endpoint = gpu_data.gpu_endpoint
    
    if gpu_data.openai_api_key is not None:
        db_user.openai_api_key = gpu_data.openai_api_key
    
    if gpu_data.port is not None:
        db_user.port = gpu_data.port
    
    db.commit()
    db.refresh(db_user)
    
    return db_user


# Logout is now handled client-side by clearing AsyncStorage and redirecting
