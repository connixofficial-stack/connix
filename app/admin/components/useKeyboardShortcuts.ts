'use client';

import { useCallback, useEffect, useRef } from 'react';

type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description?: string;
}

/**
 * FIX LOW-002: Hook to handle keyboard shortcuts
 * Usage:
 * useKeyboardShortcuts([
 *   { key: 's', ctrl: true, handler: handleSave, description: 'Save' },
 *   { key: 'Escape', handler: handleCancel, description: 'Cancel' },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts);
  
  // Update ref in useEffect to avoid render-time mutation
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable;
    
    for (const shortcut of shortcutsRef.current) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      
      // For Escape, always allow even in input fields
      const isEscapeKey = shortcut.key.toLowerCase() === 'escape';
      
      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        // Skip if in input field (except for Escape or Ctrl+key combinations)
        if (isInputField && !isEscapeKey && !shortcut.ctrl) {
          continue;
        }
        
        event.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () =>{  document.removeEventListener('keydown', handleKeyDown); };
  }, [handleKeyDown]);
}

/**
 * Common shortcuts for forms
 */
export function useFormShortcuts(options: {
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [];
  
  if (options.onSave) {
    shortcuts.push({
      ctrl: true,
      description: 'Save (Ctrl+S)',
      handler: options.onSave,
      key: 's',
    });
  }
  
  if (options.onCancel) {
    shortcuts.push({
      description: 'Cancel (Esc)',
      handler: options.onCancel,
      key: 'Escape',
    });
  }
  
  if (options.onDelete) {
    shortcuts.push({
      ctrl: true,
      description: 'Delete (Ctrl+Shift+D)',
      handler: options.onDelete,
      key: 'd',
      shift: true,
    });
  }
  
  useKeyboardShortcuts(shortcuts);
}

/**
 * Common shortcuts for tables/lists
 */
export function useTableShortcuts(options: {
  onSearch?: () => void;
  onRefresh?: () => void;
  onNew?: () => void;
  onSelectAll?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [];
  
  if (options.onSearch) {
    shortcuts.push({
      ctrl: true,
      description: 'Search (Ctrl+F)',
      handler: options.onSearch,
      key: 'f',
    });
  }
  
  if (options.onRefresh) {
    shortcuts.push({
      ctrl: true,
      description: 'Refresh (Ctrl+R)',
      handler: options.onRefresh,
      key: 'r',
    });
  }
  
  if (options.onNew) {
    shortcuts.push({
      ctrl: true,
      description: 'New (Ctrl+N)',
      handler: options.onNew,
      key: 'n',
    });
  }
  
  if (options.onSelectAll) {
    shortcuts.push({
      ctrl: true,
      description: 'Select All (Ctrl+A)',
      handler: options.onSelectAll,
      key: 'a',
    });
  }
  
  useKeyboardShortcuts(shortcuts);
}
