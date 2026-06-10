'use client';

import type { GalleryItem, GalleryConfig } from '../_types';

export const GALLERY_STYLES = [
  { id: 'spotlight' as const, label: '(1) Tiêu điểm' },
  { id: 'explore' as const, label: '(2) Nghiêng góc' },
  { id: 'stories' as const, label: '(3) Dạng tin' },
  { id: 'grid' as const, label: '(4) Dạng lưới' },
  { id: 'marquee' as const, label: '(5) Chạy ngang' },
  { id: 'masonry' as const, label: '(6) So le' },
];

export const TRUST_BADGES_STYLES = [
  { id: 'grid' as const, label: '(1) Dạng lưới' },
  { id: 'cards' as const, label: '(2) Dạng thẻ' },
  { id: 'stack' as const, label: '(3) Xếp chồng' },
  { id: 'wall' as const, label: '(4) Mảng tường' },
  { id: 'carousel' as const, label: '(5) Trượt ngang' },
  { id: 'seal' as const, label: '(6) Con dấu' },
];

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  { id: 'item-1', link: '', name: '', url: '' },
  { id: 'item-2', link: '', name: '', url: '' },
];

export const DEFAULT_GALLERY_CONFIG: GalleryConfig = {
  items: DEFAULT_GALLERY_ITEMS,
  style: 'spotlight',
  hideHeader: false,
  showTitle: true,
  subtitle: '',
  showSubtitle: true,
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
};

type GalleryMarqueeItemLike = {
  url?: string;
  link?: string;
  name?: string;
};

export const getGalleryMarqueeBaseItems = <T extends GalleryMarqueeItemLike>(items: T[]): T[] => {
  const seen = new Set<string>();

  return items
    .filter((item) => item.url?.trim())
    .filter((item) => {
      const dedupeKey = `${item.url ?? ''}::${item.link ?? ''}::${item.name ?? ''}`;
      if (seen.has(dedupeKey)) {
        return false;
      }
      seen.add(dedupeKey);
      return true;
    });
};
