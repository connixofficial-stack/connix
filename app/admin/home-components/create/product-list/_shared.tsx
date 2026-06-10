'use client';

import React, { useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Bot, Briefcase, Check, FileText, GripVertical, Package, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { Button, Card, CardContent, Input, Label, cn } from '../../../components/ui';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { getHomeComponentPriceLabel, resolveSaleMode } from '../../_shared/lib/productPrice';
import { BlogPreview } from '../../blog/_components/BlogPreview';
import type { BlogPostItem } from '../../blog/_components/BlogForm';
import { sortBlogPosts } from '../../blog/_lib/constants';
import type { BlogStyle } from '../../blog/_types';
import { ProductListPreview } from '../../product-list/_components/ProductListPreview';
import { DEFAULT_PRODUCT_LIST_CARD_RADIUS, DEFAULT_PRODUCT_LIST_DESKTOP_COLUMNS, type ProductListCardRadius, type ProductListDesktopColumns, type ProductListPreviewItem, type ProductListStyle } from '../../product-list/_types';
import type { DemoProductItem } from '../../product-list/_types';
import { DemoItemImageUploader } from '../../product-list/_components/ProductListForm';
import { AiDemoProductsImport, AiDemoServicesImport } from '../../product-list/_components/AiDemoProductsImport';
import { DEFAULT_DEMO_PRODUCTS } from '../../product-list/_lib/constants';
import type { DemoServiceItem } from '../../service-list/_types';
import { DEFAULT_DEMO_SERVICES } from '../../service-list/_components/ServiceListForm';
import { ServiceListPreview } from '../../service-list/_components/ServiceListPreview';
import type {
  ServiceListCardRadius,
  ServiceListDesktopColumns,
  ServiceListPreviewItem,
  ServiceListStyle,
} from '../../service-list/_types';
import {
  DEFAULT_SERVICE_LIST_CARD_RADIUS,
  DEFAULT_SERVICE_LIST_DESKTOP_COLUMNS,
} from '../../service-list/_types';

type ComponentType = 'ProductList' | 'ServiceList' | 'Blog';

interface ProductListCreateSharedProps {
  type: ComponentType;
  titleLabel?: string;
}

const DEFAULT_TITLES: Record<ComponentType, string> = {
  Blog: 'Tin tức / Blog',
  ProductList: 'Danh sách Sản phẩm',
  ServiceList: 'Danh sách Dịch vụ'
};

const toIntOrDefault = (value: string, fallback: number) => Number.parseInt(value, 10) || fallback;

export function ProductListCreateShared({ type, titleLabel }: ProductListCreateSharedProps) {
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm(titleLabel ?? DEFAULT_TITLES[type], type);
  const colorOverrideType = type === 'ProductList' ? 'ProductList' : type;
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(colorOverrideType, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(colorOverrideType, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const enableFont = type === 'ProductList' || type === 'ServiceList' || type === 'Blog';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [itemCount, setItemCount] = useState(8);
  const [sortBy, setSortBy] = useState(type === 'ProductList' ? 'newest' : 'popular');
  const [blogStyle, setBlogStyle] = useState<BlogStyle>('layout1');
  const [productStyle, setProductStyle] = useState<ProductListStyle>('commerce');
  const [serviceStyle, setServiceStyle] = useState<ServiceListStyle>('grid');

  const [subTitle, setSubTitle] = useState(type === 'ProductList' ? 'Bộ sưu tập' : '');
  const [sectionTitle, setSectionTitle] = useState(type === 'ProductList' ? 'Sản phẩm nổi bật' : '');

  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual' | 'demo'>('auto');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [postSearchTerm, setPostSearchTerm] = useState('');

  const [demoProducts, setDemoProducts] = useState<DemoProductItem[]>([]);
  const [demoServices, setDemoServices] = useState<DemoServiceItem[]>([]);

  // Header config state
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitleHeader, setShowTitleHeader] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header', 'display', 'source'], true);
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [cardRadius, setCardRadius] = useState<ProductListCardRadius>(DEFAULT_PRODUCT_LIST_CARD_RADIUS);
  const [productDesktopColumns, setProductDesktopColumns] = useState<ProductListDesktopColumns>(DEFAULT_PRODUCT_LIST_DESKTOP_COLUMNS);
  const [serviceCardRadius, setServiceCardRadius] = useState<ServiceListCardRadius>(DEFAULT_SERVICE_LIST_CARD_RADIUS);
  const [serviceDesktopColumns, setServiceDesktopColumns] = useState<ServiceListDesktopColumns>(DEFAULT_SERVICE_LIST_DESKTOP_COLUMNS);

  // Cart buttons settings
  const [showAddToCartButton, setShowAddToCartButton] = useState(true);
  const [showBuyNowButton, setShowBuyNowButton] = useState(true);
  const [cartButtonsLayout, setCartButtonsLayout] = useState<'stack' | 'grid-2'>('stack');

  const productsData = useQuery(api.products.listAll, type === 'ProductList' ? { limit: 100 } : 'skip');
  const resolvedProductsData = useQuery(api.products.listPublicResolved, type === 'ProductList' ? { limit: 100 } : 'skip');
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, type === 'ProductList' ? { moduleKey: 'products', settingKey: 'saleMode' } : 'skip');
  const saleMode = useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);
  const servicesData = useQuery(api.services.listAll, type === 'ServiceList' ? { limit: 100 } : 'skip');
  const postsData = useQuery(api.posts.listAll, type === 'Blog' ? { limit: 100 } : 'skip');
  const postCategoriesData = useQuery(api.postCategories.listAll, type === 'Blog' ? { limit: 200 } : 'skip');

  const resolvedProductMap = useMemo(() => new Map(
    (resolvedProductsData ?? []).map((product) => [product._id, product])
  ), [resolvedProductsData]);

  const filteredProducts = useMemo(() => {
    if (!productsData) {return [];}
    return productsData
      .filter(product => product.status === 'Active')
      .filter(product => !productSearchTerm || product.name.toLowerCase().includes(productSearchTerm.toLowerCase()));
  }, [productsData, productSearchTerm]);

  const selectedProducts = useMemo(() => {
    if (!productsData || selectedProductIds.length === 0) {return [];}
    const productMap = new Map(productsData.map((product) => [product._id, product]));
    return selectedProductIds
      .map((id) => productMap.get(id as Id<'products'>))
      .filter((product): product is NonNullable<typeof product> => product !== undefined);
  }, [productsData, selectedProductIds]);

  const productPreviewItems: ProductListPreviewItem[] = useMemo(() => selectedProducts.map((product) => {
    const resolvedProduct = resolvedProductMap.get(product._id as Id<'products'>);
    const priceValue = resolvedProduct?.price ?? product.price;
    const salePriceValue = resolvedProduct?.salePrice ?? product.salePrice;
    const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: priceValue, salePrice: salePriceValue, isRangeFromVariant: resolvedProduct?.hasVariants ?? product.hasVariants });
    const hasBasePrice = priceValue != null || salePriceValue != null;
    return {
      categoryId: product.categoryId,
      description: product.description,
      hasVariants: resolvedProduct?.hasVariants ?? product.hasVariants,
      id: product._id,
      image: product.image,
      name: product.name,
      price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
      priceValue,
      originalPrice: priceDisplay.comparePrice
        ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
        : undefined,
      salePriceValue,
      slug: product.slug,
      stock: resolvedProduct?.stock ?? product.stock,
    };
  }), [resolvedProductMap, selectedProducts, saleMode]);

  const autoProductPreviewItems: ProductListPreviewItem[] = useMemo(() => {
    const source = resolvedProductsData ?? productsData;
    if (!source) {return [];}
    return source
      .filter(product => product.status === 'Active')
      .slice(0, itemCount)
      .map(product => {
        const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: product.price, salePrice: product.salePrice, isRangeFromVariant: product.hasVariants });
        const hasBasePrice = product.price != null || product.salePrice != null;
        return {
          categoryId: product.categoryId,
          description: product.description,
          hasVariants: product.hasVariants,
          id: product._id,
          image: product.image,
          name: product.name,
          price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
          priceValue: product.price,
          originalPrice: priceDisplay.comparePrice
            ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
            : undefined,
          salePriceValue: product.salePrice,
          slug: product.slug,
          stock: product.stock,
        };
      });
  }, [productsData, resolvedProductsData, itemCount, saleMode]);

  const filteredServices = useMemo(() => {
    if (!servicesData) {return [];}
    return servicesData
      .filter(service => service.status === 'Published')
      .filter(service => !serviceSearchTerm || service.title.toLowerCase().includes(serviceSearchTerm.toLowerCase()));
  }, [servicesData, serviceSearchTerm]);

  const selectedServices = useMemo(() => {
    if (!servicesData || selectedServiceIds.length === 0) {return [];}
    const serviceMap = new Map(servicesData.map((service) => [service._id, service]));
    return selectedServiceIds
      .map((id) => serviceMap.get(id as Id<'services'>))
      .filter((service): service is NonNullable<typeof service> => service !== undefined);
  }, [servicesData, selectedServiceIds]);

  const servicePreviewItems: ServiceListPreviewItem[] = useMemo(() => selectedServices.map((service, idx) => ({
    description: service.excerpt,
    id: service._id,
    image: service.thumbnail,
    name: service.title,
    price: service.price?.toString(),
    tag: idx === 0 ? 'hot' : (idx === 1 ? 'new' : undefined),
  })), [selectedServices]);

  const autoServicePreviewItems: ServiceListPreviewItem[] = useMemo(() => {
    if (!servicesData) {return [];}
    return servicesData
      .filter(service => service.status === 'Published')
      .slice(0, itemCount)
      .map((service, idx) => ({
        description: service.excerpt,
        id: service._id,
        image: service.thumbnail,
        name: service.title,
        price: service.price?.toString(),
        tag: idx === 0 ? 'hot' : (idx === 1 ? 'new' : undefined),
      }));
  }, [servicesData, itemCount]);

  const filteredPosts = useMemo(() => {
    if (!postsData) {return [];}
    return postsData
      .filter(post => post.status === 'Published')
      .filter(post => !postSearchTerm || post.title.toLowerCase().includes(postSearchTerm.toLowerCase()));
  }, [postsData, postSearchTerm]);

  const selectedPosts = useMemo(() => {
    if (!postsData || selectedPostIds.length === 0) {return [];}
    const postMap = new Map(postsData.map((post) => [post._id, post]));
    return selectedPostIds
      .map((id) => postMap.get(id as Id<'posts'>))
      .filter((post): post is NonNullable<typeof post> => post !== undefined);
  }, [postsData, selectedPostIds]);

  const previewPosts = useMemo(() => {
    if (type !== 'Blog' || !postsData) {return undefined;}

    const published = postsData.filter((post) => post.status === 'Published');

    if (selectionMode === 'manual') {
      if (selectedPostIds.length === 0) {return [];}
      const postMap = new Map(published.map((post) => [post._id, post]));
      return selectedPostIds
        .map((postId) => postMap.get(postId as Id<'posts'>))
        .filter((post): post is Doc<'posts'> => post !== undefined);
    }

    const sorted = sortBlogPosts(published, sortBy as 'newest' | 'popular' | 'random', title);

    return sorted.slice(0, itemCount);
  }, [itemCount, postsData, selectedPostIds, selectionMode, sortBy, title, type]);

  const blogCategoryMap = useMemo(() => {
    if (type !== 'Blog' || !postCategoriesData) {return undefined;}
    const map: Record<string, string> = {};
    postCategoriesData.forEach((category) => {
      map[category._id] = category.name;
    });
    return map;
  }, [postCategoriesData, type]);

  const typedBlogPreviewPosts = previewPosts as BlogPostItem[] | undefined;

  const onSubmit = (e: React.FormEvent) => {
    const config: Record<string, unknown> = {
      itemCount,
      sortBy,
      style: type === 'Blog' ? blogStyle : (type === 'ServiceList' ? serviceStyle : productStyle),
      selectionMode,
    };

    if (type === 'ProductList') {
      config.hideHeader = hideHeader;
      config.showTitle = showTitleHeader;
      config.showSubtitle = showSubtitle;
      config.subtitle = sectionTitle;
      config.headerAlign = headerAlign;
      config.titleColorPrimary = titleColorPrimary;
      config.subtitleAboveTitle = subtitleAboveTitle;
      config.uppercaseText = uppercaseText;
      config.showBadge = showBadge;
      config.badgeText = subTitle;
      config.spacing = spacing;
      config.cornerRadius = cardRadius;
      config.cardRadius = cardRadius;
      config.desktopColumns = productDesktopColumns;
      config.lookbookDesktopColumns = productDesktopColumns;
      config.showAddToCartButton = showAddToCartButton;
      config.showBuyNowButton = showBuyNowButton;
      config.cartButtonsLayout = cartButtonsLayout;
    }

    if (type === 'ServiceList') {
      // Header config fields for ServiceList
      config.hideHeader = hideHeader;
      config.showTitle = showTitleHeader;
      config.showSubtitle = showSubtitle;
      config.subtitle = sectionTitle;
      config.headerAlign = headerAlign;
      config.titleColorPrimary = titleColorPrimary;
      config.subtitleAboveTitle = subtitleAboveTitle;
      config.uppercaseText = uppercaseText;
      config.showBadge = showBadge;
      config.badgeText = subTitle;
      config.spacing = spacing;
      config.cornerRadius = serviceCardRadius;
      config.cardRadius = serviceCardRadius;
      config.desktopColumns = serviceDesktopColumns;
    }

    if (selectionMode === 'manual') {
      if (type === 'ProductList') {
        config.selectedProductIds = selectedProductIds;
      } else if (type === 'ServiceList') {
        config.selectedServiceIds = selectedServiceIds;
      } else if (type === 'Blog') {
        config.selectedPostIds = selectedPostIds;
      }
    }

    if (selectionMode === 'demo' && type === 'ProductList') {
      config.demoProducts = demoProducts;
    }
    if (selectionMode === 'demo' && type === 'ServiceList') {
      config.demoServices = demoServices;
    }

    void handleSubmit(e, config);
  };

  return (
    <ComponentFormWrapper
      type={type}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={enableFont ? customFontState : undefined}
      showFontCustomBlock={enableFont ? showFontCustomBlock : false}
      setCustomFontState={enableFont ? setCustomFontState : undefined}
      skipTitleInput={type === 'ProductList' || type === 'ServiceList'}
    >
      {type === 'ProductList' ? <AiDemoProductsImport onApply={setDemoProducts} /> : null}
      {type === 'ServiceList' ? <AiDemoServicesImport onApply={setDemoServices} /> : null}

      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />

      {(type === 'ProductList' || type === 'ServiceList') && (
        <HeaderConfigSection
          hideHeader={hideHeader}
          title={title}
          showTitle={showTitleHeader}
          subtitle={sectionTitle}
          showSubtitle={showSubtitle}
          headerAlign={headerAlign}
          titleColorPrimary={titleColorPrimary}
          subtitleAboveTitle={subtitleAboveTitle}
          uppercaseText={uppercaseText}
          showBadge={showBadge}
          badgeText={subTitle}
          onHideHeaderChange={setHideHeader}
          onTitleChange={setTitle}
          onShowTitleChange={setShowTitleHeader}
          onSubtitleChange={setSectionTitle}
          onShowSubtitleChange={setShowSubtitle}
          onHeaderAlignChange={setHeaderAlign}
          onTitleColorPrimaryChange={setTitleColorPrimary}
          onSubtitleAboveTitleChange={setSubtitleAboveTitle}
          onUppercaseTextChange={setUppercaseText}
          onShowBadgeChange={setShowBadge}
          onBadgeTextChange={setSubTitle}
          expanded={openSections.header}
          onExpandedChange={(v) => toggleSection('header', v)}
          className="mb-3"
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />
      )}

      {(type === 'ProductList' || type === 'ServiceList') && (
        <div className="mb-3">
          <HomeComponentDisplaySettingsSection
            open={openSections.display}
            onOpenChange={(v) => toggleSection('display', v)}
            cornerRadius={type === 'ProductList' ? cardRadius : serviceCardRadius}
            onCornerRadiusChange={(value) => {
              if (type === 'ProductList') {
                setCardRadius(value as ProductListCardRadius);
                return;
              }
              setServiceCardRadius(value as ServiceListCardRadius);
            }}
            spacing={spacing}
            onSpacingChange={setSpacing}
          >
            {type === 'ProductList' && (
              <>
                  <div className="space-y-2">
                    <Label>Số cột desktop</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[3, 4].map((option) => {
                        const selected = productDesktopColumns === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setProductDesktopColumns(option as ProductListDesktopColumns)}
                            className={cn(
                              'h-10 rounded-md border text-xs transition-colors',
                              selected
                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                            )}
                          >
                            {option} cột
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 md:col-span-2">
                    Ảnh hưởng layout Commerce, Compact và Lookbook. 4 cột: tablet/mobile 2 cột. 3 cột: tablet 3 cột, mobile 1 cột.
                  </p>
                  
                  {saleMode === 'cart' && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-4 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Hiển thị nút Thêm vào giỏ</Label>
                          <p className="text-xs text-slate-500">Cho phép khách hàng thêm nhanh sản phẩm vào giỏ</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={showAddToCartButton}
                          onChange={(e) => setShowAddToCartButton(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Hiển thị nút Mua ngay</Label>
                          <p className="text-xs text-slate-500">Khách hàng có thể nhấn mua và đi thẳng tới trang checkout</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={showBuyNowButton}
                          onChange={(e) => setShowBuyNowButton(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>

                      {showAddToCartButton && showBuyNowButton && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Bố cục nút hiển thị</Label>
                          <select
                            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                            value={cartButtonsLayout}
                            onChange={(e) => setCartButtonsLayout(e.target.value as 'stack' | 'grid-2')}
                          >
                            <option value="stack">Xếp dọc (Stack)</option>
                            <option value="grid-2">Xếp ngang (Grid 2)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
              </>
            )}
            {type === 'ServiceList' && (
              <>
                  <div className="space-y-2">
                    <Label>Số cột desktop</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[3, 4].map((option) => {
                        const selected = serviceDesktopColumns === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setServiceDesktopColumns(option as ServiceListDesktopColumns)}
                            className={cn(
                              'h-10 rounded-md border text-xs transition-colors',
                              selected
                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                            )}
                          >
                            {option} cột
                          </button>
                        );
                      })}
                    </div>
                  </div>
              </>
            )}
          </HomeComponentDisplaySettingsSection>
        </div>
      )}

      <Card className={cn(type === 'ServiceList' ? 'mb-3 border-0 bg-transparent shadow-none' : 'mb-6')}>
        <CardContent className={cn(type === 'ServiceList' ? 'p-0 space-y-0' : 'p-4 space-y-3')}>          {/* ── Nguồn dữ liệu ── */}
          <SubSection icon={Package} title="Nguồn dữ liệu" open={openSections.source} onOpenChange={(v) => toggleSection('source', v)}>
          <div className="space-y-2">
            <Label>
              Chế độ chọn{' '}
              {type === 'ProductList' ? 'sản phẩm' : (type === 'ServiceList' ? 'dịch vụ' : 'bài viết')}
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>{  setSelectionMode('auto'); }}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
                  selectionMode === 'auto'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                Tự động
              </button>
              <button
                type="button"
                onClick={() =>{  setSelectionMode('manual'); }}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
                  selectionMode === 'manual'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                Chọn thủ công
              </button>
              {(type === 'ProductList' || type === 'ServiceList') && (
                <button
                  type="button"
                  onClick={() =>{  setSelectionMode('demo'); }}
                  className={cn(
                    'flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
                    selectionMode === 'demo'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  Dữ liệu demo
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {selectionMode === 'auto'
                ? `Hiển thị ${type === 'ProductList' ? 'sản phẩm' : (type === 'ServiceList' ? 'dịch vụ' : 'bài viết')} tự động theo số lượng và sắp xếp`
                : selectionMode === 'demo'
                  ? `Dữ liệu mẫu gắn theo component — không cần tạo ${type === 'ProductList' ? 'sản phẩm' : 'dịch vụ'} thật`
                  : `Chọn từng ${type === 'ProductList' ? 'sản phẩm' : (type === 'ServiceList' ? 'dịch vụ' : 'bài viết')} cụ thể để hiển thị`}
            </p>
          </div>

          {selectionMode === 'auto' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số lượng hiển thị</Label>
                <Input
                  type="number"
                  value={itemCount}
                  onChange={(e) =>{  setItemCount(toIntOrDefault(e.target.value, 8)); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Sắp xếp theo</Label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(e) =>{  setSortBy(e.target.value); }}
                >
                  <option value="newest">Mới nhất</option>
                  {type === 'ProductList' && <option value="bestseller">Bán chạy nhất</option>}
                  {type !== 'ProductList' && <option value="popular">Xem nhiều nhất</option>}
                  <option value="random">Ngẫu nhiên</option>
                </select>
              </div>
            </div>
          )}

          {/* Demo Selection - ProductList */}
          {selectionMode === 'demo' && type === 'ProductList' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Sản phẩm demo ({demoProducts.length})</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => setDemoProducts(DEFAULT_DEMO_PRODUCTS.map((d, i) => ({ ...d, id: `demo-${Date.now() + i}` })))}>
                    <Bot size={11} /> Mẫu mặc định
                  </Button>
                  <AiDemoProductsImport onApply={setDemoProducts} />
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => setDemoProducts(prev => [...prev, { id: `demo-${Date.now()}`, name: '', image: '', price: '', originalPrice: '', category: '', tag: '' as const }])}>
                    <Package size={12} /> Thêm
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {demoProducts.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-white text-[10px] rounded-full font-medium shrink-0">
                        {index + 1}
                      </span>
                      <DemoItemImageUploader
                        item={item}
                        onImageChange={(url, storageId) => setDemoProducts(prev => prev.map(d => d.id === item.id ? { ...d, image: url, storageId } : d))}
                      />
                      <Input placeholder="Tên sản phẩm" className="h-8 flex-1 text-xs min-w-0"
                        value={item.name}
                        onChange={(e) => setDemoProducts(prev => prev.map(d => d.id === item.id ? { ...d, name: e.target.value } : d))} />
                      <Input placeholder="Giá" className="h-8 w-28 text-xs shrink-0"
                        value={item.price ?? ''}
                        onChange={(e) => setDemoProducts(prev => prev.map(d => d.id === item.id ? { ...d, price: e.target.value } : d))} />
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500"
                        onClick={() => setDemoProducts(prev => prev.length > 1 ? prev.filter(d => d.id !== item.id) : prev)}>
                        <X size={13} />
                      </Button>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Giá gốc (tuỳ chọn)"
                          className="h-7 text-xs"
                          value={item.originalPrice ?? ''}
                          onChange={(e) => setDemoProducts(prev => prev.map(d => d.id === item.id ? { ...d, originalPrice: e.target.value } : d))}
                        />
                        <Input
                          placeholder="Danh mục"
                          className="h-7 text-xs"
                          value={item.category ?? ''}
                          onChange={(e) => setDemoProducts(prev => prev.map(d => d.id === item.id ? { ...d, category: e.target.value } : d))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {demoProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-6 text-center dark:border-slate-700">
                  <Package size={20} className="mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500 mb-2">Chưa có sản phẩm demo</p>
                  <Button type="button" variant="outline" size="sm" className="gap-1"
                    onClick={() => setDemoProducts(DEFAULT_DEMO_PRODUCTS.map((d, i) => ({ ...d, id: `demo-${Date.now() + i}` })))}>
                    <Bot size={12} /> Tải mẫu
                  </Button>
                  <AiDemoProductsImport buttonClassName="h-9" onApply={setDemoProducts} />
                </div>
              )}
            </div>
          )}

          {/* Demo Selection - ServiceList */}
          {selectionMode === 'demo' && type === 'ServiceList' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dịch vụ demo ({demoServices.length})</Label>
                <div className="flex gap-1.5">
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setDemoServices(DEFAULT_DEMO_SERVICES.map((d, i) => ({ ...d, id: `demo-${Date.now() + i}` })))}>
                    <RotateCcw size={14} className="mr-1" /> Mặc định
                  </Button>
                  <AiDemoServicesImport onApply={setDemoServices} />
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setDemoServices(prev => [...prev, { id: `demo-${Date.now()}`, name: '', image: '', price: '', description: '', tag: '' as const }])}>
                    <Plus size={14} className="mr-1" /> Thêm
                  </Button>
                </div>
              </div>
              {demoServices.map((item, index) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">{index + 1}</span>
                    {item.image ? (
                      <Image src={item.image} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
                        <Briefcase size={12} className="text-slate-400" />
                      </div>
                    )}
                    <Input placeholder="Tên dịch vụ *" value={item.name} className="h-8 min-w-0 flex-1 text-xs"
                      onChange={(e) => setDemoServices(prev => prev.map(d => d.id === item.id ? { ...d, name: e.target.value } : d))} />
                    <Input placeholder="Giá (VD: 5.000.000đ)" value={item.price ?? ''} className="h-8 w-32 shrink-0 text-xs"
                      onChange={(e) => setDemoServices(prev => prev.map(d => d.id === item.id ? { ...d, price: e.target.value } : d))} />
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500"
                      onClick={() => setDemoServices(prev => prev.length > 1 ? prev.filter(d => d.id !== item.id) : prev)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="border-t border-slate-100 px-3 py-1.5 dark:border-slate-800">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Input placeholder="Mô tả ngắn" value={item.description ?? ''} className="h-7 text-xs"
                        onChange={(e) => setDemoServices(prev => prev.map(d => d.id === item.id ? { ...d, description: e.target.value } : d))} />
                      <SettingsImageUploader
                        label="Ảnh thumbnail"
                        value={item.image ?? ''}
                        storageId={item.storageId as any}
                        onChange={(url, storageId) => setDemoServices(prev => prev.map(d => d.id === item.id ? {
                          ...d,
                          image: url ?? '',
                          storageId: storageId ? String(storageId) : null
                        } : d))}
                        folder="home-components/service-list"
                        naming={{ entityName: item.name || 'demo-service', field: 'thumbnail', index: index + 1 }}
                        previewSize="sm"
                        cropAspectRatio="landscape43"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {demoServices.length === 0 && (
                <div className="text-center py-6 text-sm text-slate-500">
                  Chưa có dịch vụ demo.{' '}
                  <button type="button" className="text-blue-600 hover:underline"
                    onClick={() => setDemoServices(DEFAULT_DEMO_SERVICES.map((d, i) => ({ ...d, id: `demo-${Date.now() + i}` })))}>
                    Tạo mặc định
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual Selection - ProductList */}
          {selectionMode === 'manual' && type === 'ProductList' && (
            <div className="space-y-4">
              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  <Label>Sản phẩm đã chọn ({selectedProducts.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedProducts.map((product, index) => (
                      <div key={product._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group">
                        <div className="text-slate-400 cursor-move"><GripVertical size={16} /></div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">{index + 1}</span>
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt=""
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded"
                            fallback={<div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={16} className="text-slate-400" /></div>}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={16} className="text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.price?.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() =>{  setSelectedProductIds(ids => ids.filter(id => id !== product._id)); }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Thêm sản phẩm</Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    className="pl-9"
                    value={productSearchTerm}
                    onChange={(e) =>{  setProductSearchTerm(e.target.value); }}
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {productsData === undefined ? 'Đang tải...' : 'Không tìm thấy sản phẩm'}
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const isSelected = selectedProductIds.includes(product._id);
                      return (
                        <div
                          key={product._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedProductIds(ids => ids.filter(id => id !== product._id));
                            } else {
                              setSelectedProductIds(ids => [...ids, product._id]);
                            }
                          }}
                          className={cn(
                            'flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors',
                            isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded"
                              fallback={<div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={14} className="text-slate-400" /></div>}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={14} className="text-slate-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.price?.toLocaleString('vi-VN')}đ</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Selection - ServiceList */}
          {selectionMode === 'manual' && type === 'ServiceList' && (
            <div className="space-y-4">
              {selectedServices.length > 0 && (
                <div className="space-y-2">
                  <Label>Dịch vụ đã chọn ({selectedServices.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedServices.map((service, index) => (
                      <div key={service._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group">
                        <div className="text-slate-400 cursor-move"><GripVertical size={16} /></div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">{index + 1}</span>
                        {service.thumbnail ? (
                          <Image src={service.thumbnail} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><Briefcase size={16} className="text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-snug break-words">{service.title}</p>
                          <p className="text-xs text-slate-500">{service.views} lượt xem</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() =>{  setSelectedServiceIds(ids => ids.filter(id => id !== service._id)); }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Thêm dịch vụ</Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm dịch vụ..."
                    className="pl-9"
                    value={serviceSearchTerm}
                    onChange={(e) =>{  setServiceSearchTerm(e.target.value); }}
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {filteredServices.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {servicesData === undefined ? 'Đang tải...' : 'Không tìm thấy dịch vụ'}
                    </div>
                  ) : (
                    filteredServices.map((service) => {
                      const isSelected = selectedServiceIds.includes(service._id);
                      return (
                        <div
                          key={service._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedServiceIds(ids => ids.filter(id => id !== service._id));
                            } else {
                              setSelectedServiceIds(ids => [...ids, service._id]);
                            }
                          }}
                          className={cn(
                            'flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors',
                            isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {service.thumbnail ? (
                            <Image src={service.thumbnail} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center"><Briefcase size={14} className="text-slate-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug break-words">{service.title}</p>
                            <p className="text-xs text-slate-500">{service.views} lượt xem</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Selection - Blog */}
          {selectionMode === 'manual' && type === 'Blog' && (
            <div className="space-y-4">
              {selectedPosts.length > 0 && (
                <div className="space-y-2">
                  <Label>Bài viết đã chọn ({selectedPosts.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedPosts.map((post, index) => (
                      <div key={post._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group">
                        <div className="text-slate-400 cursor-move"><GripVertical size={16} /></div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">{index + 1}</span>
                        {post.thumbnail ? (
                          <Image src={post.thumbnail} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><FileText size={16} className="text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{post.title}</p>
                          <p className="text-xs text-slate-500">{post.views} lượt xem</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() =>{  setSelectedPostIds(ids => ids.filter(id => id !== post._id)); }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Thêm bài viết</Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    className="pl-9"
                    value={postSearchTerm}
                    onChange={(e) =>{  setPostSearchTerm(e.target.value); }}
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {filteredPosts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {postsData === undefined ? 'Đang tải...' : 'Không tìm thấy bài viết'}
                    </div>
                  ) : (
                    filteredPosts.map((post) => {
                      const isSelected = selectedPostIds.includes(post._id);
                      return (
                        <div
                          key={post._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPostIds(ids => ids.filter(id => id !== post._id));
                            } else {
                              setSelectedPostIds(ids => [...ids, post._id]);
                            }
                          }}
                          className={cn(
                            'flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors',
                            isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {post.thumbnail ? (
                            <Image src={post.thumbnail} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center"><FileText size={14} className="text-slate-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{post.title}</p>
                            <p className="text-xs text-slate-500">{post.views} lượt xem</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
          </SubSection>
        </CardContent>
      </Card>

      {type === 'Blog' ? (
        <div className="space-y-3">
          <BlogPreview
            brandColor={primary}
            secondary={secondary}
            mode={mode}
            postCount={selectionMode === 'manual' ? selectedPostIds.length : itemCount}
            selectedStyle={blogStyle}
            onStyleChange={setBlogStyle}
            title={title}
            previewItems={typedBlogPreviewPosts}
            categoryMap={blogCategoryMap}
            fontStyle={fontStyle}
            fontClassName="font-active"
          />
        </div>
      ) : (type === 'ServiceList' ? (
        <div className="space-y-3">
          <ServiceListPreview
            brandColor={primary}
            secondary={secondary}
            mode={mode}
            itemCount={selectionMode === 'demo' ? demoServices.length : (selectionMode === 'manual' ? selectedServiceIds.length : itemCount)}
            selectedStyle={serviceStyle}
            onStyleChange={setServiceStyle}
            items={
              selectionMode === 'demo' && demoServices.length > 0
                ? demoServices.map(d => ({ id: d.id, name: d.name, image: d.image, price: d.price, description: d.description, tag: (d.tag || undefined) as 'new' | 'hot' | undefined }))
                : (selectionMode === 'manual' && servicePreviewItems.length > 0 ? servicePreviewItems : (autoServicePreviewItems.length > 0 ? autoServicePreviewItems : undefined))
            }
            title={title}
            hideHeader={hideHeader}
            showTitle={showTitleHeader}
            showSubtitle={showSubtitle}
            subtitle={sectionTitle}
            headerAlign={headerAlign}
            titleColorPrimary={titleColorPrimary}
            subtitleAboveTitle={subtitleAboveTitle}
            uppercaseText={uppercaseText}
            showBadge={showBadge}
            badgeText={subTitle}
            spacing={spacing}
            cardRadius={serviceCardRadius}
            desktopColumns={serviceDesktopColumns}
            fontStyle={fontStyle}
            fontClassName="font-active"
          />
        </div>
      ) : (
        <ProductListPreview
          brandColor={primary}
          secondary={secondary}
          itemCount={selectionMode === 'demo' ? demoProducts.length : (selectionMode === 'manual' ? selectedProductIds.length : itemCount)}
          componentType="ProductList"
          selectedStyle={productStyle}
          onStyleChange={setProductStyle}
          items={
            selectionMode === 'demo' && demoProducts.length > 0
              ? demoProducts.map(d => ({ id: d.id, name: d.name, image: d.image, price: d.price, originalPrice: d.originalPrice, category: d.category, tag: d.tag || undefined }))
              : (selectionMode === 'manual' && productPreviewItems.length > 0 ? productPreviewItems : (autoProductPreviewItems.length > 0 ? autoProductPreviewItems : undefined))
          }
          subTitle={subTitle}
          sectionTitle={title}
          subtitle={sectionTitle}
          fontStyle={fontStyle}
          fontClassName="font-active"
          hideHeader={hideHeader}
          showTitle={showTitleHeader}
          showSubtitle={showSubtitle}
          headerAlign={headerAlign}
          titleColorPrimary={titleColorPrimary}
          subtitleAboveTitle={subtitleAboveTitle}
          uppercaseText={uppercaseText}
          showBadge={showBadge}
          spacing={spacing}
          cardRadius={cardRadius}
          desktopColumns={productDesktopColumns}
          lookbookDesktopColumns={productDesktopColumns}
          showAddToCartButton={showAddToCartButton}
          showBuyNowButton={showBuyNowButton}
          cartButtonsLayout={cartButtonsLayout}
        />
      ))}
    </ComponentFormWrapper>
  );
}

