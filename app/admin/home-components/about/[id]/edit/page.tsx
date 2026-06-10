'use client';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { AboutForm } from '../../_components/AboutForm';
import { AboutPreview } from '../../_components/AboutPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  createAboutEditorFeature,
  DEFAULT_ABOUT_EDITOR_STATE,
  normalizeAboutCornerRadius,
  normalizeAboutEditorFeatures,
  normalizeAboutEditorStats,
  normalizeAboutImages,
  normalizeAboutStyle,
  toAboutPersistFeatures,
  toAboutPersistStats,
} from '../../_lib/constants';
import {
  getAboutValidationResult,
} from '../../_lib/colors';
import type { AboutCornerRadius, AboutEditorState, AboutStyle } from '../../_types';

const COMPONENT_TYPE = 'About';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type AboutEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

const buildAboutSnapshot = (payload: {
  title: string;
  active: boolean;
  state: AboutEditorState;
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
}) => JSON.stringify({
  title: payload.title,
  active: payload.active,
  subHeading: payload.state.subHeading,
  heading: payload.state.heading,
  highlightText: payload.state.highlightText,
  description: payload.state.description,
  phone: payload.state.phone,
  image: payload.state.image,
  images: payload.state.images,
  imageCaption: payload.state.imageCaption,
  buttonText: payload.state.buttonText,
  buttonLink: payload.state.buttonLink,
  features: toAboutPersistFeatures(payload.state.features),
  stats: toAboutPersistStats(payload.state.stats),
  style: payload.state.style,
  hideHeader: payload.hideHeader,
  showTitle: payload.showTitle,
  subtitle: payload.subtitle,
  showSubtitle: payload.showSubtitle,
  headerAlign: payload.headerAlign,
  titleColorPrimary: payload.titleColorPrimary,
  subtitleAboveTitle: payload.subtitleAboveTitle,
  uppercaseText: payload.uppercaseText,
  showBadge: payload.showBadge,
  badgeText: payload.badgeText,
  spacing: payload.spacing,
  noVerticalMargin: payload.spacing === 'none',
  cornerRadius: payload.state.cornerRadius,
  noBorderRadius: payload.state.cornerRadius === 'none',
});

