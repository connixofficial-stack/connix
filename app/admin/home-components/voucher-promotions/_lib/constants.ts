import { DEFAULT_VOUCHER_STYLE, type VoucherPromotionsStyle } from '@/lib/home-components/voucher-promotions';
import { DEFAULT_SECTION_SPACING } from '../../_shared/types/sectionSpacing';
import type { DemoVoucherPromotionItem, VoucherPromotionsConfigState, VoucherPromotionsCornerRadius, VoucherPromotionsTexts } from '../_types';

export const VOUCHER_PROMOTIONS_STYLES: { id: VoucherPromotionsStyle; label: string }[] = [
  { id: 'enterpriseCards', label: '(1) Dạng thẻ' },
  { id: 'ticketHorizontal', label: '(2) Vé ngang' },
  { id: 'imageTicket', label: '(3) Vé ảnh' },
  { id: 'couponGrid', label: '(4) Lưới thẻ' },
  { id: 'stackedBanner', label: '(5) Xếp chồng' },
  { id: 'carousel', label: '(6) Trượt ngang' },
  { id: 'minimal', label: '(7) Tối giản' },
];

export const AVAILABLE_VOUCHER_PROMOTION_ICONS = [
  'BadgePercent', 'Percent', 'BadgeDollarSign', 'CircleDollarSign', 'DollarSign',
  'TicketPercent', 'Ticket', 'Tickets', 'Tags', 'Tag', 'ReceiptPercent',
  'Gift', 'GiftIcon', 'PackageCheck', 'Package', 'PackageOpen', 'ShoppingBag',
  'ShoppingBasket', 'ShoppingCart', 'Store', 'StoreIcon', 'BadgeCheck',
  'Badge', 'BadgePlus', 'BadgeMinus', 'Sparkles', 'PartyPopper', 'Megaphone',
  'Bell', 'BellRing', 'Flame', 'Zap', 'Gem', 'Crown', 'Trophy', 'Award',
  'Medal', 'Star', 'Heart', 'ThumbsUp', 'HandCoins', 'Coins', 'Banknote',
  'WalletCards', 'Wallet', 'CreditCard', 'PiggyBank', 'Landmark', 'ChartNoAxesColumnIncreasing',
  'TrendingDown', 'TrendingUp', 'CirclePercent', 'CircleGauge', 'Target',
  'Timer', 'Clock', 'CalendarDays', 'CalendarClock', 'CalendarCheck2', 'AlarmClock',
  'Hourglass', 'Truck', 'TruckIcon', 'ShipWheel', 'BadgeInfo', 'Info',
  'CircleAlert', 'ShieldCheck', 'ShieldPercent', 'BadgeQuestionMark', 'ScanBarcode',
  'Barcode', 'QrCode', 'ScanLine', 'Copy', 'CopyCheck', 'ClipboardCopy',
  'ClipboardCheck', 'MousePointerClick', 'HandHeart', 'Handshake', 'Rocket',
  'Send', 'MailCheck', 'MessageCircleMore', 'MessagesSquare', 'SmilePlus',
] as const;

export const DEFAULT_VOUCHER_PROMOTIONS_CORNER_RADIUS: VoucherPromotionsCornerRadius = 'lg';

export const DEFAULT_VOUCHER_PROMOTIONS_TEXTS: VoucherPromotionsTexts = {
  heading: 'Voucher khuyến mãi',
  description: 'Áp dụng mã để nhận ưu đãi tốt nhất hôm nay.',
  ctaLabel: 'Xem tất cả ưu đãi',
};

