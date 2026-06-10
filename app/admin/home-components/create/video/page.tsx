'use client';

import React from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { VideoPreview } from '../../video/_components/VideoPreview';
import {
  DEFAULT_VIDEO_STYLE,
  normalizeVideoConfig,
  normalizeVideoCornerRadius,
  normalizeVideoPlayButtonSize,
  normalizeVideoStyle,
} from '../../video/_lib/constants';
import { VideoForm } from '../../video/_components/VideoForm';
import type { VideoConfig } from '../../video/_types';

export default function VideoCreatePage() {
  const COMPONENT_TYPE = 'Video';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Video Giới thiệu', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const headerState = useSectionHeaderState({
    hideHeader: false,
    showTitle: true,
    showSubtitle: true,
    subtitle: '',
    headerAlign: 'left',
    titleColorPrimary: false,
    subtitleAboveTitle: false,
    uppercaseText: false,
    showBadge: true,
    badgeText: '',
  });

  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header', 'display'], true);

  const [config, setConfig] = React.useState<VideoConfig>(() => normalizeVideoConfig({
    autoplay: false,
    badge: '',
    buttonLink: '',
    buttonText: '',
    description: 'Xem video để hiểu rõ hơn về những gì chúng tôi mang lại',
    heading: 'Khám phá sản phẩm của chúng tôi',
    loop: false,
    muted: true,
    style: DEFAULT_VIDEO_STYLE,
    thumbnailUrl: '',
    videoUrl: '',
  }));

  const selectedStyle = normalizeVideoStyle(config.style);
  const cornerRadius = normalizeVideoCornerRadius(config.cornerRadius);
  const playButtonSize = normalizeVideoPlayButtonSize(config.playButtonSize);

  const onSubmit = (e: React.FormEvent) => {
    const normalized = normalizeVideoConfig({ 
      ...config, 
      style: selectedStyle,
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
      spacing: headerState.spacing,
      noVerticalMargin: headerState.spacing === 'none',
      noBorderRadius: cornerRadius === 'none',
    });
    void handleSubmit(e, normalized);
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
        expanded={openSections.header}
        onExpandedChange={(value) => toggleSection('header', value)}
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.display}
          onOpenChange={(value) => toggleSection('display', value)}
          spacing={headerState.spacing}
          onSpacingChange={headerState.setSpacing}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={(value) => setConfig((prev) => ({ ...prev, cornerRadius: value }))}
        >
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Kích thước logo play</span>
            <select
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={playButtonSize}
              onChange={(event) => setConfig((prev) => ({ ...prev, playButtonSize: normalizeVideoPlayButtonSize(event.target.value) }))}
            >
              <option value="small">Nhỏ</option>
              <option value="medium">Vừa</option>
              <option value="large">Lớn</option>
            </select>
          </label>
        </HomeComponentDisplaySettingsSection>
      </div>

      <VideoForm
        config={config}
        onChange={setConfig}
        selectedStyle={selectedStyle}
        defaultExpanded={true}
      />

      <VideoPreview
        config={config}
        brandColor={primary}
        secondary={secondary}
        selectedStyle={selectedStyle}
        onStyleChange={(style) => setConfig((prev) => ({ ...prev, style }))}
        mode={mode}
        fontStyle={fontStyle}
        fontClassName="font-active"
        title={title}
        subtitle={headerState.subtitle}
        hideHeader={headerState.hideHeader}
        showTitle={headerState.showTitle}
        showSubtitle={headerState.showSubtitle}
        headerAlign={headerState.headerAlign}
        titleColorPrimary={headerState.titleColorPrimary}
        subtitleAboveTitle={headerState.subtitleAboveTitle}
        uppercaseText={headerState.uppercaseText}
        showBadge={headerState.showBadge}
        badgeText={headerState.badgeText}
        spacing={headerState.spacing}
      />
    </ComponentFormWrapper>
  );
}
