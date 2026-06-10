'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { DigitalCredentialsDisplay } from '@/components/orders/DigitalCredentialsDisplay';

type OrderDetailItem = {
  actionHref?: string;
  actionLabel?: string;
  name: string;
  quantity: number;
  priceLabel: string;
  image?: string;
  variantTitle?: string;
};

type OrderDetailDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  brandColor: string;
  tokens?: {
    overlayBg: string;
    surface: string;
    border: string;
    title: string;
    subtitle: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    totalLabel: string;
    totalValue: string;
    timelineActive: string;
    timelineInactive: string;
    timelineLabel: string;
    drawerSectionBg: string;
    drawerSectionBorder: string;
    drawerSectionTitle: string;
    drawerSectionValue: string;
    sectionTitle: string;
    sectionText: string;
    itemThumbBg: string;
    itemThumbBorder: string;
    itemThumbText: string;
    actionPrimaryBg: string;
    actionPrimaryText: string;
    actionSecondaryBorder: string;
    actionSecondaryText: string;
    closeIcon: string;
  };
  badgeTokens?: {
    bg: string;
    border: string;
    text: string;
  };
  digitalTokens?: {
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
  title: string;
  subtitle?: string;
  statusLabel: string;
  statusColor?: string;
  totalLabel: string;
  items?: OrderDetailItem[];
  digitalItems?: Array<{
    name: string;
    type: string;
    credentials: {
      username?: string;
      password?: string;
      licenseKey?: string;
      downloadUrl?: string;
      customContent?: string;
      expiresAt?: number;
      deliveredAt?: number;
    };
  }>;
  showItems?: boolean;
  showDigitalCredentials?: boolean;
  showTimeline?: boolean;
  timelineStep?: number;
  timelineLabels?: string[];
  showPaymentMethod?: boolean;
  paymentMethod?: string;
  paymentDetails?: React.ReactNode;
  showShippingMethod?: boolean;
  shippingMethod?: string;
  showTracking?: boolean;
  tracking?: string;
  showShippingAddress?: boolean;
  shippingAddress?: string;
  allowCancel?: boolean;
  onCancel?: () => void;
  onReorder?: () => void;
};

const hexToRgba = (hex: string, opacity: number) => {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 3 && cleaned.length !== 6) {
    return hex;
  }
  const normalized = cleaned.length === 3
    ? cleaned.split('').map((char) => char + char).join('')
    : cleaned;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return hex;
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const getTint = (color: string, opacity: number) => hexToRgba(color, opacity);

