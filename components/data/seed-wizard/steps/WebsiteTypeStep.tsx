'use client';

import React from 'react';
import { cn, Card } from '@/app/admin/components/ui';
import { ToggleSwitch } from '@/components/modules/shared';
import { WEBSITE_TYPE_OPTIONS } from '../wizard-presets';
import type { WebsiteType } from '../types';

type WebsiteTypeStepProps = {
  value: WebsiteType;
  onChange: (value: WebsiteType) => void;
  useSeedMauImages: boolean;
  onToggleSeedMau: (value: boolean) => void;
};

export function WebsiteTypeStep({ value, onChange, useSeedMauImages, onToggleSeedMau }: WebsiteTypeStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Website này làm gì?</h3>
        <p className="text-xs text-slate-500">Chọn đúng loại website để bật đúng modules và preset trải nghiệm.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {WEBSITE_TYPE_OPTIONS.map((option) => (
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
              <div className="text-[11px] text-slate-400">Modules: {option.modules.join(', ')}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sử dụng ảnh mẫu</h4>
            <p className="text-xs text-slate-500">
              Dùng ảnh có sẵn từ seed_mau theo ngành hàng. Tắt nếu muốn tự upload sau.
            </p>
          </div>
          <ToggleSwitch
            enabled={useSeedMauImages}
            onChange={() => onToggleSeedMau(!useSeedMauImages)}
            color="bg-cyan-500"
          />
        </div>
      </div>
    </div>
  );
}
