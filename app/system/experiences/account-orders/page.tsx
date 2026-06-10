'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { FileText, LayoutTemplate, Loader2, Package, Save, ShoppingBag } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import {
  AccountOrdersPreview,
  ExampleLinks,
  ExperienceHintCard,
  ExperienceModuleLink,
} from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  ControlCard,
  DeviceToggle,
  LayoutTabs,
  MultiSelectRow,
  SelectRow,
  ToggleRow,
  deviceWidths,
  type LayoutOption,
  type DeviceType,
} from '@/components/experiences/editor';
import { EXPERIENCE_NAMES, MESSAGES, useExperienceConfig, useExperienceSave, useOrderStatuses } from '@/lib/experiences';

type AccountOrdersLayoutStyle = 'cards' | 'compact' | 'timeline';
type PaginationType = 'pagination' | 'infiniteScroll';

type AccountOrdersExperienceConfig = {
  layoutStyle: AccountOrdersLayoutStyle;
  showStats: boolean;
  showOrderItems: boolean;
  showPaymentMethod: boolean;
  showShippingMethod: boolean;
  showShippingAddress: boolean;
  showTracking: boolean;
  showTimeline: boolean;
  paginationType: PaginationType;
  ordersPerPage: number;
  defaultStatusFilter: string[];
};

const EXPERIENCE_KEY = 'account_orders_ui';

const LAYOUT_STYLES: LayoutOption<AccountOrdersLayoutStyle>[] = [
  { description: 'Cards đầy đủ thông tin', id: 'cards', label: 'Cards' },
  { description: 'Gọn hơn cho mobile', id: 'compact', label: 'Compact' },
  { description: 'Nhấn mạnh tiến trình', id: 'timeline', label: 'Timeline' },
];

const DEFAULT_CONFIG: AccountOrdersExperienceConfig = {
  layoutStyle: 'cards',
  showStats: true,
  showOrderItems: true,
  showPaymentMethod: true,
  showShippingMethod: true,
  showShippingAddress: true,
  showTracking: true,
  showTimeline: true,
  paginationType: 'pagination',
  ordersPerPage: 12,
  defaultStatusFilter: [],
};

