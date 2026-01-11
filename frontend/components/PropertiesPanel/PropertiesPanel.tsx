'use client';

import { useDiscoveryStore } from '@/store/useDiscoveryStore';
import { Button } from '@/components/shared/Button';
import { drugDatabase } from '@/types/molecule';
import { formatMW, formatLogP, formatTPSA } from '@/utils/formatters';
import { exportSMILES, exportCandidatesCSV, copyToClipboard } from '@/utils/exporters';
import { Download, Copy } from 'lucide-react';
import { useState } from 'react';

export function PropertiesPanel() {
  const { selectedCandidate, candidates, targetName } = useDiscoveryStore();
  const [copied, setCopied] = useState(false);

  if (!selectedCandidate) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>👈 Click a candidate to view details</p>
      </div>
    );
  }

  const drugInfo = drugDatabase[selectedCandidate.smiles];

  const handleCopySmiles = async () => {
    const success = await copyToClipboard(selectedCandidate.smiles);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportSmiles = () => {
    exportSMILES(selectedCandidate.smiles, `candidate_${selectedCandidate.rank}`);
  };

  const handleExportAllCSV = () => {
    exportCandidatesCSV(candidates, targetName);
  };

  return (
    <div className="space-y-4 text-sm">
      {drugInfo && (
        <div className="bg-green-900/20 border border-primary p-3 rounded">
          <h4 className="text-warning font-bold">💊 {drugInfo.name}</h4>
          <p className="text-accent text-xs mt-1">{drugInfo.scientific}</p>
          <p className="text-gray-400 text-xs mt-1">Also known as: {drugInfo.aka}</p>
          <p className="text-secondary text-xs mt-2">{drugInfo.description}</p>
        </div>
      )}

      <div>
        <h4 className="text-secondary font-bold mb-2">🧬 MOLECULAR STRUCTURE</h4>
        <div className="bg-panel p-2 rounded font-mono text-xs break-all text-accent">
          {selectedCandidate.smiles}
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            onClick={handleCopySmiles}
            className="flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportSmiles}
            className="flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-secondary font-bold mb-2">📊 SCORES (0-1, higher=better)</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>ADMET:</span>
            <span className="font-bold">
              {selectedCandidate.admet_score.toFixed(3)}{' '}
              {selectedCandidate.admet_score > 0.8 ? '✅' : '⚠️'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Drug-likeness:</span>
            <span>{selectedCandidate.drug_likeness.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span>Bioavailability:</span>
            <span>{selectedCandidate.bioavailability_score.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span>QED:</span>
            <span>{selectedCandidate.qed.toFixed(3)}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-secondary font-bold mb-2">🔬 MOLECULAR PROPERTIES</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Molecular Weight:</span>
            <span>{formatMW(selectedCandidate.descriptors.mw)}</span>
          </div>
          <div className="flex justify-between">
            <span>LogP:</span>
            <span>{formatLogP(selectedCandidate.descriptors.logp)}</span>
          </div>
          <div className="flex justify-between">
            <span>TPSA:</span>
            <span>{formatTPSA(selectedCandidate.descriptors.tpsa)}</span>
          </div>
          <div className="flex justify-between">
            <span>H-Bond Donors:</span>
            <span>{selectedCandidate.descriptors.hbd}</span>
          </div>
          <div className="flex justify-between">
            <span>H-Bond Acceptors:</span>
            <span>{selectedCandidate.descriptors.hba}</span>
          </div>
          <div className="flex justify-between">
            <span>Rotatable Bonds:</span>
            <span>{selectedCandidate.descriptors.rotatable_bonds}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-secondary font-bold mb-2">⚗️ ADMET ANALYSIS</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Lipinski Violations:</span>
            <span className={selectedCandidate.lipinski_violations === 0 ? 'text-green-500' : 'text-red-500'}>
              {selectedCandidate.lipinski_violations}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Toxicity Flag:</span>
            <span className={selectedCandidate.toxicity_flag ? 'text-red-500' : 'text-green-500'}>
              {selectedCandidate.toxicity_flag ? '⚠️ Yes' : '✅ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>BBB Penetration:</span>
            <span className={selectedCandidate.bbb_penetration ? 'text-green-500' : 'text-yellow-500'}>
              {selectedCandidate.bbb_penetration ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Synthetic Accessibility:</span>
            <span>{selectedCandidate.synthetic_accessibility.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button
        variant="success"
        className="w-full"
        onClick={handleExportAllCSV}
      >
        📊 Export All Candidates (CSV)
      </Button>
    </div>
  );
}
