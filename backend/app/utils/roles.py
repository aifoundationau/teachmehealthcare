"""Role-based access control utilities."""

from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.utils.dependencies import get_current_active_user


class RoleChecker:
    """
    FastAPI dependency that checks if the current user has one of the allowed roles.

    Usage:
        @router.post("/", dependencies=[Depends(RoleChecker(["doctor", "admin"]))])
        async def create_something(...):
            ...

    Or as a parameter dependency:
        async def create_something(user: User = Depends(RoleChecker(["doctor"]))):
            ...
    """

    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    async def __call__(self, user: User = Depends(get_current_active_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(self.allowed_roles)}",
            )
        return user


# Convenience instances
require_doctor = RoleChecker(["doctor", "admin"])
require_admin = RoleChecker(["admin"])
require_any_authenticated = RoleChecker(["admin", "doctor", "student"])
