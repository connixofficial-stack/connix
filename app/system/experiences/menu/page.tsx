'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { BookOpen, Briefcase, CreditCard, Eye, FileText, Heart, LayoutTemplate, Loader2, Mail, Package, Save, ShoppingCart, Users } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import {
  ExperienceHintCard,
  ExperienceModuleLink,
  ExampleLinks,
} from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  ControlCard,
  DeviceToggle,
  deviceWidths,
  LayoutTabs,
  SelectRow,
  ToggleRow,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import type { MenuLayerColorChoice } from '@/components/site/header/colors';
import { HeaderMenuPreview, type HeaderLayoutStyle, type HeaderMenuConfig } from '@/components/experiences/previews/HeaderMenuPreview';
import { MESSAGES, useExperienceConfig } from '@/lib/experiences';

const DEFAULT_CONFIG: HeaderMenuConfig = {
  brandName: 'YourBrand',
  showBrandName: true,
  logoSizeLevel: 2,
  headerSpacingLevel: 5,
  logoBackgroundStyle: 'none',
  headerBackground: 'white',
  headerSeparator: 'none',
  headerSticky: true,
  headerStickyDesktop: true,
  headerStickyMobile: true,
  showBrandAccent: false,
  cart: { show: true },
  cta: { show: true, text: 'Liên hệ', url: '/contact' },
  login: { show: true, text: 'Đăng nhập' },
  search: { placeholder: 'Tìm kiếm...', searchPosts: true, searchProducts: true, searchServices: true, searchCourses: true, show: true },
  topbar: {
    email: 'contact@example.com',
    hotline: '1900 1234',
    show: true,
    showEmail: true,
    showHotline: true,
    showTrackOrder: true,
    sloganEnabled: true,
    slogan: '',
  },
  wishlist: { show: true },
  showDarkModeToggle: false,
};

const LAYOUT_STYLES: LayoutOption<HeaderLayoutStyle>[] = [
  { id: 'classic', label: 'Classic', description: 'Header tiêu chuẩn, menu ngang đơn giản.' },
  { id: 'topbar', label: 'Topbar', description: 'Có topbar, search, tiện ích nhanh.' },
  { id: 'allbirds', label: 'Allbirds', description: 'Logo trái, menu giữa, actions bên phải.' },
  { id: 'darkglass', label: 'Dark Glass', description: 'Header tối backdrop-blur, pill sticky, social icons.' },
];

const HINTS = [
  'Menu items được quản lý ở /admin/menus.',
  'Topbar phù hợp site bán hàng cần hotline + search.',
  'Allbirds phù hợp brand cần header tối giản, tập trung nav.',
  'Dark Glass phù hợp studio, creative agency, portfolio — nền tối backdrop-blur.',
  'Tắt Tên thương hiệu hoặc CTA để tăng không gian menu trước khi More.',
  'Logo lớn + bật Tên thương hiệu + CTA sẽ làm menu phải co lại trước khi More.',
  'Login chỉ hiển thị khi bật Module Khách hàng + tính năng Đăng nhập KH.',
  'Cart/Wishlist chỉ bật khi module tương ứng đang active.',
];

const clampLogoSizeLevel = (level?: number): HeaderMenuConfig['logoSizeLevel'] => {
  const value = Number.isFinite(level) ? Math.round(level as number) : 2;
  return Math.min(30, Math.max(1, value)) as HeaderMenuConfig['logoSizeLevel'];
};

const clampHeaderSpacingLevel = (level?: number): HeaderMenuConfig['headerSpacingLevel'] => {
  const value = Number.isFinite(level) ? Math.round(level as number) : 5;
  return Math.min(7, Math.max(1, value)) as HeaderMenuConfig['headerSpacingLevel'];
};

