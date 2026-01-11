#!/usr/bin/env python3
"""
🧬 Test the orchestration pipeline
Run from terminal: python test_pipeline.py
"""

import httpx
import json
import sys
from typing import Optional

ORCHESTRATOR_URL = "http://localhost:7001"

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def test_health():
    """Test if orchestrator is healthy"""
    try:
        with httpx.Client() as client:
            resp = client.get(f"{ORCHESTRATOR_URL}/health")
            print("✅ Orchestrator is online!")
            print(json.dumps(resp.json(), indent=2))
            return True
    except Exception as e:
        print(f"❌ Orchestrator offline: {e}")
        return False

def check_dependencies():
    """Check if Smart-Chem and BioNeMo are running"""
    print("\n🔍 Checking service dependencies...\n")

    with httpx.Client() as client:
        # Check Smart-Chem
        try:
            resp = client.get("http://localhost:8000/", timeout=2.0)
            print("✅ Smart-Chem is running on port 8000")
        except:
            print("⚠️  Smart-Chem is NOT running on port 8000")
            print("   Start it with: cd ~/hackathon/Smart-Chem && uvicorn backend.main:app --port 8000")

        # Check BioNeMo
        try:
            resp = client.get("http://localhost:5000/", timeout=2.0)
            print("✅ BioNeMo is running on port 5000")
        except:
            print("⚠️  BioNeMo is NOT running on port 5000")
            print("   Start it with: cd ~/hackathon/bionemo && python app.py")

def run_discovery(
    target: str = "EBNA1",
    num_molecules: int = 10,
    target_qed: float = 0.8,
    target_logp: float = 2.5,
    target_sas: float = 3.0,
    protein_pdb: Optional[str] = None
):
    """Run the drug discovery pipeline"""
    print_header(f"🚀 Running Drug Discovery for {target}")

    payload = {
        "target_name": target,
        "num_molecules": num_molecules,
        "target_qed": target_qed,
        "target_logp": target_logp,
        "target_sas": target_sas,
        "protein_pdb": protein_pdb
    }

    try:
        with httpx.Client(timeout=180.0) as client:
            print(f"📝 Request payload:")
            print(json.dumps(payload, indent=2))
            print("\n⏳ Pipeline running (this may take 30-120 seconds)...\n")

            resp = client.post(
                f"{ORCHESTRATOR_URL}/orchestrate/discover",
                json=payload
            )
            resp.raise_for_status()

            result = resp.json()

            print_header("✨ RESULTS")
            print(f"Target: {result['target']}")
            print(f"Timestamp: {result['timestamp']}")

            print("\n📊 Pipeline Stages:")
            print(f"\n1️⃣  Generation Stage:")
            print(f"   Generated: {result['generation_stage']['generated']}/{result['generation_stage']['requested']} molecules")
            print(f"   Properties: QED={result['generation_stage']['properties_targeted']['qed']}, "
                  f"LogP={result['generation_stage']['properties_targeted']['logp']}")

            print(f"\n2️⃣  Docking Stage:")
            print(f"   Validated: {result['docking_stage']['validated']} molecules")

            print(f"\n3️⃣  ADMET Stage:")
            print(f"   ADMET Predicted: {result['admet_stage']['predicted']} molecules")

            print("\n🏆 TOP 5 CANDIDATES:\n")
            for candidate in result['top_candidates']:
                print(f"Rank #{candidate['rank']}")
                print(f"  SMILES: {candidate['smiles']}")
                print(f"  QED Score: {candidate['qed']}")
                print(f"  ADMET Score: {candidate['admet_score']}")
                print(f"  MW: {candidate['descriptors']['mw']}, LogP: {candidate['descriptors']['logp']}")
                print(f"  Toxicity Flag: {candidate['toxicity_flag']}")
                print(f"  BBB Penetration: {candidate['bbb_penetration']}")
                print()

    except Exception as e:
        print(f"❌ Pipeline failed: {str(e)}")
        print("\n💡 Troubleshooting:")
        print("   1. Make sure all 3 services are running")
        print("   2. Check that Smart-Chem is on port 8000")
        print("   3. Check that BioNeMo is on port 5000")
        print("   4. Check that Orchestrator is on port 7000")

def main():
    print_header("🧬 HACKATHON DRUG DISCOVERY ORCHESTRATOR TEST")

    # Test health
    if not test_health():
        print("\n❌ Orchestrator is not running!")
        print("Start it with: cd ~/hackathon/orchestrator && python main.py")
        return

    # Check dependencies
    check_dependencies()

    # Run discovery
    print_header("Running Discovery Pipeline")
    run_discovery(
        target="EBNA1",
        num_molecules=8,
        target_qed=0.8,
        target_logp=2.5,
        target_sas=3.0
    )

if __name__ == "__main__":
    main()
