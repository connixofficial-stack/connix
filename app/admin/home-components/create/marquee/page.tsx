'use client';

import React, { useState } from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { MarqueePreview } from '../../marquee/_components/MarqueePreview';
import { MarqueeForm } from '../../marquee/_components/MarqueeForm';
import { MarqueeDisplayConfig } from '../../marquee/_components/MarqueeDisplayConfig';
import {
  DEFAULT_MARQUEE_CONFIG,
} from '../../marquee/_lib/constants';
import {
  createMarqueeItem, toMarqueePersistItem,
  type MarqueeBrandMode, type MarqueeCornerRadius, type MarqueeDirection, type MarqueeItem,
  type MarqueeScale, type MarqueeSpeed, type MarqueeStyle,
} from '../../marquee/_types';

export default function MarqueeCreatePage() {
  const COMPONENT_TYPE = 'Marquee';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Chạy chữ / Marquee', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const brandMode: MarqueeBrandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const {
    hideHeader, setHideHeader, showTitle: showTitleHeader, setShowTitle: setShowTitleHeader,
    showSubtitle, setShowSubtitle, subtitle, setSubtitle, headerAlign, setHeaderAlign,
    titleColorPrimary, setTitleColorPrimary, subtitleAboveTitle, setSubtitleAboveTitle,
    uppercaseText, setUppercaseText, showBadge, setShowBadge, badgeText, setBadgeText, spacing, setSpacing,
  } = useSectionHeaderState({ hideHeader: true, showBadge: true });
  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], true);

  const [items, setItems] = useState<MarqueeItem[]>([
    { ...createMarqueeItem(1), text: 'Chào mừng đến với cửa hàng', separator: '✦', textStyle: 'normal' },
    { ...createMarqueeItem(2), text: 'Miễn phí vận chuyển đơn từ 500K', separator: '★', textStyle: 'normal' },
    { ...createMarqueeItem(3), text: 'Giảm 20% cho khách hàng mới', separator: '♦', textStyle: 'bold' },
  ]);
  const [style, setStyle] = useState<MarqueeStyle>('ribbon');
  const [direction, setDirection] = useState<MarqueeDirection>('left');
  const [speed, setSpeed] = useState<MarqueeSpeed>('normal');
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [scale, setScale] = useState<MarqueeScale>(2);
  const [uppercase, setUppercase] = useState(false);
  const [cornerRadius, setCornerRadius] = useState<MarqueeCornerRadius>(DEFAULT_MARQUEE_CONFIG.cornerRadius ?? 'none');

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      items: items.map(toMarqueePersistItem), style, direction, speed, pauseOnHover, scale, uppercase,
      hideHeader, showTitle: showTitleHeader, showSubtitle, subtitle, headerAlign,
      titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText,
      spacing, cornerRadius,
    });
  };

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE} title={title} setTitle={setTitle} active={active} setActive={setActive}
      onSubmit={onSubmit} isSubmitting={isSubmitting} customState={customState} showCustomBlock={showCustomBlock}
      setCustomState={setCustomState} systemColors={systemColors} customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock} setCustomFontState={setCustomFontState} skipTitleInput={true}
    >
      <HeaderConfigSection
        hideHeader={hideHeader} title={title} showTitle={showTitleHeader} subtitle={subtitle}
        showSubtitle={showSubtitle} headerAlign={headerAlign} titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText}
        onHideHeaderChange={setHideHeader} onTitleChange={setTitle} onShowTitleChange={setShowTitleHeader}
        onSubtitleChange={setSubtitle} onShowSubtitleChange={setShowSubtitle} onHeaderAlignChange={setHeaderAlign}
        onTitleColorPrimaryChange={setTitleColorPrimary} onSubtitleAboveTitleChange={setSubtitleAboveTitle}
        onUppercaseTextChange={setUppercaseText} onShowBadgeChange={setShowBadge}
        onBadgeTextChange={(value) => { setBadgeText(value); if (value.trim()) { setShowBadge(true); } }}
        expanded={openSections.header} onExpandedChange={(open) => toggleSection('header', open)}
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.display}
          onOpenChange={(open) => toggleSection('display', open)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={(value) => setCornerRadius(value as MarqueeCornerRadius)}
          spacing={spacing}
          onSpacingChange={setSpacing}
        />
      </div>

      <MarqueeForm items={items} setItems={setItems} defaultExpanded={true} />

      <MarqueeDisplayConfig
        direction={direction} setDirection={setDirection}
        speed={speed} setSpeed={setSpeed}
        pauseOnHover={pauseOnHover} setPauseOnHover={setPauseOnHover}
        scale={scale} setScale={setScale}
        uppercase={uppercase} setUppercase={setUppercase}
      />

      <MarqueePreview
        items={items} brandColor={primary} secondary={secondary} mode={brandMode} selectedStyle={style}
        onStyleChange={setStyle} direction={direction} speed={speed} pauseOnHover={pauseOnHover} scale={scale} uppercase={uppercase}
        fontStyle={fontStyle} fontClassName="font-active"
        title={title} subtitle={subtitle} hideHeader={hideHeader} showTitle={showTitleHeader}
        showSubtitle={showSubtitle} headerAlign={headerAlign} titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText}
        spacing={spacing}
        cornerRadius={cornerRadius}
      />
    </ComponentFormWrapper>
  );
}
