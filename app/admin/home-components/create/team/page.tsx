'use client';

import React from 'react';
import { Label, cn } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { TeamForm } from '../../team/_components/TeamForm';
import { TeamPreview } from '../../team/_components/TeamPreview';
import {
  DEFAULT_TEAM_CONFIG,
  normalizeTeamStyle,
  toTeamEditorMembers,
  toTeamPersistMembers,
} from '../../team/_lib/constants';
import { getTeamValidationResult } from '../../team/_lib/colors';
import type {
  TeamBrandMode,
  TeamConfig,
  TeamCornerRadius,
  TeamDesktopColumns,
  TeamEditorMember,
  TeamStyle,
  TeamHeaderAlign,
} from '../../team/_types';

const createDefaultMembers = (): TeamEditorMember[] => {
  const defaults = toTeamEditorMembers(DEFAULT_TEAM_CONFIG.members);

  if (defaults.length >= 2) {
    return [
      {
        ...defaults[0],
        name: 'Nguyễn Văn A',
        role: 'CEO & Founder',
      },
      {
        ...defaults[1],
        name: 'Trần Thị B',
        role: 'CTO',
      },
    ];
  }

  return [
    {
      id: 1,
      name: 'Nguyễn Văn A',
      role: 'CEO & Founder',
      avatar: '',
      bio: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      phone: '',
      zalo: '',
      tiktok: '',
      youtube: '',
      email: '',
    },
    {
      id: 2,
      name: 'Trần Thị B',
      role: 'CTO',
      avatar: '',
      bio: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      phone: '',
      zalo: '',
      tiktok: '',
      youtube: '',
      email: '',
    },
  ];
};

export default function TeamCreatePage() {
  const COMPONENT_TYPE = 'Team';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Đội ngũ của chúng tôi', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [members, setMembers] = React.useState<TeamEditorMember[]>(createDefaultMembers);
  const [style, setStyle] = React.useState<TeamStyle>(normalizeTeamStyle(DEFAULT_TEAM_CONFIG.style));
  const [texts] = React.useState<Record<string, string>>(DEFAULT_TEAM_CONFIG.texts || {});

  // Header config state
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header', 'display'], true);
  const [hideHeader, setHideHeader] = React.useState(DEFAULT_TEAM_CONFIG.hideHeader ?? false);
  const [showTitle, setShowTitle] = React.useState(DEFAULT_TEAM_CONFIG.showTitle ?? true);
  const [subtitle, setSubtitle] = React.useState(DEFAULT_TEAM_CONFIG.subtitle ?? '');
  const [showSubtitle, setShowSubtitle] = React.useState(DEFAULT_TEAM_CONFIG.showSubtitle ?? true);
  const [headerAlign, setHeaderAlign] = React.useState<TeamHeaderAlign>(DEFAULT_TEAM_CONFIG.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = React.useState(DEFAULT_TEAM_CONFIG.titleColorPrimary ?? false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = React.useState(DEFAULT_TEAM_CONFIG.subtitleAboveTitle ?? false);
  const [uppercaseText, setUppercaseText] = React.useState(DEFAULT_TEAM_CONFIG.uppercaseText ?? false);
  const [showBadge, setShowBadge] = React.useState(DEFAULT_TEAM_CONFIG.showBadge ?? true);
  const [badgeText, setBadgeText] = React.useState(DEFAULT_TEAM_CONFIG.badgeText ?? '');
  const [spacing, setSpacing] = React.useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [desktopColumns, setDesktopColumns] = React.useState<TeamDesktopColumns>(DEFAULT_TEAM_CONFIG.desktopColumns ?? 4);
  const [cornerRadius, setCornerRadius] = React.useState<TeamCornerRadius>(DEFAULT_TEAM_CONFIG.cornerRadius ?? 'lg');

  const brandMode: TeamBrandMode = mode === 'single' ? 'single' : 'dual';

  const validation = React.useMemo(() => getTeamValidationResult({
    primary,
    secondary,
    mode: brandMode,
  }), [primary, secondary, brandMode]);

  const onSubmit = (event: React.FormEvent) => {
    const configWithHeader: TeamConfig = {
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
        defaultExpanded={true}
      />

      <TeamPreview
        members={members}
        brandColor={primary}
        secondary={secondary}
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
    </ComponentFormWrapper>
  );
}
