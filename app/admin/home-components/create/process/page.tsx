'use client';

import React from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { ProcessForm } from '../../process/_components/ProcessForm';
import { ProcessPreview } from '../../process/_components/ProcessPreview';
import {
  createProcessFormStep,
  normalizeProcessRenderSteps,
  serializeProcessFormSteps,
  type ProcessFormStep,
} from '../../process/_lib/normalize';
import {
  DEFAULT_PROCESS_CORNER_RADIUS,
  type ProcessBrandMode,
  type ProcessCornerRadius,
  type ProcessStyle,
} from '../../process/_types';
import { Label, cn } from '@/app/admin/components/ui';

const DEFAULT_CREATE_STEPS: ProcessFormStep[] = [
  createProcessFormStep({
    description: 'Lắng nghe và tìm hiểu nhu cầu của khách hàng một cách chi tiết.',
    icon: '1',
    title: 'Tiếp nhận yêu cầu',
  }),
  createProcessFormStep({
    description: 'Đưa ra giải pháp phù hợp nhất với ngân sách và mục tiêu.',
    icon: '2',
    title: 'Phân tích & Tư vấn',
  }),
  createProcessFormStep({
    description: 'Thực hiện dự án theo đúng tiến độ và chất lượng cam kết.',
    icon: '3',
    title: 'Triển khai',
  }),
  createProcessFormStep({
    description: 'Bàn giao sản phẩm và hỗ trợ sau bán hàng tận tâm.',
    icon: '4',
    title: 'Bàn giao & Hỗ trợ',
  }),
];

export default function ProcessCreatePage() {
  const COMPONENT_TYPE = 'Process';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Quy trình làm việc', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const headerState = useSectionHeaderState({
    hideHeader: false,
    showTitle: true,
    showSubtitle: true,
    subtitle: '',
    headerAlign: 'center',
    titleColorPrimary: false,
    subtitleAboveTitle: false,
    uppercaseText: false,
    showBadge: true,
    badgeText: '',
  });

  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], true);

  const [steps, setSteps] = React.useState<ProcessFormStep[]>(DEFAULT_CREATE_STEPS);
  const [style, setStyle] = React.useState<ProcessStyle>('horizontal');
  const [desktopColumns, setDesktopColumns] = React.useState<3 | 4>(4);
  const [cornerRadius, setCornerRadius] = React.useState<ProcessCornerRadius>(DEFAULT_PROCESS_CORNER_RADIUS);
  const [circularCtaText, setCircularCtaText] = React.useState('');
  const [circularCtaLink, setCircularCtaLink] = React.useState('');

  const normalizedPreviewSteps = React.useMemo(
    () => normalizeProcessRenderSteps(serializeProcessFormSteps(steps)),
    [steps],
  );

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      steps: serializeProcessFormSteps(steps),
      style,
      desktopColumns,
      cornerRadius,
      noBorderRadius: cornerRadius === 'none',
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
      circularCtaText,
      circularCtaLink,
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
        onExpandedChange={(open) => toggleSection('header', open)}
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.display}
          onOpenChange={(open) => toggleSection('display', open)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={setCornerRadius}
          spacing={headerState.spacing}
          onSpacingChange={headerState.setSpacing}
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
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
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

      <ProcessForm
        steps={steps}
        onChange={setSteps}
        secondary={secondary}
        style={style}
        circularCtaText={circularCtaText}
        circularCtaLink={circularCtaLink}
        onChangeCircularCtaText={setCircularCtaText}
        onChangeCircularCtaLink={setCircularCtaLink}
      />

      <ProcessPreview
        steps={normalizedPreviewSteps}
        brandColor={primary}
        secondary={secondary}
        mode={mode as ProcessBrandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        title={title}
        hideHeader={headerState.hideHeader}
        showTitle={headerState.showTitle}
        showSubtitle={headerState.showSubtitle}
        subtitle={headerState.subtitle}
        headerAlign={headerState.headerAlign}
        titleColorPrimary={headerState.titleColorPrimary}
        subtitleAboveTitle={headerState.subtitleAboveTitle}
        uppercaseText={headerState.uppercaseText}
        showBadge={headerState.showBadge}
        badgeText={headerState.badgeText}
        fontStyle={fontStyle}
        fontClassName="font-active"
        desktopColumns={desktopColumns}
        spacing={headerState.spacing}
        cornerRadius={cornerRadius}
        circularCtaText={circularCtaText}
        circularCtaLink={circularCtaLink}
      />
    </ComponentFormWrapper>
  );
}
