'use client';

import React from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, icons, Zap } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import useEmblaCarousel from 'embla-carousel-react';
import {
  DEFAULT_FEATURES_CORNER_RADIUS,
  DEFAULT_FEATURES_DESKTOP_COLUMNS,
  getFeaturesCornerRadiusClassName,
  normalizeFeaturesCornerRadius,
  normalizeFeaturesDesktopColumns,
  type FeatureItem,
  type FeaturesBrandMode,
  type FeaturesCornerRadius,
  type FeaturesDesktopColumns,
  type FeaturesStyle,
} from '../_types';
import { getFeaturesColorTokens } from '../_lib/colors';
import { DEFAULT_SECTION_SPACING, getSectionSpacingClassName, type SectionSpacing } from '../../_shared/types/sectionSpacing';

const resolveDevice = (device?: 'mobile' | 'tablet' | 'desktop') => device ?? 'desktop';

const normalizeItems = (items: FeatureItem[]): FeatureItem[] => {
  if (!Array.isArray(items)) {return [];}
  return items
    .map((item, index) => {
      const source = item as Partial<FeatureItem> | null;
      if (!source || typeof source !== 'object') {return null;}
      return {
        id: typeof source.id === 'number' ? source.id : index + 1,
        icon: typeof source.icon === 'string' && source.icon.trim().length > 0 ? source.icon : 'Zap',
        title: typeof source.title === 'string' ? source.title : '',
        description: typeof source.description === 'string' ? source.description : '',
        ...(typeof source.image === 'string' ? { image: source.image } : {}),
      };
    })
    .filter((item): item is FeatureItem => item !== null);
};

const getItemKey = (item: FeatureItem, idx: number) => {
  const normalizedTitle = item.title.trim().toLowerCase();
  const normalizedDescription = item.description.trim().toLowerCase();
  const normalizedIcon = (item.icon ?? '').toLowerCase();
  return item.id || `${normalizedIcon}-${normalizedTitle}-${normalizedDescription}-${idx}`;
};

interface FeaturesSectionSharedProps {
  items: FeatureItem[];
  style: FeaturesStyle;
  title?: string;
  brandColor: string;
  secondary: string;
  mode: FeaturesBrandMode;
  context: 'preview' | 'site';
  device?: 'mobile' | 'tablet' | 'desktop';
  className?: string;
  skipHeader?: boolean;
  showIcons?: boolean;
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  desktopColumns?: FeaturesDesktopColumns;
  cornerRadius?: FeaturesCornerRadius;
  isDark?: boolean;
}

