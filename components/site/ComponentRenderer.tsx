'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { notifyAddToCart, useCart } from '@/lib/cart';
import { useCartConfig } from '@/lib/experiences';
import { ProductCardActions } from '@/components/site/shared/ProductCardActions';
import { QuickAddVariantModal } from '@/components/products/QuickAddVariantModal';
import { getProductsListColors } from '@/components/site/products/colors';
import type { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from './hooks';
import { useSnapshotDemoContext } from '@/components/modules/homepage/SnapshotDemoProvider';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import { cn } from '@/app/admin/components/ui';
import { resolveTypeOverrideColors } from '@/app/admin/home-components/_shared/lib/typeColorOverride';
import { resolveTypeOverrideFont } from '@/app/admin/home-components/_shared/lib/typeFontOverride';
import { getHomeComponentPriceLabel, resolveSaleMode } from '@/app/admin/home-components/_shared/lib/productPrice';
import { getSectionSpacingClassName, normalizeSectionSpacing } from '@/app/admin/home-components/_shared/types/sectionSpacing';
import { getProductImageAspectRatioCssValue, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { buildCategoryPath, buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { parseHighlightedHeading } from '@/lib/utils/heroText';
import {
  getBentoColors,
  getConquestColors,
  getAPCATextColor,
  getFadeColors,
  getFullscreenColors,
  getParallaxColors,
  getSliderColors,
  getSplitColors,
} from '@/app/admin/home-components/hero/_lib/colors';
import {
  getCardsColors,
  getCounterColors,
  getGradientColors,
  getHorizontalColors,
  getIconsColors,
  getMinimalColors,
} from '@/app/admin/home-components/stats/_lib/colors';
import { getCategoryProductsColors } from '@/app/admin/home-components/category-products/_lib/colors';
import { getCategoryProductsCardRadiusClassName, getCategoryProductsImageRadiusClassName, getCategoryProductsResponsiveGridClassName, normalizeCategoryProductsCornerRadius } from '@/app/admin/home-components/category-products/_types';
import { getProductCategoriesColors } from '@/app/admin/home-components/product-categories/_lib/colors';
import { getCTAThemeTokens } from '@/app/admin/home-components/cta/_lib/colors';
import { CTASectionShared } from '@/app/admin/home-components/cta/_components/CTASectionShared';
import { normalizeCTAStyle } from '@/app/admin/home-components/cta/_lib/constants';
import { BenefitsSectionShared } from '@/app/admin/home-components/benefits/_components/BenefitsSectionShared';
import { getBenefitsSectionColors, normalizeBenefitsHarmony, normalizeBenefitsStyle } from '@/app/admin/home-components/benefits/_lib/colors';
import { FaqSectionShared } from '@/app/admin/home-components/faq/_components/FaqSectionShared';
import { getFaqColors } from '@/app/admin/home-components/faq/_lib/colors';
import { getTestimonialsSectionColors } from '@/app/admin/home-components/testimonials/_lib/colors';
import { TestimonialsSectionShared } from '@/app/admin/home-components/testimonials/_components/TestimonialsSectionShared';
import { getTestimonialsSectionSpacingClassName, normalizeTestimonialsCornerRadius, normalizeTestimonialsDesktopColumns, normalizeTestimonialsSpacing, normalizeTestimonialsStyle } from '@/app/admin/home-components/testimonials/_types';
import { getMarqueeSectionColors } from '@/app/admin/home-components/marquee/_lib/colors';
import { MarqueeSectionShared } from '@/app/admin/home-components/marquee/_components/MarqueeSectionShared';
import { normalizeMarqueeCornerRadius, normalizeMarqueeStyle, normalizeMarqueeDirection, normalizeMarqueeSpeed, normalizeMarqueeScale, normalizeMarqueeItem, normalizeMarqueeSpacing } from '@/app/admin/home-components/marquee/_types';
import type { MarqueeBrandMode } from '@/app/admin/home-components/marquee/_types';
import { getGalleryColorTokens, normalizeGalleryHarmony, type GalleryColorTokens } from '@/app/admin/home-components/gallery/_lib/colors';
import type { TrustBadgesStyle } from '@/app/admin/home-components/gallery/_types';
import {
  DEFAULT_STACK_DESCRIPTION,
  DEFAULT_STACK_HEADING,
  DEFAULT_TRUST_CUE_TEXT,
  TRUST_BADGES_A4_ASPECT_CLASS,
  getTrustBadgesMaxVisibleItems,
  TrustBadgesSectionHeader,
  TrustBadgesTrustCue,
  useTrustBadgesSectionState,
} from '@/app/admin/home-components/gallery/_components/TrustBadgesSectionShared';
import { getFooterThemeColors, type FooterLayoutColors } from '@/app/admin/home-components/footer/_lib/colors';
import { getFooterCornerRadiusClassName, getFooterLogoBackgroundClassName, getFooterLogoBackgroundStyle, getFooterLogoSize, getFooterMaxWidthClass, getFooterSectionSpacingClassName } from '@/app/admin/home-components/footer/_lib/constants';
import type { ProcessBrandMode } from '@/app/admin/home-components/process/_types';
import { normalizeProcessConfig, normalizeProcessRenderSteps, normalizeProcessStyle } from '@/app/admin/home-components/process/_lib/normalize';
import { ProcessSectionShared } from '@/app/admin/home-components/process/_components/ProcessSectionShared';
import { FeaturesSectionShared } from '@/app/admin/home-components/features/_components/FeaturesSectionShared';
import { ClientsSectionShared, normalizeClientItems, normalizeClientsStyleSafe } from '@/app/admin/home-components/clients/_components/ClientsSectionShared';
import { getClientsColorTokens } from '@/app/admin/home-components/clients/_lib/colors';
import { getGalleryMarqueeBaseItems } from '@/app/admin/home-components/gallery/_lib/constants';
import { ServicesSectionCore } from './ServicesSectionCore';
import { normalizeServicesCornerRadius, normalizeServicesSpacing, type ServiceItem, type ServiceItemMediaAlign, type ServiceItemMediaPlacement, type ServicesStyle } from '@/app/admin/home-components/services/_types';
import { getServicesDesktopColumns, getServicesMediaAlign, getServicesMediaPlacement } from '@/app/admin/home-components/services/_lib/items';
import { getServicesColors } from '@/app/admin/home-components/services/_lib/colors';
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import type { BenefitsStyle as BenefitsSharedStyle } from '@/app/admin/home-components/benefits/_types';
import { PartnersMarqueeShared } from '@/app/admin/home-components/partners/_components/PartnersMarqueeShared';
import { PartnersBadgeShared } from '@/app/admin/home-components/partners/_components/PartnersBadgeShared';
import { PartnersCarouselShared } from '@/app/admin/home-components/partners/_components/PartnersCarouselShared';
import { PartnersCleanShared } from '@/app/admin/home-components/partners/_components/PartnersCleanShared';
import { PartnersDividerShared } from '@/app/admin/home-components/partners/_components/PartnersDividerShared';
import { PartnersGridShared } from '@/app/admin/home-components/partners/_components/PartnersGridShared';
import { PartnersLogoCloudShared } from '@/app/admin/home-components/partners/_components/PartnersLogoCloudShared';
import { PartnersGlassLogoCloudShared } from '@/app/admin/home-components/partners/_components/PartnersGlassLogoCloudShared';
import { getPartnersSectionSpacingClassName, normalizePartnersAlign, normalizePartnersCornerRadius, normalizePartnersDisplayMode, normalizePartnersLogoColorIntensity, normalizePartnersLogoSize, normalizePartnersShowBorder, normalizePartnersSpacing, normalizePartnersStyle, type PartnersLogoColorMode } from '@/app/admin/home-components/partners/_types';
import type { FooterBrandMode, FooterConfig, FooterCornerRadius, FooterLogoBackgroundStyle, FooterStyle } from '@/app/admin/home-components/footer/_types';
import type { ClientsBrandMode, ClientsHeaderAlign } from '@/app/admin/home-components/clients/_types';
import { normalizeClientsCornerRadius } from '@/app/admin/home-components/clients/_types';
import type { CTAConfig, CTAStyle } from '@/app/admin/home-components/cta/_types';
import type { BenefitItem, BenefitsBrandMode, BenefitsConfig } from '@/app/admin/home-components/benefits/_types';
import type { FaqConfig, FaqItem, FaqStyle } from '@/app/admin/home-components/faq/_types';
import * as LucideIcons from 'lucide-react';
const BlogSection = dynamic(
  () => import('./BlogSection').then((mod) => ({ default: mod.BlogSection })),
  { ssr: false, loading: () => null }
);
const ProductListSection = dynamic(
  () => import('./ProductListSection').then((mod) => ({ default: mod.ProductListSection })),
  { ssr: false, loading: () => null }
);
const ProductGridSection = dynamic(
  () => import('./ProductGridSection').then((mod) => ({ default: mod.ProductGridSection })),
  { ssr: false, loading: () => null }
);
const ServiceListSection = dynamic(
  () => import('./ServiceListSection').then((mod) => ({ default: mod.ServiceListSection })),
  { ssr: false, loading: () => null }
);
import { HomepageCategoryHeroSection } from './HomepageCategoryHeroSection';
import { getHomepageCategoryHeroColors } from '@/app/admin/home-components/homepage-category-hero/_lib/colors';
import { PricingSection as PricingSectionRuntime } from './PricingSection';
import { CareerSection as CareerSectionRuntime } from './CareerSection';
import { VoucherPromotionsSection as VoucherPromotionsSectionRuntime } from './VoucherPromotionsSection';
import { PopupSection as PopupSectionRuntime } from './PopupSection';
import { AboutSection } from './AboutSection';
import { TeamSection as TeamSectionRuntime } from './TeamSection';
import { VideoSectionShared } from '@/app/admin/home-components/video/_components/VideoSectionShared';
import { getVideoColorTokens } from '@/app/admin/home-components/video/_lib/colors';
import {
  normalizeVideoConfig,
  normalizeVideoStyle,
} from '@/app/admin/home-components/video/_lib/constants';
import type { VideoBrandMode } from '@/app/admin/home-components/video/_types';
import { ContactSection as ContactSectionRuntime } from './ContactSection';
import { CaseStudySection } from './CaseStudySection';
import { SpeedDialSection } from './SpeedDialSection';
import { CountdownSectionWrapper } from './CountdownSectionWrapper';
import type { HomepageCategoryHeroConfig } from '@/app/admin/home-components/homepage-category-hero/_types';
import { ProductImageWithOverlay, useProductImageOverlayConfigs } from '@/components/shared/ProductImageWithOverlay';
import {
  ArrowUpRight,
  ArrowRight,
  ChevronLeft, ChevronRight, Globe,
  Image as ImageIcon, LayoutTemplate, Maximize2, Package, Shield,
  X, ZoomIn
} from 'lucide-react';

type SiteImageProps = Omit<React.ComponentProps<typeof Image>, 'width' | 'height' | 'src'> & {
  src?: React.ComponentProps<typeof Image>['src'];
  width?: number | string;
  height?: number | string;
  sizes?: string;
};

const SiteImage = ({ src, alt = '', width = 1200, height = 800, sizes = '100vw', mode = 'primary', ...rest }: SiteImageProps) => {
  if (!src) {return null;}
  const normalizedWidth = typeof width === 'string' ? Number.parseInt(width, 10) || 1200 : width;
  const normalizedHeight = typeof height === 'string' ? Number.parseInt(height, 10) || 800 : height;
  const fetchPriority = rest.priority ? 'high' : rest.fetchPriority;

  return (
    <Image
      src={src}
      {...rest}
      fetchPriority={fetchPriority}
      alt={alt}
      width={normalizedWidth}
      height={normalizedHeight}
      sizes={sizes}
      mode={mode}
    />
  );
};

const DEFAULT_COUNTDOWN_END_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

interface HomeComponent {
  _id: string;
  type: string;
  title: string;
  active: boolean;
  order: number;
  config: Record<string, unknown>;
}

interface ComponentRendererProps {
  component: HomeComponent;
}

export function ComponentRenderer({ component }: ComponentRendererProps) {
  const systemColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const isSnapshotMode = Boolean(useSnapshotDemoContext());
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig, isSnapshotMode ? 'skip' : undefined);
  const { type, title, config } = component;
  const resolvedColors = resolveTypeOverrideColors({
    type,
    systemColors,
    overrides: systemConfig?.typeColorOverrides ?? null,
  });
  const resolvedFont = resolveTypeOverrideFont({
    type,
    overrides: systemConfig?.typeFontOverrides ?? null,
    globalOverride: systemConfig?.globalFontOverride ?? null,
  });

  const fontStyle = { '--font-active': `var(${resolvedFont.fontVariable})` } as React.CSSProperties;
  const wrapWithFont = (node: React.ReactNode) => (
    <div className={cn('font-active', isDark && 'dark')} style={fontStyle}>{node}</div>
  );

  // Render component dựa vào type
  switch (type) {
    case 'Hero': {
      return wrapWithFont(
        <HeroSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} />
      );
    }
    case 'HomepageCategoryHero': {
      const heroTokens = getHomepageCategoryHeroColors(
        resolvedColors.primary,
        resolvedColors.secondary,
        resolvedColors.mode,
      );
      return wrapWithFont(
        <HomepageCategoryHeroSection
          config={config as unknown as HomepageCategoryHeroConfig}
          brandColor={resolvedColors.primary}
          secondary={resolvedColors.secondary}
          mode={resolvedColors.mode}
          tokens={heroTokens}
          isDark={isDark}
        />
      );
    }
    case 'Stats': {
      return wrapWithFont(
        <StatsSection 
          config={config} 
          brandColor={resolvedColors.primary} 
          secondary={resolvedColors.secondary} 
          mode={resolvedColors.mode} 
          title={title} 
          isDark={isDark}
        />
      );
    }
    case 'About': {
      return wrapWithFont(
        <AboutSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Services': {
      return wrapWithFont(
        <ServicesSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Benefits': {
      return wrapWithFont(
        <BenefitsSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'FAQ': {
      return wrapWithFont(
        <FAQSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'CTA': {
      return wrapWithFont(
        <CTASection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} isDark={isDark} />
      );
    }
    case 'Testimonials': {
      return wrapWithFont(
        <TestimonialsSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Contact': {
      return wrapWithFont(
        <ContactSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Gallery':
    case 'Partners': {
      return wrapWithFont(
        <GallerySection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} type={type} isDark={isDark} />
      );
    }
    case 'TrustBadges': {
      return wrapWithFont(
        <TrustBadgesSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Pricing': {
      return wrapWithFont(
        <PricingSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'ProductList': {
      return wrapWithFont(
        <ProductListSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'ProductGrid': {
      const gridStyle = (config.style as string) || '';
      if (gridStyle === 'tabbed' || gridStyle === 'storefront') {
        return wrapWithFont(
          <ProductGridSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
        );
      }
      return wrapWithFont(
        <ProductListSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'ServiceList': {
      return wrapWithFont(
        <ServiceListSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Blog': {
      return wrapWithFont(
        <BlogSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Career': {
      return wrapWithFont(
        <CareerSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'CaseStudy': {
      return wrapWithFont(
        <CaseStudySection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'SpeedDial': {
      return wrapWithFont(
        <SpeedDialSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'ProductCategories': {
      return wrapWithFont(
        <ProductCategoriesSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'CategoryProducts': {
      return wrapWithFont(
        <CategoryProductsSection
          config={config}
          brandColor={resolvedColors.primary}
          secondary={resolvedColors.secondary}
          mode={resolvedColors.mode}
          title={title}
          isDark={isDark}
        />
      );
    }
    case 'Team': {
      return wrapWithFont(
        <TeamSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Features': {
      return wrapWithFont(
        <FeaturesSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Process': {
      return wrapWithFont(
        <ProcessSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Clients': {
      return wrapWithFont(
        <ClientsSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Video': {
      return wrapWithFont(
        <VideoSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Countdown': {
      return wrapWithFont(
        <CountdownSectionWrapper config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} title={title} isDark={isDark} />
      );
    }
    case 'VoucherPromotions': {
      return wrapWithFont(
        <VoucherPromotionsSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Popup': {
      return wrapWithFont(
        <PopupSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} isDark={isDark} />
      );
    }
    case 'Marquee': {
      return wrapWithFont(
        <MarqueeSection
          config={config}
          brandColor={resolvedColors.primary}
          secondary={resolvedColors.secondary}
          mode={resolvedColors.mode}
          title={title}
          fontStyle={fontStyle}
          fontClassName="font-active"
          isDark={isDark}
        />
      );
    }
    case 'Footer': {
      return wrapWithFont(
        <FooterSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} isDark={isDark} />
      );
    }
    default: {
      return wrapWithFont(<PlaceholderSection type={type} title={title} />);
    }
  }
}

// ============ HERO SECTION ============
// Best Practice: Blurred Background Fill - fills letterbox gaps with blurred version of same image
// Supports Hero styles across admin preview and runtime renderer.
type HeroStyle = 'slider' | 'fade' | 'builderCoffee' | 'bento' | 'triple' | 'triple2' | 'fullscreen' | 'conquest' | 'split' | 'parallax';

interface HeroContent {
  badge?: string;
  heading?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  countdownText?: string;
  showFullscreenContent?: boolean;
  highlightColor?: string;
  primaryButtonColor?: string;
  secondaryButtonColor?: string;
}

function HeroSection({
  config,
  brandColor,
  secondary,
  mode,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
}) {
  const slides = (config.slides as { image: string; link: string }[]) || [];
  const style = (config.style as HeroStyle) || 'slider';
  const content = (config.content as HeroContent) || {};
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const primaryHref = content.primaryButtonLink || slides[currentSlide]?.link || '#';
  const secondaryHref = content.secondaryButtonLink || '#';
  const sliderColors = getSliderColors(brandColor, secondary, mode);
  const fadeColors = getFadeColors(brandColor, secondary, mode);
  const bentoColors = getBentoColors(brandColor, secondary, mode);
  const conquestColors = getConquestColors(brandColor, secondary, mode);
  const fullscreenColors = getFullscreenColors(brandColor, secondary, mode);
  const splitColors = getSplitColors(brandColor, secondary, mode);
  const parallaxColors = getParallaxColors(brandColor, secondary, mode);

  const activeSlideCount = style === 'bento'
    ? Math.min(slides.length, 4)
    : (style === 'triple' || style === 'triple2' ? Math.min(slides.length, 3) : slides.length);
  const [heroEmblaRef, heroEmblaApi] = useEmblaCarousel({ align: 'start', loop: activeSlideCount > 1 });
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
    setCurrentSlide(prev => prev === 0 ? activeSlideCount - 1 : prev - 1);
  }, [activeSlideCount, heroEmblaApi]);

  const scrollHeroNext = React.useCallback(() => {
    if (heroEmblaApi) {
      heroEmblaApi.scrollNext();
      return;
    }
    setCurrentSlide(prev => (prev + 1) % activeSlideCount);
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
      setCurrentSlide(prev => (prev + 1) % activeSlideCount);
    }, 5000);
    return () =>{  clearInterval(timer); };
  }, [activeSlideCount, scrollHeroNext, style]);

  if (slides.length === 0) {
    return (
      <section className="relative h-[500px] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Chào mừng đến với chúng tôi</h1>
          <p className="text-slate-300">Khám phá sản phẩm và dịch vụ tuyệt vời</p>
        </div>
      </section>
    );
  }

  // Helper: Render slide với blurred background
  const renderSlideWithBlur = (slide: { image: string; link: string }, options?: { priority?: boolean }) => (
    <a href={slide.link || '#'} className="block w-full h-full relative">
      <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(30px)' }} />
      <div className="absolute inset-0 bg-black/20" />
      <SiteImage src={slide.image} alt="" className="relative w-full h-full object-contain z-10" priority={options?.priority} sizes="100vw" />
    </a>
  );

  const renderPlaceholder = (backgroundColor: string, iconColor: string, size = 32) => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor }}>
      <ImageIcon size={size} style={{ color: iconColor }} />
    </div>
  );

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (activeSlideCount <= 1 || startX == null || endX == null) {
      return;
    }

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 40) {
      return;
    }

    if (deltaX < 0) {
      setCurrentSlide(prev => (prev + 1) % activeSlideCount);
      return;
    }

    setCurrentSlide(prev => prev === 0 ? activeSlideCount - 1 : prev - 1);
  };

  // Style 1: Slider
  if (style === 'slider') {
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[400px] md:max-h-[550px] overflow-hidden" ref={heroEmblaRef}>
          <div className="flex h-full">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className="relative h-full min-w-0 flex-[0_0_100%] hover:ring-2 hover:ring-offset-2 hover:ring-offset-slate-900"
                style={{ '--tw-ring-color': sliderColors.hoverRingColor } as React.CSSProperties}
              >
                {slide.image ? renderSlideWithBlur(slide, { priority: idx === 0 }) : renderPlaceholder(sliderColors.placeholderBg, sliderColors.placeholderIconColor)}
              </div>
            ))}
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
                  <button key={idx} type="button" onClick={() =>{  scrollHeroTo(idx); }} className={`w-3 h-3 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-8' : ''}`} style={{ backgroundColor: idx === emblaCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                ))}
              </div>
              <div className="absolute bottom-2 left-0 right-0 h-0.5 z-20" style={{ backgroundColor: sliderColors.progressBarInactive }}>
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
        </div>
      </section>
    );
  }

  // Style 2: Fade with Thumbnails
  if (style === 'fade') {
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[450px] md:max-h-[600px]">
          {slides.map((slide, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {slide.image ? renderSlideWithBlur(slide, { priority: idx === 0 }) : renderPlaceholder(fadeColors.placeholderBg, fadeColors.placeholderIconColor)}
            </div>
          ))}
          {slides.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent z-20">
              {slides.map((slide, idx) => (
                <button key={idx} onClick={() =>{  setCurrentSlide(idx); }} className={`rounded overflow-hidden transition-all border-2 w-16 h-10 md:w-20 md:h-12 ${idx === currentSlide ? 'scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} style={idx === currentSlide ? { borderColor: fadeColors.thumbnailBorderActive } : { borderColor: fadeColors.thumbnailBorderInactive }}>
                  {slide.image ? <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" /> : renderPlaceholder(fadeColors.placeholderBg, fadeColors.placeholderIconColor, 18)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (style === 'builderCoffee') {
    return (
      <section className="relative w-full overflow-hidden bg-white pb-[50px]">
        <div className="mx-auto w-full max-w-7xl px-3">
          <div className="mt-5 flex flex-wrap -mx-3">
            <div className="grid w-full max-w-full grid-cols-3 gap-[10px] px-3">
              <div className="col-span-3 overflow-hidden">
                <div className="relative">
                  <div
                    className="relative flex w-full touch-pan-y select-none items-center overflow-hidden rounded-[10px] bg-white"
                    role="toolbar"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="relative w-full overflow-hidden">
                      {slides.map((slide, idx) => (
                        <div key={idx} className={`absolute inset-0 text-center transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                          <a href={slide.link || '#'} className="inline h-full w-full cursor-pointer text-center">
                            {slide.image ? (
                              <div className="relative h-full w-full overflow-hidden">
                                <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(30px)' }} />
                                <div className="absolute inset-0 bg-black/10" />
                                <SiteImage src={slide.image} alt="Sản phẩm nổi bật" className="relative z-10 mx-auto h-full w-full max-w-full object-contain align-middle" width={1500} height={560} priority={idx === 0} sizes="100vw" />
                              </div>
                            ) : renderPlaceholder('#f8fafc', sliderColors.placeholderIconColor)}
                          </a>
                        </div>
                      ))}
                      <div className="relative w-full aspect-[16/9]" aria-hidden />
                    </div>
                    {slides.length > 1 && (
                      <>
                        <button type="button" aria-label="Previous" onClick={() =>{  setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1); }} className="absolute -left-0.5 top-1/2 z-20 block h-[52px] w-[13px] -translate-y-1/2 overflow-hidden bg-transparent text-transparent md:h-[118px] md:w-[30px]" style={{ backgroundImage: 'url("https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/arow-left.png?1778581786863")', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' }}>
                          <span className="absolute inset-0 z-30 flex items-center justify-start pl-0.5 text-black md:pl-1">
                            <svg className="h-2.5 w-2.5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M15 19l-7-7 7-7" /></svg>
                          </span>
                        </button>
                        <button type="button" aria-label="Next" onClick={() =>{  setCurrentSlide(prev => (prev + 1) % slides.length); }} className="absolute -right-0.5 top-1/2 z-20 block h-[52px] w-[13px] -translate-y-1/2 overflow-hidden bg-transparent text-transparent md:h-[118px] md:w-[30px]" style={{ backgroundImage: 'url("https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/arow-right.png?1778581786863")', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' }}>
                          <span className="absolute inset-0 z-30 flex items-center justify-end pr-0.5 text-black md:pr-1">
                            <svg className="h-2.5 w-2.5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M9 5l7 7-7 7" /></svg>
                          </span>
                        </button>
                        <div className="absolute bottom-0 left-1/2 z-20 mb-4 flex h-6 w-[100px] -translate-x-1/2 items-center justify-center rounded-[15px]">
                          {slides.map((_, idx) => (
                            <button key={idx} type="button" aria-label={`Đi tới slide ${idx + 1}`} onClick={() =>{  setCurrentSlide(idx); }} className="mx-[3px] h-0.5 w-4 border transition-opacity" style={{ backgroundColor: idx === currentSlide ? '#8b7046' : '#cccccc', borderColor: idx === currentSlide ? '#8b7046' : '#cccccc', opacity: idx === currentSlide ? 1 : 0.7 }} />
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

  // Style 3: Bento Grid
  if (style === 'bento') {
    const bentoSlides = slides.slice(0, 4);
    const bentoCurrentSlide = bentoSlides.length > 0 ? currentSlide % bentoSlides.length : 0;
    const bentoPlaceholders = ['#f1f5f9', '#e2e8f0', '#f1f5f9', '#e2e8f0'];
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden p-2 md:p-4">
        <div className="mx-auto w-full max-w-7xl">
          {/* Mobile: slider-like carousel */}
          <div className="relative aspect-[16/9] max-h-[400px] overflow-hidden md:hidden" ref={heroEmblaRef}>
            <div className="flex h-full">
              {bentoSlides.map((slide, idx) => (
                <a key={idx} href={slide.link || '#'} className="relative h-full min-w-0 flex-[0_0_100%] overflow-hidden rounded-xl">
                  {slide.image ? (
                    <SiteImage src={slide.image} alt="" className="h-full w-full object-cover" priority={idx === 0} sizes="100vw" />
                  ) : (
                    renderPlaceholder(bentoPlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)
                  )}
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
                    <button key={idx} type="button" onClick={() =>{  scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === bentoCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === bentoCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                  ))}
                </div>
                <div className="absolute bottom-2 left-0 right-0 z-20 h-0.5" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                  <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((bentoCurrentSlide + 1) / bentoSlides.length) * 100}%` }} />
                </div>
              </>
            )}
          </div>
          {/* Desktop: Bento layout */}
          <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 aspect-[5/2] max-h-[550px]">
            <a href={bentoSlides[0]?.link || '#'} className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden ring-2 ring-offset-1 ring-offset-slate-900" style={{ '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties}>
              {bentoSlides[0]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[0].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(25px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[0].image} alt="" className="relative w-full h-full object-cover z-10" priority sizes="50vw" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[0], bentoColors.placeholderIcon, 24)}
            </a>
            <a href={bentoSlides[1]?.link || '#'} className="col-span-2 relative rounded-2xl overflow-hidden">
              {bentoSlides[1]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[1].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(20px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[1].image} alt="" className="relative w-full h-full object-cover z-10" sizes="25vw" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[1], bentoColors.placeholderIcon, 22)}
            </a>
            <a href={bentoSlides[2]?.link || '#'} className="relative rounded-2xl overflow-hidden">
              {bentoSlides[2]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[2].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[2].image} alt="" className="relative w-full h-full object-cover z-10" sizes="25vw" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[2], bentoColors.placeholderIcon, 20)}
            </a>
            <a href={bentoSlides[3]?.link || '#'} className="relative rounded-2xl overflow-hidden">
              {bentoSlides[3]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[3].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[3].image} alt="" className="relative w-full h-full object-cover z-10" sizes="25vw" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[3], bentoColors.placeholderIcon, 20)}
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Style: Triple - 3 ảnh 16:9 ngang bằng nhau
  if (style === 'triple') {
    const tripleSlides = slides.slice(0, 3);
    const triplePlaceholders = ['#f1f5f9', '#e2e8f0', '#f1f5f9'];
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden p-2 md:p-4">
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative aspect-[16/9] max-h-[400px] overflow-hidden md:hidden" ref={heroEmblaRef}>
            <div className="flex h-full">
              {tripleSlides.map((slide, idx) => (
                <a key={idx} href={slide.link || '#'} className="relative h-full min-w-0 flex-[0_0_100%] overflow-hidden rounded-xl">
                  {slide.image ? (
                    <SiteImage src={slide.image} alt="" className="h-full w-full object-cover" priority={idx === 0} sizes="100vw" />
                  ) : (
                    renderPlaceholder(triplePlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)
                  )}
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
                    <button key={idx} type="button" onClick={() =>{  scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
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
              <a key={idx} href={slide.link || '#'} className={`relative rounded-2xl overflow-hidden ${idx === 0 ? 'ring-2 ring-offset-1 ring-offset-slate-900' : ''}`} style={idx === 0 ? { '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties : undefined}>
                {slide.image ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: `blur(${25 - idx * 5}px)` }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <SiteImage src={slide.image} alt="" className="relative w-full h-full object-cover z-10" priority={idx === 0} sizes="33vw" />
                  </div>
                ) : renderPlaceholder(triplePlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, idx === 0 ? 24 : 20)}
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Style: Triple 2 - Ảnh chính 2/3, 2 ảnh phụ xếp dọc 1/3
  if (style === 'triple2') {
    const tripleSlides = slides.slice(0, 3);
    const triplePlaceholders = ['#f1f5f9', '#e2e8f0', '#f1f5f9'];
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden p-2 md:p-4">
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative aspect-[16/9] max-h-[400px] overflow-hidden md:hidden" ref={heroEmblaRef}>
            <div className="flex h-full">
              {tripleSlides.map((slide, idx) => (
                <a key={idx} href={slide.link || '#'} className="relative h-full min-w-0 flex-[0_0_100%] overflow-hidden rounded-xl">
                  {slide.image ? (
                    <SiteImage src={slide.image} alt="" className="h-full w-full object-cover" priority={idx === 0} sizes="100vw" />
                  ) : (
                    renderPlaceholder(triplePlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)
                  )}
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
                    <button key={idx} type="button" onClick={() =>{  scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                  ))}
                </div>
                <div className="absolute bottom-2 left-0 right-0 z-20 h-0.5" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                  <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((emblaCurrentSlide + 1) / tripleSlides.length) * 100}%` }} />
                </div>
              </>
            )}
          </div>
          <div className="hidden aspect-[8/3] max-h-[550px] grid-cols-3 grid-rows-2 gap-3 md:grid">
            <a href={tripleSlides[0]?.link || '#'} className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden ring-2 ring-offset-1 ring-offset-slate-900" style={{ '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties}>
              {tripleSlides[0]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${tripleSlides[0].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(25px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={tripleSlides[0].image} alt="" className="relative w-full h-full object-cover z-10" priority sizes="66vw" />
                </div>
              ) : renderPlaceholder(triplePlaceholders[0], bentoColors.placeholderIcon, 24)}
            </a>
            {tripleSlides.slice(1, 3).map((slide, idx) => (
              <a key={idx} href={slide.link || '#'} className="relative rounded-2xl overflow-hidden">
                {slide.image ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: `blur(${20 - idx * 5}px)` }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <SiteImage src={slide.image} alt="" className="relative w-full h-full object-cover z-10" sizes="33vw" />
                  </div>
                ) : renderPlaceholder(triplePlaceholders[idx + 1] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)}
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const renderHeroSlideContain = (
    slide: { image?: string },
    options?: { overlay?: React.ReactNode; blur?: number; fit?: 'contain' | 'cover'; priority?: boolean }
  ) => (
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
      <SiteImage
        src={slide.image ?? ''}
        alt=""
        className={cn(
          'relative w-full h-full z-10',
          options?.fit === 'cover' ? 'object-cover' : 'object-contain'
        )}
        priority={options?.priority}
        sizes="100vw"
      />
      {options?.overlay}
    </div>
  );

  // Style 4: Fullscreen - Hero toàn màn hình với CTA overlay
  if (style === 'fullscreen') {
    const showFullscreenContent = content.showFullscreenContent !== false;
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          {!showFullscreenContent ? (
            <>
              <div className="absolute inset-0 overflow-hidden md:hidden" ref={heroEmblaRef}>
                <div className="flex h-full">
                  {slides.map((slide, idx) => (
                    <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                      {slide.image ? renderHeroSlideContain(slide, { fit: 'contain', priority: idx === 0 }) : renderPlaceholder(fullscreenColors.placeholderBg, fullscreenColors.placeholderIcon)}
                    </div>
                  ))}
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
                {slides.map((slide, idx) => (
                  <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {slide.image ? renderHeroSlideContain(slide, { fit: 'contain', priority: idx === 0 }) : renderPlaceholder(fullscreenColors.placeholderBg, fullscreenColors.placeholderIcon)}
                  </div>
                ))}
              </div>
            </>
          ) : slides.map((slide, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {slide.image ? (
                renderHeroSlideContain(slide, {
                  fit: 'contain',
                  priority: idx === 0,
                  overlay: <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-20" />,
                })
              ) : renderPlaceholder(fullscreenColors.placeholderBg, fullscreenColors.placeholderIcon)}
            </div>
          ))}
          {/* CTA Overlay Content */}
          {showFullscreenContent && (
            <div className="absolute inset-0 z-30 flex flex-col justify-center px-4 md:px-8 lg:px-16">
              <div className="max-w-xl space-y-4 md:space-y-6">
                {content.badge && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: fullscreenColors.badgeBg, color: fullscreenColors.badgeText }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: fullscreenColors.badgeDotPulse }} />
                    {content.badge}
                  </div>
                )}
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {content.heading ?? 'Tiêu đề chính'}
                </h1>
                {content.description && (
                  <p className="text-white/80 text-sm md:text-lg">
                    {content.description}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  {content.primaryButtonText && (
                    <a href={primaryHref} className="px-6 py-3 font-medium rounded-lg text-center" style={{ backgroundColor: fullscreenColors.primaryCTA, color: fullscreenColors.primaryCTAText }}>
                      {content.primaryButtonText}
                    </a>
                  )}
                  {content.secondaryButtonText && (
                    <a href={secondaryHref} className="px-6 py-3 font-medium rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors text-center">
                      {content.secondaryButtonText}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Navigation dots */}
          {showFullscreenContent && slides.length > 1 && (
            <div className="absolute bottom-6 right-6 flex gap-2 z-40">
              {slides.map((_, idx) => (
                <button key={idx} onClick={() =>{  setCurrentSlide(idx); }} className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'w-8' : ''}`} style={{ backgroundColor: idx === currentSlide ? fullscreenColors.dotActive : fullscreenColors.dotInactive }} />
              ))}
            </div>
          )}
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
        color: conquestColors.primaryCTAText,
      }
      : {
        backgroundColor: 'transparent',
        borderColor: conquestColors.sectionText,
        color: conquestColors.secondaryCTAText,
      };

    return (
      <section className="relative w-full overflow-hidden" style={{ backgroundColor: conquestColors.sectionBg, color: conquestColors.sectionText }}>
        <div className="relative mx-auto flex min-h-[520px] w-full max-w-7xl flex-col overflow-hidden px-4 pt-8 md:min-h-[560px] md:flex-row md:items-stretch md:justify-between md:px-8 md:pt-0">
          <div className="relative z-20 flex max-w-full flex-col justify-center gap-4 pb-4 text-center md:min-w-[420px] md:max-w-[540px] md:gap-6 md:py-20 md:text-left">
            {content.badge && (
              <span className="inline-flex w-fit items-center gap-2 self-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide md:self-start" style={{ backgroundColor: conquestColors.badgeBg, color: conquestColors.badgeText }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: conquestColors.accentSolid }} />
                {content.badge}
              </span>
            )}
            <h1 className="text-3xl font-bold uppercase leading-[1.05] md:text-5xl lg:text-6xl">
              {parseHighlightedHeading(content.heading ?? 'Chinh phục tầm cao mới', content.highlightColor || conquestColors.accentSolid)}
            </h1>
            {content.description && (
              <p className="mx-auto max-w-xl text-sm md:mx-0 md:text-lg" style={{ color: conquestColors.descriptionText }}>
                {content.description}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              {content.primaryButtonText && <a href={primaryHref} className="rounded-full px-6 py-3 text-sm font-semibold shadow-lg" style={{ backgroundColor: primaryButtonBg, color: primaryButtonText }}>{content.primaryButtonText}</a>}
              {content.secondaryButtonText && <a href={secondaryHref} className="rounded-full border px-6 py-3 text-sm font-semibold" style={secondaryButtonStyle}>{content.secondaryButtonText}</a>}
            </div>
          </div>
          <div className="relative flex min-h-[270px] flex-1 items-end justify-center md:min-h-[560px]">
            <div className="absolute inset-y-0 right-0 hidden w-full max-w-[640px] md:block" aria-hidden>
              {[0, 1, 2].map((idx) => <span key={idx} className="absolute top-0 w-16 rounded-b-sm opacity-80" style={{ right: `${90 + idx * 150}px`, height: '60%', backgroundImage: conquestColors.pillarGradient }} />)}
              <span className="absolute bottom-0 right-[360px] h-[34%] w-44 skew-x-[-14deg] opacity-80" style={{ backgroundImage: conquestColors.baseGradient }} />
              <span className="absolute bottom-0 right-[205px] h-[34%] w-36 skew-x-[10deg] opacity-80" style={{ backgroundImage: conquestColors.baseGradient }} />
              <span className="absolute bottom-0 right-6 h-[34%] w-44 skew-x-[14deg] opacity-80" style={{ backgroundImage: conquestColors.baseGradient }} />
            </div>
            <div className="relative z-10 h-[260px] w-full overflow-hidden md:h-[500px] md:max-w-[620px]" ref={heroEmblaRef}>
              <div className="flex h-full">
                {slides.map((slide, idx) => (
                  <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                    {slide.image ? renderHeroSlideContain(slide, { fit: 'contain', priority: idx === 0, blur: 18 }) : renderPlaceholder(conquestColors.placeholderBg, conquestColors.placeholderIcon)}
                  </div>
                ))}
              </div>
              {slides.length > 1 && <><button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: conquestColors.primaryCTA, borderColor: conquestColors.sectionText, color: conquestColors.primaryCTAText }}><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button><button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: conquestColors.primaryCTA, borderColor: conquestColors.sectionText, color: conquestColors.primaryCTAText }}><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button></>}
            </div>
          </div>
          {slides.length > 1 && <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">{slides.map((_, idx) => <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? conquestColors.dotActive : conquestColors.dotInactive }} />)}</div>}
        </div>
      </section>
    );
  }

  // Style 5: Split - Layout chia đôi (Content + Image)
  if (style === 'split') {
    return (
      <section className="relative w-full bg-white overflow-hidden">
        <div className="flex flex-col md:flex-row md:h-[450px] lg:h-[550px]">
          {/* Content Side */}
          <div className="w-full md:w-1/2 flex flex-col justify-center bg-slate-50 p-6 md:p-10 lg:p-16 order-2 md:order-1">
            <div className="max-w-md space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: splitColors.badgeBg, color: splitColors.badgeText }}>
                {content.badge ?? `Banner ${currentSlide + 1}/${slides.length}`}
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                {content.heading ?? 'Tiêu đề nổi bật'}
              </h2>
              {content.description && (
                <p className="text-slate-600 text-base md:text-lg">
                  {content.description}
                </p>
              )}
              {content.primaryButtonText && (
                <div className="pt-2">
                  <a href={primaryHref} className="inline-block px-6 py-3 font-medium rounded-lg" style={{ backgroundColor: splitColors.primaryCTA, color: splitColors.primaryCTAText }}>
                    {content.primaryButtonText}
                  </a>
                </div>
              )}
            </div>
            {/* Slide indicators */}
            {slides.length > 1 && (
              <div className="mt-8 hidden gap-2 md:flex">
                {slides.map((_, idx) => (
                  <button key={idx} type="button" onClick={() =>{  setCurrentSlide(idx); }} className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'w-10' : 'w-6'}`} style={{ backgroundColor: idx === currentSlide ? splitColors.progressDotActive : splitColors.progressDotInactive }} />
                ))}
              </div>
            )}
          </div>
          {/* Image Side */}
          <div className="relative order-1 h-[280px] w-full overflow-hidden md:hidden" ref={heroEmblaRef}>
            <div className="flex h-full">
              {slides.map((slide, idx) => (
                <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                  {slide.image ? (
                    <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" priority={idx === 0} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <LayoutTemplate size={48} className="text-slate-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {slides.length > 1 && (
              <>
                <button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                  <svg className="h-4 w-4" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                  <svg className="h-4 w-4" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                  {slides.map((_, idx) => (
                    <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? splitColors.progressDotActive : splitColors.progressDotInactive }} />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="relative order-2 hidden overflow-hidden md:block md:h-full md:w-1/2">
            {slides.map((slide, idx) => (
              <div key={idx} className={`absolute inset-0 transition-all duration-700 ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
                {slide.image ? (
                  <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" priority={idx === 0} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200">
                    <LayoutTemplate size={48} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
            {/* Navigation arrows */}
            {slides.length > 1 && (
              <>
                <button type="button" onClick={() =>{  setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-10" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                  <svg className="w-5 h-5" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" onClick={() =>{  setCurrentSlide(prev => (prev + 1) % slides.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-10" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                  <svg className="w-5 h-5" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Style 6: Parallax - Hiệu ứng layer với floating card
  if (style === 'parallax') {
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="md:hidden" style={{ backgroundColor: parallaxColors.cardBg }}>
          <div className="relative h-[280px] w-full overflow-hidden" ref={heroEmblaRef}>
            <div className="flex h-full">
              {slides.map((slide, idx) => (
                <div key={idx} className="relative h-full min-w-0 flex-[0_0_100%]">
                  {slide.image ? (
                    renderHeroSlideContain(slide, {
                      priority: idx === 0,
                      overlay: (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent z-20" />
                      ),
                    })
                  ) : renderPlaceholder(parallaxColors.placeholderBg, parallaxColors.placeholderIcon)}
                </div>
              ))}
            </div>
            {slides.length > 1 && (
              <>
                <button type="button" aria-label="Ảnh trước" onClick={scrollHeroPrev} disabled={!canScrollPrev} className="absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                  <svg className="h-4 w-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" aria-label="Ảnh tiếp" onClick={scrollHeroNext} disabled={!canScrollNext} className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                  <svg className="h-4 w-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                  {slides.map((_, idx) => (
                    <button key={idx} type="button" onClick={() => { scrollHeroTo(idx); }} className={`h-2 rounded-full transition-all ${idx === emblaCurrentSlide ? 'w-6' : 'w-2'}`} style={{ backgroundColor: idx === emblaCurrentSlide ? parallaxColors.cardBadgeDot : 'rgba(255,255,255,0.55)' }} />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="p-6">
            {content.badge && (
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: parallaxColors.cardBadgeDot }} />
                <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full" style={{ backgroundColor: parallaxColors.cardBadgeBg, color: parallaxColors.cardBadgeText }}>{content.badge}</span>
              </div>
            )}
            <h3 className="text-lg font-bold" style={{ color: parallaxColors.headingText }}>
              {content.heading ?? 'Tiêu đề nổi bật'}
            </h3>
            {content.description && (
              <p className="text-sm mt-1" style={{ color: parallaxColors.descriptionText }}>
                {content.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-4">
              {content.primaryButtonText && (
                <a href={primaryHref} className="px-5 py-2 font-medium rounded-lg text-sm" style={{ backgroundColor: parallaxColors.primaryCTA, color: parallaxColors.primaryCTAText }}>
                  {content.primaryButtonText}
                </a>
              )}
              {content.countdownText && (
                <span className="text-sm" style={{ color: parallaxColors.countdownText }}>{content.countdownText}</span>
              )}
            </div>
          </div>
        </div>
        <div className="relative hidden w-full md:block md:h-[450px] lg:h-[550px]">
          {slides.map((slide, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {slide.image ? (
                renderHeroSlideContain(slide, {
                  priority: idx === 0,
                  overlay: (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-20" />
                  ),
                })
              ) : renderPlaceholder(parallaxColors.placeholderBg, parallaxColors.placeholderIcon)}
            </div>
          ))}
          {/* Floating content card */}
          <div className="absolute z-10 inset-x-4 md:inset-x-8 bottom-4 md:bottom-8 flex items-end">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 md:p-6 max-w-lg">
              {content.badge && (
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: parallaxColors.cardBadgeDot }} />
                  <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full" style={{ backgroundColor: parallaxColors.cardBadgeBg, color: parallaxColors.cardBadgeText }}>{content.badge}</span>
                </div>
              )}
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                {content.heading ?? 'Tiêu đề nổi bật'}
              </h3>
              {content.description && (
                <p className="text-slate-600 text-sm mt-1">
                  {content.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-4">
                {content.primaryButtonText && (
                  <a href={primaryHref} className="px-5 py-2 font-medium rounded-lg text-sm" style={{ backgroundColor: parallaxColors.primaryCTA, color: parallaxColors.primaryCTAText }}>
                    {content.primaryButtonText}
                  </a>
                )}
                {content.countdownText && (
                  <span className="text-slate-500 text-sm">{content.countdownText}</span>
                )}
              </div>
            </div>
          </div>
          {/* Top navigation bar */}
          {slides.length > 1 && (
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button type="button" onClick={() =>{  setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1); }} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                <svg className="w-4 h-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-white/80 text-xs font-medium px-2">{currentSlide + 1} / {slides.length}</span>
              <button type="button" onClick={() =>{  setCurrentSlide(prev => (prev + 1) % slides.length); }} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                <svg className="w-4 h-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}

// ============ STATS SECTION ============
// Professional Stats UI/UX - 6 Variants
type StatsStyle = 'horizontal' | 'cards' | 'icons' | 'gradient' | 'minimal' | 'counter';

interface StatsItemWithIcon {
  value: string;
  label: string;
  iconType?: 'lucide' | 'url' | 'upload';
  iconName?: string;
  iconUrl?: string;
}

const resolveStatsIconComponent = (iconName?: string) => {
  if (!iconName) {return null;}
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>;
  return iconMap[iconName] ?? null;
};

function StatsSection({ config, brandColor, secondary, mode, title: _title, isDark }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string; isDark?: boolean }) {
  void _title;
  const items = (config.items as StatsItemWithIcon[]) || [];
  const style = (config.style as StatsStyle) || 'horizontal';
  const mediaPlacement = (config.mediaPlacement as 'top' | 'left') || 'top';
  const mediaAlign = (config.mediaAlign as 'left' | 'center' | 'right') || 'center';

  // Debug log
  console.log('StatsSection config:', { mediaPlacement, mediaAlign, style, configKeys: Object.keys(config) });

  // Helper for left placement
  const getItemContainerClass = (placement?: 'top' | 'left', align?: 'left' | 'center' | 'right') => {
    if (placement === 'left') {
      return 'flex items-center gap-3 text-left';
    }
    const alignClass = align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center';
    return `flex flex-col ${alignClass}`;
  };

  const getItemAlignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'left') return 'items-start text-left';
    if (align === 'right') return 'items-end text-right';
    return 'items-center text-center';
  };

  const getMediaWrapperClass = (placement?: 'top' | 'left', align?: 'left' | 'center' | 'right') => {
    if (placement === 'left') {
      return 'mb-0 flex shrink-0 items-center justify-center self-center';
    }
    if (align === 'left') return 'flex justify-start';
    if (align === 'right') return 'flex justify-end';
    return 'flex justify-center';
  };

  // Style 1: Thanh ngang - Full width bar với dividers
  if (style === 'horizontal') {
    const colors = adaptTokensForDarkMode(getHorizontalColors(brandColor, secondary, mode), isDark ?? false);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div 
            className="w-full rounded-lg shadow-sm overflow-hidden border"
            style={{ backgroundColor: colors.sectionBg, borderColor: colors.border }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {items.map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveStatsIconComponent(item.iconName) : null;
                const iconElement = item.iconType === 'lucide' && IconCmp ? (
                  <IconCmp size={32} style={{ color: colors.iconColor }} />
                ) : item.iconType === 'upload' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className="w-8 h-8 md:w-11 md:h-11 object-contain" />
                ) : item.iconType === 'url' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className="w-8 h-8 object-contain" />
                ) : null;

                return (
                <div 
                  key={idx} 
                  className={`flex-1 w-full py-6 px-4 justify-center cursor-default ${getItemContainerClass(mediaPlacement, mediaAlign)}`}
                >
                  {iconElement && (
                    <div className={cn(mediaPlacement === 'left' ? 'mb-0' : 'mb-2', getMediaWrapperClass(mediaPlacement, mediaAlign))}>
                      {iconElement}
                    </div>
                  )}
                  <div className={cn("flex flex-col", mediaPlacement === 'left' ? 'flex-1' : getItemAlignClass(mediaAlign))}>
                    <span className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums leading-none mb-1" style={{ color: colors.valueColor }}>
                      {item.value}
                    </span>
                    <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.labelColor }}>
                      {item.label}
                    </h3>
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

  // Style 2: Cards - Grid cards với hover effects và accent line
  if (style === 'cards') {
    const colors = adaptTokensForDarkMode(getCardsColors(brandColor, secondary, mode), isDark ?? false);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, idx) => {
              const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveStatsIconComponent(item.iconName) : null;
              const iconElement = item.iconType === 'lucide' && IconCmp ? (
                <IconCmp size={28} style={{ color: colors.iconColor }} />
              ) : item.iconType === 'upload' && item.iconUrl ? (
                <img src={item.iconUrl} alt="" className="w-12 h-12 md:w-16 md:h-16 object-cover" />
              ) : item.iconType === 'url' && item.iconUrl ? (
                <img src={item.iconUrl} alt="" className="w-7 h-7 object-contain" />
              ) : null;

              return (
              <div 
                key={idx}
                className={`bg-white border rounded-xl p-5 shadow-sm ${getItemContainerClass(mediaPlacement, mediaAlign)}`}
                style={{ borderColor: colors.border }}
              >
                {iconElement && (
                  <div className={cn(mediaPlacement === 'left' ? 'mb-0' : 'mb-2', getMediaWrapperClass(mediaPlacement, mediaAlign))}>
                    {iconElement}
                  </div>
                )}
                <div className={cn("flex flex-col", mediaPlacement === 'left' ? 'flex-1' : getItemAlignClass(mediaAlign))}>
                  <span 
                    className="text-3xl font-bold mb-1 tracking-tight tabular-nums"
                    style={{ color: colors.valueColor }}
                  >
                    {item.value}
                  </span>
                  <h3 className="text-sm font-semibold" style={{ color: colors.labelColor }}>
                    {item.label}
                  </h3>
                  {mediaPlacement !== 'left' && (
                    <div 
                      className="w-8 h-0.5 rounded-full mt-3"
                      style={{ backgroundColor: colors.accent }}
                    />
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Style 3: Icon Grid - Circle containers với shadow và hover scale
  if (style === 'icons') {
    const colors = adaptTokensForDarkMode(getIconsColors(brandColor, secondary, mode), isDark ?? false);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {items.map((item, idx) => {
              const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveStatsIconComponent(item.iconName) : null;
              const hasIcon = item.iconType === 'lucide' || item.iconType === 'url' || item.iconType === 'upload';
              
              const circleElement = (
                <div
                  className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center border shadow-sm shrink-0 ${mediaPlacement === 'left' ? 'mb-0' : 'mb-3'}`}
                  style={{
                    backgroundColor: colors.circleBg,
                    borderColor: colors.ring,
                  }}
                >
                  {item.iconType === 'lucide' && IconCmp ? (
                    <IconCmp size={40} style={{ color: colors.textOnCircle }} />
                  ) : item.iconType === 'upload' && item.iconUrl ? (
                    <img src={item.iconUrl} alt="" className="w-11 h-11 md:w-14 md:h-14 object-contain" />
                  ) : item.iconType === 'url' && item.iconUrl ? (
                    <img src={item.iconUrl} alt="" className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-2xl md:text-3xl font-bold tracking-tight z-10 tabular-nums" style={{ color: colors.textOnCircle }}>
                      {item.value}
                    </span>
                  )}
                </div>
              );

              return (
              <div key={idx} className={getItemContainerClass(mediaPlacement, mediaAlign)}>
                {circleElement}
                <div className={mediaPlacement === 'left' ? 'flex-1' : ''}>
                  <h3 className="text-base font-semibold text-slate-800" style={{ color: colors.label }}>
                    {item.label}
                  </h3>
                  {hasIcon && (
                    <span className="text-xl font-bold tabular-nums mt-1" style={{ color: brandColor }}>
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Style 4: Gradient - Glass morphism với gradient background
  if (style === 'gradient') {
    const colors = adaptTokensForDarkMode(getGradientColors(brandColor, secondary, mode), isDark ?? false);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div 
            className="rounded-2xl overflow-hidden border"
            style={{ 
              background: colors.background,
              borderColor: colors.border
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4">
              {items.map((item, idx) => {
                const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveStatsIconComponent(item.iconName) : null;
                const iconElement = item.iconType === 'lucide' && IconCmp ? (
                  <IconCmp size={36} style={{ color: colors.text }} />
                ) : item.iconType === 'upload' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className="w-10 h-10 md:w-12 md:h-12 object-cover" />
                ) : item.iconType === 'url' && item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className="w-9 h-9 object-contain" />
                ) : null;

                return (
                <div 
                  key={idx}
                  className={`relative justify-center p-6 md:p-8 ${getItemContainerClass(mediaPlacement, mediaAlign)} ${
                    idx !== items.length - 1 ? 'md:border-r md:border-white/10' : ''
                  }`}
                >
                  {iconElement && (
                    <div className={mediaPlacement === 'left' ? 'mb-0 flex shrink-0 items-center justify-center self-center' : 'mb-2'}>
                      {iconElement}
                    </div>
                  )}
                  <div className={mediaPlacement === 'left' ? 'flex-1' : ''}>
                    <span className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums leading-none mb-2" style={{ color: colors.text }}>
                      {item.value}
                    </span>
                    <h3 className="text-sm font-medium opacity-90 relative z-10" style={{ color: colors.label }}>
                      {item.label}
                    </h3>
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

  // Style 5: Minimal - Clean, simple với typography focus
  if (style === 'minimal') {
    const colors = adaptTokensForDarkMode(getMinimalColors(brandColor, secondary, mode), isDark ?? false);
    return (
      <section className="py-12 md:py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {items.map((item, idx) => {
              const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveStatsIconComponent(item.iconName) : null;
              const iconElement = item.iconType === 'lucide' && IconCmp ? (
                <IconCmp size={32} style={{ color: colors.value }} />
              ) : item.iconType === 'upload' && item.iconUrl ? (
                <img src={item.iconUrl} alt="" className="w-9 h-9 md:w-12 md:h-12 object-cover" />
              ) : item.iconType === 'url' && item.iconUrl ? (
                <img src={item.iconUrl} alt="" className="w-8 h-8 object-contain" />
              ) : null;

              return (
              <div key={idx} className={getItemContainerClass(mediaPlacement, mediaAlign)}>
                {iconElement && (
                  <div className={mediaPlacement === 'left' ? 'mb-0 flex shrink-0 items-center justify-center self-center' : 'mb-2'}>
                    {iconElement}
                  </div>
                )}
                <div className={mediaPlacement === 'left' ? 'flex-1' : ''}>
                  {mediaPlacement !== 'left' && (
                    <div 
                      className="w-12 h-1 rounded-full mb-4"
                      style={{ backgroundColor: colors.accent }}
                    />
                  )}
                  <span className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums leading-none" style={{ color: colors.value }}>
                    {item.value}
                  </span>
                  <h3 className="text-base font-medium text-slate-500 mt-2">
                    {item.label}
                  </h3>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Style 6: Counter - Big numbers với animated feel & progress indicator
  const colors = adaptTokensForDarkMode(getCounterColors(brandColor, secondary, mode), isDark ?? false);
  return (
    <section className="py-12 md:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((item, idx) => {
            const IconCmp = item.iconType === 'lucide' && item.iconName ? resolveStatsIconComponent(item.iconName) : null;
            const iconElement = item.iconType === 'lucide' && IconCmp ? (
              <IconCmp size={36} style={{ color: colors.value }} />
            ) : item.iconType === 'upload' && item.iconUrl ? (
              <img src={item.iconUrl} alt="" className="w-9 h-9 md:w-12 md:h-12 object-cover" />
            ) : item.iconType === 'url' && item.iconUrl ? (
              <img src={item.iconUrl} alt="" className="w-9 h-9 object-contain" />
            ) : null;

            return (
            <div 
              key={idx}
              className="relative bg-white rounded-2xl border overflow-hidden shadow-sm"
              style={{ borderColor: colors.border }}
            >
              <div className="h-1 w-full bg-slate-100">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    backgroundColor: colors.progress,
                    width: `${Math.min(100, (idx + 1) * 25)}%`
                  }}
                />
              </div>
              
              <div className={`justify-center p-6 ${getItemContainerClass(mediaPlacement, mediaAlign)}`}>
                {iconElement && (
                  <div className={mediaPlacement === 'left' ? 'mb-0 flex shrink-0 items-center justify-center self-center' : 'mb-2'}>
                    {iconElement}
                  </div>
                )}
                <div className={mediaPlacement === 'left' ? 'flex-1' : ''}>
                  <span 
                    className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums leading-none"
                    style={{ color: colors.value }}
                  >
                    {item.value}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-600 mt-2">
                    {item.label}
                  </h3>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============ SERVICES SECTION ============
function ServicesSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  isDark,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
  isDark?: boolean;
}) {
  const items = (config.items as ServiceItem[]) || [];
  const style = (config.style as ServicesStyle) || 'elegantGrid';
  const desktopColumns = getServicesDesktopColumns(config.desktopColumns);
  const mediaPlacement = getServicesMediaPlacement(config.mediaPlacement);
  const mediaAlign = getServicesMediaAlign(config.mediaAlign);
  const spacing = normalizeServicesSpacing(config.spacing);
  const cornerRadius = normalizeServicesCornerRadius(config.cornerRadius);
  const colors = adaptTokensForDarkMode(getServicesColors(brandColor, secondary, mode), isDark ?? false);

  // Extract header config
  const headerConfig = extractSectionHeaderConfig(config);

  return (
    <section className={cn(getSectionSpacingClassName(spacing), 'px-3')}>
      <div className="mx-auto max-w-7xl">
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
        <ServicesSectionCore
          items={items}
          style={style}
          headerAlign={'left' as ServiceItemMediaAlign}
          desktopColumns={desktopColumns}
          mediaPlacement={mediaPlacement as ServiceItemMediaPlacement}
          mediaAlign={mediaAlign as ServiceItemMediaAlign}
          subtitle={''}
          showTitle={false}
          showSubtitle={false}
          title={''}
          colors={colors}
          spacing="none"
          cornerRadius={cornerRadius}
          isPreview={false}
        />
      </div>
    </section>
  );
}

// ============ BENEFITS SECTION ============
function BenefitsSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  isDark,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
  isDark?: boolean;
}) {
  const benefitsConfig = config as {
    items?: Array<{ icon?: string; title?: string; description?: string }>;
    style?: BenefitsSharedStyle;
    subHeading?: string;
    heading?: string;
    headerAlign?: 'left' | 'center' | 'right';
    gridColumnsDesktop?: 3 | 4;
    gridColumnsMobile?: 1 | 2;
    buttonText?: string;
    buttonLink?: string;
    visualImage?: string;
    highlightIndex?: number;
    showItemNumbers?: boolean;
    showDecorativeVisuals?: boolean;
    harmony?: unknown;
    hideHeader?: boolean;
    showTitle?: boolean;
    showSubtitle?: boolean;
    showBadge?: boolean;
    titleColorPrimary?: boolean;
    subtitleAboveTitle?: boolean;
    uppercaseText?: boolean;
    subtitle?: string;
    badgeText?: string;
  };

  const items: BenefitItem[] = (benefitsConfig.items ?? []).map((item, idx) => ({
    description: item.description ?? '',
    icon: item.icon ?? 'Check',
    id: `benefits-site-${idx}`,
    title: item.title ?? '',
  }));

  const style: BenefitsSharedStyle = normalizeBenefitsStyle(benefitsConfig.style);

  const harmony = normalizeBenefitsHarmony(benefitsConfig.harmony);

  const tokens = adaptTokensForDarkMode(getBenefitsSectionColors({
    harmony,
    mode,
    primary: brandColor,
    secondary,
  }), isDark ?? false);

  const _hasSharedHeaderConfig = (
    typeof benefitsConfig.hideHeader === 'boolean'
    || typeof benefitsConfig.showTitle === 'boolean'
    || typeof benefitsConfig.showSubtitle === 'boolean'
    || typeof benefitsConfig.showBadge === 'boolean'
    || typeof benefitsConfig.titleColorPrimary === 'boolean'
    || typeof benefitsConfig.subtitleAboveTitle === 'boolean'
    || typeof benefitsConfig.uppercaseText === 'boolean'
    || typeof benefitsConfig.subtitle === 'string'
    || typeof benefitsConfig.badgeText === 'string'
  );

  const headerConfig = extractSectionHeaderConfig(config);

  const sectionConfig: Pick<BenefitsConfig, 'subHeading' | 'heading' | 'buttonText' | 'buttonLink' | 'headerAlign' | 'gridColumnsDesktop' | 'gridColumnsMobile' | 'visualImage' | 'highlightIndex' | 'showItemNumbers' | 'showDecorativeVisuals'> = {
    buttonLink: benefitsConfig.buttonLink,
    buttonText: benefitsConfig.buttonText,
    gridColumnsDesktop: benefitsConfig.gridColumnsDesktop,
    gridColumnsMobile: benefitsConfig.gridColumnsMobile,
    heading: benefitsConfig.heading,
    headerAlign: benefitsConfig.headerAlign,
    highlightIndex: benefitsConfig.highlightIndex,
    showDecorativeVisuals: benefitsConfig.showDecorativeVisuals,
    showItemNumbers: benefitsConfig.showItemNumbers,
    subHeading: benefitsConfig.subHeading,
    visualImage: benefitsConfig.visualImage,
  };

  return (
    <section className="py-8 px-3">
      <div className="max-w-7xl mx-auto">
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

        <BenefitsSectionShared
          context="site"
          style={style}
          title={title}
          config={sectionConfig}
          items={items}
          tokens={tokens}
          mode={mode as BenefitsBrandMode}
          skipHeader={true}
        />
      </div>
    </section>
  );
}

// ============ FAQ SECTION ============
function FAQSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  isDark,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
  isDark?: boolean;
}) {
  const faqConfig = config as {
    items?: Array<{ question?: string; answer?: string }>;
    style?: FaqStyle;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
  };

  const items: FaqItem[] = (faqConfig.items ?? []).map((item, idx) => ({
    id: idx,
    question: item.question ?? '',
    answer: item.answer ?? '',
  }));

  const style: FaqStyle = faqConfig.style ?? 'accordion';
  const _sectionConfig: FaqConfig = {
    description: faqConfig.description,
    buttonText: faqConfig.buttonText,
    buttonLink: faqConfig.buttonLink,
  };

  const tokens = adaptTokensForDarkMode(getFaqColors({
    primary: brandColor,
    secondary,
    mode,
    style,
  }), isDark ?? false);

  // Extract header config
  const headerConfig = extractSectionHeaderConfig(config);
  const hasSharedHeader = !headerConfig.hideHeader && (
    (headerConfig.showTitle && title.trim().length > 0)
    || (headerConfig.showSubtitle && (headerConfig.subtitle?.trim().length ?? 0) > 0)
    || (headerConfig.showBadge && (headerConfig.badgeText?.trim().length ?? 0) > 0)
  );

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="py-8 px-3">
        <div className="mx-auto max-w-7xl space-y-6">
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
          <FaqSectionShared
            items={items}
            title={title}
            style={style}
            config={{
              buttonLink: faqConfig.buttonLink,
              buttonText: faqConfig.buttonText,
              description: faqConfig.description,
            }}
            tokens={tokens}
            context="site"
            suppressInternalHeader={hasSharedHeader}
          />
        </div>
      </section>
    </>
  );
}

// ============ CTA SECTION ============
function CTASection({
  config,
  brandColor,
  secondary,
  mode,
  isDark,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  isDark?: boolean;
}) {
  const ctaConfig = config as {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    badge?: string;
    spacing?: CTAConfig['spacing'];
    cornerRadius?: CTAConfig['cornerRadius'];
    noBorderRadius?: boolean;
    noVerticalMargin?: boolean;
    containerWidth?: CTAConfig['containerWidth'];
    style?: CTAStyle;
  };

  const style = normalizeCTAStyle(ctaConfig.style);

  const tokens = getCTAThemeTokens({
    primary: brandColor,
    secondary,
    mode,
    style,
    isDark: isDark ?? false,
  });

  return (
    <CTASectionShared
      config={{
        title: ctaConfig.title ?? '',
        description: ctaConfig.description ?? '',
        buttonText: ctaConfig.buttonText ?? '',
        buttonLink: ctaConfig.buttonLink ?? '',
        secondaryButtonText: ctaConfig.secondaryButtonText ?? '',
        secondaryButtonLink: ctaConfig.secondaryButtonLink ?? '',
        badge: ctaConfig.badge ?? '',
        spacing: ctaConfig.spacing,
        cornerRadius: ctaConfig.cornerRadius,
        noBorderRadius: ctaConfig.noBorderRadius,
        noVerticalMargin: ctaConfig.noVerticalMargin,
        containerWidth: ctaConfig.containerWidth,
      }}
      style={style}
      tokens={tokens}
      context="site"
    />
  );
}

function TestimonialsSection({ config, brandColor, secondary, mode, title, isDark }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string; isDark?: boolean }) {
  const items = Array.isArray(config.items) ? config.items : [];
  const style = normalizeTestimonialsStyle(config.style);
  const desktopColumns = normalizeTestimonialsDesktopColumns(config.desktopColumns);
  const spacing = normalizeTestimonialsSpacing(config.spacing, config.noVerticalMargin);
  const cornerRadius = normalizeTestimonialsCornerRadius(config.cornerRadius, config.noBorderRadius);
  const isFullBleedTestimonials = style === 'split-carousel' || style === 'overlap-carousel';
  const sectionSpacingClassName = getTestimonialsSectionSpacingClassName(spacing);
  const colors = adaptTokensForDarkMode(getTestimonialsSectionColors({
    primary: brandColor,
    secondary,
    mode,
  }), isDark ?? false);

  // Extract header config
  const headerConfig = extractSectionHeaderConfig(config);

  return (
    <section className={cn(isFullBleedTestimonials ? 'py-0' : 'px-3', !isFullBleedTestimonials && sectionSpacingClassName)}>
      <div className={isFullBleedTestimonials ? 'w-full' : 'mx-auto max-w-7xl space-y-6'}>
        {!isFullBleedTestimonials && (
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
        )}
        <TestimonialsSectionShared
          items={items}
          style={style}
          title={title}
          subtitle={headerConfig.subtitle}
          tokens={colors}
          mode={mode}
          context="site"
          hideHeader={!isFullBleedTestimonials || headerConfig.hideHeader}
          showTitle={headerConfig.showTitle}
          showSubtitle={headerConfig.showSubtitle}
          showBadge={headerConfig.showBadge}
          headerAlign={headerConfig.headerAlign}
          titleColorPrimary={headerConfig.titleColorPrimary}
          subtitleAboveTitle={headerConfig.subtitleAboveTitle}
          uppercaseText={headerConfig.uppercaseText}
          badgeText={headerConfig.badgeText}
          desktopColumns={desktopColumns}
          splitBackgroundImage={typeof config.splitBackgroundImage === 'string' ? config.splitBackgroundImage : undefined}
          splitBackgroundOverlayOpacity={typeof config.splitBackgroundOverlayOpacity === 'number' ? config.splitBackgroundOverlayOpacity : undefined}
          spacing={isFullBleedTestimonials ? spacing : 'none'}
          cornerRadius={cornerRadius}
        />
      </div>
    </section>
  );
}

// ============ GALLERY/PARTNERS SECTION ============
// Gallery: 6 Professional Styles (Spotlight, Explore, Stories, Grid, Marquee, Masonry)
// Partners: 6 Professional Styles (Grid, Marquee, Mono, Badge, Carousel, Featured)
type GalleryStyle = 'spotlight' | 'explore' | 'stories' | 'grid' | 'marquee' | 'masonry' | 'mono' | 'badge' | 'carousel' | 'featured' | 'clean' | 'divider';
type GalleryCornerRadius = 'none' | 'sm' | 'lg';
type GalleryDesktopColumns = 3 | 4 | 6;

function normalizeGalleryCornerRadius(value: unknown, noBorderRadius?: unknown): GalleryCornerRadius {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  if (value === 'md' || value === 'full') {
    return 'lg';
  }

  return 'lg';
}

function normalizeGalleryDesktopColumns(value: unknown): GalleryDesktopColumns {
  return value === 3 ? 3 : value === 6 ? 6 : 4;
}

function getGalleryCornerRadiusClassName(value: GalleryCornerRadius): string {
  if (value === 'none') { return 'rounded-none'; }
  if (value === 'sm') { return 'rounded-md'; }
  return 'rounded-2xl';
}

// Auto Scroll Slider Component for Marquee/Mono styles
const _AutoScrollSlider = ({ children, speed = 0.5, isPaused }: { children: React.ReactNode; speed?: number; isPaused?: boolean }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const paused = isPaused ?? isHovered;

  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) {return;}

    let animationId: number;
    let position = scroller.scrollLeft;

    const step = () => {
      if (!paused && scroller) {
        position += speed;
        if (position >= scroller.scrollWidth / 3) {
          position = 0;
        }
        scroller.scrollLeft = position;
      } else if (scroller) {
        position = scroller.scrollLeft;
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () =>{  cancelAnimationFrame(animationId); };
  }, [paused, speed]);

  return (
    <div 
      ref={scrollRef}
      className="flex overflow-x-auto cursor-grab active:cursor-grabbing touch-pan-x"
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      onMouseEnter={() =>{  setIsHovered(true); }}
      onMouseLeave={() =>{  setIsHovered(false); }}
      onTouchStart={() =>{  setIsHovered(true); }}
      onTouchEnd={() =>{  setIsHovered(false); }}
    >
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div className="flex shrink-0 gap-16 items-center px-4">{children}</div>
      <div className="flex shrink-0 gap-16 items-center px-4">{children}</div>
      <div className="flex shrink-0 gap-16 items-center px-4">{children}</div>
    </div>
  );
};

// Lightbox Component for Gallery
const GalleryLightbox = ({
  photo,
  onClose,
  photos,
  currentIndex,
  onNavigate,
  colors,
}: {
  photo: { url: string } | null;
  onClose: () => void;
  photos?: { url: string }[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
  colors: GalleryColorTokens;
}) => {
  const [mounted, setMounted] = React.useState(false);
  const originalBodyOverflowRef = React.useRef<string | null>(null);
  const isOpen = Boolean(photo?.url);
  const [imageKey, setImageKey] = React.useState(0);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update imageKey on index change for transition
  React.useEffect(() => {
    if (typeof currentIndex === 'number') {
      setImageKey(currentIndex);
    }
  }, [currentIndex]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (originalBodyOverflowRef.current === null) {
      originalBodyOverflowRef.current = document.body.style.overflow;
    }
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
      if (e.key === 'ArrowLeft' && onNavigate) {onNavigate('prev');}
      if (e.key === 'ArrowRight' && onNavigate) {onNavigate('next');}
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflowRef.current ?? '';
      originalBodyOverflowRef.current = null;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onNavigate]);

  if (!photo || !photo.url || !mounted) {return null;}

  const hasMultiple = photos && photos.length > 1 && onNavigate;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !onNavigate) {return;}
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    // Only horizontal swipe if dx > 50px and more horizontal than vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      onNavigate(dx < 0 ? 'next' : 'prev');
    }
  };

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 animate-in fade-in duration-300" />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 md:top-5 md:right-5 w-11 h-11 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all z-[10020] hover:scale-110"
        style={{
          backgroundColor: colors.lightboxControlBg,
          borderColor: colors.lightboxControlBorder,
          color: colors.lightboxControlIcon,
        }}
        aria-label="Đóng"
      >
        <X size={22} />
      </button>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
            className="absolute left-2 md:left-5 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all z-[10020] hover:scale-110 active:scale-95"
            style={{
              backgroundColor: colors.lightboxControlBg,
              borderColor: colors.lightboxControlBorder,
              color: colors.lightboxControlIcon,
            }}
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
            className="absolute right-2 md:right-5 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all z-[10020] hover:scale-110 active:scale-95"
            style={{
              backgroundColor: colors.lightboxControlBg,
              borderColor: colors.lightboxControlBorder,
              color: colors.lightboxControlIcon,
            }}
            aria-label="Ảnh sau"
          >
            <ChevronRight size={26} />
          </button>
        </>
      )}

      {/* Counter */}
      {hasMultiple && typeof currentIndex === 'number' && (
        <div
          className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 text-sm z-[10020] px-4 py-1.5 rounded-full border font-medium"
          style={{
            backgroundColor: colors.lightboxCounterBg,
            color: colors.lightboxCounterText,
            borderColor: colors.lightboxControlBorder,
          }}
        >
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Image container — near fullscreen */}
      <div
        className="relative z-[10000] w-full h-full flex items-center justify-center px-14 md:px-20 py-16 md:py-14"
        onClick={e => { e.stopPropagation(); onClose(); }}
      >
        <SiteImage
          key={imageKey}
          src={photo.url}
          alt="Lightbox"
          className="max-h-full max-w-full object-contain animate-in fade-in zoom-in-95 duration-300"
          onClick={e => { e.stopPropagation(); }}
        />
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
};


// ============ TRUST BADGES / CERTIFICATIONS SECTION ============
// 6 Styles: grid, cards, stack, wall, carousel, seal

interface TrustBadgeItem { url: string; link?: string; name?: string }

// Modal Lightbox for viewing certificates
const CertificateModal = ({ 
  item, 
  isOpen, 
  onClose 
}: { 
  item: TrustBadgeItem | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item || !item.url) {return null;}

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 md:top-8 md:right-8 p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all focus:outline-none z-50"
        aria-label="Close modal"
      >
        <X size={32} />
      </button>
      <div 
        className="relative max-w-5xl w-full max-h-[90vh] p-4 flex flex-col items-center justify-center"
        onClick={(e) =>{  e.stopPropagation(); }}
      >
        <div className="relative w-auto h-auto flex flex-col items-center">
          <SiteImage 
            src={item.url} 
            alt={item.name ?? ''} 
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-white p-2 md:p-4 animate-in zoom-in-95 duration-300" 
          />
          {item.name && (
            <p className="mt-4 text-white/90 text-lg md:text-xl font-medium tracking-wide text-center">
              {item.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

function TrustBadgesSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  isDark,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
  isDark?: boolean;
}) {
  const items = (config.items as TrustBadgeItem[]) || [];
  const trustCueText = typeof config.trustCueText === 'string' ? config.trustCueText : DEFAULT_TRUST_CUE_TEXT;
  const stackHeading = typeof config.stackHeading === 'string' ? config.stackHeading : DEFAULT_STACK_HEADING;
  const stackDescription = typeof config.stackDescription === 'string' ? config.stackDescription : DEFAULT_STACK_DESCRIPTION;
  const [selectedCert, setSelectedCert] = React.useState<TrustBadgeItem | null>(null);
  const [carouselRef, carouselApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [cardsRef, cardsApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [sealRef, sealApi] = useEmblaCarousel({ align: 'start', axis: 'y', containScroll: 'trimSnaps' });
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const [canCardsScrollPrev, setCanCardsScrollPrev] = React.useState(false);
  const [canCardsScrollNext, setCanCardsScrollNext] = React.useState(false);
  const [canSealScrollPrev, setCanSealScrollPrev] = React.useState(false);
  const [canSealScrollNext, setCanSealScrollNext] = React.useState(false);
  const headerConfig = extractSectionHeaderConfig(config);
  const {
    cardBorder,
    colors: rawColors,
    innerRadiusClassName,
    radiusClassName,
    renderConfig,
    sectionSpacingClassName,
    siteGridClassName,
  } = useTrustBadgesSectionState({
    brandColor,
    config: { ...headerConfig, cornerRadius: config.cornerRadius, noBorderRadius: config.noBorderRadius, noVerticalMargin: config.noVerticalMargin, showBorder: config.showBorder, stackDescription, stackHeading, trustCueText },
    desktopColumns: config.desktopColumns === 3 ? 3 : 4,
    mode,
    secondary,
    selectedStyle: config.style as TrustBadgesStyle | undefined,
  });
  const colors = React.useMemo(() => adaptTokensForDarkMode(rawColors, isDark ?? false), [rawColors, isDark]);
  const style = renderConfig.style;
  const desktopColumns = renderConfig.desktopColumns;
  const responsiveGridClassName = siteGridClassName;
  const visibleItems = items.slice(0, getTrustBadgesMaxVisibleItems(desktopColumns));

  const updateCarouselState = React.useCallback(() => {
    if (!carouselApi) { return; }
    setCanScrollPrev(carouselApi.canScrollPrev());
    setCanScrollNext(carouselApi.canScrollNext());
  }, [carouselApi]);

  const updateCardsState = React.useCallback(() => {
    if (!cardsApi) { return; }
    setCanCardsScrollPrev(cardsApi.canScrollPrev());
    setCanCardsScrollNext(cardsApi.canScrollNext());
  }, [cardsApi]);

  const updateSealState = React.useCallback(() => {
    if (!sealApi) { return; }
    setCanSealScrollPrev(sealApi.canScrollPrev());
    setCanSealScrollNext(sealApi.canScrollNext());
  }, [sealApi]);

  React.useEffect(() => {
    if (!carouselApi) { return; }
    updateCarouselState();
    carouselApi.on('select', updateCarouselState);
    carouselApi.on('reInit', updateCarouselState);

    return () => {
      carouselApi.off('select', updateCarouselState);
      carouselApi.off('reInit', updateCarouselState);
    };
  }, [carouselApi, updateCarouselState]);

  React.useEffect(() => {
    if (!cardsApi) { return; }
    updateCardsState();
    cardsApi.on('select', updateCardsState);
    cardsApi.on('reInit', updateCardsState);

    return () => {
      cardsApi.off('select', updateCardsState);
      cardsApi.off('reInit', updateCardsState);
    };
  }, [cardsApi, updateCardsState]);

  React.useEffect(() => {
    if (!sealApi) { return; }
    updateSealState();
    sealApi.on('select', updateSealState);
    sealApi.on('reInit', updateSealState);

    return () => {
      sealApi.off('select', updateSealState);
      sealApi.off('reInit', updateSealState);
    };
  }, [sealApi, updateSealState]);

  React.useEffect(() => {
    if (!carouselApi) { return; }
    carouselApi.reInit();
    updateCarouselState();
  }, [carouselApi, items.length, desktopColumns, style, updateCarouselState]);

  React.useEffect(() => {
    if (!cardsApi) { return; }
    cardsApi.reInit();
    updateCardsState();
  }, [cardsApi, items.length, desktopColumns, style, updateCardsState]);

  React.useEffect(() => {
    if (!sealApi) { return; }
    sealApi.reInit();
    updateSealState();
  }, [sealApi, items.length, desktopColumns, style, updateSealState]);

  const sharedHeader = <TrustBadgesSectionHeader brandColor={brandColor} config={headerConfig} fallbackSubtitle={headerConfig.subtitle} title={title} />;

  const renderTrustCue = (compact = false) => (
    <TrustBadgesTrustCue colors={colors} compact={compact} text={trustCueText} />
  );


  // Style 1: Square Grid
  if (style === 'grid') {
    return (
      <section className={cn(sectionSpacingClassName, 'px-3 bg-white')}>
        <div className="mx-auto max-w-7xl">
          {sharedHeader}
          <div className={cn("grid gap-3 md:gap-4", responsiveGridClassName)}>
            {visibleItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => { setSelectedCert(item); }}
                className={cn('group relative flex min-h-[164px] flex-col overflow-hidden cursor-zoom-in transition-all duration-300 hover:-translate-y-0.5', radiusClassName)}
                style={{ border: cardBorder, backgroundColor: colors.neutralSurface, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)' }}
              >
                <div className="absolute left-3 top-3 z-10">{renderTrustCue(true)}</div>
                <div className={cn('flex flex-1 items-center justify-center p-5 pt-10', TRUST_BADGES_A4_ASPECT_CLASS)} style={{ backgroundColor: colors.neutralBackground }}>
                  {item.url ? (
                    <SiteImage src={item.url} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" alt={item.name ?? ''} />
                  ) : (
                    <Shield size={34} style={{ color: colors.subheading }} />
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
        </div>
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() =>{  setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 2: Feature Cards
  if (style === 'cards') {
    return (
      <section className={cn(sectionSpacingClassName, 'px-3 bg-slate-50')}>
        <div className="mx-auto max-w-7xl">
          {sharedHeader}
          <div className="relative">
            {visibleItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => cardsApi?.scrollPrev()}
                  disabled={!canCardsScrollPrev}
                  className={cn('absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-sm transition-opacity', !canCardsScrollPrev && 'cursor-not-allowed opacity-40')}
                  style={{ borderColor: colors.sectionAccentBar, color: colors.heading }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => cardsApi?.scrollNext()}
                  disabled={!canCardsScrollNext}
                  className={cn('absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-2 items-center justify-center rounded-full border bg-white shadow-sm transition-opacity', !canCardsScrollNext && 'cursor-not-allowed opacity-40')}
                  style={{ borderColor: colors.sectionAccentBar, color: colors.heading }}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          <div className="-mx-2 overflow-hidden px-2 pb-2" ref={cardsRef}>
            <div className="flex snap-x gap-4 md:gap-5">
            {visibleItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => { setSelectedCert(item); }}
                className={cn('group relative flex basis-[78%] snap-start flex-col overflow-hidden cursor-zoom-in h-full shrink-0 grow-0 transition-all duration-300 hover:-translate-y-1 md:basis-[31%]', desktopColumns === 4 && 'md:basis-[24%]', radiusClassName)}
                style={{ border: cardBorder, backgroundColor: colors.neutralSurface, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)' }}
              >
                <div className={cn(TRUST_BADGES_A4_ASPECT_CLASS, 'flex items-center justify-center p-5 md:p-6 relative overflow-hidden')} style={{ backgroundColor: colors.neutralBackground }}>
                  <div className="absolute left-4 top-4 z-20">{renderTrustCue(true)}</div>
                  {item.url ? (
                    <SiteImage src={item.url} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 z-10" alt={item.name ?? ''} />
                  ) : (
                    <Shield size={38} style={{ color: colors.subheading }} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <span className="px-4 py-2 rounded-full font-medium flex items-center gap-2 text-sm" style={{ color: colors.subheading, backgroundColor: colors.neutralSurface, border: `1px solid ${colors.sectionAccentBar}` }}>
                      <ZoomIn size={16} /> Xem chi tiết
                    </span>
                  </div>
                </div>
                <div className="py-4 px-5 border-t flex min-h-[58px] items-center justify-between gap-3 transition-colors" style={{ borderColor: colors.neutralBorder, backgroundColor: colors.neutralSurface }}>
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
        </div>
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() => { setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 3: Stack
  if (style === 'stack') {
    const stackItems = visibleItems.filter((item) => item.url || item.name).slice(0, desktopColumns);
    const compactStack = desktopColumns === 4;
    return (
      <section className={cn('overflow-hidden bg-slate-50 px-3', sectionSpacingClassName)}>
        <div className="mx-auto max-w-7xl">
          {sharedHeader}
          <div className={cn('grid items-stretch', compactStack ? 'gap-3 md:grid-cols-[0.46fr_1.9fr]' : 'gap-4 md:grid-cols-[0.82fr_1.35fr]')}>
            <div className={cn('flex h-full flex-col border bg-white shadow-sm', compactStack ? 'p-3' : 'p-4 md:p-5', radiusClassName)} style={{ borderColor: renderConfig.showBorder ? colors.neutralBorder : 'transparent', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)' }}>
              <div className={compactStack ? 'mb-3' : 'mb-4'}>
                {renderTrustCue()}
                <p className={cn('mt-3 font-bold', compactStack ? 'text-sm' : 'text-base')} style={{ color: colors.heading }}>{stackHeading}</p>
                <p className={cn('mt-2 text-xs', compactStack ? 'leading-4' : 'leading-5')} style={{ color: colors.mutedText }}>{stackDescription}</p>
              </div>
              <div className="space-y-2">
                {stackItems.map((item, index) => {
                  const active = index === 0;
                  return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => { setSelectedCert(item); }}
                    className={cn('flex w-full items-center border bg-white text-left transition-all duration-300', compactStack ? 'min-h-10 gap-2 px-2.5 py-2' : 'min-h-12 gap-3 px-3 py-2', innerRadiusClassName)}
                    style={{
                      borderColor: renderConfig.showBorder ? (active ? colors.sectionAccentBar : colors.neutralBorder) : 'transparent',
                      boxShadow: active ? `0 12px 28px ${colors.sectionAccentBar}18` : '0 8px 20px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <span className={cn('shrink-0 font-semibold', compactStack ? 'w-4 text-xs' : 'w-5 text-sm')} style={{ color: active ? colors.sectionAccentBar : colors.subheading }}>{index + 1}</span>
                    <span className={cn('min-w-0 flex-1 font-extrabold uppercase tracking-tight break-words', compactStack ? 'text-xs' : 'text-sm')} style={{ color: colors.heading }}>{item.name ?? `Chứng nhận ${index + 1}`}</span>
                    <ArrowUpRight size={compactStack ? 14 : 17} style={{ color: active ? colors.sectionAccentBar : colors.mutedText }} />
                  </button>
                  );
                })}
              </div>
            </div>
            <div className={cn('grid h-full auto-rows-fr gap-3', desktopColumns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4')}>
              {stackItems.map((item, idx) => (
                <button key={idx} type="button" onClick={() => { setSelectedCert(item); }} className={cn('group flex h-full min-h-0 flex-col overflow-hidden border bg-white p-3 text-center shadow-sm transition-all duration-300 hover:-translate-y-1', radiusClassName)} style={{ borderColor: renderConfig.showBorder ? colors.neutralBorder : 'transparent', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.07)' }}>
                  <div className={cn('mx-auto flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden', innerRadiusClassName)} style={{ backgroundColor: colors.neutralBackground }}>
                    {item.url ? (
                      <SiteImage src={item.url} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]" alt={item.name ?? ''} />
                    ) : (
                      <Shield size={40} style={{ color: colors.subheading }} />
                    )}
                  </div>
                  <p className="mt-3 min-h-9 text-xs font-extrabold uppercase tracking-tight break-words" style={{ color: colors.heading }}>{item.name ?? 'Chứng nhận'}</p>
                  <div className="mx-auto mt-2 h-0.5 w-7 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() => { setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 4: Framed Wall
  if (style === 'wall') {
    return (
      <section className={cn(sectionSpacingClassName, 'px-3')} style={{ backgroundColor: colors.neutralBackground }}>
        <div className="mx-auto max-w-7xl">
          {sharedHeader}
          <div className={cn("grid gap-4 md:gap-5", responsiveGridClassName)}>
            {visibleItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => { setSelectedCert(item); }}
                className={cn('group relative p-2 md:p-3 flex min-h-[170px] md:min-h-[210px] flex-col cursor-zoom-in transition-all duration-300 hover:-translate-y-0.5', radiusClassName)}
                style={{ border: cardBorder, backgroundColor: colors.neutralSurface, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)' }}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
                  {renderTrustCue(true)}
                </div>
                <div className={cn('flex items-center justify-center p-3 relative overflow-hidden', TRUST_BADGES_A4_ASPECT_CLASS, innerRadiusClassName)} style={{ backgroundColor: colors.neutralBackground, border: cardBorder }}>
                  {item.url ? (
                    <SiteImage src={item.url} className="w-full h-full object-contain" alt={item.name ?? ''} />
                  ) : (
                    <Shield size={28} style={{ color: colors.subheading }} />
                  )}
                </div>
                <div className="h-7 md:h-8 flex items-center justify-center mt-1">
                  <span className="text-[10px] md:text-xs font-semibold text-center leading-tight break-words px-1" style={{ color: colors.subheading }}>
                    {item.name ?? 'Chứng nhận'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() => { setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 5: Carousel
  if (style === 'carousel') {
    const showArrowsDesktop = visibleItems.length > 5;

    return (
      <section className={cn(sectionSpacingClassName, 'px-3 bg-white')}>
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            {sharedHeader}
            {showArrowsDesktop && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => carouselApi?.scrollPrev()}
                  disabled={!canScrollPrev}
                  className={cn('w-10 h-10 rounded-full flex items-center justify-center transition-colors', !canScrollPrev && 'cursor-not-allowed opacity-40')}
                  style={{ border: `1px solid ${colors.sectionAccentBar}`, backgroundColor: colors.neutralSurface }}
                >
                  <ChevronLeft size={20} style={{ color: colors.heading }} />
                </button>
                <button
                  type="button"
                  onClick={() => carouselApi?.scrollNext()}
                  disabled={!canScrollNext}
                  className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors', !canScrollNext && 'cursor-not-allowed opacity-40')}
                  style={{ backgroundColor: colors.heading }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-xl">
            <div className="overflow-hidden px-2 py-4" ref={carouselRef}>
              <div className="flex gap-4">
                {visibleItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setSelectedCert(item); }}
                    className={cn('min-w-0 flex-[0_0_140px] group cursor-zoom-in', desktopColumns === 3 ? 'md:flex-[0_0_220px]' : 'md:flex-[0_0_180px]')}
                  >
                    <div
                      className={cn(TRUST_BADGES_A4_ASPECT_CLASS, 'flex items-center justify-center p-4 md:p-5 transition-all duration-300', radiusClassName)}
                      style={{ backgroundColor: colors.neutralBackground, border: cardBorder }}
                    >
                      {item.url ? (
                        <SiteImage src={item.url} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" alt={item.name ?? ''} draggable={false} />
                      ) : (
                        <Shield size={32} style={{ color: colors.subheading }} />
                      )}
                    </div>
                    {item.name && (
                      <p className="text-center text-xs font-semibold leading-tight mt-2 break-words px-1" style={{ color: colors.subheading }}>{item.name}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() =>{  setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 6: Seal
  const sealItems = visibleItems;
  const hubItems = sealItems.slice(0, 3);
  return (
    <section className={cn('relative overflow-hidden bg-slate-50 px-3', sectionSpacingClassName)}>
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/70 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/70 blur-2xl" />
      <div className="mx-auto max-w-7xl">
        {sharedHeader}
        <div className="relative grid items-center gap-6 md:grid-cols-[0.9fr_1.15fr] md:gap-10">
          <div className="relative mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-dashed opacity-60" style={{ borderColor: colors.neutralBorder }} />
            <div className="absolute inset-8 rounded-full border border-dashed opacity-80" style={{ borderColor: colors.neutralBorder }} />
            <div className="absolute inset-20 rounded-full border" style={{ borderColor: colors.sectionAccentBar }} />
            <span className="absolute left-5 top-1/2 h-2 w-2 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
            <span className="absolute right-8 top-1/4 h-2 w-2 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
            <span className="absolute bottom-16 right-14 h-2 w-2 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
            <div className="relative z-10 flex h-44 w-44 flex-col items-center justify-center rounded-full border bg-white text-center shadow-xl" style={{ borderColor: colors.sectionAccentBar }}>
              <Shield size={34} style={{ color: colors.heading }} />
              <span className="mt-4 text-xs font-bold uppercase tracking-[0.28em]" style={{ color: colors.mutedText }}>{trustCueText}</span>
              <div className="mt-3 h-0.5 w-8 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }} />
              <span className="mt-3 text-5xl font-black leading-none" style={{ color: colors.heading }}>{sealItems.length}</span>
            </div>
            {hubItems.map((item, idx) => {
              const positions = [
                'left-1/2 top-0 -translate-x-1/2',
                'right-0 top-[36%]',
                'bottom-2 left-[62%] -translate-x-1/2',
              ];
              return (
                <button key={idx} type="button" onClick={() => { setSelectedCert(item); }} className={cn('absolute z-20 flex h-24 w-16 items-center justify-center border bg-white p-2 shadow-lg', radiusClassName, positions[idx])} style={{ borderColor: colors.neutralBorder }}>
                  {item.url ? (
                    <SiteImage src={item.url} className="h-full w-full object-contain" alt={item.name ?? ''} />
                  ) : (
                    <Shield size={28} style={{ color: colors.subheading }} />
                  )}
                </button>
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
                  className={cn('flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition-opacity', !canSealScrollPrev && 'cursor-not-allowed opacity-40')}
                  style={{ borderColor: colors.sectionAccentBar, color: colors.heading }}
                >
                  <ChevronLeft className="rotate-90" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => sealApi?.scrollNext()}
                  disabled={!canSealScrollNext}
                  className={cn('flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition-opacity', !canSealScrollNext && 'cursor-not-allowed opacity-40')}
                  style={{ borderColor: colors.sectionAccentBar, color: colors.heading }}
                >
                  <ChevronRight className="rotate-90" size={16} />
                </button>
              </div>
            )}
            <div className="h-[360px] overflow-hidden pr-2" ref={sealRef}>
              <div className="flex h-full flex-col gap-4">
                {sealItems.map((item, idx) => (
                  <button key={idx} type="button" onClick={() =>{  setSelectedCert(item); }} className={cn('group flex min-h-24 items-center gap-4 border bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-x-1', radiusClassName)} style={{ borderColor: colors.neutralBorder, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)' }}>
                    <div className={cn('flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden', innerRadiusClassName)} style={{ backgroundColor: colors.neutralBackground }}>
                    {item.url ? (
                      <SiteImage src={item.url} className="h-full w-full object-contain" alt={item.name ?? ''} />
                    ) : (
                      <Shield size={26} style={{ color: colors.subheading }} />
                    )}
                    </div>
                    <div className="h-12 w-px shrink-0" style={{ backgroundColor: colors.neutralBorder }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-extrabold uppercase tracking-tight break-words" style={{ color: colors.heading }}>{item.name ?? 'Chứng nhận'}</p>
                      <p className="text-xs" style={{ color: colors.mutedText }}>Bằng chứng tin cậy #{idx + 1}</p>
                    </div>
                    <ArrowUpRight size={18} style={{ color: colors.heading }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() =>{  setSelectedCert(null); }} />
    </section>
  );
}

function GallerySection({ config, brandColor, secondary, mode, title, type, isDark }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string; type: string; isDark?: boolean }) {
  const items = (config.items as { url: string; link?: string; name?: string }[]) || [];
  const style = type === 'Partners'
    ? normalizePartnersStyle(config.style)
    : ((config.style as GalleryStyle) || 'spotlight');
  const partnersSubheading = type === 'Partners' && typeof (config.subtitle ?? config.subheading) === 'string' ? ((config.subtitle ?? config.subheading) as string) : undefined;
  const partnersAlign = type === 'Partners' ? normalizePartnersAlign(config.align) : 'center';
  const partnersDisplayMode = type === 'Partners' ? normalizePartnersDisplayMode(config.displayMode) : 'withName';
  const partnersCornerRadius = type === 'Partners' ? normalizePartnersCornerRadius(config.cornerRadius) : 'lg';
  const partnersLogoSize = type === 'Partners' ? normalizePartnersLogoSize(config.logoSize) : 'normal';
  const partnersShowBorder = type === 'Partners' ? normalizePartnersShowBorder(config.showBorder) : true;
  const partnersSpacing = type === 'Partners' ? normalizePartnersSpacing(config.spacing) : 'normal';
  const harmony = normalizeGalleryHarmony((config.harmony as string | undefined));
  const [selectedPhoto, setSelectedPhoto] = React.useState<{ id: string; url: string; link?: string; name?: string } | null>(null);
  const [device, setDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isMarqueeInteractionPaused, setIsMarqueeInteractionPaused] = React.useState(false);
  const [marqueeRepeatCount, setMarqueeRepeatCount] = React.useState(2);
  const [marqueeBaseTrackWidth, setMarqueeBaseTrackWidth] = React.useState(0);
  const marqueeScrollRef = React.useRef<HTMLDivElement>(null);
  const marqueeBaseTrackRef = React.useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const colors = adaptTokensForDarkMode(getGalleryColorTokens({ primary: brandColor, secondary, mode, harmony }), isDark ?? false);
  const normalizedItems = items.map((item, idx) => ({ ...item, id: item.url ? `${item.url}-${idx}` : `gallery-${idx}` }));
  const marqueeBaseItems = React.useMemo(() => getGalleryMarqueeBaseItems(normalizedItems), [normalizedItems]);
  const lightboxItems = style === 'marquee' ? marqueeBaseItems : normalizedItems;
  const galleryCornerRadius = normalizeGalleryCornerRadius(config.cornerRadius, config.noBorderRadius);
  const galleryRoundedClass = getGalleryCornerRadiusClassName(galleryCornerRadius);
  const galleryDesktopColumns = normalizeGalleryDesktopColumns(config.desktopColumns);
  const galleryGridColumnsClass = galleryDesktopColumns === 3 ? 'grid-cols-3' : galleryDesktopColumns === 6 ? 'grid-cols-6' : 'grid-cols-4';
  const galleryMasonryColumnsClass = galleryDesktopColumns === 3 ? 'columns-3' : galleryDesktopColumns === 6 ? 'columns-6' : 'columns-4';

  React.useEffect(() => {
    if (style !== 'marquee') {return;}
    const scroller = marqueeScrollRef.current;
    const baseTrack = marqueeBaseTrackRef.current;
    if (!scroller || !baseTrack) {return;}

    const updateMetrics = () => {
      const nextBaseWidth = baseTrack.scrollWidth;
      const viewportWidth = scroller.clientWidth;
      if (nextBaseWidth <= 0 || viewportWidth <= 0) {return;}
      const nextRepeatCount = Math.max(2, Math.ceil(viewportWidth / nextBaseWidth) + 1);
      setMarqueeRepeatCount(nextRepeatCount);
      setMarqueeBaseTrackWidth(nextBaseWidth);
    };

    updateMetrics();
    const cleanupHandlers: Array<() => void> = [];

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateMetrics);
      observer.observe(scroller);
      observer.observe(baseTrack);
      cleanupHandlers.push(() =>{  observer.disconnect(); });
    }

    window.addEventListener('resize', updateMetrics);
    cleanupHandlers.push(() =>{  window.removeEventListener('resize', updateMetrics); });

    return () => {
      cleanupHandlers.forEach((cleanup) =>{  cleanup(); });
    };
  }, [style, marqueeBaseItems]);

  React.useEffect(() => {
    if (style !== 'marquee') {return;}
    const scroller = marqueeScrollRef.current;
    if (!scroller) {return;}

    let animationId = 0;
    let position = scroller.scrollLeft;

    const step = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const resetPoint = Math.min(marqueeBaseTrackWidth, maxScrollLeft);

      if (!isMarqueeInteractionPaused && !prefersReducedMotion && resetPoint > 1 && maxScrollLeft > 1) {
        position += Math.max(0.5, marqueeBaseItems.length * 0.02);
        if (position >= resetPoint) {
          position -= resetPoint;
        }
        scroller.scrollLeft = position;
      } else {
        position = scroller.scrollLeft;
      }

      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () =>{  cancelAnimationFrame(animationId); };
  }, [style, isMarqueeInteractionPaused, prefersReducedMotion, marqueeBaseTrackWidth, marqueeBaseItems.length]);

  React.useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDevice('mobile');
        return;
      }
      if (width < 1024) {
        setDevice('tablet');
        return;
      }
      setDevice('desktop');
    };
    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotion();
    mediaQuery.addEventListener('change', updateMotion);
    return () => {
      mediaQuery.removeEventListener('change', updateMotion);
    };
  }, []);

  const handleLightboxNavigate = (direction: 'prev' | 'next') => {
    if (!selectedPhoto || lightboxItems.length === 0) {return;}
    const currentIdx = lightboxItems.findIndex(item => item.id === selectedPhoto.id);
    if (currentIdx === -1) {return;}
    const nextIdx = direction === 'prev'
      ? (currentIdx - 1 + lightboxItems.length) % lightboxItems.length
      : (currentIdx + 1) % lightboxItems.length;
    setSelectedPhoto(lightboxItems[nextIdx]);
  };

  const currentPhotoIndex = selectedPhoto
    ? lightboxItems.findIndex(item => item.id === selectedPhoto.id)
    : -1;

  // ============ GALLERY STYLES (Spotlight, Explore, Stories) - Only for type === 'Gallery' ============

  const renderGalleryEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colors.placeholderBg }}>
        <ImageIcon size={32} style={{ color: colors.placeholderIcon }} />
      </div>
      <h3 className="font-medium text-slate-900 mb-1">Chưa có hình ảnh nào</h3>
      <p className="text-sm text-slate-500">Thêm ảnh đầu tiên để bắt đầu</p>
    </div>
  );

  const renderSpotlightStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}
    const featured = normalizedItems[0];
    const sub = normalizedItems.slice(1, 4);

    return (
      <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
        <div
          className={cn('relative group cursor-pointer overflow-hidden aspect-[4/3] md:col-span-2 md:aspect-auto md:row-span-1 md:min-h-[300px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', galleryRoundedClass)}
          style={{ backgroundColor: colors.neutralSurface, '--tw-ring-color': colors.focusRing } as React.CSSProperties}
          onClick={() =>{  setSelectedPhoto(featured); }}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(featured); } }}
        >
          {featured.url ? (
            <SiteImage src={featured.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={48} style={{ color: colors.placeholderIcon }} /></div>
          )}
          <div className={cn('absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors', galleryRoundedClass)} />
        </div>
        <div className="grid gap-2 grid-cols-3 md:grid-cols-1">
          {sub.map((photo) => (
            <div
              key={photo.id}
              className={cn('aspect-square relative group cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', galleryRoundedClass)}
              style={{ backgroundColor: colors.neutralSurface, '--tw-ring-color': colors.focusRing } as React.CSSProperties}
              onClick={() =>{  setSelectedPhoto(photo); }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
            >
              {photo.url ? (
                <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={24} style={{ color: colors.placeholderIcon }} /></div>
              )}
              <div className={cn('absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors', galleryRoundedClass)} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExploreStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}

    return (
      <div className={cn('grid gap-3 grid-cols-2 md:grid-cols-3', galleryDesktopColumns === 3 ? 'lg:grid-cols-3' : galleryDesktopColumns === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-4')}>
        {normalizedItems.map((photo) => (
          <div
            key={photo.id}
            className={cn('aspect-square relative group cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', galleryRoundedClass)}
            style={{ backgroundColor: colors.neutralSurface, '--tw-ring-color': colors.focusRing } as React.CSSProperties}
            onClick={() =>{  setSelectedPhoto(photo); }}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
          >
            {photo.url ? (
              <SiteImage
                src={photo.url}
                alt=""
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-95"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={24} style={{ color: colors.placeholderIcon }} /></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStoriesStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}

    return (
      <div
        className="grid gap-2 grid-cols-3 auto-rows-[110px] sm:auto-rows-[250px] md:grid-cols-3 md:auto-rows-[300px]"
      >
        {normalizedItems.map((photo, i) => {
          const isLarge = i % 4 === 0 || i % 4 === 3;
          const colSpan = isLarge ? 'col-span-2 md:col-span-2' : 'col-span-1 md:col-span-1';

          return (
            <div
              key={photo.id}
              className={cn(`${colSpan} relative group cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`, galleryRoundedClass)}
              style={{ backgroundColor: colors.neutralSurface, '--tw-ring-color': colors.focusRing } as React.CSSProperties}
              onClick={() =>{  setSelectedPhoto(photo); }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
            >
              {photo.url ? (
                <SiteImage
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                  <ImageIcon size={32} style={{ color: colors.placeholderIcon }} />
                </div>
              )}
              <div className={cn('absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors', galleryRoundedClass)} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderGalleryGridStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}

    const maxVisible = device === 'mobile' ? 6 : (device === 'tablet' ? 9 : 12);
    const visibleItems = normalizedItems.slice(0, maxVisible);

    if (normalizedItems.length <= 2) {
      return (
        <div className="px-4 pt-4 pb-8">
          <div className={cn('mx-auto flex items-center justify-center gap-3', normalizedItems.length === 1 ? 'max-w-sm' : 'max-w-xl')}>
            {normalizedItems.map((photo) => (
              <div
                key={photo.id}
                className={cn('flex-1 aspect-square overflow-hidden cursor-pointer group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', galleryRoundedClass)}
                style={{ backgroundColor: colors.neutralSurface, '--tw-ring-color': colors.focusRing } as React.CSSProperties}
                onClick={() =>{  setSelectedPhoto(photo); }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
              >
                {photo.url ? (
                  <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={40} style={{ color: colors.placeholderIcon }} /></div>
                )}
                <div className={cn('absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors', galleryRoundedClass)} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 pt-4 pb-8">
        <div className={cn(
          'grid gap-3',
          device === 'mobile' ? 'grid-cols-2' : (device === 'tablet' ? 'grid-cols-3' : galleryGridColumnsClass),
        )}>
          {visibleItems.map((photo) => (
            <div
              key={photo.id}
              className={cn('aspect-square overflow-hidden cursor-pointer group relative break-inside-avoid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', galleryRoundedClass)}
              style={{ backgroundColor: colors.neutralSurface, '--tw-ring-color': colors.focusRing } as React.CSSProperties}
              onClick={() =>{  setSelectedPhoto(photo); }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
            >
              {photo.url ? (
                <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={28} style={{ color: colors.placeholderIcon }} /></div>
              )}
              <div className={cn('absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors', galleryRoundedClass)} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGalleryMarqueeStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}
    if (marqueeBaseItems.length === 0) {return renderGalleryEmptyState();}

    return (
      <div className="pt-4 pb-8">
        <div className="w-full max-w-7xl mx-auto relative overflow-hidden py-4 md:py-4 rounded-2xl">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-20 z-10"
            style={{ background: `linear-gradient(to right, ${colors.neutralBackground} 0%, transparent 100%)` }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-20 z-10"
            style={{ background: `linear-gradient(to left, ${colors.neutralBackground} 0%, transparent 100%)` }}
          />
          <div
            ref={marqueeScrollRef}
            className="flex overflow-x-auto select-none w-full cursor-grab active:cursor-grabbing touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            onMouseEnter={() => { setIsMarqueeInteractionPaused(true); }}
            onMouseLeave={(e) => {
              setIsMarqueeInteractionPaused(false);
              e.currentTarget.dataset.isDown = 'false';
              e.currentTarget.style.scrollBehavior = 'smooth';
            }}
            onFocusCapture={() => { setIsMarqueeInteractionPaused(true); }}
            onBlurCapture={() => { setIsMarqueeInteractionPaused(false); }}
            onTouchStart={() => { setIsMarqueeInteractionPaused(true); }}
            onTouchEnd={() => { setIsMarqueeInteractionPaused(false); }}
            onTouchCancel={() => { setIsMarqueeInteractionPaused(false); }}
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el.dataset.isDown = 'true';
              el.dataset.startX = String(e.pageX - el.offsetLeft);
              el.dataset.scrollLeft = String(el.scrollLeft);
              el.style.scrollBehavior = 'auto';
            }}
            onMouseUp={(e) => {
              e.currentTarget.dataset.isDown = 'false';
              e.currentTarget.style.scrollBehavior = 'smooth';
            }}
            onMouseMove={(e) => {
              const el = e.currentTarget;
              if (el.dataset.isDown !== 'true') {return;}
              e.preventDefault();
              const x = e.pageX - el.offsetLeft;
              const walk = (x - Number(el.dataset.startX ?? '0')) * 1.2;
              el.scrollLeft = Number(el.dataset.scrollLeft ?? '0') - walk;
            }}
          >
            {Array.from({ length: marqueeRepeatCount }).map((_, loopIdx) => (
              <div
                key={`gallery-marquee-track-${loopIdx}`}
                ref={loopIdx === 0 ? marqueeBaseTrackRef : undefined}
                className="flex shrink-0 items-center gap-6 md:gap-8 px-1 py-1"
              >
                {marqueeBaseItems.map((photo, idx) => (
                  <button
                    type="button"
                    key={`gallery-marquee-${loopIdx}-${photo.id}-${idx}`}
                    className={cn('shrink-0 h-40 md:h-56 lg:h-64 aspect-[4/3] overflow-hidden group relative text-left appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', galleryRoundedClass)}
                    style={{
                      backgroundColor: colors.neutralSurface,
                      '--tw-ring-color': colors.focusRing,
                    } as React.CSSProperties}
                    onClick={() => { setSelectedPhoto(photo); }}
                    aria-label={`Mở ảnh ${idx + 1}`}
                  >
                    {photo.url ? (
                      <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                        <ImageIcon size={32} style={{ color: colors.placeholderIcon }} />
                      </div>
                    )}
                    <div className={cn('absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors', galleryRoundedClass)} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGalleryMasonryStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}

    const maxVisible = device === 'mobile' ? 6 : 10;
    const visibleItems = normalizedItems.slice(0, maxVisible);

    if (normalizedItems.length <= 2) {
      return (
        <div className="px-4 pt-4 pb-8">
          <div className={cn('mx-auto flex items-center justify-center gap-3', normalizedItems.length === 1 ? 'max-w-md' : 'max-w-2xl')}>
            {normalizedItems.map((photo, idx) => (
              <div
                key={photo.id}
                className={cn('flex-1 overflow-hidden cursor-pointer group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', galleryRoundedClass, idx % 2 === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]')}
                style={{ backgroundColor: colors.neutralSurface, '--tw-ring-color': colors.focusRing } as React.CSSProperties}
                onClick={() =>{  setSelectedPhoto(photo); }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
              >
                {photo.url ? (
                  <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={40} style={{ color: colors.placeholderIcon }} /></div>
                )}
                <div className={cn('absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors', galleryRoundedClass)} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 pt-4 pb-8">
        <div className={cn(
          'gap-3',
          device === 'mobile' ? 'columns-2' : (device === 'tablet' ? 'columns-3' : galleryMasonryColumnsClass)
        )}>
          {visibleItems.map((photo, idx) => {
            const heights = ['h-48', 'h-64', 'h-56', 'h-72', 'h-52', 'h-60'];
            const heightClass = heights[idx % heights.length];

            return (
              <div
                key={photo.id}
                className={cn('mb-3 break-inside-avoid overflow-hidden cursor-pointer group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', galleryRoundedClass, heightClass)}
                style={{ backgroundColor: colors.neutralSurface, '--tw-ring-color': colors.focusRing } as React.CSSProperties}
                onClick={() =>{  setSelectedPhoto(photo); }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
              >
                {photo.url ? (
                  <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={28} style={{ color: colors.placeholderIcon }} /></div>
                )}
                <div className={cn('absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors', galleryRoundedClass)} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGalleryContent = () => {
    const headerConfig = extractSectionHeaderConfig(config);
    const galleryFullWidth = ((config.fullWidthDesktop ?? config.fullWidth) as boolean) ?? false;
    const sectionSpacingClassName = getSectionSpacingClassName(config.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(config.spacing));
    
    return (
      <section className={cn('w-full', sectionSpacingClassName)} style={{ backgroundColor: 'transparent' }}>
        <div className={cn(
          'mx-auto px-3',
          galleryFullWidth ? 'max-w-none' : 'max-w-7xl',
        )}>
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
            className="mb-1.5"
          />
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
            {style === 'spotlight' && renderSpotlightStyle()}
            {style === 'explore' && renderExploreStyle()}
            {style === 'stories' && renderStoriesStyle()}
            {style === 'grid' && renderGalleryGridStyle()}
            {style === 'marquee' && renderGalleryMarqueeStyle()}
            {style === 'masonry' && renderGalleryMasonryStyle()}
          </div>
        </div>
        <GalleryLightbox
          photo={selectedPhoto}
          onClose={() =>{  setSelectedPhoto(null); }}
          photos={lightboxItems}
          currentIndex={currentPhotoIndex}
          onNavigate={handleLightboxNavigate}
          colors={colors}
        />
      </section>
    );
  };

  if (type === 'Gallery') {
    return renderGalleryContent();
  }

  // ============ PARTNERS STYLES (Grid, Marquee, Mono, Badge) ============

  // Extract header config for Partners
  const partnersHeaderConfig = extractSectionHeaderConfig(config);

  const renderPartnersWithHeader = (content: React.ReactNode, bgClass = 'bg-white', forceDarkHeader = false) => {
    const darkHeader = forceDarkHeader || Boolean(isDark);
    return (
      <section className={cn('w-full px-3', isDark ? '' : bgClass, getPartnersSectionSpacingClassName(partnersSpacing, 'siteOuter'))} style={isDark ? { backgroundColor: colors.neutralBackground } : undefined}>
        <div className="mx-auto w-full max-w-7xl">
          {!partnersHeaderConfig.hideHeader && (
            <SectionHeader
              title={title}
              subtitle={partnersHeaderConfig.subtitle}
              badgeText={partnersHeaderConfig.badgeText}
              hideHeader={partnersHeaderConfig.hideHeader}
              showTitle={partnersHeaderConfig.showTitle}
              showSubtitle={partnersHeaderConfig.showSubtitle}
              showBadge={partnersHeaderConfig.showBadge}
              headerAlign={partnersHeaderConfig.headerAlign}
              titleColorPrimary={partnersHeaderConfig.titleColorPrimary}
              subtitleAboveTitle={partnersHeaderConfig.subtitleAboveTitle}
              uppercaseText={partnersHeaderConfig.uppercaseText}
              brandColor={brandColor}
              className={cn(darkHeader && '[&_h2]:text-white [&_p]:text-slate-400 [&_span]:text-slate-400')}
            />
          )}
          {content}
        </div>
      </section>
    );
  };

  // Style: Classic Grid - Hover effect, responsive grid
  if (style === 'grid') {
    return renderPartnersWithHeader(
      <PartnersGridShared
        items={items}
        title={title}
        subheading={partnersSubheading}
        align={partnersAlign}
        displayMode={partnersDisplayMode}
        cornerRadius={partnersCornerRadius}
        logoSize={partnersLogoSize}
        showBorder={partnersShowBorder}
        spacing={partnersSpacing}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        maxVisible={20}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} mode="logo" />
        )}
        skipHeader={true}
      />
    );
  }

  if (style === 'marquee') {
    return (
      <PartnersMarqueeShared
        items={items}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={partnersHeaderConfig.showTitle !== false ? title : undefined}
        subheading={partnersHeaderConfig.showSubtitle !== false ? (partnersHeaderConfig.subtitle || partnersSubheading) : undefined}
        badgeText={partnersHeaderConfig.showBadge !== false ? partnersHeaderConfig.badgeText : undefined}
        align={partnersHeaderConfig.headerAlign ?? partnersAlign}
        displayMode={partnersDisplayMode}
        logoSize={partnersLogoSize}
        spacing={partnersSpacing}
        speed={1.15}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} mode="logo" />
        )}
        skipHeader={partnersHeaderConfig.hideHeader === true}
      />
    );
  }

  if (style === 'clean') {
    return renderPartnersWithHeader(
      <PartnersCleanShared
        items={items}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={title}
        subheading={partnersSubheading}
        align={partnersAlign}
        displayMode={partnersDisplayMode}
        cornerRadius={partnersCornerRadius}
        logoSize={partnersLogoSize}
        spacing={partnersSpacing}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} mode="logo" />
        )}
        skipHeader={true}
      />
    );
  }

  // Style: Carousel - Horizontal scrollable với navigation và drag scroll
  if (style === 'carousel') {
    const normalizedItems = items.map((item, idx) => ({ ...item, id: idx }));

    return renderPartnersWithHeader(
      <PartnersCarouselShared
        items={normalizedItems}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={title}
        subheading={partnersSubheading}
        align={partnersAlign}
        displayMode={partnersDisplayMode}
        cornerRadius={partnersCornerRadius}
        logoSize={partnersLogoSize}
        showBorder={partnersShowBorder}
        spacing={partnersSpacing}
        openInNewTab={false}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} mode="logo" />
        )}
        skipHeader={true}
      />
    );
  }

  if (style === 'logoCloud') {
    const normalizedItems = items.map((item, idx) => ({ ...item, id: idx }));

    return renderPartnersWithHeader(
      <PartnersLogoCloudShared
        items={normalizedItems}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        cornerRadius={partnersCornerRadius}
        logoSize={partnersLogoSize}
        showBorder={partnersShowBorder}
        spacing={partnersSpacing}
        openInNewTab={false}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? 'Hình ảnh'} className={className} width={180} height={80} mode="logo" />
        )}
      />
    );
  }

  if (style === 'glassLogoCloud') {
    const normalizedItems = items.map((item, idx) => ({ ...item, id: idx }));
    const logoColorMode = (config.logoColorMode as PartnersLogoColorMode) || 'grayscale';
    const logoColorIntensity = normalizePartnersLogoColorIntensity(config.logoColorIntensity, logoColorMode);

    return (
      <div className="w-full" style={{ backgroundColor: isDark ? colors.neutralBackground : '#ffffff' }}>
        {!partnersHeaderConfig.hideHeader && (
          <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6', partnersSpacing === 'none' ? 'pt-0' : partnersSpacing === 'compact' ? 'pt-4 md:pt-6' : 'pt-8 md:pt-12')}>
            <SectionHeader
              title={title}
              subtitle={partnersHeaderConfig.subtitle}
              badgeText={partnersHeaderConfig.badgeText}
              hideHeader={partnersHeaderConfig.hideHeader}
              showTitle={partnersHeaderConfig.showTitle}
              showSubtitle={partnersHeaderConfig.showSubtitle}
              showBadge={partnersHeaderConfig.showBadge}
              headerAlign={partnersHeaderConfig.headerAlign}
              titleColorPrimary={partnersHeaderConfig.titleColorPrimary}
              subtitleAboveTitle={partnersHeaderConfig.subtitleAboveTitle}
              uppercaseText={partnersHeaderConfig.uppercaseText}
              brandColor={brandColor}
            />
          </div>
        )}
        <div className={cn('w-full bg-gradient-to-r from-zinc-950 via-zinc-900/90 to-zinc-950 border-t border-b border-zinc-800/80 z-20', getPartnersSectionSpacingClassName(partnersSpacing, 'glassLogoCloud', true))}>
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <PartnersGlassLogoCloudShared
              items={normalizedItems}
              brandColor={brandColor}
              secondary={secondary}
              mode={mode}
              cornerRadius={partnersCornerRadius}
              logoSize={partnersLogoSize}
              showBorder={partnersShowBorder}
              spacing={partnersSpacing}
              logoColorMode={logoColorMode}
              logoColorIntensity={logoColorIntensity}
              openInNewTab={false}
              renderImage={(item, className) => (
                <SiteImage src={item.url} alt={item.name ?? 'Hình ảnh'} className={className} width={180} height={80} mode="logo" />
              )}
            />
          </div>
        </div>
      </div>
    );
  }

  if (style === 'divider') {
    return renderPartnersWithHeader(
      <PartnersDividerShared
        items={items}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={title}
        subheading={partnersSubheading}
        align={partnersAlign}
        displayMode={partnersDisplayMode}
        cornerRadius={partnersCornerRadius}
        logoSize={partnersLogoSize}
        showBorder={partnersShowBorder}
        spacing={partnersSpacing}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} mode="logo" />
        )}
        skipHeader={true}
      />
    );
  }

  // Style: Badge - Compact badges with name (default fallback)
  return renderPartnersWithHeader(
    <PartnersBadgeShared
      items={items}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      title={title}
      subheading={partnersSubheading}
      align={partnersAlign}
      displayMode={partnersDisplayMode}
      cornerRadius={partnersCornerRadius}
      logoSize={partnersLogoSize}
      showBorder={partnersShowBorder}
      spacing={partnersSpacing}
      maxVisible={items.length}
      variant="site"
      renderImage={(item, className) => (
        <SiteImage src={item.url} alt={item.name ?? ''} className={className} mode="logo" />
      )}
      skipHeader={true}
    />
  );
}

// ============ PRODUCT CATEGORIES SECTION ============
// Best Practices: Clear navigation, visual appeal, mobile optimization, hover effects
// 8 styles: grid, carousel, cards, marquee, circular, icon-grid, mosaic, compact-grid
import { ProductCategoriesSectionShared } from '@/app/admin/home-components/product-categories/_components/ProductCategoriesSectionShared';
import { normalizeProductCategoriesCornerRadius, normalizeProductCategoriesSpacing, normalizeProductCategoriesDesktopColumns, type ProductCategoriesAlign, type ProductCategoriesResolvedItem, type ProductCategoriesStyle } from '@/app/admin/home-components/product-categories/_types';

function ProductCategoriesSection({ config, brandColor, secondary, mode, title, isDark }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string; isDark?: boolean }) {
  const categoriesConfig = (config.categories as { categoryId: string; customImage?: string; imageMode?: string }[]) || [];
  const style = (config.style as ProductCategoriesStyle) || 'image-strip';
  const showProductCount = (config.showProductCount as boolean) ?? true;
  const spacing = normalizeProductCategoriesSpacing(config.spacing, config.noVerticalMargin);
  const cornerRadius = normalizeProductCategoriesCornerRadius(config.cornerRadius, config.noBorderRadius);
  const subtitle = typeof config.subtitle === 'string'
    ? config.subtitle
    : typeof config.subheading === 'string'
      ? config.subheading
      : '';
  const headerAlign = (config.headerAlign as ProductCategoriesAlign) ?? (config.align as ProductCategoriesAlign) ?? 'center';
  const colors = React.useMemo(() => adaptTokensForDarkMode(getProductCategoriesColors(brandColor, secondary, mode), isDark ?? false), [brandColor, secondary, mode, isDark]);
  const [device, setDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  const categoriesData = useQuery(api.productCategories.listActive);
  const productsData = useQuery(api.products.listPublicResolved, {});
  const categoriesWithStats = useQuery(api.productCategories.listActiveWithStats, { productLimit: 5000 });
  
  const categoryMap = React.useMemo(() => {
    const map: Record<string, { name: string; slug: string; image?: string; description?: string }> = {};
    if (categoriesData) {
      for (const cat of categoriesData) {
        map[cat._id] = cat;
      }
    }
    return map;
  }, [categoriesData]);
  
  const productCountMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (categoriesWithStats?.stats) {
      for (const stat of categoriesWithStats.stats) {
        map[stat.categoryId] = stat.productCount;
      }
    }
    return map;
  }, [categoriesWithStats]);
  const productIdsForImages = React.useMemo(() => {
    const ids: string[] = [];
    for (const item of categoriesConfig) {
      if (item.imageMode === 'product-image' && item.customImage?.startsWith('product:')) {
        const id = item.customImage.replace('product:', '');
        if (id) ids.push(id);
      }
    }
    return ids;
  }, [categoriesConfig]);

  const targetProductsData = useQuery(api.products.listByIds, { ids: productIdsForImages as any });

  const productImageMap = React.useMemo(() => {
    const map: Record<string, string | undefined> = {};
    if (productsData) {
      for (const product of productsData) {
        map[product._id] = product.image;
      }
    }
    if (targetProductsData) {
      for (const product of targetProductsData) {
        map[product._id] = product.image;
      }
    }
    return map;
  }, [productsData, targetProductsData]);

  React.useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDevice('mobile');
        return;
      }
      if (width < 1024) {
        setDevice('tablet');
        return;
      }
      setDevice('desktop');
    };

    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);
  
  const resolvedCategories = categoriesConfig
    .filter((item, index, arr) => arr.findIndex(i => i.categoryId === item.categoryId) === index)
    .map(item => {
      const cat = categoryMap[item.categoryId];
      if (!cat) {return null;}
      
      const imageMode = item.imageMode ?? 'default';
      let displayImage = cat.image;
      let displayIcon: string | undefined;
      
      if (imageMode === 'icon' && item.customImage?.startsWith('icon:')) {
        displayIcon = item.customImage.replace('icon:', '');
        displayImage = undefined;
      } else if (imageMode === 'product-image' && item.customImage?.startsWith('product:')) {
        const productId = item.customImage.replace('product:', '');
        displayImage = productImageMap[productId] ?? cat.image;
      } else if (imageMode === 'upload' || imageMode === 'url') {
        displayImage = item.customImage ?? cat.image;
      }
      
      return {
        ...cat,
        id: item.categoryId,
        itemId: item.categoryId,
        displayImage,
        displayIcon,
        productCount: productCountMap[item.categoryId] || 0,
      };
    })
    .filter(Boolean) as ProductCategoriesResolvedItem[];

  // Demo mode: use embedded demo data instead of real categories
  const selectionMode = (config.selectionMode as string) || 'real';
  const demoCategories = Array.isArray(config.demoCategories) ? config.demoCategories as { id: string; name: string; image?: string; productCount?: number; link?: string }[] : [];
  
  const finalItems: ProductCategoriesResolvedItem[] = selectionMode === 'demo' && demoCategories.length > 0
    ? demoCategories.map((item, idx) => ({
        id: item.id,
        itemId: idx,
        name: item.name || `Danh mục ${idx + 1}`,
        displayImage: item.image,
        productCount: item.productCount ?? 0,
        link: item.link,
      }))
    : resolvedCategories;

  if (finalItems.length === 0) {return null;}

  return (
    <ProductCategoriesSectionShared
      title={title}
      subtitle={subtitle}
      subheading={subtitle}
      headerAlign={headerAlign}
      align={headerAlign}
      hideHeader={config.hideHeader as boolean | undefined}
      showTitle={config.showTitle as boolean | undefined}
      showSubtitle={config.showSubtitle as boolean | undefined}
      titleColorPrimary={config.titleColorPrimary as boolean | undefined}
      subtitleAboveTitle={config.subtitleAboveTitle as boolean | undefined}
      uppercaseText={config.uppercaseText as boolean | undefined}
      showBadge={config.showBadge as boolean | undefined}
      badgeText={config.badgeText as string | undefined}
      brandColor={brandColor}
      style={style}
      items={finalItems}
      colors={colors}
      context="site"
      device={device}
      mode={mode}
      showProductCount={showProductCount}
      spacing={spacing}
      cornerRadius={cornerRadius}
      desktopColumns={normalizeProductCategoriesDesktopColumns(config.desktopColumns)}
      viewAllHref="/products"
      getItemHref={(item) => item.link || (item.slug ? `/${item.slug}` : '/products')}
      renderImage={(item, className) => (
        item.displayImage
          ? <SiteImage src={item.displayImage} alt={item.name} className={className} />
          : <div className={cn('flex h-full w-full items-center justify-center bg-slate-100', className)}><Package size={28} className="text-slate-300" /></div>
      )}
    />
  );
}

// ============ CATEGORY PRODUCTS SECTION ============
// Sản phẩm theo danh mục - Mỗi section là 1 danh mục với các sản phẩm thuộc danh mục đó
type CategoryProductsStyle = 'grid' | 'carousel' | 'cards' | 'bento' | 'magazine' | 'showcase' | 'wine-grid';
type RuntimeDemoCategoryProductsSection = {
  id: string;
  categoryName: string;
  categoryImage?: string;
  products: {
    id: string;
    name: string;
    image?: string;
    price?: number;
    salePrice?: number;
  }[];
};

function CategoryProductsSection({
  config,
  brandColor,
  secondary,
  mode,
  title: _title,
  isDark,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
  isDark?: boolean;
}) {
  const sections = (config.sections as { categoryId: string; itemCount: number }[]) || [];
  const selectionMode = (config.selectionMode as 'real' | 'demo' | undefined) ?? 'real';
  const demoSections = (config.demoSections as RuntimeDemoCategoryProductsSection[] | undefined) ?? [];
  const style = (config.style as CategoryProductsStyle) || 'grid';
  const showViewAll = (config.showViewAll as boolean) ?? true;
  const columnsDesktop = config.columnsDesktop === 3 ? 3 : 4;
  const sectionTitle = _title || 'Sản phẩm';
  const sectionSpacingClassName = getSectionSpacingClassName(normalizeSectionSpacing(config.spacing));
  const cornerRadius = normalizeCategoryProductsCornerRadius(config.cornerRadius);
  const cardRadiusClassName = getCategoryProductsCardRadiusClassName(cornerRadius);
  const imageRadiusClassName = getCategoryProductsImageRadiusClassName(cornerRadius);
  const colors = React.useMemo(
    () => adaptTokensForDarkMode(getCategoryProductsColors(brandColor, secondary, mode), isDark ?? false),
    [brandColor, secondary, mode, isDark]
  );

  // Query categories and products
  const categoriesData = useQuery(api.productCategories.listActive);
  const productsData = useQuery(api.products.listPublicResolved, { limit: 100 });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const imageAspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = React.useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const saleMode = React.useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);
  const imageAspectRatio = React.useMemo(
    () => resolveProductImageAspectRatio(imageAspectRatioSetting?.value),
    [imageAspectRatioSetting?.value]
  );
  const imageAspectRatioStyle = React.useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs(imageAspectRatio);

  const resolvedSections = React.useMemo(() => {
    if (selectionMode === 'demo') {
      return demoSections
        .filter(section => section.categoryName?.trim() || section.products.length > 0)
        .map((section, index) => ({
          category: {
            _id: section.id,
            image: section.categoryImage,
            name: section.categoryName || `Danh mục demo ${index + 1}`,
            slug: undefined,
          },
          categoryId: section.id,
          itemCount: section.products.length,
          products: section.products.map(product => ({
            _id: product.id,
            categoryId: section.id,
            hasVariants: false,
            image: product.image,
            name: product.name || 'Tên sản phẩm',
            price: product.price,
            salePrice: product.salePrice,
          })),
        }));
    }

    return sections
      .map(section => {
        const category = categoriesData?.find(c => c._id === section.categoryId);
        if (!category) {return null;}

        const products = (productsData ?? [])
          .filter(p => p.categoryId === section.categoryId)
          .slice(0, section.itemCount);

        return {
          ...section,
          category,
          products,
        };
      })
      .filter(Boolean) as {
        categoryId: string;
        itemCount: number;
        category: { _id: string; name: string; slug?: string; image?: string };
        products: { _id: string; name: string; image?: string; price?: number; salePrice?: number; slug?: string; hasVariants?: boolean }[];
      }[];
  }, [categoriesData, demoSections, productsData, sections, selectionMode]);

  const getGridCols = () => getCategoryProductsResponsiveGridClassName(columnsDesktop);

  const getPriceDisplay = (price?: number, salePrice?: number, isRangeFromVariant?: boolean) =>
    getHomeComponentPriceLabel({ saleMode, price, salePrice, isRangeFromVariant });
  const formatComparePrice = (price?: number) =>
    price ? getHomeComponentPriceLabel({ saleMode: 'cart', price }).label : '';
  const getProductDiscount = (product: { price?: number; salePrice?: number; hasVariants?: boolean }) => {
    const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
    const currentPrice = product.salePrice ?? product.price;
    if (!priceDisplay.comparePrice || !currentPrice || priceDisplay.comparePrice <= currentPrice) {return null;}
    return Math.round((1 - currentPrice / priceDisplay.comparePrice) * 100);
  };

  const resolveProductHref = React.useCallback((params: {
    product: { slug?: string; _id: string };
    categorySlug?: string;
  }) => buildDetailPath({
    categorySlug: params.categorySlug,
    mode: routeMode,
    moduleKey: 'products',
    recordSlug: params.product.slug ?? params.product._id,
  }), [routeMode]);

  const categorySlugMap = React.useMemo(() => {
    if (!categoriesData) {return new Map<string, string>();}
    return new Map(categoriesData.map((category) => [category._id, category.slug]));
  }, [categoriesData]);

  const resolveProductHrefByCategory = React.useCallback((params: {
    product: { slug?: string; _id: string };
    categoryId: string;
  }) => resolveProductHref({
    categorySlug: categorySlugMap.get(params.categoryId),
    product: params.product,
  }), [categorySlugMap, resolveProductHref]);

  // Product Card Component with Equal Height (line-clamp + min-height)
  const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
  const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
  const cartButtonsLayout = (config.cartButtonsLayout as 'stack' | 'grid-2') || 'stack';
  const showStock = config.showStock !== false;

  const router = useRouter();
  const { addItem, openDrawer } = useCart();
  const cartConfig = useCartConfig();
  const [quickAddTarget, setQuickAddTarget] = React.useState<{ product: any; action: 'addToCart' | 'buyNow' } | null>(null);

  const tokens = React.useMemo(
    () => adaptTokensForDarkMode(getProductsListColors(brandColor, secondary, mode || 'single'), isDark ?? false),
    [brandColor, secondary, mode, isDark]
  );

  const handleAddToCart = async (product: any) => {
    if (showStock && !product.hasVariants && (product.stock ?? 0) <= 0) {
      return;
    }

    if (product.hasVariants) {
      setQuickAddTarget({ product, action: 'addToCart' });
      return;
    }

    await addItem(product._id, 1);
    notifyAddToCart();
    if (cartConfig.layoutStyle === 'drawer') {
      openDrawer();
    } else {
      router.push('/cart');
    }
  };

  const handleBuyNow = (product: any) => {
    if (showStock && !product.hasVariants && (product.stock ?? 0) <= 0) {
      return;
    }

    if (product.hasVariants) {
      setQuickAddTarget({ product, action: 'buyNow' });
      return;
    }

    router.push(`/checkout?productId=${product._id}&quantity=1`);
  };

  const handleQuickAddConfirm = async (variantId: Id<'productVariants'>, quantity: number) => {
    if (!quickAddTarget) return;
    const { product, action } = quickAddTarget;

    if (action === 'addToCart') {
      await addItem(product._id, quantity, variantId);
      notifyAddToCart();
      if (cartConfig.layoutStyle === 'drawer') {
        openDrawer();
      } else {
        router.push('/cart');
      }
    } else {
      router.push(`/checkout?productId=${product._id}&quantity=${quantity}&variantId=${variantId}`);
    }
    setQuickAddTarget(null);
  };

  const renderQuickAddModal = () => (
    <QuickAddVariantModal
      isOpen={quickAddTarget !== null}
      product={quickAddTarget?.product ?? null}
      brandColor={brandColor}
      actionLabel={quickAddTarget?.action === 'addToCart' ? 'Thêm vào giỏ' : 'Mua ngay'}
      onClose={() => setQuickAddTarget(null)}
      onConfirm={handleQuickAddConfirm}
    />
  );

  const ProductCard = ({ product, categoryId }: { product: { _id: string; name: string; image?: string; price?: number; salePrice?: number; slug?: string; hasVariants?: boolean }; categoryId: string }) => {
    const href = resolveProductHrefByCategory({ categoryId, product });
    const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
    return (
      <div className={cn("group bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full p-3", cardRadiusClassName)}>
        <a href={href} aria-label={`${sectionTitle}: ${product.name}`} className="block relative bg-slate-100 overflow-hidden mb-2" style={imageAspectRatioStyle}>
          <ProductImageWithOverlay
            frameConfig={frameConfig}
            watermarkConfig={watermarkConfig}
            className={cn('w-full h-full', imageRadiusClassName)}
          >
            {product.image ? (
              <SiteImage 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={24} style={{ color: colors.emptyStateIcon }} />
              </div>
            )}
          </ProductImageWithOverlay>
        </a>
        <a href={href} className="block flex-1 flex flex-col mb-3">
          <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]" style={{ color: colors.bodyText }}>{product.name || 'Tên sản phẩm'}</h4>
          <div className="flex flex-col mt-auto">
            {priceDisplay.comparePrice ? (
              <>
                <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                  {priceDisplay.label}
                </span>
                <span className="text-xs line-through" style={{ color: colors.mutedText }}>{formatComparePrice(priceDisplay.comparePrice)}</span>
              </>
            ) : (
              <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                {priceDisplay.label}
              </span>
            )}
          </div>
        </a>

        {showAddToCartButton || showBuyNowButton ? (
          <ProductCardActions
            product={product as any}
            tokens={tokens}
            showStock={showStock}
            showAddToCartButton={showAddToCartButton}
            showBuyNowButton={showBuyNowButton}
            buyNowLabel="Mua ngay"
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            cartButtonsLayout={cartButtonsLayout}
          />
        ) : (
          <a
            href={href}
            className="w-full gap-1 border-2 py-1.5 px-2 rounded-lg font-medium flex items-center justify-center transition-colors whitespace-nowrap text-xs hover:bg-opacity-10"
            style={{ borderColor: `${brandColor}20`, color: brandColor }}
          >
            Xem chi tiết <ArrowRight className="w-3 h-3 flex-shrink-0" />
          </a>
        )}
      </div>
    );
  };

  // Empty State Component with brandColor
  const EmptyProductsState = ({ message }: { message: string }) => (
    <div 
      className="text-center py-8 rounded-xl flex flex-col items-center justify-center"
      style={{ backgroundColor: colors.emptyStateBackground }}
    >
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: colors.emptyStateIconBackground }}
      >
        <Package size={24} style={{ color: colors.emptyStateIcon }} />
      </div>
      <p className="text-sm" style={{ color: colors.emptyStateText }}>{message}</p>
    </div>
  );

  if (resolvedSections.length === 0) {
    return null;
  }

  // Style 1: Grid
  if (style === 'grid') {
    return (
      <>
        <div className={cn('space-y-10 md:space-y-16', sectionSpacingClassName)}>
          {resolvedSections.map((section, idx) => (
            <section key={idx} className="px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.heading }}>{section.category.name}</h2>
                  {showViewAll && (
                    <a 
                      href={buildCategoryPath({ categorySlug: section.category.slug ?? section.category._id, mode: routeMode, moduleKey: 'products' })}
                      className="text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: colors.buttonBorder, color: colors.buttonText }}
                    >
                      Xem danh mục
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>
                
                {section.products.length > 0 ? (
                  <div className={cn('grid gap-4', getGridCols())}>
                    {section.products.map((product) => (
                      <ProductCard key={product._id} product={product} categoryId={section.category._id} />
                    ))}
                  </div>
                ) : (
                  <EmptyProductsState message="Chưa có sản phẩm trong danh mục này" />
                )}
              </div>
            </section>
          ))}
        </div>
        {renderQuickAddModal()}
      </>
    );
  }

  // Style 2: Carousel
  if (style === 'carousel') {
    const CarouselSection = ({ section }: { section: typeof resolvedSections[number] }) => {
      const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        dragFree: true,
        containScroll: 'trimSnaps',
      });
      const [canScrollPrev, setCanScrollPrev] = React.useState(false);
      const [canScrollNext, setCanScrollNext] = React.useState(false);

      React.useEffect(() => {
        if (!emblaApi) { return; }

        const update = () => {
          setCanScrollPrev(emblaApi.canScrollPrev());
          setCanScrollNext(emblaApi.canScrollNext());
        };

        update();
        emblaApi.on('select', update);
        emblaApi.on('reInit', update);

        return () => {
          emblaApi.off('select', update);
          emblaApi.off('reInit', update);
        };
      }, [emblaApi]);

      return (
        <section>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between px-4 mb-4">
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.heading }}>{section.category.name}</h2>
              <div className="flex items-center gap-2">
                {showViewAll && (
                  <a
                    href={buildCategoryPath({ categorySlug: section.category.slug ?? section.category._id, mode: routeMode, moduleKey: 'products' })}
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: colors.buttonText }}
                  >
                    Xem danh mục <ArrowRight size={16} />
                  </a>
                )}
                {(canScrollPrev || canScrollNext) && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Trước"
                      disabled={!canScrollPrev}
                      onClick={() => emblaApi?.scrollPrev()}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-all"
                      style={canScrollPrev
                        ? { backgroundColor: `${colors.sectionAccent}18`, color: colors.sectionAccent }
                        : { opacity: 0.3, color: colors.mutedText ?? '#94a3b8' }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Tiếp"
                      disabled={!canScrollNext}
                      onClick={() => emblaApi?.scrollNext()}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-all"
                      style={canScrollNext
                        ? { backgroundColor: `${colors.sectionAccent}18`, color: colors.sectionAccent }
                        : { opacity: 0.3, color: colors.mutedText ?? '#94a3b8' }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {section.products.length > 0 ? (
              <div className="overflow-hidden px-4" ref={emblaRef}>
                <div className="flex gap-4 backface-hidden touch-pan-y">
                  {section.products.map((product) => {
                    const href = resolveProductHrefByCategory({ categoryId: section.category._id, product });
                    const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                    return (
                      <div
                        key={product._id}
                        className="flex-none w-36 md:w-48 group flex flex-col justify-between"
                      >
                        <a
                          href={href}
                          className="block cursor-grab active:cursor-grabbing select-none mb-3 flex-1"
                          draggable={false}
                        >
                          <ProductImageWithOverlay
                            frameConfig={frameConfig}
                            watermarkConfig={watermarkConfig}
                            className={cn('overflow-hidden mb-2', imageRadiusClassName)}
                            style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                          >
                            {product.image ? (
                              <SiteImage
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                draggable={false}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={24} style={{ color: colors.emptyStateIcon }} />
                              </div>
                            )}
                          </ProductImageWithOverlay>
                          <h4 className="font-medium text-sm line-clamp-2 mb-1" style={{ color: colors.bodyText }}>{product.name}</h4>
                          <span className="font-bold text-base" style={{ color: colors.buttonText }}>
                            {priceDisplay.label}
                          </span>
                        </a>

                        {showAddToCartButton || showBuyNowButton ? (
                          <ProductCardActions
                            product={product as any}
                            tokens={tokens}
                            showStock={showStock}
                            showAddToCartButton={showAddToCartButton}
                            showBuyNowButton={showBuyNowButton}
                            buyNowLabel="Mua ngay"
                            onAddToCart={handleAddToCart}
                            onBuyNow={handleBuyNow}
                            cartButtonsLayout={cartButtonsLayout}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mx-4">
                <EmptyProductsState message="Chưa có sản phẩm" />
              </div>
            )}
          </div>
        </section>
      );
    };

    return (
      <>
        <div className={cn('space-y-8 md:space-y-12', sectionSpacingClassName)}>
          {resolvedSections.map((section, idx) => (
            <CarouselSection key={idx} section={section} />
          ))}
        </div>
        {renderQuickAddModal()}
      </>
    );
  }

  // Style 3: Cards - Modern cards with category header
  if (style === 'cards') {
    return (
      <>
        <div className={cn('space-y-10 md:space-y-16', sectionSpacingClassName)}>
          {resolvedSections.map((section, idx) => (
            <section key={idx} className="px-4">
              <div className="max-w-7xl mx-auto">
                <div 
                  className={cn('overflow-hidden', cardRadiusClassName)}
                  style={{ border: `1px solid ${colors.cardBorder}` }}
                >
                  {/* Category Header */}
                  <div 
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ backgroundColor: colors.neutralBackground }}
                  >
                    <div className="flex items-center gap-3">
                      {section.category.image && (
                        <div className={cn('w-10 h-10 overflow-hidden bg-white', imageRadiusClassName)}>
                          <SiteImage 
                            src={section.category.image} 
                            alt={section.category.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}
                      <h2 className="text-lg font-bold" style={{ color: colors.heading }}>{section.category.name}</h2>
                    </div>
                    {showViewAll && (
                      <a 
                        href={buildCategoryPath({ categorySlug: section.category.slug ?? section.category._id, mode: routeMode, moduleKey: 'products' })}
                        className="text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                      >
                        Xem danh mục
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>
                    )}
                  </div>
                  
                  {/* Products Grid */}
                  <div className="p-4" style={{ backgroundColor: colors.cardBackground }}>
                    {section.products.length > 0 ? (
                      <div className={cn('grid gap-4', getGridCols())}>
                        {section.products.map((product) => (
                          <ProductCard key={product._id} product={product} categoryId={section.category._id} />
                        ))}
                      </div>
                    ) : (
                      <EmptyProductsState message="Chưa có sản phẩm" />
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
        {renderQuickAddModal()}
      </>
    );
  }

  // Style 4: Bento - Featured product với bento grid
  if (style === 'bento') {
    return (
      <>
        <div className={cn('space-y-10 md:space-y-16', sectionSpacingClassName)}>
          {resolvedSections.map((section, idx) => {
          const featured = section.products[0];
          const others = section.products.slice(1, 5);
          
          return (
            <section key={idx} className="px-4">
              <div className="max-w-7xl mx-auto">
                {/* Header với accent line */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: colors.sectionAccent }}
                    />
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.heading }}>{section.category.name}</h2>
                  </div>
                  {showViewAll && (
                    <a 
                      href={buildCategoryPath({ categorySlug: section.category.slug ?? section.category._id, mode: routeMode, moduleKey: 'products' })}
                      className="text-sm font-medium flex items-center gap-1.5 px-4 py-2 rounded-full transition-all hover:shadow-md"
                      style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                    >
                      Xem danh mục
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>
                
                {section.products.length === 0 ? (
                  <EmptyProductsState message="Chưa có sản phẩm" />
                ) : (
                  <>
                    {/* Mobile: 2 columns grid */}
                    <div className="grid grid-cols-2 gap-3 md:hidden">
                      {section.products.slice(0, 4).map((product) => (
                        <ProductCard key={product._id} product={product} categoryId={section.category._id} />
                      ))}
                    </div>
                    
                    {/* Desktop: Bento grid */}
                    <div className="hidden md:grid grid-cols-4 gap-4 auto-rows-[180px]">
                      {/* Featured - 2x2 */}
                        <ProductImageWithOverlay
                          frameConfig={frameConfig}
                          watermarkConfig={watermarkConfig}
                          className={cn('col-span-2 row-span-2 group cursor-pointer relative overflow-hidden', cardRadiusClassName)}
                          style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                        >
                          <a 
                            href={resolveProductHrefByCategory({ categoryId: section.category._id, product: featured })}
                            className="absolute inset-0 block w-full h-full"
                          >
                            {featured.image ? (
                              <SiteImage 
                                src={featured.image} 
                                alt={featured.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={48} style={{ color: colors.emptyStateIcon }} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-30" />
                            <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-30">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2"
                                style={{ backgroundColor: colors.featuredBadgeBackground, color: colors.featuredBadgeText }}
                              >
                                Nổi bật
                              </span>
                              <h3 className="font-bold text-lg line-clamp-2 mb-1">{featured.name}</h3>
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 mb-3">
                                {(() => {
                                  const priceDisplay = getPriceDisplay(featured?.price, featured?.salePrice, featured?.hasVariants);
                                  if (priceDisplay.comparePrice) {
                                    return (
                                      <>
                                        <span className="font-bold text-lg">{priceDisplay.label}</span>
                                        <span className="text-xs text-white/60 line-through">{formatComparePrice(priceDisplay.comparePrice)}</span>
                                      </>
                                    );
                                  }
                                  return <span className="font-bold text-lg">{priceDisplay.label}</span>;
                                })()}
                              </div>
                              {(showAddToCartButton || showBuyNowButton) && (
                                <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                  <ProductCardActions
                                    product={featured as any}
                                    tokens={tokens}
                                    showStock={showStock}
                                    showAddToCartButton={showAddToCartButton}
                                    showBuyNowButton={showBuyNowButton}
                                    buyNowLabel="Mua ngay"
                                    onAddToCart={handleAddToCart}
                                    onBuyNow={handleBuyNow}
                                    cartButtonsLayout={cartButtonsLayout}
                                    isOnDarkBg={true}
                                  />
                                </div>
                              )}
                            </div>
                          </a>
                        </ProductImageWithOverlay>
                      
                      {others.map((product) => (
                        <ProductImageWithOverlay
                          key={product._id}
                          frameConfig={frameConfig}
                          watermarkConfig={watermarkConfig}
                          className={cn('group cursor-pointer relative overflow-hidden', imageRadiusClassName)}
                          style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                        >
                          <a 
                            href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}
                            className="absolute inset-0 block w-full h-full"
                          >
                            {product.image ? (
                              <SiteImage 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={24} style={{ color: colors.emptyStateIcon }} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30 flex flex-col justify-end bg-black/60 max-h-full overflow-y-auto">
                              <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                              <span className="font-bold text-sm mb-2">{getPriceDisplay(product.price, product.salePrice, product.hasVariants).label}</span>
                              {(showAddToCartButton || showBuyNowButton) && (
                                <div className="mt-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                  <ProductCardActions
                                    product={product as any}
                                    tokens={tokens}
                                    showStock={showStock}
                                    showAddToCartButton={showAddToCartButton}
                                    showBuyNowButton={showBuyNowButton}
                                    buyNowLabel="Mua ngay"
                                    onAddToCart={handleAddToCart}
                                    onBuyNow={handleBuyNow}
                                    cartButtonsLayout={cartButtonsLayout}
                                    isOnDarkBg={true}
                                  />
                                </div>
                              )}
                            </div>
                          </a>
                        </ProductImageWithOverlay>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {renderQuickAddModal()}
      </>
    );
  }

  // Style 5: Magazine - Editorial Grid với Featured Item + Grid nhỏ
  if (style === 'magazine') {
    return (
      <>
        <div className={cn('space-y-12 md:space-y-16', sectionSpacingClassName)}>
          {resolvedSections.map((section, sectionIdx) => {
          const featured = section.products[0];
          const gridItems = section.products.slice(1, 5);
          
          return (
            <section key={sectionIdx} className="px-4">
              <div className="max-w-7xl mx-auto">
                {/* Editorial Header */}
                <div className="flex items-end justify-between mb-6 pb-4 border-b-2" style={{ borderColor: colors.neutralBorder }}>
                  <div>
                    <span 
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: colors.pillText }}
                    >
                      Bộ sưu tập
                    </span>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mt-1" style={{ color: colors.heading }}>{section.category.name}</h2>
                  </div>
                  {showViewAll && (
                    <a 
                      href={buildCategoryPath({ categorySlug: section.category.slug ?? section.category._id, mode: routeMode, moduleKey: 'products' })}
                      className="font-semibold flex items-center gap-2 transition-all hover:gap-3"
                      style={{ color: colors.buttonText }}
                    >
                      Xem danh mục
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>
                
                {section.products.length === 0 ? (
                  <EmptyProductsState message="Chưa có sản phẩm" />
                ) : (
                  <>
                    {/* Mobile: 2-col grid */}
                    <div className="grid grid-cols-2 gap-3 md:hidden">
                      {section.products.slice(0, 4).map((product) => (
                        <ProductCard key={product._id} product={product} categoryId={section.category._id} />
                      ))}
                    </div>
                    
                    {/* Desktop: Featured (50%) + Grid 2x2 (50%) */}
                    <div className="hidden md:grid grid-cols-2 gap-6">
                      {/* Featured Item - Large */}
                      {featured && (
                        <ProductImageWithOverlay
                          frameConfig={frameConfig}
                          watermarkConfig={watermarkConfig}
                          className={cn('group cursor-pointer relative overflow-hidden', cardRadiusClassName)}
                          style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                        >
                          <a 
                            href={resolveProductHrefByCategory({ categoryId: section.category._id, product: featured })}
                            className="absolute inset-0 block w-full h-full"
                          >
                            {featured.image ? (
                              <SiteImage 
                                src={featured.image} 
                                alt={featured.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={48} style={{ color: colors.emptyStateIcon }} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-30" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-30">
                              <span
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                                style={{ backgroundColor: colors.featuredBadgeBackground, color: colors.featuredBadgeText }}
                              >
                                Nổi bật
                              </span>
                              <h3 className="font-bold text-xl md:text-2xl line-clamp-2 mb-2">{featured.name}</h3>
                              <div className="flex items-baseline gap-3 mb-3">
                                {(() => {
                                  const priceDisplay = getPriceDisplay(featured?.price, featured?.salePrice, featured?.hasVariants);
                                  if (priceDisplay.comparePrice) {
                                    return (
                                      <>
                                        <span className="font-bold text-2xl">{priceDisplay.label}</span>
                                        <span className="text-sm text-white/60 line-through">{formatComparePrice(priceDisplay.comparePrice)}</span>
                                      </>
                                    );
                                  }
                                  return <span className="font-bold text-2xl">{priceDisplay.label}</span>;
                                })()}
                              </div>
                              {(showAddToCartButton || showBuyNowButton) && (
                                <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                  <ProductCardActions
                                    product={featured as any}
                                    tokens={tokens}
                                    showStock={showStock}
                                    showAddToCartButton={showAddToCartButton}
                                    showBuyNowButton={showBuyNowButton}
                                    buyNowLabel="Mua ngay"
                                    onAddToCart={handleAddToCart}
                                    onBuyNow={handleBuyNow}
                                    cartButtonsLayout={cartButtonsLayout}
                                    isOnDarkBg={true}
                                  />
                                </div>
                              )}
                            </div>
                          </a>
                        </ProductImageWithOverlay>
                      )}
                      
                      {/* Grid 2x2 */}
                      <div className="grid grid-cols-2 gap-4">
                        {gridItems.map((product) => (
                          <div 
                            key={product._id}
                            className="group cursor-pointer flex flex-col justify-between"
                          >
                            <a 
                              href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}
                              className="block mb-2"
                            >
                              <ProductImageWithOverlay
                                frameConfig={frameConfig}
                                watermarkConfig={watermarkConfig}
                                className={cn('overflow-hidden mb-3 relative', imageRadiusClassName)}
                                style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                              >
                                {product.image ? (
                                  <SiteImage 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                  <Package size={24} style={{ color: colors.emptyStateIcon }} />
                                  </div>
                                )}
                                {/* Quick view overlay */}
                                <div 
                                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
                                  style={{ backgroundColor: colors.neutralSurface }}
                                >
                                  <span 
                                    className="px-4 py-2 rounded-full text-sm font-medium"
                                    style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                                  >
                                    Xem nhanh
                                  </span>
                                </div>
                              </ProductImageWithOverlay>
                              <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]" style={{ color: colors.bodyText }}>{product.name}</h4>
                              <div className="flex items-baseline gap-2 mt-1">
                                {(() => {
                                  const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                                  if (priceDisplay.comparePrice) {
                                    return (
                                      <>
                                        <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                                          {priceDisplay.label}
                                        </span>
                                        <span className="text-xs line-through" style={{ color: colors.mutedText }}>{formatComparePrice(priceDisplay.comparePrice)}</span>
                                      </>
                                    );
                                  }
                                  return (
                                    <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                                      {priceDisplay.label}
                                    </span>
                                  );
                                })()}
                              </div>
                            </a>
                            {(showAddToCartButton || showBuyNowButton) && (
                              <div className="mt-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <ProductCardActions
                                  product={product as any}
                                  tokens={tokens}
                                  showStock={showStock}
                                  showAddToCartButton={showAddToCartButton}
                                  showBuyNowButton={showBuyNowButton}
                                  buyNowLabel="Mua ngay"
                                  onAddToCart={handleAddToCart}
                                  onBuyNow={handleBuyNow}
                                  cartButtonsLayout={cartButtonsLayout}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {renderQuickAddModal()}
      </>
    );
  }

  if (style === 'wine-grid') {
    return (
      <>
      <div className={cn('w-full bg-white px-2', sectionSpacingClassName)}>
        <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-6">
          {resolvedSections.map((section, idx) => {
            return (
            <section
              key={idx}
              className={cn('border bg-white', cardRadiusClassName)}
              style={{ borderColor: colors.cardBorder }}
            >
              <div
                className={cn(
                  'flex flex-col gap-3 px-3 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6',
                  'sm:flex-row sm:items-end sm:justify-between'
                )}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-base font-bold uppercase leading-6 tracking-[0.1em] md:text-xl md:leading-7 md:tracking-[0.14em] lg:text-2xl lg:leading-8 lg:tracking-[0.18em]" style={{ color: colors.heading }}>
                    {section.category.name}
                  </h3>
                </div>
                {showViewAll && (
                  <a
                    href={buildCategoryPath({ categorySlug: section.category.slug ?? section.category._id, mode: routeMode, moduleKey: 'products' })}
                    aria-label="Xem thêm - Xem danh mục"
                    className={cn(
                      'group flex h-9 shrink-0 items-center justify-center self-start rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase leading-4 tracking-[0.12em] transition-colors hover:bg-[var(--wine-button-hover-bg)] hover:text-[var(--wine-button-hover-text)] sm:self-auto md:h-10 md:px-4 md:text-xs md:tracking-[0.16em]',
                      'lg:ml-4 lg:px-5'
                    )}
                    style={{
                      '--wine-button-hover-bg': colors.sectionAccent,
                      '--wine-button-hover-text': colors.featuredBadgeText,
                      backgroundColor: colors.buttonBackground,
                      borderColor: colors.sectionAccent,
                      color: colors.sectionAccent,
                    } as React.CSSProperties}
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      Xem thêm
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </a>
                )}
              </div>

              <div className="px-3 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
                {section.products.length === 0 ? (
                  <EmptyProductsState message="Chưa có sản phẩm trong danh mục này" />
                ) : (
                  <div className={cn(
                    'grid gap-2 md:gap-3',
                    getGridCols()
                  )}>
                    {section.products.map((product) => {
                      const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                      const discount = getProductDiscount(product);

                      return (
                        <article
                          key={product._id}
                          className={cn('flex h-full flex-col overflow-hidden border shadow-sm transition-all duration-300', cardRadiusClassName)}
                          style={{ backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }}
                        >
                          <a
                            href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}
                            className="block"
                          >
                            <div className="relative aspect-square overflow-hidden border-b" style={{ backgroundColor: colors.imageBackground, borderColor: colors.cardBorder }}>
                              {discount !== null && (
                                <span className="absolute left-0 top-3 z-10 rounded-r-lg px-2.5 py-0.5 text-xs font-bold leading-4 shadow-sm" style={{ backgroundColor: colors.featuredBadgeBackground, color: colors.featuredBadgeText }}>
                                  -{discount}%
                                </span>
                              )}
                              <ProductImageWithOverlay
                                frameConfig={frameConfig}
                                watermarkConfig={watermarkConfig}
                                className="w-full h-full relative"
                              >
                                {product.image ? (
                                  <SiteImage
                                    src={product.image}
                                    alt={product.name}
                                    className="absolute inset-0 h-full w-full object-contain p-1 transition-opacity duration-300"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package size={28} style={{ color: colors.emptyStateIcon }} />
                                  </div>
                                )}
                              </ProductImageWithOverlay>
                            </div>
                          </a>

                          <div className="flex min-w-0 flex-1 flex-col p-2.5 md:p-3">
                            <a href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}>
                              <h3 className="mb-1.5 line-clamp-2 break-words text-[13px] font-bold leading-5 transition-colors md:mb-2 md:text-sm md:leading-5 lg:text-base lg:leading-6" style={{ color: colors.bodyText }}>
                                {product.name || 'Tên sản phẩm'}
                              </h3>
                            </a>
                            <div className="mb-2 flex flex-col gap-1" />
                            <div className="mt-auto flex flex-col gap-2 border-t pt-2" style={{ borderColor: colors.cardBorder }}>
                              <div className="flex min-w-0 flex-row items-end justify-between gap-1.5">
                                <div className="min-w-0 flex flex-col">
                                  {priceDisplay.comparePrice && (
                                    <span className="max-w-full truncate text-xs font-medium leading-4 line-through" style={{ color: colors.mutedText }}>
                                      {formatComparePrice(priceDisplay.comparePrice)}
                                    </span>
                                  )}
                                  <span className="max-w-full truncate whitespace-nowrap text-[12px] font-bold leading-4 md:text-[13px] md:leading-5 lg:text-sm" style={{ color: colors.bodyText }}>
                                    {priceDisplay.label}
                                  </span>
                                </div>
                                {!showAddToCartButton && !showBuyNowButton && (
                                  <a
                                    href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}
                                    className="inline-flex h-6 min-w-9 shrink-0 items-center justify-center whitespace-nowrap rounded px-2 text-[10px] font-medium leading-none transition-colors md:min-w-10 md:px-2.5 md:text-[11px]"
                                    style={{ backgroundColor: colors.buttonSolidBackground, color: colors.buttonSolidText }}
                                  >
                                    Xem
                                  </a>
                                )}
                              </div>
                              {(showAddToCartButton || showBuyNowButton) && (
                                <div className="mt-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                  <ProductCardActions
                                    product={product as any}
                                    tokens={tokens}
                                    showStock={showStock}
                                    showAddToCartButton={showAddToCartButton}
                                    showBuyNowButton={showBuyNowButton}
                                    buyNowLabel="Mua ngay"
                                    onAddToCart={handleAddToCart}
                                    onBuyNow={handleBuyNow}
                                    cartButtonsLayout={cartButtonsLayout}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
            );
          })}
        </div>
      </div>
      {renderQuickAddModal()}
      </>
    );
  }

  // Style 6: Showcase - Gradient overlay với hover effects lung linh
  return (
    <div className={cn('space-y-10 md:space-y-16', sectionSpacingClassName)}>
      {resolvedSections.map((section, idx) => (
        <section key={idx}>
          <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <span 
                  className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: colors.pillText }}
                >
                  Bộ sưu tập
                </span>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mt-1" style={{ color: colors.heading }}>{section.category.name}</h2>
                <div 
                  className="h-1 w-16 rounded-full mt-2"
                      style={{ backgroundColor: colors.sectionAccent }}
                />
              </div>
              {showViewAll && (
                <a 
                  href={buildCategoryPath({ categorySlug: section.category.slug ?? section.category._id, mode: routeMode, moduleKey: 'products' })}
                  className="group flex items-center gap-2 text-sm font-medium transition-colors"
                      style={{ color: colors.buttonText }}
                >
                  Xem danh mục 
                  <span 
                    className="w-8 h-8 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform"
                        style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}` }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </a>
              )}
            </div>
            
            {section.products.length === 0 ? (
              <EmptyProductsState message="Chưa có sản phẩm" />
            ) : (
              <div className={cn('grid gap-5', getGridCols())}>
                {section.products.map((product) => (
                  <div 
                    key={product._id}
                    className="group cursor-pointer flex flex-col justify-between"
                  >
                    <a 
                      href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}
                      className="block mb-2"
                    >
                      {/* Image Container với effects */}
                      <ProductImageWithOverlay
                        frameConfig={frameConfig}
                        watermarkConfig={watermarkConfig}
                        className={cn('relative overflow-hidden mb-3', cardRadiusClassName)}
                        style={imageAspectRatioStyle}
                      >
                        {/* Background gradient on hover */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30"
                          style={{ background: `linear-gradient(135deg, ${colors.neutralBorder} 0%, transparent 50%, ${colors.neutralBackground} 100%)` }}
                        />
                        
                        {product.image ? (
                          <SiteImage 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.imageBackground }}>
                            <Package size={32} style={{ color: colors.emptyStateIcon }} />
                          </div>
                        )}
                        
                        {/* Gradient overlay bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                        
                        {/* Quick action button */}
                        <div className="absolute bottom-3 left-3 right-3 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-30">
                          <span 
                            className="block w-full py-2.5 rounded-xl text-sm font-medium text-center backdrop-blur-sm"
                            style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                          >
                            Xem chi tiết
                          </span>
                        </div>
                        
                        {/* Badge for sale */}
                        {(() => {
                          const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                          if (!priceDisplay.comparePrice) {return null;}
                          return (
                            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500 z-30">
                              -{Math.round((1 - (product.price ?? 0) / priceDisplay.comparePrice) * 100)}%
                            </div>
                          );
                        })()}
                      </ProductImageWithOverlay>
                      
                      {/* Product info */}
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:opacity-80 transition-opacity" style={{ color: colors.bodyText }}>{product.name}</h4>
                        <div className="flex flex-col">
                          {(() => {
                            const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                            if (priceDisplay.comparePrice) {
                              return (
                                <>
                                  <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                                    {priceDisplay.label}
                                  </span>
                                  <span className="text-xs line-through" style={{ color: colors.mutedText }}>{formatComparePrice(priceDisplay.comparePrice)}</span>
                                </>
                              );
                            }
                            return (
                              <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                                {priceDisplay.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </a>
                    {(showAddToCartButton || showBuyNowButton) && (
                      <div className="mt-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <ProductCardActions
                          product={product as any}
                          tokens={tokens}
                          showStock={showStock}
                          showAddToCartButton={showAddToCartButton}
                          showBuyNowButton={showBuyNowButton}
                          buyNowLabel="Mua ngay"
                          onAddToCart={handleAddToCart}
                          onBuyNow={handleBuyNow}
                          cartButtonsLayout={cartButtonsLayout}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
      
      {renderQuickAddModal()}
    </div>
  );
}

// ============ FEATURES SECTION ============
// Shared renderer parity with admin preview (6 styles)
function FeaturesSection({ config, brandColor, secondary, mode, title, isDark }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string; isDark?: boolean }) {
  const rawItems = config.items as unknown;
  const items = Array.isArray(rawItems)
    ? rawItems
      .map((item, index) => {
        if (!item || typeof item !== 'object') {return null;}
        const source = item as Record<string, unknown>;
        const rawId = source.id;
        const normalizedId = typeof rawId === 'number'
          ? rawId
          : (typeof rawId === 'string' ? Number.parseInt(rawId, 10) : Number.NaN);

        return {
          id: Number.isFinite(normalizedId) ? normalizedId : index + 1,
          icon: typeof source.icon === 'string' && source.icon.trim().length > 0 ? source.icon : 'Zap',
          title: typeof source.title === 'string' ? source.title : '',
          description: typeof source.description === 'string' ? source.description : '',
          ...(typeof source.image === 'string' ? { image: source.image } : {}),
        };
      })
      .filter((item): item is { id: number; icon: string; title: string; description: string; image?: string } => item !== null)
    : [];

  const style = (() => {
    const value = config.style;
    if (value === 'iconGrid' || value === 'alternating' || value === 'compact' || value === 'cards' || value === 'carousel' || value === 'timeline' || value === 'carousel6') {
      return value;
    }
    return 'carousel6';
  })();
  const showIcons = config.showIcons !== false;
  const headerConfig = extractSectionHeaderConfig(config);

  return (
    <FeaturesSectionShared
      context="site"
      items={items}
      style={style}
      showIcons={showIcons}
      title={title}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      hideHeader={headerConfig.hideHeader}
      showTitle={headerConfig.showTitle}
      subtitle={headerConfig.subtitle}
      showSubtitle={headerConfig.showSubtitle}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      showBadge={headerConfig.showBadge}
      badgeText={headerConfig.badgeText}
      spacing={headerConfig.spacing}
      desktopColumns={config.desktopColumns === 4 ? 4 : 3}
      cornerRadius={config.cornerRadius === 'none' || config.cornerRadius === 'sm' || config.cornerRadius === 'lg' ? config.cornerRadius : 'lg'}
      isDark={isDark}
    />
  );
}

// ============ PROCESS SECTION ============
// 7 Professional Styles: Horizontal, Stepper, Cards, Accordion, Minimal, Grid, Alternating
function ProcessSection({ config, brandColor, secondary, mode, title, isDark }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: ProcessBrandMode; title: string; isDark?: boolean }) {
  const steps = normalizeProcessRenderSteps(config.steps);
  if (steps.length === 0) {return null;}

  const style = normalizeProcessStyle(config.style);
  const normalizedConfig = normalizeProcessConfig(config);
  const rawDesktopCols = config.desktopColumns;
  const desktopColumns: 3 | 4 = rawDesktopCols === 3 ? 3 : 4;

  return (
    <ProcessSectionShared
      steps={steps}
      sectionTitle={title}
      style={style}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      context="site"
      hideHeader={normalizedConfig.hideHeader}
      showTitle={normalizedConfig.showTitle}
      showSubtitle={normalizedConfig.showSubtitle}
      subtitle={normalizedConfig.subtitle}
      headerAlign={normalizedConfig.headerAlign}
      titleColorPrimary={normalizedConfig.titleColorPrimary}
      subtitleAboveTitle={normalizedConfig.subtitleAboveTitle}
      uppercaseText={normalizedConfig.uppercaseText}
      showBadge={normalizedConfig.showBadge}
      badgeText={normalizedConfig.badgeText}
      desktopColumns={desktopColumns}
      spacing={normalizedConfig.spacing}
      cornerRadius={normalizedConfig.cornerRadius}
      isDark={isDark}
    />
  );
}

// ============ CLIENTS SECTION ============
function ClientsSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  isDark,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: ClientsBrandMode;
  title: string;
  isDark?: boolean;
}) {
  const items = normalizeClientItems(config.items);
  if (items.length === 0) {return null;}

  const style = normalizeClientsStyleSafe(config.style);
  const spacing = normalizeSectionSpacing(config.spacing);
  const cornerRadius = normalizeClientsCornerRadius(config.cornerRadius, config.noBorderRadius);
  const tokens = adaptTokensForDarkMode(getClientsColorTokens({
    primary: brandColor,
    secondary,
    mode,
  }), isDark ?? false);

  return (
    <ClientsSectionShared
      context="site"
      title={title}
      style={style}
      items={items}
      tokens={tokens}
      device="desktop"
      hideHeader={config.hideHeader as boolean | undefined}
      showTitle={config.showTitle as boolean | undefined}
      subtitle={config.subtitle as string | undefined}
      showSubtitle={config.showSubtitle as boolean | undefined}
      headerAlign={config.headerAlign as ClientsHeaderAlign | undefined}
      titleColorPrimary={config.titleColorPrimary as boolean | undefined}
      subtitleAboveTitle={config.subtitleAboveTitle as boolean | undefined}
      uppercaseText={config.uppercaseText as boolean | undefined}
      showBadge={config.showBadge as boolean | undefined}
      badgeText={config.badgeText as string | undefined}
      spacing={spacing}
      cornerRadius={cornerRadius}
      brandColor={brandColor}
    />
  );
}

// ============ VIDEO SECTION ============
// 6 Styles: centered, split, fullwidth, cinema, minimal, parallax

function VideoSection({ config, brandColor, secondary, mode, title, isDark }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: VideoBrandMode; title: string; isDark?: boolean }) {
  const normalizedConfig = normalizeVideoConfig(config);
  const style = normalizeVideoStyle(normalizedConfig.style);

  const tokens = React.useMemo(() => adaptTokensForDarkMode(getVideoColorTokens({
    primary: brandColor,
    secondary,
    mode,
    style,
  }), isDark ?? false), [brandColor, secondary, mode, style, isDark]);

  return (
    <VideoSectionShared
      context="site"
      config={{ ...normalizedConfig, style }}
      style={style}
      tokens={tokens}
      title={title}
      device="desktop"
    />
  );
}

// ============ COUNTDOWN / PROMOTION SECTION ============
// 6 Styles: banner, floating, minimal, split, sticky, popup
// Best Practices: Expired state, accessibility (aria-live)
type CountdownStyle = 'banner' | 'floating' | 'minimal' | 'split' | 'sticky' | 'popup';

// Countdown Timer Hook with expired state
const useCountdownTimer = (endDate: string) => {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, isExpired: false, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    const calculateTime = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, isExpired: true, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        isExpired: false,
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () =>{  clearInterval(timer); };
  }, [endDate]);

  return timeLeft;
};

function _CountdownSection({ config, brandColor, secondary, title }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; title: string }) {
  const heading = (config.heading as string) || title;
  const subHeading = (config.subHeading as string) || '';
  const description = (config.description as string) || '';
  const endDate = (config.endDate as string) || DEFAULT_COUNTDOWN_END_DATE;
  const buttonText = (config.buttonText as string) || '';
  const buttonLink = (config.buttonLink as string) || '#';
  const backgroundImage = (config.backgroundImage as string) || '';
  const discountText = (config.discountText as string) || '';
  const showDays = config.showDays !== false;
  const showHours = config.showHours !== false;
  const showMinutes = config.showMinutes !== false;
  const showSeconds = config.showSeconds !== false;
  const style = (config.style as CountdownStyle) || 'banner';

  const timeLeft = useCountdownTimer(endDate);
  
  // Popup dismiss state - show once per session, dismiss on X/background/skip click
  const [isPopupDismissed, setIsPopupDismissed] = React.useState(() => {
    if (typeof window === 'undefined') {return false;}
    return sessionStorage.getItem('countdown-popup-dismissed') === 'true';
  });
  
  const dismissPopup = () => {
    setIsPopupDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('countdown-popup-dismissed', 'true');
    }
  };

  // Time Unit Component
  const TimeUnit = ({ value, label, variant = 'default' }: { value: number; label: string; variant?: 'default' | 'light' | 'outlined' }) => {
    if (variant === 'light') {
      return (
        <div className="flex flex-col items-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px] md:min-w-[60px]">
            <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">{String(value).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-white/80 mt-1 uppercase tracking-wider">{label}</span>
        </div>
      );
    }
    if (variant === 'outlined') {
      return (
        <div className="flex flex-col items-center">
          <div className="border-2 rounded-lg px-3 py-2 min-w-[50px] md:min-w-[60px]" style={{ borderColor: secondary }}>
            <span className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: secondary }}>{String(value).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <div className="rounded-lg px-3 py-2 min-w-[50px] md:min-w-[60px] text-white" style={{ backgroundColor: brandColor }}>
          <span className="text-2xl md:text-3xl font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
        </div>
        <span className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
      </div>
    );
  };

  // Timer Display
  const renderTimerDisplay = (variant: 'default' | 'light' | 'outlined' = 'default') => (
    <div className="flex items-center gap-2 md:gap-3">
      {showDays && (
        <>
          <TimeUnit value={timeLeft.days} label="Ngày" variant={variant} />
          <span className={`text-xl font-bold ${variant === 'light' ? 'text-white/60' : 'text-slate-300'}`}>:</span>
        </>
      )}
      {showHours && (
        <>
          <TimeUnit value={timeLeft.hours} label="Giờ" variant={variant} />
          <span className={`text-xl font-bold ${variant === 'light' ? 'text-white/60' : 'text-slate-300'}`}>:</span>
        </>
      )}
      {showMinutes && (
        <>
          <TimeUnit value={timeLeft.minutes} label="Phút" variant={variant} />
          {showSeconds && <span className={`text-xl font-bold ${variant === 'light' ? 'text-white/60' : 'text-slate-300'}`}>:</span>}
        </>
      )}
      {showSeconds && <TimeUnit value={timeLeft.seconds} label="Giây" variant={variant} />}
    </div>
  );

  // Style 1: Banner
  if (style === 'banner') {
    return (
      <section 
        className="relative w-full py-10 md:py-16 px-4 overflow-hidden"
        style={{ 
          background: backgroundImage 
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${backgroundImage}) center/cover`
            : `linear-gradient(135deg,  0%, cc 100%)`
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'white' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'white' }} />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {discountText && (
            <div className="inline-block mb-4">
              <span className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider animate-pulse">{discountText}</span>
            </div>
          )}
          {subHeading && <p className="text-white/80 text-sm md:text-base uppercase tracking-wider mb-2">{subHeading}</p>}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">{heading}</h2>
          {description && <p className="text-white/90 mb-6 max-w-2xl mx-auto">{description}</p>}
          <div className="flex justify-center mb-6">{renderTimerDisplay('light')}</div>
          {buttonText && (
            <a href={buttonLink} className="inline-flex items-center gap-2 px-8 py-3 bg-white rounded-lg font-semibold transition-transform hover:scale-105" style={{ color: secondary }}>
              {buttonText}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
          )}
        </div>
      </section>
    );
  }

  // Style 2: Floating
  if (style === 'floating') {
    return (
      <section className="py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ 
              background: backgroundImage 
                ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage}) center/cover`
                : `linear-gradient(135deg, ee 0%,  100%)`
            }}
          >
            {discountText && (
              <div className="absolute -right-12 top-6 rotate-45 bg-yellow-400 text-yellow-900 px-12 py-1 text-sm font-bold shadow-lg">{discountText}</div>
            )}
            <div className="p-6 md:p-10 text-center">
              {subHeading && (
                <div className="inline-block mb-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-xs md:text-sm text-white font-medium uppercase tracking-wider">{subHeading}</span>
                </div>
              )}
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3">{heading}</h2>
              {description && <p className="text-white/80 mb-6 text-sm md:text-base">{description}</p>}
              <div className="flex justify-center mb-6">{renderTimerDisplay('light')}</div>
              {buttonText && (
                <a href={buttonLink} className="inline-flex items-center gap-2 px-6 py-2.5 bg-white rounded-full font-semibold text-sm transition-all hover:shadow-lg hover:scale-105" style={{ color: secondary }}>
                  {buttonText}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Style 3: Minimal
  if (style === 'minimal') {
    return (
      <section className="py-10 md:py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                {discountText && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ backgroundColor: `${secondary}15`, color: secondary }}>{discountText}</span>
                )}
                {subHeading && <p className="text-sm text-slate-500 mb-1">{subHeading}</p>}
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{heading}</h2>
                {description && <p className="text-slate-500 text-sm mb-4">{description}</p>}
                {buttonText && (
                  <a href={buttonLink} className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm text-white transition-colors hover:opacity-90" style={{ backgroundColor: brandColor }}>
                    {buttonText}
                  </a>
                )}
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Kết thúc sau</p>
                {renderTimerDisplay('outlined')}
                {buttonText && (
                  <a href={buttonLink} className="md:hidden inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm text-white mt-4 transition-colors hover:opacity-90" style={{ backgroundColor: brandColor }}>
                    {buttonText}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Expired State Component
  const renderExpiredState = (variant: 'default' | 'light' = 'default') => (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${variant === 'light' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Khuyến mãi đã kết thúc</span>
    </div>
  );

  // Style 4: Split
  if (style === 'split') {
    return (
      <section className="py-8 md:py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-2">
            <div 
              className="relative flex items-center justify-center min-h-[200px] md:min-h-[300px]"
              style={{ 
                background: backgroundImage 
                  ? `url(${backgroundImage}) center/cover`
                  : `linear-gradient(135deg, dd 0%,  100%)`
              }}
            >
              {!backgroundImage && (
                <div className="text-center text-white p-6">
                  {discountText && <div className="text-5xl md:text-7xl font-black mb-2">{discountText}</div>}
                  <div className="text-lg md:text-xl font-medium opacity-90">GIẢM GIÁ</div>
                </div>
              )}
              {backgroundImage && discountText && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold text-xl">{discountText}</div>
              )}
            </div>
            <div className="bg-white p-6 md:p-8 flex flex-col justify-center">
              {subHeading && <p className="text-sm uppercase tracking-wider mb-2" style={{ color: secondary }}>{subHeading}</p>}
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">{heading}</h2>
              {description && <p className="text-slate-500 text-sm mb-5">{description}</p>}
              <div className="mb-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Còn lại</p>
                {timeLeft.isExpired ? renderExpiredState() : renderTimerDisplay('default')}
              </div>
              {buttonText && !timeLeft.isExpired && (
                <a href={buttonLink} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 w-full md:w-auto" style={{ backgroundColor: brandColor }}>
                  {buttonText}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Style 5: Sticky - Compact top bar
  if (style === 'sticky') {
    return (
      <section 
        className="w-full py-3 px-4"
        style={{ backgroundColor: brandColor }}
        role="banner"
        aria-label="Khuyến mãi có thời hạn"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
              {discountText && (
                <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold uppercase">{discountText}</span>
              )}
              <span className="text-white font-semibold text-sm md:text-base">{heading}</span>
            </div>
            <div className="flex items-center gap-2">
              {timeLeft.isExpired ? (
                <span className="text-white/80 text-sm">Đã kết thúc</span>
              ) : (
                <div className="flex items-center gap-1.5 text-white font-mono" role="timer" aria-live="polite">
                  {showDays && (
                    <>
                      <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
                      <span className="text-white/60">:</span>
                    </>
                  )}
                  {showHours && (
                    <>
                      <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                      <span className="text-white/60">:</span>
                    </>
                  )}
                  {showMinutes && (
                    <>
                      <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                      {showSeconds && <span className="text-white/60">:</span>}
                    </>
                  )}
                  {showSeconds && (
                    <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  )}
                </div>
              )}
            </div>
            {buttonText && !timeLeft.isExpired && (
              <a href={buttonLink} className="bg-white px-4 py-1.5 rounded-full text-sm font-semibold transition-transform hover:scale-105 whitespace-nowrap" style={{ color: secondary }}>
                {buttonText}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Style 6: Popup - Full screen modal overlay (default fallback)
  // Only show once per session, can dismiss by clicking X, background, or "Để sau"
  if (style === 'popup' && isPopupDismissed) {
    return null; // Don't render if already dismissed this session
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="countdown-popup-title"
      onClick={dismissPopup} // Click background to dismiss
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl overflow-hidden relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) =>{  e.stopPropagation(); }} // Prevent dismiss when clicking popup content
      >
        {/* Close button */}
        <button 
          type="button" 
          onClick={dismissPopup}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 z-10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image/Visual header */}
        <div 
          className="h-36 md:h-44 flex items-center justify-center"
          style={{ 
            background: backgroundImage 
              ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${backgroundImage}) center/cover`
              : `linear-gradient(135deg, ee 0%,  100%)`
          }}
        >
          {discountText && (
            <div className="text-center text-white">
              <div className="text-5xl md:text-6xl font-black">{discountText}</div>
              <div className="text-sm font-medium opacity-80 mt-1">{subHeading || 'GIẢM GIÁ'}</div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5 md:p-6 text-center">
          <h3 id="countdown-popup-title" className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{heading}</h3>
          {description && <p className="text-slate-500 text-sm mb-4 line-clamp-2">{description}</p>}
          <div className="mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Còn lại</p>
            {timeLeft.isExpired ? renderExpiredState() : renderTimerDisplay('default')}
          </div>
          {buttonText && !timeLeft.isExpired && (
            <a href={buttonLink} className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: brandColor }}>
              {buttonText}
            </a>
          )}
          {/* Skip link */}
          <button type="button" onClick={dismissPopup} className="text-slate-400 text-xs mt-3 hover:text-slate-600 transition-colors">
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ FOOTER SECTION ============
// 6 Styles: classic, modern, corporate, minimal, centered, stacked
// Synced with previews.tsx FooterPreview
interface FooterColumn { id?: number | string; title: string; links: { label: string; url: string }[] }
interface SocialLinkItem { id?: number | string; platform: string; url: string; icon: string }

const SOCIAL_ORIGINAL_COLORS: Record<string, { bg: string; icon: string }> = {
  facebook: { bg: '#1877f2', icon: '#ffffff' },
  instagram: { bg: '#e1306c', icon: '#ffffff' },
  youtube: { bg: '#ff0000', icon: '#ffffff' },
  tiktok: { bg: '#000000', icon: '#ffffff' },
  zalo: { bg: '#0084ff', icon: '#ffffff' },
  twitter: { bg: '#1da1f2', icon: '#ffffff' },
  x: { bg: '#000000', icon: '#ffffff' },
  pinterest: { bg: '#E60023', icon: '#ffffff' },
  linkedin: { bg: '#0a66c2', icon: '#ffffff' },
  github: { bg: '#0f172a', icon: '#ffffff' },
};

function FooterSection({
  config,
  brandColor,
  secondary,
  mode,
  isDark,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: FooterBrandMode;
  isDark?: boolean;
}) {
  const style = (config.style as FooterStyle) || 'classic';
  const logo = (config.logo as string) || '';
  const description = (config.description as string) || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.';
  const columns = (config.columns as FooterColumn[]) || [];
  const socialLinks = (config.socialLinks as SocialLinkItem[]) || [];
  const copyright = (config.copyright as string) || '';
  const snapshotSite = config._snapshotSite as { site_name?: string } | undefined;
  const siteName = snapshotSite?.site_name || 'VietAdmin';
  const logoName = typeof config.logoName === 'string' ? config.logoName.trim() : '';
  const logoAlt = logoName || siteName || 'Logo';
  const logoInitial = (logoName || siteName || 'V').charAt(0);
  const currentYear = new Date().getFullYear();
  const showSocialLinks = config.showSocialLinks !== false;
  const showBctLogo = config.showBctLogo === true;
  const bctLogoType = (config.bctLogoType as 'thong-bao' | 'dang-ky') ?? 'thong-bao';
  const bctLogoLink = typeof config.bctLogoLink === 'string' ? config.bctLogoLink.trim() : '';
  const bctLogoSrc = bctLogoType === 'dang-ky'
    ? '/images/bct/logo-da-dang-ky-bct.webp'
    : '/images/bct/logo-da-thong-bao-bct.png';
  const colors: FooterLayoutColors = getFooterThemeColors(style, brandColor, secondary, mode, isDark ?? false);
  const logoSizeLevel = typeof config.logoSizeLevel === 'number' ? config.logoSizeLevel : 1;
  const resolveLogoSize = (baseSize: number) => getFooterLogoSize(baseSize, logoSizeLevel);
  const logoBackgroundStyle = typeof config.logoBackgroundStyle === 'string' ? config.logoBackgroundStyle as FooterLogoBackgroundStyle : 'none';
  const cornerRadius = config.noBorderRadius === true ? 'none' : config.cornerRadius as FooterCornerRadius | undefined;
  const maxWidthClass = getFooterMaxWidthClass(config.maxWidth as FooterConfig['maxWidth']);
  const waveMaxWidthClass = maxWidthClass === 'max-w-6xl' || maxWidthClass === 'max-w-7xl' ? 'max-w-8xl' : maxWidthClass;
  const sectionSpacingClassName = getFooterSectionSpacingClassName(config.spacing, config.noVerticalMargin);
  const socialRadiusClassName = getFooterCornerRadiusClassName(cornerRadius, 'icon');
  const useOriginalSocialIconColors = config.useOriginalSocialIconColors !== false;
  const resolveSocialStyles = (platform: string, fallbackBg: string, fallbackText: string) => {
    if (!useOriginalSocialIconColors) {
      return { bg: fallbackBg, color: fallbackText, border: '' };
    }
    const original = SOCIAL_ORIGINAL_COLORS[platform];
    if (!original) {
      return { bg: fallbackBg, color: fallbackText, border: '' };
    }
    const isIconDark = original.bg.toLowerCase() <= '#333333';
    const isFooterDark = colors.bg.toLowerCase() <= '#444444';
    const border = (isIconDark && isFooterDark) ? '1.5px solid rgba(255,255,255,0.25)' : '';
    return { bg: original.bg, color: original.icon, border };
  };

  const renderBctLogo = (className = 'h-10') => {
    if (!showBctLogo) {return null;}
    const image = (
      <SiteImage src={bctLogoSrc} alt="Bộ Công Thương" className={`${className} w-auto object-contain`} mode="decorative" />
    );
    if (!bctLogoLink) {return image;}
    return (
      <a href={bctLogoLink} target="_blank" rel="noopener noreferrer">
        {image}
      </a>
    );
  };
  const renderLogoMark = (baseSize: number, imageClassName = 'object-contain', fallbackColor = colors.textOnPrimary) => {
    const size = resolveLogoSize(baseSize);
    const content = logo
      ? <SiteImage src={logo} alt={logoAlt} className={imageClassName} style={{ width: size, height: 'auto' }} mode="logo" />
      : <div className={cn('flex items-center justify-center text-xs font-bold', getFooterCornerRadiusClassName(cornerRadius))} style={{ backgroundColor: colors.primary, color: fallbackColor, width: size, height: size }}>{logoInitial}</div>;

    if (logoBackgroundStyle === 'none') {
      return content;
    }

    return (
      <span
        className={getFooterLogoBackgroundClassName(logoBackgroundStyle, cornerRadius)}
        style={getFooterLogoBackgroundStyle(logoBackgroundStyle, colors.primary)}
      >
        {content}
      </span>
    );
  };

  // Social icons
  const PinterestIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  );
  const renderSocialIcon = (platform: string, size: number = 18) => {
    switch (platform) {
      case 'facebook': {
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
      }
      case 'instagram': {
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
      }
      case 'youtube': {
        return <LucideIcons.Youtube size={size} />;
      }
      case 'tiktok': {
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>;
      }
      case 'zalo': {
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z"/></svg>;
      }
      case 'x': {
        return <X size={size} />;
      }
      case 'pinterest': {
        return <PinterestIcon size={size} />;
      }
      default: {
        return <Globe size={size} />;
      }
    }
  };

  const getSocials = () => socialLinks.length > 0 ? socialLinks : [
    { icon: 'facebook', platform: 'facebook', url: '#' },
    { icon: 'instagram', platform: 'instagram', url: '#' },
    { icon: 'youtube', platform: 'youtube', url: '#' }
  ];

  const getColumns = () => columns.length > 0 ? columns : [
    { links: [{ label: 'Giới thiệu', url: '/about' }, { label: 'Tuyển dụng', url: '/careers' }], title: 'Về chúng tôi' },
    { links: [{ label: 'FAQ', url: '/faq' }, { label: 'Liên hệ', url: '/contact' }], title: 'Hỗ trợ' }
  ];

  // Style 1: Classic — 4-Column Grid (Lofi Gym style)
  if (style === 'classic') {
    return (
      <footer className="w-full" style={{ backgroundColor: colors.classicBg }}>
        <div className={cn(maxWidthClass, 'mx-auto px-3 md:px-4', sectionSpacingClassName)}>
          <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-4 space-y-3">
              {renderLogoMark(28)}
              {logoName && <span className="text-sm font-bold tracking-tight block" style={{ color: colors.heading }}>{logoName}</span>}
              <p className="text-xs leading-relaxed opacity-80" style={{ color: colors.textMuted }}>{description}</p>
            </div>
            <div className="md:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {getColumns().slice(0, 4).map((col, colIdx) => (
                <div key={col.id || `col-${colIdx}`}>
                  <h3 className="font-bold text-[10px] uppercase tracking-wider mb-3 pb-1" style={{ color: colors.heading, borderBottom: `2px solid ${colors.borderSoft}` }}>{col.title}</h3>
                  <ul className="space-y-1.5">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}><span className="text-xs" style={{ color: colors.link }}>{link.label}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="md:col-span-2 space-y-3">
              <h3 className="font-bold text-[10px] uppercase tracking-wider pb-1" style={{ color: colors.heading, borderBottom: `2px solid ${colors.borderSoft}` }}>Kết nối</h3>
              {showSocialLinks && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getSocials().map((s, idx) => {
                    const st = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                    return <span key={idx} className={cn('h-8 w-8 flex items-center justify-center', socialRadiusClassName)} style={{ backgroundColor: st.bg, color: st.color, ...(st.border ? { border: st.border } : {}) }}>{renderSocialIcon(s.platform, 16)}</span>;
                  })}
                </div>
              )}
              {renderBctLogo('h-12')}
            </div>
          </div>
        </div>
        {config.showCopyright !== false && (
          <div style={{ borderTop: `1px solid ${colors.borderSoft}` }}>
            <div className={cn(maxWidthClass, 'mx-auto px-3 md:px-4 py-3 flex items-center justify-center')}>
              <p className="text-[10px] opacity-70" style={{ color: colors.textSubtle }}>{copyright || `© ${currentYear} ${siteName}. All rights reserved.`}</p>
            </div>
          </div>
        )}
      </footer>
    );
  }

  // Style 2: Modern — Info-Rich (Sudes Nest inspired)
  if (style === 'modern') {
    const pc = colors.accent.replace('#', '%23');
    const seigaihaUrl = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='28'%3E%3Cpath d='M56 26v2h-7.75c2.3-1.3 4.94-2 7.75-2zm-26 2a14 14 0 0 0-7.75-2h-4.5A14 14 0 0 0 10 28H0v-2c4.26 0 8.17 1.38 11.36 3.7A13.98 13.98 0 0 1 22 26c3.87 0 7.44 1.56 10 4.1a13.98 13.98 0 0 1 10.64-3.7A15.99 15.99 0 0 1 56 26zM56 20v2c-4.26 0-8.17 1.38-11.36 3.7A13.98 13.98 0 0 0 34 22c-3.87 0-7.44 1.56-10 4.1A13.98 13.98 0 0 0 13.36 22.4 15.99 15.99 0 0 0 0 20v2c4.26 0 8.17-1.38 11.36-3.7A13.98 13.98 0 0 1 22 14c3.87 0 7.44 1.56 10 4.1A13.98 13.98 0 0 1 42.64 14.4 15.99 15.99 0 0 1 56 14v2c-4.26 0-8.17 1.38-11.36 3.7A13.98 13.98 0 0 0 34 16c-3.87 0-7.44 1.56-10 4.1A13.98 13.98 0 0 0 13.36 16.4 15.99 15.99 0 0 0 0 14v2a14 14 0 0 1 11.36 3.7A13.98 13.98 0 0 0 22 8c3.87 0 7.44 1.56 10 4.1A13.98 13.98 0 0 0 42.64 8.4 15.99 15.99 0 0 0 56 8v2c-4.26 0-8.17 1.38-11.36 3.7A13.98 13.98 0 0 1 34 10c-3.87 0-7.44 1.56-10 4.1A13.98 13.98 0 0 1 13.36 10.4 15.99 15.99 0 0 1 0 8V6c4.26 0 8.17 1.38 11.36 3.7A13.98 13.98 0 0 0 22 2c3.87 0 7.44 1.56 10 4.1A13.98 13.98 0 0 0 42.64 2.4 15.99 15.99 0 0 0 56 2V0H0v2a14 14 0 0 1 11.36 3.7A13.98 13.98 0 0 0 22-4c3.87 0 7.44 1.56 10 4.1A13.98 13.98 0 0 0 42.64-3.6 15.99 15.99 0 0 0 56-4' fill='none' stroke='${pc}' stroke-opacity='0.12' stroke-width='0.5'/%3E%3C/svg%3E")`;
    return (
      <footer className="w-full relative" style={{ backgroundColor: colors.bg }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: seigaihaUrl, backgroundSize: '56px 28px' }} />
        <div className={cn(maxWidthClass, 'mx-auto px-3 md:px-4 relative', sectionSpacingClassName)}>
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center gap-2">
                {renderLogoMark(28)}
                {logoName && <span className="text-sm font-bold tracking-tight" style={{ color: colors.heading }}>{logoName}</span>}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{description}</p>
              {showSocialLinks && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {getSocials().map((s, idx) => {
                    const st = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                    return <span key={idx} className={cn('h-8 w-8 flex items-center justify-center', socialRadiusClassName)} style={{ backgroundColor: st.bg, color: st.color, ...(st.border ? { border: st.border } : {}) }}>{renderSocialIcon(s.platform, 16)}</span>;
                  })}
                </div>
              )}
              {renderBctLogo('h-12')}
            </div>
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {getColumns().slice(0, 4).map((col, colIdx) => (
                <div key={col.id || `col-${colIdx}`}>
                  <h3 className="font-bold text-[10px] uppercase tracking-wider mb-2 pb-1 flex items-center gap-1" style={{ color: colors.heading, borderBottom: `1.5px solid ${colors.accent}` }}>
                    <span style={{ color: colors.accent, fontSize: '8px' }}>◆</span> {col.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}><span className="text-xs" style={{ color: colors.link }}>{link.label}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        {config.showCopyright !== false && (
          <div className="w-full relative" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className={cn(maxWidthClass, 'mx-auto px-3 md:px-4 py-3 flex items-center justify-center')}>
              <p className="text-[10px]" style={{ color: colors.textSubtle }}>{copyright || `© ${currentYear} ${siteName}. All rights reserved.`}</p>
            </div>
          </div>
        )}
      </footer>
    );
  }

  // Style 3: Corporate — Split Horizontal Zones
  if (style === 'corporate') {
    return (
      <footer className={cn('w-full', sectionSpacingClassName)} style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
        <div className={cn(maxWidthClass, 'mx-auto px-3 md:px-4')}>
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12 pb-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center gap-2">
                {renderLogoMark(20)}
                {logoName && <span className="text-sm font-bold" style={{ color: colors.heading }}>{logoName}</span>}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{description}</p>
            </div>
            <div className="md:col-span-4">{renderBctLogo('h-10')}</div>
            <div className="md:col-span-3">
              {showSocialLinks && (
                <>
                  <h3 className="font-bold text-[10px] uppercase tracking-wider mb-2" style={{ color: colors.heading }}>Theo dõi</h3>
                  <div className="flex flex-wrap gap-2">
                    {getSocials().map((s, idx) => {
                      const st = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                      return <span key={idx} className={cn('h-8 w-8 flex items-center justify-center', socialRadiusClassName)} style={{ backgroundColor: st.bg, color: st.color, ...(st.border ? { border: st.border } : {}) }}>{renderSocialIcon(s.platform, 16)}</span>;
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {getColumns().slice(0, 4).map((col, colIdx) => (
              <div key={col.id || `col-${colIdx}`}>
                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>{col.title}</h4>
                <ul className="space-y-1">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}><span className="text-xs" style={{ color: colors.link }}>{link.label}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {config.showCopyright !== false && (
            <div className="pt-3 flex items-center justify-center" style={{ borderTop: `1px solid ${colors.borderSoft}` }}>
              <p className="text-[10px]" style={{ color: colors.textSubtle }}>{copyright || `© ${currentYear} ${siteName}. All rights reserved.`}</p>
            </div>
          )}
        </div>
      </footer>
    );
  }

  // Style 4: Minimal — Compact Bar (Sudes Craft inspired)
  if (style === 'minimal') {
    const stripeColor = `${colors.accent}10`;
    const stripeBg = `repeating-linear-gradient(45deg, transparent, transparent 10px, ${stripeColor} 10px, ${stripeColor} 11px)`;
    return (
      <footer className="w-full relative" style={{ backgroundColor: colors.bg }}>
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: stripeBg }} />
        <div className={cn(maxWidthClass, 'mx-auto px-3 md:px-4 relative', sectionSpacingClassName)}>
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center gap-2">
                {renderLogoMark(28)}
                {logoName && <span className="text-sm font-bold tracking-tight" style={{ color: colors.heading }}>{logoName}</span>}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{description}</p>
              {showSocialLinks && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {getSocials().map((s, idx) => {
                    const st = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                    return <span key={idx} className={cn('h-7 w-7 flex items-center justify-center', socialRadiusClassName)} style={{ backgroundColor: st.bg, color: st.color, ...(st.border ? { border: st.border } : {}) }}>{renderSocialIcon(s.platform, 14)}</span>;
                  })}
                </div>
              )}
              {renderBctLogo('h-10')}
            </div>
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {getColumns().slice(0, 4).map((col, colIdx) => (
                <div key={col.id || `col-${colIdx}`}>
                  <h3 className="font-bold text-[10px] uppercase tracking-wider mb-2" style={{ color: colors.heading }}>{col.title}</h3>
                  <ul className="space-y-1.5">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}><span className="text-xs" style={{ color: colors.link }}>{link.label}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        {config.showCopyright !== false && (
          <div className="w-full relative" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <div className={cn(maxWidthClass, 'mx-auto px-3 md:px-4 py-3 flex items-center justify-center')}>
              <p className="text-[10px]" style={{ color: colors.textSubtle }}>{copyright || `© ${currentYear} ${siteName}. All rights reserved.`}</p>
            </div>
          </div>
        )}
      </footer>
    );
  }

  // Style 5: Centered — Magazine 4-Column (Bean Cargo inspired)
  if (style === 'centered') {
    return (
      <footer className="w-full" style={{ backgroundColor: colors.magazineBg }}>
        <div className={cn(maxWidthClass, 'mx-auto px-3 md:px-4', sectionSpacingClassName)}>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {renderLogoMark(28)}
                {logoName && <span className="text-sm font-bold tracking-tight" style={{ color: colors.magazineHeading }}>{logoName}</span>}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: colors.magazineTextMuted }}>{description}</p>
              {showSocialLinks && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {getSocials().map((s, idx) => {
                    const st = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);
                    return <span key={idx} className={cn('h-7 w-7 flex items-center justify-center', socialRadiusClassName)} style={{ backgroundColor: st.bg, color: st.color, ...(st.border ? { border: st.border } : {}) }}>{renderSocialIcon(s.platform, 14)}</span>;
                  })}
                </div>
              )}
              {renderBctLogo('h-10')}
            </div>
            {getColumns().slice(0, 4).map((col, colIdx) => (
              <div key={col.id || `col-${colIdx}`}>
                <h3 className="font-bold text-[10px] tracking-wide mb-2" style={{ color: colors.magazineHeading }}>{col.title}</h3>
                <ul className="space-y-1.5">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}><span className="text-xs" style={{ color: colors.magazineLink }}>{link.label}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {config.showCopyright !== false && (
          <div className="w-full" style={{ backgroundColor: colors.primary }}>
            <div className={cn(maxWidthClass, 'mx-auto px-3 md:px-4 py-3 flex items-center justify-center')}>
              <p className="text-[10px] font-medium" style={{ color: colors.textOnPrimary }}>{copyright || `© ${currentYear} ${siteName}. All rights reserved.`}</p>
            </div>
          </div>
        )}
      </footer>
    );
  }

  // Style 6: Stacked — Wave Decorative (Euro Moto parallax wave, default)
  return (
    <footer className="w-full relative overflow-x-clip" style={{ backgroundColor: 'transparent' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rendererWaveMove {
          0% { transform: translate3d(-90px, 0, 0); }
          100% { transform: translate3d(85px, 0, 0); }
        }
        .renderer-wave-parallax > use {
          animation: rendererWaveMove 25s cubic-bezier(.55,.5,.45,.5) infinite;
        }
        .renderer-wave-parallax > use:nth-child(1) { animation-delay: -2s; animation-duration: 7s; opacity: 0.7; }
        .renderer-wave-parallax > use:nth-child(2) { animation-delay: -3s; animation-duration: 10s; opacity: 0.5; }
        .renderer-wave-parallax > use:nth-child(3) { animation-delay: -4s; animation-duration: 13s; opacity: 0.3; }
        .renderer-wave-parallax > use:nth-child(4) { animation-delay: -5s; animation-duration: 20s; opacity: 1; }
      `}} />
      <div className="w-full relative" style={{ marginBottom: '-1px' }}>
        <svg className="w-full block h-12 sm:h-16 md:h-20" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto" fill={colors.stackedTopBorder}>
          <defs><path id="renderer-gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" /></defs>
          <g className="renderer-wave-parallax">
            <use xlinkHref="#renderer-gentle-wave" x="48" y="0" />
            <use xlinkHref="#renderer-gentle-wave" x="48" y="3" />
            <use xlinkHref="#renderer-gentle-wave" x="48" y="5" />
            <use xlinkHref="#renderer-gentle-wave" x="48" y="7" />
          </g>
        </svg>
      </div>
      <div className="relative" style={{ backgroundColor: colors.stackedTopBorder }}>
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='600' height='600' viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='1'%3E%3Cellipse cx='300' cy='300' rx='280' ry='200'/%3E%3Cellipse cx='300' cy='300' rx='220' ry='160'/%3E%3Cellipse cx='300' cy='300' rx='160' ry='120'/%3E%3Cellipse cx='300' cy='300' rx='100' ry='80'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '300px 300px',
        }} />
        <div className={cn(waveMaxWidthClass, 'mx-auto px-3 md:px-4 relative z-10', sectionSpacingClassName)}>
          <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-3 space-y-2.5">
              {renderLogoMark(24, 'object-contain brightness-110', colors.stackedTextOnBg)}
              {logoName && <span className="text-sm font-bold tracking-tight block" style={{ color: colors.stackedTextOnBg }}>{logoName}</span>}
              <p className="text-xs leading-relaxed opacity-85 max-w-xs" style={{ color: colors.stackedTextOnBg }}>{description}</p>
            </div>
            <div className="md:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {getColumns().slice(0, 4).map((col, colIdx) => (
                <div key={col.id || `col-${colIdx}`}>
                  <h3 className="font-bold text-[10px] uppercase tracking-wider mb-2 pb-1" style={{ color: colors.stackedTextOnBg, borderBottom: '1px solid rgba(255,255,255,0.22)' }}>{col.title}</h3>
                  <ul className="space-y-1">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}><span className="text-xs opacity-75" style={{ color: colors.stackedTextOnBg }}>{link.label}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="md:col-span-3 space-y-2.5">
              {showSocialLinks && (
                <>
                  <h3 className="font-bold text-[10px] uppercase tracking-wider pb-1" style={{ color: colors.stackedTextOnBg, borderBottom: '1px solid rgba(255,255,255,0.22)' }}>Liên kết</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {getSocials().map((s, idx) => {
                      const st = resolveSocialStyles(s.platform, colors.stackedSocialBg, colors.stackedSocialText);
                      return <span key={idx} className={cn('h-8 w-8 flex items-center justify-center', socialRadiusClassName)} style={{ backgroundColor: st.bg, color: st.color, ...(st.border ? { border: st.border } : {}) }}>{renderSocialIcon(s.platform, 16)}</span>;
                    })}
                  </div>
                </>
              )}
              {renderBctLogo('h-10')}
            </div>
          </div>
        </div>
        {config.showCopyright !== false && (
          <div className="relative z-10" style={{ borderTop: '0.8px solid rgba(255,255,255,0.3)' }}>
            <div className={cn(waveMaxWidthClass, 'mx-auto px-3 md:px-4 py-2.5 flex items-center justify-center')}>
              <p className="text-[10px] text-center opacity-70" style={{ color: colors.stackedTextOnBg }}>{copyright || `© ${currentYear} ${siteName}. All rights reserved.`}</p>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}

// ============ MARQUEE SECTION ============
function MarqueeSection({
  config, brandColor, secondary, mode, title, fontStyle, fontClassName, isDark
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  isDark?: boolean;
}) {
  const marqueeMode: MarqueeBrandMode = mode === 'single' ? 'single' : 'dual';
  const tokens = adaptTokensForDarkMode(getMarqueeSectionColors({ primary: brandColor, secondary, mode: marqueeMode }), isDark ?? false);
  const rawItems = Array.isArray(config.items) ? config.items : [];
  const items = rawItems.map((item, idx) => normalizeMarqueeItem(item, idx));
  const style = normalizeMarqueeStyle(config.style);
  const direction = normalizeMarqueeDirection(config.direction);
  const speed = normalizeMarqueeSpeed(config.speed);
  const pauseOnHover = config.pauseOnHover !== false;
  const scale = normalizeMarqueeScale(config.scale);
  const uppercase = config.uppercase === true;
  const headerConfig = extractSectionHeaderConfig(config);
  const spacing = normalizeMarqueeSpacing(headerConfig.spacing, config.noVerticalMargin);
  const cornerRadius = normalizeMarqueeCornerRadius(config.cornerRadius, config.noBorderRadius);


  return (
    <MarqueeSectionShared
      items={items}
      style={style}
      direction={direction}
      speed={speed}
      pauseOnHover={pauseOnHover}
      scale={scale}
      uppercase={uppercase}
      tokens={tokens}
      mode={marqueeMode}
      title={title}
      context="site"
      fontStyle={fontStyle}
      fontClassName={fontClassName}
      hideHeader={headerConfig.hideHeader}
      showTitle={headerConfig.showTitle}
      showSubtitle={headerConfig.showSubtitle}
      subtitle={headerConfig.subtitle}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      showBadge={headerConfig.showBadge}
      badgeText={headerConfig.badgeText}
      spacing={spacing}
      cornerRadius={cornerRadius}
    />
  );
}

// ============ PLACEHOLDER SECTION ============
function PlaceholderSection({ type, title }: { type: string; title: string }) {
  return (
    <section className="py-16 px-4 bg-slate-100">
      <div className="max-w-4xl mx-auto text-center">
        <LayoutTemplate size={48} className="mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">{title}</h3>
        <p className="text-slate-500">Component type “{type}” chưa được implement</p>
      </div>
    </section>
  );
}
