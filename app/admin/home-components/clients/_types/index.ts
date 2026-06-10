import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { Id } from '@/convex/_generated/dataModel';
export interface ClientItem {
  url: string;
  link: string;
  storageId?: Id<'_storage'>;
}

export interface ClientEditorItem extends ClientItem {
  id: string;
  inputMode: 'upload' | 'url';
  [key: string]: unknown;
}

export type ClientsStyle = 'layout01' | 'layout02' | 'layout03' | 'layout04' | 'layout05' | 'layout06' | 'layout07' | 'layout08';
export type ClientsBrandMode = 'single' | 'dual';
export type ClientsHarmony = 'analogous' | 'complementary' | 'triadic';
export type ClientsHeaderAlign = 'left' | 'center' | 'right';
export type ClientsCornerRadius = 'none' | 'sm' | 'lg';

export const DEFAULT_CLIENTS_CORNER_RADIUS: ClientsCornerRadius = 'lg';

export const normalizeClientsCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): ClientsCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  if (legacyNoBorderRadius === true) {
    return 'none';
  }

  return DEFAULT_CLIENTS_CORNER_RADIUS;
};

export const getClientsCornerRadiusClassName = (
  value: ClientsCornerRadius = DEFAULT_CLIENTS_CORNER_RADIUS,
) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-xl md:rounded-2xl';
};

export interface ClientsConfig {
  items: ClientItem[];
  style: ClientsStyle;
  harmony?: ClientsHarmony;
  // Shared header config
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: ClientsHeaderAlign;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  cornerRadius?: ClientsCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}
