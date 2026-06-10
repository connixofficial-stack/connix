'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AlertTriangle, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { extractSectionHeaderConfig, useSectionHeaderState } from '../../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import {
  getCaseStudyValidationResult,
} from '../../_lib/colors';
import { CaseStudyForm } from '../../_components/CaseStudyForm';
import { CaseStudyPreview } from '../../_components/CaseStudyPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import type {
  CaseStudyBrandMode,
  CaseStudyCornerRadius,
  CaseStudyDesktopColumns,
  CaseStudyProject,
  CaseStudyStyle,
} from '../../_types';
import {
  DEFAULT_CASE_STUDY_CONFIG,
  normalizeCaseStudyCornerRadius,
  normalizeCaseStudyDesktopColumns,
  normalizeCaseStudySpacing,
  normalizeCaseStudyStyle,
} from '../../_types';

const COMPONENT_TYPE = 'CaseStudy';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type CaseStudyEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function CaseStudyEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: CaseStudyEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const brandMode: CaseStudyBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const headerState = useSectionHeaderState(DEFAULT_CASE_STUDY_CONFIG);
  const [expandedSections, setExpandedSections] = useState({ header: false });
  const [active, setActive] = useState(true);
  const {
    state: projects,
    set: setProjects,
    undo: undoprojects,
    redo: redoprojects,
    canUndo: canUndoprojects,
    canRedo: canRedoprojects,
  } = useUndoRedo<CaseStudyProject[]>([], { maxHistory: 15 });
  const [caseStudyStyle, setCaseStudyStyle] = useState<CaseStudyStyle>('grid');
  const [cornerRadius, setCornerRadius] = useState<CaseStudyCornerRadius>('lg');
  const [desktopColumns, setDesktopColumns] = useState<CaseStudyDesktopColumns>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialState, setInitialState] = useState<string>('');

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'CaseStudy') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      setProjects(config.projects?.map((project: { title: string; category: string; image: string; description: string; link: string }, idx: number) => ({
        id: idx,
        title: project.title,
        category: project.category,
        image: project.image,
        description: project.description,
        link: project.link,
      })) ?? []);
      const nextStyle = normalizeCaseStudyStyle(config.style);
      const nextHeader = extractSectionHeaderConfig(config);
      const nextSpacing = normalizeCaseStudySpacing(config.spacing, config.noVerticalMargin);
      const nextCornerRadius = normalizeCaseStudyCornerRadius(config.cornerRadius, config.noBorderRadius);
      const nextDesktopColumns = normalizeCaseStudyDesktopColumns(config.desktopColumns);
      setCaseStudyStyle(nextStyle);
      headerState.setHideHeader(nextHeader.hideHeader ?? false);
      headerState.setShowTitle(nextHeader.showTitle ?? true);
      headerState.setShowSubtitle(nextHeader.showSubtitle ?? true);
      headerState.setSubtitle(nextHeader.subtitle ?? '');
      headerState.setHeaderAlign(nextHeader.headerAlign ?? 'center');
      headerState.setTitleColorPrimary(nextHeader.titleColorPrimary ?? false);
      headerState.setSubtitleAboveTitle(nextHeader.subtitleAboveTitle ?? false);
      headerState.setUppercaseText(nextHeader.uppercaseText ?? false);
      headerState.setShowBadge(nextHeader.showBadge ?? true);
      headerState.setBadgeText(nextHeader.badgeText ?? '');
      headerState.setSpacing(nextSpacing);
      setCornerRadius(nextCornerRadius);
      setDesktopColumns(nextDesktopColumns);

      const snapshot = JSON.stringify({
        active: component.active,
        hideHeader: nextHeader.hideHeader ?? false,
        showTitle: nextHeader.showTitle ?? true,
        subtitle: nextHeader.subtitle ?? '',
        showSubtitle: nextHeader.showSubtitle ?? true,
        headerAlign: nextHeader.headerAlign ?? 'center',
        titleColorPrimary: nextHeader.titleColorPrimary ?? false,
        subtitleAboveTitle: nextHeader.subtitleAboveTitle ?? false,
        uppercaseText: nextHeader.uppercaseText ?? false,
        showBadge: nextHeader.showBadge ?? true,
        badgeText: nextHeader.badgeText ?? '',
        projects: config.projects?.map((project: { title: string; category: string; image: string; description: string; link: string }) => ({
          category: project.category,
          description: project.description,
          image: project.image,
          link: project.link,
          title: project.title,
        })) ?? [],
        style: nextStyle,
        cornerRadius: nextCornerRadius,
        desktopColumns: nextDesktopColumns,
        spacing: nextSpacing,
        title: component.title,
      });
      setInitialState(snapshot);
      setHasChanges(false);
    }
  }, [component, id, router]);

  const currentState = useMemo(() => JSON.stringify({
    active,
    hideHeader: headerState.hideHeader,
    showTitle: headerState.showTitle,
    subtitle: headerState.subtitle,
    showSubtitle: headerState.showSubtitle,
    headerAlign: headerState.headerAlign,
    titleColorPrimary: headerState.titleColorPrimary,
    subtitleAboveTitle: headerState.subtitleAboveTitle,
    uppercaseText: headerState.uppercaseText,
    showBadge: headerState.showBadge,
    badgeText: headerState.badgeText,
    projects: projects.map((project) => ({
      category: project.category,
      description: project.description,
      image: project.image,
      link: project.link,
      title: project.title,
    })),
    style: caseStudyStyle,
    cornerRadius,
    desktopColumns,
    spacing: headerState.spacing,
    title,
  }), [
    active,
    caseStudyStyle,
    cornerRadius,
    desktopColumns,
    headerState.badgeText,
    headerState.headerAlign,
    headerState.hideHeader,
    headerState.showBadge,
    headerState.showSubtitle,
    headerState.showTitle,
    headerState.spacing,
    headerState.subtitle,
    headerState.subtitleAboveTitle,
    headerState.titleColorPrimary,
    headerState.uppercaseText,
    projects,
    title,
  ]);

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

  useEffect(() => {
    if (!initialState) {return;}
    setHasChanges(currentState !== initialState || customChanged || customFontChanged);
  }, [currentState, initialState, customChanged, customFontChanged]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    const { harmonyStatus, accessibility } = getCaseStudyValidationResult({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: brandMode,
      style: caseStudyStyle,
    });

    const warnings: string[] = [];

    if (brandMode === 'dual' && harmonyStatus.isTooSimilar) {
      warnings.push(`Hai màu quá giống nhau (deltaE = ${harmonyStatus.deltaE}).`);
    }

    if (accessibility.failing.length > 0) {
      warnings.push(`Một số cặp màu chữ/nền có độ tương phản thấp (minLc = ${accessibility.minLc.toFixed(1)}).`);
    }

    setWarningMessages(warnings);

    setIsSubmitting(true);
    try {
      const nextConfig = {
        hideHeader: headerState.hideHeader,
        showTitle: headerState.showTitle,
        subtitle: headerState.subtitle,
        showSubtitle: headerState.showSubtitle,
        headerAlign: headerState.headerAlign,
        titleColorPrimary: headerState.titleColorPrimary,
        subtitleAboveTitle: headerState.subtitleAboveTitle,
        uppercaseText: headerState.uppercaseText,
        showBadge: headerState.showBadge,
        badgeText: headerState.badgeText,
        projects: projects.map((project) => ({
          category: project.category,
          description: project.description,
          image: project.image,
          link: project.link,
          title: project.title,
        })),
        style: caseStudyStyle,
        cornerRadius,
        desktopColumns,
        spacing: headerState.spacing,
      };
      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig, title });
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
      toast.success('Đã cập nhật Dự án thực tế');
      setInitialState(currentState);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Dự án thực tế</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <HeaderConfigSection
          hideHeader={headerState.hideHeader}
          title={title}
          showTitle={headerState.showTitle}
          subtitle={headerState.subtitle}
          showSubtitle={headerState.showSubtitle}
          headerAlign={headerState.headerAlign}
          titleColorPrimary={headerState.titleColorPrimary}
          subtitleAboveTitle={headerState.subtitleAboveTitle}
          uppercaseText={headerState.uppercaseText}
          showBadge={headerState.showBadge}
          badgeText={headerState.badgeText}
          onHideHeaderChange={headerState.setHideHeader}
          onTitleChange={setTitle}
          onShowTitleChange={headerState.setShowTitle}
          onSubtitleChange={headerState.setSubtitle}
          onShowSubtitleChange={headerState.setShowSubtitle}
          onHeaderAlignChange={headerState.setHeaderAlign}
          onTitleColorPrimaryChange={headerState.setTitleColorPrimary}
          onSubtitleAboveTitleChange={headerState.setSubtitleAboveTitle}
          onUppercaseTextChange={headerState.setUppercaseText}
          onShowBadgeChange={headerState.setShowBadge}
          onBadgeTextChange={headerState.setBadgeText}
          expanded={expandedSections.header}
          onExpandedChange={(value) => setExpandedSections({ header: value })}
          className="mb-3"
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <CaseStudyForm
          projects={projects}
          onChange={setProjects}
          cornerRadius={cornerRadius}
          setCornerRadius={setCornerRadius}
          desktopColumns={desktopColumns}
          setDesktopColumns={setDesktopColumns}
          spacing={headerState.spacing}
          setSpacing={headerState.setSpacing}
          defaultExpanded={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Case Study"
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
                title="Font custom cho Case Study"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <CaseStudyPreview
              projects={projects}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={brandMode}
              selectedStyle={caseStudyStyle}
              onStyleChange={setCaseStudyStyle}
              title={title}
              hideHeader={headerState.hideHeader}
              showTitle={headerState.showTitle}
              subtitle={headerState.subtitle}
              showSubtitle={headerState.showSubtitle}
              headerAlign={headerState.headerAlign}
              titleColorPrimary={headerState.titleColorPrimary}
              subtitleAboveTitle={headerState.subtitleAboveTitle}
              uppercaseText={headerState.uppercaseText}
              showBadge={headerState.showBadge}
              badgeText={headerState.badgeText}
              cornerRadius={cornerRadius}
              desktopColumns={desktopColumns}
              spacing={headerState.spacing}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        {brandMode === 'dual' && warningMessages.length > 0 && (
          <div className="mt-4 space-y-2">
            {warningMessages.map((message, idx) => {
              const isContrastWarning = message.includes('minLc');
              return (
                <div
                  key={`${message}-${idx}`}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"
                >
                  <div className="flex items-start gap-2">
                    {isContrastWarning ? (
                      <Eye size={14} className="mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    )}
                    <p>{message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() =>{  router.push(backHref); }}
          submitLabel="Lưu thay đổi"
        active={active}
        onActiveChange={setActive}
        
        undoRedo={{
          canUndo: canUndoprojects,
          canRedo: canRedoprojects,
          onUndo: undoprojects,
          onRedo: redoprojects,
        }}
        />
      </form>
    </div>
  );
}
