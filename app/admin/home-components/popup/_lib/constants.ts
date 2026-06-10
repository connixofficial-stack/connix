import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing } from '../../_shared/types/sectionSpacing';
import type { PopupConfig, PopupCornerRadius, PopupFrequency, PopupStyle, PopupTrigger, PopupBackgroundMode } from '../_types';

export const POPUP_STYLES: Array<{ id: PopupStyle; label: string }> = [
  { id: 'center-card', label: '(1) Căn giữa' },
  { id: 'split-visual', label: '(2) Chia đôi' },
  { id: 'bottom-sheet', label: '(3) Trượt dưới' },
  { id: 'side-panel', label: '(4) Trượt góc' },
  { id: 'minimal-alert', label: '(5) Cảnh báo' },
  { id: 'full-screen', label: '(6) Tràn màn' },
  { id: 'image-only', label: '(7) Chỉ ảnh' },
  { id: 'centered-advertisement', label: '(8) Khung lớn' },
];

export const DEFAULT_POPUP_CONFIG: PopupConfig = {
  style: 'center-card',
  eyebrow: 'Thông báo',
  heading: 'Tiêu đề popup',
  description: 'Nội dung ngắn gọn để người dùng hiểu và thực hiện hành động.',
  note: 'Bạn có thể dùng popup này cho xác nhận tuổi, khuyến mãi, thông báo hoặc thu lead.',
  icon: 'ShieldCheck',
  primaryButtonText: 'Đồng ý',
  primaryButtonLink: '#',
  primaryButtonDisabled: false,
  secondaryButtonText: 'Để sau',
  secondaryButtonLink: '#',
  secondaryButtonDisabled: false,
  imageUrl: '',
  storageId: null,
  trigger: 'immediate',
  delaySeconds: 2,
  frequency: 'oncePerSession',
  showIcon: true,
  cornerRadius: 'lg',
  spacing: DEFAULT_SECTION_SPACING,
  colorIntensity: 50,
  showDoNotShowToday: false,
  backgroundMode: 'solid',
};

export const normalizePopupStyle = (value: unknown): PopupStyle => {
  if (value === 'center-card' || value === 'split-visual' || value === 'bottom-sheet' || value === 'side-panel' || value === 'minimal-alert' || value === 'full-screen' || value === 'image-only' || value === 'centered-advertisement') {
    return value;
  }
  return DEFAULT_POPUP_CONFIG.style;
};

export const normalizePopupTrigger = (value: unknown): PopupTrigger => {
  if (value === 'delay') {
    return value;
  }
  return 'immediate';
};

export const normalizePopupFrequency = (value: unknown): PopupFrequency => {
  if (value === 'always' || value === 'oncePerPageView' || value === 'oncePerSession' || value === 'oncePerDevice') {
    return value;
  }
  return DEFAULT_POPUP_CONFIG.frequency;
};

export const normalizePopupBackgroundMode = (value: unknown): PopupBackgroundMode => {
  const valid: PopupBackgroundMode[] = [
    'solid', 
    'brand', 
    'secondary-solid',
    'gradient-brand-to-secondary',
    'gradient-secondary-to-brand',
    'gradient-brand-dark',
    'gradient-secondary-dark',
    'pattern-sunburst',
    'pattern-sunburst-secondary',
    'pattern-sunburst-gradient',
    'glassmorphism',
    'dark-aesthetic'
  ];
  if (typeof value === 'string' && valid.includes(value as any)) {
    return value as PopupBackgroundMode;
  }
  return 'solid';
};

const normalizeString = (value: unknown, fallback: string) => (
  typeof value === 'string' ? value : fallback
);

const normalizePopupLink = (value: unknown) => {
  if (typeof value !== 'string') {
    return '#';
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '#';
};

const normalizeBoolean = (value: unknown, fallback: boolean) => (
  typeof value === 'boolean' ? value : fallback
);

const normalizeCornerRadius = (
  value: unknown,
  legacySquareCorners: unknown,
  legacyNoBorderRadius: unknown,
): PopupCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }
  if (legacySquareCorners === true || legacyNoBorderRadius === true) {
    return 'none';
  }
  return DEFAULT_POPUP_CONFIG.cornerRadius;
};

const normalizePopupSpacing = (value: unknown, legacyNoVerticalMargin: unknown) => {
  if (legacyNoVerticalMargin === true && value === undefined) {
    return 'none';
  }

  return normalizeSectionSpacing(value);
};

const normalizeDelay = (value: unknown) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_POPUP_CONFIG.delaySeconds;
  }
  return Math.min(60, Math.max(0, Math.round(value)));
};

const normalizeColorIntensity = (value: unknown) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_POPUP_CONFIG.colorIntensity;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
};

export const normalizePopupConfig = (config: unknown): PopupConfig => {
  const raw = (typeof config === 'object' && config !== null ? config : {}) as Record<string, unknown>;

  return {
    style: normalizePopupStyle(raw.style),
    eyebrow: normalizeString(raw.eyebrow, DEFAULT_POPUP_CONFIG.eyebrow),
    heading: normalizeString(raw.heading, DEFAULT_POPUP_CONFIG.heading),
    description: normalizeString(raw.description, DEFAULT_POPUP_CONFIG.description),
    note: normalizeString(raw.note, DEFAULT_POPUP_CONFIG.note),
    icon: normalizeString(raw.icon, DEFAULT_POPUP_CONFIG.icon),
    primaryButtonText: normalizeString(raw.primaryButtonText, DEFAULT_POPUP_CONFIG.primaryButtonText),
    primaryButtonLink: normalizePopupLink(raw.primaryButtonLink),
    primaryButtonDisabled: normalizeBoolean(raw.primaryButtonDisabled, DEFAULT_POPUP_CONFIG.primaryButtonDisabled),
    secondaryButtonText: normalizeString(raw.secondaryButtonText, DEFAULT_POPUP_CONFIG.secondaryButtonText),
    secondaryButtonLink: normalizePopupLink(raw.secondaryButtonLink),
    secondaryButtonDisabled: normalizeBoolean(raw.secondaryButtonDisabled, DEFAULT_POPUP_CONFIG.secondaryButtonDisabled),
    imageUrl: normalizeString(raw.imageUrl, DEFAULT_POPUP_CONFIG.imageUrl),
    storageId: typeof raw.storageId === 'string' && raw.storageId.trim() ? raw.storageId : null,
    trigger: normalizePopupTrigger(raw.trigger),
    delaySeconds: normalizeDelay(raw.delaySeconds),
    frequency: normalizePopupFrequency(raw.frequency),
    showIcon: normalizeBoolean(raw.showIcon, DEFAULT_POPUP_CONFIG.showIcon),
    cornerRadius: normalizeCornerRadius(raw.cornerRadius, raw.squareCorners, raw.noBorderRadius),
    spacing: normalizePopupSpacing(raw.spacing, raw.noVerticalMargin),
    colorIntensity: normalizeColorIntensity(raw.colorIntensity),
    showDoNotShowToday: normalizeBoolean(raw.showDoNotShowToday, DEFAULT_POPUP_CONFIG.showDoNotShowToday),
    backgroundMode: normalizePopupBackgroundMode(raw.backgroundMode),
  };
};
