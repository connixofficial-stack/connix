export type WebsiteType = 'landing' | 'blog' | 'catalog' | 'ecommerce' | 'services';

export type SaleMode = 'cart' | 'contact' | 'affiliate';

export type ProductType = 'physical' | 'digital' | 'both';

export type DigitalDeliveryType = 'account' | 'license' | 'download' | 'custom';

export type VariantPresetKey = string;

export type VariantPricing = 'product' | 'variant';
export type VariantStock = 'product' | 'variant';
export type VariantImages = 'inherit' | 'override' | 'both';

export type DataScale = 'low' | 'medium' | 'high' | 'none';

export type BusinessInfo = {
  address: string;
  brandColor: string;
  brandMode: 'single' | 'dual';
  brandSecondary: string;
  businessType: string;
  email: string;
  faviconUrl: string;
  ogImageUrl: string;
  openingHours: string;
  phone: string;
  siteName: string;
  socialFacebook: string;
  tagline: string;
  useLogoAsOgImage: boolean;
};

export type AdminConfig = {
  email: string;
  password: string;
};

export type AdminPermissionMode = 'simple_full_admin' | 'rbac';

export type ExperiencePresetKey = string;

export type QuickConfig = {
  commentsDefaultStatus: 'Pending' | 'Approved';
  lowStockThreshold: number;
  orderStatusPreset: 'simple' | 'standard' | 'advanced';
  ordersPerPage: number;
  postsDefaultStatus: 'draft' | 'published';
  postsPerPage: number;
  productsDefaultStatus: 'Draft' | 'Active';
  productsPerPage: number;
};

export type WizardState = {
  adminConfig: AdminConfig;
  adminPermissionMode: AdminPermissionMode;
  businessInfo: BusinessInfo;
  customerLoginEnabled: boolean;
  customerLoginManuallySet: boolean;
  clearBeforeSeed: boolean;
  dataScale: DataScale;
  digitalDeliveryType: DigitalDeliveryType;
  experiencePresetKey: ExperiencePresetKey;
  extraFeatures: Set<string>;
  industryKey: string | null;
  logoCustomized: boolean;
  productType: ProductType;
  quickConfig: QuickConfig;
  quickConfigSkipped: boolean;
  saleMode: SaleMode;
  selectedLogo: string | null;
  useSeedMauImages: boolean;
  variantEnabled: boolean;
  variantImages: VariantImages;
  variantPresetKey: VariantPresetKey;
  variantPricing: VariantPricing;
  variantStock: VariantStock;
  productFramesEnabled: boolean;
  productSupplementalContentEnabled: boolean;
  websiteType: WebsiteType;
};
