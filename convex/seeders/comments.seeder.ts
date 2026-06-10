/**
 * Comments Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type CommentData = Omit<Doc<'comments'>, '_creationTime' | '_id'>;

type CommentTarget = {
  id: string;
  type: CommentData['targetType'];
};

export class CommentsSeeder extends BaseSeeder<CommentData> {
  moduleName = 'comments';
  tableName = 'comments';
  dependencies: SeedDependency[] = [
    { module: 'posts', required: false },
    { module: 'products', required: false },
    { module: 'services', required: false },
  ];

  private targets: CommentTarget[] = [];
  private customers: Doc<'customers'>[] = [];

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig) {
    const startTime = Date.now();
    await this.seedModuleConfig();
    const [posts, products, services, customers] = await Promise.all([
      this.ctx.db.query('posts').collect(),
      this.ctx.db.query('products').collect(),
      this.ctx.db.query('services').collect(),
      this.ctx.db.query('customers').collect(),
    ]);

    this.targets = [
      ...posts.map(post => ({ id: post._id, type: 'post' as const })),
      ...products.map(product => ({ id: product._id, type: 'product' as const })),
      ...services.map(service => ({ id: service._id, type: 'service' as const })),
    ];
    this.customers = customers;

    if (this.targets.length === 0) {
      console.log('[CommentsSeeder] Skipped: no targets found');
      return {
        created: 0,
        dependencies: ['posts', 'products', 'services'],
        duration: Date.now() - startTime,
        module: this.moduleName,
        skipped: 0,
      };
    }

    return super.seed(config);
  }

  generateFake(): CommentData {
    const target = this.randomElement(this.targets);
    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Approved' as const, weight: 7 },
      { value: 'Pending' as const, weight: 2 },
      { value: 'Spam' as const, weight: 1 },
    ]);

    const hasRating = target.type !== 'post' && this.randomBoolean(0.6);
    const customer = this.customers.length > 0 && this.randomBoolean(0.5)
      ? this.randomElement(this.customers)
      : undefined;

    return {
      authorEmail: this.randomBoolean(0.7) ? this.faker.internet.email() : undefined,
      authorIp: this.randomBoolean(0.5) ? this.faker.internet.ip() : undefined,
      authorName: customer?.name ?? this.faker.person.fullName(),
      content: this.faker.lorem.sentences({ max: 3, min: 1 }),
      customerId: customer?._id,
      likesCount: this.randomBoolean(0.4) ? this.randomInt(0, 50) : undefined,
      parentId: undefined,
      rating: hasRating ? this.randomInt(1, 5) : undefined,
      status,
      targetId: target.id,
      targetType: target.type,
    };
  }

  validateRecord(record: CommentData): boolean {
    return !!record.authorName && !!record.content && !!record.targetId;
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'comments');
  }
}
