# Database Migrations with Alembic

This directory contains database migration scripts managed by Alembic.

## Setup

1. Install dependencies:
```bash
pip install -r ../requirements.txt
```

2. Start PostgreSQL (if not running):
```bash
docker-compose up -d postgres
```

3. Set environment variable (optional, uses default if not set):
```bash
export DATABASE_URL="postgresql+asyncpg://ultrathink:dev_password_change_in_prod@localhost:5432/ultrathink_dev"
```

## Common Commands

### Generate a new migration (auto-detect changes)
```bash
cd /Users/nickita/hackathon/orchestrator
alembic revision --autogenerate -m "Description of changes"
```

Example:
```bash
alembic revision --autogenerate -m "Add molecule properties columns"
```

### Apply migrations (upgrade to latest)
```bash
alembic upgrade head
```

### Downgrade to previous version
```bash
alembic downgrade -1
```

### View migration history
```bash
alembic history --verbose
```

### View current database version
```bash
alembic current
```

### Downgrade to specific revision
```bash
alembic downgrade <revision_id>
```

### Upgrade to specific revision
```bash
alembic upgrade <revision_id>
```

## Migration Workflow

1. **Modify Models**: Edit files in `database/models.py`

2. **Generate Migration**:
   ```bash
   alembic revision --autogenerate -m "Add new field to User model"
   ```

3. **Review Migration**: Check the generated file in `alembic/versions/`
   - Alembic auto-detects most changes, but always review!
   - May need to manually add data migrations or complex operations

4. **Apply Migration**:
   ```bash
   alembic upgrade head
   ```

5. **Commit Migration**: Add the migration file to git
   ```bash
   git add alembic/versions/<timestamp>_*.py
   git commit -m "Add migration: <description>"
   ```

## What Alembic Auto-Detects

✅ **Automatically Detected:**
- New tables
- New columns
- Column type changes
- Index changes
- Foreign key constraints

❌ **NOT Auto-Detected (add manually):**
- Table/column renames (appears as drop + create)
- Data migrations
- Enum type changes
- Complex constraint changes

## Example: Manual Data Migration

```python
def upgrade() -> None:
    # Add column
    op.add_column('molecules', sa.Column('tags', sa.ARRAY(sa.String()), nullable=True))

    # Data migration
    op.execute("""
        UPDATE molecules
        SET tags = ARRAY['imported']::varchar[]
        WHERE generation_method = 'manual'
    """)

def downgrade() -> None:
    op.drop_column('molecules', 'tags')
```

## Initial Migration (First Time Setup)

If starting fresh with no existing database:

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply it
alembic upgrade head
```

## Troubleshooting

### "Target database is not up to date"
```bash
alembic stamp head  # Mark current state as latest
```

### "No module named 'database'"
Make sure you're running from the orchestrator directory:
```bash
cd /Users/nickita/hackathon/orchestrator
```

### Reset database completely (DANGER: Deletes all data!)
```bash
docker-compose down -v
docker-compose up -d postgres
alembic upgrade head
```

## Best Practices

1. **Always review auto-generated migrations** before applying
2. **Test migrations on dev database** before production
3. **Keep migrations small and focused** - one logical change per migration
4. **Never edit applied migrations** - create a new migration instead
5. **Backup production database** before running migrations
6. **Use transactions** - most migrations run in a transaction automatically
