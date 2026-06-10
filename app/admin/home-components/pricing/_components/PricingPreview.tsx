'use client';

import React from 'react';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { getSectionSpacingClassName, normalizeSectionSpacing, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import {
  PRICING_STYLES,
} from '../_lib/constants';
import {
  getPricingValidationResult,
} from '../_lib/colors';
import { PricingSectionShared } from './PricingSectionShared';
import type {
  PricingBrandMode,
  PricingConfig,
  PricingPlan,
  PricingStyle,
} from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface PricingPreviewProps {
  title?: string;
  plans: PricingPlan[];
  config?: Partial<PricingConfig>;
  brandColor: string;
  secondary: string;
  mode?: PricingBrandMode;
  selectedStyle?: PricingStyle;
  onStyleChange?: (style: PricingStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  // Header config for SectionHeader preview
  headerConfig?: {
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
  };
  gridCols?: 3 | 4;
}

export function PricingPreview({
  title = 'Bảng giá',
  plans,
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'cards',
  onStyleChange,
  fontStyle,
  fontClassName,
  headerConfig,
  gridCols: gridColsProp = 3,
}: PricingPreviewProps) {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const [isYearly, setIsYearly] = React.useState(false);

  const previewStyle = selectedStyle;
  const setPreviewStyle = (nextStyle: string) => {
    if (!onStyleChange) {return;}
    onStyleChange(nextStyle as PricingStyle);
  };

  const subtitle = headerConfig?.subtitle ?? String(config?.subtitle ?? 'Chọn gói phù hợp với nhu cầu của bạn');
  const showBillingToggle = config?.showBillingToggle !== false;
  const monthlyLabel = String(config?.monthlyLabel ?? 'Hàng tháng');
  const yearlyLabel = String(config?.yearlyLabel ?? 'Hàng năm');
  const yearlySavingText = String(config?.yearlySavingText ?? 'Tiết kiệm 17%');
  const texts = config?.texts ?? {};

  const validation = React.useMemo(() => getPricingValidationResult({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);
  const tokens = React.useMemo(() => adaptTokensForDarkMode(validation.tokens, isDark), [validation.tokens, isDark]);

  const modeLabel = mode === 'single' ? '1 màu (single)' : '2 màu (dual)';

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Pricing"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={PRICING_STYLES}
        info={`${plans.length}/4 gói • ${modeLabel} • ${gridColsProp} cột`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/pricing">
          <div className={getSectionSpacingClassName(normalizeSectionSpacing(headerConfig?.spacing))}>
            {/* Render SectionHeader matching site pattern */}
            <div className="px-4">
              <div className="mx-auto max-w-7xl">
                <SectionHeader
                  title={title}
                  subtitle={subtitle}
                  badgeText={headerConfig?.badgeText}
                  hideHeader={headerConfig?.hideHeader}
                  showTitle={headerConfig?.showTitle}
                  showSubtitle={headerConfig?.showSubtitle}
                  showBadge={headerConfig?.showBadge}
                  headerAlign={headerConfig?.headerAlign}
                  titleColorPrimary={headerConfig?.titleColorPrimary}
                  subtitleAboveTitle={headerConfig?.subtitleAboveTitle}
                  uppercaseText={headerConfig?.uppercaseText}
                  brandColor={brandColor}
                />
              </div>
            </div>
            <PricingSectionShared
              context="preview"
              title={title}
              subtitle={subtitle}
              plans={plans}
              style={previewStyle}
              mode={mode}
              tokens={tokens}
              texts={texts}
              isYearly={isYearly}
              showBillingToggle={showBillingToggle}
              monthlyLabel={monthlyLabel}
              yearlyLabel={yearlyLabel}
              yearlySavingText={yearlySavingText}
              onBillingToggle={setIsYearly}
              skipHeader={true}
              previewDevice={device}
              gridCols={gridColsProp}
              cornerRadius={config?.cornerRadius}
            />
          </div>
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={validation.resolvedSecondary}
          description="Màu phụ áp dụng cho giá, badge và CTA của Pricing."
        />
      )}

    </div>
  );
}
