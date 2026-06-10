'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';

export interface StorefrontCardProps {
  layout: 'grid' | 'list';
  href: string;
  image?: string;
  imageAlt?: string;
  fallbackIcon?: React.ReactNode;
  categoryName?: string;

  // Tiêu đề card
  title: string;

  // Mô tả ngắn
  description?: string;

  // Phần thông tin bổ sung ở cột trái (metadata dạng inline hoặc list)
  leftMetadata?: React.ReactNode;

  // Phần thông số phụ ở cột phải (giá tiền, dung lượng, thời lượng, v.v.)
  rightDetails?: React.ReactNode;

  // Nhãn nút kêu gọi hành động (CTA)
  ctaLabel?: string;

  // Cấu hình style
  brandColor?: string;
  radiusClass?: string;
  isDark?: boolean;
  imageAspectRatioClass?: string;
}

export function StorefrontCard({
  layout,
  href,
  image,
  imageAlt,
  fallbackIcon,
  categoryName,
  title,
  description,
  leftMetadata,
  rightDetails,
  ctaLabel = 'Xem chi tiết',
  brandColor = '#3b82f6',
  radiusClass = 'rounded-xl',
  isDark = false,
  imageAspectRatioClass = 'aspect-video'
}: StorefrontCardProps) {

  if (layout === 'grid') {
    return (
      <Link
        href={href}
        className={`group overflow-hidden border transition-all duration-300 flex flex-col h-full hover:border-[var(--card-hover-border)] hover:shadow-lg hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-1 ${radiusClass}`}
        style={{
          backgroundColor: isDark ? '#161617' : '#ffffff',
          borderColor: isDark ? '#27272a' : '#e2e8f0',
          '--card-hover-border': brandColor,
          '--card-hover-shadow': `${brandColor}15`,
        } as React.CSSProperties}
      >
        {/* Hình ảnh */}
        <div className={`overflow-hidden relative ${imageAspectRatioClass} bg-slate-100 dark:bg-[#1c1c1e] shrink-0`}>
          {image ? (
            <Image
              mode="thumb"
              src={image}
              alt={imageAlt || title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {fallbackIcon || <div className="text-slate-400 dark:text-zinc-500">Hình ảnh</div>}
            </div>
          )}
        </div>

        {/* Nội dung chữ */}
        <div className="p-3 sm:p-4 flex flex-1 flex-col justify-between">
          <div className="space-y-2">
            {categoryName && (
              <div className="flex mb-1.5">
                <span
                  className="text-[9px] sm:text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border transition-all duration-300"
                  style={{
                    backgroundColor: `${brandColor}0d`,
                    color: brandColor,
                    borderColor: `${brandColor}25`
                  }}
                >
                  {categoryName}
                </span>
              </div>
            )}

            <h3
              className="text-xs sm:text-sm font-medium line-clamp-2 transition-colors mb-1 sm:mb-2 group-hover:text-[var(--title-hover-color)]"
              style={{
                color: isDark ? '#f5f5f7' : '#1d1d1f',
                '--title-hover-color': brandColor
              } as React.CSSProperties}
            >
              {title}
            </h3>

            {description && (
              <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-[#86868b]">
                {description}
              </p>
            )}

            {leftMetadata && <div className="pt-1">{leftMetadata}</div>}
          </div>

          {rightDetails && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/40">
              {rightDetails}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // layout === 'list'
  return (
    <Link
      href={href}
      className={`group flex flex-col sm:flex-row gap-4 border transition-all duration-300 p-4 hover:border-[var(--card-hover-border)] hover:shadow-lg hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-0.5 ${radiusClass}`}
      style={{
        backgroundColor: isDark ? '#161617' : '#ffffff',
        borderColor: isDark ? '#27272a' : '#e2e8f0',
        '--card-hover-border': brandColor,
        '--card-hover-shadow': `${brandColor}10`,
      } as React.CSSProperties}
    >
      {/* Thumbnail */}
      <div className={`w-full sm:w-32 md:w-40 shrink-0 overflow-hidden rounded-lg relative ${imageAspectRatioClass} bg-slate-100 dark:bg-[#1c1c1e]`}>
        {image ? (
          <Image
            mode="thumb"
            src={image}
            alt={imageAlt || title}
            fill
            sizes="(max-width: 640px) 100vw, 160px"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {fallbackIcon || <div className="text-slate-400 dark:text-zinc-500">Hình ảnh</div>}
          </div>
        )}
      </div>

      {/* Content layout: 2 columns on Desktop */}
      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column: Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1.5">
          {categoryName && (
            <div className="flex">
              <span
                className="text-[9px] sm:text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border transition-all duration-300"
                style={{
                  backgroundColor: `${brandColor}0d`,
                  color: brandColor,
                  borderColor: `${brandColor}25`
                }}
              >
                {categoryName}
              </span>
            </div>
          )}

          <h3
            className="font-semibold text-lg transition-colors mb-2 group-hover:text-[var(--title-hover-color)]"
            style={{
              color: isDark ? '#f5f5f7' : '#1d1d1f',
              '--title-hover-color': brandColor
            } as React.CSSProperties}
          >
            {title}
          </h3>

          {description && (
            <p className="text-sm line-clamp-2 mb-2 text-slate-500 dark:text-[#86868b] leading-relaxed">
              {description}
            </p>
          )}

          {leftMetadata && <div className="w-full pt-1">{leftMetadata}</div>}
        </div>

        {/* Right Column: Details & CTA */}
        <div className="flex flex-col items-start md:items-end justify-center shrink-0 min-w-[220px] md:text-right gap-2 border-t md:border-t-0 border-slate-100 dark:border-zinc-800/40 pt-3 md:pt-0">
          {rightDetails && (
            <div className="w-full flex md:justify-end">
              {rightDetails}
            </div>
          )}

          {ctaLabel && (
            <div className="w-full max-w-[220px] mt-2 md:mt-1 flex md:justify-end">
              <span
                className="inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-300 group-hover:brightness-95 group-hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow whitespace-nowrap"
                style={{
                  backgroundColor: brandColor,
                  color: '#ffffff',
                }}
              >
                {ctaLabel} →
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
