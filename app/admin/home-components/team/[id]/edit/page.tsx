'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label, cn } from '@/app/admin/components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { TeamForm } from '../../_components/TeamForm';
import { TeamPreview } from '../../_components/TeamPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  normalizeTeamConfig,
  toTeamEditorMembers,
  toTeamPersistMembers,
  normalizeTeamStyle,
} from '../../_lib/constants';
import { getTeamValidationResult } from '../../_lib/colors';
import type {
  TeamBrandMode,
  TeamConfig,
  TeamCornerRadius,
  TeamDesktopColumns,
  TeamEditorMember,
  TeamStyle,
  TeamHeaderAlign,
} from '../../_types';

const COMPONENT_TYPE = 'Team';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type TeamEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

const serializeEditState = ({
  title,
  active,
  style,
  members,
  texts,
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
  desktopColumns,
  cornerRadius,
}: {
  title: string;
  active: boolean;
  style: TeamStyle;
  members: TeamEditorMember[];
  texts: Record<string, string>;
  hideHeader: boolean;
  showTitle: boolean;
  subtitle: string;
  showSubtitle: boolean;
  headerAlign: TeamHeaderAlign;
  titleColorPrimary: boolean;
  subtitleAboveTitle: boolean;
  uppercaseText: boolean;
  showBadge: boolean;
  badgeText: string;
  spacing: SectionSpacing;
  desktopColumns: TeamDesktopColumns;
  cornerRadius: TeamCornerRadius;
}) => JSON.stringify({
  title,
  active,
  style,
  members: toTeamPersistMembers(members),
  texts,
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
  desktopColumns,
  cornerRadius,
});

