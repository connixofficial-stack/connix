import type {
  BenefitsConfig,
  BenefitsCornerRadius,
  BenefitsEditorState,
  BenefitsHarmony,
  BenefitsHeaderAlign,
  BenefitsStyleOption,
} from '../_types';
import { normalizeSectionSpacing, type SectionSpacing } from '../../_shared/types/sectionSpacing';

export const DEFAULT_BENEFITS_HARMONY: BenefitsHarmony = 'analogous';
export const DEFAULT_BENEFITS_CORNER_RADIUS: BenefitsCornerRadius = 'lg';

export const BENEFITS_STYLES: BenefitsStyleOption[] = [
  { id: '1', label: '(1) Số liệu' },
  { id: '2', label: '(2) Vạch đáy' },
  { id: '3', label: '(3) Đường cong' },
  { id: '4', label: '(4) Chia đôi' },
  { id: '5', label: '(5) Ô ghép' },
  { id: '6', label: '(6) Thẻ nổi' },
];

export const BENEFITS_HARMONY_OPTIONS: Array<{ value: BenefitsHarmony; label: string }> = [
  { value: 'analogous', label: 'Analogous (+30°)' },
  { value: 'complementary', label: 'Complementary (180°)' },
  { value: 'triadic', label: 'Triadic (120°)' },
];

export const BENEFITS_HEADER_ALIGN_OPTIONS: Array<{ value: BenefitsHeaderAlign; label: string }> = [
  { value: 'left', label: 'Trái' },
  { value: 'center', label: 'Giữa' },
  { value: 'right', label: 'Phải' },
];

export const BENEFITS_GRID_COLUMNS_DESKTOP: Array<{ value: 3 | 4 | 5; label: string }> = [
  { value: 3, label: '3 cột' },
  { value: 4, label: '4 cột' },
  { value: 5, label: '5 cột' },
];

export const normalizeBenefitsCornerRadius = (value: unknown, noBorderRadius?: unknown): BenefitsCornerRadius => {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'small') {
    return 'sm';
  }

  if (value === 'large') {
    return 'lg';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_BENEFITS_CORNER_RADIUS;
};

export const normalizeBenefitsSpacing = (value: unknown, noVerticalMargin?: unknown): SectionSpacing => (
  noVerticalMargin === true ? 'none' : normalizeSectionSpacing(value)
);

export const getBenefitsCornerRadiusClassName = (value: BenefitsCornerRadius = DEFAULT_BENEFITS_CORNER_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-2xl';
};

export const DEFAULT_BENEFITS_CONFIG: BenefitsConfig = {
  buttonLink: '',
  buttonText: '',
  gridColumnsDesktop: 4,
  gridColumnsMobile: 2,
  headerAlign: 'left',
  highlightIndex: 2,
  cornerRadius: DEFAULT_BENEFITS_CORNER_RADIUS,
  harmony: DEFAULT_BENEFITS_HARMONY,
  heading: 'Giá trị cốt lõi',
  items: [
    {
      description: '',
      icon: 'Star',
      title: '',
    },
  ],
  showDecorativeVisuals: true,
  showItemNumbers: true,
  style: '1',
  subHeading: 'Vì sao chọn chúng tôi?',
  visualImage: '',
  // Shared header config
  hideHeader: false,
  showTitle: true,
  showSubtitle: true,
  subtitle: '',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
};

export const DEFAULT_BENEFITS_EDITOR_STATE: BenefitsEditorState = {
  buttonLink: DEFAULT_BENEFITS_CONFIG.buttonLink ?? '',
  buttonText: DEFAULT_BENEFITS_CONFIG.buttonText ?? '',
  gridColumnsDesktop: DEFAULT_BENEFITS_CONFIG.gridColumnsDesktop ?? 4,
  gridColumnsMobile: DEFAULT_BENEFITS_CONFIG.gridColumnsMobile ?? 2,
  headerAlign: DEFAULT_BENEFITS_CONFIG.headerAlign ?? 'left',
  highlightIndex: DEFAULT_BENEFITS_CONFIG.highlightIndex ?? 2,
  cornerRadius: DEFAULT_BENEFITS_CORNER_RADIUS,
  harmony: DEFAULT_BENEFITS_HARMONY,
  heading: DEFAULT_BENEFITS_CONFIG.heading ?? '',
  items: [
    {
      description: '',
      icon: 'Star',
      id: 'benefit-default-1',
      title: '',
    },
  ],
  showDecorativeVisuals: DEFAULT_BENEFITS_CONFIG.showDecorativeVisuals ?? true,
  showItemNumbers: DEFAULT_BENEFITS_CONFIG.showItemNumbers ?? true,
  style: DEFAULT_BENEFITS_CONFIG.style,
  subHeading: DEFAULT_BENEFITS_CONFIG.subHeading ?? '',
  visualImage: DEFAULT_BENEFITS_CONFIG.visualImage ?? '',
  // Shared header config
  hideHeader: DEFAULT_BENEFITS_CONFIG.hideHeader ?? false,
  showTitle: DEFAULT_BENEFITS_CONFIG.showTitle ?? true,
  showSubtitle: DEFAULT_BENEFITS_CONFIG.showSubtitle ?? true,
  subtitle: DEFAULT_BENEFITS_CONFIG.subtitle ?? '',
  titleColorPrimary: DEFAULT_BENEFITS_CONFIG.titleColorPrimary ?? false,
  subtitleAboveTitle: DEFAULT_BENEFITS_CONFIG.subtitleAboveTitle ?? false,
  uppercaseText: DEFAULT_BENEFITS_CONFIG.uppercaseText ?? false,
  showBadge: DEFAULT_BENEFITS_CONFIG.showBadge ?? true,
  badgeText: DEFAULT_BENEFITS_CONFIG.badgeText ?? '',
};
