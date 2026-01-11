"""
SECURE Database Routes for UltraThink Drugs Platform

This file demonstrates SECURE implementation of database routes with:
- JWT authentication
- Authorization checks (ownership verification)
- Input validation
- Secure response models (no password exposure)
- Proper error handling

SECURITY IMPROVEMENTS over database_routes_example.py:
1. get_current_user_id() extracts user from JWT instead of hardcoded UUID
2. All endpoints verify ownership before returning data
3. Uses SecureUserResponse to exclude hashed_password
4. Validates all UUID inputs with validate_uuid_format()
5. All repositories use secure implementations with field whitelisting

To use these routes:
    from database_routes_secure import router as secure_db_router
    app.include_router(secure_db_router, prefix="/api/v1", tags=["database-secure"])
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Annotated
from pydantic import BaseModel, Field
import uuid
import jwt
from datetime import datetime, timedelta

from database import get_db
from database.repositories import MoleculeRepository, ProjectRepository, UserRepository, PredictionRepository
from database.security import (
    check_project_ownership,
    check_molecule_ownership,
    SecureUserResponse,
    SecureProjectResponse,
    SecureMoleculeResponse,
    validate_uuid_format
)

router = APIRouter()
security = HTTPBearer()

# JWT Configuration (should be in environment variables)
SECRET_KEY = "your-secret-key-here"  # TODO: Move to environment variable
ALGORITHM = "HS256"


# ===== AUTHENTICATION =====

def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> uuid.UUID:
    """
    Extract and validate user ID from JWT token.

    Args:
        credentials: JWT token from Authorization header

    Returns:
        UUID of the authenticated user

    Raises:
        HTTPException: If token is invalid or expired

    Security: This replaces hardcoded user IDs with real authentication
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")

        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return uuid.UUID(user_id_str)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_access_token(user_id: uuid.UUID, expires_delta: timedelta = timedelta(hours=24)) -> str:
    """
    Create a JWT access token for a user.

    Args:
        user_id: UUID of the user
        expires_delta: Token expiration time

    Returns:
        Encoded JWT token
    """
    to_encode = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + expires_delta
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ===== REQUEST/RESPONSE MODELS =====

class ProjectCreate(BaseModel):
    """Request model for creating a project"""
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    disease_target: Optional[str] = Field(None, description="Target disease")


class MoleculeCreate(BaseModel):
    """Request model for creating a molecule"""
    project_id: str = Field(..., description="UUID of the project")
    smiles: str = Field(..., min_length=1, max_length=500, description="SMILES string")
    name: Optional[str] = Field(None, description="Molecule name")
    generation_method: Optional[str] = Field("manual", description="Generation method")


# ===== PROJECT ENDPOINTS =====

