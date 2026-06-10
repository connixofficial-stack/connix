'use client';

import {
  DEFAULT_SECTION_SPACING,
  getSectionSpacingClassName,
  normalizeSectionSpacing,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';
import type { HomeComponentCornerRadius } from '../../_shared/components/HomeComponentDisplaySettingsSection';

export type ProductCategoriesStyle = 'grid' | 'carousel' | 'cards' | 'marquee' | 'circular' | 'icon-grid' | 'mosaic' | 'compact-grid' | 'image-strip' | 'grid-10' | 'grid-11';
export type ProductCategoriesBrandMode = 'single' | 'dual';
export type ProductCategoriesAlign = 'left' | 'center' | 'right';
export type ProductCategoriesSpacing = SectionSpacing;
export type ProductCategoriesCornerRadius = HomeComponentCornerRadius;
export type ProductCategoriesDesktopColumns = 3 | 4;

export interface CategoryConfigItem {
  id: number;
  categoryId: string;
  customImage?: string;
  imageMode?: 'product-image' | 'default' | 'icon' | 'upload' | 'url';
  storageId?: string | null;
}

export interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

export interface ProductCategoriesResolvedItem {
  id: string;
  itemId: number | string;
  name: string;
  slug?: string;
  description?: string;
  displayImage?: string;
  displayIcon?: string;
  productCount: number;
  link?: string;
}

export type ProductCategoriesSelectionMode = 'real' | 'demo';

export interface DemoProductCategoryItem {
  id: string;
  name: string;
  image?: string;
  description?: string;
  productCount?: number;
  link?: string;
  storageId?: string | null;
}

export interface ProductCategoriesConfig {
  categories: CategoryConfigItem[];
  style: ProductCategoriesStyle;
  showProductCount: boolean;
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: ProductCategoriesAlign;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  subheading?: string;
  align?: ProductCategoriesAlign;
  selectionMode?: ProductCategoriesSelectionMode;
  demoCategories?: DemoProductCategoryItem[];
  spacing?: ProductCategoriesSpacing;
  cornerRadius?: ProductCategoriesCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  desktopColumns?: ProductCategoriesDesktopColumns;
}

export const DEFAULT_PRODUCT_CATEGORIES_SPACING: ProductCategoriesSpacing = DEFAULT_SECTION_SPACING;
export const normalizeProductCategoriesSpacing = (
  value: unknown,
  legacyNoVerticalMargin?: unknown,
): ProductCategoriesSpacing => {
  if (legacyNoVerticalMargin === true && value === undefined) {
    return 'none';
  }

  return normalizeSectionSpacing(value);
};
export const getProductCategoriesSectionSpacingClassName = getSectionSpacingClassName;
export const DEFAULT_PRODUCT_CATEGORIES_CORNER_RADIUS: ProductCategoriesCornerRadius = 'lg';

export const normalizeProductCategoriesCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): ProductCategoriesCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return legacyNoBorderRadius === true ? 'none' : DEFAULT_PRODUCT_CATEGORIES_CORNER_RADIUS;
};

export const getProductCategoriesCardCornerRadiusClassName = (value: ProductCategoriesCornerRadius) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  return value === 'sm' ? 'rounded-lg' : 'rounded-2xl';
};

export const getProductCategoriesInnerCornerRadiusClassName = (value: ProductCategoriesCornerRadius) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  return value === 'sm' ? 'rounded-md' : 'rounded-xl';
};

export const DEFAULT_PRODUCT_CATEGORIES_DESKTOP_COLUMNS: ProductCategoriesDesktopColumns = 3;
export const normalizeProductCategoriesDesktopColumns = (value: unknown): ProductCategoriesDesktopColumns => {
  return value === 4 ? 4 : DEFAULT_PRODUCT_CATEGORIES_DESKTOP_COLUMNS;
};
