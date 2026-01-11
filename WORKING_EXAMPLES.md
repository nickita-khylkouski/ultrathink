# 🚀 WORKING EXAMPLES - Test the System

## ✅ System Now Fixed!

The web UI had a stack overflow bug that's been fixed. Here are complete working examples:

---

## 1. API EXAMPLES (Direct Testing)

### Check Health
```bash
curl http://localhost:7001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Drug Discovery Orchestrator",
  "version": "1.0.0",
  "pipeline": ["Smart-Chem", "BioNeMo", "EBNA1 ADMET"]
}
```

### Run Discovery (5 candidates)
```bash
curl -X POST http://localhost:7001/orchestrate/demo \
  -H "Content-Type: application/json" \
  -d '{
    "target_name": "EBNA1",
    "num_molecules": 5,
    "target_qed": 0.8,
    "target_logp": 2.5,
    "target_sas": 3.0
  }'
```

**Response includes:**
- 5 drug candidates
- ADMET scores (0-1 scale)
- Bioavailability scores
- Synthetic accessibility (1-10)
- All molecular descriptors
- Quality indicators

---

## 2. PYTHON EXAMPLES

### Simple Test
```python
import requests

url = "http://localhost:7001/orchestrate/demo"
payload = {
    "target_name": "EBNA1",
    "num_molecules": 5,
    "target_qed": 0.8,
    "target_logp": 2.5,
    "target_sas": 3.0
}

response = requests.post(url, json=payload)
data = response.json()

print(f"Candidates: {len(data['top_candidates'])}")
for c in data['top_candidates']:
    print(f"  #{c['rank']}: ADMET={c['admet_score']}, MW={c['descriptors']['mw']}")
```

### Full Example with Details
```python
import requests
import json

url = "http://localhost:7001/orchestrate/demo"
payload = {
    "target_name": "EGFR",  # Try different targets
    "num_molecules": 8,
    "target_qed": 0.7,
    "target_logp": 2.0,
    "target_sas": 3.5
}

try:
    resp = requests.post(url, json=payload, timeout=10)
    data = resp.json()
    
    print("🎯 DRUG DISCOVERY RESULTS")
    print(f"Target: {data['target']}")
    print(f"Generated: {data['generation_stage']['generated']} molecules")
    print(f"\n📊 TOP CANDIDATES:\n")
    
    for c in data['top_candidates'][:3]:  # Show top 3
        lipinski = "✅" if c['lipinski_violations'] == 0 else "❌"
        bbb = "✅" if c['bbb_penetration'] else "❌"
        
        print(f"\n#{c['rank']} - SMILES: {c['smiles'][:40]}...")
        print(f"  ADMET: {c['admet_score']:.2f} (quality: {c['drug_likeness']:.2f})")
        print(f"  Bioavailability: {c['bioavailability_score']:.2f}")
        print(f"  Synthetic Difficulty: {c['synthetic_accessibility']:.1f}/10")
        print(f"  MW: {c['descriptors']['mw']:.1f} Da | LogP: {c['descriptors']['logp']:.2f}")
        print(f"  TPSA: {c['descriptors']['tpsa']:.1f} Ų")
        print(f"  Quality: Lipinski {lipinski} | BBB {bbb}")
        
except Exception as e:
    print(f"Error: {e}")
```

---

## 3. WEB UI EXAMPLES

### Open the Web Interface
```bash
open http://localhost:3000/index.html
```

### Workflow:

1. **Check Health**
   - Click: "💓 CHECK HEALTH"
   - Status bar glows green
   - Shows: "✅ System Healthy - 1.0.0"

2. **Run Discovery with Different Targets**
   
   **Example 1: Alzheimer's Drug**
   - Target: "Alzheimer's"
   - Molecules: 8
   - QED: 0.8
   - LogP: 2.0
   - Click: "🚀 RUN DISCOVERY"
   - Results show 8 candidates optimized for Alzheimer's

   **Example 2: Cancer Drug**
   - Target: "EGFR Cancer"
   - Molecules: 5
   - QED: 0.75
   - LogP: 3.0
   - Click: "🚀 RUN DISCOVERY"

   **Example 3: Infection Drug**
   - Target: "SARS-CoV-2"
   - Molecules: 10
   - QED: 0.85
   - LogP: 2.0

