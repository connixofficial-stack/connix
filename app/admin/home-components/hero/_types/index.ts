'use client';

import type { ImageItem } from '../../../components/MultiImageUploader';
import {
  DEFAULT_SECTION_SPACING,
  normalizeSectionSpacing,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';
import type { HomeComponentCornerRadius } from '../../_shared/components/HomeComponentDisplaySettingsSection';

export type HeroStyle = 'slider' | 'fade' | 'builderCoffee' | 'bento' | 'triple' | 'triple2' | 'fullscreen' | 'conquest' | 'split' | 'parallax';
export type HeroHarmony = 'analogous' | 'complementary' | 'triadic';
export type HeroSpacing = SectionSpacing;
export type HeroCornerRadius = HomeComponentCornerRadius;

export interface HeroContent {
  badge?: string;
  heading?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  countdownText?: string;
  showFullscreenContent?: boolean;
  /** Màu cho text highlight trong heading, dùng cú pháp {text} */
  highlightColor?: string;
  /** Căn chỉnh text: left | center | right */
  textAlign?: 'left' | 'center' | 'right';
  /** Màu nền nút chính (override brand color) */
  primaryButtonColor?: string;
  /** Màu nền nút phụ */
  secondaryButtonColor?: string;
  /** Độ đậm backdrop overlay (0-100), default ~50 */
  overlayOpacity?: number;
}

export interface HeroSlide extends ImageItem {
  id: string | number;
  url: string;
  link: string;
  mediaType?: 'image' | 'video';
}

export const DEFAULT_HERO_SPACING: HeroSpacing = DEFAULT_SECTION_SPACING;
export const normalizeHeroSpacing = normalizeSectionSpacing;

export const DEFAULT_HERO_CORNER_RADIUS: HeroCornerRadius = 'lg';

export const normalizeHeroCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): HeroCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }
  return legacyNoBorderRadius === true ? 'none' : DEFAULT_HERO_CORNER_RADIUS;
};

export const getHeroCornerRadiusClassName = (value: HeroCornerRadius) => {
  if (value === 'none') {
    return '';
  }
  return value === 'sm' ? 'rounded-lg' : 'rounded-2xl';
};

