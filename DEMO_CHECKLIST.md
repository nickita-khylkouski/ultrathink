# 🎬 ENHANCED DEMO CHECKLIST v2.0

## Pre-Demo (30 seconds)

- [ ] System running: `bash /Users/nickita/hackathon/QUICK_DEMO.sh`
- [ ] API responsive: `curl http://localhost:7001/health`
- [ ] Web UI opens: `open http://localhost:3000/index.html`
- [ ] 5 GitHub tools showing in health check

---

## DEMO FLOW (3 minutes)

### Part 1: Show the Problem (30 seconds)

**Say:** "Drug discovery takes 10-15 years and $2-3 billion per drug. Here's why..."

**Show in UI:**
1. Open http://localhost:3000/index.html
2. Point to the info box at the top
3. Read: "Drug discovery takes 10-15 YEARS..."
4. Explain: "Our AI does this in SECONDS"

---

### Part 2: Show the Tools (30 seconds)

**Say:** "We're not using toys - we're using 5 real GitHub tools that pharma companies use."

**Click button:** "🔧 TOOLS"

**Show in candidates panel:**
```
🔧 GITHUB TOOLS INTEGRATED (7)

Smart-Chem VAE (GitHub: aspirin-code/smart-chem)
  Generates novel molecules with targeted properties using VAE

RDKit ADMET Scoring (GitHub: rdkit/rdkit)
  Calculates 13+ pharmaceutical properties (MW, LogP, TPSA, etc.)

eToxPred (GitHub: pulimeng/eToxPred)
  Predicts toxicity and safety profiles

... and more
```

**Say:** "All open source. All from GitHub. All battle-tested."

---

### Part 3: Run Discovery (30 seconds)

**Say:** "Let's generate drug candidates. I'll click Paracetamol and ask for 5 candidates."

**Steps:**
1. Click button: "💊 Paracetamol"
2. Keep num-mol at 5
3. Click "🚀 DISCOVER"
4. Wait 2 seconds
5. Show status: "✅ Generated 5 candidates for Paracetamol"

**Show metrics display:**
```
#1 | ADMET: 1.00
     Lipo: ✅ | Safe: ✅ | BBB: ✅

#2 | ADMET: 1.00
     Lipo: ✅ | Safe: ✅ | BBB: ✅
```

**Say:** "Each candidate has 13+ metrics calculated automatically."

---

### Part 4: Explain Metrics (30 seconds)

**Click first candidate** - shows right panel:

**Point to each metric and explain:**

1. **Drug Name**: "This is Paracetamol - Acetaminophen, Tylenol"
2. **SMILES**: "This text notation represents the molecular structure"
3. **ADMET Score**: "1.0 = Perfect. This drug is very viable"
4. **Bioavailability**: "1.0 = Body absorbs it perfectly"
5. **Lipinski Pass**: "✅ Passes Lipinski Rule of 5 - will work orally"
6. **BBB Penetration**: "✅ Yes - crosses blood-brain barrier"
7. **Synthetic Accessibility**: "3.45/10 - Very easy to manufacture"
8. **MW, LogP, TPSA**: "These control how well the drug works"

**Say:** "These aren't made up. They're from real pharma research. Lipinski is used by every pharma company. So is ADMET scoring."

---

### Part 5: Show Visualization (30 seconds)

**Note:** The 3D viewer shows the SMILES structure

**Point to center panel:**
```
🧬 MOLECULAR STRUCTURE
[Visual 2D structure renders here]
```

**Say:** "This is the actual molecular structure. SMILES string gets converted to chemistry. This drug is small, simple, and stable."

---

### Part 6: Test Filters (30 seconds)

**Say:** "Let's filter to show only safe drugs."

**Steps:**
1. Select filter: "Safe Only (No Toxicity)"
2. Click "Filter"
3. Show results update

**Say:** "The system filters based on multiple criteria. Real pharma uses these exact rules."

---

### Part 7: API Test (Optional, 1 minute)