const HINTS = [
  'Accordion hiển thị chi tiết từng đơn hàng.',
  'Hủy đơn chỉ áp dụng khi trạng thái Pending.',
  'Tracking cần cập nhật mã vận đơn từ admin.',
  'Timeline hiện trạng thái hiện tại của đơn hàng.',
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

export default function AccountOrdersExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const customersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'customers' });
  const stockFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableStock', moduleKey: 'products' });
  const paymentFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enablePayment', moduleKey: 'orders' });
  const shippingFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableShipping', moduleKey: 'orders' });
  const trackingFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableTracking', moduleKey: 'orders' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const { statuses: orderStatuses } = useOrderStatuses();
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<AccountOrdersExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<AccountOrdersExperienceConfig> | undefined;
    const normalizePaginationType = (value?: string | boolean): PaginationType => {
      if (value === 'infiniteScroll') return 'infiniteScroll';
      if (value === 'pagination') return 'pagination';
      if (value === false) return 'infiniteScroll';
      return 'pagination';
    };
    return {
      layoutStyle: raw?.layoutStyle ?? 'cards',
      showStats: raw?.showStats ?? true,
      showOrderItems: raw?.showOrderItems ?? true,
      showPaymentMethod: raw?.showPaymentMethod ?? true,
      showShippingMethod: raw?.showShippingMethod ?? true,
      showShippingAddress: raw?.showShippingAddress ?? true,
      showTracking: raw?.showTracking ?? true,
      showTimeline: raw?.showTimeline ?? true,
      paginationType: normalizePaginationType(raw?.paginationType),
      ordersPerPage: raw?.ordersPerPage ?? 12,
      defaultStatusFilter: Array.isArray(raw?.defaultStatusFilter)
        ? raw?.defaultStatusFilter.filter((value) => typeof value === 'string')
        : [],
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || ordersModule === undefined || customersModule === undefined;

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY])
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
            <LayoutTemplate className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold">Đơn hàng (Account)</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 gap-1.5"
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
            <MultiSelectRow
              label="Trạng thái mặc định"
              values={config.defaultStatusFilter}
              options={orderStatuses.map((status) => ({ value: status.key, label: status.label }))}
              onChange={(values) => setConfig(prev => ({ ...prev, defaultStatusFilter: values }))}
            />
            <ToggleRow
              label="Thống kê đơn hàng"
              checked={config.showStats}
              onChange={(v) => setConfig(prev => ({ ...prev, showStats: v }))}
              accentColor="#4f46e5"
            />
            <ToggleRow
              label="Danh sách sản phẩm"
              checked={config.showOrderItems}
              onChange={(v) => setConfig(prev => ({ ...prev, showOrderItems: v }))}
              accentColor="#4f46e5"
            />
            {paymentFeature?.enabled && (
              <ToggleRow
                label="Phương thức thanh toán"
                checked={config.showPaymentMethod}
                onChange={(v) => setConfig(prev => ({ ...prev, showPaymentMethod: v }))}
                accentColor="#4f46e5"
              />
            )}
            {shippingFeature?.enabled && (
              <ToggleRow
                label="Phương thức giao hàng"
                checked={config.showShippingMethod}
                onChange={(v) => setConfig(prev => ({ ...prev, showShippingMethod: v }))}
                accentColor="#4f46e5"
              />
            )}
            {shippingFeature?.enabled && (
              <ToggleRow
                label="Địa chỉ giao hàng"
                checked={config.showShippingAddress}
                onChange={(v) => setConfig(prev => ({ ...prev, showShippingAddress: v }))}
                accentColor="#4f46e5"
              />
            )}
            {trackingFeature?.enabled && (
              <ToggleRow
                label="Tracking"
                checked={config.showTracking}
                onChange={(v) => setConfig(prev => ({ ...prev, showTracking: v }))}
                accentColor="#4f46e5"
              />
            )}
            <ToggleRow
              label="Timeline"
              checked={config.showTimeline}
              onChange={(v) => setConfig(prev => ({ ...prev, showTimeline: v }))}
              accentColor="#4f46e5"
            />
          </ControlCard>
          <ControlCard title="Phân trang">
            <SelectRow
              label="Kiểu phân trang"
              value={config.paginationType}
              options={[
                { value: 'pagination', label: 'Phân trang' },
                { value: 'infiniteScroll', label: 'Cuộn vô hạn' },
              ]}
              onChange={(value) => setConfig(prev => ({ ...prev, paginationType: value as PaginationType }))}
            />
            <SelectRow
              label="Đơn mỗi trang"
              value={String(config.ordersPerPage)}
              options={[
                { value: '6', label: '6' },
                { value: '12', label: '12' },
                { value: '20', label: '20' },
                { value: '24', label: '24' },
              ]}
              onChange={(value) => setConfig(prev => ({ ...prev, ordersPerPage: Number(value) }))}
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
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              icon={ShoppingBag}
              title="Đơn hàng"
              colorScheme="blue"
            />
            <ModuleFeatureStatus
              label="Đơn hàng"
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              moduleName="module Đơn hàng"
            />
            <ExperienceModuleLink
              enabled={customersModule?.enabled ?? false}
              href="/system/modules/customers"
              icon={Package}
              title="Khách hàng"
              colorScheme="blue"
            />
            <ModuleFeatureStatus
              label="Khách hàng"
              enabled={customersModule?.enabled ?? false}
              href="/system/modules/customers"
              moduleName="module Khách hàng"
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

          <ControlCard title="Link xem thử">
            <ExampleLinks
              links={[{ label: 'Trang đơn hàng', url: '/account/orders' }]}
              color={brandColor}
              compact
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
              <FileText size={18} /> Preview
            </CardTitle>
            <div className="flex items-center gap-3">
              <LayoutTabs
                layouts={LAYOUT_STYLES}
                activeLayout={config.layoutStyle}
                onChange={(layout) => setConfig(prev => ({ ...prev, layoutStyle: layout }))}
                accentColor="#4f46e5"
              />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/account/orders">
              <AccountOrdersPreview
                layoutStyle={config.layoutStyle}
                showStats={config.showStats}
                showOrderItems={config.showOrderItems}
                showPaymentMethod={config.showPaymentMethod}
                showShippingMethod={config.showShippingMethod}
                showShippingAddress={config.showShippingAddress}
                showTracking={config.showTracking}
                showTimeline={config.showTimeline}
                paginationType={config.paginationType}
                ordersPerPage={config.ordersPerPage}
                defaultStatusFilter={config.defaultStatusFilter}
                orderStatuses={orderStatuses}
                stockEnabled={stockFeature?.enabled ?? false}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
              />
            </BrowserFrame>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Device: {previewDevice === 'desktop' && 'Desktop'}{previewDevice === 'tablet' && 'Tablet'}{previewDevice === 'mobile' && 'Mobile'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
