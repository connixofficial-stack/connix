"use client";

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { getPartnersContentTopSpacingClassName, getPartnersCornerRadiusClassName, getPartnersHeaderSpacingClassName, getPartnersItemGapClassName, getPartnersLogoCardClassName, getPartnersLogoFallbackSize, getPartnersSectionSpacingClassName, type PartnersAlign, type PartnersCornerRadius, type PartnersDisplayMode, type PartnersLogoSize, type PartnersSpacing } from '../_types';
import { PartnersSectionHeader } from './PartnersSectionHeader';

export type PartnerBadgeItem = {
  id?: string | number;
  url?: string;
  link?: string;
  name?: string;
};



export const PartnersBadgeShared = ({
  items,
  brandColor,
  secondary,
  mode = 'dual',
  title,
  subheading,
  align = 'center',
  displayMode = 'withName',
  cornerRadius = 'lg',
  logoSize = 'normal',
  showBorder = true,
  spacing = 'normal',
  maxVisible = 20,
  renderImage,
  openInNewTab = false,
  skipHeader = false,
  className,

}: {
  items: PartnerBadgeItem[];
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  title?: string;
  subheading?: React.ReactNode;
  align?: PartnersAlign;
  displayMode?: PartnersDisplayMode;
  cornerRadius?: PartnersCornerRadius;
  logoSize?: PartnersLogoSize;
  showBorder?: boolean;
  spacing?: PartnersSpacing;
  maxVisible?: number;
  renderImage: (item: PartnerBadgeItem, className: string) => React.ReactNode;
  openInNewTab?: boolean;
  skipHeader?: boolean;
  variant?: 'preview' | 'site';
  className?: string;
}) => {
  if (items.length === 0) {return null;}

  const visibleItems = items.slice(0, maxVisible);
  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const shouldAnimate = visibleItems.length > 1;
  const loopCount = shouldAnimate ? 2 : 1;
  const duration = Math.max(12, visibleItems.length * 3);
  const [isPaused, setIsPaused] = React.useState(false);
  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const showName = displayMode === 'withName';
  const radiusClassName = getPartnersCornerRadiusClassName(cornerRadius);
  const logoCardClassName = getPartnersLogoCardClassName('compact', logoSize, showName);
  const fallbackIconSize = getPartnersLogoFallbackSize('compact', logoSize, showName);
  const sectionSpacingClassName = getPartnersSectionSpacingClassName(spacing, 'default', skipHeader);
  const contentTopSpacingClassName = getPartnersContentTopSpacingClassName(spacing);
  const itemGapClassName = getPartnersItemGapClassName(spacing, 'track');
  const headerSpacingClassName = getPartnersHeaderSpacingClassName(spacing);

  return (
    <section className={cn('w-full overflow-hidden bg-white', sectionSpacingClassName, className)}>
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        {!skipHeader && (
          <PartnersSectionHeader
            title={title ?? 'Đối tác'}
            subheading={subheading}
            align={align}
            brandColor={brandColor}
            secondary={secondary}
            mode={mode}
            className={headerSpacingClassName}
          />
        )}
      </div>
      {/* Auto-scroll track */}
      <div
        className={cn('relative overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_32px,_black_calc(100%-32px),transparent_100%)] md:[mask-image:_linear-gradient(to_right,transparent_0,_black_64px,_black_calc(100%-64px),transparent_100%)]', contentTopSpacingClassName)}
        onMouseEnter={() => { setIsPaused(true); }}
        onMouseLeave={() => { setIsPaused(false); }}
        onTouchStart={() => { setIsPaused(true); }}
        onTouchEnd={() => { setIsPaused(false); }}
      >
        <style>{`@keyframes badge-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } } .badge-no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        <div
          className="flex min-w-max items-center"
          style={
            shouldAnimate
              ? {
                  animationName: 'badge-scroll',
                  animationDuration: `${duration}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationPlayState: isPaused ? 'paused' : 'running',
                }
              : undefined
          }
        >
          {Array.from({ length: loopCount }).map((_, loopIdx) => (
            <div key={`loop-${loopIdx}`} className={cn('flex shrink-0 items-center px-1.5 md:px-2', itemGapClassName)}>
              {visibleItems.map((item, idx) => (
                <a
                  key={`${loopIdx}-${item.id ?? idx}`}
                  href={item.link || '#'}
                  className={cn(
                    'group flex shrink-0 select-none items-center justify-center bg-white transition-all duration-200 hover:shadow-md',
                    showBorder ? 'border border-slate-100' : 'border border-transparent',
                    radiusClassName,
                    logoCardClassName,
                  )}
                  onMouseEnter={(event) => { event.currentTarget.style.borderColor = showBorder ? colors.secondary : 'transparent'; }}
                  onMouseLeave={(event) => { event.currentTarget.style.borderColor = ''; }}
                  {...linkProps}
                >
                  <div className="flex w-full items-center justify-center">
                    {item.url
                      ? renderImage(item, 'w-full h-auto object-contain')
                      : <ImageIcon size={fallbackIconSize} className="text-slate-300" />}
                  </div>
                  {showName && (
                    <span className="w-full truncate text-center text-xs font-medium text-slate-500 md:text-sm">
                      {item.name ?? `Đối tác ${idx + 1}`}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