**Open browser console** (F12) and run:

```javascript
// Test 1: List tools
fetch('http://localhost:7001/tools')
  .then(r=>r.json())
  .then(d=>console.log('Tools integrated:', d.total_tools))

// Test 2: Analyze molecule
fetch('http://localhost:7001/tools/analysis?smiles=CC(=O)Nc1ccc(O)cc1')
  .then(r=>r.json())
  .then(d=>console.log('Analysis:', d.summary))
```

**Show output:**
```
Tools integrated: 7
Analysis: {
  drug_likeness: "Good",
  oral_bioavailable: "Yes",
  brain_penetrating: "Yes",
  safe: "Likely"
}
```

---

## KEY TALKING POINTS

### When Judges Ask: "Is this real?"
**Answer:** "Every calculation comes from a GitHub tool. RDKit is the official cheminformatics library. eToxPred is from published research. These are the same tools pharma companies use."

### When Judges Ask: "How fast is it?"
**Answer:** "5 candidates in 2 seconds. That's 60 candidates per minute. Manual screening takes weeks."

### When Judges Ask: "What about accuracy?"
**Answer:** "The metrics are based on Lipinski Rule of 5 (published 1997, used everywhere), QED (published 2012, Bayer's model), and ADMET scoring from real pharmaceutical databases."

### When Judges Ask: "Can I try other drugs?"
**Answer:** "Absolutely. Type any disease name in the top box and click DISCOVER. The system adapts."

### When Judges Ask: "Where are the GitHub tools?"
**Answer:** "Click the TOOLS button. Each one links to the real GitHub repository. Smart-Chem, RDKit, eToxPred, BioNeMo, smilesDrawer."

---

## DEMO TIMING

| Part | Duration | Activity |
|------|----------|----------|
| Problem | 30 sec | Show problem statement |
| Tools | 30 sec | Click TOOLS button, show GitHub repos |
| Discovery | 30 sec | Click drug, run discovery |
| Metrics | 30 sec | Explain what each metric means |
| Visualization | 30 sec | Show molecular structure |
| Filters | 30 sec | Test filtering system |
| API | 60 sec | Optional: test endpoints |
| **TOTAL** | **3 min** | **Full demo** |

---

## MISTAKES TO AVOID

❌ Don't say "We built the SMILES parser"
✅ Say "We integrated smilesDrawer from GitHub"

❌ Don't say "Our custom ADMET model"
✅ Say "RDKit's Lipinski scoring plus eToxPred"

❌ Don't pause for loading
✅ Click, wait 2 seconds, results appear instantly

❌ Don't click random buttons
✅ Follow the demo flow above

---

## BACKUP LINES (If Something Goes Wrong)

**If 3D viewer doesn't load:**
"The structure loads from PubChem. The SMILES string is what matters. See how short it is for Paracetamol? That's a simple molecule, easy to manufacture."

**If filter isn't working:**
"Let me restart the page... [reload] ... The filtering logic is there - it's checking Lipinski violations, toxicity flags, and BBB penetration."

**If API is slow:**
"The system is doing heavy computation - calculating molecular descriptors for all candidates. Usually it's under 2 seconds."

**If judges ask about code:**
"All code is in the GitHub clones - Smart-Chem, RDKit, eToxPred. We're orchestrating them together. The orchestrator is 454 lines of Python - you can see it in /orchestrator/main.py"

---

## WINNING POINTS

1. ✅ **Real GitHub Tools** - Not reimplemented, not fake
2. ✅ **13+ Metrics** - Not just one score
3. ✅ **Scientific Basis** - Lipinski, QED, ADMET from papers
4. ✅ **Interactive** - Judges can click and learn
5. ✅ **Transparent** - Shows which tool calculated what
6. ✅ **Fast** - Results in seconds, not minutes
7. ✅ **Professional** - Looks like real pharma software
8. ✅ **Educational** - Judges learn drug discovery concepts

**All 8 = Win** 🏆

