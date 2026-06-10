'use client';

import React, { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PageViewTracker } from '@/components/PageViewTracker';

type TelemetryGateProps = {
  includeAnalytics?: boolean;
  includePageView?: boolean;
  includeSpeedInsights?: boolean;
};

export function TelemetryGate({
  includeAnalytics = false,
  includePageView = false,
  includeSpeedInsights = false,
}: TelemetryGateProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const enable = () => setEnabled(true);
    const canIdle = typeof window.requestIdleCallback === 'function';
    const handle = canIdle
      ? window.requestIdleCallback(enable, { timeout: 1500 })
      : window.setTimeout(enable, 1500);

    const onInteract = () => {
      enable();
    };

    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    window.addEventListener('scroll', onInteract, { once: true, passive: true });

    return () => {
      if (canIdle) {
        window.cancelIdleCallback(handle as number);
      } else {
        window.clearTimeout(handle as number);
      }
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('scroll', onInteract);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      {includePageView && <PageViewTracker />}
      {includeAnalytics && <Analytics />}
      {includeSpeedInsights && <SpeedInsights />}
    </>
  );
}
