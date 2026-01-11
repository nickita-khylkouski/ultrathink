#!/bin/bash

# 🧬 HACKATHON ORCHESTRATOR STARTUP SCRIPT
# Starts all 3 services and the orchestrator

HACKATHON_DIR=~/hackathon

echo "🚀 Starting Drug Discovery Platform..."
echo "======================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are already running
check_port() {
    nc -z localhost $1 2>/dev/null
}

echo -e "\n${YELLOW}Starting service 1: Smart-Chem (Port 8000)${NC}"
if check_port 8000; then
    echo "⚠️  Port 8000 already in use, skipping..."
else
    cd "$HACKATHON_DIR/Smart-Chem" 2>/dev/null && {
        echo "📦 Installing Smart-Chem dependencies..."
        pip install -q -r requirements.txt 2>/dev/null
        echo -e "${GREEN}✅ Starting Smart-Chem...${NC}"
        uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
        sleep 3
    } || echo "❌ Smart-Chem directory not found"
fi

echo -e "\n${YELLOW}Starting service 2: BioNeMo (Port 5000)${NC}"
if check_port 5000; then
    echo "⚠️  Port 5000 already in use, skipping..."
else
    cd "$HACKATHON_DIR/bionemo" 2>/dev/null && {
        echo "📦 Installing BioNeMo dependencies..."
        pip install -q flask rdkit requests 2>/dev/null
        echo -e "${GREEN}✅ Starting BioNeMo...${NC}"
        python app.py &
        sleep 3
    } || echo "❌ BioNeMo directory not found"
fi

echo -e "\n${YELLOW}Starting service 3: ORCHESTRATOR (Port 7001)${NC}"
if check_port 7001; then
    echo "⚠️  Port 7001 already in use, skipping..."
else
    cd "$HACKATHON_DIR/orchestrator" 2>/dev/null && {
        echo "📦 Installing Orchestrator dependencies..."
        pip install -q -r requirements.txt 2>/dev/null
        echo -e "${GREEN}✅ Starting Orchestrator...${NC}"
        python main.py &
        sleep 3
    } || echo "❌ Orchestrator directory not found"
fi

echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}✨ All services started!${NC}"
echo -e "${GREEN}=======================================${NC}\n"

echo "📍 Service Endpoints:"
echo "   • Smart-Chem:    http://localhost:8000"
echo "   • BioNeMo:       http://localhost:5000"
echo "   • Orchestrator:  http://localhost:7001"
echo ""
echo "🧪 To test the pipeline, run:"
echo "   cd ~/hackathon/orchestrator && python test_pipeline.py"
echo ""
echo "📊 To access the Smart-Chem frontend:"
echo "   cd ~/hackathon/Smart-Chem/frontend && npm run dev"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait
