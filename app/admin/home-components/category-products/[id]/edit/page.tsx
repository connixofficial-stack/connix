'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Label } from '../../../../components/ui';
import { CopyableInput } from '../../../../components/CopyTextButton';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { CategoryProductsForm } from '../../_components/CategoryProductsForm';
import { CategoryProductsPreview } from '../../_components/CategoryProductsPreview';
import { DEFAULT_CATEGORY_PRODUCTS_CONFIG, DEFAULT_DEMO_CATEGORY_PRODUCTS_SECTIONS } from '../../_lib/constants';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  getCategoryProductsValidationResult,
  normalizeCategoryProductsHarmony,
} from '../../_lib/colors';
import type {
  CategoryProductsBrandMode,
  CategoryProductsCornerRadius,
  CategoryProductsSection,
  CategoryProductsSelectionMode,
  CategoryProductsStyle,
  DemoCategoryProductsSection,
} from '../../_types';
import {
  getCategoryProductsResponsiveColumns,
  normalizeCategoryProductsCornerRadius,
  normalizeCategoryProductsDesktopColumns,
} from '../../_types';
import { resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';

const COMPONENT_TYPE = 'CategoryProducts';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type CategoryProductsEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function CategoryProductsEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: CategoryProductsEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const brandMode: CategoryProductsBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);
  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const {
    state: sections,
    set: setSections,
    undo: undosections,
    redo: redosections,
    canUndo: canUndosections,
    canRedo: canRedosections,
    reset: resetsections,
  } = useUndoRedo<CategoryProductsSection[]>([], { maxHistory: 15 });
  const [selectionMode, setSelectionMode] = useState<CategoryProductsSelectionMode>('real');
  const [demoSections, setDemoSections] = useState<DemoCategoryProductsSection[]>(DEFAULT_DEMO_CATEGORY_PRODUCTS_SECTIONS);
  const [style, setStyle] = useState<CategoryProductsStyle>('grid');
  const [showViewAll, setShowViewAll] = useState(true);
  const [columnsDesktop, setColumnsDesktop] = useState<3 | 4>(4);
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [cornerRadius, setCornerRadius] = useState<CategoryProductsCornerRadius>(normalizeCategoryProductsCornerRadius(DEFAULT_CATEGORY_PRODUCTS_CONFIG.cornerRadius));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Cart buttons settings
  const [showAddToCartButton, setShowAddToCartButton] = useState(true);
  const [showBuyNowButton, setShowBuyNowButton] = useState(true);
  const [cartButtonsLayout, setCartButtonsLayout] = useState<'stack' | 'grid-2'>('stack');
  const columnsMobile = getCategoryProductsResponsiveColumns(columnsDesktop).mobile;
  const productImageCropAspectRatio = style === 'wine-grid' ? 'square' : resolveProductImageAspectRatio(aspectRatioSetting?.value);

  const categoriesData = useQuery(api.productCategories.listActiveCategoriesWithProductCounts);

  const categoryIdsForQuery = useMemo(() => {
    return sections.map(s => s.categoryId).filter(Boolean) as Id<"productCategories">[];
  }, [sections]);

  const productsData = useQuery(
    api.products.listProductsForCategories,
    categoryIdsForQuery.length > 0 ? { categoryIds: categoryIdsForQuery } : 'skip'
  );

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'CategoryProducts') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? DEFAULT_CATEGORY_PRODUCTS_CONFIG;
      const loadedSections = config.sections?.map((s: { categoryId: string; itemCount: number }, i: number) => ({
        categoryId: s.categoryId,
        id: i,
        itemCount: s.itemCount || 4,
      })) ?? [];
      const loadedStyle = (config.style as CategoryProductsStyle) || 'grid';
      const loadedShowViewAll = config.showViewAll ?? true;
      const loadedColumnsDesktop = normalizeCategoryProductsDesktopColumns(config.columnsDesktop);
      const loadedColumnsMobile = getCategoryProductsResponsiveColumns(loadedColumnsDesktop).mobile;
      const loadedSelectionMode = (config.selectionMode as CategoryProductsSelectionMode | undefined) ?? 'real';
      const loadedDemoSections = (config.demoSections as DemoCategoryProductsSection[] | undefined) ?? DEFAULT_DEMO_CATEGORY_PRODUCTS_SECTIONS;
      const loadedSpacing = normalizeSectionSpacing(config.spacing);
      const loadedCornerRadius = normalizeCategoryProductsCornerRadius(config.cornerRadius);
      const loadedShowAddToCartButton = config.showAddToCartButton !== false;
      const loadedShowBuyNowButton = config.showBuyNowButton !== false;
      const loadedCartButtonsLayout = config.cartButtonsLayout ?? 'stack';

      resetsections(loadedSections);
      setSelectionMode(loadedSelectionMode);
      setDemoSections(loadedDemoSections);
      setStyle(loadedStyle);
      setShowViewAll(loadedShowViewAll);
      setColumnsDesktop(loadedColumnsDesktop);
      setSpacing(loadedSpacing);
      setCornerRadius(loadedCornerRadius);
      setShowAddToCartButton(loadedShowAddToCartButton);
      setShowBuyNowButton(loadedShowBuyNowButton);
      setCartButtonsLayout(loadedCartButtonsLayout);

      setInitialSnapshot(JSON.stringify({
        title: component.title,
        active: component.active,
        demoSections: loadedDemoSections,
        sections: loadedSections,
        selectionMode: loadedSelectionMode,
        style: loadedStyle,
        showViewAll: loadedShowViewAll,
        columnsDesktop: loadedColumnsDesktop,
        columnsMobile: loadedColumnsMobile,
        spacing: loadedSpacing,
        cornerRadius: loadedCornerRadius,
        type: component.type,
        showAddToCartButton: loadedShowAddToCartButton,
        showBuyNowButton: loadedShowBuyNowButton,
        cartButtonsLayout: loadedCartButtonsLayout,
      }));
      setHasChanges(false);
    }
  }, [component, id, router]);

  useEffect(() => {
    if (!component || !initialSnapshot) {return;}

    const snapshot = JSON.stringify({
      title,
      active,
      demoSections,
      sections,
      selectionMode,
      style,
      showViewAll,
      columnsDesktop,
      columnsMobile,
      spacing,
      cornerRadius,
      type: component.type,
      showAddToCartButton,
      showBuyNowButton,
      cartButtonsLayout,
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
    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [
    title,
    active,
    demoSections,
    sections,
    selectionMode,
    style,
    showViewAll,
    columnsDesktop,
    columnsMobile,
    spacing,
    cornerRadius,
    component,
    initialSnapshot,
    customState,
    initialCustom,
    showCustomBlock,
    customFontState,
    initialFontCustom,
    showFontCustomBlock,
    showAddToCartButton,
    showBuyNowButton,
    cartButtonsLayout,
  ]);

  useEffect(() => {
    if (!component || component.type !== 'CategoryProducts') {return;}
    const harmony = normalizeCategoryProductsHarmony((component.config as { harmony?: string } | undefined)?.harmony);
    getCategoryProductsValidationResult({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: brandMode,
      harmony,
    });
  }, [component, effectiveColors.primary, effectiveColors.secondary, brandMode]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    const harmony = normalizeCategoryProductsHarmony((component?.config as { harmony?: string } | undefined)?.harmony);
    getCategoryProductsValidationResult({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: brandMode,
      harmony,
    });
    setIsSubmitting(true);
    try {
      const nextConfig = {
        columnsDesktop,
        columnsMobile,
        spacing,
        cornerRadius,
        demoSections: selectionMode === 'demo' ? demoSections : undefined,
        sections: sections.map(s => ({ categoryId: s.categoryId, itemCount: s.itemCount })),
        selectionMode,
        showViewAll,
        style,
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
        const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
        await setTypeColorOverride({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
          type: COMPONENT_TYPE,
        });
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        await setTypeFontOverride({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
          type: COMPONENT_TYPE,
        });
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
      toast.success('Đã cập nhật Sản phẩm theo danh mục');
      setInitialSnapshot(JSON.stringify({
        title,
        active,
        demoSections,
        sections,
        selectionMode,
        style,
        showViewAll,
        columnsDesktop,
        columnsMobile,
        spacing,
        cornerRadius,
        type: component?.type,
        showAddToCartButton,
        showBuyNowButton,
        cartButtonsLayout,
      }));
      setHasChanges(false);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Sản phẩm theo danh mục</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={20} />
              Sản phẩm theo danh mục
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={title}
                onChange={(e) =>{  setTitle(e.target.value); }}
                copyLabel="tiêu đề hiển thị"
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>
</CardContent>
        </Card>

        <CategoryProductsForm
          sections={sections}
          setSections={setSections}
          columnsDesktop={columnsDesktop}
          setColumnsDesktop={setColumnsDesktop}
          showViewAll={showViewAll}
          setShowViewAll={setShowViewAll}
          categoriesData={categoriesData ?? []}
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          demoSections={demoSections}
          setDemoSections={setDemoSections}
          spacing={spacing}
          setSpacing={setSpacing}
          cornerRadius={cornerRadius}
          setCornerRadius={setCornerRadius}
          productImageCropAspectRatio={productImageCropAspectRatio}
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
                title="Màu custom cho Sản phẩm theo danh mục"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => setCustomState((prev) => {
                  if (next === prev.mode) {return prev;}
                  if (next === 'single') {
                    return {
                      ...prev,
                      mode: 'single',
                      secondary: prev.primary,
                    };
                  }
                  return {
                    ...prev,
                    mode: 'dual',
                    secondary: prev.mode === 'single' ? getSuggestedSecondary(prev.primary) : prev.secondary,
                  };
                })}
                onPrimaryChange={(value) => setCustomState((prev) => (
                  prev.mode === 'single'
                    ? { ...prev, primary: value, secondary: value }
                    : { ...prev, primary: value }
                ))}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {enableTypeOverrides && showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Sản phẩm theo danh mục"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
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
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={brandMode}
              selectedStyle={style}
              onStyleChange={setStyle}
              categoriesData={categoriesData ?? []}
              productsData={productsData ?? []}
              fontStyle={fontStyle}
              fontClassName="font-active"
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
        
        undoRedo={{
          canUndo: canUndosections,
          canRedo: canRedosections,
          onUndo: undosections,
          onRedo: redosections,
        }}
        />
      </form>
    </div>
  );
}
