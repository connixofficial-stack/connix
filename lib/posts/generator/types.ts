export type SaleMode = 'cart' | 'contact' | 'affiliate';
export type Tone = 'sales' | 'helpful' | 'expert' | 'friendly';

export type SlotKey =
  | 'hero'
  | 'problem'
  | 'criteria'
  | 'top_list'
  | 'spotlight'
  | 'comparison'
  | 'budget'
  | 'cta'
  | 'disclaimer';

export type MacroTemplateKey =
  | 'top_best_sellers'
  | 'top_use_case'
  | 'compare_two'
  | 'top_under_budget'
  | 'top_between_budget'
  | 'top_category'
  | 'beginner_friendly'
  | 'premium_pick'
  | 'seasonal_pick'
  | 'goal_focused'
  | 'combo_recommendation'
  | 'best_alternative'
  | 'buyer_checklist'
  | 'buyer_faq'
  | 'common_mistakes'
  | 'review_by_criteria'
  | 'compare_three_budget'
  | 'value_popular'
  | 'choose_by_audience'
  | 'ranking_periodic';

export type ProductStrategy =
  | 'best_sellers'
  | 'use_case'
  | 'compare'
  | 'budget_under'
  | 'budget_between'
  | 'category'
  | 'value_popular';

export interface GeneratorProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  sales?: number;
  image?: string;
  images?: string[];
  affiliateLink?: string;
  categoryName?: string;
  categoryId?: string;
  categorySlug?: string;
  categoryImage?: string;
  description?: string;
  relatedProducts?: GeneratorRelatedProduct[];
}

export interface GeneratorRelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  sales?: number;
  image?: string;
  affiliateLink?: string;
  categorySlug?: string;
}

export interface GeneratorSettings {
  minSlots: number;
  maxSlots: number;
  diversityLevel: 'low' | 'medium' | 'high';
  regenerateStrength: 'soft' | 'strong';
  defaultTone: Tone;
  internalLinkDensity: 'low' | 'medium' | 'high';
}

export interface GeneratorRequest {
  templateKey: MacroTemplateKey;
  productLimit?: number;
  budgetMin?: number;
  budgetMax?: number;
  keyword?: string;
  compareSlugs?: string[];
  selectedProductSlugs?: string[];
  categoryId?: string;
  useCase?: string;
  tone?: Tone;
  seed: string;
}

export interface GeneratedContentBlock {
  slotKey: SlotKey;
  title: string;
  html: string;
  images?: string[];
  variantCapacity: number;
  sectionVariant?: string;
}

export interface InternalLinkItem {
  label: string;
  href: string;
}

export interface MediaPlan {
  heroImage?: string;
  inlineImages: Record<string, string[]>;
  inlineImageRoles?: Record<string, 'hero' | 'card' | 'rail'>;
  galleryImages?: Record<string, string[]>;
}

export interface GeneratedArticlePayload {
  templateKey: MacroTemplateKey;
  seed: string;
  tone: Tone;
  title: string;
  excerpt: string;
  contentHtml: string;
  metaTitle: string;
  metaDescription: string;
  thumbnail?: string;
  disclaimerHtml?: string;
  blocks: GeneratedContentBlock[];
  internalLinks: InternalLinkItem[];
  mediaPlan: MediaPlan;
  variantCapacities: Record<SlotKey, number>;
  products: GeneratorProduct[];
  qualityWarnings?: string[];
  layoutMeta?: {
    tocStyle?: string;
    articleVariant?: string;
  };
}
