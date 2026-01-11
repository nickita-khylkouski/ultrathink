# 🗄️ UltraThink Drugs Database Layer

Production-grade PostgreSQL database with SQLAlchemy ORM for persistent storage of projects, molecules, predictions, protein structures, and complete user activity tracking.

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                      │
│                        (main.py)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Depends(get_db)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Repository Layer                           │
│  ┌──────────────┬───────────────┬────────────────────┐      │
│  │   User       │   Project     │   Molecule         │      │
│  │   Repository │   Repository  │   Repository       │      │
│  └──────────────┴───────────────┴────────────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ AsyncSession
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  SQLAlchemy ORM Layer                        │
│  ┌──────────┬─────────┬──────────┬─────────────────┐        │
│  │   User   │ Project │ Molecule │ ADMETPrediction │        │
│  │   Model  │  Model  │  Model   │     Model       │        │
│  └──────────┴─────────┴──────────┴─────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ asyncpg (async driver)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL 15 Database                          │
│  (docker-compose managed, persistent volumes)               │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Quick Start

### 1. Start Database Services

```bash
cd /Users/nickita/hackathon/orchestrator

# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f postgres
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head

# Verify
alembic current
```

### 4. Start Application

```bash
uvicorn main:app --reload --port 7001
```

### 5. Test Database Connection

```bash
curl http://localhost:7001/health
```

Expected response:
```json
{
    "status": "healthy",
    "database": "connected",
    "service": "ULTRATHINK - AI Drug Discovery Platform",
    "version": "2.0.0"
}
```

