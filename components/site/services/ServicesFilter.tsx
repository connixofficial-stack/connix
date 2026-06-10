'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import type { ServicesListColors } from './colors';

export type ServiceSortOption = 'newest' | 'oldest' | 'popular' | 'title' | 'title_desc' | 'price_asc' | 'price_desc';

interface Category {
  _id: Id<"serviceCategories">;
  name: string;
  slug: string;
}

interface ServicesFilterProps {
  categories: Category[];
  selectedCategory: Id<"serviceCategories"> | null;
  onCategoryChange: (categoryId: Id<"serviceCategories"> | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: ServiceSortOption;
  onSortChange: (sort: ServiceSortOption) => void;
  totalResults: number;
  tokens: ServicesListColors;
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

export function ServicesFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalResults,
  tokens,
}: ServicesFilterProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [localSearch, onSearchChange]);

  const clearFilters = useCallback(() => {
    setLocalSearch('');
    onSearchChange('');
    onCategoryChange(null);
    onSortChange('newest');
  }, [onSearchChange, onCategoryChange, onSortChange]);

  const hasActiveFilters = (selectedCategory ?? searchQuery) || sortBy !== 'newest';
  const selectedCategoryName = categories.find(c => c._id === selectedCategory)?.name;

  return (
    <div className="space-y-3">
      {/* Desktop Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ..."
              value={localSearch}
              onChange={(e) =>{  setLocalSearch(e.target.value); }}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
            />
            {localSearch && (
              <button
                onClick={() => { setLocalSearch(''); onSearchChange(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="hidden lg:block relative">
            <select
              value={selectedCategory ?? ''}
              onChange={(e) => {
                const value = e.target.value as Id<"serviceCategories"> | '';
                onCategoryChange(value ? value : null);
              }}
              className="appearance-none px-4 py-2 pr-10 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 cursor-pointer min-w-[200px]"
              style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="hidden lg:block relative lg:ml-auto">
            <select
              value={sortBy}
              onChange={(e) =>{  onSortChange(e.target.value as ServiceSortOption); }}
              className="appearance-none px-4 py-2 pr-10 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 cursor-pointer"
              style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() =>{  setShowMobileFilters(!showMobileFilters); }}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 rounded-lg text-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc
            {hasActiveFilters && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tokens.primary }}
              />
            )}
          </button>
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {/* Categories */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                Danh mục
              </label>
              <div className="relative">
                <select
                  value={selectedCategory ?? ''}
                  onChange={(e) => {
                    const value = e.target.value as Id<"serviceCategories"> | '';
                    onCategoryChange(value ? value : null);
                  }}
                  className="w-full appearance-none px-4 py-2 pr-10 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                Sắp xếp
              </label>
              <select
                value={sortBy}
                onChange={(e) =>{  onSortChange(e.target.value as ServiceSortOption); }}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': tokens.filterRing } as React.CSSProperties}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Applied Filters & Results Count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Results count */}
          <span className="text-sm text-slate-500">
            {totalResults} dịch vụ
          </span>

          {/* Applied filters */}
          {selectedCategoryName && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: tokens.filterTagBg, color: tokens.filterTagText }}
            >
              {selectedCategoryName}
              <button
                onClick={() =>{  onCategoryChange(null); }}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              &quot;{searchQuery}&quot;
              <button
                onClick={() => { setLocalSearch(''); onSearchChange(''); }}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Clear all filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm hover:underline"
            style={{ color: tokens.primary }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}
