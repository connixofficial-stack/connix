'use client';

import React from 'react';
import { Eye, EyeOff, Key, Link as LinkIcon, User, FileText } from 'lucide-react';
import { Input, Label } from '@/app/admin/components/ui';

type DigitalDeliveryType = 'account' | 'license' | 'download' | 'custom';

type Credentials = {
  username?: string;
  password?: string;
  licenseKey?: string;
  downloadUrl?: string;
  customContent?: string;
  expiresAt?: number;
};

type Props = {
  type: DigitalDeliveryType;
  value: Credentials;
  onChange: (credentials: Credentials) => void;
  disabled?: boolean;
};

export function DigitalCredentialsForm({ type, value, onChange, disabled }: Props) {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleChange = (key: keyof Credentials, val: string | number | undefined) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      {type === 'account' && (
        <>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><User size={14} /> Username</Label>
            <Input
              value={value.username ?? ''}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Nhập username..."
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Key size={14} /> Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={value.password ?? ''}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Nhập password..."
                disabled={disabled}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </>
      )}

      {type === 'license' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Key size={14} /> License Key</Label>
          <Input
            value={value.licenseKey ?? ''}
            onChange={(e) => handleChange('licenseKey', e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="font-mono"
            disabled={disabled}
          />
        </div>
      )}

      {type === 'download' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><LinkIcon size={14} /> Download URL</Label>
          <Input
            type="url"
            value={value.downloadUrl ?? ''}
            onChange={(e) => handleChange('downloadUrl', e.target.value)}
            placeholder="https://..."
            disabled={disabled}
          />
        </div>
      )}

      {type === 'custom' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><FileText size={14} /> Nội dung</Label>
          <textarea
            className="min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={value.customContent ?? ''}
            onChange={(e) => handleChange('customContent', e.target.value)}
            placeholder="Nhập nội dung giao cho khách..."
            disabled={disabled}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Ngày hết hạn (tùy chọn)</Label>
        <Input
          type="date"
          value={value.expiresAt ? new Date(value.expiresAt).toISOString().split('T')[0] : ''}
          onChange={(e) => handleChange('expiresAt', e.target.value ? new Date(e.target.value).getTime() : undefined)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
