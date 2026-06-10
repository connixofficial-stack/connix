'use client';

import type { CustomImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import type {
  HomepageCategoryHeroAutoGenerateConfig,
  HomepageCategoryHeroCategoryItem,
  HomepageCategoryHeroConfig,
  HomepageCategoryHeroStyle,
} from '../_types';
import { DEFAULT_SECTION_SPACING } from '../../_shared/types/sectionSpacing';

export const HOMEPAGE_CATEGORY_HERO_STYLES: Array<{ id: HomepageCategoryHeroStyle; label: string }> = [
  { id: 'sidebar', label: '(1) Thanh bên' },
  { id: 'classic', label: '(2) Cổ điển' },
  { id: 'flush', label: '(3) Tràn viền' },
  { id: 'minimal', label: '(4) Tối giản' },
  { id: 'soft', label: '(5) Bo mềm' },
  { id: 'top-nav', label: '(6) Thanh trên' },
];

const HOMEPAGE_CATEGORY_HERO_STYLE_SET = new Set<HomepageCategoryHeroStyle>(
  HOMEPAGE_CATEGORY_HERO_STYLES.map((item) => item.id)
);

export const normalizeHomepageCategoryHeroStyle = (value?: unknown): HomepageCategoryHeroStyle => {
  if (typeof value === 'string' && HOMEPAGE_CATEGORY_HERO_STYLE_SET.has(value as HomepageCategoryHeroStyle)) {
    return value as HomepageCategoryHeroStyle;
  }

  return 'sidebar';
};

const normalizeCategoryItem = (item: HomepageCategoryHeroCategoryItem, index: number): HomepageCategoryHeroCategoryItem => ({
  id: item.id ?? index,
  categoryId: item.categoryId ?? '',
  imageOverride: item.imageOverride,
  iconName: item.iconName,
  ctaLabel: item.ctaLabel?.trim() || undefined,
  groups: (item.groups ?? []).map((group, groupIndex) => ({
    id: group.id ?? groupIndex,
    title: group.title ?? '',
    items: (group.items ?? []).map((link, linkIndex) => ({
      id: link.id ?? linkIndex,
      targetType: link.targetType ?? (link.productId ? 'product' : 'category'),
      categoryId: link.categoryId ?? '',
      productId: link.productId,
      label: link.label?.trim() || undefined,
      image: link.image,
      slug: link.slug?.trim() || undefined,
    })),
  })),
});

export const normalizeHomepageCategoryHeroCategories = (
  categories?: HomepageCategoryHeroCategoryItem[]
): HomepageCategoryHeroCategoryItem[] => (categories ?? []).map(normalizeCategoryItem);

export const HOMEPAGE_CATEGORY_HERO_CROP_ASPECT_RATIOS: Record<HomepageCategoryHeroStyle, CustomImageAspectRatio> = {
  classic: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  flush: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  minimal: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  sidebar: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  soft: { cssValue: '16 / 9', label: '16:9', value: 16 / 9 },
  'top-nav': { cssValue: '21 / 9', label: '21:9', value: 21 / 9 },
};

export const getHomepageCategoryHeroCropAspectRatio = (style: HomepageCategoryHeroStyle): CustomImageAspectRatio => (
  HOMEPAGE_CATEGORY_HERO_CROP_ASPECT_RATIOS[style] ?? HOMEPAGE_CATEGORY_HERO_CROP_ASPECT_RATIOS.sidebar
);

export const DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG: HomepageCategoryHeroConfig = {
  style: 'sidebar',
  heading: 'Khám phá danh mục sản phẩm',
  subheading: 'Chọn danh mục bạn quan tâm để xem nhanh sản phẩm nổi bật',
  ctaText: 'Xem tất cả sản phẩm',
  ctaUrl: '/products',
  heroSlides: [],
  selectionMode: 'manual',
  categories: [],
  autoGenerateConfig: {
    mode: 'smart',
    strategy: 'balanced',
    maxRootCategories: 8,
    maxGroupsPerCategory: 6,
    maxItemsPerGroup: 6,
    productScanLimit: 5000,
  } satisfies HomepageCategoryHeroAutoGenerateConfig,
  autoGenerateMeta: undefined,
  hideEmptyCategories: true,
  showCategoryImage: true,
  categoryVisualMode: 'image',
  categoryImageSize: 'sm',
  categoryImageShape: 'circle',
  maxCategoriesDesktop: 10,
  maxCategoriesTablet: 8,
  maxCategoriesMobile: 6,
  attachToHeader: true,
  tabletBehavior: 'drawer',
  cornerRadius: 'lg',
  noBorderRadius: false,
  noVerticalMargin: false,
  spacing: DEFAULT_SECTION_SPACING,
  bannerImageFit: 'cover',
};

/* ── Demo data ────────────────────────────────────────────────────── */

export const DEMO_HERO_SLIDES: HomepageCategoryHeroConfig['heroSlides'] = [
  { id: 'demo-s1', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=500&fit=crop', link: '/khuyen-mai' },
  { id: 'demo-s2', url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=500&fit=crop', link: '/san-pham-moi' },
  { id: 'demo-s3', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=500&fit=crop', link: '' },
];

export const DEMO_CATEGORY_ITEMS: HomepageCategoryHeroCategoryItem[] = [
  {
    id: 1, categoryId: 'demo-cat-1', iconName: 'ShoppingBag',
    groups: [
      { id: 1, title: '🔥 Gợi ý cho bạn', items: [
        { id: 1, targetType: 'category', categoryId: 'demo-sub-1', label: 'Áo thun', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=160&h=160&fit=crop' },
        { id: 2, targetType: 'category', categoryId: 'demo-sub-2', label: 'Áo sơ mi', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=160&h=160&fit=crop' },
        { id: 3, targetType: 'category', categoryId: 'demo-sub-10', label: 'Quần jean', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=160&h=160&fit=crop' },
        { id: 4, targetType: 'category', categoryId: 'demo-sub-11', label: 'Giày dép', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&h=160&fit=crop' },
        { id: 5, targetType: 'category', categoryId: 'demo-sub-12', label: 'Túi xách', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=160&h=160&fit=crop' },
      ] },
      { id: 2, title: 'Phụ kiện', items: [
        { id: 6, targetType: 'category', categoryId: 'demo-sub-13', label: 'Đồng hồ' },
        { id: 7, targetType: 'category', categoryId: 'demo-sub-14', label: 'Kính mắt' },
        { id: 8, targetType: 'category', categoryId: 'demo-sub-15', label: 'Thắt lưng' },
      ] },
    ],
  },
  {
    id: 2, categoryId: 'demo-cat-2', iconName: 'Laptop',
    groups: [
      { id: 1, title: '🔥 Gợi ý cho bạn', items: [
        { id: 1, targetType: 'category', categoryId: 'demo-sub-3', label: 'Laptop', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=160&h=160&fit=crop' },
        { id: 2, targetType: 'category', categoryId: 'demo-sub-4', label: 'Điện thoại', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&h=160&fit=crop' },
        { id: 3, targetType: 'category', categoryId: 'demo-sub-16', label: 'Máy tính bảng', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=160&h=160&fit=crop' },
        { id: 4, targetType: 'category', categoryId: 'demo-sub-17', label: 'Tai nghe', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&h=160&fit=crop' },
        { id: 5, targetType: 'category', categoryId: 'demo-sub-18', label: 'Đồng hồ thông minh', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&h=160&fit=crop' },
        { id: 6, targetType: 'category', categoryId: 'demo-sub-19', label: 'Loa bluetooth', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=160&h=160&fit=crop' },
      ] },
      { id: 2, title: 'Linh kiện', items: [
        { id: 7, targetType: 'category', categoryId: 'demo-sub-20', label: 'Bàn phím' },
        { id: 8, targetType: 'category', categoryId: 'demo-sub-21', label: 'Chuột' },
        { id: 9, targetType: 'category', categoryId: 'demo-sub-22', label: 'Màn hình' },
      ] },
    ],
  },
  {
    id: 3, categoryId: 'demo-cat-3', iconName: 'Home',
    groups: [
      { id: 1, title: '🔥 Gợi ý cho bạn', items: [
        { id: 1, targetType: 'category', categoryId: 'demo-sub-5', label: 'Sofa', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=160&h=160&fit=crop' },
        { id: 2, targetType: 'category', categoryId: 'demo-sub-6', label: 'Bàn ghế', image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=160&h=160&fit=crop' },
        { id: 3, targetType: 'category', categoryId: 'demo-sub-23', label: 'Giường ngủ', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=160&h=160&fit=crop' },
        { id: 4, targetType: 'category', categoryId: 'demo-sub-24', label: 'Tủ quần áo', image: 'https://images.unsplash.com/photo-1558997519-83ea9252efc8?w=160&h=160&fit=crop' },
      ] },
    ],
  },
  {
    id: 4, categoryId: 'demo-cat-4', iconName: 'Utensils',
    groups: [
      { id: 1, title: '🔥 Gợi ý cho bạn', items: [
        { id: 1, targetType: 'category', categoryId: 'demo-sub-7', label: 'Nồi chiên', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=160&h=160&fit=crop' },
        { id: 2, targetType: 'category', categoryId: 'demo-sub-25', label: 'Bếp từ', image: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=160&h=160&fit=crop' },
        { id: 3, targetType: 'category', categoryId: 'demo-sub-26', label: 'Máy xay', image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=160&h=160&fit=crop' },
      ] },
    ],
  },
  {
    id: 5, categoryId: 'demo-cat-5', iconName: 'Heart',
    groups: [
      { id: 1, title: '🔥 Gợi ý cho bạn', items: [
        { id: 1, targetType: 'category', categoryId: 'demo-sub-8', label: 'Dưỡng da', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=160&h=160&fit=crop' },
        { id: 2, targetType: 'category', categoryId: 'demo-sub-9', label: 'Trang điểm', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=160&h=160&fit=crop' },
        { id: 3, targetType: 'category', categoryId: 'demo-sub-27', label: 'Nước hoa', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=160&h=160&fit=crop' },
        { id: 4, targetType: 'category', categoryId: 'demo-sub-28', label: 'Chăm sóc tóc', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=160&h=160&fit=crop' },
      ] },
      { id: 2, title: 'Thương hiệu', items: [
        { id: 5, targetType: 'category', categoryId: 'demo-sub-29', label: 'The Ordinary' },
        { id: 6, targetType: 'category', categoryId: 'demo-sub-30', label: 'Innisfree' },
      ] },
    ],
  },
];

/** Danh mục giả cho dropdown — khớp ID với DEMO_CATEGORY_ITEMS */
export const DEMO_CATEGORIES_DATA: { _id: string; name: string; image?: string }[] = [
  { _id: 'demo-cat-1', name: 'Thời trang', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop' },
  { _id: 'demo-cat-2', name: 'Công nghệ', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop' },
  { _id: 'demo-cat-3', name: 'Nội thất', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop' },
  { _id: 'demo-cat-4', name: 'Nhà bếp', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop' },
  { _id: 'demo-cat-5', name: 'Làm đẹp', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop' },
  { _id: 'demo-sub-1', name: 'Áo thun' },
  { _id: 'demo-sub-2', name: 'Áo sơ mi' },
  { _id: 'demo-sub-3', name: 'Laptop' },
  { _id: 'demo-sub-4', name: 'Điện thoại' },
  { _id: 'demo-sub-5', name: 'Sofa' },
  { _id: 'demo-sub-6', name: 'Bàn ghế' },
  { _id: 'demo-sub-7', name: 'Nồi chiên' },
  { _id: 'demo-sub-8', name: 'Dưỡng da' },
  { _id: 'demo-sub-9', name: 'Trang điểm' },
  { _id: 'demo-sub-10', name: 'Quần jean' },
  { _id: 'demo-sub-11', name: 'Giày dép' },
  { _id: 'demo-sub-12', name: 'Túi xách' },
  { _id: 'demo-sub-13', name: 'Đồng hồ' },
  { _id: 'demo-sub-14', name: 'Kính mắt' },
  { _id: 'demo-sub-15', name: 'Thắt lưng' },
  { _id: 'demo-sub-16', name: 'Máy tính bảng' },
  { _id: 'demo-sub-17', name: 'Tai nghe' },
  { _id: 'demo-sub-18', name: 'Đồng hồ thông minh' },
  { _id: 'demo-sub-19', name: 'Loa bluetooth' },
  { _id: 'demo-sub-20', name: 'Bàn phím' },
  { _id: 'demo-sub-21', name: 'Chuột' },
  { _id: 'demo-sub-22', name: 'Màn hình' },
  { _id: 'demo-sub-23', name: 'Giường ngủ' },
  { _id: 'demo-sub-24', name: 'Tủ quần áo' },
  { _id: 'demo-sub-25', name: 'Bếp từ' },
  { _id: 'demo-sub-26', name: 'Máy xay' },
  { _id: 'demo-sub-27', name: 'Nước hoa' },
  { _id: 'demo-sub-28', name: 'Chăm sóc tóc' },
  { _id: 'demo-sub-29', name: 'The Ordinary' },
  { _id: 'demo-sub-30', name: 'Innisfree' },
];
