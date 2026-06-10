'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, Shield, ZoomIn } from 'lucide-react';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { getPreviewDeviceClass } from '../../_shared/lib/previewResponsive';
import {
  type TrustBadgesStyle,
} from '../_types';
import {
  DEFAULT_STACK_DESCRIPTION,
  DEFAULT_STACK_HEADING,
  DEFAULT_TRUST_CUE_TEXT,
  TRUST_BADGES_A4_ASPECT_CLASS,
  getTrustBadgesMaxVisibleItems,
  TrustBadgesEmptyState,
  TrustBadgesSectionHeader,
  TrustBadgesTrustCue,
  useTrustBadgesSectionState,
} from './TrustBadgesSectionShared';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

// Best Practices: Grayscale-to-color hover, lightbox/zoom indicator, verification links, alt text accessibility
interface TrustBadgeItem { id: number; url: string; link: string; name?: string }
export interface TrustBadgesConfig { heading?: string; subHeading?: string; badgeText?: string;
  spacing?: SectionSpacing; cornerRadius?: unknown; noBorderRadius?: unknown; noVerticalMargin?: unknown; showBorder?: unknown; trustCueText?: string; stackHeading?: string; stackDescription?: string; showTitle?: boolean; showSubtitle?: boolean; showBadge?: boolean; headerAlign?: 'left' | 'center' | 'right'; titleColorPrimary?: boolean; subtitleAboveTitle?: boolean; uppercaseText?: boolean; hideHeader?: boolean }

