'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings, useSocialLinks } from './hooks';
import { getFooterThemeColors } from '@/app/admin/home-components/footer/_lib/colors';
import { getFooterCornerRadiusClassName, getFooterLogoBackgroundClassName, getFooterLogoBackgroundStyle, getFooterLogoSize, getFooterMaxWidthClass, getFooterSectionSpacingClassName } from '@/app/admin/home-components/footer/_lib/constants';
import type { FooterBrandMode, FooterCornerRadius, FooterLogoBackgroundStyle, FooterStyle } from '@/app/admin/home-components/footer/_types';
import { resolveTypeOverrideColors } from '@/app/admin/home-components/_shared/lib/typeColorOverride';
import { resolveTypeOverrideFont } from '@/app/admin/home-components/_shared/lib/typeFontOverride';
import { getIconNode } from '@/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared';
import { useSnapshotDemoContext } from '@/components/modules/homepage/SnapshotDemoProvider';

interface SocialLinkItem { id: number; platform: string; url: string; icon: string }
interface FooterConfig {
  logo?: string;
  logoName?: string;
  description?: string;
  maxWidth?: '6xl' | '7xl' | '8xl' | '9xl';
  logoSizeLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  logoBackgroundStyle?: FooterLogoBackgroundStyle;
  cornerRadius?: FooterCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  columns?: { id: number; title: string; links: { label: string; url: string }[] }[];
  socialLinks?: SocialLinkItem[];
  copyright?: string;
  showCopyright?: boolean;
  showBctLogo?: boolean;
  bctLogoType?: 'thong-bao' | 'dang-ky';
  bctLogoLink?: string;
  showSocialLinks?: boolean;
  useOriginalSocialIconColors?: boolean;
  spacing?: 'normal' | 'compact' | 'none';
  style?: 'classic' | 'modern' | 'corporate' | 'minimal' | 'centered' | 'stacked';
}

// Social icons based on platform
const SocialIcon = ({ platform, size = 18 }: { platform: string; size?: number }) => {
  return getIconNode(platform, size);
};

const SOCIAL_ORIGINAL_COLORS: Record<string, { bg: string; icon: string }> = {
  facebook: { bg: '#1877f2', icon: '#ffffff' },
  instagram: { bg: '#e1306c', icon: '#ffffff' },
  youtube: { bg: '#ff0000', icon: '#ffffff' },
  tiktok: { bg: '#000000', icon: '#ffffff' },
  zalo: { bg: '#0084ff', icon: '#ffffff' },
  messenger: { bg: '#0084ff', icon: '#ffffff' },
  telegram: { bg: '#26a5e4', icon: '#ffffff' },
  shopee: { bg: '#ee4d2d', icon: '#ffffff' },
  lazada: { bg: '#0f1689', icon: '#ffffff' },
  tiki: { bg: '#1a94ff', icon: '#ffffff' },
  twitter: { bg: '#1da1f2', icon: '#ffffff' },
  x: { bg: '#000000', icon: '#ffffff' },
  pinterest: { bg: '#E60023', icon: '#ffffff' },
  linkedin: { bg: '#0a66c2', icon: '#ffffff' },
  github: { bg: '#0f172a', icon: '#ffffff' },
  phone: { bg: '#ef4444', icon: '#ffffff' },
  mail: { bg: '#ea580c', icon: '#ffffff' },
  'map-pin': { bg: '#f97316', icon: '#ffffff' },
};

