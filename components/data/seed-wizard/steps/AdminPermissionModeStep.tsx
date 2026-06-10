'use client';

import React from 'react';
import { Badge, cn } from '@/app/admin/components/ui';
import type { AdminPermissionMode } from '../types';

type AdminPermissionModeStepProps = {
  value: AdminPermissionMode;
  onChange: (value: AdminPermissionMode) => void;
};

const OPTIONS: Array<{
  description: string;
  helper: string;
  label: string;
  mode: AdminPermissionMode;
  tone: string;
}> = [
  {
    description: 'Ai đăng nhập admin cũng có toàn quyền thao tác.',
    helper: 'Chỉ Super Admin được chỉnh quyền hoặc cấu trúc phân quyền.',
    label: 'Full quyền đơn giản (Sticky)',
    mode: 'simple_full_admin',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
  {
    description: 'Phân quyền theo vai trò, module, action như hiện tại.',
    helper: 'Dùng khi cần kiểm soát chi tiết theo phòng ban.',
    label: 'RBAC chuẩn',
    mode: 'rbac',
    tone: 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  },
];

export function AdminPermissionModeStep({ value, onChange }: AdminPermissionModeStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Phân quyền Admin</h3>
        <p className="text-xs text-slate-500">
          Chọn cách quản lý quyền cho đội admin. Ở chế độ full quyền, chỉ Super Admin mới được chỉnh quyền.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const checked = value === option.mode;
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => onChange(option.mode)}
              className={cn(
                'w-full text-left rounded-lg border p-3 transition-all',
                checked
                  ? 'border-cyan-400 ring-2 ring-cyan-200/60 dark:ring-cyan-900/60'
                  : 'border-slate-200 dark:border-slate-800',
                option.tone
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{option.label}</div>
                  <div className="text-xs mt-1">{option.description}</div>
                  <div className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">{option.helper}</div>
                </div>
                {checked && <Badge variant="secondary">Đang chọn</Badge>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
