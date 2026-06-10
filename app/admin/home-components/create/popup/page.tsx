'use client';

import React from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { PopupForm } from '../../popup/_components/PopupForm';
import { PopupPreview } from '../../popup/_components/PopupPreview';
import { DEFAULT_POPUP_CONFIG } from '../../popup/_lib/constants';
import type { PopupConfig } from '../../popup/_types';

const COMPONENT_TYPE = 'Popup';

export default function PopupCreatePage() {
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Popup', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const [config, setConfig] = React.useState<PopupConfig>(DEFAULT_POPUP_CONFIG);

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, config as unknown as Record<string, unknown>);
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
    >
      <PopupForm config={config} onChange={setConfig} />
      <PopupPreview
        config={config}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        fontStyle={fontStyle}
        fontClassName="font-active"
        title={title}
        selectedStyle={config.style}
        onStyleChange={(style) => setConfig((current) => ({ ...current, style }))}
      />
    </ComponentFormWrapper>
  );
}
