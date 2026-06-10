'use client';

import React from 'react';
import { SpeedDialSectionShared } from './SpeedDialSectionShared';
import { usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SpeedDialAction, SpeedDialBrandMode, SpeedDialPosition, SpeedDialStyle } from '../_types';

interface SpeedDialPreviewProps {
  actions: SpeedDialAction[];
  position: SpeedDialPosition;
  style: SpeedDialStyle;
  brandColor: string;
  secondary: string;
  mode: SpeedDialBrandMode;
  title?: string;
  selectedStyle: SpeedDialStyle;
  onStyleChange: (style: SpeedDialStyle) => void;
  defaultOpen: boolean;
  enableShadow?: boolean;
}

export function SpeedDialPreview({
  actions,
  position,
  style,
  brandColor,
  secondary,
  mode,
  title = 'Speed Dial',
  selectedStyle,
  onStyleChange,
  defaultOpen,
  enableShadow = true,
}: SpeedDialPreviewProps) {
  const { device, setDevice } = usePreviewDevice();
  const styleForRender = selectedStyle ?? style;

  return (
    <SpeedDialSectionShared
      actions={actions}
      style={styleForRender}
      position={position}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      sectionTitle={title}
      context="preview"
      includePreviewWrapper
      previewDevice={device}
      setPreviewDevice={setDevice}
      previewStyle={styleForRender}
      onPreviewStyleChange={onStyleChange}
      defaultOpen={defaultOpen}
      enableShadow={enableShadow}
    />
  );
}
