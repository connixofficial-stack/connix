import type { FaqConfig, FaqStyleOption, FaqItem } from '../_types';

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  { id: 1, question: '', answer: '' },
];

export const FAQ_STYLES: FaqStyleOption[] = [
  { id: 'wine-list', label: '(1) Xếp dọc' },
  { id: 'accordion', label: '(2) Đóng mở' },
  { id: 'minimal', label: '(3) Khối nổi' },
  { id: 'timeline', label: '(4) Chia đôi' },
  { id: 'cards', label: '(5) Lưới thẻ' },
  { id: 'two-column', label: '(6) Hai cột' },
  { id: 'tabbed', label: '(7) Phân tab' },
];

export const DEFAULT_FAQ_CONFIG: FaqConfig = {
  description: '',
  buttonText: '',
  buttonLink: '',
  // Header defaults
  hideHeader: false,
  showTitle: true,
  showSubtitle: true,
  subtitle: '',
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  spacing: 'normal',
  cornerRadius: 'none',
  rounded: 'none',
  desktopColumns: 4,
};
