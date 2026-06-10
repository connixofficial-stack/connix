'use client';

import React from 'react';
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { getSectionSpacingClassName, normalizeSectionSpacing } from '@/app/admin/home-components/_shared/types/sectionSpacing';
import { ClientsSectionShared, normalizeClientsStyleSafe } from '@/app/admin/home-components/clients/_components/ClientsSectionShared';
import { getClientsColorTokens } from '@/app/admin/home-components/clients/_lib/colors';
import { normalizeClientItems } from '@/app/admin/home-components/clients/_lib/items';
import type { ClientsConfig } from '@/app/admin/home-components/clients/_types';
import { normalizeClientsCornerRadius } from '@/app/admin/home-components/clients/_types';
import type { HomeComponentSectionProps } from '../types';

import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export function ClientsRuntimeSection({ config, brandColor, secondary, mode, title, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const clientsConfig = config as Partial<ClientsConfig>;
  const items = normalizeClientItems(clientsConfig.items);
  if (items.length === 0) {return null;}

  const style = normalizeClientsStyleSafe(clientsConfig.style);
  const tokens = adaptTokensForDarkMode(getClientsColorTokens({ primary: brandColor, secondary, mode }), isDark ?? false);
  const headerConfig = extractSectionHeaderConfig(config);
  const spacing = clientsConfig.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(clientsConfig.spacing);
  const cornerRadius = normalizeClientsCornerRadius(clientsConfig.cornerRadius, clientsConfig.noBorderRadius);

  return (
    <section className={`${getSectionSpacingClassName(spacing)} px-3`} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title={title}
          subtitle={headerConfig.subtitle}
          badgeText={headerConfig.badgeText}
          hideHeader={headerConfig.hideHeader}
          showTitle={headerConfig.showTitle}
          showSubtitle={headerConfig.showSubtitle}
          showBadge={headerConfig.showBadge}
          headerAlign={headerConfig.headerAlign}
          titleColorPrimary={headerConfig.titleColorPrimary}
          subtitleAboveTitle={headerConfig.subtitleAboveTitle}
          uppercaseText={headerConfig.uppercaseText}
          brandColor={brandColor}
        />
        <ClientsSectionShared
          context="site"
          title={title}
          style={style}
          items={items}
          tokens={tokens}
          skipHeader={true}
          spacing={spacing}
          cornerRadius={cornerRadius}
          brandColor={brandColor}
        />
      </div>
    </section>
  );
}
