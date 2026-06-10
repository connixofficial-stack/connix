/**
 * Order Seeder
 * 
 * Generates realistic order data with dependencies on products and customers
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { createVietnameseFaker } from './fakerVi';
import type { Doc, DataModel } from '../_generated/dataModel';
import { DEFAULT_ORDER_STATUSES } from '../../lib/orders/statuses';

import type { GenericMutationCtx } from 'convex/server';
type OrderData = Omit<Doc<'orders'>, '_id' | '_creationTime'>;
import type { Id } from '../_generated/dataModel';

type OrderItem = {
  productId: Id<'products'>;
  productImage?: string;
  productName: string;
  quantity: number;
  price: number;
};

export class OrderSeeder extends BaseSeeder<OrderData> {
  moduleName = 'orders';
  tableName = 'orders';
  dependencies: SeedDependency[] = [
    { minRecords: 5, module: 'products', required: true },
    { minRecords: 1, module: 'customers', required: true },
  ];
  
  private products: Doc<'products'>[] = [];
  private customers: Doc<'customers'>[] = [];
  private viFaker: ReturnType<typeof createVietnameseFaker>;
  private orderCount = 0;
  
  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
    this.viFaker = createVietnameseFaker(this.faker);
  }
  
  async seed(config: SeedConfig) {
    const startTime = Date.now();
    // Load dependencies
    [this.products, this.customers] = await Promise.all([
      this.ctx.db.query('products').collect(),
      this.ctx.db.query('customers').collect(),
    ]);
    
    if (this.products.length < 5) {
      console.log('[OrderSeeder] Skipped: need at least 5 products');
      return {
        created: 0,
        dependencies: ['products', 'customers'],
        duration: Date.now() - startTime,
        module: this.moduleName,
        skipped: 0,
      };
    }
    if (this.customers.length === 0) {
      console.log('[OrderSeeder] Skipped: no customers found');
      return {
        created: 0,
        dependencies: ['products', 'customers'],
        duration: Date.now() - startTime,
        module: this.moduleName,
        skipped: 0,
      };
    }
    
    console.log(`[OrderSeeder] Found ${this.products.length} products, ${this.customers.length} customers`);
    
    return super.seed(config);
  }
  
  generateFake(): OrderData {
    const customer = this.randomElement(this.customers);
    const itemsCount = this.randomInt(1, 5);
    
    // Generate order items
    const selectedProducts = this.randomElements(this.products, itemsCount);
    const items: OrderItem[] = selectedProducts.map(product => {
      const quantity = this.randomInt(1, 3);
      const price = product.salePrice || product.price;
      
      return {
        price,
        productId: product._id,
        productImage: product.image,
        productName: product.name,
        quantity,
      };
    });
    
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = this.faker.helpers.weightedArrayElement([
      { value: 0, weight: 2 },        // Free shipping
      { value: 30_000, weight: 5 },   // Standard
      { value: 50_000, weight: 2 },   // Express
      { value: 20_000, weight: 1 },   // Local
    ]);
    
    const paymentMethod = this.faker.helpers.weightedArrayElement([
      { value: 'COD' as const, weight: 4 },
      { value: 'BankTransfer' as const, weight: 3 },
      { value: 'CreditCard' as const, weight: 2 },
      { value: 'EWallet' as const, weight: 1 },
    ]);
    
    const statusOptions = DEFAULT_ORDER_STATUSES.map((statusItem) => statusItem.key);
    const status = this.faker.helpers.arrayElement(statusOptions);
    const statusKey = status.toLowerCase();
    
    const paymentStatus = statusKey.includes('deliver')
      ? 'Paid' as const
      : statusKey.includes('cancel')
      ? this.faker.helpers.arrayElement(['Failed', 'Refunded'] as const)
      : this.faker.helpers.weightedArrayElement([
          { value: 'Paid' as const, weight: 3 },
          { value: 'Pending' as const, weight: 1 },
        ]);
    
    const note = this.randomBoolean(0.3) ? this.viFaker.orderNote() : undefined;
    const trackingNumber = (statusKey.includes('ship') || statusKey.includes('deliver'))
      ? `VN${this.faker.string.numeric(9)}`
      : undefined;
    
    return {
      customerId: customer._id,
      items,
      note,
      orderNumber: `ORD-${Date.now()}-${++this.orderCount}`,
      paymentMethod,
      paymentStatus,
      shippingAddress: customer.address 
        ? `${customer.address}, ${customer.city || ''}` 
        : this.viFaker.fullAddress(),
      shippingFee,
      status,
      subtotal,
      totalAmount: subtotal + shippingFee,
      trackingNumber,
    };
  }
  
  validateRecord(record: OrderData): boolean {
    return (
      !!record.orderNumber &&
      !!record.customerId &&
      record.items.length > 0 &&
      record.totalAmount > 0
    );
  }
  
  protected async afterSeed(count: number): Promise<void> {
    void count;
    // Update customers' order stats
    await this.updateCustomerStats();
  }
  
  private async updateCustomerStats(): Promise<void> {
    const orders = await this.ctx.db.query('orders').collect();
    const customerOrders = new Map<Id<'customers'>, { count: number; total: number }>();
    
    for (const order of orders) {
      const existing = customerOrders.get(order.customerId) || { count: 0, total: 0 };
      customerOrders.set(order.customerId, {
        count: existing.count + 1,
        total: existing.total + order.totalAmount,
      });
    }
    
    // Update each customer
    for (const [customerId, stats] of customerOrders.entries()) {
      await this.ctx.db.patch(customerId, {
        ordersCount: stats.count,
        totalSpent: stats.total,
      });
    }
    
    console.log(`[OrderSeeder] Updated stats for ${customerOrders.size} customers`);
  }
}
