'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { getMarqueeSectionColors } from '../_lib/colors';
import { MarqueeSectionShared } from './MarqueeSectionShared';
import type {
  MarqueeBrandMode,
  MarqueeCornerRadius,
  MarqueeDirection,
  MarqueeItem,
  MarqueeScale,
  MarqueeSpeed,
  MarqueeStyle,
} from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

const MARQUEE_STYLES: Array<{ id: MarqueeStyle; label: string }> = [
  { id: 'ribbon', label: '(1) Chạy ngang' },
  { id: 'gradient', label: '(2) Chuyển màu' },
  { id: 'minimal', label: '(3) Tối giản' },
  { id: 'dark', label: '(4) Nền tối' },
  { id: 'split', label: '(5) Chia đôi' },
  { id: 'stripe', label: '(6) Sọc kẻ' },
];

export const MarqueePreview = ({
  items,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  direction,
  speed,
  pauseOnHover,
  scale,
  uppercase,
  fontStyle,
  fontClassName,
  title,
  subtitle,
  hideHeader,
  showTitle,
  showSubtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  spacing,
  cornerRadius,
}: {
  items: MarqueeItem[];
  brandColor: string;
  secondary: string;
  mode?: MarqueeBrandMode;
  selectedStyle?: MarqueeStyle;
  onStyleChange?: (style: MarqueeStyle) => void;
  direction: MarqueeDirection;
  speed: MarqueeSpeed;
  pauseOnHover: boolean;
  scale: MarqueeScale;
  uppercase?: boolean;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  cornerRadius?: MarqueeCornerRadius;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const previewStyle = selectedStyle ?? 'ribbon';
  const itemCount = items.length;

  const setPreviewStyle = (style: string) => {
    if (['ribbon', 'gradient', 'minimal', 'dark', 'split', 'stripe'].includes(style)) {
      onStyleChange?.(style as MarqueeStyle);
    }
  };

  const colors = React.useMemo(
    () => adaptTokensForDarkMode(getMarqueeSectionColors({ mode, primary: brandColor, secondary }), isDark),
    [mode, brandColor, secondary, isDark]
  );

  return (
    <PreviewWrapper
      title="Preview Chạy chữ"
      device={device}
      setDevice={setDevice}
      previewStyle={previewStyle}
      setPreviewStyle={setPreviewStyle}
      styles={MARQUEE_STYLES}
      deviceWidthClass={deviceWidths[device]}
      info={`${itemCount} mục`}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
    >
      <BrowserFrame>
        <div className="@container/preview">
          <MarqueeSectionShared
            items={items}
            style={previewStyle}
            direction={direction}
            speed={speed}
            pauseOnHover={pauseOnHover}
            scale={scale}
            uppercase={uppercase}
            title={title}
            subtitle={subtitle}
            tokens={colors}
            mode={mode}
            context="preview"
            device={device}
            fontStyle={fontStyle}
            fontClassName={fontClassName}
            hideHeader={hideHeader}
            showTitle={showTitle}
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
        </div>
      </BrowserFrame>
    </PreviewWrapper>
  );
};
