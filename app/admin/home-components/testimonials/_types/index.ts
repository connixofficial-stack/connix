import {
  DEFAULT_SECTION_SPACING,
  getSectionSpacingClassName,
  normalizeSectionSpacing,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';
import type { HomeComponentCornerRadius } from '../../_shared/components/HomeComponentDisplaySettingsSection';
export type TestimonialsAvatarType = 'initials' | 'image' | 'icon' | 'upload';
export type TestimonialsStyle = 'cards' | 'slider' | 'marquee' | 'showcase' | 'quote' | 'minimal' | 'split-carousel' | 'overlap-carousel' | 'builder-cards' | 'builder-carousel';
export type TestimonialsDesktopColumns = 3 | 4;
export type TestimonialsCornerRadius = HomeComponentCornerRadius;

export type TestimonialsBrandMode = 'single' | 'dual';
export type TestimonialsHarmony = 'analogous' | 'complementary' | 'triadic';

export interface TestimonialsPersistItem {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatarType: TestimonialsAvatarType;
  avatarUrl?: string;
  avatarIcon?: string;
  avatar?: string;
}

export interface TestimonialsItem extends TestimonialsPersistItem {
  id: string;
}

export type TestimonialsHeaderAlign = 'left' | 'center' | 'right';

export interface TestimonialsConfig {
  items: TestimonialsPersistItem[];
  style: TestimonialsStyle;
  desktopColumns?: TestimonialsDesktopColumns;
  splitBackgroundImage?: string;
  splitBackgroundOverlayOpacity?: number;
  harmony?: TestimonialsHarmony;
  // Header fields
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: TestimonialsHeaderAlign;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  cornerRadius?: TestimonialsCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

const VALID_TESTIMONIAL_STYLES: TestimonialsStyle[] = ['cards', 'slider', 'marquee', 'showcase', 'quote', 'minimal', 'split-carousel', 'overlap-carousel', 'builder-cards', 'builder-carousel'];
const VALID_AVATAR_TYPES: TestimonialsAvatarType[] = ['initials', 'image', 'icon', 'upload'];
const VALID_CORNER_RADIUS: TestimonialsCornerRadius[] = ['none', 'sm', 'lg'];

export const DEFAULT_TESTIMONIALS_SPACING: SectionSpacing = DEFAULT_SECTION_SPACING;
export const normalizeTestimonialsSpacing = (value: unknown, noVerticalMargin?: unknown): SectionSpacing => (
  noVerticalMargin === true ? 'none' : normalizeSectionSpacing(value)
);
export const getTestimonialsSectionSpacingClassName = getSectionSpacingClassName;

const toText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const toRating = (value: unknown) => {
  const rating = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(rating)) {return 5;}
  return Math.max(1, Math.min(5, Math.round(rating)));
};

export const createTestimonialsItem = (seed: number | string): TestimonialsItem => ({
  avatar: '',
  avatarIcon: '',
  avatarType: 'initials',
  avatarUrl: '',
  company: '',
  content: '',
  id: `testimonial-${seed}`,
  name: '',
  rating: 5,
  role: '',
});

export const normalizeTestimonialsAvatarType = (value: unknown): TestimonialsAvatarType => {
  if (VALID_AVATAR_TYPES.includes(value as TestimonialsAvatarType)) {
    return value as TestimonialsAvatarType;
  }

  return 'initials';
};

export const normalizeTestimonialsStyle = (value: unknown): TestimonialsStyle => {
  if (VALID_TESTIMONIAL_STYLES.includes(value as TestimonialsStyle)) {
    return value as TestimonialsStyle;
  }

  if (value === 'masonry') {return 'marquee';}
  if (value === 'carousel') {return 'showcase';}
  return 'cards';
};

export const normalizeTestimonialsDesktopColumns = (value: unknown): TestimonialsDesktopColumns => (
  value === 4 ? 4 : 3
);

export const normalizeTestimonialsCornerRadius = (value: unknown, noBorderRadius?: unknown): TestimonialsCornerRadius => {
  if (noBorderRadius === true) {return 'none';}
  if (value === 'small') {return 'sm';}
  if (value === 'large') {return 'lg';}
  if (VALID_CORNER_RADIUS.includes(value as TestimonialsCornerRadius)) {
    return value as TestimonialsCornerRadius;
  }

  return 'lg';
};

export const normalizeTestimonialsPersistItem = (raw: unknown): TestimonialsPersistItem => {
  const item = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  const avatar = toText(item.avatar);
  const avatarUrl = toText(item.avatarUrl) || avatar;
  const avatarIcon = toText(item.avatarIcon);
  const avatarType = normalizeTestimonialsAvatarType(item.avatarType);
  const resolvedAvatarType = avatarType === 'initials'
    ? (avatarIcon ? 'icon' : (avatarUrl ? 'image' : 'initials'))
    : avatarType;

  return {
    avatar,
    avatarIcon: resolvedAvatarType === 'icon' ? avatarIcon : '',
    avatarType: resolvedAvatarType,
    avatarUrl: (resolvedAvatarType === 'image' || resolvedAvatarType === 'upload') ? avatarUrl : '',
    company: toText(item.company),
    content: toText(item.content),
    name: toText(item.name),
    rating: toRating(item.rating),
    role: toText(item.role),
  };
};

export const normalizeTestimonialsItem = (raw: unknown, index: number): TestimonialsItem => {
  const item = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  const normalized = normalizeTestimonialsPersistItem(item);
  const idCandidate = item.id;
  const id = typeof idCandidate === 'string' && idCandidate.trim().length > 0
    ? idCandidate
    : `testimonial-${index + 1}`;

  return {
    ...normalized,
    id,
  };
};

export const toTestimonialsPersistItem = (item: TestimonialsItem): TestimonialsPersistItem => {
  const normalized = normalizeTestimonialsPersistItem(item);
  return {
    ...normalized,
    avatar: (normalized.avatarType === 'image' || normalized.avatarType === 'upload') ? normalized.avatarUrl ?? '' : '',
  };
};

export const TESTIMONIALS_ICON_CHOICES = [
  'User',
  'UserCheck',
  'UserCog',
  'UserPlus',
  'UserRoundCheck',
  'Users',
  'UsersRound',
  'Smile',
  'Heart',
  'HeartHandshake',
  'Handshake',
  'HandCoins',
  'ThumbsUp',
  'Star',
  'Sparkles',
  'Sparkle',
  'WandSparkles',
  'Award',
  'BadgeCheck',
  'BadgeInfo',
  'BadgePercent',
  'Medal',
  'Trophy',
  'Crown',
  'Gem',
  'Diamond',
  'Briefcase',
  'Building',
  'Building2',
  'Factory',
  'Store',
  'Landmark',
  'Globe',
  'MapPin',
  'MapPinned',
  'Navigation',
  'Navigation2',
  'Route',
  'Waypoints',
  'Target',
  'Goal',
  'Rocket',
  'Zap',
  'Flame',
  'Lightbulb',
  'Brain',
  'Bot',
  'Shield',
  'ShieldCheck',
  'ShieldUser',
  'LockKeyhole',
  'KeyRound',
  'Fingerprint',
  'CheckCircle',
  'CircleCheckBig',
  'ClipboardCheck',
  'ListChecks',
  'MessageCircle',
  'MessageCircleMore',
  'MessageSquareText',
  'MessagesSquare',
  'Mail',
  'MailCheck',
  'Phone',
  'PhoneCall',
  'Headphones',
  'Headset',
  'Camera',
  'Image',
  'Video',
  'Monitor',
  'MonitorCheck',
  'Laptop',
  'Smartphone',
  'TabletSmartphone',
  'Coffee',
  'Gift',
  'Package',
  'PackageCheck',
  'ShoppingBag',
  'ShoppingCart',
  'CreditCard',
  'Wallet',
  'Banknote',
  'Coins',
  'DollarSign',
  'TrendingUp',
  'ChartColumnBig',
  'ChartPie',
  'Activity',
  'Gauge',
  'Timer',
  'Clock',
  'CalendarCheck',
  'Leaf',
  'Sprout',
  'Flower2',
  'Trees',
  'Recycle',
] as const;
