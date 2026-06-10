'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { CareerPreview } from '../../_components/CareerPreview';
import { CareerForm } from '../../_components/CareerForm';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import {
  createCareerJob,
  DEFAULT_CAREER_CONFIG,
  DEFAULT_CAREER_CORNER_RADIUS,
  DEFAULT_CAREER_DESKTOP_COLUMNS,
  DEFAULT_CAREER_LOGO_SIZE,
  DEFAULT_CAREER_TEXTS,
  normalizeCareerCornerRadius,
  normalizeCareerDesktopColumns,
  normalizeCareerLogoSize,
} from '../../_lib/constants';
import {
  normalizeCareerConfig,
  normalizeCareerJobs,
  toCareerJobsForConfig,
} from '../../_lib/normalize';
import type {
  CareerConfig,
  CareerCornerRadius,
  CareerDesktopColumns,
  CareerLogoSize,
  CareerStyle,
  CareerTexts,
  JobPosition,
} from '../../_types';

const COMPONENT_TYPE = 'Career';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type CareerEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

interface CareerSnapshotPayload {
  title: string;
  active: boolean;
  jobs: JobPosition[];
  style: CareerStyle;
  spacing: SectionSpacing;
  texts: CareerTexts;
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
  desktopColumns: CareerDesktopColumns;
  cornerRadius: CareerCornerRadius;
  noBorderRadius: boolean;
  noVerticalMargin: boolean;
  logoSize: CareerLogoSize;
}

const toSnapshot = (payload: CareerSnapshotPayload) => JSON.stringify(payload);

