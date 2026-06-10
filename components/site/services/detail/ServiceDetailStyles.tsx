'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { QuickContactButtons } from '@/components/site/QuickContact';
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, Clock, Copy, Eye, Image as ImageIcon, ShoppingCart, Star } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import type { ServiceDetailColors } from './_lib/colors';
import { RichContent, withFormatMarker } from '@/components/common/RichContent';
import { buildCategoryPath, buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';

export interface ServiceDetailData {
  _id: Id<"services">;
  title: string;
  slug: string;
  content: string;
  renderType?: 'content' | 'markdown' | 'html';
  markdownRender?: string;
  htmlRender?: string;
  excerpt?: string;
  thumbnail?: string;
  categoryId: Id<"serviceCategories">;
  categoryName: string;
  price?: number;
  duration?: string;
  views: number;
  publishedAt?: number;
  featured?: boolean;
}

export interface RelatedService {
  _id: Id<"services">;
  title: string;
  slug: string;
  categoryId?: Id<"serviceCategories">;
  thumbnail?: string;
  price?: number;
}

type QuickContactConfig = {
  enabled: boolean;
  title: string;
  description: string;
  showPrice: boolean;
  buttonText: string;
  buttonLink: string;
};

type ModernConfig = {
  contactEnabled: boolean;
  contactShowPrice: boolean;
  heroCtaText: string;
  heroCtaLink: string;
  ctaSectionTitle: string;
  ctaSectionDescription: string;
  ctaButtonText: string;
  ctaButtonLink: string;
};

type MinimalConfig = {
  ctaEnabled: boolean;
  showPrice: boolean;
  ctaText: string;
  ctaButtonText: string;
  ctaButtonLink: string;
};

type CommerceCtaConfig = {
  mode: 'cart' | 'contact';
  buttonText?: string;
  buttonHref?: string;
  onAddToCart?: () => Promise<void> | void;
};

function resolveServiceContent(service: ServiceDetailData): string {
  const renderType = service.renderType ?? 'content';

  if (renderType === 'markdown') {
    return service.markdownRender?.trim()
      ? withFormatMarker('markdown', service.markdownRender)
      : '';
  }

  if (renderType === 'html') {
    return service.htmlRender?.trim()
      ? withFormatMarker('html', service.htmlRender)
      : '';
  }

  return service.content ? withFormatMarker('richtext', service.content) : '';
}

export interface StyleProps {
  service: ServiceDetailData;
  brandColor: string;
  tokens: ServiceDetailColors;
  relatedServices: RelatedService[];
  enabledFields: Set<string>;
  showShare?: boolean;
  quickContact?: QuickContactConfig;
  modernConfig?: ModernConfig;
  minimalConfig?: MinimalConfig;
  commerceCta?: CommerceCtaConfig;
  routeMode?: 'unified' | 'namespace';
  categorySlugMap?: Map<string, string>;
}

function formatPrice(price?: number): string {
  if (price === undefined || price === null) {return '';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
}

function formatDate(timestamp?: number): string {
  if (!timestamp) {return '';}
  return new Date(timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ServiceCtaButton({
  service,
  brandColor,
  buttonLabel,
  buttonHref,
  commerceCta,
}: {
  service: ServiceDetailData;
  brandColor: string;
  buttonLabel: string;
  buttonHref?: string;
  commerceCta?: CommerceCtaConfig;
}) {
  if (commerceCta?.mode === 'cart' && commerceCta.onAddToCart) {
    return (
      <button
        type="button"
        onClick={() => void commerceCta.onAddToCart?.()}
        className="w-full min-h-11 px-6 rounded-xl text-white font-semibold transition-all hover:shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2"
        style={{ backgroundColor: brandColor }}
      >
        <ShoppingCart size={18} />
        {commerceCta.buttonText ?? 'Thêm vào giỏ hàng'}
      </button>
    );
  }

  return (
    <QuickContactButtons
      serviceName={service.title}
      brandColor={brandColor}
      buttonLabel={commerceCta?.buttonText ?? buttonLabel}
      buttonHref={commerceCta?.buttonHref ?? buttonHref}
    />
  );
}

function getServiceDetailHref(params: {
  service: Pick<RelatedService, 'slug' | 'categoryId'>;
  routeMode?: 'unified' | 'namespace';
  categorySlugMap?: Map<string, string>;
}) {
  return buildDetailPath({
    categorySlug: params.service.categoryId ? params.categorySlugMap?.get(params.service.categoryId) : undefined,
    mode: normalizeRouteMode(params.routeMode),
    moduleKey: 'services',
    recordSlug: params.service.slug,
  });
}

function FallbackServiceThumb({ tokens }: { tokens: ServiceDetailColors }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        backgroundColor: tokens.fallbackThumbBg,
        color: tokens.fallbackThumbIcon,
      }}
    >
      <ImageIcon size={24} />
    </div>
  );
}

function RelatedServiceThumb({ title, thumbnail, tokens, size }: { title: string; thumbnail?: string; tokens: ServiceDetailColors; size: 'small' | 'large' }) {
  const [hasError, setHasError] = useState(false);
  if (!thumbnail || hasError) {
    return <FallbackServiceThumb tokens={tokens} />;
  }
  return (
    <Image
      src={thumbnail}
      alt={title}
      fill
      sizes={size === 'small' ? '64px' : '(max-width: 768px) 100vw, 33vw'}
      className={size === 'small' ? "object-cover group-hover:scale-110 transition-transform duration-300" : "object-cover group-hover:scale-110 transition-transform duration-500"}
      onError={() =>{  setHasError(true); }}
      mode="thumb"
    />
  );
}

// STYLE 1: CLASSIC - Professional service page with sticky CTA sidebar
export function ClassicStyle({ service, brandColor: _brandColor, tokens, relatedServices, enabledFields, showShare = true, quickContact, commerceCta, routeMode, categorySlugMap }: StyleProps) {
  const showPrice = enabledFields.has('price');
  const showDuration = enabledFields.has('duration');
  const showFeatured = enabledFields.has('featured');
  const resolvedContent = resolveServiceContent(service);
  const quickContactConfig: QuickContactConfig = {
    enabled: true,
    title: 'Liên hệ nhanh',
    description: 'Tư vấn miễn phí, báo giá trong 24h.',
    showPrice: true,
    buttonText: 'Liên hệ tư vấn',
    buttonLink: '',
    ...quickContact,
  };
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window === 'undefined' || !navigator.clipboard) {return;}
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => { setCopied(false); }, 1500);
      })
      .catch(() => { setCopied(false); });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.pageBackground }}>
      <div className="border-b" style={{ borderColor: tokens.border }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-xs md:text-sm" style={{ color: tokens.breadcrumbText }}>
            <Link href="/" className="transition-colors" style={{ color: tokens.breadcrumbText }}>Trang chủ</Link>
            <ChevronRight size={14} />
            <Link href="/services" className="transition-colors" style={{ color: tokens.breadcrumbText }}>Dịch vụ</Link>
            <ChevronRight size={14} />
            <span className="font-medium truncate max-w-[200px]" style={{ color: tokens.breadcrumbActive }}>{service.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-12">
          <div className="lg:col-span-3">
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {showFeatured && service.featured && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full"
                    style={{ backgroundColor: tokens.featuredBadgeBg, color: tokens.featuredBadgeText }}
                  >
                    <Star size={14} className="fill-current" />
                    Dịch vụ nổi bật
                  </span>
                )}
                {service.categoryName && (
                  <Link 
                    href={buildCategoryPath({ categorySlug: categorySlugMap?.get(service.categoryId) ?? '', mode: routeMode ?? 'unified', moduleKey: 'services' })}
                    className="px-3 py-1 text-sm font-medium rounded-full border transition-colors"
                    style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}
                  >
                    {service.categoryName}
                  </Link>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: tokens.headingColor }}>
                {service.title}
              </h1>
              
              {service.excerpt && (
                <p className="text-lg leading-relaxed max-w-[60ch]" style={{ color: tokens.metaText }}>
                  {service.excerpt}
                </p>
              )}

              {showPrice && service.price !== undefined && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wide" style={{ color: tokens.metaText }}>Chi phí dự kiến</p>
                  <p className="text-3xl font-bold" style={{ color: tokens.priceColor }}>
                    {formatPrice(service.price)}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t" style={{ borderColor: tokens.border }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: tokens.metaText }}>
                  <Eye size={16} />
                  <span>{service.views.toLocaleString()} lượt xem</span>
                </div>
                {service.publishedAt && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: tokens.metaText }}>
                    <Calendar size={16} />
                    <span>{formatDate(service.publishedAt)}</span>
                  </div>
                )}
                {showDuration && service.duration && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: tokens.metaText }}>
                    <Clock size={16} />
                    <span>{service.duration}</span>
                  </div>
                )}
              </div>
            </header>

            {service.thumbnail && (
              <div className="mb-8 rounded-2xl overflow-hidden relative aspect-[16/9]" style={{ backgroundColor: tokens.surfaceSoft }}>
                <Image
                  src={service.thumbnail}
                  alt={service.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                  mode="primary"
                />
              </div>
            )}

            {resolvedContent && (
              <RichContent
                content={resolvedContent}
                className="prose prose-lg max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
                style={{ '--tw-prose-body': tokens.bodyText, '--tw-prose-headings': tokens.headingColor, '--tw-prose-links': tokens.linkColor, '--tw-prose-bold': tokens.bodyText } as React.CSSProperties}
              />
            )}

            <div className="mt-12 pt-8 border-t" style={{ borderColor: tokens.border }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                {showShare && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: tokens.metaText }}>Chia sẻ:</span>
                    <button
                      type="button"
                      aria-label="Copy dịch vụ"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full border text-sm font-medium transition-colors"
                      style={{ backgroundColor: tokens.shareButtonBg, color: tokens.shareButtonText, borderColor: tokens.shareButtonBorder }}
                    >
                      <Copy size={16} />
                      {copied ? 'Đã copy' : 'Copy dịch vụ'}
                    </button>
                  </div>
                )}
                <Link 
                  href="/services"
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ color: tokens.linkColor }}
                >
                  <ArrowLeft size={16} />
                  Xem tất cả dịch vụ
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-8 space-y-6">
              {relatedServices.length > 0 && (
                <div className="rounded-2xl p-6" style={{ backgroundColor: tokens.sectionBackground }}>
                  <h3 className="font-bold mb-4" style={{ color: tokens.sectionHeadingColor }}>Dịch vụ liên quan</h3>
                  <div className="space-y-4">
                    {relatedServices.map(s => (
                      <Link 
                        key={s._id} 
                        href={getServiceDetailHref({ service: s, routeMode, categorySlugMap })}
                        className="flex gap-4 group"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative" style={{ backgroundColor: tokens.surface }}>
                          <RelatedServiceThumb title={s.title} thumbnail={s.thumbnail} tokens={tokens} size="small" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:opacity-70 transition-opacity" style={{ color: tokens.relatedTitle }}>
                            {s.title}
                          </h4>
                          {showPrice && s.price !== undefined && (
                            <p className="text-sm font-semibold mt-1" style={{ color: tokens.relatedPrice }}>
                              {formatPrice(s.price)}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {quickContactConfig.enabled && (
                <div className="rounded-xl border px-4 py-3" style={{ borderColor: tokens.quickContactBorder, backgroundColor: tokens.quickContactBg }}>
                  <div className="min-w-0 mb-3">
                    <p className="text-sm font-semibold" style={{ color: tokens.quickContactTitle }}>{quickContactConfig.title}</p>
                    {quickContactConfig.description && (
                      <p className="text-sm" style={{ color: tokens.quickContactDescription }}>{quickContactConfig.description}</p>
                    )}
                  </div>
                  <ServiceCtaButton
                    service={service}
                    brandColor={tokens.ctaPrimaryBg}
                    buttonLabel={quickContactConfig.buttonText}
                    buttonHref={quickContactConfig.buttonLink}
                    commerceCta={commerceCta}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// STYLE 2: MODERN - Landing page style with full-width hero and floating CTA
export function ModernStyle({ service, brandColor: _brandColor, tokens, relatedServices, enabledFields, modernConfig, commerceCta, routeMode, categorySlugMap }: StyleProps) {
  const showPrice = enabledFields.has('price');
  const showDuration = enabledFields.has('duration');
  const showFeatured = enabledFields.has('featured');
  const resolvedContent = resolveServiceContent(service);
  
  const config: ModernConfig = {
    contactEnabled: true,
    contactShowPrice: true,
    heroCtaText: 'Liên hệ tư vấn',
    heroCtaLink: '',
    ctaSectionTitle: 'Sẵn sàng bắt đầu?',
    ctaSectionDescription: 'Liên hệ ngay để được tư vấn miễn phí và nhận báo giá chi tiết cho dự án của bạn.',
    ctaButtonText: 'Liên hệ tư vấn',
    ctaButtonLink: '',
    ...modernConfig,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.pageBackground }}>
      {/* Breadcrumb */}
      <div style={{ backgroundColor: tokens.pageBackground }}>
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs md:text-sm" style={{ color: tokens.breadcrumbText }}>
            <Link href="/" className="transition-colors" style={{ color: tokens.breadcrumbText }}>Trang chủ</Link>
            <ChevronRight size={14} />
            <Link href="/services" className="transition-colors" style={{ color: tokens.breadcrumbText }}>Dịch vụ</Link>
            <ChevronRight size={14} />
            <span className="font-medium truncate max-w-[200px]" style={{ color: tokens.breadcrumbActive }}>{service.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section - Clean & Minimal */}
      <section className="relative overflow-hidden" style={{ backgroundColor: tokens.sectionBackground }}>
        <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="max-w-4xl space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {showFeatured && service.featured && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md"
                  style={{ backgroundColor: tokens.featuredBadgeBg, color: tokens.featuredBadgeText }}
                >
                  <Star size={12} className="fill-current" />
                  Nổi bật
                </span>
              )}
              {service.categoryName && (
                <Link
                  href={buildCategoryPath({ categorySlug: categorySlugMap?.get(service.categoryId) ?? '', mode: routeMode ?? 'unified', moduleKey: 'services' })}
                  className="px-3 py-1 border text-xs font-medium rounded-md transition-opacity hover:opacity-80"
                  style={{ color: tokens.categoryBadgeText, backgroundColor: tokens.categoryBadgeBg, borderColor: tokens.categoryBadgeBorder }}
                >
                  {service.categoryName}
                </Link>
              )}
            </div>

            {/* Title - Shadcn typography scale */}
            <h1 className="text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight" style={{ color: tokens.headingColor }}>
              {service.title}
            </h1>

            {/* Lead text */}
            {service.excerpt && (
              <p className="text-xl leading-relaxed max-w-2xl" style={{ color: tokens.metaText }}>
                {service.excerpt}
              </p>
            )}

            {/* Price & CTA - Inline horizontal layout */}
            {config.contactEnabled && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {showPrice && config.contactShowPrice && service.price !== undefined && (
                  <div className="flex items-center gap-3 px-4 py-2 border rounded-lg" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
                    <div>
                      <p className="text-xs" style={{ color: tokens.metaText }}>Chỉ từ</p>
                      <p className="text-2xl md:text-3xl font-bold leading-none" style={{ color: tokens.priceColor }}>
                        {formatPrice(service.price)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="min-w-[180px]">
                  <ServiceCtaButton
                    service={service}
                    brandColor={tokens.ctaPrimaryBg}
                    buttonLabel={config.heroCtaText}
                    buttonHref={config.heroCtaLink}
                    commerceCta={commerceCta}
                  />
                </div>
              </div>
            )}

            {/* Meta info - Muted */}
            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: tokens.metaText }}>
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span>{service.views.toLocaleString()} lượt xem</span>
              </div>
              {showDuration && service.duration && (
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{service.duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image - Subtle shadow */}
      {service.thumbnail && (
        <div className="max-w-6xl mx-auto px-4 -mt-4 relative z-10">
          <div className="relative rounded-lg overflow-hidden border aspect-[16/9]" style={{ borderColor: tokens.border }}>
            <Image
              src={service.thumbnail}
              alt={service.title}
              fill
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="object-cover"
              mode="primary"
            />
          </div>
        </div>
      )}

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {resolvedContent && (
          <RichContent
            content={resolvedContent}
            className="prose max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg"
            style={{ '--tw-prose-body': tokens.bodyText, '--tw-prose-headings': tokens.headingColor, '--tw-prose-links': tokens.linkColor, '--tw-prose-bold': tokens.bodyText } as React.CSSProperties}
          />
        )}
      </section>

      {/* Related Services - Clean cards */}
      {relatedServices.length > 0 && (
        <section className="py-10 md:py-12" style={{ backgroundColor: tokens.sectionBackground }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: tokens.sectionHeadingColor }}>Dịch vụ liên quan</h2>
              <Link 
                href="/services"
                className="text-sm font-medium flex items-center gap-1 transition-colors"
                style={{ color: tokens.linkMuted }}
              >
                Xem tất cả
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {relatedServices.map((s) => (
                <Link 
                  key={s._id} 
                  href={getServiceDetailHref({ service: s, routeMode, categorySlugMap })}
                  className="group rounded-lg overflow-hidden border transition-colors"
                  style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
                >
                  <div className="aspect-video overflow-hidden relative" style={{ backgroundColor: tokens.surfaceSoft }}>
                    <RelatedServiceThumb title={s.title} thumbnail={s.thumbnail} tokens={tokens} size="large" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-2 line-clamp-2 group-hover:opacity-70 transition-opacity" style={{ color: tokens.relatedTitle }}>
                      {s.title}
                    </h3>
                    {showPrice && s.price !== undefined && (
                      <p className="text-base font-bold" style={{ color: tokens.relatedPrice }}>
                        {formatPrice(s.price)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link 
          href="/services"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: tokens.metaText }}
        >
          <ArrowLeft size={16} />
          Quay lại danh sách dịch vụ
        </Link>
      </div>
    </div>
  );
}

// STYLE 3: MINIMAL - Clean, distraction-free reading experience
export function MinimalStyle({ service, brandColor: _brandColor, tokens, relatedServices, enabledFields, minimalConfig, commerceCta, routeMode, categorySlugMap }: StyleProps) {
  const showDuration = enabledFields.has('duration');
  const showFeatured = enabledFields.has('featured');
  const resolvedContent = resolveServiceContent(service);

  const config: MinimalConfig = {
    ctaEnabled: true,
    showPrice: true,
    ctaText: 'Quan tâm đến dịch vụ này?',
    ctaButtonText: 'Liên hệ tư vấn',
    ctaButtonLink: '',
    ...minimalConfig,
  };

  const showPrice = config.showPrice && enabledFields.has('price');

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.pageBackground }}>
      <article className="max-w-7xl mx-auto px-4 py-12 md:py-18">
        <Link 
          href="/services"
          className="inline-flex items-center gap-2 text-sm mb-10 transition-colors"
          style={{ color: tokens.metaText }}
        >
          <ArrowLeft size={16} />
          Tất cả dịch vụ
        </Link>

        <header className="mb-12 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            {showFeatured && service.featured && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: tokens.featuredBadgeBg, color: tokens.featuredBadgeText }}
              >
                <Star size={12} className="fill-current" />
                Nổi bật
              </span>
            )}
            {service.categoryName && (
              <Link 
                href={buildCategoryPath({ categorySlug: categorySlugMap?.get(service.categoryId) ?? '', mode: routeMode ?? 'unified', moduleKey: 'services' })}
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}
              >
                {service.categoryName}
              </Link>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight" style={{ color: tokens.headingColor }}>
            {service.title}
          </h1>

          {service.excerpt && (
            <p className="text-lg leading-relaxed" style={{ color: tokens.metaText }}>
              {service.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {showPrice && service.price !== undefined && (
              <div className="min-w-[160px]">
                <p className="text-xs uppercase tracking-wide" style={{ color: tokens.metaText }}>Chi phí dự kiến</p>
                <p className="text-2xl font-bold" style={{ color: tokens.priceColor }}>
                {formatPrice(service.price)}
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: tokens.metaText }}>
              {showDuration && service.duration && (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: tokens.chipBg, color: tokens.chipText }}>
                  <Clock size={14} style={{ color: tokens.chipIcon }} />
                  {service.duration}
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: tokens.chipBg, color: tokens.chipText }}>
                <Eye size={14} style={{ color: tokens.chipIcon }} />
                {service.views.toLocaleString()} lượt xem
              </span>
              {service.publishedAt && (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: tokens.chipBg, color: tokens.chipText }}>
                  <Calendar size={14} style={{ color: tokens.chipIcon }} />
                  {formatDate(service.publishedAt)}
                </span>
              )}
            </div>
          </div>
        </header>

        {service.thumbnail && (
          <figure className="mb-12">
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border" style={{ borderColor: tokens.border }}>
              <Image
                src={service.thumbnail}
                alt={service.title}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
                mode="primary"
              />
            </div>
          </figure>
        )}

        {resolvedContent && (
          <RichContent
            content={resolvedContent}
            className="prose max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-blockquote:border-l-2 prose-blockquote:not-italic"
            style={{ '--tw-prose-body': tokens.bodyText, '--tw-prose-headings': tokens.headingColor, '--tw-prose-links': tokens.linkColor, '--tw-prose-bold': tokens.bodyText, '--tw-prose-quote-borders': tokens.linkColor } as React.CSSProperties}
          />
        )}

        {config.ctaEnabled && (
          <div className="mt-14 rounded-2xl border p-6 text-center" style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
            <p className="mb-5" style={{ color: tokens.metaText }}>{config.ctaText}</p>
            
            <div className="max-w-xs mx-auto">
              <ServiceCtaButton
                service={service}
                brandColor={tokens.ctaPrimaryBg}
                buttonLabel={config.ctaButtonText}
                buttonHref={config.ctaButtonLink}
                commerceCta={commerceCta}
              />
            </div>
          </div>
        )}

        {relatedServices.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-6 text-center" style={{ color: tokens.metaText }}>
              Có thể bạn quan tâm
            </h3>
            <div className="space-y-2">
              {relatedServices.map((s, index) => (
                <Link 
                  key={s._id} 
                  href={getServiceDetailHref({ service: s, routeMode, categorySlugMap })}
                  className="group flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors"
                  style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono" style={{ color: tokens.softText }}>{String(index + 1).padStart(2, '0')}</span>
                    <h4 className="font-medium group-hover:opacity-70 transition-opacity" style={{ color: tokens.relatedTitle }}>
                      {s.title}
                    </h4>
                  </div>
                  {showPrice && s.price !== undefined && (
                    <span className="text-sm font-semibold" style={{ color: tokens.relatedPrice }}>
                      {formatPrice(s.price)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
