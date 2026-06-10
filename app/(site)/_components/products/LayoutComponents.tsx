'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { ProductsListColors } from '@/components/site/products/colors';
import { RichContent } from '@/components/common/RichContent';
import { toRichTextContent } from '@/lib/products/product-supplemental-content';
import { 
  ProductCardProps, 
  ProductGrid, 
  ProductList, 
  ClearFiltersButton, 
  EmptyState 
} from './ProductCardComponents';
import { AttributeFilterGroupWidget, MobileProductsFilters } from './FilterComponents';
import { RangeSlider } from '@/components/shared/RangeSlider';
import { PageHeaderWithCount } from '@/components/shared/PageHeaderWithCount';

export type ProductSortOption = 'newest' | 'oldest' | 'popular' | 'price_asc' | 'price_desc' | 'name' | 'name_desc';
export type ProductsSaleMode = 'cart' | 'contact' | 'affiliate';

export function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = [];
  const siblingCount = 1;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftRange = 3 + 2 * siblingCount;
    for (let i = 1; i <= leftRange; i++) {
      items.push(i);
    }
    items.push('ellipsis');
    items.push(totalPages);
    return items;
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    items.push(firstPageIndex);
    items.push('ellipsis');
    const rightRange = 3 + 2 * siblingCount;
    for (let i = totalPages - rightRange + 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  items.push(firstPageIndex);
  items.push('ellipsis');
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    items.push(i);
  }
  items.push('ellipsis');
  items.push(lastPageIndex);

  return items;
}

