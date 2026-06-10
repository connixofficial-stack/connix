import type { HomeComponentRecord } from '@/components/site/home/types';

export type SnapshotIntegrityLevel = 'demo-safe' | 'partial' | 'broken';

export type SnapshotSiteSettings = {
  site_name: string;
  site_tagline: string;
  site_url: string;
  site_logo: string;
  site_favicon: string;
  site_brand_primary: string;
  site_brand_secondary: string;
  site_brand_mode: 'single' | 'dual';
  site_timezone: string;
  site_language: string;
};

export type SnapshotContactSettings = {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  contact_zalo: string;
  contact_map_provider: string;
  contact_google_map_embed_iframe: string;
};

export type SnapshotSocialSettings = {
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  social_tiktok: string;
  social_twitter: string;
  social_linkedin: string;
  social_pinterest: string;
};

export type SnapshotSEOSettings = {
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_og_image: string;
  seo_google_verification: string;
  seo_bing_verification: string;
};

export type SnapshotRoutingSettings = {
  ia_route_mode: string;
};

export type SnapshotModuleSettings = {
  cart: boolean;
  wishlist: boolean;
  products: boolean;
  posts: boolean;
  services: boolean;
  customers: boolean;
  orders: boolean;
  customerLogin: boolean;
};

export type SnapshotMenuItem = {
  _id: string;
  active: boolean;
  depth: number;
  icon?: string;
  label: string;
  menuId: string;
  openInNewTab?: boolean;
  order: number;
  parentId?: string;
  url: string;
};

export type SnapshotMenuPayload = {
  menu: {
    _id: string;
    location: string;
    name: string;
  };
  items: SnapshotMenuItem[];
};

export type SnapshotResolvedProductItem = {
  id: string;
  name: string;
  image?: string;
  images?: string[];
  description?: string;
  price?: number;
  salePrice?: number;
  slug?: string;
  href?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  hasVariants?: boolean;
};

export type SnapshotResolvedServiceItem = {
  id: string;
  title: string;
  image?: string;
  excerpt?: string;
  price?: number;
  slug?: string;
  href?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  views?: number;
};

export type SnapshotResolvedPostItem = {
  id: string;
  title: string;
  excerpt?: string;
  image?: string;
  slug?: string;
  href?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  publishedAt?: number;
};

export type SnapshotResolvedCategoryItem = {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  description?: string;
  productCount?: number;
  displayImage?: string;
  displayIcon?: string;
  salesCount?: number;
};

export type SnapshotResolvedSection = {
  category: SnapshotResolvedCategoryItem;
  products: SnapshotResolvedProductItem[];
};

export type SnapshotHeroLinkItem = {
  label: string;
  href: string;
  productId?: string;
  productName?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
};

export type SnapshotHeroGroup = {
  title: string;
  subtitle?: string;
  items: SnapshotHeroLinkItem[];
};

export type SnapshotHeroCategory = {
  id: string | number;
  categoryId: string;
  name: string;
  slug?: string;
  image?: string;
  ctaLabel?: string;
  iconName?: string;
  groups: SnapshotHeroGroup[];
};

export type SnapshotComponentResolvedData =
  | {
      kind: 'product-list';
      items: SnapshotResolvedProductItem[];
      categories: SnapshotResolvedCategoryItem[];
      settings: Record<string, unknown>;
    }
  | {
      kind: 'service-list';
      items: SnapshotResolvedServiceItem[];
      categories: SnapshotResolvedCategoryItem[];
      settings: Record<string, unknown>;
    }
  | {
      kind: 'blog';
      posts: SnapshotResolvedPostItem[];
      categories: SnapshotResolvedCategoryItem[];
      settings: Record<string, unknown>;
    }
  | {
      kind: 'product-categories';
      categories: SnapshotResolvedCategoryItem[];
    }
  | {
      kind: 'category-products';
      sections: SnapshotResolvedSection[];
      settings: Record<string, unknown>;
    }
  | {
      kind: 'homepage-category-hero';
      payload: {
        categories: SnapshotHeroCategory[];
        settings: Record<string, unknown>;
      };
    }
  | {
      kind: 'contact';
      settings: SnapshotContactSettings;
      social: SnapshotSocialSettings;
    }
  | {
      kind: 'footer';
      site: SnapshotSiteSettings;
      contact: SnapshotContactSettings;
      social: SnapshotSocialSettings;
      footerMenu?: SnapshotMenuPayload | null;
    }
  | {
      kind: 'unknown';
      payload: Record<string, unknown>;
    };

export type SnapshotDemoBundle = {
  integrity: {
    level: SnapshotIntegrityLevel;
    requiredMissing: string[];
    warnings: string[];
  };
  settings: {
    site: SnapshotSiteSettings;
    contact: SnapshotContactSettings;
    social: SnapshotSocialSettings;
    seo?: SnapshotSEOSettings;
    routing: SnapshotRoutingSettings;
    header?: {
      header_style?: string;
      header_config?: Record<string, unknown>;
    };
  };
  menus: {
    header?: SnapshotMenuPayload | null;
    footer?: SnapshotMenuPayload | null;
  };
  modules?: SnapshotModuleSettings;
  componentData: Record<string, SnapshotComponentResolvedData>;
  systemStyle?: {
    hiddenTypes?: string[];
    typeColorOverrides?: Record<string, unknown>;
    typeFontOverrides?: Record<string, unknown>;
    globalFontOverride?: {
      enabled: boolean;
      fontKey: string;
    };
  } | null;
};

export type SnapshotDemoPayload = {
  label: string;
  components: HomeComponentRecord[];
  bundle: SnapshotDemoBundle;
};
