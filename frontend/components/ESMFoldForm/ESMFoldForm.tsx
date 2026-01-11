'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProteinStore } from '@/store/useProteinStore';
import { Button, Input, TextArea } from '@/components/shared';
import { validateProteinSequence } from '@/utils/validators';
import { commonProteins } from '@/types/protein';

const schema = z.object({
  sequence: z.string()
    .min(1, 'Sequence is required')
    .refine(val => validateProteinSequence(val).valid, {
      message: 'Invalid protein sequence. Use only: ACDEFGHIKLMNPQRSTVWY'
    }),
  proteinName: z.string()
    .min(1, 'Protein name is required')
    .max(100, 'Name too long'),
});

type FormData = z.infer<typeof schema>;

export function ESMFoldForm() {
  const { predictStructure, isLoading } = useProteinStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sequence: '',
      proteinName: 'My Protein',
    },
  });

  const onSubmit = async (data: FormData) => {
    const validation = validateProteinSequence(data.sequence);
    if (!validation.valid || !validation.cleaned) {
      return;
    }

    await predictStructure({
      sequence: validation.cleaned,
      protein_name: data.proteinName,
    });
  };

  const loadCommonProtein = (name: string) => {
    const sequence = commonProteins[name];
    if (sequence) {
      setValue('sequence', sequence);
      setValue('proteinName', name);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Protein Name"
          placeholder="e.g., EBNA1, p53, Insulin"
          error={errors.proteinName?.message}
          {...register('proteinName')}
        />

        <TextArea
          label="Amino Acid Sequence"
          placeholder="ACDEFGHIKLMNPQRSTVWY..."
          rows={6}
          error={errors.sequence?.message}
          helperText="Valid amino acids: ACDEFGHIKLMNPQRSTVWY (3-2000 residues)"
          className="font-mono text-xs"
          {...register('sequence')}
        />

        <Button
          type="submit"
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Predicting Structure...' : '⚡ PREDICT STRUCTURE'}
        </Button>
      </form>

      <div className="border-t border-primary pt-4">
        <p className="text-xs text-accent mb-2">
          🧬 COMMON PROTEINS:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(commonProteins).map((protein) => (
            <Button
              key={protein}
              variant="secondary"
              size="sm"
              onClick={() => loadCommonProtein(protein)}
            >
              {protein}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
