'use client';

import React from 'react';
import { Check, Lock } from 'lucide-react';
import { ToggleSwitch } from './toggle-switch';

interface ModuleStatusProps {
  isCore?: boolean;
  enabled?: boolean;
  onToggle?: () => void;
  toggleColor?: string;
  disabled?: boolean;
}

export const ModuleStatus: React.FC<ModuleStatusProps> = ({
  isCore = false,
  enabled = true,
  onToggle,
  toggleColor = 'bg-emerald-500',
  disabled = false,
}) => {
  if (isCore) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <Check size={16} />
          </div>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Module Core - Luôn hoạt động</span>
        </div>
        <Lock size={16} className="text-slate-400" />
      </div>
    );
  }
  
  return (
    <div className={`${enabled ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} border rounded-lg p-3 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'} flex items-center justify-center`}>
          <Check size={16} />
        </div>
        <span className={`text-sm font-medium ${enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
          {enabled ? 'Module đang hoạt động' : 'Module đang tắt'}
        </span>
      </div>
      <ToggleSwitch
        enabled={enabled}
        onChange={onToggle ?? (() => {})}
        color={toggleColor}
        disabled={disabled}
      />
    </div>
  );
};
