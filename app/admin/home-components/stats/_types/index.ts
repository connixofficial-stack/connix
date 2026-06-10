'use client';

import {
  DEFAULT_SECTION_SPACING,
  getSectionSpacingClassName,
  normalizeSectionSpacing,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';
import type { HomeComponentCornerRadius } from '../../_shared/components/HomeComponentDisplaySettingsSection';

export type StatsStyle = 'horizontal' | 'cards' | 'icons' | 'gradient' | 'minimal' | 'counter' | 'solar-hero' | 'builder-overlay';
export type StatsBrandMode = 'single' | 'dual';
export type StatsIconType = 'lucide' | 'url' | 'upload' | 'none';
export type StatsHeaderAlign = 'left' | 'center' | 'right';
export type StatsMediaPlacement = 'top' | 'left';
export type StatsMediaAlign = 'left' | 'center' | 'right';
export type StatsSpacing = SectionSpacing;
export type StatsCornerRadius = HomeComponentCornerRadius;

export interface StatsItem {
  value: string;
  label: string;
  description?: string;
  iconType?: StatsIconType;
  iconName?: string;
  iconUrl?: string;
  iconStorageId?: string | null;
}

export interface StatsContent {
  items: StatsItem[];
  style: StatsStyle;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: StatsHeaderAlign;
  desktopColumns?: 3 | 4;
  mediaPlacement?: StatsMediaPlacement;
  mediaAlign?: StatsMediaAlign;
  backgroundImage?: string;
  backgroundImageStorageId?: string | null;
  fullWidth?: boolean;
  spacing?: StatsSpacing;
  cornerRadius?: StatsCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

export const DEFAULT_STATS_SPACING: StatsSpacing = DEFAULT_SECTION_SPACING;
export const normalizeStatsSpacing = normalizeSectionSpacing;
export const getStatsSectionSpacingClassName = getSectionSpacingClassName;
export const DEFAULT_STATS_CORNER_RADIUS: StatsCornerRadius = 'lg';

export const normalizeStatsCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): StatsCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }
  return legacyNoBorderRadius === true ? 'none' : DEFAULT_STATS_CORNER_RADIUS;
};

export const getStatsCornerRadiusClassName = (value: StatsCornerRadius) => {
  if (value === 'none') {
    return '';
  }
  return value === 'sm' ? 'rounded-lg' : 'rounded-2xl';
};

export const getStatsTopCornerRadiusClassName = (value: StatsCornerRadius) => {
  if (value === 'none') {
    return '';
  }
  return value === 'sm' ? 'rounded-t-lg' : 'rounded-t-2xl';
};

export const getStatsBottomCornerRadiusClassName = (value: StatsCornerRadius) => {
  if (value === 'none') {
    return '';
  }
  return value === 'sm' ? 'rounded-b-lg' : 'rounded-b-2xl';
};

export const STATS_ICON_CHOICES = [
  'TrendingUp',
  'Users',
  'Award',
  'Target',
  'Zap',
  'Heart',
  'Star',
  'CheckCircle',
  'ThumbsUp',
  'Rocket',
  'Globe',
  'Shield',
  'Clock',
  'DollarSign',
  'Package',
  'Briefcase',
  'Activity',
  'AlertCircle',
  'Anchor',
  'Archive',
  'ArrowUp',
  'ArrowDown',
  'ArrowRight',
  'BarChart',
  'Battery',
  'Bell',
  'Book',
  'Bookmark',
  'Box',
  'Calendar',
  'Camera',
  'Cast',
  'Check',
  'ChevronRight',
  'Circle',
  'Clipboard',
  'Cloud',
  'Code',
  'Coffee',
  'Compass',
  'Copy',
  'CreditCard',
  'Database',
  'Download',
  'Droplet',
  'Edit',
  'Eye',
  'Facebook',
  'File',
  'Filter',
  'Flag',
  'Folder',
  'Gift',
  'GitBranch',
  'Grid',
  'Hash',
  'Headphones',
  'Home',
  'Image',
  'Inbox',
  'Info',
  'Instagram',
  'Key',
  'Layers',
  'Layout',
  'Link',
  'Linkedin',
  'List',
  'Loader',
  'Lock',
  'Mail',
  'Map',
  'MapPin',
  'Maximize',
  'Menu',
  'MessageCircle',
  'Mic',
  'Monitor',
  'Moon',
  'Music',
  'Navigation',
  'Paperclip',
  'Phone',
  'PieChart',
  'Play',
  'Plus',
  'Printer',
  'Radio',
  'RefreshCw',
  'Repeat',
  'Save',
  'Search',
  'Send',
  'Server',
  'Settings',
  'Share',
  'ShoppingCart',
  'Smartphone',
  'Sparkles',
  'Sun',
  'Tag',
  'Terminal',
  'Trash',
  'TrendingDown',
  'Truck',
  'Twitter',
  'Umbrella',
  'Upload',
  'User',
  'Video',
  'Wifi',
  'Youtube',
] as const;
