'use client';

import React, { useCallback } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useCartConfig } from '@/lib/experiences';
import type { MenuColors } from './header/colors';
import { getMenuColors } from './header/colors';

type CartIconProps = {
  variant?: 'mobile' | 'desktop';
  className?: string;
  tokens?: MenuColors;
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CartIcon({ variant = 'desktop', className, tokens }: CartIconProps) {
  const router = useRouter();
  const { itemsCount, openDrawer } = useCart();
  const { layoutStyle } = useCartConfig();
  const palette = getMenuColors('#3b82f6', undefined, 'single');
  const mergedTokens = tokens ?? palette;

  const handleClick = useCallback(() => {
    if (layoutStyle === 'drawer') {
      openDrawer();
      return;
    }
    router.push('/cart');
  }, [layoutStyle, openDrawer, router]);

  const baseStyle: React.CSSProperties = {
    color: mergedTokens.iconButtonText,
    '--menu-icon-hover': mergedTokens.iconButtonHoverText,
  } as React.CSSProperties;

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn('p-2 relative', className)}
        style={{ color: mergedTokens.iconButtonText }}
      >
        <ShoppingCart size={20} />
        <span
          className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center"
          style={{ backgroundColor: mergedTokens.badgeBg, color: mergedTokens.badgeText }}
        >
          {itemsCount}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn('p-2 transition-colors flex flex-col items-center text-xs gap-0.5 relative hover:text-[var(--menu-icon-hover)]', className)}
      style={baseStyle}
    >
      <ShoppingCart size={20} />
      <span>Giỏ hàng</span>
      <span
        className="absolute top-0 right-0 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center"
        style={{ backgroundColor: mergedTokens.badgeBg, color: mergedTokens.badgeText }}
      >
        {itemsCount}
      </span>
    </button>
  );
}
