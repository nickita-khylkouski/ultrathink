# Transaction Management Guide

## 🎯 Understanding Database Transactions

This guide explains how transactions work in the UltraThink Drugs database layer and common patterns to follow.

## Transaction Pattern (Repositories Control Transactions)

### ✅ Correct Pattern

In our architecture, **repositories are responsible for committing** their own transactions:

```python
class MoleculeRepository:
    async def create(self, molecule_data: Dict[str, Any]) -> Molecule:
        molecule = Molecule(**molecule_data)
        self.session.add(molecule)
        await self.session.commit()  # ✅ Repository commits
        await self.session.refresh(molecule)
        return molecule
```

The FastAPI dependency provides the session but does **NOT** auto-commit:

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # Don't auto-commit - repositories handle this
        except Exception:
            await session.rollback()  # Only rollback on error
            raise
        finally:
            await session.close()
```

### Why This Pattern?

✅ **Advantages:**
- Repositories control their own transaction boundaries
- Simple single-operation endpoints work automatically
- Clear ownership of when data is persisted

❌ **Limitation:**
- Multiple repository calls create separate transactions
- Can't rollback across multiple operations easily

## Multi-Operation Transactions

When you need **atomicity across multiple repository operations**, use manual transaction control:

### Pattern 1: Manual Transaction Control

```python
@app.post("/projects/{project_id}/batch-molecules")
async def create_molecules_atomic(
    project_id: str,
    molecules: List[MoleculeCreate],
    db: AsyncSession = Depends(get_db)
):
    """
    Create multiple molecules atomically.
    All succeed or all fail together.
    """
    repo = MoleculeRepository(db)

    try:
        created_molecules = []
        for mol_data in molecules:
            # Don't commit yet - we'll do it at the end
            molecule = Molecule(**mol_data)
            db.add(molecule)
            created_molecules.append(molecule)

        # Single commit for all molecules
        await db.commit()

        # Refresh all at once
        for mol in created_molecules:
            await db.refresh(mol)

        return created_molecules

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

### Pattern 2: Using Repository with Custom Commit

Create a repository method that doesn't commit:

```python
class MoleculeRepository:
    async def create_without_commit(self, molecule_data: Dict[str, Any]) -> Molecule:
        """Create molecule but don't commit (caller controls transaction)"""
        properties = self._calculate_properties(molecule_data['smiles'])
        full_data = {**molecule_data, **properties}

        molecule = Molecule(**full_data)
        self.session.add(molecule)
        # No commit here!
        return molecule

    async def create(self, molecule_data: Dict[str, Any]) -> Molecule:
        """Standard create with commit"""
        molecule = await self.create_without_commit(molecule_data)
        await self.session.commit()
        await self.session.refresh(molecule)
        return molecule
```

Then use it:

```python
async def batch_create_molecules(project_id: uuid.UUID, molecules_data: List[Dict]):
    async with get_db_context() as db:
        repo = MoleculeRepository(db)

        molecules = []
        for mol_data in molecules_data:
            mol = await repo.create_without_commit(mol_data)
            molecules.append(mol)

        # Commit all at once
        await db.commit()

        # Refresh all
        for mol in molecules:
            await db.refresh(mol)

        return molecules
```

### Pattern 3: Context Manager for Complex Workflows

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def atomic_operation(db: AsyncSession):
    """
    Context manager for complex multi-step operations.

    Usage:
        async with atomic_operation(db) as session:
            await step1(session)
            await step2(session)
            await step3(session)
            # All committed together when context exits
    """
    try:
        yield db
        await db.commit()
    except Exception:
        await db.rollback()
        raise
```

Usage:

```python
@app.post("/complex-workflow")
async def complex_workflow(db: AsyncSession = Depends(get_db)):
    async with atomic_operation(db):
        # Create project
        project = Project(...)
        db.add(project)
        await db.flush()  # Get project.id without committing

        # Create molecules for project
        for i in range(10):
            molecule = Molecule(project_id=project.id, ...)
            db.add(molecule)

        # Add predictions
        for mol in molecules:
            prediction = ADMETPrediction(molecule_id=mol.id, ...)
            db.add(prediction)

        # All committed when context exits