## 📁 Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : creates
    USERS ||--o{ MOLECULES : owns
    USERS ||--o{ PROTEIN_STRUCTURES : owns
    USERS ||--o{ ACTIVITY_LOGS : has

    PROJECTS ||--o{ MOLECULES : contains
    PROJECTS ||--o{ PROTEIN_STRUCTURES : contains

    MOLECULES ||--o{ ADMET_PREDICTIONS : has
    MOLECULES ||--o{ DOCKING_RESULTS : has

    PROTEIN_STRUCTURES ||--o{ DOCKING_RESULTS : has

    USERS {
        uuid id PK
        string email UK
        string username UK
        string tier "free|pro|enterprise"
        timestamp created_at
    }

    PROJECTS {
        uuid id PK
        uuid user_id FK
        string name
        string disease_target
        timestamp created_at
    }

    MOLECULES {
        uuid id PK
        uuid project_id FK
        string smiles "Indexed"
        float molecular_weight
        float qed "Drug-likeness"
        timestamp created_at
    }

    ADMET_PREDICTIONS {
        uuid id PK
        uuid molecule_id FK
        string prediction_type
        jsonb results "Flexible schema"
        float confidence_score
    }
```

### Tables Overview

| Table | Records Expected | Purpose |
|-------|-----------------|---------|
| `users` | 1K-100K | User accounts & authentication |
| `projects` | 10K-1M | Drug discovery campaigns |
| `molecules` | 100K-10M | Generated & imported compounds |
| `admet_predictions` | 500K-50M | ADMET property predictions |
| `protein_structures` | 1K-100K | Target proteins (PDB files in S3) |
| `docking_results` | 1M-100M | Molecular docking simulations |
| `activity_logs` | 1M+ | User activity & analytics |

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the orchestrator directory:

```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://ultrathink:CHANGE_THIS_PASSWORD@localhost:5432/ultrathink_prod
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
DB_ECHO=false

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Application Settings
ENV=production
LOG_LEVEL=INFO
```

### Connection Pooling

The database uses connection pooling for optimal performance:

- **Pool Size**: 20 connections (configurable via `DB_POOL_SIZE`)
- **Max Overflow**: 10 additional connections under load
- **Pool Pre-Ping**: Verifies connections before use (prevents stale connections)
- **Pool Recycle**: Recycles connections after 1 hour

Adjust based on your deployment:
- **Development**: 5 connections
- **Production**: 20-50 connections
- **High Traffic**: 50-100 connections

## 📚 Usage Examples

### Creating a Project

```python
from database import get_db_context
from database.repositories import ProjectRepository

async def create_project_example():
    async with get_db_context() as db:
        repo = ProjectRepository(db)

        project = await repo.create({
            "user_id": user_uuid,
            "name": "Alzheimer's Drug Discovery",
            "description": "Targeting BACE1 protein",
            "disease_target": "Alzheimer's Disease"
        })

        print(f"Created project: {project.id}")
```

### Adding Molecules (Bulk Insert)

```python
from database.repositories import MoleculeRepository

async def generate_molecules_example(project_id: uuid.UUID):
    async with get_db_context() as db:
        repo = MoleculeRepository(db)

        # MolGAN generated 100 molecules
        molecules_data = [
            {
                "project_id": project_id,
                "user_id": user_id,
                "smiles": mol["smiles"],
                "generation_method": "MolGAN"
            }
            for mol in molgan_output
        ]

        # Bulk insert (10x faster than individual inserts)
        molecules = await repo.bulk_create(molecules_data)

        # Properties are auto-calculated
        for mol in molecules:
            print(f"MW: {mol.molecular_weight}, QED: {mol.qed}")
```

### Searching Molecules

```python
async def search_drug_like_molecules(user_id: uuid.UUID):
    async with get_db_context() as db:
        repo = MoleculeRepository(db)

        # Find drug-like molecules
        molecules = await repo.search(
            user_id=user_id,
            filters={
                "min_mw": 300,      # Molecular weight 300-500
                "max_mw": 500,
                "min_qed": 0.6,     # QED > 0.6 (drug-like)
                "max_logp": 5.0,    # Lipinski's rule
                "generation_method": "MolGAN"
            },
            limit=50
        )

        return molecules
```

### Storing ADMET Predictions

```python
from database.repositories import PredictionRepository

async def store_prediction_example(molecule_id: uuid.UUID):
    async with get_db_context() as db:
        repo = PredictionRepository(db)

        prediction = await repo.create({
            "molecule_id": molecule_id,
            "prediction_type": "absorption",
            "results": {
                "bioavailability": 0.85,
                "caco2_permeability": 1.2e-5,
                "pgp_substrate": False,
                "gi_absorption": "High"
            },
            "confidence_score": 0.92,
            "model_version": "chemprop-v2.1.0"
        })
```

### FastAPI Dependency Injection

```python
from fastapi import Depends
from database import get_db
from database.repositories import MoleculeRepository

@app.get("/projects/{project_id}/molecules")
async def get_molecules(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """FastAPI automatically manages session lifecycle"""
    repo = MoleculeRepository(db)
    molecules = await repo.get_by_project(uuid.UUID(project_id))
    return molecules
```

## 🧪 Testing

### Run All Tests

```bash
pytest tests/test_database.py -v
```

### Run Specific Tests

```bash
# Test molecule operations
pytest tests/test_database.py::test_molecule_creation -v

# Test search functionality
pytest tests/test_database.py -k "search" -v

# Integration tests
pytest tests/test_database.py -k "integration" -v
```

### Test Coverage

```bash
pytest tests/test_database.py --cov=database --cov-report=html
open htmlcov/index.html
```

### Create Test Database

```sql
-- Connect to PostgreSQL
psql -U ultrathink -h localhost

-- Create test database
CREATE DATABASE ultrathink_test;

-- Verify
\l ultrathink_test
```

## 🚀 Performance Optimization

### Indexes

All critical queries have indexes:

```sql
-- Fast SMILES lookup (O(1) hash index)
CREATE INDEX idx_molecules_smiles_hash ON molecules USING hash(smiles);

-- Efficient project molecule queries
CREATE INDEX idx_molecules_project_created ON molecules(project_id, created_at DESC);

-- User activity timeline
CREATE INDEX idx_logs_user_created ON activity_logs(user_id, created_at DESC);

-- Best docking results
CREATE INDEX idx_docking_molecule_affinity ON docking_results(molecule_id, binding_affinity);
```

### Query Performance

| Operation | Performance | Index Used |
|-----------|-------------|------------|
| SMILES lookup | < 1ms | Hash index |
| Project molecules | < 5ms | Composite (project_id, created_at) |
| User projects | < 10ms | B-tree (user_id) |
| Molecule search | < 50ms | Multiple indexes + filters |

### Bulk Operations

Use bulk methods for batch operations:

```python
# ❌ SLOW: Individual inserts (10s for 100 molecules)
for mol_data in molecules:
    await repo.create(mol_data)

# ✅ FAST: Bulk insert (< 1s for 100 molecules)
await repo.bulk_create(molecules)
```

### Redis Caching (Future Enhancement)

```python
# Cache SMILES lookups (15 min TTL)
@cache(ttl=900)
async def get_molecule_by_smiles(smiles: str):
    return await repo.get_by_smiles(smiles)

# Cache ADMET predictions (same molecule = same result)
@cache(ttl=3600)
async def get_predictions(molecule_id: uuid.UUID):
    return await pred_repo.get_by_molecule(molecule_id)
```

## 🔒 Security Best Practices

### 1. Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash password
hashed = pwd_context.hash("user_password")

# Verify password
is_valid = pwd_context.verify("user_password", hashed)
```

### 2. SQL Injection Prevention

SQLAlchemy automatically prevents SQL injection:

```python
# ✅ SAFE: Parameterized query
query = select(Molecule).where(Molecule.smiles == user_input)

# ❌ DANGEROUS: String concatenation
query = f"SELECT * FROM molecules WHERE smiles = '{user_input}'"  # DON'T DO THIS!
```

### 3. Access Control

Always filter by user_id to prevent unauthorized access:

```python
# Ensure user can only access their own data
molecules = await repo.search(
    user_id=current_user.id,  # From JWT token
    filters=filters
)
```

### 4. Environment Variables

NEVER hardcode credentials:

```python
# ❌ DANGEROUS
DATABASE_URL = "postgresql://user:password@localhost/db"

# ✅ SAFE
DATABASE_URL = os.getenv("DATABASE_URL")
```

## 🛠️ Database Maintenance

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U ultrathink ultrathink_prod > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U ultrathink ultrathink_prod < backup_20260110.sql
```

### Monitor Database Size

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('ultrathink_prod'));

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Vacuum Database

```sql
-- Reclaim space and update statistics
VACUUM ANALYZE;

-- Full vacuum (requires exclusive lock)
VACUUM FULL;
```

### Monitor Active Connections

```sql
SELECT
    count(*) as connections,
    state,
    usename
FROM pg_stat_activity
WHERE datname = 'ultrathink_prod'
GROUP BY state, usename;
```

## 🔄 Migration Guide

### Adding a New Column

```bash
# 1. Modify model in database/models.py
# Add: new_field = Column(String(100))

# 2. Generate migration
alembic revision --autogenerate -m "Add new_field to molecules"

# 3. Review migration in alembic/versions/

# 4. Apply migration
alembic upgrade head
```

### Renaming a Column (Manual Migration)

```python
def upgrade():
    op.alter_column('molecules', 'old_name', new_column_name='new_name')

def downgrade():
    op.alter_column('molecules', 'new_name', new_column_name='old_name')
```

### Data Migration

```python
def upgrade():
    # Add column
    op.add_column('molecules', sa.Column('status', sa.String(20)))

    # Migrate data
    op.execute("""
        UPDATE molecules
        SET status = 'active'
        WHERE created_at > '2025-01-01'
    """)

    # Make non-nullable
    op.alter_column('molecules', 'status', nullable=False)
```

## 📈 Scaling Considerations

### Read Replicas

For high read traffic, add read replicas:

```python
# Write to primary
async with get_db_context() as db:
    await repo.create(molecule_data)

# Read from replica
async with get_db_context(replica=True) as db:
    molecules = await repo.get_by_project(project_id)
```

### Partitioning

For 10M+ molecules, partition by creation date:

```sql
-- Partition molecules table by month
CREATE TABLE molecules (
    ...
) PARTITION BY RANGE (created_at);

CREATE TABLE molecules_2026_01 PARTITION OF molecules
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### S3 for Large Files

Store PDB files (500KB+) in S3, not database:

```python
# ❌ DON'T: Store large files in database
protein.pdb_data = large_pdb_file  # 500KB blob

# ✅ DO: Store in S3, reference in database
s3_key = await upload_to_s3(pdb_file)
protein.pdb_file_s3_key = s3_key  # 100 bytes
```

## 🐛 Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Migration Conflicts

```bash
# Reset migration state
alembic downgrade base
alembic upgrade head

# Force stamp current state
alembic stamp head
```

### Slow Queries

```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1s
SELECT pg_reload_conf();

-- View slow queries
tail -f /var/lib/postgresql/data/log/postgresql-*.log | grep "duration:"
```

### Database Locked

```sql
-- Find blocking queries
SELECT pid, usename, state, query
FROM pg_stat_activity
WHERE state = 'active';

-- Kill blocking query
SELECT pg_terminate_backend(12345);  -- Replace with PID
```

## 📚 Additional Resources

- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)
- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [FastAPI Database Guide](https://fastapi.tiangolo.com/tutorial/sql-databases/)

## 🎓 Learning Resources

Study these GitHub projects for inspiration:

1. **Full-Stack FastAPI PostgreSQL**
   ```bash
   git clone https://github.com/tiangolo/full-stack-fastapi-postgresql
   ```

2. **ChEMBL Database Structure**
   ```bash
   git clone https://github.com/chembl/chembl_structure_pipeline
   ```

3. **PubChem Search**
   - Explore: https://pubchem.ncbi.nlm.nih.gov/
   - API: https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest

---

**Built with ❤️ for drug discovery** | Database layer for [UltraThink Drugs](../README.md)
