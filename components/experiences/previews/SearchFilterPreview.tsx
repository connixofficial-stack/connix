import React from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';

type SearchLayoutStyle = 'search-only' | 'with-filters' | 'advanced';
type ResultsDisplayStyle = 'grid' | 'list';

type SearchFilterPreviewProps = {
  layoutStyle: SearchLayoutStyle;
  resultsDisplayStyle: ResultsDisplayStyle;
  showFilters: boolean;
  showSorting: boolean;
  showResultCount: boolean;
  device?: 'desktop' | 'tablet' | 'mobile';
  brandColor?: string;
};

const mockResults = [
  { id: 1, title: 'iPhone 15 Pro Max', price: 34990000, category: 'Điện thoại' },
  { id: 2, title: 'MacBook Pro 14"', price: 49990000, category: 'Laptop' },
  { id: 3, title: 'AirPods Pro 2', price: 6490000, category: 'Phụ kiện' },
  { id: 4, title: 'iPad Air M2', price: 18990000, category: 'Tablet' },
];

const formatVND = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

function SearchBar({ brandColor = '#14b8a6' }: { brandColor?: string }) {
  return (
    <div className="flex gap-2">
      <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <Search size={18} className="text-slate-400" />
        <input type="text" placeholder="Tìm kiếm sản phẩm..." className="flex-1 bg-transparent text-sm outline-none" disabled />
      </div>
      <button className="px-5 py-3 rounded-xl text-white font-medium text-sm" style={{ backgroundColor: brandColor }}>
        Tìm kiếm
      </button>
    </div>
  );
}

function FilterPanel({ brandColor = '#14b8a6' }: { brandColor?: string }) {
  const categories = ['Điện thoại', 'Laptop', 'Tablet', 'Phụ kiện'];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
        <Filter size={16} style={{ color: brandColor }} />
        <span>Bộ lọc</span>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Khoảng giá</div>
          <div className="flex gap-2">
            <input type="text" placeholder="Từ" className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm" disabled />
            <input type="text" placeholder="Đến" className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm" disabled />
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Danh mục</div>
          <div className="space-y-2">
            {categories.map((cat, i) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: brandColor }} checked={i === 0} readOnly disabled />
                <span className="text-sm text-slate-600">{cat}</span>
              </label>
            ))}
          </div>
        </div>
        <button className="w-full py-2.5 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: brandColor }}>
          Áp dụng
        </button>
      </div>
    </div>
  );
}

function ResultsHeader({ showResultCount, showSorting, brandColor = '#14b8a6' }: { showResultCount: boolean; showSorting: boolean; brandColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      {showResultCount && (
        <div className="text-sm text-slate-600">Tìm thấy <span className="font-semibold" style={{ color: brandColor }}>{mockResults.length}</span> kết quả</div>
      )}
      {showSorting && (
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-slate-400" />
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" disabled>
            <option>Giá thấp đến cao</option>
            <option>Giá cao đến thấp</option>
          </select>
        </div>
      )}
    </div>
  );
}

function ResultCard({ result, displayStyle, brandColor = '#14b8a6' }: { result: typeof mockResults[0]; displayStyle: 'grid' | 'list'; brandColor?: string }) {
  if (displayStyle === 'list') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 hover:shadow-sm transition-shadow">
        <div className="w-24 h-24 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-slate-200 rounded" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
            {result.category}
          </span>
          <h3 className="font-medium text-slate-900 mt-1">{result.title}</h3>
          <p className="text-lg font-bold mt-1" style={{ color: brandColor }}>{formatVND(result.price)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-sm transition-shadow">
      <div className="aspect-square bg-slate-100 flex items-center justify-center">
        <div className="w-20 h-20 bg-slate-200 rounded-lg" />
      </div>
      <div className="p-3">
        <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
          {result.category}
        </span>
        <h3 className="font-medium text-slate-900 text-sm mt-1.5 line-clamp-2">{result.title}</h3>
        <p className="text-base font-bold mt-1.5" style={{ color: brandColor }}>{formatVND(result.price)}</p>
      </div>
    </div>
  );
}

export function SearchFilterPreview({
  layoutStyle,
  resultsDisplayStyle,
  showFilters,
  showSorting,
  showResultCount,
  device = 'desktop',
  brandColor = '#14b8a6',
}: SearchFilterPreviewProps) {
  const isMobile = device === 'mobile';
  const gridCols = isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3';
  const visibleResults = isMobile ? 2 : 4;

  return (
    <div className="py-6 px-4 min-h-[300px]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Tìm kiếm</h1>
        </div>

        {layoutStyle === 'search-only' && (
          <div className="space-y-4">
            <SearchBar brandColor={brandColor} />
            <ResultsHeader showResultCount={showResultCount} showSorting={showSorting} brandColor={brandColor} />
            <div className={resultsDisplayStyle === 'grid' ? `grid ${gridCols} gap-3` : 'space-y-3'}>
              {mockResults.slice(0, visibleResults).map(result => (
                <ResultCard key={result.id} result={result} displayStyle={resultsDisplayStyle} brandColor={brandColor} />
              ))}
            </div>
          </div>
        )}

        {layoutStyle === 'with-filters' && (
          <div className="space-y-4">
            <SearchBar brandColor={brandColor} />
            <div className={isMobile ? 'space-y-4' : 'flex gap-6'}>
              {showFilters && (
                <div className={isMobile ? '' : 'w-64 flex-shrink-0'}>
                  <FilterPanel brandColor={brandColor} />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <ResultsHeader showResultCount={showResultCount} showSorting={showSorting} brandColor={brandColor} />
                <div className={resultsDisplayStyle === 'grid' ? `grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3` : 'space-y-3'}>
                  {mockResults.slice(0, visibleResults).map(result => (
                    <ResultCard key={result.id} result={result} displayStyle={resultsDisplayStyle} brandColor={brandColor} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {layoutStyle === 'advanced' && (
          <div className="space-y-4">
            <SearchBar brandColor={brandColor} />
            {showFilters && (
              <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
                    Điện thoại
                    <X size={14} className="cursor-pointer" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
                    10tr - 50tr
                    <X size={14} className="cursor-pointer" />
                  </span>
                  <button className="text-sm underline" style={{ color: brandColor }}>Xóa tất cả</button>
                </div>
              </div>
            )}
            <ResultsHeader showResultCount={showResultCount} showSorting={showSorting} brandColor={brandColor} />
            <div className={resultsDisplayStyle === 'grid' ? `grid ${gridCols} gap-3` : 'space-y-3'}>
              {mockResults.slice(0, visibleResults).map(result => (
                <ResultCard key={result.id} result={result} displayStyle={resultsDisplayStyle} brandColor={brandColor} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}