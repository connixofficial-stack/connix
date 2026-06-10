'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AlertCircle, Eye, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import {
  ExperienceHintCard,
  PostDetailPreview,
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
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { useExperienceConfig, useExamplePostSlug, EXPERIENCE_GROUP, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';

type DetailLayoutStyle = 'classic' | 'modern' | 'minimal';

type PostDetailExperienceConfig = {
  layoutStyle: DetailLayoutStyle;
  showAuthor: boolean;
  showTags: boolean;
  showShare: boolean;
  showComments: boolean;
  showCommentLikes: boolean;
  showCommentReplies: boolean;
  showRelated: boolean;
  showThumbnail: boolean;
};

const EXPERIENCE_KEY = 'posts_detail_ui';
const AUTHOR_FIELD_KEY = 'author_name';

const LAYOUT_STYLES: LayoutOption<DetailLayoutStyle>[] = [
  { description: 'Layout truyền thống với sidebar', id: 'classic', label: 'Classic' },
  { description: 'Hero image, full-width', id: 'modern', label: 'Modern' },
  { description: 'Tối giản, tập trung nội dung', id: 'minimal', label: 'Minimal' },
];

const DEFAULT_CONFIG: PostDetailExperienceConfig = {
  layoutStyle: 'classic',
  showAuthor: true,
  showTags: true,
  showShare: true,
  showComments: true,
  showCommentLikes: true,
  showCommentReplies: true,
  showRelated: true,
  showThumbnail: true,
};

const HINTS = [
  'Classic layout phù hợp blog truyền thống.',
  'Modern layout tốt cho bài viết có hình ảnh đẹp.',
  'Minimal tập trung vào nội dung, ít distraction.',
  'Related posts giúp tăng pageview.',
  'Thiết lập hiển thị dùng chung cho cả 3 layout.',
];

function ModuleFeatureStatus({ label, enabled, href, moduleName }: { label: string; enabled: boolean; href: string; moduleName: string }) {
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

export default function PostDetailExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const postsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'posts' });
  const commentsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'comments' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const postFields = useQuery(api.admin.modules.listModuleFields, { moduleKey: 'posts' });
  const examplePostSlug = useExamplePostSlug();
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  const setMultipleSettings = useMutation(api.settings.setMultiple);
  const updateField = useMutation(api.admin.modules.updateModuleField);
  const commentsLikesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableLikes', moduleKey: 'comments' });
  const commentsRepliesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableReplies', moduleKey: 'comments' });
  const tagsFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableTags', moduleKey: 'posts' });
  const featuredFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableFeatured', moduleKey: 'posts' });
  const schedulingFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableScheduling', moduleKey: 'posts' });

  const serverConfig = useMemo<PostDetailExperienceConfig>(() => {
    const raw = experienceSetting?.value as (Partial<PostDetailExperienceConfig> & {
      layouts?: {
        classic?: Partial<PostDetailExperienceConfig>;
        modern?: Partial<PostDetailExperienceConfig>;
        minimal?: Partial<PostDetailExperienceConfig>;
      };
    }) | undefined;
    const layoutStyle = raw?.layoutStyle ?? DEFAULT_CONFIG.layoutStyle;
    const layoutConfig = raw?.layouts?.[layoutStyle];

    return {
      ...DEFAULT_CONFIG,
      ...layoutConfig,
      showAuthor: raw?.showAuthor ?? layoutConfig?.showAuthor ?? DEFAULT_CONFIG.showAuthor,
      showTags: raw?.showTags ?? layoutConfig?.showTags ?? DEFAULT_CONFIG.showTags,
      showShare: raw?.showShare ?? layoutConfig?.showShare ?? DEFAULT_CONFIG.showShare,
      showComments: raw?.showComments ?? layoutConfig?.showComments ?? DEFAULT_CONFIG.showComments,
      showCommentLikes: raw?.showCommentLikes ?? layoutConfig?.showCommentLikes ?? DEFAULT_CONFIG.showCommentLikes,
      showCommentReplies: raw?.showCommentReplies ?? layoutConfig?.showCommentReplies ?? DEFAULT_CONFIG.showCommentReplies,
      showRelated: raw?.showRelated ?? layoutConfig?.showRelated ?? DEFAULT_CONFIG.showRelated,
      showThumbnail: raw?.showThumbnail ?? layoutConfig?.showThumbnail ?? DEFAULT_CONFIG.showThumbnail,
      layoutStyle,
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || postsModule === undefined || postFields === undefined;
  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);

  const canUseComments = commentsModule?.enabled ?? false;
  const canUseCommentLikes = canUseComments && (commentsLikesFeature?.enabled ?? false);
  const canUseCommentReplies = canUseComments && (commentsRepliesFeature?.enabled ?? false);
  const canUseTags = tagsFeature?.enabled ?? false;

  const updateConfig = <K extends keyof Omit<PostDetailExperienceConfig, 'layoutStyle'>>(
    key: K,
    value: PostDetailExperienceConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const authorField = useMemo(() => postFields?.find(field => field.fieldKey === AUTHOR_FIELD_KEY), [postFields]);
  const authorFieldEnabled = authorField?.enabled ?? false;
  const isAuthorSyncPending = Boolean(authorField) && authorFieldEnabled !== config.showAuthor;

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const normalizedConfig = {
        ...config,
        showComments: canUseComments ? config.showComments : false,
        showCommentLikes: canUseCommentLikes ? config.showCommentLikes : false,
        showCommentReplies: canUseCommentReplies ? config.showCommentReplies : false,
        showTags: canUseTags ? config.showTags : false,
      };

      const settingsToSave: Array<{ group: string; key: string; value: unknown }> = [
        { group: EXPERIENCE_GROUP, key: EXPERIENCE_KEY, value: normalizedConfig },
      ];

      const tasks: Promise<unknown>[] = [setMultipleSettings({ settings: settingsToSave })];

      if (authorField && authorFieldEnabled !== config.showAuthor) {
        tasks.push(updateField({ enabled: config.showAuthor, id: authorField._id as Id<'moduleFields'> }));
      }

      await Promise.all(tasks);
      toast.success(MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY]));
    } catch {
      toast.error(MESSAGES.saveError);
    } finally {
      setIsSaving(false);
    }
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
            <LayoutTemplate className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold">Chi tiết bài viết</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
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
          <ControlCard title="Hiển thị nội dung">
            <ToggleRow 
              label="Thông tin tác giả" 
              checked={config.showAuthor} 
              onChange={(v) => updateConfig('showAuthor', v)} 
              accentColor={brandColor}
              disabled={!authorField}
            />
            <ToggleRow 
              label="Danh sách tags" 
              checked={config.showTags && canUseTags} 
              onChange={(v) => updateConfig('showTags', v)} 
              accentColor={brandColor}
              disabled={!canUseTags}
            />
            <ToggleRow 
              label="Nút chia sẻ" 
              checked={config.showShare} 
              onChange={(v) => updateConfig('showShare', v)} 
              accentColor={brandColor} 
            />
            <ToggleRow
              label="Ảnh đại diện chi tiết"
              checked={config.showThumbnail}
              onChange={(v) => updateConfig('showThumbnail', v)}
              accentColor={brandColor}
            />
            <ToggleRow 
              label="Bài viết liên quan" 
              checked={config.showRelated} 
              onChange={(v) => updateConfig('showRelated', v)} 
              accentColor={brandColor} 
            />
          </ControlCard>
          
          <ControlCard title="Bình luận">
            <ToggleRow 
              label="Hiển thị bình luận" 
              checked={config.showComments && canUseComments} 
              onChange={(v) => updateConfig('showComments', v)} 
              accentColor={brandColor}
              disabled={!canUseComments}
            />
            <ToggleRow 
              label="Nút thích" 
              checked={config.showCommentLikes && canUseCommentLikes} 
              onChange={(v) => updateConfig('showCommentLikes', v)} 
              accentColor={brandColor}
              disabled={!canUseCommentLikes}
            />
            <ToggleRow 
              label="Nút trả lời" 
              checked={config.showCommentReplies && canUseCommentReplies} 
              onChange={(v) => updateConfig('showCommentReplies', v)} 
              accentColor={brandColor}
              disabled={!canUseCommentReplies}
            />
            <ModuleFeatureStatus
              label="Module bình luận"
              enabled={commentsModule?.enabled ?? false}
              href="/system/modules/comments"
              moduleName="Module Bình luận"
            />
            <ModuleFeatureStatus
              label="Tính năng thích"
              enabled={commentsLikesFeature?.enabled ?? false}
              href="/system/modules/comments"
              moduleName="Module Bình luận"
            />
            <ModuleFeatureStatus
              label="Tính năng trả lời"
              enabled={commentsRepliesFeature?.enabled ?? false}
              href="/system/modules/comments"
              moduleName="Module Bình luận"
            />
          </ControlCard>
          
          <ControlCard title="Trạng thái Module">
            {isAuthorSyncPending && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-xs text-amber-700 dark:text-amber-300 mb-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>Cập nhật trường tác giả sẽ áp dụng khi bấm Lưu.</span>
              </div>
            )}
            <ModuleFeatureStatus
              label="Tags"
              enabled={tagsFeature?.enabled ?? false}
              href="/system/modules/posts"
              moduleName="Module Bài viết"
            />
            <ModuleFeatureStatus
              label="Nổi bật"
              enabled={featuredFeature?.enabled ?? false}
              href="/system/modules/posts"
              moduleName="Module Bài viết"
            />
            <ModuleFeatureStatus
              label="Hẹn giờ xuất bản"
              enabled={schedulingFeature?.enabled ?? false}
              href="/system/modules/posts"
              moduleName="Module Bài viết"
            />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link & ghi chú</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-2">
            {examplePostSlug && (
              <div className="mb-2">
                <ExampleLinks
                  links={[{ label: 'Xem bài viết mẫu', url: `/posts/${examplePostSlug}` }]}
                  color={brandColor}
                  compact
                />
              </div>
            )}
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
            <BrowserFrame url={`yoursite.com/posts/${examplePostSlug || 'example-post'}`}>
              <PostDetailPreview
                layoutStyle={config.layoutStyle}
                showAuthor={config.showAuthor}
                showTags={config.showTags && canUseTags}
                showRelated={config.showRelated}
                showShare={config.showShare}
                showThumbnail={config.showThumbnail}
                showComments={config.showComments && canUseComments}
                showCommentLikes={config.showCommentLikes && canUseCommentLikes}
                showCommentReplies={config.showCommentReplies && canUseCommentReplies}
                device={previewDevice}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
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
