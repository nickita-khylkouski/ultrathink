#!/bin/bash

echo "🧬 AI DRUG DISCOVERY PIPELINE - QUICK START"
echo "=========================================="
echo ""

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -f "python.*main.py" 2>/dev/null
pkill -f "http.server" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null
sleep 1

# Start orchestrator
echo "Starting Orchestrator (port 7001)..."
cd /Users/nickita/hackathon/orchestrator
python main.py > /tmp/orch.log 2>&1 &
ORCH_PID=$!
sleep 2

# Start web server
echo "Starting Web UI (port 3000)..."
cd /Users/nickita/hackathon/web
python3 -m http.server 3000 > /tmp/web.log 2>&1 &
WEB_PID=$!
sleep 1

# Test health
echo ""
echo "Testing system health..."
HEALTH=$(curl -s http://localhost:7001/health | jq '.status' 2>/dev/null)

if [ "$HEALTH" = "\"healthy\"" ]; then
    echo "✅ Orchestrator: ONLINE"
else
    echo "❌ Orchestrator: OFFLINE - Check /tmp/orch.log"
fi

if curl -s http://localhost:3000/index.html | grep -q "AI Drug Discovery"; then
    echo "✅ Web UI: ONLINE"
else
    echo "❌ Web UI: OFFLINE"
fi

echo ""
echo "=========================================="
echo "🚀 READY TO DEMO!"
echo "=========================================="
echo ""
echo "Open in browser:"
echo "  http://localhost:3000/index.html"
echo ""
echo "Demo flow:"
echo "  1. Click '💓 CHECK HEALTH' → Watch status bar glow"
echo "  2. Click '🚀 RUN DISCOVERY' → See 5 drug candidates"
echo "  3. Click any candidate → View molecular composition"
echo ""
echo "To stop all services:"
echo "  kill $ORCH_PID $WEB_PID"
echo ""
