'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ColorInfoPanel } from '../../../_shared/components/ColorInfoPanel';
import { TestimonialsPreview } from '../../_components/TestimonialsPreview';
import { TestimonialsForm } from '../../_components/TestimonialsForm';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_TESTIMONIALS_CONFIG } from '../../_lib/constants';
import {
  getTestimonialsValidationResult,
  resolveSecondaryForMode,
} from '../../_lib/colors';
import type {
  TestimonialsConfig,
  TestimonialsCornerRadius,
  TestimonialsDesktopColumns,
  TestimonialsItem,
  TestimonialsStyle,
  TestimonialsBrandMode,
} from '../../_types';
import {
  normalizeTestimonialsDesktopColumns,
  normalizeTestimonialsCornerRadius,
  normalizeTestimonialsSpacing,
  normalizeTestimonialsItem,
  normalizeTestimonialsStyle,
  toTestimonialsPersistItem,
} from '../../_types';

const COMPONENT_TYPE = 'Testimonials';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type TestimonialsEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

const normalizeSplitOverlayOpacity = (value: unknown) => {
  const opacity = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(opacity)) {return DEFAULT_TESTIMONIALS_CONFIG.splitBackgroundOverlayOpacity ?? 62;}
  return Math.max(0, Math.min(90, Math.round(opacity)));
};