function ModuleFeatureStatus({ label, enabled, href, moduleName }: { label: string; enabled: boolean; href: string; moduleName: string }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <div className="flex items-start gap-2">
        <span className={`mt-1 inline-flex h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">
            {enabled ? 'Đang bật' : 'Chưa bật'} · Nếu muốn {enabled ? 'tắt' : 'bật'} hãy vào {moduleName}
          </p>
        </div>
      </div>
      <Link href={href} className="text-xs font-medium text-cyan-600 hover:underline">
        Đi đến →
      </Link>
    </div>
  );
}

export default function HeaderMenuExperiencePage() {
  const headerStyleSetting = useQuery(api.settings.getByKey, { key: 'header_style' });
  const headerConfigSetting = useQuery(api.settings.getByKey, { key: 'header_config' });
  const siteNameSetting = useQuery(api.settings.getByKey, { key: 'site_name' });
  const siteLogoSetting = useQuery(api.settings.getByKey, { key: 'site_logo' });
  const topbarSloganSetting = useQuery(api.settings.getByKey, { key: 'site_tagline' });
  const siteDarkModeSetting = useQuery(api.settings.getByKey, { key: 'site_dark_mode' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const menuData = useQuery(api.menus.getFullMenu, { location: 'header' });
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });

  const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const productsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'products' });
  const postsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'posts' });
  const servicesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'services' });
  const coursesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'courses' });
  const customersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'customers' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const commerceCapabilities = useQuery(api.cart.getCommerceCapabilities, {});
  const customerLoginFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'customers', featureKey: 'enableLogin' });

  const setMultipleSettings = useMutation(api.settings.setMultiple);

  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  const [previewStyle, setPreviewStyle] = useState<HeaderLayoutStyle>('classic');
  const [isSaving, setIsSaving] = useState(false);

  const savedStyleRaw = headerStyleSetting?.value as string | undefined;
  const savedStyle = (savedStyleRaw === 'transparent' || savedStyleRaw === 'centered' ? 'allbirds' : savedStyleRaw) as HeaderLayoutStyle | undefined ?? 'classic';

  useEffect(() => {
    setPreviewStyle(savedStyle);
  }, [savedStyle]);

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const resolvedBrandName = useMemo(() => {
    const rawName = typeof siteNameSetting?.value === 'string' ? siteNameSetting.value.trim() : '';
    return rawName || 'YourBrand';
  }, [siteNameSetting?.value]);

  const serverConfig = useMemo<HeaderMenuConfig>(() => {
    const raw = headerConfigSetting?.value as Partial<HeaderMenuConfig> | undefined;
    const resolvedHeaderSticky = raw?.headerSticky ?? DEFAULT_CONFIG.headerSticky;
    return {
      ...DEFAULT_CONFIG,
      ...raw,
      brandName: resolvedBrandName,
      showBrandName: raw?.showBrandName ?? true,
      logoSizeLevel: clampLogoSizeLevel(raw?.logoSizeLevel ?? 2),
      headerSpacingLevel: clampHeaderSpacingLevel(raw?.headerSpacingLevel ?? DEFAULT_CONFIG.headerSpacingLevel),
      headerStickyDesktop: raw?.headerStickyDesktop ?? resolvedHeaderSticky,
      headerStickyMobile: raw?.headerStickyMobile ?? resolvedHeaderSticky,
      topbar: { ...DEFAULT_CONFIG.topbar, ...raw?.topbar },
      search: { ...DEFAULT_CONFIG.search, ...raw?.search },
      cta: { ...DEFAULT_CONFIG.cta, ...raw?.cta },
      cart: { ...DEFAULT_CONFIG.cart, ...raw?.cart },
      wishlist: { ...DEFAULT_CONFIG.wishlist, ...raw?.wishlist },
      login: { ...DEFAULT_CONFIG.login, ...raw?.login, text: 'Đăng nhập' },
    };
  }, [headerConfigSetting?.value, resolvedBrandName]);

  const isLoading = headerStyleSetting === undefined
    || headerConfigSetting === undefined
    || siteNameSetting === undefined
    || siteLogoSetting === undefined
    || topbarSloganSetting === undefined
    || menuData === undefined
    || contactSettings === undefined
    || cartModule === undefined
    || wishlistModule === undefined
    || productsModule === undefined
    || postsModule === undefined
    || servicesModule === undefined
    || coursesModule === undefined
    || customersModule === undefined
    || ordersModule === undefined
    || commerceCapabilities === undefined
    || customerLoginFeature === undefined
    || siteDarkModeSetting === undefined;

  const resolvedBrandColor = brandColor || brandColors.primary || '#f97316';

  const menuItems = menuData?.items ?? [];
  const siteLogo = typeof siteLogoSetting?.value === 'string' ? siteLogoSetting.value.trim() : '';
  const settingsPhone = contactSettings?.find(s => s.key === 'contact_phone')?.value as string | undefined;
  const settingsEmail = contactSettings?.find(s => s.key === 'contact_email')?.value as string | undefined;
  const resolvedTopbarSlogan = typeof topbarSloganSetting?.value === 'string' ? topbarSloganSetting.value.trim() : '';

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);

  const hasStyleChanges = previewStyle !== savedStyle;

  const updateTopbar = <K extends keyof HeaderMenuConfig['topbar']>(key: K, value: HeaderMenuConfig['topbar'][K]) => {
    setConfig(prev => ({ ...prev, topbar: { ...prev.topbar, [key]: value } }));
  };

  const updateSearch = <K extends keyof HeaderMenuConfig['search']>(key: K, value: HeaderMenuConfig['search'][K]) => {
    setConfig(prev => ({ ...prev, search: { ...prev.search, [key]: value } }));
  };

  const updateCart = <K extends keyof HeaderMenuConfig['cart']>(key: K, value: HeaderMenuConfig['cart'][K]) => {
    setConfig(prev => ({ ...prev, cart: { ...prev.cart, [key]: value } }));
  };

  const updateWishlist = <K extends keyof HeaderMenuConfig['wishlist']>(key: K, value: HeaderMenuConfig['wishlist'][K]) => {
    setConfig(prev => ({ ...prev, wishlist: { ...prev.wishlist, [key]: value } }));
  };

  const updateLogin = <K extends keyof HeaderMenuConfig['login']>(key: K, value: HeaderMenuConfig['login'][K]) => {
    setConfig(prev => ({ ...prev, login: { ...prev.login, [key]: value } }));
  };

  const updateCta = <K extends keyof HeaderMenuConfig['cta']>(key: K, value: HeaderMenuConfig['cta'][K]) => {
    setConfig(prev => ({ ...prev, cta: { ...prev.cta, [key]: value } }));
  };

  const updateHeaderBackground = (value: HeaderMenuConfig['headerBackground']) => {
    setConfig(prev => ({ ...prev, headerBackground: value }));
  };

  const updateHeaderSeparator = (value: HeaderMenuConfig['headerSeparator']) => {
    setConfig(prev => ({ ...prev, headerSeparator: value }));
  };

  const updateShowBrandAccent = (value: boolean) => {
    setConfig(prev => ({ ...prev, showBrandAccent: value }));
  };

  const updateHeaderStickyDesktop = (value: boolean) => {
    setConfig(prev => ({ ...prev, headerStickyDesktop: value }));
  };

  const updateHeaderStickyMobile = (value: boolean) => {
    setConfig(prev => ({ ...prev, headerStickyMobile: value }));
  };

  const updateShowBrandName = (value: boolean) => {
    setConfig(prev => ({ ...prev, showBrandName: value }));
  };

  const updateLogoSizeLevel = (value: HeaderMenuConfig['logoSizeLevel']) => {
    setConfig(prev => ({ ...prev, logoSizeLevel: value }));
  };

  const updateHeaderSpacingLevel = (value: HeaderMenuConfig['headerSpacingLevel']) => {
    setConfig(prev => ({ ...prev, headerSpacingLevel: value }));
  };

  const updateLogoBackgroundStyle = (value: NonNullable<HeaderMenuConfig['logoBackgroundStyle']>) => {
    setConfig(prev => ({ ...prev, logoBackgroundStyle: value }));
  };

  const updateFlatSubMenus = (value: boolean) => {
    setConfig(prev => ({ ...prev, flatSubMenus: value }));
  };

  const updateShowDarkModeToggle = (value: boolean) => {
    setConfig(prev => ({ ...prev, showDarkModeToggle: value }));
  };

  const updateBorderRadiusStyle = (value: NonNullable<HeaderMenuConfig['borderRadiusStyle']>) => {
    setConfig(prev => ({ ...prev, borderRadiusStyle: value }));
  };

  const updateMegaLevel1Color = (value: NonNullable<HeaderMenuConfig['megaLevel1Color']>) => {
    setConfig(prev => ({ ...prev, megaLevel1Color: value }));
  };

  const updateLayerColor = (layer: 'topnav' | 'navbar' | 'menu', value: MenuLayerColorChoice) => {
    setConfig(prev => ({
      ...prev,
      layerColors: { ...prev.layerColors, [layer]: value },
    }));
  };

  const layerColorOptions = useMemo(() => {
    const base: { value: string; label: string }[] = [
      { value: 'white', label: 'Trắng' },
      { value: 'primary', label: 'Màu chính' },
    ];
    if (colorMode === 'dual') {
      base.push({ value: 'secondary', label: 'Màu phụ' });
    }
    return base;
  }, [colorMode]);

  const normalizedConfig = useMemo(() => ({
    ...config,
    brandName: resolvedBrandName,
    cta: { ...DEFAULT_CONFIG.cta, ...config.cta },
    login: { ...config.login, text: 'Đăng nhập' },
  }), [config, resolvedBrandName]);

  const previewConfig = useMemo(() => {
    const cartEnabled = cartModule?.enabled ?? false;
    const wishlistEnabled = wishlistModule?.enabled ?? false;
    const productsEnabled = productsModule?.enabled ?? false;
    const postsEnabled = postsModule?.enabled ?? false;
    const servicesEnabled = servicesModule?.enabled ?? false;
    const coursesEnabled = coursesModule?.enabled ?? false;
    const ordersEnabled = ordersModule?.enabled ?? false;
    const loginEnabled = (customersModule?.enabled ?? false) && (customerLoginFeature?.enabled ?? false);

    const search = {
      ...normalizedConfig.search,
      searchProducts: productsEnabled ? normalizedConfig.search.searchProducts : false,
      searchPosts: postsEnabled ? normalizedConfig.search.searchPosts : false,
      searchServices: servicesEnabled ? normalizedConfig.search.searchServices : false,
      searchCourses: coursesEnabled ? normalizedConfig.search.searchCourses : false,
    };

    const effectiveSloganEnabled = normalizedConfig.topbar.sloganEnabled ?? true;
    const effectiveSlogan = resolvedTopbarSlogan;

    return {
      ...normalizedConfig,
      cart: { ...normalizedConfig.cart, show: normalizedConfig.cart.show && (commerceCapabilities?.cartAvailable ?? cartEnabled) },
      wishlist: { ...normalizedConfig.wishlist, show: normalizedConfig.wishlist.show && wishlistEnabled },
      login: { ...normalizedConfig.login, show: normalizedConfig.login.show && loginEnabled },
      topbar: {
        ...normalizedConfig.topbar,
        showTrackOrder: normalizedConfig.topbar.showTrackOrder && ordersEnabled,
        slogan: effectiveSlogan,
        sloganEnabled: effectiveSloganEnabled,
      },
      search: {
        ...search,
        show: Boolean(search.show && (search.searchProducts || search.searchPosts || search.searchServices || search.searchCourses)),
      },
    };
  }, [
    normalizedConfig,
    cartModule?.enabled,
    wishlistModule?.enabled,
    productsModule?.enabled,
    postsModule?.enabled,
    servicesModule?.enabled,
    coursesModule?.enabled,
    ordersModule?.enabled,
    customersModule?.enabled,
    customerLoginFeature?.enabled,
    commerceCapabilities?.cartAvailable,
    resolvedTopbarSlogan,
  ]);

  const showLoginToggle = Boolean(config.login?.show);
  const showCtaToggle = Boolean(config.cta?.show);
  const logoSizeOptions = useMemo(
    () => Array.from({ length: 30 }, (_, index) => ({
      value: (index + 1) as HeaderMenuConfig['logoSizeLevel'],
      label: `Nấc ${index + 1}`,
    })),
    []
  );
  const logoSizeLabel = logoSizeOptions[(config.logoSizeLevel ?? 2) - 1]?.label ?? 'Mặc định';
  const headerSpacingOptions = useMemo(
    () => ([
      { value: 1, label: 'Siêu gọn' },
      { value: 2, label: 'Rất gọn' },
      { value: 3, label: 'Gọn' },
      { value: 4, label: 'Hơi gọn' },
      { value: 5, label: 'Cân bằng' },
      { value: 6, label: 'Hơi thoáng' },
      { value: 7, label: 'Trung bình' },
    ] as const),
    []
  );
  const headerSpacingLabel = headerSpacingOptions[(config.headerSpacingLevel ?? 5) - 1]?.label ?? 'Cân bằng';
  const wishlistEnabled = wishlistModule?.enabled ?? false;
  const productsEnabled = productsModule?.enabled ?? false;
  const postsEnabled = postsModule?.enabled ?? false;
  const servicesEnabled = servicesModule?.enabled ?? false;
  const coursesEnabled = coursesModule?.enabled ?? false;
  const ordersEnabled = ordersModule?.enabled ?? false;
  const loginEnabled = (customersModule?.enabled ?? false) && (customerLoginFeature?.enabled ?? false);
  const cartAvailable = commerceCapabilities?.cartAvailable ?? false;
  const canUseSearch = productsEnabled || postsEnabled || servicesEnabled || coursesEnabled;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const wishlistEnabled = wishlistModule?.enabled ?? false;
      const productsEnabled = productsModule?.enabled ?? false;
      const postsEnabled = postsModule?.enabled ?? false;
      const servicesEnabled = servicesModule?.enabled ?? false;
      const coursesEnabled = coursesModule?.enabled ?? false;
      const customersEnabled = customersModule?.enabled ?? false;
      const ordersEnabled = ordersModule?.enabled ?? false;
      const loginEnabled = customersEnabled && (customerLoginFeature?.enabled ?? false);

      const { slogan: _topbarSlogan, ...topbarRest } = normalizedConfig.topbar;
      const configToSave = {
        ...normalizedConfig,
        headerSticky: normalizedConfig.headerStickyDesktop ?? normalizedConfig.headerSticky ?? true,
        search: {
          ...normalizedConfig.search,
          searchProducts: productsEnabled ? normalizedConfig.search.searchProducts : false,
          searchPosts: postsEnabled ? normalizedConfig.search.searchPosts : false,
          searchServices: servicesEnabled ? normalizedConfig.search.searchServices : false,
          searchCourses: coursesEnabled ? normalizedConfig.search.searchCourses : false,
        },
        cart: { ...normalizedConfig.cart, show: normalizedConfig.cart.show && cartAvailable },
        wishlist: { ...normalizedConfig.wishlist, show: normalizedConfig.wishlist.show && wishlistEnabled },
        login: { ...normalizedConfig.login, show: normalizedConfig.login.show && loginEnabled },
        topbar: {
          ...topbarRest,
          showTrackOrder: normalizedConfig.topbar.showTrackOrder && ordersEnabled,
        },
      };

      if (!productsEnabled && !postsEnabled && !servicesEnabled && !coursesEnabled) {
        configToSave.search = { ...configToSave.search, show: false };
      }
      const { email: _email, hotline: _hotline, useSettingsData: _useSettingsData, ...topbarNext } = configToSave.topbar as HeaderMenuConfig['topbar'] & { useSettingsData?: boolean };
      await setMultipleSettings({
        settings: [
          { group: 'site', key: 'header_style', value: previewStyle },
          { group: 'site', key: 'header_config', value: { ...configToSave, topbar: topbarNext } },
        ],
      });
      toast.success('Đã lưu cấu hình Header Menu');
    } catch {
      toast.error(MESSAGES.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">{MESSAGES.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" style={{ color: resolvedBrandColor }} />
            <h1 className="text-2xl font-bold">Header Menu</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={(!hasChanges && !hasStyleChanges) || isSaving}
            className="gap-1.5"
            style={{ backgroundColor: resolvedBrandColor }}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{hasChanges || hasStyleChanges ? 'Lưu' : 'Đã lưu'}</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thiết lập hiển thị</CardTitle>
        </CardHeader>
        <CardContent className={cn('grid grid-cols-1 gap-4', previewStyle === 'classic' ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          <ControlCard title="Màu thương hiệu">
            <ColorConfigCard
              primary={brandColor}
              secondary={secondaryColor}
              mode={colorMode}
              onPrimaryChange={setBrandColor}
              onSecondaryChange={setSecondaryColor}
              onModeChange={setColorMode}
            />
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Phối màu header</p>
              <SelectRow
                label="Topbar"
                value={config.layerColors?.topnav ?? 'primary'}
                options={layerColorOptions}
                onChange={(v) => updateLayerColor('topnav', v as MenuLayerColorChoice)}
              />
              <SelectRow
                label="Navbar"
                value={config.layerColors?.navbar ?? 'white'}
                options={layerColorOptions}
                onChange={(v) => updateLayerColor('navbar', v as MenuLayerColorChoice)}
              />
              <SelectRow
                label="Menu bar"
                value={config.layerColors?.menu ?? 'white'}
                options={layerColorOptions}
                onChange={(v) => updateLayerColor('menu', v as MenuLayerColorChoice)}
              />
              <p className="text-[11px] leading-4 text-slate-400 pt-1">
                Màu chữ tự tính theo APCA để đảm bảo dễ đọc.
              </p>
            </div>
          </ControlCard>
          <ControlCard title="Hiển thị">
            <ToggleRow
              label="Topbar"
              checked={config.topbar.show}
              onChange={(v) => updateTopbar('show', v)}
              accentColor={resolvedBrandColor}
            />
            <ToggleRow
              label="Search"
              checked={config.search.show && canUseSearch}
              onChange={(v) => updateSearch('show', v)}
              accentColor={resolvedBrandColor}
              disabled={!canUseSearch}
            />
            <ToggleRow
              label="Cart"
              checked={config.cart.show && cartAvailable}
              onChange={(v) => updateCart('show', v)}
              accentColor={resolvedBrandColor}
              disabled={!cartAvailable}
            />
            <ToggleRow
              label="Wishlist"
              checked={config.wishlist.show && wishlistEnabled}
              onChange={(v) => updateWishlist('show', v)}
              accentColor={resolvedBrandColor}
              disabled={!wishlistEnabled}
            />
            <ToggleRow
              label="Login"
              checked={showLoginToggle && loginEnabled}
              onChange={(v) => updateLogin('show', v)}
              accentColor={resolvedBrandColor}
              disabled={!loginEnabled}
            />
            <ToggleRow
              label="Tên thương hiệu"
              checked={config.showBrandName}
              onChange={updateShowBrandName}
              accentColor={resolvedBrandColor}
            />
            <div className="space-y-2 pt-1">
              <Label className="text-xs">Kích thước logo</Label>
              <select
                value={config.logoSizeLevel ?? 2}
                onChange={(event) => updateLogoSizeLevel(Number(event.target.value) as HeaderMenuConfig['logoSizeLevel'])}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
              >
                {logoSizeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="text-xs font-medium text-slate-600">Đang chọn: {logoSizeLabel}</div>
            </div>
            <div className="space-y-2 pt-1">
              <Label className="text-xs">Độ thoáng header</Label>
              <select
                value={config.headerSpacingLevel ?? 5}
                onChange={(event) => updateHeaderSpacingLevel(Number(event.target.value) as HeaderMenuConfig['headerSpacingLevel'])}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
              >
                {headerSpacingOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="text-xs font-medium text-slate-600">Đang chọn: {headerSpacingLabel}</div>
            </div>
            <ToggleRow
              label="Sticky desktop"
              checked={config.headerStickyDesktop ?? config.headerSticky}
              onChange={updateHeaderStickyDesktop}
              accentColor={resolvedBrandColor}
            />
            <ToggleRow
              label="Sticky mobile"
              checked={config.headerStickyMobile ?? config.headerSticky}
              onChange={updateHeaderStickyMobile}
              accentColor={resolvedBrandColor}
            />
            <div className="space-y-2 pt-1">
              <Label className="text-xs">Nền logo</Label>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {([
                  { id: 'none', label: 'None' },
                  { id: 'border', label: 'Border' },
                  { id: 'outline', label: 'Outline sạch' },
                  { id: 'hairline', label: 'Hairline nhẹ' },
                  { id: 'inset', label: 'Inset panel' },
                  { id: 'pill', label: 'Pill badge' },
                  { id: 'shadow', label: 'Shadow' },
                  { id: 'soft', label: 'Soft card' },
                  { id: 'solid', label: 'Solid contrast' },
                ] as const).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateLogoBackgroundStyle(option.id)}
                    className={cn(
                      'h-8 rounded-md border text-xs font-medium transition-colors',
                      (config.logoBackgroundStyle ?? 'none') === option.id
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] leading-5 text-slate-500">
                Outline/Hairline cho cảm giác flat rất nhẹ; Inset/Pill mềm hơn nhưng vẫn tinh tế. Border/Shadow/Soft/Solid giữ phong cách nổi bật hơn khi cần.
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <Label className="text-xs">Độ bo góc menu (Radius)</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'none', label: 'Vuông (None)' },
                  { id: 'small', label: 'Ít (Small)' },
                  { id: 'large', label: 'Nhiều (Large)' },
                ] as const).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateBorderRadiusStyle(option.id)}
                    className={cn(
                      'h-8 rounded-md border text-xs font-medium transition-colors',
                      (config.borderRadiusStyle ?? 'large') === option.id
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <ToggleRow
              label="Mega menu phẳng (SaaS layout)"
              checked={config.flatSubMenus ?? false}
              onChange={updateFlatSubMenus}
              accentColor={resolvedBrandColor}
            />
            <ToggleRow
              label="Nút Dark Mode ở site thực"
              checked={config.showDarkModeToggle ?? false}
              onChange={updateShowDarkModeToggle}
              accentColor={resolvedBrandColor}
            />
            <div className="py-2 px-2.5 bg-slate-100/50 dark:bg-slate-800/40 rounded-lg border border-slate-200/25 dark:border-slate-700/30 mt-1 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Mặc định cả web: <span className="text-slate-700 dark:text-slate-350 font-bold">{
                  siteDarkModeSetting?.value === 'dark' ? 'Chế độ tối (Dark)' :
                  siteDarkModeSetting?.value === 'system' ? 'Theo hệ thống' : 'Chế độ sáng (Light)'
                }</span>
              </span>
              <Link
                href="/system/experiences?tab=dark_mode"
                className="text-cyan-600 dark:text-cyan-400 hover:underline shrink-0 font-bold"
              >
                Cài đặt →
              </Link>
            </div>
            <div className="space-y-2 pt-1">
              <Label className="text-xs">Màu tiêu đề cấp 1 Mega Menu</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'default', label: 'Mặc định' },
                  { id: 'primary', label: 'Màu chính' },
                  { id: 'secondary', label: 'Màu phụ' },
                ] as const).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateMegaLevel1Color(option.id)}
                    className={cn(
                      'h-8 rounded-md border text-xs font-medium transition-colors',
                      (config.megaLevel1Color ?? 'default') === option.id
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <ToggleRow
              label="CTA"
              checked={showCtaToggle}
              onChange={(v) => updateCta('show', v)}
              accentColor={resolvedBrandColor}
            />
            {showCtaToggle && (
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">Nhãn CTA</Label>
                  <Input
                    value={config.cta.text ?? 'Liên hệ'}
                    onChange={(event) => updateCta('text', event.target.value)}
                    className="h-8 text-sm"
                    placeholder="Liên hệ"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Đường dẫn CTA</Label>
                  <Input
                    value={config.cta.url ?? '/contact'}
                    onChange={(event) => updateCta('url', event.target.value)}
                    className="h-8 text-sm"
                    placeholder="/contact"
                  />
                </div>
              </div>
            )}
          </ControlCard>
          {previewStyle !== 'darkglass' && (
            <ControlCard title="Topbar & Search">
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Hotline</Label>
                  <Input
                    value={settingsPhone ?? ''}
                    className="h-8 text-sm"
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={settingsEmail ?? ''}
                    className="h-8 text-sm"
                    disabled
                  />
                </div>
                <ToggleRow
                  label="Hiển thị hotline"
                  checked={config.topbar.showHotline ?? true}
                  onChange={(v) => updateTopbar('showHotline', v)}
                  accentColor={resolvedBrandColor}
                />
                <ToggleRow
                  label="Hiển thị email"
                  checked={config.topbar.showEmail ?? true}
                  onChange={(v) => updateTopbar('showEmail', v)}
                  accentColor={resolvedBrandColor}
                />
                <ToggleRow
                  label="Slogan topbar"
                  checked={config.topbar.sloganEnabled ?? true}
                  onChange={(v) => updateTopbar('sloganEnabled', v)}
                  accentColor={resolvedBrandColor}
                />
                <div className="space-y-1">
                  <Label className="text-xs">Slogan</Label>
                  <Input
                    value={resolvedTopbarSlogan}
                    className="h-8 text-sm"
                    disabled
                  />
                </div>
                <ToggleRow
                  label="Theo dõi đơn"
                  checked={config.topbar.showTrackOrder && ordersEnabled}
                  onChange={(v) => updateTopbar('showTrackOrder', v)}
                  accentColor={resolvedBrandColor}
                  disabled={!ordersEnabled}
                />
                {config.search.show && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-slate-500">Search theo module</p>
                    <ModuleFeatureStatus
                      label="Sản phẩm"
                      enabled={productsModule?.enabled ?? false}
                      href="/system/modules/products"
                      moduleName="Module Sản phẩm"
                    />
                    <ModuleFeatureStatus
                      label="Bài viết"
                      enabled={postsModule?.enabled ?? false}
                      href="/system/modules/posts"
                      moduleName="Module Bài viết"
                    />
                    <ModuleFeatureStatus
                      label="Dịch vụ"
                      enabled={servicesModule?.enabled ?? false}
                      href="/system/modules/services"
                      moduleName="Module Dịch vụ"
                    />
                    <ModuleFeatureStatus
                      label="Khóa học"
                      enabled={coursesModule?.enabled ?? false}
                      href="/system/modules/courses"
                      moduleName="Module Khóa học"
                    />
                  </div>
                )}
              </div>
            </ControlCard>
          )}
          {previewStyle === 'classic' && (
            <ControlCard title="Giao diện Classic">
              <div className="space-y-2">
                <div className="space-y-2">
                  <Label className="text-xs">Classic background</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'white', label: 'Solid' },
                      { id: 'dots', label: 'Dots' },
                      { id: 'stripes', label: 'Stripes' },
                    ] as const).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => updateHeaderBackground(option.id)}
                        className={cn(
                          'h-8 rounded-md border text-xs font-medium transition-colors',
                          config.headerBackground === option.id
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <ToggleRow
                  label="Brand accent line"
                  checked={config.showBrandAccent}
                  onChange={updateShowBrandAccent}
                  accentColor={resolvedBrandColor}
                />
                <div className="space-y-2">
                  <Label className="text-xs">Header separator</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'none', label: 'None' },
                      { id: 'shadow', label: 'Shadow' },
                      { id: 'border', label: 'Border' },
                      { id: 'gradient', label: 'Gradient' },
                    ] as const).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => updateHeaderSeparator(option.id)}
                        className={cn(
                          'h-8 rounded-md border text-xs font-medium transition-colors',
                          config.headerSeparator === option.id
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
            </ControlCard>
          )}

          {previewStyle === 'darkglass' && (
            <ControlCard title="Giao diện Dark Glass">
              <div className="space-y-3">
                <p className="text-[11px] leading-5 text-slate-500">
                  Style tối, backdrop-blur, sticky pill header lấy cảm hứng từ creative studio.
                  Màu nền cố định đen bán trong suốt — không phụ thuộc màu thương hiệu.
                </p>
                <ToggleRow
                  label="CTA button"
                  checked={config.cta.show}
                  onChange={(v) => updateCta('show', v)}
                  accentColor={resolvedBrandColor}
                />
                {config.cta.show && (
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Nhãn CTA</Label>
                      <Input
                        value={config.cta.text ?? 'Liên hệ'}
                        onChange={(event) => updateCta('text', event.target.value)}
                        className="h-8 text-sm"
                        placeholder="Liên hệ"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Đường dẫn CTA</Label>
                      <Input
                        value={config.cta.url ?? '/contact'}
                        onChange={(event) => updateCta('url', event.target.value)}
                        className="h-8 text-sm"
                        placeholder="/contact"
                      />
                    </div>
                  </div>
                )}
                <ToggleRow
                  label="Sticky desktop"
                  checked={config.headerStickyDesktop ?? config.headerSticky}
                  onChange={updateHeaderStickyDesktop}
                  accentColor={resolvedBrandColor}
                />
                <ToggleRow
                  label="Sticky mobile"
                  checked={config.headerStickyMobile ?? config.headerSticky}
                  onChange={updateHeaderStickyMobile}
                  accentColor={resolvedBrandColor}
                />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Social icons</p>
                  <p className="text-[11px] leading-5 text-slate-400">
                    Social icons (YouTube, TikTok, Facebook, Instagram) lấy URL từ Settings → Social Media.
                    Chỉnh sửa tại <a href="/system/settings" className="text-cyan-600 hover:underline">System Settings</a>.
                  </p>
                </div>
              </div>
            </ControlCard>
          )}

          <Card className="p-2 col-span-full">
            <div className="mb-2">
              <ExampleLinks
                links={[{ label: 'Trang chủ', url: '/' }]}
                color={resolvedBrandColor}
                compact
              />
            </div>
            <ExperienceHintCard hints={HINTS} />
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Module & Experience liên quan</CardTitle>
        </CardHeader>
        <CardContent>
          <ControlCard title="Module & Experience liên quan">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <ExperienceModuleLink
                enabled={cartModule?.enabled ?? false}
                href="/system/modules/cart"
                icon={ShoppingCart}
                title="Giỏ hàng"
                colorScheme="orange"
              />
              <ExperienceModuleLink
                enabled={wishlistModule?.enabled ?? false}
                href="/system/modules/wishlist"
                icon={Heart}
                title="Wishlist"
                colorScheme="pink"
              />
              <ExperienceModuleLink
                enabled={productsModule?.enabled ?? false}
                href="/system/modules/products"
                icon={Package}
                title="Sản phẩm"
                colorScheme="green"
              />
              <ExperienceModuleLink
                enabled={postsModule?.enabled ?? false}
                href="/system/modules/posts"
                icon={FileText}
                title="Bài viết"
                colorScheme="purple"
              />
              <ExperienceModuleLink
                enabled={servicesModule?.enabled ?? false}
                href="/system/modules/services"
                icon={Briefcase}
                title="Dịch vụ"
                colorScheme="cyan"
              />
              <ExperienceModuleLink
                enabled={coursesModule?.enabled ?? false}
                href="/system/modules/courses"
                icon={BookOpen}
                title="Khóa học"
                colorScheme="blue"
              />
              <ExperienceModuleLink
                enabled={customersModule?.enabled ?? false}
                href="/system/modules/customers"
                icon={Users}
                title="Khách hàng"
                colorScheme="purple"
              />
              <ExperienceModuleLink
                enabled
                href="/system/experiences/contact"
                icon={Mail}
                title="Trang liên hệ"
                colorScheme="blue"
              />
              <ExperienceModuleLink
                enabled
                href="/system/experiences/checkout"
                icon={CreditCard}
                title="Checkout"
                colorScheme="cyan"
              />
            </div>
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trạng thái đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <ControlCard title="Trạng thái đăng nhập">
            <ModuleFeatureStatus
              label="Module Khách hàng"
              enabled={customersModule?.enabled ?? false}
              href="/system/modules/customers"
              moduleName="Module Khách hàng"
            />
            <ModuleFeatureStatus
              label="Tính năng đăng nhập"
              enabled={customerLoginFeature?.enabled ?? false}
              href="/system/modules/customers"
              moduleName="Module Khách hàng"
            />
            <ModuleFeatureStatus
              label="Theo dõi đơn hàng"
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              moduleName="Module Đơn hàng"
            />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye size={18} /> Preview
            </CardTitle>
            <div className="flex items-center gap-3">
              <LayoutTabs
                layouts={LAYOUT_STYLES}
                activeLayout={previewStyle}
                onChange={setPreviewStyle}
                accentColor={resolvedBrandColor}
              />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com">
              <HeaderMenuPreview
                brandColor={resolvedBrandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                config={previewConfig}
                logo={siteLogo}
                device={previewDevice}
                layoutStyle={previewStyle}
                menuItems={menuItems}
                settingsEmail={settingsEmail}
                settingsPhone={settingsPhone}
                customersEnabled={customersModule?.enabled ?? false}
                loginFeatureEnabled={customerLoginFeature?.enabled ?? false}
                ordersEnabled={ordersModule?.enabled ?? false}
                productsEnabled={productsModule?.enabled ?? false}
                postsEnabled={postsModule?.enabled ?? false}
                servicesEnabled={servicesModule?.enabled ?? false}
                coursesEnabled={coursesModule?.enabled ?? false}
              />
            </BrowserFrame>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Style: <strong className="text-slate-700 dark:text-slate-300">{LAYOUT_STYLES.find(s => s.id === previewStyle)?.label}</strong>
            {' • '}{previewDevice === 'desktop' && 'Desktop (1920px)'}{previewDevice === 'tablet' && 'Tablet (768px)'}{previewDevice === 'mobile' && 'Mobile (375px)'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
