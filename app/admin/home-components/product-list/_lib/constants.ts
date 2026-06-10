import { DEFAULT_PRODUCT_LIST_CARD_RADIUS, DEFAULT_PRODUCT_LIST_DESKTOP_COLUMNS, type DemoProductItem, type ProductListConfig, type ProductListStyle, type ProductListTextConfig } from '../_types';

export const PRODUCT_LIST_STYLES: { id: ProductListStyle; label: string }[] = [
  { id: 'commerce', label: '(1) Thương mại' },
  { id: 'minimal', label: '(2) Tối giản' },
  { id: 'bento', label: '(3) Ô ghép' },
  { id: 'carousel', label: '(4) Trượt ngang' },
  { id: 'wine-carousel', label: '(5) Trượt ngang 2' },
  { id: 'compact', label: '(6) Thu gọn' },
  { id: 'showcase', label: '(7) Trưng bày' },
  { id: 'lookbook', label: '(8) Gắn điểm' },
];

export const PRODUCT_LIST_LOOKBOOK_BANNERS = [
  {
    title: 'Máy Scott Slimissimo',
    image: 'https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/banner_coll_1_1.jpg?1778581786863',
    hoverImage: 'https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/banner_coll_1_1_hover.png?1778581786863',
  },
  {
    title: 'Máy DeLonghi EC685.M',
    image: 'https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/banner_coll_1_2.jpg?1778581786863',
    hoverImage: 'https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/banner_coll_1_2_hover.png?1778581786863',
  },
  {
    title: 'Máy Gemilai CRM3605',
    image: 'https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/banner_coll_1_3.jpg?1778581786863',
    hoverImage: 'https://bizweb.dktcdn.net/100/485/374/themes/945619/assets/banner_coll_1_3_hover.png?1778581786863',
  },
] as const;

export const normalizeProductListStyle = (value: unknown): ProductListStyle => {
  if (
    value === 'minimal'
    || value === 'commerce'
    || value === 'bento'
    || value === 'carousel'
    || value === 'wine-carousel'
    || value === 'compact'
    || value === 'showcase'
    || value === 'lookbook'
  ) {
    return value;
  }

  return 'commerce';
};

export const DEFAULT_PRODUCT_LIST_CONFIG: ProductListConfig = {
  cardRadius: DEFAULT_PRODUCT_LIST_CARD_RADIUS,
  desktopColumns: DEFAULT_PRODUCT_LIST_DESKTOP_COLUMNS,
  itemCount: 8,
  lookbookDesktopColumns: DEFAULT_PRODUCT_LIST_DESKTOP_COLUMNS,
  sortBy: 'newest',
  showAddToCartButton: true,
  showBuyNowButton: true,
  cartButtonsLayout: 'stack',
};

export const DEFAULT_PRODUCT_LIST_TEXT: ProductListTextConfig = {
  subTitle: 'Bộ sưu tập',
  sectionTitle: 'Sản phẩm nổi bật',
};

export const DEFAULT_DEMO_PRODUCTS: DemoProductItem[] = [
  { id: 'demo-1', name: 'iPhone 15 Pro Max', image: '/demo/products/product-1.png', price: '34.990.000đ', originalPrice: '36.990.000đ', category: 'Smartphone', tag: 'new' },
  { id: 'demo-2', name: 'MacBook Pro M3', image: '/demo/products/product-2.png', price: '45.990.000đ', category: 'Laptop', tag: '' },
  { id: 'demo-3', name: 'Sony WH-1000XM5', image: '/demo/products/product-3.png', price: '8.490.000đ', originalPrice: '9.290.000đ', category: 'Audio', tag: 'sale' },
  { id: 'demo-4', name: 'Apple Watch Ultra 2', image: '/demo/products/product-4.png', price: '21.990.000đ', category: 'Wearable', tag: 'new' },
  { id: 'demo-5', name: 'iPad Air 5 M1', image: '/demo/products/product-5.png', price: '14.990.000đ', originalPrice: '16.500.000đ', category: 'Tablet', tag: 'sale' },
  { id: 'demo-6', name: 'Marshall Stanmore III', image: '/demo/products/product-6.png', price: '9.890.000đ', category: 'Audio', tag: '' },
  { id: 'demo-7', name: 'Logitech MX Master 3S', image: '/demo/products/product-7.png', price: '2.490.000đ', category: 'Accessories', tag: '' },
  { id: 'demo-8', name: 'Fujifilm X-T5', image: '/demo/products/product-8.png', price: '42.990.000đ', originalPrice: '45.000.000đ', category: 'Camera', tag: 'hot' },
];
