'use client';

import React from 'react';
import { cn } from '../../../components/ui';
import { normalizeCTAContainerWidth, normalizeCTACornerRadius, normalizeCTAStyle } from '../_lib/constants';
import type { CTAStyleTokens } from '../_lib/colors';
import type { CTAConfig, CTAStyle } from '../_types';
import { normalizeSectionSpacing, type SectionSpacing } from '../../_shared/types/sectionSpacing';

interface CTASectionSharedProps {
  config: CTAConfig;
  style: CTAStyle;
  tokens: CTAStyleTokens;
  context: 'preview' | 'site';
}

const CTA_FALLBACKS = {
  buttonLink: '#',
  buttonText: 'Bắt đầu ngay',
  description: 'Đăng ký ngay để nhận ưu đãi đặc biệt',
  title: 'Sẵn sàng bắt đầu?',
};

const getValue = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const buttonBaseClass = 'inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 text-sm font-bold transition-colors duration-200';

const getRadiusClassNames = (value: CTAConfig['cornerRadius']) => {
  const radius = normalizeCTACornerRadius(value);
  if (radius === 'none') {
    return {
      accent: 'rounded-none',
      badge: 'rounded-none',
      button: 'rounded-none',
      card: 'rounded-none',
    };
  }
  if (radius === 'sm') {
    return {
      accent: 'rounded-md',
      badge: 'rounded-md',
      button: 'rounded-md',
      card: 'rounded-md',
    };
  }
  return {
    accent: 'rounded-full',
    badge: 'rounded-full',
    button: 'rounded-lg',
    card: 'rounded-xl',
  };
};

const getContainerWidthClassName = (value: CTAConfig['containerWidth']) => (
  normalizeCTAContainerWidth(value) === 'full' ? 'w-full' : 'mx-auto max-w-7xl'
);

const getSpacingClassName = (style: CTAStyle, spacing?: SectionSpacing) => {
  const normalizedSpacing = normalizeSectionSpacing(spacing);
  if (normalizedSpacing === 'none') {return 'py-0';}
  if (normalizedSpacing === 'compact') {return 'py-4 md:py-6 lg:py-8';}

  if (style === 'centered') {return 'py-10 md:py-14 lg:py-16';}
  if (style === 'minimal') {return 'py-6 md:py-8 lg:py-10 @max-md/preview:py-6';}
  if (style === 'floating') {return 'py-8 md:py-14 lg:py-16 @max-md/preview:py-8';}
  if (style === 'gradient') {return 'py-8 md:py-12 lg:py-16';}
  return 'py-8 md:py-12 lg:py-14 @max-md/preview:py-8';
};

