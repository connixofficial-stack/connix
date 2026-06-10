'use client';

import React from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { AdminImage } from '@/app/admin/components/AdminImage';
import { PublicImage } from '@/components/shared/PublicImage';
import { ArrowRight, ArrowUpRight, Calendar, ChevronRight, FileText, Newspaper } from 'lucide-react';
import type { EmblaCarouselType } from 'embla-carousel';
import { cn } from '../../../components/ui';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { getSectionSpacingClassName, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { BlogColorTokens } from '../_lib/colors';
import {
  getBlogCardRadiusClassName,
  getBlogImageRadiusClassName,
  type BlogCardRadius,
  type BlogPreviewItem,
  type BlogStyle,
} from '../_types';

type BlogSectionContext = 'preview' | 'site';
type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
type BlogBreakpoint = 'mobile' | 'tablet' | 'desktop';

interface BlogSectionRuntimeProps {
  items: BlogPreviewItem[];
  title?: string;
  subtitle?: string;
  style: BlogStyle;
  tokens: BlogColorTokens;
  context: BlogSectionContext;
  device?: PreviewDevice;
  showAuthor?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  viewAllHref?: string;
  getItemHref?: (item: BlogPreviewItem) => string;
  fontClassName?: string;
  fontStyle?: React.CSSProperties;
  // Header config (shared SectionHeader)
  hideHeader?: boolean;
  showTitleHeader?: boolean;
  showSubtitleHeader?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  // Grid columns
  desktopColumns?: 3 | 4;
  spacing?: SectionSpacing;
  cornerRadius?: BlogCardRadius;
}

const FALLBACK_TITLE = 'Tin tức mới nhất';

const getPreviewLimit = (style: BlogStyle, _device: PreviewDevice) => {
  if (style === 'layout5') {
    return 8;
  }

  if (style === 'layout3') {
    return 5;
  }

  if (style === 'layout4' || style === 'layout6' || style === 'layout7') {
    return 3;
  }

  return 4;
};

export const getBlogVisibleItemLimit = (
  style: BlogStyle,
  context: BlogSectionContext,
  device: PreviewDevice,
) => {
  if (context === 'site') {
    return getPreviewLimit(style, 'desktop');
  }

  return getPreviewLimit(style, device);
};

const getBlogBreakpoint = (context: BlogSectionContext, device: PreviewDevice): BlogBreakpoint => {
  if (context === 'preview') {
    return device;
  }

  return 'desktop';
};

const getOuterShellClassName = (_style: BlogStyle) => {
  const baseShell = 'mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8';
  return baseShell;
};

const getResponsiveClassName = (
  context: BlogSectionContext,
  breakpoint: BlogBreakpoint,
  classes: Record<BlogBreakpoint, string>,
) => {
  if (context === 'preview') {
    return classes[breakpoint];
  }

  return `${classes.mobile} md:${classes.tablet} lg:${classes.desktop}`;
};

const toText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const resolveDate = (item: BlogPreviewItem) => {
  if (item.date && item.date.trim().length > 0) {return item.date;}
  return undefined;
};

const ImageView = ({
  item,
  alt,
  sizes,
  context,
  className,
}: {
  item: BlogPreviewItem;
  alt: string;
  sizes: string;
  context: BlogSectionContext;
  className?: string;
}) => {
  if (!item.thumbnail) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center', className)}>
        <FileText size={28} className="text-slate-400" />
      </div>
    );
  }

  if (context === 'preview') {
    return <AdminImage src={item.thumbnail} alt={alt} fill className={cn('object-cover', className)} sizes={sizes} />;
  }

  return <PublicImage mode="thumb" src={item.thumbnail} alt={alt} fill className={cn('object-cover', className)} sizes={sizes} />;
};

const resolveCategoryLabel = (category?: string) => {
  const normalized = category?.trim();
  return normalized && normalized.length > 0 ? normalized : 'Tin tức';
};

const renderViewAll = ({
  context,
  href,
  className,
  children,
}: {
  context: BlogSectionContext;
  href: string;
  className?: string;
  children: React.ReactNode;
}) => {
  if (context === 'site') {
    return <Link href={href} className={className}>{children}</Link>;
  }

  return <div className={className}>{children}</div>;
};

const ItemLink = ({
  item,
  href,
  context,
  className,
  children,
}: {
  item: BlogPreviewItem;
  href?: string;
  context: BlogSectionContext;
  className?: string;
  children: React.ReactNode;
}) => {
  if (context === 'site' && href) {
    return <Link href={href} className={className}>{children}</Link>;
  }
  return <div className={className} data-item-id={item.id}>{children}</div>;
};

