'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { BookOpen, Eye, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { CourseDetailPreview, ExampleLinks, ExperienceHintCard, ExperienceModuleLink } from '@/components/experiences';
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
import { EXPERIENCE_NAMES, MESSAGES, useExampleCourseSlug, useExperienceConfig, useExperienceSave } from '@/lib/experiences';

type DetailLayoutStyle = 'classic' | 'modern' | 'minimal';

type CoursesDetailExperienceConfig = {
  layoutStyle: DetailLayoutStyle;
  showCurriculum: boolean;
  showInstructor: boolean;
  showRelated: boolean;
  showStickyCta: boolean;
  cornerRadius: 'none' | 'sm' | 'lg';
};

const EXPERIENCE_KEY = 'courses_detail_ui';

const LAYOUTS: LayoutOption<DetailLayoutStyle>[] = [
  { id: 'classic', label: 'Cổ điển', description: 'Banner đầu trang + khung đăng ký' },
  { id: 'modern', label: 'Hiện đại', description: 'Banner màu chuyển gradient' },
  { id: 'minimal', label: 'Tối giản', description: 'Tập trung nội dung học' },
];

const DEFAULT_CONFIG: CoursesDetailExperienceConfig = {
  layoutStyle: 'classic',
  showCurriculum: true,
  showInstructor: true,
  showRelated: true,
  showStickyCta: true,
  cornerRadius: 'lg',
};

export default function CoursesDetailExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const coursesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'courses' });
  const brandColors = useBrandColors();
  const exampleCourseSlug = useExampleCourseSlug();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const serverConfig = useMemo<CoursesDetailExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<CoursesDetailExperienceConfig> | undefined;
    return { ...DEFAULT_CONFIG, ...raw };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || coursesModule === undefined;
  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY])
  );

  const updateConfig = <K extends keyof CoursesDetailExperienceConfig>(key: K, value: CoursesDetailExperienceConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">{MESSAGES.loading}</div>;
  }

  const previewUrl = `/khoa-hoc/${exampleCourseSlug || 'lo-trinh-nextjs-thuc-chien'}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-bold">Chi tiết khóa học</h1>
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
            <ToggleRow label="Lộ trình học" description="Danh sách chương/bài học" checked={config.showCurriculum} onChange={(value) => updateConfig('showCurriculum', value)} accentColor={brandColor} />
            <ToggleRow label="Giảng viên" checked={config.showInstructor} onChange={(value) => updateConfig('showInstructor', value)} accentColor={brandColor} />
            <ToggleRow label="Khóa liên quan" checked={config.showRelated} onChange={(value) => updateConfig('showRelated', value)} accentColor={brandColor} />
            <ToggleRow label="Nút đăng ký cố định" checked={config.showStickyCta} onChange={(value) => updateConfig('showStickyCta', value)} accentColor={brandColor} />
            <div className="mt-3 pt-3 border-t border-slate-100">
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
          <ControlCard title="Module liên quan">
            <ExperienceModuleLink enabled={coursesModule?.enabled ?? false} href="/system/modules/courses" icon={BookOpen} title="Khóa học" colorScheme="purple" />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Link & ghi chú</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ControlCard title="Link xem thử">
            <ExampleLinks links={[{ label: 'Xem khóa học mẫu', url: previewUrl }]} color={brandColor} compact />
          </ControlCard>
          <Card className="p-2">
            <ExperienceHintCard hints={['Cổ điển phù hợp khóa học có nhiều thông tin.', 'Hiện đại phù hợp trang khóa học cao cấp.', 'Tối giản phù hợp nội dung học dài.']} />
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
              <CourseDetailPreview
                layoutStyle={config.layoutStyle}
                showCurriculum={config.showCurriculum}
                showInstructor={config.showInstructor}
                showRelated={config.showRelated}
                showStickyCta={config.showStickyCta}
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
