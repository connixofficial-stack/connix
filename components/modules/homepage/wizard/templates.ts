import type { TemplateDefinition } from './types';

export const HOMEPAGE_TEMPLATES: TemplateDefinition[] = [
  {
    key: 'conversion_lean',
    name: 'Conversion Lean 8',
    description: 'Ưu tiên chuyển đổi nhanh, trust + FAQ rõ ràng.',
    sequence: ['Hero', 'ProductCategories', 'ProductList', 'TrustBadges', 'Testimonials', 'CTA', 'FAQ', 'Contact'],
    insertionPoints: {
      afterHero: ['TrustBadges', 'Partners', 'Clients'],
      midContent: ['Benefits', 'Features', 'Stats', 'About'],
      beforeCTA: ['Blog', 'Gallery', 'Video'],
    },
  },
  {
    key: 'content_commerce',
    name: 'Content Commerce 8',
    description: 'Kết hợp bán hàng + nội dung để giữ chân.',
    sequence: ['Hero', 'ProductList', 'Benefits', 'Blog', 'Testimonials', 'CTA', 'FAQ', 'Footer'],
    insertionPoints: {
      afterHero: ['ProductCategories', 'TrustBadges'],
      midContent: ['Gallery', 'Team', 'CaseStudy'],
      beforeCTA: ['Contact', 'Pricing'],
    },
  },
  {
    key: 'service_authority',
    name: 'Service Authority 8',
    description: 'Tập trung dịch vụ, quy trình và case study.',
    sequence: ['Hero', 'Services', 'Process', 'CaseStudy', 'Testimonials', 'CTA', 'FAQ', 'Contact'],
    insertionPoints: {
      afterHero: ['About', 'Benefits'],
      midContent: ['Gallery', 'Video', 'Team'],
      beforeCTA: ['Pricing', 'Blog'],
    },
  },
  {
    key: 'catalog_explorer',
    name: 'Catalog Explorer 8',
    description: 'Đẩy khám phá danh mục/sản phẩm.',
    sequence: ['Hero', 'ProductCategories', 'CategoryProducts', 'ProductGrid', 'TrustBadges', 'Blog', 'CTA', 'Footer'],
    insertionPoints: {
      afterHero: ['HomepageCategoryHero', 'SpeedDial'],
      midContent: ['Testimonials', 'Benefits'],
      beforeCTA: ['FAQ', 'Contact'],
    },
  },
  {
    key: 'local_biz',
    name: 'Local Biz Lead 8',
    description: 'Leadgen cho doanh nghiệp địa phương.',
    sequence: ['Hero', 'About', 'Benefits', 'Services', 'Testimonials', 'FAQ', 'Contact', 'Footer'],
    insertionPoints: {
      afterHero: ['Stats', 'Clients'],
      midContent: ['Gallery', 'Process'],
      beforeCTA: ['CTA'],
    },
  },
  {
    key: 'brand_story',
    name: 'Brand Story 8',
    description: 'Kể chuyện thương hiệu + đội ngũ.',
    sequence: ['Hero', 'About', 'Team', 'CaseStudy', 'Clients', 'Blog', 'CTA', 'Footer'],
    insertionPoints: {
      afterHero: ['Stats', 'Partners'],
      midContent: ['Gallery', 'Video'],
      beforeCTA: ['Contact'],
    },
  },
  {
    key: 'promo_campaign',
    name: 'Promo Campaign 8',
    description: 'Chiến dịch khuyến mãi + countdown.',
    sequence: ['Hero', 'Countdown', 'VoucherPromotions', 'ProductList', 'Testimonials', 'FAQ', 'CTA', 'Contact'],
    insertionPoints: {
      afterHero: ['TrustBadges', 'Partners'],
      midContent: ['ProductCategories', 'ProductGrid'],
      beforeCTA: ['Blog'],
    },
  },
  {
    key: 'hybrid_dynamic',
    name: 'Hybrid Dynamic 8',
    description: 'Linh hoạt theo dữ liệu thật đang mạnh.',
    sequence: ['Hero', 'ProductList', 'TrustBadges', 'Testimonials', 'Blog', 'CTA', 'Contact', 'Footer'],
    insertionPoints: {
      afterHero: ['Services', 'ServiceList', 'ProductCategories'],
      midContent: ['Testimonials', 'FAQ', 'Benefits'],
      beforeCTA: ['Pricing', 'Process'],
    },
  },
];
