'use client';

import React from 'react';
import { Loader2, Settings, ShoppingCart, FileText, Users, Megaphone, Database } from 'lucide-react';
import { Button, cn } from '@/app/admin/components/ui';
import { getSeedModuleInfo } from '@/lib/modules/seed-registry';

interface DependencyNodeProps {
  moduleKey: string;
  moduleName: string;
  count: number;
  isApproximate?: boolean;
  level: number;
  isSeeding?: boolean;
  isClearing?: boolean;
  onSeed: (moduleKey: string) => void;
  onClear: (moduleKey: string) => void;
}

const categoryIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  commerce: ShoppingCart,
  content: FileText,
  marketing: Megaphone,
  system: Settings,
  user: Users,
};

const categoryColors: Record<string, string> = {
  commerce: 'text-emerald-500 bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-800/60',
  content: 'text-blue-500 bg-blue-500/10 border-blue-200/60 dark:border-blue-800/60',
  marketing: 'text-pink-500 bg-pink-500/10 border-pink-200/60 dark:border-pink-800/60',
  system: 'text-amber-500 bg-amber-500/10 border-amber-200/60 dark:border-amber-800/60',
  user: 'text-purple-500 bg-purple-500/10 border-purple-200/60 dark:border-purple-800/60',
};

export function DependencyNode({
  moduleKey,
  moduleName,
  count,
  isApproximate,
  level,
  isSeeding,
  isClearing,
  onSeed,
  onClear,
}: DependencyNodeProps) {
  const metadata = getSeedModuleInfo(moduleKey);
  const category = metadata?.category ?? 'system';
  const Icon = categoryIconMap[category] ?? Database;
  const colorClass = categoryColors[category] ?? 'text-slate-500 bg-slate-500/10 border-slate-200/60 dark:border-slate-700';
  const hasData = count > 0;
  const isLoading = isSeeding || isClearing;

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-white dark:bg-slate-900 px-3 py-2.5 shadow-sm transition-all hover:shadow-md',
        colorClass,
        isLoading && 'opacity-70'
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center border', colorClass)}>
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{moduleName}</p>
          <p className="text-[10px] text-slate-500 truncate">{moduleKey} · Level {level}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-slate-700 dark:text-slate-300 font-semibold">
          {isApproximate ? '~' : ''}{count.toLocaleString()}
        </span>
        <span className={cn('font-semibold', hasData ? 'text-emerald-600' : 'text-slate-400')}>
          {hasData ? '●' : '○'}
        </span>
      </div>

      <div className="absolute inset-x-2 -bottom-3 hidden group-hover:flex justify-end gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px]"
          onClick={() => onSeed(moduleKey)}
          disabled={isLoading}
        >
          Seed
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px] text-rose-600 hover:text-rose-700"
          onClick={() => onClear(moduleKey)}
          disabled={isLoading}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
