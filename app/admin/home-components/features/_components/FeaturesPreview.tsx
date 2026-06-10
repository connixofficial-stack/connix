'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { FeaturesSectionShared } from './FeaturesSectionShared';
import type {
  FeatureItem,
  FeaturesBrandMode,
  FeaturesCornerRadius,
  FeaturesDesktopColumns,
  FeaturesStyle,
} from '../_types';

const styles: Array<{ id: FeaturesStyle; label: string }> = [
  { id: 'carousel6', label: 'Carousel 6' },
  { id: 'iconGrid', label: 'Icon Grid' },
  { id: 'alternating', label: 'Alternating' },
  { id: 'compact', label: 'Compact' },
  { id: 'cards', label: 'Cards' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'timeline', label: 'Media Carousel' },
];

interface FeaturesPreviewProps {
  items: FeatureItem[];
  brandColor: string;
  secondary: string;
  mode: FeaturesBrandMode;
  sectionTitle?: string;
  selectedStyle?: FeaturesStyle;
  onStyleChange?: (style: FeaturesStyle) => void;
  showIcons?: boolean;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  // Shared header config
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  desktopColumns?: FeaturesDesktopColumns;
  cornerRadius?: FeaturesCornerRadius;
}

export function FeaturesPreview({
  items,
  brandColor,
  secondary,
  mode,
  sectionTitle,
  selectedStyle,
  onStyleChange,
  showIcons = true,
  fontStyle,
  fontClassName,
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
  desktopColumns,
  cornerRadius,
}: FeaturesPreviewProps) {
  const { device, setDevice } = usePreviewDevice();

  const previewStyle = selectedStyle ?? 'carousel6';
  const info = (() => {
    const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
    if (items.length === 0) {return `Chưa có tính năng • ${modeLabel}`;}
    const sizeLabel = previewStyle === 'carousel'
      ? 'Icon: 56×56px • Card rộng'
      : previewStyle === 'carousel6'
        ? 'Icon: 48×48px • Carousel 6'
        : previewStyle === 'timeline'
          ? 'Ảnh + icon • Media Carousel'
          : 'Icon: 40-56px';
    return `${items.length} tính năng • ${sizeLabel} • ${modeLabel}`;
  })();

  return (
    <>
      <PreviewWrapper
        title="Preview Features"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={(next) => onStyleChange?.(next as FeaturesStyle)}
        styles={styles}
        info={info}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
        deviceWidthClass={deviceWidths[device]}
      >
        <BrowserFrame>
          <FeaturesSectionShared
            context="preview"
            device={device}
            items={items}
            style={previewStyle}
            showIcons={showIcons}
            title={sectionTitle}
            brandColor={brandColor}
            secondary={secondary}
            mode={mode}
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
            desktopColumns={desktopColumns}
            cornerRadius={cornerRadius}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={secondary}
          description="Màu phụ được áp dụng cho badge, icon, accent và điều hướng trong Features."
        />
      ) : null}
    </>
  );
}

export type { FeaturesStyle } from '../_types';
