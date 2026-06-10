import { api } from '@/convex/_generated/api';
import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { useCartAvailable } from './useCartAvailable';
import { normalizeOrderStatusPreset, parseOrderStatuses } from '@/lib/orders/statuses';
import { parseErrorPagesConfig, type ErrorPagesExperienceConfig } from './error-pages/config';

type PaginationType = 'pagination' | 'infiniteScroll';
type FilterPosition = 'sidebar' | 'top' | 'none';
type SearchLayoutStyle = 'search-only' | 'with-filters' | 'advanced';
type ResultsDisplayStyle = 'grid' | 'list';

type PostsListConfig = {
  layoutStyle: 'grid' | 'sidebar' | 'list';
  gridColumns: number;
  filterPosition: FilterPosition;
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
};

type SearchFilterConfig = {
  layoutStyle: SearchLayoutStyle;
  resultsDisplayStyle: ResultsDisplayStyle;
  showFilters: boolean;
  showSorting: boolean;
  showResultCount: boolean;
  
  // Cấu hình sản phẩm (đọc từ products_list_ui pattern)
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  showPromotionBadge: boolean;
  enableQuickAddVariant: boolean;
  cornerRadius: 'none' | 'sm' | 'lg';
  cartButtonsLayout?: 'stack' | 'grid-2';
};

type PostDetailLayoutStyle = 'classic' | 'modern' | 'minimal';

type PostDetailLayoutConfig = {
  showAuthor: boolean;
  showShare: boolean;
  showComments: boolean;
  showCommentLikes: boolean;
  showCommentReplies: boolean;
  showRelated: boolean;
  showTags: boolean;
  showThumbnail: boolean;
};

type PostsDetailConfig = PostDetailLayoutConfig & {
  layoutStyle: PostDetailLayoutStyle;
};

type BookingExperienceConfig = {
  showLegend: boolean;
  showCapacityHint: boolean;
  showServiceSelect: boolean;
};

const DEFAULT_POST_DETAIL_CONFIG: PostDetailLayoutConfig = {
  showAuthor: true,
  showShare: true,
  showComments: true,
  showCommentLikes: true,
  showCommentReplies: true,
  showRelated: true,
  showTags: true,
  showThumbnail: true,
};

const normalizePaginationType = (value?: string | boolean): PaginationType => {
  if (value === 'infiniteScroll') return 'infiniteScroll';
  if (value === 'pagination') return 'pagination';
  if (value === false) return 'infiniteScroll';
  return 'pagination';
};

export function usePostsListConfig(): PostsListConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'posts_list_ui' });
  
  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: string;
      gridColumns?: number;
      filterPosition?: FilterPosition;
      paginationType?: PaginationType;
      showSearch?: boolean;
      showCategories?: boolean;
      hideEmptyCategories?: boolean;
      postsPerPage?: number;
    } | undefined;
    const rawStyle = raw?.layoutStyle;
    const layoutStyle: PostsListConfig['layoutStyle'] = rawStyle === 'sidebar'
      ? 'sidebar'
      : (rawStyle === 'magazine' || rawStyle === 'list' ? 'list' : 'grid');
    return {
      layoutStyle,
      gridColumns: raw?.gridColumns ?? 3,
      filterPosition: raw?.filterPosition ?? 'sidebar',
      paginationType: normalizePaginationType(raw?.paginationType),
      showSearch: raw?.showSearch ?? true,
      showCategories: raw?.showCategories ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      postsPerPage: raw?.postsPerPage ?? 12,
    };
  }, [experienceSetting?.value]);
}

