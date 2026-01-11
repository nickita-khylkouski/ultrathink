"""
Example Database Routes for UltraThink Drugs Platform

This file demonstrates how to use the database repositories in FastAPI endpoints.
These routes can be added to main.py or imported as a router.

To add these to main.py:
    from database_routes_example import router as db_router
    app.include_router(db_router, prefix="/api/v1", tags=["database"])
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid

from database import get_db
from database.repositories import MoleculeRepository, ProjectRepository, UserRepository, PredictionRepository

router = APIRouter()


# ===== REQUEST/RESPONSE MODELS =====

class ProjectCreate(BaseModel):
    """Request model for creating a project"""
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    disease_target: Optional[str] = Field(None, description="Target disease (e.g., Alzheimer's)")


class ProjectResponse(BaseModel):
    """Response model for project data"""
    id: str
    user_id: str
    name: str
    description: Optional[str]
    disease_target: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class MoleculeCreate(BaseModel):
    """Request model for creating a molecule"""
    project_id: str = Field(..., description="UUID of the project")
    smiles: str = Field(..., min_length=1, max_length=500, description="SMILES string")
    name: Optional[str] = Field(None, description="Molecule name")
    generation_method: Optional[str] = Field("manual", description="Generation method")


class MoleculeResponse(BaseModel):
    """Response model for molecule data"""
    id: str
    project_id: str
    smiles: str
    name: Optional[str]
    molecular_weight: Optional[float]
    logp: Optional[float]
    qed: Optional[float]
    created_at: str

    class Config:
        from_attributes = True


# ===== PROJECT ENDPOINTS =====

@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    user_id: str = "00000000-0000-0000-0000-000000000001",  # TODO: Get from authentication
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new drug discovery project.

    Example:
        POST /api/v1/projects
        {
            "name": "Alzheimer's Drug Discovery",
            "description": "Targeting BACE1 protein",
            "disease_target": "Alzheimer's Disease"
        }
    """
    repo = ProjectRepository(db)

    project_data = {
        "user_id": uuid.UUID(user_id),
        **project.model_dump()
    }

    new_project = await repo.create(project_data)

    return ProjectResponse(
        id=str(new_project.id),
        user_id=str(new_project.user_id),
        name=new_project.name,
        description=new_project.description,
        disease_target=new_project.disease_target,
        created_at=new_project.created_at.isoformat()
    )


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    user_id: str = "00000000-0000-0000-0000-000000000001",  # TODO: Get from authentication
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    List all projects for the current user.

    Example:
        GET /api/v1/projects?limit=10&offset=0
    """
    repo = ProjectRepository(db)
    projects = await repo.get_by_user(uuid.UUID(user_id), limit=limit, offset=offset)

    return [
        ProjectResponse(
            id=str(p.id),
            user_id=str(p.user_id),
            name=p.name,
            description=p.description,
            disease_target=p.disease_target,
            created_at=p.created_at.isoformat()
        )
        for p in projects
    ]


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific project by ID.

    Example:
        GET /api/v1/projects/123e4567-e89b-12d3-a456-426614174000
    """
    repo = ProjectRepository(db)

    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )

    project = await repo.get_by_id(project_uuid)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )

    return ProjectResponse(
        id=str(project.id),
        user_id=str(project.user_id),
        name=project.name,
        description=project.description,
        disease_target=project.disease_target,
        created_at=project.created_at.isoformat()
    )


@router.get("/projects/{project_id}/summary")
async def get_project_summary(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get project summary with molecule and protein counts.

    Example:
        GET /api/v1/projects/123e4567-e89b-12d3-a456-426614174000/summary
    """
    repo = ProjectRepository(db)

    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )

    summary = await repo.get_summary(project_uuid)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )

    return summary


# ===== MOLECULE ENDPOINTS =====

@router.post("/molecules", response_model=MoleculeResponse, status_code=status.HTTP_201_CREATED)
async def create_molecule(
    molecule: MoleculeCreate,
    user_id: str = "00000000-0000-0000-0000-000000000001",  # TODO: Get from authentication
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new molecule with auto-calculated properties.

    Example:
        POST /api/v1/molecules
        {
            "project_id": "123e4567-e89b-12d3-a456-426614174000",
            "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",
            "name": "Aspirin",
            "generation_method": "manual"
        }

    Properties like molecular weight, LogP, and QED are automatically calculated.
    """
    repo = MoleculeRepository(db)

    # Validate SMILES
    try:
        from rdkit import Chem
        mol = Chem.MolFromSmiles(molecule.smiles)
        if mol is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid SMILES: {molecule.smiles}"
            )
    except ImportError:
        pass  # Skip validation if RDKit not available

    # Check for duplicate SMILES
    existing = await repo.get_by_smiles(molecule.smiles)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Molecule with SMILES '{molecule.smiles}' already exists (ID: {existing.id})"
        )

    molecule_data = {
        "user_id": uuid.UUID(user_id),
        **molecule.model_dump()
    }
    molecule_data["project_id"] = uuid.UUID(molecule_data["project_id"])

    new_molecule = await repo.create(molecule_data)

    return MoleculeResponse(
        id=str(new_molecule.id),
        project_id=str(new_molecule.project_id),
        smiles=new_molecule.smiles,
        name=new_molecule.name,
        molecular_weight=new_molecule.molecular_weight,
        logp=new_molecule.logp,
        qed=new_molecule.qed,
        created_at=new_molecule.created_at.isoformat()
    )


