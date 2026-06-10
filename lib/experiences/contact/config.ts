export type ContactLayoutStyle = 'form-only' | 'with-map' | 'with-info';

export type ContactExperienceConfig = {
  layoutStyle: ContactLayoutStyle;
  showMap: boolean;
  showContactInfo: boolean;
  showSocialLinks: boolean;
};

export const CONTACT_EXPERIENCE_KEY = 'contact_ui' as const;

export const DEFAULT_CONTACT_CONFIG: ContactExperienceConfig = {
  layoutStyle: 'with-info',
  showContactInfo: true,
  showMap: true,
  showSocialLinks: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isLayoutStyle = (value: unknown): value is ContactLayoutStyle => {
  return value === 'form-only' || value === 'with-map' || value === 'with-info';
};

export const parseContactExperienceConfig = (raw: unknown): ContactExperienceConfig => {
  const source = isRecord(raw) ? raw : {};
  const layoutStyle = isLayoutStyle(source.layoutStyle) ? source.layoutStyle : DEFAULT_CONTACT_CONFIG.layoutStyle;

  return {
    layoutStyle,
    showContactInfo: typeof source.showContactInfo === 'boolean' ? source.showContactInfo : DEFAULT_CONTACT_CONFIG.showContactInfo,
    showMap: typeof source.showMap === 'boolean' ? source.showMap : DEFAULT_CONTACT_CONFIG.showMap,
    showSocialLinks: typeof source.showSocialLinks === 'boolean' ? source.showSocialLinks : DEFAULT_CONTACT_CONFIG.showSocialLinks,
  };
};
