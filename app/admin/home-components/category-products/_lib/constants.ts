import { DEFAULT_SECTION_SPACING } from '../../_shared/types/sectionSpacing';
import { DEFAULT_CATEGORY_PRODUCTS_CORNER_RADIUS, type CategoryProductsConfig, type DemoCategoryProductsSection } from '../_types';

export const CATEGORY_PRODUCTS_STYLES = [
  { id: 'grid', label: '(1) Dạng lưới' },
  { id: 'carousel', label: '(2) Trượt ngang' },
  { id: 'cards', label: '(3) Dạng thẻ' },
  { id: 'bento', label: '(4) Ô ghép' },
  { id: 'magazine', label: '(5) Tạp chí' },
  { id: 'showcase', label: '(6) Trưng bày' },
  { id: 'wine-grid', label: '(7) Lưới dọc' },
];

export const DEFAULT_CATEGORY_PRODUCTS_CONFIG: CategoryProductsConfig = {
  columnsDesktop: 4,
  columnsMobile: 2,
  demoSections: [],
  sections: [],
  selectionMode: 'real',
  showViewAll: true,
  spacing: DEFAULT_SECTION_SPACING,
  style: 'grid',
  cornerRadius: DEFAULT_CATEGORY_PRODUCTS_CORNER_RADIUS,
};

export const DEFAULT_DEMO_CATEGORY_PRODUCTS_SECTIONS: DemoCategoryProductsSection[] = [
  {
    categoryImage: '/demo/categories/phone.png',
    categoryName: 'Điện thoại nổi bật',
    id: 'demo-section-1',
    products: [
      { id: 'demo-1-1', image: '/demo/products/product-1.png', name: 'iPhone 15 Pro Max', price: 34990000, salePrice: 32990000 },
      { id: 'demo-1-2', image: '/demo/products/product-2.png', name: 'Samsung Galaxy S24 Ultra', price: 28990000 },
      { id: 'demo-1-3', image: '/demo/products/product-3.png', name: 'Xiaomi 14 Ultra', price: 23990000, salePrice: 21990000 },
      { id: 'demo-1-4', image: '/demo/products/product-4.png', name: 'OPPO Find X7', price: 18990000 },
    ],
  },
  {
    categoryImage: '/demo/categories/laptop.png',
    categoryName: 'Laptop làm việc',
    id: 'demo-section-2',
    products: [
      { id: 'demo-2-1', image: '/demo/products/product-5.png', name: 'MacBook Pro M3', price: 45990000 },
      { id: 'demo-2-2', image: '/demo/products/product-6.png', name: 'Dell XPS 13 Plus', price: 32990000, salePrice: 30990000 },
      { id: 'demo-2-3', image: '/demo/products/product-7.png', name: 'ASUS Zenbook OLED', price: 24990000 },
      { id: 'demo-2-4', image: '/demo/products/product-8.png', name: 'Lenovo ThinkPad X1', price: 38990000 },
    ],
  },
];
