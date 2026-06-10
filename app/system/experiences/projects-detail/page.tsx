'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Briefcase, Eye, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import {
  ExampleLinks,
  ExperienceHintCard,
  ExperienceModuleLink,
  ProjectDetailPreview,
} from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  ControlCard,
  DeviceToggle,
  LayoutTabs,
  ToggleRow,
  deviceWidths,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { EXPERIENCE_NAMES, MESSAGES, useExampleProjectSlug, useExperienceConfig, useExperienceSave } from '@/lib/experiences';

type DetailLayoutStyle = 'classic' | 'modern' | 'minimal';

type ProjectsDetailExperienceConfig = {
  layoutStyle: DetailLayoutStyle;
  showGallery: boolean;
  showIntroVideo: boolean;
  showRelated: boolean;
  showShare: boolean;
  showClientName: boolean;
};

const EXPERIENCE_KEY = 'projects_detail_ui';

const LAYOUT_STYLES: LayoutOption<DetailLayoutStyle>[] = [
  { description: 'Hero + nội dung theo kiểu portfolio truyền thống', id: 'classic', label: 'Classic' },
  { description: 'Hero chia cột hiện đại', id: 'modern', label: 'Modern' },
  { description: 'Tối giản, tập trung case study', id: 'minimal', label: 'Minimal' },
];

const DEFAULT_CONFIG: ProjectsDetailExperienceConfig = {
  layoutStyle: 'classic',
  showClientName: true,
  showGallery: true,
  showIntroVideo: true,
  showRelated: true,
  showShare: true,
};

const HINTS = [
  'Bật thư viện ảnh khi dự án có nhiều mockup hoặc ảnh thực tế.',
  'Video giới thiệu phù hợp case study cần kể chuyện.',
  'Dự án liên quan giúp giữ người xem ở lại portfolio.',
];

export default function ProjectsDetailExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const projectsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'projects' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  const exampleProjectSlug = useExampleProjectSlug();

  const serverConfig = useMemo<ProjectsDetailExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<ProjectsDetailExperienceConfig> | undefined;
    return { ...DEFAULT_CONFIG, ...raw };
  }, [experienceSetting?.value]);

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const isLoading = experienceSetting === undefined || projectsModule === undefined;
  const canUseProjects = projectsModule?.enabled ?? false;
  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY])
  );

  const updateConfig = <K extends keyof ProjectsDetailExperienceConfig>(key: K, value: ProjectsDetailExperienceConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">{MESSAGES.loading}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-violet-600" />
            <h1 className="text-2xl font-bold">Chi tiết dự án</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-1.5 bg-violet-600 hover:bg-violet-500">
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{hasChanges ? 'Lưu' : 'Đã lưu'}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thiết lập hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <ControlCard title="Khối nội dung">
            <ToggleRow label="Tên khách hàng" checked={config.showClientName} onChange={(v) => updateConfig('showClientName', v)} accentColor={brandColor} />
            <ToggleRow label="Video giới thiệu" checked={config.showIntroVideo} onChange={(v) => updateConfig('showIntroVideo', v)} accentColor={brandColor} />
            <ToggleRow label="Thư viện ảnh" checked={config.showGallery} onChange={(v) => updateConfig('showGallery', v)} accentColor={brandColor} />
          </ControlCard>
          <ControlCard title="Tương tác">
            <ToggleRow label="Nút chia sẻ" checked={config.showShare} onChange={(v) => updateConfig('showShare', v)} accentColor={brandColor} />
            <ToggleRow label="Dự án liên quan" checked={config.showRelated} onChange={(v) => updateConfig('showRelated', v)} accentColor={brandColor} />
          </ControlCard>
          <ControlCard title="Module liên quan">
            <ExperienceModuleLink enabled={canUseProjects} href="/system/modules/projects" icon={Briefcase} title="Dự án" colorScheme="purple" />
          </ControlCard>
          <ControlCard title="Link xem thử">
            <ExampleLinks
              links={[
                { label: 'Trang danh sách', url: '/projects' },
                { label: 'Chi tiết mẫu', url: exampleProjectSlug ? `/projects/${exampleProjectSlug}` : '/projects' },
              ]}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye size={18} /> Preview
            </CardTitle>
            <div className="flex items-center gap-3">
              <LayoutTabs layouts={LAYOUT_STYLES} activeLayout={config.layoutStyle} onChange={(layout) => updateConfig('layoutStyle', layout)} accentColor={brandColor} />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/projects/sample-project">
              <ProjectDetailPreview
                layoutStyle={config.layoutStyle}
                showClientName={config.showClientName}
                showGallery={config.showGallery}
                showIntroVideo={config.showIntroVideo}
                showRelated={config.showRelated}
                showShare={config.showShare}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
              />
            </BrowserFrame>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
