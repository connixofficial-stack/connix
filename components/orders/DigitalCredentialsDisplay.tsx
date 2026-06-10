'use client';

import React, { useState } from 'react';
import { Check, Copy, Download, Key, User, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type Credentials = {
  username?: string;
  password?: string;
  licenseKey?: string;
  downloadUrl?: string;
  customContent?: string;
  expiresAt?: number;
  deliveredAt?: number;
};

type Props = {
  type: string;
  credentials: Credentials;
  brandColor?: string;
  tokens?: {
    cardBg: string;
    cardBorder: string;
    title: string;
    fieldBg: string;
    fieldBorder: string;
    fieldText: string;
    fieldIcon: string;
    actionBg: string;
    actionText: string;
    alertText: string;
  };
};

const getTint = (hex: string, opacity: number) => {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) {
    return hex;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function DigitalCredentialsDisplay({ type, credentials, brandColor = '#22c55e', tokens }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Đã copy!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isExpired = Boolean(credentials.expiresAt && now && credentials.expiresAt < now);

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{
        backgroundColor: tokens?.cardBg ?? getTint(brandColor, 0.04),
        borderColor: tokens?.cardBorder ?? getTint(brandColor, 0.2),
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase" style={{ color: tokens?.title ?? '#64748b' }}>
          Thông tin sản phẩm Digital
        </div>
        {isExpired && (
          <div className="flex items-center gap-1 text-xs" style={{ color: tokens?.alertText ?? '#d97706' }}>
            <AlertTriangle size={12} /> Đã hết hạn
          </div>
        )}
      </div>

      {type === 'account' && (
        <div className="space-y-2">
          <div
            className="flex items-center justify-between rounded-lg border px-3 py-2"
            style={{ borderColor: tokens?.fieldBorder ?? '#e2e8f0', backgroundColor: tokens?.fieldBg ?? '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <User size={14} style={{ color: tokens?.fieldIcon ?? '#94a3b8' }} />
              <span className="text-sm font-mono" style={{ color: tokens?.fieldText ?? '#0f172a' }}>
                {credentials.username}
              </span>
            </div>
            <button
              type="button"
              onClick={() => credentials.username && copyToClipboard(credentials.username, 'username')}
              className="hover:opacity-80"
              style={{ color: tokens?.fieldIcon ?? '#94a3b8' }}
            >
                {copiedField === 'username'
                  ? <Check size={14} style={{ color: tokens?.actionText ?? brandColor }} />
                  : <Copy size={14} />}
            </button>
          </div>
          <div
            className="flex items-center justify-between rounded-lg border px-3 py-2"
            style={{ borderColor: tokens?.fieldBorder ?? '#e2e8f0', backgroundColor: tokens?.fieldBg ?? '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <Key size={14} style={{ color: tokens?.fieldIcon ?? '#94a3b8' }} />
              <span className="text-sm font-mono" style={{ color: tokens?.fieldText ?? '#0f172a' }}>
                {showPassword ? credentials.password : '••••••••••••'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:opacity-80"
                style={{ color: tokens?.fieldIcon ?? '#94a3b8' }}
              >
                {copiedField === 'password'
                  ? <Check size={14} style={{ color: tokens?.actionText ?? brandColor }} />
                  : <Copy size={14} />}
              </button>
              <button
                type="button"
                onClick={() => credentials.password && copyToClipboard(credentials.password, 'password')}
                className="hover:opacity-80"
                style={{ color: tokens?.fieldIcon ?? '#94a3b8' }}
              >
                {copiedField === 'password'
                  ? <Check size={14} style={{ color: tokens?.actionText ?? brandColor }} />
                  : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {type === 'license' && (
        <div
          className="flex items-center justify-between rounded-lg border px-3 py-2"
          style={{ borderColor: tokens?.fieldBorder ?? '#e2e8f0', backgroundColor: tokens?.fieldBg ?? '#ffffff' }}
        >
          <div className="flex items-center gap-2">
            <Key size={14} style={{ color: tokens?.fieldIcon ?? '#94a3b8' }} />
            <span className="text-sm font-mono" style={{ color: tokens?.fieldText ?? '#0f172a' }}>
              {credentials.licenseKey}
            </span>
          </div>
          <button
            type="button"
            onClick={() => credentials.licenseKey && copyToClipboard(credentials.licenseKey, 'license')}
            className="hover:opacity-80"
            style={{ color: tokens?.fieldIcon ?? '#94a3b8' }}
          >
            {copiedField === 'license'
              ? <Check size={14} style={{ color: tokens?.actionText ?? brandColor }} />
              : <Copy size={14} />}
          </button>
        </div>
      )}

      {type === 'download' && credentials.downloadUrl && (
        <a
          href={credentials.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
          style={{ backgroundColor: tokens?.actionBg ?? brandColor, color: tokens?.actionText ?? '#ffffff' }}
        >
          <Download size={16} /> Tải xuống
        </a>
      )}

      {type === 'custom' && (
        <div
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: tokens?.fieldBorder ?? '#e2e8f0', backgroundColor: tokens?.fieldBg ?? '#ffffff' }}
        >
          <div className="flex items-start gap-2">
            <FileText size={14} className="mt-0.5" style={{ color: tokens?.fieldIcon ?? '#94a3b8' }} />
            <p className="text-sm whitespace-pre-wrap" style={{ color: tokens?.fieldText ?? '#0f172a' }}>
              {credentials.customContent}
            </p>
          </div>
        </div>
      )}

      {credentials.expiresAt && (
        <div className="text-xs" style={{ color: tokens?.title ?? '#64748b' }}>
          Hết hạn: {new Date(credentials.expiresAt).toLocaleDateString('vi-VN')}
        </div>
      )}
    </div>
  );
}
