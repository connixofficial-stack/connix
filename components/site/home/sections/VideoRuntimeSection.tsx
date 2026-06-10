'use client';

import React from 'react';
import { VideoSectionShared } from '@/app/admin/home-components/video/_components/VideoSectionShared';
import { getVideoColorTokens } from '@/app/admin/home-components/video/_lib/colors';
import { normalizeVideoConfig, normalizeVideoStyle } from '@/app/admin/home-components/video/_lib/constants';
import type { VideoBrandMode } from '@/app/admin/home-components/video/_types';
import type { HomeComponentSectionProps } from '../types';

import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export function VideoRuntimeSection({ config, brandColor, secondary, mode, title, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const videoConfig = normalizeVideoConfig(config);
  const style = normalizeVideoStyle(videoConfig.style);

  const tokens = adaptTokensForDarkMode(getVideoColorTokens({
    primary: brandColor,
    secondary,
    mode: mode as VideoBrandMode,
    style,
  }), isDark ?? false);

  return (
    <VideoSectionShared
      context="site"
      style={style}
      title={title}
      config={{ ...videoConfig, style }}
      tokens={tokens}
      brandColor={brandColor}
    />
  );
}
