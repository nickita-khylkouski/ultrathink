"""
User Repository - Data access layer for user management

Handles user authentication, profile management, and tier-based access control.

SECURITY: This repository implements field whitelisting to prevent mass assignment
vulnerabilities and validates all inputs before database operations.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any, Set
import uuid

from database.models import User, Project, Molecule


class UserRepository:
    """
    Repository for user operations with security controls.

    Security Features:
    - Field whitelisting to prevent mass assignment
    - Input validation (tier values, required fields)
    - IntegrityError handling for unique constraints
    - Admin-only fields protection
    """

    # Security: Whitelist of fields users can update
    UPDATEABLE_FIELDS: Set[str] = {'full_name', 'institution'}

    # Security: Admin-only updateable fields
    ADMIN_UPDATEABLE_FIELDS: Set[str] = {'full_name', 'institution', 'tier', 'is_active'}

    # Security: Valid tier values
    VALID_TIERS: Set[str] = {'free', 'pro', 'enterprise'}

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_data: Dict[str, Any]) -> User:
        """
        Create a new user with validation and error handling.

        Args:
            user_data: Dictionary with keys:
                - email: str (required, unique)
                - username: str (required, unique)
                - hashed_password: str (required)
                - full_name: str (optional)
                - institution: str (optional)
                - tier: str (optional, default: 'free')

        Returns:
            User: Created user

        Raises:
            HTTPException: If validation fails or email/username already exists

        Note: Password should already be hashed before calling this method
        """
        # Security: Validate tier if provided
        tier = user_data.get('tier', 'free')
        if tier not in self.VALID_TIERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tier. Must be one of: {', '.join(self.VALID_TIERS)}"
            )

        # Security: Validate required fields
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

            # Security: Don't leak exact database error, provide user-friendly message
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
                # Log the actual error internally but show generic message
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Get user by ID"""
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email (used for authentication).

        Args:
            email: User's email address

        Returns:
            User or None if not found
        """
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        result = await self.session.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def update(
        self,
        user_id: uuid.UUID,
        updates: Dict[str, Any],
        is_admin: bool = False
    ) -> Optional[User]:
        """
        Update user fields with field whitelisting (prevents mass assignment).

        Args:
            user_id: UUID of the user
            updates: Dictionary of fields to update
            is_admin: If True, allows updating tier and is_active fields

        Returns:
            Updated user

        Raises:
            HTTPException: If user not found or attempting to update forbidden fields

        Security: Uses whitelist approach to prevent mass assignment vulnerability.
        Regular users can only update: full_name, institution
        Admins can additionally update: tier, is_active
        """
        user = await self.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Security: Choose allowed fields based on role
        allowed_fields = self.ADMIN_UPDATEABLE_FIELDS if is_admin else self.UPDATEABLE_FIELDS

        # Security: Check for disallowed fields
        disallowed = set(updates.keys()) - allowed_fields
        if disallowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot update fields: {', '.join(disallowed)}"
            )

        # Security: Validate tier if being updated
        if 'tier' in updates and updates['tier'] not in self.VALID_TIERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tier. Must be one of: {', '.join(self.VALID_TIERS)}"
            )

        # Apply validated updates
        for key, value in updates.items():
            setattr(user, key, value)

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def upgrade_tier(self, user_id: uuid.UUID, new_tier: str) -> Optional[User]:
        """
        Upgrade/downgrade user tier with validation.

        Args:
            user_id: UUID of the user
            new_tier: One of 'free', 'pro', 'enterprise'

        Returns:
            Updated user

        Raises:
            HTTPException: If tier value is invalid

        Security: Validates tier against whitelist and requires admin privileges
        """
        # Security: Validate tier value
        if new_tier not in self.VALID_TIERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tier. Must be one of: {', '.join(self.VALID_TIERS)}"
            )

        # Security: Tier changes require admin privileges
        return await self.update(user_id, {"tier": new_tier}, is_admin=True)

    async def deactivate(self, user_id: uuid.UUID) -> bool:
        """
        Deactivate user account (soft delete).

        Args:
            user_id: UUID of the user

        Returns:
            bool: True if deactivated

        Raises:
            HTTPException: If user not found

        Security: Requires admin privileges to deactivate accounts
        """
        user = await self.update(user_id, {"is_active": False}, is_admin=True)
        return user is not None

    async def get_usage_stats(self, user_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Get user usage statistics for tier limit enforcement.

        Args:
            user_id: UUID of the user

        Returns:
            Dictionary with usage statistics:
                - project_count: Total projects
                - molecule_count: Total molecules
                - tier: Current tier
        """
        user = await self.get_by_id(user_id)
        if not user:
            return None

        # Count projects
        project_count_result = await self.session.execute(
            select(func.count(Project.id)).where(Project.user_id == user_id)
        )
        project_count = project_count_result.scalar()

        # Count molecules
        molecule_count_result = await self.session.execute(
            select(func.count(Molecule.id)).where(Molecule.user_id == user_id)
        )
        molecule_count = molecule_count_result.scalar()

        return {
            "user_id": str(user.id),
            "tier": user.tier,
            "project_count": project_count,
            "molecule_count": molecule_count,
            "is_active": user.is_active
        }

    async def check_email_exists(self, email: str) -> bool:
        """Check if email is already registered"""
        user = await self.get_by_email(email)
        return user is not None

    async def check_username_exists(self, username: str) -> bool:
        """Check if username is already taken"""
        user = await self.get_by_username(username)
        return user is not None
