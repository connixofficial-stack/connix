"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import {
  getPartnersCornerRadiusClassName,
  getPartnersLogoBoxClassName,
  getPartnersLogoFallbackSize,
  normalizePartnersLogoColorIntensity,
  type PartnersCornerRadius,
  type PartnersLogoSize,
  type PartnersSpacing,
  type PartnersLogoColorMode,
  type PartnersLogoColorIntensity,
} from '../_types';

type PartnersGlassLogoCloudItem = {
  id?: string | number;
  url: string;
  link?: string;
  name?: string;
};

const AUTOPLAY_INTERVAL_MS = 2600;

export const PartnersGlassLogoCloudShared = ({
  items,
  brandColor = '#ECAA4D',
  secondary = '',
  mode = 'dual',
  cornerRadius = 'lg',
  logoSize = 'normal',
  showBorder = true,
  spacing: _spacing = 'normal',
  logoColorMode = 'grayscale',
  logoColorIntensity,
  openInNewTab = false,
  renderImage,
  className,
}: {
  items: PartnersGlassLogoCloudItem[];
  brandColor?: string;
  secondary?: string;
  mode?: PartnersBrandMode;
  cornerRadius?: PartnersCornerRadius;
  logoSize?: PartnersLogoSize;
  showBorder?: boolean;
  spacing?: PartnersSpacing;
  logoColorMode?: PartnersLogoColorMode;
  logoColorIntensity?: PartnersLogoColorIntensity;
  openInNewTab?: boolean;
  renderImage?: (item: PartnersGlassLogoCloudItem, className: string) => React.ReactNode;
  className?: string;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    loop: items.length > 5,
  });

  React.useEffect(() => {
    if (!emblaApi || items.length <= 5) { return; }

    const timer = window.setInterval(() => {
      emblaApi.scrollNext();
    }, AUTOPLAY_INTERVAL_MS);

    return () => { window.clearInterval(timer); };
  }, [emblaApi, items.length]);

  if (items.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center text-center py-10 bg-slate-900 border border-slate-800 rounded-xl', className)}>
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
          <ImageIcon size={28} className="text-slate-500" />
        </div>
        <h3 className="mb-1 font-medium text-slate-100">Chưa có đối tác nào</h3>
        <p className="text-sm text-slate-400">Thêm logo đối tác đầu tiên</p>
      </div>
    );
  }

  const radiusClassName = getPartnersCornerRadiusClassName(cornerRadius);
  const logoClassName = getPartnersLogoBoxClassName('glassLogoCloud', logoSize, false);
  const fallbackIconSize = getPartnersLogoFallbackSize('glassLogoCloud', logoSize, false);
  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);

  const resolvedLogoColorIntensity = normalizePartnersLogoColorIntensity(logoColorIntensity, logoColorMode);

  const getFilterStyle = (intensity: PartnersLogoColorIntensity): React.CSSProperties => {
    if (intensity <= 0) {
      return { filter: 'none' };
    }

    if (intensity <= 50) {
      return { filter: `grayscale(${intensity * 2}%)` };
    }

    const whiteProgress = (intensity - 50) / 50;
    return {
      filter: `grayscale(100%) brightness(${1 - whiteProgress}) invert(${whiteProgress})`,
    };
  };

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
      role="region"
      aria-roledescription="carousel"
      style={{
        '--partners-glass-accent': colors.secondary,
        '--partners-glass-ring': brandColor,
      } as React.CSSProperties}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="ml-0 flex px-3 sm:px-4">
          {items.map((item, index) => {
            const key = item.id ?? item.link ?? item.url ?? index;
            const label = item.name || 'Hình ảnh';
            const filterStyle = getFilterStyle(resolvedLogoColorIntensity);
            
            const content = (
              <>
                {item.url ? (
                  <span className="inline-flex items-center justify-center opacity-70 transition-all duration-300 hover:scale-105 hover:opacity-100" style={filterStyle}>
                    {renderImage ? (
                      renderImage(item, cn(logoClassName, 'w-auto h-auto max-w-full object-contain'))
                    ) : (
                      <img
                        src={item.url}
                        alt={label}
                        className={cn(logoClassName, 'w-auto h-auto max-w-full object-contain')}
                        draggable={false}
                      />
                    )}
                  </span>
                ) : (
                  <ImageIcon size={fallbackIconSize} className="text-slate-500" />
                )}
              </>
            );

            const innerClassName = cn(
              'flex h-full items-center justify-center p-3 px-3 md:px-6 lg:px-8 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--partners-glass-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              showBorder ? 'border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10' : 'border border-transparent hover:bg-white/[0.02]',
              radiusClassName,
            );

            return (
              <div
                key={key}
                role="group"
                aria-roledescription="slide"
                className="min-w-0 shrink-0 grow-0 basis-1/2 pl-3 xs:basis-1/3 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 sm:pl-4 flex items-center justify-center"
              >
                {item.link ? (
                  <a
                    aria-label={label}
                    className={innerClassName}
                    href={item.link}
                    target={openInNewTab ? '_blank' : undefined}
                    rel={openInNewTab ? 'noopener noreferrer' : undefined}
                    draggable={false}
                  >
                    {content}
                  </a>
                ) : (
                  <div aria-label={label} className={innerClassName}>
                    {content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
