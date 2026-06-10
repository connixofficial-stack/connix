import type { DemoProductCategoryItem } from '../_types';

export const normalizeDemoImageSrc = (value?: string) => {
  const src = value?.trim() ?? '';

  if (!src) {return '';}
  if (src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/')) {
    return src;
  }

  return '';
};

export const sanitizeDemoCategories = (items: DemoProductCategoryItem[]) => (
  items.map((item) => ({
    ...item,
    image: normalizeDemoImageSrc(item.image),
  }))
);
