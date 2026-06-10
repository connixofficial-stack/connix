'use client';

import React from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { SpeedDialForm } from '../../speed-dial/_components/SpeedDialForm';
import { SpeedDialPreview } from '../../speed-dial/_components/SpeedDialPreview';
import { DEFAULT_SPEED_DIAL_CONFIG, normalizeSpeedDialStyle } from '../../speed-dial/_lib/constants';
import type {
  SpeedDialAction,
  SpeedDialConfig,
  SpeedDialPosition,
  SpeedDialStyle,
} from '../../speed-dial/_types';

const createDefaultActions = (): SpeedDialAction[] => [
  { id: 'action-phone', bgColor: '#ef4444', icon: 'phone', label: 'Gọi ngay', url: 'tel:0123456789' },
  { id: 'action-zalo', bgColor: '#0084ff', icon: 'zalo', label: 'Zalo', url: 'https://zalo.me/yourpage' },
  { id: 'action-facebook', bgColor: '#1877f2', icon: 'facebook', label: 'Facebook', url: 'https://facebook.com/yourpage' },
];

export default function SpeedDialCreatePage() {
  const COMPONENT_TYPE = 'SpeedDial';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Speed Dial', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;

  const [actions, setActions] = React.useState<SpeedDialAction[]>(createDefaultActions());
  const [style, setStyle] = React.useState<SpeedDialStyle>(normalizeSpeedDialStyle(DEFAULT_SPEED_DIAL_CONFIG.style));
  const [position, setPosition] = React.useState<SpeedDialPosition>(DEFAULT_SPEED_DIAL_CONFIG.position);
  const [defaultOpen, setDefaultOpen] = React.useState<boolean>(DEFAULT_SPEED_DIAL_CONFIG.defaultOpen);
  const [showOnAllPages, setShowOnAllPages] = React.useState<boolean>(DEFAULT_SPEED_DIAL_CONFIG.showOnAllPages);
  const [enableShadow, setEnableShadow] = React.useState<boolean>(DEFAULT_SPEED_DIAL_CONFIG.enableShadow);

  const onSubmit = (event: React.FormEvent) => {
    const payload: SpeedDialConfig = {
      actions: actions.map((action) => ({
        id: action.id,
        icon: action.icon,
        label: action.label,
        url: action.url,
        bgColor: action.bgColor,
      })),
      style,
      position,
      defaultOpen,
      showOnAllPages,
      enableShadow,
    };

    void handleSubmit(event, payload as unknown as Record<string, unknown>);
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
    >
      <SpeedDialForm
        actions={actions}
        onActionsChange={setActions}
        position={position}
        onPositionChange={setPosition}
        defaultOpen={defaultOpen}
        onDefaultOpenChange={setDefaultOpen}
        showOnAllPages={showOnAllPages}
        onShowOnAllPagesChange={setShowOnAllPages}
        enableShadow={enableShadow}
        onEnableShadowChange={setEnableShadow}
        defaultActionColor={secondary || primary}
      />

      <SpeedDialPreview
        actions={actions}
        position={position}
        style={style}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        title={title}
        selectedStyle={style}
        onStyleChange={setStyle}
        defaultOpen={defaultOpen}
        enableShadow={enableShadow}
      />
    </ComponentFormWrapper>
  );
}
