export type VoucherPromotionsStyle = 'enterpriseCards' | 'ticketHorizontal' | 'imageTicket' | 'couponGrid' | 'stackedBanner' | 'carousel' | 'minimal';

export const DEFAULT_VOUCHER_STYLE: VoucherPromotionsStyle = 'enterpriseCards';

const LEGACY_STYLES = new Set([
  'grid',
  'split',
  'strip',
  'highlight',
  'minimal',
  'compact',
]);

export const normalizeVoucherStyle = (value?: string): VoucherPromotionsStyle => {
  if (
    value === 'enterpriseCards'
    || value === 'ticketHorizontal'
    || value === 'imageTicket'
    || value === 'couponGrid'
    || value === 'stackedBanner'
    || value === 'carousel'
    || value === 'minimal'
  ) {
    return value;
  }
  if (value && LEGACY_STYLES.has(value)) {
    return DEFAULT_VOUCHER_STYLE;
  }
  return DEFAULT_VOUCHER_STYLE;
};

export const normalizeVoucherLimit = (
  value?: number,
  { fallback = 4, max = 8, min = 1 }: { fallback?: number; max?: number; min?: number } = {}
) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.trunc(value!), min), max);
};

export const formatVoucherExpiry = (timestamp?: number) => {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('vi-VN');
};
