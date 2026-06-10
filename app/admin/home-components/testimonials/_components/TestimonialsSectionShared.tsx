'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { Quote, Star, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../../components/ui';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import type { PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { TestimonialsColorTokens } from '../_lib/colors';
import { getTestimonialsSectionSpacingClassName } from '../_types';
import type {
  TestimonialsAvatarType,
  TestimonialsBrandMode,
  TestimonialsCornerRadius,
  TestimonialsDesktopColumns,
  TestimonialsItem,
  TestimonialsPersistItem,
  TestimonialsStyle,
} from '../_types';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';

type TestimonialsContext = 'preview' | 'site';

interface TestimonialsSectionSharedProps {
  items: Array<TestimonialsItem | TestimonialsPersistItem>;
  style: TestimonialsStyle;
  title?: string;
  subtitle?: string;
  tokens: TestimonialsColorTokens;
  mode: TestimonialsBrandMode;
  context: TestimonialsContext;
  device?: PreviewDevice;
  fontClassName?: string;
  fontStyle?: React.CSSProperties;
  // Header config
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  desktopColumns?: TestimonialsDesktopColumns;
  splitBackgroundImage?: string;
  splitBackgroundOverlayOpacity?: number;
  spacing?: SectionSpacing;
  cornerRadius?: TestimonialsCornerRadius;
}

interface NormalizedTestimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatarType: TestimonialsAvatarType;
  avatarUrl: string;
  avatarIcon: string;
}

const resolveIconComponent = (iconName: string) => {
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return iconMap[iconName] ?? LucideIcons.User;
};

const toText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const normalizeItems = (items: Array<TestimonialsItem | TestimonialsPersistItem>) => items.map((raw, index) => {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const avatar = toText(item.avatar);
  const avatarUrl = toText(item.avatarUrl) || avatar;
  const avatarIcon = toText(item.avatarIcon);
  const avatarType = item.avatarType === 'image' || item.avatarType === 'upload' || item.avatarType === 'icon' || item.avatarType === 'initials'
    ? item.avatarType
    : avatarIcon ? 'icon' : avatarUrl ? 'image' : 'initials';
  const idCandidate = toText(item.id);

  return {
    avatarIcon: avatarType === 'icon' ? avatarIcon : '',
    avatarType,
    avatarUrl: (avatarType === 'image' || avatarType === 'upload') ? avatarUrl : '',
    company: toText(item.company),
    content: toText(item.content),
    id: idCandidate || `testimonial-${index + 1}`,
    name: toText(item.name),
    rating: Math.max(1, Math.min(5, Number.isFinite(item.rating) ? Number(item.rating) : 5)),
    role: toText(item.role),
  } satisfies NormalizedTestimonial;
});

const getInitials = (name: string) => {
  if (!name) {return 'NA';}
  const names = name.trim().split(/\s+/);
  if (names.length === 1) {return names[0].slice(0, 2).toUpperCase();}
  return `${names[0][0] ?? ''}${names[names.length - 1][0] ?? ''}`.toUpperCase();
};

const getPreviewLimit = (style: TestimonialsStyle, device: PreviewDevice) => {
  if (style === 'marquee') {
    if (device === 'mobile') {return 6;}
    if (device === 'tablet') {return 8;}
    return 10;
  }

  if (style === 'showcase') {
    if (device === 'mobile') {return 4;}
    if (device === 'tablet') {return 5;}
    return 6;
  }

  if (style === 'split-carousel' || style === 'overlap-carousel') {
    if (device === 'mobile') {return 4;}
    if (device === 'tablet') {return 5;}
    return 6;
  }

  if (style === 'builder-cards' || style === 'builder-carousel') {
    if (device === 'mobile') {return 4;}
    if (device === 'tablet') {return 5;}
    return 6;
  }

  if (device === 'mobile') {return 4;}
  if (device === 'tablet') {return 6;}
  return 8;
};

const getCardsGridClassName = (context: TestimonialsContext, device: PreviewDevice, desktopColumns: TestimonialsDesktopColumns) => {
  if (context === 'preview') {
    if (device === 'mobile') {return desktopColumns === 3 ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4';}
    if (device === 'tablet') {return desktopColumns === 3 ? 'grid-cols-3 gap-4' : 'grid-cols-2 gap-4';}
    return desktopColumns === 3 ? 'grid-cols-3 gap-5' : 'grid-cols-4 gap-4';
  }

  return desktopColumns === 3
    ? 'grid-cols-1 md:grid-cols-3 gap-5 md:gap-8'
    : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5';
};

const getOverlapItemBasisClassName = (context: TestimonialsContext, device: PreviewDevice, desktopColumns: TestimonialsDesktopColumns) => {
  if (context === 'preview') {
    if (desktopColumns === 3) {
      return device === 'mobile' ? 'basis-full' : 'basis-1/3';
    }

    return device === 'desktop' ? 'basis-1/4' : 'basis-1/2';
  }

  return desktopColumns === 3
    ? 'basis-full @3xl:basis-1/3'
    : 'basis-1/2 @5xl:basis-1/4';
};

const buildMetaLine = (item: NormalizedTestimonial) => {
  const parts = [item.role.trim(), item.company.trim()].filter(Boolean);
  return parts.join(', ');
};

const clampOverlayOpacity = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {return 62;}
  return Math.max(0, Math.min(90, Math.round(value)));
};

