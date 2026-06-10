import type { Id } from '@/convex/_generated/dataModel';
import type { ClientEditorItem, ClientItem, ClientsHeaderAlign } from '../_types';

export interface NormalizedClientItem {
  key: string;
  url: string;
  link: string;
  storageId?: Id<'_storage'>;
}

export const normalizeClientsHeaderAlign = (value: unknown): ClientsHeaderAlign => (
  value === 'center' || value === 'right' || value === 'left' ? value : 'left'
);

const normalizeClientLink = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (
    trimmed.startsWith('/')
    || trimmed.startsWith('#')
    || /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed;
  }

  return '';
};

export const normalizeClientItems = (items: unknown): NormalizedClientItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set<string>();

  return items
    .map((raw, index) => {
      if (!raw || typeof raw !== 'object') {
        return null;
      }

      const source = raw as Record<string, unknown>;
      const url = typeof source.url === 'string' ? source.url.trim() : '';
      const link = normalizeClientLink(source.link);
      const storageId = typeof source.storageId === 'string' ? source.storageId as Id<'_storage'> : undefined;

      if (!url || seen.has(url)) {
        return null;
      }
      seen.add(url);

      return {
        key: `client-${index}`,
        url,
        link,
        ...(storageId ? { storageId } : {}),
      };
    })
    .filter((item): item is NormalizedClientItem => item !== null)
    .slice(0, 8);
};

export const toClientEditorItems = (items: unknown): ClientEditorItem[] => {
  const normalized = normalizeClientItems(items);

  if (normalized.length === 0) {
    return [
      { id: 'item-1', inputMode: 'upload', link: '', url: '' },
    ];
  }

  return normalized.map((item, index) => ({
    id: `item-${index + 1}`,
    inputMode: 'upload',
    link: item.link,
    storageId: item.storageId,
    url: item.url,
  }));
};

export const toPersistClientItems = (items: unknown): ClientItem[] => (
  normalizeClientItems(items).map((item) => ({
    link: item.link,
    ...(item.storageId ? { storageId: item.storageId } : {}),
    url: item.url,
  }))
);