export function DynamicFooter() {
  const snapshotDemo = useSnapshotDemoContext();
  const systemColors = useBrandColors();
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const resolvedColors = resolveTypeOverrideColors({
    type: 'Footer',
    systemColors,
    overrides: systemConfig?.typeColorOverrides ?? null,
  });
  const resolvedFont = resolveTypeOverrideFont({
    type: 'Footer',
    overrides: systemConfig?.typeFontOverrides ?? null,
    globalOverride: systemConfig?.globalFontOverride ?? null,
  });
  const fontStyle = { '--font-active': `var(${resolvedFont.fontVariable})` } as React.CSSProperties;
  const wrapWithFont = (node: React.ReactNode) => (
    <div className="font-active" style={fontStyle}>{node}</div>
  );
  const { primary: brandColor, secondary, mode } = resolvedColors;
  const { siteName, logo: siteLogo, isDark } = useSiteSettings();
  const socialLinks = useSocialLinks();
  const components = useQuery(api.homeComponents.listActive);
  
  const footerComponent = React.useMemo(() => {
    if (snapshotDemo) {
      return null;
    }
    if (!components) {return null;}
    return components.find(c => c.type === 'Footer' && c.active);
  }, [components, snapshotDemo]);

  const currentYear = new Date().getFullYear();

  // Get socials from config or from settings
  const getSocials = (config: FooterConfig) => {
    if (config.socialLinks && config.socialLinks.length > 0) {
      return config.socialLinks;
    }
    // Fallback to settings socials
    const settingSocials: SocialLinkItem[] = [];
    if (socialLinks.facebook) {settingSocials.push({ icon: 'facebook', id: 1, platform: 'facebook', url: socialLinks.facebook });}
    if (socialLinks.instagram) {settingSocials.push({ icon: 'instagram', id: 2, platform: 'instagram', url: socialLinks.instagram });}
    if (socialLinks.youtube) {settingSocials.push({ icon: 'youtube', id: 3, platform: 'youtube', url: socialLinks.youtube });}
    if (socialLinks.tiktok) {settingSocials.push({ icon: 'tiktok', id: 4, platform: 'tiktok', url: socialLinks.tiktok });}
    if (socialLinks.zalo) {settingSocials.push({ icon: 'zalo', id: 5, platform: 'zalo', url: socialLinks.zalo });}
    if (socialLinks.twitter) {settingSocials.push({ icon: 'x', id: 6, platform: 'x', url: socialLinks.twitter });}
    if (socialLinks.pinterest) {settingSocials.push({ icon: 'pinterest', id: 7, platform: 'pinterest', url: socialLinks.pinterest });}
    return settingSocials.length > 0 ? settingSocials : [
      { icon: 'facebook', id: 1, platform: 'facebook', url: '#' },
      { icon: 'instagram', id: 2, platform: 'instagram', url: '#' },
      { icon: 'youtube', id: 3, platform: 'youtube', url: '#' },
    ];
  };

  // Default columns
  const getColumns = (config: FooterConfig) => {
    if (config.columns && config.columns.length > 0) {
      return config.columns;
    }
    return [
      { id: 1, links: [{ label: 'Giới thiệu', url: '/about' }, { label: 'Tuyển dụng', url: '/careers' }, { label: 'Đội ngũ', url: '/team' }, { label: 'Tin tức', url: '/blog' }], title: 'Về chúng tôi' },
      { id: 2, links: [{ label: 'FAQ', url: '/faq' }, { label: 'Liên hệ', url: '/contact' }, { label: 'Chính sách', url: '/policy' }, { label: 'Báo cáo', url: '/report' }], title: 'Hỗ trợ' }
    ];
  };

  // Fallback footer nếu không có Footer component
  const fallbackBgDark = getFooterThemeColors('classic', brandColor, secondary, mode as FooterBrandMode, isDark).bg;
  if (!footerComponent && !snapshotDemo) {
    return wrapWithFont(
      <footer className="text-white" style={{ backgroundColor: fallbackBgDark }}>
        <div className="py-6 px-4">
          <p className="text-center text-sm text-slate-500">
            © {currentYear} {siteName ?? 'VietAdmin'}. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  const config = (footerComponent?.config ?? {}) as FooterConfig;
  const style = (config.style ?? 'classic') as FooterStyle;
  const logo = config.logo ?? siteLogo;
  const logoName = typeof config.logoName === 'string' ? config.logoName.trim() : '';
  const logoAlt = logoName || siteName || 'Logo';

  const logoSizeLevel = config.logoSizeLevel ?? 1;
  const resolveLogoSize = (baseSize: number) => getFooterLogoSize(baseSize, logoSizeLevel);
  const socials = getSocials(config);
  const columns = getColumns(config);
  const colors = getFooterThemeColors(style, brandColor, secondary, mode as FooterBrandMode, isDark);
  const useOriginalSocialIconColors = config.useOriginalSocialIconColors !== false;
  const maxWidthClass = getFooterMaxWidthClass(config.maxWidth);
  const waveMaxWidthClass = maxWidthClass === 'max-w-6xl' || maxWidthClass === 'max-w-7xl' ? 'max-w-8xl' : maxWidthClass;
  const logoBackgroundStyle = config.logoBackgroundStyle ?? 'none';
  const sectionSpacingClassName = getFooterSectionSpacingClassName(config.spacing, config.noVerticalMargin);
  const cornerRadius = config.noBorderRadius === true ? 'none' : config.cornerRadius;
  const socialRadiusClassName = getFooterCornerRadiusClassName(cornerRadius, 'icon');
  const showBctLogo = config.showBctLogo === true;
  const bctLogoType = config.bctLogoType ?? 'thong-bao';
  const bctLogoLink = typeof config.bctLogoLink === 'string' ? config.bctLogoLink.trim() : '';
  const bctLogoSrc = bctLogoType === 'dang-ky'
    ? '/images/bct/logo-da-dang-ky-bct.webp'
    : '/images/bct/logo-da-thong-bao-bct.png';
  const renderBctLogo = (className = 'h-14') => {
    if (!showBctLogo) {return null;}
    const image = (
      <Image
        src={bctLogoSrc}
        alt="Bộ Công Thương"
        width={120}
        height={40}
        className={`${className} w-auto object-contain`}
        mode="decorative"
      />
    );
    if (!bctLogoLink) {return image;}
    return (
      <a href={bctLogoLink} target="_blank" rel="noopener noreferrer">
        {image}
      </a>
    );
  };
  const renderLogoMark = (baseSize: number, className = 'object-contain') => {
    if (!logo) {return null;}
    const size = resolveLogoSize(baseSize);
    const image = (
      <Image
        src={logo}
        alt={logoAlt}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: 'auto' }}
        mode="logo"
      />
    );

    if (logoBackgroundStyle === 'none') {
      return image;
    }

    return (
      <span
        className={getFooterLogoBackgroundClassName(logoBackgroundStyle, cornerRadius)}
        style={getFooterLogoBackgroundStyle(logoBackgroundStyle, colors.primary)}
      >
        {image}
      </span>
    );
  };
  const resolveSocialStyles = (platform: string, fallbackBg: string, fallbackText: string) => {
    if (!useOriginalSocialIconColors) {
      return { bg: fallbackBg, color: fallbackText, border: '' };
    }

    const original = SOCIAL_ORIGINAL_COLORS[platform];
    if (!original) {
      return { bg: fallbackBg, color: fallbackText, border: '' };
    }

    // Dark icon on dark footer → add white border ring for visibility
    const isIconDark = original.bg.toLowerCase() <= '#333333';
    const isFooterDark = colors.bg.toLowerCase() <= '#444444';
    const border = (isIconDark && isFooterDark) ? '1.5px solid rgba(255,255,255,0.25)' : '';

    return { bg: original.bg, color: original.icon, border };
  };

  // Style 1: Classic — 4-Column Grid (Lofi Gym style)
  // Dark bg, logo+desc left, 2 link cols center, social+BCT right, separate copyright bar
  if (style === 'classic') {
    return wrapWithFont(
      <footer className="w-full" style={{ backgroundColor: colors.classicBg }}>
        {/* Main Grid Content */}
        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 ${sectionSpacingClassName}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Brand + Description Column */}
            <div className="lg:col-span-4 space-y-4">
              <Link href="/" className="inline-block">
                {renderLogoMark(40)}
              </Link>
              {logoName && <h3 className="text-lg font-bold tracking-tight" style={{ color: colors.heading }}>{logoName}</h3>}
              <p className="text-sm leading-relaxed opacity-80" style={{ color: colors.textMuted }}>
                {config.description ?? 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ và sáng tạo kỹ thuật số.'}
              </p>
            </div>

            {/* Dynamic Link Columns — up to 4 columns */}
            <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              {columns.slice(0, 4).map((col, colIdx) => (
                <div key={col.id || `col-${colIdx}`}>
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4 pb-2" style={{ color: colors.heading, borderBottom: `2px solid ${colors.borderSoft}` }}>{col.title}</h3>
                  <ul className="space-y-2.5">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link href={link.url || '#'} className="text-sm block" style={{ color: colors.link, transition: 'color 0.3s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = colors.link; }}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Social + BCT Column */}
            <div className="lg:col-span-2 space-y-5">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4 pb-2" style={{ color: colors.heading, borderBottom: `2px solid ${colors.borderSoft}` }}>Kết nối</h3>
              {config.showSocialLinks !== false && (
                <div className="flex flex-wrap gap-2.5">
                  {socials.map((s, idx) => {
                    const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                    return (
                      <a key={s.id || `social-${idx}`} href={s.url || '#'} target="_blank" rel="noopener noreferrer"
                        className={`h-10 w-10 flex items-center justify-center ${socialRadiusClassName} transition-all hover:scale-110`}
                        style={{ backgroundColor: socialStyles.bg, color: socialStyles.color, transition: 'transform 0.3s ease', ...(socialStyles.border ? { border: socialStyles.border } : {}) }}>
                        <SocialIcon platform={s.platform} size={20} />
                      </a>
                    );
                  })}
                </div>
              )}
              {renderBctLogo('h-14')}
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar — separated with border */}
        {config.showCopyright !== false && (
          <div style={{ borderTop: `1px solid ${colors.borderSoft}` }}>
            <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 py-4`}>
              <div className="flex items-center justify-center">
                <p className="text-xs opacity-70" style={{ color: colors.textSubtle }}>
                  {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </footer>
    );
  }

  // Style 2: Modern — Info-Rich (Sudes Nest inspired)
  // Seigaiha wave pattern overlay, diamond heading decorators, 4-column grid
  if (style === 'modern') {
    // Seigaiha (wave) pattern via inline SVG — concentric arcs, brand-aware
    const pc = colors.accent.replace('#', '%23');
    const seigaihaUrl = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='28'%3E%3Cpath d='M56 26v2h-7.75c2.3-1.3 4.94-2 7.75-2zm-26 2a14 14 0 0 0-7.75-2h-4.5A14 14 0 0 0 10 28H0v-2c4.26 0 8.17 1.38 11.36 3.7A13.98 13.98 0 0 1 22 26c3.87 0 7.44 1.56 10 4.1a13.98 13.98 0 0 1 10.64-3.7A15.99 15.99 0 0 1 56 26zM56 20v2c-4.26 0-8.17 1.38-11.36 3.7A13.98 13.98 0 0 0 34 22c-3.87 0-7.44 1.56-10 4.1A13.98 13.98 0 0 0 13.36 22.4 15.99 15.99 0 0 0 0 20v2c4.26 0 8.17-1.38 11.36-3.7A13.98 13.98 0 0 1 22 14c3.87 0 7.44 1.56 10 4.1A13.98 13.98 0 0 1 42.64 14.4 15.99 15.99 0 0 1 56 14v2c-4.26 0-8.17 1.38-11.36 3.7A13.98 13.98 0 0 0 34 16c-3.87 0-7.44 1.56-10 4.1A13.98 13.98 0 0 0 13.36 16.4 15.99 15.99 0 0 0 0 14v2a14 14 0 0 1 11.36 3.7A13.98 13.98 0 0 0 22 8c3.87 0 7.44 1.56 10 4.1A13.98 13.98 0 0 0 42.64 8.4 15.99 15.99 0 0 0 56 8v2c-4.26 0-8.17 1.38-11.36 3.7A13.98 13.98 0 0 1 34 10c-3.87 0-7.44 1.56-10 4.1A13.98 13.98 0 0 1 13.36 10.4 15.99 15.99 0 0 1 0 8V6c4.26 0 8.17 1.38 11.36 3.7A13.98 13.98 0 0 0 22 2c3.87 0 7.44 1.56 10 4.1A13.98 13.98 0 0 0 42.64 2.4 15.99 15.99 0 0 0 56 2V0H0v2a14 14 0 0 1 11.36 3.7A13.98 13.98 0 0 0 22-4c3.87 0 7.44 1.56 10 4.1A13.98 13.98 0 0 0 42.64-3.6 15.99 15.99 0 0 0 56-4' fill='none' stroke='${pc}' stroke-opacity='0.12' stroke-width='0.5'/%3E%3C/svg%3E")`;

    return wrapWithFont(
      <footer className="w-full relative" style={{ backgroundColor: colors.bg }}>
        {/* Seigaiha wave pattern overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: seigaihaUrl, backgroundSize: '56px 28px' }} />

        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 ${sectionSpacingClassName} relative`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Brand Zone */}
            <div className="lg:col-span-4 space-y-5">
              <Link href="/" className="inline-block">
                {renderLogoMark(48)}
              </Link>
              {logoName && <h3 className="text-base font-bold tracking-tight" style={{ color: colors.heading }}>{logoName}</h3>}
              {config.description && (
                <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{config.description}</p>
              )}
              {config.showSocialLinks !== false && (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {socials.map((s, idx) => {
                    const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                    return (
                      <a key={s.id || `social-${idx}`} href={s.url || '#'} target="_blank" rel="noopener noreferrer"
                        className={`h-10 w-10 flex items-center justify-center ${socialRadiusClassName} transition-all hover:scale-110`}
                        style={{ backgroundColor: socialStyles.bg, color: socialStyles.color, transition: 'transform 0.3s ease', ...(socialStyles.border ? { border: socialStyles.border } : {}) }}>
                        <SocialIcon platform={s.platform} size={20} />
                      </a>
                    );
                  })}
                </div>
              )}
              {renderBctLogo('h-14')}
            </div>

            {/* Link Columns — up to 4 columns */}
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              {columns.slice(0, 4).map((col, colIdx) => (
                <div key={col.id || `col-${colIdx}`}>
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4 pb-2 flex items-center gap-2" style={{ color: colors.heading, borderBottom: `2px solid ${colors.borderSoft}` }}>
                    <span style={{ color: colors.accent, fontSize: '10px' }}>◆</span> {col.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link href={link.url || '#'} className="text-sm block" style={{ color: colors.link, transition: 'color 0.2s, padding-left 0.2s', paddingLeft: '4px' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; e.currentTarget.style.paddingLeft = '10px'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = colors.link; e.currentTarget.style.paddingLeft = '4px'; }}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright Bar — full width dark strip */}
        {config.showCopyright !== false && (
          <div className="w-full relative" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 py-4 flex items-center justify-center`}>
              <p className="text-xs font-medium" style={{ color: colors.textSubtle }}>
                {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
              </p>
            </div>
          </div>
        )}
      </footer>
    );
  }

  // Style 3: Corporate — Split Horizontal Zones (Wolf Cookware style)
  // Zone 1: brand+desc | social icons (horizontal) → Zone 2: 4 link columns
  if (style === 'corporate') {
    return wrapWithFont(
      <footer className={`w-full ${sectionSpacingClassName}`} style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6`}>
          {/* Zone 1: Brand Identity + Social */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div className="md:col-span-5 space-y-2">
              <Link href="/" className="flex items-center gap-2">
                {renderLogoMark(24)}
                {logoName && <span className="text-base font-bold" style={{ color: colors.heading }}>{logoName}</span>}
              </Link>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                {config.description ?? 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ và sáng tạo kỹ thuật số.'}
              </p>
            </div>
            <div className="md:col-span-4">
              {renderBctLogo('h-12')}
            </div>
            <div className="md:col-span-3">
              {config.showSocialLinks !== false && (
                <>
                  <h3 className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: colors.heading }}>Theo dõi chúng tôi</h3>
                  <div className="flex flex-wrap gap-2">
                    {socials.map((s, idx) => {
                      const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                      return (
                        <a key={s.id || `social-${idx}`} href={s.url || '#'} target="_blank" rel="noopener noreferrer"
                          className={`h-10 w-10 flex items-center justify-center ${socialRadiusClassName} transition-colors`}
                          style={{ backgroundColor: socialStyles.bg, color: socialStyles.color, ...(socialStyles.border ? { border: socialStyles.border } : {}) }}>
                          <SocialIcon platform={s.platform} size={20} />
                        </a>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Zone 2: Link Columns Grid — up to 4 columns */}
          <div className="py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {columns.slice(0, 4).map((col, colIdx) => (
              <div key={col.id || `col-${colIdx}`}>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.url || '#'} className="text-sm transition-colors block" style={{ color: colors.link }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.link; }}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Copyright */}
          {config.showCopyright !== false && (
            <div className="pt-3 flex items-center justify-center" style={{ borderTop: `1px solid ${colors.borderSoft}` }}>
              <p className="text-xs" style={{ color: colors.textSubtle }}>
                {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
              </p>
            </div>
          )}
        </div>
      </footer>
    );
  }

  // Style 4: Minimal — Compact Bar (Sudes Craft inspired)
  // 3-column: brand+contact | link grid | utility+BCT, with diagonal stripe pattern
  if (style === 'minimal') {
    // Diagonal stripe pattern — subtle texture overlay
    const stripeColor = `${colors.accent}10`;
    const stripeBg = `repeating-linear-gradient(45deg, transparent, transparent 10px, ${stripeColor} 10px, ${stripeColor} 11px)`;

    return wrapWithFont(
      <footer className="w-full relative" style={{ backgroundColor: colors.bg }}>
        {/* Diagonal stripe pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: stripeBg }} />

        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 ${sectionSpacingClassName} relative`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Brand + Social */}
            <div className="lg:col-span-4 space-y-4">
              <Link href="/" className="inline-block">
                {renderLogoMark(44)}
              </Link>
              {logoName && <h3 className="text-base font-bold tracking-tight" style={{ color: colors.heading }}>{logoName}</h3>}
              {config.description && (
                <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{config.description}</p>
              )}
              {config.showSocialLinks !== false && (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {socials.map((s, idx) => {
                    const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                    return (
                      <a key={s.id || `social-${idx}`} href={s.url || '#'} target="_blank" rel="noopener noreferrer"
                        className={`h-10 w-10 flex items-center justify-center ${socialRadiusClassName} transition-all hover:scale-110`}
                        style={{ backgroundColor: socialStyles.bg, color: socialStyles.color, transition: 'transform 0.3s ease', ...(socialStyles.border ? { border: socialStyles.border } : {}) }}>
                        <SocialIcon platform={s.platform} size={20} />
                      </a>
                    );
                  })}
                </div>
              )}
              {renderBctLogo('h-14')}
            </div>

            {/* Link Columns — up to 4 columns */}
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              {columns.slice(0, 4).map((col, colIdx) => (
                <div key={col.id || `col-${colIdx}`}>
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: colors.heading }}>{col.title}</h3>
                  <ul className="space-y-2.5">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link href={link.url || '#'} className="text-sm block" style={{ color: colors.link, transition: 'color 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = colors.link; }}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright Bar — dark strip */}
        {config.showCopyright !== false && (
          <div className="w-full relative" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 py-3.5 flex items-center justify-center`}>
              <p className="text-xs" style={{ color: colors.textSubtle }}>
                {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
              </p>
            </div>
          </div>
        )}
      </footer>
    );
  }

  // Style 5: Centered — Magazine 4-Column (Bean Cargo inspired)
  // Clean editorial: light bg, 4 equal columns, brand-color copyright strip
  if (style === 'centered') {
    return wrapWithFont(
      <footer className="w-full" style={{ backgroundColor: colors.magazineBg }}>
        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 ${sectionSpacingClassName}`}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10">
            {/* Brand + Social */}
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                {renderLogoMark(44)}
              </Link>
              {logoName && <h3 className="text-base font-bold tracking-tight" style={{ color: colors.magazineHeading }}>{logoName}</h3>}
              {config.description && (
                <p className="text-sm leading-relaxed" style={{ color: colors.magazineTextMuted }}>{config.description}</p>
              )}
              {config.showSocialLinks !== false && (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {socials.map((s, idx) => {
                    const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                    return (
                      <a key={s.id || `social-${idx}`} href={s.url || '#'} target="_blank" rel="noopener noreferrer"
                        className={`h-10 w-10 flex items-center justify-center ${socialRadiusClassName} transition-all hover:scale-110`}
                        style={{ backgroundColor: socialStyles.bg, color: socialStyles.color, transition: 'transform 0.3s ease', ...(socialStyles.border ? { border: socialStyles.border } : {}) }}>
                        <SocialIcon platform={s.platform} size={20} />
                      </a>
                    );
                  })}
                </div>
              )}
              {renderBctLogo('h-14')}
            </div>

            {/* Link Columns — up to 4 columns */}
            {columns.slice(0, 4).map((col, colIdx) => (
              <div key={col.id || `col-${colIdx}`}>
                <h3 className="font-bold text-sm tracking-wide mb-4" style={{ color: colors.magazineHeading }}>{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.url || '#'} className="text-sm block" style={{ color: colors.magazineLink, transition: 'color 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.magazineLinkHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.magazineLink; }}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright Bar — brand primary color strip */}
        {config.showCopyright !== false && (
          <div className="w-full" style={{ backgroundColor: colors.primary }}>
            <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 py-3.5 flex items-center justify-center`}>
              <p className="text-xs font-medium" style={{ color: colors.textOnPrimary }}>
                {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
              </p>
            </div>
          </div>
        )}
      </footer>
    );
  }

  // Style 6: Stacked — Wave Decorative (Euro Moto parallax wave, default fallback)
  // Multi-layer animated wave SVG, brand-colored bg with topographic pattern, 4-column grid
  return wrapWithFont(
    <footer className="w-full relative overflow-x-clip" style={{ backgroundColor: 'transparent' }}>
      {/* Parallax Wave Animation — exact Euro Moto technique */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes footerWaveMove {
          0% { transform: translate3d(-90px, 0, 0); }
          100% { transform: translate3d(85px, 0, 0); }
        }
        .footer-wave-parallax > use {
          animation: footerWaveMove 25s cubic-bezier(.55,.5,.45,.5) infinite;
        }
        .footer-wave-parallax > use:nth-child(1) {
          animation-delay: -2s; animation-duration: 7s; opacity: 0.7;
        }
        .footer-wave-parallax > use:nth-child(2) {
          animation-delay: -3s; animation-duration: 10s; opacity: 0.5;
        }
        .footer-wave-parallax > use:nth-child(3) {
          animation-delay: -4s; animation-duration: 13s; opacity: 0.3;
        }
        .footer-wave-parallax > use:nth-child(4) {
          animation-delay: -5s; animation-duration: 20s; opacity: 1;
        }
      `}} />
      <div className="w-full relative" style={{ marginBottom: '-1px' }}>
        <svg
          className="w-full block h-16 sm:h-20 md:h-24 lg:h-28"
          viewBox="0 24 150 28"
          preserveAspectRatio="none"
          shapeRendering="auto"
          fill={colors.stackedTopBorder}
        >
          <defs>
            <path id="footer-gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g className="footer-wave-parallax">
            <use xlinkHref="#footer-gentle-wave" x="48" y="0" />
            <use xlinkHref="#footer-gentle-wave" x="48" y="3" />
            <use xlinkHref="#footer-gentle-wave" x="48" y="5" />
            <use xlinkHref="#footer-gentle-wave" x="48" y="7" />
          </g>
        </svg>
      </div>

      {/* Main content — brand bg with topographic pattern */}
      <div className="relative" style={{ backgroundColor: colors.stackedTopBorder }}>
        {/* Topographic pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='600' height='600' viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='1'%3E%3Cellipse cx='300' cy='300' rx='280' ry='200'/%3E%3Cellipse cx='300' cy='300' rx='220' ry='160'/%3E%3Cellipse cx='300' cy='300' rx='160' ry='120'/%3E%3Cellipse cx='300' cy='300' rx='100' ry='80'/%3E%3Cellipse cx='300' cy='300' rx='50' ry='40'/%3E%3Cellipse cx='150' cy='150' rx='120' ry='80'/%3E%3Cellipse cx='150' cy='150' rx='80' ry='50'/%3E%3Cellipse cx='150' cy='150' rx='40' ry='25'/%3E%3Cellipse cx='480' cy='420' rx='100' ry='70'/%3E%3Cellipse cx='480' cy='420' rx='60' ry='40'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px',
        }} />

        <div className={`container ${waveMaxWidthClass} mx-auto px-4 md:px-5 ${sectionSpacingClassName} relative z-10`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6">
            {/* Brand + Description Column */}
            <div className="lg:col-span-3 space-y-3">
              <Link href="/" className="inline-block">
                {renderLogoMark(34, 'object-contain brightness-110')}
              </Link>
              {logoName && <h3 className="text-base font-bold tracking-tight" style={{ color: colors.stackedTextOnBg }}>{logoName}</h3>}
              <p className="text-sm leading-relaxed opacity-85 max-w-xs" style={{ color: colors.stackedTextOnBg }}>
                {config.description ?? 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ và sáng tạo kỹ thuật số.'}
              </p>
            </div>

            {/* Link Columns — up to 4 */}
            <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {columns.slice(0, 4).map((col, colIdx) => (
                <div key={col.id || `col-${colIdx}`}>
                  <h3 className="font-bold text-xs uppercase tracking-wider mb-2.5 pb-1.5" style={{ color: colors.stackedTextOnBg, borderBottom: '1px solid rgba(255,255,255,0.22)' }}>{col.title}</h3>
                  <ul className="space-y-1.5">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link href={link.url || '#'} className="text-sm transition-all block opacity-75 hover:opacity-100 hover:translate-x-0.5" style={{ color: colors.stackedTextOnBg }}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Social + BCT Column */}
            <div className="lg:col-span-3 space-y-3">
              {config.showSocialLinks !== false && (
                <>
                  <h3 className="font-bold text-xs uppercase tracking-wider mb-2.5 pb-1.5" style={{ color: colors.stackedTextOnBg, borderBottom: '1px solid rgba(255,255,255,0.22)' }}>Liên kết</h3>
                  <div className="flex flex-wrap gap-2">
                    {socials.map((s, idx) => {
                      const socialStyles = resolveSocialStyles(s.platform, colors.stackedSocialBg, colors.stackedSocialText);
                      return (
                        <a key={s.id || `social-${idx}`} href={s.url || '#'} target="_blank" rel="noopener noreferrer"
                          className={`h-9 w-9 flex items-center justify-center ${socialRadiusClassName} transition-transform hover:scale-105`}
                          style={{ backgroundColor: socialStyles.bg, color: socialStyles.color, ...(socialStyles.border ? { border: socialStyles.border } : {}) }}>
                          <SocialIcon platform={s.platform} size={18} />
                        </a>
                      );
                    })}
                  </div>
                </>
              )}
              {renderBctLogo('h-12')}
            </div>
          </div>
        </div>

        {/* Copyright Bar — Euro Moto style: subtle white border-top */}
        {config.showCopyright !== false && (
          <div className="relative z-10" style={{ borderTop: '0.8px solid rgba(255,255,255,0.3)' }}>
            <div className={`container ${waveMaxWidthClass} mx-auto px-4 md:px-5 py-3`}>
              <div className="flex items-center justify-center">
                <p className="text-xs text-center opacity-70" style={{ color: colors.stackedTextOnBg }}>
                  {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
