/**
 * Format a number to a fixed number of decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format a molecular weight with units
 */
export function formatMW(mw: number): string {
  return `${mw.toFixed(2)} Da`;
}

/**
 * Format LogP value
 */
export function formatLogP(logp: number): string {
  return logp.toFixed(2);
}

/**
 * Format TPSA with units
 */
export function formatTPSA(tpsa: number): string {
  return `${tpsa.toFixed(2)} Ų`;
}

/**
 * Format a timestamp
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString();
}

/**
 * Truncate SMILES string for display
 */
export function truncateSMILES(smiles: string, maxLength: number = 40): string {
  if (smiles.length <= maxLength) return smiles;
  return smiles.substring(0, maxLength) + '...';
}

/**
 * Format score as percentage
 */
export function formatScorePercent(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * Get color for ADMET score
 */
export function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-500';
  if (score >= 0.6) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get badge color for boolean properties
 */
export function getBadgeColor(value: boolean): string {
  return value ? 'bg-green-900 text-green-300 border-green-500' : 'bg-red-900 text-red-300 border-red-500';
}
