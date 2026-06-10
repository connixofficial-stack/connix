'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { PartnersPreview } from '../../partners/_components/PartnersPreview';
import { DEFAULT_PARTNERS_CONFIG, DEFAULT_PARTNERS_CORNER_RADIUS, DEFAULT_PARTNERS_DISPLAY_MODE, DEFAULT_PARTNERS_LOGO_COLOR_INTENSITY, DEFAULT_PARTNERS_LOGO_SIZE, DEFAULT_PARTNERS_SHOW_BORDER, DEFAULT_PARTNERS_SPACING, type PartnersCornerRadius, type PartnersDisplayMode, type PartnersLogoColorIntensity, type PartnersLogoSize, type PartnersSpacing, type PartnersStyle, type PartnersLogoColorMode } from '../../partners/_types';
import type { ImageItem } from '../../../components/MultiImageUploader';
import { PartnersForm } from '../../partners/_components/PartnersForm';
import { AiDemoPartnersImport } from '../../product-list/_components/AiDemoProductsImport';

interface PartnerItem extends ImageItem { id: string | number; url: string; link: string; name?: string; }

export default function PartnersCreatePage() {
  const COMPONENT_TYPE = 'Partners';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Đối tác / Logos', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const headerState = useSectionHeaderState(DEFAULT_PARTNERS_CONFIG);
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], true);

  const [partnersItems, setPartnersItems] = useState<PartnerItem[]>([
    { id: 'item-1', link: '', name: '', url: '' },
    { id: 'item-2', link: '', name: '', url: '' }
  ]);
  const [partnersStyle, setPartnersStyle] = useState<PartnersStyle>('grid');
  const [displayMode, setDisplayMode] = useState<PartnersDisplayMode>(DEFAULT_PARTNERS_DISPLAY_MODE);
  const [cornerRadius, setCornerRadius] = useState<PartnersCornerRadius>(DEFAULT_PARTNERS_CORNER_RADIUS);
  const [logoSize, setLogoSize] = useState<PartnersLogoSize>(DEFAULT_PARTNERS_LOGO_SIZE);
  const [showBorder, setShowBorder] = useState(DEFAULT_PARTNERS_SHOW_BORDER);
  const [spacing, setSpacing] = useState<PartnersSpacing>(DEFAULT_PARTNERS_SPACING);
  const [logoColorMode, setLogoColorMode] = useState<PartnersLogoColorMode>('grayscale');
  const [logoColorIntensity, setLogoColorIntensity] = useState<PartnersLogoColorIntensity>(DEFAULT_PARTNERS_LOGO_COLOR_INTENSITY);

  const DEMO_PARTNERS_ITEMS: PartnerItem[] = [
    { id: 'demo-1', link: '', name: 'Apex Digital', url: '/demo/partners/partner-1.png' },
    { id: 'demo-2', link: '', name: 'NexaCore', url: '/demo/partners/partner-2.png' },
    { id: 'demo-3', link: '', name: 'InfiniLoop', url: '/demo/partners/partner-3.png' },
    { id: 'demo-4', link: '', name: 'Summit Labs', url: '/demo/partners/partner-4.png' },
    { id: 'demo-5', link: '', name: 'GreenLeaf', url: '/demo/partners/partner-5.png' },
    { id: 'demo-6', link: '', name: 'Globex Corp', url: '/demo/partners/partner-6.png' },
  ];

  const handleUseDemoImages = () => {
    setPartnersItems(DEMO_PARTNERS_ITEMS);
  };

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      displayMode,
      cornerRadius,
      logoSize,
      showBorder,
      spacing,
      logoColorMode,
      logoColorIntensity,
      items: partnersItems.map((item) => ({ link: item.link, name: item.name, url: item.url, storageId: item.storageId })),
      style: partnersStyle,
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
        expanded={headerOpenSections.header}
        onExpandedChange={(open) => toggleHeaderSection('header', open)}
        className="mb-3"
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <PartnersForm
        items={partnersItems}
        setItems={setPartnersItems}
        cornerRadius={cornerRadius}
        setCornerRadius={setCornerRadius}
        logoSize={logoSize}
        setLogoSize={setLogoSize}
        showBorder={showBorder}
        setShowBorder={setShowBorder}
        showBorderControl={false}
        spacing={spacing}
        setSpacing={setSpacing}
        selectedStyle={partnersStyle}
        logoColorMode={logoColorMode}
        setLogoColorMode={setLogoColorMode}
        logoColorIntensity={logoColorIntensity}
        setLogoColorIntensity={setLogoColorIntensity}
        className="mb-3"
        actions={(
          <>
            <Button type="button" variant="outline" size="sm" onClick={handleUseDemoImages}>
              Dùng ảnh demo
            </Button>
            <AiDemoPartnersImport buttonClassName="h-8" onApply={setPartnersItems} />
          </>
        )}
      />

      <PartnersPreview
        items={partnersItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={partnersStyle}
        onStyleChange={setPartnersStyle}
        title={title}
        subheading={headerState.subtitle}
        align={headerState.headerAlign}
        displayMode={displayMode}
        cornerRadius={cornerRadius}
        logoSize={logoSize}
        showBorder={showBorder}
        spacing={spacing}
        logoColorMode={logoColorMode}
        logoColorIntensity={logoColorIntensity}
        onDisplayModeChange={setDisplayMode}
        fontStyle={fontStyle}
        fontClassName="font-active"
        hideHeader={headerState.hideHeader}
        showTitle={headerState.showTitle}
        showSubtitle={headerState.showSubtitle}
        headerAlign={headerState.headerAlign}
        titleColorPrimary={headerState.titleColorPrimary}
        subtitleAboveTitle={headerState.subtitleAboveTitle}
        uppercaseText={headerState.uppercaseText}
        showBadge={headerState.showBadge}
        badgeText={headerState.badgeText}
      />
    </ComponentFormWrapper>
  );
}
