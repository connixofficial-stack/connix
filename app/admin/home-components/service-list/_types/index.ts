import type { SectionHeaderConfig } from '../../_shared/types/sectionHeader';
import {
  DEFAULT_SECTION_SPACING,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';

export type ServiceListStyle = 'grid' | 'bento' | 'list' | 'carousel' | 'minimal' | 'showcase' | 'kanban';

export type ServiceSelectionMode = 'auto' | 'manual' | 'demo';

export type ServiceListSortBy = 'newest' | 'popular' | 'random';

export type ServiceListBrandMode = 'single' | 'dual';
export type ServiceListHarmony = 'analogous' | 'complementary' | 'triadic';
export type ServiceListCardRadius = 'none' | 'sm' | 'lg';
export type ServiceListDesktopColumns = 3 | 4;

export interface ServiceListPreviewItem {
  id: string | number;
  name: string;
  image?: string;
  price?: string | number;
  description?: string;
  tag?: 'new' | 'hot';
}

export interface DemoServiceItem {
  id: string;
  name: string;
  image?: string;
  storageId?: string | null;
  price?: string;
  description?: string;
  tag?: '' | 'new' | 'hot';
  link?: string;
}

export interface ServiceListConfig extends SectionHeaderConfig {
  itemCount: number;
  sortBy: ServiceListSortBy;
  selectionMode: ServiceSelectionMode;
  selectedServiceIds?: string[];
  demoServices?: DemoServiceItem[];
  style?: ServiceListStyle;
  harmony?: ServiceListHarmony;
  spacing?: SectionSpacing;
  cardRadius?: ServiceListCardRadius;
  desktopColumns?: ServiceListDesktopColumns;
}

export const DEFAULT_SERVICE_LIST_CARD_RADIUS: ServiceListCardRadius = 'lg';
export const DEFAULT_SERVICE_LIST_DESKTOP_COLUMNS: ServiceListDesktopColumns = 3;
export const DEFAULT_SERVICE_LIST_SPACING: SectionSpacing = DEFAULT_SECTION_SPACING;

export const normalizeServiceListCardRadius = (value: unknown): ServiceListCardRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_SERVICE_LIST_CARD_RADIUS;
};

export const normalizeServiceListDesktopColumns = (value: unknown): ServiceListDesktopColumns => {
  return value === 4 ? 4 : DEFAULT_SERVICE_LIST_DESKTOP_COLUMNS;
};

export const getServiceListCardRadiusClassName = (value: ServiceListCardRadius = DEFAULT_SERVICE_LIST_CARD_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-xl';
};

export const getServiceListImageRadiusClassName = (value: ServiceListCardRadius = DEFAULT_SERVICE_LIST_CARD_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-sm';
  }

  return 'rounded-lg';
};

export const getServiceListSectionSpacingClassName = (
  spacing: SectionSpacing = DEFAULT_SERVICE_LIST_SPACING,
  context: 'preview' | 'site' = 'site',
) => {
  if (spacing === 'none') {
    return 'py-0';
  }

  if (spacing === 'compact') {
    return context === 'preview' ? 'py-4 md:py-5' : 'py-6 md:py-8';
  }

  return context === 'preview' ? 'py-7 md:py-8' : 'py-12 md:py-16';
};
