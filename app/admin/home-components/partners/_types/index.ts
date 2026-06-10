'use client';

import type { ImageItem } from '../../../components/MultiImageUploader';
import type { SectionHeaderConfig } from '../../_shared/types/sectionHeader';
import {
  DEFAULT_SECTION_SPACING,
  getSectionSpacingClassName,
  normalizeSectionSpacing,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';

export type PartnersStyle = 'grid' | 'marquee' | 'badge' | 'carousel' | 'clean' | 'divider' | 'logoCloud' | 'glassLogoCloud';
export type PartnersAlign = 'left' | 'center' | 'right';
export type PartnersDisplayMode = 'withName' | 'logoOnly';
export type PartnersHeaderAlign = 'left' | 'center' | 'right';
export type PartnersCornerRadius = 'none' | 'sm' | 'lg';
export type PartnersLogoSize = 'small' | 'normal' | 'large' | 'veryLarge' | 'largest';
export type PartnersLogoSizeLayout = 'grid' | 'compact' | 'marquee' | 'clean' | 'logoCloud' | 'glassLogoCloud';
export type PartnersSpacing = SectionSpacing;

export interface PartnerItem extends ImageItem {
  id: string | number;
  url: string;
  link: string;
  name?: string;
}

export type PartnersLogoColorMode = 'color' | 'grayscale' | 'white';
export type PartnersLogoColorIntensity = number;
export const DEFAULT_PARTNERS_LOGO_COLOR_INTENSITY: PartnersLogoColorIntensity = 50;

export interface PartnersConfig extends SectionHeaderConfig {
  items: PartnerItem[];
  style: PartnersStyle;
  subheading?: string;
  align: PartnersAlign;
  displayMode: PartnersDisplayMode;
  cornerRadius: PartnersCornerRadius;
  logoSize: PartnersLogoSize;
  showBorder: boolean;
  spacing: PartnersSpacing;
  logoColorMode?: PartnersLogoColorMode;
  logoColorIntensity?: PartnersLogoColorIntensity;
}

export const DEFAULT_PARTNERS_ALIGN: PartnersAlign = 'center';
export const DEFAULT_PARTNERS_DISPLAY_MODE: PartnersDisplayMode = 'withName';
export const DEFAULT_PARTNERS_CORNER_RADIUS: PartnersCornerRadius = 'lg';
export const DEFAULT_PARTNERS_LOGO_SIZE: PartnersLogoSize = 'normal';
export const DEFAULT_PARTNERS_SHOW_BORDER = true;
export const DEFAULT_PARTNERS_SPACING: PartnersSpacing = DEFAULT_SECTION_SPACING;

export const DEFAULT_PARTNERS_CONFIG: Partial<PartnersConfig> = {
  hideHeader: false,
  showTitle: true,
  showSubtitle: true,
  subtitle: '',
  headerAlign: 'center',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: 'Đối tác',
  align: DEFAULT_PARTNERS_ALIGN,
  displayMode: DEFAULT_PARTNERS_DISPLAY_MODE,
  cornerRadius: DEFAULT_PARTNERS_CORNER_RADIUS,
  logoSize: DEFAULT_PARTNERS_LOGO_SIZE,
  showBorder: DEFAULT_PARTNERS_SHOW_BORDER,
  spacing: DEFAULT_PARTNERS_SPACING,
  style: 'grid',
  logoColorMode: 'grayscale',
  logoColorIntensity: DEFAULT_PARTNERS_LOGO_COLOR_INTENSITY,
};

export const normalizePartnersStyle = (value: unknown): PartnersStyle => {
  if (value === 'grid' || value === 'marquee' || value === 'badge' || value === 'carousel' || value === 'clean' || value === 'divider' || value === 'logoCloud' || value === 'glassLogoCloud') {
    return value;
  }

  if (value === 'mono') {
    return 'marquee';
  }

  if (value === 'featured') {
    return 'grid';
  }

  return 'grid';
};

export const normalizePartnersAlign = (value: unknown): PartnersAlign => {
  if (value === 'left' || value === 'center' || value === 'right') {
    return value;
  }

  return DEFAULT_PARTNERS_ALIGN;
};

export const normalizePartnersDisplayMode = (value: unknown): PartnersDisplayMode => {
  if (value === 'logoOnly') {
    return 'logoOnly';
  }

  return DEFAULT_PARTNERS_DISPLAY_MODE;
};

export const normalizePartnersCornerRadius = (value: unknown): PartnersCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_PARTNERS_CORNER_RADIUS;
};

