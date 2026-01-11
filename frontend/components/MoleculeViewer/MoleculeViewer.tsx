'use client';

import { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// 3Dmol types are defined in types/3dmol.d.ts

interface MoleculeViewerProps {
  smiles: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  style?: 'stick' | 'sphere' | 'cartoon' | 'line';
}

export function MoleculeViewer({
  smiles,
  width = 400,
  height = 400,
  backgroundColor = '#000000',
  style = 'stick',
}: MoleculeViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<$3Dmol.GLViewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const oldSmiles = useRef<string>('');

  useEffect(() => {
    // Don't re-render if SMILES hasn't changed
    if (oldSmiles.current === smiles && viewerInstance.current) {
      return;
    }

    let cancelled = false;
    let timeoutId: NodeJS.Timeout | null = null;

    // Wait for 3Dmol to load
    const loadViewer = () => {
      if (cancelled) return;

      if (!viewerRef.current || !window.$3Dmol) {
        timeoutId = setTimeout(loadViewer, 100);
        return;
      }

      try {
        // Initialize or reuse viewer
        if (!viewerInstance.current) {
          viewerInstance.current = window.$3Dmol.createViewer(viewerRef.current, {
            backgroundColor,
          });
        } else {
          // Clear existing model
          viewerInstance.current.clear();
          viewerInstance.current.setBackgroundColor(backgroundColor);
        }

        // Parse and render SMILES
        window.$3Dmol.parseSMILES(smiles, (mol) => {
          if (cancelled || !viewerInstance.current) return;

          try {
            viewerInstance.current.addModel(mol, 'smi');

            // Apply style
            const styleConfig: Record<string, Record<string, number>> = {};
            if (style === 'stick') {
              styleConfig.stick = { radius: 0.15 };
            } else if (style === 'sphere') {
              styleConfig.sphere = { scale: 0.3 };
            } else if (style === 'line') {
              styleConfig.line = {};
            }

            viewerInstance.current.setStyle({}, styleConfig);
            viewerInstance.current.zoomTo();
            viewerInstance.current.render();

            setIsLoading(false);
            setError(null);
            oldSmiles.current = smiles;
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error rendering molecule:', errorMessage);
            setError('Failed to render molecule');
            setIsLoading(false);
          }
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error initializing viewer:', errorMessage);
        setError('Failed to initialize 3D viewer');
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    loadViewer();

    // Cleanup
    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [smiles, backgroundColor, style]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewerInstance.current) {
        viewerInstance.current.clear();
        viewerInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={viewerRef}
        style={{ width, height }}
        className="border-2 border-primary rounded bg-black"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <LoadingSpinner message="Loading molecule..." />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 text-danger text-sm p-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
