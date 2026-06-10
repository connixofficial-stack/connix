import type {
  DataScale,
  SaleMode,
  WizardState,
} from './types';

export type ExtraFeatureOption = {
  description: string;
  key: string;
  label: string;
  requiredProducts?: boolean;
  requiredPosts?: boolean;
  requiredServices?: boolean;
  modules: string[];
};

export type WebsiteTypeOption = {
  description: string;
  key: WizardState['websiteType'];
  label: string;
  modules: string[];
};

export type VariantPresetExample = {
  example: string;
  key: string;
  label: string;
};

const CORE_MODULES = ['settings', 'menus', 'homepage', 'media', 'users', 'roles', 'analytics'];

export const WEBSITE_TYPE_OPTIONS: WebsiteTypeOption[] = [
  {
    description: 'Website giới thiệu đơn giản (không cần quản trị nội dung phức tạp).',
    key: 'landing',
    label: 'Chỉ giới thiệu',
    modules: [...CORE_MODULES],
  },
  {
    description: 'Blog/tin tức với bài viết, danh mục, bình luận.',
    key: 'blog',
    label: 'Viết blog/tin tức',
    modules: [...CORE_MODULES, 'posts', 'postCategories', 'comments'],
  },
  {
    description: 'Trưng bày sản phẩm nhưng không có giỏ hàng/đặt mua.',
    key: 'catalog',
    label: 'Trưng bày sản phẩm',
    modules: [...CORE_MODULES, 'products', 'productCategories'],
  },
  {
    description: 'Bán hàng online với giỏ hàng, đơn hàng, thanh toán.',
    key: 'ecommerce',
    label: 'Bán hàng online',
    modules: [...CORE_MODULES, 'products', 'productCategories', 'orders', 'cart', 'customers'],
  },
  {
    description: 'Dịch vụ (salon, tư vấn, sửa chữa) với danh mục dịch vụ.',
    key: 'services',
    label: 'Cung cấp dịch vụ',
    modules: [...CORE_MODULES, 'services', 'serviceCategories'],
  },
];

export const EXTRA_FEATURE_OPTIONS: ExtraFeatureOption[] = [
  {
    description: 'Thêm module bài viết để chia sẻ tin tức, kiến thức.',
    key: 'posts',
    label: 'Bài viết & Blog',
    modules: ['posts', 'postCategories'],
  },
  {
    description: 'Khách có thể comment/rate sản phẩm hoặc bài viết.',
    key: 'comments',
    label: 'Bình luận & Đánh giá',
    modules: ['comments'],
    requiredProducts: false,
    requiredPosts: false,
  },
  {
    description: 'Bật wishlist để khách lưu sản phẩm yêu thích.',
    key: 'wishlist',
    label: 'Yêu thích',
    modules: ['wishlist'],
    requiredProducts: true,
  },
  {
    description: 'Voucher/flash sale/combo cho sản phẩm.',
    key: 'promotions',
    label: 'Mã giảm giá',
    modules: ['promotions'],
    requiredProducts: true,
  },
  {
    description: 'Gửi notification cho khách hàng.',
    key: 'notifications',
    label: 'Thông báo',
    modules: ['notifications'],
  },
  {
    description: 'Ngoài sản phẩm còn cung cấp dịch vụ.',
    key: 'services',
    label: 'Dịch vụ',
    modules: ['services', 'serviceCategories'],
  },
  {
    description: 'Quản lý công việc nội bộ theo dạng Kanban.',
    key: 'kanban',
    label: 'Kanban nội bộ',
    modules: ['kanban'],
  },
  {
    description: 'Theo dõi và nhắc khách gia hạn subscription.',
    key: 'subscriptions',
    label: 'Quản lý gia hạn',
    modules: ['subscriptions'],
  },
];

export const VARIANT_PRESET_EXAMPLES: VariantPresetExample[] = [
  { key: 'size_color', label: 'Size + Màu', example: 'Áo Size S Đỏ, Áo Size M Xanh' },
  { key: 'color_only', label: 'Chỉ Màu', example: 'Ốp lưng Đen, Ốp lưng Trắng' },
  { key: 'size_only', label: 'Chỉ Size', example: 'Găng tay S, Găng tay M' },
  { key: 'storage_color', label: 'Dung lượng + Màu', example: 'iPhone 128GB Đen, 256GB Trắng' },
  { key: 'dimension_material', label: 'Kích thước + Chất liệu', example: 'Bàn 80x60 Gỗ, 100x80 Kim loại' },
  { key: 'volume_shade', label: 'Dung tích + Tone', example: 'Kem 30ml Tone sáng, 50ml Tone tối' },
  { key: 'weight_flavor', label: 'Khối lượng + Hương vị', example: 'Cà phê 250g Vanilla, 500g Mocha' },
  { key: 'duration_package', label: 'Thời hạn + Gói', example: '1 tháng Basic, 1 năm Premium' },
  { key: 'material_color', label: 'Chất liệu + Màu', example: 'Nhẫn Vàng Đen, Bạc Trắng' },
  { key: 'dosage_quantity', label: 'Liều lượng + Số lượng', example: 'Vitamin 500mg 60 viên' },
  { key: 'size_age', label: 'Size + Độ tuổi', example: 'Tã Size S 0-6M, Size M 6-12M' },
];

const SCALE_MODULE_KEYS = [
  'analytics',
  'cart',
  'comments',
  'subscriptions',
  'customers',
  'homepage',
  'kanban',
  'menus',
  'orders',
  'postCategories',
  'posts',
  'productCategories',
  'products',
  'promotions',
  'roles',
  'serviceCategories',
  'services',
  'settings',
  'users',
  'wishlist',
  'notifications',
  'media',
];

