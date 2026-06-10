'use client';

import React from 'react';
import { AlertTriangle, Database, RefreshCw, Settings, Sparkles, Package, Rocket, Zap, Trash2, Wand2 } from 'lucide-react';
import { Button, Card, cn } from '@/app/admin/components/ui';

interface QuickActionsCardProps {
  onSeedPreset: (preset: 'minimal' | 'standard' | 'large' | 'demo') => void;
  onClearAll: () => void;
  onResetAll: () => void;
  onFactoryReset: () => void;
  onOpenCustomDialog: () => void;
  onOpenSeedWizard: () => void;
  isSeeding: boolean;
  isClearing: boolean;
  isFactoryResetting: boolean;
  currentPreset: string | null;
}

const PRESETS = [
  {
    key: 'minimal' as const,
    name: 'Minimal',
    description: '5-10 records/module',
    icon: Zap,
    color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200 dark:border-emerald-800',
  },
  {
    key: 'standard' as const,
    name: 'Standard',
    description: '20-30 records/module',
    icon: Package,
    color: 'text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-800',
  },
  {
    key: 'large' as const,
    name: 'Large',
    description: '100+ records/module',
    icon: Rocket,
    color: 'text-purple-600 bg-purple-500/10 border-purple-200 dark:border-purple-800',
  },
  {
    key: 'demo' as const,
    name: 'Demo',
    description: '50 records/module',
    icon: Sparkles,
    color: 'text-amber-600 bg-amber-500/10 border-amber-200 dark:border-amber-800',
  },
];

export function QuickActionsCard({
  onSeedPreset,
  onClearAll,
  onResetAll,
  onFactoryReset,
  onOpenCustomDialog,
  onOpenSeedWizard,
  isSeeding,
  isClearing,
  isFactoryResetting,
  currentPreset,
}: QuickActionsCardProps) {
  const isBusy = isSeeding || isClearing || isFactoryResetting;
  return (
    <Card className="p-5 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database size={16} className="text-cyan-500" /> Quick Actions
          </h3>
          <p className="text-xs text-slate-500">Seed nhanh theo preset hoặc clear/reset toàn bộ</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSeedWizard}
            disabled={isBusy}
            className="gap-2"
          >
            <Wand2 size={14} /> Seed Wizard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCustomDialog}
            disabled={isBusy}
            className="gap-2"
          >
            <Settings size={14} /> Custom Seed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = currentPreset === preset.key;
          return (
            <button
              key={preset.key}
              onClick={() => onSeedPreset(preset.key)}
              disabled={isBusy}
              className={cn(
                'rounded-lg border p-3 text-left transition-all hover:shadow-md',
                preset.color,
                isActive && 'ring-2 ring-cyan-400',
                isBusy && 'opacity-60 cursor-not-allowed'
              )}
            >
              <Icon size={18} />
              <div className="mt-2 text-sm font-semibold">{preset.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{preset.description}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={onClearAll}
          disabled={isBusy}
          className="gap-2 text-rose-600 hover:text-rose-700"
        >
          <Trash2 size={14} /> Clear All
        </Button>
        <Button
          variant="outline"
          onClick={onResetAll}
          disabled={isBusy}
          className="gap-2"
        >
          <RefreshCw size={14} /> Reset All
        </Button>
        <Button
          variant="destructive"
          onClick={onFactoryReset}
          disabled={isBusy}
          className="gap-2"
        >
          <AlertTriangle size={14} /> Factory Reset
        </Button>
      </div>
    </Card>
  );
}