export function CTASectionShared({ config, style, tokens, context }: CTASectionSharedProps) {
  const normalizedStyle = normalizeCTAStyle(style);
  const HeadingTag = context === 'site' ? 'h2' : 'h3';
  const radiusClassNames = getRadiusClassNames(config.cornerRadius);
  const containerWidthClassName = getContainerWidthClassName(config.containerWidth);
  const spacingClassName = getSpacingClassName(normalizedStyle, config.noVerticalMargin === true ? 'none' : config.spacing);

  const badge = getValue(config.badge);
  const title = getValue(config.title) ?? CTA_FALLBACKS.title;
  const description = getValue(config.description) ?? CTA_FALLBACKS.description;
  const primaryButtonText = getValue(config.buttonText) ?? CTA_FALLBACKS.buttonText;
  const primaryButtonLink = getValue(config.buttonLink) ?? CTA_FALLBACKS.buttonLink;
  const secondaryButtonText = getValue(config.secondaryButtonText);
  const secondaryButtonLink = getValue(config.secondaryButtonLink) ?? CTA_FALLBACKS.buttonLink;

  const sectionClass = context === 'preview' ? 'w-full' : '';

  const primaryButton = (
    <a
      href={primaryButtonLink}
      className={cn(buttonBaseClass, radiusClassNames.button, 'whitespace-nowrap')}
      style={{
        backgroundColor: tokens.primaryButtonBg,
        border: tokens.primaryButtonBorder ? `1px solid ${tokens.primaryButtonBorder}` : undefined,
        color: tokens.primaryButtonText,
      }}
    >
      {primaryButtonText}
    </a>
  );

  const secondaryButton = secondaryButtonText ? (
    <a
      href={secondaryButtonLink}
      className={cn(
        buttonBaseClass,
        radiusClassNames.button,
        'whitespace-nowrap border',
      )}
      style={{
        backgroundColor: tokens.secondaryButtonBg ?? 'transparent',
        borderColor: tokens.secondaryButtonBorder,
        color: tokens.secondaryButtonText,
      }}
    >
      {secondaryButtonText}
    </a>
  ) : null;

  const badgeNode = badge ? (
    <span
      className={cn('mb-3 inline-flex w-fit items-center border px-3 py-1 text-xs font-semibold uppercase tracking-wide', radiusClassNames.badge)}
      style={{
        backgroundColor: tokens.badgeBg,
        borderColor: tokens.badgeBorder ?? 'transparent',
        color: tokens.badgeText,
      }}
    >
      {badge}
    </span>
  ) : null;

  if (normalizedStyle === 'banner') {
    const isFullWidth = normalizeCTAContainerWidth(config.containerWidth) === 'full';

    if (isFullWidth) {
      return (
        <section className={cn('px-4', spacingClassName, sectionClass)} style={{ background: tokens.sectionBg, borderColor: tokens.sectionBorder }}>
          <div className="mx-auto w-full flex flex-col items-center justify-between gap-5 px-4 sm:gap-6 sm:px-6 md:flex-row md:gap-8 @max-md/preview:flex-col @max-md/preview:gap-5 @max-md/preview:px-4">
            <div className="max-w-xl text-center md:text-left @max-md/preview:text-center @max-md/preview:max-w-full">
              {badgeNode}
              <HeadingTag className="text-xl font-bold sm:text-2xl md:text-3xl break-words" style={{ color: tokens.title }}>
                {title}
              </HeadingTag>
              <p className="mt-2 text-sm leading-relaxed sm:text-base break-words" style={{ color: tokens.description }}>
                {description}
              </p>
            </div>
            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-3 @max-md/preview:w-full @max-md/preview:flex-col @max-md/preview:gap-4">
              {primaryButton}
              {secondaryButton}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className={cn('px-4', spacingClassName, sectionClass)}>
        <div
          className={cn(
            'mx-auto max-w-7xl border transition-all duration-200',
            radiusClassNames.card,
            'flex flex-col items-center justify-between gap-5 px-6 py-8 sm:px-8 sm:py-10 md:flex-row md:gap-8 @max-md/preview:flex-col @max-md/preview:gap-5 @max-md/preview:px-6 @max-md/preview:py-8',
          )}
          style={{
            background: tokens.sectionBg,
            borderColor: tokens.sectionBorder ?? '#e2e8f0',
          }}
        >
          <div className="max-w-xl text-center md:text-left @max-md/preview:text-center @max-md/preview:max-w-full">
            {badgeNode}
            <HeadingTag className="text-xl font-bold sm:text-2xl md:text-3xl break-words" style={{ color: tokens.title }}>
              {title}
            </HeadingTag>
            <p className="mt-2 text-sm leading-relaxed sm:text-base break-words" style={{ color: tokens.description }}>
              {description}
            </p>
          </div>
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-3 @max-md/preview:w-full @max-md/preview:flex-col @max-md/preview:gap-4">
            {primaryButton}
            {secondaryButton}
          </div>
        </div>
      </section>
    );
  }

  if (normalizedStyle === 'centered') {
    return (
      <section className={cn('px-4', spacingClassName, sectionClass)} style={{ background: tokens.sectionBg, borderColor: tokens.sectionBorder }}>
        <div className={cn(containerWidthClassName, 'px-4 text-center sm:px-6')}>
          {badgeNode}
          <HeadingTag className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl" style={{ color: tokens.title }}>
            {title}
          </HeadingTag>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed sm:mt-3 sm:text-base" style={{ color: tokens.description }}>
            {description}
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:mt-6 sm:flex-row md:mt-7">
            {primaryButton}
            {secondaryButton}
          </div>
        </div>
      </section>
    );
  }

  if (normalizedStyle === 'split') {
    return (
      <section className={cn('px-4', spacingClassName, sectionClass)} style={{ background: tokens.sectionBg, borderColor: tokens.sectionBorder }}>
        <div
          className={cn(containerWidthClassName, radiusClassNames.card, 'border p-4 transition-colors sm:p-6 md:p-8')}
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.cardBorder,
          }}
        >
          <div className="grid grid-cols-1 items-center gap-5 sm:gap-6 md:grid-cols-[1fr,auto]">
            <div>
              {badgeNode}
              <div className={cn('mb-3 h-1 w-12 sm:mb-4 sm:w-16', radiusClassNames.accent)} style={{ backgroundColor: tokens.accentLine ?? tokens.secondaryButtonBorder }} />
              <HeadingTag className="text-lg font-bold sm:text-xl md:text-2xl" style={{ color: tokens.title }}>
                {title}
              </HeadingTag>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: tokens.description }}>
                {description}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col">
              {primaryButton}
              {secondaryButton}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (normalizedStyle === 'floating') {
    return (
      <section className={cn('px-4', spacingClassName, sectionClass)} style={{ background: tokens.sectionBg }}>
        <div className={cn(containerWidthClassName, 'px-4 sm:px-6 @max-md/preview:px-4')}>
          <div
            className={cn(radiusClassNames.card, 'border p-5 transition-colors sm:p-6 md:p-8 @max-md/preview:p-5')}
            style={{
              backgroundColor: tokens.cardBg,
              borderColor: tokens.cardBorder,
            }}
          >
            <div className="flex flex-col items-center justify-between gap-5 text-center sm:gap-6 md:flex-row md:text-left @max-md/preview:flex-col @max-md/preview:text-center @max-md/preview:gap-5">
              <div className="max-w-2xl @max-md/preview:max-w-full">
                {badgeNode}
                <HeadingTag className="text-lg font-bold sm:text-xl md:text-2xl lg:text-3xl break-words" style={{ color: tokens.title }}>
                  {title}
                </HeadingTag>
                <p className="mt-2 text-sm leading-relaxed sm:text-base break-words" style={{ color: tokens.description }}>
                  {description}
                </p>
              </div>
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-3 @max-md/preview:w-full @max-md/preview:flex-col @max-md/preview:gap-4">
                {primaryButton}
                {secondaryButton}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (normalizedStyle === 'gradient') {
    const isFullWidth = normalizeCTAContainerWidth(config.containerWidth) === 'full';

    if (isFullWidth) {
      return (
        <section className={cn('px-4', spacingClassName, sectionClass)} style={{ background: tokens.sectionBg }}>
          <div className="mx-auto w-full px-4 text-center sm:px-6">
            {badgeNode}
            <HeadingTag className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl" style={{ color: tokens.title }}>
              {title}
            </HeadingTag>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed sm:mt-3 sm:text-base" style={{ color: tokens.description }}>
              {description}
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:mt-6 sm:flex-row md:mt-7">
              {primaryButton}
              {secondaryButton}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className={cn('px-4', spacingClassName, sectionClass)}>
        <div
          className={cn(
            'mx-auto max-w-7xl border transition-all duration-200',
            radiusClassNames.card,
            'px-6 py-8 sm:px-8 sm:py-10 text-center',
          )}
          style={{
            background: tokens.sectionBg,
            borderColor: tokens.sectionBorder ?? 'transparent',
          }}
        >
          {badgeNode}
          <HeadingTag className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl" style={{ color: tokens.title }}>
            {title}
          </HeadingTag>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed sm:mt-3 sm:text-base" style={{ color: tokens.description }}>
            {description}
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:mt-6 sm:flex-row md:mt-7">
            {primaryButton}
            {secondaryButton}
          </div>
        </div>
      </section>
    );
  }

  const isFullWidth = normalizeCTAContainerWidth(config.containerWidth) === 'full';

  if (isFullWidth) {
    return (
      <section
        className={cn('border-y px-4 transition-colors', spacingClassName, sectionClass)}
        style={{
          background: tokens.sectionBg,
          borderColor: tokens.sectionBorder,
        }}
      >
        <div className="mx-auto w-full flex flex-col items-center justify-between gap-4 px-4 sm:gap-5 sm:px-6 md:flex-row md:gap-8 @max-md/preview:flex-col @max-md/preview:gap-4 @max-md/preview:px-4">
          <div className="flex items-center gap-3 text-center sm:gap-4 md:text-left @max-md/preview:text-center">
            <div className={cn('block h-8 w-1 sm:h-12 md:h-14', radiusClassNames.accent)} style={{ backgroundColor: tokens.accentLine }} />
            <div>
              <HeadingTag className="text-lg font-bold sm:text-xl break-words" style={{ color: tokens.title }}>
                {title}
              </HeadingTag>
              <p className="mt-1 text-sm leading-relaxed sm:text-base break-words" style={{ color: tokens.description }}>
                {description}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-3 @max-md/preview:w-full @max-md/preview:flex-col @max-md/preview:gap-4">
            {primaryButton}
            {secondaryButton}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('px-4', spacingClassName, sectionClass)}>
      <div
        className={cn(
          'mx-auto max-w-7xl border transition-all duration-200',
          radiusClassNames.card,
          'flex flex-col items-center justify-between gap-4 px-6 py-8 sm:gap-5 sm:px-8 sm:py-10 md:flex-row md:gap-8 @max-md/preview:flex-col @max-md/preview:gap-4 @max-md/preview:px-6 @max-md/preview:py-8',
        )}
        style={{
          background: tokens.sectionBg,
          borderColor: tokens.sectionBorder ?? '#e2e8f0',
        }}
      >
        <div className="flex items-center gap-3 text-center sm:gap-4 md:text-left @max-md/preview:text-center">
          <div className={cn('block h-8 w-1 sm:h-12 md:h-14', radiusClassNames.accent)} style={{ backgroundColor: tokens.accentLine }} />
          <div>
            <HeadingTag className="text-lg font-bold sm:text-xl break-words" style={{ color: tokens.title }}>
              {title}
            </HeadingTag>
            <p className="mt-1 text-sm leading-relaxed sm:text-base break-words" style={{ color: tokens.description }}>
              {description}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-3 @max-md/preview:w-full @max-md/preview:flex-col @max-md/preview:gap-4">
          {primaryButton}
          {secondaryButton}
        </div>
      </div>
    </section>
  );
}
