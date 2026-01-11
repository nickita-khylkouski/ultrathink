import { Candidate } from '@/types/api';

/**
 * Download a file to the user's computer
 */
function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export PDB structure file
 */
export function exportPDB(pdbData: string, proteinName: string) {
  const filename = `${proteinName.replace(/\s+/g, '_')}_structure.pdb`;
  downloadFile(filename, pdbData, 'chemical/x-pdb');
}

/**
 * Export SMILES string
 */
export function exportSMILES(smiles: string, moleculeName: string) {
  const filename = `${moleculeName.replace(/\s+/g, '_')}.smi`;
  downloadFile(filename, smiles, 'text/plain');
}

/**
 * Escape CSV field to prevent injection and handle special characters
 */
function escapeCSVField(value: string | number | boolean): string {
  const strValue = String(value);

  // Prevent CSV injection by prepending single quote to formula-like values
  if (strValue.match(/^[=+\-@]/)) {
    return `"'${strValue.replace(/"/g, '""')}"`;
  }

  // Quote fields that contain comma, quote, or newline
  if (strValue.match(/[",\n\r]/)) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }

  return strValue;
}

/**
 * Export candidates as CSV
 */
export function exportCandidatesCSV(candidates: Candidate[], targetName: string) {
  // CSV Header
  const headers = [
    'Rank',
    'SMILES',
    'ADMET Score',
    'Drug Likeness',
    'Bioavailability',
    'Lipinski Violations',
    'Toxicity Flag',
    'BBB Penetration',
    'MW',
    'LogP',
    'TPSA',
    'HBD',
    'HBA',
    'Rotatable Bonds',
    'QED',
    'Synthetic Accessibility'
  ];

  // CSV Rows with proper escaping
  const rows = candidates.map(c => [
    escapeCSVField(c.rank),
    escapeCSVField(c.smiles),
    escapeCSVField(c.admet_score.toFixed(3)),
    escapeCSVField(c.drug_likeness.toFixed(3)),
    escapeCSVField(c.bioavailability_score.toFixed(3)),
    escapeCSVField(c.lipinski_violations),
    escapeCSVField(c.toxicity_flag ? 'Yes' : 'No'),
    escapeCSVField(c.bbb_penetration ? 'Yes' : 'No'),
    escapeCSVField(c.descriptors.mw.toFixed(2)),
    escapeCSVField(c.descriptors.logp.toFixed(2)),
    escapeCSVField(c.descriptors.tpsa.toFixed(2)),
    escapeCSVField(c.descriptors.hbd),
    escapeCSVField(c.descriptors.hba),
    escapeCSVField(c.descriptors.rotatable_bonds),
    escapeCSVField(c.qed.toFixed(3)),
    escapeCSVField(c.synthetic_accessibility.toFixed(2))
  ]);

  // Build CSV content
  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const filename = `${targetName.replace(/\s+/g, '_')}_candidates.csv`;
  downloadFile(filename, csvContent, 'text/csv');
}

/**
 * Export candidates as JSON
 */
export function exportCandidatesJSON(candidates: Candidate[], targetName: string) {
  const data = {
    target: targetName,
    timestamp: new Date().toISOString(),
    num_candidates: candidates.length,
    candidates: candidates
  };

  const jsonContent = JSON.stringify(data, null, 2);
  const filename = `${targetName.replace(/\s+/g, '_')}_candidates.json`;
  downloadFile(filename, jsonContent, 'application/json');
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
