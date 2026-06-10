import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterColumn {
  id?: number | string;
  title: string;
  links: FooterLink[];
}

export interface FooterSocialLink {
  id?: number | string;
  platform: string;
  url: string;
  icon: string;
}

export type FooterBrandMode = 'single' | 'dual';

export type FooterStyle = 'classic' | 'modern' | 'corporate' | 'minimal' | 'centered' | 'stacked';

export type FooterMaxWidth = '6xl' | '7xl' | '8xl' | '9xl';

export type FooterLogoBackgroundStyle = 'none' | 'flat-light' | 'flat-dark' | 'flat-brand';

export type FooterCornerRadius = 'none' | 'sm' | 'lg';

export interface FooterConfig {
  columns: FooterColumn[];
  copyright: string;
  description: string;
  logo: string;
  logoName: string;
  maxWidth?: FooterMaxWidth;
  logoSizeLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  logoBackgroundStyle?: FooterLogoBackgroundStyle;
  cornerRadius?: FooterCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  showCopyright?: boolean;
  showBctLogo?: boolean;
  bctLogoType?: 'thong-bao' | 'dang-ky';
  bctLogoLink?: string;
  showSocialLinks: boolean;
  useOriginalSocialIconColors?: boolean;
  socialLinks: FooterSocialLink[];
  spacing?: SectionSpacing;
  style: FooterStyle;
}
