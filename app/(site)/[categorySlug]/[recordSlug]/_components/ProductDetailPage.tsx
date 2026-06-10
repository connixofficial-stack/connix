'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import type { PaginationStatus } from 'convex/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useInView } from 'react-intersection-observer';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import {
  getProductDetailColors,
  resolveProductDetailElementColor,
  type ProductDetailColors,
  type ProductDetailElementColorChoice,
} from '@/components/site/products/detail/_lib/colors';
import { ProductImageLightbox } from '@/components/site/products/detail/_components/ProductImageLightbox';
import {
  DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  getProductImageFrameConfig,
  getVerticalThumbnailSlots,
  isProductImageAspectRatio,
  type ProductImageAspectRatio,
} from '@/components/site/products/detail/_lib/image-aspect-ratio';
import { resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { ProductImageWithOverlay, ProductImageWithOverlayAuto, useProductImageOverlayConfigs } from '@/components/shared/ProductImageWithOverlay';
import { RichContent, withFormatMarker } from '@/components/common/RichContent';
import { FaqSectionShared } from '@/app/admin/home-components/faq/_components/FaqSectionShared';
import { getFaqColors } from '@/app/admin/home-components/faq/_lib/colors';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { notifyAddToCart, useCart } from '@/lib/cart';
import { useCartConfig, useCheckoutConfig } from '@/lib/experiences';
import { ArrowLeft, Award, BadgeCheck, Bell, Bolt, Calendar, Camera, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, CreditCard, Gift, Globe, Heart, HeartHandshake, Leaf, Lock, MapPin, MessageSquare, Minus, Package, Phone, Plus, Reply, RotateCcw, Share2, Shield, ShoppingBag, ShoppingCart, Star, ThumbsUp, Truck, Facebook, Instagram, Youtube, Mail, Send } from 'lucide-react';
import { VariantSelector, type VariantSelectorOption } from '@/components/products/VariantSelector';
import type { Id } from '@/convex/_generated/dataModel';
import { getPublicPriceLabel } from '@/lib/products/public-price';
import { toRichTextContent } from '@/lib/products/product-supplemental-content';
import { buildCategoryPath, buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { useProductFrameConfig } from '@/components/shared/ProductImageFrameBox';

type ProductDetailStyle = 'classic' | 'modern' | 'minimal';
type ModernHeroStyle = 'full' | 'split' | 'minimal';
type MinimalContentWidth = 'narrow' | 'medium' | 'wide';
type ProductsSaleMode = 'cart' | 'contact' | 'affiliate';
type RelatedProductsMode = 'fixed' | 'infiniteScroll' | 'pagination';
type ProductImageAspectRatioSource = 'module' | 'custom';
type ComboAnimateType = 'none' | 'luxury-sheen' | 'typing' | 'letter-wave' | 'fire' | 'sparkle' | 'text-highlight' | 'border-rainbow';
type ComboEffectColor = 'black' | 'white' | 'red' | 'primary' | 'secondary' | 'gradient-1' | 'gradient-2' | 'gradient-3';
type ProductDetailAccentColorConfig = {
  categoryBadge?: ProductDetailElementColorChoice;
  discountBadge?: ProductDetailElementColorChoice;
  primaryButton?: ProductDetailElementColorChoice;
  comboBadge?: ProductDetailElementColorChoice;
};

const LEGACY_COMBO_EFFECT_MAP = {
  'sparkle-gradient': { type: 'sparkle', color: 'gradient-1' },
  'sparkle-black': { type: 'sparkle', color: 'black' },
  'sparkle-gold': { type: 'sparkle', color: 'gradient-2' },
  'sparkle-emerald': { type: 'sparkle', color: 'gradient-3' },
  'sparkle-red': { type: 'sparkle', color: 'red' },
  'sparkle-primary': { type: 'sparkle', color: 'primary' },
  'sparkle-secondary': { type: 'sparkle', color: 'secondary' },
} as const;

type BaseImageLayoutConfig = {
  showRating: boolean;
  showComments: boolean;
  showCommentLikes: boolean;
  showCommentReplies: boolean;
  showWishlist: boolean;
  showShare: boolean;
  showAddToCart: boolean;
};

type ClassicLayoutConfig = BaseImageLayoutConfig & {
  showClassicHighlights: boolean;
};

type ModernLayoutConfig = BaseImageLayoutConfig & {
  heroStyle: ModernHeroStyle;
};

type MinimalLayoutConfig = BaseImageLayoutConfig & {
  contentWidth: MinimalContentWidth;
};

type ProductDetailExperienceConfig = {
  layoutStyle: ProductDetailStyle;
  imageAspectRatioSource: ProductImageAspectRatioSource;
  showAddToCart: boolean;
  showClassicHighlights: boolean;
  showHighlights: boolean;
  showRating: boolean;
  showComments: boolean;
  showCommentLikes: boolean;
  showCommentReplies: boolean;
  showWishlist: boolean;
  showShare: boolean;
  showBuyNow: boolean;
  showAllProductImagesSection: boolean;
  enableImageLightbox: boolean;
  heroStyle: ModernHeroStyle;
  contentWidth: MinimalContentWidth;
  imageAspectRatio: ProductImageAspectRatio;
  relatedProductsMode: RelatedProductsMode;
  relatedProductsPerPage: number;
  comboAnimateType?: ComboAnimateType;
  comboEffectColor?: ComboEffectColor;
  accentColors?: ProductDetailAccentColorConfig;
  showSocialButtons?: boolean;
  socialButtons?: Array<{ id: string; icon: string; label: string; url: string; active: boolean }>;
  cartButtonsLayout?: 'stack' | 'grid-2';
};

type ProductVariantOptionValue = {
  optionId: Id<'productOptions'>;
  valueId: Id<'productOptionValues'>;
  customValue?: string;
};

type ProductVariant = {
  _id: Id<'productVariants'>;
  optionValues: ProductVariantOptionValue[];
  price?: number;
  salePrice?: number;
  stock?: number;
  sku: string;
  image?: string;
  images?: string[];
};

type ProductOption = {
  _id: Id<'productOptions'>;
  name: string;
  order: number;
  displayType: VariantSelectorOption['displayType'];
  inputType?: VariantSelectorOption['inputType'];
};

type ProductOptionValue = {
  _id: Id<'productOptionValues'>;
  optionId: Id<'productOptions'>;
  order: number;
  value: string;
  label?: string;
  colorCode?: string;
  image?: string;
};
type ClassicHighlightIcon =
  | 'Award'
  | 'BadgeCheck'
  | 'Bell'
  | 'Bolt'
  | 'Calendar'
  | 'Camera'
  | 'CheckCircle2'
  | 'Clock'
  | 'CreditCard'
  | 'Gift'
  | 'Globe'
  | 'HeartHandshake'
  | 'Leaf'
  | 'Lock'
  | 'MapPin'
  | 'Phone'
  | 'RotateCcw'
  | 'Shield'
  | 'Star'
  | 'ThumbsUp'
  | 'Truck';
interface ClassicHighlightItem { icon: ClassicHighlightIcon; text: string }

const CLASSIC_HIGHLIGHT_ICON_MAP: Record<ClassicHighlightIcon, React.ElementType> = {
  Award,
  BadgeCheck,
  Bell,
  Bolt,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  Globe,
  HeartHandshake,
  Leaf,
  Lock,
  MapPin,
  Phone,
  RotateCcw,
  Shield,
  Star,
  ThumbsUp,
  Truck,
};

const DEFAULT_CLASSIC_HIGHLIGHTS: ClassicHighlightItem[] = [
  { icon: 'Truck', text: 'Giao hàng nhanh' },
  { icon: 'Shield', text: 'Bảo hành chính hãng' },
  { icon: 'RotateCcw', text: 'Đổi trả 30 ngày' },
];

function useProductDetailExperienceConfig(): ProductDetailExperienceConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'product_detail_ui' });
  const detailStyleSetting = useQuery(api.settings.getByKey, { key: 'products_detail_style' });
  const highlightsSetting = useQuery(api.settings.getByKey, { key: 'products_detail_classic_highlights_enabled' });
  const moduleAspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const commentsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'comments' });
  const commentsLikesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableLikes', moduleKey: 'comments' });
  const commentsRepliesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableReplies', moduleKey: 'comments' });

  const legacyStyle = (detailStyleSetting?.value as ProductDetailStyle) || 'classic';
  const legacyHighlightsEnabled = (highlightsSetting?.value as boolean) ?? true;
  const cartAvailable = (cartModule?.enabled ?? false) && (ordersModule?.enabled ?? false);
  const ordersEnabled = ordersModule?.enabled ?? false;
  const canUseWishlist = wishlistModule?.enabled ?? false;
  const canUseComments = commentsModule?.enabled ?? false;
  const canUseCommentLikes = canUseComments && (commentsLikesFeature?.enabled ?? false);
  const canUseCommentReplies = canUseComments && (commentsRepliesFeature?.enabled ?? false);

  const moduleDefaultAspectRatio = useMemo(
    () => resolveProductImageAspectRatio(moduleAspectRatioSetting?.value),
    [moduleAspectRatioSetting?.value]
  );

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<{
      layoutStyle: ProductDetailStyle;
      layouts: Partial<Record<ProductDetailStyle, Partial<ClassicLayoutConfig & ModernLayoutConfig & MinimalLayoutConfig & {
        imageAspectRatio?: ProductImageAspectRatio;
      }>>>;
      showAddToCart: boolean;
      showClassicHighlights: boolean;
      showHighlights: boolean;
      showRating: boolean;
      showComments: boolean;
      showCommentLikes: boolean;
      showCommentReplies: boolean;
      showWishlist: boolean;
      showShare: boolean;
      showBuyNow: boolean;
      showAllProductImagesSection: boolean;
      enableImageLightbox?: boolean;
      heroStyle: ModernHeroStyle;
      contentWidth: MinimalContentWidth;
      imageAspectRatio: ProductImageAspectRatio;
      imageAspectRatioSource?: ProductImageAspectRatioSource;
      relatedProductsMode: RelatedProductsMode;
      relatedProductsPerPage: number;
      comboAnimateType?: ComboAnimateType | 'pulse' | 'bounce' | keyof typeof LEGACY_COMBO_EFFECT_MAP;
      comboEffectColor?: ComboEffectColor;
      accentColors?: ProductDetailAccentColorConfig;
      showSocialButtons?: boolean;
      socialButtons?: Array<{ id: string; icon: string; label: string; url: string; active: boolean }>;
      cartButtonsLayout?: 'stack' | 'grid-2';
    }> | undefined;
    const layoutStyle = raw?.layoutStyle ?? legacyStyle;
    const layoutConfig = raw?.layouts?.[layoutStyle];
    const normalizedRelatedMode = raw?.relatedProductsMode === 'infiniteScroll' || raw?.relatedProductsMode === 'pagination'
      ? raw.relatedProductsMode
      : 'fixed';
    const relatedProductsPerPage = typeof raw?.relatedProductsPerPage === 'number' && raw.relatedProductsPerPage > 0
      ? raw.relatedProductsPerPage
      : 8;
    const legacyAspectRatio = resolveProductImageAspectRatio(
      raw?.imageAspectRatio
      ?? raw?.layouts?.classic?.imageAspectRatio
      ?? raw?.layouts?.modern?.imageAspectRatio
      ?? raw?.layouts?.minimal?.imageAspectRatio
      ?? DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO
    );
    const imageAspectRatioSource = raw?.imageAspectRatioSource === 'custom' || raw?.imageAspectRatioSource === 'module'
      ? raw.imageAspectRatioSource
      : isProductImageAspectRatio(raw?.imageAspectRatio)
        || isProductImageAspectRatio(raw?.layouts?.classic?.imageAspectRatio)
        || isProductImageAspectRatio(raw?.layouts?.modern?.imageAspectRatio)
        || isProductImageAspectRatio(raw?.layouts?.minimal?.imageAspectRatio)
        ? 'custom'
        : 'module';
    const resolvedImageAspectRatio = imageAspectRatioSource === 'module'
      ? moduleDefaultAspectRatio
      : legacyAspectRatio;
    const configShowAddToCart = layoutConfig?.showAddToCart ?? raw?.showAddToCart ?? true;
    const classicLayoutHighlights = raw?.layouts?.classic?.showClassicHighlights
      ?? (layoutConfig as Partial<Record<'showClassicHighlights', boolean>>)?.showClassicHighlights;
    const legacyLayoutHighlights = raw?.layouts?.classic
      ? (raw.layouts.classic as Partial<Record<'showHighlights', boolean>>)?.showHighlights
      : undefined;
    const resolvedHighlights = classicLayoutHighlights
      ?? legacyLayoutHighlights
      ?? raw?.showClassicHighlights
      ?? raw?.showHighlights
      ?? legacyHighlightsEnabled;
    const layoutComments = layoutConfig as Partial<ClassicLayoutConfig & ModernLayoutConfig & MinimalLayoutConfig> | undefined;
    const showComments = layoutComments?.showComments ?? raw?.showComments ?? true;
    const showCommentLikes = layoutComments?.showCommentLikes ?? raw?.showCommentLikes ?? true;
    const showCommentReplies = layoutComments?.showCommentReplies ?? raw?.showCommentReplies ?? true;
    const showShare = layoutComments?.showShare ?? raw?.showShare ?? true;
    const legacyComboEffect = raw?.comboAnimateType && (raw.comboAnimateType in LEGACY_COMBO_EFFECT_MAP)
      ? LEGACY_COMBO_EFFECT_MAP[raw.comboAnimateType as keyof typeof LEGACY_COMBO_EFFECT_MAP]
      : undefined;
    const comboAnimateType: ComboAnimateType = raw?.comboAnimateType === 'pulse' || raw?.comboAnimateType === 'bounce'
      ? 'luxury-sheen'
      : legacyComboEffect?.type ?? (raw?.comboAnimateType as ComboAnimateType | undefined) ?? 'luxury-sheen';
    return {
      layoutStyle,
      showAddToCart: configShowAddToCart && cartAvailable,
      showClassicHighlights: resolvedHighlights,
      showHighlights: resolvedHighlights,
      showRating: (layoutConfig?.showRating ?? raw?.showRating ?? true) && canUseComments,
      showComments: canUseComments ? showComments : false,
      showCommentLikes: canUseCommentLikes ? showCommentLikes : false,
      showCommentReplies: canUseCommentReplies ? showCommentReplies : false,
      showWishlist: canUseWishlist ? (layoutConfig?.showWishlist ?? raw?.showWishlist ?? true) : false,
      showShare,
      showBuyNow: (raw?.showBuyNow ?? true) && ordersEnabled,
      showAllProductImagesSection: raw?.showAllProductImagesSection ?? false,
      enableImageLightbox: raw?.enableImageLightbox ?? false,
      heroStyle: layoutStyle === 'modern'
        ? (layoutConfig as Partial<ModernLayoutConfig>)?.heroStyle ?? raw?.heroStyle ?? 'full'
        : 'full',
      contentWidth: layoutStyle === 'minimal'
        ? (layoutConfig as Partial<MinimalLayoutConfig>)?.contentWidth ?? raw?.contentWidth ?? 'medium'
        : 'medium',
      imageAspectRatioSource,
      imageAspectRatio: resolvedImageAspectRatio,
      relatedProductsMode: normalizedRelatedMode,
      relatedProductsPerPage,
      comboAnimateType,
      comboEffectColor: raw?.comboEffectColor ?? legacyComboEffect?.color ?? 'gradient-1',
      accentColors: {
        categoryBadge: 'secondary',
        discountBadge: 'primary',
        primaryButton: 'primary',
        comboBadge: 'black',
        ...raw?.accentColors,
      },
      showSocialButtons: raw?.showSocialButtons ?? false,
      socialButtons: raw?.socialButtons ?? [],
      cartButtonsLayout: raw?.cartButtonsLayout ?? 'stack',
    };
  }, [experienceSetting?.value, legacyHighlightsEnabled, legacyStyle, cartAvailable, canUseComments, canUseCommentLikes, canUseCommentReplies, canUseWishlist, ordersEnabled, moduleDefaultAspectRatio]);
}

type RatingSummary = { average: number | null; count: number };

function useProductRatingSummary(productId?: Id<"products">, enabled?: boolean): RatingSummary {
  const ratingsPage = useQuery(
    api.comments.listByTarget,
    productId && enabled
      ? { paginationOpts: { cursor: null, numItems: 50 }, status: 'Approved', targetId: productId, targetType: 'product' }
      : 'skip'
  );

  return useMemo(() => {
    const ratings = ratingsPage?.page
      .map(item => item.rating)
      .filter((value): value is number => typeof value === 'number');
    if (!ratings || ratings.length === 0) {
      return { average: null, count: 0 };
    }
    const sum = ratings.reduce((acc, value) => acc + value, 0);
    return { average: sum / ratings.length, count: ratings.length };
  }, [ratingsPage?.page]);
}

function normalizeClassicHighlights(value: unknown): ClassicHighlightItem[] {
  if (!Array.isArray(value)) {
    return DEFAULT_CLASSIC_HIGHLIGHTS;
  }
  const normalized = value
    .filter((item): item is { icon: unknown; text: unknown } => typeof item === 'object' && item !== null && 'icon' in item && 'text' in item)
    .map((item) => {
      const icon = typeof item.icon === 'string' && item.icon in CLASSIC_HIGHLIGHT_ICON_MAP
        ? (item.icon as ClassicHighlightIcon)
        : null;
      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!icon || text.length === 0) {return null;}
      return { icon, text } satisfies ClassicHighlightItem;
    })
    .filter((item): item is ClassicHighlightItem => item !== null);

  return normalized.length > 0 ? normalized : DEFAULT_CLASSIC_HIGHLIGHTS;
}

function useClassicHighlights(): ClassicHighlightItem[] {
  const setting = useQuery(api.settings.getByKey, { key: 'products_detail_classic_highlights' });
  return useMemo(() => normalizeClassicHighlights(setting?.value), [setting?.value]);
}

