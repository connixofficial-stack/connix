'use client';

import React from 'react';
import { Input, Label } from '@/app/admin/components/ui';
import type { AdminConfig } from '../types';

type AdminConfigStepProps = {
  value: AdminConfig;
  onChange: (value: AdminConfig) => void;
};

export function AdminConfigStep({ value, onChange }: AdminConfigStepProps) {
  const updateField = (field: keyof AdminConfig, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Cấu hình SuperAdmin
        </h3>
        <p className="text-xs text-slate-500">
          Bỏ trống sẽ dùng mặc định: tranmanhhieu10@gmail.com / 123456.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Email đăng nhập</Label>
          <Input
            type="email"
            value={value.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="tranmanhhieu10@gmail.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Mật khẩu</Label>
          <Input
            type="password"
            value={value.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="123456"
          />
        </div>
      </div>
    </div>
  );
}
