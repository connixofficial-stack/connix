'use client';

import React from 'react';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  DEFAULT_DEMO_VOUCHERS,
  VOUCHER_PROMOTIONS_STYLES,
} from '../_lib/constants';
import { getVoucherPromotionsValidationResult } from '../_lib/colors';
import { VoucherPromotionsSectionShared } from './VoucherPromotionsSectionShared';
import type {
  VoucherPromotionItem,
  VoucherPromotionsBrandMode,
  VoucherPromotionsConfig,
} from '../_types';
import {
  DEFAULT_VOUCHER_STYLE,
  normalizeVoucherLimit,
  normalizeVoucherStyle,
  type VoucherPromotionsStyle,
} from '@/lib/home-components/voucher-promotions';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface VoucherPromotionsPreviewProps {
  config: VoucherPromotionsConfig;
  brandColor: string;
  secondary: string;
  mode?: VoucherPromotionsBrandMode;
  selectedStyle?: VoucherPromotionsStyle;
  limit?: number;
  onStyleChange?: (style: VoucherPromotionsStyle) => void;
  previewVouchers?: VoucherPromotionItem[];
  canUseRealData?: boolean;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export const VoucherPromotionsPreview = ({
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  limit,
  onStyleChange,
  previewVouchers,
  canUseRealData = true,
  fontStyle,
  fontClassName,
}: VoucherPromotionsPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const previewStyle = normalizeVoucherStyle(selectedStyle ?? DEFAULT_VOUCHER_STYLE);
  const previewLimit = normalizeVoucherLimit(limit);

  const heading = config.texts?.heading || 'Voucher khuyến mãi';
  const description = config.subtitle || config.texts?.description || 'Áp dụng mã để nhận ưu đãi tốt nhất hôm nay.';
  const ctaLabel = config.texts?.ctaLabel || 'Xem tất cả ưu đãi';
  const ctaUrl = config.ctaUrl?.trim() || '/promotions';

  const vouchers = React.useMemo(() => {
    if (config.selectionMode === 'demo') {
      const demoSource = config.demoVouchers && config.demoVouchers.length > 0
        ? config.demoVouchers
        : DEFAULT_DEMO_VOUCHERS;
      return demoSource.slice(0, previewLimit).map((voucher) => ({ ...voucher, _id: voucher.id }));
    }

    return (previewVouchers ?? []).slice(0, previewLimit);
  }, [config.demoVouchers, config.selectionMode, previewLimit, previewVouchers]);

  const validation = React.useMemo(() => getVoucherPromotionsValidationResult({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);
  const tokens = React.useMemo(() => adaptTokensForDarkMode(validation.tokens, isDark), [validation.tokens, isDark]);

  const handleCopy = React.useCallback((code: string) => {
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 1200);
  }, []);

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Voucher khuyến mãi"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={(nextStyle) => onStyleChange?.(nextStyle as VoucherPromotionsStyle)}
        styles={VOUCHER_PROMOTIONS_STYLES}
        info={config.selectionMode === 'demo' ? `${vouchers.length} voucher demo` : `${vouchers.length} voucher thực`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <VoucherPromotionsSectionShared
          context="preview"
          style={previewStyle}
          heading={heading}
          description={description}
          ctaLabel={ctaLabel}
          ctaUrl={ctaUrl}
          showCta={config.showCta ?? true}
          ctaVariant={config.ctaVariant ?? 'button'}
          vouchers={vouchers}
          tokens={tokens}
          copiedCode={copiedCode}
          onCopy={handleCopy}
          currentIndex={currentIndex}
          onCurrentIndexChange={setCurrentIndex}
          device={device}
          hideHeader={config.hideHeader}
          showTitleHeader={config.showTitle}
          showSubtitleHeader={config.showSubtitle}
          showBadge={config.showBadge}
          badgeText={config.badgeText}
          headerAlign={config.headerAlign}
          titleColorPrimary={config.titleColorPrimary}
          subtitleAboveTitle={config.subtitleAboveTitle}
          uppercaseText={config.uppercaseText}
          brandColor={brandColor}
          desktopColumns={config.desktopColumns === 3 ? 3 : 4}
          cornerRadius={config.cornerRadius ?? 'lg'}
          spacing={config.spacing ?? 'normal'}
          iconName={config.iconName}
        />
      </PreviewWrapper>

      {config.selectionMode === 'auto' && !canUseRealData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Module Quảng cáo/Promotions đang tắt nên preview không hiển thị dữ liệu thực.
        </div>
      )}
    </div>
  );
};
