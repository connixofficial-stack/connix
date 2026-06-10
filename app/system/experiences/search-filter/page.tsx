'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  Eye, 
  Heart, 
  Loader2, 
  Package, 
  Save, 
  Search, 
  ShoppingCart, 
  Tag 
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import { 
  ExperienceModuleLink, 
  ExperienceHintCard,
  ProductsListPreview,
  ExampleLinks,
} from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  DeviceToggle,
  deviceWidths,
  LayoutTabs,
  ControlCard,
  ToggleRow,
  SelectRow,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { useExperienceConfig, useExperienceSave, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';
import { enforceMultipleToggles } from '@/lib/experiences/module-toggle-guards';

type SearchLayoutStyle = 'search-only' | 'with-filters' | 'advanced';
type ResultsDisplayStyle = 'grid' | 'list';
type CornerRadiusStyle = 'none' | 'sm' | 'lg';

type SearchFilterExperienceConfig = {
  layoutStyle: SearchLayoutStyle;
  resultsDisplayStyle: ResultsDisplayStyle;
  showFilters: boolean;
  showSorting: boolean;
  showResultCount: boolean;
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  showPromotionBadge: boolean;
  enableQuickAddVariant: boolean;
  cornerRadius: CornerRadiusStyle;
  cartButtonsLayout?: 'stack' | 'grid-2';
};

const EXPERIENCE_KEY = 'search_filter_ui';

const LAYOUT_STYLES: LayoutOption<SearchLayoutStyle>[] = [
  { description: 'Chỉ hiển thị thanh tìm kiếm đơn giản', id: 'search-only', label: 'Search Only' },
  { description: 'Hiển thị tìm kiếm kèm bộ lọc danh mục và sắp xếp', id: 'with-filters', label: 'With Filters' },
  { description: 'Giao diện tìm kiếm nâng cao với đầy đủ tuỳ biến', id: 'advanced', label: 'Advanced' },
];

const DEFAULT_CONFIG: SearchFilterExperienceConfig = {
  layoutStyle: 'with-filters',
  resultsDisplayStyle: 'grid',
  showFilters: true,
  showSorting: true,
  showResultCount: true,
  showWishlistButton: true,
  showAddToCartButton: true,
  showBuyNowButton: true,
  showPromotionBadge: true,
  enableQuickAddVariant: true,
  cornerRadius: 'lg',
  cartButtonsLayout: 'stack',
};

const HINTS = [
  'Bố cục bộ lọc giúp người dùng thu hẹp kết quả tìm kiếm sản phẩm nhanh chóng.',
  'Bật nút kính lúp tìm kiếm ở mobile giúp người dùng di động dễ dàng submit từ khóa.',
  'UX Bố cục nút giúp đồng bộ hiển thị các nút chức năng mua sắm nhất quán toàn trang web.',
  'Tính năng đếm số gợi ý tìm thấy giúp khách hàng biết quy mô kết quả tức thì.',
];

function ModuleFeatureStatus({ label, enabled, href, moduleName }: { label: string; enabled: boolean; href: string; moduleName: string }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <div className="flex items-start gap-2">
        <span className={`mt-1 inline-flex h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">
            {enabled ? 'Đang bật' : 'Chưa bật'} · Nếu muốn {enabled ? 'tắt' : 'bật'} hãy vào {moduleName}
          </p>
        </div>
      </div>
      <Link href={href} className="text-xs font-medium text-cyan-600 hover:underline">
        Đi đến →
      </Link>
    </div>
  );
}

export default function SearchFilterExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const productsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'products' });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const promotionsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'promotions' });
  const variantsSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'variantEnabled' });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<SearchFilterExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<SearchFilterExperienceConfig> | undefined;
    return {
      layoutStyle: raw?.layoutStyle ?? 'with-filters',
      resultsDisplayStyle: raw?.resultsDisplayStyle ?? 'grid',
      showFilters: raw?.showFilters ?? true,
      showSorting: raw?.showSorting ?? true,
      showResultCount: raw?.showResultCount ?? true,
      showWishlistButton: raw?.showWishlistButton ?? true,
      showAddToCartButton: raw?.showAddToCartButton ?? true,
      showBuyNowButton: raw?.showBuyNowButton ?? true,
      showPromotionBadge: raw?.showPromotionBadge ?? true,
      enableQuickAddVariant: raw?.enableQuickAddVariant ?? true,
      cornerRadius: raw?.cornerRadius ?? 'lg',
      cartButtonsLayout: raw?.cartButtonsLayout ?? 'stack',
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || productsModule === undefined || wishlistModule === undefined || cartModule === undefined || ordersModule === undefined || promotionsModule === undefined || variantsSetting === undefined || saleModeSetting === undefined;

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const saleMode = (saleModeSetting?.value as string | undefined) ?? 'cart';
  const canUseWishlist = wishlistModule?.enabled ?? false;
  const canUseCart = (cartModule?.enabled ?? false) && (ordersModule?.enabled ?? false);
  const canUseOrders = ordersModule?.enabled ?? false;
  const canUsePromotions = promotionsModule?.enabled ?? false;
  const variantsEnabled = (variantsSetting?.value as boolean | undefined) ?? false;
  const canUseQuickAddVariant = canUseCart && variantsEnabled;

  const beforeSaveTransform = (rawConfig: unknown) => {
    const configValue = rawConfig as SearchFilterExperienceConfig;
    let next = enforceMultipleToggles(configValue, [
      { key: 'showWishlistButton', enabled: canUseWishlist },
      { key: 'showAddToCartButton', enabled: canUseCart },
      { key: 'showBuyNowButton', enabled: canUseOrders },
      { key: 'showPromotionBadge', enabled: canUsePromotions },
      { key: 'enableQuickAddVariant', enabled: canUseCart && variantsEnabled },
    ]);

    if (!variantsEnabled) {
      next = { ...next, enableQuickAddVariant: false };
    }

    return next;
  };

  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY, 
    config, 
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY] ?? 'Tìm kiếm & Bộ lọc'),
    undefined,
    beforeSaveTransform
  );

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">{MESSAGES.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" style={{ color: brandColor }} />
            <h1 className="text-2xl font-bold">Tìm kiếm & Bộ lọc</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-1.5"
          style={{ backgroundColor: brandColor }}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{hasChanges ? 'Lưu' : 'Đã lưu'}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thiết lập hiển thị trang tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Màu thương hiệu">
            <ColorConfigCard
              primary={brandColor}
              secondary={secondaryColor}
              mode={colorMode}
              onPrimaryChange={setBrandColor}
              onSecondaryChange={setSecondaryColor}
              onModeChange={setColorMode}
            />
          </ControlCard>
          
          <ControlCard title="Khối bộ lọc">
            <ToggleRow
              label="Bộ lọc danh mục"
              description="Cho phép lọc kết quả theo danh mục"
              checked={config.showFilters}
              onChange={(v) => setConfig(prev => ({ ...prev, showFilters: v }))}
              accentColor={brandColor}
            />
            <ToggleRow
              label="Sắp xếp"
              description="Cho phép sắp xếp theo giá, mới nhất..."
              checked={config.showSorting}
              onChange={(v) => setConfig(prev => ({ ...prev, showSorting: v }))}
              accentColor={brandColor}
            />
            <ToggleRow
              label="Số lượng kết quả"
              description="Hiển thị 'Tìm thấy X kết quả'"
              checked={config.showResultCount}
              onChange={(v) => setConfig(prev => ({ ...prev, showResultCount: v }))}
              accentColor={brandColor}
            />
            <SelectRow
              label="Bố cục mặc định"
              value={config.resultsDisplayStyle}
              options={[
                { value: 'grid', label: 'Xem lưới (Grid)' },
                { value: 'list', label: 'Xem danh sách (List)' },
              ]}
              onChange={(v) => setConfig(prev => ({ ...prev, resultsDisplayStyle: v as ResultsDisplayStyle }))}
            />
          </ControlCard>

          <ControlCard title="Tính năng sản phẩm">
            <ToggleRow
              label="Nút yêu thích"
              description="Hiện nút thêm vào wishlist"
              checked={config.showWishlistButton && canUseWishlist}
              onChange={(v) => setConfig(prev => ({ ...prev, showWishlistButton: v }))}
              accentColor={brandColor}
              disabled={!canUseWishlist}
            />
            <ToggleRow
              label="Nút thêm giỏ hàng"
              description="Hiện nút add to cart"
              checked={config.showAddToCartButton && canUseCart}
              onChange={(v) => setConfig(prev => ({ ...prev, showAddToCartButton: v }))}
              accentColor={brandColor}
              disabled={!canUseCart}
            />
            <ToggleRow
              label="Quick add phiên bản"
              description="Mở modal chọn phiên bản khi thêm giỏ"
              checked={config.enableQuickAddVariant && canUseQuickAddVariant}
              onChange={(v) => setConfig(prev => ({ ...prev, enableQuickAddVariant: v }))}
              accentColor={brandColor}
              disabled={!canUseQuickAddVariant}
            />
            {config.showAddToCartButton && saleMode === 'cart' && (
              <SelectRow
                label="Bố cục nút"
                value={config.cartButtonsLayout ?? 'stack'}
                options={[
                  { value: 'stack', label: 'Xếp dọc (Stack)' },
                  { value: 'grid-2', label: 'Xếp ngang (Grid 2)' },
                ]}
                onChange={(v) => setConfig(prev => ({ ...prev, cartButtonsLayout: v as 'stack' | 'grid-2' }))}
              />
            )}
            <ToggleRow
              label="Nút Mua ngay"
              description="Hiện nút Buy Now đặt hàng nhanh"
              checked={config.showBuyNowButton && canUseOrders}
              onChange={(v) => setConfig(prev => ({ ...prev, showBuyNowButton: v }))}
              accentColor={brandColor}
              disabled={!canUseOrders}
            />
            <ToggleRow
              label="Badge khuyến mãi"
              description="Hiện badge giảm giá"
              checked={config.showPromotionBadge && canUsePromotions}
              onChange={(v) => setConfig(prev => ({ ...prev, showPromotionBadge: v }))}
              accentColor={brandColor}
              disabled={!canUsePromotions}
            />
            <SelectRow
              label="Bo góc sản phẩm"
              value={config.cornerRadius}
              options={[
                { value: 'none', label: 'Không bo góc' },
                { value: 'sm', label: 'Bo góc ít' },
                { value: 'lg', label: 'Bo góc nhiều' },
              ]}
              onChange={(v) => setConfig(prev => ({ ...prev, cornerRadius: v as CornerRadiusStyle }))}
            />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Module & liên kết</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Module liên quan">
            <ExperienceModuleLink
              enabled={productsModule?.enabled ?? false}
              href="/system/modules/products"
              icon={Package}
              title="Sản phẩm"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Phiên bản sản phẩm"
              enabled={(variantsSetting?.value as boolean | undefined) ?? false}
              href="/system/modules/products"
              moduleName="module Sản phẩm"
            />
            <ExperienceModuleLink
              enabled={wishlistModule?.enabled ?? false}
              href="/system/modules/wishlist"
              icon={Heart}
              title="Sản phẩm yêu thích"
              colorScheme="cyan"
            />
            <ExperienceModuleLink
              enabled={cartModule?.enabled ?? false}
              href="/system/modules/cart"
              icon={ShoppingCart}
              title="Giỏ hàng"
              colorScheme="cyan"
            />
            <ExperienceModuleLink
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              icon={Package}
              title="Đơn hàng"
              colorScheme="cyan"
            />
            <ExperienceModuleLink
              enabled={promotionsModule?.enabled ?? false}
              href="/system/modules/promotions"
              icon={Tag}
              title="Khuyến mãi"
              colorScheme="cyan"
            />
          </ControlCard>

          <Card className="p-2">
            <div className="mb-2">
              <ExampleLinks
                links={[{ label: 'Trang tìm kiếm', url: '/search' }]}
                color={brandColor}
                compact
              />
            </div>
            <ExperienceHintCard hints={HINTS} />
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye size={18} /> Preview Trực Quan
            </CardTitle>
            <div className="flex items-center gap-3">
              <LayoutTabs
                layouts={LAYOUT_STYLES}
                activeLayout={config.layoutStyle}
                onChange={(layout) => setConfig(prev => ({ ...prev, layoutStyle: layout }))}
                accentColor={brandColor}
              />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/search?q=shoes">
              <ProductsListPreview
                layoutStyle={config.layoutStyle === 'search-only' ? 'grid' : 'sidebar'}
                paginationType="pagination"
                showSearch={true}
                showCategories={config.showFilters}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
                showWishlistButton={config.showWishlistButton && (wishlistModule?.enabled ?? false)}
                showAddToCartButton={config.showAddToCartButton && (cartModule?.enabled ?? false) && (ordersModule?.enabled ?? false)}
                showBuyNowButton={config.showBuyNowButton && (ordersModule?.enabled ?? false)}
                showPromotionBadge={config.showPromotionBadge && (promotionsModule?.enabled ?? false)}
                cornerRadius={config.cornerRadius}
                cartButtonsLayout={config.cartButtonsLayout}
              />
            </BrowserFrame>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Style: <strong className="text-slate-700 dark:text-slate-300">{LAYOUT_STYLES.find(s => s.id === config.layoutStyle)?.label}</strong>
            {' • '}{previewDevice === 'desktop' && 'Desktop (1920px)'}{previewDevice === 'tablet' && 'Tablet (768px)'}{previewDevice === 'mobile' && 'Mobile (375px)'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
