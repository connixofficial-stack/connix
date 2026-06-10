import type { VideoAspect, VideoBrandMode, VideoConfig, VideoCornerRadius, VideoPlayButtonSize, VideoStyle } from '../_types';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing } from '../../_shared/types/sectionSpacing';

export const VIDEO_STYLES: Array<{ id: VideoStyle; label: string }> = [
  { id: 'centered', label: '(1) Căn giữa' },
  { id: 'split', label: '(2) Chia đôi' },
  { id: 'fullwidth', label: '(3) Tràn viền' },
  { id: 'cinema', label: '(4) Khung rộng' },
  { id: 'minimal', label: '(5) Tối giản' },
  { id: 'parallax', label: '(6) Cuộn nền' },
];

export const DEFAULT_TEXTS: Record<VideoStyle, Record<string, string>> = {
  centered: {
    heading: 'Khám phá sản phẩm của chúng tôi',
    description: 'Xem video để hiểu rõ hơn về những gì chúng tôi mang lại',
  },
  split: {
    heading: 'Khám phá sản phẩm của chúng tôi',
    description: 'Xem video để hiểu rõ hơn về những gì chúng tôi mang lại',
    badge: 'Video mới',
    buttonText: 'Tìm hiểu thêm',
  },
  fullwidth: {
    heading: 'Khám phá sản phẩm của chúng tôi',
    description: 'Xem video để hiểu rõ hơn về những gì chúng tôi mang lại',
    badge: 'Giới thiệu',
    buttonText: 'Xem ngay',
  },
  cinema: {
    heading: 'Khám phá sản phẩm của chúng tôi',
    description: 'Xem video để hiểu rõ hơn về những gì chúng tôi mang lại',
    badge: 'Featured',
    buttonText: 'Khám phá',
  },
  minimal: {
    heading: 'Khám phá sản phẩm của chúng tôi',
    description: 'Xem video để hiểu rõ hơn về những gì chúng tôi mang lại',
    buttonText: 'Tìm hiểu thêm',
  },
  parallax: {
    heading: 'Khám phá sản phẩm của chúng tôi',
    description: 'Xem video để hiểu rõ hơn về những gì chúng tôi mang lại',
    badge: 'Video mới',
    buttonText: 'Xem ngay',
  },
};

export const TEXT_FIELDS: Record<VideoStyle, Array<{ key: string; label: string; placeholder: string }>> = {
  centered: [
    { key: 'heading', label: 'Tiêu đề', placeholder: 'Tiêu đề video section' },
    { key: 'description', label: 'Mô tả ngắn', placeholder: 'Mô tả cho video section...' },
  ],
  split: [
    { key: 'heading', label: 'Tiêu đề', placeholder: 'Tiêu đề video section' },
    { key: 'description', label: 'Mô tả ngắn', placeholder: 'Mô tả cho video section...' },
    { key: 'badge', label: 'Badge / Label', placeholder: 'VD: Video mới, Giới thiệu...' },
    { key: 'buttonText', label: 'Nút CTA - Text', placeholder: 'VD: Tìm hiểu thêm...' },
  ],
  fullwidth: [
    { key: 'heading', label: 'Tiêu đề', placeholder: 'Tiêu đề video section' },
    { key: 'description', label: 'Mô tả ngắn', placeholder: 'Mô tả cho video section...' },
    { key: 'badge', label: 'Badge / Label', placeholder: 'VD: Giới thiệu...' },
    { key: 'buttonText', label: 'Nút CTA - Text', placeholder: 'VD: Xem ngay...' },
  ],
  cinema: [
    { key: 'heading', label: 'Tiêu đề', placeholder: 'Tiêu đề video section' },
    { key: 'description', label: 'Mô tả ngắn', placeholder: 'Mô tả cho video section...' },
    { key: 'badge', label: 'Badge / Label', placeholder: 'VD: Featured...' },
    { key: 'buttonText', label: 'Nút CTA - Text', placeholder: 'VD: Khám phá...' },
  ],
  minimal: [
    { key: 'heading', label: 'Tiêu đề', placeholder: 'Tiêu đề video section' },
    { key: 'description', label: 'Mô tả ngắn', placeholder: 'Mô tả cho video section...' },
    { key: 'buttonText', label: 'Nút CTA - Text', placeholder: 'VD: Tìm hiểu thêm...' },
  ],
  parallax: [
    { key: 'heading', label: 'Tiêu đề', placeholder: 'Tiêu đề video section' },
    { key: 'description', label: 'Mô tả ngắn', placeholder: 'Mô tả cho video section...' },
    { key: 'badge', label: 'Badge / Label', placeholder: 'VD: Video mới...' },
    { key: 'buttonText', label: 'Nút CTA - Text', placeholder: 'VD: Xem ngay...' },
  ],
};

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  videoUrl: '',
  thumbnailUrl: '',
  heading: '',
  description: '',
  badge: '',
  buttonText: '',
  buttonLink: '',
  autoplay: false,
  loop: false,
  muted: true,
  videoAspect: 'landscape',
  cornerRadius: 'lg',
  playButtonSize: 'large',
  style: 'centered',
  texts: {},
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
  spacing: DEFAULT_SECTION_SPACING,
};

