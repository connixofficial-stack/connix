import { BaseSeeder, type SeedConfig, type SeedDependency, type SeedResult } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type ContactInquiryData = Omit<Doc<'contactInquiries'>, '_creationTime' | '_id'>;

export class ContactInboxSeeder extends BaseSeeder<ContactInquiryData> {
  moduleName = 'contactInbox';
  tableName = 'contactInquiries';
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

    await this.seedModuleConfig();

    return {
      created: 0,
      dependencies: [],
      duration: Date.now() - startTime,
      module: this.moduleName,
      skipped: 0,
    };
  }

  generateFake(): ContactInquiryData {
    const now = Date.now();
    return {
      createdAt: now,
      email: this.faker.internet.email(),
      message: this.faker.lorem.paragraph(),
      name: this.faker.person.fullName(),
      phone: this.faker.phone.number(),
      sourcePath: '/contact',
      status: 'new',
      subject: this.faker.lorem.sentence(),
      updatedAt: now,
    };
  }

  validateRecord(record: ContactInquiryData): boolean {
    return !!record.name && !!record.subject && !!record.message;
  }

  protected async clear(): Promise<void> {
    const [inquiries, stats] = await Promise.all([
      this.ctx.db.query('contactInquiries').collect(),
      this.ctx.db.query('contactInboxStats').collect(),
    ]);
    await Promise.all([
      ...inquiries.map((item) => this.ctx.db.delete(item._id)),
      ...stats.map((item) => this.ctx.db.delete(item._id)),
    ]);
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'contactInbox');
  }
}
