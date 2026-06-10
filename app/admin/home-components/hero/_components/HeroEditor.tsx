'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import { HomeComponentStickyFooter } from '../../_shared/components/HomeComponentStickyFooter';
import { TypeColorOverrideCard } from '../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../_shared/components/TypeFontOverrideCard';
import { useDraftFileCleanup } from '../../_shared/hooks/useDraftFileCleanup';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../_shared/lib/typeColorOverride';
import { DEFAULT_HERO_CONTENT } from '../_lib/constants';
import {
  normalizeHeroCornerRadius,
  normalizeHeroSpacing,
  type HeroContent,
  type HeroCornerRadius,
  type HeroSlide,
  type HeroSpacing,
  type HeroStyle,
} from '../_types';
import { detectMediaType } from '@/lib/utils/media';
import { HeroForm } from './HeroForm';
import { HeroPreview } from './HeroPreview';
import { useUnsavedGuard } from '../../_shared/hooks/useUnsavedGuard';
import { useUndoRedo } from '../../_shared/hooks/useUndoRedo';

const COMPONENT_TYPE = 'Hero';

const DEMO_HERO_SLIDES: HeroSlide[] = [
  { id: 'demo-1', link: '/khuyen-mai', url: '/demo/brand-banners/banner-1.webp' },
  { id: 'demo-2', link: '/san-pham-moi', url: '/demo/brand-banners/banner-2.webp' },
  { id: 'demo-3', link: '/bo-suu-tap', url: '/demo/brand-banners/banner-3.webp' },
  { id: 'demo-4', link: '', url: '/demo/brand-banners/banner-4.webp' },
];

type HeroEditorInitial = {
  active: boolean;
  config: Record<string, any>;
  title: string;
};

type HeroEditorSaveInput = {
  active: boolean;
  config: Record<string, unknown>;
  storageIds: Id<'_storage'>[];
  title: string;
};

const normalizeHeroSlides = (slides: unknown): HeroSlide[] => {
  if (!Array.isArray(slides) || slides.length === 0) {
    return [{ id: 'slide-1', link: '', url: '' }];
  }

  return slides.map((slide, index) => {
    const item = typeof slide === 'object' && slide !== null ? slide as Record<string, any> : {};
    return {
      id: typeof item.id === 'string' || typeof item.id === 'number' ? item.id : `slide-${index + 1}`,
      link: typeof item.link === 'string' ? item.link : '',
      mediaType: item.mediaType === 'image' || item.mediaType === 'video' ? item.mediaType : undefined,
      storageId: item.storageId,
      url: typeof item.url === 'string' ? item.url : typeof item.image === 'string' ? item.image : '',
    };
  });
};

export function buildHeroConfig({
  cornerRadius,
  heroContent,
  heroSlides,
  heroStyle,
  spacing,
}: {
  cornerRadius: HeroCornerRadius;
  heroContent: HeroContent;
  heroSlides: HeroSlide[];
  heroStyle: HeroStyle;
  spacing: HeroSpacing;
}) {
  return {
    content: heroContent,
    cornerRadius,
    noBorderRadius: cornerRadius === 'none',
    spacing,
    slides: heroSlides.map((slide) => ({
      image: slide.url,
      link: slide.link,
      mediaType: detectMediaType(slide.url),
      ...(slide.storageId ? { storageId: slide.storageId } : {}),
    })),
    style: heroStyle,
  };
}

