"""Authentication routes: register, login, and user profile."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    SupporterRegister,
    SupporterProfileUpdate,
)
from app.models.user import User
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.utils.dependencies import get_db, get_current_active_user

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.
    """
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Validate role - default is supporter
    valid_roles = ("admin", "doctor", "student", "supporter")
    role = user_data.role if user_data.role in valid_roles else "supporter"

    # Create user
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=role,
        specialization=user_data.specialization,
        profession=user_data.profession,
        phone_number=user_data.phone_number,
        address=user_data.address,
        supporter_comments=user_data.supporter_comments,
        app_tag=user_data.app_tag or "healthlms",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/supporter-register", response_model=Token)
async def supporter_register(supporter_data: SupporterRegister, db: AsyncSession = Depends(get_db)):
    """
    Register or link a Google OAuth user with secondary backup password and personal details.
    
    Stores in database and maps to one user account.
    Assigns role 'supporter' on first registration and tags with 'healthlms'.
    The provided password serves as a secondary backup login if Google fails.
    """
    # Check if user already exists by email or firebase_uid
    query = select(User).where((User.email == supporter_data.email))
    if supporter_data.firebase_uid:
        query = select(User).where(
            (User.email == supporter_data.email) | (User.firebase_uid == supporter_data.firebase_uid)
        )

    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user:
        # Existing account: update secondary password backup and personal details
        if supporter_data.password:
            user.hashed_password = hash_password(supporter_data.password)
        if supporter_data.full_name:
            user.full_name = supporter_data.full_name
        if supporter_data.profession:
            user.profession = supporter_data.profession
        if supporter_data.phone_number:
            user.phone_number = supporter_data.phone_number
        if supporter_data.address:
            user.address = supporter_data.address
        if supporter_data.comments:
            user.supporter_comments = supporter_data.comments
        if supporter_data.firebase_uid:
            user.firebase_uid = supporter_data.firebase_uid
        # Ensure app tag is healthlms
        user.app_tag = "healthlms"
        # If user had no specific role, give supporter
        if not user.role:
            user.role = "supporter"
    else:
        # First-time registration: assign role of 'supporter'
        user = User(
            email=supporter_data.email,
            hashed_password=hash_password(supporter_data.password) if supporter_data.password else "",
            full_name=supporter_data.full_name,
            role="supporter",
            profession=supporter_data.profession,
            phone_number=supporter_data.phone_number,
            address=supporter_data.address,
            supporter_comments=supporter_data.comments,
            app_tag="healthlms",
            firebase_uid=supporter_data.firebase_uid,
            is_verified=True,
        )
        db.add(user)

    await db.flush()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Authenticate a user via email and password (including secondary backup password).
    """
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """Get the profile of the currently authenticated user."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    profile_data: SupporterProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update personal details for the authenticated supporter."""
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.profession is not None:
        current_user.profession = profile_data.profession
    if profile_data.phone_number is not None:
        current_user.phone_number = profile_data.phone_number
    if profile_data.address is not None:
        current_user.address = profile_data.address
    if profile_data.comments is not None:
        current_user.supporter_comments = profile_data.comments

    current_user.app_tag = "healthlms"
    await db.flush()
    await db.refresh(current_user)
    return current_user