function useEnabledProductFields(): Set<string> {
  const fields = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'products' });
  return useMemo(() => {
    if (!fields) {return new Set<string>();}
    return new Set(fields.map(f => f.fieldKey));
  }, [fields]);
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const brandColors = useBrandColors();
  const brandColor = brandColors.primary;
  const { isDark } = useSiteSettings();
  const tokens = useMemo(
    () => getProductDetailColors(brandColors.primary, brandColors.secondary, brandColors.mode || 'single', isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );
  const experienceConfig = useProductDetailExperienceConfig();
  const classicHighlights = useClassicHighlights();
  const classicHighlightsEnabled = experienceConfig.showHighlights;
  const enabledFields = useEnabledProductFields();
  const { customer, isAuthenticated, openLoginModal } = useCustomerAuth();
  const { addItem, openDrawer } = useCart();
  const cartConfig = useCartConfig();
  const checkoutConfig = useCheckoutConfig();
  const router = useRouter();
  const commentsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'comments' });
  const commentsLikesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableLikes', moduleKey: 'comments' });
  const commentsRepliesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableReplies', moduleKey: 'comments' });
  const commentsSettings = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'comments' });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const commerceCapabilities = useQuery(api.cart.getCommerceCapabilities, {});
  const toggleWishlist = useMutation(api.wishlist.toggle);
  const createComment = useMutation(api.comments.create);
  const incrementLike = useMutation(api.comments.incrementLike);
  const decrementLike = useMutation(api.comments.decrementLike);
  
  const product = useQuery(api.products.getBySlug, { slug });

  const enableCombosSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableCombos' });
  const enableCombos = enableCombosSetting?.value === true;

  const comboProductIds = useMemo(() => {
    if (!product || !product.combos || product.combos.length === 0) {
      return [] as Id<'products'>[];
    }
    const ids = new Set<Id<'products'>>();
    product.combos.forEach((combo: any) => {
      if (combo.type === 'standard') {
        if (combo.standardConfig?.giftProductId) {
          ids.add(combo.standardConfig.giftProductId);
        }
      } else if (combo.type === 'mix') {
        if (combo.mixConfig?.giftProductId) {
          ids.add(combo.mixConfig.giftProductId);
        }
        if (combo.mixConfig?.items) {
          combo.mixConfig.items.forEach((item: any) => {
            if (item.productId) {
              ids.add(item.productId);
            }
          });
        }
      }
    });
    return Array.from(ids);
  }, [product?.combos]);

  const comboProducts = useQuery(
    api.products.listByIds,
    comboProductIds.length > 0 ? { ids: comboProductIds } : 'skip'
  );

  const comboProductsMap = useMemo(() => {
    const map = new Map<string, any>();
    if (comboProducts) {
      comboProducts.forEach((p) => {
        map.set(p._id, p);
      });
    }
    return map;
  }, [comboProducts]);
  const supplementalTemplate = useQuery(
    api.productSupplementalContents.getEffectiveByProduct,
    product?._id ? { productId: product._id } : 'skip'
  );
  const lightboxImages = useMemo(() => (product ? buildProductImages(product) : []), [product]);
  const category = useQuery(
    api.productCategories.getById,
    product?.categoryId ? { id: product.categoryId } : 'skip'
  );
  const categories = useQuery(api.productCategories.listActive);
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const enableCategoryProductDetailSuffixSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableCategoryProductDetailSuffix' });
  const enableCategoryProductDetailFaqSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableCategoryProductDetailFaq' });

  const enableCategoryProductDetailSuffix = enableCategoryProductDetailSuffixSetting?.value === true;
  const enableCategoryProductDetailFaq = enableCategoryProductDetailFaqSetting?.value === true;
  const categorySlugMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((item) => [item._id, item.slug]));
  }, [categories]);
  const productImagePlaceholderSetting = useQuery(api.settings.getValue, { key: 'product_image_placeholder', defaultValue: '' });
  const productImagePlaceholder = isValidImageSrc(productImagePlaceholderSetting)
    ? productImagePlaceholderSetting.trim()
    : '';

  const relatedProductsMode = experienceConfig.relatedProductsMode;
  const relatedProductsPerPage = experienceConfig.relatedProductsPerPage;
  const [relatedPage, setRelatedPage] = useState(1);
  const { ref: relatedLoadMoreRef, inView: relatedInView } = useInView({ rootMargin: '120px' });

  const {
    results: relatedInfiniteResults,
    status: relatedInfiniteStatus,
    loadMore: loadMoreRelated,
  } = usePaginatedQuery(
    api.products.listPublishedPaginated,
    { categoryId: product?.categoryId },
    { initialNumItems: relatedProductsMode === 'fixed' ? 4 : relatedProductsPerPage }
  );

  const relatedTotalCountSource = useQuery(api.products.countPublished, {
    categoryId: product?.categoryId,
  });

  const variants = useQuery(
    api.productVariants.listByProductActive,
    product?._id && product?.hasVariants ? { productId: product._id } : 'skip'
  );

  const variantOptionIds = useMemo(() => {
    if (!variants || variants.length === 0) {
      return [] as Id<'productOptions'>[];
    }
    const ids = new Set<Id<'productOptions'>>();
    variants.forEach((variant) => variant.optionValues.forEach((item) => ids.add(item.optionId)));
    return Array.from(ids);
  }, [variants]);

  const variantValueIds = useMemo(() => {
    if (!variants || variants.length === 0) {
      return [] as Id<'productOptionValues'>[];
    }
    const ids = new Set<Id<'productOptionValues'>>();
    variants.forEach((variant) => variant.optionValues.forEach((item) => ids.add(item.valueId)));
    return Array.from(ids);
  }, [variants]);

  const variantOptionsSource = useQuery(
    api.productOptions.listByIds,
    variantOptionIds.length > 0 ? { ids: variantOptionIds } : 'skip'
  );

  const variantValuesSource = useQuery(
    api.productOptionValues.listByIds,
    variantValueIds.length > 0 ? { ids: variantValueIds } : 'skip'
  );

  const variantOptions = useMemo(() => {
    if (!variantOptionsSource || !variantValuesSource) {
      return [] as VariantSelectorOption[];
    }

    const valuesByOption = new Map<Id<'productOptions'>, ProductOptionValue[]>();
    variantValuesSource.forEach((value) => {
      const existing = valuesByOption.get(value.optionId) ?? [];
      existing.push(value);
      valuesByOption.set(value.optionId, existing);
    });

    return (variantOptionsSource as ProductOption[])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((option) => ({
        id: option._id,
        name: option.name,
        displayType: option.displayType,
        inputType: option.inputType,
        values: (valuesByOption.get(option._id) ?? [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((value) => ({
            id: value._id,
            label: value.label ?? value.value,
            value: value.value,
            colorCode: value.colorCode,
            image: value.image,
          })),
      }))
      .filter((option) => option.values.length > 0);
  }, [variantOptionsSource, variantValuesSource]);

  const wishlistStatus = useQuery(
    api.wishlist.isInWishlist,
    isAuthenticated && customer && product?._id && (wishlistModule?.enabled ?? false)
      ? { customerId: customer.id as Id<'customers'>, productId: product._id }
      : 'skip'
  );
  const isWishlisted = wishlistStatus ?? false;
  const canUseWishlist = experienceConfig.showWishlist && (wishlistModule?.enabled ?? false);
  const commentsEnabled = commentsModule?.enabled ?? false;
  const canShowRating = commentsEnabled && experienceConfig.showRating;
  const shouldShowComments = commentsEnabled && experienceConfig.showComments;
  const shouldShowCommentLikes = shouldShowComments && (commentsLikesFeature?.enabled ?? false) && experienceConfig.showCommentLikes;
  const shouldShowCommentReplies = shouldShowComments && (commentsRepliesFeature?.enabled ?? false) && experienceConfig.showCommentReplies;
  const commentsPerPageSetting = useMemo(() => {
    const perPage = commentsSettings?.find(setting => setting.settingKey === 'commentsPerPage')?.value as number | undefined;
    return perPage ?? 20;
  }, [commentsSettings]);
  const defaultStatus = useMemo(() => {
    const setting = commentsSettings?.find(setting => setting.settingKey === 'defaultStatus')?.value as string | undefined;
    return (setting === 'Approved' ? 'Approved' : 'Pending') as 'Approved' | 'Pending';
  }, [commentsSettings]);
  const commentsPage = useQuery(
    api.comments.listByTarget,
    product && shouldShowComments
      ? { paginationOpts: { cursor: null, numItems: Math.min(commentsPerPageSetting * 2, 60) }, status: 'Approved', targetId: product._id, targetType: 'product' }
      : 'skip'
  );
  const comments = useMemo(() => commentsPage?.page ?? [], [commentsPage?.page]);
  const saleMode = useMemo<ProductsSaleMode>(() => {
    const value = saleModeSetting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [saleModeSetting?.value]);
  const commentRepliesMap = useMemo(() => {
    const map = new Map<string, CommentData[]>();
    comments.forEach((comment) => {
      if (!comment.parentId) {return;}
      const list = map.get(comment.parentId) ?? [];
      list.push(comment);
      map.set(comment.parentId, list);
    });
    return map;
  }, [comments]);
  const rootComments = useMemo(() => comments.filter(comment => !comment.parentId), [comments]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentMessage, setCommentMessage] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, { content: string; email: string; name: string }>>({});
  const [replySubmittingId, setReplySubmittingId] = useState<string | null>(null);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { overlayUrl } = useProductFrameConfig();

  useEffect(() => {
    setRelatedPage(1);
  }, [product?._id, relatedProductsMode, relatedProductsPerPage]);

  const relatedCandidates = useMemo<RelatedProduct[]>(() => {
    if (!relatedInfiniteResults) {
      return [];
    }
    return relatedInfiniteResults.filter(item => item._id !== product?._id);
  }, [relatedInfiniteResults, product?._id]);

  const isRelatedPagination = relatedProductsMode === 'pagination';
  const relatedRequiredCount = relatedProductsMode === 'fixed'
    ? 4
    : isRelatedPagination
      ? relatedProductsPerPage * relatedPage
      : relatedProductsPerPage;

  useEffect(() => {
    if (relatedProductsMode === 'fixed') {
      return;
    }
    if (relatedCandidates.length < relatedRequiredCount && relatedInfiniteStatus === 'CanLoadMore') {
      loadMoreRelated(relatedRequiredCount - relatedCandidates.length);
    }
  }, [relatedCandidates.length, relatedInfiniteStatus, relatedProductsMode, relatedRequiredCount, loadMoreRelated]);

  useEffect(() => {
    if (relatedProductsMode !== 'infiniteScroll') {
      return;
    }
    if (relatedInView && relatedInfiniteStatus === 'CanLoadMore') {
      loadMoreRelated(relatedProductsPerPage);
    }
  }, [relatedInView, relatedInfiniteStatus, relatedProductsMode, relatedProductsPerPage, loadMoreRelated]);

  const relatedTotalCount = typeof relatedTotalCountSource === 'number' ? relatedTotalCountSource : 0;
  const relatedProducts = useMemo<RelatedProduct[]>(() => {
    if (relatedProductsMode === 'fixed') {
      return relatedCandidates.slice(0, 4);
    }
    if (isRelatedPagination) {
      const start = (relatedPage - 1) * relatedProductsPerPage;
      return relatedCandidates.slice(start, start + relatedProductsPerPage);
    }
    return relatedCandidates;
  }, [relatedCandidates, isRelatedPagination, relatedPage, relatedProductsMode, relatedProductsPerPage]);

  const relatedIsLoading = relatedProductsMode !== 'fixed' && (
    relatedInfiniteStatus === 'LoadingFirstPage' ||
    (isRelatedPagination && relatedInfiniteStatus !== 'Exhausted' && relatedCandidates.length < relatedRequiredCount)
  );

  const handleWishlistToggle = async () => {
    if (!isAuthenticated || !customer || !product?._id) {
      openLoginModal();
      return;
    }
    await toggleWishlist({ customerId: customer.id as Id<'customers'>, productId: product._id });
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!navigator.clipboard) {
      toast.error('Trình duyệt không hỗ trợ sao chép liên kết.');
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết sản phẩm');
    } catch {
      toast.error('Không thể sao chép liên kết. Vui lòng thử lại.');
    }
  };

  const handleAddToCart = async (quantity: number, variantId?: Id<'productVariants'>) => {
    if (!product?._id) {
      return;
    }
    if (product.hasVariants && !variantId) {
      toast.error('Vui lòng chọn phiên bản trước khi thêm vào giỏ hàng');
      return;
    }
    await addItem(product._id, quantity, variantId);
    notifyAddToCart();
    if (cartConfig.layoutStyle === 'drawer') {
      openDrawer();
    } else {
      router.push('/cart');
    }
  };

  const handleBuyNow = async (quantity: number, variantId?: Id<'productVariants'>) => {
    if (!product?._id) {
      return;
    }
    if (product.hasVariants && !variantId) {
      toast.error('Vui lòng chọn phiên bản trước khi thanh toán');
      return;
    }
    const variantParam = variantId ? `&variantId=${variantId}` : '';
    router.push(`/checkout?productId=${product._id}&quantity=${quantity}${variantParam}`);
  };

  const handlePrimaryAction = async (quantity: number, variantId?: Id<'productVariants'>) => {
    if (!product) {
      return;
    }

    if (saleMode === 'contact') {
      router.push('/contact');
      return;
    }

    if (saleMode === 'affiliate') {
      const affiliateLink = (product as { affiliateLink?: string }).affiliateLink?.trim();
      if (!affiliateLink) {
        toast.error('Sản phẩm chưa có link affiliate');
        return;
      }
      window.open(affiliateLink, '_blank', 'noopener,noreferrer');
      return;
    }

    await handleBuyNow(quantity, variantId);
  };

  const handleSubmitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product || !commentName.trim() || !commentContent.trim()) {return;}
    setIsSubmittingComment(true);
    setCommentMessage(null);
    try {
      await createComment({
        authorEmail: commentEmail.trim() || undefined,
        authorName: commentName.trim(),
        content: commentContent.trim(),
        rating: commentRating > 0 ? commentRating : undefined,
        targetId: product._id,
        targetType: 'product',
      });
      setCommentName('');
      setCommentEmail('');
      setCommentContent('');
      setCommentRating(5);
      setCommentMessage(defaultStatus === 'Approved' ? 'Đánh giá đã được đăng.' : 'Đánh giá đã được gửi, vui lòng chờ duyệt.');
    } catch {
      setCommentMessage('Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplyDraftChange = (parentId: Id<'comments'>, key: 'name' | 'email' | 'content', value: string) => {
    setReplyDrafts(prev => ({
      ...prev,
      [parentId]: {
        name: prev[parentId]?.name ?? '',
        email: prev[parentId]?.email ?? '',
        content: prev[parentId]?.content ?? '',
        [key]: value,
      },
    }));
  };

  const handleSubmitReply = async (parentId: Id<'comments'>) => {
    if (!product) {return;}
    const draft = replyDrafts[parentId];
    if (!draft?.name?.trim() || !draft?.content?.trim()) {return;}
    setReplySubmittingId(parentId);
    try {
      await createComment({
        authorEmail: draft.email?.trim() || undefined,
        authorName: draft.name.trim(),
        content: draft.content.trim(),
        parentId,
        targetId: product._id,
        targetType: 'product',
      });
      setReplyDrafts(prev => {
        const next = { ...prev };
        delete next[parentId];
        return next;
      });
    } finally {
      setReplySubmittingId(null);
    }
  };

  const handleLike = async (id: Id<'comments'>) => {
    if (likingIds.has(id)) {return;}
    setLikingIds(prev => new Set(prev).add(id));
    try {
      await incrementLike({ id });
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUnlike = async (id: Id<'comments'>) => {
    if (likingIds.has(id)) {return;}
    setLikingIds(prev => new Set(prev).add(id));
    try {
      await decrementLike({ id });
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const canUseCartActions = saleMode === 'cart' && Boolean(commerceCapabilities?.cartAvailable && commerceCapabilities.providers.some((provider) => provider.provider === 'products' && provider.cartCapable));
  const canBuyNow = experienceConfig.showBuyNow && checkoutConfig.showBuyNow && (ordersModule?.enabled ?? false) && canUseCartActions;
  const buyNowLabel = saleMode === 'contact' ? 'Liên hệ' : 'Mua ngay';
  const showStock = enabledFields.has('stock');
  const requireStockForBuyNow = saleMode === 'cart' && showStock;

  const ratingSummary = useProductRatingSummary(product?._id, canShowRating);

  const commentsSection = shouldShowComments ? (
    <ProductCommentsSection
      brandColor={brandColor}
      tokens={tokens}
      ratingSummary={ratingSummary}
      comments={rootComments}
      replyMap={commentRepliesMap}
      commentName={commentName}
      commentEmail={commentEmail}
      commentContent={commentContent}
      commentRating={commentRating}
      commentMessage={commentMessage}
      isSubmitting={isSubmittingComment}
      replyDrafts={replyDrafts}
      replySubmittingId={replySubmittingId}
      showLikes={shouldShowCommentLikes}
      showReplies={shouldShowCommentReplies}
      onNameChange={setCommentName}
      onEmailChange={setCommentEmail}
      onContentChange={setCommentContent}
      onRatingChange={setCommentRating}
      onSubmit={handleSubmitComment}
      onLike={handleLike}
      onUnlike={handleUnlike}
      onReplyDraftChange={handleReplyDraftChange}
      onReplySubmit={handleSubmitReply}
    />
  ) : null;
  const supplementalContent = supplementalTemplate
    ? {
        preContent: supplementalTemplate.preContent,
        postContent: supplementalTemplate.postContent,
      }
    : null;
  const canOpenLightbox = experienceConfig.enableImageLightbox && lightboxImages.length > 0;

  const handleOpenLightbox = (index: number) => {
    if (!canOpenLightbox) {
      return;
    }
    setLightboxIndex(Math.min(Math.max(index, 0), Math.max(lightboxImages.length - 1, 0)));
  };

  const handleCloseLightbox = () => setLightboxIndex(null);

  if (product === undefined) {
    return <ProductDetailSkeleton tokens={tokens} />;
  }

  if (product === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: tokens.surfaceMuted }}>
            <Package size={32} style={{ color: tokens.emptyStateIcon }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.headingColor }}>Không tìm thấy sản phẩm</h1>
          <p className="mb-8 max-w-sm mx-auto" style={{ color: tokens.metaText }}>Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all hover:shadow-lg hover:scale-105"
            style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}
          >
            <ArrowLeft size={18} />
            Xem tất cả sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  const productData = {
    ...product,
    categoryName: category?.name ?? 'Sản phẩm',
    categorySlug: category?.slug,
    hasVariants: product.hasVariants,
  };

  return (
    <div style={{ backgroundColor: tokens.pageBackground, color: tokens.bodyText }}>
      {experienceConfig.layoutStyle === 'classic' && (
        <ClassicStyle
          product={productData}
          brandColor={brandColor}
          tokens={tokens}
          enableImageLightbox={experienceConfig.enableImageLightbox}
          onOpenLightbox={handleOpenLightbox}
          relatedProducts={relatedProducts}
          enabledFields={enabledFields}
          variants={variants ?? []}
          variantOptions={variantOptions}
          highlights={classicHighlights}
          highlightsEnabled={classicHighlightsEnabled}
          ratingSummary={ratingSummary}
          saleMode={saleMode}
          showAddToCart={canUseCartActions ? experienceConfig.showAddToCart : false}
          showRating={canShowRating}
          showWishlist={canUseWishlist}
          showShare={experienceConfig.showShare}
          showBuyNow={canUseCartActions ? canBuyNow : true}
          buyNowLabel={buyNowLabel}
          imageAspectRatio={experienceConfig.imageAspectRatio}
          showAllProductImagesSection={experienceConfig.showAllProductImagesSection}
          requireStockForBuyNow={requireStockForBuyNow}
          isWishlisted={isWishlisted}
          onToggleWishlist={handleWishlistToggle}
          onShare={handleShare}
          onAddToCart={handleAddToCart}
          onBuyNow={handlePrimaryAction}
          cartButtonsLayout={experienceConfig.cartButtonsLayout}
          commentsSection={commentsSection}
          supplementalContent={supplementalContent}
          relatedProductsMode={relatedProductsMode}
          relatedProductsPerPage={relatedProductsPerPage}
          relatedProductsPage={relatedPage}
          relatedProductsTotalCount={relatedTotalCount}
          onRelatedProductsPageChange={setRelatedPage}
          relatedLoadMoreRef={relatedLoadMoreRef}
          relatedInfiniteStatus={relatedInfiniteStatus}
          relatedIsLoading={relatedIsLoading}
          routeMode={routeMode}
          categorySlugMap={categorySlugMap}
          productImagePlaceholder={productImagePlaceholder}
          category={category}
          enableCategoryProductDetailSuffix={enableCategoryProductDetailSuffix}
          enableCategoryProductDetailFaq={enableCategoryProductDetailFaq}
          enableCombos={enableCombos}
          comboProductsMap={comboProductsMap}
          comboAnimateType={experienceConfig.comboAnimateType}
          comboEffectColor={experienceConfig.comboEffectColor}
          accentColors={experienceConfig.accentColors}
          showSocialButtons={experienceConfig.showSocialButtons}
          socialButtons={experienceConfig.socialButtons}
        />
      )}
      {experienceConfig.layoutStyle === 'modern' && (
        <ModernStyle
          product={productData}
          brandColor={brandColor}
          tokens={tokens}
          enableImageLightbox={experienceConfig.enableImageLightbox}
          onOpenLightbox={handleOpenLightbox}
          relatedProducts={relatedProducts}
          enabledFields={enabledFields}
          variants={variants ?? []}
          variantOptions={variantOptions}
          highlights={classicHighlights}
          showHighlights={experienceConfig.showHighlights}
          ratingSummary={ratingSummary}
          saleMode={saleMode}
          showAddToCart={canUseCartActions ? experienceConfig.showAddToCart : false}
          showRating={canShowRating}
          showWishlist={canUseWishlist}
          showShare={experienceConfig.showShare}
          showBuyNow={canUseCartActions ? canBuyNow : true}
          buyNowLabel={buyNowLabel}
          imageAspectRatio={experienceConfig.imageAspectRatio}
          showAllProductImagesSection={experienceConfig.showAllProductImagesSection}
          requireStockForBuyNow={requireStockForBuyNow}
          heroStyle={experienceConfig.heroStyle}
          isWishlisted={isWishlisted}
          onToggleWishlist={handleWishlistToggle}
          onShare={handleShare}
          onAddToCart={handleAddToCart}
          onBuyNow={handlePrimaryAction}
          cartButtonsLayout={experienceConfig.cartButtonsLayout}
          commentsSection={commentsSection}
          supplementalContent={supplementalContent}
          relatedProductsMode={relatedProductsMode}
          relatedProductsPerPage={relatedProductsPerPage}
          relatedProductsPage={relatedPage}
          relatedProductsTotalCount={relatedTotalCount}
          onRelatedProductsPageChange={setRelatedPage}
          relatedLoadMoreRef={relatedLoadMoreRef}
          relatedInfiniteStatus={relatedInfiniteStatus}
          relatedIsLoading={relatedIsLoading}
          routeMode={routeMode}
          categorySlugMap={categorySlugMap}
          productImagePlaceholder={productImagePlaceholder}
          category={category}
          enableCategoryProductDetailSuffix={enableCategoryProductDetailSuffix}
          enableCategoryProductDetailFaq={enableCategoryProductDetailFaq}
          enableCombos={enableCombos}
          comboProductsMap={comboProductsMap}
          comboAnimateType={experienceConfig.comboAnimateType}
          comboEffectColor={experienceConfig.comboEffectColor}
          accentColors={experienceConfig.accentColors}
          showSocialButtons={experienceConfig.showSocialButtons}
          socialButtons={experienceConfig.socialButtons}
        />
      )}
      {experienceConfig.layoutStyle === 'minimal' && (
        <MinimalStyle
          product={productData}
          brandColor={brandColor}
          tokens={tokens}
          enableImageLightbox={experienceConfig.enableImageLightbox}
          onOpenLightbox={handleOpenLightbox}
          relatedProducts={relatedProducts}
          enabledFields={enabledFields}
          variants={variants ?? []}
          variantOptions={variantOptions}
          highlights={classicHighlights}
          showHighlights={experienceConfig.showHighlights}
          ratingSummary={ratingSummary}
          saleMode={saleMode}
          showAddToCart={canUseCartActions ? experienceConfig.showAddToCart : false}
          showRating={canShowRating}
          showWishlist={canUseWishlist}
          showShare={experienceConfig.showShare}
          showBuyNow={canUseCartActions ? canBuyNow : true}
          buyNowLabel={buyNowLabel}
          imageAspectRatio={experienceConfig.imageAspectRatio}
          showAllProductImagesSection={experienceConfig.showAllProductImagesSection}
          requireStockForBuyNow={requireStockForBuyNow}
          contentWidth={experienceConfig.contentWidth}
          isWishlisted={isWishlisted}
          onToggleWishlist={handleWishlistToggle}
          onShare={handleShare}
          onAddToCart={handleAddToCart}
          onBuyNow={handlePrimaryAction}
          cartButtonsLayout={experienceConfig.cartButtonsLayout}
          commentsSection={commentsSection}
          supplementalContent={supplementalContent}
          relatedProductsMode={relatedProductsMode}
          relatedProductsPerPage={relatedProductsPerPage}
          relatedProductsPage={relatedPage}
          relatedProductsTotalCount={relatedTotalCount}
          onRelatedProductsPageChange={setRelatedPage}
          relatedLoadMoreRef={relatedLoadMoreRef}
          relatedInfiniteStatus={relatedInfiniteStatus}
          relatedIsLoading={relatedIsLoading}
          routeMode={routeMode}
          categorySlugMap={categorySlugMap}
          productImagePlaceholder={productImagePlaceholder}
          category={category}
          enableCategoryProductDetailSuffix={enableCategoryProductDetailSuffix}
          enableCategoryProductDetailFaq={enableCategoryProductDetailFaq}
          enableCombos={enableCombos}
          comboProductsMap={comboProductsMap}
          comboAnimateType={experienceConfig.comboAnimateType}
          comboEffectColor={experienceConfig.comboEffectColor}
          accentColors={experienceConfig.accentColors}
          showSocialButtons={experienceConfig.showSocialButtons}
          socialButtons={experienceConfig.socialButtons}
        />
      )}
      <ProductImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex ?? 0}
        open={canOpenLightbox && lightboxIndex !== null}
        onClose={handleCloseLightbox}
        onIndexChange={setLightboxIndex}
        overlayUrl={overlayUrl}
        fallbackSrc={productImagePlaceholder}
      />
    </div>
  );
}

interface ProductData {
  _id: Id<"products">;
  affiliateLink?: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  images?: string[];
  description?: string;
  renderType?: 'content' | 'markdown' | 'html';
  markdownRender?: string;
  htmlRender?: string;
  hasVariants?: boolean;
  categoryId: Id<"productCategories">;
  categoryName: string;
  categorySlug?: string;
  combos?: any[];
}

interface RelatedProduct {
  _id: Id<"products">;
  name: string;
  slug: string;
  categoryId: Id<"productCategories">;
  price: number;
  salePrice?: number;
  image?: string;
  hasVariants?: boolean;
}

interface CommentData {
  _id: Id<'comments'>;
  _creationTime: number;
  authorName: string;
  content: string;
  likesCount?: number;
  parentId?: Id<'comments'>;
  rating?: number;
}

interface ProductSupplementalContentData {
  preContent?: string;
  postContent?: string;
}

interface StyleProps {
  product: ProductData;
  brandColor: string;
  tokens: ProductDetailColors;
  enableImageLightbox: boolean;
  onOpenLightbox: (index: number) => void;
  relatedProducts: RelatedProduct[];
  relatedProductsMode: RelatedProductsMode;
  relatedProductsPerPage: number;
  relatedProductsPage: number;
  relatedProductsTotalCount: number;
  onRelatedProductsPageChange: (page: number) => void;
  relatedLoadMoreRef: (node?: Element | null) => void;
  relatedInfiniteStatus: PaginationStatus;
  relatedIsLoading: boolean;
  enabledFields: Set<string>;
  variants: ProductVariant[];
  variantOptions: VariantSelectorOption[];
  saleMode: ProductsSaleMode;
  commentsSection?: React.ReactNode;
  supplementalContent: ProductSupplementalContentData | null;
  routeMode: 'unified' | 'namespace';
  categorySlugMap: Map<string, string>;
  productImagePlaceholder: string;
  category?: any;
  enableCategoryProductDetailSuffix?: boolean;
  enableCategoryProductDetailFaq?: boolean;
  enableCombos?: boolean;
  comboProductsMap?: Map<string, any>;
  comboAnimateType?: string;
  comboEffectColor?: ComboEffectColor;
  accentColors?: ProductDetailAccentColorConfig;
  showSocialButtons?: boolean;
  socialButtons?: Array<{ id: string; icon: string; label: string; url: string; active: boolean }>;
}

interface ExperienceBlocksProps {
  ratingSummary: RatingSummary;
  showAddToCart: boolean;
  showRating: boolean;
  showWishlist: boolean;
  showShare: boolean;
  showBuyNow: boolean;
  buyNowLabel: string;
  imageAspectRatio: ProductImageAspectRatio;
  showAllProductImagesSection: boolean;
  requireStockForBuyNow: boolean;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onShare: () => void;
  onAddToCart: (quantity: number, variantId?: Id<'productVariants'>) => void;
  onBuyNow: (quantity: number, variantId?: Id<'productVariants'>) => void;
  cartButtonsLayout?: 'stack' | 'grid-2';
}

interface HighlightBlockProps {
  highlights: ClassicHighlightItem[];
  showHighlights: boolean;
}

interface ClassicStyleProps extends StyleProps, ExperienceBlocksProps {
  highlights: ClassicHighlightItem[];
  highlightsEnabled: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
}

function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = [];
  const startPages = [1, 2];
  const endPages = [totalPages - 1, totalPages];
  const middlePages = [currentPage - 1, currentPage, currentPage + 1];
  const allPages = Array.from(new Set([...startPages, ...middlePages, ...endPages]))
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  let lastPage = 0;
  allPages.forEach((page) => {
    if (page - lastPage > 1) {
      items.push('ellipsis');
    }
    items.push(page);
    lastPage = page;
  });
  return items;
}

