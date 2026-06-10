'use client';

import React from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { CountdownForm } from '../../countdown/_components/CountdownForm';
import { CountdownPreview } from '../../countdown/_components/CountdownPreview';
import { DEFAULT_COUNTDOWN_CONFIG } from '../../countdown/_lib/constants';
import { normalizeCountdownConfig, toCountdownPersistConfig } from '../../countdown/_lib/normalize';
import type { CountdownConfigState } from '../../countdown/_types';

export default function CountdownCreatePage() {
  const COMPONENT_TYPE = 'Countdown';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Khuyến mãi đặc biệt', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [config, setConfig] = React.useState<CountdownConfigState>(() => normalizeCountdownConfig(DEFAULT_COUNTDOWN_CONFIG));
  const [displayOpen, setDisplayOpen] = React.useState(true);

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, toCountdownPersistConfig(config));
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
      <div className="mb-6">
        <HomeComponentDisplaySettingsSection
          open={displayOpen}
          onOpenChange={setDisplayOpen}
          cornerRadius={config.cornerRadius}
          onCornerRadiusChange={(cornerRadius) => setConfig((prev) => ({ ...prev, cornerRadius }))}
          spacing={config.spacing ?? 'normal'}
          onSpacingChange={(spacing) => setConfig((prev) => ({ ...prev, spacing }))}
        />
      </div>

      <CountdownForm
        value={config}
        onChange={setConfig}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
      />

      <CountdownPreview
        config={config}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={config.style}
        onStyleChange={(style) => {
          setConfig((prev) => ({
            ...prev,
            style,
          }));
        }}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
