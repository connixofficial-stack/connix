'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { getSectionSpacingClassName, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { ABOUT_STYLES } from '../_lib/constants';
import {
  getAboutSectionColors,
  getAboutValidationResult,
} from '../_lib/colors';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import { AboutSectionShared } from './AboutSectionShared';
import type { AboutBrandMode, AboutConfig, AboutCornerRadius, AboutStyle } from '../_types';
import { cn } from '@/app/admin/components/ui';

interface AboutPreviewProps {
  config: AboutConfig;
  brandColor: string;
  secondary: string;
  mode?: AboutBrandMode;
  selectedStyle?: AboutStyle;
  onStyleChange?: (style: AboutStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  // Header config
  title?: string;
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
  cornerRadius?: AboutCornerRadius;
}

interface AboutPreviewContentProps {
  config: AboutConfig;
  brandColor: string;
  secondary: string;
  mode: AboutBrandMode;
  previewStyle: AboutStyle;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  spacing?: SectionSpacing;
  cornerRadius?: AboutCornerRadius;
  device: 'desktop' | 'tablet' | 'mobile';
  homePageBgColor: string;
}

const AboutPreviewContent = ({
  config,
  brandColor,
  secondary,
  mode,
  previewStyle,
  title,
  subtitle,
  badgeText,
  hideHeader,
  showTitle,
  showSubtitle,
  showBadge,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  spacing,
  cornerRadius,
  device,
  homePageBgColor,
}: AboutPreviewContentProps) => {
  const { isDark } = usePreviewDark();

  const tokens = React.useMemo(
    () => adaptTokensForDarkMode(getAboutSectionColors({ primary: brandColor, secondary, mode }), isDark),
    [brandColor, secondary, mode, isDark],
  );

  return (
    <BrowserFrame url="yoursite.com/about">
      <div className={cn("w-full transition-colors duration-300", isDark && "dark")} style={{ backgroundColor: isDark ? '#0f172a' : homePageBgColor }}>
        <div className="container mx-auto px-4">
          <div className={getSectionSpacingClassName(spacing)}>
            <SectionHeader
              title={title}
              subtitle={subtitle}
              badgeText={badgeText}
              hideHeader={hideHeader}
              showTitle={showTitle}
              showSubtitle={showSubtitle}
              showBadge={showBadge}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              brandColor={tokens.primary}
            />
            <AboutSectionShared
              context="preview"
              isDark={isDark}
              mode={mode}
              style={previewStyle}
              title={title || config.heading || 'Về chúng tôi'}
              subHeading={config.subHeading}
              heading={config.heading}
              highlightText={config.highlightText}
              description={config.description}
              phone={config.phone}
              image={config.image}
              images={config.images}
              imageCaption={config.imageCaption}
              buttonText={config.buttonText}
              buttonLink={config.buttonLink}
              features={config.features ?? []}
              stats={config.stats ?? []}
              tokens={tokens}
              device={device}
              cornerRadius={cornerRadius ?? config.cornerRadius ?? 'lg'}
            />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

export const AboutPreview = ({
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  fontStyle,
  fontClassName,
  title,
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
  cornerRadius,
}: AboutPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const systemColors = useBrandColors();

  const homePageBgColor = React.useMemo(() => {
    if (!systemConfig?.homePageBackground) {return '#ffffff';}
    const { type, customColor } = systemConfig.homePageBackground;
    switch (type) {
      case 'white':
        return '#ffffff';
      case 'black':
        return '#000000';
      case 'primary':
        return systemColors.primary;
      case 'secondary':
        return systemColors.secondary || systemColors.primary;
      case 'custom':
        return customColor || '#ffffff';
      default:
        return '#ffffff';
    }
  }, [systemConfig?.homePageBackground, systemColors]);

  const previewStyle = selectedStyle ?? config.style ?? 'bento';
  const setPreviewStyle = (nextStyle: string) => {
    onStyleChange?.(nextStyle as AboutStyle);
  };

  const validation = React.useMemo(
    () => getAboutValidationResult({
      primary: brandColor,
      secondary,
      mode,
      style: previewStyle,
    }),
    [brandColor, secondary, mode, previewStyle],
  );

  return (
    <>
      <PreviewWrapper
        title="Preview Về chúng tôi"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={ABOUT_STYLES}
        info={`${config.features?.length ?? 0} điểm nổi bật • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <AboutPreviewContent
          config={config}
          brandColor={brandColor}
          secondary={secondary}
          mode={mode}
          previewStyle={previewStyle}
          title={title}
          subtitle={subtitle}
          badgeText={badgeText}
          hideHeader={hideHeader}
          showTitle={showTitle}
          showSubtitle={showSubtitle}
          showBadge={showBadge}
          headerAlign={headerAlign}
          titleColorPrimary={titleColorPrimary}
          subtitleAboveTitle={subtitleAboveTitle}
          uppercaseText={uppercaseText}
          spacing={spacing}
          cornerRadius={cornerRadius}
          device={device}
          homePageBgColor={homePageBgColor}
        />
      </PreviewWrapper>

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={validation.tokens.primary}
          secondary={validation.tokens.secondary}
          description="Màu phụ áp dụng cho badge, timeline dot, chỉ số phụ và điểm nhấn điều hướng trong About."
        />
      ) : null}
    </>
  );
};
