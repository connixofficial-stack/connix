'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Eye, LayoutTemplate, Loader2, Package, Save, ShoppingCart } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import { getCheckoutColors, type CheckoutColors } from '@/components/site/checkout/colors';
import { 
  ExperienceModuleLink, 
  ExperienceHintCard,
  CheckoutPreview,
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
import { useExampleProduct, useExperienceConfig, useExperienceSave, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';
import { enforceMultipleToggles } from '@/lib/experiences/module-toggle-guards';

type CheckoutFlowStyle = 'single-page' | 'multi-step' | 'wizard-accordion';
type OrderSummaryPosition = 'right' | 'bottom';

type CheckoutExperienceConfig = {
  flowStyle: CheckoutFlowStyle;
  showBuyNow: boolean;
  layouts: {
    'single-page': LayoutConfig;
    'multi-step': LayoutConfig;
    'wizard-accordion': LayoutConfig;
  };
};

type LayoutConfig = {
  orderSummaryPosition: OrderSummaryPosition;
  showPaymentMethods: boolean;
  showShippingOptions: boolean;
};

const EXPERIENCE_KEY = 'checkout_ui';

const FLOW_STYLES: LayoutOption<CheckoutFlowStyle>[] = [
  { description: 'Tất cả trong 1 trang', id: 'single-page', label: 'Single Page' },
  { description: 'Chia thành nhiều bước', id: 'multi-step', label: 'Multi-Step' },
  { description: 'Wizard dạng accordion', id: 'wizard-accordion', label: 'Wizard Accordion' },
];

const SUMMARY_POSITIONS: { id: OrderSummaryPosition; label: string }[] = [
  { id: 'right', label: 'Right Sidebar' },
  { id: 'bottom', label: 'Bottom' },
];

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  orderSummaryPosition: 'right',
  showPaymentMethods: true,
  showShippingOptions: true,
};

const DEFAULT_CONFIG: CheckoutExperienceConfig = {
  flowStyle: 'multi-step',
  showBuyNow: true,
  layouts: {
    'single-page': { ...DEFAULT_LAYOUT_CONFIG },
    'multi-step': { ...DEFAULT_LAYOUT_CONFIG },
    'wizard-accordion': { ...DEFAULT_LAYOUT_CONFIG },
  },
};

const HINTS = [
  'Multi-step dễ theo dõi, single-page nhanh hơn.',
  'Right sidebar phù hợp desktop, bottom cho mobile.',
  'Payment/shipping cần bật module Orders trước.',
  'Buy now phụ thuộc cấu hình checkout.',
  'Mỗi flow có config riêng - chuyển tab để chỉnh.',
];

function ModuleFeatureStatus({
  label,
  enabled,
  href,
  moduleName,
  tokens,
}: {
  label: string;
  enabled: boolean;
  href: string;
  moduleName: string;
  tokens: CheckoutColors;
}) {
  return (
    <div
      className="mt-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs"
      style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted, color: tokens.metaText }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: enabled ? tokens.primary : tokens.mutedText }}
        />
        <div>
          <p className="text-sm font-medium" style={{ color: tokens.bodyText }}>{label}</p>
          <p className="text-xs" style={{ color: tokens.metaText }}>
            {enabled ? 'Đang bật' : 'Chưa bật'} · Nếu muốn {enabled ? 'tắt' : 'bật'} hãy vào {moduleName}
          </p>
        </div>
      </div>
      <Link href={href} className="text-xs font-medium hover:underline" style={{ color: tokens.linkText }}>
        Đi đến →
      </Link>
    </div>
  );
}

