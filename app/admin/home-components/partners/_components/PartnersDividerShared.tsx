'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { getPartnersContentTopSpacingClassName, getPartnersCornerRadiusClassName, getPartnersHeaderSpacingClassName, getPartnersLogoBoxClassName, getPartnersLogoFallbackSize, getPartnersSectionSpacingClassName, type PartnersAlign, type PartnersCornerRadius, type PartnersDisplayMode, type PartnersLogoSize, type PartnersSpacing } from '../_types';
import { PartnersSectionHeader } from './PartnersSectionHeader';

type PartnersDividerItem = {
  id?: string | number;
  url?: string;
  link?: string;
  name?: string;
};

export const PartnersDividerShared = ({
  items,
  title,
  subheading,
  align = 'center',
  displayMode = 'withName',
  cornerRadius = 'lg',
  logoSize = 'normal',
  showBorder = true,
  spacing = 'normal',
  brandColor,
  secondary,
  mode = 'dual',
  renderImage,
  openInNewTab = false,
  skipHeader = false,
  columnsClassName,
  className,
}: {
  items: PartnersDividerItem[];
  title?: string;
  subheading?: React.ReactNode;
  align?: PartnersAlign;
  displayMode?: PartnersDisplayMode;
  cornerRadius?: PartnersCornerRadius;
  logoSize?: PartnersLogoSize;
  showBorder?: boolean;
  spacing?: PartnersSpacing;
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  renderImage: (item: PartnersDividerItem, className: string) => React.ReactNode;
  openInNewTab?: boolean;
  skipHeader?: boolean;
  columnsClassName?: string;
  className?: string;
}) => {
  if (items.length === 0) {return null;}

  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const showName = displayMode === 'withName';
  const radiusClassName = getPartnersCornerRadiusClassName(cornerRadius);
  const logoBoxClassName = getPartnersLogoBoxClassName('compact', logoSize, showName);
  const fallbackIconSize = getPartnersLogoFallbackSize('compact', logoSize, showName);
  const sectionSpacingClassName = getPartnersSectionSpacingClassName(spacing, 'default', skipHeader);
  const contentTopSpacingClassName = getPartnersContentTopSpacingClassName(spacing);
  const headerSpacingClassName = getPartnersHeaderSpacingClassName(spacing);

  const resolvedColumnsClassName = columnsClassName ?? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';

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
        {/* Grid with subtle divider borders — clean, minimal */}
        <div
          className={cn('grid overflow-hidden', contentTopSpacingClassName, showBorder && 'border', radiusClassName, resolvedColumnsClassName)}
          style={{ borderColor: showBorder ? colors.neutralBorder : undefined }}
        >
          {items.map((item, index) => (
            <a
              key={item.id ?? `${item.url ?? ''}-${index}`}
              href={item.link ?? '#'}
              className={cn(
                'group flex flex-col items-center justify-center bg-white text-center transition-colors',
                showName ? 'gap-2 p-4 md:p-5' : 'p-4 md:p-6',
                showBorder && 'border-b border-r',
              )}
              style={{ borderColor: showBorder ? colors.neutralBorder : undefined }}
              onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = colors.neutralSubtle; }}
              onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = ''; }}
              {...linkProps}
            >
              <div className={cn(
                'flex w-full items-center justify-center',
                logoBoxClassName,
              )}>
                {item.url
                  ? renderImage(item, 'mx-auto h-full w-auto max-w-full object-contain')
                  : <ImageIcon size={fallbackIconSize} className="text-slate-300" />}
              </div>
              {showName && (
                <span className="w-full truncate text-xs font-medium text-slate-500 md:text-sm">
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
