# 🌐 Web UI for Drug Discovery Orchestrator

Quick localhost web interface to test the pipeline.

## Quick Start

### 1. Start All Services
```bash
cd ~/hackathon
./START_SERVICES.sh
```

Wait 15 seconds for services to start.

### 2. Start Web Server
In a new terminal:
```bash
cd ~/hackathon/web
python server.py
```

### 3. Open Browser
```
http://localhost:3000
```

## What You Can Do

- **Run Discovery**: Click the green button to generate molecules
- **Check Health**: Verify all 3 services are online
- **View Results**: See top 5 candidates with SMILES, scores, properties
- **Raw JSON**: See the full API response

## Buttons

| Button | Action |
|--------|--------|
| 🚀 RUN DISCOVERY | Start full pipeline (30-120 seconds) |
| 💓 CHECK HEALTH | Verify orchestrator is online |
| 🔍 SMART-CHEM | Check molecular generation service |
| 🧪 BIONEMO | Check validation & docking service |

## Inputs

- **Target Name**: Disease/protein target (e.g., "EBNA1", "SARS-CoV-2")
- **Molecules**: Number to generate (1-50)
- **QED**: Drug-likeness target (0-1, higher = more drug-like)
- **LogP**: Lipophilicity (0-10, lower = more water-soluble)
- **SAS**: Synthetic accessibility (0-10, lower = easier to make)

## Features

✅ Functional JavaScript (no frameworks)
✅ Real API calls to orchestrator
✅ Live status updates
✅ JSON display
✅ Candidate ranking
✅ Health checks
✅ CORS-enabled
✅ Terminal-style dark theme

## Files

- `index.html` - Web interface
- `server.py` - HTTP server
- `README.md` - This file

## Ports

- **3000**: Web UI (this server)
- **7000**: Orchestrator API
- **8000**: Smart-Chem
- **5000**: BioNeMo

## Troubleshooting

**"Connection refused"**
- Make sure all 3 services are running: `./START_SERVICES.sh`
- Check ports: `curl http://localhost:7000/health`

**API not responding**
- Check orchestrator logs in the terminal
- Make sure Smart-Chem and BioNeMo are running

**No results showing**
- Wait for pipeline to complete (first run takes 60-120 seconds)
- Check the status bar at the top
- Look at browser console (F12) for errors

## Quick Demo

1. Click "💓 CHECK HEALTH" - should say "Orchestrator Online"
2. Click "🔍 SMART-CHEM" - should say "Smart-Chem: ONLINE"
3. Click "🧪 BIONEMO" - should say "BioNeMo: ONLINE"
4. Change target to "SARS-CoV-2"
5. Click "🚀 RUN DISCOVERY"
6. Watch the results appear!
