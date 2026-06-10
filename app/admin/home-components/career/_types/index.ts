import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
export interface JobPosition {
  id?: string | number;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
}

export type CareerStyle = 'cards' | 'list' | 'minimal' | 'table' | 'featured' | 'timeline';

export type CareerBrandMode = 'single' | 'dual';

export type CareerHarmony = 'analogous' | 'complementary' | 'triadic';

export type CareerDesktopColumns = 3 | 4;
export type CareerCornerRadius = 'none' | 'sm' | 'lg';
export type CareerLogoSize = 'small' | 'medium' | 'large';


export interface CareerTexts {
  subtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  ctaButton?: string;
  remainingLabel?: string;
}

export interface CareerConfig {
  jobs: JobPosition[];
  spacing?: SectionSpacing;
  style: CareerStyle;
  texts?: CareerTexts;
  harmony?: CareerHarmony;
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  desktopColumns?: CareerDesktopColumns;
  cornerRadius?: CareerCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  logoSize?: CareerLogoSize;
}
