'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { BookOpen, Eye, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { CoursesListPreview, ExampleLinks, ExperienceHintCard, ExperienceModuleLink } from '@/components/experiences';
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
import { EXPERIENCE_NAMES, MESSAGES, useExperienceConfig, useExperienceSave } from '@/lib/experiences';

type ListLayoutStyle = 'grid' | 'sidebar' | 'list';
type PaginationType = 'pagination' | 'infiniteScroll';

type CoursesListExperienceConfig = {
  layoutStyle: ListLayoutStyle;
  gridColumns: number;
  showSearch: boolean;
  showCategories: boolean;
  showLevelFilter: boolean;
  hideEmptyCategories: boolean;
  paginationType: PaginationType;
  postsPerPage: number;
  cornerRadius: 'none' | 'sm' | 'lg';
};

const EXPERIENCE_KEY = 'courses_list_ui';

const LAYOUTS: LayoutOption<ListLayoutStyle>[] = [
  { id: 'grid', label: 'Grid', description: 'Bộ lọc ngang phía trên, lưới thẻ khóa học' },
  { id: 'sidebar', label: 'Sidebar', description: 'Sidebar bộ lọc bên trái, lưới thẻ bên phải' },
  { id: 'list', label: 'List', description: 'Sidebar bộ lọc, thẻ dạng ngang rõ thông tin' },
];

const DEFAULT_CONFIG: CoursesListExperienceConfig = {
  layoutStyle: 'grid',
  gridColumns: 3,
  showSearch: true,
  showCategories: true,
  showLevelFilter: true,
  hideEmptyCategories: true,
  paginationType: 'pagination',
  postsPerPage: 12,
  cornerRadius: 'lg',
};

const HINTS = [
  'Grid phù hợp trang có nhiều khóa học và cần xem nhanh.',
  'Sidebar phù hợp khi có nhiều danh mục hoặc trình độ học.',
  'List giúp quét nhanh, thấy rõ mô tả và thông tin khóa học.',
  'Phân trang tốt cho Google; cuộn vô hạn hợp trải nghiệm trên điện thoại.',
];

const normalizeLayoutStyle = (value?: string): ListLayoutStyle => {
  if (value === 'grid' || value === 'sidebar' || value === 'list') {return value;}
  if (value === 'masonry') {return 'list';}
  return DEFAULT_CONFIG.layoutStyle;
};

const normalizePaginationType = (value?: string): PaginationType => {
  if (value === 'infiniteScroll') {return 'infiniteScroll';}
  return 'pagination';
};

export default function CoursesListExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const coursesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'courses' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const serverConfig = useMemo<CoursesListExperienceConfig>(() => {
    const raw = experienceSetting?.value as (Partial<CoursesListExperienceConfig> & {
      layouts?: Partial<Record<ListLayoutStyle, Partial<Omit<CoursesListExperienceConfig, 'layoutStyle'>>>>;
    }) | undefined;
    const layoutStyle = normalizeLayoutStyle(raw?.layoutStyle);
    const legacyLayout = raw?.layouts?.[layoutStyle];

    return {
      layoutStyle,
      gridColumns: raw?.gridColumns ?? 3,
      showSearch: legacyLayout?.showSearch ?? raw?.showSearch ?? true,
      showCategories: legacyLayout?.showCategories ?? raw?.showCategories ?? true,
      showLevelFilter: legacyLayout?.showLevelFilter ?? raw?.showLevelFilter ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      paginationType: normalizePaginationType(legacyLayout?.paginationType ?? raw?.paginationType),
      postsPerPage: legacyLayout?.postsPerPage ?? raw?.postsPerPage ?? 12,
      cornerRadius: raw?.cornerRadius ?? 'lg',
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || coursesModule === undefined;
  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY])
  );
  const layoutLabel = LAYOUTS.find((layout) => layout.id === config.layoutStyle)?.label ?? 'Lưới';
  const deviceLabel = previewDevice === 'desktop' ? 'Desktop (1920px)' : previewDevice === 'tablet' ? 'Tablet (768px)' : 'Mobile (375px)';

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">{MESSAGES.loading}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-bold">Danh sách khóa học</h1>
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
            <ToggleRow label="Tìm kiếm" checked={config.showSearch} onChange={(value) => setConfig((prev) => ({ ...prev, showSearch: value }))} accentColor={brandColor} />
            <ToggleRow label="Danh mục" checked={config.showCategories} onChange={(value) => setConfig((prev) => ({ ...prev, showCategories: value }))} accentColor={brandColor} />
            <ToggleRow label="Lọc theo trình độ" checked={config.showLevelFilter} onChange={(value) => setConfig((prev) => ({ ...prev, showLevelFilter: value }))} accentColor={brandColor} />
            <ToggleRow label="Ẩn danh mục rỗng" checked={config.hideEmptyCategories} onChange={(value) => setConfig((prev) => ({ ...prev, hideEmptyCategories: value }))} accentColor={brandColor} />
          </ControlCard>
          <ControlCard title="Danh sách">
            <SelectRow label="Kiểu tải" value={config.paginationType} options={[{ value: 'pagination', label: 'Phân trang' }, { value: 'infiniteScroll', label: 'Cuộn vô hạn' }]} onChange={(value) => setConfig((prev) => ({ ...prev, paginationType: value as PaginationType }))} />
            <SelectRow label="Khóa học/trang" value={String(config.postsPerPage)} options={[12, 20, 24, 48].map((value) => ({ value: String(value), label: String(value) }))} onChange={(value) => setConfig((prev) => ({ ...prev, postsPerPage: Number(value) }))} />
            {config.layoutStyle === 'grid' && (
              <SelectRow
                label="Số cột hiển thị"
                value={String(config.gridColumns ?? 3)}
                options={[{ value: '3', label: '3 cột' }, { value: '4', label: '4 cột' }]}
                onChange={(value) => setConfig((prev) => ({ ...prev, gridColumns: Number(value) }))}
              />
            )}
            <SelectRow
              label="Độ bo góc"
              value={config.cornerRadius ?? 'lg'}
              options={[
                { value: 'lg', label: 'Nhiều (Mặc định)' },
                { value: 'sm', label: 'Ít (1/2)' },
                { value: 'none', label: 'Không bo' },
              ]}
              onChange={(value) => setConfig((prev) => ({ ...prev, cornerRadius: value as 'none' | 'sm' | 'lg' }))}
            />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Module & liên kết</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ControlCard title="Module liên quan">
            <ExperienceModuleLink enabled={coursesModule?.enabled ?? false} href="/system/modules/courses" icon={BookOpen} title="Khóa học" colorScheme="purple" />
          </ControlCard>
          <ControlCard title="Link xem thử">
            <ExampleLinks links={[{ label: 'Trang khóa học', url: '/khoa-hoc' }]} color={brandColor} compact />
          </ControlCard>
          <Card className="p-2">
            <ExperienceHintCard hints={HINTS} />
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
            <BrowserFrame url="yoursite.com/khoa-hoc">
              <CoursesListPreview
                layoutStyle={config.layoutStyle}
                gridColumns={config.gridColumns}
                showSearch={config.showSearch}
                showCategories={config.showCategories}
                showLevelFilter={config.showLevelFilter}
                hideEmptyCategories={config.hideEmptyCategories}
                paginationType={config.paginationType}
                postsPerPage={config.postsPerPage}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
                cornerRadius={config.cornerRadius}
              />
            </BrowserFrame>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Bố cục: <strong className="text-slate-700 dark:text-slate-300">{layoutLabel}</strong>
            {' • '}{deviceLabel}
            {' • '}Hiển thị {config.postsPerPage} khóa học/trang
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
