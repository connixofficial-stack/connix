'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { BookOpen, Eye, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { ExampleLinks, ExperienceHintCard, ExperienceModuleLink, LessonDetailPreview } from '@/components/experiences';
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

type LessonDetailLayoutStyle = 'classic' | 'focus' | 'compact';

type LessonDetailExperienceConfig = {
  layoutStyle: LessonDetailLayoutStyle;
  showSidebar: boolean;
  showLessonNavigation: boolean;
  showExerciseDownload: boolean;
  showCourseBreadcrumb: boolean;
  lockWallStyle: 'overlay' | 'card';
  cornerRadius: 'none' | 'sm' | 'lg';
};

const EXPERIENCE_KEY = 'lesson_detail_ui';

const LAYOUTS: LayoutOption<LessonDetailLayoutStyle>[] = [
  { id: 'classic', label: 'Cổ điển', description: 'Video + sidebar nội dung khóa học' },
  { id: 'focus', label: 'Tập trung', description: 'Video rộng + sidebar khóa học tinh gọn' },
  { id: 'compact', label: 'Gọn', description: 'Video full width, khóa học full width bên dưới' },
];

const DEFAULT_CONFIG: LessonDetailExperienceConfig = {
  layoutStyle: 'classic',
  showSidebar: true,
  showLessonNavigation: true,
  showExerciseDownload: true,
  showCourseBreadcrumb: true,
  lockWallStyle: 'overlay',
  cornerRadius: 'lg',
};

const EXAMPLE_LESSON_URL = '/khoa-hoc/khoa-hoc-kien-truc-noi-that/bai-hoc/bai-1-lam-quen-autocad-tieu-chuan-ban-ve-giao-trinh-autocad-2025--vx765sabssvx28f54wxp1c5b8x87y3g2';

export default function LessonDetailExperiencePage() {
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

  const serverConfig = useMemo<LessonDetailExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<LessonDetailExperienceConfig> | undefined;
    return { ...DEFAULT_CONFIG, ...raw };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || coursesModule === undefined;
  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY])
  );

  const updateConfig = <K extends keyof LessonDetailExperienceConfig>(key: K, value: LessonDetailExperienceConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">{MESSAGES.loading}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-bold">Chi tiết bài học</h1>
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
          <ControlCard title="Khối bài học">
            <ToggleRow label="Sidebar nội dung" description="Tắt/mở sidebar đầy đủ; Tập trung/Gọn vẫn giữ khung khóa học rút gọn" checked={config.showSidebar} onChange={(value) => updateConfig('showSidebar', value)} accentColor={brandColor} />
            <ToggleRow label="Điều hướng bài trước/sau" checked={config.showLessonNavigation} onChange={(value) => updateConfig('showLessonNavigation', value)} accentColor={brandColor} />
            <ToggleRow label="Nút tải bài tập" checked={config.showExerciseDownload} onChange={(value) => updateConfig('showExerciseDownload', value)} accentColor={brandColor} />
            <ToggleRow label="Breadcrumb khóa học" checked={config.showCourseBreadcrumb} onChange={(value) => updateConfig('showCourseBreadcrumb', value)} accentColor={brandColor} />
          </ControlCard>
          <ControlCard title="Giao diện khóa">
            <SelectRow
              label="Lock wall"
              value={config.lockWallStyle}
              options={[
                { value: 'overlay', label: 'Overlay tối' },
                { value: 'card', label: 'Card sáng' },
              ]}
              onChange={(value) => updateConfig('lockWallStyle', value as 'overlay' | 'card')}
            />
            <div className="mt-3 border-t border-slate-100 pt-3">
              <SelectRow
                label="Độ bo góc"
                value={config.cornerRadius ?? 'lg'}
                options={[
                  { value: 'lg', label: 'Nhiều (Mặc định)' },
                  { value: 'sm', label: 'Ít (1/2)' },
                  { value: 'none', label: 'Không bo' },
                ]}
                onChange={(value) => updateConfig('cornerRadius', value as 'none' | 'sm' | 'lg')}
              />
            </div>
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
            <ExampleLinks links={[{ label: 'Xem bài học mẫu', url: EXAMPLE_LESSON_URL }]} color={brandColor} compact />
          </ControlCard>
          <Card className="p-2">
            <ExperienceHintCard hints={['Cổ điển phù hợp trang học có nhiều chương/bài.', 'Tập trung mở rộng vùng học nhưng vẫn giữ khung khóa học để chọn bài.', 'Gọn ưu tiên clip full width, đưa nội dung khóa học xuống dưới và bung rộng để chọn bài.']} />
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
            <BrowserFrame url={`yoursite.com${EXAMPLE_LESSON_URL}`}>
              <LessonDetailPreview
                layoutStyle={config.layoutStyle}
                showSidebar={config.showSidebar}
                showLessonNavigation={config.showLessonNavigation}
                showExerciseDownload={config.showExerciseDownload}
                showCourseBreadcrumb={config.showCourseBreadcrumb}
                lockWallStyle={config.lockWallStyle}
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
