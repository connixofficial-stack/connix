'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { Package, Heart, X, ShoppingCart } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import type { ProductsListColors } from '@/components/site/products/colors';
import { getPublicPriceLabel } from '@/lib/products/public-price';
import { getAttributeIconComponent } from '@/app/admin/attribute-groups/_lib/iconRegistry';
import { ProductImageWithOverlay } from '@/components/shared/ProductImageWithOverlay';
import type { WatermarkConfig, ProductFrameConfig } from '@/components/shared/ProductImageWithOverlay';

export function useProductImagePlaceholder() {
  const productImagePlaceholderSetting = useQuery(api.settings.getValue, { key: 'product_image_placeholder', defaultValue: '' });
  return typeof productImagePlaceholderSetting === 'string' ? productImagePlaceholderSetting : '';
}

export interface ProductCardProps {
  product: {
    _id: Id<'products'>;
    name: string;
    slug: string;
    image?: string;
    affiliateLink?: string;
    price: number;
    salePrice?: number;
    stock: number;
    hasVariants?: boolean;
    categoryId: string;
    description?: string;
    productTypeId?: string;
  };
  categoryMap: Map<string, string>;
  showPrice: boolean;
  showSalePrice: boolean;
  showStock: boolean;
}

export function ProductCardActions({
  product,
  tokens,
  showStock,
  showAddToCartButton,
  showBuyNowButton,
  buyNowLabel: _buyNowLabel,
  onAddToCart,
  onBuyNow,
  cartButtonsLayout
}: {
  product: ProductCardProps['product'];
  tokens: ProductsListColors;
  showStock: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  buyNowLabel: string;
  onAddToCart: (product: ProductCardProps['product']) => void;
  onBuyNow: (product: ProductCardProps['product']) => void;
  cartButtonsLayout?: 'stack' | 'grid-2';
}) {
  if (!showAddToCartButton && !showBuyNowButton) {
    return null;
  }

  const isOutOfStock = showStock && !product.hasVariants && product.stock <= 0;

  if (isOutOfStock) {
    return (
      <div className="mt-2 sm:mt-3 w-full">
        <div
          className="w-full rounded-full py-1.5 sm:py-2 text-[10px] xs:text-xs lg:text-[11px] xl:text-xs font-medium tracking-wide flex items-center justify-center bg-slate-100/70 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-500 border border-slate-200/10 cursor-not-allowed select-none"
        >
          <span>Hết hàng</span>
        </div>
      </div>
    );
  }

  const isGrid2 = cartButtonsLayout === 'grid-2' && showAddToCartButton && showBuyNowButton;
  const actionHeightClass = showAddToCartButton && showBuyNowButton && !isGrid2 ? 'min-h-[76px]' : 'min-h-[36px]';
  const gridColsClass = isGrid2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className={`mt-2 sm:mt-3 grid ${gridColsClass} gap-1.5 sm:gap-2 ${actionHeightClass}`}>
      {showAddToCartButton && (
        <button
          className="w-full rounded-full py-1.5 sm:py-2 text-[10px] xs:text-xs lg:text-[11px] xl:text-xs font-semibold tracking-wide border transition-all duration-300 flex items-center justify-center disabled:opacity-55 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow px-1.5 whitespace-nowrap"
          style={{
            backgroundColor: 'rgba(250, 204, 21, 0.08)',
            borderColor: `${tokens.primary}25`,
            color: tokens.primary
          }}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAddToCart(product); }}
        >
          <ShoppingCart size={13} className="mr-1 sm:mr-1.5 shrink-0" style={{ color: tokens.primary }} />
          <span>Thêm giỏ</span>
        </button>
      )}
      {showBuyNowButton && (
        <button
          className="w-full rounded-full py-1.5 sm:py-2 text-[10px] xs:text-xs lg:text-[11px] xl:text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center disabled:opacity-55 disabled:cursor-not-allowed hover:brightness-95 hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow px-1.5 whitespace-nowrap"
          style={{
            backgroundColor: tokens.primary,
            color: tokens.primaryActionText
          }}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); onBuyNow(product); }}
        >
          <span>Mua ngay</span>
        </button>
      )}
    </div>
  );
}

type AttributeBadgeTokens = {
  primary: string;
  cardBorder?: string;
  border?: string;
};

