import type { ContactConfigState } from '../_types';

export interface ValidationResult {
  isValid: boolean;
  errors: {
    mapEmbed?: string;
    contactItems?: Record<number, { href?: string }>;
    socialLinks?: Record<number, { url?: string }>;
  };
}

export const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return true; // Empty is valid (optional field)
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidHref = (href: string): boolean => {
  const trimmed = href.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {return true;}
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const normalizeZaloPhone = (value: string): string => value.replace(/[^\d+]/g, '');

export const isValidZaloLink = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {return true;}
  if (isValidUrl(trimmed)) {return true;}

  const normalizedPhone = normalizeZaloPhone(trimmed);
  if (!normalizedPhone) {return false;}

  return /^\+?\d{9,15}$/.test(normalizedPhone);
};

export const validateContactConfig = (config: ContactConfigState): ValidationResult => {
  const errors: ValidationResult['errors'] = {};

  if (config.showMap && config.mapEmbed && config.mapEmbed.trim() && !config.mapEmbed.trim().startsWith('<iframe') && !isValidUrl(config.mapEmbed)) {
    errors.mapEmbed = 'URL không hợp lệ';
  }

  const itemErrors: Record<number, { href?: string }> = {};
  config.contactItems.forEach((item) => {
    if (item.href && !isValidHref(item.href)) {
      itemErrors[item.id] = { href: 'Link không hợp lệ' };
    }
  });

  const socialErrors: Record<number, { url?: string }> = {};
  config.socialLinks.forEach((link) => {
    const isZalo = link.platform.trim().toLowerCase() === 'zalo';
    const isValidSocialUrl = isZalo ? isValidZaloLink(link.url) : isValidUrl(link.url);
    if (link.url && !isValidSocialUrl) {
      socialErrors[link.id] = { url: 'URL không hợp lệ' };
    }
  });

  if (Object.keys(socialErrors).length > 0) {
    errors.socialLinks = socialErrors;
  }

  if (Object.keys(itemErrors).length > 0) {
    errors.contactItems = itemErrors;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
