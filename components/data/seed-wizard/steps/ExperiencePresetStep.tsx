'use client';

import React from 'react';
import { cn, Card } from '@/app/admin/components/ui';
import type { ExperiencePreset } from '../experience-presets';

type ExperiencePresetStepProps = {
  options: ExperiencePreset[];
  value: string;
  onChange: (value: string) => void;
};

export function ExperiencePresetStep({ options, value, onChange }: ExperiencePresetStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Giao diện frontend muốn theo phong cách nào?</h3>
        <p className="text-xs text-slate-500">Chọn preset để khởi tạo cấu hình experience phù hợp.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <Card
            key={option.key}
            className={cn(
              'cursor-pointer p-4 border transition-all',
              value === option.key
                ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
            )}
            onClick={() => onChange(option.key)}
          >
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{option.label}</div>
              <div className="text-xs text-slate-500">{option.description}</div>
              <div className="text-[11px] text-slate-400">{option.helper}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
