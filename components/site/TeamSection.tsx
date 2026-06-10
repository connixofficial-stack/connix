'use client';

import React from 'react';
import {
  normalizeTeamConfig,
  normalizeTeamStyle,
} from '@/app/admin/home-components/team/_lib/constants';
import { getTeamColorTokens } from '@/app/admin/home-components/team/_lib/colors';
import { TeamSectionShared } from '@/app/admin/home-components/team/_components/TeamSectionShared';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import type {
  TeamBrandMode,
  TeamStyle,
} from '@/app/admin/home-components/team/_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface TeamSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: TeamBrandMode;
  title: string;
  isDark?: boolean;
}

export function TeamSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  isDark,
}: TeamSectionProps) {
  const normalizedConfig = normalizeTeamConfig(config);
  const style = normalizeTeamStyle((normalizedConfig.style as TeamStyle | undefined) ?? 'grid');

  const tokens = React.useMemo(() => {
    const rawTokens = getTeamColorTokens({
      primary: brandColor,
      secondary,
      mode,
    });
    return adaptTokensForDarkMode(rawTokens, isDark ?? false);
  }, [brandColor, secondary, mode, isDark]);

  const sectionTitle = (title || '').trim().length > 0
    ? title
    : 'Đội ngũ của chúng tôi';

  const safeMembers = Array.isArray(normalizedConfig.members)
    ? normalizedConfig.members
    : normalizeTeamConfig({}).members;

  const headerConfig = extractSectionHeaderConfig(config);

  return (
    <TeamSectionShared
      context="site"
      members={safeMembers}
      style={style}
      title={sectionTitle}
      tokens={tokens}
      mode={mode}
      carouselId="team-site-carousel"
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
      spacing={normalizedConfig.spacing}
      desktopColumns={normalizedConfig.desktopColumns}
      cornerRadius={normalizedConfig.cornerRadius}
    />
  );
}
