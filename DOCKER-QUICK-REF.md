# Docker Quick Reference

## Quick Start
```bash
# Setup
cp orchestrator/.env.example orchestrator/.env
docker compose up -d

# Access
http://localhost:3000  # Frontend
http://localhost:7001  # Backend API
```

## Common Commands
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f
docker compose logs -f backend

# Rebuild after code changes
docker compose up -d --build

# Check status
docker compose ps

# Restart a service
docker compose restart backend
```

## Troubleshooting
```bash
# View backend logs
docker compose logs backend

# Execute commands in container
docker compose exec backend bash

# Run migrations
docker compose exec backend alembic upgrade head

# Check health
curl http://localhost:7001/health
```

See [DOCKER.md](DOCKER.md) for complete documentation.
