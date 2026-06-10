'use client';

import React, { useMemo, useState } from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { ArrowUpRight, CheckCircle2, ChevronDown, Clock, Copy, DollarSign, Package, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { StatusFilterDropdown } from '@/components/orders/StatusFilterDropdown';
import { OrderDetailDrawer } from '@/components/orders/OrderDetailDrawer';
import { DigitalCredentialsDisplay } from '@/components/orders/DigitalCredentialsDisplay';
import { useAccountOrdersConfig, useOrderStatuses } from '@/lib/experiences';
import { notifyAddToCart, useCart } from '@/lib/cart';
import {
  getAccountOrdersColors,
  getAccountOrdersStatusBadgeTokens,
} from '@/components/site/account/orders/colors';
import { convertToSlug } from '@/lib/courses/courseUtils';

const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(value);

const TIMELINE_STEPS = ['Đặt hàng', 'Xác nhận', 'Vận chuyển', 'Hoàn thành'];
const NON_SHIPPING_TIMELINE_STEPS = ['Đặt hàng', 'Xác nhận', 'Hoàn thành'];

const PAYMENT_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  BankTransfer: 'Chuyển khoản ngân hàng',
  VietQR: 'VietQR',
  CreditCard: 'Thẻ tín dụng',
  EWallet: 'Ví điện tử',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  Pending: 'Chờ thanh toán',
  Paid: 'Đã thanh toán',
  Failed: 'Thanh toán thất bại',
  Refunded: 'Đã hoàn tiền',
};

