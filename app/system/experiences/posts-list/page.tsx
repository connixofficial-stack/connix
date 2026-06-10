'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Eye, FileText, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import {
  ExperienceModuleLink, 
  ExperienceHintCard,
  PostsListPreview,
  ExampleLinks,
} from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  DeviceToggle,
  deviceWidths,
  LayoutTabs,
  ControlCard,
  ToggleRow,
  SelectRow,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { useExperienceConfig, useExperienceSave, useExamplePostCategorySlug, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';

type ListLayoutStyle = 'grid' | 'sidebar' | 'list';
type PaginationType = 'pagination' | 'infiniteScroll';

type PostsListExperienceConfig = {
  layoutStyle: ListLayoutStyle;
  gridColumns: number;
  showSearch: boolean;
  showCategories: boolean;
  hideEmptyCategories: boolean;
  paginationType: PaginationType;
  postsPerPage: number;
};

const EXPERIENCE_KEY = 'posts_list_ui';

const LAYOUT_STYLES: LayoutOption<ListLayoutStyle>[] = [
  { description: 'Bộ lọc ngang phía trên, lưới thẻ bài viết bên dưới', id: 'grid', label: 'Grid' },
  { description: 'Sidebar bộ lọc bên trái, lưới thẻ bài viết bên phải', id: 'sidebar', label: 'Sidebar' },
  { description: 'Sidebar bộ lọc bên trái, thẻ dạng ngang (horizontal) bên phải', id: 'list', label: 'List' },
];

const DEFAULT_CONFIG: PostsListExperienceConfig = {
  layoutStyle: 'grid',
  gridColumns: 3,
  showSearch: true,
  showCategories: true,
  hideEmptyCategories: true,
  paginationType: 'pagination',
  postsPerPage: 12,
};

const HINTS = [
  'Grid phù hợp blog có nhiều bài viết, filter dạng chips rõ ràng.',
  'Sidebar giúp nhấn mạnh bộ lọc và duyệt theo danh mục.',
  'List tối ưu quét nhanh nhiều bài, thấy rõ excerpt và meta.',
  'Pagination phù hợp khi cần SEO, Infinity Scroll phù hợp mobile và UX.',
];

export default function PostsListExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const postsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'posts' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const exampleCategorySlug = useExamplePostCategorySlug();
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<PostsListExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<PostsListExperienceConfig> | undefined;
    const rawLayout = raw?.layoutStyle as string | undefined;
    
    const normalizeLayoutStyle = (value?: string): ListLayoutStyle => {
      if (value === 'grid' || value === 'fullwidth') {return 'grid';}
      if (value === 'sidebar') {return 'sidebar';}
      if (value === 'list' || value === 'magazine') {return 'list';}
      return DEFAULT_CONFIG.layoutStyle;
    };
    
    const normalizePaginationType = (value?: string): PaginationType => {
      if (value === 'infiniteScroll') return 'infiniteScroll';
      if (value === 'pagination') return 'pagination';
      return DEFAULT_CONFIG.paginationType;
    };
    
    return {
      layoutStyle: normalizeLayoutStyle(rawLayout),
      gridColumns: raw?.gridColumns ?? 3,
      showSearch: raw?.showSearch ?? true,
      showCategories: raw?.showCategories ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      paginationType: normalizePaginationType(raw?.paginationType),
      postsPerPage: raw?.postsPerPage ?? 12,
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || postsModule === undefined;
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
            <LayoutTemplate className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh sách bài viết</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        </div>
        <Button 
          size="sm"
          onClick={handleSave} 
          disabled={!hasChanges || isSaving}
          className="bg-blue-600 hover:bg-blue-500 gap-1.5"
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
          <ControlCard title="Hiển thị">
            <ToggleRow label="Tìm kiếm" checked={config.showSearch} onChange={(v) => setConfig(prev => ({ ...prev, showSearch: v }))} accentColor={brandColor} />
            <ToggleRow label="Danh mục" checked={config.showCategories} onChange={(v) => setConfig(prev => ({ ...prev, showCategories: v }))} accentColor={brandColor} />
            <ToggleRow
              label="Ẩn danh mục rỗng"
              description="Ngoài public chỉ hiện danh mục có bài viết"
              checked={config.hideEmptyCategories}
              onChange={(v) => setConfig(prev => ({ ...prev, hideEmptyCategories: v }))}
              accentColor={brandColor}
            />
            <SelectRow
              label="Số cột hiển thị (Desktop)"
              value={String(config.gridColumns ?? 3)}
              options={[
                { value: '3', label: '3 cột' },
                { value: '4', label: '4 cột' },
              ]}
              onChange={(v) => setConfig(prev => ({ ...prev, gridColumns: Number(v) }))}
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
              onChange={(v) => setConfig(prev => ({ ...prev, paginationType: v as PaginationType }))}
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
              enabled={postsModule?.enabled ?? false}
              href="/system/modules/posts"
              icon={FileText}
              title="Bài viết"
              colorScheme="cyan"
            />
          </ControlCard>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link & ghi chú</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Link xem thử">
            <ExampleLinks
              links={[
                { label: 'Trang danh sách', url: '/posts', description: 'Xem tất cả bài viết' },
                ...(exampleCategorySlug ? [{ label: 'Lọc theo category', url: `/posts?catpost=${exampleCategorySlug}`, description: 'Ví dụ filter' }] : []),
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
            <BrowserFrame url="yoursite.com/posts">
              <PostsListPreview
                layoutStyle={config.layoutStyle}
                gridColumns={config.gridColumns}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
                showSearch={config.showSearch}
                showCategories={config.showCategories}
                paginationType={config.paginationType}
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
