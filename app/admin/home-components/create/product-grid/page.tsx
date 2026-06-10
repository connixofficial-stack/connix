'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { getHomeComponentPriceLabel, resolveSaleMode } from '../../_shared/lib/productPrice';
import { DEFAULT_PRODUCT_LIST_CARD_RADIUS, type ProductListCardRadius, type ProductListPreviewItem, type DemoProductItem } from '../../product-list/_types';
import type { ProductGridProductItem, CategoryTabItem } from '../../product-grid/_components/ProductGridForm';
import { ProductGridForm } from '../../product-grid/_components/ProductGridForm';
import { ProductGridPreview } from '../../product-grid/_components/ProductGridPreview';
import type { ProductGridStyle, ProductGridSelectionMode } from '../../product-grid/_types';

function ProductGridCreateContent() {
  const COMPONENT_TYPE = 'ProductGrid';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Catalog sản phẩm', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [itemCount, setItemCount] = useState(8);
  const [desktopRows, setDesktopRows] = useState(2);
  const [sortBy, setSortBy] = useState<'newest' | 'bestseller' | 'random'>('newest');
  const [selectionMode, setSelectionMode] = useState<ProductGridSelectionMode>('category');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [demoProducts, setDemoProducts] = useState<DemoProductItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [subTitle, setSubTitle] = useState('Bộ sưu tập');
  const [sectionTitle, setSectionTitle] = useState('Sản phẩm nổi bật');
  const [style, setStyle] = useState<ProductGridStyle>('commerce');

  // Category tabs state
  const [categoryTabIds, setCategoryTabIds] = useState<string[]>([]);
  // Desktop columns
  const [desktopColumns, setDesktopColumns] = useState<3 | 4 | 5 | 6>(4);

  // Header config state
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitleHeader, setShowTitleHeader] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], true);
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [cardRadius, setCardRadius] = useState<ProductListCardRadius>(DEFAULT_PRODUCT_LIST_CARD_RADIUS);
  const [showAddToCartButton, setShowAddToCartButton] = useState(true);
  const [showBuyNowButton, setShowBuyNowButton] = useState(true);
  const [cartButtonsLayout, setCartButtonsLayout] = useState<'stack' | 'grid-2'>('stack');

  const productsData = useQuery(api.products.listAll, { limit: 100 });
  const resolvedProductsData = useQuery(api.products.listPublicResolved, { limit: 100 });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
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

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      itemCount: effectiveItemCount,
      desktopRows,
      selectedProductIds: selectionMode === 'manual' ? selectedProductIds : [],
      demoProducts: selectionMode === 'demo' ? demoProducts : undefined,
      selectionMode,
      sortBy,
      style,
      showCategoryTabs: true,
      categoryTabIds,
      desktopColumns,
      // Header config fields
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
      showAddToCartButton,
      showBuyNowButton,
      cartButtonsLayout,
    });
  };

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
    >
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
        showAddToCartButton={showAddToCartButton}
        setShowAddToCartButton={setShowAddToCartButton}
        showBuyNowButton={showBuyNowButton}
        setShowBuyNowButton={setShowBuyNowButton}
        cartButtonsLayout={cartButtonsLayout}
        setCartButtonsLayout={setCartButtonsLayout}
        className="mb-3"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
        <div />
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ProductGridPreview
            brandColor={primary}
            secondary={secondary}
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
                ? [...new Set(demoProducts.map(d => d.category).filter(Boolean))].slice(0, 5).map(name => ({ _id: name, name, active: true } as CategoryTabItem))
                : allCategories
                  ? (categoryTabIds.length > 0
                      ? categoryTabIds.map(id => allCategories.find(c => c._id === id)).filter(Boolean) as CategoryTabItem[]
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
    </ComponentFormWrapper>
  );
}

export default function ProductGridCreatePage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ProductGridCreateContent />
    </Suspense>
  );
}
