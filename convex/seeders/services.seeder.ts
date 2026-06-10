/**
 * Service Seeder
 * 
 * Generates service data
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { createVietnameseFaker } from './fakerVi';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';
import {
  buildFromPatterns,
  filterAvailableSeedMauPaths,
  getSeedMauAssetPool,
  getIndustryTemplate,
  mergeTemplateFields,
  pickRandom,
} from '../../lib/seed-templates';
import type { IndustryTemplate } from '../../lib/seed-templates';

type ServiceData = Omit<Doc<'services'>, '_id' | '_creationTime'>;

export class ServiceSeeder extends BaseSeeder<ServiceData> {
  moduleName = 'services';
  tableName = 'services';
  dependencies: SeedDependency[] = [
    { minRecords: 1, module: 'serviceCategories', required: true },
  ];
  
  private categories: Doc<'serviceCategories'>[] = [];
  private viFaker: ReturnType<typeof createVietnameseFaker>;
  private serviceCount = 0;
  
  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
    this.viFaker = createVietnameseFaker(this.faker);
  }
  
  async seed(config: SeedConfig) {
    this.categories = await this.ctx.db.query('serviceCategories').collect();
    
    if (this.categories.length === 0) {
      throw new Error('No service categories found. Seed serviceCategories first.');
    }
    
    return super.seed(config);
  }
  
  generateFake(): ServiceData {
    const category = this.randomElement(this.categories);
    const template = getIndustryTemplate(this.config.industryKey);
    const randomFn = () => this.faker.number.float({ max: 1, min: 0 });
    const fields = mergeTemplateFields(template?.fakerTemplates);
    const title = template?.fakerTemplates.serviceNamePatterns?.length
      ? buildFromPatterns(template.fakerTemplates.serviceNamePatterns, fields, randomFn)
      : this.viFaker.serviceName();
    const slug = this.slugify(title) + '-' + this.serviceCount++;
    const description = template?.fakerTemplates.descriptionPatterns?.length
      ? buildFromPatterns(template.fakerTemplates.descriptionPatterns, fields, randomFn)
      : this.faker.lorem.paragraph();
    const thumbnail = this.getServiceThumbnail(template, slug);
    
    const hasPrice = this.randomBoolean(0.7); // 70% có giá
    const price = hasPrice ? this.randomInt(500_000, 20_000_000) : undefined;
    
    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Published' as const, weight: 7 },
      { value: 'Draft' as const, weight: 2 },
      { value: 'Archived' as const, weight: 1 },
    ]);
    
    return {
      categoryId: category._id,
      content: `<p>${description}</p>`,
      order: this.serviceCount,
      price,
      slug,
      status,
      thumbnail,
      title,
      views: status === 'Published' ? this.randomInt(0, 1000) : 0,
    };
  }
  
  validateRecord(record: ServiceData): boolean {
    return !!record.title && !!record.slug && !!record.categoryId;
  }

  private getServiceThumbnail(template: IndustryTemplate | null, slug: string): string {
    const randomFn = () => this.faker.number.float({ max: 1, min: 0 });

    if (this.config.useSeedMauImages === false) {
      return `https://picsum.photos/seed/${slug}/600/400`;
    }

    const pickFrom = (items: string[]) => {
      const validItems = filterAvailableSeedMauPaths(items);
      return validItems.length > 0 ? pickRandom(validItems, randomFn) : undefined;
    };

    const candidate = pickFrom(template?.assets.gallery ?? [])
      ?? pickFrom(getSeedMauAssetPool('gallery', { excludeIndustryKey: template?.key }));

    return candidate ?? `https://picsum.photos/seed/${slug}/600/400`;
  }
}