export function useSearchFilterConfig(): SearchFilterConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'search_filter_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: SearchLayoutStyle;
      layouts?: Partial<Record<SearchLayoutStyle, Partial<Omit<SearchFilterConfig, 'layoutStyle' | 'showWishlistButton' | 'showAddToCartButton' | 'showBuyNowButton' | 'showPromotionBadge' | 'enableQuickAddVariant' | 'cornerRadius' | 'cartButtonsLayout'>>>>;
      showWishlistButton?: boolean;
      showAddToCartButton?: boolean;
      showBuyNowButton?: boolean;
      showPromotionBadge?: boolean;
      enableQuickAddVariant?: boolean;
      cornerRadius?: 'none' | 'sm' | 'lg';
      cartButtonsLayout?: 'stack' | 'grid-2';
    } | undefined;
    const layoutStyle: SearchLayoutStyle = raw?.layoutStyle ?? 'with-filters';
    const defaultConfig = {
      resultsDisplayStyle: 'grid' as ResultsDisplayStyle,
      showFilters: layoutStyle === 'search-only' ? false : true,
      showSorting: true,
      showResultCount: true,
    };
    const layoutConfig = raw?.layouts?.[layoutStyle] ?? {};
    return {
      layoutStyle,
      ...defaultConfig,
      ...layoutConfig,
      showWishlistButton: raw?.showWishlistButton ?? true,
      showAddToCartButton: raw?.showAddToCartButton ?? true,
      showBuyNowButton: raw?.showBuyNowButton ?? true,
      showPromotionBadge: raw?.showPromotionBadge ?? true,
      enableQuickAddVariant: raw?.enableQuickAddVariant ?? true,
      cornerRadius: raw?.cornerRadius ?? 'lg',
      cartButtonsLayout: raw?.cartButtonsLayout ?? 'stack',
    };
  }, [experienceSetting?.value]);
}

export function usePostsDetailConfig(): PostsDetailConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'posts_detail_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: PostDetailLayoutStyle;
      showAuthor?: boolean;
      showShare?: boolean;
      showComments?: boolean;
      showCommentLikes?: boolean;
      showCommentReplies?: boolean;
      showRelated?: boolean;
      showTags?: boolean;
      showThumbnail?: boolean;
      layouts?: Record<PostDetailLayoutStyle, Partial<PostDetailLayoutConfig>>;
    } | undefined;
    const layoutStyle = raw?.layoutStyle ?? 'classic';
    const layoutConfig = raw?.layouts?.[layoutStyle] ?? {};
    return {
      layoutStyle,
      ...DEFAULT_POST_DETAIL_CONFIG,
      ...layoutConfig,
      showAuthor: raw?.showAuthor ?? layoutConfig.showAuthor ?? DEFAULT_POST_DETAIL_CONFIG.showAuthor,
      showShare: raw?.showShare ?? layoutConfig.showShare ?? DEFAULT_POST_DETAIL_CONFIG.showShare,
      showComments: raw?.showComments ?? layoutConfig.showComments ?? DEFAULT_POST_DETAIL_CONFIG.showComments,
      showCommentLikes: raw?.showCommentLikes ?? layoutConfig.showCommentLikes ?? DEFAULT_POST_DETAIL_CONFIG.showCommentLikes,
      showCommentReplies: raw?.showCommentReplies ?? layoutConfig.showCommentReplies ?? DEFAULT_POST_DETAIL_CONFIG.showCommentReplies,
      showRelated: raw?.showRelated ?? layoutConfig.showRelated ?? DEFAULT_POST_DETAIL_CONFIG.showRelated,
      showTags: raw?.showTags ?? layoutConfig.showTags ?? DEFAULT_POST_DETAIL_CONFIG.showTags,
      showThumbnail: raw?.showThumbnail ?? layoutConfig.showThumbnail ?? DEFAULT_POST_DETAIL_CONFIG.showThumbnail,
    };
  }, [experienceSetting?.value]);
}

export function useBookingConfig(): BookingExperienceConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'booking_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<BookingExperienceConfig> | undefined;
    return {
      showLegend: raw?.showLegend ?? true,
      showCapacityHint: raw?.showCapacityHint ?? true,
      showServiceSelect: raw?.showServiceSelect ?? true,
    };
  }, [experienceSetting?.value]);
}

type ProductsListConfig = {
  layoutStyle: 'grid' | 'sidebar' | 'list';
  gridColumns: number;
  paginationType: PaginationType;
  cornerRadius: 'none' | 'sm' | 'lg';
  showSearch: boolean;
  showCategories: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  showPromotionBadge: boolean;
  enableQuickAddVariant: boolean;
  cartButtonsLayout?: 'stack' | 'grid-2';
  priceFilterMode: 'disabled' | 'custom' | 'smart_dropdown' | 'slider';
  isLoading: boolean;
};

