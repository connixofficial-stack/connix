'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Eye, Heart, LayoutTemplate, Loader2, Package, Save, ShoppingCart } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import { 
  ExperienceModuleLink, 
  ExperienceHintCard,
  ExampleLinks,
  WishlistPreview,
} from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  DeviceToggle,
  deviceWidths,
  LayoutTabs,
  ControlCard,
  ToggleRow,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { useExperienceConfig, useExperienceSave, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';
import { enforceMultipleToggles } from '@/lib/experiences/module-toggle-guards';

type WishlistLayoutStyle = 'grid' | 'list' | 'table';

type WishlistExperienceConfig = {
  layoutStyle: WishlistLayoutStyle;
  layouts: {
    grid: LayoutConfig;
    list: LayoutConfig;
    table: LayoutConfig;
  };
};

type LayoutConfig = {
  showWishlistButton: boolean;
  showNote: boolean;
  showNotification: boolean;
  showAddToCartButton: boolean;
};

const EXPERIENCE_KEY = 'wishlist_ui';

const LAYOUT_STYLES: LayoutOption<WishlistLayoutStyle>[] = [
  { description: 'Hiển thị dạng lưới cards', id: 'grid', label: 'Grid' },
  { description: 'Hiển thị dạng danh sách chi tiết', id: 'list', label: 'List' },
  { description: 'Hiển thị dạng bảng dữ liệu', id: 'table', label: 'Table' },
];

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  showWishlistButton: true,
  showNote: true,
  showNotification: true,
  showAddToCartButton: true,
};

const DEFAULT_CONFIG: WishlistExperienceConfig = {
  layoutStyle: 'grid',
  layouts: {
    grid: { ...DEFAULT_LAYOUT_CONFIG },
    list: { ...DEFAULT_LAYOUT_CONFIG },
    table: { ...DEFAULT_LAYOUT_CONFIG },
  },
};

