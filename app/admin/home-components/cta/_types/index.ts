import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { HomeComponentCornerRadius } from '../../_shared/components/HomeComponentDisplaySettingsSection';

export interface CTAConfig {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  badge?: string;
  backgroundImage?: string;
  harmony?: CTAHarmony;
  spacing?: SectionSpacing;
  cornerRadius?: CTACornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  containerWidth?: CTAContainerWidth;
}

export type CTAStyle = 'banner' | 'centered' | 'split' | 'floating' | 'gradient' | 'minimal';
export type CTAHarmony = 'analogous' | 'complementary' | 'triadic';
export type CTACornerRadius = HomeComponentCornerRadius;
export type CTAContainerWidth = 'max-7xl' | 'full';
