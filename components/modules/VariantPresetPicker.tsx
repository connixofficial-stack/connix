'use client';

import React from 'react';
import {
  CalendarClock,
  Image,
  Package,
  Palette,
  Ruler,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Ticket,
  Box,
  Users,
} from 'lucide-react';
import type { VariantPreset } from '@/lib/modules/variant-presets';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Box,
  CalendarClock,
  Image,
  Package,
  Palette,
  Ruler,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Ticket,
  Users,
};

interface VariantPresetPickerProps {
  presets: VariantPreset[];
  selectedKey: string;
  suggestedKey?: string;
  onSelect: (key: string) => void;
}

export function VariantPresetPicker({
  presets,
  selectedKey,
  suggestedKey,
  onSelect,
}: VariantPresetPickerProps) {
  const suggested = presets.find((preset) => preset.key === suggestedKey);

  return (
    <div className="space-y-3">
      {suggested && (
        <p className="text-xs text-slate-500">
          Gợi ý: <span className="font-medium text-slate-700 dark:text-slate-200">{suggested.name}</span>
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {presets.map((preset) => {
          const Icon = iconMap[preset.iconKey] ?? Tag;
          const isActive = preset.key === selectedKey;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onSelect(preset.key)}
              className={
                `text-left rounded-lg border p-3 transition-all ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-50 dark:border-cyan-500 dark:bg-cyan-950/30'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 hover:border-cyan-300'
                }`
              }
            >
              <div className="flex items-start gap-3">
                <div
                  className={
                    `h-9 w-9 rounded-lg flex items-center justify-center ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {preset.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{preset.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