export default function CheckoutExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
  const paymentFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enablePayment', moduleKey: 'orders' });
  const shippingFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableShipping', moduleKey: 'orders' });
  const darkModeSetting = useQuery(api.settings.getByKey, { key: 'site_dark_mode' });
  const exampleProduct = useExampleProduct();
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  const siteDarkMode = (darkModeSetting?.value as string) || 'light';
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const tokens = useMemo(
    () => getCheckoutColors(brandColor, secondaryColor, colorMode, isDark),
    [brandColor, secondaryColor, colorMode, isDark]
  );

  const serverConfig = useMemo<CheckoutExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<CheckoutExperienceConfig> | undefined;
    const defaultLayoutWithFeatures: LayoutConfig = {
      orderSummaryPosition: DEFAULT_LAYOUT_CONFIG.orderSummaryPosition,
      showPaymentMethods: paymentFeature?.enabled ?? true,
      showShippingOptions: shippingFeature?.enabled ?? true,
    };
    return {
      flowStyle: raw?.flowStyle ?? 'multi-step',
      showBuyNow: raw?.showBuyNow ?? true,
      layouts: {
        'single-page': { ...defaultLayoutWithFeatures, ...raw?.layouts?.['single-page'] },
        'multi-step': { ...defaultLayoutWithFeatures, ...raw?.layouts?.['multi-step'] },
        'wizard-accordion': { ...defaultLayoutWithFeatures, ...raw?.layouts?.['wizard-accordion'] },
      },
    };
  }, [experienceSetting?.value, paymentFeature?.enabled, shippingFeature?.enabled]);

  const isLoading = experienceSetting === undefined || ordersModule === undefined || cartModule === undefined;
  const canUseOrders = ordersModule?.enabled ?? false;
  const canUsePayment = canUseOrders && (paymentFeature?.enabled ?? false);
  const canUseShipping = canUseOrders && (shippingFeature?.enabled ?? false);

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const beforeSaveTransform = (rawConfig: unknown) => {
    const configValue = rawConfig as CheckoutExperienceConfig;
    const normalizeLayout = (layout: LayoutConfig) => enforceMultipleToggles(layout, [
      { key: 'showPaymentMethods', enabled: canUsePayment },
      { key: 'showShippingOptions', enabled: canUseShipping },
    ]);

    return {
      ...configValue,
      showBuyNow: canUseOrders ? configValue.showBuyNow : false,
      layouts: {
        'single-page': normalizeLayout(configValue.layouts['single-page']),
        'multi-step': normalizeLayout(configValue.layouts['multi-step']),
        'wizard-accordion': normalizeLayout(configValue.layouts['wizard-accordion']),
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

  const currentLayoutConfig = config.layouts[config.flowStyle];

  const updateLayoutConfig = <K extends keyof LayoutConfig>(
    key: K,
    value: LayoutConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        [prev.flowStyle]: {
          ...prev.layouts[prev.flowStyle],
          [key]: value,
        },
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: tokens.metaText }}>{MESSAGES.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" style={{ color: tokens.primary }} />
            <h1 className="text-2xl font-bold">Thanh toán</h1>
          </div>
          <Link href="/system/experiences" className="text-sm hover:underline" style={{ color: tokens.linkText }}>
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-1.5"
          style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
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
              label="Buy Now"
              checked={config.showBuyNow && canUseOrders}
              onChange={(v) => setConfig(prev => ({ ...prev, showBuyNow: v }))}
              accentColor={tokens.primary}
              disabled={!canUseOrders}
            />
            <ToggleRow
              label="Payment Methods"
              checked={currentLayoutConfig.showPaymentMethods && canUsePayment}
              onChange={(v) => updateLayoutConfig('showPaymentMethods', v)}
              accentColor={tokens.primary}
              disabled={!canUsePayment}
            />
            <ToggleRow
              label="Shipping Options"
              checked={currentLayoutConfig.showShippingOptions && canUseShipping}
              onChange={(v) => updateLayoutConfig('showShippingOptions', v)}
              accentColor={tokens.primary}
              disabled={!canUseShipping}
            />
          </ControlCard>

          <ControlCard title={`Cấu hình ${config.flowStyle}`}>
            <SelectRow
              label="Vị trí Order Summary"
              value={currentLayoutConfig.orderSummaryPosition}
              onChange={(v) => updateLayoutConfig('orderSummaryPosition', v as OrderSummaryPosition)}
              options={SUMMARY_POSITIONS.map(p => ({ label: p.label, value: p.id }))}
            />
          </ControlCard>

          <ControlCard title="Module liên quan">
            <ExperienceModuleLink
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              icon={Package}
              title="Đơn hàng"
              colorScheme="green"
            />
            <ModuleFeatureStatus
              label="Thanh toán"
              enabled={paymentFeature?.enabled ?? false}
              href="/system/modules/orders"
              moduleName="module Đơn hàng"
              tokens={tokens}
            />
            <ModuleFeatureStatus
              label="Vận chuyển"
              enabled={shippingFeature?.enabled ?? false}
              href="/system/modules/orders"
              moduleName="module Đơn hàng"
              tokens={tokens}
            />
            <ExperienceModuleLink
              enabled={cartModule?.enabled ?? false}
              href="/system/modules/cart"
              icon={ShoppingCart}
              title="Giỏ hàng"
              colorScheme="green"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ghi chú</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-2">
            {exampleProduct && (
              <div className="mb-2">
                <ExampleLinks
                  links={[{ label: 'Xem checkout mẫu', url: `/checkout?productId=${exampleProduct._id}&quantity=1` }]}
                  color={tokens.primary}
                  compact
                />
              </div>
            )}
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
                layouts={FLOW_STYLES}
                activeLayout={config.flowStyle}
                onChange={(layout) => setConfig(prev => ({ ...prev, flowStyle: layout }))}
                accentColor={tokens.primary}
              />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/checkout">
              <CheckoutPreview
                flowStyle={config.flowStyle}
                orderSummaryPosition={currentLayoutConfig.orderSummaryPosition}
                showPaymentMethods={currentLayoutConfig.showPaymentMethods && (paymentFeature?.enabled ?? true)}
                showShippingOptions={currentLayoutConfig.showShippingOptions && (shippingFeature?.enabled ?? true)}
                device={previewDevice}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                isDark={isDark}
              />
            </BrowserFrame>
          </div>
          <div className="mt-3 text-xs" style={{ color: tokens.metaText }}>
            Style: <strong style={{ color: tokens.bodyText }}>{FLOW_STYLES.find(s => s.id === config.flowStyle)?.label}</strong>
            {' • '}{previewDevice === 'desktop' && 'Desktop (1920px)'}{previewDevice === 'tablet' && 'Tablet (768px)'}{previewDevice === 'mobile' && 'Mobile (375px)'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
