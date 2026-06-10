'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, LayoutTemplate, Loader2, Palette, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { revalidateSeoPaths } from '@/app/actions/seo-revalidate';
import { Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Input, Label, cn } from '../../components/ui';
import { ModuleGuard } from '../../components/ModuleGuard';
import { SettingsImageUploader } from '../../components/SettingsImageUploader';
import { TagInput } from '../../components/TagInput';
import MapLocationPicker from '../MapLocationPicker';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { AiSeoImportDialog } from './AiSeoImportDialog';
import { SeoBuilderDialog } from './SeoBuilderDialog';
import { ProductSupplementalContentManager } from './ProductSupplementalContentManager';
import { ShopConfigAdminContainer } from '@/components/modules/orders/ShopConfigAdminContainer';
import { getEmailConfigurationStatus } from '@/lib/email-config-status';

type SettingsSection = 'site' | 'contact' | 'seo' | 'advanced';
type SettingsFormValue = string | boolean;
type AdvancedTab = 'product-placeholder' | 'product-frame' | 'watermark' | 'header' | 'product-supplemental' | 'shop-config' | 'email-config';
const ADVANCED_TAB_ORDER: AdvancedTab[] = ['product-placeholder', 'product-frame', 'watermark', 'header', 'product-supplemental', 'shop-config', 'email-config'];
type HeaderConfig = {
  showBrandName?: boolean;
  logoSizeLevel?: number;
  headerSpacingLevel?: number;
  logoBackgroundStyle?: string;
  headerSticky?: boolean;
  headerStickyDesktop?: boolean;
  headerStickyMobile?: boolean;
  cta?: {
    show?: boolean;
    text?: string;
    url?: string;
  };
  [key: string]: unknown;
};
type SettingsToSave = {
  group: string;
  key: string;
  storageId?: Id<'_storage'> | null;
  value: unknown;
};

const MODULE_KEY = 'settings';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECTION_LABELS: Record<SettingsSection, string> = {
  contact: 'Thông tin liên hệ',
  seo: 'Cài đặt SEO',
  site: 'Thông tin chung',
  advanced: 'Cài đặt nâng cao',
};

// Color utilities
const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {return { h: 0, l: 0, s: 0 };}
  const r = Number.parseInt(result[1], 16) / 255;
  const g = Number.parseInt(result[2], 16) / 255;
  const b = Number.parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: { h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      }
      case g: { h = ((b - r) / d + 2) / 6; break;
      }
      case b: { h = ((r - g) / d + 4) / 6; break;
      }
    }
  }
  return { h: Math.round(h * 360), l: Math.round(l * 100), s: Math.round(s * 100) };
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const generateTintsShades = (hex: string): string[] => {
  const { h, s } = hexToHSL(hex);
  const lightnesses = [95, 85, 75, 65, 55, 45, 35, 25, 15, 5];
  return lightnesses.map(newL => hslToHex(h, s, newL));
};

const generateComplementary = (hex: string): string => {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex((h + 180) % 360, s, l);
};

const isValidHexColor = (color: string): boolean => /^#[0-9A-Fa-f]{6}$/.test(color);

const GROUP_LABELS: Record<string, string> = {
  contact: 'Thông tin liên hệ',
  seo: 'Cài đặt SEO',
  site: 'Thông tin chung',
  social: 'Mạng xã hội',
  advanced: 'Cài đặt nâng cao',
};

const SEO_META_LIMITS: Record<string, number> = {
  seo_description: 160,
  seo_title: 60,
};

const REMOVED_SEO_KEYS = new Set([
  'seo_robots',
  'seo_business_type',
  'seo_opening_hours',
  'seo_price_range',
  'seo_geo_lat',
  'seo_geo_lng',
  'seo_hreflang',
]);

const HIDDEN_ADMIN_SEO_KEYS = new Set([
  ...REMOVED_SEO_KEYS,
  'seo_google_verification',
  'seo_bing_verification',
]);

const REMOVED_CONTACT_KEYS = new Set([
  'contact_hotline',
  'social_zalo',
]);

const SETTING_STORAGE_ID_SUFFIX = '__storageId';
const PRODUCT_IMAGE_ADVANCED_FEATURE = 'enableProductImageAdvanced';
const PRODUCT_FRAME_ADVANCED_FEATURE = 'enableProductFrameAdvanced';
const PRODUCT_WATERMARK_ADVANCED_FEATURE = 'enableProductWatermarkAdvanced';
const HEADER_MENU_ADVANCED_FEATURE = 'enableHeaderMenuAdvanced';
const PRODUCT_SUPPLEMENTAL_ADVANCED_FEATURE = 'enableProductSupplementalAdvanced';
const SHOP_CONFIG_ADVANCED_FEATURE = 'enableShopConfigAdvanced';
const EMAIL_CONFIG_ADVANCED_FEATURE = 'enableMail';
const EMAIL_SETTING_KEYS = [
  'mail_driver',
  'mail_from_email',
  'mail_from_name',
  'order_notification_emails',
] as const;
const EMAIL_DEFAULTS: Record<(typeof EMAIL_SETTING_KEYS)[number], string> = {
  mail_driver: 'resend',
  mail_from_email: '',
  mail_from_name: 'YourBrand',
  order_notification_emails: '',
};
const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  showBrandName: true,
  logoSizeLevel: 2,
  headerSpacingLevel: 5,
  logoBackgroundStyle: 'none',
  headerSticky: true,
  headerStickyDesktop: true,
  headerStickyMobile: true,
  cta: { show: true, text: 'Liên hệ', url: '/contact' },
};
const LOGO_SIZE_OPTIONS = Array.from({ length: 30 }, (_, index) => ({
  value: index + 1,
  label: `Nấc ${index + 1}`,
}));
const HEADER_SPACING_OPTIONS = [
  { value: 1, label: 'Siêu gọn' },
  { value: 2, label: 'Rất gọn' },
  { value: 3, label: 'Gọn' },
  { value: 4, label: 'Hơi gọn' },
  { value: 5, label: 'Cân bằng' },
  { value: 6, label: 'Hơi thoáng' },
  { value: 7, label: 'Trung bình' },
];
const LOGO_BACKGROUND_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'border', label: 'Border' },
  { id: 'outline', label: 'Outline sạch' },
  { id: 'hairline', label: 'Hairline nhẹ' },
  { id: 'inset', label: 'Inset panel' },
  { id: 'pill', label: 'Pill badge' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'soft', label: 'Soft card' },
  { id: 'solid', label: 'Solid contrast' },
];

const normalizeHeaderConfig = (value: unknown): HeaderConfig => {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as HeaderConfig
    : {};
  return {
    ...raw,
    showBrandName: raw.showBrandName ?? DEFAULT_HEADER_CONFIG.showBrandName,
    logoSizeLevel: typeof raw.logoSizeLevel === 'number' ? Math.min(30, Math.max(1, Math.round(raw.logoSizeLevel))) : DEFAULT_HEADER_CONFIG.logoSizeLevel,
    headerSpacingLevel: typeof raw.headerSpacingLevel === 'number' ? Math.min(7, Math.max(1, Math.round(raw.headerSpacingLevel))) : DEFAULT_HEADER_CONFIG.headerSpacingLevel,
    logoBackgroundStyle: typeof raw.logoBackgroundStyle === 'string' ? raw.logoBackgroundStyle : DEFAULT_HEADER_CONFIG.logoBackgroundStyle,
    headerSticky: raw.headerSticky ?? DEFAULT_HEADER_CONFIG.headerSticky,
    headerStickyDesktop: raw.headerStickyDesktop ?? raw.headerSticky ?? DEFAULT_HEADER_CONFIG.headerStickyDesktop,
    headerStickyMobile: raw.headerStickyMobile ?? raw.headerSticky ?? DEFAULT_HEADER_CONFIG.headerStickyMobile,
    cta: {
      ...DEFAULT_HEADER_CONFIG.cta,
      ...(raw.cta && typeof raw.cta === 'object' ? raw.cta : {}),
    },
  };
};

const stableStringify = (value: unknown) => JSON.stringify(value ?? null);

export default function SettingsPageShell({ section }: { section: SettingsSection }) {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <SettingsContent section={section} />
    </ModuleGuard>
  );
}

