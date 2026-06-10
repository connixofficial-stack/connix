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
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ProcessForm } from '../../_components/ProcessForm';
import { ProcessPreview } from '../../_components/ProcessPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  normalizeProcessConfig,
  normalizeProcessFormSteps,
  normalizeProcessRenderSteps,
  serializeProcessFormSteps,
  type ProcessFormStep,
} from '../../_lib/normalize';
import {
  DEFAULT_PROCESS_CORNER_RADIUS,
  type ProcessBrandMode,
  type ProcessCornerRadius,
  type ProcessStep,
  type ProcessStyle,
} from '../../_types';
import { Label, cn } from '@/app/admin/components/ui';

const COMPONENT_TYPE = 'Process';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type ProcessEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function ProcessEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: ProcessEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const {
    state: steps,
    set: setSteps,
    undo: undosteps,
    redo: redosteps,
    canUndo: canUndosteps,
    canRedo: canRedosteps,
    reset: resetsteps,
  } = useUndoRedo<ProcessFormStep[]>([], { maxHistory: 15 });
  const [processStyle, setProcessStyle] = useState<ProcessStyle>('horizontal');
  const [desktopColumns, setDesktopColumns] = useState<3 | 4>(4);
  const [cornerRadius, setCornerRadius] = useState<ProcessCornerRadius>(DEFAULT_PROCESS_CORNER_RADIUS);
  const [circularCtaText, setCircularCtaText] = useState('');
  const [circularCtaLink, setCircularCtaLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Header config states
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [subtitle, setSubtitle] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('center');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], false);

  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'Process') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      const normalizedConfig = normalizeProcessConfig(component.config);
      const normalizedFormSteps = normalizeProcessFormSteps(normalizedConfig.steps);

      setTitle(component.title);
      setActive(component.active);
      resetsteps(normalizedFormSteps);
      setProcessStyle(normalizedConfig.style);
      setDesktopColumns(normalizedConfig.desktopColumns ?? 4);
      setCornerRadius(normalizedConfig.cornerRadius);
      setCircularCtaText(normalizedConfig.circularCtaText ?? '');
      setCircularCtaLink(normalizedConfig.circularCtaLink ?? '');

      // Load header config via shared extractor
      const config = component.config ?? {};
      const hc = extractSectionHeaderConfig(config);
      setHideHeader(hc.hideHeader ?? false);
      setShowTitle(hc.showTitle ?? true);
      setSubtitle(hc.subtitle ?? '');
      setShowSubtitle(hc.showSubtitle ?? true);
      setHeaderAlign(hc.headerAlign ?? 'center');
      setTitleColorPrimary(hc.titleColorPrimary ?? false);
      setSubtitleAboveTitle(hc.subtitleAboveTitle ?? false);
      setUppercaseText(hc.uppercaseText ?? false);
      setShowBadge(hc.showBadge ?? true);
      setBadgeText(hc.badgeText ?? '');
      setSpacing(normalizedConfig.spacing);
    }
  }, [component, id, router]);

  const toSnapshot = (payload: {
    title: string;
    active: boolean;
    steps: ProcessStep[];
    style: ProcessStyle;
    desktopColumns: 3 | 4;
    cornerRadius: ProcessCornerRadius;
    noBorderRadius: boolean;
    hideHeader: boolean;
    showTitle: boolean;
    subtitle: string;
    showSubtitle: boolean;
    headerAlign: 'left' | 'center' | 'right';
    titleColorPrimary: boolean;
    subtitleAboveTitle: boolean;
    uppercaseText: boolean;
    showBadge: boolean;
    badgeText: string;
    spacing: SectionSpacing;
    noVerticalMargin: boolean;
    circularCtaText: string;
    circularCtaLink: string;
  }) => JSON.stringify(payload);

  useEffect(() => {
    if (!component) {return;}
    const config = component.config ?? {};
    const hc = extractSectionHeaderConfig(config);
    const normalizedConfig = normalizeProcessConfig(component.config);
    const normalizedFormSteps = normalizeProcessFormSteps(normalizedConfig.steps);
    const serializedSteps = serializeProcessFormSteps(normalizedFormSteps);

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      steps: serializedSteps,
      style: normalizedConfig.style,
      desktopColumns: normalizedConfig.desktopColumns ?? 4,
      cornerRadius: normalizedConfig.cornerRadius,
      noBorderRadius: normalizedConfig.cornerRadius === 'none',
      hideHeader: hc.hideHeader ?? false,
      showTitle: hc.showTitle ?? true,
      subtitle: hc.subtitle ?? '',
      showSubtitle: hc.showSubtitle ?? true,
      headerAlign: hc.headerAlign ?? 'center',
      titleColorPrimary: hc.titleColorPrimary ?? false,
      subtitleAboveTitle: hc.subtitleAboveTitle ?? false,
      uppercaseText: hc.uppercaseText ?? false,
      showBadge: hc.showBadge ?? true,
      badgeText: hc.badgeText ?? '',
      spacing: normalizedConfig.spacing,
      noVerticalMargin: normalizedConfig.spacing === 'none',
      circularCtaText: normalizedConfig.circularCtaText ?? '',
      circularCtaLink: normalizedConfig.circularCtaLink ?? '',
    }));
  }, [component]);

  const currentSnapshot = toSnapshot({
    title,
    active,
    steps: serializeProcessFormSteps(steps),
    style: processStyle,
    desktopColumns,
    cornerRadius,
    noBorderRadius: cornerRadius === 'none',
    hideHeader,
    showTitle,
    subtitle,
    showSubtitle,
    headerAlign,
    titleColorPrimary,
    subtitleAboveTitle,
    uppercaseText,
    showBadge,
    badgeText,
    spacing,
    noVerticalMargin: spacing === 'none',
    circularCtaText,
    circularCtaLink,
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

  const hasChanges = initialSnapshot !== null && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const serializedSteps = serializeProcessFormSteps(steps);

      const persistConfig = {
        steps: serializedSteps,
        style: processStyle,
        desktopColumns,
        cornerRadius,
        noBorderRadius: cornerRadius === 'none',
        spacing,
        noVerticalMargin: spacing === 'none',
        // Header config
        hideHeader,
        showTitle,
        subtitle,
        showSubtitle,
        headerAlign,
        titleColorPrimary,
        subtitleAboveTitle,
        uppercaseText,
        showBadge,
        badgeText,
        circularCtaText,
        circularCtaLink,
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

      toast.success('Đã cập nhật Process');
      setInitialSnapshot(currentSnapshot);
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

  const normalizedPreviewSteps = normalizeProcessRenderSteps(serializeProcessFormSteps(steps));

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Process</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <HeaderConfigSection
          hideHeader={hideHeader}
          title={title}
          showTitle={showTitle}
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
          onShowTitleChange={setShowTitle}
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
              </div>
          </HomeComponentDisplaySettingsSection>
        </div>

        <ProcessForm
          steps={steps}
          onChange={setSteps}
          secondary={effectiveColors.secondary}
          defaultExpanded={false}
          style={processStyle}
          circularCtaText={circularCtaText}
          circularCtaLink={circularCtaLink}
          onChangeCircularCtaText={setCircularCtaText}
          onChangeCircularCtaLink={setCircularCtaLink}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Process"
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
                title="Font custom cho Process"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ProcessPreview
              steps={normalizedPreviewSteps}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode as ProcessBrandMode}
              selectedStyle={processStyle}
              onStyleChange={setProcessStyle}
              title={title}
              hideHeader={hideHeader}
              showTitle={showTitle}
              showSubtitle={showSubtitle}
              subtitle={subtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={showBadge}
              badgeText={badgeText}
              fontStyle={fontStyle}
              fontClassName="font-active"
              desktopColumns={desktopColumns}
              spacing={spacing}
              cornerRadius={cornerRadius}
              circularCtaText={circularCtaText}
              circularCtaLink={circularCtaLink}
            />
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
          canUndo: canUndosteps,
          canRedo: canRedosteps,
          onUndo: undosteps,
          onRedo: redosteps,
        }}
        />
      </form>
    </div>
  );
}
