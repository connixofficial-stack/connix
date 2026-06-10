'use client';

import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { DependencyNode } from './DependencyNode';
import { getSeedModuleInfo } from '@/lib/modules/seed-registry';

interface DependencyTreeProps {
  data: Record<string, Array<{ key: string; count: number; isApproximate?: boolean }>>;
  seedingModule: string | null;
  clearingModule: string | null;
  onSeedModule: (moduleKey: string) => void;
  onClearModule: (moduleKey: string) => void;
}

export function DependencyTree({
  data,
  seedingModule,
  clearingModule,
  onSeedModule,
  onClearModule,
}: DependencyTreeProps) {
  const levels = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b)
    .map(String);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">🌳 Dependency Tree</h3>
          <p className="text-xs text-slate-500">Seed theo Level 0 → 4, Clear theo chiều ngược lại</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><ArrowDown size={12} /> Seed</span>
          <span className="flex items-center gap-1"><ArrowUp size={12} /> Clear</span>
        </div>
      </div>

      <div className="space-y-4">
        {levels.map((levelKey, index) => {
          const level = Number(levelKey);
          const modules = data[levelKey] ?? [];
          return (
            <div key={levelKey} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">Level {level}</span>
                <span>{index === 0 ? 'Seed đầu tiên' : index === levels.length - 1 ? 'Clear đầu tiên' : 'Dependency'}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {modules.map((module) => (
                  <DependencyNode
                    key={module.key}
                    moduleKey={module.key}
                    moduleName={getSeedModuleInfo(module.key)?.name ?? module.key}
                    count={module.count}
                    isApproximate={module.isApproximate}
                    level={level}
                    isSeeding={seedingModule === module.key}
                    isClearing={clearingModule === module.key}
                    onSeed={onSeedModule}
                    onClear={onClearModule}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-3">
        <span className="flex items-center gap-1"><span className="text-emerald-600">●</span> Có dữ liệu</span>
        <span className="flex items-center gap-1"><span className="text-slate-400">○</span> Trống</span>
        <span>Hover node để seed/clear nhanh</span>
      </div>
    </div>
  );
}
