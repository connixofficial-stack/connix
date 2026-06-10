'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { FileText, LayoutTemplate, Loader2, Save, User } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import {
  AccountProfilePreview,
  ExampleLinks,
  ExperienceHintCard,
  ExperienceModuleLink,
} from '@/components/experiences';
import { getAPCATextColor } from '@/components/site/account/profile/colors';
import {
  BrowserFrame,
  ColorConfigCard,
  ControlCard,
  DeviceToggle,
  LayoutTabs,
  MultiSelectRow,
  ToggleRow,
  deviceWidths,
  type LayoutOption,
  type DeviceType,
} from '@/components/experiences/editor';
import { EXPERIENCE_NAMES, MESSAGES, useExperienceConfig, useExperienceSave } from '@/lib/experiences';

type AccountProfileLayoutStyle = 'card' | 'sidebar' | 'compact';

type AccountProfileExperienceConfig = {
  layoutStyle: AccountProfileLayoutStyle;
  showQuickActions: boolean;
  showContactInfo: boolean;
  showAddress: boolean;
  actionItems: string[];
};

const EXPERIENCE_KEY = 'account_profile_ui';

const LAYOUT_STYLES: LayoutOption<AccountProfileLayoutStyle>[] = [
  { description: 'Profile dạng card gọn', id: 'card', label: 'Card' },
  { description: 'Thông tin + quick actions tách cột', id: 'sidebar', label: 'Sidebar' },
  { description: 'Gọn tối đa cho mobile', id: 'compact', label: 'Compact' },
];

const DEFAULT_CONFIG: AccountProfileExperienceConfig = {
  layoutStyle: 'card',
  showQuickActions: true,
  showContactInfo: true,
  showAddress: true,
  actionItems: ['orders', 'shop', 'wishlist'],
};

const ACTION_OPTIONS = [
  { value: 'orders', label: 'Đơn hàng' },
  { value: 'shop', label: 'Mua sắm' },
  { value: 'wishlist', label: 'Yêu thích' },
];

const ACTION_OPTION_VALUES = ACTION_OPTIONS.map((option) => option.value);

const HINTS = [
  'Trang profile dành cho khách đã đăng nhập.',
  'Quick actions giúp điều hướng nhanh tới Orders/Wishlist.',
  'Thông tin liên hệ lấy từ hồ sơ khách hàng.',
];

function ModuleFeatureStatus({ label, enabled, href, moduleName, accentColor }: { label: string; enabled: boolean; href: string; moduleName: string; accentColor: string }) {
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
      <Link href={href} className="text-xs font-medium hover:underline" style={{ color: accentColor }}>
        Đi đến →
      </Link>
    </div>
  );
}

export default function AccountProfileExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const customersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'customers' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<AccountProfileExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<AccountProfileExperienceConfig> | undefined;
    const rawActions = Array.isArray(raw?.actionItems)
      ? raw?.actionItems.filter((value): value is string => typeof value === 'string')
      : null;
    const normalizedActions = rawActions?.filter((value) => ACTION_OPTION_VALUES.includes(value)) ?? DEFAULT_CONFIG.actionItems;

    return {
      layoutStyle: raw?.layoutStyle ?? 'card',
      showQuickActions: raw?.showQuickActions ?? true,
      showContactInfo: raw?.showContactInfo ?? true,
      showAddress: raw?.showAddress ?? true,
      actionItems: normalizedActions,
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || customersModule === undefined;

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY])
  );
  const buttonTextColor = useMemo(() => getAPCATextColor(brandColor, 14, 600), [brandColor]);

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
            <LayoutTemplate className="w-5 h-5" style={{ color: brandColor }} />
            <h1 className="text-2xl font-bold">Profile (Account)</h1>
          </div>
          <Link href="/system/experiences" className="text-sm hover:underline" style={{ color: brandColor }}>
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-1.5"
          style={{ backgroundColor: brandColor, color: buttonTextColor }}
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
          <ControlCard title="Thông tin cá nhân">
            <ToggleRow
              label="Thông tin liên hệ"
              checked={config.showContactInfo}
              onChange={(v) => setConfig(prev => ({ ...prev, showContactInfo: v }))}
              accentColor={brandColor}
            />
            <ToggleRow
              label="Địa chỉ mặc định"
              checked={config.showAddress}
              onChange={(v) => setConfig(prev => ({ ...prev, showAddress: v }))}
              accentColor={brandColor}
            />
          </ControlCard>

          <ControlCard title="Tác vụ nhanh">
            <ToggleRow
              label="Quick actions"
              checked={config.showQuickActions}
              onChange={(v) => setConfig(prev => ({ ...prev, showQuickActions: v }))}
              accentColor={brandColor}
            />
            <MultiSelectRow
              label="Chọn tác vụ"
              values={config.actionItems}
              options={ACTION_OPTIONS}
              onChange={(values) => setConfig(prev => ({ ...prev, actionItems: values }))}
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
              enabled={customersModule?.enabled ?? false}
              href="/system/modules/customers"
              icon={User}
              title="Khách hàng"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Khách hàng"
              enabled={customersModule?.enabled ?? false}
              href="/system/modules/customers"
              moduleName="module Khách hàng"
              accentColor={brandColor}
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
              links={[{ label: 'Trang profile', url: '/account/profile' }]}
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
                accentColor={brandColor}
              />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/account/profile">
              <AccountProfilePreview
                layoutStyle={config.layoutStyle}
                device={previewDevice}
                showQuickActions={config.showQuickActions}
                showContactInfo={config.showContactInfo}
                showAddress={config.showAddress}
                actionItems={config.actionItems}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
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
