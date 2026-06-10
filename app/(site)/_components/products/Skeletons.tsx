'use client';

import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { getProductsListColors, type ProductsListColors } from '@/components/site/products/colors';
import { getProductImageAspectRatioCssValue, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';

export function useProductImageAspectRatioSetting() {
  const setting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  return useMemo(() => resolveProductImageAspectRatio(setting?.value), [setting?.value]);
}

export function ProductsListSkeleton() {
  const brandColors = useBrandColors();
  const imageAspectRatio = useProductImageAspectRatioSetting();
  const tokens = useMemo(
    () => getProductsListColors(brandColors.primary, brandColors.secondary, brandColors.mode || 'single'),
    [brandColors.primary, brandColors.secondary, brandColors.mode]
  );
  const imageAspectRatioStyle = useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );

  return (
    <div className="py-8 md:py-12 px-4 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 w-64 rounded mx-auto" style={{ backgroundColor: tokens.filterChipBg }} />
        </div>
        <div
          className="rounded-xl border p-4 mb-8"
          style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 flex-1 max-w-xs rounded-lg" style={{ backgroundColor: tokens.filterChipBg }} />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 rounded-full" style={{ backgroundColor: tokens.filterChipBg }} />
              ))}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border"
              style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
            >
              <div style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }} />
              <div className="p-4 space-y-3">
                <div className="h-4 w-full rounded" style={{ backgroundColor: tokens.filterChipBg }} />
                <div className="h-5 w-24 rounded" style={{ backgroundColor: tokens.filterChipBg }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductsGridSkeleton({ count = 8, tokens }: { count?: number; tokens: ProductsListColors }) {
  const imageAspectRatio = useProductImageAspectRatioSetting();
  const imageAspectRatioStyle = useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden border"
          style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
        >
          <div style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }} />
          <div className="p-4 space-y-3">
            <div className="h-4 w-full rounded" style={{ backgroundColor: tokens.filterChipBg }} />
            <div className="h-5 w-24 rounded" style={{ backgroundColor: tokens.filterChipBg }} />
          </div>
        </div>
      ))}
    </div>
  );
}
