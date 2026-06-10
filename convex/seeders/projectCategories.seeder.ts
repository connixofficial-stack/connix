import { BaseSeeder, type SeedDependency } from './base';
import type { Doc } from '../_generated/dataModel';

type ProjectCategoryData = Omit<Doc<'projectCategories'>, '_creationTime' | '_id'>;

const CATEGORIES = [
  { description: 'Dự án website và landing page', name: 'Website' },
  { description: 'Dự án nhận diện thương hiệu', name: 'Branding' },
  { description: 'Dự án ứng dụng và hệ thống nội bộ', name: 'Ứng dụng' },
  { description: 'Dự án nội dung và truyền thông', name: 'Marketing' },
  { description: 'Dự án tối ưu vận hành', name: 'Vận hành' },
];

export class ProjectCategorySeeder extends BaseSeeder<ProjectCategoryData> {
  moduleName = 'projectCategories';
  tableName = 'projectCategories';
  dependencies: SeedDependency[] = [];

  private categoryIndex = 0;

  generateFake(): ProjectCategoryData {
    const item = CATEGORIES[this.categoryIndex % CATEGORIES.length];
    const slug = this.slugify(item.name);
    const data: ProjectCategoryData = {
      active: true,
      description: item.description,
      name: item.name,
      order: this.categoryIndex,
      slug: this.categoryIndex > 0 ? `${slug}-${this.categoryIndex}` : slug,
      thumbnail: this.randomBoolean(0.3)
        ? `https://picsum.photos/seed/project-cat-${this.categoryIndex}/800/450`
        : undefined,
    };
    this.categoryIndex += 1;
    return data;
  }

  validateRecord(record: ProjectCategoryData): boolean {
    return !!record.name && !!record.slug;
  }
}
