import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
export interface FeatureItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  image?: string;
}

export type FeaturesStyle = 'iconGrid' | 'alternating' | 'compact' | 'cards' | 'carousel' | 'timeline' | 'carousel6';
export type FeaturesBrandMode = 'single' | 'dual';
export type FeaturesHarmony = 'analogous' | 'complementary' | 'triadic';
export type FeaturesHeaderAlign = 'left' | 'center' | 'right';
export type FeaturesDesktopColumns = 3 | 4;
export type FeaturesCornerRadius = 'none' | 'sm' | 'lg';

export const DEFAULT_FEATURES_DESKTOP_COLUMNS: FeaturesDesktopColumns = 3;
export const DEFAULT_FEATURES_CORNER_RADIUS: FeaturesCornerRadius = 'lg';

export const normalizeFeaturesDesktopColumns = (value: unknown): FeaturesDesktopColumns => value === 4 ? 4 : 3;

export const normalizeFeaturesCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): FeaturesCornerRadius => {
  if (legacyNoBorderRadius === true) {
    return 'none';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_FEATURES_CORNER_RADIUS;
};

export const getFeaturesCornerRadiusClassName = (value: FeaturesCornerRadius = DEFAULT_FEATURES_CORNER_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-xl';
};

export interface FeaturesConfig {
  items: FeatureItem[];
  style: FeaturesStyle;
  showIcons?: boolean;
  harmony?: FeaturesHarmony;
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: FeaturesHeaderAlign;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  desktopColumns?: FeaturesDesktopColumns;
  cornerRadius?: FeaturesCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}
