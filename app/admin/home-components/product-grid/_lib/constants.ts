'use client';

import type { DemoProductItem } from '../../product-list/_types';
import type { ProductGridConfig, ProductGridStyle } from '../_types';
import { DEFAULT_SECTION_SPACING } from '../../_shared/types/sectionSpacing';
import { DEFAULT_PRODUCT_LIST_CARD_RADIUS } from '../../product-list/_types';

export const PRODUCT_GRID_STYLES: { id: ProductGridStyle; label: string }[] = [
  { id: 'commerce', label: '(1) Thương mại' },
  { id: 'minimal', label: '(2) Tối giản' },
  { id: 'compact', label: '(3) Thu gọn' },
  { id: 'magazine', label: '(4) Tạp chí' },
  { id: 'catalog', label: '(5) Danh mục' },
  { id: 'mosaic', label: '(6) So le' },
  { id: 'tabbed', label: '(7) Phân tab' },
  { id: 'storefront', label: '(8) Cửa hiệu' },
];

export const DEFAULT_PRODUCT_GRID_CONFIG: ProductGridConfig = {
  itemCount: 8,
  desktopRows: 2,
  sectionTitle: 'Sản phẩm nổi bật',
  selectedProductIds: [],
  selectionMode: 'category',
  sortBy: 'newest',
  spacing: DEFAULT_SECTION_SPACING,
  style: 'commerce',
  subTitle: 'Bộ sưu tập',
  cornerRadius: DEFAULT_PRODUCT_LIST_CARD_RADIUS,
  cardRadius: DEFAULT_PRODUCT_LIST_CARD_RADIUS,
  noBorderRadius: false,
  noVerticalMargin: false,
  showAddToCartButton: true,
  showBuyNowButton: true,
  cartButtonsLayout: 'stack',
};

/** Backward compat: map old styles → new */
export function resolveGridStyle(raw?: string): ProductGridStyle {
  if (!raw) return 'commerce';
  const valid: ProductGridStyle[] = ['minimal', 'commerce', 'compact', 'magazine', 'catalog', 'mosaic', 'tabbed', 'storefront'];
  if (valid.includes(raw as ProductGridStyle)) return raw as ProductGridStyle;
  // Legacy fallback
  return 'commerce';
}

export const DEFAULT_GRID_DEMO_PRODUCTS: DemoProductItem[] = [
  { id: 'demo-1', name: 'Thùng carton 3 lớp', image: '/demo/products/product-1.png', price: '25.000đ', originalPrice: '30.000đ', category: 'Thùng carton', tag: 'sale' },
  { id: 'demo-2', name: 'Thùng carton 5 lớp', image: '/demo/products/product-2.png', price: '45.000đ', category: 'Thùng carton', tag: 'new' },
  { id: 'demo-3', name: 'Seal niêm phong', image: '/demo/products/product-3.png', price: '8.000đ', originalPrice: '12.000đ', category: 'Seal niêm phong', tag: 'sale' },
  { id: 'demo-4', name: 'Seal bảo mật', image: '/demo/products/product-4.png', price: '15.000đ', category: 'Seal niêm phong', tag: 'hot' },
  { id: 'demo-5', name: 'Băng keo OPP', image: '/demo/products/product-5.png', price: '35.000đ', originalPrice: '40.000đ', category: 'Vật liệu đóng gói', tag: 'sale' },
  { id: 'demo-6', name: 'Màng PE co nhiệt', image: '/demo/products/product-6.png', price: '120.000đ', category: 'Vật liệu đóng gói', tag: '' },
  { id: 'demo-7', name: 'Túi zip lock', image: '/demo/products/product-7.png', price: '50.000đ', category: 'Túi đựng', tag: 'new' },
  { id: 'demo-8', name: 'Túi PE trong', image: '/demo/products/product-8.png', price: '30.000đ', originalPrice: '35.000đ', category: 'Túi đựng', tag: '' },
];
