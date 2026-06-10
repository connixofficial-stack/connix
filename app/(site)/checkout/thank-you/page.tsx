'use client';

import React, { Suspense, useMemo } from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { getCheckoutColors } from '@/components/site/checkout/colors';
import type { Id } from '@/convex/_generated/dataModel';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { buildAbsoluteWebUrl, buildPublicOrderLookupPath } from '@/lib/orders/links';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(value);

const getStringSetting = (map: Record<string, unknown>, key: string, fallback: string) => {
  const v = map[key];
  if (typeof v === 'string') return v;
  return fallback;
};

function ThankYouContent() {
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const tokens = useMemo(
    () => getCheckoutColors(brandColors.primary, brandColors.secondary, brandColors.mode, isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );

  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');

  const order = useQuery(
    api.orders.getById,
    orderId ? { id: orderId as Id<'orders'> } : 'skip'
  );

  const { isAuthenticated } = useCustomerAuth();
  const claimState = useQuery(
    api.auth.getCustomerClaimStateByOrder,
    orderId ? { orderId: orderId as Id<'orders'> } : 'skip'
  );

  const showClaimBanner = !isAuthenticated && claimState && claimState.canClaimAccount;

  const ordersSettings = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'orders' });

  const settingsMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    (ordersSettings ?? []).forEach((setting) => {
      map[setting.settingKey] = setting.value;
    });
    return map;
  }, [ordersSettings]);

  const bankInfo = useMemo(() => ({
    bankName: getStringSetting(settingsMap, 'bankName', 'Vietcombank'),
    bankCode: getStringSetting(settingsMap, 'bankCode', 'VCB'),
    accountName: getStringSetting(settingsMap, 'bankAccountName', 'CÔNG TY VIETADMIN'),
    accountNumber: getStringSetting(settingsMap, 'bankAccountNumber', '0123456789'),
    vietQrTemplate: getStringSetting(settingsMap, 'vietQrTemplate', 'compact'),
  }), [settingsMap]);

  const isQrPayment =
    order?.paymentMethod === 'VietQR' || order?.paymentMethod === 'BankTransfer';

  const transferContent = `DH ${order?.orderNumber ?? orderNumber ?? ''}`;

  const vietQrUrl = useMemo(() => {
    if (!isQrPayment || !order) return null;
    const { bankCode, accountNumber, vietQrTemplate, accountName } = bankInfo;
    return (
      `https://img.vietqr.io/image/${bankCode}-${accountNumber}-${vietQrTemplate}.jpg` +
      `?amount=${order.totalAmount}` +
      `&addInfo=${encodeURIComponent(transferContent)}` +
      `&accountName=${encodeURIComponent(accountName)}`
    );
  }, [isQrPayment, order, bankInfo, transferContent]);

  // Error: không có orderId
  if (!orderId) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '48px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: tokens.emptyStateIconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <CheckCircle2 size={32} style={{ color: tokens.emptyStateIcon }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.heading, marginBottom: 8 }}>
          Không tìm thấy đơn hàng
        </h1>
        <p style={{ color: tokens.metaText, marginBottom: 24 }}>
          Liên kết không hợp lệ hoặc đơn hàng đã hết hạn.
        </p>
        <Link
          href="/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: tokens.primaryButtonBg,
            color: tokens.primaryButtonText,
            textDecoration: 'none',
          }}
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  // Loading
  if (order === undefined || ordersSettings === undefined) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '48px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: tokens.surfaceSoft,
            margin: '0 auto 24px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: 20,
            width: 200,
            borderRadius: 8,
            backgroundColor: tokens.surfaceSoft,
            margin: '0 auto 12px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: 14,
            width: 140,
            borderRadius: 8,
            backgroundColor: tokens.surfaceSoft,
            margin: '0 auto',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    );
  }

  const displayOrderNumber = order?.orderNumber ?? orderNumber ?? '';
  const orderLookupPath = displayOrderNumber
    ? buildPublicOrderLookupPath(displayOrderNumber)
    : '/tra-cuu-don-hang';
  const orderLookupUrl = typeof window === 'undefined'
    ? orderLookupPath
    : buildAbsoluteWebUrl(window.location.origin, orderLookupPath);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '48px 16px',
        textAlign: 'center',
      }}
    >
      {/* Header success icon */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          backgroundColor: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <CheckCircle2 size={48} style={{ color: '#16a34a' }} />
      </div>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: tokens.heading,
          marginBottom: 8,
          lineHeight: 1.2,
        }}
      >
        Đặt hàng thành công!
      </h1>

      <p style={{ color: tokens.metaText, fontSize: 14, marginBottom: 24 }}>
        Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ sớm nhất.
      </p>

      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: 16,
          padding: '16px 18px',
          marginBottom: 20,
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: tokens.heading, marginBottom: 4 }}>
              Link tra cứu đơn hàng
            </p>
            <p style={{ fontSize: 12, color: tokens.metaText, lineHeight: 1.45 }}>
              Bạn có thể lưu link này để xem trạng thái đơn hàng bất kỳ lúc nào.
            </p>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: tokens.surfaceSoft,
            borderRadius: 10,
            padding: '8px 10px',
          }}
        >
          <code
            style={{
              flex: 1,
              color: tokens.bodyText,
              fontSize: 11,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {orderLookupUrl}
          </code>
          <button
            type="button"
            aria-label="Sao chép link tra cứu đơn hàng"
            onClick={() => {
              navigator.clipboard
                .writeText(orderLookupUrl)
                .then(() => toast.success('Đã copy link tra cứu đơn hàng.'))
                .catch(() => toast.error('Không thể copy link. Vui lòng copy thủ công.'));
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              color: tokens.iconPrimary,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Claim account password setup card */}
      {showClaimBanner && claimState && (
        <div
          style={{
            backgroundColor: tokens.selectionBg || '#fffbeb',
            border: `1px solid ${tokens.selectionBorder || '#fef3c7'}`,
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 20,
            textAlign: 'left',
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.heading, marginBottom: 6 }}>
            Kích hoạt tài khoản & Theo dõi đơn hàng
          </h3>
          <p style={{ fontSize: 13, color: tokens.metaText, marginBottom: 16, lineHeight: 1.4 }}>
            Muốn theo dõi hoặc hủy đơn? Hãy kích hoạt tài khoản bằng email/SĐT vừa đặt hàng.{' '}
            {claimState.allowCancel ? (
              <strong>Đơn hiện còn có thể hủy trực tuyến sau khi bạn kích hoạt tài khoản.</strong>
            ) : (
              <strong>Đơn hiện không còn ở bước cho hủy trực tuyến; vui lòng liên hệ shop nếu cần hỗ trợ.</strong>
            )}
          </p>
          <Link
            href={`/account/login?mode=claim&identifier=${encodeURIComponent(claimState.email)}&redirectTo=${encodeURIComponent(`/account/orders?orderId=${orderId}`)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: tokens.primaryButtonBg,
              color: tokens.primaryButtonText,
              textDecoration: 'none',
            }}
          >
            Kích hoạt tài khoản để theo dõi/hủy đơn
          </Link>
        </div>
      )}

      {/* Order info card */}
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 20,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, color: tokens.metaText, fontWeight: 500 }}>
            Mã đơn hàng
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: tokens.heading,
              letterSpacing: '0.01em',
            }}
          >
            #{displayOrderNumber}
          </span>
        </div>

        {order && (
          <>
            <div
              style={{
                width: '100%',
                height: 1,
                backgroundColor: tokens.border,
                marginBottom: 12,
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, color: tokens.metaText, fontWeight: 500 }}>
                Tổng thanh toán
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: tokens.summaryTotalValue,
                }}
              >
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* VietQR / BankTransfer section */}
      {isQrPayment && vietQrUrl && (
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: tokens.heading,
              marginBottom: 16,
            }}
          >
            Quét mã QR để thanh toán
          </p>

          {/* QR image */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: `1px solid ${tokens.border}`,
                width: 220,
                height: 220,
                position: 'relative',
                backgroundColor: tokens.surfaceSoft,
              }}
            >
              <Image
                src={vietQrUrl}
                alt="VietQR thanh toán"
                width={220}
                height={220}
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Bank info */}
          <div
            style={{
              backgroundColor: tokens.surfaceSoft,
              borderRadius: 10,
              padding: '12px 16px',
              textAlign: 'left',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            <InfoRow label="Ngân hàng" value={bankInfo.bankName} tokens={tokens} />
            <InfoRow label="Số tài khoản" value={bankInfo.accountNumber} tokens={tokens} />
            <InfoRow label="Chủ tài khoản" value={bankInfo.accountName} tokens={tokens} />
          </div>

          {/* Transfer content - copyable highlight */}
          <div
            style={{
              backgroundColor: tokens.selectionBg,
              border: `1px solid ${tokens.selectionBorder}`,
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 11, color: tokens.metaText, marginBottom: 2, fontWeight: 500 }}>
                Nội dung chuyển khoản
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: tokens.heading,
                  letterSpacing: '0.02em',
                }}
              >
                {transferContent}
              </p>
            </div>
            <button
              type="button"
              aria-label="Sao chép nội dung chuyển khoản"
              onClick={() => {
                navigator.clipboard
                  .writeText(transferContent)
                  .then(() => toast.success('Đã copy nội dung chuyển khoản.'))
                  .catch(() => toast.error('Không thể copy. Vui lòng copy thủ công.'));
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                color: tokens.iconPrimary,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Action links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link
          href={orderLookupPath}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            padding: '11px 24px',
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: tokens.primaryButtonBg,
            color: tokens.primaryButtonText,
            textDecoration: 'none',
          }}
        >
          Tra cứu đơn hàng
        </Link>

        <Link
          href="/products"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            padding: '11px 24px',
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: tokens.secondaryButtonBg,
            color: tokens.secondaryButtonText,
            border: `1px solid ${tokens.secondaryButtonBorder}`,
            textDecoration: 'none',
          }}
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
  tokens: ReturnType<typeof getCheckoutColors>;
};

function InfoRow({ label, value, tokens }: InfoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 6,
      }}
    >
      <span style={{ color: tokens.metaText, fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ color: tokens.bodyText, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense>
      <ThankYouContent />
    </Suspense>
  );
}
