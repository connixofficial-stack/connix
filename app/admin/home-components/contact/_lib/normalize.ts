import {
  buildDefaultContactItems,
  DEFAULT_CONTACT_CONFIG,
  normalizeContactCornerRadius,
  normalizeContactDesktopColumns,
  normalizeContactSpacing,
} from './constants';
import { normalizeContactIconValue } from './iconOptions';
import type {
  ContactConfig,
  ContactConfigState,
  ContactInfoItem,
  ContactSocialLink,
  ContactStyle,
} from '../_types';

const CONTACT_STYLE_SET = new Set<ContactStyle>([
  'modern',
  'floating',
  'grid',
  'elegant',
  'minimal',
  'centered',
  'kanban',
]);

const coerceText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const toSocialRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return {};
};

const toItemRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return {};
};

const normalizeStyle = (value: unknown): ContactStyle => {
  if (typeof value === 'string' && CONTACT_STYLE_SET.has(value as ContactStyle)) {
    return value as ContactStyle;
  }
  return 'modern';
};

const normalizeSocialLinks = (input: unknown): ContactSocialLink[] => {
  if (!Array.isArray(input)) {return [];}

  return input.map((raw, index) => {
    const record = toSocialRecord(raw);
    const rawId = record.id;
    const id = typeof rawId === 'number'
      ? rawId
      : Number.parseInt(coerceText(rawId), 10);

    const platform = coerceText(record.platform);
    return {
      id: Number.isFinite(id) ? id : index + 1,
      platform,
      icon: coerceText(record.icon) || platform,
      url: coerceText(record.url),
    };
  });
};

const normalizeContactItems = (input: unknown): ContactInfoItem[] => {
  if (Array.isArray(input) && input.length > 0) {
    return input.map((raw, index) => {
      const record = toItemRecord(raw);
      const rawId = record.id;
      const id = typeof rawId === 'number'
        ? rawId
        : Number.parseInt(coerceText(rawId), 10);

      return {
        id: Number.isFinite(id) ? id : index + 1,
        icon: normalizeContactIconValue(coerceText(record.icon) || coerceText(record.fieldKey) || 'help-circle'),
        label: coerceText(record.label),
        value: coerceText(record.value),
        href: coerceText(record.href),
        fieldKey: coerceText(record.fieldKey),
      };
    });
  }

  return buildDefaultContactItems();
};

const normalizeTexts = (input: unknown): Record<string, string> => {
  if (typeof input === 'object' && input !== null) {
    const record = input as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      result[key] = coerceText(value);
    }
    return result;
  }
  return {};
};

export const normalizeContactConfig = (rawConfig: unknown): ContactConfigState => {
  const config = (typeof rawConfig === 'object' && rawConfig !== null)
    ? rawConfig as Record<string, unknown>
    : {};

  const defaultConfig = DEFAULT_CONTACT_CONFIG;
  const contactFields = {
    contact_address: coerceText(config.address) || defaultConfig.address || '',
    contact_phone: coerceText(config.phone) || defaultConfig.phone || '',
    contact_email: coerceText(config.email) || defaultConfig.email || '',
    working_hours: coerceText(config.workingHours) || defaultConfig.workingHours || '',
  };

  return {
    contactItems: normalizeContactItems(config.contactItems),
    address: contactFields.contact_address,
    email: contactFields.contact_email,
    formDescription: coerceText(config.formDescription) || defaultConfig.formDescription,
    formFields: Array.isArray(config.formFields)
      ? config.formFields.map((field) => coerceText(field)).filter((field) => field.trim().length > 0)
      : [...defaultConfig.formFields],
    formTitle: coerceText(config.formTitle) || defaultConfig.formTitle,
    mapEmbed: coerceText(config.mapEmbed) || defaultConfig.mapEmbed,
    phone: contactFields.contact_phone,
    responseTimeText: coerceText(config.responseTimeText) || defaultConfig.responseTimeText,
    showMap: typeof config.showMap === 'boolean' ? config.showMap : defaultConfig.showMap,
    socialLinks: normalizeSocialLinks(config.socialLinks),
    useOriginalSocialIconColors: config.useOriginalSocialIconColors !== false,
    submitButtonText: coerceText(config.submitButtonText) || defaultConfig.submitButtonText,
    workingHours: contactFields.working_hours,
    style: normalizeStyle(config.style),
    showForm: typeof config.showForm === 'boolean' ? config.showForm : defaultConfig.showForm,
    texts: normalizeTexts(config.texts),
    // Shared header config
    hideHeader: typeof config.hideHeader === 'boolean' ? config.hideHeader : defaultConfig.hideHeader,
    showTitle: typeof config.showTitle === 'boolean' ? config.showTitle : defaultConfig.showTitle,
    subtitle: coerceText(config.subtitle) || defaultConfig.subtitle,
    showSubtitle: typeof config.showSubtitle === 'boolean' ? config.showSubtitle : defaultConfig.showSubtitle,
    headerAlign: (config.headerAlign === 'left' || config.headerAlign === 'center' || config.headerAlign === 'right')
      ? config.headerAlign
      : defaultConfig.headerAlign,
    titleColorPrimary: typeof config.titleColorPrimary === 'boolean' ? config.titleColorPrimary : defaultConfig.titleColorPrimary,
    subtitleAboveTitle: typeof config.subtitleAboveTitle === 'boolean' ? config.subtitleAboveTitle : defaultConfig.subtitleAboveTitle,
    uppercaseText: typeof config.uppercaseText === 'boolean' ? config.uppercaseText : defaultConfig.uppercaseText,
    showBadge: typeof config.showBadge === 'boolean' ? config.showBadge : defaultConfig.showBadge,
    badgeText: coerceText(config.badgeText) || defaultConfig.badgeText,
    spacing: normalizeContactSpacing(config.spacing, config.noVerticalMargin),
    cornerRadius: normalizeContactCornerRadius(config.cornerRadius, config.noBorderRadius),
    desktopColumns: normalizeContactDesktopColumns(config.desktopColumns),
  };
};

