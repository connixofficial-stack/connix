'use client';

import React from 'react';
import { cn } from '@/app/admin/components/ui';

interface SectionHeaderProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  brandColor?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  badgeText,
  hideHeader = false,
  showTitle = true,
  showSubtitle = true,
  showBadge = true,
  headerAlign = 'left',
  titleColorPrimary = false,
  subtitleAboveTitle = false,
  uppercaseText = false,
  brandColor,
  className,
}: SectionHeaderProps) {
  const resolvedTitle = typeof title === 'string' ? title.trim() : '';
  const resolvedSubtitle = typeof subtitle === 'string' ? subtitle.trim() : '';
  const resolvedBadgeText = typeof badgeText === 'string' ? badgeText.trim() : '';
  const hasTitle = showTitle && resolvedTitle.length > 0;
  const hasSubtitle = showSubtitle && resolvedSubtitle.length > 0;
  const hasBadge = showBadge && resolvedBadgeText.length > 0;

  if (hideHeader || (!hasTitle && !hasSubtitle && !hasBadge)) {
    return null;
  }

  const alignClass = headerAlign === 'center' ? 'text-center' : headerAlign === 'right' ? 'text-right' : 'text-left';
  const widthClass = headerAlign === 'center' ? 'mx-auto max-w-3xl' : headerAlign === 'right' ? 'ml-auto max-w-3xl' : 'mr-auto max-w-3xl';
  const titleColor = titleColorPrimary && brandColor ? brandColor : undefined;

  const badgeElement = hasBadge && (
    <div className={cn('mb-3 md:mb-4', alignClass)}>
      <span className="inline-block px-3 py-1 text-[11px] font-medium tracking-wider uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 rounded-full border border-slate-200">
        {resolvedBadgeText}
      </span>
    </div>
  );

  const titleElement = hasTitle && (
    <h2
      className={cn(
        'text-2xl md:text-3xl tracking-tight leading-tight text-balance mb-2 text-slate-900 dark:text-white',
        uppercaseText ? 'uppercase font-bold' : 'font-bold'
      )}
      style={titleColor ? { color: titleColor } : undefined}
    >
      {resolvedTitle}
    </h2>
  );

  const subtitleElement = hasSubtitle && (
    <p className={cn(
      'text-sm md:text-base leading-relaxed text-slate-500',
      uppercaseText ? 'uppercase font-medium tracking-wide' : 'font-normal'
    )}>
      {resolvedSubtitle}
    </p>
  );

  return (
    <div className={cn('mb-4 md:mb-6', widthClass, alignClass, className)}>
      {badgeElement}
      {subtitleAboveTitle ? (
        <>
          {subtitleElement}
          {titleElement}
        </>
      ) : (
        <>
          {titleElement}
          {subtitleElement}
        </>
      )}
    </div>
  );
}
