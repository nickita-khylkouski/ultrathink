import { create } from 'zustand';
import { api } from '@/services/api';
import type { MolGANParams, MolGANVariant, ApiError } from '@/types/api';

interface MolGANState {
  // Data
  variants: MolGANVariant[];
  selectedVariant: MolGANVariant | null;
  parentSmiles: string;
  generation: number;

  // UI State
  isLoading: boolean;
  error: ApiError | null;

  // Actions
  evolveMolecules: (params: MolGANParams) => Promise<void>;
  setSelectedVariant: (variant: MolGANVariant | null) => void;
  clearVariants: () => void;
  clearError: () => void;
}

export const useMolGANStore = create<MolGANState>((set) => ({
  // Initial state
  variants: [],
  selectedVariant: null,
  parentSmiles: '',
  generation: 1,
  isLoading: false,
  error: null,

  // Evolve molecules
  evolveMolecules: async (params: MolGANParams) => {
    set({
      isLoading: true,
      error: null,
      parentSmiles: params.parent_smiles,
      generation: params.generation || 1,
    });

    try {
      const data = await api.evolveMolecules(params);
      set({
        variants: data.variants || [],
        isLoading: false,
        generation: data.generation,
      });
    } catch (error) {
      // Error is already an ApiError from handleApiError in api.ts
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
        variants: [],
      });
      console.error('Molecule evolution failed:', apiError.message);
    }
  },

  // Set selected variant
  setSelectedVariant: (variant: MolGANVariant | null) => {
    set({ selectedVariant: variant });
  },

  // Clear variants
  clearVariants: () => {
    set({
      variants: [],
      selectedVariant: null,
      parentSmiles: '',
      generation: 1,
      error: null,
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