export const toContactConfigPayload = (config: ContactConfigState): ContactConfig => {
  const normalized = normalizeContactConfig(config);
  return {
    contactItems: normalized.contactItems.map((item) => ({ ...item })),
    formDescription: normalized.formDescription,
    formFields: [...normalized.formFields],
    formTitle: normalized.formTitle,
    mapEmbed: normalized.mapEmbed,
    responseTimeText: normalized.responseTimeText,
    showMap: normalized.showMap,
    socialLinks: normalized.socialLinks.map((item) => ({ ...item })),
    useOriginalSocialIconColors: normalized.useOriginalSocialIconColors !== false,
    submitButtonText: normalized.submitButtonText,
    showForm: normalized.showForm,
    texts: normalized.texts,
    // Shared header config
    hideHeader: normalized.hideHeader,
    showTitle: normalized.showTitle,
    subtitle: normalized.subtitle,
    showSubtitle: normalized.showSubtitle,
    headerAlign: normalized.headerAlign,
    titleColorPrimary: normalized.titleColorPrimary,
    subtitleAboveTitle: normalized.subtitleAboveTitle,
    uppercaseText: normalized.uppercaseText,
    showBadge: normalized.showBadge,
    badgeText: normalized.badgeText,
    spacing: normalized.spacing,
    cornerRadius: normalized.cornerRadius,
    desktopColumns: normalized.desktopColumns,
  };
};

export const toContactSnapshot = (payload: {
  title: string;
  active: boolean;
  config: ContactConfigState;
}) => {
  const normalized = normalizeContactConfig(payload.config);

  return JSON.stringify({
    title: payload.title,
    active: payload.active,
    config: {
      contactItems: normalized.contactItems.map((item) => ({ ...item })),
      formDescription: normalized.formDescription,
      formFields: [...normalized.formFields],
      formTitle: normalized.formTitle,
      mapEmbed: normalized.mapEmbed,
      responseTimeText: normalized.responseTimeText,
      showMap: normalized.showMap,
      socialLinks: normalized.socialLinks.map((link) => ({
        id: link.id,
        icon: link.icon,
        platform: link.platform,
        url: link.url,
      })),
      useOriginalSocialIconColors: normalized.useOriginalSocialIconColors !== false,
      submitButtonText: normalized.submitButtonText,
      style: normalized.style,
      showForm: normalized.showForm,
      texts: normalized.texts,
      // Shared header config
      hideHeader: normalized.hideHeader,
      showTitle: normalized.showTitle,
      subtitle: normalized.subtitle,
      showSubtitle: normalized.showSubtitle,
      headerAlign: normalized.headerAlign,
      titleColorPrimary: normalized.titleColorPrimary,
      subtitleAboveTitle: normalized.subtitleAboveTitle,
      uppercaseText: normalized.uppercaseText,
      showBadge: normalized.showBadge,
      badgeText: normalized.badgeText,
      spacing: normalized.spacing,
      cornerRadius: normalized.cornerRadius,
      desktopColumns: normalized.desktopColumns,
    },
  });
};
