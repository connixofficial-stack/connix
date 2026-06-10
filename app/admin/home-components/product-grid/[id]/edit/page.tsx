'use client';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { getHomeComponentPriceLabel, resolveSaleMode } from '../../../_shared/lib/productPrice';
import { ProductGridForm } from '../../_components/ProductGridForm';
import type { ProductGridProductItem, CategoryTabItem } from '../../_components/ProductGridForm';
import { ProductGridPreview } from '../../_components/ProductGridPreview';
import { DEFAULT_PRODUCT_GRID_CONFIG } from '../../_lib/constants';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import type { ProductGridStyle, ProductGridSelectionMode } from '../../_types';
import { normalizeProductListCardRadius, type DemoProductItem, type ProductListCardRadius, type ProductListPreviewItem } from '../../../product-list/_types';

const COMPONENT_TYPE = 'ProductGrid';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type ProductGridEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function ProductGridEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: ProductGridEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const productsData = useQuery(api.products.listAll, { limit: 100 });
  const resolvedProductsData = useQuery(api.products.listPublicResolved, { limit: 100 });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const updateMutation = useMutation(api.homeComponents.update);
  const saleMode = useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);
  const categoriesData = useQuery(api.productCategories.listActive);
  const categoryProductCountsMap = useQuery(api.products.countActiveByCategory);

  const allCategories: CategoryTabItem[] | undefined = useMemo(() => {
    if (!categoriesData) return undefined;
    return categoriesData.map(c => ({ _id: c._id, name: c.name, image: c.image, active: c.active }));
  }, [categoriesData]);

  const resolvedProductMap = useMemo(() => new Map(
    (resolvedProductsData ?? []).map((product) => [product._id, product])
  ), [resolvedProductsData]);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const [itemCount, setItemCount] = useState(DEFAULT_PRODUCT_GRID_CONFIG.itemCount);
  const [desktopRows, setDesktopRows] = useState(2);
  const [sortBy, setSortBy] = useState(DEFAULT_PRODUCT_GRID_CONFIG.sortBy);
  const [selectionMode, setSelectionMode] = useState<ProductGridSelectionMode>(DEFAULT_PRODUCT_GRID_CONFIG.selectionMode);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(DEFAULT_PRODUCT_GRID_CONFIG.selectedProductIds);
  const [demoProducts, setDemoProducts] = useState<DemoProductItem[]>([]);
  const [subTitle, setSubTitle] = useState(DEFAULT_PRODUCT_GRID_CONFIG.subTitle);
  const [sectionTitle, setSectionTitle] = useState(DEFAULT_PRODUCT_GRID_CONFIG.sectionTitle);
  const [style, setStyle] = useState<ProductGridStyle>(DEFAULT_PRODUCT_GRID_CONFIG.style);

  // Category tabs state
  const [categoryTabIds, setCategoryTabIds] = useState<string[]>([]);
  // Desktop columns
  const [desktopColumns, setDesktopColumns] = useState<3 | 4 | 5 | 6>(4);

  // Cart buttons settings
  const [showAddToCartButton, setShowAddToCartButton] = useState(true);
  const [showBuyNowButton, setShowBuyNowButton] = useState(true);
  const [cartButtonsLayout, setCartButtonsLayout] = useState<'stack' | 'grid-2'>('stack');

  // Header config state
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitleHeader, setShowTitleHeader] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [cardRadius, setCardRadius] = useState<ProductListCardRadius>(normalizeProductListCardRadius(DEFAULT_PRODUCT_GRID_CONFIG.cardRadius));
  const [productSearchTerm, setProductSearchTerm] = useState('');

  useEffect(() => {
    if (!component || isInitialized) {return;}
    if (!snapshotComponent && component.type !== 'ProductGrid') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const config = component.config ?? {};
    const nextItemCount = config.itemCount ?? DEFAULT_PRODUCT_GRID_CONFIG.itemCount;
    const nextColumns = (config.desktopColumns === 3 || config.desktopColumns === 5 || config.desktopColumns === 6) ? config.desktopColumns : 4;
    const nextDesktopRows = config.desktopRows ?? (config.itemCount ? Math.ceil(config.itemCount / nextColumns) : 2);
    const nextSortBy = config.sortBy ?? DEFAULT_PRODUCT_GRID_CONFIG.sortBy;
    const nextSelectionMode = config.selectionMode ?? DEFAULT_PRODUCT_GRID_CONFIG.selectionMode;
    const nextSelectedProductIds = config.selectedProductIds ?? [];
    const nextSubTitle = config.badgeText ?? DEFAULT_PRODUCT_GRID_CONFIG.subTitle;
    const nextSectionTitle = config.subtitle ?? DEFAULT_PRODUCT_GRID_CONFIG.sectionTitle;
    const nextStyle = (config.style as ProductGridStyle) ?? DEFAULT_PRODUCT_GRID_CONFIG.style;

    setItemCount(nextItemCount);
    setDesktopRows(nextDesktopRows);
    setSortBy(nextSortBy);
    setSelectionMode(nextSelectionMode);
    setSelectedProductIds(nextSelectedProductIds);
    setDemoProducts(Array.isArray(config.demoProducts) ? (config.demoProducts as DemoProductItem[]) : []);
    setSubTitle(nextSubTitle);
    setSectionTitle(nextSectionTitle);
    setStyle(nextStyle);

    // Header config
    setHideHeader(config.hideHeader === true);
    setShowTitleHeader(config.showTitle !== false);
    setShowSubtitle(config.showSubtitle !== false);
    setHeaderAlign((config.headerAlign as 'left' | 'center' | 'right') ?? 'left');
    setTitleColorPrimary(config.titleColorPrimary === true);
    setSubtitleAboveTitle(config.subtitleAboveTitle === true);
    setUppercaseText(config.uppercaseText === true);
    setShowBadge(config.showBadge !== false);
    const nextSpacing = config.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(config.spacing);
    setSpacing(nextSpacing);
    const nextCardRadius = normalizeProductListCardRadius(config.cornerRadius ?? config.cardRadius, config.noBorderRadius);
    setCardRadius(nextCardRadius);

    // Category tabs
    setCategoryTabIds(Array.isArray(config.categoryTabIds) ? (config.categoryTabIds as string[]) : []);
    setDesktopColumns(nextColumns);

    const nextShowAddToCartButton = config.showAddToCartButton !== false;
    const nextShowBuyNowButton = config.showBuyNowButton !== false;
    const nextCartButtonsLayout = config.cartButtonsLayout ?? 'stack';

    setShowAddToCartButton(nextShowAddToCartButton);
    setShowBuyNowButton(nextShowBuyNowButton);
    setCartButtonsLayout(nextCartButtonsLayout);

    setInitialSnapshot(JSON.stringify({
      title: component.title,
      active: component.active,
      itemCount: nextItemCount,
      desktopRows: nextDesktopRows,
      sortBy: nextSortBy,
      selectionMode: nextSelectionMode,
      selectedProductIds: nextSelectionMode === 'manual' ? nextSelectedProductIds : [],
      demoProducts: nextSelectionMode === 'demo' ? (Array.isArray(config.demoProducts) ? config.demoProducts : []) : [],
      style: nextStyle,
      badgeText: nextSubTitle,
      subtitle: nextSectionTitle,
      categoryTabIds: Array.isArray(config.categoryTabIds) ? config.categoryTabIds : [],
      hideHeader: config.hideHeader === true,
      showTitle: config.showTitle !== false,
      showSubtitle: config.showSubtitle !== false,
      headerAlign: (config.headerAlign as string) ?? 'left',
      titleColorPrimary: config.titleColorPrimary === true,
      subtitleAboveTitle: config.subtitleAboveTitle === true,
      uppercaseText: config.uppercaseText === true,
      showBadge: config.showBadge !== false,
      spacing: nextSpacing,
      noVerticalMargin: nextSpacing === 'none',
      cornerRadius: nextCardRadius,
      cardRadius: nextCardRadius,
      noBorderRadius: nextCardRadius === 'none',
      desktopColumns: nextColumns,
      showAddToCartButton: nextShowAddToCartButton,
      showBuyNowButton: nextShowBuyNowButton,
      cartButtonsLayout: nextCartButtonsLayout,
    }));
    setIsInitialized(true);
  }, [component, id, isInitialized, router, snapshotComponent]);

  const allActiveProducts = useMemo<ProductGridProductItem[]>(() => {
    if (!productsData) return [];
    return productsData
      .filter(p => p.status === 'Active')
      .map(p => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        image: p.image,
        price: p.price,
        salePrice: p.salePrice,
        hasVariants: p.hasVariants,
        categoryId: p.categoryId,
        stock: p.stock,
      }));
  }, [productsData]);

  const filteredProducts = useMemo<ProductGridProductItem[]>(() => {
    if (!productsData) {return [];}
    return productsData
      .filter(product => product.status === 'Active')
      .filter(product => !productSearchTerm || product.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
      .map(product => ({
        _id: product._id,
        image: product.image,
        name: product.name,
        slug: product.slug,
        price: product.price,
        salePrice: product.salePrice,
        hasVariants: product.hasVariants,
        categoryId: product.categoryId,
        stock: product.stock,
      }));
  }, [productsData, productSearchTerm]);

  const selectedProducts = useMemo<ProductGridProductItem[]>(() => {
    if (!productsData || selectedProductIds.length === 0) {return [];}
    const productMap = new Map(productsData.map(product => [product._id, product]));
    return selectedProductIds
      .map(idValue => productMap.get(idValue as Id<'products'>))
      .filter((product): product is NonNullable<typeof product> => product !== undefined)
      .map(product => ({
        _id: product._id,
        image: product.image,
        name: product.name,
        slug: product.slug,
        price: product.price,
        salePrice: product.salePrice,
        hasVariants: product.hasVariants,
        categoryId: product.categoryId,
        stock: product.stock,
      }));
  }, [productsData, selectedProductIds]);

  const effectiveItemCount = useMemo(() => {
    if (selectionMode === 'category' || selectionMode === 'auto') {
      return desktopColumns * desktopRows;
    }
    return selectionMode === 'demo' ? demoProducts.length : (selectionMode === 'manual' ? selectedProductIds.length : itemCount);
  }, [selectionMode, desktopColumns, desktopRows, demoProducts.length, selectedProductIds.length, itemCount]);

  const previewItems: ProductListPreviewItem[] = useMemo(() => {
    if (selectionMode === 'demo' && demoProducts.length > 0) {
      return demoProducts.map(d => ({
        id: d.id,
        name: d.name,
        image: d.image ?? undefined,
        price: d.price,
        originalPrice: d.originalPrice,
        category: d.category,
      }));
    }

    const source = selectionMode === 'manual' ? selectedProducts : allActiveProducts;
    if (!source || source.length === 0) return [];

    return source.map((p) => {
      const resolvedProduct = resolvedProductMap.get(p._id as Id<'products'>);
      const priceValue = resolvedProduct?.price ?? p.price ?? undefined;
      const salePriceValue = resolvedProduct?.salePrice ?? undefined;
      const priceDisplay = getHomeComponentPriceLabel({
        saleMode,
        price: priceValue,
        salePrice: salePriceValue,
        isRangeFromVariant: resolvedProduct?.hasVariants ?? p.hasVariants,
      });
      const hasBasePrice = priceValue != null || salePriceValue != null;
      return {
        description: p.name,
        categoryId: p.categoryId,
        hasVariants: resolvedProduct?.hasVariants ?? p.hasVariants,
        id: p._id,
        image: p.image ?? undefined,
        name: p.name,
        price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
        priceValue,
        originalPrice: priceDisplay.comparePrice
          ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
          : undefined,
        salePriceValue,
        category: p.categoryId ? (allCategories?.find(c => c._id === p.categoryId)?.name ?? '') : undefined,
        slug: p.slug,
        stock: p.stock ?? undefined,
      };
    });
  }, [selectionMode, demoProducts, selectedProducts, allActiveProducts, resolvedProductMap, saleMode, allCategories]);

  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);

  const currentSnapshot = JSON.stringify({
    title,
    active,
    itemCount: effectiveItemCount,
    desktopRows,
    sortBy,
    selectionMode,
    selectedProductIds: selectionMode === 'manual' ? selectedProductIds : [],
    demoProducts: selectionMode === 'demo' ? demoProducts : [],
    style,
    badgeText: subTitle,
    subtitle: sectionTitle,
    categoryTabIds,
    hideHeader,
    showTitle: showTitleHeader,
    showSubtitle,
    headerAlign,
    titleColorPrimary,
    subtitleAboveTitle,
    uppercaseText,
    showBadge,
    spacing,
    noVerticalMargin: spacing === 'none',
    cornerRadius: cardRadius,
    cardRadius,
    noBorderRadius: cardRadius === 'none',
    desktopColumns,
    showAddToCartButton,
    showBuyNowButton,
    cartButtonsLayout,
  });
  const customChanged = enableTypeOverrides && showCustomBlock
    ? customState.enabled !== initialCustom.enabled
      || customState.mode !== initialCustom.mode
      || customState.primary !== initialCustom.primary
      || resolvedCustomSecondary !== initialCustom.secondary
    : false;
  const customFontChanged = enableTypeOverrides && showFontCustomBlock
    ? customFontState.enabled !== initialFontCustom.enabled
      || customFontState.fontKey !== initialFontCustom.fontKey
    : false;
  const hasChanges = initialSnapshot !== null && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const savedSelectedProductIds = selectionMode === 'manual' ? selectedProductIds : [];
      const nextConfig = {
          itemCount: effectiveItemCount,
          desktopRows,
          selectedProductIds: savedSelectedProductIds,
          demoProducts: selectionMode === 'demo' ? demoProducts : undefined,
          selectionMode,
          sortBy,
          style,
          hideHeader,
          showTitle: showTitleHeader,
          showSubtitle,
          subtitle: sectionTitle,
          headerAlign,
          titleColorPrimary,
          subtitleAboveTitle,
          uppercaseText,
          showBadge,
          badgeText: subTitle,
          spacing,
          noVerticalMargin: spacing === 'none',
          cornerRadius: cardRadius,
          cardRadius,
          noBorderRadius: cardRadius === 'none',
          // Category tabs
          showCategoryTabs: true,
          categoryTabIds,
          desktopColumns,
          // Cart button settings
          showAddToCartButton,
          showBuyNowButton,
          cartButtonsLayout,
        };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig, title });
      } else {
        await updateMutation({
          active,
          config: nextConfig,
          id: id as Id<'homeComponents'>,
          title,
        });
      }
      if (enableTypeOverrides && showCustomBlock) {
        await setTypeColorOverride({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
          type: COMPONENT_TYPE,
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        await setTypeFontOverride({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
          type: COMPONENT_TYPE,
        });
      }
      toast.success('Đã cập nhật Catalog sản phẩm');
      setInitialSnapshot(JSON.stringify({
        title,
        active,
        itemCount: effectiveItemCount,
        desktopRows,
        sortBy,
        selectionMode,
        selectedProductIds: savedSelectedProductIds,
        demoProducts: selectionMode === 'demo' ? demoProducts : [],
        style,
        badgeText: subTitle,
        subtitle: sectionTitle,
        categoryTabIds,
        hideHeader,
        showTitle: showTitleHeader,
        showSubtitle,
        headerAlign,
        titleColorPrimary,
        subtitleAboveTitle,
        uppercaseText,
        showBadge,
        spacing,
        noVerticalMargin: spacing === 'none',
        cornerRadius: cardRadius,
        cardRadius,
        noBorderRadius: cardRadius === 'none',
        desktopColumns,
        showAddToCartButton: showAddToCartButton,
        showBuyNowButton: showBuyNowButton,
        cartButtonsLayout,
      }));
      if (enableTypeOverrides && showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (component === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy component</div>;
  }

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Catalog sản phẩm</h1>
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        {snapshotLabel ? <p className="text-sm text-slate-500">Snapshot: {snapshotLabel}</p> : null}
      </div>

      <form onSubmit={handleSubmit}>
        <HeaderConfigSection
          hideHeader={hideHeader}
          title={title}
          showTitle={showTitleHeader}
          subtitle={sectionTitle}
          showSubtitle={showSubtitle}
          headerAlign={headerAlign}
          titleColorPrimary={titleColorPrimary}
          subtitleAboveTitle={subtitleAboveTitle}
          uppercaseText={uppercaseText}
          showBadge={showBadge}
          badgeText={subTitle}
          onHideHeaderChange={setHideHeader}
          onTitleChange={setTitle}
          onShowTitleChange={setShowTitleHeader}
          onSubtitleChange={setSectionTitle}
          onShowSubtitleChange={setShowSubtitle}
          onHeaderAlignChange={setHeaderAlign}
          onTitleColorPrimaryChange={setTitleColorPrimary}
          onSubtitleAboveTitleChange={setSubtitleAboveTitle}
          onUppercaseTextChange={setUppercaseText}
          onShowBadgeChange={setShowBadge}
          onBadgeTextChange={setSubTitle}
          expanded={headerOpenSections.header}
          onExpandedChange={(open) => toggleHeaderSection('header', open)}
          titleLabel="Tiêu đề section"
          titlePlaceholder="VD: Sản phẩm nổi bật, Bán chạy nhất..."
          className="mb-3"
        />

        <ProductGridForm
          itemCount={itemCount}
          setItemCount={setItemCount}
          desktopRows={desktopRows}
          setDesktopRows={setDesktopRows}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          selectedProductIds={selectedProductIds}
          setSelectedProductIds={setSelectedProductIds}
          productSearchTerm={productSearchTerm}
          setProductSearchTerm={setProductSearchTerm}
          selectedProducts={selectedProducts}
          filteredProducts={filteredProducts}
          allActiveProducts={allActiveProducts}
          isLoading={productsData === undefined}
          demoProducts={demoProducts}
          setDemoProducts={setDemoProducts}
          categoryTabIds={categoryTabIds}
          setCategoryTabIds={setCategoryTabIds}
          allCategories={allCategories}
          categoryProductCountsMap={categoryProductCountsMap}
          desktopColumns={desktopColumns}
          onDesktopColumnsChange={setDesktopColumns}
          spacing={spacing}
          setSpacing={setSpacing}
          cardRadius={cardRadius}
          setCardRadius={setCardRadius}
          defaultExpanded={false}
          showAddToCartButton={showAddToCartButton}
          setShowAddToCartButton={setShowAddToCartButton}
          showBuyNowButton={showBuyNowButton}
          setShowBuyNowButton={setShowBuyNowButton}
          cartButtonsLayout={cartButtonsLayout}
          setCartButtonsLayout={setCartButtonsLayout}
          className="mb-3"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Catalog"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={resolvedCustomSecondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => {
                  if (next === 'single') {
                    setCustomState((prev) => ({ ...prev, mode: 'single', secondary: prev.primary }));
                    return;
                  }
                  setCustomState((prev) => ({
                    ...prev,
                    mode: 'dual',
                    secondary: prev.mode === 'single' ? getSuggestedSecondary(prev.primary) : prev.secondary,
                  }));
                }}
                onPrimaryChange={(value) => setCustomState((prev) => ({
                  ...prev,
                  primary: value,
                  secondary: prev.mode === 'single' ? value : prev.secondary,
                }))}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {enableTypeOverrides && showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Catalog"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ProductGridPreview
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              itemCount={effectiveItemCount}
              desktopRows={desktopRows}
              selectedStyle={style}
              onStyleChange={setStyle}
              items={previewItems}
              subTitle={subTitle}
              sectionTitle={title}
              subtitle={sectionTitle}
              fontStyle={fontStyle}
              fontClassName="font-active"
              desktopColumns={desktopColumns}
              categoryTabs={
                selectionMode === 'demo'
                  ? [...new Set(demoProducts.map(d => d.category).filter(Boolean))].slice(0, 5).map(name => ({ _id: name, name, active: true } as import('../../_components/ProductGridForm').CategoryTabItem))
                  : allCategories
                    ? (categoryTabIds.length > 0
                        ? categoryTabIds.map(cId => allCategories.find(c => c._id === cId)).filter(Boolean) as import('../../_components/ProductGridForm').CategoryTabItem[]
                        : allCategories.filter(c => c.active))
                    : undefined
              }
              hideHeader={hideHeader}
              showTitle={showTitleHeader}
              showSubtitle={showSubtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={showBadge}
              spacing={spacing}
              cornerRadius={cardRadius}
              showAddToCartButton={showAddToCartButton}
              showBuyNowButton={showBuyNowButton}
              cartButtonsLayout={cartButtonsLayout}
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() =>{  router.push(backHref); }}
          submitLabel="Lưu thay đổi"
        active={active}
        onActiveChange={setActive}
        />
      </form>
    </div>
  );
}
