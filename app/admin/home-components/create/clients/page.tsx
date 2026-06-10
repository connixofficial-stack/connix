'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { ClientsForm } from '../../clients/_components/ClientsForm';
import { ClientsPreview } from '../../clients/_components/ClientsPreview';
import {
  CLIENTS_DEMO_ITEMS_BY_STYLE,
  DEFAULT_CLIENTS_CONFIG,
} from '../../clients/_lib/constants';
import { toClientEditorItems, toPersistClientItems } from '../../clients/_lib/items';
import type {
  ClientEditorItem,
  ClientsConfig,
  ClientsCornerRadius,
  ClientsHeaderAlign,
  ClientsStyle,
} from '../../clients/_types';
import {
  normalizeClientsCornerRadius,
} from '../../clients/_types';
import { AiDemoClientsImport } from '../../product-list/_components/AiDemoProductsImport';

const toEditorItems = (items: ClientsConfig['items']): ClientEditorItem[] => (
  toClientEditorItems(items)
);

const toPersistItems = (items: ClientEditorItem[]): ClientsConfig['items'] => (
  toPersistClientItems(items)
);

export default function ClientsCreatePage() {
  const COMPONENT_TYPE = 'Clients';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Banner ảnh thương hiệu', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [clientItems, setClientItems] = useState<ClientEditorItem[]>(toEditorItems(DEFAULT_CLIENTS_CONFIG.items));
  const [style, setStyle] = useState<ClientsStyle>(DEFAULT_CLIENTS_CONFIG.style);

  // Header config state
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header'], true);
  const [hideHeader, setHideHeader] = useState(DEFAULT_CLIENTS_CONFIG.hideHeader ?? false);
  const [showTitle, setShowTitle] = useState(DEFAULT_CLIENTS_CONFIG.showTitle ?? true);
  const [subtitle, setSubtitle] = useState(DEFAULT_CLIENTS_CONFIG.subtitle ?? '');
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_CLIENTS_CONFIG.showSubtitle ?? true);
  const [headerAlign, setHeaderAlign] = useState<ClientsHeaderAlign>(DEFAULT_CLIENTS_CONFIG.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(DEFAULT_CLIENTS_CONFIG.titleColorPrimary ?? false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(DEFAULT_CLIENTS_CONFIG.subtitleAboveTitle ?? false);
  const [uppercaseText, setUppercaseText] = useState(DEFAULT_CLIENTS_CONFIG.uppercaseText ?? false);
  const [showBadge, setShowBadge] = useState(DEFAULT_CLIENTS_CONFIG.showBadge ?? true);
  const [badgeText, setBadgeText] = useState(DEFAULT_CLIENTS_CONFIG.badgeText ?? '');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_CLIENTS_CONFIG.noVerticalMargin === true ? 'none' : (DEFAULT_CLIENTS_CONFIG.spacing ?? DEFAULT_SECTION_SPACING));
  const [cornerRadius, setCornerRadius] = useState<ClientsCornerRadius>(normalizeClientsCornerRadius(DEFAULT_CLIENTS_CONFIG.cornerRadius, DEFAULT_CLIENTS_CONFIG.noBorderRadius));

  const handleUseDemoImages = () => {
    setClientItems(CLIENTS_DEMO_ITEMS_BY_STYLE[style].map((item) => ({ ...item })));
  };
  const handleImportAiClients = (items: ClientEditorItem[]) => {
    setClientItems(items.map((item, index) => ({
      ...item,
      id: `client-ai-${Date.now()}-${index}`,
      inputMode: 'url',
    })));
  };

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: toPersistItems(clientItems),
      style,
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
      noVerticalMargin: spacing === 'none',
      cornerRadius,
      noBorderRadius: cornerRadius === 'none',
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

      <ClientsForm
        items={clientItems}
        setItems={setClientItems}
        selectedStyle={style}
        spacing={spacing}
        setSpacing={setSpacing}
        cornerRadius={cornerRadius}
        setCornerRadius={setCornerRadius}
        maxItems={style === 'layout08' ? 8 : 4}
        action={(
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleUseDemoImages}>
              Dùng ảnh demo
            </Button>
            <AiDemoClientsImport buttonClassName="h-10" onApply={handleImportAiClients} />
          </div>
        )}
      />

      <ClientsPreview
        items={toPersistItems(clientItems)}
        title={title}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={style}
        onStyleChange={setStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
        hideHeader={hideHeader}
        showTitle={showTitle}
        subtitle={subtitle}
        showSubtitle={showSubtitle}
        headerAlign={headerAlign}
        titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle}
        uppercaseText={uppercaseText}
        showBadge={showBadge}
        badgeText={badgeText}
        spacing={spacing}
        cornerRadius={cornerRadius}
      />
    </ComponentFormWrapper>
  );
}
