'use client';

import React from 'react';
import { Info } from 'lucide-react';

interface ConventionNoteProps {
  children: React.ReactNode;
}

export const ConventionNote: React.FC<ConventionNoteProps> = ({ children }) => (
  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
    <p className="text-xs text-blue-600 dark:text-blue-400">
      {children}
    </p>
  </div>
);

export const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="bg-blue-500/20 px-1 rounded">{children}</code>
);
