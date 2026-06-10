/**
 * Product Category Seeder
 */

import { BaseSeeder, type SeedDependency } from './base';
import { getIndustryTemplate } from '../../lib/seed-templates';
import type { Doc } from '../_generated/dataModel';

type ProductCategoryData = Omit<Doc<'productCategories'>, '_id' | '_creationTime'>;

const CATEGORIES = [
  { name: 'Điện tử', description: 'Thiết bị điện tử, công nghệ' },
  { name: 'Thời trang', description: 'Quần áo, phụ kiện thời trang' },
  { name: 'Gia dụng', description: 'Đồ dùng gia đình' },
  { name: 'Sách & Văn phòng phẩm', description: 'Sách, vở, dụng cụ văn phòng' },
  { name: 'Thể thao', description: 'Dụng cụ, trang phục thể thao' },
  { name: 'Đồ chơi', description: 'Đồ chơi trẻ em' },
  { name: 'Mỹ phẩm', description: 'Sản phẩm làm đẹp' },
  { name: 'Thực phẩm', description: 'Thực phẩm & đồ uống' },
];

export class ProductCategorySeeder extends BaseSeeder<ProductCategoryData> {
  moduleName = 'productCategories';
  tableName = 'productCategories';
  dependencies: SeedDependency[] = [];
  
  private categoryIndex = 0;
  
  generateFake(): ProductCategoryData {
    const template = getIndustryTemplate(this.config.industryKey);
    const templateCategories = template?.fakerTemplates.categoryNames?.length
      ? template.fakerTemplates.categoryNames
      : CATEGORIES.map((item) => item.name);
    const name = templateCategories[this.categoryIndex % templateCategories.length];
    const fallback = CATEGORIES.find((item) => item.name === name);
    const slug = this.slugify(name);
    
    const data: ProductCategoryData = {
      active: this.randomBoolean(0.9), // 90% active
      description: fallback?.description ?? `Danh mục ${name.toLowerCase()}`,
      name,
      order: this.categoryIndex,
      slug: this.categoryIndex > 0 ? `${slug}-${this.categoryIndex}` : slug,
    };
    
    this.categoryIndex++;
    return data;
  }
  
  validateRecord(record: ProductCategoryData): boolean {
    return !!record.name && !!record.slug;
  }
}
