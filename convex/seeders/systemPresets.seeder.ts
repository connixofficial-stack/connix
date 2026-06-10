import { BaseSeeder, type SeedConfig, type SeedDependency, type SeedResult } from './base';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type SystemPresetData = Omit<Doc<'systemPresets'>, '_creationTime' | '_id'>;

export class SystemPresetsSeeder extends BaseSeeder<SystemPresetData> {
  moduleName = 'systemPresets';
  tableName = 'systemPresets';
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

    const existing = await this.ctx.db.query('systemPresets').first();
    if (existing) {
      return {
        created: 0,
        dependencies: [],
        duration: Date.now() - startTime,
        module: this.moduleName,
        skipped: 1,
      };
    }

    const presets: SystemPresetData[] = [
      {
        description: 'Blog với bài viết và bình luận',
        enabledModules: ['posts', 'comments', 'media', 'customers', 'users', 'roles', 'settings', 'menus', 'homepage', 'analytics'],
        isDefault: false,
        key: 'blog',
        name: 'Blog / News',
      },
      {
        description: 'Trang giới thiệu đơn giản',
        enabledModules: ['posts', 'media', 'users', 'roles', 'settings', 'menus', 'homepage'],
        isDefault: false,
        key: 'landing',
        name: 'Landing Page',
      },
      {
        description: 'Trưng bày sản phẩm không giỏ hàng',
        enabledModules: ['products', 'media', 'customers', 'users', 'roles', 'settings', 'menus', 'homepage', 'notifications', 'analytics'],
        isDefault: false,
        key: 'catalog',
        name: 'Catalog',
      },
      {
        description: 'Shop đơn giản với giỏ hàng',
        enabledModules: ['products', 'orders', 'cart', 'media', 'customers', 'users', 'roles', 'settings', 'menus', 'homepage', 'notifications', 'analytics'],
        isDefault: false,
        key: 'ecommerce-basic',
        name: 'eCommerce Basic',
      },
      {
        description: 'Shop đầy đủ: giỏ hàng, wishlist, khuyến mãi',
        enabledModules: ['posts', 'comments', 'media', 'products', 'orders', 'cart', 'wishlist', 'customers', 'users', 'roles', 'settings', 'menus', 'homepage', 'notifications', 'promotions', 'analytics'],
        isDefault: true,
        key: 'ecommerce-full',
        name: 'eCommerce Full',
      },
    ];

    await Promise.all(presets.map(preset => this.ctx.db.insert('systemPresets', preset)));

    return {
      created: presets.length,
      dependencies: [],
      duration: Date.now() - startTime,
      module: this.moduleName,
      skipped: 0,
    };
  }

  generateFake(): SystemPresetData {
    return {
      description: 'Preset hệ thống',
      enabledModules: ['posts'],
      isDefault: false,
      key: 'default',
      name: 'Default',
    };
  }

  validateRecord(record: SystemPresetData): boolean {
    return !!record.key && !!record.name;
  }

  protected async clear(): Promise<void> {
    const presets = await this.ctx.db.query('systemPresets').collect();
    await Promise.all(presets.map(preset => this.ctx.db.delete(preset._id)));
  }
}
