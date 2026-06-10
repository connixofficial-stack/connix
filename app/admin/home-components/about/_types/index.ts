import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
export interface AboutPersistStat {
  value: string;
  label: string;
}

export interface AboutPersistFeature {
  title: string;
  mediaType?: 'icon' | 'image';
  iconName?: string;
  image?: string;
}

export interface AboutEditorStat extends AboutPersistStat {
  id: string;
}

export type AboutStyle = 'classic' | 'bento' | 'minimal' | 'split' | 'timeline' | 'showcase' | 'spaCollage' | 'solarFeature' | 'kanban';
export type AboutBrandMode = 'single' | 'dual';
export type AboutHarmony = 'analogous' | 'complementary' | 'triadic';
export type AboutCornerRadius = 'none' | 'sm' | 'lg';

export interface AboutConfig {
  layout?: string;
  subHeading: string;
  heading: string;
  highlightText?: string;
  description: string;
  phone?: string;
  image: string;
  images?: string[];
  features?: AboutPersistFeature[];
  stats?: AboutPersistStat[];
  buttonText: string;
  buttonLink: string;
  style?: AboutStyle;
  imageCaption?: string;
  harmony?: AboutHarmony;
  // Shared header config
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
  spacing?: SectionSpacing;
  cornerRadius?: AboutCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

export interface AboutEditorFeature extends AboutPersistFeature {
  id: string;
}

export interface AboutEditorState {
  subHeading: string;
  heading: string;
  highlightText: string;
  description: string;
  phone: string;
  image: string;
  images: string[];
  imageCaption: string;
  buttonText: string;
  buttonLink: string;
  features: AboutEditorFeature[];
  stats: AboutEditorStat[];
  style: AboutStyle;
  // Shared header config
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
  spacing?: SectionSpacing;
  cornerRadius?: AboutCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

export interface AboutStyleOption {
  id: AboutStyle;
  label: string;
}
