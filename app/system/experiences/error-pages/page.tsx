'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Eye, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import {
  BrowserFrame,
  ColorConfigCard,
  ControlCard,
  DeviceToggle,
  deviceWidths,
  LayoutTabs,
  SelectRow,
  ToggleRow,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import {
  ErrorPagesPreview,
  ExampleLinks,
  ExperienceHintCard,
} from '@/components/experiences';
import {
  DEFAULT_ERROR_PAGES_CONFIG,
  ERROR_CODE_COPY,
  ERROR_PAGES_EXPERIENCE_KEY,
  ERROR_STATUS_CODES,
  EXPERIENCE_NAMES,
  MESSAGES,
  parseErrorPagesConfig,
  type ErrorPagesExperienceConfig,
  type ErrorPagesLayoutStyle,
  useExperienceConfig,
  useExperienceSave,
} from '@/lib/experiences';

const LAYOUT_STYLES: LayoutOption<ErrorPagesLayoutStyle>[] = [
  { description: 'Nội dung căn giữa, tối giản và rõ ràng', id: 'centered', label: 'Centered' },
  { description: 'Chia 2 cột: nội dung + khung thông tin', id: 'split', label: 'Split' },
  { description: 'Biểu tượng lớn, text căn giữa', id: 'illustrated', label: 'Illustrated' },
];

const HINTS = [
  'Dùng dropdown để preview nhanh nhiều mã lỗi khác nhau.',
  'Hai nút CTA giúp người dùng quay lại luồng chính.',
  'Màu thương hiệu tự sync từ Settings và có thể override ngay trong preview.',
];

export default function ErrorPagesExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: ERROR_PAGES_EXPERIENCE_KEY });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<ErrorPagesExperienceConfig>(
    () => parseErrorPagesConfig(experienceSetting?.value),
    [experienceSetting?.value]
  );

  const isLoading = experienceSetting === undefined;
  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_ERROR_PAGES_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    ERROR_PAGES_EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[ERROR_PAGES_EXPERIENCE_KEY])
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
            <LayoutTemplate className="w-5 h-5 text-orange-600" />
            <h1 className="text-2xl font-bold">Trang lỗi hệ thống</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-orange-600 hover:bg-orange-500 gap-1.5"
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

          <ControlCard title="Nội dung">
            <SelectRow
              label="Mã lỗi"
              value={String(config.statusCode)}
              options={ERROR_STATUS_CODES.map((code) => ({
                value: String(code),
                label: `${code} · ${ERROR_CODE_COPY[code].headline}`,
              }))}
              onChange={(value) => setConfig(prev => ({ ...prev, statusCode: Number(value) }))}
            />
            <ToggleRow
              label="Hiển thị nút Về trang chủ"
              checked={config.showGoHome}
              onChange={(value) => setConfig(prev => ({ ...prev, showGoHome: value }))}
              accentColor={brandColor}
            />
            <ToggleRow
              label="Hiển thị nút Quay lại"
              checked={config.showGoBack}
              onChange={(value) => setConfig(prev => ({ ...prev, showGoBack: value }))}
              accentColor={brandColor}
            />
            <ToggleRow
              label="Câu xin lỗi ngắn"
              checked={config.showShortApology}
              onChange={(value) => setConfig(prev => ({ ...prev, showShortApology: value }))}
              accentColor={brandColor}
            />
          </ControlCard>

          <ControlCard title="Tùy biến câu chữ">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Tiêu đề tùy biến</Label>
                <Input
                  value={config.customHeadline || ''}
                  onChange={(event) => setConfig(prev => ({ ...prev, customHeadline: event.target.value }))}
                  placeholder="Để trống nếu dùng mặc định"
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả tùy biến</Label>
                <textarea
                  value={config.customMessage || ''}
                  onChange={(event) => setConfig(prev => ({ ...prev, customMessage: event.target.value }))}
                  rows={3}
                  placeholder="Để trống nếu dùng mặc định"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </ControlCard>

          <ControlCard title="Link xem thử">
            <ExampleLinks
              compact
              color={brandColor}
              links={ERROR_STATUS_CODES.slice(0, 3).map((code) => ({
                label: `/${code}`,
                url: `/errors/${code}`,
                description: ERROR_CODE_COPY[code].headline,
              }))}
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
            <BrowserFrame url={`yoursite.com/errors/${config.statusCode}`}>
              <ErrorPagesPreview
                layoutStyle={config.layoutStyle}
                statusCode={config.statusCode}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                showGoHome={config.showGoHome}
                showGoBack={config.showGoBack}
                showShortApology={config.showShortApology}
                customHeadline={config.customHeadline}
                customMessage={config.customMessage}
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
