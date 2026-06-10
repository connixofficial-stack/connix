import type {
  ServiceListConfig,
  ServiceListStyle,
} from '../_types';
import {
  DEFAULT_SERVICE_LIST_CARD_RADIUS,
  DEFAULT_SERVICE_LIST_DESKTOP_COLUMNS,
  DEFAULT_SERVICE_LIST_SPACING,
} from '../_types';

export const SERVICE_LIST_STYLES: { id: ServiceListStyle; label: string }[] = [
  { id: 'grid', label: '(1) Dạng lưới' },
  { id: 'bento', label: '(2) Ô ghép' },
  { id: 'list', label: '(3) Xếp dọc' },
  { id: 'carousel', label: '(4) Trượt ngang' },
  { id: 'minimal', label: '(5) Tối giản' },
  { id: 'showcase', label: '(6) Trưng bày' },
  { id: 'kanban', label: '(7) Lưới thẻ' }
];

export const DEFAULT_SERVICE_LIST_CONFIG: ServiceListConfig = {
  cardRadius: DEFAULT_SERVICE_LIST_CARD_RADIUS,
  desktopColumns: DEFAULT_SERVICE_LIST_DESKTOP_COLUMNS,
  itemCount: 8,
  selectionMode: 'auto',
  spacing: DEFAULT_SERVICE_LIST_SPACING,
  sortBy: 'newest',
};