function SettingsContent({ section }: { section: SettingsSection }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [form, setForm] = useState<Record<string, SettingsFormValue>>({});
  const [initialForm, setInitialForm] = useState<Record<string, SettingsFormValue>>({});
  const [mediaStorageIds, setMediaStorageIds] = useState<Record<string, Id<'_storage'> | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSecondaryAuto, setIsSecondaryAuto] = useState(true);
  const [hasCleanedSeoFields, setHasCleanedSeoFields] = useState(false);
  const [hasCleanedContactFields, setHasCleanedContactFields] = useState(false);
  const [advancedTab, setAdvancedTab] = useState<AdvancedTab>('product-placeholder');
  const [headerConfigDraft, setHeaderConfigDraft] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);
  const [initialHeaderConfig, setInitialHeaderConfig] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);
  const [activeDrag, setActiveDrag] = useState<'image-move' | 'image-resize' | 'text-move' | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const previewCanvasRef = React.useRef<HTMLDivElement>(null);

  // Queries
  const settingsData = useQuery(api.settings.listAll);
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const fieldsData = useQuery(api.admin.modules.listModuleFields, { moduleKey: MODULE_KEY });
  const defaultImageAspectRatio = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const [selectedFrameAR, setSelectedFrameAR] = useState<string>('');
  const [shopConfigDirty, setShopConfigDirty] = useState(false);
  const [shopConfigSaving, setShopConfigSaving] = useState(false);
  const saveShopConfigRef = React.useRef<{ save: () => Promise<void> } | null>(null);
 
  // Parse enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const isFeatureEnabled = (featureKey: string, fallback = false) => (
    featuresData?.some(feature => feature.featureKey === featureKey)
      ? Boolean(enabledFeatures[featureKey])
      : fallback
  );

  const canEditProductImage = isFeatureEnabled(PRODUCT_IMAGE_ADVANCED_FEATURE, true);
  const canEditProductFrame = isFeatureEnabled(PRODUCT_FRAME_ADVANCED_FEATURE, true);
  const canEditProductWatermark = isFeatureEnabled(PRODUCT_WATERMARK_ADVANCED_FEATURE, true);
 
  const canEditHeaderMenu = isFeatureEnabled(HEADER_MENU_ADVANCED_FEATURE, false);
 
  const canEditShopConfig = isFeatureEnabled(SHOP_CONFIG_ADVANCED_FEATURE, false);

  const canEditEmailConfig = isFeatureEnabled(EMAIL_CONFIG_ADVANCED_FEATURE, false);
 
  const canEditProductSupplemental = isFeatureEnabled(PRODUCT_SUPPLEMENTAL_ADVANCED_FEATURE, true);
  const enabledAdvancedTabs = useMemo<AdvancedTab[]>(() => ADVANCED_TAB_ORDER.filter((tab) => {
    switch (tab) {
      case 'product-placeholder': return canEditProductImage;
      case 'product-frame': return canEditProductFrame;
      case 'watermark': return canEditProductWatermark;
      case 'header': return canEditHeaderMenu;
      case 'product-supplemental': return canEditProductSupplemental;
      case 'shop-config': return canEditShopConfig;
      case 'email-config': return canEditEmailConfig;
      default: return false;
    }
  }), [
    canEditEmailConfig,
    canEditHeaderMenu,
    canEditProductFrame,
    canEditProductImage,
    canEditProductSupplemental,
    canEditProductWatermark,
    canEditShopConfig,
  ]);

  useEffect(() => {
    if (tabParam === 'product-supplemental' && canEditProductSupplemental) {
      setAdvancedTab('product-supplemental');
    }
  }, [tabParam, canEditProductSupplemental]);
 
  useEffect(() => {
    if (tabParam === 'shop-config' && canEditShopConfig) {
      setAdvancedTab('shop-config');
    }
  }, [tabParam, canEditShopConfig]);

  useEffect(() => {
    if (tabParam === 'email-config' && canEditEmailConfig) {
      setAdvancedTab('email-config');
    }
  }, [tabParam, canEditEmailConfig]);

  const handlePreviewPointerDown = (e: React.PointerEvent<HTMLDivElement>, type: 'image-move' | 'image-resize' | 'text-move') => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn('setPointerCapture failed', err);
    }
    setActiveDrag(type);
  };

  const handlePreviewPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDrag) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    
    // Convert to percentage
    const xPct = Math.min(100, Math.max(0, Math.round((xPx / rect.width) * 100)));
    const yPct = Math.min(100, Math.max(0, Math.round((yPx / rect.height) * 100)));

    if (activeDrag === 'image-move') {
      updateField('product_watermark_image_x', String(xPct));
      updateField('product_watermark_image_y', String(yPct));
    } else if (activeDrag === 'text-move') {
      updateField('product_watermark_text_y', String(yPct));
    } else if (activeDrag === 'image-resize') {
      const imageX = parseFloat(String(form.product_watermark_image_x || 80));
      const imageXPx = (imageX / 100) * rect.width;
      const halfWidthPx = Math.abs(e.clientX - rect.left - imageXPx);
      const widthPct = Math.min(80, Math.max(5, Math.round((halfWidthPx * 2 / rect.width) * 100)));
      updateField('product_watermark_image_width', String(widthPct));
    }
  };

  const handlePreviewPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDrag) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setActiveDrag(null);
    }
  };

  // Mutations
  const setMultiple = useMutation(api.settings.setMultiple);
  const removeMultiple = useMutation(api.settings.removeMultiple);

  const isLoading = settingsData === undefined
    || featuresData === undefined
    || fieldsData === undefined;

  const isSectionEnabled = section === 'site'
    ? true
    : section === 'contact'
      ? Boolean(enabledFeatures.enableContact)
      : section === 'seo'
        ? Boolean(enabledFeatures.enableSEO)
        : true;

  const brandMode = form.site_brand_mode === 'single' ? 'single' : 'dual';
  const isSecondaryModeSingle = brandMode === 'single';

  // Filter and group fields based on enabled status and feature
  const fieldsByGroup = useMemo(() => {
    const groups: Record<string, typeof fieldsData> = {};
    
    fieldsData?.forEach(field => {
      if (field.fieldKey === 'site_brand_color') {return;}
      // Skip disabled fields
      if (!field.enabled) {return;}
      
      // Skip fields whose linked feature is disabled
      if (field.linkedFeature && !enabledFeatures[field.linkedFeature]) {return;}

      if (HIDDEN_ADMIN_SEO_KEYS.has(field.fieldKey)) {return;}
      if (REMOVED_CONTACT_KEYS.has(field.fieldKey)) {return;}

      // Skip lat/lng fields (managed by MapLocationPicker)
      if (field.fieldKey === 'contact_lat' || field.fieldKey === 'contact_lng') {return;}

      const group = field.group ?? 'site';
      groups[group] ??= [];
      groups[group].push(field);
    });

    // Sort fields by order within each group
    Object.keys(groups).forEach(key => {
      groups[key]!.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    return groups;
  }, [fieldsData, enabledFeatures]);

  // Sync form with settings data
  useEffect(() => {
    if (settingsData) {
      const values: Record<string, SettingsFormValue> = {};
      const storageIds: Record<string, Id<'_storage'> | null> = {};
      settingsData.forEach(s => {
        if (s.key.endsWith(SETTING_STORAGE_ID_SUFFIX)) {
          const ownerKey = s.key.slice(0, -SETTING_STORAGE_ID_SUFFIX.length);
          storageIds[ownerKey] = typeof s.value === 'string' ? s.value as Id<'_storage'> : null;
          return;
        }
        if (s.key === 'header_config') {
          const normalized = normalizeHeaderConfig(s.value);
          setHeaderConfigDraft(normalized);
          setInitialHeaderConfig(normalized);
          return;
        }
        values[s.key] = typeof s.value === 'boolean' ? s.value : (typeof s.value === 'string' ? s.value : String(s.value ?? ''));
      });
      if (!values.contact_lat) {
        values.contact_lat = '10.762622';
      }
      if (!values.contact_lng) {
        values.contact_lng = '106.660172';
      }
      if (!values.contact_map_provider) {
        values.contact_map_provider = 'openstreetmap';
      }
      if (!values.contact_google_map_embed_iframe) {
        values.contact_google_map_embed_iframe = '';
      }
      if (values.product_image_placeholder === undefined) {
        values.product_image_placeholder = '';
      }
      if (values.enable_product_frames === undefined) {
        values.enable_product_frames = false;
      }
      const frameKeys = [
        'product_frame_overlay_square_url',
        'product_frame_overlay_portrait916_url',
        'product_frame_overlay_portrait34_url',
        'product_frame_overlay_landscape43_url',
        'product_frame_overlay_wide169_url',
      ];
      frameKeys.forEach((key) => {
        if (values[key] === undefined) {
          values[key] = '';
        }
      });
      if (values.enable_product_watermark === undefined) {
        values.enable_product_watermark = false;
      }
      // Defaults cho watermark hình
      if (values.product_watermark_image_enabled === undefined) {
        values.product_watermark_image_enabled = false;
      }
      if (values.product_watermark_image_url === undefined) {
        values.product_watermark_image_url = '';
      }
      if (values.product_watermark_image_x === undefined) {
        values.product_watermark_image_x = '80';
      }
      if (values.product_watermark_image_y === undefined) {
        values.product_watermark_image_y = '80';
      }
      if (values.product_watermark_image_width === undefined) {
        values.product_watermark_image_width = '28';
      }
      if (values.product_watermark_image_opacity === undefined) {
        values.product_watermark_image_opacity = '40';
      }

      // Defaults cho watermark chữ
      if (values.product_watermark_text_enabled === undefined) {
        values.product_watermark_text_enabled = false;
      }
      if (values.product_watermark_text_content === undefined) {
        values.product_watermark_text_content = '';
      }
      if (values.product_watermark_text_y === undefined) {
        values.product_watermark_text_y = '80';
      }
      if (values.product_watermark_text_font_size === undefined) {
        values.product_watermark_text_font_size = '8';
      }
      if (values.product_watermark_text_color === undefined) {
        values.product_watermark_text_color = '#64748B';
      }
      if (values.product_watermark_text_opacity === undefined) {
        values.product_watermark_text_opacity = '35';
      }
      if (values.product_watermark_text_repeat === undefined) {
        values.product_watermark_text_repeat = false;
      }
      EMAIL_SETTING_KEYS.forEach((key) => {
        if (values[key] === undefined) {
          if (key === 'mail_from_name') {
            values[key] = (values.site_name as string) || EMAIL_DEFAULTS.mail_from_name;
          } else {
            values[key] = EMAIL_DEFAULTS[key];
          }
        }
      });
      setIsSecondaryAuto(values.site_brand_mode === 'single' ? true : !values.site_brand_secondary);
      setForm(values);
      setInitialForm(values);
      setMediaStorageIds(storageIds);
    }
  }, [settingsData]);

  useEffect(() => {
    if (!settingsData || hasCleanedSeoFields) {return;}
    const hasRemoved = settingsData.some(setting => REMOVED_SEO_KEYS.has(setting.key));
    if (!hasRemoved) {
      setHasCleanedSeoFields(true);
      return;
    }
    void removeMultiple({ keys: Array.from(REMOVED_SEO_KEYS) })
      .finally(() => setHasCleanedSeoFields(true));
  }, [settingsData, hasCleanedSeoFields, removeMultiple]);

  useEffect(() => {
    if (!settingsData || hasCleanedContactFields) {return;}
    const hasRemoved = settingsData.some(setting => REMOVED_CONTACT_KEYS.has(setting.key));
    if (!hasRemoved) {
      setHasCleanedContactFields(true);
      return;
    }
    void removeMultiple({ keys: Array.from(REMOVED_CONTACT_KEYS) })
      .finally(() => setHasCleanedContactFields(true));
  }, [settingsData, hasCleanedContactFields, removeMultiple]);

  useEffect(() => {
    if (isSecondaryModeSingle && !isSecondaryAuto) {
      setIsSecondaryAuto(true);
    }
  }, [isSecondaryModeSingle, isSecondaryAuto]);

  useEffect(() => {
    if (isLoading) {return;}
    if (!isSectionEnabled) {
      router.replace('/admin/settings/general');
    }
  }, [isLoading, isSectionEnabled, router]);

  useEffect(() => {
    if (section !== 'advanced') {return;}
    if (enabledAdvancedTabs.length > 0 && !enabledAdvancedTabs.includes(advancedTab)) {
      setAdvancedTab(enabledAdvancedTabs[0]);
    }
  }, [advancedTab, enabledAdvancedTabs, section]);

  // Detect changes
  const headerConfigHasChanges = useMemo(
    () => stableStringify(headerConfigDraft) !== stableStringify(initialHeaderConfig),
    [headerConfigDraft, initialHeaderConfig]
  );
  
  const isShopConfigTab = section === 'advanced' && advancedTab === 'shop-config' && canEditShopConfig;
 
  const hasChanges = useMemo(() => {
    if (isShopConfigTab) {
      return shopConfigDirty;
    }
    return Object.keys(form).some(key => form[key] !== initialForm[key]) || (canEditHeaderMenu && headerConfigHasChanges);
  }, [isShopConfigTab, shopConfigDirty, form, initialForm, canEditHeaderMenu, headerConfigHasChanges]);

  const emailStatus = useMemo(() => getEmailConfigurationStatus(form), [form]);
  const savedEmailStatus = useMemo(() => getEmailConfigurationStatus(initialForm), [initialForm]);
 
  const isCurrentlySaving = isSaving || (isShopConfigTab && shopConfigSaving);

  const updateField = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const getStringField = (key: string, fallback = '') => {
    const value = form[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
    if (key === 'mail_from_name') {
      return (form.site_name as string) || fallback;
    }
    return typeof value === 'string' ? value : fallback;
  };

  const updateImageField = (key: string, url: string | undefined, storageId?: Id<'_storage'> | null) => {
    updateField(key, url ?? '');
    if (storageId !== undefined) {
      setMediaStorageIds(prev => ({ ...prev, [key]: storageId }));
    }
  };

  const handleSendTestEmail = async () => {
    const email = testEmail.trim();
    if (!EMAIL_REGEX.test(email)) {
      toast.error('Email nhận thử không hợp lệ.');
      return;
    }
    if (hasChanges) {
      toast.error('Vui lòng lưu cấu hình email trước khi gửi thử.');
      return;
    }
    if (!savedEmailStatus.configured) {
      toast.error('Dev chưa cấu hình email gửi ra. Vui lòng liên hệ dev.');
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const response = await fetch('/api/system/integrations/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Email test từ ${getStringField('mail_from_name', 'YourBrand')}`,
          html: `<p>Đây là email test từ hệ thống ${getStringField('mail_from_name', 'YourBrand')}.</p>`,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || 'Gửi email thử thất bại.');
      }
      toast.success('Đã gửi email thử. Vui lòng kiểm tra hộp thư.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gửi email thử thất bại.');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const updateHeaderConfig = <K extends keyof HeaderConfig>(key: K, value: HeaderConfig[K]) => {
    setHeaderConfigDraft(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'headerStickyDesktop' || key === 'headerStickyMobile'
        ? {
            headerSticky: key === 'headerStickyDesktop'
              ? Boolean(value)
              : (prev.headerStickyDesktop ?? prev.headerSticky ?? true),
          }
        : {}),
    }));
  };

  const updateHeaderCta = <K extends keyof NonNullable<HeaderConfig['cta']>>(key: K, value: NonNullable<HeaderConfig['cta']>[K]) => {
    setHeaderConfigDraft(prev => ({
      ...prev,
      cta: {
        ...DEFAULT_HEADER_CONFIG.cta,
        ...prev.cta,
        [key]: value,
      },
    }));
  };

  // Validate before save
  const validateForm = (): boolean => {
    // Validate color fields
    const colorFields = fieldsData?.filter(f => f.type === 'color') ?? [];
    for (const field of colorFields) {
      const value = form[field.fieldKey];
      if (typeof value === 'string' && value && !isValidHexColor(value)) {
        toast.error(`${field.name}: Mã màu không hợp lệ (cần format #RRGGBB)`);
        return false;
      }
    }

    const mapProvider = form.contact_map_provider === 'google_embed' ? 'google_embed' : 'openstreetmap';
    const googleIframe = typeof form.contact_google_map_embed_iframe === 'string'
      ? form.contact_google_map_embed_iframe.trim()
      : '';
    if (mapProvider === 'google_embed' && googleIframe) {
      const hasIframe = googleIframe.includes('<iframe') && googleIframe.includes('</iframe>');
      if (!hasIframe) {
        toast.error('Google Maps: Vui lòng dán đúng mã iframe nhúng.');
        return false;
      }
    }

    if (section === 'advanced' && advancedTab === 'email-config' && canEditEmailConfig) {
      const fromEmail = getStringField('mail_from_email').trim();
      if (fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
        toast.error('Email gửi đi không hợp lệ.');
        return false;
      }

      const adminEmailsStr = getStringField('order_notification_emails').trim();
      if (adminEmailsStr) {
        const emails = adminEmailsStr.split(/[,\n;]+/).map((e) => e.trim()).filter(Boolean);
        for (const email of emails) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error(`Email nhận thông báo "${email}" không hợp lệ.`);
            return false;
          }
        }
      }
    }

    // Validate required fields
    const requiredFields = fieldsData?.filter(f => f.required && f.enabled) ?? [];
    for (const field of requiredFields) {
      const value = form[field.fieldKey];
      if (typeof value === 'string' ? !value.trim() : value === undefined || value === null) {
        toast.error(`${field.name} là bắt buộc`);
        return false;
      }
    }

    return true;
  };

  const handleTabChange = (nextTab: AdvancedTab) => {
    if (isShopConfigTab && shopConfigDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu trong Cấu hình cửa hàng. Nếu chuyển tab, các thay đổi này sẽ bị mất. Bạn có chắc chắn muốn chuyển không?')) {
        setShopConfigDirty(false);
        setAdvancedTab(nextTab);
      }
    } else {
      setAdvancedTab(nextTab);
    }
  };

  const handleSave = async () => {
    if (isShopConfigTab) {
      if (saveShopConfigRef.current) {
        await saveShopConfigRef.current.save();
      }
      return;
    }
 
    if (!validateForm()) {return;}
 
    setIsSaving(true);
    try {
      // Get all enabled fields and their groups
      const settingsToSave: SettingsToSave[] = fieldsData
        ?.filter(f => {
          if (!f.enabled) {return false;}
          if (f.fieldKey === 'site_brand_color') {return false;}
          if (HIDDEN_ADMIN_SEO_KEYS.has(f.fieldKey)) {return false;}
          if (REMOVED_CONTACT_KEYS.has(f.fieldKey)) {return false;}
          return !f.linkedFeature || enabledFeatures[f.linkedFeature];
        })
        .map(field => {
          let value = form[field.fieldKey] ?? '';
          if (field.type === 'boolean') {
            value = value === true || value === 'true';
          }
          if (field.fieldKey === 'site_brand_secondary' && (isSecondaryAuto || isSecondaryModeSingle)) {
            value = '';
          }
          return {
            group: field.group ?? 'site',
            key: field.fieldKey,
            ...(field.type === 'image' ? { storageId: mediaStorageIds[field.fieldKey] ?? null } : {}),
            value,
          };
        }) ?? [];

      if (form.contact_lat && !settingsToSave.some((item) => item.key === 'contact_lat')) {
        settingsToSave.push({ group: 'contact', key: 'contact_lat', value: form.contact_lat });
      }
      if (form.contact_lng && !settingsToSave.some((item) => item.key === 'contact_lng')) {
        settingsToSave.push({ group: 'contact', key: 'contact_lng', value: form.contact_lng });
      }
      if (!settingsToSave.some((item) => item.key === 'contact_map_provider')) {
        settingsToSave.push({
          group: 'contact',
          key: 'contact_map_provider',
          value: form.contact_map_provider || 'openstreetmap',
        });
      }
      if (!settingsToSave.some((item) => item.key === 'contact_google_map_embed_iframe')) {
        settingsToSave.push({
          group: 'contact',
          key: 'contact_google_map_embed_iframe',
          value: form.contact_google_map_embed_iframe || '',
        });
      }
      if (!settingsToSave.some((item) => item.key === 'product_image_placeholder')) {
        settingsToSave.push({
          group: 'advanced',
          key: 'product_image_placeholder',
          storageId: mediaStorageIds.product_image_placeholder ?? null,
          value: form.product_image_placeholder || '',
        });
      }
      const frameKeys = [
        'product_frame_overlay_square_url',
        'product_frame_overlay_portrait916_url',
        'product_frame_overlay_portrait34_url',
        'product_frame_overlay_landscape43_url',
        'product_frame_overlay_wide169_url',
      ];
      frameKeys.forEach((key) => {
        if (!settingsToSave.some((item) => item.key === key)) {
          settingsToSave.push({
            group: 'advanced',
            key,
            storageId: mediaStorageIds[key] ?? null,
            value: form[key] || '',
          });
        }
      });
      // Save watermark settings
      const watermarkKeys = [
        'enable_product_watermark',
        'product_watermark_image_enabled',
        'product_watermark_image_url',
        'product_watermark_image_x',
        'product_watermark_image_y',
        'product_watermark_image_width',
        'product_watermark_image_opacity',
        'product_watermark_text_enabled',
        'product_watermark_text_content',
        'product_watermark_text_y',
        'product_watermark_text_font_size',
        'product_watermark_text_color',
        'product_watermark_text_opacity',
        'product_watermark_text_repeat',
      ];
      watermarkKeys.forEach((key) => {
        if (!settingsToSave.some((item) => item.key === key)) {
          let value = form[key] ?? '';
          if (
            key === 'enable_product_watermark' ||
            key === 'product_watermark_image_enabled' ||
            key === 'product_watermark_text_enabled' ||
            key === 'product_watermark_text_repeat'
          ) {
            value = form[key] === true || form[key] === 'true';
          }
          settingsToSave.push({
            group: 'advanced',
            key,
            ...(key === 'product_watermark_image_url' ? { storageId: mediaStorageIds.product_watermark_image_url ?? null } : {}),
            value: String(value),
          });
        }
      });
      if (canEditHeaderMenu && !settingsToSave.some((item) => item.key === 'header_config')) {
        settingsToSave.push({
          group: 'site',
          key: 'header_config',
          value: normalizeHeaderConfig(headerConfigDraft),
        });
      }
      if (section === 'advanced' && advancedTab === 'email-config' && canEditEmailConfig) {
        EMAIL_SETTING_KEYS.forEach((key) => {
          if (!settingsToSave.some((item) => item.key === key)) {
            settingsToSave.push({
              group: 'mail',
              key,
              value: form[key] ?? EMAIL_DEFAULTS[key],
            });
          }
        });
      }

      const hasSiteUrlChanged = form.site_url !== initialForm.site_url;
      await setMultiple({ settings: settingsToSave });
      if (hasSiteUrlChanged) {
        void revalidateSeoPaths().catch(() => {
          toast.warning('Đã lưu, đồng bộ SEO đang chậm.');
        });
      }
      setInitialForm({ ...form });
      setInitialHeaderConfig(normalizeHeaderConfig(headerConfigDraft));
      toast.success('Đã lưu cài đặt thành công!');
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(`Lỗi khi lưu: ${error instanceof Error ? error.message : 'Không xác định'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Render field based on type
  const renderField = (field: NonNullable<typeof fieldsData>[number]) => {
    const value = form[field.fieldKey];
    const stringValue = typeof value === 'string' ? value : '';
    const key = field.fieldKey;
    const metaLimit = SEO_META_LIMITS[key];
    const showCounter = Boolean(metaLimit);
    const counterText = showCounter ? `${stringValue.length}/${metaLimit}` : null;

    switch (field.type) {
      case 'color': {
        if (key === 'site_brand_secondary') {
          const primaryColor = (form.site_brand_primary as string) || '#3b82f6';
          const normalizedPrimary = isValidHexColor(primaryColor) ? primaryColor : '#3b82f6';
          const derivedSecondary = generateComplementary(normalizedPrimary);
          const displayColor = isSecondaryModeSingle ? derivedSecondary : (isSecondaryAuto ? derivedSecondary : stringValue);
          const isSecondaryDisabled = isSecondaryAuto || isSecondaryModeSingle;

          return (
            <div className="space-y-2" key={key}>
              <div className="flex items-center justify-between gap-3">
                <Label className={cn(isSecondaryModeSingle && 'opacity-50')}>{field.name}</Label>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={isSecondaryAuto}
                    onChange={(e) => {
                      if (isSecondaryModeSingle) {return;}
                      const auto = e.target.checked;
                      setIsSecondaryAuto(auto);
                      if (auto) {
                        updateField(key, '');
                      }
                    }}
                    className="rounded border-slate-300"
                    disabled={isSecondaryModeSingle}
                  />
                  Tự động sinh từ màu chính
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                type="color"
                value={isValidHexColor(displayColor) ? displayColor : derivedSecondary}
                  onChange={(e) => {
                    if (!isSecondaryDisabled) {
                      updateField(key, e.target.value);
                    }
                  }}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
                  disabled={isSecondaryDisabled}
                />
                <Input
                  value={(displayColor || '').toUpperCase()}
                  onChange={(e) => {
                    if (!isSecondaryDisabled) {
                      updateField(key, e.target.value);
                    }
                  }}
                  className="w-28 font-mono text-sm uppercase"
                  maxLength={7}
                  placeholder="#000000"
                  disabled={isSecondaryDisabled}
                />
                <Palette size={16} className="text-slate-400" />
              </div>
              {displayColor && isValidHexColor(displayColor) && (
                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  {generateTintsShades(displayColor).map((shade, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>{
                        if (!isSecondaryDisabled) {
                          updateField(key, shade);
                        }
                      }}
                      className="flex-1 h-8 transition-all hover:scale-y-125 hover:z-10 relative group"
                      style={{ backgroundColor: shade }}
                      title={shade.toUpperCase()}
                      disabled={isSecondaryDisabled}
                    >
                      <span
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[8px] font-mono font-bold"
                        style={{ color: idx < 5 ? '#000' : '#fff' }}
                      >
                        {shade.toUpperCase().slice(1)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
        <div className="space-y-2" key={key}>
            <Label>{field.name}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
              value={isValidHexColor(stringValue) ? stringValue : '#3b82f6'}
                onChange={(e) =>{  updateField(key, e.target.value); }}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
              />
              <Input
              value={stringValue.toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value;
                  updateField(key, val);
                }}
                className="w-28 font-mono text-sm uppercase"
                maxLength={7}
                placeholder="#000000"
              />
              <Palette size={16} className="text-slate-400" />
            </div>
            {stringValue && isValidHexColor(stringValue) && (
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                {generateTintsShades(stringValue).map((shade, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>{  updateField(key, shade); }}
                    className="flex-1 h-8 transition-all hover:scale-y-125 hover:z-10 relative group"
                    style={{ backgroundColor: shade }}
                    title={shade.toUpperCase()}
                  >
                    <span
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[8px] font-mono font-bold"
                      style={{ color: idx < 5 ? '#000' : '#fff' }}
                    >
                      {shade.toUpperCase().slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'boolean': {
        const checked = value === true || value === 'true';
        return (
          <div className="flex items-center justify-between gap-3" key={key}>
            <Label>{field.name}</Label>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => { updateField(key, e.target.checked); }}
                className="rounded border-slate-300"
              />
              {checked ? 'Đang bật' : 'Đang tắt'}
            </label>
          </div>
        );
      }

      case 'textarea': {
        if (key === 'contact_address') {
          const lat = typeof form.contact_lat === 'string' ? form.contact_lat : '10.762622';
          const lng = typeof form.contact_lng === 'string' ? form.contact_lng : '106.660172';
          const mapProvider = form.contact_map_provider === 'google_embed'
            ? 'google_embed'
            : 'openstreetmap';
          const googleIframe = typeof form.contact_google_map_embed_iframe === 'string'
            ? form.contact_google_map_embed_iframe
            : '';

          return (
            <div className="space-y-2" key={key}>
              <Label>{field.name} {field.required && <span className="text-red-500">*</span>}</Label>
              <textarea
                value={stringValue}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                placeholder="Nhập địa chỉ..."
              />
              <div className="space-y-2">
                <Label>Loại bản đồ</Label>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="contact_map_provider"
                      value="openstreetmap"
                      checked={mapProvider === 'openstreetmap'}
                      onChange={() => updateField('contact_map_provider', 'openstreetmap')}
                      className="rounded-full border-slate-300"
                    />
                    OpenStreetMap
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="contact_map_provider"
                      value="google_embed"
                      checked={mapProvider === 'google_embed'}
                      onChange={() => updateField('contact_map_provider', 'google_embed')}
                      className="rounded-full border-slate-300"
                    />
                    Google Maps nhúng
                  </label>
                </div>
              </div>
              {mapProvider === 'openstreetmap' ? (
                <MapLocationPicker
                  address={stringValue}
                  lat={lat}
                  lng={lng}
                  onLocationChange={(data) => {
                    updateField('contact_address', data.address);
                    updateField('contact_lat', data.lat);
                    updateField('contact_lng', data.lng);
                  }}
                />
              ) : (
                <div className="space-y-2">
                  <Label>Mã Google Maps iframe</Label>
                  <textarea
                    value={googleIframe}
                    onChange={(e) => updateField('contact_google_map_embed_iframe', e.target.value)}
                    className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                    placeholder="Dán nguyên mã iframe Google Maps..."
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open('https://www.google.com/maps', '_blank', 'noopener,noreferrer');
                      }}
                    >
                      Mở Google Maps
                    </Button>
                    <span className="text-xs text-slate-500">
                      Mở Google Maps để lấy mã nhúng iframe rồi dán vào ô phía trên.
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Chỉ dán mã iframe do Google Maps cung cấp.</p>
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-2" key={key}>
            <div className="flex items-center justify-between gap-3">
              <Label>{field.name} {field.required && <span className="text-red-500">*</span>}</Label>
              {counterText && (
                <span className={`text-xs ${stringValue.length > metaLimit ? 'text-red-500' : 'text-slate-400'}`}>
                  {counterText}
                </span>
              )}
            </div>
            <textarea
              value={stringValue}
              onChange={(e) =>{  updateField(key, e.target.value); }}
              className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              placeholder={`Nhập ${field.name.toLowerCase()}...`}
            />
          </div>
        );
      }

      case 'select': {
        // Handle specific select fields
        if (key === 'site_timezone') {
          return (
            <div className="space-y-2" key={key}>
              <Label>{field.name}</Label>
              <select
                value={stringValue}
                onChange={(e) =>{  updateField(key, e.target.value); }}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="Asia/Ho_Chi_Minh">GMT+07:00 Bangkok, Hanoi, Jakarta</option>
                <option value="Asia/Singapore">GMT+08:00 Singapore, Hong Kong</option>
                <option value="Asia/Tokyo">GMT+09:00 Tokyo, Seoul</option>
                <option value="Europe/London">GMT+00:00 London, Dublin</option>
              </select>
            </div>
          );
        }
        if (key === 'site_language') {
          return (
            <div className="space-y-2" key={key}>
              <Label>{field.name}</Label>
              <select
                value={stringValue}
                onChange={(e) =>{  updateField(key, e.target.value); }}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          );
        }
        // Default select - render as text input
        return (
          <div className="space-y-2" key={key}>
            <Label>{field.name} {field.required && <span className="text-red-500">*</span>}</Label>
            <Input
              value={stringValue}
              onChange={(e) =>{  updateField(key, e.target.value); }}
              placeholder={`Nhập ${field.name.toLowerCase()}...`}
            />
          </div>
        );
      }

      case 'number': {
        return (
          <div className="space-y-2" key={key}>
            <Label>{field.name} {field.required && <span className="text-red-500">*</span>}</Label>
            <Input
              type="number"
              value={stringValue}
              onChange={(e) =>{  updateField(key, e.target.value); }}
              placeholder={`Nhập ${field.name.toLowerCase()}...`}
            />
          </div>
        );
      }

      case 'image': {
        const isFaviconField = key === 'site_favicon';
        const isProductPlaceholderField = key === 'product_image_placeholder';
        const isSeoImageField = key === 'seo_og_image';
        const logoValue = typeof form.site_logo === 'string' ? form.site_logo : '';
        const handleUseLogo = (targetKey: 'site_favicon' | 'product_image_placeholder' | 'seo_og_image') => {
          if (!logoValue) {
            toast.error('Chưa có logo để dùng.');
            return;
          }
          updateImageField(targetKey, logoValue, mediaStorageIds.site_logo ?? null);
          toast.success(targetKey === 'site_favicon' ? 'Đã dùng logo làm favicon.' : targetKey === 'product_image_placeholder' ? 'Đã dùng logo làm placeholder sản phẩm.' : 'Đã dùng logo làm OG Image.');
        };

        return (
          <div className="space-y-2" key={key}>
            <SettingsImageUploader
              label={field.name}
              value={stringValue}
              storageId={mediaStorageIds[key] ?? undefined}
              onChange={(url, storageId) =>{  updateImageField(key, url, storageId); }}
              folder="settings"
              previewSize={key.includes('favicon') ? 'sm' : 'md'}
              smartLogoCrop={false}
            />
            {isFaviconField && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseLogo('site_favicon')}
                >
                  Dùng logo hiện tại
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>{  updateImageField('site_favicon', '', null); }}
                >
                  Xóa favicon
                </Button>
              </div>
            )}
            {isProductPlaceholderField && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseLogo('product_image_placeholder')}
                  disabled={!logoValue}
                >
                  Dùng logo hiện tại
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>{  updateImageField('product_image_placeholder', '', null); }}
                >
                  Xóa placeholder
                </Button>
              </div>
            )}
            {isSeoImageField && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseLogo('seo_og_image')}
                  disabled={!logoValue}
                >
                  Dùng logo hiện tại
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>{  updateImageField('seo_og_image', '', null); }}
                >
                  Xóa ảnh
                </Button>
              </div>
            )}
          </div>
        );
      }

      case 'email': {
        return (
          <div className="space-y-2" key={key}>
            <Label>{field.name} {field.required && <span className="text-red-500">*</span>}</Label>
            <Input
              type="email"
              value={stringValue}
              onChange={(e) =>{  updateField(key, e.target.value); }}
              placeholder="example@domain.com"
            />
          </div>
        );
      }

      case 'phone': {
        return (
          <div className="space-y-2" key={key}>
            <Label>{field.name} {field.required && <span className="text-red-500">*</span>}</Label>
            <Input
              type="tel"
              value={stringValue}
              onChange={(e) =>{  updateField(key, e.target.value); }}
              placeholder="0901234567"
            />
          </div>
        );
      }

      case 'tags': {
        return (
          <div className="space-y-2" key={key}>
            <Label>{field.name}</Label>
            <TagInput
              value={stringValue}
              onChange={(val) =>{  updateField(key, val); }}
              placeholder="Nhập từ khóa và nhấn Enter..."
            />
            <p className="text-xs text-slate-500">Nhấn Enter để thêm, Backspace để xóa</p>
          </div>
        );
      }

      default: { // Text
        return (
          <div className="space-y-2" key={key}>
            <div className="flex items-center justify-between gap-3">
              <Label>{field.name} {field.required && <span className="text-red-500">*</span>}</Label>
              {counterText && (
                <span className={`text-xs ${stringValue.length > metaLimit ? 'text-red-500' : 'text-slate-400'}`}>
                  {counterText}
                </span>
              )}
            </div>
            <Input
              value={stringValue}
              onChange={(e) =>{  updateField(key, e.target.value); }}
              placeholder={`Nhập ${field.name.toLowerCase()}...`}
            />
          </div>
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isSectionEnabled) {
    return null;
  }

  const currentFields = fieldsByGroup[section] ?? [];
  const socialFields = section === 'contact' ? (fieldsByGroup.social ?? []) : [];
  const hasAdvancedPlaceholderField = currentFields.some(field => field.fieldKey === 'product_image_placeholder');
  const headerCta = {
    ...DEFAULT_HEADER_CONFIG.cta,
    ...headerConfigDraft.cta,
  };
  const logoSizeLevel = typeof headerConfigDraft.logoSizeLevel === 'number' ? headerConfigDraft.logoSizeLevel : 2;
  const headerSpacingLevel = typeof headerConfigDraft.headerSpacingLevel === 'number' ? headerConfigDraft.headerSpacingLevel : 5;
  const logoSizeLabel = LOGO_SIZE_OPTIONS[logoSizeLevel - 1]?.label ?? 'Mặc định';
  const headerSpacingLabel = HEADER_SPACING_OPTIONS[headerSpacingLevel - 1]?.label ?? 'Cân bằng';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cài đặt hệ thống</h1>
        <p className="text-slate-500">Quản lý các cấu hình chung cho website của bạn.</p>
      </div>

      {currentFields.length > 0 || socialFields.length > 0 || section === 'advanced' ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{GROUP_LABELS[section] || SECTION_LABELS[section]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section === 'contact' && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Dữ liệu này hiển thị ở trang /contact</span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto px-0 text-xs"
                    onClick={() => window.open('/contact', '_blank', 'noopener,noreferrer')}
                  >
                    Mở trang
                  </Button>
                </div>
              )}
              {section === 'advanced' ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
                    {canEditProductImage && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('product-placeholder')}
                        className={cn(
                          'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                          advancedTab === 'product-placeholder'
                            ? 'border-orange-500 text-slate-900 dark:text-slate-100'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        )}
                      >
                        Ảnh sản phẩm
                      </button>
                    )}
                    {canEditProductFrame && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('product-frame')}
                        className={cn(
                          'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                          advancedTab === 'product-frame'
                            ? 'border-orange-500 text-slate-900 dark:text-slate-100'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        )}
                      >
                        Khung viền sản phẩm
                      </button>
                    )}
                    {canEditProductWatermark && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('watermark')}
                        className={cn(
                          'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                          advancedTab === 'watermark'
                            ? 'border-orange-500 text-slate-900 dark:text-slate-100'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        )}
                      >
                        Watermark
                      </button>
                    )}
                    {canEditHeaderMenu && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('header')}
                        className={cn(
                          'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                          advancedTab === 'header'
                            ? 'border-orange-500 text-slate-900 dark:text-slate-100'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        )}
                      >
                        Header
                      </button>
                    )}
                    {canEditProductSupplemental && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('product-supplemental')}
                        className={cn(
                          'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                          advancedTab === 'product-supplemental'
                            ? 'border-orange-500 text-slate-900 dark:text-slate-100'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        )}
                      >
                        Nội dung mô tả SP
                      </button>
                    )}
                    {canEditShopConfig && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('shop-config')}
                        className={cn(
                          'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                          advancedTab === 'shop-config'
                            ? 'border-orange-500 text-slate-900 dark:text-slate-100'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        )}
                      >
                        Cấu hình cửa hàng
                      </button>
                    )}
                    {canEditEmailConfig && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('email-config')}
                        className={cn(
                          'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                          advancedTab === 'email-config'
                            ? 'border-orange-500 text-slate-900 dark:text-slate-100'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        )}
                      >
                        Cấu hình email
                      </button>
                    )}
                  </div>

                  {advancedTab === 'product-placeholder' && canEditProductImage && (
                    <div className="space-y-4">
                      {currentFields.map(field => renderField(field))}
                      {!hasAdvancedPlaceholderField && (
                        <div className="space-y-2">
                          <SettingsImageUploader
                            label="Ảnh placeholder sản phẩm"
                            value={typeof form.product_image_placeholder === 'string' ? form.product_image_placeholder : ''}
                            storageId={mediaStorageIds.product_image_placeholder ?? undefined}
                            onChange={(url, storageId) => { updateImageField('product_image_placeholder', url, storageId); }}
                            folder="settings"
                            previewSize="md"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const logoValue = typeof form.site_logo === 'string' ? form.site_logo : '';
                                if (!logoValue) {
                                  toast.error('Chưa có logo để dùng.');
                                  return;
                                }
                                updateImageField('product_image_placeholder', logoValue, mediaStorageIds.site_logo ?? null);
                                toast.success('Đã dùng logo làm placeholder sản phẩm.');
                              }}
                              disabled={typeof form.site_logo !== 'string' || !form.site_logo}
                            >
                              Dùng logo hiện tại
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => { updateImageField('product_image_placeholder', '', null); }}
                            >
                              Xóa placeholder
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">
                            Dùng khi ảnh sản phẩm bị thiếu hoặc link ảnh lỗi.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {advancedTab === 'product-frame' && canEditProductFrame && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="enable_product_frames"
                            checked={form.enable_product_frames === true}
                            onCheckedChange={(checked) => updateField('enable_product_frames', checked)}
                          />
                          <div className="space-y-0.5">
                            <Label htmlFor="enable_product_frames" className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100">Bật khung viền sản phẩm</Label>
                            <p className="text-xs text-slate-500">
                              Hiển thị khung viền đè lên ảnh sản phẩm ở storefront.
                            </p>
                          </div>
                        </div>

                      </div>

                      {form.enable_product_frames !== true && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                          Tính năng đang tắt. Hãy bật lên để hiển thị khung trên ảnh sản phẩm ngoài trang chủ và chi tiết sản phẩm.
                        </div>
                      )}

                      {(() => {
                        const frameItems = [
                          { key: 'product_frame_overlay_square_url', label: 'Vuông (1:1)', value: 'square', aspectClass: 'aspect-square' },
                          { key: 'product_frame_overlay_portrait916_url', label: 'Dọc (9:16)', value: 'portrait916', aspectClass: 'aspect-[9/16]' },
                          { key: 'product_frame_overlay_portrait34_url', label: 'Dọc (3:4)', value: 'portrait34', aspectClass: 'aspect-[3/4]' },
                          { key: 'product_frame_overlay_landscape43_url', label: 'Ngang (4:3)', value: 'landscape43', aspectClass: 'aspect-[4/3]' },
                          { key: 'product_frame_overlay_wide169_url', label: 'Rộng (16:9)', value: 'wide169', aspectClass: 'aspect-[16/9]' },
                        ];
                        const systemAR = (defaultImageAspectRatio?.value as string) || 'square';
                        const activeAR = selectedFrameAR || systemAR;
                        const activeItem = frameItems.find(i => i.value === activeAR) || frameItems[0];
                        const hasValue = typeof form[activeItem.key] === 'string' && form[activeItem.key];
                        const uploadedCount = frameItems.filter(i => typeof form[i.key] === 'string' && form[i.key]).length;

                        return (
                          <div className="space-y-4">
                            {/* Dropdown chọn AR */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex-1">
                                <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Chọn tỷ lệ khung hình</Label>
                                <select
                                  value={activeAR}
                                  onChange={(e) => setSelectedFrameAR(e.target.value)}
                                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                >
                                  {frameItems.map((item) => {
                                    const isSystemDefault = item.value === systemAR;
                                    const hasFrame = typeof form[item.key] === 'string' && form[item.key];
                                    return (
                                      <option key={item.value} value={item.value}>
                                        {item.label}{isSystemDefault ? ' ★ Mặc định' : ''}{hasFrame ? ' ✓' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              {uploadedCount > 0 && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 self-end pb-2">
                                  {uploadedCount}/5 khung đã upload
                                </span>
                              )}
                            </div>

                            {/* Uploader cho AR đang chọn */}
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{activeItem.label}</span>
                                {activeAR === systemAR && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50">
                                    Đang dùng mặc định
                                  </span>
                                )}
                              </div>

                              <div className="space-y-4">
                                <SettingsImageUploader
                                  key={activeItem.key}
                                  label=""
                                  value={typeof form[activeItem.key] === 'string' ? (form[activeItem.key] as string) : ''}
                                  storageId={mediaStorageIds[activeItem.key] ?? undefined}
                                  onChange={(url, storageId) => { updateImageField(activeItem.key, url, storageId); }}
                                  folder="settings"
                                  previewSize="md"
                                />

                                {hasValue ? (
                                  <div className="space-y-2">
                                    <div className="flex justify-end">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { updateImageField(activeItem.key, '', null); }}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs px-2 py-1 h-auto"
                                      >
                                        Xóa khung
                                      </Button>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className={cn("relative w-32 max-w-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner flex items-center justify-center", activeItem.aspectClass)}>
                                        <img
                                          src={typeof form.product_image_placeholder === 'string' && form.product_image_placeholder ? form.product_image_placeholder : undefined}
                                          alt=""
                                          className="absolute inset-0 w-full h-full object-cover opacity-45"
                                        />
                                        <img
                                          src={form[activeItem.key] as string}
                                          alt="Preview khung viền"
                                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                        />
                                        <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-slate-500 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs py-0.5">Preview</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
                                    <span className="text-xs text-slate-400 dark:text-slate-500">Chưa upload khung</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {advancedTab === 'watermark' && canEditProductWatermark && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="enable_product_watermark"
                            checked={form.enable_product_watermark === true || form.enable_product_watermark === 'true'}
                            onCheckedChange={(checked) => updateField('enable_product_watermark', checked)}
                          />
                          <div className="space-y-0.5">
                            <Label htmlFor="enable_product_watermark" className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100">Bật watermark sản phẩm</Label>
                            <p className="text-xs text-slate-500">
                              Hiển thị watermark (chữ hoặc hình) đè lên ảnh sản phẩm ở storefront.
                            </p>
                          </div>
                        </div>
                      </div>

                      {form.enable_product_watermark !== true && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                          Tính năng đang tắt. Hãy bật lên để hiển thị watermark trên ảnh sản phẩm ngoài trang chủ và chi tiết sản phẩm.
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Cấu hình cột trái (7 cols) */}
                        <div className="lg:col-span-7 space-y-6">
                          {/* 1. Watermark Hình */}
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  id="product_watermark_image_enabled"
                                  checked={form.product_watermark_image_enabled === true || form.product_watermark_image_enabled === 'true'}
                                  onCheckedChange={(checked) => updateField('product_watermark_image_enabled', checked)}
                                />
                                <Label htmlFor="product_watermark_image_enabled" className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100">Bật watermark hình (logo)</Label>
                              </div>
                            </div>

                            {(form.product_watermark_image_enabled === true || form.product_watermark_image_enabled === 'true') && (
                              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <SettingsImageUploader
                                  label="Ảnh logo watermark"
                                  value={typeof form.product_watermark_image_url === 'string' ? form.product_watermark_image_url : ''}
                                  storageId={mediaStorageIds.product_watermark_image_url ?? undefined}
                                  onChange={(url, storageId) => { updateImageField('product_watermark_image_url', url, storageId); }}
                                  folder="settings"
                                  previewSize="md"
                                />

                                {typeof form.product_watermark_image_url === 'string' && form.product_watermark_image_url && (
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs text-slate-500">
                                        <Label>Độ trong suốt logo</Label>
                                        <span>{form.product_watermark_image_opacity ?? 40}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={parseFloat(String(form.product_watermark_image_opacity ?? 40))}
                                        onChange={(e) => updateField('product_watermark_image_opacity', e.target.value)}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-orange-500"
                                      />
                                    </div>
                                    <div className="flex justify-end">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { updateImageField('product_watermark_image_url', '', null); }}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs px-2 py-1 h-auto"
                                      >
                                        Xóa ảnh logo
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 2. Watermark Chữ */}
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  id="product_watermark_text_enabled"
                                  checked={form.product_watermark_text_enabled === true || form.product_watermark_text_enabled === 'true'}
                                  onCheckedChange={(checked) => updateField('product_watermark_text_enabled', checked)}
                                />
                                <Label htmlFor="product_watermark_text_enabled" className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100">Bật watermark chữ</Label>
                              </div>
                            </div>

                            {(form.product_watermark_text_enabled === true || form.product_watermark_text_enabled === 'true') && (
                              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-1.5">
                                  <Label>Nội dung chữ</Label>
                                  <Input
                                    value={typeof form.product_watermark_text_content === 'string' ? form.product_watermark_text_content : ''}
                                    onChange={(e) => updateField('product_watermark_text_content', e.target.value)}
                                    placeholder="Nhập chữ watermark..."
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label>Cỡ chữ (px)</Label>
                                    <select
                                      value={String(form.product_watermark_text_font_size ?? '8')}
                                      onChange={(e) => updateField('product_watermark_text_font_size', e.target.value)}
                                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                      {Array.from({ length: 30 }, (_, i) => i + 1).map((size) => (
                                        <option key={size} value={size}>{size}px</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label>Màu chữ</Label>
                                    <div className="flex gap-2">
                                      <input
                                        type="color"
                                        value={typeof form.product_watermark_text_color === 'string' && form.product_watermark_text_color.startsWith('#') ? form.product_watermark_text_color : '#64748B'}
                                        onChange={(e) => updateField('product_watermark_text_color', e.target.value)}
                                        className="w-10 h-10 rounded-md cursor-pointer border border-slate-200 dark:border-slate-700"
                                      />
                                      <Input
                                        value={String(form.product_watermark_text_color ?? '#64748B').toUpperCase()}
                                        onChange={(e) => updateField('product_watermark_text_color', e.target.value)}
                                        className="font-mono text-sm uppercase flex-1"
                                        maxLength={7}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-slate-500">
                                    <Label>Độ trong suốt chữ</Label>
                                    <span>{form.product_watermark_text_opacity ?? 35}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={parseFloat(String(form.product_watermark_text_opacity ?? 35))}
                                    onChange={(e) => updateField('product_watermark_text_opacity', e.target.value)}
                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-orange-500"
                                  />
                                </div>

                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    id="product_watermark_text_repeat"
                                    checked={form.product_watermark_text_repeat === true || form.product_watermark_text_repeat === 'true'}
                                    onCheckedChange={(checked) => updateField('product_watermark_text_repeat', checked)}
                                  />
                                  <Label htmlFor="product_watermark_text_repeat" className="cursor-pointer text-xs text-slate-600 dark:text-slate-400">Lặp watermark chữ theo hàng ngang</Label>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Preview cột phải (5 cols) */}
                        <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-4">
                          <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center">
                            <Label className="font-semibold text-slate-900 dark:text-slate-100 self-start mb-3">Preview trực quan</Label>

                            <div 
                              ref={previewCanvasRef}
                              className="relative w-64 aspect-square max-w-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner flex items-center justify-center select-none touch-none"
                              onPointerMove={handlePreviewPointerMove}
                              onPointerUp={handlePreviewPointerUp}
                              onPointerLeave={handlePreviewPointerUp}
                              style={{ cursor: activeDrag ? (activeDrag === 'image-resize' ? 'nwse-resize' : 'move') : 'default' }}
                            >
                              {/* Ảnh placeholder sản phẩm */}
                              <img
                                src={typeof form.product_image_placeholder === 'string' && form.product_image_placeholder ? form.product_image_placeholder : undefined}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none select-none"
                              />

                              {/* Watermark hình */}
                              {(form.product_watermark_image_enabled === true || form.product_watermark_image_enabled === 'true') && typeof form.product_watermark_image_url === 'string' && form.product_watermark_image_url && (
                                <div
                                  className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group cursor-move select-none touch-none"
                                  style={{
                                    left: `${form.product_watermark_image_x ?? 80}%`,
                                    top: `${form.product_watermark_image_y ?? 80}%`,
                                    width: `${form.product_watermark_image_width ?? 28}%`,
                                    opacity: (parseFloat(String(form.product_watermark_image_opacity ?? 40))) / 100,
                                  }}
                                  onPointerDown={(e) => handlePreviewPointerDown(e, 'image-move')}
                                  onPointerMove={handlePreviewPointerMove}
                                  onPointerUp={handlePreviewPointerUp}
                                >
                                  <img
                                    src={form.product_watermark_image_url}
                                    alt="Image Watermark"
                                    className="w-full h-auto object-contain pointer-events-none select-none border border-dashed border-transparent hover:border-orange-500 rounded-xs"
                                    draggable="false"
                                  />
                                  {/* Resize handle */}
                                  <div
                                    className="absolute bottom-[-6px] right-[-6px] w-3.5 h-3.5 bg-orange-500 rounded-full border border-white cursor-se-resize shadow-sm hover:scale-125 transition-transform z-20"
                                    onPointerDown={(e) => { e.stopPropagation(); handlePreviewPointerDown(e, 'image-resize'); }}
                                    onPointerMove={handlePreviewPointerMove}
                                    onPointerUp={handlePreviewPointerUp}
                                  />
                                </div>
                              )}

                              {/* Watermark chữ */}
                              {(form.product_watermark_text_enabled === true || form.product_watermark_text_enabled === 'true') && typeof form.product_watermark_text_content === 'string' && form.product_watermark_text_content && (
                                <div
                                  className="absolute left-0 right-0 transform -translate-y-1/2 whitespace-nowrap text-center select-none pointer-events-auto hover:bg-orange-500/10 border-y border-dashed border-transparent hover:border-orange-500 py-1 touch-none"
                                  style={{
                                    top: `${form.product_watermark_text_y ?? 80}%`,
                                    opacity: (parseFloat(String(form.product_watermark_text_opacity ?? 35))) / 100,
                                    color: String(form.product_watermark_text_color ?? '#64748B'),
                                    fontSize: `${form.product_watermark_text_font_size ?? 8}px`,
                                    fontFamily: '"Be Vietnam Pro", sans-serif',
                                    cursor: 'ns-resize',
                                  }}
                                  onPointerDown={(e) => handlePreviewPointerDown(e, 'text-move')}
                                  onPointerMove={handlePreviewPointerMove}
                                  onPointerUp={handlePreviewPointerUp}
                                >
                                  {form.product_watermark_text_repeat === true || form.product_watermark_text_repeat === 'true' ? (
                                    <div className="w-full overflow-hidden inline-flex justify-center gap-4">
                                      {Array(8).fill(null).map((_, i) => (
                                        <span key={i}>{form.product_watermark_text_content as string}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span>{form.product_watermark_text_content}</span>
                                  )}
                                </div>
                              )}

                              <span className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-500 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs px-1.5 py-0.5 rounded-sm">Preview</span>
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 text-center space-y-1">
                              <p>💡 <b>Kéo logo hoặc dòng chữ</b> trực tiếp trong ảnh để đổi vị trí.</p>
                              <p>💡 <b>Kéo chấm tròn màu cam</b> ở góc logo để điều chỉnh kích thước.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {advancedTab === 'header' && canEditHeaderMenu && (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                        <div className="flex items-start gap-3">
                          <LayoutTemplate className="mt-0.5 h-5 w-5 text-orange-500" />
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Logo Header</h3>
                            <p className="text-xs text-slate-500">
                              Dùng chung với Header Menu ở System Experiences.
                            </p>
                          </div>
                        </div>
                        <SettingsImageUploader
                          label="Logo website"
                          value={typeof form.site_logo === 'string' ? form.site_logo : ''}
                          storageId={mediaStorageIds.site_logo ?? undefined}
                          onChange={(url, storageId) =>{  updateImageField('site_logo', url, storageId); }}
                          folder="settings"
                          previewSize="md"
                          smartLogoCrop={false}
                        />
                        <div className="flex items-center justify-between gap-3">
                          <Label>Tên thương hiệu</Label>
                          <label className="flex items-center gap-2 text-xs text-slate-500">
                            <input
                              type="checkbox"
                              checked={headerConfigDraft.showBrandName !== false}
                              onChange={(event) => updateHeaderConfig('showBrandName', event.target.checked)}
                              className="rounded border-slate-300"
                            />
                            {headerConfigDraft.showBrandName !== false ? 'Đang bật' : 'Đang tắt'}
                          </label>
                        </div>
                        <div className="space-y-2">
                          <Label>Kích thước logo</Label>
                          <select
                            value={logoSizeLevel}
                            onChange={(event) => updateHeaderConfig('logoSizeLevel', Number(event.target.value))}
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          >
                            {LOGO_SIZE_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Đang chọn: {logoSizeLabel}</div>
                        </div>
                        <div className="space-y-2">
                          <Label>Độ thoáng header</Label>
                          <select
                            value={headerSpacingLevel}
                            onChange={(event) => updateHeaderConfig('headerSpacingLevel', Number(event.target.value))}
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          >
                            {HEADER_SPACING_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Đang chọn: {headerSpacingLabel}</div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                            <Label>Sticky desktop</Label>
                            <input
                              type="checkbox"
                              checked={headerConfigDraft.headerStickyDesktop ?? headerConfigDraft.headerSticky ?? true}
                              onChange={(event) => updateHeaderConfig('headerStickyDesktop', event.target.checked)}
                              className="rounded border-slate-300"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                            <Label>Sticky mobile</Label>
                            <input
                              type="checkbox"
                              checked={headerConfigDraft.headerStickyMobile ?? headerConfigDraft.headerSticky ?? true}
                              onChange={(event) => updateHeaderConfig('headerStickyMobile', event.target.checked)}
                              className="rounded border-slate-300"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Nền logo</Label>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {LOGO_BACKGROUND_OPTIONS.map(option => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => updateHeaderConfig('logoBackgroundStyle', option.id)}
                                className={cn(
                                  'h-8 rounded-md border text-xs font-medium transition-colors',
                                  (headerConfigDraft.logoBackgroundStyle ?? 'none') === option.id
                                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">CTA Header</h3>
                          <p className="text-xs text-slate-500">
                            Mặc định là “Liên hệ” trỏ về /contact, admin có thể đổi text và đường dẫn.
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Label>Hiển thị CTA</Label>
                          <label className="flex items-center gap-2 text-xs text-slate-500">
                            <input
                              type="checkbox"
                              checked={headerCta.show !== false}
                              onChange={(event) => updateHeaderCta('show', event.target.checked)}
                              className="rounded border-slate-300"
                            />
                            {headerCta.show !== false ? 'Đang bật' : 'Đang tắt'}
                          </label>
                        </div>
                        <div className="space-y-2">
                          <Label>Nhãn CTA</Label>
                          <Input
                            value={headerCta.text ?? 'Liên hệ'}
                            onChange={(event) => updateHeaderCta('text', event.target.value)}
                            placeholder="Liên hệ"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Đường dẫn CTA</Label>
                          <Input
                            value={headerCta.url ?? '/contact'}
                            onChange={(event) => updateHeaderCta('url', event.target.value)}
                            placeholder="/contact"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {advancedTab === 'product-supplemental' && canEditProductSupplemental && (
                    <ProductSupplementalContentManager />
                  )}
                  {advancedTab === 'shop-config' && canEditShopConfig && (
                    <ShopConfigAdminContainer
                      onDirtyChange={setShopConfigDirty}
                      onSavingChange={setShopConfigSaving}
                      registerSaveRef={(ref) => {
                        saveShopConfigRef.current = ref;
                      }}
                    />
                  )}
                  {advancedTab === 'email-config' && canEditEmailConfig && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Cấu hình cột trái (7 cols) */}
                      <div className="lg:col-span-7 space-y-6">

                        <div className={`rounded-xl border p-4 ${
                          emailStatus.configured
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100'
                            : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100'
                        }`}>
                          <div className="flex items-start gap-3">
                            {emailStatus.configured ? (
                              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                            ) : (
                              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 space-y-2">
                              <div>
                                <p className="text-sm font-bold">
                                  {emailStatus.configured ? 'Email gửi ra đã sẵn sàng' : 'Dev chưa cấu hình email gửi ra'}
                                </p>
                                <p className="text-xs opacity-80">
                                  {emailStatus.configured
                                    ? 'Email gửi đơn hàng đang sẵn sàng.'
                                    : 'Vui lòng liên hệ dev để bật email gửi ra trước khi dùng gửi thử hoặc thông báo đơn.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Tên người gửi</Label>
                            <Input
                              value={getStringField('mail_from_name', EMAIL_DEFAULTS.mail_from_name)}
                              onChange={(event) => updateField('mail_from_name', event.target.value)}
                              placeholder={getStringField('site_name', 'YourBrand')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email nhận thông báo đơn hàng</Label>
                            <Input
                              value={getStringField('order_notification_emails')}
                              onChange={(event) => updateField('order_notification_emails', event.target.value)}
                              placeholder="admin@example.com, manager@example.com"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 -mt-2">
                          Để trống sẽ dùng Email ở Cài đặt &gt; Thông tin liên hệ; nếu cả hai trống thì không gửi email admin. Có thể nhập nhiều email, phân tách bằng dấu phẩy, chấm phẩy hoặc xuống dòng.
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                          <div className="space-y-2">
                            <Label>Gửi thử email</Label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                type="email"
                                value={testEmail}
                                onChange={(event) => setTestEmail(event.target.value)}
                                placeholder="email-khach@example.com"
                              />
                              <Button
                                type="button"
                                onClick={handleSendTestEmail}
                                disabled={isSendingTestEmail || hasChanges || !savedEmailStatus.configured}
                                className="shrink-0"
                              >
                                {isSendingTestEmail ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />}
                                {isSendingTestEmail ? 'Đang gửi...' : 'Gửi thử'}
                              </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                              {hasChanges
                                ? 'Lưu thay đổi trước khi gửi thử.'
                                : savedEmailStatus.configured
                                  ? 'Dùng để kiểm tra email gửi ra có đến đúng hộp thư khách hay không.'
                                  : 'Dev chưa cấu hình email gửi ra. Vui lòng liên hệ dev.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Preview cột phải (5 cols) */}
                      <div className="lg:col-span-5 flex flex-col justify-start">
                        <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
                          <Label className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                            <Eye size={16} className="text-orange-500" /> Preview email gửi khách
                          </Label>

                          {/* Khung giả lập Mail Client */}
                          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 text-xs font-sans text-slate-700 dark:text-slate-300">
                            {/* Mail Header */}
                            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                              <div className="flex justify-between text-slate-400">
                                <span>Từ:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {emailStatus.configured
                                    ? `${getStringField('mail_from_name', EMAIL_DEFAULTS.mail_from_name)} <${getStringField('mail_from_email', EMAIL_DEFAULTS.mail_from_email)}>`
                                    : 'Dev chưa cấu hình email gửi ra'}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Đến:</span>
                                <span className="text-slate-600 dark:text-slate-400">khachhang@gmail.com</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Tiêu đề:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  [{getStringField('mail_from_name', EMAIL_DEFAULTS.mail_from_name)}] Xác nhận đơn hàng #1004
                                </span>
                              </div>
                            </div>

                            {/* Mail Body Container */}
                            <div className="p-4 bg-white dark:bg-slate-900 flex justify-center">
                              {/* Mô phỏng khung email gửi thực tế */}
                              <div className="w-full max-w-sm border border-slate-100 dark:border-slate-800 rounded-md p-4 bg-slate-50/50 dark:bg-slate-950/50 space-y-4 shadow-xs">
                                {/* Email header logo */}
                                <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800">
                                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200 tracking-wide uppercase">
                                    {getStringField('mail_from_name', EMAIL_DEFAULTS.mail_from_name)}
                                  </div>
                                </div>

                                {/* Greeting */}
                                <div className="space-y-1">
                                  <p className="font-semibold text-[11px] text-slate-800 dark:text-slate-200">Chào Nguyễn Văn A,</p>
                                  <p className="text-[10px] text-slate-500 leading-relaxed">Cảm ơn bạn đã mua sắm tại {getStringField('mail_from_name', EMAIL_DEFAULTS.mail_from_name)}! Đơn hàng của bạn đã được nhận và đang chờ xử lý.</p>
                                </div>

                                {/* Order details */}
                                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm space-y-2">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                    <span>ĐƠN HÀNG #1004</span>
                                    <span className="text-orange-500 font-medium">Chờ xử lý</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] text-slate-500">
                                      <span>Sản phẩm:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300">Giày Sneaker Adidas Samba (Size 41) x 1</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-slate-500">
                                      <span>Tổng cộng:</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">2.500.000 đ</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-slate-500">
                                      <span>Hình thức:</span>
                                      <span className="text-slate-600 dark:text-slate-400">Thanh toán chuyển khoản (VietQR)</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Call to action */}
                                <div className="text-center pt-2">
                                  <div className="inline-block bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[9px] font-bold px-4 py-1.5 rounded-md shadow-sm">
                                    Xem chi tiết đơn hàng
                                  </div>
                                </div>

                                {/* Footer sign */}
                                <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400">
                                  <p>Trân trọng,</p>
                                  <p className="font-semibold text-slate-500 dark:text-slate-300">Đội ngũ {getStringField('mail_from_name', EMAIL_DEFAULTS.mail_from_name)}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                            💡 Tiêu đề và nội dung email tự động đồng bộ theo <b>Tên người gửi</b>.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                currentFields.map(field => renderField(field))
              )}
            </CardContent>
          </Card>
          {section === 'contact' && socialFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{GROUP_LABELS.social}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialFields.map(field => renderField(field))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Không có trường nào được bật cho nhóm này.
          </CardContent>
        </Card>
      )}

      {!(section === 'advanced' && advancedTab === 'product-supplemental' && canEditProductSupplemental) && (
        <HomeComponentStickyFooter
          isSubmitting={isCurrentlySaving}
          submitLabel="Lưu thay đổi"
          hasChanges={hasChanges}
          submitType="button"
          onClickSave={handleSave}
          align="between"
        >
        <div className="flex items-center gap-2">
          {section === 'seo' && (
            <>
              <AiSeoImportDialog
                form={form}
                onApply={(payload) => {
                  if (payload.seo_title) updateField('seo_title', payload.seo_title);
                  if (payload.seo_description) updateField('seo_description', payload.seo_description);
                  if (payload.seo_keywords) updateField('seo_keywords', payload.seo_keywords);
                }}
              />
              <SeoBuilderDialog
                form={form}
                onApply={(payload) => {
                  if (payload.seo_title) updateField('seo_title', payload.seo_title);
                  if (payload.seo_description) updateField('seo_description', payload.seo_description);
                  if (payload.seo_keywords) updateField('seo_keywords', payload.seo_keywords);
                }}
              />
            </>
          )}
          <span className={cn("text-sm", hasChanges ? "text-amber-600 dark:text-amber-400" : "text-slate-500")}>
            {hasChanges ? 'Có thay đổi chưa lưu' : 'Đã lưu'}
          </span>
          <Button
            type="button"
            variant="accent"
            onClick={handleSave}
            disabled={isCurrentlySaving || !hasChanges}
            className={!hasChanges && !isCurrentlySaving
              ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400'
              : undefined}
          >
            {isCurrentlySaving ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {isCurrentlySaving ? 'Đang lưu...' : hasChanges ? 'Lưu thay đổi' : 'Đã lưu'}
          </Button>
        </div>
      </HomeComponentStickyFooter>
      )}
    </div>
  );
}
