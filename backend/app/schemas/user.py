"""Pydantic schemas for user authentication and profiles."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str
    full_name: str
    role: str = "supporter"  # supporter, doctor, student, admin
    specialization: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    supporter_comments: Optional[str] = None
    app_tag: str = "healthlms"


class SupporterRegister(BaseModel):
    """Schema for supporter registration with Google auth and backup password."""
    email: EmailStr
    password: Optional[str] = None  # Secondary login password backup (optional)
    full_name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    comments: Optional[str] = None
    firebase_uid: Optional[str] = None
    role: str = "supporter"
    app_tag: str = "healthlms"


class SupporterProfileUpdate(BaseModel):
    """Schema for updating personal supporter details."""
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    comments: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user data in API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    specialization: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    supporter_comments: Optional[str] = None
    app_tag: str = "healthlms"
    firebase_uid: Optional[str] = None
    is_verified: bool
    created_at: datetime


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
