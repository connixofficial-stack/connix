'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Bookmark, ChevronDown, FileText, Filter, Search, Star, X, Check, Download, ShoppingCart, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { useResourcesListConfig } from '@/lib/experiences';
import { useInView } from 'react-intersection-observer';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { toast } from 'sonner';
import { SharedListLayout } from '@/components/shared/SharedListLayout';
import { StorefrontCard } from '@/components/shared/StorefrontCard';

const formatPrice = (pricingType: string, price?: number) => {
  if (pricingType === 'free') {return 'Miễn phí';}
  if (pricingType === 'contact') {return 'Liên hệ';}
  if (!price) {return 'Liên hệ';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
};

const getRadiusClass = (radius?: 'none' | 'sm' | 'lg', type: 'card' | 'input' | 'panel' = 'card') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') {
    if (type === 'panel') return 'rounded-xl';
    return 'rounded-lg';
  }
  if (type === 'panel') return 'rounded-2xl';
  return 'rounded-xl';
};

type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
};

type AssignedResourceFilterValue = {
  _id: Id<'resourceFilterValues'>;
  name: string;
  slug: string;
  icon?: string;
};

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
  cornerRadius = 'lg',
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  cornerRadius?: 'none' | 'sm' | 'lg';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={containerRef} className="relative w-full min-w-[170px] sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-full items-center justify-between gap-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] px-3 text-sm font-medium text-slate-700 dark:text-[#f5f5f7] transition hover:bg-slate-50 dark:hover:bg-[#2c2c2e] ${getRadiusClass(cornerRadius, 'input')}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedOption.icon} alt={selectedOption.label} className="h-4 w-4 object-contain shrink-0" />
          ) : (
            icon
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className={`absolute left-0 right-0 z-30 mt-1.5 max-h-60 min-w-[180px] overflow-y-auto border border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#161617] p-1 shadow-lg ${getRadiusClass(cornerRadius, 'input')}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${option.value === value ? 'bg-slate-50 dark:bg-[#2c2c2e] font-semibold text-slate-900 dark:text-[#f5f5f7]' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
            >
              {option.icon && (
                <img src={option.icon} alt={option.label} className="h-4 w-4 mr-2 object-contain shrink-0" />
              )}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({
  values,
  onChange,
  onClear,
  options,
  placeholder,
  icon,
  cornerRadius = 'lg',
  brandColor = '#4f46e5',
}: {
  values: string[];
  onChange: (value: string) => void;
  onClear: () => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  cornerRadius?: 'none' | 'sm' | 'lg';
  brandColor?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = options.filter((opt) => opt.value !== '' && values.includes(opt.value));
  const hasSelection = selectedOptions.length > 0;

  const displayLabel = useMemo(() => {
    if (!hasSelection) return placeholder;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `${selectedOptions[0].label} (+${selectedOptions.length - 1})`;
  }, [hasSelection, selectedOptions, placeholder]);

  const displayIcon = useMemo(() => {
    if (selectedOptions.length === 1 && selectedOptions[0].icon) {
      return <img src={selectedOptions[0].icon} alt="" className="h-4 w-4 object-contain shrink-0" />;
    }
    return icon;
  }, [selectedOptions, icon]);

  return (
    <div ref={containerRef} className="relative w-full min-w-[170px] sm:w-auto">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-10 w-full items-center justify-between gap-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] px-3 text-sm font-medium text-slate-700 dark:text-[#f5f5f7] transition hover:bg-slate-50 dark:hover:bg-[#2c2c2e] ${getRadiusClass(cornerRadius, 'input')}`}
        >
          <span className="flex items-center gap-2 truncate">
            {displayIcon}
            <span className="truncate">{displayLabel}</span>
          </span>
          <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {hasSelection && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Xóa bộ lọc"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] text-slate-400 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-655 dark:hover:text-[#f5f5f7] transition"
            style={{ borderRadius: cornerRadius === 'none' ? '0' : cornerRadius === 'sm' ? '8px' : '12px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={`absolute left-0 right-0 z-30 mt-1.5 max-h-72 min-w-[200px] overflow-y-auto border border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#161617] p-1.5 shadow-lg ${getRadiusClass(cornerRadius, 'input')}`}>
          <button
            type="button"
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors rounded-lg ${!hasSelection ? 'bg-slate-50 dark:bg-[#2c2c2e] font-semibold text-slate-900 dark:text-[#f5f5f7]' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
          >
            <span className="truncate">Tất cả phần mềm</span>
            {!hasSelection && <Check size={14} style={{ color: brandColor }} className="shrink-0" />}
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

          {options
            .filter((opt) => opt.value !== '')
            .map((option) => {
              const isSelected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors rounded-lg ${
                    isSelected ? 'font-bold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'
                  }`}
                  style={isSelected ? { backgroundColor: `${brandColor}12`, color: brandColor } : undefined}
                >
                  <span className="flex items-center gap-2 truncate">
                    {option.icon && (
                      <img src={option.icon} alt={option.label} className="h-4 w-4 object-contain shrink-0" />
                    )}
                    <span className="truncate">{option.label}</span>
                  </span>
                  {isSelected && <Check size={14} style={{ color: brandColor }} className="shrink-0" />}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
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

function ResourceListItem({
  resource,
  category,
  detailHref,
  assignedValues,
  resourceFiltersFeatureEnabled,
  showResourceFilters,
  cornerRadius,
  brandColors,
  isDark,
}: {
  resource: any;
  category: any;
  detailHref: string;
  assignedValues: AssignedResourceFilterValue[];
  resourceFiltersFeatureEnabled: boolean;
  showResourceFilters: boolean;
  cornerRadius?: 'none' | 'sm' | 'lg';
  brandColors: { primary: string; secondary?: string; mode?: string };
  isDark: boolean;
}) {
  const brandColor = brandColors.primary;
  const { openLoginModal, token } = useCustomerAuth();
  const { addItem, openDrawer } = useCart();
  const [isDownloading, setIsDownloading] = useState(false);

  const resourceCommerceSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'resources', settingKey: 'commerceMode' });
  const commerceMode = resourceCommerceSetting?.value === 'contact' ? 'contact' : 'cart';

  const resourceAccess = useQuery(api.resources.getResourceAccess, { resourceId: resource._id, token: token ?? undefined });
  const requestDownload = useMutation(api.resources.requestDownload);
  const hasAccess = Boolean(resourceAccess?.hasAccess);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast.info('Vui lòng đăng nhập để tải tài nguyên.');
      openLoginModal();
      return;
    }
    if (resource.pricingType === 'contact') {
      window.location.href = `/contact?subject=${encodeURIComponent(`Tư vấn tài nguyên: ${resource.title}`)}`;
      return;
    }
    if (!hasAccess && resource.pricingType === 'paid') {
      if (commerceMode === 'cart') {
        const ok = await addItem({ itemType: 'resource', resourceId: resource._id, quantity: 1 });
        if (ok) {
          toast.success('Đã thêm tài nguyên vào giỏ hàng');
          openDrawer();
        }
        return;
      }
      window.location.href = `/contact?subject=${encodeURIComponent(`Mua tài nguyên: ${resource.title}`)}`;
      return;
    }

    setIsDownloading(true);
    try {
      const result = await requestDownload({ resourceId: resource._id, token });
      if (result.ok && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        toast.success('Đang mở link tải');
        return;
      }
      if (result.reason === 'login_required') {
        openLoginModal();
        return;
      }
      if (result.reason === 'purchase_required') {
        toast.error('Bạn cần mua tài nguyên trước khi tải.');
        return;
      }
      toast.error('Không thể tải tài nguyên.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải tài nguyên.');
    } finally {
      setIsDownloading(false);
    }
  };

  const ctaLabel = resource.pricingType === 'contact'
    ? 'Liên hệ'
    : !token
      ? (resource.pricingType === 'free' ? 'Đăng nhập tải' : 'Đăng nhập mua')
      : hasAccess || resource.pricingType === 'free'
        ? 'Tải ngay'
        : commerceMode === 'cart'
          ? 'Thêm giỏ'
          : 'Liên hệ mua';

  return (
    <StorefrontCard
      layout="list"
      href={detailHref}
      image={resource.thumbnail}
      imageAlt={resource.title}
      fallbackIcon={<FileText size={28} style={{ color: brandColor }} />}
      categoryName={category?.name ?? 'Tài nguyên'}
      title={resource.title}
      description={resource.excerpt}
      leftMetadata={
        <div className="flex flex-col gap-1.5 w-full">
          {resource.featured && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white w-fit">
              <Star size={10} className="fill-current" /> Nổi bật
            </span>
          )}
          {resourceFiltersFeatureEnabled && showResourceFilters && assignedValues.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {assignedValues.slice(0, 3).map((value) => (
                <span key={value._id} className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 dark:border-zinc-800 px-2 py-0.5 text-[11px] font-medium text-slate-550 dark:text-[#86868b]">
                  {value.icon && <img src={value.icon} alt={value.name} className="h-3 w-3 object-contain shrink-0" />}
                  <span>{value.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      }
      rightDetails={
        <div className="flex flex-col items-start md:items-end justify-center gap-2 w-full">
          <span className="text-base font-bold" style={{ color: brandColor }}>{formatPrice(resource.pricingType, resource.priceAmount)}</span>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex w-full md:w-auto items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 shadow-sm hover:shadow"
            style={{ backgroundColor: brandColor }}
          >
            {isDownloading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
            ) : hasAccess || (resource.pricingType === 'free' && token) ? (
              <Download size={14} className="shrink-0" />
            ) : !token && resource.pricingType === 'free' ? (
              <Lock size={14} className="shrink-0" />
            ) : commerceMode === 'cart' && resource.pricingType !== 'contact' ? (
              <ShoppingCart size={14} className="shrink-0" />
            ) : (
              <Lock size={14} className="shrink-0" />
            )}
            <span className="ml-1">{isDownloading ? 'Đang tải...' : ctaLabel}</span>
          </button>
        </div>
      }
      ctaLabel={undefined}
      brandColor={brandColor}
      radiusClass={getRadiusClass(cornerRadius)}
      isDark={isDark}
    />
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<ResourcesSkeleton />}>
      <ResourcesContent />
    </Suspense>
  );
}

function ResourcesContent() {
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const config = useResourcesListConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const urlPage = Math.max(Number(searchParams.get('page')) || 1, 1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc' | 'title' | 'title_desc'>('newest');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [pageSizeOverride, setPageSizeOverride] = useState<number | null>(null);
  const postsPerPage = pageSizeOverride ?? (config.postsPerPage ?? 12);
  const [visibleLimit, setVisibleLimit] = useState(postsPerPage);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setVisibleLimit(postsPerPage);
  }, [debouncedSearch, postsPerPage, sortBy, searchParams.get('filter')]);

  const categories = useQuery(api.resourceCategories.listActive, { limit: 100 });
  const nonEmptyCategoryIds = useQuery(
    api.resourceCategories.listNonEmptyCategoryIds,
    config.hideEmptyCategories ? { limit: 100 } : 'skip'
  );
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>();
    categories?.forEach((category) => { map.set(category._id, { name: category.name, slug: category.slug }); });
    return map;
  }, [categories]);

  const visibleCategories = useMemo(() => {
    if (!categories) {return [];}
    if (!config.hideEmptyCategories || !nonEmptyCategoryIds) {return categories;}
    const allowed = new Set(nonEmptyCategoryIds);
    return categories.filter((category) => allowed.has(category._id));
  }, [categories, config.hideEmptyCategories, nonEmptyCategoryIds]);

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return visibleCategories;
    return visibleCategories.filter((category) => category.name.toLowerCase().includes(query));
  }, [visibleCategories, categoryQuery]);

  const categorySlugFromPath = useMemo(() => {
    if (routeMode !== 'unified') {return null;}
    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment || segment === 'resources') {return null;}
    return segment;
  }, [pathname, routeMode]);

  const activeCategoryId = useMemo(() => {
    const categorySlug = categorySlugFromPath ?? searchParams.get('category');
    if (!categorySlug || !categories) {return null;}
    return categories.find((category) => category.slug === categorySlug)?._id ?? null;
  }, [categories, categorySlugFromPath, searchParams]);

  const activeCategoryName = useMemo(() => {
    if (!activeCategoryId || !categories) return null;
    return categories.find((category) => category._id === activeCategoryId)?.name ?? null;
  }, [activeCategoryId, categories]);

  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'resources', featureKey: 'enableResourceFilters' });
  const activeFilters = useQuery(api.resourceFilters.listActive, {});
  const allFilterValues = useQuery(api.resourceFilters.listAllValues, {});

  const activeFilterSlugs = useMemo(() => {
    const raw = searchParams.get('filter');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const activeValueIds = useMemo(() => {
    if (activeFilterSlugs.length === 0 || !allFilterValues) return [];
    return activeFilterSlugs
      .map((filterSlug) => allFilterValues.find((value) => value.slug === filterSlug)?._id)
      .filter((id): id is Id<'resourceFilterValues'> => id !== undefined);
  }, [activeFilterSlugs, allFilterValues]);

  const isSearchActive = debouncedSearch.length > 0;
  const isPaginationMode = config.paginationType === 'pagination' || isSearchActive || activeFilterSlugs.length > 0;
  const offset = isPaginationMode ? (urlPage - 1) * postsPerPage : 0;
  const resourcesLimit = isPaginationMode ? postsPerPage : visibleLimit;
  const resources = useQuery(api.resources.listPublishedWithOffset, {
    categoryId: activeCategoryId ?? undefined,
    limit: resourcesLimit,
    offset,
    search: debouncedSearch || undefined,
    sortBy,
    valueIds: activeValueIds.length > 0 ? activeValueIds : undefined,
  });
  const totalCount = useQuery(api.resources.countPublished, {
    categoryId: activeCategoryId ?? undefined,
    search: debouncedSearch || undefined,
    valueIds: activeValueIds.length > 0 ? activeValueIds : undefined,
  });

  const resourceIds = useMemo(() => resources?.map((resource) => resource._id) ?? [], [resources]);
  const assignments = useQuery(api.resourceFilters.listAssignmentsByResources, { resourceIds: resourceIds.length > 0 ? resourceIds : [] });
  const resourceFiltersMap = useMemo(() => {
    const map = new Map<string, AssignedResourceFilterValue[]>();
    assignments?.forEach((item) => {
      map.set(item.resourceId, item.values);
    });
    return map;
  }, [assignments]);

  const prevFiltersRef = useRef({
    activeCategoryId,
    debouncedSearch,
    filter: searchParams.get('filter'),
    sortBy,
  });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const hasFilterChanged =
      prev.activeCategoryId !== activeCategoryId ||
      prev.debouncedSearch !== debouncedSearch ||
      prev.filter !== searchParams.get('filter') ||
      prev.sortBy !== sortBy;

    prevFiltersRef.current = {
      activeCategoryId,
      debouncedSearch,
      filter: searchParams.get('filter'),
      sortBy,
    };

    if (hasFilterChanged && urlPage > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }
  }, [activeCategoryId, debouncedSearch, searchParams, pathname, router, sortBy, urlPage]);

  const handleCategoryChange = useCallback((nextCategoryId: Id<'resourceCategories'> | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (nextCategoryId) {
      const category = categories?.find((item) => item._id === nextCategoryId);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'resources' }), { scroll: false });
          return;
        }
        params.set('category', category.slug);
      }
    } else {
      params.delete('category');
    }

    const nextUrl = params.toString()
      ? `${buildModuleListPath('resources')}?${params.toString()}`
      : buildModuleListPath('resources');
    router.push(nextUrl, { scroll: false });
  }, [categories, routeMode, router, searchParams]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname, router, searchParams]);

  const handleFilterChange = useCallback((filterSlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (filterSlug === null) {
      params.delete('filter');
    } else {
      const current = params.get('filter')?.split(',').filter(Boolean) ?? [];
      const next = current.includes(filterSlug)
        ? current.filter((slug) => slug !== filterSlug)
        : [...current, filterSlug];
      if (next.length > 0) {
        params.set('filter', next.join(','));
      } else {
        params.delete('filter');
      }
    }
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  const resourceItems = resources ?? [];
  const totalResources = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalResources / postsPerPage));
  const isLoading = resources === undefined || categories === undefined;
  const hasMore = visibleLimit < totalResources;

  useEffect(() => {
    if (isPaginationMode) {
      return;
    }
    if (inView && hasMore) {
      setVisibleLimit((prev) => prev + postsPerPage);
    }
  }, [inView, hasMore, postsPerPage, isPaginationMode]);

  const ResourceGridCard = ({ resource }: { resource: typeof resourceItems[number] }) => {
    const category = categoryMap.get(resource.categoryId);
    const detailHref = buildDetailPath({
      categorySlug: category?.slug,
      mode: routeMode,
      moduleKey: 'resources',
      recordSlug: resource.slug,
    });
    const assignedValues = resourceFiltersMap.get(resource._id) ?? [];
    const cardRadiusClass = getRadiusClass(config.cornerRadius);

    return (
      <StorefrontCard
        layout="grid"
        href={detailHref}
        image={resource.thumbnail}
        imageAlt={resource.title}
        fallbackIcon={<FileText size={42} style={{ color: brandColors.primary }} />}
        categoryName={category?.name ?? 'Tài nguyên'}
        title={resource.title}
        description={resource.excerpt}
        leftMetadata={
          <div className="flex flex-col gap-1.5 w-full">
            {resource.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white z-10 w-fit">
                <Star size={12} className="fill-current" /> Nổi bật
              </span>
            )}
            {resourceFiltersFeature?.enabled && config.showResourceFilters && assignedValues.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assignedValues.slice(0, 4).map((value) => (
                  <span key={value._id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-slate-550 dark:text-[#86868b]">
                    {value.icon && (
                      <img src={value.icon} alt={value.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                    )}
                    <span>{value.name}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold border-t pt-2 mt-2 w-full" style={{ borderColor: isDark ? '#27272a' : '#e2e8f0' }}>
              <span style={{ color: brandColors.primary }}>{formatPrice(resource.pricingType, resource.priceAmount)}</span>
              <span style={{ color: brandColors.primary }}>Tải ngay →</span>
            </div>
          </div>
        }
        brandColor={brandColors.primary}
        radiusClass={cardRadiusClass}
        isDark={isDark}
      />
    );
  };

  const ResourceListWrapper = ({ resource }: { resource: typeof resourceItems[number] }) => {
    const category = categoryMap.get(resource.categoryId);
    const detailHref = buildDetailPath({
      categorySlug: category?.slug,
      mode: routeMode,
      moduleKey: 'resources',
      recordSlug: resource.slug,
    });
    const assignedValues = resourceFiltersMap.get(resource._id) ?? [];
    return (
      <ResourceListItem
        resource={resource}
        category={category}
        detailHref={detailHref}
        assignedValues={assignedValues}
        resourceFiltersFeatureEnabled={resourceFiltersFeature?.enabled ?? false}
        showResourceFilters={config.showResourceFilters}
        cornerRadius={config.cornerRadius}
        brandColors={brandColors}
        isDark={isDark}
      />
    );
  };

  const paginationBar = isPaginationMode && totalPages > 1 && (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <div className="order-2 flex w-full items-center justify-between text-sm sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-zinc-400">Hiển thị</span>
          <select
            value={postsPerPage}
            onChange={(event) => {
              setPageSizeOverride(Number(event.target.value));
              const params = new URLSearchParams(searchParams.toString());
              params.delete('page');
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] px-2 text-sm font-medium shadow-sm focus:outline-none text-slate-705 dark:text-[#f5f5f7]"
            aria-label="Số tài nguyên mỗi trang"
          >
            {[12, 20, 24, 48].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-slate-500 dark:text-zinc-400">tài nguyên/trang</span>
        </div>

        <div>
          <span className="font-medium text-slate-900 dark:text-[#f5f5f7]">
            {totalResources ? ((urlPage - 1) * postsPerPage) + 1 : 0}–{Math.min(urlPage * postsPerPage, totalResources)}
          </span>
          <span className="mx-1 text-slate-300 dark:text-zinc-700">/</span>
          <span className="font-medium text-slate-900 dark:text-[#f5f5f7]">{totalResources}</span>
          <span className="ml-1 text-slate-500">tài nguyên</span>
        </div>
      </div>

      <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
        <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
          <button
            onClick={() => handlePageChange(urlPage - 1)}
            disabled={urlPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] text-slate-700 dark:text-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {generatePaginationItems(urlPage, totalPages).map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">
                  …
                </div>
              );
            }

            const pageNum = item as number;
            const isActive = pageNum === urlPage;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-sm border font-medium'
                    : 'text-slate-750 dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-[#2c2c2e]'
                }`}
                style={isActive ? {
                  backgroundColor: brandColors.primary,
                  borderColor: brandColors.primary,
                  color: '#fff',
                } : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(urlPage + 1)}
            disabled={urlPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] text-slate-700 dark:text-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );

  const infiniteScrollTrigger = !isPaginationMode && (
    <>
      {hasMore && (
        <div ref={loadMoreRef} className="text-center py-6 w-full animate-pulse">
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <div className="w-2 h-2 rounded-full bg-slate-400 delay-75" />
            <div className="w-2 h-2 rounded-full bg-slate-400 delay-150" />
          </div>
        </div>
      )}
      {!hasMore && resourceItems.length > 0 && (
        <div className="text-center py-6 w-full">
          <p className="text-sm text-slate-450 dark:text-zinc-500">Đã hiển thị tất cả {resourceItems.length} tài nguyên</p>
        </div>
      )}
    </>
  );

  const sidebarFilters = () => (
    <div className="space-y-4">
      {config.showCategories && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2 dark:text-[#f5f5f7]">Danh mục</h3>
          {visibleCategories.length > 8 && (
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Tìm nhanh danh mục..."
                value={categoryQuery}
                onChange={(event) => setCategoryQuery(event.target.value)}
                className={`w-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-[#f5f5f7] py-2 pl-9 pr-9 text-xs outline-none transition-colors focus:border-slate-300 dark:focus:border-zinc-700 ${getRadiusClass(config.cornerRadius, 'input')}`}
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {categoryQuery && (
                <button type="button" onClick={() => setCategoryQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 opacity-60 hover:opacity-100">
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          <div className={`space-y-1 ${visibleCategories.length > 8 ? 'max-h-60 overflow-y-auto pr-1' : ''}`}>
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className={`w-full rounded-lg border border-transparent px-3.5 py-2 text-left text-sm transition-colors ${!activeCategoryId ? 'font-semibold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
              style={!activeCategoryId ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary, borderColor: isDark ? '#3a3a3c' : 'transparent' } : undefined}
            >
              Tất cả danh mục
            </button>
            {filteredCategories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() => handleCategoryChange(category._id)}
                className={`w-full rounded-lg border border-transparent px-3.5 py-2 text-left text-sm transition-colors ${activeCategoryId === category._id ? 'font-semibold' : 'text-slate-600 dark:text-zinc-405 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                style={activeCategoryId === category._id ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary, borderColor: isDark ? '#3a3a3c' : 'transparent' } : undefined}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {resourceFiltersFeature?.enabled && config.showResourceFilters && activeFilters && allFilterValues && activeFilters.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800/50">
          <h3 className="font-semibold text-sm flex items-center gap-2 dark:text-[#f5f5f7]">Bộ lọc thuộc tính</h3>
          <div className="space-y-4">
            {activeFilters.map((filter) => {
              const values = allFilterValues.filter((value) => value.filterId === filter._id && value.active);
              if (values.length === 0) return null;
              return (
                <div key={filter._id} className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500">{filter.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {values.map((value) => {
                      const active = activeFilterSlugs.includes(value.slug);
                      return (
                        <button
                          key={value._id}
                          type="button"
                          onClick={() => handleFilterChange(value.slug)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition inline-flex items-center gap-1.5 ${active ? '' : 'border-slate-205 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                          style={active ? { backgroundColor: brandColors.primary, borderColor: brandColors.primary, color: '#fff' } : undefined}
                        >
                          {value.icon && (
                            <img src={value.icon} alt={value.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                          )}
                          <span>{value.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const toolbarFilters = () => (
    <div className="flex items-center gap-2">
      {config.showCategories && (
        <CustomDropdown
          value={activeCategoryId ?? ''}
          onChange={(value) => handleCategoryChange(value ? value as Id<'resourceCategories'> : null)}
          options={[{ value: '', label: 'Tất cả danh mục' }, ...visibleCategories.map((category) => ({ value: category._id, label: category.name }))]}
          icon={<Bookmark size={15} className="text-slate-400" />}
          cornerRadius={config.cornerRadius}
        />
      )}
      {resourceFiltersFeature?.enabled && config.showResourceFilters && allFilterValues && allFilterValues.filter((v) => v.active).length > 0 && (
        <MultiSelectDropdown
          values={activeFilterSlugs}
          onChange={(value) => handleFilterChange(value)}
          onClear={() => handleFilterChange(null)}
          options={[
            { value: '', label: activeFilters?.[0]?.name ? `Tất cả ${activeFilters[0].name.toLowerCase()}` : 'Tất cả bộ lọc' },
            ...allFilterValues.filter((v) => v.active).map((val) => ({ value: val.slug, label: val.name, icon: val.icon })),
          ]}
          placeholder={activeFilters?.[0]?.name ? `Tất cả ${activeFilters[0].name.toLowerCase()}` : 'Bộ lọc'}
          icon={<Filter size={15} className="text-slate-400" />}
          cornerRadius={config.cornerRadius}
          brandColor={brandColors.primary}
        />
      )}
    </div>
  );

  const mobileFilters = (closeSheet: () => void) => (
    <div className="space-y-5">
      {config.showCategories && (
        <div className="space-y-2.5">
          <h4 className="font-bold text-sm dark:text-[#f5f5f7]">Danh mục</h4>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => { handleCategoryChange(null); closeSheet(); }}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${!activeCategoryId ? 'font-semibold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
              style={!activeCategoryId ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary } : undefined}
            >
              Tất cả danh mục
            </button>
            {visibleCategories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() => { handleCategoryChange(category._id); closeSheet(); }}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${activeCategoryId === category._id ? 'font-semibold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                style={activeCategoryId === category._id ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary } : undefined}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {resourceFiltersFeature?.enabled && config.showResourceFilters && activeFilters && allFilterValues && activeFilters.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <h4 className="font-bold text-sm dark:text-[#f5f5f7]">Bộ lọc thuộc tính</h4>
          <div className="space-y-4">
            {activeFilters.map((filter) => {
              const values = allFilterValues.filter((value) => value.filterId === filter._id && value.active);
              if (values.length === 0) return null;
              return (
                <div key={filter._id} className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500">{filter.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => {
                      const active = activeFilterSlugs.includes(value.slug);
                      return (
                        <button
                          key={value._id}
                          type="button"
                          onClick={() => { handleFilterChange(value.slug); }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition inline-flex items-center gap-1.5 ${active ? '' : 'border-slate-205 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                          style={active ? { backgroundColor: brandColors.primary, borderColor: brandColors.primary, color: '#fff' } : undefined}
                        >
                          {value.icon && (
                            <img src={value.icon} alt={value.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                          )}
                          <span>{value.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 w-full font-active">
      <SharedListLayout
        items={resourceItems}
        totalCount={totalResources}
        isLoading={isLoading}
        unit="tài nguyên"
        layoutStyle={config.layoutStyle}
        gridColumns={config.gridColumns}
        cornerRadius={config.cornerRadius}
        showSearch={config.showSearch}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm tài nguyên..."
        sortBy={sortBy}
        onSortChange={(val) => setSortBy(val)}
        sortOptions={[
          { value: 'newest', label: 'Mới nhất' },
          { value: 'popular', label: 'Xem nhiều nhất' },
          { value: 'price_asc', label: 'Giá tăng dần' },
          { value: 'price_desc', label: 'Giá giảm dần' },
          { value: 'title', label: 'Tên A-Z' },
          { value: 'title_desc', label: 'Tên Z-A' },
        ]}
        hasActiveFilters={!!activeCategoryId || !!search || activeFilterSlugs.length > 0}
        onClearFilters={() => {
          setSearch('');
          setDebouncedSearch('');
          setSortBy('newest');
          handleCategoryChange(null);
          handleFilterChange(null);
        }}
        renderItem={(resource) => config.layoutStyle === 'list' ? <ResourceListWrapper key={resource._id} resource={resource} /> : <ResourceGridCard key={resource._id} resource={resource} />}
        renderSkeleton={() => (
          config.layoutStyle === 'list' ? (
            <div className="space-y-4">
              {Array.from({ length: postsPerPage }).map((_, index) => (
                <div key={index} className={`h-28 animate-pulse border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] ${getRadiusClass(config.cornerRadius)}`} />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {Array.from({ length: postsPerPage }).map((_, index) => (
                <div key={index} className={`h-72 animate-pulse border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] ${getRadiusClass(config.cornerRadius)}`} />
              ))}
            </div>
          )
        )}
        renderSidebarFilters={sidebarFilters}
        renderToolbarFilters={toolbarFilters}
        renderMobileFilters={mobileFilters}
        paginationNode={paginationBar}
        infiniteScrollTriggerNode={infiniteScrollTrigger}
        headerTitle={activeCategoryName ?? 'Tài nguyên'}
        brandColor={brandColors.primary}
        isDark={isDark}
      />
    </div>
  );
}

function ResourcesSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black px-4 py-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="mx-auto h-9 w-56 animate-pulse rounded bg-slate-200 dark:bg-[#161617]" />
        <div className="h-16 animate-pulse rounded-2xl bg-white dark:bg-[#161617] border border-slate-200 dark:border-zinc-800" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-xl bg-white dark:bg-[#161617] border border-slate-200 dark:border-zinc-800" />)}
        </div>
      </div>
    </main>
  );
}