interface LayoutProps {
  isLoadingProducts: boolean;
  postsPerPage: number;
  products: ProductCardProps['product'][];
  categories: { _id: Id<"productCategories">; name: string; slug: string; description?: string; filterFooterContent?: string }[];
  categoryMap: Map<string, string>;
  selectedCategory: Id<"productCategories"> | null;
  onCategoryChange: (id: Id<"productCategories"> | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: ProductSortOption;
  onSortChange: (s: ProductSortOption) => void;
  tokens: ProductsListColors;
  showPrice: boolean;
  showSalePrice: boolean;
  showStock: boolean;
  saleMode: ProductsSaleMode;
  totalCount: number | undefined;
  paginationNode?: React.ReactNode;
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  buyNowLabel: string;
  showPromotionBadge: boolean;
  wishlistIdSet: Set<Id<'products'>>;
  onToggleWishlist: (id: Id<'products'>) => void;
  onAddToCart: (product: ProductCardProps['product']) => void;
  onBuyNow: (product: ProductCardProps['product']) => void;
  canUseWishlist: boolean;
  imageAspectRatioStyle: React.CSSProperties;
  frameConfig?: any;
  watermarkConfig?: any;
  getDetailHref: (product: ProductCardProps['product']) => string;
  activeCategoryDoc?: any;
  showCategorySubtitle?: boolean;
  enableCategoryFilterFooterContent?: boolean;
  filterableGroups?: any[];
  selectedAttributes?: Record<string, string[]>;
  onAttributeChange?: (groupSlug: string, termSlug: any, checked: boolean) => void;
  productType?: any;
  selectedPriceRange?: any;
  onPriceRangeChange?: (range: any) => void;
  enableProductTypes?: boolean;
  productTypes?: any[];
  onProductTypeChange?: (slug: string | null) => void;
  attributeFilter?: any;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  radiusClass: string;
  productAttributesMap?: Map<string, any[]>;
  cartButtonsLayout?: 'stack' | 'grid-2';
  showSearch?: boolean;
  showCategories?: boolean;
  priceFilterMode?: 'disabled' | 'custom' | 'smart_dropdown' | 'slider';
  gridColumns?: number;
}

function roundDownToNiceNumber(num: number) {
  if (num <= 10000) return 0;
  if (num <= 100000) return Math.floor(num / 10000) * 10000;
  if (num <= 1000000) return Math.floor(num / 50000) * 50000;
  return Math.floor(num / 100000) * 100000;
}

function roundUpToNiceNumber(num: number) {
  if (num <= 10000) return 10000;
  if (num <= 100000) return Math.ceil(num / 10000) * 10000;
  if (num <= 1000000) return Math.ceil(num / 50000) * 50000;
  return Math.ceil(num / 100000) * 100000;
}

function generateSmartPriceRanges(min: number, max: number) {
  if (min >= max) return [];
  
  const niceMin = roundDownToNiceNumber(min);
  const niceMax = roundUpToNiceNumber(max);
  const range = niceMax - niceMin;

  let step = 10000;
  const targetSegments = 4;
  const rawStep = range / targetSegments;
  
  if (rawStep > 5000000) step = 5000000;
  else if (rawStep > 2000000) step = 2000000;
  else if (rawStep > 1000000) step = 1000000;
  else if (rawStep > 500000) step = 500000;
  else if (rawStep > 200000) step = 200000;
  else if (rawStep > 100000) step = 100000;
  else if (rawStep > 50000) step = 50000;
  else if (rawStep > 20000) step = 20000;
  else step = 10000;

  const milestones: number[] = [];
  const start = Math.ceil(niceMin / step) * step;
  const end = Math.floor(niceMax / step) * step;
  
  for (let val = start + step; val < end; val += step) {
    milestones.push(val);
  }

  // Fallback nếu không sinh ra được milestone nào ở giữa
  if (milestones.length === 0) {
    const mid = Math.round((niceMin + niceMax) / 2 / 50000) * 50000;
    return [
      { label: `Dưới ${mid.toLocaleString()}đ`, minPrice: undefined, maxPrice: mid },
      { label: `Trên ${mid.toLocaleString()}đ`, minPrice: mid, maxPrice: undefined }
    ];
  }

  const options: { label: string; minPrice?: number; maxPrice?: number }[] = [];
  
  options.push({
    label: `Dưới ${milestones[0].toLocaleString()}đ`,
    minPrice: undefined,
    maxPrice: milestones[0]
  });

  for (let i = 0; i < milestones.length - 1; i++) {
    options.push({
      label: `${milestones[i].toLocaleString()}đ - ${milestones[i+1].toLocaleString()}đ`,
      minPrice: milestones[i],
      maxPrice: milestones[i+1]
    });
  }

  options.push({
    label: `Trên ${milestones[milestones.length - 1].toLocaleString()}đ`,
    minPrice: milestones[milestones.length - 1],
    maxPrice: undefined
  });

  return options;
}

function SmartDropdownFilter({
  priceStats,
  searchParams,
  router,
  tokens,
}: {
  priceStats: { minPrice: number; maxPrice: number } | undefined;
  searchParams: any;
  router: any;
  tokens: any;
}) {
  const currentMin = searchParams?.get('minPrice') || '';
  const currentMax = searchParams?.get('maxPrice') || '';

  const options = useMemo(() => {
    if (!priceStats) return [];
    return generateSmartPriceRanges(priceStats.minPrice, priceStats.maxPrice);
  }, [priceStats]);

  const activeValue = useMemo(() => {
    if (!currentMin && !currentMax) return 'all';
    const match = options.find(
      opt => 
        (opt.minPrice === undefined ? '' : String(opt.minPrice)) === currentMin &&
        (opt.maxPrice === undefined ? '' : String(opt.maxPrice)) === currentMax
    );
    return match ? `${match.minPrice ?? ''}-${match.maxPrice ?? ''}` : 'custom';
  }, [currentMin, currentMax, options]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!router) return;
    const value = e.target.value;
    const params = new URLSearchParams(window.location.search);
    
    if (value === 'all') {
      params.delete('minPrice');
      params.delete('maxPrice');
    } else {
      const [minStr, maxStr] = value.split('-');
      if (minStr) {
        params.set('minPrice', minStr);
      } else {
        params.delete('minPrice');
      }
      if (maxStr) {
        params.set('maxPrice', maxStr);
      } else {
        params.delete('maxPrice');
      }
    }
    params.delete('page');
    params.delete('priceRange');
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  if (!priceStats) {
    return <div className="text-sm text-slate-400">Đang tính khoảng giá...</div>;
  }

  return (
    <select
      value={activeValue}
      onChange={handleChange}
      className="w-full px-2.5 py-1.5 border rounded-lg text-sm font-semibold outline-none transition-all cursor-pointer"
      style={{
        borderColor: tokens.inputBorder,
        backgroundColor: tokens.inputBackground,
        color: tokens.inputText,
      }}
    >
      <option value="all">Tất cả khoảng giá</option>
      {options.map((opt) => (
        <option key={opt.label} value={`${opt.minPrice ?? ''}-${opt.maxPrice ?? ''}`}>
          {opt.label}
        </option>
      ))}
      {activeValue === 'custom' && (
        <option value="custom" disabled>Khoảng giá tự chọn</option>
      )}
    </select>
  );
}

function DoubleRangeSlider({
  min,
  max,
  onChange,
  initialMin,
  initialMax,
  tokens,
  brandColor,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
  initialMin: number;
  initialMax: number;
  tokens: any;
  brandColor: string;
}) {
  const step = Math.max(1, Math.min(10000, Math.floor((max - min) / 100)));

  return (
    <RangeSlider
      minLimit={min}
      maxLimit={max}
      valueMin={initialMin}
      valueMax={initialMax}
      step={step}
      primaryColor={brandColor}
      trackColor={tokens.filterChipBg}
      thumbBorderColor="#ffffff"
      unit="đ"
      onValueCommit={onChange}
    />
  );
}

export function CatalogLayout({
  isLoadingProducts,
  postsPerPage,
  products,
  categories,
  categoryMap,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  tokens,
  showPrice,
  showSalePrice,
  showStock,
  saleMode,
  totalCount,
  paginationNode,
  showWishlistButton,
  showAddToCartButton,
  showBuyNowButton,
  buyNowLabel,
  showPromotionBadge,
  wishlistIdSet,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  canUseWishlist,
  imageAspectRatioStyle,
  frameConfig,
  watermarkConfig,
  getDetailHref,
  activeCategoryDoc,
  showCategorySubtitle,
  enableCategoryFilterFooterContent,
  filterableGroups,
  selectedAttributes,
  onAttributeChange,
  productType,
  selectedPriceRange,
  onPriceRangeChange,
  enableProductTypes,
  productTypes,
  onProductTypeChange,
  hasActiveFilters,
  onClearFilters,
  radiusClass,
  productAttributesMap,
  cartButtonsLayout,
  showSearch = true,
  showCategories = true,
  priceFilterMode = 'custom',
  gridColumns
}: LayoutProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categories, categoryQuery]);

  let searchParams: any = null;
  let router: any = null;
  try {
    searchParams = useSearchParams();
    router = useRouter();
  } catch {}

  const currentMinPrice = searchParams ? (searchParams.get('minPrice') || '') : '';
  const currentMaxPrice = searchParams ? (searchParams.get('maxPrice') || '') : '';

  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

  const priceStats = useQuery(api.products.getPriceRangeStats);

  useEffect(() => {
    setMinPriceInput(currentMinPrice);
  }, [currentMinPrice]);

  useEffect(() => {
    setMaxPriceInput(currentMaxPrice);
  }, [currentMaxPrice]);

  const handleApplyPrice = () => {
    if (!router) return;
    const params = new URLSearchParams(window.location.search);
    if (minPriceInput) {
      params.set('minPrice', minPriceInput);
    } else {
      params.delete('minPrice');
    }
    if (maxPriceInput) {
      params.set('maxPrice', maxPriceInput);
    } else {
      params.delete('maxPrice');
    }
    params.delete('page');
    params.delete('priceRange');
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="py-6 md:py-10 px-3 md:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <PageHeaderWithCount
          title={activeCategoryDoc?.name ?? (enableProductTypes ? productType?.name : null) ?? 'Sản phẩm'}
          count={products.length}
          totalCount={totalCount}
          unit="sản phẩm"
          titleColor={tokens.headingColor}
          subtitleColor={tokens.metaText}
          description={showCategorySubtitle && activeCategoryDoc?.description ? activeCategoryDoc.description : undefined}
          descriptionColor={tokens.bodyText}
          centered={true}
        />

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 mt-6 md:mt-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-4">
            {enableProductTypes && productTypes && productTypes.length > 0 && (
              <div className={`${radiusClass} border p-4 space-y-3`} style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
                <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: tokens.bodyText }}>Nhóm sản phẩm</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => onProductTypeChange?.(null)}
                    className={`w-full py-2 px-3 rounded-lg text-left text-sm transition-colors ${!productType ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-zinc-200'}`}
                    style={!productType
                      ? { backgroundColor: `${tokens.primary}12`, color: tokens.primary }
                      : undefined
                    }
                  >
                    Tất cả nhóm
                  </button>
                  {productTypes.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => onProductTypeChange?.(t.slug)}
                      className={`w-full py-2 px-3 rounded-lg text-left text-sm transition-colors ${productType?.slug === t.slug ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-zinc-200'}`}
                      style={productType?.slug === t.slug
                        ? { backgroundColor: `${tokens.primary}12`, color: tokens.primary }
                        : undefined
                      }
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showCategories && (
              <div className={`${radiusClass} border p-4 space-y-3`} style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
                <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: tokens.bodyText }}>
                  Danh mục sản phẩm
                </h3>
                {categories.length > 8 && (
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Tìm nhanh danh mục..."
                      value={categoryQuery}
                      onChange={(e) => setCategoryQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 border rounded-md text-xs outline-none"
                      style={{
                        borderColor: tokens.inputBorder,
                        backgroundColor: tokens.inputBackground,
                        color: tokens.inputText,
                      }}
                    />
                    <Search
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: tokens.inputIcon }}
                    />
                    {categoryQuery && (
                      <button
                        onClick={() => setCategoryQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                        style={{ color: tokens.inputIcon }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}
                <div 
                  className={`space-y-1 ${categories.length > 8 ? 'max-h-72 overflow-y-auto pr-1' : ''}`}
                >
                  {(!categoryQuery || 'tất cả danh mục'.includes(categoryQuery.toLowerCase())) && (
                    <button
                      onClick={() => onCategoryChange(null)}
                      className={`w-full py-2 px-3 rounded-lg text-left text-sm transition-colors ${!selectedCategory ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-zinc-200'}`}
                      style={!selectedCategory
                        ? { backgroundColor: `${tokens.primary}12`, color: tokens.primary }
                        : undefined
                      }
                    >
                      Tất cả danh mục
                    </button>
                  )}
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => onCategoryChange(cat._id)}
                      className={`w-full py-2 px-3 rounded-lg text-left text-sm transition-colors ${selectedCategory === cat._id ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-zinc-200'}`}
                      style={selectedCategory === cat._id
                        ? { backgroundColor: `${tokens.primary}12`, color: tokens.primary }
                        : undefined
                      }
                    >
                      {cat.name}
                    </button>
                  ))}
                  {categories.length > 8 && filteredCategories.length === 0 && (!categoryQuery || !'tất cả danh mục'.includes(categoryQuery.toLowerCase())) && (
                    <div className="px-2.5 py-2 text-xs opacity-60" style={{ color: tokens.metaText }}>
                      Không tìm thấy kết quả.
                    </div>
                  )}
                </div>
              </div>
            )}

            {enableProductTypes && productType?.priceRanges && productType.priceRanges.length > 0 && (
              <div className={`${radiusClass} border p-4 space-y-3`} style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
                <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: tokens.bodyText }}>Khoảng giá</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => onPriceRangeChange?.(null)}
                    className={`w-full py-2 px-3 rounded-lg text-left text-sm transition-colors ${!selectedPriceRange ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-zinc-200'}`}
                    style={!selectedPriceRange
                      ? { backgroundColor: `${tokens.primary}12`, color: tokens.primary }
                      : undefined
                    }
                  >
                    Tất cả khoảng giá
                  </button>
                  {productType.priceRanges.map((range: any) => (
                    <button
                      key={range.slug}
                      onClick={() => onPriceRangeChange?.(range)}
                      className={`w-full py-2 px-3 rounded-lg text-left text-sm transition-colors ${selectedPriceRange?.slug === range.slug ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-zinc-200'}`}
                      style={selectedPriceRange?.slug === range.slug
                        ? { backgroundColor: `${tokens.primary}12`, color: tokens.primary }
                        : undefined
                      }
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Khung Khoảng giá tự chọn hoặc nâng cao */}
            {priceFilterMode !== 'disabled' && (
              <div className={`${radiusClass} border p-4 space-y-3`} style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
                <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: tokens.bodyText }}>Khoảng giá (đ)</h3>
                
                {priceFilterMode === 'custom' && (
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="number"
                      placeholder="Từ"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
                      className="w-[42%] px-2 py-1.5 border rounded-lg text-sm placeholder:text-[var(--placeholder-color)] outline-none"
                      style={{
                        borderColor: tokens.inputBorder,
                        backgroundColor: tokens.inputBackground,
                        color: tokens.inputText,
                        '--placeholder-color': tokens.inputPlaceholder,
                      } as React.CSSProperties}
                    />
                    <span className="text-slate-400 dark:text-slate-500 font-bold">-</span>
                    <input
                      type="number"
                      placeholder="Đến"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
                      className="w-[42%] px-2 py-1.5 border rounded-lg text-sm placeholder:text-[var(--placeholder-color)] outline-none"
                      style={{
                        borderColor: tokens.inputBorder,
                        backgroundColor: tokens.inputBackground,
                        color: tokens.inputText,
                        '--placeholder-color': tokens.inputPlaceholder,
                      } as React.CSSProperties}
                    />
                    <button
                      type="button"
                      onClick={handleApplyPrice}
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-semibold transition-all hover:bg-slate-200 dark:hover:bg-zinc-800 active:scale-95 text-sm shrink-0 border border-slate-200 dark:border-zinc-800"
                      style={{
                        backgroundColor: tokens.filterChipBg,
                        color: tokens.primary,
                      }}
                      title="Áp dụng lọc giá"
                    >
                      ✓
                    </button>
                  </div>
                )}

                {priceFilterMode === 'smart_dropdown' && (
                  <SmartDropdownFilter
                    priceStats={priceStats}
                    searchParams={searchParams}
                    router={router}
                    tokens={tokens}
                  />
                )}

                {priceFilterMode === 'slider' && priceStats && priceStats.maxPrice > priceStats.minPrice && (
                  <DoubleRangeSlider
                    min={priceStats.minPrice}
                    max={priceStats.maxPrice}
                    initialMin={currentMinPrice ? Number(currentMinPrice) : priceStats.minPrice}
                    initialMax={currentMaxPrice ? Number(currentMaxPrice) : priceStats.maxPrice}
                    tokens={tokens}
                    brandColor={tokens.filterChipActiveBg}
                    onChange={(minVal, maxVal) => {
                      if (!router) return;
                      const params = new URLSearchParams(window.location.search);
                      if (minVal === priceStats!.minPrice && maxVal === priceStats!.maxPrice) {
                        params.delete('minPrice');
                        params.delete('maxPrice');
                      } else {
                        params.set('minPrice', String(minVal));
                        params.set('maxPrice', String(maxVal));
                      }
                      params.delete('page');
                      params.delete('priceRange');
                      router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
                    }}
                  />
                )}
              </div>
            )}

            {filterableGroups && filterableGroups.length > 0 && (
              <div className="space-y-4">
                {filterableGroups.map((group) => (
                  <div key={group._id} className={`${radiusClass} border p-4 space-y-3`} style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
                    <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: tokens.bodyText }}>{group.name}</h3>
                    <AttributeFilterGroupWidget
                      group={group}
                      selectedAttributes={selectedAttributes}
                      onAttributeChange={onAttributeChange}
                      tokens={tokens}
                    />
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Main Area */}
          <div className="flex-1 min-w-0">

            {/* Toolbar Filters Mobile Controls - Chỉ hiện dưới lg */}
            <div
              className={`flex lg:hidden flex-col sm:flex-row gap-3 p-3 mb-5 border ${radiusClass}`}
              style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}
            >
              {showSearch && (
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inputIcon }} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full h-10 pl-10 pr-9 rounded-lg border outline-none text-sm"
                    style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBackground, color: tokens.inputText }}
                  />
                  {searchQuery && (
                    <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inputIcon }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="h-10 px-4 rounded-lg border flex items-center justify-center gap-2 text-sm font-semibold transition-colors bg-white dark:bg-slate-800 flex-1 sm:flex-initial"
                  style={{ borderColor: tokens.inputBorder }}
                >
                  <SlidersHorizontal size={16} />
                  <span>Bộ lọc</span>
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
                  className="h-10 px-3 rounded-lg border text-sm outline-none font-medium appearance-none min-w-[140px] text-center flex-1 sm:flex-initial"
                  style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBackground, color: tokens.inputText }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="popular">Bán chạy</option>
                  <option value="price_asc">Giá thấp → cao</option>
                  <option value="price_desc">Giá cao → thấp</option>
                  <option value="name">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                </select>
              </div>
            </div>

            {/* Desktop Toolbar: Search & Sort Control */}
            <div className="flex items-center justify-between mb-5 gap-4">
              {showSearch && (
                <div className="relative max-w-xs flex-1 hidden lg:block">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inputIcon }} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-9 w-full pl-8 pr-8 py-2 border rounded-xl text-xs outline-none transition focus:border-slate-450 dark:border-zinc-700"
                    style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBackground, color: tokens.inputText }}
                  />
                  {searchQuery && (
                    <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100" style={{ color: tokens.inputIcon }}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-3 ml-auto">
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-widest uppercase opacity-65" style={{ color: tokens.metaText }}>Sắp xếp:</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
                      className="h-9 pl-3 pr-8 rounded-lg border text-xs outline-none font-medium appearance-none min-w-[120px]"
                      style={{ 
                        borderColor: tokens.inputBorder, 
                        backgroundColor: tokens.inputBackground, 
                        color: tokens.inputText,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 8px center',
                        backgroundSize: '12px',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="popular">Bán chạy</option>
                      <option value="price_asc">Giá thấp → cao</option>
                      <option value="price_desc">Giá cao → thấp</option>
                      <option value="name">Tên A-Z</option>
                      <option value="name_desc">Tên Z-A</option>
                    </select>
                  </div>
                </div>

                {hasActiveFilters && onClearFilters && (
                  <ClearFiltersButton tokens={tokens} onClear={onClearFilters} />
                )}
              </div>
            </div>

            {/* Products Grid list */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-pulse">
                {Array.from({ length: postsPerPage }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
                    <div style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }} />
                    <div className="p-4 space-y-3">
                      <div className="h-4 w-full rounded" style={{ backgroundColor: tokens.filterChipBg }} />
                      <div className="h-5 w-24 rounded" style={{ backgroundColor: tokens.filterChipBg }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState tokens={tokens} onReset={onClearFilters ?? (() => {})} />
            ) : (
              <ProductGrid
                products={products}
                categoryMap={categoryMap}
                tokens={tokens}
                showPrice={showPrice}
                showSalePrice={showSalePrice}
                showStock={showStock}
                saleMode={saleMode}
                showWishlistButton={showWishlistButton}
                showAddToCartButton={showAddToCartButton}
                showBuyNowButton={showBuyNowButton}
                buyNowLabel={buyNowLabel}
                showPromotionBadge={showPromotionBadge}
                wishlistIdSet={wishlistIdSet}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                canUseWishlist={canUseWishlist}
                imageAspectRatioStyle={imageAspectRatioStyle}
                frameConfig={frameConfig}
                watermarkConfig={watermarkConfig}
                getDetailHref={getDetailHref}
                radiusClass={radiusClass}
                productAttributesMap={productAttributesMap}
                onAttributeChange={onAttributeChange}
                selectedAttributes={selectedAttributes}
                cartButtonsLayout={cartButtonsLayout}
                gridColumns={gridColumns}
              />
            )}

            {paginationNode}

            {enableCategoryFilterFooterContent && activeCategoryDoc?.filterFooterContent && (
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 max-w-4xl mx-auto text-left">
                <RichContent content={toRichTextContent(activeCategoryDoc.filterFooterContent)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sheet Filters Panel on Mobile */}
      {mobileFilterOpen && (
        <>
          {/* Overlay background */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300" 
            onClick={() => setMobileFilterOpen(false)} 
          />
          {/* Sheet panel */}
          <div 
            className="fixed bottom-0 left-0 right-0 w-full max-h-[82vh] bg-white dark:bg-slate-900 z-50 flex flex-col rounded-t-[28px] shadow-2xl p-5 overflow-hidden transition-transform duration-300 ease-out transform translate-y-0"
            style={{ borderColor: tokens.inputBorder }}
          >
            {/* Drag Handle indicator */}
            <div 
              className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto mb-4 cursor-pointer hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => setMobileFilterOpen(false)}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-850">
              <h3 className="font-bold text-base" style={{ color: tokens.bodyText }}>Bộ lọc tìm kiếm</h3>
              <button 
                onClick={() => setMobileFilterOpen(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ color: tokens.bodyText }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content Filters */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-1 pb-4">
              {enableProductTypes && productTypes && productTypes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm" style={{ color: tokens.bodyText }}>Nhóm sản phẩm</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => { onProductTypeChange?.(null); setMobileFilterOpen(false); }}
                      className={`w-full py-2 px-3 rounded-lg text-left text-sm font-medium transition-colors border border-transparent ${!productType ? 'font-semibold' : ''}`}
                      style={!productType
                        ? { backgroundColor: tokens.filterChipActiveBg, color: tokens.filterChipActiveText }
                        : { backgroundColor: tokens.filterChipBg, color: tokens.filterChipText }
                      }
                    >
                      Tất cả nhóm
                    </button>
                    {productTypes.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => { onProductTypeChange?.(t.slug); setMobileFilterOpen(false); }}
                        className={`w-full py-2 px-3 rounded-lg text-left text-sm font-medium transition-colors border border-transparent ${productType?.slug === t.slug ? 'font-semibold' : ''}`}
                        style={productType?.slug === t.slug
                          ? { backgroundColor: tokens.filterChipActiveBg, color: tokens.filterChipActiveText }
                          : { backgroundColor: tokens.filterChipBg, color: tokens.filterChipText }
                        }
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-sm" style={{ color: tokens.bodyText }}>Danh mục sản phẩm</h4>
                {categories.length > 8 && (
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Tìm nhanh danh mục..."
                      value={categoryQuery}
                      onChange={(e) => setCategoryQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 border rounded-md text-xs outline-none"
                      style={{
                        borderColor: tokens.inputBorder,
                        backgroundColor: tokens.inputBackground,
                        color: tokens.inputText,
                      }}
                    />
                    <Search
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: tokens.inputIcon }}
                    />
                    {categoryQuery && (
                      <button
                        onClick={() => setCategoryQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                        style={{ color: tokens.inputIcon }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}
                <div 
                  className={`space-y-1 ${categories.length > 8 ? 'max-h-72 overflow-y-auto pr-1' : ''}`}
                >
                  {(!categoryQuery || 'tất cả danh mục'.includes(categoryQuery.toLowerCase())) && (
                    <button
                      onClick={() => { onCategoryChange(null); setMobileFilterOpen(false); }}
                      className={`w-full py-2 px-3 rounded-lg text-left text-sm font-medium transition-colors border border-transparent ${!selectedCategory ? 'font-semibold' : ''}`}
                      style={!selectedCategory
                        ? { backgroundColor: tokens.filterChipActiveBg, color: tokens.filterChipActiveText }
                        : { backgroundColor: tokens.filterChipBg, color: tokens.filterChipText }
                      }
                    >
                      Tất cả danh mục
                    </button>
                  )}
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => { onCategoryChange(cat._id); setMobileFilterOpen(false); }}
                      className={`w-full py-2 px-3 rounded-lg text-left text-sm font-medium transition-colors border border-transparent ${selectedCategory === cat._id ? 'font-semibold' : ''}`}
                      style={selectedCategory === cat._id
                        ? { backgroundColor: tokens.filterChipActiveBg, color: tokens.filterChipActiveText }
                        : { backgroundColor: tokens.filterChipBg, color: tokens.filterChipText }
                      }
                    >
                      {cat.name}
                    </button>
                  ))}
                  {categories.length > 8 && filteredCategories.length === 0 && (!categoryQuery || !'tất cả danh mục'.includes(categoryQuery.toLowerCase())) && (
                    <div className="px-2.5 py-2 text-xs opacity-60" style={{ color: tokens.metaText }}>
                      Không tìm thấy kết quả.
                    </div>
                  )}
                </div>
              </div>

              {/* Bộ lọc khoảng giá nâng cao di động */}
              {priceFilterMode !== 'disabled' && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-850">
                  <h4 className="font-semibold text-sm" style={{ color: tokens.bodyText }}>Khoảng giá (đ)</h4>
                  {priceFilterMode === 'custom' && (
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="number"
                        placeholder="Từ"
                        value={minPriceInput}
                        onChange={(e) => setMinPriceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
                        className="w-[42%] px-2 py-1.5 border rounded-lg text-sm placeholder:text-[var(--placeholder-color)] outline-none"
                        style={{
                          borderColor: tokens.inputBorder,
                          backgroundColor: tokens.inputBackground,
                          color: tokens.inputText,
                          '--placeholder-color': tokens.inputPlaceholder,
                        } as React.CSSProperties}
                      />
                      <span className="text-slate-400 dark:text-slate-500 font-bold">-</span>
                      <input
                        type="number"
                        placeholder="Đến"
                        value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
                        className="w-[42%] px-2 py-1.5 border rounded-lg text-sm placeholder:text-[var(--placeholder-color)] outline-none"
                        style={{
                          borderColor: tokens.inputBorder,
                          backgroundColor: tokens.inputBackground,
                          color: tokens.inputText,
                          '--placeholder-color': tokens.inputPlaceholder,
                        } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        onClick={handleApplyPrice}
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all hover:opacity-90 active:scale-95 text-sm shrink-0"
                        style={{
                          backgroundColor: tokens.filterChipActiveBg,
                          color: tokens.filterChipActiveText,
                        }}
                        title="Áp dụng lọc giá"
                      >
                        ✓
                      </button>
                    </div>
                  )}

                  {priceFilterMode === 'smart_dropdown' && (
                    <SmartDropdownFilter
                      priceStats={priceStats}
                      searchParams={searchParams}
                      router={router}
                      tokens={tokens}
                    />
                  )}

                  {priceFilterMode === 'slider' && priceStats && priceStats.maxPrice > priceStats.minPrice && (
                    <DoubleRangeSlider
                      min={priceStats.minPrice}
                      max={priceStats.maxPrice}
                      initialMin={currentMinPrice ? Number(currentMinPrice) : priceStats.minPrice}
                      initialMax={currentMaxPrice ? Number(currentMaxPrice) : priceStats.maxPrice}
                      tokens={tokens}
                      brandColor={tokens.filterChipActiveBg}
                      onChange={(minVal, maxVal) => {
                        if (!router) return;
                        const params = new URLSearchParams(window.location.search);
                        if (minVal === priceStats!.minPrice && maxVal === priceStats!.maxPrice) {
                          params.delete('minPrice');
                          params.delete('maxPrice');
                        } else {
                          params.set('minPrice', String(minVal));
                          params.set('maxPrice', String(maxVal));
                        }
                        params.delete('page');
                        params.delete('priceRange');
                        router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
                      }}
                    />
                  )}
                </div>
              )}

              {enableProductTypes && productType?.priceRanges && productType.priceRanges.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm" style={{ color: tokens.bodyText }}>Khoảng giá</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => { onPriceRangeChange?.(null); setMobileFilterOpen(false); }}
                      className={`w-full py-2 px-3 rounded-lg text-left text-sm font-medium transition-colors ${!selectedPriceRange ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-zinc-200'}`}
                      style={!selectedPriceRange
                        ? { backgroundColor: `${tokens.primary}12`, color: tokens.primary }
                        : undefined
                      }
                    >
                      Tất cả khoảng giá
                    </button>
                    {productType.priceRanges.map((range: any) => (
                      <button
                        key={range.slug}
                        onClick={() => { onPriceRangeChange?.(range); setMobileFilterOpen(false); }}
                        className={`w-full py-2 px-3 rounded-lg text-left text-sm font-medium transition-colors ${selectedPriceRange?.slug === range.slug ? 'font-semibold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-zinc-200'}`}
                        style={selectedPriceRange?.slug === range.slug
                          ? { backgroundColor: `${tokens.primary}12`, color: tokens.primary }
                          : undefined
                        }
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filterableGroups && filterableGroups.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                  {filterableGroups.map((group) => (
                    <div key={group._id} className="space-y-3">
                      <h4 className="font-semibold text-sm" style={{ color: tokens.bodyText }}>{group.name}</h4>
                      <AttributeFilterGroupWidget
                        group={group}
                        selectedAttributes={selectedAttributes}
                        onAttributeChange={onAttributeChange}
                        tokens={tokens}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Sheet Footer Sticky Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 mt-auto flex gap-3 pb-2 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => { onClearFilters?.(); setMobileFilterOpen(false); }}
                disabled={!hasActiveFilters}
                className="flex-1 h-11 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ 
                  borderColor: tokens.inputBorder, 
                  color: tokens.bodyText, 
                  backgroundColor: tokens.inputBackground 
                }}
              >
                <span>Thiết lập lại</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 h-11 rounded-xl font-bold text-sm transition-all flex items-center justify-center active:scale-95"
                style={{ 
                  backgroundColor: tokens.primary, 
                  color: '#000000' 
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

export function ListLayout({
  isLoadingProducts,
  postsPerPage,
  products,
  categories,
  categoryMap,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  tokens,
  showPrice,
  showSalePrice,
  showStock,
  saleMode,
  totalCount,
  paginationNode,
  showWishlistButton,
  showAddToCartButton,
  showBuyNowButton,
  buyNowLabel,
  showPromotionBadge,
  wishlistIdSet,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  canUseWishlist,
  imageAspectRatioStyle,
  frameConfig,
  watermarkConfig,
  getDetailHref,
  activeCategoryDoc,
  showCategorySubtitle,
  enableCategoryFilterFooterContent,
  filterableGroups,
  selectedAttributes,
  onAttributeChange,
  productType,
  selectedPriceRange,
  onPriceRangeChange,
  enableProductTypes,
  productTypes,
  onProductTypeChange,
  hasActiveFilters,
  onClearFilters,
  radiusClass,
  productAttributesMap,
  cartButtonsLayout,
  showSearch = true,
  showCategories = true,
  priceFilterMode: _priceFilterMode = 'custom'
}: LayoutProps) {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const query = categorySearchQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categories, categorySearchQuery]);

  return (
    <div className="py-8 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Title */}
        <PageHeaderWithCount
          title={activeCategoryDoc?.name ?? (enableProductTypes ? productType?.name : null) ?? 'Sản phẩm'}
          count={products.length}
          totalCount={totalCount}
          unit="sản phẩm"
          titleColor={tokens.headingColor}
          subtitleColor={tokens.metaText}
          description={showCategorySubtitle && activeCategoryDoc?.description ? activeCategoryDoc.description : undefined}
          descriptionColor={tokens.bodyText}
          centered={true}
        />

        {/* Mobile Filters Controls */}
        <MobileProductsFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          tokens={tokens}
          filterableGroups={filterableGroups}
          selectedAttributes={selectedAttributes}
          onAttributeChange={onAttributeChange}
          productType={productType}
          selectedPriceRange={selectedPriceRange}
          onPriceRangeChange={onPriceRangeChange}
          enableProductTypes={enableProductTypes}
          productTypes={productTypes}
          onProductTypeChange={onProductTypeChange}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
          radiusClass={radiusClass}
        />

        {/* Desktop Filter Bar (Horizontal) */}
        {(showSearch || showCategories) && (
          <div
            className={`hidden lg:block ${radiusClass} border p-3 mb-5`}
            style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}
          >
            <div className="flex flex-col lg:flex-row gap-3">
              {showSearch && (
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inputIcon }} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full h-10 pl-10 pr-9 rounded-lg border outline-none transition-colors placeholder:text-[var(--placeholder-color)]"
                    style={{
                      borderColor: tokens.inputBorder,
                      backgroundColor: tokens.inputBackground,
                      color: tokens.inputText,
                      '--placeholder-color': tokens.inputPlaceholder,
                    } as React.CSSProperties}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: tokens.inputIcon }}
                      aria-label="Xóa tìm kiếm"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {enableProductTypes && productTypes && productTypes.length > 0 && (
                <div className="hidden lg:flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={productType?.slug ?? ''}
                      onChange={(e) => onProductTypeChange?.(e.target.value || null)}
                      className="h-10 w-[200px] pl-3 pr-8 rounded-lg border text-sm outline-none appearance-none truncate"
                      style={{
                        borderColor: tokens.inputBorder,
                        backgroundColor: tokens.inputBackground,
                        color: tokens.inputText,
                      }}
                    >
                      <option value="">Tất cả nhóm sản phẩm</option>
                      {productTypes.map((t) => (
                        <option key={t._id} value={t.slug}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.inputIcon }} />
                  </div>
                </div>
              )}

              {showCategories && (
                <div className="hidden lg:flex items-center gap-2">
                  <div className="relative" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="h-10 w-[220px] px-3 flex items-center justify-between rounded-lg border text-sm outline-none truncate"
                      style={{
                        borderColor: tokens.inputBorder,
                        backgroundColor: tokens.inputBackground,
                        color: tokens.inputText,
                      }}
                    >
                      <span className="truncate">
                        {selectedCategory
                          ? categories.find((cat) => cat._id === selectedCategory)?.name ?? 'Tất cả danh mục'
                          : 'Tất cả danh mục'}
                      </span>
                      <ChevronDown size={16} style={{ color: tokens.inputIcon }} className={`transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCategoryDropdownOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 w-[260px] p-2 rounded-lg border shadow-xl z-50 flex flex-col gap-1.5"
                        style={{
                          borderColor: tokens.inputBorder,
                          backgroundColor: tokens.inputBackground,
                          color: tokens.inputText,
                        }}
                      >
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border" style={{ borderColor: tokens.inputBorder }}>
                          <Search size={14} style={{ color: tokens.inputIcon }} className="shrink-0" />
                          <input
                            type="text"
                            placeholder="Tìm danh mục..."
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            className="w-full bg-transparent text-xs outline-none"
                            style={{ color: tokens.inputText }}
                          />
                          {categorySearchQuery && (
                            <button type="button" onClick={() => setCategorySearchQuery('')} className="hover:opacity-80">
                              <X size={12} style={{ color: tokens.inputIcon }} />
                            </button>
                          )}
                        </div>

                        <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-0.5" style={{ scrollbarWidth: 'thin' }}>
                          <button
                            type="button"
                            onClick={() => {
                              onCategoryChange(null);
                              setIsCategoryDropdownOpen(false);
                              setCategorySearchQuery('');
                            }}
                            className="w-full px-2.5 py-1.5 rounded-md text-left text-xs transition-colors hover:opacity-80"
                            style={{
                              backgroundColor: !selectedCategory ? `${tokens.primary}18` : 'transparent',
                              color: !selectedCategory ? tokens.primary : tokens.inputText,
                              fontWeight: !selectedCategory ? 'bold' : 'normal',
                            }}
                          >
                            Tất cả danh mục
                          </button>

                          {filteredCategories.length === 0 ? (
                            <p className="text-xs text-center py-4 opacity-60">Không tìm thấy danh mục</p>
                          ) : (
                            filteredCategories.map((cat) => {
                              const isSelected = selectedCategory === cat._id;
                              return (
                                <button
                                  key={cat._id}
                                  type="button"
                                  onClick={() => {
                                    onCategoryChange(cat._id);
                                    setIsCategoryDropdownOpen(false);
                                    setCategorySearchQuery('');
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-md text-left text-xs transition-colors hover:opacity-80"
                                  style={{
                                    backgroundColor: isSelected ? `${tokens.primary}18` : 'transparent',
                                    color: isSelected ? tokens.primary : tokens.inputText,
                                    fontWeight: isSelected ? 'bold' : 'normal',
                                  }}
                                >
                                  {cat.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {enableProductTypes && productType?.priceRanges && productType.priceRanges.length > 0 && (
                <div className="hidden lg:flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={selectedPriceRange?.slug ?? ''}
                      onChange={(e) => {
                        const matched = productType?.priceRanges?.find((r: any) => r.slug === e.target.value);
                        onPriceRangeChange?.(matched ?? null);
                      }}
                      className="h-10 w-[200px] pl-3 pr-8 rounded-lg border text-sm outline-none appearance-none truncate"
                      style={{
                        borderColor: tokens.inputBorder,
                        backgroundColor: tokens.inputBackground,
                        color: tokens.inputText,
                      }}
                    >
                      <option value="">Tất cả khoảng giá</option>
                      {productType.priceRanges.map((range: any) => (
                        <option key={range.slug} value={range.slug}>{range.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.inputIcon }} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto shrink-0">
                {hasActiveFilters && onClearFilters && (
                  <ClearFiltersButton tokens={tokens} onClear={onClearFilters} />
                )}
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
                  className="h-10 px-3 rounded-lg border text-sm outline-none font-medium"
                  style={{
                    borderColor: tokens.inputBorder,
                    backgroundColor: tokens.inputBackground,
                    color: tokens.inputText,
                  }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="popular">Bán chạy</option>
                  <option value="price_asc">Giá thấp → cao</option>
                  <option value="price_desc">Giá cao → thấp</option>
                  <option value="name">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                </select>
              </div>
            </div>
          </div>
        )}



        {/* Products List View */}
        {isLoadingProducts ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: postsPerPage }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
                <div className="w-32 h-32 rounded-lg" style={{ backgroundColor: tokens.filterChipBg }} />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-5 w-2/3 rounded" style={{ backgroundColor: tokens.filterChipBg }} />
                  <div className="h-4 w-full rounded" style={{ backgroundColor: tokens.filterChipBg }} />
                  <div className="h-6 w-24 rounded" style={{ backgroundColor: tokens.filterChipBg }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState tokens={tokens} onReset={onClearFilters ?? (() => {})} />
        ) : (
          <ProductList
            products={products}
            categoryMap={categoryMap}
            tokens={tokens}
            showPrice={showPrice}
            showSalePrice={showSalePrice}
            showStock={showStock}
            saleMode={saleMode}
            showWishlistButton={showWishlistButton}
            showAddToCartButton={showAddToCartButton}
            showBuyNowButton={showBuyNowButton}
            buyNowLabel={buyNowLabel}
            showPromotionBadge={showPromotionBadge}
            wishlistIdSet={wishlistIdSet}
            onToggleWishlist={onToggleWishlist}
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
            canUseWishlist={canUseWishlist}
            imageAspectRatioStyle={imageAspectRatioStyle}
            frameConfig={frameConfig}
            watermarkConfig={watermarkConfig}
            getDetailHref={getDetailHref}
            radiusClass={radiusClass}
            productAttributesMap={productAttributesMap}
            onAttributeChange={onAttributeChange}
            selectedAttributes={selectedAttributes}
            cartButtonsLayout={cartButtonsLayout}
          />
        )}

        {paginationNode}

        {enableCategoryFilterFooterContent && activeCategoryDoc?.filterFooterContent && (
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 max-w-4xl mx-auto text-left">
            <RichContent content={toRichTextContent(activeCategoryDoc.filterFooterContent)} />
          </div>
        )}
      </div>
    </div>
  );
}
