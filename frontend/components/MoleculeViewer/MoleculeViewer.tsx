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

  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 50; // 5 seconds max (50 * 100ms)

    // Wait for 3Dmol to load
    const loadViewer = () => {
      if (cancelled) return;

      attempts++;

      if (attempts >= MAX_ATTEMPTS) {
        setError('Failed to load 3D viewer library. Please refresh the page.');
        setIsLoading(false);
        return;
      }

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
      // Clear viewer on unmount or when dependencies change
      if (viewerInstance.current) {
        viewerInstance.current.clear();
        viewerInstance.current = null;
      }
    };
  }, [smiles, backgroundColor, style]);

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
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center p-4">
            <p className="text-white text-sm mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
