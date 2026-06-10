import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';
import { createVietnameseFaker } from './fakerVi';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';

type ResourceData = Omit<Doc<'resources'>, '_id' | '_creationTime'>;

const RESOURCE_TITLES = [
  'Checklist tối ưu website trước khi ra mắt',
  'Template kế hoạch nội dung 30 ngày',
  'Ebook hướng dẫn SEO cơ bản',
  'Bộ mẫu brief dự án website',
  'Tài liệu audit trải nghiệm người dùng',
  'Template quản lý chiến dịch marketing',
];

export class ResourceSeeder extends BaseSeeder<ResourceData> {
  moduleName = 'resources';
  tableName = 'resources';
  dependencies: SeedDependency[] = [
    { minRecords: 1, module: 'resourceCategories', required: true },
  ];

  private categories: Doc<'resourceCategories'>[] = [];
  private viFaker: ReturnType<typeof createVietnameseFaker>;
  private resourceCount = 0;

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
    this.viFaker = createVietnameseFaker(this.faker);
  }

  async seed(config: SeedConfig) {
    this.categories = await this.ctx.db.query('resourceCategories').take(500);
    if (this.categories.length === 0) {
      throw new Error('No resource categories found. Seed resourceCategories first.');
    }
    return super.seed(config);
  }

  generateFake(): ResourceData {
    const category = this.randomElement(this.categories);
    const baseTitle = RESOURCE_TITLES[this.resourceCount % RESOURCE_TITLES.length] ?? `Tài nguyên ${this.viFaker.serviceName()}`;
    const title = `${baseTitle} ${this.resourceCount + 1}`;
    const slug = `${this.slugify(title)}-${this.resourceCount}`;
    const description = this.faker.lorem.paragraph();
    const pricingType = this.faker.helpers.weightedArrayElement([
      { value: 'free' as const, weight: 5 },
      { value: 'paid' as const, weight: 4 },
      { value: 'contact' as const, weight: 1 },
    ]);
    const priceAmount = pricingType === 'paid' ? this.randomInt(99_000, 1_500_000) : undefined;
    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Published' as const, weight: 8 },
      { value: 'Draft' as const, weight: 1 },
      { value: 'Archived' as const, weight: 1 },
    ]);

    this.resourceCount += 1;
    return {
      categoryId: category._id,
      comparePriceAmount: priceAmount ? Math.round(priceAmount * 1.3) : undefined,
      content: `<p>${description}</p><p>Tài nguyên có thể tải xuống sau khi đăng nhập hoặc hoàn tất thanh toán.</p>`,
      downloadUrl: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view',
      excerpt: description,
      featured: this.randomBoolean(0.25),
      images: [],
      imageStorageIds: [],
      isPriceVisible: true,
      metaDescription: description.slice(0, 160),
      metaTitle: title,
      order: this.resourceCount,
      priceAmount,
      priceNote: pricingType === 'free' ? 'Miễn phí cho thành viên' : 'Tải trọn đời',
      pricingType,
      publishedAt: status === 'Published' ? Date.now() - this.randomInt(0, 90) * 86_400_000 : undefined,
      renderType: 'content',
      slug,
      status,
      thumbnail: `https://picsum.photos/seed/${slug}/800/500`,
      thumbnailStorageId: null,
      title,
      views: status === 'Published' ? this.randomInt(0, 2000) : 0,
    };
  }

  validateRecord(record: ResourceData): boolean {
    return !!record.title && !!record.slug && !!record.categoryId && !!record.downloadUrl;
  }

  protected async clear(): Promise<void> {
    const customers = await this.ctx.db.query('resourceCustomers').take(5000);
    const filterAssignments = await this.ctx.db.query('resourceFilterAssignments').take(5000);
    const categoryAssignments = await this.ctx.db.query('resourceCategoryAssignments').take(5000);
    const resources = await this.ctx.db.query('resources').take(5000);
    await Promise.all(customers.map((item) => this.ctx.db.delete(item._id)));
    await Promise.all(filterAssignments.map((item) => this.ctx.db.delete(item._id)));
    await Promise.all(categoryAssignments.map((item) => this.ctx.db.delete(item._id)));
    await Promise.all(resources.map((item) => this.ctx.db.delete(item._id)));
  }

  protected async afterSeed(count: number): Promise<void> {
    void count;
    await syncModuleRuntimeConfig(this.ctx, 'resources');
  }
}
