'use client';

import React from 'react';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { ProcessSectionShared } from '@/app/admin/home-components/process/_components/ProcessSectionShared';
import { normalizeProcessConfig, normalizeProcessRenderSteps } from '@/app/admin/home-components/process/_lib/normalize';
import type { ProcessBrandMode, ProcessStyle } from '@/app/admin/home-components/process/_types';
import type { HomeComponentSectionProps } from '../types';


export function ProcessRuntimeSection({ config, brandColor, secondary, mode, title, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const rawSteps = Array.isArray(config.steps) ? config.steps : [];
  const steps = normalizeProcessRenderSteps(rawSteps);
  const normalizedConfig = normalizeProcessConfig(config);

  const style: ProcessStyle = (
    config.style === 'horizontal'
    || config.style === 'stepper'
    || config.style === 'cards'
    || config.style === 'accordion'
    || config.style === 'minimal'
    || config.style === 'compactMinimal'
    || config.style === 'grid'
    || config.style === 'alternating'
    || config.style === 'circular'
  )
    ? config.style as ProcessStyle
    : 'horizontal';

  const headerConfig = extractSectionHeaderConfig(config);

  const rawDesktopCols = config.desktopColumns;
  const desktopColumns: 3 | 4 = rawDesktopCols === 3 ? 3 : 4;

  return (
    <section className="px-3">
      <div className="mx-auto max-w-7xl">
        <ProcessSectionShared
          steps={steps}
          sectionTitle={title || ''}
          style={style}
          brandColor={brandColor}
          secondary={secondary}
          mode={mode as ProcessBrandMode}
          context="site"
          hideHeader={headerConfig.hideHeader}
          showTitle={headerConfig.showTitle}
          showSubtitle={headerConfig.showSubtitle}
          subtitle={headerConfig.subtitle}
          headerAlign={headerConfig.headerAlign}
          titleColorPrimary={headerConfig.titleColorPrimary}
          subtitleAboveTitle={headerConfig.subtitleAboveTitle}
          uppercaseText={headerConfig.uppercaseText}
          showBadge={headerConfig.showBadge}
          badgeText={headerConfig.badgeText}
          desktopColumns={desktopColumns}
          spacing={normalizedConfig.spacing}
          cornerRadius={normalizedConfig.cornerRadius}
          circularCtaText={normalizedConfig.circularCtaText}
          circularCtaLink={normalizedConfig.circularCtaLink}
          isDark={isDark}
        />
      </div>
    </section>
  );
}
