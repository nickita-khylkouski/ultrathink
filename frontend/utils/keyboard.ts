import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param key - The key to listen for (e.g., 'd', 'Enter', 'Escape')
 * @param callback - Function to call when key is pressed
 * @param ctrlKey - Whether Ctrl/Cmd key must be pressed (default: false)
 * @param shiftKey - Whether Shift key must be pressed (default: false)
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  ctrlKey = false,
  shiftKey = false
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const ctrlPressed = event.ctrlKey || event.metaKey;
      const shiftPressed = event.shiftKey;

      if (
        event.key === key &&
        (!ctrlKey || ctrlPressed) &&
        (!shiftKey || shiftPressed)
      ) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, callback, ctrlKey, shiftKey]);
}

/**
 * Common keyboard shortcuts map
 */
export const KEYBOARD_SHORTCUTS = {
  DISCOVER: { key: 'Enter', ctrl: false, label: 'Run Discovery' },
  DOWNLOAD_PDB: { key: 'd', ctrl: true, label: 'Download PDB' },
  CLEAR_RESULTS: { key: 'k', ctrl: true, label: 'Clear Results' },
  CLOSE_MODAL: { key: 'Escape', ctrl: false, label: 'Close Modal' },
} as const;
