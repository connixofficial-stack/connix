'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { QrCode } from 'lucide-react';

interface VietQRPreviewProps {
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
  template: string;
}

export function VietQRPreview({
  bankCode,
  bankAccountNumber,
  bankAccountName,
  template,
}: VietQRPreviewProps) {
  const normalizedBankCode = bankCode.trim();
  const normalizedAccountNumber = bankAccountNumber.trim();
  const normalizedAccountName = bankAccountName.trim();
  const normalizedTemplate = template.trim() || 'compact';

  const previewUrl = useMemo(() => {
    if (!normalizedBankCode || !normalizedAccountNumber) {
      return '';
    }
    const accountName = normalizedAccountName || 'VietAdmin';
    return `https://img.vietqr.io/image/${normalizedBankCode}-${normalizedAccountNumber}-${normalizedTemplate}.jpg?accountName=${encodeURIComponent(accountName)}`;
  }, [normalizedAccountName, normalizedAccountNumber, normalizedBankCode, normalizedTemplate]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
        <QrCode size={14} className="text-slate-500" />
        <span>Preview VietQR</span>
      </h3>
      {previewUrl ? (
        <div className="flex flex-col items-center gap-2">
          <Image
            src={previewUrl}
            alt="VietQR"
            width={200}
            height={200}
            unoptimized
            className="rounded-lg border border-slate-200 bg-white"
          />
          <div className="text-xs text-slate-500">Mẫu: {normalizedTemplate}</div>
          <div className="text-xs text-slate-400">Quét mã để thanh toán</div>
        </div>
      ) : (
        <div className="text-xs text-slate-500">
          Nhập đầy đủ thông tin ngân hàng để xem preview.
        </div>
      )}
    </div>
  );
}