export function ProductAttributesBadges({
  productId,
  productAttributesMap,
  tokens,
  className = "flex flex-col gap-1.5 w-full mt-2 mb-2",
  onAttributeChange,
  selectedAttributes,
  productTypeId,
  limit,
  itemClassName = "text-xs",
  iconClassName = "h-[15px] w-[15px]"
}: {
  productId: string;
  productAttributesMap?: Map<string, any[]>;
  tokens: AttributeBadgeTokens;
  className?: string;
  onAttributeChange?: (groupSlug: string, termSlug: any, checked: boolean) => void;
  selectedAttributes?: Record<string, string[]>;
  productTypeId?: string;
  limit?: number;
  itemClassName?: string;
  iconClassName?: string;
}) {
  const router = useRouter();
  const enableProductTypesSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableProductTypes' });
  const enableProductTypes = enableProductTypesSetting?.value === true;
  const productTypesData = useQuery(api.productTypes.listAll, enableProductTypes ? {} : 'skip');

  const productTypeSlugMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!productTypesData) return map;
    productTypesData.forEach(t => {
      if (t.active) {
        map.set(t._id, t.slug);
      }
    });
    return map;
  }, [productTypesData]);

  const productTypeAttributeOrderMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    if (!productTypesData) return map;
    productTypesData.forEach((type) => {
      const orderMap = new Map<string, number>();
      type.attributeGroupIds?.forEach((groupId, index) => {
        orderMap.set(groupId, index);
      });
      map.set(type._id, orderMap);
    });
    return map;
  }, [productTypesData]);

  if (!enableProductTypes || !productAttributesMap) return null;
  const terms = productAttributesMap.get(productId);
  if (!terms || terms.length === 0) return null;

  // 1. Nhóm các term theo groupId để tránh trùng lặp badge cùng loại và gộp tên
  const groupMap = new Map<string, { group: any; terms: Array<{ _id: string; name: string; slug: string; order?: number }> }>();
  for (const term of terms) {
    if (!term.group) continue;
    const groupId = term.group._id;
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        group: term.group,
        terms: []
      });
    }
    const groupData = groupMap.get(groupId)!;
    groupData.terms.push({ _id: term._id, name: term.name, slug: term.slug, order: term.order });
  }

  // 2. Chuyển đổi thành danh sách các nhóm đã gộp
  const mergedGroups = Array.from(groupMap.values()).map(g => ({
    _id: g.terms.map(t => t._id).join('-'),
    group: g.group,
    terms: g.terms.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)),
  }));

  // 3. Sắp xếp các nhóm theo thứ tự cấu hình của Loại sản phẩm
  const configuredOrder = productTypeId ? productTypeAttributeOrderMap.get(productTypeId) : undefined;
  const sortedGroups = mergedGroups.sort((a, b) => {
    const aOrder = configuredOrder?.get(a.group._id) ?? a.group.order ?? 9999;
    const bOrder = configuredOrder?.get(b.group._id) ?? b.group.order ?? 9999;
    return aOrder - bOrder;
  });

  return (
    <div className={className}>
      {(limit ? sortedGroups.slice(0, limit) : sortedGroups).map((groupItem) => {
        const IconComponent = getAttributeIconComponent(groupItem.group.iconPath);
        const groupId = groupItem.group._id;

        const isAnyTermChecked = groupItem.terms.some(term => {
          const currentTermSlugs = selectedAttributes?.[groupId] || [];
          return currentTermSlugs.includes(term.slug);
        });

        return (
          <div
            key={groupItem._id}
            className={`flex min-w-0 max-w-full items-start gap-1.5 font-medium leading-5 transition-colors duration-300 ${itemClassName}`}
            style={{
              color: isAnyTermChecked ? tokens.primary : undefined,
            } as React.CSSProperties}
            title={groupItem.group.name}
          >
            <span style={{ color: tokens.primary }} className="mt-0.5 flex shrink-0 items-center justify-center">
              <IconComponent size={15} className={iconClassName} />
            </span>
            <div className="flex min-w-0 max-h-5 flex-1 flex-wrap overflow-hidden">
              {groupItem.terms.slice(0, 2).map((term) => {
                const currentTermSlugs = selectedAttributes?.[groupId] || [];
                const isChecked = currentTermSlugs.includes(term.slug);

                return (
                  <span
                    key={term._id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (enableProductTypes && productTypeId) {
                        const productTypeSlug = productTypeSlugMap.get(productTypeId);
                        if (productTypeSlug) {
                          if (groupItem.group.filterType === 'range') {
                            router.push(`/${productTypeSlug}?attr_${groupItem.group.slug}=${term.slug}`, { scroll: false });
                          } else {
                            router.push(`/${productTypeSlug}/${groupItem.group.slug}/${term.slug}`, { scroll: false });
                          }
                          return;
                        }
                      }

                      onAttributeChange?.(groupItem.group.slug, term.slug, !isChecked);
                    }}
                    className={`min-w-0 max-w-full cursor-pointer truncate transition-colors before:content-[',_'] first:before:content-none hover:underline ${
                      isChecked
                        ? 'font-semibold'
                        : 'font-normal text-slate-600 dark:text-slate-400'
                    }`}
                    style={isChecked ? { color: tokens.primary } : undefined}
                    title={`Lọc theo ${groupItem.group.name.toLowerCase()}: ${term.name}`}
                  >
                    {term.name}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProductGrid({
  products,
  categoryMap,
  tokens,
  showPrice,
  showSalePrice,
  showStock,
  saleMode,
  showWishlistButton,
  showAddToCartButton,
  showBuyNowButton,
  buyNowLabel,
  showPromotionBadge,
  wishlistIdSet,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  canUseWishlist,
  imageAspectRatioStyle,
  frameConfig,
  watermarkConfig,
  getDetailHref,
  radiusClass,
  productAttributesMap,
  onAttributeChange,
  selectedAttributes,
  cartButtonsLayout,
  gridColumns
}: {
  products: ProductCardProps['product'][];
  categoryMap: Map<string, string>;
  tokens: ProductsListColors;
  showPrice: boolean;
  showSalePrice: boolean;
  showStock: boolean;
  saleMode: 'cart' | 'contact' | 'affiliate';
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  buyNowLabel: string;
  showPromotionBadge: boolean;
  wishlistIdSet: Set<Id<'products'>>;
  onToggleWishlist: (id: Id<'products'>) => void;
  onAddToCart: (product: ProductCardProps['product']) => void;
  onBuyNow: (product: ProductCardProps['product']) => void;
  canUseWishlist: boolean;
  imageAspectRatioStyle: React.CSSProperties;
  frameConfig?: ProductFrameConfig | null;
  watermarkConfig?: WatermarkConfig | null;
  getDetailHref: (product: ProductCardProps['product']) => string;
  radiusClass: string;
  productAttributesMap?: Map<string, any[]>;
  onAttributeChange?: (groupSlug: string, termSlug: any, checked: boolean) => void;
  selectedAttributes?: Record<string, string[]>;
  cartButtonsLayout?: 'stack' | 'grid-2';
  gridColumns?: number;
}) {
  const productImagePlaceholder = useProductImagePlaceholder();
  const gridCols = gridColumns ?? 3;
  const gridClass = gridCols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={`grid ${gridClass} gap-4 md:gap-6`}>
      {products.map((product) => (
        (() => {
          const priceDisplay = getPublicPriceLabel({ saleMode, price: product.price, salePrice: product.salePrice, isRangeFromVariant: product.hasVariants });
          return (
            <Link
              key={product._id}
              href={getDetailHref(product)}
              className={`group ${radiusClass} overflow-hidden border transition-all duration-300 flex flex-col h-full hover:border-[var(--card-hover-border)] hover:shadow-lg hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-1`}
              style={{
                backgroundColor: tokens.cardBackground,
                borderColor: tokens.cardBorder,
                '--card-hover-border': tokens.primary,
                '--card-hover-shadow': `${tokens.primary}15`,
              } as React.CSSProperties}
            >
              <ProductImageWithOverlay
                frameConfig={frameConfig}
                watermarkConfig={watermarkConfig}
                className="overflow-hidden relative"
                style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }}
              >
                {product.image || productImagePlaceholder ? (
                  <Image mode="thumb" src={product.image || productImagePlaceholder} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package size={48} style={{ color: tokens.neutralTextLight }} /></div>
                )}
                {showPromotionBadge && showSalePrice && priceDisplay.comparePrice && !priceDisplay.isContactPrice && (
                  <span
                    className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded z-30"
                    style={{ backgroundColor: tokens.promotionBadgeBg, color: tokens.promotionBadgeText }}
                  >
                    -{Math.round((1 - product.price / priceDisplay.comparePrice) * 100)}%
                  </span>
                )}
                {showWishlistButton && canUseWishlist && (
                  <button
                    className="absolute top-2 right-2 p-2 rounded-full border transition-all duration-300 z-30 hover:bg-[var(--wishlist-hover-bg)] hover:border-[var(--wishlist-hover-border)] hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: tokens.wishlistButtonBg,
                      borderColor: tokens.wishlistButtonBorder,
                      color: wishlistIdSet.has(product._id) ? tokens.wishlistIconActive : tokens.wishlistIcon,
                      '--wishlist-hover-bg': wishlistIdSet.has(product._id) ? `${tokens.wishlistIconActive}15` : `${tokens.primary}10`,
                      '--wishlist-hover-border': wishlistIdSet.has(product._id) ? tokens.wishlistIconActive : tokens.primary,
                    } as React.CSSProperties}
                    onClick={(event) => { event.preventDefault(); onToggleWishlist(product._id); }}
                    aria-label="Thêm vào yêu thích"
                  >
                    <Heart size={16} />
                  </button>
                )}
              </ProductImageWithOverlay>
              <div className="p-3 sm:p-4 flex flex-1 flex-col">
                <div className="flex mb-1.5">
                  <span
                    className="text-[9px] sm:text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border transition-all duration-300"
                    style={{
                      backgroundColor: tokens.categoryBadgeBg,
                      color: tokens.categoryBadgeText,
                      borderColor: tokens.categoryBadgeBorder
                    }}
                  >
                    {categoryMap.get(product.categoryId) ?? 'Sản phẩm'}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-medium line-clamp-2 transition-colors mb-1 sm:mb-2 group-hover:text-[var(--title-hover-color)]" style={{ color: tokens.bodyText, '--title-hover-color': tokens.primary } as React.CSSProperties}>{product.name}</h3>
                {showPrice && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base font-bold" style={{ color: tokens.priceColor }}>{priceDisplay.label}</span>
                    {showSalePrice && priceDisplay.comparePrice && (
                      <span className="text-[10px] sm:text-xs line-through" style={{ color: tokens.priceOriginalText }}>
                        {getPublicPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                      </span>
                    )}
                  </div>
                )}
                <ProductAttributesBadges
                  productId={product._id}
                  productAttributesMap={productAttributesMap}
                  tokens={tokens}
                  onAttributeChange={onAttributeChange}
                  selectedAttributes={selectedAttributes}
                  productTypeId={product.productTypeId}
                  limit={4}
                  itemClassName="text-[10px] sm:text-xs md:text-[13.2px]"
                  iconClassName="h-[12px] w-[12px] sm:h-[15px] sm:w-[15px] md:h-[16.5px] md:w-[16.5px]"
                />
                <div className="min-h-[16px] sm:min-h-[20px] mt-1 sm:mt-2">
                  {showStock && product.stock <= 5 && product.stock > 0 && <p className="text-[10px] sm:text-xs" style={{ color: tokens.stockLowText }}>Chỉ còn {product.stock} SP</p>}
                  {showStock && product.stock === 0 && <p className="text-[10px] sm:text-xs" style={{ color: tokens.stockOutText }}>Hết hàng</p>}
                </div>
                <div className="mt-auto">
                  <ProductCardActions
                    product={product}
                    tokens={tokens}
                    showStock={showStock}
                    showAddToCartButton={showAddToCartButton}
                    showBuyNowButton={showBuyNowButton}
                    buyNowLabel={buyNowLabel}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                    cartButtonsLayout={cartButtonsLayout}
                  />
                </div>
              </div>
            </Link>
          );
        })()
      ))}
    </div>
  );
}

export function ProductList({
  products,
  categoryMap,
  tokens,
  showPrice,
  showSalePrice,
  showStock,
  saleMode,
  showWishlistButton,
  showAddToCartButton,
  showBuyNowButton,
  buyNowLabel,
  showPromotionBadge: _showPromotionBadge,
  wishlistIdSet,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  canUseWishlist,
  imageAspectRatioStyle,
  frameConfig,
  watermarkConfig,
  getDetailHref,
  radiusClass,
  productAttributesMap,
  onAttributeChange,
  selectedAttributes,
  cartButtonsLayout: _cartButtonsLayout
}: {
  products: ProductCardProps['product'][];
  categoryMap: Map<string, string>;
  tokens: ProductsListColors;
  showPrice: boolean;
  showSalePrice: boolean;
  showStock: boolean;
  saleMode: 'cart' | 'contact' | 'affiliate';
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  buyNowLabel: string;
  showPromotionBadge: boolean;
  wishlistIdSet: Set<Id<'products'>>;
  onToggleWishlist: (id: Id<'products'>) => void;
  onAddToCart: (product: ProductCardProps['product']) => void;
  onBuyNow: (product: ProductCardProps['product']) => void;
  canUseWishlist: boolean;
  imageAspectRatioStyle: React.CSSProperties;
  frameConfig?: ProductFrameConfig | null;
  watermarkConfig?: WatermarkConfig | null;
  getDetailHref: (product: ProductCardProps['product']) => string;
  radiusClass: string;
  productAttributesMap?: Map<string, any[]>;
  onAttributeChange?: (groupSlug: string, termSlug: any, checked: boolean) => void;
  selectedAttributes?: Record<string, string[]>;
  cartButtonsLayout?: 'stack' | 'grid-2';
}) {
  const productImagePlaceholder = useProductImagePlaceholder();
  return (
    <div className="space-y-4">
      {products.map((product) => (
        (() => {
          const priceDisplay = getPublicPriceLabel({ saleMode, price: product.price, salePrice: product.salePrice, isRangeFromVariant: product.hasVariants });
          return (
            <Link
              key={product._id}
              href={getDetailHref(product)}
              className={`group flex flex-col sm:flex-row gap-4 ${radiusClass} overflow-hidden border transition-all duration-300 p-4 hover:border-[var(--card-hover-border)] hover:shadow-lg hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-0.5`}
              style={{
                backgroundColor: tokens.cardBackground,
                borderColor: tokens.cardBorder,
                '--card-hover-border': tokens.primary,
                '--card-hover-shadow': `${tokens.primary}10`,
              } as React.CSSProperties}
            >
              <ProductImageWithOverlay
                frameConfig={frameConfig}
                watermarkConfig={watermarkConfig}
                className="w-full sm:w-32 md:w-40 shrink-0 overflow-hidden rounded-lg relative"
                style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }}
              >
                {product.image || productImagePlaceholder ? (
                  <Image mode="thumb" src={product.image || productImagePlaceholder} alt={product.name} fill sizes="(max-width: 640px) 100vw, 160px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package size={32} style={{ color: tokens.neutralTextLight }} /></div>
                )}
                {_showPromotionBadge && showSalePrice && priceDisplay.comparePrice && !priceDisplay.isContactPrice && (
                  <span
                    className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded z-30"
                    style={{ backgroundColor: tokens.promotionBadgeBg, color: tokens.promotionBadgeText }}
                  >
                    -{Math.round((1 - product.price / priceDisplay.comparePrice) * 100)}%
                  </span>
                )}
                {showWishlistButton && canUseWishlist && (
                  <button
                    className="absolute top-2 right-2 p-2 rounded-full border transition-all duration-300 z-30 hover:bg-[var(--wishlist-hover-bg)] hover:border-[var(--wishlist-hover-border)] hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: tokens.wishlistButtonBg,
                      borderColor: tokens.wishlistButtonBorder,
                      color: wishlistIdSet.has(product._id) ? tokens.wishlistIconActive : tokens.wishlistIcon,
                      '--wishlist-hover-bg': wishlistIdSet.has(product._id) ? `${tokens.wishlistIconActive}15` : `${tokens.primary}10`,
                      '--wishlist-hover-border': wishlistIdSet.has(product._id) ? tokens.wishlistIconActive : tokens.primary,
                    } as React.CSSProperties}
                    onClick={(event) => { event.preventDefault(); onToggleWishlist(product._id); }}
                    aria-label="Thêm vào yêu thích"
                  >
                    <Heart size={16} />
                  </button>
                )}
              </ProductImageWithOverlay>
              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Cột trái: Chi tiết sản phẩm */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex mb-1.5">
                    <span
                      className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border transition-all duration-300"
                      style={{
                        backgroundColor: tokens.categoryBadgeBg,
                        color: tokens.categoryBadgeText,
                        borderColor: tokens.categoryBadgeBorder
                      }}
                    >
                      {categoryMap.get(product.categoryId) ?? 'Sản phẩm'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg transition-colors mb-2 group-hover:text-[var(--title-hover-color)]" style={{ color: tokens.bodyText, '--title-hover-color': tokens.primary } as React.CSSProperties}>{product.name}</h3>
                  {product.description && <p className="text-sm line-clamp-2 mb-2" style={{ color: tokens.metaText }} dangerouslySetInnerHTML={{ __html: product.description.slice(0, 150) }} />}
                  <ProductAttributesBadges
                    productId={product._id}
                    productAttributesMap={productAttributesMap}
                    tokens={tokens}
                    className="flex flex-col gap-1.5 w-full mb-1"
                    onAttributeChange={onAttributeChange}
                    selectedAttributes={selectedAttributes}
                    productTypeId={product.productTypeId}
                    limit={4}
                    itemClassName="text-xs md:text-[13.2px]"
                    iconClassName="h-[15px] w-[15px] md:h-[16.5px] md:w-[16.5px]"
                  />
                </div>

                {/* Cột phải: Giá cả và CTA buttons */}
                <div className="flex flex-col items-start md:items-end justify-center shrink-0 min-w-[220px] md:text-right gap-2 border-t md:border-t-0 border-slate-100 dark:border-zinc-805/40 pt-3 md:pt-0">
                  {showPrice && (
                    <div className="flex items-center md:justify-end gap-2">
                      <span className="text-xl font-bold" style={{ color: tokens.priceColor }}>{priceDisplay.label}</span>
                      {showSalePrice && priceDisplay.comparePrice && (
                        <span className="text-sm line-through" style={{ color: tokens.priceOriginalText }}>
                          {getPublicPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                        </span>
                      )}
                    </div>
                  )}
                  {showStock && !product.hasVariants && product.stock <= 5 && product.stock > 0 && <span className="text-xs" style={{ color: tokens.stockLowText }}>Chỉ còn {product.stock} SP</span>}
                  {showStock && !product.hasVariants && product.stock === 0 && <span className="text-xs" style={{ color: tokens.stockOutText }}>Hết hàng</span>}
                  {(showAddToCartButton || showBuyNowButton) && (
                    <div className="w-full max-w-[220px] mt-2 md:mt-1">
                      <ProductCardActions
                        product={product}
                        tokens={tokens}
                        showStock={showStock}
                        showAddToCartButton={showAddToCartButton}
                        showBuyNowButton={showBuyNowButton}
                        buyNowLabel={buyNowLabel}
                        onAddToCart={onAddToCart}
                        onBuyNow={onBuyNow}
                        cartButtonsLayout={_cartButtonsLayout}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })()
      ))}
    </div>
  );
}

export function EmptyState({ tokens, onReset }: { tokens: ProductsListColors; onReset: () => void }) {
  return (
    <div className="text-center py-16">
      <div
        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: tokens.emptyStateIconBg }}
      >
        <Package size={32} style={{ color: tokens.emptyStateIconColor }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: tokens.emptyStateTitle }}>Không tìm thấy sản phẩm</h3>
      <p className="mb-6" style={{ color: tokens.emptyStateText }}>Thử thay đổi từ khóa hoặc bộ lọc khác</p>
      <button
        onClick={onReset}
        className="px-6 py-2 rounded-lg font-medium transition-colors"
        style={{ backgroundColor: tokens.emptyStateButtonBg, color: tokens.emptyStateButtonText }}
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}

export function ClearFiltersButton({ tokens, onClear }: { tokens: ProductsListColors; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:opacity-85"
      style={{
        backgroundColor: tokens.filterChipBg,
        borderColor: tokens.filterChipActiveBorder,
        color: tokens.filterChipActiveBg,
      }}
      title="Xóa toàn bộ bộ lọc"
    >
      <X size={14} />
      Xóa lọc
    </button>
  );
}
