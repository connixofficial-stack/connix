'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HomepageCategoryHeroForm } from '../../homepage-category-hero/_components/HomepageCategoryHeroForm';
import { HomepageCategoryHeroPreview } from '../../homepage-category-hero/_components/HomepageCategoryHeroPreview';
import { DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG, DEMO_CATEGORIES_DATA, DEMO_HERO_SLIDES, DEMO_CATEGORY_ITEMS, normalizeHomepageCategoryHeroCategories } from '../../homepage-category-hero/_lib/constants';
import { useHomepageCategoryHeroAutoGenerate } from '../../homepage-category-hero/_lib/useHomepageCategoryHeroAutoGenerate';
import type {
  HomepageCategoryHeroBrandMode,
  HomepageCategoryHeroCornerRadius,
  HomepageCategoryHeroSelectionMode,
} from '../../homepage-category-hero/_types';
import { DEFAULT_HOMEPAGE_CATEGORY_HERO_CORNER_RADIUS } from '../../homepage-category-hero/_types';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';

const COMPONENT_TYPE = 'HomepageCategoryHero';

export default function HomepageCategoryHeroCreatePage() {
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Hero khám phá danh mục', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const {
    autoGenerateConfig,
    autoGenerateMeta,
    categoriesData,
    isAutoGenerateLoading,
    isAutoGenerateReady,
    generateFromRealData,
  } = useHomepageCategoryHeroAutoGenerate();

  const { primary, secondary, mode } = effectiveColors;
  const brandMode: HomepageCategoryHeroBrandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [heading] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heading);
  const [subheading] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.subheading);
  const [ctaText] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaText);
  const [ctaUrl] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaUrl);
  const [style, setStyle] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.style);
  const [heroSlides, setHeroSlides] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heroSlides);
  const [selectionMode, setSelectionMode] = useState<HomepageCategoryHeroSelectionMode>(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.selectionMode);
  const [categoryItems, setCategoryItems] = useState(
    normalizeHomepageCategoryHeroCategories(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categories)
  );
  const [demoCategoriesData, setDemoCategoriesData] = useState(DEMO_CATEGORIES_DATA);
  const [hideEmptyCategories, setHideEmptyCategories] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.hideEmptyCategories);
  const [showCategoryImage] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.showCategoryImage);
  const [categoryVisualMode, setCategoryVisualMode] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryVisualMode);
  const [categoryImageSize, setCategoryImageSize] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageSize);
  const [categoryImageShape, setCategoryImageShape] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageShape);
  const [maxCategoriesDesktop] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesDesktop);
  const [maxCategoriesTablet] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesTablet);
  const [maxCategoriesMobile] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesMobile);
  const [attachToHeader] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.attachToHeader);
  const [tabletBehavior] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.tabletBehavior);
  const [cornerRadius, setCornerRadius] = useState<HomepageCategoryHeroCornerRadius>(
    DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.cornerRadius ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CORNER_RADIUS
  );
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.spacing ?? 'normal');
  const [bannerImageFit, setBannerImageFit] = useState<'cover' | 'contain'>(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.bannerImageFit ?? 'cover');

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

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
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
          defaultExpanded={true}
          demoCategoriesData={demoCategoriesData}
          setDemoCategoriesData={setDemoCategoriesData}
          cornerRadius={cornerRadius}
          setCornerRadius={setCornerRadius}
          spacing={spacing}
          setSpacing={setSpacing}
          bannerImageFit={bannerImageFit}
          setBannerImageFit={setBannerImageFit}
        />

        <HomepageCategoryHeroPreview
          config={{
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
          }}
          brandColor={primary}
          secondary={secondary}
          mode={brandMode}
          selectedStyle={style}
          onStyleChange={setStyle}
          fontStyle={fontStyle}
          fontClassName="font-active"
        />
      </div>
    </ComponentFormWrapper>
  );
}
