'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ArrowRight, Loader2, Package } from 'lucide-react';
import { SaleBadge } from '@/components/site/shared/BrandColorHelpers';
import { ProductImageWithOverlay, useProductImageOverlayConfigs } from '@/components/shared/ProductImageWithOverlay';
import { getPublicPriceLabel } from '@/lib/products/public-price';
import { getProductImageAspectRatioCssValue, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { useSnapshotDemoContext } from '@/components/modules/homepage/SnapshotDemoProvider';
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { getSectionSpacingClassName, normalizeSectionSpacing } from '@/app/admin/home-components/_shared/types/sectionSpacing';
import { cn } from '@/app/admin/components/ui';
import { getProductListCardRadiusClassName, getProductListImageRadiusClassName, normalizeProductListCardRadius } from '@/app/admin/home-components/product-list/_types';
import { resolveGridStyle } from '@/app/admin/home-components/product-grid/_lib/constants';

import { notifyAddToCart, useCart } from '@/lib/cart';
import { useCartConfig } from '@/lib/experiences';
import { getProductsListColors } from '@/components/site/products/colors';
import { ProductCardActions } from '@/components/site/shared/ProductCardActions';
import { QuickAddVariantModal } from '@/components/products/QuickAddVariantModal';
import { CategoryTabSlider } from '@/components/shared/CategoryTabSlider';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';


interface ProductGridSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode?: 'single' | 'dual';
  title: string;
  snapshotComponentKey?: string;
  isDark?: boolean;
}

