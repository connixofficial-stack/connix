'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Eye, LayoutTemplate, Loader2, Package, Save, ShoppingBag, ShoppingCart } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import { 
  ExperienceModuleLink, 
  ExperienceHintCard,
  CartPreview,
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

type CartLayoutStyle = 'drawer' | 'page' | 'table';

type CartExperienceConfig = {
  layoutStyle: CartLayoutStyle;
  layouts: {
    drawer: LayoutConfig;
    page: LayoutConfig;
    table: LayoutConfig;
  };
};

type LayoutConfig = {
  showExpiry: boolean;
  showNote: boolean;
};

const EXPERIENCE_KEY = 'cart_ui';

const LAYOUT_STYLES: LayoutOption<CartLayoutStyle>[] = [
  { description: 'Giỏ hàng dạng drawer/sidebar', id: 'drawer', label: 'Drawer' },
  { description: 'Giỏ hàng trang riêng', id: 'page', label: 'Page' },
  { description: 'Giỏ hàng dạng bảng dữ liệu', id: 'table', label: 'Table' },
];

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  showExpiry: false,
  showNote: false,
};

const DEFAULT_CONFIG: CartExperienceConfig = {
  layoutStyle: 'drawer',
  layouts: {
    drawer: { ...DEFAULT_LAYOUT_CONFIG },
    page: { ...DEFAULT_LAYOUT_CONFIG },
    table: { ...DEFAULT_LAYOUT_CONFIG },
  },
};

const HINTS = [
  'Drawer phù hợp cho quick checkout.',
  'Page layout cho cart phức tạp với nhiều options.',
  'Giỏ hàng hỗ trợ cả khách vãng lai và thành viên.',
  'Add to cart sẽ hiển thị toast và mở drawer/redirect theo layout.',
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

export default function CartExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const productsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'products' });
  const expiryFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableExpiry', moduleKey: 'cart' });
  const noteFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableNote', moduleKey: 'cart' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<CartExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<CartExperienceConfig> | undefined;
    const defaultLayoutWithModuleFeatures: LayoutConfig = {
      showExpiry: expiryFeature?.enabled ?? false,
      showNote: noteFeature?.enabled ?? false,
    };
    return {
      layoutStyle: raw?.layoutStyle ?? 'drawer',
      layouts: {
        drawer: { ...defaultLayoutWithModuleFeatures, ...raw?.layouts?.drawer },
        page: { ...defaultLayoutWithModuleFeatures, ...raw?.layouts?.page },
        table: { ...defaultLayoutWithModuleFeatures, ...raw?.layouts?.table },
      },
    };
  }, [experienceSetting?.value, expiryFeature?.enabled, noteFeature?.enabled]);

  const isLoading = experienceSetting === undefined || cartModule === undefined;
  const canUseCart = cartModule?.enabled ?? false;
  const canUseExpiry = canUseCart && (expiryFeature?.enabled ?? false);
  const canUseNote = canUseCart && (noteFeature?.enabled ?? false);

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);

  const beforeSaveTransform = (rawConfig: unknown) => {
    const configValue = rawConfig as CartExperienceConfig;
    const normalizeLayout = (layout: LayoutConfig) => enforceMultipleToggles(layout, [
      { key: 'showExpiry', enabled: expiryFeature?.enabled ?? false },
      { key: 'showNote', enabled: noteFeature?.enabled ?? false },
    ]);

    return {
      ...configValue,
      layouts: {
        drawer: normalizeLayout(configValue.layouts.drawer),
        page: normalizeLayout(configValue.layouts.page),
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
            <h1 className="text-2xl font-bold">Giỏ hàng</h1>
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
              label="Hết hạn giỏ"
              checked={currentLayoutConfig.showExpiry && canUseExpiry}
              onChange={(v) => updateLayoutConfig('showExpiry', v)}
              accentColor={brandColor}
              disabled={!canUseExpiry}
            />
            <ToggleRow
              label="Ghi chú"
              checked={currentLayoutConfig.showNote && canUseNote}
              onChange={(v) => updateLayoutConfig('showNote', v)}
              accentColor={brandColor}
              disabled={!canUseNote}
            />
          </ControlCard>

          <ControlCard title="Module liên quan">
            <ExperienceModuleLink
              enabled={cartModule?.enabled ?? false}
              href="/system/modules/cart"
              icon={ShoppingCart}
              title="Giỏ hàng"
              colorScheme="orange"
            />
            <ExperienceModuleLink
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              icon={ShoppingBag}
              title="Đơn hàng"
              colorScheme="orange"
            />
            <ExperienceModuleLink
              enabled={productsModule?.enabled ?? false}
              href="/system/modules/products"
              icon={Package}
              title="Sản phẩm"
              colorScheme="orange"
            />
            <ExperienceModuleLink
              enabled={true}
              href="/system/experiences/checkout"
              icon={ShoppingCart}
              title="Checkout"
              colorScheme="orange"
            />
            <ModuleFeatureStatus
              label="Hết hạn giỏ"
              enabled={expiryFeature?.enabled ?? false}
              href="/system/modules/cart"
              moduleName="module Giỏ hàng"
            />
            <ModuleFeatureStatus
              label="Ghi chú"
              enabled={noteFeature?.enabled ?? false}
              href="/system/modules/cart"
              moduleName="module Giỏ hàng"
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
            <BrowserFrame url="yoursite.com/cart">
              <CartPreview
                layoutStyle={config.layoutStyle}
                showExpiry={currentLayoutConfig.showExpiry && (expiryFeature?.enabled ?? false)}
                showNote={currentLayoutConfig.showNote && (noteFeature?.enabled ?? false)}
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
