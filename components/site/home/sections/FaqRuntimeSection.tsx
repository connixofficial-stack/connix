'use client';

import React from 'react';
import { cn } from '@/app/admin/components/ui';
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { FaqSectionShared } from '@/app/admin/home-components/faq/_components/FaqSectionShared';
import { getFaqColors } from '@/app/admin/home-components/faq/_lib/colors';
import {
  getFaqSectionSpacingClassName,
  normalizeFaqDesktopColumns,
  normalizeFaqRounded,
  normalizeFaqSpacing,
  type FaqConfig,
  type FaqItem,
  type FaqStyle,
} from '@/app/admin/home-components/faq/_types';
import type { HomeComponentSectionProps } from '../types';

import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export function FaqRuntimeSection({ config, brandColor, secondary, mode, title, isDark }: HomeComponentSectionProps & { isDark?: boolean }) {
  const faqConfig = config as FaqConfig & { items?: Array<{ question?: string; answer?: string }>; style?: FaqStyle };
  const items: FaqItem[] = (faqConfig.items ?? []).map((item, idx) => ({
    answer: item.answer ?? '',
    id: idx,
    question: item.question ?? '',
  }));
  const style: FaqStyle = faqConfig.style ?? 'wine-list';
  const tokens = adaptTokensForDarkMode(getFaqColors({ primary: brandColor, secondary, mode, style }), isDark ?? false);
  const headerConfig = extractSectionHeaderConfig(config);
  const spacingClassName = getFaqSectionSpacingClassName(normalizeFaqSpacing(faqConfig.spacing, faqConfig.noVerticalMargin));
  const rounded = normalizeFaqRounded(faqConfig.cornerRadius ?? faqConfig.rounded, faqConfig.noBorderRadius);
  const desktopColumns = normalizeFaqDesktopColumns(faqConfig.desktopColumns);
  const hasSharedHeader = !headerConfig.hideHeader && (
    (headerConfig.showTitle && title.trim().length > 0)
    || (headerConfig.showSubtitle && (headerConfig.subtitle?.trim().length ?? 0) > 0)
    || (headerConfig.showBadge && (headerConfig.badgeText?.trim().length ?? 0) > 0)
  );
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className={cn(style === 'cards' ? 'px-1 sm:px-3' : 'px-3', spacingClassName)}>
        <div className="mx-auto max-w-7xl space-y-6">
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
          <FaqSectionShared
            items={items}
            title={title}
            style={style}
            config={{
              buttonLink: faqConfig.buttonLink,
              buttonText: faqConfig.buttonText,
              description: faqConfig.description,
              desktopColumns,
              cornerRadius: rounded,
              rounded,
              spacing: normalizeFaqSpacing(faqConfig.spacing, faqConfig.noVerticalMargin),
            }}
            tokens={tokens}
            context="site"
            suppressInternalHeader={hasSharedHeader}
            spacingClassName="py-0"
            rounded={rounded}
            desktopColumns={desktopColumns}
          />
        </div>
      </section>
    </>
  );
}
