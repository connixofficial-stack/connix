'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Eye, FileText, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { ExampleLinks, ExperienceHintCard, ExperienceModuleLink, ResourceDetailPreview } from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  ControlCard,
  DeviceToggle,
  LayoutTabs,
  SelectRow,
  ToggleRow,
  deviceWidths,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { useBrandColors } from '@/components/site/hooks';
import { EXPERIENCE_NAMES, MESSAGES, useExampleResourceSlug, useExperienceConfig, useExperienceSave } from '@/lib/experiences';

type DetailLayoutStyle = 'classic' | 'modern' | 'minimal';

type ResourcesDetailExperienceConfig = {
  layoutStyle: DetailLayoutStyle;
  showGallery: boolean;
  galleryMode?: 'scroll' | 'grid';
  showRelated: boolean;
  showStickyCta: boolean;
  showResourceFilters: boolean;
  cornerRadius: 'none' | 'sm' | 'lg';
};

const EXPERIENCE_KEY = 'resources_detail_ui';

const LAYOUTS: LayoutOption<DetailLayoutStyle>[] = [
  { id: 'classic', label: 'Cổ điển', description: 'Hero + thẻ tải tài nguyên' },
  { id: 'modern', label: 'Hiện đại', description: 'Hero tối màu, tập trung CTA' },
  { id: 'minimal', label: 'Tối giản', description: 'Tập trung nội dung và tải nhanh' },
];

const DEFAULT_CONFIG: ResourcesDetailExperienceConfig = {
  layoutStyle: 'classic',
  showGallery: true,
  galleryMode: 'grid',
  showRelated: true,
  showStickyCta: true,
  showResourceFilters: true,
  cornerRadius: 'lg',
};

export default function ResourcesDetailExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const resourcesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'resources' });
  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'resources', featureKey: 'enableResourceFilters' });
  const brandColors = useBrandColors();
  const exampleResourceSlug = useExampleResourceSlug();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const serverConfig = useMemo<ResourcesDetailExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<ResourcesDetailExperienceConfig> | undefined;
    return { ...DEFAULT_CONFIG, ...raw };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || resourcesModule === undefined || resourceFiltersFeature === undefined;
  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY])
  );

  const updateConfig = <K extends keyof ResourcesDetailExperienceConfig>(key: K, value: ResourcesDetailExperienceConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">{MESSAGES.loading}</div>;
  }

  const previewUrl = `/resources/${exampleResourceSlug || 'checklist-ra-mat-website'}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-bold">Chi tiết tài nguyên</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500">
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{hasChanges ? 'Lưu' : 'Đã lưu'}</span>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Thiết lập hiển thị</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ControlCard title="Màu thương hiệu">
            <ColorConfigCard primary={brandColor} secondary={secondaryColor} mode={colorMode} onPrimaryChange={setBrandColor} onSecondaryChange={setSecondaryColor} onModeChange={setColorMode} />
          </ControlCard>
          <ControlCard title="Khối hiển thị">
            <ToggleRow label="Gallery" checked={config.showGallery} onChange={(value) => updateConfig('showGallery', value)} accentColor={brandColor} />
            {config.showGallery && (
              <div className="pl-4 pr-1 py-1.5 bg-slate-50/50 rounded-lg border border-slate-100 my-1 space-y-2">
                <SelectRow
                  label="Chế độ ảnh phụ"
                  value={config.galleryMode ?? 'grid'}
                  options={[
                    { value: 'grid', label: 'Dạng lưới (Grid)' },
                    { value: 'scroll', label: 'Cuộn ngang (Scroll)' },
                  ]}
                  onChange={(value) => updateConfig('galleryMode', value as 'scroll' | 'grid')}
                />
              </div>
            )}
            <ToggleRow label="Tài nguyên liên quan" checked={config.showRelated} onChange={(value) => updateConfig('showRelated', value)} accentColor={brandColor} />
            <ToggleRow label="Nút tải cố định" checked={config.showStickyCta} onChange={(value) => updateConfig('showStickyCta', value)} accentColor={brandColor} />
            {resourceFiltersFeature?.enabled && (
              <ToggleRow label="Bộ lọc tài nguyên" checked={config.showResourceFilters} onChange={(value) => updateConfig('showResourceFilters', value)} accentColor={brandColor} />
            )}
            <div className="mt-3 border-t border-slate-100 pt-3">
              <SelectRow label="Độ bo góc" value={config.cornerRadius ?? 'lg'} options={[{ value: 'lg', label: 'Nhiều' }, { value: 'sm', label: 'Ít' }, { value: 'none', label: 'Không bo' }]} onChange={(value) => updateConfig('cornerRadius', value as 'none' | 'sm' | 'lg')} />
            </div>
          </ControlCard>
          <ControlCard title="Module liên quan">
            <ExperienceModuleLink enabled={resourcesModule?.enabled ?? false} href="/system/modules/resources" icon={FileText} title="Tài nguyên" colorScheme="cyan" />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Link & ghi chú</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ControlCard title="Link xem thử">
            <ExampleLinks links={[{ label: 'Xem tài nguyên mẫu', url: previewUrl }]} color={brandColor} compact />
          </ControlCard>
          <Card className="p-2">
            <ExperienceHintCard hints={['Cổ điển phù hợp hầu hết tài nguyên.', 'Hiện đại phù hợp tài nguyên trả phí hoặc lead magnet.', 'Tối giản phù hợp ebook/checklist cần tải nhanh.']} />
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base"><Eye size={18} /> Xem trước</CardTitle>
            <div className="flex items-center gap-3">
              <LayoutTabs layouts={LAYOUTS} activeLayout={config.layoutStyle} onChange={(layout) => setConfig((prev) => ({ ...prev, layoutStyle: layout }))} accentColor={brandColor} />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url={`yoursite.com${previewUrl}`}>
              <ResourceDetailPreview
                layoutStyle={config.layoutStyle}
                showGallery={config.showGallery}
                galleryMode={config.galleryMode}
                showRelated={config.showRelated}
                showStickyCta={config.showStickyCta}
                showResourceFilters={config.showResourceFilters}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
                cornerRadius={config.cornerRadius}
              />
            </BrowserFrame>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
