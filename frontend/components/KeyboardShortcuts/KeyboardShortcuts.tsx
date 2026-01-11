'use client';

import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  onTabChange: (tab: string) => void;
}

const SHORTCUTS = [
  { key: '1', action: 'ADMET Screening', tab: 'discovery' },
  { key: '2', action: 'Protein Structure', tab: 'esmfold' },
  { key: '3', action: 'Evolution', tab: 'molgan' },
  { key: '4', action: 'Research Papers', tab: 'research' },
  { key: '5', action: 'Open-Source Models', tab: 'models' },
  { key: '6', action: 'ChEMBL Database', tab: 'chembl' },
  { key: '7', action: 'Docking', tab: 'docking' },
  { key: '?', action: 'Show shortcuts', tab: 'help' },
  { key: 'Esc', action: 'Close dialogs', tab: 'close' },
];

export function KeyboardShortcuts({ onTabChange }: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Number keys 1-7 for tab switching
      if (e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const shortcut = SHORTCUTS.find(s => s.key === e.key);
        if (shortcut) {
          onTabChange(shortcut.tab);
        }
      }

      // ? for help
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowHelp(!showHelp);
      }

      // Escape to close help
      if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange, showHelp]);

  return (
    <>
      {/* Keyboard shortcut indicator */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="fixed bottom-4 right-4 p-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors z-50"
        title="Keyboard Shortcuts (Press ?)"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5" />
      </button>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-black">
              <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-panel transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-text-secondary mb-6">
                Use these keyboard shortcuts to navigate ULTRATHINK faster
              </p>

              {/* Shortcuts list */}
              <div className="space-y-2">
                {SHORTCUTS.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between p-3 border-2 border-black bg-panel"
                  >
                    <span className="text-sm font-medium">{shortcut.action}</span>
                    <kbd className="px-3 py-1 text-xs font-mono bg-white border-2 border-black">
                      {shortcut.key === '?' ? 'Shift + ?' : shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="mt-6 p-4 border-l-4 border-black bg-panel">
                <p className="text-xs font-bold mb-2">PRO TIPS:</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• Shortcuts work anywhere except when typing in inputs</li>
                  <li>• Press numbers 1-7 to quickly switch between tabs</li>
                  <li>• Press ? (Shift + /) to toggle this help dialog</li>
                  <li>• Press Esc to close dialogs and modals</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
