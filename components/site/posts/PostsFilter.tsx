'use client';

import React, { useCallback, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import type { PostsListColors } from './colors';

export type SortOption = 'newest' | 'oldest' | 'popular' | 'title' | 'title_desc';

interface Category {
  _id: Id<"postCategories">;
  name: string;
  slug: string;
}

interface PostsFilterProps {
  categories: Category[];
  selectedCategory: Id<"postCategories"> | null;
  onCategoryChange: (categoryId: Id<"postCategories"> | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalResults: number;
  tokens: PostsListColors;
  showSearch?: boolean;
  showCategories?: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Xem nhiều', value: 'popular' },
  { label: 'Theo tên A-Z', value: 'title' },
  { label: 'Theo tên Z-A', value: 'title_desc' },
];

export function PostsFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalResults: _totalResults,
  tokens,
  showSearch = true,
  showCategories = true,
}: PostsFilterProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const clearFilters = useCallback(() => {
    onSearchChange('');
    onCategoryChange(null);
    onSortChange('newest');
  }, [onSearchChange, onCategoryChange, onSortChange]);

  const hasActiveFilters =
    ((showCategories && selectedCategory) || (showSearch && searchQuery)) ||
    sortBy !== 'newest';
  const selectedCategoryName = showCategories
    ? categories.find(c => c._id === selectedCategory)?.name
    : undefined;

  return (
    <div className="space-y-2.5">
      {/* Desktop Filter Bar */}
      <div
        className="rounded-lg border p-3 shadow-sm"
        style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.cardBorder }}
      >
        <div className="flex items-center gap-2">
          {/* Search Input */}
          {showSearch && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: tokens.inputIcon }} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) =>{  onSearchChange(e.target.value); }}
                className="w-full pl-9 pr-9 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm placeholder:text-[var(--placeholder-color)]"
                style={{
                  '--tw-ring-color': tokens.inputRing,
                  '--placeholder-color': tokens.inputPlaceholder,
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                } as React.CSSProperties}
              />
              {searchQuery && (
                <button
                  onClick={() =>{  onSearchChange(''); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full"
                >
                  <X className="w-4 h-4" style={{ color: tokens.neutralTextLight }} />
                </button>
              )}
            </div>
          )}

          {/* Category Dropdown - Desktop */}
          {showCategories && (
            <div className="hidden lg:block relative">
              <select
                value={selectedCategory ?? ''}
                onChange={(e) =>{  onCategoryChange(e.target.value ? e.target.value as Id<"postCategories"> : null); }}
                className="appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer min-w-[140px]"
                style={{
                  '--tw-ring-color': tokens.inputRing,
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                } as React.CSSProperties}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: tokens.inputIcon }} />
            </div>
          )}

          {/* Spacer */}
          <div className="hidden lg:block flex-1" />

          {/* Sort Dropdown & Clear Filter - Desktop */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold hover:underline"
                style={{ color: tokens.filterClearText }}
              >
                Xóa bộ lọc
              </button>
            )}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) =>{  onSortChange(e.target.value as SortOption); }}
                className="appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
                style={{
                  '--tw-ring-color': tokens.inputRing,
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                } as React.CSSProperties}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: tokens.inputIcon }} />
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          {(showSearch || showCategories) && (
            <button
              onClick={() =>{  setShowMobileFilters(!showMobileFilters); }}
              className="lg:hidden flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"
              style={{
                borderColor: tokens.inputBorder,
                color: tokens.bodyText,
                backgroundColor: tokens.cardBackground,
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
              {hasActiveFilters && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tokens.filterActiveBg }}
                />
              )}
            </button>
          )}
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (showSearch || showCategories) && (
          <div className="lg:hidden mt-3 pt-3 border-t space-y-3" style={{ borderColor: tokens.cardBorder }}>
            {/* Categories */}
            {showCategories && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: tokens.neutralTextLight }}>
                  Danh mục
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>{  onCategoryChange(null); }}
                    className={`px-2.5 py-1 rounded-full text-sm font-medium transition-colors ${
                      !selectedCategory ? 'text-white' : ''
                    }`}
                    style={!selectedCategory ? {
                      backgroundColor: tokens.filterActiveBg,
                      color: tokens.filterActiveText,
                    } : {
                      backgroundColor: tokens.filterTagBg,
                      color: tokens.filterTagText,
                      borderColor: tokens.filterTagBorder,
                    }}
                  >
                    Tất cả
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() =>{  onCategoryChange(category._id); }}
                      className={`px-2.5 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category._id ? 'text-white' : ''
                      }`}
                      style={selectedCategory === category._id ? {
                        backgroundColor: tokens.filterActiveBg,
                        color: tokens.filterActiveText,
                      } : {
                        backgroundColor: tokens.filterTagBg,
                        color: tokens.filterTagText,
                        borderColor: tokens.filterTagBorder,
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: tokens.neutralTextLight }}>
                Sắp xếp
              </label>
              <select
                value={sortBy}
                onChange={(e) =>{  onSortChange(e.target.value as SortOption); }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{
                  '--tw-ring-color': tokens.inputRing,
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                } as React.CSSProperties}
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

      {/* Applied Filters */}
      {((selectedCategoryName) || (showSearch && searchQuery)) && (
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCategoryName && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: tokens.filterTagBg,
                  color: tokens.filterTagText,
                  borderColor: tokens.filterTagBorder,
                }}
              >
                {selectedCategoryName}
                <button
                  onClick={() =>{  onCategoryChange(null); }}
                  className="hover:opacity-85"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {showSearch && searchQuery && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: tokens.filterTagBg,
                  color: tokens.filterTagText,
                  borderColor: tokens.filterTagBorder,
                }}
              >
                &quot;{searchQuery}&quot;
                <button
                  onClick={() =>{  onSearchChange(''); }}
                  className="hover:opacity-85"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
