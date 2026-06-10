import type { MarqueeConfig } from '../_types';

export const DEFAULT_MARQUEE_CONFIG: MarqueeConfig = {
  items: [
    { text: 'Chào mừng đến với cửa hàng', separator: '✦', textStyle: 'normal' },
    { text: 'Miễn phí vận chuyển đơn từ 500K', separator: '★', textStyle: 'normal' },
    { text: 'Giảm 20% cho khách hàng mới', separator: '♦', textStyle: 'normal' },
  ],
  style: 'ribbon',
  direction: 'left',
  speed: 'normal',
  pauseOnHover: true,
  scale: 1,
  uppercase: false,
  hideHeader: true,
  showTitle: true,
  showSubtitle: false,
  subtitle: '',
  headerAlign: 'center',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  spacing: 'normal',
  cornerRadius: 'none',
};

export const DEMO_MARQUEE_ITEMS = [
  { text: '🔥 FLASH SALE — Giảm đến 50%', separator: '✦', textStyle: 'bold' as const },
  { text: '🚚 Giao hàng miễn phí toàn quốc', separator: '★', textStyle: 'normal' as const },
  { text: '💎 Cam kết chính hãng 100%', separator: '♦', textStyle: 'outlined' as const },
  { text: '🎁 Tặng voucher 100K cho đơn đầu tiên', separator: '✦', textStyle: 'normal' as const },
  { text: '⏰ Chỉ còn 24h — Đừng bỏ lỡ!', separator: '★', textStyle: 'shadow' as const },
];

export const SEPARATOR_OPTIONS = [
  { label: 'Khoảng cách trống', value: '  ' },
  { label: 'Sao', value: '✦' },
  { label: 'Ngôi sao', value: '★' },
  { label: 'Kim cương', value: '♦' },
  { label: 'Tròn', value: '●' },
  { label: 'Gạch đứng', value: '|' },
  { label: 'Gạch ngang', value: '—' },
  { label: 'Hoa', value: '🌸' },
  { label: 'Sét', value: '⚡' },
  { label: 'Trái tim', value: '❤' },
  { label: 'Lửa', value: '🔥' },
  { label: 'Ngôi sao 5', value: '⭐' },
  { label: 'Mũi tên', value: '→' },
  { label: 'Chấm nhỏ', value: '·' },
  { label: 'Dấu cộng', value: '+' },
  { label: 'Slash', value: '/' },
  { label: 'Hoa hồng', value: '🌹' },
  { label: 'Lá', value: '🍃' },
  { label: 'Bướm', value: '🦋' },
  { label: 'Kim cương 2', value: '💎' },
  { label: 'Sparkle', value: '✨' },
  { label: 'Tia sáng', value: '☀' },
  { label: 'Trăng', value: '🌙' },
  { label: 'Âm nhạc', value: '♪' },
  { label: 'Vô cực', value: '∞' },
  { label: 'Tam giác', value: '▲' },
  { label: 'Vuông', value: '■' },
  { label: 'Hoa mai', value: '✿' },
  { label: 'Dấu tick', value: '✓' },
  { label: 'Crown', value: '👑' },
  { label: 'Rocket', value: '🚀' },
];

export const TEXT_STYLE_OPTIONS = [
  { label: 'Thường', value: 'normal' },
  { label: 'Viền', value: 'outlined' },
  { label: 'Đậm', value: 'bold' },
  { label: 'Bóng', value: 'shadow' },
];

export const SPEED_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'slow', label: 'Chậm' },
  { value: 'normal', label: 'Bình thường' },
  { value: 'fast', label: 'Nhanh' },
];

export const SCALE_OPTIONS = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
  { value: 5, label: '5x' },
  { value: 6, label: '6x' },
  { value: 7, label: '7x' },
  { value: 8, label: '8x' },
  { value: 9, label: '9x' },
  { value: 10, label: '10x' },
];

/** Speed gaps are now very noticeable */
export const getSpeedDuration = (speed: string, itemCount: number): number => {
  const base = speed === 'slow' ? 10 : speed === 'fast' ? 3 : 4;
  return base * Math.max(itemCount, 1);
};
