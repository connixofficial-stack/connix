'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Fade from 'embla-carousel-fade';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { cn } from '@/app/admin/components/ui';
import { getAPCATextColor, getBentoColors, getConquestColors, getFadeColors, getFullscreenColors, getParallaxColors, getSliderColors, getSplitColors } from '@/app/admin/home-components/hero/_lib/colors';
import type { HeroContent, HeroStyle } from '@/app/admin/home-components/hero/_types';
import { getHeroCornerRadiusClassName, normalizeHeroCornerRadius, normalizeHeroSpacing } from '@/app/admin/home-components/hero/_types';
import { getSectionSpacingClassName } from '@/app/admin/home-components/_shared/types/sectionSpacing';
import type { HomeComponentSectionProps } from '../types';
import { Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { getVideoEmbedUrl, getVideoThumbnail, isVideoUrl } from '@/lib/utils/media';
import { parseHighlightedHeading } from '@/lib/utils/heroText';

type SiteImageProps = Omit<React.ComponentProps<typeof Image>, 'width' | 'height' | 'src'> & {
  src?: React.ComponentProps<typeof Image>['src'];
  width?: number | string;
  height?: number | string;
  sizes?: string;
};

const SiteImage = ({ src, alt = '', width = 1200, height = 800, sizes = '100vw', loading, ...rest }: SiteImageProps) => {
  if (!src) {return null;}
  const normalizedWidth = typeof width === 'string' ? Number.parseInt(width, 10) || 1200 : width;
  const normalizedHeight = typeof height === 'string' ? Number.parseInt(height, 10) || 800 : height;
  const fetchPriority = rest.priority ? 'high' : rest.fetchPriority;
  // Next.js forbids priority + loading='lazy'; when priority is set, omit loading entirely
  const resolvedLoading = rest.priority ? undefined : loading;

  return (
    <Image
      mode="hero"
      src={src}
      {...rest}
      loading={resolvedLoading}
      fetchPriority={fetchPriority}
      alt={alt}
      width={normalizedWidth}
      height={normalizedHeight}
      sizes={sizes}
    />
  );
};

const isLikelyVisibleSlide = (index: number, currentIndex: number, total: number) => {
  if (total <= 1) {return true;}
  if (index === currentIndex) {return true;}
  if (index === (currentIndex + 1) % total) {return true;}
  return index === (currentIndex - 1 + total) % total;
};

const HeroRuntimeVideo = ({ src, className }: { src: string; className: string }) => {
  const embedUrl = getVideoEmbedUrl(src, { autoplay: true, muted: true, loop: true });
  const thumbnailUrl = getVideoThumbnail(src);
  const [showCleanCover, setShowCleanCover] = React.useState(Boolean(embedUrl && thumbnailUrl));

  React.useEffect(() => {
    setShowCleanCover(Boolean(embedUrl && thumbnailUrl));
    if (!embedUrl || !thumbnailUrl) {
      return;
    }
    const timer = window.setTimeout(() => setShowCleanCover(false), 0);
    return () => window.clearTimeout(timer);
  }, [embedUrl, thumbnailUrl]);

  if (embedUrl) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        <iframe
          src={embedUrl}
          title="Hero video"
          className={cn(className, 'pointer-events-none border-0')}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        {thumbnailUrl && (
          <SiteImage
            src={thumbnailUrl}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              showCleanCover ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            loading="eager"
            sizes="100vw"
          />
        )}
      </div>
    );
  }

  return (
    <video
      src={src}
      className={className}
      muted
      loop
      autoPlay
      playsInline
    />
  );
};

