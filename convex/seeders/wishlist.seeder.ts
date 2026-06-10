/**
 * Wishlist Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type WishlistData = Omit<Doc<'wishlist'>, '_creationTime' | '_id'>;

export class WishlistSeeder extends BaseSeeder<WishlistData> {
  moduleName = 'wishlist';
  tableName = 'wishlist';
  dependencies: SeedDependency[] = [
    { module: 'products', minRecords: 1, required: true },
    { module: 'customers', minRecords: 1, required: true },
  ];

  private products: Doc<'products'>[] = [];
  private customers: Doc<'customers'>[] = [];
  private variants: Doc<'productVariants'>[] = [];

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig) {
    const startTime = Date.now();
    [this.products, this.customers, this.variants] = await Promise.all([
      this.ctx.db.query('products').collect(),
      this.ctx.db.query('customers').collect(),
      this.ctx.db.query('productVariants').collect(),
    ]);

    if (this.products.length === 0 || this.customers.length === 0) {
      console.log('[WishlistSeeder] Skipped: missing products or customers');
      return {
        created: 0,
        dependencies: ['products', 'customers'],
        duration: Date.now() - startTime,
        module: this.moduleName,
        skipped: 0,
      };
    }

    return super.seed(config);
  }

  generateFake(): WishlistData {
    const customer = this.randomElement(this.customers);
    const product = this.randomElement(this.products);
    const productVariants = this.variants.filter(v => v.productId === product._id);
    const variant = productVariants.length > 0 && this.randomBoolean(0.4)
      ? this.randomElement(productVariants)
      : undefined;

    return {
      customerId: customer._id,
      note: this.randomBoolean(0.3) ? this.faker.lorem.sentence() : undefined,
      productId: product._id,
      variantId: variant?._id,
    };
  }

  validateRecord(record: WishlistData): boolean {
    return !!record.customerId && !!record.productId;
  }
}
