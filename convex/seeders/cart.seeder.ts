/**
 * Cart Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type CartData = Omit<Doc<'carts'>, '_creationTime' | '_id'>;
type CartItemData = Omit<Doc<'cartItems'>, '_creationTime' | '_id' | 'cartId'>;

type CartSeedData = CartData & { items: CartItemData[] };

export class CartSeeder extends BaseSeeder<CartSeedData> {
  moduleName = 'cart';
  tableName = 'carts';
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
      console.log('[CartSeeder] Skipped: missing products or customers');
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

  generateFake(): CartSeedData {
    const itemsCount = this.randomInt(1, 3);
    const items: CartItemData[] = [];
    let totalAmount = 0;

    for (let i = 0; i < itemsCount; i += 1) {
      const product = this.randomElement(this.products);
      const productVariants = this.variants.filter(v => v.productId === product._id);
      const variant = productVariants.length > 0 && this.randomBoolean(0.3)
        ? this.randomElement(productVariants)
        : undefined;
      const quantity = this.randomInt(1, 3);
      const price = product.salePrice ?? product.price;
      const subtotal = price * quantity;

      items.push({
        price,
        productId: product._id,
        productImage: product.image,
        productName: product.name,
        quantity,
        subtotal,
        variantId: variant?._id,
      });
      totalAmount += subtotal;
    }

    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Active' as const, weight: 6 },
      { value: 'Converted' as const, weight: 2 },
      { value: 'Abandoned' as const, weight: 2 },
    ]);

    const isGuest = this.randomBoolean(0.4);
    const customer = isGuest ? undefined : this.randomElement(this.customers);

    return {
      customerId: customer?._id,
      expiresAt: this.randomBoolean(0.6) ? Date.now() + this.randomInt(1, 14) * 24 * 60 * 60 * 1000 : undefined,
      items,
      itemsCount,
      note: this.randomBoolean(0.2) ? this.faker.lorem.sentence() : undefined,
      sessionId: isGuest ? `session_${this.faker.string.alphanumeric(12)}` : undefined,
      status,
      totalAmount,
    };
  }

  validateRecord(record: CartSeedData): boolean {
    return record.itemsCount > 0 && record.items.length > 0;
  }

  protected async insertRecords(records: CartSeedData[]): Promise<void> {
    for (const record of records) {
      const { items, ...cartData } = record;
      const cartId = await this.ctx.db.insert('carts', cartData as DataModel['carts']['document']);
      await Promise.all(
        items.map(item => this.ctx.db.insert('cartItems', {
          ...item,
          cartId,
        }))
      );
    }
  }

  protected async clear(): Promise<void> {
    const [cartItems, carts] = await Promise.all([
      this.ctx.db.query('cartItems').collect(),
      this.ctx.db.query('carts').collect(),
    ]);
    await Promise.all([
      ...cartItems.map(item => this.ctx.db.delete(item._id)),
      ...carts.map(cart => this.ctx.db.delete(cart._id)),
    ]);
  }
}
