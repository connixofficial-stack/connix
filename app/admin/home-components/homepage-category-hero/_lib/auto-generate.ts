'use client';

import type { Doc } from '@/convex/_generated/dataModel';
import type {
  HomepageCategoryHeroAutoGenerateConfig,
  HomepageCategoryHeroAutoGenerateMeta,
  HomepageCategoryHeroAutoGenerateMode,
  HomepageCategoryHeroCategoryItem,
  HomepageCategoryHeroMenuGroup,
  HomepageCategoryHeroMenuLink,
} from '../_types';

type CategoryStatsEntry = {
  categoryId: Doc<'productCategories'>['_id'];
  productCount: number;
  totalSales: number;
  latestProductTime: number;
  representativeImage?: string;
  sampleImages?: string[];
};

type CategoryNode = Doc<'productCategories'>;

type ProductSummary = {
  _id: Doc<'products'>['_id'];
  name: string;
  slug: string;
  image?: string;
  categoryId: Doc<'productCategories'>['_id'];
  sales: number;
  _creationTime: number;
};

type AggregatedStats = {
  productCount: number;
  totalSales: number;
  latestProductTime: number;
  representativeImage?: string;
  sampleImages?: string[];
};

const DEFAULT_STATS: AggregatedStats = {
  productCount: 0,
  totalSales: 0,
  latestProductTime: 0,
  sampleImages: [],
};

const SCORE_WEIGHTS = {
  count: 1,
  sales: 1.6,
  recency: 0.8,
  image: 0.2,
};

