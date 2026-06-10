'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import type { ModuleLabels, SystemPreset } from '../_types';

interface PresetDropdownProps {
  presets: SystemPreset[];
  selectedPreset: string;
  onSelect: (presetKey: string) => void;
  loading?: boolean;
  labels: ModuleLabels;
}

export const PresetDropdown: React.FC<PresetDropdownProps> = ({
  presets,
  selectedPreset,
  onSelect,
  loading,
  labels,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = presets.find((preset) => preset.key === selectedPreset);

  return (
    <div className="relative">
      <button
        onClick={() =>{  setIsOpen(!isOpen); }}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        <span>{selected?.name ?? labels.custom}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() =>{  setIsOpen(false); }} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-semibold px-2">{labels.selectPreset}</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => { onSelect(preset.key); setIsOpen(false); }}
                  className={`w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    selectedPreset === preset.key ? 'bg-slate-50 dark:bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{preset.name}</span>
                      <p className="text-xs text-slate-500">{preset.description}</p>
                    </div>
                    {selectedPreset === preset.key && (
                      <Check size={14} className="text-cyan-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{preset.enabledModules.length} {labels.moduleCountLabel}</p>
                </button>
              ))}
              <button
                onClick={() => { onSelect('custom'); setIsOpen(false); }}
                className={`w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                  selectedPreset === 'custom' ? 'bg-slate-50 dark:bg-slate-800' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{labels.custom}</span>
                    <p className="text-xs text-slate-500">{labels.manualConfig}</p>
                  </div>
                  {selectedPreset === 'custom' && (
                    <Check size={14} className="text-cyan-500 shrink-0" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
