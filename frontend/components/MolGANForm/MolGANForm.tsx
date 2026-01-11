'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMolGANStore } from '@/store/useMolGANStore';
import { useDiscoveryStore } from '@/store/useDiscoveryStore';
import { Button, Input, TextArea } from '@/components/shared';
import { validateSMILES } from '@/utils/validators';
import { ArrowRight } from 'lucide-react';

const schema = z.object({
  parentSmiles: z.string()
    .min(1, 'SMILES is required')
    .refine(val => validateSMILES(val).valid, {
      message: 'Invalid SMILES string. Check for balanced parentheses.'
    }),
  numVariants: z.number()
    .min(5, 'Minimum 5 variants')
    .max(50, 'Maximum 50 variants'),
});

type FormData = z.infer<typeof schema>;

const commonDrugs: Record<string, string> = {
  'Aspirin': 'CC(=O)Oc1ccccc1C(=O)O',
  'Paracetamol': 'CC(=O)Nc1ccc(O)cc1',
  'Ibuprofen': 'CC(C)Cc1ccc(cc1)C(C)C(O)=O',
  'Caffeine': 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
};

export function MolGANForm() {
  const { evolveMolecules, isLoading, generation } = useMolGANStore();
  const { selectedCandidate } = useDiscoveryStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      parentSmiles: 'CC(=O)Oc1ccccc1C(=O)O',
      numVariants: 15,
    },
  });

  const onSubmit = async (data: FormData) => {
    const validation = validateSMILES(data.parentSmiles);
    if (!validation.valid || !validation.cleaned) {
      return;
    }

    await evolveMolecules({
      parent_smiles: validation.cleaned,
      num_variants: data.numVariants,
      generation: generation + 1,
    });
  };

  const loadCommonDrug = (drugName: string) => {
    const smiles = commonDrugs[drugName];
    if (smiles) {
      setValue('parentSmiles', smiles);
    }
  };

  const useSelectedMolecule = () => {
    if (selectedCandidate) {
      setValue('parentSmiles', selectedCandidate.smiles);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-900/20 border-l-4 border-warning p-3 text-xs">
        <strong className="text-warning">🧬 SHAPETHESIAS EVOLUTIONARY ALGORITHM</strong>
        <br />
        Generate NEW drugs that don't exist yet using evolutionary mutation
        <br />
        <br />
        <strong className="text-accent">THE SHIP OF THESEUS:</strong>
        <br />
        "If you replace all parts of a ship, is it still the same ship?"
        <br />
        Start with a known drug, mutate it repeatedly. Eventually you get a completely different molecule.
      </div>

      {selectedCandidate && (
        <div className="bg-green-900/20 border-l-4 border-green-600 p-3">
          <p className="text-xs font-bold mb-2 text-green-700">
            💡 Molecule from ADMET available!
          </p>
          <p className="text-xs text-gray-700 mb-2 font-mono break-all">
            {selectedCandidate.smiles.substring(0, 40)}...
          </p>
          <Button
            size="sm"
            variant="success"
            onClick={useSelectedMolecule}
            className="w-full flex items-center justify-center gap-2"
            type="button"
          >
            <ArrowRight className="h-3 w-3" />
            Use This Molecule
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextArea
          label="Parent SMILES"
          placeholder="CC(=O)Oc1ccccc1C(=O)O"
          rows={3}
          error={errors.parentSmiles?.message}
          helperText="The starting molecule to evolve from"
          className="font-mono text-xs"
          {...register('parentSmiles')}
        />

        <Input
          type="number"
          label="Number of Variants"
          error={errors.numVariants?.message}
          helperText="5-50 molecules per generation (15 recommended)"
          {...register('numVariants', { valueAsNumber: true })}
        />

        <div className="flex items-center justify-between text-xs bg-panel p-2 border border-black">
          <span className="text-gray-600">Current Generation:</span>
          <span className="font-bold text-warning">GEN {generation}</span>
        </div>

        <Button
          type="submit"
          loading={isLoading}
          className="w-full"
          variant="success"
        >
          {isLoading ? `Evolving Gen ${generation + 1}...` : `🧬 EVOLVE (Gen ${generation + 1})`}
        </Button>
      </form>

      <div className="border-t border-primary pt-4">
        <p className="text-xs text-accent mb-2">
          💊 QUICK START DRUGS:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(commonDrugs).map((drug) => (
            <Button
              key={drug}
              variant="secondary"
              size="sm"
              onClick={() => loadCommonDrug(drug)}
              type="button"
            >
              💊 {drug}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-800 p-3 text-xs">
        <strong className="text-blue-700">💡 TIP:</strong>
        <br />
        <span className="text-gray-700">
          1. Run ADMET screening first to find good molecules
          <br />
          2. Use the green button above to import them here
          <br />
          3. Click EVOLVE to generate variants
          <br />
          4. Each generation creates better molecules!
        </span>
      </div>
    </div>
  );
}
