#!/bin/bash
# UltraThink Drugs - Database Setup Script

set -e  # Exit on error

echo "🧬 UltraThink Drugs - Database Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo "Creating .env from template..."
    cp .env.template .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and update DATABASE_URL and other settings${NC}"
    echo ""
fi

# Step 1: Install dependencies
echo "📦 Step 1: Installing Python dependencies..."
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Start Docker services
echo "🐳 Step 2: Starting Docker services (PostgreSQL + Redis)..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found${NC}"
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

docker-compose up -d
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U ultrathink &> /dev/null; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
echo ""

# Step 3: Run database migrations
echo "🔄 Step 3: Creating database tables..."

# Check if initial migration exists
if [ ! -d "alembic/versions" ] || [ -z "$(ls -A alembic/versions)" ]; then
    echo "Creating initial migration..."
    alembic revision --autogenerate -m "Initial schema - users, projects, molecules, predictions"
    echo -e "${GREEN}✓ Migration created${NC}"
fi

echo "Applying migrations..."
alembic upgrade head
echo -e "${GREEN}✓ Database tables created${NC}"
echo ""

# Step 4: Verify database connection
echo "🔍 Step 4: Verifying database connection..."
python3 -c "
import asyncio
import sys
sys.path.insert(0, '.')
from database import check_db_connection

async def test():
    if await check_db_connection():
        print('${GREEN}✓ Database connection successful${NC}')
        return True
    else:
        print('${RED}❌ Database connection failed${NC}')
        return False

if asyncio.run(test()):
    sys.exit(0)
else:
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database setup complete!${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check your .env file and ensure PostgreSQL is running"
    exit 1
fi

echo ""
echo "===================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start the application:"
echo "   uvicorn main:app --reload --port 7001"
echo ""
echo "2. Run tests:"
echo "   pytest tests/test_database.py -v"
echo ""
echo "3. Access services:"
echo "   - Application: http://localhost:7001"
echo "   - Health check: http://localhost:7001/health"
echo "   - pgAdmin: http://localhost:5050"
echo "   - API docs: http://localhost:7001/docs"
echo ""
echo "4. View database:"
echo "   docker-compose exec postgres psql -U ultrathink ultrathink_dev"
echo ""
