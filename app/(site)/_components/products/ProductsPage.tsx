'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { getProductsListColors } from '@/components/site/products/colors';
import { useCartConfig, useCheckoutConfig, useProductsListConfig } from '@/lib/experiences';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { notifyAddToCart, useCart } from '@/lib/cart';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { QuickAddVariantModal } from '@/components/products/QuickAddVariantModal';
import { useProductImageOverlayConfigs } from '@/components/shared/ProductImageWithOverlay';
import { ChevronDown, Search, X } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { getProductImageAspectRatioCssValue } from '@/lib/products/image-aspect-ratio';
import { RichContent } from '@/components/common/RichContent';
import { toRichTextContent } from '@/lib/products/product-supplemental-content';
import { PageHeaderWithCount } from '@/components/shared/PageHeaderWithCount';

// Import các modules con được phân tách để tối ưu hóa kích thước file
import { 
  ProductsListSkeleton, 
  ProductsGridSkeleton, 
  useProductImageAspectRatioSetting 
} from './Skeletons';

import { 
  ProductCardProps, 
  ProductGrid, 
  EmptyState, 
  ClearFiltersButton,
  ProductAttributesBadges
} from './ProductCardComponents';

export { ProductAttributesBadges };

import { 
  MobileProductsFilters, 
  PriceRange 
} from './FilterComponents';

import { 
  CatalogLayout, 
  ListLayout, 
  generatePaginationItems,
  ProductSortOption,
  ProductsSaleMode
} from './LayoutComponents';

type ProductsListLayout = 'grid' | 'list' | 'catalog';

function getProductListRadiusClass(cornerRadius: 'none' | 'sm' | 'lg' = 'lg') {
  if (cornerRadius === 'none') return 'rounded-none';
  if (cornerRadius === 'sm') return 'rounded-md';
  return 'rounded-xl';
}

function useEnabledProductFields(): Set<string> {
  const fields = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'products' });
  return useMemo(() => {
    if (!fields) {return new Set<string>();}
    return new Set(fields.map(f => f.fieldKey));
  }, [fields]);
}

export interface ProductsPageProps {
  productTypeId?: Id<"productTypes">;
  categoryId?: Id<"productCategories">;
  priceRangeFilter?: PriceRange;
  attributeFilter?: {
    groupId: Id<"attributeGroups">;
    termId?: Id<"attributeTerms">;
    termSlug?: string;
  };
}

export default function ProductsPage(props: ProductsPageProps) {
  return (
    <Suspense fallback={<ProductsListSkeleton />}>
      <ProductsContent {...props} />
    </Suspense>
  );
}