const getOuterShellClassName = (style: TestimonialsStyle, context: TestimonialsContext, device: PreviewDevice) => {
  const isPreview = context === 'preview';

  if (style === 'showcase') {
    return isPreview
      ? (device === 'mobile' ? 'max-w-[92%] mx-auto px-2' : 'max-w-[94%] mx-auto px-3')
      : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';
  }

  if (style === 'quote') {
    return isPreview
      ? (device === 'mobile' ? 'max-w-[94%] mx-auto px-1.5' : 'max-w-[95%] mx-auto px-2')
      : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';
  }

  if (style === 'marquee') {
    return isPreview
      ? 'max-w-[96%] mx-auto px-1'
      : 'max-w-[1600px] mx-auto px-4 sm:px-6';
  }

  if (style === 'slider') {
    return isPreview
      ? (device === 'mobile' ? 'max-w-[95%] mx-auto px-1' : 'max-w-[96%] mx-auto px-2')
      : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';
  }

  if (style === 'split-carousel' || style === 'overlap-carousel') {
    return isPreview
      ? 'w-full'
      : 'w-full';
  }

  if (style === 'minimal') {
    return isPreview
      ? 'max-w-[94%] mx-auto px-1.5'
      : 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8';
  }

  if (style === 'builder-cards') {
    return isPreview
      ? 'max-w-[96%] mx-auto px-1'
      : 'max-w-[1250px] mx-auto px-4 sm:px-6';
  }

  if (style === 'builder-carousel') {
    return isPreview
      ? 'max-w-[96%] mx-auto px-1'
      : 'max-w-[1300px] mx-auto px-[15px]';
  }

  return isPreview
    ? 'max-w-[95%] mx-auto px-1.5'
    : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';
};

const getCornerRadiusClassName = (cornerRadius: TestimonialsCornerRadius, size: 'section' | 'card') => {
  if (cornerRadius === 'none') {return 'rounded-none';}
  if (cornerRadius === 'sm') {return size === 'section' ? 'rounded-[0.625rem]' : 'rounded-[8.5px]';}
  return size === 'section' ? 'rounded-[1.25rem]' : 'rounded-[17px]';
};

const RatingStars = ({ rating, bright = false, compact = false }: { rating: number; bright?: boolean; compact?: boolean }) => (
  <div className="flex gap-[2px] md:gap-[3px] shrink-0" aria-label={`Đánh giá ${rating} sao`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          compact ? 'h-3 w-3 md:h-3.5 md:w-3.5' : 'h-3.5 w-3.5 md:h-[18px] md:w-[18px]',
          i < rating
            ? (bright ? 'fill-amber-300 text-amber-300 drop-shadow-sm' : 'fill-amber-400 text-amber-400')
            : 'fill-gray-200/60 text-gray-200/60',
        )}
      />
    ))}
  </div>
);


const AvatarDisplay = ({
  item,
  context,
  className = '',
  innerClassName = '',
}: {
  item: NormalizedTestimonial;
  context: TestimonialsContext;
  className?: string;
  innerClassName?: string;
}) => {
  const IconCmp = resolveIconComponent(item.avatarIcon);

  const renderContent = () => {
    if ((item.avatarType === 'image' || item.avatarType === 'upload') && item.avatarUrl) {
      return (
        <Image
          src={item.avatarUrl}
          alt={item.name || 'Avatar'}
          fill
          sizes="128px"
          className={cn('h-full w-full object-cover', innerClassName)}
          unoptimized={context === 'preview'}
        />
      );
    }

    if (item.avatarType === 'icon') {
      return (
        <div className={cn('w-full h-full flex items-center justify-center', innerClassName)} style={{ backgroundColor: 'var(--token-secondary)', color: 'var(--token-primary)' }}>
          <IconCmp className="w-1/2 h-1/2" />
        </div>
      );
    }

    return (
      <div className={cn('w-full h-full flex items-center justify-center font-bold uppercase tracking-wider', innerClassName)} style={{ backgroundColor: 'var(--token-secondary)', color: 'var(--token-primary)' }}>
        {getInitials(item.name)}
      </div>
    );
  };

  return <div className={cn('overflow-hidden shrink-0 relative', className)}>{renderContent()}</div>;
};

