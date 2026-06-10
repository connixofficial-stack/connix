'use client';

import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { Briefcase, Clock, Star } from 'lucide-react';
import React from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import type { ServicesListColors } from '../colors';

interface Service {
  _id: Id<"services">;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail?: string;
  categoryId: Id<"serviceCategories">;
  price?: number;
  duration?: string;
  views: number;
  publishedAt?: number;
  featured?: boolean;
}

interface FullWidthLayoutProps {
  services: Service[];
  tokens: ServicesListColors;
  categoryMap: Map<string, string>;
  viewMode: 'grid' | 'list';
  enabledFields: Set<string>;
  getDetailHref: (service: Service) => string;
  gridColumns?: number;
}

const formatPrice = (price?: number): string => {
  if (price === undefined || price === null) {return '';} 
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
};

export const FullWidthLayout = ({ services, tokens, categoryMap, viewMode, enabledFields, getDetailHref, gridColumns }: FullWidthLayoutProps): React.ReactElement => {
  const showExcerpt = enabledFields.has('excerpt');
  const showPrice = enabledFields.has('price');
  const showDuration = enabledFields.has('duration');
  const showFeatured = enabledFields.has('featured');
  const [brokenThumbnails, setBrokenThumbnails] = React.useState<Set<string>>(new Set());

  const markThumbnailBroken = React.useCallback((id: Id<"services">) => {
    setBrokenThumbnails((prev) => {
      const key = String(id);
      if (prev.has(key)) {return prev;}
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  if (services.length === 0) {
    return (
      <div className="text-center py-16">
        <Briefcase size={64} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-600 mb-2">Không tìm thấy dịch vụ</h2>
        <p className="text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {services.map((service) => {
          const showImage = Boolean(service.thumbnail) && !brokenThumbnails.has(String(service._id));

          return (
            <Link
              key={service._id}
              href={getDetailHref(service)}
              className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ '--tw-ring-color': tokens.primary } as React.CSSProperties}
              aria-label={`Xem chi tiết dịch vụ ${service.title}`}
            >
              <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100 flex flex-col sm:flex-row">
                <div className="sm:w-48 md:w-56 flex-shrink-0">
                  <div className="aspect-video sm:aspect-[4/3] sm:h-full bg-slate-100 overflow-hidden relative">
                    {showImage ? (
                      <Image
                        src={service.thumbnail as string}
                        alt={service.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        mode="thumb"
                        onLoadingComplete={(img) => {
                          if (img.naturalWidth === 0) {
                            markThumbnailBroken(service._id);
                          }
                        }}
                        onError={() =>{  markThumbnailBroken(service._id); }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase size={32} className="text-slate-300" />
                      </div>
                    )}
                    {showFeatured && service.featured && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded flex items-center gap-1">
                        <Star size={10} className="fill-current" /> Nổi bật
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
                    {categoryMap.get(service.categoryId) && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
                      >
                        {categoryMap.get(service.categoryId)}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{service.publishedAt ? new Date(service.publishedAt).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 group-hover:opacity-70 transition-opacity duration-200 line-clamp-2">
                    {service.title}
                  </h2>
                  {showExcerpt && service.excerpt && (
                    <p className="text-sm text-slate-500 line-clamp-1 mt-1">{service.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {showDuration && service.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {service.duration}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {showPrice && service.price !== undefined && (
                        <span className="text-lg font-bold" style={{ color: tokens.priceColor }}>
                          {formatPrice(service.price)}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg text-white"
                        style={{ backgroundColor: tokens.primaryActionBg, color: tokens.primaryActionText }}
                      >
                        Xem ngay
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    );
  }

  // Grid view
  const gridCols = gridColumns ?? 3;
  const gridClass = gridCols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-3`}>
    {services.map((service) => {
      const showImage = Boolean(service.thumbnail) && !brokenThumbnails.has(String(service._id));

      return (
        <Link
          key={service._id}
          href={getDetailHref(service)}
          className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ '--tw-ring-color': tokens.primary } as React.CSSProperties}
          aria-label={`Xem chi tiết dịch vụ ${service.title}`}
        >
          <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100 h-full flex flex-col">
            <div className="aspect-[16/10] bg-slate-100 overflow-hidden relative">
              {showImage ? (
                <Image
                  src={service.thumbnail as string}
                  alt={service.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  mode="thumb"
                  onLoadingComplete={(img) => {
                    if (img.naturalWidth === 0) {
                      markThumbnailBroken(service._id);
                    }
                  }}
                  onError={() =>{  markThumbnailBroken(service._id); }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Briefcase size={40} className="text-slate-300" />
                </div>
              )}
              {showFeatured && service.featured && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded flex items-center gap-1">
                  <Star size={10} className="fill-current" /> Nổi bật
                </div>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                {categoryMap.get(service.categoryId) && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
                  >
                    {categoryMap.get(service.categoryId)}
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:opacity-70 transition-opacity duration-200 flex-1">
                {service.title}
              </h2>
              {showExcerpt && service.excerpt && (
                <p className="text-sm text-slate-500 line-clamp-2 mt-2">{service.excerpt}</p>
              )}
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {showDuration && service.duration && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {service.duration}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {showPrice && service.price !== undefined && (
                    <span className="text-base font-bold" style={{ color: tokens.priceColor }}>
                      {formatPrice(service.price)}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg text-white"
                    style={{ backgroundColor: tokens.primaryActionBg, color: tokens.primaryActionText }}
                  >
                    Xem ngay
                  </span>
                </div>
              </div>
            </div>
          </article>
        </Link>
      );
    })}
    </div>
  );
};
