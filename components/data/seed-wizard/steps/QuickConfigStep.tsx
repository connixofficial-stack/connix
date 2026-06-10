'use client';

import React from 'react';
import { Button, Input, Label } from '@/app/admin/components/ui';
import type { QuickConfig } from '../types';

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

type QuickConfigStepProps = {
  value: QuickConfig;
  showComments: boolean;
  showOrders: boolean;
  showPosts: boolean;
  showProducts: boolean;
  onChange: (value: QuickConfig) => void;
  onSkip: () => void;
};

export function QuickConfigStep({
  value,
  showComments,
  showOrders,
  showPosts,
  showProducts,
  onChange,
  onSkip,
}: QuickConfigStepProps) {
  const updateField = <K extends keyof QuickConfig>(field: K, fieldValue: QuickConfig[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Cấu hình nhanh theo Convention</h3>
          <p className="text-xs text-slate-500">Bạn có thể chỉnh chi tiết sau tại /system/modules.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onSkip}>
          Bỏ qua, dùng mặc định
        </Button>
      </div>

      {showProducts && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sản phẩm</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Số sản phẩm / trang</Label>
              <Input
                type="number"
                min={4}
                value={value.productsPerPage}
                onChange={(event) => updateField('productsPerPage', Number(event.target.value) || 0)}
              />
              <p className="text-xs text-slate-500">Gợi ý: 12 sản phẩm cho grid view.</p>
            </div>
            <div className="space-y-2">
              <Label>Ngưỡng tồn kho thấp</Label>
              <Input
                type="number"
                min={1}
                value={value.lowStockThreshold}
                onChange={(event) => updateField('lowStockThreshold', Number(event.target.value) || 0)}
              />
              <p className="text-xs text-slate-500">Tự cảnh báo khi tồn kho thấp.</p>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái mặc định</Label>
              <select
                className={SELECT_CLASS}
                value={value.productsDefaultStatus}
                onChange={(event) => updateField('productsDefaultStatus', event.target.value as QuickConfig['productsDefaultStatus'])}
              >
                <option value="Draft">Bản nháp</option>
                <option value="Active">Đang bán</option>
              </select>
              <p className="text-xs text-slate-500">Draft giúp kiểm duyệt trước khi lên site.</p>
            </div>
          </div>
        </div>
      )}

      {showOrders && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Đơn hàng</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Preset trạng thái đơn hàng</Label>
              <select
                className={SELECT_CLASS}
                value={value.orderStatusPreset}
                onChange={(event) => updateField('orderStatusPreset', event.target.value as QuickConfig['orderStatusPreset'])}
              >
                <option value="simple">Simple (3 trạng thái)</option>
                <option value="standard">Standard (5 trạng thái)</option>
                <option value="advanced">Advanced (8 trạng thái)</option>
              </select>
              <p className="text-xs text-slate-500">Standard dễ quản lý, Advanced cho quy trình phức tạp.</p>
            </div>
            <div className="space-y-2">
              <Label>Số đơn / trang</Label>
              <Input
                type="number"
                min={5}
                value={value.ordersPerPage}
                onChange={(event) => updateField('ordersPerPage', Number(event.target.value) || 0)}
              />
              <p className="text-xs text-slate-500">Gợi ý: 20 đơn/trang.</p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Thanh toán mặc định: COD + Chuyển khoản + VietQR. Vận chuyển: Tiêu chuẩn + Nhanh.
          </div>
        </div>
      )}

      {showPosts && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bài viết</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Số bài / trang</Label>
              <Input
                type="number"
                min={4}
                value={value.postsPerPage}
                onChange={(event) => updateField('postsPerPage', Number(event.target.value) || 0)}
              />
              <p className="text-xs text-slate-500">Gợi ý: 10 bài cho blog cơ bản.</p>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái mặc định</Label>
              <select
                className={SELECT_CLASS}
                value={value.postsDefaultStatus}
                onChange={(event) => updateField('postsDefaultStatus', event.target.value as QuickConfig['postsDefaultStatus'])}
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Xuất bản</option>
              </select>
              <p className="text-xs text-slate-500">Draft giúp kiểm duyệt nội dung.</p>
            </div>
          </div>
        </div>
      )}

      {showComments && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bình luận</div>
          <div className="space-y-2">
            <Label>Trạng thái mặc định</Label>
            <select
              className={SELECT_CLASS}
              value={value.commentsDefaultStatus}
              onChange={(event) => updateField('commentsDefaultStatus', event.target.value as QuickConfig['commentsDefaultStatus'])}
            >
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Tự động duyệt</option>
            </select>
            <p className="text-xs text-slate-500">Chờ duyệt giúp hạn chế spam.</p>
          </div>
        </div>
      )}
    </div>
  );
}
