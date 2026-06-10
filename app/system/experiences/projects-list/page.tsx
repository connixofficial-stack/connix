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
  ProjectsListPreview,
} from '@/components/experiences';
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
import { EXPERIENCE_NAMES, MESSAGES, useExperienceConfig, useExperienceSave } from '@/lib/experiences';

type ListLayoutStyle = 'grid' | 'sidebar' | 'list';
type PaginationType = 'pagination' | 'infiniteScroll';
type FilterPosition = 'sidebar' | 'top' | 'none';

type ProjectsListExperienceConfig = {
  layoutStyle: ListLayoutStyle;
  gridColumns: number;
  filterPosition: FilterPosition;
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
  showClientName: boolean;
  showIntroVideo: boolean;
};

const EXPERIENCE_KEY = 'projects_list_ui';

const LAYOUT_STYLES: LayoutOption<ListLayoutStyle>[] = [
  { description: 'Bộ lọc ngang phía trên, cards dự án dạng lưới', id: 'grid', label: 'Grid' },
  { description: 'Sidebar bộ lọc bên trái, lưới cards bên phải', id: 'sidebar', label: 'Sidebar' },
  { description: 'Sidebar bộ lọc, thẻ dạng ngang rõ tên và mô tả', id: 'list', label: 'List' },
];

const DEFAULT_CONFIG: ProjectsListExperienceConfig = {
  filterPosition: 'top',
  hideEmptyCategories: true,
  layoutStyle: 'grid',
  gridColumns: 3,
  paginationType: 'pagination',
  postsPerPage: 12,
  showCategories: true,
  showClientName: true,
  showIntroVideo: true,
  showSearch: true,
};

const HINTS = [
  'Grid phù hợp portfolio gọn gàng.',
  'Sidebar tốt khi có nhiều danh mục dự án.',
  'List giúp quét nhanh, thấy rõ mô tả dự án.',
  'Bật khách hàng để tăng độ tin cậy.',
];

export default function ProjectsListExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const projectsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'projects' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<ProjectsListExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<ProjectsListExperienceConfig> | undefined;
    const rawLayout = raw?.layoutStyle as string | undefined;
    const normalizeLayout = (val?: string): ListLayoutStyle => {
      if (val === 'grid' || val === 'sidebar' || val === 'list') return val;
      if (val === 'masonry') return 'list';
      return 'grid';
    };
    return {
      ...DEFAULT_CONFIG,
      ...raw,
      layoutStyle: normalizeLayout(rawLayout),
      gridColumns: raw?.gridColumns ?? 3,
      paginationType: raw?.paginationType === 'infiniteScroll' ? 'infiniteScroll' : 'pagination',
    };
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

  const updateConfig = <K extends keyof ProjectsListExperienceConfig>(key: K, value: ProjectsListExperienceConfig[K]) => {
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
            <h1 className="text-2xl font-bold">Danh sách dự án</h1>
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
          <ControlCard title="Bộ lọc">
            <ToggleRow label="Tìm kiếm" checked={config.showSearch && canUseProjects} onChange={(v) => updateConfig('showSearch', v)} accentColor={brandColor} disabled={!canUseProjects} />
            <ToggleRow label="Danh mục" checked={config.showCategories && canUseProjects} onChange={(v) => updateConfig('showCategories', v)} accentColor={brandColor} disabled={!canUseProjects} />
            <SelectRow
              label="Vị trí filter"
              value={config.filterPosition}
              options={[
                { value: 'top', label: 'Trên danh sách' },
                { value: 'sidebar', label: 'Sidebar' },
                { value: 'none', label: 'Ẩn filter' },
              ]}
              onChange={(v) => updateConfig('filterPosition', v as FilterPosition)}
              disabled={!canUseProjects}
            />
          </ControlCard>
          <ControlCard title="Thông tin card">
            <ToggleRow label="Tên khách hàng" checked={config.showClientName} onChange={(v) => updateConfig('showClientName', v)} accentColor={brandColor} />
            <ToggleRow label="Icon video" checked={config.showIntroVideo} onChange={(v) => updateConfig('showIntroVideo', v)} accentColor={brandColor} />
            <ToggleRow label="Ẩn danh mục rỗng" checked={config.hideEmptyCategories} onChange={(v) => updateConfig('hideEmptyCategories', v)} accentColor={brandColor} />
            <SelectRow
              label="Số cột hiển thị (Desktop)"
              value={String(config.gridColumns ?? 3)}
              options={[
                { value: '3', label: '3 cột' },
                { value: '4', label: '4 cột' },
              ]}
              onChange={(v) => updateConfig('gridColumns', Number(v))}
            />
          </ControlCard>
          <ControlCard title="Phân trang">
            <SelectRow
              label="Kiểu"
              value={config.paginationType}
              options={[
                { value: 'pagination', label: 'Phân trang' },
                { value: 'infiniteScroll', label: 'Cuộn vô hạn' },
              ]}
              onChange={(v) => updateConfig('paginationType', v as PaginationType)}
              disabled={!canUseProjects}
            />
            <SelectRow
              label="Dự án mỗi trang"
              value={String(config.postsPerPage)}
              options={['6', '12', '20', '24'].map(value => ({ value, label: value }))}
              onChange={(v) => updateConfig('postsPerPage', Number(v))}
              disabled={!canUseProjects}
            />
          </ControlCard>
          <ControlCard title="Module liên quan">
            <ExperienceModuleLink enabled={canUseProjects} href="/system/modules/projects" icon={Briefcase} title="Dự án" colorScheme="purple" />
          </ControlCard>
          <ControlCard title="Link xem thử">
            <ExampleLinks links={[{ label: 'Trang danh sách', url: '/projects' }]} color={brandColor} compact />
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
            <BrowserFrame url="yoursite.com/projects">
              <ProjectsListPreview
                layoutStyle={config.layoutStyle}
                gridColumns={config.gridColumns}
                filterPosition={config.filterPosition}
                showSearch={config.showSearch}
                showCategories={config.showCategories}
                showClientName={config.showClientName}
                showIntroVideo={config.showIntroVideo}
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
