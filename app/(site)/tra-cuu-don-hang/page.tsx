'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { getCheckoutColors, type CheckoutColors } from '@/components/site/checkout/colors';
import type { Id } from '@/convex/_generated/dataModel';
import { buildAbsoluteWebUrl, buildPublicOrderLookupPath } from '@/lib/orders/links';

// ─── Utils ──────────────────────────────────────────────────────────────────

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(value);

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Status badge ────────────────────────────────────────────────────────────

type StatusColor = { bg: string; text: string; border: string };

function getStatusColors(status: string): StatusColor {
  const s = status.toLowerCase();
  if (s.includes('cancel') || s === 'cancelled') {
    return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
  }
  if (s === 'delivered' || s === 'done') {
    return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
  }
  if (s.includes('ship') || s === 'shipping') {
    return { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' };
  }
  if (s.includes('process') || s === 'processing') {
    return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
  }
  if (s === 'confirmed') {
    return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
  }
  // Pending and default
  return { bg: '#fef9c3', text: '#92400e', border: '#fde047' };
}

function getStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'pending') return 'Chờ xác nhận';
  if (s === 'confirmed') return 'Đã xác nhận';
  if (s.includes('process')) return 'Đang xử lý';
  if (s.includes('ship')) return 'Đang vận chuyển';
  if (s === 'delivered' || s === 'done') return 'Đã giao hàng';
  if (s.includes('cancel')) return 'Đã hủy';
  return status;
}

function StatusBadge({ status }: { status: string }) {
  const colors = getStatusColors(status);
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {getStatusLabel(status)}
    </span>
  );
}

// ─── Can cancel ──────────────────────────────────────────────────────────────

function canCancelOrder(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'pending' || s === 'confirmed';
}

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderDoc = {
  _id: Id<'orders'>;
  _creationTime: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  trackingNumber?: string;
  shippingAddress?: string;
  note?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  items: Array<{
    productId: Id<'products'>;
    productName: string;
    price: number;
    quantity: number;
    variantTitle?: string;
    productImage?: string;
  }>;
};

// ─── Cancel dialog ───────────────────────────────────────────────────────────