export const VIDEO_STYLES_WITH_CTA: VideoStyle[] = ['split', 'fullwidth', 'cinema', 'minimal', 'parallax'];

export const DEFAULT_VIDEO_STYLE: VideoStyle = 'centered';
export const normalizeVideoStyle = (value?: string): VideoStyle => {
  if (VIDEO_STYLES.some((style) => style.id === value)) {
    return value as VideoStyle;
  }

  return DEFAULT_VIDEO_STYLE;
};

const toText = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const toBoolean = (value: unknown, fallback = false) => (typeof value === 'boolean' ? value : fallback);

const ensureText = (value: string, max = 300) => value.trim().slice(0, max);

const normalizeHeaderAlign = (value: unknown): 'left' | 'center' | 'right' => {
  if (value === 'left' || value === 'center' || value === 'right') {
    return value;
  }
  return 'left';
};

export const normalizeVideoAspect = (value: unknown): VideoAspect => (
  value === 'portrait' ? 'portrait' : 'landscape'
);

export const normalizeVideoCornerRadius = (value: unknown, noBorderRadius?: unknown): VideoCornerRadius => {
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

  return 'lg';
};

export const normalizeVideoPlayButtonSize = (value: unknown): VideoPlayButtonSize => {
  if (value === 'small' || value === 'medium' || value === 'large') {
    return value;
  }
  return 'large';
};

export const normalizeVideoConfig = (raw: unknown): VideoConfig => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<VideoConfig>;
  const cornerRadius = normalizeVideoCornerRadius(source.cornerRadius, source.noBorderRadius);
  const spacing = source.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(source.spacing);

  return {
    videoUrl: ensureText(toText(source.videoUrl, ''), 2048),
    thumbnailUrl: ensureText(toText(source.thumbnailUrl, ''), 2048),
    heading: ensureText(toText(source.heading, ''), 160),
    description: ensureText(toText(source.description, ''), 600),
    badge: ensureText(toText(source.badge, ''), 120),
    buttonText: ensureText(toText(source.buttonText, ''), 80),
    buttonLink: ensureText(toText(source.buttonLink, ''), 512),
    autoplay: toBoolean(source.autoplay, false),
    loop: toBoolean(source.loop, false),
    muted: toBoolean(source.muted, true),
    videoAspect: normalizeVideoAspect(source.videoAspect),
    cornerRadius,
    playButtonSize: normalizeVideoPlayButtonSize(source.playButtonSize),
    style: normalizeVideoStyle(source.style),
    texts: source.texts && typeof source.texts === 'object' ? source.texts : {},
    hideHeader: toBoolean(source.hideHeader, false),
    showTitle: toBoolean(source.showTitle, true),
    subtitle: ensureText(toText(source.subtitle, ''), 300),
    showSubtitle: toBoolean(source.showSubtitle, true),
    headerAlign: normalizeHeaderAlign(source.headerAlign),
    titleColorPrimary: toBoolean(source.titleColorPrimary, false),
    subtitleAboveTitle: toBoolean(source.subtitleAboveTitle, false),
    uppercaseText: toBoolean(source.uppercaseText, false),
    showBadge: toBoolean(source.showBadge, true),
    badgeText: ensureText(toText(source.badgeText, ''), 120),
    spacing,
    noBorderRadius: cornerRadius === 'none',
    noVerticalMargin: spacing === 'none',
  };
};

export const getVideoConfigWithMode = (
  config: VideoConfig,
  _mode: VideoBrandMode,
): VideoConfig => {
  return {
    ...config,
  };
};
