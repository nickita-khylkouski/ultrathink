import { ValidationResult } from '@/types/api';

/**
 * Validates a protein amino acid sequence
 * Valid amino acid one-letter codes: ACDEFGHIKLMNPQRSTVWY
 */
export function validateProteinSequence(sequence: string): ValidationResult {
  const cleaned = sequence.toUpperCase().replace(/\s/g, '');

  // Check length first (fast fail)
  if (cleaned.length < 3) {
    return {
      valid: false,
      error: 'Sequence too short (minimum 3 amino acids)'
    };
  }

  if (cleaned.length > 2000) {
    return {
      valid: false,
      error: 'Sequence too long (maximum 2000 amino acids for performance)'
    };
  }

  // Validate characters using regex (O(n) vs O(n*m) with includes)
  const validPattern = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
  if (!validPattern.test(cleaned)) {
    // Find first invalid character for better error message
    const invalidChar = cleaned.match(/[^ACDEFGHIKLMNPQRSTVWY]/)?.[0];
    return {
      valid: false,
      error: `Invalid amino acid '${invalidChar}'. Use only: ACDEFGHIKLMNPQRSTVWY`
    };
  }

  return { valid: true, cleaned: cleaned };
}

/**
 * Validates a SMILES (Simplified Molecular Input Line Entry System) string
 * Checks for basic syntax errors like balanced parentheses
 */
export function validateSMILES(smiles: string): ValidationResult {
  // Basic SMILES validation
  const cleaned = smiles.trim();

  if (cleaned.length === 0) {
    return {
      valid: false,
      error: 'SMILES string cannot be empty'
    };
  }

  // Check for balanced parentheses
  let depth = 0;
  for (let char of cleaned) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (depth < 0) {
      return {
        valid: false,
        error: 'Unbalanced parentheses in SMILES string'
      };
    }
  }

  if (depth !== 0) {
    return {
      valid: false,
      error: 'Unbalanced parentheses in SMILES string'
    };
  }

  return { valid: true, cleaned: cleaned };
}

/**
 * Validates a target/disease name
 */
export function validateTargetName(target: string): ValidationResult {
  const cleaned = target.trim();

  if (cleaned.length === 0) {
    return {
      valid: false,
      error: 'Target name cannot be empty'
    };
  }

  if (cleaned.length < 2) {
    return {
      valid: false,
      error: 'Target name too short (minimum 2 characters)'
    };
  }

  if (cleaned.length > 100) {
    return {
      valid: false,
      error: 'Target name too long (maximum 100 characters)'
    };
  }

  return { valid: true, cleaned: cleaned };
}
