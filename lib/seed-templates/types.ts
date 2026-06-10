export type IndustryCategory =
  | 'fashion-beauty'
  | 'technology'
  | 'food-beverage'
  | 'health-wellness'
  | 'retail'
  | 'services'
  | 'business'
  | 'environment';

export type WebsiteType = 'landing' | 'blog' | 'catalog' | 'ecommerce' | 'services';
export type SaleMode = 'cart' | 'contact' | 'affiliate';
export type ProductType = 'physical' | 'digital' | 'both';

export type IndustryAssetPack = {
  hero: string[];
  products: string[];
  posts: string[];
  logos: string[];
  gallery: string[];
};

export type FakerTemplate = {
  namePatterns: string[];
  descriptionPatterns: string[];
  postTitlePatterns: string[];
  postExcerptPatterns: string[];
  serviceNamePatterns: string[];
  categoryNames: string[];
  postCategoryNames: string[];
  serviceCategoryNames: string[];
  tags: string[];
  customFields: Record<string, string[]>;
};

export type HomeComponentTemplate = {
  type: string;
  title: string;
  order: number;
  active: boolean;
  config: Record<string, unknown>;
};

export type IndustryTemplate = {
  key: string;
  name: string;
  icon: string;
  description: string;
  category: IndustryCategory;
  websiteTypes: WebsiteType[];
  saleMode: SaleMode;
  productType: ProductType;
  businessType: string;
  brandColor: string;
  tags: string[];
  assets: IndustryAssetPack;
  fakerTemplates: FakerTemplate;
  homeComponents: HomeComponentTemplate[];
  experiencePresetKey: string;
};

export type IndustrySummary = Pick<
  IndustryTemplate,
  'key' | 'name' | 'icon' | 'description' | 'category' | 'websiteTypes' | 'saleMode' | 'productType' | 'businessType' | 'brandColor' | 'tags' | 'experiencePresetKey'
>;