export default function TeamEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: TeamEditPageProps) {
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

  const [title, setTitle] = React.useState('');
  const [active, setActive] = React.useState(true);
  const [style, setStyle] = React.useState<TeamStyle>('grid');
  const {
    state: members,
    set: setMembers,
    undo: undomembers,
    redo: redomembers,
    canUndo: canUndomembers,
    canRedo: canRedomembers,
    reset: resetmembers,
  } = useUndoRedo<TeamEditorMember[]>([], { maxHistory: 15 });
  const [texts, setTexts] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [initialSnapshot, setInitialSnapshot] = React.useState('');

  // Header config state
  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], false);
  const [hideHeader, setHideHeader] = React.useState(false);
  const [showTitle, setShowTitle] = React.useState(true);
  const [subtitle, setSubtitle] = React.useState('');
  const [showSubtitle, setShowSubtitle] = React.useState(true);
  const [headerAlign, setHeaderAlign] = React.useState<TeamHeaderAlign>('left');
  const [titleColorPrimary, setTitleColorPrimary] = React.useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = React.useState(false);
  const [uppercaseText, setUppercaseText] = React.useState(false);
  const [showBadge, setShowBadge] = React.useState(true);
  const [badgeText, setBadgeText] = React.useState('');
  const [spacing, setSpacing] = React.useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [desktopColumns, setDesktopColumns] = React.useState<TeamDesktopColumns>(4);
  const [cornerRadius, setCornerRadius] = React.useState<TeamCornerRadius>('lg');

  const brandMode: TeamBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';

  useEffect(() => {
    if (!component) {return;}

    if (!snapshotComponent && component.type !== 'Team') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const normalizedConfig = normalizeTeamConfig(component.config);

    const editorMembers = toTeamEditorMembers(normalizedConfig.members);
    const nextStyle = normalizeTeamStyle(normalizedConfig.style);
    const nextTexts = normalizedConfig.texts || {};

    setTitle(component.title);
    setActive(component.active);
    setStyle(nextStyle);
    resetmembers(editorMembers);
    setTexts(nextTexts);

    // Load header config with fallback to texts.subtitle for backward compatibility
    const headerConfig = extractSectionHeaderConfig(component.config ?? {});
    const legacySubtitle = typeof nextTexts.subtitle === 'string' ? nextTexts.subtitle : '';
    
    setHideHeader(headerConfig.hideHeader ?? false);
    setShowTitle(headerConfig.showTitle ?? true);
    setSubtitle(headerConfig.subtitle || legacySubtitle);
    setShowSubtitle(headerConfig.showSubtitle ?? true);
    setHeaderAlign((headerConfig.headerAlign ?? 'left') as TeamHeaderAlign);
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    setShowBadge(headerConfig.showBadge ?? true);
    setBadgeText(headerConfig.badgeText ?? '');
    setSpacing(normalizedConfig.spacing ?? DEFAULT_SECTION_SPACING);
    setDesktopColumns(normalizedConfig.desktopColumns ?? 4);
    setCornerRadius(normalizedConfig.cornerRadius ?? 'lg');

    setInitialSnapshot(serializeEditState({
      title: component.title,
      active: component.active,
      style: nextStyle,
      members: editorMembers,
      texts: nextTexts,
      hideHeader: headerConfig.hideHeader ?? false,
      showTitle: headerConfig.showTitle ?? true,
      subtitle: headerConfig.subtitle || legacySubtitle,
      showSubtitle: headerConfig.showSubtitle ?? true,
      headerAlign: (headerConfig.headerAlign ?? 'left') as TeamHeaderAlign,
      titleColorPrimary: headerConfig.titleColorPrimary ?? false,
      subtitleAboveTitle: headerConfig.subtitleAboveTitle ?? false,
      uppercaseText: headerConfig.uppercaseText ?? false,
      showBadge: headerConfig.showBadge ?? true,
      badgeText: headerConfig.badgeText ?? '',
      spacing: normalizedConfig.spacing ?? DEFAULT_SECTION_SPACING,
      desktopColumns: normalizedConfig.desktopColumns ?? 4,
      cornerRadius: normalizedConfig.cornerRadius ?? 'lg',
    }));
  }, [component, id, router]);

  const validation = React.useMemo(() => getTeamValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: brandMode,
  }), [effectiveColors.primary, effectiveColors.secondary, brandMode]);

  const currentSnapshot = React.useMemo(() => serializeEditState({
    title,
    active,
    style,
    members,
    texts,
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
    desktopColumns,
    cornerRadius,
  }), [title, active, style, members, texts, hideHeader, showTitle, subtitle, showSubtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, desktopColumns, cornerRadius]);

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
  const hasChanges = initialSnapshot.length > 0 && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  const saveConfig: TeamConfig = React.useMemo(() => ({
    members: toTeamPersistMembers(members),
    style,
    texts,
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
    desktopColumns,
    cornerRadius,
  }), [members, style, texts, hideHeader, showTitle, subtitle, showSubtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, desktopColumns, cornerRadius]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);

    try {
      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: saveConfig as unknown as Record<string, any>, title });
      } else {
        await updateMutation({
          id: id as Id<'homeComponents'>,
          title,
          active,
          config: saveConfig as unknown as Record<string, unknown>,
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

      const nextSnapshot = serializeEditState({
        title,
        active,
        style,
        members,
        texts,
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
        desktopColumns,
        cornerRadius,
      });

      setInitialSnapshot(nextSnapshot);
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
      toast.success('Đã cập nhật Team');
    } catch (error) {
      toast.error('Lỗi khi cập nhật Team');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (component === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="py-8 text-center text-slate-500">Không tìm thấy component</div>;
  }

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Team</h1>
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
          onExpandedChange={(value) => toggleSection('header', value)}
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <div className="mb-6">
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
                          ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
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

        <TeamForm
          members={members}
          onChange={setMembers}
          secondary={validation.resolvedSecondary}
          defaultExpanded={false}
        />

        <div className="space-y-4">
          {enableTypeOverrides && showCustomBlock && (
            <TypeColorOverrideCard
              title="Màu custom cho Đội ngũ"
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
              title="Font custom cho Đội ngũ"
              enabled={customFontState.enabled}
              fontKey={customFontState.fontKey}
              compact
              toggleLabel="Custom"
              fontLabel="Font"
              onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
              onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
            />
          )}
          <TeamPreview
            members={members}
            brandColor={effectiveColors.primary}
            secondary={effectiveColors.secondary}
            mode={brandMode}
            title={title}
            selectedStyle={style}
            onStyleChange={setStyle}
            texts={texts}
            fontStyle={fontStyle}
            fontClassName="font-active"
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
            spacing={spacing}
            desktopColumns={desktopColumns}
            cornerRadius={cornerRadius}
          />
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => {
            router.push(backHref);
          }}
          submitLabel="Lưu thay đổi"
          active={active}
          onActiveChange={setActive}
        
        undoRedo={{
          canUndo: canUndomembers,
          canRedo: canRedomembers,
          onUndo: undomembers,
          onRedo: redomembers,
        }}
        />
      </form>
    </div>
  );
}
