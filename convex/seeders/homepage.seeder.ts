/**
 * Homepage Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency, type SeedResult } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';
import { getGalleryImages, getIndustryTemplate } from '../../lib/seed-templates';

type HomeComponentData = Omit<Doc<'homeComponents'>, '_creationTime' | '_id'>;

export class HomepageSeeder extends BaseSeeder<HomeComponentData> {
  moduleName = 'homepage';
  tableName = 'homeComponents';
  dependencies: SeedDependency[] = [
    { module: 'posts', required: false },
    { module: 'products', required: false },
  ];

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig): Promise<SeedResult> {
    const startTime = Date.now();
    this.config = { batchSize: 50, dependencies: true, force: false, ...config };

    if (config.force) {
      await this.clear();
    }

    const created = await this.seedComponents();
    await this.seedModuleConfig();
    await this.seedStats();

    return {
      created,
      dependencies: [],
      duration: Date.now() - startTime,
      module: this.moduleName,
      skipped: 0,
    };
  }

  generateFake(): HomeComponentData {
    return {
      active: true,
      config: {},
      order: 0,
      title: 'Section',
      type: 'custom',
    };
  }

  validateRecord(record: HomeComponentData): boolean {
    return !!record.title && !!record.type;
  }

  protected async clear(): Promise<void> {
    const components = await this.ctx.db.query('homeComponents').collect();
    const stats = await this.ctx.db.query('homeComponentStats').collect();
    await Promise.all([
      ...components.map(component => this.ctx.db.delete(component._id)),
      ...stats.map(stat => this.ctx.db.delete(stat._id)),
    ]);
  }

  private async seedComponents(): Promise<number> {
    const existing = await this.ctx.db.query('homeComponents').first();
    if (existing) {
      return 0;
    }

    const template = getIndustryTemplate(this.config.industryKey);
    if (template) {
      const maxHeroSlides = 3;
      const maxGalleryImages = 6;
      const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
      const productCategories = await this.ctx.db.query('productCategories').collect();
      const categoryItems = productCategories.slice(0, 6).map((category) => ({
        categoryId: category._id,
        imageMode: 'default',
      }));
      const heroSlides = template.assets.hero.length > 0
        ? this.pickMany(template.assets.hero, maxHeroSlides)
        : [];
      const galleryImages = getGalleryImages(template, maxGalleryImages, { heroWeight: 0.5, productWeight: 0.5 });
      const { selectedLogo, useSeedMauImages } = this.config;
      const hasLogoPool = useSeedMauImages && template.assets.logos.length > 0;
      const siteLogo = hasLogoPool
        ? (selectedLogo ?? pickRandom(template.assets.logos))
        : undefined;
      const partnersPool = hasLogoPool
        ? template.assets.logos.filter((logo) => logo !== siteLogo)
        : [];
      const partnersLogos = hasLogoPool
        ? this.pickMany(partnersPool, Math.min(8, partnersPool.length))
        : [];

      if (siteLogo) {
        await this.setSiteLogo(siteLogo);
      }

      const components = template.homeComponents.map((component) => {
        const config = { ...component.config } as Record<string, unknown>;
        if (component.type === 'Hero' && heroSlides.length > 0) {
          config.slides = heroSlides.map((image) => ({ image, link: '/products' }));
        }
        if (component.type === 'ProductCategories') {
          config.categories = categoryItems;
        }
        if (component.type === 'About' && galleryImages.length > 0) {
          config.image = pickRandom(galleryImages);
        }
        if (Array.isArray(config.logos) && partnersLogos.length > 0) {
          config.logos = partnersLogos;
        }
        if (Array.isArray(config.images) && galleryImages.length > 0) {
          config.images = galleryImages;
        }
        if (Array.isArray(config.gallery) && galleryImages.length > 0) {
          config.gallery = galleryImages;
        }

        return {
          active: component.active,
          config,
          order: component.order,
          title: component.title,
          type: component.type,
        };
      });

      await Promise.all(components.map((component) => this.ctx.db.insert('homeComponents', component)));
      return components.length;
    }

    const components: HomeComponentData[] = [
      {
        active: true,
        config: {
          backgroundImage: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920',
          buttonLink: '/products',
          buttonText: 'Khám phá ngay',
          heading: 'Chào mừng đến VietAdmin',
          subheading: 'Hệ thống quản trị website chuyên nghiệp',
        },
        order: 0,
        title: 'Hero Banner',
        type: 'hero',
      },
      {
        active: true,
        config: {
          content: 'VietAdmin là giải pháp quản trị website toàn diện, được thiết kế riêng cho doanh nghiệp Việt Nam.',
          heading: 'Về chúng tôi',
          image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
        },
        order: 1,
        title: 'Giới thiệu',
        type: 'about',
      },
      {
        active: true,
        config: {
          heading: 'Sản phẩm nổi bật',
          limit: 8,
          showButton: true,
          showPrice: true,
          subheading: 'Những sản phẩm được yêu thích nhất',
        },
        order: 2,
        title: 'Sản phẩm nổi bật',
        type: 'products',
      },
      {
        active: true,
        config: {
          heading: 'Tin tức & Bài viết',
          limit: 6,
          showDate: true,
          showExcerpt: true,
          subheading: 'Cập nhật những thông tin mới nhất',
        },
        order: 3,
        title: 'Bài viết mới',
        type: 'posts',
      },
      {
        active: false,
        config: {
          heading: 'Đối tác của chúng tôi',
          logos: [],
        },
        order: 4,
        title: 'Đối tác',
        type: 'partners',
      },
      {
        active: true,
        config: {
          heading: 'Liên hệ với chúng tôi',
          showForm: true,
          showMap: false,
          subheading: 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
        },
        order: 5,
        title: 'Liên hệ',
        type: 'contact',
      },
    ];

    await Promise.all(components.map(component => this.ctx.db.insert('homeComponents', component)));
    return components.length;
  }

  private pickMany<T>(items: T[], count: number): T[] {
    if (items.length <= count) {
      return items;
    }
    const pool = [...items];
    const picked: T[] = [];
    while (pool.length > 0 && picked.length < count) {
      const index = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(index, 1)[0]);
    }
    return picked;
  }

  private async setSiteLogo(logoPath: string): Promise<void> {
    const existing = await this.ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'site_logo'))
      .first();

    if (existing) {
      await this.ctx.db.patch(existing._id, { value: logoPath });
      return;
    }

    await this.ctx.db.insert('settings', {
      group: 'site',
      key: 'site_logo',
      value: logoPath,
    });
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'homepage');
  }

  private async seedStats(): Promise<void> {
    const existingStats = await this.ctx.db.query('homeComponentStats').first();
    if (existingStats) {
      return;
    }

    const components = await this.ctx.db.query('homeComponents').collect();
    const counts: Record<string, number> = { active: 0, inactive: 0, total: 0 };
    for (const component of components) {
      counts.total += 1;
      if (component.active) {
        counts.active += 1;
      } else {
        counts.inactive += 1;
      }
      counts[component.type] = (counts[component.type] || 0) + 1;
    }

    await Promise.all(
      Object.entries(counts).map(([key, count]) => this.ctx.db.insert('homeComponentStats', { count, key }))
    );
  }
}
