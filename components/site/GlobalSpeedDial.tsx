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

const CHATBOT_ACTION = {
  bgColor: '#2563eb',
  icon: 'message-circle',
  label: 'Chat AI',
  uiKey: 'ai-chatbot',
  url: '#ai-chatbot',
};

const withChatbotAction = (config: Record<string, unknown>, enabled: boolean) => {
  if (!enabled) {return config;}
  const actions = Array.isArray(config.actions) ? config.actions : [];
  const hasChatbot = actions.some((action) => (
    typeof action === 'object'
    && action !== null
    && (action as Record<string, unknown>).url === CHATBOT_ACTION.url
  ));
  if (hasChatbot) {return config;}
  return { ...config, actions: [...actions, CHATBOT_ACTION] };
};

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

  if (!speedDialComponent && !chatbotEnabled) {
    return null;
  }

  const speedDialConfig = speedDialComponent
    ? withChatbotAction(speedDialComponent.config as Record<string, unknown>, chatbotEnabled)
    : {
      actions: [CHATBOT_ACTION],
      defaultOpen: true,
      enableShadow: true,
      position: 'bottom-right',
      showOnAllPages: true,
      style: 'fab',
    };

  return (
    <SpeedDialSection
      config={speedDialConfig}
      brandColor={resolvedColors.primary}
      secondary={resolvedColors.secondary}
      mode={resolvedColors.mode}
      title={speedDialComponent?.title ?? chatbotConfig?.widgetTitle ?? 'Trợ lý AI'}
      isDark={isDark}
    />
  );
}