export function useProductsListConfig(): ProductsListConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'products_list_ui' });
  const { isAvailable: cartAvailable, ordersEnabled } = useCartAvailable();
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const promotionsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'promotions' });
  
  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: ProductsListConfig['layoutStyle'];
      gridColumns?: number;
      layouts?: Partial<Record<ProductsListConfig['layoutStyle'], Partial<Omit<ProductsListConfig, 'layoutStyle'>>>>;
      paginationType?: PaginationType;
      showSearch?: boolean;
      showCategories?: boolean;
      hideEmptyCategories?: boolean;
      postsPerPage?: number;
      showWishlistButton?: boolean;
      showAddToCartButton?: boolean;
      showBuyNowButton?: boolean;
      showPromotionBadge?: boolean;
      enableQuickAddVariant?: boolean;
      cornerRadius?: ProductsListConfig['cornerRadius'];
      cartButtonsLayout?: 'stack' | 'grid-2';
      priceFilterMode?: 'disabled' | 'custom' | 'smart_dropdown' | 'slider';
    } | undefined;

    const layoutStyle: ProductsListConfig['layoutStyle'] = raw?.layoutStyle ?? 'grid';
    const layoutConfig = raw?.layouts?.[layoutStyle];
    
    const configShowAddToCart = raw?.showAddToCartButton ?? true;
    const configShowBuyNow = raw?.showBuyNowButton ?? true;
    
    const wishlistEnabled = wishlistModule?.enabled ?? false;
    const promotionsEnabled = promotionsModule?.enabled ?? false;

    const isLoading = experienceSetting === undefined || wishlistModule === undefined || promotionsModule === undefined;

    return {
      layoutStyle,
      gridColumns: raw?.gridColumns ?? 3,
      paginationType: normalizePaginationType(layoutConfig?.paginationType ?? raw?.paginationType),
      cornerRadius: raw?.cornerRadius ?? 'lg',
      showSearch: layoutConfig?.showSearch ?? raw?.showSearch ?? true,
      showCategories: layoutConfig?.showCategories ?? raw?.showCategories ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      postsPerPage: layoutConfig?.postsPerPage ?? raw?.postsPerPage ?? 12,
      showWishlistButton: (raw?.showWishlistButton ?? true) && wishlistEnabled,
      showAddToCartButton: configShowAddToCart && cartAvailable,
      showBuyNowButton: configShowBuyNow && ordersEnabled,
      showPromotionBadge: (raw?.showPromotionBadge ?? true) && promotionsEnabled,
      enableQuickAddVariant: (raw?.enableQuickAddVariant ?? true) && cartAvailable,
      cartButtonsLayout: raw?.cartButtonsLayout ?? 'stack',
      priceFilterMode: raw?.priceFilterMode ?? 'custom',
      isLoading,
    };
  }, [experienceSetting, cartAvailable, ordersEnabled, wishlistModule, promotionsModule]);
}

type WishlistConfig = {
  layoutStyle: 'grid' | 'list' | 'table';
  showWishlistButton: boolean;
  showNote: boolean;
  showNotification: boolean;
  showAddToCartButton: boolean;
};

export function useWishlistConfig(): WishlistConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'wishlist_ui' });
  const noteFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableNote', moduleKey: 'wishlist' });
  const notificationFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableNotification', moduleKey: 'wishlist' });
  const { isAvailable: cartAvailable } = useCartAvailable();

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: WishlistConfig['layoutStyle'];
      layouts?: Partial<Record<WishlistConfig['layoutStyle'], Partial<Omit<WishlistConfig, 'layoutStyle'>>>>;
      showAddToCartButton?: boolean;
    } | undefined;

    const layoutStyle: WishlistConfig['layoutStyle'] = raw?.layoutStyle ?? 'grid';
    const layoutConfig = raw?.layouts?.[layoutStyle] ?? {};
    const showNote = layoutConfig.showNote ?? true;
    const showNotification = layoutConfig.showNotification ?? true;
    const configShowAddToCart = layoutConfig.showAddToCartButton ?? raw?.showAddToCartButton ?? true;

    return {
      layoutStyle,
      showWishlistButton: layoutConfig.showWishlistButton ?? true,
      showNote: (noteFeature?.enabled ?? true) && showNote,
      showNotification: (notificationFeature?.enabled ?? true) && showNotification,
      showAddToCartButton: configShowAddToCart && cartAvailable,
    };
  }, [experienceSetting?.value, noteFeature?.enabled, notificationFeature?.enabled, cartAvailable]);
}

