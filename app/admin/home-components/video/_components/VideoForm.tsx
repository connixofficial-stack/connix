'use client';

import React from 'react';
import { Film, MousePointerClick } from 'lucide-react';
import { Card, CardContent, Input, Label } from '@/app/admin/components/ui';
import { ImageFieldWithUpload } from '@/app/admin/components/ImageFieldWithUpload';
import { VIDEO_STYLES_WITH_CTA } from '../_lib/constants';
import { getVideoInfo, getYouTubeThumbnail } from '../_lib/colors';
import type { VideoConfig, VideoStyle } from '../_types';
import { AiVideoImport } from './AiVideoImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface VideoFormProps {
  config: VideoConfig;
  onChange: (next: VideoConfig) => void;
  selectedStyle: VideoStyle;
  /** create = mở hết, edit = đóng hết */
  defaultExpanded?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Main form                                                          */
/* ------------------------------------------------------------------ */

export function VideoForm({
  config,
  onChange,
  selectedStyle,
  defaultExpanded = true,
}: VideoFormProps) {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['video', 'cta'],
    defaultExpanded
  );
  const videoType = getVideoInfo(config.videoUrl || '').type;
  const showCTAConfig = VIDEO_STYLES_WITH_CTA.includes(selectedStyle);
  const videoAspect = config.videoAspect === 'portrait' ? 'portrait' : 'landscape';

  const getAutoThumbnail = (videoUrl?: string) => {
    const info = getVideoInfo(videoUrl || '');
    return info.type === 'youtube' && info.id ? getYouTubeThumbnail(info.id) : '';
  };

  const patch = (partial: Partial<VideoConfig>) => onChange({ ...config, ...partial });

  const patchVideoUrl = (videoUrl: string) => {
    const currentAutoThumbnail = getAutoThumbnail(config.videoUrl);
    const nextAutoThumbnail = getAutoThumbnail(videoUrl);
    const shouldSyncThumbnail = !config.thumbnailUrl || config.thumbnailUrl === currentAutoThumbnail;

    patch({
      videoUrl,
      ...(shouldSyncThumbnail && nextAutoThumbnail ? { thumbnailUrl: nextAutoThumbnail } : {}),
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-3">
        {/* ── AI Import ─ */}
        <div className="flex justify-end">
          <AiVideoImport
            onApply={(nextPatch) => {
              const currentAutoThumbnail = getAutoThumbnail(config.videoUrl);
              const nextAutoThumbnail = getAutoThumbnail(nextPatch.videoUrl);
              const shouldSyncThumbnail = !config.thumbnailUrl || config.thumbnailUrl === currentAutoThumbnail;

              onChange({
                ...config,
                ...nextPatch,
                ...(shouldSyncThumbnail && nextAutoThumbnail && !nextPatch.thumbnailUrl ? { thumbnailUrl: nextAutoThumbnail } : {}),
              });
            }}
          />
        </div>
        <FormSectionsToggleAllButton
          hasClosedSection={hasClosedSection}
          onToggleAll={handleToggleAll}
        />
        {/* ── Video & Thumbnail ────────────────────── */}
        <SubSection
          icon={Film}
          title="Video & ảnh bìa"
          open={openSections.video}
          onOpenChange={(open) => toggleSection('video', open)}
        >
          <div className="space-y-1.5">
            <Label>URL Video <span className="text-red-500">*</span></Label>
            <Input
              type="url"
              value={config.videoUrl || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => patchVideoUrl(e.target.value)}
              placeholder="YouTube, Vimeo, Drive hoặc link trực tiếp"
              required
            />
            {config.videoUrl?.trim() ? (
              <p className="text-[11px] text-slate-400">
                Loại: <span className="font-medium capitalize">{videoType}</span>
              </p>
            ) : null}
          </div>

          <ImageFieldWithUpload
            label="Thumbnail / ảnh bìa"
            value={config.thumbnailUrl || ''}
            onChange={(thumbnailUrl) => patch({ thumbnailUrl })}
            folder="video-thumbnails"
            className={videoAspect === 'portrait' ? 'max-w-[180px]' : 'max-w-xs'}
            aspectRatio={videoAspect === 'portrait' ? 'portrait' : 'video'}
            quality={0.85}
            placeholder={videoAspect === 'portrait' ? 'Dán URL thumbnail dọc 9:16 hoặc upload ảnh bìa' : 'Dán URL thumbnail ngang 16:9 hoặc upload ảnh bìa'}
          />

          <div className="grid grid-cols-1 gap-2 pt-1 md:grid-cols-2">
            {([
              {
                value: 'landscape' as const,
                title: 'Video ngang 16:9',
                description: 'Phù hợp YouTube, Vimeo, banner, cinema.',
              },
              {
                value: 'portrait' as const,
                title: 'Video dọc 9:16',
                description: 'Phù hợp shorts/reels, thumbnail dọc.',
              },
            ]).map((option) => {
              const selected = videoAspect === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => patch({ videoAspect: option.value })}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.title}</span>
                  <span className="mt-1 block text-xs opacity-75">{option.description}</span>
                </button>
              );
            })}
          </div>

          {/* Playback options — inline grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {([
              { key: 'autoplay' as const, label: 'Tự phát', checked: config.autoplay === true },
              { key: 'loop' as const, label: 'Lặp lại', checked: config.loop === true },
              { key: 'muted' as const, label: 'Tắt tiếng', checked: config.muted !== false },
            ] as const).map(({ key, label, checked }) => (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => patch({ [key]: e.target.checked })}
                  className="w-3.5 h-3.5 rounded"
                />
                {label}
              </label>
            ))}
          </div>
        </SubSection>

        {/* ── CTA & Badge (chỉ styles hỗ trợ) ───── */}
        {showCTAConfig && (
          <SubSection
            icon={MousePointerClick}
            title="CTA & Badge"
            open={openSections.cta}
            onOpenChange={(open) => toggleSection('cta', open)}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Badge</Label>
                <Input
                  value={config.badge || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ badge: e.target.value })}
                  placeholder="VD: Video mới"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nút CTA</Label>
                <Input
                  value={config.buttonText || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ buttonText: e.target.value })}
                  placeholder="VD: Xem ngay"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link CTA</Label>
                <Input
                  value={config.buttonLink || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ buttonLink: e.target.value })}
                  placeholder="/lien-he hoặc https://..."
                />
              </div>
            </div>
          </SubSection>
        )}

      </CardContent>
    </Card>
  );
}
