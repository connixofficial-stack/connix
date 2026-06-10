'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SnapshotRouter } from './SnapshotRouter';
import { SnapshotRouter2 } from './SnapshotRouter2';
import { SnapshotRouter3 } from './SnapshotRouter3';
import { GenericSnapshotEditor, type BaseHeaderConfig, type SnapshotAdapter } from './GenericSnapshotEditor';
import HomeComponentLegacyEditor from '../../_shared/legacy/HomeComponentLegacyEditor';
import { saveSnapshotComponent } from '../_lib/snapshotComponentSave';
import { StatsForm, type StatsFormItem } from '../../stats/_components/StatsForm';
import { StatsPreview } from '../../stats/_components/StatsPreview';
import { DEFAULT_STATS_CONFIG, DEFAULT_STATS_ITEMS } from '../../stats/_lib/constants';
import type { StatsBrandMode, StatsItem, StatsMediaAlign, StatsMediaPlacement, StatsStyle } from '../../stats/_types';
import { ProductCategoriesForm } from '../../product-categories/_components/ProductCategoriesForm';
import { ProductCategoriesPreview } from '../../product-categories/_components/ProductCategoriesPreview';
import { sanitizeDemoCategories } from '../../product-categories/_lib/imageSrc';
import type {
  CategoryConfigItem,
  DemoProductCategoryItem,
  ProductCategoriesBrandMode,
  ProductCategoriesConfig,
  ProductCategoriesSelectionMode,
  ProductCategoriesStyle,
} from '../../product-categories/_types';
import { BlogForm, type BlogPostItem } from '../../blog/_components/BlogForm';
import { BlogPreview } from '../../blog/_components/BlogPreview';
import { sortBlogPosts } from '../../blog/_lib/constants';
import {
  normalizeBlogConfig,
  type BlogCardRadius,
  type BlogSelectionMode,
  type BlogSortBy,
  type BlogStyle,
  type DemoBlogItem,
} from '../../blog/_types';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { ProductGridForm, type CategoryTabItem, type ProductGridProductItem } from '../../product-grid/_components/ProductGridForm';
import { ProductGridPreview } from '../../product-grid/_components/ProductGridPreview';
import { DEFAULT_PRODUCT_GRID_CONFIG, resolveGridStyle } from '../../product-grid/_lib/constants';
import type { DemoProductItem, ProductListPreviewItem } from '../../product-list/_types';
import type { ProductGridSelectionMode, ProductGridSortBy, ProductGridStyle } from '../../product-grid/_types';
import { PartnersForm } from '../../partners/_components/PartnersForm';
import { PartnersPreview } from '../../partners/_components/PartnersPreview';
import {
  DEFAULT_PARTNERS_CORNER_RADIUS,
  DEFAULT_PARTNERS_LOGO_SIZE,
  DEFAULT_PARTNERS_SHOW_BORDER,
  DEFAULT_PARTNERS_SPACING,
  getPartnersLogoColorModeFromIntensity,
  normalizePartnersCornerRadius,
  normalizePartnersDisplayMode,
  normalizePartnersLogoColorIntensity,
  normalizePartnersLogoColorMode,
  normalizePartnersLogoSize,
  normalizePartnersShowBorder,
  normalizePartnersSpacing,
  normalizePartnersStyle,
  type PartnerItem,
  type PartnersCornerRadius,
  type PartnersDisplayMode,
  type PartnersLogoColorIntensity,
  type PartnersLogoColorMode,
  type PartnersLogoSize,
  type PartnersSpacing,
  type PartnersStyle,
} from '../../partners/_types';

type StatsSnapshotState = {
  backgroundImage: string;
  desktopColumns: 3 | 4;
  enableAnimation: boolean;
  fullWidth: boolean;
  items: StatsFormItem[];
  mediaAlign: StatsMediaAlign;
  mediaPlacement: StatsMediaPlacement;
  style: StatsStyle;
};

type ProductCategoriesSnapshotState = {
  categories: CategoryConfigItem[];
  demoCategories: DemoProductCategoryItem[];
  selectionMode: ProductCategoriesSelectionMode;
  showProductCount: boolean;
  style: ProductCategoriesStyle;
};

type BlogSnapshotState = {
  cornerRadius: BlogCardRadius;
  demoPosts: DemoBlogItem[];
  desktopColumns: 3 | 4;
  itemCount: number;
  searchTerm: string;
  selectedPostIds: string[];
  selectionMode: BlogSelectionMode;
  showAuthor: boolean;
  showDate: boolean;
  showExcerpt: boolean;
  spacing: SectionSpacing;
  sortBy: BlogSortBy;
  style: BlogStyle;
};

type ProductGridSnapshotState = {
  categoryTabIds: string[];
  demoProducts: DemoProductItem[];
  desktopColumns: 3 | 4 | 5 | 6;
  itemCount: number;
  productSearchTerm: string;
  sectionTitle: string;
  selectedProductIds: string[];
  selectionMode: ProductGridSelectionMode;
  sortBy: ProductGridSortBy;
  style: ProductGridStyle;
  subTitle: string;
};