const normalizeEditorState = (rawConfig: Record<string, unknown>): AboutEditorState => {
  const fallbackImage = typeof rawConfig.image === 'string' ? rawConfig.image : '';
  const normalizedImages = normalizeAboutImages(rawConfig.images, fallbackImage);
  const normalizedFeatures = normalizeAboutEditorFeatures(rawConfig.features);
  const normalizedStats = normalizeAboutEditorStats(rawConfig.stats);

  return {
    subHeading: typeof rawConfig.subHeading === 'string' ? rawConfig.subHeading : DEFAULT_ABOUT_EDITOR_STATE.subHeading,
    heading: typeof rawConfig.heading === 'string' ? rawConfig.heading : DEFAULT_ABOUT_EDITOR_STATE.heading,
    highlightText: typeof rawConfig.highlightText === 'string' ? rawConfig.highlightText : DEFAULT_ABOUT_EDITOR_STATE.highlightText,
    description: typeof rawConfig.description === 'string' ? rawConfig.description : DEFAULT_ABOUT_EDITOR_STATE.description,
    phone: typeof rawConfig.phone === 'string' ? rawConfig.phone : DEFAULT_ABOUT_EDITOR_STATE.phone,
    image: normalizedImages[0] ?? fallbackImage,
    images: normalizedImages,
    imageCaption: typeof rawConfig.imageCaption === 'string' ? rawConfig.imageCaption : '',
    buttonText: typeof rawConfig.buttonText === 'string' ? rawConfig.buttonText : DEFAULT_ABOUT_EDITOR_STATE.buttonText,
    buttonLink: typeof rawConfig.buttonLink === 'string' ? rawConfig.buttonLink : DEFAULT_ABOUT_EDITOR_STATE.buttonLink,
    features: normalizedFeatures.length > 0
      ? normalizedFeatures
      : DEFAULT_ABOUT_EDITOR_STATE.features.map((feature) => createAboutEditorFeature(feature)),
    stats: normalizedStats.length > 0 ? normalizedStats : DEFAULT_ABOUT_EDITOR_STATE.stats,
    style: normalizeAboutStyle(rawConfig.style),
    cornerRadius: normalizeAboutCornerRadius(rawConfig.cornerRadius, rawConfig.noBorderRadius),
    // Shared header config
    hideHeader: typeof rawConfig.hideHeader === 'boolean' ? rawConfig.hideHeader : DEFAULT_ABOUT_EDITOR_STATE.hideHeader,
    showTitle: typeof rawConfig.showTitle === 'boolean' ? rawConfig.showTitle : DEFAULT_ABOUT_EDITOR_STATE.showTitle,
    subtitle: typeof rawConfig.subtitle === 'string' ? rawConfig.subtitle : DEFAULT_ABOUT_EDITOR_STATE.subtitle,
    showSubtitle: typeof rawConfig.showSubtitle === 'boolean' ? rawConfig.showSubtitle : DEFAULT_ABOUT_EDITOR_STATE.showSubtitle,
    headerAlign: (rawConfig.headerAlign === 'left' || rawConfig.headerAlign === 'center' || rawConfig.headerAlign === 'right')
      ? rawConfig.headerAlign
      : DEFAULT_ABOUT_EDITOR_STATE.headerAlign,
    titleColorPrimary: typeof rawConfig.titleColorPrimary === 'boolean' ? rawConfig.titleColorPrimary : DEFAULT_ABOUT_EDITOR_STATE.titleColorPrimary,
    subtitleAboveTitle: typeof rawConfig.subtitleAboveTitle === 'boolean' ? rawConfig.subtitleAboveTitle : DEFAULT_ABOUT_EDITOR_STATE.subtitleAboveTitle,
    uppercaseText: typeof rawConfig.uppercaseText === 'boolean' ? rawConfig.uppercaseText : DEFAULT_ABOUT_EDITOR_STATE.uppercaseText,
    showBadge: typeof rawConfig.showBadge === 'boolean' ? rawConfig.showBadge : DEFAULT_ABOUT_EDITOR_STATE.showBadge,
    badgeText: typeof rawConfig.badgeText === 'string' ? rawConfig.badgeText : DEFAULT_ABOUT_EDITOR_STATE.badgeText,
  };
};

