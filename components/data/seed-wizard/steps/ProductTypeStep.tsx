'use client';

import React from 'react';
import { cn } from '@/app/admin/components/ui';
import type { DigitalDeliveryType, ProductType } from '../types';

const PRODUCT_TYPE_OPTIONS: Array<{ description: string; key: ProductType; label: string }> = [
  { key: 'physical', label: 'Chỉ hàng vật lý', description: 'Áo quần, điện thoại, đồ gia dụng...' },
  { key: 'digital', label: 'Chỉ hàng số', description: 'Tài khoản, key bản quyền, file download...' },
  { key: 'both', label: 'Cả hai', description: 'Vừa có hàng ship vừa có hàng số' },
];

const DELIVERY_TYPE_OPTIONS: Array<{ description: string; key: DigitalDeliveryType; label: string }> = [
  { key: 'account', label: 'Tài khoản', description: 'Username + password' },
  { key: 'license', label: 'Key bản quyền', description: 'License key' },
  { key: 'download', label: 'Link tải về', description: 'Download URL' },
  { key: 'custom', label: 'Tùy chỉnh', description: 'Nội dung tự do' },
];

type ProductTypeStepProps = {
  deliveryType: DigitalDeliveryType;
  productType: ProductType;
  onDeliveryChange: (value: DigitalDeliveryType) => void;
  onProductTypeChange: (value: ProductType) => void;
};

export function ProductTypeStep({
  deliveryType,
  productType,
  onDeliveryChange,
  onProductTypeChange,
}: ProductTypeStepProps) {
  const showDelivery = productType === 'digital' || productType === 'both';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Bạn bán hàng vật lý hay hàng số?
        </h3>
        <p className="text-xs text-slate-500">Chọn loại sản phẩm chính.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PRODUCT_TYPE_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => onProductTypeChange(option.key)}
            className={cn(
              'rounded-lg border p-4 text-left transition-all',
              productType === option.key
                ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
            )}
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{option.label}</div>
            <div className="text-xs text-slate-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      {showDelivery && (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Hàng số giao cho khách bằng cách nào?</h4>
            <p className="text-xs text-slate-500">Chọn 1 kiểu giao hàng số mặc định.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {DELIVERY_TYPE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => onDeliveryChange(option.key)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-all',
                  deliveryType === option.key
                    ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
                )}
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{option.label}</div>
                <div className="text-xs text-slate-500 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