export const getPartnersCornerRadiusClassName = (value: PartnersCornerRadius = DEFAULT_PARTNERS_CORNER_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-xl';
};

export const normalizePartnersLogoSize = (value: unknown): PartnersLogoSize => {
  if (value === 'small' || value === 'normal' || value === 'large' || value === 'veryLarge' || value === 'largest') {
    return value;
  }

  return DEFAULT_PARTNERS_LOGO_SIZE;
};

export const normalizePartnersShowBorder = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  return DEFAULT_PARTNERS_SHOW_BORDER;
};

export const normalizePartnersLogoColorMode = (value: unknown): PartnersLogoColorMode => {
  if (value === 'color' || value === 'grayscale' || value === 'white') {
    return value;
  }

  return 'grayscale';
};

export const getPartnersLogoColorIntensityFromMode = (mode: PartnersLogoColorMode): PartnersLogoColorIntensity => {
  if (mode === 'color') {
    return 0;
  }

  if (mode === 'white') {
    return 100;
  }

  return DEFAULT_PARTNERS_LOGO_COLOR_INTENSITY;
};

export const normalizePartnersLogoColorIntensity = (value: unknown, fallbackMode: unknown = 'grayscale'): PartnersLogoColorIntensity => {
  const numericValue = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : Number.NaN;

  if (Number.isFinite(numericValue)) {
    return Math.min(100, Math.max(0, Math.round(numericValue)));
  }

  return getPartnersLogoColorIntensityFromMode(normalizePartnersLogoColorMode(fallbackMode));
};

export const getPartnersLogoColorModeFromIntensity = (value: PartnersLogoColorIntensity): PartnersLogoColorMode => {
  if (value <= 25) {
    return 'color';
  }

  if (value >= 75) {
    return 'white';
  }

  return 'grayscale';
};

export const normalizePartnersSpacing = normalizeSectionSpacing;

export const getPartnersSectionSpacingClassName = (
  spacing: PartnersSpacing = DEFAULT_PARTNERS_SPACING,
  variant: 'grid' | 'default' | 'marquee' | 'marqueeSkip' | 'siteOuter' | 'logoCloud' | 'glassLogoCloud' | 'empty' = 'default',
  skipHeader = false,
) => {
  if (variant === 'default' && !skipHeader) {
    return getSectionSpacingClassName(spacing);
  }

  if (spacing === 'none') { return skipHeader ? 'pb-0' : 'py-0'; }

  if (spacing === 'compact') {
    if (variant === 'grid') { return skipHeader ? 'pb-4 md:pb-6' : 'py-4 md:py-6'; }
    if (variant === 'marquee') { return 'py-5 md:py-7'; }
    if (variant === 'marqueeSkip') { return 'py-4 md:py-6'; }
    if (variant === 'siteOuter') { return 'py-4'; }
    if (variant === 'logoCloud' || variant === 'glassLogoCloud') { return 'py-3 md:py-5'; }
    if (variant === 'empty') { return 'py-3'; }
    return skipHeader ? 'pb-3 md:pb-5' : 'py-3 md:py-5';
  }

  if (variant === 'grid') { return skipHeader ? 'pb-8 md:pb-12' : 'py-8 md:py-12'; }
  if (variant === 'marquee') { return 'py-10 md:py-14'; }
  if (variant === 'marqueeSkip') { return 'py-8 md:py-12'; }
  if (variant === 'siteOuter') { return 'py-8'; }
  if (variant === 'logoCloud' || variant === 'glassLogoCloud') { return 'py-6 md:py-10'; }
  if (variant === 'empty') { return 'py-6'; }
  return skipHeader ? 'pb-6 md:pb-10' : 'py-6 md:py-10';
};

export const getPartnersContentTopSpacingClassName = (spacing: PartnersSpacing = DEFAULT_PARTNERS_SPACING) => {
  if (spacing === 'none') {
    return 'mt-0';
  }

  if (spacing === 'compact') {
    return 'mt-3 md:mt-4';
  }

  return 'mt-5 md:mt-8';
};

