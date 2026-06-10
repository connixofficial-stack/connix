'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useMutation, useQuery } from 'convex/react';
import { Heart, Package, Search, ShoppingCart } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { useWishlistConfig } from '@/lib/experiences/useSiteConfig';
import { notifyAddToCart, useCart } from '@/lib/cart';
import { useCartConfig } from '@/lib/experiences';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { getWishlistColors } from '@/components/site/wishlist/colors';
import { getPublicPriceLabel } from '@/lib/products/public-price';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';

export default function WishlistPage() {
  const brandColors = useBrandColors();
  const { customer, isAuthenticated, openLoginModal } = useCustomerAuth();
  const { addItem, openDrawer } = useCart();
  const cartConfig = useCartConfig();
  const router = useRouter();
  const config = useWishlistConfig();
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const itemsPerPageSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'wishlist', settingKey: 'itemsPerPage' });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const stockFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableStock', moduleKey: 'products' });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const categories = useQuery(api.productCategories.listActive);
  const toggleWishlist = useMutation(api.wishlist.toggle);

  const itemsPerPage = useMemo(() => {
    const raw = itemsPerPageSetting?.value;
    return typeof raw === 'number' ? raw : 12;
  }, [itemsPerPageSetting?.value]);

  const wishlistItems = useQuery(
    api.wishlist.listByCustomerWithProducts,
    isAuthenticated && customer && (wishlistModule?.enabled ?? false)
      ? { customerId: customer.id as Id<'customers'>, limit: itemsPerPage }
      : 'skip'
  );

  const items = useMemo(() => wishlistItems ?? [], [wishlistItems]);
  const layoutStyle = config.layoutStyle;
  const tokens = useMemo(
    () => getWishlistColors(brandColors.primary, brandColors.secondary, brandColors.mode),
    [brandColors.primary, brandColors.secondary, brandColors.mode]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'price-asc' | 'price-desc' | 'name-asc'>('newest');
  const saleMode = useMemo<'cart' | 'contact' | 'affiliate'>(() => {
    const value = saleModeSetting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [saleModeSetting?.value]);
  const showStock = stockFeature?.enabled ?? true;
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const categorySlugMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((category) => [category._id, category.slug]));
  }, [categories]);
  const getProductDetailHref = useMemo(() => (
    (product: { slug: string; categoryId: string }) => buildDetailPath({
      categorySlug: categorySlugMap.get(product.categoryId),
      mode: routeMode,
      moduleKey: 'products',
      recordSlug: product.slug,
    })
  ), [categorySlugMap, routeMode]);
  const getPriceDisplay = (price?: number, salePrice?: number, isRangeFromVariant?: boolean) =>
    getPublicPriceLabel({ saleMode, price, salePrice, isRangeFromVariant });
  const formatComparePrice = (price?: number) =>
    price ? getPublicPriceLabel({ saleMode: 'cart', price }).label : '';

  const filteredItems = useMemo(() => {
    if (layoutStyle !== 'table') {
      return items;
    }

    let result = items.filter((item) => item.product);
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((item) => item.product?.name.toLowerCase().includes(query));
    }

    switch (sortOption) {
      case 'price-asc':
        result = [...result].sort((a, b) => (a.product?.price ?? 0) - (b.product?.price ?? 0));
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => (b.product?.price ?? 0) - (a.product?.price ?? 0));
        break;
      case 'name-asc':
        result = [...result].sort((a, b) => (a.product?.name ?? '').localeCompare(b.product?.name ?? ''));
        break;
      default:
        break;
    }

    return result;
  }, [items, layoutStyle, searchQuery, sortOption]);

  const isLoadingWishlist = isAuthenticated && (wishlistModule?.enabled ?? true) && wishlistItems === undefined;

  if (wishlistModule && !wishlistModule.enabled) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: tokens.emptyStateBg }}>
          <Heart size={32} style={{ color: tokens.emptyStateIcon }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.emptyStateTitle }}>Danh sách yêu thích đang tắt</h1>
        <p style={{ color: tokens.emptyStateText }}>Hãy bật module Wishlist để sử dụng tính năng này.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: tokens.emptyStateBg }}>
          <Heart size={32} style={{ color: tokens.emptyStateIcon }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.emptyStateTitle }}>Đăng nhập để xem danh sách yêu thích</h1>
        <p className="mb-6" style={{ color: tokens.emptyStateText }}>Bạn cần đăng nhập để quản lý sản phẩm yêu thích.</p>
        <button
          onClick={openLoginModal}
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium"
          style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  if (isLoadingWishlist) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10" style={{ backgroundColor: tokens.pageBackground }}>
        <div className="mb-8">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: tokens.skeletonBase }} />
          <div className="h-4 w-64 rounded-lg animate-pulse mt-3" style={{ backgroundColor: tokens.skeletonBase }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border overflow-hidden animate-pulse"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
            >
              <div className="aspect-square" style={{ backgroundColor: tokens.skeletonBase }} />
              <div className="p-4 space-y-2">
                <div className="h-4 rounded" style={{ backgroundColor: tokens.skeletonBase }} />
                <div className="h-4 w-2/3 rounded" style={{ backgroundColor: tokens.skeletonBase }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleAddToCart = async (productId: Id<'products'>) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    const ok = await addItem(productId, 1);
    if (!ok) {
      return;
    }
    notifyAddToCart();
    if (cartConfig.layoutStyle === 'drawer') {
      openDrawer();
    } else {
      router.push('/cart');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" style={{ backgroundColor: tokens.pageBackground }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: tokens.headingColor }}>Danh sách yêu thích</h1>
        <p className="mt-2" style={{ color: tokens.subtitleColor }}>Lưu lại những sản phẩm bạn quan tâm.</p>
      </div>

      {config.showNotification && (
        <div
          className="mb-6 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted, color: tokens.metaText }}
        >
          Bạn có {items.length} sản phẩm trong danh sách yêu thích.
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: tokens.emptyStateBg }}>
            <Package size={32} style={{ color: tokens.emptyStateIcon }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: tokens.emptyStateTitle }}>Chưa có sản phẩm yêu thích</h2>
          <p className="mb-6" style={{ color: tokens.emptyStateText }}>Hãy khám phá sản phẩm và thêm vào danh sách yêu thích.</p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium"
            style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
          >
            Xem sản phẩm
          </Link>
        </div>
      ) : layoutStyle === 'table' ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm" style={{ color: tokens.metaText }}>Hiển thị {filteredItems.length} sản phẩm</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: tokens.inputIcon }} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm theo tên sản phẩm..."
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 placeholder:text-[var(--placeholder-color)]"
                  style={{
                    '--tw-ring-color': tokens.inputRing,
                    '--placeholder-color': tokens.inputPlaceholder,
                    borderColor: tokens.inputBorder,
                    backgroundColor: tokens.inputBackground,
                    color: tokens.inputText,
                  } as React.CSSProperties}
                />
              </div>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as typeof sortOption)}
                className="w-full sm:w-48 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{
                  '--tw-ring-color': tokens.inputRing,
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                } as React.CSSProperties}
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="name-asc">Tên A-Z</option>
              </select>
            </div>
          </div>

          <div className="hidden md:block overflow-hidden rounded-2xl border" style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: tokens.tableHeaderBg, color: tokens.tableHeaderText }}>
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Sản phẩm</th>
                  <th className="px-4 py-3 text-left font-medium">Giá</th>
                  <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium">Đánh giá</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const product = item.product;
                  if (!product) {return null;}
                  const priceDisplay = getPriceDisplay(product.price, product.salePrice, (product as { hasVariants?: boolean }).hasVariants);

                  return (
                    <tr key={item._id} className="border-t" style={{ borderColor: tokens.tableRowBorder }}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative h-12 w-12 rounded-xl overflow-hidden" style={{ backgroundColor: tokens.surfaceSoft }}>
                            {product.image ? (
                              <Image src={product.image} alt={product.name} fill sizes="48px" className="object-cover" mode="thumb" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6" style={{ color: tokens.emptyStateIcon }} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={getProductDetailHref(product)}
                              className="font-medium line-clamp-2 hover:underline"
                              style={{ color: tokens.bodyText }}
                            >
                              {product.name}
                            </Link>
                            {config.showNote && item.note && (
                              <div className="text-xs mt-1 line-clamp-2" style={{ color: tokens.metaText }}>{item.note}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold" style={{ color: tokens.priceText }}>{priceDisplay.label}</div>
                        {priceDisplay.comparePrice && (
                          <div className="text-xs line-through" style={{ color: tokens.priceOriginalText }}>{formatComparePrice(priceDisplay.comparePrice)}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {showStock && (
                          <span
                            className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: product.stock > 0 ? tokens.badgeInStockBg : tokens.badgeOutStockBg,
                              color: product.stock > 0 ? tokens.badgeInStockText : tokens.badgeOutStockText,
                            }}
                          >
                            {product.stock > 0 ? 'Sẵn hàng' : 'Hết hàng'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4" style={{ color: tokens.metaText }}>—</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { void toggleWishlist({ customerId: item.customerId, productId: item.productId }); }}
                            className="rounded-lg p-2"
                            style={{ color: tokens.actionIconActive }}
                          >
                            <Heart size={16} className="fill-current" />
                          </button>
                          {config.showAddToCartButton && (
                            <button
                              onClick={() => { void handleAddToCart(product._id); }}
                              className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                              style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                              disabled={showStock && product.stock === 0}
                            >
                              <ShoppingCart size={12} />
                              Thêm
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filteredItems.map((item) => {
              const product = item.product;
              if (!product) {return null;}
              const priceDisplay = getPriceDisplay(product.price, product.salePrice, (product as { hasVariants?: boolean }).hasVariants);

              return (
                <div
                  key={item._id}
                  className="flex gap-3 border rounded-2xl p-3"
                  style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                >
                  <Link
                    href={getProductDetailHref(product)}
                    className="relative h-20 w-20 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: tokens.surfaceSoft }}
                  >
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover" mode="thumb" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6" style={{ color: tokens.emptyStateIcon }} />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={getProductDetailHref(product)}
                      className="font-semibold line-clamp-2 text-sm"
                      style={{ color: tokens.bodyText }}
                    >
                      {product.name}
                    </Link>
                    <div className="text-sm font-bold mt-1" style={{ color: tokens.priceText }}>{priceDisplay.label}</div>
                    {config.showNote && item.note && (
                      <p className="mt-1 text-xs line-clamp-2" style={{ color: tokens.metaText }}>{item.note}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={() => { void toggleWishlist({ customerId: item.customerId, productId: item.productId }); }}
                      className="p-1.5 rounded"
                      style={{ color: tokens.actionIconActive }}
                    >
                      <Heart size={14} className="fill-current" />
                    </button>
                    {config.showAddToCartButton && (
                      <button
                        onClick={() => { void handleAddToCart(product._id); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                        style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                        disabled={showStock && product.stock === 0}
                      >
                        <ShoppingCart size={12} />
                        Thêm
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={layoutStyle === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6' : 'space-y-4'}>
          {items.map((item) => {
            const product = item.product;
            if (!product) {return null;}
            const priceDisplay = getPriceDisplay(product.price, product.salePrice, (product as { hasVariants?: boolean }).hasVariants);

            if (layoutStyle === 'grid') {
              return (
                <Link
                  key={item._id}
                  href={getProductDetailHref(product)}
                  className="rounded-2xl border overflow-hidden"
                  style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                >
                  <div className="aspect-square relative" style={{ backgroundColor: tokens.surfaceSoft }}>
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" mode="thumb" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8" style={{ color: tokens.emptyStateIcon }} />
                      </div>
                    )}
                    <button
                      onClick={(event) => { event.preventDefault(); void toggleWishlist({ customerId: item.customerId, productId: item.productId }); }}
                      className="absolute top-2 right-2 p-2 rounded-full shadow-sm"
                      style={{ backgroundColor: tokens.surface, color: tokens.actionIconActive }}
                      aria-label="Bỏ khỏi yêu thích"
                    >
                      <Heart size={16} className="fill-current" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: tokens.bodyText }}>{product.name}</h3>
                    <div className="font-bold text-sm" style={{ color: tokens.priceText }}>{priceDisplay.label}</div>
                    {config.showNote && item.note && (
                      <p className="mt-2 text-xs line-clamp-2" style={{ color: tokens.metaText }}>{item.note}</p>
                    )}
                    {config.showAddToCartButton && (
                      <button
                        onClick={(event) => { event.preventDefault(); void handleAddToCart(product._id); }}
                        className="mt-3 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                        style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                        disabled={showStock && product.stock === 0}
                      >
                        <ShoppingCart size={14} />
                        {showStock && product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </button>
                    )}
                  </div>
                </Link>
              );
            }

            return (
              <div
                key={item._id}
                className="flex gap-4 border rounded-2xl p-4"
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                <Link
                  href={getProductDetailHref(product)}
                  className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: tokens.surfaceSoft }}
                >
                  {product.image ? (
                    <Image src={product.image} alt={product.name} fill sizes="96px" className="object-cover" mode="thumb" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6" style={{ color: tokens.emptyStateIcon }} />
                    </div>
                  )}
                </Link>
                <div className="flex-1">
                  <Link
                    href={getProductDetailHref(product)}
                    className="font-semibold hover:underline"
                    style={{ color: tokens.bodyText }}
                  >
                    {product.name}
                  </Link>
                  <div className="font-bold text-sm mt-1" style={{ color: tokens.priceText }}>{priceDisplay.label}</div>
                  {config.showNote && item.note && (
                    <p className="mt-2 text-sm" style={{ color: tokens.metaText }}>{item.note}</p>
                  )}
                </div>
                <button
                  onClick={() =>{  void toggleWishlist({ customerId: item.customerId, productId: item.productId }); }}
                  className="self-start text-sm font-medium"
                  style={{ color: tokens.actionButtonBg }}
                >
                  Bỏ thích
                </button>
                {config.showAddToCartButton && (
                  <button
                    onClick={() => { void handleAddToCart(product._id); }}
                    className="self-start px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                    style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                    disabled={showStock && product.stock === 0}
                  >
                    <ShoppingCart size={12} />
                    {showStock && product.stock === 0 ? 'Hết hàng' : 'Thêm'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
