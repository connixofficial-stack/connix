'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { Briefcase, ChevronDown, Clock, Eye, Folder, Search, Star } from 'lucide-react';
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

interface SidebarLayoutProps {
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
  enabledFields: Set<string>;
   showSearch?: boolean;
   showCategories?: boolean;
  getDetailHref: (service: Service) => string;
  displayMode?: 'grid' | 'list';
  gridColumns?: number;
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

export function SidebarLayout({
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
  enabledFields,
   showSearch = true,
   showCategories = true,
  getDetailHref,
  displayMode = 'list',
  gridColumns,
}: SidebarLayoutProps) {
  const ringStyle = (style?: React.CSSProperties) =>
    ({ ...style, ['--tw-ring-color' as string]: tokens.filterRing } as React.CSSProperties);
  const showExcerpt = enabledFields.has('excerpt');
  const showPrice = enabledFields.has('price');
  const showDuration = enabledFields.has('duration');
  const showFeatured = enabledFields.has('featured');
  const [localSearch, setLocalSearch] = React.useState(searchQuery);
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

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [localSearch, onSearchChange]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <aside className="lg:w-72 flex-shrink-0 order-2 lg:order-1">
        <div className="lg:sticky lg:top-24 space-y-4">
          {/* Search Widget */}
           {showSearch && (
           <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Search size={16} style={{ color: tokens.filterIcon }} />
              Tìm kiếm
            </h3>
            <label htmlFor="services-sidebar-search" className="sr-only">
              Tìm kiếm dịch vụ
            </label>
            <input
              id="services-sidebar-search"
              type="text"
              placeholder="Nhập từ khóa..."
              value={localSearch}
              onChange={(e) =>{  setLocalSearch(e.target.value); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
            />
          </div>
           )}

          {/* Categories Widget */}
           {showCategories && (
           <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Folder size={16} style={{ color: tokens.filterIcon }} />
              Danh mục
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() =>{  onCategoryChange(null); }}
                  className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    !selectedCategory ? 'font-medium' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  style={
                    ringStyle(!selectedCategory ? { backgroundColor: tokens.filterActiveBg, color: tokens.filterActiveText } : undefined)
                  }
                >
                  Tất cả
                </button>
              </li>
              {categories.map((category) => (
                <li key={category._id}>
                  <button
                    onClick={() =>{  onCategoryChange(category._id); }}
                    className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      selectedCategory === category._id ? 'font-medium' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    style={
                      ringStyle(selectedCategory === category._id ? { backgroundColor: tokens.filterActiveBg, color: tokens.filterActiveText } : undefined)
                    }
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
           )}

          {/* Sort Widget */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Sắp xếp</h3>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) =>{  onSortChange(e.target.value as ServiceSortOption); }}
                className="w-full appearance-none px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2"
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

        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 order-1 lg:order-2">
        {services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <Briefcase size={48} className="mx-auto mb-3 text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-600 mb-1">Không tìm thấy dịch vụ</h2>
            <p className="text-sm text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : displayMode === 'grid' ? (
          <div className={`grid ${gridColumns === 4 ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3'} gap-3`}>
            {services.map((service) => {
              const showImage = Boolean(service.thumbnail) && !brokenThumbnails.has(String(service._id));
              return (
                <Link
                  key={service._id}
                  href={getDetailHref(service)}
                  className="group block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
                >
                  <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100 h-full flex flex-col">
                    <div className="aspect-[16/10] bg-slate-100 overflow-hidden relative">
                      {showImage ? (
                        <Image
                          src={service.thumbnail as string}
                          alt={service.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          mode="thumb"
                          onLoadingComplete={(img) => {
                            if (img.naturalWidth === 0) { markThumbnailBroken(service._id); }
                          }}
                          onError={() => { markThumbnailBroken(service._id); }}
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
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-1.5">
                        {categoryMap.get(service.categoryId) && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}>
                            {categoryMap.get(service.categoryId)}
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">
                        {service.title}
                      </h2>
                      {showExcerpt && service.excerpt && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{service.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Eye size={12} />{service.views.toLocaleString()}</span>
                          {showDuration && service.duration && (
                            <span className="flex items-center gap-1"><Clock size={12} />{service.duration}</span>
                          )}
                        </div>
                        {showPrice && service.price !== undefined && (
                          <span className="text-sm font-bold" style={{ color: tokens.priceColor }}>
                            {formatPrice(service.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => {
              const showImage = Boolean(service.thumbnail) && !brokenThumbnails.has(String(service._id));

              return (
                <Link
                  key={service._id}
                  href={getDetailHref(service)}
                  className="group block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
                >
                  <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-44 md:w-52 flex-shrink-0">
                        <div className="aspect-video sm:aspect-[4/3] sm:h-full bg-slate-100 overflow-hidden relative">
                          {showImage ? (
                            <Image
                              src={service.thumbnail as string}
                              alt={service.title}
                              fill
                              sizes="96px"
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
                      <div className="p-4 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1.5">
                          {categoryMap.get(service.categoryId) && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}>
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
                            <span className="flex items-center gap-1"><Eye size={12} />{service.views.toLocaleString()}</span>
                            {showDuration && service.duration && (
                              <span className="flex items-center gap-1"><Clock size={12} />{service.duration}</span>
                            )}
                          </div>
                          {showPrice && service.price !== undefined && (
                            <span className="text-base font-bold" style={{ color: tokens.priceColor }}>
                              {formatPrice(service.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
