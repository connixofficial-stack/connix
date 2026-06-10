import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
export interface ContactInfoItem {
  id: number;
  icon: string;
  label: string;
  value: string;
  href?: string;
  fieldKey?: string;
}

export interface ContactSocialLink {
  id: number;
  platform: string;
  icon: string;
  url: string;
}

export type ContactStyle = 'modern' | 'floating' | 'grid' | 'elegant' | 'minimal' | 'centered' | 'kanban';

export type ContactBrandMode = 'single' | 'dual';
export type ContactCornerRadius = 'none' | 'sm' | 'lg';
export type ContactDesktopColumns = 3 | 4;
export type ContactSpacing = SectionSpacing;

export interface ContactConfig {
  showMap: boolean;
  mapEmbed: string;
  contactItems: ContactInfoItem[];
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  formFields: string[];
  socialLinks: ContactSocialLink[];
  useOriginalSocialIconColors?: boolean;
  showForm?: boolean;
  formTitle?: string;
  formDescription?: string;
  submitButtonText?: string;
  responseTimeText?: string;
  texts?: Record<string, string>;
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
  spacing?: ContactSpacing;
  cornerRadius?: ContactCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  desktopColumns?: ContactDesktopColumns;
}

export interface ContactConfigState extends ContactConfig {
  style: ContactStyle;
}