export default function CareerEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: CareerEditPageProps) {
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
    state: jobs,
    set: setJobs,
    undo: undojobs,
    redo: redojobs,
    canUndo: canUndojobs,
    canRedo: canRedojobs,
    reset: resetjobs,
  } = useUndoRedo<JobPosition[]>([createCareerJob({ type: 'Full-time' })], { maxHistory: 15 });
  const [careerStyle, setCareerStyle] = useState<CareerStyle>('cards');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [texts, setTexts] = useState<CareerTexts>(DEFAULT_CAREER_TEXTS);
  const [hideHeader, setHideHeader] = useState(Boolean(DEFAULT_CAREER_CONFIG.hideHeader));
  const [showTitle, setShowTitle] = useState(DEFAULT_CAREER_CONFIG.showTitle ?? true);
  const [subtitle, setSubtitle] = useState(DEFAULT_CAREER_CONFIG.subtitle ?? DEFAULT_CAREER_TEXTS.subtitle ?? '');
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_CAREER_CONFIG.showSubtitle ?? true);
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>(DEFAULT_CAREER_CONFIG.headerAlign ?? 'center');
  const [titleColorPrimary, setTitleColorPrimary] = useState(Boolean(DEFAULT_CAREER_CONFIG.titleColorPrimary));
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(Boolean(DEFAULT_CAREER_CONFIG.subtitleAboveTitle));
  const [uppercaseText, setUppercaseText] = useState(Boolean(DEFAULT_CAREER_CONFIG.uppercaseText));
  const [showBadge, setShowBadge] = useState(Boolean(DEFAULT_CAREER_CONFIG.showBadge));
  const [badgeText, setBadgeText] = useState(DEFAULT_CAREER_CONFIG.badgeText ?? '');
  const [expandedSections, setExpandedSections] = useState({ header: false, display: false });
  const [desktopColumns, setDesktopColumns] = useState<CareerDesktopColumns>(DEFAULT_CAREER_DESKTOP_COLUMNS);
  const [cornerRadius, setCornerRadius] = useState<CareerCornerRadius>(DEFAULT_CAREER_CORNER_RADIUS);
  const [logoSize, setLogoSize] = useState<CareerLogoSize>(DEFAULT_CAREER_LOGO_SIZE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (!component) {return;}

    if (!snapshotComponent && component.type !== 'Career') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const normalized = normalizeCareerConfig(component.config);
    const normalizedJobs = normalized.jobs.length > 0
      ? normalized.jobs
      : [createCareerJob({ type: 'Full-time' })];

    const normalizedTexts = { ...DEFAULT_CAREER_TEXTS, ...normalized.texts };

    setTitle(component.title);
    setActive(component.active);
    resetjobs(normalizedJobs);
    setCareerStyle(normalized.style);
    setSpacing(normalizeSectionSpacing(normalized.spacing));
    setTexts(normalizedTexts);
    setHideHeader(Boolean(normalized.hideHeader));
    setShowTitle(normalized.showTitle ?? true);
    setSubtitle(normalized.subtitle ?? DEFAULT_CAREER_TEXTS.subtitle ?? '');
    setShowSubtitle(normalized.showSubtitle ?? true);
    setHeaderAlign(normalized.headerAlign ?? 'center');
    setTitleColorPrimary(Boolean(normalized.titleColorPrimary));
    setSubtitleAboveTitle(Boolean(normalized.subtitleAboveTitle));
    setUppercaseText(Boolean(normalized.uppercaseText));
    setShowBadge(Boolean(normalized.showBadge));
    setBadgeText(normalized.badgeText ?? '');
    setDesktopColumns(normalizeCareerDesktopColumns(normalized.desktopColumns));
    setCornerRadius(normalizeCareerCornerRadius(normalized.cornerRadius));
    setLogoSize(normalizeCareerLogoSize(normalized.logoSize));

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      jobs: normalizedJobs,
      style: normalized.style,
      spacing: normalizeSectionSpacing(normalized.spacing),
      texts: { ...normalizedTexts, subtitle: normalized.subtitle ?? DEFAULT_CAREER_TEXTS.subtitle ?? '' },
      hideHeader: Boolean(normalized.hideHeader),
      showTitle: normalized.showTitle ?? true,
      subtitle: normalized.subtitle ?? DEFAULT_CAREER_TEXTS.subtitle ?? '',
      showSubtitle: normalized.showSubtitle ?? true,
      headerAlign: normalized.headerAlign ?? 'center',
      titleColorPrimary: Boolean(normalized.titleColorPrimary),
      subtitleAboveTitle: Boolean(normalized.subtitleAboveTitle),
      uppercaseText: Boolean(normalized.uppercaseText),
      showBadge: Boolean(normalized.showBadge),
      badgeText: normalized.badgeText ?? '',
      desktopColumns: normalizeCareerDesktopColumns(normalized.desktopColumns),
      cornerRadius: normalizeCareerCornerRadius(normalized.cornerRadius),
      noBorderRadius: normalizeCareerCornerRadius(normalized.cornerRadius) === 'none',
      noVerticalMargin: normalizeSectionSpacing(normalized.spacing) === 'none',
      logoSize: normalizeCareerLogoSize(normalized.logoSize),
    }));
  }, [component, id, router, snapshotComponent]);

  const normalizedJobs = useMemo(() => normalizeCareerJobs(jobs), [jobs]);
  const mergedTexts = useMemo(() => ({ ...texts, subtitle }), [texts, subtitle]);

  const currentSnapshot = useMemo(() => toSnapshot({
    title,
    active,
    jobs: toCareerJobsForConfig(normalizedJobs),
    style: careerStyle,
    spacing,
    texts: mergedTexts,
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
    desktopColumns,
    cornerRadius,
    noBorderRadius: cornerRadius === 'none',
    noVerticalMargin: spacing === 'none',
    logoSize,
  }), [title, active, normalizedJobs, careerStyle, spacing, mergedTexts, hideHeader, showTitle, subtitle, showSubtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, desktopColumns, cornerRadius, logoSize]);

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
      const nextConfig: CareerConfig = {
        jobs: toCareerJobsForConfig(normalizedJobs),
        style: careerStyle,
        spacing,
        texts: mergedTexts,
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
        desktopColumns,
        cornerRadius,
        noBorderRadius: cornerRadius === 'none',
        noVerticalMargin: spacing === 'none',
        logoSize,
      };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig as Record<string, any>, title });
      } else {
        await updateMutation({
          active,
          config: nextConfig,
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

      setInitialSnapshot(toSnapshot({
        title,
        active,
        jobs: nextConfig.jobs,
        style: nextConfig.style,
        spacing,
        texts: nextConfig.texts ?? DEFAULT_CAREER_TEXTS,
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
        desktopColumns,
        cornerRadius,
        noBorderRadius: cornerRadius === 'none',
        noVerticalMargin: spacing === 'none',
        logoSize,
      }));
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

      toast.success('Đã cập nhật Career');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Career</h1>
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
          expanded={expandedSections.header}
          onExpandedChange={(value) => setExpandedSections((prev) => ({ ...prev, header: value }))}
          className="mb-3"
          sectionTitle="Tiêu đề và mô tả"
          titleRequired
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <div className="mb-3">
          <HomeComponentDisplaySettingsSection
            open={expandedSections.display}
            onOpenChange={(value) => setExpandedSections((prev) => ({ ...prev, display: value }))}
            cornerRadius={cornerRadius}
            onCornerRadiusChange={setCornerRadius}
            spacing={spacing}
            onSpacingChange={setSpacing}
          >
                <div className="space-y-2">
                  <Label>Kích thước logo</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={logoSize}
                    onChange={(event) => setLogoSize(normalizeCareerLogoSize(event.target.value))}
                  >
                    <option value="small">Nhỏ</option>
                    <option value="medium">Bình thường</option>
                    <option value="large">Lớn</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Số cột desktop</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={desktopColumns}
                    onChange={(event) => setDesktopColumns(normalizeCareerDesktopColumns(Number(event.target.value)))}
                  >
                    <option value={3}>3 cột</option>
                    <option value={4}>4 cột</option>
                  </select>
                </div>
          </HomeComponentDisplaySettingsSection>
        </div>

        <CareerForm jobs={jobs} onJobsChange={setJobs} texts={texts} onTextsChange={setTexts} defaultExpanded={false} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Tuyển dụng"
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
                title="Font custom cho Tuyển dụng"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <CareerPreview
              jobs={toCareerJobsForConfig(normalizedJobs)}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={careerStyle}
              onStyleChange={setCareerStyle}
              title={title}
              texts={mergedTexts}
              fontStyle={fontStyle}
              fontClassName="font-active"
              spacing={spacing}
              hideHeader={hideHeader}
              showTitle={showTitle}
              showSubtitle={showSubtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={showBadge}
              badgeText={badgeText}
              desktopColumns={desktopColumns}
              cornerRadius={cornerRadius}
              logoSize={logoSize}
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
          canUndo: canUndojobs,
          canRedo: canRedojobs,
          onUndo: undojobs,
          onRedo: redojobs,
        }}
        />
      </form>
    </div>
  );
}
