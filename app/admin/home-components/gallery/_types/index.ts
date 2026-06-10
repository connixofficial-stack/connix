'use client';

import type { ImageItem } from '../../../components/MultiImageUploader';
import type { SectionHeaderConfig } from '../../_shared/types/sectionHeader';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';

export type GalleryStyle = 'spotlight' | 'explore' | 'stories' | 'grid' | 'marquee' | 'masonry';

export type GalleryCornerRadius = 'none' | 'sm' | 'lg';
export type GalleryDesktopColumns = 3 | 4 | 6;

export const DEFAULT_GALLERY_CORNER_RADIUS: GalleryCornerRadius = 'lg';
export const DEFAULT_GALLERY_DESKTOP_COLUMNS: GalleryDesktopColumns = 4;
export const DEFAULT_GALLERY_FULL_WIDTH = false;

export const DEFAULT_GALLERY_CONFIG: Partial<GalleryConfig> = {
  style: 'grid',
  cornerRadius: DEFAULT_GALLERY_CORNER_RADIUS,
  desktopColumns: DEFAULT_GALLERY_DESKTOP_COLUMNS,
  fullWidth: DEFAULT_GALLERY_FULL_WIDTH,
  fullWidthDesktop: DEFAULT_GALLERY_FULL_WIDTH,
};
export type TrustBadgesStyle = 'grid' | 'cards' | 'stack' | 'wall' | 'carousel' | 'seal';
export type TrustBadgesCornerRadius = 'none' | 'sm' | 'lg';
export type TrustBadgesDesktopColumns = 3 | 4;

export const DEFAULT_TRUST_BADGES_CORNER_RADIUS: TrustBadgesCornerRadius = 'lg';
export const DEFAULT_TRUST_BADGES_DESKTOP_COLUMNS: TrustBadgesDesktopColumns = 4;
export const DEFAULT_TRUST_BADGES_SHOW_BORDER = true;

export function normalizeTrustBadgesCornerRadius(value: unknown, noBorderRadius?: unknown): TrustBadgesCornerRadius {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  if (value === 'small') {
    return 'sm';
  }

  if (value === 'large' || value === 'md' || value === 'full') {
    return 'lg';
  }

  return DEFAULT_TRUST_BADGES_CORNER_RADIUS;
}

export function normalizeTrustBadgesDesktopColumns(value: unknown): TrustBadgesDesktopColumns {
  return value === 3 ? 3 : DEFAULT_TRUST_BADGES_DESKTOP_COLUMNS;
}

export interface TrustBadgesRenderConfig {
  style: TrustBadgesStyle;
  cornerRadius: TrustBadgesCornerRadius;
  desktopColumns: TrustBadgesDesktopColumns;
  showBorder: boolean;
}

export function resolveTrustBadgesRenderConfig(config?: {
  style?: unknown;
  cornerRadius?: unknown;
  noBorderRadius?: unknown;
  desktopColumns?: unknown;
  showBorder?: unknown;
}): TrustBadgesRenderConfig {
  return {
    cornerRadius: normalizeTrustBadgesCornerRadius(config?.cornerRadius, config?.noBorderRadius),
    desktopColumns: normalizeTrustBadgesDesktopColumns(config?.desktopColumns),
    showBorder: config?.showBorder === false ? false : DEFAULT_TRUST_BADGES_SHOW_BORDER,
    style: normalizeTrustBadgesStyle(config?.style),
  };
}

export function getTrustBadgesCornerRadiusClassName(value: TrustBadgesCornerRadius = DEFAULT_TRUST_BADGES_CORNER_RADIUS) {
  if (value === 'none') { return 'rounded-none'; }
  if (value === 'sm') { return 'rounded-md'; }
  return 'rounded-2xl';
}

export function getTrustBadgesInnerCornerRadiusClassName(value: TrustBadgesCornerRadius = DEFAULT_TRUST_BADGES_CORNER_RADIUS) {
  if (value === 'none') { return 'rounded-none'; }
  if (value === 'sm') { return 'rounded'; }
  return 'rounded-xl';
}

export function normalizeTrustBadgesStyle(value: unknown): TrustBadgesStyle {
  if (value === 'grid' || value === 'cards' || value === 'stack' || value === 'wall' || value === 'carousel' || value === 'seal') {
    return value;
  }
  if (value === 'marquee') { return 'stack'; }
  if (value === 'featured') { return 'seal'; }
  return 'cards';
}

export interface GalleryItem extends ImageItem {
  id: string | number;
  url: string;
  link: string;
  name?: string;
}

export interface GalleryConfig extends SectionHeaderConfig {
  items: GalleryItem[];
  style: GalleryStyle;
  harmony?: string;
  spacing?: SectionSpacing;
  cornerRadius?: GalleryCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  desktopColumns?: GalleryDesktopColumns;
  fullWidth?: boolean;
  fullWidthDesktop?: boolean;
}

export function normalizeGalleryCornerRadius(value: unknown, noBorderRadius?: unknown): GalleryCornerRadius {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  if (value === 'md' || value === 'full') {
    return 'lg';
  }

  return DEFAULT_GALLERY_CORNER_RADIUS;
}

export function normalizeGalleryDesktopColumns(value: unknown): GalleryDesktopColumns {
  if (value === 3 || value === 4 || value === 6) {
    return value as GalleryDesktopColumns;
  }
  return DEFAULT_GALLERY_DESKTOP_COLUMNS;
}
