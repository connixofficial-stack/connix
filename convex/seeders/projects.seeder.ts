import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type ProjectData = Omit<Doc<'projects'>, '_id' | '_creationTime'>;

export class ProjectSeeder extends BaseSeeder<ProjectData> {
  moduleName = 'projects';
  tableName = 'projects';
  dependencies: SeedDependency[] = [
    { minRecords: 1, module: 'projectCategories', required: true },
  ];

  private categories: Doc<'projectCategories'>[] = [];
  private projectCount = 0;

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig) {
    this.categories = await this.ctx.db.query('projectCategories').take(100);
    if (this.categories.length === 0) {
      throw new Error('No project categories found. Seed projectCategories first.');
    }
    return super.seed(config);
  }

  generateFake(): ProjectData {
    const category = this.randomElement(this.categories);
    const clientName = this.faker.company.name();
    const title = `${clientName} - ${this.faker.helpers.arrayElement(['Website', 'Branding', 'Portal', 'Campaign'])}`;
    const slug = `${this.slugify(title)}-${this.projectCount}`;
    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Published' as const, weight: 7 },
      { value: 'Draft' as const, weight: 3 },
    ]);
    const thumbnail = `https://picsum.photos/seed/${slug}/1200/675`;
    const images = [1, 2, 3].map((index) => `https://picsum.photos/seed/${slug}-gallery-${index}/1200/800`);

    this.projectCount += 1;

    return {
      categoryId: category._id,
      clientName,
      content: `<p>${this.faker.lorem.paragraphs(3, '</p><p>')}</p>`,
      excerpt: this.faker.lorem.sentence(),
      featured: this.randomBoolean(0.25),
      images,
      introVideoType: 'none',
      order: this.projectCount,
      publishedAt: status === 'Published' ? Date.now() - this.randomInt(0, 1000 * 60 * 60 * 24 * 90) : undefined,
      renderType: 'content',
      slug,
      status,
      thumbnail,
      thumbnailStorageId: null,
      title,
      views: status === 'Published' ? this.randomInt(0, 1000) : 0,
    };
  }

  validateRecord(record: ProjectData): boolean {
    return !!record.title && !!record.slug && !!record.categoryId;
  }
}
