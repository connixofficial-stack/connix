'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from './hooks';
import { resolveTypeOverrideColors } from '@/app/admin/home-components/_shared/lib/typeColorOverride';
import { SpeedDialSection } from './SpeedDialSection';

const normalizeBoolean = (value: unknown, fallback: boolean) => (
  typeof value === 'boolean' ? value : fallback
);

export function GlobalSpeedDial() {
  const components = useQuery(api.homeComponents.listActive);
  const chatbotConfig = useQuery(api.systemIntegrations.getPublicAiConfig);
  const systemColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);

  const resolvedColors = resolveTypeOverrideColors({
    type: 'SpeedDial',
    systemColors,
    overrides: systemConfig?.typeColorOverrides ?? null,
  });

  const speedDialComponent = React.useMemo(() => {
    if (!components) {return null;}

    const speedDials = components
      .filter((item) => item.type === 'SpeedDial' && item.active)
      .sort((a, b) => a.order - b.order);

    return speedDials.find((item) => {
      const config = item.config as Record<string, unknown>;
      return normalizeBoolean(config.showOnAllPages, false);
    }) ?? null;
  }, [components]);

  const chatbotEnabled = chatbotConfig?.enabled === true;

  const speedDialConfig = React.useMemo(() => {
    if (!speedDialComponent) {return null;}
    const config = speedDialComponent.config as Record<string, unknown>;
    const actions = Array.isArray(config.actions) ? config.actions : [];

    // Nếu chatbot bị tắt ở integrations, lọc bỏ các hành động chatbot (có url là '#ai-chatbot')
    const filteredActions = chatbotEnabled
      ? actions
      : actions.filter((action) => {
          if (typeof action === 'object' && action !== null) {
            return (action as Record<string, unknown>).url !== '#ai-chatbot';
          }
          return true;
        });

    return {
      ...config,
      actions: filteredActions,
    };
  }, [speedDialComponent, chatbotEnabled]);

  if (!speedDialComponent || !speedDialConfig) {
    return null;
  }

  return (
    <SpeedDialSection
      config={speedDialConfig}
      brandColor={resolvedColors.primary}
      secondary={resolvedColors.secondary}
      mode={resolvedColors.mode}
      title={speedDialComponent.title ?? chatbotConfig?.widgetTitle ?? 'Trợ lý AI'}
      isDark={isDark}
    />
  );
}
