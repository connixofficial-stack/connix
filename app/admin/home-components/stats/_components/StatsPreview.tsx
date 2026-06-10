'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { STATS_STYLES } from '../_lib/constants';
import { AnimatedValue } from './AnimatedValue';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import { usePreviewDark } from '../../_shared/components/PreviewWrapper';
import {
  getCardsColors,
  getBuilderOverlayColors,
  getCounterColors,
  getGradientColors,
  getHorizontalColors,
  getIconsColors,
  getMinimalColors,
  getSolarHeroColors,
} from '../_lib/colors';
import type { StatsBrandMode, StatsCornerRadius, StatsItem, StatsStyle } from '../_types';
import {
  DEFAULT_STATS_CORNER_RADIUS,
  DEFAULT_STATS_SPACING,
  getStatsBottomCornerRadiusClassName,
  getStatsCornerRadiusClassName,
  getStatsSectionSpacingClassName,
  getStatsTopCornerRadiusClassName,
  type StatsSpacing,
} from '../_types';

const resolveIconComponent = (iconName?: string) => {
  if (!iconName) {return Sparkles;}
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>;
  return iconMap[iconName] ?? Sparkles;
};

const getItemAlignClass = (align?: 'left' | 'center' | 'right') => {
  if (align === 'left') {return 'items-start text-left';}
  if (align === 'right') {return 'items-end text-right';}
  return 'items-center text-center';
};

const getIconWrapperClass = (align?: 'left' | 'center' | 'right') => {
  // Icon wrapper needs flex to properly align icon
  if (align === 'left') {return 'flex justify-start';}
  if (align === 'right') {return 'flex justify-end';}
  return 'flex justify-center';
};

// Helper for left placement: icon wrapper always centered vertically
const getMediaWrapperClass = (mediaPlacement?: 'top' | 'left', mediaAlign?: 'left' | 'center' | 'right') => {
  if (mediaPlacement === 'left') {
    return 'mb-0 flex shrink-0 items-center justify-center self-center';
  }
  return getIconWrapperClass(mediaAlign);
};

// Helper for item container layout
const getItemContainerClass = (mediaPlacement?: 'top' | 'left', mediaAlign?: 'left' | 'center' | 'right') => {
  if (mediaPlacement === 'left') {
    return 'flex items-center gap-3 text-left';
  }
  return cn('flex flex-col', getItemAlignClass(mediaAlign));
};

