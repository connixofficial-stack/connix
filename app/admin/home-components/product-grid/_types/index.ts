'use client';

export type ProductGridStyle = 'minimal' | 'commerce' | 'compact' | 'magazine' | 'catalog' | 'mosaic' | 'tabbed' | 'storefront';

export type ProductGridSortBy = 'newest' | 'bestseller' | 'random';

export type ProductGridSelectionMode = 'category' | 'auto' | 'manual' | 'demo';

export { type DemoProductItem } from '../../product-list/_types';
export { type ProductListCardRadius as ProductGridCardRadius } from '../../product-list/_types';

export interface ProductGridConfig {
  itemCount: number;
  desktopRows?: number;
  sortBy: ProductGridSortBy;
  selectionMode: ProductGridSelectionMode;
  selectedProductIds: string[];
  demoProducts?: import('../../product-list/_types').DemoProductItem[];
  subTitle: string;
  sectionTitle: string;
  style: ProductGridStyle;
  showCategoryTabs?: boolean;
  categoryTabIds?: string[];
  desktopColumns?: 3 | 4 | 5 | 6;
  spacing?: import('../../_shared/types/sectionSpacing').SectionSpacing;
  cornerRadius?: import('../../product-list/_types').ProductListCardRadius;
  cardRadius?: import('../../product-list/_types').ProductListCardRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  showAddToCartButton?: boolean;
  showBuyNowButton?: boolean;
  cartButtonsLayout?: 'stack' | 'grid-2';
}
