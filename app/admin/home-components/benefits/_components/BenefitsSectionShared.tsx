'use client';

import React from 'react';
import {
  ArrowRight,
  Check,
  ImageIcon,
  Star,
} from 'lucide-react';
import { cn } from '../../../components/ui';
import type { BenefitsColorTokens } from '../_lib/colors';
import { getBenefitsCornerRadiusClassName, normalizeBenefitsCornerRadius } from '../_lib/constants';
import type { PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { resolveContactIcon } from '../../contact/_lib/iconOptions';
import type {
  BenefitItem,
  BenefitsBrandMode,
  BenefitsConfig,
  BenefitsHeaderAlign,
  BenefitsStyle,
} from '../_types';

interface BenefitsSectionSharedProps {
  items: BenefitItem[];
  style: BenefitsStyle;
  title?: string;
  config: Pick<
    BenefitsConfig,
    'subHeading' | 'heading' | 'subtitle' | 'buttonText' | 'buttonLink' | 'headerAlign' | 'gridColumnsDesktop' | 'gridColumnsMobile' | 'visualImage' | 'highlightIndex' | 'showItemNumbers' | 'showDecorativeVisuals' | 'cornerRadius'
  >;
  tokens: BenefitsColorTokens;
  mode: BenefitsBrandMode;
  context: 'preview' | 'site';
  previewDevice?: PreviewDevice;
  maxVisible?: number;
  skipHeader?: boolean;
}

const BENEFITS_FALLBACKS = {
  description: 'Mô tả lợi ích...',
  heading: 'Giá trị cốt lõi',
  subHeading: 'Vì sao chọn chúng tôi?',
  title: 'Lợi ích nổi bật',
};

const normalizeBenefitsIconValue = (value?: string) => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {return 'check';}

  const legacyMap: Record<string, string> = {
    Check: 'check',
    Shield: 'shield',
    Star: 'star',
    Target: 'target',
    Trophy: 'trophy',
    Zap: 'zap',
  };

  if (legacyMap[trimmed]) {return legacyMap[trimmed];}

  const hasUppercase = /[A-Z]/.test(trimmed);
  if (hasUppercase) {
    return trimmed
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  return trimmed;
};

const resolveBenefitsIcon = (value?: string) => resolveContactIcon(normalizeBenefitsIconValue(value));

const toText = (value: unknown, fallback: string) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length > 0 ? trimmed : fallback;
};

const toDescription = (value?: string) => (value ?? '').trim();

const toSectionTitle = (title?: string, heading?: string) => {
  const headingText = toText(heading, '');
  if (headingText) {return headingText;}
  return toText(title, BENEFITS_FALLBACKS.title);
};

const toHeaderAlign = (value?: string): BenefitsHeaderAlign => (
  value === 'center' || value === 'right' || value === 'left'
    ? value
    : 'left'
);

const toGridColumnsDesktop = (value?: number): 3 | 4 | 5 => (
  value === 3 || value === 5 ? value : 4
);

const toGridColumnsMobileByDesktop = (desktopColumns: 3 | 4 | 5): 1 | 2 => (
  desktopColumns === 3 ? 1 : 2
);

const toPreviewGridClass = (
  previewDevice: PreviewDevice,
  desktopColumns: 3 | 4 | 5,
) => {
  if (previewDevice === 'mobile') {
    const mobileColumns = toGridColumnsMobileByDesktop(desktopColumns);
    return mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2';
  }

  if (previewDevice === 'tablet') {
    return desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-2';
  }

  if (desktopColumns === 5) {
    return 'grid-cols-5';
  }

  return desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
};

const toResponsiveGridClass = (
  context: 'preview' | 'site',
  previewDevice: PreviewDevice,
  desktopColumns: 3 | 4 | 5,
) => {
  if (context === 'preview') {
    return toPreviewGridClass(previewDevice, desktopColumns);
  }

  if (desktopColumns === 3) {
    return 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-3';
  }

  if (desktopColumns === 5) {
    return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-5';
  }

  return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';
};

const getFiveColumnMiddleClass = (
  desktopColumns: 3 | 4 | 5,
  idx: number,
  context: 'preview' | 'site',
  previewDevice: PreviewDevice,
) => {
  if (desktopColumns !== 5 || idx !== 2) {
    return '';
  }

  if (context === 'preview') {
    return previewDevice === 'desktop' ? '' : 'col-span-2';
  }

  return 'col-span-2 lg:col-span-1';
};

const toKeySeed = (item: BenefitItem, idx: number) => `${item.icon}|${item.title}|${item.description}|${idx}`;

const toStableKey = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
};

const buildStableKeys = (items: BenefitItem[]) => {
  const counters = new Map<string, number>();
  return items.map((item, idx) => {
    const seed = toKeySeed(item, idx);
    const base = toStableKey(seed);
    const seen = counters.get(base) ?? 0;
    counters.set(base, seen + 1);
    return `${base}-${seen}`;
  });
};

const sanitizeLink = (value?: string) => {
  const normalized = (value ?? '').trim();
  if (!normalized) {return '#';}

  if (
    normalized.startsWith('/')
    || normalized.startsWith('#')
    || normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('mailto:')
    || normalized.startsWith('tel:')
  ) {
    return normalized;
  }

  return '#';
};

const clampHighlightIndex = (value: number | undefined, length: number) => {
  if (length <= 0) {return 0;}
  const normalized = typeof value === 'number' ? value : 0;
  return Math.min(Math.max(normalized, 0), length - 1);
};

