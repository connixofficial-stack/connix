import {
  DEFAULT_SECTION_SPACING,
  getSectionSpacingClassName,
  normalizeSectionSpacing,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';
export type ServiceItemMediaType = 'icon' | 'image';
export type ServiceItemMediaPlacement = 'top' | 'left';
export type ServiceItemMediaAlign = 'left' | 'center' | 'right';
export type ServicesCornerRadius = 'none' | 'sm' | 'lg';
export type ServicesSpacing = SectionSpacing;

export interface ServiceItem {
  mediaType?: ServiceItemMediaType;
  icon?: string;
  image?: string;
  title: string;
  description: string;
}

export interface ServiceEditorItem extends ServiceItem {
  id: number;
}

export type ServicesStyle = 'elegantGrid' | 'modernList' | 'bigNumber' | 'cards' | 'carousel' | 'timeline' | 'builderPolicy' | 'builderFeatureCircle';
export type ServicesBrandMode = 'single' | 'dual';
export type ServicesHarmony = 'analogous' | 'complementary' | 'triadic';

export interface ServicesConfig {
  items: ServiceItem[];
  style: ServicesStyle;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: ServiceItemMediaAlign;
  mediaPlacement?: ServiceItemMediaPlacement;
  mediaAlign?: ServiceItemMediaAlign;
  desktopColumns?: 3 | 4;
  harmony?: ServicesHarmony;
  // Shared header config
  hideHeader?: boolean;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: ServicesSpacing;
  cornerRadius?: ServicesCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

export interface ServicesColorTokens {
  primary: string;
  secondary: string;
  heading: string;
  subheading: string;
  sectionAccent: string;
  iconColor: string;
  bodyText: string;
  mutedText: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  secondaryTint: string;
  primaryTint: string;
  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;
  numberText: string;
  timelineLine: string;
  timelineDotBorder: string;
  buttonText: string;
  buttonBackground: string;
  buttonBorder: string;
  placeholderBackground: string;
  placeholderIconBackground: string;
  placeholderIcon: string;
  placeholderText: string;
  plusTileBorder: string;
  plusTileText: string;
}

export interface ServicesHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface ServicesAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface ServicesAccessibilityScore {
  minLc: number;
  failing: Array<ServicesAccessibilityPair & { lc: number; threshold: number }>;
}

export const DEFAULT_SERVICES_SPACING: ServicesSpacing = DEFAULT_SECTION_SPACING;
export const DEFAULT_SERVICES_CORNER_RADIUS: ServicesCornerRadius = 'sm';
export const normalizeServicesSpacing = (
  value: unknown,
  legacyNoVerticalMargin?: unknown,
): ServicesSpacing => {
  if (legacyNoVerticalMargin === true && value === undefined) {
    return 'none';
  }

  return normalizeSectionSpacing(value);
};
export const getServicesSectionSpacingClassName = getSectionSpacingClassName;

export const normalizeServicesCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): ServicesCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  if (legacyNoBorderRadius === true) {
    return 'none';
  }

  return DEFAULT_SERVICES_CORNER_RADIUS;
};

export const getServicesCornerRadiusClassName = (value: ServicesCornerRadius = DEFAULT_SERVICES_CORNER_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'lg') {
    return 'rounded-2xl';
  }

  return 'rounded-md';
};
