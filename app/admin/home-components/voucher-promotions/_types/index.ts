import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { VoucherPromotionsStyle } from '@/lib/home-components/voucher-promotions';

export type { VoucherPromotionsStyle };

export type VoucherPromotionsBrandMode = 'single' | 'dual';
export type VoucherPromotionsHarmony = 'analogous' | 'complementary' | 'triadic';
export type VoucherPromotionsSelectionMode = 'auto' | 'demo';
export type VoucherPromotionsDesktopColumns = 3 | 4;
export type VoucherPromotionsCtaVariant = 'button' | 'textRight';
export type VoucherPromotionsCornerRadius = 'none' | 'sm' | 'lg';


export interface VoucherPromotionsTexts {
  heading: string;
  description: string;
  ctaLabel: string;
}

export interface VoucherPromotionItem {
  _id?: string;
  code: string;
  createdAt?: number;
  description?: string;
  discountType: 'percent' | 'fixed' | 'buy_x_get_y' | 'buy_a_get_b' | 'tiered' | 'free_shipping' | 'gift';
  discountValue?: number;
  endDate?: number;
  isActive?: boolean;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  name: string;
  thumbnail?: string;
}

export interface VoucherPromotionsConfig {
  texts?: VoucherPromotionsTexts;
  ctaUrl?: string;
  showCta?: boolean;
  ctaVariant?: VoucherPromotionsCtaVariant;
  harmony?: VoucherPromotionsHarmony;
  demoVouchers?: DemoVoucherPromotionItem[];
  selectionMode?: VoucherPromotionsSelectionMode;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  desktopColumns?: VoucherPromotionsDesktopColumns;
  cornerRadius?: VoucherPromotionsCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  iconName?: string;
}

export interface DemoVoucherPromotionItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: VoucherPromotionItem['discountType'];
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  endDate?: number;
  thumbnail?: string;
}

export interface VoucherPromotionsConfigState extends VoucherPromotionsConfig {
  demoVouchers: DemoVoucherPromotionItem[];
  selectionMode: VoucherPromotionsSelectionMode;
  style: VoucherPromotionsStyle;
  limit: number;
  texts: VoucherPromotionsTexts;
  showCta?: boolean;
  ctaVariant?: VoucherPromotionsCtaVariant;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  desktopColumns?: VoucherPromotionsDesktopColumns;
  cornerRadius?: VoucherPromotionsCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  iconName?: string;
}