function CancelDialog({
  order,
  onClose,
  onSuccess,
  requirePhoneInput,
  tokens,
}: {
  order: OrderDoc;
  onClose: () => void;
  onSuccess: () => void;
  requirePhoneInput: boolean;
  tokens: CheckoutColors;
}) {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cancelByCustomer = useMutation(api.orders.cancelByCustomer);

  const handleConfirm = async () => {
    const phoneValue = phone.trim();
    if (requirePhoneInput && !phoneValue) {
      toast.error('Vui lòng nhập số điện thoại để xác minh.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await cancelByCustomer({
        orderId: order._id,
        phone: phoneValue,
      });
      if (!result.ok) {
        toast.error(result.error ?? 'Không thể hủy đơn hàng.');
        return;
      }
      toast.success('Đã hủy đơn hàng thành công.');
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể hủy đơn hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-sm w-full p-6 border"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <h3 className="text-lg font-bold mb-2" style={{ color: tokens.heading }}>Xác nhận hủy đơn</h3>
        <p className="text-sm mb-1" style={{ color: tokens.bodyText }}>
          Bạn có chắc muốn hủy đơn hàng{' '}
          <span className="font-semibold text-gray-800" style={{ color: tokens.heading }}>#{order.orderNumber}</span>?
        </p>
        <p className="text-xs mb-4" style={{ color: tokens.metaText }}>Thao tác này không thể hoàn tác.</p>

        {requirePhoneInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: tokens.bodyText }}>
              Số điện thoại để xác minh
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập SĐT đã đặt hàng"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ backgroundColor: tokens.inputBg, borderColor: tokens.inputBorder, color: tokens.inputText, '--tw-ring-color': tokens.primary } as React.CSSProperties}
            />
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.bodyText }}
          >
            Không hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-lg py-2 text-sm font-medium text-white transition-colors"
            style={{
              background: isSubmitting ? tokens.mutedText : '#ef4444',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Đang hủy...' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  searchedByPhone,
  onCancelled,
  tokens,
}: {
  order: OrderDoc;
  searchedByPhone: boolean;
  onCancelled: () => void;
  tokens: CheckoutColors;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const showCancelBtn = canCancelOrder(order.status);
  const orderLookupPath = buildPublicOrderLookupPath(order.orderNumber);
  const orderLookupUrl = typeof window === 'undefined'
    ? orderLookupPath
    : buildAbsoluteWebUrl(window.location.origin, orderLookupPath);

  return (
    <>
      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4 border-b"
          style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }}
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm" style={{ color: tokens.bodyText }}>#{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <span className="text-xs" style={{ color: tokens.metaText }}>{formatDate(order._creationTime)}</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Items */}
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                {item.productImage && (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border"
                    style={{ borderColor: tokens.border }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: tokens.bodyText }}>{item.productName}</p>
                  {item.variantTitle && (
                    <p className="text-xs" style={{ color: tokens.metaText }}>{item.variantTitle}</p>
                  )}
                  <p className="text-xs" style={{ color: tokens.metaText }}>
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold flex-shrink-0" style={{ color: tokens.bodyText }}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-3 space-y-1" style={{ borderColor: tokens.border }}>
            {(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: tokens.metaText }}>Giảm giá</span>
                <span className="text-green-600">-{formatPrice(order.discountAmount ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span style={{ color: tokens.metaText }}>Phí vận chuyển</span>
              <span style={{ color: tokens.bodyText }}>
                {order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span style={{ color: tokens.bodyText }}>Tổng thanh toán</span>
              <span style={{ color: tokens.priceText }}>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: tokens.surfaceMuted, color: tokens.metaText }}>
              <span className="font-medium" style={{ color: tokens.bodyText }}>Địa chỉ giao: </span>
              {order.shippingAddress}
            </div>
          )}

          {/* Tracking number */}
          {order.trackingNumber && (
            <div
              className="rounded-xl p-4 border"
              style={{
                background: tokens.selectionBg,
                borderColor: tokens.selectionBorder,
              }}
            >
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={tokens.primary}
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8 5-8-5m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0l-8-5-8 5"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1" style={{ color: tokens.bodyText }}>Mã vận đơn</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border" style={{ color: tokens.bodyText, borderColor: tokens.border }}>
                      {order.trackingNumber}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard
                          .writeText(order.trackingNumber!)
                          .then(() => toast.success('Đã copy mã vận đơn!'))
                          .catch(() => toast.error('Không thể copy. Vui lòng copy thủ công.'));
                      }}
                      className="text-xs hover:underline font-medium"
                      style={{ color: tokens.primary }}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs mt-1" style={{ color: tokens.metaText }}>
                    Copy mã này để tra cứu trên trang của đơn vị vận chuyển.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border p-3 text-xs" style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted, color: tokens.metaText }}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold" style={{ color: tokens.bodyText }}>Link tra cứu nhanh</p>
                <p className="truncate font-mono text-[11px]" style={{ color: tokens.metaText }}>{orderLookupUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    .writeText(orderLookupUrl)
                    .then(() => toast.success('Đã copy link tra cứu!'))
                    .catch(() => toast.error('Không thể copy. Vui lòng copy thủ công.'));
                }}
                className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ borderColor: tokens.border, color: tokens.bodyText, backgroundColor: tokens.surface }}
              >
                Copy link
              </button>
            </div>
          </div>

          {/* Cancel button */}
          {showCancelBtn && (
            <div className="pt-1">
              <button
                onClick={() => setShowCancel(true)}
                className="w-full sm:w-auto rounded-lg border px-4 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                style={{ borderColor: '#fca5a5', color: '#ef4444' }}
              >
                Hủy đơn hàng
              </button>
            </div>
          )}
        </div>
      </div>

      {showCancel && (
        <CancelDialog
          order={order}
          requirePhoneInput={!searchedByPhone}
          tokens={tokens}
          onClose={() => setShowCancel(false)}
          onSuccess={() => {
            setShowCancel(false);
            onCancelled();
          }}
        />
      )}
    </>
  );
}

