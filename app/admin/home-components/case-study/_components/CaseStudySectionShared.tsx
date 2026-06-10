'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '../../../components/ui';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import type { CaseStudyColorTokens } from '../_lib/colors';
import type { CaseStudyBrandMode, CaseStudyCornerRadius, CaseStudyDesktopColumns, CaseStudyProject, CaseStudySpacing, CaseStudyStyle } from '../_types';
import {
  DEFAULT_CASE_STUDY_CORNER_RADIUS,
  DEFAULT_CASE_STUDY_DESKTOP_COLUMNS,
  DEFAULT_CASE_STUDY_SPACING,
  getCaseStudyCornerRadiusClassName,
  getCaseStudySectionSpacingClassName,
} from '../_types';

type CaseStudySharedContext = 'preview' | 'site';
type CaseStudyPreviewDevice = 'mobile' | 'tablet' | 'desktop';

interface CaseStudySectionSharedProps {
  projects: CaseStudyProject[];
  style: CaseStudyStyle;
  mode: CaseStudyBrandMode;
  tokens: CaseStudyColorTokens;
  context: CaseStudySharedContext;
  title?: string;
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
  cornerRadius?: CaseStudyCornerRadius;
  desktopColumns?: CaseStudyDesktopColumns;
  spacing?: CaseStudySpacing;
  device?: CaseStudyPreviewDevice;
}

const resolveViewport = (width: number): CaseStudyPreviewDevice => {
  if (width < 768) {return 'mobile';}
  if (width < 1024) {return 'tablet';}
  return 'desktop';
};

const sanitizeLink = (value?: string) => {
  const normalized = (value ?? '').trim();
  if (!normalized) {return '#';}

  if (
    normalized.startsWith('/')
    || normalized.startsWith('#')
    || normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('mailto:')
    || normalized.startsWith('tel:')
  ) {
    return normalized;
  }

  return '#';
};

const isExternalLink = (href: string) => href.startsWith('http://') || href.startsWith('https://');

const toProjectKey = (project: CaseStudyProject, idx: number) => `${project.id ?? 'project'}-${idx}`;

const toStyleTitle = (value: CaseStudyStyle) => {
  if (value === 'masonry') {return 'Portfolio Masonry';}
  if (value === 'carousel') {return 'Portfolio Carousel';}
  if (value === 'timeline') {return 'Timeline Dự án';}
  if (value === 'featured') {return 'Dự án nổi bật';}
  if (value === 'list') {return 'Danh sách dự án';}
  return 'Dự án tiêu biểu';
};