export const TrustBadgesPreview = ({ 
  items, 
  brandColor, 
  secondary,
  mode,
  selectedStyle, 
  onStyleChange,
  desktopColumns = 4,
  config,
  fontStyle,
  fontClassName,
}: { 
  items: TrustBadgeItem[]; 
  brandColor: string;
  secondary: string; 
  mode: 'single' | 'dual';
  selectedStyle?: TrustBadgesStyle; 
  onStyleChange?: (style: TrustBadgesStyle) => void;
  desktopColumns?: 3 | 4;
  config?: TrustBadgesConfig;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const [carouselRef, carouselApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [cardsRef, cardsApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [sealRef, sealApi] = useEmblaCarousel({ align: 'start', axis: 'y', containScroll: 'trimSnaps' });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canCardsScrollPrev, setCanCardsScrollPrev] = useState(false);
  const [canCardsScrollNext, setCanCardsScrollNext] = useState(false);
  const [canSealScrollPrev, setCanSealScrollPrev] = useState(false);
  const [canSealScrollNext, setCanSealScrollNext] = useState(false);
  const [selectedSnap, setSelectedSnap] = useState(0);
  const {
    cardBorder,
    colors: rawColors,
    innerRadiusClassName,
    radiusClassName,
    renderConfig,
    sectionSpacingClassName,
  } = useTrustBadgesSectionState({ brandColor, config, desktopColumns, mode, previewDevice: device, secondary, selectedStyle });
  const colors = React.useMemo(() => adaptTokensForDarkMode(rawColors, isDark), [rawColors, isDark]);
  const previewStyle = renderConfig.style;
  const setPreviewStyle = (s: string) => onStyleChange?.(s as TrustBadgesStyle);
  const normalizedDesktopColumns = renderConfig.desktopColumns;
  const desktopGridClassName = normalizedDesktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
  const responsiveGridClassName = getPreviewDeviceClass(device, {
    mobile: normalizedDesktopColumns === 3 ? 'grid-cols-1' : 'grid-cols-2',
    tablet: normalizedDesktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-2',
    desktop: desktopGridClassName,
  });
  const _titleClassName = getPreviewDeviceClass(device, {
    mobile: 'text-xl',
    tablet: 'text-2xl',
    desktop: 'text-3xl',
  });

  const updateCarouselState = useCallback(() => {
    if (!carouselApi) { return; }
    setCanScrollPrev(carouselApi.canScrollPrev());
    setCanScrollNext(carouselApi.canScrollNext());
    setSelectedSnap(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  const updateCardsState = useCallback(() => {
    if (!cardsApi) { return; }
    setCanCardsScrollPrev(cardsApi.canScrollPrev());
    setCanCardsScrollNext(cardsApi.canScrollNext());
  }, [cardsApi]);

  const updateSealState = useCallback(() => {
    if (!sealApi) { return; }
    setCanSealScrollPrev(sealApi.canScrollPrev());
    setCanSealScrollNext(sealApi.canScrollNext());
  }, [sealApi]);

  useEffect(() => {
    if (!carouselApi) { return; }
    updateCarouselState();
    carouselApi.on('select', updateCarouselState);
    carouselApi.on('reInit', updateCarouselState);

    return () => {
      carouselApi.off('select', updateCarouselState);
      carouselApi.off('reInit', updateCarouselState);
    };
  }, [carouselApi, updateCarouselState]);

  useEffect(() => {
    if (!cardsApi) { return; }
    updateCardsState();
    cardsApi.on('select', updateCardsState);
    cardsApi.on('reInit', updateCardsState);

    return () => {
      cardsApi.off('select', updateCardsState);
      cardsApi.off('reInit', updateCardsState);
    };
  }, [cardsApi, updateCardsState]);

  useEffect(() => {
    if (!sealApi) { return; }
    updateSealState();
    sealApi.on('select', updateSealState);
    sealApi.on('reInit', updateSealState);

    return () => {
      sealApi.off('select', updateSealState);
      sealApi.off('reInit', updateSealState);
    };
  }, [sealApi, updateSealState]);

  useEffect(() => {
    if (!carouselApi) { return; }
    carouselApi.reInit();
    updateCarouselState();
  }, [carouselApi, items.length, normalizedDesktopColumns, previewStyle, device, updateCarouselState]);

  useEffect(() => {
    if (!cardsApi) { return; }
    cardsApi.reInit();
    updateCardsState();
  }, [cardsApi, items.length, normalizedDesktopColumns, previewStyle, device, updateCardsState]);

  useEffect(() => {
    if (!sealApi) { return; }
    sealApi.reInit();
    updateSealState();
  }, [sealApi, items.length, normalizedDesktopColumns, previewStyle, device, updateSealState]);

  const styles = [
    { id: 'grid', label: 'Lưới' }, 
    { id: 'cards', label: 'Thẻ' }, 
    { id: 'stack', label: 'Danh sách' },
    { id: 'wall', label: 'Khung' },
    { id: 'carousel', label: 'Trượt' },
    { id: 'seal', label: 'Con dấu' }
  ];

  const visibleItems = items.slice(0, getTrustBadgesMaxVisibleItems(normalizedDesktopColumns));

  const sharedHeader = (
    <TrustBadgesSectionHeader
      brandColor={brandColor}
      config={config}
      title={config?.heading ?? 'Chứng nhận & Giải thưởng'}
    />
  );

  const EmptyState = () => <TrustBadgesEmptyState colors={colors} />;
  const TrustCue = ({ compact = false }: { compact?: boolean }) => <TrustBadgesTrustCue colors={colors} compact={compact} text={config?.trustCueText || DEFAULT_TRUST_CUE_TEXT} />;

  // Style 1: Clean trust grid
  const renderGridStyle = () => (
    <section className={cn("w-full bg-white dark:bg-slate-950", sectionSpacingClassName, device === 'mobile' ? 'px-3' : 'px-6')}>
      <div className="container max-w-7xl mx-auto">
        {sharedHeader}
        {items.length === 0 ? <EmptyState /> : (
          <>
            <div className={cn(
              "grid gap-3 md:gap-4",
              responsiveGridClassName
            )}>
              {visibleItems.map((item) => (
                <div 
                  key={item.id} 
                  className={cn('group relative flex min-h-[164px] flex-col overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5', radiusClassName)}
                  style={{ 
                    border: cardBorder,
                    backgroundColor: colors.neutralSurface,
                    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <div className="absolute left-3 top-3 z-10"><TrustCue compact /></div>
                  <div className={cn('flex flex-1 items-center justify-center p-5 pt-10', TRUST_BADGES_A4_ASPECT_CLASS)} style={{ backgroundColor: colors.neutralBackground }}>
                    {item.url ? (
                      <PreviewImage src={item.url} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]" alt={item.name ?? 'Chứng nhận'} />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSurface }}>
                        <Shield size={device === 'mobile' ? 26 : 30} style={{ color: colors.subheading }} />
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-[54px] items-center justify-between gap-3 border-t px-4 py-3" style={{ borderColor: colors.neutralBorder }}>
                    <p className="min-w-0 text-sm font-semibold leading-tight break-words" style={{ color: colors.heading }}>{item.name ?? 'Chứng nhận tin cậy'}</p>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: colors.badgeBg }}>
                      <Maximize2 size={14} style={{ color: colors.badgeText }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );

  // Style 2: SaaS proof cards
  const renderCardsStyle = () => {
    const cardItems = visibleItems;
    const cardWidthClassName = device === 'mobile'
      ? 'basis-[78%]'
      : (device === 'tablet' ? 'basis-[42%]' : (normalizedDesktopColumns === 3 ? 'basis-[31%]' : 'basis-[24%]'));
    return (
      <section className={cn("w-full bg-slate-50 dark:bg-slate-950", sectionSpacingClassName, device === 'mobile' ? 'px-3' : 'px-6')}>
        <div className="container max-w-7xl mx-auto">
          {sharedHeader}
          {items.length === 0 ? <EmptyState /> : (
            <div className="relative">
              {cardItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => cardsApi?.scrollPrev()}
                    disabled={!canCardsScrollPrev}
                    className={cn('absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-sm transition-opacity dark:bg-slate-900', !canCardsScrollPrev && 'cursor-not-allowed opacity-40')}
                    style={{ borderColor: colors.sectionAccentBar, color: colors.heading }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => cardsApi?.scrollNext()}
                    disabled={!canCardsScrollNext}
                    className={cn('absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-2 items-center justify-center rounded-full border bg-white shadow-sm transition-opacity dark:bg-slate-900', !canCardsScrollNext && 'cursor-not-allowed opacity-40')}
                    style={{ borderColor: colors.sectionAccentBar, color: colors.heading }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            <div className="-mx-2 overflow-hidden px-2 pb-2" ref={cardsRef}>
              <div className="flex snap-x gap-4 md:gap-5">
                {cardItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={cn('group relative flex snap-start flex-col overflow-hidden cursor-pointer h-full shrink-0 grow-0 transition-all duration-300 hover:-translate-y-1', radiusClassName, cardWidthClassName)}
                    style={{ border: cardBorder, backgroundColor: colors.neutralSurface, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)' }}
                  >
                    <div className={cn('flex items-center justify-center relative overflow-hidden', TRUST_BADGES_A4_ASPECT_CLASS, device === 'mobile' ? 'p-5' : 'p-6')} style={{ backgroundColor: colors.neutralBackground }}>
                      <div className="absolute left-4 top-4 z-20"><TrustCue compact /></div>
                      {item.url ? (
                        <PreviewImage src={item.url} className="w-full h-full object-contain transition-transform duration-500 z-10 group-hover:scale-[1.04]" alt={item.name ?? 'Chứng nhận'} />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSurface }}>
                          <Shield size={34} style={{ color: colors.subheading }} />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <span className="px-4 py-2 rounded-full font-medium flex items-center gap-2 text-sm" style={{ color: colors.subheading, backgroundColor: colors.neutralSurface, border: `1px solid ${colors.sectionAccentBar}` }}>
                          <ZoomIn size={16} /> Xem chi tiết
                        </span>
                      </div>
                    </div>
                    <div className={cn("border-t flex items-center justify-between gap-3 transition-colors", device === 'mobile' ? 'py-3 px-4 min-h-[58px]' : 'py-4 px-5')} style={{ borderColor: colors.neutralBorder, backgroundColor: colors.neutralSurface }}>
                      <span className="font-semibold text-sm leading-tight break-words" style={{ color: colors.subheading }}>
                        {item.name ?? 'Chứng nhận'}
                      </span>
                      <ArrowUpRight size={16} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.subheading }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  // Style 3: Stack - trust proof strips with a strong SaaS rhythm
  const renderStackStyle = () => {
    const stackItems = visibleItems.filter((item) => item.url || item.name).slice(0, normalizedDesktopColumns);
    const compactStack = normalizedDesktopColumns === 4;
    return (
      <section className={cn("w-full overflow-hidden bg-slate-50 dark:bg-slate-950", sectionSpacingClassName, device === 'mobile' ? 'px-3' : 'px-6')}>
        <div className="container max-w-7xl mx-auto">
          {sharedHeader}
          {items.length === 0 ? <EmptyState /> : (
            <div className={cn("grid items-stretch", device === 'mobile' ? 'grid-cols-1 gap-4' : (compactStack ? 'grid-cols-[0.46fr_1.9fr] gap-3' : 'grid-cols-[0.82fr_1.35fr] gap-4'))}>
              <div className={cn('flex h-full flex-col border bg-white shadow-sm dark:bg-slate-900', compactStack ? 'p-3' : 'p-4 md:p-5', radiusClassName)} style={{ borderColor: renderConfig.showBorder ? colors.neutralBorder : 'transparent', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)' }}>
                <div className={compactStack ? 'mb-3' : 'mb-4'}>
                  <TrustCue />
                  <p className={cn('mt-3 font-bold', compactStack ? 'text-sm' : 'text-base')} style={{ color: colors.heading }}>{config?.stackHeading || DEFAULT_STACK_HEADING}</p>
                  <p className={cn('mt-2 text-xs', compactStack ? 'leading-4' : 'leading-5')} style={{ color: colors.mutedText }}>{config?.stackDescription || DEFAULT_STACK_DESCRIPTION}</p>
                </div>
                <div className="space-y-2">
                  {stackItems.map((item, index) => {
                    const active = index === 0;
                    return (
                    <div
                      key={item.id}
                      className={cn('flex items-center border bg-white transition-all duration-300 dark:bg-slate-900', compactStack ? 'min-h-10 gap-2 px-2.5 py-2' : 'min-h-12 gap-3 px-3 py-2', innerRadiusClassName)}
                      style={{
                        borderColor: renderConfig.showBorder ? (active ? colors.sectionAccentBar : colors.neutralBorder) : 'transparent',
                        boxShadow: active ? `0 12px 28px ${colors.sectionAccentBar}18` : '0 8px 20px rgba(15, 23, 42, 0.04)',
                      }}
                    >
                      <span className={cn('shrink-0 font-semibold', compactStack ? 'w-4 text-xs' : 'w-5 text-sm')} style={{ color: active ? colors.sectionAccentBar : colors.subheading }}>{index + 1}</span>
                      <span className={cn('min-w-0 flex-1 font-extrabold uppercase tracking-tight break-words', compactStack ? 'text-xs' : 'text-sm')} style={{ color: colors.heading }}>{item.name ?? `Chứng nhận ${index + 1}`}</span>
                      <ArrowUpRight size={compactStack ? 14 : 17} style={{ color: active ? colors.sectionAccentBar : colors.mutedText }} />
                    </div>
                    );
                  })}
                </div>
              </div>
              <div className={cn("grid h-full auto-rows-fr gap-3", device === 'mobile' ? 'grid-cols-1' : (normalizedDesktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4'))}>
                {stackItems.map((item) => (
                  <div key={item.id} className={cn('group flex h-full min-h-0 flex-col overflow-hidden border bg-white p-3 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 dark:bg-slate-900', radiusClassName)} style={{ borderColor: renderConfig.showBorder ? colors.neutralBorder : 'transparent', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.07)' }}>
                    <div className={cn('mx-auto flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden', innerRadiusClassName)} style={{ backgroundColor: colors.neutralBackground }}>
                      {item.url ? (
                        <PreviewImage src={item.url} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]" alt={item.name ?? 'Chứng nhận'} />
                      ) : (
                        <Shield size={40} style={{ color: colors.subheading }} />
                      )}
                    </div>
                    <p className="mt-3 min-h-9 text-xs font-extrabold uppercase tracking-tight break-words" style={{ color: colors.heading }}>{item.name ?? 'Chứng nhận'}</p>
                    <div className="mx-auto mt-2 h-0.5 w-7 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  // Style 4: Framed Wall - Certificate frames hanging on wall
  const renderWallStyle = () => {
    const wallItems = visibleItems;
    return (
      <section className={cn("w-full", sectionSpacingClassName, device === 'mobile' ? 'px-3' : 'px-6')} style={{ backgroundColor: colors.neutralBackground }}>
        <div className="container max-w-7xl mx-auto">
          {sharedHeader}
          {items.length === 0 ? <EmptyState /> : (
            <>
              <div className={cn(
                "grid gap-4 md:gap-5",
                responsiveGridClassName
              )}>
                {wallItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      'group relative w-full flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-0.5',
                      radiusClassName,
                      device === 'mobile' ? 'min-h-[170px] p-2' : 'min-h-[210px] p-3'
                    )}
                    style={{ border: cardBorder, backgroundColor: colors.neutralSurface, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)' }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
                      <TrustCue compact />
                    </div>
                    <div className={cn('flex items-center justify-center p-3 relative overflow-hidden', TRUST_BADGES_A4_ASPECT_CLASS, innerRadiusClassName)} style={{ backgroundColor: colors.neutralBackground, border: cardBorder }}>
                      {item.url ? (
                        <PreviewImage src={item.url} className="w-full h-full object-contain" alt={item.name ?? 'Chứng nhận'} />
                      ) : (
                        <Shield size={28} className="text-slate-300" />
                      )}
                    </div>
                    <div className={cn("flex items-center justify-center", device === 'mobile' ? 'h-7 mt-1' : 'h-8 mt-1')}>
                      <span className={cn("font-semibold text-center leading-tight break-words px-1", device === 'mobile' ? 'text-[10px]' : 'text-xs')} style={{ color: colors.subheading }}>
                        {item.name ?? 'Chứng nhận'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    );
  };

  // Style 5: Carousel - Horizontal scroll với navigation arrows
  const renderCarouselStyle = () => {
    const itemsPerView = device === 'mobile'
      ? (normalizedDesktopColumns === 3 ? 1 : 2)
      : (device === 'tablet' ? (normalizedDesktopColumns === 3 ? 3 : 2) : normalizedDesktopColumns);
    const snapCount = carouselApi?.scrollSnapList().length ?? 0;
    return (
      <section className={cn("w-full bg-white dark:bg-slate-900", sectionSpacingClassName, device === 'mobile' ? 'px-3' : 'px-6')}>
        <div className="container max-w-7xl mx-auto">
          {sharedHeader}
          {items.length === 0 ? <EmptyState /> : (
            <div className="relative">
              {visibleItems.length > itemsPerView && (
                <>
                  <button
                    type="button"
                    onClick={() => carouselApi?.scrollPrev()}
                    disabled={!canScrollPrev}
                    className={cn("absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors", !canScrollPrev ? 'opacity-40 cursor-not-allowed' : '')}
                    style={{ border: `1px solid ${colors.sectionAccentBar}`, left: device === 'mobile' ? '-4px' : '-16px', backgroundColor: colors.neutralSurface }}
                  >
                    <ChevronLeft size={20} style={{ color: colors.heading }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => carouselApi?.scrollNext()}
                    disabled={!canScrollNext}
                    className={cn("absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors", !canScrollNext ? 'opacity-40 cursor-not-allowed' : '')}
                    style={{ border: `1px solid ${colors.sectionAccentBar}`, right: device === 'mobile' ? '-4px' : '-16px', backgroundColor: colors.neutralSurface }}
                  >
                    <ChevronRight size={20} style={{ color: colors.heading }} />
                  </button>
                </>
              )}
              <div className={cn("overflow-hidden", device === 'mobile' ? 'mx-2' : 'mx-6')} ref={carouselRef}>
                <div className="flex gap-4">
                {visibleItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex-shrink-0 group cursor-pointer"
                      style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 16 / itemsPerView}px)` }}
                    >
                      <div 
                        className={cn(TRUST_BADGES_A4_ASPECT_CLASS, 'flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5', radiusClassName)}
                        style={{ backgroundColor: colors.neutralBackground, border: cardBorder, padding: device === 'mobile' ? '12px' : '16px' }}
                      >
                        {item.url ? (
                          <PreviewImage src={item.url} className="w-full h-full object-contain transition-transform duration-300" alt={item.name ?? 'Chứng nhận'} />
                        ) : (
                          <Shield size={32} className="text-slate-300" />
                        )}
                      </div>
                      {item.name && (
                        <p className="text-center text-xs font-semibold leading-tight mt-2 break-words px-1" style={{ color: colors.subheading }}>{item.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {visibleItems.length > itemsPerView && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: snapCount }).map((_, idx) => (
                    <button key={idx} type="button" onClick={() => carouselApi?.scrollTo(idx)} className={cn("h-2 rounded-full transition-all", selectedSnap === idx ? 'w-6' : 'w-2')} style={{ backgroundColor: selectedSnap === idx ? colors.subheading : colors.neutralBorder }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  // Style 6: Seal - circular verification hub with satellite badges
  const renderSealStyle = () => {
    const sealItems = visibleItems;
    const hubItems = sealItems.slice(0, 3);
    return (
      <section className={cn("relative w-full overflow-hidden bg-slate-50 dark:bg-slate-950", sectionSpacingClassName, device === 'mobile' ? 'px-3' : 'px-6')}>
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/70 blur-2xl dark:bg-slate-900/70" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/70 blur-2xl dark:bg-slate-900/70" />
        <div className="container max-w-7xl mx-auto">
          {sharedHeader}
          {items.length === 0 ? <EmptyState /> : (
            <div className={cn("relative grid items-center", device === 'mobile' ? 'grid-cols-1 gap-6' : 'grid-cols-[0.9fr_1.15fr] gap-10')}>
              <div className="relative mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed opacity-60" style={{ borderColor: colors.neutralBorder }} />
                <div className="absolute inset-8 rounded-full border border-dashed opacity-80" style={{ borderColor: colors.neutralBorder }} />
                <div className="absolute inset-20 rounded-full border" style={{ borderColor: colors.sectionAccentBar }} />
                <span className="absolute left-5 top-1/2 h-2 w-2 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
                <span className="absolute right-8 top-1/4 h-2 w-2 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
                <span className="absolute bottom-16 right-14 h-2 w-2 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
                <div className="relative z-10 flex h-44 w-44 flex-col items-center justify-center rounded-full border bg-white text-center shadow-xl dark:bg-slate-900" style={{ borderColor: colors.sectionAccentBar }}>
                  <Shield size={34} style={{ color: colors.heading }} />
                  <span className="mt-4 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: colors.mutedText }}>{config?.trustCueText || DEFAULT_TRUST_CUE_TEXT}</span>
                  <div className="mt-3 h-0.5 w-8 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
                  <span className="mt-3 text-5xl font-black leading-none" style={{ color: colors.heading }}>{sealItems.length}</span>
                </div>
                {hubItems.map((item, index) => {
                  const positions = [
                    'left-1/2 top-0 -translate-x-1/2',
                    'right-0 top-[36%]',
                    'bottom-2 left-[62%] -translate-x-1/2',
                  ];
                  return (
                    <div key={item.id} className={cn('absolute z-20 flex h-24 w-16 items-center justify-center border bg-white p-2 shadow-lg dark:bg-slate-900', radiusClassName, positions[index])} style={{ borderColor: colors.neutralBorder }}>
                      {item.url ? (
                        <PreviewImage src={item.url} className="h-full w-full object-contain" alt={item.name ?? 'Chứng nhận'} />
                      ) : (
                        <Shield size={28} style={{ color: colors.subheading }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="relative">
                {sealItems.length > 3 && (
                  <div className="absolute -right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => sealApi?.scrollPrev()}
                      disabled={!canSealScrollPrev}
                      className={cn('flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition-opacity dark:bg-slate-900', !canSealScrollPrev && 'cursor-not-allowed opacity-40')}
                      style={{ borderColor: colors.sectionAccentBar, color: colors.heading }}
                    >
                      <ChevronLeft className="rotate-90" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => sealApi?.scrollNext()}
                      disabled={!canSealScrollNext}
                      className={cn('flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition-opacity dark:bg-slate-900', !canSealScrollNext && 'cursor-not-allowed opacity-40')}
                      style={{ borderColor: colors.sectionAccentBar, color: colors.heading }}
                    >
                      <ChevronRight className="rotate-90" size={16} />
                    </button>
                  </div>
                )}
                <div className="h-[360px] overflow-hidden pr-2" ref={sealRef}>
                  <div className="flex h-full flex-col gap-4">
                    {sealItems.map((item, index) => (
                      <div key={item.id} className={cn('group flex min-h-24 items-center gap-4 border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-x-1 dark:bg-slate-900', radiusClassName)} style={{ borderColor: colors.neutralBorder, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)' }}>
                        <div className={cn('flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden', innerRadiusClassName)} style={{ backgroundColor: colors.neutralBackground }}>
                          {item.url ? (
                            <PreviewImage src={item.url} className="h-full w-full object-contain" alt={item.name ?? 'Chứng nhận'} />
                          ) : (
                            <Shield size={26} style={{ color: colors.subheading }} />
                          )}
                        </div>
                        <div className="h-12 w-px shrink-0" style={{ backgroundColor: colors.neutralBorder }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-extrabold uppercase tracking-tight break-words" style={{ color: colors.heading }}>{item.name ?? 'Chứng nhận'}</p>
                          <p className="text-xs" style={{ color: colors.mutedText }}>Bằng chứng tin cậy #{index + 1}</p>
                        </div>
                        <ArrowUpRight size={18} style={{ color: colors.heading }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  // Image Guidelines Component
  const renderImageGuidelines = () => (
    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-2">
        <ImageIcon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {previewStyle === 'grid' && (
            <p><strong>A4 dọc</strong> (210:297) • Ảnh chứng nhận/bằng khen dạng giấy đứng.</p>
          )}
          {previewStyle === 'cards' && (
            <p><strong>A4 dọc</strong> (210:297) • Ảnh chứng nhận rõ chữ, ưu tiên nền sáng.</p>
          )}
          {previewStyle === 'stack' && (
            <p><strong>A4 dọc</strong> (210:297) • Danh sách tín hiệu tin cậy dùng ảnh giấy đứng.</p>
          )}
          {previewStyle === 'wall' && (
            <p><strong>A4 dọc</strong> (210:297) • Khung ảnh dọc như bằng khen/chứng nhận treo tường.</p>
          )}
          {previewStyle === 'carousel' && (
            <p><strong>A4 dọc</strong> (210:297) • Trượt nhiều chứng nhận dạng giấy đứng.</p>
          )}
          {previewStyle === 'seal' && (
            <p><strong>A4 dọc</strong> (210:297) • Thumbnail chứng nhận giữ đúng tỷ lệ giấy đứng.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PreviewWrapper 
        title="Preview Chứng nhận" 
        device={device} 
        setDevice={setDevice} 
        previewStyle={previewStyle} 
        setPreviewStyle={setPreviewStyle} 
        styles={styles} 
        info={`${items.length} chứng nhận • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {previewStyle === 'grid' && renderGridStyle()}
          {previewStyle === 'cards' && renderCardsStyle()}
          {previewStyle === 'stack' && renderStackStyle()}
          {previewStyle === 'wall' && renderWallStyle()}
          {previewStyle === 'carousel' && renderCarouselStyle()}
          {previewStyle === 'seal' && renderSealStyle()}
        </BrowserFrame>
      </PreviewWrapper>
      {mode === 'dual' ? <ColorInfoPanel brandColor={brandColor} secondary={secondary} /> : null}
      {renderImageGuidelines()}
    </>
  );
};

