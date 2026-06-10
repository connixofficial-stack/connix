'use client';

import React from 'react';
import {
  normalizeVideoConfig,
  normalizeVideoStyle,
} from '@/app/admin/home-components/video/_lib/constants';
import { getVideoColorTokens } from '@/app/admin/home-components/video/_lib/colors';
import { VideoSectionShared } from '@/app/admin/home-components/video/_components/VideoSectionShared';
import type { VideoBrandMode } from '@/app/admin/home-components/video/_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

interface VideoSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: VideoBrandMode;
  title: string;
  isDark?: boolean;
}

export function VideoSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
  isDark,
}: VideoSectionProps) {
  const normalizedConfig = normalizeVideoConfig(config);
  const style = normalizeVideoStyle(normalizedConfig.style);

  const tokens = React.useMemo(() => {
    const rawTokens = getVideoColorTokens({
      primary: brandColor,
      secondary,
      mode,
      style,
    });
    return adaptTokensForDarkMode(rawTokens, isDark ?? false);
  }, [brandColor, secondary, mode, style, isDark]);

  return (
    <VideoSectionShared
      context="site"
      config={{ ...normalizedConfig, style }}
      style={style}
      tokens={tokens}
      title={title}
      device="desktop"
    />
  );
}