export const getPartnersHeaderSpacingClassName = (spacing: PartnersSpacing = DEFAULT_PARTNERS_SPACING) => {
  if (spacing === 'none') {
    return 'mb-0 gap-0 md:mb-0 md:gap-0';
  }

  if (spacing === 'compact') {
    return 'mb-3 gap-1.5 md:mb-5 md:gap-2';
  }

  return undefined;
};

export const getPartnersItemGapClassName = (
  spacing: PartnersSpacing = DEFAULT_PARTNERS_SPACING,
  variant: 'grid' | 'track' | 'cleanName' | 'cleanLogo' | 'marqueeGrid' | 'marqueeColumns' = 'grid',
) => {
  if (spacing === 'none') {
    if (variant === 'marqueeColumns') { return 'gap-0'; }
    if (variant === 'cleanName' || variant === 'cleanLogo') { return 'gap-x-2 gap-y-2'; }
    if (variant === 'marqueeGrid') { return 'gap-x-2 gap-y-2'; }
    return 'gap-0';
  }

  if (spacing === 'compact') {
    if (variant === 'track') { return 'gap-1.5 md:gap-2'; }
    if (variant === 'cleanName') { return 'gap-x-4 gap-y-3 md:gap-x-6 md:gap-y-3'; }
    if (variant === 'cleanLogo') { return 'gap-x-3 gap-y-2 md:gap-x-5 md:gap-y-3'; }
    if (variant === 'marqueeGrid') { return 'gap-x-2 gap-y-2 md:gap-x-3 md:gap-y-3'; }
    if (variant === 'marqueeColumns') { return 'gap-4 lg:gap-6 xl:gap-8'; }
    return 'gap-1.5 md:gap-2';
  }

  if (variant === 'track') { return 'gap-3 md:gap-4'; }
  if (variant === 'cleanName') { return 'gap-x-8 gap-y-5 md:gap-x-12 md:gap-y-6'; }
  if (variant === 'cleanLogo') { return 'gap-x-6 gap-y-4 md:gap-x-10 md:gap-y-6'; }
  if (variant === 'marqueeGrid') { return 'gap-x-4 gap-y-4 md:gap-x-6 md:gap-y-5'; }
  if (variant === 'marqueeColumns') { return 'gap-8 lg:gap-12 xl:gap-16'; }
  return 'gap-3 md:gap-4';
};

export const getPartnersLogoBoxClassName = (
  layout: PartnersLogoSizeLayout,
  logoSize: PartnersLogoSize = DEFAULT_PARTNERS_LOGO_SIZE,
  showName = true,
) => {
  if (layout === 'grid') {
    if (logoSize === 'small') { return showName ? 'h-10 md:h-12' : 'h-12 md:h-14'; }
    if (logoSize === 'large') { return showName ? 'h-14 md:h-16' : 'h-16 md:h-20'; }
    if (logoSize === 'veryLarge') { return showName ? 'h-16 md:h-20' : 'h-20 md:h-24'; }
    if (logoSize === 'largest') { return showName ? 'h-20 md:h-24' : 'h-24 md:h-28'; }
    return showName ? 'h-12 md:h-14' : 'h-14 md:h-16';
  }

  if (layout === 'compact') {
    if (logoSize === 'small') { return showName ? 'h-10 md:h-12' : 'h-12 md:h-14'; }
    if (logoSize === 'large') { return showName ? 'h-16 md:h-20' : 'h-20 md:h-24'; }
    if (logoSize === 'veryLarge') { return showName ? 'h-20 md:h-24' : 'h-24 md:h-28'; }
    if (logoSize === 'largest') { return showName ? 'h-24 md:h-28' : 'h-28 md:h-32'; }
    return showName ? 'h-14 md:h-16' : 'h-16 md:h-20';
  }

  if (layout === 'marquee') {
    if (logoSize === 'small') { return 'h-12 md:h-14'; }
    if (logoSize === 'large') { return 'h-16 md:h-20'; }
    if (logoSize === 'veryLarge') { return 'h-20 md:h-24'; }
    if (logoSize === 'largest') { return 'h-24 md:h-28'; }
    return 'h-14 md:h-16';
  }

  if (layout === 'clean') {
    if (showName) {
      if (logoSize === 'small') { return 'h-6 w-6 md:h-7 md:w-7'; }
      if (logoSize === 'large') { return 'h-9 w-9 md:h-10 md:w-10'; }
      if (logoSize === 'veryLarge') { return 'h-10 w-10 md:h-12 md:w-12'; }
      if (logoSize === 'largest') { return 'h-12 w-12 md:h-14 md:w-14'; }
      return 'h-7 w-7 md:h-8 md:w-8';
    }
    if (logoSize === 'small') { return 'h-8 w-[70px] md:h-9 md:w-[90px]'; }
    if (logoSize === 'large') { return 'h-11 w-[110px] md:h-12 md:w-[130px]'; }
    if (logoSize === 'veryLarge') { return 'h-14 w-[130px] md:h-16 md:w-[150px]'; }
    if (logoSize === 'largest') { return 'h-16 w-[150px] md:h-20 md:w-[180px]'; }
    return 'h-9 w-[80px] md:h-10 md:w-[100px]';
  }

  if (layout === 'logoCloud' || layout === 'glassLogoCloud') {
    if (logoSize === 'small') { return 'max-h-[90px]'; }
    if (logoSize === 'large') { return 'max-h-[140px]'; }
    if (logoSize === 'veryLarge') { return 'max-h-[160px]'; }
    if (logoSize === 'largest') { return 'max-h-[180px]'; }
    return 'max-h-[120px]';
  }

  if (logoSize === 'small') { return 'max-h-[60px]'; }
  if (logoSize === 'large') { return 'max-h-[96px]'; }
  if (logoSize === 'veryLarge') { return 'max-h-[112px]'; }
  if (logoSize === 'largest') { return 'max-h-[128px]'; }
  return 'max-h-[80px]';
};

