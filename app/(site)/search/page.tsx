'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { useCart, notifyAddToCart } from '@/lib/cart';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { getPublicPriceLabel } from '@/lib/products/public-price';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { 
  Search, 
  LayoutGrid, 
  LayoutList, 
  Loader2, 
  Package, 
  GraduationCap,
  BookOpen,
  FileText, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart, 
  X, 
  Calendar, 
  Eye, 
  Compass,
  Heart,
  Download
} from 'lucide-react';
import { useSearchFilterConfig } from '@/lib/experiences';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import type { Id } from '@/convex/_generated/dataModel';
import { CategoryCombobox } from './_components/CategoryCombobox';
import { QuickAddVariantModal } from '@/components/products/QuickAddVariantModal';

// Helper format price
const formatPrice = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(value);
};

const formatCoursePrice = (pricingType: string, price?: number) => {
  if (pricingType === 'free') return 'Miễn phí';
  if (pricingType === 'contact' || !price) return 'Liên hệ';
  return formatPrice(price);
};

const formatResourcePrice = formatCoursePrice;

// Component Skeleton
function SearchPageSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-6 md:py-10 animate-pulse">
      <div className="h-10 w-2/3 max-w-md bg-slate-200 rounded-lg mx-auto mb-8" />
      <div className="h-14 w-full max-w-xl bg-slate-200 rounded-full mx-auto mb-10" />
      <div className="h-10 w-full max-w-md bg-slate-200 rounded-lg mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="border border-slate-100 rounded-2xl p-4">
            <div className="aspect-square bg-slate-200 rounded-xl mb-4" />
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Function build pagination
function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = [];
  const siblingCount = 1;

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

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
    items.push(1);
    items.push('ellipsis');
    const rightRange = 3 + 2 * siblingCount;
    for (let i = totalPages - rightRange + 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  items.push(1);
  items.push('ellipsis');
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    items.push(i);
  }
  items.push('ellipsis');
  items.push(totalPages);

  return items;
}

function SearchProductCardActions({
  product,
  primaryColor,
  showAddToCartButton,
  showBuyNowButton,
  cartButtonsLayout,
  enableQuickAddVariant,
  onAddToCart,
  onBuyNow
}: {
  product: any;
  primaryColor: string;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  cartButtonsLayout?: 'stack' | 'grid-2';
  enableQuickAddVariant: boolean;
  onAddToCart: (e: React.MouseEvent) => void;
  onBuyNow: (e: React.MouseEvent) => void;
}) {
  const { isDark } = useSiteSettings();

  if (!showAddToCartButton && !showBuyNowButton) return null;

  const isOutOfStock = !product.hasVariants && product.stock <= 0;
  const isGrid2 = cartButtonsLayout === 'grid-2' && showAddToCartButton && showBuyNowButton;
  const gridColsClass = isGrid2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className={`grid ${gridColsClass} gap-1.5 sm:gap-2 w-full mt-auto pt-3`}>
      {showAddToCartButton && (
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock}
          className="w-full flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border disabled:opacity-55 disabled:cursor-not-allowed text-white hover:brightness-95 hover:scale-[1.02]"
          style={{
            backgroundColor: !isOutOfStock ? primaryColor : (isDark ? '#2c2c2e' : '#f1f5f9'),
            color: !isOutOfStock ? '#ffffff' : (isDark ? '#86868b' : '#64748b'),
            borderColor: !isOutOfStock ? 'transparent' : (isDark ? '#3f3f46' : '#e2e8f0')
          }}
        >
          <ShoppingCart size={12} />
          <span>{isOutOfStock ? 'Hết hàng' : (product.hasVariants && !enableQuickAddVariant ? 'Chọn phân loại' : 'Thêm giỏ')}</span>
        </button>
      )}
      {showBuyNowButton && (
        <button
          type="button"
          onClick={onBuyNow}
          disabled={isOutOfStock}
          className="w-full flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border disabled:opacity-55 disabled:cursor-not-allowed hover:brightness-95 hover:scale-[1.02]"
          style={{
            backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
            color: !isOutOfStock ? primaryColor : (isDark ? '#86868b' : '#64748b'),
            borderColor: !isOutOfStock ? primaryColor : (isDark ? '#3f3f46' : '#e2e8f0')
          }}
        >
          <span>{isOutOfStock ? 'Hết hàng' : 'Mua ngay'}</span>
        </button>
      )}
    </div>
  );
}

