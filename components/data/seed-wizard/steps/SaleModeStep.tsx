'use client';

import React from 'react';
import { cn } from '@/app/admin/components/ui';
import type { SaleMode } from '../types';

const SALE_MODE_OPTIONS: Array<{ description: string; key: SaleMode; label: string; note: string }> = [
  {
    key: 'cart',
    label: 'Thêm vào giỏ hàng & thanh toán',
    description: 'Mua online bình thường, có giỏ hàng',
    note: 'Giữ cart, orders, customers',
  },
  {
    key: 'contact',
    label: 'Bấm nút Liên hệ',
    description: 'Không mua online, chỉ liên hệ qua form /contact',
    note: 'Tắt cart, orders, wishlist, promotions',
  },
  {
    key: 'affiliate',
    label: 'Bấm nút Mua ngay (Affiliate)',
    description: 'Chuyển sang link ngoài (Shopee, Tiki...)',
    note: 'Tắt cart, orders. Seed affiliateLink',
  },
];

type SaleModeStepProps = {
  value: SaleMode;
  onChange: (value: SaleMode) => void;
};

export function SaleModeStep({ value, onChange }: SaleModeStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Khi khách muốn mua sản phẩm, họ làm gì?
        </h3>
        <p className="text-xs text-slate-500">Chọn 1 chế độ bán hàng cụ thể.</p>
      </div>

      <div className="space-y-3">
        {SALE_MODE_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={cn(
              'w-full text-left rounded-lg border p-4 transition-all',
              value === option.key
                ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
            )}
          >
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{option.label}</div>
              <div className="text-xs text-slate-500">{option.description}</div>
              <div className="text-[11px] text-slate-400">{option.note}</div>
            </div>
          </button>
        ))}
      </div>

      {value === 'contact' && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-200">
          Sẽ tắt các modules: cart, orders, wishlist, promotions (không cần giỏ hàng/đơn).
        </div>
      )}
      {value === 'affiliate' && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-200">
          Sẽ tắt các modules: cart, orders. Sản phẩm sẽ có affiliateLink.
        </div>
      )}
    </div>
  );
}
