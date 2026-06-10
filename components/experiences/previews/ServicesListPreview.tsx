import React from 'react';
import { Briefcase, ChevronDown, Clock, Eye, Folder, Search, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { getServicesListColors, type ServicesListColors } from '@/components/site/services/colors';

type ListLayoutStyle = 'grid' | 'sidebar' | 'list';
type FilterPosition = 'sidebar' | 'top' | 'none';
type DeviceType = 'desktop' | 'tablet' | 'mobile';
type PaginationType = 'pagination' | 'infiniteScroll';

type ServicesListPreviewProps = {
  layoutStyle: ListLayoutStyle;
  gridColumns?: number;
  filterPosition?: FilterPosition;
  paginationType?: PaginationType;
  showSearch?: boolean;
  showCategories?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
};

const MOCK_SERVICES = [
  { _id: '1', title: 'Tư vấn chuyển đổi số cho doanh nghiệp', category: 'Tư vấn', price: 15000000, duration: '3 tháng', views: 1234, featured: true, thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400' },
  { _id: '2', title: 'Thiết kế website chuyên nghiệp', category: 'Thiết kế', price: 25000000, duration: '2 tháng', views: 2340, featured: false, thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400' },
  { _id: '3', title: 'Phát triển ứng dụng di động', category: 'Phát triển', price: 35000000, duration: '4 tháng', views: 890, featured: false, thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400' },
  { _id: '4', title: 'Quản trị hệ thống', category: 'Vận hành', price: 10000000, duration: '1 tháng', views: 432, featured: false, thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400' },
];

const MOCK_CATEGORIES = ['Tất cả', 'Tư vấn', 'Thiết kế', 'Phát triển', 'Vận hành'];

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

function PaginationPreviewServices({ paginationType, tokens }: { paginationType: PaginationType; tokens: ServicesListColors }) {
  if (paginationType === 'pagination') {
    return (
      <div className="text-center mt-8">
        <button
          className="px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          style={{ backgroundColor: tokens.paginationButtonHoverBg, color: tokens.paginationButtonText }}
        >
          1 &nbsp; 2 &nbsp; 3 &nbsp; ... &nbsp; 10
        </button>
      </div>
    );
  }
  return (
    <div className="text-center mt-8 space-y-2">
      <div className="flex justify-center gap-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.loadingDotStrong }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.loadingDotMedium }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.loadingDotSoft }} />
      </div>
      <p className="text-xs text-slate-400">Cuộn để xem thêm...</p>
    </div>
  );
}

// FullWidth Layout (Grid view only)
function FullWidthPreview({ showSearch, showCategories, paginationType = 'pagination', tokens, gridColumns, device }: ServicesListPreviewProps & { tokens: ServicesListColors }) {
  const gridCols = gridColumns ?? 3;
  const gridClass = device === 'mobile'
    ? (gridCols === 4 ? 'grid-cols-2' : 'grid-cols-1')
    : device === 'tablet'
      ? (gridCols === 4 ? 'grid-cols-2' : 'grid-cols-3')
      : (gridCols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3');

  return (
    <div className="py-6 md:py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: tokens.headingColor }}>Dịch vụ của chúng tôi</h1>
        </div>

        {/* Filter Bar */}
        {(showSearch || showCategories) && (
          <div className="mb-8">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {showSearch && (
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: tokens.filterIcon }} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm dịch vụ..."
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm"
                      disabled
                    />
                  </div>
                )}
                
                {showCategories && (
                  <div className="relative">
                    <select className="appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm bg-white min-w-[160px]" disabled>
                      {MOCK_CATEGORIES.map(cat => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                )}
                
                <div className="relative">
                  <select className="appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm bg-white" disabled>
                    <option>Mới nhất</option>
                    <option>Giá tăng dần</option>
                    <option>Giá giảm dần</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Grid */}
        <div className={`grid ${gridClass} gap-3`}>
          {MOCK_SERVICES.map(service => (
            <article key={service._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100 h-full flex flex-col">
              <div className="aspect-[16/10] bg-slate-100 overflow-hidden relative">
                {service.thumbnail ? (
                  <Image src={service.thumbnail} alt={service.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Briefcase size={40} className="text-slate-300" />
                  </div>
                )}
                {service.featured && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded flex items-center gap-1">
                    <Star size={10} className="fill-current" /> Nổi bật
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}>
                    {service.category}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-slate-900 line-clamp-2 flex-1">
                  {service.title}
                </h2>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {service.duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold" style={{ color: tokens.priceColor }}>
                      {formatPrice(service.price)}
                    </span>
                    <span
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg"
                      style={{ backgroundColor: tokens.primaryActionBg, color: tokens.primaryActionText }}
                    >
                      Xem ngay
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <PaginationPreviewServices paginationType={paginationType} tokens={tokens} />
      </div>
    </div>
  );
}

// Sidebar Layout
function SidebarPreview({ showSearch, showCategories, paginationType = 'pagination', tokens }: ServicesListPreviewProps & { tokens: ServicesListColors }) {
  return (
    <div className="py-6 md:py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: tokens.headingColor }}>Dịch vụ của chúng tôi</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              {showSearch && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <Search size={16} style={{ color: tokens.filterIcon }} />
                    Tìm kiếm
                  </h3>
                  <input type="text" placeholder="Nhập từ khóa..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" disabled />
                </div>
              )}

              {showCategories && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <Folder size={16} style={{ color: tokens.filterIcon }} />
                    Danh mục
                  </h3>
                  <ul className="space-y-1">
                    {MOCK_CATEGORIES.map((cat, i) => (
                      <li key={cat}>
                        <button
                          className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors min-h-11 ${i === 0 ? 'font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                          style={i === 0 ? { backgroundColor: tokens.filterActiveBg, color: tokens.filterActiveText } : undefined}
                          disabled
                        >
                          {cat}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-3">Sắp xếp</h3>
                <div className="relative">
                  <select className="w-full appearance-none px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" disabled>
                    <option>Mới nhất</option>
                    <option>Cũ nhất</option>
                    <option>Xem nhiều</option>
                    <option>Giá: Thấp đến cao</option>
                    <option>Giá: Cao đến thấp</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 order-1 lg:order-2">
            <div className="space-y-3">
              {MOCK_SERVICES.map(service => (
                <article key={service._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-44 md:w-52 flex-shrink-0">
                      <div className="aspect-video sm:aspect-[4/3] sm:h-full bg-slate-100 overflow-hidden relative">
                        {service.thumbnail ? (
                          <Image src={service.thumbnail} alt={service.title} fill sizes="96px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase size={32} className="text-slate-300" />
                          </div>
                        )}
                        {service.featured && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded flex items-center gap-1">
                            <Star size={10} className="fill-current" /> Nổi bật
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}>
                          {service.category}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-slate-900 line-clamp-2">
                        {service.title}
                      </h2>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Eye size={12} />{service.views.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Clock size={12} />{service.duration}</span>
                        </div>
                          <span className="text-base font-bold" style={{ color: tokens.priceColor }}>
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <PaginationPreviewServices paginationType={paginationType} tokens={tokens} />
          </main>
        </div>
      </div>
    </div>
  );
}

// Magazine Layout
function MagazinePreview({ showCategories, paginationType = 'pagination', tokens, gridColumns, device }: ServicesListPreviewProps & { tokens: ServicesListColors }) {
  const mainFeatured = MOCK_SERVICES[0];
  const secondaryFeatured = MOCK_SERVICES.slice(1, 3);
  const trendingServices = MOCK_SERVICES.slice(0, 4);
  const gridCols = gridColumns ?? 3;
  const gridClass = device === 'mobile'
    ? (gridCols === 4 ? 'grid-cols-2' : 'grid-cols-1')
    : device === 'tablet'
      ? (gridCols === 4 ? 'grid-cols-2' : 'grid-cols-3')
      : (gridCols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3');

  return (
    <div className="py-6 md:py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: tokens.headingColor }}>Dịch vụ của chúng tôi</h1>
        </div>

        <div className="space-y-6">
          {/* Hero Section */}
          <section className="grid lg:grid-cols-3 gap-4">
            <article className="lg:col-span-2 relative h-full min-h-[280px] lg:min-h-[360px] rounded-xl overflow-hidden bg-slate-900">
              {mainFeatured.thumbnail ? (
                <Image src={mainFeatured.thumbnail} alt={mainFeatured.title} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <Briefcase size={64} className="text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold text-white bg-black/60 backdrop-blur-sm ring-1 ring-black/30">
                    {mainFeatured.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-black/60 text-white flex items-center gap-1 backdrop-blur-sm ring-1 ring-black/30">
                    <Star size={10} className="fill-current" /> Dịch vụ nổi bật
                  </span>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-white mb-2 leading-tight line-clamp-2">
                  {mainFeatured.title}
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-white">{formatPrice(mainFeatured.price)}</span>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Eye size={12} />{mainFeatured.views.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{mainFeatured.duration}</span>
                  </div>
                </div>
              </div>
            </article>

            <div className="flex flex-col gap-4">
              {secondaryFeatured.map(service => (
                <article key={service._id} className="relative flex-1 min-h-[140px] lg:min-h-0 rounded-lg overflow-hidden bg-slate-900">
                  {service.thumbnail ? (
                    <Image src={service.thumbnail} alt={service.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                      <Briefcase size={32} className="text-slate-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white mb-1 bg-black/60 backdrop-blur-sm ring-1 ring-black/30">
                      {service.category}
                    </span>
                    <h3 className="text-base font-semibold text-white line-clamp-2">{service.title}</h3>
                    <span className="text-sm font-bold text-white mt-1 block">{formatPrice(service.price)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Search + Category + Sort */}
          <section className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: tokens.filterIcon }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm dịch vụ..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                  disabled
                />
              </div>

              {showCategories && (
                <div className="relative">
                  <select className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[200px]" disabled>
                    {MOCK_CATEGORIES.map((cat, i) => (
                      <option key={cat} value={i === 0 ? '' : cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}

              <div className="relative sm:ml-auto">
                <select className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[180px]" disabled>
                  <option>Mới nhất</option>
                  <option>Cũ nhất</option>
                  <option>Xem nhiều</option>
                  <option>Giá: Thấp đến cao</option>
                  <option>Giá: Cao đến thấp</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </section>

          {/* Trending */}
          <section className="bg-slate-50 -mx-4 px-4 py-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} style={{ color: tokens.primary }} />
              <h2 className="text-base font-bold" style={{ color: tokens.sectionHeadingColor }}>Dịch vụ phổ biến</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingServices.map((service, index) => (
                <div key={service._id} className="flex gap-3">
                  <span className="text-2xl font-bold" style={{ color: tokens.highlightNumber }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium" style={{ color: tokens.priceColor }}>{service.category}</span>
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mt-0.5">{service.title}</h3>
                    <span className="text-xs font-bold mt-1 block" style={{ color: tokens.priceColor }}>{formatPrice(service.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Main Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: tokens.sectionHeadingColor }}>Dịch vụ mới nhất</h2>
              <span className="text-sm text-slate-500">{MOCK_SERVICES.length} dịch vụ</span>
            </div>
            <div className={`grid ${gridClass} gap-4`}>
              {MOCK_SERVICES.map(service => (
                <article key={service._id} className="h-full flex flex-col">
                  <div className="aspect-[16/10] rounded-lg overflow-hidden bg-slate-100 mb-3 relative">
                    {service.thumbnail ? (
                      <Image src={service.thumbnail} alt={service.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
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
                      <span className="text-sm font-medium" style={{ color: tokens.priceColor }}>{service.category}</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 line-clamp-2">{service.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Eye size={12} />{service.views.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{service.duration}</span>
                      </div>
                      <span className="text-base font-bold" style={{ color: tokens.priceColor }}>{formatPrice(service.price)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <PaginationPreviewServices paginationType={paginationType} tokens={tokens} />
        </div>
      </div>
    </div>
  );
}

// Main Component
export function ServicesListPreview({
  layoutStyle,
  gridColumns,
  filterPosition = 'sidebar',
  paginationType = 'pagination',
  showSearch = true,
  showCategories = true,
  brandColor = '#8b5cf6',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
}: ServicesListPreviewProps) {
  const primaryColor = brandColor || '#8b5cf6';
  const tokens = getServicesListColors(primaryColor, secondaryColor, colorMode);
  const props = {
    layoutStyle,
    gridColumns,
    filterPosition,
    paginationType,
    showSearch,
    showCategories,
    colorMode,
    device,
    tokens,
  };

  // Map layoutStyle to actual implementation
  if (layoutStyle === 'list') {
    return <MagazinePreview {...props} />;
  }
  
  if (layoutStyle === 'sidebar') {
    return <SidebarPreview {...props} />;
  }

  // Default: grid
  return <FullWidthPreview {...props} />;
}
