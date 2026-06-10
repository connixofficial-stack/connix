import type {
  ContactCornerRadius,
  ContactConfigState,
  ContactDesktopColumns,
  ContactInfoItem,
  ContactSocialLink,
  ContactStyle,
} from '../_types';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing } from '../../_shared/types/sectionSpacing';

export const CONTACT_STYLES: Array<{ id: ContactStyle; label: string }> = [
  { id: 'modern', label: '(1) Chia đôi' },
  { id: 'floating', label: '(2) Khối nổi' },
  { id: 'grid', label: '(3) Lưới thẻ' },
  { id: 'elegant', label: '(4) Thanh lịch' },
  { id: 'minimal', label: '(5) Tối giản' },
  { id: 'centered', label: '(6) Cân bằng' },
  { id: 'kanban', label: '(7) Ba cột' },
];

export const DEFAULT_CONTACT_CONFIG: ContactConfigState = {
  contactItems: [],
  address: '',
  email: '',
  formDescription: '',
  formFields: ['name', 'email', 'phone', 'subject', 'message'],
  formTitle: '',
  mapEmbed: '',
  phone: '',
  responseTimeText: '',
  showMap: true,
  showForm: true,
  socialLinks: [],
  useOriginalSocialIconColors: true,
  submitButtonText: '',
  workingHours: '',
  style: 'modern',
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
  cornerRadius: 'lg',
  desktopColumns: 4,
};

export const normalizeContactCornerRadius = (value: unknown, noBorderRadius?: unknown): ContactCornerRadius => {
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

  return 'lg';
};

export const getContactCornerRadiusClassName = (value: ContactCornerRadius = 'lg') => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-xl';
};

export const normalizeContactDesktopColumns = (value: unknown): ContactDesktopColumns => {
  if (value === 3 || value === '3') {
    return 3;
  }

  return 4;
};

export const normalizeContactSpacing = (value: unknown, noVerticalMargin?: unknown) => (
  noVerticalMargin === true ? 'none' : normalizeSectionSpacing(value)
);

export const DEFAULT_CONTACT_TEXTS: Record<ContactStyle, Record<string, string>> = {
  modern: {
    badge: 'Thông tin liên hệ',
    heading: 'Kết nối với chúng tôi',
    description: 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
  },
  floating: {
    heading: 'Thông tin liên hệ',
    description: 'Thông tin liên hệ và vị trí bản đồ chính xác.',
  },
  grid: {
    heading: 'Thông tin liên hệ',
    description: 'Gửi yêu cầu và xem thông tin liên hệ của bạn.',
  },
  elegant: {
    heading: 'Văn phòng của chúng tôi',
    description: 'Thông tin liên hệ và vị trí bản đồ chính xác.',
  },
  minimal: {
    heading: 'Liên hệ nhanh',
    description: 'Chọn kênh phù hợp để kết nối với chúng tôi.',
  },
  centered: {
    heading: 'Liên hệ & hỗ trợ',
    description: 'Phản hồi nhanh trong giờ làm việc.',
  },
  kanban: {
    badge: 'Thông tin liên hệ',
    heading: 'Kết nối với chúng tôi',
    description: 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
  },
};

export const TEXT_FIELDS: Record<ContactStyle, Array<{ key: string; label: string; placeholder: string }>> = {
  modern: [
    { key: 'badge', label: 'Badge hiển thị', placeholder: 'Thông tin liên hệ' },
    { key: 'heading', label: 'Heading hiển thị', placeholder: 'Kết nối với chúng tôi' },
    { key: 'description', label: 'Mô tả', placeholder: 'Chúng tôi luôn sẵn sàng hỗ trợ bạn' },
  ],
  floating: [
    { key: 'heading', label: 'Heading hiển thị', placeholder: 'Thông tin liên hệ' },
    { key: 'description', label: 'Mô tả', placeholder: 'Thông tin liên hệ và vị trí bản đồ chính xác.' },
  ],
  grid: [
    { key: 'heading', label: 'Heading hiển thị', placeholder: 'Thông tin liên hệ' },
    { key: 'description', label: 'Mô tả', placeholder: 'Gửi yêu cầu và xem thông tin liên hệ của bạn.' },
  ],
  elegant: [
    { key: 'heading', label: 'Heading hiển thị', placeholder: 'Văn phòng của chúng tôi' },
    { key: 'description', label: 'Mô tả', placeholder: 'Thông tin liên hệ và vị trí bản đồ chính xác.' },
  ],
  minimal: [
    { key: 'heading', label: 'Heading hiển thị', placeholder: 'Liên hệ nhanh' },
    { key: 'description', label: 'Mô tả', placeholder: 'Chọn kênh phù hợp để kết nối với chúng tôi.' },
  ],
  centered: [
    { key: 'heading', label: 'Heading hiển thị', placeholder: 'Liên hệ & hỗ trợ' },
    { key: 'description', label: 'Mô tả', placeholder: 'Phản hồi nhanh trong giờ làm việc.' },
  ],
  kanban: [
    { key: 'badge', label: 'Badge hiển thị', placeholder: 'Thông tin liên hệ' },
    { key: 'heading', label: 'Heading hiển thị', placeholder: 'Kết nối với chúng tôi' },
    { key: 'description', label: 'Mô tả', placeholder: 'Chúng tôi luôn sẵn sàng hỗ trợ bạn' },
  ],
};

