'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useRouter, usePathname } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useBrandColors, useSiteSettings } from './hooks';
import dynamic from 'next/dynamic';
import { ArrowLeft, ChevronDown, ChevronRight, Heart, LogOut, Mail, Package, Phone, Search, User, X, Sun, Moon } from 'lucide-react';
import { CartIcon } from './CartIcon';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { getMenuColors, resolveMenuLayerColors, type MenuColors, type MenuLayerColorConfig } from './header/colors';
import { buildMenuTree, type MenuTreeNode } from '@/lib/utils/menu-tree';

interface MenuItem {
  _id: Id<"menuItems">;
  label: string;
  url: string;
  order: number;
  depth: number;
  active: boolean;
  icon?: string;
  openInNewTab?: boolean;
}

type MenuItemWithChildren = MenuTreeNode<MenuItem>;

export type HeaderInitialData = {
  menuData?: { menu: { _creationTime: number; _id: Id<'menus'>; location: string; name: string }; items: MenuItem[] } | null;
  headerStyle?: string | null;
  headerConfig?: HeaderConfig | null;
  contact?: { contact_phone?: string; contact_email?: string };
  site?: { site_name?: string; site_logo?: string; site_tagline?: string };
  modules?: {
    cart?: boolean;
    wishlist?: boolean;
    products?: boolean;
    posts?: boolean;
    services?: boolean;
    courses?: boolean;
    resources?: boolean;
    customers?: boolean;
    orders?: boolean;
    customerLogin?: boolean;
  };
};

type HeaderStyle = 'classic' | 'topbar' | 'allbirds' | 'darkglass';
type DropdownAlign = 'center' | 'left' | 'right';

interface TopbarConfig {
  show?: boolean;
  hotline?: string;
  email?: string;
  showEmail?: boolean;
  showHotline?: boolean;
  showTrackOrder?: boolean;
  slogan?: string;
  sloganEnabled?: boolean;
}

interface SearchConfig {
  show?: boolean;
  placeholder?: string;
  searchProducts?: boolean;
  searchPosts?: boolean;
  searchServices?: boolean;
  searchCourses?: boolean;
  searchResources?: boolean;
}

type LogoBackgroundStyle = 'none' | 'border' | 'shadow' | 'soft' | 'solid' | 'outline' | 'hairline' | 'inset' | 'pill';

interface HeaderConfig {
  brandName?: string;
  showBrandName?: boolean;
  logoSizeLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30;
  headerSpacingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  logoBackgroundStyle?: LogoBackgroundStyle;
  headerBackground?: 'white' | 'dots' | 'stripes';
  headerSeparator?: 'none' | 'shadow' | 'border' | 'gradient';
  headerSticky?: boolean;
  headerStickyDesktop?: boolean;
  headerStickyMobile?: boolean;
  layerColors?: MenuLayerColorConfig;
  showBrandAccent?: boolean;
  flatSubMenus?: boolean;
  borderRadiusStyle?: 'none' | 'small' | 'large';
  megaLevel1Color?: 'default' | 'primary' | 'secondary';
  cta?: { show?: boolean; text?: string; url?: string };
  topbar?: TopbarConfig;
  search?: SearchConfig;
  cart?: { show?: boolean };
  wishlist?: { show?: boolean };
  login?: { show?: boolean; text?: string };
  showDarkModeToggle?: boolean;
}

const DEFAULT_CONFIG: HeaderConfig = {
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
  flatSubMenus: false,
  borderRadiusStyle: 'large',
  megaLevel1Color: 'default',
  cart: { show: true },
  cta: { show: true, text: 'Liên hệ', url: '/contact' },
  login: { show: true, text: 'Đăng nhập' },
  search: { placeholder: 'Tìm kiếm...', searchPosts: true, searchProducts: true, searchServices: true, searchCourses: true, searchResources: true, show: true },
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

const DEFAULT_LINKS = {
  cart: '/cart',
  wishlist: '/wishlist',
  login: '/account/login',
  cta: '/contact',
  trackOrder: '/account/orders',
  storeSystem: '/stores',
  accountProfile: '/account/profile',
  accountOrders: '/account/orders',
};

const clampLogoSizeLevel = (level?: number): NonNullable<HeaderConfig['logoSizeLevel']> => {
  const value = Number.isFinite(level) ? Math.round(level as number) : 2;
  return Math.min(30, Math.max(1, value)) as NonNullable<HeaderConfig['logoSizeLevel']>;
};

const clampHeaderSpacingLevel = (level?: number): NonNullable<HeaderConfig['headerSpacingLevel']> => {
  const value = Number.isFinite(level) ? Math.round(level as number) : 5;
  return Math.min(7, Math.max(1, value)) as NonNullable<HeaderConfig['headerSpacingLevel']>;
};

const DROPDOWN_VIEWPORT_PADDING = 16;

const buildLinearSteps = (min: number, max: number, count = 30) => {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.round(min + step * index));
};

const resolveStickyState = (config: HeaderConfig) => ({
  desktop: config.headerStickyDesktop ?? config.headerSticky ?? true,
  mobile: config.headerStickyMobile ?? config.headerSticky ?? true,
});

