import { BaseSeeder, type SeedConfig, type SeedResult } from './base';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type LandingPageData = Omit<Doc<'landingPages'>, '_creationTime' | '_id'>;

export class LandingPagesSeeder extends BaseSeeder<LandingPageData> {
  moduleName = 'landingPages';
  tableName = 'landingPages';
  dependencies = [];

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig): Promise<SeedResult> {
    const startTime = Date.now();
    this.config = { batchSize: 50, dependencies: true, force: false, ...config };

    if (this.config.force) {
      await this.clear();
    }

    const existing = await this.ctx.db.query('landingPages').first();
    if (existing) {
      return {
        created: 0,
        dependencies: [],
        duration: Date.now() - startTime,
        module: this.moduleName,
        skipped: 1,
      };
    }

    const now = Date.now();
    const pages: LandingPageData[] = [
      // Features
      {
        slug: 'seo-automation',
        title: 'SEO Automation',
        summary: 'Tự động hóa SEO với metadata engine thông minh, canonical policy và schema tự động',
        content: '<p>Hệ thống SEO tự động giúp bạn tối ưu hóa website mà không cần kiến thức SEO chuyên sâu.</p>',
        heroImage: undefined,
        status: 'published',
        landingType: 'feature',
        primaryIntent: 'automated seo tools for saas',
        faqItems: [
          { question: 'SEO automation hoạt động như thế nào?', answer: 'Hệ thống tự động sinh metadata, canonical, schema từ dữ liệu thật.' },
          { question: 'Có cần kiến thức SEO không?', answer: 'Không, hệ thống tự động xử lý theo best practices.' },
        ],
        relatedSlugs: ['zero-config-seo'],
        relatedProductSlugs: undefined,
        relatedServiceSlugs: undefined,
        updatedAt: now,
        publishedAt: now,
        order: 1,
      },
      {
        slug: 'zero-config-seo',
        title: 'Zero-Config SEO',
        summary: 'SEO mạnh mẽ mà không cần cấu hình phức tạp, hệ thống tự suy luận từ dữ liệu',
        content: '<p>Convention-over-Configuration: ít config hơn, hành vi mặc định đúng, dễ scale.</p>',
        status: 'published',
        landingType: 'feature',
        primaryIntent: 'zero configuration seo platform',
        updatedAt: now,
        publishedAt: now,
        order: 2,
      },
      // Use Cases
      {
        slug: 'saas-seo-growth',
        title: 'SaaS SEO Growth',
        summary: 'Tăng trưởng organic traffic cho SaaS với programmatic landing pages',
        content: '<p>Chiến lược SEO growth cho SaaS: landing pages theo intent, internal linking, content clusters.</p>',
        status: 'published',
        landingType: 'use-case',
        primaryIntent: 'saas seo growth strategy',
        relatedSlugs: ['ecommerce-seo'],
        updatedAt: now,
        publishedAt: now,
        order: 1,
      },
      {
        slug: 'ecommerce-seo',
        title: 'E-commerce SEO',
        summary: 'Tối ưu SEO cho website thương mại điện tử với product schema và rich snippets',
        content: '<p>SEO cho e-commerce: product schema, category pages, internal linking, site speed.</p>',
        status: 'published',
        landingType: 'use-case',
        primaryIntent: 'ecommerce seo optimization',
        updatedAt: now,
        publishedAt: now,
        order: 2,
      },
      // Solutions
      {
        slug: 'convex-vercel-seo',
        title: 'Convex + Vercel SEO Solution',
        summary: 'Giải pháp SEO tối ưu cho stack Convex + Vercel free tier',
        content: '<p>Tối ưu SEO trên Convex + Vercel: server-first rendering, lightweight queries, cache strategy.</p>',
        status: 'published',
        landingType: 'solution',
        primaryIntent: 'convex vercel seo optimization',
        updatedAt: now,
        publishedAt: now,
        order: 1,
      },
      // Compare
      {
        slug: 'vs-manual-seo',
        title: 'Automated SEO vs Manual SEO',
        summary: 'So sánh SEO tự động và SEO thủ công: ưu nhược điểm và khi nào nên dùng',
        content: '<p>SEO tự động giúp scale nhanh, nhất quán, ít lỗi. SEO thủ công linh hoạt hơn nhưng tốn thời gian.</p>',
        status: 'published',
        landingType: 'compare',
        primaryIntent: 'automated vs manual seo comparison',
        updatedAt: now,
        publishedAt: now,
        order: 1,
      },
      // Integrations
      {
        slug: 'google-search-console',
        title: 'Google Search Console Integration',
        summary: 'Tích hợp Google Search Console để theo dõi performance và index coverage',
        content: '<p>Kết nối Google Search Console để monitor indexed pages, CTR, impressions, và query data.</p>',
        status: 'published',
        landingType: 'integration',
        primaryIntent: 'google search console integration',
        updatedAt: now,
        publishedAt: now,
        order: 1,
      },
      // Templates
      {
        slug: 'landing-page-template',
        title: 'SEO Landing Page Template',
        summary: 'Template chuẩn cho landing page SEO-optimized với metadata và schema',
        content: '<p>Template landing page với metadata tự động, schema markup, breadcrumb, và FAQ schema.</p>',
        status: 'published',
        landingType: 'template',
        primaryIntent: 'seo landing page template',
        updatedAt: now,
        publishedAt: now,
        order: 1,
      },
      // Guides
      {
        slug: 'seo-best-practices-2026',
        title: 'SEO Best Practices 2026',
        summary: 'Hướng dẫn SEO best practices năm 2026: Core Web Vitals, E-E-A-T, AI content',
        content: '<p>Best practices SEO 2026: server-first rendering, Core Web Vitals, E-E-A-T signals, structured data.</p>',
        status: 'published',
        landingType: 'guide',
        primaryIntent: 'seo best practices 2026',
        faqItems: [
          { question: 'Core Web Vitals quan trọng như thế nào?', answer: 'Rất quan trọng, ảnh hưởng trực tiếp đến ranking.' },
          { question: 'E-E-A-T là gì?', answer: 'Experience, Expertise, Authoritativeness, Trustworthiness - tiêu chí đánh giá content quality.' },
        ],
        updatedAt: now,
        publishedAt: now,
        order: 1,
      },
    ];

    await Promise.all(pages.map(page => this.ctx.db.insert('landingPages', page)));

    return {
      created: pages.length,
      dependencies: [],
      duration: Date.now() - startTime,
      module: this.moduleName,
      skipped: 0,
    };
  }

  generateFake(): LandingPageData {
    return {
      slug: 'sample-page',
      title: 'Sample Landing Page',
      summary: 'Sample summary',
      status: 'draft',
      landingType: 'feature',
      updatedAt: Date.now(),
    };
  }

  validateRecord(record: LandingPageData): boolean {
    return !!record.slug && !!record.title && !!record.summary;
  }

  protected async clear(): Promise<void> {
    const pages = await this.ctx.db.query('landingPages').collect();
    await Promise.all(pages.map(page => this.ctx.db.delete(page._id)));
  }
}
