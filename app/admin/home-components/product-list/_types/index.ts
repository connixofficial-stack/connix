export type ProductListStyle = 'minimal' | 'commerce' | 'bento' | 'carousel' | 'wine-carousel' | 'compact' | 'showcase' | 'lookbook';

export type ProductListBrandMode = 'single' | 'dual';
export type ProductListHarmony = 'analogous' | 'complementary' | 'triadic';
export type ProductListCardRadius = 'none' | 'sm' | 'lg';
export type ProductListDesktopColumns = 3 | 4;


export interface ProductListPreviewItem {
  id: string | number;
  name: string;
  slug?: string | null;
  image?: string;
  price?: string;
  priceValue?: number;
  originalPrice?: string;
  salePriceValue?: number;
  stock?: number;
  hasVariants?: boolean;
  description?: string;
  category?: string;
  categoryId?: string;
  tag?: 'new' | 'hot' | 'sale';
}

export type ProductSelectionMode = 'auto' | 'manual' | 'demo';

export interface ProductListConfig {
  itemCount: number;
  sortBy: string;
  harmony?: ProductListHarmony;
  cornerRadius?: ProductListCardRadius;
  cardRadius?: ProductListCardRadius;
  spacing?: 'normal' | 'compact' | 'none';
  desktopColumns?: ProductListDesktopColumns;
  lookbookDesktopColumns?: 3 | 4;
  showAddToCartButton?: boolean;
  showBuyNowButton?: boolean;
  cartButtonsLayout?: 'stack' | 'grid-2';
}

export interface ProductListTextConfig {
  subTitle: string;
  sectionTitle: string;
}

export interface DemoProductItem {
  id: string;
  name: string;
  image?: string;
  storageId?: string;
  price?: string;
  originalPrice?: string;
  description?: string;
  category?: string;
  tag?: 'new' | 'hot' | 'sale' | '';
  link?: string;
}

export const DEFAULT_PRODUCT_LIST_CARD_RADIUS: ProductListCardRadius = 'lg';
export const DEFAULT_PRODUCT_LIST_DESKTOP_COLUMNS: ProductListDesktopColumns = 4;

export const normalizeProductListCardRadius = (value: unknown, noBorderRadius?: unknown): ProductListCardRadius => {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  if (value === 'md') {
    return 'lg';
  }

  return DEFAULT_PRODUCT_LIST_CARD_RADIUS;
};

export const normalizeProductListDesktopColumns = (value: unknown): ProductListDesktopColumns => {
  return value === 3 ? 3 : DEFAULT_PRODUCT_LIST_DESKTOP_COLUMNS;
};

export const getProductListCardRadiusClassName = (value: ProductListCardRadius = DEFAULT_PRODUCT_LIST_CARD_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-2xl';
};

export const getProductListImageRadiusClassName = (value: ProductListCardRadius = DEFAULT_PRODUCT_LIST_CARD_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-sm';
  }

  return 'rounded-xl';
};
