'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { BENEFITS_STYLES } from '../_lib/constants';
import {
  getBenefitsSectionColors,
  getBenefitsValidationResult,
  normalizeBenefitsHarmony,
  normalizeBenefitsStyle,
} from '../_lib/colors';
import { BenefitsSectionShared } from './BenefitsSectionShared';
import type { BenefitItem, BenefitsBrandMode, BenefitsConfig, BenefitsStyle } from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface BenefitsPreviewProps {
  items: BenefitItem[];
  title?: string;
  brandColor: string;
  secondary: string;
  mode?: BenefitsBrandMode;
  selectedStyle?: BenefitsStyle;
  onStyleChange?: (style: BenefitsStyle) => void;
  config?: Partial<BenefitsConfig>;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export const BenefitsPreview = ({
  items,
  title,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  config,
  fontStyle,
  fontClassName,
}: BenefitsPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const resolvedTitle = typeof title === 'string' ? title.trim() : '';

  const previewStyle = normalizeBenefitsStyle(selectedStyle ?? '1');
  const setPreviewStyle = (nextStyle: string) => {
    onStyleChange?.(nextStyle as BenefitsStyle);
  };

  const harmony = normalizeBenefitsHarmony(config?.harmony);

  const validation = React.useMemo(
    () => getBenefitsValidationResult({
      harmony,
      mode,
      primary: brandColor,
      secondary,
      style: previewStyle,
    }),
    [brandColor, secondary, mode, harmony, previewStyle],
  );

  const tokens = React.useMemo(
    () => adaptTokensForDarkMode(getBenefitsSectionColors({
      harmony,
      mode,
      primary: brandColor,
      secondary,
    }), isDark),
    [brandColor, secondary, mode, harmony, isDark],
  );

  const sectionConfig = React.useMemo(
    () => ({
      buttonLink: config?.buttonLink,
      buttonText: config?.buttonText,
      cornerRadius: config?.cornerRadius,
      gridColumnsDesktop: config?.gridColumnsDesktop,
      gridColumnsMobile: config?.gridColumnsMobile,
      heading: config?.heading,
      headerAlign: config?.headerAlign,
      highlightIndex: config?.highlightIndex,
      showDecorativeVisuals: config?.showDecorativeVisuals,
      showItemNumbers: config?.showItemNumbers,
      subHeading: config?.subHeading,
      visualImage: config?.visualImage,
    }),
    [
      config?.buttonLink,
      config?.buttonText,
      config?.cornerRadius,
      config?.gridColumnsDesktop,
      config?.gridColumnsMobile,
      config?.heading,
      config?.headerAlign,
      config?.highlightIndex,
      config?.showDecorativeVisuals,
      config?.showItemNumbers,
      config?.subHeading,
      config?.visualImage,
    ],
  );

  const previewSubtitle = (config?.subtitle ?? '').trim();
  const previewBadgeText = (config?.badgeText ?? '').trim();

  return (
    <>
      <PreviewWrapper
        title="Preview Lợi ích"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={BENEFITS_STYLES}
        info={`${items.length} lợi ích • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/benefits">
          <section className="px-4 py-10" style={{ backgroundColor: tokens.neutralBackground }}>
            <div className="mx-auto max-w-6xl space-y-6">
              <SectionHeader
                title={resolvedTitle}
                subtitle={previewSubtitle}
                badgeText={previewBadgeText}
                hideHeader={config?.hideHeader}
                showTitle={config?.showTitle}
                showSubtitle={config?.showSubtitle}
                showBadge={config?.showBadge}
                headerAlign={config?.headerAlign}
                titleColorPrimary={config?.titleColorPrimary}
                subtitleAboveTitle={config?.subtitleAboveTitle}
                uppercaseText={config?.uppercaseText}
                brandColor={brandColor}
              />

              <BenefitsSectionShared
                items={items}
                style={previewStyle}
                title={resolvedTitle}
                config={sectionConfig}
                tokens={tokens}
                mode={mode}
                context="preview"
                previewDevice={device}
                skipHeader={true}
              />
            </div>
          </section>
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={validation.tokens.primary}
          secondary={validation.tokens.secondary}
          description="Màu phụ áp dụng cho badge, icon phụ, accent line và điểm nhấn điều hướng trong Benefits."
        />
      ) : null}
    </>
  );
};
