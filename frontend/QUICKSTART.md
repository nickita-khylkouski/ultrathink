# 🚀 Quick Start Guide

## Get Started in 60 Seconds

### 1. Prerequisites
```bash
# Ensure you have Node.js 18+ installed
node --version  # Should be v18.0.0 or higher

# Ensure backend is running
cd ../orchestrator
python main.py  # Should start on port 7001
```

### 2. Install & Run
```bash
# In a new terminal, navigate to frontend
cd /Users/nickita/hackathon/frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

### 3. Open Browser
Navigate to: **http://localhost:3000** (or http://localhost:3001 if 3000 is in use)

## ✅ What You Should See

### Home Screen
- **Header**: "🧬 AI DRUG DISCOVERY PLATFORM 🔬"
- **Connection Status**: Green pulsing dot in top-right (if backend is online)
- **Status Bar**: "System Online" (green) or "System Offline" (red)
- **Three Tabs**:
  - System 1: Drug Discovery
  - ESMFold: Protein Structure
  - MolGAN: Evolution

### Test System 1: Drug Discovery
1. Click **"System 1: Drug Discovery"** tab (should be active by default)
2. In the "DISCOVERY CONTROLS" panel:
   - Target field shows "EBNA1"
   - Number of molecules shows "5"
3. Click **🚀 DISCOVER** button
4. Wait 5-10 seconds
5. Should see 5 candidates appear in "CANDIDATES" panel
6. Click any candidate to see:
   - Properties in right panel
   - 3D molecule structure below

### Test System 2: ESMFold
1. Click **"ESMFold: Protein Structure"** tab
2. Click **"EBNA1"** button (loads common protein)
3. Click **⚡ PREDICT STRUCTURE** button
4. Wait ~10 seconds
5. Should see:
   - Prediction confidence
   - Processing time
   - 3D protein structure (cartoon representation)

### Test System 3: MolGAN
1. Click **"MolGAN: Evolution"** tab
2. Click **💊 Aspirin** button (loads SMILES)
3. Set "Number of Variants" to 50
4. Click **🧬 EVOLVE (Gen 1)** button
5. Wait ~15 seconds
6. Should see 50 variants (top 10 displayed)
7. Click any variant to see 3D structure

## 🔧 Troubleshooting

### "System Offline" Status
**Problem**: Red dot in top-right, status shows "System Offline"

**Solution**:
```bash
# Check if backend is running
curl http://localhost:7001/health

# If not running, start backend:
cd /Users/nickita/hackathon/orchestrator
python main.py
```

### Port 3000 Already in Use
**Problem**: Dev server starts on port 3001

**Solution**: This is normal! Just use http://localhost:3001 instead.

### 3D Viewer Not Loading
**Problem**: "Loading molecule..." never completes

**Solution**:
1. Check browser console for errors (F12)
2. Ensure internet connection (3Dmol.js loads from CDN)
3. Try refreshing the page (Ctrl+R)
4. Clear browser cache

### TypeScript Errors During Build
**Problem**: Build fails with type errors

**Solution**:
```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build
```

### API Errors (500, 503, etc.)
**Problem**: Requests fail with "HTTP 500" or similar

**Solution**:
1. Check backend logs in orchestrator terminal
2. Verify backend is healthy: `curl http://localhost:7001/health`
3. Restart backend if needed

## 📊 Expected Performance

| Action | Expected Time |
|--------|--------------|
| Page Load | < 2 seconds |
| Drug Discovery | 5-10 seconds |
| ESMFold Prediction | 10-15 seconds |
| MolGAN Evolution | 10-20 seconds |
| 3D Viewer Load | < 1 second |

## 🎯 Next Steps

1. **Read Full Documentation**: See `README.md` for detailed setup
2. **Explore Features**: See `FEATURES.md` for complete feature list
3. **Customize**: Modify colors in `tailwind.config.ts`
4. **Deploy**: See README.md "Deployment" section

## 💡 Pro Tips

### Keyboard Shortcuts
- `Enter` in any form = Submit
- `Ctrl+D` = Download current selection
- `Ctrl+K` = Clear results (planned)

### Quick Testing
```bash
# Test all 3 systems in sequence:
1. Click "DISCOVER" on System 1
2. Switch to ESMFold tab, click "EBNA1", then "PREDICT"
3. Switch to MolGAN tab, click "Aspirin", then "EVOLVE"
4. All 3 should work independently
```

### Data Persistence
- Drug discovery candidates are saved to localStorage
- Reload page to see saved candidates
- Click "DISCOVER" again to generate new ones

### Viewing Network Requests
1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Click "DISCOVER" button
4. Should see POST request to `http://localhost:7001/orchestrate/demo`
5. Check response for candidate data

## 📞 Need Help?

### Check These First:
1. Backend running? → `curl http://localhost:7001/health`
2. Frontend running? → Browser shows "AI Drug Discovery Platform"
3. Console errors? → F12 → Console tab
4. Network errors? → F12 → Network tab

### Common Issues:
- **Empty candidates list** → Backend offline or returning errors
- **No 3D viewer** → Check internet connection (CDN dependency)
- **Slow responses** → Backend processing, wait longer
- **Validation errors** → Check input format (protein: only ACDEFGHIKLMNPQRSTVWY)

## 🎉 You're Ready!

Your frontend is now running and ready to discover drugs, predict protein structures, and evolve molecules using AI!

**Happy Drug Discovery! 🧬💊🔬**
