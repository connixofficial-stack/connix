"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { getPartnersCornerRadiusClassName, getPartnersLogoBoxClassName, getPartnersLogoFallbackSize, getPartnersSectionSpacingClassName, type PartnersCornerRadius, type PartnersLogoSize, type PartnersSpacing } from '../_types';

type PartnersLogoCloudItem = {
  id?: string | number;
  url: string;
  link?: string;
  name?: string;
};

const AUTOPLAY_INTERVAL_MS = 2600;

export const PartnersLogoCloudShared = ({
  items,
  brandColor = '#ECAA4D',
  secondary = '',
  mode = 'dual',
  cornerRadius = 'lg',
  logoSize = 'normal',
  showBorder = true,
  spacing = 'normal',
  openInNewTab = false,
  renderImage,
  className,
}: {
  items: PartnersLogoCloudItem[];
  brandColor?: string;
  secondary?: string;
  mode?: PartnersBrandMode;
  cornerRadius?: PartnersCornerRadius;
  logoSize?: PartnersLogoSize;
  showBorder?: boolean;
  spacing?: PartnersSpacing;
  openInNewTab?: boolean;
  renderImage?: (item: PartnersLogoCloudItem, className: string) => React.ReactNode;
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
      <div className={cn('flex flex-col items-center justify-center text-center', getPartnersSectionSpacingClassName(spacing, 'empty'), className)}>
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <ImageIcon size={28} className="text-slate-400" />
        </div>
        <h3 className="mb-1 font-medium text-slate-900">Chưa có đối tác nào</h3>
        <p className="text-sm text-slate-500">Thêm logo đối tác đầu tiên</p>
      </div>
    );
  }

  const radiusClassName = getPartnersCornerRadiusClassName(cornerRadius);
  const logoClassName = getPartnersLogoBoxClassName('logoCloud', logoSize, false);
  const fallbackIconSize = getPartnersLogoFallbackSize('logoCloud', logoSize, false);
  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);

  return (
    <div
      className={cn('relative w-full', className)}
      role="region"
      aria-roledescription="carousel"
      style={{
        '--partners-logo-cloud-accent': colors.secondary,
        '--partners-logo-cloud-ring': brandColor,
      } as React.CSSProperties}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="ml-0 flex px-4">
          {items.map((item, index) => {
            const key = item.id ?? item.link ?? item.url ?? index;
            const label = item.name || 'Hình ảnh';
            const content = (
              <>
                {item.url
                  ? renderImage?.(item, cn(logoClassName, 'w-auto h-auto max-w-full object-contain transition-transform duration-300 hover:scale-105')) ?? null
                  : <ImageIcon size={fallbackIconSize} className="text-slate-300" />}
              </>
            );
            const innerClassName = cn(
              'flex h-full items-center justify-center p-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--partners-logo-cloud-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              showBorder ? 'border border-transparent hover:border-[var(--partners-logo-cloud-accent)]' : 'border border-transparent',
              radiusClassName,
            );

            return (
              <div
                key={key}
                role="group"
                aria-roledescription="slide"
                className="min-w-0 shrink-0 grow-0 basis-1/3 pl-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
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
