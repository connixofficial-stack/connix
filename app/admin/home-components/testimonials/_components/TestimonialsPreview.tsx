'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import { getTestimonialsSectionColors } from '../_lib/colors';
import { TestimonialsSectionShared } from './TestimonialsSectionShared';
import type {
  TestimonialsBrandMode,
  TestimonialsCornerRadius,
  TestimonialsDesktopColumns,
  TestimonialsItem,
  TestimonialsStyle,
} from '../_types';

const TESTIMONIAL_STYLES: Array<{ id: TestimonialsStyle; label: string }> = [
  { id: 'cards', label: '(1) Dạng thẻ' },
  { id: 'slider', label: '(2) Trượt ngang' },
  { id: 'marquee', label: '(3) Chạy ngang' },
  { id: 'showcase', label: '(4) Trưng bày' },
  { id: 'quote', label: '(5) Trích dẫn' },
  { id: 'minimal', label: '(6) Tối giản' },
  { id: 'split-carousel', label: '(7) Chia đôi' },
  { id: 'overlap-carousel', label: '(8) Đè chồng' },
  { id: 'builder-cards', label: '(9) Thẻ khối' },
  { id: 'builder-carousel', label: '(10) Trượt khối' },
];

export const TestimonialsPreview = ({
  items,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  fontStyle,
  fontClassName,
  // header props
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
  desktopColumns = 3,
  splitBackgroundImage,
  splitBackgroundOverlayOpacity,
  spacing = 'normal',
  cornerRadius = 'lg',
}: {
  items: TestimonialsItem[];
  brandColor: string;
  secondary: string;
  mode?: TestimonialsBrandMode;
  selectedStyle?: TestimonialsStyle;
  onStyleChange?: (style: TestimonialsStyle) => void;
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
  desktopColumns?: TestimonialsDesktopColumns;
  splitBackgroundImage?: string;
  splitBackgroundOverlayOpacity?: number;
  cornerRadius?: TestimonialsCornerRadius;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const previewStyle = selectedStyle ?? 'cards';
  const itemCount = items.length;

  const setPreviewStyle = (style: string) => {
    if (['cards', 'slider', 'marquee', 'showcase', 'quote', 'minimal', 'split-carousel', 'overlap-carousel', 'builder-cards', 'builder-carousel'].includes(style)) {
      onStyleChange?.(style as TestimonialsStyle);
    }
  };

  const colors = React.useMemo(
    () => adaptTokensForDarkMode(getTestimonialsSectionColors({ mode, primary: brandColor, secondary }), isDark),
    [mode, brandColor, secondary, isDark]
  );

  return (
    <PreviewWrapper
      title="Preview Testimonials"
      device={device}
      setDevice={setDevice}
      previewStyle={previewStyle}
      setPreviewStyle={setPreviewStyle}
      styles={TESTIMONIAL_STYLES}
      deviceWidthClass={deviceWidths[device]}
      info={`${itemCount} đánh giá`}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
    >
      <BrowserFrame>
        <div className="@container/preview">
          <TestimonialsSectionShared
            items={items}
            style={previewStyle}
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
            desktopColumns={desktopColumns}
            splitBackgroundImage={splitBackgroundImage}
            splitBackgroundOverlayOpacity={splitBackgroundOverlayOpacity}
            spacing={spacing}
            cornerRadius={cornerRadius}
          />
        </div>
      </BrowserFrame>
    </PreviewWrapper>
  );
};