function SearchContent() {
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  
  const primaryColor = brandColors.primary || '#ea580c';
  const secondaryColor = brandColors.secondary || '#f97316';
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // URL Params
  const query = searchParams.get('q') || '';
  const activeTab = (searchParams.get('tab') || 'product') as 'product' | 'post' | 'service' | 'course' | 'resource';
  const viewMode = (searchParams.get('view') || 'grid') as 'grid' | 'list';
  const sortBy = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest' | 'popular' | 'price_asc' | 'price_desc' | 'name';
  
  // Filter Categories
  const pCat = searchParams.get('p_cat') || '';
  const bCat = searchParams.get('b_cat') || '';
  const sCat = searchParams.get('s_cat') || '';
  const cCat = searchParams.get('c_cat') || '';
  const rCat = searchParams.get('r_cat') || '';
  
  // Pages
  const pPage = Number(searchParams.get('p_page')) || 1;
  const bPage = Number(searchParams.get('b_page')) || 1;
  const sPage = Number(searchParams.get('s_page')) || 1;
  const cPage = Number(searchParams.get('c_page')) || 1;
  const rPage = Number(searchParams.get('r_page')) || 1;
  
  const itemsPerPage = 12;

  // Track if we have already checked and auto-switched tabs for the current query
  const lastCheckedQueryRef = React.useRef<string | null>(null);

  // Local Search Input state
  const [searchInput, setSearchInput] = useState(query);
  
  // Sync search input with URL query change
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Cart
  const { addItem, openDrawer } = useCart();

  const [quickAddTarget, setQuickAddTarget] = useState<null | {
    product: any;
    action: 'addToCart' | 'buyNow';
  }>(null);

  // Search Filter Experience Config
  const searchFilterConfig = useSearchFilterConfig();
  const enableQuickAddVariant = searchFilterConfig.enableQuickAddVariant ?? true;
  const cornerRadiusClass = searchFilterConfig.cornerRadius === 'none' ? 'rounded-none' 
    : searchFilterConfig.cornerRadius === 'sm' ? 'rounded-lg' 
    : 'rounded-2xl';

  const openQuickAdd = (product: any, action: 'addToCart' | 'buyNow') => {
    setQuickAddTarget({ product, action });
  };
  const closeQuickAdd = () => setQuickAddTarget(null);
  const handleQuickAddConfirm = async (variantId: Id<'productVariants'>, quantity: number) => {
    if (!quickAddTarget) return;
    const { product, action } = quickAddTarget;
    if (action === 'buyNow') {
      router.push(`/checkout?productId=${product._id}&variantId=${variantId}&quantity=${quantity}`);
    } else {
      await addItem(product._id, quantity, variantId);
      notifyAddToCart();
      openDrawer();
    }
    setQuickAddTarget(null);
  };

  // Route Mode & Settings
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const productPlaceholderSetting = useQuery(api.settings.getValue, { key: 'product_image_placeholder', defaultValue: '' });
  const productPlaceholder = typeof productPlaceholderSetting === 'string' ? productPlaceholderSetting : '';

  // Check Module Statuses
  const productsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'products' });
  const postsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'posts' });
  const servicesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'services' });
  const coursesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'courses' });
  const resourcesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'resources' });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const commerceCapabilities = useQuery(api.cart.getCommerceCapabilities, {});
  const toggleWishlist = useMutation(api.wishlist.toggle);
  const { customer, isAuthenticated } = useCustomerAuth();

  const isProductsEnabled = productsModule?.enabled ?? false;
  const isPostsEnabled = postsModule?.enabled ?? false;
  const isServicesEnabled = servicesModule?.enabled ?? false;
  const isCoursesEnabled = coursesModule?.enabled ?? false;
  const isResourcesEnabled = resourcesModule?.enabled ?? false;
  const isModulesLoading = productsModule === undefined || postsModule === undefined || servicesModule === undefined || coursesModule === undefined || resourcesModule === undefined;

  // Derived button visibility flags (respects experience config + module status)
  const canUseWishlist = (wishlistModule?.enabled ?? false) && searchFilterConfig.showWishlistButton;
  const canUseCart = Boolean(commerceCapabilities?.cartAvailable && commerceCapabilities.providers.some((provider) => provider.provider === 'products' && provider.cartCapable));
  const showAddToCartButton = canUseCart && searchFilterConfig.showAddToCartButton;
  const showBuyNowButton = canUseCart && searchFilterConfig.showBuyNowButton;

  // Active Categories of each type
  const productCategories = useQuery(api.productCategories.listActive);
  const postCategories = useQuery(api.postCategories.listActive, { limit: 50 });
  const serviceCategories = useQuery(api.serviceCategories.listActive, { limit: 50 });
  const courseCategories = useQuery(api.courseCategories.listActive, { limit: 50 });
  const resourceCategories = useQuery(api.resourceCategories.listActive, { limit: 50 });

  const productCategoryMap = useMemo(() => new Map<string, string>(productCategories?.map((c: any) => [c._id, c.name]) || []), [productCategories]);
  const productCategorySlugMap = useMemo(() => new Map<string, string>(productCategories?.map((c: any) => [c._id, c.slug]) || []), [productCategories]);
  
  const postCategoryMap = useMemo(() => new Map<string, string>(postCategories?.map((c: any) => [c._id, c.name]) || []), [postCategories]);
  const postCategorySlugMap = useMemo(() => new Map<string, string>(postCategories?.map((c: any) => [c._id, c.slug]) || []), [postCategories]);
  
  const serviceCategoryMap = useMemo(() => new Map<string, string>(serviceCategories?.map((c: any) => [c._id, c.name]) || []), [serviceCategories]);
  const serviceCategorySlugMap = useMemo(() => new Map<string, string>(serviceCategories?.map((c: any) => [c._id, c.slug]) || []), [serviceCategories]);
  const courseCategoryMap = useMemo(() => new Map<string, string>(courseCategories?.map((c: any) => [c._id, c.name]) || []), [courseCategories]);
  const courseCategorySlugMap = useMemo(() => new Map<string, string>(courseCategories?.map((c: any) => [c._id, c.slug]) || []), [courseCategories]);
  const resourceCategoryMap = useMemo(() => new Map<string, string>(resourceCategories?.map((c: any) => [c._id, c.name]) || []), [resourceCategories]);
  const resourceCategorySlugMap = useMemo(() => new Map<string, string>(resourceCategories?.map((c: any) => [c._id, c.slug]) || []), [resourceCategories]);

  // Fetch counts
  const prodCount = useQuery(api.products.countPublished, isProductsEnabled ? {
    search: query || undefined,
    categoryId: pCat ? (pCat as Id<'productCategories'>) : undefined
  } : 'skip');
  
  const postCount = useQuery(api.posts.countPublished, isPostsEnabled ? {
    search: query || undefined,
    categoryId: bCat ? (bCat as Id<'postCategories'>) : undefined
  } : 'skip');
  
  const svcCount = useQuery(api.services.countPublished, isServicesEnabled ? {
    search: query || undefined,
    categoryId: sCat ? (sCat as Id<'serviceCategories'>) : undefined
  } : 'skip');

  const courseCount = useQuery(api.courses.countPublished, isCoursesEnabled ? {
    search: query || undefined,
    categoryId: cCat ? (cCat as Id<'courseCategories'>) : undefined
  } : 'skip');

  const resourceCount = useQuery(api.resources.countPublished, isResourcesEnabled ? {
    search: query || undefined,
    categoryId: rCat ? (rCat as Id<'resourceCategories'>) : undefined
  } : 'skip');

  // Fetch results based on active tab
  const products = useQuery(api.products.listPublishedWithOffset, (activeTab === 'product' && isProductsEnabled) ? {
    search: query || undefined,
    categoryId: pCat ? (pCat as Id<'productCategories'>) : undefined,
    limit: itemsPerPage,
    offset: (pPage - 1) * itemsPerPage,
    sortBy: sortBy as any
  } : 'skip');

  const posts = useQuery(api.posts.listPublishedWithOffset, (activeTab === 'post' && isPostsEnabled) ? {
    search: query || undefined,
    categoryId: bCat ? (bCat as Id<'postCategories'>) : undefined,
    limit: itemsPerPage,
    offset: (bPage - 1) * itemsPerPage,
    sortBy: sortBy === 'price_asc' || sortBy === 'price_desc' ? 'newest' : sortBy as any // fallback sort
  } : 'skip');

  const services = useQuery(api.services.listPublishedWithOffset, (activeTab === 'service' && isServicesEnabled) ? {
    search: query || undefined,
    categoryId: sCat ? (sCat as Id<'serviceCategories'>) : undefined,
    limit: itemsPerPage,
    offset: (sPage - 1) * itemsPerPage,
    sortBy: sortBy as any
  } : 'skip');

  const courses = useQuery(api.courses.listPublishedWithOffset, (activeTab === 'course' && isCoursesEnabled) ? {
    search: query || undefined,
    categoryId: cCat ? (cCat as Id<'courseCategories'>) : undefined,
    limit: itemsPerPage,
    offset: (cPage - 1) * itemsPerPage,
    sortBy: sortBy as any
  } : 'skip');

  const resources = useQuery(api.resources.listPublishedWithOffset, (activeTab === 'resource' && isResourcesEnabled) ? {
    search: query || undefined,
    categoryId: rCat ? (rCat as Id<'resourceCategories'>) : undefined,
    limit: itemsPerPage,
    offset: (rPage - 1) * itemsPerPage,
    sortBy: (sortBy === 'name' ? 'title' : sortBy) as any
  } : 'skip');

  // Loading States
  const isLoading = 
    isModulesLoading ||
    (activeTab === 'product' && isProductsEnabled && products === undefined) ||
    (activeTab === 'post' && isPostsEnabled && posts === undefined) ||
    (activeTab === 'service' && isServicesEnabled && services === undefined) ||
    (activeTab === 'course' && isCoursesEnabled && courses === undefined) ||
    (activeTab === 'resource' && isResourcesEnabled && resources === undefined) ||
    (isProductsEnabled && prodCount === undefined) ||
    (isPostsEnabled && postCount === undefined) ||
    (isServicesEnabled && svcCount === undefined) ||
    (isCoursesEnabled && courseCount === undefined) ||
    (isResourcesEnabled && resourceCount === undefined);

  // Auto-switch tab if current tab is disabled
  useEffect(() => {
    if (isModulesLoading) return;

    const availableTabs: ('product' | 'post' | 'service' | 'course' | 'resource')[] = [];
    if (isProductsEnabled) availableTabs.push('product');
    if (isPostsEnabled) availableTabs.push('post');
    if (isServicesEnabled) availableTabs.push('service');
    if (isCoursesEnabled) availableTabs.push('course');
    if (isResourcesEnabled) availableTabs.push('resource');

    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', availableTabs[0]);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [isProductsEnabled, isPostsEnabled, isServicesEnabled, isCoursesEnabled, isResourcesEnabled, isModulesLoading, activeTab, router, pathname, searchParams]);

  // Reset lastCheckedQueryRef when query changes
  useEffect(() => {
    lastCheckedQueryRef.current = null;
  }, [query]);

  // Auto-switch to the first tab with results if the current tab has 0 results
  useEffect(() => {
    if (isModulesLoading) return;

    // Define search modules configuration for unified and clean logic
    const searchModules = [
      { key: 'product', enabled: isProductsEnabled, count: prodCount },
      { key: 'post', enabled: isPostsEnabled, count: postCount },
      { key: 'service', enabled: isServicesEnabled, count: svcCount },
      { key: 'course', enabled: isCoursesEnabled, count: courseCount },
      { key: 'resource', enabled: isResourcesEnabled, count: resourceCount },
    ] as const;

    // Ensure all counts for enabled modules are loaded
    const isCountsLoading = searchModules.some((m) => m.enabled && m.count === undefined);
    if (isCountsLoading) return;

    if (lastCheckedQueryRef.current !== query) {
      const activeModule = searchModules.find((m) => m.key === activeTab);
      const activeCount = activeModule?.count ?? 0;

      // Switch only if the active tab has 0 results
      if (activeCount === 0) {
        // Find the first enabled tab that has results
        const tabWithResults = searchModules.find((m) => m.enabled && (m.count ?? 0) > 0);

        if (tabWithResults && tabWithResults.key !== activeTab) {
          const params = new URLSearchParams(searchParams.toString());
          params.set('tab', tabWithResults.key);
          router.replace(`${pathname}?${params.toString()}`);
        }
      }

      lastCheckedQueryRef.current = query;
    }
  }, [
    query,
    isProductsEnabled,
    isPostsEnabled,
    isServicesEnabled,
    isCoursesEnabled,
    isResourcesEnabled,
    isModulesLoading,
    activeTab,
    prodCount,
    postCount,
    svcCount,
    courseCount,
    resourceCount,
    router,
    pathname,
    searchParams,
  ]);

  // Search Submit Handler
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const val = searchInput.trim();
    if (val) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    // Reset pages
    params.delete('p_page');
    params.delete('b_page');
    params.delete('s_page');
    params.delete('c_page');
    params.delete('r_page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('p_page');
    params.delete('b_page');
    params.delete('s_page');
    params.delete('c_page');
    params.delete('r_page');
    router.push(`${pathname}?${params.toString()}`);
  };

  // Tab switch handler
  const handleTabChange = (tab: 'product' | 'post' | 'service' | 'course' | 'resource') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    // Reset sort if switching off products since products has unique price sorts
    const currentSort = params.get('sort');
    if (tab !== 'product' && tab !== 'course' && tab !== 'resource' && (currentSort === 'price_asc' || currentSort === 'price_desc')) {
      params.set('sort', 'newest');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // View Mode toggle handler
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Sorting handler
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Category filter handler
  const handleCategoryFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (activeTab === 'product') {
      if (val) params.set('p_cat', val);
      else params.delete('p_cat');
      params.delete('p_page');
    } else if (activeTab === 'post') {
      if (val) params.set('b_cat', val);
      else params.delete('b_cat');
      params.delete('b_page');
    } else if (activeTab === 'service') {
      if (val) params.set('s_cat', val);
      else params.delete('s_cat');
      params.delete('s_page');
    } else if (activeTab === 'course') {
      if (val) params.set('c_cat', val);
      else params.delete('c_cat');
      params.delete('c_page');
    } else {
      if (val) params.set('r_cat', val);
      else params.delete('r_cat');
      params.delete('r_page');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Pagination handler
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeTab === 'product') {
      params.set('p_page', page.toString());
    } else if (activeTab === 'post') {
      params.set('b_page', page.toString());
    } else if (activeTab === 'service') {
      params.set('s_page', page.toString());
    } else if (activeTab === 'course') {
      params.set('c_page', page.toString());
    } else {
      params.set('r_page', page.toString());
    }
    router.push(`${pathname}?${params.toString()}`);
    
    // Smooth scroll back to list top
    const element = document.getElementById('search-results-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Add to cart handler
  const handleAddToCart = useCallback((e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.hasVariants) {
      if (enableQuickAddVariant) {
        openQuickAdd(product, 'addToCart');
      } else {
        // Navigate to detail page to choose variant
        const categorySlug = productCategorySlugMap.get(product.categoryId) || 'products';
        const path = buildDetailPath({
          categorySlug,
          mode: routeMode,
          moduleKey: 'products',
          recordSlug: product.slug
        });
        router.push(path);
      }
    } else {
      void addItem(product._id, 1);
      notifyAddToCart();
      openDrawer();
    }
  }, [addItem, routeMode, productCategorySlugMap, router, openDrawer, enableQuickAddVariant]);

  // Resolve detail hrefs
  const getProductDetailHref = (product: any) => buildDetailPath({
    categorySlug: productCategorySlugMap.get(product.categoryId) || 'products',
    mode: routeMode,
    moduleKey: 'products',
    recordSlug: product.slug
  });

  const getPostDetailHref = (post: any) => buildDetailPath({
    categorySlug: postCategorySlugMap.get(post.categoryId) || 'posts',
    mode: routeMode,
    moduleKey: 'posts',
    recordSlug: post.slug
  });

  const getServiceDetailHref = (service: any) => buildDetailPath({
    categorySlug: serviceCategorySlugMap.get(service.categoryId) || 'services',
    mode: routeMode,
    moduleKey: 'services',
    recordSlug: service.slug
  });

  const getCourseDetailHref = (course: any) => buildDetailPath({
    categorySlug: courseCategorySlugMap.get(course.categoryId) || 'courses',
    mode: routeMode,
    moduleKey: 'courses',
    recordSlug: course.slug
  });

  const getResourceDetailHref = (resource: any) => buildDetailPath({
    categorySlug: resourceCategorySlugMap.get(resource.categoryId) || 'resources',
    mode: routeMode,
    moduleKey: 'resources',
    recordSlug: resource.slug
  });

  // Wishlist IDs for current products (to show filled heart)
  const productIds = useMemo(() => products?.map((p: any) => p._id) ?? [], [products]);
  const wishlistProductIds = useQuery(
    api.wishlist.listCustomerProductIds,
    isAuthenticated && customer && productIds.length > 0 && canUseWishlist
      ? { customerId: customer.id as Id<'customers'>, productIds }
      : 'skip'
  );
  const wishlistIdSet = useMemo(() => new Set<Id<'products'>>(wishlistProductIds ?? []), [wishlistProductIds]);

  // Wishlist toggle handler
  const handleWishlistToggle = useCallback(async (e: React.MouseEvent, productId: Id<'products'>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !customer) return;
    await toggleWishlist({ customerId: customer.id as Id<'customers'>, productId });
  }, [isAuthenticated, customer, toggleWishlist]);

  // Buy now handler
  const handleBuyNow = useCallback((e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.hasVariants && product.stock <= 0) return;
    if (product.hasVariants) {
      if (enableQuickAddVariant) {
        openQuickAdd(product, 'buyNow');
      } else {
        const categorySlug = productCategorySlugMap.get(product.categoryId) || 'products';
        router.push(buildDetailPath({ categorySlug, mode: routeMode, moduleKey: 'products', recordSlug: product.slug }));
      }
      return;
    }
    router.push(`/checkout?productId=${product._id}&quantity=1`);
  }, [router, routeMode, productCategorySlugMap, enableQuickAddVariant]);

  // Calculate current pagination metrics
  const totalCount = activeTab === 'product'
    ? (prodCount ?? 0)
    : activeTab === 'post'
      ? (postCount ?? 0)
      : activeTab === 'service'
        ? (svcCount ?? 0)
        : activeTab === 'course'
          ? (courseCount ?? 0)
          : (resourceCount ?? 0);
  const currentPage = activeTab === 'product' ? pPage : activeTab === 'post' ? bPage : activeTab === 'service' ? sPage : activeTab === 'course' ? cPage : rPage;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  // Current active categories options
  const activeCategoriesOptions = useMemo(() => {
    if (activeTab === 'product') return productCategories || [];
    if (activeTab === 'post') return postCategories || [];
    if (activeTab === 'service') return serviceCategories || [];
    if (activeTab === 'course') return courseCategories || [];
    return resourceCategories || [];
  }, [activeTab, productCategories, postCategories, serviceCategories, courseCategories, resourceCategories]);

  const activeCategoryVal = activeTab === 'product' ? pCat : activeTab === 'post' ? bCat : activeTab === 'service' ? sCat : activeTab === 'course' ? cCat : rCat;

  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-6 md:py-10">
      {/* Search Header Area */}
      <div className="max-w-xl mx-auto mb-6 md:mb-8 text-center">
        {/* Large Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Bạn muốn tìm gì hôm nay..."
            className="w-full pl-6 pr-24 py-3.5 rounded-full border border-slate-200 dark:border-zinc-850 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-zinc-800 bg-white dark:bg-[#161617] text-slate-800 dark:text-[#f5f5f7] transition-all placeholder:text-slate-400 dark:placeholder-zinc-500"
            style={{ borderColor: primaryColor + '20' }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchInput.trim().length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-[#f5f5f7] hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                aria-label="Xóa từ khóa"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              className="p-2.5 text-white rounded-full hover:scale-105 transition-all shadow-sm"
              style={{ backgroundColor: primaryColor }}
              aria-label="Tìm kiếm"
            >
              <Search size={16} />
            </button>
          </div>
        </form>

        {query && (
          <p className="text-slate-500 dark:text-[#86868b] text-xs mt-3">
            Kết quả cho từ khóa <span className="font-semibold text-slate-800 dark:text-[#f5f5f7]">"{query}"</span>
          </p>
        )}
      </div>

      <div id="search-results-section" className="scroll-mt-6">
        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-zinc-800 overflow-x-auto scrollbar-none mb-6 md:mb-8 gap-2 pb-0.5">
          {isProductsEnabled && (
            <button
              type="button"
              onClick={() => handleTabChange('product')}
              className="flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap"
              style={{
                borderColor: activeTab === 'product' ? primaryColor : 'transparent',
                color: activeTab === 'product' ? primaryColor : (isDark ? '#86868b' : '#64748b')
              }}
            >
              <Package size={16} />
              Sản phẩm
              <span 
                className="text-xs px-2 py-0.5 rounded-full font-bold transition-all"
                style={{
                  backgroundColor: activeTab === 'product' ? primaryColor + '15' : (isDark ? '#2c2c2e' : '#f1f5f9'),
                  color: activeTab === 'product' ? primaryColor : (isDark ? '#a1a1aa' : '#475569')
                }}
              >
                {prodCount ?? 0}
              </span>
            </button>
          )}
          {isPostsEnabled && (
            <button
              type="button"
              onClick={() => handleTabChange('post')}
              className="flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap"
              style={{
                borderColor: activeTab === 'post' ? primaryColor : 'transparent',
                color: activeTab === 'post' ? primaryColor : (isDark ? '#86868b' : '#64748b')
              }}
            >
              <FileText size={16} />
              Bài viết
              <span 
                className="text-xs px-2 py-0.5 rounded-full font-bold transition-all"
                style={{
                  backgroundColor: activeTab === 'post' ? primaryColor + '15' : (isDark ? '#2c2c2e' : '#f1f5f9'),
                  color: activeTab === 'post' ? primaryColor : (isDark ? '#a1a1aa' : '#475569')
                }}
              >
                {postCount ?? 0}
              </span>
            </button>
          )}
          {isServicesEnabled && (
            <button
              type="button"
              onClick={() => handleTabChange('service')}
              className="flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap"
              style={{
                borderColor: activeTab === 'service' ? primaryColor : 'transparent',
                color: activeTab === 'service' ? primaryColor : (isDark ? '#86868b' : '#64748b')
              }}
            >
              <Briefcase size={16} />
              Dịch vụ
              <span 
                className="text-xs px-2 py-0.5 rounded-full font-bold transition-all"
                style={{
                  backgroundColor: activeTab === 'service' ? primaryColor + '15' : (isDark ? '#2c2c2e' : '#f1f5f9'),
                  color: activeTab === 'service' ? primaryColor : (isDark ? '#a1a1aa' : '#475569')
                }}
              >
                {svcCount ?? 0}
              </span>
            </button>
          )}
          {isCoursesEnabled && (
            <button
              type="button"
              onClick={() => handleTabChange('course')}
              className="flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap"
              style={{
                borderColor: activeTab === 'course' ? primaryColor : 'transparent',
                color: activeTab === 'course' ? primaryColor : (isDark ? '#86868b' : '#64748b')
              }}
            >
              <GraduationCap size={16} />
              Khóa học
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold transition-all"
                style={{
                  backgroundColor: activeTab === 'course' ? primaryColor + '15' : (isDark ? '#2c2c2e' : '#f1f5f9'),
                  color: activeTab === 'course' ? primaryColor : (isDark ? '#a1a1aa' : '#475569')
                }}
              >
                {courseCount ?? 0}
              </span>
            </button>
          )}
          {isResourcesEnabled && (
            <button
              type="button"
              onClick={() => handleTabChange('resource')}
              className="flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap"
              style={{
                borderColor: activeTab === 'resource' ? primaryColor : 'transparent',
                color: activeTab === 'resource' ? primaryColor : (isDark ? '#86868b' : '#64748b')
              }}
            >
              <Download size={16} />
              Tài nguyên
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold transition-all"
                style={{
                  backgroundColor: activeTab === 'resource' ? primaryColor + '15' : (isDark ? '#2c2c2e' : '#f1f5f9'),
                  color: activeTab === 'resource' ? primaryColor : (isDark ? '#a1a1aa' : '#475569')
                }}
              >
                {resourceCount ?? 0}
              </span>
            </button>
          )}
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 bg-slate-50/50 dark:bg-[#161617]/50 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <CategoryCombobox
              categories={activeCategoriesOptions}
              value={activeCategoryVal}
              onChange={handleCategoryFilter}
              primaryColor={primaryColor}
            />

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="appearance-none bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-850 text-slate-700 dark:text-[#f5f5f7] rounded-xl px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-zinc-800 min-w-[150px] font-medium transition-colors"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="popular">Phổ biến</option>
                <option value="name">Tên A-Z</option>
                {(activeTab === 'product' || activeTab === 'course' || activeTab === 'resource') && (
                  <>
                    <option value="price_asc">Giá tăng dần</option>
                    <option value="price_desc">Giá giảm dần</option>
                  </>
                )}
              </select>
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-slate-400 dark:text-zinc-550" />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-slate-500 dark:text-[#86868b] text-xs md:text-sm font-medium">
              Tìm thấy {totalCount} kết quả
            </span>

            {/* View Mode Grid/List Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#1c1c1e] p-1 gap-0.5">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'text-white' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-[#f5f5f7]'}`}
                style={viewMode === 'grid' ? { backgroundColor: primaryColor } : undefined}
                aria-label="Xem lưới"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'text-white' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-[#f5f5f7]'}`}
                style={viewMode === 'list' ? { backgroundColor: primaryColor } : undefined}
                aria-label="Xem danh sách"
              >
                <LayoutList size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={36} className="animate-spin text-slate-300" style={{ color: primaryColor }} />
            <span className="text-slate-400 text-sm">Đang tải kết quả...</span>
          </div>
        ) : totalCount === 0 ? (
          // Empty State
          <div className="text-center py-16 md:py-24 bg-white dark:bg-[#161617] rounded-3xl border border-slate-100/80 dark:border-zinc-800 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
              <Compass size={32} className="text-slate-300 dark:text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-[#f5f5f7] mb-2">Không tìm thấy kết quả phù hợp</h3>
            <p className="text-slate-500 dark:text-[#86868b] text-sm max-w-sm mx-auto mb-6">
              Hãy thử tìm kiếm với từ khóa khác hoặc xóa bớt các bộ lọc danh mục đang chọn.
            </p>
            {activeCategoryVal && (
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('p_cat');
                  params.delete('b_cat');
                  params.delete('s_cat');
                  params.delete('c_cat');
                  params.delete('r_cat');
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className="inline-flex items-center text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
              >
                Xóa bộ lọc danh mục
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Tab: Products */}
            {activeTab === 'product' && products && (
              viewMode === 'grid' ? (
                // Products Grid View
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                  {products.map((product: any) => {
                    const priceDisplay = getPublicPriceLabel({ 
                      saleMode: 'cart', 
                      price: product.price, 
                      salePrice: product.salePrice, 
                      isRangeFromVariant: product.hasVariants 
                    });
                    const isWishlisted = wishlistIdSet.has(product._id);
                    
                    return (
                      <Link
                        key={product._id}
                        href={getProductDetailHref(product)}
                        className={`group flex flex-col h-full bg-white dark:bg-[#161617] border border-slate-100 dark:border-zinc-850 overflow-hidden transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-lg hover:-translate-y-1 ${cornerRadiusClass}`}
                      >
                        <div className="aspect-square w-full relative overflow-hidden bg-slate-50 dark:bg-zinc-900 border-b border-slate-100/50 dark:border-zinc-850">
                          {product.image || productPlaceholder ? (
                            <Image
                              src={product.image || productPlaceholder}
                              alt={product.name}
                              width={300}
                              height={300}
                              mode="thumb"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-650">
                              <Package size={40} />
                            </div>
                          )}
                          {searchFilterConfig.showPromotionBadge && product.salePrice && product.price > product.salePrice && (
                            <span
                              className="absolute top-2 left-2 sm:top-3 sm:left-3 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded-lg text-white z-10"
                              style={{ backgroundColor: secondaryColor }}
                            >
                              -{Math.round((1 - product.salePrice / product.price) * 100)}%
                            </span>
                          )}
                          {canUseWishlist && (
                            <button
                              type="button"
                              onClick={(e) => handleWishlistToggle(e, product._id)}
                              className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-full border transition-colors z-20 bg-white/90 dark:bg-[#161617]/90 backdrop-blur-sm"
                              style={{
                                borderColor: isWishlisted ? '#ef4444' : (isDark ? '#3f3f46' : '#e2e8f0'),
                                color: isWishlisted ? '#ef4444' : (isDark ? '#a1a1aa' : '#94a3b8')
                              }}
                              aria-label="Thêm vào yêu thích"
                            >
                              <Heart size={14} className={isWishlisted ? 'fill-current' : ''} />
                            </button>
                          )}
                        </div>
                        
                        <div className="p-3 sm:p-4 flex-1 flex flex-col">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5 block">
                            {productCategoryMap.get(product.categoryId) || 'Sản phẩm'}
                          </span>
                          <h3 
                            className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-sm line-clamp-2 mb-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                          >
                            {product.name}
                          </h3>
                          
                          <div className="mt-auto pt-3 flex flex-col gap-2">
                            {/* Price */}
                            <div className="flex flex-wrap items-baseline gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-[#f5f5f7] text-base">
                                {priceDisplay.label}
                              </span>
                              {product.salePrice && product.price > product.salePrice && (
                                <span className="text-xs line-through text-slate-400 dark:text-zinc-500">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <SearchProductCardActions
                              product={product}
                              primaryColor={primaryColor}
                              showAddToCartButton={showAddToCartButton}
                              showBuyNowButton={showBuyNowButton}
                              cartButtonsLayout={searchFilterConfig.cartButtonsLayout}
                              enableQuickAddVariant={enableQuickAddVariant}
                              onAddToCart={(e) => handleAddToCart(e, product)}
                              onBuyNow={(e) => handleBuyNow(e, product)}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                // Products List View
                <div className="space-y-4">
                  {products.map((product: any) => {
                    const priceDisplay = getPublicPriceLabel({ 
                      saleMode: 'cart', 
                      price: product.price, 
                      salePrice: product.salePrice, 
                      isRangeFromVariant: product.hasVariants 
                    });
                    const isWishlisted = wishlistIdSet.has(product._id);
                    
                    return (
                      <Link
                        key={product._id}
                        href={getProductDetailHref(product)}
                        className={`group flex gap-4 md:gap-6 bg-white dark:bg-[#161617] p-4 border border-slate-100 dark:border-zinc-850 transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-md ${cornerRadiusClass}`}
                      >
                        {/* Thumbnail left */}
                        <div className="w-24 md:w-32 aspect-square relative overflow-hidden bg-slate-50 dark:bg-zinc-900 rounded-xl shrink-0 border border-slate-100 dark:border-zinc-850">
                          {product.image || productPlaceholder ? (
                            <Image
                              src={product.image || productPlaceholder}
                              alt={product.name}
                              width={160}
                              height={160}
                              mode="thumb"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-650">
                              <Package size={32} />
                            </div>
                          )}
                          {canUseWishlist && (
                            <button
                              type="button"
                              onClick={(e) => handleWishlistToggle(e, product._id)}
                              className="absolute top-1.5 right-1.5 p-1.5 rounded-full border transition-colors z-20 bg-white/90 dark:bg-[#161617]/90 backdrop-blur-sm"
                              style={{
                                borderColor: isWishlisted ? '#ef4444' : (isDark ? '#3f3f46' : '#e2e8f0'),
                                color: isWishlisted ? '#ef4444' : (isDark ? '#a1a1aa' : '#94a3b8')
                              }}
                              aria-label="Thêm vào yêu thích"
                            >
                              <Heart size={12} className={isWishlisted ? 'fill-current' : ''} />
                            </button>
                          )}
                        </div>

                        {/* Details right */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5 block">
                              {productCategoryMap.get(product.categoryId) || 'Sản phẩm'}
                            </span>
                            <h3 className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-sm md:text-base line-clamp-1 mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                              {product.name}
                            </h3>
                          </div>

                          <div className="flex items-end justify-between mt-2 gap-3 flex-wrap">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="font-bold text-slate-900 dark:text-[#f5f5f7] text-base md:text-lg">
                                {priceDisplay.label}
                              </span>
                              {product.salePrice && product.price > product.salePrice && (
                                <span className="text-xs line-through text-slate-400 dark:text-zinc-500">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {showAddToCartButton && (
                                <button
                                  type="button"
                                  onClick={(e) => handleAddToCart(e, product)}
                                  disabled={!product.hasVariants && product.stock <= 0}
                                  className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border disabled:opacity-55 disabled:cursor-not-allowed hover:brightness-95 hover:scale-[1.02]"
                                  style={{
                                    backgroundColor: (product.hasVariants || product.stock > 0) ? primaryColor : (isDark ? '#2c2c2e' : '#f1f5f9'),
                                    color: (product.hasVariants || product.stock > 0) ? '#ffffff' : (isDark ? '#86868b' : '#64748b'),
                                    borderColor: (product.hasVariants || product.stock > 0) ? 'transparent' : (isDark ? '#3f3f46' : '#e2e8f0')
                                  }}
                                >
                                  <ShoppingCart size={12} />
                                  <span className="hidden sm:inline">{(product.hasVariants || product.stock > 0) ? (product.hasVariants && !enableQuickAddVariant ? 'Chọn phân loại' : 'Thêm giỏ') : 'Hết hàng'}</span>
                                </button>
                              )}
                              {showBuyNowButton && (
                                <button
                                  type="button"
                                  onClick={(e) => handleBuyNow(e, product)}
                                  disabled={!product.hasVariants && product.stock <= 0}
                                  className="hidden sm:flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border disabled:opacity-55 disabled:cursor-not-allowed hover:brightness-95"
                                  style={{
                                    backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                                    color: (product.hasVariants || product.stock > 0) ? primaryColor : (isDark ? '#86868b' : '#64748b'),
                                    borderColor: (product.hasVariants || product.stock > 0) ? primaryColor : (isDark ? '#3f3f46' : '#e2e8f0')
                                  }}
                                >
                                  <span>{(product.hasVariants || product.stock > 0) ? 'Mua ngay' : 'Hết hàng'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            )}

            {/* Tab: Posts */}
            {activeTab === 'post' && posts && (
              viewMode === 'grid' ? (
                // Posts Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {posts.map((post: any) => (
                    <Link
                      key={post._id}
                      href={getPostDetailHref(post)}
                      className="group flex flex-col h-full bg-white dark:bg-[#161617] rounded-2xl border border-slate-100 dark:border-zinc-850 overflow-hidden transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="aspect-video w-full relative overflow-hidden bg-slate-50 dark:bg-zinc-900 border-b border-slate-100/50 dark:border-zinc-850">
                        {post.thumbnail ? (
                          <Image
                            src={post.thumbnail}
                            alt={post.title}
                            width={360}
                            height={200}
                            mode="thumb"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          // Smart fallback banner
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-650 gap-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
                            <FileText size={32} />
                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">Tin tức & Bài viết</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 mb-2 block">
                          {postCategoryMap.get(post.categoryId) || 'Bài viết'}
                        </span>
                        <h3 className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-base line-clamp-2 mb-3 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-slate-400 dark:text-[#86868b] text-xs line-clamp-3 mb-4 flex-1">
                          {post.excerpt || 'Đọc bài viết để biết thêm thông tin chi tiết.'}
                        </p>
                        
                        <div className="pt-4 border-t border-slate-50 dark:border-zinc-850 flex items-center justify-between text-slate-400 dark:text-zinc-500 text-[10px] font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {post.views || 0} lượt xem
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                // Posts List View
                <div className="space-y-4">
                  {posts.map((post: any) => (
                    <Link
                      key={post._id}
                      href={getPostDetailHref(post)}
                      className="group flex gap-4 md:gap-6 bg-white dark:bg-[#161617] p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-md"
                    >
                      {/* Thumbnail left */}
                      <div className="w-28 md:w-44 aspect-video relative overflow-hidden bg-slate-50 dark:bg-zinc-900 rounded-xl shrink-0 border border-slate-100 dark:border-zinc-850">
                        {post.thumbnail ? (
                          <Image
                            src={post.thumbnail}
                            alt={post.title}
                            width={180}
                            height={100}
                            mode="thumb"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-650 gap-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
                            <FileText size={24} />
                            <span className="text-[8px] font-medium text-slate-400 dark:text-zinc-550">Bài viết</span>
                          </div>
                        )}
                      </div>

                      {/* Details right */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-550 mb-1 block">
                            {postCategoryMap.get(post.categoryId) || 'Bài viết'}
                          </span>
                          <h3 className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-sm md:text-base line-clamp-1 mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-slate-400 dark:text-[#86868b] text-xs line-clamp-2">
                            {post.excerpt || 'Đọc bài viết để biết thêm thông tin chi tiết.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 dark:text-zinc-500 text-[10px] font-medium mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {post.views || 0} lượt xem
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {/* Tab: Services */}
            {activeTab === 'service' && services && (
              viewMode === 'grid' ? (
                // Services Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {services.map((service: any) => (
                    <Link
                      key={service._id}
                      href={getServiceDetailHref(service)}
                      className="group flex flex-col h-full bg-white dark:bg-[#161617] rounded-2xl border border-slate-100 dark:border-zinc-850 overflow-hidden transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="aspect-video w-full relative overflow-hidden bg-slate-50 dark:bg-zinc-900 border-b border-slate-100/50 dark:border-zinc-850">
                        {service.thumbnail ? (
                          <Image
                            src={service.thumbnail}
                            alt={service.title}
                            width={360}
                            height={200}
                            mode="thumb"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          // Smart fallback banner
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-650 gap-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
                            <Briefcase size={32} />
                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">Dịch vụ Spa giày</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 mb-2 block">
                          {serviceCategoryMap.get(service.categoryId) || 'Dịch vụ'}
                        </span>
                        <h3 className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-base line-clamp-2 mb-3 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-slate-400 dark:text-[#86868b] text-xs line-clamp-3 mb-4 flex-1">
                          {service.excerpt || 'Xem chi tiết thông tin dịch vụ chăm sóc giày.'}
                        </p>
                        
                        <div className="pt-4 border-t border-slate-50 dark:border-zinc-850 flex items-center justify-between">
                          <span className="text-sm font-bold" style={{ color: primaryColor }}>
                            {service.price ? formatPrice(service.price) : 'Liên hệ báo giá'}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                            <Eye size={12} />
                            {service.views || 0} lượt xem
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                // Services List View
                <div className="space-y-4">
                  {services.map((service: any) => (
                    <Link
                      key={service._id}
                      href={getServiceDetailHref(service)}
                      className="group flex gap-4 md:gap-6 bg-white dark:bg-[#161617] p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-md"
                    >
                      {/* Thumbnail left */}
                      <div className="w-28 md:w-44 aspect-video relative overflow-hidden bg-slate-50 dark:bg-zinc-900 rounded-xl shrink-0 border border-slate-100 dark:border-zinc-850">
                        {service.thumbnail ? (
                          <Image
                            src={service.thumbnail}
                            alt={service.title}
                            width={180}
                            height={100}
                            mode="thumb"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-650 gap-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
                            <Briefcase size={24} />
                            <span className="text-[8px] font-medium text-slate-400 dark:text-zinc-550">Dịch vụ</span>
                          </div>
                        )}
                      </div>

                      {/* Details right */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-550 mb-1 block">
                            {serviceCategoryMap.get(service.categoryId) || 'Dịch vụ'}
                          </span>
                          <h3 className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-sm md:text-base line-clamp-1 mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-slate-400 dark:text-[#86868b] text-xs line-clamp-2">
                            {service.excerpt || 'Xem chi tiết thông tin dịch vụ chăm sóc giày.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                          <span className="text-sm md:text-base font-bold" style={{ color: primaryColor }}>
                            {service.price ? formatPrice(service.price) : 'Liên hệ báo giá'}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                            <Eye size={12} />
                            {service.views || 0} lượt xem
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {/* Tab: Courses */}
            {activeTab === 'course' && courses && (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {courses.map((course: any) => (
                    <Link
                      key={course._id}
                      href={getCourseDetailHref(course)}
                      className="group flex flex-col h-full bg-white dark:bg-[#161617] rounded-2xl border border-slate-100 dark:border-zinc-850 overflow-hidden transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="aspect-video w-full relative overflow-hidden bg-slate-50 dark:bg-zinc-900 border-b border-slate-100/50 dark:border-zinc-850">
                        {course.thumbnail ? (
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            width={360}
                            height={200}
                            mode="thumb"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-650 gap-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
                            <GraduationCap size={32} />
                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">Khóa học</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 mb-2 block">
                          {courseCategoryMap.get(course.categoryId) || 'Khóa học'}
                        </span>
                        <h3 className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-base line-clamp-2 mb-3 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-slate-400 dark:text-[#86868b] text-xs line-clamp-3 mb-4 flex-1">
                          {course.excerpt || 'Xem chi tiết chương trình học.'}
                        </p>

                        <div className="pt-4 border-t border-slate-50 dark:border-zinc-850 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold" style={{ color: primaryColor }}>
                            {formatCoursePrice(course.pricingType, course.priceAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                            <BookOpen size={12} />
                            {course.lessonCount || 0} bài
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.map((course: any) => (
                    <Link
                      key={course._id}
                      href={getCourseDetailHref(course)}
                      className="group flex gap-4 md:gap-6 bg-white dark:bg-[#161617] p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-md"
                    >
                      <div className="w-28 md:w-44 aspect-video relative overflow-hidden bg-slate-50 dark:bg-zinc-900 rounded-xl shrink-0 border border-slate-100 dark:border-zinc-850">
                        {course.thumbnail ? (
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            width={180}
                            height={100}
                            mode="thumb"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-650 gap-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
                            <GraduationCap size={24} />
                            <span className="text-[8px] font-medium text-slate-400 dark:text-zinc-550">Khóa học</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-550 mb-1 block">
                            {courseCategoryMap.get(course.categoryId) || 'Khóa học'}
                          </span>
                          <h3 className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-sm md:text-base line-clamp-1 mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-slate-400 dark:text-[#86868b] text-xs line-clamp-2">
                            {course.excerpt || 'Xem chi tiết chương trình học.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                          <span className="text-sm md:text-base font-bold" style={{ color: primaryColor }}>
                            {formatCoursePrice(course.pricingType, course.priceAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                            <BookOpen size={12} />
                            {course.lessonCount || 0} bài
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {/* Tab: Resources */}
            {activeTab === 'resource' && resources && (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {resources.map((resource: any) => (
                    <Link
                      key={resource._id}
                      href={getResourceDetailHref(resource)}
                      className="group flex flex-col h-full bg-white dark:bg-[#161617] rounded-2xl border border-slate-100 dark:border-zinc-850 overflow-hidden transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="aspect-video w-full relative overflow-hidden bg-slate-50 dark:bg-zinc-900 border-b border-slate-100/50 dark:border-zinc-850">
                        {resource.thumbnail ? (
                          <Image
                            src={resource.thumbnail}
                            alt={resource.title}
                            width={360}
                            height={200}
                            mode="thumb"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-650 gap-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
                            <Download size={32} />
                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">Tài nguyên</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 mb-2 block">
                          {resourceCategoryMap.get(resource.categoryId) || 'Tài nguyên'}
                        </span>
                        <h3 className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-base line-clamp-2 mb-3 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {resource.title}
                        </h3>
                        <p className="text-slate-400 dark:text-[#86868b] text-xs line-clamp-3 mb-4 flex-1">
                          {resource.excerpt || 'Xem chi tiết và tải tài nguyên.'}
                        </p>

                        <div className="pt-4 border-t border-slate-50 dark:border-zinc-850 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold" style={{ color: primaryColor }}>
                            {formatResourcePrice(resource.pricingType, resource.priceAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                            <Download size={12} />
                            Tải xuống
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {resources.map((resource: any) => (
                    <Link
                      key={resource._id}
                      href={getResourceDetailHref(resource)}
                      className="group flex gap-4 md:gap-6 bg-white dark:bg-[#161617] p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 transition-all duration-300 hover:border-slate-200 dark:hover:border-zinc-800 hover:shadow-md"
                    >
                      <div className="w-28 md:w-44 aspect-video relative overflow-hidden bg-slate-50 dark:bg-zinc-900 rounded-xl shrink-0 border border-slate-100 dark:border-zinc-850">
                        {resource.thumbnail ? (
                          <Image
                            src={resource.thumbnail}
                            alt={resource.title}
                            width={180}
                            height={100}
                            mode="thumb"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-650 gap-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
                            <Download size={24} />
                            <span className="text-[8px] font-medium text-slate-400 dark:text-zinc-550">Tài nguyên</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-550 mb-1 block">
                            {resourceCategoryMap.get(resource.categoryId) || 'Tài nguyên'}
                          </span>
                          <h3 className="font-semibold text-slate-800 dark:text-[#f5f5f7] text-sm md:text-base line-clamp-1 mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {resource.title}
                          </h3>
                          <p className="text-slate-400 dark:text-[#86868b] text-xs line-clamp-2">
                            {resource.excerpt || 'Xem chi tiết và tải tài nguyên.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                          <span className="text-sm md:text-base font-bold" style={{ color: primaryColor }}>
                            {formatResourcePrice(resource.pricingType, resource.priceAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                            <Download size={12} />
                            Tải xuống
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 bg-white dark:bg-[#1c1c1e] hover:bg-slate-50 dark:hover:bg-[#2c2c2e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {generatePaginationItems(currentPage, totalPages).map((item, index) => {
                    if (item === 'ellipsis') {
                      return (
                        <div key={`ellipsis-${index}`} className="flex h-10 w-10 items-center justify-center text-slate-400 dark:text-zinc-550">
                          …
                        </div>
                      );
                    }

                    const pageNum = item as number;
                    const isActive = pageNum === currentPage;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'text-white shadow-sm border-0'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e]'
                        }`}
                        style={isActive ? { backgroundColor: primaryColor } : undefined}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 bg-white dark:bg-[#1c1c1e] hover:bg-slate-50 dark:hover:bg-[#2c2c2e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            )}
            {/* Quick Add Variant Modal */}
            {quickAddTarget && (
              <QuickAddVariantModal
                key={`${quickAddTarget.product._id}-${quickAddTarget.action}`}
                isOpen={Boolean(quickAddTarget)}
                product={quickAddTarget.product}
                brandColor={primaryColor}
                actionLabel={quickAddTarget.action === 'buyNow' ? 'Mua ngay' : 'Thêm vào giỏ'}
                onClose={closeQuickAdd}
                onConfirm={handleQuickAddConfirm}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
