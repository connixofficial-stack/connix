/**
 * Post Seeder
 * 
 * Generates blog posts with Vietnamese content
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

type PostData = Omit<Doc<'posts'>, '_id' | '_creationTime'>;

export class PostSeeder extends BaseSeeder<PostData> {
  moduleName = 'posts';
  tableName = 'posts';
  dependencies: SeedDependency[] = [
    { minRecords: 1, module: 'postCategories', required: true },
    { minRecords: 1, module: 'users', required: false },
  ];
  
  private categories: Doc<'postCategories'>[] = [];
  private users: Doc<'users'>[] = [];
  private viFaker: ReturnType<typeof createVietnameseFaker>;
  private postCount = 0;
  
  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
    this.viFaker = createVietnameseFaker(this.faker);
  }
  
  async seed(config: SeedConfig) {
    // Load dependencies
    [this.categories, this.users] = await Promise.all([
      this.ctx.db.query('postCategories').collect(),
      this.ctx.db.query('users').collect(),
    ]);
    
    if (this.categories.length === 0) {
      throw new Error('No post categories found. Seed postCategories first.');
    }
    
    console.log(`[PostSeeder] Found ${this.categories.length} categories, ${this.users.length} users`);
    
    return super.seed(config);
  }
  
  generateFake(): PostData {
    const category = this.randomElement(this.categories);
    const template = getIndustryTemplate(this.config.industryKey);
    const randomFn = () => this.faker.number.float({ max: 1, min: 0 });
    const fields = mergeTemplateFields(template?.fakerTemplates);
    const title = template?.fakerTemplates.postTitlePatterns?.length
      ? buildFromPatterns(template.fakerTemplates.postTitlePatterns, fields, randomFn)
      : this.viFaker.postTitle();
    const slug = this.slugify(title) + '-' + this.postCount++;
    const excerpt = template?.fakerTemplates.postExcerptPatterns?.length
      ? buildFromPatterns(template.fakerTemplates.postExcerptPatterns, fields, randomFn)
      : this.viFaker.postExcerpt();
    const thumbnail = this.getPostThumbnail(template, slug);
    
    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Published' as const, weight: 7 },
      { value: 'Draft' as const, weight: 2 },
      { value: 'Archived' as const, weight: 1 },
    ]);
    
    // Generate content với multiple paragraphs
    const paragraphCount = this.randomInt(3, 8);
    const content = Array.from({ length: paragraphCount }, () => 
      `<p>${this.faker.lorem.paragraph()}</p>`
    ).join('\n');
    
    return {
      authorName: this.users.length > 0 
        ? this.randomElement(this.users).name 
        : this.viFaker.fullName(),
      categoryId: category._id,
      content,
      excerpt,
      order: this.postCount,
      publishedAt: status === 'Published' 
        ? Date.now() - this.randomInt(0, 30 * 24 * 60 * 60 * 1000) // Last 30 days
        : undefined,
      slug,
      status,
      thumbnail,
      title,
      views: status === 'Published' ? this.randomInt(0, 5000) : 0,
    };
  }

  private getPostThumbnail(template: IndustryTemplate | null, slug: string): string | undefined {
    const randomFn = () => this.faker.number.float({ max: 1, min: 0 });

    if (this.config.useSeedMauImages === false) {
      return `https://picsum.photos/seed/${slug}/600/400`;
    }

    const pickFrom = (items: string[]) => {
      const validItems = filterAvailableSeedMauPaths(items);
      return validItems.length > 0 ? pickRandom(validItems, randomFn) : undefined;
    };

    const candidate = pickFrom(template?.assets.posts ?? [])
      ?? pickFrom(getSeedMauAssetPool('posts', { excludeIndustryKey: template?.key }));

    return candidate ?? `https://picsum.photos/seed/${slug}/600/400`;
  }
  
  validateRecord(record: PostData): boolean {
    return (
      !!record.title &&
      !!record.slug &&
      !!record.content &&
      !!record.categoryId
    );
  }
}
