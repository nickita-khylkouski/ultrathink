# 🐳 Docker Deployment Guide

This guide explains how to run ULTRATHINK using Docker and Docker Compose.

## 📋 Prerequisites

- Docker 20.10+ installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ installed (usually included with Docker Desktop)
- At least 4GB RAM available for Docker
- 10GB free disk space

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Clone the repository (if not already done)
git clone https://github.com/nickita-khylkouski/ultrathink.git
cd ultrathink

# Copy environment files and configure
cp .env.docker.example .env
cp orchestrator/.env.example orchestrator/.env

# Generate a secure SECRET_KEY for both files
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
echo "SECRET_KEY=$SECRET_KEY" >> .env
echo "SECRET_KEY=$SECRET_KEY" >> orchestrator/.env

# Generate a secure database password
DB_PASSWORD=$(python -c "import secrets; print(secrets.token_urlsafe(16))")
echo "POSTGRES_PASSWORD=$DB_PASSWORD" >> .env

# Edit .env and orchestrator/.env to configure other settings as needed
# Important: Update ALLOWED_ORIGINS, POSTGRES_PASSWORD in production
```

### 2. Start All Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Application

- **Frontend**: http://localhost:3000

**Note**: By default, only the frontend is exposed to the host. Internal services (backend, database, redis) use Docker's internal networking and are not bound to host ports. This prevents port conflicts during deployment.

For local development, if you need direct access to internal services:
1. Copy `docker-compose.override.yml.example` to `docker-compose.override.yml`
2. Uncomment the services you need to access
3. Restart with `docker compose up -d`

The following services are available internally within the Docker network:
- **Backend API**: http://backend:7001 (internal)
- **API Documentation**: http://backend:7001/docs (internal)
- **Web Demo**: http://web:3000 (internal)
- **pgAdmin**: http://pgadmin:80 (internal)
- **PostgreSQL**: postgres:5432 (internal)
- **Redis**: redis:6379 (internal)

### 4. Initial Database Setup

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Verify database connection
curl http://localhost:7001/health
```

## 📦 Services Overview

The Docker setup includes the following services:

### Application Services

1. **backend** (Internal Port 7001)
   - FastAPI orchestrator
   - Handles drug discovery pipeline
   - Integrates with RDKit, ESMFold, MolGAN
   - Accessible via internal Docker network

2. **frontend** (Port 3000)
   - Next.js React application
   - Modern UI for drug discovery
   - Only service exposed to host by default

3. **web** (Internal Port 3000)
   - Simple demo/presentation server
   - Python HTTP server
   - Accessible via internal Docker network

### Infrastructure Services

4. **postgres** (Internal Port 5432)
   - PostgreSQL 15
   - Primary data store
   - Stores projects, molecules, predictions
   - Accessible only within Docker network

5. **redis** (Internal Port 6379)
   - Redis 7
   - Caching layer
   - Session storage
   - Accessible only within Docker network

6. **pgadmin** (Internal Port 80)
   - Database management UI
   - Optional (can be disabled in production)
   - Accessible only within Docker network

## 🔧 Configuration

### Environment Variables

Edit `orchestrator/.env` to configure:

```bash
# CORS - Add your frontend URLs
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,https://your-domain.com

# Security - Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-secret-key-here

# Database (auto-configured in docker-compose)
DATABASE_URL=postgresql://ultrathink:dev_password_change_in_prod@postgres:5432/ultrathink_dev

# Redis (auto-configured in docker-compose)
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=INFO

# Optional: OpenAI API for advanced features
# OPENAI_API_KEY=sk-...
```

### Production Configuration

For production deployment:

1. **Update passwords**:
   ```yaml
   # In docker-compose.yml, change:
   POSTGRES_PASSWORD: your-strong-password
   PGADMIN_DEFAULT_PASSWORD: your-admin-password
   ```

2. **Secure SECRET_KEY**:
   ```bash
   # Generate new key
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **Configure CORS properly**:
   ```bash
   ALLOWED_ORIGINS=https://your-production-domain.com
   ```

4. **Disable pgAdmin**:
   ```bash
   # Comment out pgadmin service in docker-compose.yml
   ```

5. **Use SSL/TLS**:
   - Add nginx reverse proxy
   - Configure SSL certificates

## 📝 Common Operations

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with build (after code changes)
docker-compose up -d --build

# Start and watch logs
docker-compose up
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data!)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Rebuild After Code Changes

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build backend
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Connect to PostgreSQL
docker-compose exec postgres psql -U ultrathink -d ultrathink_dev

# Backup database
docker-compose exec postgres pg_dump -U ultrathink ultrathink_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U ultrathink ultrathink_dev < backup.sql
```

