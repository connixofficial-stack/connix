'use client';

import { useEffect, useMemo, useState } from 'react';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { autoGenerateHomepageCategoryHeroMenu } from './auto-generate';
import { DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG } from './constants';
import type {
  HomepageCategoryHeroAutoGenerateConfig,
  HomepageCategoryHeroAutoGenerateMeta,
  HomepageCategoryHeroCategoryItem,
} from '../_types';

type AutoGenerateResult =
  | { status: 'loading' }
  | { status: 'empty-source' }
  | { status: 'empty-result' }
  | { status: 'success'; categories: HomepageCategoryHeroCategoryItem[]; meta: HomepageCategoryHeroAutoGenerateMeta };

type HeroPayload = {
  categories: Array<Doc<'productCategories'>>;
  stats: Array<{ categoryId: Id<'productCategories'>; productCount: number; totalSales: number; latestProductTime: number; representativeImage?: string; sampleImages?: string[] }>;
  productsByCategory?: Array<{ categoryId: Id<'productCategories'>; products: Array<{ _id: Id<'products'>; name: string; slug: string; image?: string; categoryId: Id<'productCategories'>; sales: number; _creationTime: number }> }>;
};

export function useHomepageCategoryHeroAutoGenerate(
  initialConfig: HomepageCategoryHeroAutoGenerateConfig = DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.autoGenerateConfig,
  initialMeta: HomepageCategoryHeroAutoGenerateMeta | undefined = DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.autoGenerateMeta
) {
  const [autoGenerateConfig, setAutoGenerateConfig] = useState<HomepageCategoryHeroAutoGenerateConfig>(initialConfig);
  const [autoGenerateMeta, setAutoGenerateMeta] = useState<HomepageCategoryHeroAutoGenerateMeta | undefined>(initialMeta);
  const convex = useConvex();
  const [heroPayload, setHeroPayload] = useState<HeroPayload | null>(null);

  const productLimit = useMemo(
    () => Math.max(100, autoGenerateConfig.productScanLimit || DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.autoGenerateConfig.productScanLimit),
    [autoGenerateConfig.productScanLimit]
  );

  useEffect(() => {
    let active = true;
    convex
      .query(api.productCategories.listActiveWithStatsForHero, {
        productLimit,
        productPerCategoryLimit: autoGenerateConfig.maxItemsPerGroup,
      })
      .then((payload) => {
        if (active) {
          setHeroPayload(payload as HeroPayload);
        }
      })
      .catch(() => {
        if (active) {
          setHeroPayload(null);
        }
      });
    return () => {
      active = false;
    };
  }, [autoGenerateConfig.maxItemsPerGroup, convex, productLimit]);

  const categoriesPayload = heroPayload ?? undefined;
  const hierarchyFeature = useQuery(api.admin.modules.getModuleFeature, {
    moduleKey: 'products',
    featureKey: 'enableCategoryHierarchy',
  });
  const categoriesData = categoriesPayload?.categories ?? [];
  const isAutoGenerateLoading = categoriesPayload === undefined;
  const isAutoGenerateReady = categoriesPayload !== undefined;
  const hierarchyEnabled = hierarchyFeature?.enabled === true;

  const generateFromRealData = ({
    hideEmptyCategories = false,
  }: {
    hideEmptyCategories?: boolean;
  } = {}): AutoGenerateResult => {
    if (!categoriesPayload) {
      return { status: 'loading' };
    }
    if ((categoriesPayload.categories ?? []).length === 0) {
      return { status: 'empty-source' };
    }
    const { categories, meta } = autoGenerateHomepageCategoryHeroMenu({
      categories: categoriesPayload.categories,
      stats: categoriesPayload.stats ?? [],
      productsByCategory: categoriesPayload.productsByCategory ?? [],
      hierarchyEnabled,
      config: autoGenerateConfig,
      hideEmptyCategories,
    });
    setAutoGenerateMeta(meta);
    if (categories.length === 0) {
      return { status: 'empty-result' };
    }
    return { status: 'success', categories, meta };
  };

  return {
    autoGenerateConfig,
    setAutoGenerateConfig,
    autoGenerateMeta,
    setAutoGenerateMeta,
    categoriesData,
    isAutoGenerateLoading,
    isAutoGenerateReady,
    generateFromRealData,
  };
}
