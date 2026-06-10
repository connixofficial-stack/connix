import { DEFAULT_HERO_CONTENT } from '@/app/admin/home-components/hero/_lib/constants';
import { DEFAULT_SPEED_DIAL_CONFIG } from '@/app/admin/home-components/speed-dial/_lib/constants';
import { DEFAULT_CTA_CONFIG } from '@/app/admin/home-components/cta/_lib/constants';
import { DEFAULT_CONTACT_CONFIG, buildDefaultContactItems } from '@/app/admin/home-components/contact/_lib/constants';
import { DEFAULT_PRODUCT_LIST_CONFIG, DEFAULT_PRODUCT_LIST_TEXT } from '@/app/admin/home-components/product-list/_lib/constants';
import { DEFAULT_PRODUCT_GRID_CONFIG } from '@/app/admin/home-components/product-grid/_lib/constants';
import { DEFAULT_CATEGORY_PRODUCTS_CONFIG } from '@/app/admin/home-components/category-products/_lib/constants';
import { DEFAULT_SERVICES_CONFIG } from '@/app/admin/home-components/services/_lib/constants';
import { DEFAULT_SERVICE_LIST_CONFIG } from '@/app/admin/home-components/service-list/_lib/constants';
import { DEFAULT_PROCESS_CONFIG } from '@/app/admin/home-components/process/_lib/constants';
import { DEFAULT_BLOG_CONFIG } from '@/app/admin/home-components/blog/_lib/constants';
import { DEFAULT_TESTIMONIALS_CONFIG } from '@/app/admin/home-components/testimonials/_lib/constants';
import { DEFAULT_FAQ_CONFIG } from '@/app/admin/home-components/faq/_lib/constants';
import { DEFAULT_ABOUT_CONFIG } from '@/app/admin/home-components/about/_lib/constants';
import { DEFAULT_BENEFITS_CONFIG } from '@/app/admin/home-components/benefits/_lib/constants';
import { DEFAULT_FEATURES_CONFIG } from '@/app/admin/home-components/features/_lib/constants';
import { DEFAULT_STATS_ITEMS } from '@/app/admin/home-components/stats/_lib/constants';
import { DEFAULT_GALLERY_ITEMS } from '@/app/admin/home-components/gallery/_lib/constants';
import { DEFAULT_TEAM_CONFIG } from '@/app/admin/home-components/team/_lib/constants';
import { DEFAULT_CLIENTS_CONFIG } from '@/app/admin/home-components/clients/_lib/constants';
import { DEFAULT_PRICING_CONFIG } from '@/app/admin/home-components/pricing/_lib/constants';
import { DEFAULT_COUNTDOWN_CONFIG } from '@/app/admin/home-components/countdown/_lib/constants';
import { normalizeCountdownConfig } from '@/app/admin/home-components/countdown/_lib/normalize';
import { DEFAULT_VOUCHER_PROMOTIONS_CONFIG } from '@/app/admin/home-components/voucher-promotions/_lib/constants';
import { DEFAULT_VIDEO_CONFIG } from '@/app/admin/home-components/video/_lib/constants';
import { DEFAULT_FOOTER_CONFIG, normalizeFooterConfig } from '@/app/admin/home-components/footer/_lib/constants';
import { DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG, normalizeHomepageCategoryHeroCategories } from '@/app/admin/home-components/homepage-category-hero/_lib/constants';

type SampleIds = {
  postIds: string[];
  productCategoryIds: string[];
  productIds: string[];
  serviceIds: string[];
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600';

export const buildDefaultConfig = (type: string, sampleIds: SampleIds) => {
  switch (type) {
    case 'Hero':
      return {
        slides: [{ image: HERO_IMAGE, link: '/products' }],
        style: 'slider',
        content: DEFAULT_HERO_CONTENT,
      };
    case 'SpeedDial':
      return DEFAULT_SPEED_DIAL_CONFIG;
    case 'CTA':
      return DEFAULT_CTA_CONFIG;
    case 'Contact':
      return {
        ...DEFAULT_CONTACT_CONFIG,
        contactItems: buildDefaultContactItems(),
      };
    case 'ProductCategories':
      return {
        categories: sampleIds.productCategoryIds.map((categoryId) => ({
          categoryId,
          imageMode: 'default',
        })),
        style: 'grid',
        showProductCount: true,
        columnsDesktop: 4,
        columnsMobile: 2,
      };
    case 'ProductList':
      return {
        ...DEFAULT_PRODUCT_LIST_CONFIG,
        ...DEFAULT_PRODUCT_LIST_TEXT,
        style: 'commerce',
      };
    case 'ProductGrid':
      return DEFAULT_PRODUCT_GRID_CONFIG;
    case 'CategoryProducts':
      return DEFAULT_CATEGORY_PRODUCTS_CONFIG;
    case 'Services':
      return DEFAULT_SERVICES_CONFIG;
    case 'ServiceList':
      return DEFAULT_SERVICE_LIST_CONFIG;
    case 'Process':
      return DEFAULT_PROCESS_CONFIG;
    case 'Blog':
      return {
        ...DEFAULT_BLOG_CONFIG,
        selectedPostIds: sampleIds.postIds,
      };
    case 'Testimonials':
      return DEFAULT_TESTIMONIALS_CONFIG;
    case 'TrustBadges':
      return {
        items: DEFAULT_GALLERY_ITEMS,
        style: 'cards',
      };
    case 'FAQ':
      return DEFAULT_FAQ_CONFIG;
    case 'About':
      return DEFAULT_ABOUT_CONFIG;
    case 'Benefits':
      return DEFAULT_BENEFITS_CONFIG;
    case 'Features':
      return DEFAULT_FEATURES_CONFIG;
    case 'Stats':
      return {
        items: DEFAULT_STATS_ITEMS,
        style: 'horizontal',
      };
    case 'Gallery':
      return {
        items: DEFAULT_GALLERY_ITEMS,
        style: 'grid',
      };
    case 'Team':
      return DEFAULT_TEAM_CONFIG;
    case 'CaseStudy':
      return {
        projects: [
          {
            category: '',
            description: '',
            image: '',
            link: '',
            title: '',
          },
        ],
        style: 'grid',
      };
    case 'Clients':
      return DEFAULT_CLIENTS_CONFIG;
    case 'Pricing':
      return DEFAULT_PRICING_CONFIG;
    case 'Countdown':
      return normalizeCountdownConfig(DEFAULT_COUNTDOWN_CONFIG);
    case 'VoucherPromotions':
      return DEFAULT_VOUCHER_PROMOTIONS_CONFIG;
    case 'Video':
      return DEFAULT_VIDEO_CONFIG;
    case 'Partners':
      return {
        items: [
          {
            link: '',
            name: '',
            url: '',
          },
        ],
        logoSize: 'normal',
        showBorder: true,
        spacing: 'normal',
        style: 'grid',
      };
    case 'HomepageCategoryHero':
      return {
        ...DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG,
        categories: normalizeHomepageCategoryHeroCategories(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categories),
      };
    case 'Footer':
      return normalizeFooterConfig(DEFAULT_FOOTER_CONFIG);
    default:
      return {};
  }
};
