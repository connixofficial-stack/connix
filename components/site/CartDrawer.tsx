'use client';

import React, { useEffect, useMemo } from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCart, useCartExpiry } from '@/lib/cart';
import { useCartConfig } from '@/lib/experiences';
import { useBrandColors, useSiteSettings } from './hooks';
import { getCartColors } from './cart/colors';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
}).format(value);
const itemTypeLabel = (itemType?: 'product' | 'service' | 'course' | 'resource') => {
  if (itemType === 'service') return 'Dịch vụ';
  if (itemType === 'course') return 'Khóa học';
  if (itemType === 'resource') return 'Tài nguyên';
  return 'Sản phẩm';
};

export function CartDrawer() {
  const brandColors = useBrandColors();
  const { siteDarkMode } = useSiteSettings();
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const tokens = useMemo(
    () => getCartColors(brandColors.primary, brandColors.secondary, brandColors.mode, isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );
  const { cart, items, itemsCount, totalAmount, isDrawerOpen, closeDrawer, updateQuantity, removeItem, updateNote } = useCart();
  const { layoutStyle, showExpiry, showNote } = useCartConfig();
  const pathname = usePathname();

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

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

  const expiresAt = cart?.expiresAt ?? null;
  const { expiryText, isExpired } = useCartExpiry(expiresAt);
  const shouldShowExpiry = showExpiry && (expiryText || isExpired);

  if (layoutStyle !== 'drawer' || !isDrawerOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex">
      <button
        type="button"
        className="absolute inset-0"
        style={{ backgroundColor: tokens.drawerOverlayBg, opacity: 0.6 }}
        onClick={closeDrawer}
        aria-label="Đóng giỏ hàng"
      />
      <div
        className="ml-auto w-full max-w-sm h-full flex flex-col relative"
        style={{ backgroundColor: tokens.drawerSurface }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: tokens.drawerBorder }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: tokens.primary }} />
            <h3 className="font-semibold" style={{ color: tokens.drawerTitle }}>Giỏ hàng ({itemsCount})</h3>
          </div>
          <button
            type="button"
            className="p-1 rounded hover:bg-[var(--drawer-hover-bg)]"
            style={{ ['--drawer-hover-bg' as never]: tokens.surfaceSoft }}
            onClick={closeDrawer}
          >
            <X size={18} style={{ color: tokens.drawerCloseIcon }} />
          </button>
        </div>

        {shouldShowExpiry && (
          <div className="px-4 pt-3">
            <div
              className="flex items-center justify-center gap-1.5 text-xs"
              style={{ color: isExpired ? tokens.expiryExpiredText : tokens.expiryActiveText }}
            >
              <Clock size={12} />
              <span>{isExpired ? 'Giỏ hàng đã hết hạn' : `Giỏ hàng sẽ hết hạn sau ${expiryText}`}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
          {items.length === 0 && (
            <div className="text-sm text-center py-8" style={{ color: tokens.metaText }}>Giỏ hàng đang trống.</div>
          )}
          {items.map(item => {
            const isSingleQuantity = item.itemType === 'course' || item.itemType === 'resource';
            return (
            <div key={item._id} className="flex gap-3 py-3 border-b last:border-0" style={{ borderColor: tokens.itemDivider }}>
              <div className="w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden" style={{ backgroundColor: tokens.thumbBg }}>
                {item.productImage ? (
                  <Image src={item.productImage} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" mode="thumb" />
                ) : (
                  <div className="w-full h-full" style={{ backgroundColor: tokens.surfaceSoft }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2" style={{ color: tokens.bodyText }}>{item.productName}</h4>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: tokens.metaText }}>{itemTypeLabel(item.itemType)}</p>
                {item.variantId && variantTitleById.get(item.variantId) && (
                  <p className="text-xs mt-0.5" style={{ color: tokens.metaText }}>{variantTitleById.get(item.variantId)}</p>
                )}
                <p className="text-sm font-semibold mt-0.5" style={{ color: tokens.priceText }}>{formatVND(item.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  {isSingleQuantity ? (
                    <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: tokens.surfaceSoft, color: tokens.metaText }}>
                      1 {item.itemType === 'resource' ? 'tài nguyên' : 'khóa học'}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="w-6 h-6 rounded border flex items-center justify-center hover:bg-[var(--qty-hover-bg)]"
                        style={{
                          borderColor: tokens.quantityButtonBorder,
                          backgroundColor: tokens.quantityButtonBg,
                          ['--qty-hover-bg' as never]: tokens.quantityButtonHoverBg,
                        }}
                        onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                      >
                        <Minus size={12} style={{ color: tokens.quantityButtonIcon }} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center" style={{ color: tokens.bodyText }}>{item.quantity}</span>
                      <button
                        type="button"
                        className="w-6 h-6 rounded border flex items-center justify-center hover:bg-[var(--qty-hover-bg)]"
                        style={{
                          borderColor: tokens.quantityButtonBorder,
                          backgroundColor: tokens.quantityButtonBg,
                          ['--qty-hover-bg' as never]: tokens.quantityButtonHoverBg,
                        }}
                        onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                      >
                        <Plus size={12} style={{ color: tokens.quantityButtonIcon }} />
                      </button>
                    </>
                  )}
                </div>
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
                <span className="text-sm font-semibold" style={{ color: tokens.bodyText }}>{formatVND(item.subtotal)}</span>
              </div>
            </div>
          );})}
        </div>

        {showNote && (
          <div className="px-4 pb-2">
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none placeholder:text-[var(--input-placeholder)]"
              rows={2}
              placeholder="Ghi chú đơn hàng..."
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

        <div className="mt-auto px-4 py-4 border-t" style={{ borderColor: tokens.drawerBorder }}>
          <div className="flex justify-between mb-3">
            <span className="text-sm" style={{ color: tokens.summaryLabel }}>Tổng cộng</span>
            <span className="font-bold" style={{ color: tokens.summaryTotalValue }}>{formatVND(totalAmount)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/cart"
              onClick={closeDrawer}
              className="py-2 rounded-lg text-center text-sm font-medium border"
              style={{
                borderColor: tokens.secondaryButtonBorder,
                backgroundColor: tokens.secondaryButtonBg,
                color: tokens.secondaryButtonText,
              }}
            >
              Xem giỏ hàng
            </Link>
            <Link
              href="/checkout?fromCart=true"
              onClick={closeDrawer}
              className={`py-2 rounded-lg text-sm font-semibold text-center ${items.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
            >
              Thanh toán
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
