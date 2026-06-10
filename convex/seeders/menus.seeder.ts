/**
 * Menus Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency, type SeedResult } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { DataModel, Doc } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type MenuData = Omit<Doc<'menus'>, '_creationTime' | '_id'>;
type MenuItemData = Omit<Doc<'menuItems'>, '_creationTime' | '_id' | 'menuId'>;

export class MenusSeeder extends BaseSeeder<MenuData> {
  moduleName = 'menus';
  tableName = 'menus';
  dependencies: SeedDependency[] = [];

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig): Promise<SeedResult> {
    const startTime = Date.now();
    this.config = { batchSize: 50, dependencies: true, force: false, ...config };

    if (config.force) {
      await this.clear();
    }

    const created = await this.seedMenus();
    await this.seedModuleConfig();

    return {
      created,
      dependencies: [],
      duration: Date.now() - startTime,
      module: this.moduleName,
      skipped: 0,
    };
  }

  generateFake(): MenuData {
    return { location: 'header', name: 'Main Menu' };
  }

  validateRecord(record: MenuData): boolean {
    return !!record.name && !!record.location;
  }

  protected async clear(): Promise<void> {
    const [menuItems, menus] = await Promise.all([
      this.ctx.db.query('menuItems').collect(),
      this.ctx.db.query('menus').collect(),
    ]);
    await Promise.all([
      ...menuItems.map(item => this.ctx.db.delete(item._id)),
      ...menus.map(menu => this.ctx.db.delete(menu._id)),
    ]);
  }

  private async seedMenus(): Promise<number> {
    const existingMenus = await this.ctx.db.query('menus').first();
    if (existingMenus) {
      return 0;
    }

    const menusData: MenuData[] = [
      { location: 'header', name: 'Header Menu' },
      { location: 'footer', name: 'Footer Menu' },
      { location: 'sidebar', name: 'Sidebar Menu' },
    ];

    const menuIds: Record<string, Doc<'menus'>['_id']> = {};
    for (const menu of menusData) {
      const id = await this.ctx.db.insert('menus', menu);
      menuIds[menu.location] = id;
    }

    const headerItems: MenuItemData[] = [
      { active: true, depth: 0, label: 'Trang chủ', order: 0, url: '/' },
      { active: true, depth: 0, label: 'Sản phẩm', order: 1, url: '/products' },
      { active: true, depth: 1, label: 'Điện tử', order: 2, url: '/products?category=dien-tu' },
      { active: true, depth: 1, label: 'Thời trang', order: 3, url: '/products?category=thoi-trang' },
      { active: true, depth: 1, label: 'Gia dụng', order: 4, url: '/products?category=gia-dung' },
      { active: true, depth: 0, label: 'Bài viết', order: 5, url: '/posts' },
      { active: true, depth: 1, label: 'Tin tức', order: 6, url: '/posts?category=tin-tuc' },
      { active: true, depth: 1, label: 'Hướng dẫn', order: 7, url: '/posts?category=huong-dan' },
      { active: true, depth: 0, label: 'Giới thiệu', order: 8, url: '/about' },
      { active: true, depth: 0, label: 'Liên hệ', order: 9, url: '/contact' },
    ];

    const footerItems: MenuItemData[] = [
      { active: true, depth: 0, label: 'Về chúng tôi', order: 0, url: '/about' },
      { active: true, depth: 0, label: 'Điều khoản sử dụng', order: 1, url: '/terms' },
      { active: true, depth: 0, label: 'Chính sách bảo mật', order: 2, url: '/privacy' },
      { active: true, depth: 0, label: 'Chính sách đổi trả', order: 3, url: '/return-policy' },
      { active: true, depth: 0, label: 'Hướng dẫn mua hàng', order: 4, url: '/guide' },
      { active: true, depth: 0, label: 'Liên hệ', order: 5, url: '/contact' },
    ];

    const sidebarItems: MenuItemData[] = [
      { active: true, depth: 0, icon: 'LayoutDashboard', label: 'Dashboard', order: 0, url: '/admin/dashboard' },
      { active: true, depth: 0, icon: 'Package', label: 'Sản phẩm', order: 1, url: '/admin/products' },
      { active: true, depth: 0, icon: 'ShoppingBag', label: 'Đơn hàng', order: 2, url: '/admin/orders' },
      { active: true, depth: 0, icon: 'Users', label: 'Khách hàng', order: 3, url: '/admin/customers' },
    ];

    const insertItems = async (items: MenuItemData[], menuId: Doc<'menus'>['_id']) => {
      await Promise.all(items.map(item => this.ctx.db.insert('menuItems', { ...item, menuId })));
    };

    await Promise.all([
      insertItems(headerItems, menuIds.header),
      insertItems(footerItems, menuIds.footer),
      insertItems(sidebarItems, menuIds.sidebar),
    ]);

    return menusData.length + headerItems.length + footerItems.length + sidebarItems.length;
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'menus');
  }
}