export function CaseStudySectionShared({
  projects,
  style,
  mode,
  tokens,
  context,
  title,
  hideHeader = false,
  showTitle = true,
  subtitle = '',
  showSubtitle = true,
  headerAlign = 'center',
  titleColorPrimary = false,
  subtitleAboveTitle = false,
  uppercaseText = false,
  showBadge = true,
  badgeText = '',
  cornerRadius = DEFAULT_CASE_STUDY_CORNER_RADIUS,
  desktopColumns = DEFAULT_CASE_STUDY_DESKTOP_COLUMNS,
  spacing = DEFAULT_CASE_STUDY_SPACING,
  device = 'desktop',
}: CaseStudySectionSharedProps) {
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [siteViewport, setSiteViewport] = React.useState<CaseStudyPreviewDevice>('desktop');
  const [carouselRef, carouselApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (context === 'preview') {return;}

    const updateViewport = () => {
      setSiteViewport(resolveViewport(window.innerWidth));
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, [context]);

  const viewport = context === 'preview' ? device : siteViewport;

  React.useEffect(() => {
    setCarouselIndex(0);
    carouselApi?.scrollTo(0);
  }, [carouselApi, style, viewport, projects.length]);

  React.useEffect(() => {
    if (!carouselApi) {return;}

    const updateCarouselState = () => {
      setCarouselIndex(carouselApi.selectedScrollSnap());
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setScrollSnaps(carouselApi.scrollSnapList());
    };

    updateCarouselState();
    carouselApi.on('select', updateCarouselState);
    carouselApi.on('reInit', updateCarouselState);

    return () => {
      carouselApi.off('select', updateCarouselState);
      carouselApi.off('reInit', updateCarouselState);
    };
  }, [carouselApi]);

  const headingText = (title ?? '').trim() || toStyleTitle(style);
  const HeadingTag: React.ElementType = context === 'site' ? 'h2' : 'h3';

  const sectionClassName = cn('px-4', context === 'preview' && viewport === 'mobile' ? 'py-4' : getCaseStudySectionSpacingClassName(spacing));
  const radiusClassName = getCaseStudyCornerRadiusClassName(cornerRadius);
  const cardBorderStyle = { borderColor: tokens.cardBorder };

  const getGridClassName = () => {
    if (viewport === 'mobile') {
      return desktopColumns === 4 ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-3';
    }

    if (viewport === 'tablet') {
      return desktopColumns === 4 ? 'grid-cols-2 gap-4' : 'grid-cols-3 gap-4';
    }

    return desktopColumns === 4 ? 'grid-cols-4 gap-5' : 'grid-cols-3 gap-6';
  };

  const renderHeaderText = () => (
    <SectionHeader
      title={headingText}
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
      brandColor={tokens.primary}
    />
  );

  const renderProjectImage = (project: CaseStudyProject, size = 32) => (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: tokens.imageBackground }}
    >
      {project.image ? (
        context === 'preview'
          ? <PreviewImage src={project.image} alt={project.title || ''} className="w-full h-full object-cover" />
          : <img src={project.image} alt={project.title || ''} className="w-full h-full object-cover" loading="lazy" draggable={false} />
      ) : (
        <ImageIcon size={size} style={{ color: tokens.imageIcon }} />
      )}
    </div>
  );

  const renderBadge = (text: string) => (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full w-fit"
      style={{ backgroundColor: tokens.badgeBackground, color: tokens.badgeText }}
    >
      {text || 'Category'}
    </span>
  );

  const wrapProject = ({
    project,
    idx,
    className,
    style,
    children,
  }: {
    project: CaseStudyProject;
    idx: number;
    className: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
  }) => {
    const key = toProjectKey(project, idx);

    if (context === 'site') {
      const href = sanitizeLink(project.link);
      const external = isExternalLink(href);

      return (
        <a
          key={key}
          href={href}
          className={cn(className, 'no-underline text-inherit')}
          style={style}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      );
    }

    return (
      <div key={key} className={className} style={style}>
        {children}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: tokens.neutralBackground }}
      >
        <FileText size={32} style={{ color: tokens.imageIcon }} />
      </div>
      <HeadingTag className="font-medium mb-1" style={{ color: tokens.neutralText }}>
        Chưa có dự án nào
      </HeadingTag>
      <p className="text-sm" style={{ color: tokens.mutedText }}>Thêm dự án đầu tiên để bắt đầu</p>
    </div>
  );

  const renderGridStyle = () => {
    const maxVisible = context === 'preview'
      ? (viewport === 'mobile' ? 4 : (viewport === 'tablet' ? 6 : 9))
      : projects.length;
    const visibleProjects = projects.slice(0, maxVisible);
    const remainingCount = projects.length - visibleProjects.length;

    return (
      <section className={sectionClassName} data-mode={mode}>
        <div className="max-w-6xl mx-auto">
          {renderHeaderText()}
          {projects.length === 0 ? renderEmptyState() : (
            <div className={cn('grid', getGridClassName())}
            >
              {visibleProjects.map((project, idx) => wrapProject({
                project,
                idx,
                className: cn(radiusClassName, 'overflow-hidden border block'),
                style: cardBorderStyle,
                children: (
                  <article
                    className="h-full"
                    style={{ backgroundColor: tokens.neutralSurface }}
                  >
                    <div className="aspect-[3/2]">
                      {renderProjectImage(project, 32)}
                    </div>
                    <div className={cn('flex flex-col h-full', viewport === 'mobile' ? 'p-3' : 'p-4')}>
                      {renderBadge(project.category)}
                      <h3 className="font-semibold mt-2 mb-1 break-words leading-snug" style={{ color: tokens.neutralText }}>
                        {project.title || 'Tên dự án'}
                      </h3>
                      <p className="text-xs leading-relaxed break-words" style={{ color: tokens.mutedText }}>
                        {project.description || 'Mô tả dự án...'}
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-sm font-medium" style={{ color: tokens.actionText }}>
                        Xem chi tiết <ArrowRight size={14} />
                      </div>
                    </div>
                  </article>
                ),
              }))}

              {context === 'preview' && remainingCount > 0 ? (
                <div
                  className={cn(radiusClassName, 'flex items-center justify-center aspect-square border')}
                  style={{ backgroundColor: tokens.neutralBackground, borderColor: tokens.neutralBorder }}
                >
                  <div className="text-center">
                    <Plus size={32} className="mx-auto mb-2" style={{ color: tokens.mutedText }} />
                    <span className="text-lg font-bold" style={{ color: tokens.neutralText }}>+{remainingCount}</span>
                    <p className="text-xs" style={{ color: tokens.mutedText }}>dự án khác</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderFeaturedStyle = () => {
    const featured = projects[0];
    const maxVisible = context === 'preview'
      ? (viewport === 'mobile' ? 4 : 6)
      : projects.length;
    const visibleProjects = projects.slice(0, maxVisible);
    const otherProjects = visibleProjects.slice(1);
    const remainingCount = projects.length - visibleProjects.length;

    return (
      <section className={sectionClassName} data-mode={mode}>
        <div className="max-w-6xl mx-auto">
          {renderHeaderText()}
          {projects.length === 0 ? renderEmptyState() : (
            <div className={cn('grid gap-4', viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-[1.1fr_0.9fr] items-stretch')}>
              {featured ? wrapProject({
                project: featured,
                idx: 0,
                className: cn(radiusClassName, 'overflow-hidden border block', viewport === 'mobile' ? '' : 'row-span-2'),
                style: cardBorderStyle,
                children: (
                  <article className="flex h-full flex-col" style={{ backgroundColor: tokens.neutralSurface }}>
                    <div className={cn(viewport === 'mobile' ? 'aspect-[3/2]' : 'min-h-[260px] flex-1')}>
                      {renderProjectImage(featured, 48)}
                    </div>
                    <div className="p-5">
                      {renderBadge(featured.category)}
                      <h3 className={cn('font-bold mt-2 mb-2 break-words leading-snug', viewport === 'mobile' ? 'text-lg' : 'text-xl')} style={{ color: tokens.heading }}>
                        {featured.title || 'Dự án chính'}
                      </h3>
                      <p className="text-sm leading-relaxed break-words" style={{ color: tokens.mutedText }}>
                        {featured.description || 'Mô tả dự án...'}
                      </p>
                    </div>
                  </article>
                ),
              }) : null}

              <div className={cn('grid gap-4', viewport === 'tablet' ? 'grid-cols-1' : 'grid-cols-1')}>
                {otherProjects.map((project, idx) => wrapProject({
                  project,
                  idx: idx + 1,
                  className: cn(radiusClassName, 'min-h-[112px] border p-4 flex items-center gap-4 block'),
                  style: cardBorderStyle,
                  children: (
                    <article className="w-full flex items-center gap-4" style={{ backgroundColor: tokens.neutralSurface }}>
                      <div className={cn(cornerRadius === 'none' ? 'rounded-none' : 'rounded-lg', 'w-20 h-20 overflow-hidden flex-shrink-0')}>
                        {renderProjectImage(project, 24)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {renderBadge(project.category)}
                        <h4 className="font-semibold text-sm mt-1 break-words leading-snug" style={{ color: tokens.neutralText }}>
                          {project.title || 'Tên dự án'}
                        </h4>
                        <p className="text-xs mt-1 leading-relaxed break-words" style={{ color: tokens.mutedText }}>
                          {project.description || 'Mô tả dự án...'}
                        </p>
                      </div>
                    </article>
                  ),
                }))}

                {context === 'preview' && remainingCount > 0 ? (
                  <div
                    className={cn(radiusClassName, 'flex min-h-[96px] items-center justify-center border p-4 text-center')}
                    style={{ backgroundColor: tokens.neutralBackground, borderColor: tokens.neutralBorder }}
                  >
                    <div>
                      <Plus size={24} className="mx-auto mb-1" style={{ color: tokens.mutedText }} />
                      <span className="text-sm font-bold" style={{ color: tokens.neutralText }}>+{remainingCount} dự án khác</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderListStyle = () => {
    const maxVisible = context === 'preview'
      ? (viewport === 'mobile' ? 4 : 6)
      : projects.length;
    const visibleProjects = projects.slice(0, maxVisible);
    const remainingCount = projects.length - visibleProjects.length;

    return (
      <section className={sectionClassName} data-mode={mode}>
        <div className="max-w-6xl mx-auto">
          {renderHeaderText()}
          {projects.length === 0 ? renderEmptyState() : (
            <>
            <div className="space-y-3">
              {visibleProjects.map((project, idx) => wrapProject({
                project,
                idx,
                className: cn(
                  radiusClassName,
                  'border',
                  'overflow-hidden flex block',
                  viewport === 'mobile' ? 'flex-col' : 'items-center',
                ),
                style: cardBorderStyle,
                children: (
                  <article
                    className={cn('w-full flex', viewport === 'mobile' ? 'flex-col' : 'items-center')}
                    style={{ backgroundColor: tokens.neutralSurface }}
                  >
                    <div className={cn(viewport === 'mobile' ? 'aspect-video w-full' : 'w-40 h-24 flex-shrink-0')}>
                      {renderProjectImage(project, 24)}
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {renderBadge(project.category)}
                      </div>
                      <h3 className="font-semibold break-words leading-snug" style={{ color: tokens.neutralText }}>
                        {project.title || 'Tên dự án'}
                      </h3>
                      <p className="text-xs mt-1 leading-relaxed break-words" style={{ color: tokens.mutedText }}>
                        {project.description || 'Mô tả...'}
                      </p>
                    </div>
                  </article>
                ),
              }))}
            </div>

            {context === 'preview' && remainingCount > 0 ? (
              <div className="text-center mt-4">
                <span className="text-sm font-medium" style={{ color: tokens.actionText }}>+{remainingCount} dự án khác</span>
              </div>
            ) : null}
            </>
          )}
        </div>
      </section>
    );
  };

  const renderMasonryStyle = () => {
    const maxVisible = context === 'preview'
      ? (viewport === 'mobile' ? 6 : 9)
      : projects.length;
    const visibleProjects = projects.slice(0, maxVisible);
    const remainingCount = projects.length - visibleProjects.length;

    return (
      <section className={sectionClassName} data-mode={mode}>
        <div className="max-w-6xl mx-auto">
          {renderHeaderText()}
          {projects.length === 0 ? renderEmptyState() : (
            <>
            <div className={cn('columns-1 gap-4', viewport === 'tablet' && (desktopColumns === 3 ? 'columns-3' : 'columns-2'), viewport === 'desktop' && (desktopColumns === 4 ? 'columns-4' : 'columns-3'))}>
              {visibleProjects.map((project, idx) => {
                const heights = ['aspect-[4/5]', 'aspect-[4/3]', 'aspect-square'];
                const height = heights[idx % 3];

                return wrapProject({
                  project,
                  idx,
                  className: cn(radiusClassName, 'break-inside-avoid mb-4 overflow-hidden border block'),
                  style: cardBorderStyle,
                  children: (
                    <article style={{ backgroundColor: tokens.neutralSurface }}>
                      <div className={height}>{renderProjectImage(project, 32)}</div>
                      <div className="p-3">
                        {renderBadge(project.category)}
                        <h3 className="font-semibold text-sm mt-2 break-words leading-snug" style={{ color: tokens.neutralText }}>
                          {project.title || 'Tên dự án'}
                        </h3>
                        <p className="text-xs mt-1 leading-relaxed break-words" style={{ color: tokens.mutedText }}>
                          {project.description || 'Mô tả...'}
                        </p>
                      </div>
                    </article>
                  ),
                });
              })}
            </div>

            {context === 'preview' && remainingCount > 0 ? (
              <div className="text-center mt-6">
                <span className="text-sm font-medium" style={{ color: tokens.actionText }}>+{remainingCount} dự án khác</span>
              </div>
            ) : null}
            </>
          )}
        </div>
      </section>
    );
  };

  const renderCarouselStyle = () => {
    const itemsPerView = viewport === 'mobile'
      ? (desktopColumns === 4 ? 2 : 1)
      : (viewport === 'tablet' ? (desktopColumns === 4 ? 2 : 3) : desktopColumns);
    const slideClassName = viewport === 'mobile'
      ? (desktopColumns === 4 ? 'basis-1/2' : 'basis-full')
      : (viewport === 'tablet' ? (desktopColumns === 4 ? 'basis-1/2' : 'basis-1/3') : (desktopColumns === 4 ? 'basis-1/4' : 'basis-1/3'));

    return (
      <section className={sectionClassName} data-mode={mode}>
        <div className="max-w-6xl mx-auto relative">
          {renderHeaderText()}
          {projects.length === 0 ? renderEmptyState() : (
            <>
            {projects.length > itemsPerView ? (
              <>
                <button
                  type="button"
                  onClick={() => { carouselApi?.scrollPrev(); }}
                  disabled={!canScrollPrev}
                  className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: tokens.carouselArrowBorder }}
                  aria-label="Dự án trước"
                >
                  <ChevronLeft size={20} style={{ color: tokens.carouselArrowIcon }} />
                </button>
                <button
                  type="button"
                  onClick={() => { carouselApi?.scrollNext(); }}
                  disabled={!canScrollNext}
                  className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: tokens.carouselArrowBorder }}
                  aria-label="Dự án sau"
                >
                  <ChevronRight size={20} style={{ color: tokens.carouselArrowIcon }} />
                </button>
              </>
            ) : null}

            <div className="overflow-hidden mx-4 md:mx-8" ref={carouselRef}>
              <div className="-ml-4 flex touch-pan-y">
                {projects.map((project, idx) => wrapProject({
                  project,
                  idx,
                  className: cn(slideClassName, 'min-w-0 shrink-0 pl-4'),
                  children: (
                    <article className={cn(radiusClassName, 'h-full overflow-hidden border')} style={{ backgroundColor: tokens.neutralSurface, ...cardBorderStyle }}>
                      <div className="aspect-[4/3]">{renderProjectImage(project, 32)}</div>
                      <div className="p-4">
                        {renderBadge(project.category)}
                        <h3 className="font-semibold mt-2 break-words leading-snug" style={{ color: tokens.neutralText }}>
                          {project.title || 'Tên dự án'}
                        </h3>
                        <p className="text-xs mt-1 leading-relaxed break-words" style={{ color: tokens.mutedText }}>
                          {project.description || 'Mô tả...'}
                        </p>
                      </div>
                    </article>
                  ),
                }))}
              </div>
            </div>

            {projects.length > itemsPerView ? (
              <div className="flex justify-center gap-2 mt-4">
                {scrollSnaps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { carouselApi?.scrollTo(idx); }}
                    className={cn('h-2 rounded-full transition-all', carouselIndex === idx ? 'w-6' : 'w-2')}
                    style={{ backgroundColor: carouselIndex === idx ? tokens.secondary : tokens.neutralBorder }}
                    aria-label={`Đi tới trang ${idx + 1}`}
                  />
                ))}
              </div>
            ) : null}
            </>
          )}
        </div>
      </section>
    );
  };

  const renderTimelineStyle = () => {
    const maxVisible = context === 'preview'
      ? (viewport === 'mobile' ? 4 : 6)
      : projects.length;
    const visibleProjects = projects.slice(0, maxVisible);
    const remainingCount = projects.length - visibleProjects.length;

    return (
      <section className={sectionClassName} data-mode={mode}>
        <div className="max-w-4xl mx-auto relative">
          {renderHeaderText()}
          {projects.length === 0 ? renderEmptyState() : (
            <>
            <div
              className={cn('absolute top-0 bottom-0 w-0.5', viewport === 'mobile' ? 'left-4' : 'left-1/2 -translate-x-px')}
              style={{ backgroundColor: tokens.timelineLine }}
            />

            <div className="space-y-6 md:space-y-8">
              {visibleProjects.map((project, idx) => (
                <div
                  key={toProjectKey(project, idx)}
                  className={cn(
                    'relative flex items-start',
                    viewport === 'mobile' ? 'pl-12' : (idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'),
                  )}
                >
                  <div
                    className={cn(
                      'absolute w-8 h-8 rounded-full border-4 bg-white flex items-center justify-center text-xs font-bold z-10',
                      viewport === 'mobile' ? 'left-0' : 'left-1/2 -translate-x-1/2',
                    )}
                    style={{ borderColor: tokens.timelineDotBorder, color: tokens.timelineDotText }}
                  >
                    {idx + 1}
                  </div>

                  {wrapProject({
                    project,
                    idx,
                    className: cn(radiusClassName, 'overflow-hidden border block', viewport === 'mobile' ? 'w-full' : 'w-5/12'),
                    style: cardBorderStyle,
                    children: (
                      <article style={{ backgroundColor: tokens.neutralSurface }}>
                        <div className="aspect-[4/3]">{renderProjectImage(project, 32)}</div>
                        <div className="p-4">
                          {renderBadge(project.category)}
                          <h3 className="font-bold mt-2 mb-1 break-words leading-snug" style={{ color: tokens.neutralText }}>
                            {project.title || 'Tên dự án'}
                          </h3>
                          <p className="text-sm leading-relaxed break-words" style={{ color: tokens.mutedText }}>
                            {project.description || 'Mô tả...'}
                          </p>
                        </div>
                      </article>
                    ),
                  })}
                </div>
              ))}
            </div>

            {context === 'preview' && remainingCount > 0 ? (
              <div className="text-center mt-6">
                <span className="text-sm font-medium" style={{ color: tokens.actionText }}>+{remainingCount} dự án khác</span>
              </div>
            ) : null}
            </>
          )}
        </div>
      </section>
    );
  };

  if (style === 'grid') {return renderGridStyle();}
  if (style === 'featured') {return renderFeaturedStyle();}
  if (style === 'list') {return renderListStyle();}
  if (style === 'masonry') {return renderMasonryStyle();}
  if (style === 'carousel') {return renderCarouselStyle();}
  return renderTimelineStyle();
}