type ServicesListConfig = {
  layoutStyle: 'grid' | 'sidebar' | 'list';
  gridColumns: number;
  filterPosition: 'sidebar' | 'top' | 'none';
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
};

export function useServicesListConfig(): ServicesListConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'services_list_ui' });
  
  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: string;
      gridColumns?: number;
      layouts?: Partial<Record<'grid' | 'sidebar' | 'list', Partial<Omit<ServicesListConfig, 'layoutStyle'>>>>;
      filterPosition?: FilterPosition;
      paginationType?: PaginationType;
      showSearch?: boolean;
      showCategories?: boolean;
      hideEmptyCategories?: boolean;
      postsPerPage?: number;
    } | undefined;

    const rawStyle = raw?.layoutStyle;
    const layoutStyle: ServicesListConfig['layoutStyle'] = rawStyle === 'sidebar'
      ? 'sidebar'
      : (rawStyle === 'list' || rawStyle === 'masonry' ? 'list' : 'grid');
    const layoutConfig = raw?.layouts?.[layoutStyle];
    return {
      layoutStyle,
      gridColumns: raw?.gridColumns ?? 3,
      filterPosition: layoutConfig?.filterPosition ?? raw?.filterPosition ?? 'sidebar',
      paginationType: normalizePaginationType(layoutConfig?.paginationType ?? raw?.paginationType),
      showSearch: layoutConfig?.showSearch ?? raw?.showSearch ?? true,
      showCategories: layoutConfig?.showCategories ?? raw?.showCategories ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      postsPerPage: layoutConfig?.postsPerPage ?? raw?.postsPerPage ?? 12,
    };
  }, [experienceSetting?.value]);
}

type ProjectsListConfig = {
  layoutStyle: 'grid' | 'sidebar' | 'list';
  gridColumns: number;
  filterPosition: 'sidebar' | 'top' | 'none';
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
  showClientName: boolean;
  showIntroVideo: boolean;
};

export function useProjectsListConfig(): ProjectsListConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'projects_list_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: string;
      gridColumns?: number;
      filterPosition?: FilterPosition;
      paginationType?: PaginationType;
      showSearch?: boolean;
      showCategories?: boolean;
      hideEmptyCategories?: boolean;
      postsPerPage?: number;
      showClientName?: boolean;
      showIntroVideo?: boolean;
    } | undefined;
    const rawStyle = raw?.layoutStyle;
    const layoutStyle: ProjectsListConfig['layoutStyle'] = rawStyle === 'sidebar'
      ? 'sidebar'
      : (rawStyle === 'list' || rawStyle === 'masonry' ? 'list' : 'grid');
    return {
      layoutStyle,
      gridColumns: raw?.gridColumns ?? 3,
      filterPosition: raw?.filterPosition ?? 'top',
      paginationType: normalizePaginationType(raw?.paginationType),
      showSearch: raw?.showSearch ?? true,
      showCategories: raw?.showCategories ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      postsPerPage: raw?.postsPerPage ?? 12,
      showClientName: raw?.showClientName ?? true,
      showIntroVideo: raw?.showIntroVideo ?? true,
    };
  }, [experienceSetting?.value]);
}

type ProjectsDetailConfig = {
  layoutStyle: 'classic' | 'modern' | 'minimal';
  showGallery: boolean;
  showIntroVideo: boolean;
  showRelated: boolean;
  showShare: boolean;
  showClientName: boolean;
};

export function useProjectsDetailConfig(): ProjectsDetailConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'projects_detail_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<ProjectsDetailConfig> | undefined;
    return {
      layoutStyle: raw?.layoutStyle ?? 'classic',
      showGallery: raw?.showGallery ?? true,
      showIntroVideo: raw?.showIntroVideo ?? true,
      showRelated: raw?.showRelated ?? true,
      showShare: raw?.showShare ?? true,
      showClientName: raw?.showClientName ?? true,
    };
  }, [experienceSetting?.value]);
}

