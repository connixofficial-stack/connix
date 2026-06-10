'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { getPartnersContentTopSpacingClassName, getPartnersCornerRadiusClassName, getPartnersHeaderSpacingClassName, getPartnersItemGapClassName, getPartnersLogoBoxClassName, getPartnersLogoFallbackSize, getPartnersSectionSpacingClassName, type PartnersAlign, type PartnersCornerRadius, type PartnersDisplayMode, type PartnersLogoSize, type PartnersSpacing } from '../_types';
import { PartnersSectionHeader } from './PartnersSectionHeader';

type PartnersCleanItem = {
  id?: string | number;
  url?: string;
  link?: string;
  name?: string;
};

export const PartnersCleanShared = ({
  items,
  title,
  subheading,
  align = 'center',
  displayMode = 'withName',
  cornerRadius = 'lg',
  logoSize = 'normal',
  spacing = 'normal',
  brandColor,
  secondary,
  mode = 'dual',
  renderImage,
  openInNewTab = false,
  skipHeader = false,
  className,
}: {
  items: PartnersCleanItem[];
  title?: string;
  subheading?: React.ReactNode;
  align?: PartnersAlign;
  displayMode?: PartnersDisplayMode;
  cornerRadius?: PartnersCornerRadius;
  logoSize?: PartnersLogoSize;
  spacing?: PartnersSpacing;
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  renderImage: (item: PartnersCleanItem, className: string) => React.ReactNode;
  openInNewTab?: boolean;
  skipHeader?: boolean;
  className?: string;
}) => {
  if (items.length === 0) {return null;}

  const _colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const showName = displayMode === 'withName';
  const radiusClassName = getPartnersCornerRadiusClassName(cornerRadius);
  const logoBoxClassName = getPartnersLogoBoxClassName('clean', logoSize, showName);
  const fallbackIconSize = getPartnersLogoFallbackSize('clean', logoSize, showName);
  const sectionSpacingClassName = getPartnersSectionSpacingClassName(spacing, 'default', skipHeader);
  const contentTopSpacingClassName = getPartnersContentTopSpacingClassName(spacing);
  const flowGapClassName = getPartnersItemGapClassName(spacing, showName ? 'cleanName' : 'cleanLogo');
  const headerSpacingClassName = getPartnersHeaderSpacingClassName(spacing);

  return (
    <section className={cn('w-full bg-white', sectionSpacingClassName, className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {!skipHeader && (
          <PartnersSectionHeader
            title={title}
            subheading={subheading}
            align={align}
            brandColor={brandColor}
            secondary={secondary}
            mode={mode}
            className={headerSpacingClassName}
          />
        )}
        {/* Inline flow: logos with optional names, wrap naturally */}
        <div className={cn(
          'flex flex-wrap items-center justify-center',
          contentTopSpacingClassName,
          flowGapClassName,
        )}>
          {items.map((item, index) => (
            <a
              key={item.id ?? `${item.url ?? ''}-${index}`}
              href={item.link ?? '#'}
              className={cn(
                'group flex items-center transition-opacity duration-200 hover:opacity-80',
                showName ? 'gap-2 md:gap-2.5' : 'justify-center',
              )}
              {...linkProps}
            >
              {item.url
                ? (
                  <div className={showName
                    ? cn('flex items-center justify-center overflow-hidden', logoBoxClassName, radiusClassName)
                    : cn('flex items-center justify-center overflow-hidden', logoBoxClassName, radiusClassName)
                  }>
                    {renderImage(item, 'h-full w-full object-contain')}
                  </div>
                )
                : <ImageIcon size={fallbackIconSize} className="text-slate-400" />}
              {showName && (
                <span className="whitespace-nowrap text-sm font-medium text-slate-600 md:text-base">
                  {item.name ?? `Đối tác ${index + 1}`}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
