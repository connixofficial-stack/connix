'use client';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronDown, ChevronRight, Eye, Heart, LogOut, Mail, Package, Phone, Search, ShoppingCart, User, Moon } from 'lucide-react';
import { Card, CardContent, cn } from '@/app/admin/components/ui';
import { getMenuColors, resolveMenuLayerColors, type MenuColorMode, type MenuColors, type MenuLayerColorConfig } from '@/components/site/header/colors';
import { buildMenuTree, type MenuTreeNode } from '@/lib/utils/menu-tree';

export type HeaderLayoutStyle = 'classic' | 'topbar' | 'allbirds' | 'darkglass';
export type LogoBackgroundStyle = 'none' | 'border' | 'shadow' | 'soft' | 'solid' | 'outline' | 'hairline' | 'inset' | 'pill';

export type HeaderMenuConfig = {
  brandName: string;
  showBrandName: boolean;
  logoSizeLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30;
  headerSpacingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  logoBackgroundStyle?: LogoBackgroundStyle;
  headerBackground: 'white' | 'dots' | 'stripes';
  headerSeparator: 'none' | 'shadow' | 'border' | 'gradient';
  headerSticky: boolean;
  headerStickyDesktop?: boolean;
  headerStickyMobile?: boolean;
  layerColors?: MenuLayerColorConfig;
  showBrandAccent: boolean;
  flatSubMenus?: boolean;
  borderRadiusStyle?: 'none' | 'small' | 'large';
  cart: { show: boolean };
  cta: { show: boolean; text: string; url?: string };
  login: { show: boolean; text: string };
  search: { show: boolean; placeholder: string; searchProducts: boolean; searchPosts: boolean; searchServices: boolean; searchCourses?: boolean };
  topbar: {
    email: string;
    hotline: string;
    show: boolean;
    showEmail?: boolean;
    showHotline?: boolean;
    showTrackOrder: boolean;
    slogan?: string;
    sloganEnabled?: boolean;
  };
  wishlist: { show: boolean };
  megaLevel1Color?: 'default' | 'primary' | 'secondary';
  showDarkModeToggle?: boolean;
};

type MenuItem = {
  _id: Id<'menuItems'>;
  label: string;
  url: string;
  order: number;
  depth: number;
  active: boolean;
  icon?: string;
  openInNewTab?: boolean;
};

type MenuItemWithChildren = MenuTreeNode<MenuItem>;

const buildLinearSteps = (min: number, max: number, count = 30) => {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.round(min + step * index));
};

const clampHeaderSpacingLevel = (level?: number): NonNullable<HeaderMenuConfig['headerSpacingLevel']> => {
  const value = Number.isFinite(level) ? Math.round(level as number) : 5;
  return Math.min(7, Math.max(1, value)) as NonNullable<HeaderMenuConfig['headerSpacingLevel']>;
};

const resolveStickyState = (config: HeaderMenuConfig) => ({
  desktop: config.headerStickyDesktop ?? config.headerSticky ?? true,
  mobile: config.headerStickyMobile ?? config.headerSticky ?? true,
});

export type HeaderMenuPreviewProps = {
  brandColor: string;
  secondaryColor?: string;
  colorMode?: MenuColorMode;
  config: HeaderMenuConfig;
  logo?: string;
  device: 'desktop' | 'tablet' | 'mobile';
  layoutStyle: HeaderLayoutStyle;
  menuItems: MenuItem[];
  settingsEmail?: string;
  settingsPhone?: string;
  customersEnabled: boolean;
  loginFeatureEnabled: boolean;
  ordersEnabled: boolean;
  productsEnabled: boolean;
  postsEnabled: boolean;
  servicesEnabled: boolean;
  coursesEnabled?: boolean;
};

