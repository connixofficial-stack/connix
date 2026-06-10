'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Eye, LayoutTemplate, Loader2, MessageSquare, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { 
  ExperienceModuleLink, 
  ExperienceHintCard,
  CommentsRatingPreview,
} from '@/components/experiences';
import {
  BrowserFrame,
  DeviceToggle,
  deviceWidths,
  ControlCard,
  ToggleRow,
  SelectRow,
  type DeviceType,
} from '@/components/experiences/editor';
import { useExperienceConfig, useExperienceSave, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';
import { enforceMultipleToggles } from '@/lib/experiences/module-toggle-guards';

type RatingDisplayStyle = 'stars' | 'numbers' | 'both';
type CommentsSortOrder = 'newest' | 'oldest' | 'highest-rating' | 'most-liked';

type CommentsRatingExperienceConfig = {
  ratingDisplayStyle: RatingDisplayStyle;
  commentsSortOrder: CommentsSortOrder;
  showLikes: boolean;
  showReplies: boolean;
  showModeration: boolean;
};

const EXPERIENCE_KEY = 'comments_rating_ui';

const RATING_STYLES: { id: RatingDisplayStyle; label: string }[] = [
  { id: 'stars', label: 'Stars Only' },
  { id: 'numbers', label: 'Numbers Only' },
  { id: 'both', label: 'Stars + Numbers' },
];

const SORT_OPTIONS: { id: CommentsSortOrder; label: string }[] = [
  { id: 'newest', label: 'Mới nhất' },
  { id: 'oldest', label: 'Cũ nhất' },
  { id: 'highest-rating', label: 'Điểm cao nhất' },
  { id: 'most-liked', label: 'Nhiều like nhất' },
];

const DEFAULT_CONFIG: CommentsRatingExperienceConfig = {
  commentsSortOrder: 'newest',
  ratingDisplayStyle: 'both',
  showLikes: true,
  showModeration: true,
  showReplies: true,
};

const HINTS = [
  'Rating style phụ thuộc vào thiết kế tổng thể.',
  'Most-liked sort khuyến khích tương tác.',
  'Moderation quan trọng với UGC.',
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

export default function CommentsRatingExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const commentsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'comments' });
  const likesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableLikes', moduleKey: 'comments' });
  const repliesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableReplies', moduleKey: 'comments' });
  const moderationFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableModeration', moduleKey: 'comments' });
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<CommentsRatingExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<CommentsRatingExperienceConfig> | undefined;
    return {
      commentsSortOrder: raw?.commentsSortOrder ?? 'newest',
      ratingDisplayStyle: raw?.ratingDisplayStyle ?? 'both',
      showLikes: raw?.showLikes ?? (likesFeature?.enabled ?? true),
      showModeration: raw?.showModeration ?? (moderationFeature?.enabled ?? true),
      showReplies: raw?.showReplies ?? (repliesFeature?.enabled ?? true),
    };
  }, [experienceSetting?.value, likesFeature?.enabled, repliesFeature?.enabled, moderationFeature?.enabled]);

  const isLoading = experienceSetting === undefined || commentsModule === undefined;
  const commentsEnabled = commentsModule?.enabled ?? false;
  const canUseLikes = commentsEnabled && (likesFeature?.enabled ?? false);
  const canUseReplies = commentsEnabled && (repliesFeature?.enabled ?? false);
  const canUseModeration = commentsEnabled && (moderationFeature?.enabled ?? false);

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);

  const beforeSaveTransform = (rawConfig: unknown) => {
    const configValue = rawConfig as CommentsRatingExperienceConfig;
    return enforceMultipleToggles(configValue, [
      { key: 'showLikes', enabled: commentsEnabled && (likesFeature?.enabled ?? false) },
      { key: 'showReplies', enabled: commentsEnabled && (repliesFeature?.enabled ?? false) },
      { key: 'showModeration', enabled: commentsEnabled && (moderationFeature?.enabled ?? false) },
    ]);
  };

  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY]),
    undefined,
    beforeSaveTransform
  );

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
            <LayoutTemplate className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold">Bình luận & Đánh giá</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-purple-600 hover:bg-purple-500 gap-1.5"
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
          <ControlCard title="Hiển thị">
            <SelectRow
              label="Kiểu rating"
              value={config.ratingDisplayStyle}
              onChange={(v) => setConfig(prev => ({ ...prev, ratingDisplayStyle: v as RatingDisplayStyle }))}
              options={RATING_STYLES.map(s => ({ label: s.label, value: s.id }))}
            />
            <SelectRow
              label="Sắp xếp mặc định"
              value={config.commentsSortOrder}
              onChange={(v) => setConfig(prev => ({ ...prev, commentsSortOrder: v as CommentsSortOrder }))}
              options={SORT_OPTIONS.map(s => ({ label: s.label, value: s.id }))}
            />
          </ControlCard>

          <ControlCard title="Tính năng">
            <ToggleRow label="Likes" checked={config.showLikes && canUseLikes} onChange={(v) => setConfig(prev => ({ ...prev, showLikes: v }))} accentColor="#a855f7" disabled={!canUseLikes} />
            <ToggleRow label="Replies" checked={config.showReplies && canUseReplies} onChange={(v) => setConfig(prev => ({ ...prev, showReplies: v }))} accentColor="#a855f7" disabled={!canUseReplies} />
            <ToggleRow label="Moderation" checked={config.showModeration && canUseModeration} onChange={(v) => setConfig(prev => ({ ...prev, showModeration: v }))} accentColor="#a855f7" disabled={!canUseModeration} />
          </ControlCard>

          <ControlCard title="Module liên quan">
            <ExperienceModuleLink
              enabled={commentsModule?.enabled ?? false}
              href="/system/modules/comments"
              icon={MessageSquare}
              title="Bình luận & Đánh giá"
              colorScheme="purple"
            />
            <ModuleFeatureStatus
              label="Likes"
              enabled={likesFeature?.enabled ?? false}
              href="/system/modules/comments"
              moduleName="module Bình luận"
            />
            <ModuleFeatureStatus
              label="Replies"
              enabled={repliesFeature?.enabled ?? false}
              href="/system/modules/comments"
              moduleName="module Bình luận"
            />
            <ModuleFeatureStatus
              label="Moderation"
              enabled={moderationFeature?.enabled ?? false}
              href="/system/modules/comments"
              moduleName="module Bình luận"
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
            <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/products/example#comments">
              <CommentsRatingPreview
                ratingDisplayStyle={config.ratingDisplayStyle}
                commentsSortOrder={config.commentsSortOrder}
                showLikes={config.showLikes && (commentsModule?.enabled ?? false) && (likesFeature?.enabled ?? true)}
                showReplies={config.showReplies && (commentsModule?.enabled ?? false) && (repliesFeature?.enabled ?? true)}
                showModeration={config.showModeration && (commentsModule?.enabled ?? false) && (moderationFeature?.enabled ?? true)}
                device={previewDevice}
                brandColor="#a855f7"
              />
            </BrowserFrame>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {'Thiết bị: '}{previewDevice === 'desktop' && 'Desktop (1920px)'}{previewDevice === 'tablet' && 'Tablet (768px)'}{previewDevice === 'mobile' && 'Mobile (375px)'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