export function OrderDetailDrawer({
  isOpen,
  onClose,
  brandColor,
  tokens,
  badgeTokens,
  digitalTokens,
  title,
  subtitle,
  statusLabel,
  statusColor,
  totalLabel,
  items,
  digitalItems,
  showItems,
  showDigitalCredentials,
  showTimeline,
  timelineStep,
  timelineLabels,
  showPaymentMethod,
  paymentMethod,
  paymentDetails,
  showShippingMethod,
  shippingMethod,
  showTracking,
  tracking,
  showShippingAddress,
  shippingAddress,
  allowCancel,
  onCancel,
  onReorder,
}: OrderDetailDrawerProps) {
  if (!isOpen) {
    return null;
  }

  const badgeColor = statusColor ?? brandColor;
  const timelineSteps = timelineLabels ?? [];
  const safeStep = Math.min(Math.max(timelineStep ?? 1, 1), timelineSteps.length || 1);
  const currentStepLabel = statusLabel || timelineSteps[safeStep - 1] || 'Đang cập nhật';
  const badgeStyle = badgeTokens
    ? { backgroundColor: badgeTokens.bg, borderColor: badgeTokens.border, color: badgeTokens.text }
    : { backgroundColor: getTint(badgeColor, 0.12), borderColor: getTint(badgeColor, 0.3), color: badgeColor };

  return (
    <div className="fixed inset-0 z-[70] flex">
      <button
        type="button"
        className="absolute inset-0"
        style={{ backgroundColor: tokens?.overlayBg ? hexToRgba(tokens.overlayBg, 0.6) : 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
        aria-label="Đóng chi tiết đơn hàng"
      />
      <div
        className="ml-auto w-full max-w-xl h-full shadow-xl flex flex-col relative"
        style={{ backgroundColor: tokens?.surface ?? '#ffffff' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: tokens?.border ?? '#e2e8f0' }}
        >
          <div className="space-y-1">
            <div className="text-xs" style={{ color: tokens?.subtitle ?? '#64748b' }}>{subtitle}</div>
            <div className="text-lg font-semibold" style={{ color: tokens?.title ?? '#0f172a' }}>{title}</div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={badgeStyle}
            >
              {statusLabel}
            </span>
            <button type="button" className="p-1 rounded hover:opacity-80" onClick={onClose}>
              <X size={18} style={{ color: tokens?.closeIcon ?? '#64748b' }} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
          <div
            className="flex items-center justify-between rounded-lg border px-4 py-3"
            style={{
              borderColor: tokens?.drawerSectionBorder ?? '#e2e8f0',
              backgroundColor: tokens?.drawerSectionBg ?? '#f8fafc',
            }}
          >
            <div className="text-xs uppercase" style={{ color: tokens?.drawerSectionTitle ?? '#64748b' }}>Tổng tiền</div>
            <div className="text-lg font-semibold" style={{ color: tokens?.drawerSectionValue ?? brandColor }}>
              {totalLabel}
            </div>
          </div>

          {showTimeline && timelineSteps.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase" style={{ color: tokens?.sectionTitle ?? '#64748b' }}>Tiến trình</div>
              <div className="flex items-center gap-2">
                {timelineSteps.map((label, index) => {
                  const active = index < safeStep;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: active ? tokens?.timelineActive ?? brandColor : tokens?.timelineInactive ?? getTint(brandColor, 0.2) }}
                      />
                      {index < timelineSteps.length - 1 && (
                        <div
                          className="h-[2px] w-8"
                          style={{ backgroundColor: active ? tokens?.timelineActive ?? brandColor : tokens?.timelineInactive ?? getTint(brandColor, 0.2) }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs" style={{ color: tokens?.timelineLabel ?? '#64748b' }}>
                Bước hiện tại: {currentStepLabel}
              </div>
            </div>
          )}

          {showItems && items && items.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase" style={{ color: tokens?.sectionTitle ?? '#64748b' }}>Mục trong đơn</div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={`${item.name}-${item.quantity}`} className="flex items-start gap-3">
                    <div
                      className="h-12 w-12 rounded-md border overflow-hidden flex items-center justify-center"
                      style={{
                        borderColor: tokens?.itemThumbBorder ?? getTint(brandColor, 0.2),
                        backgroundColor: tokens?.itemThumbBg ?? getTint(brandColor, 0.08),
                      }}
                    >
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={48} height={48} className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-xs font-semibold" style={{ color: tokens?.itemThumbText ?? brandColor }}>IMG</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: tokens?.sectionText ?? '#0f172a' }}>{item.name}</div>
                      {item.variantTitle && (
                        <div className="text-xs" style={{ color: tokens?.sectionTitle ?? '#64748b' }}>{item.variantTitle}</div>
                      )}
                      <div className="text-xs" style={{ color: tokens?.sectionTitle ?? '#64748b' }}>
                        Số lượng: {item.quantity}
                      </div>
                      {item.actionHref && item.actionLabel && (
                        <Link
                          href={item.actionHref}
                          className="mt-2 inline-flex rounded-md px-3 py-1.5 text-xs font-semibold"
                          style={{ backgroundColor: tokens?.actionPrimaryBg ?? brandColor, color: tokens?.actionPrimaryText ?? '#ffffff' }}
                        >
                          {item.actionLabel}
                        </Link>
                      )}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: tokens?.sectionText ?? '#0f172a' }}>{item.priceLabel}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showDigitalCredentials && digitalItems && digitalItems.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase" style={{ color: tokens?.sectionTitle ?? '#64748b' }}>Digital credentials</div>
              <div className="space-y-4">
                {digitalItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="space-y-2">
                    <div className="text-sm font-semibold" style={{ color: tokens?.sectionText ?? '#0f172a' }}>{item.name}</div>
                    <DigitalCredentialsDisplay
                      type={item.type}
                      credentials={item.credentials}
                      brandColor={brandColor}
                      tokens={digitalTokens}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(showPaymentMethod || showShippingMethod || showTracking) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {showPaymentMethod && (
                <div>
                  <div className="text-[10px]" style={{ color: tokens?.sectionTitle ?? '#64748b' }}>Thanh toán</div>
                  <div className="text-xs font-medium" style={{ color: tokens?.sectionText ?? '#0f172a' }}>{paymentMethod}</div>
                </div>
              )}
              {showShippingMethod && (
                <div>
                  <div className="text-[10px]" style={{ color: tokens?.sectionTitle ?? '#64748b' }}>Giao hàng</div>
                  <div className="text-xs font-medium" style={{ color: tokens?.sectionText ?? '#0f172a' }}>{shippingMethod}</div>
                </div>
              )}
              {showTracking && (
                <div>
                  <div className="text-[10px]" style={{ color: tokens?.sectionTitle ?? '#64748b' }}>Tracking</div>
                  <div className="text-xs font-medium" style={{ color: tokens?.sectionText ?? '#0f172a' }}>{tracking}</div>
                </div>
              )}
            </div>
          )}

          {paymentDetails}

          {showShippingAddress && (
            <div>
              <div className="text-[10px]" style={{ color: tokens?.sectionTitle ?? '#64748b' }}>Địa chỉ</div>
              <div className="text-xs font-medium" style={{ color: tokens?.sectionText ?? '#0f172a' }}>{shippingAddress}</div>
            </div>
          )}
        </div>

        <div
          className="px-5 py-4 border-t flex flex-wrap justify-end gap-2"
          style={{ borderColor: tokens?.border ?? '#e2e8f0' }}
        >
          {onReorder && (
            <button
              type="button"
              onClick={onReorder}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: tokens?.actionPrimaryBg ?? brandColor, color: tokens?.actionPrimaryText ?? '#ffffff' }}
            >
              Mua lại
            </button>
          )}
          {allowCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: tokens?.actionPrimaryBg ?? brandColor, color: tokens?.actionPrimaryText ?? '#ffffff' }}
            >
              Hủy đơn
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold border"
            style={{
              borderColor: tokens?.actionSecondaryBorder ?? getTint(brandColor, 0.3),
              color: tokens?.actionSecondaryText ?? brandColor,
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
