'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ProductCategoriesForm } from '../../_components/ProductCategoriesForm';
import { ProductCategoriesPreview } from '../../_components/ProductCategoriesPreview';
import { sanitizeDemoCategories } from '../../_lib/imageSrc';
import { useProductCategoriesAutoGenerate } from '../../_lib/useProductCategoriesAutoGenerate';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  DEFAULT_PRODUCT_CATEGORIES_SPACING,
  DEFAULT_PRODUCT_CATEGORIES_CORNER_RADIUS,
  normalizeProductCategoriesCornerRadius,
  normalizeProductCategoriesSpacing,
  type CategoryConfigItem,
  type DemoProductCategoryItem,
  type ProductCategoriesAlign,
  type ProductCategoriesBrandMode,
  type ProductCategoriesCornerRadius,
  type ProductCategoriesSelectionMode,
  type ProductCategoriesSpacing,
  type ProductCategoriesStyle,
  type ProductCategoriesDesktopColumns,
  DEFAULT_PRODUCT_CATEGORIES_DESKTOP_COLUMNS,
  normalizeProductCategoriesDesktopColumns,
} from '../../_types';

const COMPONENT_TYPE = 'ProductCategories';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type ProductCategoriesEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function ProductCategoriesEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: ProductCategoriesEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const brandMode: ProductCategoriesBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<"homeComponents"> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);
  const productCategoriesData = useQuery(api.productCategories.listActive);
  const {
    isAutoGenerateLoading,
    isAutoGenerateReady,
    generateFromRealData,
  } = useProductCategoriesAutoGenerate();

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<{
    title: string;
    active: boolean;
    categories: CategoryConfigItem[];
    style: ProductCategoriesStyle;
    showProductCount: boolean;
    subheading: string;
    align: ProductCategoriesAlign;
    hideHeader: boolean;
    showTitle: boolean;
    showSubtitle: boolean;
    titleColorPrimary: boolean;
    subtitleAboveTitle: boolean;
    uppercaseText: boolean;
    showBadge: boolean;
    badgeText: string;
    selectionMode: ProductCategoriesSelectionMode;
    demoCategories: DemoProductCategoryItem[];
    spacing: ProductCategoriesSpacing;
    cornerRadius: ProductCategoriesCornerRadius;
    desktopColumns: ProductCategoriesDesktopColumns;
  } | null>(null);

  const {
    state: productCategoriesItems,
    set: setProductCategoriesItems,
    undo: undoproductCategoriesItems,
    redo: redoproductCategoriesItems,
    canUndo: canUndoproductCategoriesItems,
    canRedo: canRedoproductCategoriesItems,
    reset: resetproductCategoriesItems,
  } = useUndoRedo<CategoryConfigItem[]>([], { maxHistory: 15 });
  const [productCategoriesStyle, setProductCategoriesStyle] = useState<ProductCategoriesStyle>('image-strip');
  const [productCategoriesShowCount, setProductCategoriesShowCount] = useState(true);
  const [productCategoriesSubheading, setProductCategoriesSubheading] = useState('');
  const [productCategoriesAlign, setProductCategoriesAlign] = useState<ProductCategoriesAlign>('center');
  const [expandedSections, setExpandedSections] = useState({ header: false });
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [selectionMode, setSelectionMode] = useState<ProductCategoriesSelectionMode>('real');
  const [demoCategories, setDemoCategories] = useState<DemoProductCategoryItem[]>([]);
  const [spacing, setSpacing] = useState<ProductCategoriesSpacing>(DEFAULT_PRODUCT_CATEGORIES_SPACING);
  const [cornerRadius, setCornerRadius] = useState<ProductCategoriesCornerRadius>(DEFAULT_PRODUCT_CATEGORIES_CORNER_RADIUS);
  const [desktopColumns, setDesktopColumns] = useState<ProductCategoriesDesktopColumns>(DEFAULT_PRODUCT_CATEGORIES_DESKTOP_COLUMNS);

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'ProductCategories') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      const categories = config.categories?.map((c: { categoryId: string; customImage?: string; imageMode?: string; storageId?: string | null }, i: number) => ({
        categoryId: c.categoryId,
        customImage: c.customImage ?? '',
        id: i,
        imageMode: (c.imageMode as 'product-image' | 'default' | 'icon' | 'upload' | 'url') || 'default',
        storageId: c.storageId ?? null,
      })) ?? [];
      const style = (config.style as ProductCategoriesStyle) || 'image-strip';
      const showProductCount = config.showProductCount ?? true;
      const headerConfig = extractSectionHeaderConfig({
        ...config,
        subtitle: typeof config.subtitle === 'string' ? config.subtitle : typeof config.subheading === 'string' ? config.subheading : '',
        headerAlign: config.headerAlign ?? config.align,
      });
      const subheading = headerConfig.subtitle ?? '';
      const align = (headerConfig.headerAlign as ProductCategoriesAlign) ?? 'center';
      const loadedSelectionMode = (config.selectionMode as ProductCategoriesSelectionMode) || 'real';
      const loadedDemoCategories = Array.isArray(config.demoCategories) ? sanitizeDemoCategories(config.demoCategories as DemoProductCategoryItem[]) : [];
      const loadedSpacing = normalizeProductCategoriesSpacing(config.spacing, config.noVerticalMargin);
      const loadedCornerRadius = normalizeProductCategoriesCornerRadius(config.cornerRadius, config.noBorderRadius);
      const loadedDesktopColumns = normalizeProductCategoriesDesktopColumns(config.desktopColumns);

      resetproductCategoriesItems(categories);
      setProductCategoriesStyle(style);
      setProductCategoriesShowCount(showProductCount);
      setProductCategoriesSubheading(subheading);
      setProductCategoriesAlign(align);
      setHideHeader(headerConfig.hideHeader ?? false);
      setShowTitle(headerConfig.showTitle ?? true);
      setShowSubtitle(headerConfig.showSubtitle ?? true);
      setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
      setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
      setUppercaseText(headerConfig.uppercaseText ?? false);
      setShowBadge(headerConfig.showBadge ?? true);
      setBadgeText(headerConfig.badgeText ?? '');
      setSelectionMode(loadedSelectionMode);
      setDemoCategories(loadedDemoCategories);
      setSpacing(loadedSpacing);
      setCornerRadius(loadedCornerRadius);
      setDesktopColumns(loadedDesktopColumns);
      setInitialData({
        title: component.title,
        active: component.active,
        categories,
        style,
        showProductCount,
        subheading,
        align,
        hideHeader: headerConfig.hideHeader ?? false,
        showTitle: headerConfig.showTitle ?? true,
        showSubtitle: headerConfig.showSubtitle ?? true,
        titleColorPrimary: headerConfig.titleColorPrimary ?? false,
        subtitleAboveTitle: headerConfig.subtitleAboveTitle ?? false,
        uppercaseText: headerConfig.uppercaseText ?? false,
        showBadge: headerConfig.showBadge ?? true,
        badgeText: headerConfig.badgeText ?? '',
        selectionMode: loadedSelectionMode,
        demoCategories: loadedDemoCategories,
        spacing: loadedSpacing,
        cornerRadius: loadedCornerRadius,
        desktopColumns: loadedDesktopColumns,
      });
      setHasChanges(false);
    }
  }, [component, id, router, snapshotComponent]);

  useEffect(() => {
    if (!initialData) {return;}

    const currentCategories = JSON.stringify(productCategoriesItems);
    const initialCategories = JSON.stringify(initialData.categories);
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
    const changed = title !== initialData.title
      || active !== initialData.active
      || currentCategories !== initialCategories
      || productCategoriesStyle !== initialData.style
      || productCategoriesShowCount !== initialData.showProductCount
      || productCategoriesSubheading !== initialData.subheading
      || productCategoriesAlign !== initialData.align
      || hideHeader !== initialData.hideHeader
      || showTitle !== initialData.showTitle
      || showSubtitle !== initialData.showSubtitle
      || titleColorPrimary !== initialData.titleColorPrimary
      || subtitleAboveTitle !== initialData.subtitleAboveTitle
      || uppercaseText !== initialData.uppercaseText
      || showBadge !== initialData.showBadge
      || badgeText !== initialData.badgeText
      || selectionMode !== initialData.selectionMode
      || JSON.stringify(demoCategories) !== JSON.stringify(initialData.demoCategories)
      || spacing !== initialData.spacing
      || cornerRadius !== initialData.cornerRadius
      || desktopColumns !== initialData.desktopColumns
      || customChanged
      || customFontChanged;

    setHasChanges(changed);
  }, [
    title,
    active,
    productCategoriesItems,
    productCategoriesStyle,
    productCategoriesShowCount,
    productCategoriesSubheading,
    productCategoriesAlign,
    hideHeader,
    showTitle,
    showSubtitle,
    titleColorPrimary,
    subtitleAboveTitle,
    uppercaseText,
    showBadge,
    badgeText,
    selectionMode,
    demoCategories,
    spacing,
    cornerRadius,
    initialData,
    customState,
    initialCustom,
    showCustomBlock,
    customFontState,
    initialFontCustom,
    showFontCustomBlock,
    enableTypeOverrides,
  ]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const sanitizedDemoCategories = sanitizeDemoCategories(demoCategories);
      const sanitizedSubtitle = productCategoriesSubheading.trim();
      const sanitizedBadgeText = badgeText.trim();

      const nextConfig = {
          selectionMode,
          categories: selectionMode === 'real' ? productCategoriesItems.map(c => ({
            categoryId: c.categoryId,
            customImage: c.customImage || undefined,
            imageMode: c.imageMode ?? 'default',
            storageId: c.storageId ?? null,
          })) : [],
          demoCategories: selectionMode === 'demo' ? sanitizedDemoCategories : [],
          showProductCount: productCategoriesShowCount,
          style: productCategoriesStyle,
          hideHeader,
          showTitle,
          subtitle: sanitizedSubtitle,
          showSubtitle,
          headerAlign: productCategoriesAlign,
          titleColorPrimary,
          subtitleAboveTitle,
          uppercaseText,
          showBadge,
          badgeText: sanitizedBadgeText,
          subheading: sanitizedSubtitle,
          align: productCategoriesAlign,
          spacing,
          cornerRadius,
          desktopColumns,
        };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig, title });
      } else {
        await updateMutation({
          active,
          config: nextConfig,
          id: id as Id<"homeComponents">,
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
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        await setTypeFontOverride({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
          type: COMPONENT_TYPE,
        });
      }
      toast.success('Đã cập nhật danh mục sản phẩm');
      setInitialData({
        title,
        active,
        categories: productCategoriesItems,
        style: productCategoriesStyle,
        showProductCount: productCategoriesShowCount,
        subheading: sanitizedSubtitle,
        align: productCategoriesAlign,
        hideHeader,
        showTitle,
        showSubtitle,
        titleColorPrimary,
        subtitleAboveTitle,
        uppercaseText,
        showBadge,
        badgeText: sanitizedBadgeText,
        selectionMode,
        demoCategories: sanitizedDemoCategories,
        spacing,
        cornerRadius,
        desktopColumns,
      });
      setDemoCategories(sanitizedDemoCategories);
      setProductCategoriesSubheading(sanitizedSubtitle);
      setBadgeText(sanitizedBadgeText);
      if (enableTypeOverrides && showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary),
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
      setHasChanges(false);
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoGenerate = () => {
    const result = generateFromRealData();
    if (result.status === 'success') {
      setProductCategoriesItems(result.items);
    }
  };

  const handleAutoGenerateAllActive = () => {
    const items = (productCategoriesData ?? []).map((cat, index) => ({
      id: index + 1,
      categoryId: cat._id,
      customImage: cat.image || '',
      imageMode: cat.image ? ('upload' as const) : ('default' as const),
    }));
    setProductCategoriesItems(items);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Danh mục sản phẩm</h1>
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        {snapshotLabel ? <p className="text-sm text-slate-500">Snapshot: {snapshotLabel}</p> : null}
      </div>

      <form onSubmit={handleSubmit}>
        <HeaderConfigSection
          hideHeader={hideHeader}
          title={title}
          showTitle={showTitle}
          subtitle={productCategoriesSubheading}
          showSubtitle={showSubtitle}
          headerAlign={productCategoriesAlign}
          titleColorPrimary={titleColorPrimary}
          subtitleAboveTitle={subtitleAboveTitle}
          uppercaseText={uppercaseText}
          showBadge={showBadge}
          badgeText={badgeText}
          onHideHeaderChange={setHideHeader}
          onTitleChange={setTitle}
          onShowTitleChange={setShowTitle}
          onSubtitleChange={setProductCategoriesSubheading}
          onShowSubtitleChange={setShowSubtitle}
          onHeaderAlignChange={setProductCategoriesAlign}
          onTitleColorPrimaryChange={setTitleColorPrimary}
          onSubtitleAboveTitleChange={setSubtitleAboveTitle}
          onUppercaseTextChange={setUppercaseText}
          onShowBadgeChange={setShowBadge}
          onBadgeTextChange={setBadgeText}
          expanded={expandedSections.header}
          onExpandedChange={(value) => setExpandedSections({ header: value })}
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <ProductCategoriesForm
          productCategoriesItems={productCategoriesItems}
          setProductCategoriesItems={setProductCategoriesItems}
          productCategoriesShowCount={productCategoriesShowCount}
          setProductCategoriesShowCount={setProductCategoriesShowCount}
          onAutoGenerate={handleAutoGenerate}
          onAutoGenerateAllActive={handleAutoGenerateAllActive}
          autoGenerateReady={isAutoGenerateReady}
          autoGenerateLoading={isAutoGenerateLoading}
          productCategoriesData={productCategoriesData ?? []}
          brandColor={effectiveColors.primary}
          selectionMode={selectionMode}
          onSelectionModeChange={setSelectionMode}
          demoCategories={demoCategories}
          setDemoCategories={setDemoCategories}
          productCategoriesStyle={productCategoriesStyle}
          spacing={spacing}
          setSpacing={setSpacing}
          cornerRadius={cornerRadius}
          setCornerRadius={setCornerRadius}
          desktopColumns={desktopColumns}
          setDesktopColumns={setDesktopColumns}
          defaultExpanded={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Danh mục sản phẩm"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => setCustomState((prev) => {
                  if (next === 'single') {
                    return { ...prev, mode: next, secondary: prev.primary };
                  }
                  if (prev.mode === 'single') {
                    return { ...prev, mode: next, secondary: getSuggestedSecondary(prev.primary) };
                  }
                  return { ...prev, mode: next };
                })}
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
                title="Font custom cho Danh mục"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ProductCategoriesPreview
              config={{
              categories: productCategoriesItems,
              showProductCount: productCategoriesShowCount,
              style: productCategoriesStyle,
              hideHeader,
              showTitle,
              subtitle: productCategoriesSubheading,
              showSubtitle,
              headerAlign: productCategoriesAlign,
              titleColorPrimary,
              subtitleAboveTitle,
              uppercaseText,
              showBadge,
              badgeText,
              subheading: productCategoriesSubheading,
              align: productCategoriesAlign,
              spacing,
              cornerRadius,
              desktopColumns,
              }}
            title={title}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={brandMode}
              selectedStyle={productCategoriesStyle}
              onStyleChange={setProductCategoriesStyle}
              categoriesData={productCategoriesData ?? []}
              fontStyle={fontStyle}
              fontClassName="font-active"
              selectionMode={selectionMode}
              demoCategories={demoCategories}
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
          canUndo: canUndoproductCategoriesItems,
          canRedo: canRedoproductCategoriesItems,
          onUndo: undoproductCategoriesItems,
          onRedo: redoproductCategoriesItems,
        }}
        />
      </form>
    </div>
  );
}
