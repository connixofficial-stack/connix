'use client';

import React, { useState } from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import {
  getCaseStudyValidationResult,
} from '../../case-study/_lib/colors';
import type {
  CaseStudyBrandMode,
  CaseStudyCornerRadius,
  CaseStudyDesktopColumns,
  CaseStudyProject,
  CaseStudyStyle,
} from '../../case-study/_types';
import {
  DEFAULT_CASE_STUDY_CONFIG,
  DEFAULT_CASE_STUDY_CORNER_RADIUS,
  DEFAULT_CASE_STUDY_DESKTOP_COLUMNS,
} from '../../case-study/_types';
import { CaseStudyPreview } from '../../case-study/_components/CaseStudyPreview';
import { CaseStudyForm } from '../../case-study/_components/CaseStudyForm';

export default function CaseStudyCreatePage() {
  const COMPONENT_TYPE = 'CaseStudy';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Dự án thực tế', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const brandMode: CaseStudyBrandMode = mode === 'single' ? 'single' : 'dual';
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const headerState = useSectionHeaderState(DEFAULT_CASE_STUDY_CONFIG);
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header'], true);
  const [caseStudyStyle, setCaseStudyStyle] = useState<CaseStudyStyle>('grid');
  const [cornerRadius, setCornerRadius] = useState<CaseStudyCornerRadius>(DEFAULT_CASE_STUDY_CORNER_RADIUS);
  const [desktopColumns, setDesktopColumns] = useState<CaseStudyDesktopColumns>(DEFAULT_CASE_STUDY_DESKTOP_COLUMNS);
  
  const [projects, setProjects] = useState<CaseStudyProject[]>([
    { category: 'Website', description: 'Thiết kế và phát triển website doanh nghiệp', id: 'project-1', image: '', link: '', title: 'Dự án Website ABC Corp' },
    { category: 'Mobile App', description: 'Ứng dụng đặt hàng cho chuỗi F&B', id: 'project-2', image: '', link: '', title: 'Ứng dụng Mobile XYZ' }
  ]);

  const onSubmit = (e: React.FormEvent) => {
    const { harmonyStatus, accessibility } = getCaseStudyValidationResult({
      primary,
      secondary,
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

    void handleSubmit(e, {
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
      projects: projects.map(p => ({ category: p.category, description: p.description, image: p.image, link: p.link, title: p.title })),
      style: caseStudyStyle,
      cornerRadius,
      desktopColumns,
      spacing: headerState.spacing,
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
      />

      <CaseStudyPreview
        projects={projects.map((p, idx) => ({
          category: p.category,
          description: p.description,
          id: idx + 1,
          image: p.image,
          link: p.link,
          title: p.title
        }))}
        brandColor={primary}
        secondary={secondary}
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
    </ComponentFormWrapper>
  );
}