export default function AboutEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: AboutEditPageProps) {
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
  const [state, setState] = useState<AboutEditorState>(DEFAULT_ABOUT_EDITOR_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [subtitle, setSubtitle] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);

  useEffect(() => {
    if (!component) {return;}

    if (!snapshotComponent && component.type !== 'About') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const rawConfig = (component.config ?? {}) as Record<string, unknown>;
    const nextState = normalizeEditorState(rawConfig);
    const headerConfig = extractSectionHeaderConfig(rawConfig);
    const resolvedSpacing = rawConfig.noVerticalMargin === true
      ? 'none'
      : normalizeSectionSpacing(headerConfig.spacing ?? DEFAULT_SECTION_SPACING);

    setTitle(component.title);
    setActive(component.active);
    setState(nextState);

    setHideHeader(headerConfig.hideHeader ?? false);
    setShowTitle(headerConfig.showTitle ?? true);
    setSubtitle(headerConfig.subtitle ?? '');
    setShowSubtitle(headerConfig.showSubtitle ?? true);
    setHeaderAlign(headerConfig.headerAlign ?? 'left');
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    setShowBadge(headerConfig.showBadge ?? true);
    setBadgeText(headerConfig.badgeText ?? '');
    setSpacing(resolvedSpacing);

    setInitialSnapshot(buildAboutSnapshot({
      title: component.title,
      active: component.active,
      state: nextState,
      hideHeader: headerConfig.hideHeader ?? false,
      showTitle: headerConfig.showTitle ?? true,
      subtitle: headerConfig.subtitle ?? '',
      showSubtitle: headerConfig.showSubtitle ?? true,
      headerAlign: headerConfig.headerAlign ?? 'left',
      titleColorPrimary: headerConfig.titleColorPrimary ?? false,
      subtitleAboveTitle: headerConfig.subtitleAboveTitle ?? false,
      uppercaseText: headerConfig.uppercaseText ?? false,
      showBadge: headerConfig.showBadge ?? true,
      badgeText: headerConfig.badgeText ?? '',
      spacing: resolvedSpacing,
    }));
  }, [component, id, router, snapshotComponent]);

  const currentSnapshot = buildAboutSnapshot({ 
    title, 
    active, 
    state,
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

  const validation = useMemo(
    () => getAboutValidationResult({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: effectiveColors.mode,
      style: state.style,
    }),
    [effectiveColors.primary, effectiveColors.secondary, effectiveColors.mode, state.style],
  );

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const normalizedStyle = normalizeAboutStyle(state.style) as AboutStyle;

      const nextConfig = {
          subHeading: state.subHeading,
          heading: state.heading,
          highlightText: state.highlightText,
          description: state.description,
          phone: state.phone,
          image: state.image,
          images: state.images,
          imageCaption: state.imageCaption,
          buttonText: state.buttonText,
          buttonLink: state.buttonLink,
          features: toAboutPersistFeatures(state.features),
          stats: toAboutPersistStats(state.stats),
          style: normalizedStyle,
          cornerRadius: state.cornerRadius,
          noBorderRadius: state.cornerRadius === 'none',
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
        };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig, title });
      } else {
        await updateMutation({
          id: id as Id<'homeComponents'>,
          title,
          active,
          config: nextConfig,
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

      setInitialSnapshot(buildAboutSnapshot({ 
        title, 
        active, 
        state: { ...state, style: normalizedStyle },
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
      toast.success('Đã cập nhật About');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa About</h1>
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
          expanded={headerOpenSections.header}
          onExpandedChange={(open) => toggleHeaderSection('header', open)}
          className="mb-3"
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />


        <AboutForm
          state={state}
          previewStyle={state.style}
          onChange={setState}
          spacing={spacing}
          onSpacingChange={setSpacing}
          cornerRadius={state.cornerRadius ?? 'lg'}
          onCornerRadiusChange={(cornerRadius: AboutCornerRadius) => {
            setState((prev) => ({ ...prev, cornerRadius }));
          }}
          defaultExpanded={false}
        />

        <div className="space-y-4">
          {enableTypeOverrides && showCustomBlock && (
            <TypeColorOverrideCard
              title="Màu custom cho Về chúng tôi"
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
              title="Font custom cho Về chúng tôi"
              enabled={customFontState.enabled}
              fontKey={customFontState.fontKey}
              compact
              toggleLabel="Custom"
              fontLabel="Font"
              onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
              onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
            />
          )}
          <AboutPreview
            config={{
              subHeading: state.subHeading,
              heading: state.heading,
              highlightText: state.highlightText,
              description: state.description,
              phone: state.phone,
              image: state.image,
              images: state.images,
              imageCaption: state.imageCaption,
              buttonText: state.buttonText,
              buttonLink: state.buttonLink,
              features: toAboutPersistFeatures(state.features),
              stats: toAboutPersistStats(state.stats),
              style: state.style,
              cornerRadius: state.cornerRadius,
              noBorderRadius: state.cornerRadius === 'none',
              noVerticalMargin: spacing === 'none',
            }}
            brandColor={validation.tokens.primary}
            secondary={validation.tokens.secondary}
            mode={effectiveColors.mode}
            selectedStyle={state.style}
            onStyleChange={(style) => {
              setState((prev) => ({ ...prev, style }));
            }}
            fontStyle={fontStyle}
            fontClassName="font-active"
            title={title}
            hideHeader={hideHeader}
            showTitle={showTitle}
            subtitle={subtitle}
            showSubtitle={showSubtitle}
            headerAlign={headerAlign}
            titleColorPrimary={titleColorPrimary}
            subtitleAboveTitle={subtitleAboveTitle}
            uppercaseText={uppercaseText}
            showBadge={showBadge}
            badgeText={badgeText}
            spacing={spacing}
            cornerRadius={state.cornerRadius ?? 'lg'}
          />
        </div>

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
