"""
Project Repository - Data access layer for drug discovery projects

Projects organize molecules, proteins, and predictions for specific
therapeutic targets.

SECURITY: This repository implements input validation and field whitelisting
to prevent security vulnerabilities.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any, Set
import uuid

from database.models import Project, Molecule, ProteinStructure
from database.security import validate_project_name


class ProjectRepository:
    """
    Repository for project operations with security controls.

    Security Features:
    - Input validation for project names
    - Field whitelisting for updates
    - IntegrityError handling
    """

    # Security: Whitelist of fields that can be updated
    UPDATEABLE_FIELDS: Set[str] = {'name', 'description', 'disease_target'}

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, project_data: Dict[str, Any]) -> Project:
        """
        Create a new project with validation.

        Args:
            project_data: Dictionary with keys:
                - user_id: UUID (required)
                - name: str (required)
                - description: str (optional)
                - disease_target: str (optional)

        Returns:
            Project: Created project

        Raises:
            HTTPException: If validation fails or required fields are missing

        Security: Validates project name to prevent XSS attacks
        """
        # Security: Validate required fields
        if 'user_id' not in project_data or 'name' not in project_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: user_id and name are required"
            )

        # Security: Validate project name
        validate_project_name(project_data['name'])

        # Validate description if provided
        if 'description' in project_data and project_data['description']:
            if len(project_data['description']) > 2000:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Description must be 2000 characters or less"
                )

        project = Project(**project_data)
        self.session.add(project)

        try:
            await self.session.commit()
            await self.session.refresh(project)
            return project
        except IntegrityError as e:
            await self.session.rollback()
            # Security: Don't leak database details
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project due to constraint violation"
            )

    async def get_by_id(self, project_id: uuid.UUID) -> Optional[Project]:
        """
        Get project by ID with relationships loaded.

        Args:
            project_id: UUID of the project

        Returns:
            Project or None if not found
        """
        result = await self.session.execute(
            select(Project)
            .where(Project.id == project_id)
            .options(
                selectinload(Project.molecules),
                selectinload(Project.protein_structures)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_user(
        self,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[Project]:
        """
        Get all projects for a user with pagination.

        Args:
            user_id: UUID of the user
            limit: Maximum number of projects to return
            offset: Number of projects to skip

        Returns:
            List of projects ordered by creation date (newest first)
        """
        result = await self.session.execute(
            select(Project)
            .where(Project.user_id == user_id)
            .order_by(Project.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def search(
        self,
        user_id: uuid.UUID,
        search_term: Optional[str] = None
    ) -> List[Project]:
        """
        Search projects by name or disease target.

        Args:
            user_id: UUID of the user (ensures access control)
            search_term: Optional search string (searches name and disease_target)

        Returns:
            List of matching projects
        """
        query = select(Project).where(Project.user_id == user_id)

        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.where(
                (Project.name.ilike(search_pattern)) |
                (Project.disease_target.ilike(search_pattern)) |
                (Project.description.ilike(search_pattern))
            )

        query = query.order_by(Project.created_at.desc())

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update(
        self,
        project_id: uuid.UUID,
        updates: Dict[str, Any]
    ) -> Optional[Project]:
        """
        Update project fields with field whitelisting.

        Args:
            project_id: UUID of the project
            updates: Dictionary of fields to update

        Returns:
            Updated project

        Raises:
            HTTPException: If project not found or attempting to update forbidden fields

        Security: Only allows updating specific fields to prevent mass assignment
        """
        project = await self.get_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        # Security: Check for disallowed fields
        disallowed = set(updates.keys()) - self.UPDATEABLE_FIELDS
        if disallowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot update fields: {', '.join(disallowed)}"
            )

        # Security: Validate name if being updated
        if 'name' in updates:
            validate_project_name(updates['name'])

        # Validate description length if being updated
        if 'description' in updates and updates['description']:
            if len(updates['description']) > 2000:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Description must be 2000 characters or less"
                )

        # Apply validated updates
        for key, value in updates.items():
            setattr(project, key, value)

        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def delete(self, project_id: uuid.UUID) -> bool:
        """
        Delete a project (cascade deletes molecules and proteins).

        Args:
            project_id: UUID of the project

        Returns:
            bool: True if deleted, False if not found
        """
        project = await self.get_by_id(project_id)
        if project:
            await self.session.delete(project)
            await self.session.commit()
            return True
        return False

    async def get_summary(self, project_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Get project summary with counts and statistics.

        Args:
            project_id: UUID of the project

        Returns:
            Dictionary with project info and counts:
                - molecule_count: Total molecules
                - protein_count: Total proteins
                - latest_activity: Most recent creation timestamp
        """
        project = await self.get_by_id(project_id)
        if not project:
            return None

        # Count molecules
        mol_count_result = await self.session.execute(
            select(func.count(Molecule.id)).where(Molecule.project_id == project_id)
        )
        molecule_count = mol_count_result.scalar()

        # Count proteins
        protein_count_result = await self.session.execute(
            select(func.count(ProteinStructure.id)).where(ProteinStructure.project_id == project_id)
        )
        protein_count = protein_count_result.scalar()

        # Latest activity
        latest_mol_result = await self.session.execute(
            select(func.max(Molecule.created_at)).where(Molecule.project_id == project_id)
        )
        latest_activity = latest_mol_result.scalar()

        return {
            "id": str(project.id),
            "name": project.name,
            "description": project.description,
            "disease_target": project.disease_target,
            "molecule_count": molecule_count,
            "protein_count": protein_count,
            "created_at": project.created_at,
            "latest_activity": latest_activity or project.created_at
        }
