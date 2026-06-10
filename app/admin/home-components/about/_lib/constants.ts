import type {
  AboutConfig,
  AboutCornerRadius,
  AboutEditorState,
  AboutEditorFeature,
  AboutEditorStat,
  AboutPersistFeature,
  AboutHarmony,
  AboutPersistStat,
  AboutStyle,
  AboutStyleOption,
} from '../_types';

export const DEFAULT_ABOUT_HARMONY: AboutHarmony = 'analogous';
export const DEFAULT_ABOUT_CORNER_RADIUS: AboutCornerRadius = 'lg';

export const ABOUT_STYLES: AboutStyleOption[] = [
  { id: 'classic', label: '(1) Cổ điển' },
  { id: 'bento', label: '(2) Ô ghép' },
  { id: 'minimal', label: '(3) Tối giản' },
  { id: 'split', label: '(4) Chia đôi' },
  { id: 'timeline', label: '(5) Tiến trình' },
  { id: 'showcase', label: '(6) Trưng bày' },
  { id: 'spaCollage', label: '(7) Ghép ảnh' },
  { id: 'solarFeature', label: '(8) Khối lớn' },
  { id: 'kanban', label: '(9) Lưới thẻ' },
];

const ABOUT_STYLE_SET = new Set<AboutStyle>(ABOUT_STYLES.map((style) => style.id));

const toText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const createAboutStatId = (seed: number) => `about-stat-${seed}-${Math.random().toString(36).slice(2, 8)}`;
const createAboutFeatureId = (seed: number) => `about-feature-${seed}-${Math.random().toString(36).slice(2, 8)}`;

export const createAboutEditorStat = (overrides?: Partial<AboutEditorStat>): AboutEditorStat => {
  const seed = Date.now();

  return {
    id: overrides?.id ?? createAboutStatId(seed),
    value: toText(overrides?.value),
    label: toText(overrides?.label),
  };
};

export const createAboutEditorFeature = (overrides?: Partial<AboutEditorFeature>): AboutEditorFeature => {
  const seed = Date.now();

  return {
    id: overrides?.id ?? createAboutFeatureId(seed),
    title: toText(overrides?.title),
    mediaType: overrides?.mediaType === 'image' ? 'image' : 'icon',
    iconName: toText(overrides?.iconName) || 'CheckCircle2',
    image: toText(overrides?.image),
  };
};

export const normalizeAboutStyle = (value: unknown): AboutStyle => {
  if (typeof value === 'string' && ABOUT_STYLE_SET.has(value as AboutStyle)) {
    return value as AboutStyle;
  }
  return 'bento';
};

export const normalizeAboutHarmony = (value?: string): AboutHarmony => {
  if (value === 'complementary' || value === 'triadic' || value === 'analogous') {
    return value;
  }
  return 'analogous';
};

export const normalizeAboutCornerRadius = (value: unknown, noBorderRadius?: unknown): AboutCornerRadius => {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_ABOUT_CORNER_RADIUS;
};

export const getAboutCornerRadiusClassName = (value: AboutCornerRadius = DEFAULT_ABOUT_CORNER_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-2xl';
};

export const normalizeAboutPersistStats = (input: unknown): AboutPersistStat[] => {
  if (!Array.isArray(input)) {return [];}

  return input
    .map((raw) => {
      if (typeof raw !== 'object' || raw === null) {return null;}
      const source = raw as Record<string, unknown>;

      return {
        value: toText(source.value),
        label: toText(source.label),
      };
    })
    .filter((item): item is AboutPersistStat => item !== null);
};

export const normalizeAboutPersistFeatures = (input: unknown): AboutPersistFeature[] => {
  if (!Array.isArray(input)) {return [];}

  const result: AboutPersistFeature[] = [];

  input.forEach((raw) => {
    if (typeof raw !== 'object' || raw === null) {return;}
    const source = raw as Record<string, unknown>;
    result.push({
      title: toText(source.title),
      mediaType: source.mediaType === 'image' ? 'image' : 'icon',
      iconName: toText(source.iconName) || 'CheckCircle2',
      image: toText(source.image) || undefined,
    });
  });

  return result;
};

