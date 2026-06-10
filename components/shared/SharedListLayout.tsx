'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { PageHeaderWithCount } from '@/components/shared/PageHeaderWithCount';

export interface SharedListLayoutProps<T> {
  // Dữ liệu & Trạng thái
  items: T[];
  totalCount?: number;
  isLoading: boolean;
  unit?: string; // Ví dụ: "dự án", "bài viết", "tài nguyên"

  // Cấu hình giao diện
  layoutStyle: 'grid' | 'sidebar' | 'list';
  gridColumns?: number; // 3 hoặc 4 cột
  cornerRadius?: 'none' | 'sm' | 'lg';

  // Thanh tìm kiếm
  showSearch?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;

  // Sắp xếp
  sortBy: string;
  onSortChange: (sort: any) => void;
  sortOptions: { value: string; label: string }[];

  // Bộ lọc chung
  hasActiveFilters: boolean;
  onClearFilters: () => void;

  // Hàm hiển thị nội dung
  renderItem: (item: T, index: number) => React.ReactNode;
  renderSkeleton: () => React.ReactNode;
  emptyMessage?: string;

  // Lắp ráp bộ lọc tùy biến cho Desktop & Mobile
  renderToolbarFilters?: () => React.ReactNode; // Thanh công cụ trên Desktop
  renderSidebarFilters?: () => React.ReactNode; // Sidebar bên trái trên Desktop (chỉ dùng cho layout 'sidebar')
  renderMobileFilters?: (closeSheet: () => void) => React.ReactNode; // Bottom Sheet lọc ở Mobile

  // Phân trang / Trigger Cuộn vô hạn
  paginationNode?: React.ReactNode;
  infiniteScrollTriggerNode?: React.ReactNode;

  // Tùy biến tiêu đề trang (Page Header)
  headerTitle?: string;
  headerDescription?: string;
  brandColor?: string; // Dùng cho các nút và trạng thái active
  isDark?: boolean;
}

function getRadiusClass(radius?: 'none' | 'sm' | 'lg', type: 'card' | 'input' | 'panel' = 'card') {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') {
    if (type === 'panel') return 'rounded-xl';
    return 'rounded-lg';
  }
  if (type === 'panel') return 'rounded-2xl';
  return 'rounded-xl';
}

