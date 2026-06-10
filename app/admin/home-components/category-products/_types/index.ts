import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
export type CategoryProductsStyle = 'grid' | 'carousel' | 'cards' | 'bento' | 'magazine' | 'showcase' | 'wine-grid';
export type CategoryProductsBrandMode = 'single' | 'dual';
export type CategoryProductsHarmony = 'analogous' | 'complementary' | 'triadic';
export type CategoryProductsSelectionMode = 'real' | 'demo';
export type CategoryProductsCornerRadius = 'none' | 'sm' | 'lg';

export interface CategoryProductsSection {
  id: number;
  categoryId: string;
  itemCount: number;
}

export interface CategoryProductsConfig {
  sections: CategoryProductsSection[];
  style: CategoryProductsStyle;
  showViewAll: boolean;
  columnsDesktop: 3 | 4;
  columnsMobile?: number;
  harmony?: CategoryProductsHarmony;
  spacing?: SectionSpacing;
  cornerRadius?: CategoryProductsCornerRadius;
  selectionMode?: CategoryProductsSelectionMode;
  demoSections?: DemoCategoryProductsSection[];
  showAddToCartButton?: boolean;
  showBuyNowButton?: boolean;
  cartButtonsLayout?: 'stack' | 'grid-2';
}

export interface CategoryProductsProduct {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  salePrice?: number;
  categoryId?: string;
  hasVariants?: boolean;
}

export interface DemoCategoryProduct {
  id: string;
  name: string;
  image?: string;
  storageId?: string;
  price?: number;
  salePrice?: number;
}

export interface DemoCategoryProductsSection {
  id: string;
  categoryName: string;
  categoryImage?: string;
  categoryImageStorageId?: string | null;
  products: DemoCategoryProduct[];
}

export const DEFAULT_CATEGORY_PRODUCTS_CORNER_RADIUS: CategoryProductsCornerRadius = 'lg';

export const normalizeCategoryProductsCornerRadius = (value: unknown): CategoryProductsCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_CATEGORY_PRODUCTS_CORNER_RADIUS;
};

export const normalizeCategoryProductsDesktopColumns = (value: unknown): 3 | 4 => (
  value === 3 ? 3 : 4
);

export const getCategoryProductsResponsiveColumns = (columnsDesktop: unknown) => {
  const desktop = normalizeCategoryProductsDesktopColumns(columnsDesktop);

  return {
    desktop,
    mobile: desktop === 4 ? 2 : 1,
    tablet: desktop === 4 ? 2 : 3,
  };
};

export const getCategoryProductsResponsiveGridClassName = (columnsDesktop: unknown) => {
  const { desktop } = getCategoryProductsResponsiveColumns(columnsDesktop);

  return desktop === 3
    ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3'
    : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4';
};

export const getCategoryProductsPreviewGridClassName = (
  columnsDesktop: unknown,
  device: 'mobile' | 'tablet' | 'desktop'
) => {
  const { desktop, mobile, tablet } = getCategoryProductsResponsiveColumns(columnsDesktop);
  const columns = device === 'mobile' ? mobile : device === 'tablet' ? tablet : desktop;

  if (columns === 1) {
    return 'grid-cols-1';
  }

  if (columns === 3) {
    return 'grid-cols-3';
  }

  return columns === 4 ? 'grid-cols-4' : 'grid-cols-2';
};

export const getCategoryProductsCardRadiusClassName = (value: CategoryProductsCornerRadius = DEFAULT_CATEGORY_PRODUCTS_CORNER_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-2xl';
};

export const getCategoryProductsImageRadiusClassName = (value: CategoryProductsCornerRadius = DEFAULT_CATEGORY_PRODUCTS_CORNER_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-sm';
  }

  return 'rounded-xl';
};
