'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { PRODUCT_CATEGORIES_STYLES } from '../_lib/constants';
import { getProductCategoriesColors } from '../_lib/colors';
import {
  getProductCategoriesPreviewInfo,
  ProductCategoriesPreviewHint,
  ProductCategoriesSectionShared,
} from './ProductCategoriesSectionShared';
import type {
  CategoryData,
  DemoProductCategoryItem,
  ProductCategoriesAlign,
  ProductCategoriesBrandMode,
  ProductCategoriesConfig,
  ProductCategoriesResolvedItem,
  ProductCategoriesSelectionMode,
  ProductCategoriesStyle,
} from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export const ProductCategoriesPreview = ({ 
  config, 
  title,
  brandColor, 
  secondary,
  mode,
  selectedStyle, 
  onStyleChange,
  categoriesData,
  fontStyle,
  fontClassName,
  selectionMode = 'real',
  demoCategories = [],
}: { 
  config: ProductCategoriesConfig;
  title?: string;
  brandColor: string;
  secondary: string;
  mode: ProductCategoriesBrandMode;
  selectedStyle?: ProductCategoriesStyle;
  onStyleChange?: (style: ProductCategoriesStyle) => void;
  categoriesData: CategoryData[];
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  selectionMode?: ProductCategoriesSelectionMode;
  demoCategories?: DemoProductCategoryItem[];
}) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const previewStyle = (selectedStyle ?? config.style) || 'image-strip';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as ProductCategoriesStyle);
  const colors = React.useMemo(() => adaptTokensForDarkMode(getProductCategoriesColors(brandColor, secondary, mode), isDark), [brandColor, secondary, mode, isDark]);
  const productsData = useQuery(api.products.listPublicResolved, { limit: 100 });
  const categoriesConfig = React.useMemo(() => config.categories ?? [], [config.categories]);

  const productIdsForImages = React.useMemo(() => {
    const ids: string[] = [];
    for (const item of categoriesConfig) {
      if (item.imageMode === 'product-image' && item.customImage?.startsWith('product:')) {
        const id = item.customImage.replace('product:', '');
        if (id) ids.push(id);
      }
    }
    return ids;
  }, [categoriesConfig]);

  const targetProductsData = useQuery(api.products.listByIds, { ids: productIdsForImages as any });
  const categoriesWithStats = useQuery(api.productCategories.listActiveWithStats, { productLimit: 5000 });

  const categoryMap = React.useMemo(() => {
    const map: Record<string, CategoryData> = {};
    for (const cat of categoriesData) {
      map[cat._id] = cat;
    }
    return map;
  }, [categoriesData]);

  const productImageMap = React.useMemo(() => {
    const map: Record<string, { image?: string }> = {};
    if (productsData) {
      for (const product of productsData) {
        map[product._id] = { image: product.image };
      }
    }
    if (targetProductsData) {
      for (const product of targetProductsData) {
        map[product._id] = { image: product.image };
      }
    }
    return map;
  }, [productsData, targetProductsData]);

  const productCountMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (categoriesWithStats?.stats) {
      for (const stat of categoriesWithStats.stats) {
        map[stat.categoryId] = stat.productCount;
      }
    }
    return map;
  }, [categoriesWithStats]);

  const uniqueCategories = React.useMemo(() => (
    categoriesConfig.filter((item, index, arr) => {
      if (!item.categoryId) {return true;}
      return arr.findIndex(i => i.categoryId === item.categoryId) === index;
    })
  ), [categoriesConfig]);
  const duplicateCount = categoriesConfig.length - uniqueCategories.length;

  const resolvedCategories = uniqueCategories
    .map((item, idx) => {
      const cat = categoryMap[item.categoryId];
      if (!cat) {return null;}
      const imageMode = item.imageMode ?? 'default';
      let displayImage = cat.image;
      let displayIcon: string | undefined;
      
      if (imageMode === 'icon' && item.customImage?.startsWith('icon:')) {
        displayIcon = item.customImage.replace('icon:', '');
        displayImage = undefined;
      } else if (imageMode === 'product-image' && item.customImage?.startsWith('product:')) {
        const productId = item.customImage.replace('product:', '');
        displayImage = productImageMap[productId]?.image ?? cat.image;
      } else if (imageMode === 'upload' || imageMode === 'url') {
        displayImage = item.customImage ?? cat.image;
      }
      
      return {
        ...cat,
        itemId: item.id || idx,
        displayImage,
        displayIcon,
        imageMode,
        id: item.categoryId,
        productCount: productCountMap[item.categoryId] || 0,
      };
    })
    .filter(Boolean) as ProductCategoriesResolvedItem[];

  // Demo mode: convert demo items to resolved format
  const demoResolvedItems: ProductCategoriesResolvedItem[] | undefined =
    selectionMode === 'demo' && demoCategories.length > 0
      ? demoCategories.map((item, idx) => ({
          id: item.id,
          itemId: idx,
          name: item.name || `Danh mục ${idx + 1}`,
          displayImage: item.image,
          productCount: item.productCount ?? 0,
          link: item.link,
        }))
      : undefined;

  const finalItems = demoResolvedItems ?? resolvedCategories;
  const subtitle = typeof config.subtitle === 'string'
    ? config.subtitle
    : typeof config.subheading === 'string'
      ? config.subheading
      : '';
  const headerAlign = (config.headerAlign as ProductCategoriesAlign) ?? (config.align as ProductCategoriesAlign) ?? 'center';

  return (
    <>
      {duplicateCount > 0 && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Có {duplicateCount} danh mục bị trùng lặp. Preview đã ẩn bớt để khớp trang chủ.
        </div>
      )}
      <PreviewWrapper 
        title="Danh mục sản phẩm" 
        device={device} 
        setDevice={setDevice} 
        previewStyle={previewStyle} 
        setPreviewStyle={setPreviewStyle} 
        styles={PRODUCT_CATEGORIES_STYLES} 
        info={getProductCategoriesPreviewInfo({ count: finalItems.length, style: previewStyle, mode })}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          <ProductCategoriesSectionShared
            title={title ?? 'Danh mục sản phẩm'}
            subtitle={subtitle}
            subheading={subtitle}
            headerAlign={headerAlign}
            align={headerAlign}
            hideHeader={config.hideHeader}
            showTitle={config.showTitle}
            showSubtitle={config.showSubtitle}
            titleColorPrimary={config.titleColorPrimary}
            subtitleAboveTitle={config.subtitleAboveTitle}
            uppercaseText={config.uppercaseText}
            showBadge={config.showBadge}
            badgeText={config.badgeText}
            style={previewStyle}
            items={finalItems}
            colors={colors}
            brandColor={brandColor}
            context="preview"
            device={device}
            mode={mode}
            showProductCount={config.showProductCount}
            spacing={config.spacing}
            cornerRadius={config.cornerRadius}
            desktopColumns={config.desktopColumns}
            fontClassName={fontClassName}
            fontStyle={fontStyle}
            getItemHref={(item) => item.link || `#`}
          />
        </BrowserFrame>
      </PreviewWrapper>

      <ColorInfoPanel brandColor={brandColor} secondary={secondary} />
      <ProductCategoriesPreviewHint style={previewStyle} />
    </>
  );
};
