"""
Security utilities for database layer

This module provides:
- Input validation functions
- Authorization helpers
- Secure response models

All security-critical operations should use these utilities to ensure
consistent security controls across the application.
"""

from fastapi import HTTPException, status
from typing import Any
import uuid
import re

from database.models import User, Project, Molecule


# ===== INPUT VALIDATION =====

def validate_smiles(smiles: str) -> None:
    """
    Validate SMILES string format.

    Args:
        smiles: SMILES string to validate

    Raises:
        HTTPException: If SMILES is invalid

    Security: Prevents injection attacks and ensures data quality
    """
    if not smiles or len(smiles) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMILES must be between 1 and 500 characters"
        )

    # Security: Ensure only printable ASCII characters
    if not all(c.isprintable() for c in smiles):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMILES contains invalid characters"
        )

    # Security: Basic validation (comprehensive validation uses RDKit in repository)
    dangerous_patterns = ['<script', 'javascript:', 'onerror=']
    smiles_lower = smiles.lower()
    if any(pattern in smiles_lower for pattern in dangerous_patterns):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMILES contains potentially dangerous content"
        )


def validate_project_name(name: str) -> None:
    """
    Validate project name.

    Args:
        name: Project name to validate

    Raises:
        HTTPException: If name is invalid

    Security: Prevents XSS attacks via project names
    """
    if not name or len(name) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project name must be between 1 and 255 characters"
        )

    # Security: Prevent XSS by blocking HTML-like characters
    dangerous_chars = ['<', '>', '"', "'", '&', '\\']
    if any(char in name for char in dangerous_chars):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project name contains invalid characters (<, >, \", ', &, \\)"
        )


def validate_email(email: str) -> None:
    """
    Validate email format.

    Args:
        email: Email address to validate

    Raises:
        HTTPException: If email is invalid

    Security: Prevents malformed emails from being stored
    """
    if not email or len(email) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email must be between 1 and 255 characters"
        )

    # Security: Basic email format validation
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    if not email_pattern.match(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )


def validate_username(username: str) -> None:
    """
    Validate username format.

    Args:
        username: Username to validate

    Raises:
        HTTPException: If username is invalid

    Security: Ensures usernames are alphanumeric and safe
    """
    if not username or len(username) < 3 or len(username) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 3 and 50 characters"
        )

    # Security: Only allow alphanumeric, underscore, and hyphen
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain letters, numbers, underscores, and hyphens"
        )


def validate_uuid_format(uuid_str: str, field_name: str = "ID") -> uuid.UUID:
    """
    Validate and convert UUID string.

    Args:
        uuid_str: UUID string to validate
        field_name: Name of the field for error messages

    Returns:
        uuid.UUID: Validated UUID object

    Raises:
        HTTPException: If UUID format is invalid

    Security: Prevents invalid UUID strings from causing errors
    """
    try:
        return uuid.UUID(uuid_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} format. Must be a valid UUID."
        )


# ===== AUTHORIZATION HELPERS =====

def check_project_ownership(project: Project, user_id: uuid.UUID) -> None:
    """
    Verify that the user owns the specified project.

    Args:
        project: Project object to check
        user_id: UUID of the current user

    Raises:
        HTTPException: If user doesn't own the project (403 Forbidden)

    Security: Prevents unauthorized access to projects
    """
    if project.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to access this project"
        )


def check_molecule_ownership(molecule: Molecule, user_id: uuid.UUID) -> None:
    """
    Verify that the user owns the specified molecule.

    Args:
        molecule: Molecule object to check
        user_id: UUID of the current user

    Raises:
        HTTPException: If user doesn't own the molecule (403 Forbidden)

    Security: Prevents unauthorized access to molecules
    """
    if molecule.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to access this molecule"
        )


def check_self_or_admin(target_user_id: uuid.UUID, current_user_id: uuid.UUID, is_admin: bool = False) -> None:
    """
    Verify that user is accessing their own data or is an admin.

    Args:
        target_user_id: UUID of the user being accessed
        current_user_id: UUID of the current user
        is_admin: Whether current user has admin privileges

    Raises:
        HTTPException: If user is not authorized (403 Forbidden)

    Security: Ensures users can only modify their own data unless admin
    """
    if target_user_id != current_user_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only access your own data"
        )


# ===== SECURE RESPONSE MODELS =====

class SecureUserResponse:
    """
    Secure user response that excludes sensitive fields.

    Security: NEVER returns hashed_password or other sensitive data
    """

    @staticmethod
    def from_user(user: User) -> dict[str, Any]:
        """
        Convert User model to safe response dictionary.

        Args:
            user: User model instance

        Returns:
            Dictionary with non-sensitive user data

        Security: Excludes hashed_password to prevent exposure
        """
        return {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "institution": user.institution,
            "tier": user.tier,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            # SECURITY: hashed_password is NEVER included
        }

    @staticmethod
    def from_users(users: list[User]) -> list[dict[str, Any]]:
        """
        Convert list of User models to safe response dictionaries.

        Args:
            users: List of User model instances

        Returns:
            List of dictionaries with non-sensitive user data
        """
        return [SecureUserResponse.from_user(user) for user in users]


class SecureProjectResponse:
    """
    Secure project response.

    Security: Only returns data the user is authorized to see
    """

    @staticmethod
    def from_project(project: Project) -> dict[str, Any]:
        """
        Convert Project model to response dictionary.

        Args:
            project: Project model instance

        Returns:
            Dictionary with project data
        """
        return {
            "id": str(project.id),
            "user_id": str(project.user_id),
            "name": project.name,
            "description": project.description,
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        }


class SecureMoleculeResponse:
    """
    Secure molecule response.

    Security: Only returns data the user is authorized to see
    """

    @staticmethod
    def from_molecule(molecule: Molecule) -> dict[str, Any]:
        """
        Convert Molecule model to response dictionary.

        Args:
            molecule: Molecule model instance

        Returns:
            Dictionary with molecule data
        """
        return {
            "id": str(molecule.id),
            "project_id": str(molecule.project_id),
            "user_id": str(molecule.user_id),
            "smiles": molecule.smiles,
            "name": molecule.name,
            "molecular_weight": molecule.molecular_weight,
            "logp": molecule.logp,
            "tpsa": molecule.tpsa,
            "num_hba": molecule.num_hba,
            "num_hbd": molecule.num_hbd,
            "num_rotatable_bonds": molecule.num_rotatable_bonds,
            "qed": molecule.qed,
            "created_at": molecule.created_at.isoformat() if molecule.created_at else None,
        }
