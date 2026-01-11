// Molecule Types

export interface MoleculeDescriptors {
  mw: number; // Molecular weight
  logp: number; // Lipophilicity
  tpsa: number; // Topological polar surface area
  hbd: number; // Hydrogen bond donors
  hba: number; // Hydrogen bond acceptors
  rotatable_bonds: number;
  qed?: number; // Quantitative estimate of drug-likeness
}

export interface DrugInfo {
  name: string;
  scientific: string;
  aka: string;
  description: string;
}

export const drugDatabase: Record<string, DrugInfo> = {
  "CC(=O)Nc1ccc(O)cc1": {
    name: "Paracetamol",
    scientific: "N-(4-hydroxyphenyl)acetamide",
    aka: "Acetaminophen, Tylenol",
    description: "Analgesic & antipyretic. Reduces pain and fever. Safe OTC pain reliever."
  },
  "CC(C)Cc1ccc(cc1)C(C)C(O)=O": {
    name: "Ibuprofen",
    scientific: "2-(4-isobutylphenyl)propionic acid",
    aka: "Advil, Motrin",
    description: "NSAID. Anti-inflammatory, analgesic, antipyretic. Used for pain and inflammation."
  },
  "CCO": {
    name: "Ethanol",
    scientific: "Ethyl alcohol",
    aka: "Alcohol, EtOH",
    description: "Simple alcohol. Used as solvent and disinfectant. CNS depressant."
  },
  "CN1CCCC1c1cccnc1": {
    name: "Nicotine",
    scientific: "3-(1-methylpyrrolidin-2-yl)pyridine",
    aka: "Smoking compound",
    description: "Alkaloid. Addictive stimulant. Also used in smoking cessation products."
  }
};