export const StatsPreview = ({
  items,
  brandColor,
  secondary,
  mode,
  selectedStyle,
  onStyleChange,
  fontStyle,
  fontClassName,
  title,
  showTitle,
  showSubtitle,
  subtitle,
  headerAlign,
  desktopColumns,
  mediaPlacement,
  mediaAlign,
  backgroundImage,
  fullWidth,
  spacing = DEFAULT_STATS_SPACING,
  cornerRadius = DEFAULT_STATS_CORNER_RADIUS,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  enableAnimation,
  hideHeader,
}: {
  items: StatsItem[];
  brandColor: string;
  secondary: string;
  mode: StatsBrandMode;
  selectedStyle?: StatsStyle;
  onStyleChange?: (style: StatsStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  title?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  desktopColumns?: 3 | 4;
  mediaPlacement?: 'top' | 'left';
  mediaAlign?: 'left' | 'center' | 'right';
  backgroundImage?: string;
  fullWidth?: boolean;
  spacing?: StatsSpacing;
  cornerRadius?: StatsCornerRadius;
  hideHeader?: boolean;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  enableAnimation?: boolean;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const previewStyle = selectedStyle ?? 'horizontal';
  const setPreviewStyle = (style: string) => onStyleChange?.(style as StatsStyle);
  const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
  const columnsLabel = desktopColumns === 3 ? '3 cột' : '4 cột';
  const info = `${items.filter((item) => item.value || item.label).length} số liệu • ${modeLabel} • ${columnsLabel}`;
  const sectionSpacingClassName = getStatsSectionSpacingClassName(spacing);
  const cardRadiusClassName = getStatsCornerRadiusClassName(cornerRadius);
  const cardTopRadiusClassName = getStatsTopCornerRadiusClassName(cornerRadius);
  const cardBottomRadiusClassName = getStatsBottomCornerRadiusClassName(cornerRadius);

  const sharedHeader = (
    <SectionHeader
      title={title}
      subtitle={subtitle}
      headerAlign={headerAlign}
      titleColorPrimary={titleColorPrimary}
      subtitleAboveTitle={subtitleAboveTitle}
      uppercaseText={uppercaseText}
      showTitle={showTitle}
      showSubtitle={showSubtitle}
      showBadge={showBadge}
      badgeText={badgeText}
      hideHeader={hideHeader}
      brandColor={brandColor}
    />
  );

  const containerClass = fullWidth ? 'w-full' : 'max-w-7xl mx-auto';

  const renderHorizontalStyle = () => {
    const colors = adaptTokensForDarkMode(getHorizontalColors(brandColor, secondary, mode), isDark);
    
    // Responsive logic based on device state and desktopColumns
    let displayCount: number = desktopColumns ?? 4;
    let layoutClass = 'flex-row justify-around';
    
    if (device === 'mobile') {
      displayCount = desktopColumns === 3 ? 1 : 2;
      layoutClass = desktopColumns === 3 ? 'flex-col' : 'flex-row flex-wrap justify-center';
    } else if (device === 'tablet') {
      displayCount = desktopColumns === 3 ? 3 : 2;
      layoutClass = 'flex-row flex-wrap justify-around';
    }
    
    // Font sizes: mobile/tablet -10%, desktop +10%
    const valueFontSize = device === 'desktop' ? 'text-[26px]' : device === 'tablet' ? 'text-[19px]' : 'text-[18px]';
    const labelFontSize = device === 'desktop' ? 'text-[13px]' : 'text-[10px]';
    const iconSize = device === 'mobile' ? 18 : device === 'tablet' ? 20 : 26;
    const circleSize = device === 'mobile' ? 'w-11 h-11' : device === 'tablet' ? 'w-12 h-12' : 'w-[60px] h-[60px]';
    
    return (
      <div>
        {sharedHeader}
        <div className={containerClass}>
          <section 
            className={cn('w-full overflow-hidden', cardRadiusClassName)}
            style={{ backgroundColor: colors.sectionBg }}
          >
            <div className={cn(
              'flex items-center',
              layoutClass,
              device === 'mobile' ? 'gap-4 py-4 px-3' : 'gap-6 py-6 px-6'
            )}>
              {items.slice(0, displayCount).map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                const iconElement = item.iconType === 'lucide' && IconCmp ? (
                  <IconCmp size={iconSize} style={{ color: colors.iconColor }} />
                ) : item.iconType === 'upload' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className={cn("object-contain", device === 'mobile' ? 'w-8 h-8' : device === 'tablet' ? 'w-9 h-9' : 'w-11 h-11')} />
                ) : item.iconType === 'url' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className={cn("object-contain", device === 'mobile' ? 'w-[18px] h-[18px]' : device === 'tablet' ? 'w-5 h-5' : 'w-[26px] h-[26px]')} />
                ) : null;

                return (
                  <div
                    key={idx}
                    className={cn(getItemContainerClass(mediaPlacement, mediaAlign))}
                  >
                    {iconElement && (
                      <div 
                        className={cn(
                          "rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                          circleSize,
                          mediaPlacement === 'left' ? 'mb-0' : 'mb-2',
                          getMediaWrapperClass(mediaPlacement, mediaAlign)
                        )}
                        style={{ backgroundColor: colors.iconBg }}
                      >
                        {iconElement}
                      </div>
                    )}
                    <div className={cn("flex flex-col", mediaPlacement === 'left' ? '' : getItemAlignClass(mediaAlign))}>
                      <AnimatedValue
                        value={item.value || '0'}
                        enabled={enableAnimation || false}
                        className={cn(
                          "font-bold tracking-tight tabular-nums leading-none mb-0.5",
                          valueFontSize
                        )}
                        style={{ color: colors.valueColor }}
                      />
                      <h3 
                        className={cn(
                          "font-medium leading-tight",
                          labelFontSize
                        )}
                        style={{ color: colors.labelColor }}
                      >
                        {item.label || 'Label'}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderCardsStyle = () => {
    const colors = adaptTokensForDarkMode(getCardsColors(brandColor, secondary, mode), isDark);
    
    // Responsive logic
    let displayCount: number = desktopColumns ?? 4;
    let gridClass = '';
    
    if (device === 'mobile') {
      displayCount = desktopColumns === 3 ? 1 : 4; // Show all 4 items in 2x2 grid
      gridClass = desktopColumns === 3 ? 'grid-cols-1' : 'grid-cols-2';
    } else if (device === 'tablet') {
      displayCount = desktopColumns === 3 ? 3 : 4;
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-2';
    } else {
      displayCount = desktopColumns ?? 4;
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
    }
    
    // Font sizes
    const valueFontSize = device === 'desktop' ? 'text-[26px]' : device === 'tablet' ? 'text-[19px]' : 'text-[18px]';
    const labelFontSize = device === 'desktop' ? 'text-[13px]' : 'text-[10px]';
    const iconSize = device === 'mobile' ? 28 : device === 'tablet' ? 32 : 36;
    
    return (
      <div>
        <div className={containerClass}>
          {sharedHeader}
          <section className={cn('w-full overflow-hidden border', cardRadiusClassName, device === 'mobile' ? 'p-2' : 'p-3')} style={{ backgroundColor: colors.sectionBg, borderColor: colors.border }}>
            <div className={cn('grid divide-x divide-y divide-gray-200', gridClass, device === 'desktop' && 'divide-y-0')}>
              {items.slice(0, displayCount).map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                const iconElement = item.iconType === 'lucide' && IconCmp ? (
                  <IconCmp size={iconSize} style={{ color: colors.iconColor }} />
                ) : item.iconType === 'upload' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className={cn("object-cover", device === 'mobile' ? 'w-12 h-12' : device === 'tablet' ? 'w-14 h-14' : 'w-16 h-16')} />
                ) : item.iconType === 'url' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className={cn("object-contain", device === 'mobile' ? 'w-7 h-7' : device === 'tablet' ? 'w-8 h-8' : 'w-9 h-9')} />
                ) : null;

                return (
                  <div
                    key={idx}
                    className={cn(
                      getItemContainerClass(mediaPlacement, mediaAlign),
                      "justify-center",
                      device === 'mobile' ? 'py-3 px-4' : 'py-4 px-4'
                    )}
                  >
                    {iconElement && (
                      <div className={cn("shrink-0", mediaPlacement === 'left' ? 'mb-0' : 'mb-2', getMediaWrapperClass(mediaPlacement, mediaAlign))}>
                        {iconElement}
                      </div>
                    )}
                    <div className={cn("flex flex-col", mediaPlacement === 'left' ? '' : getItemAlignClass(mediaAlign))}>
                      <AnimatedValue
                        value={item.value || '0'}
                        enabled={enableAnimation || false}
                        className={cn(
                          "font-bold tracking-tight tabular-nums leading-none mb-0.5",
                          valueFontSize
                        )}
                        style={{ color: colors.valueColor }}
                      />
                      <h3 
                        className={cn(
                          "font-medium leading-tight",
                          labelFontSize
                        )}
                        style={{ color: colors.labelColor }}
                      >
                        {item.label || 'Label'}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderIconsStyle = () => {
    const colors = adaptTokensForDarkMode(getIconsColors(brandColor, secondary, mode), isDark);
    let gridClass = '';
    if (device === 'mobile') {
      gridClass = desktopColumns === 3 ? 'grid-cols-1' : 'grid-cols-2';
    } else if (device === 'tablet') {
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-2';
    } else {
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
    }
    const circleSizeClass = device === 'mobile' ? 'w-14 h-14' : device === 'tablet' ? 'w-16 h-16' : 'w-20 h-20';
    const lucideIconSize = device === 'mobile' ? 24 : device === 'tablet' ? 28 : 30;
    const uploadIconClass = device === 'mobile' ? 'w-9 h-9' : device === 'tablet' ? 'w-11 h-11' : 'w-14 h-14';
    const urlIconClass = device === 'mobile' ? 'w-5 h-5' : device === 'tablet' ? 'w-6 h-6' : 'w-7 h-7';
    const valueTextClass = device === 'mobile' ? 'text-base' : device === 'tablet' ? 'text-lg' : 'text-xl';
    const labelTextClass = device === 'mobile' ? 'text-xs leading-snug' : 'text-sm';
    return (
      <div>
        <div className={containerClass}>
          {sharedHeader}
          <section className={cn("w-full", device === 'mobile' ? 'py-3 px-2' : 'py-4 px-3')} style={{ backgroundColor: colors.sectionBg }}>
            <div className={cn('grid gap-4', device === 'mobile' ? 'gap-3' : '', gridClass)}>
              {items.slice(0, desktopColumns).map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                const hasIcon = item.iconType === 'lucide' || item.iconType === 'url' || item.iconType === 'upload';
                
                const circleElement = (
                  <div
                    className={cn(
                      "relative rounded-full flex items-center justify-center border shadow-sm shrink-0 overflow-hidden",
                      circleSizeClass,
                      mediaPlacement === 'left' ? 'mb-0' : 'mb-2'
                    )}
                    style={{
                      backgroundColor: colors.circleBg,
                      borderColor: colors.ring,
                    }}
                  >
                    {item.iconType === 'lucide' && IconCmp ? (
                      <IconCmp size={lucideIconSize} style={{ color: colors.textOnCircle }} />
                    ) : item.iconType === 'upload' && item.iconUrl ? (
                      <img src={item.iconUrl} alt="" className={cn("object-contain", uploadIconClass)} />
                    ) : item.iconType === 'url' && item.iconUrl ? (
                      <img src={item.iconUrl} alt="" className={cn("object-contain", urlIconClass)} />
                    ) : (
                      <AnimatedValue
                        value={item.value || '0'}
                        enabled={enableAnimation || false}
                        className={cn(
                          "font-bold tracking-tight z-10 tabular-nums",
                          valueTextClass
                        )}
                        style={{ color: colors.textOnCircle }}
                      />
                    )}
                  </div>
                );

                return (
                  <div key={idx} className={cn(
                    mediaPlacement === 'left'
                      ? 'flex w-full items-center justify-center gap-2 text-left'
                      : getItemContainerClass(mediaPlacement, mediaAlign)
                  )}>
                    {circleElement}
                    <div className={cn(mediaPlacement === 'left' ? 'w-[76px] min-w-0 shrink-0' : '')}>
                      <h3
                        className={cn(
                          "font-semibold text-slate-800 dark:text-slate-200",
                          labelTextClass
                        )}
                        style={{ color: colors.label }}
                      >
                        {item.label || 'Label'}
                      </h3>
                      {hasIcon && (
                        <AnimatedValue
                          value={item.value || '0'}
                          enabled={enableAnimation || false}
                          className={cn("font-bold tabular-nums", device === 'mobile' ? 'mt-0.5 text-base' : 'mt-1 text-lg')}
                          style={{ color: brandColor }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderGradientStyle = () => {
    const colors = adaptTokensForDarkMode(getGradientColors(brandColor, secondary, mode), isDark);
    let gridClass = '';
    if (device === 'mobile') {
      gridClass = desktopColumns === 3 ? 'grid-cols-1' : 'grid-cols-2';
    } else if (device === 'tablet') {
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-2';
    } else {
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
    }
    return (
      <div>
        <div className={containerClass}>
          {sharedHeader}
          <section className={cn("w-full", device === 'mobile' ? 'p-2' : 'p-4')}>
            <div
              className={cn('overflow-hidden border', cardRadiusClassName)}
              style={{
                background: colors.background,
                borderColor: colors.border
              }}
            >
              <div className={cn('grid', gridClass)}>
                {items.slice(0, desktopColumns).map((item, idx) => {
                  const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                  const iconSize = device === 'mobile' ? 20 : 24;
                  const iconElement = item.iconType === 'lucide' && IconCmp ? (
                    <IconCmp size={iconSize} style={{ color: colors.text }} />
                  ) : item.iconType === 'upload' && item.iconUrl ? (
                    <img src={item.iconUrl} alt="" className={cn("object-cover", device === 'mobile' ? 'w-10 h-10' : 'w-12 h-12')} />
                  ) : item.iconType === 'url' && item.iconUrl ? (
                    <img src={item.iconUrl} alt="" className={cn("object-contain", device === 'mobile' ? 'w-5 h-5' : 'w-6 h-6')} />
                  ) : null;

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "relative justify-center p-4",
                        getItemContainerClass(mediaPlacement, mediaAlign),
                        device === 'mobile' ? 'p-3' : 'p-5',
                        idx !== items.slice(0, desktopColumns).length - 1 && (device === 'mobile' ? '' : 'border-r border-white/10')
                      )}
                    >
                      {iconElement && (
                        <div className={cn(mediaPlacement === 'left' ? 'mb-0' : 'mb-1', getMediaWrapperClass(mediaPlacement, mediaAlign))}>
                          {iconElement}
                        </div>
                      )}
                      <div className={cn(mediaPlacement === 'left' ? 'flex-1' : '')}>
                        <AnimatedValue
                          value={item.value || '0'}
                          enabled={enableAnimation || false}
                          className={cn(
                            "font-extrabold tracking-tight tabular-nums leading-none mb-1",
                            device === 'mobile' ? 'text-2xl' : 'text-3xl'
                          )}
                          style={{ color: colors.text }}
                        />
                        <h3
                          className={cn(
                            "font-medium opacity-90 relative z-10",
                            device === 'mobile' ? 'text-[10px]' : 'text-xs'
                          )}
                          style={{ color: colors.label }}
                        >
                          {item.label || 'Label'}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderMinimalStyle = () => {
    const colors = adaptTokensForDarkMode(getMinimalColors(brandColor, secondary, mode), isDark);
    let gridClass = '';
    if (device === 'mobile') {
      gridClass = desktopColumns === 3 ? 'grid-cols-1' : 'grid-cols-2';
    } else if (device === 'tablet') {
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-2';
    } else {
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
    }
    
    // Font sizes: mobile/tablet -10%, desktop +10%
    const valueFontSize = device === 'desktop' ? 'text-[33px]' : device === 'tablet' ? 'text-[27px]' : 'text-[22px]';
    const labelFontSize = device === 'desktop' ? 'text-[15px]' : device === 'tablet' ? 'text-[11px]' : 'text-[11px]';
    const iconSize = device === 'mobile' ? 16 : device === 'tablet' ? 18 : 22;
    
    return (
      <div>
        <div className={containerClass}>
          {sharedHeader}
          <section className={cn('w-full', cardRadiusClassName, device === 'mobile' ? 'py-6 px-3' : 'py-8 px-4')} style={{ backgroundColor: colors.sectionBg }}>
            <div className={cn('grid gap-4', device === 'mobile' ? '' : '', gridClass)}>
              {items.slice(0, desktopColumns).map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                const iconElement = item.iconType === 'lucide' && IconCmp ? (
                  <IconCmp size={iconSize} style={{ color: colors.accent }} />
                ) : item.iconType === 'upload' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className={cn("object-cover", device === 'mobile' ? 'w-9 h-9' : device === 'tablet' ? 'w-10 h-10' : 'w-12 h-12')} />
                ) : item.iconType === 'url' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className={cn("object-contain", device === 'mobile' ? 'w-4 h-4' : device === 'tablet' ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]')} />
                ) : null;

                return (
                  <div
                    key={idx}
                    className={cn(getItemContainerClass(mediaPlacement, mediaAlign))}
                  >
                    {iconElement && (
                      <div className={cn(mediaPlacement === 'left' ? 'mb-0' : 'mb-2', getMediaWrapperClass(mediaPlacement, mediaAlign))}>
                        {iconElement}
                      </div>
                    )}
                    <div className={cn(mediaPlacement === 'left' ? 'flex-1' : '')}>
                      {mediaPlacement !== 'left' && (
                        <div
                          className="w-10 h-0.5 rounded-full mb-3"
                          style={{ backgroundColor: colors.accent }}
                        />
                      )}
                      <AnimatedValue
                        value={item.value || '0'}
                        enabled={enableAnimation || false}
                        className={cn(
                          "font-bold tracking-tight tabular-nums leading-none text-slate-900 dark:text-white",
                          valueFontSize
                        )}
                        style={{ color: colors.value }}
                      />
                      <h3 className={cn(
                        "font-medium text-slate-500 dark:text-slate-400 mt-1",
                        labelFontSize
                      )}>
                        {item.label || 'Label'}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderCounterStyle = () => {
    const colors = adaptTokensForDarkMode(getCounterColors(brandColor, secondary, mode), isDark);
    let gridClass = '';
    if (device === 'mobile') {
      gridClass = desktopColumns === 3 ? 'grid-cols-1' : 'grid-cols-2';
    } else if (device === 'tablet') {
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-2';
    } else {
      gridClass = desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
    }
    
    // Font sizes: mobile/tablet -10%, desktop +10%
    const valueFontSize = device === 'desktop' ? 'text-[33px]' : device === 'tablet' ? 'text-[27px]' : 'text-[22px]';
    const labelFontSize = device === 'desktop' ? 'text-[15px]' : device === 'tablet' ? 'text-[11px]' : 'text-[11px]';
    const iconSize = device === 'mobile' ? 16 : device === 'tablet' ? 18 : 22;
    
    return (
      <div>
        <div className={containerClass}>
          {sharedHeader}
          <section className={cn('w-full overflow-hidden', cardRadiusClassName, device === 'mobile' ? 'py-6 px-3' : 'py-8 px-4')} style={{ backgroundColor: colors.background }}>
            <div className={cn('grid gap-4', device === 'mobile' ? '' : '', gridClass)}>
              {items.slice(0, desktopColumns).map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
                const iconElement = item.iconType === 'lucide' && IconCmp ? (
                  <IconCmp size={iconSize} style={{ color: colors.accent }} />
                ) : item.iconType === 'upload' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className={cn("object-cover", device === 'mobile' ? 'w-9 h-9' : device === 'tablet' ? 'w-10 h-10' : 'w-12 h-12')} />
                ) : item.iconType === 'url' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className={cn("object-contain", device === 'mobile' ? 'w-4 h-4' : device === 'tablet' ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]')} />
                ) : null;

                return (
                  <div
                    key={idx}
                    className={cn(getItemContainerClass(mediaPlacement, mediaAlign))}
                  >
                    {iconElement && (
                      <div className={cn(mediaPlacement === 'left' ? 'mb-0' : 'mb-2', getMediaWrapperClass(mediaPlacement, mediaAlign))}>
                        {iconElement}
                      </div>
                    )}
                    <div className={cn(mediaPlacement === 'left' ? 'flex-1' : '')}>
                      {mediaPlacement !== 'left' && (
                        <div
                          className="w-10 h-0.5 rounded-full mb-3"
                          style={{ backgroundColor: colors.accent }}
                        />
                      )}
                      <AnimatedValue
                        value={item.value || '0'}
                        enabled={enableAnimation || false}
                        className={cn(
                          "font-bold tracking-tight tabular-nums leading-none",
                          valueFontSize
                        )}
                        style={{ color: colors.value }}
                      />
                      <h3 className={cn(
                        "font-medium mt-1",
                        labelFontSize
                      )}
                      style={{ color: colors.label }}
                      >
                        {item.label || 'Label'}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderSolarHeroStyle = () => {
    const colors = adaptTokensForDarkMode(getSolarHeroColors(brandColor, secondary, mode), isDark);
    const gridClass = desktopColumns === 3
      ? device === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'
      : device === 'desktop' ? 'grid-cols-4' : 'grid-cols-2';
    const iconSize = device === 'mobile' ? 'h-12 w-12' : 'h-[60px] w-[60px]';
    const valueSize = device === 'desktop' ? 'text-[38px]' : device === 'tablet' ? 'text-[30px]' : 'text-[28px]';

    return (
      <div
        className={cn('relative bg-cover bg-center bg-no-repeat', device === 'mobile' ? 'px-2 py-5' : 'px-2 py-8')}
        style={backgroundImage ? { backgroundImage: `url("${backgroundImage}")` } : { backgroundColor: colors.sectionBg }}
      >
        {sharedHeader}
        <div className={containerClass}>
          <div className={cn('relative z-[1] grid gap-2.5', gridClass)}>
            {items.slice(0, 4).map((item, idx) => {
              const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveIconComponent(item.iconName) : null;
              const iconElement = item.iconType === 'lucide' && IconCmp ? (
                <IconCmp size={device === 'mobile' ? 44 : 54} style={{ color: colors.icon }} />
              ) : (item.iconType === 'upload' || item.iconType === 'url') && item.iconUrl ? (
                <img src={item.iconUrl} alt={item.label || ''} className={cn('object-contain', iconSize)} />
              ) : (
                <Sparkles size={device === 'mobile' ? 44 : 54} style={{ color: colors.icon }} />
              );

              return (
                <article key={idx} className="flex min-w-0 flex-col">
                  <div className={cn('flex items-center justify-between gap-2.5 border px-3 py-3', cardTopRadiusClassName)} style={{ backgroundColor: colors.cardSurface, borderColor: colors.border }}>
                    <div className="min-w-0">
                      <AnimatedValue
                        value={item.value || '0'}
                        enabled={enableAnimation || false}
                        className={cn('mb-2 font-bold leading-none tracking-tight tabular-nums', valueSize)}
                        style={{ color: colors.value }}
                      />
                      <h3 className="text-sm font-medium leading-snug" style={{ color: colors.label }}>{item.label || 'Label'}</h3>
                    </div>
                    <div className="shrink-0">{iconElement}</div>
                  </div>
                  <p
                    className={cn('min-h-[84px] flex-1 px-3 py-3 text-sm leading-relaxed', cardBottomRadiusClassName)}
                    style={{ backgroundColor: colors.descriptionBg, color: colors.descriptionText }}
                  >
                    {item.description || `${item.label || 'Số liệu'} nổi bật, khẳng định năng lực và uy tín của thương hiệu.`}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderBuilderOverlayStyle = () => {
    const colors = adaptTokensForDarkMode(getBuilderOverlayColors(brandColor, secondary, mode), isDark);
    const gridClass = desktopColumns === 3 ? 'md:basis-1/3 md:max-w-[33.333333%]' : 'md:basis-1/4 md:max-w-[25%]';
    const visibleItems = items.slice(0, desktopColumns ?? 4);
    const isCompact = device !== 'desktop';
    const itemWidthClass = desktopColumns === 3
      ? device === 'mobile' ? 'basis-full max-w-full' : 'basis-1/3 max-w-[33.333333%]'
      : device === 'desktop' ? gridClass : 'basis-1/2 max-w-[50%]';
    const iconClass = device === 'desktop' ? 'h-16 w-16' : device === 'tablet' ? 'h-12 w-12' : 'h-9 w-9';
    const itemPaddingClass = device === 'desktop' ? 'px-2.5 py-3' : 'px-2 py-2.5';
    const textGapClass = device === 'desktop' ? 'ml-5' : device === 'tablet' ? 'ml-3' : 'ml-2';
    const valueClass = device === 'desktop'
      ? 'text-[36px] leading-[43.2px]'
      : device === 'tablet'
        ? 'text-[30px] leading-[36px]'
        : 'text-[24px] leading-[28px]';
    const labelClass = device === 'desktop'
      ? 'text-base leading-[19.2px]'
      : device === 'tablet'
        ? 'text-sm leading-[17px]'
        : 'max-w-[86px] text-[13px] leading-[15px]';

    return (
      <div
        className={cn('relative bg-cover bg-center bg-no-repeat px-5 py-8', isCompact ? 'px-3 py-5' : '')}
        style={backgroundImage ? { backgroundImage: `url("${backgroundImage}")` } : undefined}
      >
        <div className={containerClass}>
          {sharedHeader}
          <div className={cn('relative min-h-[132px]', backgroundImage && (isCompact ? 'min-h-[240px]' : 'min-h-[320px]'))}>
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
                        'flex w-full items-center justify-center',
                        itemPaddingClass,
                        itemWidthClass,
                        !isCompact && idx !== visibleItems.length - 1 && 'border-r',
                      )}
                      style={!isCompact && idx !== visibleItems.length - 1 ? { borderColor: colors.border } : undefined}
                    >
                      <div className="shrink-0">
                        {hasImage ? (
                          <img src={item.iconUrl} alt={item.label || ''} className={cn('object-contain align-middle', iconClass)} loading="lazy" />
                        ) : (
                          <IconCmp size={64} className={iconClass} style={{ color: colors.icon }} />
                        )}
                      </div>
                      <div className={cn('flex min-w-0 flex-col', textGapClass)}>
                        <AnimatedValue
                          value={item.value || '0'}
                          enabled={enableAnimation || false}
                          className={cn('font-bold tracking-normal tabular-nums', valueClass)}
                          style={{ color: colors.accent }}
                        />
                        <span className={cn('capitalize', labelClass)} style={{ color: colors.label }}>{item.label || 'Label'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PreviewWrapper
        title="Preview Stats"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={STATS_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          <div className={sectionSpacingClassName}>
            {previewStyle === 'horizontal' && renderHorizontalStyle()}
            {previewStyle === 'cards' && renderCardsStyle()}
            {previewStyle === 'icons' && renderIconsStyle()}
            {previewStyle === 'gradient' && renderGradientStyle()}
            {previewStyle === 'minimal' && renderMinimalStyle()}
            {previewStyle === 'counter' && renderCounterStyle()}
            {previewStyle === 'solar-hero' && renderSolarHeroStyle()}
            {previewStyle === 'builder-overlay' && renderBuilderOverlayStyle()}
          </div>
        </BrowserFrame>
      </PreviewWrapper>
      <ColorInfoPanel brandColor={brandColor} secondary={secondary} />
    </>
  );
};
