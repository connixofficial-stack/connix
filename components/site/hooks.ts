'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { formatHex, oklch } from 'culori';
import { api } from '@/convex/_generated/api';
import { useInitialBrandColors } from '@/components/providers/InitialBrandColorsProvider';
import { useSnapshotDemoContext } from '@/components/modules/homepage/SnapshotDemoProvider';

const DEFAULT_BRAND_COLOR = '#3b82f6';

const getCssVariableFromDoc = (name: string): string | null => {
  if (typeof document === 'undefined') {return null;}
  const inlineValue = document.documentElement.style.getPropertyValue(name).trim();
  return inlineValue || null;
};

const safeOklch = (value: string) => oklch(value) ?? oklch(DEFAULT_BRAND_COLOR);

const resolveColorSetting = (value: unknown): string | null => {
  if (typeof value !== 'string') {return null;}
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const generateComplementary = (hex: string): string => {
  const parsed = safeOklch(hex);
  if (!parsed) {return DEFAULT_BRAND_COLOR;}

  return formatHex(oklch({
    ...parsed,
    h: ((parsed.h ?? 0) + 180) % 360,
  }));
};

export function useBrandColors() {
  const snapshotDemo = useSnapshotDemoContext();
  const initialBrandColors = useInitialBrandColors();
  const snapshotSite = snapshotDemo?.getSiteSettings();
  // Skip DB queries entirely when snapshot provides site settings
  const skipDb = Boolean(snapshotSite);
  const primarySetting = useQuery(api.settings.getByKey, skipDb ? 'skip' : { key: 'site_brand_primary' });
  const secondarySetting = useQuery(api.settings.getByKey, skipDb ? 'skip' : { key: 'site_brand_secondary' });
  const modeSetting = useQuery(api.settings.getByKey, skipDb ? 'skip' : { key: 'site_brand_mode' });
  const primary = resolveColorSetting(snapshotSite?.site_brand_primary)
    ?? resolveColorSetting(primarySetting?.value)
    ?? initialBrandColors?.primary
    ?? resolveColorSetting(getCssVariableFromDoc('--site-brand-primary'))
    ?? DEFAULT_BRAND_COLOR;
  const mode = snapshotSite?.site_brand_mode
    ?? (modeSetting?.value === 'single'
      ? 'single'
      : (initialBrandColors?.mode ?? (getCssVariableFromDoc('--site-brand-mode') === 'single' ? 'single' : 'dual')));
  const secondary = mode === 'single'
    ? ''
    : resolveColorSetting(snapshotSite?.site_brand_secondary)
      ?? resolveColorSetting(secondarySetting?.value)
      ?? initialBrandColors?.secondary
      ?? resolveColorSetting(getCssVariableFromDoc('--site-brand-secondary'))
      ?? generateComplementary(primary);

  return { primary, secondary, mode };
}

// Hook lấy brandColor từ settings
export function useBrandColor() {
  return useBrandColors().primary;
}

// Hook lấy site settings
export function useSiteSettings() {
  const snapshotDemo = useSnapshotDemoContext();
  const snapshotSite = snapshotDemo?.getSiteSettings();
  const settings = useQuery(api.settings.listByGroup, snapshotSite ? 'skip' : { group: 'site' });
  const [isDark, setIsDark] = useState(false);
  
  const settingsMap: Record<string, string | boolean> = {};
  if (snapshotSite) {
    Object.entries(snapshotSite).forEach(([key, value]) => {
      settingsMap[key] = value;
    });
  } else if (settings !== undefined) {
    settings.forEach(s => {
      settingsMap[s.key] = typeof s.value === 'boolean' ? s.value : (s.value as string);
    });
  }

  const isLoading = !snapshotSite && settings === undefined;

  useEffect(() => {
    if (isLoading) return;

    const checkDark = () => {
      if (typeof window !== 'undefined') {
        return document.documentElement.classList.contains('dark');
      }
      return settingsMap.site_dark_mode === 'dark';
    };

    setIsDark(checkDark());

    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    window.addEventListener('site-theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('site-theme-change', handleThemeChange);
    };
  }, [isLoading, settingsMap.site_dark_mode]);
  
  if (isLoading) {
    return { 
      isLoading: true, 
      settings: {} as Record<string, string | boolean>,
      brandColor: DEFAULT_BRAND_COLOR,
      brandPrimary: DEFAULT_BRAND_COLOR,
      brandSecondary: '',
      favicon: '',
      logo: '',
      siteDescription: '',
      siteName: 'Website',
      siteDarkMode: 'light',
      isDark: false
    };
  }
  
  const brandPrimary = (settingsMap.site_brand_primary as string) || DEFAULT_BRAND_COLOR;
  const brandMode = settingsMap.site_brand_mode === 'single' ? 'single' : 'dual';
  const brandSecondary = brandMode === 'single'
    ? ''
    : (settingsMap.site_brand_secondary as string) || generateComplementary(brandPrimary);

  return {
    brandColor: brandPrimary,
    brandPrimary,
    brandSecondary,
    favicon: (settingsMap.site_favicon as string) || '',
    isLoading: false,
    logo: (settingsMap.site_logo as string) || '',
    settings: settingsMap,
    siteDescription: (settingsMap.site_description as string) || '',
    siteName: (settingsMap.site_name as string) || 'Website',
    siteDarkMode: (settingsMap.site_dark_mode as string) || 'light',
    isDark,
  };
}

// Hook lấy contact settings
export function useContactSettings() {
  const snapshotDemo = useSnapshotDemoContext();
  const snapshotContact = snapshotDemo?.getContactSettings();
  const settings = useQuery(api.settings.listByGroup, snapshotContact ? 'skip' : { group: 'contact' });
  
  if (!snapshotContact && settings === undefined) {
    return { isLoading: true };
  }
  
  const settingsMap: Record<string, string> = {};
  if (snapshotContact) {
    Object.entries(snapshotContact).forEach(([key, value]) => {
      settingsMap[key] = value;
    });
  } else {
    settings?.forEach(s => {
      settingsMap[s.key] = s.value as string;
    });
  }
  
  return {
    address: settingsMap.contact_address || '',
    email: settingsMap.contact_email || '',
    isLoading: false,
    phone: settingsMap.contact_phone || '',
  };
}

// Hook lấy social links settings
export function useSocialLinks() {
  const snapshotDemo = useSnapshotDemoContext();
  const snapshotSocial = snapshotDemo?.getSocialSettings();
  const snapshotContact = snapshotDemo?.getContactSettings();
  const skipSocial = Boolean(snapshotSocial);
  const skipContact = Boolean(snapshotContact);
  const settings = useQuery(api.settings.listByGroup, skipSocial ? 'skip' : { group: 'social' });
  const contactSettings = useQuery(api.settings.listByGroup, skipContact ? 'skip' : { group: 'contact' });
  const enabledFields = useQuery(api.admin.modules.listEnabledModuleFields, skipSocial && skipContact ? 'skip' : { moduleKey: 'settings' });
  
  if (!snapshotSocial && (settings === undefined || contactSettings === undefined || enabledFields === undefined)) {
    return { isLoading: true };
  }
  
  const settingsMap: Record<string, string> = {};
  if (snapshotSocial) {
    Object.entries(snapshotSocial).forEach(([key, value]) => {
      settingsMap[key] = value;
    });
  } else {
    settings?.forEach(s => {
      settingsMap[s.key] = s.value as string;
    });
  }

  const contactMap: Record<string, string> = {};
  if (snapshotContact) {
    Object.entries(snapshotContact).forEach(([key, value]) => {
      contactMap[key] = value;
    });
  } else {
    contactSettings?.forEach(s => {
      contactMap[s.key] = s.value as string;
    });
  }

  const enabledKeys = new Set(
    skipSocial && skipContact
      ? ['social_facebook', 'social_instagram', 'social_linkedin', 'social_tiktok', 'social_twitter', 'social_youtube', 'contact_zalo', 'social_pinterest']
      : (enabledFields?.map(f => f.fieldKey) ?? [])
  );
  
  return {
    facebook: enabledKeys.has('social_facebook') ? (settingsMap.social_facebook || '') : '',
    instagram: enabledKeys.has('social_instagram') ? (settingsMap.social_instagram || '') : '',
    isLoading: false,
    linkedin: enabledKeys.has('social_linkedin') ? (settingsMap.social_linkedin || '') : '',
    pinterest: enabledKeys.has('social_pinterest') ? (settingsMap.social_pinterest || '') : '',
    tiktok: enabledKeys.has('social_tiktok') ? (settingsMap.social_tiktok || '') : '',
    twitter: enabledKeys.has('social_twitter') ? (settingsMap.social_twitter || '') : '',
    youtube: enabledKeys.has('social_youtube') ? (settingsMap.social_youtube || '') : '',
    zalo: enabledKeys.has('contact_zalo') ? (contactMap.contact_zalo || '') : '',
  };
}
