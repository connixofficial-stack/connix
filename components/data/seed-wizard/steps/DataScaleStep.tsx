'use client';

import React from 'react';
import { cn } from '@/app/admin/components/ui';
import type { DataScale } from '../types';

const SCALE_OPTIONS: Array<{ description: string; key: DataScale; label: string }> = [
  { key: 'low', label: 'Ít (test nhanh)', description: '~5 SP, ~5 bài, ~5 đơn' },
  { key: 'medium', label: 'Vừa (dev)', description: '~20 SP, ~15 bài, ~20 đơn' },
  { key: 'high', label: 'Nhiều (demo)', description: '~50 SP, ~30 bài, ~50 đơn' },
  { key: 'none', label: 'Không tạo dữ liệu', description: 'Chỉ lưu cấu hình, không seed record nội dung' },
];

type DataScaleStepProps = {
  summary: Array<{ label: string; value: number }>;
  value: DataScale;
  onChange: (value: DataScale) => void;
};

export function DataScaleStep({ summary, value, onChange }: DataScaleStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Muốn seed bao nhiêu dữ liệu?</h3>
        <p className="text-xs text-slate-500">Quy mô lớn phù hợp demo, nhỏ phù hợp test.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {SCALE_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={cn(
              'rounded-lg border p-3 text-left transition-all',
              value === option.key
                ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
            )}
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{option.label}</div>
            <div className="text-xs text-slate-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      {summary.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
          <div className="text-xs text-slate-500">Ước tính dữ liệu sẽ seed</div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {summary.map((item) => (
              <div key={item.label} className="rounded-md bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
                <div className="text-[11px] text-slate-500">{item.label}</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">~{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