const getStringSetting = (map: Record<string, unknown>, key: string, fallback: string) => {
  const value = map[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
};

function OrderMeta({ label, value, tokens }: { label: string; value: string; tokens: ReturnType<typeof getAccountOrdersColors> }) {
  return (
    <div>
      <div className="text-[10px]" style={{ color: tokens.orderMetaText }}>{label}</div>
      <div className="text-xs font-medium" style={{ color: tokens.orderValueText }}>{value}</div>
    </div>
  );
}

function PaymentReminder({
  orderNumber,
  paymentMethod,
  paymentStatus,
  totalAmount,
  bankInfo,
  tokens,
}: {
  orderNumber: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount: number;
  bankInfo: {
    bankName: string;
    bankCode: string;
    accountName: string;
    accountNumber: string;
    vietQrTemplate: string;
  };
  tokens: ReturnType<typeof getAccountOrdersColors>;
}) {
  if (!paymentMethod || paymentMethod === 'COD') {
    return null;
  }

  const isBankPayment = paymentMethod === 'BankTransfer' || paymentMethod === 'VietQR';
  const transferContent = `DH ${orderNumber}`;
  const vietQrUrl = isBankPayment && bankInfo.bankCode && bankInfo.accountNumber
    ? `https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNumber}-${bankInfo.vietQrTemplate}.jpg` +
      `?amount=${totalAmount}` +
      `&addInfo=${encodeURIComponent(transferContent)}` +
      `&accountName=${encodeURIComponent(bankInfo.accountName)}`
    : null;

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã copy ${label}.`);
    } catch {
      toast.error('Không thể copy. Vui lòng copy thủ công.');
    }
  };

  return (
    <div
      className="rounded-xl border p-3 space-y-3"
      style={{ backgroundColor: tokens.surface, borderColor: tokens.orderExpandedBorder }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide" style={{ color: tokens.orderMetaText }}>Thông tin thanh toán</div>
          <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>
            {PAYMENT_LABELS[paymentMethod] ?? paymentMethod}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px]" style={{ color: tokens.orderMetaText }}>Trạng thái</div>
          <div className="text-xs font-semibold" style={{ color: tokens.orderValueText }}>
            {PAYMENT_STATUS_LABELS[paymentStatus ?? ''] ?? paymentStatus ?? 'Đang cập nhật'}
          </div>
        </div>
      </div>

      {isBankPayment ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_1fr]">
          {vietQrUrl && (
            <div className="flex justify-center md:justify-start">
              <div
                className="h-[132px] w-[132px] overflow-hidden rounded-xl border bg-white p-2"
                style={{ borderColor: tokens.orderExpandedBorder }}
              >
                <Image
                  src={vietQrUrl}
                  alt="QR thanh toán"
                  width={116}
                  height={116}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <OrderMeta label="Ngân hàng" value={bankInfo.bankName} tokens={tokens} />
            <div className="rounded-lg border px-3 py-2 flex items-center justify-between gap-2" style={{ borderColor: tokens.orderExpandedBorder, backgroundColor: tokens.orderCardBg }}>
              <div className="min-w-0">
                <div className="text-[10px]" style={{ color: tokens.orderMetaText }}>Số tài khoản</div>
                <div className="font-semibold truncate" style={{ color: tokens.orderValueText }}>{bankInfo.accountNumber}</div>
              </div>
              <button
                type="button"
                onClick={() => { void copyText(bankInfo.accountNumber, 'số tài khoản'); }}
                className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
                style={{ backgroundColor: tokens.secondaryButtonBg, color: tokens.secondaryButtonText }}
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <OrderMeta label="Chủ tài khoản" value={bankInfo.accountName} tokens={tokens} />
            <OrderMeta label="Số tiền" value={formatPrice(totalAmount)} tokens={tokens} />
            <div className="sm:col-span-2 rounded-lg border px-3 py-2 flex items-center justify-between gap-2" style={{ borderColor: tokens.orderExpandedBorder, backgroundColor: tokens.orderCardBg }}>
              <div className="min-w-0">
                <div className="text-[10px]" style={{ color: tokens.orderMetaText }}>Nội dung chuyển khoản</div>
                <div className="font-semibold truncate" style={{ color: tokens.orderValueText }}>{transferContent}</div>
              </div>
              <button
                type="button"
                onClick={() => { void copyText(transferContent, 'nội dung chuyển khoản'); }}
                className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
                style={{ backgroundColor: tokens.secondaryButtonBg, color: tokens.secondaryButtonText }}
              >
                <Copy size={12} /> Copy
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs" style={{ color: tokens.orderMetaText }}>
          Bạn có thể kiểm tra lại phương thức và trạng thái thanh toán tại đây khi cần đối chiếu đơn hàng.
        </p>
      )}
    </div>
  );
}

type OrderItemSummary = {
  itemType?: string;
  isDigital?: boolean;
  quantity: number;
};

type OrderShippingSummary = {
  items: OrderItemSummary[];
};

const orderRequiresShipping = (order: OrderShippingSummary) =>
  order.items.some((item) => (item.itemType ?? 'product') === 'product' && !item.isDigital);

const getTimelineLabelsForOrder = (requiresShipping: boolean) =>
  requiresShipping ? TIMELINE_STEPS : NON_SHIPPING_TIMELINE_STEPS;

const getTimelineStepForOrder = (step: number, requiresShipping: boolean) => {
  if (requiresShipping) {
    return step;
  }
  if (step <= 1) {
    return 1;
  }
  return step <= 2 ? 2 : 3;
};

const getOrderQuantityLabel = (items: OrderItemSummary[]) => {
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemTypes = new Set(items.map((item) => item.itemType ?? 'product'));
  if (itemTypes.size === 1) {
    const [itemType] = Array.from(itemTypes);
    if (itemType === 'course') {
      return `${quantity} khóa học`;
    }
    if (itemType === 'resource') {
      return `${quantity} tài nguyên`;
    }
    if (itemType === 'service') {
      return `${quantity} dịch vụ`;
    }
    return `${quantity} sản phẩm`;
  }
  return `${quantity} mục`;
};

function Stepper({ step, tokens, labels = TIMELINE_STEPS }: { step: number; tokens: ReturnType<typeof getAccountOrdersColors>; labels?: string[] }) {
  const safeStep = Math.min(Math.max(step, 1), labels.length);
  return (
    <div className="w-full">
      <div className="flex items-center w-full px-2 sm:px-4">
        {labels.map((label, index) => {
          const active = index < safeStep;
          return (
            <React.Fragment key={label}>
              <div className="relative flex flex-col items-center">
                <div
                  className="w-4 h-4 rounded-full border-[3px] z-10 transition-all duration-300 box-content"
                  style={{
                    backgroundColor: active ? tokens.timelineActive : tokens.surface,
                    borderColor: active ? tokens.timelineActive : tokens.timelineInactive,
                  }}
                />
                <div className="absolute top-8 w-max max-w-[140px] hidden sm:flex flex-col items-center text-center">
                  <span
                    className="text-xs font-semibold tracking-tight transition-colors duration-300"
                    style={{ color: active ? tokens.timelineLabelActive : tokens.timelineLabelInactive }}
                  >
                    {label}
                  </span>
                </div>
              </div>
              {index < labels.length - 1 && (
                <div className="flex-1 h-0.5 relative mx-2 sm:mx-4">
                  <div className="absolute inset-0" style={{ backgroundColor: tokens.timelineInactive }} />
                  <div
                    className="absolute inset-0 transition-all duration-700 ease-out origin-left"
                    style={{
                      backgroundColor: tokens.timelineActive,
                      transform: index + 1 < safeStep ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'left',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="hidden sm:block h-10" />
      <div
        className="sm:hidden mt-3 flex items-center justify-between p-3 rounded-lg border"
        style={{ backgroundColor: tokens.timelineMobileBg, borderColor: tokens.timelineMobileBorder }}
      >
        <span className="text-xs font-medium uppercase" style={{ color: tokens.timelineMobileLabel }}>
          Trạng thái hiện tại
        </span>
        <span className="text-sm font-semibold" style={{ color: tokens.timelineMobileValue }}>
          {labels[safeStep - 1] ?? labels[0]}
        </span>
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
  tokens: ReturnType<typeof getAccountOrdersColors>;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:shadow-md"
      style={highlight
        ? { backgroundColor: tokens.statHighlightBg, borderColor: tokens.statHighlightBg }
        : { backgroundColor: tokens.statCardBg, borderColor: tokens.statCardBorder }
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium" style={{ color: highlight ? tokens.statHighlightSubText : tokens.orderMetaText }}>
            {label}
          </p>
          <h3 className="text-xl font-bold tracking-tight" style={{ color: highlight ? tokens.statHighlightText : tokens.orderValueText }}>
            {value}
          </h3>
        </div>
        <div
          className="p-2 rounded-lg"
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

export default function AccountOrdersPage() {
  const brandColors = useBrandColors();
  const brandColor = brandColors.primary;
  const { isDark } = useSiteSettings();
  const tokens = useMemo(
    () => getAccountOrdersColors(brandColors.primary, brandColors.secondary, brandColors.mode, isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );
  const config = useAccountOrdersConfig();
  const { statuses: orderStatuses } = useOrderStatuses();
  const router = useRouter();
  const { customer, isAuthenticated, openLoginModal, token } = useCustomerAuth();
  const { addItem } = useCart();
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const stockFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableStock', moduleKey: 'products' });
  const ordersSettings = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'orders' });
  const cancelOwnOrder = useMutation(api.orders.cancelOwnOrder);
  const requestResourceDownload = useMutation(api.resources.requestDownload);

  const orders = useQuery(
    api.orders.listAllByCustomer,
    isAuthenticated && customer
      ? { customerId: customer.id as Id<'customers'>, limit: 20 }
      : 'skip'
  );
  const courseLearningLinks = useQuery(
    api.courses.listMyCourseLearningLinks,
    token ? { token } : 'skip'
  );

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOrder, setDrawerOrder] = useState<NonNullable<typeof orders>[number] | null>(null);
  const ordersPerPage = config.ordersPerPage ?? 12;
  const statusKeys = useMemo(() => orderStatuses.map((status) => status.key), [orderStatuses]);
  const statusMap = useMemo(() => new Map(orderStatuses.map((status) => [status.key, status])), [orderStatuses]);
  const normalizedDefaultStatuses = useMemo(
    () => (config.defaultStatusFilter ?? []).filter((status) => statusKeys.includes(status)),
    [config.defaultStatusFilter, statusKeys]
  );
  const pendingStatusKey = useMemo(
    () => orderStatuses.find((status) => status.key === 'Pending')?.key ?? statusKeys[0],
    [orderStatuses, statusKeys]
  );
  const deliveredStatusKey = useMemo(
    () => orderStatuses.find((status) => status.key === 'Delivered')?.key ?? statusKeys[statusKeys.length - 1],
    [orderStatuses, statusKeys]
  );
  const timelineLabels = useMemo(
    () => [...orderStatuses].sort((a, b) => a.step - b.step).map((status) => status.label),
    [orderStatuses]
  );
  const stockEnabled = stockFeature?.enabled ?? false;

  const ordersList = useMemo(() => orders ?? [], [orders]);
  const totalOrders = ordersList.length;
  const ordersSettingsMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    (ordersSettings ?? []).forEach((setting) => {
      map[setting.settingKey] = setting.value;
    });
    return map;
  }, [ordersSettings]);
  const bankInfo = useMemo(() => ({
    bankName: getStringSetting(ordersSettingsMap, 'bankName', 'Vietcombank'),
    bankCode: getStringSetting(ordersSettingsMap, 'bankCode', 'VCB'),
    accountName: getStringSetting(ordersSettingsMap, 'bankAccountName', 'CÔNG TY VIETADMIN'),
    accountNumber: getStringSetting(ordersSettingsMap, 'bankAccountNumber', '0123456789'),
    vietQrTemplate: getStringSetting(ordersSettingsMap, 'vietQrTemplate', 'compact'),
  }), [ordersSettingsMap]);
  const courseLearningLinkMap = useMemo(() => {
    return new Map((courseLearningLinks ?? []).map((link) => [link.courseId, link]));
  }, [courseLearningLinks]);

  const getCourseLearningHref = (courseId?: Id<'courses'>) => {
    if (!courseId) {
      return null;
    }
    const link = courseLearningLinkMap.get(courseId);
    if (!link) {
      return null;
    }
    if (link.firstLessonId && link.firstLessonTitle) {
      return `/khoa-hoc/${link.courseSlug}/bai-hoc/${convertToSlug(link.firstLessonTitle)}--${link.firstLessonId}`;
    }
    return `/khoa-hoc/${link.courseSlug}`;
  };

  const stats = {
    totalSpent: ordersList.reduce((sum, order) => sum + order.totalAmount, 0),
    pending: pendingStatusKey ? ordersList.filter((order) => order.status === pendingStatusKey).length : 0,
    delivered: deliveredStatusKey ? ordersList.filter((order) => order.status === deliveredStatusKey).length : 0,
    totalItems: ordersList.reduce((sum, order) => sum + order.items.reduce((acc, item) => acc + item.quantity, 0), 0),
  };

  const getStatusStyle = (status: string) => {
    const statusConfig = statusMap.get(status);
    const color = statusConfig?.color ?? tokens.primary;
    const badgeTokens = getAccountOrdersStatusBadgeTokens(color, tokens.primary, isDark);
    return {
      backgroundColor: badgeTokens.bg,
      color: badgeTokens.text,
      borderColor: badgeTokens.border,
    };
  };

  const handleCancelOrder = async (orderId: Id<'orders'>) => {
    if (!confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }
    if (!token) {
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    try {
      await cancelOwnOrder({ orderId, token });
      toast.success('Đã hủy đơn hàng thành công.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể hủy đơn hàng.');
    }
  };

  const handleReorder = async (order: (typeof ordersList)[number]) => {
    const availableItems: Array<(typeof order.items)[number]> = [];
    const failedItems: Array<(typeof order.items)[number]> = [];

    for (const item of order.items) {
      const itemType = item.itemType ?? 'product';
      const ok = itemType === 'service' && item.serviceId
        ? await addItem({ itemType: 'service', serviceId: item.serviceId, quantity: item.quantity }, undefined, undefined, { silent: true })
        : itemType === 'course' && item.courseId
          ? await addItem({ itemType: 'course', courseId: item.courseId, quantity: 1 }, undefined, undefined, { silent: true })
          : itemType === 'resource' && item.resourceId
            ? await addItem({ itemType: 'resource', resourceId: item.resourceId, quantity: 1 }, undefined, undefined, { silent: true })
            : item.productId
              ? await addItem(item.productId as Id<'products'>, item.quantity, item.variantId, { silent: true })
              : false;
      if (ok) {
        availableItems.push(item);
      } else {
        failedItems.push(item);
      }
    }

    if (availableItems.length > 0) {
      notifyAddToCart();
      router.push('/cart');
    }

    if (failedItems.length > 0) {
      if (stockEnabled) {
        if (availableItems.length === 0) {
          toast.error('Tất cả sản phẩm trong đơn đã hết hàng');
        } else {
          toast.error(`Sản phẩm đã hết hàng: ${failedItems.map((item) => item.productName).join(', ')}`);
        }
      } else {
        toast.error('Không thể thêm một số sản phẩm vào giỏ hàng.');
      }
    }
  };

  const handleDownloadResource = async (resourceId?: Id<'resources'>) => {
    if (!resourceId) {return;}
    if (!token) {
      openLoginModal();
      return;
    }
    try {
      const result = await requestResourceDownload({ resourceId, token });
      if (result.ok && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        toast.success('Đang mở link tải');
        return;
      }
      toast.error(result.reason === 'purchase_required' ? 'Bạn chưa có quyền tải tài nguyên này.' : 'Không thể tải tài nguyên.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải tài nguyên.');
    }
  };

  const activeStatuses = selectedStatuses.length > 0
    ? selectedStatuses
    : (normalizedDefaultStatuses.length > 0 ? normalizedDefaultStatuses : statusKeys);

  const filteredOrders = useMemo(() => {
    if (activeStatuses.length === statusKeys.length) {
      return ordersList;
    }
    return ordersList.filter((order) => activeStatuses.includes(order.status));
  }, [activeStatuses, ordersList, statusKeys.length]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ordersPerPage;
  const pageEnd = pageStart + ordersPerPage;
  const displayStart = filteredOrders.length === 0 ? 0 : pageStart + 1;
  const displayEnd = Math.min(pageEnd, filteredOrders.length);
  const visibleOrders = config.paginationType === 'pagination'
    ? filteredOrders.slice(pageStart, pageEnd)
    : filteredOrders.slice(0, ordersPerPage);

  const drawerStatus = drawerOrder ? statusMap.get(drawerOrder.status) : undefined;
  const drawerPaymentMethod = drawerOrder?.paymentMethod
    ? (PAYMENT_LABELS[drawerOrder.paymentMethod] ?? drawerOrder.paymentMethod)
    : 'Đang cập nhật';
  const drawerRequiresShipping = drawerOrder ? orderRequiresShipping(drawerOrder) : true;
  const drawerTimelineLabels = drawerRequiresShipping ? timelineLabels : NON_SHIPPING_TIMELINE_STEPS;
  const drawerTimelineStep = getTimelineStepForOrder(drawerStatus?.step ?? 1, drawerRequiresShipping);
  const drawerItems = drawerOrder?.items.map((item) => ({
    actionHref: (item.itemType ?? 'product') === 'course' ? getCourseLearningHref(item.courseId) ?? undefined : undefined,
    actionLabel: (item.itemType ?? 'product') === 'course' ? 'Vào học' : undefined,
    name: item.productName,
    quantity: item.quantity,
    priceLabel: formatPrice(item.price * item.quantity),
    image: item.productImage,
    variantTitle: item.variantTitle,
  }));
  const drawerDigitalItems = drawerOrder?.items
    .filter((item) => item.isDigital && item.digitalCredentials?.deliveredAt)
    .map((item) => ({
      name: item.productName,
      type: item.digitalDeliveryType ?? 'custom',
      credentials: item.digitalCredentials!,
    }));

  const toggleStatus = (status: string) => {
    setCurrentPage(1);
    setSelectedStatuses((prev) => {
      const base = prev.length > 0 ? prev : (normalizedDefaultStatuses.length > 0 ? normalizedDefaultStatuses : statusKeys);
      return base.includes(status) ? base.filter((item) => item !== status) : [...base, status];
    });
  };

  const isAllActive = activeStatuses.length === statusKeys.length;
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
  const drawerBadgeTokens = drawerStatus
    ? getAccountOrdersStatusBadgeTokens(drawerStatus.color ?? tokens.primary, tokens.primary)
    : undefined;

  if (ordersModule && !ordersModule.enabled) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.emptyStateIconBg }}
        >
          <Package size={32} style={{ color: tokens.emptyStateIconColor }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.emptyStateTitle }}>Đơn hàng đang tắt</h1>
        <p style={{ color: tokens.emptyStateText }}>Hãy bật module Đơn hàng để sử dụng tính năng này.</p>
      </div>
    );
  }

  if (!isAuthenticated || !customer) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.emptyStateIconBg }}
        >
          <ShoppingBag size={32} style={{ color: tokens.emptyStateIconColor }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.emptyStateTitle }}>Đăng nhập để xem đơn hàng</h1>
        <p className="mb-6" style={{ color: tokens.emptyStateText }}>Bạn cần đăng nhập để quản lý lịch sử đơn hàng.</p>
        <button
          onClick={openLoginModal}
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium"
          style={{ backgroundColor: tokens.emptyStateActionBg, color: tokens.emptyStateActionText }}
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  if (orders === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: tokens.surfaceMuted }} />
        <div className="h-4 w-64 rounded-lg animate-pulse mt-3" style={{ backgroundColor: tokens.surfaceMuted }} />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 border rounded-xl animate-pulse"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: tokens.headingColor }}>Đơn hàng của tôi</h1>
        <p className="mt-2" style={{ color: tokens.metaText }}>Bạn đang có {totalOrders} đơn hàng gần đây.</p>
      </div>

      {ordersList.length > 0 && (
        <div className="mb-4">
          <StatusFilterDropdown
            options={orderStatuses.map((status) => ({ key: status.key, label: status.label }))}
            activeKeys={activeStatuses}
            isAllActive={isAllActive}
            onToggleKey={toggleStatus}
            onToggleAll={() => setSelectedStatuses(isAllActive ? [] : statusKeys)}
            brandColor={brandColor}
            colors={filterColors}
          />
        </div>
      )}

      {config.showStats && ordersList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Tổng chi tiêu"
            value={formatPrice(stats.totalSpent)}
            icon={<DollarSign className="w-5 h-5" />}
            highlight
            tokens={tokens}
          />
          <StatCard
            label={statusMap.get(pendingStatusKey ?? '')?.label ?? 'Đang xử lý'}
            value={stats.pending}
            icon={<Clock className="w-5 h-5" />}
            tokens={tokens}
          />
          <StatCard
            label={statusMap.get(deliveredStatusKey ?? '')?.label ?? 'Đã giao'}
            value={stats.delivered}
            icon={<CheckCircle2 className="w-5 h-5" />}
            tokens={tokens}
          />
          <StatCard
            label="Mục đã mua"
            value={stats.totalItems}
            icon={<ShoppingBag className="w-5 h-5" />}
            tokens={tokens}
          />
        </div>
      )}

      {ordersList.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: tokens.emptyStateBg, borderColor: tokens.border }}>
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: tokens.emptyStateIconBg }}
          >
            <ShoppingBag size={28} style={{ color: tokens.emptyStateIconColor }} />
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: tokens.emptyStateTitle }}>Chưa có đơn hàng</h2>
          <p className="mb-6" style={{ color: tokens.emptyStateText }}>Khám phá sản phẩm để bắt đầu mua sắm.</p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium"
            style={{ backgroundColor: tokens.emptyStateActionBg, color: tokens.emptyStateActionText }}
          >
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {config.layoutStyle === 'cards' && (
            <div className="space-y-4">
              {visibleOrders.map((order) => {
                const createdAt = new Date(order._creationTime);
                const statusLabel = statusMap.get(order.status)?.label ?? order.status;
                const statusStyle = getStatusStyle(order.status);
                const quantityLabel = getOrderQuantityLabel(order.items);
                const isExpanded = expandedOrderId === order._id;
                const paymentLabel = order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod : 'Chưa chọn';
                const requiresShipping = orderRequiresShipping(order);
                const shippingMethodLabel = requiresShipping ? order.shippingMethodLabel ?? 'Chưa xác định' : 'Không cần vận chuyển';
                const trackingLabel = requiresShipping ? order.trackingNumber ?? 'Chưa có' : 'Không áp dụng';
                const step = getTimelineStepForOrder(statusMap.get(order.status)?.step ?? 1, requiresShipping);
                const timelineLabelsForOrder = getTimelineLabelsForOrder(requiresShipping);

                return (
                  <div
                    key={order._id}
                    className="rounded-2xl border shadow-sm"
                    style={{ backgroundColor: tokens.orderCardBg, borderColor: tokens.orderCardBorder }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                      className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 text-left"
                    >
                      <div>
                        <div className="text-xs" style={{ color: tokens.orderMetaText }}>Mã đơn hàng · {createdAt.toLocaleDateString('vi-VN')}</div>
                        <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{order.orderNumber}</div>
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={statusStyle}>
                          {statusLabel}
                        </span>
                        <div className="text-xs" style={{ color: tokens.orderMetaText }}>{quantityLabel}</div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        style={{ color: tokens.mutedText }}
                      />
                    </button>

                    <div className="px-5 pb-5">
                      <div
                        className="flex items-center justify-between border-t pt-4 text-sm"
                        style={{ borderColor: tokens.orderCardDivider }}
                      >
                        <div style={{ color: tokens.orderMetaText }}>Tổng thanh toán</div>
                        <div className="font-semibold" style={{ color: tokens.orderValueText }}>{formatPrice(order.totalAmount)}</div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div
                          className="rounded-xl border p-4 space-y-4"
                          style={{ backgroundColor: tokens.orderExpandedBg, borderColor: tokens.orderExpandedBorder }}
                        >
                          {config.showOrderItems && (
                            <div>
                              <div className="text-[10px] mb-3 uppercase tracking-wide" style={{ color: tokens.orderMetaText }}>Mục trong đơn</div>
                              <div className="space-y-3">
                                {order.items.map((item, itemIndex) => {
                                  const itemType = item.itemType ?? 'product';
                                  const learningHref = itemType === 'course'
                                    ? getCourseLearningHref(item.courseId)
                                    : null;
                                  const canDownloadResource = itemType === 'resource' && item.resourceId;

                                  return (
                                    <div key={`${item.productId ?? item.serviceId ?? item.courseId ?? item.resourceId}-${itemIndex}`} className="flex items-center gap-4">
                                      <div
                                        className="h-12 w-12 rounded-md border overflow-hidden flex items-center justify-center"
                                        style={{ borderColor: tokens.orderItemThumbBorder, backgroundColor: tokens.orderItemThumbBg }}
                                      >
                                        {item.productImage ? (
                                          <Image
                                            src={item.productImage}
                                            alt={item.productName}
                                            width={48}
                                            height={48}
                                            className="h-full w-full object-cover"
                                            mode="thumb"
                                          />
                                        ) : (
                                          <Package size={18} style={{ color: tokens.orderItemThumbIcon }} />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate" style={{ color: tokens.orderValueText }}>{item.productName}</div>
                                        {item.variantTitle && (
                                          <div className="text-xs" style={{ color: tokens.orderMetaText }}>{item.variantTitle}</div>
                                        )}
                                        <div className="text-xs" style={{ color: tokens.orderMetaText }}>Số lượng: {item.quantity}</div>
                                        {learningHref && (
                                          <Link
                                            href={learningHref}
                                            className="mt-2 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold"
                                            style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                                          >
                                            Vào học
                                          </Link>
                                        )}
                                        {canDownloadResource && (
                                          <button
                                            type="button"
                                            onClick={() => { void handleDownloadResource(item.resourceId); }}
                                            className="mt-2 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold"
                                            style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                                          >
                                            Tải lại
                                          </button>
                                        )}
                                      </div>
                                      <div className="text-sm font-semibold" style={{ color: tokens.priceText }}>
                                        {formatPrice(item.price * item.quantity)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {order.items.some((item) => item.isDigital && item.digitalCredentials?.deliveredAt) && (
                            <div>
                              <div className="text-[10px] mb-3 uppercase tracking-wide" style={{ color: tokens.orderMetaText }}>Digital credentials</div>
                              <div className="space-y-4">
                                {order.items.filter((item) => item.isDigital && item.digitalCredentials?.deliveredAt).map((item, itemIndex) => (
                                  <div key={`${item.productId ?? item.serviceId ?? item.courseId ?? item.resourceId}-digital-${itemIndex}`} className="space-y-2">
                                    <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{item.productName}</div>
                                    <DigitalCredentialsDisplay
                                      type={item.digitalDeliveryType ?? 'custom'}
                                      credentials={item.digitalCredentials!}
                                      brandColor={brandColor}
                                      tokens={{
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
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {config.showPaymentMethod && <OrderMeta label="Thanh toán" value={paymentLabel} tokens={tokens} />}
                            {config.showShippingMethod && <OrderMeta label={requiresShipping ? 'Giao hàng' : 'Giao nhận'} value={shippingMethodLabel} tokens={tokens} />}
                            {config.showTracking && requiresShipping && <OrderMeta label="Tracking" value={trackingLabel} tokens={tokens} />}
                          </div>

                          <PaymentReminder
                            orderNumber={order.orderNumber}
                            paymentMethod={order.paymentMethod}
                            paymentStatus={order.paymentStatus}
                            totalAmount={order.totalAmount}
                            bankInfo={bankInfo}
                            tokens={tokens}
                          />

                          {config.showShippingAddress && requiresShipping && order.shippingAddress && (
                            <OrderMeta label="Địa chỉ" value={order.shippingAddress} tokens={tokens} />
                          )}

                          {config.showTimeline && <Stepper step={step} tokens={tokens} labels={timelineLabelsForOrder} />}

                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => { void handleReorder(order); }}
                              className="px-3 py-2 rounded-lg text-xs font-semibold"
                              style={{ backgroundColor: tokens.secondaryButtonBg, color: tokens.secondaryButtonText }}
                            >
                              Mua lại
                            </button>
                            {statusMap.get(order.status)?.allowCancel && (
                              <button
                                type="button"
                                onClick={() => { void handleCancelOrder(order._id); }}
                                className="px-3 py-2 rounded-lg text-xs font-semibold"
                                style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                              >
                                Hủy đơn
                              </button>
                            )}
                          </div>
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

          {config.layoutStyle === 'compact' && (
            <div className="space-y-3">
              <div
                className="hidden md:block overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg"
                style={{ backgroundColor: tokens.surface }}
              >
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: tokens.tableHeaderBg, color: tokens.tableHeaderText }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Mã đơn</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Ngày</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Số mục</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Tổng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Trạng thái</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((order) => {
                      const createdAt = new Date(order._creationTime);
                      const statusLabel = statusMap.get(order.status)?.label ?? order.status;
                      const statusStyle = getStatusStyle(order.status);
                      const quantityLabel = getOrderQuantityLabel(order.items);
                      return (
                        <tr
                          key={order._id}
                          className="border-t transition-colors hover:bg-[var(--row-hover)]"
                          style={{ borderColor: tokens.orderCardDivider, ...rowHoverStyle }}
                        >
                          <td className="px-4 py-3 font-medium" style={{ color: tokens.orderValueText }}>{order.orderNumber}</td>
                          <td className="px-4 py-3" style={{ color: tokens.orderMetaText }}>{createdAt.toLocaleDateString('vi-VN')}</td>
                      <td className="px-4 py-3" style={{ color: tokens.bodyText }}>{quantityLabel}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: tokens.orderValueText }}>{formatPrice(order.totalAmount)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold border" style={statusStyle}>
                              {statusLabel}
                            </span>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 md:hidden">
                {visibleOrders.map((order) => {
                  const createdAt = new Date(order._creationTime);
                  const statusLabel = statusMap.get(order.status)?.label ?? order.status;
                  const statusStyle = getStatusStyle(order.status);
                  return (
                    <div
                      key={order._id}
                      className="border rounded-xl p-3"
                      style={{ backgroundColor: tokens.orderCardBg, borderColor: tokens.orderCardBorder }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs" style={{ color: tokens.orderMetaText }}>{order.orderNumber} · {createdAt.toLocaleDateString('vi-VN')}</div>
                          <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{formatPrice(order.totalAmount)}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border" style={statusStyle}>
                          {statusLabel}
                        </span>
                      </div>
                    <div className="mt-2 text-xs" style={{ color: tokens.orderMetaText }}>
                      {getOrderQuantityLabel(order.items)}
                    </div>
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
                  );
                })}
              </div>
            </div>
          )}

          {config.layoutStyle === 'timeline' && (
            <div className="space-y-6">
              {visibleOrders.map((order) => {
                const createdAt = new Date(order._creationTime);
                const statusLabel = statusMap.get(order.status)?.label ?? order.status;
                const statusStyle = getStatusStyle(order.status);
                const requiresShipping = orderRequiresShipping(order);
                const trackingLabel = requiresShipping ? order.trackingNumber ?? 'Đang cập nhật' : 'Không áp dụng';
                const step = getTimelineStepForOrder(statusMap.get(order.status)?.step ?? 1, requiresShipping);
                const timelineLabelsForOrder = getTimelineLabelsForOrder(requiresShipping);
                return (
                  <div
                    key={order._id}
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
                          <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{createdAt.toLocaleDateString('vi-VN')}</div>
                        </div>
                        <div className="hidden md:block h-8 w-px" style={{ backgroundColor: tokens.border }} />
                        <div>
                          <div className="text-xs uppercase tracking-wide" style={{ color: tokens.orderMetaText }}>Mã đơn</div>
                          <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{order.orderNumber}</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={statusStyle}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="p-6 space-y-6">
                      {config.showTimeline && <Stepper step={step} tokens={tokens} labels={timelineLabelsForOrder} />}
                      {(config.showPaymentMethod || config.showShippingMethod || (config.showShippingAddress && requiresShipping)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {config.showPaymentMethod && (
                            <OrderMeta label="Thanh toán" value={order.paymentMethod ?? 'Đang cập nhật'} tokens={tokens} />
                          )}
                          {config.showShippingMethod && (
                            <OrderMeta label={requiresShipping ? 'Giao hàng' : 'Giao nhận'} value={requiresShipping ? order.shippingMethodLabel ?? 'Đang cập nhật' : 'Không cần vận chuyển'} tokens={tokens} />
                          )}
                          {config.showShippingAddress && requiresShipping && (
                            <OrderMeta label="Địa chỉ" value={order.shippingAddress ?? 'Đang cập nhật'} tokens={tokens} />
                          )}
                        </div>
                      )}
                      <PaymentReminder
                        orderNumber={order.orderNumber}
                        paymentMethod={order.paymentMethod}
                        paymentStatus={order.paymentStatus}
                        totalAmount={order.totalAmount}
                        bankInfo={bankInfo}
                        tokens={tokens}
                      />
                      {config.showOrderItems && (
                        <div className="space-y-4">
                          <div className="text-xs font-semibold uppercase" style={{ color: tokens.orderMetaText }}>Mục trong đơn</div>
                          {order.items.map((item, itemIndex) => {
                            const itemType = item.itemType ?? 'product';
                            const learningHref = itemType === 'course'
                              ? getCourseLearningHref(item.courseId)
                              : null;
                            const canDownloadResource = itemType === 'resource' && item.resourceId;

                            return (
                              <div key={`${item.productId ?? item.serviceId ?? item.courseId ?? item.resourceId}-${itemIndex}`} className="flex flex-col sm:flex-row gap-4 items-start">
                                <div
                                  className="w-16 h-16 rounded-lg border overflow-hidden flex items-center justify-center"
                                  style={{ borderColor: tokens.orderItemThumbBorder, backgroundColor: tokens.orderItemThumbBg }}
                                >
                                  {item.productImage ? (
                                    <Image
                                      src={item.productImage}
                                      alt={item.productName}
                                      width={64}
                                      height={64}
                                      className="h-full w-full object-cover"
                                      mode="thumb"
                                    />
                                  ) : (
                                    <Package size={20} style={{ color: tokens.orderItemThumbIcon }} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{item.productName}</div>
                                    {item.variantTitle && <div className="text-xs" style={{ color: tokens.orderMetaText }}>{item.variantTitle}</div>}
                                    <div className="text-xs" style={{ color: tokens.orderMetaText }}>Số lượng: {item.quantity}</div>
                                    {learningHref && (
                                      <Link
                                        href={learningHref}
                                        className="mt-2 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold"
                                        style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                                      >
                                        Vào học
                                      </Link>
                                    )}
                                    {canDownloadResource && (
                                      <button
                                        type="button"
                                        onClick={() => { void handleDownloadResource(item.resourceId); }}
                                        className="mt-2 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold"
                                        style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                                      >
                                        Tải lại
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-base font-semibold" style={{ color: tokens.priceText }}>{formatPrice(item.price * item.quantity)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {order.items.some((item) => item.isDigital && item.digitalCredentials?.deliveredAt) && (
                        <div className="space-y-3">
                          <div className="text-xs font-semibold uppercase" style={{ color: tokens.orderMetaText }}>Digital credentials</div>
                          <div className="space-y-4">
                            {order.items.filter((item) => item.isDigital && item.digitalCredentials?.deliveredAt).map((item, itemIndex) => (
                              <div key={`${item.productId ?? item.serviceId ?? item.courseId ?? item.resourceId}-digital-timeline-${itemIndex}`} className="space-y-2">
                                <div className="text-sm font-semibold" style={{ color: tokens.orderValueText }}>{item.productName}</div>
                                <DigitalCredentialsDisplay
                                  type={item.digitalDeliveryType ?? 'custom'}
                                  credentials={item.digitalCredentials!}
                                  brandColor={brandColor}
                                  tokens={{
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
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className="px-6 py-4 border-t flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.orderCardDivider }}
                    >
                      {config.showTracking && requiresShipping && (
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
                            {trackingLabel}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: tokens.orderMetaText }}>Tổng tiền</span>
                          <span className="text-xl font-bold" style={{ color: tokens.priceText }}>
                            {formatPrice(order.totalAmount)}
                          </span>
                        </div>
                        {statusMap.get(order.status)?.allowCancel ? (
                          <button
                            type="button"
                            onClick={() => { void handleCancelOrder(order._id); }}
                            className="px-4 py-2 rounded-lg text-sm font-semibold"
                            style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                          >
                            Hủy đơn hàng
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { void handleReorder(order); }}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border"
                            style={{ borderColor: tokens.secondaryButtonBorder, color: tokens.secondaryButtonText, backgroundColor: tokens.surface }}
                          >
                            Mua lại
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {config.layoutStyle !== 'cards' && visibleOrders.length === 0 && (
            <div
              className="border border-dashed rounded-2xl p-6 text-center text-sm"
              style={{ backgroundColor: tokens.emptyStateBg, borderColor: tokens.border, color: tokens.emptyStateText }}
            >
              Không có đơn hàng phù hợp.
            </div>
          )}

          {filteredOrders.length > 0 && (
            <div className="pt-2">
              {config.paginationType === 'pagination' ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <p style={{ color: tokens.paginationSummaryText }}>
                    Hiển thị <span className="font-semibold" style={{ color: tokens.paginationSummaryStrong }}>{displayStart}</span> đến{' '}
                    <span className="font-semibold" style={{ color: tokens.paginationSummaryStrong }}>{displayEnd}</span> / {filteredOrders.length}
                  </p>
                  <div className="flex items-center justify-between gap-3">
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
              drawerSectionBg: tokens.drawerSectionBg,
              drawerSectionBorder: tokens.drawerSectionBorder,
              drawerSectionTitle: tokens.drawerSectionTitle,
              drawerSectionValue: tokens.drawerSectionValue,
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
            title={drawerOrder?.orderNumber ?? ''}
            subtitle={drawerOrder ? new Date(drawerOrder._creationTime).toLocaleDateString('vi-VN') : undefined}
            statusLabel={drawerStatus?.label ?? drawerOrder?.status ?? ''}
            statusColor={drawerStatus?.color}
            totalLabel={drawerOrder ? formatPrice(drawerOrder.totalAmount) : ''}
            items={drawerItems}
            digitalItems={drawerDigitalItems}
            showItems={config.showOrderItems}
            showDigitalCredentials
            showTimeline={config.showTimeline}
            timelineStep={drawerTimelineStep}
            timelineLabels={drawerTimelineLabels}
            showPaymentMethod={config.showPaymentMethod}
            paymentMethod={drawerPaymentMethod}
            paymentDetails={drawerOrder ? (
              <PaymentReminder
                orderNumber={drawerOrder.orderNumber}
                paymentMethod={drawerOrder.paymentMethod}
                paymentStatus={drawerOrder.paymentStatus}
                totalAmount={drawerOrder.totalAmount}
                bankInfo={bankInfo}
                tokens={tokens}
              />
            ) : undefined}
            showShippingMethod={config.showShippingMethod}
            shippingMethod={drawerRequiresShipping ? drawerOrder?.shippingMethodLabel ?? 'Đang cập nhật' : 'Không cần vận chuyển'}
            showTracking={config.showTracking && drawerRequiresShipping}
            tracking={drawerOrder?.trackingNumber ?? 'Đang cập nhật'}
            showShippingAddress={config.showShippingAddress && drawerRequiresShipping}
            shippingAddress={drawerOrder?.shippingAddress ?? 'Đang cập nhật'}
            allowCancel={drawerStatus?.allowCancel}
            onCancel={drawerOrder ? () => { void handleCancelOrder(drawerOrder._id); setDrawerOrder(null); } : undefined}
            onReorder={drawerOrder ? () => { void handleReorder(drawerOrder); setDrawerOrder(null); } : undefined}
          />
        </div>
      )}
    </div>
  );
}
