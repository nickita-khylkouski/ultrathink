"""
SQLAlchemy ORM Models for UltraThink Drugs Database

This module defines the complete database schema for the drug discovery platform,
including models for users, projects, molecules, predictions, protein structures,
docking results, and activity logging.

Key Design Decisions:
- UUID primary keys for distributed system compatibility
- JSONB for flexible schema in predictions and interactions
- Cascade deletes to maintain referential integrity
- Strategic indexes on foreign keys and frequently queried columns
- Timestamps for audit trails
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Text, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

Base = declarative_base()


class User(Base):
    """
    User model representing researchers/scientists using the platform.

    Tier system:
    - 'free': Limited molecule generations, basic features
    - 'pro': Increased limits, advanced predictions
    - 'enterprise': Unlimited usage, custom models
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    institution = Column(String(255))
    tier = Column(String(20), default='free', index=True)  # free, pro, enterprise
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    molecules = relationship("Molecule", back_populates="user", cascade="all, delete-orphan")
    protein_structures = relationship("ProteinStructure", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', tier='{self.tier}')>"


class Project(Base):
    """
    Project model for organizing drug discovery campaigns.

    A project groups related molecules, proteins, and predictions for a specific
    therapeutic target (e.g., Alzheimer's, cancer, diabetes).
    """
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    disease_target = Column(String(255))  # e.g., "Alzheimer's", "Breast Cancer"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="projects")
    molecules = relationship("Molecule", back_populates="project", cascade="all, delete-orphan")
    protein_structures = relationship("ProteinStructure", back_populates="project", cascade="all, delete-orphan")

    # Composite index for efficient user project queries
    __table_args__ = (
        Index('idx_projects_user_created', 'user_id', 'created_at'),
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', target='{self.disease_target}')>"


class Molecule(Base):
    """
    Molecule model storing chemical compounds with cached properties.

    Properties are calculated on insert using RDKit to avoid repeated computation.
    SMILES strings are indexed for fast lookup and duplicate detection.
    """
    __tablename__ = "molecules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    # Chemical structure
    smiles = Column(String(500), nullable=False, index=True)  # Hash index for O(1) lookup
    name = Column(String(255))
    generation_method = Column(String(100))  # 'MolGAN', 'manual', 'imported', 'optimization'

    # Cached molecular properties (calculated via RDKit on insert)
    molecular_weight = Column(Float)
    logp = Column(Float)  # Lipophilicity (octanol-water partition coefficient)
    tpsa = Column(Float)  # Topological polar surface area (Ų)
    qed = Column(Float)  # Quantitative Estimate of Drug-likeness (0-1)
    num_hbd = Column(Integer)  # Hydrogen bond donors
    num_hba = Column(Integer)  # Hydrogen bond acceptors
    num_rotatable_bonds = Column(Integer)
    num_aromatic_rings = Column(Integer)
    num_heavy_atoms = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="molecules")
    project = relationship("Project", back_populates="molecules")
    predictions = relationship("ADMETPrediction", back_populates="molecule", cascade="all, delete-orphan")
    docking_results = relationship("DockingResult", back_populates="molecule", cascade="all, delete-orphan")

    # Composite indexes for common query patterns
    __table_args__ = (
        Index('idx_molecules_project_created', 'project_id', 'created_at'),
        Index('idx_molecules_smiles_hash', 'smiles', postgresql_using='hash'),  # O(1) lookup
    )

    def __repr__(self):
        return f"<Molecule(id={self.id}, smiles='{self.smiles[:30]}...', MW={self.molecular_weight})>"


class ADMETPrediction(Base):
    """
    ADMET (Absorption, Distribution, Metabolism, Excretion, Toxicity) predictions.

    Stores flexible prediction results in JSONB for different model types.
    Model version tracking ensures reproducibility and allows A/B testing.

    Example JSONB structures:
    - Absorption: {"bioavailability": 0.85, "caco2_permeability": 1.2e-5}
    - Toxicity: {"ld50": 200, "ames_mutagenicity": false, "carcinogenicity": 0.15}
    """
    __tablename__ = "admet_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    molecule_id = Column(UUID(as_uuid=True), ForeignKey('molecules.id', ondelete='CASCADE'), nullable=False, index=True)
    prediction_type = Column(String(50), nullable=False, index=True)  # 'absorption', 'distribution', 'toxicity'
    results = Column(JSONB, nullable=False)  # Flexible schema for different prediction types
    confidence_score = Column(Float)  # 0.0 to 1.0
    model_version = Column(String(50))  # e.g., "chemprop-v2.1.0", "admet-ai-v1.3"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    molecule = relationship("Molecule", back_populates="predictions")

    # Composite index for molecule + type queries
    __table_args__ = (
        Index('idx_predictions_molecule_type', 'molecule_id', 'prediction_type'),
    )

    def __repr__(self):
        return f"<ADMETPrediction(id={self.id}, type='{self.prediction_type}', confidence={self.confidence_score})>"


class ProteinStructure(Base):
    """
    Protein structure model for drug targets.

    Stores protein sequences and metadata. Large PDB files (500KB+) are stored
    in S3 with only the S3 key stored in the database to avoid bloat.
    """
    __tablename__ = "protein_structures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    sequence = Column(Text, nullable=False)  # Amino acid sequence
    pdb_id = Column(String(10), index=True)  # e.g., "1R42" from RCSB PDB
    pdb_file_s3_key = Column(String(500))  # S3 path: "proteins/{user_id}/{protein_id}.pdb"
    structure_method = Column(String(50))  # 'ESMFold', 'RCSB', 'AlphaFold', 'homology_modeling'

    # Optional metadata
    organism = Column(String(255))  # e.g., "Homo sapiens"
    gene_name = Column(String(100))  # e.g., "BACE1"
    resolution = Column(Float)  # Angstroms (for experimental structures)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="protein_structures")
    project = relationship("Project", back_populates="protein_structures")
    docking_results = relationship("DockingResult", back_populates="protein", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ProteinStructure(id={self.id}, pdb_id='{self.pdb_id}', method='{self.structure_method}')>"


class DockingResult(Base):
    """
    Molecular docking results for protein-ligand interactions.

    Stores binding affinities and interaction details. 3D binding poses are
    stored in S3 as SDF files to keep database lean.
    """
    __tablename__ = "docking_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    molecule_id = Column(UUID(as_uuid=True), ForeignKey('molecules.id', ondelete='CASCADE'), nullable=False, index=True)
    protein_id = Column(UUID(as_uuid=True), ForeignKey('protein_structures.id', ondelete='CASCADE'), nullable=False, index=True)

    binding_affinity = Column(Float, index=True)  # kcal/mol (lower = better binding)
    binding_pose_s3_key = Column(String(500))  # S3 path to SDF file with 3D coordinates

    # Interaction details stored as JSONB
    # Example: {
    #   "h_bonds": [{"residue": "ASP32", "distance": 2.1}],
    #   "hydrophobic": ["LEU27", "PHE108"],
    #   "salt_bridges": [{"residue": "ARG145", "distance": 3.2}]
    # }
    interactions = Column(JSONB)

    docking_method = Column(String(50))  # 'AutoDock Vina', 'Glide', 'DOCK'
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    molecule = relationship("Molecule", back_populates="docking_results")
    protein = relationship("ProteinStructure", back_populates="docking_results")

    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_docking_molecule_affinity', 'molecule_id', 'binding_affinity'),
        Index('idx_docking_protein_affinity', 'protein_id', 'binding_affinity'),
    )

    def __repr__(self):
        return f"<DockingResult(id={self.id}, affinity={self.binding_affinity} kcal/mol)>"


class ActivityLog(Base):
    """
    Activity log for tracking user actions and system events.

    Enables analytics, debugging, and usage monitoring. JSONB details field
    allows storing action-specific metadata without schema changes.
    """
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)  # 'generated_molecules', 'ran_docking', etc.

    # Action-specific details
    # Examples:
    # - generated_molecules: {"count": 50, "method": "MolGAN", "project_id": "..."}
    # - ran_docking: {"molecule_count": 10, "protein_id": "...", "avg_affinity": -7.2}
    details = Column(JSONB)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="activity_logs")

    # Composite index for user activity timeline
    __table_args__ = (
        Index('idx_logs_user_created', 'user_id', 'created_at'),
    )

    def __repr__(self):
        return f"<ActivityLog(id={self.id}, action='{self.action}', created={self.created_at})>"
