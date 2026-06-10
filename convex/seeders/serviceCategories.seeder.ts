/**
 * Service Category Seeder
 */

import { BaseSeeder, type SeedDependency } from './base';
import { getIndustryTemplate } from '../../lib/seed-templates';
import type { Doc } from '../_generated/dataModel';

type ServiceCategoryData = Omit<Doc<'serviceCategories'>, '_creationTime' | '_id'>;

const CATEGORIES = [
  { description: 'Dịch vụ tư vấn', name: 'Tư vấn' },
  { description: 'Dịch vụ triển khai', name: 'Triển khai' },
  { description: 'Bảo trì và hỗ trợ', name: 'Bảo trì' },
  { description: 'Đào tạo & hướng dẫn', name: 'Đào tạo' },
  { description: 'Dịch vụ tùy chỉnh', name: 'Tùy chỉnh' },
];

export class ServiceCategorySeeder extends BaseSeeder<ServiceCategoryData> {
  moduleName = 'serviceCategories';
  tableName = 'serviceCategories';
  dependencies: SeedDependency[] = [];

  private categoryIndex = 0;

  generateFake(): ServiceCategoryData {
    const template = getIndustryTemplate(this.config.industryKey);
    const templateCategories = template?.fakerTemplates.serviceCategoryNames?.length
      ? template.fakerTemplates.serviceCategoryNames
      : CATEGORIES.map((item) => item.name);
    const name = templateCategories[this.categoryIndex % templateCategories.length];
    const fallback = CATEGORIES.find((item) => item.name === name);
    const slug = this.slugify(name);

    const data: ServiceCategoryData = {
      active: this.randomBoolean(0.9),
      description: fallback?.description ?? `Nhóm dịch vụ ${name.toLowerCase()}`,
      name,
      order: this.categoryIndex,
      slug: this.categoryIndex > 0 ? `${slug}-${this.categoryIndex}` : slug,
      thumbnail: this.randomBoolean(0.3)
        ? `https://picsum.photos/seed/service-cat-${this.categoryIndex}/600/400`
        : undefined,
    };

    this.categoryIndex += 1;
    return data;
  }

  validateRecord(record: ServiceCategoryData): boolean {
    return !!record.name && !!record.slug;
  }
}