const HINTS = [
  'Bật module Wishlist trước khi cấu hình UX.',
  'Nút wishlist sẽ xuất hiện trên product cards và detail.',
  'Note và notification tùy chọn theo nhu cầu.',
  'Nút Add to Cart phụ thuộc vào Cart + Orders module.',
  'Mỗi layout có config riêng - chuyển tab để chỉnh.',
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

export default function WishlistExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const noteFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableNote', moduleKey: 'wishlist' });
  const notificationFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableNotification', moduleKey: 'wishlist' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const cartAvailable = (cartModule?.enabled ?? false) && (ordersModule?.enabled ?? false);
  const canUseWishlist = wishlistModule?.enabled ?? false;
  const canUseNote = canUseWishlist && (noteFeature?.enabled ?? true);
  const canUseNotification = canUseWishlist && (notificationFeature?.enabled ?? true);
  const canUseAddToCart = canUseWishlist && cartAvailable;

  const serverConfig = useMemo<WishlistExperienceConfig>(() => {
    const raw = experienceSetting?.value as Omit<Partial<WishlistExperienceConfig>, 'layoutStyle' | 'layouts'> & {
      layoutStyle?: WishlistLayoutStyle | 'masonry';
      layouts?: Partial<Record<'grid' | 'list' | 'table' | 'masonry', Partial<LayoutConfig>>>;
    } | undefined;
    const layoutStyle = raw?.layoutStyle === 'masonry' ? 'table' : (raw?.layoutStyle ?? 'grid');
    const tableOverrides = raw?.layouts?.table ?? raw?.layouts?.masonry;
    return {
      layoutStyle,
      layouts: {
        grid: { ...DEFAULT_LAYOUT_CONFIG, showNote: noteFeature?.enabled ?? true, showNotification: notificationFeature?.enabled ?? true, ...raw?.layouts?.grid },
        list: { ...DEFAULT_LAYOUT_CONFIG, showNote: noteFeature?.enabled ?? true, showNotification: notificationFeature?.enabled ?? true, ...raw?.layouts?.list },
        table: { ...DEFAULT_LAYOUT_CONFIG, showNote: noteFeature?.enabled ?? true, showNotification: notificationFeature?.enabled ?? true, ...tableOverrides },
      },
    };
  }, [experienceSetting?.value, noteFeature?.enabled, notificationFeature?.enabled]);

  const isLoading = experienceSetting === undefined || wishlistModule === undefined || cartModule === undefined || ordersModule === undefined;

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);

  const beforeSaveTransform = (rawConfig: unknown) => {
    const configValue = rawConfig as WishlistExperienceConfig;
    const normalizeLayout = (layout: LayoutConfig) => enforceMultipleToggles(layout, [
      { key: 'showNote', enabled: noteFeature?.enabled ?? true },
      { key: 'showNotification', enabled: notificationFeature?.enabled ?? true },
      { key: 'showAddToCartButton', enabled: cartAvailable },
    ]);

    return {
      ...configValue,
      layouts: {
        grid: normalizeLayout(configValue.layouts.grid),
        list: normalizeLayout(configValue.layouts.list),
        table: normalizeLayout(configValue.layouts.table),
      },
    };
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

  const currentLayoutConfig = config.layouts[config.layoutStyle];

  const updateLayoutConfig = <K extends keyof LayoutConfig>(
    key: K,
    value: LayoutConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        [prev.layoutStyle]: {
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
            <h1 className="text-2xl font-bold">Sản phẩm yêu thích</h1>
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
          style={{ backgroundColor: brandColor, color: '#ffffff' }}
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
          <ControlCard title="Khối hiển thị">
            <ToggleRow
              label="Nút Wishlist"
              checked={currentLayoutConfig.showWishlistButton && canUseWishlist}
              onChange={(v) => updateLayoutConfig('showWishlistButton', v)}
              accentColor={brandColor}
              disabled={!canUseWishlist}
            />
            <ToggleRow
              label="Ghi chú SP"
              checked={currentLayoutConfig.showNote && canUseNote}
              onChange={(v) => updateLayoutConfig('showNote', v)}
              accentColor={brandColor}
              disabled={!canUseNote}
            />
            <ToggleRow
              label="Thông báo"
              checked={currentLayoutConfig.showNotification && canUseNotification}
              onChange={(v) => updateLayoutConfig('showNotification', v)}
              accentColor={brandColor}
              disabled={!canUseNotification}
            />
            <ToggleRow
              label="Nút thêm giỏ hàng"
              description="Hiện nút add to cart"
              checked={currentLayoutConfig.showAddToCartButton && canUseAddToCart}
              onChange={(v) => updateLayoutConfig('showAddToCartButton', v)}
              accentColor={brandColor}
              disabled={!canUseAddToCart}
            />
          </ControlCard>

          <ControlCard title="Module liên quan">
            <ExperienceModuleLink
              enabled={wishlistModule?.enabled ?? false}
              href="/system/modules/wishlist"
              icon={Heart}
              title="Sản phẩm yêu thích"
              colorScheme="pink"
            />
            <ModuleFeatureStatus
              label="Ghi chú"
              enabled={noteFeature?.enabled ?? false}
              href="/system/modules/wishlist"
              moduleName="module Wishlist"
            />
            <ModuleFeatureStatus
              label="Thông báo"
              enabled={notificationFeature?.enabled ?? false}
              href="/system/modules/wishlist"
              moduleName="module Wishlist"
            />
            <ExperienceModuleLink
              enabled={cartModule?.enabled ?? false}
              href="/system/modules/cart"
              icon={ShoppingCart}
              title="Giỏ hàng"
              colorScheme="pink"
            />
            <ExperienceModuleLink
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              icon={Package}
              title="Đơn hàng"
              colorScheme="pink"
            />
          </ControlCard>

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

          <Card className="p-2">
            <div className="mb-2">
              <ExampleLinks
                links={[{ label: 'Trang wishlist', url: '/wishlist' }]}
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
            <BrowserFrame url="yoursite.com/wishlist">
              <WishlistPreview
                layoutStyle={config.layoutStyle}
                showWishlistButton={currentLayoutConfig.showWishlistButton}
                showNote={currentLayoutConfig.showNote && (noteFeature?.enabled ?? true)}
                showNotification={currentLayoutConfig.showNotification && (notificationFeature?.enabled ?? true)}
                showAddToCartButton={currentLayoutConfig.showAddToCartButton && cartAvailable}
                device={previewDevice}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
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