### Execute Commands Inside Containers

```bash
# Open bash in backend container
docker-compose exec backend bash

# Run Python script
docker-compose exec backend python validate_setup.py

# Install additional package
docker-compose exec backend pip install package-name
```

## 🔍 Troubleshooting

### Port Conflicts

The default configuration uses Docker's internal networking to avoid port conflicts. Only the frontend (port 3000) is exposed to the host. If you still encounter port conflicts:

```bash
# Check if port 3000 is in use
lsof -i :3000

# Stop the process using the port or change the frontend port mapping:
# In docker-compose.yml, change frontend ports to:
# ports:
#   - "3001:3000"  # Map to a different host port
```

### Services Won't Start

```bash
# Check Docker logs
docker-compose logs backend

# Restart specific service
docker-compose restart backend
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U ultrathink

# Verify environment variables
docker-compose exec backend env | grep DATABASE_URL
```

### Build Failures

```bash
# Clean Docker cache
docker system prune -a

# Remove all containers and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Permission Issues

```bash
# Fix file permissions (Linux/Mac)
sudo chown -R $USER:$USER .

# On Windows, ensure Docker has access to the drive
```

### High Memory Usage

```bash
# Check container resource usage
docker stats

# Limit container resources in docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M
```

## 🏗️ Development Workflow

### Local Development with Hot Reload

For development, you may want to run services locally instead of in Docker:

```bash
# Option 1: Use docker-compose.override.yml for local access
cp docker-compose.override.yml.example docker-compose.override.yml
# Edit docker-compose.override.yml to expose needed services
docker-compose up -d

# Option 2: Start only infrastructure services (DB, Redis)
docker-compose up -d postgres redis

# Run backend locally with hot reload
cd orchestrator
pip install -r requirements.txt
uvicorn main:app --reload --port 7001

# Run frontend locally with hot reload
cd frontend
npm install
npm run dev
```

### Debugging

```bash
# View real-time logs
docker-compose logs -f backend

# Execute Python debugger
docker-compose exec backend python -m pdb test_pipeline.py

# Check service health
curl http://localhost:7001/health
curl http://localhost:3000/api/health
```

## 🚢 Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml ultrathink

# Check services
docker service ls

# Scale services
docker service scale ultrathink_backend=3
```

### Using Kubernetes

See `k8s/` directory for Kubernetes manifests (if available).

### Using AWS ECS / Azure Container Instances / Google Cloud Run

1. Build and push images to a registry:
   ```bash
   docker-compose build
   docker tag ultrathink_backend your-registry/ultrathink-backend:latest
   docker push your-registry/ultrathink-backend:latest
   ```

2. Deploy using your cloud provider's container service

### Reverse Proxy with Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring

### Health Checks

```bash
# Backend health (from within Docker network or via frontend proxy)
docker-compose exec backend curl http://localhost:7001/health

# Frontend health
curl http://localhost:3000/api/health

# Database health
docker-compose exec postgres pg_isready -U ultrathink

# Redis health
docker-compose exec redis redis-cli ping
```

### Container Metrics

```bash
# Real-time resource usage
docker stats

# Check container logs
docker-compose logs --tail=50 -f backend
```

## 🔐 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for all services
3. **Generate unique SECRET_KEY** for each environment
4. **Limit CORS origins** to trusted domains only
5. **Disable pgAdmin** in production
6. **Use SSL/TLS** for all external connections
7. **Regularly update** Docker images and dependencies
8. **Run containers as non-root** (already configured)
9. **Use Docker secrets** for sensitive data in production
10. **Enable Docker content trust** for image verification

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)

## 💡 Tips

1. **Use `.dockerignore`**: Reduces build context size (already configured)
2. **Multi-stage builds**: Reduces final image size (already implemented)
3. **Volume mounts**: Persist data between container restarts
4. **Health checks**: Ensure services are ready before accepting traffic
5. **Resource limits**: Prevent containers from consuming all system resources
6. **Logging drivers**: Configure log rotation to prevent disk fill-up

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify service health: `curl http://localhost:7001/health`
3. Review this documentation
4. Check GitHub Issues
5. Consult the main README.md for application-specific help

---

**Built for AGI House Hackathon 2026** 🧬✨
