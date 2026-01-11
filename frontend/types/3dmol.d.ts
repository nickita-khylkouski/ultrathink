// Type definitions for 3Dmol.js
// Project: https://3dmol.csb.pitt.edu/
// Definitions by: AI Drug Discovery Platform

declare namespace $3Dmol {
  interface ViewerConfig {
    backgroundColor?: string;
    defaultcolors?: any;
  }

  interface GLViewer {
    addModel(data: any, format: string, options?: any): void;
    setStyle(selection: any, style: any): void;
    addLabel(text: string, options: any): void;
    removeAllLabels(): void;
    addShape(spec: any): void;
    removeAllShapes(): void;
    addIsosurface(volumeData: any, options: any): void;
    setBackgroundColor(color: string | number, opacity?: number): void;
    setClickable(selection: any, clickable: boolean, callback?: (atom: any) => void): void;
    zoomTo(selection?: any, factor?: number): void;
    zoom(factor?: number): void;
    render(): void;
    clear(): void;
    resize(): void;
    setSlab(near: number, far: number): void;
    fitSlab(): void;
    setViewStyle(style: any): void;
    getModel(): any;
  }

  interface VolumeData {
    new (data: string, format: string): VolumeData;
  }

  function createViewer(element: HTMLElement | JQuery, config?: ViewerConfig): GLViewer;
  function parseSMILES(smiles: string, callback: (mol: any) => void): void;

  const elementColors: {
    rasmol: any;
  };
}

declare global {
  interface Window {
    $3Dmol: typeof $3Dmol;
  }
}

export = $3Dmol;
export as namespace $3Dmol;
