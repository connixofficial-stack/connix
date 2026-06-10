import React from 'react';
import {
  DEFAULT_CAREER_HARMONY,
  normalizeCareerCornerRadius,
  normalizeCareerHarmony,
} from '@/app/admin/home-components/career/_lib/constants';
import { getCareerColorTokens } from '@/app/admin/home-components/career/_lib/colors';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import {
  normalizeCareerConfig,
  normalizeCareerJobs,
  normalizeCareerStyle,
} from '@/app/admin/home-components/career/_lib/normalize';
import { CareerSectionShared } from '@/app/admin/home-components/career/_components/CareerSectionShared';
import type { CareerBrandMode } from '@/app/admin/home-components/career/_types';

interface CareerSectionProps {
  title: string;
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: CareerBrandMode;
  isDark?: boolean;
}

export function CareerSection({
  title,
  config,
  brandColor,
  secondary,
  mode,
  isDark,
}: CareerSectionProps) {
  const normalizedConfig = normalizeCareerConfig(config);
  const normalizedStyle = normalizeCareerStyle(normalizedConfig.style);
  const normalizedJobs = normalizeCareerJobs(normalizedConfig.jobs);
  const harmony = normalizeCareerHarmony(normalizedConfig.harmony ?? DEFAULT_CAREER_HARMONY);

  const tokens = adaptTokensForDarkMode(
    getCareerColorTokens({
      primary: brandColor,
      secondary,
      mode,
      harmony,
    }),
    isDark ?? false
  );

  return (
    <CareerSectionShared
      context="site"
      jobs={normalizedJobs}
      style={normalizedStyle}
      title={title}
      tokens={tokens}
      texts={normalizedConfig.texts}
      spacing={normalizedConfig.spacing}
      desktopColumns={normalizedConfig.desktopColumns}
      cornerRadius={normalizeCareerCornerRadius(normalizedConfig.cornerRadius)}
      logoSize={normalizedConfig.logoSize}
    />
  );
}
