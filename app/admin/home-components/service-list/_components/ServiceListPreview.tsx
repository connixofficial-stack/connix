'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import {
  SERVICE_LIST_STYLES,
} from '../_lib/constants';
import {
  getServiceListValidationResult,
} from '../_lib/colors';
import { ServiceListSectionShared } from './ServiceListSectionShared';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import type {
  ServiceListBrandMode,
  ServiceListCardRadius,
  ServiceListDesktopColumns,
  ServiceListPreviewItem,
  ServiceListStyle,
} from '../_types';

interface ServiceListPreviewProps {
  brandColor: string;
  secondary: string;
  mode?: ServiceListBrandMode;
  itemCount: number;
  selectedStyle?: ServiceListStyle;
  onStyleChange?: (style: ServiceListStyle) => void;
  items?: ServiceListPreviewItem[];
  title?: string;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  cardRadius?: ServiceListCardRadius;
  desktopColumns?: ServiceListDesktopColumns;
  showViewAll?: boolean;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

const MOCK_SERVICES: ServiceListPreviewItem[] = [
  {
    description: 'Phong cách hiện đại, tối giản với vật liệu cao cấp nhập khẩu từ Ý.',
    id: 1,
    name: 'Thiết kế Nội thất Penthouse',
    price: '0',
    tag: 'hot',
  },
  {
    description: 'Giải pháp bền vững cho đô thị.',
    id: 2,
    name: 'Kiến trúc Xanh Vertical',
    price: '15000000',
    tag: 'new',
  },
  {
    description: 'Không gian thiền định tại gia.',
    id: 3,
    name: 'Cảnh quan Sân vườn Zen',
    price: '8500000',
  },
  {
    description: 'Tự động hóa toàn diện.',
    id: 4,
    name: 'Smart Home Hub',
    price: '25000000',
  },
  {
    description: 'Phục dựng di sản.',
    id: 5,
    name: 'Biệt thự Cổ',
    price: '0',
  },
  {
    description: 'Nghệ thuật ánh sáng.',
    id: 6,
    name: 'Lighting Art',
    price: '12000000',
    tag: 'new',
  },
];

const ServiceListPreviewInner = ({
  homePageBgColor,
  mode,
  previewStyle,
  hideHeader,
  showTitle,
  showSubtitle,
  subtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  spacing,
  cardRadius,
  desktopColumns,
  title,
  displayItems,
  validationTokens,
  device,
  showViewAll,
}: {
  homePageBgColor: string;
  mode: ServiceListBrandMode;
  previewStyle: ServiceListStyle;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  cardRadius?: ServiceListCardRadius;
  desktopColumns?: ServiceListDesktopColumns;
  title: string;
  displayItems: ServiceListPreviewItem[];
  validationTokens: any;
  device: any;
  showViewAll: boolean;
}) => {
  const { isDark } = usePreviewDark();
  const adaptedTokens = React.useMemo(() => adaptTokensForDarkMode(validationTokens, isDark), [validationTokens, isDark]);

  return (
    <div className="w-full transition-colors duration-300" style={{ backgroundColor: isDark ? '#0a0a0a' : homePageBgColor }}>
      <ServiceListSectionShared
        context="preview"
        mode={mode}
        style={previewStyle}
        hideHeader={hideHeader}
        showTitle={showTitle}
        showSubtitle={showSubtitle}
        subtitle={subtitle}
        headerAlign={headerAlign}
        titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle}
        uppercaseText={uppercaseText}
        showBadge={showBadge}
        badgeText={badgeText}
        spacing={spacing}
        cardRadius={cardRadius}
        desktopColumns={desktopColumns}
        sectionTitle={title}
        items={displayItems}
        tokens={adaptedTokens}
        device={device}
        showViewAll={showViewAll}
      />
    </div>
  );
};

export const ServiceListPreview = ({
  brandColor,
  secondary,
  mode = 'dual',
  itemCount,
  selectedStyle = 'grid',
  onStyleChange,
  items,
  title = 'Dịch vụ',
  hideHeader,
  showViewAll = true,
  fontStyle,
  showTitle,
  showSubtitle,
  subtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  spacing,
  cardRadius,
  desktopColumns,
  fontClassName,
}: ServiceListPreviewProps) => {
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

  const previewStyle = selectedStyle;
  const setPreviewStyle = (value: string) => onStyleChange?.(value as ServiceListStyle);

  const targetCount = Math.max(itemCount, 6);
  const displayItems: ServiceListPreviewItem[] = items && items.length > 0
    ? items
    : MOCK_SERVICES.slice(0, targetCount);

  const validation = React.useMemo(() => getServiceListValidationResult({
    mode,
    primary: brandColor,
    secondary,
  }), [brandColor, secondary, mode]);

  const modeLabel = mode === 'single' ? '1 màu (single)' : '2 màu (dual)';

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Dịch vụ"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={SERVICE_LIST_STYLES}
        info={`${displayItems.length} dịch vụ • ${modeLabel}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/services">
          <ServiceListPreviewInner
            homePageBgColor={homePageBgColor}
            mode={mode}
            previewStyle={previewStyle}
            hideHeader={hideHeader}
            showTitle={showTitle}
            showSubtitle={showSubtitle}
            subtitle={subtitle}
            headerAlign={headerAlign}
            titleColorPrimary={titleColorPrimary}
            subtitleAboveTitle={subtitleAboveTitle}
            uppercaseText={uppercaseText}
            showBadge={showBadge}
            badgeText={badgeText}
            spacing={spacing}
            cardRadius={cardRadius}
            desktopColumns={desktopColumns}
            title={title}
            displayItems={displayItems}
            validationTokens={validation.tokens}
            device={device}
            showViewAll={showViewAll}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={validation.resolvedSecondary}
          description="Màu phụ áp dụng cho giá, badge và hành động điều hướng trong ServiceList."
        />
      )}

    </div>
  );
};
