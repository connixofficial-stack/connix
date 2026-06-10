import type { CTAConfig, CTAContainerWidth, CTACornerRadius, CTAStyle } from '../_types';

export const CTA_STYLES: CTAStyle[] = ['banner', 'centered', 'split', 'floating', 'gradient', 'minimal'];
export const CTA_CORNER_RADII: CTACornerRadius[] = ['lg', 'sm', 'none'];
export const CTA_CONTAINER_WIDTHS: CTAContainerWidth[] = ['max-7xl', 'full'];

export const normalizeCTAStyle = (value: unknown): CTAStyle => (
  typeof value === 'string' && CTA_STYLES.includes(value as CTAStyle)
    ? (value as CTAStyle)
    : 'banner'
);

export const DEFAULT_CTA_CONFIG: CTAConfig = {
  badge: '',
  buttonLink: '',
  buttonText: '',
  containerWidth: 'max-7xl',
  cornerRadius: 'lg',
  description: '',
  secondaryButtonLink: '',
  secondaryButtonText: '',
  spacing: 'normal',
  title: '',
};

export const normalizeCTACornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): CTACornerRadius => {
  if (legacyNoBorderRadius === true) {
    return 'none';
  }
  if (value === 'large') {
    return 'lg';
  }
  if (value === 'small') {
    return 'sm';
  }
  return typeof value === 'string' && CTA_CORNER_RADII.includes(value as CTACornerRadius)
    ? (value as CTACornerRadius)
    : DEFAULT_CTA_CONFIG.cornerRadius ?? 'lg';
};

export const normalizeCTAContainerWidth = (value: unknown): CTAContainerWidth => (
  typeof value === 'string' && CTA_CONTAINER_WIDTHS.includes(value as CTAContainerWidth)
    ? (value as CTAContainerWidth)
    : DEFAULT_CTA_CONFIG.containerWidth ?? 'max-7xl'
);
