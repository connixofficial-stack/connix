'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { Eye, Heart, LayoutTemplate, Loader2, Package, Save, ShoppingCart, Tag } from 'lucide-react';
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

type ListLayoutStyle = 'grid' | 'sidebar' | 'list';
type PaginationType = 'pagination' | 'infiniteScroll';
type ProductListCornerRadius = 'none' | 'sm' | 'lg';

type ProductsListExperienceConfig = {
  layoutStyle: ListLayoutStyle;
  gridColumns: number;
  layouts: {
    grid: LayoutConfig;
    sidebar: LayoutConfig;
    list: LayoutConfig;
  };
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  showPromotionBadge: boolean;
  enableQuickAddVariant: boolean;
  hideEmptyCategories: boolean;
  cornerRadius: ProductListCornerRadius;
  cartButtonsLayout?: 'stack' | 'grid-2';
  priceFilterMode: 'disabled' | 'custom' | 'smart_dropdown' | 'slider';
};

type LayoutConfig = {
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  postsPerPage: number;
};

const EXPERIENCE_KEY = 'products_list_ui';

const LAYOUT_STYLES: LayoutOption<ListLayoutStyle>[] = [
  { description: 'Hiển thị dạng lưới cards', id: 'grid', label: 'Grid' },
  { description: 'Sidebar filters + grid', id: 'sidebar', label: 'Sidebar' },
  { description: 'Hiển thị dạng danh sách', id: 'list', label: 'List' },
];

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  paginationType: 'pagination',
  showSearch: true,
  showCategories: true,
  postsPerPage: 12,
};

const DEFAULT_CONFIG: ProductsListExperienceConfig = {
  layoutStyle: 'grid',
  gridColumns: 3,
  layouts: {
    grid: { ...DEFAULT_LAYOUT_CONFIG },
    sidebar: { ...DEFAULT_LAYOUT_CONFIG },
    list: { ...DEFAULT_LAYOUT_CONFIG },
  },
  showWishlistButton: true,
  showAddToCartButton: true,
  showBuyNowButton: true,
  showPromotionBadge: true,
  enableQuickAddVariant: true,
  hideEmptyCategories: true,
  cornerRadius: 'lg',
  cartButtonsLayout: 'stack',
  priceFilterMode: 'custom',
};