export default function TestimonialsEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: TestimonialsEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const brandMode: TestimonialsBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);

  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const {
    state: items,
    set: setItems,
    undo: undoitems,
    redo: redoitems,
    canUndo: canUndoitems,
    canRedo: canRedoitems,
    reset: resetitems,
  } = useUndoRedo<TestimonialsItem[]>([], { maxHistory: 15 });
  const [style, setStyle] = useState<TestimonialsStyle>('cards');
  const [desktopColumns, setDesktopColumns] = useState<TestimonialsDesktopColumns>(DEFAULT_TESTIMONIALS_CONFIG.desktopColumns ?? 3);
  const [splitBackgroundImage, setSplitBackgroundImage] = useState(DEFAULT_TESTIMONIALS_CONFIG.splitBackgroundImage ?? '');
  const [splitBackgroundOverlayOpacity, setSplitBackgroundOverlayOpacity] = useState(DEFAULT_TESTIMONIALS_CONFIG.splitBackgroundOverlayOpacity ?? 62);
  const [cornerRadius, setCornerRadius] = useState<TestimonialsCornerRadius>(DEFAULT_TESTIMONIALS_CONFIG.cornerRadius ?? 'lg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Header state
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitleHeader, setShowTitleHeader] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [subtitle, setSubtitle] = useState('');
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_TESTIMONIALS_CONFIG.spacing ?? DEFAULT_SECTION_SPACING);
  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], false);

  const resolvedSecondary = resolveSecondaryForMode(effectiveColors.primary, effectiveColors.secondary, brandMode);

  useEffect(() => {
    if (!component) {return;}

    if (!snapshotComponent && component.type !== 'Testimonials') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const rawConfig = (component.config ?? {}) as Partial<TestimonialsConfig>;
    const loadedItems = Array.isArray(rawConfig.items)
      ? rawConfig.items.map((item, idx) => normalizeTestimonialsItem(item, idx))
      : DEFAULT_TESTIMONIALS_CONFIG.items.map((item, idx) => normalizeTestimonialsItem(item, idx));
    const loadedStyle = normalizeTestimonialsStyle(rawConfig.style);
    const loadedDesktopColumns = normalizeTestimonialsDesktopColumns(rawConfig.desktopColumns ?? DEFAULT_TESTIMONIALS_CONFIG.desktopColumns);
    const loadedSplitBackgroundImage = typeof rawConfig.splitBackgroundImage === 'string'
      ? rawConfig.splitBackgroundImage
      : DEFAULT_TESTIMONIALS_CONFIG.splitBackgroundImage ?? '';
    const loadedSplitBackgroundOverlayOpacity = normalizeSplitOverlayOpacity(rawConfig.splitBackgroundOverlayOpacity);
    const loadedSpacing = normalizeTestimonialsSpacing(rawConfig.spacing, rawConfig.noVerticalMargin);
    const loadedCornerRadius = normalizeTestimonialsCornerRadius(rawConfig.cornerRadius, rawConfig.noBorderRadius);

    resetitems(loadedItems);
    setStyle(loadedStyle);
    setDesktopColumns(loadedDesktopColumns);
    setSplitBackgroundImage(loadedSplitBackgroundImage);
    setSplitBackgroundOverlayOpacity(loadedSplitBackgroundOverlayOpacity);
    setSpacing(loadedSpacing);
    setCornerRadius(loadedCornerRadius);

    // Load header config
    const headerConfig = extractSectionHeaderConfig(rawConfig);
    setHideHeader(headerConfig.hideHeader ?? false);
    setShowTitleHeader(headerConfig.showTitle ?? true);
    setShowSubtitle(headerConfig.showSubtitle ?? true);
    setSubtitle(headerConfig.subtitle ?? '');
    setHeaderAlign(headerConfig.headerAlign ?? 'left');
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    setShowBadge(headerConfig.showBadge ?? true);
    setBadgeText(headerConfig.badgeText ?? '');

    const snapshot = JSON.stringify({
      active: component.active,
      items: loadedItems,
      style: loadedStyle,
      desktopColumns: loadedDesktopColumns,
      splitBackgroundImage: loadedSplitBackgroundImage,
      splitBackgroundOverlayOpacity: loadedSplitBackgroundOverlayOpacity,
      cornerRadius: loadedCornerRadius,
      title: component.title,
      type: component.type,
      // Header fields
      hideHeader: headerConfig.hideHeader,
      showTitle: headerConfig.showTitle,
      showSubtitle: headerConfig.showSubtitle,
      subtitle: headerConfig.subtitle,
      headerAlign: headerConfig.headerAlign,
      titleColorPrimary: headerConfig.titleColorPrimary,
      subtitleAboveTitle: headerConfig.subtitleAboveTitle,
      uppercaseText: headerConfig.uppercaseText,
      showBadge: headerConfig.showBadge,
      badgeText: headerConfig.badgeText,
      spacing: loadedSpacing,
    });

    setInitialSnapshot(snapshot);
    setHasChanges(false);
  }, [component, id, router]);

  useEffect(() => {
    if (!component || !initialSnapshot) {return;}

    const snapshot = JSON.stringify({
      active,
      items,
      style,
      desktopColumns,
      splitBackgroundImage,
      splitBackgroundOverlayOpacity,
      cornerRadius,
      title,
      type: component.type,
      // Header fields
      hideHeader,
      showTitle: showTitleHeader,
      showSubtitle,
      subtitle,
      headerAlign,
      titleColorPrimary,
      subtitleAboveTitle,
      uppercaseText,
      showBadge,
      badgeText,
      spacing,
    });
    const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
    const customChanged = enableTypeOverrides && showCustomBlock
      ? customState.enabled !== initialCustom.enabled
        || customState.mode !== initialCustom.mode
        || customState.primary !== initialCustom.primary
        || resolvedCustomSecondary !== initialCustom.secondary
      : false;
    const customFontChanged = enableTypeOverrides && showFontCustomBlock
      ? customFontState.enabled !== initialFontCustom.enabled
        || customFontState.fontKey !== initialFontCustom.fontKey
      : false;

    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [title, active, items, style, desktopColumns, splitBackgroundImage, splitBackgroundOverlayOpacity, cornerRadius, component, initialSnapshot, customState, initialCustom, enableTypeOverrides, showCustomBlock, customFontState, initialFontCustom, showFontCustomBlock, hideHeader, showTitleHeader, showSubtitle, subtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing]);

  useEffect(() => {
    if (!component || component.type !== 'Testimonials') {return;}

    getTestimonialsValidationResult({
      mode: brandMode,
      primary: effectiveColors.primary,
      secondary: resolvedSecondary,
      style,
    });

  }, [component, effectiveColors.primary, resolvedSecondary, brandMode, style]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    getTestimonialsValidationResult({
      mode: brandMode,
      primary: effectiveColors.primary,
      secondary: resolvedSecondary,
      style,
    });

    setIsSubmitting(true);
    try {
      const persistConfig = {
        items: items.map(toTestimonialsPersistItem),
        style,
        desktopColumns,
        splitBackgroundImage,
        splitBackgroundOverlayOpacity,
        cornerRadius,
        hideHeader,
        showTitle: showTitleHeader,
        showSubtitle,
        subtitle,
        headerAlign,
        titleColorPrimary,
        subtitleAboveTitle,
        uppercaseText,
        showBadge,
        badgeText,
        spacing,
      };
      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: persistConfig, title });
      } else {
        await updateMutation({
          active,
          config: persistConfig,
          id: id as Id<'homeComponents'>,
          title,
        });
      }
      if (enableTypeOverrides && showCustomBlock) {
        const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
        await setTypeColorOverride({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
          type: COMPONENT_TYPE,
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        await setTypeFontOverride({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
          type: COMPONENT_TYPE,
        });
      }

      toast.success('Đã cập nhật Testimonials');

      const snapshot = JSON.stringify({
        active,
        items,
        style,
        desktopColumns,
        splitBackgroundImage,
        splitBackgroundOverlayOpacity,
        cornerRadius,
        title,
        type: component?.type,
        // Header fields
        hideHeader,
        showTitle: showTitleHeader,
        showSubtitle,
        subtitle,
        headerAlign,
        titleColorPrimary,
        subtitleAboveTitle,
        uppercaseText,
        showBadge,
        badgeText,
        spacing,
      });

      setInitialSnapshot(snapshot);
      if (enableTypeOverrides && showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary),
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
      setHasChanges(false);
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (component === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy component</div>;
  }

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Testimonials</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <HeaderConfigSection
          hideHeader={hideHeader}
          title={title}
          showTitle={showTitleHeader}
          subtitle={subtitle}
          showSubtitle={showSubtitle}
          headerAlign={headerAlign}
          titleColorPrimary={titleColorPrimary}
          subtitleAboveTitle={subtitleAboveTitle}
          uppercaseText={uppercaseText}
          showBadge={showBadge}
          badgeText={badgeText}
          onHideHeaderChange={setHideHeader}
          onTitleChange={setTitle}
          onShowTitleChange={setShowTitleHeader}
          onSubtitleChange={setSubtitle}
          onShowSubtitleChange={setShowSubtitle}
          onHeaderAlignChange={setHeaderAlign}
          onTitleColorPrimaryChange={setTitleColorPrimary}
          onSubtitleAboveTitleChange={setSubtitleAboveTitle}
          onUppercaseTextChange={setUppercaseText}
          onShowBadgeChange={setShowBadge}
          onBadgeTextChange={setBadgeText}
          expanded={openSections.header}
          onExpandedChange={(open) => toggleSection('header', open)}
          className="mb-3"
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <div className="mb-3">
          <HomeComponentDisplaySettingsSection
            open={openSections.display}
            onOpenChange={(open) => toggleSection('display', open)}
            cornerRadius={cornerRadius}
            onCornerRadiusChange={setCornerRadius}
            spacing={spacing}
            onSpacingChange={setSpacing}
          >
              <div className="space-y-2">
                <Label>Số cột desktop</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([3, 4] as const).map((option) => {
                    const selected = desktopColumns === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDesktopColumns(option)}
                        className={cn(
                          'h-9 rounded-md border text-xs transition-colors',
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                        )}
                      >
                        {option} cột
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">3 cột: tablet 3, mobile 1. 4 cột: tablet/mobile 2.</p>
              </div>
          </HomeComponentDisplaySettingsSection>
        </div>

        <TestimonialsForm
          items={items}
          setItems={setItems}
          defaultExpanded={false}
          desktopColumns={desktopColumns}
          selectedStyle={style}
          splitBackgroundImage={splitBackgroundImage}
          onSplitBackgroundImageChange={setSplitBackgroundImage}
          splitBackgroundOverlayOpacity={splitBackgroundOverlayOpacity}
          onSplitBackgroundOverlayOpacityChange={setSplitBackgroundOverlayOpacity}
        />

        <div className="space-y-4">
          {enableTypeOverrides && showCustomBlock && (
            <TypeColorOverrideCard
              title="Màu custom cho Testimonials"
              enabled={customState.enabled}
              mode={customState.mode}
              primary={customState.primary}
              secondary={customState.secondary}
              onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
              onModeChange={(next) => setCustomState((prev) => {
                if (next === 'single') {
                  return { ...prev, mode: next, secondary: prev.primary };
                }
                if (prev.mode === 'single') {
                  return { ...prev, mode: next, secondary: getSuggestedSecondary(prev.primary) };
                }
                return { ...prev, mode: next };
              })}
              onPrimaryChange={(value) => setCustomState((prev) => ({
                ...prev,
                primary: value,
                secondary: prev.mode === 'single' ? value : prev.secondary,
              }))}
              onSecondaryChange={(value) => setCustomState((prev) => ({
                ...prev,
                secondary: prev.mode === 'single' ? prev.primary : value,
              }))}
            />
          )}
          {enableTypeOverrides && showFontCustomBlock && (
            <TypeFontOverrideCard
              title="Font custom cho Testimonials"
              enabled={customFontState.enabled}
              fontKey={customFontState.fontKey}
              compact
              toggleLabel="Custom"
              fontLabel="Font"
              onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
              onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <TestimonialsPreview
              items={items}
              brandColor={effectiveColors.primary}
              secondary={resolvedSecondary}
              mode={brandMode}
              selectedStyle={style}
              onStyleChange={setStyle}
              fontStyle={fontStyle}
              fontClassName="font-active"
              title={title}
              subtitle={subtitle}
              hideHeader={hideHeader}
              showTitle={showTitleHeader}
              showSubtitle={showSubtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={showBadge}
              badgeText={badgeText}
              spacing={spacing}
              cornerRadius={cornerRadius}
              desktopColumns={desktopColumns}
              splitBackgroundImage={splitBackgroundImage}
              splitBackgroundOverlayOpacity={splitBackgroundOverlayOpacity}
            />
            {brandMode === 'dual' && (
              <ColorInfoPanel brandColor={effectiveColors.primary} secondary={resolvedSecondary} />
            )}
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => { router.push(backHref); }}
          submitLabel="Lưu thay đổi"
        active={active}
        onActiveChange={setActive}
        
        undoRedo={{
          canUndo: canUndoitems,
          canRedo: canRedoitems,
          onUndo: undoitems,
          onRedo: redoitems,
        }}
        />
      </form>
    </div>
  );
}
