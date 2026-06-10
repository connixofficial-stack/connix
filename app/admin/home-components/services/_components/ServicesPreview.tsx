'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { ServicesSectionCore } from '@/components/site/ServicesSectionCore';
import { getServicesColors } from '../_lib/colors';
import { DEFAULT_SERVICES_CORNER_RADIUS, DEFAULT_SERVICES_SPACING, getServicesSectionSpacingClassName, type ServiceItem, type ServiceItemMediaAlign, type ServiceItemMediaPlacement, type ServicesBrandMode, type ServicesCornerRadius, type ServicesSpacing, type ServicesStyle } from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

const SERVICES_STYLES: Array<{ id: ServicesStyle; label: string }> = [
  { id: 'elegantGrid', label: '(1) Lưới thẻ' },
  { id: 'modernList', label: '(2) Xếp dọc' },
  { id: 'bigNumber', label: '(3) Đính số' },
  { id: 'cards', label: '(4) Dạng thẻ' },
  { id: 'carousel', label: '(5) Trượt ngang' },
  { id: 'timeline', label: '(6) Tiến trình' },
  { id: 'builderPolicy', label: '(7) Góc cạnh' },
  { id: 'builderFeatureCircle', label: '(8) Biểu tượng' },
];

export const ServicesPreview = ({
  items,
  mediaPlacement = 'top',
  mediaAlign = 'center',
  headerAlign = 'left',
  desktopColumns = 3,
  subtitle,
  showTitle = true,
  showSubtitle = true,
  showBadge = true,
  badgeText,
  hideHeader = false,
  titleColorPrimary = false,
  subtitleAboveTitle = false,
  uppercaseText = false,
  spacing = DEFAULT_SERVICES_SPACING,
  cornerRadius = DEFAULT_SERVICES_CORNER_RADIUS,
  brandColor,
  secondary,
  title = 'Dịch vụ',
  selectedStyle = 'elegantGrid',
  onStyleChange,
  mode = 'dual',
  fontStyle,
  fontClassName,
}: {
  items: ServiceItem[];
  mediaPlacement?: ServiceItemMediaPlacement;
  mediaAlign?: ServiceItemMediaAlign;
  headerAlign?: ServiceItemMediaAlign;
  desktopColumns?: 3 | 4;
  subtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing  ;
  cornerRadius?: ServicesCornerRadius;
  hideHeader?: boolean;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  brandColor: string;
  secondary: string;
  title?: string;
  selectedStyle?: ServicesStyle;
  onStyleChange?: (style: ServicesStyle) => void;
  mode?: ServicesBrandMode;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();

  const previewStyle = selectedStyle;
  const colors = React.useMemo(
    () => adaptTokensForDarkMode(getServicesColors(brandColor, secondary, mode), isDark),
    [brandColor, secondary, mode, isDark],
  );

  return (
    <>
      <PreviewWrapper
        title="Preview Services"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={(next) => onStyleChange?.(next as ServicesStyle)}
        styles={SERVICES_STYLES}
        info={`${items.length} mục`}
        fontStyle={fontStyle}
        fontClassName={fontClassName ?? 'font-active'}
        deviceWidthClass={deviceWidths[device]}
      >
        <BrowserFrame>
          <div className={getServicesSectionSpacingClassName(spacing as ServicesSpacing)}>
            <div className="px-4">
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
                brandColor={brandColor}
              />
            </div>
            <ServicesSectionCore
              items={items}
              style={previewStyle}
              mediaPlacement={mediaPlacement}
              mediaAlign={mediaAlign}
              headerAlign={headerAlign}
              desktopColumns={desktopColumns}
              subtitle={''}
              showTitle={false}
              showSubtitle={false}
              title={''}
              colors={colors}
              device={device}
              spacing="none"
              cornerRadius={cornerRadius}
              isPreview
              carouselId={`services-preview-carousel-${device}`}
            />
          </div>
        </BrowserFrame>
      </PreviewWrapper>
      <ColorInfoPanel brandColor={colors.primary} secondary={colors.secondary} />
    </>
  );
};

