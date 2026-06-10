'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { getBuilderOverlayColors, getCardsColors, getCounterColors, getGradientColors, getHorizontalColors, getIconsColors, getMinimalColors, getSolarHeroColors } from '@/app/admin/home-components/stats/_lib/colors';
import { AnimatedValue } from '@/app/admin/home-components/stats/_components/AnimatedValue';
import {
  getStatsBottomCornerRadiusClassName,
  getStatsCornerRadiusClassName,
  getStatsSectionSpacingClassName,
  getStatsTopCornerRadiusClassName,
  normalizeStatsCornerRadius,
  normalizeStatsSpacing,
  type StatsItem,
  type StatsStyle,
} from '@/app/admin/home-components/stats/_types';
import type { HomeComponentSectionProps } from '../types';

const resolveIconComponent = (iconName?: string) => {
  if (!iconName) { return Sparkles; }
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>;
  return iconMap[iconName] ?? Sparkles;
};

const getItemAlignClass = (align?: 'left' | 'center' | 'right') => {
  if (align === 'left') { return 'items-start text-left'; }
  if (align === 'right') { return 'items-end text-right'; }
  return 'items-center text-center';
};

const getIconWrapperClass = (align?: 'left' | 'center' | 'right') => {
  if (align === 'left') { return 'flex justify-start'; }
  if (align === 'right') { return 'flex justify-end'; }
  return 'flex justify-center';
};

const getMediaWrapperClass = (mediaPlacement?: 'top' | 'left', mediaAlign?: 'left' | 'center' | 'right') => {
  if (mediaPlacement === 'left') {
    return 'mb-0 flex shrink-0 items-center justify-center self-center';
  }
  return getIconWrapperClass(mediaAlign);
};

const getItemContainerClass = (mediaPlacement?: 'top' | 'left', mediaAlign?: 'left' | 'center' | 'right') => {
  if (mediaPlacement === 'left') {
    return 'flex items-center justify-center gap-2 text-left';
  }
  return `flex flex-col ${getItemAlignClass(mediaAlign)}`;
};

