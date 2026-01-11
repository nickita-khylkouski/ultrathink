'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMolGANStore } from '@/store/useMolGANStore';
import { Button, Input, TextArea } from '@/components/shared';
import { validateSMILES } from '@/utils/validators';

const schema = z.object({
  parentSmiles: z.string()
    .min(1, 'SMILES is required')
    .refine(val => validateSMILES(val).valid, {
      message: 'Invalid SMILES string. Check for balanced parentheses.'
    }),
  numVariants: z.number()
    .min(1, 'Minimum 1 variant')
    .max(100, 'Maximum 100 variants'),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      parentSmiles: 'CC(=O)Oc1ccccc1C(=O)O',
      numVariants: 50,
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextArea
          label="Parent SMILES"
          placeholder="CC(=O)Oc1ccccc1C(=O)O"
          rows={3}
          error={errors.parentSmiles?.message}
          className="font-mono text-xs"
          {...register('parentSmiles')}
        />

        <Input
          type="number"
          label="Number of Variants"
          error={errors.numVariants?.message}
          helperText="Molecules to generate per generation"
          {...register('numVariants', { valueAsNumber: true })}
        />

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Current Generation:</span>
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
          💊 COMMON STARTING DRUGS:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(commonDrugs).map((drug) => (
            <Button
              key={drug}
              variant="secondary"
              size="sm"
              onClick={() => loadCommonDrug(drug)}
            >
              💊 {drug}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
