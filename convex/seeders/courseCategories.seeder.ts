import { BaseSeeder, type SeedDependency } from './base';
import { getIndustryTemplate } from '../../lib/seed-templates';
import type { Doc } from '../_generated/dataModel';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';

type CourseCategoryData = Omit<Doc<'courseCategories'>, '_creationTime' | '_id'>;

const CATEGORIES = [
  { description: 'Khóa học dành cho người mới bắt đầu', name: 'Cơ bản' },
  { description: 'Kỹ năng chuyên sâu theo từng chủ đề', name: 'Chuyên sâu' },
  { description: 'Luyện thi và chứng chỉ', name: 'Luyện thi' },
  { description: 'Workshop thực chiến', name: 'Thực chiến' },
  { description: 'Lộ trình cho doanh nghiệp', name: 'Doanh nghiệp' },
];

export class CourseCategorySeeder extends BaseSeeder<CourseCategoryData> {
  moduleName = 'courseCategories';
  tableName = 'courseCategories';
  dependencies: SeedDependency[] = [];

  private categoryIndex = 0;

  generateFake(): CourseCategoryData {
    const template = getIndustryTemplate(this.config.industryKey);
    const templateCategories = template?.fakerTemplates.categoryNames?.length
      ? template.fakerTemplates.categoryNames
      : CATEGORIES.map((item) => item.name);
    const name = templateCategories[this.categoryIndex % templateCategories.length];
    const fallback = CATEGORIES.find((item) => item.name === name);
    const slug = this.slugify(name);

    const data: CourseCategoryData = {
      active: this.randomBoolean(0.95),
      description: fallback?.description ?? `Nhóm khóa học ${name.toLowerCase()}`,
      name,
      order: this.categoryIndex,
      slug: this.categoryIndex > 0 ? `${slug}-${this.categoryIndex}` : slug,
      thumbnail: this.randomBoolean(0.3)
        ? `https://picsum.photos/seed/course-cat-${this.categoryIndex}/600/400`
        : undefined,
    };

    this.categoryIndex += 1;
    return data;
  }

  validateRecord(record: CourseCategoryData): boolean {
    return !!record.name && !!record.slug;
  }

  protected async clear(): Promise<void> {
    const assignments = await this.ctx.db.query('courseCategoryAssignments').take(5000);
    const categories = await this.ctx.db.query('courseCategories').take(5000);
    await Promise.all(assignments.map((item) => this.ctx.db.delete(item._id)));
    await Promise.all(categories.map((item) => this.ctx.db.delete(item._id)));
  }

  protected async afterSeed(count: number): Promise<void> {
    void count;
    await syncModuleRuntimeConfig(this.ctx, 'courseCategories');
  }
}
