import type { ServiceEditorItem, ServiceItem } from '../_types';

const getMediaType = (value: unknown): 'icon' | 'image' => {
  return value === 'image' ? 'image' : 'icon';
};

export const getServicesMediaAlign = (value: unknown): 'left' | 'center' | 'right' => {
  if (value === 'left' || value === 'right') {
    return value;
  }
  return 'center';
};

export const getServicesHeaderAlign = (value: unknown): 'left' | 'center' | 'right' => {
  if (value === 'center' || value === 'right') {
    return value;
  }
  return 'left';
};

export const getServicesDesktopColumns = (value: unknown): 3 | 4 => {
  return value === 4 ? 4 : 3;
};

export const getServicesMediaPlacement = (value: unknown): 'top' | 'left' => {
  return value === 'left' ? 'left' : 'top';
};

export const normalizeServicesItemsForEditor = (items: unknown): ServiceEditorItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((raw, index) => {
      if (!raw || typeof raw !== 'object') {
        return null;
      }

      const source = raw as Partial<ServiceEditorItem>;
      const fallbackId = 1_000_000 + index;
      const parsedId = typeof source.id === 'number' ? source.id : Number(source.id);
      const mediaType = getMediaType(source.mediaType);

      return {
        id: Number.isFinite(parsedId) ? parsedId : fallbackId,
        mediaType,
        icon: typeof source.icon === 'string' ? source.icon : 'Star',
        image: typeof source.image === 'string' ? source.image : '',
        title: typeof source.title === 'string' ? source.title : '',
        description: typeof source.description === 'string' ? source.description : '',
      } as ServiceEditorItem;
    })
    .filter((item): item is ServiceEditorItem => item !== null);
};

export const toServicesPersistItems = (items: ServiceEditorItem[]): ServiceItem[] => {
  return items.map(({ mediaType, icon, image, title, description }) => ({
    mediaType: mediaType === 'image' ? 'image' : 'icon',
    icon: icon || 'Star',
    image: image || '',
    title,
    description,
  }));
};
