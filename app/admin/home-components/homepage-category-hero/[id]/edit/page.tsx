'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { LayoutTemplate, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Label } from '../../../../components/ui';
import { CopyTextButton } from '../../../../components/CopyTextButton';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { ClearableInput, HomepageCategoryHeroForm, type DemoCategoryDataItem } from '../../_components/HomepageCategoryHeroForm';
import { HomepageCategoryHeroPreview } from '../../_components/HomepageCategoryHeroPreview';
import { DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG, DEMO_HERO_SLIDES, DEMO_CATEGORY_ITEMS, DEMO_CATEGORIES_DATA, normalizeHomepageCategoryHeroCategories } from '../../_lib/constants';
import { useHomepageCategoryHeroAutoGenerate } from '../../_lib/useHomepageCategoryHeroAutoGenerate';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import type {
  HomepageCategoryHeroAutoGenerateConfig,
  HomepageCategoryHeroAutoGenerateMeta,
  HomepageCategoryHeroBrandMode,
  HomepageCategoryHeroCategoryItem,
  HomepageCategoryHeroConfig,
  HomepageCategoryHeroCornerRadius,
  HomepageCategoryHeroSelectionMode,
  HomepageCategoryHeroSlide,
} from '../../_types';
import { DEFAULT_HOMEPAGE_CATEGORY_HERO_CORNER_RADIUS, normalizeHomepageCategoryHeroCornerRadius } from '../../_types';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { normalizeSectionSpacing, type SectionSpacing } from '../../../_shared/types/sectionSpacing';