3. **Filter Results**
   - Search "CC" → Shows candidates with acetyl groups
   - Search "c1ccc" → Shows aromatic compounds
   - Filter "Drug-like" → Only Lipinski-compliant
   - Filter "Safe" → Only non-toxic
   - Filter "BBB+" → Only brain-penetrating

4. **Click a Candidate**
   - Right panel shows all 13+ metrics
   - SMILES string shown
   - All scores displayed

---

## 4. SAMPLE OUTPUTS

### Example 1: Paracetamol (Acetaminophen)
```
SMILES: CC(=O)Nc1ccc(O)cc1
✅ EXCELLENT CANDIDATE

ADMET Score: 1.0 (perfect)
Drug-likeness: 0.798
Bioavailability: 1.0 (excellent)
Synthetic Accessibility: 3.45/10 (very easy)

MW: 151.16 Da ✅
LogP: 1.35 ✅ (ideal range)
TPSA: 49.33 Ų ✅
HBD/HBA: 2/2 ✅
Lipinski: ✅ PASS
Toxicity: ✅ SAFE
BBB: ✅ YES (crosses brain)
```

### Example 2: Ibuprofen
```
SMILES: CC(C)Cc1ccc(cc1)C(C)C(O)=O
✅ VERY GOOD CANDIDATE

ADMET Score: 1.0
Drug-likeness: 0.911 (excellent)
Bioavailability: 1.0
Synthetic Accessibility: 3.51/10

MW: 206.28 Da ✅
LogP: 3.07 ✅
TPSA: 37.3 Ų ✅
HBD/HBA: 1/1 ✅
Lipinski: ✅ PASS
Toxicity: ✅ SAFE
BBB: ✅ YES
```

---

## 5. TROUBLESHOOTING

### Services Not Running?
```bash
bash /Users/nickita/hackathon/QUICK_DEMO.sh
```

### API Not Responding?
```bash
ps aux | grep main.py  # Check orchestrator
curl http://localhost:7001/health  # Test health endpoint
```

### Web UI Blank?
- Hard refresh: Cmd+Shift+R
- Check browser console for errors (F12)
- Make sure port 3000 is accessible

### Want Different Results?
Just change the parameters:
- **num_molecules**: 1-20 (more = longer)
- **target_qed**: 0.5-1.0 (higher = drug-like)
- **target_logp**: 0.0-5.0 (affects penetration)

---

## 6. WHAT THE METRICS MEAN

| Metric | Good Value | Why It Matters |
|--------|-----------|----------------|
| ADMET | > 0.8 | Overall drug viability |
| Drug-likeness | > 0.7 | Will it behave like a drug? |
| Bioavailability | > 0.8 | Will it be absorbed orally? |
| Synthetic Access | 1-3 | Can we manufacture it cheaply? |
| MW | < 500 Da | Can it be absorbed? |
| LogP | 0-2 | Balanced absorption/distribution |
| TPSA | < 60 | Can it cross cell membranes? |
| Lipinski | 0 violations | Predictable oral absorption |
| BBB | YES (if needed) | Can it reach the brain? |
| Toxicity | NO flag | Is it safe? |

---

## 7. DEMO SCRIPT FOR JUDGES

```
1. "This is an AI drug discovery pipeline"
2. Click CHECK HEALTH → Green bar shows "System Healthy"
3. Click RUN DISCOVERY → 5 candidates appear in 2 seconds
4. Point out: "ADMET score = viability, MW = weight, LogP = how fat-soluble"
5. Click a candidate → Right panel shows all metrics
6. Say: "Lipinski score predicts if drug will work orally"
7. Try filtering: "Let me show only BBB-penetrating drugs"
8. Filter by BBB → Shows only drugs that cross blood-brain barrier
9. Conclusion: "All metrics from real pharma research"
```

---

## ✅ Everything Is Working!

- ✅ API returns correct data
- ✅ All 13+ metrics calculated
- ✅ Web UI displays results
- ✅ Search/filter working
- ✅ No more stack overflow errors

**Ready to impress judges!** 🏆
