import { useEffect, useCallback } from 'react';

/**
 * Keyboard shortcuts hook for better accessibility
 */
export const useKeyboardShortcuts = (shortcuts) => {
  const handleKeyDown = useCallback((event) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const modifierKey = ctrlKey || metaKey; // Support both Ctrl and Cmd

    for (const shortcut of shortcuts) {
      const {
        key: shortcutKey,
        ctrl = false,
        shift = false,
        alt = false,
        callback,
        preventDefault = true
      } = shortcut;

      if (
        key.toLowerCase() === shortcutKey.toLowerCase() &&
        modifierKey === ctrl &&
        shiftKey === shift &&
        altKey === alt
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Common keyboard shortcuts for the app
 */
export const useAppShortcuts = (dispatch, actions) => {
  const shortcuts = [
    {
      key: 'n',
      ctrl: true,
      callback: () => actions.createNewRecipe?.(),
      description: 'Create new recipe'
    },
    {
      key: 's',
      ctrl: true,
      callback: () => actions.saveCurrentWork?.(),
      description: 'Save current work'
    },
    {
      key: 'f',
      ctrl: true,
      callback: () => actions.focusSearch?.(),
      description: 'Focus search'
    },
    {
      key: 'Escape',
      callback: () => actions.closeModal?.(),
      description: 'Close modal/dialog'
    },
    {
      key: '/',
      callback: () => actions.showShortcuts?.(),
      description: 'Show keyboard shortcuts'
    }
  ];

  useKeyboardShortcuts(shortcuts);
  
  return shortcuts;
};