```

## ⚠️  Anti-Patterns to Avoid

### ❌ WRONG: Double Commit

```python
# DON'T DO THIS
async def create_molecule(db: AsyncSession = Depends(get_db)):
    repo = MoleculeRepository(db)
    molecule = await repo.create(data)  # Commits here
    await db.commit()  # Commits again! ❌
    return molecule
```

**Why it's wrong:** Repository already committed. Second commit is redundant.

### ❌ WRONG: Committing in Loop

```python
# DON'T DO THIS
async def create_many(molecules: List[Dict], db: AsyncSession = Depends(get_db)):
    repo = MoleculeRepository(db)
    for mol_data in molecules:
        await repo.create(mol_data)  # Commits each iteration ❌
```

**Why it's wrong:**
- Creates 100 separate transactions for 100 molecules
- Slow (network round-trip per commit)
- Can't rollback all if one fails

**Fix:** Use bulk_create or manual transaction control

### ❌ WRONG: Not Handling Rollback

```python
# DON'T DO THIS
async def risky_operation(db: AsyncSession = Depends(get_db)):
    db.add(Molecule(...))
    db.add(Project(...))
    await db.commit()  # If this fails, no rollback! ❌
```

**Fix:** Always use try/except for manual commits:

```python
async def safe_operation(db: AsyncSession = Depends(get_db)):
    try:
        db.add(Molecule(...))
        db.add(Project(...))
        await db.commit()
    except Exception:
        await db.rollback()
        raise
```

## 🔍 Debugging Transactions

### Check if Transaction is Dirty

```python
if db.dirty:
    print(f"Uncommitted changes: {db.dirty}")
```

### Check if Transaction is Active

```python
if db.in_transaction():
    print("Transaction is active")
```

### View Pending Changes

```python
print(f"New objects: {db.new}")
print(f"Modified objects: {db.dirty}")
print(f"Deleted objects: {db.deleted}")
```

## 📊 Performance Considerations

### Commit Frequency

| Pattern | Commits | Performance | Use Case |
|---------|---------|-------------|----------|
| `create()` in loop | 100 | Slow ❌ | Never do this |
| `bulk_create()` | 1 | Fast ✅ | Many objects |
| Manual transaction | 1 | Fast ✅ | Complex workflow |

### Example: Bulk Insert Performance

```python
# ❌ SLOW: 100 commits
for i in range(100):
    await repo.create(molecule_data)  # ~5 seconds

# ✅ FAST: 1 commit
await repo.bulk_create(molecules_data)  # ~0.5 seconds
```

## 🎓 Best Practices

1. **Single Operations:** Use repository's `create()` method
   ```python
   molecule = await repo.create(data)  # Simple and clean
   ```

2. **Bulk Operations:** Use repository's `bulk_create()` method
   ```python
   molecules = await repo.bulk_create(many_data)  # 10x faster
   ```

3. **Complex Workflows:** Manual transaction control
   ```python
   async with atomic_operation(db):
       # Multiple operations
       # Single commit
   ```

4. **Always Handle Errors:**
   ```python
   try:
       await db.commit()
   except Exception:
       await db.rollback()
       raise
   ```

5. **Use Flush for Dependencies:**
   ```python
   db.add(project)
   await db.flush()  # Get project.id without committing
   db.add(Molecule(project_id=project.id, ...))
   await db.commit()  # Commit both together
   ```

## 🚨 Transaction Isolation Levels

PostgreSQL default: `READ COMMITTED`

To change isolation level:

```python
from sqlalchemy import create_engine

engine = create_async_engine(
    DATABASE_URL,
    isolation_level="REPEATABLE READ"  # or "SERIALIZABLE"
)
```

Levels:
- `READ COMMITTED` - Default, good for most use cases
- `REPEATABLE READ` - Prevents non-repeatable reads
- `SERIALIZABLE` - Full isolation, but slowest

## 📚 Further Reading

- [SQLAlchemy Session Basics](https://docs.sqlalchemy.org/en/20/orm/session_basics.html)
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [FastAPI Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)

---

**Remember:** Repositories commit, FastAPI dependency handles rollback. Keep it simple! ✅
