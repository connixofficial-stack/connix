'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { BenefitsForm } from '../../benefits/_components/BenefitsForm';
import { BenefitsPreview } from '../../benefits/_components/BenefitsPreview';
import { DEFAULT_BENEFITS_EDITOR_STATE, DEFAULT_BENEFITS_HARMONY } from '../../benefits/_lib/constants';
import {
  buildBenefitsWarningMessages,
  getBenefitsValidationResult,
  normalizeBenefitsStyle,
} from '../../benefits/_lib/colors';
import type {
  BenefitItem,
  BenefitPersistItem,
  BenefitsBrandMode,
  BenefitsEditorState,
  BenefitsConfig,
  BenefitsHeaderAlign,
} from '../../benefits/_types';

const createUiId = (item: BenefitPersistItem, idx: number) => {
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
  id: createUiId(item, idx),
  title: item.title || '',
});

const toUiItems = (items: BenefitPersistItem[]): BenefitItem[] => {
  const seen = new Map<string, number>();

  return items.map((item, idx) => {
    const base = createUiId(item, idx);
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

const normalizeCreateState = (): BenefitsEditorState => ({
  ...DEFAULT_BENEFITS_EDITOR_STATE,
  harmony: DEFAULT_BENEFITS_HARMONY,
  items: toUiItems(DEFAULT_BENEFITS_EDITOR_STATE.items.map(toPersistItem)),
});

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

export default function BenefitsCreatePage() {
  const COMPONENT_TYPE = 'Benefits';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Lợi ích', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const brandMode: BenefitsBrandMode = mode === 'single' ? 'single' : 'dual';

  const [editorState, setEditorState] = useState<BenefitsEditorState>(normalizeCreateState);
  
  // Header config state
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header'], true);
  const [hideHeader, setHideHeader] = useState(DEFAULT_BENEFITS_EDITOR_STATE.hideHeader ?? false);
  const [showTitle, setShowTitle] = useState(DEFAULT_BENEFITS_EDITOR_STATE.showTitle ?? true);
  const [subtitle, setSubtitle] = useState(DEFAULT_BENEFITS_EDITOR_STATE.subtitle ?? '');
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_BENEFITS_EDITOR_STATE.showSubtitle ?? true);
  const [headerAlign, setHeaderAlign] = useState<BenefitsHeaderAlign>(DEFAULT_BENEFITS_EDITOR_STATE.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(DEFAULT_BENEFITS_EDITOR_STATE.titleColorPrimary ?? false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(DEFAULT_BENEFITS_EDITOR_STATE.subtitleAboveTitle ?? false);
  const [uppercaseText, setUppercaseText] = useState(DEFAULT_BENEFITS_EDITOR_STATE.uppercaseText ?? false);
  const [showBadge, setShowBadge] = useState(DEFAULT_BENEFITS_EDITOR_STATE.showBadge ?? true);
  const [badgeText, setBadgeText] = useState(DEFAULT_BENEFITS_EDITOR_STATE.badgeText ?? '');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);

  const validation = useMemo(() => getBenefitsValidationResult({
    primary,
    secondary,
    mode: brandMode,
    harmony: editorState.harmony,
    style: editorState.style,
  }), [primary, secondary, brandMode, editorState.harmony, editorState.style]);

  const warningMessages = useMemo(() => buildBenefitsWarningMessages({ mode: brandMode, validation }), [brandMode, validation]);

  const onSubmit = (event: React.FormEvent) => {
    const configWithHeader = {
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
    void handleSubmit(event, configWithHeader);
  };

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
      skipTitleInput={true}
    >
      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />

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
        className="mb-3"
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <BenefitsForm
        state={editorState}
        onChange={setEditorState}
        mode={brandMode}
        spacing={spacing}
        onSpacingChange={setSpacing}
        className="mb-4"
      />

      {warningMessages.length > 0 && (
        <div className="mb-6 space-y-2">
          {warningMessages.map((message) => (
            <div
              key={message}
              className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p>{message}</p>
            </div>
          ))}
        </div>
      )}

      <BenefitsPreview
        items={editorState.items}
        title={title}
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
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
