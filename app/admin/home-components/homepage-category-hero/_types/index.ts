'use client';

import type { ImageItem } from '../../../components/MultiImageUploader';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { HomeComponentCornerRadius } from '../../_shared/components/HomeComponentDisplaySettingsSection';

export type HomepageCategoryHeroSelectionMode = 'manual' | 'auto' | 'demo';
export type HomepageCategoryHeroBrandMode = 'single' | 'dual';
export type HomepageCategoryHeroTabletBehavior = 'drawer' | 'compact-rail';
export type HomepageCategoryHeroStyle = 'sidebar' | 'classic' | 'flush' | 'minimal' | 'soft' | 'top-nav';
export type HomepageCategoryHeroCategoryVisualMode = 'image' | 'icon';
export type HomepageCategoryHeroCategoryImageSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type HomepageCategoryHeroCategoryImageShape = 'circle' | 'rounded' | 'square';
export type HomepageCategoryHeroCornerRadius = HomeComponentCornerRadius;
export type HomepageCategoryHeroAutoGenerateMode = 'tree' | 'distribution' | 'smart';
export type HomepageCategoryHeroAutoGenerateStrategy = 'balanced' | 'tree-first' | 'discovery';

export interface HomepageCategoryHeroMenuLink {
  id: number;
  targetType?: 'category' | 'product';
  categoryId?: string;
  productId?: string;
  label?: string;
  image?: string;
  slug?: string;
}

export interface HomepageCategoryHeroMenuGroup {
  id: number;
  title: string;
  items: HomepageCategoryHeroMenuLink[];
}

export interface HomepageCategoryHeroCategoryItem {
  id: number;
  categoryId: string;
  groups?: HomepageCategoryHeroMenuGroup[];
  imageOverride?: string;
  iconName?: string;
  ctaLabel?: string;
}

export interface HomepageCategoryHeroSlide extends ImageItem {
  id: string | number;
  url: string;
  link?: string;
}

export interface HomepageCategoryHeroAutoGenerateConfig {
  mode: HomepageCategoryHeroAutoGenerateMode;
  strategy: HomepageCategoryHeroAutoGenerateStrategy;
  maxRootCategories: number;
  maxGroupsPerCategory: number;
  maxItemsPerGroup: number;
  productScanLimit: number;
}

export interface HomepageCategoryHeroAutoGenerateMeta {
  generatedAt: number;
  mode: HomepageCategoryHeroAutoGenerateMode;
  strategy: HomepageCategoryHeroAutoGenerateStrategy;
  summary?: string;
}

export interface HomepageCategoryHeroConfig {
  style: HomepageCategoryHeroStyle;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaUrl: string;
  heroSlides: HomepageCategoryHeroSlide[];
  selectionMode: HomepageCategoryHeroSelectionMode;
  categories: HomepageCategoryHeroCategoryItem[];
  autoGenerateConfig: HomepageCategoryHeroAutoGenerateConfig;
  autoGenerateMeta?: HomepageCategoryHeroAutoGenerateMeta;
  hideEmptyCategories: boolean;
  showCategoryImage: boolean;
  categoryVisualMode: HomepageCategoryHeroCategoryVisualMode;
  categoryImageSize: HomepageCategoryHeroCategoryImageSize;
  categoryImageShape: HomepageCategoryHeroCategoryImageShape;
  maxCategoriesDesktop: number;
  maxCategoriesTablet: number;
  maxCategoriesMobile: number;
  attachToHeader: boolean;
  tabletBehavior: HomepageCategoryHeroTabletBehavior;
  cornerRadius?: HomepageCategoryHeroCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  spacing?: SectionSpacing;
  bannerImageFit?: 'cover' | 'contain';
  demoCategoriesData?: { _id: string; name: string; image?: string }[];
}

export const DEFAULT_HOMEPAGE_CATEGORY_HERO_CORNER_RADIUS: HomepageCategoryHeroCornerRadius = 'lg';

export const normalizeHomepageCategoryHeroCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): HomepageCategoryHeroCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }
  return legacyNoBorderRadius === true ? 'none' : DEFAULT_HOMEPAGE_CATEGORY_HERO_CORNER_RADIUS;
};

export interface HomepageCategoryData {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}