export const DEFAULT_DEMO_VOUCHERS: DemoVoucherPromotionItem[] = [
  {
    id: 'demo-voucher-1',
    code: 'EGA50',
    name: 'Giảm 15% đơn từ 500K',
    description: 'Áp dụng cho tất cả sản phẩm',
    discountType: 'percent',
    discountValue: 15,
    maxDiscountAmount: 250000,
    endDate: new Date('2026-12-28').getTime(),
  },
  {
    id: 'demo-voucher-2',
    code: 'EGAT10',
    name: 'Giảm 10% cho đơn 1 triệu',
    description: 'Không áp dụng combo',
    discountType: 'percent',
    discountValue: 10,
    maxDiscountAmount: 300000,
    endDate: new Date('2026-12-30').getTime(),
  },
  {
    id: 'demo-voucher-3',
    code: 'FREESHIP',
    name: 'Miễn phí vận chuyển nội thành',
    description: 'Áp dụng đơn từ 500K',
    discountType: 'free_shipping',
    maxDiscountAmount: 50000,
    endDate: new Date('2026-12-31').getTime(),
  },
  {
    id: 'demo-voucher-4',
    code: 'EGA500K',
    name: 'Giảm 90K cho đơn 1 triệu',
    description: 'Tối đa 1 mã/đơn',
    discountType: 'fixed',
    discountValue: 90000,
    maxDiscountAmount: 90000,
    endDate: new Date('2026-12-31').getTime(),
  },
];

export const normalizeVoucherPromotionsTexts = (texts?: Partial<VoucherPromotionsTexts>): VoucherPromotionsTexts => ({
  heading: texts?.heading?.trim() || DEFAULT_VOUCHER_PROMOTIONS_TEXTS.heading,
  description: texts?.description?.trim() || DEFAULT_VOUCHER_PROMOTIONS_TEXTS.description,
  ctaLabel: texts?.ctaLabel?.trim() || DEFAULT_VOUCHER_PROMOTIONS_TEXTS.ctaLabel,
});

export const normalizeDemoVouchers = (items?: Partial<DemoVoucherPromotionItem>[]): DemoVoucherPromotionItem[] => {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_DEMO_VOUCHERS;
  }

  return items.map((item, index) => ({
    id: item.id?.trim() || `demo-voucher-${index + 1}`,
    code: item.code?.trim() || `DEMO${index + 1}`,
    name: item.name?.trim() || 'Voucher demo',
    description: item.description?.trim() || '',
    discountType: item.discountType ?? 'percent',
    discountValue: typeof item.discountValue === 'number' ? item.discountValue : 10,
    maxDiscountAmount: typeof item.maxDiscountAmount === 'number' ? item.maxDiscountAmount : undefined,
    minOrderAmount: typeof item.minOrderAmount === 'number' ? item.minOrderAmount : undefined,
    endDate: typeof item.endDate === 'number' ? item.endDate : undefined,
    thumbnail: item.thumbnail?.trim() || undefined,
  }));
};

export const normalizeVoucherPromotionsCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): VoucherPromotionsCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  if (legacyNoBorderRadius === true) {
    return 'none';
  }

  return DEFAULT_VOUCHER_PROMOTIONS_CORNER_RADIUS;
};

export const getVoucherPromotionsCornerRadiusClassName = (
  value: VoucherPromotionsCornerRadius = DEFAULT_VOUCHER_PROMOTIONS_CORNER_RADIUS,
) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-xl';
};

export const DEFAULT_VOUCHER_PROMOTIONS_CONFIG: VoucherPromotionsConfigState = {
  ctaUrl: '/promotions',
  showCta: true,
  ctaVariant: 'button',
  demoVouchers: DEFAULT_DEMO_VOUCHERS,
  selectionMode: 'auto',
  limit: 4,
  style: DEFAULT_VOUCHER_STYLE,
  texts: DEFAULT_VOUCHER_PROMOTIONS_TEXTS,
  hideHeader: false,
  showTitle: true,
  showSubtitle: true,
  subtitle: DEFAULT_VOUCHER_PROMOTIONS_TEXTS.description,
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  spacing: DEFAULT_SECTION_SPACING,
  desktopColumns: 4,
  cornerRadius: DEFAULT_VOUCHER_PROMOTIONS_CORNER_RADIUS,
  iconName: 'BadgePercent',
};
