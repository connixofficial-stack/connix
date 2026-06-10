'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { cn } from '../../../components/ui';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { getSectionSpacingClassName, normalizeSectionSpacing, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { getPreviewDeviceClass } from '../../_shared/lib/previewResponsive';
import { getGalleryColorTokens, getTrustBadgesNeutralColorTokens } from '../_lib/colors';
import {
  getTrustBadgesCornerRadiusClassName,
  getTrustBadgesInnerCornerRadiusClassName,
  resolveTrustBadgesRenderConfig,
  type TrustBadgesStyle,
} from '../_types';

export interface TrustBadgeItemShared {
  id: number | string;
  url: string;
  link?: string;
  name?: string;
}

export interface TrustBadgesSharedConfig {
  heading?: string;
  subHeading?: string;
  badgeText?: string;
  spacing?: SectionSpacing;
  cornerRadius?: unknown;
  noBorderRadius?: unknown;
  noVerticalMargin?: unknown;
  showBorder?: unknown;
  trustCueText?: string;
  stackHeading?: string;
  stackDescription?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  hideHeader?: boolean;
}

export const DEFAULT_TRUST_CUE_TEXT = 'Đã xác minh';
export const DEFAULT_STACK_HEADING = 'Bộ tín hiệu tin cậy';
export const DEFAULT_STACK_DESCRIPTION = 'Ưu tiên chứng nhận có nguồn gốc rõ ràng, tên dễ đọc và ảnh sắc nét.';
export const TRUST_BADGES_A4_ASPECT_CLASS = 'aspect-[210/297]';
export const TRUST_BADGES_A4_ASPECT_RATIO = {
  cssValue: '210 / 297',
  label: 'A4 dọc (210:297)',
  value: 210 / 297,
};

export function getTrustBadgesMaxVisibleItems(desktopColumns: 3 | 4) {
  return desktopColumns === 3 ? 6 : 8;
}

export function useTrustBadgesSectionState({
  brandColor,
  config,
  desktopColumns = 4,
  mode,
  previewDevice,
  secondary,
  selectedStyle,
}: {
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  selectedStyle?: TrustBadgesStyle;
  desktopColumns?: 3 | 4;
  config?: TrustBadgesSharedConfig;
  previewDevice?: 'mobile' | 'tablet' | 'desktop';
}) {
  const colors = getTrustBadgesNeutralColorTokens(getGalleryColorTokens({ primary: brandColor, secondary, mode }));
  const renderConfig = resolveTrustBadgesRenderConfig({
    cornerRadius: config?.cornerRadius,
    noBorderRadius: config?.noBorderRadius,
    desktopColumns,
    showBorder: config?.showBorder,
    style: selectedStyle,
  });
  const desktopGridClassName = renderConfig.desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
  const previewGridClassName = previewDevice
    ? getPreviewDeviceClass(previewDevice, {
      desktop: desktopGridClassName,
      mobile: renderConfig.desktopColumns === 3 ? 'grid-cols-1' : 'grid-cols-2',
      tablet: renderConfig.desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-2',
    })
    : undefined;
  const siteGridClassName = renderConfig.desktopColumns === 3
    ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3'
    : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4';

  return {
    cardBorder: renderConfig.showBorder ? `1px solid ${colors.neutralBorder}` : '1px solid transparent',
    colors,
    innerRadiusClassName: getTrustBadgesInnerCornerRadiusClassName(renderConfig.cornerRadius),
    previewGridClassName,
    radiusClassName: getTrustBadgesCornerRadiusClassName(renderConfig.cornerRadius),
    renderConfig,
    sectionSpacingClassName: getSectionSpacingClassName(config?.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(config?.spacing)),
    siteGridClassName,
  };
}

export function TrustBadgesSectionHeader({
  brandColor,
  config,
  fallbackSubtitle = 'Được công nhận bởi các tổ chức uy tín',
  title,
}: {
  brandColor: string;
  config?: TrustBadgesSharedConfig;
  title: string;
  fallbackSubtitle?: string;
}) {
  return (
    <SectionHeader
      title={title}
      subtitle={config?.subHeading ?? fallbackSubtitle}
      badgeText={config?.badgeText}
      hideHeader={config?.hideHeader}
      showTitle={config?.showTitle ?? true}
      showSubtitle={config?.showSubtitle ?? true}
      showBadge={config?.showBadge ?? false}
      headerAlign={config?.headerAlign ?? 'center'}
      titleColorPrimary={config?.titleColorPrimary}
      subtitleAboveTitle={config?.subtitleAboveTitle}
      uppercaseText={config?.uppercaseText}
      brandColor={brandColor}
    />
  );
}

export function TrustBadgesEmptyState({ colors }: { colors: ReturnType<typeof getTrustBadgesNeutralColorTokens> }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colors.placeholderBg }}>
        <Shield size={36} style={{ color: colors.placeholderIcon }} />
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Chưa có chứng nhận</h3>
      <p className="text-sm text-slate-500 max-w-xs">Thêm chứng nhận, giải thưởng hoặc badge để tăng độ tin cậy</p>
    </div>
  );
}

export function TrustBadgesTrustCue({
  colors,
  compact = false,
  text = DEFAULT_TRUST_CUE_TEXT,
}: {
  colors: ReturnType<typeof getTrustBadgesNeutralColorTokens>;
  compact?: boolean;
  text?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full border font-semibold', compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs')}
      style={{ backgroundColor: colors.badgeBg, borderColor: colors.accentBorder, color: colors.badgeText }}
    >
      {text}
    </span>
  );
}