import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export function HeroRuntimeSection({ config, brandColor, secondary, mode, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const rawSlides = (config.slides as { image: string; link: string; mediaType?: 'image' | 'video' }[]) || [];
  // Auto-detect mediaType nếu chưa có (backward-compatible)
  const slides = rawSlides.map(s => ({ ...s, mediaType: s.mediaType ?? (isVideoUrl(s.image) ? 'video' as const : undefined) }));
  const style = (config.style as HeroStyle) || 'slider';
  const content = (config.content as HeroContent) || {};
  const cornerRadiusClassName = getHeroCornerRadiusClassName(normalizeHeroCornerRadius(config.cornerRadius, config.noBorderRadius));
  const sectionSpacingClassName = getSectionSpacingClassName(normalizeHeroSpacing(config.spacing));
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const primaryHref = content.primaryButtonLink || slides[currentSlide]?.link || '#';
  const secondaryHref = content.secondaryButtonLink || '#';
  const sliderColors = adaptTokensForDarkMode(getSliderColors(brandColor, secondary, mode), isDark ?? false);
  const fadeColors = adaptTokensForDarkMode(getFadeColors(brandColor, secondary, mode), isDark ?? false);
  const bentoColors = adaptTokensForDarkMode(getBentoColors(brandColor, secondary, mode), isDark ?? false);
  const conquestColors = adaptTokensForDarkMode(getConquestColors(brandColor, secondary, mode), isDark ?? false);
  const fullscreenColors = adaptTokensForDarkMode(getFullscreenColors(brandColor, secondary, mode), isDark ?? false);
  const splitColors = adaptTokensForDarkMode(getSplitColors(brandColor, secondary, mode), isDark ?? false);
  const parallaxColors = adaptTokensForDarkMode(getParallaxColors(brandColor, secondary, mode), isDark ?? false);
  const renderWithSpacing = (node: React.ReactNode) => (
    <div className={sectionSpacingClassName}>
      {node}
    </div>
  );

  const activeSlideCount = style === 'bento'
    ? Math.min(slides.length, 4)
    : (style === 'triple' || style === 'triple2' ? Math.min(slides.length, 3) : slides.length);
  const isFadeStyle = style === 'fade' || style === 'builderCoffee';
  const plugins = React.useMemo(() => {
    return isFadeStyle ? [Fade()] : [];
  }, [isFadeStyle]);
  const [heroEmblaRef, heroEmblaApi] = useEmblaCarousel({ align: 'start', loop: activeSlideCount > 1 }, plugins);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const emblaCurrentSlide = activeSlideCount > 0 ? currentSlide % activeSlideCount : 0;

  const updateEmblaState = React.useCallback(() => {
    if (!heroEmblaApi) {return;}
    setCurrentSlide(heroEmblaApi.selectedScrollSnap());
    setCanScrollPrev(heroEmblaApi.canScrollPrev());
    setCanScrollNext(heroEmblaApi.canScrollNext());
  }, [heroEmblaApi]);

  React.useEffect(() => {
    if (!heroEmblaApi) {return;}
    updateEmblaState();
    heroEmblaApi.on('select', updateEmblaState);
    heroEmblaApi.on('reInit', updateEmblaState);
    return () => {
      heroEmblaApi.off('select', updateEmblaState);
      heroEmblaApi.off('reInit', updateEmblaState);
    };
  }, [heroEmblaApi, updateEmblaState]);

  const scrollHeroPrev = React.useCallback(() => {
    if (heroEmblaApi) {
      heroEmblaApi.scrollPrev();
      return;
    }
    setCurrentSlide((prev) => prev === 0 ? activeSlideCount - 1 : prev - 1);
  }, [activeSlideCount, heroEmblaApi]);

  const scrollHeroNext = React.useCallback(() => {
    if (heroEmblaApi) {
      heroEmblaApi.scrollNext();
      return;
    }
    setCurrentSlide((prev) => (prev + 1) % activeSlideCount);
  }, [activeSlideCount, heroEmblaApi]);

  const scrollHeroTo = React.useCallback((index: number) => {
    if (heroEmblaApi) {
      heroEmblaApi.scrollTo(index);
      return;
    }
    setCurrentSlide(index);
  }, [heroEmblaApi]);

  React.useEffect(() => {
    if (activeSlideCount <= 1) {return;}
    const timer = setInterval(() => {
      if (style === 'slider' || style === 'bento' || style === 'fullscreen' || style === 'conquest' || style === 'split' || style === 'parallax') {
        scrollHeroNext();
        return;
      }
      setCurrentSlide((prev) => (prev + 1) % activeSlideCount);
    }, 5000);
    return () => { clearInterval(timer); };
  }, [activeSlideCount, scrollHeroNext, style]);

  if (slides.length === 0) {
    return renderWithSpacing(
      <section className="relative h-[500px] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Chào mừng đến với chúng tôi</h1>
          <p className="text-slate-300">Khám phá sản phẩm và dịch vụ tuyệt vời</p>
        </div>
      </section>
    );
  }

  const renderSlideWithBlur = (slide: { image: string; link: string; mediaType?: 'image' | 'video' }, options?: { priority?: boolean; loading?: 'eager' | 'lazy' }) => {
    if (slide.mediaType === 'video') {
      return (
        <a href={slide.link || '#'} className="block w-full h-full relative bg-black">
          <HeroRuntimeVideo src={slide.image} className="w-full h-full object-cover" />
        </a>
      );
    }
    return (
      <a href={slide.link || '#'} className="block w-full h-full relative">
        <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(30px)' }} />
        <div className="absolute inset-0 bg-black/20" />
        <SiteImage src={slide.image} alt="" className="relative w-full h-full object-contain z-10" priority={options?.priority} loading={options?.loading} sizes="100vw" />
        {options?.priority && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.image} alt="" fetchPriority="high" decoding="async" className="absolute w-0 h-0 opacity-0" aria-hidden />
        )}
      </a>
    );
  };

  const renderPlaceholder = (backgroundColor: string, iconColor: string, size = 32) => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor }}>
      <ImageIcon size={size} style={{ color: iconColor }} />
    </div>
  );

  /** Render video hoặc image inline (dùng cho Bento/Split) */
  const _renderInlineMedia = (slide: { image: string; mediaType?: 'image' | 'video' }, imgProps?: Partial<React.ComponentProps<typeof SiteImage>>) => {
    if (slide.mediaType === 'video') {
      return (
        <HeroRuntimeVideo src={slide.image} className={imgProps?.className ?? 'w-full h-full object-cover'} />
      );
    }
    return <SiteImage src={slide.image} alt="" {...imgProps} />;
  };



  if (style === 'slider') {
    return renderWithSpacing(
      <section className={cn("relative w-full overflow-hidden", isDark ? "bg-slate-950" : "bg-transparent")}>
        <h1 className="sr-only">{content.heading || 'Trang chủ'}</h1>
        <div className="relative w-full aspect-[21/9] max-h-[400px] md:max-h-[550px] overflow-hidden" ref={heroEmblaRef}>
          <div className="flex h-full">
            {slides.map((slide, idx) => {
              const shouldLoad = isLikelyVisibleSlide(idx, emblaCurrentSlide, slides.length);
              return (
                <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%] hover:ring-2 hover:ring-offset-2 hover:ring-offset-slate-900" style={{ '--tw-ring-color': sliderColors.hoverRingColor } as React.CSSProperties}>
                  {slide.image ? renderSlideWithBlur(slide, { priority: idx === 0, loading: shouldLoad ? 'eager' : 'lazy' }) : renderPlaceholder(sliderColors.placeholderBg, sliderColors.placeholderIconColor)}
                </div>
              );
            })}
          </div>
          {slides.length > 1 && (
            <>
              <button type="button" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg hidden md:flex items-center justify-center transition-all z-20 border-2 disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}` }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: sliderColors.navButtonIconColor }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button type="button" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg hidden md:flex items-center justify-center transition-all z-20 border-2 disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}` }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: sliderColors.navButtonIconColor }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, idx) => (
                  <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`w-3 h-3 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-8' : ''}`} style={{ backgroundColor: idx === emblaCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                ))}
              </div>
              <div className="absolute bottom-2 left-0 right-0 h-0.5 z-20" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((emblaCurrentSlide + 1) / slides.length) * 100}%` }} />
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  if (style === 'fade') {
    return renderWithSpacing(
      <section className={cn("relative w-full overflow-hidden", isDark ? "bg-slate-950" : "bg-transparent")}>
        <h1 className="sr-only">{content.heading || 'Trang chủ'}</h1>
        <div className="relative w-full aspect-[21/9] max-h-[450px] md:max-h-[600px]" ref={heroEmblaRef}>
          <div className="flex h-full w-full">
            {slides.map((slide, idx) => {
              const shouldLoad = isLikelyVisibleSlide(idx, emblaCurrentSlide, slides.length);
              return (
                <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                  {slide.image ? renderSlideWithBlur(slide, { priority: idx === 0, loading: shouldLoad ? 'eager' : 'lazy' }) : renderPlaceholder(fadeColors.placeholderBg, fadeColors.placeholderIconColor)}
                </div>
              );
            })}
          </div>
          {slides.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent z-20">
              {slides.map((slide, idx) => (
                <button key={idx} onClick={() => { scrollHeroTo(idx); }} className={`rounded overflow-hidden transition-all border-2 w-16 h-10 md:w-20 md:h-12 ${idx === emblaCurrentSlide ? 'scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} style={idx === emblaCurrentSlide ? { borderColor: fadeColors.thumbnailBorderActive } : { borderColor: fadeColors.thumbnailBorderInactive }}>
                  {slide.image ? (slide.mediaType === 'video' ? <HeroRuntimeVideo src={slide.image} className="w-full h-full object-cover" /> : <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" loading="lazy" />) : renderPlaceholder(fadeColors.placeholderBg, fadeColors.placeholderIconColor, 18)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (style === 'builderCoffee') {
    return renderWithSpacing(
      <section className={cn("relative w-full overflow-hidden pb-[50px]", isDark ? "bg-slate-950" : "bg-white")}>
        <div className="mx-auto w-full max-w-7xl px-3">
          <div className="mt-5 flex flex-wrap -mx-3">
            <div className="grid w-full max-w-full grid-cols-3 gap-[10px] px-3">
              <div className="col-span-3 overflow-hidden">
                <div className="relative">
                  <h1 className="sr-only">{content.heading || 'Trang chủ'}</h1>
                  <div
                    className={cn('relative flex w-full select-none items-center overflow-hidden', isDark ? "bg-slate-900" : "bg-white", cornerRadiusClassName)}
                    role="toolbar"
                    ref={heroEmblaRef}
                  >
                    <div className="flex h-full w-full">
                      {slides.map((slide, idx) => {
                        const shouldLoad = isLikelyVisibleSlide(idx, emblaCurrentSlide, slides.length);
                        return (
                          <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                            <a href={slide.link || '#'} className="inline-block h-full w-full cursor-pointer text-center">
                              {slide.image ? (
                                slide.mediaType === 'video' ? (
                                  <HeroRuntimeVideo src={slide.image} className="h-[250px] md:h-[400px] lg:h-[500px] w-full object-contain" />
                                ) : (
                                  <div className="relative h-[250px] md:h-[400px] lg:h-[500px] w-full overflow-hidden">
                                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(30px)' }} />
                                    <div className="absolute inset-0 bg-black/10" />
                                    <SiteImage src={slide.image} alt="Sản phẩm nổi bật" className="relative z-10 mx-auto h-full w-full max-w-full object-contain align-middle" width={1500} height={560} priority={idx === 0} loading={shouldLoad ? 'eager' : 'lazy'} sizes="100vw" />
                                  </div>
                                )
                              ) : (
                                <div className="h-[250px] md:h-[400px] lg:h-[500px]">
                                  {renderPlaceholder('#f8fafc', sliderColors.placeholderIconColor)}
                                </div>
                              )}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                    {slides.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Previous"
                          onClick={scrollHeroPrev}
                          disabled={!canScrollPrev}
                          className="absolute -left-0.5 top-1/2 z-20 block h-[52px] w-[13px] -translate-y-1/2 overflow-hidden bg-transparent text-transparent md:h-[118px] md:w-[30px] disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ backgroundImage: 'url("https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/arow-left.png?1778581786863")', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' }}
                        >
                          <span className="absolute inset-0 z-30 flex items-center justify-start pl-0.5 text-black md:pl-1"><svg className="h-2.5 w-2.5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M15 19l-7-7 7-7" /></svg></span>
                        </button>
                        <button
                          type="button"
                          aria-label="Next"
                          onClick={scrollHeroNext}
                          disabled={!canScrollNext}
                          className="absolute -right-0.5 top-1/2 z-20 block h-[52px] w-[13px] -translate-y-1/2 overflow-hidden bg-transparent text-transparent md:h-[118px] md:w-[30px] disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ backgroundImage: 'url("https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/arow-right.png?1778581786863")', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' }}
                        >
                          <span className="absolute inset-0 z-30 flex items-center justify-end pr-0.5 text-black md:pr-1"><svg className="h-2.5 w-2.5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M9 5l7 7-7 7" /></svg></span>
                        </button>
                        <div className="absolute bottom-0 left-1/2 z-20 mb-4 flex h-6 w-[100px] -translate-x-1/2 items-center justify-center rounded-[15px]">
                          {slides.map((_, idx) => (
                            <button key={idx} type="button" aria-label={`Đi tới slide ${idx + 1}`} onClick={() => { scrollHeroTo(idx); }} className="mx-[3px] h-0.5 w-4 border transition-opacity" style={{ backgroundColor: idx === emblaCurrentSlide ? '#8b7046' : '#cccccc', borderColor: idx === emblaCurrentSlide ? '#8b7046' : '#cccccc', opacity: idx === emblaCurrentSlide ? 1 : 0.7 }} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'bento') {
    const bentoSlides = slides.slice(0, 4);
    const bentoCurrentSlide = bentoSlides.length > 0 ? currentSlide % bentoSlides.length : 0;
    const bentoPlaceholders = ['#f1f5f9', '#e2e8f0', '#f1f5f9', '#e2e8f0'];
    return renderWithSpacing(
      <section className={cn("relative w-full overflow-hidden p-2 md:p-4", isDark ? "bg-slate-950" : "bg-transparent")}>
        <h1 className="sr-only">{content.heading || 'Trang chủ'}</h1>
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative aspect-[16/9] max-h-[400px] overflow-hidden md:hidden" ref={heroEmblaRef}>
            <div className="flex h-full">
              {bentoSlides.map((slide, idx) => (
                <a key={idx} href={slide.link || '#'} className={cn('relative h-full min-w-0 flex-[0_0_100%] overflow-hidden', cornerRadiusClassName)}>
                  {slide.image ? (
                    slide.mediaType === 'video' ? (
                      <HeroRuntimeVideo src={slide.image} className="w-full h-full object-cover" />
                    ) : (
                      <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" priority={idx === 0} loading={idx === 0 ? undefined : 'lazy'} sizes="100vw" />
                    )
                  ) : renderPlaceholder(bentoPlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)}
                </a>
              ))}
            </div>
            {bentoSlides.length > 1 && (
              <>
                <button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                  {bentoSlides.map((_, idx) => (
                    <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === bentoCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === bentoCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                  ))}
                </div>
                <div className="absolute bottom-2 left-0 right-0 z-20 h-0.5" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                  <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((bentoCurrentSlide + 1) / bentoSlides.length) * 100}%` }} />
                </div>
              </>
            )}
          </div>
          <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 aspect-[5/2] max-h-[550px]">
            <a href={bentoSlides[0]?.link || '#'} className={cn('col-span-2 row-span-2 relative overflow-hidden ring-2 ring-offset-1 ring-offset-slate-900', cornerRadiusClassName)} style={{ '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties}>
              {bentoSlides[0]?.image ? (
                bentoSlides[0].mediaType === 'video' ? (
                  <HeroRuntimeVideo src={bentoSlides[0].image} className="w-full h-full object-cover" />
                ) : (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[0].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(25px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[0].image} alt="" className="relative w-full h-full object-cover z-10" priority sizes="50vw" />
                </div>
                )
              ) : renderPlaceholder(bentoPlaceholders[0], bentoColors.placeholderIcon, 24)}
            </a>
            <a href={bentoSlides[1]?.link || '#'} className={cn('col-span-2 relative overflow-hidden', cornerRadiusClassName)}>
              {bentoSlides[1]?.image ? (
                bentoSlides[1].mediaType === 'video' ? (
                  <HeroRuntimeVideo src={bentoSlides[1].image} className="w-full h-full object-cover" />
                ) : (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[1].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(20px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[1].image} alt="" className="relative w-full h-full object-cover z-10" loading="lazy" sizes="25vw" />
                </div>
                )
              ) : renderPlaceholder(bentoPlaceholders[1], bentoColors.placeholderIcon, 22)}
            </a>
            <a href={bentoSlides[2]?.link || '#'} className={cn('relative overflow-hidden', cornerRadiusClassName)}>
              {bentoSlides[2]?.image ? (
                bentoSlides[2].mediaType === 'video' ? (
                  <HeroRuntimeVideo src={bentoSlides[2].image} className="w-full h-full object-cover" />
                ) : (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[2].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[2].image} alt="" className="relative w-full h-full object-cover z-10" loading="lazy" sizes="25vw" />
                </div>
                )
              ) : renderPlaceholder(bentoPlaceholders[2], bentoColors.placeholderIcon, 20)}
            </a>
            <a href={bentoSlides[3]?.link || '#'} className={cn('relative overflow-hidden', cornerRadiusClassName)}>
              {bentoSlides[3]?.image ? (
                bentoSlides[3].mediaType === 'video' ? (
                  <HeroRuntimeVideo src={bentoSlides[3].image} className="w-full h-full object-cover" />
                ) : (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[3].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[3].image} alt="" className="relative w-full h-full object-cover z-10" loading="lazy" sizes="25vw" />
                </div>
                )
              ) : renderPlaceholder(bentoPlaceholders[3], bentoColors.placeholderIcon, 20)}
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'triple') {
    const tripleSlides = slides.slice(0, 3);
    const triplePlaceholders = ['#f1f5f9', '#e2e8f0', '#f1f5f9'];
    return renderWithSpacing(
      <section className={cn("relative w-full overflow-hidden p-2 md:p-4", isDark ? "bg-slate-950" : "bg-transparent")}>
        <h1 className="sr-only">{content.heading || 'Trang chủ'}</h1>
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative aspect-[16/9] max-h-[400px] overflow-hidden md:hidden" ref={heroEmblaRef}>
            <div className="flex h-full">
              {tripleSlides.map((slide, idx) => (
                <a key={idx} href={slide.link || '#'} className={cn('relative h-full min-w-0 flex-[0_0_100%] overflow-hidden', cornerRadiusClassName)}>
                  {slide.image ? (
                    slide.mediaType === 'video' ? (
                      <HeroRuntimeVideo src={slide.image} className="w-full h-full object-cover" />
                    ) : (
                      <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" priority={idx === 0} loading={idx === 0 ? undefined : 'lazy'} sizes="100vw" />
                    )
                  ) : renderPlaceholder(triplePlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)}
                </a>
              ))}
            </div>
            {tripleSlides.length > 1 && (
              <>
                <button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                  {tripleSlides.map((_, idx) => (
                    <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                  ))}
                </div>
                <div className="absolute bottom-2 left-0 right-0 z-20 h-0.5" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                  <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((emblaCurrentSlide + 1) / tripleSlides.length) * 100}%` }} />
                </div>
              </>
            )}
          </div>
          <div className="hidden aspect-[16/3] max-h-[550px] grid-cols-3 gap-3 md:grid">
            {tripleSlides.map((slide, idx) => (
              <a key={idx} href={slide.link || '#'} className={cn('relative overflow-hidden', cornerRadiusClassName, idx === 0 && 'ring-2 ring-offset-1 ring-offset-slate-900')} style={idx === 0 ? { '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties : undefined}>
                {slide.image ? (
                  slide.mediaType === 'video' ? (
                    <HeroRuntimeVideo src={slide.image} className="w-full h-full object-cover" />
                  ) : (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: `blur(${25 - idx * 5}px)` }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <SiteImage src={slide.image} alt="" className="relative w-full h-full object-cover z-10" priority={idx === 0} loading={idx === 0 ? undefined : 'lazy'} sizes="33vw" />
                  </div>
                  )
                ) : renderPlaceholder(triplePlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, idx === 0 ? 24 : 20)}
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'triple2') {
    const tripleSlides = slides.slice(0, 3);
    const triplePlaceholders = ['#f1f5f9', '#e2e8f0', '#f1f5f9'];
    return renderWithSpacing(
      <section className={cn("relative w-full overflow-hidden p-2 md:p-4", isDark ? "bg-slate-950" : "bg-transparent")}>
        <h1 className="sr-only">{content.heading || 'Trang chủ'}</h1>
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative aspect-[16/9] max-h-[400px] overflow-hidden md:hidden" ref={heroEmblaRef}>
            <div className="flex h-full">
              {tripleSlides.map((slide, idx) => (
                <a key={idx} href={slide.link || '#'} className={cn('relative h-full min-w-0 flex-[0_0_100%] overflow-hidden', cornerRadiusClassName)}>
                  {slide.image ? (
                    slide.mediaType === 'video' ? (
                      <HeroRuntimeVideo src={slide.image} className="w-full h-full object-cover" />
                    ) : (
                      <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" priority={idx === 0} loading={idx === 0 ? undefined : 'lazy'} sizes="100vw" />
                    )
                  ) : renderPlaceholder(triplePlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)}
                </a>
              ))}
            </div>
            {tripleSlides.length > 1 && (
              <>
                <button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                  {tripleSlides.map((_, idx) => (
                    <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                  ))}
                </div>
                <div className="absolute bottom-2 left-0 right-0 z-20 h-0.5" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                  <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((emblaCurrentSlide + 1) / tripleSlides.length) * 100}%` }} />
                </div>
              </>
            )}
          </div>
          <div className="hidden aspect-[8/3] max-h-[550px] grid-cols-3 grid-rows-2 gap-3 md:grid">
            <a href={tripleSlides[0]?.link || '#'} className={cn('col-span-2 row-span-2 relative overflow-hidden ring-2 ring-offset-1 ring-offset-slate-900', cornerRadiusClassName)} style={{ '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties}>
              {tripleSlides[0]?.image ? (
                tripleSlides[0].mediaType === 'video' ? (
                  <HeroRuntimeVideo src={tripleSlides[0].image} className="w-full h-full object-cover" />
                ) : (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${tripleSlides[0].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(25px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={tripleSlides[0].image} alt="" className="relative w-full h-full object-cover z-10" priority sizes="66vw" />
                </div>
                )
              ) : renderPlaceholder(triplePlaceholders[0], bentoColors.placeholderIcon, 24)}
            </a>
            {tripleSlides.slice(1, 3).map((slide, idx) => (
              <a key={idx} href={slide.link || '#'} className={cn('relative overflow-hidden', cornerRadiusClassName)}>
                {slide.image ? (
                  slide.mediaType === 'video' ? (
                    <HeroRuntimeVideo src={slide.image} className="w-full h-full object-cover" />
                  ) : (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: `blur(${20 - idx * 5}px)` }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <SiteImage src={slide.image} alt="" className="relative w-full h-full object-cover z-10" loading="lazy" sizes="33vw" />
                  </div>
                  )
                ) : renderPlaceholder(triplePlaceholders[idx + 1] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)}
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const renderHeroSlideContain = (slide: { image?: string; mediaType?: 'image' | 'video' }, options?: { overlay?: React.ReactNode; blur?: number; fit?: 'contain' | 'cover'; priority?: boolean; loading?: 'eager' | 'lazy' }) => {
    if (slide.mediaType === 'video') {
      return (
        <div className="w-full h-full relative bg-black">
          <HeroRuntimeVideo
            src={slide.image ?? ''}
            className={cn('w-full h-full z-10', options?.fit === 'cover' ? 'object-cover' : 'object-contain')}
          />
          {options?.overlay}
        </div>
      );
    }
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: `blur(${options?.blur ?? 25}px)` }} />
        <SiteImage src={slide.image ?? ''} alt="" className={cn('relative w-full h-full z-10', options?.fit === 'cover' ? 'object-cover' : 'object-contain')} priority={options?.priority} loading={options?.loading} sizes="100vw" />
        {options?.overlay}
      </div>
    );
  };

  if (style === 'fullscreen') {
    const showFullscreenContent = content.showFullscreenContent !== false;
    const primaryButtonBg = content.primaryButtonColor || fullscreenColors.primaryCTA;
    const primaryButtonText = getAPCATextColor(primaryButtonBg, 16, 600);
    const secondaryButtonStyle = content.secondaryButtonColor
      ? {
        backgroundColor: content.secondaryButtonColor,
        borderColor: content.secondaryButtonColor,
        color: getAPCATextColor(content.secondaryButtonColor, 16, 600),
      }
      : { borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff' };
    return renderWithSpacing(
      <section className={cn("relative w-full overflow-hidden", isDark ? "bg-slate-950" : "bg-transparent")}>
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          {!showFullscreenContent ? (
            <>
              <div className="absolute inset-0 overflow-hidden md:hidden" ref={heroEmblaRef}>
                <div className="flex h-full">
                  {slides.map((slide, idx) => {
                    const shouldLoad = isLikelyVisibleSlide(idx, emblaCurrentSlide, slides.length);
                    return (
                      <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                        {slide.image ? renderHeroSlideContain(slide, { fit: 'contain', priority: idx === 0, loading: shouldLoad ? 'eager' : 'lazy' }) : renderPlaceholder(fullscreenColors.placeholderBg, fullscreenColors.placeholderIcon)}
                      </div>
                    );
                  })}
                </div>
                {slides.length > 1 && (
                  <>
                    <button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                      {slides.map((_, idx) => (
                        <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? fullscreenColors.dotActive : fullscreenColors.dotInactive }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="absolute inset-0 hidden md:block">
                {slides.map((slide, idx) => {
                  const shouldLoad = isLikelyVisibleSlide(idx, currentSlide, slides.length);
                  return (
                    <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      {slide.image ? renderHeroSlideContain(slide, { fit: 'contain', priority: idx === currentSlide, loading: shouldLoad ? 'eager' : 'lazy' }) : renderPlaceholder(fullscreenColors.placeholderBg, fullscreenColors.placeholderIcon)}
                    </div>
                  );
                })}
              </div>
            </>
          ) : slides.map((slide, idx) => {
            const shouldLoad = isLikelyVisibleSlide(idx, currentSlide, slides.length);
            return (
              <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {slide.image ? renderHeroSlideContain(slide, { fit: 'contain', priority: idx === currentSlide, loading: shouldLoad ? 'eager' : 'lazy', overlay: <div className="absolute inset-0 z-20" style={{ background: `linear-gradient(to right, rgba(0,0,0,${(content.overlayOpacity ?? 50) / 100}), rgba(0,0,0,${(content.overlayOpacity ?? 50) / 250}), transparent)` }} /> }) : renderPlaceholder(fullscreenColors.placeholderBg, fullscreenColors.placeholderIcon)}
              </div>
            );
          })}
          {showFullscreenContent && (
            <div className={`absolute inset-0 z-30 flex flex-col justify-center px-4 md:px-8 lg:px-16${content.textAlign === 'center' ? ' items-center text-center' : ''}${content.textAlign === 'right' ? ' items-end text-right' : ''}`}>
              <div className="max-w-xl space-y-4 md:space-y-6">
                {content.badge && <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: fullscreenColors.badgeBg, color: fullscreenColors.badgeText }}><span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: fullscreenColors.badgeDotPulse }} />{content.badge}</div>}
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">{parseHighlightedHeading(content.heading ?? 'Tiêu đề chính', content.highlightColor)}</h1>
                {content.description && <p className="text-white/80 text-sm md:text-lg">{content.description}</p>}
                <div className={`flex flex-col sm:flex-row gap-3${content.textAlign === 'center' ? ' justify-center' : ''}${content.textAlign === 'right' ? ' justify-end' : ''}`}>
                  {content.primaryButtonText && <a href={primaryHref} className="px-6 py-3 font-medium rounded-lg text-center" style={{ backgroundColor: primaryButtonBg, color: primaryButtonText }}>{content.primaryButtonText}</a>}
                  {content.secondaryButtonText && <a href={secondaryHref} className="px-6 py-3 font-medium rounded-lg border hover:bg-white/10 transition-colors text-center" style={secondaryButtonStyle}>{content.secondaryButtonText}</a>}
                </div>
              </div>
            </div>
          )}
          {showFullscreenContent && slides.length > 1 && <div className="absolute bottom-6 right-6 flex gap-2 z-40">{slides.map((_, idx) => <button key={idx} onClick={() => { setCurrentSlide(idx); }} className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'w-8' : ''}`} style={{ backgroundColor: idx === currentSlide ? fullscreenColors.dotActive : fullscreenColors.dotInactive }} />)}</div>}
        </div>
      </section>
    );
  }

  if (style === 'conquest') {
    const primaryButtonBg = content.primaryButtonColor || conquestColors.primaryCTA;
    const primaryButtonText = getAPCATextColor(primaryButtonBg, 16, 600);
    const secondaryButtonStyle = content.secondaryButtonColor
      ? {
        backgroundColor: content.secondaryButtonColor,
        borderColor: content.secondaryButtonColor,
        color: getAPCATextColor(content.secondaryButtonColor, 16, 600),
      }
      : {
        backgroundColor: 'transparent',
        borderColor: conquestColors.sectionText,
        color: conquestColors.secondaryCTAText,
      };
    const contentAlignClass = content.textAlign === 'center'
      ? 'items-center text-center md:text-center'
      : content.textAlign === 'right'
        ? 'items-end text-right md:text-right'
        : 'items-center text-center md:items-start md:text-left';
    const buttonAlignClass = content.textAlign === 'center'
      ? 'justify-center'
      : content.textAlign === 'right'
        ? 'justify-end'
        : 'justify-center md:justify-start';

    return renderWithSpacing(
      <section className="relative w-full overflow-hidden" style={{ backgroundColor: conquestColors.sectionBg, color: conquestColors.sectionText }}>
        <div className="relative mx-auto flex min-h-[520px] w-full max-w-7xl flex-col overflow-hidden px-4 pt-8 md:min-h-[560px] md:flex-row md:items-stretch md:justify-between md:px-8 md:pt-0">
          <div className={cn("relative z-20 flex max-w-full flex-col justify-center gap-4 pb-4 md:min-w-[420px] md:max-w-[540px] md:gap-6 md:py-20", contentAlignClass)}>
            {content.badge && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: conquestColors.badgeBg, color: conquestColors.badgeText }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: conquestColors.accentSolid }} />
                {content.badge}
              </span>
            )}
            <h1 className="text-3xl font-bold uppercase leading-[1.05] md:text-5xl lg:text-6xl">
              {parseHighlightedHeading(content.heading ?? 'Chinh phục tầm cao mới', content.highlightColor || conquestColors.accentSolid)}
            </h1>
            {content.description && (
              <p className="max-w-xl text-sm md:text-lg" style={{ color: conquestColors.descriptionText }}>
                {content.description}
              </p>
            )}
            <div className={cn("flex flex-wrap gap-3", buttonAlignClass)}>
              {content.primaryButtonText && (
                <a href={primaryHref} className="rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primaryButtonBg, color: primaryButtonText }}>
                  {content.primaryButtonText}
                </a>
              )}
              {content.secondaryButtonText && (
                <a href={secondaryHref} className="rounded-full border px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={secondaryButtonStyle}>
                  {content.secondaryButtonText}
                </a>
              )}
            </div>
          </div>

          <div className="relative flex min-h-[270px] flex-1 items-end justify-center md:min-h-[560px]">
            <div className="absolute inset-y-0 right-0 hidden w-full max-w-[640px] md:block" aria-hidden>
              {[0, 1, 2].map((idx) => (
                <span key={idx} className="absolute top-0 w-16 rounded-b-sm opacity-80" style={{ right: `${90 + idx * 150}px`, height: '60%', backgroundImage: conquestColors.pillarGradient }} />
              ))}
              <span className="absolute bottom-0 right-[360px] h-[34%] w-44 skew-x-[-14deg] opacity-80" style={{ backgroundImage: conquestColors.baseGradient }} />
              <span className="absolute bottom-0 right-[205px] h-[34%] w-36 skew-x-[10deg] opacity-80" style={{ backgroundImage: conquestColors.baseGradient }} />
              <span className="absolute bottom-0 right-6 h-[34%] w-44 skew-x-[14deg] opacity-80" style={{ backgroundImage: conquestColors.baseGradient }} />
            </div>
            <div className="relative z-10 h-[260px] w-full overflow-hidden md:h-[500px] md:max-w-[620px]" ref={heroEmblaRef}>
              <div className="flex h-full">
                {slides.map((slide, idx) => {
                  const shouldLoad = isLikelyVisibleSlide(idx, emblaCurrentSlide, slides.length);
                  return (
                    <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                      {slide.image
                        ? renderHeroSlideContain(slide, { fit: 'contain', priority: idx === 0, loading: shouldLoad ? 'eager' : 'lazy', blur: 18 })
                        : renderPlaceholder(conquestColors.placeholderBg, conquestColors.placeholderIcon)}
                    </div>
                  );
                })}
              </div>
              {slides.length > 1 && (
                <>
                  <button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: conquestColors.primaryCTA, borderColor: conquestColors.sectionText, color: conquestColors.primaryCTAText }}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: conquestColors.primaryCTA, borderColor: conquestColors.sectionText, color: conquestColors.primaryCTAText }}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {slides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
              {slides.map((_, idx) => (
                <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? conquestColors.dotActive : conquestColors.dotInactive }} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (style === 'split') {
    const primaryButtonBg = content.primaryButtonColor || splitColors.primaryCTA;
    const primaryButtonText = getAPCATextColor(primaryButtonBg, 16, 600);
    return renderWithSpacing(
      <section className="relative w-full overflow-hidden" style={{ backgroundColor: splitColors.contentBg }}>
        <div className="flex flex-col md:flex-row md:h-[450px] lg:h-[550px]">
          <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-10 lg:p-16 order-2 md:order-1" style={{ backgroundColor: splitColors.contentBg }}>
            <div className={`max-w-md space-y-4${content.textAlign === 'center' ? ' text-center' : ''}${content.textAlign === 'right' ? ' text-right' : ''}`}>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: splitColors.badgeBg, color: splitColors.badgeText }}>{content.badge ?? `Banner ${emblaCurrentSlide + 1}/${slides.length}`}</span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight" style={{ color: splitColors.headingText }}>{parseHighlightedHeading(content.heading ?? 'Tiêu đề nổi bật', content.highlightColor)}</h1>
              {content.description && <p className="text-base md:text-lg" style={{ color: splitColors.descriptionText }}>{content.description}</p>}
              {content.primaryButtonText && <div className={`pt-2${content.textAlign === 'center' ? ' text-center' : ''}${content.textAlign === 'right' ? ' text-right' : ''}`}><a href={primaryHref} className="inline-block px-6 py-3 font-medium rounded-lg" style={{ backgroundColor: primaryButtonBg, color: primaryButtonText }}>{content.primaryButtonText}</a></div>}
            </div>
            {slides.length > 1 && <div className="mt-8 hidden gap-2 md:flex">{slides.map((_, idx) => <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-1.5 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-10' : 'w-6'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? splitColors.progressDotActive : splitColors.progressDotInactive }} />)}</div>}
          </div>
          <div className="relative order-1 md:order-2 h-[280px] md:h-full w-full md:w-1/2 overflow-hidden" ref={heroEmblaRef}>
            <div className="flex h-full w-full">
              {slides.map((slide, idx) => {
                const shouldLoad = isLikelyVisibleSlide(idx, emblaCurrentSlide, slides.length);
                return (
                  <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                    {slide.image ? (slide.mediaType === 'video' ? <HeroRuntimeVideo src={slide.image} className="w-full h-full object-cover" /> : <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" priority={idx === 0} loading={shouldLoad ? 'eager' : 'lazy'} sizes="(max-width: 768px) 100vw, 50vw" />) : <div className="w-full h-full flex items-center justify-center bg-slate-200"><LayoutTemplate size={48} className="text-slate-400" /></div>}
                  </div>
                );
              })}
            </div>
            {slides.length > 1 && (
              <>
                <button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 md:left-4 top-1/2 z-10 flex h-8 w-8 md:h-10 md:w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}><svg className="h-4 w-4 md:w-5 md:h-5" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 md:right-4 top-1/2 z-10 flex h-8 w-8 md:h-10 md:w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}><svg className="h-4 w-4 md:w-5 md:h-5" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:hidden">
                  {slides.map((_, idx) => <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? splitColors.progressDotActive : splitColors.progressDotInactive }} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  return renderWithSpacing(
    <section className={cn("relative w-full overflow-hidden", isDark ? "bg-slate-950" : "bg-transparent")}>
      <h1 className="sr-only">{content.heading || 'Trang chủ'}</h1>
      <div className="md:hidden" style={{ backgroundColor: parallaxColors.cardBg }}>
        <div className="relative h-[280px] w-full overflow-hidden" ref={heroEmblaRef}>
          <div className="flex h-full">
            {slides.map((slide, idx) => {
              const shouldLoad = isLikelyVisibleSlide(idx, emblaCurrentSlide, slides.length);
              return (
                <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                  {slide.image ? renderHeroSlideContain(slide, { priority: idx === 0, loading: shouldLoad ? 'eager' : 'lazy', overlay: <div className="absolute inset-0 z-20" style={{ background: `linear-gradient(to top, rgba(0,0,0,${(content.overlayOpacity ?? 50) / 160}), rgba(0,0,0,0))` }} /> }) : renderPlaceholder(parallaxColors.placeholderBg, parallaxColors.placeholderIcon)}
                </div>
              );
            })}
          </div>
          {slides.length > 1 && <><button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}><svg className="h-4 w-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button><button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}><svg className="h-4 w-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button><div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">{slides.map((_, idx) => <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? parallaxColors.cardBadgeDot : 'rgba(255,255,255,0.55)' }} />)}</div></>}
        </div>
        <div className="p-6">
          {content.badge && <div className="flex items-center gap-3 mb-2"><div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: parallaxColors.cardBadgeDot }} /><span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full" style={{ backgroundColor: parallaxColors.cardBadgeBg, color: parallaxColors.cardBadgeText }}>{content.badge}</span></div>}
          <h3 className="text-lg font-bold" style={{ color: parallaxColors.headingText }}>{parseHighlightedHeading(content.heading ?? 'Tiêu đề nổi bật', content.highlightColor)}</h3>
          {content.description && <p className="text-sm mt-1" style={{ color: parallaxColors.descriptionText }}>{content.description}</p>}
          <div className="flex items-center gap-3 mt-4">
            {content.primaryButtonText && <a href={primaryHref} className="px-5 py-2 font-medium rounded-lg text-sm" style={{ backgroundColor: content.primaryButtonColor || parallaxColors.primaryCTA, color: getAPCATextColor(content.primaryButtonColor || parallaxColors.primaryCTA, 14, 600) }}>{content.primaryButtonText}</a>}
            {content.countdownText && <span className="text-sm" style={{ color: parallaxColors.countdownText }}>{content.countdownText}</span>}
          </div>
        </div>
      </div>
      <div className="relative hidden w-full md:block md:h-[450px] lg:h-[550px]">
        {slides.map((slide, idx) => {
          const shouldLoad = isLikelyVisibleSlide(idx, currentSlide, slides.length);
          return (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {slide.image ? renderHeroSlideContain(slide, { priority: idx === currentSlide, loading: shouldLoad ? 'eager' : 'lazy', overlay: <div className="absolute inset-0 z-20" style={{ background: `linear-gradient(to top, rgba(0,0,0,${(content.overlayOpacity ?? 50) / 100}), rgba(0,0,0,${(content.overlayOpacity ?? 50) / 300}), rgba(0,0,0,${(content.overlayOpacity ?? 50) / 500}))` }} /> }) : renderPlaceholder(parallaxColors.placeholderBg, parallaxColors.placeholderIcon)}
            </div>
          );
        })}
        <div className="absolute z-10 inset-x-8 bottom-8 flex items-end">
          <div className={cn('shadow-2xl p-6 max-w-lg', cornerRadiusClassName)} style={{ backgroundColor: parallaxColors.cardBg }}>
            {content.badge && <div className="flex items-center gap-3 mb-2"><div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: parallaxColors.cardBadgeDot }} /><span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full" style={{ backgroundColor: parallaxColors.cardBadgeBg, color: parallaxColors.cardBadgeText }}>{content.badge}</span></div>}
            <h3 className="text-xl font-bold" style={{ color: parallaxColors.headingText }}>{parseHighlightedHeading(content.heading ?? 'Tiêu đề nổi bật', content.highlightColor)}</h3>
            {content.description && <p className="text-sm mt-1" style={{ color: parallaxColors.descriptionText }}>{content.description}</p>}
            <div className="flex items-center gap-3 mt-4">
              {content.primaryButtonText && <a href={primaryHref} className="px-5 py-2 font-medium rounded-lg text-sm" style={{ backgroundColor: content.primaryButtonColor || parallaxColors.primaryCTA, color: getAPCATextColor(content.primaryButtonColor || parallaxColors.primaryCTA, 14, 600) }}>{content.primaryButtonText}</a>}
              {content.countdownText && <span className="text-sm" style={{ color: parallaxColors.countdownText }}>{content.countdownText}</span>}
            </div>
          </div>
        </div>
        {slides.length > 1 && <div className="absolute top-4 right-4 flex items-center gap-2 z-20"><button type="button" onClick={() => { setCurrentSlide((prev) => prev === 0 ? slides.length - 1 : prev - 1); }} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}><svg className="w-4 h-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button><span className="text-white/80 text-xs font-medium px-2">{currentSlide + 1} / {slides.length}</span><button type="button" onClick={() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}><svg className="w-4 h-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button></div>}
      </div>
    </section>
  );
}
