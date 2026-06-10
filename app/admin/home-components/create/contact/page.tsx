'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { ContactPreview } from '../../contact/_components/ContactPreview';
import {
  buildDefaultContactItemsFromSettings,
  buildDefaultContactSocialsFromSettings,
  DEFAULT_CONTACT_CONFIG,
} from '../../contact/_lib/constants';
import { getContactValidationResult } from '../../contact/_lib/colors';
import { normalizeContactConfig, toContactConfigPayload } from '../../contact/_lib/normalize';
import type { ContactConfigState } from '../../contact/_types';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';
import { ConfigEditor } from '../../contact/_components/ConfigEditor';

export default function ContactCreatePage() {
  const COMPONENT_TYPE = 'Contact';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Liên hệ', COMPONENT_TYPE);
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

  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], true);
  const [displayExpanded, setDisplayExpanded] = useState(true);
  const [contactDataExpanded, setContactDataExpanded] = useState(true);
  const [formExpanded, setFormExpanded] = useState(true);
  const [socialExpanded, setSocialExpanded] = useState(true);
  const [labelsExpanded, setLabelsExpanded] = useState(true);

  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const socialSettings = useQuery(api.settings.listByGroup, { group: 'social' });
  const mapData = useMemo(() => getContactMapDataFromSettings(contactSettings ?? []), [contactSettings]);
  const seededRef = useRef(false);
  const seedConfig = useMemo(() => normalizeContactConfig({
    ...DEFAULT_CONTACT_CONFIG,
    contactItems: buildDefaultContactItemsFromSettings(contactSettings ?? []),
    socialLinks: buildDefaultContactSocialsFromSettings(contactSettings ?? [], socialSettings ?? []),
  }), [contactSettings, socialSettings]);
  const [config, setConfig] = useState<ContactConfigState>(() => normalizeContactConfig({
    ...DEFAULT_CONTACT_CONFIG,
    contactItems: buildDefaultContactItemsFromSettings([]),
    socialLinks: buildDefaultContactSocialsFromSettings([], []),
  }));

  useEffect(() => {
    if (seededRef.current) {return;}
    if (contactSettings === undefined || socialSettings === undefined) {return;}
    setConfig(seedConfig);
    seededRef.current = true;
  }, [contactSettings, seedConfig, socialSettings]);

  const _normalizedConfig = useMemo(() => normalizeContactConfig(config), [config]);
  const previewConfig = useMemo(() => normalizeContactConfig({
    ...config,
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
  }), [config, headerState.badgeText, headerState.headerAlign, headerState.hideHeader, headerState.showBadge, headerState.showSubtitle, headerState.showTitle, headerState.subtitle, headerState.subtitleAboveTitle, headerState.titleColorPrimary, headerState.uppercaseText]);
  const style = previewConfig.style;

  useMemo(() => getContactValidationResult({
    primary,
    secondary,
    mode,
  }), [primary, secondary, mode]);

  const onSubmit = (event: React.FormEvent) => {
    const normalizedConfig = normalizeContactConfig({
      ...config,
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
    });
    void handleSubmit(event, toContactConfigPayload(normalizedConfig));
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
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <ConfigEditor
        value={config}
        onChange={setConfig}
        title="Cấu hình liên hệ"
        displayExpanded={displayExpanded}
        contactDataExpanded={contactDataExpanded}
        formExpanded={formExpanded}
        socialExpanded={socialExpanded}
        labelsExpanded={labelsExpanded}
        onDisplayExpandedChange={setDisplayExpanded}
        onContactDataExpandedChange={setContactDataExpanded}
        onFormExpandedChange={setFormExpanded}
        onSocialExpandedChange={setSocialExpanded}
        onLabelsExpandedChange={setLabelsExpanded}
      />

      <ContactPreview
        config={previewConfig}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={style}
        onStyleChange={(newStyle) => setConfig({ ...config, style: newStyle })}
        title={title}
        mapData={mapData}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