const SCALE_QUANTITIES: Record<DataScale, Record<string, number>> = {
  low: {
    analytics: 10,
    cart: 5,
    comments: 10,
    subscriptions: 8,
    customers: 5,
    homepage: 6,
    kanban: 6,
    menus: 2,
    orders: 5,
    postCategories: 3,
    posts: 5,
    productCategories: 3,
    products: 5,
    promotions: 5,
    roles: 4,
    serviceCategories: 3,
    services: 5,
    settings: 15,
    users: 5,
    wishlist: 5,
    notifications: 5,
    media: 10,
  },
  medium: {
    analytics: 30,
    cart: 20,
    comments: 30,
    subscriptions: 14,
    customers: 20,
    homepage: 6,
    kanban: 12,
    menus: 3,
    orders: 20,
    postCategories: 5,
    posts: 15,
    productCategories: 5,
    products: 20,
    promotions: 10,
    roles: 4,
    serviceCategories: 5,
    services: 15,
    settings: 15,
    users: 10,
    wishlist: 15,
    notifications: 10,
    media: 20,
  },
  high: {
    analytics: 60,
    cart: 50,
    comments: 80,
    subscriptions: 20,
    customers: 50,
    homepage: 6,
    kanban: 20,
    menus: 4,
    orders: 50,
    postCategories: 6,
    posts: 30,
    productCategories: 8,
    products: 50,
    promotions: 20,
    roles: 4,
    serviceCategories: 6,
    services: 25,
    settings: 15,
    users: 12,
    wishlist: 30,
    notifications: 20,
    media: 30,
  },
  none: Object.fromEntries(SCALE_MODULE_KEYS.map((key) => [key, 0])),
};

const SCALE_SUMMARY_ITEMS: Array<{ key: string; label: string }> = [
  { key: 'products', label: 'Sản phẩm' },
  { key: 'productCategories', label: 'Danh mục SP' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'customers', label: 'Khách hàng' },
  { key: 'posts', label: 'Bài viết' },
  { key: 'postCategories', label: 'Danh mục bài viết' },
  { key: 'services', label: 'Dịch vụ' },
  { key: 'serviceCategories', label: 'Danh mục dịch vụ' },
  { key: 'comments', label: 'Bình luận' },
  { key: 'promotions', label: 'Khuyến mãi' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'kanban', label: 'Kanban' },
  { key: 'subscriptions', label: 'Gia hạn' },
];

export function getBaseModules(websiteType: WizardState['websiteType']): string[] {
  return WEBSITE_TYPE_OPTIONS.find((option) => option.key === websiteType)?.modules ?? [];
}

export function applySaleModeOverrides(modules: Set<string>, saleMode: SaleMode): void {
  if (saleMode === 'contact') {
    modules.delete('cart');
    modules.delete('orders');
    modules.delete('wishlist');
    modules.delete('promotions');
  }

  if (saleMode === 'affiliate') {
    modules.delete('cart');
    modules.delete('orders');
  }
}

export function buildModuleSelection(state: WizardState): string[] {
  const modules = new Set(getBaseModules(state.websiteType));

  for (const feature of state.extraFeatures) {
    const option = EXTRA_FEATURE_OPTIONS.find((item) => item.key === feature);
    if (option) {
      option.modules.forEach((moduleKey) => modules.add(moduleKey));
    }
  }

  if (modules.has('products')) {
    modules.add('productCategories');
  }

  if (modules.has('posts')) {
    modules.add('postCategories');
  }

  if (modules.has('services')) {
    modules.add('serviceCategories');
  }

  if (modules.has('orders') || modules.has('cart') || modules.has('wishlist')) {
    modules.add('customers');
    modules.add('products');
    modules.add('productCategories');
  }

  if (modules.has('promotions')) {
    modules.add('products');
    modules.add('productCategories');
  }

  if (modules.has('comments') && !modules.has('posts') && !modules.has('products')) {
    modules.delete('comments');
  }

  if (modules.has('products')) {
    applySaleModeOverrides(modules, state.saleMode);
  }

  return Array.from(modules);
}

export function buildSeedConfigs(
  selectedModules: string[],
  scale: DataScale,
  industryKey?: string | null,
  selectedLogo?: string | null,
  useSeedMauImages?: boolean
) {
  if (scale === 'none') {
    return [];
  }
  const quantities = SCALE_QUANTITIES[scale];
  const canSeedAnalytics = selectedModules.includes('orders')
    || selectedModules.includes('customers')
    || selectedModules.includes('products');
  return selectedModules
    .filter((moduleKey) => quantities[moduleKey] !== undefined)
    .map((moduleKey) => ({
      industryKey: industryKey ?? undefined,
      module: moduleKey,
      quantity: moduleKey === 'analytics' && !canSeedAnalytics
        ? 0
        : quantities[moduleKey],
      selectedLogo: moduleKey === 'homepage' ? selectedLogo ?? undefined : undefined,
      useSeedMauImages,
    }));
}

export function getScaleSummary(selectedModules: string[], scale: DataScale) {
  if (scale === 'none') {
    return [];
  }
  const quantities = SCALE_QUANTITIES[scale];
  const moduleSet = new Set(selectedModules);
  return SCALE_SUMMARY_ITEMS
    .filter((item) => moduleSet.has(item.key))
    .map((item) => ({
      label: item.label,
      value: quantities[item.key],
    }));
}
