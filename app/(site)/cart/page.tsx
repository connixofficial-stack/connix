'use client';

import React, { useMemo, useState } from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { Clock, Minus, Package, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { getCartColors } from '@/components/site/cart/colors';
import { useCart, useCartExpiry } from '@/lib/cart';
import { useCartConfig } from '@/lib/experiences';
import type { Id } from '@/convex/_generated/dataModel';

const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(value);
const itemTypeLabel = (itemType?: 'product' | 'service' | 'course' | 'resource') => {
  if (itemType === 'service') return 'Dịch vụ';
  if (itemType === 'course') return 'Khóa học';
  if (itemType === 'resource') return 'Tài nguyên';
  return 'Sản phẩm';
};

export default function CartPage() {
  const brandColors = useBrandColors();
  const tokens = useMemo(
    () => getCartColors(brandColors.primary, brandColors.secondary, brandColors.mode),
    [brandColors.primary, brandColors.secondary, brandColors.mode]
  );
  const { cart, items, itemsCount, totalAmount, isLoading, updateQuantity, removeItem, clearCart, updateNote } = useCart();
  const cartConfig = useCartConfig();
  const commerceCapabilities = useQuery(api.cart.getCommerceCapabilities, {});
  const layoutStyle = cartConfig.layoutStyle;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'name-asc' | 'price-asc' | 'price-desc' | 'qty-desc'>('newest');

  const variantIds = useMemo(
    () => Array.from(new Set(
      items
        .map((item) => item.variantId)
        .filter((id): id is Id<'productVariants'> => Boolean(id))
    )),
    [items]
  );

  const variants = useQuery(
    api.productVariants.listByIds,
    variantIds.length > 0 ? { ids: variantIds } : 'skip'
  );

  const optionIds = useMemo(() => {
    if (!variants) {
      return [];
    }
    const ids = new Set(variants.flatMap((variant) => variant.optionValues.map((optionValue) => optionValue.optionId)));
    return Array.from(ids);
  }, [variants]);

  const valueIds = useMemo(() => {
    if (!variants) {
      return [];
    }
    const ids = new Set(variants.flatMap((variant) => variant.optionValues.map((optionValue) => optionValue.valueId)));
    return Array.from(ids);
  }, [variants]);

  const variantOptions = useQuery(
    api.productOptions.listByIds,
    optionIds.length > 0 ? { ids: optionIds } : 'skip'
  );

  const variantValues = useQuery(
    api.productOptionValues.listByIds,
    valueIds.length > 0 ? { ids: valueIds } : 'skip'
  );

  const variantTitleById = useMemo(() => {
    if (!variants) {
      return new Map();
    }
    const optionMap = new Map(variantOptions?.map((option) => [option._id, option]) ?? []);
    const valueMap = new Map(variantValues?.map((value) => [value._id, value]) ?? []);

    return new Map(
      variants.map((variant) => {
        const parts = variant.optionValues
          .map((optionValue) => {
            const optionName = optionMap.get(optionValue.optionId)?.name;
            const value = valueMap.get(optionValue.valueId);
            const valueLabel = optionValue.customValue ?? value?.label ?? value?.value;
            if (!valueLabel) {
              return null;
            }
            return optionName ? `${optionName}: ${valueLabel}` : valueLabel;
          })
          .filter((part): part is string => Boolean(part));

        return [variant._id, parts.join(' • ')];
      })
    );
  }, [variantOptions, variantValues, variants]);

  const handleUpdateQuantity = async (itemId: Id<'cartItems'>, quantity: number) => {
    await updateQuantity(itemId, quantity);
  };
  const renderQuantityControl = (item: (typeof items)[number], size: 'table' | 'sm' | 'md') => {
    if (item.itemType === 'course' || item.itemType === 'resource') {
      return (
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: tokens.surfaceSoft, color: tokens.metaText }}>
            1 {item.itemType === 'resource' ? 'tài nguyên' : 'khóa học'}
          </span>
        </div>
      );
    }

    const buttonClass = size === 'md'
      ? 'w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-[var(--qty-hover-bg)]'
      : size === 'table'
        ? 'w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-[var(--qty-hover-bg)]'
        : 'w-6 h-6 rounded border flex items-center justify-center hover:bg-[var(--qty-hover-bg)]';
    const countClass = size === 'md'
      ? 'w-8 text-center text-sm font-medium'
      : size === 'table'
        ? 'w-7 text-center text-sm font-medium'
        : 'w-6 text-center text-sm font-medium';
    const iconSize = size === 'md' ? 14 : 12;

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          style={{
            borderColor: tokens.quantityButtonBorder,
            backgroundColor: tokens.quantityButtonBg,
            ['--qty-hover-bg' as never]: tokens.quantityButtonHoverBg,
          }}
          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
        >
          <Minus size={iconSize} style={{ color: tokens.quantityButtonIcon }} />
        </button>
        <span className={countClass} style={{ color: tokens.bodyText }}>{item.quantity}</span>
        <button
          type="button"
          className={buttonClass}
          style={{
            borderColor: tokens.quantityButtonBorder,
            backgroundColor: tokens.quantityButtonBg,
            ['--qty-hover-bg' as never]: tokens.quantityButtonHoverBg,
          }}
          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
        >
          <Plus size={iconSize} style={{ color: tokens.quantityButtonIcon }} />
        </button>
      </div>
    );
  };

  const expiresAt = cart?.expiresAt ?? null;
  const { expiryText, isExpired } = useCartExpiry(expiresAt);
  const shouldShowExpiry = cartConfig.showExpiry && (expiryText || isExpired);

  const filteredItems = useMemo(() => {
    if (layoutStyle !== 'table') {
      return items;
    }

    let result = items;
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((item) => item.productName.toLowerCase().includes(query));
    }

    switch (sortOption) {
      case 'name-asc':
        result = [...result].sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'qty-desc':
        result = [...result].sort((a, b) => b.quantity - a.quantity);
        break;
      default:
        break;
    }

    return result;
  }, [items, layoutStyle, searchQuery, sortOption]);

  if (commerceCapabilities && !commerceCapabilities.cartAvailable) {
    const message = !commerceCapabilities.cartEnabled
      ? 'Hãy bật module Giỏ hàng để sử dụng tính năng này.'
      : !commerceCapabilities.ordersEnabled
        ? 'Hãy bật module Đơn hàng để sử dụng thanh toán.'
        : 'Hãy bật chế độ giỏ hàng cho ít nhất một module Sản phẩm, Dịch vụ hoặc Khóa học.';
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.emptyStateIconBg }}
        >
          <ShoppingCart size={32} style={{ color: tokens.emptyStateIcon }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.emptyStateTitle }}>Giỏ hàng chưa khả dụng</h1>
        <p style={{ color: tokens.emptyStateText }}>{message}</p>
      </div>
    );
  }


  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: tokens.skeletonBase }} />
          <div className="h-4 w-64 rounded-lg animate-pulse mt-3" style={{ backgroundColor: tokens.skeletonBase }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border p-4 flex gap-4 animate-pulse"
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                <div className="w-20 h-20 rounded-xl" style={{ backgroundColor: tokens.skeletonBase }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded" style={{ backgroundColor: tokens.skeletonBase }} />
                  <div className="h-4 w-1/2 rounded" style={{ backgroundColor: tokens.skeletonBase }} />
                </div>
              </div>
            ))}
          </div>
          <div
            className="rounded-2xl border p-4 h-48 animate-pulse"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
          />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.emptyStateIconBg }}
        >
          <Package size={32} style={{ color: tokens.emptyStateIcon }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.emptyStateTitle }}>Giỏ hàng trống</h1>
        <p className="mb-6" style={{ color: tokens.emptyStateText }}>Hãy chọn thêm sản phẩm, dịch vụ hoặc khóa học để tiếp tục.</p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium"
          style={{ backgroundColor: tokens.emptyStateActionBg, color: tokens.emptyStateActionText }}
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-3">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: tokens.headingColor }}>Giỏ hàng của bạn</h1>
          <p className="mt-2" style={{ color: tokens.metaText }}>{itemsCount} mục trong giỏ hàng.</p>
        </div>
        {shouldShowExpiry && (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: isExpired ? tokens.expiryExpiredText : tokens.expiryActiveText }}
          >
            <Clock size={14} />
            <span>{isExpired ? 'Giỏ hàng đã hết hạn' : `Giỏ hàng sẽ hết hạn sau ${expiryText}`}</span>
          </div>
        )}
      </div>

      {layoutStyle === 'table' ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm" style={{ color: tokens.metaText }}>Hiển thị {filteredItems.length} mục</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: tokens.searchIcon }} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm theo tên..."
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] placeholder:text-[var(--input-placeholder)]"
                  style={{
                    backgroundColor: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.inputText,
                    ['--focus-ring' as never]: tokens.inputFocusRing,
                    ['--input-placeholder' as never]: tokens.inputPlaceholder,
                  }}
                />
              </div>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as typeof sortOption)}
                className="w-full sm:w-48 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                style={{
                  backgroundColor: tokens.inputBg,
                  borderColor: tokens.inputBorder,
                  color: tokens.inputText,
                  ['--focus-ring' as never]: tokens.inputFocusRing,
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="name-asc">Tên A-Z</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="qty-desc">Số lượng giảm dần</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div
                className="hidden md:block overflow-hidden rounded-2xl border"
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: tokens.tableHeaderBg, color: tokens.tableHeaderText }}>
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Mục</th>
                      <th className="px-4 py-3 text-left font-medium">Đơn giá</th>
                      <th className="px-4 py-3 text-left font-medium">Số lượng</th>
                      <th className="px-4 py-3 text-left font-medium">Thành tiền</th>
                      <th className="px-4 py-3 text-right font-medium">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="border-t" style={{ borderColor: tokens.border }}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0"
                              style={{ backgroundColor: tokens.thumbBg }}
                            >
                              {item.productImage ? (
                                <Image src={item.productImage} alt={item.productName} width={48} height={48} className="w-full h-full object-cover" mode="thumb" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5" style={{ color: tokens.thumbIcon }} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium line-clamp-2" style={{ color: tokens.bodyText }}>{item.productName}</div>
                              <div className="text-[11px] font-medium mt-1" style={{ color: tokens.metaText }}>{itemTypeLabel(item.itemType)}</div>
                              {item.variantId && variantTitleById.get(item.variantId) && (
                                <div className="text-xs mt-1" style={{ color: tokens.metaText }}>{variantTitleById.get(item.variantId)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium" style={{ color: tokens.priceText }}>{formatPrice(item.price)}</td>
                        <td className="px-4 py-4">
                          {renderQuantityControl(item, 'table')}
                        </td>
                        <td className="px-4 py-4 font-semibold" style={{ color: tokens.bodyText }}>{formatPrice(item.subtotal)}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            className="group p-2 rounded-lg hover:bg-[var(--action-hover-bg)]"
                            style={{ ['--action-hover-bg' as never]: tokens.actionHoverBg }}
                            onClick={() => removeItem(item._id)}
                          >
                            <Trash2
                              size={16}
                              className="text-[var(--action-icon)] group-hover:text-[var(--action-icon-hover)]"
                              style={{
                                ['--action-icon' as never]: tokens.actionIcon,
                                ['--action-icon-hover' as never]: tokens.actionHoverIcon,
                              }}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {filteredItems.map(item => (
                  <div
                    key={item._id}
                    className="rounded-2xl border p-4 flex flex-col sm:flex-row gap-4"
                    style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: tokens.thumbBg }}>
                      {item.productImage ? (
                        <Image src={item.productImage} alt={item.productName} width={96} height={96} className="w-full h-full object-cover" mode="thumb" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6" style={{ color: tokens.thumbIcon }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base line-clamp-2" style={{ color: tokens.bodyText }}>{item.productName}</h3>
                      <div className="text-[11px] font-medium mt-1" style={{ color: tokens.metaText }}>{itemTypeLabel(item.itemType)}</div>
                      {item.variantId && variantTitleById.get(item.variantId) && (
                        <p className="text-xs mt-1" style={{ color: tokens.metaText }}>{variantTitleById.get(item.variantId)}</p>
                      )}
                      <div className="font-bold text-sm mt-1" style={{ color: tokens.priceText }}>{formatPrice(item.price)}</div>
                      <div className="mt-4">{renderQuantityControl(item, 'md')}</div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        type="button"
                        className="group p-2 rounded-lg hover:bg-[var(--action-hover-bg)]"
                        style={{ ['--action-hover-bg' as never]: tokens.actionHoverBg }}
                        onClick={() => removeItem(item._id)}
                      >
                        <Trash2
                          size={16}
                          className="text-[var(--action-icon)] group-hover:text-[var(--action-icon-hover)]"
                          style={{
                            ['--action-icon' as never]: tokens.actionIcon,
                            ['--action-icon-hover' as never]: tokens.actionHoverIcon,
                          }}
                        />
                      </button>
                      <div className="text-sm font-semibold" style={{ color: tokens.bodyText }}>{formatPrice(item.subtotal)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="text-sm"
                  style={{ color: tokens.metaText }}
                >
                  Xóa toàn bộ giỏ hàng
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {cartConfig.showNote && (
                <div className="rounded-2xl border p-4" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
                  <h4 className="font-medium text-sm mb-2" style={{ color: tokens.bodyText }}>Ghi chú đơn hàng</h4>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none placeholder:text-[var(--input-placeholder)]"
                    rows={3}
                    placeholder="Ghi chú cho shop..."
                    value={cart?.note ?? ''}
                    onChange={(event) => updateNote(event.target.value)}
                    style={{
                      backgroundColor: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.inputText,
                      ['--input-placeholder' as never]: tokens.inputPlaceholder,
                    }}
                  />
                </div>
              )}
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tokens.summaryBg }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: tokens.summaryLabel }}>Tạm tính</span>
                  <span className="font-medium" style={{ color: tokens.summaryValue }}>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: tokens.summaryLabel }}>Phí vận chuyển</span>
                  <span style={{ color: tokens.mutedText }}>Tính khi checkout</span>
                </div>
                <div className="border-t pt-3 flex justify-between" style={{ borderColor: tokens.border }}>
                  <span className="font-semibold" style={{ color: tokens.summaryTotalLabel }}>Tổng cộng</span>
                  <span className="text-lg font-bold" style={{ color: tokens.summaryTotalValue }}>{formatPrice(totalAmount)}</span>
                </div>
                <Link
                  href="/checkout?fromCart=true"
                  className="block w-full py-3 rounded-xl font-semibold text-sm text-center"
                  style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                >
                  Thanh toán
                </Link>
                <Link
                  href="/products"
                  className="block text-center text-sm"
                  style={{ color: tokens.linkText }}
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-xl border p-4" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
              {items.map(item => (
                <div key={item._id} className="flex flex-col sm:flex-row gap-4 py-3 border-b last:border-0" style={{ borderColor: tokens.itemDivider }}>
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: tokens.thumbBg }}>
                    {item.productImage ? (
                      <Image src={item.productImage} alt={item.productName} width={80} height={80} className="w-full h-full object-cover" mode="thumb" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5" style={{ color: tokens.thumbIcon }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2" style={{ color: tokens.bodyText }}>{item.productName}</h3>
                    <div className="text-[11px] font-medium mt-1" style={{ color: tokens.metaText }}>{itemTypeLabel(item.itemType)}</div>
                    {item.variantId && variantTitleById.get(item.variantId) && (
                      <p className="text-xs mt-1" style={{ color: tokens.metaText }}>{variantTitleById.get(item.variantId)}</p>
                    )}
                    <div className="text-sm font-semibold mt-1" style={{ color: tokens.priceText }}>{formatPrice(item.price)}</div>
                    <div className="mt-2">{renderQuantityControl(item, 'sm')}</div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      className="group p-1 rounded hover:bg-[var(--action-hover-bg)]"
                      style={{ ['--action-hover-bg' as never]: tokens.actionHoverBg }}
                      onClick={() => removeItem(item._id)}
                    >
                      <Trash2
                        size={14}
                        className="text-[var(--action-icon)] group-hover:text-[var(--action-icon-hover)]"
                        style={{
                          ['--action-icon' as never]: tokens.actionIcon,
                          ['--action-icon-hover' as never]: tokens.actionHoverIcon,
                        }}
                      />
                    </button>
                    <div className="text-sm font-semibold" style={{ color: tokens.bodyText }}>{formatPrice(item.subtotal)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => clearCart()}
                className="text-sm"
                style={{ color: tokens.metaText }}
              >
                Xóa toàn bộ giỏ hàng
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {cartConfig.showNote && (
              <div className="rounded-2xl border p-4" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
                <h4 className="font-medium text-sm mb-2" style={{ color: tokens.bodyText }}>Ghi chú đơn hàng</h4>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none placeholder:text-[var(--input-placeholder)]"
                  rows={3}
                  placeholder="Ghi chú cho shop..."
                  value={cart?.note ?? ''}
                  onChange={(event) => updateNote(event.target.value)}
                  style={{
                    backgroundColor: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.inputText,
                    ['--input-placeholder' as never]: tokens.inputPlaceholder,
                  }}
                />
              </div>
            )}
            <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tokens.summaryBg }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: tokens.summaryLabel }}>Tạm tính</span>
                <span className="font-medium" style={{ color: tokens.summaryValue }}>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: tokens.summaryLabel }}>Phí vận chuyển</span>
                <span style={{ color: tokens.mutedText }}>Tính khi checkout</span>
              </div>
              <div className="border-t pt-3 flex justify-between" style={{ borderColor: tokens.border }}>
                <span className="font-semibold" style={{ color: tokens.summaryTotalLabel }}>Tổng cộng</span>
                <span className="text-lg font-bold" style={{ color: tokens.summaryTotalValue }}>{formatPrice(totalAmount)}</span>
              </div>
              <Link
                href="/checkout?fromCart=true"
                className="block w-full py-3 rounded-xl font-semibold text-sm text-center"
                style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
              >
                Thanh toán
              </Link>
              <Link
                href="/products"
                className="block text-center text-sm"
                style={{ color: tokens.linkText }}
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