type CoursesListConfig = {
  layoutStyle: 'grid' | 'sidebar' | 'list';
  gridColumns: number;
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  showLevelFilter: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
  cornerRadius: 'none' | 'sm' | 'lg';
};

const normalizeCoursesListLayoutStyle = (value?: string): CoursesListConfig['layoutStyle'] => {
  if (value === 'grid' || value === 'sidebar' || value === 'list') {return value;}
  if (value === 'masonry') return 'list';
  return 'grid';
};

export function useCoursesListConfig(): CoursesListConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'courses_list_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: string;
      gridColumns?: number;
      layouts?: Partial<Record<'grid' | 'sidebar' | 'list', Partial<Omit<CoursesListConfig, 'layoutStyle'>>>>;
      paginationType?: PaginationType;
      showSearch?: boolean;
      showCategories?: boolean;
      showLevelFilter?: boolean;
      hideEmptyCategories?: boolean;
      postsPerPage?: number;
      cornerRadius?: 'none' | 'sm' | 'lg';
    } | undefined;
    const layoutStyle = normalizeCoursesListLayoutStyle(raw?.layoutStyle);
    const layoutConfig = raw?.layouts?.[layoutStyle];
    return {
      layoutStyle,
      gridColumns: raw?.gridColumns ?? 3,
      paginationType: normalizePaginationType(layoutConfig?.paginationType ?? raw?.paginationType),
      showSearch: layoutConfig?.showSearch ?? raw?.showSearch ?? true,
      showCategories: layoutConfig?.showCategories ?? raw?.showCategories ?? true,
      showLevelFilter: layoutConfig?.showLevelFilter ?? raw?.showLevelFilter ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      postsPerPage: layoutConfig?.postsPerPage ?? raw?.postsPerPage ?? 12,
      cornerRadius: raw?.cornerRadius ?? 'lg',
    };
  }, [experienceSetting?.value]);
}

type CoursesDetailConfig = {
  layoutStyle: 'classic' | 'modern' | 'minimal';
  showCurriculum: boolean;
  showInstructor: boolean;
  showRelated: boolean;
  showStickyCta: boolean;
  cornerRadius: 'none' | 'sm' | 'lg';
};

export function useCoursesDetailConfig(): CoursesDetailConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'courses_detail_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<CoursesDetailConfig> | undefined;
    return {
      layoutStyle: raw?.layoutStyle ?? 'classic',
      showCurriculum: raw?.showCurriculum ?? true,
      showInstructor: raw?.showInstructor ?? true,
      showRelated: raw?.showRelated ?? true,
      showStickyCta: raw?.showStickyCta ?? true,
      cornerRadius: raw?.cornerRadius ?? 'lg',
    };
  }, [experienceSetting?.value]);
}

type ResourcesListConfig = {
  layoutStyle: 'grid' | 'sidebar' | 'list';
  gridColumns: number;
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  showResourceFilters: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
  cornerRadius: 'none' | 'sm' | 'lg';
};

const normalizeResourcesListLayoutStyle = (value?: string): ResourcesListConfig['layoutStyle'] => {
  if (value === 'grid' || value === 'sidebar' || value === 'list') {return value;}
  if (value === 'masonry') return 'list';
  return 'grid';
};

export function useResourcesListConfig(): ResourcesListConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'resources_list_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: string;
      gridColumns?: number;
      layouts?: Partial<Record<'grid' | 'sidebar' | 'list', Partial<Omit<ResourcesListConfig, 'layoutStyle'>>>>;
      paginationType?: PaginationType;
      showSearch?: boolean;
      showCategories?: boolean;
      showResourceFilters?: boolean;
      hideEmptyCategories?: boolean;
      postsPerPage?: number;
      cornerRadius?: 'none' | 'sm' | 'lg';
    } | undefined;
    const layoutStyle = normalizeResourcesListLayoutStyle(raw?.layoutStyle);
    const layoutConfig = raw?.layouts?.[layoutStyle];
    return {
      layoutStyle,
      gridColumns: raw?.gridColumns ?? 3,
      paginationType: normalizePaginationType(layoutConfig?.paginationType ?? raw?.paginationType),
      showSearch: layoutConfig?.showSearch ?? raw?.showSearch ?? true,
      showCategories: layoutConfig?.showCategories ?? raw?.showCategories ?? true,
      showResourceFilters: layoutConfig?.showResourceFilters ?? raw?.showResourceFilters ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      postsPerPage: layoutConfig?.postsPerPage ?? raw?.postsPerPage ?? 12,
      cornerRadius: raw?.cornerRadius ?? 'lg',
    };
  }, [experienceSetting?.value]);
}