export function BenefitsSectionShared({
  items,
  style,
  title,
  config,
  tokens,
  context,
  previewDevice,
  maxVisible,
  skipHeader = false,
}: BenefitsSectionSharedProps) {
  const HeadingTag = context === 'site' ? 'h2' : 'h3';

  const sectionHeading = toSectionTitle(title, config.heading ?? BENEFITS_FALLBACKS.heading);
  const rawSubheading = typeof config.subHeading === 'string' ? config.subHeading.trim() : '';
  const sectionSubheading = rawSubheading;
  const sectionDescription = typeof config.subtitle === 'string' ? config.subtitle.trim() : '';
  const buttonText = (config.buttonText ?? '').trim();
  const buttonLink = sanitizeLink(config.buttonLink);
  const visualImage = (config.visualImage ?? '').trim();
  const showItemNumbers = config.showItemNumbers ?? true;
  const showDecorativeVisuals = config.showDecorativeVisuals ?? true;
  const cornerRadiusClassName = getBenefitsCornerRadiusClassName(normalizeBenefitsCornerRadius(config.cornerRadius));
  const headerAlign = toHeaderAlign(config.headerAlign);
  const headerAlignClass = headerAlign === 'center'
    ? 'items-center text-center'
    : headerAlign === 'right'
      ? 'items-end text-right'
      : 'items-start text-left';

  const isPreview = context === 'preview';
  const isPreviewMobile = isPreview && previewDevice === 'mobile';
  const sectionPaddingClass = skipHeader ? 'py-0' : isPreviewMobile ? 'py-8' : 'py-12 md:py-16';

  const resolvedPreviewDevice = previewDevice ?? 'desktop';
  const desktopColumns = toGridColumnsDesktop(config.gridColumnsDesktop);
  const responsiveGridClass = toResponsiveGridClass(context, resolvedPreviewDevice, desktopColumns);

  const displayedItems = React.useMemo(
    () => (typeof maxVisible === 'number' ? items.slice(0, maxVisible) : items),
    [items, maxVisible],
  );

  const highlightIndex = clampHighlightIndex(config.highlightIndex, displayedItems.length);

  const itemKeys = React.useMemo(
    () => buildStableKeys(displayedItems),
    [displayedItems],
  );

  const headerContainerClass = headerAlign === 'center'
    ? 'flex flex-col items-center text-center'
    : headerAlign === 'right'
      ? 'flex flex-col items-end text-right'
      : 'flex flex-col md:flex-row md:items-end md:justify-between';

  const renderHeader = () => {
    if (skipHeader) {return null;}
    
    return (
      <div
        className={cn(headerContainerClass, 'gap-4 pb-4 border-b')}
        style={{ borderColor: tokens.neutralBorder }}
      >
        <div className={cn('space-y-2', headerAlignClass)}>
          {sectionSubheading ? (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: '#f1f5f9',
                borderColor: '#e2e8f0',
                color: '#64748b',
              }}
            >
              {sectionSubheading}
            </span>
          ) : null}
          <HeadingTag className="text-2xl md:text-3xl font-bold tracking-tight leading-tight text-balance" style={{ color: tokens.heading }}>
            {sectionHeading}
          </HeadingTag>
        </div>
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: tokens.iconSurfaceStrong }}
          >
            <Check size={32} style={{ color: tokens.iconTextStrong }} />
          </div>
          <HeadingTag className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>
            {toText(title, BENEFITS_FALLBACKS.title)}
          </HeadingTag>
          <p style={{ color: tokens.mutedText }}>Chưa có lợi ích nào</p>
        </div>
      </section>
    );
  }

  if (style === '1') {
    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-8">
          {renderHeader()}
          <div className={cn('grid gap-3 md:gap-4 lg:gap-6', responsiveGridClass)}>
            {displayedItems.map((item, idx) => (
              <article
                key={itemKeys[idx]}
                className={cn(
                  'relative flex flex-col items-center overflow-hidden border border-b-[3px] border-slate-50 bg-white px-3 pb-2 pt-3 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:px-4 md:pt-4',
                  cornerRadiusClassName,
                  getFiveColumnMiddleClass(desktopColumns, idx, context, resolvedPreviewDevice),
                )}
                style={{
                  backgroundColor: tokens.neutralSurface,
                  borderTopColor: tokens.cardBorder,
                  borderRightColor: tokens.cardBorder,
                  borderLeftColor: tokens.cardBorder,
                  borderBottomColor: tokens.primary,
                }}
              >
                {showDecorativeVisuals ? (
                  <div
                    className="absolute -bottom-6 -left-4 h-20 w-20 rounded-full"
                    style={{ backgroundColor: tokens.styleAccentByStyle['1'], opacity: 0.06 }}
                  />
                ) : null}
                <div
                  className={cn(
                    'relative flex items-center justify-center rounded-full',
                    isPreview
                      ? (resolvedPreviewDevice === 'mobile' ? 'mb-2 h-[3.8rem] w-[3.8rem]' : resolvedPreviewDevice === 'tablet' ? 'mb-3 h-[4.2rem] w-[4.2rem]' : 'mb-3 h-[4.2rem] w-[4.2rem]')
                      : 'mb-2 h-[3.8rem] w-[3.8rem] sm:mb-3 sm:h-[4.2rem] sm:w-[4.2rem]',
                  )}
                  style={{ backgroundColor: tokens.iconSurfaceStrong, color: tokens.primary }}
                >
                  {(() => {
                    const Icon = resolveBenefitsIcon(item.icon);
                    return <Icon className="relative z-10" size={resolvedPreviewDevice === 'mobile' ? 36 : 40} />;
                  })()}
                </div>
                <div className={cn(isPreview ? (resolvedPreviewDevice === 'mobile' ? 'mb-2' : 'mb-3') : 'mb-2 sm:mb-3', 'h-[2px] w-8 rounded-full')} style={{ backgroundColor: tokens.primary }} />
                <div className="relative z-10 flex h-full w-full flex-col items-center">
                  <div className="w-full px-1">
                    <h3
                      className={cn(
                        'break-words text-center font-bold leading-[1.3]',
                        isPreview
                          ? (resolvedPreviewDevice === 'mobile' ? 'mb-1.5 text-[13px]' : 'mb-2 text-[14px]')
                          : 'mb-1.5 text-[13px] sm:mb-2 sm:text-[14px]',
                      )}
                      style={{ color: tokens.neutralText }}
                    >
                      {toText(item.title, 'Tiêu đề')}
                    </h3>
                  </div>
                  <div className="w-full px-0.5">
                    {toDescription(item.description) ? (
                      <p
                        className={cn(
                          'relative z-10 break-words text-center font-medium leading-[1.4]',
                          isPreview
                            ? (resolvedPreviewDevice === 'mobile' ? 'pb-5 text-[11px]' : 'pb-7 text-[12px]')
                            : 'pb-5 text-[11px] sm:pb-7 sm:text-[12px]',
                        )}
                        style={{ color: tokens.mutedText }}
                      >
                        {toDescription(item.description)}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-auto w-full">
                    {showItemNumbers ? (
                      <span
                        className={cn(
                          'pointer-events-none absolute bottom-[-0.25rem] select-none font-black leading-[1] tracking-tighter',
                          isPreview
                            ? (resolvedPreviewDevice === 'mobile' ? 'left-2 text-[2.75rem]' : 'left-3 text-[3rem]')
                            : 'left-2 text-[2.75rem] sm:left-3 sm:text-[3rem]',
                        )}
                        style={{ color: tokens.iconSurfaceStrong, opacity: 0.8 }}
                      >
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      <div className="h-8" />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === '2') {
    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-8">
          {renderHeader()}
          <div className={cn('grid gap-3 md:gap-4 lg:gap-6', responsiveGridClass)}>
            {displayedItems.map((item, idx) => {
              const Icon = resolveBenefitsIcon(item.icon);
              const accent = idx % 2 === 0 ? tokens.primary : tokens.secondary;
              return (
                <article
                  key={itemKeys[idx]}
                  className={cn(
                    'overflow-hidden border bg-white p-4 text-center shadow-sm md:p-5',
                    cornerRadiusClassName,
                    getFiveColumnMiddleClass(desktopColumns, idx, context, resolvedPreviewDevice),
                  )}
                  style={{ borderColor: tokens.cardBorder }}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: tokens.iconSurfaceStrong, color: tokens.iconTextStrong }}>
                    <Icon size={22} />
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="break-words text-base font-semibold md:text-lg" style={{ color: tokens.neutralText }}>
                      {toText(item.title, 'Tiêu đề')}
                    </h3>
                    {toDescription(item.description) ? (
                      <p className="break-words text-sm leading-7" style={{ color: tokens.mutedText }}>
                        {toDescription(item.description)}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (style === '3') {
    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="relative mx-auto flex w-full max-w-[1400px] items-stretch">
          {renderHeader()}
          {showDecorativeVisuals ? (
            <div className="pointer-events-none absolute bottom-[5px] left-0 right-0 z-30 hidden h-[24px] lg:block">
              <svg width="100%" height="100%" viewBox="0 0 1000 24" preserveAspectRatio="none">
                <defs>
                  <filter id="benefits-layout-3-line-shadow" x="-4%" y="-140%" width="108%" height="360%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={tokens.primary} floodOpacity="0.28" />
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.16" />
                  </filter>
                </defs>
                <path
                  d="M -20,0 Q 500,48 1020,0"
                  fill="none"
                  stroke={tokens.primary}
                  strokeOpacity="0.72"
                  strokeWidth="1.75"
                  filter="url(#benefits-layout-3-line-shadow)"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {Array.from({ length: Math.min(displayedItems.length, 5) }, (_, dotIdx) => {
                const leftPositions = ['10%', '30%', '50%', '70%', '90%'];
                const topPositions = ['41%', '85%', '100%', '85%', '41%'];
                const isCenter = dotIdx === 2;
                return (
                  <div
                    key={`layout-3-dot-${dotIdx}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      top: topPositions[dotIdx] ?? '50%',
                      left: leftPositions[dotIdx] ?? `${(dotIdx + 1) * 20}%`,
                      width: 12,
                      height: 12,
                      backgroundColor: isCenter ? tokens.neutralSurface : tokens.primary,
                      boxShadow: isCenter
                        ? `0 0 0 3px ${tokens.primary}`
                        : `0 0 0 3px ${tokens.neutralSurface}`,
                    }}
                  />
                );
              })}
            </div>
          ) : null}

          <div
            className={cn(
              'relative z-10 w-full',
              'grid gap-4 sm:gap-6 lg:gap-6 xl:gap-8',
              responsiveGridClass,
            )}
          >
            {displayedItems.map((item, idx) => {
              const Icon = resolveBenefitsIcon(item.icon);
              const isActive = idx === highlightIndex;
              const isLast = idx === displayedItems.length - 1;
              return (
                <article
                  key={itemKeys[idx]}
                  className={cn(
                    'relative z-10 flex flex-col items-center px-3 pb-5 pt-4 transition-all duration-300 sm:px-4 lg:pb-8',
                    isPreview
                      ? (
                        resolvedPreviewDevice === 'desktop'
                          ? 'col-span-1'
                          : (isLast ? 'col-span-2' : 'col-span-1')
                      )
                      : (isLast ? 'col-span-2 lg:col-span-1' : 'col-span-1'),
                    cornerRadiusClassName,
                    getFiveColumnMiddleClass(desktopColumns, idx, context, resolvedPreviewDevice),
                  )}
                  style={{
                    backgroundColor: isActive ? tokens.primary : tokens.neutralSurface,
                    borderColor: isActive ? tokens.primary : tokens.cardBorder,
                    borderWidth: isActive ? undefined : 1,
                    boxShadow: isActive
                      ? `0 15px 40px color-mix(in srgb, ${tokens.primary} 30%, transparent)`
                      : '0 4px 20px rgba(0,0,0,0.06)',
                  }}
                >
                  <div
                    className="absolute left-4 top-2 text-[32px] font-black leading-none tracking-tighter sm:left-5 sm:text-[38px]"
                    style={{ color: isActive ? 'rgba(255,255,255,0.07)' : tokens.iconSurfaceStrong, opacity: 0.56 }}
                  >
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>

                  <div className="relative z-10 mb-4 mt-6 flex h-[60px] w-[60px] items-center justify-center sm:mb-5 sm:mt-7 sm:h-[68px] sm:w-[68px]">
                    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full rotate-[90deg]">
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke={isActive ? 'rgba(255,255,255,0.7)' : tokens.primary}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray="140 276"
                        strokeDashoffset="0"
                      />
                    </svg>

                    <div
                      className="relative z-10 flex h-[48px] w-[48px] items-center justify-center rounded-full sm:h-[54px] sm:w-[54px]"
                      style={{
                        backgroundColor: tokens.neutralSurface,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                        color: tokens.primary,
                      }}
                    >
                      <Icon
                        className="h-[20px] w-[20px] sm:h-[24px] sm:w-[24px]"
                      />

                      {idx === displayedItems.length - 1 ? (
                        <div
                          className="absolute -bottom-1 -right-0 rounded-full border-2 p-0.5"
                          style={{ backgroundColor: tokens.primary, borderColor: tokens.neutralSurface }}
                        >
                          <Star className="h-[8px] w-[8px] fill-white text-white" />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <h3
                    className="mb-2 w-full text-balance text-center text-[15px] font-bold leading-[1.3] sm:mb-2.5 sm:text-[16px]"
                    style={{ color: isActive ? '#ffffff' : tokens.neutralText }}
                  >
                    {toText(item.title, 'Tiêu đề')}
                  </h3>

                  <div
                    className="mb-2 h-[2.5px] w-6 rounded-full sm:mb-2.5"
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.5)' : tokens.primary }}
                  />

                  {toDescription(item.description) ? (
                    <p
                      className="text-center text-[12px] font-medium leading-[1.6] sm:text-[13px]"
                      style={{ color: isActive ? 'rgba(255,255,255,0.90)' : tokens.mutedText }}
                    >
                      {toDescription(item.description)}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (style === '4') {
    const getLayoutFourBorderClasses = (idx: number, device: PreviewDevice) => {
      if (isPreview) {
        if (device === 'mobile') {
          switch (idx) {
            case 0: return 'border-b border-r';
            case 1: return 'border-b';
            case 2: return 'border-b border-r';
            case 3: return 'border-b';
            case 4: return '';
            default: return '';
          }
        }
        if (device === 'tablet') {
          switch (idx) {
            case 0: return 'border-b border-r';
            case 1: return 'border-b';
            case 2: return 'border-b border-r';
            case 3: return 'border-b';
            case 4: return '';
            default: return '';
          }
        }
        // Desktop preview: dùng logic giống site (lg:grid-cols-6)
        switch (idx) {
          case 0: return 'border-b border-r';
          case 1: return 'border-b border-r';
          case 2: return 'border-b border-r';
          case 3: return 'border-b border-r';
          case 4: return '';
          default: return '';
        }
      }
      
      switch (idx) {
        case 0: return 'border-b border-r';
        case 1: return 'border-b lg:border-r';
        case 2: return 'border-b border-r lg:border-r-0';
        case 3: return 'border-b lg:border-b-0 lg:border-r';
        case 4: return '';
        default: return '';
      }
    };

    const getLayoutFourGridSpan = (idx: number, device: PreviewDevice) => {
      if (isPreview) {
        if (device === 'mobile' || device === 'tablet') {
          switch (idx) {
            case 0:
            case 2:
              return 'col-span-1';
            case 1:
            case 3:
              return 'col-span-1';
            case 4:
              return 'col-span-2';
            default:
              return 'col-span-1';
          }
        }
        // Desktop preview: dùng logic giống site
        switch (idx) {
          case 0:
          case 1:
          case 2:
            return 'col-span-2';
          case 3:
            return 'col-span-3';
          case 4:
            return 'col-span-3';
          default:
            return 'col-span-1';
        }
      }
      
      switch (idx) {
        case 0:
        case 1:
        case 2:
          return 'col-span-1 lg:col-span-2';
        case 3:
          return 'col-span-1 lg:col-span-3';
        case 4:
          return 'col-span-2 lg:col-span-3';
        default:
          return 'col-span-1';
      }
    };

    const layout4LeftColumnClass = isPreview
      ? (resolvedPreviewDevice === 'mobile' ? 'w-full mb-6' : resolvedPreviewDevice === 'tablet' ? 'w-full mb-8' : 'w-[38%] pr-10')
      : 'w-full lg:w-[38%] lg:pr-10 xl:w-[40%] xl:pr-16';

    const layout4RightColumnClass = isPreview
      ? (resolvedPreviewDevice === 'mobile' ? 'w-full' : resolvedPreviewDevice === 'tablet' ? 'w-full' : 'w-[62%]')
      : 'w-full lg:w-[62%] xl:w-[60%]';

    const layout4GridClass = isPreview
      ? (resolvedPreviewDevice === 'mobile' || resolvedPreviewDevice === 'tablet' ? 'grid grid-cols-2' : 'grid grid-cols-6')
      : 'grid grid-cols-2 lg:grid-cols-6';

    const layout4BorderClass = isPreview
      ? (resolvedPreviewDevice === 'mobile' ? 'border-t' : resolvedPreviewDevice === 'tablet' ? 'border-t' : '')
      : 'border-t lg:border-t-0 lg:border-l';

    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className={cn(
          'mx-auto flex w-full max-w-[1340px]',
          isPreview
            ? (resolvedPreviewDevice === 'mobile' || resolvedPreviewDevice === 'tablet' ? 'flex-col gap-6' : 'flex-row gap-0')
            : 'flex-col gap-6 sm:gap-8 lg:flex-row lg:gap-0'
        )}>
          <div className={cn('z-10 flex shrink-0 flex-col', layout4LeftColumnClass)} style={{ backgroundColor: tokens.neutralBackground }}>
            {renderHeader()}

            {skipHeader ? (
              <>
                {sectionSubheading ? (
                  <h4
                    className="mb-3 text-[12px] font-bold uppercase tracking-wider md:text-[13px]"
                    style={{ color: tokens.primary }}
                  >
                    {sectionSubheading}
                  </h4>
                ) : null}
                <div className="mb-6 h-[2px] w-10 sm:mb-8" style={{ backgroundColor: tokens.primary }} />
                <h2
                  className="mb-5 text-[36px] font-extrabold leading-[1.15] tracking-tight text-balance lg:text-[40px] xl:text-[46px]"
                  style={{ color: tokens.neutralText }}
                >
                  {sectionHeading}
                </h2>
              </>
            ) : null}

            {sectionDescription ? (
              <p
                className="mb-8 text-[15px] leading-[1.7] text-balance sm:mb-10 lg:mb-0 xl:text-[16px]"
                style={{ color: tokens.mutedText }}
              >
                {sectionDescription}
              </p>
            ) : null}

            <div className={cn(
              'relative w-full',
              isPreview
                ? (resolvedPreviewDevice === 'mobile' ? 'mb-0 mt-6' : resolvedPreviewDevice === 'tablet' ? 'mb-0 mt-8' : 'mb-0 mt-auto max-w-[340px]')
                : 'mb-6 mt-6 sm:mb-8 sm:mt-8 lg:mb-0 lg:mt-auto lg:max-w-[340px] xl:mt-12 xl:max-w-[420px]'
            )}>
              {showDecorativeVisuals ? (
                <div className="absolute -bottom-5 -left-5 z-0 h-[140px] w-[140px] opacity-40">
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <defs>
                      <pattern id="layout-4-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle fill={tokens.primary} cx="2" cy="2" r="2" />
                      </pattern>
                    </defs>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#layout-4-dots)" />
                  </svg>
                </div>
              ) : null}

              <div
                className={cn('relative z-10 aspect-[16/10] w-full overflow-hidden', cornerRadiusClassName)}
                style={{
                  backgroundColor: `color-mix(in srgb, ${tokens.primary} 8%, ${tokens.neutralBackground})`,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
                }}
              >
                {visualImage ? (
                  <img
                    src={visualImage}
                    alt={sectionHeading}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ 
                        backgroundColor: tokens.neutralSurface, 
                        color: tokens.primary 
                      }}
                    >
                      <ImageIcon size={28} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={cn('flex flex-col', layout4RightColumnClass)} style={{ borderLeftColor: tokens.cardBorder }}>
            <div
              className={cn(layout4GridClass, layout4BorderClass)}
              style={{
                borderTopColor: tokens.cardBorder,
                borderLeftColor: tokens.cardBorder,
              }}
            >
            {displayedItems.map((item, idx) => {
              const Icon = resolveBenefitsIcon(item.icon);
              return (
                <div
                  key={itemKeys[idx]}
                  className={cn(
                    'flex flex-col items-center justify-center transition-colors',
                    isPreview
                      ? (resolvedPreviewDevice === 'mobile' ? 'p-3 hover:bg-slate-50/50' : resolvedPreviewDevice === 'tablet' ? 'p-4 hover:bg-slate-50/50' : 'p-5 hover:bg-slate-50/50')
                      : 'p-4 hover:bg-slate-50/50 sm:p-4 lg:p-5 xl:p-6',
                    getLayoutFourGridSpan(idx, resolvedPreviewDevice),
                    getLayoutFourBorderClasses(idx, resolvedPreviewDevice),
                  )}
                  style={{ borderColor: tokens.cardBorder }}
                >
                  <div
                    className={cn(
                      'relative flex items-center justify-center rounded-full border transition-transform duration-300 hover:scale-110',
                      isPreview
                        ? (resolvedPreviewDevice === 'mobile' ? 'mb-3 h-[48px] w-[48px]' : resolvedPreviewDevice === 'tablet' ? 'mb-3 h-[52px] w-[52px]' : 'mb-4 h-[56px] w-[56px]')
                        : 'mb-4 h-[56px] w-[56px]'
                    )}
                    style={{
                      backgroundColor: `color-mix(in srgb, ${tokens.primary} 8%, ${tokens.neutralBackground})`,
                      borderColor: `${tokens.primary}20`,
                      color: tokens.primary,
                    }}
                  >
                    <Icon className={cn(
                      isPreview
                        ? (resolvedPreviewDevice === 'mobile' ? 'h-[20px] w-[20px]' : resolvedPreviewDevice === 'tablet' ? 'h-[22px] w-[22px]' : 'h-[24px] w-[24px]')
                        : 'h-[24px] w-[24px]'
                    )} />
                  </div>

                  {showItemNumbers ? (
                    <div className={cn(
                      'font-black leading-none tracking-tight',
                      isPreview
                        ? (resolvedPreviewDevice === 'mobile' ? 'mb-1.5 text-[20px]' : resolvedPreviewDevice === 'tablet' ? 'mb-1.5 text-[22px]' : 'mb-1.5 text-[24px]')
                        : 'mb-1.5 text-[24px]'
                    )} style={{ color: tokens.primary }}>
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                  ) : null}

                  <div className="mb-3 h-[2.5px] w-6 rounded-full opacity-80" style={{ backgroundColor: tokens.primary }} />

                  <h3 className={cn(
                    'mb-2 text-center font-bold',
                    isPreview
                      ? (resolvedPreviewDevice === 'mobile' ? 'text-[14px]' : resolvedPreviewDevice === 'tablet' ? 'text-[15px]' : 'text-[16px]')
                      : 'text-[16px]'
                  )} style={{ color: tokens.neutralText }}>
                    {toText(item.title, 'Tiêu đề')}
                  </h3>
                  {toDescription(item.description) ? (
                    <p className={cn(
                      'max-w-[280px] text-balance text-center leading-[1.5]',
                      isPreview
                        ? (resolvedPreviewDevice === 'mobile' ? 'text-[11px]' : resolvedPreviewDevice === 'tablet' ? 'text-[12px]' : 'text-[13px]')
                        : 'text-[13px]'
                    )} style={{ color: tokens.mutedText }}>
                      {toDescription(item.description)}
                    </p>
                  ) : null}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === '5') {
    const getBentoGridSpan = (idx: number) => {
      if (isPreview) {
        // Mobile, Tablet và Desktop preview: tất cả dùng logic 2 cols
        if (idx === highlightIndex) {
          return 'col-span-2 row-span-2';
        }
        return 'col-span-1';
      }
      
      // Site thực: mobile/tablet 2 cols, desktop 3 cols
      if (idx === highlightIndex) {
        return 'col-span-2 row-span-2 lg:col-span-2 lg:row-span-2';
      }
      
      if (idx === 1 && highlightIndex !== 1) {
        return 'col-span-1 lg:col-span-2';
      }
      
      return 'col-span-1';
    };

    const bentoGridClass = isPreview
      ? 'grid grid-cols-2 gap-3'
      : 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-4';

    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="mx-auto max-w-7xl space-y-8">
          {renderHeader()}
          
          <div className={bentoGridClass} style={{ gridAutoRows: isPreview ? '200px' : '200px' }}>
            {displayedItems.map((item, idx) => {
              const Icon = resolveBenefitsIcon(item.icon);
              const isHighlighted = idx === highlightIndex;
              
              return (
                <article
                  key={itemKeys[idx]}
                  className={cn(
                    'group relative overflow-hidden border transition-all duration-300',
                    cornerRadiusClassName,
                    isPreview
                      ? (resolvedPreviewDevice === 'mobile' ? 'p-4' : 'p-6')
                      : 'p-5 sm:p-6',
                    getBentoGridSpan(idx),
                    isHighlighted ? 'shadow-lg hover:shadow-xl' : 'shadow-sm hover:shadow-md',
                  )}
                  style={{
                    backgroundColor: isHighlighted ? tokens.primary : tokens.neutralSurface,
                    borderColor: isHighlighted ? tokens.primary : tokens.cardBorder,
                  }}
                >
                  {showDecorativeVisuals && isHighlighted ? (
                    <>
                      <div
                        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      <div
                        className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-10"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                    </>
                  ) : null}

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          'flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110',
                          isPreview
                            ? (resolvedPreviewDevice === 'mobile' ? 'h-11 w-11 p-2' : 'h-14 w-14 p-3')
                            : 'h-12 w-12 p-2.5 sm:h-14 sm:w-14 sm:p-3',
                        )}
                        style={{
                          backgroundColor: isHighlighted 
                            ? 'rgba(255,255,255,0.18)' 
                            : `color-mix(in srgb, ${tokens.primary} 12%, ${tokens.neutralBackground})`,
                          color: isHighlighted ? '#ffffff' : tokens.primary,
                        }}
                      >
                        <Icon className={cn(
                          isPreview
                            ? (resolvedPreviewDevice === 'mobile' ? 'h-5 w-5' : 'h-6 w-6')
                            : 'h-5 w-5 sm:h-6 sm:w-6'
                        )} />
                      </div>
                      
                      {showItemNumbers ? (
                        <div
                          className={cn(
                            'flex items-center justify-center rounded-full font-bold',
                            isPreview
                              ? (resolvedPreviewDevice === 'mobile' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs')
                              : 'h-7 w-7 text-[11px] sm:h-8 sm:w-8 sm:text-xs',
                          )}
                          style={{
                            backgroundColor: isHighlighted 
                              ? 'rgba(255,255,255,0.16)' 
                              : tokens.iconSurfaceStrong,
                            color: isHighlighted ? '#ffffff' : tokens.primary,
                          }}
                        >
                          {(idx + 1).toString().padStart(2, '0')}
                        </div>
                      ) : null}
                    </div>

                    <div className={cn('flex-1 space-y-2', isHighlighted ? 'sm:space-y-3' : '')}>
                      <h3
                        className={cn(
                          'font-bold leading-tight',
                          isPreview
                            ? (resolvedPreviewDevice === 'mobile' ? (isHighlighted ? 'text-base' : 'text-sm') : (isHighlighted ? 'text-xl' : 'text-base'))
                            : isHighlighted ? 'text-base sm:text-xl' : 'text-base',
                        )}
                        style={{ color: isHighlighted ? '#ffffff' : tokens.neutralText }}
                      >
                        {toText(item.title, 'Tiêu đề')}
                      </h3>
                      
                      {toDescription(item.description) ? (
                        <p
                          className={cn(
                            'leading-relaxed',
                            isPreview
                              ? (resolvedPreviewDevice === 'mobile' ? (isHighlighted ? 'text-[12px]' : 'text-[11px]') : (isHighlighted ? 'text-sm' : 'text-[13px]'))
                              : isHighlighted ? 'text-[13px] sm:text-sm' : 'text-[13px]',
                          )}
                          style={{ color: isHighlighted ? 'rgba(255,255,255,0.90)' : tokens.mutedText }}
                        >
                          {toDescription(item.description)}
                        </p>
                      ) : null}
                    </div>

                    {isHighlighted && resolvedPreviewDevice !== 'mobile' ? (
                      <div className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: isHighlighted ? '#ffffff' : tokens.primary }}>
                        <span className="opacity-90">Tìm hiểu thêm</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    ) : null}
                  </div>

                  {showDecorativeVisuals && !isHighlighted ? (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
                      style={{
                        background: `linear-gradient(90deg, ${tokens.primary} 0%, ${tokens.secondary} 100%)`,
                      }}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>

          {buttonText ? (
            <div className="text-center pt-4">
              <a
                href={buttonLink}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full font-medium transition-all duration-300 hover:gap-3',
                  isPreview
                    ? (resolvedPreviewDevice === 'mobile' ? 'px-5 py-2.5 text-sm' : 'px-6 py-3 text-sm')
                    : 'px-5 py-2.5 text-sm sm:px-6 sm:py-3',
                )}
                style={{ 
                  backgroundColor: tokens.primary, 
                  color: '#ffffff',
                  boxShadow: `0 4px 14px color-mix(in srgb, ${tokens.primary} 30%, transparent)`,
                }}
              >
                {buttonText}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  // Layout 6: Hero Image Center với Floating Cards
  return (
    <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="mx-auto max-w-7xl">
        {renderHeader()}
        
        <div className="mt-8 relative">
          {/* Hero Image Container */}
          <div
            className={cn(
              'relative mx-auto overflow-hidden',
              cornerRadiusClassName,
              isPreview
                ? (resolvedPreviewDevice === 'mobile' ? 'h-[320px]' : resolvedPreviewDevice === 'tablet' ? 'h-[400px]' : 'h-[480px]')
                : 'h-[320px] md:h-[400px] lg:h-[480px]',
            )}
            style={{
              backgroundColor: `color-mix(in srgb, ${tokens.primary} 10%, ${tokens.neutralBackground})`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            }}
          >
            {showDecorativeVisuals ? (
              <>
                <div
                  className="absolute -top-20 -left-20 h-60 w-60 rounded-full opacity-20 blur-3xl"
                  style={{ backgroundColor: tokens.primary }}
                />
                <div
                  className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full opacity-20 blur-3xl"
                  style={{ backgroundColor: tokens.secondary }}
                />
              </>
            ) : null}

            {visualImage ? (
              <img
                src={visualImage}
                alt={sectionHeading}
                className="relative z-10 h-full w-full object-cover"
              />
            ) : (
              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: tokens.neutralSurface,
                    color: tokens.primary,
                  }}
                >
                  <ImageIcon size={40} />
                </div>
                <p className="max-w-[300px] text-base leading-relaxed" style={{ color: tokens.mutedText }}>
                  Layout 6 với hero image center và floating cards xung quanh.
                </p>
              </div>
            )}

            {/* Floating Cards on Image (Desktop/Tablet only) */}
            {displayedItems.length >= 2 && !isPreviewMobile && (isPreview ? resolvedPreviewDevice !== 'mobile' : true) ? (
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div className={cn(
                  'absolute flex gap-4',
                  isPreview
                    ? (resolvedPreviewDevice === 'tablet' ? 'top-6 left-6 right-6' : 'top-8 left-8 right-8')
                    : 'top-6 left-6 right-6 md:top-8 md:left-8 md:right-8',
                )}>
                  {displayedItems.slice(0, 2).map((item, idx) => {
                    const Icon = resolveBenefitsIcon(item.icon);
                    const isHighlighted = idx === highlightIndex;
                    
                    return (
                      <article
                        key={itemKeys[idx]}
                        className={cn(
                          'group pointer-events-auto flex-1 border backdrop-blur-md transition-all duration-300 hover:-translate-y-2',
                          cornerRadiusClassName,
                          isPreview
                            ? (resolvedPreviewDevice === 'tablet' ? 'p-4' : 'p-5')
                            : 'p-4 md:p-5',
                          isHighlighted ? 'hover:shadow-2xl' : 'hover:shadow-xl',
                        )}
                        style={{
                          backgroundColor: isHighlighted 
                            ? `color-mix(in srgb, ${tokens.primary} 95%, transparent)`
                            : 'rgba(255,255,255,0.92)',
                          borderColor: isHighlighted ? tokens.primary : 'rgba(255,255,255,0.6)',
                          borderWidth: isHighlighted ? 2 : 1,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'flex shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                              isPreview
                                ? (resolvedPreviewDevice === 'tablet' ? 'h-10 w-10 p-2' : 'h-12 w-12 p-2.5')
                                : 'h-10 w-10 p-2 md:h-12 md:w-12 md:p-2.5',
                            )}
                            style={{
                              backgroundColor: isHighlighted ? 'rgba(255,255,255,0.2)' : `color-mix(in srgb, ${tokens.primary} 12%, transparent)`,
                              color: isHighlighted ? '#ffffff' : tokens.primary,
                            }}
                          >
                            <Icon className="h-full w-full" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3
                              className={cn(
                                'break-words font-bold leading-tight',
                                isPreview
                                  ? (resolvedPreviewDevice === 'tablet' ? 'text-sm mb-1' : 'text-base mb-1.5')
                                  : 'text-sm md:text-base mb-1 md:mb-1.5',
                              )}
                              style={{ color: isHighlighted ? '#ffffff' : tokens.neutralText }}
                            >
                              {toText(item.title, 'Tiêu đề')}
                            </h3>
                            {toDescription(item.description) ? (
                              <p
                                className={cn(
                                  'break-words leading-relaxed',
                                  isPreview
                                    ? (resolvedPreviewDevice === 'tablet' ? 'text-xs' : 'text-sm')
                                    : 'text-xs md:text-sm',
                                )}
                                style={{ color: isHighlighted ? 'rgba(255,255,255,0.9)' : tokens.mutedText }}
                              >
                                {toDescription(item.description)}
                              </p>
                            ) : null}
                          </div>

                          {showItemNumbers ? (
                            <div
                              className={cn(
                                'flex shrink-0 items-center justify-center rounded-full font-bold',
                                isPreview
                                  ? (resolvedPreviewDevice === 'tablet' ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-xs')
                                  : 'h-6 w-6 text-[10px] md:h-7 md:w-7 md:text-xs',
                              )}
                              style={{
                                backgroundColor: isHighlighted ? 'rgba(255,255,255,0.2)' : tokens.iconSurfaceStrong,
                                color: isHighlighted ? '#ffffff' : tokens.primary,
                              }}
                            >
                              {(idx + 1).toString().padStart(2, '0')}
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom Cards Row */}
          <div className={cn(
            'grid gap-4 mt-6',
            isPreview
              ? (resolvedPreviewDevice === 'mobile' ? 'grid-cols-1' : 'grid-cols-3')
              : 'grid-cols-1 md:grid-cols-3',
          )}>
            {displayedItems.slice(isPreviewMobile || (isPreview && resolvedPreviewDevice === 'mobile') ? 0 : 2).map((item, idx) => {
              const actualIdx = isPreviewMobile || (isPreview && resolvedPreviewDevice === 'mobile') ? idx : idx + 2;
              const Icon = resolveBenefitsIcon(item.icon);
              const isHighlighted = actualIdx === highlightIndex;
              
              return (
                <article
                  key={itemKeys[actualIdx]}
                  className={cn(
                    'group border transition-all duration-300',
                    cornerRadiusClassName,
                    isPreview
                      ? (resolvedPreviewDevice === 'mobile' ? 'p-5' : 'p-6')
                      : 'p-5 md:p-6',
                    isHighlighted ? 'shadow-lg hover:shadow-xl hover:-translate-y-2' : 'shadow-sm hover:shadow-md hover:-translate-y-1',
                  )}
                  style={{
                    backgroundColor: isHighlighted ? tokens.primary : tokens.neutralSurface,
                    borderColor: isHighlighted ? tokens.primary : tokens.cardBorder,
                    borderWidth: isHighlighted ? 2 : 1,
                  }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={cn(
                        'flex shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110',
                        isPreview
                          ? (resolvedPreviewDevice === 'mobile' ? 'h-12 w-12 p-2.5' : 'h-14 w-14 p-3')
                          : 'h-12 w-12 p-2.5 md:h-14 md:w-14 md:p-3',
                      )}
                      style={{
                        backgroundColor: isHighlighted ? 'rgba(255,255,255,0.18)' : `color-mix(in srgb, ${tokens.primary} 12%, ${tokens.neutralBackground})`,
                        color: isHighlighted ? '#ffffff' : tokens.primary,
                      }}
                    >
                      <Icon className="h-full w-full" />
                    </div>

                    {showItemNumbers ? (
                      <div
                        className={cn(
                          'flex shrink-0 items-center justify-center rounded-full font-bold ml-auto',
                          isPreview
                            ? (resolvedPreviewDevice === 'mobile' ? 'h-7 w-7 text-[11px]' : 'h-8 w-8 text-xs')
                            : 'h-7 w-7 text-[11px] md:h-8 md:w-8 md:text-xs',
                        )}
                        style={{
                          backgroundColor: isHighlighted ? 'rgba(255,255,255,0.2)' : tokens.iconSurfaceStrong,
                          color: isHighlighted ? '#ffffff' : tokens.primary,
                        }}
                      >
                        {(actualIdx + 1).toString().padStart(2, '0')}
                      </div>
                    ) : null}
                  </div>

                  <h3
                    className={cn(
                      'font-bold leading-tight mb-2',
                      isPreview
                        ? (resolvedPreviewDevice === 'mobile' ? 'text-base' : 'text-lg')
                        : 'text-base md:text-lg',
                    )}
                    style={{ color: isHighlighted ? '#ffffff' : tokens.neutralText }}
                  >
                    {toText(item.title, 'Tiêu đề')}
                  </h3>

                  {toDescription(item.description) ? (
                    <p
                      className={cn(
                        'leading-relaxed',
                        isPreview
                          ? (resolvedPreviewDevice === 'mobile' ? 'text-sm' : 'text-base')
                          : 'text-sm md:text-base',
                      )}
                      style={{ color: isHighlighted ? 'rgba(255,255,255,0.9)' : tokens.mutedText }}
                    >
                      {toDescription(item.description)}
                    </p>
                  ) : null}

                  {showDecorativeVisuals && isHighlighted ? (
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: isHighlighted ? '#ffffff' : tokens.primary }}>
                      <span>Tìm hiểu thêm</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          {buttonText ? (
            <div className="mt-8 text-center">
              <a
                href={buttonLink}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full font-medium transition-all duration-300 hover:gap-3',
                  isPreview
                    ? (resolvedPreviewDevice === 'mobile' ? 'px-5 py-2.5 text-sm' : 'px-6 py-3 text-sm')
                    : 'px-5 py-2.5 text-sm md:px-6 md:py-3',
                )}
                style={{
                  backgroundColor: tokens.primary,
                  color: '#ffffff',
                  boxShadow: `0 4px 14px color-mix(in srgb, ${tokens.primary} 30%, transparent)`,
                }}
              >
                {buttonText}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
