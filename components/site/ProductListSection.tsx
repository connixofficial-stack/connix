'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, Package } from 'lucide-react';
import { BrandBadge, SaleBadge } from '@/components/site/shared/BrandColorHelpers';
import { ProductImageWithOverlay, useProductImageOverlayConfigs } from '@/components/shared/ProductImageWithOverlay';
import { getPublicPriceLabel } from '@/lib/products/public-price';
import { getProductImageAspectRatioCssValue, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { useSnapshotDemoContext } from '@/components/modules/homepage/SnapshotDemoProvider';
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { getSectionSpacingClassName, normalizeSectionSpacing } from '@/app/admin/home-components/_shared/types/sectionSpacing';
import { cn } from '@/app/admin/components/ui';
import { getProductListCardRadiusClassName, getProductListImageRadiusClassName, normalizeProductListCardRadius, normalizeProductListDesktopColumns } from '@/app/admin/home-components/product-list/_types';
import { PRODUCT_LIST_LOOKBOOK_BANNERS } from '@/app/admin/home-components/product-list/_lib/constants';
import useEmblaCarousel from 'embla-carousel-react';

import { notifyAddToCart, useCart } from '@/lib/cart';
import { useCartConfig } from '@/lib/experiences';
import { getProductsListColors, type ProductsListColors } from '@/components/site/products/colors';
import { ProductCardActions } from '@/components/site/shared/ProductCardActions';
import { QuickAddVariantModal } from '@/components/products/QuickAddVariantModal';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

// 6 Styles theo mẫu previews.tsx
// 'minimal' = Luxury Minimal, 'commerce' = Commerce Card, 'bento' = Bento Grid
// 'carousel' = Horizontal Scroll, 'compact' = Dense Grid, 'showcase' = Featured + Grid
type ProductListStyle = 'minimal' | 'commerce' | 'bento' | 'carousel' | 'wine-carousel' | 'compact' | 'showcase' | 'tabbed' | 'storefront' | 'lookbook';

interface ProductListSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode?: 'single' | 'dual';
  title: string;
  snapshotComponentKey?: string;
  isDark?: boolean;
}

type ProductListSiteProduct = {
  _id: string;
  categoryId: string;
  hasVariants?: boolean;
  image?: string;
  name: string;
  price?: number;
  salePrice?: number;
  slug?: string | null;
};

