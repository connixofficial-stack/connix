'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { CategoryProductsForm } from '../../category-products/_components/CategoryProductsForm';
import { CategoryProductsPreview } from '../../category-products/_components/CategoryProductsPreview';
import { DEFAULT_DEMO_CATEGORY_PRODUCTS_SECTIONS } from '../../category-products/_lib/constants';
import type {
  CategoryProductsBrandMode,
  CategoryProductsCornerRadius,
  CategoryProductsSection,
  CategoryProductsSelectionMode,
  CategoryProductsStyle,
  DemoCategoryProductsSection,
} from '../../category-products/_types';
import { DEFAULT_CATEGORY_PRODUCTS_CORNER_RADIUS, getCategoryProductsResponsiveColumns } from '../../category-products/_types';
import { resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import type { Id } from '@/convex/_generated/dataModel';

export default function CategoryProductsCreatePage() {
  const COMPONENT_TYPE = 'CategoryProducts';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Sản phẩm theo danh mục', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const brandMode: CategoryProductsBrandMode = mode === 'single' ? 'single' : 'dual';
  
  const [sections, setSections] = useState<CategoryProductsSection[]>([]);
  const [selectionMode, setSelectionMode] = useState<CategoryProductsSelectionMode>('demo');
  const [demoSections, setDemoSections] = useState<DemoCategoryProductsSection[]>(DEFAULT_DEMO_CATEGORY_PRODUCTS_SECTIONS);
  const [style, setStyle] = useState<CategoryProductsStyle>('grid');
  const [showViewAll, setShowViewAll] = useState(true);
  const [columnsDesktop, setColumnsDesktop] = useState<3 | 4>(4);
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [cornerRadius, setCornerRadius] = useState<CategoryProductsCornerRadius>(DEFAULT_CATEGORY_PRODUCTS_CORNER_RADIUS);

  // Cart buttons settings
  const [showAddToCartButton, setShowAddToCartButton] = useState(true);
  const [showBuyNowButton, setShowBuyNowButton] = useState(true);
  const [cartButtonsLayout, setCartButtonsLayout] = useState<'stack' | 'grid-2'>('stack');

  const categoriesData = useQuery(api.productCategories.listActiveCategoriesWithProductCounts);
  
  const categoryIdsForQuery = useMemo(() => {
    return sections.map(s => s.categoryId).filter(Boolean) as Id<"productCategories">[];
  }, [sections]);

  const productsData = useQuery(
    api.products.listProductsForCategories,
    categoryIdsForQuery.length > 0 ? { categoryIds: categoryIdsForQuery } : 'skip'
  );
  
  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const columnsMobile = getCategoryProductsResponsiveColumns(columnsDesktop).mobile;
  const productImageCropAspectRatio = style === 'wine-grid' ? 'square' : resolveProductImageAspectRatio(aspectRatioSetting?.value);

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      columnsDesktop,
      columnsMobile,
      demoSections: selectionMode === 'demo' ? demoSections : undefined,
      sections: sections.map(s => ({
        categoryId: s.categoryId, 
        itemCount: s.itemCount,
      })),
      selectionMode,
      showViewAll,
      spacing,
      style,
      cornerRadius,
      showAddToCartButton,
      showBuyNowButton,
      cartButtonsLayout,
    });
  };

  const availableCategories = categoriesData ?? [];

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
      <CategoryProductsForm
        sections={sections}
        setSections={setSections}
        columnsDesktop={columnsDesktop}
        setColumnsDesktop={setColumnsDesktop}
        showViewAll={showViewAll}
        setShowViewAll={setShowViewAll}
        categoriesData={availableCategories}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        demoSections={demoSections}
        setDemoSections={setDemoSections}
        spacing={spacing}
        setSpacing={setSpacing}
        cornerRadius={cornerRadius}
        setCornerRadius={setCornerRadius}
        productImageCropAspectRatio={productImageCropAspectRatio}
        showAddToCartButton={showAddToCartButton}
        setShowAddToCartButton={setShowAddToCartButton}
        showBuyNowButton={showBuyNowButton}
        setShowBuyNowButton={setShowBuyNowButton}
        cartButtonsLayout={cartButtonsLayout}
        setCartButtonsLayout={setCartButtonsLayout}
        className="mb-3"
      />

      <CategoryProductsPreview
        config={{
          columnsDesktop,
          columnsMobile,
          demoSections,
          sections,
          selectionMode,
          showViewAll,
          spacing,
          style,
          cornerRadius,
          showAddToCartButton,
          showBuyNowButton,
          cartButtonsLayout,
        }}
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        categoriesData={availableCategories}
        productsData={productsData ?? []}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
