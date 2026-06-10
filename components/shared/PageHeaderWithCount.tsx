'use client';

import React from 'react';

interface PageHeaderWithCountProps {
  title: string;
  count: number;
  totalCount?: number;
  unit: string;
  titleColor?: string;
  subtitleColor?: string;
  description?: string;
  descriptionColor?: string;
  centered?: boolean;
}

export function PageHeaderWithCount({
  title,
  count,
  totalCount,
  unit,
  titleColor,
  subtitleColor,
  description,
  descriptionColor,
  centered = true,
}: PageHeaderWithCountProps) {
  if (count <= 0 && !description) {
    return (
      <div className={`mb-8 ${centered ? 'text-center' : 'text-left'}`}>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight" style={titleColor ? { color: titleColor } : undefined}>
          {title}
        </h1>
      </div>
    );
  }

  const countText = count > 0 
    ? `${count}${totalCount !== undefined && totalCount > count ? ` / ${totalCount}` : ''} ${unit}`
    : '';

  return (
    <div className={`mb-8 ${centered ? 'text-center' : 'text-left'}`}>
      <h1 className="text-3xl md:text-4xl font-bold leading-tight" style={titleColor ? { color: titleColor } : undefined}>
        {title}
      </h1>
      {countText && (
        <p 
          className="text-xs font-semibold tracking-widest uppercase opacity-65 mt-2 transition-opacity duration-300"
          style={subtitleColor ? { color: subtitleColor } : undefined}
        >
          {countText}
        </p>
      )}
      {description && (
        <p 
          className="mt-3 text-base max-w-2xl opacity-80 leading-relaxed" 
          style={{ 
            color: descriptionColor,
            marginLeft: centered ? 'auto' : '0',
            marginRight: centered ? 'auto' : '0'
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
