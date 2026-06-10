import React from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { ProductImageWithOverlayAuto } from '@/components/shared/ProductImageWithOverlay';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { CATEGORY_PRODUCTS_STYLES } from '../_lib/constants';
import { getCategoryProductsColors } from '../_lib/colors';
import { ProductCardActions } from '@/components/site/shared/ProductCardActions';
import { getProductsListColors } from '@/components/site/products/colors';
import { getHomeComponentPriceLabel, resolveSaleMode } from '../../_shared/lib/productPrice';
import { getSectionSpacingClassName, normalizeSectionSpacing } from '../../_shared/types/sectionSpacing';
import { getProductImageAspectRatioCssValue, getProductImageAspectRatioLabel, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { QuickAddVariantModal } from '@/components/products/QuickAddVariantModal';
import type { Id } from '@/convex/_generated/dataModel';
import { buildPreviewQuickAddProduct, type PreviewQuickAddAction, type PreviewQuickAddProduct } from '../../_shared/lib/previewQuickAdd';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import type {
  CategoryProductsBrandMode,
  CategoryProductsConfig,
  CategoryProductsProduct,
  CategoryProductsSection,
  CategoryProductsStyle,
  DemoCategoryProductsSection,
} from '../_types';
import {
  getCategoryProductsCardRadiusClassName,
  getCategoryProductsImageRadiusClassName,
  getCategoryProductsPreviewGridClassName,
  normalizeCategoryProductsCornerRadius,
} from '../_types';

interface CategoryProductsPreviewProps {
  config: CategoryProductsConfig;
  brandColor: string;
  secondary: string;
  mode: CategoryProductsBrandMode;
  selectedStyle: CategoryProductsStyle;
  onStyleChange: (style: CategoryProductsStyle) => void;
  categoriesData: { _id: string; name: string; slug?: string; image?: string }[];
  productsData: CategoryProductsProduct[];
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export const CategoryProductsPreview = ({ 
  config, 
  brandColor: _brandColor, 
  secondary,
  mode,
  selectedStyle,
  onStyleChange, 
  categoriesData,
  productsData,
  fontStyle,
  fontClassName,
}: CategoryProductsPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const previewStyle = selectedStyle || 'grid';
  const setPreviewStyle = (s: string) =>{  onStyleChange(s as CategoryProductsStyle); };
  const colors = React.useMemo(
    () => adaptTokensForDarkMode(getCategoryProductsColors(_brandColor, secondary, mode), isDark),
    [_brandColor, secondary, mode, isDark]
  );
  const listTokens = React.useMemo(
    () => adaptTokensForDarkMode(getProductsListColors(_brandColor, secondary, mode || 'single'), isDark),
    [_brandColor, secondary, mode, isDark]
  );
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const saleMode = React.useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);
  const imageAspectRatio = React.useMemo(
    () => resolveProductImageAspectRatio(aspectRatioSetting?.value),
    [aspectRatioSetting?.value]
  );
  const imageAspectRatioStyle = React.useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  const imageAspectRatioLabel = React.useMemo(
    () => getProductImageAspectRatioLabel(imageAspectRatio),
    [imageAspectRatio]
  );
  const sectionSpacingClassName = getSectionSpacingClassName(normalizeSectionSpacing(config.spacing));
  const cornerRadius = normalizeCategoryProductsCornerRadius(config.cornerRadius);
  const cardRadiusClassName = getCategoryProductsCardRadiusClassName(cornerRadius);
  const imageRadiusClassName = getCategoryProductsImageRadiusClassName(cornerRadius);
  const [quickAddTarget, setQuickAddTarget] = React.useState<{ product: PreviewQuickAddProduct; action: PreviewQuickAddAction } | null>(null);
  const onPreviewAction = React.useCallback((item: CategoryProductsProduct | undefined, action: PreviewQuickAddAction) => {
    if (!item) {
      return;
    }
    const product = buildPreviewQuickAddProduct(item);
    if (!product.hasVariants || !product._id) {
      return;
    }
    setQuickAddTarget({ product, action });
  }, []);
  const quickAddModalProduct = React.useMemo(() => quickAddTarget
    ? { ...quickAddTarget.product, _id: quickAddTarget.product._id as Id<'products'> }
    : null, [quickAddTarget]);

  const resolvedSections = React.useMemo(() => {
    if (config.selectionMode === 'demo') {
      return ((config.demoSections ?? []) as DemoCategoryProductsSection[])
        .filter(section => section.categoryName.trim() || section.products.length > 0)
        .map((section, index) => ({
          category: {
            _id: section.id,
            image: section.categoryImage,
            name: section.categoryName || `Danh mục demo ${index + 1}`,
            slug: undefined,
          },
          categoryId: section.id,
          id: index,
          itemCount: section.products.length,
          products: section.products.map(product => ({
            _id: product.id,
            categoryId: section.id,
            hasVariants: false,
            image: product.image,
            name: product.name || 'Tên sản phẩm',
            price: product.price,
            salePrice: product.salePrice,
          })),
        }));
    }

    return config.sections
      .map((section) => {
        const category = categoriesData.find(c => c._id === section.categoryId);
        if (!category) {return null;}

        const products = productsData
          .filter(p => p.categoryId === section.categoryId)
          .slice(0, section.itemCount);

        return {
          ...section,
          category,
          products,
        };
      })
      .filter(Boolean) as (CategoryProductsSection & {
        category: { _id: string; name: string; slug?: string; image?: string };
        products: CategoryProductsProduct[];
      })[];
  }, [categoriesData, config.demoSections, config.sections, config.selectionMode, productsData]);

  const getGridCols = () => getCategoryProductsPreviewGridClassName(config.columnsDesktop, device);

  const getPriceDisplay = (price?: number, salePrice?: number, isRangeFromVariant?: boolean) =>
    getHomeComponentPriceLabel({ saleMode, price, salePrice, isRangeFromVariant });

  // Get info for PreviewWrapper based on style with image size recommendations
  const getPreviewInfo = () => {
    const sectionCount = resolvedSections.length;
    const totalProducts = resolvedSections.reduce((sum, s) => sum + s.products.length, 0);

    if (sectionCount === 0) {return 'Chưa có section nào';}

    switch (previewStyle) {
      case 'grid': {
        return `${sectionCount} section • ${totalProducts} SP • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'carousel': {
        return `${sectionCount} section • ${totalProducts} SP • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'cards': {
        return `${sectionCount} section • ${totalProducts} SP • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'bento': {
        return `${sectionCount} section • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'magazine': {
        return `${sectionCount} section • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'showcase': {
        return `${sectionCount} section • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'wine-grid': {
        return `${sectionCount} section • ${totalProducts} SP • Ảnh vuông contain`;
      }
      default: {
        return `${sectionCount} section • ${totalProducts} sản phẩm`;
      }
    }
  };

  // Empty State Component with brandColor
  const EmptyState = ({ message, size = 'normal' }: { message: string; size?: 'small' | 'normal' }) => (
    <div
      className={cn(
        'text-center rounded-xl flex flex-col items-center justify-center',
        size === 'small' ? 'py-6' : 'py-12'
      )}
      style={{ backgroundColor: colors.emptyStateBackground }}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center mb-3',
          size === 'small' ? 'w-12 h-12' : 'w-16 h-16'
        )}
        style={{ backgroundColor: colors.emptyStateIconBackground }}
      >
        <Package size={size === 'small' ? 24 : 32} style={{ color: colors.emptyStateIcon }} />
      </div>
      <p className="text-sm" style={{ color: colors.emptyStateText }}>{message}</p>
    </div>
  );

  const FramePreviewImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    return (
      <ProductImageWithOverlayAuto className="w-full h-full relative overflow-hidden">
        <PreviewImage src={src} alt={alt} className={className} />
      </ProductImageWithOverlayAuto>
    );
  };

  // Product Card Component with Equal Height (line-clamp + min-height)
  const ProductCard = ({ product }: { product: CategoryProductsProduct }) => {
    const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
    const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
    const cartButtonsLayout = config.cartButtonsLayout || 'stack';

    return (
      <div className="group cursor-pointer flex flex-col h-full bg-white border border-slate-200 p-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
        <div className={cn('overflow-hidden mb-2', imageRadiusClassName)} style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}>
          {product.image ? (
            <FramePreviewImage
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={24} style={{ color: colors.emptyStateIcon }} />
            </div>
          )}
        </div>
        <h4
          className={cn(
            'font-medium line-clamp-2',
            device === 'mobile' ? 'text-xs min-h-[2rem]' : 'text-sm min-h-[2.5rem]'
          )}
          style={{ color: colors.bodyText }}
        >
          {product.name || 'Tên sản phẩm'}
        </h4>
        <div className="flex flex-col mt-auto mb-2">
          {(() => {
            const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
            if (priceDisplay.comparePrice) {
              return (
                <>
                  <span className={cn('font-bold', device === 'mobile' ? 'text-xs' : 'text-sm')} style={{ color: colors.priceText }}>
                    {priceDisplay.label}
                  </span>
                  <span className="text-[10px] text-slate-400 line-through">
                    {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                  </span>
                </>
              );
            }
            return (
              <span className={cn('font-bold', device === 'mobile' ? 'text-xs' : 'text-sm')} style={{ color: colors.priceText }}>
                {priceDisplay.label}
              </span>
            );
          })()}
        </div>
        {(showAddToCartButton || showBuyNowButton) && (
          <div className="mt-auto">
            <ProductCardActions
              product={product as any}
              tokens={listTokens}
              showStock={false}
              showAddToCartButton={showAddToCartButton}
              showBuyNowButton={showBuyNowButton}
              buyNowLabel="Mua ngay"
              onAddToCart={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'addToCart')}
              onBuyNow={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'buyNow')}
              cartButtonsLayout={cartButtonsLayout}
              device={device}
            />
          </div>
        )}
      </div>
    );
  };

  // Style 1: Grid - Classic grid layout per section
  const renderGridStyle = () => (
    <div className={cn('w-full space-y-8 md:space-y-12', sectionSpacingClassName)}>
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => (
          <section key={section.id} className="px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2
                  className={cn(
                    'font-bold',
                    device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl'
                  )}
                  style={{ color: colors.heading }}
                >
                  {section.category.name}
                </h2>
                {config.showViewAll && (
                  <button
                    className="text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: colors.buttonBorder, color: colors.buttonText }}
                  >
                    Xem danh mục <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {section.products.length === 0 ? (
                <EmptyState message="Chưa có sản phẩm trong danh mục này" size="small" />
              ) : (
                <div className={cn('grid gap-4', getGridCols())}>
                  {section.products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );

  // Style 2: Carousel - Embla carousel per section
  const CarouselSection = ({ section }: { section: typeof resolvedSections[number] }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
      align: 'start',
      dragFree: true,
      containScroll: 'trimSnaps',
    });
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    React.useEffect(() => {
      if (!emblaApi) { return; }
      const update = () => {
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
      };
      update();
      emblaApi.on('select', update);
      emblaApi.on('reInit', update);
      return () => { emblaApi.off('select', update); emblaApi.off('reInit', update); };
    }, [emblaApi]);

    return (
      <section>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2
              className={cn(
                'font-bold',
                device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl'
              )}
              style={{ color: colors.heading }}
            >
              {section.category.name}
            </h2>
            <div className="flex items-center gap-2">
              {config.showViewAll && (
                <button 
                  className="text-sm font-medium flex items-center gap-1"
                  style={{ color: colors.buttonText }}
                >
                  Xem danh mục <ArrowRight size={16} />
                </button>
              )}
              {(canScrollPrev || canScrollNext) && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Trước"
                    disabled={!canScrollPrev}
                    onClick={() => emblaApi?.scrollPrev()}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-all"
                    style={canScrollPrev
                      ? { backgroundColor: `${colors.sectionAccent}18`, color: colors.sectionAccent }
                      : { opacity: 0.3, color: colors.mutedText ?? '#94a3b8' }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Tiếp"
                    disabled={!canScrollNext}
                    onClick={() => emblaApi?.scrollNext()}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-all"
                    style={canScrollNext
                      ? { backgroundColor: `${colors.sectionAccent}18`, color: colors.sectionAccent }
                      : { opacity: 0.3, color: colors.mutedText ?? '#94a3b8' }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {section.products.length === 0 ? (
            <div className="mx-4">
              <EmptyState message="Chưa có sản phẩm" size="small" />
            </div>
          ) : (
            <div className="overflow-hidden px-4" ref={emblaRef}>
              <div className="flex gap-4 backface-hidden touch-pan-y">
                {section.products.map((product) => {
                  const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
                  const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
                  const cartButtonsLayout = config.cartButtonsLayout || 'stack';
                  return (
                    <div 
                      key={product._id}
                      className={cn(
                        'flex-none group cursor-grab active:cursor-grabbing select-none flex flex-col justify-between',
                        device === 'mobile' ? 'w-36' : 'w-48'
                      )}
                    >
                      <div className="flex-1 flex flex-col">
                        <div className={cn('overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2', imageRadiusClassName)} style={imageAspectRatioStyle}>
                          {product.image ? (
                            <FramePreviewImage 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={24} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                        <h4 className={cn(
                          'font-medium line-clamp-2 mb-1',
                          device === 'mobile' ? 'text-xs' : 'text-sm'
                        )}>{product.name}</h4>
                        <span className={cn('font-bold mb-2 block', device === 'mobile' ? 'text-sm' : 'text-base')} style={{ color: colors.buttonText }}>
                          {getPriceDisplay(product.price, product.salePrice, product.hasVariants).label}
                        </span>
                      </div>
                      {(showAddToCartButton || showBuyNowButton) && (
                        <div className="mt-auto">
                          <ProductCardActions
                            product={product as any}
                            tokens={listTokens}
                            showStock={false}
                            showAddToCartButton={showAddToCartButton}
                            showBuyNowButton={showBuyNowButton}
                            buyNowLabel="Mua ngay"
                            onAddToCart={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'addToCart')}
                            onBuyNow={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'buyNow')}
                            cartButtonsLayout={cartButtonsLayout}
                            device={device}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderCarouselStyle = () => (
    <div className={cn('w-full space-y-8 md:space-y-12', sectionSpacingClassName)}>
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => (
          <CarouselSection key={section.id} section={section} />
        ))
      )}
    </div>
  );

  // Style 3: Cards - Modern cards with category header
  const renderCardsStyle = () => (
    <div className={cn('w-full space-y-8 md:space-y-12', sectionSpacingClassName)}>
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => (
          <section key={section.id} className="px-4">
            <div className="max-w-7xl mx-auto">
              <div
                className={cn('overflow-hidden', cardRadiusClassName)}
                style={{ border: `1px solid ${colors.cardBorder}` }}
              >
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: colors.neutralBackground }}
                >
                  <div className="flex items-center gap-3">
                    {section.category.image && (
                      <div className={cn('w-10 h-10 overflow-hidden bg-white', imageRadiusClassName)}>
                        <PreviewImage 
                          src={section.category.image} 
                          alt={section.category.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <h2
                      className={cn(
                        'font-bold',
                        device === 'mobile' ? 'text-base' : 'text-lg'
                      )}
                      style={{ color: colors.heading }}
                    >
                      {section.category.name}
                    </h2>
                  </div>
                  {config.showViewAll && (
                    <button
                      className="text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                    >
                      Xem danh mục <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                <div className="p-4 bg-white dark:bg-slate-900">
                  {section.products.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Package size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Chưa có sản phẩm</p>
                    </div>
                  ) : (
                    <div className={cn('grid gap-4', getGridCols())}>
                      {section.products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  );

  // Style 4: Bento - Featured product với grid layout sáng tạo
  const renderBentoStyle = () => (
    <div className={cn('w-full space-y-10 md:space-y-16', sectionSpacingClassName)}>
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => {
          const featured = section.products[0];
          const others = section.products.slice(1, 5);

          return (
            <section key={section.id} className="px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: colors.sectionAccent }}
                    />
                    <h2
                      className={cn(
                        'font-bold',
                        device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl'
                      )}
                      style={{ color: colors.heading }}
                    >
                      {section.category.name}
                    </h2>
                  </div>
                  {config.showViewAll && (
                    <button
                    className="text-sm font-medium flex items-center gap-1.5 px-4 py-2 rounded-full"
                    style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                  >
                      Xem danh mục <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                {section.products.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Chưa có sản phẩm</p>
                  </div>
                ) : (device === 'mobile' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {section.products.slice(0, 4).map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 auto-rows-[180px]">
                    {featured && (
                      <div className={cn('col-span-2 row-span-2 group cursor-pointer relative overflow-hidden bg-slate-100 dark:bg-slate-800', cardRadiusClassName)}>
                        {featured.image ? (
                          <FramePreviewImage 
                            src={featured.image} 
                            alt={featured.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={48} className="text-slate-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
                            style={{ backgroundColor: colors.featuredBadgeBackground, color: colors.featuredBadgeText }}
                          >
                            Nổi bật
                          </span>
                          <h3 className="font-bold text-base line-clamp-2 mb-1">{featured.name}</h3>
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 mb-3">
                            {(() => {
                              const priceDisplay = getPriceDisplay(featured?.price, featured?.salePrice, featured?.hasVariants);
                              if (priceDisplay.comparePrice) {
                                return (
                                  <>
                                    <span className="font-bold text-base">{priceDisplay.label}</span>
                                    <span className="text-xs text-white/60 line-through">
                                      {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                                    </span>
                                  </>
                                );
                              }
                              return <span className="font-bold text-base">{priceDisplay.label}</span>;
                            })()}
                          </div>
                          {(saleMode === 'cart' && (config.showAddToCartButton !== false || config.showBuyNowButton !== false)) && (
                            <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                              <ProductCardActions
                                product={featured as any}
                                tokens={listTokens}
                                showStock={false}
                                showAddToCartButton={saleMode === 'cart' && config.showAddToCartButton !== false}
                                showBuyNowButton={saleMode === 'cart' && config.showBuyNowButton !== false}
                                buyNowLabel="Mua ngay"
                                onAddToCart={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'addToCart')}
                                onBuyNow={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'buyNow')}
                                cartButtonsLayout={config.cartButtonsLayout || 'stack'}
                                device={device}
                                isOnDarkBg={true}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {others.map((product) => {
                      const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
                      const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
                      const cartButtonsLayout = config.cartButtonsLayout || 'stack';
                      return (
                        <div key={product._id} className={cn('group cursor-pointer relative overflow-hidden bg-slate-100 dark:bg-slate-800', imageRadiusClassName)}>
                          {product.image ? (
                            <FramePreviewImage 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={24} className="text-slate-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30 flex flex-col justify-end bg-black/60 max-h-full overflow-y-auto">
                            <h4 className="font-medium text-xs line-clamp-1">{product.name}</h4>
                            <span className="font-bold text-xs mb-2">{getPriceDisplay(product.price, product.salePrice, product.hasVariants).label}</span>
                            {(showAddToCartButton || showBuyNowButton) && (
                              <div className="mt-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <ProductCardActions
                                  product={product as any}
                                  tokens={listTokens}
                                  showStock={false}
                                  showAddToCartButton={showAddToCartButton}
                                  showBuyNowButton={showBuyNowButton}
                                  buyNowLabel="Mua ngay"
                                  onAddToCart={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'addToCart')}
                                  onBuyNow={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'buyNow')}
                                  cartButtonsLayout={cartButtonsLayout}
                                  device={device}
                                  isOnDarkBg={true}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );

  // Style 5: Magazine - Editorial Grid với Featured Item + Grid nhỏ
  const renderMagazineStyle = () => (
    <div className={cn('w-full space-y-12 md:space-y-16', sectionSpacingClassName)}>
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => {
          const featured = section.products[0];
          const gridItems = section.products.slice(1, 5);

          return (
            <section key={section.id} className="px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-6 pb-4 border-b-2" style={{ borderColor: colors.neutralBorder }}>
                  <div>
                    <span 
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: colors.buttonText }}
                    >
                      Bộ sưu tập
                    </span>
                    <h2
                      className={cn(
                        'font-bold tracking-tight mt-1',
                        device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl'
                      )}
                      style={{ color: colors.heading }}
                    >
                      {section.category.name}
                    </h2>
                  </div>
                  {config.showViewAll && (
                    <button 
                      className={cn(
                        'font-semibold flex items-center gap-2',
                        device === 'mobile' ? 'text-sm' : 'text-base'
                      )}
                      style={{ color: colors.buttonText }}
                    >
                      Xem danh mục <ArrowRight size={device === 'mobile' ? 16 : 18} />
                    </button>
                  )}
                </div>

                {section.products.length === 0 ? (
                  <EmptyState message="Chưa có sản phẩm" size="small" />
                ) : (device === 'mobile' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {section.products.slice(0, 4).map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {featured && (
                      <div className={cn('group cursor-pointer relative overflow-hidden', cardRadiusClassName)} style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}>
                        {featured.image ? (
                          <FramePreviewImage 
                            src={featured.image} 
                            alt={featured.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={48} style={{ color: colors.emptyStateIcon }} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <span
                            className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                            style={{ backgroundColor: colors.featuredBadgeBackground, color: colors.featuredBadgeText }}
                          >
                            Nổi bật
                          </span>
                          <h3 className="font-bold text-xl md:text-2xl line-clamp-2 mb-2">{featured.name}</h3>
                          <div className="flex items-baseline gap-3 mb-3">
                            {(() => {
                              const priceDisplay = getPriceDisplay(featured?.price, featured?.salePrice, featured?.hasVariants);
                              if (priceDisplay.comparePrice) {
                                return (
                                  <>
                                    <span className="font-bold text-2xl">{priceDisplay.label}</span>
                                    <span className="text-sm text-white/60 line-through">
                                      {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                                    </span>
                                  </>
                                );
                              }
                              return <span className="font-bold text-2xl">{priceDisplay.label}</span>;
                            })()}
                          </div>
                          {(saleMode === 'cart' && (config.showAddToCartButton !== false || config.showBuyNowButton !== false)) && (
                            <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                              <ProductCardActions
                                product={featured as any}
                                tokens={listTokens}
                                showStock={false}
                                showAddToCartButton={saleMode === 'cart' && config.showAddToCartButton !== false}
                                showBuyNowButton={saleMode === 'cart' && config.showBuyNowButton !== false}
                                buyNowLabel="Mua ngay"
                                onAddToCart={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'addToCart')}
                                onBuyNow={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'buyNow')}
                                cartButtonsLayout={config.cartButtonsLayout || 'stack'}
                                device={device}
                                isOnDarkBg={true}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {gridItems.map((product) => {
                        const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
                        const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
                        const cartButtonsLayout = config.cartButtonsLayout || 'stack';
                        return (
                          <div key={product._id} className="group cursor-pointer">
                            <div 
                              className={cn('overflow-hidden mb-3 relative', imageRadiusClassName)}
                              style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                            >
                              {product.image ? (
                                <FramePreviewImage 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={24} style={{ color: colors.emptyStateIcon }} />
                                </div>
                              )}
                              <div
                                className="absolute inset-x-2 bottom-2 flex items-center justify-center"
                              >
                                <span
                                  className="px-4 py-2 rounded-full text-sm font-medium"
                                  style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                                >
                                  Xem nhanh
                                </span>
                              </div>
                            </div>
                            <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h4>
                            <div className="flex items-baseline gap-2 mt-1">
                              {(() => {
                                const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                                if (priceDisplay.comparePrice) {
                                  return (
                                    <>
                                      <span className={cn('font-bold', 'text-sm')}>
                                        {priceDisplay.label}
                                      </span>
                                      <span className="text-[10px] text-slate-400 line-through">
                                        {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                                      </span>
                                    </>
                                  );
                                }
                                return (
                                  <span className={cn('font-bold', 'text-sm')}>
                                    {priceDisplay.label}
                                  </span>
                                );
                              })()}
                            </div>
                            {(showAddToCartButton || showBuyNowButton) && (
                              <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <ProductCardActions
                                  product={product as any}
                                  tokens={listTokens}
                                  showStock={false}
                                  showAddToCartButton={showAddToCartButton}
                                  showBuyNowButton={showBuyNowButton}
                                  buyNowLabel="Mua ngay"
                                  onAddToCart={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'addToCart')}
                                  onBuyNow={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'buyNow')}
                                  cartButtonsLayout={cartButtonsLayout}
                                  device={device}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {gridItems.length < 4 && Array.from({ length: 4 - gridItems.length }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="rounded-xl flex items-center justify-center"
                          style={{ ...imageAspectRatioStyle, backgroundColor: colors.emptyStateBackground, border: `2px dashed ${colors.neutralBorder}` }}
                        >
                          <Package size={24} style={{ color: colors.emptyStateIcon }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );

  // Style 6: Showcase - always-visible mobile-first cards
  const renderShowcaseStyle = () => (
    <div className={cn('w-full space-y-10 md:space-y-16', sectionSpacingClassName)}>
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => (
          <section key={section.id}>
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: colors.buttonText }}
                  >
                    Bộ sưu tập
                  </span>
                  <h2
                    className={cn(
                      'font-bold mt-1',
                      device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl'
                    )}
                    style={{ color: colors.heading }}
                  >
                    {section.category.name}
                  </h2>
                  <div
                    className="h-1 w-16 rounded-full mt-2"
                    style={{ backgroundColor: colors.sectionAccent }}
                  />
                </div>
                {config.showViewAll && (
                  <button
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: colors.buttonText }}
                  >
                    Xem danh mục
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}` }}
                    >
                      <ArrowRight size={14} />
                    </span>
                  </button>
                )}
              </div>

              {section.products.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chưa có sản phẩm</p>
                </div>
              ) : (
                <div className={cn(
                  'grid gap-4',
                  getGridCols()
                )}>
                  {section.products.map((product) => {
                    const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
                    const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
                    const cartButtonsLayout = config.cartButtonsLayout || 'stack';
                    return (
                      <div key={product._id} className="cursor-pointer group block">
                        <div
                          className={cn('relative overflow-hidden border mb-3', cardRadiusClassName)}
                          style={{ ...imageAspectRatioStyle, borderColor: colors.cardBorder, backgroundColor: colors.imageBackground }}
                        >
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
                            style={{ background: `linear-gradient(135deg, ${colors.neutralBorder} 0%, transparent 50%, ${colors.neutralBackground} 100%)` }}
                          />
                          {product.image ? (
                            <FramePreviewImage
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={32} style={{ color: colors.emptyStateIcon }} />
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                          <div className="absolute bottom-3 left-3 right-3 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-30">
                            <span
                              className="block w-full py-2.5 rounded-xl text-sm font-medium text-center backdrop-blur-sm"
                              style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                            >
                              Xem chi tiết
                            </span>
                          </div>

                          {(() => {
                            const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                            if (!priceDisplay.comparePrice) {return null;}
                            return (
                              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500 z-30">
                                -{Math.round((1 - (product.price ?? 0) / priceDisplay.comparePrice) * 100)}%
                              </div>
                            );
                          })()}
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:opacity-80 transition-opacity" style={{ color: colors.bodyText }}>
                            {product.name}
                          </h4>
                          <div className="flex flex-col mb-2">
                            {(() => {
                              const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                              if (priceDisplay.comparePrice) {
                                return (
                                  <>
                                    <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                                      {priceDisplay.label}
                                    </span>
                                    <span className="text-xs line-through" style={{ color: colors.mutedText }}>
                                      {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                                    </span>
                                  </>
                                );
                              }
                              return (
                                <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                                  {priceDisplay.label}
                                </span>
                              );
                            })()}
                          </div>
                          {(showAddToCartButton || showBuyNowButton) && (
                            <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                              <ProductCardActions
                                product={product as any}
                                tokens={listTokens}
                                showStock={false}
                                  showAddToCartButton={showAddToCartButton}
                                  showBuyNowButton={showBuyNowButton}
                                  buyNowLabel="Mua ngay"
                                  onAddToCart={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'addToCart')}
                                  onBuyNow={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'buyNow')}
                                  cartButtonsLayout={cartButtonsLayout}
                                  device={device}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </div>
    );

  const getProductDiscount = (product: CategoryProductsProduct) => {
    const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
    const currentPrice = product.salePrice ?? product.price;
    if (!priceDisplay.comparePrice || !currentPrice || priceDisplay.comparePrice <= currentPrice) {return null;}
    return Math.round((1 - currentPrice / priceDisplay.comparePrice) * 100);
  };

  const renderWineGridStyle = () => (
    <div className={cn('w-full bg-white px-2', sectionSpacingClassName)}>
      {resolvedSections.length === 0 ? (
        <EmptyState message="Chưa chọn danh mục nào" />
      ) : (
        <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-6">
          {resolvedSections.map((section) => {
            const productGridClassName = cn(getGridCols(), 'gap-2 md:gap-3');

            return (
            <section
              key={section.id}
              className={cn('border bg-white', cardRadiusClassName)}
              style={{ borderColor: colors.cardBorder }}
            >
              <div className={cn(
                'flex flex-col gap-3 px-3 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6',
                'sm:flex-row sm:items-end sm:justify-between'
              )}>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-base font-bold uppercase leading-6 tracking-[0.1em] md:text-xl md:leading-7 md:tracking-[0.14em] lg:text-2xl lg:leading-8 lg:tracking-[0.18em]" style={{ color: colors.heading }}>
                    {section.category.name}
                  </h3>
                </div>
                {config.showViewAll && (
                  <button
                    type="button"
                    aria-label="Xem thêm - Xem danh mục"
                    className={cn(
                      'group flex h-9 shrink-0 items-center justify-center self-start rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase leading-4 tracking-[0.12em] transition-colors hover:bg-[var(--wine-button-hover-bg)] hover:text-[var(--wine-button-hover-text)] md:h-10 md:px-4 md:text-xs md:tracking-[0.16em]',
                      'sm:self-auto lg:ml-4 lg:px-5'
                    )}
                    style={{
                      '--wine-button-hover-bg': colors.sectionAccent,
                      '--wine-button-hover-text': colors.featuredBadgeText,
                      backgroundColor: colors.buttonBackground,
                      borderColor: colors.sectionAccent,
                      color: colors.sectionAccent,
                    } as React.CSSProperties}
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      Xem thêm
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </button>
                )}
              </div>

              <div className="px-3 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
                {section.products.length === 0 ? (
                  <EmptyState message="Chưa có sản phẩm trong danh mục này" size="small" />
                ) : (
                  <div className={cn('grid', productGridClassName)}>
                    {section.products.map((product) => {
                      const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                      const discount = getProductDiscount(product);
                      const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
                      const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
                      const cartButtonsLayout = config.cartButtonsLayout || 'stack';

                      return (
                        <article
                          key={product._id}
                          className={cn('flex h-full flex-col overflow-hidden border shadow-sm transition-all duration-300', cardRadiusClassName)}
                          style={{ backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }}
                        >
                          <div className="relative aspect-square overflow-hidden border-b" style={{ backgroundColor: colors.imageBackground, borderColor: colors.cardBorder }}>
                            {discount !== null && (
                              <span className="absolute left-0 top-3 z-10 rounded-r-lg px-2.5 py-0.5 text-xs font-bold leading-4 shadow-sm" style={{ backgroundColor: colors.featuredBadgeBackground, color: colors.featuredBadgeText }}>
                                -{discount}%
                              </span>
                            )}
                            <div className="relative h-full w-full">
                              {product.image ? (
                                <PreviewImage
                                  src={product.image}
                                  alt={product.name}
                                  className="absolute inset-0 h-full w-full object-contain p-1 transition-opacity duration-300"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package size={28} style={{ color: colors.emptyStateIcon }} />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col p-2.5 md:p-3">
                            <h3 className="mb-1.5 line-clamp-2 break-words text-[13px] font-bold leading-5 transition-colors md:mb-2 md:text-sm md:leading-5 lg:text-base lg:leading-6" style={{ color: colors.bodyText }}>
                              {product.name || 'Tên sản phẩm'}
                            </h3>
                            <div className="mb-2 flex flex-col gap-1" />
                            <div className="mt-auto flex flex-col gap-2 border-t pt-2" style={{ borderColor: colors.cardBorder }}>
                              <div className="flex min-w-0 flex-row items-end justify-between gap-1.5">
                                <div className="min-w-0 flex flex-col">
                                  {priceDisplay.comparePrice && (
                                    <span className="max-w-full truncate text-xs font-medium leading-4 line-through" style={{ color: colors.mutedText }}>
                                      {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                                    </span>
                                  )}
                                  <span className="max-w-full truncate whitespace-nowrap text-[12px] font-bold leading-4 md:text-[13px] md:leading-5 lg:text-sm" style={{ color: colors.bodyText }}>
                                    {priceDisplay.label}
                                  </span>
                                </div>
                                {!showAddToCartButton && !showBuyNowButton && (
                                  <button
                                    type="button"
                                    className="inline-flex h-6 min-w-9 shrink-0 items-center justify-center whitespace-nowrap rounded px-2 text-[10px] font-medium leading-none transition-colors md:min-w-10 md:px-2.5 md:text-[11px]"
                                    style={{ backgroundColor: colors.buttonSolidBackground, color: colors.buttonSolidText }}
                                  >
                                    Xem
                                  </button>
                                )}
                              </div>
                              {(showAddToCartButton || showBuyNowButton) && (
                                <div className="mt-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                  <ProductCardActions
                                    product={product as any}
                                    tokens={listTokens}
                                    showStock={false}
                                    showAddToCartButton={showAddToCartButton}
                                    showBuyNowButton={showBuyNowButton}
                                    buyNowLabel="Mua ngay"
                                    onAddToCart={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'addToCart')}
                                    onBuyNow={(actionProduct) => onPreviewAction(actionProduct as CategoryProductsProduct, 'buyNow')}
                                    cartButtonsLayout={cartButtonsLayout}
                                    device={device}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <PreviewWrapper 
        title="Preview Sản phẩm theo danh mục" 
        device={device} 
        setDevice={setDevice} 
        previewStyle={previewStyle} 
        setPreviewStyle={setPreviewStyle} 
        styles={CATEGORY_PRODUCTS_STYLES} 
        info={getPreviewInfo()}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {previewStyle === 'grid' && renderGridStyle()}
          {previewStyle === 'carousel' && renderCarouselStyle()}
          {previewStyle === 'cards' && renderCardsStyle()}
          {previewStyle === 'bento' && renderBentoStyle()}
          {previewStyle === 'magazine' && renderMagazineStyle()}
          {previewStyle === 'showcase' && renderShowcaseStyle()}
          {previewStyle === 'wine-grid' && renderWineGridStyle()}
        </BrowserFrame>
      </PreviewWrapper>
      <ColorInfoPanel brandColor={_brandColor} secondary={colors.secondary} />
      <QuickAddVariantModal
        isOpen={quickAddTarget !== null}
        product={quickAddModalProduct}
        brandColor={_brandColor}
        actionLabel={quickAddTarget?.action === 'addToCart' ? 'Thêm vào giỏ' : 'Mua ngay'}
        onClose={() => setQuickAddTarget(null)}
        onConfirm={() => setQuickAddTarget(null)}
      />
    </>
  );
};
