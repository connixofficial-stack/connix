'use client';

import React from 'react';
import { usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { PopupSectionShared } from './PopupSectionShared';
import type { PopupConfig, PopupStyle } from '../_types';

interface PopupPreviewProps {
  config: PopupConfig;
  brandColor: string;
  secondary?: string;
  mode?: 'single' | 'dual';
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  title: string;
  selectedStyle: PopupStyle;
  onStyleChange: (style: PopupStyle) => void;
}

export function PopupPreview({ config, brandColor, secondary, mode, fontStyle, fontClassName, title, selectedStyle, onStyleChange }: PopupPreviewProps) {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();

  return (
    <PopupSectionShared
      config={{ ...config, style: selectedStyle }}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
      sectionTitle={title}
      context="preview"
      includePreviewWrapper
      previewDevice={device}
      setPreviewDevice={setDevice}
      previewStyle={selectedStyle}
      onPreviewStyleChange={onStyleChange}
      isDark={isDark}
    />
  );
}
