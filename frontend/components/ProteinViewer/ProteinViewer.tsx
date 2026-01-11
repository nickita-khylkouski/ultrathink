'use client';

import { useEffect, useRef } from 'react';
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
  const isLoading = useRef(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let cancelled = false;

    // Wait for 3Dmol to load
    const loadViewer = () => {
      if (cancelled) return;

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
        viewerInstance.current.addModel(pdbData, 'pdb');

        // Set cartoon style for protein
        viewerInstance.current.setStyle({}, {
          cartoon: {
            color: 'spectrum',
          },
        });

        // Zoom to fit
        viewerInstance.current.zoomTo();
        viewerInstance.current.render();
        isLoading.current = false;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error rendering protein:', errorMessage);
        isLoading.current = false;
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
      {isLoading.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <LoadingSpinner message="Loading protein structure..." />
        </div>
      )}
      <div className="mt-2 text-xs text-primary">
        <p>🖱️ Drag = Rotate | 🔼 Scroll = Zoom | ⬅️ Shift+Drag = Pan</p>
      </div>
    </div>
  );
}
