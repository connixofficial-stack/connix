'use client';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { getHomeComponentPriceLabel, resolveSaleMode } from '../../../_shared/lib/productPrice';
import { ProductListForm } from '../../_components/ProductListForm';
import { ProductListPreview } from '../../_components/ProductListPreview';
import { DEFAULT_PRODUCT_LIST_CONFIG, DEFAULT_PRODUCT_LIST_TEXT, normalizeProductListStyle } from '../../_lib/constants';
import { DEFAULT_PRODUCT_LIST_CARD_RADIUS, DEFAULT_PRODUCT_LIST_DESKTOP_COLUMNS, normalizeProductListCardRadius, normalizeProductListDesktopColumns, type DemoProductItem, type ProductListCardRadius, type ProductListConfig, type ProductListDesktopColumns, type ProductListStyle, type ProductSelectionMode } from '../../_types';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../../_shared/components/FormSectionsToggleAllButton';

import { Label } from '../../../../components/ui';

const COMPONENT_TYPE = 'ProductList';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type ProductListEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function ProductListEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: ProductListEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [productListConfig, setProductListConfig] = useState<ProductListConfig>(DEFAULT_PRODUCT_LIST_CONFIG);
  const [productListStyle, setProductListStyle] = useState<ProductListStyle>('commerce');
  const [productSelectionMode, setProductSelectionMode] = useState<ProductSelectionMode>('auto');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [demoProducts, setDemoProducts] = useState<DemoProductItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  // Header config state (shared pattern)
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitleHeader, setShowTitleHeader] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [headerSubtitle, setHeaderSubtitle] = useState('');
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [cardRadius, setCardRadius] = useState<ProductListCardRadius>(DEFAULT_PRODUCT_LIST_CARD_RADIUS);
  const [desktopColumns, setDesktopColumns] = useState<ProductListDesktopColumns>(DEFAULT_PRODUCT_LIST_DESKTOP_COLUMNS);
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['header', 'display', 'products'],
    false
  );

  const productsData = useQuery(api.products.listAll, { limit: 100 });
  const resolvedProductsData = useQuery(api.products.listPublicResolved, { limit: 100 });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const saleMode = useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);

  const resolvedProductMap = useMemo(() => new Map(
    (resolvedProductsData ?? []).map((product) => [product._id, product])
  ), [resolvedProductsData]);

  const filteredProducts = useMemo(() => {
    if (!productsData) {return [];}
    return productsData
      .filter(product => product.status === 'Active')
      .filter(product =>
        !productSearchTerm ||
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
  }, [productsData, productSearchTerm]);

  const selectedProducts = useMemo(() => {
    if (!productsData || selectedProductIds.length === 0) {return [];}
    const productMap = new Map(productsData.map(p => [p._id, p]));
    return selectedProductIds
      .map((productId) => productMap.get(productId as Id<'products'>))
      .filter((product): product is NonNullable<typeof product> => product !== undefined);
  }, [productsData, selectedProductIds]);

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'ProductList') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      const normalizedSpacing = config.noVerticalMargin === true
        ? 'none'
        : normalizeSectionSpacing(config.spacing);
      const normalizedCornerRadius = normalizeProductListCardRadius(config.cornerRadius ?? config.cardRadius, config.noBorderRadius);
      setProductListConfig({
        cardRadius: normalizedCornerRadius,
        desktopColumns: normalizeProductListDesktopColumns(config.desktopColumns ?? config.lookbookDesktopColumns),
        itemCount: config.itemCount ?? DEFAULT_PRODUCT_LIST_CONFIG.itemCount,
        lookbookDesktopColumns: normalizeProductListDesktopColumns(config.desktopColumns ?? config.lookbookDesktopColumns),
        sortBy: config.sortBy ?? DEFAULT_PRODUCT_LIST_CONFIG.sortBy,
        showAddToCartButton: config.showAddToCartButton ?? true,
        showBuyNowButton: config.showBuyNowButton ?? true,
        cartButtonsLayout: config.cartButtonsLayout ?? 'stack',
      });
      setProductListStyle(normalizeProductListStyle(config.style));
      setProductSelectionMode((config.selectionMode as ProductSelectionMode) || 'auto');
      setSelectedProductIds((config.selectedProductIds as string[]) ?? []);
      setDemoProducts((config.demoProducts as DemoProductItem[]) ?? []);

      // Load header config
      const headerConfig = extractSectionHeaderConfig(config);
      setHideHeader(headerConfig.hideHeader ?? false);
      setShowTitleHeader(headerConfig.showTitle ?? true);
      setShowSubtitle(headerConfig.showSubtitle ?? true);
      setHeaderSubtitle(headerConfig.subtitle ?? DEFAULT_PRODUCT_LIST_TEXT.sectionTitle);
      setHeaderAlign(headerConfig.headerAlign ?? 'left');
      setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
      setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
      setUppercaseText(headerConfig.uppercaseText ?? false);
      setShowBadge(headerConfig.showBadge ?? true);
      setBadgeText(headerConfig.badgeText ?? DEFAULT_PRODUCT_LIST_TEXT.subTitle);
      setSpacing(normalizedSpacing);
      setCardRadius(normalizedCornerRadius);
      setDesktopColumns(normalizeProductListDesktopColumns(config.desktopColumns ?? config.lookbookDesktopColumns));
    }
  }, [component, id, router]);

  const toSnapshot = (payload: Record<string, unknown>) => JSON.stringify(payload);

  useEffect(() => {
    if (!component) {return;}
    const config = component.config ?? {};
    const initialSelectionMode = ((config.selectionMode as ProductSelectionMode) || 'auto');
    const headerConfig = extractSectionHeaderConfig(config);
    const normalizedSpacing = config.noVerticalMargin === true
      ? 'none'
      : normalizeSectionSpacing(config.spacing);
    const normalizedCornerRadius = normalizeProductListCardRadius(config.cornerRadius ?? config.cardRadius, config.noBorderRadius);

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      itemCount: (config.itemCount as number) ?? DEFAULT_PRODUCT_LIST_CONFIG.itemCount,
      desktopColumns: normalizeProductListDesktopColumns(config.desktopColumns ?? config.lookbookDesktopColumns),
      lookbookDesktopColumns: normalizeProductListDesktopColumns(config.desktopColumns ?? config.lookbookDesktopColumns),
      sortBy: (config.sortBy as string) ?? DEFAULT_PRODUCT_LIST_CONFIG.sortBy,
      style: normalizeProductListStyle(config.style),
      selectionMode: initialSelectionMode,
      selectedProductIds: initialSelectionMode === 'manual' ? ((config.selectedProductIds as string[]) ?? []) : [],
      demoProducts: initialSelectionMode === 'demo' ? ((config.demoProducts as DemoProductItem[]) ?? []) : [],
      // Header fields
      hideHeader: headerConfig.hideHeader,
      showTitle: headerConfig.showTitle,
      showSubtitle: headerConfig.showSubtitle,
      subtitle: headerConfig.subtitle ?? DEFAULT_PRODUCT_LIST_TEXT.sectionTitle,
      headerAlign: headerConfig.headerAlign,
      titleColorPrimary: headerConfig.titleColorPrimary,
      subtitleAboveTitle: headerConfig.subtitleAboveTitle,
      uppercaseText: headerConfig.uppercaseText,
      showBadge: headerConfig.showBadge,
      badgeText: headerConfig.badgeText ?? DEFAULT_PRODUCT_LIST_TEXT.subTitle,
      spacing: normalizedSpacing,
      cornerRadius: normalizedCornerRadius,
      showAddToCartButton: config.showAddToCartButton ?? true,
      showBuyNowButton: config.showBuyNowButton ?? true,
      cartButtonsLayout: config.cartButtonsLayout ?? 'stack',
    }));
  }, [component]);

  const currentSnapshot = toSnapshot({
    title,
    active,
    itemCount: productListConfig.itemCount,
    desktopColumns,
    lookbookDesktopColumns: desktopColumns,
    sortBy: productListConfig.sortBy,
    style: productListStyle,
    selectionMode: productSelectionMode,
    selectedProductIds: productSelectionMode === 'manual' ? selectedProductIds : [],
    demoProducts: productSelectionMode === 'demo' ? demoProducts : [],
    // Header fields
    hideHeader,
    showTitle: showTitleHeader,
    showSubtitle,
    subtitle: headerSubtitle,
    headerAlign,
    titleColorPrimary,
    subtitleAboveTitle,
    uppercaseText,
    showBadge,
    badgeText,
    spacing,
    cornerRadius: cardRadius,
    showAddToCartButton: productListConfig.showAddToCartButton ?? true,
    showBuyNowButton: productListConfig.showBuyNowButton ?? true,
    cartButtonsLayout: productListConfig.cartButtonsLayout ?? 'stack',
  });

  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
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
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig = {
        ...productListConfig,
        selectionMode: productSelectionMode,
        selectedProductIds: productSelectionMode === 'manual' ? selectedProductIds : [],
        demoProducts: productSelectionMode === 'demo' ? demoProducts : [],
        style: productListStyle,
        desktopColumns,
        lookbookDesktopColumns: desktopColumns,
        hideHeader,
        showTitle: showTitleHeader,
        showSubtitle,
        subtitle: headerSubtitle,
        headerAlign,
        titleColorPrimary,
        subtitleAboveTitle,
        uppercaseText,
        showBadge,
        badgeText,
        spacing,
        cornerRadius: cardRadius,
        cardRadius,
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

      setInitialSnapshot(toSnapshot({
        title,
        active,
        itemCount: nextConfig.itemCount,
        desktopColumns,
        lookbookDesktopColumns: desktopColumns,
        sortBy: nextConfig.sortBy,
        style: nextConfig.style,
        selectionMode: nextConfig.selectionMode,
        selectedProductIds: nextConfig.selectedProductIds,
        demoProducts: nextConfig.demoProducts ?? [],
        hideHeader,
        showTitle: showTitleHeader,
        showSubtitle,
        subtitle: headerSubtitle,
        headerAlign,
        titleColorPrimary,
        subtitleAboveTitle,
        uppercaseText,
        showBadge,
        badgeText,
        spacing,
        cornerRadius: cardRadius,
        showAddToCartButton: nextConfig.showAddToCartButton,
        showBuyNowButton: nextConfig.showBuyNowButton,
        cartButtonsLayout: nextConfig.cartButtonsLayout,
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

      toast.success('Đã cập nhật danh sách sản phẩm');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Danh sách Sản phẩm</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>


      <form onSubmit={handleSubmit}>
        <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />
        <HeaderConfigSection
          hideHeader={hideHeader}
          title={title}
          showTitle={showTitleHeader}
          subtitle={headerSubtitle}
          showSubtitle={showSubtitle}
          headerAlign={headerAlign}
          titleColorPrimary={titleColorPrimary}
          subtitleAboveTitle={subtitleAboveTitle}
          uppercaseText={uppercaseText}
          showBadge={showBadge}
          badgeText={badgeText}
          onHideHeaderChange={setHideHeader}
          onTitleChange={setTitle}
          onShowTitleChange={setShowTitleHeader}
          onSubtitleChange={setHeaderSubtitle}
          onShowSubtitleChange={setShowSubtitle}
          onHeaderAlignChange={setHeaderAlign}
          onTitleColorPrimaryChange={setTitleColorPrimary}
          onSubtitleAboveTitleChange={setSubtitleAboveTitle}
          onUppercaseTextChange={setUppercaseText}
          onShowBadgeChange={setShowBadge}
          onBadgeTextChange={setBadgeText}
          expanded={openSections.header}
          onExpandedChange={(v) => toggleSection('header', v)}
          className="mb-3"
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <div className="mb-3">
          <HomeComponentDisplaySettingsSection
            open={openSections.display}
            onOpenChange={(v) => toggleSection('display', v)}
            cornerRadius={cardRadius}
            onCornerRadiusChange={(value) => setCardRadius(value as ProductListCardRadius)}
            spacing={spacing}
            onSpacingChange={setSpacing}
          >
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">Số cột desktop</label>
                <div className="grid grid-cols-2 gap-2">
                  {[3, 4].map((option) => {
                    const selected = desktopColumns === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDesktopColumns(option as ProductListDesktopColumns)}
                        className={`h-9 rounded-md border text-xs transition-colors ${selected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        {option} cột
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500">
                  Ảnh hưởng layout Commerce, Compact và Lookbook. 4 cột: tablet/mobile 2 cột. 3 cột: tablet 3 cột, mobile 1 cột.
                </p>
              </div>

              {saleMode === 'cart' && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Hiển thị nút Thêm vào giỏ</Label>
                      <p className="text-xs text-slate-500">Cho phép khách hàng thêm nhanh sản phẩm vào giỏ</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={productListConfig.showAddToCartButton ?? true}
                      onChange={(e) => setProductListConfig({ ...productListConfig, showAddToCartButton: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Hiển thị nút Mua ngay</Label>
                      <p className="text-xs text-slate-500">Khách hàng có thể nhấn mua và đi thẳng tới trang checkout</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={productListConfig.showBuyNowButton ?? true}
                      onChange={(e) => setProductListConfig({ ...productListConfig, showBuyNowButton: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  {(productListConfig.showAddToCartButton ?? true) && (productListConfig.showBuyNowButton ?? true) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Bố cục nút hiển thị</Label>
                      <select
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                        value={productListConfig.cartButtonsLayout ?? 'stack'}
                        onChange={(e) => setProductListConfig({ ...productListConfig, cartButtonsLayout: e.target.value as 'stack' | 'grid-2' })}
                      >
                        <option value="stack">Xếp dọc (Stack)</option>
                        <option value="grid-2">Xếp ngang (Grid 2)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
          </HomeComponentDisplaySettingsSection>
        </div>

        <ProductListForm
          productSelectionMode={productSelectionMode}
          setProductSelectionMode={setProductSelectionMode}
          productListConfig={productListConfig}
          setProductListConfig={setProductListConfig}
          filteredProducts={filteredProducts}
          selectedProducts={selectedProducts}
          selectedProductIds={selectedProductIds}
          setSelectedProductIds={setSelectedProductIds}
          productSearchTerm={productSearchTerm}
          setProductSearchTerm={setProductSearchTerm}
          demoProducts={demoProducts}
          setDemoProducts={setDemoProducts}
          isLoading={productsData === undefined}
          defaultExpanded={false}
          className="mb-4"
          openSections={openSections}
          onToggleSection={toggleSection}
          showToggleAll={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Danh sách sản phẩm"
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
                onPrimaryChange={(value) => {
                  setCustomState((prev) => ({
                    ...prev,
                    primary: value,
                    secondary: prev.mode === 'single' ? value : prev.secondary,
                  }));
                }}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {enableTypeOverrides && showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Sản phẩm"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ProductListPreview
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              itemCount={productSelectionMode === 'demo' ? demoProducts.length : (productSelectionMode === 'manual' ? selectedProductIds.length : productListConfig.itemCount)}
              componentType="ProductList"
              selectedStyle={productListStyle}
              onStyleChange={setProductListStyle}
              items={productSelectionMode === 'demo' && demoProducts.length > 0
                ? demoProducts.map((item) => ({
                  id: item.id,
                  name: item.name,
                  image: item.image,
                  price: item.price,
                  originalPrice: item.originalPrice,
                  category: item.category,
                  tag: (item.tag || undefined) as 'new' | 'hot' | 'sale' | undefined,
                }))
                : productSelectionMode === 'manual' && selectedProducts.length > 0
                  ? selectedProducts.map((product) => ({
                    categoryId: product.categoryId,
                    description: product.description,
                    id: product._id,
                    image: product.image,
                    name: product.name,
                    slug: product.slug,
                    stock: product.stock,
                    ...(() => {
                      const resolvedProduct = resolvedProductMap.get(product._id as Id<'products'>) ?? product;
                      const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: resolvedProduct.price, salePrice: resolvedProduct.salePrice, isRangeFromVariant: resolvedProduct.hasVariants });
                      const hasBasePrice = resolvedProduct.price != null || resolvedProduct.salePrice != null;
                      return {
                        hasVariants: resolvedProduct.hasVariants,
                        price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
                        priceValue: resolvedProduct.price,
                        originalPrice: priceDisplay.comparePrice
                          ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
                          : undefined,
                        salePriceValue: resolvedProduct.salePrice,
                      };
                    })(),
                  }))
                  : filteredProducts.slice(0, productListConfig.itemCount).map((product) => ({
                    categoryId: product.categoryId,
                    description: product.description,
                    id: product._id,
                    image: product.image,
                    name: product.name,
                    slug: product.slug,
                    stock: product.stock,
                    ...(() => {
                      const resolvedProduct = resolvedProductMap.get(product._id as Id<'products'>) ?? product;
                      const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: resolvedProduct.price, salePrice: resolvedProduct.salePrice, isRangeFromVariant: resolvedProduct.hasVariants });
                      const hasBasePrice = resolvedProduct.price != null || resolvedProduct.salePrice != null;
                      return {
                        hasVariants: resolvedProduct.hasVariants,
                        price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
                        priceValue: resolvedProduct.price,
                        originalPrice: priceDisplay.comparePrice
                          ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
                          : undefined,
                        salePriceValue: resolvedProduct.salePrice,
                      };
                    })(),
                  }))
              }
              subTitle={badgeText}
              sectionTitle={title}
              subtitle={headerSubtitle}
              fontStyle={fontStyle}
              fontClassName="font-active"
              hideHeader={hideHeader}
              showTitle={showTitleHeader}
              showSubtitle={showSubtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={showBadge}
              spacing={spacing}
              cardRadius={cardRadius}
              desktopColumns={desktopColumns}
              lookbookDesktopColumns={desktopColumns}
              showAddToCartButton={productListConfig.showAddToCartButton ?? true}
              showBuyNowButton={productListConfig.showBuyNowButton ?? true}
              cartButtonsLayout={productListConfig.cartButtonsLayout ?? 'stack'}
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
