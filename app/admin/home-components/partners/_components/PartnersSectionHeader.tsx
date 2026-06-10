'use client';

import React from 'react';
import { cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import type { PartnersAlign } from '../_types';

const alignClassMap: Record<PartnersAlign, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

type HeaderSize = 'compact' | 'default';

export const PartnersSectionHeader = ({
  title,
  subheading,
  align = 'center',
  brandColor,
  secondary,
  mode = 'dual',
  size = 'default',
  className,
}: {
  title?: string;
  subheading?: React.ReactNode;
  align?: PartnersAlign;
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  size?: HeaderSize;
  className?: string;
}) => {
  if (!title && !subheading) {
    return null;
  }

  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);

  return (
    <div className={cn('flex w-full flex-col', alignClassMap[align], size === 'compact' ? 'mb-4 gap-1.5 md:mb-5' : 'mb-6 gap-2 md:mb-10 md:gap-3', className)}>
      {title && (
        <h2
          className={cn(
            'font-bold uppercase tracking-[0.15em]',
            size === 'compact' ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
          )}
          style={{ color: colors.primary }}
        >
          {title}
        </h2>
      )}
      {subheading && (
        <div
          className={cn(
            'max-w-3xl font-semibold tracking-tight text-slate-900',
            size === 'compact' ? 'text-base leading-snug md:text-lg' : 'text-xl leading-snug md:text-2xl xl:text-3xl'
          )}
        >
          {subheading}
        </div>
      )}
    </div>
  );
};