import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export function StatsRuntimeSection({ config, brandColor, secondary, mode, title, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const items = (config.items as StatsItem[]) || [];
  const style = (config.style as StatsStyle) || 'horizontal';
  const headerConfig = extractSectionHeaderConfig(config);
  const desktopColumns = (config.desktopColumns as 3 | 4) || 4;
  const fullWidth = typeof config.fullWidth === 'boolean' ? config.fullWidth : false;
  const mediaPlacement = (config.mediaPlacement as 'top' | 'left') || 'top';
  const mediaAlign = (config.mediaAlign as 'left' | 'center' | 'right') || 'center';
  const backgroundImage = typeof config.backgroundImage === 'string' ? config.backgroundImage : '';
  const enableAnimation = typeof config.enableAnimation === 'boolean' ? config.enableAnimation : false;
  const sectionSpacing = config.noVerticalMargin === true ? 'none' : normalizeStatsSpacing(config.spacing);
  const sectionSpacingClassName = getStatsSectionSpacingClassName(sectionSpacing);
  const cornerRadius = normalizeStatsCornerRadius(config.cornerRadius, config.noBorderRadius);
  const cardRadiusClassName = getStatsCornerRadiusClassName(cornerRadius);
  const cardTopRadiusClassName = getStatsTopCornerRadiusClassName(cornerRadius);
  const cardBottomRadiusClassName = getStatsBottomCornerRadiusClassName(cornerRadius);

  const sharedHeader = (
    <SectionHeader
      title={title}
      subtitle={headerConfig.subtitle}
      badgeText={headerConfig.badgeText}
      hideHeader={headerConfig.hideHeader}
      showTitle={headerConfig.showTitle}
      showSubtitle={headerConfig.showSubtitle}
      showBadge={headerConfig.showBadge}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      brandColor={brandColor}
    />
  );

  const containerClass = fullWidth ? 'w-full' : 'max-w-7xl mx-auto';

  const gc = (cols: 3 | 4) => ({
    grid: cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4',
    tablet: cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
    mobile: cols === 3 ? 'grid-cols-1' : 'grid-cols-2',
  });

  if (style === 'horizontal') {
    const colors = adaptTokensForDarkMode(getHorizontalColors(brandColor, secondary, mode), isDark ?? false);
    const { grid, tablet, mobile } = gc(desktopColumns);
    return (
      <section className={cn(sectionSpacingClassName, 'px-3')}>
        <div className={containerClass}>
          {sharedHeader}
          <div className={cn('w-full overflow-hidden', cardRadiusClassName)} style={{ backgroundColor: colors.sectionBg }}>
            <div className={`grid ${mobile} ${tablet} ${grid} gap-4 py-6 px-6`}>
              {items.slice(0, desktopColumns).map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                const iconEl = item.iconType === 'lucide' && IconCmp
                  ? <IconCmp size={24} className="sm:w-5 sm:h-5 md:w-[26px] md:h-[26px]" style={{ color: colors.iconColor }} />
                  : item.iconType === 'upload' && item.iconUrl
                    ? <img src={item.iconUrl} alt="" className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 object-contain" />
                  : item.iconType === 'url' && item.iconUrl
                    ? <img src={item.iconUrl} alt="" className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-[26px] md:h-[26px] object-contain" />
                    : null;
                return (
                  <div key={idx} className={cn(getItemContainerClass(mediaPlacement, mediaAlign), "justify-center")}>
                    {iconEl && (
                      <div 
                        className={cn(
                          "w-11 h-11 sm:w-12 sm:h-12 md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center shrink-0",
                          mediaPlacement === 'left' ? 'mb-0' : 'mb-2',
                          getMediaWrapperClass(mediaPlacement, mediaAlign)
                        )} 
                        style={{ backgroundColor: colors.iconBg }}
                      >
                        {iconEl}
                      </div>
                    )}
                    <div className={cn("flex flex-col", mediaPlacement === 'left' ? '' : getItemAlignClass(mediaAlign))}>
                      <AnimatedValue value={item.value} enabled={enableAnimation} className="text-[18px] sm:text-[19px] md:text-[26px] font-bold tracking-tight tabular-nums leading-none mb-0.5" style={{ color: colors.valueColor }} />
                      <h3 className="text-[10px] md:text-[13px] font-medium leading-tight" style={{ color: colors.labelColor }}>{item.label}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'cards') {
    const colors = adaptTokensForDarkMode(getCardsColors(brandColor, secondary, mode), isDark ?? false);
    const { grid, tablet, mobile } = gc(desktopColumns);
    return (
      <section className={cn(sectionSpacingClassName, 'px-3')}>
        <div className={containerClass}>
          {sharedHeader}
          <div className={cn('w-full overflow-hidden border', cardRadiusClassName)} style={{ borderColor: colors.border, backgroundColor: colors.sectionBg }}>
            <div className={`grid ${mobile} ${tablet} ${grid} divide-x divide-y divide-gray-200 md:divide-y-0`}>
              {items.slice(0, desktopColumns).map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                const iconEl = item.iconType === 'lucide' && IconCmp
                  ? <IconCmp size={36} className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" style={{ color: colors.iconColor }} />
                  : item.iconType === 'upload' && item.iconUrl
                    ? <img src={item.iconUrl} alt="" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover" />
                  : item.iconType === 'url' && item.iconUrl
                    ? <img src={item.iconUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain" />
                    : null;
                return (
                  <div key={idx} className={cn(getItemContainerClass(mediaPlacement, mediaAlign), "justify-center py-4 px-4")}>
                    {iconEl && (
                      <div className={cn("shrink-0", mediaPlacement === 'left' ? 'mb-0' : 'mb-2', getMediaWrapperClass(mediaPlacement, mediaAlign))}>
                        {iconEl}
                      </div>
                    )}
                    <div className={cn("flex flex-col", mediaPlacement === 'left' ? '' : getItemAlignClass(mediaAlign))}>
                      <AnimatedValue value={item.value} enabled={enableAnimation} className="text-[18px] sm:text-[19px] md:text-[26px] font-bold tracking-tight tabular-nums leading-none mb-0.5" style={{ color: colors.valueColor }} />
                      <h3 className="text-[10px] md:text-[13px] font-medium leading-tight" style={{ color: colors.labelColor }}>{item.label}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'icons') {
    const colors = adaptTokensForDarkMode(getIconsColors(brandColor, secondary, mode), isDark ?? false);
    const { grid, tablet, mobile } = gc(desktopColumns);
    return (
      <section className={cn(sectionSpacingClassName, 'px-3')}>
        <div className={containerClass}>
          {sharedHeader}
          <div className={`grid gap-5 ${mobile} ${tablet} ${grid}`}>
            {items.slice(0, desktopColumns).map((item, idx) => {
              const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
              const hasIcon = item.iconType === 'lucide' || item.iconType === 'url' || item.iconType === 'upload';
              const circleEl = (
                <div className={`relative h-14 w-14 rounded-full flex items-center justify-center border shadow-sm shrink-0 sm:h-16 sm:w-16 md:h-20 md:w-20 ${mediaPlacement === 'left' ? 'mr-2 md:mr-2' : 'mb-1'}`} style={{ backgroundColor: colors.circleBg, borderColor: colors.ring }}>
                  {item.iconType === 'lucide' && IconCmp
                    ? <IconCmp size={29} className="h-6 w-6 sm:h-7 sm:w-7 md:h-[29px] md:w-[29px]" style={{ color: colors.textOnCircle }} />
                    : item.iconType === 'upload' && item.iconUrl
                      ? <img src={item.iconUrl} alt="" className="h-9 w-9 object-contain sm:h-11 sm:w-11 md:h-14 md:w-14" />
                    : item.iconType === 'url' && item.iconUrl
                      ? <img src={item.iconUrl} alt="" className="h-5 w-5 object-contain sm:h-6 sm:w-6 md:h-7 md:w-7" />
                      : <AnimatedValue value={item.value} enabled={enableAnimation} className="z-10 text-base font-bold tracking-tight tabular-nums sm:text-lg md:text-xl" style={{ color: colors.textOnCircle }} />
                  }
                </div>
              );
              return (
                <div key={idx} className={cn(
                  mediaPlacement === 'left'
                    ? 'flex w-full items-center justify-center gap-2 text-left'
                    : getItemContainerClass(mediaPlacement, mediaAlign)
                )}>
                  {circleEl}
                  <div className={mediaPlacement === 'left' ? 'flex w-[76px] min-w-0 shrink-0 flex-col justify-center' : 'flex min-w-0 flex-col items-center justify-center'}>
                    <h3 className="text-xs font-semibold leading-snug sm:text-sm" style={{ color: colors.label }}>{item.label}</h3>
                    {hasIcon && <AnimatedValue value={item.value} enabled={enableAnimation} className="mt-0.5 text-base font-bold tabular-nums sm:mt-1 sm:text-lg" style={{ color: brandColor }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'gradient') {
    const colors = adaptTokensForDarkMode(getGradientColors(brandColor, secondary, mode), isDark ?? false);
    const { grid, tablet, mobile } = gc(desktopColumns);
    return (
      <section className={cn(sectionSpacingClassName, 'px-3')}>
        <div className={containerClass}>
          {sharedHeader}
          <div className={cn('overflow-hidden border', cardRadiusClassName)} style={{ background: colors.background, borderColor: colors.border }}>
            <div className={`grid ${mobile} ${tablet} ${grid}`}>
              {items.slice(0, desktopColumns).map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                const iconEl = item.iconType === 'lucide' && IconCmp
                  ? <IconCmp size={24} style={{ color: colors.text }} />
                  : item.iconType === 'upload' && item.iconUrl
                    ? <img src={item.iconUrl} alt="" className="w-10 h-10 md:w-12 md:h-12 object-cover" />
                  : item.iconType === 'url' && item.iconUrl
                    ? <img src={item.iconUrl} alt="" className="w-6 h-6 object-contain" />
                    : null;
                return (
                  <div key={idx} className={cn(`relative p-5`, getItemContainerClass(mediaPlacement, mediaAlign), idx !== items.slice(0, desktopColumns).length - 1 ? 'md:border-r md:border-white/10' : '')}>
                    {iconEl && (
                      <div className={cn(mediaPlacement === 'left' ? 'mb-0 mr-2' : 'mb-1', getMediaWrapperClass(mediaPlacement, mediaAlign))}>{iconEl}</div>
                    )}
                    <div className={mediaPlacement === 'left' ? 'flex flex-col justify-center' : 'flex flex-col items-center justify-center'}>
                      <AnimatedValue value={item.value} enabled={enableAnimation} className="text-3xl font-extrabold tracking-tight tabular-nums leading-none mb-1.5" style={{ color: colors.text }} />
                      <h3 className="text-xs font-medium opacity-90" style={{ color: colors.label }}>{item.label}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'minimal') {
    const colors = adaptTokensForDarkMode(getMinimalColors(brandColor, secondary, mode), isDark ?? false);
    const { grid, tablet, mobile } = gc(desktopColumns);
    return (
      <section className={cn(sectionSpacingClassName, 'px-3')}>
        <div className={containerClass}>
          {sharedHeader}
          <div className={cn('py-8 px-5', cardRadiusClassName)} style={{ backgroundColor: colors.sectionBg }}>
            <div className={`grid gap-5 ${mobile} ${tablet} ${grid}`}>
              {items.slice(0, desktopColumns).map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                const iconEl = item.iconType === 'lucide' && IconCmp
                  ? <IconCmp size={22} className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px]" style={{ color: colors.accent }} />
                  : item.iconType === 'upload' && item.iconUrl
                    ? <img src={item.iconUrl} alt="" className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 object-cover" />
                  : item.iconType === 'url' && item.iconUrl
                    ? <img src={item.iconUrl} alt="" className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px] object-contain" />
                    : null;
                return (
                  <div key={idx} className={getItemContainerClass(mediaPlacement, mediaAlign)}>
                    {iconEl && (
                      <div className={cn(mediaPlacement === 'left' ? 'mb-0 mr-2' : 'mb-1', getMediaWrapperClass(mediaPlacement, mediaAlign))}>{iconEl}</div>
                    )}
                    <div className={mediaPlacement === 'left' ? 'flex flex-col justify-center' : 'flex flex-col items-center justify-center'}>
                      {mediaPlacement !== 'left' && <div className="w-10 h-0.5 rounded-full mb-2.5" style={{ backgroundColor: colors.accent }} />}
                      <AnimatedValue value={item.value} enabled={enableAnimation} className="text-[22px] sm:text-[27px] md:text-[33px] font-bold tracking-tight tabular-nums leading-none" style={{ color: colors.value }} />
                      <h3 className="text-[11px] md:text-[15px] font-medium mt-1" style={{ color: colors.label }}>{item.label}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'solar-hero') {
    const colors = adaptTokensForDarkMode(getSolarHeroColors(brandColor, secondary, mode), isDark ?? false);
    const gridClass = desktopColumns === 3 ? 'grid-cols-1 sm:grid-cols-3 md:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4';
    return (
      <section
        className={cn('bg-cover bg-center bg-no-repeat px-2', sectionSpacingClassName)}
        style={backgroundImage ? { backgroundImage: `url("${backgroundImage}")` } : { backgroundColor: colors.sectionBg }}
      >
        <div className={containerClass}>
          {sharedHeader}
          <div className={`relative z-[1] grid ${gridClass} gap-2.5`}>
            {items.slice(0, desktopColumns).map((item, idx) => {
              const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
              const iconEl = item.iconType === 'lucide' && IconCmp
                ? <IconCmp size={54} className="h-11 w-11 md:h-[54px] md:w-[54px]" style={{ color: colors.icon }} />
                : (item.iconType === 'upload' || item.iconType === 'url') && item.iconUrl
                  ? <img src={item.iconUrl} alt={item.label || ''} className="h-12 w-12 object-contain md:h-[60px] md:w-[60px]" />
                  : <Sparkles size={54} className="h-11 w-11 md:h-[54px] md:w-[54px]" style={{ color: colors.icon }} />;

              return (
                <article key={idx} className="flex min-w-0 flex-col">
                  <div className={cn('flex items-center justify-between gap-2.5 border px-3 py-3', cardTopRadiusClassName)} style={{ backgroundColor: colors.cardSurface, borderColor: colors.border }}>
                    <div className="min-w-0">
                      <AnimatedValue value={item.value} enabled={enableAnimation} className="mb-2 text-[28px] font-bold leading-none tracking-tight tabular-nums md:text-[38px]" style={{ color: colors.value }} />
                      <h3 className="text-sm font-medium leading-snug" style={{ color: colors.label }}>{item.label}</h3>
                    </div>
                    <div className="shrink-0">{iconEl}</div>
                  </div>
                  <p className={cn('min-h-[84px] flex-1 px-3 py-3 text-sm leading-relaxed', cardBottomRadiusClassName)} style={{ backgroundColor: colors.descriptionBg, color: colors.descriptionText }}>
                    {item.description || `${item.label || 'Số liệu'} nổi bật, khẳng định năng lực và uy tín của thương hiệu.`}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'builder-overlay') {
    const colors = adaptTokensForDarkMode(getBuilderOverlayColors(brandColor, secondary, mode), isDark ?? false);
    const itemWidthClass = desktopColumns === 3
      ? 'basis-full max-w-full sm:basis-1/3 sm:max-w-[33.333333%]'
      : 'basis-1/2 max-w-[50%] sm:basis-1/2 sm:max-w-[50%] md:basis-1/4 md:max-w-[25%]';
    const visibleItems = items.slice(0, desktopColumns);
    return (
      <section
        className={cn('relative bg-cover bg-center bg-no-repeat px-5', sectionSpacingClassName)}
        style={backgroundImage ? { backgroundImage: `url("${backgroundImage}")` } : undefined}
      >
        <div className={containerClass}>
          {sharedHeader}
          <div className={cn('relative min-h-[132px]', backgroundImage && 'min-h-[260px] md:min-h-[320px]')}>
            <div className={cn(
              'p-2.5 font-sans text-sm leading-[23.8px]',
              cardRadiusClassName,
              backgroundImage ? 'absolute bottom-5 left-5 w-[calc(100%-40px)]' : 'w-full',
            )}
            style={{ backgroundColor: `${colors.surface}cc` }}>
              <div className="-mx-2.5 flex flex-row flex-wrap">
                {visibleItems.map((item, idx) => {
                  const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : Sparkles;
                  const hasImage = (item.iconType === 'upload' || item.iconType === 'url') && item.iconUrl;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex w-full items-center justify-center px-2 py-2.5 sm:px-2.5 sm:py-3',
                        itemWidthClass,
                        idx !== visibleItems.length - 1 && 'md:border-r',
                      )}
                      style={idx !== visibleItems.length - 1 ? { borderColor: colors.border } : undefined}
                    >
                      <div className="shrink-0">
                        {hasImage ? (
                          <img src={item.iconUrl} alt={item.label || ''} className="h-9 w-9 object-contain align-middle sm:h-12 sm:w-12 md:h-16 md:w-16" loading="lazy" />
                        ) : (
                          <IconCmp size={64} className="h-9 w-9 sm:h-12 sm:w-12 md:h-16 md:w-16" style={{ color: colors.icon }} />
                        )}
                      </div>
                      <div className="ml-2 flex min-w-0 flex-col sm:ml-3 md:ml-5">
                        <AnimatedValue value={item.value} enabled={enableAnimation} className="text-[24px] font-bold leading-[28px] tracking-normal tabular-nums sm:text-[30px] sm:leading-[36px] md:text-[36px] md:leading-[43.2px]" style={{ color: colors.accent }} />
                        <span className="max-w-[86px] text-[13px] leading-[15px] capitalize sm:max-w-none sm:text-sm sm:leading-[17px] md:text-base md:leading-[19.2px]" style={{ color: colors.label }}>{item.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // counter (default fallback)
  const colors = adaptTokensForDarkMode(getCounterColors(brandColor, secondary, mode), isDark ?? false);
  const { grid, tablet, mobile } = gc(desktopColumns);
  return (
    <section className={cn(sectionSpacingClassName, 'px-3')}>
      <div className={containerClass}>
        {sharedHeader}
        <div className={cn('py-8 px-5', cardRadiusClassName)} style={{ backgroundColor: colors.background }}>
          <div className={`grid gap-5 ${mobile} ${tablet} ${grid}`}>
            {items.slice(0, desktopColumns).map((item, idx) => {
              const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
              const iconEl = item.iconType === 'lucide' && IconCmp
                ? <IconCmp size={22} className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px]" style={{ color: colors.accent }} />
                : item.iconType === 'upload' && item.iconUrl
                  ? <img src={item.iconUrl} alt="" className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 object-cover" />
                : item.iconType === 'url' && item.iconUrl
                  ? <img src={item.iconUrl} alt="" className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px] object-contain" />
                  : null;
              return (
                <div key={idx} className={getItemContainerClass(mediaPlacement, mediaAlign)}>
                  {iconEl && (
                    <div className={cn(mediaPlacement === 'left' ? 'mb-0 mr-2' : 'mb-1', getMediaWrapperClass(mediaPlacement, mediaAlign))}>{iconEl}</div>
                  )}
                  <div className={mediaPlacement === 'left' ? 'flex flex-col justify-center' : 'flex flex-col items-center justify-center'}>
                    {mediaPlacement !== 'left' && <div className="w-10 h-0.5 rounded-full mb-2.5" style={{ backgroundColor: colors.accent }} />}
                    <AnimatedValue value={item.value} enabled={enableAnimation} className="text-[22px] sm:text-[27px] md:text-[33px] font-bold tracking-tight tabular-nums leading-none" style={{ color: colors.value }} />
                    <h3 className="text-[11px] md:text-[15px] font-medium mt-1" style={{ color: colors.label }}>{item.label}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}