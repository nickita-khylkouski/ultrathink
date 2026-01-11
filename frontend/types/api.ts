// API Response Types

export interface HealthResponse {
  status: string;
  timestamp: string;
  services?: Record<string, boolean>;
}

export interface DiscoveryParams {
  target_name: string;
  num_molecules: number;
  target_qed?: number;
  target_logp?: number;
  target_sas?: number;
}

export interface Candidate {
  rank: number;
  smiles: string;
  admet_score: number;
  drug_likeness: number;
  bioavailability_score: number;
  lipinski_violations: number;
  toxicity_flag: boolean;
  bbb_penetration: boolean;
  descriptors: {
    mw: number;
    logp: number;
    tpsa: number;
    hbd: number;
    hba: number;
    rotatable_bonds: number;
  };
  qed: number;
  synthetic_accessibility: number;
}

export interface DiscoveryResponse {
  target_name: string;
  num_requested: number;
  top_candidates: Candidate[];
  metadata?: {
    generation_time?: number;
    model_info?: string;
  };
}

export interface ESMFoldParams {
  sequence: string;
  protein_name: string;
}

export interface ESMFoldResponse {
  protein_name: string;
  sequence: string;
  pdb_structure: string;
  prediction_confidence: number;
  processing_time: number;
}

export interface MolGANParams {
  parent_smiles: string;
  num_variants: number;
  generation?: number;
}

export interface MolGANVariant {
  rank: number;
  smiles: string;
  admet_score: number;
  mutations: string[];
  similarity_to_parent: number;
  descriptors: {
    mw: number;
    logp: number;
    tpsa: number;
    qed: number;
  };
}

export interface MolGANResponse {
  parent_smiles: string;
  generation: number;
  num_variants: number;
  variants: MolGANVariant[];
  metadata?: {
    generation_time?: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  cleaned?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}
