import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { HomeComponentCornerRadius } from '../../_shared/components/HomeComponentDisplaySettingsSection';
export type CountdownStyle = 'banner' | 'floating' | 'minimal' | 'split' | 'sticky' | 'popup';

export type CountdownBrandMode = 'single' | 'dual';
export type CountdownHarmony = 'analogous' | 'complementary' | 'triadic';
export type CountdownCornerRadius = HomeComponentCornerRadius;


export interface CountdownConfig {
  heading: string;
  subHeading: string;
  description: string;
  endDate: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  discountText: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  spacing?: SectionSpacing;
  cornerRadius?: CountdownCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  style?: CountdownStyle;
  harmony?: CountdownHarmony;
}

export interface CountdownConfigState extends CountdownConfig {
  style: CountdownStyle;
  cornerRadius: CountdownCornerRadius;
}

export const DEFAULT_COUNTDOWN_CORNER_RADIUS: CountdownCornerRadius = 'lg';

export const normalizeCountdownCornerRadius = (
  value: unknown,
  noBorderRadius?: unknown,
): CountdownCornerRadius => {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'small') {
    return 'sm';
  }

  if (value === 'large') {
    return 'lg';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_COUNTDOWN_CORNER_RADIUS;
};

export const getCountdownCornerRadiusClassName = (
  value: CountdownCornerRadius = DEFAULT_COUNTDOWN_CORNER_RADIUS,
) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-lg';
  }

  return 'rounded-2xl';
};