const COMPONENT_TYPE = 'HomepageCategoryHero';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type HomepageCategoryHeroEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function HomepageCategoryHeroEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: HomepageCategoryHeroEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const {
    autoGenerateConfig,
    setAutoGenerateConfig,
    autoGenerateMeta,
    setAutoGenerateMeta,
    categoriesData,
    isAutoGenerateLoading,
    isAutoGenerateReady,
    generateFromRealData,
  } = useHomepageCategoryHeroAutoGenerate();
  const updateMutation = useMutation(api.homeComponents.update);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);

  const { customState, effectiveColors, showCustomBlock, setCustomState, initialCustom, setInitialCustom } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState, initialCustom: initialFontCustom, setInitialCustom: setInitialFontCustom } = useTypeFontOverrideState(COMPONENT_TYPE);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [heading, setHeading] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heading);
  const [subheading, setSubheading] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.subheading);
  const [ctaText, setCtaText] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaText);
  const [ctaUrl, setCtaUrl] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaUrl);
  const [style, setStyle] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.style);
  const {
    state: heroSlides,
    set: setHeroSlides,
    undo: undoheroSlides,
    redo: redoheroSlides,
    canUndo: canUndoheroSlides,
    canRedo: canRedoheroSlides,
    reset: resetheroSlides,
  } = useUndoRedo<HomepageCategoryHeroSlide[]>(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heroSlides, { maxHistory: 15 });
  const [selectionMode, setSelectionMode] = useState<HomepageCategoryHeroSelectionMode>(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.selectionMode);
  const [categoryItems, setCategoryItems] = useState<HomepageCategoryHeroCategoryItem[]>(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categories);
  const [hideEmptyCategories, setHideEmptyCategories] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.hideEmptyCategories);
  const [showCategoryImage, setShowCategoryImage] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.showCategoryImage);
  const [categoryVisualMode, setCategoryVisualMode] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryVisualMode);
  const [categoryImageSize, setCategoryImageSize] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageSize);
  const [categoryImageShape, setCategoryImageShape] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageShape);
  const [maxCategoriesDesktop, setMaxCategoriesDesktop] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesDesktop);
  const [maxCategoriesTablet, setMaxCategoriesTablet] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesTablet);
  const [maxCategoriesMobile, setMaxCategoriesMobile] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesMobile);
  const [attachToHeader, setAttachToHeader] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.attachToHeader);
  const [tabletBehavior, setTabletBehavior] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.tabletBehavior);
  const [cornerRadius, setCornerRadius] = useState<HomepageCategoryHeroCornerRadius>(DEFAULT_HOMEPAGE_CATEGORY_HERO_CORNER_RADIUS);
  const [noVerticalMargin, setNoVerticalMargin] = useState(false);
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.spacing ?? 'normal');
  const [bannerImageFit, setBannerImageFit] = useState<'cover' | 'contain'>('cover');
  const [demoCategoriesData, setDemoCategoriesData] = useState<DemoCategoryDataItem[]>(DEMO_CATEGORIES_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<{
    title: string;
    active: boolean;
    heading: string;
    subheading: string;
    ctaText: string;
    ctaUrl: string;
    style: HomepageCategoryHeroConfig['style'];
    heroSlides: HomepageCategoryHeroSlide[];
    selectionMode: HomepageCategoryHeroSelectionMode;
    categories: HomepageCategoryHeroCategoryItem[];
    hideEmptyCategories: boolean;
    showCategoryImage: boolean;
    categoryVisualMode: HomepageCategoryHeroConfig['categoryVisualMode'];
    categoryImageSize: HomepageCategoryHeroConfig['categoryImageSize'];
    categoryImageShape: HomepageCategoryHeroConfig['categoryImageShape'];
    maxCategoriesDesktop: number;
    maxCategoriesTablet: number;
    maxCategoriesMobile: number;
    attachToHeader: boolean;
    tabletBehavior: HomepageCategoryHeroConfig['tabletBehavior'];
    autoGenerateConfig: HomepageCategoryHeroAutoGenerateConfig;
    autoGenerateMeta?: HomepageCategoryHeroAutoGenerateMeta;
    demoCategoriesData: DemoCategoryDataItem[];
    cornerRadius: HomepageCategoryHeroCornerRadius;
    noVerticalMargin: boolean;
    spacing: SectionSpacing;
    bannerImageFit: 'cover' | 'contain';
  } | null>(null);

  useEffect(() => {
    if (!component) {return;}
    if (component.type !== COMPONENT_TYPE) {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const config = component.config ?? {};
    setTitle(component.title);
    setActive(component.active);
    setHeading(config.heading ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heading);
    setSubheading(config.subheading ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.subheading);
    setCtaText(config.ctaText ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaText);
    setCtaUrl(config.ctaUrl ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaUrl);
    setStyle(config.style ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.style);
    const resolvedHeroSlides = ((config.heroSlides as HomepageCategoryHeroSlide[] | undefined) ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heroSlides).map((s, i) => ({
      ...s,
      id: s.id ?? `slide-${i}`,
    }));
    resetheroSlides(resolvedHeroSlides);
    setSelectionMode((config.selectionMode as HomepageCategoryHeroSelectionMode | undefined) ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.selectionMode);
    const resolvedCategories = normalizeHomepageCategoryHeroCategories(
      (config.categories as HomepageCategoryHeroCategoryItem[] | undefined) ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categories
    );
    setCategoryItems(resolvedCategories);
    setHideEmptyCategories(config.hideEmptyCategories ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.hideEmptyCategories);
    setShowCategoryImage(config.showCategoryImage ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.showCategoryImage);
    setCategoryVisualMode(config.categoryVisualMode ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryVisualMode);
    setCategoryImageSize(config.categoryImageSize ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageSize);
    setCategoryImageShape(config.categoryImageShape ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageShape);
    setMaxCategoriesDesktop(config.maxCategoriesDesktop ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesDesktop);
    setMaxCategoriesTablet(config.maxCategoriesTablet ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesTablet);
    setMaxCategoriesMobile(config.maxCategoriesMobile ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesMobile);
    setAttachToHeader(config.attachToHeader ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.attachToHeader);
    setTabletBehavior(config.tabletBehavior ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.tabletBehavior);
    const resolvedSpacing = config.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(config.spacing);
    const resolvedCornerRadius = normalizeHomepageCategoryHeroCornerRadius(config.cornerRadius, config.noBorderRadius);
    setCornerRadius(resolvedCornerRadius);
    setNoVerticalMargin(resolvedSpacing === 'none');
    setSpacing(resolvedSpacing);
    setBannerImageFit((config.bannerImageFit as 'cover' | 'contain' | undefined) ?? 'cover');
    setAutoGenerateConfig((config.autoGenerateConfig as HomepageCategoryHeroAutoGenerateConfig | undefined) ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.autoGenerateConfig);
    setAutoGenerateMeta((config.autoGenerateMeta as HomepageCategoryHeroAutoGenerateMeta | undefined) ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.autoGenerateMeta);
    setDemoCategoriesData((config.demoCategoriesData as DemoCategoryDataItem[] | undefined) ?? DEMO_CATEGORIES_DATA);

    setInitialData({
      title: component.title,
      active: component.active,
      heading: config.heading ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heading,
      subheading: config.subheading ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.subheading,
      ctaText: config.ctaText ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaText,
      ctaUrl: config.ctaUrl ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaUrl,
      style: config.style ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.style,
      heroSlides: resolvedHeroSlides,
      selectionMode: (config.selectionMode as HomepageCategoryHeroSelectionMode | undefined) ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.selectionMode,
      categories: resolvedCategories,
      hideEmptyCategories: config.hideEmptyCategories ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.hideEmptyCategories,
      showCategoryImage: config.showCategoryImage ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.showCategoryImage,
      categoryVisualMode: config.categoryVisualMode ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryVisualMode,
      categoryImageSize: config.categoryImageSize ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageSize,
      categoryImageShape: config.categoryImageShape ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageShape,
      maxCategoriesDesktop: config.maxCategoriesDesktop ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesDesktop,
      maxCategoriesTablet: config.maxCategoriesTablet ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesTablet,
      maxCategoriesMobile: config.maxCategoriesMobile ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesMobile,
      attachToHeader: config.attachToHeader ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.attachToHeader,
      tabletBehavior: config.tabletBehavior ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.tabletBehavior,
      autoGenerateConfig: (config.autoGenerateConfig as HomepageCategoryHeroAutoGenerateConfig | undefined) ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.autoGenerateConfig,
      autoGenerateMeta: (config.autoGenerateMeta as HomepageCategoryHeroAutoGenerateMeta | undefined) ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.autoGenerateMeta,
      demoCategoriesData: (config.demoCategoriesData as DemoCategoryDataItem[] | undefined) ?? DEMO_CATEGORIES_DATA,
      cornerRadius: resolvedCornerRadius,
      noVerticalMargin: resolvedSpacing === 'none',
      spacing: resolvedSpacing,
      bannerImageFit: (config.bannerImageFit as 'cover' | 'contain' | undefined) ?? 'cover',
    });
    setHasChanges(false);
  }, [component, id, router]);

  const dirtySnapshot = JSON.stringify({
    title,
    active,
    heading,
    subheading,
    ctaText,
    ctaUrl,
    style,
    heroSlides,
    selectionMode,
    categoryItems,
    hideEmptyCategories,
    showCategoryImage,
    categoryVisualMode,
    categoryImageSize,
    categoryImageShape,
    maxCategoriesDesktop,
    maxCategoriesTablet,
    maxCategoriesMobile,
    attachToHeader,
    tabletBehavior,
    cornerRadius,
    noVerticalMargin,
    spacing,
    bannerImageFit,
    autoGenerateConfig,
    demoCategoriesData,
    autoGenerateMeta,
    initialData,
    customState,
    initialCustom,
    showCustomBlock,
    customFontState,
    initialFontCustom,
    showFontCustomBlock,
  });

  useEffect(() => {
    if (!initialData) {return;}

    const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
    const resolvedInitialSecondary = resolveSecondaryByMode(initialCustom.mode, initialCustom.primary, initialCustom.secondary);
    const customChanged = enableTypeOverrides && showCustomBlock
      ? customState.enabled !== initialCustom.enabled
        || customState.mode !== initialCustom.mode
        || customState.primary !== initialCustom.primary
        || resolvedCustomSecondary !== resolvedInitialSecondary
      : false;
    const customFontChanged = enableTypeOverrides && showFontCustomBlock
      ? customFontState.enabled !== initialFontCustom.enabled
        || customFontState.fontKey !== initialFontCustom.fontKey
      : false;

    const changed = title !== initialData.title
      || active !== initialData.active
      || heading !== initialData.heading
      || subheading !== initialData.subheading
      || ctaText !== initialData.ctaText
      || ctaUrl !== initialData.ctaUrl
      || style !== initialData.style
      || JSON.stringify(heroSlides) !== JSON.stringify(initialData.heroSlides)
      || selectionMode !== initialData.selectionMode
      || JSON.stringify(categoryItems) !== JSON.stringify(initialData.categories)
      || hideEmptyCategories !== initialData.hideEmptyCategories
      || showCategoryImage !== initialData.showCategoryImage
      || categoryVisualMode !== initialData.categoryVisualMode
      || categoryImageSize !== initialData.categoryImageSize
      || categoryImageShape !== initialData.categoryImageShape
      || maxCategoriesDesktop !== initialData.maxCategoriesDesktop
      || maxCategoriesTablet !== initialData.maxCategoriesTablet
      || maxCategoriesMobile !== initialData.maxCategoriesMobile
      || attachToHeader !== initialData.attachToHeader
      || tabletBehavior !== initialData.tabletBehavior
      || cornerRadius !== initialData.cornerRadius
      || noVerticalMargin !== initialData.noVerticalMargin
      || spacing !== initialData.spacing
      || bannerImageFit !== initialData.bannerImageFit
      || JSON.stringify(autoGenerateConfig) !== JSON.stringify(initialData.autoGenerateConfig)
      || JSON.stringify(autoGenerateMeta) !== JSON.stringify(initialData.autoGenerateMeta)
      || JSON.stringify(demoCategoriesData) !== JSON.stringify(initialData.demoCategoriesData)
      || customChanged
      || customFontChanged;

    setHasChanges(changed);
  }, [dirtySnapshot]);

  const handleAutoGenerate = () => {
    const generated = generateFromRealData({ hideEmptyCategories });
    if (generated.status === 'loading') {
      toast.message('Đang tải dữ liệu danh mục...');
      return;
    }
    if (generated.status === 'empty-source') {
      toast.info('Chưa có danh mục để sinh menu.');
      return;
    }
    if (generated.status === 'empty-result') {
      toast.info('Không có danh mục hoặc sản phẩm phù hợp để sinh menu.');
      return;
    }
    setCategoryItems(normalizeHomepageCategoryHeroCategories(generated.categories));
    toast.success(`Đã sinh ${generated.categories.length} danh mục.`);
  };

  const handleLoadDemo = () => {
    setHeroSlides(DEMO_HERO_SLIDES as typeof heroSlides);
    setCategoryItems(normalizeHomepageCategoryHeroCategories(DEMO_CATEGORY_ITEMS));
    setDemoCategoriesData(DEMO_CATEGORIES_DATA);
    toast.success('Tải dữ liệu demo thành công!');
  };

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig = {
        heading,
        subheading,
        ctaText,
        ctaUrl,
        style,
        heroSlides,
        selectionMode,
        categories: normalizeHomepageCategoryHeroCategories(categoryItems),
        autoGenerateConfig,
        autoGenerateMeta,
        hideEmptyCategories,
        showCategoryImage,
        categoryVisualMode,
        categoryImageSize,
        categoryImageShape,
        maxCategoriesDesktop,
        maxCategoriesTablet,
        maxCategoriesMobile,
        attachToHeader,
        tabletBehavior,
        cornerRadius,
        noBorderRadius: cornerRadius === 'none',
        noVerticalMargin: spacing === 'none',
        spacing,
        bannerImageFit,
        demoCategoriesData,
      };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig, title });
      } else {
        await updateMutation({
          id: id as Id<'homeComponents'>,
          title,
          active,
          config: nextConfig,
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
      toast.success('Đã cập nhật Hero khám phá danh mục');
      setInitialData({
        title,
        active,
        heading,
        subheading,
        ctaText,
        ctaUrl,
        style,
        heroSlides,
        selectionMode,
        categories: categoryItems,
        hideEmptyCategories,
        showCategoryImage,
        categoryVisualMode,
        categoryImageSize,
        categoryImageShape,
        maxCategoriesDesktop,
        maxCategoriesTablet,
        maxCategoriesMobile,
        attachToHeader,
        tabletBehavior,
        autoGenerateConfig,
        autoGenerateMeta,
        demoCategoriesData,
        cornerRadius,
        noVerticalMargin: spacing === 'none',
        spacing,
        bannerImageFit,
      });
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
    } catch {
      toast.error('Lỗi khi cập nhật component');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!component) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const brandMode: HomepageCategoryHeroBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-cyan-600" />
            <h1 className="text-2xl font-bold">Hero khám phá danh mục</h1>
          </div>
          {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
          <Link href={backHref} className="text-sm text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
        <div className="text-sm text-slate-500">
          {hasChanges ? 'Có thay đổi chưa lưu' : 'Đã lưu'}
        </div>
      </div>

      <form id="homepage-category-hero-edit-form" onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Cấu hình chung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <ClearableInput value={title} onChange={setTitle} required />
                </div>
                <CopyTextButton value={title} label="tiêu đề hiển thị" className="shrink-0" />
              </div>
            </div>
</CardContent>
        </Card>

        <div className="space-y-6">
          <HomepageCategoryHeroForm
            heroSlides={heroSlides}
            setHeroSlides={setHeroSlides}
            style={style}
            categoryItems={categoryItems}
            setCategoryItems={setCategoryItems}
            categoriesData={categoriesData}
            categoryVisualMode={categoryVisualMode}
            setCategoryVisualMode={setCategoryVisualMode}
            categoryImageSize={categoryImageSize}
            setCategoryImageSize={setCategoryImageSize}
            categoryImageShape={categoryImageShape}
            setCategoryImageShape={setCategoryImageShape}
            autoGenerateConfig={autoGenerateConfig}
            autoGenerateMeta={autoGenerateMeta}
            autoGenerateReady={isAutoGenerateReady}
            autoGenerateLoading={isAutoGenerateLoading}
            hideEmptyCategories={hideEmptyCategories}
            setHideEmptyCategories={setHideEmptyCategories}
            onAutoGenerate={handleAutoGenerate}
            onLoadDemo={handleLoadDemo}
            selectionMode={selectionMode}
            onSelectionModeChange={setSelectionMode}
            defaultExpanded={false}
            demoCategoriesData={demoCategoriesData}
            setDemoCategoriesData={setDemoCategoriesData}
            cornerRadius={cornerRadius}
            setCornerRadius={setCornerRadius}
            noVerticalMargin={noVerticalMargin}
            setNoVerticalMargin={setNoVerticalMargin}
            spacing={spacing}
            setSpacing={setSpacing}
            bannerImageFit={bannerImageFit}
            setBannerImageFit={setBannerImageFit}
          />

          {enableTypeOverrides && showCustomBlock && (
            <TypeColorOverrideCard
              title="Màu custom Hero danh mục"
              enabled={customState.enabled}
              mode={customState.mode}
              primary={customState.primary}
              secondary={customState.secondary}
              compact
              toggleLabel="Custom"
              primaryLabel="Chính"
              secondaryLabel="Phụ"
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
              title="Font custom Hero danh mục"
              enabled={customFontState.enabled}
              fontKey={customFontState.fontKey}
              compact
              toggleLabel="Custom"
              fontLabel="Font"
              onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
              onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
            />
          )}

          <HomepageCategoryHeroPreview
            config={{
              heading,
              subheading,
              ctaText,
              ctaUrl,
              style,
              heroSlides,
              selectionMode,
              categories: categoryItems,
              autoGenerateConfig,
              autoGenerateMeta,
              hideEmptyCategories,
              showCategoryImage,
              categoryVisualMode,
              categoryImageSize,
              categoryImageShape,
              maxCategoriesDesktop,
              maxCategoriesTablet,
              maxCategoriesMobile,
              attachToHeader,
              tabletBehavior,
              cornerRadius,
              noBorderRadius: cornerRadius === 'none',
              noVerticalMargin: spacing === 'none',
              spacing,
              bannerImageFit,
              demoCategoriesData,
            }}
            brandColor={effectiveColors.primary}
            secondary={effectiveColors.secondary}
            mode={brandMode}
            selectedStyle={style}
            onStyleChange={setStyle}
            fontStyle={fontStyle}
            fontClassName="font-active"
          />
        </div>
        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() =>{  router.push(backHref); }}
          submitLabel="Lưu thay đổi"
        active={active}
        onActiveChange={setActive}
        
        undoRedo={{
          canUndo: canUndoheroSlides,
          canRedo: canRedoheroSlides,
          onUndo: undoheroSlides,
          onRedo: redoheroSlides,
        }}
        />
      </form>
    </div>
  );
}