function ProductsContent(props: ProductsPageProps) {
  const brandColors = useBrandColors();
  const brandColor = brandColors.primary;
  const { isDark } = useSiteSettings();
  const tokens = useMemo(
    () => getProductsListColors(brandColors.primary, brandColors.secondary, brandColors.mode || 'single', isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );
  const imageAspectRatio = useProductImageAspectRatioSetting();
  const imageAspectRatioStyle = useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs(imageAspectRatio);
  const listConfig = useProductsListConfig();
  const layout: ProductsListLayout = listConfig.layoutStyle === 'sidebar' ? 'catalog' : listConfig.layoutStyle;
  const radiusClass = getProductListRadiusClass(listConfig.cornerRadius);
  const enableQuickAddVariant = listConfig.enableQuickAddVariant ?? true;
  const showWishlistButton = listConfig.showWishlistButton ?? true;
  const checkoutConfig = useCheckoutConfig();
  const showPromotionBadge = listConfig.showPromotionBadge ?? true;
  const { customer, isAuthenticated, openLoginModal } = useCustomerAuth();
  const { addItem, openDrawer } = useCart();
  const cartConfig = useCartConfig();
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const toggleWishlist = useMutation(api.wishlist.toggle);
  const enabledFields = useEnabledProductFields();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const saleMode = useMemo<ProductsSaleMode>(() => {
    const value = saleModeSetting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [saleModeSetting?.value]);

  const showAddToCartButton = saleMode === 'cart' && (listConfig.showAddToCartButton ?? true);
  const showBuyNowButton = saleMode === 'cart'
    ? (listConfig.showBuyNowButton ?? true) && checkoutConfig.showBuyNow
    : true;
  const buyNowLabel = saleMode === 'contact' ? 'Liên hệ' : 'Mua ngay';

  const [quickAddTarget, setQuickAddTarget] = useState<null | {
    product: ProductCardProps['product'];
    action: 'addToCart' | 'buyNow';
  }>(null);

  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProductSortOption>('newest');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const isSearching = searchQuery.trim() !== debouncedSearchQuery.trim();
  const [pageSizeOverride, setPageSizeOverride] = useState<number | null>(null);
  const postsPerPage = pageSizeOverride ?? (listConfig.postsPerPage ?? 12);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchQuery]);

  const categories = useQuery(api.productCategories.listActive);
  const nonEmptyCategoryIds = useQuery(api.productCategories.listNonEmptyCategoryIds);

  const visibleCategories = useMemo(() => {
    if (!categories) {return undefined;}
    if (!listConfig.hideEmptyCategories) {return categories;}
    if (!nonEmptyCategoryIds) {return categories;}
    const nonEmptySet = new Set(nonEmptyCategoryIds);
    return categories.filter((category) => nonEmptySet.has(category._id));
  }, [categories, listConfig.hideEmptyCategories, nonEmptyCategoryIds]);

  const showCategorySubtitleSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'showCategorySubtitle' });
  const enableCategoryFilterFooterContentSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableCategoryFilterFooterContent' });
  const enableProductTypesSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableProductTypes' });

  const showCategorySubtitle = showCategorySubtitleSetting?.value === true;
  const enableCategoryFilterFooterContent = enableCategoryFilterFooterContentSetting?.value === true;
  const enableProductTypes = enableProductTypesSetting?.value === true;

  const categoryIds = useMemo(() => {
    return categories?.map((c) => c._id) ?? [];
  }, [categories]);

  const categoryTypes = useQuery(
    api.productTypes.listAssignedTypesForCategories,
    enableProductTypes && categoryIds.length > 0 ? { categoryIds } : 'skip'
  );

  const categoryToTypeMap = useMemo(() => {
    const map = new Map<Id<"productCategories">, { slug: string; name: string }>();
    if (!categoryTypes) return map;
    categoryTypes.forEach((row) => {
      if (row.types && row.types.length > 0) {
        map.set(row.categoryId, {
          slug: row.types[0].slug,
          name: row.types[0].name,
        });
      }
    });
    return map;
  }, [categoryTypes]);

  const productType = useQuery(api.productTypes.getById, props.productTypeId ? { id: props.productTypeId } : 'skip');
  const assignedCategories = useQuery(
    api.productTypes.listAssignedCategories,
    enableProductTypes && props.productTypeId ? { typeId: props.productTypeId } : 'skip'
  );
  const assignedGroups = useQuery(
    api.productTypes.listAssignedGroups,
    enableProductTypes && props.productTypeId ? { typeId: props.productTypeId } : 'skip'
  );

  const categoryOptions = useMemo(() => {
    const baseCategories = visibleCategories ?? categories ?? [];
    if (!enableProductTypes || !props.productTypeId) {
      return baseCategories;
    }
    if (!assignedCategories) {
      return [];
    }
    const assignedSet = new Set(assignedCategories.map((category) => category._id));
    return baseCategories.filter((category) => assignedSet.has(category._id));
  }, [assignedCategories, categories, enableProductTypes, props.productTypeId, visibleCategories]);

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery) return categoryOptions;
    return categoryOptions.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );
  }, [categoryOptions, categorySearchQuery]);

  const categorySlugFromPath = useMemo(() => {
    if (routeMode !== 'unified') {return null;}
    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment || segment === 'products') {return null;}
    return segment;
  }, [pathname, routeMode]);

  const isTaxonomyContext = enableProductTypes && Boolean(props.productTypeId || props.priceRangeFilter || props.attributeFilter);

  const categoryFromUrl = useMemo(() => {
    if (props.categoryId) return props.categoryId;
    const catSlug = isTaxonomyContext ? searchParams.get('category') : (categorySlugFromPath ?? searchParams.get('category'));
    if (!catSlug || categoryOptions.length === 0) {return null;}
    const matchedCategory = categoryOptions.find((c) => c.slug === catSlug);
    return matchedCategory?._id ?? null;
  }, [props.categoryId, isTaxonomyContext, searchParams, categorySlugFromPath, categoryOptions]);

  const activeCategory = categoryFromUrl;

  const rawFilterableGroups = useQuery(api.attributeGroups.listFilterable, enableProductTypes ? {} : 'skip');
  const filterableGroups = useMemo(() => {
    if (!rawFilterableGroups) return undefined;
    if (!enableProductTypes) {
      return [];
    }
    if (!props.productTypeId) {
      return [];
    }
    if (!assignedGroups) {
      return [];
    }
    const assignedSet = new Set(assignedGroups.map((group) => group._id));
    return rawFilterableGroups.filter((group) => assignedSet.has(group._id));
  }, [assignedGroups, enableProductTypes, props.productTypeId, rawFilterableGroups]);
  const productTypesData = useQuery(api.productTypes.listAll, enableProductTypes ? {} : 'skip');
  const productTypes = useMemo(() => productTypesData?.filter((t) => t.active) ?? [], [productTypesData]);

  // Load price range from URL or props
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);

  useEffect(() => {
    if (props.priceRangeFilter) {
      setSelectedPriceRange(props.priceRangeFilter);
    } else {
      const urlRangeSlug = searchParams.get('priceRange');
      if (urlRangeSlug && productType?.priceRanges) {
        const matched = productType.priceRanges.find(r => r.slug === urlRangeSlug);
        if (matched) setSelectedPriceRange(matched);
      } else {
        setSelectedPriceRange(null);
      }
    }
  }, [props.priceRangeFilter, searchParams, productType]);

  const selectedAttributes = useMemo(() => {
    const filters: Record<string, string[]> = {};
    if (!filterableGroups) return filters;

    // Tải từ props.attributeFilter nếu có (props.attributeFilter.termSlug)
    if (props.attributeFilter) {
      filters[props.attributeFilter.groupId] = props.attributeFilter.termSlug
        ? props.attributeFilter.termSlug.split(',')
        : [];
    }

    filterableGroups.forEach(group => {
      const param = searchParams.get(`attr_${group.slug}`);
      if (param) {
        filters[group._id] = param.split(',');
      }
    });
    return filters;
  }, [searchParams, filterableGroups, props.attributeFilter]);

  const attributeTermIds = useMemo(() => {
    const arr: Id<"attributeTerms">[][] = [];
    Object.entries(selectedAttributes).forEach(([groupId, termSlugs]) => {
      if (termSlugs.length > 0) {
        const group = filterableGroups?.find(g => g._id === groupId);
        if (group) {
          const matchedIds = group.terms
            .filter((t: any) => termSlugs.includes(t.slug))
            .map((t: any) => t._id as Id<"attributeTerms">);
          if (matchedIds.length > 0) {
            arr.push(matchedIds);
          }
        }
      }
    });
    return arr;
  }, [selectedAttributes, filterableGroups]);

  const isFilterActive = attributeTermIds.length > 0 || selectedPriceRange !== null;
  const hasActiveProductFilters = Boolean(
    activeCategory ||
    searchQuery.trim() ||
    debouncedSearchQuery.trim() ||
    selectedPriceRange ||
    attributeTermIds.length > 0 ||
    sortBy !== 'newest'
  );

  const activeCategoryDoc = useMemo(() => {
    if (!activeCategory || categoryOptions.length === 0) {return null;}
    return categoryOptions.find((c) => c._id === activeCategory) ?? null;
  }, [activeCategory, categoryOptions]);

  const paginatedSortBy = sortBy === 'popular' ? 'popular' : (sortBy === 'oldest' ? 'oldest' : 'newest');

  // Lấy giá trị min/max price thực tế
  const urlMinPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined;
  const urlMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined;
  const minPrice = urlMinPrice ?? selectedPriceRange?.minPrice ?? props.priceRangeFilter?.minPrice ?? undefined;
  const maxPrice = urlMaxPrice ?? selectedPriceRange?.maxPrice ?? props.priceRangeFilter?.maxPrice ?? undefined;
  const queryProductTypeId = props.productTypeId;

  const {
    results: infiniteResults,
    status: infiniteStatus,
    loadMore,
  } = usePaginatedQuery(
    api.products.listPublishedPaginated,
    {
      categoryId: activeCategory ?? undefined,
      productTypeId: queryProductTypeId ?? undefined,
      minPrice,
      maxPrice,
      sortBy: paginatedSortBy,
      attributeTermIds,
    },
    { initialNumItems: postsPerPage }
  );

  const isSearchActive = Boolean(debouncedSearchQuery?.trim());
  const isPaginationMode = listConfig.paginationType === 'pagination' || isSearchActive || isFilterActive;

  const offset = (urlPage - 1) * postsPerPage;
  const paginatedProducts = useQuery(
    api.products.listPublishedWithOffset,
    isPaginationMode
      ? {
          categoryId: activeCategory ?? undefined,
          productTypeId: queryProductTypeId ?? undefined,
          minPrice,
          maxPrice,
          limit: postsPerPage,
          offset,
          search: debouncedSearchQuery || undefined,
          sortBy,
          attributeTermIds,
        }
      : 'skip'
  );

  const products = useMemo(() => {
    if (isPaginationMode) {
      return paginatedProducts ?? [];
    }
    return infiniteResults;
  }, [infiniteResults, isPaginationMode, paginatedProducts]);

  const productIds = useMemo(() => products.map((product) => product._id), [products]);

  const productAttributesData = useQuery(
    api.attributeTerms.getTermsForProducts,
    enableProductTypes && productIds.length > 0
      ? { productIds }
      : 'skip'
  );

  const productAttributesMap = useMemo(() => {
    const map = new Map<string, any[]>();
    if (!productAttributesData) return map;
    for (const item of productAttributesData) {
      map.set(item.productId, item.terms);
    }
    return map;
  }, [productAttributesData]);

  const displayFilterableGroups = useMemo(() => {
    if (!filterableGroups) return undefined;
    if (!enableProductTypes) return filterableGroups;

    return filterableGroups.filter((group) => {
      const filterType = group.filterType || 'single';

      if (filterType === 'range') {
        const numericValues = (group.terms || [])
          .map((t: any) => {
            const match = t.name.match(/(\d+(\.\d+)?)/);
            return match ? parseFloat(match[1]) : null;
          })
          .filter((v: number | null): v is number => v !== null);
        if (numericValues.length <= 1) return false;
        return Math.min(...numericValues) !== Math.max(...numericValues);
      }

      return group.terms.length > 0;
    });
  }, [filterableGroups, enableProductTypes]);

  const wishlistProductIds = useQuery(
    api.wishlist.listCustomerProductIds,
    isAuthenticated && customer && productIds.length > 0 && (wishlistModule?.enabled ?? false)
      ? { customerId: customer.id as Id<'customers'>, productIds }
      : 'skip'
  );
  const wishlistIdSet = useMemo(() => new Set<Id<'products'>>(wishlistProductIds ?? []), [wishlistProductIds]);

  const totalCount = useQuery(api.products.countPublished, {
    categoryId: activeCategory ?? undefined,
    productTypeId: queryProductTypeId ?? undefined,
    minPrice,
    maxPrice,
    search: debouncedSearchQuery || undefined,
    attributeTermIds,
  });

  const categoryMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.name]));
  }, [categories]);

  const categorySlugMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.slug]));
  }, [categories]);

  const getProductDetailHref = useCallback((product: ProductCardProps['product']) => buildDetailPath({
    categorySlug: categorySlugMap.get(product.categoryId),
    mode: routeMode,
    moduleKey: 'products',
    recordSlug: product.slug,
  }), [categorySlugMap, routeMode]);

  useEffect(() => {
    if (isPaginationMode) {
      return;
    }
    if (inView && infiniteStatus === 'CanLoadMore') {
      loadMore(postsPerPage);
    }
  }, [inView, infiniteStatus, loadMore, postsPerPage, isPaginationMode]);

  const navigateWithFilters = useCallback((options: {
    nextCategoryId?: Id<"productCategories"> | null;
    nextPriceRange?: PriceRange | null;
    nextAttributes?: Record<string, string[]>;
    primary?: 'category' | 'priceRange' | 'attribute' | 'type';
    clickedGroupId?: string;
  }) => {
    const targetCategoryId = options.nextCategoryId !== undefined ? options.nextCategoryId : activeCategory;
    const targetPriceRange = options.nextPriceRange !== undefined ? options.nextPriceRange : selectedPriceRange;
    const targetAttributes = options.nextAttributes !== undefined ? options.nextAttributes : { ...selectedAttributes };

    if (!enableProductTypes) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      params.delete('priceRange');
      Array.from(params.keys()).forEach(key => {
        if (key.startsWith('attr_')) params.delete(key);
      });

      if (targetCategoryId && categoryOptions.length > 0) {
        const category = categoryOptions.find(c => c._id === targetCategoryId);
        if (category) {
          if (routeMode === 'unified') {
            router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'products' }), { scroll: false });
            return;
          }
          params.set('category', category.slug);
        }
      } else {
        params.delete('category');
      }

      const newUrl = params.toString()
        ? `${buildModuleListPath('products')}?${params.toString()}`
        : buildModuleListPath('products');
      router.push(newUrl, { scroll: false });
      return;
    }

    const assignedType = targetCategoryId ? categoryToTypeMap.get(targetCategoryId) : null;
    const effectiveProductTypeSlug = assignedType ? assignedType.slug : (productType ? productType.slug : null);
    const hasEffectiveProductType = !!effectiveProductTypeSlug;

    const hasCategory = !!targetCategoryId;
    const hasPriceRange = !!targetPriceRange;

    const activeAttrs: { groupId: string; groupSlug: string; termId: string; termSlug: string }[] = [];
    if (filterableGroups) {
      filterableGroups.forEach(group => {
        const termSlugs = targetAttributes[group._id] || [];
        termSlugs.forEach((termSlug: string) => {
          const term = group.terms.find((t: any) => t.slug === termSlug);
          if (term) {
            activeAttrs.push({
              groupId: group._id,
              groupSlug: group.slug,
              termId: term._id,
              termSlug: term.slug
            });
          }
        });
      });
    }

    const activeGroupsMap = new Map<string, { groupId: string; groupSlug: string; termSlugs: string[] }>();
    activeAttrs.forEach(attr => {
      if (!activeGroupsMap.has(attr.groupSlug)) {
        activeGroupsMap.set(attr.groupSlug, { groupId: attr.groupId, groupSlug: attr.groupSlug, termSlugs: [] });
      }
      activeGroupsMap.get(attr.groupSlug)!.termSlugs.push(attr.termSlug);
    });
    const activeGroups = Array.from(activeGroupsMap.values());
    const hasAttributes = activeGroups.length > 0;

    let primaryPath: 'category' | 'priceRange' | 'attribute' | 'type' = 'type';
    if (options.primary) {
      if (options.primary === 'category' && hasCategory) {
        primaryPath = 'category';
      } else if (options.primary === 'priceRange' && hasPriceRange) {
        primaryPath = 'priceRange';
      } else if (options.primary === 'attribute' && hasAttributes) {
        primaryPath = 'attribute';
      }
    } else {
      const currentPrimary: 'category' | 'priceRange' | 'attribute' | 'type' = props.categoryId
        ? 'category'
        : (props.priceRangeFilter ? 'priceRange' : (props.attributeFilter ? 'attribute' : 'type'));

      if (currentPrimary === 'category' && hasCategory) {
        primaryPath = 'category';
      } else if (currentPrimary === 'priceRange' && hasPriceRange) {
        primaryPath = 'priceRange';
      } else if (currentPrimary === 'attribute' && hasAttributes) {
        const currentGroupId = props.attributeFilter?.groupId;
        const isCurrentGroupActive = currentGroupId && targetAttributes[currentGroupId]?.length > 0;
        if (isCurrentGroupActive) {
          primaryPath = 'attribute';
        } else {
          if (hasCategory) primaryPath = 'category';
          else if (hasPriceRange) primaryPath = 'priceRange';
          else if (hasAttributes) primaryPath = 'attribute';
        }
      } else {
        if (hasCategory) primaryPath = 'category';
        else if (hasPriceRange) primaryPath = 'priceRange';
        else if (hasAttributes) primaryPath = 'attribute';
      }
    }

    let path = `/products`;
    const params = new URLSearchParams();

    const searchVal = searchParams.get('search');
    if (searchVal) params.set('search', searchVal);
    const sortVal = searchParams.get('sort');
    if (sortVal) params.set('sort', sortVal);

    if (!hasEffectiveProductType) {
      path = `/products`;
      if (hasCategory) {
        const category = (categories ?? []).find(c => c._id === targetCategoryId);
        if (category) params.set('category', category.slug);
      }
      if (hasPriceRange) {
        params.set('priceRange', targetPriceRange!.slug);
      }
      activeGroups.forEach(g => {
        params.set(`attr_${g.groupSlug}`, g.termSlugs.join(','));
      });
    } else {
      const baseSlug = effectiveProductTypeSlug!;
      if (primaryPath === 'category' && hasCategory) {
        const category = (categories ?? []).find(c => c._id === targetCategoryId);
        if (category) {
          path = `/${baseSlug}/${category.slug}`;
        }
        if (hasPriceRange) {
          params.set('priceRange', targetPriceRange!.slug);
        }
        activeGroups.forEach(g => {
          params.set(`attr_${g.groupSlug}`, g.termSlugs.join(','));
        });
      } else if (primaryPath === 'priceRange' && hasPriceRange) {
        path = `/${baseSlug}/${targetPriceRange!.slug}`;
        if (hasCategory) {
          const category = (categories ?? []).find(c => c._id === targetCategoryId);
          if (category) params.set('category', category.slug);
        }
        activeGroups.forEach(g => {
          params.set(`attr_${g.groupSlug}`, g.termSlugs.join(','));
        });
      } else if (primaryPath === 'attribute' && hasAttributes) {
        let primaryGroup = activeGroups[0];
        if (options.primary === 'attribute' && options.clickedGroupId) {
          const clicked = activeGroups.find(g => g.groupId === options.clickedGroupId);
          if (clicked) primaryGroup = clicked;
        } else if (props.attributeFilter && props.attributeFilter.groupId) {
          const filterGroupId = props.attributeFilter.groupId;
          const current = activeGroups.find(g => g.groupId === filterGroupId);
          if (current) primaryGroup = current;
        }

        const primaryGroupFilterType = filterableGroups?.find(g => g._id === primaryGroup.groupId)?.filterType;
        const isRangeGroup = primaryGroupFilterType === 'range';

        if (isRangeGroup) {
          const nonRangePrimary = activeGroups.find(g => {
            const ft = filterableGroups?.find(fg => fg._id === g.groupId)?.filterType;
            return ft !== 'range';
          });
          if (nonRangePrimary) {
            path = `/${baseSlug}/${nonRangePrimary.groupSlug}/${nonRangePrimary.termSlugs.join(',')}`;
            if (hasCategory) {
              const category = (categories ?? []).find(c => c._id === targetCategoryId);
              if (category) params.set('category', category.slug);
            }
            if (hasPriceRange) params.set('priceRange', targetPriceRange!.slug);
            activeGroups.forEach(g => {
              if (g.groupId !== nonRangePrimary.groupId) {
                params.set(`attr_${g.groupSlug}`, g.termSlugs.join(','));
              }
            });
          } else {
            path = `/${baseSlug}`;
            if (hasCategory) {
              const category = (categories ?? []).find(c => c._id === targetCategoryId);
              if (category) params.set('category', category.slug);
            }
            if (hasPriceRange) params.set('priceRange', targetPriceRange!.slug);
            activeGroups.forEach(g => {
              params.set(`attr_${g.groupSlug}`, g.termSlugs.join(','));
            });
          }
        } else {
          path = `/${baseSlug}/${primaryGroup.groupSlug}/${primaryGroup.termSlugs.join(',')}`;

          if (hasCategory) {
            const category = (categories ?? []).find(c => c._id === targetCategoryId);
            if (category) params.set('category', category.slug);
          }
          if (hasPriceRange) {
            params.set('priceRange', targetPriceRange!.slug);
          }
          activeGroups.forEach(g => {
            if (g.groupId !== primaryGroup.groupId) {
              params.set(`attr_${g.groupSlug}`, g.termSlugs.join(','));
            }
          });
        }
      } else {
        path = `/${baseSlug}`;
        if (hasCategory) {
          const category = (categories ?? []).find(c => c._id === targetCategoryId);
          if (category) params.set('category', category.slug);
        }
        if (hasPriceRange) {
          params.set('priceRange', targetPriceRange!.slug);
        }
        activeGroups.forEach(g => {
          params.set(`attr_${g.groupSlug}`, g.termSlugs.join(','));
        });
      }
    }

    const queryStr = params.toString();
    const finalUrl = queryStr ? `${path}?${queryStr}` : path;
    router.push(finalUrl, { scroll: false });
  }, [enableProductTypes, productType, activeCategory, selectedPriceRange, selectedAttributes, categoryOptions, filterableGroups, searchParams, routeMode, router, props.categoryId, props.priceRangeFilter, props.attributeFilter, categoryToTypeMap, categories]);

  const handleCategoryChange = useCallback((categoryId: Id<"productCategories"> | null) => {
    navigateWithFilters({ nextCategoryId: categoryId, primary: 'category' });
  }, [navigateWithFilters]);

  const handleAttributeChange = useCallback((groupSlug: string, termSlug: any, checked: boolean) => {
    const group = filterableGroups?.find(g => g.slug === groupSlug);
    if (!group) return;

    const groupId = group._id;
    let nextTermSlugs: string[] = [];

    if (Array.isArray(termSlug)) {
      nextTermSlugs = termSlug;
    } else if (termSlug === '') {
      nextTermSlugs = [];
    } else if (group.filterType === 'single') {
      nextTermSlugs = checked ? [termSlug] : [];
    } else {
      const currentTermSlugs = selectedAttributes[groupId] || [];
      nextTermSlugs = [...currentTermSlugs];
      if (checked) {
        if (!nextTermSlugs.includes(termSlug)) nextTermSlugs.push(termSlug);
      } else {
        nextTermSlugs = nextTermSlugs.filter(slug => slug !== termSlug);
      }
    }

    const nextAttributes = {
      ...selectedAttributes,
      [groupId]: nextTermSlugs
    };

    navigateWithFilters({ nextAttributes, primary: 'attribute', clickedGroupId: groupId });
  }, [filterableGroups, selectedAttributes, navigateWithFilters]);

  const handlePriceRangeChange = useCallback((priceRange: PriceRange | null) => {
    navigateWithFilters({ nextPriceRange: priceRange, primary: 'priceRange' });
  }, [navigateWithFilters]);

  const handleProductTypeChange = useCallback((typeSlug: string | null) => {
    if (typeSlug) {
      router.push(`/${typeSlug}`, { scroll: false });
    } else {
      router.push(buildModuleListPath('products'), { scroll: false });
    }
  }, [router]);

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSortBy('newest');
    setSelectedPriceRange(null);
    const basePath = enableProductTypes && productType?.slug ? `/${productType.slug}` : buildModuleListPath('products');
    router.push(basePath, { scroll: false });
  }, [enableProductTypes, productType?.slug, router]);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSizeOverride(value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, pathname, router]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (isTaxonomyContext) {
      return;
    }
    const catSlug = categorySlugFromPath ?? searchParams.get('category');
    if (!catSlug || categoryOptions.length === 0) {return;}
    const hasMatch = categoryOptions.some((category) => category.slug === catSlug);
    if (hasMatch) {return;}
    if (routeMode === 'unified' && categorySlugFromPath) {
      router.replace(buildModuleListPath('products'), { scroll: false });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [categoryOptions, categorySlugFromPath, pathname, router, routeMode, searchParams, isTaxonomyContext]);

  const filterKey = `${activeCategory ?? ''}|${debouncedSearchQuery}|${sortBy}|${postsPerPage}|${JSON.stringify(attributeTermIds)}`;
  const prevFilterKeyRef = useRef(filterKey);

  useEffect(() => {
    if (listConfig.paginationType !== 'pagination') {
      prevFilterKeyRef.current = filterKey;
      return;
    }

    const hasFilterChanged = prevFilterKeyRef.current !== filterKey;
    if (hasFilterChanged && urlPage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    prevFilterKeyRef.current = filterKey;
  }, [filterKey, listConfig.paginationType, pathname, router, searchParams, urlPage]);
  
  const isLoadingProducts = isSearching || (isSearchActive && paginatedProducts === undefined) || (listConfig.paginationType === 'pagination' ? paginatedProducts === undefined : infiniteStatus === 'LoadingFirstPage');

  if (categories === undefined || listConfig.isLoading) {
    return <ProductsListSkeleton />;
  }

  const showPrice = enabledFields.has('price') || enabledFields.size === 0;
  const showSalePrice = enabledFields.has('salePrice');
  const showStock = enabledFields.has('stock');
  const canUseWishlist = showWishlistButton && (wishlistModule?.enabled ?? false);

  const handleWishlistToggle = async (productId: Id<'products'>) => {
    if (!isAuthenticated || !customer) {
      openLoginModal();
      return;
    }
    await toggleWishlist({ customerId: customer.id as Id<'customers'>, productId });
  };

  const openQuickAdd = (product: ProductCardProps['product'], action: 'addToCart' | 'buyNow') => {
    setQuickAddTarget({ product, action });
  };

  const closeQuickAdd = () => setQuickAddTarget(null);

  const handleQuickAddConfirm = async (variantId: Id<'productVariants'>, quantity: number) => {
    if (!quickAddTarget) {
      return;
    }

    const { product, action } = quickAddTarget;

    if (action === 'addToCart') {
      await addItem(product._id, quantity, variantId);
      notifyAddToCart();
      if (cartConfig.layoutStyle === 'drawer') {
        openDrawer();
      } else {
        router.push('/cart');
      }
    } else {
      router.push(`/checkout?productId=${product._id}&quantity=${quantity}&variantId=${variantId}`);
    }

    setQuickAddTarget(null);
  };

  const handleAddToCart = async (product: ProductCardProps['product']) => {
    if (showStock && !product.hasVariants && product.stock <= 0) {
      return;
    }

    if (product.hasVariants) {
      if (enableQuickAddVariant) {
        openQuickAdd(product, 'addToCart');
        return;
      }
      router.push(getProductDetailHref(product));
      return;
    }

    await addItem(product._id, 1);
    notifyAddToCart();
    if (cartConfig.layoutStyle === 'drawer') {
      openDrawer();
    } else {
      router.push('/cart');
    }
  };

  const handleBuyNow = (product: ProductCardProps['product']) => {
    if (showStock && !product.hasVariants && product.stock <= 0) {
      return;
    }

    if (product.hasVariants) {
      if (enableQuickAddVariant) {
        openQuickAdd(product, 'buyNow');
        return;
      }
      router.push(getProductDetailHref(product));
      return;
    }

    router.push(`/checkout?productId=${product._id}&quantity=1`);
  };

  const handlePrimaryAction = (product: ProductCardProps['product']) => {
    if (showStock && !product.hasVariants && product.stock <= 0) {
      return;
    }

    if (saleMode === 'contact') {
      router.push('/contact');
      return;
    }

    if (saleMode === 'affiliate') {
      const affiliateLink = product.affiliateLink?.trim();
      if (affiliateLink) {
        window.open(affiliateLink, '_blank', 'noopener,noreferrer');
        return;
      }
      router.push(getProductDetailHref(product));
      return;
    }

    handleBuyNow(product);
  };

  const paginationNode = (
    <>
      {listConfig.paginationType === 'pagination' && !!totalCount && totalCount > postsPerPage && (
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="order-2 flex w-full items-center justify-between text-sm sm:order-1 sm:w-auto sm:justify-start sm:gap-6"
            style={{ color: tokens.metaText }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: tokens.bodyText }}>Hiển thị</span>
              <select
                value={postsPerPage}
                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                className="h-8 w-[70px] appearance-none rounded-md border px-2 text-sm font-medium shadow-sm focus:outline-none"
                style={{
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                }}
                aria-label="Số bài mỗi trang"
              >
                {[12, 20, 24, 48, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>bài/trang</span>
            </div>

            <div className="text-right sm:text-left">
              <span className="font-medium" style={{ color: tokens.bodyText }}>
                {totalCount ? ((urlPage - 1) * postsPerPage) + 1 : 0}–{Math.min(urlPage * postsPerPage, totalCount ?? 0)}
              </span>
              <span className="mx-1" style={{ color: tokens.paginationEllipsisText }}>/</span>
              <span className="font-medium" style={{ color: tokens.bodyText }}>{totalCount ?? 0}</span>
              <span className="ml-1" style={{ color: tokens.metaText }}>sản phẩm</span>
            </div>
          </div>

          <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
            <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
              <button
                onClick={() => handlePageChange(urlPage - 1)}
                disabled={urlPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={urlPage === 1
                  ? { color: tokens.paginationDisabledText, borderColor: tokens.inputBorder, backgroundColor: tokens.paginationButtonBg }
                  : { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder, backgroundColor: tokens.paginationButtonBg }
                }
                aria-label="Trang trước"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>

              {generatePaginationItems(urlPage, Math.ceil(totalCount / postsPerPage)).map((item, index) => {
                if (item === 'ellipsis') {
                  return (
                    <div
                      key={`ellipsis-${index}`}
                      className="flex h-8 w-8 items-center justify-center"
                      style={{ color: tokens.paginationEllipsisText }}
                    >
                      …
                    </div>
                  );
                }

                const pageNum = item as number;
                const isActive = pageNum === urlPage;
                const isMobileHidden = !isActive && pageNum !== 1 && pageNum !== Math.ceil(totalCount / postsPerPage);

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 border ${isMobileHidden ? 'hidden sm:inline-flex' : ''}`}
                    style={isActive
                      ? {
                          backgroundColor: tokens.paginationActiveBg,
                          borderColor: tokens.paginationActiveBorder,
                          color: tokens.paginationActiveText,
                        }
                      : {
                          backgroundColor: tokens.paginationButtonBg,
                          borderColor: tokens.paginationButtonBorder,
                          color: tokens.paginationButtonText,
                        }
                    }
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(urlPage + 1)}
                disabled={totalCount ? urlPage >= Math.ceil(totalCount / postsPerPage) : true}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={totalCount && urlPage < Math.ceil(totalCount / postsPerPage)
                  ? { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder, backgroundColor: tokens.paginationButtonBg }
                  : { color: tokens.paginationDisabledText, borderColor: tokens.inputBorder, backgroundColor: tokens.paginationButtonBg }
                }
                aria-label="Trang sau"
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            </nav>
          </div>
        </div>
      )}

      {listConfig.paginationType === 'infiniteScroll' && infiniteStatus !== 'Exhausted' && (
        <div ref={loadMoreRef} className="text-center mt-6 py-8">
          {infiniteStatus === 'LoadingMore' ? (
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotStrong }} />
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotMedium }} />
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotSoft }} />
            </div>
          ) : infiniteStatus === 'CanLoadMore' ? (
            <p className="text-sm" style={{ color: tokens.neutralTextLight }}>Cuộn để xem thêm...</p>
          ) : null}
        </div>
      )}

      {listConfig.paginationType === 'infiniteScroll' && infiniteStatus === 'Exhausted' && products.length > 0 && (
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: tokens.neutralTextLight }}>Đã hiển thị tất cả {products.length} sản phẩm</p>
        </div>
      )}
    </>
  );

  const quickAddModal = quickAddTarget ? (
    <QuickAddVariantModal
      key={`${quickAddTarget.product._id}-${quickAddTarget.action}`}
      isOpen={Boolean(quickAddTarget)}
      product={quickAddTarget.product}
      brandColor={brandColor}
      actionLabel={quickAddTarget.action === 'buyNow' ? 'Mua ngay' : 'Thêm vào giỏ'}
      onClose={closeQuickAdd}
      onConfirm={handleQuickAddConfirm}
    />
  ) : null;

  if (layout === 'catalog') {
    return (
      <>
        <CatalogLayout
          isLoadingProducts={isLoadingProducts}
          postsPerPage={postsPerPage}
          products={isLoadingProducts ? [] : products}
          categories={categoryOptions}
          categoryMap={categoryMap}
          selectedCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          tokens={tokens}
          showPrice={showPrice}
          showSalePrice={showSalePrice}
          showStock={showStock}
          saleMode={saleMode}
          totalCount={totalCount}
          paginationNode={paginationNode}
          showWishlistButton={showWishlistButton}
          showAddToCartButton={showAddToCartButton}
          showBuyNowButton={showBuyNowButton}
          buyNowLabel={buyNowLabel}
          showPromotionBadge={showPromotionBadge}
          wishlistIdSet={wishlistIdSet}
          onToggleWishlist={handleWishlistToggle}
          onAddToCart={handleAddToCart}
          onBuyNow={handlePrimaryAction}
          canUseWishlist={canUseWishlist}
          imageAspectRatioStyle={imageAspectRatioStyle}
          frameConfig={frameConfig}
          watermarkConfig={watermarkConfig}
          getDetailHref={getProductDetailHref}
          activeCategoryDoc={activeCategoryDoc}
          showCategorySubtitle={showCategorySubtitle}
          enableCategoryFilterFooterContent={enableCategoryFilterFooterContent}
          filterableGroups={displayFilterableGroups}
          selectedAttributes={selectedAttributes}
          onAttributeChange={handleAttributeChange}
          productType={productType}
          selectedPriceRange={selectedPriceRange}
          onPriceRangeChange={handlePriceRangeChange}
          enableProductTypes={enableProductTypes}
          productTypes={productTypes}
          onProductTypeChange={handleProductTypeChange}
          attributeFilter={props.attributeFilter}
          hasActiveFilters={hasActiveProductFilters}
          onClearFilters={handleClearAllFilters}
          radiusClass={radiusClass}
          productAttributesMap={productAttributesMap}
          showSearch={listConfig.showSearch}
          showCategories={listConfig.showCategories}
          cartButtonsLayout={listConfig.cartButtonsLayout}
          priceFilterMode={listConfig.priceFilterMode}
          gridColumns={listConfig.gridColumns}
        />
        {quickAddModal}
      </>
    );
  }

  if (layout === 'list') {
    return (
      <>
        <ListLayout
          isLoadingProducts={isLoadingProducts}
          postsPerPage={postsPerPage}
          products={isLoadingProducts ? [] : products}
          categories={categoryOptions}
          categoryMap={categoryMap}
          selectedCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          tokens={tokens}
          showPrice={showPrice}
          showSalePrice={showSalePrice}
          showStock={showStock}
          saleMode={saleMode}
          totalCount={totalCount}
          paginationNode={paginationNode}
          showWishlistButton={showWishlistButton}
          showAddToCartButton={showAddToCartButton}
          showBuyNowButton={showBuyNowButton}
          buyNowLabel={buyNowLabel}
          showPromotionBadge={showPromotionBadge}
          wishlistIdSet={wishlistIdSet}
          onToggleWishlist={handleWishlistToggle}
          onAddToCart={handleAddToCart}
          onBuyNow={handlePrimaryAction}
          canUseWishlist={canUseWishlist}
          imageAspectRatioStyle={imageAspectRatioStyle}
          frameConfig={frameConfig}
          watermarkConfig={watermarkConfig}
          getDetailHref={getProductDetailHref}
          activeCategoryDoc={activeCategoryDoc}
          showCategorySubtitle={showCategorySubtitle}
          enableCategoryFilterFooterContent={enableCategoryFilterFooterContent}
          filterableGroups={displayFilterableGroups}
          selectedAttributes={selectedAttributes}
          onAttributeChange={handleAttributeChange}
          productType={productType}
          selectedPriceRange={selectedPriceRange}
          onPriceRangeChange={handlePriceRangeChange}
          enableProductTypes={enableProductTypes}
          productTypes={productTypes}
          onProductTypeChange={handleProductTypeChange}
          attributeFilter={props.attributeFilter}
          hasActiveFilters={hasActiveProductFilters}
          onClearFilters={handleClearAllFilters}
          radiusClass={radiusClass}
          productAttributesMap={productAttributesMap}
          showSearch={listConfig.showSearch}
          showCategories={listConfig.showCategories}
          cartButtonsLayout={listConfig.cartButtonsLayout}
          priceFilterMode={listConfig.priceFilterMode}
          gridColumns={listConfig.gridColumns}
        />
        {quickAddModal}
      </>
    );
  }

  return (
    <>
      <div className="py-8 md:py-12 px-4">
        <div className="max-w-7xl mx-auto">
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

          <MobileProductsFilters
            categories={categoryOptions}
            selectedCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            tokens={tokens}
            filterableGroups={displayFilterableGroups}
            selectedAttributes={selectedAttributes}
            onAttributeChange={handleAttributeChange}
            productType={productType}
            selectedPriceRange={selectedPriceRange}
            onPriceRangeChange={handlePriceRangeChange}
            enableProductTypes={enableProductTypes}
            productTypes={productTypes}
            onProductTypeChange={handleProductTypeChange}
            attributeFilter={props.attributeFilter}
            hasActiveFilters={hasActiveProductFilters}
            onClearFilters={handleClearAllFilters}
            radiusClass={radiusClass}
          />

          <div
            className={`hidden lg:block ${radiusClass} border p-3 mb-5`}
            style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}
          >
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inputIcon }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); }}
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
                    onClick={() => { setSearchQuery(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: tokens.inputIcon }}
                    aria-label="Xóa tìm kiếm"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {enableProductTypes && productTypes && productTypes.length > 0 && (
                <div className="hidden lg:flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={productType?.slug ?? ''}
                      onChange={(e) => { handleProductTypeChange(e.target.value || null); }}
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
                      {activeCategory
                        ? categoryOptions.find((cat) => cat._id === activeCategory)?.name ?? 'Tất cả danh mục'
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
                            handleCategoryChange(null);
                            setIsCategoryDropdownOpen(false);
                            setCategorySearchQuery('');
                          }}
                          className="w-full px-2.5 py-1.5 rounded-md text-left text-xs transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: !activeCategory ? `${tokens.primary}18` : 'transparent',
                            color: !activeCategory ? tokens.primary : tokens.inputText,
                            fontWeight: !activeCategory ? 'bold' : 'normal',
                          }}
                        >
                          Tất cả danh mục
                        </button>

                        {filteredCategories.length === 0 ? (
                          <p className="text-xs text-center py-4 opacity-60">Không tìm thấy danh mục</p>
                        ) : (
                          filteredCategories.map((cat) => {
                            const isSelected = activeCategory === cat._id;
                            return (
                              <button
                                key={cat._id}
                                type="button"
                                onClick={() => {
                                  handleCategoryChange(cat._id);
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

              {enableProductTypes && productType?.priceRanges && productType.priceRanges.length > 0 && (
                <div className="hidden lg:flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={selectedPriceRange?.slug ?? ''}
                      onChange={(e) => {
                        const matched = productType?.priceRanges?.find((r: PriceRange) => r.slug === e.target.value);
                        handlePriceRangeChange(matched ?? null);
                      }}
                      className="h-10 w-[200px] pl-3 pr-8 rounded-lg border text-sm outline-none appearance-none truncate"
                      style={{
                        borderColor: tokens.inputBorder,
                        backgroundColor: tokens.inputBackground,
                        color: tokens.inputText,
                      }}
                    >
                      <option value="">Tất cả khoảng giá</option>
                      {productType.priceRanges.map((range: PriceRange) => (
                        <option key={range.slug} value={range.slug}>{range.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.inputIcon }} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto shrink-0">
                {hasActiveProductFilters && (
                  <ClearFiltersButton tokens={tokens} onClear={handleClearAllFilters} />
                )}
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as ProductSortOption); }}
                  className="h-10 px-3 rounded-lg border text-sm outline-none"
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



          {isLoadingProducts ? (
            <ProductsGridSkeleton count={postsPerPage} tokens={tokens} />
          ) : products.length === 0 ? (
            <EmptyState tokens={tokens} onReset={handleClearAllFilters} />
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
              onToggleWishlist={handleWishlistToggle}
              onAddToCart={handleAddToCart}
              onBuyNow={handlePrimaryAction}
              canUseWishlist={canUseWishlist}
              imageAspectRatioStyle={imageAspectRatioStyle}
              frameConfig={frameConfig}
              watermarkConfig={watermarkConfig}
              getDetailHref={getProductDetailHref}
              radiusClass={radiusClass}
              productAttributesMap={productAttributesMap}
              onAttributeChange={handleAttributeChange}
              selectedAttributes={selectedAttributes}
              cartButtonsLayout={listConfig.cartButtonsLayout}
              gridColumns={listConfig.gridColumns}
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
      {quickAddModal}
    </>
  );
}
