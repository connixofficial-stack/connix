'use client';

import React from 'react';
import { Layers, Loader2, Lock, Package, Settings } from 'lucide-react';
import Link from 'next/link';
import type { AdminModule, ModuleLabels } from '../_types';
import { categoryColors, getModuleConfigRoute, iconMap } from '../_constants';

import { hasModuleRuntimeDefinition } from '@/lib/modules/runtime-config';

interface ModuleCardProps {
  module: AdminModule;
  onToggle: (key: string, enabled: boolean) => void;
  canToggle: boolean;
  allModules: AdminModule[];
  isToggling?: boolean;
  isAnyToggling?: boolean;
  labels: ModuleLabels;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  showCheckbox?: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onToggle,
  canToggle,
  allModules,
  isToggling,
  isAnyToggling,
  labels,
  selected = false,
  onSelectChange,
  showCheckbox = false,
}) => {
  const Icon = iconMap[module.icon] || Package;
  const categoryColor = categoryColors[module.category];
  const categoryLabel = labels.categories[module.category];
  const configRoute = module.key ? getModuleConfigRoute(module.key) : undefined;
  const isCoreLocked = module.isCore && module.key !== 'roles';
  const isDisabled = isCoreLocked || !canToggle || (isToggling ?? isAnyToggling);
  const hasDependents = allModules.some((mod) => mod.dependencies?.includes(module.key) && mod.enabled);
  const isSyncable = module.enabled && hasModuleRuntimeDefinition(module.key);

  return (
    <div className={`relative bg-white dark:bg-slate-900 border rounded-lg p-4 transition-all ${
      selected
        ? 'border-cyan-500 dark:border-cyan-500/50 ring-1 ring-cyan-500/30'
        : (module.enabled
          ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          : 'border-slate-200 dark:border-slate-800 opacity-60')
    }`}>
      {showCheckbox && isSyncable && (
        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectChange?.(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer dark:bg-slate-800"
          />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          module.enabled
            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
        }`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-800 dark:text-slate-200 font-medium text-sm truncate">{module.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {isCoreLocked && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                {labels.badges.core}
              </span>
            )}
            {hasDependents && module.enabled && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                {labels.badges.parent}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{module.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-medium ${categoryColor}`}>{categoryLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[9px] text-slate-500 min-h-[12px]">
          {isCoreLocked && (
            <Lock size={12} className="text-slate-400" />
          )}
          {!canToggle && !module.isCore && (
            <span className="text-rose-500">{labels.needParent}</span>
          )}
        </div>
        <button
          onClick={() => !isDisabled && onToggle(module.key, !module.enabled)}
          disabled={isDisabled}
          title={!canToggle && !module.isCore ? labels.needParent : undefined}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            isDisabled
              ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed'
              : (module.enabled
                ? 'bg-cyan-500 cursor-pointer'
                : 'bg-slate-300 dark:bg-slate-700 cursor-pointer')
          }`}
        >
          {isToggling ? (
            <Loader2 size={14} className="absolute top-1 left-1/2 -translate-x-1/2 animate-spin text-white" />
          ) : (
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
              module.enabled ? 'left-6' : 'left-1'
            }`}></div>
          )}
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {module.dependencies && module.dependencies.length > 0 ? (
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Layers size={10} />
            <span>
              {labels.dependsOn}: {module.dependencies.map((dep) => allModules.find((mod) => mod.key === dep)?.name ?? dep).join(', ')}
            </span>
          </div>
        ) : (
          <div></div>
        )}

        {configRoute && module.enabled && (
          <Link
            href={configRoute}
            className="flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-medium"
          >
            <Settings size={12} /> {labels.configure}
          </Link>
        )}
      </div>
    </div>
  );
};
