'use client';

import { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// 3Dmol types are defined in types/3dmol.d.ts

interface ProteinViewerProps {
  pdbData: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export function ProteinViewer({
  pdbData,
  width = 600,
  height = 450,
  backgroundColor = '#000000',
}: ProteinViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<$3Dmol.GLViewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let cancelled = false;
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

      // Initialize viewer
      viewerInstance.current = window.$3Dmol.createViewer(viewerRef.current, {
        backgroundColor,
      });

      try {
        // Add PDB model
        const model = viewerInstance.current.addModel(pdbData, 'pdb');

        // Check if we have atoms to render
        const atoms = model.selectedAtoms({});
        if (atoms.length === 0) {
          setError('No atoms found in the protein structure data');
          setIsLoading(false);
          return;
        }

        // Try cartoon style first (for proper protein structures)
        // Fall back to stick style for simpler/placeholder structures
        const hasBackbone = atoms.some((a: { atom?: string }) =>
          a.atom === 'CA' || a.atom === 'N' || a.atom === 'C'
        );

        if (hasBackbone && atoms.length > 20) {
          // Use cartoon for larger structures with backbone
          viewerInstance.current.setStyle({}, {
            cartoon: {
              color: 'spectrum',
            },
          });
        } else {
          // Use stick + sphere for smaller/placeholder structures
          viewerInstance.current.setStyle({}, {
            stick: { radius: 0.2, colorscheme: 'Jmol' },
            sphere: { scale: 0.25, colorscheme: 'Jmol' },
          });
        }

        // Zoom to fit
        viewerInstance.current.zoomTo();
        viewerInstance.current.render();
        setIsLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error rendering protein:', errorMessage);
        setError(`Failed to render protein structure: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    loadViewer();

    // Cleanup
    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (viewerInstance.current) {
        viewerInstance.current.clear();
        viewerInstance.current = null;
      }
    };
  }, [pdbData, backgroundColor]);

  return (
    <div className="relative">
      <div
        ref={viewerRef}
        style={{ width, height }}
        className="border-2 border-primary rounded bg-black"
      />
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <LoadingSpinner message="Loading protein structure..." />
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
      <div className="mt-2 text-xs text-primary">
        <p>🖱️ Drag = Rotate | 🔼 Scroll = Zoom | ⬅️ Shift+Drag = Pan</p>
      </div>
    </div>
  );
}
