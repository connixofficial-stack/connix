'use client';

import type { ImageAspectRatioInput } from '@/lib/products/image-aspect-ratio';
import type { PartnersStyle } from '../_types';

export const PARTNERS_STYLES = [
  { id: 'grid' as const, label: '(1) Dạng lưới' },
  { id: 'marquee' as const, label: '(2) Chạy ngang' },
  { id: 'badge' as const, label: '(3) Huy hiệu' },
  { id: 'carousel' as const, label: '(4) Trượt ngang' },
  { id: 'logoCloud' as const, label: '(5) Cụm logo' },
  { id: 'glassLogoCloud' as const, label: '(6) Hiệu ứng kính' },
  { id: 'clean' as const, label: '(7) Tối giản' },
  { id: 'divider' as const, label: '(8) Dòng kẻ' },
];

export const PARTNERS_CROP_ASPECT_RATIO_BY_STYLE: Record<PartnersStyle, ImageAspectRatioInput> = {
  grid: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  marquee: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  badge: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  carousel: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  logoCloud: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  glassLogoCloud: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  clean: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
  divider: { label: 'Tự do', value: undefined, cssValue: undefined } as any,
};
