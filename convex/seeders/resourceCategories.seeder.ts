import { BaseSeeder, type SeedDependency } from './base';
import type { Doc } from '../_generated/dataModel';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';

type ResourceCategoryData = Omit<Doc<'resourceCategories'>, '_creationTime' | '_id'>;

const CATEGORIES = [
  { description: 'Ebook và tài liệu PDF', name: 'Ebook' },
  { description: 'Template dùng nhanh cho công việc', name: 'Template' },
  { description: 'Checklist triển khai theo từng bước', name: 'Checklist' },
  { description: 'Tài liệu hướng dẫn chuyên sâu', name: 'Hướng dẫn' },
  { description: 'Bộ công cụ và file mẫu', name: 'Toolkit' },
];

export class ResourceCategorySeeder extends BaseSeeder<ResourceCategoryData> {
  moduleName = 'resourceCategories';
  tableName = 'resourceCategories';
  dependencies: SeedDependency[] = [];

  private categoryIndex = 0;

  generateFake(): ResourceCategoryData {
    const item = CATEGORIES[this.categoryIndex % CATEGORIES.length];
    const name = item.name;
    const slug = this.slugify(name);
    const data: ResourceCategoryData = {
      active: this.randomBoolean(0.95),
      description: item.description,
      name,
      order: this.categoryIndex,
      slug: this.categoryIndex > 0 ? `${slug}-${this.categoryIndex}` : slug,
      thumbnail: this.randomBoolean(0.3)
        ? `https://picsum.photos/seed/resource-cat-${this.categoryIndex}/600/400`
        : undefined,
    };
    this.categoryIndex += 1;
    return data;
  }

  validateRecord(record: ResourceCategoryData): boolean {
    return !!record.name && !!record.slug;
  }

  protected async clear(): Promise<void> {
    const assignments = await this.ctx.db.query('resourceCategoryAssignments').take(5000);
    const categories = await this.ctx.db.query('resourceCategories').take(5000);
    await Promise.all(assignments.map((item) => this.ctx.db.delete(item._id)));
    await Promise.all(categories.map((item) => this.ctx.db.delete(item._id)));
  }

  protected async afterSeed(count: number): Promise<void> {
    void count;
    await syncModuleRuntimeConfig(this.ctx, 'resourceCategories');
  }
}