const CONTACT_ITEM_TEMPLATES: Array<Pick<ContactInfoItem, 'icon' | 'label' | 'fieldKey'>> = [
  { icon: 'map-pin', label: 'Địa chỉ', fieldKey: 'contact_address' },
  { icon: 'phone', label: 'Số điện thoại', fieldKey: 'contact_phone' },
  { icon: 'mail', label: 'Email', fieldKey: 'contact_email' },
  { icon: 'clock', label: 'Giờ làm việc', fieldKey: 'working_hours' },
];

const SOCIAL_PLATFORMS: Array<{ platform: string; label: string; key: string }> = [
  { platform: 'facebook', label: 'Facebook', key: 'social_facebook' },
  { platform: 'instagram', label: 'Instagram', key: 'social_instagram' },
  { platform: 'youtube', label: 'Youtube', key: 'social_youtube' },
  { platform: 'tiktok', label: 'TikTok', key: 'social_tiktok' },
  { platform: 'zalo', label: 'Zalo', key: 'contact_zalo' },
  { platform: 'x', label: 'X (Twitter)', key: 'social_twitter' },
  { platform: 'pinterest', label: 'Pinterest', key: 'social_pinterest' },
];

type SettingItem = { key: string; value: string | number | boolean };

const buildSettingsMap = (settings?: SettingItem[]) => {
  const map: Record<string, string> = {};
  settings?.forEach((item) => {
    map[item.key] = typeof item.value === 'string' ? item.value : String(item.value ?? '');
  });
  return map;
};

export const getContactSocialPlatforms = () => SOCIAL_PLATFORMS;

export const buildDefaultContactItems = (): ContactInfoItem[] => CONTACT_ITEM_TEMPLATES.map((template, index) => ({
  id: index + 1,
  icon: template.icon,
  label: template.label,
  value: '',
  href: '',
  fieldKey: template.fieldKey,
}));

export const buildDefaultContactItemsFromSettings = (settings?: SettingItem[]): ContactInfoItem[] => {
  const map = buildSettingsMap(settings);
  return buildDefaultContactItems().map((item) => {
    let value = '';
    if (item.fieldKey === 'contact_phone') {
      value = map.contact_phone || map.contact_hotline || '';
    } else if (item.fieldKey) {
      value = map[item.fieldKey] || '';
    }

    let href = item.href || '';
    if (item.fieldKey === 'contact_phone' && value) {
      href = `tel:${value}`;
    }
    if (item.fieldKey === 'contact_email' && value) {
      href = `mailto:${value}`;
    }

    return {
      ...item,
      value,
      href,
    };
  });
};

export const buildDefaultContactSocialsFromSettings = (contactSettings?: SettingItem[], socialSettings?: SettingItem[]): ContactSocialLink[] => {
  const contactMap = buildSettingsMap(contactSettings);
  const socialMap = buildSettingsMap(socialSettings);

  return SOCIAL_PLATFORMS.map((platform, index) => {
    const url = platform.key.startsWith('contact_')
      ? contactMap[platform.key] || ''
      : socialMap[platform.key] || '';

    return {
      id: index + 1,
      icon: platform.platform,
      platform: platform.platform,
      url,
    };
  });
};