const HINTS = [
  'Grid layout tiêu chuẩn cho e-commerce.',
  'Sidebar filters quan trọng cho shop có nhiều sản phẩm.',
  'Search giúp user tìm sản phẩm nhanh.',
  'Mỗi layout có config riêng - chuyển tab để chỉnh.',
  'Wishlist, Add to Cart và Buy Now có thể toggle từ đây.',
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

export default function ProductsListExperiencePage() {
  const initStats = useMutation(api.products.initStats);
  const [isSyncingStats, setIsSyncingStats] = useState(false);

  const handleSyncStats = async () => {
    setIsSyncingStats(true);
    try {
      await initStats();
      toast.success('Đã đồng bộ lại bộ đếm thống kê sản phẩm thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi đồng bộ bộ đếm thống kê sản phẩm.');
    } finally {
      setIsSyncingStats(false);
    }
  };

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

  const serverConfig = useMemo<ProductsListExperienceConfig>(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: ListLayoutStyle;
      gridColumns?: number;
      layouts?: Partial<Record<ListLayoutStyle, Partial<LayoutConfig>>>;
      showWishlistButton?: boolean;
      showAddToCartButton?: boolean;
      showBuyNowButton?: boolean;
      showPromotionBadge?: boolean;
      enableQuickAddVariant?: boolean;
      hideEmptyCategories?: boolean;
      cornerRadius?: ProductListCornerRadius;
      cartButtonsLayout?: 'stack' | 'grid-2';
      priceFilterMode?: 'disabled' | 'custom' | 'smart_dropdown' | 'slider';
    } | undefined;
    
    const normalizePaginationType = (value?: string): PaginationType => {
      if (value === 'infiniteScroll') return 'infiniteScroll';
      if (value === 'pagination') return 'pagination';
      return 'pagination';
    };
    
    const normalizeLayoutConfig = (cfg?: Partial<LayoutConfig>): LayoutConfig => ({
      paginationType: normalizePaginationType(cfg?.paginationType),
      showSearch: cfg?.showSearch ?? true,
      showCategories: cfg?.showCategories ?? true,
      postsPerPage: cfg?.postsPerPage ?? 12,
    });
    
    const layoutStyle: ListLayoutStyle = raw?.layoutStyle ?? 'grid';

    return {
      layoutStyle,
      gridColumns: raw?.gridColumns ?? 3,
      layouts: {
        grid: normalizeLayoutConfig(raw?.layouts?.grid),
        sidebar: normalizeLayoutConfig(raw?.layouts?.sidebar),
        list: normalizeLayoutConfig(raw?.layouts?.list),
      },
      showWishlistButton: raw?.showWishlistButton ?? true,
      showAddToCartButton: raw?.showAddToCartButton ?? true,
      showBuyNowButton: raw?.showBuyNowButton ?? true,
      showPromotionBadge: raw?.showPromotionBadge ?? true,
      enableQuickAddVariant: raw?.enableQuickAddVariant ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      cornerRadius: raw?.cornerRadius ?? 'lg',
      cartButtonsLayout: raw?.cartButtonsLayout ?? 'stack',
      priceFilterMode: raw?.priceFilterMode ?? 'custom',
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || productsModule === undefined || wishlistModule === undefined || cartModule === undefined || ordersModule === undefined || promotionsModule === undefined || variantsSetting === undefined || saleModeSetting === undefined;

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const saleMode = (saleModeSetting?.value as string | undefined) ?? 'cart';
  const canUseProducts = productsModule?.enabled ?? false;
  const canUseWishlist = wishlistModule?.enabled ?? false;
  const canUseCart = (cartModule?.enabled ?? false) && (ordersModule?.enabled ?? false);
  const canUseOrders = ordersModule?.enabled ?? false;
  const canUsePromotions = promotionsModule?.enabled ?? false;
  const variantsEnabled = (variantsSetting?.value as boolean | undefined) ?? false;
  const canUseQuickAddVariant = canUseCart && variantsEnabled;

  const beforeSaveTransform = (rawConfig: unknown) => {
    const configValue = rawConfig as ProductsListExperienceConfig;
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
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY]),
    undefined,
    beforeSaveTransform
  );

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const currentLayoutConfig = config.layouts[config.layoutStyle] ?? DEFAULT_LAYOUT_CONFIG;
  const updateLayoutConfig = <K extends keyof LayoutConfig>(
    key: K,
    value: LayoutConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        [prev.layoutStyle]: {
          ...DEFAULT_LAYOUT_CONFIG,
          ...prev.layouts[prev.layoutStyle],
          [key]: value,
        },
      },
    }));
  };

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
            <LayoutTemplate className="w-5 h-5" style={{ color: brandColor }} />
            <h1 className="text-2xl font-bold">Danh sách sản phẩm</h1>
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
          <CardTitle className="text-base">Thiết lập hiển thị</CardTitle>
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
          <ControlCard title="Khối hiển thị">
            <ToggleRow
              label="Tìm kiếm"
              checked={currentLayoutConfig.showSearch && canUseProducts}
              onChange={(v) => updateLayoutConfig('showSearch', v)}
              accentColor={brandColor}
              disabled={!canUseProducts}
            />
            <ToggleRow
              label="Buy Now"
              checked={config.showBuyNowButton && canUseOrders}
              onChange={(v) => setConfig(prev => ({ ...prev, showBuyNowButton: v }))}
              accentColor={brandColor}
              disabled={!canUseOrders}
            />
            <ToggleRow
              label="Danh mục"
              checked={currentLayoutConfig.showCategories && canUseProducts}
              onChange={(v) => updateLayoutConfig('showCategories', v)}
              accentColor={brandColor}
              disabled={!canUseProducts}
            />
            <ToggleRow
              label="Ẩn danh mục rỗng"
              description="Ngoài public chỉ hiện danh mục có sản phẩm"
              checked={config.hideEmptyCategories}
              onChange={(v) => setConfig(prev => ({ ...prev, hideEmptyCategories: v }))}
              accentColor={brandColor}
            />
            <SelectRow
              label="Bo góc"
              value={config.cornerRadius}
              options={[
                { value: 'none', label: 'Không bo góc' },
                { value: 'sm', label: 'Bo góc ít' },
                { value: 'lg', label: 'Bo góc nhiều' },
              ]}
              onChange={(v) => setConfig(prev => ({ ...prev, cornerRadius: v as ProductListCornerRadius }))}
              disabled={!canUseProducts}
            />
            <SelectRow
              label="Số cột hiển thị (Desktop)"
              value={String(config.gridColumns ?? 3)}
              options={[
                { value: '3', label: '3 cột' },
                { value: '4', label: '4 cột' },
              ]}
              onChange={(v) => setConfig(prev => ({ ...prev, gridColumns: Number(v) }))}
              disabled={!canUseProducts}
            />
          </ControlCard>

          <ControlCard title="Phân trang">
            <SelectRow
              label="Kiểu"
              value={currentLayoutConfig.paginationType}
              options={[
                { value: 'pagination', label: 'Phân trang' },
                { value: 'infiniteScroll', label: 'Cuộn vô hạn' },
              ]}
              onChange={(v) => updateLayoutConfig('paginationType', v as PaginationType)}
              disabled={!canUseProducts}
            />
            <SelectRow
              label="Bài mỗi trang"
              value={String(currentLayoutConfig.postsPerPage)}
              options={[
                { value: '12', label: '12' },
                { value: '20', label: '20' },
                { value: '24', label: '24' },
                { value: '48', label: '48' },
              ]}
              onChange={(v) => updateLayoutConfig('postsPerPage', Number(v))}
              disabled={!canUseProducts}
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
            <ToggleRow
              label="Badge khuyến mãi"
              description="Hiện badge giảm giá"
              checked={config.showPromotionBadge && canUsePromotions}
              onChange={(v) => setConfig(prev => ({ ...prev, showPromotionBadge: v }))}
              accentColor={brandColor}
              disabled={!canUsePromotions}
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
          </ControlCard>

          <ControlCard title="Bảo trì hệ thống">
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Nếu số lượng sản phẩm ngoài public hiển thị sai lệch so với trang Admin, hãy nhấn nút dưới đây để đồng bộ lại bộ đếm thống kê.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncStats}
                disabled={isSyncingStats}
                className="w-full gap-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              >
                {isSyncingStats ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang đồng bộ...</span>
                  </>
                ) : (
                  <>
                    <Package size={14} />
                    <span>Đồng bộ lại bộ đếm sản phẩm</span>
                  </>
                )}
              </Button>
            </div>
          </ControlCard>

          <ControlCard title="Bộ lọc khoảng giá">
            <div className="space-y-3">
              <SelectRow
                label="Chế độ lọc"
                value={config.priceFilterMode ?? 'custom'}
                options={[
                  { value: 'disabled', label: 'Tắt bộ lọc' },
                  { value: 'custom', label: 'Tự nhập (Từ - Đến)' },
                  { value: 'smart_dropdown', label: 'Dropdown thông minh (SaaS)' },
                  { value: 'slider', label: 'Slider 2 đầu (Range Slider)' },
                ]}
                onChange={(v) => setConfig(prev => ({ ...prev, priceFilterMode: v as any }))}
              />
              <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                Lọc khoảng giá thông minh và Slider sẽ tự động tính toán khoảng biên từ cơ sở dữ liệu thực tế bằng index tối ưu O(1).
              </p>
            </div>
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
            <ModuleFeatureStatus
              label="Wishlist"
              enabled={wishlistModule?.enabled ?? false}
              href="/system/modules/wishlist"
              moduleName="module Wishlist"
            />
            <ExperienceModuleLink
              enabled={cartModule?.enabled ?? false}
              href="/system/modules/cart"
              icon={ShoppingCart}
              title="Giỏ hàng"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Giỏ hàng"
              enabled={cartModule?.enabled ?? false}
              href="/system/modules/cart"
              moduleName="module Giỏ hàng"
            />
            <ExperienceModuleLink
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              icon={Package}
              title="Đơn hàng"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Đơn hàng"
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              moduleName="module Đơn hàng"
            />
            <ExperienceModuleLink
              enabled={promotionsModule?.enabled ?? false}
              href="/system/modules/promotions"
              icon={Tag}
              title="Khuyến mãi"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Khuyến mãi"
              enabled={promotionsModule?.enabled ?? false}
              href="/system/modules/promotions"
              moduleName="module Khuyến mãi"
            />
          </ControlCard>

          <Card className="p-2">
            <div className="mb-2">
              <ExampleLinks
                links={[{ label: 'Trang danh sách', url: '/products' }]}
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
              <Eye size={18} /> Preview
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
            <BrowserFrame url="yoursite.com/products">
              <ProductsListPreview
                layoutStyle={config.layoutStyle}
                gridColumns={config.gridColumns}
                paginationType={currentLayoutConfig.paginationType}
                showSearch={currentLayoutConfig.showSearch}
                showCategories={currentLayoutConfig.showCategories}
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
                priceFilterMode={config.priceFilterMode}
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
