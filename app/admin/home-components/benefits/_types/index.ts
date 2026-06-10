import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
export interface BenefitPersistItem {
  icon: string;
  title: string;
  description: string;
}

export interface BenefitItem extends BenefitPersistItem {
  id: string;
}

export type BenefitsStyle = '1' | '2' | '3' | '4' | '5' | '6';
export type LegacyBenefitsStyle = 'cards' | 'list' | 'bento' | 'row' | 'carousel' | 'timeline';
export type BenefitsBrandMode = 'single' | 'dual';
export type BenefitsHarmony = 'analogous' | 'complementary' | 'triadic';
export type BenefitsHeaderAlign = 'left' | 'center' | 'right';
export type BenefitsCornerRadius = 'none' | 'sm' | 'lg';

export interface BenefitsConfig {
  items: BenefitPersistItem[];
  style: BenefitsStyle;
  subHeading?: string;
  heading?: string;
  headerAlign?: BenefitsHeaderAlign;
  gridColumnsDesktop?: 3 | 4 | 5;
  gridColumnsMobile?: 1 | 2;
  buttonText?: string;
  buttonLink?: string;
  visualImage?: string;
  highlightIndex?: number;
  showItemNumbers?: boolean;
  showDecorativeVisuals?: boolean;
  cornerRadius?: BenefitsCornerRadius;
  harmony?: BenefitsHarmony;
  // Shared header config
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

export interface BenefitsEditorState {
  items: BenefitItem[];
  style: BenefitsStyle;
  subHeading: string;
  heading: string;
  headerAlign: BenefitsHeaderAlign;
  gridColumnsDesktop: 3 | 4 | 5;
  gridColumnsMobile: 1 | 2;
  buttonText: string;
  buttonLink: string;
  visualImage: string;
  highlightIndex: number;
  showItemNumbers: boolean;
  showDecorativeVisuals: boolean;
  cornerRadius: BenefitsCornerRadius;
  harmony: BenefitsHarmony;
  // Shared header config
  hideHeader: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  subtitle: string;
  titleColorPrimary: boolean;
  subtitleAboveTitle: boolean;
  uppercaseText: boolean;
  showBadge: boolean;
  badgeText: string;
}

export interface BenefitsStyleOption {
  id: BenefitsStyle;
  label: string;
}