export function TestimonialsSectionShared({
  items,
  style,
  title,
  subtitle,
  tokens,
  mode,
  context,
  device = 'desktop',
  fontClassName,
  fontStyle,
  hideHeader,
  showTitle = true,
  showSubtitle = true,
  headerAlign = 'center',
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  desktopColumns = 3,
  splitBackgroundImage,
  splitBackgroundOverlayOpacity = 62,
  spacing = 'normal',
  cornerRadius = 'lg',
}: TestimonialsSectionSharedProps) {
  const isPreview = context === 'preview';
  const normalizedItems = React.useMemo(() => normalizeItems(items), [items]);
  const visibleItems = React.useMemo(
    () => (isPreview ? normalizedItems.slice(0, getPreviewLimit(style, device)) : normalizedItems),
    [device, isPreview, normalizedItems, style],
  );
  const quoteItems = React.useMemo(() => visibleItems.slice(0, 5), [visibleItems]);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [quoteIdx, setQuoteIdx] = React.useState(0);
  const [splitIdx, setSplitIdx] = React.useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  const [quoteEmblaRef, quoteEmblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    dragFree: false,
    duration: 24,
    loop: quoteItems.length > 1,
  });

  React.useEffect(() => {
    if (activeIdx >= visibleItems.length) { setActiveIdx(0); }
    if (quoteIdx >= quoteItems.length) { setQuoteIdx(0); }
    if (splitIdx >= visibleItems.length) { setSplitIdx(0); }
  }, [activeIdx, quoteIdx, quoteItems.length, splitIdx, visibleItems.length]);

  React.useEffect(() => {
    if (!emblaApi || style !== 'split-carousel') {return;}

    const updateSelected = () => {
      setSplitIdx(emblaApi.selectedScrollSnap());
    };

    updateSelected();
    emblaApi.on('select', updateSelected);
    emblaApi.on('reInit', updateSelected);

    return () => {
      emblaApi.off('select', updateSelected);
      emblaApi.off('reInit', updateSelected);
    };
  }, [emblaApi, style]);

  React.useEffect(() => {
    if (!quoteEmblaApi || style !== 'quote') {return;}

    const updateSelected = () => {
      setQuoteIdx(quoteEmblaApi.selectedScrollSnap());
    };

    updateSelected();
    quoteEmblaApi.on('select', updateSelected);
    quoteEmblaApi.on('reInit', updateSelected);

    return () => {
      quoteEmblaApi.off('select', updateSelected);
      quoteEmblaApi.off('reInit', updateSelected);
    };
  }, [quoteEmblaApi, style]);

  const heading = showTitle !== false ? (title?.trim() || 'Khách hàng nói gì về chúng tôi') : undefined;
  const sectionSubtitle = showSubtitle !== false ? (subtitle?.trim() || 'Đánh giá nổi bật') : undefined;
  const sectionSpacingClassName = getTestimonialsSectionSpacingClassName(spacing);
  const baseClassName = cn(fontClassName, 'w-full', style === 'overlap-carousel' ? 'py-0' : sectionSpacingClassName);
  const baseStyle = {
    ...fontStyle,
    fontFamily: "'Be Vietnam Pro', var(--font-active, var(--font-be-vietnam-pro)), sans-serif",
    '--token-primary': tokens.primary,
    '--token-secondary': tokens.secondary,
  } as React.CSSProperties;
  const outerShellClassName = getOuterShellClassName(style, context, device);
  const splitOverlayAlpha = clampOverlayOpacity(splitBackgroundOverlayOpacity) / 100;

  if (visibleItems.length === 0) {
    return (
      <section className={baseClassName} style={baseStyle} data-mode={mode}>
        <div className={cn('py-12', outerShellClassName)} style={{ backgroundColor: tokens.neutralBackground }}>
          <div className={cn('max-w-3xl mx-auto flex flex-col items-center justify-center border p-10 text-center', getCornerRadiusClassName(cornerRadius, 'card'))} style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: tokens.iconSurface }}>
              <Star size={28} style={{ color: tokens.quoteSecondary }} />
            </div>
            <p className="font-semibold" style={{ color: tokens.headingPrimary }}>Chưa có đánh giá nào</p>
            <p className="text-sm mt-1" style={{ color: tokens.neutralMuted }}>Thêm đánh giá đầu tiên để xem preview</p>
          </div>
        </div>
      </section>
    );
  }

  const renderMinimal = () => (
    <div className={cn('w-full border border-gray-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden', getCornerRadiusClassName(cornerRadius, 'section'))}>
      {!hideHeader && (heading || sectionSubtitle) && (
        <div className="px-4 py-4 md:px-8 md:py-5 border-b border-gray-100/80 flex flex-col items-center justify-center text-center gap-1.5 bg-gray-50/30">
          <SectionHeader title={heading} subtitle={sectionSubtitle} headerAlign={headerAlign ?? 'center'} className="mb-0" titleColorPrimary={titleColorPrimary} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText} subtitleAboveTitle={subtitleAboveTitle} />
        </div>
      )}
      <div className="px-4 py-4 md:px-8 md:py-5 flex flex-col gap-0">
        {visibleItems.slice(0, 3).map((item, idx) => (
          <div key={item.id} className={cn('flex flex-col gap-3', idx !== 0 && 'pt-4 md:pt-6 border-t border-gray-100 mt-4 md:mt-6')}>
            <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3 w-full">
              <div className="flex items-center gap-2 md:gap-3 min-w-[160px] flex-1">
                <AvatarDisplay item={item} context={context} className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-sm ring-2 ring-[var(--token-primary)]/10" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-gray-900 text-sm md:text-base break-words leading-tight">{item.name}</span>
                  <div className="flex flex-wrap gap-1 items-center mt-0.5">
                    {item.role ? (
                      <span className="text-[var(--token-primary)] text-xs md:text-sm font-semibold break-words">
                        {item.role}
                      </span>
                    ) : null}
                    {item.company ? (
                      <span className="text-gray-500 font-medium text-[10px] md:text-xs truncate max-w-[100px] sm:max-w-[160px]">
                        {item.company}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                <RatingStars rating={item.rating} />
              </div>
            </div>
            <div className="relative">
              <p className="text-gray-700 text-sm md:text-[1rem] leading-[1.6] break-words text-pretty">
                "{item.content}"
              </p>
            </div>
          </div>
        ))}
        <div className="mt-5 md:mt-6 flex justify-center pb-1">
          <button
            type="button"
            className="flex min-h-[40px] items-center justify-center rounded-full px-6 font-semibold text-sm transition-all hover:opacity-90 active:scale-95 group"
            style={{ backgroundColor: 'var(--token-primary)', color: tokens.buttonPrimaryText }}
          >
            Xem thêm đánh giá
            <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderCards = () => {
    const isFourColumn = desktopColumns === 4;

    return (
      <div className="w-full">
        {!hideHeader && <SectionHeader title={heading} subtitle={sectionSubtitle} headerAlign={headerAlign ?? 'center'} titleColorPrimary={titleColorPrimary} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText} subtitleAboveTitle={subtitleAboveTitle} />}
        <div className={cn('grid', getCardsGridClassName(context, device, desktopColumns))}>
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                'group relative flex w-full min-w-0 flex-col border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--token-primary)] hover:shadow-lg',
                getCornerRadiusClassName(cornerRadius, 'card'),
                isFourColumn ? 'p-3 md:p-4' : 'p-4 md:p-6',
              )}
            >
              <Quote className={cn(
                'absolute text-[var(--token-secondary)] opacity-40 transition-all duration-300 group-hover:scale-110 group-hover:text-[var(--token-primary)] group-hover:opacity-20 shrink-0',
                isFourColumn ? 'right-3 top-3 h-5 w-5 md:h-6 md:w-6' : 'right-4 top-4 h-6 w-6 md:right-5 md:top-5 md:h-8 md:w-8',
              )} />
              <div className="shrink-0"><RatingStars rating={item.rating} compact={isFourColumn} /></div>
              <p className={cn(
                'flex-grow break-words text-pretty text-sm leading-[1.6] text-gray-700',
                isFourColumn ? 'my-3 line-clamp-4' : 'mb-4 mt-3 md:mb-5 md:mt-4 md:text-[15px]',
              )}>
                "{item.content}"
              </p>
              <div className={cn(
                'mt-auto flex min-w-0 border-t border-gray-50 pt-3',
                isFourColumn ? 'items-start gap-2' : 'items-center gap-2.5',
              )}>
                <AvatarDisplay item={item} context={context} className={cn('rounded-full shadow-inner', isFourColumn ? 'h-8 w-8 md:h-9 md:w-9' : 'h-9 w-9 md:h-10 md:w-10')} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <h4 className={cn('break-words font-bold leading-tight text-gray-900', isFourColumn ? 'text-xs' : 'text-xs md:text-sm')}>{item.name}</h4>
                  <p className={cn('mt-0.5 font-medium text-gray-500', isFourColumn ? 'line-clamp-2 text-[10px] leading-snug' : 'truncate text-[10px] md:text-xs')}>
                    {item.role ? <span className={cn('text-[var(--token-primary)] align-bottom', isFourColumn ? 'break-words' : 'inline-block max-w-[80px] truncate')}>{item.role}</span> : null}
                    {item.role && item.company ? <span className="mx-1 opacity-40">•</span> : null}
                    {item.company ? <span className={cn('align-bottom', isFourColumn ? 'break-words' : 'inline-block max-w-[80px] truncate')}>{item.company}</span> : null}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSlider = () => (
    <div className="w-full relative @container">
      {!hideHeader && <SectionHeader title={heading} subtitle={sectionSubtitle} headerAlign={headerAlign === 'center' ? 'center' : 'left'} className="mb-4 md:mb-7 w-full px-1 md:px-2" titleColorPrimary={titleColorPrimary} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText} subtitleAboveTitle={subtitleAboveTitle} />}

      <div className="overflow-hidden w-full pb-3 px-1 md:px-2" ref={emblaRef}>
        <div className="flex backface-hidden -ml-3 md:-ml-5 touch-pan-y items-stretch">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex-none basis-[72%] sm:basis-[320px] md:basis-[370px] lg:basis-[420px] pl-3 md:pl-5 min-w-0">
              <div className={cn('h-full bg-white p-4 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]', getCornerRadiusClassName(cornerRadius, 'card'))}>
                <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
                  <div className="shrink-0"><RatingStars rating={item.rating} /></div>
                  <Quote className="h-5 w-5 md:h-6 md:w-6 text-[var(--token-primary)] opacity-20 shrink-0" />
                </div>
                <p className="text-gray-700 text-sm md:text-[15px] leading-[1.6] mb-5 flex-grow break-words text-pretty">
                  &ldquo;{item.content}&rdquo;
                </p>
                <div className="flex items-center gap-2.5 pt-3 md:pt-4 border-t border-gray-50 mt-auto min-w-0">
                  <AvatarDisplay item={item} context={context} className="h-9 w-9 md:h-10 md:w-10 rounded-full shadow-inner" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 text-xs md:text-sm break-words leading-tight">{item.name}</h4>
                    <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.role ? <span className="text-[var(--token-primary)]">{item.role}</span> : null}
                      {item.company ? (
                        <>
                          {item.role ? <span className="opacity-40 mx-1">•</span> : null}
                          <span>{item.company}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 px-2 text-xs text-gray-400 font-medium sm:hidden">
        <ChevronRight className="w-3 h-3 rotate-180" /> Vuốt ngang để xem thêm <ChevronRight className="w-3 h-3" />
      </div>
      <div className="hidden sm:flex mt-2 items-center justify-end gap-1 px-2 text-xs text-gray-400 font-medium animate-pulse">
        <span>Kéo xem thêm</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );

  const renderSplitCarousel = () => (
    <div
      className="relative w-full overflow-hidden bg-slate-900 @container"
      style={splitBackgroundImage ? {
        backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, ${splitOverlayAlpha}), rgba(15, 23, 42, ${Math.max(0.35, splitOverlayAlpha - 0.12)})), url("${splitBackgroundImage}")`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      } : {
        background: `linear-gradient(90deg, rgba(15, 23, 42, ${splitOverlayAlpha}), rgba(15, 23, 42, ${Math.max(0.35, splitOverlayAlpha - 0.12)}))`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/35 via-slate-900/10 to-slate-950/25" />
      <div className="relative z-10 mx-auto grid min-h-[300px] w-full max-w-6xl items-center gap-6 px-4 py-8 @3xl:min-h-[340px] @3xl:px-6 @4xl:grid-cols-2 @4xl:gap-12 @4xl:py-10">
        {!hideHeader && (
          <div className={cn('order-1 text-white @4xl:order-2', headerAlign === 'center' ? 'text-center' : headerAlign === 'right' ? 'text-right' : 'text-left')}>
            {showBadge !== false && badgeText ? (
              <div className="mb-4">
                <span className="inline-flex rounded-full bg-[var(--token-primary)] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/10">
                  {badgeText}
                </span>
              </div>
            ) : null}
            {heading ? (
              <h2 className={cn(
                'text-3xl font-extrabold leading-tight tracking-tight text-white @3xl:text-4xl @4xl:text-5xl',
                uppercaseText && 'uppercase',
              )}>
                {heading}
              </h2>
            ) : null}
            {sectionSubtitle ? (
              <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-white/90 @3xl:text-base @3xl:leading-7">
                {sectionSubtitle}
              </p>
            ) : null}
          </div>
        )}

        <div className={cn('order-2 min-w-0 @4xl:order-1', hideHeader && '@4xl:col-span-2')}>
          <div className="overflow-hidden pb-5" ref={emblaRef}>
            <div className="flex -ml-4 touch-pan-y">
              {visibleItems.map((item) => (
                <div key={item.id} className="min-w-0 flex-none basis-full pl-4 @3xl:basis-[78%] @4xl:basis-full">
                  <div className={cn('relative h-full border border-white/70 bg-white p-4 shadow-[0_24px_70px_-26px_rgba(0,0,0,0.65)] @3xl:p-6', getCornerRadiusClassName(cornerRadius, 'card'))}>
                    <div className="flex items-start gap-3 @3xl:gap-4">
                      <AvatarDisplay item={item} context={context} className="h-16 w-16 rounded-full shadow-sm ring-4 ring-[var(--token-primary)]/20 @3xl:h-20 @3xl:w-20" />
                      <div className="min-w-0 flex-1">
                        <h4 className="break-words text-base font-bold leading-tight text-gray-950 @3xl:text-lg">{item.name}</h4>
                        {item.role || item.company ? (
                          <p className="mt-1 text-xs font-medium text-gray-500 @3xl:text-sm">
                            {item.role || item.company}
                          </p>
                        ) : null}
                        <div className="mt-2">
                          <RatingStars rating={item.rating} />
                        </div>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--token-primary)] text-white @3xl:h-12 @3xl:w-12">
                        <Quote className="h-5 w-5 fill-current @3xl:h-6 @3xl:w-6" />
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-gray-700 text-pretty @3xl:text-base @3xl:leading-8">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3 @4xl:justify-start">
            {visibleItems.slice(0, 4).map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { emblaApi?.scrollTo(index); }}
                aria-label={`Chọn đánh giá ${index + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                  index === splitIdx ? 'w-8 bg-[var(--token-primary)]' : 'w-2 bg-white/55',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverlapCarousel = () => (
    <div className="relative w-full overflow-hidden bg-[#f1e8d7] @container">
      {!hideHeader && (heading || sectionSubtitle) ? (
        <div className="mx-auto max-w-6xl px-4 pt-8 @3xl:px-6 @4xl:pt-10">
          <SectionHeader
            title={heading}
            subtitle={sectionSubtitle}
            headerAlign={headerAlign ?? 'center'}
            titleColorPrimary={titleColorPrimary}
            uppercaseText={uppercaseText}
            showBadge={showBadge}
            badgeText={badgeText}
            subtitleAboveTitle={subtitleAboveTitle}
          />
        </div>
      ) : null}

      <div className="relative mx-auto w-full max-w-[1259px] px-4 pb-8 pt-4 @3xl:px-5 @4xl:pb-10">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex cursor-grab touch-pan-y select-none items-stretch -ml-5 active:cursor-grabbing">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'relative min-w-0 flex-none pl-5 pb-2 pt-10',
                  getOverlapItemBasisClassName(context, device, desktopColumns),
                )}
              >
                <AvatarDisplay
                  item={item}
                  context={context}
                  className="absolute left-10 top-0 z-10 h-20 w-20 rounded-full border-[1.6px] border-white bg-[#ebebeb] text-sm shadow-sm"
                  innerClassName="object-cover"
                />
                <div className="flex h-full min-h-[220px] flex-col bg-white px-5 pb-5 pt-[46px] shadow-[0_1px_2px_rgba(60,64,67,0.1),0_2px_6px_2px_rgba(60,64,67,0.15)]">
                  <div className="min-w-0">
                    <b className="block break-words text-lg font-bold leading-normal text-gray-950">
                      {item.name}
                    </b>
                    {item.role || item.company ? (
                      <span className="mt-1 block break-words text-sm font-normal leading-relaxed text-[#757575]">
                        {item.role || item.company}
                      </span>
                    ) : null}
                    <div className="mt-2 min-h-[100px]">
                      <p className="whitespace-pre-line break-words text-sm leading-[1.7] text-gray-700 @3xl:text-base">
                        &ldquo;{item.content}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute left-3 top-[calc(50%+20px)] hidden h-9 w-9 -translate-x-8 -translate-y-1/2 rotate-180 items-center justify-center opacity-0 transition-opacity duration-300 @5xl:flex">
          <ChevronRight className="h-8 w-8 text-black" />
        </div>
        <div className="pointer-events-none absolute right-3 top-[calc(50%+20px)] hidden h-9 w-9 translate-x-8 -translate-y-1/2 items-center justify-center opacity-0 transition-opacity duration-300 @5xl:flex">
          <ChevronRight className="h-8 w-8 text-black" />
        </div>
      </div>
    </div>
  );

  const renderBuilderCards = () => (
    <div className={cn('relative w-full overflow-hidden px-3 pb-5 pt-3 @container @3xl:px-4 @3xl:pb-7 @3xl:pt-4', getCornerRadiusClassName(cornerRadius, 'section'))} style={{ backgroundColor: tokens.neutralBackground }}>
      {!hideHeader && (heading || sectionSubtitle) ? (
        <div className="mx-auto max-w-5xl px-1 pb-2 @3xl:pb-3">
          <SectionHeader
            title={heading}
            subtitle={sectionSubtitle}
            headerAlign={headerAlign ?? 'center'}
            titleColorPrimary={titleColorPrimary}
            uppercaseText={uppercaseText}
            showBadge={showBadge}
            badgeText={badgeText}
            subtitleAboveTitle={subtitleAboveTitle}
          />
        </div>
      ) : null}

      <div
        className={cn(
          'grid items-stretch gap-3 pt-9 @3xl:gap-4 @3xl:pt-10',
          context === 'preview'
            ? (desktopColumns === 4
                ? (device === 'desktop' ? 'grid-cols-4' : 'grid-cols-2')
                : (device === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'))
            : (desktopColumns === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'),
        )}
      >
        {visibleItems.map((item) => (
          <article
            key={item.id}
            className={cn('relative flex min-h-[230px] flex-col px-4 pb-4 pt-14 text-center shadow-[0_8px_24px_rgba(15,23,42,0.055)] @3xl:min-h-[250px] @3xl:px-5 @3xl:pb-5 @3xl:pt-16', getCornerRadiusClassName(cornerRadius, 'card'))}
            style={{ backgroundColor: tokens.cardSurface }}
          >
            <Quote
              className="absolute left-7 top-7 h-7 w-7 opacity-15 @3xl:left-8 @3xl:top-8 @3xl:h-8 @3xl:w-8"
              style={{ color: 'var(--token-primary)' }}
            />
            <AvatarDisplay
              item={item}
              context={context}
              className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-white text-xl shadow-[4px_10px_22px_rgba(0,0,0,0.14)] @3xl:h-[88px] @3xl:w-[88px]"
              innerClassName="object-cover"
            />
            <p className="min-h-[84px] flex-1 text-[13px] font-medium leading-[1.65] text-slate-700 text-pretty line-clamp-5 @3xl:text-sm">
              {item.content}
            </p>
            <div className="mt-3 flex justify-center">
              <RatingStars rating={item.rating} compact />
            </div>
            <strong className="mt-2 block text-base font-bold leading-[1.35] @3xl:text-lg" style={{ color: 'var(--token-primary)' }}>
              {item.name}
            </strong>
            {item.role || item.company ? (
              <span className="mt-0.5 block text-xs font-bold text-slate-900 @3xl:text-sm">
                {item.role || item.company}
              </span>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );

  const renderBuilderCarousel = () => {
    const isFourColumnBuilderCarousel = desktopColumns === 4;
    const itemBasisClassName = context === 'preview'
      ? (isFourColumnBuilderCarousel
          ? (device === 'desktop' ? 'basis-1/4' : 'basis-1/2')
          : (device === 'mobile' ? 'basis-full' : 'basis-1/3'))
      : (isFourColumnBuilderCarousel
          ? 'basis-1/2 lg:basis-1/4'
          : 'basis-full md:basis-1/3');

    return (
      <div
        className={cn('relative w-full overflow-hidden @container', getCornerRadiusClassName(cornerRadius, 'section'))}
        style={{ backgroundColor: tokens.neutralBackground }}
      >
        <div className={cn('overflow-hidden bg-white', getCornerRadiusClassName(cornerRadius, 'section'))}>
          {!hideHeader && (heading || sectionSubtitle) ? (
            <div className="mx-auto max-w-5xl px-5 pb-1 pt-5 @3xl:px-8 @3xl:pt-7">
              <SectionHeader
                title={heading}
                subtitle={sectionSubtitle}
                headerAlign={headerAlign ?? 'center'}
                titleColorPrimary={titleColorPrimary}
                uppercaseText={uppercaseText}
                showBadge={showBadge}
                badgeText={badgeText}
                subtitleAboveTitle={subtitleAboveTitle}
                className="mb-0"
              />
            </div>
          ) : null}

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex cursor-grab touch-pan-y select-none items-stretch active:cursor-grabbing">
              {visibleItems.map((item, index) => (
                <article
                  key={item.id}
                  className={cn(
                    'relative flex min-w-0 flex-none flex-col bg-white',
                    isFourColumnBuilderCarousel ? 'px-2.5 py-3.5 @3xl:px-4 @3xl:py-5' : 'px-5 py-5 @3xl:px-[30px] @3xl:py-6',
                    itemBasisClassName,
                  )}
                >
                  <p className={cn(
                    'whitespace-pre-line break-words text-[#9a9a9a] text-pretty',
                    isFourColumnBuilderCarousel ? 'mb-2.5 min-h-[58px] text-[11px] leading-[16px] @3xl:text-xs @3xl:leading-[18px]' : 'mb-[12px] min-h-[58px] text-[13px] leading-[19.5px]',
                  )}>
                    {item.content}
                  </p>

                  <div className={cn('relative flex min-w-0 items-center', isFourColumnBuilderCarousel ? 'gap-1.5 @3xl:gap-2' : 'pr-10')}>
                    <AvatarDisplay
                      item={item}
                      context={context}
                      className={cn(
                        'rounded-full border border-[var(--token-primary)] bg-white text-sm',
                        isFourColumnBuilderCarousel ? 'h-8 w-8 @3xl:h-11 @3xl:w-11' : 'mr-[15px] h-[60px] w-[60px]',
                      )}
                      innerClassName="object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <strong className={cn('block font-bold leading-tight break-words', isFourColumnBuilderCarousel ? 'text-[11px] @3xl:text-xs' : 'text-sm')} style={{ color: 'var(--token-primary)' }}>
                        {item.name}
                      </strong>
                      {item.role || item.company ? (
                        <span className={cn('mt-0.5 block leading-tight text-slate-700 break-words', isFourColumnBuilderCarousel ? 'text-[11px] @3xl:text-xs' : 'text-sm')}>
                          {item.role || item.company}
                        </span>
                      ) : null}
                    </div>
                    <Quote
                      className={cn(
                        'fill-current opacity-50',
                        isFourColumnBuilderCarousel ? 'h-[18px] w-[18px] shrink-0 @3xl:h-6 @3xl:w-6' : 'absolute right-0 top-1/2 h-[45px] w-[45px] -translate-y-1/2',
                      )}
                      style={{ color: 'var(--token-primary)' }}
                    />
                  </div>
                  {index < visibleItems.length - 1 ? (
                    <span className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 text-lg font-light text-slate-200 @3xl:block">
                      |
                    </span>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMarqueeCard = (item: NormalizedTestimonial, key: string, companyMode: 'company' | 'role') => (
    <div key={key} className={cn('w-[260px] md:w-[320px] bg-white border border-gray-100 p-4 md:p-5 shadow-sm flex flex-col gap-3', getCornerRadiusClassName(cornerRadius, 'card'))}>
      <div className="flex items-center gap-3">
        <AvatarDisplay item={item} context={context} className="w-10 h-10 rounded-full ring-2 ring-gray-50" />
        <div className="min-w-0">
          <h4 className="font-bold text-gray-900 truncate text-sm">{item.name}</h4>
          <p className="text-xs text-gray-500 truncate">{companyMode === 'company' ? (item.company || item.role) : (item.role || item.company)}</p>
        </div>
      </div>
      <RatingStars rating={item.rating} />
      <p className="text-gray-700 text-xs md:text-sm line-clamp-3 leading-relaxed">"{item.content}"</p>
    </div>
  );

  const renderMarquee = () => {
    const row1 = [...visibleItems, ...visibleItems, ...visibleItems];
    const row2 = [...visibleItems].reverse();
    const row2Dup = [...row2, ...row2, ...row2];

    return (
      <div className="w-full relative overflow-hidden flex flex-col gap-5 pb-6 pt-2">
        {!hideHeader && <SectionHeader title={heading} subtitle={sectionSubtitle} headerAlign={headerAlign ?? 'center'} titleColorPrimary={titleColorPrimary} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText} subtitleAboveTitle={subtitleAboveTitle} />}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes testimonials-marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes testimonials-marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
          .animate-testimonials-marquee-left { animation: testimonials-marquee-left 40s linear infinite; }
          .animate-testimonials-marquee-right { animation: testimonials-marquee-right 40s linear infinite; }
          .testimonials-marquee-pause:hover .animate-testimonials-marquee-left, .testimonials-marquee-pause:hover .animate-testimonials-marquee-right { animation-play-state: paused; }
          .testimonials-mask-edges { mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
        ` }} />

        <div className="flex flex-col gap-6 md:gap-8 w-full testimonials-marquee-pause testimonials-mask-edges mx-auto max-w-full">
          <div className="flex w-max animate-testimonials-marquee-left gap-4 md:gap-6 px-3 md:px-4">
            {row1.map((item, i) => renderMarqueeCard(item, `row1-${item.id}-${i}`, 'role'))}
          </div>
          <div className="flex w-max animate-testimonials-marquee-right gap-4 md:gap-6 px-3 md:px-4 pl-8 md:pl-12 lg:pl-20">
            {row2Dup.map((item, i) => renderMarqueeCard(item, `row2-${item.id}-${i}`, 'company'))}
          </div>
        </div>
      </div>
    );
  };

  const activeItem = visibleItems[activeIdx] || visibleItems[0];

  const renderShowcase = () => (
    <div className="w-full flex flex-col items-center max-w-[1120px] mx-auto @container">
      {!hideHeader && <div className="px-1 md:px-2 w-full"><SectionHeader title={heading} subtitle={sectionSubtitle} headerAlign={headerAlign ?? 'center'} titleColorPrimary={titleColorPrimary} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText} subtitleAboveTitle={subtitleAboveTitle} /></div>}
      <div className="w-full mb-4 @3xl:mb-8 flex flex-wrap justify-center gap-1.5 @3xl:gap-2 px-1 md:px-2">
        {visibleItems.map((item, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveIdx(i); }}
              className={cn(
                'group flex items-center gap-2 @3xl:gap-3 px-2.5 py-1.5 pr-4 @3xl:px-2 @3xl:py-2 @3xl:pr-5 rounded-full transition-all duration-300 border focus:outline-none',
                isActive
                  ? 'border-[var(--token-primary)] bg-[var(--token-primary)] text-white shadow-md transform -translate-y-0.5'
                  : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200 hover:-translate-y-0.5',
              )}
            >
              <div className="w-6 h-6 @3xl:w-8 @3xl:h-8 rounded-full overflow-hidden bg-white shrink-0 shadow-sm border border-black/5">
                <AvatarDisplay item={item} context={context} className="w-full h-full text-[9px] @3xl:text-xs text-gray-900" innerClassName={!isActive ? 'opacity-80' : ''} />
              </div>
              <span className={cn('text-[12px] @3xl:text-sm font-semibold whitespace-nowrap transition-colors', isActive ? 'text-white' : 'text-gray-700')}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-full px-1 md:px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={cn('bg-white p-3 @3xl:p-6 @5xl:p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-100/80 flex flex-col-reverse @4xl:flex-row gap-3 @3xl:gap-5 items-center @4xl:items-start w-full relative overflow-hidden', getCornerRadiusClassName(cornerRadius, 'section'))}
          >
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-[var(--token-primary)] opacity-5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full @4xl:w-[65%] flex flex-col text-center @4xl:text-left relative z-10">
              <p className="font-medium text-base @3xl:text-xl @5xl:text-2xl leading-[1.65] text-gray-800 text-pretty mb-3 @3xl:mb-5 break-words">
                "{activeItem.content}"
              </p>
              <div className="flex justify-center @4xl:justify-start">
                <RatingStars rating={activeItem.rating} />
              </div>
            </div>

            <div className="w-full @4xl:w-[35%] flex flex-col items-center @4xl:items-start border-b @4xl:border-b-0 @4xl:border-l border-gray-100 pb-4 @4xl:pb-0 @4xl:pl-10 @5xl:pl-14 relative z-10 shrink-0">
              <div className="w-16 h-16 @3xl:w-24 @3xl:h-24 mb-3 @3xl:mb-4 rounded-[0.875rem] @3xl:rounded-[1.5rem] overflow-hidden shadow-md border-2 border-white ring-1 ring-gray-100 rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <AvatarDisplay item={activeItem} context={context} className="w-full h-full text-2xl @3xl:text-4xl" />
              </div>
              <h4 className="font-bold text-gray-900 text-base @3xl:text-lg text-center @4xl:text-left w-full mb-0.5">{activeItem.name}</h4>
              {activeItem.role ? <p className="text-[var(--token-primary)] font-semibold text-sm @3xl:text-base mb-1 text-center @4xl:text-left">{activeItem.role}</p> : null}
              {activeItem.company ? <p className="text-gray-400 text-xs @3xl:text-sm text-center @4xl:text-left break-words max-w-full">{activeItem.company}</p> : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  const renderQuote = () => (
    <div className="w-full @container px-1 md:px-2">
      {!hideHeader && <SectionHeader title={heading} subtitle={sectionSubtitle} headerAlign={headerAlign ?? 'center'} titleColorPrimary={titleColorPrimary} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText} subtitleAboveTitle={subtitleAboveTitle} />}
      <div className={cn('w-full bg-[var(--token-primary)] text-white p-4 @3xl:p-8 @5xl:p-12 relative overflow-hidden transition-colors duration-500 shadow-xl', getCornerRadiusClassName(cornerRadius, 'section'))}>
        <div className="absolute top-0 right-0 -m-32 w-80 h-80 @3xl:w-96 @3xl:h-96 bg-[var(--token-secondary)] rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative z-10 w-full mx-auto flex flex-col @4xl:flex-row gap-6 @3xl:gap-8 @5xl:gap-16 items-center @4xl:items-stretch">
          <div className="flex-1 text-center @4xl:text-left flex flex-col justify-center w-full">
            <Quote className="h-8 w-8 @3xl:h-12 @3xl:w-12 @5xl:h-16 @5xl:w-16 text-[var(--token-secondary)] opacity-80 mb-4 @3xl:mb-8 mx-auto @4xl:mx-0 fill-current shrink-0" />
            <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={quoteEmblaRef}>
              <div className="flex touch-pan-y select-none">
                {quoteItems.map((item) => (
                  <div key={item.id} className="min-w-0 flex-[0_0_100%]">
                    <div className="flex h-full flex-col">
                      <p className="text-base @3xl:text-xl @4xl:text-2xl @5xl:text-3xl leading-relaxed @3xl:leading-snug font-medium mb-4 @4xl:mb-6 text-pretty px-1 @4xl:px-0">
                        &ldquo;{item.content}&rdquo;
                      </p>
                      <div className="flex items-center gap-3 @3xl:gap-5 justify-center @4xl:justify-start mt-auto">
                        <AvatarDisplay item={item} context={context} className="h-10 w-10 @3xl:h-14 @3xl:w-14 @5xl:h-16 @5xl:w-16 rounded-full border border-white/20 backdrop-blur-sm shadow-sm" innerClassName="bg-white/10" />
                        <div className="text-left min-w-0">
                          <p className="font-bold text-sm @3xl:text-base @5xl:text-xl truncate">{item.name}</p>
                          {buildMetaLine(item) ? <p className="text-[var(--token-secondary)] opacity-90 text-[11px] @3xl:text-sm @5xl:text-base mt-0.5 truncate">{buildMetaLine(item)}</p> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex @4xl:flex-col gap-2 @3xl:gap-3 justify-center @4xl:justify-center mt-6 @4xl:mt-0 shrink-0">
            {quoteItems.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { quoteEmblaApi?.scrollTo(i); }}
                aria-label={`Select testimonial ${i + 1}`}
                className={cn(
                  'w-10 h-1.5 @3xl:w-12 @3xl:h-2 @4xl:w-2 @4xl:h-12 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                  i === quoteIdx ? 'bg-white scale-110' : 'bg-white/20 hover:bg-white/40',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderByStyle = () => {
    if (style === 'slider') {return renderSlider();}
    if (style === 'marquee') {return renderMarquee();}
    if (style === 'showcase') {return renderShowcase();}
    if (style === 'quote') {return renderQuote();}
    if (style === 'minimal') {return renderMinimal();}
    if (style === 'split-carousel') {return renderSplitCarousel();}
    if (style === 'overlap-carousel') {return renderOverlapCarousel();}
    if (style === 'builder-cards') {return renderBuilderCards();}
    if (style === 'builder-carousel') {return renderBuilderCarousel();}
    return renderCards();
  };

  return (
    <section className={baseClassName} style={baseStyle} data-mode={mode}>
      <div className={outerShellClassName}>
        {renderByStyle()}
      </div>
    </section>
  );
}
