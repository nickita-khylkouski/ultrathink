// Protein Types

export interface ProteinSequence {
  sequence: string;
  name: string;
  length: number;
}

export interface ProteinStructure {
  protein_name: string;
  sequence: string;
  pdb_data: string;
  confidence: number;
  timestamp?: string;
}

export const commonProteins: Record<string, string> = {
  "EBNA1": "MGQPSGRRGRGRGRGRPGRGRGRGRGRGRGRGGSGSGPRHRDGVRRPQKRPSCIIGMLW",
  "p53": "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPV",
  "Insulin": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN",
};
