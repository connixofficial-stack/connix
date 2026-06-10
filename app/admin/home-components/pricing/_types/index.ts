import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
export type PricingStyle = 'cards' | 'horizontal' | 'minimal' | 'comparison' | 'featured' | 'compact' | 'tabbed' | 'construction';

export type PricingBrandMode = 'single' | 'dual';
export type PricingHarmony = 'analogous' | 'complementary' | 'triadic';


export interface PricingPlan {
  id?: string | number;
  name: string;
  price: string;
  yearlyPrice?: string;
  period: string;
  features: string[];
  isPopular: boolean;
  buttonText: string;
  buttonLink: string;
}

export interface PricingEditorPlan extends Omit<PricingPlan, 'id'> {
  id: number;
}

export type PricingHeaderAlign = 'left' | 'center' | 'right';
export type PricingCornerRadius = 'none' | 'sm' | 'lg';

export interface PricingConfig {
  plans: PricingPlan[];
  style: PricingStyle;
  monthlyLabel?: string;
  yearlyLabel?: string;
  yearlySavingText?: string;
  showBillingToggle?: boolean;
  subtitle?: string;
  texts?: Record<string, string>;
  harmony?: PricingHarmony;
  // Shared header config
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  headerAlign?: PricingHeaderAlign;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  gridCols?: 3 | 4;
  cornerRadius?: PricingCornerRadius;
}

export const DEFAULT_PRICING_CORNER_RADIUS: PricingCornerRadius = 'lg';

export const normalizePricingCornerRadius = (value: unknown, noBorderRadius?: unknown): PricingCornerRadius => {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'small') {
    return 'sm';
  }

  if (value === 'large') {
    return 'lg';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_PRICING_CORNER_RADIUS;
};

export const getPricingCornerRadiusClassName = (
  value: PricingCornerRadius = DEFAULT_PRICING_CORNER_RADIUS,
) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-xl';
};
