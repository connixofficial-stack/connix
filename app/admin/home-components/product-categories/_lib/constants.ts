'use client';

import type { DemoProductCategoryItem } from '../_types';
import type { CustomImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import type { ProductCategoriesStyle } from '../_types';

export const PRODUCT_CATEGORIES_STYLES = [
  { id: 'image-strip' as const, label: '(1) Dải ảnh' },
  { id: 'carousel' as const, label: '(2) Trượt ngang' },
  { id: 'cards' as const, label: '(3) Dạng thẻ' },
  { id: 'marquee' as const, label: '(4) Chạy chữ' },
  { id: 'circular' as const, label: '(5) Ảnh tròn' },
  { id: 'icon-grid' as const, label: '(6) Lưới icon' },
  { id: 'mosaic' as const, label: '(7) Ô ghép' },
  { id: 'compact-grid' as const, label: '(8) Thu gọn' },
  { id: 'grid' as const, label: '(9) Lưới chuẩn' },
  { id: 'grid-10' as const, label: '(10) Thẻ nổi' },
  { id: 'grid-11' as const, label: '(11) Bo viền' },
];

export const PRODUCT_CATEGORIES_CROP_ASPECT_RATIOS: Record<ProductCategoriesStyle, CustomImageAspectRatio> = {
  cards: { cssValue: '3 / 4', label: '3:4', value: 3 / 4 },
  carousel: { cssValue: '3 / 4', label: '3:4', value: 3 / 4 },
  circular: { cssValue: '1 / 1', label: '1:1', value: 1 },
  'compact-grid': { cssValue: '1 / 1', label: '1:1', value: 1 },
  grid: { cssValue: '1 / 1', label: '1:1', value: 1 },
  'image-strip': { cssValue: '1 / 1', label: '1:1', value: 1 },
  'icon-grid': { cssValue: '1 / 1', label: '1:1', value: 1 },
  marquee: { cssValue: '1 / 1', label: '1:1', value: 1 },
  mosaic: { cssValue: '1 / 1', label: '1:1', value: 1 },
  'grid-10': { cssValue: '1 / 1', label: '1:1', value: 1 },
  'grid-11': { cssValue: '1 / 1', label: '1:1', value: 1 },
};

export const getProductCategoriesCropAspectRatio = (style: ProductCategoriesStyle): CustomImageAspectRatio =>
  PRODUCT_CATEGORIES_CROP_ASPECT_RATIOS[style] ?? PRODUCT_CATEGORIES_CROP_ASPECT_RATIOS.grid;

export const DEFAULT_DEMO_PRODUCT_CATEGORIES: DemoProductCategoryItem[] = [
  { id: 'demo-1', name: 'Điện thoại & Phụ kiện', image: '/demo/categories/phone.png', productCount: 128, link: '/dien-thoai-phu-kien' },
  { id: 'demo-2', name: 'Laptop & Máy tính', image: '/demo/categories/laptop.png', productCount: 85, link: '/laptop-may-tinh' },
  { id: 'demo-3', name: 'Thời trang Nam', image: '/demo/categories/men-fashion.png', productCount: 256, link: '/thoi-trang-nam' },
  { id: 'demo-4', name: 'Thời trang Nữ', image: '/demo/categories/women-fashion.png', productCount: 312, link: '/thoi-trang-nu' },
  { id: 'demo-5', name: 'Đồ gia dụng', image: '/demo/categories/home.png', productCount: 167, link: '/do-gia-dung' },
  { id: 'demo-6', name: 'Mỹ phẩm & Làm đẹp', image: '/demo/categories/beauty.png', productCount: 94, link: '/my-pham-lam-dep' },
  { id: 'demo-7', name: 'Đồng hồ & Trang sức', image: '/demo/categories/watch.png', productCount: 73, link: '/dong-ho-trang-suc' },
  { id: 'demo-8', name: 'Giày dép', image: '/demo/categories/shoes.png', productCount: 189, link: '/giay-dep' },
  { id: 'demo-9', name: 'Thể thao & Dã ngoại', image: '/demo/categories/sports.png', productCount: 142, link: '/the-thao-da-ngoai' },
  { id: 'demo-10', name: 'Sách & Văn phòng phẩm', image: '/demo/categories/books.png', productCount: 204, link: '/sach-van-phong-pham' },
  { id: 'demo-11', name: 'Đồ chơi trẻ em', image: '/demo/categories/toys.png', productCount: 118, link: '/do-choi-tre-em' },
  { id: 'demo-12', name: 'Thực phẩm & Đồ uống', image: '/demo/categories/food.png', productCount: 276, link: '/thuc-pham-do-uong' },
  { id: 'demo-13', name: 'Nội thất', image: '/demo/categories/furniture.png', productCount: 63, link: '/noi-that' },
  { id: 'demo-14', name: 'Sức khỏe', image: '/demo/categories/health.png', productCount: 97, link: '/suc-khoe' },
  { id: 'demo-15', name: 'Phụ kiện ô tô', image: '/demo/categories/auto.png', productCount: 54, link: '/phu-kien-o-to' },
  { id: 'demo-16', name: 'Máy ảnh & Quay phim', image: '/demo/categories/camera.png', productCount: 41, link: '/may-anh-quay-phim' },
  { id: 'demo-17', name: 'Âm thanh & Tai nghe', image: '/demo/categories/audio.png', productCount: 86, link: '/am-thanh-tai-nghe' },
  { id: 'demo-18', name: 'Đồ dùng nhà bếp', image: '/demo/categories/kitchen.png', productCount: 153, link: '/do-dung-nha-bep' },
];
