export type SeedCategory = 'content' | 'commerce' | 'user' | 'system' | 'marketing';

export interface SeedModuleMetadata {
  category: SeedCategory;
  defaultQuantity: number;
  description: string;
  name: string;
}

export interface SeedModuleInfo extends SeedModuleMetadata {
  key: string;
}

export const SEED_CATEGORY_LABELS: Record<SeedCategory, string> = {
  commerce: 'Commerce',
  content: 'Content',
  marketing: 'Marketing',
  system: 'System',
  user: 'Users',
};

export const SEED_MODULE_METADATA: Record<string, SeedModuleMetadata> = {
  adminModules: {
    category: 'system',
    defaultQuantity: 0,
    description: 'Danh sách module hệ thống',
    name: 'Admin Modules',
  },
  analytics: {
    category: 'marketing',
    defaultQuantity: 30,
    description: 'Thống kê và báo cáo',
    name: 'Analytics',
  },
  subscriptions: {
    category: 'system',
    defaultQuantity: 12,
    description: 'Quản lý gia hạn subscription',
    name: 'Subscriptions',
  },
  cart: {
    category: 'commerce',
    defaultQuantity: 10,
    description: 'Giỏ hàng',
    name: 'Cart',
  },
  comments: {
    category: 'content',
    defaultQuantity: 50,
    description: 'Bình luận và đánh giá',
    name: 'Comments',
  },
  contactInbox: {
    category: 'system',
    defaultQuantity: 0,
    description: 'Tin nhắn liên hệ từ website',
    name: 'Tin nhắn liên hệ',
  },
  courseCategories: {
    category: 'content',
    defaultQuantity: 5,
    description: 'Danh mục khóa học',
    name: 'Course Categories',
  },
  courses: {
    category: 'content',
    defaultQuantity: 15,
    description: 'Khóa học và chương/bài học',
    name: 'Courses',
  },
  customers: {
    category: 'user',
    defaultQuantity: 20,
    description: 'Khách hàng',
    name: 'Customers',
  },
  homepage: {
    category: 'system',
    defaultQuantity: 6,
    description: 'Sections trang chủ',
    name: 'Homepage',
  },
  kanban: {
    category: 'system',
    defaultQuantity: 1,
    description: 'Bảng Kanban quản lý công việc nội bộ',
    name: 'Kanban Board',
  },
  media: {
    category: 'content',
    defaultQuantity: 20,
    description: 'Thư viện media',
    name: 'Media',
  },
  menus: {
    category: 'system',
    defaultQuantity: 3,
    description: 'Menu điều hướng',
    name: 'Menus',
  },
  notifications: {
    category: 'marketing',
    defaultQuantity: 10,
    description: 'Thông báo',
    name: 'Notifications',
  },
  orders: {
    category: 'commerce',
    defaultQuantity: 30,
    description: 'Đơn hàng',
    name: 'Orders',
  },
  postCategories: {
    category: 'content',
    defaultQuantity: 5,
    description: 'Danh mục bài viết',
    name: 'Post Categories',
  },
  posts: {
    category: 'content',
    defaultQuantity: 20,
    description: 'Bài viết',
    name: 'Posts',
  },
  productCategories: {
    category: 'commerce',
    defaultQuantity: 5,
    description: 'Danh mục sản phẩm',
    name: 'Product Categories',
  },
  products: {
    category: 'commerce',
    defaultQuantity: 50,
    description: 'Sản phẩm',
    name: 'Products',
  },
  projectCategories: {
    category: 'content',
    defaultQuantity: 5,
    description: 'Danh mục dự án',
    name: 'Project Categories',
  },
  projects: {
    category: 'content',
    defaultQuantity: 15,
    description: 'Dự án, video giới thiệu và thư viện ảnh',
    name: 'Projects',
  },
  resourceCategories: {
    category: 'content',
    defaultQuantity: 5,
    description: 'Danh mục tài nguyên',
    name: 'Resource Categories',
  },
  resources: {
    category: 'content',
    defaultQuantity: 15,
    description: 'Thư viện tài nguyên tải xuống',
    name: 'Resources',
  },
  promotions: {
    category: 'marketing',
    defaultQuantity: 5,
    description: 'Mã giảm giá',
    name: 'Promotions',
  },
  roles: {
    category: 'user',
    defaultQuantity: 4,
    description: 'Vai trò và quyền',
    name: 'Roles',
  },
  serviceCategories: {
    category: 'content',
    defaultQuantity: 5,
    description: 'Danh mục dịch vụ',
    name: 'Service Categories',
  },
  services: {
    category: 'content',
    defaultQuantity: 15,
    description: 'Dịch vụ',
    name: 'Services',
  },
  settings: {
    category: 'system',
    defaultQuantity: 15,
    description: 'Cài đặt hệ thống',
    name: 'Settings',
  },
  systemPresets: {
    category: 'system',
    defaultQuantity: 0,
    description: 'Preset hệ thống',
    name: 'System Presets',
  },
  users: {
    category: 'user',
    defaultQuantity: 10,
    description: 'Người dùng admin',
    name: 'Users',
  },
  wishlist: {
    category: 'commerce',
    defaultQuantity: 15,
    description: 'Sản phẩm yêu thích',
    name: 'Wishlist',
  },
};

export function getSeedModuleInfo(moduleKey: string): SeedModuleMetadata | null {
  return SEED_MODULE_METADATA[moduleKey] ?? null;
}

export function getSeedModuleList(): SeedModuleInfo[] {
  return Object.entries(SEED_MODULE_METADATA).map(([key, meta]) => ({
    key,
    ...meta,
  }));
}