export function ProductGridSection({ config, brandColor, secondary, mode, title, snapshotComponentKey, isDark }: ProductGridSectionProps) {
  const snapshotDemo = useSnapshotDemoContext();
  const style = resolveGridStyle(config.style as string | undefined);
  const desktopColumns: 3 | 4 | 5 | 6 = (config.desktopColumns === 3 || config.desktopColumns === 5 || config.desktopColumns === 6) ? config.desktopColumns : 4;
  const desktopRows = (config.desktopRows as number) || 2;
  const selectionMode = (config.selectionMode as 'category' | 'auto' | 'manual' | 'demo') || 'category';
  const itemCount = selectionMode === 'category' || selectionMode === 'auto'
    ? (desktopColumns * desktopRows)
    : ((config.itemCount as number) || 8);

  const sectionSpacingClassName = getSectionSpacingClassName(config.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(config.spacing));
  const cardRadius = normalizeProductListCardRadius(config.cornerRadius ?? config.cardRadius, config.noBorderRadius);
  const cardRadiusClassName = getProductListCardRadiusClassName(cardRadius);
  const imageRadiusClassName = getProductListImageRadiusClassName(cardRadius);

  // Responsive grid class based on desktopColumns
  const gridColsClass = desktopColumns === 3
    ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3'
    : desktopColumns === 5
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
      : desktopColumns === 6
        ? 'grid-cols-3 md:grid-cols-3 lg:grid-cols-6'
        : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4';

  const selectedProductIds = React.useMemo(() => (config.selectedProductIds as string[]) || [], [config.selectedProductIds]);
  const demoProducts = React.useMemo(() => (config.demoProducts as Array<{ id: string; name: string; image?: string; price?: string; originalPrice?: string; description?: string; category?: string; tag?: string }>) || [], [config.demoProducts]);

  // Category tabs config
  const showCategoryTabs = config.showCategoryTabs !== false; // default true
  const categoryTabIds = React.useMemo(() => (config.categoryTabIds as string[]) || [], [config.categoryTabIds]);
  const [activeTabId, setActiveTabId] = React.useState<string | null>(null);

  const headerConfig = extractSectionHeaderConfig({
    ...config,
    badgeText: config.badgeText ?? 'Bộ sưu tập',
    subtitle: config.subtitle ?? title,
  });
  const displayTitle = title;

  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const categories = useQuery(api.productCategories.listActive);
  const saleMode = React.useMemo<'cart' | 'contact' | 'affiliate'>(() => {
    const value = saleModeSetting?.value;
    if (value === 'contact' || value === 'affiliate') return value;
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
    if (!snapshotDemo || !snapshotComponentKey) return null;
    const data = snapshotDemo.getComponentData(snapshotComponentKey);
    return data?.kind === 'product-list' ? data : null;
  }, [snapshotDemo, snapshotComponentKey]);
  const routeMode = React.useMemo(
    () => normalizeRouteMode(snapshotData?.settings?.iaRouteMode ?? routeModeSetting),
    [routeModeSetting, snapshotData?.settings]
  );
  const categorySlugMap = React.useMemo(() => {
    if (snapshotData) {
      return new Map(snapshotData.categories.map((c) => [c.id, c.slug ?? '']));
    }
    if (!categories) return new Map<string, string>();
    return new Map(categories.map((c) => [c._id, c.slug]));
  }, [categories, snapshotData]);
  const categoryNameMap = React.useMemo(() => {
    if (!categories) return new Map<string, string>();
    return new Map(categories.map((c) => [c._id, c.name]));
  }, [categories]);
  const getProductDetailHref = React.useCallback((product?: { slug?: string | null; categoryId?: string }) => {
    if (!product?.slug) return '/products';
    return buildDetailPath({
      categorySlug: product.categoryId ? categorySlugMap.get(product.categoryId) : undefined,
      mode: routeMode,
      moduleKey: 'products',
      recordSlug: product.slug,
    });
  }, [categorySlugMap, routeMode]);
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs(imageAspectRatio);

  const showAddToCartButton = config.showAddToCartButton !== false;
  const showBuyNowButton = config.showBuyNowButton !== false;
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

  // Query products based on selection mode
  // Nếu chọn theo danh mục: query các sản phẩm có category nằm trong config. categoryTabIds (hoặc activeTabId).
  // Để tối ưu và nhất quán, storefront query tối đa 50 sản phẩm public để hiển thị.
  const categoryProductsData = useQuery(
    api.products.listProductsForCategories,
    selectionMode === 'category' && categoryTabIds.length > 0 ? { categoryIds: categoryTabIds as Id<"productCategories">[] } : 'skip'
  );

  const publicProductsData = useQuery(
    api.products.listPublicResolved,
    selectionMode === 'demo' || selectionMode === 'manual' || selectionMode === 'category' ? 'skip' : { limit: 50 }
  );

  const productsData = selectionMode === 'category' ? categoryProductsData : publicProductsData;

  const manualProductsData = useQuery(
    api.products.listByIds,
    selectionMode === 'manual' && selectedProductIds.length > 0 ? { ids: selectedProductIds as Id<'products'>[] } : 'skip'
  );

  // Resolve products
  const allProducts = React.useMemo(() => {
    if (selectionMode === 'demo' && demoProducts.length > 0) {
      const parseDemoPrice = (s?: string) => {
        if (!s) return undefined;
        const n = Number.parseInt(s.replaceAll(/\D/g, ''));
        return Number.isFinite(n) ? n : undefined;
      };
      return demoProducts.map((item) => {
        const parsed = parseDemoPrice(item.price);
        const parsedOriginal = parseDemoPrice(item.originalPrice);
        const hasSale = parsedOriginal != null && parsed != null && parsedOriginal > parsed;
        return {
          _id: item.id,
          categoryId: item.category ?? '',
          categoryName: item.category ?? '',
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
        categoryName: categoryNameMap.get(item.categoryId ?? '') ?? '',
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
      if (!manualProductsData) return [];
      const productMap = new Map(manualProductsData.map(p => [p._id, p]));
      return selectedProductIds
        .map(id => productMap.get(id as Id<"products">))
        .filter((p): p is NonNullable<typeof p> => p !== undefined && p.status === 'Active')
        .map(p => ({ ...p, categoryName: categoryNameMap.get(p.categoryId ?? '') ?? '' }));
    }

    if (!productsData) return [];

    // Lọc theo chế độ 'category' (chỉ lấy các sản phẩm thuộc danh mục được chọn)
    if (selectionMode === 'category') {
      if (!productsData) return [];
      return productsData.map(p => ({
        ...p,
        categoryName: categoryNameMap.get(p.categoryId ?? '') ?? ''
      }));
    }

    return productsData
      .filter(p => p.status === 'Active')
      .map(p => ({ ...p, categoryName: categoryNameMap.get(p.categoryId ?? '') ?? '' }));
  }, [productsData, manualProductsData, selectionMode, selectedProductIds, itemCount, snapshotData, demoProducts, categoryNameMap, categoryTabIds]);

  // Category tabs to render: Lọc theo danh mục hoặc Tự động gôm tab
  const displayTabs = React.useMemo(() => {
    if (!showCategoryTabs) return [];
    
    // Chế độ lọc theo danh mục
    if (selectionMode === 'category') {
      if (categoryTabIds.length > 0 && categories) {
        return categoryTabIds
          .map(id => categories.find(c => c._id === id))
          .filter(Boolean)
          .map(c => ({ id: c!._id, name: c!.name }));
      }
      if (categories) {
        return categories.map(c => ({ id: c._id, name: c.name }));
      }
    }
    
    // Demo mode: derive tabs from product categories
    if (selectionMode === 'demo') {
      const uniqueCats = [...new Set(demoProducts.map(p => p.category).filter(Boolean))] as string[];
      return uniqueCats.slice(0, 5).map(name => ({ id: name, name }));
    }

    // Chế độ Chọn thủ công hoặc Tự động: Quét và gôm tab tự động từ các sản phẩm được chọn
    if (allProducts && allProducts.length > 0) {
      const uniqueCats = [...new Set(allProducts.map(p => p.categoryName).filter(Boolean))] as string[];
      return uniqueCats.map(name => {
        const catId = categories?.find(c => c.name === name)?._id ?? name;
        return { id: catId, name };
      });
    }

    return [];
  }, [showCategoryTabs, selectionMode, categoryTabIds, categories, demoProducts, allProducts]);

  // Filter products by active tab
  const products = React.useMemo(() => {
    const source = activeTabId 
      ? allProducts.filter(p => p.categoryId === activeTabId || p.categoryName === activeTabId)
      : allProducts;
    return source.slice(0, itemCount);
  }, [allProducts, activeTabId, itemCount]);

  const showViewAll = allProducts.length >= 3;

  // Loading state
  const isLoading = selectionMode !== 'demo' && !snapshotData && (
    (selectionMode === 'manual' && manualProductsData === undefined) ||
    ((selectionMode === 'auto' || selectionMode === 'category') && productsData === undefined)
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

  const renderEmptyCategoryState = () => (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <Package size={44} className="mx-auto mb-4 text-slate-300 animate-bounce" />
      <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Chưa có sản phẩm nào trong mục này</p>
      <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">Chúng tôi đang cập nhật các sản phẩm mới nhất. Vui lòng quay lại sau hoặc khám phá các sản phẩm khác.</p>
      <Link 
        href="/products"
        className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
        style={{ backgroundColor: brandColor }}
      >
        Khám phá sản phẩm khác
      </Link>
    </div>
  );

  if (allProducts.length === 0) {
    return (
      <section className={cn(sectionSpacingClassName, 'px-4')}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-4">{title}</h2>
          {renderEmptyCategoryState()}
        </div>
      </section>
    );
  }

  // Price helpers
  const isDemo = selectionMode === 'demo';
  const getPriceDisplay = (price?: number, salePrice?: number, isRangeFromVariant?: boolean) =>
    getPublicPriceLabel({ saleMode: isDemo ? 'cart' : saleMode, price, salePrice, isRangeFromVariant });
  const formatComparePrice = (price?: number) =>
    price ? getPublicPriceLabel({ saleMode: 'cart', price }).label : '';
  const getDiscount = (currentPrice?: number, comparePrice?: number, isContactPrice?: boolean) => {
    if (isContactPrice || !currentPrice || !comparePrice || comparePrice <= currentPrice) return null;
    return `-${Math.round(((comparePrice - currentPrice) / comparePrice) * 100)}%`;
  };

  // Category tabs (pill style — for non-minimal layouts)
  const renderCategoryTabs = () => {
    if (displayTabs.length === 0) return null;
    return (
      <div className="mb-4">
        <CategoryTabSlider
          tabs={displayTabs}
          activeTabId={activeTabId}
          onTabChange={(tabId) => setActiveTabId(tabId === activeTabId ? null : tabId)}
          brandColor={brandColor}
          showAllTab={false}
          allTabLabel="Tất cả"
        />
      </div>
    );
  };

  // Header for E-commerce/minimal layout: header on top (full width), tabs below (right-aligned)
  const renderMinimalHeader = () => {
    return (
      <div className="mb-6 md:mb-10">
        {!headerConfig.hideHeader && (
          <SectionHeader title={displayTitle} brandColor={brandColor} {...headerConfig} className="mb-0" />
        )}
        {displayTabs.length > 0 && (
          <div className="flex justify-end mt-4 max-w-[280px] md:max-w-[420px] ml-auto overflow-hidden">
            <CategoryTabSlider
              tabs={displayTabs}
              activeTabId={activeTabId}
              onTabChange={(tabId) => setActiveTabId(tabId === activeTabId ? null : tabId)}
              brandColor={brandColor}
              showAllTab={false}
              allTabLabel="Tất cả"
            />
          </div>
        )}
      </div>
    );
  };

  // Header
  const renderSiteHeader = () => {
    if (headerConfig.hideHeader) return null;
    return (
      <div className="mb-6 md:mb-10">
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

  // Product card — reusable across layouts
  const renderProductCard = (product: typeof products[0], opts?: { size?: 'sm' | 'md' | 'lg'; showButton?: boolean }) => {
    const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
    const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
    const size = opts?.size ?? 'md';
    const href = getProductDetailHref(product);

    return (
      <div
        key={product._id}
        className={cn(`group bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col`, 
          size === 'sm' ? 'p-2' : '',
          cardRadiusClassName
        )}
      >
        {/* Image Link */}
        <Link href={href} className="block relative bg-slate-100 overflow-hidden" style={imageAspectRatioStyle}>
          <ProductImageWithOverlay
            frameConfig={frameConfig}
            watermarkConfig={watermarkConfig}
            className={cn("w-full h-full", imageRadiusClassName)}
          >
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
                <Package size={size === 'sm' ? 24 : 40} className="text-slate-300" />
              </div>
            )}
            {discount && (
              <div className="absolute top-2 left-2 z-30">
                <SaleBadge text={discount} className="text-[10px] px-2 py-0.5" />
              </div>
            )}
          </ProductImageWithOverlay>
          {/* Hover CTA for minimal when no button configured */}
          {size === 'md' && !(showAddToCartButton || showBuyNowButton) && (
            <div className="absolute inset-x-4 bottom-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 z-30">
              <span className="block w-full bg-white/95 hover:bg-white backdrop-blur-md shadow-lg font-bold py-2 px-4 rounded-lg text-sm text-center" style={{ color: brandColor }}>
                Xem chi tiết
              </span>
            </div>
          )}
        </Link>

        {/* Info */}
        <div className={cn("p-3 flex flex-col flex-1", size === 'sm' ? 'p-2' : 'p-3 md:p-4')}>
          <Link href={href} className="block flex-1">
            <h3 className={cn("font-bold text-slate-900 line-clamp-2 mb-1 group-hover:opacity-80 transition-colors", size === 'sm' ? 'text-xs' : 'text-sm')}>
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 mb-3">
              <span className={cn("font-bold", size === 'sm' ? 'text-xs' : 'text-sm')} style={{ color: brandColor }}>{priceDisplay.label}</span>
              {priceDisplay.comparePrice && (
                <span className={cn("text-slate-400 line-through", size === 'sm' ? 'text-[10px]' : 'text-xs')}>
                  {formatComparePrice(priceDisplay.comparePrice)}
                </span>
              )}
            </div>
          </Link>

        {/* Buttons */}
        {showAddToCartButton || showBuyNowButton ? (
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
        ) : opts?.showButton ? (
          <Link
            href={href}
            className="w-full gap-1.5 border-2 py-1.5 px-4 rounded-lg font-medium flex items-center justify-center transition-colors hover:bg-opacity-10 whitespace-nowrap text-xs md:text-sm"
            style={{ borderColor: `${brandColor}30`, color: brandColor }}
          >
            Xem chi tiết <ArrowRight className="w-3 h-3 flex-shrink-0" />
          </Link>
        ) : null}
      </div>
    </div>
  );
};

  // ── Layout Renders ──

  const renderMinimalGrid = () => (
    <>
      <div className={`grid ${desktopColumns === 3 ? 'grid-cols-1 md:grid-cols-3' : desktopColumns === 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : desktopColumns === 6 ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'} gap-3 md:gap-4 lg:gap-5`}>
        {products.slice(0, itemCount).map(p => renderProductCard(p, { size: 'lg', showButton: true }))}
      </div>

      {/* "Xem thêm" button — dark bg */}
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
    </>
  );

  const renderCommerceGrid = () => (
    <div className={`grid ${gridColsClass} gap-4 md:gap-6`}>
      {products.slice(0, itemCount).map(p => renderProductCard(p, { size: 'lg', showButton: true }))}
    </div>
  );

  const renderCompactGrid = () => (
    <div className={`grid ${gridColsClass} gap-3`}>
      {products.slice(0, itemCount).map(p => renderProductCard(p, { size: 'sm' }))}
    </div>
  );

  const renderMagazineGrid = () => {
    // Magazine: editorial overlay cards — image fills card, gradient + text overlay
    return (
      <div className={`grid ${gridColsClass} gap-4 md:gap-5`}>
        {products.slice(0, itemCount).map(p => {
          const pd = getPriceDisplay(p.price, p.salePrice, p.hasVariants);
          const d = getDiscount(p.price, pd.comparePrice, pd.isContactPrice);
          const href = getProductDetailHref(p);
          return (
            <div
              key={p._id}
              className={cn('group relative rounded-2xl overflow-hidden border border-slate-100 flex flex-col', cardRadiusClassName)}
              style={{ ...imageAspectRatioStyle }}
            >
              <Link
                href={href}
                className="absolute inset-0 block w-full h-full"
              >
                {p.image ? (
                  <Image mode="thumb" src={p.image} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100"><Package size={40} className="text-slate-300" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-20" />
                {d && (
                  <div className="absolute top-2 left-2 z-30"><SaleBadge text={d} className="text-[10px] px-2 py-0.5" /></div>
                )}
                <div className={cn("absolute bottom-0 left-0 right-0 p-3 md:p-4 z-30", (showAddToCartButton || showBuyNowButton) ? "pb-16" : "")}>
                  <h3 className="text-sm md:text-base font-bold text-white truncate mb-1">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{pd.label}</span>
                    {pd.comparePrice && <span className="text-[10px] text-white/60 line-through">{formatComparePrice(pd.comparePrice)}</span>}
                  </div>
                </div>
              </Link>
              
              {showAddToCartButton || showBuyNowButton ? (
                <div className="absolute bottom-3 left-3 right-3 z-40">
                  <ProductCardActions
                    product={p as any}
                    tokens={{
                      ...tokens,
                      primaryActionBg: brandColor,
                      primaryActionText: '#ffffff',
                      secondaryActionBorder: 'rgba(255,255,255,0.4)',
                      secondaryActionText: '#ffffff',
                      secondaryActionHoverBg: 'rgba(255,255,255,0.1)',
                    }}
                    showStock={showStock}
                    showAddToCartButton={showAddToCartButton}
                    showBuyNowButton={showBuyNowButton}
                    buyNowLabel="Mua ngay"
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    cartButtonsLayout={cartButtonsLayout}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCatalogGrid = () => (
    <div className={`grid ${gridColsClass} gap-4 md:gap-6`}>
      {products.slice(0, itemCount).map(p => renderProductCard(p, { size: 'lg', showButton: true }))}
    </div>
  );

  const renderMosaicGrid = () => {
    // Mosaic: padded cards with hover arrow icon
    return (
      <div className={`grid ${gridColsClass} gap-3 md:gap-4`}>
        {products.slice(0, itemCount).map(p => {
          const pd = getPriceDisplay(p.price, p.salePrice, p.hasVariants);
          const d = getDiscount(p.price, pd.comparePrice, pd.isContactPrice);
          const href = getProductDetailHref(p);
          return (
            <div
              key={p._id}
              className={cn('bg-white border border-slate-200 rounded-2xl p-3 flex flex-col group hover:shadow-lg hover:border-slate-300 transition-all overflow-hidden', cardRadiusClassName)}
            >
              <Link href={href} className="block">
                <ProductImageWithOverlay
                  frameConfig={frameConfig}
                  watermarkConfig={watermarkConfig}
                  className={cn('relative w-full rounded-xl overflow-hidden mb-3', imageRadiusClassName)}
                  style={{ ...imageAspectRatioStyle, backgroundColor: `${secondary}08` }}
                >
                  {p.image ? (
                    <Image mode="thumb" src={p.image} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Package size={32} className="text-slate-300" /></div>
                  )}
                  {d && <div className="absolute top-2 left-2 z-30"><SaleBadge text={d} className="text-[10px] px-1.5 py-0.5" /></div>}
                  {!(showAddToCartButton || showBuyNowButton) && (
                    <div className="absolute bottom-2 right-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-30">
                      <div className="text-white p-2 rounded-full shadow-lg" style={{ backgroundColor: brandColor }}><ArrowRight size={16} /></div>
                    </div>
                  )}
                </ProductImageWithOverlay>
              </Link>
              <div className="mt-auto px-1 flex-1 flex flex-col justify-between">
                <Link href={href} className="block mb-3">
                  <h4 className="font-medium text-sm text-slate-900 truncate group-hover:opacity-80 transition-colors">{p.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold" style={{ color: brandColor }}>{pd.label}</span>
                    {pd.comparePrice && <span className="text-[10px] text-slate-400 line-through">{formatComparePrice(pd.comparePrice)}</span>}
                  </div>
                </Link>

                {showAddToCartButton || showBuyNowButton ? (
                  <ProductCardActions
                    product={p as any}
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
            </div>
          );
        })}
      </div>
    );
  };

  const getTextOnBrand = (hex: string) => {
    const h = hex.replace('#', '');
    const r = Number.parseInt(h.slice(0, 2), 16) / 255;
    const g = Number.parseInt(h.slice(2, 4), 16) / 255;
    const b = Number.parseInt(h.slice(4, 6), 16) / 255;
    const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return (0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)) > 0.4 ? '#1e293b' : '#ffffff';
  };
  const textOnBrand = getTextOnBrand(brandColor);


  // Style 7: Tabbed — full-section with brand bg, category tabs, grid cards
  const renderTabbedSection = () => {
    return (
      <section
        className={cn(sectionSpacingClassName, 'px-4 md:px-6')}
        style={{ backgroundColor: brandColor }}
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader title={displayTitle} brandColor={brandColor} {...headerConfig} className="mb-6" />

          {/* Category tabs */}
          {displayTabs.length > 0 && (
            <div className="mb-6">
              <CategoryTabSlider
                tabs={displayTabs}
                activeTabId={activeTabId}
                onTabChange={(tabId) => setActiveTabId(tabId === activeTabId ? null : tabId)}
                brandColor={brandColor}
                brandBgColor={brandColor}
                showAllTab={false}
                allTabLabel="Tất cả"
              />
            </div>
          )}

          {/* Product grid — same card style as Catalog */}
          {products.length === 0 ? renderEmptyCategoryState() : (
            <div className={`grid ${gridColsClass} gap-3 md:gap-4`}>
              {products.slice(0, itemCount).map(p => renderProductCard(p, { size: 'lg', showButton: true }))}
            </div>
          )}

          {/* View all */}
          {showViewAll && products.length > 0 && (
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
        {renderQuickAddModal()}
      </section>
    );
  };

  // Tabbed style has its own full section (brand bg), so return early
  if (style === 'tabbed') {
    return renderTabbedSection();
  }

  // Style 8: Storefront — brand header bar + black category buttons
  const renderStorefrontSection = () => {
    return (
      <section className={cn(sectionSpacingClassName, 'px-4 md:px-6')}>
        <div className="max-w-7xl mx-auto">
          <SectionHeader title={displayTitle} brandColor={brandColor} {...headerConfig} className="mb-6" />

          {/* Header bar */}
          {displayTabs.length > 0 && (
            <div
              className="flex items-center gap-3 px-4 md:px-6 py-2 overflow-x-auto rounded-t-lg mb-4"
              style={{ backgroundColor: brandColor }}
            >
              <span className="font-bold text-sm whitespace-nowrap text-white" style={{ color: textOnBrand }}>Danh mục:</span>
              <div className="flex-1 overflow-hidden">
                <CategoryTabSlider
                  tabs={displayTabs}
                  activeTabId={activeTabId}
                  onTabChange={(tabId) => setActiveTabId(tabId === activeTabId ? null : tabId)}
                  brandColor={brandColor}
                  brandBgColor={brandColor}
                  showAllTab={false}
                  allTabLabel="Tất cả"
                />
              </div>
            </div>
          )}

          {/* Product grid — same card style as Catalog */}
          <div className="py-8">
          {products.length === 0 ? renderEmptyCategoryState() : (
            <div className={`grid ${gridColsClass} gap-4 md:gap-6`}>
              {products.slice(0, itemCount).map(p => renderProductCard(p, { size: 'lg', showButton: true }))}
            </div>
          )}

          {/* View more */}
          {showViewAll && products.length > 0 && (
            <div className="flex justify-center mt-8">
              <Link
                href="/products"
                className="px-10 py-3 rounded-full text-sm font-bold border-2 transition-colors hover:bg-opacity-10"
                style={{ borderColor: brandColor, color: brandColor }}
              >
                Xem thêm sản phẩm
              </Link>
            </div>
          )}
        </div>
        </div>
        {renderQuickAddModal()}
      </section>
    );
  };

  if (style === 'storefront') {
    return renderStorefrontSection();
  }

  const renderGrid = () => {
    if (products.length === 0) return renderEmptyCategoryState();

    switch (style) {
      case 'minimal': return renderMinimalGrid();
      case 'commerce': return renderCommerceGrid();
      case 'compact': return renderCompactGrid();
      case 'magazine': return renderMagazineGrid();
      case 'catalog': return renderCatalogGrid();
      case 'mosaic': return renderMosaicGrid();
      default: return renderCommerceGrid();
    }
  };

  return (
    <section className={cn(sectionSpacingClassName, 'px-4 md:px-6')}>
      <div className="max-w-7xl mx-auto">
        {style === 'minimal' ? renderMinimalHeader() : (
          <>
            {renderSiteHeader()}
            {renderCategoryTabs()}
          </>
        )}
        {renderGrid()}
      </div>

      {renderQuickAddModal()}
    </section>
  );
}
