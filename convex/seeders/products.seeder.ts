/**
 * Product Seeder
 * 
 * Generates realistic product data with Vietnamese names
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { createVietnameseFaker } from './fakerVi';
import { seedProductVariants } from './variants.seeder';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';
import {
  buildFromPatterns,
  getIndustryTemplate,
  mergeTemplateFields,
  pickRandom,
} from '../../lib/seed-templates';

type ProductData = Omit<Doc<'products'>, '_id' | '_creationTime'>;

export class ProductSeeder extends BaseSeeder<ProductData> {
  moduleName = 'products';
  tableName = 'products';
  dependencies: SeedDependency[] = [
    { minRecords: 1, module: 'productCategories', required: true },
  ];
  
  private categories: Doc<'productCategories'>[] = [];
  private viFaker: ReturnType<typeof createVietnameseFaker>;
  private productCount = 0;
  
  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
    this.viFaker = createVietnameseFaker(this.faker);
  }
  
  async seed(config: SeedConfig) {
    // Load categories trước khi seed
    this.categories = await this.ctx.db.query('productCategories').collect();
    
    if (this.categories.length === 0) {
      throw new Error('No product categories found. Seed productCategories first.');
    }
    
    console.log(`[ProductSeeder] Found ${this.categories.length} categories`);
    
    return super.seed(config);
  }
  
  generateFake(): ProductData {
    const category = this.randomElement(this.categories);
    const template = getIndustryTemplate(this.config.industryKey);
    const randomFn = () => this.faker.number.float({ max: 1, min: 0 });
    const fields = mergeTemplateFields(template?.fakerTemplates);
    const name = template?.fakerTemplates.namePatterns?.length
      ? buildFromPatterns(template.fakerTemplates.namePatterns, fields, randomFn)
      : this.viFaker.productName();
    const slug = this.slugify(name) + '-' + this.productCount++;
    const description = template?.fakerTemplates.descriptionPatterns?.length
      ? buildFromPatterns(template.fakerTemplates.descriptionPatterns, fields, randomFn)
      : this.viFaker.productDescription();
    const image = this.config.useSeedMauImages === false
      ? `https://picsum.photos/seed/${slug}/400/400`
      : template?.assets.products?.length
        ? pickRandom(template.assets.products, randomFn)
        : `https://picsum.photos/seed/${slug}/400/400`;
    
    const basePrice = this.randomInt(100_000, 50_000_000);
    const hasSale = this.randomBoolean(0.3); // 30% có sale
    
    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Active' as const, weight: 7 },
      { value: 'Draft' as const, weight: 2 },
      { value: 'Archived' as const, weight: 1 },
    ]);
    
    return {
      categoryId: category._id,
      description,
      image,
      name,
      order: this.productCount,
      price: basePrice,
      salePrice: hasSale ? Math.floor(basePrice * this.faker.number.float({ max: 0.9, min: 0.5 })) : undefined,
      sales: status === 'Active' ? this.randomInt(0, 500) : 0,
      sku: this.faker.string.alphanumeric({ casing: 'upper', length: { max: 12, min: 8 } }),
      slug,
      status,
      stock: status === 'Active' ? this.randomInt(0, 200) : 0,
    };
  }
  
  validateRecord(record: ProductData): boolean {
    return (
      !!record.name &&
      !!record.slug &&
      !!record.sku &&
      record.price > 0 &&
      !!record.categoryId
    );
  }
  
  protected async afterSeed(count: number): Promise<void> {
    void count;
    const variantEnabled = await this.isVariantEnabled();
    if (variantEnabled) {
      await seedProductVariants(this.ctx, {
        presetKey: this.config.variantPresetKey,
        strictVariantPresetScope: this.config.strictVariantPresetScope,
      });
    }

    await this.updateStats();
  }

  private async isVariantEnabled(): Promise<boolean> {
    const setting = await this.ctx.db
      .query('moduleSettings')
      .withIndex('by_module_setting', (q) => q.eq('moduleKey', 'products').eq('settingKey', 'variantEnabled'))
      .unique();

    return setting?.value === true;
  }
  
  private async updateStats(): Promise<void> {
    // Clear existing stats
    const existingStats = await this.ctx.db.query('productStats').collect();
    await Promise.all(existingStats.map(s => this.ctx.db.delete(s._id)));
    
    // Count by status
    const products = await this.ctx.db.query('products').collect();
    const stats: Record<string, number> = {
      Active: 0,
      Archived: 0,
      Draft: 0,
      total: products.length,
    };
    
    let maxOrder = 0;
    for (const p of products) {
      stats[p.status]++;
      if (p.order > maxOrder) {maxOrder = p.order;}
    }
    
    // Insert new stats
    await Promise.all([
      this.ctx.db.insert('productStats', { count: stats.total, key: 'total', lastOrder: maxOrder }),
      this.ctx.db.insert('productStats', { count: stats.Active, key: 'Active', lastOrder: 0 }),
      this.ctx.db.insert('productStats', { count: stats.Draft, key: 'Draft', lastOrder: 0 }),
      this.ctx.db.insert('productStats', { count: stats.Archived, key: 'Archived', lastOrder: 0 }),
    ]);
    
    console.log('[ProductSeeder] Stats updated:', stats);
  }
}