const recencyBoost = (timestamp: number) => {
  if (!timestamp) {return 0;}
  const days = Math.max(1, (Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  return 1 / Math.log10(days + 10);
};

const scoreStats = (stats: AggregatedStats, hasImage: boolean, mode: HomepageCategoryHeroAutoGenerateMode) => {
  if (mode === 'tree') {
    return stats.productCount;
  }
  const base =
    SCORE_WEIGHTS.count * Math.log1p(stats.productCount)
    + SCORE_WEIGHTS.sales * Math.log1p(stats.totalSales)
    + SCORE_WEIGHTS.recency * recencyBoost(stats.latestProductTime);
  return base + (hasImage ? SCORE_WEIGHTS.image : 0);
};

const toStatsMap = (entries: CategoryStatsEntry[]) => {
  const map = new Map<string, AggregatedStats & { representativeImage?: string }>();
  entries.forEach((entry) => {
    map.set(entry.categoryId, {
      productCount: entry.productCount ?? 0,
      totalSales: entry.totalSales ?? 0,
      latestProductTime: entry.latestProductTime ?? 0,
      representativeImage: entry.representativeImage,
      sampleImages: entry.sampleImages ?? [],
    });
  });
  return map;
};

const mergeImages = (base: string[] = [], next: string[] = [], limit = 6) => {
  const merged = [...base];
  next.forEach((img) => {
    if (merged.length >= limit) {return;}
    if (!merged.includes(img)) {
      merged.push(img);
    }
  });
  return merged;
};

const buildChildrenMap = (categories: CategoryNode[]) => {
  const map = new Map<string | undefined, CategoryNode[]>();
  categories.forEach((category) => {
    const key = category.parentId ?? undefined;
    const list = map.get(key) ?? [];
    list.push(category);
    map.set(key, list);
  });
  return map;
};

export const buildCategoryAggregateMap = ({
  categories,
  stats,
}: {
  categories: CategoryNode[];
  stats: CategoryStatsEntry[];
}) => {
  const childrenMap = buildChildrenMap(categories);
  const statsMap = toStatsMap(stats);
  const cache = new Map<string, AggregatedStats>();
  const aggregateMap = new Map<string, AggregatedStats>();
  categories.forEach((category) => {
    aggregateMap.set(category._id, aggregateStats(category._id, childrenMap, statsMap, cache));
  });
  return aggregateMap;
};

const aggregateStats = (
  categoryId: string,
  childrenMap: Map<string | undefined, CategoryNode[]>,
  statsMap: Map<string, AggregatedStats & { representativeImage?: string }>,
  cache: Map<string, AggregatedStats>
): AggregatedStats => {
  if (cache.has(categoryId)) {
    return cache.get(categoryId) ?? DEFAULT_STATS;
  }
  const children = childrenMap.get(categoryId) ?? [];
  const base = statsMap.get(categoryId) ?? DEFAULT_STATS;
  const merged = children.reduce((acc, child) => {
    const childStats = aggregateStats(child._id, childrenMap, statsMap, cache);
    return {
      productCount: acc.productCount + childStats.productCount,
      totalSales: acc.totalSales + childStats.totalSales,
      latestProductTime: Math.max(acc.latestProductTime, childStats.latestProductTime),
      representativeImage: acc.representativeImage ?? childStats.representativeImage,
      sampleImages: mergeImages(acc.sampleImages ?? [], childStats.sampleImages ?? []),
    };
  }, { ...base });
  cache.set(categoryId, merged);
  return merged;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const pickStableImage = (categoryId: string, candidates: string[] = [], fallback?: string) => {
  if (candidates.length === 0) {
    return fallback;
  }
  const index = hashString(categoryId) % candidates.length;
  return candidates[index] ?? fallback;
};

const buildLink = (id: number, categoryId: string): HomepageCategoryHeroMenuLink => ({
  id,
  targetType: 'category',
  categoryId,
});

const buildProductLink = (id: number, product: ProductSummary): HomepageCategoryHeroMenuLink => ({
  id,
  targetType: 'product',
  productId: product._id,
  label: product.name,
  image: product.image,
  slug: product.slug,
});

const buildGroup = (id: number, title: string, items: HomepageCategoryHeroMenuLink[]): HomepageCategoryHeroMenuGroup => ({
  id,
  title,
  items,
});

const buildSummary = (
  mode: HomepageCategoryHeroAutoGenerateMode,
  categories: HomepageCategoryHeroCategoryItem[]
) => {
  const totalGroups = categories.reduce((acc, item) => acc + (item.groups ?? []).length, 0);
  const totalLinks = categories.reduce(
    (acc, item) => acc + (item.groups ?? []).reduce((sum, group) => sum + (group.items ?? []).length, 0),
    0
  );
  const productLinks = categories.reduce(
    (acc, item) => acc + (item.groups ?? []).reduce((sum, group) => sum + (group.items ?? []).filter((link) => link.targetType === 'product').length, 0),
    0
  );
  const categoryLinks = totalLinks - productLinks;
  return `Sinh ${categories.length} danh mục cha • ${totalGroups} nhóm • ${totalLinks} link (${categoryLinks} DM, ${productLinks} SP) (${mode}).`;
};

const sortProducts = (items: ProductSummary[]) => items.sort((a, b) => {
  if (b.sales !== a.sales) {
    return b.sales - a.sales;
  }
  return b._creationTime - a._creationTime;
});

export function autoGenerateHomepageCategoryHeroMenu({
  categories,
  stats,
  config,
  productsByCategory = [],
  hierarchyEnabled = true,
  hideEmptyCategories = false,
}: {
  categories: CategoryNode[];
  stats: CategoryStatsEntry[];
  config: HomepageCategoryHeroAutoGenerateConfig;
  productsByCategory?: Array<{ categoryId: string; products: ProductSummary[] }>;
  hierarchyEnabled?: boolean;
  hideEmptyCategories?: boolean;
}) {
  const mode = config.mode;
  const childrenMap = buildChildrenMap(categories);
  const statsMap = toStatsMap(stats);
  const cache = new Map<string, AggregatedStats>();
  const hasVisibleProducts = (categoryId: string) => aggregateStats(categoryId, childrenMap, statsMap, cache).productCount > 0;
  const topLevel = hierarchyEnabled ? (childrenMap.get(undefined) ?? []).slice() : categories.slice();
  const productsMap = new Map<string, ProductSummary[]>();
  productsByCategory.forEach((entry) => {
    productsMap.set(entry.categoryId, entry.products ?? []);
  });

  const scoredTop = topLevel
    .map((category) => {
      const aggregated = aggregateStats(category._id, childrenMap, statsMap, cache);
      return {
        category,
        aggregated,
        score: scoreStats(aggregated, Boolean(category.image), mode),
      };
    })
    .filter((entry) => !hideEmptyCategories || entry.aggregated.productCount > 0);

  const sortedTop = scoredTop.sort((a, b) => b.score - a.score);
  const maxRoot = Math.max(1, config.maxRootCategories);
  const selectedTop = sortedTop.slice(0, maxRoot);

  const result: HomepageCategoryHeroCategoryItem[] = [];

  selectedTop.forEach((entry, index) => {
    const rootCategory = entry.category;
    const categoryItem: HomepageCategoryHeroCategoryItem = {
      id: index,
      categoryId: rootCategory._id,
      imageOverride: pickStableImage(
        rootCategory._id,
        entry.aggregated.sampleImages ?? [],
        entry.aggregated.representativeImage ?? rootCategory.image
      ),
      groups: [],
    };

    const rootGroups: HomepageCategoryHeroMenuGroup[] = [];

    const levelOne = hierarchyEnabled ? (childrenMap.get(rootCategory._id) ?? []).slice() : [];
    if (levelOne.length > 0) {
      const sortedLevelOne = levelOne
        .map((child) => ({
          child,
          aggregated: aggregateStats(child._id, childrenMap, statsMap, cache),
        }))
        .filter((entry) => !hideEmptyCategories || entry.aggregated.productCount > 0)
        .map((entry) => ({
          child: entry.child,
          score: scoreStats(entry.aggregated, Boolean(entry.child.image), mode),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, config.maxGroupsPerCategory);

      sortedLevelOne.forEach((groupEntry, groupIndex) => {
        const groupCategory = groupEntry.child;
        if (hideEmptyCategories && !hasVisibleProducts(groupCategory._id)) {return;}

        const levelTwo = (childrenMap.get(groupCategory._id) ?? []).slice();
        if (levelTwo.length > 0) {
          const scoredItems = levelTwo
            .filter((child) => !hideEmptyCategories || hasVisibleProducts(child._id))
            .map((child) => ({
              child,
              score: scoreStats(aggregateStats(child._id, childrenMap, statsMap, cache), Boolean(child.image), mode),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, config.maxItemsPerGroup)
            .map((item) => item.child);

          if (scoredItems.length === 0) {return;}
          const items = scoredItems.map((item, itemIndex) => buildLink(itemIndex, item._id));
          rootGroups.push(buildGroup(groupIndex, groupCategory.name, items));
          return;
        }

        const fallbackProducts = sortProducts(productsMap.get(groupCategory._id) ?? []).slice(0, config.maxItemsPerGroup);
        if (fallbackProducts.length === 0) {return;}
        const items = fallbackProducts.map((product, itemIndex) => buildProductLink(itemIndex, product));
        rootGroups.push(buildGroup(groupIndex, groupCategory.name, items));
      });
    }

    if (rootGroups.length === 0) {
      const fallbackProducts = sortProducts(productsMap.get(rootCategory._id) ?? []).slice(0, config.maxItemsPerGroup);
      if (fallbackProducts.length > 0) {
        const items = fallbackProducts.map((product, itemIndex) => buildProductLink(itemIndex, product));
        if (items.length > 0) {
          rootGroups.push(buildGroup(0, rootCategory.name, items));
        }
      }
    }

    categoryItem.groups = rootGroups;

    if ((categoryItem.groups ?? []).length > 0) {
      result.push(categoryItem);
    }
  });

  const meta: HomepageCategoryHeroAutoGenerateMeta = {
    generatedAt: Date.now(),
    mode,
    strategy: config.strategy,
    summary: buildSummary(mode, result),
  };

  return {
    categories: result,
    meta,
  };
}
