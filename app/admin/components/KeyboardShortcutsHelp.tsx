'use client';

import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from './ui';

interface ShortcutInfo {
  keys: string;
  description: string;
}

const commonShortcuts: ShortcutInfo[] = [
  { description: 'Lưu thay đổi', keys: 'Ctrl + S' },
  { description: 'Hủy / Đóng', keys: 'Esc' },
  { description: 'Tìm kiếm', keys: 'Ctrl + F' },
  { description: 'Tạo mới', keys: 'Ctrl + N' },
];

/**
 * FIX LOW-002: Component to show keyboard shortcuts help
 */
export function KeyboardShortcutsHelp({ shortcuts = commonShortcuts }: { shortcuts?: ShortcutInfo[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>{  setIsOpen(true); }}
        title="Phím tắt (Ctrl+/)"
        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Keyboard size={18} />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() =>{  setIsOpen(false); }}>
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) =>{  e.stopPropagation(); }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Keyboard size={20} />
                Phím tắt
              </h3>
              <Button variant="ghost" size="icon" onClick={() =>{  setIsOpen(false); }}>
                <X size={18} />
              </Button>
            </div>

            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <span className="text-slate-600 dark:text-slate-300">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-sm font-mono">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Nhấn Esc để đóng hộp thoại này
            </p>
          </div>
        </div>
      )}
    </>
  );
}
