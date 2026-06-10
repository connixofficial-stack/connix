'use client';

import React from 'react';
import { Badge, Checkbox } from '@/app/admin/components/ui';

type ReviewStepProps = {
  adminPermissionMode: 'simple_full_admin' | 'rbac';
  brandMode: 'single' | 'dual';
  brandPrimary: string;
  brandSecondary: string;
  customerLoginEnabled: boolean;
  customerLoginRequired: boolean;
  clearBeforeSeed: boolean;
  dataScaleLabel: string;
  experienceSummary: string;
  industryKey: string | null;
  logoCustomized: boolean;
  moduleConfigs: { label: string; value: string }[];
  modules: string[];
  selectedLogo: string | null;
  summary: { label: string; value: string }[];
  useSeedMauImages: boolean;
  onCustomerLoginChange: (value: boolean) => void;
  onClearChange: (value: boolean) => void;
};

export function ReviewStep({
  adminPermissionMode,
  brandMode,
  brandPrimary,
  brandSecondary,
  customerLoginEnabled,
  customerLoginRequired,
  clearBeforeSeed,
  dataScaleLabel,
  experienceSummary,
  industryKey,
  logoCustomized,
  moduleConfigs,
  modules,
  selectedLogo,
  summary,
  useSeedMauImages,
  onCustomerLoginChange,
  onClearChange,
}: ReviewStepProps) {
  const permissionModeLabel = adminPermissionMode === 'simple_full_admin'
    ? 'Full quyền (Sticky)'
    : 'RBAC chuẩn';
  const permissionModeHelper = adminPermissionMode === 'simple_full_admin'
    ? 'Chỉ Super Admin được chỉnh quyền hoặc cấu trúc phân quyền.'
    : 'Quản lý theo vai trò & module như hiện tại.';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Xác nhận trước khi seed</h3>
        <p className="text-xs text-slate-500">Kiểm tra lại toàn bộ lựa chọn.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {summary.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <div className="text-xs text-slate-500">Experience preset</div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{experienceSummary}</div>
        <div className="text-xs text-slate-500 mt-1">Có thể chỉnh chi tiết tại /system/experiences.</div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <div className="text-xs text-slate-500">Màu thương hiệu</div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {brandMode === 'dual' ? '2 màu (Dual)' : '1 màu (Single)'}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: brandPrimary }} />
            Màu chính
          </span>
          {brandMode === 'dual' && (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: brandSecondary || brandPrimary }} />
              Màu phụ
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Ảnh hưởng: /admin/settings, /system/experiences, /admin/home-components.
        </div>
      </div>

      {moduleConfigs.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
          <div className="text-xs text-slate-500">Cấu hình modules</div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {moduleConfigs.map((item) => (
              <div key={item.label} className="rounded-md bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
                <div className="text-[11px] text-slate-500">{item.label}</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <div className="text-xs text-slate-500">Modules sẽ seed</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {modules.map((moduleKey) => (
            <Badge key={moduleKey} variant="secondary">
              {moduleKey}
            </Badge>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <div className="text-xs text-slate-500">Phân quyền admin</div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{permissionModeLabel}</div>
        <div className="text-xs text-slate-500 mt-1">{permissionModeHelper}</div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500">Đăng nhập khách</div>
          {customerLoginRequired && (
            <Badge variant="secondary">Dependency</Badge>
          )}
        </div>
        <label className="flex items-center gap-3">
          <Checkbox
            checked={customerLoginEnabled}
            onCheckedChange={(value) => onCustomerLoginChange(Boolean(value))}
          />
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bật đăng nhập khách</div>
            <div className="text-xs text-slate-500">
              Login chỉ hiển thị khi module Khách hàng + tính năng Đăng nhập KH đang bật.
            </div>
          </div>
        </label>
        {customerLoginRequired && !customerLoginEnabled && (
          <div className="text-xs text-amber-600">
            Sẽ tự bật lại khi seed vì phụ thuộc Module Khách hàng hoặc Experience Menu.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <div className="text-xs text-slate-500">Quy mô dữ liệu</div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{dataScaleLabel}</div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2">
        <div className="text-xs text-slate-500">Ảnh mẫu</div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {useSeedMauImages ? 'Đang bật' : 'Đang tắt'}
        </div>
        {useSeedMauImages && selectedLogo && (
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <img
                src={selectedLogo}
                alt="Logo"
                className="h-10 object-contain border rounded px-2 bg-white dark:bg-slate-900"
              />
              <div>
                <div className="text-slate-700 dark:text-slate-200 font-medium">
                  {logoCustomized ? 'Logo website đã chọn' : 'Logo website ngẫu nhiên'}
                </div>
                <div className="text-[11px] text-slate-500">Hiển thị ở header, footer và settings</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">Tự động chọn 6-8 logos còn lại làm đối tác.</div>
            {industryKey && (
              <div className="text-[11px] text-slate-400">Nguồn: seed_mau/{industryKey}/logos</div>
            )}
          </div>
        )}
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 cursor-pointer">
        <Checkbox checked={clearBeforeSeed} onCheckedChange={(value) => onClearChange(value)} />
        <div>
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">Clear dữ liệu cũ trước khi seed</div>
          <div className="text-xs text-amber-700 dark:text-amber-300">Xóa sạch data cũ, sau đó seed lại theo wizard.</div>
        </div>
      </label>
    </div>
  );
}
