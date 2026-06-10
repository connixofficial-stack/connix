'use client';

import React from 'react';
import { cn } from '@/app/admin/components/ui';

type ProductEnhancementsStepProps = {
  productFramesEnabled: boolean;
  productSupplementalContentEnabled: boolean;
  onChangeFrames: (enabled: boolean) => void;
  onChangeSupplementalContent: (enabled: boolean) => void;
};

function ToggleCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border p-4 text-left transition-all',
        active
          ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
      )}
    >
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{description}</div>
    </button>
  );
}

export function ProductEnhancementsStep({
  productFramesEnabled,
  productSupplementalContentEnabled,
  onChangeFrames,
  onChangeSupplementalContent,
}: ProductEnhancementsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Bật thêm tiện ích cho sản phẩm?
        </h3>
        <p className="text-xs text-slate-500">
          Mặc định cả hai đều tắt để seed gọn. Bạn có thể bật sau trong trang Cài đặt.
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Khung viền sản phẩm</div>
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleCard
            active={!productFramesEnabled}
            title="Tắt"
            description="Không kích hoạt tính năng khung viền sản phẩm."
            onClick={() => onChangeFrames(false)}
          />
          <ToggleCard
            active={productFramesEnabled}
            title="Bật"
            description="Kích hoạt tính năng và cấu hình khung viền sản phẩm."
            onClick={() => onChangeFrames(true)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Nội dung bổ sung chi tiết sản phẩm</div>
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleCard
            active={!productSupplementalContentEnabled}
            title="Tắt"
            description="Chưa bật template nội dung đầu/FAQ/nội dung cuối cho product detail."
            onClick={() => onChangeSupplementalContent(false)}
          />
          <ToggleCard
            active={productSupplementalContentEnabled}
            title="Bật"
            description="Thêm route quản lý template nội dung bổ sung cho trang chi tiết sản phẩm."
            onClick={() => onChangeSupplementalContent(true)}
          />
        </div>
      </div>
    </div>
  );
}
