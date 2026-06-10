'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { Briefcase, ChevronDown, Clock, Eye, Search, Star, TrendingUp } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import type { ServiceSortOption } from '../ServicesFilter';
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

interface Category {
  _id: Id<"serviceCategories">;
  name: string;
  slug: string;
}

interface MagazineLayoutProps {
  services: Service[];
  tokens: ServicesListColors;
  categoryMap: Map<string, string>;
  categories: Category[];
  selectedCategory: Id<"serviceCategories"> | null;
  onCategoryChange: (categoryId: Id<"serviceCategories"> | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: ServiceSortOption;
  onSortChange: (sort: ServiceSortOption) => void;
  featuredServices: Service[];
  enabledFields: Set<string>;
  getDetailHref: (service: Service) => string;
}

function formatPrice(price?: number): string {
  if (price === undefined || price === null) {return '';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
}

const SORT_OPTIONS: { value: ServiceSortOption; label: string }[] = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Xem nhiều', value: 'popular' },
  { label: 'Theo tên A-Z', value: 'title' },
  { label: 'Theo tên Z-A', value: 'title_desc' },
  { label: 'Giá: Thấp đến cao', value: 'price_asc' },
  { label: 'Giá: Cao đến thấp', value: 'price_desc' },
];

export function MagazineLayout({
  services,
  tokens,
  categoryMap,
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  featuredServices,
  enabledFields,
  getDetailHref,
}: MagazineLayoutProps) {
  const ringStyle = { '--tw-ring-color': tokens.filterRing } as React.CSSProperties;
  const showExcerpt = enabledFields.has('excerpt');
  const showPrice = enabledFields.has('price');
  const showDuration = enabledFields.has('duration');
  const [localSearch, setLocalSearch] = React.useState(searchQuery);
  const [brokenThumbnails, setBrokenThumbnails] = React.useState<Set<string>>(new Set());
  const selectedCategoryLabel = selectedCategory ? categoryMap.get(selectedCategory) : undefined;

  const markThumbnailBroken = React.useCallback((id: Id<"services">) => {
    setBrokenThumbnails((prev) => {
      const key = String(id);
      if (prev.has(key)) {return prev;}
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [localSearch, onSearchChange]);
  
  // Separate featured and regular services
  const mainFeatured = featuredServices[0];
  const secondaryFeatured = featuredServices.slice(1, 3);
  const trendingServices = featuredServices.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Hero Section - Featured Stories Widget */}
      {!selectedCategory && mainFeatured && (
        <section className="grid lg:grid-cols-3 gap-4">
          {/* Main Featured - Large Card */}
          <Link
            href={getDetailHref(mainFeatured)}
            className="lg:col-span-2 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={ringStyle}
          >
            <article className="relative h-full min-h-[280px] lg:min-h-[360px] rounded-xl overflow-hidden bg-slate-900">
              {mainFeatured.thumbnail && !brokenThumbnails.has(String(mainFeatured._id)) ? (
                <Image
                  src={mainFeatured.thumbnail}
                  alt={mainFeatured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  mode="thumb"
                  onLoadingComplete={(img) => {
                    if (img.naturalWidth === 0) {
                      markThumbnailBroken(mainFeatured._id);
                    }
                  }}
                  onError={() =>{  markThumbnailBroken(mainFeatured._id); }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <Briefcase size={56} className="text-slate-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-2">
                  {categoryMap.get(mainFeatured.categoryId) && (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold text-white bg-black/60 backdrop-blur-sm ring-1 ring-black/30"
                      style={{ borderColor: tokens.accentBorder }}
                    >
                      {categoryMap.get(mainFeatured.categoryId)}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-black/60 text-white flex items-center gap-1 backdrop-blur-sm ring-1 ring-black/30">
                    <Star size={10} className="fill-current" /> Dịch vụ nổi bật
                  </span>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-white mb-2 leading-tight line-clamp-2">
                  {mainFeatured.title}
                </h2>
                {showExcerpt && mainFeatured.excerpt && (
                  <p className="text-white/70 text-sm line-clamp-2 mb-2">{mainFeatured.excerpt}</p>
                )}
                <div className="flex items-center gap-4">
                  {showPrice && mainFeatured.price !== undefined && (
                    <span className="text-xl font-bold text-white">{formatPrice(mainFeatured.price)}</span>
                  )}
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Eye size={12} />{mainFeatured.views.toLocaleString()}</span>
                    {showDuration && mainFeatured.duration && (
                      <span className="flex items-center gap-1"><Clock size={12} />{mainFeatured.duration}</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </Link>

          {/* Secondary Featured - Stacked Cards */}
          <div className="flex flex-col gap-4">
            {secondaryFeatured.map((service) => (
              <Link
                key={service._id}
                href={getDetailHref(service)}
                className="group flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={ringStyle}
              >
                <article className="relative h-full min-h-[140px] lg:min-h-0 rounded-lg overflow-hidden bg-slate-900">
                  {service.thumbnail && !brokenThumbnails.has(String(service._id)) ? (
                    <Image
                      src={service.thumbnail}
                      alt={service.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
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
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                      <Briefcase size={32} className="text-slate-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {categoryMap.get(service.categoryId) && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white mb-1 bg-black/60 backdrop-blur-sm ring-1 ring-black/30">
                        {categoryMap.get(service.categoryId)}
                      </span>
                    )}
                    <h3 className="text-base font-semibold text-white line-clamp-2">{service.title}</h3>
                    {showPrice && service.price !== undefined && (
                      <span className="text-sm font-bold text-white mt-1 block">{formatPrice(service.price)}</span>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search + Category + Sort Bar */}
      <section className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ..."
              value={localSearch}
              onChange={(e) =>{  setLocalSearch(e.target.value); }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory ?? ''}
              onChange={(e) => {
                const value = e.target.value as Id<"serviceCategories"> | '';
                onCategoryChange(value ? value : null);
              }}
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 min-w-[200px]"
              style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative sm:ml-auto">
            <select
              value={sortBy}
              onChange={(e) =>{  onSortChange(e.target.value as ServiceSortOption); }}
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 min-w-[180px]"
              style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Trending Section - Only show when no category selected */}
      {!selectedCategory && trendingServices.length > 0 && (
        <section className="bg-slate-50 -mx-4 px-4 py-6 lg:-mx-6 lg:px-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} style={{ color: tokens.primary }} />
            <h2 className="text-base font-bold" style={{ color: tokens.sectionHeadingColor }}>Dịch vụ phổ biến</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingServices.map((service, index) => (
              <Link
                key={service._id}
                href={getDetailHref(service)}
                className="group flex gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={ringStyle}
                aria-label={`Xem dịch vụ ${service.title}`}
              >
                <span className="text-2xl font-bold" style={{ color: tokens.highlightNumber }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  {categoryMap.get(service.categoryId) && (
                    <span className="text-xs font-medium" style={{ color: tokens.priceColor }}>{categoryMap.get(service.categoryId)}</span>
                  )}
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:opacity-70 transition-opacity duration-200 mt-0.5">{service.title}</h3>
                  {showPrice && service.price !== undefined && (
                    <span className="text-xs font-bold mt-1 block" style={{ color: tokens.priceColor }}>{formatPrice(service.price)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Services Grid - Clean Card Design */}
      {services.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase size={48} className="mx-auto mb-3 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-600 mb-1">Không tìm thấy dịch vụ</h2>
          <p className="text-sm text-slate-500">Thử chọn danh mục khác</p>
        </div>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-4">
            {selectedCategoryLabel && (
              <h2 className="text-base font-bold" style={{ color: tokens.sectionHeadingColor }}>
                {selectedCategoryLabel}
              </h2>
            )}
            <span className="text-sm text-slate-500">{services.length} dịch vụ</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Link
                key={service._id}
                href={getDetailHref(service)}
                className="group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={ringStyle}
              >
                <article className="h-full flex flex-col">
                  <div className="aspect-[16/10] rounded-lg overflow-hidden bg-slate-100 mb-3 relative">
                    {service.thumbnail && !brokenThumbnails.has(String(service._id)) ? (
                      <Image
                        src={service.thumbnail}
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
                    {service.featured && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded flex items-center gap-1">
                        <Star size={10} className="fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      {categoryMap.get(service.categoryId) && (
                        <span className="text-sm font-medium" style={{ color: tokens.priceColor }}>{categoryMap.get(service.categoryId)}</span>
                      )}
                      <span className="text-slate-300">•</span>
                      <span className="text-sm text-slate-500">{service.publishedAt ? new Date(service.publishedAt).toLocaleDateString('vi-VN') : ''}</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:opacity-70 transition-opacity duration-200">
                      {service.title}
                    </h3>
                    {showExcerpt && service.excerpt && (
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1 flex-1">{service.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Eye size={12} />{service.views.toLocaleString()}</span>
                        {showDuration && service.duration && (
                          <span className="flex items-center gap-1"><Clock size={12} />{service.duration}</span>
                        )}
                      </div>
                      {showPrice && service.price !== undefined && (
                        <span className="text-base font-bold" style={{ color: tokens.priceColor }}>{formatPrice(service.price)}</span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
