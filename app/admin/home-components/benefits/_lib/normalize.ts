import type { BenefitItem, BenefitPersistItem } from '../_types';
import { DEFAULT_BENEFITS_CONFIG } from './constants';

const buildUiId = (item: BenefitPersistItem, idx: number) => {
  const seed = `${item.icon}|${item.title}|${item.description}|${idx}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return `benefit-${Math.abs(hash).toString(36)}-${idx}`;
};

const toUiItem = (item: BenefitPersistItem, idx: number): BenefitItem => ({
  description: item.description || '',
  icon: item.icon || 'Check',
  id: buildUiId(item, idx),
  title: item.title || '',
});

export const normalizeBenefitItems = (items: any): BenefitItem[] => {
  if (!Array.isArray(items) || items.length === 0) {
    items = DEFAULT_BENEFITS_CONFIG.items;
  }
  const seen = new Map<string, number>();

  return items.map((item: any, idx: number) => {
    const base = buildUiId(item, idx);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    return {
      ...toUiItem(item, idx),
      id: count === 0 ? base : `${base}-${count}`,
    };
  });
};

export const toBenefitPersistItems = (items: BenefitItem[]): BenefitPersistItem[] => {
  return items.map(item => ({
    description: item.description,
    icon: item.icon,
    title: item.title,
  }));
};