export function HeaderMenuPreview({
  brandColor,
  secondaryColor,
  colorMode = 'single',
  config,
  logo,
  device,
  layoutStyle,
  menuItems,
  settingsEmail,
  settingsPhone,
  customersEnabled,
  loginFeatureEnabled,
  ordersEnabled,
  productsEnabled,
  postsEnabled,
  servicesEnabled,
  coursesEnabled = false,
}: HeaderMenuPreviewProps) {
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const tokens = useMemo<MenuColors>(
    () => getMenuColors(brandColor, secondaryColor, colorMode, isDark),
    [brandColor, secondaryColor, colorMode, isDark]
  );
  const layerColors = useMemo(
    () => resolveMenuLayerColors(config.layerColors, tokens, colorMode),
    [config.layerColors, tokens, colorMode]
  );
  const menuVars: React.CSSProperties = {
    '--menu-hover-bg': tokens.navItemHoverBg,
    '--menu-hover-text': tokens.navItemHoverText,
    '--menu-dropdown-hover-bg': tokens.dropdownItemHoverBg,
    '--menu-dropdown-hover-text': tokens.dropdownItemHoverText,
    '--menu-dropdown-sub-hover-text': tokens.dropdownSubItemHoverText,
    '--menu-icon-hover': tokens.iconButtonHoverText,
  } as React.CSSProperties;
  const brandLabel = config.brandName || 'YourBrand';
  const showBrandName = config.showBrandName !== false;
  const logoSizeLevel = config.logoSizeLevel ?? 2;
  const headerSpacingLevel = clampHeaderSpacingLevel(config.headerSpacingLevel);

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

  const resolvedStyle: HeaderLayoutStyle = 
    (layoutStyle as string) === 'transparent' || (layoutStyle as string) === 'centered'
      ? 'allbirds'
      : (layoutStyle || 'classic') as HeaderLayoutStyle;

  const logoSizeMap: Record<HeaderLayoutStyle, number[]> = {
    classic: buildLinearSteps(24, 160),
    topbar: buildLinearSteps(28, 180),
    allbirds: buildLinearSteps(16, 140),
    darkglass: buildLinearSteps(24, 128),
  };
  const headerSpacingMap: Record<HeaderLayoutStyle, number[]> = {
    classic: [6, 8, 10, 12, 14, 16, 18],
    topbar: [4, 6, 8, 10, 12, 14, 16],
    allbirds: [6, 8, 10, 12, 14, 16, 18],
    darkglass: [6, 8, 10, 12, 14, 16, 18],
  };
  const logoSize = logoSizeMap[resolvedStyle][logoSizeLevel - 1] ?? logoSizeMap[resolvedStyle][0];
  const headerSpacingY = headerSpacingMap[resolvedStyle][headerSpacingLevel - 1] ?? headerSpacingMap[resolvedStyle][3];
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
  const logoBackgroundStyles: Record<LogoBackgroundStyle, React.CSSProperties> = {
    none: {},
    border: {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      border: `1px solid ${tokens.borderStrong}`,
      boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(15, 23, 42, 0.08)',
    },
    outline: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)',
      border: `1px solid ${tokens.borderStrong}`,
    },
    hairline: {
      backgroundColor: 'transparent',
      border: `1px solid ${tokens.border}`,
    },
    inset: {
      backgroundColor: tokens.surfaceAlt,
      border: `1px solid ${tokens.border}`,
      boxShadow: isDark ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    },
    pill: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)',
      border: `1px solid ${tokens.border}`,
    },
    shadow: {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)',
      boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 10px 30px rgba(15, 23, 42, 0.16)',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(148, 163, 184, 0.2)',
      backdropFilter: 'blur(10px)',
    },
    soft: {
      backgroundColor: tokens.surfaceAlt,
      border: `1px solid ${tokens.border}`,
      boxShadow: isDark ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
    },
    solid: {
      backgroundColor: tokens.textPrimary,
      border: `1px solid ${tokens.textPrimary}`,
      boxShadow: isDark ? '0 12px 28px rgba(0, 0, 0, 0.4)' : '0 12px 28px rgba(15, 23, 42, 0.18)',
    },
  };
  const hasBackgroundFrame = logoBackgroundStyle !== 'none';
  const logoWrapStyle: React.CSSProperties = {
    width: hasBackgroundFrame ? logoContainerSize : logoSize,
    height: logo ? 'auto' : (hasBackgroundFrame ? logoContainerSize : logoSize),
    ...(logo && hasBackgroundFrame ? { padding: Math.max(4, Math.round(logoSize * 0.1)) } : {}),
    borderRadius: logoBackgroundStyle === 'pill'
      ? logoContainerSize
      : resolvedStyle === 'allbirds'
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
    borderRadius: resolvedStyle === 'allbirds' ? logoSize : Math.max(8, Math.round(logoSize * 0.24)),
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
  const ctaLabel = config.cta.text || 'Liên hệ';
  const ctaHref = config.cta.url?.trim() || '/contact';
  const loginLabel = config.login.text || 'Đăng nhập';
  const defaultLinks = useMemo(() => ({
    cart: '/cart',
    wishlist: '/wishlist',
    login: '/account/login',
    cta: ctaHref,
    trackOrder: '/account/orders',
    storeSystem: '/stores',
    accountProfile: '/account/profile',
    accountOrders: '/account/orders',
  }), [ctaHref]);

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileItems, setExpandedMobileItems] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [visibleRootCount, setVisibleRootCount] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const headerRowRef = useRef<HTMLDivElement | null>(null);
  const brandBlockRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const measureContainerRef = useRef<HTMLDivElement | null>(null);
  const measureItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const moreMeasureRef = useRef<HTMLDivElement | null>(null);

  const activeItems = useMemo(() => menuItems.filter(item => item.active), [menuItems]);

  const menuTree = useMemo((): MenuItemWithChildren[] => buildMenuTree(activeItems), [activeItems]);

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
  const isDeepMenuForItem = (itemId: Id<'menuItems'>) => (maxLevelByRootId.get(itemId) ?? 1) >= 3;

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
  }, [rootItems.length, logoSizeLevel, showBrandName, resolvedStyle, config.cta.show, config.cart.show, config.wishlist.show]);

  const displayTopbar = useMemo(() => ({
    ...config.topbar,
    hotline: settingsPhone || config.topbar.hotline,
    email: settingsEmail || config.topbar.email,
  }), [config.topbar, settingsEmail, settingsPhone]);

  const canLogin = customersEnabled && loginFeatureEnabled;
  const showLogin = config.login.show && canLogin;
  const showUserMenu = false;
  const showLoginLink = showLogin;
  const canTrackOrder = ordersEnabled;
  const showTrackOrder = displayTopbar.showTrackOrder && canTrackOrder;
  const canSearchProducts = config.search.searchProducts && productsEnabled;
  const canSearchPosts = config.search.searchPosts && postsEnabled;
  const canSearchServices = config.search.searchServices && servicesEnabled;
  const canSearchCourses = Boolean(config.search.searchCourses && coursesEnabled);
  const showSearch = config.search.show && (canSearchProducts || canSearchPosts || canSearchServices || canSearchCourses);
  const isDesktop = device === 'desktop';

  const renderUserMenu = (variant: 'text' | 'icon') => (
    <div className="relative">
      <button
        onClick={() => { setUserMenuOpen(prev => !prev); }}
        className={variant === 'text'
          ? 'hover:underline flex items-center gap-1'
          : 'p-2 transition-colors hover:text-[var(--menu-icon-hover)]'}
        style={variant === 'text' ? { color: layerColors.topnav.text } : { color: layerColors.navbar.text, ...menuVars }}
      >
        <User size={variant === 'text' ? 12 : 18} />
        {variant === 'text' && <span>{loginLabel}</span>}
      </button>
      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border z-50" style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: tokens.border }}>
            <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>Xin chào, Nguyễn Văn A</p>
            <p className="text-xs mt-1" style={{ color: tokens.textSubtle }}>customer@email.com</p>
          </div>
          <div className="py-2">
            <a
              href={defaultLinks.accountProfile}
              className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
              style={{ color: tokens.dropdownItemText, ...menuVars }}
            >
              <User size={16} />
              Thông tin tài khoản
            </a>
            <a
              href={defaultLinks.accountOrders}
              className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
              style={{ color: tokens.dropdownItemText, ...menuVars }}
            >
              <Package size={16} />
              Đơn hàng của tôi
            </a>
            <a
              href={defaultLinks.wishlist}
              className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
              style={{ color: tokens.dropdownItemText, ...menuVars }}
            >
              <Heart size={16} />
              Danh sách yêu thích
            </a>
          </div>
          <div className="border-t" style={{ borderColor: tokens.border }}>
            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)]"
              style={{ color: tokens.secondary, ...menuVars }}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const topbarSlogan = typeof displayTopbar.slogan === 'string' ? displayTopbar.slogan.trim() : '';
  const topbarSloganEnabled = displayTopbar.sloganEnabled !== false;
  const showSlogan = Boolean(displayTopbar.show && topbarSloganEnabled && topbarSlogan);
  const showTopbarHotline = Boolean(displayTopbar.show && (displayTopbar.showHotline ?? true) && displayTopbar.hotline);
  const showTopbarEmail = Boolean(displayTopbar.show && (displayTopbar.showEmail ?? true) && displayTopbar.email);


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
  const stickyEnabled = device === 'mobile' ? stickyMobile : stickyDesktop;
  const classicPositionClass = stickyEnabled ? 'sticky top-0 z-40' : 'relative z-40';

  const toggleMobileItem = (id: string) => {
    setExpandedMobileItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const renderLink = (item: MenuItem, className: string, children: React.ReactNode, style?: React.CSSProperties) => (
    <a
      href={item.url}
      target={item.openInNewTab ? '_blank' : undefined}
      rel={item.openInNewTab ? 'noreferrer' : undefined}
      className={className}
      style={style}
    >
      {children}
    </a>
  );

  const renderMobileMenuButton = (isTransparent = false) => {
    const color = isTransparent ? tokens.textInverse : layerColors.navbar.text;
    return (
      <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg" style={{ color }}>
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

  const renderDesktopFlyoutNodes = (nodes: MenuItemWithChildren[], depth = 0): React.ReactNode => nodes.map((node) => (
    <div key={node._id} className="relative group/menu-node">
      <a
        href={node.url}
        target={node.openInNewTab ? '_blank' : undefined}
        rel={node.openInNewTab ? 'noreferrer' : undefined}
        className="flex min-w-0 items-start justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
        style={{ color: tokens.dropdownItemText, ...menuVars }}
      >
        <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{node.label}</span>
        {node.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
      </a>
      {node.children.length > 0 && (
        <div 
          className={cn('absolute top-0 rounded-lg border py-2 min-w-[200px] z-50 hidden group-hover/menu-node:block overflow-y-auto scrollbar-menu-thin', depth === 0 ? 'left-full ml-1' : 'right-full mr-1')} 
          style={{ 
            backgroundColor: tokens.dropdownBg, 
            borderColor: tokens.dropdownBorder,
            maxHeight: 'min(70vh, 290px)',
          }}
        >
          {renderDesktopFlyoutNodes(node.children, depth + 1)}
        </div>
      )}
    </div>
  ));

  const renderMobileNodes = (nodes: MenuItemWithChildren[], parentKey = 'root'): React.ReactNode => nodes.map((node) => {
    const nodeKey = `${parentKey}-${node._id}`;
    const isExpanded = expandedMobileItems.includes(nodeKey);

    return (
      <div key={node._id}>
        {node.children.length > 0 ? (
          <div className="w-full px-6 py-3 text-left flex items-center justify-between text-sm font-medium transition-colors hover:bg-[var(--menu-dropdown-hover-bg)]">
            <a
              href={node.url}
              target={node.openInNewTab ? '_blank' : undefined}
              rel={node.openInNewTab ? 'noreferrer' : undefined}
              className="flex-1 transition-colors hover:text-[var(--menu-hover-text)]"
              style={{ color: tokens.mobileMenuItemText, ...menuVars }}
            >
              {node.label}
            </a>
            <button
              type="button"
              aria-label={`Mở menu con ${node.label}`}
              aria-expanded={isExpanded}
              aria-controls={`mobile-menu-${nodeKey}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleMobileItem(nodeKey);
              }}
              className="ml-3 flex items-center justify-center"
              style={{ color: tokens.mobileMenuItemText, ...menuVars }}
            >
              <ChevronDown size={16} className={cn('transition-transform', isExpanded && 'rotate-180')} />
            </button>
          </div>
        ) : (
          <a
            href={node.url}
            target={node.openInNewTab ? '_blank' : undefined}
            rel={node.openInNewTab ? 'noreferrer' : undefined}
            className="block w-full px-6 py-3 text-left text-sm font-medium transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-hover-text)]"
            style={{ color: tokens.mobileMenuItemText, ...menuVars }}
          >
            {node.label}
          </a>
        )}
        {node.children.length > 0 && isExpanded && (
          <div id={`mobile-menu-${nodeKey}`} style={{ backgroundColor: tokens.surface }}>
            <div className="border-l-2 ml-6" style={{ borderColor: tokens.mobileMenuSubItemBorder }}>
              {renderMobileNodes(node.children, nodeKey)}
            </div>
          </div>
        )}
      </div>
    );
  });

  if (activeItems.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="p-8 text-center">
          <Eye className="w-12 h-12 mx-auto mb-4" style={{ color: tokens.textSubtle }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: tokens.textPrimary }}>Chưa có menu items</h3>
          <p style={{ color: tokens.textSubtle }}>Thêm menu items để xem preview</p>
        </CardContent>
      </Card>
    );
  }

  const renderClassicStyle = () => {
    const visibleCount = visibleRootCount ?? rootItems.length;
    const visibleRootItems = rootItems.slice(0, visibleCount);
    const overflowRootItems = rootItems.slice(visibleCount);
    const moreKey = '__more__';

    return (
    <div className={cn(classicPositionClass)} style={{ ...classicBackgroundStyle, ...classicSeparatorStyle }}>
      {displayTopbar.show && (
        <div className="px-4 py-2 text-xs" style={{ backgroundColor: layerColors.topnav.bg, color: layerColors.topnav.text }}>
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-4">
              {showTopbarHotline && (
                <a href={`tel:${displayTopbar.hotline}`} className="flex items-center gap-1" style={{ color: layerColors.topnav.text }}><Phone size={12} /><span>{displayTopbar.hotline}</span></a>
              )}
              {device !== 'mobile' && showTopbarEmail && (
                <a href={`mailto:${displayTopbar.email}`} className="flex items-center gap-1" style={{ color: layerColors.topnav.text }}><Mail size={12} /><span>{displayTopbar.email}</span></a>
              )}
            </div>
            {showSlogan && (
              <div className={cn('flex-1 px-4 text-center truncate', device === 'mobile' && 'text-[11px]')}>
                {topbarSlogan}
              </div>
            )}
            <div className="flex items-center gap-3">
              {device !== 'mobile' && (
                <>
                  {showTrackOrder && <a href={defaultLinks.trackOrder} className="hover:underline" style={{ color: layerColors.topnav.text }}>Theo dõi đơn hàng</a>}
                  {showTrackOrder && showLoginLink && <span style={{ color: layerColors.topnav.text }}>|</span>}
                </>
              )}
              {showUserMenu && renderUserMenu('text')}
              {showLoginLink && (
                <a href={defaultLinks.login} className="hover:underline flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                  <User size={12} />
                  {loginLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      {config.showBrandAccent && (
        <div className="h-0.5" style={{ backgroundColor: tokens.accentLine }} />
      )}
      <div
        className="px-6 border-b"
        style={{ backgroundColor: layerColors.navbar.bg, borderColor: layerColors.navbar.border, paddingTop: headerSpacingY, paddingBottom: headerSpacingY }}
      >
        <div ref={headerRowRef} className="flex items-center gap-4">
          <div ref={brandBlockRef} className="flex items-center gap-3 flex-shrink-0">
            <div style={logoWrapStyle}>
              {logo ? (
                <div style={logoInnerStyle}>
                  <img src={logo} alt={brandLabel} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div style={logoInnerStyle}></div>
              )}
            </div>
            {showBrandName && (
              <span className="font-semibold" style={{ color: layerColors.navbar.text }}>{brandLabel}</span>
            )}
          </div>

          {device !== 'mobile' ? (
            <>
              <nav ref={navRef} className="flex-1 min-w-0 flex items-center gap-1 whitespace-nowrap">
                {visibleRootItems.map((item) => (
                  <div
                    key={item._id}
                    className="relative"
                    onMouseEnter={() => setHoveredItem(item._id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                        hoveredItem === item._id
                          ? 'text-[var(--menu-hover-text)]'
                          : 'hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)]'
                      )}
                      style={{
                        ...(hoveredItem === item._id ? { backgroundColor: tokens.navItemHoverBg, color: tokens.navItemHoverText } : { color: layerColors.navbar.text }),
                        ...menuVars,
                      }}
                      title={item.label}
                    >
                      <span>{item.label}</span>
                      {item.children.length > 0 && (
                        <ChevronDown size={14} className={cn('transition-transform', hoveredItem === item._id && 'rotate-180')} />
                      )}
                    </button>

                    {item.children.length > 0 && hoveredItem === item._id && (
                      <div className="absolute top-full left-1/2 mt-3 -translate-x-1/2 z-50">
                        {isDeepMenuForItem(item._id) ? (
                          <div
                            className={cn(r.popup, 'min-w-[720px] max-w-[960px] border p-5 shadow-xl')}
                            style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder }}
                          >
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                              {item.children.map((child) => (
                                <div key={child._id} className="space-y-3">
                                  <a
                                    href={child.url}
                                    target={child.openInNewTab ? '_blank' : undefined}
                                    rel={child.openInNewTab ? 'noreferrer' : undefined}
                                    className="block text-sm font-semibold whitespace-normal break-words leading-snug"
                                    style={{ color: level1Color }}
                                  >
                                    {child.label}
                                  </a>
                                  <div className="space-y-1">
                                    {child.children.length > 0 ? child.children.map((sub) => (
                                      config.flatSubMenus ? (
                                        <div key={sub._id} className="mt-4 mb-2 first:mt-0">
                                          <div 
                                            className="mb-2 font-bold uppercase tracking-wider text-[11px] border-l-2 pl-2" 
                                            style={{ color: tokens.brandBadgeBg || tokens.textPrimary, borderColor: tokens.brandBadgeBg || tokens.borderStrong }}
                                          >
                                            {sub.label}
                                          </div>
                                          {sub.children.length > 0 && (
                                            <div className="space-y-1 pl-2 max-h-[240px] overflow-y-auto scrollbar-menu-thin">
                                              {sub.children.map(leaf => (
                                                <a 
                                                  key={leaf._id} 
                                                  href={leaf.url} 
                                                  target={leaf.openInNewTab ? '_blank' : undefined} 
                                                  className="block py-1.5 text-[13px] transition-colors"
                                                  style={{ color: tokens.textSubtle }}
                                                  onMouseEnter={(e) => { e.currentTarget.style.color = tokens.textPrimary; }}
                                                  onMouseLeave={(e) => { e.currentTarget.style.color = tokens.textSubtle; }}
                                                >
                                                  {leaf.label}
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                      <div key={sub._id} className="relative group/menu-node">
                                        <a
                                          href={sub.url}
                                          target={sub.openInNewTab ? '_blank' : undefined}
                                          rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                          className="flex min-w-0 items-start justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                                          style={{ color: tokens.dropdownItemText, ...menuVars }}
                                        >
                                          <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{sub.label}</span>
                                          {sub.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
                                        </a>
                                        {sub.children.length > 0 && (
                                          <div className="absolute left-full top-0 ml-2 hidden group-hover/menu-node:block">
                                            <div className="rounded-xl border py-2 min-w-[220px] shadow-lg overflow-y-auto scrollbar-menu-thin" style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder, maxHeight: 'min(70vh, 290px)' }}>
                                              {renderDesktopFlyoutNodes(sub.children)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      )
                                    )) : (
                                      <a
                                        href={child.url}
                                        target={child.openInNewTab ? '_blank' : undefined}
                                        rel={child.openInNewTab ? 'noreferrer' : undefined}
                                        className="block rounded-lg px-3 py-2 text-sm whitespace-normal break-words leading-snug transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                                        style={{ color: tokens.dropdownItemText, ...menuVars }}
                                      >
                                        Xem thêm
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={cn(r.dropdown, 'border py-2 min-w-[200px] overflow-y-auto scrollbar-menu-thin')}
                            style={{ 
                              backgroundColor: tokens.dropdownBg, 
                              borderColor: tokens.dropdownBorder,
                              maxHeight: 'min(70vh, 290px)',
                            }}
                          >
                            {item.children.map((child) => (
                              <div key={child._id} className="relative group/menu-node">
                                <a
                                  href={child.url}
                                  target={child.openInNewTab ? '_blank' : undefined}
                                  rel={child.openInNewTab ? 'noreferrer' : undefined}
                                  className="flex min-w-0 items-start justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                                  style={{ color: tokens.dropdownItemText, ...menuVars }}
                                >
                                  <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{child.label}</span>
                                  {child.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
                                </a>
                                {child.children.length > 0 && (
                                  <div className="absolute left-full top-0 pl-1 hidden group-hover/menu-node:block">
                                    <div className="rounded-lg border py-2 min-w-[180px] overflow-y-auto scrollbar-menu-thin" style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder, maxHeight: 'min(70vh, 290px)' }}>
                                      {renderDesktopFlyoutNodes(child.children)}
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
                    onMouseEnter={() => setHoveredItem(moreKey)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                        hoveredItem === moreKey
                          ? 'text-[var(--menu-hover-text)]'
                          : 'hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)]'
                      )}
                      style={{
                        ...(hoveredItem === moreKey ? { backgroundColor: tokens.navItemHoverBg, color: tokens.navItemHoverText } : { color: layerColors.navbar.text }),
                        ...menuVars,
                      }}
                    >
                      Thêm
                      <ChevronDown size={14} className={cn('transition-transform', hoveredItem === moreKey && 'rotate-180')} />
                    </button>

                    {hoveredItem === moreKey && (
                      <div
                        className="absolute top-full left-0 mt-1 rounded-lg border py-2 min-w-[240px] z-50"
                        style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder }}
                      >
                        {overflowRootItems.map((root) => (
                          <div key={root._id} className="px-3 py-2">
                            <a
                              href={root.url}
                              className="flex min-w-0 items-start justify-between gap-2 text-sm font-semibold transition-colors hover:text-[var(--menu-dropdown-hover-text)]"
                              style={{ color: tokens.dropdownItemText, ...menuVars }}
                            >
                              <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{root.label}</span>
                              {root.children.length > 0 && <ChevronRight size={10} className="rotate-90" />}
                            </a>

                            {root.children.length > 0 && (
                              <div className="mt-2 space-y-2 border-l pl-3" style={{ borderColor: tokens.border }}>
                                {root.children.map((child) => (
                                  <div key={child._id} className="space-y-1">
                                    {renderLink(
                                      child,
                                      'block text-sm transition-colors hover:text-[var(--menu-dropdown-hover-text)]',
                                      child.label,
                                      { color: tokens.dropdownItemText, ...menuVars }
                                    )}
                                    {child.children?.length > 0 && (
                                      <div className="space-y-1 pl-3">
                                        {child.children.map((sub) => (
                                          <a
                                            key={sub._id}
                                            href={sub.url}
                                            className="block text-sm transition-colors hover:text-[var(--menu-dropdown-sub-hover-text)]"
                                            style={{ color: tokens.dropdownSubItemText, ...menuVars }}
                                          >
                                            {sub.label}
                                          </a>
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
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={config.search.placeholder}
                      className="w-48 pl-4 pr-10 py-2 rounded-full border text-sm focus:outline-none"
                      style={{
                        backgroundColor: tokens.searchInputBg,
                        borderColor: tokens.searchInputBorder,
                        color: tokens.searchInputText,
                      }}
                    />
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full"
                      style={{ backgroundColor: tokens.searchButtonBg, color: tokens.searchButtonText }}
                    >
                      <Search size={14} />
                    </button>
                  </div>
                )}
                {config.showDarkModeToggle && (
                  <button className="p-2 transition-colors hover:text-[var(--menu-icon-hover)]" style={{ color: layerColors.navbar.text, ...menuVars }}>
                    <Moon size={20} />
                  </button>
                )}
                {config.cart.show && (
                  <a href={defaultLinks.cart} className="p-2 relative" style={{ color: layerColors.navbar.text }}>
                    <ShoppingCart size={20} />
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center"
                      style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
                    >
                      0
                    </span>
                  </a>
                )}
                {config.cta.show && (
                  <a
                    href={defaultLinks.cta}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
                  >
                    {ctaLabel}
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              {showSearch && (
                <button onClick={() => setSearchOpen((prev) => !prev)} className="p-2" style={{ color: layerColors.navbar.text }}>
                  <Search size={20} />
                </button>
              )}
              {config.showDarkModeToggle && (
                <button className="p-2" style={{ color: layerColors.navbar.text }}>
                  <Moon size={20} />
                </button>
              )}
              {config.cart.show && (
                <a href={defaultLinks.cart} className="p-2 relative" style={{ color: layerColors.navbar.text }}>
                  <ShoppingCart size={20} />
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
                  >
                    0
                  </span>
                </a>
              )}
              {renderMobileMenuButton(false)}
            </div>
          )}
        </div>
      </div>

      {showSearch && searchOpen && (
        <div className="md:hidden px-6 pb-4 border-b" style={{ borderColor: tokens.border }}>
          <input
            type="text"
            placeholder={config.search.placeholder ?? 'Tìm kiếm...'}
            className="w-full px-3 py-2 rounded-full border text-sm focus:outline-none"
            style={{
              backgroundColor: tokens.searchInputBg,
              borderColor: tokens.searchInputBorder,
              color: tokens.searchInputText,
            }}
          />
        </div>
      )}

      {device === 'mobile' && mobileMenuOpen && (
        <div className="border-b" style={{ borderColor: tokens.border, backgroundColor: tokens.mobileMenuBg }}>
          {renderMobileNodes(menuTree)}
          {config.cta.show && (
            <div className="p-4">
              <a
                href={defaultLinks.cta}
                className="block w-full py-2.5 text-sm font-medium rounded-lg text-center"
                style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
              >
                {ctaLabel}
              </a>
            </div>
          )}
        </div>
      )}
      {classicSeparatorElement}
    </div>
    );
  };

  const renderTopbarStyle = () => (
    <div className={cn(classicPositionClass)} style={{ backgroundColor: layerColors.navbar.bg }}>
      {displayTopbar.show && (
        <div className="px-4 py-2 text-xs" style={{ backgroundColor: layerColors.topnav.bg, color: layerColors.topnav.text }}>
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-4">
              {showTopbarHotline && (
                <a href={`tel:${displayTopbar.hotline}`} className="flex items-center gap-1" style={{ color: layerColors.topnav.text }}><Phone size={12} /><span>{displayTopbar.hotline}</span></a>
              )}
              {device !== 'mobile' && showTopbarEmail && (
                <a href={`mailto:${displayTopbar.email}`} className="flex items-center gap-1" style={{ color: layerColors.topnav.text }}><Mail size={12} /><span>{displayTopbar.email}</span></a>
              )}
            </div>
            {showSlogan && (
              <div className={cn('flex-1 px-4 text-center truncate', device === 'mobile' && 'text-[11px]')}>
                {topbarSlogan}
              </div>
            )}
            <div className="flex items-center gap-3">
              {device !== 'mobile' && (
                <>
                  {showTrackOrder && <a href={defaultLinks.trackOrder} className="hover:underline" style={{ color: layerColors.topnav.text }}>Theo dõi đơn hàng</a>}
                  {showTrackOrder && showLoginLink && <span style={{ color: layerColors.topnav.text }}>|</span>}
                </>
              )}
              {showUserMenu && renderUserMenu('text')}
              {showLoginLink && (
                <a href={defaultLinks.login} className="hover:underline flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                  <User size={12} />
                  {loginLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className="px-4 border-b"
        style={{ backgroundColor: layerColors.navbar.bg, borderColor: layerColors.navbar.border, paddingTop: headerSpacingY, paddingBottom: headerSpacingY }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div style={logoWrapStyle}>
              <div style={logoInnerStyle} className="font-bold">
                {brandLabel.charAt(0)}
              </div>
            </div>
            {showBrandName && (
              <span className="font-bold text-lg" style={{ color: layerColors.navbar.text }}>{brandLabel}</span>
            )}
          </div>

          {device !== 'mobile' && showSearch && (
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder={config.search.placeholder}
                  className="w-full pl-4 pr-10 py-2 rounded-full border text-sm focus:outline-none"
                  style={{
                    backgroundColor: tokens.searchInputBg,
                    borderColor: tokens.searchInputBorder,
                    color: tokens.searchInputText,
                  }}
                />
                <button
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full"
                  style={{ backgroundColor: tokens.searchButtonBg, color: tokens.searchButtonText }}
                >
                  <Search size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {device === 'mobile' ? (
              <>
                {showSearch && (
                  <button onClick={() => setSearchOpen((prev) => !prev)} className="p-2" style={{ color: layerColors.navbar.text }}>
                    <Search size={20} />
                  </button>
                )}
                {config.showDarkModeToggle && (
                  <button className="p-2" style={{ color: layerColors.navbar.text }}>
                    <Moon size={20} />
                  </button>
                )}
                {config.cart.show && (
                  <a href={defaultLinks.cart} className="p-2 relative" style={{ color: layerColors.navbar.text }}>
                    <ShoppingCart size={20} />
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center"
                      style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
                    >
                      0
                    </span>
                  </a>
                )}
                {renderMobileMenuButton(false)}
              </>
            ) : (
              <>
                {config.wishlist.show && (
                  <a
                    href={defaultLinks.wishlist}
                    className="p-2 transition-colors flex flex-col items-center text-xs gap-0.5 hover:text-[var(--menu-icon-hover)]"
                    style={{ color: layerColors.navbar.text, ...menuVars }}
                  >
                    <Heart size={20} /><span>Yêu thích</span>
                  </a>
                )}
                {config.showDarkModeToggle && (
                  <button className="p-2 transition-colors flex flex-col items-center text-xs gap-0.5 hover:text-[var(--menu-icon-hover)]" style={{ color: layerColors.navbar.text, ...menuVars }}>
                    <Moon size={20} /><span>Theme</span>
                  </button>
                )}
                {config.cart.show && (
                  <a
                    href={defaultLinks.cart}
                    className="p-2 transition-colors flex flex-col items-center text-xs gap-0.5 relative hover:text-[var(--menu-icon-hover)]"
                    style={{ color: layerColors.navbar.text, ...menuVars }}
                  >
                    <ShoppingCart size={20} /><span>Giỏ hàng</span>
                    <span
                      className="absolute top-0 right-0 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center"
                      style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
                    >
                      0
                    </span>
                  </a>
                )}
                {config.cta.show && (
                  <a
                    href={defaultLinks.cta}
                    className="px-4 py-2 text-sm font-medium rounded-full transition-colors"
                    style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
                  >
                    {ctaLabel}
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {device !== 'mobile' && (
        <div className="px-4 py-2 border-b" style={{ backgroundColor: layerColors.menu.bg, borderColor: layerColors.menu.border }}>
          <nav className="flex items-center gap-1">
            {menuTree.map((item) => (
              <div key={item._id} className="relative" onMouseEnter={() => setHoveredItem(item._id)} onMouseLeave={() => setHoveredItem(null)}>
                <a
                  href={item.url}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                    hoveredItem === item._id
                      ? 'text-[var(--menu-hover-text)]'
                      : 'hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)]'
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
                </a>
                {item.children.length > 0 && hoveredItem === item._id && (
                  <div className="absolute top-full left-1/2 mt-3 -translate-x-1/2 z-50">
                    {isDeepMenuForItem(item._id) ? (
                      <div
                        className="min-w-[720px] max-w-[960px] rounded-2xl border p-5 shadow-xl"
                        style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder }}
                      >
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                          {item.children.map((child) => (
                            <div key={child._id} className="space-y-3">
                              <a
                                href={child.url}
                                target={child.openInNewTab ? '_blank' : undefined}
                                rel={child.openInNewTab ? 'noreferrer' : undefined}
                                className="block text-sm font-semibold whitespace-normal break-words leading-snug"
                                style={{ color: level1Color }}
                              >
                                {child.label}
                              </a>
                              <div className="space-y-1">
                                {child.children.length > 0 ? child.children.map((sub) => (
                                  <div key={sub._id} className="relative group/menu-node">
                                    <a
                                      href={sub.url}
                                      target={sub.openInNewTab ? '_blank' : undefined}
                                      rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                      className="flex min-w-0 items-start justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                                      style={{ color: tokens.dropdownItemText, ...menuVars }}
                                    >
                                      <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{sub.label}</span>
                                      {sub.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
                                    </a>
                                    {sub.children.length > 0 && (
                                      <div className="absolute left-full top-0 ml-2 hidden group-hover/menu-node:block">
                                        <div className="rounded-xl border py-2 min-w-[220px] shadow-lg overflow-y-auto scrollbar-menu-thin" style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder, maxHeight: 'min(70vh, 290px)' }}>
                                          {renderDesktopFlyoutNodes(sub.children)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )) : (
                                  <a
                                    href={child.url}
                                    target={child.openInNewTab ? '_blank' : undefined}
                                    rel={child.openInNewTab ? 'noreferrer' : undefined}
                                    className="block rounded-lg px-3 py-2 text-sm whitespace-normal break-words leading-snug transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                                    style={{ color: tokens.dropdownItemText, ...menuVars }}
                                  >
                                    Xem thêm
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-lg border py-2 min-w-[200px] overflow-y-auto scrollbar-menu-thin"
                        style={{ 
                          backgroundColor: tokens.dropdownBg, 
                          borderColor: tokens.dropdownBorder,
                          maxHeight: 'min(70vh, 290px)',
                        }}
                      >
                        {item.children.map((child) => (
                          <div key={child._id} className="relative group/menu-node">
                            <a
                              href={child.url}
                              target={child.openInNewTab ? '_blank' : undefined}
                              rel={child.openInNewTab ? 'noreferrer' : undefined}
                              className="flex min-w-0 items-start justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                              style={{ color: tokens.dropdownItemText, ...menuVars }}
                            >
                              <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{child.label}</span>
                              {child.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
                            </a>
                            {child.children.length > 0 && (
                              <div className="absolute left-full top-0 pl-1 hidden group-hover/menu-node:block">
                                <div className="rounded-lg border py-2 min-w-[180px] overflow-y-auto scrollbar-menu-thin" style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder, maxHeight: 'min(70vh, 290px)' }}>
                                  {renderDesktopFlyoutNodes(child.children)}
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
          </nav>
        </div>
      )}

      {showSearch && searchOpen && (
        <div className="md:hidden px-4 pb-4 border-b" style={{ borderColor: tokens.border }}>
          <input
            type="text"
            placeholder={config.search.placeholder ?? 'Tìm kiếm...'}
            className="w-full px-3 py-2 rounded-full border text-sm focus:outline-none"
            style={{
              backgroundColor: tokens.searchInputBg,
              borderColor: tokens.searchInputBorder,
              color: tokens.searchInputText,
            }}
          />
        </div>
      )}

      {device === 'mobile' && mobileMenuOpen && (
        <div className="border-t" style={{ borderColor: layerColors.menu.border, backgroundColor: layerColors.menu.bg }}>
          {renderMobileNodes(menuTree)}
          {config.cta.show && (
            <div className="p-4">
              <a
                href={defaultLinks.cta}
                className="block w-full py-2.5 text-sm font-medium rounded-lg text-center"
                style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
              >
                {ctaLabel}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderAllbirdsStyle = () => (
    <div className={cn(classicPositionClass)} style={{ backgroundColor: layerColors.navbar.bg, ...classicSeparatorStyle }}>
      {displayTopbar.show && (
        <div className="px-4 py-2 text-xs" style={{ backgroundColor: layerColors.topnav.bg, color: layerColors.topnav.text }}>
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-4">
              {showTopbarHotline && (
                <a href={`tel:${displayTopbar.hotline}`} className="flex items-center gap-1" style={{ color: layerColors.topnav.text }}><Phone size={12} /><span>{displayTopbar.hotline}</span></a>
              )}
              {device !== 'mobile' && showTopbarEmail && (
                <a href={`mailto:${displayTopbar.email}`} className="flex items-center gap-1" style={{ color: layerColors.topnav.text }}><Mail size={12} /><span>{displayTopbar.email}</span></a>
              )}
            </div>
            {showSlogan && (
              <div className={cn('flex-1 px-4 text-center truncate', device === 'mobile' && 'text-[11px]')}>
                {topbarSlogan}
              </div>
            )}
            <div className="flex items-center gap-3">
              {device !== 'mobile' && (
                <>
                  {showTrackOrder && <a href={defaultLinks.trackOrder} className="hover:underline" style={{ color: layerColors.topnav.text }}>Theo dõi đơn hàng</a>}
                  {showTrackOrder && showLoginLink && <span style={{ color: layerColors.topnav.text }}>|</span>}
                </>
              )}
              {showUserMenu && renderUserMenu('text')}
              {showLoginLink && (
                <a href={defaultLinks.login} className="hover:underline flex items-center gap-1" style={{ color: layerColors.topnav.text }}>
                  <User size={12} />
                  {loginLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      {config.showBrandAccent && (
        <div className="h-0.5" style={{ backgroundColor: tokens.accentLine }} />
      )}
      <div
        className={cn('px-6', !isDesktop && 'border-b')}
        style={{ backgroundColor: layerColors.navbar.bg, borderColor: layerColors.navbar.border, paddingTop: headerSpacingY, paddingBottom: headerSpacingY }}
      >
        {device !== 'mobile' ? (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div style={logoWrapStyle}>
                <div
                  className="rounded-full"
                  style={{ backgroundColor: tokens.allbirdsAccentDot, width: logoDotSize, height: logoDotSize }}
                ></div>
              </div>
              {showBrandName && (
                <span className="text-base font-semibold" style={{ color: layerColors.navbar.text }}>{brandLabel}</span>
              )}
            </div>
            <nav className="flex items-center gap-6">
              {menuTree.map((item) => {
                const hasSubItems = item.children.some((child) => child.children.length > 0);
                const totalSubItems = item.children.reduce((acc, child) => acc + child.children.length, 0);
                const isMega = item.children.length >= 3 || totalSubItems > 6;
                const isMedium = !isMega && (item.children.length > 1 || hasSubItems);
                const dropdownWidth = isMega ? 'w-[720px]' : isMedium ? 'w-[420px]' : 'w-[240px]';
                const gridCols = isMega
                  ? 'grid-cols-3'
                  : item.children.length > 1
                    ? 'grid-cols-2'
                    : 'grid-cols-1';

                return (
                  <div
                    key={item._id}
                    className="relative"
                    onMouseEnter={() => setHoveredItem(item._id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <a
                      href={item.url}
                      className={cn(
                        'text-sm font-medium transition-colors flex items-center gap-1',
                        hoveredItem === item._id ? 'text-[var(--menu-hover-text)]' : 'hover:text-[var(--menu-hover-text)]'
                      )}
                      style={{ color: layerColors.navbar.text, ...menuVars }}
                    >
                      <span>{item.label}</span>
                      {item.children.length > 0 && (
                        <ChevronDown size={14} className={cn("transition-transform duration-200 shrink-0", hoveredItem === item._id && "rotate-180")} />
                      )}
                    </a>
                    {item.children.length > 0 && hoveredItem === item._id && (
                      <div className="absolute left-1/2 top-full mt-6 -translate-x-1/2 z-50">
                        {isDeepMenuForItem(item._id) ? (
                          <div
                            className={cn('rounded-2xl border p-6', dropdownWidth)}
                            style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder }}
                          >
                            <div className={cn('grid gap-6', gridCols)}>
                              {item.children.map((child) => (
                                <div key={child._id} className="space-y-3">
                                  <a href={child.url} className="text-sm font-semibold whitespace-normal break-words leading-snug" style={{ color: level1Color }}>
                                    {child.label}
                                  </a>
                                  <div className="space-y-2">
                                    {child.children.length > 0 ? child.children.map((sub) => (
                                      <div key={sub._id} className="relative group/menu-node">
                                        <a
                                          href={sub.url}
                                          target={sub.openInNewTab ? '_blank' : undefined}
                                          rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                          className="flex min-w-0 items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:text-[var(--menu-dropdown-sub-hover-text)]"
                                          style={{ color: tokens.dropdownSubItemText, ...menuVars }}
                                        >
                                          <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{sub.label}</span>
                                          {sub.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
                                        </a>
                                        {sub.children.length > 0 && (
                                          <div className="absolute left-full top-0 ml-2 hidden group-hover/menu-node:block">
                                            <div className="rounded-xl border py-2 min-w-[220px] shadow-lg overflow-y-auto scrollbar-menu-thin" style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder, maxHeight: 'min(70vh, 290px)' }}>
                                              {renderDesktopFlyoutNodes(sub.children)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )) : (
                                      <a
                                        href={child.url}
                                        className="text-sm hover:text-[var(--menu-dropdown-sub-hover-text)]"
                                        style={{ color: tokens.dropdownSubItemText, ...menuVars }}
                                      >
                                        Xem thêm
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="rounded-lg border py-2 min-w-[240px] overflow-y-auto scrollbar-menu-thin"
                            style={{ 
                              backgroundColor: tokens.dropdownBg, 
                              borderColor: tokens.dropdownBorder,
                              maxHeight: 'min(70vh, 290px)',
                            }}
                          >
                            {item.children.map((child) => (
                              <div key={child._id} className="relative group/menu-node">
                                <a
                                  href={child.url}
                                  target={child.openInNewTab ? '_blank' : undefined}
                                  rel={child.openInNewTab ? 'noreferrer' : undefined}
                                  className="flex min-w-0 items-start justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                                  style={{ color: tokens.dropdownItemText, ...menuVars }}
                                >
                                  <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{child.label}</span>
                                  {child.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
                                </a>
                                {child.children.length > 0 && (
                                  <div className="absolute left-full top-0 pl-1 hidden group-hover/menu-node:block">
                                    <div className="rounded-lg border py-2 min-w-[180px] overflow-y-auto scrollbar-menu-thin" style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder, maxHeight: 'min(70vh, 290px)' }}>
                                      {renderDesktopFlyoutNodes(child.children)}
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
              {config.cta.show && (
                <a
                  href={defaultLinks.cta}
                  className="text-sm font-medium hover:text-[var(--menu-hover-text)]"
                  style={{ color: tokens.ctaTextLink, ...menuVars }}
                >
                  {ctaLabel}
                </a>
              )}
              {showSearch && (
                <div className="flex items-center gap-2">
                  <div className={cn('overflow-hidden transition-all duration-200', searchOpen ? 'w-40' : 'w-0')}>
                    <input
                      type="text"
                      placeholder={config.search.placeholder ?? 'Tìm kiếm...'}
                      className={cn('w-40 px-3 py-1.5 rounded-full border text-sm focus:outline-none transition-opacity', searchOpen ? 'opacity-100' : 'opacity-0')}
                      style={{
                        backgroundColor: tokens.searchInputBg,
                        borderColor: tokens.searchInputBorder,
                        color: tokens.searchInputText,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setSearchOpen((prev) => !prev)}
                    className="p-2 transition-colors hover:text-[var(--menu-icon-hover)]"
                    style={{ color: layerColors.navbar.text, ...menuVars }}
                  >
                    <Search size={18} />
                  </button>
                </div>
              )}
              {showUserMenu && renderUserMenu('icon')}
              {showLoginLink && (
                <a
                  href={defaultLinks.login}
                  className="p-2 transition-colors hover:text-[var(--menu-icon-hover)]"
                  style={{ color: layerColors.navbar.text, ...menuVars }}
                >
                  <User size={18} />
                </a>
              )}
              {config.showDarkModeToggle && (
                <button className="p-2 transition-colors hover:text-[var(--menu-icon-hover)]" style={{ color: layerColors.navbar.text, ...menuVars }}>
                  <Moon size={18} />
                </button>
              )}
              {config.cart.show && (
                <a
                  href={defaultLinks.cart}
                  className="p-2 relative transition-colors hover:text-[var(--menu-icon-hover)]"
                  style={{ color: layerColors.navbar.text, ...menuVars }}
                >
                  <ShoppingCart size={18} />
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
                  >
                    0
                  </span>
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div style={logoWrapStyle}>
                <div
                  className="rounded-full"
                  style={{ backgroundColor: tokens.allbirdsAccentDot, width: logoDotSize, height: logoDotSize }}
                ></div>
              </div>
              {showBrandName && (
                <span className="text-base font-semibold" style={{ color: layerColors.navbar.text }}>{brandLabel}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {showSearch && (
                <button onClick={() => setSearchOpen((prev) => !prev)} className="p-2" style={{ color: layerColors.navbar.text }}>
                  <Search size={18} />
                </button>
              )}
              {config.showDarkModeToggle && (
                <button className="p-2" style={{ color: layerColors.navbar.text }}>
                  <Moon size={18} />
                </button>
              )}
              {config.cart.show && (
                <a href={defaultLinks.cart} className="p-2 relative" style={{ color: layerColors.navbar.text }}>
                  <ShoppingCart size={18} />
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
                  >
                    0
                  </span>
                </a>
              )}
              {renderMobileMenuButton(false)}
            </div>
          </div>
        )}
      </div>

      {isDesktop && (
        <div className="h-px w-full" style={{ backgroundColor: tokens.border }} />
      )}

      {device === 'mobile' && showSearch && searchOpen && (
        <div className="px-6 pb-4">
          <input
            type="text"
            placeholder={config.search.placeholder ?? 'Tìm kiếm...'}
            className="w-full px-3 py-2 rounded-full border text-sm focus:outline-none"
            style={{
              backgroundColor: tokens.searchInputBg,
              borderColor: tokens.searchInputBorder,
              color: tokens.searchInputText,
            }}
          />
        </div>
      )}

      {device === 'mobile' && mobileMenuOpen && (
        <div className="border-b" style={{ borderColor: tokens.border, backgroundColor: tokens.mobileMenuBg }}>
          {renderMobileNodes(menuTree)}
          {config.cta.show && (
            <div className="p-4">
              <a
                href={defaultLinks.cta}
                className="block w-full py-2.5 text-sm font-medium rounded-lg text-center"
                style={{ backgroundColor: tokens.ctaBg, color: tokens.ctaText }}
              >
                {ctaLabel}
              </a>
            </div>
          )}
        </div>
      )}
      {classicSeparatorElement}
    </div>
  );

  // ─── Dark Glass Style ───────────────────────────────────────────────────────
  // Lấy cảm hứng từ dự án dohy: nền tối backdrop-blur, pill sticky, social icons
  const darkGlassPillBg = 'rgba(0,0,0,0.65)';
  const darkGlassNavText = '#ffffff';



  const renderDarkGlassStyle = () => {
    const pillLogoSize = Math.min(64, logoSize);

    // Render desktop nav items
    const renderDarkGlassNav = () => (
      <nav className="hidden lg:flex justify-center flex-1">
        <ul className="flex items-center justify-center gap-1" style={{ flexWrap: 'nowrap' }}>
          {menuTree.slice(0, 6).map((item) => {
            const hasSubItems = item.children.some((child) => child.children.length > 0);
            const totalSubItems = item.children.reduce((acc, child) => acc + child.children.length, 0);
            const isMega = item.children.length >= 3 || totalSubItems > 6;
            const isMedium = !isMega && (item.children.length > 1 || hasSubItems);
            const dropdownWidth = isMega ? 'w-[720px]' : isMedium ? 'w-[420px]' : 'w-[240px]';
            const gridCols = isMega
              ? 'grid-cols-3'
              : item.children.length > 1
                ? 'grid-cols-2'
                : 'grid-cols-1';

            return (
              <li
                key={item._id}
                style={{ flexShrink: 0 }}
                className="relative"
                onMouseEnter={() => setHoveredItem(item._id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <a
                  href={item.url}
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition-colors duration-200 rounded-md flex items-center gap-1"
                  style={{
                    color: hoveredItem === item._id ? tokens.primary : darkGlassNavText,
                  }}
                >
                  <span>{item.label}</span>
                  {item.children.length > 0 && (
                    <ChevronDown size={12} className={cn("transition-transform duration-200 shrink-0", hoveredItem === item._id && "rotate-180")} />
                  )}
                </a>
                 {item.children.length > 0 && hoveredItem === item._id && (
                  <div className="absolute left-1/2 top-full mt-6 -translate-x-1/2 z-50">
                    {isDeepMenuForItem(item._id) ? (
                      <div
                        className={cn('rounded-2xl border p-6', dropdownWidth)}
                        style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder }}
                      >
                        <div className={cn('grid gap-6', gridCols)}>
                          {item.children.map((child) => (
                            <div key={child._id} className="space-y-3">
                              <a href={child.url} className="text-sm font-semibold whitespace-normal break-words leading-snug" style={{ color: level1Color }}>
                                {child.label}
                              </a>
                              <div className="space-y-2">
                                {child.children.length > 0 ? child.children.map((sub) => (
                                  <div key={sub._id} className="relative group/menu-node">
                                    <a
                                      href={sub.url}
                                      target={sub.openInNewTab ? '_blank' : undefined}
                                      rel={sub.openInNewTab ? 'noreferrer' : undefined}
                                      className="flex min-w-0 items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:text-[var(--menu-dropdown-sub-hover-text)]"
                                      style={{ color: tokens.dropdownSubItemText, ...menuVars }}
                                    >
                                      <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{sub.label}</span>
                                      {sub.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
                                    </a>
                                    {sub.children.length > 0 && (
                                      <div className="absolute left-full top-0 ml-2 hidden group-hover/menu-node:block">
                                        <div className="rounded-xl border py-2 min-w-[220px] shadow-lg overflow-y-auto scrollbar-menu-thin" style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder, maxHeight: 'min(70vh, 290px)' }}>
                                          {renderDesktopFlyoutNodes(sub.children)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )) : (
                                  <a
                                    href={child.url}
                                    className="text-sm hover:text-[var(--menu-dropdown-sub-hover-text)]"
                                    style={{ color: tokens.dropdownSubItemText, ...menuVars }}
                                  >
                                    Xem thêm
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-lg border py-2 min-w-[200px] overflow-y-auto scrollbar-menu-thin"
                        style={{ 
                          backgroundColor: tokens.dropdownBg, 
                          borderColor: tokens.dropdownBorder,
                          maxHeight: 'min(70vh, 290px)',
                        }}
                      >
                        {item.children.map((child) => (
                          <div key={child._id} className="relative group/menu-node">
                            <a
                              href={child.url}
                              target={child.openInNewTab ? '_blank' : undefined}
                              rel={child.openInNewTab ? 'noreferrer' : undefined}
                              className="flex min-w-0 items-start justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--menu-dropdown-hover-bg)] hover:text-[var(--menu-dropdown-hover-text)]"
                              style={{ color: tokens.dropdownItemText, ...menuVars }}
                            >
                              <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{child.label}</span>
                              {child.children.length > 0 && <ChevronRight size={10} className="transition-transform duration-200 group-hover/menu-node:rotate-90" />}
                            </a>
                            {child.children.length > 0 && (
                              <div className="absolute left-full top-0 pl-1 hidden group-hover/menu-node:block">
                                <div className="rounded-lg border py-2 min-w-[180px] overflow-y-auto scrollbar-menu-thin" style={{ backgroundColor: tokens.dropdownBg, borderColor: tokens.dropdownBorder, maxHeight: 'min(70vh, 290px)' }}>
                                  {renderDesktopFlyoutNodes(child.children)}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {menuTree.length === 0 && (
            ['TRANG CHỦ', 'KHÓA HỌC', 'DỰ ÁN', 'VỀ CHÚNG TÔI', 'THƯ VIỆN'].map((label) => (
              <li key={label} style={{ flexShrink: 0 }}>
                <span
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: darkGlassNavText }}
                >
                  {label}
                </span>
              </li>
            ))
          )}
        </ul>
      </nav>
    );

    // Render search + wishlist + cart + login + CTA bên phải
    const renderDarkGlassActions = () => (
      <div className="flex items-center justify-end gap-3" style={{ flexShrink: 0 }}>
        <div className="hidden lg:flex items-center gap-3">
          {/* Search */}
          {showSearch && (
            <div className="flex items-center gap-2">
              <div className={cn('overflow-hidden transition-all duration-200', searchOpen ? 'w-40' : 'w-0')}>
                <input
                  type="text"
                  placeholder={config.search.placeholder ?? 'Tìm kiếm...'}
                  className={cn('w-40 px-3 py-1.5 rounded-full border text-xs focus:outline-none transition-opacity bg-white/10 text-white border-white/20')}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                  }}
                />
              </div>
              <button
                onClick={() => setSearchOpen((prev) => !prev)}
                className="p-2 text-white hover:opacity-80 transition-opacity"
              >
                <Search size={18} />
              </button>
            </div>
          )}

          {/* User Menu / Login */}
          {showUserMenu && renderUserMenu('icon')}
          {showLoginLink && (
            <a
              href={defaultLinks.login}
              className="p-2 text-white hover:opacity-80 transition-opacity"
            >
              <User size={18} />
            </a>
          )}

          {/* Wishlist */}
          {config.wishlist.show && (
            <a
              href={defaultLinks.wishlist}
              className="p-2 text-white hover:opacity-80 transition-opacity"
            >
              <Heart size={18} />
            </a>
          )}

          {/* Dark Mode */}
          {config.showDarkModeToggle && (
            <button className="p-2 text-white hover:opacity-80 transition-opacity">
              <Moon size={18} />
            </button>
          )}

          {/* Cart */}
          {config.cart.show && (
            <a
              href={defaultLinks.cart}
              className="p-2 relative text-white hover:opacity-80 transition-opacity"
            >
              <ShoppingCart size={18} />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#ffffff', color: '#000000' }}
              >
                0
              </span>
            </a>
          )}

          {/* CTA Button */}
          {config.cta.show && (
            <a
              href={defaultLinks.cta}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-[11px] font-semibold uppercase tracking-widest transition-transform hover:scale-105"
              style={{ backgroundColor: tokens.primary, color: tokens.textInverse, padding: '8px 18px' }}
            >
              {ctaLabel}
            </a>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-md"
          style={{ color: '#ffffff' }}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className="w-full h-0.5 rounded" style={{ backgroundColor: '#ffffff' }} />
            <span className="w-full h-0.5 rounded" style={{ backgroundColor: '#ffffff' }} />
            <span className="w-full h-0.5 rounded" style={{ backgroundColor: '#ffffff' }} />
          </div>
        </button>
      </div>
    );

    // Render logo block
    const renderDarkGlassLogo = (size: number) => (
      <div className="flex items-center" style={{ flexShrink: 0 }}>
        {logo ? (
          <img
            src={logo}
            alt={brandLabel}
            style={{ width: size, height: 'auto', objectFit: 'contain' }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-xl text-xs font-bold"
            style={{ width: size, height: size, backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
          >
            {brandLabel.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    );

    return (
      <div style={{ position: 'relative' }}>
        {/* ── Pill Sticky Header (trạng thái đặc trưng của Dark Glass) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            width: '96%',
            margin: '12px auto 0',
            height: device === 'mobile' ? 72 : 88,
            padding: device === 'mobile' ? '0 16px' : '0 28px',
            background: darkGlassPillBg,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Logo */}
          {renderDarkGlassLogo(device === 'mobile' ? Math.min(48, pillLogoSize) : pillLogoSize)}

          {/* Nav (desktop) */}
          {renderDarkGlassNav()}

          {/* Actions */}
          {renderDarkGlassActions()}
        </div>

        {/* ── Mobile Menu Overlay ── */}
        {device === 'mobile' && mobileMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '80%',
              background: 'rgba(0,0,0,0.95)',
              backdropFilter: 'blur(16px)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              zIndex: 60,
              borderRadius: '0 0 0 16px',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {renderDarkGlassLogo(40)}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
              >
                ✕
              </button>
            </div>
            <nav style={{ padding: '12px 0' }}>
              {(menuTree.length > 0 ? menuTree : [
                { label: 'TRANG CHỦ' }, { label: 'KHÓA HỌC' }, { label: 'DỰ ÁN' }, { label: 'VỀ CHÚNG TÔI' }, { label: 'THƯ VIỆN' },
              ]).map((item, i) => (
                <a
                  key={'_id' in item ? item._id : i}
                  href={'url' in item ? item.url : '#'}
                  style={{ display: 'block', padding: '10px 20px', color: '#ffffff', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            {config.cta.show && (
              <div style={{ padding: '12px 20px' }}>
                <a
                  href={defaultLinks.cta}
                  style={{ display: 'block', width: '100%', textAlign: 'center', padding: '10px', background: '#ffffff', color: '#000000', borderRadius: 9999, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}
                >
                  {ctaLabel}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: tokens.border }}>
      {resolvedStyle === 'classic' && renderClassicStyle()}
      {resolvedStyle === 'topbar' && renderTopbarStyle()}
      {resolvedStyle === 'allbirds' && renderAllbirdsStyle()}
      {resolvedStyle === 'darkglass' && renderDarkGlassStyle()}

      <div className="p-4 space-y-3" style={{ backgroundColor: tokens.surfaceAlt }}>
        <div className="h-32 rounded-lg flex items-center justify-center" style={{ backgroundColor: tokens.placeholderBg }}>
          <span className="text-sm" style={{ color: tokens.placeholderText }}>Content Area</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 rounded-lg" style={{ backgroundColor: tokens.placeholderBg }}></div>
          <div className="h-20 rounded-lg" style={{ backgroundColor: tokens.placeholderBg }}></div>
          <div className="h-20 rounded-lg" style={{ backgroundColor: tokens.placeholderBg }}></div>
        </div>
      </div>
    </div>
  );
}
