'use client';

import React from 'react';
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { getSectionSpacingClassName } from '@/app/admin/home-components/_shared/types/sectionSpacing';
import { BenefitsSectionShared } from '@/app/admin/home-components/benefits/_components/BenefitsSectionShared';
import { getBenefitsSectionColors, normalizeBenefitsHarmony, normalizeBenefitsStyle } from '@/app/admin/home-components/benefits/_lib/colors';
import { normalizeBenefitsCornerRadius, normalizeBenefitsSpacing } from '@/app/admin/home-components/benefits/_lib/constants';
import type { BenefitItem, BenefitsBrandMode, BenefitsConfig, BenefitsStyle } from '@/app/admin/home-components/benefits/_types';
import type { HomeComponentSectionProps } from '../types';

import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export function BenefitsRuntimeSection({ config, brandColor, secondary, mode, title, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const benefitsConfig = config as unknown as Partial<BenefitsConfig>;
  const items: BenefitItem[] = (benefitsConfig.items ?? []).map((item, idx) => ({
    description: item.description ?? '',
    icon: item.icon ?? 'Check',
    id: `benefits-site-${idx}`,
    title: item.title ?? '',
  }));

  const style: BenefitsStyle = normalizeBenefitsStyle(benefitsConfig.style);
  const harmony = normalizeBenefitsHarmony(benefitsConfig.harmony);
  const tokens = adaptTokensForDarkMode(getBenefitsSectionColors({
    harmony,
    mode: mode as BenefitsBrandMode,
    primary: brandColor,
    secondary,
  }), isDark ?? false);

  const headerConfig = extractSectionHeaderConfig(config);
  const sectionSpacingClassName = getSectionSpacingClassName(normalizeBenefitsSpacing(benefitsConfig.spacing, benefitsConfig.noVerticalMargin));
  const cornerRadius = normalizeBenefitsCornerRadius(benefitsConfig.cornerRadius, benefitsConfig.noBorderRadius);

  return (
    <section className={`${sectionSpacingClassName} px-3`}>
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title={title}
          subtitle={headerConfig.subtitle}
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

        <BenefitsSectionShared
          context="site"
          style={style}
          title={title}
          config={{
            buttonLink: benefitsConfig.buttonLink,
            buttonText: benefitsConfig.buttonText,
            cornerRadius,
            gridColumnsDesktop: benefitsConfig.gridColumnsDesktop,
            gridColumnsMobile: benefitsConfig.gridColumnsMobile,
            heading: benefitsConfig.heading,
            headerAlign: benefitsConfig.headerAlign,
            highlightIndex: benefitsConfig.highlightIndex,
            showDecorativeVisuals: benefitsConfig.showDecorativeVisuals,
            showItemNumbers: benefitsConfig.showItemNumbers,
            subHeading: benefitsConfig.subHeading,
            visualImage: benefitsConfig.visualImage,
          }}
          items={items}
          tokens={tokens}
          mode={mode as BenefitsBrandMode}
          skipHeader={true}
        />
      </div>
    </section>
  );
}
