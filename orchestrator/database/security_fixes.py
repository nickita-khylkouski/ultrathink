"""
CRITICAL Security Fixes for Database Layer

This module provides secure implementations to replace vulnerable patterns
found in the original code.

ISSUES FIXED:
1. Mass assignment vulnerability
2. Missing authorization checks
3. No input validation
4. Unique constraint violations not handled
5. Password exposure in responses
6. No tier validation
7. Missing error sanitization
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import Dict, Any, Optional, Set
import uuid
from database.models import User, Project, Molecule


# ===== SECURE USER REPOSITORY =====

class SecureUserRepository:
    """
    Secure user repository with proper validation and authorization.

    Fixes:
    - Validates tier values
    - Prevents mass assignment
    - Handles unique constraint violations
    - Sanitizes error messages
    """

    # Allowed fields for update (whitelist approach)
    UPDATEABLE_FIELDS: Set[str] = {'full_name', 'institution'}
    ADMIN_UPDATEABLE_FIELDS: Set[str] = {'full_name', 'institution', 'tier', 'is_active'}
    VALID_TIERS: Set[str] = {'free', 'pro', 'enterprise'}

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_data: Dict[str, Any]) -> User:
        """
        Securely create a user with validation.

        Raises:
            HTTPException: If email/username already exists or invalid data
        """
        # Validate tier if provided
        tier = user_data.get('tier', 'free')
        if tier not in self.VALID_TIERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tier. Must be one of: {', '.join(self.VALID_TIERS)}"
            )

        # Validate required fields
        required = {'email', 'username', 'hashed_password'}
        missing = required - set(user_data.keys())
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required fields: {', '.join(missing)}"
            )

        user = User(**user_data)
        self.session.add(user)

        try:
            await self.session.commit()
            await self.session.refresh(user)
            return user
        except IntegrityError as e:
            await self.session.rollback()

            # Don't leak exact database error
            if 'email' in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered"
                )
            elif 'username' in str(e.orig):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Username already taken"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )

    async def update(
        self,
        user_id: uuid.UUID,
        updates: Dict[str, Any],
        is_admin: bool = False
    ) -> User:
        """
        Securely update user with field whitelist.

        Args:
            user_id: User to update
            updates: Fields to update
            is_admin: If True, allows updating tier and is_active

        Raises:
            HTTPException: If user not found or invalid fields
        """
        user = await self.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Choose allowed fields based on role
        allowed_fields = self.ADMIN_UPDATEABLE_FIELDS if is_admin else self.UPDATEABLE_FIELDS

        # Check for disallowed fields
        disallowed = set(updates.keys()) - allowed_fields
        if disallowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot update fields: {', '.join(disallowed)}"
            )

        # Validate tier if being updated
        if 'tier' in updates and updates['tier'] not in self.VALID_TIERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tier. Must be one of: {', '.join(self.VALID_TIERS)}"
            )

        # Apply updates
        for key, value in updates.items():
            setattr(user, key, value)

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Get user by ID"""
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()


# ===== AUTHORIZATION HELPERS =====

def check_project_ownership(project: Project, user_id: uuid.UUID) -> None:
    """
    Verify user owns the project.

    Raises:
        HTTPException: If user doesn't own the project
    """
    if project.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to access this project"
        )


def check_molecule_ownership(molecule: Molecule, user_id: uuid.UUID) -> None:
    """
    Verify user owns the molecule.

    Raises:
        HTTPException: If user doesn't own the molecule
    """
    if molecule.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to access this molecule"
        )


# ===== SECURE API RESPONSE MODELS =====

class SecureUserResponse:
    """
    User response that excludes sensitive fields.

    NEVER include hashed_password in API responses!
    """

    @staticmethod
    def from_user(user: User) -> Dict[str, Any]:
        """Convert User model to safe response"""
        return {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "institution": user.institution,
            "tier": user.tier,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            # Note: hashed_password is NEVER included
        }


# ===== INPUT VALIDATION =====

def validate_smiles(smiles: str) -> None:
    """
    Validate SMILES string.

    Raises:
        HTTPException: If SMILES is invalid
    """
    if not smiles or len(smiles) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMILES must be between 1 and 500 characters"
        )

    # Basic validation (more comprehensive validation would use RDKit)
    if not all(c.isprintable() for c in smiles):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMILES contains invalid characters"
        )


def validate_project_name(name: str) -> None:
    """
    Validate project name.

    Raises:
        HTTPException: If name is invalid
    """
    if not name or len(name) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project name must be between 1 and 255 characters"
        )

    # Prevent XSS
    dangerous_chars = ['<', '>', '"', "'", '&']
    if any(char in name for char in dangerous_chars):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project name contains invalid characters"
        )


# ===== EXAMPLE SECURE ENDPOINT =====

"""
Example of a secure endpoint with authorization:

from fastapi import Depends
from database import get_db
from typing import Annotated

# This would come from JWT token in real app
def get_current_user_id() -> uuid.UUID:
    '''Extract user ID from JWT token'''
    # TODO: Implement JWT authentication
    raise NotImplementedError("Authentication not implemented")

@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    '''Get project with authorization check'''

    # Get project
    repo = ProjectRepository(db)
    project = await repo.get_by_id(uuid.UUID(project_id))

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # CRITICAL: Check authorization
    check_project_ownership(project, current_user_id)

    # Return safe response
    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at.isoformat()
    }
"""


# ===== RATE LIMITING DECORATOR =====

"""
Example rate limiting (requires Redis):

from functools import wraps
import redis

redis_client = redis.Redis(host='localhost', port=6379)

def rate_limit(max_calls: int, period: int):
    '''
    Rate limit decorator.

    Args:
        max_calls: Maximum calls allowed
        period: Time period in seconds
    '''
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get user ID from kwargs (depends on your auth system)
            user_id = kwargs.get('current_user_id')
            if not user_id:
                return await func(*args, **kwargs)

            key = f"rate_limit:{func.__name__}:{user_id}"
            current = redis_client.get(key)

            if current and int(current) >= max_calls:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Max {max_calls} calls per {period}s"
                )

            # Increment counter
            pipe = redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, period)
            pipe.execute()

            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Usage:
@rate_limit(max_calls=10, period=60)  # 10 calls per minute
async def expensive_operation(...):
    pass
"""
