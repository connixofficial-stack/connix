"use client";

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/app/admin/components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { getPartnersContentTopSpacingClassName, getPartnersCornerRadiusClassName, getPartnersHeaderSpacingClassName, getPartnersItemGapClassName, getPartnersLogoBoxClassName, getPartnersLogoCardClassName, getPartnersLogoFallbackSize, getPartnersSectionSpacingClassName, type PartnersAlign, type PartnersCornerRadius, type PartnersDisplayMode, type PartnersLogoSize, type PartnersSpacing } from '../_types';
import { PartnersSectionHeader } from './PartnersSectionHeader';

type PartnersCarouselItem = {
  id?: string | number;
  url: string;
  link?: string;
  name?: string;
};

const PartnersCarouselInner = ({
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
  openInNewTab = false,
  skipHeader = false,
  renderImage,
  className,
}: {
  items: PartnersCarouselItem[];
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
  openInNewTab?: boolean;
  skipHeader?: boolean;
  renderImage?: (item: PartnersCarouselItem, className: string) => React.ReactNode;
  className?: string;
}) => {
  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const showName = displayMode === 'withName';
  const radiusClassName = getPartnersCornerRadiusClassName(cornerRadius);
  const logoBoxClassName = getPartnersLogoBoxClassName('compact', logoSize, showName);
  const logoCardClassName = getPartnersLogoCardClassName('compact', logoSize, showName);
  const fallbackIconSize = getPartnersLogoFallbackSize('compact', logoSize, showName);
  const sectionSpacingClassName = getPartnersSectionSpacingClassName(spacing, 'default', skipHeader);
  const contentTopSpacingClassName = getPartnersContentTopSpacingClassName(spacing);
  const itemGapClassName = getPartnersItemGapClassName(spacing, 'track');
  const headerSpacingClassName = getPartnersHeaderSpacingClassName(spacing);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  React.useEffect(() => {
    if (!emblaApi) { return; }
    const update = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on('select', update);
    emblaApi.on('reInit', update);
    return () => { emblaApi.off('select', update); emblaApi.off('reInit', update); };
  }, [emblaApi]);

  if (items.length === 0) {
    return (
      <section className={cn('w-full bg-white dark:bg-slate-900', getPartnersSectionSpacingClassName(spacing, 'empty'), className)}>
        <div className={cn('flex flex-col items-center justify-center text-center', getPartnersSectionSpacingClassName(spacing, 'empty'))}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: colors.iconBg }}>
            <ImageIcon size={28} style={{ color: colors.iconColor }} />
          </div>
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có đối tác nào</h3>
          <p className="text-sm text-slate-500">Thêm logo đối tác đầu tiên</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn('w-full bg-white', sectionSpacingClassName, className)}
      data-can-scroll-prev={canScrollPrev}
      data-can-scroll-next={canScrollNext}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {!skipHeader && (
          <div className={cn('mb-5 md:mb-8', spacing === 'compact' && 'mb-3 md:mb-4', spacing === 'none' && 'mb-0 md:mb-0')}>
            <div className="flex-1 min-w-0">
              <PartnersSectionHeader
                title={title ?? 'Đối tác'}
                subheading={subheading}
                align={align}
                brandColor={brandColor}
                secondary={secondary}
                mode={mode}
                className={headerSpacingClassName}
              />
            </div>
          </div>
        )}

        {/* Embla viewport */}
        <div className={cn('overflow-hidden', skipHeader && contentTopSpacingClassName)} ref={emblaRef}>
          <div className={cn('flex', itemGapClassName)}>
            {items.map((item, index) => {
              const key = item.id ?? item.link ?? index;
              return (
                <a
                  key={key}
                  href={item.link || '#'}
                  target={openInNewTab ? '_blank' : undefined}
                  rel={openInNewTab ? 'noopener noreferrer' : undefined}
                  className={cn(
                    'group flex shrink-0 select-none items-center justify-center bg-white transition-all duration-200 hover:shadow-md',
                    showBorder ? 'border border-slate-100' : 'border border-transparent',
                    radiusClassName,
                    logoCardClassName,
                  )}
                  onMouseEnter={(event) => { event.currentTarget.style.borderColor = showBorder ? colors.secondary : 'transparent'; }}
                  onMouseLeave={(event) => { event.currentTarget.style.borderColor = ''; }}
                  draggable={false}
                >
                  <div className={cn(
                    'flex w-full items-center justify-center pointer-events-none',
                    logoBoxClassName,
                  )}>
                    {item.url
                      ? (renderImage
                          ? renderImage(item, 'h-full w-auto max-w-full object-contain pointer-events-none')
                          : <ImageIcon size={fallbackIconSize} className="text-slate-300" />)
                      : <ImageIcon size={fallbackIconSize} className="text-slate-300" />}
                  </div>
                  {showName && (
                    <span className="w-full truncate text-center text-xs font-medium text-slate-500 md:text-sm pointer-events-none">
                      {item.name ?? `Đối tác ${index + 1}`}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export const PartnersCarouselShared = (props: Parameters<typeof PartnersCarouselInner>[0]) => {
  return <PartnersCarouselInner {...props} />;
};
