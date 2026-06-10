import { BaseSeeder, type SeedConfig, type SeedDependency, type SeedResult } from './base';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type AdminModuleData = Omit<Doc<'adminModules'>, '_creationTime' | '_id'>;

export class AdminModulesSeeder extends BaseSeeder<AdminModuleData> {
  moduleName = 'adminModules';
  tableName = 'adminModules';
  dependencies: SeedDependency[] = [];

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig): Promise<SeedResult> {
    const startTime = Date.now();
    this.config = { batchSize: 50, dependencies: true, force: false, ...config };

    if (this.config.force) {
      await this.clear();
    }

    const modules: AdminModuleData[] = [
      { category: 'content', description: 'Quản lý bài viết, tin tức, blog và danh mục bài viết', enabled: true, icon: 'FileText', isCore: false, key: 'posts', name: 'Bài viết & Danh mục', order: 1 },
      { category: 'content', dependencies: ['posts', 'products'], dependencyType: 'any', description: 'Bình luận và đánh giá cho bài viết, sản phẩm', enabled: true, icon: 'MessageSquare', isCore: false, key: 'comments', name: 'Bình luận và đánh giá', order: 2 },
      { category: 'content', description: 'Quản lý hình ảnh, video, tài liệu', enabled: true, icon: 'Image', isCore: false, key: 'media', name: 'Thư viện Media', order: 3 },
      { category: 'commerce', description: 'Quản lý sản phẩm, danh mục sản phẩm, kho hàng', enabled: true, icon: 'Package', isCore: false, key: 'products', name: 'Sản phẩm & Danh mục', order: 4 },
      { category: 'commerce', dependencies: ['products', 'customers'], dependencyType: 'all', description: 'Quản lý đơn hàng, vận chuyển', enabled: true, icon: 'ShoppingBag', isCore: false, key: 'orders', name: 'Đơn hàng', order: 5 },
      { category: 'commerce', dependencies: ['products'], dependencyType: 'all', description: 'Chức năng giỏ hàng cho khách đã đăng nhập', enabled: true, icon: 'ShoppingCart', isCore: false, key: 'cart', name: 'Giỏ hàng', order: 6 },
      { category: 'commerce', dependencies: ['products', 'customers'], dependencyType: 'all', description: 'Danh sách sản phẩm yêu thích của khách', enabled: false, icon: 'Heart', isCore: false, key: 'wishlist', name: 'Sản phẩm yêu thích', order: 7 },
      { category: 'user', description: 'Quản lý thông tin khách hàng', enabled: true, icon: 'Users', isCore: false, key: 'customers', name: 'Khách hàng', order: 8 },
      { category: 'user', description: 'Quản lý tài khoản admin', enabled: true, icon: 'UserCog', isCore: true, key: 'users', name: 'Người dùng Admin', order: 9 },
      { category: 'user', description: 'Phân quyền và quản lý vai trò', enabled: true, icon: 'Shield', isCore: false, key: 'roles', name: 'Vai trò & Quyền', order: 10 },
      { category: 'system', description: 'Cấu hình website và hệ thống', enabled: true, icon: 'Settings', isCore: true, key: 'settings', name: 'Cài đặt hệ thống', order: 11 },
      { category: 'system', description: 'Quản lý menu header, footer', enabled: true, icon: 'Menu', isCore: false, key: 'menus', name: 'Menu điều hướng', order: 12 },
      { category: 'system', description: 'Cấu hình components trang chủ', enabled: true, icon: 'LayoutGrid', isCore: false, key: 'homepage', name: 'Trang chủ', order: 13 },
      { category: 'system', dependencies: ['settings'], dependencyType: 'all', description: 'Lưu trữ và quản lý tin nhắn liên hệ', enabled: true, icon: 'Inbox', isCore: false, key: 'contactInbox', name: 'Tin nhắn liên hệ', order: 14 },
      { category: 'marketing', description: 'Gửi thông báo cho người dùng', enabled: true, icon: 'Bell', isCore: false, key: 'notifications', name: 'Thông báo', order: 15 },
      { category: 'marketing', dependencies: ['products', 'orders'], dependencyType: 'all', description: 'Quản lý mã giảm giá, voucher', enabled: false, icon: 'Megaphone', isCore: false, key: 'promotions', name: 'Khuyến mãi', order: 16 },
      { category: 'marketing', description: 'Báo cáo và phân tích dữ liệu', enabled: true, icon: 'BarChart3', isCore: false, key: 'analytics', name: 'Thống kê', order: 17 },
      { category: 'content', description: 'Quản lý dịch vụ và danh mục dịch vụ', enabled: true, icon: 'Briefcase', isCore: false, key: 'services', name: 'Dịch vụ', order: 18 },
      { category: 'content', description: 'Quản lý dự án, danh mục, video và thư viện ảnh dự án', enabled: true, icon: 'Briefcase', isCore: false, key: 'projects', name: 'Dự án', order: 19 },
      { category: 'content', description: 'Quản lý khóa học, danh mục và nội dung học', enabled: true, icon: 'GraduationCap', isCore: false, key: 'courses', name: 'Khóa học', order: 20 },
      { category: 'content', description: 'Quản lý tài nguyên, danh mục, link tải và quyền truy cập', enabled: true, icon: 'FileText', isCore: false, key: 'resources', name: 'Tài nguyên', order: 21 },
      { category: 'system', description: 'Bảng Kanban quản lý công việc nội bộ', enabled: true, icon: 'LayoutGrid', isCore: false, key: 'kanban', name: 'Kanban Board', order: 22 },
      { category: 'system', description: 'Quản lý gia hạn subscription khách hàng', enabled: true, icon: 'CalendarDays', isCore: false, key: 'subscriptions', name: 'Subscriptions', order: 23 },
    ];

    const existingModules = await this.ctx.db.query('adminModules').take(1000);
    const existingKeys = new Set(existingModules.map((module) => module.key));
    const missingModules = modules.filter((module) => !existingKeys.has(module.key));

    await Promise.all(missingModules.map(module => this.ctx.db.insert('adminModules', module)));

    return {
      created: missingModules.length,
      dependencies: [],
      duration: Date.now() - startTime,
      module: this.moduleName,
      skipped: modules.length - missingModules.length,
    };
  }

  generateFake(): AdminModuleData {
    return {
      category: 'system',
      description: 'Module hệ thống',
      enabled: true,
      icon: 'Settings',
      isCore: true,
      key: 'system',
      name: 'System',
      order: 0,
    };
  }

  validateRecord(record: AdminModuleData): boolean {
    return !!record.key && !!record.name;
  }

  protected async clear(): Promise<void> {
    const modules = await this.ctx.db.query('adminModules').collect();
    await Promise.all(modules.map(module => this.ctx.db.delete(module._id)));
  }
}
