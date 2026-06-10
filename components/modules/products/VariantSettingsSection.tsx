'use client';

import React from 'react';
import { Badge, Card } from '@/app/admin/components/ui';

interface VariantSettingsSectionProps {
  enabled: boolean;
  outOfStockDisplay: string;
  imageChangeAnimation: string;
}

const COLOR_SWATCHES = ['#ef4444', '#22c55e', '#3b82f6', '#f97316'];
const SIZE_OPTIONS = ['S', 'M', 'L', 'XL'];
const DURATION_OPTIONS = ['1 tuần', '1 tháng', '1 năm', 'Trọn đời'];

export function VariantSettingsSection({
  enabled,
  outOfStockDisplay,
  imageChangeAnimation,
}: VariantSettingsSectionProps) {
  if (!enabled) {
    return (
      <Card className="p-4 text-sm text-slate-500">
        Bật tính năng phiên bản để xem preview hiển thị option.
      </Card>
    );
  }

  const outOfStockClass = outOfStockDisplay === 'blur'
    ? 'opacity-40'
    : outOfStockDisplay === 'disable'
      ? 'opacity-50 line-through'
      : '';

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Preview lựa chọn phiên bản</h4>
        <p className="text-xs text-slate-500 mt-1">Hiệu ứng đổi ảnh: {imageChangeAnimation}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500">Màu sắc</p>
        <div className="flex items-center gap-2">
          {COLOR_SWATCHES.map((color) => (
            <div key={color} className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
          ))}
          <div className={`relative w-6 h-6 rounded-full border border-slate-200 ${outOfStockClass}`} style={{ backgroundColor: '#a855f7' }}>
            {outOfStockDisplay === 'blur' && (
              <Badge className="absolute -top-2 -right-2 text-[10px] px-1" variant="secondary">Hết</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500">Kích thước</p>
        <div className="flex items-center gap-2">
          {SIZE_OPTIONS.map((size) => (
            <button key={size} type="button" className="px-3 py-1 text-xs rounded-full border border-slate-200 text-slate-600">
              {size}
            </button>
          ))}
          <button type="button" className={`px-3 py-1 text-xs rounded-full border border-slate-200 text-slate-400 ${outOfStockClass}`}>
            XXL
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500">Thời hạn</p>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((duration) => (
            <div key={duration} className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600">
              {duration}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
