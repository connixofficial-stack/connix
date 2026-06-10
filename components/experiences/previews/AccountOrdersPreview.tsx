'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CheckCircle2, Clock, DollarSign, Package, ShoppingBag } from 'lucide-react';
import { StatusFilterDropdown } from '@/components/orders/StatusFilterDropdown';
import { OrderDetailDrawer } from '@/components/orders/OrderDetailDrawer';
import { toast } from 'sonner';
import {
  getAccountOrdersColors,
  getAccountOrdersStatusBadgeTokens,
  type AccountOrdersColorMode,
  type AccountOrdersColors,
} from '@/components/site/account/orders/colors';

type AccountOrdersPreviewProps = {
  layoutStyle: 'cards' | 'compact' | 'timeline';
  showStats: boolean;
  showOrderItems: boolean;
  showPaymentMethod: boolean;
  showShippingMethod: boolean;
  showShippingAddress: boolean;
  showTracking: boolean;
  showTimeline: boolean;
  paginationType: 'pagination' | 'infiniteScroll';
  ordersPerPage: number;
  defaultStatusFilter: string[];
  orderStatuses: Array<{ key: string; label: string; color: string; step: number; isFinal: boolean; allowCancel: boolean }>;
  stockEnabled: boolean;
  brandColor: string;
  secondaryColor: string;
  colorMode: AccountOrdersColorMode;
  device: 'desktop' | 'tablet' | 'mobile';
};

const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(value);

const TIMELINE_STEPS = ['Đặt hàng', 'Xác nhận', 'Vận chuyển', 'Hoàn thành'];

