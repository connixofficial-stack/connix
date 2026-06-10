'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import {
  CAREER_STYLES,
  DEFAULT_CAREER_TEXTS,
} from '../_lib/constants';
import { getCareerValidationResult } from '../_lib/colors';
import { normalizeCareerJobs } from '../_lib/normalize';
import { CareerSectionShared } from './CareerSectionShared';
import type {
  CareerBrandMode,
  CareerCornerRadius,
  CareerStyle,
  CareerTexts,
  JobPosition,
} from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface CareerPreviewProps {
  jobs: JobPosition[];
  brandColor: string;
  secondary: string;
  mode?: CareerBrandMode;
  selectedStyle?: CareerStyle;
  onStyleChange?: (style: CareerStyle) => void;
  title?: string;
  texts?: CareerTexts;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  spacing?: SectionSpacing;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  desktopColumns?: 3 | 4;
  cornerRadius?: CareerCornerRadius;
  logoSize?: 'small' | 'medium' | 'large';
}

export function CareerPreview({
  jobs,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'cards',
  onStyleChange,
  title = 'Tuyển dụng',
  texts = DEFAULT_CAREER_TEXTS,
  fontStyle,
  fontClassName,
  spacing,
  hideHeader,
  showTitle,
  showSubtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  desktopColumns,
  cornerRadius,
  logoSize,
}: CareerPreviewProps) {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();

  const previewStyle = selectedStyle;
  const setPreviewStyle = (value: string) => onStyleChange?.(value as CareerStyle);

  const normalizedJobs = React.useMemo(
    () => normalizeCareerJobs(jobs),
    [jobs],
  );

  const validation = React.useMemo(() => getCareerValidationResult({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);
  const tokens = React.useMemo(() => adaptTokensForDarkMode(validation.tokens, isDark), [validation.tokens, isDark]);

  const modeLabel = mode === 'single' ? '1 màu (single)' : '2 màu (dual)';

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Tuyển dụng"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={CAREER_STYLES}
        info={`${normalizedJobs.length} vị trí • ${modeLabel}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/careers">
          <CareerSectionShared
            context="preview"
            jobs={normalizedJobs}
            style={previewStyle}
            title={title}
            tokens={tokens}
            device={device}
            texts={texts}
            spacing={spacing}
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
            cornerRadius={cornerRadius}
            logoSize={logoSize}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={validation.resolvedSecondary}
          description="Màu phụ áp dụng cho badge phòng ban, mức lương, timeline accent và metadata tuyển dụng."
        />
      )}

    </div>
  );
}
