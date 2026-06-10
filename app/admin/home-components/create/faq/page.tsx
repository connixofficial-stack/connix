'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { FaqForm } from '../../faq/_components/FaqForm';
import { FaqPreview } from '../../faq/_components/FaqPreview';
import { DEFAULT_FAQ_CONFIG } from '../../faq/_lib/constants';
import {
  getFaqAccessibilityScore,
  getFaqColors,
  getFaqHarmonyStatus,
  resolveFaqSecondary,
} from '../../faq/_lib/colors';
import type { FaqConfig, FaqItem, FaqStyle } from '../../faq/_types';
import { Label, cn } from '../../../components/ui';

const INITIAL_FAQ_ITEMS: FaqItem[] = [
  { id: 1, question: 'Làm thế nào để đặt hàng?', answer: 'Bạn có thể đặt hàng trực tuyến qua website hoặc gọi hotline.' },
  { id: 2, question: 'Chính sách đổi trả ra sao?', answer: 'Chúng tôi hỗ trợ đổi trả trong vòng 30 ngày.' },
];

export default function FaqCreatePage() {
  const COMPONENT_TYPE = 'FAQ';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Câu hỏi thường gặp', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const brandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [faqItems, setFaqItems] = useState<FaqItem[]>(INITIAL_FAQ_ITEMS);
  const [style, setStyle] = useState<FaqStyle>('wine-list');
  const [faqConfig, setFaqConfig] = useState<FaqConfig>(DEFAULT_FAQ_CONFIG);
  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], true);
  const [faqExpanded, setFaqExpanded] = useState(true);
  
  const headerState = useSectionHeaderState({
    hideHeader: DEFAULT_FAQ_CONFIG.hideHeader,
    showTitle: DEFAULT_FAQ_CONFIG.showTitle,
    showSubtitle: DEFAULT_FAQ_CONFIG.showSubtitle,
    subtitle: DEFAULT_FAQ_CONFIG.subtitle,
    headerAlign: DEFAULT_FAQ_CONFIG.headerAlign,
    titleColorPrimary: DEFAULT_FAQ_CONFIG.titleColorPrimary,
    subtitleAboveTitle: DEFAULT_FAQ_CONFIG.subtitleAboveTitle,
    uppercaseText: DEFAULT_FAQ_CONFIG.uppercaseText,
    showBadge: DEFAULT_FAQ_CONFIG.showBadge,
    badgeText: DEFAULT_FAQ_CONFIG.badgeText,
  });
  const tokens = getFaqColors({
    primary,
    secondary,
    mode: brandMode,
    style,
  });
  const resolvedSecondary = resolveFaqSecondary(primary, secondary, brandMode);
  const harmonyStatus = brandMode === 'dual' ? getFaqHarmonyStatus(primary, resolvedSecondary) : null;
  const accessibility = getFaqAccessibilityScore([
    { background: tokens.sectionBg, text: tokens.heading, fontSize: 32, fontWeight: 700, label: 'heading' },
    { background: tokens.panelBg, text: tokens.panelTitleText, fontSize: 18, fontWeight: 600, label: 'panelTitle' },
    { background: tokens.panelBgMuted, text: tokens.questionText, fontSize: 16, fontWeight: 500, label: 'question' },
    { background: tokens.panelBg, text: tokens.body, fontSize: 16, fontWeight: 500, label: 'body' },
    { background: tokens.ctaBg, text: tokens.ctaText, fontSize: 14, fontWeight: 700, label: 'cta' },
  ]);

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: faqItems.map((item) => ({ answer: item.answer, question: item.question })),
      style,
      ...faqConfig,
      // Header fields
      hideHeader: headerState.hideHeader,
      showTitle: headerState.showTitle,
      showSubtitle: headerState.showSubtitle,
      subtitle: headerState.subtitle,
      headerAlign: headerState.headerAlign,
      titleColorPrimary: headerState.titleColorPrimary,
      subtitleAboveTitle: headerState.subtitleAboveTitle,
      uppercaseText: headerState.uppercaseText,
      showBadge: headerState.showBadge,
      badgeText: headerState.badgeText,
      spacing: faqConfig.spacing ?? DEFAULT_FAQ_CONFIG.spacing,
      cornerRadius: faqConfig.cornerRadius ?? faqConfig.rounded ?? DEFAULT_FAQ_CONFIG.cornerRadius ?? DEFAULT_FAQ_CONFIG.rounded,
      rounded: faqConfig.rounded ?? DEFAULT_FAQ_CONFIG.rounded,
      desktopColumns: faqConfig.desktopColumns ?? DEFAULT_FAQ_CONFIG.desktopColumns,
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
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.display}
          onOpenChange={(open) => toggleSection('display', open)}
          cornerRadius={faqConfig.cornerRadius ?? faqConfig.rounded ?? 'none'}
          onCornerRadiusChange={(cornerRadius) => setFaqConfig((current) => ({ ...current, cornerRadius, rounded: cornerRadius }))}
          spacing={faqConfig.spacing ?? 'normal'}
          onSpacingChange={(spacing) => setFaqConfig((current) => ({ ...current, spacing }))}
        >
            {style === 'cards' ? (
              <div className="space-y-2">
                <Label>Số cột desktop</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[3, 4].map((option) => {
                    const selected = (faqConfig.desktopColumns ?? 4) === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFaqConfig((current) => ({ ...current, desktopColumns: option as 3 | 4 }))}
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
                <p className="text-xs text-slate-500">4 cột: tablet/mobile 2. 3 cột: tablet 3, mobile 1.</p>
              </div>
            ) : null}
        </HomeComponentDisplaySettingsSection>
      </div>

      <FaqForm
        faqItems={faqItems}
        setFaqItems={setFaqItems}
        faqStyle={style}
        brandColor={primary}
        faqConfig={faqConfig}
        setFaqConfig={setFaqConfig}
        expanded={faqExpanded}
        onExpandedChange={setFaqExpanded}
      />

      {(brandMode === 'dual' && harmonyStatus?.isTooSimilar) || accessibility.failing.length > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              {brandMode === 'dual' && harmonyStatus?.isTooSimilar && (
                <p>Hai màu đang khá giống nhau (deltaE: {harmonyStatus.deltaE}). Màu phụ có thể bị tự điều chỉnh khi lưu.</p>
              )}
              {accessibility.failing.length > 0 && (
                <p>Một số cặp màu trong FAQ có độ tương phản thấp (minLc: {accessibility.minLc.toFixed(1)}).</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <FaqPreview
        items={faqItems}
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        config={faqConfig}
        title={title}
        fontStyle={fontStyle}
        fontClassName="font-active"
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
        spacing={faqConfig.spacing}
      />
    </ComponentFormWrapper>
  );
}
