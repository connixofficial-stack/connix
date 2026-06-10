import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { HomeComponentCornerRadius } from '../../_shared/components/HomeComponentDisplaySettingsSection';

export type BlogStyle = 'layout1' | 'layout2' | 'layout3' | 'layout4' | 'layout5' | 'layout6' | 'layout7';

export type BlogSelectionMode = 'auto' | 'manual' | 'demo';
export type BlogBrandMode = 'single' | 'dual';
export type BlogSortBy = 'newest' | 'popular' | 'random';
export type BlogCardRadius = HomeComponentCornerRadius;
type LegacyBlogCardRadius = BlogCardRadius | 'md';

export interface DemoBlogItem {
  id: string;
  title: string;
  excerpt?: string;
  thumbnail?: string;
  category?: string;
  date?: string;
  author?: string;
  link?: string;
}

export interface BlogConfig extends Record<string, unknown> {
  itemCount: number;
  sortBy: BlogSortBy;
  style: BlogStyle;
  selectionMode: BlogSelectionMode;
  selectedPostIds: string[];
  demoPosts?: DemoBlogItem[];
  subtitle: string;
  showAuthor: boolean;
  showExcerpt: boolean;
  showDate: boolean;
  spacing: SectionSpacing;
  desktopColumns: 3 | 4;
  cornerRadius: BlogCardRadius;
  cardRadius?: LegacyBlogCardRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

export interface BlogPreviewItem {
  id: string | number;
  title: string;
  excerpt?: string;
  thumbnail?: string;
  date?: string;
  category?: string;
  readTime?: string;
  views?: number;
  author?: string;
}

const VALID_BLOG_STYLES: BlogStyle[] = ['layout1', 'layout2', 'layout3', 'layout4', 'layout5', 'layout6', 'layout7'];
const VALID_SORT_VALUES: BlogSortBy[] = ['newest', 'popular', 'random'];
const VALID_CARD_RADIUS_VALUES: BlogCardRadius[] = ['none', 'sm', 'lg'];

export const DEFAULT_BLOG_CARD_RADIUS: BlogCardRadius = 'lg';

export const normalizeBlogCardRadius = (value: unknown, noBorderRadius?: unknown): BlogCardRadius => {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (VALID_CARD_RADIUS_VALUES.includes(value as BlogCardRadius)) {
    return value as BlogCardRadius;
  }
  if (value === 'md') {
    return DEFAULT_BLOG_CARD_RADIUS;
  }

  return DEFAULT_BLOG_CARD_RADIUS;
};

export const getBlogCardRadiusClassName = (value: BlogCardRadius = DEFAULT_BLOG_CARD_RADIUS) => {
  if (value === 'none') {return 'rounded-none';}
  if (value === 'sm') {return 'rounded-md';}
  if (value === 'lg') {return 'rounded-2xl';}
  return 'rounded-xl';
};

export const getBlogImageRadiusClassName = (value: BlogCardRadius = DEFAULT_BLOG_CARD_RADIUS) => {
  if (value === 'none') {return 'rounded-none';}
  if (value === 'sm') {return 'rounded-sm';}
  if (value === 'lg') {return 'rounded-xl';}
  return 'rounded-lg';
};

const toText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

export const normalizeBlogStyle = (value: unknown): BlogStyle => {
  if (VALID_BLOG_STYLES.includes(value as BlogStyle)) {
    return value as BlogStyle;
  }
  if (value === 'grid') {return 'layout1';}
  if (value === 'list') {return 'layout2';}
  if (value === 'featured') {return 'layout3';}
  if (value === 'magazine') {return 'layout4';}
  if (value === 'carousel') {return 'layout5';}
  if (value === 'minimal') {return 'layout6';}
  return 'layout1';
};

export const normalizeBlogSortBy = (value: unknown): BlogSortBy => {
  if (VALID_SORT_VALUES.includes(value as BlogSortBy)) {
    return value as BlogSortBy;
  }
  return 'newest';
};

export const normalizeBlogSelectionMode = (value: unknown): BlogSelectionMode => (
  value === 'manual' ? 'manual' : value === 'demo' ? 'demo' : 'auto'
);

export const normalizeBlogSelectedPostIds = (value: unknown): string[] => (
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
);

export const normalizeBlogConfig = (raw: Record<string, unknown> | null | undefined): BlogConfig => {
  const config = raw ?? {};
  const itemCount = typeof config.itemCount === 'number'
    ? config.itemCount
    : Number(config.itemCount);
  const desktopColumns = config.desktopColumns === 3 ? 3 : 4;

  return {
    cornerRadius: normalizeBlogCardRadius(config.cornerRadius ?? config.cardRadius, config.noBorderRadius),
    cardRadius: normalizeBlogCardRadius(config.cornerRadius ?? config.cardRadius, config.noBorderRadius),
    desktopColumns,
    itemCount: Number.isFinite(itemCount) && itemCount > 0 ? Math.round(itemCount) : 8,
    selectedPostIds: normalizeBlogSelectedPostIds(config.selectedPostIds),
    selectionMode: normalizeBlogSelectionMode(config.selectionMode),
    demoPosts: Array.isArray(config.demoPosts) ? config.demoPosts as DemoBlogItem[] : [],
    showAuthor: typeof config.showAuthor === 'boolean' ? config.showAuthor : true,
    showDate: typeof config.showDate === 'boolean' ? config.showDate : true,
    showExcerpt: typeof config.showExcerpt === 'boolean' ? config.showExcerpt : true,
    sortBy: normalizeBlogSortBy(config.sortBy),
    noBorderRadius: config.noBorderRadius === true,
    noVerticalMargin: config.noVerticalMargin === true,
    spacing: normalizeSectionSpacing(config.noVerticalMargin === true ? 'none' : (config.spacing ?? DEFAULT_SECTION_SPACING)),
    style: normalizeBlogStyle(config.style),
    subtitle: toText(config.subtitle),
  };
};
