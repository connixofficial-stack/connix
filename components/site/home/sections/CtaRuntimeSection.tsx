'use client';

import React from 'react';
import { CTASectionShared } from '@/app/admin/home-components/cta/_components/CTASectionShared';
import { getCTAThemeTokens } from '@/app/admin/home-components/cta/_lib/colors';
import { normalizeCTAStyle } from '@/app/admin/home-components/cta/_lib/constants';
import type { CTAConfig, CTAStyle } from '@/app/admin/home-components/cta/_types';
import type { HomeComponentSectionProps } from '../types';

export function CtaRuntimeSection({ config, brandColor, secondary, mode, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const ctaConfig = config as Partial<CTAConfig> & { style?: CTAStyle };
  const style = normalizeCTAStyle(ctaConfig.style);
  const tokens = getCTAThemeTokens({ primary: brandColor, secondary, mode, style, isDark: isDark ?? false });

  return (
    <CTASectionShared
      config={{
        badge: ctaConfig.badge ?? '',
        buttonLink: ctaConfig.buttonLink ?? '',
        buttonText: ctaConfig.buttonText ?? '',
        description: ctaConfig.description ?? '',
        secondaryButtonLink: ctaConfig.secondaryButtonLink ?? '',
        secondaryButtonText: ctaConfig.secondaryButtonText ?? '',
        spacing: ctaConfig.spacing,
        cornerRadius: ctaConfig.cornerRadius,
        noBorderRadius: ctaConfig.noBorderRadius,
        noVerticalMargin: ctaConfig.noVerticalMargin,
        containerWidth: ctaConfig.containerWidth,
        title: ctaConfig.title ?? '',
      }}
      style={style}
      tokens={tokens}
      context="site"
    />
  );
}
