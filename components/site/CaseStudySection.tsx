'use client';

import React from 'react';
import { CaseStudySectionShared } from '@/app/admin/home-components/case-study/_components/CaseStudySectionShared';
import { getCaseStudyColors } from '@/app/admin/home-components/case-study/_lib/colors';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import type { CaseStudyBrandMode, CaseStudyProject } from '@/app/admin/home-components/case-study/_types';
import {
  normalizeCaseStudyCornerRadius,
  normalizeCaseStudyDesktopColumns,
  normalizeCaseStudySpacing,
  normalizeCaseStudyStyle,
} from '@/app/admin/home-components/case-study/_types';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';

interface CaseStudySectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: CaseStudyBrandMode;
  title: string;
  isDark?: boolean;
}

const normalizeProjects = (input: unknown): CaseStudyProject[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, idx) => {
    const record = (typeof item === 'object' && item !== null) ? item as Record<string, unknown> : {};

    const toText = (value: unknown) => {
      if (typeof value === 'string') {return value;}
      if (typeof value === 'number') {return String(value);}
      return '';
    };

    const rawId = record.id;
    const id = typeof rawId === 'number' || typeof rawId === 'string'
      ? rawId
      : idx + 1;

    return {
      id,
      title: toText(record.title),
      category: toText(record.category),
      image: toText(record.image),
      description: toText(record.description),
      link: toText(record.link),
    };
  });
};

export function CaseStudySection({ config, brandColor, secondary, mode, title, isDark }: CaseStudySectionProps) {
  const style = normalizeCaseStudyStyle(config.style);
  const headerConfig = extractSectionHeaderConfig(config);
  const spacing = normalizeCaseStudySpacing(config.spacing, config.noVerticalMargin);
  const cornerRadius = normalizeCaseStudyCornerRadius(config.cornerRadius, config.noBorderRadius);
  const desktopColumns = normalizeCaseStudyDesktopColumns(config.desktopColumns);

  const projects = React.useMemo(() => normalizeProjects(config.projects), [config.projects]);

  const tokens = React.useMemo(() => (
    adaptTokensForDarkMode(
      getCaseStudyColors(brandColor, secondary, mode),
      isDark ?? false
    )
  ), [brandColor, secondary, mode, isDark]);

  return (
    <CaseStudySectionShared
      projects={projects}
      style={style}
      mode={mode}
      tokens={tokens}
      context="site"
      title={title}
      hideHeader={headerConfig.hideHeader}
      showTitle={headerConfig.showTitle}
      subtitle={headerConfig.subtitle}
      showSubtitle={headerConfig.showSubtitle}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      showBadge={headerConfig.showBadge}
      badgeText={headerConfig.badgeText}
      cornerRadius={cornerRadius}
      desktopColumns={desktopColumns}
      spacing={spacing}
    />
  );
}
