import type { SectionSpacing } from './sectionSpacing';

export interface SectionHeaderConfig {
  hideHeader?: boolean;
  showTitle?: boolean;
  title?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
}

export const DEFAULT_SECTION_HEADER_CONFIG: SectionHeaderConfig = {
  hideHeader: false,
  showTitle: true,
  title: '',
  showSubtitle: true,
  subtitle: '',
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  spacing: 'normal',
};