const useBlogEmbla = (active: boolean, reInitKey: string) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateScrollState = React.useCallback((api?: EmblaCarouselType) => {
    if (!active || !api) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, [active]);

  React.useEffect(() => {
    if (!active || !emblaApi) {
      updateScrollState(undefined);
      return;
    }

    emblaApi.reInit();
    updateScrollState(emblaApi);
    emblaApi.on('select', updateScrollState);
    emblaApi.on('reInit', updateScrollState);

    return () => {
      emblaApi.off('select', updateScrollState);
      emblaApi.off('reInit', updateScrollState);
    };
  }, [active, emblaApi, reInitKey, updateScrollState]);

  return {
    canScrollNext,
    canScrollPrev,
    emblaRef,
    scrollNext: () => emblaApi?.scrollNext(),
    scrollPrev: () => emblaApi?.scrollPrev(),
    showArrows: canScrollPrev || canScrollNext,
  };
};

const EmblaArrowButtons = ({
  canScrollNext,
  canScrollPrev,
  className,
  compact = false,
  onNext,
  onPrev,
  show,
  tokens,
}: {
  canScrollNext: boolean;
  canScrollPrev: boolean;
  className?: string;
  compact?: boolean;
  onNext: () => void;
  onPrev: () => void;
  show: boolean;
  tokens: BlogColorTokens;
}) => {
  if (!show) {return null;}

  const buttonClassName = compact
    ? 'h-5 w-5 rounded-full border flex items-center justify-center transition-colors'
    : 'h-7 w-7 md:h-8 md:w-8 rounded-full border flex items-center justify-center transition-colors';
  const iconSize = compact ? 10 : 14;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canScrollPrev}
        aria-label="Trang trước"
        className={cn(buttonClassName, canScrollPrev ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-100 opacity-35 cursor-not-allowed')}
      >
        <ChevronRight size={iconSize} className="rotate-180" style={{ color: canScrollPrev ? tokens.primary.solid : undefined }} />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canScrollNext}
        aria-label="Trang sau"
        className={cn(buttonClassName, canScrollNext ? 'text-white' : 'border-slate-100 opacity-35 cursor-not-allowed')}
        style={canScrollNext ? { backgroundColor: tokens.primary.solid, borderColor: tokens.primary.solid } : undefined}
      >
        <ChevronRight size={iconSize} />
      </button>
    </div>
  );
};