type ResourcesDetailConfig = {
  layoutStyle: 'classic' | 'modern' | 'minimal';
  showGallery: boolean;
  galleryMode?: 'scroll' | 'grid';
  showRelated: boolean;
  showStickyCta: boolean;
  showResourceFilters: boolean;
  cornerRadius: 'none' | 'sm' | 'lg';
};

export function useResourcesDetailConfig(): ResourcesDetailConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'resources_detail_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<ResourcesDetailConfig> | undefined;
    return {
      layoutStyle: raw?.layoutStyle ?? 'classic',
      showGallery: raw?.showGallery ?? true,
      galleryMode: raw?.galleryMode ?? 'grid',
      showRelated: raw?.showRelated ?? true,
      showStickyCta: raw?.showStickyCta ?? true,
      showResourceFilters: raw?.showResourceFilters ?? true,
      cornerRadius: raw?.cornerRadius ?? 'lg',
    };
  }, [experienceSetting?.value]);
}

type LessonDetailConfig = {
  layoutStyle: 'classic' | 'focus' | 'compact';
  showSidebar: boolean;
  showLessonNavigation: boolean;
  showExerciseDownload: boolean;
  showCourseBreadcrumb: boolean;
  lockWallStyle: 'overlay' | 'card';
  cornerRadius: 'none' | 'sm' | 'lg';
};

export function useLessonDetailConfig(): LessonDetailConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'lesson_detail_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<LessonDetailConfig> | undefined;
    const layoutStyle = raw?.layoutStyle === 'focus' || raw?.layoutStyle === 'compact' || raw?.layoutStyle === 'classic'
      ? raw.layoutStyle
      : 'classic';
    const lockWallStyle = raw?.lockWallStyle === 'card' || raw?.lockWallStyle === 'overlay'
      ? raw.lockWallStyle
      : 'overlay';

    return {
      layoutStyle,
      showSidebar: raw?.showSidebar ?? true,
      showLessonNavigation: raw?.showLessonNavigation ?? true,
      showExerciseDownload: raw?.showExerciseDownload ?? true,
      showCourseBreadcrumb: raw?.showCourseBreadcrumb ?? true,
      lockWallStyle,
      cornerRadius: raw?.cornerRadius ?? 'lg',
    };
  }, [experienceSetting?.value]);
}

type CartConfig = {
  layoutStyle: 'drawer' | 'page' | 'table';
  showExpiry: boolean;
  showNote: boolean;
};

export function useCartConfig(): CartConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'cart_ui' });
  const expiryFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableExpiry', moduleKey: 'cart' });
  const noteFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableNote', moduleKey: 'cart' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: CartConfig['layoutStyle'];
      layouts?: Record<string, Partial<Omit<CartConfig, 'layoutStyle'>>>;
    } | undefined;

    const layoutStyle: CartConfig['layoutStyle'] = raw?.layoutStyle ?? 'drawer';
    const layoutConfig = raw?.layouts?.[layoutStyle] ?? {};

    return {
      layoutStyle,
      showExpiry: (expiryFeature?.enabled ?? false) && (layoutConfig.showExpiry ?? false),
      showNote: (noteFeature?.enabled ?? false) && (layoutConfig.showNote ?? false),
    };
  }, [experienceSetting?.value, expiryFeature?.enabled, noteFeature?.enabled]);
}

type CheckoutConfig = {
  flowStyle: 'single-page' | 'multi-step' | 'wizard-accordion';
  orderSummaryPosition: 'right' | 'bottom';
  showPaymentMethods: boolean;
  showShippingOptions: boolean;
  showBuyNow: boolean;
};

