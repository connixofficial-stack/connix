'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/app/admin/components/ui';

interface TableRowProps {
  tableName: string;
  count: number;
  isApproximate?: boolean;
  isSeeding?: boolean;
  isClearing?: boolean;
  onSeed: () => void;
  onClear: () => void;
  seedDisabled?: boolean;
  clearDisabled?: boolean;
}

export function TableRow({
  tableName,
  count,
  isApproximate,
  isSeeding,
  isClearing,
  onSeed,
  onClear,
  seedDisabled,
  clearDisabled,
}: TableRowProps) {
  return (
    <div className="flex items-center gap-3 text-xs py-2">
      <code className="font-mono text-slate-700 dark:text-slate-300 min-w-[140px]">{tableName}</code>
      <div className="flex-1 border-b border-dotted border-slate-200 dark:border-slate-700" />
      <span className="min-w-[60px] text-right font-semibold text-slate-700 dark:text-slate-300">
        {isApproximate ? '~' : ''}{count.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px]"
          onClick={onSeed}
          disabled={seedDisabled || isSeeding || isClearing}
        >
          {isSeeding ? <Loader2 size={12} className="animate-spin" /> : 'Seed'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px] text-rose-600 hover:text-rose-700"
          onClick={onClear}
          disabled={clearDisabled || isSeeding || isClearing}
        >
          {isClearing ? <Loader2 size={12} className="animate-spin" /> : 'Clear'}
        </Button>
      </div>
    </div>
  );
}