const getStickyClass = (desktop: boolean, mobile: boolean) => {
  if (desktop && mobile) {
    return 'sticky top-0 z-50';
  }
  if (desktop && !mobile) {
    return 'relative z-50 lg:sticky lg:top-0';
  }
  if (!desktop && mobile) {
    return 'sticky top-0 z-50 lg:relative lg:top-auto';
  }
  return 'relative z-50';
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const getMegaMenuWidthValue = (columnCount: number) => {
  if (columnCount <= 1) {return 260;}
  if (columnCount === 2) {return 420;}
  if (columnCount === 3) {return 620;}
  if (columnCount === 4) {return 820;}
  return 960;
};

const getDropdownPositionClass = (align: DropdownAlign) => {
  if (align === 'left') {return 'left-0';}
  if (align === 'right') {return 'right-0';}
  return 'left-1/2 -translate-x-1/2';
};

const getViewportSafeMaxWidth = () => `calc(100vw - ${DROPDOWN_VIEWPORT_PADDING}px)`;

const HeaderSearchAutocomplete = dynamic(
  () => import('./HeaderSearchAutocomplete').then((mod) => ({ default: mod.HeaderSearchAutocomplete })),
  { ssr: false, loading: () => null }
);

function DarkModeToggle({ tokens, variant: _variant = 'desktop' }: { tokens: any; variant?: 'desktop' | 'mobile' }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const setSetting = useMutation(api.settings.set);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));

    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('site-theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('site-theme-change', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    const nextValue = nextDark ? 'dark' : 'light';
    // Optimistic UI: apply theme ngay lập tức
    const root = document.documentElement;
    root.classList.toggle('dark', nextDark);
    root.setAttribute('data-theme', nextValue);
    root.style.colorScheme = nextValue;
    window.dispatchEvent(new Event('site-theme-change'));
    // Persist vào DB (single source of truth)
    void setSetting({ group: 'site', key: 'site_dark_mode', value: nextValue });
  };

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const color = tokens?.iconButtonText || 'currentColor';
  const hoverBg = tokens?.iconButtonHoverBg || 'rgba(0,0,0,0.05)';

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors flex items-center justify-center"
      style={{
        color,
        '--hover-bg': hoverBg,
      } as React.CSSProperties}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function Header({ initialData, staticMode }: { initialData?: HeaderInitialData; staticMode?: boolean }) {
  const brandColors = useBrandColors();
  const siteSettings = useSiteSettings();
  const menuDataQuery = useQuery(api.menus.getFullMenu, staticMode ? 'skip' : { location: 'header' });
  const headerStyleSetting = useQuery(api.settings.getByKey, staticMode ? 'skip' : { key: 'header_style' });
  const headerConfigSetting = useQuery(api.settings.getByKey, staticMode ? 'skip' : { key: 'header_config' });
  const contactSettings = useQuery(api.settings.listByGroup, staticMode ? 'skip' : { group: 'contact' });
  const cartModule = useQuery(api.admin.modules.getModuleByKey, staticMode ? 'skip' : { key: 'cart' });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, staticMode ? 'skip' : { key: 'wishlist' });
  const customersModule = useQuery(api.admin.modules.getModuleByKey, staticMode ? 'skip' : { key: 'customers' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, staticMode ? 'skip' : { key: 'orders' });
  const productsModule = useQuery(api.admin.modules.getModuleByKey, staticMode ? 'skip' : { key: 'products' });
  const postsModule = useQuery(api.admin.modules.getModuleByKey, staticMode ? 'skip' : { key: 'posts' });
  const servicesModule = useQuery(api.admin.modules.getModuleByKey, staticMode ? 'skip' : { key: 'services' });
  const coursesModule = useQuery(api.admin.modules.getModuleByKey, staticMode ? 'skip' : { key: 'courses' });
  const resourcesModule = useQuery(api.admin.modules.getModuleByKey, staticMode ? 'skip' : { key: 'resources' });
  const commerceCapabilities = useQuery(api.cart.getCommerceCapabilities, staticMode ? 'skip' : {});
  const customerLoginFeature = useQuery(api.admin.modules.getModuleFeature, staticMode ? 'skip' : { moduleKey: 'customers', featureKey: 'enableLogin' });
  const router = useRouter();
  const pathname = usePathname();
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  
  const menuData = menuDataQuery ?? initialData?.menuData;
  const headerStyleRaw = (headerStyleSetting?.value ?? initialData?.headerStyle) as string | undefined;
  const headerStyle: HeaderStyle = (headerStyleRaw === 'transparent' || headerStyleRaw === 'centered' ? 'allbirds' : headerStyleRaw as HeaderStyle) || 'classic';
  const savedConfig = ((headerConfigSetting?.value ?? initialData?.headerConfig) as HeaderConfig) || {};
  const config: HeaderConfig = {
    ...DEFAULT_CONFIG,
    ...savedConfig,
    logoSizeLevel: clampLogoSizeLevel(savedConfig.logoSizeLevel ?? DEFAULT_CONFIG.logoSizeLevel),
    headerSpacingLevel: clampHeaderSpacingLevel(savedConfig.headerSpacingLevel ?? DEFAULT_CONFIG.headerSpacingLevel),
    topbar: { ...DEFAULT_CONFIG.topbar, ...savedConfig.topbar },
    search: { ...DEFAULT_CONFIG.search, ...savedConfig.search },
    cta: { ...DEFAULT_CONFIG.cta, ...savedConfig.cta },
    cart: { ...DEFAULT_CONFIG.cart, ...savedConfig.cart },
    wishlist: { ...DEFAULT_CONFIG.wishlist, ...savedConfig.wishlist },
    login: { ...DEFAULT_CONFIG.login, ...savedConfig.login },
  };
  
  const settingsPhone = contactSettings?.find(s => s.key === 'contact_phone')?.value as string
    ?? initialData?.contact?.contact_phone;
  const settingsEmail = contactSettings?.find(s => s.key === 'contact_email')?.value as string
    ?? initialData?.contact?.contact_email;
  
  const topbarConfig = useMemo(() => {
    const base = config.topbar ?? {};
    return {
      ...base,
      hotline: settingsPhone ?? '',
      email: settingsEmail ?? '',
    };
  }, [config.topbar, settingsPhone, settingsEmail]);

  const canLogin = (customersModule?.enabled ?? initialData?.modules?.customers ?? false) && (customerLoginFeature?.enabled ?? initialData?.modules?.customerLogin ?? false);
  const cartEnabled = cartModule?.enabled ?? initialData?.modules?.cart ?? false;
  const wishlistEnabled = wishlistModule?.enabled ?? initialData?.modules?.wishlist ?? false;
  const ordersEnabled = ordersModule?.enabled ?? initialData?.modules?.orders ?? false;
  const productsEnabled = productsModule?.enabled ?? initialData?.modules?.products ?? (staticMode ? Boolean(config.search?.searchProducts) : false);
  const postsEnabled = postsModule?.enabled ?? initialData?.modules?.posts ?? (staticMode ? Boolean(config.search?.searchPosts) : false);
  const servicesEnabled = servicesModule?.enabled ?? initialData?.modules?.services ?? (staticMode ? Boolean(config.search?.searchServices) : false);
  const coursesEnabled = coursesModule?.enabled ?? initialData?.modules?.courses ?? (staticMode ? Boolean(config.search?.searchCourses) : false);
  const resourcesEnabled = resourcesModule?.enabled ?? initialData?.modules?.resources ?? (staticMode ? Boolean(config.search?.searchResources) : false);
  const showLogin = Boolean(config.login?.show && canLogin);
  const showUserMenu = showLogin && isAuthenticated;
  const showLoginLink = showLogin && !isAuthenticated;
  const canTrackOrder = ordersEnabled;
  const showTrackOrder = Boolean(topbarConfig.showTrackOrder && canTrackOrder);
  const canSearchProducts = Boolean(config.search?.searchProducts && productsEnabled);
  const canSearchPosts = Boolean(config.search?.searchPosts && postsEnabled);
  const canSearchServices = Boolean(config.search?.searchServices && servicesEnabled);
  const canSearchCourses = Boolean(config.search?.searchCourses && coursesEnabled);
  const canSearchResources = Boolean(config.search?.searchResources && resourcesEnabled);
  const showSearch = Boolean(config.search?.show && (canSearchProducts || canSearchPosts || canSearchServices || canSearchCourses || canSearchResources));
  const showCart = Boolean(config.cart?.show && (commerceCapabilities?.cartAvailable ?? (cartEnabled && ordersEnabled)));
  const showWishlist = Boolean(config.wishlist?.show && wishlistEnabled);
  const ctaHref = config.cta?.url?.trim() || DEFAULT_LINKS.cta;
  
  const resolvedSiteName = siteSettings.isLoading
    ? (initialData?.site?.site_name ?? 'Website')
    : siteSettings.siteName;
  const resolvedLogo = siteSettings.isLoading
    ? (initialData?.site?.site_logo ?? '')
    : siteSettings.logo;
  const resolvedTagline = siteSettings.isLoading
    ? (initialData?.site?.site_tagline ?? '')
    : (siteSettings.settings.site_tagline as string | undefined) ?? '';

  const displayName = (resolvedSiteName ?? config.brandName) ?? 'YourBrand';
  const logo = resolvedLogo;
  const showBrandName = config.showBrandName !== false;
  const logoSizeLevel = config.logoSizeLevel ?? 2;
  const headerSpacingLevel = clampHeaderSpacingLevel(config.headerSpacingLevel);
  const logoSizeMap: Record<HeaderStyle, number[]> = {
    classic: buildLinearSteps(24, 160),
    topbar: buildLinearSteps(28, 180),
    allbirds: buildLinearSteps(16, 140),
    darkglass: buildLinearSteps(24, 128),
  };
  const headerSpacingMap: Record<HeaderStyle, number[]> = {
    classic: [6, 8, 10, 12, 14, 16, 18],
    topbar: [4, 6, 8, 10, 12, 14, 16],
    allbirds: [6, 8, 10, 12, 14, 16, 18],
    darkglass: [6, 8, 10, 12, 14, 16, 18],
  };
  const logoSize = logoSizeMap[headerStyle][logoSizeLevel - 1] ?? logoSizeMap[headerStyle][0];
  const headerSpacingY = headerSpacingMap[headerStyle][headerSpacingLevel - 1] ?? headerSpacingMap[headerStyle][3];
  const logoDotSize = Math.max(2, Math.round(logoSize / 4));
  const logoBackgroundStyle: LogoBackgroundStyle =
    config.logoBackgroundStyle === 'border'
    || config.logoBackgroundStyle === 'shadow'
    || config.logoBackgroundStyle === 'soft'
    || config.logoBackgroundStyle === 'solid'
    || config.logoBackgroundStyle === 'outline'
    || config.logoBackgroundStyle === 'hairline'
    || config.logoBackgroundStyle === 'inset'
    || config.logoBackgroundStyle === 'pill'
      ? config.logoBackgroundStyle
      : 'none';
  const logoContainerSize = Math.round(logoSize + Math.max(10, logoSize * 0.28));

  const tokens = useMemo<MenuColors>(
    () => getMenuColors(brandColors.primary, brandColors.secondary, brandColors.mode, siteSettings.isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, siteSettings.isDark]
  );
  const layerColors = useMemo(
    () => resolveMenuLayerColors(config.layerColors, tokens, brandColors.mode),
    [config.layerColors, tokens, brandColors.mode]
  );
  const menuVars: React.CSSProperties = {
    '--menu-hover-bg': tokens.navItemHoverBg,
    '--menu-hover-text': tokens.navItemHoverText,
    '--menu-dropdown-hover-bg': tokens.dropdownItemHoverBg,
    '--menu-dropdown-hover-text': tokens.dropdownItemHoverText,
    '--menu-dropdown-sub-hover-text': tokens.dropdownSubItemHoverText,
    '--menu-icon-hover': tokens.iconButtonHoverText,
  } as React.CSSProperties;
  const navbarActionTokens: MenuColors = {
    ...tokens,
    iconButtonText: layerColors.navbar.text,
  };
  const logoBackgroundStyles: Record<LogoBackgroundStyle, React.CSSProperties> = {
    none: {},
    border: {
      backgroundColor: siteSettings.isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      border: `1px solid ${tokens.borderStrong}`,
      boxShadow: siteSettings.isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(15, 23, 42, 0.08)',
    },
    outline: {
      backgroundColor: siteSettings.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)',
      border: `1px solid ${tokens.borderStrong}`,
    },
    hairline: {
      backgroundColor: 'transparent',
      border: `1px solid ${tokens.border}`,
    },
    inset: {
      backgroundColor: tokens.surfaceAlt,
      border: `1px solid ${tokens.border}`,
      boxShadow: siteSettings.isDark ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    },
    pill: {
      backgroundColor: siteSettings.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)',
      border: `1px solid ${tokens.border}`,
    },
    shadow: {
      backgroundColor: siteSettings.isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)',
      boxShadow: siteSettings.isDark ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 10px 30px rgba(15, 23, 42, 0.16)',
      border: siteSettings.isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(148, 163, 184, 0.2)',
      backdropFilter: 'blur(10px)',
    },
    soft: {
      backgroundColor: tokens.surfaceAlt,
      border: `1px solid ${tokens.border}`,
      boxShadow: siteSettings.isDark ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
    },
    solid: {
      backgroundColor: tokens.textPrimary,
      border: `1px solid ${tokens.textPrimary}`,
      boxShadow: siteSettings.isDark ? '0 12px 28px rgba(0, 0, 0, 0.4)' : '0 12px 28px rgba(15, 23, 42, 0.18)',
    },
  };
  const hasBackgroundFrame = logoBackgroundStyle !== 'none';
  const logoWrapStyle: React.CSSProperties = {
    width: hasBackgroundFrame ? logoContainerSize : logoSize,
    height: logo ? 'auto' : (hasBackgroundFrame ? logoContainerSize : logoSize),
    ...(logo && hasBackgroundFrame ? { padding: Math.max(4, Math.round(logoSize * 0.1)) } : {}),
    borderRadius: logoBackgroundStyle === 'pill'
      ? logoContainerSize
      : headerStyle === 'allbirds'
        ? logoContainerSize
        : Math.max(16, Math.round(logoContainerSize * 0.24)),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...logoBackgroundStyles[logoBackgroundStyle],
  };
  const logoInnerBaseStyle: React.CSSProperties = {
    width: logoSize,
    height: logo ? 'auto' : logoSize,
    borderRadius: headerStyle === 'allbirds' ? logoSize : Math.max(8, Math.round(logoSize * 0.24)),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: logo ? 'visible' : 'hidden',
  };
  const logoInnerStyle: React.CSSProperties = logo
    ? logoInnerBaseStyle
    : {
        ...logoInnerBaseStyle,
        backgroundColor: tokens.brandBadgeBg,
        color: tokens.brandBadgeText,
      };
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuStack, setMenuStack] = useState<MenuItemWithChildren[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeLevel3Id, setActiveLevel3Id] = useState<string | null>(null);
  const [activeLevel4Id, setActiveLevel4Id] = useState<string | null>(null);
  const [visibleRootCount, setVisibleRootCount] = useState<number | null>(null);
  const [dropdownAlign, setDropdownAlign] = useState<Record<string, DropdownAlign>>({});
  const [flyoutDirection, setFlyoutDirection] = useState<Record<string, 'left' | 'right'>>({});
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deepMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const headerRowRef = useRef<HTMLDivElement | null>(null);
  const brandBlockRef = useRef<HTMLAnchorElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const measureContainerRef = useRef<HTMLDivElement | null>(null);
  const measureItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const moreMeasureRef = useRef<HTMLDivElement | null>(null);
  const dropdownTriggerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dropdownWidthByIdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInside = Array.from(document.querySelectorAll('.user-menu-container')).some(
        el => el.contains(target)
      );
      if (!isInside) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    if (headerStyle !== 'darkglass') return;
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headerStyle]);

  const clearDeepMenuCloseIntent = useCallback(() => {
    if (deepMenuTimeoutRef.current) {
      clearTimeout(deepMenuTimeoutRef.current);
      deepMenuTimeoutRef.current = null;
    }
  }, []);

  const scheduleDeepMenuClose = useCallback(() => {
    clearDeepMenuCloseIntent();
    deepMenuTimeoutRef.current = setTimeout(() => {
      setActiveLevel4Id(null);
    }, 320);
  }, [clearDeepMenuCloseIntent]);

  const handleMenuEnter = useCallback((itemId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    clearDeepMenuCloseIntent();
    setHoveredItem(itemId);
    setActiveLevel3Id(null);
    setActiveLevel4Id(null);
  }, [clearDeepMenuCloseIntent]);

  const updateDropdownAlign = useCallback((itemId: string, desiredWidth: number) => {
    if (typeof window === 'undefined') {return;}
    const trigger = dropdownTriggerRefs.current[itemId];
    if (!trigger) {return;}
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const safeWidth = Math.min(desiredWidth, viewportWidth - DROPDOWN_VIEWPORT_PADDING);
    const centerX = rect.left + rect.width / 2;
    const halfWidth = safeWidth / 2;
    let align: DropdownAlign = 'center';
    if (centerX - halfWidth < DROPDOWN_VIEWPORT_PADDING / 2) {
      align = 'left';
    } else if (centerX + halfWidth > viewportWidth - DROPDOWN_VIEWPORT_PADDING / 2) {
      align = 'right';
    }
    setDropdownAlign(prev => (prev[itemId] === align ? prev : { ...prev, [itemId]: align }));
  }, []);

  const updateFlyoutDirection = useCallback((key: string, trigger?: HTMLElement | null, desiredWidth = 320) => {
    if (typeof window === 'undefined' || !trigger) {return;}
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const safeWidth = Math.min(desiredWidth, viewportWidth - DROPDOWN_VIEWPORT_PADDING);
    const availableRight = viewportWidth - rect.right;
    const availableLeft = rect.left;
    const direction: 'left' | 'right' = availableRight < safeWidth && availableLeft > availableRight ? 'left' : 'right';
    setFlyoutDirection(prev => (prev[key] === direction ? prev : { ...prev, [key]: direction }));
  }, []);

  const handleMenuEnterWithWidth = useCallback((itemId: string, desiredWidth: number) => {
    dropdownWidthByIdRef.current[itemId] = desiredWidth;
    updateDropdownAlign(itemId, desiredWidth);
    handleMenuEnter(itemId);
  }, [handleMenuEnter, updateDropdownAlign]);

  useEffect(() => {
    if (!hoveredItem) {return;}
    const handleResize = () => {
      const width = dropdownWidthByIdRef.current[hoveredItem];
      if (width) {
        updateDropdownAlign(hoveredItem, width);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hoveredItem, updateDropdownAlign]);

  const handleMenuLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
      setActiveLevel3Id(null);
      setActiveLevel4Id(null);
    }, 320);
  }, []);

  const menuItems = menuData?.items;

  const classicBackgroundStyle: React.CSSProperties = (() => {
    if (config.headerBackground === 'dots') {
      return {
        backgroundColor: tokens.surface,
        backgroundImage: `radial-gradient(circle, ${tokens.patternDot} 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
      };
    }
    if (config.headerBackground === 'stripes') {
      return {
        backgroundColor: tokens.surface,
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${tokens.patternStripe} 10px, ${tokens.patternStripe} 20px)`,
      };
    }
    return { backgroundColor: tokens.surface };
  })();

  const classicSeparatorStyle: React.CSSProperties =
    config.headerSeparator === 'border' || config.headerSeparator === 'shadow'
      ? { borderBottom: `1px solid ${tokens.border}` }
      : {};

  const classicSeparatorElement = config.headerSeparator === 'gradient'
    ? (
      <div className="h-1" style={{ backgroundColor: tokens.borderStrong }} />
    )
    : null;

  const { desktop: stickyDesktop, mobile: stickyMobile } = resolveStickyState(config);
  const classicPositionClass = getStickyClass(stickyDesktop, stickyMobile);
  const menuTree = useMemo((): MenuItemWithChildren[] => {
    if (!menuItems) {return [];}
    return buildMenuTree(menuItems);
  }, [menuItems]);

  const rootItems = menuTree;
  const maxLevelByRootId = useMemo(() => {
    const getNodeMaxLevel = (node: MenuItemWithChildren, level = 1): number => {
      if (!node.children || node.children.length === 0) {
        return level;
      }
      return node.children.reduce((max, child) => Math.max(max, getNodeMaxLevel(child, level + 1)), level);
    };
    return new Map<Id<'menuItems'>, number>(rootItems.map((root) => [root._id, getNodeMaxLevel(root, 1)]));
  }, [rootItems]);
  const isDeepMenuForItem = useCallback((itemId: Id<'menuItems'>) => (maxLevelByRootId.get(itemId) ?? 1) >= 3, [maxLevelByRootId]);

  useLayoutEffect(() => {
    if (measureItemRefs.current.length !== rootItems.length) {
      measureItemRefs.current = Array(rootItems.length).fill(null);
    }
    if (!navRef.current || rootItems.length === 0) {
      setVisibleRootCount(rootItems.length);
      return;
    }

    const parseGap = (element: HTMLElement | null) => {
      if (!element) {return 0;}
      const style = window.getComputedStyle(element);
      const gap = parseFloat(style.columnGap || style.gap || '0');
      return Number.isNaN(gap) ? 0 : gap;
    };

    const calculate = () => {
      const availableNavWidth = navRef.current?.clientWidth ?? 0;
      if (!availableNavWidth) {return;}

      const widths = measureItemRefs.current.map((item) => item?.offsetWidth ?? 0);
      const moreWidth = moreMeasureRef.current?.offsetWidth ?? 0;
      const itemGap = parseGap(measureContainerRef.current);
      const totalItems = widths.length;

      if (totalItems === 0) {
        setVisibleRootCount(0);
        return;
      }

      const prefix: number[] = [];
      widths.forEach((width, index) => {
        prefix[index] = width + (index > 0 ? prefix[index - 1] + itemGap : 0);
      });

      const widthForCount = (count: number) => {
        if (count <= 0) {
          return totalItems > 0 ? moreWidth : 0;
        }
        const itemsWidth = prefix[count - 1];
        if (count < totalItems) {
          return itemsWidth + itemGap + moreWidth;
        }
        return itemsWidth;
      };

      let low = 0;
      let high = totalItems;
      let best = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const totalWidth = widthForCount(mid);
        if (totalWidth <= availableNavWidth) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      setVisibleRootCount(Math.max(0, best));
    };

    const resizeObserver = new ResizeObserver(calculate);
    if (navRef.current) {resizeObserver.observe(navRef.current);}    
    if (measureContainerRef.current) {resizeObserver.observe(measureContainerRef.current);}    
    measureItemRefs.current.forEach((item) => { if (item) {resizeObserver.observe(item);} });
    if (moreMeasureRef.current) {resizeObserver.observe(moreMeasureRef.current);}    
    calculate();

    return () => resizeObserver.disconnect();
  }, [rootItems.length, logoSizeLevel, showBrandName, headerStyle, config.cta?.show, showSearch, showCart, showWishlist, showLogin]);

  const topbarSlogan = resolvedTagline ? resolvedTagline.trim() : '';
  const topbarSloganEnabled = (topbarConfig.sloganEnabled ?? true) !== false;
  const showTopbarSlogan = Boolean(topbarConfig.show !== false && topbarSloganEnabled && topbarSlogan);
  const showTopbarHotline = Boolean(topbarConfig.show !== false && (topbarConfig.showHotline ?? true) && topbarConfig.hotline);
  const showTopbarEmail = Boolean(topbarConfig.show !== false && (topbarConfig.showEmail ?? true) && topbarConfig.email);



  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => {
      if (prev) {
        setMenuStack([]);
      }
      return !prev;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setUserMenuOpen(false);
    router.push('/');
  }, [logout, router]);

  const renderUserMenu = (variant: 'text' | 'icon', textClassName = '') => (
    <div className="relative user-menu-container">
      <button
        onClick={() => { setUserMenuOpen(prev => !prev); }}
        className={cn(
          variant === 'text'
            ? `hover:underline flex items-center gap-1 ${textClassName}`
            : 'p-2 transition-colors hover:text-[var(--menu-icon-hover)]',
        )}
        style={variant === 'icon' ? { color: layerColors.navbar.text, ...menuVars } : { color: layerColors.topnav.text }}
      >
        <User size={variant === 'text' ? 12 : 18} />
        {variant === 'text' && <span>{customer?.name || (config.login?.text ?? 'Tài khoản')}</span>}
      </button>
      {userMenuOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl border z-50"
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: tokens.border }}>
            <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>Xin chào, {customer?.name || 'Khách hàng'}</p>
            {customer?.email && (
              <p className="text-xs mt-1" style={{ color: tokens.textSubtle }}>{customer.email}</p>
            )}
          </div>
          <div className="py-2">
            <Link
              href={DEFAULT_LINKS.accountProfile}
              onClick={() => { setUserMenuOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)]"
              style={{ color: tokens.dropdownItemText, ...menuVars }}
            >
              <User size={16} />
              Thông tin tài khoản
            </Link>
            <Link
              href={DEFAULT_LINKS.accountOrders}
              onClick={() => { setUserMenuOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)]"
              style={{ color: tokens.dropdownItemText, ...menuVars }}
            >
              <Package size={16} />
              Đơn hàng của tôi
            </Link>
            {wishlistEnabled && (
              <Link
                href={DEFAULT_LINKS.wishlist}
                onClick={() => { setUserMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)]"
                style={{ color: tokens.dropdownItemText, ...menuVars }}
              >
                <Heart size={16} />
                Danh sách yêu thích
              </Link>
            )}
          </div>
          <div className="border-t" style={{ borderColor: tokens.border }}>
            <button
              onClick={() => { void handleLogout(); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)]"
              style={{ color: tokens.textSubtle, ...menuVars }}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (menuData === undefined) {
    return (
      <header style={{ backgroundColor: tokens.surface }}>
        <div className="max-w-7xl mx-auto px-4" style={{ paddingTop: headerSpacingY, paddingBottom: headerSpacingY }}>
          <div className="h-8 w-32 animate-pulse rounded" style={{ backgroundColor: tokens.placeholderBg }}></div>
        </div>
      </header>
    );
  }

  // Inline mobile menu button renderer
  const renderMobileMenuButton = (isTransparent = false, customColor?: string) => {
    const color = customColor || (isTransparent ? tokens.textInverse : layerColors.navbar.text);
    return (
      <button onClick={handleMobileMenuToggle} className={cn('p-2 rounded-lg lg:hidden')} style={{ color }}>
        <div className="w-5 h-4 flex flex-col justify-between">
          <span
            className={cn('w-full h-0.5 rounded transition-all', mobileMenuOpen && 'rotate-45 translate-y-1.5')}
            style={{ backgroundColor: color }}
          ></span>
          <span
            className={cn('w-full h-0.5 rounded transition-all', mobileMenuOpen && 'opacity-0')}
            style={{ backgroundColor: color }}
          ></span>
          <span
            className={cn('w-full h-0.5 rounded transition-all', mobileMenuOpen && '-rotate-45 -translate-y-1.5')}
            style={{ backgroundColor: color }}
          ></span>
        </div>
      </button>
    );
  };

  const getMegaMenuWidthClass = (columnCount: number) => {
    if (columnCount <= 1) {return 'w-[260px]';}
    if (columnCount === 2) {return 'w-[420px]';}
    if (columnCount === 3) {return 'w-[620px]';}
    if (columnCount === 4) {return 'w-[820px]';}
    return 'w-[960px]';
  };

  const getMegaMenuGridClass = (columnCount: number) => {
    if (columnCount <= 1) {return 'grid-cols-1';}
    if (columnCount === 2) {return 'md:grid-cols-2';}
    if (columnCount === 3) {return 'md:grid-cols-2 xl:grid-cols-3';}
    if (columnCount === 4) {return 'md:grid-cols-2 xl:grid-cols-4';}
    return 'md:grid-cols-2 xl:grid-cols-5';
  };

  // Bo góc động theo config
  const radiusLevel = config.borderRadiusStyle ?? 'large';
  const r = {
    btn: radiusLevel === 'none' ? 'rounded-none' : radiusLevel === 'small' ? 'rounded' : 'rounded-lg',
    dropdown: radiusLevel === 'none' ? 'rounded-none' : radiusLevel === 'small' ? 'rounded-md' : 'rounded-xl',
    popup: radiusLevel === 'none' ? 'rounded-none' : radiusLevel === 'small' ? 'rounded-md' : 'rounded-2xl',
    item: radiusLevel === 'none' ? 'rounded-none' : radiusLevel === 'small' ? 'rounded' : 'rounded-lg',
  };

  // Màu tiêu đề cấp 1 Mega Menu
  const level1ColorMode = config.megaLevel1Color ?? 'default';
  const level1Color =
    level1ColorMode === 'primary' ? tokens.primary
    : level1ColorMode === 'secondary' ? tokens.secondary
    : tokens.textPrimary;

  const renderDesktopFlyoutNodes = (nodes: MenuItemWithChildren[], deepMode: boolean): React.ReactNode => nodes.map((node) => {
    if (!deepMode) {
      const flyoutKey = `flyout-${node._id}`;
      const flyoutAlign = flyoutDirection[flyoutKey] ?? 'right';
      const flyoutPositionClass = flyoutAlign === 'left' ? 'right-full mr-1' : 'left-full ml-1';

      return (
        <div
          key={node._id}
          className="relative group/menu-node"
          onMouseEnter={(event) => {
            updateFlyoutDirection(flyoutKey, event.currentTarget);
          }}
        >
          <Link
            href={node.url}
            target={node.openInNewTab ? '_blank' : undefined}
            rel={node.openInNewTab ? 'noreferrer' : undefined}
            className={cn('flex min-w-0 items-start justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
            style={{ color: tokens.dropdownItemText, ...menuVars }}
          >
            <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{node.label}</span>
            {node.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
          </Link>
          {node.children.length > 0 && (
            <div className={cn('absolute top-0 z-50 hidden', flyoutPositionClass)}>
              <div
                className={cn(
                  r.dropdown,
                  'border py-2 min-w-[220px] max-w-[min(300px,calc(100vw-2rem))] shadow-xl group-hover/menu-node:block',
                  !node.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
                )}
                style={{
                  backgroundColor: tokens.dropdownBg,
                  borderColor: tokens.dropdownBorder,
                  maxHeight: !node.children.some((child) => child.children && child.children.length > 0) ? 'min(60vh, 290px)' : undefined,
                }}
              >
                {renderDesktopFlyoutNodes(node.children, deepMode)}
              </div>
            </div>
          )}
        </div>
      );
    }

    const isLevel4Open = activeLevel4Id === node._id;

    return (
      <div
        key={node._id}
        className="relative"
        onMouseEnter={() => {
          clearDeepMenuCloseIntent();
          setActiveLevel4Id(node._id);
        }}
        onMouseLeave={scheduleDeepMenuClose}
      >
        <Link
          href={node.url}
          target={node.openInNewTab ? '_blank' : undefined}
          rel={node.openInNewTab ? 'noreferrer' : undefined}
          className={cn('flex min-w-0 items-start justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
          style={{
            ...(isLevel4Open ? { backgroundColor: tokens.dropdownItemHoverBg, color: tokens.dropdownItemHoverText } : { color: tokens.dropdownItemText }),
            ...menuVars,
          }}
        >
          <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{node.label}</span>
          {node.children.length > 0 && <ChevronRight size={10} className={cn('transition-transform duration-200', isLevel4Open && 'rotate-90')} />}
        </Link>
        {node.children.length > 0 && isLevel4Open && (
          <div className="absolute left-full top-0 ml-1 z-50">
            <div
              className={cn(
                r.dropdown,
                'border py-2 min-w-[220px] max-w-[min(300px,calc(100vw-2rem))] shadow-xl',
                !node.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
              )}
              style={{
                backgroundColor: tokens.dropdownBg,
                borderColor: tokens.dropdownBorder,
                maxHeight: !node.children.some((child) => child.children && child.children.length > 0) ? 'min(60vh, 290px)' : undefined,
              }}
            >
              {node.children.map((child) => (
                <Link
                  key={child._id}
                  href={child.url}
                  target={child.openInNewTab ? '_blank' : undefined}
                  rel={child.openInNewTab ? 'noreferrer' : undefined}
                  className={cn('block px-3 py-2 text-sm whitespace-normal break-words leading-snug transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
                  style={{ color: tokens.dropdownItemText, ...menuVars }}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  });

  // Mobile menu layer colors
  // - Light: nền trắng (surface), chữ tối, border rõ => dễ đọc trên mọi brand màu
  // - DarkGlass: nền tối trong suốt, chữ trắng
  // layerColors.menu chỉ dùng làm màu accent ("Xem tất cả" button), không làm nền card
  type MobileLayerColors = { bg: string; text: string; border: string; tray: string };

  const darkGlassLayer: MobileLayerColors = {
    bg: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.14)',
    tray: 'transparent',
  };

  const lightMenuLayer: MobileLayerColors = {
    // Card: trắng tinh — nổi rõ trên tray xám nhạt
    bg: tokens.surface,
    text: tokens.textPrimary,
    border: tokens.borderStrong,
    // Tray: xám nhạt iOS-style (surfaceAlt)
    tray: tokens.surfaceMuted,
  };

  // Grouped List pattern (iOS Settings style):
  // border-b trực tiếp trên item — reliable, không bị lệch như div height:1
  const renderMobileNodes = (nodes: MenuItemWithChildren[], layer: MobileLayerColors = lightMenuLayer): React.ReactNode => {
    if (nodes.length === 0) return null;
    // Màu chevron: primary thương hiệu để user nhận ra ngay "có thể bấm vào"
    const chevronColor = layer === darkGlassLayer ? 'rgba(255,255,255,0.7)' : tokens.primary;
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: layer.bg, border: `1.5px solid ${layer.border}` }}
      >
        {nodes.map((node, idx) => {
          const hasChildren = node.children && node.children.length > 0;
          const isLast = idx === nodes.length - 1;

          return (
            <div
              key={node._id}
              className={!isLast ? 'border-b' : ''}
              style={!isLast ? { borderColor: layer.border } : {}}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => setMenuStack(prev => [...prev, node])}
                  className="flex items-center justify-between w-full py-4 px-5 text-sm font-semibold text-left active:opacity-60"
                  style={{ color: layer.text, ...menuVars }}
                >
                  <span>{node.label}</span>
                  <ChevronRight size={18} className="shrink-0" style={{ color: chevronColor }} />
                </button>
              ) : (
                <Link
                  href={node.url}
                  target={node.openInNewTab ? '_blank' : undefined}
                  rel={node.openInNewTab ? 'noreferrer' : undefined}
                  onClick={() => { setMobileMenuOpen(false); setMenuStack([]); }}
                  className="block w-full py-4 px-5 text-sm font-semibold active:opacity-60"
                  style={{ color: layer.text, ...menuVars }}
                >
                  {node.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMobileMenuContent = (isDarkGlass = false) => {
    const layer = isDarkGlass ? darkGlassLayer : lightMenuLayer;
    const currentNode = menuStack[menuStack.length - 1] || null;
    const displayItems = currentNode ? currentNode.children : menuTree;

    // Nút "Xem tất cả": màu primary thương hiệu, text APCA-safe
    const viewAllBg = isDarkGlass ? 'rgba(255,255,255,0.15)' : tokens.primary;
    const viewAllBorder = isDarkGlass ? 'rgba(255,255,255,0.2)' : tokens.primary;
    const viewAllText = isDarkGlass ? '#ffffff' : tokens.textInverse;

    // Header drill-down: màu neutral đậm để đọc rõ bất kể brand
    const headerText = isDarkGlass ? '#ffffff' : tokens.textPrimary;
    const headerBorder = isDarkGlass ? 'rgba(255,255,255,0.14)' : tokens.border;
    const headerBg = isDarkGlass ? 'rgba(0,0,0,0.2)' : tokens.surface;

    return (
      <div className="flex flex-col h-full w-full">
        {/* Drill-down header: Back + Tên danh mục + Close */}
        {menuStack.length > 0 && (
          <div 
            className="flex items-center justify-between border-b px-2 py-2"
            style={{ borderColor: headerBorder, backgroundColor: headerBg }}
          >
            <button 
              onClick={() => setMenuStack(prev => prev.slice(0, -1))} 
              className="flex items-center gap-1 py-2 px-3 rounded-lg hover:opacity-70 transition-opacity"
              style={{ color: tokens.primary }}
            >
              <ArrowLeft size={17} />
              <span className="text-sm font-medium">Quay lại</span>
            </button>
            <span className="font-bold text-sm flex-1 text-center truncate px-2" style={{ color: headerText }}>
              {currentNode?.label}
            </span>
            <button 
              onClick={() => { setMobileMenuOpen(false); setMenuStack([]); }} 
              className="p-2 px-3 rounded-lg hover:opacity-70 transition-opacity"
              style={{ color: headerText }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        
        {/* Menu list — tray xám nhạt, card trắng bên trong */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[70vh]"
          style={{ backgroundColor: isDarkGlass ? 'transparent' : layer.tray }}
        >
          {/* Nút xem tất cả danh mục cha — màu thương hiệu primary */}
          {currentNode && (
            <div className="rounded-xl overflow-hidden shadow-sm">
              <Link
                href={currentNode.url}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setMenuStack([]);
                }}
                className="block w-full py-4 px-5 text-sm font-bold transition-opacity hover:opacity-90 text-center"
                style={{ backgroundColor: viewAllBg, borderColor: viewAllBorder, color: viewAllText }}
              >
                Xem tất cả {currentNode.label}
              </Link>
            </div>
          )}
          {renderMobileNodes(displayItems, layer)}
        </div>
      </div>
    );
  };

  // Classic Style
  if (headerStyle === 'classic') {
    const visibleCount = visibleRootCount ?? rootItems.length;
    const visibleRootItems = rootItems.slice(0, visibleCount);
    const overflowRootItems = rootItems.slice(visibleCount);
    const moreKey = '__more__';

    return (
      <header className={cn(classicPositionClass)} style={{ ...classicBackgroundStyle, ...classicSeparatorStyle }}>
        {topbarConfig.show !== false && (
          <div className="px-4 py-2 text-xs" style={{ backgroundColor: layerColors.topnav.bg, color: layerColors.topnav.text }}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-w-0">
              <div className="flex items-center gap-4">
                {showTopbarHotline && (
                  <a href={`tel:${topbarConfig.hotline}`} className="flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                    <Phone size={12} />
                    <span>{topbarConfig.hotline}</span>
                  </a>
                )}
                {showTopbarEmail && (
                  <a href={`mailto:${topbarConfig.email}`} className="hidden sm:flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                    <Mail size={12} />
                    <span>{topbarConfig.email}</span>
                  </a>
                )}
              </div>
              {showTopbarSlogan && (
                <div className="flex-1 px-4 text-center truncate text-[11px] sm:text-xs">
                  {topbarSlogan}
                </div>
              )}
              <div className="flex items-center gap-3">
                {showTrackOrder && (
                  <>
                    <Link href={DEFAULT_LINKS.trackOrder} className="hover:underline hidden sm:inline" style={{ color: layerColors.topnav.text }}>Theo dõi đơn hàng</Link>
                  </>
                )}
                {showTrackOrder && showLogin && <span className="hidden sm:inline" style={{ color: layerColors.topnav.text }}>|</span>}
                {showUserMenu && renderUserMenu('text', '')}
                {showLoginLink && (
                  <Link href={DEFAULT_LINKS.login} className="hover:underline flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                    <User size={12} />
                    {config.login?.text ?? 'Đăng nhập'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
        {config.showBrandAccent && (
          <div className="h-0.5" style={{ backgroundColor: tokens.accentLine }} />
        )}
        <div
          style={{ backgroundColor: layerColors.navbar.bg, paddingTop: headerSpacingY, paddingBottom: headerSpacingY }}
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div ref={headerRowRef} className="flex items-center gap-4">
            {/* Logo */}
            <Link ref={brandBlockRef} href="/" className="flex items-center gap-3 flex-shrink-0">
              <div style={logoWrapStyle}>
                {logo ? (
                  <div style={logoInnerStyle}>
                    <Image mode="logo" src={logo} alt={displayName} width={logoSize} height={logoSize} className="h-auto w-auto" />
                  </div>
                ) : (
                  <div style={logoInnerStyle}></div>
                )}
              </div>
              {showBrandName && (
                <span className="font-semibold" style={{ color: layerColors.navbar.text }}>{displayName}</span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav ref={navRef} className="hidden lg:flex flex-1 min-w-0 items-center gap-1 whitespace-nowrap">
              {visibleRootItems.map((item) => (
                <div
                  key={item._id}
                  className="relative"
                  ref={(el) => { dropdownTriggerRefs.current[item._id] = el; }}
                  onMouseEnter={() => {
                    const isMegaMenu = isDeepMenuForItem(item._id);
                    const columnCount = Math.min(Math.max(item.children.length, 1), 5);
                    const desiredWidth = isMegaMenu ? getMegaMenuWidthValue(columnCount) : 240;
                    handleMenuEnterWithWidth(item._id, desiredWidth);
                  }}
                  onMouseLeave={handleMenuLeave}
                >
                  <Link
                    href={item.url}
                    target={item.openInNewTab ? '_blank' : undefined}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1",
                      hoveredItem === item._id
                        ? "text-[var(--menu-hover-text)]"
                        : "hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)]"
                    )}
                    style={{
                      ...(hoveredItem === item._id
                        ? { backgroundColor: tokens.navItemHoverBg, color: tokens.navItemHoverText }
                        : { color: layerColors.navbar.text }),
                      ...menuVars,
                    }}
                    title={item.label}
                  >
                    <span>{item.label}</span>
                    {item.children.length > 0 && (
                      <ChevronDown size={14} className={cn("transition-transform", hoveredItem === item._id && "rotate-180")} />
                    )}
                  </Link>

                  {item.children.length > 0 && hoveredItem === item._id && (
                    <div
                      className={cn(
                        'absolute top-full z-50',
                        getDropdownPositionClass(dropdownAlign[item._id] ?? 'center'),
                        isDeepMenuForItem(item._id) ? 'pt-3' : 'pt-2'
                      )}
                    >
                      {isDeepMenuForItem(item._id) ? (
                        <div
                          className={cn(r.popup, 'border p-5 shadow-xl', getMegaMenuWidthClass(Math.min(Math.max(item.children.length, 1), 5)))}
                          style={{
                            backgroundColor: tokens.dropdownBg,
                            borderColor: tokens.dropdownBorder,
                            maxWidth: getViewportSafeMaxWidth(),
                          }}
                        >
                          <div className={cn('grid gap-6', getMegaMenuGridClass(Math.min(Math.max(item.children.length, 1), 5)))}>
                            {item.children.map((child) => (
                              <div key={child._id} className="space-y-3">
                                <Link
                                  href={child.url}
                                  target={child.openInNewTab ? '_blank' : undefined}
                                  className="block text-sm font-semibold whitespace-normal break-words leading-snug"
                                  style={{ color: level1Color }}
                                >
                                  {child.label}
                                </Link>
                                <div className="space-y-1">
                                  {child.children.length > 0 && child.children.map((sub) => {
                                    const isLevel3Active = activeLevel3Id === sub._id;

                                    if (config.flatSubMenus && sub.children.length > 0) {
                                      return (
                                        <div key={sub._id} className="mt-4 mb-2 first:mt-0">
                                          <div
                                            className="mb-1.5 font-bold uppercase tracking-wider text-[11px] border-l-2 pl-2"
                                            style={{ color: tokens.brandBadgeBg || tokens.textPrimary, borderColor: tokens.brandBadgeBg || tokens.borderStrong }}
                                          >
                                            {sub.label}
                                          </div>
                                          <div className="space-y-0.5 pl-2 max-h-[220px] overflow-y-auto scrollbar-menu-thin">
                                            {sub.children.map(leaf => (
                                              <Link
                                                key={leaf._id}
                                                href={leaf.url}
                                                target={leaf.openInNewTab ? '_blank' : undefined}
                                                className={cn('block py-1.5 text-[13px] transition-colors hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
                                                style={{ color: tokens.textSubtle, ...menuVars }}
                                              >
                                                {leaf.label}
                                              </Link>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={sub._id}
                                        className="relative"
                                        onMouseEnter={() => {
                                          clearDeepMenuCloseIntent();
                                          setActiveLevel3Id(sub._id);
                                        }}
                                        onMouseLeave={() => {
                                          if (activeLevel4Id !== sub._id) {
                                            setActiveLevel3Id(prev => (prev === sub._id ? null : prev));
                                          }
                                          scheduleDeepMenuClose();
                                        }}
                                      >
                                        <Link
                                          href={sub.url}
                                          target={sub.openInNewTab ? '_blank' : undefined}
                                          rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                          className={cn('flex min-w-0 items-start justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
                                          style={{
                                            ...(isLevel3Active ? { backgroundColor: tokens.dropdownItemHoverBg, color: tokens.dropdownItemHoverText } : { color: tokens.dropdownItemText }),
                                            ...menuVars,
                                          }}
                                        >
                                          <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{sub.label}</span>
                                          {sub.children.length > 0 && <ChevronRight size={10} className={cn('transition-transform duration-200', isLevel3Active && 'rotate-90')} />}
                                        </Link>
                                        {sub.children.length > 0 && isLevel3Active && (
                                          <div
                                            className="absolute left-full top-0 ml-1 z-50"
                                            onMouseEnter={clearDeepMenuCloseIntent}
                                            onMouseLeave={scheduleDeepMenuClose}
                                          >
                                            <div
                                              className={cn(
                                                r.dropdown,
                                                'border py-2 min-w-[220px] max-w-[min(300px,calc(100vw-2rem))] shadow-xl',
                                                !sub.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
                                              )}
                                              style={{
                                                backgroundColor: tokens.dropdownBg,
                                                borderColor: tokens.dropdownBorder,
                                                maxHeight: !sub.children.some((child) => child.children && child.children.length > 0) ? 'min(60vh, 290px)' : undefined,
                                              }}
                                            >
                                              {renderDesktopFlyoutNodes(sub.children, true)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "rounded-lg border py-2 min-w-[200px]",
                            !item.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
                          )}
                          style={{
                            backgroundColor: tokens.dropdownBg,
                            borderColor: tokens.dropdownBorder,
                            maxWidth: getViewportSafeMaxWidth(),
                            maxHeight: !item.children.some((child) => child.children && child.children.length > 0) ? 'min(70vh, 290px)' : undefined,
                          }}
                        >
                          {item.children.map((child) => (
                            <div
                              key={child._id}
                              className="relative group/child"
                              onMouseEnter={(event) => {
                                updateFlyoutDirection(`flyout-child-${child._id}`, event.currentTarget);
                              }}
                            >
                              <Link
                                href={child.url}
                                target={child.openInNewTab ? '_blank' : undefined}
                                rel={child.openInNewTab ? 'noreferrer' : undefined}
                                className="flex min-w-0 items-start justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                                style={{ color: tokens.dropdownItemText, ...menuVars }}
                              >
                                <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{child.label}</span>
                                {child.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/child:rotate-90" />}
                              </Link>
                              {child.children.length > 0 && (
                                <div
                                  className={cn(
                                    'absolute top-0 hidden group-hover/child:block',
                                    (flyoutDirection[`flyout-child-${child._id}`] ?? 'right') === 'left' ? 'right-full mr-1' : 'left-full ml-1'
                                  )}
                                >
                                  <div
                                    className="rounded-lg border py-2 min-w-[180px] overflow-y-auto scrollbar-menu-thin"
                                    style={{ 
                                      backgroundColor: tokens.dropdownBg, 
                                      borderColor: tokens.dropdownBorder,
                                      maxHeight: 'min(70vh, 290px)',
                                    }}
                                  >
                                    {child.children.map((sub) => (
                                    <Link
                                        key={sub._id}
                                        href={sub.url}
                                        target={sub.openInNewTab ? '_blank' : undefined}
                                        rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                      className="block px-4 py-2 text-sm whitespace-normal break-words leading-snug transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-sub-hover-text)]"
                                        style={{ color: tokens.dropdownSubItemText, ...menuVars }}
                                      >
                                        {sub.label}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {overflowRootItems.length > 0 && (
                <div
                  className="relative"
                  ref={(el) => { dropdownTriggerRefs.current[moreKey] = el; }}
                  onMouseEnter={() => {
                    handleMenuEnterWithWidth(moreKey, 240);
                  }}
                  onMouseLeave={handleMenuLeave}
                >
                  <button
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1",
                      hoveredItem === moreKey
                        ? "text-[var(--menu-hover-text)]"
                        : "hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)]"
                    )}
                    style={{
                      ...(hoveredItem === moreKey
                        ? { backgroundColor: tokens.navItemHoverBg, color: tokens.navItemHoverText }
                        : { color: layerColors.navbar.text }),
                      ...menuVars,
                    }}
                  >
                    Thêm
                    <ChevronDown size={14} className={cn("transition-transform", hoveredItem === moreKey && "rotate-180")} />
                  </button>

                  {hoveredItem === moreKey && (
                    <div
                      className={cn(
                        'absolute top-full pt-2 z-50',
                        getDropdownPositionClass(dropdownAlign[moreKey] ?? 'left')
                      )}
                    >
                      <div
                        className="rounded-lg border py-2 min-w-[240px]"
                        style={{
                          backgroundColor: tokens.dropdownBg,
                          borderColor: tokens.dropdownBorder,
                          maxWidth: getViewportSafeMaxWidth(),
                        }}
                      >
                        {overflowRootItems.map((root) => (
                          <div key={root._id} className="px-3 py-2">
                            <Link
                              href={root.url}
                              target={root.openInNewTab ? '_blank' : undefined}
                              className="flex items-center justify-between text-sm font-semibold transition-colors hover:text-[var(--menu-dropdown-hover-text)]"
                              style={{ color: tokens.dropdownItemText, ...menuVars }}
                            >
                              {root.label}
                              {root.children.length > 0 && <ChevronRight size={10} className="rotate-90" />}
                            </Link>

                            {root.children.length > 0 && (
                              <div className="mt-2 space-y-2 border-l pl-3" style={{ borderColor: tokens.border }}>
                                {root.children.map((child) => (
                                  <div key={child._id} className="space-y-1">
                                    <Link
                                      href={child.url}
                                      target={child.openInNewTab ? '_blank' : undefined}
                                      className="block text-sm transition-colors hover:text-[var(--menu-dropdown-hover-text)]"
                                      style={{ color: tokens.dropdownItemText, ...menuVars }}
                                    >
                                      {child.label}
                                    </Link>
                                    {child.children?.length > 0 && (
                                      <div className="space-y-1 pl-3">
                                        {child.children.map((sub) => (
                                          <Link
                                            key={sub._id}
                                            href={sub.url}
                                            target={sub.openInNewTab ? '_blank' : undefined}
                                            className="block text-sm transition-colors hover:text-[var(--menu-dropdown-sub-hover-text)]"
                                            style={{ color: tokens.dropdownSubItemText, ...menuVars }}
                                          >
                                            {sub.label}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>

            <div className="absolute opacity-0 pointer-events-none -z-10 h-0 overflow-hidden" aria-hidden>
              <div ref={measureContainerRef} className="flex items-center gap-1">
                {rootItems.map((item, index) => (
                  <div
                    key={`${item._id}-measure`}
                    ref={(el) => { measureItemRefs.current[index] = el; }}
                    className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-1"
                  >
                    <span>{item.label}</span>
                    {item.children.length > 0 && <ChevronDown size={14} />}
                  </div>
                ))}
                <div ref={moreMeasureRef} className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-1">
                  Thêm <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div ref={actionsRef} className="flex items-center gap-3 flex-shrink-0">
              {showSearch && (
                <div className="hidden lg:block">
                  <HeaderSearchAutocomplete
                    placeholder={config.search?.placeholder}
                    searchProducts={canSearchProducts}
                    searchPosts={canSearchPosts}
                    searchServices={canSearchServices}
                    searchCourses={canSearchCourses}
                    searchResources={canSearchResources}
                    tokens={tokens}
                    className="w-48"
                    inputClassName="w-full pl-4 pr-10 py-2 rounded-full border text-sm focus:outline-none"
                    inputStyle={{
                      backgroundColor: tokens.searchInputBg,
                      borderColor: tokens.searchInputBorder,
                      color: tokens.searchInputText,
                    }}
                    buttonClassName="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full"
                  />
                </div>
              )}
              {config.showDarkModeToggle && (
                <DarkModeToggle tokens={navbarActionTokens} />
              )}
              {showCart && (
                <CartIcon variant="mobile" className="hidden lg:flex" tokens={navbarActionTokens} />
              )}
              {config.cta?.show && (
                <Link
                  href={ctaHref}
                  className="hidden lg:inline-flex px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
                >
                  {config.cta.text ?? 'Liên hệ'}
                </Link>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:hidden">
              {showSearch && (
                <button
                  onClick={() => { setSearchOpen((prev) => !prev); }}
                  className="p-2"
                  style={{ color: layerColors.navbar.text }}
                >
                  <Search size={20} />
                </button>
              )}
              {config.showDarkModeToggle && (
                <DarkModeToggle tokens={navbarActionTokens} variant="mobile" />
              )}
              {showCart && (
                <CartIcon variant="mobile" tokens={navbarActionTokens} />
              )}
              {renderMobileMenuButton(false)}
            </div>
            </div>
          </div>
        </div>

        {showSearch && searchOpen && (
          <div className="lg:hidden px-4 pb-4 border-b" style={{ borderColor: tokens.border }}>
            <HeaderSearchAutocomplete
              placeholder={config.search?.placeholder}
              searchProducts={canSearchProducts}
              searchPosts={canSearchPosts}
              searchServices={canSearchServices}
              searchCourses={canSearchCourses}
              searchResources={canSearchResources}
              tokens={tokens}
              showButton={true}
              className="w-full"
              inputClassName="w-full pl-4 pr-10 py-2 rounded-full border text-sm focus:outline-none"
              buttonClassName="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full"
              inputStyle={{
                backgroundColor: tokens.searchInputBg,
                borderColor: tokens.searchInputBorder,
                color: tokens.searchInputText,
              }}
            />
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }}>
            {renderMobileMenuContent(false)}
            {config.cta?.show && (
              <div className="p-4 border-t" style={{ borderColor: tokens.border }}>
              <Link 
                  href={ctaHref} 
                  onClick={() =>{  setMobileMenuOpen(false); setMenuStack([]); }}
                  className="block w-full py-2.5 text-sm font-medium rounded-lg text-center" 
                  style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
                >
                  {config.cta.text ?? 'Liên hệ'}
                </Link>
              </div>
            )}
          </div>
        )}
        {classicSeparatorElement}
      </header>
    );
  }

  // Topbar Style
  if (headerStyle === 'topbar') {
    return (
      <header className={cn(classicPositionClass)} style={{ backgroundColor: layerColors.navbar.bg }}>
        {/* Topbar */}
        {topbarConfig.show !== false && (
          <div className="px-4 py-2 text-xs" style={{ backgroundColor: layerColors.topnav.bg, color: layerColors.topnav.text }}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-w-0">
              <div className="flex items-center gap-4">
                {showTopbarHotline && (
                  <a href={`tel:${topbarConfig.hotline}`} className="flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                    <Phone size={12} />
                    <span>{topbarConfig.hotline}</span>
                  </a>
                )}
                {showTopbarEmail && (
                  <a href={`mailto:${topbarConfig.email}`} className="hidden sm:flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                    <Mail size={12} />
                    <span>{topbarConfig.email}</span>
                  </a>
                )}
              </div>
              {showTopbarSlogan && (
                <div className="flex-1 px-4 text-center truncate text-[11px] sm:text-xs">
                  {topbarSlogan}
                </div>
              )}
              <div className="flex items-center gap-3">
                {showTrackOrder && (
                  <>
                    <Link href={DEFAULT_LINKS.trackOrder} className="hover:underline hidden sm:inline" style={{ color: layerColors.topnav.text }}>Theo dõi đơn hàng</Link>
                  </>
                )}
                {showTrackOrder && showLogin && <span className="hidden sm:inline" style={{ color: layerColors.topnav.text }}>|</span>}
                {showUserMenu && renderUserMenu('text', '')}
                {showLoginLink && (
                  <Link href={DEFAULT_LINKS.login} className="hover:underline flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                    <User size={12} />
                    {config.login?.text ?? 'Đăng nhập'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Header */}
        <div
          className="px-4 border-b"
          style={{ borderColor: tokens.border, backgroundColor: layerColors.navbar.bg, paddingTop: headerSpacingY, paddingBottom: headerSpacingY }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div style={logoWrapStyle}>
                {logo ? (
                  <div style={logoInnerStyle}>
                    <Image mode="logo" src={logo} alt={displayName} width={logoSize} height={logoSize} className="h-auto w-auto" />
                  </div>
                ) : (
                  <div style={logoInnerStyle} className="font-bold">
                    {displayName.charAt(0)}
                  </div>
                )}
              </div>
              {showBrandName && (
                <span className="font-bold text-lg" style={{ color: layerColors.navbar.text }}>{displayName}</span>
              )}
            </Link>

            {/* Search Bar */}
            {showSearch && (
              <div className="hidden md:block flex-1 max-w-md">
                <HeaderSearchAutocomplete
                  placeholder={config.search?.placeholder}
                  searchProducts={canSearchProducts}
                  searchPosts={canSearchPosts}
                  searchServices={canSearchServices}
                  searchCourses={canSearchCourses}
                  searchResources={canSearchResources}
                  tokens={tokens}
                  className="w-full"
                  inputClassName="w-full pl-4 pr-10 py-2 rounded-full border text-sm focus:outline-none"
                  inputStyle={{
                    backgroundColor: tokens.searchInputBg,
                    borderColor: tokens.searchInputBorder,
                    color: tokens.searchInputText,
                  }}
                  buttonClassName="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile: Search + Cart */}
              <div className="flex lg:hidden items-center gap-2">
                {showSearch && (
                  <button
                    onClick={() => { setSearchOpen((prev) => !prev); }}
                    className="p-2"
                    style={{ color: layerColors.navbar.text }}
                  >
                    <Search size={20} />
                  </button>
                )}
                {config.showDarkModeToggle && (
                  <DarkModeToggle tokens={navbarActionTokens} variant="mobile" />
                )}
                {showCart && (
                  <CartIcon variant="mobile" tokens={navbarActionTokens} />
                )}
                {renderMobileMenuButton(false)}
              </div>

              {/* Desktop: Wishlist + Cart */}
              <div className="hidden lg:flex items-center gap-2">
                {showWishlist && (
                  <Link
                    href={DEFAULT_LINKS.wishlist}
                    className="p-2 transition-colors flex flex-col items-center text-xs gap-0.5 hover:text-[var(--menu-icon-hover)]"
                    style={{ color: tokens.iconButtonText, ...menuVars }}
                  >
                    <Heart size={20} />
                    <span>Yêu thích</span>
                  </Link>
                )}
                {config.showDarkModeToggle && (
                  <DarkModeToggle tokens={navbarActionTokens} />
                )}
                {showCart && (
                  <CartIcon tokens={navbarActionTokens} />
                )}
                {config.cta?.show && (
                  <Link
                    href={ctaHref}
                    className="hidden lg:inline-flex px-4 py-2 text-sm font-medium rounded-full transition-colors"
                    style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
                  >
                    {config.cta.text ?? 'Liên hệ'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {showSearch && searchOpen && (
          <div className="lg:hidden px-4 pb-4 border-b" style={{ borderColor: tokens.border }}>
            <HeaderSearchAutocomplete
              placeholder={config.search?.placeholder}
              searchProducts={canSearchProducts}
              searchPosts={canSearchPosts}
              searchServices={canSearchServices}
              searchCourses={canSearchCourses}
              searchResources={canSearchResources}
              tokens={tokens}
              showButton={true}
              className="w-full"
              inputClassName="w-full pl-4 pr-10 py-2 rounded-full border text-sm focus:outline-none"
              buttonClassName="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full"
              inputStyle={{
                backgroundColor: tokens.searchInputBg,
                borderColor: tokens.searchInputBorder,
                color: tokens.searchInputText,
              }}
            />
          </div>
        )}

        {/* Navigation Bar */}
        <div className="hidden lg:block px-4 py-2 border-b" style={{ backgroundColor: layerColors.menu.bg, borderColor: layerColors.menu.border }}>
          <nav className="max-w-7xl mx-auto flex items-center gap-1">
            {menuTree.map((item) => (
              <div
                key={item._id}
                className="relative"
                ref={(el) => { dropdownTriggerRefs.current[item._id] = el; }}
                onMouseEnter={() => {
                  const isMegaMenu = isDeepMenuForItem(item._id);
                  const columnCount = Math.min(Math.max(item.children.length, 1), 5);
                  const desiredWidth = isMegaMenu ? getMegaMenuWidthValue(columnCount) : 240;
                  handleMenuEnterWithWidth(item._id, desiredWidth);
                }}
                onMouseLeave={handleMenuLeave}
              >
                <Link
                  href={item.url}
                  target={item.openInNewTab ? '_blank' : undefined}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1",
                    hoveredItem === item._id
                      ? "text-[var(--menu-hover-text)]"
                      : "hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)]"
                  )}
                  style={{
                    ...(hoveredItem === item._id
                      ? { backgroundColor: tokens.navItemHoverBg, color: tokens.navItemHoverText }
                      : { color: layerColors.menu.text }),
                    ...menuVars,
                  }}
                >
                  {item.label}
                  {item.children.length > 0 && <ChevronDown size={14} />}
                </Link>

                {item.children.length > 0 && hoveredItem === item._id && (
                  <div
                    className={cn(
                      'absolute top-full z-50',
                      getDropdownPositionClass(dropdownAlign[item._id] ?? 'center'),
                      isDeepMenuForItem(item._id) ? 'pt-3' : 'pt-2'
                    )}
                  >
                    {isDeepMenuForItem(item._id) ? (
                      <div
                        className={cn(r.popup, 'border p-5 shadow-xl', getMegaMenuWidthClass(Math.min(Math.max(item.children.length, 1), 5)))}
                        style={{
                          backgroundColor: tokens.dropdownBg,
                          borderColor: tokens.dropdownBorder,
                          maxWidth: getViewportSafeMaxWidth(),
                        }}
                      >
                        <div className={cn('grid gap-6', getMegaMenuGridClass(Math.min(Math.max(item.children.length, 1), 5)))}>
                          {item.children.map((child) => (
                            <div key={child._id} className="space-y-3">
                              <Link
                                href={child.url}
                                target={child.openInNewTab ? '_blank' : undefined}
                                className="block text-sm font-semibold"
                                style={{ color: level1Color }}
                              >
                                {child.label}
                              </Link>
                              <div className="space-y-1">
                                {child.children.length > 0 && child.children.map((sub) => {
                                  const isLevel3Active = activeLevel3Id === sub._id;

                                  if (config.flatSubMenus && sub.children.length > 0) {
                                    return (
                                      <div key={sub._id} className="mt-4 mb-2 first:mt-0">
                                        <div
                                          className="mb-1.5 font-bold uppercase tracking-wider text-[11px] border-l-2 pl-2"
                                          style={{ color: tokens.brandBadgeBg || tokens.textPrimary, borderColor: tokens.brandBadgeBg || tokens.borderStrong }}
                                        >
                                          {sub.label}
                                        </div>
                                        <div className="space-y-0.5 pl-2 max-h-[220px] overflow-y-auto scrollbar-menu-thin">
                                          {sub.children.map(leaf => (
                                            <Link
                                              key={leaf._id}
                                              href={leaf.url}
                                              target={leaf.openInNewTab ? '_blank' : undefined}
                                              className={cn('block py-1.5 text-[13px] transition-colors hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
                                              style={{ color: tokens.textSubtle, ...menuVars }}
                                            >
                                              {leaf.label}
                                            </Link>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={sub._id}
                                      className="relative"
                                      onMouseEnter={() => {
                                        clearDeepMenuCloseIntent();
                                        setActiveLevel3Id(sub._id);
                                      }}
                                      onMouseLeave={() => {
                                        if (activeLevel4Id !== sub._id) {
                                          setActiveLevel3Id(prev => (prev === sub._id ? null : prev));
                                        }
                                        scheduleDeepMenuClose();
                                      }}
                                    >
                                      <Link
                                        href={sub.url}
                                        target={sub.openInNewTab ? '_blank' : undefined}
                                        rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                        className={cn('flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
                                        style={{
                                          ...(isLevel3Active ? { backgroundColor: tokens.dropdownItemHoverBg, color: tokens.dropdownItemHoverText } : { color: tokens.dropdownItemText }),
                                          ...menuVars,
                                        }}
                                      >
                                        <span>{sub.label}</span>
                                        {sub.children.length > 0 && <ChevronRight size={10} className={cn('transition-transform duration-200', isLevel3Active && 'rotate-90')} />}
                                      </Link>
                                      {sub.children.length > 0 && isLevel3Active && (
                                        <div
                                          className="absolute left-full top-0 ml-1 z-50"
                                          onMouseEnter={clearDeepMenuCloseIntent}
                                          onMouseLeave={scheduleDeepMenuClose}
                                        >
                                          <div 
                                             className={cn(
                                               r.dropdown,
                                               'border py-2 min-w-[220px] max-w-[min(320px,calc(100vw-2rem))] shadow-lg',
                                               !sub.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
                                             )} 
                                             style={{ 
                                               backgroundColor: tokens.dropdownBg, 
                                               borderColor: tokens.dropdownBorder, 
                                               maxHeight: !sub.children.some((child) => child.children && child.children.length > 0) ? 'min(70vh, 290px)' : undefined 
                                             }}
                                           >
                                            {renderDesktopFlyoutNodes(sub.children, true)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "rounded-lg border py-2 min-w-[200px]",
                          !item.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
                        )}
                        style={{
                          backgroundColor: tokens.dropdownBg,
                          borderColor: tokens.dropdownBorder,
                          maxWidth: getViewportSafeMaxWidth(),
                          maxHeight: !item.children.some((child) => child.children && child.children.length > 0) ? 'min(70vh, 290px)' : undefined,
                        }}
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child._id}
                            href={child.url}
                            target={child.openInNewTab ? '_blank' : undefined}
                            rel={child.openInNewTab ? 'noreferrer' : undefined}
                            className="block px-4 py-2.5 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                            style={{ color: tokens.dropdownItemText, ...menuVars }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }}>
            {renderMobileMenuContent(false)}
            {config.cta?.show && (
              <div className="p-4 border-t" style={{ borderColor: tokens.border }}>
                <Link
                  href={ctaHref}
                  onClick={() =>{  setMobileMenuOpen(false); setMenuStack([]); }}
                  className="block w-full py-2.5 text-sm font-medium rounded-lg text-center"
                  style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
                >
                  {config.cta.text ?? 'Liên hệ'}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
    );
  }

  // Dark Glass Style
  if (headerStyle === 'darkglass') {
    const pillLogoSize = Math.min(64, logoSize);

    const renderDarkGlassNav = (textClassName: string) => (
      <nav className="hidden lg:flex items-center gap-6">
        {menuTree.map((item) => {
          const hasSubItems = item.children.some((child) => child.children.length > 0);
          const totalSubItems = item.children.reduce((acc, child) => acc + child.children.length, 0);
          const isMega = item.children.length >= 3 || totalSubItems > 6;
          const isMedium = !isMega && (item.children.length > 1 || hasSubItems);
          const dropdownWidthValue = isMega ? 720 : isMedium ? 420 : 240;

          return (
            <div
              key={item._id}
              className="relative"
              ref={(el) => { dropdownTriggerRefs.current[item._id] = el; }}
              onMouseEnter={() => {
                handleMenuEnterWithWidth(item._id, dropdownWidthValue);
              }}
              onMouseLeave={handleMenuLeave}
            >
              <Link
                href={item.url}
                target={item.openInNewTab ? '_blank' : undefined}
                className={cn('text-sm font-semibold uppercase tracking-wide transition-colors flex items-center gap-1', textClassName)}
                style={{
                  color: hoveredItem === item._id ? tokens.primary : '#ffffff',
                  ...menuVars
                }}
              >
                <span>{item.label}</span>
                {item.children.length > 0 && (
                  <ChevronDown size={14} className={cn("transition-transform duration-200 shrink-0", hoveredItem === item._id && "rotate-180")} />
                )}
              </Link>

              {item.children.length > 0 && hoveredItem === item._id && (
                <div
                  className={cn(
                    'absolute top-full pt-6 z-50',
                    getDropdownPositionClass(dropdownAlign[item._id] ?? 'center')
                  )}
                >
                  {isDeepMenuForItem(item._id) ? (
                    <div
                      className={cn(r.popup, 'border p-5 shadow-xl', getMegaMenuWidthClass(Math.min(Math.max(item.children.length, 1), 5)))}
                      style={{
                        backgroundColor: tokens.dropdownBg,
                        borderColor: tokens.dropdownBorder,
                        maxWidth: getViewportSafeMaxWidth(),
                      }}
                    >
                      <div className={cn('grid gap-6', getMegaMenuGridClass(Math.min(Math.max(item.children.length, 1), 5)))}>
                        {item.children.map((child) => (
                          <div key={child._id} className="space-y-3">
                            <Link
                              href={child.url}
                              target={child.openInNewTab ? '_blank' : undefined}
                              className="block text-sm font-semibold whitespace-normal break-words leading-snug"
                              style={{ color: level1Color }}
                            >
                              {child.label}
                            </Link>
                            <div className="space-y-1">
                              {child.children.length > 0 && child.children.map((sub) => {
                                const isLevel3Active = activeLevel3Id === sub._id;

                                if (config.flatSubMenus && sub.children.length > 0) {
                                  return (
                                    <div key={sub._id} className="mt-4 mb-2 first:mt-0">
                                      <div
                                        className="mb-1.5 font-bold uppercase tracking-wider text-[11px] border-l-2 pl-2"
                                        style={{ color: tokens.brandBadgeBg || tokens.textPrimary, borderColor: tokens.brandBadgeBg || tokens.borderStrong }}
                                      >
                                        {sub.label}
                                      </div>
                                      <div className="space-y-0.5 pl-2 max-h-[220px] overflow-y-auto scrollbar-menu-thin">
                                        {sub.children.map(leaf => (
                                          <Link
                                            key={leaf._id}
                                            href={leaf.url}
                                            target={leaf.openInNewTab ? '_blank' : undefined}
                                            className={cn('block py-1.5 text-[13px] transition-colors hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
                                            style={{ color: tokens.textSubtle, ...menuVars }}
                                          >
                                            {leaf.label}
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={sub._id}
                                    className="relative"
                                    onMouseEnter={() => {
                                      clearDeepMenuCloseIntent();
                                      setActiveLevel3Id(sub._id);
                                    }}
                                    onMouseLeave={() => {
                                      if (activeLevel4Id !== sub._id) {
                                        setActiveLevel3Id(prev => (prev === sub._id ? null : prev));
                                      }
                                      scheduleDeepMenuClose();
                                    }}
                                  >
                                    <Link
                                      href={sub.url}
                                      target={sub.openInNewTab ? '_blank' : undefined}
                                      rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                      className={cn('flex min-w-0 items-start justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
                                      style={{
                                        ...(isLevel3Active ? { backgroundColor: tokens.dropdownItemHoverBg, color: tokens.dropdownItemHoverText } : { color: tokens.dropdownItemText }),
                                        ...menuVars,
                                      }}
                                    >
                                      <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{sub.label}</span>
                                      {sub.children.length > 0 && <ChevronRight size={10} className={cn('transition-transform duration-200', isLevel3Active && 'rotate-90')} />}
                                    </Link>
                                    {sub.children.length > 0 && isLevel3Active && (
                                      <div
                                        className="absolute left-full top-0 ml-1 z-50"
                                        onMouseEnter={clearDeepMenuCloseIntent}
                                        onMouseLeave={scheduleDeepMenuClose}
                                      >
                                        <div
                                          className={cn(
                                            r.dropdown,
                                            'border py-2 min-w-[220px] max-w-[min(300px,calc(100vw-2rem))] shadow-xl',
                                            !sub.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
                                          )}
                                          style={{
                                            backgroundColor: tokens.dropdownBg,
                                            borderColor: tokens.dropdownBorder,
                                            maxHeight: !sub.children.some((child) => child.children && child.children.length > 0) ? 'min(60vh, 290px)' : undefined,
                                          }}
                                        >
                                          {renderDesktopFlyoutNodes(sub.children, true)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-lg border py-2 min-w-[200px]",
                        !item.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
                      )}
                      style={{
                        backgroundColor: tokens.dropdownBg,
                        borderColor: tokens.dropdownBorder,
                        maxWidth: getViewportSafeMaxWidth(),
                        maxHeight: !item.children.some((child) => child.children && child.children.length > 0) ? 'min(70vh, 290px)' : undefined,
                      }}
                    >
                      {item.children.map((child) => (
                        <div
                          key={child._id}
                          className="relative group/child"
                          onMouseEnter={(event) => {
                            updateFlyoutDirection(`flyout-child-${child._id}`, event.currentTarget);
                          }}
                        >
                          <Link
                            href={child.url}
                            target={child.openInNewTab ? '_blank' : undefined}
                            rel={child.openInNewTab ? 'noreferrer' : undefined}
                            className="flex min-w-0 items-start justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                            style={{ color: tokens.dropdownItemText, ...menuVars }}
                          >
                            <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{child.label}</span>
                            {child.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/child:rotate-90" />}
                          </Link>
                          {child.children.length > 0 && (
                            <div
                              className={cn(
                                'absolute top-0 hidden group-hover/child:block',
                                (flyoutDirection[`flyout-child-${child._id}`] ?? 'right') === 'left' ? 'right-full mr-1' : 'left-full ml-1'
                              )}
                            >
                              <div
                                className="rounded-lg border py-2 min-w-[180px] overflow-y-auto scrollbar-menu-thin"
                                style={{ 
                                  backgroundColor: tokens.dropdownBg, 
                                  borderColor: tokens.dropdownBorder,
                                  maxHeight: 'min(70vh, 290px)',
                                }}
                              >
                                {child.children.map((sub) => (
                                  <Link
                                    key={sub._id}
                                    href={sub.url}
                                    target={sub.openInNewTab ? '_blank' : undefined}
                                    rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                    className="block px-4 py-2 text-sm whitespace-normal break-words leading-snug transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-sub-hover-text)]"
                                    style={{ color: tokens.dropdownSubItemText, ...menuVars }}
                                  >
                                    {sub.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );

    const renderDarkGlassLogo = (size: number) => {
      const desktopSize = size;
      const mobileSize = Math.min(36, size);
      
      const logoVars = {
        '--logo-wrap-w-desktop': `${hasBackgroundFrame ? desktopSize + 16 : desktopSize}px`,
        '--logo-wrap-w-mobile': `${hasBackgroundFrame ? mobileSize + 16 : mobileSize}px`,
        '--logo-wrap-h-desktop': logo ? 'auto' : `${hasBackgroundFrame ? desktopSize + 16 : desktopSize}px`,
        '--logo-wrap-h-mobile': logo ? 'auto' : `${hasBackgroundFrame ? mobileSize + 16 : mobileSize}px`,
        '--logo-inner-w-desktop': `${desktopSize}px`,
        '--logo-inner-w-mobile': `${mobileSize}px`,
        '--logo-inner-h-desktop': logo ? 'auto' : `${desktopSize}px`,
        '--logo-inner-h-mobile': logo ? 'auto' : `${mobileSize}px`,
      } as React.CSSProperties;

      return (
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div 
            style={{ 
              ...logoWrapStyle, 
              ...logoVars, 
              width: undefined, 
              height: undefined 
            }}
            className="w-[var(--logo-wrap-w-mobile)] lg:w-[var(--logo-wrap-w-desktop)] h-[var(--logo-wrap-h-mobile)] lg:h-[var(--logo-wrap-h-desktop)] flex items-center justify-center"
          >
            {logo ? (
              <div 
                style={{ 
                  ...logoInnerStyle, 
                  width: undefined, 
                  height: undefined 
                }}
                className="w-[var(--logo-inner-w-mobile)] lg:w-[var(--logo-inner-w-desktop)] h-auto flex items-center justify-center"
              >
                <img src={logo} alt={displayName} className="h-full w-full object-contain" />
              </div>
            ) : (
              <div 
                style={{ 
                  ...logoInnerStyle, 
                  width: undefined, 
                  height: undefined,
                  backgroundColor: 'rgba(255,255,255,0.15)', 
                  color: '#ffffff' 
                }}
                className="w-[var(--logo-inner-w-mobile)] lg:w-[var(--logo-inner-w-desktop)] h-[var(--logo-inner-h-mobile)] lg:h-[var(--logo-inner-h-desktop)] flex items-center justify-center"
              >
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          {showBrandName && (
            <span className="font-semibold text-white text-sm lg:text-base">{displayName}</span>
          )}
        </Link>
      );
    };

    const renderDarkGlassRightActions = (_isSticky = false) => (
      <div className="flex items-center justify-end gap-3 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-3">
          {/* Search */}
          {showSearch && (
            <div className="flex items-center gap-2">
              <div className={cn('transition-all duration-200', searchOpen ? 'w-48 opacity-100' : 'w-0 opacity-0 pointer-events-none')}>
                <HeaderSearchAutocomplete
                  placeholder={config.search?.placeholder}
                  searchProducts={canSearchProducts}
                  searchPosts={canSearchPosts}
                  searchServices={canSearchServices}
                  searchCourses={canSearchCourses}
                  searchResources={canSearchResources}
                  tokens={tokens}
                  showButton={false}
                  autoFocus={searchOpen}
                  className={cn('w-48 transition-opacity', searchOpen ? 'opacity-100' : 'opacity-0')}
                  inputClassName={cn('w-48 px-3 py-2 rounded-full border text-sm focus:outline-none transition-opacity bg-white/10 text-white border-white/20')}
                  inputStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                  }}
                />
              </div>
              <button
                onClick={() => { setSearchOpen((prev) => !prev); }}
                className="p-2 text-white hover:opacity-80 transition-opacity"
              >
                <Search size={18} />
              </button>
            </div>
          )}

          {/* User Menu / Login */}
          {showUserMenu && renderUserMenu('icon')}
          {showLoginLink && (
            <Link
              href={DEFAULT_LINKS.login}
              className="p-2 text-white hover:opacity-80 transition-opacity"
            >
              <User size={18} />
            </Link>
          )}

          {/* Wishlist */}
          {showWishlist && (
            <Link
              href={DEFAULT_LINKS.wishlist}
              className="p-2 text-white hover:opacity-80 transition-opacity"
            >
              <Heart size={18} />
            </Link>
          )}

          {/* Dark Mode */}
          {config.showDarkModeToggle && (
            <DarkModeToggle tokens={{ ...navbarActionTokens, iconButtonText: '#ffffff' }} />
          )}

          {/* Cart */}
          {showCart && (
            <CartIcon variant="mobile" tokens={{ ...navbarActionTokens, iconButtonText: '#ffffff' }} />
          )}

          {/* CTA Button */}
          {config.cta?.show && (
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-semibold uppercase tracking-widest transition-transform hover:scale-105"
              style={{ backgroundColor: tokens.primary, color: tokens.textInverse, padding: '8px 20px' }}
            >
              {config.cta.text ?? 'Liên hệ'}
            </Link>
          )}
        </div>

        {/* Mobile Menu Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          {showSearch && (
            <button
               onClick={() => { setSearchOpen((prev) => !prev); }}
               className="p-2 text-white"
            >
              <Search size={18} />
            </button>
          )}
          {config.showDarkModeToggle && (
            <DarkModeToggle tokens={{ ...navbarActionTokens, iconButtonText: '#ffffff' }} variant="mobile" />
          )}
          {showCart && (
            <CartIcon variant="mobile" tokens={{ ...navbarActionTokens, iconButtonText: '#ffffff' }} />
          )}
          {renderMobileMenuButton(true, tokens.surface)}
        </div>
      </div>
    );

    return (
      <>
        {/* Top Header */}
        <header
          className={cn(
            pathname === '/' ? "absolute top-0 left-0 w-full" : "relative w-full",
            "z-40 transition-opacity duration-300",
            isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between gap-4 w-full px-4 sm:px-6 border-b transition-all duration-300",
              pathname === '/'
                ? "bg-black/20 backdrop-blur-md border-white/5"
                : "bg-zinc-950 border-zinc-900"
            )}
            style={{
              paddingTop: Math.min(10, headerSpacingY),
              paddingBottom: Math.min(10, headerSpacingY),
            }}
          >
            {renderDarkGlassLogo(logoSize)}
            {renderDarkGlassNav("text-white")}
            {renderDarkGlassRightActions(false)}
          </div>
        </header>

        {/* Sticky Header (Fixed Pill) */}
        <header
          className={cn(
            "fixed top-4 left-1/2 -translate-x-1/2 w-[96%] z-50 transition-all duration-500 ease-in-out",
            isScrolled ? "translate-y-0 opacity-100" : "-translate-y-[150%] opacity-0 pointer-events-none"
          )}
        >
          <div className="flex items-center justify-between gap-4 w-full h-[60px] sm:h-[70px] lg:h-[88px] px-4 sm:px-6 lg:px-8 bg-black/60 backdrop-blur-lg rounded-full shadow-2xl shadow-black/40 border border-white/10">
            {renderDarkGlassLogo(pillLogoSize)}
            {renderDarkGlassNav("text-white")}
            {renderDarkGlassRightActions(true)}
          </div>
        </header>

        {/* Mobile Menu Autocomplete Search */}
        {showSearch && searchOpen && (
          <div className="fixed top-[120px] left-0 w-full z-50 lg:hidden px-4 pb-4 bg-black/90 backdrop-blur-lg border-b border-white/10">
            <HeaderSearchAutocomplete
              placeholder={config.search?.placeholder}
              searchProducts={canSearchProducts}
              searchPosts={canSearchPosts}
              searchServices={canSearchServices}
              searchCourses={canSearchCourses}
              searchResources={canSearchResources}
              tokens={tokens}
              showButton={true}
              className="w-full mt-2"
              inputClassName="w-full pl-4 pr-10 py-2 rounded-full border border-white/20 text-sm focus:outline-none bg-white/10 text-white"
              buttonClassName="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white"
            />
          </div>
        )}

        {/* Mobile Menu Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/60 backdrop-blur-sm">
            <div className="w-4/5 max-w-[320px] h-full bg-black/95 backdrop-blur-md border-l border-white/10 shadow-2xl flex flex-col">
              {menuStack.length === 0 ? (
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  {renderDarkGlassLogo(40)}
                  <button
                    onClick={() => { setMobileMenuOpen(false); setMenuStack([]); }}
                    className="text-white p-1"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              <div className="flex-1 overflow-y-auto py-2">
                {renderMobileMenuContent(true)}
              </div>
              {config.cta?.show && (
                <div className="p-4 border-t border-white/10">
                  <Link
                    href={ctaHref}
                    onClick={() => { setMobileMenuOpen(false); setMenuStack([]); }}
                    className="block w-full py-2.5 text-sm font-semibold rounded-full text-center bg-white text-black hover:bg-gray-100 transition-colors"
                  >
                    {config.cta.text ?? 'Liên hệ'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Allbirds Style
  return (
    <header className={cn(classicPositionClass)} style={{ backgroundColor: layerColors.navbar.bg, ...classicSeparatorStyle }}>
        {topbarConfig.show !== false && (
          <div className="px-4 py-2 text-xs" style={{ backgroundColor: layerColors.topnav.bg, color: layerColors.topnav.text }}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-w-0">
              <div className="flex items-center gap-4">
                {showTopbarHotline && (
                  <a href={`tel:${topbarConfig.hotline}`} className="flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                    <Phone size={12} />
                    <span>{topbarConfig.hotline}</span>
                  </a>
                )}
                {showTopbarEmail && (
                  <a href={`mailto:${topbarConfig.email}`} className="hidden sm:flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                    <Mail size={12} />
                    <span>{topbarConfig.email}</span>
                  </a>
                )}
              </div>
              {showTopbarSlogan && (
                <div className="flex-1 px-4 text-center truncate text-[11px] sm:text-xs">
                  {topbarSlogan}
                </div>
              )}
              <div className="flex items-center gap-3">
                {showTrackOrder && (
                  <>
                    <Link href={DEFAULT_LINKS.trackOrder} className="hover:underline hidden sm:inline" style={{ color: layerColors.topnav.text }}>Theo dõi đơn hàng</Link>
                  </>
                )}
                {showTrackOrder && showLogin && <span className="hidden sm:inline" style={{ color: layerColors.topnav.text }}>|</span>}
                {showUserMenu && renderUserMenu('text', '')}
                {showLoginLink && (
                  <Link href={DEFAULT_LINKS.login} className="hover:underline flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                    <User size={12} />
                    {config.login?.text ?? 'Đăng nhập'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
        {config.showBrandAccent && (
          <div className="h-0.5" style={{ backgroundColor: tokens.accentLine }} />
        )}
        <div
          className="max-w-7xl mx-auto px-4 lg:px-6 border-b"
          style={{ borderColor: tokens.border, paddingTop: headerSpacingY, paddingBottom: headerSpacingY }}
        >
          <div className="flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div style={logoWrapStyle}>
                {logo ? (
                  <div style={logoInnerStyle}>
                    <Image mode="logo" src={logo} alt={displayName} width={logoSize} height={logoSize} className="h-auto w-auto" />
                  </div>
                ) : (
                  <div className="rounded-full" style={{ backgroundColor: tokens.allbirdsAccentDot, width: logoDotSize, height: logoDotSize }}></div>
                )}
              </div>
              {showBrandName && (
                <span className="text-base font-semibold" style={{ color: layerColors.navbar.text }}>
                  {displayName}
                </span>
              )}
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              {menuTree.map((item) => {
                const hasSubItems = item.children.some((child) => child.children.length > 0);
                const totalSubItems = item.children.reduce((acc, child) => acc + child.children.length, 0);
                const isMega = item.children.length >= 3 || totalSubItems > 6;
                const isMedium = !isMega && (item.children.length > 1 || hasSubItems);
                const dropdownWidthValue = isMega ? 720 : isMedium ? 420 : 240;

                return (
                  <div
                    key={item._id}
                    className="relative"
                    ref={(el) => { dropdownTriggerRefs.current[item._id] = el; }}
                    onMouseEnter={() => {
                      handleMenuEnterWithWidth(item._id, dropdownWidthValue);
                    }}
                    onMouseLeave={handleMenuLeave}
                  >
                    <Link
                      href={item.url}
                      target={item.openInNewTab ? '_blank' : undefined}
                      className={cn(
                        'text-sm font-medium transition-colors flex items-center gap-1',
                        hoveredItem === item._id
                          ? 'text-[var(--menu-hover-text)]'
                          : 'hover:text-[var(--menu-hover-text)]'
                      )}
                      style={{ color: layerColors.navbar.text, ...menuVars }}
                    >
                      <span>{item.label}</span>
                      {item.children.length > 0 && (
                        <ChevronDown size={14} className={cn("transition-transform duration-200 shrink-0", hoveredItem === item._id && "rotate-180")} />
                      )}
                    </Link>

                    {item.children.length > 0 && hoveredItem === item._id && (
                      <div
                        className={cn(
                          'absolute top-full z-50',
                          getDropdownPositionClass(dropdownAlign[item._id] ?? 'center'),
                          isDeepMenuForItem(item._id) ? 'pt-3' : 'pt-2'
                        )}
                      >
                        {isDeepMenuForItem(item._id) ? (
                          <div
                            className={cn(r.popup, 'border p-5 shadow-xl', getMegaMenuWidthClass(Math.min(Math.max(item.children.length, 1), 5)))}
                            style={{
                              backgroundColor: tokens.dropdownBg,
                              borderColor: tokens.dropdownBorder,
                              maxWidth: getViewportSafeMaxWidth(),
                            }}
                          >
                            <div className={cn('grid gap-6', getMegaMenuGridClass(Math.min(Math.max(item.children.length, 1), 5)))}>
                              {item.children.map((child) => (
                                <div key={child._id} className="space-y-3">
                                  <Link
                                    href={child.url}
                                    target={child.openInNewTab ? '_blank' : undefined}
                                    className="block text-sm font-semibold whitespace-normal break-words leading-snug"
                                    style={{ color: level1Color }}
                                  >
                                    {child.label}
                                  </Link>
                                  <div className="space-y-1">
                                    {child.children.length > 0 && child.children.map((sub) => {
                                      const isLevel3Active = activeLevel3Id === sub._id;

                                      if (config.flatSubMenus && sub.children.length > 0) {
                                        return (
                                          <div key={sub._id} className="mt-4 mb-2 first:mt-0">
                                            <div
                                              className="mb-1.5 font-bold uppercase tracking-wider text-[11px] border-l-2 pl-2"
                                              style={{ color: tokens.brandBadgeBg || tokens.textPrimary, borderColor: tokens.brandBadgeBg || tokens.borderStrong }}
                                            >
                                              {sub.label}
                                            </div>
                                            <div className="space-y-0.5 pl-2 max-h-[220px] overflow-y-auto scrollbar-menu-thin">
                                              {sub.children.map(leaf => (
                                                <Link
                                                  key={leaf._id}
                                                  href={leaf.url}
                                                  target={leaf.openInNewTab ? '_blank' : undefined}
                                                  className={cn('block py-1.5 text-[13px] transition-colors hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
                                                  style={{ color: tokens.textSubtle, ...menuVars }}
                                                >
                                                  {leaf.label}
                                                </Link>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div
                                          key={sub._id}
                                          className="relative"
                                          onMouseEnter={() => {
                                            clearDeepMenuCloseIntent();
                                            setActiveLevel3Id(sub._id);
                                          }}
                                          onMouseLeave={() => {
                                            if (activeLevel4Id !== sub._id) {
                                              setActiveLevel3Id(prev => (prev === sub._id ? null : prev));
                                            }
                                            scheduleDeepMenuClose();
                                          }}
                                        >
                                          <Link
                                            href={sub.url}
                                            target={sub.openInNewTab ? '_blank' : undefined}
                                            rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                            className={cn('flex min-w-0 items-start justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]', r.item)}
                                            style={{
                                              ...(isLevel3Active ? { backgroundColor: tokens.dropdownItemHoverBg, color: tokens.dropdownItemHoverText } : { color: tokens.dropdownItemText }),
                                              ...menuVars,
                                            }}
                                          >
                                            <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{sub.label}</span>
                                            {sub.children.length > 0 && <ChevronRight size={10} className={cn('transition-transform duration-200', isLevel3Active && 'rotate-90')} />}
                                          </Link>
                                          {sub.children.length > 0 && isLevel3Active && (
                                            <div
                                              className="absolute left-full top-0 ml-1 z-50"
                                              onMouseEnter={clearDeepMenuCloseIntent}
                                              onMouseLeave={scheduleDeepMenuClose}
                                            >
                                              <div
                                                className={cn(
                                                  r.dropdown,
                                                  'border py-2 min-w-[220px] max-w-[min(300px,calc(100vw-2rem))] shadow-xl',
                                                  !sub.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
                                                )}
                                                style={{
                                                  backgroundColor: tokens.dropdownBg,
                                                  borderColor: tokens.dropdownBorder,
                                                  maxHeight: !sub.children.some((child) => child.children && child.children.length > 0) ? 'min(60vh, 290px)' : undefined,
                                                }}
                                              >
                                                {renderDesktopFlyoutNodes(sub.children, true)}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "rounded-lg border py-2 min-w-[200px]",
                              !item.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
                            )}
                            style={{
                              backgroundColor: tokens.dropdownBg,
                              borderColor: tokens.dropdownBorder,
                              maxWidth: getViewportSafeMaxWidth(),
                              maxHeight: !item.children.some((child) => child.children && child.children.length > 0) ? 'min(70vh, 290px)' : undefined,
                            }}
                          >
                            {item.children.map((child) => (
                              <div
                                key={child._id}
                                className="relative group/child"
                                onMouseEnter={(event) => {
                                  updateFlyoutDirection(`flyout-child-${child._id}`, event.currentTarget);
                                }}
                              >
                                <Link
                                  href={child.url}
                                  target={child.openInNewTab ? '_blank' : undefined}
                                  rel={child.openInNewTab ? 'noreferrer' : undefined}
                                  className="flex min-w-0 items-start justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                                  style={{ color: tokens.dropdownItemText, ...menuVars }}
                                >
                                  <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{child.label}</span>
                                  {child.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/child:rotate-90" />}
                                </Link>
                                {child.children.length > 0 && (
                                  <div
                                    className={cn(
                                      'absolute top-0 hidden group-hover/child:block',
                                      (flyoutDirection[`flyout-child-${child._id}`] ?? 'right') === 'left' ? 'right-full mr-1' : 'left-full ml-1'
                                    )}
                                  >
                                    <div
                                      className="rounded-lg border py-2 min-w-[180px] overflow-y-auto scrollbar-menu-thin"
                                      style={{ 
                                        backgroundColor: tokens.dropdownBg, 
                                        borderColor: tokens.dropdownBorder,
                                        maxHeight: 'min(70vh, 290px)',
                                      }}
                                    >
                                      {child.children.map((sub) => (
                                      <Link
                                          key={sub._id}
                                          href={sub.url}
                                          target={sub.openInNewTab ? '_blank' : undefined}
                                          rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                        className="block px-4 py-2 text-sm whitespace-normal break-words leading-snug transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-sub-hover-text)]"
                                          style={{ color: tokens.dropdownSubItemText, ...menuVars }}
                                        >
                                          {sub.label}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-3">
                {config.cta?.show && (
                  <Link
                    href={ctaHref}
                    className="text-sm font-medium hover:text-[var(--menu-hover-text)]"
                    style={{ color: layerColors.navbar.text, ...menuVars }}
                  >
                    {config.cta.text ?? 'Liên hệ'}
                  </Link>
                )}
                {showSearch && (
                  <div className="flex items-center gap-2">
                    <div className={cn('transition-all duration-200', searchOpen ? 'w-48 opacity-100' : 'w-0 opacity-0 pointer-events-none')}>
                      <HeaderSearchAutocomplete
                        placeholder={config.search?.placeholder}
                        searchProducts={canSearchProducts}
                        searchPosts={canSearchPosts}
                        searchServices={canSearchServices}
                        searchCourses={canSearchCourses}
                        searchResources={canSearchResources}
                        tokens={tokens}
                        showButton={false}
                        autoFocus={searchOpen}
                        className={cn('w-48 transition-opacity', searchOpen ? 'opacity-100' : 'opacity-0')}
                        inputClassName={cn('w-48 px-3 py-2 rounded-full border text-sm focus:outline-none transition-opacity', searchOpen ? 'opacity-100' : 'opacity-0')}
                        inputStyle={{
                          backgroundColor: tokens.searchInputBg,
                          borderColor: tokens.searchInputBorder,
                          color: tokens.searchInputText,
                        }}
                      />
                    </div>
                    <button
                      onClick={() => { setSearchOpen((prev) => !prev); }}
                      className="p-2 transition-colors hover:text-[var(--menu-icon-hover)]"
                      style={{ color: layerColors.navbar.text, ...menuVars }}
                    >
                      <Search size={18} />
                    </button>
                  </div>
                )}
                {showUserMenu && renderUserMenu('icon')}
                {showLoginLink && (
                  <Link
                    href={DEFAULT_LINKS.login}
                    className="p-2 transition-colors hover:text-[var(--menu-icon-hover)]"
                    style={{ color: layerColors.navbar.text, ...menuVars }}
                  >
                    <User size={18} />
                  </Link>
                )}
                {config.showDarkModeToggle && (
                  <DarkModeToggle tokens={navbarActionTokens} />
                )}
                {showCart && (
                  <CartIcon variant="mobile" tokens={navbarActionTokens} />
                )}
              </div>
              <div className="flex items-center gap-1 lg:hidden">
                {showSearch && (
                  <button
                    onClick={() => { setSearchOpen((prev) => !prev); }}
                    className="p-2"
                    style={{ color: layerColors.navbar.text }}
                  >
                    <Search size={18} />
                  </button>
                )}
                {config.showDarkModeToggle && (
                  <DarkModeToggle tokens={navbarActionTokens} variant="mobile" />
                )}
                {showCart && (
                  <CartIcon variant="mobile" tokens={navbarActionTokens} />
                )}
                {renderMobileMenuButton(false)}
              </div>
            </div>
          </div>
        </div>

        {showSearch && searchOpen && (
          <div className="lg:hidden px-4 pb-4">
            <HeaderSearchAutocomplete
              placeholder={config.search?.placeholder}
              searchProducts={canSearchProducts}
              searchPosts={canSearchPosts}
              searchServices={canSearchServices}
              searchCourses={canSearchCourses}
              searchResources={canSearchResources}
              tokens={tokens}
              showButton={true}
              className="w-full"
              inputClassName="w-full pl-4 pr-10 py-2 rounded-full border text-sm focus:outline-none"
              buttonClassName="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full"
              inputStyle={{
                backgroundColor: tokens.searchInputBg,
                borderColor: tokens.searchInputBorder,
                color: tokens.searchInputText,
              }}
            />
          </div>
        )}

        {mobileMenuOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }}>
            {renderMobileMenuContent(false)}
            {config.cta?.show && (
              <div className="p-4 border-t" style={{ borderColor: tokens.border }}>
                <Link
                  href={ctaHref}
                  onClick={() => { setMobileMenuOpen(false); setMenuStack([]); }}
                  className="block w-full py-2.5 text-sm font-medium rounded-lg text-center"
                  style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
                >
                  {config.cta.text ?? 'Liên hệ'}
                </Link>
              </div>
            )}
          </div>
        )}
        {classicSeparatorElement}
    </header>
  );
}