export function HeroEditor({
  backHref,
  draftOwnerKey,
  enableTypeOverrides = true,
  heading = 'Chỉnh sửa Hero Banner',
  initial,
  onAfterSave,
  onSave,
  showSnapshotLabel,
  colorOverride,
  fontOverride,
}: {
  backHref: string;
  draftOwnerKey: string;
  enableTypeOverrides?: boolean;
  heading?: string;
  initial: HeroEditorInitial;
  onAfterSave?: () => void;
  onSave: (input: HeroEditorSaveInput) => Promise<void>;
  showSnapshotLabel?: string;
  colorOverride?: ReturnType<typeof useTypeColorOverrideState>;
  fontOverride?: ReturnType<typeof useTypeFontOverrideState>;
}) {
  const router = useRouter();
  const { commitUploads, trackUpload } = useDraftFileCleanup(draftOwnerKey);

  const localColorOverride = useTypeColorOverrideState(COMPONENT_TYPE);
  const localFontOverride = useTypeFontOverrideState(COMPONENT_TYPE);

  const activeColorOverride = colorOverride ?? localColorOverride;
  const activeFontOverride = fontOverride ?? localFontOverride;
  
  const {
    customState,
    effectiveColors,
    showCustomBlock,
    setCustomState,
    initialCustom,
  } = activeColorOverride;

  const {
    customState: customFontState,
    effectiveFont,
    showCustomBlock: showFontCustomBlock,
    setCustomState: setCustomFontState,
    initialCustom: initialFontCustom,
  } = activeFontOverride;

  const [title, setTitle] = useState(initial.title);
  const [active, setActive] = useState(initial.active);
  const {
    state: heroSlides,
    set: setHeroSlides,
    undo: undoSlides,
    redo: redoSlides,
    canUndo: canUndoSlides,
    canRedo: canRedoSlides,
    reset: resetSlides,
  } = useUndoRedo<HeroSlide[]>(() => normalizeHeroSlides(initial.config.slides), { maxHistory: 15 });
  const [heroStyle, setHeroStyle] = useState<HeroStyle>(() => (initial.config.style as HeroStyle) || 'slider');
  const [heroContent, setHeroContent] = useState<HeroContent>(() => (initial.config.content as HeroContent) ?? DEFAULT_HERO_CONTENT);
  const [cornerRadius, setCornerRadius] = useState<HeroCornerRadius>(() => normalizeHeroCornerRadius(initial.config.cornerRadius, initial.config.noBorderRadius));
  const [spacing, setSpacing] = useState<HeroSpacing>(() => normalizeHeroSpacing(initial.config.spacing));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({
    active: initial.active,
    content: (initial.config.content as HeroContent) ?? DEFAULT_HERO_CONTENT,
    cornerRadius: normalizeHeroCornerRadius(initial.config.cornerRadius, initial.config.noBorderRadius),
    slides: normalizeHeroSlides(initial.config.slides),
    spacing: normalizeHeroSpacing(initial.config.spacing),
    style: ((initial.config.style as HeroStyle) || 'slider') as HeroStyle,
    title: initial.title,
  });

  useEffect(() => {
    const slides = normalizeHeroSlides(initial.config.slides);
    const style = ((initial.config.style as HeroStyle) || 'slider') as HeroStyle;
    const content = (initial.config.content as HeroContent) ?? DEFAULT_HERO_CONTENT;
    const nextCornerRadius = normalizeHeroCornerRadius(initial.config.cornerRadius, initial.config.noBorderRadius);
    const nextSpacing = normalizeHeroSpacing(initial.config.spacing);

    setTitle(initial.title);
    setActive(initial.active);
    resetSlides(slides);  // reset history khi load data mới
    setHeroStyle(style);
    setHeroContent(content);
    setCornerRadius(nextCornerRadius);
    setSpacing(nextSpacing);
    setInitialData({
      active: initial.active,
      content,
      cornerRadius: nextCornerRadius,
      slides,
      spacing: nextSpacing,
      style,
      title: initial.title,
    });
  }, [initial, resetSlides]);

  const resolvedCustomSecondary = resolveSecondaryByMode(
    customState.mode,
    customState.primary,
    customState.secondary,
  );
  const resolvedInitialSecondary = resolveSecondaryByMode(
    initialCustom.mode,
    initialCustom.primary,
    initialCustom.secondary,
  );
  const customChanged = enableTypeOverrides && showCustomBlock
    ? customState.enabled !== initialCustom.enabled
      || customState.mode !== initialCustom.mode
      || customState.primary !== initialCustom.primary
      || resolvedCustomSecondary !== resolvedInitialSecondary
    : false;
  const customFontChanged = enableTypeOverrides && showFontCustomBlock
    ? customFontState.enabled !== initialFontCustom.enabled
      || customFontState.fontKey !== initialFontCustom.fontKey
    : false;
  const hasChanges = title !== initialData.title
    || active !== initialData.active
    || JSON.stringify(heroSlides) !== JSON.stringify(initialData.slides)
    || heroStyle !== initialData.style
    || JSON.stringify(heroContent) !== JSON.stringify(initialData.content)
    || cornerRadius !== initialData.cornerRadius
    || spacing !== initialData.spacing
    || customChanged
    || customFontChanged;

  useUnsavedGuard(hasChanges);

  const handleUseDemoImages = () => {
    setHeroSlides(DEMO_HERO_SLIDES.map((slide) => ({ ...slide })));
    // setHeroSlides gọi qua useUndoRedo.set → tự push vào history → có thể Ctrl+Z để undo
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const config = buildHeroConfig({ cornerRadius, heroContent, heroSlides, heroStyle, spacing });
      const storageIds = heroSlides.map(slide => slide.storageId).filter((storageId): storageId is Id<'_storage'> => Boolean(storageId));
      await onSave({ active, config, storageIds, title });
      await commitUploads(storageIds);
      toast.success('Đã cập nhật Hero Banner');
      setInitialData({ active, content: heroContent, cornerRadius, slides: heroSlides, spacing, style: heroStyle, title });
      onAfterSave?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{heading}</h1>
        {showSnapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {showSnapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutTemplate size={20} />
              Hero Banner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                copyLabel="tiêu đề hiển thị"
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>
          </CardContent>
        </Card>

        <HeroForm
          heroSlides={heroSlides}
          setHeroSlides={setHeroSlides}
          heroStyle={heroStyle}
          heroContent={heroContent}
          setHeroContent={setHeroContent}
          cornerRadius={cornerRadius}
          setCornerRadius={setCornerRadius}
          spacing={spacing}
          setSpacing={setSpacing}
          defaultExpanded={false}
          onUploadComplete={({ storageId, folder }) => trackUpload(storageId, folder)}
          actions={(
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleUseDemoImages}>
                Dùng ảnh demo
              </Button>
            </div>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock ? (
              <TypeColorOverrideCard
                title="Màu custom Hero"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                compact
                toggleLabel="Custom"
                primaryLabel="Chính"
                secondaryLabel="Phụ"
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => {
                  if (next === 'single') {
                    setCustomState((prev) => ({ ...prev, mode: 'single', secondary: prev.primary }));
                    return;
                  }
                  setCustomState((prev) => ({
                    ...prev,
                    mode: 'dual',
                    secondary: prev.mode === 'single' ? getSuggestedSecondary(prev.primary) : prev.secondary,
                  }));
                }}
                onPrimaryChange={(value) => {
                  setCustomState((prev) => ({
                    ...prev,
                    primary: value,
                    secondary: prev.mode === 'single' ? value : prev.secondary,
                  }));
                }}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            ) : null}
            {enableTypeOverrides && showFontCustomBlock ? (
              <TypeFontOverrideCard
                title="Font custom Hero"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            ) : null}
            <HeroPreview
              slides={heroSlides.map((slide, index) => ({ id: index + 1, image: slide.url, link: slide.link, mediaType: detectMediaType(slide.url) }))}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={heroStyle}
              onStyleChange={setHeroStyle}
              content={heroContent}
              cornerRadius={cornerRadius}
              spacing={spacing}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => router.push(backHref)}
          submitLabel="Lưu thay đổi"
          active={active}
          onActiveChange={setActive}
          undoRedo={{
            canUndo: canUndoSlides,
            canRedo: canRedoSlides,
            onUndo: undoSlides,
            onRedo: redoSlides,
          }}
        />
      </form>
    </div>
  );
}