export const normalizeAboutEditorStats = (input: unknown): AboutEditorStat[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((raw) => {
      if (typeof raw !== 'object' || raw === null) {return null;}
      const source = raw as Record<string, unknown>;
      const idSource = source.id;

      return createAboutEditorStat({
        id: typeof idSource === 'string' ? idSource : (typeof idSource === 'number' ? String(idSource) : undefined),
        value: toText(source.value),
        label: toText(source.label),
      });
    })
    .filter((item): item is AboutEditorStat => item !== null);
};

export const normalizeAboutEditorFeatures = (input: unknown): AboutEditorFeature[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((raw) => {
      if (typeof raw !== 'object' || raw === null) {return null;}
      const source = raw as Record<string, unknown>;
      const idSource = source.id;

      return createAboutEditorFeature({
        id: typeof idSource === 'string' ? idSource : (typeof idSource === 'number' ? String(idSource) : undefined),
        title: toText(source.title),
        mediaType: source.mediaType === 'image' ? 'image' : 'icon',
        iconName: toText(source.iconName) || 'CheckCircle2',
        image: toText(source.image),
      });
    })
    .filter((item): item is AboutEditorFeature => item !== null);
};

export const toAboutPersistStats = (stats: AboutEditorStat[]): AboutPersistStat[] => (
  stats.map((item) => ({
    value: toText(item.value),
    label: toText(item.label),
  }))
);

export const toAboutPersistFeatures = (features: AboutEditorFeature[]): AboutPersistFeature[] => (
  features.map((item) => ({
    title: toText(item.title),
    mediaType: item.mediaType === 'image' ? 'image' : 'icon',
    iconName: toText(item.iconName) || 'CheckCircle2',
    image: toText(item.image) || undefined,
  }))
);

export const normalizeAboutImages = (input: unknown, fallbackImage = ''): string[] => {
  const source = Array.isArray(input) ? input : [];
  const normalized = source
    .map((item) => toText(item).trim())
    .filter(Boolean)
    .slice(0, 3);

  while (normalized.length < 3) {
    normalized.push(normalized[0] || fallbackImage || '');
  }

  return normalized;
};

export const DEFAULT_ABOUT_CONFIG: AboutConfig = {
  buttonLink: '',
  buttonText: '',
  description: '',
  heading: '',
  highlightText: '',
  phone: '',
  image: '',
  images: ['', '', ''],
  imageCaption: '',
  features: [],
  harmony: DEFAULT_ABOUT_HARMONY,
  style: 'bento',
  subHeading: '',
  // Shared header config
  hideHeader: false,
  showTitle: true,
  subtitle: '',
  showSubtitle: true,
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  cornerRadius: DEFAULT_ABOUT_CORNER_RADIUS,
  noBorderRadius: false,
  noVerticalMargin: false,
};

export const DEFAULT_ABOUT_EDITOR_STATE: AboutEditorState = {
  style: 'bento',
  subHeading: 'VỀ CHÚNG TÔI',
  heading: 'Giới thiệu về',
  highlightText: 'Thương hiệu',
  description: 'Chúng tôi chuyên cung cấp những giải pháp và dịch vụ chất lượng hàng đầu. Với đội ngũ giàu kinh nghiệm và đam mê, chúng tôi cam kết mang đến giá trị đích thực và sự hài lòng tuyệt đối cho mỗi khách hàng.',
  phone: '1800 6750',
  image: '',
  images: ['', '', ''],
  imageCaption: '',
  features: [
    createAboutEditorFeature({ id: 'about-feature-default-1', title: 'Chất lượng vượt trội', iconName: 'Award' }),
    createAboutEditorFeature({ id: 'about-feature-default-2', title: 'Hỗ trợ tận tâm', iconName: 'Heart' }),
    createAboutEditorFeature({ id: 'about-feature-default-3', title: 'Giải pháp sáng tạo', iconName: 'Sparkles' }),
    createAboutEditorFeature({ id: 'about-feature-default-4', title: 'Kinh nghiệm lâu năm', iconName: 'Medal' }),
  ],
  stats: [
    createAboutEditorStat({ id: 'about-solar-stat-default', value: '18+', label: 'năm kinh nghiệm' }),
  ],
  buttonText: 'Xem chi tiết',
  buttonLink: '/about',
  // Shared header config
  hideHeader: false,
  showTitle: true,
  subtitle: '',
  showSubtitle: true,
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  cornerRadius: DEFAULT_ABOUT_CORNER_RADIUS,
  noBorderRadius: false,
  noVerticalMargin: false,
};