const MOCK_ORDERS = [
  {
    id: 'ORD-20260207-1234',
    date: '07/02/2026',
    total: 640000,
    itemsCount: 2,
    statusIndex: 0,
    paymentMethod: 'COD',
    shippingMethod: 'Giao hàng tiêu chuẩn',
    shippingAddress: 'Nguyễn Văn A | 0909 000 000 | Q1, HCM',
    trackingCode: 'Chưa có',
    items: [
      { name: 'Áo thun VietAdmin', quantity: 1, price: 320000, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', inStock: true },
      { name: 'Nón VietAdmin', quantity: 1, price: 320000, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=201', inStock: false },
    ],
  },
  {
    id: 'ORD-20260206-7751',
    date: '06/02/2026',
    total: 980000,
    itemsCount: 3,
    statusIndex: 1,
    paymentMethod: 'Ví điện tử',
    shippingMethod: 'Giao hàng nhanh',
    shippingAddress: 'Nguyễn Văn A | 0909 000 000 | Q1, HCM',
    trackingCode: 'Đang cập nhật',
    items: [
      { name: 'Bình giữ nhiệt VietAdmin', quantity: 1, price: 240000, image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=200', inStock: true },
      { name: 'Sổ tay VietAdmin', quantity: 2, price: 370000, image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=200', inStock: true },
    ],
  },
  {
    id: 'ORD-20260206-9912',
    date: '06/02/2026',
    total: 420000,
    itemsCount: 1,
    statusIndex: 2,
    paymentMethod: 'Chuyển khoản',
    shippingMethod: 'Giao nhanh 2h',
    shippingAddress: 'Nguyễn Văn A | 0909 000 000 | Q1, HCM',
    trackingCode: 'GHTK-302291',
    items: [
      { name: 'Áo khoác VietAdmin', quantity: 1, price: 420000, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200', inStock: true },
    ],
  },
  {
    id: 'ORD-20260205-4567',
    date: '05/02/2026',
    total: 320000,
    itemsCount: 1,
    statusIndex: 3,
    paymentMethod: 'Chuyển khoản',
    shippingMethod: 'Giao nhanh 2h',
    shippingAddress: 'Nguyễn Văn A | 0909 000 000 | Q1, HCM',
    trackingCode: 'GHTK-456789',
    items: [{ name: 'Áo khoác VietAdmin', quantity: 1, price: 320000, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200', inStock: false }],
  },
  {
    id: 'ORD-20260204-1122',
    date: '04/02/2026',
    total: 890000,
    itemsCount: 3,
    statusIndex: 1,
    paymentMethod: 'COD',
    shippingMethod: 'Giao tiêu chuẩn',
    shippingAddress: 'Nguyễn Văn A | 0909 000 000 | Q1, HCM',
    trackingCode: 'Đang xử lý',
    items: [
      { name: 'Áo hoodie VietAdmin', quantity: 1, price: 420000, image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200', inStock: true },
      { name: 'Áo thun VietAdmin', quantity: 1, price: 240000, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', inStock: true },
      { name: 'Mũ lưỡi trai VietAdmin', quantity: 1, price: 230000, image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=200', inStock: false },
    ],
  },
  {
    id: 'ORD-20260203-3405',
    date: '03/02/2026',
    total: 520000,
    itemsCount: 2,
    statusIndex: 2,
    paymentMethod: 'Ví điện tử',
    shippingMethod: 'Giao hàng nhanh',
    shippingAddress: 'Nguyễn Văn A | 0909 000 000 | Q1, HCM',
    trackingCode: 'GHN-884122',
    items: [
      { name: 'Balo VietAdmin', quantity: 1, price: 320000, image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200', inStock: true },
      { name: 'Sổ tay VietAdmin', quantity: 1, price: 200000, image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=200', inStock: true },
    ],
  },
  {
    id: 'ORD-20260202-5510',
    date: '02/02/2026',
    total: 280000,
    itemsCount: 1,
    statusIndex: 4,
    paymentMethod: 'COD',
    shippingMethod: 'Giao tiêu chuẩn',
    shippingAddress: 'Nguyễn Văn A | 0909 000 000 | Q1, HCM',
    trackingCode: 'Đã hủy',
    items: [
      { name: 'Áo thun VietAdmin', quantity: 1, price: 280000, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', inStock: true },
    ],
  },
  {
    id: 'ORD-20260201-7844',
    date: '01/02/2026',
    total: 720000,
    itemsCount: 2,
    statusIndex: 3,
    paymentMethod: 'Chuyển khoản',
    shippingMethod: 'Giao hàng nhanh',
    shippingAddress: 'Nguyễn Văn A | 0909 000 000 | Q1, HCM',
    trackingCode: 'GHTK-554499',
    items: [
      { name: 'Áo sơ mi VietAdmin', quantity: 1, price: 360000, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', inStock: true },
      { name: 'Áo polo VietAdmin', quantity: 1, price: 360000, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200', inStock: true },
    ],
  },
];

type Order = (typeof MOCK_ORDERS)[number] & { status: string };

function StatusBadge({
  status,
  statusConfig,
  tokens,
}: {
  status: string;
  statusConfig?: { label: string; color: string };
  tokens: AccountOrdersColors;
}) {
  const statusColor = statusConfig?.color ?? tokens.primary;
  const badgeTokens = getAccountOrdersStatusBadgeTokens(statusColor, tokens.primary);
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full border"
      style={{
        backgroundColor: badgeTokens.bg,
        color: badgeTokens.text,
        borderColor: badgeTokens.border,
      }}
    >
      {statusConfig?.label ?? status}
    </span>
  );
}

function OrderItems({ items, tokens }: { items: Order['items']; tokens: AccountOrdersColors }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-3 text-xs" style={{ color: tokens.bodyText }}>
          <div
            className="h-8 w-8 rounded-md border overflow-hidden flex items-center justify-center"
            style={{ borderColor: tokens.orderItemThumbBorder, backgroundColor: tokens.orderItemThumbBg }}
          >
            {item.image ? (
              <Image src={item.image} alt={item.name} width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              <Package size={12} style={{ color: tokens.orderItemThumbIcon }} />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium" style={{ color: tokens.orderValueText }}>{item.name}</div>
            <div className="text-[10px]" style={{ color: tokens.orderMetaText }}>Số lượng: {item.quantity}</div>
          </div>
          <span className="font-medium" style={{ color: tokens.priceText }}>{formatPrice(item.price)}</span>
        </div>
      ))}
    </div>
  );
}

function OrderMeta({ label, value, tokens }: { label: string; value: string; tokens: AccountOrdersColors }) {
  return (
    <div>
      <div className="text-[10px]" style={{ color: tokens.orderMetaText }}>{label}</div>
      <div className="text-xs font-medium" style={{ color: tokens.orderValueText }}>{value}</div>
    </div>
  );
}

function Stepper({ step, tokens }: { step: number; tokens: AccountOrdersColors }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {TIMELINE_STEPS.map((label, index) => {
          const active = index < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active ? tokens.timelineActive : tokens.timelineInactive }}
              />
              {index < TIMELINE_STEPS.length - 1 && (
                <div
                  className="h-[2px] w-8"
                  style={{ backgroundColor: active ? tokens.timelineActive : tokens.timelineInactive }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xs" style={{ color: tokens.orderMetaText }}>
        Bước hiện tại: {TIMELINE_STEPS[step - 1] ?? TIMELINE_STEPS[0]}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
  tokens,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
  tokens: AccountOrdersColors;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={highlight
        ? { backgroundColor: tokens.statHighlightBg, borderColor: tokens.statHighlightBg }
        : { backgroundColor: tokens.statCardBg, borderColor: tokens.statCardBorder }
      }
    >
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-[10px]"
            style={{ color: highlight ? tokens.statHighlightSubText : tokens.orderMetaText }}
          >
            {label}
          </div>
          <div
            className="text-sm font-semibold"
            style={{ color: highlight ? tokens.statHighlightText : tokens.orderValueText }}
          >
            {value}
          </div>
        </div>
        <div
          className="p-1.5 rounded-lg"
          style={{
            backgroundColor: highlight ? tokens.statHighlightIconBg : tokens.statIconBg,
            color: highlight ? tokens.statHighlightIconColor : tokens.statIconColor,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function AccountOrdersPreview({
  layoutStyle,
  showStats,
  showOrderItems,
  showPaymentMethod,
  showShippingMethod,
  showShippingAddress,
  showTracking,
  showTimeline,
  paginationType,
  ordersPerPage,
  defaultStatusFilter,
  orderStatuses,
  stockEnabled,
  brandColor,
  secondaryColor,
  colorMode,
  device,
}: AccountOrdersPreviewProps) {
  const router = useRouter();
  const isMobile = device === 'mobile';
  const tokens = useMemo(
    () => getAccountOrdersColors(brandColor, secondaryColor, colorMode),
    [brandColor, secondaryColor, colorMode]
  );
  const statusKeys = useMemo(() => orderStatuses.map((status) => status.key), [orderStatuses]);
  const statusMap = useMemo(() => new Map(orderStatuses.map((status) => [status.key, status])), [orderStatuses]);
  const normalizedDefaultStatuses = useMemo(
    () => defaultStatusFilter.filter((status) => statusKeys.includes(status)),
    [defaultStatusFilter, statusKeys]
  );
  const mockOrders = useMemo(() => {
    if (statusKeys.length === 0) {
      return MOCK_ORDERS.map((order) => ({ ...order, status: 'Pending' }));
    }
    return MOCK_ORDERS.map((order) => ({
      ...order,
      status: statusKeys[order.statusIndex % statusKeys.length],
    }));
  }, [statusKeys]);
  const timelineLabels = useMemo(
    () => [...orderStatuses].sort((a, b) => a.step - b.step).map((status) => status.label),
    [orderStatuses]
  );
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOrder, setDrawerOrder] = useState<(typeof mockOrders)[number] | null>(null);
  const activeStatuses = selectedStatuses.length > 0
    ? selectedStatuses
    : (normalizedDefaultStatuses.length > 0 ? normalizedDefaultStatuses : statusKeys);
  const isAllActive = activeStatuses.length === statusKeys.length;
  const toggleStatus = (status: string) => {
    setCurrentPage(1);
    setSelectedStatuses((prev) => {
      const base = prev.length > 0 ? prev : (normalizedDefaultStatuses.length > 0 ? normalizedDefaultStatuses : statusKeys);
      return base.includes(status) ? base.filter((item) => item !== status) : [...base, status];
    });
  };

  const filteredOrders = useMemo(() => {
    if (activeStatuses.length === statusKeys.length) {
      return mockOrders;
    }
    return mockOrders.filter((order) => activeStatuses.includes(order.status));
  }, [activeStatuses, mockOrders, statusKeys]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ordersPerPage;
  const pageEnd = pageStart + ordersPerPage;
  const displayStart = filteredOrders.length === 0 ? 0 : pageStart + 1;
  const displayEnd = Math.min(pageEnd, filteredOrders.length);
  const visibleOrders = paginationType === 'pagination'
    ? filteredOrders.slice(pageStart, pageEnd)
    : filteredOrders.slice(0, ordersPerPage);

  const handleReorder = (order: Order) => {
    const outOfStockItems = stockEnabled ? order.items.filter(item => !item.inStock) : [];
    const availableItems = stockEnabled ? order.items.filter(item => item.inStock) : order.items;

    if (availableItems.length > 0) {
      toast.success(`Đã thêm ${availableItems.length} sản phẩm vào giỏ hàng`);
      router.push('/cart');
    }

    if (stockEnabled && outOfStockItems.length > 0) {
      const outOfStockNames = outOfStockItems.map(item => item.name).join(', ');
      toast.error(`Sản phẩm đã hết hàng: ${outOfStockNames}`);
    }

    if (availableItems.length === 0) {
      toast.error('Tất cả sản phẩm trong đơn đã hết hàng');
    }
  };

  const drawerStatus = drawerOrder ? statusMap.get(drawerOrder.status) : undefined;
  const drawerItems = drawerOrder?.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    priceLabel: formatPrice(item.price * item.quantity),
    image: item.image,
  }));
  const drawerBadgeTokens = drawerStatus
    ? getAccountOrdersStatusBadgeTokens(drawerStatus.color ?? tokens.primary, tokens.primary)
    : undefined;

  const filterColors = {
    buttonBorder: tokens.filterButtonBorder,
    buttonText: tokens.filterButtonText,
    buttonActiveBg: tokens.filterButtonActiveBg,
    buttonActiveBorder: tokens.filterButtonActiveBorder,
    buttonActiveText: tokens.filterButtonActiveText,
    panelBg: tokens.filterDropdownBg,
    panelBorder: tokens.filterDropdownBorder,
    panelText: tokens.filterDropdownText,
    panelMutedText: tokens.filterDropdownMutedText,
    divider: tokens.border,
  };

  const rowHoverStyle = { '--row-hover': tokens.tableRowHoverBg } as React.CSSProperties;

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: tokens.pageBackground }}>
      <div>
        <h3 className="text-lg font-semibold" style={{ color: tokens.headingColor }}>Đơn hàng của tôi</h3>
        <p className="text-xs" style={{ color: tokens.metaText }}>Preview account orders</p>
      </div>

      <StatusFilterDropdown
        options={orderStatuses.map((status) => ({ key: status.key, label: status.label }))}
        activeKeys={activeStatuses}
        isAllActive={isAllActive}
        onToggleKey={toggleStatus}
        onToggleAll={() => {
          setSelectedStatuses(isAllActive ? [] : statusKeys);
          setCurrentPage(1);
        }}
        brandColor={brandColor}
        colors={filterColors}
      />

      {showStats && (
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <StatCard
            label="Tổng chi tiêu"
            value={formatPrice(1280000)}
            icon={<DollarSign size={14} />}
            highlight
            tokens={tokens}
          />
          <StatCard label="Đang xử lý" value="6" icon={<Clock size={14} />} tokens={tokens} />
          <StatCard label="Đã giao" value="6" icon={<CheckCircle2 size={14} />} tokens={tokens} />
          <StatCard label="Sản phẩm" value="6" icon={<ShoppingBag size={14} />} tokens={tokens} />
        </div>
      )}

      {layoutStyle === 'cards' && (
        <div className="space-y-3">
          {visibleOrders.map((order, index) => {
            const expanded = index === 0;
            return (
              <div
                key={order.id}
                className="rounded-2xl border p-4 space-y-3"
                style={{ backgroundColor: tokens.orderCardBg, borderColor: tokens.orderCardBorder }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs" style={{ color: tokens.orderMetaText }}>Mã đơn hàng · {order.date}</div>
                    <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{order.id}</div>
                  </div>
                  <StatusBadge status={order.status} statusConfig={statusMap.get(order.status)} tokens={tokens} />
                </div>
                <div className="text-xs" style={{ color: tokens.orderMetaText }}>
                  {order.itemsCount} sản phẩm · {formatPrice(order.total)}
                </div>
                <div className="border-t pt-3 flex items-center justify-between text-xs" style={{ borderColor: tokens.orderCardDivider }}>
                  <span style={{ color: tokens.orderMetaText }}>Tổng thanh toán</span>
                  <span className="font-semibold" style={{ color: tokens.orderValueText }}>{formatPrice(order.total)}</span>
                </div>
                {expanded && (
                  <div
                    className="border-t pt-3 space-y-3"
                    style={{ borderColor: tokens.orderExpandedBorder, backgroundColor: tokens.orderExpandedBg }}
                  >
                    {showOrderItems && (
                      <div>
                        <div className="text-[10px] mb-2" style={{ color: tokens.orderMetaText }}>Sản phẩm</div>
                        <OrderItems items={order.items} tokens={tokens} />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {showPaymentMethod && <OrderMeta label="Thanh toán" value={order.paymentMethod} tokens={tokens} />}
                      {showShippingMethod && <OrderMeta label="Giao hàng" value={order.shippingMethod} tokens={tokens} />}
                      {showTracking && <OrderMeta label="Tracking" value={order.trackingCode} tokens={tokens} />}
                    </div>
                    {showShippingAddress && <OrderMeta label="Địa chỉ" value={order.shippingAddress} tokens={tokens} />}
                    {showTimeline && (
                      <Stepper step={statusMap.get(order.status)?.step ?? 1} tokens={tokens} />
                    )}
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold"
                        style={{ backgroundColor: tokens.secondaryButtonBg, color: tokens.secondaryButtonText }}
                      >
                        Mua lại
                      </button>
                      {statusMap.get(order.status)?.allowCancel && (
                        <button
                          type="button"
                          onClick={() => {}}
                          className="px-3 py-2 rounded-lg text-xs font-semibold"
                          style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {visibleOrders.length === 0 && (
            <div
              className="border border-dashed rounded-2xl p-6 text-center text-sm"
              style={{ backgroundColor: tokens.emptyStateBg, borderColor: tokens.border, color: tokens.emptyStateText }}
            >
              Không có đơn hàng phù hợp.
            </div>
          )}
        </div>
      )}

      {layoutStyle === 'compact' && (
        <div className="space-y-3">
          {!isMobile ? (
            <div className="overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg" style={{ backgroundColor: tokens.surface }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: tokens.tableHeaderBg, color: tokens.tableHeaderText }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Mã đơn</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Ngày</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Số SP</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Tổng</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Trạng thái</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t transition-colors hover:bg-[var(--row-hover)]"
                      style={{ borderColor: tokens.orderCardDivider, ...rowHoverStyle }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: tokens.orderValueText }}>{order.id}</td>
                      <td className="px-4 py-3" style={{ color: tokens.orderMetaText }}>{order.date}</td>
                      <td className="px-4 py-3" style={{ color: tokens.bodyText }}>{order.itemsCount}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: tokens.orderValueText }}>{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} statusConfig={statusMap.get(order.status)} tokens={tokens} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDrawerOrder(order)}
                          className="inline-flex items-center gap-1 text-xs font-semibold"
                          style={{ color: tokens.secondary }}
                        >
                          Chi tiết <ArrowUpRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                className="flex items-center justify-between border-t px-4 py-3"
                style={{ borderColor: tokens.orderCardDivider, backgroundColor: tokens.surface }}
              >
                <p className="text-sm" style={{ color: tokens.paginationSummaryText }}>
                  Hiển thị <span className="font-medium" style={{ color: tokens.paginationSummaryStrong }}>{displayStart}</span> đến{' '}
                  <span className="font-medium" style={{ color: tokens.paginationSummaryStrong }}>{displayEnd}</span> trong số{' '}
                  <span className="font-medium" style={{ color: tokens.paginationSummaryStrong }}>{filteredOrders.length}</span> kết quả
                </p>
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold border rounded-md"
                    style={{ borderColor: tokens.paginationButtonBorder, color: tokens.paginationButtonText }}
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md"
                    style={{ backgroundColor: tokens.paginationActiveBg, color: tokens.paginationActiveText }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-xl p-3"
                  style={{ backgroundColor: tokens.orderCardBg, borderColor: tokens.orderCardBorder }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs" style={{ color: tokens.orderMetaText }}>{order.id} · {order.date}</div>
                      <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{formatPrice(order.total)}</div>
                    </div>
                    <StatusBadge status={order.status} statusConfig={statusMap.get(order.status)} tokens={tokens} />
                  </div>
                  <div className="mt-2 text-xs" style={{ color: tokens.orderMetaText }}>{order.itemsCount} sản phẩm</div>
                  <div className="mt-2 flex items-center justify-between text-xs" style={{ color: tokens.orderMetaText }}>
                    <button
                      type="button"
                      onClick={() => setDrawerOrder(order)}
                      className="font-semibold"
                        style={{ color: tokens.secondary }}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {layoutStyle === 'timeline' && (
        <div className="space-y-6">
          {visibleOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-2xl overflow-hidden shadow-sm"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.orderCardBorder }}
            >
              <div
                className="px-6 py-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                style={{ borderColor: tokens.orderCardDivider, backgroundColor: tokens.surfaceMuted }}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide" style={{ color: tokens.orderMetaText }}>Ngày đặt</div>
                    <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{order.date}</div>
                  </div>
                  <div className="hidden md:block h-8 w-px" style={{ backgroundColor: tokens.border }} />
                  <div>
                    <div className="text-xs uppercase tracking-wide" style={{ color: tokens.orderMetaText }}>Mã đơn</div>
                    <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{order.id}</div>
                  </div>
                </div>
                <StatusBadge status={order.status} statusConfig={statusMap.get(order.status)} tokens={tokens} />
              </div>

              <div className="p-6 space-y-6">
                {showTimeline && (
                  <Stepper step={statusMap.get(order.status)?.step ?? 1} tokens={tokens} />
                )}
                {(showPaymentMethod || showShippingMethod || showShippingAddress) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {showPaymentMethod && <OrderMeta label="Thanh toán" value={order.paymentMethod} tokens={tokens} />}
                    {showShippingMethod && <OrderMeta label="Giao hàng" value={order.shippingMethod} tokens={tokens} />}
                    {showShippingAddress && <OrderMeta label="Địa chỉ" value={order.shippingAddress} tokens={tokens} />}
                  </div>
                )}
                {showOrderItems && <OrderItems items={order.items} tokens={tokens} />}
              </div>

              <div
                className="px-6 py-4 border-t flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.orderCardDivider }}
              >
                {showTracking && (
                  <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: tokens.orderMetaText }}>
                    <span className="font-medium" style={{ color: tokens.orderMetaText }}>Tracking:</span>
                    <span
                      className="px-2 py-0.5 rounded border text-xs font-normal"
                      style={{
                        borderColor: tokens.trackingBadgeBorder,
                        color: tokens.trackingBadgeText,
                        backgroundColor: tokens.trackingBadgeBg,
                      }}
                    >
                      {order.trackingCode}
                    </span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: tokens.orderMetaText }}>Tổng tiền</span>
                    <span className="text-xl font-bold" style={{ color: tokens.priceText }}>
                      {formatPrice(order.total)}
                    </span>
                  </div>
                  {statusMap.get(order.status)?.allowCancel ? (
                    <button
                      type="button"
                      onClick={() => {}}
                      className="px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                    >
                      Hủy đơn hàng
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold border"
                      style={{ borderColor: tokens.secondaryButtonBorder, color: tokens.secondaryButtonText, backgroundColor: tokens.surface }}
                    >
                      Mua lại
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {layoutStyle !== 'cards' && visibleOrders.length === 0 && (
        <div
          className="border border-dashed rounded-2xl p-6 text-center text-sm"
          style={{ backgroundColor: tokens.emptyStateBg, borderColor: tokens.border, color: tokens.emptyStateText }}
        >
          Không có đơn hàng phù hợp.
        </div>
      )}

      {filteredOrders.length > 0 && (
        <div className="pt-2">
          {paginationType === 'pagination' ? (
            <div className="flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1.5 rounded-lg font-semibold border disabled:opacity-50"
                style={{ borderColor: tokens.paginationButtonBorder, color: tokens.paginationButtonText }}
              >
                Trước
              </button>
              <div style={{ color: tokens.paginationSummaryText }}>
                Trang <span className="font-semibold" style={{ color: tokens.paginationSummaryStrong }}>{safeCurrentPage}</span> / {totalPages}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 rounded-lg font-semibold border disabled:opacity-50"
                style={{ borderColor: tokens.paginationButtonBorder, color: tokens.paginationButtonText }}
              >
                Sau
              </button>
            </div>
          ) : (
            <div className="text-center mt-2 space-y-2">
              <div className="flex justify-center gap-1">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotStrong }} />
                <div className="w-2 h-2 rounded-full animate-pulse delay-100" style={{ backgroundColor: tokens.loadingDotMedium }} />
                <div className="w-2 h-2 rounded-full animate-pulse delay-200" style={{ backgroundColor: tokens.loadingDotSoft }} />
              </div>
              <p className="text-xs" style={{ color: tokens.mutedText }}>Cuộn để xem thêm...</p>
            </div>
          )}
        </div>
      )}

      <OrderDetailDrawer
        isOpen={Boolean(drawerOrder)}
        onClose={() => setDrawerOrder(null)}
        brandColor={brandColor}
        tokens={{
          overlayBg: tokens.drawerOverlayBg,
          surface: tokens.drawerSurface,
          border: tokens.drawerBorder,
          title: tokens.drawerTitle,
          subtitle: tokens.drawerSubtitle,
          badgeBg: tokens.drawerBadgeBg,
          badgeBorder: tokens.drawerBadgeBorder,
          badgeText: tokens.drawerBadgeText,
          totalLabel: tokens.drawerSectionTitle,
          totalValue: tokens.drawerSectionValue,
          timelineActive: tokens.timelineActive,
          timelineInactive: tokens.timelineInactive,
          timelineLabel: tokens.orderMetaText,
          sectionTitle: tokens.drawerSectionTitle,
          sectionText: tokens.orderValueText,
          itemThumbBg: tokens.orderItemThumbBg,
          itemThumbBorder: tokens.orderItemThumbBorder,
          itemThumbText: tokens.orderItemThumbIcon,
          actionPrimaryBg: tokens.primaryButtonBg,
          actionPrimaryText: tokens.primaryButtonText,
          actionSecondaryBorder: tokens.secondaryButtonBorder,
          actionSecondaryText: tokens.secondaryButtonText,
          closeIcon: tokens.drawerCloseIcon,
          drawerSectionBg: tokens.drawerSectionBg,
          drawerSectionBorder: tokens.drawerSectionBorder,
          drawerSectionTitle: tokens.drawerSectionTitle,
          drawerSectionValue: tokens.drawerSectionValue,
        }}
        badgeTokens={drawerBadgeTokens}
        digitalTokens={{
          cardBg: tokens.digitalCardBg,
          cardBorder: tokens.digitalCardBorder,
          title: tokens.digitalCardTitle,
          fieldBg: tokens.digitalFieldBg,
          fieldBorder: tokens.digitalFieldBorder,
          fieldText: tokens.digitalFieldText,
          fieldIcon: tokens.digitalFieldIcon,
          actionBg: tokens.digitalActionBg,
          actionText: tokens.digitalActionText,
          alertText: tokens.digitalAlertText,
        }}
        title={drawerOrder?.id ?? ''}
        subtitle={drawerOrder?.date}
        statusLabel={drawerStatus?.label ?? drawerOrder?.status ?? ''}
        statusColor={drawerStatus?.color}
        totalLabel={drawerOrder ? formatPrice(drawerOrder.total) : ''}
        items={drawerItems}
        showItems={showOrderItems}
        showTimeline={showTimeline}
        timelineStep={drawerStatus?.step ?? 1}
        timelineLabels={timelineLabels}
        showPaymentMethod={showPaymentMethod}
        paymentMethod={drawerOrder?.paymentMethod ?? 'Đang cập nhật'}
        showShippingMethod={showShippingMethod}
        shippingMethod={drawerOrder?.shippingMethod ?? 'Đang cập nhật'}
        showTracking={showTracking}
        tracking={drawerOrder?.trackingCode ?? 'Đang cập nhật'}
        showShippingAddress={showShippingAddress}
        shippingAddress={drawerOrder?.shippingAddress ?? 'Đang cập nhật'}
        allowCancel={drawerStatus?.allowCancel}
        onCancel={drawerOrder ? () => {} : undefined}
        onReorder={drawerOrder ? () => handleReorder(drawerOrder) : undefined}
      />
    </div>
  );
}
