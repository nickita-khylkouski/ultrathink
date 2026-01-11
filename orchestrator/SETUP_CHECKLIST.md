# ✅ Database Setup Checklist

Use this checklist to verify your database setup is complete and working correctly.

## Pre-Setup Requirements

- [ ] Python 3.9 or higher installed (`python3 --version`)
- [ ] Docker Desktop installed and running (`docker --version`)
- [ ] Git installed (`git --version`)
- [ ] At least 2GB free disk space
- [ ] Port 5432 available (PostgreSQL)
- [ ] Port 6379 available (Redis)
- [ ] Port 7001 available (Application)

## Setup Steps

### 1. Environment Configuration

- [ ] `.env` file created from template
  ```bash
  cp .env.template .env
  ```
- [ ] `DATABASE_URL` configured in `.env`
- [ ] Sensitive values updated (SECRET_KEY, passwords)
- [ ] `.gitignore` file exists (prevents committing secrets)

### 2. Dependencies Installation

- [ ] Python dependencies installed
  ```bash
  pip install -r requirements.txt
  ```
- [ ] SQLAlchemy installed (`pip show sqlalchemy`)
- [ ] Pytest installed (`pip show pytest`)
- [ ] RDKit installed (`pip show rdkit`)
- [ ] All dependencies installed without errors

### 3. Docker Services

- [ ] Docker Desktop is running
- [ ] docker-compose.yml file exists
- [ ] Services started
  ```bash
  docker-compose up -d
  ```
- [ ] PostgreSQL container running (`docker-compose ps postgres`)
- [ ] Redis container running (`docker-compose ps redis`)
- [ ] PostgreSQL healthy (green checkmark in `docker-compose ps`)
- [ ] Redis healthy (green checkmark in `docker-compose ps`)

### 4. Database Migration

- [ ] Alembic initialized (alembic/ directory exists)
- [ ] Initial migration created
  ```bash
  alembic revision --autogenerate -m "Initial schema"
  ```
- [ ] Migration file generated in alembic/versions/
- [ ] Migration applied successfully
  ```bash
  alembic upgrade head
  ```
- [ ] No migration errors in output

### 5. Database Verification

- [ ] Can connect to database via psql
  ```bash
  docker-compose exec postgres psql -U ultrathink ultrathink_dev
  ```
- [ ] Tables exist (run `\dt` in psql)
- [ ] All 7 expected tables present:
  - [ ] users
  - [ ] projects
  - [ ] molecules
  - [ ] admet_predictions
  - [ ] protein_structures
  - [ ] docking_results
  - [ ] activity_logs

### 6. Application Startup

- [ ] Application starts without errors
  ```bash
  uvicorn main:app --reload --port 7001
  ```
- [ ] Startup log shows database connection
  ```
  ✅ Database connected successfully
  ```
- [ ] No error messages in startup logs

### 7. Health Check

- [ ] Health endpoint accessible
  ```bash
  curl http://localhost:7001/health
  ```
- [ ] Response shows:
  - [ ] `"status": "healthy"`
  - [ ] `"database": "connected"`
  - [ ] HTTP 200 status code

### 8. Validation (Automated)

- [ ] Validation script runs successfully
  ```bash
  python3 validate_setup.py
  ```
- [ ] All 10 validation checks pass:
  - [ ] Python Modules ✓
  - [ ] Environment File ✓
  - [ ] Docker Services ✓
  - [ ] Database Connection ✓
  - [ ] Database Models ✓
  - [ ] Repositories ✓
  - [ ] Alembic Setup ✓
  - [ ] Database Tables ✓
  - [ ] Redis Connection ✓
  - [ ] CRUD Operations ✓

### 9. Testing

- [ ] Test database created (optional, for testing only)
  ```sql
  CREATE DATABASE ultrathink_test;
  ```
- [ ] Tests run successfully
  ```bash
  pytest tests/test_database.py -v
  ```
- [ ] All 30+ tests pass
- [ ] No test failures or errors
- [ ] Test coverage > 80% (optional)
  ```bash
  pytest tests/test_database.py --cov=database
  ```

### 10. Optional Services

- [ ] pgAdmin accessible (http://localhost:5050)
- [ ] Can login to pgAdmin with credentials
- [ ] PostgreSQL server added in pgAdmin
- [ ] Can browse tables in pgAdmin

## Functional Testing

Test basic operations to ensure everything works:

### Create a Project

- [ ] Can create a project via Python script
  ```python
  import asyncio
  from database import get_db_context
  from database.repositories import ProjectRepository
  import uuid

  async def test():
      async with get_db_context() as db:
          repo = ProjectRepository(db)
          project = await repo.create({
              "user_id": uuid.uuid4(),
              "name": "Test Project",
              "description": "Testing database setup"
          })
          print(f"✓ Created project: {project.id}")

  asyncio.run(test())
  ```
- [ ] Project ID returned successfully
- [ ] No errors during creation

### Create a Molecule

- [ ] Can create a molecule with properties
- [ ] Molecular properties auto-calculated (MW, LogP, QED)
- [ ] Can retrieve molecule by ID
- [ ] Can retrieve molecule by SMILES

### Store Predictions

- [ ] Can store ADMET prediction
- [ ] JSONB data stored correctly
- [ ] Can retrieve predictions for a molecule

## Troubleshooting Checklist

If any step fails, check:

- [ ] Docker Desktop is running (not just installed)
- [ ] No other services using ports 5432, 6379, or 7001
- [ ] .env file has correct DATABASE_URL format
- [ ] PostgreSQL has time to fully start (wait 10 seconds)
- [ ] All migrations applied (`alembic current`)
- [ ] Logs checked for errors
  ```bash
  docker-compose logs postgres
  tail -f orchestrator.log
  ```

## Performance Verification

- [ ] SMILES lookup < 5ms (hash index working)
- [ ] Project query < 10ms (indexes working)
- [ ] Bulk insert 100 molecules < 2s
- [ ] No N+1 query problems

## Security Checklist

- [ ] .env file in .gitignore
- [ ] No hardcoded passwords in code
- [ ] Default passwords changed in production
- [ ] DATABASE_URL uses strong password
- [ ] SECRET_KEY is random and secret

## Documentation Review

- [ ] Read QUICKSTART.md
- [ ] Reviewed DATABASE_README.md
- [ ] Understand repository pattern
- [ ] Know how to run migrations
- [ ] Know how to backup/restore database

## Completion Summary

**Total Checks:** ~80
**Required for Basic Operation:** ~40 (first 8 sections)
**Recommended:** All checks

### Status Levels

- ✅ **Basic Setup Complete**: Sections 1-7 done
- ✅ **Validated Setup**: Sections 1-8 done
- ✅ **Fully Tested**: Sections 1-9 done
- 🎉 **Production Ready**: ALL sections done

---

## Quick Commands Reference

```bash
# Start everything
./setup_database.sh

# Validate setup
python3 validate_setup.py

# Run tests
pytest tests/test_database.py -v

# Start app
uvicorn main:app --reload --port 7001

# Check health
curl http://localhost:7001/health

# Access database
docker-compose exec postgres psql -U ultrathink ultrathink_dev

# View logs
docker-compose logs -f postgres
tail -f orchestrator.log

# Stop services
docker-compose down

# Reset database (⚠️ DELETES ALL DATA)
docker-compose down -v
./setup_database.sh
```

---

**Once all checkboxes are marked, your database setup is complete!** 🎉

For issues, see:
- QUICKSTART.md (common problems)
- DATABASE_README.md (detailed docs)
- IMPROVEMENTS_MADE.md (recent fixes)
