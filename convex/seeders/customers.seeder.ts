/**
 * Customer Seeder
 * 
 * Generates Vietnamese customer data
 */

import { BaseSeeder, type SeedDependency } from './base';
import { createVietnameseFaker } from './fakerVi';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type CustomerData = Omit<Doc<'customers'>, '_id' | '_creationTime'>;

export class CustomerSeeder extends BaseSeeder<CustomerData> {
  moduleName = 'customers';
  tableName = 'customers';
  dependencies: SeedDependency[] = [];
  
  private viFaker: ReturnType<typeof createVietnameseFaker>;
  private usedEmails = new Set<string>();
  
  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
    this.viFaker = createVietnameseFaker(this.faker);
  }
  
  generateFake(): CustomerData {
    const gender = this.randomBoolean() ? 'male' : 'female';
    const fullName = this.viFaker.fullName(gender);
    const firstName = fullName.split(' ').pop()?.toLowerCase() || 'user';
    
    // Generate unique email
    let email = '';
    let attempts = 0;
    do {
      const random = attempts > 0 ? this.faker.string.numeric(2) : '';
      email = `${this.slugify(firstName)}${random}@gmail.com`;
      attempts++;
    } while (this.usedEmails.has(email) && attempts < 10);
    
    this.usedEmails.add(email);
    
    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Active' as const, weight: 8 },
      { value: 'Inactive' as const, weight: 2 },
    ]);
    
    const hasNotes = this.randomBoolean(0.1); // 10% có notes
    
    return {
      address: this.viFaker.street(),
      avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${email}`,
      city: this.viFaker.city(),
      email,
      name: fullName,
      notes: hasNotes ? 'Khách hàng VIP' : undefined,
      ordersCount: 0,
      phone: this.viFaker.phoneNumber(),
      status,
      totalSpent: 0,
    };
  }
  
  validateRecord(record: CustomerData): boolean {
    return (
      !!record.name &&
      !!record.email &&
      !!record.phone &&
      record.email.includes('@')
    );
  }
  
  protected async afterSeed(count: number): Promise<void> {
    void count;
    // Initialize stats (will be updated by orders)
    const customers = await this.ctx.db.query('customers').collect();
    
    for (const customer of customers) {
      if (!customer.ordersCount) {
        await this.ctx.db.patch(customer._id, {
          ordersCount: 0,
          totalSpent: 0,
        });
      }
    }
  }
}
