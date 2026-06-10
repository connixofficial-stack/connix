"use client";

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { getPartnersItemGapClassName, getPartnersLogoBoxClassName, getPartnersLogoCardClassName, getPartnersLogoFallbackSize, getPartnersSectionSpacingClassName, type PartnersAlign, type PartnersDisplayMode, type PartnersLogoSize, type PartnersSpacing } from '../_types';

export type PartnerMarqueeItem = {
  id?: string | number;
  url?: string;
  link?: string;
  name?: string;
};

const normalizeItems = (items: PartnerMarqueeItem[]) => {
  const seen = new Set<string>();
  return items
    .filter(item => item.url)
    .filter((item) => {
      const key = `${item.url ?? ''}::${item.link ?? ''}`;
      if (seen.has(key)) {return false;}
      seen.add(key);
      return true;
    });
};

export const PartnersMarqueeShared = ({
  items,
  title,
  subheading,
  badgeText,
  align: _align = 'center',
  displayMode = 'withName',
  logoSize = 'normal',
  spacing = 'normal',
  brandColor,
  secondary,
  mode = 'dual',
  speed: _speed = 0.8,
  renderImage,
  openInNewTab = false,
  skipHeader = false,
  className,
}: {
  items: PartnerMarqueeItem[];
  title?: string;
  subheading?: React.ReactNode;
  badgeText?: string;
  align?: PartnersAlign;
  displayMode?: PartnersDisplayMode;
  logoSize?: PartnersLogoSize;
  spacing?: PartnersSpacing;
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  speed?: number;
  renderImage: (item: PartnerMarqueeItem, className: string) => React.ReactNode;
  openInNewTab?: boolean;
  skipHeader?: boolean;
  className?: string;
}) => {
  const normalizedItems = React.useMemo(() => normalizeItems(items), [items]);
  const _colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);

  if (normalizedItems.length === 0) {return null;}

  const showName = displayMode === 'withName';
  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const logoBoxClassName = getPartnersLogoBoxClassName('marquee', logoSize, showName);
  const logoCardClassName = getPartnersLogoCardClassName('marquee', logoSize, showName);
  const fallbackIconSize = getPartnersLogoFallbackSize('marquee', logoSize, showName);
  const logoGridGapClassName = getPartnersItemGapClassName(spacing, 'marqueeGrid');
  const columnGapClassName = getPartnersItemGapClassName(spacing, 'marqueeColumns');
  const skipSectionSpacingClassName = getPartnersSectionSpacingClassName(spacing, 'marqueeSkip');
  const sectionSpacingClassName = getPartnersSectionSpacingClassName(spacing, 'marquee');

  // Logo grid — flexbox wrap + center for balanced last row
  const logoGrid = (
    <div className={cn('flex flex-wrap justify-center', logoGridGapClassName)}>
      {normalizedItems.map((item, index) => {
        const keyBase = item.id ?? item.url ?? item.name ?? index;
        return (
          <a
            key={keyBase}
            href={item.link ?? '#'}
            className={cn('group flex flex-col items-center gap-1.5 transition-opacity duration-200 hover:opacity-80', logoCardClassName)}
            {...linkProps}
          >
            {/* Logo — direct, no circle wrapper */}
            <div className={cn('flex w-full items-center justify-center', logoBoxClassName)}>
              {item.url
                ? renderImage(item, 'h-full w-auto max-w-full object-contain')
                : <ImageIcon size={fallbackIconSize} className="text-slate-300" />}
            </div>
            {/* Partner name */}
            {showName && (
              <span className="w-full truncate text-center text-[11px] font-medium text-slate-500 md:text-xs">
                {item.name ?? `Đối tác ${index + 1}`}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );

  // Skip header: chỉ render grid (parent sẽ handle header)
  if (skipHeader) {
    return (
      <section className={cn('w-full', skipSectionSpacingClassName, className)} style={{ backgroundColor: '#f7f3ee' }}>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          {logoGrid}
        </div>
      </section>
    );
  }

  // Full layout: 2 cột — trái header, phải logo grid
  return (
    <section className={cn('w-full', sectionSpacingClassName, className)} style={{ backgroundColor: '#f7f3ee' }}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className={cn('flex flex-col lg:flex-row lg:items-center', columnGapClassName)}>
          {/* Cột trái: Header text */}
          <div className="flex-shrink-0 lg:w-[320px] xl:w-[360px]">
            <div className={cn(
              "flex flex-col",
              _align === 'left' ? "items-start text-left" : _align === 'right' ? "items-end text-right" : "items-center text-center"
            )}>
              {/* Badge — short label */}
              {badgeText && (
                <span
                  className={cn('inline-block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 md:text-[11px]', spacing === 'none' ? 'mb-0' : spacing === 'compact' ? 'mb-1' : 'mb-2')}
                >
                  {badgeText}
                </span>
              )}
              {/* Title — italic style */}
              {title && (
                <h2
                  className="text-xl font-bold leading-snug tracking-tight md:text-2xl xl:text-[1.65rem]"
                  style={{ color: '#1a1a2e', fontStyle: 'italic' }}
                >
                  {title}
                </h2>
              )}
              {/* Description — subheading */}
              {subheading && (
                <p className={cn('text-sm leading-relaxed text-slate-500 md:text-[13px] md:leading-relaxed', spacing === 'none' ? 'mt-0' : spacing === 'compact' ? 'mt-1.5' : 'mt-3')}>
                  {subheading}
                </p>
              )}
            </div>
          </div>

          {/* Cột phải: Logo grid */}
          <div className="flex-1 min-w-0">
            {logoGrid}
          </div>
        </div>
      </div>
    </section>
  );
};
