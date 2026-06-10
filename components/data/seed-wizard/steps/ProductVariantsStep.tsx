'use client';

import React from 'react';
import { cn } from '@/app/admin/components/ui';
import { VARIANT_PRESET_EXAMPLES } from '../wizard-presets';
import type { VariantImages, VariantPresetKey, VariantPricing, VariantStock } from '../types';

type ProductVariantsStepProps = {
  variantEnabled: boolean;
  variantImages: VariantImages;
  variantPresetKey: VariantPresetKey;
  variantPricing: VariantPricing;
  variantStock: VariantStock;
  onToggleEnabled: (enabled: boolean) => void;
  onPresetChange: (presetKey: VariantPresetKey) => void;
  onPricingChange: (value: VariantPricing) => void;
  onStockChange: (value: VariantStock) => void;
  onImagesChange: (value: VariantImages) => void;
};

export function ProductVariantsStep({
  variantEnabled,
  variantImages,
  variantPresetKey,
  variantPricing,
  variantStock,
  onToggleEnabled,
  onPresetChange,
  onPricingChange,
  onStockChange,
  onImagesChange,
}: ProductVariantsStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Sản phẩm có nhiều phiên bản không?
        </h3>
        <p className="text-xs text-slate-500">Ví dụ: cùng 1 áo mà có Size S/M/L và Màu Đỏ/Xanh.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          onClick={() => onToggleEnabled(false)}
          className={cn(
            'rounded-lg border p-4 text-left transition-all',
            !variantEnabled
              ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
          )}
        >
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Không có phiên bản</div>
          <div className="text-xs text-slate-500 mt-1">Mỗi sản phẩm chỉ 1 loại duy nhất.</div>
        </button>
        <button
          onClick={() => onToggleEnabled(true)}
          className={cn(
            'rounded-lg border p-4 text-left transition-all',
            variantEnabled
              ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
          )}
        >
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Có phiên bản (biến thể)</div>
          <div className="text-xs text-slate-500 mt-1">Chọn preset size/màu/dung lượng...</div>
        </button>
      </div>

      {variantEnabled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Chọn preset phiên bản</h4>
            <div className="grid gap-3 md:grid-cols-2">
              {VARIANT_PRESET_EXAMPLES.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => onPresetChange(preset.key)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-all',
                    variantPresetKey === preset.key
                      ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
                  )}
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{preset.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{preset.example}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Giá mỗi phiên bản</div>
              <div className="grid gap-2">
                {(['variant', 'product'] as VariantPricing[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => onPricingChange(value)}
                    className={cn(
                      'rounded-lg border p-2 text-left text-xs transition-all',
                      variantPricing === value
                        ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
                    )}
                  >
                    {value === 'variant' ? 'Giá riêng từng phiên bản' : 'Giá chung theo sản phẩm'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tồn kho</div>
              <div className="grid gap-2">
                {(['variant', 'product'] as VariantStock[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => onStockChange(value)}
                    className={cn(
                      'rounded-lg border p-2 text-left text-xs transition-all',
                      variantStock === value
                        ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
                    )}
                  >
                    {value === 'variant' ? 'Tồn kho riêng từng phiên bản' : 'Tồn kho chung theo sản phẩm'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ảnh phiên bản</div>
              <div className="grid gap-2">
                {(['inherit', 'override', 'both'] as VariantImages[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => onImagesChange(value)}
                    className={cn(
                      'rounded-lg border p-2 text-left text-xs transition-all',
                      variantImages === value
                        ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
                    )}
                  >
                    {value === 'inherit' && 'Kế thừa ảnh sản phẩm'}
                    {value === 'override' && 'Ảnh riêng từng phiên bản'}
                    {value === 'both' && 'Cả hai (có thể override)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
