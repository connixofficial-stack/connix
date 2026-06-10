'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { normalizeVoucherLimit, normalizeVoucherStyle } from '@/lib/home-components/voucher-promotions';
import {
  DEFAULT_DEMO_VOUCHERS,
  normalizeDemoVouchers,
  normalizeVoucherPromotionsCornerRadius,
  normalizeVoucherPromotionsTexts,
} from '@/app/admin/home-components/voucher-promotions/_lib/constants';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { getVoucherPromotionsColorTokens } from '@/app/admin/home-components/voucher-promotions/_lib/colors';
import { VoucherPromotionsSectionShared } from '@/app/admin/home-components/voucher-promotions/_components/VoucherPromotionsSectionShared';
import type {
  VoucherPromotionItem,
  VoucherPromotionsBrandMode,
  VoucherPromotionsSelectionMode,
  VoucherPromotionsTexts,
} from '@/app/admin/home-components/voucher-promotions/_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface VoucherPromotionsSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: VoucherPromotionsBrandMode;
  title: string;
  isDark?: boolean;
}

export function VoucherPromotionsSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  isDark,
}: VoucherPromotionsSectionProps) {
  const texts = normalizeVoucherPromotionsTexts({
    heading: (config.texts as VoucherPromotionsTexts | undefined)?.heading ?? (config.heading as string | undefined),
    description: (config.texts as VoucherPromotionsTexts | undefined)?.description ?? (config.description as string | undefined),
    ctaLabel: (config.texts as VoucherPromotionsTexts | undefined)?.ctaLabel ?? (config.ctaLabel as string | undefined),
  });

  const heading = title || texts.heading || 'Voucher khuyến mãi';
  const headerConfig = extractSectionHeaderConfig(config);
  const description = headerConfig.subtitle || texts.description;
  const ctaLabel = texts.ctaLabel;
  const ctaUrl = (config.ctaUrl as string) || '/promotions';
  const showCta = typeof config.showCta === 'boolean' ? config.showCta : true;
  const ctaVariant = config.ctaVariant === 'textRight' ? 'textRight' : 'button';
  const limit = normalizeVoucherLimit(config.limit as number | undefined);
  const style = normalizeVoucherStyle(config.style as string | undefined);
  const desktopColumns = config.desktopColumns === 3 ? 3 : 4;
  const cornerRadius = normalizeVoucherPromotionsCornerRadius(config.cornerRadius, config.noBorderRadius);
  const spacing = config.noVerticalMargin === true && config.spacing === undefined ? 'none' : headerConfig.spacing;
  const iconName = typeof config.iconName === 'string' ? config.iconName : 'BadgePercent';
  const selectionMode: VoucherPromotionsSelectionMode = config.selectionMode === 'demo' ? 'demo' : 'auto';
  const demoVouchers = normalizeDemoVouchers(config.demoVouchers as Partial<VoucherPromotionItem>[] | undefined);

  const promotionsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'promotions' });
  const canUseRealData = promotionsModule?.enabled === true;
  const vouchers = useQuery(
    api.promotions.listPublicVouchers,
    selectionMode === 'auto' && canUseRealData ? { limit } : 'skip',
  ) as VoucherPromotionItem[] | undefined;
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const tokens = React.useMemo(() => {
    const rawTokens = getVoucherPromotionsColorTokens({
      primary: brandColor,
      secondary,
      mode,
    });
    return adaptTokensForDarkMode(rawTokens, isDark ?? false);
  }, [brandColor, secondary, mode, isDark]);

  const displayVouchers = React.useMemo(() => {
    if (selectionMode === 'demo') {
      const source = demoVouchers.length > 0 ? demoVouchers : DEFAULT_DEMO_VOUCHERS;
      return source.slice(0, limit).map((voucher) => ({ ...voucher, _id: voucher.id }));
    }

    return vouchers;
  }, [demoVouchers, limit, selectionMode, vouchers]);

  if (selectionMode === 'auto' && promotionsModule === undefined) {
    return null;
  }

  if (selectionMode === 'auto' && !canUseRealData) {
    return null;
  }

  if (!displayVouchers) {
    return null;
  }

  if (displayVouchers.length === 0) {
    return (
      <section className="py-12 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto text-center">
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-slate-200 p-3">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có voucher nào</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Component này sẽ hiển thị khi có ít nhất 1 promotion với:
                  <br />• Status = "Active"
                  <br />• Có mã voucher (code)
                  <br />• Chưa hết hạn
                </p>
                <p className="text-sm text-slate-600 mt-3">
                  Vào <Link href="/admin/promotions" className="text-blue-600 hover:underline font-medium">Quản lý Promotions</Link> để tạo voucher mới.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 1800);
    } catch {
      setCopiedCode(null);
    }
  };

  return (
    <VoucherPromotionsSectionShared
      context="site"
      style={style}
      heading={heading}
      description={description}
      ctaLabel={ctaLabel}
      ctaUrl={ctaUrl}
      showCta={showCta}
      ctaVariant={ctaVariant}
      vouchers={displayVouchers}
      tokens={tokens}
      copiedCode={copiedCode}
      onCopy={(code) => {
        void handleCopy(code);
      }}
      currentIndex={currentIndex}
      onCurrentIndexChange={setCurrentIndex}
      hideHeader={headerConfig.hideHeader}
      showTitleHeader={headerConfig.showTitle}
      showSubtitleHeader={headerConfig.showSubtitle}
      showBadge={headerConfig.showBadge}
      badgeText={headerConfig.badgeText}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      brandColor={brandColor}
      desktopColumns={desktopColumns}
      cornerRadius={cornerRadius}
      spacing={spacing}
      iconName={iconName}
    />
  );
}