export function SharedListLayout<T>({
  items,
  totalCount,
  isLoading,
  unit = 'mục',
  layoutStyle,
  gridColumns = 3,
  cornerRadius = 'lg',
  showSearch = true,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  sortBy,
  onSortChange,
  sortOptions,
  hasActiveFilters,
  onClearFilters,
  renderItem,
  renderSkeleton,
  emptyMessage = 'Không tìm thấy kết quả phù hợp.',
  renderToolbarFilters,
  renderSidebarFilters,
  renderMobileFilters,
  paginationNode,
  infiniteScrollTriggerNode,
  headerTitle,
  headerDescription,
  brandColor = '#3b82f6',
  isDark = false,
}: SharedListLayoutProps<T>) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Đóng bottom sheet khi chuyển kích thước màn hình sang desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileFilterOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const radiusClass = getRadiusClass(cornerRadius);
  const panelRadiusClass = getRadiusClass(cornerRadius, 'panel');

  const gridClass = gridColumns === 4
    ? 'grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6';

  // Lắp ghép filter hiển thị trên mobile bottom sheet: ưu tiên renderMobileFilters, sau đó fallback renderSidebarFilters
  const mobileFiltersContent = useMemo(() => {
    if (renderMobileFilters) {
      return renderMobileFilters(() => setMobileFilterOpen(false));
    }
    if (renderSidebarFilters) {
      return renderSidebarFilters();
    }
    return null;
  }, [renderMobileFilters, renderSidebarFilters]);

  const showMobileFilterButton = !!mobileFiltersContent;

  return (
    <div className="py-8 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Tiêu đề trang public căn giữa */}
        {headerTitle && (
          <PageHeaderWithCount
            title={headerTitle}
            count={items.length}
            totalCount={totalCount}
            unit={unit}
            titleColor={brandColor}
            subtitleColor={isDark ? '#86868b' : '#6e6e73'}
            description={headerDescription}
            descriptionColor={isDark ? '#86868b' : '#6e6e73'}
            centered={true}
          />
        )}

        {/* Mobile Toolbar */}
        <div className={`flex lg:hidden flex-col sm:flex-row gap-3 p-3 mb-5 border border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#161617] ${radiusClass}`}>
          {showSearch && (
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-200 bg-white dark:bg-[#1c1c1e] dark:border-zinc-700 dark:text-[#f5f5f7] outline-none text-sm transition focus:border-slate-350 dark:focus:border-zinc-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-[#f5f5f7] transition"
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            {showMobileFilterButton && (
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="h-10 px-4 rounded-lg border border-slate-200 bg-white dark:bg-[#1c1c1e] dark:border-zinc-700 flex items-center justify-center gap-2 text-sm font-semibold transition-colors flex-1 sm:flex-initial dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-[#2c2c2e]"
              >
                <SlidersHorizontal size={16} />
                <span>Bộ lọc</span>
              </button>
            )}

            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="h-10 w-full sm:w-[150px] pl-3 pr-8 rounded-lg border border-slate-200 bg-white dark:bg-[#1c1c1e] dark:border-zinc-700 dark:text-[#f5f5f7] text-sm outline-none font-medium appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '12px',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Layout container */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar: Chỉ hiện ở Desktop khi dùng layoutStyle === 'sidebar' */}
          {layoutStyle === 'sidebar' && renderSidebarFilters && (
            <aside className="hidden lg:block w-64 shrink-0 space-y-4">
              <div
                className={`border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#161617] space-y-4 ${panelRadiusClass}`}
              >
                {renderSidebarFilters()}
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Desktop Toolbar: Search, Custom Filters & Sort dropdown */}
            <div className={`hidden lg:block border border-slate-200 bg-white p-3 mb-5 dark:border-zinc-800 dark:bg-[#161617] ${radiusClass}`}>
              <div className="flex flex-col lg:flex-row gap-3">
                {showSearch && (
                  <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="h-10 w-full pl-10 pr-9 rounded-lg border border-slate-200 bg-white dark:bg-[#1c1c1e] dark:border-zinc-700 dark:text-[#f5f5f7] text-sm outline-none transition focus:border-slate-350 dark:focus:border-zinc-600"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 text-slate-400 dark:text-zinc-500"
                        aria-label="Xóa tìm kiếm"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )}

                {renderToolbarFilters && (
                  <div className="flex items-center gap-2">
                    {renderToolbarFilters()}
                  </div>
                )}

                <div className="flex items-center gap-2 ml-auto shrink-0">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition hover:opacity-85"
                      style={{
                        backgroundColor: isDark ? '#2c2c2e' : `${brandColor}0d`,
                        borderColor: isDark ? '#3a3a3c' : `${brandColor}30`,
                        color: brandColor,
                      }}
                      title="Xóa toàn bộ bộ lọc"
                    >
                      <X size={14} />
                      <span>Xóa lọc</span>
                    </button>
                  )}

                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => onSortChange(e.target.value)}
                      className="h-10 min-w-[140px] pl-3 pr-8 rounded-lg border border-slate-200 bg-white dark:bg-[#1c1c1e] dark:border-zinc-700 dark:text-[#f5f5f7] text-sm outline-none font-medium appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 10px center',
                        backgroundSize: '12px',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* Render items list hoặc skeletons */}
            {isLoading ? (
              renderSkeleton()
            ) : items.length === 0 ? (
              <div className={`rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500 dark:border-zinc-800 dark:text-[#86868b] ${radiusClass}`}>
                {emptyMessage}
              </div>
            ) : layoutStyle === 'grid' || layoutStyle === 'sidebar' ? (
              <div className={gridClass}>
                {items.map((item, index) => renderItem(item, index))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 md:gap-6">
                {items.map((item, index) => renderItem(item, index))}
              </div>
            )}

            {/* Pagination Nodes */}
            {paginationNode}
            {infiniteScrollTriggerNode}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Filters */}
      {mobileFilterOpen && mobileFiltersContent && (
        <>
          {/* Overlay che mờ */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={() => setMobileFilterOpen(false)}
          />
          {/* Bottom Sheet Panel */}
          <div
            className="fixed bottom-0 left-0 right-0 w-full max-h-[82vh] bg-white dark:bg-[#161617] border-t border-slate-200 dark:border-zinc-800 z-50 flex flex-col rounded-t-[28px] shadow-2xl p-5 overflow-hidden transition-transform duration-300 ease-out transform translate-y-0"
          >
            {/* Drag Handle indicator */}
            <div
              className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto mb-4 cursor-pointer hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => setMobileFilterOpen(false)}
            />

            {/* Sheet Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-[#f5f5f7]">Bộ lọc tìm kiếm</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#2c2c2e] text-slate-500 dark:text-zinc-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Filters Content */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-1 pb-4">
              {mobileFiltersContent}
            </div>

            {/* Sticky Action Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-auto flex gap-3 pb-2 bg-white dark:bg-[#161617]">
              <button
                type="button"
                onClick={() => {
                  onClearFilters();
                  setMobileFilterOpen(false);
                }}
                disabled={!hasActiveFilters}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-zinc-800 font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-[#f5f5f7]"
              >
                <span>Thiết lập lại</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 h-11 rounded-xl font-bold text-sm transition-all flex items-center justify-center active:scale-95 text-[#1d1d1f]"
                style={{
                  backgroundColor: brandColor,
                }}
              >
                <span>Áp dụng</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