export function useCheckoutConfig(): CheckoutConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'checkout_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      flowStyle?: CheckoutConfig['flowStyle'];
      layouts?: Record<string, Partial<Omit<CheckoutConfig, 'flowStyle' | 'showBuyNow'>>>;
      showBuyNow?: boolean;
      orderSummaryPosition?: CheckoutConfig['orderSummaryPosition'];
      showPaymentMethods?: boolean;
      showShippingOptions?: boolean;
    } | undefined;

    const flowStyle: CheckoutConfig['flowStyle'] = raw?.flowStyle ?? 'multi-step';
    const layoutConfig = raw?.layouts?.[flowStyle] ?? {};

    return {
      flowStyle,
      orderSummaryPosition: layoutConfig.orderSummaryPosition ?? raw?.orderSummaryPosition ?? 'right',
      showPaymentMethods: layoutConfig.showPaymentMethods ?? raw?.showPaymentMethods ?? true,
      showShippingOptions: layoutConfig.showShippingOptions ?? raw?.showShippingOptions ?? true,
      showBuyNow: raw?.showBuyNow ?? true,
    };
  }, [experienceSetting?.value]);
}

type AccountOrdersConfig = {
  layoutStyle: 'cards' | 'compact' | 'timeline';
  showStats: boolean;
  showOrderItems: boolean;
  showPaymentMethod: boolean;
  showShippingMethod: boolean;
  showShippingAddress: boolean;
  showTracking: boolean;
  showTimeline: boolean;
  paginationType: PaginationType;
  ordersPerPage: number;
  defaultStatusFilter: string[];
};

export function useAccountOrdersConfig(): AccountOrdersConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'account_orders_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<AccountOrdersConfig> | undefined;
    return {
      layoutStyle: raw?.layoutStyle ?? 'cards',
      showStats: raw?.showStats ?? true,
      showOrderItems: raw?.showOrderItems ?? true,
      showPaymentMethod: raw?.showPaymentMethod ?? true,
      showShippingMethod: raw?.showShippingMethod ?? true,
      showShippingAddress: raw?.showShippingAddress ?? true,
      showTracking: raw?.showTracking ?? true,
      showTimeline: raw?.showTimeline ?? true,
      paginationType: normalizePaginationType(raw?.paginationType),
      ordersPerPage: raw?.ordersPerPage ?? 12,
      defaultStatusFilter: Array.isArray(raw?.defaultStatusFilter)
        ? raw?.defaultStatusFilter.filter((value) => typeof value === 'string')
        : [],
    };
  }, [experienceSetting?.value]);
}

export function useOrderStatuses() {
  const statusData = useQuery(api.orders.getOrderStatuses);

  return useMemo(() => {
    const preset = normalizeOrderStatusPreset(statusData?.preset);
    const statuses = parseOrderStatuses(statusData?.statuses, preset);

    return {
      preset,
      statuses,
    };
  }, [statusData?.preset, statusData?.statuses]);
}

type AccountProfileConfig = {
  layoutStyle: 'card' | 'sidebar' | 'compact';
  showQuickActions: boolean;
  showContactInfo: boolean;
  showAddress: boolean;
  showMemberId: boolean;
  showJoinDate: boolean;
  actionItems: string[];
};

export function useAccountProfileConfig(): AccountProfileConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'account_profile_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<AccountProfileConfig> | undefined;
    const rawActions = Array.isArray(raw?.actionItems)
      ? raw?.actionItems.filter((value): value is string => typeof value === 'string')
      : null;
    const normalizedActions = rawActions?.length ? rawActions : ['orders', 'shop', 'wishlist', 'payment', 'settings'];

    return {
      layoutStyle: raw?.layoutStyle ?? 'card',
      showQuickActions: raw?.showQuickActions ?? true,
      showContactInfo: raw?.showContactInfo ?? true,
      showAddress: raw?.showAddress ?? true,
      showMemberId: raw?.showMemberId ?? true,
      showJoinDate: raw?.showJoinDate ?? true,
      actionItems: normalizedActions,
    };
  }, [experienceSetting?.value]);
}

export function useErrorPagesConfig(): ErrorPagesExperienceConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'error_pages_ui' });

  return useMemo(() => parseErrorPagesConfig(experienceSetting?.value), [experienceSetting?.value]);
}
