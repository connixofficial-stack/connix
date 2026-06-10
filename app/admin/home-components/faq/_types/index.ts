import {
  DEFAULT_SECTION_SPACING,
  getSectionSpacingClassName,
  normalizeSectionSpacing,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';
export interface FaqItem {
  id: number | string;
  question: string;
  answer: string;
}

export type FaqStyle = 'accordion' | 'cards' | 'two-column' | 'minimal' | 'timeline' | 'tabbed' | 'wine-list';
export type FaqBrandMode = 'single' | 'dual';
export type FAQHeaderAlign = 'left' | 'center' | 'right';
export type FaqRounded = 'none' | 'sm' | 'lg';
export type FaqSpacing = SectionSpacing;

export interface FaqConfig {
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  // Header fields
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: FAQHeaderAlign;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: FaqSpacing;
  cornerRadius?: FaqRounded;
  rounded?: FaqRounded;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  desktopColumns?: 3 | 4;
}

export interface FaqStyleOption {
  id: FaqStyle;
  label: string;
}

export const DEFAULT_FAQ_SPACING: FaqSpacing = DEFAULT_SECTION_SPACING;
export const DEFAULT_FAQ_ROUNDED: FaqRounded = 'none';
export const DEFAULT_FAQ_DESKTOP_COLUMNS: 3 | 4 = 4;

export const normalizeFaqSpacing = (value: unknown, noVerticalMargin?: unknown): FaqSpacing => {
  if (noVerticalMargin === true) {
    return 'none';
  }

  return normalizeSectionSpacing(value);
};
export const getFaqSectionSpacingClassName = getSectionSpacingClassName;

export const normalizeFaqRounded = (value: unknown, noBorderRadius?: unknown): FaqRounded => {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_FAQ_ROUNDED;
};

export const normalizeFaqDesktopColumns = (value: unknown): 3 | 4 => {
  if (value === 3 || value === 4) {
    return value;
  }

  return DEFAULT_FAQ_DESKTOP_COLUMNS;
};

export const getFaqRoundedClassName = (rounded: FaqRounded = DEFAULT_FAQ_ROUNDED) => {
  if (rounded === 'none') {
    return 'rounded-none';
  }

  if (rounded === 'sm') {
    return 'rounded-xl';
  }

  return 'rounded-[2rem]';
};
