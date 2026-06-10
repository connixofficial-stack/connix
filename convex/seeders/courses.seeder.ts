import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { createVietnameseFaker } from './fakerVi';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';
import {
  buildFromPatterns,
  filterAvailableSeedMauPaths,
  getIndustryTemplate,
  getSeedMauAssetPool,
  mergeTemplateFields,
  pickRandom,
} from '../../lib/seed-templates';
import type { IndustryTemplate } from '../../lib/seed-templates';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';

type CourseData = Omit<Doc<'courses'>, '_id' | '_creationTime'>;

export class CourseSeeder extends BaseSeeder<CourseData> {
  moduleName = 'courses';
  tableName = 'courses';
  dependencies: SeedDependency[] = [
    { minRecords: 1, module: 'courseCategories', required: true },
  ];

  private categories: Doc<'courseCategories'>[] = [];
  private viFaker: ReturnType<typeof createVietnameseFaker>;
  private courseCount = 0;

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
    this.viFaker = createVietnameseFaker(this.faker);
  }

  async seed(config: SeedConfig) {
    this.categories = await this.ctx.db.query('courseCategories').take(500);

    if (this.categories.length === 0) {
      throw new Error('No course categories found. Seed courseCategories first.');
    }

    return super.seed(config);
  }

  generateFake(): CourseData {
    const category = this.randomElement(this.categories);
    const template = getIndustryTemplate(this.config.industryKey);
    const randomFn = () => this.faker.number.float({ max: 1, min: 0 });
    const fields = mergeTemplateFields(template?.fakerTemplates);
    const title = template?.fakerTemplates.namePatterns?.length
      ? buildFromPatterns(template.fakerTemplates.namePatterns, fields, randomFn)
      : `Khóa học ${this.viFaker.serviceName()}`;
    const slug = `${this.slugify(title)}-${this.courseCount++}`;
    const description = template?.fakerTemplates.descriptionPatterns?.length
      ? buildFromPatterns(template.fakerTemplates.descriptionPatterns, fields, randomFn)
      : this.faker.lorem.paragraph();
    const thumbnail = this.getCourseThumbnail(template, slug);
    const pricingType = this.faker.helpers.weightedArrayElement([
      { value: 'paid' as const, weight: 7 },
      { value: 'free' as const, weight: 2 },
      { value: 'contact' as const, weight: 1 },
    ]);
    const priceAmount = pricingType === 'paid' ? this.randomInt(500_000, 8_000_000) : undefined;
    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Published' as const, weight: 7 },
      { value: 'Draft' as const, weight: 2 },
      { value: 'Archived' as const, weight: 1 },
    ]);

    return {
      categoryId: category._id,
      chapterCount: 0,
      comparePriceAmount: priceAmount ? Math.round(priceAmount * 1.35) : undefined,
      content: `<p>${description}</p><p>Khóa học gồm các bài học thực hành, ví dụ mẫu và hướng dẫn triển khai.</p>`,
      durationSeconds: this.randomInt(7200, 54000),
      durationText: `${this.randomInt(4, 30)} giờ học`,
      excerpt: description,
      featured: this.randomBoolean(0.25),
      instructorName: this.faker.person.fullName(),
      introVideoType: this.randomBoolean(0.5) ? 'youtube' : 'none',
      introVideoUrl: this.randomBoolean(0.5) ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,
      isPriceVisible: true,
      lessonCount: 0,
      level: this.randomElement(['Beginner', 'Intermediate', 'Advanced'] as const),
      metaDescription: description.slice(0, 160),
      metaTitle: title,
      order: this.courseCount,
      priceAmount,
      pricingType,
      publishedAt: status === 'Published' ? Date.now() - this.randomInt(0, 90) * 86_400_000 : undefined,
      renderType: 'content',
      slug,
      status,
      thumbnail,
      thumbnailStorageId: null,
      title,
      views: status === 'Published' ? this.randomInt(0, 2000) : 0,
    };
  }

  validateRecord(record: CourseData): boolean {
    return !!record.title && !!record.slug && !!record.categoryId && !!record.content;
  }

  protected async insertRecords(records: CourseData[]): Promise<void> {
    for (const record of records) {
      const courseId = await this.ctx.db.insert('courses', record);
      const chapterCount = this.randomInt(2, 5);
      let lessonCount = 0;

      for (let chapterIndex = 0; chapterIndex < chapterCount; chapterIndex += 1) {
        const now = Date.now();
        const chapterId = await this.ctx.db.insert('courseChapters', {
          active: true,
          courseId,
          createdAt: now,
          order: chapterIndex,
          summary: `Tổng quan phần ${chapterIndex + 1}`,
          title: `Chương ${chapterIndex + 1}: ${this.faker.lorem.words({ max: 5, min: 3 })}`,
          updatedAt: now,
        });

        const lessonsInChapter = this.randomInt(3, 7);
        for (let lessonIndex = 0; lessonIndex < lessonsInChapter; lessonIndex += 1) {
          await this.ctx.db.insert('courseLessons', {
            active: true,
            chapterId,
            courseId,
            createdAt: now,
            description: this.faker.lorem.sentence(),
            durationSeconds: this.randomInt(300, 2400),
            isPreview: chapterIndex === 0 && lessonIndex === 0,
            order: lessonIndex,
            title: `Bài ${lessonIndex + 1}: ${this.faker.lorem.words({ max: 6, min: 3 })}`,
            updatedAt: now,
            videoType: this.randomBoolean(0.7) ? 'youtube' : 'none',
            videoUrl: this.randomBoolean(0.7) ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,
          });
          lessonCount += 1;
        }
      }

      await this.ctx.db.patch(courseId, { chapterCount, lessonCount });
    }
  }

  protected async clear(): Promise<void> {
    const lessons = await this.ctx.db.query('courseLessons').take(5000);
    const chapters = await this.ctx.db.query('courseChapters').take(5000);
    const assignments = await this.ctx.db.query('courseCategoryAssignments').take(5000);
    const courses = await this.ctx.db.query('courses').take(5000);
    await Promise.all(lessons.map((item) => this.ctx.db.delete(item._id)));
    await Promise.all(chapters.map((item) => this.ctx.db.delete(item._id)));
    await Promise.all(assignments.map((item) => this.ctx.db.delete(item._id)));
    await Promise.all(courses.map((item) => this.ctx.db.delete(item._id)));
  }

  protected async afterSeed(count: number): Promise<void> {
    void count;
    await syncModuleRuntimeConfig(this.ctx, 'courses');
  }

  private getCourseThumbnail(template: IndustryTemplate | null, slug: string): string {
    const randomFn = () => this.faker.number.float({ max: 1, min: 0 });

    if (this.config.useSeedMauImages === false) {
      return `https://picsum.photos/seed/${slug}/800/500`;
    }

    const pickFrom = (items: string[]) => {
      const validItems = filterAvailableSeedMauPaths(items);
      return validItems.length > 0 ? pickRandom(validItems, randomFn) : undefined;
    };

    const candidate = pickFrom(template?.assets.products ?? [])
      ?? pickFrom(template?.assets.hero ?? [])
      ?? pickFrom(getSeedMauAssetPool('products', { excludeIndustryKey: template?.key }));

    return candidate ?? `https://picsum.photos/seed/${slug}/800/500`;
  }
}