export function BlogSectionRuntime({
  items,
  title,
  subtitle,
  style,
  tokens,
  context,
  device = 'desktop',
  showAuthor = true,
  showExcerpt = true,
  showDate = true,
  viewAllHref = '/posts',
  getItemHref,
  fontClassName,
  fontStyle,
  // Header config
  hideHeader = false,
  showTitleHeader = true,
  showSubtitleHeader = true,
  showBadge = true,
  badgeText = '',
  headerAlign = 'left',
  titleColorPrimary = false,
  subtitleAboveTitle = false,
  uppercaseText = false,
  // Grid columns
  desktopColumns = 4,
  spacing = 'normal',
  cornerRadius = 'lg',
}: BlogSectionRuntimeProps) {
  const breakpoint = getBlogBreakpoint(context, device);
  const layout5PageSize = desktopColumns === 3 ? 6 : 8;
  const visibleItems = React.useMemo(
    () => items.slice(0, getBlogVisibleItemLimit(style, context, device)),
    [context, device, items, style],
  );
  const [layout5Page, setLayout5Page] = React.useState(0);
  const layout2Items = React.useMemo(
    () => (style === 'layout2' ? items : visibleItems),
    [items, style, visibleItems],
  );
  const layout4Items = React.useMemo(
    () => (style === 'layout4' ? items : visibleItems),
    [items, style, visibleItems],
  );
  const layout5Items = React.useMemo(
    () => (style === 'layout5' ? items : visibleItems),
    [items, style, visibleItems],
  );
  const layout6Items = React.useMemo(
    () => (style === 'layout6' ? items : visibleItems),
    [items, style, visibleItems],
  );
  const layout7Items = React.useMemo(
    () => (style === 'layout7' ? items : visibleItems),
    [items, style, visibleItems],
  );
  const layout5TotalPages = React.useMemo(
    () => (style === 'layout5' ? Math.ceil(layout5Items.length / layout5PageSize) : 1),
    [layout5Items.length, style],
  );
  const layout5CanPaginate = style === 'layout5' && layout5Items.length > layout5PageSize;
  const layout5PagedItems = React.useMemo(() => {
    if (style !== 'layout5') {
      return visibleItems;
    }

    const startIndex = layout5Page * layout5PageSize;
    return layout5Items.slice(startIndex, startIndex + layout5PageSize);
  }, [layout5Items, layout5Page, style, visibleItems]);
  const layout2Embla = useBlogEmbla(style === 'layout2', `layout2-${layout2Items.length}-${desktopColumns}-${breakpoint}`);
  const layout4Embla = useBlogEmbla(style === 'layout4', `layout4-${layout4Items.length}-${desktopColumns}-${breakpoint}`);
  const layout6Embla = useBlogEmbla(style === 'layout6', `layout6-${layout6Items.length}-${desktopColumns}-${breakpoint}`);
  const layout7Embla = useBlogEmbla(style === 'layout7', `layout7-${layout7Items.length}-${desktopColumns}-${breakpoint}`);
  const layout1Categories = React.useMemo(
    () => Array.from(new Set(items.map((item) => resolveCategoryLabel(item.category)))),
    [items],
  );
  const [activeLayout1Category, setActiveLayout1Category] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (layout1Categories.length === 0) {
      setActiveLayout1Category(undefined);
      return;
    }

    setActiveLayout1Category((current) => (
      current && layout1Categories.includes(current) ? current : undefined
    ));
  }, [layout1Categories]);

  React.useEffect(() => {
    if (style !== 'layout5') {
      if (layout5Page !== 0) {
        setLayout5Page(0);
      }
      return;
    }

    const lastPage = Math.max(layout5TotalPages - 1, 0);
    if (layout5Page > lastPage) {
      setLayout5Page(lastPage);
    }
  }, [layout5Page, layout5TotalPages, style]);

  const layout1Items = React.useMemo(() => {
    if (style !== 'layout1') {
      return visibleItems;
    }

    const filteredItems = activeLayout1Category
      ? items.filter((item) => resolveCategoryLabel(item.category) === activeLayout1Category)
      : items;

    return filteredItems;
  }, [activeLayout1Category, items, style, visibleItems]);

  const sectionTitle = toText(title) ?? FALLBACK_TITLE;
  const sectionSubtitle = toText(subtitle);
  const outerShellClassName = getOuterShellClassName(style);
  const sectionSpacingClassName = getSectionSpacingClassName(spacing);
  const cardRadiusClassName = getBlogCardRadiusClassName(cornerRadius);
  const imageRadiusClassName = getBlogImageRadiusClassName(cornerRadius);

  // Shared SectionHeader rendering for all layouts
  const renderSectionHeader = (className?: string) => {
    if (hideHeader) { return null; }
    return (
      <SectionHeader
        title={sectionTitle}
        subtitle={sectionSubtitle}
        badgeText={badgeText}
        hideHeader={hideHeader}
        showTitle={showTitleHeader}
        showSubtitle={showSubtitleHeader}
        showBadge={showBadge}
        headerAlign={headerAlign}
        titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle}
        uppercaseText={uppercaseText}
        brandColor={tokens.primary.solid}
        className={className}
      />
    );
  };
  const _hasHeaderConfig = !!(badgeText || subtitle);
  const layout14GridClassName = getResponsiveClassName(context, breakpoint, desktopColumns === 3
    ? { desktop: 'grid-cols-3', tablet: 'grid-cols-3', mobile: 'grid-cols-1' }
    : { desktop: 'grid-cols-4', tablet: 'grid-cols-2', mobile: 'grid-cols-2' }
  );
  const emblaItemClassName = getResponsiveClassName(context, breakpoint, desktopColumns === 3
    ? { desktop: 'basis-1/3 pl-5', tablet: 'basis-1/3 pl-5', mobile: 'basis-[82%] pl-3' }
    : { desktop: 'basis-1/4 pl-5', tablet: 'basis-1/2 pl-5', mobile: 'basis-[82%] pl-3' }
  );
  const layout7EmblaItemClassName = getResponsiveClassName(context, breakpoint, desktopColumns === 3
    ? { desktop: 'basis-1/3 pl-5', tablet: 'basis-1/3 pl-5', mobile: 'basis-[86%] pl-3' }
    : { desktop: 'basis-1/4 pl-5', tablet: 'basis-1/2 pl-5', mobile: 'basis-[78%] pl-3' }
  );
  const layout3GridClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'grid-cols-2',
    tablet: 'grid-cols-2',
    mobile: 'grid-cols-1',
  });
  const layout3ItemGapClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'gap-6',
    tablet: 'gap-6',
    mobile: 'gap-3',
  });
  const layout3ListGapClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'gap-8',
    tablet: 'gap-6',
    mobile: 'gap-4',
  });
  const layout3ThumbWidthClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'w-32',
    tablet: 'w-28',
    mobile: 'w-24',
  });
  const layout3TitleClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'text-lg',
    tablet: 'text-base',
    mobile: 'text-base',
  });
  const layout3ExcerptClampClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'line-clamp-3',
    tablet: 'line-clamp-2',
    mobile: 'line-clamp-2',
  });
  const _layout4HeaderClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'flex-row items-end justify-between',
    tablet: 'flex-row items-end justify-between',
    mobile: 'flex-col items-start',
  });
  const _layoutTextScaleClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'text-5xl',
    tablet: 'text-4xl',
    mobile: 'text-3xl',
  });
  const layoutButtonRowClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'flex-row items-center justify-between gap-3',
    tablet: 'flex-row items-center justify-between gap-3',
    mobile: 'flex-col items-start gap-3',
  });
  const layoutDetailButtonClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'px-4 text-xs',
    tablet: 'px-4 text-xs',
    mobile: 'px-3 text-[10px]',
  });
  const layoutDateTextClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'text-xs',
    tablet: 'text-xs',
    mobile: 'text-[10px]',
  });
  const layout5WrapperPaddingClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'p-8',
    tablet: 'p-6',
    mobile: 'p-4',
  });
  const layout5GapClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'gap-x-6 gap-y-8',
    tablet: 'gap-x-6 gap-y-8',
    mobile: 'gap-x-3 gap-y-5',
  });
  const layout5TitleClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'text-base',
    tablet: 'text-base',
    mobile: 'text-sm',
  });
  const layout6WrapperPaddingClassName = getResponsiveClassName(context, breakpoint, {
    desktop: 'p-8',
    tablet: 'p-6',
    mobile: 'p-4',
  });
  const hasDisplayItems =
    style === 'layout2' ? layout2Items.length > 0
      : style === 'layout4' ? layout4Items.length > 0
      : style === 'layout5' ? layout5Items.length > 0
        : style === 'layout6' ? layout6Items.length > 0
          : style === 'layout7' ? layout7Items.length > 0
            : visibleItems.length > 0;

  if (!hasDisplayItems) {
    return (
      <section className={cn('px-4', sectionSpacingClassName, fontClassName)} style={{ backgroundColor: tokens.sectionBg, ...fontStyle }}>
        <div className={outerShellClassName}>
          <div className="rounded-3xl border px-6 py-10 text-center" style={{ backgroundColor: tokens.cardBg, borderColor: tokens.cardBorder }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: tokens.imageFallbackBg }}>
              <Newspaper size={28} style={{ color: tokens.imageFallbackIcon }} />
            </div>
            <h3 className="mb-2 text-2xl font-bold" style={{ color: tokens.heading }}>{sectionTitle}</h3>
            <p style={{ color: tokens.mutedText }}>Chưa có bài viết nào để hiển thị.</p>
          </div>
        </div>
      </section>
    );
  }

  const getHref = (item: BlogPreviewItem) => getItemHref?.(item);

  if (style === 'layout1') {
    return (
      <section className={cn('px-4', sectionSpacingClassName, fontClassName)} style={{ backgroundColor: tokens.sectionBg, ...fontStyle }}>
        <div className={outerShellClassName}>
          {renderSectionHeader('mb-8')}
          <div className="mb-8 text-center">
            {layout1Categories.length > 1 ? (
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => { setActiveLayout1Category(undefined); }}
                  className={cn(
                    'rounded-md px-6 py-2 font-medium whitespace-nowrap shadow-sm transition-colors',
                    activeLayout1Category === undefined ? 'text-white' : 'bg-white',
                  )}
                  style={activeLayout1Category === undefined
                    ? { backgroundColor: tokens.primary.solid }
                    : { color: tokens.primary.solid }}
                >
                  Tất cả
                </button>
                {layout1Categories.map((category) => {
                  const isActive = category === activeLayout1Category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => { setActiveLayout1Category(category); }}
                      className={cn(
                        'rounded-md px-6 py-2 font-medium whitespace-nowrap shadow-sm transition-colors',
                        isActive ? 'text-white' : 'bg-white',
                      )}
                      style={isActive
                        ? { backgroundColor: tokens.primary.solid }
                        : { color: tokens.primary.solid }}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className={cn('mb-8 grid gap-3 md:gap-6', layout14GridClassName)}>
            {layout1Items.map((item) => (
              <ItemLink key={item.id} item={item} href={getHref(item)} context={context} className="group">
                <article className={cn('flex h-full flex-col overflow-hidden border bg-white shadow-sm transition-shadow hover:shadow-md', cardRadiusClassName)} style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                  <div className="relative aspect-[3/2] w-full overflow-hidden">
                    <ImageView item={item} alt={item.title} sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw" context={context} className="transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col px-2.5 py-3 md:p-5">
                    <h3 className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-slate-900 md:text-base" style={{ color: tokens.bodyText }}>{item.title}</h3>
                    {showExcerpt && item.excerpt ? (
                      <p className="mb-4 line-clamp-2 flex-1 text-xs text-slate-500 md:mb-6 md:line-clamp-3 md:text-sm" style={{ color: tokens.mutedText }}>{item.excerpt}</p>
                    ) : <div className="flex-1" />}
                    <div className={cn('mt-auto flex border-t pt-3', layoutButtonRowClassName)} style={{ borderColor: tokens.cardBorder }}>
                      {showDate ? (
                        <div className={cn('flex items-center gap-1.5', layoutDateTextClassName)} style={{ color: tokens.mutedText }}>
                          <Calendar size={14} />
                          <span>{resolveDate(item)}</span>
                        </div>
                      ) : <div />}
                      <button type="button" className={cn('rounded-full py-1.5 font-semibold', layoutDetailButtonClassName)} style={{ backgroundColor: tokens.primary.solid, color: tokens.primary.textOnSolid }}>
                        Đọc ngay
                      </button>
                    </div>
                  </div>
                </article>
              </ItemLink>
            ))}
          </div>

          {renderViewAll({
            context,
            href: viewAllHref,
            className: 'flex w-full justify-center',
            children: (
              <div className="flex w-full items-center justify-center gap-1 border-t py-3 font-semibold transition-colors" style={{ borderColor: tokens.cardBorder, color: tokens.primary.solid }}>
                Xem tất cả <ChevronRight size={16} />
              </div>
            ),
          })}
        </div>
      </section>
    );
  }

  if (style === 'layout2') {
    return (
      <section className={cn('px-4', sectionSpacingClassName, fontClassName)} style={{ backgroundColor: tokens.sectionBg, ...fontStyle }}>
        <div className={outerShellClassName}>
          {renderSectionHeader('mb-8')}

          <div className="relative mb-8">
            <EmblaArrowButtons
              canScrollNext={layout2Embla.canScrollNext}
              canScrollPrev={layout2Embla.canScrollPrev}
              className="mb-3 justify-end"
              onNext={layout2Embla.scrollNext}
              onPrev={layout2Embla.scrollPrev}
              show={layout2Embla.showArrows}
              tokens={tokens}
            />
            <div ref={layout2Embla.emblaRef} className="overflow-hidden">
              <div className="flex -ml-3 md:-ml-5">
                {layout2Items.map((item) => (
                  <ItemLink key={item.id} item={item} href={getHref(item)} context={context} className={cn('group min-w-0 flex-none cursor-pointer pb-3 md:pb-4', emblaItemClassName)}>
                    <article className={cn('flex h-full flex-col', breakpoint === 'mobile' ? 'border-b' : 'border-b-0')} style={{ borderColor: tokens.cardBorder }}>
                      <div className={cn('relative mb-3 md:mb-4 aspect-[4/3] w-full overflow-hidden border bg-slate-100', imageRadiusClassName)} style={{ borderColor: `${tokens.cardBorder}80` }}>
                        <ImageView item={item} alt={item.title} sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 82vw" context={context} className="transition-transform duration-300 group-hover:scale-105" />
                        {showDate && resolveDate(item) ? (
                          <div className="absolute left-3 top-3 px-2 py-1 text-center text-white shadow-sm" style={{ backgroundColor: tokens.secondary.solid }}>
                            <div className="text-lg font-bold leading-none">{resolveDate(item)?.split('/')[0] ?? ''}</div>
                            <div className="text-[10px] font-medium leading-tight">{resolveDate(item)?.split('/').slice(1).join('/') ?? ''}</div>
                          </div>
                        ) : null}
                      </div>
                      <h3 className={cn('mb-2 line-clamp-2 text-base font-bold transition-colors', breakpoint !== 'mobile' && 'line-clamp-1')} style={{ color: tokens.bodyText }}>{item.title}</h3>
                      {showExcerpt && item.excerpt ? (
                        <p className="line-clamp-3 text-sm leading-relaxed" style={{ color: tokens.mutedText }}>{item.excerpt}</p>
                      ) : null}
                    </article>
                  </ItemLink>
                ))}
              </div>
            </div>
          </div>

          {renderViewAll({
            context,
            href: viewAllHref,
            className: 'mt-2 flex justify-center',
            children: (
              <span className="rounded px-8 py-2.5 font-bold text-white" style={{ backgroundColor: tokens.secondary.solid }}>
                Xem tất cả
              </span>
            ),
          })}
        </div>
      </section>
    );
  }

  if (style === 'layout3') {
    const [featuredItem, ...listItems] = visibleItems;

    return (
      <section className={cn('px-4', sectionSpacingClassName, fontClassName)} style={{ backgroundColor: tokens.sectionBg, ...fontStyle }}>
        <div className={outerShellClassName}>
          {renderSectionHeader('mb-6')}

          <div className={cn('grid gap-6', layout3GridClassName, breakpoint === 'desktop' && 'md:gap-8 lg:gap-12')}>
            {featuredItem ? (
              <ItemLink item={featuredItem} href={getHref(featuredItem)} context={context} className="group flex flex-col">
                <article className="flex flex-col">
                  <div className={cn('relative mb-6 aspect-[4/3] w-full overflow-hidden bg-slate-100', imageRadiusClassName)}>
                    <ImageView item={featuredItem} alt={featuredItem.title} sizes="(min-width: 768px) 50vw, 100vw" context={context} className="transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold leading-snug md:text-2xl" style={{ color: tokens.primary.solid }}>{featuredItem.title}</h3>
                  {showDate && resolveDate(featuredItem) ? (
                    <p className="mb-3 text-sm font-medium" style={{ color: tokens.bodyText }}>{resolveDate(featuredItem)}</p>
                  ) : null}
                  {showExcerpt && featuredItem.excerpt ? (
                    <p className="mt-3 line-clamp-3 leading-relaxed" style={{ color: tokens.mutedText }}>{featuredItem.excerpt}</p>
                  ) : null}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium" style={{ color: tokens.bodyText }}>
                    Xem thêm <ArrowRight size={16} />
                  </span>
                </article>
              </ItemLink>
            ) : null}

            <div className={cn('flex flex-col', layout3ListGapClassName)}>
              {listItems.slice(0, 4).map((item) => (
                <ItemLink key={item.id} item={item} href={getHref(item)} context={context} className="group cursor-pointer">
                  <article className={cn('flex', layout3ItemGapClassName)}>
                    <div className={cn('relative aspect-square shrink-0 overflow-hidden bg-slate-100', imageRadiusClassName, layout3ThumbWidthClassName)}>
                      <ImageView item={item} alt={item.title} sizes="128px" context={context} className="transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <h4 className={cn('mb-2 line-clamp-2 font-bold', layout3TitleClassName)} style={{ color: tokens.primary.solid }}>{item.title}</h4>
                      {showDate && resolveDate(item) ? (
                        <p className="mb-2 text-xs font-medium" style={{ color: tokens.bodyText }}>{resolveDate(item)}</p>
                      ) : null}
                      {showExcerpt && item.excerpt ? (
                        <p className={cn('text-sm', layout3ExcerptClampClassName)} style={{ color: tokens.mutedText }}>{item.excerpt}</p>
                      ) : null}
                    </div>
                  </article>
                </ItemLink>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'layout4') {
    return (
      <section className={cn('px-4', sectionSpacingClassName, fontClassName)} style={{ backgroundColor: tokens.sectionBg, ...fontStyle, '--token-primary': tokens.primary.solid, '--token-secondary-text': tokens.secondary.solid } as React.CSSProperties}>
        <div className={cn(outerShellClassName, 'flex flex-col items-start')}>
          <div className="mb-4 md:mb-5 w-full">
            {renderSectionHeader('mb-0')}
            <EmblaArrowButtons
              canScrollNext={layout4Embla.canScrollNext}
              canScrollPrev={layout4Embla.canScrollPrev}
              className="mt-1.5 justify-end"
              onNext={layout4Embla.scrollNext}
              onPrev={layout4Embla.scrollPrev}
              show={layout4Embla.showArrows}
              tokens={tokens}
            />
          </div>

          <div ref={layout4Embla.emblaRef} className="mb-6 md:mb-8 w-full overflow-hidden">
            <div className="flex -ml-3 md:-ml-5">
              {layout4Items.map((item) => (
                <ItemLink key={item.id} item={item} href={getHref(item)} context={context} className={cn('group min-w-0 flex-none cursor-pointer bg-white', emblaItemClassName)}>
                  <article className="flex h-full flex-col bg-white">
                    <div
                      className={cn('relative z-0 mb-6 aspect-[4/3] overflow-hidden border bg-slate-100', imageRadiusClassName)}
                      style={{ borderColor: tokens.cardBorder }}
                    >
                      <ImageView item={item} alt={item.title} sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 82vw" context={context} className="transition-transform duration-700 group-hover:scale-105" />
                      {showDate && resolveDate(item) ? (
                        <div className="absolute bottom-4 right-4 rounded-full bg-black px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                          {resolveDate(item)}
                        </div>
                      ) : null}
                    </div>
                    <div className="px-2">
                      <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight transition-colors group-hover:text-[var(--token-primary)]" style={{ color: tokens.bodyText }}>
                        {item.title}
                      </h3>
                      {showAuthor && item.author ? (
                        <p className="mb-3 flex items-center gap-1 text-xs text-slate-500">
                          Đăng bởi: <span style={{ color: tokens.primary.solid }}>{item.author}</span>
                        </p>
                      ) : null}
                      {showExcerpt && item.excerpt ? (
                        <p className="mb-4 line-clamp-2 text-sm leading-relaxed" style={{ color: tokens.mutedText }}>{item.excerpt}</p>
                      ) : null}
                      <span className="text-sm font-bold transition-colors group-hover:text-[var(--token-primary)]" style={{ color: tokens.bodyText }}>
                        Đọc tiếp › ›
                      </span>
                    </div>
                  </article>
                </ItemLink>
              ))}
            </div>
          </div>

          {renderViewAll({
            context,
            href: viewAllHref,
            className: 'flex w-full justify-center',
            children: (
              <div className="flex items-center gap-3 rounded-full py-2 pl-6 pr-2 font-bold uppercase text-white shadow-md transition-opacity hover:opacity-90" style={{ backgroundColor: tokens.primary.solid }}>
                XEM TẤT CẢ
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
                  <ArrowUpRight size={16} style={{ color: tokens.primary.solid }} />
                </div>
              </div>
            ),
          })}
        </div>
      </section>
    );
  }

  if (style === 'layout5') {
    const canGoToPreviousLayout5Page = layout5Page > 0;
    const canGoToNextLayout5Page = layout5Page < layout5TotalPages - 1;

    return (
      <section className={cn('px-4', sectionSpacingClassName, fontClassName)} style={{ backgroundColor: tokens.sectionBg, ...fontStyle }}>
        <div className={cn(outerShellClassName, 'border bg-white shadow-sm', cardRadiusClassName, layout5WrapperPaddingClassName)} style={{ borderColor: `${tokens.cardBorder}80`, backgroundColor: tokens.cardBg }}>
          <div className="mb-6 md:mb-8">
            {renderSectionHeader('mb-0')}
            {layout5CanPaginate ? (
              <div className="flex justify-end items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { setLayout5Page((current) => Math.max(current - 1, 0)); }}
                  disabled={!canGoToPreviousLayout5Page}
                  aria-label="Trang trước"
                  className={cn(
                    'w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-colors',
                    canGoToPreviousLayout5Page ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-100 opacity-40 cursor-not-allowed',
                  )}
                >
                  <ChevronRight size={18} className="rotate-180" style={{ color: canGoToPreviousLayout5Page ? tokens.primary.solid : undefined }} />
                </button>
                <button
                  type="button"
                  onClick={() => { setLayout5Page((current) => Math.min(current + 1, layout5TotalPages - 1)); }}
                  disabled={!canGoToNextLayout5Page}
                  aria-label="Trang sau"
                  className={cn(
                    'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors',
                    canGoToNextLayout5Page ? 'text-white' : 'opacity-40 cursor-not-allowed border border-slate-100',
                  )}
                  style={canGoToNextLayout5Page ? { backgroundColor: tokens.primary.solid } : undefined}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : null}
          </div>

          <div className={cn('mb-8 grid', layout14GridClassName, layout5GapClassName)}>
            {layout5PagedItems.map((item) => (
              <ItemLink key={item.id} item={item} href={getHref(item)} context={context} className="group cursor-pointer">
                <article className="flex flex-col">
                  <div className={cn('relative mb-3 aspect-[16/10] w-full overflow-hidden bg-slate-100', imageRadiusClassName)}>
                    <ImageView item={item} alt={item.title} sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw" context={context} className="transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className={cn('mb-2 line-clamp-2 font-semibold leading-snug', layout5TitleClassName)} style={{ color: tokens.bodyText }}>{item.title}</h3>
                    {showDate && resolveDate(item) ? (
                      <div className="mt-auto inline-flex items-center gap-1.5 text-[13px]" style={{ color: tokens.mutedText }}>
                        <Calendar size={14} />
                        <span>Thứ Ba, {resolveDate(item)}</span>
                      </div>
                    ) : null}
                  </div>
                </article>
              </ItemLink>
            ))}
          </div>

          {renderViewAll({
            context,
            href: viewAllHref,
            className: 'flex justify-center pt-2',
            children: (
              <div className="rounded px-6 py-2.5 text-white" style={{ backgroundColor: tokens.primary.solid }}>
                Xem tất cả
              </div>
            ),
          })}
        </div>
      </section>
    );
  }

  if (style === 'layout6') {
    return (
      <section className={cn('px-4', sectionSpacingClassName, fontClassName)} style={{ backgroundColor: tokens.sectionBg, ...fontStyle }}>
        <div className={cn(outerShellClassName, 'border bg-gray-50/50', cardRadiusClassName, layout6WrapperPaddingClassName)} style={{ borderColor: tokens.cardBorder }}>
          <div className="mb-4 md:mb-5">
            {renderSectionHeader('mb-0')}
            <EmblaArrowButtons
              canScrollNext={layout6Embla.canScrollNext}
              canScrollPrev={layout6Embla.canScrollPrev}
              className="mt-1.5 justify-end"
              onNext={layout6Embla.scrollNext}
              onPrev={layout6Embla.scrollPrev}
              show={layout6Embla.showArrows}
              tokens={tokens}
            />
          </div>

          <div ref={layout6Embla.emblaRef} className="mb-5 md:mb-6 overflow-hidden">
            <div className="flex -ml-3 md:-ml-5">
              {layout6Items.map((item) => (
                <ItemLink key={item.id} item={item} href={getHref(item)} context={context} className={cn('group flex h-full min-w-0 flex-none cursor-pointer', emblaItemClassName)}>
                  <article className={cn('flex h-full w-full flex-col overflow-hidden border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md', cardRadiusClassName)} style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                    <div className="relative aspect-[16/10] w-full">
                      <ImageView item={item} alt={item.title} sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 82vw" context={context} />
                      {showDate && resolveDate(item) ? (
                        <div className="absolute top-0 left-4 flex flex-col items-center justify-center rounded-b-lg px-3 py-2 text-white shadow-sm" style={{ backgroundColor: tokens.primary.solid }}>
                          <span className="text-xl font-bold leading-none">{resolveDate(item)?.split('/')[0] ?? ''}</span>
                          <span className="text-[10px] font-medium uppercase tracking-wider">{resolveDate(item)?.split('/').slice(1).join('/') ?? ''}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col p-4 pb-4 md:p-5 md:pb-6">
                      <h3 className="mb-3 line-clamp-2 text-lg font-semibold leading-snug transition-colors group-hover:text-[var(--token-primary)]" style={{ color: tokens.bodyText }}>
                        {item.title}
                      </h3>
                      {showExcerpt && item.excerpt ? (
                        <p className="flex-1 line-clamp-3 text-sm leading-relaxed" style={{ color: tokens.mutedText }}>{item.excerpt}</p>
                      ) : <div className="flex-1" />}
                    </div>
                  </article>
                </ItemLink>
              ))}
            </div>
          </div>

          {renderViewAll({
            context,
            href: viewAllHref,
            className: 'mt-2 flex justify-center',
            children: (
              <div className="rounded-full border px-8 py-2.5 text-sm font-medium transition-colors" style={{ borderColor: tokens.primary.solid, color: tokens.primary.solid }}>
                Xem tất cả
              </div>
            ),
          })}
        </div>
      </section>
    );
  }

  return (
    <section className={cn('section-index section_blog', sectionSpacingClassName, fontClassName)} style={{ backgroundColor: tokens.sectionBg, fontSize: '14px', lineHeight: '22px', ...fontStyle, fontFamily: '"Be Vietnam Pro", sans-serif' }}>
      <div className={cn(outerShellClassName, "relative mx-auto max-w-[1170px] px-[10px]")}>
        {renderSectionHeader('mb-4')}

        <div className="swiper_blogs swiper-container relative">
          <EmblaArrowButtons
            canScrollNext={layout7Embla.canScrollNext}
            canScrollPrev={layout7Embla.canScrollPrev}
            className="absolute right-0 top-0 z-10 -translate-y-7"
            compact
            onNext={layout7Embla.scrollNext}
            onPrev={layout7Embla.scrollPrev}
            show={layout7Embla.showArrows}
            tokens={tokens}
          />

          <div ref={layout7Embla.emblaRef} className="overflow-hidden">
            <div className="swiper-wrapper flex -ml-3 md:-ml-5">
              {layout7Items.map((item) => (
                <div key={item.id} className={cn('swiper-slide h-auto min-w-0 flex-none', layout7EmblaItemClassName)}>
                  <ItemLink item={item} href={getHref(item)} context={context} className="group flex h-full cursor-pointer flex-col">
                    <article className="item_blog flex h-full flex-col overflow-hidden bg-white">
                      <div className={cn('image-blog relative w-full overflow-hidden bg-[#f8f8f8]', imageRadiusClassName)} style={{ paddingBottom: '63.5%' }}>
                        <ImageView item={item} alt={item.title} sizes="(min-width: 1170px) 25vw, (min-width: 768px) 50vw, 86vw" context={context} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.02]" />
                        {showDate && resolveDate(item) && (
                          <span className="user_date absolute bottom-[10px] right-[10px] z-[2] flex items-center justify-center rounded-[40px] bg-black px-[33px] py-[7px] text-[14px] leading-[19.6px] text-white"> 
                            {resolveDate(item)}
                          </span> 
                        )}
                      </div>
                      <div className="blog_content flex flex-1 flex-col bg-white py-3"> 
                        <h3 className="mb-1.5">
                          <span className="block h-11 overflow-hidden text-sm font-semibold leading-5 transition-colors group-hover:text-[var(--token-primary)] md:text-[15px]" style={{ color: tokens.heading, '--token-primary': tokens.primary.solid } as React.CSSProperties}>
                            {item.title}
                          </span>
                        </h3>
                        {showAuthor && (
                          <p className="update_date mb-1.5 flex justify-between text-xs leading-5" style={{ color: 'rgb(131, 131, 131)' }}>
                            <span className="user_name">Đăng bởi: <b className="font-[500]" style={{ color: tokens.primary.solid }}>{item.author || 'Bean Construction'}</b></span> 
                          </p>
                        )}
                        <div className="conten_info_blog flex min-h-[66px] flex-1 flex-col">
                          {showExcerpt && item.excerpt && (
                            <p className="blog_description mb-2 h-10 overflow-hidden text-xs leading-5 md:text-[13px]" style={{ color: tokens.bodyText }}>
                              {item.excerpt}
                            </p>
                          )}
                          <div className="mt-auto">
                            <span className="read_more inline-block text-xs font-semibold transition-colors group-hover:text-[var(--token-primary)]" style={{ color: tokens.bodyText, '--token-primary': tokens.primary.solid } as React.CSSProperties}>
                              Đọc tiếp &gt;&gt;
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </ItemLink>
                </div>
              ))}
            </div>
          </div>
        </div>

        {renderViewAll({
          context,
          href: viewAllHref,
          className: 'box_see_blog mt-5 flex justify-center',
          children: (
            <div className="theme-btn btn-style-three exp-btn-title inline-block cursor-pointer rounded-full py-1.5 pl-5 pr-1.5 text-xs font-semibold uppercase text-white transition-transform hover:scale-105" style={{ backgroundColor: tokens.primary.solid }}>
              <span className="btn-wrap">
                <span className="text-one flex items-center justify-center text-center">
                  XEM TẤT CẢ 
                  <i className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-black italic">
                    <svg width="8" height="8" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0.46967 7.46967C0.176777 7.76256 0.176777 8.23744 0.46967 8.53033C0.762563 8.82322 1.23744 8.82322 1.53033 8.53033L0.46967 7.46967ZM8.75 1C8.75 0.585786 8.41421 0.25 8 0.25L1.25 0.25C0.835786 0.25 0.5 0.585786 0.5 1C0.5 1.41421 0.835786 1.75 1.25 1.75L7.25 1.75V7.75C7.25 8.16421 7.58579 8.5 8 8.5C8.41421 8.5 8.75 8.16421 8.75 7.75V1ZM1 8L1.53033 8.53033L8.53033 1.53033L8 1L7.46967 0.46967L0.46967 7.46967L1 8Z" fill="white"></path>
                    </svg>
                  </i>
                </span>
              </span>
            </div>
          ),
        })}
      </div>
    </section>
  );
}
