/**
 * Subscriptions Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type CalendarTaskData = Omit<Doc<'calendarTasks'>, '_creationTime' | '_id'>;

export class SubscriptionsSeeder extends BaseSeeder<CalendarTaskData> {
  moduleName = 'subscriptions';
  tableName = 'calendarTasks';
  dependencies: SeedDependency[] = [
    { module: 'users', required: true, minRecords: 1 },
  ];

  private users: Doc<'users'>[] = [];

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig) {
    await this.seedModuleConfig();
    this.users = await this.ctx.db.query('users').collect();
    if (this.users.length === 0) {
      throw new Error('No users found. Seed users first.');
    }
    return super.seed(config);
  }

  generateFake(): CalendarTaskData {
    const createdBy = this.randomElement(this.users);
    const statusPool: CalendarTaskData['status'][] = ['Todo', 'Contacted', 'Renewed', 'Churned'];
    const status = this.randomElement(statusPool);
    const daysOffset = this.randomInt(-10, 60);
    const dueDate = Date.now() + daysOffset * 24 * 60 * 60 * 1000;
    const customerNames = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Cường', 'Phạm Thu Dung', 'Hoàng Văn Em'];
    const productNames = ['ChatGPT Plus', 'Claude Pro', 'Gemini Advanced', 'Copilot Pro', 'Midjourney'];
    const customerName = this.randomElement(customerNames);
    const productName = this.randomElement(productNames);

    return {
      allDay: true,
      completedAt: status === 'Renewed' ? Date.now() : undefined,
      createdAt: Date.now(),
      createdBy: createdBy._id,
      dueDate,
      order: Date.now(),
      status,
      timezone: 'Asia/Ho_Chi_Minh',
      title: `Gia hạn ${productName} — ${customerName}`,
      updatedAt: Date.now(),
    };
  }

  validateRecord(record: CalendarTaskData): boolean {
    return !!record.title && !!record.dueDate && !!record.createdBy;
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'subscriptions');
  }
}
