"""
Database Test Suite for UltraThink Drugs Platform

Tests all database models, repositories, and operations.

Run with:
    pytest tests/test_database.py -v
    pytest tests/test_database.py::test_molecule_creation -v  # Single test
    pytest tests/test_database.py -k "molecule" -v  # All molecule tests
"""

import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
import uuid
from datetime import datetime

# Import database components
from database.models import Base, User, Project, Molecule, ADMETPrediction
from database.repositories import (
    UserRepository,
    ProjectRepository,
    MoleculeRepository,
    PredictionRepository
)


# ===== TEST DATABASE SETUP =====

TEST_DATABASE_URL = "postgresql+asyncpg://ultrathink:dev_password_change_in_prod@localhost:5432/ultrathink_test"

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def engine():
    """Create async engine for testing"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool  # Don't pool connections in tests
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables after tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def session(engine):
    """Create a new database session for each test"""
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()  # Rollback any uncommitted changes


# ===== TEST FIXTURES =====

@pytest.fixture
async def test_user(session):
    """Create a test user"""
    user = User(
        email="test@ultrathink.com",
        username="testuser",
        hashed_password="hashed_password_here",
        full_name="Test User",
        institution="Test University",
        tier="pro"
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.fixture
async def test_project(session, test_user):
    """Create a test project"""
    project = Project(
        user_id=test_user.id,
        name="Test Alzheimer's Project",
        description="Testing drug discovery for Alzheimer's",
        disease_target="Alzheimer's Disease"
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


@pytest.fixture
async def test_molecule(session, test_user, test_project):
    """Create a test molecule (Aspirin)"""
    molecule = Molecule(
        project_id=test_project.id,
        user_id=test_user.id,
        smiles="CC(=O)OC1=CC=CC=C1C(=O)O",
        name="Aspirin",
        generation_method="manual",
        molecular_weight=180.16,
        logp=1.19,
        qed=0.72
    )
    session.add(molecule)
    await session.commit()
    await session.refresh(molecule)
    return molecule


# ===== USER REPOSITORY TESTS =====

@pytest.mark.asyncio
async def test_user_creation(session):
    """Test creating a new user"""
    repo = UserRepository(session)

    user_data = {
        "email": "newuser@example.com",
        "username": "newuser",
        "hashed_password": "hashed123",
        "full_name": "New User",
        "tier": "free"
    }

    user = await repo.create(user_data)

    assert user.id is not None
    assert user.email == "newuser@example.com"
    assert user.username == "newuser"
    assert user.tier == "free"
    assert user.is_active is True


@pytest.mark.asyncio
async def test_user_get_by_email(session, test_user):
    """Test retrieving user by email"""
    repo = UserRepository(session)

    user = await repo.get_by_email("test@ultrathink.com")

    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email


@pytest.mark.asyncio
async def test_user_check_email_exists(session, test_user):
    """Test checking if email exists"""
    repo = UserRepository(session)

    exists = await repo.check_email_exists("test@ultrathink.com")
    not_exists = await repo.check_email_exists("nonexistent@example.com")

    assert exists is True
    assert not_exists is False


@pytest.mark.asyncio
async def test_user_upgrade_tier(session, test_user):
    """Test upgrading user tier"""
    repo = UserRepository(session)

    updated_user = await repo.upgrade_tier(test_user.id, "enterprise")

    assert updated_user is not None
    assert updated_user.tier == "enterprise"


@pytest.mark.asyncio
async def test_user_usage_stats(session, test_user, test_project, test_molecule):
    """Test getting user usage statistics"""
    repo = UserRepository(session)

    stats = await repo.get_usage_stats(test_user.id)

    assert stats is not None
    assert stats["project_count"] == 1
    assert stats["molecule_count"] == 1
    assert stats["tier"] == "pro"


# ===== PROJECT REPOSITORY TESTS =====

@pytest.mark.asyncio
async def test_project_creation(session, test_user):
    """Test creating a new project"""
    repo = ProjectRepository(session)

    project_data = {
        "user_id": test_user.id,
        "name": "Cancer Drug Discovery",
        "description": "Targeting EGFR mutations",
        "disease_target": "Non-Small Cell Lung Cancer"
    }

    project = await repo.create(project_data)

    assert project.id is not None
    assert project.name == "Cancer Drug Discovery"
    assert project.user_id == test_user.id
    assert project.disease_target == "Non-Small Cell Lung Cancer"


@pytest.mark.asyncio
async def test_project_get_by_user(session, test_user, test_project):
    """Test retrieving projects by user"""
    repo = ProjectRepository(session)

    projects = await repo.get_by_user(test_user.id)

    assert len(projects) >= 1
    assert any(p.id == test_project.id for p in projects)


@pytest.mark.asyncio
async def test_project_search(session, test_user, test_project):
    """Test searching projects"""
    repo = ProjectRepository(session)

    # Search by disease target
    results = await repo.search(test_user.id, search_term="Alzheimer")

    assert len(results) >= 1
    assert any(p.id == test_project.id for p in results)


@pytest.mark.asyncio
async def test_project_summary(session, test_project, test_molecule):
    """Test getting project summary"""
    repo = ProjectRepository(session)

    summary = await repo.get_summary(test_project.id)

    assert summary is not None
    assert summary["molecule_count"] == 1
    assert summary["protein_count"] == 0
    assert summary["name"] == test_project.name


@pytest.mark.asyncio
async def test_project_update(session, test_project):
    """Test updating project"""
    repo = ProjectRepository(session)

    updated = await repo.update(
        test_project.id,
        {"description": "Updated description"}
    )

    assert updated is not None
    assert updated.description == "Updated description"


@pytest.mark.asyncio
async def test_project_cascade_delete(session, test_user, test_project, test_molecule):
    """Test that deleting a project cascades to molecules"""
    repo = ProjectRepository(session)

    # Verify molecule exists
    from sqlalchemy import select
    result = await session.execute(
        select(Molecule).where(Molecule.id == test_molecule.id)
    )
    assert result.scalar_one_or_none() is not None

    # Delete project
    deleted = await repo.delete(test_project.id)
    assert deleted is True

    # Verify molecule was cascade deleted
    result = await session.execute(
        select(Molecule).where(Molecule.id == test_molecule.id)
    )
    assert result.scalar_one_or_none() is None


# ===== MOLECULE REPOSITORY TESTS =====

@pytest.mark.asyncio
async def test_molecule_creation_with_properties(session, test_user, test_project):
    """Test creating molecule with auto-calculated properties"""
    repo = MoleculeRepository(session)

    molecule_data = {
        "project_id": test_project.id,
        "user_id": test_user.id,
        "smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",  # Ibuprofen
        "name": "Ibuprofen",
        "generation_method": "manual"
    }

    molecule = await repo.create(molecule_data)

    assert molecule.id is not None
    assert molecule.smiles == "CC(C)Cc1ccc(cc1)C(C)C(=O)O"
    assert molecule.name == "Ibuprofen"

    # Check auto-calculated properties (if RDKit available)
    if molecule.molecular_weight:
        assert molecule.molecular_weight > 0
        assert molecule.logp is not None
        assert molecule.qed is not None


@pytest.mark.asyncio
async def test_molecule_bulk_create(session, test_user, test_project):
    """Test bulk molecule creation"""
    repo = MoleculeRepository(session)

    molecules_data = [
        {
            "project_id": test_project.id,
            "user_id": test_user.id,
            "smiles": f"C{'C' * i}O",
            "name": f"Molecule {i}",
            "generation_method": "MolGAN"
        }
        for i in range(10)
    ]

    molecules = await repo.bulk_create(molecules_data)

    assert len(molecules) == 10
    assert all(m.id is not None for m in molecules)
    assert all(m.generation_method == "MolGAN" for m in molecules)


@pytest.mark.asyncio
async def test_molecule_get_by_smiles(session, test_molecule):
    """Test fast SMILES lookup"""
    repo = MoleculeRepository(session)

    molecule = await repo.get_by_smiles("CC(=O)OC1=CC=CC=C1C(=O)O")

    assert molecule is not None
    assert molecule.id == test_molecule.id
    assert molecule.name == "Aspirin"


@pytest.mark.asyncio
async def test_molecule_get_by_project(session, test_project, test_molecule):
    """Test retrieving molecules by project"""
    repo = MoleculeRepository(session)

    molecules = await repo.get_by_project(test_project.id)

    assert len(molecules) >= 1
    assert any(m.id == test_molecule.id for m in molecules)


@pytest.mark.asyncio
async def test_molecule_search_with_filters(session, test_user, test_project):
    """Test searching molecules with property filters"""
    repo = MoleculeRepository(session)

    # Create molecules with different properties
    await repo.bulk_create([
        {
            "project_id": test_project.id,
            "user_id": test_user.id,
            "smiles": "C" * i,
            "molecular_weight": 100.0 + (i * 50),
            "qed": 0.5 + (i * 0.05),
            "generation_method": "MolGAN" if i % 2 == 0 else "manual"
        }
        for i in range(5)
    ])

    # Search by molecular weight range
    results = await repo.search(
        test_user.id,
        filters={"min_mw": 150, "max_mw": 250}
    )

    assert len(results) > 0
    assert all(150 <= m.molecular_weight <= 250 for m in results if m.molecular_weight)


@pytest.mark.asyncio
async def test_molecule_statistics(session, test_project, test_molecule):
    """Test molecule statistics calculation"""
    repo = MoleculeRepository(session)

    stats = await repo.get_statistics(test_project.id)

    assert stats["total_count"] >= 1
    assert "avg_molecular_weight" in stats
    assert "generation_methods" in stats


# ===== PREDICTION REPOSITORY TESTS =====

@pytest.mark.asyncio
async def test_prediction_creation(session, test_molecule):
    """Test creating an ADMET prediction"""
    repo = PredictionRepository(session)

    prediction_data = {
        "molecule_id": test_molecule.id,
        "prediction_type": "absorption",
        "results": {
            "bioavailability": 0.85,
            "caco2_permeability": 1.2e-5,
            "pgp_substrate": False
        },
        "confidence_score": 0.92,
        "model_version": "chemprop-v2.1.0"
    }

    prediction = await repo.create(prediction_data)

    assert prediction.id is not None
    assert prediction.molecule_id == test_molecule.id
    assert prediction.prediction_type == "absorption"
    assert prediction.results["bioavailability"] == 0.85
    assert prediction.confidence_score == 0.92


@pytest.mark.asyncio
async def test_prediction_get_by_molecule(session, test_molecule):
    """Test retrieving predictions for a molecule"""
    repo = PredictionRepository(session)

    # Create multiple predictions
    await repo.bulk_create([
        {
            "molecule_id": test_molecule.id,
            "prediction_type": pred_type,
            "results": {"test": "data"},
            "confidence_score": 0.9
        }
        for pred_type in ["absorption", "distribution", "toxicity"]
    ])

    # Get all predictions
    all_preds = await repo.get_by_molecule(test_molecule.id)
    assert len(all_preds) >= 3

    # Get filtered predictions
    absorption_preds = await repo.get_by_molecule(
        test_molecule.id,
        prediction_type="absorption"
    )
    assert len(absorption_preds) >= 1
    assert all(p.prediction_type == "absorption" for p in absorption_preds)


@pytest.mark.asyncio
async def test_prediction_summary(session, test_molecule):
    """Test getting prediction summary"""
    repo = PredictionRepository(session)

    # Create predictions
    await repo.bulk_create([
        {
            "molecule_id": test_molecule.id,
            "prediction_type": "absorption",
            "results": {"bioavailability": 0.8},
            "confidence_score": 0.9
        },
        {
            "molecule_id": test_molecule.id,
            "prediction_type": "toxicity",
            "results": {"ld50": 200},
            "confidence_score": 0.85
        }
    ])

    summary = await repo.get_predictions_summary(test_molecule.id)

    assert "absorption" in summary
    assert "toxicity" in summary
    assert summary["absorption"]["results"]["bioavailability"] == 0.8


# ===== INTEGRATION TESTS =====

@pytest.mark.asyncio
async def test_full_workflow(session):
    """Test complete workflow: User -> Project -> Molecules -> Predictions"""
    # Create user
    user_repo = UserRepository(session)
    user = await user_repo.create({
        "email": "workflow@test.com",
        "username": "workflowuser",
        "hashed_password": "hash123"
    })

    # Create project
    project_repo = ProjectRepository(session)
    project = await project_repo.create({
        "user_id": user.id,
        "name": "Full Workflow Test",
        "disease_target": "Test Disease"
    })

    # Create molecules
    mol_repo = MoleculeRepository(session)
    molecules = await mol_repo.bulk_create([
        {
            "project_id": project.id,
            "user_id": user.id,
            "smiles": f"CC{'O' * i}",
            "name": f"Test Mol {i}"
        }
        for i in range(5)
    ])

    # Add predictions
    pred_repo = PredictionRepository(session)
    for mol in molecules:
        await pred_repo.create({
            "molecule_id": mol.id,
            "prediction_type": "toxicity",
            "results": {"safe": True},
            "confidence_score": 0.9
        })

    # Verify
    project_summary = await project_repo.get_summary(project.id)
    assert project_summary["molecule_count"] == 5

    stats = await mol_repo.get_statistics(project.id)
    assert stats["total_count"] == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
