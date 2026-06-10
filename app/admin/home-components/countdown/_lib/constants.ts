import type { CountdownConfigState, CountdownStyle } from '../_types';
import { DEFAULT_SECTION_SPACING } from '../../_shared/types/sectionSpacing';
import { DEFAULT_COUNTDOWN_CORNER_RADIUS } from '../_types';

export const COUNTDOWN_STYLES: Array<{ id: CountdownStyle; label: string }> = [
  { id: 'banner', label: '(1) Thanh ngang' },
  { id: 'floating', label: '(2) Khối nổi' },
  { id: 'minimal', label: '(3) Tối giản' },
  { id: 'split', label: '(4) Chia đôi' },
  { id: 'sticky', label: '(5) Dính cạnh' },
  { id: 'popup', label: '(6) Bật lên' },
];

export const DEFAULT_COUNTDOWN_END_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

export const DEFAULT_COUNTDOWN_CONFIG: CountdownConfigState = {
  heading: 'Flash Sale - Giảm giá sốc!',
  subHeading: 'Ưu đãi có hạn',
  description: 'Nhanh tay đặt hàng trước khi hết thời gian khuyến mãi',
  endDate: DEFAULT_COUNTDOWN_END_DATE,
  buttonText: 'Mua ngay',
  buttonLink: '/products',
  backgroundImage: '',
  discountText: '-50%',
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
  spacing: DEFAULT_SECTION_SPACING,
  cornerRadius: DEFAULT_COUNTDOWN_CORNER_RADIUS,
  style: 'banner',
};