@router.get("/projects/{project_id}/molecules", response_model=List[MoleculeResponse])
async def list_project_molecules(
    project_id: str,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    List all molecules in a project.

    Example:
        GET /api/v1/projects/123e4567-e89b-12d3-a456-426614174000/molecules?limit=50
    """
    repo = MoleculeRepository(db)

    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )

    molecules = await repo.get_by_project(project_uuid, limit=limit, offset=offset)

    return [
        MoleculeResponse(
            id=str(m.id),
            project_id=str(m.project_id),
            smiles=m.smiles,
            name=m.name,
            molecular_weight=m.molecular_weight,
            logp=m.logp,
            qed=m.qed,
            created_at=m.created_at.isoformat()
        )
        for m in molecules
    ]


@router.get("/projects/{project_id}/molecules/statistics")
async def get_molecule_statistics(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get statistical summary of molecules in a project.

    Example:
        GET /api/v1/projects/123e4567-e89b-12d3-a456-426614174000/molecules/statistics

    Returns:
        {
            "total_count": 150,
            "avg_molecular_weight": 342.5,
            "avg_logp": 2.3,
            "avg_qed": 0.72,
            "generation_methods": {"MolGAN": 100, "manual": 50}
        }
    """
    repo = MoleculeRepository(db)

    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )

    return await repo.get_statistics(project_uuid)


@router.post("/molecules/search")
async def search_molecules(
    filters: dict,
    user_id: str = "00000000-0000-0000-0000-000000000001",  # TODO: Get from authentication
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """
    Search molecules with property filters.

    Example:
        POST /api/v1/molecules/search
        {
            "min_mw": 300,
            "max_mw": 500,
            "min_qed": 0.6,
            "generation_method": "MolGAN"
        }
    """
    repo = MoleculeRepository(db)

    molecules = await repo.search(
        user_id=uuid.UUID(user_id),
        filters=filters,
        limit=limit
    )

    return [
        MoleculeResponse(
            id=str(m.id),
            project_id=str(m.project_id),
            smiles=m.smiles,
            name=m.name,
            molecular_weight=m.molecular_weight,
            logp=m.logp,
            qed=m.qed,
            created_at=m.created_at.isoformat()
        )
        for m in molecules
    ]


# ===== PREDICTION ENDPOINTS =====

@router.post("/molecules/{molecule_id}/predictions")
async def add_prediction(
    molecule_id: str,
    prediction_type: str,
    results: dict,
    confidence_score: Optional[float] = None,
    model_version: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Add an ADMET prediction for a molecule.

    Example:
        POST /api/v1/molecules/123e4567-e89b-12d3-a456-426614174000/predictions
        {
            "prediction_type": "absorption",
            "results": {
                "bioavailability": 0.85,
                "caco2_permeability": 1.2e-5
            },
            "confidence_score": 0.92,
            "model_version": "chemprop-v2.1.0"
        }
    """
    repo = PredictionRepository(db)

    try:
        mol_uuid = uuid.UUID(molecule_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid molecule ID format"
        )

    prediction_data = {
        "molecule_id": mol_uuid,
        "prediction_type": prediction_type,
        "results": results,
        "confidence_score": confidence_score,
        "model_version": model_version
    }

    prediction = await repo.create(prediction_data)

    return {
        "id": str(prediction.id),
        "molecule_id": str(prediction.molecule_id),
        "prediction_type": prediction.prediction_type,
        "results": prediction.results,
        "confidence_score": prediction.confidence_score,
        "model_version": prediction.model_version,
        "created_at": prediction.created_at.isoformat()
    }


@router.get("/molecules/{molecule_id}/predictions")
async def get_molecule_predictions(
    molecule_id: str,
    prediction_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all predictions for a molecule.

    Example:
        GET /api/v1/molecules/123e4567-e89b-12d3-a456-426614174000/predictions
        GET /api/v1/molecules/123e4567-e89b-12d3-a456-426614174000/predictions?prediction_type=absorption
    """
    repo = PredictionRepository(db)

    try:
        mol_uuid = uuid.UUID(molecule_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid molecule ID format"
        )

    predictions = await repo.get_by_molecule(mol_uuid, prediction_type=prediction_type)

    return [
        {
            "id": str(p.id),
            "prediction_type": p.prediction_type,
            "results": p.results,
            "confidence_score": p.confidence_score,
            "model_version": p.model_version,
            "created_at": p.created_at.isoformat()
        }
        for p in predictions
    ]
