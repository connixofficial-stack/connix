import type {
  CareerConfig,
  CareerCornerRadius,
  CareerDesktopColumns,
  CareerHarmony,
  CareerLogoSize,
  CareerStyle,
  CareerTexts,
  JobPosition,
} from '../_types';
import { DEFAULT_SECTION_SPACING } from '../../_shared/types/sectionSpacing';

export const DEFAULT_CAREER_HARMONY: CareerHarmony = 'analogous';
export const DEFAULT_CAREER_DESKTOP_COLUMNS: CareerDesktopColumns = 3;
export const DEFAULT_CAREER_CORNER_RADIUS: CareerCornerRadius = 'lg';
export const DEFAULT_CAREER_LOGO_SIZE: CareerLogoSize = 'medium';

export const DEFAULT_CAREER_TEXTS: CareerTexts = {
  subtitle: 'Tham gia đội ngũ của chúng tôi',
  emptyTitle: 'Chưa có vị trí tuyển dụng',
  emptyDescription: 'Thêm vị trí đầu tiên để bắt đầu',
  ctaButton: 'Ứng tuyển ngay',
  remainingLabel: 'vị trí khác',
};

export const CAREER_STYLES: Array<{ id: CareerStyle; label: string }> = [
  { id: 'cards', label: '(1) Dạng thẻ' },
  { id: 'list', label: '(2) Xếp dọc' },
  { id: 'minimal', label: '(3) Tối giản' },
  { id: 'table', label: '(4) Dạng bảng' },
  { id: 'featured', label: '(5) Nổi bật' },
  { id: 'timeline', label: '(6) Quy trình' },
];

export const normalizeCareerHarmony = (value?: string): CareerHarmony => {
  if (value === 'complementary' || value === 'triadic' || value === 'analogous') {
    return value;
  }
  return 'analogous';
};

export const normalizeCareerDesktopColumns = (value: unknown): CareerDesktopColumns => (
  value === 4 ? 4 : 3
);

export const normalizeCareerCornerRadius = (value: unknown, noBorderRadius?: unknown): CareerCornerRadius => {
  if (noBorderRadius === true) {
    return 'none';
  }
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }
  if (value === 'small') {
    return 'sm';
  }
  if (value === 'medium' || value === 'large') {
    return 'lg';
  }
  return DEFAULT_CAREER_CORNER_RADIUS;
};

export const normalizeCareerLogoSize = (value: unknown): CareerLogoSize => {
  if (value === 'small' || value === 'medium' || value === 'large') {
    return value;
  }
  return DEFAULT_CAREER_LOGO_SIZE;
};

export const createCareerJob = (overrides?: Partial<JobPosition>): JobPosition => ({
  title: '',
  department: '',
  location: '',
  type: '',
  salary: '',
  description: '',
  ...overrides,
});

export const DEFAULT_CAREER_CONFIG: CareerConfig = {
  jobs: [createCareerJob()],
  style: 'cards',
  texts: DEFAULT_CAREER_TEXTS,
  harmony: DEFAULT_CAREER_HARMONY,
  spacing: DEFAULT_SECTION_SPACING,
  hideHeader: false,
  showTitle: true,
  subtitle: DEFAULT_CAREER_TEXTS.subtitle,
  showSubtitle: true,
  headerAlign: 'center',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: false,
  badgeText: '',
  desktopColumns: DEFAULT_CAREER_DESKTOP_COLUMNS,
  cornerRadius: DEFAULT_CAREER_CORNER_RADIUS,
  noBorderRadius: false,
  noVerticalMargin: false,
  logoSize: DEFAULT_CAREER_LOGO_SIZE,
};
