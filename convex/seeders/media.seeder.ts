/**
 * Media Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency, type SeedResult } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

export class MediaSeeder extends BaseSeeder {
  moduleName = 'media';
  tableName = 'images';
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

    await this.seedModuleConfig();

    return {
      created: 0,
      dependencies: [],
      duration: Date.now() - startTime,
      module: this.moduleName,
      skipped: 0,
    };
  }

  generateFake(): unknown {
    return {};
  }

  validateRecord(): boolean {
    return true;
  }

  protected async clear(): Promise<void> {
    const images = await this.ctx.db.query('images').collect();
    for (const img of images) {
      try {
        await this.ctx.storage.delete(img.storageId);
      } catch {
        // ignore missing storage
      }
      await this.ctx.db.delete(img._id);
    }

    const [stats, folders] = await Promise.all([
      this.ctx.db.query('mediaStats').collect(),
      this.ctx.db.query('mediaFolders').collect(),
    ]);
    await Promise.all([
      ...stats.map(stat => this.ctx.db.delete(stat._id)),
      ...folders.map(folder => this.ctx.db.delete(folder._id)),
    ]);
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'media');
  }
}
