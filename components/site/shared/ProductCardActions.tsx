'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { type ProductsListColors } from '@/components/site/products/colors';

interface ProductCardActionsProps {
  product: {
    _id: string;
    name: string;
    price?: number;
    salePrice?: number;
    slug?: string | null;
    categoryId?: string;
    stock?: number;
    hasVariants?: boolean;
  };
  tokens: ProductsListColors;
  showStock: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  buyNowLabel: string;
  onAddToCart: (product: any) => void;
  onBuyNow: (product: any) => void;
  cartButtonsLayout?: 'stack' | 'grid-2';
  device?: 'desktop' | 'tablet' | 'mobile';
  isOnDarkBg?: boolean;
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
  cartButtonsLayout,
  device,
  isOnDarkBg = false,
}: ProductCardActionsProps) {
  if (!showAddToCartButton && !showBuyNowButton) {
    return null;
  }

  const isOutOfStock = showStock && !product.hasVariants && (product.stock ?? 0) <= 0;

  if (isOutOfStock) {
    return (
      <div className="mt-1.5 sm:mt-2 w-full">
        <div
          className="w-full rounded-full py-1.5 sm:py-2 text-[10px] xs:text-[11px] sm:text-xs font-medium tracking-wide flex items-center justify-center bg-slate-100/70 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-500 border border-slate-200/10 cursor-not-allowed select-none"
        >
          <span>Hết hàng</span>
        </div>
      </div>
    );
  }

  const isGrid2 = cartButtonsLayout === 'grid-2' && showAddToCartButton && showBuyNowButton;
  const actionHeightClass = showAddToCartButton && showBuyNowButton && !isGrid2 ? 'min-h-[72px]' : 'min-h-[32px]';
  const gridColsClass = isGrid2 ? 'grid-cols-2' : 'grid-cols-1';

  const isCompact = isGrid2 || device === 'mobile';
  const fontSizeClass = isCompact
    ? 'text-[10px] xs:text-[11px] sm:text-xs font-semibold px-0.5'
    : 'text-xs sm:text-sm font-semibold px-2';
  const paddingClass = isCompact ? 'py-1 sm:py-1.5' : 'py-1.5 sm:py-2';
  const gapClass = isCompact ? 'gap-1' : 'gap-1.5 sm:gap-2';

  return (
    <div className={`mt-1.5 sm:mt-2 grid ${gridColsClass} ${gapClass} ${actionHeightClass}`}>
      {showAddToCartButton && (
        <button
          className={`w-full rounded-full ${paddingClass} ${fontSizeClass} transition-all duration-300 flex items-center justify-center whitespace-nowrap disabled:opacity-55 disabled:cursor-not-allowed hover:brightness-95 hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow`}
          style={{ backgroundColor: tokens.primaryActionBg, color: tokens.primaryActionText }}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAddToCart(product); }}
        >
          <ShoppingCart size={13} className="mr-1 sm:mr-1.5 shrink-0" />
          <span>Thêm giỏ</span>
        </button>
      )}
      {showBuyNowButton && (
        <button
          className={`w-full rounded-full ${paddingClass} ${fontSizeClass} border transition-all duration-300 flex items-center justify-center whitespace-nowrap disabled:opacity-55 disabled:cursor-not-allowed hover:bg-[var(--btn-hover-bg)] hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow`}
          style={{
            backgroundColor: isOnDarkBg ? (tokens.secondaryActionHoverBg || '#f8fafc') : 'transparent',
            borderColor: isOnDarkBg ? 'transparent' : tokens.secondaryActionBorder,
            color: tokens.secondaryActionText,
            '--btn-hover-bg': isOnDarkBg ? '#ffffff' : tokens.secondaryActionHoverBg,
          } as React.CSSProperties}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); onBuyNow(product); }}
        >
          <span>Mua ngay</span>
        </button>
      )}
    </div>
  );
}
