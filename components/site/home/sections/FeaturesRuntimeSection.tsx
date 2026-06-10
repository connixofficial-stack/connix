'use client';

import React from 'react';
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { FeaturesSectionShared } from '@/app/admin/home-components/features/_components/FeaturesSectionShared';
import { normalizeFeaturesCornerRadius, type FeatureItem, type FeaturesStyle } from '@/app/admin/home-components/features/_types';
import { normalizeSectionSpacing } from '@/app/admin/home-components/_shared/types/sectionSpacing';
import type { HomeComponentSectionProps } from '../types';


export function FeaturesRuntimeSection({ config, brandColor, secondary, mode, title, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const items = Array.isArray(config.items) ? (config.items as FeatureItem[]) : [];
  const style = (config.style as FeaturesStyle) ?? 'carousel6';
  const showIcons = config.showIcons !== false;
  const headerConfig = extractSectionHeaderConfig(config);
  const isFullwidthCarousel = style === 'carousel6';
  const spacing = config.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(headerConfig.spacing);
  const cornerRadius = normalizeFeaturesCornerRadius(config.cornerRadius, config.noBorderRadius);

  return (
    <section className={isFullwidthCarousel ? 'py-0 w-full overflow-hidden' : 'py-8 px-3'}>
      <div className={isFullwidthCarousel ? 'w-full' : 'mx-auto max-w-7xl'}>
        <div className={isFullwidthCarousel ? 'mx-auto max-w-7xl px-3 pt-8' : undefined}>
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
        </div>
        <FeaturesSectionShared
          items={items}
          style={style}
          showIcons={showIcons}
          title={title}
          brandColor={brandColor}
          secondary={secondary}
          mode={mode}
          context="site"
          skipHeader={true}
          spacing={spacing}
          desktopColumns={config.desktopColumns === 4 ? 4 : 3}
          cornerRadius={cornerRadius}
          isDark={isDark}
        />
      </div>
    </section>
  );
}
