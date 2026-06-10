import type {
  PricingConfig,
  PricingPlan,
  PricingStyle,
} from '../_types';
import { DEFAULT_PRICING_CORNER_RADIUS, normalizePricingCornerRadius } from '../_types';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing, type SectionSpacing } from '../../_shared/types/sectionSpacing';

export const PRICING_STYLES: Array<{ id: PricingStyle; label: string }> = [
  { id: 'cards', label: '(1) Dạng thẻ' },
  { id: 'horizontal', label: '(2) Hàng ngang' },
  { id: 'minimal', label: '(3) Tối giản' },
  { id: 'comparison', label: '(4) So sánh' },
  { id: 'featured', label: '(5) Nổi bật' },
  { id: 'compact', label: '(6) Thu gọn' },
  { id: 'tabbed', label: '(7) Phân tab' },
  { id: 'construction', label: '(8) Góc cạnh' },
];

const DEFAULT_PRICING_STYLE: PricingStyle = 'cards';

const DEFAULT_PRICING_PLAN: PricingPlan = {
  id: 1,
  name: 'Gói cơ bản',
  price: '0',
  yearlyPrice: '0',
  period: '/tháng',
  features: ['Tính năng mặc định'],
  isPopular: false,
  buttonText: 'Chọn gói',
  buttonLink: '',
};

export const DEFAULT_PRICING_TEXTS: Record<string, string> = {
  popularBadge: 'Phổ biến',
  hotBadge: 'HOT',
  recommendedBadge: 'Khuyên dùng',
  featuredBadge: '★ Phổ biến nhất',
  emptyStateTitle: 'Chưa có gói nào',
  emptyStateDescription: 'Thêm gói để hiển thị bảng giá',
  defaultPlanName: 'Gói',
  defaultButtonText: 'Chọn gói',
  defaultFeature: 'Tính năng đang cập nhật',
  startNowButton: 'Bắt đầu ngay',
  selectButton: 'Chọn',
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  monthlyLabel: 'Hàng tháng',
  plans: [DEFAULT_PRICING_PLAN],
  showBillingToggle: true,
  style: DEFAULT_PRICING_STYLE,
  subtitle: 'Chọn gói phù hợp với nhu cầu của bạn',
  yearlyLabel: 'Hàng năm',
  yearlySavingText: 'Tiết kiệm 17%',
  texts: DEFAULT_PRICING_TEXTS,
  // Shared header config
  hideHeader: false,
  showTitle: true,
  showSubtitle: true,
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  spacing: DEFAULT_SECTION_SPACING,
  gridCols: 3,
  cornerRadius: DEFAULT_PRICING_CORNER_RADIUS,
};

const isPricingStyle = (value: unknown): value is PricingStyle => (
  value === 'cards'
  || value === 'horizontal'
  || value === 'minimal'
  || value === 'comparison'
  || value === 'featured'
  || value === 'compact'
  || value === 'tabbed'
  || value === 'construction'
);

const normalizeFeatureList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((feature) => String(feature ?? '').trim())
    .filter((feature) => feature.length > 0);
};

export const normalizePricingPlan = (value: unknown, index: number): PricingPlan => {
  const raw = (typeof value === 'object' && value !== null)
    ? value as Partial<PricingPlan>
    : {};

  return {
    id: typeof raw.id === 'number' || typeof raw.id === 'string' ? raw.id : index + 1,
    name: String(raw.name ?? '').trim(),
    price: String(raw.price ?? '').trim(),
    yearlyPrice: String(raw.yearlyPrice ?? '').trim(),
    period: String(raw.period ?? '/tháng').trim() || '/tháng',
    features: normalizeFeatureList(raw.features),
    isPopular: Boolean(raw.isPopular),
    buttonText: String(raw.buttonText ?? 'Chọn gói').trim() || 'Chọn gói',
    buttonLink: String(raw.buttonLink ?? '').trim(),
  };
};

export const normalizePricingConfig = (value: unknown): PricingConfig => {
  const raw = (typeof value === 'object' && value !== null)
    ? value as Partial<PricingConfig>
    : {};

  const texts = (typeof raw.texts === 'object' && raw.texts !== null)
    ? { ...DEFAULT_PRICING_TEXTS, ...raw.texts }
    : DEFAULT_PRICING_TEXTS;

  return {
    style: isPricingStyle(raw.style) ? raw.style : DEFAULT_PRICING_STYLE,
    subtitle: String(raw.subtitle ?? DEFAULT_PRICING_CONFIG.subtitle),
    showBillingToggle: raw.showBillingToggle !== false,
    monthlyLabel: String(raw.monthlyLabel ?? DEFAULT_PRICING_CONFIG.monthlyLabel),
    yearlyLabel: String(raw.yearlyLabel ?? DEFAULT_PRICING_CONFIG.yearlyLabel),
    yearlySavingText: String(raw.yearlySavingText ?? DEFAULT_PRICING_CONFIG.yearlySavingText),
    texts,
    plans: Array.isArray(raw.plans)
      ? raw.plans.map((plan, index) => normalizePricingPlan(plan, index))
      : DEFAULT_PRICING_CONFIG.plans.map((plan, index) => normalizePricingPlan(plan, index)),
    // Shared header config
    hideHeader: typeof raw.hideHeader === 'boolean' ? raw.hideHeader : (DEFAULT_PRICING_CONFIG.hideHeader ?? false),
    showTitle: typeof raw.showTitle === 'boolean' ? raw.showTitle : (DEFAULT_PRICING_CONFIG.showTitle ?? true),
    showSubtitle: typeof raw.showSubtitle === 'boolean' ? raw.showSubtitle : (DEFAULT_PRICING_CONFIG.showSubtitle ?? true),
    headerAlign: raw.headerAlign === 'center' || raw.headerAlign === 'right' ? raw.headerAlign : (DEFAULT_PRICING_CONFIG.headerAlign ?? 'left'),
    titleColorPrimary: typeof raw.titleColorPrimary === 'boolean' ? raw.titleColorPrimary : (DEFAULT_PRICING_CONFIG.titleColorPrimary ?? false),
    subtitleAboveTitle: typeof raw.subtitleAboveTitle === 'boolean' ? raw.subtitleAboveTitle : (DEFAULT_PRICING_CONFIG.subtitleAboveTitle ?? false),
    uppercaseText: typeof raw.uppercaseText === 'boolean' ? raw.uppercaseText : (DEFAULT_PRICING_CONFIG.uppercaseText ?? false),
    showBadge: typeof raw.showBadge === 'boolean' ? raw.showBadge : (DEFAULT_PRICING_CONFIG.showBadge ?? true),
    badgeText: typeof raw.badgeText === 'string' ? raw.badgeText : (DEFAULT_PRICING_CONFIG.badgeText ?? ''),
    spacing: normalizePricingSpacing(raw.spacing, raw.noVerticalMargin),
    gridCols: raw.gridCols === 4 ? 4 : 3,
    cornerRadius: normalizePricingCornerRadius(raw.cornerRadius, raw.noBorderRadius),
  };
};

export const normalizePricingSpacing = (value: unknown, noVerticalMargin?: unknown): SectionSpacing => (
  noVerticalMargin === true ? 'none' : normalizeSectionSpacing(value)
);
