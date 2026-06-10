'use client';

import React from 'react';
import { CountdownSectionShared } from '@/app/admin/home-components/countdown/_components/CountdownSectionShared';
import { getCountdownColorTokens } from '@/app/admin/home-components/countdown/_lib/colors';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import { normalizeCountdownConfig } from '@/app/admin/home-components/countdown/_lib/normalize';
import { useCountdownTimer } from '@/app/admin/home-components/countdown/_lib/timer';
import type { CountdownBrandMode } from '@/app/admin/home-components/countdown/_types';

interface CountdownSectionWrapperProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  title: string;
  isDark?: boolean;
}

export function CountdownSectionWrapper({ config, brandColor, secondary, title, isDark }: CountdownSectionWrapperProps) {
  const mode: CountdownBrandMode = 'dual';
  const normalizedConfig = normalizeCountdownConfig(config);
  const tokens = adaptTokensForDarkMode(
    getCountdownColorTokens({
      primary: brandColor,
      secondary,
      mode,
    }),
    isDark ?? false
  );
  const timeLeft = useCountdownTimer(normalizedConfig.endDate);

  const [isPopupDismissed, setIsPopupDismissed] = React.useState(() => {
    if (typeof window === 'undefined') {return false;}
    return sessionStorage.getItem('countdown-popup-dismissed') === 'true';
  });

  const dismissPopup = () => {
    setIsPopupDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('countdown-popup-dismissed', 'true');
    }
  };

  return (
    <CountdownSectionShared
      config={normalizedConfig}
      title={title}
      mode={mode}
      tokens={tokens}
      timeLeft={timeLeft}
      context="site"
      isPopupDismissed={isPopupDismissed}
      onDismissPopup={dismissPopup}
    />
  );
}