// ─── Search modes ─────────────────────────────────────────────────────────────

type SearchMode = 'orderNumber' | 'phone';

// ─── OrderByNumber view ───────────────────────────────────────────────────────

function OrderByNumberView({
  orderNumber,
  onReset,
  tokens,
}: {
  orderNumber: string;
  onReset: () => void;
  tokens: CheckoutColors;
}) {
  const order = useQuery(api.orders.getByOrderNumber, { orderNumber });
  const [version, setVersion] = useState(0);

  if (order === undefined) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${tokens.primary} transparent ${tokens.primary} ${tokens.primary}` }}
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: tokens.surfaceSoft }}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={tokens.iconMuted} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-medium" style={{ color: tokens.bodyText }}>Không tìm thấy đơn hàng</p>
        <p className="text-sm mt-1" style={{ color: tokens.metaText }}>Mã đơn <span className="font-semibold" style={{ color: tokens.bodyText }}>{orderNumber}</span> không tồn tại.</p>
        <button
          onClick={onReset}
          className="mt-4 text-sm underline font-medium"
          style={{ color: tokens.primary }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div key={version}>
      <p className="text-sm mb-4" style={{ color: tokens.metaText }}>Tìm thấy đơn hàng:</p>
      <OrderCard
        order={order as OrderDoc}
        searchedByPhone={false}
        tokens={tokens}
        onCancelled={() => setVersion((v) => v + 1)}
      />
    </div>
  );
}

// ─── OrdersByPhone view ───────────────────────────────────────────────────────

function OrdersByPhoneView({
  phone,
  onReset,
  tokens,
}: {
  phone: string;
  onReset: () => void;
  tokens: CheckoutColors;
}) {
  const customer = useQuery(api.customers.getByPhone, { phone });
  const orders = useQuery(
    api.orders.listAllByCustomer,
    customer ? { customerId: customer._id } : 'skip'
  );
  const [version, setVersion] = useState(0);

  if (customer === undefined || (customer && orders === undefined)) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${tokens.primary} transparent ${tokens.primary} ${tokens.primary}` }}
        />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: tokens.surfaceSoft }}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={tokens.iconMuted} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-medium" style={{ color: tokens.bodyText }}>Không tìm thấy thông tin</p>
        <p className="text-sm mt-1" style={{ color: tokens.metaText }}>Số điện thoại <span className="font-semibold" style={{ color: tokens.bodyText }}>{phone}</span> chưa có đơn hàng nào.</p>
        <button
          onClick={onReset}
          className="mt-4 text-sm underline font-medium"
          style={{ color: tokens.primary }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-medium" style={{ color: tokens.bodyText }}>Không có đơn hàng nào</p>
        <p className="text-sm mt-1" style={{ color: tokens.metaText }}>Số điện thoại này chưa có đơn hàng.</p>
        <button
          onClick={onReset}
          className="mt-4 text-sm underline font-medium"
          style={{ color: tokens.primary }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div key={version}>
      <p className="text-sm mb-4" style={{ color: tokens.metaText }}>
        Tìm thấy <span className="font-semibold" style={{ color: tokens.bodyText }}>{orders.length}</span> đơn hàng cho SĐT{' '}
        <span className="font-semibold" style={{ color: tokens.bodyText }}>{phone}</span>:
      </p>
      <div className="space-y-4">
        {(orders as OrderDoc[]).map((order) => (
          <OrderCard
            key={order._id + version}
            order={order}
            searchedByPhone={true}
            tokens={tokens}
            onCancelled={() => setVersion((v) => v + 1)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main search content ──────────────────────────────────────────────────────

function TraCuuContent() {
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const tokens = useMemo(
    () => getCheckoutColors(brandColors.primary, brandColors.secondary, brandColors.mode, isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );
  
  const primary = tokens.primary;

  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('orderNumber');
  const [submitted, setSubmitted] = useState<{ mode: SearchMode; value: string } | null>(null);

  // Auto-fill from URL ?orderNumber=xxx
  useEffect(() => {
    const urlOrderNumber = searchParams.get('orderNumber');
    if (urlOrderNumber) {
      setInputValue(urlOrderNumber);
      setSearchMode('orderNumber');
      setSubmitted({ mode: 'orderNumber', value: urlOrderNumber });
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) {
      toast.error('Vui lòng nhập mã đơn hàng hoặc số điện thoại.');
      return;
    }
    setSubmitted({ mode: searchMode, value });
  };

  const handleSearchReset = () => {
    setSubmitted(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.pageBg }}>
      {/* Hero header */}
      <div
        className="py-10 px-4"
        style={{
          background: `linear-gradient(135deg, ${primary}18 0%, ${primary}06 100%)`,
          borderBottom: `1px solid ${primary}20`,
        }}
      >
        <div className="max-w-xl mx-auto text-center">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: `${primary}15` }}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={primary} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: tokens.heading }}>Tra cứu đơn hàng</h1>
          <p className="text-sm" style={{ color: tokens.metaText }}>Nhập mã đơn hàng hoặc số điện thoại để xem trạng thái đơn</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="rounded-2xl border shadow-sm p-6 mb-6"
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          {/* Mode selector */}
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ backgroundColor: tokens.surfaceMuted }}>
            {([
              { value: 'orderNumber', label: 'Mã đơn hàng' },
              { value: 'phone', label: 'Số điện thoại' },
            ] as { value: SearchMode; label: string }[]).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSearchMode(tab.value);
                  setInputValue('');
                  setSubmitted(null);
                }}
                className="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all"
                style={
                  searchMode === tab.value
                    ? { backgroundColor: tokens.surface, color: primary, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontWeight: 600 }
                    : { color: tokens.metaText, backgroundColor: 'transparent' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              type={searchMode === 'phone' ? 'tel' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={searchMode === 'orderNumber' ? 'VD: ORD-001' : 'VD: 0901234567'}
              className="flex-1 rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-shadow"
              style={{ backgroundColor: tokens.inputBg, borderColor: tokens.inputBorder, color: tokens.inputText, '--tw-ring-color': `${primary}60` } as React.CSSProperties}
              autoFocus
            />
            <button
              type="submit"
              className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
            >
              Tra cứu
            </button>
          </div>
        </form>

        {/* Results */}
        {submitted && (
          <div>
            {submitted.mode === 'orderNumber' ? (
              <OrderByNumberView
                orderNumber={submitted.value}
                tokens={tokens}
                onReset={handleSearchReset}
              />
            ) : (
              <OrdersByPhoneView
                phone={submitted.value}
                tokens={tokens}
                onReset={handleSearchReset}
              />
            )}
          </div>
        )}

        {/* Guide */}
        {!submitted && (
          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                ),
                title: 'Tra theo mã đơn',
                desc: 'Nhập mã đơn hàng (VD: ORD-001) để xem trực tiếp đơn hàng của bạn.',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ),
                title: 'Tra theo SĐT',
                desc: 'Nhập số điện thoại đã đặt hàng để xem tất cả đơn hàng của bạn.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 p-4 rounded-xl border"
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                <div
                  className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: tokens.surfaceSoft, color: tokens.primary }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: tokens.bodyText }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: tokens.metaText }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading fallback ─────────────────────────────────────────────────────────

function LoadingFallback() {
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const tokens = getCheckoutColors(brandColors.primary, brandColors.secondary, brandColors.mode, isDark);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: tokens.pageBg }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${tokens.primary} transparent ${tokens.primary} ${tokens.primary}` }} />
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function TraCuuDonHangPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TraCuuContent />
    </Suspense>
  );
}
