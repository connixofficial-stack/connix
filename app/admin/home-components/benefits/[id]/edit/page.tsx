'use client';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { BenefitsForm } from '../../_components/BenefitsForm';
import { BenefitsPreview } from '../../_components/BenefitsPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_BENEFITS_CONFIG, DEFAULT_BENEFITS_HARMONY, normalizeBenefitsCornerRadius, normalizeBenefitsSpacing } from '../../_lib/constants';
import {
  buildBenefitsWarningMessages,
  getBenefitsValidationResult,
  normalizeBenefitsHarmony,
  normalizeBenefitsStyle,
} from '../../_lib/colors';
import type {
  BenefitItem,
  BenefitPersistItem,
  BenefitsBrandMode,
  BenefitsConfig,
  BenefitsEditorState,
  BenefitsHeaderAlign,
} from '../../_types';

const buildUiId = (item: BenefitPersistItem, idx: number) => {
  const seed = `${item.icon}|${item.title}|${item.description}|${idx}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return `benefit-${Math.abs(hash).toString(36)}-${idx}`;
};

const toUiItem = (item: BenefitPersistItem, idx: number): BenefitItem => ({
  description: item.description || '',
  icon: item.icon || 'Check',
  id: buildUiId(item, idx),
  title: item.title || '',
});

const toUiItems = (items: BenefitPersistItem[]): BenefitItem[] => {
  const seen = new Map<string, number>();

  return items.map((item, idx) => {
    const base = buildUiId(item, idx);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    return {
      ...toUiItem(item, idx),
      id: count === 0 ? base : `${base}-${count}`,
    };
  });
};

const toPersistItem = (item: BenefitItem): BenefitPersistItem => ({
  description: item.description,
  icon: item.icon,
  title: item.title,
});

const toEditorState = (config: Partial<BenefitsConfig> | undefined): BenefitsEditorState => {
  const source = config ?? {};

  const items = Array.isArray(source.items) && source.items.length > 0
    ? toUiItems(source.items)
    : toUiItems(DEFAULT_BENEFITS_CONFIG.items);

  return {
    buttonLink: typeof source.buttonLink === 'string' ? source.buttonLink : (DEFAULT_BENEFITS_CONFIG.buttonLink ?? ''),
    buttonText: typeof source.buttonText === 'string' ? source.buttonText : (DEFAULT_BENEFITS_CONFIG.buttonText ?? ''),
    gridColumnsDesktop: typeof source.gridColumnsDesktop === 'number'
      ? (source.gridColumnsDesktop === 3 ? 3 : source.gridColumnsDesktop === 5 ? 5 : 4)
      : (DEFAULT_BENEFITS_CONFIG.gridColumnsDesktop ?? 4),
    gridColumnsMobile: typeof source.gridColumnsMobile === 'number'
      ? (source.gridColumnsMobile === 1 ? 1 : 2)
      : (DEFAULT_BENEFITS_CONFIG.gridColumnsMobile ?? 2),
    headerAlign: source.headerAlign === 'center' || source.headerAlign === 'right'
      ? source.headerAlign
      : (DEFAULT_BENEFITS_CONFIG.headerAlign ?? 'left'),
    highlightIndex: typeof source.highlightIndex === 'number' ? source.highlightIndex : (DEFAULT_BENEFITS_CONFIG.highlightIndex ?? 2),
    cornerRadius: normalizeBenefitsCornerRadius(source.cornerRadius, source.noBorderRadius),
    harmony: normalizeBenefitsHarmony(source.harmony ?? DEFAULT_BENEFITS_HARMONY),
    heading: typeof source.heading === 'string' ? source.heading : (DEFAULT_BENEFITS_CONFIG.heading ?? ''),
    items,
    showDecorativeVisuals: typeof source.showDecorativeVisuals === 'boolean'
      ? source.showDecorativeVisuals
      : (DEFAULT_BENEFITS_CONFIG.showDecorativeVisuals ?? true),
    showItemNumbers: typeof source.showItemNumbers === 'boolean'
      ? source.showItemNumbers
      : (DEFAULT_BENEFITS_CONFIG.showItemNumbers ?? true),
    style: normalizeBenefitsStyle(source.style),
    subHeading: typeof source.subHeading === 'string' ? source.subHeading : (DEFAULT_BENEFITS_CONFIG.subHeading ?? ''),
    visualImage: typeof source.visualImage === 'string' ? source.visualImage : (DEFAULT_BENEFITS_CONFIG.visualImage ?? ''),
    // Shared header config
    hideHeader: typeof source.hideHeader === 'boolean' ? source.hideHeader : (DEFAULT_BENEFITS_CONFIG.hideHeader ?? false),
    showTitle: typeof source.showTitle === 'boolean' ? source.showTitle : (DEFAULT_BENEFITS_CONFIG.showTitle ?? true),
    showSubtitle: typeof source.showSubtitle === 'boolean' ? source.showSubtitle : (DEFAULT_BENEFITS_CONFIG.showSubtitle ?? true),
    subtitle: typeof source.subtitle === 'string' ? source.subtitle : (DEFAULT_BENEFITS_CONFIG.subtitle ?? ''),
    titleColorPrimary: typeof source.titleColorPrimary === 'boolean' ? source.titleColorPrimary : (DEFAULT_BENEFITS_CONFIG.titleColorPrimary ?? false),
    subtitleAboveTitle: typeof source.subtitleAboveTitle === 'boolean' ? source.subtitleAboveTitle : (DEFAULT_BENEFITS_CONFIG.subtitleAboveTitle ?? false),
    uppercaseText: typeof source.uppercaseText === 'boolean' ? source.uppercaseText : (DEFAULT_BENEFITS_CONFIG.uppercaseText ?? false),
    showBadge: typeof source.showBadge === 'boolean' ? source.showBadge : (DEFAULT_BENEFITS_CONFIG.showBadge ?? true),
    badgeText: typeof source.badgeText === 'string' ? source.badgeText : (DEFAULT_BENEFITS_CONFIG.badgeText ?? ''),
  };
};

const toPersistConfig = (state: BenefitsEditorState): BenefitsConfig => ({
  buttonLink: state.buttonLink,
  buttonText: state.buttonText,
  gridColumnsDesktop: state.gridColumnsDesktop,
  gridColumnsMobile: state.gridColumnsMobile,
  headerAlign: state.headerAlign,
  highlightIndex: state.highlightIndex,
  cornerRadius: state.cornerRadius,
  harmony: state.harmony,
  heading: state.heading,
  items: state.items.map(toPersistItem),
  showDecorativeVisuals: state.showDecorativeVisuals,
  showItemNumbers: state.showItemNumbers,
  style: normalizeBenefitsStyle(state.style),
  subHeading: state.subHeading,
  visualImage: state.visualImage,
  // Shared header config
  hideHeader: state.hideHeader,
  showTitle: state.showTitle,
  showSubtitle: state.showSubtitle,
  subtitle: state.subtitle,
  titleColorPrimary: state.titleColorPrimary,
  subtitleAboveTitle: state.subtitleAboveTitle,
  uppercaseText: state.uppercaseText,
  showBadge: state.showBadge,
  badgeText: state.badgeText,
});

const buildPreviewConfig = ({
  state,
  header,
}: {
  state: BenefitsEditorState;
  header: Pick<
    BenefitsConfig,
    'hideHeader' | 'showTitle' | 'subtitle' | 'showSubtitle' | 'headerAlign' | 'titleColorPrimary' | 'subtitleAboveTitle' | 'uppercaseText' | 'showBadge' | 'badgeText' | 'spacing'
  >;
}): BenefitsConfig => ({
  ...toPersistConfig(state),
  ...header,
});

const createSnapshot = ({
  title,
  active,
  state,
}: {
  title: string;
  active: boolean;
  state: BenefitsEditorState & { spacing?: SectionSpacing };
}) => JSON.stringify({
  active,
  config: {
    buttonLink: state.buttonLink,
    buttonText: state.buttonText,
    gridColumnsDesktop: state.gridColumnsDesktop,
    gridColumnsMobile: state.gridColumnsMobile,
    headerAlign: state.headerAlign,
    highlightIndex: state.highlightIndex,
    cornerRadius: state.cornerRadius,
    harmony: state.harmony,
    heading: state.heading,
    items: state.items.map((item) => ({
      description: item.description,
      icon: item.icon,
      title: item.title,
    })),
    showDecorativeVisuals: state.showDecorativeVisuals,
    showItemNumbers: state.showItemNumbers,
    style: normalizeBenefitsStyle(state.style),
    subHeading: state.subHeading,
    visualImage: state.visualImage,
    // Shared header config
    hideHeader: state.hideHeader,
    showTitle: state.showTitle,
    showSubtitle: state.showSubtitle,
    subtitle: state.subtitle,
    titleColorPrimary: state.titleColorPrimary,
    subtitleAboveTitle: state.subtitleAboveTitle,
    uppercaseText: state.uppercaseText,
    showBadge: state.showBadge,
    badgeText: state.badgeText,
    spacing: state.spacing ?? DEFAULT_SECTION_SPACING,
  },
  title,
});

const COMPONENT_TYPE = 'Benefits';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type BenefitsEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function BenefitsEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: BenefitsEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);

  const brandMode: BenefitsBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [editorState, setEditorState] = useState<BenefitsEditorState>(() => toEditorState(undefined));
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Header config state
  const [expandedSections, setExpandedSections] = useState({ header: false });
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitle, setShowTitle] = useState(DEFAULT_BENEFITS_CONFIG.showTitle ?? true);
  const [subtitle, setSubtitle] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_BENEFITS_CONFIG.showSubtitle ?? true);
  const [headerAlign, setHeaderAlign] = useState<BenefitsHeaderAlign>(DEFAULT_BENEFITS_CONFIG.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);

  useEffect(() => {
    if (component === undefined || component === null) {return;}

    if (!snapshotComponent && component.type !== 'Benefits') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const state = toEditorState(component.config as Partial<BenefitsConfig> | undefined);
    setEditorState(state);
    
    // Load header config
    const headerConfig = extractSectionHeaderConfig(component.config ?? {});
    setHideHeader(headerConfig.hideHeader ?? false);
    setShowTitle(headerConfig.showTitle ?? true);
    setSubtitle(headerConfig.subtitle ?? '');
    setShowSubtitle(headerConfig.showSubtitle ?? true);
    setHeaderAlign((headerConfig.headerAlign ?? 'left') as BenefitsHeaderAlign);
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    setShowBadge(headerConfig.showBadge ?? true);
    setBadgeText(headerConfig.badgeText ?? '');
    const loadedSpacing = normalizeBenefitsSpacing((component.config as Partial<BenefitsConfig> | undefined)?.spacing, (component.config as Partial<BenefitsConfig> | undefined)?.noVerticalMargin);
    setSpacing(loadedSpacing);

    setInitialSnapshot(createSnapshot({
      active: component.active,
      state: {
        ...state,
        spacing: loadedSpacing,
      },
      title: component.title,
    }));
  }, [component, id, router, snapshotComponent]);

  const currentSnapshot = useMemo(
    () => createSnapshot({ 
      title, 
      active, 
      state: {
        ...editorState,
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
      }
    }),
    [title, active, editorState, hideHeader, showTitle, subtitle, showSubtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing],
  );

  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
  const resolvedInitialSecondary = resolveSecondaryByMode(initialCustom.mode, initialCustom.primary, initialCustom.secondary);
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
  const hasChanges = initialSnapshot !== '' && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  const warningMessages = useMemo(() => {
    const validation = getBenefitsValidationResult({
      harmony: editorState.harmony,
      mode: brandMode,
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      style: editorState.style,
    });

    return buildBenefitsWarningMessages({ mode: brandMode, validation });
  }, [effectiveColors, brandMode, editorState.harmony, editorState.style]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        ...toPersistConfig(editorState),
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
      };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: payload, title });
      } else {
        await updateMutation({
          active,
          config: payload,
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

      toast.success('Đã cập nhật Lợi ích');
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Lợi ích</h1>
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
          onExpandedChange={(value) => setExpandedSections({ header: value })}
          className="mb-3"
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <BenefitsForm
          state={editorState}
          onChange={(updater) => { setEditorState((prev) => updater(prev)); }}
          mode={brandMode}
          spacing={spacing}
          onSpacingChange={setSpacing}
          defaultExpanded={false}
          className="mb-4"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div />
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Lợi ích"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => setCustomState((prev) => {
                  if (next === prev.mode) {
                    return prev;
                  }
                  if (next === 'single') {
                    return {
                      ...prev,
                      mode: 'single',
                      secondary: prev.primary,
                    };
                  }
                  const nextSecondary = prev.mode === 'single'
                    ? getSuggestedSecondary(prev.primary)
                    : prev.secondary;
                  return {
                    ...prev,
                    mode: 'dual',
                    secondary: nextSecondary,
                  };
                })}
                onPrimaryChange={(value) => setCustomState((prev) => ({
                  ...prev,
                  primary: value,
                  secondary: prev.mode === 'single' ? value : prev.secondary,
                }))}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {enableTypeOverrides && showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Lợi ích"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <BenefitsPreview
              items={editorState.items}
              title={title}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={brandMode}
              selectedStyle={editorState.style}
              onStyleChange={(style) => {
                setEditorState((prev) => ({
                  ...prev,
                  style,
                }));
              }}
              config={buildPreviewConfig({
                state: editorState,
                header: {
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
                },
              })}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        {brandMode === 'dual' && warningMessages.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="space-y-1">
                {warningMessages.map((message, idx) => (
                  <p key={`benefits-edit-warning-${idx}`}>{message}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => { router.push(backHref); }}
          submitLabel="Lưu thay đổi"
        active={active}
        onActiveChange={setActive}
        />
      </form>
    </div>
  );
}
