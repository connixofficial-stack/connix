'use client';

import React, { useMemo, useState } from 'react';
import { Label } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { CareerPreview } from '../../career/_components/CareerPreview';
import {
  createCareerJob,
  DEFAULT_CAREER_CORNER_RADIUS,
  DEFAULT_CAREER_DESKTOP_COLUMNS,
  DEFAULT_CAREER_LOGO_SIZE,
  DEFAULT_CAREER_TEXTS,
  normalizeCareerDesktopColumns,
  normalizeCareerLogoSize,
} from '../../career/_lib/constants';
import { getCareerValidationResult } from '../../career/_lib/colors';
import { normalizeCareerJobs, toCareerJobsForConfig } from '../../career/_lib/normalize';
import { CareerForm } from '../../career/_components/CareerForm';
import type {
  CareerStyle,
  CareerTexts,
  JobPosition,
} from '../../career/_types';

const DEFAULT_CREATE_JOBS: JobPosition[] = [
  createCareerJob({
    id: 'career-job-1',
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Hà Nội',
    type: 'Full-time',
    salary: '15-25 triệu',
    description: '',
  }),
  createCareerJob({
    id: 'career-job-2',
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    salary: '12-20 triệu',
    description: '',
  }),
];

export default function CareerCreatePage() {
  const COMPONENT_TYPE = 'Career';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Tuyển dụng', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const headerState = useSectionHeaderState({
    hideHeader: false,
    showTitle: true,
    showSubtitle: true,
    subtitle: DEFAULT_CAREER_TEXTS.subtitle,
    headerAlign: 'center',
    titleColorPrimary: false,
    subtitleAboveTitle: false,
    uppercaseText: false,
    showBadge: false,
    badgeText: '',
  });
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header', 'display'], true);
  const [careerStyle, setCareerStyle] = useState<CareerStyle>('cards');
  const [jobPositions, setJobPositions] = useState<JobPosition[]>(DEFAULT_CREATE_JOBS);
  const [texts, setTexts] = useState<CareerTexts>({ ...DEFAULT_CAREER_TEXTS, subtitle: '' });
  const [desktopColumns, setDesktopColumns] = useState(DEFAULT_CAREER_DESKTOP_COLUMNS);
  const [cornerRadius, setCornerRadius] = useState(DEFAULT_CAREER_CORNER_RADIUS);
  const [logoSize, setLogoSize] = useState(DEFAULT_CAREER_LOGO_SIZE);

  const normalizedJobs = useMemo(() => normalizeCareerJobs(jobPositions), [jobPositions]);

  useMemo(() => getCareerValidationResult({
    primary,
    secondary,
    mode,
  }), [primary, secondary, mode]);

  const onSubmit = (event: React.FormEvent) => {
    const mergedTexts = { ...texts, subtitle: headerState.subtitle };
    void handleSubmit(event, {
      jobs: normalizedJobs,
      style: careerStyle,
      spacing: headerState.spacing,
      texts: mergedTexts,
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
      desktopColumns,
      cornerRadius,
      noBorderRadius: cornerRadius === 'none',
      noVerticalMargin: headerState.spacing === 'none',
      logoSize,
    });
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
        className="mb-3"
        sectionTitle="Tiêu đề và mô tả"
        titleRequired
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.display}
          onOpenChange={(value) => toggleSection('display', value)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={setCornerRadius}
          spacing={headerState.spacing}
          onSpacingChange={headerState.setSpacing}
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

      <CareerForm
        jobs={toCareerJobsForConfig(normalizedJobs)}
        onJobsChange={setJobPositions}
        texts={texts}
        onTextsChange={setTexts}
      />

      <CareerPreview
        jobs={normalizedJobs}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={careerStyle}
        onStyleChange={setCareerStyle}
        title={title}
        texts={{ ...texts, subtitle: headerState.subtitle }}
        fontStyle={fontStyle}
        fontClassName="font-active"
        spacing={headerState.spacing}
        hideHeader={headerState.hideHeader}
        showTitle={headerState.showTitle}
        showSubtitle={headerState.showSubtitle}
        headerAlign={headerState.headerAlign}
        titleColorPrimary={headerState.titleColorPrimary}
        subtitleAboveTitle={headerState.subtitleAboveTitle}
        uppercaseText={headerState.uppercaseText}
        showBadge={headerState.showBadge}
        badgeText={headerState.badgeText}
        desktopColumns={desktopColumns}
        cornerRadius={cornerRadius}
        logoSize={logoSize}
      />
    </ComponentFormWrapper>
  );
}
