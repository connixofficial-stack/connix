'use client';

import type { CustomImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import type { HeroContent, HeroStyle } from '../_types';

export const HERO_STYLES = [
  { id: 'slider' as const, label: '(1) Trượt ảnh' },
  { id: 'fade' as const, label: '(2) Mờ dần' },
  { id: 'builderCoffee' as const, label: '(3) Khối trái' },
  { id: 'bento' as const, label: '(4) Ô ghép' },
  { id: 'triple' as const, label: '(5) Ba ảnh' },
  { id: 'triple2' as const, label: '(6) Ba ảnh 2' },
  { id: 'fullscreen' as const, label: '(7) Tràn màn' },
  { id: 'conquest' as const, label: '(8) Khối bo' },
  { id: 'split' as const, label: '(9) Chia đôi' },
  { id: 'parallax' as const, label: '(10) Cuộn nền' },
];

export const DEFAULT_HERO_CONTENT: HeroContent = {
  badge: 'Nổi bật',
  countdownText: 'Còn 3 ngày',
  description: 'Sản phẩm chất lượng cao với giá thành hợp lý',
  heading: 'Khám phá bộ sưu tập mới nhất',
  primaryButtonText: 'Khám phá ngay',
  primaryButtonLink: '',
  secondaryButtonText: 'Tìm hiểu thêm',
  secondaryButtonLink: '',
  showFullscreenContent: true,
};

export const HERO_CROP_ASPECT_RATIOS: Record<HeroStyle, CustomImageAspectRatio> = {
  bento: { cssValue: '5 / 4', label: '5:4', value: 5 / 4 },
  builderCoffee: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  fade: { cssValue: '21 / 9', label: '21:9', value: 21 / 9 },
  fullscreen: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  conquest: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  parallax: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  slider: { cssValue: '21 / 9', label: '21:9', value: 21 / 9 },
  split: { cssValue: '4 / 3', label: '4:3', value: 4 / 3 },
  triple: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  triple2: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
};

export const getHeroCropAspectRatio = (style: HeroStyle, index = 0): CustomImageAspectRatio => {
  if (style === 'bento') {
    return index === 1
      ? { cssValue: '5 / 2', label: '5:2', value: 5 / 2 }
      : { cssValue: '5 / 4', label: '5:4', value: 5 / 4 };
  }

  return HERO_CROP_ASPECT_RATIOS[style] ?? HERO_CROP_ASPECT_RATIOS.slider;
};
