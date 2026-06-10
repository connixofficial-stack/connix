'use client';

import React, { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Fade from 'embla-carousel-fade';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { getBrandColors } from '@/lib/utils/colors';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { getVideoEmbedUrl, getVideoThumbnail, isVideoUrl } from '@/lib/utils/media';
import { parseHighlightedHeading } from '@/lib/utils/heroText';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import {
  getBentoColors,
  getAPCATextColor,
  getConquestColors,
  getFadeColors,
  getFullscreenColors,
  getHeroColors,
  getParallaxColors,
  getSliderColors,
  getSplitColors,
} from '../_lib/colors';
import { HERO_STYLES } from '../_lib/constants';
import type { HeroContent, HeroCornerRadius, HeroSpacing, HeroStyle } from '../_types';
import { DEFAULT_HERO_CORNER_RADIUS, DEFAULT_HERO_SPACING, getHeroCornerRadiusClassName } from '../_types';
import { getSectionSpacingClassName } from '../../_shared/types/sectionSpacing';

const HeroPreviewVideo = ({ src, className }: { src: string; className: string }) => {
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
          title="Hero video preview"
          className={cn(className, 'pointer-events-none border-0')}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        {thumbnailUrl && (
          <PreviewImage
            src={thumbnailUrl}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              showCleanCover ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
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

export const HeroPreview = ({ 
  slides, 
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'slider',
  onStyleChange,
  content,
  cornerRadius = DEFAULT_HERO_CORNER_RADIUS,
  spacing = DEFAULT_HERO_SPACING,
  fontStyle,
  fontClassName,
  isDark: propIsDark,
}: { 
  slides: { id: number; image: string; link: string; mediaType?: 'image' | 'video' }[]; 
  brandColor: string;
  secondary: string;
  mode?: 'single' | 'dual';
  selectedStyle?: HeroStyle;
  onStyleChange?: (style: HeroStyle) => void;
  content?: HeroContent;
  cornerRadius?: HeroCornerRadius;
  spacing?: HeroSpacing;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  isDark?: boolean;
}) => {
  const [isDarkState, setIsDarkState] = useState(propIsDark ?? false);

  useEffect(() => {
    setIsDarkState(propIsDark ?? document.documentElement.classList.contains('dark'));
  }, [propIsDark]);

  useEffect(() => {
    if (typeof window === 'undefined' || propIsDark !== undefined) {
      return;
    }
    
    setIsDarkState(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDarkState(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [propIsDark]);
  const { device, setDevice } = usePreviewDevice();
  const [currentSlide, setCurrentSlide] = useState(0);
  const previewStyle = selectedStyle ?? 'slider';
  const activeSlideCount = previewStyle === 'bento'
    ? Math.min(slides.length, 4)
    : (previewStyle === 'triple' || previewStyle === 'triple2' ? Math.min(slides.length, 3) : slides.length);
  const isFadeStyle = previewStyle === 'fade' || previewStyle === 'builderCoffee' || (previewStyle === 'split' && device !== 'mobile');
  const plugins = React.useMemo(() => {
    return isFadeStyle ? [Fade()] : [];
  }, [isFadeStyle]);
  const [heroEmblaRef, heroEmblaApi] = useEmblaCarousel({ align: 'start', loop: activeSlideCount > 1 }, plugins);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const emblaCurrentSlide = activeSlideCount > 0 ? currentSlide % activeSlideCount : 0;
  const setPreviewStyle = (style: string) => onStyleChange?.(style as HeroStyle);
  const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
  const info = (previewStyle !== 'bento' && previewStyle !== 'triple' && previewStyle !== 'triple2')
    ? `Slide ${currentSlide + 1} / ${slides.length || 1} • ${modeLabel}`
    : modeLabel;
  const brandColors = getBrandColors({
    mode,
    primary: brandColor,
    secondary,
  });
  const placeholderColors = brandColors.getPlaceholder();
  const colors = adaptTokensForDarkMode(getHeroColors(brandColors.primary, brandColors.secondary, brandColors.useDualBrand), isDarkState);
  const sliderColors = adaptTokensForDarkMode(getSliderColors(brandColors.primary, brandColors.secondary, mode), isDarkState);
  const fadeColors = adaptTokensForDarkMode(getFadeColors(brandColors.primary, brandColors.secondary, mode), isDarkState);
  const bentoColors = adaptTokensForDarkMode(getBentoColors(brandColors.primary, brandColors.secondary, mode), isDarkState);
  const conquestColors = adaptTokensForDarkMode(getConquestColors(brandColors.primary, brandColors.secondary, mode), isDarkState);
  const fullscreenColors = adaptTokensForDarkMode(getFullscreenColors(brandColors.primary, brandColors.secondary, mode), isDarkState);
  const splitColors = adaptTokensForDarkMode(getSplitColors(brandColors.primary, brandColors.secondary, mode), isDarkState);
  const parallaxColors = adaptTokensForDarkMode(getParallaxColors(brandColors.primary, brandColors.secondary, mode), isDarkState);
  const isEmblaPreviewStyle = previewStyle === 'slider' || previewStyle === 'bento' || previewStyle === 'fullscreen' || previewStyle === 'conquest' || previewStyle === 'split' || previewStyle === 'parallax' || previewStyle === 'fade' || previewStyle === 'builderCoffee';
  const cornerRadiusClassName = getHeroCornerRadiusClassName(cornerRadius);
  const sectionSpacingClassName = getSectionSpacingClassName(spacing);

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

  const nextSlide = () => {
    if (heroEmblaApi && isEmblaPreviewStyle) {
      heroEmblaApi.scrollNext();
      return;
    }
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  const prevSlide = () => {
    if (heroEmblaApi && isEmblaPreviewStyle) {
      heroEmblaApi.scrollPrev();
      return;
    }
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  const scrollHeroTo = (index: number) => {
    if (heroEmblaApi && isEmblaPreviewStyle) {
      heroEmblaApi.scrollTo(index);
      return;
    }
    setCurrentSlide(index);
  };
  const getSlideKey = (slide: { id?: number | string; image?: string }, index: number) => `${slide.id ?? 'slide'}-${index}-${slide.image ?? ''}`;


  const renderSlideWithBlur = (slide: { image: string; mediaType?: 'image' | 'video' }, idx: number) => {
    if (slide.mediaType === 'video') {
      return (
        <div className="block w-full h-full relative bg-black">
          <HeroPreviewVideo src={slide.image} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className="block w-full h-full relative">
        <div 
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            filter: 'blur(30px)',
          }}
        />
        <div className="absolute inset-0 bg-black/20" />
        <PreviewImage 
          src={slide.image} 
          alt={`Slide ${idx + 1}`}
          className="relative w-full h-full object-contain z-10"
        />
      </div>
    );
  };

  const renderSlideWithContain = (
    slide: { image: string; mediaType?: 'image' | 'video' },
    options?: {
      blur?: number;
      overlay?: React.ReactNode;
      fit?: 'contain' | 'cover';
    }
  ) => {
    if (slide.mediaType === 'video') {
      return (
        <div className="w-full h-full relative bg-black">
          <HeroPreviewVideo
            src={slide.image}
            className={cn(
              "w-full h-full z-10",
              options?.fit === 'cover' ? 'object-cover' : 'object-contain'
            )}
          />
          {options?.overlay}
        </div>
      );
    }
    return (
      <div className="w-full h-full relative">
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            filter: `blur(${options?.blur ?? 25}px)`,
          }}
        />
        <PreviewImage
          src={slide.image}
          alt=""
          className={cn(
            "relative w-full h-full z-10",
            options?.fit === 'cover' ? 'object-cover' : 'object-contain'
          )}
        />
        {options?.overlay}
      </div>
    );
  };

  const renderPlaceholder = (
    idx: number,
    options?: {
      useSliderColors?: boolean;
      backgroundColor?: string;
      iconColor?: string;
      textColor?: string;
    }
  ) => {
    const placeholderBg = options?.backgroundColor ?? (options?.useSliderColors ? sliderColors.placeholderBg : '#f1f5f9');
    const placeholderIconColor = options?.iconColor ?? (options?.useSliderColors ? sliderColors.placeholderIconColor : placeholderColors.icon);
    const placeholderTextColor = options?.textColor ?? '#64748b';
    return (
      <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: placeholderBg }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: placeholderBg }}>
          <ImageIcon size={24} style={{ color: placeholderIconColor }} />
        </div>
        <div className="text-sm font-medium" style={{ color: placeholderTextColor }}>Banner #{idx + 1}</div>
        <div className="text-xs mt-1" style={{ color: placeholderTextColor }}>Khuyến nghị: 1920x600px</div>
      </div>
    );
  };

  const renderSliderStyle = () => (
    <section className={cn("relative w-full overflow-hidden", isDarkState ? "bg-slate-950" : "bg-transparent")}>
      <div
        className={cn(
          "relative w-full overflow-hidden",
          device === 'mobile' ? 'aspect-[21/9] max-h-[200px]' : (device === 'tablet' ? 'aspect-[21/9] max-h-[250px]' : 'aspect-[21/9] max-h-[280px]')
        )}
        ref={heroEmblaRef}
      >
        {slides.length > 0 ? (
          <>
            <div className="flex h-full">
              {slides.map((slide, idx) => (
                <div
                  key={getSlideKey(slide, idx)}
                  className="relative h-full min-w-0 flex-[0_0_100%] hover:ring-2 hover:ring-offset-2 hover:ring-offset-slate-900"
                  style={{ '--tw-ring-color': sliderColors.hoverRingColor } as React.CSSProperties}
                >
                  {slide.image ? renderSlideWithBlur(slide, idx) : renderPlaceholder(idx, { useSliderColors: true })}
                </div>
              ))}
            </div>
            {slides.length > 1 && (
              <>
                {device !== 'mobile' && (
                  <>
                    <button
                      type="button"
                      onClick={prevSlide}
                      disabled={!canScrollPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all z-20 border-2 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        backgroundColor: sliderColors.navButtonBg,
                        borderColor: sliderColors.navButtonBorderColor,
                        boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`,
                      }}
                    >
                      <ChevronLeft size={14} style={{ color: sliderColors.navButtonIconColor }} />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      disabled={!canScrollNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all z-20 border-2 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        backgroundColor: sliderColors.navButtonBgHover,
                        borderColor: sliderColors.navButtonBorderColor,
                        boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`,
                      }}
                    >
                      <ChevronRight size={14} style={{ color: sliderColors.navButtonIconColor }} />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>{  scrollHeroTo(idx); }}
                      className={cn("w-2 h-2 rounded-full transition-all", idx === emblaCurrentSlide ? "w-6" : "")}
                      style={{
                        backgroundColor: idx === emblaCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive,
                      }}
                    />
                  ))}
                </div>
                <div className="absolute bottom-1 left-0 right-0 h-0.5 z-20" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      backgroundColor: sliderColors.progressBarActive,
                      width: `${((emblaCurrentSlide + 1) / slides.length) * 100}%`,
                    }}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800"><span className="text-slate-400 text-sm">Chưa có banner</span></div>
        )}
      </div>
    </section>
  );

  const renderFadeStyle = () => (
    <section className={cn("relative w-full overflow-hidden", isDarkState ? "bg-slate-950" : "bg-transparent")}>
      <div className={cn(
        "relative w-full",
        device === 'mobile' ? 'aspect-[21/9] max-h-[220px]' : (device === 'tablet' ? 'aspect-[21/9] max-h-[270px]' : 'aspect-[21/9] max-h-[300px]')
      )}>
        {slides.length > 0 ? (
          <>
            <div className="flex h-full">
              {slides.map((slide, idx) => (
                <div key={getSlideKey(slide, idx)} className="relative h-full min-w-0 flex-[0_0_100%]">
                  {slide.image ? renderSlideWithBlur(slide, idx) : renderPlaceholder(idx, { backgroundColor: fadeColors.placeholderBg, iconColor: fadeColors.placeholderIconColor })}
                </div>
              ))}
            </div>
            {slides.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent z-20">
                {slides.map((slide, idx) => (
                  <button key={idx} type="button" onClick={() =>{  setCurrentSlide(idx); }}
                    className={cn("rounded overflow-hidden transition-all border-2", idx === currentSlide ? "scale-105" : "border-transparent opacity-70 hover:opacity-100", device === 'mobile' ? 'w-10 h-7' : 'w-14 h-9')}
                    style={idx === currentSlide ? { borderColor: fadeColors.thumbnailBorderActive } : { borderColor: fadeColors.thumbnailBorderInactive }}>
                    {slide.image ? <PreviewImage src={slide.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: fadeColors.placeholderBg }}></div>}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800"><span className="text-slate-400 text-sm">Chưa có banner</span></div>
        )}
      </div>
    </section>
  );

  const renderBuilderCoffeeStyle = () => (
    <section className="relative w-full overflow-hidden bg-white dark:bg-slate-950 pb-[50px]">
      <div className="mx-auto w-full max-w-7xl px-3">
        <div className="mt-5 flex flex-wrap -mx-3">
          <div className="grid w-full max-w-full grid-cols-3 gap-[10px] px-3">
            <div className="col-span-3 overflow-hidden">
              <div className="relative">
                <div
                  className={cn("relative flex w-full select-none items-center overflow-hidden", cornerRadiusClassName)}
                  role="toolbar"
                  ref={heroEmblaRef}
                >
                  {slides.length > 0 ? (
                    <>
                      <div className="flex h-full w-full">
                        {slides.map((slide, idx) => (
                          <div
                            key={getSlideKey(slide, idx)}
                            className="relative h-full min-w-0 flex-[0_0_100%]"
                          >
                            <a href={slide.link || '#'} className="inline-block h-full w-full cursor-pointer text-center">
                              {slide.image ? (
                                slide.mediaType === 'video' ? (
                                  <HeroPreviewVideo src={slide.image} className="h-full w-full object-contain" />
                                ) : (
                                  <div className="relative h-[250px] md:h-[400px] lg:h-[500px] w-full overflow-hidden">
                                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(30px)' }} />
                                    <div className="absolute inset-0 bg-black/10" />
                                    <PreviewImage src={slide.image} alt="Sản phẩm nổi bật" className="relative z-10 mx-auto h-full w-full max-w-full object-contain align-middle" />
                                  </div>
                                )
                              ) : (
                                <div className="h-[250px] md:h-[400px] lg:h-[500px]">
                                  {renderPlaceholder(idx, { backgroundColor: '#f8fafc', iconColor: sliderColors.placeholderIconColor })}
                                </div>
                              )}
                            </a>
                          </div>
                        ))}
                      </div>
                      {slides.length > 1 && (
                        <>
                          <button
                            type="button"
                            aria-label="Previous"
                            onClick={prevSlide}
                            className="absolute -left-0.5 top-1/2 z-20 h-[52px] w-[13px] -translate-y-1/2 overflow-hidden bg-transparent text-transparent md:h-[118px] md:w-[30px]"
                            style={{
                              backgroundImage: 'url("https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/arow-left.png?1778581786863")',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: 'contain',
                            }}
                          >
                            <span className="absolute inset-0 z-30 flex items-center justify-start pl-0.5 text-black md:pl-1">
                              <ChevronLeft className="h-2.5 w-2.5 md:h-4 md:w-4" strokeWidth={2.1} />
                            </span>
                          </button>
                          <button
                            type="button"
                            aria-label="Next"
                            onClick={nextSlide}
                            className="absolute -right-0.5 top-1/2 z-20 h-[52px] w-[13px] -translate-y-1/2 overflow-hidden bg-transparent text-transparent md:h-[118px] md:w-[30px]"
                            style={{
                              backgroundImage: 'url("https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/arow-right.png?1778581786863")',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: 'contain',
                            }}
                          >
                            <span className="absolute inset-0 z-30 flex items-center justify-end pr-0.5 text-black md:pr-1">
                              <ChevronRight className="h-2.5 w-2.5 md:h-4 md:w-4" strokeWidth={2.1} />
                            </span>
                          </button>
                          <div className="absolute bottom-0 left-1/2 z-20 mb-4 flex h-6 w-[100px] -translate-x-1/2 items-center justify-center rounded-[15px]">
                            {slides.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                aria-label={`Đi tới slide ${idx + 1}`}
                                onClick={() =>{  setCurrentSlide(idx); }}
                                className="mx-[3px] h-0.5 w-4 border transition-opacity"
                                style={{
                                  backgroundColor: idx === emblaCurrentSlide ? '#8b7046' : '#cccccc',
                                  borderColor: idx === emblaCurrentSlide ? '#8b7046' : '#cccccc',
                                  opacity: idx === emblaCurrentSlide ? 1 : 0.7,
                                }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex aspect-[16/9] w-full items-center justify-center bg-slate-50 dark:bg-slate-900"><span className="text-sm text-slate-400">Chưa có banner</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderBentoStyle = () => {
    const bentoSlides = slides.slice(0, 4);
    const bentoCurrentSlide = bentoSlides.length > 0 ? currentSlide % bentoSlides.length : 0;
    const placeholderTints = ['#f1f5f9', '#e2e8f0', '#f1f5f9', '#e2e8f0'];
    return (
      <section className={cn("relative w-full overflow-hidden p-2", isDarkState ? "bg-slate-950" : "bg-transparent")}>
        <div className="relative w-full">
          {device === 'mobile' ? (
            <div className="relative aspect-[16/9] overflow-hidden" ref={heroEmblaRef}>
              <div className="flex h-full">
                {bentoSlides.map((slide, idx) => (
                  <div key={getSlideKey(slide, idx)} className={cn("relative h-full min-w-0 flex-[0_0_100%] overflow-hidden", cornerRadiusClassName)}>
                    {slide.image ? (
                      isVideoUrl(slide.image) ? (
                        <HeroPreviewVideo src={slide.image} className="w-full h-full object-cover" />
                      ) : (
                        <PreviewImage src={slide.image} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[idx] ?? '#f1f5f9' }}>
                        <ImageIcon size={20} style={{ color: bentoColors.placeholderIcon }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {bentoSlides.length > 1 && (
                <>
                  <button type="button" aria-label="Ảnh trước" onClick={prevSlide} disabled={!canScrollPrev} className="absolute left-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                    <ChevronLeft size={14} />
                  </button>
                  <button type="button" aria-label="Ảnh tiếp" onClick={nextSlide} disabled={!canScrollNext} className="absolute right-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                    <ChevronRight size={14} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                    {bentoSlides.map((_, idx) => (
                      <button key={idx} type="button" onClick={() =>{  scrollHeroTo(idx); }} className={cn("h-2 rounded-full transition-all", idx === bentoCurrentSlide ? "w-6" : "w-2")} style={{ backgroundColor: idx === bentoCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                    ))}
                  </div>
                  <div className="absolute bottom-1.5 left-0 right-0 z-20 h-0.5" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                    <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((bentoCurrentSlide + 1) / bentoSlides.length) * 100}%` }} />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 aspect-[5/2]">
              <div className={cn("col-span-2 row-span-2 relative overflow-hidden ring-2 ring-offset-1 ring-offset-slate-900", cornerRadiusClassName)} style={{ '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties}>
                {bentoSlides[0]?.image ? (
                  isVideoUrl(bentoSlides[0].image) ? (
                    <HeroPreviewVideo src={bentoSlides[0].image} className="w-full h-full object-cover" />
                  ) : (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[0].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(25px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <PreviewImage src={bentoSlides[0].image} alt="" className="relative w-full h-full object-cover z-10" />
                  </div>
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: placeholderTints[0] }}>
                    <ImageIcon size={28} style={{ color: bentoColors.placeholderIcon }} /><span className="text-xs text-slate-400 mt-1">Banner chính</span>
                  </div>
                )}
              </div>
              <div className={cn("col-span-2 relative overflow-hidden", cornerRadiusClassName)}>
                {bentoSlides[1]?.image ? (
                  isVideoUrl(bentoSlides[1].image) ? (
                    <HeroPreviewVideo src={bentoSlides[1].image} className="w-full h-full object-cover" />
                  ) : (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[1].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(20px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <PreviewImage src={bentoSlides[1].image} alt="" className="relative w-full h-full object-cover z-10" />
                  </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[1] }}>
                    <ImageIcon size={20} style={{ color: bentoColors.placeholderIcon }} />
                  </div>
                )}
              </div>
              <div className={cn("relative overflow-hidden", cornerRadiusClassName)}>
                {bentoSlides[2]?.image ? (
                  isVideoUrl(bentoSlides[2].image) ? (
                    <HeroPreviewVideo src={bentoSlides[2].image} className="w-full h-full object-cover" />
                  ) : (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[2].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <PreviewImage src={bentoSlides[2].image} alt="" className="relative w-full h-full object-cover z-10" />
                  </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[2] }}>
                    <ImageIcon size={16} style={{ color: bentoColors.placeholderIcon }} />
                  </div>
                )}
              </div>
              <div className={cn("relative overflow-hidden", cornerRadiusClassName)}>
                {bentoSlides[3]?.image ? (
                  isVideoUrl(bentoSlides[3].image) ? (
                    <HeroPreviewVideo src={bentoSlides[3].image} className="w-full h-full object-cover" />
                  ) : (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[3].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <PreviewImage src={bentoSlides[3].image} alt="" className="relative w-full h-full object-cover z-10" />
                  </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[3] }}>
                    <ImageIcon size={16} style={{ color: bentoColors.placeholderIcon }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderTripleStyle = () => {
    const tripleSlides = slides.slice(0, 3);
    const placeholderTints = ['#f1f5f9', '#e2e8f0', '#f1f5f9'];
    return (
      <section className={cn("relative w-full overflow-hidden p-2", isDarkState ? "bg-slate-950" : "bg-transparent")}>
        <div className="relative w-full">
          {device === 'mobile' ? (
            <div className="relative aspect-[16/9] overflow-hidden" ref={heroEmblaRef}>
              <div className="flex h-full">
                {tripleSlides.map((slide, idx) => (
                  <div key={getSlideKey(slide, idx)} className={cn("relative h-full min-w-0 flex-[0_0_100%] overflow-hidden", cornerRadiusClassName)}>
                    {slide.image ? (
                      isVideoUrl(slide.image) ? (
                        <HeroPreviewVideo src={slide.image} className="w-full h-full object-cover" />
                      ) : (
                        <PreviewImage src={slide.image} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[idx] ?? '#f1f5f9' }}>
                        <ImageIcon size={20} style={{ color: bentoColors.placeholderIcon }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {tripleSlides.length > 1 && (
                <>
                  <button type="button" aria-label="Ảnh trước" onClick={prevSlide} disabled={!canScrollPrev} className="absolute left-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                    <ChevronLeft size={14} />
                  </button>
                  <button type="button" aria-label="Ảnh tiếp" onClick={nextSlide} disabled={!canScrollNext} className="absolute right-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                    <ChevronRight size={14} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                    {tripleSlides.map((_, idx) => (
                      <button key={idx} type="button" onClick={() =>{  scrollHeroTo(idx); }} className={cn("h-2 rounded-full transition-all", idx === emblaCurrentSlide ? "w-6" : "w-2")} style={{ backgroundColor: idx === emblaCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                    ))}
                  </div>
                  <div className="absolute bottom-1.5 left-0 right-0 z-20 h-0.5" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                    <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((emblaCurrentSlide + 1) / tripleSlides.length) * 100}%` }} />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 aspect-[16/3]">
              {tripleSlides.map((slide, idx) => (
                <div key={getSlideKey(slide, idx)} className={cn("relative overflow-hidden", cornerRadiusClassName, idx === 0 && 'ring-2 ring-offset-1 ring-offset-slate-900')} style={idx === 0 ? { '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties : undefined}>
                  {slide.image ? (
                    isVideoUrl(slide.image) ? (
                      <HeroPreviewVideo src={slide.image} className="w-full h-full object-cover" />
                    ) : (
                    <div className="w-full h-full relative">
                      <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: `blur(${20 - idx * 5}px)` }} />
                      <div className="absolute inset-0 bg-black/20" />
                      <PreviewImage src={slide.image} alt="" className="relative w-full h-full object-cover z-10" />
                    </div>
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: placeholderTints[idx] }}>
                      <ImageIcon size={idx === 0 ? 28 : 20} style={{ color: bentoColors.placeholderIcon }} />
                      {idx === 0 && <span className="text-xs text-slate-400 mt-1">Banner chính</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderTriple2Style = () => {
    const tripleSlides = slides.slice(0, 3);
    const placeholderTints = ['#f1f5f9', '#e2e8f0', '#f1f5f9'];
    return (
      <section className={cn("relative w-full overflow-hidden p-2", isDarkState ? "bg-slate-950" : "bg-transparent")}>
        <div className="relative w-full">
          {device === 'mobile' ? (
            <div className="relative aspect-[16/9] overflow-hidden" ref={heroEmblaRef}>
              <div className="flex h-full">
                {tripleSlides.map((slide, idx) => (
                  <div key={getSlideKey(slide, idx)} className={cn("relative h-full min-w-0 flex-[0_0_100%] overflow-hidden", cornerRadiusClassName)}>
                    {slide.image ? (
                      isVideoUrl(slide.image) ? (
                        <HeroPreviewVideo src={slide.image} className="w-full h-full object-cover" />
                      ) : (
                        <PreviewImage src={slide.image} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[idx] ?? '#f1f5f9' }}>
                        <ImageIcon size={20} style={{ color: bentoColors.placeholderIcon }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {tripleSlides.length > 1 && (
                <>
                  <button type="button" aria-label="Ảnh trước" onClick={prevSlide} disabled={!canScrollPrev} className="absolute left-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                    <ChevronLeft size={14} />
                  </button>
                  <button type="button" aria-label="Ảnh tiếp" onClick={nextSlide} disabled={!canScrollNext} className="absolute right-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                    <ChevronRight size={14} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                    {tripleSlides.map((_, idx) => (
                      <button key={idx} type="button" onClick={() =>{  scrollHeroTo(idx); }} className={cn("h-2 rounded-full transition-all", idx === emblaCurrentSlide ? "w-6" : "w-2")} style={{ backgroundColor: idx === emblaCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                    ))}
                  </div>
                  <div className="absolute bottom-1.5 left-0 right-0 z-20 h-0.5" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                    <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((emblaCurrentSlide + 1) / tripleSlides.length) * 100}%` }} />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 grid-rows-2 gap-2 aspect-[8/3]">
              {/* Ảnh chính: chiếm 2/3 */}
              <div className={cn("col-span-2 row-span-2 relative overflow-hidden ring-2 ring-offset-1 ring-offset-slate-900", cornerRadiusClassName)} style={{ '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties}>
                {tripleSlides[0]?.image ? (
                  isVideoUrl(tripleSlides[0].image) ? (
                    <HeroPreviewVideo src={tripleSlides[0].image} className="w-full h-full object-cover" />
                  ) : (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${tripleSlides[0].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(25px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <PreviewImage src={tripleSlides[0].image} alt="" className="relative w-full h-full object-cover z-10" />
                  </div>
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: placeholderTints[0] }}>
                    <ImageIcon size={28} style={{ color: bentoColors.placeholderIcon }} />
                    <span className="text-xs text-slate-400 mt-1">Banner chính</span>
                  </div>
                )}
              </div>
              {/* 2 ảnh phụ xếp dọc bên phải */}
              {tripleSlides.slice(1, 3).map((slide, idx) => (
                <div key={getSlideKey(slide, idx)} className={cn("relative overflow-hidden", cornerRadiusClassName)}>
                  {slide.image ? (
                    isVideoUrl(slide.image) ? (
                      <HeroPreviewVideo src={slide.image} className="w-full h-full object-cover" />
                    ) : (
                    <div className="w-full h-full relative">
                      <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: `blur(${15 - idx * 5}px)` }} />
                      <div className="absolute inset-0 bg-black/20" />
                      <PreviewImage src={slide.image} alt="" className="relative w-full h-full object-cover z-10" />
                    </div>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[idx + 1] }}>
                      <ImageIcon size={16} style={{ color: bentoColors.placeholderIcon }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderFullscreenStyle = () => {
    const mainSlide = slides[currentSlide] || slides[0];
    const c = content ?? {};
    const primaryHref = c.primaryButtonLink || slides[currentSlide]?.link || '#';
    const secondaryHref = c.secondaryButtonLink || '#';
    const showFullscreenContent = c.showFullscreenContent !== false;
    const primaryButtonBg = c.primaryButtonColor || fullscreenColors.primaryCTA;
    const primaryButtonText = getAPCATextColor(primaryButtonBg, 16, 600);
    const secondaryButtonStyle = c.secondaryButtonColor
      ? {
        backgroundColor: c.secondaryButtonColor,
        borderColor: c.secondaryButtonColor,
        color: getAPCATextColor(c.secondaryButtonColor, 16, 600),
      }
      : { borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff' };
    return (
      <section className={cn("relative w-full overflow-hidden", isDarkState ? "bg-slate-950" : "bg-transparent")}>
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          {slides.length > 0 && mainSlide ? (
            <>
              {device === 'mobile' && !showFullscreenContent ? (
                <div className="absolute inset-0 overflow-hidden" ref={heroEmblaRef}>
                  <div className="flex h-full">
                    {slides.map((slide, idx) => (
                      <div key={getSlideKey(slide, idx)} className="relative h-full min-w-0 flex-[0_0_100%]">
                        {slide.image ? renderSlideWithContain(slide, { fit: 'contain' }) : renderPlaceholder(idx, { backgroundColor: fullscreenColors.placeholderBg, iconColor: fullscreenColors.placeholderIcon })}
                      </div>
                    ))}
                  </div>
                  {slides.length > 1 && (
                    <>
                      <button type="button" aria-label="Ảnh trước" onClick={prevSlide} disabled={!canScrollPrev} className="absolute left-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                        <ChevronLeft size={14} />
                      </button>
                      <button type="button" aria-label="Ảnh tiếp" onClick={nextSlide} disabled={!canScrollNext} className="absolute right-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`, color: sliderColors.navButtonIconColor }}>
                        <ChevronRight size={14} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                        {slides.map((_, idx) => (
                          <button key={idx} type="button" onClick={() =>{  scrollHeroTo(idx); }} className={cn("h-2 rounded-full transition-all", idx === emblaCurrentSlide ? "w-6" : "w-2")} style={{ backgroundColor: idx === emblaCurrentSlide ? fullscreenColors.dotActive : fullscreenColors.dotInactive }} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : slides.map((slide, idx) => (
                <div key={getSlideKey(slide, idx)} className={cn("absolute inset-0 transition-opacity duration-1000", idx === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  {slide.image ? (
                    renderSlideWithContain(slide, {
                      fit: 'contain',
                      overlay: showFullscreenContent ? (
                        <div className="absolute inset-0 z-20" style={{ background: `linear-gradient(to right, rgba(0,0,0,${(c.overlayOpacity ?? 50) / 100}), rgba(0,0,0,${(c.overlayOpacity ?? 50) / 250}), transparent)` }} />
                      ) : null,
                    })
                  ) : renderPlaceholder(idx, { backgroundColor: fullscreenColors.placeholderBg, iconColor: fullscreenColors.placeholderIcon })}
                </div>
              ))}
              {showFullscreenContent && (
                <div className={cn(
                  "absolute inset-0 z-30 flex flex-col justify-center",
                  device === 'mobile' ? 'px-4' : 'px-8 md:px-16',
                  c.textAlign === 'center' && 'items-center text-center',
                  c.textAlign === 'right' && 'items-end text-right'
                )}>
                  <div className={cn("max-w-xl", device === 'mobile' ? 'space-y-3' : 'space-y-4')}>
                    {c.badge && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: fullscreenColors.badgeBg, color: fullscreenColors.badgeText }}>
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: fullscreenColors.badgeDotPulse }} />
                        {c.badge}
                      </div>
                    )}
                    <h1 className={cn("font-bold text-white leading-tight", device === 'mobile' ? 'text-xl' : (device === 'tablet' ? 'text-2xl' : 'text-3xl md:text-4xl'))}>
                      {parseHighlightedHeading(c.heading ?? 'Tiêu đề chính', c.highlightColor)}
                    </h1>
                    {c.description && (
                      <p className={cn("text-white/80", device === 'mobile' ? 'text-sm line-clamp-2' : 'text-base')}>
                        {c.description}
                      </p>
                    )}
                    <div className={cn("flex gap-3", device === 'mobile' ? 'flex-col' : 'flex-row',
                      c.textAlign === 'center' && 'justify-center',
                      c.textAlign === 'right' && 'justify-end'
                    )}>
                      {c.primaryButtonText && (
                        <a href={primaryHref} className={cn("font-medium rounded-lg", device === 'mobile' ? 'px-4 py-2 text-sm' : 'px-6 py-2.5')} style={{ backgroundColor: primaryButtonBg, color: primaryButtonText }}>
                          {c.primaryButtonText}
                        </a>
                      )}
                      {c.secondaryButtonText && (
                        <a href={secondaryHref} className={cn("font-medium rounded-lg border hover:bg-white/10", device === 'mobile' ? 'px-4 py-2 text-sm' : 'px-6 py-2.5')} style={secondaryButtonStyle}>
                          {c.secondaryButtonText}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {showFullscreenContent && slides.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-2 z-40">
                  {slides.map((_, idx) => (
                    <button key={idx} type="button" onClick={() =>{  setCurrentSlide(idx); }} 
                      className={cn("w-2 h-2 rounded-full transition-all", idx === currentSlide ? "w-6" : "")}
                      style={idx === currentSlide ? { backgroundColor: fullscreenColors.dotActive } : { backgroundColor: fullscreenColors.dotInactive }} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <span className="text-slate-400 text-sm">Chưa có banner</span>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderConquestStyle = () => {
    const c = content ?? {};
    const primaryHref = c.primaryButtonLink || slides[currentSlide]?.link || '#';
    const secondaryHref = c.secondaryButtonLink || '#';
    const primaryButtonBg = c.primaryButtonColor || conquestColors.primaryCTA;
    const primaryButtonText = getAPCATextColor(primaryButtonBg, 16, 600);
    const secondaryButtonStyle = c.secondaryButtonColor
      ? {
        backgroundColor: c.secondaryButtonColor,
        borderColor: c.secondaryButtonColor,
        color: getAPCATextColor(c.secondaryButtonColor, 16, 600),
      }
      : {
        backgroundColor: 'transparent',
        borderColor: conquestColors.sectionText,
        color: conquestColors.secondaryCTAText,
      };
    const contentAlignClass = c.textAlign === 'center'
      ? 'items-center text-center'
      : c.textAlign === 'right'
        ? 'items-end text-right'
        : device === 'mobile' ? 'items-center text-center' : 'items-start text-left';
    const buttonAlignClass = c.textAlign === 'center'
      ? 'justify-center'
      : c.textAlign === 'right'
        ? 'justify-end'
        : device === 'mobile' ? 'justify-center' : 'justify-start';

    return (
      <section className="relative w-full overflow-hidden" style={{ backgroundColor: conquestColors.sectionBg, color: conquestColors.sectionText }}>
        <div className={cn(
          "relative mx-auto flex w-full max-w-6xl overflow-hidden px-4",
          device === 'mobile' ? 'min-h-[520px] flex-col pt-8' : 'min-h-[430px] items-stretch justify-between px-6'
        )}>
          <div className={cn(
            "relative z-20 flex flex-col justify-center",
            device === 'mobile' ? 'max-w-full gap-4 pb-4' : 'min-w-[320px] max-w-[470px] gap-5 py-14',
            contentAlignClass
          )}>
            {c.badge && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: conquestColors.badgeBg, color: conquestColors.badgeText }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: conquestColors.accentSolid }} />
                {c.badge}
              </span>
            )}
            <h1 className={cn("font-bold uppercase leading-[1.05]", device === 'mobile' ? 'text-3xl' : 'text-5xl')}>
              {parseHighlightedHeading(c.heading ?? 'Chinh phục tầm cao mới', c.highlightColor || conquestColors.accentSolid)}
            </h1>
            {c.description && (
              <p className={cn("max-w-xl", device === 'mobile' ? 'text-sm' : 'text-lg')} style={{ color: conquestColors.descriptionText }}>
                {c.description}
              </p>
            )}
            <div className={cn("flex gap-3", buttonAlignClass)}>
              {c.primaryButtonText && (
                <a href={primaryHref} className="rounded-full px-6 py-3 text-sm font-semibold shadow-lg" style={{ backgroundColor: primaryButtonBg, color: primaryButtonText }}>
                  {c.primaryButtonText}
                </a>
              )}
              {c.secondaryButtonText && (
                <a href={secondaryHref} className="rounded-full border px-6 py-3 text-sm font-semibold" style={secondaryButtonStyle}>
                  {c.secondaryButtonText}
                </a>
              )}
            </div>
          </div>

          <div className={cn("relative flex flex-1 items-end justify-center", device === 'mobile' ? 'min-h-[250px]' : 'min-h-[430px]')}>
            {device !== 'mobile' && (
              <div className="absolute inset-y-0 right-0 w-full max-w-[560px]" aria-hidden>
                {[0, 1, 2].map((idx) => (
                  <span key={idx} className="absolute top-0 w-12 rounded-b-sm opacity-80" style={{ right: `${70 + idx * 120}px`, height: '62%', backgroundImage: conquestColors.pillarGradient }} />
                ))}
                <span className="absolute bottom-0 right-[300px] h-[35%] w-36 skew-x-[-14deg] opacity-80" style={{ backgroundImage: conquestColors.baseGradient }} />
                <span className="absolute bottom-0 right-[175px] h-[35%] w-28 skew-x-[10deg] opacity-80" style={{ backgroundImage: conquestColors.baseGradient }} />
                <span className="absolute bottom-0 right-8 h-[35%] w-36 skew-x-[14deg] opacity-80" style={{ backgroundImage: conquestColors.baseGradient }} />
              </div>
            )}
            <div className={cn("relative z-10 w-full overflow-hidden", device === 'mobile' ? 'h-[240px]' : 'h-[390px] max-w-[520px]')} ref={heroEmblaRef}>
              <div className="flex h-full">
                {slides.length > 0 ? slides.map((slide, idx) => (
                  <div key={getSlideKey(slide, idx)} className="relative h-full min-w-0 flex-[0_0_100%]">
                    {slide.image ? renderSlideWithContain(slide, { fit: 'contain', blur: 18 }) : renderPlaceholder(idx, { backgroundColor: conquestColors.placeholderBg, iconColor: conquestColors.placeholderIcon })}
                  </div>
                )) : (
                  <div className="relative h-full min-w-0 flex-[0_0_100%]">
                    {renderPlaceholder(0, { backgroundColor: conquestColors.placeholderBg, iconColor: conquestColors.placeholderIcon })}
                  </div>
                )}
              </div>
              {slides.length > 1 && (
                <>
                  <button type="button" aria-label="Ảnh trước" onClick={prevSlide} disabled={!canScrollPrev} className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: conquestColors.primaryCTA, borderColor: conquestColors.sectionText, color: conquestColors.primaryCTAText }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" aria-label="Ảnh tiếp" onClick={nextSlide} disabled={!canScrollNext} className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: conquestColors.primaryCTA, borderColor: conquestColors.sectionText, color: conquestColors.primaryCTAText }}>
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
              {slides.map((_, idx) => (
                <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={cn("h-2 rounded-full transition-all", idx === emblaCurrentSlide ? "w-6" : "w-2")} style={{ backgroundColor: idx === emblaCurrentSlide ? conquestColors.dotActive : conquestColors.dotInactive }} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderSplitStyle = () => {
    const mainSlide = slides[currentSlide] || slides[0];
    const c = content ?? {};
    const primaryHref = c.primaryButtonLink || slides[currentSlide]?.link || '#';
    const primaryButtonBg = c.primaryButtonColor || splitColors.primaryCTA;
    const primaryButtonText = getAPCATextColor(primaryButtonBg, 16, 600);
    return (
      <section className="relative w-full overflow-hidden" style={{ backgroundColor: splitColors.contentBg }}>
        <div className={cn(
          "relative w-full flex",
          device === 'mobile' ? 'flex-col h-auto' : 'flex-row h-[320px]'
        )}>
          {slides.length > 0 && mainSlide ? (
            <>
              <div className={cn(
                "flex flex-col justify-center",
                device === 'mobile' ? 'p-4 order-2' : 'w-1/2 p-8 lg:p-12'
              )} style={{ backgroundColor: splitColors.contentBg }}>
                <div className={cn("space-y-3", device === 'mobile' ? '' : 'max-w-md',
                  c.textAlign === 'center' && 'text-center',
                  c.textAlign === 'right' && 'text-right'
                )}>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: splitColors.badgeBg, color: splitColors.badgeText }}>
                    {c.badge ?? `Banner ${currentSlide + 1}/${slides.length}`}
                  </span>
                  <h2 className={cn("font-bold leading-tight", device === 'mobile' ? 'text-lg' : 'text-2xl lg:text-3xl')} style={{ color: splitColors.headingText }}>
                    {parseHighlightedHeading(c.heading ?? 'Tiêu đề nổi bật', c.highlightColor)}
                  </h2>
                  {c.description && (
                    <p className={cn(device === 'mobile' ? 'text-sm' : 'text-base')} style={{ color: splitColors.descriptionText }}>
                      {c.description}
                    </p>
                  )}
                  {c.primaryButtonText && (
                    <div className={cn("pt-2",
                      c.textAlign === 'center' && 'text-center',
                      c.textAlign === 'right' && 'text-right'
                    )}>
                      <a href={primaryHref} className={cn("font-medium rounded-lg", device === 'mobile' ? 'px-4 py-2 text-sm' : 'px-6 py-2.5')} style={{ backgroundColor: primaryButtonBg, color: primaryButtonText }}>
                        {c.primaryButtonText}
                      </a>
                    </div>
                  )}
                </div>
                {slides.length > 1 && device !== 'mobile' && (
                  <div className="flex gap-2 mt-6">
                    {slides.map((_, idx) => (
                      <button key={idx} type="button" onClick={() =>{  setCurrentSlide(idx); }}
                        className={cn("h-1 rounded-full transition-all", idx === currentSlide ? "w-8" : "w-4")}
                        style={idx === currentSlide ? { backgroundColor: splitColors.progressDotActive } : { backgroundColor: splitColors.progressDotInactive }} />
                    ))}
                  </div>
                )}
              </div>
              <div className={cn(
                "relative overflow-hidden",
                device === 'mobile' ? 'w-full h-[200px] order-1' : 'w-1/2'
              )} ref={heroEmblaRef}>
                <div className="flex h-full">
                  {slides.map((slide, idx) => (
                    <div key={getSlideKey(slide, idx)} className="relative h-full min-w-0 flex-[0_0_100%]">
                      {slide.image ? (
                        isVideoUrl(slide.image) ? (
                          <HeroPreviewVideo src={slide.image} className="w-full h-full object-cover" />
                        ) : (
                          <PreviewImage src={slide.image} alt="" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                          <ImageIcon size={40} className="text-slate-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {slides.length > 1 && (
                  <>
                    <button type="button" onClick={prevSlide} disabled={!canScrollPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10 disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                      <ChevronLeft size={16} style={{ color: splitColors.navButtonIcon }} />
                    </button>
                    <button type="button" onClick={nextSlide} disabled={!canScrollNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10 disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                      <ChevronRight size={16} style={{ color: splitColors.navButtonIcon }} />
                    </button>
                    {device === 'mobile' && (
                      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                        {slides.map((_, idx) => (
                          <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={cn("h-2 rounded-full transition-all", idx === emblaCurrentSlide ? "w-6" : "w-2")} style={{ backgroundColor: idx === emblaCurrentSlide ? splitColors.progressDotActive : splitColors.progressDotInactive }} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <span className="text-slate-400 text-sm">Chưa có banner</span>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderParallaxStyle = () => {
    const mainSlide = slides[currentSlide] || slides[0];
    const c = content ?? {};
    const primaryHref = c.primaryButtonLink || slides[currentSlide]?.link || '#';
    const primaryButtonBg = c.primaryButtonColor || parallaxColors.primaryCTA;
    const primaryButtonText = getAPCATextColor(primaryButtonBg, 14, 600);
    if (device === 'mobile') {
      return (
        <section className="relative w-full overflow-hidden" style={{ backgroundColor: parallaxColors.cardBg }}>
          {slides.length > 0 && mainSlide ? (
            <div className="flex flex-col">
              <div className="relative h-[200px] w-full overflow-hidden" ref={heroEmblaRef}>
                <div className="flex h-full">
                  {slides.map((slide, idx) => (
                    <div key={getSlideKey(slide, idx)} className="relative h-full min-w-0 flex-[0_0_100%]">
                      {slide.image ? (
                        renderSlideWithContain(slide, {
                          overlay: (
                            <div className="absolute inset-0 z-20" style={{ background: `linear-gradient(to top, rgba(0,0,0,${(c.overlayOpacity ?? 50) / 160}), rgba(0,0,0,0))` }} />
                          ),
                        })
                      ) : renderPlaceholder(idx, { backgroundColor: parallaxColors.placeholderBg, iconColor: parallaxColors.placeholderIcon })}
                    </div>
                  ))}
                </div>
                {slides.length > 1 && (
                  <>
                    <button type="button" aria-label="Ảnh trước" onClick={prevSlide} disabled={!canScrollPrev} className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                      <ChevronLeft size={16} style={{ color: parallaxColors.navButtonIcon }} />
                    </button>
                    <button type="button" aria-label="Ảnh tiếp" onClick={nextSlide} disabled={!canScrollNext} className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                      <ChevronRight size={16} style={{ color: parallaxColors.navButtonIcon }} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                      {slides.map((_, idx) => (
                        <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={cn("h-2 rounded-full transition-all", idx === emblaCurrentSlide ? "w-6" : "w-2")} style={{ backgroundColor: idx === emblaCurrentSlide ? parallaxColors.cardBadgeDot : 'rgba(255,255,255,0.55)' }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="p-4" style={{ backgroundColor: parallaxColors.cardBg }}>
                {c.badge && (
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: parallaxColors.cardBadgeDot }} />
                    <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full" style={{ backgroundColor: parallaxColors.cardBadgeBg, color: parallaxColors.cardBadgeText }}>{c.badge}</span>
                  </div>
                )}
                <h3 className="text-base font-bold" style={{ color: parallaxColors.headingText }}>
                  {parseHighlightedHeading(c.heading ?? 'Tiêu đề nổi bật', c.highlightColor)}
                </h3>
                {c.description && <p className="mt-1 text-xs" style={{ color: parallaxColors.descriptionText }}>{c.description}</p>}
                <div className="flex items-center gap-3 mt-3">
                  {c.primaryButtonText && (
                    <a href={primaryHref} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: primaryButtonBg, color: primaryButtonText }}>
                      {c.primaryButtonText}
                    </a>
                  )}
                  {c.countdownText && <span className="text-xs" style={{ color: parallaxColors.countdownText }}>{c.countdownText}</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center bg-slate-800">
              <span className="text-slate-400 text-sm">Chưa có banner</span>
            </div>
          )}
        </section>
      );
    }
    return (
      <section className={cn("relative w-full overflow-hidden", isDarkState ? "bg-slate-950" : "bg-transparent")}>
        <div className={cn(
          "relative w-full",
          device === 'tablet' ? 'h-[320px]' : 'h-[380px]'
        )}>
          {slides.length > 0 && mainSlide ? (
            <>
              {slides.map((slide, idx) => (
                <div key={getSlideKey(slide, idx)} className={cn("absolute inset-0 transition-opacity duration-700", idx === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  {slide.image ? (
                    renderSlideWithContain(slide, {
                      overlay: (
                        <div className="absolute inset-0 z-20" style={{ background: `linear-gradient(to top, rgba(0,0,0,${(c.overlayOpacity ?? 50) / 100}), rgba(0,0,0,${(c.overlayOpacity ?? 50) / 300}), rgba(0,0,0,${(c.overlayOpacity ?? 50) / 500}))` }} />
                      ),
                    })
                  ) : renderPlaceholder(idx, { backgroundColor: parallaxColors.placeholderBg, iconColor: parallaxColors.placeholderIcon })}
                </div>
              ))}
              <div className={cn(
                "absolute z-10 flex items-end",
                'inset-x-6 bottom-6'
              )}>
                <div className={cn(
                  'shadow-2xl',
                  cornerRadiusClassName,
                  'p-5 max-w-lg'
                )} style={{ backgroundColor: parallaxColors.cardBg }}>
                  {c.badge && (
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: parallaxColors.cardBadgeDot }} />
                      <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full" style={{ backgroundColor: parallaxColors.cardBadgeBg, color: parallaxColors.cardBadgeText }}>{c.badge}</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold" style={{ color: parallaxColors.headingText }}>
                    {parseHighlightedHeading(c.heading ?? 'Tiêu đề nổi bật', c.highlightColor)}
                  </h3>
                  {c.description && (
                    <p className="mt-1 text-sm" style={{ color: parallaxColors.descriptionText }}>
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    {c.primaryButtonText && (
                      <a href={primaryHref} className="rounded-lg px-5 py-2 text-sm font-medium" style={{ backgroundColor: primaryButtonBg, color: primaryButtonText }}>
                        {c.primaryButtonText}
                      </a>
                    )}
                    {c.countdownText && (
                      <span className="text-sm" style={{ color: parallaxColors.countdownText }}>{c.countdownText}</span>
                    )}
                  </div>
                </div>
              </div>
              {slides.length > 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  <button type="button" onClick={prevSlide} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                    <ChevronLeft size={16} style={{ color: parallaxColors.navButtonIcon }} />
                  </button>
                  <span className="text-white/80 text-xs font-medium px-2">{currentSlide + 1} / {slides.length}</span>
                  <button type="button" onClick={nextSlide} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                    <ChevronRight size={16} style={{ color: parallaxColors.navButtonIcon }} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <span className="text-slate-400 text-sm">Chưa có banner</span>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <>
      <PreviewWrapper
        title="Preview Hero"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={HERO_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com">
          <div className="relative px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: colors.primarySolid, opacity: 0.6 }} />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colors.primarySolid }}></div>
              <div className="w-20 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            {device !== 'mobile' && <div className="flex gap-4">{[1,2,3,4].map(i => (<div key={i} className="w-12 h-2 bg-slate-100 dark:bg-slate-800 rounded"></div>))}</div>}
          </div>
          <div className={sectionSpacingClassName}>
            {previewStyle === 'slider' && renderSliderStyle()}
            {previewStyle === 'fade' && renderFadeStyle()}
            {previewStyle === 'builderCoffee' && renderBuilderCoffeeStyle()}
            {previewStyle === 'bento' && renderBentoStyle()}
            {previewStyle === 'triple' && renderTripleStyle()}
            {previewStyle === 'triple2' && renderTriple2Style()}
            {previewStyle === 'fullscreen' && renderFullscreenStyle()}
            {previewStyle === 'conquest' && renderConquestStyle()}
            {previewStyle === 'split' && renderSplitStyle()}
            {previewStyle === 'parallax' && renderParallaxStyle()}
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-3">{[1,2,3,4].slice(0, device === 'mobile' ? 2 : 4).map(i => (<div key={i} className="flex-1 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>))}</div>
          </div>
        </BrowserFrame>
      </PreviewWrapper>
      {previewStyle === 'slider' && mode === 'dual' && sliderColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(sliderColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'fade' && mode === 'dual' && fadeColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(fadeColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'bento' && mode === 'dual' && bentoColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(bentoColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'triple' && mode === 'dual' && bentoColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(bentoColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'triple2' && mode === 'dual' && bentoColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(bentoColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'fullscreen' && mode === 'dual' && fullscreenColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(fullscreenColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'split' && mode === 'dual' && splitColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(splitColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'parallax' && mode === 'dual' && parallaxColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(parallaxColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {mode === 'dual' && (
        <ColorInfoPanel brandColor={brandColor} secondary={secondary} compact />
      )}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2">
          <ImageIcon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {previewStyle === 'slider' && (
              <p><strong>1920×600px</strong> (16:5) • Nhiều ảnh, auto slide</p>
            )}
            {previewStyle === 'fade' && (
              <p><strong>1920×600px</strong> (16:5) • Nhiều ảnh, thumbnail navigation</p>
            )}
            {previewStyle === 'builderCoffee' && (
              <p><strong>1500×560px</strong> • Layout Builder Coffee: ảnh contain, bo góc 10px, mũi tên mảnh và dot dạng thanh</p>
            )}
            {previewStyle === 'bento' && (
              <p><strong>Slot 1:</strong> 800×500 • <strong>Slot 2:</strong> 800×250 • <strong>Slot 3-4:</strong> 400×250 • Tối đa 4 ảnh</p>
            )}
            {previewStyle === 'triple' && (
              <p><strong>1920×1080px</strong> (16:9) • 3 ảnh ngang bằng nhau, tỉ lệ 16:9</p>
            )}
            {previewStyle === 'triple2' && (
              <p><strong>Ảnh chính:</strong> 1280×720 (16:9) chiếm 2/3 • <strong>2 ảnh phụ:</strong> 640×360 xếp dọc 1/3</p>
            )}
            {previewStyle === 'fullscreen' && (
              <p><strong>1920×1080px</strong> (16:9) • Subject đặt bên phải (trái có overlay text)</p>
            )}
            {previewStyle === 'split' && (
              <p><strong>960×600px</strong> (8:5) • Ảnh bên phải 50%, subject đặt giữa/trái</p>
            )}
            {previewStyle === 'parallax' && (
              <p><strong>1920×1080px</strong> (16:9) • Để trống góc dưới trái cho card nổi</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