function WineCarouselSiteSection({
  products,
  itemCount,
  brandColor,
  header,
  getProductDetailHref,
  getPriceDisplay,
  getDiscount,
  formatComparePrice,
  cardRadiusClassName,
  sectionSpacingClassName,
  tokens,
  showStock,
  showAddToCartButton,
  showBuyNowButton,
  cartButtonsLayout,
  onAddToCart,
  onBuyNow,
}: {
  products: ProductListSiteProduct[];
  itemCount: number;
  brandColor: string;
  header: React.ReactNode;
  getProductDetailHref: (product?: { slug?: string | null; categoryId?: string }) => string;
  getPriceDisplay: (price?: number, salePrice?: number, isRangeFromVariant?: boolean) => ReturnType<typeof getPublicPriceLabel>;
  getDiscount: (currentPrice?: number, comparePrice?: number, isContactPrice?: boolean) => string | null;
  formatComparePrice: (price?: number) => string;
  cardRadiusClassName: string;
  sectionSpacingClassName: string;
  tokens: ProductsListColors;
  showStock: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  cartButtonsLayout: 'stack' | 'grid-2';
  onAddToCart: (product: any) => void;
  onBuyNow: (product: any) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    loop: false,
    slidesToScroll: 1,
  });
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs();
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    if (!emblaApi) {return;}
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) {return;}
    emblaApi.on('select', updateScrollState);
    emblaApi.on('reInit', updateScrollState);
    updateScrollState();
    return () => {
      emblaApi.off('select', updateScrollState);
      emblaApi.off('reInit', updateScrollState);
    };
  }, [emblaApi, updateScrollState]);

  React.useEffect(() => {
    if (!emblaApi) {return;}
    emblaApi.reInit();
  }, [emblaApi, products.length]);

  const displayedProducts = products.slice(0, Math.max(itemCount, 8));

  return (
    <section className={cn('bg-white px-4 md:px-6', sectionSpacingClassName)} style={{ fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {header}
        <div className="mb-2 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Cuộn trước"
            disabled={!canScrollPrev}
            onClick={() => emblaApi?.scrollPrev()}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${canScrollPrev ? 'border-stone-200 hover:bg-stone-50' : 'cursor-not-allowed border-stone-100 opacity-40'}`}
            style={canScrollPrev ? { color: brandColor } : undefined}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Cuộn sau"
            disabled={!canScrollNext}
            onClick={() => emblaApi?.scrollNext()}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${canScrollNext ? 'text-white' : 'cursor-not-allowed border border-stone-100 opacity-40'}`}
            style={canScrollNext ? { backgroundColor: brandColor } : undefined}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 md:gap-4">
            {displayedProducts.map((product) => {
              const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
              const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
              const href = getProductDetailHref(product);

              return (
                <div key={product._id} className="min-w-0 flex-[0_0_auto] w-[140px] sm:w-[150px] md:w-[190px] lg:w-[calc((100%-4rem)/5)]">
                  <div className={cn("group relative flex h-full flex-col overflow-hidden rounded-md border border-stone-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-200/50", cardRadiusClassName)}>
                    <Link className="block" href={href}>
                      <div className="relative aspect-square overflow-hidden border-b border-stone-50 bg-white">
                        {discount ? (
                          <span className="absolute left-0 top-2 z-10 rounded-r-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:top-3 sm:px-2.5 sm:text-xs" style={{ backgroundColor: brandColor }}>
                            {discount}
                          </span>
                        ) : null}
                        <ProductImageWithOverlay className="w-full h-full" frameConfig={frameConfig} watermarkConfig={watermarkConfig}>
                          {product.image ? (
                            <Image mode="thumb" src={product.image} alt={product.name} fill sizes="(max-width: 640px) 140px, (max-width: 768px) 150px, (max-width: 1024px) 190px, 20vw" className="object-contain p-1 transition-opacity duration-300" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-stone-50">
                              <Package size={34} className="text-stone-300" />
                            </div>
                          )}
                        </ProductImageWithOverlay>
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-2 sm:p-3">
                      <Link href={href}>
                        <h3 className="mb-1.5 line-clamp-3 text-sm font-bold leading-tight transition-colors sm:mb-2 sm:text-base" style={{ color: brandColor }}>
                          {product.name}
                        </h3>
                      </Link>
                      <div className="mb-1.5 flex flex-col gap-0.5 sm:mb-2 sm:gap-1" />
                      <div className="mt-auto flex flex-col gap-1 border-t border-stone-100 pt-1.5 sm:pt-2">
                        <div className="flex min-w-0 flex-col">
                          {priceDisplay.comparePrice ? (
                            <span className="text-[10px] font-medium text-stone-400 line-through decoration-stone-400 decoration-1 sm:text-xs">
                              {formatComparePrice(priceDisplay.comparePrice)}
                            </span>
                          ) : null}
                          <span className="text-base font-bold sm:text-lg" style={{ color: brandColor }}>{priceDisplay.label}</span>
                        </div>
                        {showAddToCartButton || showBuyNowButton ? (
                          <ProductCardActions
                            product={product as any}
                            tokens={tokens}
                            showStock={showStock}
                            showAddToCartButton={showAddToCartButton}
                            showBuyNowButton={showBuyNowButton}
                            buyNowLabel="Mua ngay"
                            onAddToCart={onAddToCart}
                            onBuyNow={onBuyNow}
                            cartButtonsLayout={cartButtonsLayout}
                          />
                        ) : (
                          <Link className="mt-2 text-center shrink-0 rounded px-2 py-1 text-[10px] font-medium text-white transition-colors hover:opacity-90 sm:px-3 sm:py-1.5 sm:text-xs" href={href} style={{ backgroundColor: brandColor }}>
                            Xem
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductListSection({ config, brandColor, secondary, mode, title, snapshotComponentKey, isDark }: ProductListSectionProps) {
  const snapshotDemo = useSnapshotDemoContext();
  const style = (config.style as ProductListStyle) || 'commerce';
  const itemCount = (config.itemCount as number) || 8;
  const cardRadius = normalizeProductListCardRadius(config.cornerRadius ?? config.cardRadius, config.noBorderRadius);
  const cardRadiusClassName = getProductListCardRadiusClassName(cardRadius);
  const imageRadiusClassName = getProductListImageRadiusClassName(cardRadius);
  const sectionSpacingClassName = getSectionSpacingClassName(config.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(config.spacing));
  const desktopColumns = normalizeProductListDesktopColumns(config.desktopColumns ?? config.lookbookDesktopColumns);
  const productGridClassName = desktopColumns === 3
    ? 'grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-4'
    : 'grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6';
  const lookbookDesktopColumns = desktopColumns;
  const selectionMode = (config.selectionMode as 'auto' | 'manual' | 'demo') || 'auto';
  const selectedProductIds = React.useMemo(() => (config.selectedProductIds as string[]) || [], [config.selectedProductIds]);
  const demoProducts = React.useMemo(() => (config.demoProducts as Array<{ id: string; name: string; image?: string; price?: string; originalPrice?: string; description?: string; category?: string; tag?: string }>) || [], [config.demoProducts]);

  const headerConfig = extractSectionHeaderConfig({
    ...config,
    badgeText: config.badgeText ?? 'Bộ sưu tập',
    subtitle: config.subtitle ?? title,
  });
  // SectionHeader title = component title from props
  const displayTitle = title;

  const carouselId = React.useId();
  const carouselElementId = `product-carousel-${carouselId.replaceAll(':', '')}`;
  const [activeLookbookId, setActiveLookbookId] = React.useState<string | null>(null);
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const categories = useQuery(api.productCategories.listActive);
  const saleMode = React.useMemo<'cart' | 'contact' | 'affiliate'>(() => {
    const value = saleModeSetting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [saleModeSetting?.value]);
  const imageAspectRatio = React.useMemo(
    () => resolveProductImageAspectRatio(aspectRatioSetting?.value),
    [aspectRatioSetting?.value]
  );
  const imageAspectRatioStyle = React.useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  const snapshotData = React.useMemo(() => {
    if (!snapshotDemo || !snapshotComponentKey) {return null;}
    const data = snapshotDemo.getComponentData(snapshotComponentKey);
    return data?.kind === 'product-list' ? data : null;
  }, [snapshotDemo, snapshotComponentKey]);
  const routeMode = React.useMemo(
    () => normalizeRouteMode(snapshotData?.settings?.iaRouteMode ?? routeModeSetting),
    [routeModeSetting, snapshotData?.settings]
  );
  const categorySlugMap = React.useMemo(() => {
    if (snapshotData) {
      return new Map(snapshotData.categories.map((category) => [category.id, category.slug ?? '']));
    }
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((category) => [category._id, category.slug]));
  }, [categories, snapshotData]);
  const getProductDetailHref = React.useCallback((product?: { slug?: string | null; categoryId?: string }) => {
    if (!product?.slug) {return '/products';}
    return buildDetailPath({
      categorySlug: product.categoryId ? categorySlugMap.get(product.categoryId) : undefined,
      mode: routeMode,
      moduleKey: 'products',
      recordSlug: product.slug,
    });
  }, [categorySlugMap, routeMode]);
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs(imageAspectRatio);
  
  // Query products based on selection mode (skip for demo mode and manual mode)
  const productsData = useQuery(
    api.products.listPublicResolved,
    selectionMode === 'demo' || selectionMode === 'manual' ? 'skip' : { limit: Math.min(itemCount, 20) }
  );

  const manualProductsData = useQuery(
    api.products.listByIds,
    selectionMode === 'manual' && selectedProductIds.length > 0 ? { ids: selectedProductIds as Id<'products'>[] } : 'skip'
  );

  const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
  const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
  const cartButtonsLayout = (config.cartButtonsLayout as 'stack' | 'grid-2') || 'stack';
  const showStock = config.showStock !== false;

  const router = useRouter();
  const { addItem, openDrawer } = useCart();
  const cartConfig = useCartConfig();
  const [quickAddTarget, setQuickAddTarget] = React.useState<{ product: any; action: 'addToCart' | 'buyNow' } | null>(null);

  const tokens = React.useMemo(
    () => {
      const rawTokens = getProductsListColors(brandColor, secondary, mode || 'single');
      return adaptTokensForDarkMode(rawTokens, isDark ?? false);
    },
    [brandColor, secondary, mode, isDark]
  );

  const handleAddToCart = async (product: any) => {
    if (showStock && !product.hasVariants && (product.stock ?? 0) <= 0) {
      return;
    }

    if (product.hasVariants) {
      setQuickAddTarget({ product, action: 'addToCart' });
      return;
    }

    await addItem(product._id, 1);
    notifyAddToCart();
    if (cartConfig.layoutStyle === 'drawer') {
      openDrawer();
    } else {
      router.push('/cart');
    }
  };

  const handleBuyNow = (product: any) => {
    if (showStock && !product.hasVariants && (product.stock ?? 0) <= 0) {
      return;
    }

    if (product.hasVariants) {
      setQuickAddTarget({ product, action: 'buyNow' });
      return;
    }

    router.push(`/checkout?productId=${product._id}&quantity=1`);
  };

  const handleQuickAddConfirm = async (variantId: Id<'productVariants'>, quantity: number) => {
    if (!quickAddTarget) return;
    const { product, action } = quickAddTarget;

    if (action === 'addToCart') {
      await addItem(product._id, quantity, variantId);
      notifyAddToCart();
      if (cartConfig.layoutStyle === 'drawer') {
        openDrawer();
      } else {
        router.push('/cart');
      }
    } else {
      router.push(`/checkout?productId=${product._id}&quantity=${quantity}&variantId=${variantId}`);
    }
    setQuickAddTarget(null);
  };

  const renderQuickAddModal = () => (
    <QuickAddVariantModal
      isOpen={quickAddTarget !== null}
      product={quickAddTarget?.product ?? null}
      brandColor={brandColor}
      actionLabel={quickAddTarget?.action === 'addToCart' ? 'Thêm vào giỏ' : 'Mua ngay'}
      onClose={() => setQuickAddTarget(null)}
      onConfirm={handleQuickAddConfirm}
    />
  );

  const renderSingleProductCard = (product: any, size: 'sm' | 'md' | 'lg' = 'md') => {
    const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
    const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
    const href = getProductDetailHref(product);

    return (
      <div key={product._id} className={cn("group bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer", cardRadiusClassName)}>
        <Link href={href} className="block relative bg-slate-100 overflow-hidden" style={imageAspectRatioStyle}>
          <ProductImageWithOverlay className="w-full h-full" frameConfig={frameConfig} watermarkConfig={watermarkConfig}>
            {product.image ? (
              <Image
                mode="thumb"
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package size={size === 'sm' ? 24 : 32} className="text-slate-300" />
              </div>
            )}
          </ProductImageWithOverlay>
          {discount && (
            <div className="absolute top-2 right-2 z-30">
              <SaleBadge text={discount} className="text-[10px] px-2 py-0.5" />
            </div>
          )}
        </Link>

        <div className={cn("p-3 flex flex-col flex-1", size === 'sm' ? 'p-2' : 'p-3 md:p-4')}>
          <Link href={href} className="block flex-1">
            <h3 className={cn("font-bold text-slate-900 line-clamp-2 mb-1 group-hover:opacity-80 transition-colors", size === 'sm' ? 'text-xs' : 'text-sm')}>
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2 mb-3 mt-auto pt-1">
              <span className={cn("font-bold", size === 'sm' ? 'text-xs' : 'text-sm')} style={{ color: brandColor }}>{priceDisplay.label}</span>
              {priceDisplay.comparePrice && (
                <span className="text-[10px] text-slate-400 line-through">{formatComparePrice(priceDisplay.comparePrice)}</span>
              )}
            </div>
          </Link>

          {showAddToCartButton || showBuyNowButton ? (
            <ProductCardActions
              product={product}
              tokens={tokens}
              showStock={showStock}
              showAddToCartButton={showAddToCartButton}
              showBuyNowButton={showBuyNowButton}
              buyNowLabel="Mua ngay"
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              cartButtonsLayout={cartButtonsLayout}
            />
          ) : (
            <Link
              href={href}
              className="w-full gap-1 border-2 py-1.5 px-2 rounded-lg font-medium flex items-center justify-center transition-colors whitespace-nowrap text-xs hover:bg-opacity-10"
              style={{ borderColor: `${brandColor}20`, color: brandColor }}
            >
              Xem chi tiết <ArrowRight className="w-3 h-3 flex-shrink-0" />
            </Link>
          )}
        </div>
      </div>
    );
  };
  
  // Get products to display based on selection mode
  const products = React.useMemo(() => {
    // Demo mode: dùng dữ liệu từ config, không query DB
    if (selectionMode === 'demo' && demoProducts.length > 0) {
      const parseDemoPrice = (s?: string) => {
        if (!s) {return undefined;}
        const n = Number.parseInt(s.replaceAll(/\D/g, ''));
        return Number.isFinite(n) ? n : undefined;
      };
      return demoProducts.map((item) => {
        const parsed = parseDemoPrice(item.price);
        const parsedOriginal = parseDemoPrice(item.originalPrice);
        // Nếu có giá gốc cao hơn => coi như đang sale
        const hasSale = parsedOriginal != null && parsed != null && parsedOriginal > parsed;
        return {
          _id: item.id,
          categoryId: '',
          hasVariants: false,
          image: item.image,
          name: item.name,
          price: hasSale ? parsedOriginal : (parsed ?? 0),
          salePrice: hasSale ? parsed : undefined,
          slug: '',
          status: 'Active' as const,
        };
      });
    }
    if (snapshotData) {
      return snapshotData.items.slice(0, itemCount).map((item) => ({
        _id: item.id,
        categoryId: item.categoryId ?? '',
        hasVariants: item.hasVariants,
        image: item.image,
        name: item.name,
        price: item.price ?? 0,
        salePrice: item.salePrice,
        slug: item.slug,
        status: 'Active' as const,
      }));
    }
    if (selectionMode === 'manual') {
      if (!manualProductsData) {return [];}
      const productMap = new Map(manualProductsData.map(p => [p._id, p]));
      return selectedProductIds
        .map(id => productMap.get(id as Id<"products">))
        .filter((p): p is NonNullable<typeof p> => p !== undefined && p.status === 'Active');
    }

    if (!productsData) {return [];}
    
    return productsData.filter(p => p.status === 'Active').slice(0, itemCount);
  }, [productsData, manualProductsData, selectionMode, selectedProductIds, itemCount, snapshotData, demoProducts]);

  const showViewAll = products.length >= 3;

  // Loading state (skip for demo mode)
  const isLoading = selectionMode !== 'demo' && !snapshotData && (
    (selectionMode === 'manual' && manualProductsData === undefined) ||
    (selectionMode === 'auto' && productsData === undefined)
  );

  if (isLoading) {
    return (
      <section className={cn(sectionSpacingClassName, 'px-4')}>
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  // No products state
  if (products.length === 0) {
    return (
      <section className={cn(sectionSpacingClassName, 'px-4')}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-4">{title}</h2>
          <p className="text-slate-500">Chưa có sản phẩm nào.</p>
        </div>
      </section>
    );
  }

  // Format price — demo mode cũng dùng chung (đã parse price thành number ở useMemo)
  const isDemo = selectionMode === 'demo';
  const getPriceDisplay = (price?: number, salePrice?: number, isRangeFromVariant?: boolean) =>
    getPublicPriceLabel({ saleMode: isDemo ? 'cart' : saleMode, price, salePrice, isRangeFromVariant });

  const formatComparePrice = (price?: number) =>
    price ? getPublicPriceLabel({ saleMode: 'cart', price }).label : '';

  const getDiscount = (currentPrice?: number, comparePrice?: number, isContactPrice?: boolean) => {
    if (isContactPrice || !currentPrice || !comparePrice || comparePrice <= currentPrice) {return null;}
    return `-${Math.round(((comparePrice - currentPrice) / comparePrice) * 100)}%`;
  };

  // Reusable header: SectionHeader + "Xem tất cả" link below (non-carousel layouts)
  const renderSiteHeader = (opts?: { className?: string }) => {
    if (headerConfig.hideHeader) { return null; }
    return (
      <div className={opts?.className ?? 'mb-3 md:mb-4'}>
        <SectionHeader title={displayTitle} brandColor={brandColor} {...headerConfig} className="mb-0" />
        {showViewAll && (
          <div className="flex justify-end mt-2">
            <Link href="/products" className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: brandColor }}>
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    );
  };

  // Style 1: E-commerce Clean — flat cards, circular discount badge, cart icon, "Xem thêm" CTA
  if (style === 'minimal') {
    return (
      <>
        <section className={cn(sectionSpacingClassName, 'px-4 md:px-6')}>
          <div className="max-w-7xl mx-auto">
            {renderSiteHeader()}
            
            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5 lg:gap-5">
              {products.slice(0, 10).map((product) => renderSingleProductCard(product))}
            </div>

            {/* "Xem thêm" button */}
            {showViewAll && (
              <div className="flex justify-center mt-8">
                <Link
                  href="/products"
                  className="px-8 py-2.5 rounded-full text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                >
                  Xem thêm
                </Link>
              </div>
            )}
          </div>
        </section>
        {renderQuickAddModal()}
      </>
    );
  }


  // Style 2: Commerce Card - Cards với button Xem chi tiết và hover effects
  if (style === 'commerce') {
    return (
      <>
        <section className={cn(sectionSpacingClassName, 'px-4 md:px-6')}>
          <div className="max-w-7xl mx-auto">
            {renderSiteHeader()}
            
            {/* Grid */}
            <div className={productGridClassName}>
              {products.slice(0, 4).map((product) => renderSingleProductCard(product))}
            </div>
          </div>
        </section>
        {renderQuickAddModal()}
      </>
    );
  }

  // Style 4: Carousel - Horizontal scrollable với arrows
  if (style === 'carousel') {
    const cardWidth = 260;
    const gap = 20;
    const displayedProducts = products.slice(0, 8);
    // Responsive: Desktop ~4 items (260px each), Tablet ~3 items, Mobile ~2 items
    const showArrowsDesktop = displayedProducts.length > 4;
    const showArrowsMobile = displayedProducts.length > 2;

    return (
      <>
      <section className={cn(sectionSpacingClassName, 'px-4 md:px-6')}>
        <div className="max-w-7xl mx-auto">
          {/* Section Header + navigation arrows below */}
          {!headerConfig.hideHeader && (
          <div className="mb-3 md:mb-4">
            <SectionHeader title={displayTitle} brandColor={brandColor} {...headerConfig} className="mb-0" />
            {(showArrowsMobile || showArrowsDesktop) && (
              <div className={`flex justify-end items-center gap-2 mt-2${
                showArrowsMobile && showArrowsDesktop ? "" :
                showArrowsDesktop ? " hidden md:flex" :
                " md:hidden"
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector(`#${carouselElementId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                  }}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={16} className="md:hidden" style={{ color: brandColor }} />
                  <ChevronLeft size={18} className="hidden md:block" style={{ color: brandColor }} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector(`#${carouselElementId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                  }}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white transition-colors"
                  style={{ backgroundColor: brandColor }}
                >
                  <ChevronRight size={16} className="md:hidden" />
                  <ChevronRight size={18} className="hidden md:block" />
                </button>
              </div>
            )}
          </div>
          )}

          {/* Carousel Container */}
          <div className="relative overflow-hidden rounded-xl">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-r from-white/10 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-l from-white/10 to-transparent z-10 pointer-events-none" />

            {/* Scrollable area với Mouse Drag */}
            <div
              id={carouselElementId}
              className="flex overflow-x-auto snap-x snap-mandatory gap-3 md:gap-5 py-4 px-2 cursor-grab active:cursor-grabbing select-none scrollbar-hide"
              style={{
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
              onMouseDown={(e) => {
                const el = e.currentTarget;
                el.dataset.isDown = 'true';
                el.dataset.startX = String(e.pageX - el.offsetLeft);
                el.dataset.scrollLeft = String(el.scrollLeft);
                el.style.scrollBehavior = 'auto';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.dataset.isDown = 'false';
                e.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseUp={(e) => {
                e.currentTarget.dataset.isDown = 'false';
                e.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseMove={(e) => {
                const el = e.currentTarget;
                if (el.dataset.isDown !== 'true') {return;}
                e.preventDefault();
                const x = e.pageX - el.offsetLeft;
                const walk = (x - Number(el.dataset.startX)) * 1.5;
                el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
              }}
            >
              {displayedProducts.map((product) => {
                const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
                const href = getProductDetailHref(product);
                return (
                  <div
                    key={product._id}
                    className="flex-shrink-0 snap-start w-[160px] md:w-[220px] lg:w-[260px] group cursor-pointer flex flex-col"
                  >
                    <Link href={href} className="block flex-1" draggable={false}>
                      <ProductImageWithOverlay
                        className={cn("relative overflow-hidden rounded-xl bg-slate-100 mb-3 border border-transparent hover:border-slate-200 transition-all", cardRadiusClassName)}
                        style={imageAspectRatioStyle}
                        frameConfig={frameConfig}
                        watermarkConfig={watermarkConfig}
                      >
                        {product.image ? (
                          <Image
                            mode="thumb"
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 260px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            draggable={false}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><Package size={40} className="text-slate-300" /></div>
                        )}
                        {discount && (
                          <div className="absolute top-2 left-2 z-30">
                            <SaleBadge text={discount} className="text-[10px] px-2 py-1" />
                          </div>
                        )}
                      </ProductImageWithOverlay>
                      <h3 className="font-medium text-slate-900 text-sm line-clamp-2 group-hover:opacity-80 transition-colors">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <span className="font-bold text-sm" style={{ color: brandColor }}>{priceDisplay.label}</span>
                        {priceDisplay.comparePrice && (
                          <span className="text-xs text-slate-400 line-through">{formatComparePrice(priceDisplay.comparePrice)}</span>
                        )}
                      </div>
                    </Link>

                    {showAddToCartButton || showBuyNowButton ? (
                      <ProductCardActions
                        product={product}
                        tokens={tokens}
                        showStock={showStock}
                        showAddToCartButton={showAddToCartButton}
                        showBuyNowButton={showBuyNowButton}
                        buyNowLabel="Mua ngay"
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        cartButtonsLayout={cartButtonsLayout}
                      />
                    ) : null}
                  </div>
                );
              })}
              {/* End spacer */}
              <div className="flex-shrink-0 w-4" />
            </div>
          </div>

          {/* CSS để ẩn scrollbar */}
          <style>{`
            #${carouselElementId}::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      </section>
      {renderQuickAddModal()}
      </>
    );
  }

  // Style: Wine Carousel - horizontal cards matching premium wine catalog references
  if (style === 'wine-carousel') {
    return (
      <>
        <WineCarouselSiteSection
          products={products}
          itemCount={itemCount}
          brandColor={brandColor}
          header={renderSiteHeader({ className: 'mb-1 md:mb-2' })}
          getProductDetailHref={getProductDetailHref}
          getPriceDisplay={getPriceDisplay}
          getDiscount={getDiscount}
          formatComparePrice={formatComparePrice}
          cardRadiusClassName={cardRadiusClassName}
          sectionSpacingClassName={sectionSpacingClassName}
          tokens={tokens}
          showStock={showStock}
          showAddToCartButton={showAddToCartButton}
          showBuyNowButton={showBuyNowButton}
          cartButtonsLayout={cartButtonsLayout}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
        {renderQuickAddModal()}
      </>
    );
  }

  // Style 5: Compact - Dense grid với smaller cards, nhiều sản phẩm hơn
  if (style === 'compact') {
    return (
      <>
        <section className={cn(sectionSpacingClassName, 'px-4 md:px-6')}>
          <div className="max-w-7xl mx-auto">
            {renderSiteHeader()}
            
            {/* Compact Grid - More items, smaller cards */}
            <div className={cn(productGridClassName, 'gap-3 md:gap-3')}>
              {products.slice(0, 8).map((product) => renderSingleProductCard(product, 'sm'))}
            </div>
          </div>
        </section>
        {renderQuickAddModal()}
      </>
    );
  }

  // Style 6: Showcase - Featured large item với grid nhỏ bên cạnh
  if (style === 'showcase') {
    const showcaseFeatured = products[0];
    const showcaseOthers = products.slice(1, 5);
    const showcasePriceDisplay = showcaseFeatured
      ? getPriceDisplay(showcaseFeatured.price, showcaseFeatured.salePrice, showcaseFeatured.hasVariants)
      : null;
    const showcaseDiscount = getDiscount(showcaseFeatured?.price, showcasePriceDisplay?.comparePrice, showcasePriceDisplay?.isContactPrice);

    return (
      <>
        <section className={cn(sectionSpacingClassName, 'px-4 md:px-6')}>
          <div className="max-w-7xl mx-auto">
            {renderSiteHeader()}
            
            {/* Showcase Layout - Mobile */}
            <div className="grid md:hidden grid-cols-2 gap-3">
              {products.slice(0, 4).map((product) => renderSingleProductCard(product, 'sm'))}
            </div>

            {/* Showcase Layout - Desktop */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              {/* Featured Large Item */}
              <div
                className={cn("relative group overflow-hidden cursor-pointer min-h-[450px] border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-end", cardRadiusClassName)}
                style={{ backgroundColor: `${secondary}05` }}
              >
                <Link href={getProductDetailHref(showcaseFeatured)} className="absolute inset-0 z-10">
                  <ProductImageWithOverlay className="absolute inset-0" frameConfig={frameConfig} watermarkConfig={watermarkConfig}>
                    {showcaseFeatured?.image ? (
                      <Image
                        mode="thumb"
                        src={showcaseFeatured.image}
                        alt={showcaseFeatured.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100"><Package size={64} className="text-slate-300" /></div>
                    )}
                  </ProductImageWithOverlay>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent z-20" />
                </Link>
                {showcaseDiscount && (
                  <div className="absolute top-4 left-4 z-30">
                    <SaleBadge text={showcaseDiscount} className="text-sm px-3 py-1" />
                  </div>
                )}
                <div className="relative p-6 w-full z-30">
                  <BrandBadge text="Nổi bật" variant="solid" brandColor={brandColor} secondary={secondary} className="mb-2" />
                  <Link href={getProductDetailHref(showcaseFeatured)}>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2 hover:opacity-85 transition-colors">{showcaseFeatured?.name}</h3>
                  </Link>
                  <div className="flex flex-col gap-3">
                    <span className="text-xl font-bold text-white line-clamp-1">{showcasePriceDisplay?.label ?? ''}</span>
                    {showAddToCartButton || showBuyNowButton ? (
                      <ProductCardActions
                        product={showcaseFeatured as any}
                        tokens={adaptTokensForDarkMode({
                          ...tokens,
                          primaryActionBg: brandColor,
                          primaryActionText: '#ffffff',
                          secondaryActionBorder: 'rgba(255,255,255,0.4)',
                          secondaryActionText: '#ffffff',
                          secondaryActionHoverBg: 'rgba(255,255,255,0.1)',
                        }, isDark ?? false)}
                        showStock={showStock}
                        showAddToCartButton={showAddToCartButton}
                        showBuyNowButton={showBuyNowButton}
                        buyNowLabel="Mua ngay"
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        cartButtonsLayout={cartButtonsLayout}
                      />
                    ) : (
                      <Link href={getProductDetailHref(showcaseFeatured)} className="h-9 px-4 rounded-lg text-white text-sm font-medium shrink-0 inline-flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                        Xem chi tiết
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-3">
                {showcaseOthers.map((product) => renderSingleProductCard(product))}
              </div>
            </div>
          </div>
        </section>
        {renderQuickAddModal()}
      </>
    );
  }

  // Style 7: Tabbed — Category tabs + product grid trên nền brand color
  if (style === 'tabbed') {
    // Lấy danh mục từ sản phẩm
    const productCategories = React.useMemo(() => {
      const catMap = new Map<string, string>();
      for (const p of products) {
        if (p.categoryId && categorySlugMap.has(p.categoryId)) {
          const slug = categorySlugMap.get(p.categoryId);
          if (slug) {
            // Tìm tên category từ categories query
            const cat = categories?.find(c => c._id === p.categoryId);
            if (cat) {catMap.set(p.categoryId, cat.name);}
          }
        }
      }
      return [...catMap.entries()].slice(0, 5);
    }, [products, categorySlugMap, categories]);

    const displayTabs = productCategories.length > 0
      ? productCategories.map(([, name]) => name)
      : ['Tất cả'];

    return (
      <>
        <section
          className={cn(sectionSpacingClassName, 'px-4 md:px-6 rounded-xl')}
          style={{ backgroundColor: brandColor }}
        >
          <div className="max-w-7xl mx-auto">
            {renderSiteHeader()}
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {displayTabs.map((tab, idx) => (
                <button
                  key={tab}
                  type="button"
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${
                    idx === 0
                      ? 'text-slate-900'
                      : 'border text-white hover:bg-white/10'
                  }`}
                  style={
                    idx === 0
                      ? { backgroundColor: secondary }
                      : { borderColor: 'rgba(255,255,255,0.3)' }
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {products.slice(0, 10).map((product) => renderSingleProductCard(product))}
            </div>

            {/* View all */}
            {showViewAll && (
              <div className="flex justify-center mt-8">
                <Link
                  href="/products"
                  className="px-10 py-3 rounded-full text-sm font-bold bg-white text-slate-900 hover:bg-slate-50 transition-colors shadow-md"
                >
                  Xem tất cả
                </Link>
              </div>
            )}
          </div>
        </section>
        {renderQuickAddModal()}
      </>
    );
  }

  // Style 8: Lookbook / Banner Collection — 3 Columns Portrait Cards
  if (style === 'lookbook') {
    return (
      <>
      <section
        className={cn("bg-transparent", sectionSpacingClassName)}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="mx-auto w-full max-w-[1440px] px-3">
          {renderSiteHeader({ className: 'mb-6 md:mb-8' })}
          <div className={cn(
            "-mx-3 grid gap-y-6 text-left",
            lookbookDesktopColumns === 3
              ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4',
          )}>
            {products.slice(0, Math.min(itemCount, lookbookDesktopColumns)).map((product, index) => {
              const banner = PRODUCT_LIST_LOOKBOOK_BANNERS[index];
              const image = product.image ?? banner?.image;
              const hoverImage = product.image ? product.image : (banner?.hoverImage ?? image);
              const imageAlt = product.name || banner?.title || '';
              const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
              const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
              const isActive = activeLookbookId === product._id;
              return (
                <div key={product._id} className="relative w-full px-3 text-left">
                  <Link
                    href={getProductDetailHref(product)}
                    title={imageAlt}
                    className={cn("group block bg-white", cardRadiusClassName)}
                    style={{ borderColor: `${secondary}26` }}
                    onClick={(event) => {
                      if (typeof window === 'undefined' || !window.matchMedia('(hover: none)').matches || isActive) {
                        return;
                      }
                      event.preventDefault();
                      setActiveLookbookId(product._id);
                    }}
                  >
                    <div className="relative isolate aspect-[380/460] overflow-visible [perspective:2500px]">
                      <div
                        className={cn(
                          "relative h-full w-full overflow-hidden bg-white shadow-sm transition duration-500",
                          "group-hover:[transform:perspective(900px)_translateY(-5%)_rotateX(25deg)_translateZ(0)] group-hover:shadow-[2px_35px_32px_-8px_rgba(0,0,0,0.55)]",
                          isActive && "[transform:perspective(900px)_translateY(-5%)_rotateX(25deg)_translateZ(0)] shadow-[2px_35px_32px_-8px_rgba(0,0,0,0.55)]",
                          imageRadiusClassName,
                        )}
                      >
                        <ProductImageWithOverlay className="absolute inset-0" frameConfig={frameConfig} watermarkConfig={watermarkConfig}>
                          {image ? (
                            <Image
                              mode="thumb"
                              src={image}
                              alt={imageAlt}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className={cn("object-cover transition duration-500 group-hover:brightness-95", isActive && "brightness-95")}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                              <Package size={48} className="text-slate-300" />
                            </div>
                          )}
                        </ProductImageWithOverlay>
                        <div className={cn("absolute inset-0 z-10 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-70 transition duration-500 group-hover:opacity-0", isActive && "opacity-0")} />
                        <div className={cn("absolute inset-0 z-10 bg-white opacity-0 transition duration-500 group-hover:opacity-100", isActive && "opacity-100")} />
                        {discount && (
                          <div className="absolute right-3 top-3 z-20">
                            <SaleBadge text={discount} className="text-[11px] px-3 py-1 font-bold shadow-lg" />
                          </div>
                        )}
                        <div className={cn("absolute inset-x-0 bottom-0 z-20 space-y-2 p-4 text-center transition duration-500 group-hover:translate-y-1", isActive && "translate-y-1")}>
                          {product.categoryId ? (
                            <div className={cn("text-[11px] font-semibold uppercase tracking-wide text-white/70 transition-colors duration-500 group-hover:text-slate-500", isActive && "text-slate-500")}>
                              Sản phẩm
                            </div>
                          ) : null}
                          <h3 className={cn("line-clamp-2 text-base font-bold leading-snug text-white transition-colors duration-500 group-hover:text-slate-900", isActive && "text-slate-900")}>
                            {product.name}
                          </h3>
                          <div className="flex flex-wrap items-baseline justify-center gap-2">
                            <span className="text-base font-bold" style={{ color: brandColor }}>
                              {priceDisplay.label}
                            </span>
                            {priceDisplay.comparePrice && (
                              <span className={cn("text-xs text-white/55 line-through transition-colors duration-500 group-hover:text-slate-400", isActive && "text-slate-400")}>
                                {formatComparePrice(priceDisplay.comparePrice)}
                              </span>
                            )}
                          </div>
                          {/* Chỉ show nút Xem chi tiết khi không có cart mode */}
                          {(!showAddToCartButton && !showBuyNowButton) && (
                            <div className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-bold text-white shadow-lg transition duration-300 group-hover:scale-105" style={{ backgroundColor: secondary }}>
                              Xem chi tiết <ArrowRight size={14} className="ml-1.5" />
                            </div>
                          )}
                        </div>
                      </div>
                      {hoverImage && (
                        <Image
                          mode="thumb"
                          src={hoverImage}
                          alt={imageAlt}
                          width={619}
                          height={460}
                          sizes="(max-width: 768px) 70vw, (max-width: 1024px) 35vw, 24vw"
                          className={cn(
                            "pointer-events-none absolute bottom-[19%] left-1/2 z-30 w-[95%] max-w-none -translate-x-1/2 translate-y-6 object-contain opacity-0 drop-shadow-2xl transition duration-500 group-hover:-translate-y-[22%] group-hover:scale-110 group-hover:opacity-100",
                            isActive && "-translate-y-[22%] scale-110 opacity-100",
                          )}
                        />
                      )}
                    </div>
                  </Link>

                  {/* Cart buttons bên ngoài Link/card 3D — gọn, dễ nhìn */}
                  {(showAddToCartButton || showBuyNowButton) && (
                    <div className="mt-0.5 px-1">
                      <ProductCardActions
                        product={product as any}
                        tokens={tokens}
                        showStock={showStock}
                        showAddToCartButton={showAddToCartButton}
                        showBuyNowButton={showBuyNowButton}
                        buyNowLabel="Mua ngay"
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        cartButtonsLayout={cartButtonsLayout}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {renderQuickAddModal()}
      </>
    );
  }

  // Style 3: Bento Grid - Asymmetric layout với hero card lớn (default)
  const featured = products.at(-1) ?? products[0];
  const others = products.slice(0, 4);
  const featuredPriceDisplay = featured
    ? getPriceDisplay(featured.price, featured.salePrice, featured.hasVariants)
    : null;
  const featuredDiscount = getDiscount(featured?.price, featuredPriceDisplay?.comparePrice, featuredPriceDisplay?.isContactPrice);

  return (
    <section className={cn(sectionSpacingClassName, 'px-4 md:px-6')}>
      <div className="max-w-7xl mx-auto">
        {renderSiteHeader()}
        
        {/* Bento Grid - Desktop */}
        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-4 h-auto">
          {/* Hero Item (Span 2x2) */}
          <div
            className={cn("col-span-2 row-span-2 relative group overflow-hidden cursor-pointer min-h-[400px] border border-transparent hover:border-slate-300 transition-colors", cardRadiusClassName)}
            style={{ ...imageAspectRatioStyle, backgroundColor: `${secondary}10` }}
          >
            <Link href={getProductDetailHref(featured)} className="absolute inset-0 z-10" tabIndex={-1} aria-hidden />
            <ProductImageWithOverlay className="absolute inset-0" frameConfig={frameConfig} watermarkConfig={watermarkConfig}>
              {featured?.image ? (
                <Image
                  mode="thumb"
                  src={featured.image}
                  alt={featured.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100">
                  <Package size={64} className="text-slate-300" />
                </div>
              )}
            </ProductImageWithOverlay>
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-20" />
            
            {/* Discount Badge */}
            {featuredDiscount && (
              <div className="absolute top-4 right-4 z-30">
                <SaleBadge text={featuredDiscount} className="text-sm px-3 py-1" />
              </div>
            )}

            <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full z-30">
              <Link href={getProductDetailHref(featured)}>
                <h3 className="text-2xl md:text-4xl font-bold mb-2 leading-tight text-white hover:opacity-85 transition-colors">{featured?.name}</h3>
              </Link>
              <span className="text-2xl font-bold text-white block mb-3">{featuredPriceDisplay?.label ?? ''}</span>
              
              {showAddToCartButton || showBuyNowButton ? (
                <div className="flex gap-2">
                  {showAddToCartButton && (
                    <button
                      type="button"
                      className="flex-1 rounded-full py-2 px-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 whitespace-nowrap"
                      style={{ backgroundColor: brandColor }}
                      onClick={(e) => { e.stopPropagation(); void handleAddToCart(featured); }}
                    >
                      Thêm giỏ
                    </button>
                  )}
                  {showBuyNowButton && (
                    <button
                      type="button"
                      className="flex-1 rounded-full py-2 px-3 text-sm font-bold text-slate-900 bg-white/90 hover:bg-white shadow-lg transition-all whitespace-nowrap"
                      onClick={(e) => { e.stopPropagation(); handleBuyNow(featured); }}
                    >
                      Mua ngay
                    </button>
                  )}
                </div>
              ) : (
                <Link
                  href={getProductDetailHref(featured)}
                  className="inline-block rounded-full px-6 py-2 text-white border-0 shadow-lg hover:opacity-90 transition-colors"
                  style={{ backgroundColor: brandColor, boxShadow: `0 4px 6px ${brandColor}20` }}
                >
                  Xem chi tiết
                </Link>
              )}
            </div>
          </div>

          {/* Small Grid Items */}
          {others.slice(0, 4).map((product) => renderSingleProductCard(product))}
        </div>

        {/* Mobile: 2x2 simple grid */}
        <div className="grid md:hidden grid-cols-2 gap-3">
          {products.slice(0, 4).map((product) => renderSingleProductCard(product, 'sm'))}
        </div>
      </div>

      {renderQuickAddModal()}
    </section>
  );
}