function isValidImageSrc(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

type ProductImageWithFallbackProps = Omit<React.ComponentProps<typeof Image>, 'src' | 'onError'> & {
  src?: string | null;
  fallbackSrc?: string | null;
  placeholderLabel?: string;
};

function ProductImageWithFallback({
  src,
  fallbackSrc,
  placeholderLabel = 'Ảnh sản phẩm',
  ...props
}: ProductImageWithFallbackProps) {
  const normalizedSrc = isValidImageSrc(src) ? src.trim() : null;
  const normalizedFallback = isValidImageSrc(fallbackSrc) ? fallbackSrc.trim() : null;
  const [currentSrc, setCurrentSrc] = useState<string | null>(normalizedSrc ?? normalizedFallback);

  useEffect(() => {
    setCurrentSrc(normalizedSrc ?? normalizedFallback);
  }, [normalizedSrc, normalizedFallback]);

  if (!currentSrc) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400 dark:bg-slate-900/60">
        <Package size={40} strokeWidth={1.5} />
        <span className="text-xs font-medium">{placeholderLabel}</span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={currentSrc}
      onError={() => {
        setCurrentSrc(currentSrc !== normalizedFallback ? normalizedFallback : null);
      }}
    />
  );
}

function buildProductImages(product: { image?: unknown; images?: unknown[] }): string[] {
  const images = new Set<string>();
  if (isValidImageSrc(product.image)) {
    images.add(product.image.trim());
  }
  if (Array.isArray(product.images)) {
    product.images.forEach((img) => {
      if (isValidImageSrc(img)) {
        images.add(img.trim());
      }
    });
  }
  return Array.from(images);
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

function preloadNeighborImages(images: string[], centerIndex: number) {
  if (typeof window === 'undefined' || images.length === 0) {
    return;
  }

  const candidates = [images[centerIndex], images[centerIndex - 1], images[centerIndex + 1]];
  candidates.forEach((candidate) => {
    if (!isValidImageSrc(candidate)) {
      return;
    }
    const image = new window.Image();
    image.src = candidate;
  });
}

function BlurredProductImage({ src, alt, sizes, fallbackSrc }: { src?: string | null; alt: string; sizes?: string; fallbackSrc?: string | null }) {
  const normalizedSrc = isValidImageSrc(src) ? src.trim() : null;
  const normalizedFallback = isValidImageSrc(fallbackSrc) ? fallbackSrc.trim() : null;
  const prefersReducedMotion = usePrefersReducedMotion();
  const [currentSrc, setCurrentSrc] = useState<string | null>(normalizedSrc ?? normalizedFallback);
  const [incomingSrc, setIncomingSrc] = useState<string | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);

  useEffect(() => {
    if (!normalizedSrc) {
      setCurrentSrc(normalizedFallback);
      setIncomingSrc(null);
      setIncomingVisible(false);
      return;
    }

    if (!currentSrc) {
      setCurrentSrc(normalizedSrc);
      return;
    }

    if (currentSrc === normalizedSrc) {
      return;
    }

    if (prefersReducedMotion) {
      setCurrentSrc(normalizedSrc);
      setIncomingSrc(null);
      setIncomingVisible(false);
      return;
    }

    setIncomingSrc(normalizedSrc);
    setIncomingVisible(false);

    const frame = window.requestAnimationFrame(() => setIncomingVisible(true));
    const timeout = window.setTimeout(() => {
      setCurrentSrc(normalizedSrc);
      setIncomingSrc(null);
      setIncomingVisible(false);
    }, 160);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [currentSrc, normalizedFallback, normalizedSrc, prefersReducedMotion]);

  if (!currentSrc) {
    return <ProductImageWithFallback src={null} fallbackSrc={normalizedFallback} alt={alt} fill sizes={sizes} className="object-contain" />;
  }

  return (
    <ProductImageWithOverlayAuto className="w-full h-full absolute inset-0">
      <div
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${currentSrc})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          filter: 'blur(24px)',
        }}
      />
      <div className="absolute inset-0 bg-black/10" />
      <ProductImageWithFallback mode="primary" src={currentSrc} fallbackSrc={normalizedFallback} alt={alt} fill sizes={sizes} className="relative z-10 object-contain" />

      {incomingSrc && (
        <div className={`absolute inset-0 transition-opacity duration-150 ease-out ${incomingVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${incomingSrc})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              filter: 'blur(24px)',
            }}
          />
          <div className="absolute inset-0 bg-black/10" />
          <ProductImageWithFallback mode="primary" src={incomingSrc} fallbackSrc={normalizedFallback} alt={alt} fill sizes={sizes} className="relative z-10 object-contain" />
        </div>
      )}
    </ProductImageWithOverlayAuto>
  );
}

function HighlightsGrid({ highlights, tokens }: { highlights: ClassicHighlightItem[]; tokens: ProductDetailColors }) {
  if (highlights.length === 0) {
    return null;
  }
  return (
    <div className="grid grid-cols-3 gap-4 p-4 rounded-xl" style={{ backgroundColor: tokens.highlightBg }}>
      {highlights.map((item, index) => {
        const Icon = CLASSIC_HIGHLIGHT_ICON_MAP[item.icon];
        return (
          <div key={`${item.icon}-${index}`} className="text-center">
            <Icon size={24} className="mx-auto mb-2" style={{ color: tokens.highlightIcon }} />
            <p className="text-xs" style={{ color: tokens.highlightText }}>{item.text}</p>
          </div>
        );
      })}
    </div>
  );
}

function ExpandableProductDescriptionBlock({
  children,
  buttonStyle,
}: {
  children: React.ReactNode;
  buttonStyle?: React.CSSProperties;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const getCollapsedMaxHeight = () => {
      if (typeof window === 'undefined') {
        return 640;
      }
      return window.matchMedia('(min-width: 768px)').matches ? 860 : 640;
    };
    const checkOverflow = () => {
      const maxHeight = getCollapsedMaxHeight();
      setCanExpand(element.scrollHeight > maxHeight + 1);
    };
    checkOverflow();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div>
      <div
        ref={contentRef}
        className={`${expanded ? '' : 'max-h-[640px] overflow-hidden md:max-h-[860px]'}`.trim()}
      >
        {children}
      </div>
      {(canExpand || expanded) && (
        <button
          type="button"
          className="mt-3 text-sm font-medium"
          style={buttonStyle}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}

function ProductDescriptionImages({
  images,
  tokens,
  frameAspectRatio,
  fallbackSrc,
}: {
  images: string[];
  tokens: ProductDetailColors;
  frameAspectRatio: string;
  fallbackSrc?: string | null;
}) {
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs();
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t pt-6" style={{ borderColor: tokens.divider }}>
      <div className="space-y-4">
        {images.map((image, index) => (
          <ProductImageWithOverlay
            key={`${image}-${index}`}
            frameConfig={frameConfig}
            watermarkConfig={watermarkConfig}
            className="relative w-full overflow-hidden rounded-2xl"
            style={{ aspectRatio: frameAspectRatio, backgroundColor: tokens.surfaceMuted }}
          >
            <ProductImageWithFallback mode="primary" src={image} fallbackSrc={fallbackSrc} alt={`Ảnh sản phẩm ${index + 1}`} fill sizes="100vw" className="object-contain" />
          </ProductImageWithOverlay>
        ))}
      </div>
    </div>
  );
}

type MobileImageCarouselProps = {
  images: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  alt: string;
  fallbackSrc?: string | null;
};

function _MobileImageCarousel({ images, selectedIndex, onSelect, alt, fallbackSrc }: MobileImageCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const width = container.clientWidth;
    if (!width) {
      return;
    }
    const targetLeft = selectedIndex * width;
    if (Math.abs(container.scrollLeft - targetLeft) > 2) {
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [selectedIndex]);

  useEffect(() => () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  }, []);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const width = container.clientWidth;
      if (!width) {
        return;
      }
      const nextIndex = Math.round(container.scrollLeft / width);
      if (nextIndex !== selectedIndex) {
        onSelect(nextIndex);
      }
    }, 120);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex h-full w-full snap-x snap-mandatory overflow-x-auto no-scrollbar scroll-smooth"
    >
      {images.map((image, index) => (
        <ProductImageWithOverlay
          key={`${image}-${index}`}
          frameConfig={frameConfig}
          watermarkConfig={watermarkConfig}
          className="relative h-full w-full shrink-0 snap-center"
        >
          <ProductImageWithFallback mode="primary" src={image} fallbackSrc={fallbackSrc} alt={`${alt} ${index + 1}`} fill sizes="100vw" className="object-contain" />
        </ProductImageWithOverlay>
      ))}
    </div>
  );
}

type ThumbnailRailProps = {
  images: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  orientation: 'horizontal' | 'vertical';
  visibleSlots: number;
  tokens: ProductDetailColors;
  thumbnailAspectRatio: string;
  className?: string;
  listClassName?: string;
  itemClassName?: string;
  inactiveClassName?: string;
  fallbackSrc?: string | null;
};

function ThumbnailRail({
  images,
  selectedIndex,
  onSelect,
  orientation,
  visibleSlots,
  tokens,
  thumbnailAspectRatio,
  className,
  listClassName,
  itemClassName,
  inactiveClassName,
  fallbackSrc,
}: ThumbnailRailProps) {
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs();
  const [startIndex, setStartIndex] = useState(0);
  const hasOverflow = images.length > visibleSlots;
  const maxStartIndex = Math.max(0, images.length - visibleSlots);
  const isVertical = orientation === 'vertical';

  useEffect(() => {
    if (!hasOverflow) {
      if (startIndex !== 0) {
        setStartIndex(0);
      }
      return;
    }
    if (startIndex > maxStartIndex) {
      setStartIndex(maxStartIndex);
    }
  }, [hasOverflow, maxStartIndex, startIndex]);

  useEffect(() => {
    if (!hasOverflow) {
      return;
    }
    if (selectedIndex < startIndex) {
      setStartIndex(selectedIndex);
      return;
    }
    if (selectedIndex >= startIndex + visibleSlots) {
      setStartIndex(Math.max(0, selectedIndex - visibleSlots + 1));
    }
  }, [hasOverflow, selectedIndex, startIndex, visibleSlots]);

  if (images.length <= 1) {
    return null;
  }

  const canScrollPrev = hasOverflow && selectedIndex > 0;
  const canScrollNext = hasOverflow && selectedIndex < images.length - 1;
  const visibleImages = hasOverflow ? images.slice(startIndex, startIndex + visibleSlots) : images;
  const railClassName = `${isVertical ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2'} ${className ?? ''}`.trim();
  const listClass = `${isVertical ? 'flex flex-col gap-2' : 'flex gap-2'} ${listClassName ?? ''}`.trim();
  const arrowClassName = 'h-9 w-9 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40';
  const handlePrev = () => onSelect(Math.max(0, selectedIndex - 1));
  const handleNext = () => onSelect(Math.min(images.length - 1, selectedIndex + 1));

  return (
    <div className={railClassName}>
      {hasOverflow && (
        <button
          type="button"
          aria-label={isVertical ? 'Ảnh trước' : 'Ảnh trước'}
          disabled={!canScrollPrev}
          onClick={handlePrev}
          className={arrowClassName}
          style={{ borderColor: tokens.thumbnailBorder, color: tokens.thumbnailBorderActive, backgroundColor: tokens.surface }}
        >
          {isVertical ? <ChevronUp size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      <div className={listClass}>
        {visibleImages.map((img, index) => {
          const actualIndex = hasOverflow ? startIndex + index : index;
          const isActive = actualIndex === selectedIndex;
          return (
            <ProductImageWithOverlay
              key={`${img}-${actualIndex}`}
              frameConfig={frameConfig}
              watermarkConfig={watermarkConfig}
              className={`${itemClassName ?? 'w-20 rounded-lg'} relative overflow-hidden border-2 transition-colors ${isActive ? '' : inactiveClassName ?? ''}`.trim()}
              style={{ aspectRatio: thumbnailAspectRatio, borderColor: isActive ? tokens.thumbnailBorderActive : tokens.thumbnailBorder }}
            >
              <button
                type="button"
                onClick={() => onSelect(actualIndex)}
                className="w-full h-full block relative"
              >
                <ProductImageWithFallback mode="thumb" src={img} fallbackSrc={fallbackSrc} alt="" width={80} height={80} className="object-contain w-full h-full" />
              </button>
            </ProductImageWithOverlay>
          );
        })}
      </div>

      {hasOverflow && (
        <button
          type="button"
          aria-label={isVertical ? 'Ảnh kế tiếp' : 'Ảnh kế tiếp'}
          disabled={!canScrollNext}
          onClick={handleNext}
          className={arrowClassName}
          style={{ borderColor: tokens.thumbnailBorder, color: tokens.thumbnailBorderActive, backgroundColor: tokens.surface }}
        >
          {isVertical ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      )}
    </div>
  );
}

function resolveProductContent(product: {
  renderType?: 'content' | 'markdown' | 'html';
  description?: string;
  markdownRender?: string;
  htmlRender?: string;
}): string {
  if (product.renderType === 'markdown') {
    return product.markdownRender ? withFormatMarker('markdown', product.markdownRender) : '';
  }
  if (product.renderType === 'html') {
    return product.htmlRender ? withFormatMarker('html', product.htmlRender) : '';
  }
  return product.description ? withFormatMarker('richtext', product.description) : '';
}

type VariantSelectionMap = Record<string, Id<'productOptionValues'>>;

const RATING_STAR_ACTIVE_COLOR = '#f59e0b';

const buildSelectionFromVariant = (variant: ProductVariant): VariantSelectionMap =>
  variant.optionValues.reduce<VariantSelectionMap>((acc, optionValue) => {
    acc[optionValue.optionId] = optionValue.valueId;
    return acc;
  }, {});

const findMatchingVariant = (variants: ProductVariant[], selection: VariantSelectionMap) =>
  variants.find((variant) =>
    variant.optionValues.every((optionValue) => {
      const selected = selection[optionValue.optionId];
      return !selected || selected === optionValue.valueId;
    })
  ) ?? null;

const findExactVariant = (variants: ProductVariant[], selection: VariantSelectionMap) =>
  variants.find((variant) =>
    variant.optionValues.every((optionValue) => selection[optionValue.optionId] === optionValue.valueId)
  ) ?? null;


function RatingInline({ summary, tokens }: { summary: RatingSummary; tokens: ProductDetailColors }) {
  if (!summary.average || summary.count <= 0) {
    return null;
  }
  const average = summary.average ?? 0;
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: tokens.ratingText }}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            style={star <= Math.round(average)
              ? { color: RATING_STAR_ACTIVE_COLOR, fill: RATING_STAR_ACTIVE_COLOR }
              : { color: tokens.ratingStarInactive }}
          />
        ))}
      </div>
      <span>{summary.average.toFixed(1)} ({summary.count})</span>
    </div>
  );
}

function InlineStockBadge({ label, color, tokens }: { label: string; color: string; tokens: ProductDetailColors }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{
        borderColor: tokens.quantityBorder,
        backgroundColor: tokens.surface,
        color,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// ====================================================================================
// STYLE 1: CLASSIC - Standard e-commerce product page
// ====================================================================================
function ClassicStyle({
  product,
  brandColor,
  tokens,
  enableImageLightbox,
  onOpenLightbox,
  relatedProducts,
  relatedProductsMode,
  relatedProductsPerPage,
  relatedProductsPage,
  relatedProductsTotalCount,
  onRelatedProductsPageChange,
  relatedLoadMoreRef,
  relatedInfiniteStatus,
  relatedIsLoading,
  enabledFields,
  variants,
  variantOptions,
  highlights,
  highlightsEnabled,
  ratingSummary,
  saleMode,
  showAddToCart,
  showRating,
  showWishlist,
  showShare,
  showBuyNow,
  buyNowLabel,
  imageAspectRatio,
  showAllProductImagesSection,
  requireStockForBuyNow,
  isWishlisted,
  onToggleWishlist,
  onShare,
  onAddToCart,
  onBuyNow,
  commentsSection,
  supplementalContent,
  routeMode,
  categorySlugMap,
  productImagePlaceholder,
  category,
  enableCategoryProductDetailSuffix,
  enableCategoryProductDetailFaq,
  enableCombos,
  comboProductsMap,
  comboAnimateType,
  comboEffectColor,
  accentColors,
  showSocialButtons,
  socialButtons,
  cartButtonsLayout,
}: ClassicStyleProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<VariantSelectionMap>({});

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setSelectedIndex(index);
      setSelectedImage(index);
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi && selectedImage !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(selectedImage);
    }
  }, [emblaApi, selectedImage]);

  const hasVariants = Boolean(product.hasVariants && variants.length > 0 && variantOptions.length > 0);
  const imageFrame = getProductImageFrameConfig(imageAspectRatio, 'classic');
  const mainImageFrameStyle: React.CSSProperties = { aspectRatio: imageFrame.frameAspectRatio };
  const resolvedDescription = useMemo(() => resolveProductContent(product), [product]);

  useEffect(() => {
    if (!hasVariants) {
      setSelectedOptions({});
      return;
    }
    setSelectedOptions(buildSelectionFromVariant(variants[0]));
  }, [hasVariants, variants]);

  const selectedVariant = useMemo(
    () => (hasVariants ? findExactVariant(variants, selectedOptions) : null),
    [hasVariants, variants, selectedOptions]
  );

  const handleSelectOption = (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) => {
    if (!hasVariants) {
      return;
    }
    const nextSelection = { ...selectedOptions, [optionId]: valueId };
    const matching = findMatchingVariant(variants, nextSelection);
    setSelectedOptions(matching ? buildSelectionFromVariant(matching) : nextSelection);
  };

  const isOptionValueAvailable = (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) =>
    variants.some((variant) =>
      variant.optionValues.every((optionValue) => {
        if (optionValue.optionId === optionId) {
          return optionValue.valueId === valueId;
        }
        const selected = selectedOptions[optionValue.optionId];
        return !selected || selected === optionValue.valueId;
      }) && (!showStock || (variant.stock ?? product.stock ?? 0) > 0)
    );

  const showPrice = enabledFields.has('price') || enabledFields.size === 0;
  const showSalePrice = enabledFields.has('salePrice');
  const showStock = enabledFields.has('stock');
  const showDescription = enabledFields.has('description');
  const _showSku = enabledFields.has('sku');

  const images = buildProductImages(product);
  const displayImages = images.length > 0 ? images : [productImagePlaceholder];
  const safeSelectedImage = Math.min(selectedImage, Math.max(displayImages.length - 1, 0));
  const canOpenLightbox = enableImageLightbox && images.length > 0;

  const handleOpenLightbox = () => {
    if (!canOpenLightbox) {
      return;
    }
    onOpenLightbox(safeSelectedImage);
  };

  const handleLightboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canOpenLightbox) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenLightbox();
    }
  };

  useEffect(() => {
    if (displayImages.length === 0 && selectedImage !== 0) {
      setSelectedImage(0);
      return;
    }
    if (displayImages.length > 0 && selectedImage >= displayImages.length) {
      setSelectedImage(displayImages.length - 1);
    }
  }, [displayImages.length, selectedImage]);

  useEffect(() => {
    preloadNeighborImages(displayImages, safeSelectedImage);
  }, [displayImages, safeSelectedImage]);

  const basePrice = selectedVariant?.price ?? product.price;
  const salePrice = selectedVariant ? selectedVariant.salePrice : product.salePrice;
  const isRangeFromVariant = Boolean(product.hasVariants && !selectedVariant);
  const priceDisplay = getPublicPriceLabel({ saleMode, price: basePrice, salePrice, isRangeFromVariant });
  const discountPercent = priceDisplay.comparePrice
    ? Math.round((1 - basePrice / priceDisplay.comparePrice) * 100)
    : 0;
  const stockValue = selectedVariant?.stock ?? product.stock;
  const inStock = !showStock || stockValue > 0;
  const buyNowDisabled = requireStockForBuyNow && !inStock;
  const stockStatus = showStock
    ? stockValue > 10
      ? { label: 'Còn hàng', color: tokens.stockSuccessText }
      : stockValue > 0
        ? { label: `Chỉ còn ${stockValue} sản phẩm`, color: tokens.stockWarningText }
        : { label: 'Hết hàng', color: tokens.stockDangerText }
    : null;
  const categoryBadgeColors = resolveProductDetailElementColor(accentColors?.categoryBadge ?? 'secondary', tokens);
  const discountBadgeColors = resolveProductDetailElementColor(accentColors?.discountBadge ?? 'primary', tokens);
  const primaryButtonColors = resolveProductDetailElementColor(accentColors?.primaryButton ?? 'primary', tokens);
  const comboBadgeColors = resolveProductDetailElementColor(accentColors?.comboBadge ?? 'black', tokens);

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.surface }}>
      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: tokens.divider }}>
        <div className="max-w-6xl mx-auto px-4 py-2 md:py-3">
          <nav className="flex items-center gap-1 text-[11px] md:hidden" style={{ color: tokens.breadcrumbText }}>
            {product.categorySlug && product.categoryName ? (
              <>
                <Link href={buildCategoryPath({ categorySlug: product.categorySlug, mode: routeMode, moduleKey: 'products' })} className="transition-colors">{product.categoryName}</Link>
                <ChevronRight size={10} />
              </>
            ) : (
              <>
                <Link href="/products" className="transition-colors">Sản phẩm</Link>
                <ChevronRight size={10} />
              </>
            )}
            <span className="font-medium truncate max-w-[180px]" style={{ color: tokens.breadcrumbActive }}>{product.name}</span>
          </nav>
          <nav className="hidden md:flex items-center gap-2 text-sm" style={{ color: tokens.breadcrumbText }}>
            <Link href="/" className="transition-colors">Trang chủ</Link>
            <ChevronRight size={14} />
            <Link href="/products" className="transition-colors">Sản phẩm</Link>
            <ChevronRight size={14} />
            {product.categorySlug && (
              <>
                <Link href={buildCategoryPath({ categorySlug: product.categorySlug, mode: routeMode, moduleKey: 'products' })} className="transition-colors">{product.categoryName}</Link>
                <ChevronRight size={14} />
              </>
            )}
            <span className="font-medium truncate max-w-[200px]" style={{ color: tokens.breadcrumbActive }}>{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 md:py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Product Images */}
          <div className="mb-6 lg:mb-0">
            <div className={`${imageFrame.frameWidthClassName} mb-3 md:mb-4 group/carousel relative`}>
              <div
                className={`relative rounded-2xl overflow-hidden ${canOpenLightbox ? 'cursor-zoom-in' : ''}`.trim()}
                style={{ ...mainImageFrameStyle, backgroundColor: tokens.surfaceMuted }}
                role={canOpenLightbox ? 'button' : undefined}
                tabIndex={canOpenLightbox ? 0 : -1}
                onKeyDown={handleLightboxKeyDown}
              >
                <div className="embla overflow-hidden h-full w-full" ref={emblaRef}>
                  <div className="embla__container flex h-full w-full">
                    {displayImages.map((img, idx) => (
                      <div 
                        className="embla__slide flex-[0_0_100%] min-w-0 relative h-full w-full cursor-pointer" 
                        key={idx}
                        onClick={canOpenLightbox ? handleOpenLightbox : undefined}
                      >
                        <BlurredProductImage src={img} fallbackSrc={productImagePlaceholder} alt={product.name} sizes="(max-width: 1024px) 100vw, 50vw" />
                      </div>
                    ))}
                  </div>
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      disabled={!canScrollPrev}
                      onClick={(e) => { e.stopPropagation(); emblaApi?.scrollPrev(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 pointer-events-auto z-30"
                      aria-label="Ảnh trước"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={!canScrollNext}
                      onClick={(e) => { e.stopPropagation(); emblaApi?.scrollNext(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 pointer-events-auto z-30"
                      aria-label="Ảnh sau"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
                {images.length > 1 && (
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-sm z-30" style={{ backgroundColor: tokens.surface, color: tokens.headingColor }}>
                    {selectedIndex + 1}/{images.length}
                  </span>
                )}
                {showSalePrice && priceDisplay.comparePrice && (
                  <span className="absolute top-3 left-3 px-3 py-1.5 text-sm font-bold rounded-lg z-30" style={{ backgroundColor: discountBadgeColors.bg, color: discountBadgeColors.text }}>-{discountPercent}%</span>
                )}
              </div>
            </div>
            {images.length > 1 && (
              <>
                <div className="hidden md:block">
                  <ThumbnailRail
                    images={images}
                    selectedIndex={safeSelectedImage}
                    onSelect={setSelectedImage}
                    orientation="horizontal"
                    visibleSlots={6}
                    tokens={tokens}
                    thumbnailAspectRatio={imageFrame.thumbnailAspectRatio}
                    itemClassName="w-20 rounded-lg"
                    fallbackSrc={productImagePlaceholder}
                  />
                </div>
              </>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-4">
              <Link
                href={buildCategoryPath({ categorySlug: product.categorySlug ?? '', mode: routeMode, moduleKey: 'products' })}
                className="inline-block px-3 py-1 text-xs md:text-sm font-medium rounded-full transition-colors hover:opacity-80"
                style={{ backgroundColor: categoryBadgeColors.bg, color: categoryBadgeColors.text, borderColor: categoryBadgeColors.border, borderWidth: 1 }}
              >
                {product.categoryName}
              </Link>
              {stockStatus && <InlineStockBadge label={stockStatus.label} color={stockStatus.color} tokens={tokens} />}
            </div>

            <h1 className="text-xl md:text-3xl font-bold mb-2 md:mb-4" style={{ color: tokens.headingColor }}>{product.name}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-4 md:mb-6">
              {showRating && <RatingInline summary={ratingSummary} tokens={tokens} />}
            </div>

            {showPrice && (
              <div className="flex items-end gap-3 mb-3 md:mb-6">
                <span className="text-xl md:text-3xl font-bold" style={{ color: tokens.priceColor }}>{priceDisplay.label}</span>
                {showSalePrice && priceDisplay.comparePrice && (
                  <>
                    <span className="text-xl line-through" style={{ color: tokens.priceOriginalText }}>{formatPrice(priceDisplay.comparePrice)}</span>
                    <span className="px-2 py-0.5 text-sm font-medium rounded" style={{ backgroundColor: discountBadgeColors.bg, color: discountBadgeColors.text }}>Tiết kiệm {formatPrice(priceDisplay.comparePrice - basePrice)}</span>
                  </>
                )}
              </div>
            )}

            {hasVariants && (
              <div className="mb-4 md:mb-6">
                <VariantSelector
                  options={variantOptions}
                  selectedOptions={selectedOptions}
                  onSelect={handleSelectOption}
                  isOptionValueAvailable={isOptionValueAvailable}
                  accentColor={brandColor}
                />
              </div>
            )}

            {enableCombos && saleMode === 'contact' && !product.hasVariants && product.combos && product.combos.length > 0 && (
              <ProductCombosBlock
                combos={product.combos}
                comboProductsMap={comboProductsMap || new Map()}
                brandColor={brandColor}
                tokens={tokens}
                comboAnimateType={comboAnimateType}
                comboEffectColor={comboEffectColor}
                comboBadgeColors={comboBadgeColors}
                currentProductName={product.name}
                currentProductImage={product.image}
              />
            )}

            <div className="flex flex-wrap items-center gap-4 mb-4 md:mb-8">
              <div className="flex items-center border rounded-lg" style={{ borderColor: tokens.quantityBorder }}>
                <button
                  onClick={() =>{  setQuantity(q => Math.max(1, q - 1)); }}
                  className="p-3 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus size={18} style={{ color: quantity <= 1 ? tokens.quantityIconMuted : tokens.quantityIcon }} />
                </button>
                <span className="w-12 text-center font-medium" style={{ color: tokens.quantityText }}>{quantity}</span>
                <button
                  onClick={() =>{  setQuantity(q => Math.min(showStock ? stockValue : 99, q + 1)); }}
                  className="p-3 transition-colors"
                  disabled={showStock && quantity >= stockValue}
                >
                  <Plus size={18} style={{ color: showStock && quantity >= stockValue ? tokens.quantityIconMuted : tokens.quantityIcon }} />
                </button>
              </div>

              <div className={cartButtonsLayout === 'grid-2' && showAddToCart && showBuyNow ? 'grid grid-cols-2 gap-3 flex-1' : 'flex flex-1 flex-col gap-2'}>
                {showAddToCart && (
                  <button
                    className={`py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${inStock ? 'hover:shadow-lg hover:scale-[1.02]' : 'opacity-50 cursor-not-allowed'}`}
                    style={{ backgroundColor: primaryButtonColors.bg, color: primaryButtonColors.text }}
                    disabled={!inStock}
                    onClick={() => { if (inStock) { onAddToCart(quantity, selectedVariant?._id); } }}
                  >
                    <ShoppingCart size={20} className="shrink-0" />
                    <span className="truncate">{inStock ? (cartButtonsLayout === 'grid-2' && showBuyNow ? 'Thêm vào giỏ' : 'Thêm vào giỏ hàng') : 'Hết hàng'}</span>
                  </button>
                )}
                {showBuyNow && (
                  <button
                    className={`py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 border transition-all ${buyNowDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer bg-[var(--cta-secondary-bg)] shadow-sm hover:bg-[var(--cta-secondary-hover-bg)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-secondary-ring)]'}`}
                    style={{
                      borderColor: primaryButtonColors.border,
                      color: primaryButtonColors.text,
                      '--cta-secondary-bg': primaryButtonColors.bg,
                      '--cta-secondary-hover-bg': primaryButtonColors.bg,
                      '--cta-secondary-ring': tokens.inputRing,
                    } as React.CSSProperties}
                    disabled={buyNowDisabled}
                    onClick={() => { if (!buyNowDisabled) { onBuyNow(quantity, selectedVariant?._id); } }}
                  >
                    <span className="truncate">{buyNowLabel}</span>
                  </button>
                )}
              </div>

              {showWishlist && (
                <button
                  onClick={onToggleWishlist}
                  className="p-3.5 rounded-xl border transition-colors group"
                  style={isWishlisted
                    ? { borderColor: tokens.stockDangerText, backgroundColor: tokens.discountBadgeBg }
                    : { borderColor: tokens.wishlistBorder, backgroundColor: tokens.wishlistBg }}
                  aria-label="Thêm vào yêu thích"
                >
                  <Heart size={20} className={isWishlisted ? 'fill-current' : ''} style={{ color: isWishlisted ? tokens.stockDangerText : tokens.wishlistIcon }} />
                </button>
              )}
              {showShare && (
                <button
                  type="button"
                  onClick={onShare}
                  className="p-3.5 rounded-xl border transition-colors"
                  style={{ borderColor: tokens.shareBorder, backgroundColor: tokens.shareBg }}
                  aria-label="Chia sẻ sản phẩm"
                >
                  <Share2 size={20} style={{ color: tokens.shareIcon }} />
                </button>
              )}
            </div>

            {showSocialButtons && (
              <ProductSocialButtons
                buttons={socialButtons || []}
                tokens={tokens}
              />
            )}

            {highlightsEnabled && highlights.length > 0 && (
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl mb-8" style={{ backgroundColor: tokens.highlightBg }}>
                {highlights.map((item, index) => {
                  const Icon = CLASSIC_HIGHLIGHT_ICON_MAP[item.icon];
                  return (
                    <div key={`${item.icon}-${index}`} className="text-center">
                      <Icon size={24} className="mx-auto mb-2" style={{ color: tokens.highlightIcon }} />
                      <p className="text-xs" style={{ color: tokens.highlightText }}>{item.text}</p>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {(showDescription && resolvedDescription) || showAllProductImagesSection || supplementalContent?.preContent || supplementalContent?.postContent ? (
          <div className="border-t pt-6 mt-8 md:mt-12" style={{ borderColor: tokens.divider }}>
            <ExpandableProductDescriptionBlock buttonStyle={{ color: tokens.primary }}>
              {supplementalContent?.preContent ? (
                <RichContent
                  content={toRichTextContent(supplementalContent.preContent)}
                  className="max-w-none"
                  style={{ color: tokens.bodyText }}
                />
              ) : null}
              {showDescription && resolvedDescription && (
                <RichContent
                  content={resolvedDescription}
                  className="max-w-none"
                  style={{ color: tokens.bodyText }}
                />
              )}
              {showAllProductImagesSection && images.length > 0 && (
                <div className="mt-6 border-t pt-6" style={{ borderColor: tokens.divider }}>
                  <ProductDescriptionImages
                    images={images}
                    tokens={tokens}
                    frameAspectRatio={imageFrame.frameAspectRatio}
                    fallbackSrc={productImagePlaceholder}
                  />
                </div>
              )}
              {enableCategoryProductDetailSuffix && category?.productDetailSuffixContent && (
                <RichContent
                  content={toRichTextContent(category.productDetailSuffixContent)}
                  className="max-w-none mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800"
                  style={{ color: tokens.bodyText }}
                />
              )}
              {supplementalContent?.postContent ? (
                <RichContent
                  content={toRichTextContent(supplementalContent.postContent)}
                  className="max-w-none mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800"
                  style={{ color: tokens.bodyText }}
                />
              ) : null}
            </ExpandableProductDescriptionBlock>
          </div>
        ) : null}

      {commentsSection}

        <RelatedProductsSection
          products={relatedProducts}
          categorySlug={product.categorySlug}
          brandColor={brandColor}
          tokens={tokens}
          imageAspectRatio={imageAspectRatio}
          showPrice={enabledFields.has('price') || enabledFields.size === 0}
          showSalePrice={enabledFields.has('salePrice')}
          saleMode={saleMode}
          mode={relatedProductsMode}
          page={relatedProductsPage}
          perPage={relatedProductsPerPage}
          totalCount={relatedProductsTotalCount}
          onPageChange={onRelatedProductsPageChange}
          loadMoreRef={relatedLoadMoreRef}
          infiniteStatus={relatedInfiniteStatus}
          isLoading={relatedIsLoading}
          routeMode={routeMode}
          categorySlugMap={categorySlugMap}
          productImagePlaceholder={productImagePlaceholder}
        />

        {enableCategoryProductDetailFaq && category?.productDetailFaqEnabled !== false && category?.productDetailFaqItems && category.productDetailFaqItems.length > 0 && (
          <div className="mt-16 border-t pt-8" style={{ borderColor: tokens.divider }}>
            <FaqSectionShared
              items={category.productDetailFaqItems.map((item: any) => ({
                id: item.id,
                question: item.question,
                answer: item.answer,
              }))}
              style={(category.productDetailFaqStyle as any) ?? 'accordion'}
              title="Câu hỏi thường gặp"
              suppressInternalHeader={false}
              context="site"
              tokens={getFaqColors({
                primary: brandColor,
                secondary: brandColor,
                mode: 'single',
                style: (category.productDetailFaqStyle as any) ?? 'accordion',
              })}
            />
          </div>
        )}

        <div className="mt-12 pt-8 border-t" style={{ borderColor: tokens.divider }}>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80" style={{ color: tokens.primary }}>
            <ArrowLeft size={16} /> Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}

// ====================================================================================
// STYLE 2: MODERN - Landing page style with hero
// ====================================================================================
function ModernStyle({
  product,
  brandColor,
  tokens,
  enableImageLightbox,
  onOpenLightbox,
  relatedProducts,
  relatedProductsMode,
  relatedProductsPerPage,
  relatedProductsPage,
  relatedProductsTotalCount,
  onRelatedProductsPageChange,
  relatedLoadMoreRef,
  relatedInfiniteStatus,
  relatedIsLoading,
  enabledFields,
  variants,
  variantOptions,
  highlights,
  showHighlights,
  ratingSummary,
  saleMode,
  showAddToCart,
  showRating,
  showWishlist,
  showBuyNow,
  buyNowLabel,
  imageAspectRatio,
  showAllProductImagesSection,
  requireStockForBuyNow,
  heroStyle,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  commentsSection,
  supplementalContent,
  routeMode,
  categorySlugMap,
  productImagePlaceholder,
  category,
  enableCategoryProductDetailSuffix,
  enableCategoryProductDetailFaq,
  enableCombos,
  comboProductsMap,
  comboAnimateType,
  comboEffectColor,
  accentColors,
  showSocialButtons,
  socialButtons,
  cartButtonsLayout,
}: StyleProps & ExperienceBlocksProps & HighlightBlockProps & { heroStyle: ModernHeroStyle }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<VariantSelectionMap>({});

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setSelectedIndex(index);
      setSelectedImageIndex(index);
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi && selectedImageIndex !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(selectedImageIndex);
    }
  }, [emblaApi, selectedImageIndex]);

  const hasVariants = Boolean(product.hasVariants && variants.length > 0 && variantOptions.length > 0);
  const resolvedDescription = useMemo(() => resolveProductContent(product), [product]);

  useEffect(() => {
    if (!hasVariants) {
      setSelectedOptions({});
      return;
    }
    setSelectedOptions(buildSelectionFromVariant(variants[0]));
  }, [hasVariants, variants]);

  const selectedVariant = useMemo(
    () => (hasVariants ? findExactVariant(variants, selectedOptions) : null),
    [hasVariants, variants, selectedOptions]
  );

  const handleSelectOption = (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) => {
    if (!hasVariants) {
      return;
    }
    const nextSelection = { ...selectedOptions, [optionId]: valueId };
    const matching = findMatchingVariant(variants, nextSelection);
    setSelectedOptions(matching ? buildSelectionFromVariant(matching) : nextSelection);
  };

  const isOptionValueAvailable = (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) =>
    variants.some((variant) =>
      variant.optionValues.every((optionValue) => {
        if (optionValue.optionId === optionId) {
          return optionValue.valueId === valueId;
        }
        const selected = selectedOptions[optionValue.optionId];
        return !selected || selected === optionValue.valueId;
      }) && (!showStock || (variant.stock ?? product.stock ?? 0) > 0)
    );

  const showPrice = enabledFields.has('price') || enabledFields.size === 0;
  const showSalePrice = enabledFields.has('salePrice');
  const showStock = enabledFields.has('stock');
  const showDescription = enabledFields.has('description');

  const images = buildProductImages(product);
  const displayImages = images.length > 0 ? images : [productImagePlaceholder];
  const imageFrame = getProductImageFrameConfig(imageAspectRatio, 'modern');
  const mainImageFrameStyle: React.CSSProperties = { aspectRatio: imageFrame.frameAspectRatio };
  const safeSelectedImageIndex = Math.min(selectedImageIndex, Math.max(displayImages.length - 1, 0));
  const canOpenLightbox = enableImageLightbox && images.length > 0;

  const handleOpenLightbox = () => {
    if (!canOpenLightbox) {
      return;
    }
    onOpenLightbox(safeSelectedImageIndex);
  };

  const handleLightboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canOpenLightbox) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenLightbox();
    }
  };

  useEffect(() => {
    if (displayImages.length === 0 && selectedImageIndex !== 0) {
      setSelectedImageIndex(0);
      return;
    }
    if (displayImages.length > 0 && selectedImageIndex >= displayImages.length) {
      setSelectedImageIndex(displayImages.length - 1);
    }
  }, [displayImages.length, selectedImageIndex]);

  useEffect(() => {
    preloadNeighborImages(displayImages, safeSelectedImageIndex);
  }, [displayImages, safeSelectedImageIndex]);

  const basePrice = selectedVariant?.price ?? product.price;
  const salePrice = selectedVariant ? selectedVariant.salePrice : product.salePrice;
  const isRangeFromVariant = Boolean(product.hasVariants && !selectedVariant);
  const priceDisplay = getPublicPriceLabel({ saleMode, price: basePrice, salePrice, isRangeFromVariant });
  const discountPercent = priceDisplay.comparePrice
    ? Math.round((1 - basePrice / priceDisplay.comparePrice) * 100)
    : 0;
  const stockValue = selectedVariant?.stock ?? product.stock;
  const inStock = !showStock || stockValue > 0;
  const buyNowDisabled = requireStockForBuyNow && !inStock;
  const maxQuantity = showStock ? Math.min(stockValue, 10) : 10;
  const stockStatus = showStock
    ? stockValue > 10
      ? { label: 'Còn hàng', color: tokens.stockSuccessText }
      : stockValue > 0
        ? { label: `Chỉ còn ${stockValue} sản phẩm`, color: tokens.stockWarningText }
        : { label: 'Hết hàng', color: tokens.stockDangerText }
    : null;
  const categoryBadgeColors = resolveProductDetailElementColor(accentColors?.categoryBadge ?? 'secondary', tokens);
  const discountBadgeColors = resolveProductDetailElementColor(accentColors?.discountBadge ?? 'primary', tokens);
  const primaryButtonColors = resolveProductDetailElementColor(accentColors?.primaryButton ?? 'primary', tokens);
  const comboBadgeColors = resolveProductDetailElementColor(accentColors?.comboBadge ?? 'black', tokens);

  const heroContainerClass = heroStyle === 'full'
    ? 'border rounded-2xl'
    : heroStyle === 'split'
      ? 'border rounded-2xl'
      : 'border rounded-xl';
  const heroContainerStyle = heroStyle === 'full'
    ? { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }
    : { borderColor: tokens.border, backgroundColor: tokens.surface };

  const heroImageWrapperClass = heroStyle === 'split'
    ? 'relative flex items-center justify-center p-6'
    : heroStyle === 'minimal'
      ? 'relative flex items-center justify-center p-3'
      : 'relative flex items-center justify-center p-6';

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.surface }}>
      <header className="border-b" style={{ borderColor: tokens.divider }}>
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
          <nav className="flex items-center justify-between gap-4">
            <div className="md:hidden flex items-center gap-1 text-[11px] truncate" style={{ color: tokens.breadcrumbText }}>
              {product.categorySlug && product.categoryName ? (
                <>
                  <Link href={buildCategoryPath({ categorySlug: product.categorySlug, mode: routeMode, moduleKey: 'products' })} className="transition-colors">{product.categoryName}</Link>
                  <ChevronRight size={10} />
                </>
              ) : (
                <>
                  <Link href="/products" className="transition-colors">Sản phẩm</Link>
                  <ChevronRight size={10} />
                </>
              )}
              <span className="truncate" style={{ color: tokens.breadcrumbActive }}>{product.name}</span>
            </div>
            <div className="hidden md:block text-sm truncate" style={{ color: tokens.breadcrumbText }}>
              <Link href="/" className="transition-colors">Trang chủ</Link>
              {' / '}
              <Link href="/products" className="transition-colors">Sản phẩm</Link>
              {' / '}
              <span style={{ color: tokens.breadcrumbActive }}>{product.name}</span>
            </div>
            {showWishlist && (
              <button
                type="button"
                onClick={onToggleWishlist}
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: tokens.metaText }}
              >
                <Heart className={isWishlisted ? 'fill-current' : ''} style={{ color: isWishlisted ? tokens.stockDangerText : tokens.wishlistIcon }} />
                Yêu thích
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 md:py-6 lg:py-10">
        <div className="grid lg:grid-cols-2 gap-5 md:gap-6 lg:gap-8">
          <div className="space-y-3 md:space-y-4">
            {heroStyle === 'split' ? (
              <div className={`overflow-hidden ${heroContainerClass}`} style={heroContainerStyle}>
                <div className="grid md:grid-cols-2 gap-3 items-center p-3 md:p-5">
                  <div className={imageFrame.frameWidthClassName}>
                    <div
                      className={`relative rounded-xl overflow-hidden group/carousel ${canOpenLightbox ? 'cursor-zoom-in' : ''}`.trim()}
                      style={{ ...mainImageFrameStyle, backgroundColor: tokens.surfaceMuted }}
                      role={canOpenLightbox ? 'button' : undefined}
                      tabIndex={canOpenLightbox ? 0 : -1}
                      onKeyDown={handleLightboxKeyDown}
                    >
                      {showSalePrice && priceDisplay.comparePrice && discountPercent > 0 && (
                        <span
                          className="absolute left-3 top-3 z-30 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: discountBadgeColors.bg, color: discountBadgeColors.text }}>
                          -{discountPercent}%
                        </span>
                      )}
                      <div className="embla overflow-hidden h-full w-full" ref={emblaRef}>
                        <div className="embla__container flex h-full w-full">
                          {displayImages.map((img, idx) => (
                            <div 
                              className="embla__slide flex-[0_0_100%] min-w-0 relative h-full w-full cursor-pointer" 
                              key={idx}
                              onClick={canOpenLightbox ? handleOpenLightbox : undefined}
                            >
                              <BlurredProductImage
                                src={img}
                                fallbackSrc={productImagePlaceholder}
                                alt={product.name}
                                sizes="(max-width: 1024px) 100vw, 50vw"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            disabled={!canScrollPrev}
                            onClick={(e) => { e.stopPropagation(); emblaApi?.scrollPrev(); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 pointer-events-auto z-30"
                            aria-label="Ảnh trước"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={!canScrollNext}
                            onClick={(e) => { e.stopPropagation(); emblaApi?.scrollNext(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 pointer-events-auto z-30"
                            aria-label="Ảnh sau"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                      {images.length > 1 && (
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-sm z-30" style={{ backgroundColor: tokens.surface, color: tokens.headingColor }}>
                          {selectedIndex + 1}/{images.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`overflow-hidden ${heroContainerClass}`} style={heroContainerStyle}>
                <div className={heroImageWrapperClass}>
                  <div className={imageFrame.frameWidthClassName}>
                    <div
                      className={`relative overflow-hidden rounded-xl group/carousel ${canOpenLightbox ? 'cursor-zoom-in' : ''}`.trim()}
                      style={{ ...mainImageFrameStyle, backgroundColor: tokens.surfaceMuted }}
                      role={canOpenLightbox ? 'button' : undefined}
                      tabIndex={canOpenLightbox ? 0 : -1}
                      onKeyDown={handleLightboxKeyDown}
                    >
                      {showSalePrice && priceDisplay.comparePrice && discountPercent > 0 && (
                        <span
                          className="absolute left-3 top-3 z-30 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: discountBadgeColors.bg, color: discountBadgeColors.text }}>
                          -{discountPercent}%
                        </span>
                      )}
                      <div className="embla overflow-hidden h-full w-full" ref={emblaRef}>
                        <div className="embla__container flex h-full w-full">
                          {displayImages.map((img, idx) => (
                            <div 
                              className="embla__slide flex-[0_0_100%] min-w-0 relative h-full w-full cursor-pointer" 
                              key={idx}
                              onClick={canOpenLightbox ? handleOpenLightbox : undefined}
                            >
                              <BlurredProductImage
                                src={img}
                                fallbackSrc={productImagePlaceholder}
                                alt={product.name}
                                sizes="(max-width: 1024px) 100vw, 50vw"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            disabled={!canScrollPrev}
                            onClick={(e) => { e.stopPropagation(); emblaApi?.scrollPrev(); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 pointer-events-auto z-30"
                            aria-label="Ảnh trước"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={!canScrollNext}
                            onClick={(e) => { e.stopPropagation(); emblaApi?.scrollNext(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 pointer-events-auto z-30"
                            aria-label="Ảnh sau"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                      {images.length > 1 && (
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-sm z-30" style={{ backgroundColor: tokens.surface, color: tokens.headingColor }}>
                          {selectedIndex + 1}/{images.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {images.length > 1 && heroStyle !== 'minimal' && (
              <>
                <div className="hidden md:block">
                  <ThumbnailRail
                    images={images}
                    selectedIndex={safeSelectedImageIndex}
                    onSelect={setSelectedImageIndex}
                    orientation="horizontal"
                    visibleSlots={5}
                    tokens={tokens}
                    thumbnailAspectRatio={imageFrame.thumbnailAspectRatio}
                    itemClassName="w-20 rounded-xl"
                    fallbackSrc={productImagePlaceholder}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-3 md:space-y-4 lg:space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: categoryBadgeColors.bg,
                  color: categoryBadgeColors.text,
                  borderColor: categoryBadgeColors.border,
                  borderWidth: 1,
                }}
              >
                {product.categoryName}
              </span>
              {stockStatus && <InlineStockBadge label={stockStatus.label} color={stockStatus.color} tokens={tokens} />}
            </div>

            <h1 className="text-xl md:text-3xl lg:text-4xl font-light tracking-tight" style={{ color: tokens.headingColor }}>
              {product.name}
            </h1>

            {showRating && <RatingInline summary={ratingSummary} tokens={tokens} />}

            {showPrice && (
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xl md:text-3xl lg:text-4xl font-light" style={{ color: tokens.priceColor }}>
                    {priceDisplay.label}
                  </span>
                  {showSalePrice && priceDisplay.comparePrice && (
                    <span className="text-base line-through" style={{ color: tokens.priceOriginalText }}>
                      {formatPrice(priceDisplay.comparePrice)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {hasVariants && (
              <VariantSelector
                options={variantOptions}
                selectedOptions={selectedOptions}
                onSelect={handleSelectOption}
                isOptionValueAvailable={isOptionValueAvailable}
                accentColor={brandColor}
              />
            )}

            <div className="h-px w-full" style={{ backgroundColor: tokens.divider }} />

            {enableCombos && saleMode === 'contact' && !product.hasVariants && product.combos && product.combos.length > 0 && (
              <ProductCombosBlock
                combos={product.combos}
                comboProductsMap={comboProductsMap || new Map()}
                brandColor={brandColor}
                tokens={tokens}
                comboAnimateType={comboAnimateType}
                comboEffectColor={comboEffectColor}
                comboBadgeColors={comboBadgeColors}
                currentProductName={product.name}
                currentProductImage={product.image}
              />
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tokens.bodyText }}>Số lượng</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>{  setQuantity(q => Math.max(1, q - 1)); }}
                  disabled={quantity <= 1}
                  className="h-10 w-10 border rounded-full flex items-center justify-center disabled:opacity-50"
                  style={{ borderColor: tokens.quantityBorder }}
                >
                  <Minus className="w-4 h-4" style={{ color: tokens.quantityIcon }} />
                </button>
                <div className="w-16 text-center">
                  <span className="text-lg font-medium" style={{ color: tokens.quantityText }}>{quantity}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>{  setQuantity(q => Math.min(maxQuantity, q + 1)); }}
                  disabled={quantity >= maxQuantity}
                  className="h-10 w-10 border rounded-full flex items-center justify-center disabled:opacity-50"
                  style={{ borderColor: tokens.quantityBorder }}
                >
                  <Plus className="w-4 h-4" style={{ color: tokens.quantityIcon }} />
                </button>
              </div>
            </div>

            {(showAddToCart || showBuyNow || showWishlist) && (
              <div className="space-y-2 md:space-y-2.5">
                {cartButtonsLayout === 'grid-2' && showAddToCart && showBuyNow ? (
                  <div className="grid grid-cols-2 gap-3">
                    {showAddToCart && (
                      <button
                        className={`w-full h-12 text-base font-semibold transition-all px-2 flex items-center justify-center ${inStock ? 'hover:shadow-lg hover:scale-[1.01]' : 'opacity-50 cursor-not-allowed'}`}
                        style={{ backgroundColor: primaryButtonColors.bg, color: primaryButtonColors.text }}
                        disabled={!inStock}
                        onClick={() => { if (inStock) { onAddToCart(quantity, selectedVariant?._id); } }}
                      >
                        <ShoppingBag className="w-5 h-5 mr-1.5 shrink-0 inline-block" />
                        <span className="truncate">{inStock ? 'Thêm vào giỏ' : 'Hết hàng'}</span>
                      </button>
                    )}
                    {showBuyNow && (
                      <button
                        className={`w-full h-12 text-base font-semibold border transition-all px-2 flex items-center justify-center ${buyNowDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer bg-[var(--cta-secondary-bg)] shadow-sm hover:bg-[var(--cta-secondary-hover-bg)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-secondary-ring)]'}`}
                        style={{
                          borderColor: primaryButtonColors.border,
                          color: primaryButtonColors.text,
                          '--cta-secondary-bg': primaryButtonColors.bg,
                          '--cta-secondary-hover-bg': primaryButtonColors.bg,
                          '--cta-secondary-ring': tokens.inputRing,
                        } as React.CSSProperties}
                        disabled={buyNowDisabled}
                        onClick={() => { if (!buyNowDisabled) { onBuyNow(quantity, selectedVariant?._id); } }}
                      >
                        <span className="truncate">{buyNowLabel}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {showAddToCart && (
                      <button
                        className={`w-full h-12 text-base font-semibold transition-all ${inStock ? 'hover:shadow-lg hover:scale-[1.01]' : 'opacity-50 cursor-not-allowed'}`}
                        style={{ backgroundColor: primaryButtonColors.bg, color: primaryButtonColors.text }}
                        disabled={!inStock}
                        onClick={() => { if (inStock) { onAddToCart(quantity, selectedVariant?._id); } }}
                      >
                        <ShoppingBag className="w-5 h-5 mr-2 inline-block" />
                        {inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                      </button>
                    )}
                    {showBuyNow && (
                      <button
                        className={`w-full h-12 text-base font-semibold border transition-all ${buyNowDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer bg-[var(--cta-secondary-bg)] shadow-sm hover:bg-[var(--cta-secondary-hover-bg)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-secondary-ring)]'}`}
                        style={{
                          borderColor: primaryButtonColors.border,
                          color: primaryButtonColors.text,
                          '--cta-secondary-bg': primaryButtonColors.bg,
                          '--cta-secondary-hover-bg': primaryButtonColors.bg,
                          '--cta-secondary-ring': tokens.inputRing,
                        } as React.CSSProperties}
                        disabled={buyNowDisabled}
                        onClick={() => { if (!buyNowDisabled) { onBuyNow(quantity, selectedVariant?._id); } }}
                      >
                        {buyNowLabel}
                      </button>
                    )}
                  </>
                )}
                {showWishlist && (
                  <button
                    type="button"
                    onClick={onToggleWishlist}
                    className="w-full h-12 text-base border"
                    style={{ borderColor: tokens.wishlistBorder, color: tokens.metaText, backgroundColor: tokens.wishlistBg }}
                  >
                    <Heart className={`w-5 h-5 mr-2 inline-block ${isWishlisted ? 'fill-current' : ''}`} style={{ color: isWishlisted ? tokens.stockDangerText : tokens.wishlistIcon }} />
                    {isWishlisted ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
                  </button>
                )}
              </div>
            )}

            {showSocialButtons && (
              <ProductSocialButtons
                buttons={socialButtons || []}
                tokens={tokens}
              />
            )}

            {showHighlights && <HighlightsGrid highlights={highlights} tokens={tokens} />}
          </div>
        </div>

        <div className="mt-12 lg:mt-16 space-y-6">
          <div className="mt-6 border rounded-2xl p-6" style={{ borderColor: tokens.border }}>
            {(showDescription && resolvedDescription) || showAllProductImagesSection || supplementalContent?.preContent || supplementalContent?.postContent ? (
              <>
                <ExpandableProductDescriptionBlock buttonStyle={{ color: tokens.primary }}>
                  {supplementalContent?.preContent ? (
                    <RichContent
                      content={toRichTextContent(supplementalContent.preContent)}
                      className="max-w-none"
                      style={{ color: tokens.bodyText }}
                    />
                  ) : null}
                  {showDescription && resolvedDescription ? (
                    <RichContent
                      content={resolvedDescription}
                      className="max-w-none"
                      style={{ color: tokens.bodyText }}
                    />
                  ) : null}
                  {showAllProductImagesSection && images.length > 0 ? (
                    <div className="mt-6 border-t pt-6" style={{ borderColor: tokens.divider }}>
                      <ProductDescriptionImages
                        images={images}
                        tokens={tokens}
                        frameAspectRatio={imageFrame.frameAspectRatio}
                        fallbackSrc={productImagePlaceholder}
                      />
                    </div>
                  ) : null}
                  {enableCategoryProductDetailSuffix && category?.productDetailSuffixContent && (
                    <RichContent
                      content={toRichTextContent(category.productDetailSuffixContent)}
                      className="max-w-none mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800"
                      style={{ color: tokens.bodyText }}
                    />
                  )}
                  {supplementalContent?.postContent ? (
                    <RichContent
                      content={toRichTextContent(supplementalContent.postContent)}
                      className="max-w-none mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800"
                      style={{ color: tokens.bodyText }}
                    />
                  ) : null}
                </ExpandableProductDescriptionBlock>
              </>
            ) : (
              <p style={{ color: tokens.metaText }}>Chưa có mô tả chi tiết.</p>
            )}
          </div>
        </div>

        {commentsSection}

        <div className="mt-12">
          <RelatedProductsSection
            products={relatedProducts}
            categorySlug={product.categorySlug}
            brandColor={brandColor}
            tokens={tokens}
            imageAspectRatio={imageAspectRatio}
            showPrice={showPrice}
            showSalePrice={showSalePrice}
            saleMode={saleMode}
            mode={relatedProductsMode}
            page={relatedProductsPage}
            perPage={relatedProductsPerPage}
            totalCount={relatedProductsTotalCount}
            onPageChange={onRelatedProductsPageChange}
            loadMoreRef={relatedLoadMoreRef}
            infiniteStatus={relatedInfiniteStatus}
            isLoading={relatedIsLoading}
            routeMode={routeMode}
            categorySlugMap={categorySlugMap}
            productImagePlaceholder={productImagePlaceholder}
          />
        </div>

        {enableCategoryProductDetailFaq && category?.productDetailFaqEnabled !== false && category?.productDetailFaqItems && category.productDetailFaqItems.length > 0 && (
          <div className="mt-16 border-t pt-8" style={{ borderColor: tokens.border }}>
            <FaqSectionShared
              items={category.productDetailFaqItems.map((item: any) => ({
                id: item.id,
                question: item.question,
                answer: item.answer,
              }))}
              style={(category.productDetailFaqStyle as any) ?? 'accordion'}
              title="Câu hỏi thường gặp"
              suppressInternalHeader={false}
              context="site"
              tokens={getFaqColors({
                primary: brandColor,
                secondary: brandColor,
                mode: 'single',
                style: (category.productDetailFaqStyle as any) ?? 'accordion',
              })}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// ====================================================================================
// STYLE 3: MINIMAL - Clean, focused design
// ====================================================================================
function MinimalStyle({
  product,
  brandColor,
  tokens,
  enableImageLightbox,
  onOpenLightbox,
  relatedProducts,
  relatedProductsMode,
  relatedProductsPerPage,
  relatedProductsPage,
  relatedProductsTotalCount,
  onRelatedProductsPageChange,
  relatedLoadMoreRef,
  relatedInfiniteStatus,
  relatedIsLoading,
  enabledFields,
  variants,
  variantOptions,
  highlights,
  showHighlights,
  ratingSummary,
  saleMode,
  showAddToCart,
  showRating,
  showWishlist,
  showBuyNow,
  buyNowLabel,
  imageAspectRatio,
  showAllProductImagesSection,
  requireStockForBuyNow,
  contentWidth,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  commentsSection,
  category,
  enableCategoryProductDetailSuffix,
  enableCategoryProductDetailFaq,
  productImagePlaceholder,
  routeMode,
  supplementalContent,
  categorySlugMap,
  enableCombos,
  comboProductsMap,
  comboAnimateType,
  comboEffectColor,
  accentColors,
  showSocialButtons,
  socialButtons,
  cartButtonsLayout,
}: StyleProps & ExperienceBlocksProps & HighlightBlockProps & { contentWidth: MinimalContentWidth }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<VariantSelectionMap>({});

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setSelectedIndex(index);
      setSelectedImage(index);
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi && selectedImage !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(selectedImage);
    }
  }, [emblaApi, selectedImage]);
  const [mainImageHeight, setMainImageHeight] = useState<number | null>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const mainImageHeightRef = useRef<number | null>(null);

  const hasVariants = Boolean(product.hasVariants && variants.length > 0 && variantOptions.length > 0);
  const resolvedDescription = useMemo(() => resolveProductContent(product), [product]);

  useEffect(() => {
    const element = mainImageRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const nextHeight = Math.round(entries[0]?.contentRect?.height ?? 0);
      if (!nextHeight || nextHeight === mainImageHeightRef.current) {
        return;
      }
      mainImageHeightRef.current = nextHeight;
      setMainImageHeight(nextHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasVariants) {
      setSelectedOptions({});
      return;
    }
    setSelectedOptions(buildSelectionFromVariant(variants[0]));
  }, [hasVariants, variants]);

  const selectedVariant = useMemo(
    () => (hasVariants ? findExactVariant(variants, selectedOptions) : null),
    [hasVariants, variants, selectedOptions]
  );

  const handleSelectOption = (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) => {
    if (!hasVariants) {
      return;
    }
    const nextSelection = { ...selectedOptions, [optionId]: valueId };
    const matching = findMatchingVariant(variants, nextSelection);
    setSelectedOptions(matching ? buildSelectionFromVariant(matching) : nextSelection);
  };

  const isOptionValueAvailable = (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) =>
    variants.some((variant) =>
      variant.optionValues.every((optionValue) => {
        if (optionValue.optionId === optionId) {
          return optionValue.valueId === valueId;
        }
        const selected = selectedOptions[optionValue.optionId];
        return !selected || selected === optionValue.valueId;
      }) && (!showStock || (variant.stock ?? product.stock ?? 0) > 0)
    );

  const showPrice = enabledFields.has('price') || enabledFields.size === 0;
  const showSalePrice = enabledFields.has('salePrice');
  const showStock = enabledFields.has('stock');
  const showDescription = enabledFields.has('description');
  const _showSku = enabledFields.has('sku');

  const images = buildProductImages(product);
  const displayImages = images.length > 0 ? images : [productImagePlaceholder];
  const safeSelectedImage = Math.min(selectedImage, Math.max(displayImages.length - 1, 0));

  useEffect(() => {
    if (displayImages.length === 0 && selectedImage !== 0) {
      setSelectedImage(0);
      return;
    }
    if (displayImages.length > 0 && selectedImage >= displayImages.length) {
      setSelectedImage(displayImages.length - 1);
    }
  }, [displayImages.length, selectedImage]);

  useEffect(() => {
    preloadNeighborImages(displayImages, safeSelectedImage);
  }, [displayImages, safeSelectedImage]);

  const basePrice = selectedVariant?.price ?? product.price;
  const salePrice = selectedVariant ? selectedVariant.salePrice : product.salePrice;
  const isRangeFromVariant = Boolean(product.hasVariants && !selectedVariant);
  const priceDisplay = getPublicPriceLabel({ saleMode, price: basePrice, salePrice, isRangeFromVariant });
  const discountPercent = priceDisplay.comparePrice
    ? Math.round((1 - basePrice / priceDisplay.comparePrice) * 100)
    : 0;
  const stockValue = selectedVariant?.stock ?? product.stock;
  const inStock = !showStock || stockValue > 0;
  const buyNowDisabled = requireStockForBuyNow && !inStock;

  const stockStatus = showStock
    ? stockValue > 10
      ? { label: 'Còn hàng', color: tokens.stockSuccessText }
      : stockValue > 0
        ? { label: `Chỉ còn ${stockValue} sản phẩm`, color: tokens.stockWarningText }
        : { label: 'Hết hàng', color: tokens.stockDangerText }
    : null;
  const categoryBadgeColors = resolveProductDetailElementColor(accentColors?.categoryBadge ?? 'secondary', tokens);
  const discountBadgeColors = resolveProductDetailElementColor(accentColors?.discountBadge ?? 'primary', tokens);
  const primaryButtonColors = resolveProductDetailElementColor(accentColors?.primaryButton ?? 'primary', tokens);
  const comboBadgeColors = resolveProductDetailElementColor(accentColors?.comboBadge ?? 'black', tokens);
  const canOpenLightbox = enableImageLightbox && images.length > 0;

  const handleOpenLightbox = () => {
    if (!canOpenLightbox) {
      return;
    }
    onOpenLightbox(safeSelectedImage);
  };

  const handleLightboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canOpenLightbox) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenLightbox();
    }
  };

  const imageFrame = getProductImageFrameConfig(imageAspectRatio, 'minimal');
  const mainImageFrameStyle: React.CSSProperties = { aspectRatio: imageFrame.frameAspectRatio };
  const verticalVisibleSlots = mainImageHeight
    ? getVerticalThumbnailSlots({
      frameHeight: mainImageHeight,
      thumbnailWidth: 80,
      thumbnailAspectRatio: imageFrame.thumbnailAspectRatio,
      gap: 8,
      arrowHeight: 36,
      imageCount: displayImages.length,
      minSlots: 1,
    })
    : 6;

  const contentWidthClass = contentWidth === 'narrow'
    ? 'max-w-4xl'
    : contentWidth === 'wide'
      ? 'max-w-7xl'
      : 'max-w-6xl';

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.surface }}>
      <main className={`${contentWidthClass} mx-auto px-0 md:px-6 py-6 md:py-10`}>
        <div className="px-4 md:px-0 mb-3 md:mb-6">
          <nav className="flex items-center gap-1 text-[11px] md:hidden" style={{ color: tokens.breadcrumbText }}>
            {product.categorySlug && product.categoryName ? (
              <>
                <Link href={buildCategoryPath({ categorySlug: product.categorySlug, mode: routeMode, moduleKey: 'products' })} className="transition-colors">{product.categoryName}</Link>
                <ChevronRight size={10} />
              </>
            ) : (
              <>
                <Link href="/products" className="transition-colors">Sản phẩm</Link>
                <ChevronRight size={10} />
              </>
            )}
            <span className="truncate max-w-[180px]" style={{ color: tokens.breadcrumbActive }}>{product.name}</span>
          </nav>
          <nav className="hidden md:flex items-center gap-2 text-xs" style={{ color: tokens.breadcrumbText }}>
            <Link href="/" className="transition-colors">Trang chủ</Link>
            <ChevronRight size={12} />
            <Link href="/products" className="transition-colors">Sản phẩm</Link>
            <ChevronRight size={12} />
            <span className="truncate max-w-[160px]" style={{ color: tokens.breadcrumbActive }}>{product.name}</span>
          </nav>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-7 lg:py-0">
            <div className="lg:sticky lg:top-8">
              <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 items-start">
                {images.length > 1 && (
                  <div className="hidden md:flex md:flex-col md:w-20 shrink-0">
                    <ThumbnailRail
                      images={images}
                      selectedIndex={safeSelectedImage}
                      onSelect={setSelectedImage}
                      orientation="vertical"
                      visibleSlots={verticalVisibleSlots}
                      tokens={tokens}
                      thumbnailAspectRatio={imageFrame.thumbnailAspectRatio}
                      itemClassName="w-20 rounded-sm"
                      inactiveClassName="opacity-70 hover:opacity-100"
                      fallbackSrc={productImagePlaceholder}
                    />
                  </div>
                )}

                <div className={`flex-1 ${imageFrame.frameWidthClassName}`}>
                  <div
                    ref={mainImageRef}
                    className={`relative w-full rounded-sm overflow-hidden group/carousel ${canOpenLightbox ? 'cursor-zoom-in' : ''}`.trim()}
                    style={{ ...mainImageFrameStyle, backgroundColor: tokens.surfaceMuted }}
                    role={canOpenLightbox ? 'button' : undefined}
                    tabIndex={canOpenLightbox ? 0 : -1}
                    onKeyDown={handleLightboxKeyDown}
                  >
                    {showSalePrice && priceDisplay.comparePrice && discountPercent > 0 && (
                      <span
                        className="absolute left-3 top-3 z-30 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ backgroundColor: discountBadgeColors.bg, color: discountBadgeColors.text }}>
                        -{discountPercent}%
                      </span>
                    )}
                    <div className="embla overflow-hidden h-full w-full" ref={emblaRef}>
                      <div className="embla__container flex h-full w-full">
                        {displayImages.map((img, idx) => (
                          <div 
                            className="embla__slide flex-[0_0_100%] min-w-0 relative h-full w-full cursor-pointer" 
                            key={idx}
                            onClick={canOpenLightbox ? handleOpenLightbox : undefined}
                          >
                            <BlurredProductImage
                              src={img}
                              fallbackSrc={productImagePlaceholder}
                              alt={product.name}
                              sizes="(max-width: 1024px) 100vw, 60vw"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          disabled={!canScrollPrev}
                          onClick={(e) => { e.stopPropagation(); emblaApi?.scrollPrev(); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 pointer-events-auto z-30"
                          aria-label="Ảnh trước"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={!canScrollNext}
                          onClick={(e) => { e.stopPropagation(); emblaApi?.scrollNext(); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 pointer-events-auto z-30"
                          aria-label="Ảnh sau"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                    {images.length > 1 && (
                      <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-sm z-30" style={{ backgroundColor: tokens.surface, color: tokens.headingColor }}>
                        {selectedIndex + 1}/{images.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 px-4 md:px-6 py-2 lg:py-0 flex flex-col justify-center" style={{ backgroundColor: tokens.surface }}>
            <div className="mb-3 md:mb-5 space-y-2 md:space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] md:text-xs font-semibold"
                  style={{
                    backgroundColor: categoryBadgeColors.bg,
                    color: categoryBadgeColors.text,
                    borderColor: categoryBadgeColors.border,
                    borderWidth: 1,
                  }}
                >
                  {product.categoryName}
                </span>
                {stockStatus && <InlineStockBadge label={stockStatus.label} color={stockStatus.color} tokens={tokens} />}
              </div>

              <h1 className="text-xl md:text-3xl lg:text-[2rem] font-medium leading-tight tracking-tight" style={{ color: tokens.headingColor }}>
                {product.name}
              </h1>
              {showRating && <RatingInline summary={ratingSummary} tokens={tokens} />}
              {showPrice && (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="text-lg md:text-2xl font-semibold" style={{ color: tokens.priceColor }}>
                    {priceDisplay.label}
                  </p>
                  {showSalePrice && priceDisplay.comparePrice && (
                    <span className="text-sm md:text-base line-through" style={{ color: tokens.priceOriginalText }}>
                      {formatPrice(priceDisplay.comparePrice)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {hasVariants && (
              <div className="mb-4 md:mb-6">
                <VariantSelector
                  options={variantOptions}
                  selectedOptions={selectedOptions}
                  onSelect={handleSelectOption}
                  isOptionValueAvailable={isOptionValueAvailable}
                  accentColor={brandColor}
                />
              </div>
            )}

            {enableCombos && saleMode === 'contact' && !product.hasVariants && product.combos && product.combos.length > 0 && (
              <ProductCombosBlock
                combos={product.combos}
                comboProductsMap={comboProductsMap || new Map()}
                brandColor={brandColor}
                tokens={tokens}
                comboAnimateType={comboAnimateType}
                comboEffectColor={comboEffectColor}
                comboBadgeColors={comboBadgeColors}
                currentProductName={product.name}
                currentProductImage={product.image}
              />
            )}

            {(showAddToCart || showBuyNow || showWishlist) && (
              <div className="flex flex-col gap-2.5 md:gap-3 mb-5 md:mb-6 border-t pt-4 md:pt-5" style={{ borderColor: tokens.divider }}>
                <div className="flex gap-4">
                  {showAddToCart && (
                    <button
                      className={`flex-1 h-14 uppercase tracking-wider text-sm font-medium transition-colors ${inStock ? '' : 'opacity-50 cursor-not-allowed'}`}
                      style={{ backgroundColor: primaryButtonColors.bg, color: primaryButtonColors.text }}
                      disabled={!inStock}
                      onClick={() => { if (inStock) { onAddToCart(1, selectedVariant?._id); } }}
                    >
                      {inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
                    </button>
                  )}
                  {cartButtonsLayout === 'grid-2' && showAddToCart && showBuyNow && (
                    <button
                      className={`flex-1 h-14 uppercase tracking-wider text-sm font-medium border transition-all ${buyNowDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer bg-[var(--cta-secondary-bg)] shadow-sm hover:bg-[var(--cta-secondary-hover-bg)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-secondary-ring)]'}`}
                      style={{
                        borderColor: primaryButtonColors.border,
                        color: primaryButtonColors.text,
                        '--cta-secondary-bg': primaryButtonColors.bg,
                        '--cta-secondary-hover-bg': primaryButtonColors.bg,
                        '--cta-secondary-ring': tokens.inputRing,
                      } as React.CSSProperties}
                      disabled={buyNowDisabled}
                      onClick={() => { if (!buyNowDisabled) { onBuyNow(1, selectedVariant?._id); } }}
                    >
                      <span className="truncate">{buyNowLabel}</span>
                    </button>
                  )}
                  {showWishlist && (
                    <button
                      onClick={onToggleWishlist}
                      className="w-14 h-14 border flex items-center justify-center transition-colors shrink-0"
                      style={isWishlisted
                        ? { borderColor: tokens.stockDangerText, color: tokens.stockDangerText }
                        : { borderColor: tokens.wishlistBorder, color: tokens.wishlistIcon, backgroundColor: tokens.wishlistBg }}
                      aria-label="Thêm vào yêu thích"
                    >
                      <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
                    </button>
                  )}
                </div>
                {showBuyNow && !(cartButtonsLayout === 'grid-2' && showAddToCart) && (
                  <button
                    className={`h-12 uppercase tracking-wider text-xs font-medium border transition-all ${buyNowDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer bg-[var(--cta-secondary-bg)] shadow-sm hover:bg-[var(--cta-secondary-hover-bg)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-secondary-ring)]'}`}
                    style={{
                      borderColor: primaryButtonColors.border,
                      color: primaryButtonColors.text,
                      '--cta-secondary-bg': primaryButtonColors.bg,
                      '--cta-secondary-hover-bg': primaryButtonColors.bg,
                      '--cta-secondary-ring': tokens.inputRing,
                    } as React.CSSProperties}
                    disabled={buyNowDisabled}
                    onClick={() => { if (!buyNowDisabled) { onBuyNow(1, selectedVariant?._id); } }}
                  >
                    {buyNowLabel}
                  </button>
                )}
              </div>
            )}

            {showSocialButtons && (
              <ProductSocialButtons
                buttons={socialButtons || []}
                tokens={tokens}
              />
            )}

            {showHighlights && <HighlightsGrid highlights={highlights} tokens={tokens} />}
          </div>
        </div>

        {commentsSection}
        {(showDescription && resolvedDescription) || showAllProductImagesSection || supplementalContent?.preContent || supplementalContent?.postContent ? (
          <section className="mt-10 rounded-2xl border px-6 py-8" style={{ borderColor: tokens.border }}>
            <ExpandableProductDescriptionBlock buttonStyle={{ color: tokens.primary }}>
              {supplementalContent?.preContent ? (
                <RichContent
                  content={toRichTextContent(supplementalContent.preContent)}
                  className="leading-relaxed font-light text-justify"
                  style={{ color: tokens.bodyText }}
                />
              ) : null}
              {showDescription && resolvedDescription && (
                <RichContent
                  content={resolvedDescription}
                  className="leading-relaxed font-light text-justify"
                  style={{ color: tokens.bodyText }}
                />
              )}
              {showAllProductImagesSection && images.length > 0 && (
                <div className="mt-6 border-t pt-6" style={{ borderColor: tokens.divider }}>
                  <ProductDescriptionImages
                    images={images}
                    tokens={tokens}
                    frameAspectRatio={imageFrame.frameAspectRatio}
                    fallbackSrc={productImagePlaceholder}
                  />
                </div>
              )}
              {enableCategoryProductDetailSuffix && category?.productDetailSuffixContent && (
                <RichContent
                  content={toRichTextContent(category.productDetailSuffixContent)}
                  className="leading-relaxed font-light text-justify mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800"
                  style={{ color: tokens.bodyText }}
                />
              )}
              {supplementalContent?.postContent ? (
                <RichContent
                  content={toRichTextContent(supplementalContent.postContent)}
                  className="leading-relaxed font-light text-justify mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800"
                  style={{ color: tokens.bodyText }}
                />
              ) : null}
            </ExpandableProductDescriptionBlock>
          </section>
        ) : null}
        <RelatedProductsSection
          products={relatedProducts}
          categorySlug={product.categorySlug}
          brandColor={brandColor}
          tokens={tokens}
          imageAspectRatio={imageAspectRatio}
          showPrice={showPrice}
          showSalePrice={enabledFields.has('salePrice')}
          saleMode={saleMode}
          mode={relatedProductsMode}
          page={relatedProductsPage}
          perPage={relatedProductsPerPage}
          totalCount={relatedProductsTotalCount}
          onPageChange={onRelatedProductsPageChange}
          loadMoreRef={relatedLoadMoreRef}
          infiniteStatus={relatedInfiniteStatus}
          isLoading={relatedIsLoading}
          routeMode={routeMode}
          categorySlugMap={categorySlugMap}
          productImagePlaceholder={productImagePlaceholder}
        />

        {enableCategoryProductDetailFaq && category?.productDetailFaqEnabled !== false && category?.productDetailFaqItems && category.productDetailFaqItems.length > 0 && (
          <div className="mt-16 border-t pt-8" style={{ borderColor: tokens.divider }}>
            <FaqSectionShared
              items={category.productDetailFaqItems.map((item: any) => ({
                id: item.id,
                question: item.question,
                answer: item.answer,
              }))}
              style={(category.productDetailFaqStyle as any) ?? 'accordion'}
              title="Câu hỏi thường gặp"
              suppressInternalHeader={false}
              context="site"
              tokens={getFaqColors({
                primary: brandColor,
                secondary: brandColor,
                mode: 'single',
                style: (category.productDetailFaqStyle as any) ?? 'accordion',
              })}
            />
          </div>
        )}
      </main>
    </div>
  );
}

type ProductCommentsSectionProps = {
  brandColor: string;
  tokens: ProductDetailColors;
  ratingSummary: RatingSummary;
  comments: CommentData[];
  replyMap: Map<string, CommentData[]>;
  commentName: string;
  commentEmail: string;
  commentContent: string;
  commentRating: number;
  commentMessage: string | null;
  isSubmitting: boolean;
  replyDrafts: Record<string, { content: string; email: string; name: string }>;
  replySubmittingId: string | null;
  showLikes: boolean;
  showReplies: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onRatingChange: (value: number) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onLike: (id: Id<'comments'>) => void;
  onUnlike: (id: Id<'comments'>) => void;
  onReplyDraftChange: (parentId: Id<'comments'>, key: 'name' | 'email' | 'content', value: string) => void;
  onReplySubmit: (parentId: Id<'comments'>) => void;
};

function RatingStars({ value, size = 14, onChange, tokens }: { value: number; size?: number; onChange?: (next: number) => void; tokens: ProductDetailColors }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={onChange ? () => onChange(star) : undefined}
          className={onChange ? 'transition-transform hover:scale-105' : 'cursor-default'}
          aria-label={`${star} sao`}
        >
          <Star
            size={size}
            style={star <= Math.round(value)
              ? { color: RATING_STAR_ACTIVE_COLOR, fill: RATING_STAR_ACTIVE_COLOR }
              : { color: tokens.ratingStarInactive }}
          />
        </button>
      ))}
    </div>
  );
}

function ProductCommentsSection({
  brandColor: _brandColor,
  tokens,
  ratingSummary,
  comments,
  replyMap,
  commentName,
  commentEmail,
  commentContent,
  commentRating,
  commentMessage,
  isSubmitting,
  replyDrafts,
  replySubmittingId,
  showLikes,
  showReplies,
  onNameChange,
  onEmailChange,
  onContentChange,
  onRatingChange,
  onSubmit,
  onLike,
  onUnlike,
  onReplyDraftChange,
  onReplySubmit,
}: ProductCommentsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [openReplyIds, setOpenReplyIds] = useState<Set<string>>(new Set());
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());

  const avatarColors = [
    tokens.primary,
    tokens.secondary,
    tokens.priceColor,
    tokens.ctaSecondaryBorder,
    tokens.discountBadgeBg,
  ];
  const getAvatarColor = (id: string) => avatarColors[id.charCodeAt(1) % avatarColors.length];
  const visibleComments = showAllComments ? comments : comments.slice(0, 3);

  const handleToggleLike = (id: Id<'comments'>) => {
    if (likedIds.has(id)) {
      setLikedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onUnlike(id);
    } else {
      setLikedIds(prev => new Set(prev).add(id));
      onLike(id);
    }
  };

  const toggleReplyForm = (id: Id<'comments'>) => {
    setOpenReplyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleReplies = (id: Id<'comments'>) => {
    setOpenReplies(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="mt-12 border-t pt-8" style={{ borderColor: tokens.divider }}>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: tokens.divider }}>
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5" style={{ color: tokens.primary }} />
          <div>
            <h3 className="text-lg font-semibold" style={{ color: tokens.headingColor }}>Đánh giá & Bình luận</h3>
            <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: tokens.metaText }}>
              {ratingSummary.average && ratingSummary.count > 0 ? (
                <>
                  <RatingStars value={ratingSummary.average} size={14} tokens={tokens} />
                  <span>{ratingSummary.average.toFixed(1)} ({ratingSummary.count} đánh giá)</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
          style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText }}
        >
          {showForm ? 'Đóng' : 'Viết đánh giá'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mt-4 rounded-xl border p-4 space-y-3"
          style={{ borderColor: tokens.commentBorder, backgroundColor: tokens.commentSurface }}
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              value={commentName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Họ và tên *"
              className="h-9 w-full rounded-md border px-3 text-sm focus-visible:outline-none"
              style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBg, color: tokens.inputText }}
              required
            />
            <input
              value={commentEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Email (không bắt buộc)"
              className="h-9 w-full rounded-md border px-3 text-sm focus-visible:outline-none"
              style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBg, color: tokens.inputText }}
              type="email"
            />
          </div>
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: tokens.bodyText }}>Chọn số sao</p>
            <RatingStars value={commentRating} size={18} onChange={onRatingChange} tokens={tokens} />
          </div>
          <textarea
            value={commentContent}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            className="min-h-[90px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none"
            style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBg, color: tokens.inputText }}
            required
          />
          {commentMessage && <p className="text-xs" style={{ color: tokens.metaText }}>{commentMessage}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 rounded-full px-4 text-xs font-medium"
              style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {visibleComments.length > 0 ? (
          visibleComments.map((comment) => {
            const replies = replyMap.get(comment._id) ?? [];
            const showReplyForm = openReplyIds.has(comment._id);
            const showRepliesList = openReplies.has(comment._id);
            return (
              <div
                key={comment._id}
                className="rounded-xl border p-4"
                style={{ borderColor: tokens.commentBorder, backgroundColor: tokens.commentSurface }}
              >
                <div className="flex gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ backgroundColor: getAvatarColor(comment._id), color: tokens.ctaPrimaryText }}
                  >
                    {comment.authorName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: tokens.headingColor }}>{comment.authorName}</span>
                      <span className="text-xs" style={{ color: tokens.softText }}>• {new Date(comment._creationTime).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {typeof comment.rating === 'number' && (
                      <div className="mt-1">
                        <RatingStars value={comment.rating} size={12} tokens={tokens} />
                      </div>
                    )}
                    <p className="mt-2 text-sm" style={{ color: tokens.commentText }}>{comment.content}</p>
                    {(showLikes || showReplies) && (
                      <div className="mt-2 flex items-center gap-3">
                        {showLikes && (
                          <button
                            type="button"
                            onClick={() => handleToggleLike(comment._id)}
                            className="inline-flex items-center gap-1 text-xs font-medium"
                            style={likedIds.has(comment._id)
                              ? { color: tokens.commentActionActive }
                              : { color: tokens.commentAction }}
                          >
                            <ThumbsUp className={`h-3 w-3 ${likedIds.has(comment._id) ? 'fill-current' : ''}`} />
                            {(comment.likesCount ?? 0) > 0 ? comment.likesCount : 'Thích'}
                          </button>
                        )}
                        {showReplies && (
                          <button
                            type="button"
                            onClick={() => toggleReplyForm(comment._id)}
                            className="inline-flex items-center gap-1 text-xs font-medium"
                            style={{ color: tokens.commentAction }}
                          >
                            <Reply className="h-3 w-3" />
                            {showReplyForm ? 'Đóng' : 'Trả lời'}
                          </button>
                        )}
                        {showReplies && replies.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleReplies(comment._id)}
                            className="text-xs font-medium"
                            style={{ color: tokens.commentAction }}
                          >
                            {showRepliesList ? 'Ẩn' : 'Xem'} {replies.length} phản hồi
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {showReplies && showReplyForm && (
                  <div className="mt-4 rounded-lg border p-3 space-y-2" style={{ borderColor: tokens.replyBorder, backgroundColor: tokens.replySurface }}>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        value={replyDrafts[comment._id]?.name ?? ''}
                        onChange={(e) => onReplyDraftChange(comment._id, 'name', e.target.value)}
                        placeholder="Họ và tên *"
                        className="h-9 w-full rounded-md border px-3 text-sm focus-visible:outline-none"
                        style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBg, color: tokens.inputText }}
                        required
                      />
                      <input
                        value={replyDrafts[comment._id]?.email ?? ''}
                        onChange={(e) => onReplyDraftChange(comment._id, 'email', e.target.value)}
                        placeholder="Email (không bắt buộc)"
                        className="h-9 w-full rounded-md border px-3 text-sm focus-visible:outline-none"
                        style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBg, color: tokens.inputText }}
                        type="email"
                      />
                    </div>
                    <textarea
                      value={replyDrafts[comment._id]?.content ?? ''}
                      onChange={(e) => onReplyDraftChange(comment._id, 'content', e.target.value)}
                      placeholder="Nội dung phản hồi..."
                      className="min-h-[70px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none"
                      style={{ borderColor: tokens.inputBorder, backgroundColor: tokens.inputBg, color: tokens.inputText }}
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={replySubmittingId === comment._id}
                        onClick={() => onReplySubmit(comment._id)}
                        className="h-8 rounded-full px-4 text-xs font-medium"
                        style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}
                      >
                        {replySubmittingId === comment._id ? 'Đang gửi...' : 'Gửi phản hồi'}
                      </button>
                    </div>
                  </div>
                )}

                {showReplies && showRepliesList && replies.length > 0 && (
                  <div className="mt-4 space-y-3 border-l-2 pl-4" style={{ borderColor: tokens.replyBorder }}>
                    {replies.map((reply) => (
                      <div key={reply._id} className="flex gap-3">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: tokens.primary, color: tokens.ctaPrimaryText }}
                        >
                          {reply.authorName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold" style={{ color: tokens.replyNameText }}>{reply.authorName}</span>
                            <span className="text-xs" style={{ color: tokens.softText }}>• {new Date(reply._creationTime).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <p className="text-sm mt-1" style={{ color: tokens.replyText }}>{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div
            className="rounded-xl border border-dashed p-6 text-center text-sm"
            style={{ borderColor: tokens.border, color: tokens.emptyStateText, backgroundColor: tokens.emptyStateBg }}
          >
            Chưa có đánh giá nào cho sản phẩm này.
          </div>
        )}
      </div>

      {comments.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAllComments(!showAllComments)}
          className="mt-4 w-full rounded-lg border border-dashed py-2 text-sm font-medium"
          style={{ borderColor: tokens.border, color: tokens.commentAction }}
        >
          {showAllComments ? 'Thu gọn' : `Xem thêm ${comments.length - 3} đánh giá`}
        </button>
      )}
    </section>
  );
}

function RelatedProductsSection({
  products,
  categorySlug,
  brandColor,
  tokens,
  imageAspectRatio,
  showPrice,
  showSalePrice,
  saleMode,
  mode,
  page,
  perPage,
  totalCount,
  onPageChange,
  loadMoreRef,
  infiniteStatus,
  isLoading,
  routeMode,
  categorySlugMap,
  productImagePlaceholder,
}: {
  products: RelatedProduct[];
  categorySlug?: string;
  brandColor: string;
  tokens: ProductDetailColors;
  imageAspectRatio: ProductImageAspectRatio;
  showPrice: boolean;
  showSalePrice: boolean;
  saleMode: ProductsSaleMode;
  mode: RelatedProductsMode;
  page: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  loadMoreRef: (node?: Element | null) => void;
  infiniteStatus: PaginationStatus;
  isLoading: boolean;
  routeMode: 'unified' | 'namespace';
  categorySlugMap: Map<string, string>;
  productImagePlaceholder: string;
}) {
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs(imageAspectRatio);
  const getDetailHref = useMemo(() => (
    (relatedProduct: RelatedProduct) => buildDetailPath({
      categorySlug: categorySlugMap.get(relatedProduct.categoryId),
      mode: routeMode,
      moduleKey: 'products',
      recordSlug: relatedProduct.slug,
    })
  ), [categorySlugMap, routeMode]);
  if (products.length === 0 && !isLoading) {return null;}
  const totalPages = totalCount > 0 ? Math.max(Math.ceil(totalCount / perPage), 1) : 1;
  const paginationItems = mode === 'pagination' ? generatePaginationItems(page, totalPages) : [];
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  const isExhausted = infiniteStatus === 'Exhausted';
  const relatedImageStyle: React.CSSProperties = {
    aspectRatio: getProductImageFrameConfig(imageAspectRatio, 'classic').frameAspectRatio,
  };
  
  return (
    <section className="mt-16 pt-12 border-t" style={{ borderColor: tokens.divider }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: tokens.headingColor }}>Sản phẩm liên quan</h2>
          <p className="text-xs mt-1" style={{ color: tokens.metaText }}>
            {mode === 'fixed' && '4 sản phẩm'}
            {mode === 'infiniteScroll' && `Cuộn vô hạn · ${perPage}/lần`}
            {mode === 'pagination' && `Phân trang · ${perPage}/trang`}
          </p>
        </div>
        {categorySlug && (
          <Link href={buildCategoryPath({ categorySlug: categorySlug!, mode: routeMode, moduleKey: 'products' })} className="text-sm font-medium flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: brandColor }}>
            Xem tất cả <ChevronRight size={16} />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => {
          const priceDisplay = getPublicPriceLabel({ saleMode, price: p.price, salePrice: p.salePrice, isRangeFromVariant: p.hasVariants });
          return (
          <Link
            key={p._id}
            href={getDetailHref(p)}
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: tokens.relatedCardBorder, backgroundColor: tokens.relatedCardBg }}
          >
            <ProductImageWithOverlay
              frameConfig={frameConfig}
              watermarkConfig={watermarkConfig}
              className="overflow-hidden relative"
              style={{ ...relatedImageStyle, backgroundColor: tokens.surfaceMuted }}
            >
              <ProductImageWithFallback mode="thumb" src={p.image} fallbackSrc={productImagePlaceholder} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
              {showSalePrice && priceDisplay.comparePrice && !priceDisplay.isContactPrice && (
                <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded z-30" style={{ backgroundColor: tokens.discountBadgeBg, color: tokens.discountBadgeText }}>-{Math.round((1 - p.price / priceDisplay.comparePrice) * 100)}%</span>
              )}
            </ProductImageWithOverlay>
            <div className="p-4">
              <h3 className="font-medium line-clamp-2 transition-colors mb-2 text-sm" style={{ color: tokens.headingColor }}>{p.name}</h3>
              {showPrice && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: tokens.priceColor }}>{priceDisplay.label}</span>
                  {showSalePrice && priceDisplay.comparePrice && (
                    <span className="text-xs line-through" style={{ color: tokens.priceOriginalText }}>{formatPrice(priceDisplay.comparePrice)}</span>
                  )}
                </div>
              )}
            </div>
          </Link>
          );
        })}
      </div>
      {isLoading && (
        <div className="text-center mt-6 text-xs" style={{ color: tokens.metaText }}>
          Đang tải sản phẩm...
        </div>
      )}
      {mode === 'infiniteScroll' && (
        <div ref={loadMoreRef} className="text-center mt-6 text-xs" style={{ color: tokens.metaText }}>
          {isLoading ? 'Đang tải thêm...' : (isExhausted ? 'Đã hiển thị hết sản phẩm.' : 'Cuộn để xem thêm...')}
        </div>
      )}
      {mode === 'pagination' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            className="h-8 px-3 rounded-md border text-xs font-medium"
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={!canGoPrev}
            style={{
              borderColor: tokens.border,
              color: canGoPrev ? tokens.metaText : tokens.softText,
              backgroundColor: tokens.surface,
            }}
          >
            Trước
          </button>
          {paginationItems.map((item, index) => {
            if (item === 'ellipsis') {
              return <span key={`ellipsis-${index}`} className="text-xs" style={{ color: tokens.metaText }}>…</span>;
            }
            const isActive = item === page;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className="h-8 w-8 rounded-md border text-xs font-semibold"
                style={isActive
                  ? { backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText, borderColor: tokens.ctaPrimaryBg }
                  : { borderColor: tokens.border, color: tokens.metaText, backgroundColor: tokens.surface }}
              >
                {item}
              </button>
            );
          })}
          <button
            type="button"
            className="h-8 px-3 rounded-md border text-xs font-medium"
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            disabled={!canGoNext}
            style={{
              borderColor: tokens.border,
              color: canGoNext ? tokens.metaText : tokens.softText,
              backgroundColor: tokens.surface,
            }}
          >
            Sau
          </button>
        </div>
      )}
    </section>
  );
}

function ProductDetailSkeleton({ tokens }: { tokens: ProductDetailColors }) {
  return (
    <div className="min-h-screen animate-pulse" style={{ backgroundColor: tokens.surface }}>
      <div className="border-b" style={{ borderColor: tokens.divider }}>
        <div className="max-w-6xl mx-auto px-4 py-3"><div className="h-4 w-64 rounded" style={{ backgroundColor: tokens.skeletonBase }} /></div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="aspect-square rounded-2xl mb-4" style={{ backgroundColor: tokens.skeletonBase }} />
            <div className="flex gap-3">{[1, 2, 3, 4].map((i) => (<div key={i} className="w-20 h-20 rounded-lg" style={{ backgroundColor: tokens.skeletonBase }} />))}</div>
          </div>
          <div className="mt-8 lg:mt-0 space-y-4">
            <div className="h-6 w-24 rounded-full" style={{ backgroundColor: tokens.skeletonBase }} />
            <div className="h-10 w-full rounded" style={{ backgroundColor: tokens.skeletonBase }} />
            <div className="h-4 w-48 rounded" style={{ backgroundColor: tokens.skeletonBase }} />
            <div className="h-10 w-40 rounded" style={{ backgroundColor: tokens.skeletonBase }} />
            <div className="h-12 w-full rounded-xl" style={{ backgroundColor: tokens.skeletonBase }} />
            <div className="h-32 w-full rounded-xl" style={{ backgroundColor: tokens.skeletonBase }} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductCombosBlockProps {
  combos: any[];
  comboProductsMap: Map<string, any>;
  brandColor: string;
  tokens: ProductDetailColors;
  comboAnimateType?: string;
  comboEffectColor?: ComboEffectColor;
  comboBadgeColors: ReturnType<typeof resolveProductDetailElementColor>;
  currentProductName: string;
  currentProductImage?: string;
}

function ProductCombosBlock({
  combos,
  comboProductsMap,
  brandColor: _brandColor,
  tokens,
  comboAnimateType = 'none',
  comboEffectColor = 'gradient-1',
  comboBadgeColors,
  currentProductName,
  currentProductImage,
}: ProductCombosBlockProps) {
  if (!combos || combos.length === 0) return null;

  const [expandedCombos, setExpandedCombos] = useState<Record<number, boolean>>({});

  let animateClass = '';
  let titleEffectClass = '';
  let isGradientEffect = false;
  let effectColorVal = '';
  const titleEffectStyle: React.CSSProperties & Record<string, string> = {};

  const applyEffectColor = () => {
    let colorVal = '';
    let isGradient = false;

    if (comboEffectColor === 'black') {
      titleEffectStyle['--combo-sparkle-a'] = '#020617';
      titleEffectStyle['--combo-sparkle-b'] = '#64748b';
      titleEffectStyle['--combo-sparkle-c'] = '#cbd5e1';
      colorVal = '#020617';
    } else if (comboEffectColor === 'white') {
      titleEffectStyle['--combo-sparkle-a'] = '#f8fafc';
      titleEffectStyle['--combo-sparkle-b'] = '#ffffff';
      titleEffectStyle['--combo-sparkle-c'] = '#cbd5e1';
      colorVal = '#ffffff';
    } else if (comboEffectColor === 'red') {
      titleEffectStyle['--combo-sparkle-a'] = '#dc2626';
      titleEffectStyle['--combo-sparkle-b'] = '#f97316';
      titleEffectStyle['--combo-sparkle-c'] = '#991b1b';
      colorVal = '#dc2626';
    } else if (comboEffectColor === 'primary') {
      titleEffectStyle['--combo-sparkle-a'] = tokens.primary;
      titleEffectStyle['--combo-sparkle-b'] = tokens.secondary;
      titleEffectStyle['--combo-sparkle-c'] = comboBadgeColors.text;
      colorVal = tokens.primary;
    } else if (comboEffectColor === 'secondary') {
      titleEffectStyle['--combo-sparkle-a'] = tokens.secondary;
      titleEffectStyle['--combo-sparkle-b'] = tokens.primary;
      titleEffectStyle['--combo-sparkle-c'] = comboBadgeColors.text;
      colorVal = tokens.secondary;
    } else if (comboEffectColor === 'gradient-2') {
      titleEffectStyle['--combo-sparkle-a'] = '#bf953f';
      titleEffectStyle['--combo-sparkle-b'] = '#fcf6ba';
      titleEffectStyle['--combo-sparkle-c'] = '#b38728';
      isGradient = true;
    } else if (comboEffectColor === 'gradient-3') {
      titleEffectStyle['--combo-sparkle-a'] = '#00c6ff';
      titleEffectStyle['--combo-sparkle-b'] = '#0072ff';
      titleEffectStyle['--combo-sparkle-c'] = '#7928ca';
      isGradient = true;
    } else {
      // gradient-1 (default)
      titleEffectStyle['--combo-sparkle-a'] = '#ff007a';
      titleEffectStyle['--combo-sparkle-b'] = '#7928ca';
      titleEffectStyle['--combo-sparkle-c'] = '#00dfd8';
      isGradient = true;
    }

    isGradientEffect = isGradient;
    effectColorVal = colorVal;

    if (isGradient) {
      titleEffectStyle.backgroundImage = `linear-gradient(90deg, ${titleEffectStyle['--combo-sparkle-a']}, ${titleEffectStyle['--combo-sparkle-b']}, ${titleEffectStyle['--combo-sparkle-c']})`;
      titleEffectStyle.WebkitBackgroundClip = 'text';
      titleEffectStyle.backgroundClip = 'text';
      titleEffectStyle.WebkitTextFillColor = 'transparent';
      titleEffectStyle.color = 'transparent';
    } else if (colorVal) {
      titleEffectStyle.backgroundImage = 'none';
      titleEffectStyle.WebkitBackgroundClip = 'initial';
      titleEffectStyle.backgroundClip = 'initial';
      titleEffectStyle.WebkitTextFillColor = 'initial';
      titleEffectStyle.color = colorVal;
    }
  };

  // Luôn áp dụng màu hiệu ứng để mọi hiệu ứng chữ đều nhận màu
  applyEffectColor();

  if (comboAnimateType === 'luxury-sheen' || comboAnimateType === 'pulse' || comboAnimateType === 'bounce') {
    animateClass = 'animate-combo-luxury-sheen';
  } else if (comboAnimateType === 'typing') {
    titleEffectClass = 'animate-combo-typing-text';
  } else if (comboAnimateType === 'letter-wave') {
    titleEffectClass = 'animate-combo-letter-wave';
  } else if (comboAnimateType === 'fire') {
    animateClass = 'animate-combo-fire';
    titleEffectClass = 'animate-combo-fire-text';
  } else if (comboAnimateType === 'sparkle' || comboAnimateType.startsWith('sparkle-')) {
    animateClass = 'animate-combo-sparkle';
    titleEffectClass = 'animate-combo-sparkle-text';
  } else if (comboAnimateType === 'text-highlight') {
    animateClass = 'animate-combo-text-highlight';
  } else if (comboAnimateType === 'border-rainbow') {
    animateClass = 'animate-combo-border-rainbow';
  }

  const renderEffectText = (text: string) => {
    if (comboAnimateType !== 'letter-wave') {
      return <span className={`combo-title-text ${titleEffectClass}`.trim()} style={titleEffectStyle}>{text}</span>;
    }

    return (
      <span className="combo-title-text inline-block">
        {Array.from(text).map((char, index, arr) => {
          const L = arr.length;
          const charStyle: React.CSSProperties = {
            animationDelay: `${index * 0.06}s`,
            display: 'inline-block',
          };

          if (isGradientEffect) {
            charStyle.backgroundImage = `linear-gradient(90deg, ${titleEffectStyle['--combo-sparkle-a']}, ${titleEffectStyle['--combo-sparkle-b']}, ${titleEffectStyle['--combo-sparkle-c']})`;
            charStyle.backgroundSize = `${L * 100}% 100%`;
            charStyle.backgroundPosition = `${(index / (L - 1 || 1)) * 100}% 0`;
            charStyle.WebkitBackgroundClip = 'text';
            charStyle.backgroundClip = 'text';
            charStyle.WebkitTextFillColor = 'transparent';
            charStyle.color = 'transparent';
          } else if (effectColorVal) {
            charStyle.color = effectColorVal;
          }

          return (
            <span
              key={`${char}-${index}`}
              className="animate-combo-letter-wave"
              style={charStyle}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </span>
    );
  };

  const getComboDetails = (combo: any) => {
    let title = typeof combo.name === 'string' ? combo.name.trim() : '';
    let conditionText = '';
    let rewardText = '';
    let iconType: 'gift' | 'percent' | 'amount' = 'gift';

    if (combo.type === 'standard') {
      const cfg = combo.standardConfig;
      const minQty = cfg?.minQty || 1;
      conditionText = `Mua từ ${minQty} sản phẩm`;
      
      if (cfg?.rewardType === 'discount_percent') {
        rewardText = `Giảm ${cfg.rewardValue}%`;
        iconType = 'percent';
      } else if (cfg?.rewardType === 'discount_amount') {
        rewardText = `Giảm ${formatPrice(cfg.rewardValue || 0)}`;
        iconType = 'amount';
      } else if (cfg?.rewardType === 'gift_self') {
        rewardText = `Tặng thêm ${cfg.giftQty || 1} sản phẩm này`;
        iconType = 'gift';
      } else if (cfg?.rewardType === 'gift_other' && cfg.giftProductId) {
        const giftProduct = comboProductsMap.get(cfg.giftProductId);
        rewardText = `Tặng kèm ${cfg.giftQty || 1} ${giftProduct?.name || 'Sản phẩm khác'}`;
        iconType = 'gift';
      }
    } else if (combo.type === 'mix') {
      const cfg = combo.mixConfig;
      const itemsLabel = cfg?.items?.map((item: any) => {
        const p = comboProductsMap.get(item.productId);
        return `${item.quantity}x ${p?.name || 'sản phẩm đi kèm'}`;
      }).join(', ');
      
      const curQty = cfg?.currentProductQty || 1;
      conditionText = itemsLabel 
        ? `Mua ${curQty} sản phẩm này kèm ${itemsLabel}` 
        : `Mua ${curQty} sản phẩm này`;
      
      if (cfg?.rewardType === 'discount_percent') {
        rewardText = `Giảm ${cfg.rewardValue}%`;
        iconType = 'percent';
      } else if (cfg?.rewardType === 'discount_amount') {
        rewardText = `Giảm ${formatPrice(cfg.rewardValue || 0)}`;
        iconType = 'amount';
      } else if (cfg?.rewardType === 'gift_other' && cfg.giftProductId) {
        const giftProduct = comboProductsMap.get(cfg.giftProductId);
        rewardText = `Tặng kèm ${cfg.giftQty || 1} ${giftProduct?.name || 'Sản phẩm khác'}`;
        iconType = 'gift';
      }
    }

    if (!title) {
      title = combo.type === 'mix' ? 'Combo trọn bộ' : 'Combo mua nhiều';
    }

    return {
      title,
      conditionText,
      rewardText,
      priceText: combo.price ? formatPrice(combo.price) : 'Liên hệ',
      iconType,
    };
  };

  return (
    <div className="mt-2.5 mb-3.5 space-y-2">
      <div className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.headingColor }}>
        Combo ưu đãi đặc biệt
      </div>
      <div className="space-y-2">
        {combos.map((combo, index) => {
          const details = getComboDetails(combo);
          const isExpanded = expandedCombos[index] ?? false;

          return (
            <div
              key={combo.id ?? index}
              className={`group relative flex flex-col overflow-hidden rounded-md border p-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 ${animateClass} ${combo.type === 'mix' ? 'cursor-pointer' : ''}`}
              style={{
                borderColor: tokens.border,
                backgroundColor: tokens.surface,
              }}
              onClick={() => {
                if (combo.type === 'mix') {
                  setExpandedCombos(prev => ({ ...prev, [index]: !prev[index] }));
                }
              }}
            >
              <div className="flex items-center justify-between gap-2.5 min-w-0 w-full">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-bold text-[15px] leading-snug flex items-center gap-1.5 flex-wrap" style={{ color: tokens.headingColor }}>
                      {renderEffectText(details.title)}
                      {combo.type === 'mix' && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-sm font-bold uppercase tracking-wider shrink-0">Theo bộ</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      {details.conditionText && (
                        <span className="font-medium text-slate-500 dark:text-slate-400 truncate max-w-[240px] md:max-w-[360px]">
                          {details.conditionText}
                        </span>
                      )}
                      {details.conditionText && details.rewardText && (
                        <span className="text-slate-300">•</span>
                      )}
                      {details.rewardText && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-500 shrink-0">
                          {details.rewardText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price block */}
                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: tokens.softText }}>
                      Giá combo
                    </span>
                    <span className="text-sm font-bold tracking-tight" style={{ color: tokens.primary }}>
                      {details.priceText}
                    </span>
                  </div>
                  {combo.type === 'mix' && (
                    <div className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors ml-1">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  )}
                </div>
              </div>

              {/* Danh sách chi tiết các sản phẩm trong Combo Mix */}
              {combo.type === 'mix' && isExpanded && combo.mixConfig?.items && (
                <div 
                  className="mt-2.5 pt-2.5 border-t border-dashed space-y-1.5 text-xs w-full" 
                  style={{ borderColor: tokens.border }}
                  onClick={(e) => e.stopPropagation()} // tránh trigger click cha
                >
                  <div className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] mb-1">
                    Danh sách sản phẩm trong combo:
                  </div>
                  
                  {/* Sản phẩm chủ thể hiện tại */}
                  <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 p-1.5 rounded gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {currentProductImage ? (
                        <img src={currentProductImage} alt={currentProductName} className="h-7 w-7 object-cover rounded border shrink-0 bg-white" />
                      ) : (
                        <div className="h-7 w-7 rounded border shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <Package size={12} />
                        </div>
                      )}
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{currentProductName} <span className="text-[10px] text-slate-400 font-normal">(Sản phẩm này)</span></span>
                    </div>
                    <span className="shrink-0 text-slate-500 font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">x{combo.mixConfig.currentProductQty || 1}</span>
                  </div>

                  {/* Các sản phẩm mua kèm thêm */}
                  {combo.mixConfig.items.map((item: any, idx: number) => {
                    const pInfo = comboProductsMap.get(item.productId);
                    return (
                      <div key={idx} className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 p-1.5 rounded gap-2">
                        {pInfo ? (
                          <Link href={`/products/${pInfo.slug}`} className="flex items-center gap-2 min-w-0 group/item hover:opacity-90">
                            {pInfo.image ? (
                              <img src={pInfo.image} alt={pInfo.name} className="h-7 w-7 object-cover rounded border shrink-0 bg-white" />
                            ) : (
                              <div className="h-7 w-7 rounded border shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Package size={12} />
                              </div>
                            )}
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate group-hover/item:text-primary transition-colors">{pInfo.name}</span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-7 w-7 rounded border shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                              <Package size={12} />
                            </div>
                            <span className="font-medium text-slate-400 truncate">Sản phẩm không có sẵn</span>
                          </div>
                        )}
                        <span className="shrink-0 text-slate-500 font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">x{item.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ZaloSvg = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" />
  </svg>
);

const TikTokSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const XSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const ShopeeSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.9414 17.9633c.229-1.879-.981-3.077-4.1758-4.0969-1.548-.528-2.277-1.22-2.26-2.1719.065-1.056 1.048-1.825 2.352-1.85a5.2898 5.2898 0 0 1 2.8838.89c.116.072.197.06.263-.039.09-.145.315-.494.39-.62.051-.081.061-.187-.068-.281-.185-.1369-.704-.4149-.983-.5319a6.4697 6.4697 0 0 0-2.5118-.514c-1.909.008-3.4129 1.215-3.5389 2.826-.082 1.1629.494 2.1078 1.73 2.8278.262.152 1.6799.716 2.2438.892 1.774.552 2.695 1.5419 2.478 2.6969-.197 1.047-1.299 1.7239-2.818 1.7439-1.2039-.046-2.2878-.537-3.1278-1.19l-.141-.11c-.104-.08-.218-.075-.287.03-.05.077-.376.547-.458.67-.077.108-.035.168.045.234.35.293.817.613 1.134.775a6.7097 6.7097 0 0 0 2.8289.727 4.9048 4.9048 0 0 0 2.0759-.354c1.095-.465 1.8029-1.394 1.9449-2.554zM11.9986 1.4009c-2.068 0-3.7539 1.95-3.8329 4.3899h7.6657c-.08-2.44-1.765-4.3899-3.8328-4.3899zm7.8516 22.5981-.08.001-15.7843-.002c-1.074-.04-1.863-.91-1.971-1.991l-.01-.195L1.298 6.2858a.459.459 0 0 1 .45-.494h4.9748C6.8448 2.568 9.1607 0 11.9996 0c2.8388 0 5.1537 2.5689 5.2757 5.7898h4.9678a.459.459 0 0 1 .458.483l-.773 15.5883-.007.131c-.094 1.094-.979 1.9769-2.0709 2.0059z"/>
  </svg>
);

const MessengerSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13"/>
  </svg>
);

interface SocialIconDef {
  value: string;
  label: string;
  brandColor: string;
  suggestedLabel: string;
  suggestedUrl: string;
  imageSrc?: string;
}

const SOCIAL_ICON_DEFS: SocialIconDef[] = [
  { value: 'zalo', label: 'Zalo', brandColor: '#0084ff', suggestedLabel: 'Chat Zalo', suggestedUrl: 'https://zalo.me/yourpage' },
  { value: 'shopee', label: 'Shopee', brandColor: '#ee4d2d', suggestedLabel: 'Shopee', suggestedUrl: 'https://shopee.vn/yourshop' },
  { value: 'lazada', label: 'Lazada', brandColor: '#0f1689', suggestedLabel: 'Lazada', suggestedUrl: 'https://lazada.vn/shop/yourshop', imageSrc: '/icons/lazada-logo.png' },
  { value: 'facebook', label: 'Facebook', brandColor: '#1877f2', suggestedLabel: 'Facebook', suggestedUrl: 'https://facebook.com/yourpage' },
  { value: 'instagram', label: 'Instagram', brandColor: '#e1306c', suggestedLabel: 'Instagram', suggestedUrl: 'https://instagram.com/yourpage' },
  { value: 'tiktok', label: 'TikTok', brandColor: '#000000', suggestedLabel: 'TikTok', suggestedUrl: 'https://tiktok.com/@yourpage' },
  { value: 'youtube', label: 'Youtube', brandColor: '#ff0000', suggestedLabel: 'Youtube', suggestedUrl: 'https://youtube.com/@yourchannel' },
  { value: 'phone', label: 'Điện thoại', brandColor: '#ef4444', suggestedLabel: 'Gọi ngay', suggestedUrl: 'tel:0123456789' },
  { value: 'messenger', label: 'Messenger', brandColor: '#0084ff', suggestedLabel: 'Messenger', suggestedUrl: 'https://m.me/yourpage' },
  { value: 'tiki', label: 'Tiki', brandColor: '#1a94ff', suggestedLabel: 'Tiki', suggestedUrl: 'https://tiki.vn/cua-hang/yourshop', imageSrc: '/icons/tiki-logo.png' },
  { value: 'mail', label: 'Email', brandColor: '#ea580c', suggestedLabel: 'Email', suggestedUrl: 'mailto:contact@example.com' },
];

const getSocialIconDef = (value: string): SocialIconDef =>
  SOCIAL_ICON_DEFS.find((d) => d.value === value) ?? SOCIAL_ICON_DEFS[0];

const renderSocialIcon = (value: string, size = 16) => {
  if (value === 'zalo') return <ZaloSvg size={size} />;
  if (value === 'tiktok') return <TikTokSvg size={size} />;
  if (value === 'x') return <XSvg size={size} />;
  if (value === 'shopee') return <ShopeeSvg size={size} />;
  if (value === 'messenger') return <MessengerSvg size={size} />;

  const def = SOCIAL_ICON_DEFS.find((d) => d.value === value);
  if (def?.imageSrc) {
    return <img src={def.imageSrc} alt={def.label} width={size} height={size} className="object-contain" style={{ borderRadius: '50%' }} />;
  }

  const map: Record<string, React.ElementType> = {
    phone: Phone,
    facebook: Facebook,
    instagram: Instagram,
    youtube: Youtube,
    telegram: Send,
    mail: Mail,
  };
  const Icon = map[value] ?? Phone;
  return <Icon size={size} />;
};

function ProductSocialButtons({
  buttons,
  tokens,
}: {
  buttons: Array<{ id: string; icon: string; label: string; url: string; active: boolean }>;
  tokens: ProductDetailColors;
}) {
  const activeButtons = buttons.filter(b => b.active);
  if (activeButtons.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t" style={{ borderColor: tokens.divider }}>
      <p className="text-xs font-semibold mb-2" style={{ color: tokens.headingColor }}>
        Liên hệ & Mua hàng:
      </p>
      <div className="flex flex-wrap gap-2">
        {activeButtons.map((btn) => {
          const def = getSocialIconDef(btn.icon);
          return (
            <a
              key={btn.id}
              href={btn.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all hover:scale-105 active:scale-[0.98] text-white hover:brightness-110"
              style={{
                backgroundColor: def.brandColor,
                borderColor: def.brandColor,
              }}
            >
              {renderSocialIcon(btn.icon, 13)}
              <span>{btn.label || def.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
