'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { ArrowRight, Package } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { cn } from '../../../components/ui';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { DEFAULT_SECTION_SPACING, getSectionSpacingClassName, normalizeSectionSpacing } from '../../_shared/types/sectionSpacing';
import { getProductListCardRadiusClassName, normalizeProductListCardRadius, type ProductListCardRadius, type ProductListPreviewItem, type ProductListStyle } from '../../product-list/_types';
import { ProductListPreview } from '../../product-list/_components/ProductListPreview';
import type { ProductGridStyle } from '../_types';
import { PRODUCT_GRID_STYLES } from '../_lib/constants';
import type { CategoryTabItem } from './ProductGridForm';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { SaleBadge } from '@/components/site/shared/BrandColorHelpers';
import { getProductImageAspectRatioCssValue, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { ProductCardActions } from '@/components/site/shared/ProductCardActions';
import { getProductsListColors } from '@/components/site/products/colors';
import { CategoryTabSlider } from '@/components/shared/CategoryTabSlider';
import { QuickAddVariantModal } from '@/components/products/QuickAddVariantModal';
import type { Id } from '@/convex/_generated/dataModel';
import { buildPreviewQuickAddProduct, type PreviewQuickAddAction, type PreviewQuickAddProduct } from '../../_shared/lib/previewQuickAdd';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export const ProductGridPreview = ({
  brandColor,
  secondary,
  itemCount,
  selectedStyle,
  onStyleChange,
  items,
  subTitle,
  sectionTitle,
  subtitle,
  fontStyle,
  fontClassName,
  categoryTabs,
  desktopColumns = 4,
  // Header config pass-through
  hideHeader,
  showTitle,
  showSubtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  spacing = DEFAULT_SECTION_SPACING,
  cornerRadius,
  showAddToCartButton,
  showBuyNowButton,
  cartButtonsLayout,
}: {
  brandColor: string;
  secondary: string;
  itemCount: number;
  desktopRows?: number;
  selectedStyle?: ProductGridStyle;
  onStyleChange?: (style: ProductGridStyle) => void;
  items?: ProductListPreviewItem[];
  subTitle?: string;
  sectionTitle?: string;
  subtitle?: string;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  categoryTabs?: CategoryTabItem[];
  desktopColumns?: 3 | 4 | 5 | 6;
  // Header config
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  spacing?: SectionSpacing;
  cornerRadius?: ProductListCardRadius;
  showAddToCartButton?: boolean;
  showBuyNowButton?: boolean;
  cartButtonsLayout?: 'stack' | 'grid-2';
}) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const visibleCategoryTabs = categoryTabs ?? [];
  const isMinimalStyle = (selectedStyle ?? 'commerce') === 'minimal';
  const previewStyle = selectedStyle ?? 'commerce';
  const sectionSpacingClassName = getSectionSpacingClassName(normalizeSectionSpacing(spacing));
  const cardRadiusClassName = getProductListCardRadiusClassName(normalizeProductListCardRadius(cornerRadius));
  const imageAspectRatio = useMemo(
    () => resolveProductImageAspectRatio(aspectRatioSetting?.value),
    [aspectRatioSetting?.value]
  );
  const imageAspectRatioStyle = useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  const tokens = React.useMemo(
    () => adaptTokensForDarkMode(getProductsListColors(brandColor, secondary, 'single'), isDark),
    [brandColor, secondary, isDark]
  );
  const [quickAddTarget, setQuickAddTarget] = React.useState<{ product: PreviewQuickAddProduct; action: PreviewQuickAddAction } | null>(null);
  const onPreviewAction = React.useCallback((item: ProductListPreviewItem | undefined, action: PreviewQuickAddAction) => {
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

  // Dynamic Tabs resolution: Lọc theo danh mục hoặc Tự động gôm tab
  const resolvedTabs = useMemo(() => {
    if (visibleCategoryTabs.length > 0) {
      return visibleCategoryTabs.map(t => ({ id: t._id || t.name, name: t.name }));
    }
    if (items && items.length > 0) {
      const uniqueCats = [...new Set(items.map(item => item.category).filter(Boolean))] as string[];
      return uniqueCats.slice(0, 5).map(name => ({ id: name, name }));
    }
    return [];
  }, [visibleCategoryTabs, items]);

  const hasTabs = resolvedTabs.length > 0;

  // Filter items by active tab (match by category name or id)
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!activeTab) return items;
    return items.filter(item => item.category === activeTab || (item as any).categoryId === activeTab);
  }, [items, activeTab]);

  const fallbackItems: ProductListPreviewItem[] = [
    { category: 'Smartphone', id: 1, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop&q=80', name: 'iPhone 15 Pro Max', originalPrice: '36.990.000đ', price: '34.990.000đ' },
    { category: 'Laptop', id: 2, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&h=500&fit=crop&q=80', name: 'MacBook Pro M3', price: '45.990.000đ' },
    { category: 'Audio', id: 3, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&h=500&fit=crop&q=80', name: 'Sony WH-1000XM5', originalPrice: '9.290.000đ', price: '8.490.000đ' },
    { category: 'Wearable', id: 4, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&h=500&fit=crop&q=80', name: 'Apple Watch Ultra 2', price: '21.990.000đ' },
    { category: 'Tablet', id: 5, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&q=80', name: 'iPad Air 5 M1', originalPrice: '16.500.000đ', price: '14.990.000đ' },
    { category: 'Audio', id: 6, image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&h=500&fit=crop&q=80', name: 'Marshall Stanmore III', price: '9.890.000đ' },
    { category: 'Accessories', id: 7, image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&h=500&fit=crop&q=80', name: 'Logitech MX Master 3S', price: '2.490.000đ' },
    { category: 'Camera', id: 8, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop&q=80', name: 'Fujifilm X-T5', originalPrice: '45.000.000đ', price: '42.990.000đ' },
  ];

  const displayItems = filteredItems.length > 0 ? filteredItems : (items && items.length > 0 ? items : fallbackItems.slice(0, Math.max(itemCount, 8)));
  const selectedCategoryEmpty = (activeTab !== null && filteredItems.length === 0) || (items && items.length === 0);

  const getDiscount = (price?: string, originalPrice?: string) => {
    if (!price || !originalPrice) return null;
    const parsedPrice = Number.parseInt(price.replaceAll(/\D/g, ''));
    const parsedOriginal = Number.parseInt(originalPrice.replaceAll(/\D/g, ''));
    if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedOriginal) || parsedOriginal <= parsedPrice) return null;
    return `-${Math.round(((parsedOriginal - parsedPrice) / parsedOriginal) * 100)}%`;
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

  const renderEmptyCategoryState = () => {
    const adminProductsUrl = '/admin/products';
    return (
      <div className="rounded-2xl border border-dashed px-6 py-12 text-center shadow-sm" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
        <Package size={40} className="mx-auto mb-3" style={{ color: tokens.emptyStateIconColor }} />
        <p className="text-sm font-medium mb-4" style={{ color: tokens.emptyStateText }}>Danh mục này hiện chưa có sản phẩm nào.</p>
        <a
          href={adminProductsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          style={{ backgroundColor: tokens.primaryActionBg, color: tokens.primaryActionText }}
        >
          Quản lý sản phẩm ngay
        </a>
      </div>
    );
  };

  const renderPreviewHeader = (className = 'mb-6') => (
    <SectionHeader
      title={sectionTitle ?? 'Sản phẩm nổi bật'}
      subtitle={subtitle ?? ''}
      badgeText={subTitle}
      hideHeader={hideHeader}
      showTitle={showTitle}
      showSubtitle={showSubtitle}
      showBadge={showBadge}
      headerAlign={headerAlign}
      titleColorPrimary={titleColorPrimary}
      subtitleAboveTitle={subtitleAboveTitle}
      uppercaseText={uppercaseText}
      brandColor={brandColor}
      className={className}
    />
  );

  const gridColsClass = device === 'mobile'
    ? (desktopColumns === 6 ? 'grid-cols-3' : 'grid-cols-2')
    : device === 'tablet'
      ? (desktopColumns === 3 ? 'grid-cols-3' : desktopColumns === 6 ? 'grid-cols-3' : 'grid-cols-2')
      : desktopColumns === 3
        ? 'grid-cols-3'
        : desktopColumns === 5
          ? 'grid-cols-5'
          : desktopColumns === 6
            ? 'grid-cols-6'
            : 'grid-cols-4';


  const renderStorefrontStyle = () => {
    if (previewStyle === 'tabbed') {
      return (
        <>
          <PreviewWrapper
            title="Preview Sản phẩm"
            device={device}
            setDevice={setDevice}
            previewStyle={previewStyle}
            setPreviewStyle={(style) => onStyleChange?.(style as ProductGridStyle)}
            styles={PRODUCT_GRID_STYLES as { id: string; label: string }[]}
            deviceWidthClass={deviceWidths[device]}
            fontStyle={fontStyle}
            fontClassName={fontClassName}
          >
            <BrowserFrame url="yoursite.com/products">
              <section
                className={cn(sectionSpacingClassName, 'px-4 md:px-6')}
                style={{ backgroundColor: brandColor }}
              >
                <div className="max-w-7xl mx-auto">
                  {renderPreviewHeader('mb-6')}

                  {hasTabs && (
                    <div className="mb-6">
                      <CategoryTabSlider
                        tabs={resolvedTabs}
                        activeTabId={activeTab}
                        onTabChange={(tabId) => setActiveTab(tabId === activeTab ? null : tabId)}
                        brandColor={brandColor}
                        brandBgColor={brandColor}
                        showAllTab={false}
                        allTabLabel="Tất cả"
                      />
                    </div>
                  )}

                  {selectedCategoryEmpty ? renderEmptyCategoryState() : (
                    <div className={`grid ${gridColsClass} gap-3 md:gap-4`}>
                      {displayItems.slice(0, itemCount).map((item) => {
                    const discount = getDiscount(item.price, item.originalPrice);
                    return (
                      <div
                        key={item.id}
                        className={cn('group border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer', cardRadiusClassName)}
                        style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
                      >
                        <div className="relative overflow-hidden" style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterBarBackground }}>
                          {item.image ? (
                            <PreviewImage
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package size={40} style={{ color: tokens.emptyStateIconColor }} />
                            </div>
                          )}
                          {discount && (
                            <div className="absolute top-2 left-2">
                              <SaleBadge text={discount} className="text-[10px] px-2 py-1" />
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-base truncate group-hover:opacity-80 transition-colors" style={{ color: tokens.bodyText }}>
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-auto pt-2 mb-4">
                            <span className="font-bold text-base" style={{ color: tokens.priceColor }}>{item.price}</span>
                            {item.originalPrice && (
                              <span className="text-xs line-through" style={{ color: tokens.priceOriginalText }}>
                                {item.originalPrice}
                              </span>
                            )}
                          </div>
                          {showAddToCartButton || showBuyNowButton ? (
                            <ProductCardActions
                              product={{
                                _id: String(item.id),
                                name: item.name,
                                price: item.price ? Number(item.price.replace(/\D/g, '')) : undefined,
                                salePrice: item.price ? Number(item.price.replace(/\D/g, '')) : undefined,
                              }}
                              tokens={tokens}
                              showStock={false}
                              showAddToCartButton={!!showAddToCartButton}
                              showBuyNowButton={!!showBuyNowButton}
                              buyNowLabel="Mua ngay"
                              onAddToCart={() => onPreviewAction(item, 'addToCart')}
                              onBuyNow={() => onPreviewAction(item, 'buyNow')}
                              cartButtonsLayout={cartButtonsLayout}
                              device={device}
                            />
                          ) : (
                            <button
                              type="button"
                              className="w-full gap-1.5 border-2 py-1.5 px-4 rounded-lg font-medium flex items-center justify-center transition-colors hover:bg-opacity-10 whitespace-nowrap text-xs md:text-sm"
                              style={{ borderColor: tokens.secondaryActionBorder, color: tokens.secondaryActionText, backgroundColor: tokens.secondaryActionHoverBg }}
                            >
                              Xem chi tiết <ArrowRight className="w-3 h-3 flex-shrink-0" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                      })}
                    </div>
                  )}

                  {displayItems.length >= 3 && (
                    <div className="flex justify-center mt-8">
                      <button
                        type="button"
                        className="px-10 py-3 rounded-full text-sm font-bold bg-white text-slate-900 hover:bg-slate-50 transition-colors shadow-md"
                      >
                        Xem tất cả
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </BrowserFrame>
          </PreviewWrapper>
          <ColorInfoPanel brandColor={brandColor} secondary={secondary} />
          <QuickAddVariantModal
            isOpen={quickAddTarget !== null}
            product={quickAddModalProduct}
            brandColor={brandColor}
            actionLabel={quickAddTarget?.action === 'addToCart' ? 'Thêm vào giỏ' : 'Mua ngay'}
            onClose={() => setQuickAddTarget(null)}
            onConfirm={() => setQuickAddTarget(null)}
          />
        </>
      );
    }

    return (
    <>
      <PreviewWrapper
        title="Preview Sản phẩm"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={(style) => onStyleChange?.(style as ProductGridStyle)}
        styles={PRODUCT_GRID_STYLES as { id: string; label: string }[]}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/products">
          <section className={cn(sectionSpacingClassName, 'px-4 md:px-6')}>
            <div className="max-w-7xl mx-auto">
              {renderPreviewHeader('mb-6')}

              {hasTabs && (
                <div
                  className="flex items-center gap-3 px-4 md:px-6 py-2 overflow-x-auto rounded-t-lg mb-4"
                  style={{ backgroundColor: brandColor }}
                >
                  <span className="font-bold text-sm whitespace-nowrap text-white" style={{ color: textOnBrand }}>Danh mục:</span>
                  <div className="flex-1 overflow-hidden">
                    <CategoryTabSlider
                      tabs={resolvedTabs}
                      activeTabId={activeTab}
                      onTabChange={(tabId) => setActiveTab(tabId === activeTab ? null : tabId)}
                      brandColor={brandColor}
                      brandBgColor={brandColor}
                      showAllTab={false}
                      allTabLabel="Tất cả"
                    />
                  </div>
                </div>
              )}

              <div className="py-2">
                {selectedCategoryEmpty ? renderEmptyCategoryState() : (
                  <div className={`grid ${gridColsClass} gap-4 md:gap-6`}>
                    {displayItems.slice(0, itemCount).map((item) => {
                    const discount = getDiscount(item.price, item.originalPrice);
                    return (
                      <div
                        key={item.id}
                        className={cn('group border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer', cardRadiusClassName)}
                        style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
                      >
                        <div className="relative overflow-hidden" style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterBarBackground }}>
                          {item.image ? (
                            <PreviewImage
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package size={40} style={{ color: tokens.emptyStateIconColor }} />
                            </div>
                          )}
                          {discount && (
                            <div className="absolute top-2 left-2">
                              <SaleBadge text={discount} className="text-[10px] px-2 py-1" />
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-base truncate group-hover:opacity-80 transition-colors" style={{ color: tokens.bodyText }}>
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-auto pt-2 mb-4">
                            <span className="font-bold text-base" style={{ color: tokens.priceColor }}>{item.price}</span>
                            {item.originalPrice && (
                              <span className="text-xs line-through" style={{ color: tokens.priceOriginalText }}>
                                {item.originalPrice}
                              </span>
                            )}
                          </div>
                          {showAddToCartButton || showBuyNowButton ? (
                            <ProductCardActions
                              product={{
                                _id: String(item.id),
                                name: item.name,
                                price: item.price ? Number(item.price.replace(/\D/g, '')) : undefined,
                                salePrice: item.price ? Number(item.price.replace(/\D/g, '')) : undefined,
                              }}
                              tokens={tokens}
                              showStock={false}
                              showAddToCartButton={!!showAddToCartButton}
                              showBuyNowButton={!!showBuyNowButton}
                              buyNowLabel="Mua ngay"
                              onAddToCart={() => onPreviewAction(item, 'addToCart')}
                              onBuyNow={() => onPreviewAction(item, 'buyNow')}
                              cartButtonsLayout={cartButtonsLayout}
                              device={device}
                            />
                          ) : (
                            <button
                              type="button"
                              className="w-full gap-1.5 border-2 py-1.5 px-4 rounded-lg font-medium flex items-center justify-center transition-colors hover:bg-opacity-10 whitespace-nowrap text-xs md:text-sm"
                              style={{ borderColor: tokens.secondaryActionBorder, color: tokens.secondaryActionText, backgroundColor: tokens.secondaryActionHoverBg }}
                            >
                              Xem chi tiết <ArrowRight className="w-3 h-3 flex-shrink-0" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}

                {displayItems.length >= 3 && (
                  <div className="flex justify-center mt-8">
                    <button
                      type="button"
                      className="px-10 py-3 rounded-full text-sm font-bold border-2 transition-colors hover:bg-opacity-10"
                      style={{ borderColor: tokens.secondaryActionBorder, color: tokens.secondaryActionText, backgroundColor: tokens.secondaryActionHoverBg }}
                    >
                      Xem thêm sản phẩm
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </BrowserFrame>
      </PreviewWrapper>
      <ColorInfoPanel brandColor={brandColor} secondary={secondary} />
      <QuickAddVariantModal
        isOpen={quickAddTarget !== null}
        product={quickAddModalProduct}
        brandColor={brandColor}
        actionLabel={quickAddTarget?.action === 'addToCart' ? 'Thêm vào giỏ' : 'Mua ngay'}
        onClose={() => setQuickAddTarget(null)}
        onConfirm={() => setQuickAddTarget(null)}
      />
    </>
    );
  };

  if (previewStyle === 'tabbed' || previewStyle === 'storefront') {
    return renderStorefrontStyle();
  }

  // Pill tabs — for non-minimal layouts
  const pillTabsSlot = hasTabs ? (
    <div className="mb-3 md:mb-4">
      <CategoryTabSlider
        tabs={resolvedTabs}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId === activeTab ? null : tabId)}
        brandColor={brandColor}
        showAllTab={false}
        allTabLabel="Tất cả"
      />
    </div>
  ) : undefined;

  // Text+underline tabs — for minimal/E-commerce (inline with header right)
  const minimalTabsSlot = hasTabs ? (
    <div className="max-w-[280px] md:max-w-[400px] overflow-hidden shrink-0">
      <CategoryTabSlider
        tabs={resolvedTabs}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId === activeTab ? null : tabId)}
        brandColor={brandColor}
        showAllTab={false}
        allTabLabel="Tất cả"
      />
    </div>
  ) : undefined;

  return (
    <ProductListPreview
      brandColor={brandColor}
      secondary={secondary}
      itemCount={itemCount}
      componentType="ProductGrid"
      selectedStyle={(selectedStyle ?? 'commerce') as ProductListStyle}
      onStyleChange={(s) => {
        onStyleChange?.(s as ProductGridStyle);
      }}
      styles={PRODUCT_GRID_STYLES as { id: string; label: string }[]}
      items={filteredItems}
      subTitle={subTitle}
      sectionTitle={sectionTitle}
      subtitle={subtitle}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
      hideHeader={hideHeader}
      showTitle={showTitle}
      showSubtitle={showSubtitle}
      headerAlign={headerAlign}
      titleColorPrimary={titleColorPrimary}
      subtitleAboveTitle={subtitleAboveTitle}
      uppercaseText={uppercaseText}
      showBadge={showBadge}
      categoryTabsSlot={isMinimalStyle ? undefined : pillTabsSlot}
      headerRightSlot={isMinimalStyle ? minimalTabsSlot : undefined}
      forceEmpty={selectedCategoryEmpty}
      emptyMessage="Danh mục này chưa có sản phẩm."
      spacing={spacing}
      cardRadius={cornerRadius}
      showAddToCartButton={showAddToCartButton}
      showBuyNowButton={showBuyNowButton}
      cartButtonsLayout={cartButtonsLayout}
    />
  );
};