import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export function FeaturesSectionShared({
  items,
  style,
  title,
  brandColor,
  secondary,
  mode,
  context,
  device,
  className,
  skipHeader = false,
  showIcons = true,
  hideHeader,
  showTitle,
  subtitle,
  showSubtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  spacing = DEFAULT_SECTION_SPACING,
  desktopColumns = DEFAULT_FEATURES_DESKTOP_COLUMNS,
  cornerRadius = DEFAULT_FEATURES_CORNER_RADIUS,
  isDark,
}: FeaturesSectionSharedProps) {
  const normalizedItems = React.useMemo(() => normalizeItems(items), [items]);
  const previewDevice = resolveDevice(device);
  const resolvedDesktopColumns = normalizeFeaturesDesktopColumns(desktopColumns);
  const resolvedCornerRadius = normalizeFeaturesCornerRadius(cornerRadius);
  const cardRadiusClassName = getFeaturesCornerRadiusClassName(resolvedCornerRadius);

  const colors = React.useMemo(() => adaptTokensForDarkMode(getFeaturesColorTokens({
    primary: brandColor,
    secondary,
    mode,
  }), isDark ?? false), [brandColor, secondary, mode, isDark]);

  const sectionTitle = title?.trim() || 'Tính năng nổi bật';

  const getIcon = React.useCallback((iconName?: string) => icons[iconName as keyof typeof icons] || Zap, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  React.useEffect(() => {
    if (!emblaApi) {return;}
    const updateScrollButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on('reInit', updateScrollButtons);
    emblaApi.on('select', updateScrollButtons);
    updateScrollButtons();

    return () => {
      emblaApi.off('reInit', updateScrollButtons);
      emblaApi.off('select', updateScrollButtons);
    };
  }, [emblaApi]);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: colors.badgeBackground, color: colors.badgeText }}
      >
        <Zap size={28} />
      </div>
      <h3 className="font-semibold mb-1" style={{ color: colors.body }}>Chưa có tính năng nào</h3>
      <p className="text-sm" style={{ color: colors.muted }}>Thêm tính năng đầu tiên để bắt đầu</p>
    </div>
  );

  const isPreview = context === 'preview';
  const isMobile = previewDevice === 'mobile';
  const isTablet = previewDevice === 'tablet';
  const gridColumnsClassName = React.useMemo(() => {
    if (isPreview) {
      if (isMobile) {
        return resolvedDesktopColumns === 4 ? 'grid-cols-2' : 'grid-cols-1';
      }
      if (isTablet) {
        return resolvedDesktopColumns === 4 ? 'grid-cols-2' : 'grid-cols-3';
      }
      return resolvedDesktopColumns === 4 ? 'grid-cols-4' : 'grid-cols-3';
    }

    return resolvedDesktopColumns === 4
      ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3';
  }, [isMobile, isPreview, isTablet, resolvedDesktopColumns]);

  const renderSharedHeader = () => {
    if (skipHeader) {return null;}
    return (
      <SectionHeader
        title={sectionTitle}
        subtitle={subtitle}
        badgeText={badgeText}
        hideHeader={hideHeader}
        showTitle={showTitle}
        showSubtitle={showSubtitle}
        showBadge={showBadge}
        headerAlign={headerAlign}
        titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle}
        uppercaseText={uppercaseText}
        brandColor={brandColor}
      />
    );
  };

  const renderIconGridStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxVisible = isPreview ? (isMobile ? 4 : resolvedDesktopColumns * 2) : resolvedDesktopColumns * 2;
    const visibleItems = normalizedItems.slice(0, maxVisible);

    const gridClass = cn(
      'grid gap-4 md:gap-6',
      visibleItems.length === 1 ? 'max-w-md mx-auto' : '',
      visibleItems.length === 2 ? 'max-w-2xl mx-auto grid-cols-1 sm:grid-cols-2' : '',
      visibleItems.length >= 3
        ? (isPreview
          ? gridColumnsClassName
          : gridColumnsClassName)
        : '',
    );

    return (
      <div className={cn('py-8 px-4', isPreview && (isMobile ? 'py-6 px-3' : 'md:py-12 md:px-6'))}>
        {!skipHeader && (
          <div className="text-center mb-8 md:mb-12">
            {renderSharedHeader()}
          </div>
        )}

        <div className={gridClass}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div
                key={getItemKey(item, idx)}
                className={cn('bg-white p-6 border transition-colors flex flex-col h-full', cardRadiusClassName)}
                style={{
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                }}
              >
                {showIcons ? (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                  >
                    <IconComponent size={24} strokeWidth={2} />
                  </div>
                ) : null}
                <h3 className="font-bold text-base md:text-lg mb-2 leading-snug break-words" style={{ color: colors.body }}>
                  {item.title || 'Tên tính năng'}
                </h3>
                <p className="text-xs md:text-sm leading-relaxed break-words" style={{ color: colors.muted }}>
                  {item.description || 'Mô tả tính năng...'}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    );
  };

  const renderAlternatingStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxItems = isPreview ? (isMobile ? 4 : 6) : 6;
    const visibleItems = normalizedItems.slice(0, maxItems);

    return (
      <div className={cn('py-6 px-4', isPreview && (isMobile ? 'py-4 px-3' : 'md:py-10 md:px-6'))}>
        {!skipHeader && (
          <div className="text-center mb-6">
            {renderSharedHeader()}
          </div>
        )}

        <div className={cn('max-w-3xl mx-auto', isPreview && isMobile ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-3')}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div
                key={getItemKey(item, idx)}
                className={cn('flex items-center gap-3 p-3 border', cardRadiusClassName)}
                style={{ backgroundColor: colors.badgeBackground, borderColor: colors.cardBorder }}
              >
                {showIcons ? (
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                    >
                      <IconComponent size={18} strokeWidth={2} />
                    </div>
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      style={{ backgroundColor: colors.timelineDot }}
                    >
                      {idx + 1}
                    </span>
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-snug break-words" style={{ color: colors.body }}>
                    {item.title || 'Tên tính năng'}
                  </h3>
                  <p className="text-xs leading-snug break-words" style={{ color: colors.muted }}>
                    {item.description || 'Mô tả tính năng...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    );
  };

  const renderCompactStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxItems = isPreview ? (isMobile ? 4 : 8) : 8;
    const visibleItems = normalizedItems.slice(0, maxItems);

    return (
      <div className={cn('py-8 px-4', isPreview && (isMobile ? 'py-6 px-3' : 'md:py-12 md:px-6'))}>
        {!skipHeader && (
          <div
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 mb-6"
            style={{ borderColor: colors.sectionRule }}
          >
            <div className="space-y-2">
              {renderSharedHeader()}
            </div>
          </div>
        )}

        <div className={cn('grid gap-3', gridColumnsClassName)}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div
                key={getItemKey(item, idx)}
                className={cn('flex items-start gap-3 p-4 border', cardRadiusClassName)}
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }}
              >
                {showIcons ? (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                  >
                    <IconComponent size={18} strokeWidth={2} />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-0.5 leading-snug break-words" style={{ color: colors.body }}>
                    {item.title || 'Tính năng'}
                  </h3>
                  <p className="text-xs leading-snug break-words" style={{ color: colors.muted }}>
                    {item.description || 'Mô tả...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCardsStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxVisible = isPreview ? (isMobile ? 4 : resolvedDesktopColumns * 2) : resolvedDesktopColumns * 2;
    const visibleItems = normalizedItems.slice(0, maxVisible);

    const gridClass = cn(
      'grid gap-5',
      visibleItems.length === 1 ? 'max-w-sm mx-auto' : '',
      visibleItems.length === 2 ? 'max-w-2xl mx-auto grid-cols-1 sm:grid-cols-2' : '',
      visibleItems.length >= 3
        ? (isPreview
          ? gridColumnsClassName
          : gridColumnsClassName)
        : '',
    );

    return (
      <div className={cn('py-8 px-4', isPreview && (isMobile ? 'py-6 px-3' : 'md:py-12 md:px-6'))}>
        {!skipHeader && (
          <div className="text-center mb-8 md:mb-12">
            {renderSharedHeader()}
          </div>
        )}

        <div className={gridClass}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div
                key={getItemKey(item, idx)}
                className={cn('relative overflow-hidden border flex flex-col', cardRadiusClassName)}
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }}
              >
                <div className="h-1" style={{ backgroundColor: colors.primary }} />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    {showIcons ? (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                      >
                        <IconComponent size={22} strokeWidth={2} />
                      </div>
                    ) : null}
                    <span className="text-3xl font-bold opacity-25" style={{ color: colors.primary }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-bold text-base md:text-lg mb-2 leading-snug break-words" style={{ color: colors.body }}>
                    {item.title || 'Tên tính năng'}
                  </h3>
                  <p className="text-xs md:text-sm leading-relaxed break-words flex-1" style={{ color: colors.muted }}>
                    {item.description || 'Mô tả tính năng...'}
                  </p>
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.neutralBorder }}>
                    <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: colors.actionText }}>
                      Tìm hiểu thêm <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    );
  };

  const itemsPerView = style === 'carousel'
    ? (isPreview ? (isMobile ? 1 : isTablet ? 2 : 3) : 3)
    : 1;
  const carouselItems = normalizedItems.slice(0, 6);
  const maxCarouselIndex = Math.max(0, carouselItems.length - itemsPerView);
  const [carouselIndex, setCarouselIndex] = React.useState(0);

  React.useEffect(() => {
    if (carouselIndex > maxCarouselIndex) {
      setCarouselIndex(maxCarouselIndex);
    }
  }, [carouselIndex, maxCarouselIndex]);

  const renderCarouselStyle = () => {
    if (carouselItems.length === 0) {return renderEmptyState();}

    return (
      <div className={cn('py-8 px-4', isPreview && (isMobile ? 'py-6 px-3' : 'md:py-12 md:px-6'))}>
        <div className="flex items-end justify-between mb-8 gap-4">
          {!skipHeader && (
            <div>
              {renderSharedHeader()}
            </div>
          )}
          {carouselItems.length > itemsPerView && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCarouselIndex((current) => Math.max(0, current - 1))}
                disabled={carouselIndex === 0}
                className="w-10 h-10 rounded-full border flex items-center justify-center disabled:opacity-40"
                style={{ borderColor: colors.neutralBorder, color: colors.body }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => setCarouselIndex((current) => Math.min(maxCarouselIndex, current + 1))}
                disabled={carouselIndex >= maxCarouselIndex}
                className="w-10 h-10 rounded-full border flex items-center justify-center disabled:opacity-40"
                style={{ borderColor: colors.neutralBorder, color: colors.body }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden">
          <div
            className="flex gap-5 transition-transform duration-300"
            style={{ transform: `translateX(-${carouselIndex * (100 / itemsPerView)}%)`, width: `${(carouselItems.length / itemsPerView) * 100}%` }}
          >
            {carouselItems.map((item, idx) => {
              const IconComponent = getIcon(item.icon);
              return (
                <div key={getItemKey(item, idx)} className="flex-shrink-0" style={{ width: `${100 / carouselItems.length}%` }}>
                  <div
                    className={cn('p-6 border h-full flex flex-col', cardRadiusClassName)}
                    style={{ backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }}
                  >
                    {showIcons ? (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                      >
                        <IconComponent size={24} strokeWidth={2} />
                      </div>
                    ) : null}
                    <h3 className="font-bold text-base md:text-lg mb-2 leading-snug break-words" style={{ color: colors.body }}>
                      {item.title || 'Tên tính năng'}
                    </h3>
                    <p className="text-xs md:text-sm leading-relaxed break-words" style={{ color: colors.muted }}>
                      {item.description || 'Mô tả tính năng...'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {carouselItems.length > itemsPerView && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: maxCarouselIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCarouselIndex(idx)}
                className={cn('w-2 h-2 rounded-full transition-all', idx === carouselIndex ? 'w-6' : '')}
                style={{ backgroundColor: idx === carouselIndex ? colors.primary : colors.neutralBorder }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMediaCarouselStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxItems = isPreview ? (isMobile ? 4 : 6) : 6;
    const visibleItems = normalizedItems.slice(0, maxItems);
    const columns = isMobile ? 1 : isTablet ? 2 : 3;
    const showNavigation = visibleItems.length > columns;
    const basisClass = isPreview
      ? (isMobile ? 'basis-[88%]' : isTablet ? 'basis-[50%]' : 'basis-[33.333333%]')
      : 'basis-[88%] md:basis-[50%] lg:basis-[33.333333%]';

    return (
      <div className={cn('py-6 md:py-8 overflow-hidden', isPreview && (isMobile ? 'py-5' : 'md:py-7'))}>
        <div className="flex items-end justify-between gap-4 px-3 md:px-5 lg:px-6 mb-4 md:mb-5">
          {!skipHeader && (
            <div className="flex-1">
              {renderSharedHeader()}
            </div>
          )}
          {showNavigation && (
            <div className="flex gap-2 shrink-0 pb-2">
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canScrollPrev}
                className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-40 transition-opacity"
                style={{ borderColor: colors.neutralBorder, color: colors.body, backgroundColor: colors.cardBackground }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-40 transition-opacity"
                style={{ borderColor: colors.neutralBorder, color: colors.body, backgroundColor: colors.cardBackground }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden px-3 md:px-5 lg:px-6" ref={emblaRef}>
          <div className="flex -ml-3 touch-pan-y items-stretch">
            {visibleItems.map((item, idx) => {
              const IconComponent = getIcon(item.icon);
              return (
                <div key={getItemKey(item, idx)} className={cn('flex-none pl-3 min-w-0 flex', basisClass)}>
                  <div
                    className={cn('w-full h-full overflow-hidden border flex flex-col bg-white', cardRadiusClassName)}
                    style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardBackground }}
                  >
                    <div
                      className="relative aspect-[5/3] overflow-hidden"
                      style={{ backgroundColor: colors.badgeBackground }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <IconComponent size={34} strokeWidth={1.8} style={{ color: colors.iconChipText }} />
                        </div>
                      )}
                      <span
                        className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ backgroundColor: colors.cardBackground, color: colors.actionText }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      {showIcons ? (
                        <div
                          className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                        >
                          <IconComponent size={20} strokeWidth={2} />
                        </div>
                      ) : null}
                      <h3 className="font-bold text-base md:text-lg leading-snug break-words" style={{ color: colors.body }}>
                        {item.title || 'Tên tính năng'}
                      </h3>
                      <p className="mt-2 text-xs md:text-sm leading-relaxed break-words" style={{ color: colors.muted }}>
                        {item.description || 'Mô tả tính năng...'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderCarousel6Style = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const visibleItems = normalizedItems.slice(0, 6);
    const carouselBackground = colors.carouselBackground;
    const cardBackground = colors.carouselCardBackground;
    const cardBorder = colors.carouselCardBorder;
    const columns = isMobile ? 1 : isTablet ? 3 : 6;
    const showNavigation = isPreview ? visibleItems.length > columns : visibleItems.length > 1;
    const siteNavigationClass = !isPreview
      ? cn(
        visibleItems.length <= 1 && 'hidden',
        visibleItems.length > 1 && visibleItems.length <= 3 && 'md:hidden',
        visibleItems.length > 3 && visibleItems.length <= 6 && 'lg:hidden',
      )
      : '';
    const basisClass = isPreview
      ? (isMobile ? 'basis-[82%]' : isTablet ? 'basis-[33.333333%]' : 'basis-[16.666667%]')
      : 'basis-[82%] md:basis-[33.333333%] lg:basis-[16.666667%]';

    return (
      <div
        className={cn('py-4 md:py-6 overflow-hidden', isPreview && (isMobile ? 'py-4' : 'md:py-6'))}
        style={{ backgroundColor: carouselBackground }}
      >
        <div className="flex items-end justify-between mb-4 md:mb-5 gap-4 px-3 md:px-5 lg:px-6">
          {!skipHeader && (
            <div className="flex-1">
              {renderSharedHeader()}
            </div>
          )}
          {showNavigation && (
            <div className={cn('flex gap-2 shrink-0 pb-2', siteNavigationClass)}>
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canScrollPrev}
                className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-40 transition-opacity"
                style={{ borderColor: cardBorder, color: colors.carouselNavText, backgroundColor: cardBackground }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-40 transition-opacity"
                style={{ borderColor: cardBorder, color: colors.carouselNavText, backgroundColor: cardBackground }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden px-3 md:px-5 lg:px-6" ref={emblaRef}>
          <div className="flex -ml-2.5 md:-ml-3 touch-pan-y items-stretch">
            {visibleItems.map((item, idx) => {
              const IconComponent = getIcon(item.icon);
              return (
                <div key={getItemKey(item, idx)} className={cn('flex-none pl-2.5 md:pl-3 min-w-0 flex', basisClass)}>
                  <div
                    className={cn('w-full h-full flex flex-col relative group border-2 overflow-hidden shadow-[0_1px_2px_rgba(73,45,18,0.12)]', cardRadiusClassName)}
                    style={{ backgroundColor: cardBackground, borderColor: cardBorder }}
                  >
                    {item.image ? (
                      <div className="w-full aspect-[4/3] relative overflow-hidden shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "px-2.5 pb-3 md:px-3 md:pb-3.5 flex flex-col flex-1 items-center text-center transition-all",
                        item.image ? "pt-0" : "pt-3 md:pt-4"
                      )}
                      style={{ backgroundColor: cardBackground }}
                    >
                      {showIcons ? (
                        <div
                          className={cn(
                            "w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-[3px]",
                            item.image ? "-mt-6 mb-2.5 relative z-10" : "mb-2.5 mt-0"
                          )}
                          style={{ backgroundColor: colors.carouselIconBackground, color: colors.carouselIconText, borderColor: cardBackground }}
                        >
                          <IconComponent size={21} strokeWidth={2} />
                        </div>
                      ) : null}
                      <h3 className="font-bold text-[13px] md:text-[14px] mb-1.5 leading-snug text-balance break-words" style={{ color: colors.carouselText }}>
                        {item.title || 'Tên tính năng'}
                      </h3>
                      <p className="text-[11px] md:text-xs leading-snug break-words" style={{ color: colors.carouselMuted }}>
                        {item.description || 'Mô tả tính năng...'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const styleRenderer: Record<FeaturesStyle, () => React.ReactNode> = {
    iconGrid: renderIconGridStyle,
    alternating: renderAlternatingStyle,
    compact: renderCompactStyle,
    cards: renderCardsStyle,
    carousel: renderCarouselStyle,
    timeline: renderMediaCarouselStyle,
    carousel6: renderCarousel6Style,
  };

  const content = styleRenderer[style] ? styleRenderer[style]() : renderIconGridStyle();

  return (
    <div className={cn(className, getSectionSpacingClassName(spacing))} style={{ backgroundColor: style === 'carousel6' ? colors.carouselBackground : colors.sectionBackground }}>
      {content}
    </div>
  );
}
