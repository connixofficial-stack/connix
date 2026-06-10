'use client';

import React from 'react';
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { getSectionSpacingClassName, normalizeSectionSpacing } from '@/app/admin/home-components/_shared/types/sectionSpacing';
import {
  normalizePricingConfig,
} from '@/app/admin/home-components/pricing/_lib/constants';
import {
  getPricingColorTokens,
} from '@/app/admin/home-components/pricing/_lib/colors';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import { PricingSectionShared } from '@/app/admin/home-components/pricing/_components/PricingSectionShared';
import type {
  PricingBrandMode,
  PricingConfig,
  PricingStyle,
} from '@/app/admin/home-components/pricing/_types';

interface PricingSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: PricingBrandMode;
  title: string;
  isDark?: boolean;
}

export function PricingSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  isDark,
}: PricingSectionProps) {
  const safeConfig = normalizePricingConfig(config as Partial<PricingConfig>);

  const style = safeConfig.style as PricingStyle;
  const subtitle = String(safeConfig.subtitle ?? 'Chọn gói phù hợp với nhu cầu của bạn');

  const tokens = adaptTokensForDarkMode(
    getPricingColorTokens({
      primary: brandColor,
      secondary,
      mode,
    }),
    isDark ?? false
  );

  const [isYearly, setIsYearly] = React.useState(false);
  
  // Extract header config
  const headerConfig = extractSectionHeaderConfig(config);
  const sectionSpacingClassName = getSectionSpacingClassName(normalizeSectionSpacing(safeConfig.spacing));

  return (
    <section className={`${sectionSpacingClassName} px-3`}>
      <div className="@container max-w-7xl mx-auto">
        <SectionHeader
          title={title}
          subtitle={headerConfig.subtitle || subtitle}
          badgeText={headerConfig.badgeText}
          hideHeader={headerConfig.hideHeader}
          showTitle={headerConfig.showTitle}
          showSubtitle={headerConfig.showSubtitle}
          showBadge={headerConfig.showBadge}
          headerAlign={headerConfig.headerAlign}
          titleColorPrimary={headerConfig.titleColorPrimary}
          subtitleAboveTitle={headerConfig.subtitleAboveTitle}
          uppercaseText={headerConfig.uppercaseText}
          brandColor={brandColor}
        />
        
        <PricingSectionShared
          context="site"
          title={title}
          subtitle={subtitle}
          plans={safeConfig.plans}
          style={style}
          mode={mode}
          tokens={tokens}
          texts={safeConfig.texts ?? {}}
          isYearly={isYearly}
          showBillingToggle={safeConfig.showBillingToggle !== false}
          monthlyLabel={String(safeConfig.monthlyLabel ?? 'Hàng tháng')}
          yearlyLabel={String(safeConfig.yearlyLabel ?? 'Hàng năm')}
          yearlySavingText={String(safeConfig.yearlySavingText ?? 'Tiết kiệm 17%')}
          onBillingToggle={setIsYearly}
          skipHeader={true}
          gridCols={safeConfig.gridCols === 4 ? 4 : 3}
          cornerRadius={safeConfig.cornerRadius}
        />
      </div>
    </section>
  );
}