export const getPartnersLogoCardClassName = (
  layout: 'compact' | 'marquee',
  logoSize: PartnersLogoSize = DEFAULT_PARTNERS_LOGO_SIZE,
  showName = true,
) => {
  if (layout === 'marquee') {
    if (logoSize === 'small') { return 'w-[90px] md:w-[110px]'; }
    if (logoSize === 'large') { return 'w-[130px] md:w-[150px]'; }
    if (logoSize === 'veryLarge') { return 'w-[150px] md:w-[180px]'; }
    if (logoSize === 'largest') { return 'w-[180px] md:w-[210px]'; }
    return 'w-[100px] md:w-[120px]';
  }

  if (showName) {
    if (logoSize === 'small') { return 'w-[110px] flex-col gap-1 p-1.5 md:w-[130px] md:p-2'; }
    if (logoSize === 'large') { return 'w-[150px] flex-col gap-1.5 p-2 md:w-[170px] md:p-2.5'; }
    if (logoSize === 'veryLarge') { return 'w-[170px] flex-col gap-2 p-2.5 md:w-[190px] md:p-3'; }
    if (logoSize === 'largest') { return 'w-[190px] flex-col gap-2.5 p-2.5 md:w-[220px] md:p-3'; }
    return 'w-[130px] flex-col gap-1 p-1.5 md:w-[150px] md:p-2';
  }

  if (logoSize === 'small') { return 'w-[90px] p-1 md:w-[110px] md:p-1.5'; }
  if (logoSize === 'large') { return 'w-[130px] p-1.5 md:w-[150px] md:p-2'; }
  if (logoSize === 'veryLarge') { return 'w-[150px] p-2 md:w-[170px] md:p-2.5'; }
  if (logoSize === 'largest') { return 'w-[170px] p-2 md:w-[200px] md:p-2.5'; }
  return 'w-[110px] p-1 md:w-[130px] md:p-1.5';
};

export const getPartnersLogoFallbackSize = (
  layout: PartnersLogoSizeLayout,
  logoSize: PartnersLogoSize = DEFAULT_PARTNERS_LOGO_SIZE,
  showName = true,
) => {
  const base = layout === 'compact'
    ? (showName ? 24 : 36)
    : layout === 'marquee'
      ? 28
      : layout === 'clean'
        ? (showName ? 24 : 36)
        : (layout === 'logoCloud' || layout === 'glassLogoCloud')
          ? 32
          : (showName ? 32 : 40);

  const offset = logoSize === 'small' ? -6 : logoSize === 'large' ? 8 : logoSize === 'veryLarge' ? 16 : logoSize === 'largest' ? 24 : 0;
  return Math.max(18, base + offset);
};
