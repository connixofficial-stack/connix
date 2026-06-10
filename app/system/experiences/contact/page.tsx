'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AlertCircle, Eye, LayoutTemplate, Loader2, Mail, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import {
  ContactPreview,
  ExampleLinks,
  ExperienceHintCard,
  ExperienceModuleLink,
} from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  ControlCard,
  DeviceToggle,
  deviceWidths,
  LayoutTabs,
  ToggleRow,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { useBrandColors } from '@/components/site/hooks';
import {
  CONTACT_EXPERIENCE_KEY,
  DEFAULT_CONTACT_CONFIG,
  parseContactExperienceConfig,
  useExperienceConfig,
  useExperienceSave,
  EXPERIENCE_NAMES,
  MESSAGES,
  type ContactExperienceConfig,
  type ContactLayoutStyle,
} from '@/lib/experiences';
import { enforceMultipleToggles } from '@/lib/experiences/module-toggle-guards';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';

const LAYOUT_STYLES: LayoutOption<ContactLayoutStyle>[] = [
  { description: 'Chỉ có form liên hệ', id: 'form-only', label: 'Form Only' },
  { description: 'Form + Map', id: 'with-map', label: 'With Map' },
  { description: 'Form + Contact Info sidebar', id: 'with-info', label: 'With Info' },
];

const HINTS = [
  'Preview mock giúp xem thay đổi ngay, không cần lưu mới thấy.',
  'Thông tin liên hệ và social phụ thuộc module Settings.',
  'Gửi form liên hệ phụ thuộc module Tin nhắn liên hệ.',
  'Nếu feature Settings bị tắt, block tương ứng sẽ không hiển thị ở preview.',
  'Các khối hiển thị dùng chung giữa các layout.',
];

function ModuleFeatureStatus({
  label,
  enabled,
  href,
  moduleName,
}: {
  label: string;
  enabled: boolean;
  href: string;
  moduleName: string;
}) {
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

export default function ContactExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: CONTACT_EXPERIENCE_KEY });
  const settingsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'settings' });
  const contactInboxModule = useQuery(api.admin.modules.getModuleByKey, { key: 'contactInbox' });
  const contactFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'settings', featureKey: 'enableContact' });
  const socialFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'settings', featureKey: 'enableSocial' });
  const mailFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'settings', featureKey: 'enableMail' });
  const contactFormFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'contactInbox', featureKey: 'enableContactFormSubmission' });
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');

  const serverConfig = useMemo<ContactExperienceConfig>(
    () => parseContactExperienceConfig(experienceSetting?.value),
    [experienceSetting?.value]
  );

  const isLoading = experienceSetting === undefined
    || settingsModule === undefined
    || contactInboxModule === undefined
    || contactFeature === undefined
    || socialFeature === undefined
    || mailFeature === undefined
    || contactFormFeature === undefined
    || contactSettings === undefined;

  const settingsEnabled = settingsModule?.enabled ?? false;
  const contactInboxEnabled = contactInboxModule?.enabled ?? false;
  const contactEnabled = settingsEnabled && (contactFeature?.enabled ?? false);
  const socialEnabled = settingsEnabled && (socialFeature?.enabled ?? false);
  const mailEnabled = settingsEnabled && (mailFeature?.enabled ?? false);
  const formEnabled = contactInboxEnabled && (contactFormFeature?.enabled ?? false);
  const mapData = useMemo(() => getContactMapDataFromSettings(contactSettings ?? []), [contactSettings]);

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONTACT_CONFIG, isLoading);
  const beforeSaveTransform = (rawConfig: unknown) => {
    const configValue = rawConfig as ContactExperienceConfig;
    return enforceMultipleToggles(configValue, [
      { key: 'showMap', enabled: contactEnabled },
      { key: 'showContactInfo', enabled: contactEnabled },
      { key: 'showSocialLinks', enabled: socialEnabled },
    ]);
  };

  const { handleSave, isSaving } = useExperienceSave(
    CONTACT_EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[CONTACT_EXPERIENCE_KEY]),
    undefined,
    beforeSaveTransform
  );

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const updateDisplayConfig = <K extends keyof Pick<ContactExperienceConfig, 'showContactInfo' | 'showMap' | 'showSocialLinks'>>(
    key: K,
    value: ContactExperienceConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
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
            <LayoutTemplate className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold">Trang liên hệ</h1>
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
              label="Bản đồ (Map)"
              checked={config.showMap && contactEnabled}
              onChange={(v) => updateDisplayConfig('showMap', v)}
              accentColor={brandColor}
              disabled={!contactEnabled}
            />
            <ToggleRow
              label="Thông tin liên hệ"
              checked={config.showContactInfo && contactEnabled}
              onChange={(v) => updateDisplayConfig('showContactInfo', v)}
              accentColor={brandColor}
              disabled={!contactEnabled}
            />
            <ToggleRow
              label="Social media"
              checked={config.showSocialLinks && socialEnabled}
              onChange={(v) => updateDisplayConfig('showSocialLinks', v)}
              accentColor={brandColor}
              disabled={!socialEnabled}
            />
            {!settingsEnabled && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-xs text-amber-700 dark:text-amber-300 mt-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>Module Settings đang tắt nên khối hiển thị bị khoá.</span>
              </div>
            )}
          </ControlCard>

          <ControlCard title="Module liên quan">
            <ExperienceModuleLink
              enabled={settingsEnabled}
              href="/system/modules/settings"
              icon={Mail}
              title="System Settings"
              colorScheme="cyan"
            />
            <ExperienceModuleLink
              enabled={contactInboxEnabled}
              href="/system/modules/contactInbox"
              icon={Mail}
              title="Tin nhắn liên hệ"
              colorScheme="green"
            />
            <ModuleFeatureStatus
              label="Thông tin liên hệ"
              enabled={contactEnabled}
              href="/system/modules/settings"
              moduleName="Module Settings"
            />
            <ModuleFeatureStatus
              label="Gửi form liên hệ"
              enabled={formEnabled}
              href="/system/modules/contactInbox"
              moduleName="Module Tin nhắn liên hệ"
            />
            <ModuleFeatureStatus
              label="Mạng xã hội"
              enabled={socialEnabled}
              href="/system/modules/settings"
              moduleName="Module Settings"
            />
            <ModuleFeatureStatus
              label="Cấu hình Email"
              enabled={mailEnabled}
              href="/system/modules/settings"
              moduleName="Module Settings"
            />
          </ControlCard>

          <Card className="p-3 space-y-3">
            <ExampleLinks
              compact
              links={[{ label: 'Xem trang Contact thực tế', url: '/contact', description: 'Mở route thật để đối chiếu runtime' }]}
              color={brandColor}
            />
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
            <BrowserFrame url="yoursite.com/contact">
              <ContactPreview
                layoutStyle={config.layoutStyle}
                showMap={config.showMap && contactEnabled}
                showContactInfo={config.showContactInfo && contactEnabled}
                showSocialLinks={config.showSocialLinks && socialEnabled}
                device={previewDevice}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                mapData={mapData}
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
