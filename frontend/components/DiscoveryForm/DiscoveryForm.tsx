'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDiscoveryStore } from '@/store/useDiscoveryStore';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { validateTargetName } from '@/utils/validators';

const schema = z.object({
  target: z.string()
    .min(1, 'Target is required')
    .refine(val => validateTargetName(val).valid, {
      message: 'Invalid target name'
    }),
  numMolecules: z.number()
    .min(1, 'Minimum 1 molecule')
    .max(20, 'Maximum 20 molecules'),
});

type FormData = z.infer<typeof schema>;

export function DiscoveryForm() {
  const { runDiscovery, isLoading } = useDiscoveryStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      target: 'EBNA1',
      numMolecules: 5,
    },
  });

  const onSubmit = async (data: FormData) => {
    await runDiscovery({
      target_name: data.target,
      num_molecules: data.numMolecules,
      target_qed: 0.8,
      target_logp: 2.5,
      target_sas: 3.0,
    });
  };

  const commonDrugs = [
    'Aspirin',
    'Ibuprofen',
    'Penicillin',
    'Paracetamol',
    'Caffeine',
    'Nicotine',
    'Insulin',
    'Viagra',
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Disease Target"
          placeholder="Try: EBNA1, Cancer, Alzheimer's, Malaria..."
          error={errors.target?.message}
          {...register('target')}
        />

        <Input
          type="number"
          label="Number of Molecules"
          error={errors.numMolecules?.message}
          {...register('numMolecules', { valueAsNumber: true })}
        />

        <Button
          type="submit"
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Discovering...' : '🚀 DISCOVER'}
        </Button>
      </form>

      <div className="border-t border-primary pt-4">
        <p className="text-xs text-accent mb-2">
          🔍 COMMON DRUGS TO TRY:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {commonDrugs.map((drug) => (
            <Button
              key={drug}
              variant="secondary"
              size="sm"
              onClick={() => setValue('target', drug)}
            >
              💊 {drug}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
