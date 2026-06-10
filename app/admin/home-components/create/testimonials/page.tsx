'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { TestimonialsPreview } from '../../testimonials/_components/TestimonialsPreview';
import { TestimonialsForm } from '../../testimonials/_components/TestimonialsForm';
import {
  buildTestimonialsWarningMessages,
  getTestimonialsValidationResult,
  resolveSecondaryForMode,
} from '../../testimonials/_lib/colors';
import {
  createTestimonialsItem,
  toTestimonialsPersistItem,
  type TestimonialsBrandMode,
  type TestimonialsCornerRadius,
  type TestimonialsDesktopColumns,
  type TestimonialsItem,
  type TestimonialsStyle,
} from '../../testimonials/_types';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { Label, cn } from '../../../components/ui';

export default function TestimonialsCreatePage() {
  const COMPONENT_TYPE = 'Testimonials';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Đánh giá / Review', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const brandMode: TestimonialsBrandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  // Header state
  const {
    hideHeader,
    setHideHeader,
    showTitle: showTitleHeader,
    setShowTitle: setShowTitleHeader,
    showSubtitle,
    setShowSubtitle,
    subtitle,
    setSubtitle,
    headerAlign,
    setHeaderAlign,
    titleColorPrimary,
    setTitleColorPrimary,
    subtitleAboveTitle,
    setSubtitleAboveTitle,
    uppercaseText,
    setUppercaseText,
    showBadge,
    setShowBadge,
    badgeText,
    setBadgeText,
    spacing,
  } = useSectionHeaderState();

  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], true);

  const [items, setItems] = useState<TestimonialsItem[]>([
    {
      ...createTestimonialsItem(1),
      company: 'ABC Corp',
      content: 'Dịch vụ tuyệt vời! Chúng tôi rất hài lòng với chất lượng sản phẩm và dịch vụ hỗ trợ.',
      name: 'Nguyễn Văn A',
      role: 'CEO',
    },
    {
      ...createTestimonialsItem(2),
      avatarIcon: 'Award',
      avatarType: 'icon',
      company: 'XYZ Ltd',
      content: 'Chất lượng vượt mong đợi. Đội ngũ chuyên nghiệp và tận tâm.',
      name: 'Trần Thị B',
      role: 'Manager',
    },
  ]);

  const [style, setStyle] = useState<TestimonialsStyle>('cards');
  const [desktopColumns, setDesktopColumns] = useState<TestimonialsDesktopColumns>(3);
  const [splitBackgroundImage, setSplitBackgroundImage] = useState('/demo/brand-banners/banner-1.webp');
  const [splitBackgroundOverlayOpacity, setSplitBackgroundOverlayOpacity] = useState(62);
  const [displaySpacing, setDisplaySpacing] = useState<SectionSpacing>(spacing);
  const [cornerRadius, setCornerRadius] = useState<TestimonialsCornerRadius>('lg');

  const resolvedSecondary = useMemo(
    () => resolveSecondaryForMode(primary, secondary, brandMode),
    [primary, secondary, brandMode],
  );

  const validation = useMemo(() => getTestimonialsValidationResult({
    primary,
    secondary,
    mode: brandMode,
    style,
  }), [primary, secondary, brandMode, style]);

  const warningMessages = useMemo(() => buildTestimonialsWarningMessages({ mode: brandMode, validation }), [brandMode, validation]);

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      items: items.map(toTestimonialsPersistItem),
      style,
      desktopColumns,
      splitBackgroundImage,
      splitBackgroundOverlayOpacity,
      // Header fields
      hideHeader,
      showTitle: showTitleHeader,
      showSubtitle,
      subtitle,
      headerAlign,
      titleColorPrimary,
      subtitleAboveTitle,
      uppercaseText,
      showBadge,
      badgeText,
      spacing: displaySpacing,
      cornerRadius,
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
        hideHeader={hideHeader}
        title={title}
        showTitle={showTitleHeader}
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
        onShowTitleChange={setShowTitleHeader}
        onSubtitleChange={setSubtitle}
        onShowSubtitleChange={setShowSubtitle}
        onHeaderAlignChange={setHeaderAlign}
        onTitleColorPrimaryChange={setTitleColorPrimary}
        onSubtitleAboveTitleChange={setSubtitleAboveTitle}
        onUppercaseTextChange={setUppercaseText}
        onShowBadgeChange={setShowBadge}
        onBadgeTextChange={setBadgeText}
        expanded={openSections.header}
        onExpandedChange={(open) => toggleSection('header', open)}
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.display}
          onOpenChange={(open) => toggleSection('display', open)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={setCornerRadius}
          spacing={displaySpacing}
          onSpacingChange={setDisplaySpacing}
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
              <p className="text-[11px] text-slate-500">3 cột: tablet 3, mobile 1. 4 cột: tablet/mobile 2.</p>
            </div>
        </HomeComponentDisplaySettingsSection>
      </div>

      <TestimonialsForm
        items={items}
        setItems={setItems}
        defaultExpanded={true}
        desktopColumns={desktopColumns}
        selectedStyle={style}
        splitBackgroundImage={splitBackgroundImage}
        onSplitBackgroundImageChange={setSplitBackgroundImage}
        splitBackgroundOverlayOpacity={splitBackgroundOverlayOpacity}
        onSplitBackgroundOverlayOpacityChange={setSplitBackgroundOverlayOpacity}
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

      <TestimonialsPreview
        items={items}
        brandColor={primary}
        secondary={resolvedSecondary}
        mode={brandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
        title={title}
        subtitle={subtitle}
        hideHeader={hideHeader}
        showTitle={showTitleHeader}
        showSubtitle={showSubtitle}
        headerAlign={headerAlign}
        titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle}
        uppercaseText={uppercaseText}
        showBadge={showBadge}
        badgeText={badgeText}
        spacing={displaySpacing}
        cornerRadius={cornerRadius}
        desktopColumns={desktopColumns}
        splitBackgroundImage={splitBackgroundImage}
        splitBackgroundOverlayOpacity={splitBackgroundOverlayOpacity}
      />
    </ComponentFormWrapper>
  );
}
