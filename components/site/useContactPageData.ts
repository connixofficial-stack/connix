'use client';

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { Facebook, Instagram, Linkedin, Youtube, X } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import {
  CONTACT_EXPERIENCE_KEY,
  parseContactExperienceConfig,
  type ContactExperienceConfig,
} from '@/lib/experiences/contact/config';
import { useBrandColors } from '@/components/site/hooks';
import { TikTokIcon, ZaloIcon, PinterestIcon } from './SocialIcons';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';

type SocialLinkItem = {
  label: string;
  href: string;
  color: string;
  icon: React.ElementType;
};

type ContactData = {
  address: string;
  email: string;
  phone: string;
  taxId: string;
  lat: number;
  lng: number;
  mapProvider: 'openstreetmap' | 'google_embed';
  googleMapEmbedIframe: string;
};

const normalizeZaloLink = (raw: string): string => {
  const value = raw.trim();
  if (!value) {
    return '';
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (/^zalo\.me\//i.test(value)) {
    return `https://${value}`;
  }
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) {
    return '';
  }
  return `https://zalo.me/${digits}`;
};

export function useContactPageData(): {
  isLoading: boolean;
  brandColor: string;
  secondaryColor: string;
  colorMode: 'single' | 'dual';
  config: ContactExperienceConfig;
  contactData: ContactData;
  socialLinks: SocialLinkItem[];
} {
  const { primary: brandColor, secondary: secondaryColor, mode: colorMode } = useBrandColors();
  const experienceSetting = useQuery(api.settings.getByKey, { key: CONTACT_EXPERIENCE_KEY });
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const socialSettings = useQuery(api.settings.listByGroup, { group: 'social' });
  const enabledFields = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'settings' });

  const isLoading = experienceSetting === undefined
    || contactSettings === undefined
    || socialSettings === undefined
    || enabledFields === undefined;

  const config = useMemo(
    () => parseContactExperienceConfig(experienceSetting?.value),
    [experienceSetting?.value]
  );

  const contactData = useMemo<ContactData>(() => {
    const mapData = getContactMapDataFromSettings(contactSettings ?? []);
    const settingsMap: Record<string, string | number> = {};
    contactSettings?.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    return {
      address: (settingsMap.contact_address as string) || mapData.address || '',
      email: (settingsMap.contact_email as string) || '',
      phone: (settingsMap.contact_phone as string) || '',
      taxId: (settingsMap.contact_tax_id as string) || mapData.taxId || '',
      lat: mapData.lat,
      lng: mapData.lng,
      mapProvider: mapData.mapProvider,
      googleMapEmbedIframe: mapData.googleMapEmbedIframe,
    };
  }, [contactSettings]);

  const zaloLink = useMemo(() => {
    const settingsMap: Record<string, string> = {};
    contactSettings?.forEach(setting => {
      settingsMap[setting.key] = typeof setting.value === 'string' ? setting.value : '';
    });
    return normalizeZaloLink(settingsMap.contact_zalo || '');
  }, [contactSettings]);

  const socialLinks = useMemo<SocialLinkItem[]>(() => {
    const settingsMap: Record<string, string> = {};
    socialSettings?.forEach(setting => {
      settingsMap[setting.key] = typeof setting.value === 'string' ? setting.value : '';
    });

    const enabledKeys = new Set(enabledFields?.map(f => f.fieldKey) ?? []);

    const candidates = [
      { label: 'Facebook', fieldKey: 'social_facebook', href: settingsMap.social_facebook || '', color: '#1877f2', icon: Facebook },
      { label: 'X (Twitter)', fieldKey: 'social_twitter', href: settingsMap.social_twitter || '', color: '#000000', icon: X },
      { label: 'Instagram', fieldKey: 'social_instagram', href: settingsMap.social_instagram || '', color: '#e1306c', icon: Instagram },
      { label: 'LinkedIn', fieldKey: 'social_linkedin', href: settingsMap.social_linkedin || '', color: '#0a66c2', icon: Linkedin },
      { label: 'YouTube', fieldKey: 'social_youtube', href: settingsMap.social_youtube || '', color: '#ff0000', icon: Youtube },
      { label: 'TikTok', fieldKey: 'social_tiktok', href: settingsMap.social_tiktok || '', color: '#000000', icon: TikTokIcon },
      { label: 'Zalo', fieldKey: 'contact_zalo', href: zaloLink, color: '#0084ff', icon: ZaloIcon },
      { label: 'Pinterest', fieldKey: 'social_pinterest', href: settingsMap.social_pinterest || '', color: '#E60023', icon: PinterestIcon },
    ];

    return candidates
      .filter((item) => item.href && enabledKeys.has(item.fieldKey))
      .map(({ label, href, color, icon }) => ({ label, href, color, icon }));
  }, [socialSettings, zaloLink, enabledFields]);

  return {
    brandColor,
    secondaryColor,
    colorMode,
    config,
    contactData,
    isLoading,
    socialLinks,
  };
}