type PartnersSnapshotState = {
  cornerRadius: PartnersCornerRadius;
  displayMode: PartnersDisplayMode;
  items: PartnerItem[];
  logoColorIntensity: PartnersLogoColorIntensity;
  logoColorMode: PartnersLogoColorMode;
  logoSize: PartnersLogoSize;
  showBorder: boolean;
  spacing: PartnersSpacing;
  style: PartnersStyle;
};

const normalizeStatsItems = (items: unknown): StatsFormItem[] => {
  const source = Array.isArray(items) ? items : DEFAULT_STATS_ITEMS;
  return source.map((item, index) => {
    const stat = item as Partial<StatsItem>;
    return {
      description: stat.description ?? '',
      iconName: stat.iconName,
      iconType: stat.iconType,
      iconUrl: stat.iconUrl,
      id: `stat-${index}`,
      label: stat.label ?? '',
      value: stat.value ?? '',
    };
  });
};

const toStatsPersistItems = (items: StatsFormItem[]): StatsItem[] => items.map((item) => ({
  description: item.description,
  iconName: item.iconName,
  iconType: item.iconType,
  iconUrl: item.iconUrl,
  label: item.label,
  value: item.value,
}));

const statsSnapshotAdapter: SnapshotAdapter<StatsSnapshotState> = {
  normalizeState: (rawConfig) => ({
    backgroundImage: typeof rawConfig.backgroundImage === 'string' ? rawConfig.backgroundImage : DEFAULT_STATS_CONFIG.backgroundImage ?? '',
    desktopColumns: rawConfig.desktopColumns === 3 ? 3 : 4,
    enableAnimation: typeof rawConfig.enableAnimation === 'boolean' ? rawConfig.enableAnimation : false,
    fullWidth: typeof rawConfig.fullWidth === 'boolean' ? rawConfig.fullWidth : DEFAULT_STATS_CONFIG.fullWidth ?? false,
    items: normalizeStatsItems(rawConfig.items),
    mediaAlign: rawConfig.mediaAlign === 'left' || rawConfig.mediaAlign === 'right' ? rawConfig.mediaAlign : DEFAULT_STATS_CONFIG.mediaAlign ?? 'center',
    mediaPlacement: rawConfig.mediaPlacement === 'left' ? 'left' : DEFAULT_STATS_CONFIG.mediaPlacement ?? 'top',
    style: (rawConfig.style as StatsStyle) || 'horizontal',
  }),
  toConfig: (state, headerConfig: BaseHeaderConfig) => ({
    ...headerConfig,
    backgroundImage: state.backgroundImage,
    desktopColumns: state.desktopColumns,
    enableAnimation: state.enableAnimation,
    fullWidth: state.fullWidth,
    items: toStatsPersistItems(state.items),
    mediaAlign: state.mediaAlign,
    mediaPlacement: state.mediaPlacement,
    style: state.style,
  }),
  renderForm: (state, setState) => (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số cột desktop</label>
            <div className="grid grid-cols-2 gap-2">
              {[3, 4].map((columns) => (
                <button
                  key={columns}
                  type="button"
                  className={`h-9 rounded-md border text-xs transition-colors ${state.desktopColumns === columns ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}
                  onClick={() => setState((current) => ({ ...current, desktopColumns: columns as 3 | 4 }))}
                >
                  {columns} cột
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
            <input
              type="checkbox"
              checked={state.fullWidth}
              onChange={(event) => setState((current) => ({ ...current, fullWidth: event.target.checked }))}
            />
            Full width desktop
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
            <input
              type="checkbox"
              checked={state.enableAnimation}
              onChange={(event) => setState((current) => ({ ...current, enableAnimation: event.target.checked }))}
            />
            Animation số liệu
          </label>
        </div>
      </div>
      <StatsForm
        items={state.items}
        onChange={(items) => setState((current) => ({ ...current, items }))}
        mediaPlacement={state.mediaPlacement}
        mediaAlign={state.mediaAlign}
        backgroundImage={state.backgroundImage}
        onMediaPlacementChange={(mediaPlacement) => setState((current) => ({ ...current, mediaPlacement }))}
        onMediaAlignChange={(mediaAlign) => setState((current) => ({ ...current, mediaAlign }))}
        onBackgroundImageChange={(backgroundImage) => setState((current) => ({ ...current, backgroundImage }))}
        defaultExpanded={true}
      />
    </div>
  ),
  renderPreview: (state, setState, title, headerConfig, colors, fontStyle, fontClassName) => (
    <StatsPreview
      items={state.items}
      brandColor={colors.primary}
      secondary={colors.secondary}
      mode={colors.mode as StatsBrandMode}
      selectedStyle={state.style}
      onStyleChange={(style) => setState((current) => ({ ...current, style }))}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
      title={title}
      desktopColumns={state.desktopColumns}
      mediaPlacement={state.mediaPlacement}
      mediaAlign={state.mediaAlign}
      backgroundImage={state.backgroundImage}
      fullWidth={state.fullWidth}
      enableAnimation={state.enableAnimation}
      {...headerConfig}
    />
  ),
};

const normalizeProductCategoriesItems = (categories: unknown): CategoryConfigItem[] => (
  Array.isArray(categories) ? categories : []
).map((item, index) => {
  const category = item as Partial<CategoryConfigItem>;
  return {
    categoryId: category.categoryId ?? '',
    customImage: category.customImage ?? '',
    id: typeof category.id === 'number' ? category.id : index,
    imageMode: category.imageMode ?? 'default',
  };
});

function ProductCategoriesSnapshotForm({
  colors,
  setState,
  state,
}: {
  colors: { primary: string };
  setState: React.Dispatch<React.SetStateAction<ProductCategoriesSnapshotState>>;
  state: ProductCategoriesSnapshotState;
}) {
  const productCategoriesData = useQuery(api.productCategories.listActive);

  return (
    <ProductCategoriesForm
      productCategoriesItems={state.categories}
      setProductCategoriesItems={(categories) => setState((current) => ({ ...current, categories }))}
      productCategoriesShowCount={state.showProductCount}
      setProductCategoriesShowCount={(showProductCount) => setState((current) => ({ ...current, showProductCount }))}
      productCategoriesData={productCategoriesData ?? []}
      brandColor={colors.primary}
      selectionMode={state.selectionMode}
      onSelectionModeChange={(selectionMode) => setState((current) => ({ ...current, selectionMode }))}
      demoCategories={state.demoCategories}
      setDemoCategories={(next) => setState((current) => ({
        ...current,
        demoCategories: typeof next === 'function' ? next(current.demoCategories) : next,
      }))}
      defaultExpanded={true}
    />
  );
}

function ProductCategoriesSnapshotPreview({
  colors,
  fontClassName,
  fontStyle,
  headerConfig,
  setState,
  state,
  title,
}: {
  colors: { primary: string; secondary: string; mode: 'single' | 'dual' };
  fontClassName: string;
  fontStyle: React.CSSProperties;
  headerConfig: BaseHeaderConfig;
  setState: React.Dispatch<React.SetStateAction<ProductCategoriesSnapshotState>>;
  state: ProductCategoriesSnapshotState;
  title: string;
}) {
  const productCategoriesData = useQuery(api.productCategories.listActive);
  const config: ProductCategoriesConfig = {
    ...headerConfig,
    align: headerConfig.headerAlign,
    categories: state.categories,
    demoCategories: state.demoCategories,
    selectionMode: state.selectionMode,
    showProductCount: state.showProductCount,
    style: state.style,
    subheading: headerConfig.subtitle,
  };

  return (
    <ProductCategoriesPreview
      config={config}
      title={title}
      brandColor={colors.primary}
      secondary={colors.secondary}
      mode={colors.mode as ProductCategoriesBrandMode}
      selectedStyle={state.style}
      onStyleChange={(style) => setState((current) => ({ ...current, style }))}
      categoriesData={productCategoriesData ?? []}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
      selectionMode={state.selectionMode}
      demoCategories={state.demoCategories}
    />
  );
}

const productCategoriesSnapshotAdapter: SnapshotAdapter<ProductCategoriesSnapshotState> = {
  normalizeState: (rawConfig) => ({
    categories: normalizeProductCategoriesItems(rawConfig.categories),
    demoCategories: Array.isArray(rawConfig.demoCategories) ? sanitizeDemoCategories(rawConfig.demoCategories as DemoProductCategoryItem[]) : [],
    selectionMode: rawConfig.selectionMode === 'demo' ? 'demo' : 'real',
    showProductCount: typeof rawConfig.showProductCount === 'boolean' ? rawConfig.showProductCount : true,
    style: (rawConfig.style as ProductCategoriesStyle) || 'image-strip',
  }),
  toConfig: (state, headerConfig) => {
    const sanitizedSubtitle = headerConfig.subtitle.trim();
    const sanitizedBadgeText = headerConfig.badgeText.trim();
    const sanitizedDemoCategories = sanitizeDemoCategories(state.demoCategories);

    return {
      ...headerConfig,
      badgeText: sanitizedBadgeText,
      categories: state.selectionMode === 'real' ? state.categories.map((category) => ({
        categoryId: category.categoryId,
        customImage: category.customImage || undefined,
        imageMode: category.imageMode ?? 'default',
      })) : [],
      demoCategories: state.selectionMode === 'demo' ? sanitizedDemoCategories : [],
      selectionMode: state.selectionMode,
      showProductCount: state.showProductCount,
      style: state.style,
      subtitle: sanitizedSubtitle,
      subheading: sanitizedSubtitle,
      align: headerConfig.headerAlign,
    };
  },
  renderForm: (state, setState, colors) => (
    <ProductCategoriesSnapshotForm colors={colors} state={state} setState={setState} />
  ),
  renderPreview: (state, setState, title, headerConfig, colors, fontStyle, fontClassName) => (
    <ProductCategoriesSnapshotPreview
      colors={colors}
      fontClassName={fontClassName}
      fontStyle={fontStyle}
      headerConfig={headerConfig}
      setState={setState}
      state={state}
      title={title}
    />
  ),
};

const getPublishedPosts = (postsData: BlogPostItem[] | undefined) => (
  postsData ?? []
).filter((post) => post.status === 'Published');

const getSelectedBlogPosts = (postsData: BlogPostItem[] | undefined, selectedPostIds: string[]) => {
  const postMap = new Map(getPublishedPosts(postsData).map((post) => [post._id, post]));
  return selectedPostIds
    .map((postId) => postMap.get(postId))
    .filter((post): post is BlogPostItem => post !== undefined);
};

const getDemoBlogPreviewItems = (demoPosts: DemoBlogItem[]): BlogPostItem[] => demoPosts.map((item) => ({
  _creationTime: Date.now(),
  _id: item.id,
  categoryName: item.category,
  excerpt: item.excerpt,
  publishedAt: undefined,
  status: 'Published',
  thumbnail: item.thumbnail,
  title: item.title || 'Bài viết demo',
  views: 0,
}));

function BlogSnapshotForm({
  setState,
  state,
}: {
  setState: React.Dispatch<React.SetStateAction<BlogSnapshotState>>;
  state: BlogSnapshotState;
}) {
  const postsData = useQuery(api.posts.listAll, { limit: 100 }) as BlogPostItem[] | undefined;
  const filteredPosts = getPublishedPosts(postsData).filter((post) => (
    !state.searchTerm || post.title.toLowerCase().includes(state.searchTerm.toLowerCase())
  ));
  const selectedPosts = getSelectedBlogPosts(postsData, state.selectedPostIds);

  return (
    <BlogForm
      showAuthor={state.showAuthor}
      showDate={state.showDate}
      showExcerpt={state.showExcerpt}
      onDisplayConfigChange={(next) => setState((current) => ({
        ...current,
        showAuthor: next.showAuthor ?? current.showAuthor,
        showDate: next.showDate ?? current.showDate,
        showExcerpt: next.showExcerpt ?? current.showExcerpt,
      }))}
      selectionMode={state.selectionMode}
      onSelectionModeChange={(selectionMode) => setState((current) => ({ ...current, selectionMode }))}
      itemCount={state.itemCount}
      sortBy={state.sortBy}
      onConfigChange={(next) => setState((current) => ({
        ...current,
        itemCount: next.itemCount ?? current.itemCount,
        sortBy: next.sortBy ?? current.sortBy,
      }))}
      selectedPosts={selectedPosts}
      selectedPostIds={state.selectedPostIds}
      onTogglePost={(postId) => setState((current) => ({
        ...current,
        selectedPostIds: current.selectedPostIds.includes(postId)
          ? current.selectedPostIds.filter((id) => id !== postId)
          : [...current.selectedPostIds, postId],
      }))}
      searchTerm={state.searchTerm}
      onSearchTermChange={(searchTerm) => setState((current) => ({ ...current, searchTerm }))}
      filteredPosts={filteredPosts}
      demoPosts={state.demoPosts}
      setDemoPosts={(next) => setState((current) => ({
        ...current,
        demoPosts: typeof next === 'function' ? next(current.demoPosts) : next,
      }))}
      isLoading={postsData === undefined}
      defaultExpanded={true}
      desktopColumns={state.desktopColumns}
      onDesktopColumnsChange={(desktopColumns) => setState((current) => ({ ...current, desktopColumns }))}
      spacing={state.spacing}
      onSpacingChange={(spacing) => setState((current) => ({ ...current, spacing }))}
      cornerRadius={state.cornerRadius}
      onCornerRadiusChange={(cornerRadius) => setState((current) => ({ ...current, cornerRadius }))}
    />
  );
}

function BlogSnapshotPreview({
  colors,
  fontClassName,
  fontStyle,
  headerConfig,
  setState,
  state,
  title,
}: {
  colors: { primary: string; secondary: string; mode: 'single' | 'dual' };
  fontClassName: string;
  fontStyle: React.CSSProperties;
  headerConfig: BaseHeaderConfig;
  setState: React.Dispatch<React.SetStateAction<BlogSnapshotState>>;
  state: BlogSnapshotState;
  title: string;
}) {
  const postsData = useQuery(api.posts.listAll, { limit: 100 }) as BlogPostItem[] | undefined;
  const postCategoriesData = useQuery(api.postCategories.listAll, { limit: 200 });
  const categoryMap = React.useMemo(() => {
    if (!postCategoriesData) {return undefined;}
    const map: Record<string, string> = {};
    postCategoriesData.forEach((category: { _id: string; name: string }) => {
      map[category._id] = category.name;
    });
    return map;
  }, [postCategoriesData]);
  const previewItems = React.useMemo(() => {
    if (state.selectionMode === 'demo') {
      return getDemoBlogPreviewItems(state.demoPosts);
    }

    if (state.selectionMode === 'manual') {
      return getSelectedBlogPosts(postsData, state.selectedPostIds);
    }

    return (sortBlogPosts(getPublishedPosts(postsData) as any[], state.sortBy, title) as BlogPostItem[]).slice(0, state.itemCount);
  }, [postsData, state.demoPosts, state.itemCount, state.selectedPostIds, state.selectionMode, state.sortBy, title]);

  return (
    <BlogPreview
      brandColor={colors.primary}
      secondary={colors.secondary}
      mode={colors.mode}
      postCount={state.selectionMode === 'demo' ? state.demoPosts.length : state.selectionMode === 'manual' ? state.selectedPostIds.length : state.itemCount}
      selectedStyle={state.style}
      onStyleChange={(style) => setState((current) => ({ ...current, style }))}
      title={title}
      subtitle={headerConfig.subtitle}
      previewItems={previewItems}
      categoryMap={categoryMap}
      showAuthor={state.showAuthor}
      showDate={state.showDate}
      showExcerpt={state.showExcerpt}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
      hideHeader={headerConfig.hideHeader}
      showTitleHeader={headerConfig.showTitle}
      showSubtitleHeader={headerConfig.showSubtitle}
      showBadge={headerConfig.showBadge}
      badgeText={headerConfig.badgeText}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      desktopColumns={state.desktopColumns}
      spacing={state.spacing}
      cornerRadius={state.cornerRadius}
    />
  );
}

const blogSnapshotAdapter: SnapshotAdapter<BlogSnapshotState> = {
  normalizeState: (rawConfig) => {
    const config = normalizeBlogConfig(rawConfig);

    return {
      cornerRadius: config.cornerRadius,
      demoPosts: config.demoPosts ?? [],
      desktopColumns: config.desktopColumns,
      itemCount: config.itemCount,
      searchTerm: '',
      selectedPostIds: config.selectedPostIds,
      selectionMode: config.selectionMode,
      showAuthor: config.showAuthor,
      showDate: config.showDate,
      showExcerpt: config.showExcerpt,
      spacing: config.spacing,
      sortBy: config.sortBy,
      style: config.style,
    };
  },
  toConfig: (state, headerConfig) => ({
    ...headerConfig,
    badgeText: headerConfig.badgeText.trim(),
    cornerRadius: state.cornerRadius,
    noBorderRadius: state.cornerRadius === 'none',
    demoPosts: state.selectionMode === 'demo' ? state.demoPosts : [],
    desktopColumns: state.desktopColumns,
    itemCount: state.itemCount,
    selectedPostIds: state.selectionMode === 'manual' ? state.selectedPostIds : [],
    selectionMode: state.selectionMode,
    showAuthor: state.showAuthor,
    showDate: state.showDate,
    showExcerpt: state.showExcerpt,
    spacing: state.spacing,
    noVerticalMargin: state.spacing === 'none',
    sortBy: state.sortBy,
    style: state.style,
    subtitle: headerConfig.subtitle.trim(),
  }),
  renderForm: (state, setState) => (
    <BlogSnapshotForm state={state} setState={setState} />
  ),
  renderPreview: (state, setState, title, headerConfig, colors, fontStyle, fontClassName) => (
    <BlogSnapshotPreview
      colors={colors}
      fontClassName={fontClassName}
      fontStyle={fontStyle}
      headerConfig={headerConfig}
      setState={setState}
      state={state}
      title={title}
    />
  ),
};

const formatSnapshotPrice = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value.toLocaleString('vi-VN')}đ`;
  }
  return undefined;
};

const normalizeProductGridColumns = (value: unknown): 3 | 4 | 5 | 6 => (
  value === 3 || value === 5 || value === 6 ? value : 4
);

const toProductGridPreviewItem = (product: {
  _id: string;
  image?: string | null;
  name: string;
  price?: number | string | null;
  salePrice?: number | string | null;
  categoryName?: string;
}): ProductListPreviewItem => ({
  description: product.name,
  id: product._id,
  image: product.image ?? undefined,
  name: product.name,
  price: formatSnapshotPrice(product.salePrice ?? product.price),
  originalPrice: product.salePrice ? formatSnapshotPrice(product.price) : undefined,
  category: product.categoryName,
});

function ProductGridSnapshotForm({
  setState,
  state,
}: {
  setState: React.Dispatch<React.SetStateAction<ProductGridSnapshotState>>;
  state: ProductGridSnapshotState;
}) {
  const productsData = useQuery(api.products.listAll, { limit: 100 }) as Array<ProductGridProductItem & { status?: string }> | undefined;
  const categoriesData = useQuery(api.productCategories.listActive) as Array<CategoryTabItem & { image?: string }> | undefined;
  const allCategories = React.useMemo<CategoryTabItem[] | undefined>(() => (
    categoriesData?.map((category) => ({
      _id: category._id,
      active: category.active,
      image: category.image,
      name: category.name,
    }))
  ), [categoriesData]);
  const filteredProducts = React.useMemo<ProductGridProductItem[]>(() => (
    productsData ?? []
  )
    .filter((product) => product.status === 'Active')
    .filter((product) => !state.productSearchTerm || product.name.toLowerCase().includes(state.productSearchTerm.toLowerCase()))
    .map((product) => ({
      _id: product._id,
      hasVariants: product.hasVariants,
      image: product.image,
      name: product.name,
      price: typeof product.price === 'number' ? product.price : null,
      salePrice: typeof product.salePrice === 'number' ? product.salePrice : null,
    })), [productsData, state.productSearchTerm]);
  const selectedProducts = React.useMemo<ProductGridProductItem[]>(() => {
    const productMap = new Map(filteredProducts.map((product) => [product._id, product]));
    return state.selectedProductIds
      .map((productId) => productMap.get(productId))
      .filter((product): product is ProductGridProductItem => product !== undefined);
  }, [filteredProducts, state.selectedProductIds]);

  return (
    <ProductGridForm
      itemCount={state.itemCount}
      setItemCount={(itemCount) => setState((current) => ({ ...current, itemCount }))}
      sortBy={state.sortBy}
      setSortBy={(sortBy) => setState((current) => ({ ...current, sortBy }))}
      selectionMode={state.selectionMode}
      setSelectionMode={(selectionMode) => setState((current) => ({ ...current, selectionMode }))}
      selectedProductIds={state.selectedProductIds}
      setSelectedProductIds={(next) => setState((current) => ({
        ...current,
        selectedProductIds: typeof next === 'function' ? next(current.selectedProductIds) : next,
      }))}
      productSearchTerm={state.productSearchTerm}
      setProductSearchTerm={(productSearchTerm) => setState((current) => ({ ...current, productSearchTerm }))}
      selectedProducts={selectedProducts}
      filteredProducts={filteredProducts}
      isLoading={productsData === undefined}
      demoProducts={state.demoProducts}
      setDemoProducts={(next) => setState((current) => ({
        ...current,
        demoProducts: typeof next === 'function' ? next(current.demoProducts) : next,
      }))}
      categoryTabIds={state.categoryTabIds}
      setCategoryTabIds={(next) => setState((current) => ({
        ...current,
        categoryTabIds: typeof next === 'function' ? next(current.categoryTabIds) : next,
      }))}
      allCategories={allCategories}
      desktopColumns={state.desktopColumns}
      onDesktopColumnsChange={(desktopColumns) => setState((current) => ({ ...current, desktopColumns }))}
      defaultExpanded={true}
    />
  );
}

function ProductGridSnapshotPreview({
  colors,
  fontClassName,
  fontStyle,
  headerConfig,
  setState,
  state,
  title,
}: {
  colors: { primary: string; secondary: string };
  fontClassName: string;
  fontStyle: React.CSSProperties;
  headerConfig: BaseHeaderConfig;
  setState: React.Dispatch<React.SetStateAction<ProductGridSnapshotState>>;
  state: ProductGridSnapshotState;
  title: string;
}) {
  const productsData = useQuery(api.products.listPublicResolved, { limit: 100 }) as Array<{
    _id: string;
    categoryName?: string;
    image?: string | null;
    name: string;
    price?: number | string | null;
    salePrice?: number | string | null;
    status?: string;
  }> | undefined;
  const categoriesData = useQuery(api.productCategories.listActive) as CategoryTabItem[] | undefined;
  const autoItems = React.useMemo(() => (
    productsData ?? []
  ).filter((product) => product.status === 'Active').slice(0, state.itemCount).map(toProductGridPreviewItem), [productsData, state.itemCount]);
  const manualItems = React.useMemo(() => {
    const productMap = new Map((productsData ?? []).map((product) => [product._id, product]));
    return state.selectedProductIds
      .map((productId) => productMap.get(productId))
      .filter((product): product is NonNullable<typeof product> => product !== undefined)
      .map(toProductGridPreviewItem);
  }, [productsData, state.selectedProductIds]);
  const demoItems = React.useMemo<ProductListPreviewItem[]>(() => state.demoProducts.map((product) => ({
    category: product.category,
    description: product.description ?? product.name,
    id: product.id,
    image: product.image,
    name: product.name,
    originalPrice: product.originalPrice,
    price: product.price,
    tag: product.tag || undefined,
  })), [state.demoProducts]);
  const categoryTabs = React.useMemo(() => {
    if (state.selectionMode === 'demo') {
      return [...new Set(state.demoProducts.map((product) => product.category).filter(Boolean))]
        .slice(0, 5)
        .map((name) => ({ _id: name, active: true, name }) as CategoryTabItem);
    }

    if (!categoriesData) {return undefined;}
    if (state.categoryTabIds.length === 0) {
      return categoriesData.filter((category) => category.active);
    }

    return state.categoryTabIds
      .map((categoryId) => categoriesData.find((category) => category._id === categoryId))
      .filter((category): category is CategoryTabItem => category !== undefined);
  }, [categoriesData, state.categoryTabIds, state.demoProducts, state.selectionMode]);
  const items = state.selectionMode === 'demo' && demoItems.length > 0
    ? demoItems
    : state.selectionMode === 'manual' && manualItems.length > 0
      ? manualItems
      : autoItems.length > 0 ? autoItems : undefined;

  return (
    <ProductGridPreview
      brandColor={colors.primary}
      secondary={colors.secondary}
      itemCount={state.selectionMode === 'demo' ? state.demoProducts.length : state.selectionMode === 'manual' ? state.selectedProductIds.length : state.itemCount}
      selectedStyle={state.style}
      onStyleChange={(style) => setState((current) => ({ ...current, style }))}
      items={items}
      subTitle={state.subTitle}
      sectionTitle={title}
      subtitle={state.sectionTitle}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
      desktopColumns={state.desktopColumns}
      categoryTabs={categoryTabs}
      hideHeader={headerConfig.hideHeader}
      showTitle={headerConfig.showTitle}
      showSubtitle={headerConfig.showSubtitle}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      showBadge={headerConfig.showBadge}
    />
  );
}

const productGridSnapshotAdapter: SnapshotAdapter<ProductGridSnapshotState> = {
  normalizeState: (rawConfig) => ({
    categoryTabIds: Array.isArray(rawConfig.categoryTabIds) ? rawConfig.categoryTabIds.filter((id): id is string => typeof id === 'string') : [],
    demoProducts: Array.isArray(rawConfig.demoProducts) ? rawConfig.demoProducts as DemoProductItem[] : [],
    desktopColumns: normalizeProductGridColumns(rawConfig.desktopColumns),
    itemCount: typeof rawConfig.itemCount === 'number' ? rawConfig.itemCount : DEFAULT_PRODUCT_GRID_CONFIG.itemCount,
    productSearchTerm: '',
    sectionTitle: typeof rawConfig.subtitle === 'string' ? rawConfig.subtitle : DEFAULT_PRODUCT_GRID_CONFIG.sectionTitle,
    selectedProductIds: Array.isArray(rawConfig.selectedProductIds) ? rawConfig.selectedProductIds.filter((id): id is string => typeof id === 'string') : [],
    selectionMode: rawConfig.selectionMode === 'manual' || rawConfig.selectionMode === 'demo' ? rawConfig.selectionMode : DEFAULT_PRODUCT_GRID_CONFIG.selectionMode,
    sortBy: rawConfig.sortBy === 'bestseller' || rawConfig.sortBy === 'random' ? rawConfig.sortBy : DEFAULT_PRODUCT_GRID_CONFIG.sortBy,
    style: resolveGridStyle(typeof rawConfig.style === 'string' ? rawConfig.style : undefined),
    subTitle: typeof rawConfig.badgeText === 'string' ? rawConfig.badgeText : DEFAULT_PRODUCT_GRID_CONFIG.subTitle,
  }),
  toConfig: (state, headerConfig) => ({
    ...headerConfig,
    badgeText: state.subTitle,
    categoryTabIds: state.categoryTabIds,
    demoProducts: state.selectionMode === 'demo' ? state.demoProducts : undefined,
    desktopColumns: state.desktopColumns,
    itemCount: state.itemCount,
    selectedProductIds: state.selectionMode === 'manual' ? state.selectedProductIds : [],
    selectionMode: state.selectionMode,
    showCategoryTabs: true,
    sortBy: state.sortBy,
    style: state.style,
    subtitle: state.sectionTitle,
  }),
  renderForm: (state, setState) => (
    <ProductGridSnapshotForm state={state} setState={setState} />
  ),
  renderPreview: (state, setState, title, headerConfig, colors, fontStyle, fontClassName) => (
    <ProductGridSnapshotPreview
      colors={colors}
      fontClassName={fontClassName}
      fontStyle={fontStyle}
      headerConfig={headerConfig}
      setState={setState}
      state={state}
      title={title}
    />
  ),
};

const normalizePartnerItems = (items: unknown): PartnerItem[] => {
  const source = Array.isArray(items) ? items : [{ link: '', name: '', url: '' }];
  return source.map((item, index) => {
    const partner = item as Partial<PartnerItem>;
    return {
      id: partner.id ?? `partner-${index}`,
      link: partner.link ?? '',
      name: partner.name ?? '',
      url: partner.url ?? '',
    };
  });
};

const partnersSnapshotAdapter: SnapshotAdapter<PartnersSnapshotState> = {
  normalizeState: (rawConfig) => ({
    cornerRadius: normalizePartnersCornerRadius(rawConfig.cornerRadius ?? DEFAULT_PARTNERS_CORNER_RADIUS),
    displayMode: normalizePartnersDisplayMode(rawConfig.displayMode),
    items: normalizePartnerItems(rawConfig.items),
    logoColorIntensity: normalizePartnersLogoColorIntensity(rawConfig.logoColorIntensity, rawConfig.logoColorMode),
    logoColorMode: getPartnersLogoColorModeFromIntensity(normalizePartnersLogoColorIntensity(rawConfig.logoColorIntensity, normalizePartnersLogoColorMode(rawConfig.logoColorMode))),
    logoSize: normalizePartnersLogoSize(rawConfig.logoSize ?? DEFAULT_PARTNERS_LOGO_SIZE),
    showBorder: normalizePartnersShowBorder(rawConfig.showBorder ?? DEFAULT_PARTNERS_SHOW_BORDER),
    spacing: normalizePartnersSpacing(rawConfig.spacing ?? DEFAULT_PARTNERS_SPACING),
    style: normalizePartnersStyle(rawConfig.style),
  }),
  toConfig: (state, headerConfig) => ({
    ...headerConfig,
    cornerRadius: state.cornerRadius,
    displayMode: state.displayMode,
    items: state.items.map((item) => ({
      link: item.link ?? '',
      name: item.name ?? '',
      url: item.url ?? '',
    })),
    logoColorIntensity: state.logoColorIntensity,
    logoColorMode: state.logoColorMode,
    logoSize: state.logoSize,
    showBorder: state.showBorder,
    spacing: state.spacing,
    style: state.style,
  }),
  renderForm: (state, setState) => (
    <PartnersForm
      items={state.items}
      setItems={(items) => setState((current) => ({ ...current, items }))}
      cornerRadius={state.cornerRadius}
      setCornerRadius={(cornerRadius) => setState((current) => ({ ...current, cornerRadius }))}
      logoSize={state.logoSize}
      setLogoSize={(logoSize) => setState((current) => ({ ...current, logoSize }))}
      showBorder={state.showBorder}
      setShowBorder={(showBorder) => setState((current) => ({ ...current, showBorder }))}
      spacing={state.spacing}
      setSpacing={(spacing) => setState((current) => ({ ...current, spacing }))}
      selectedStyle={state.style}
      logoColorIntensity={state.logoColorIntensity}
      setLogoColorIntensity={(logoColorIntensity) => setState((current) => ({ ...current, logoColorIntensity, logoColorMode: getPartnersLogoColorModeFromIntensity(logoColorIntensity) }))}
      logoColorMode={state.logoColorMode}
      setLogoColorMode={(logoColorMode) => setState((current) => ({ ...current, logoColorMode, logoColorIntensity: normalizePartnersLogoColorIntensity(current.logoColorIntensity, logoColorMode) }))}
    />
  ),
  renderPreview: (state, setState, title, headerConfig, colors, fontStyle, fontClassName) => (
    <PartnersPreview
      items={state.items}
      brandColor={colors.primary}
      secondary={colors.secondary}
      mode={colors.mode}
      selectedStyle={state.style}
      onStyleChange={(style) => setState((current) => ({ ...current, style }))}
      title={title}
      subheading={headerConfig.subtitle}
      align={headerConfig.headerAlign}
      displayMode={state.displayMode}
      cornerRadius={state.cornerRadius}
      logoSize={state.logoSize}
      showBorder={state.showBorder}
      spacing={state.spacing}
      logoColorIntensity={state.logoColorIntensity}
      logoColorMode={state.logoColorMode}
      onDisplayModeChange={(displayMode) => setState((current) => ({ ...current, displayMode }))}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
      hideHeader={headerConfig.hideHeader}
      showTitle={headerConfig.showTitle}
      showSubtitle={headerConfig.showSubtitle}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      showBadge={headerConfig.showBadge}
      badgeText={headerConfig.badgeText}
    />
  ),
};

export function SnapshotRouterMain(props: any) {
  const type = props.component?.type;

  if (type === 'Stats') {
    return <GenericSnapshotEditor {...props} adapter={statsSnapshotAdapter} />;
  }

  if (type === 'ProductCategories') {
    return <GenericSnapshotEditor {...props} adapter={productCategoriesSnapshotAdapter} />;
  }

  if (type === 'Blog') {
    return <GenericSnapshotEditor {...props} adapter={blogSnapshotAdapter} />;
  }

  if (type === 'ProductGrid') {
    return <GenericSnapshotEditor {...props} adapter={productGridSnapshotAdapter} />;
  }

  if (type === 'Partners') {
    return <GenericSnapshotEditor {...props} adapter={partnersSnapshotAdapter} />;
  }
  
  if (['About', 'CTA', 'Features', 'Career', 'Benefits', 'Clients'].includes(type)) {
    return <SnapshotRouter {...props} />;
  }
  
  if (['FAQ', 'Video', 'Team', 'Testimonials', 'Hero'].includes(type)) {
    return <SnapshotRouter2 {...props} />;
  }
  
  if (['Services', 'Countdown', 'VoucherPromotions', 'Process'].includes(type)) {
    return <SnapshotRouter3 {...props} />;
  }
  
  // Fallback cho Contact, Pricing, Banner (chưa migrate riêng lẻ xong)
  return (
    <HomeComponentLegacyEditor
      backHref={`/admin/home-components/snapshots/${props.snapshotId}/home-components`}
      snapshotComponent={{
        _id: props.component.componentKey,
        active: props.component.active,
        config: props.component.config as Record<string, any>,
        title: props.component.title,
        type: props.component.type,
      }}
      onSnapshotSave={async (next: any) => {
        await saveSnapshotComponent({
          active: next.active,
          component: props.component,
          config: next.config,
          decodedKey: props.decodedKey,
          label: props.snapshotLabel,
          payload: props.payload,
          snapshotId: props.snapshotId,
          title: next.title,
          updateSnapshot: props.updateSnapshot,
        });
        
        props.onCancel();
      }}
    />
  );
}
