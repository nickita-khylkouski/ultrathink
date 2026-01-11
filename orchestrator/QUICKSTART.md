# 🚀 Quick Start Guide - UltraThink Drugs Database

Get the database up and running in **5 minutes**!

## Prerequisites

- Python 3.9+
- Docker Desktop
- Git

## Option 1: Automated Setup (Recommended)

Run the setup script:

```bash
cd /Users/nickita/hackathon/orchestrator
./setup_database.sh
```

This will:
1. ✅ Install all Python dependencies
2. ✅ Start PostgreSQL and Redis with Docker
3. ✅ Create database tables via migrations
4. ✅ Verify database connection

## Option 2: Manual Setup

### Step 1: Configure Environment

```bash
# Copy environment template
cp .env.template .env

# Edit .env and set your database URL
nano .env
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Start Database Services

```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:
```
NAME                  STATUS
ultrathink_postgres   running (healthy)
ultrathink_redis      running (healthy)
ultrathink_pgadmin    running
```

### Step 4: Create Database Tables

```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade -> abc123, Initial schema
```

### Step 5: Verify Setup

```bash
# Start application
uvicorn main:app --reload --port 7001
```

Then open: http://localhost:7001/health

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "ULTRATHINK - AI Drug Discovery Platform",
  "version": "2.0.0"
}
```

## Testing

Run the test suite to verify everything works:

```bash
# Run all database tests
pytest tests/test_database.py -v

# Run with coverage
pytest tests/test_database.py --cov=database --cov-report=html

# View coverage report
open htmlcov/index.html
```

Expected: **All 30+ tests should pass** ✅

## Common Issues & Solutions

### Issue: "ModuleNotFoundError: No module named 'sqlalchemy'"

**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: "Connection refused" when connecting to database

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Issue: "Target database is not up to date" (Alembic)

**Solution:**
```bash
# Mark current state as latest
alembic stamp head

# Or recreate migrations
alembic downgrade base
alembic upgrade head
```

### Issue: Database already exists error

**Solution:**
```bash
# Drop and recreate database
docker-compose down -v  # ⚠️ DELETES ALL DATA
docker-compose up -d
alembic upgrade head
```

## Accessing Database Directly

### psql (PostgreSQL CLI)

```bash
# Connect to database
docker-compose exec postgres psql -U ultrathink ultrathink_dev

# List tables
\dt

# Describe table
\d molecules

# Run query
SELECT COUNT(*) FROM molecules;

# Exit
\q
```

### pgAdmin (Web UI)

1. Open: http://localhost:5050
2. Login:
   - Email: `admin@ultrathink.local`
   - Password: `admin`
3. Add server:
   - Name: `UltraThink Local`
   - Host: `postgres` (Docker service name)
   - Port: `5432`
   - Database: `ultrathink_dev`
   - Username: `ultrathink`
   - Password: `dev_password_change_in_prod`

## Example Usage

### Create a Project via Python

```python
import asyncio
from database import get_db_context
from database.repositories import ProjectRepository
import uuid

async def create_project():
    async with get_db_context() as db:
        repo = ProjectRepository(db)

        project = await repo.create({
            "user_id": uuid.uuid4(),  # In production, get from JWT token
            "name": "Alzheimer's Drug Discovery",
            "description": "Targeting BACE1 protein",
            "disease_target": "Alzheimer's Disease"
        })

        print(f"✅ Created project: {project.id}")
        print(f"   Name: {project.name}")
        print(f"   Target: {project.disease_target}")

asyncio.run(create_project())
```

### Add Molecules via API

```bash
# Create project
curl -X POST http://localhost:7001/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cancer Research",
    "disease_target": "Breast Cancer"
  }'

# Add molecule (Aspirin)
curl -X POST http://localhost:7001/api/v1/molecules \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "PROJECT_ID_FROM_ABOVE",
    "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",
    "name": "Aspirin"
  }'
```

## Next Steps

1. **Read the full documentation**: [DATABASE_README.md](DATABASE_README.md)
2. **Explore example endpoints**: [database_routes_example.py](database_routes_example.py)
3. **Check migration guide**: [alembic/README.md](alembic/README.md)
4. **Review test examples**: [tests/test_database.py](tests/test_database.py)

## Useful Commands Cheat Sheet

```bash
# Database Services
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose down -v            # Stop and delete data (⚠️ DANGER)
docker-compose logs -f postgres   # View PostgreSQL logs
docker-compose ps                 # Check service status

# Migrations
alembic revision --autogenerate -m "Description"  # Create migration
alembic upgrade head              # Apply migrations
alembic downgrade -1              # Rollback one migration
alembic current                   # Show current version
alembic history                   # Show migration history

# Testing
pytest tests/test_database.py -v              # Run tests
pytest tests/test_database.py -k "molecule"   # Run molecule tests only
pytest tests/test_database.py --cov=database  # With coverage

# Database Access
docker-compose exec postgres psql -U ultrathink ultrathink_dev

# Backup & Restore
docker-compose exec postgres pg_dump -U ultrathink ultrathink_dev > backup.sql
docker-compose exec -T postgres psql -U ultrathink ultrathink_dev < backup.sql
```

## Troubleshooting Help

If you're stuck, check:
1. ✅ Docker is running: `docker --version`
2. ✅ Services are healthy: `docker-compose ps`
3. ✅ .env file exists: `cat .env`
4. ✅ Dependencies installed: `pip list | grep sqlalchemy`
5. ✅ Migrations applied: `alembic current`

Still having issues? Check the logs:
```bash
# Application logs
tail -f orchestrator.log

# Database logs
docker-compose logs postgres

# All service logs
docker-compose logs
```

---

**Need more help?** See [DATABASE_README.md](DATABASE_README.md) for comprehensive documentation.