@router.post("/projects", status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new drug discovery project (SECURE).

    Security:
    - Requires JWT authentication
    - Uses authenticated user's ID instead of hardcoded value
    - Repository validates input and handles errors

    Example:
        POST /api/v1/projects
        Authorization: Bearer <jwt_token>
        {
            "name": "Alzheimer's Drug Discovery",
            "description": "Targeting BACE1 protein",
            "disease_target": "Alzheimer's Disease"
        }
    """
    repo = ProjectRepository(db)

    # Security: Use authenticated user's ID
    project_data = {
        "user_id": current_user_id,
        **project.model_dump()
    }

    # Repository handles validation and IntegrityError
    new_project = await repo.create(project_data)

    # Return secure response
    return SecureProjectResponse.from_project(new_project)


@router.get("/projects")
async def list_projects(
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    List all projects for the authenticated user (SECURE).

    Security:
    - Requires JWT authentication
    - Only returns projects owned by authenticated user
    - Cannot access other users' projects

    Example:
        GET /api/v1/projects?limit=10&offset=0
        Authorization: Bearer <jwt_token>
    """
    repo = ProjectRepository(db)

    # Security: Only get projects for authenticated user
    projects = await repo.get_by_user(current_user_id, limit=limit, offset=offset)

    return [SecureProjectResponse.from_project(p) for p in projects]


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific project by ID (SECURE).

    Security:
    - Requires JWT authentication
    - Verifies user owns the project before returning data
    - Returns 403 Forbidden if not authorized

    Example:
        GET /api/v1/projects/123e4567-e89b-12d3-a456-426614174000
        Authorization: Bearer <jwt_token>
    """
    repo = ProjectRepository(db)

    # Security: Validate UUID format
    project_uuid = validate_uuid_format(project_id, "project_id")

    project = await repo.get_by_id(project_uuid)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Security: CRITICAL - Verify ownership before returning data
    check_project_ownership(project, current_user_id)

    return SecureProjectResponse.from_project(project)


@router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    updates: dict,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    """
    Update a project (SECURE).

    Security:
    - Requires JWT authentication
    - Verifies user owns the project
    - Repository uses field whitelisting to prevent mass assignment

    Example:
        PUT /api/v1/projects/123e4567-e89b-12d3-a456-426614174000
        Authorization: Bearer <jwt_token>
        {
            "name": "Updated Project Name",
            "description": "Updated description"
        }
    """
    repo = ProjectRepository(db)

    # Security: Validate UUID format
    project_uuid = validate_uuid_format(project_id, "project_id")

    # Get project first
    project = await repo.get_by_id(project_uuid)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Security: CRITICAL - Verify ownership
    check_project_ownership(project, current_user_id)

    # Security: Repository handles field whitelisting
    updated_project = await repo.update(project_uuid, updates)

    return SecureProjectResponse.from_project(updated_project)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a project (SECURE).

    Security:
    - Requires JWT authentication
    - Verifies user owns the project before deleting

    Example:
        DELETE /api/v1/projects/123e4567-e89b-12d3-a456-426614174000
        Authorization: Bearer <jwt_token>
    """
    repo = ProjectRepository(db)

    # Security: Validate UUID format
    project_uuid = validate_uuid_format(project_id, "project_id")

    # Get project first to verify ownership
    project = await repo.get_by_id(project_uuid)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Security: CRITICAL - Verify ownership before deletion
    check_project_ownership(project, current_user_id)

    await repo.delete(project_uuid)
    return None


# ===== MOLECULE ENDPOINTS =====

@router.post("/molecules", status_code=status.HTTP_201_CREATED)
async def create_molecule(
    molecule: MoleculeCreate,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new molecule (SECURE).

    Security:
    - Requires JWT authentication
    - Uses authenticated user's ID
    - Validates project ownership
    - Repository validates SMILES and handles errors

    Example:
        POST /api/v1/molecules
        Authorization: Bearer <jwt_token>
        {
            "project_id": "123e4567-e89b-12d3-a456-426614174000",
            "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",
            "name": "Aspirin"
        }
    """
    project_repo = ProjectRepository(db)
    molecule_repo = MoleculeRepository(db)

    # Security: Validate project UUID
    project_uuid = validate_uuid_format(molecule.project_id, "project_id")

    # Security: Verify user owns the project
    project = await project_repo.get_by_id(project_uuid)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    check_project_ownership(project, current_user_id)

    # Security: Use authenticated user's ID
    molecule_data = {
        "user_id": current_user_id,
        "project_id": project_uuid,
        "smiles": molecule.smiles,
        "name": molecule.name,
        "generation_method": molecule.generation_method
    }

    # Repository handles SMILES validation and IntegrityError
    new_molecule = await molecule_repo.create(molecule_data)

    return SecureMoleculeResponse.from_molecule(new_molecule)


@router.get("/projects/{project_id}/molecules")
async def list_project_molecules(
    project_id: str,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    List all molecules in a project (SECURE).

    Security:
    - Requires JWT authentication
    - Verifies user owns the project
    - Only returns molecules the user is authorized to see

    Example:
        GET /api/v1/projects/123e4567-e89b-12d3-a456-426614174000/molecules
        Authorization: Bearer <jwt_token>
    """
    project_repo = ProjectRepository(db)
    molecule_repo = MoleculeRepository(db)

    # Security: Validate UUID format
    project_uuid = validate_uuid_format(project_id, "project_id")

    # Security: Verify project ownership
    project = await project_repo.get_by_id(project_uuid)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    check_project_ownership(project, current_user_id)

    # Now safe to return molecules
    molecules = await molecule_repo.get_by_project(project_uuid, limit=limit, offset=offset)

    return [SecureMoleculeResponse.from_molecule(m) for m in molecules]


@router.get("/molecules/{molecule_id}")
async def get_molecule(
    molecule_id: str,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific molecule by ID (SECURE).

    Security:
    - Requires JWT authentication
    - Verifies user owns the molecule

    Example:
        GET /api/v1/molecules/123e4567-e89b-12d3-a456-426614174000
        Authorization: Bearer <jwt_token>
    """
    repo = MoleculeRepository(db)

    # Security: Validate UUID format
    molecule_uuid = validate_uuid_format(molecule_id, "molecule_id")

    molecule = await repo.get_by_id(molecule_uuid)
    if not molecule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Molecule not found"
        )

    # Security: CRITICAL - Verify ownership
    check_molecule_ownership(molecule, current_user_id)

    return SecureMoleculeResponse.from_molecule(molecule)


# ===== USER ENDPOINTS =====

@router.get("/users/me")
async def get_current_user(
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user's profile (SECURE).

    Security:
    - Requires JWT authentication
    - Uses SecureUserResponse to exclude hashed_password

    Example:
        GET /api/v1/users/me
        Authorization: Bearer <jwt_token>
    """
    repo = UserRepository(db)

    user = await repo.get_by_id(current_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Security: CRITICAL - Never return hashed_password
    return SecureUserResponse.from_user(user)


@router.put("/users/me")
async def update_current_user(
    updates: dict,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile (SECURE).

    Security:
    - Requires JWT authentication
    - User can only update their own profile
    - Repository uses field whitelisting (only full_name, institution)
    - Cannot update password, tier, or is_active through this endpoint

    Example:
        PUT /api/v1/users/me
        Authorization: Bearer <jwt_token>
        {
            "full_name": "Dr. Jane Smith",
            "institution": "MIT"
        }
    """
    repo = UserRepository(db)

    # Security: Repository enforces field whitelisting (is_admin=False)
    updated_user = await repo.update(current_user_id, updates, is_admin=False)

    # Security: Never return hashed_password
    return SecureUserResponse.from_user(updated_user)


# ===== EXAMPLE: AUTHENTICATION ENDPOINT =====

class LoginRequest(BaseModel):
    """Login request model"""
    email: str
    password: str


@router.post("/auth/login")
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT token.

    NOTE: This is a simplified example. Production systems should:
    - Rate limit login attempts (5 per minute)
    - Use bcrypt to verify password hashes
    - Implement account lockout after failed attempts
    - Log authentication attempts
    - Use HTTPS only

    Example:
        POST /api/v1/auth/login
        {
            "email": "user@example.com",
            "password": "password123"
        }

    Returns:
        {
            "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
            "token_type": "bearer",
            "user": {...}
        }
    """
    repo = UserRepository(db)

    # Get user by email
    user = await repo.get_by_email(credentials.email)
    if not user:
        # Security: Generic error message (don't reveal if email exists)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # TODO: Verify password with bcrypt
    # import bcrypt
    # if not bcrypt.checkpw(credentials.password.encode(), user.hashed_password.encode()):
    #     raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create JWT token
    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": SecureUserResponse.from_user(user)
    }


# ===== COMPARISON WITH INSECURE VERSION =====

"""
SECURITY IMPROVEMENTS SUMMARY:

1. Authentication:
   ❌ Old: user_id = "00000000-0000-0000-0000-000000000001"  # Hardcoded
   ✅ New: current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)]

2. Authorization:
   ❌ Old: No ownership checks - anyone can access any data
   ✅ New: check_project_ownership(project, current_user_id) on all endpoints

3. Response Models:
   ❌ Old: Returns raw model (includes hashed_password for User)
   ✅ New: Uses SecureUserResponse.from_user() (excludes sensitive fields)

4. Input Validation:
   ❌ Old: No UUID validation
   ✅ New: validate_uuid_format() catches malformed UUIDs

5. Error Handling:
   ❌ Old: No IntegrityError handling (crashes on duplicates)
   ✅ New: Repositories handle IntegrityError with user-friendly messages

6. Field Whitelisting:
   ❌ Old: Can update any field via setattr()
   ✅ New: Repository enforces UPDATEABLE_FIELDS whitelist
"""
