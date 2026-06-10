'use client';

import React from 'react';
import { cn } from '../../../components/ui';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { BlogPostItem } from './BlogForm';
import {
  getBlogColorTokens,
  getBlogValidationResult,
  type BlogBrandMode,
} from '../_lib/colors';
import { BLOG_STYLES } from '../_lib/constants';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import type { BlogCardRadius, BlogStyle } from '../_types';
import { BlogSectionRuntime } from './BlogSectionRuntime';
import type { PreviewDevice } from '../../_shared/hooks/usePreviewDevice';

interface BlogPreviewProps {
  brandColor: string;
  secondary: string;
  mode?: BlogBrandMode;
  postCount?: number;
  selectedStyle?: BlogStyle;
  onStyleChange?: (style: BlogStyle) => void;
  title?: string;
  previewItems?: BlogPostItem[];
  categoryMap?: Record<string, string>;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  subtitle?: string;
  showAuthor?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  // Header config (shared SectionHeader)
  hideHeader?: boolean;
  showTitleHeader?: boolean;
  showSubtitleHeader?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  // Grid columns
  desktopColumns?: 3 | 4;
  cornerRadius?: BlogCardRadius;
}

const getPreviewViewportClassName = (device: PreviewDevice) => {
  if (device === 'desktop') {
    return 'w-full flex-1';
  }

  return 'w-full flex-1';
};

const getDeviceFrameClassName = (device: PreviewDevice) => {
  if (device === 'desktop') {
    return 'w-full border-t-4 overflow-hidden';
  }

  if (device === 'tablet') {
    return 'w-full min-h-full border-t-[6px] overflow-hidden';
  }

  return 'w-full min-h-full border-t-[6px] overflow-hidden';
};

const getPreviewContentClassName = (device: PreviewDevice) => {
  if (device === 'mobile') {
    return '-mx-4';
  }

  if (device === 'tablet') {
    return '-mx-3';
  }

  return '';
};

const MOCK_POSTS: BlogPostItem[] = [
  {
    _id: '1',
    _creationTime: Date.now() - 8 * 24 * 60 * 60 * 1000,
    title: 'Xu hướng thiết kế web hiện đại năm 2026',
    excerpt: 'Những xu hướng thiết kế website nổi bật giúp tăng trải nghiệm người dùng và hiệu quả chuyển đổi.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
    categoryId: 'cat-design',
    slug: 'xhu-thiet-ke-web-2026',
    status: 'Published',
    views: 324,
  },
  {
    _id: '2',
    _creationTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    title: 'Tối ưu SEO cho website doanh nghiệp',
    excerpt: 'Các chiến lược SEO on-page và technical SEO để website đạt thứ hạng cao trên Google.',
    thumbnail: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=500&fit=crop',
    categoryId: 'cat-seo',
    slug: 'toi-uu-seo-doanh-nghiep',
    status: 'Published',
    views: 280,
  },
  {
    _id: '3',
    _creationTime: Date.now() - 6 * 24 * 60 * 60 * 1000,
    title: 'React 19: Những tính năng mới cần biết',
    excerpt: 'Khám phá các cập nhật quan trọng trong React 19 và cách áp dụng vào dự án thực tế.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=500&fit=crop',
    categoryId: 'cat-frontend',
    slug: 'react-19-tinh-nang-moi',
    status: 'Published',
    views: 520,
  },
  {
    _id: '4',
    _creationTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
    title: 'Bảo mật website: 10 lỗi phổ biến cần tránh',
    excerpt: 'Những lỗ hổng bảo mật thường gặp và biện pháp phòng tránh hiệu quả cho website.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=500&fit=crop',
    categoryId: 'cat-security',
    slug: 'bao-mat-website-10-loi',
    status: 'Published',
    views: 410,
  },
  {
    _id: '5',
    _creationTime: Date.now() - 4 * 24 * 60 * 60 * 1000,
    title: 'Performance tối ưu: Core Web Vitals trong thực tế',
    excerpt: 'Hướng dẫn tối ưu LCP, FID, CLS để cải thiện trải nghiệm và SEO tổng thể.',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
    categoryId: 'cat-performance',
    slug: 'performance-core-web-vitals',
    status: 'Published',
    views: 365,
  },
  {
    _id: '6',
    _creationTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    title: 'Thiết kế landing page tăng tỷ lệ chuyển đổi',
    excerpt: 'Nguyên tắc thiết kế landing page hiệu quả cho chiến dịch marketing.',
    thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=500&fit=crop',
    categoryId: 'cat-marketing',
    slug: 'landing-page-chuyen-doi',
    status: 'Published',
    views: 198,
  },
  {
    _id: '7',
    _creationTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
    title: 'Hướng dẫn chọn hosting phù hợp cho doanh nghiệp',
    excerpt: 'So sánh shared hosting, VPS và cloud để chọn giải pháp phù hợp.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop',
    categoryId: 'cat-infra',
    slug: 'chon-hosting-doanh-nghiep',
    status: 'Published',
    views: 244,
  },
  {
    _id: '8',
    _creationTime: Date.now() - 1 * 24 * 60 * 60 * 1000,
    title: 'Chiến lược nội dung giúp tăng traffic tự nhiên',
    excerpt: 'Lập kế hoạch content marketing bền vững để thu hút khách hàng tiềm năng.',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=500&fit=crop',
    categoryId: 'cat-content',
    slug: 'chien-luoc-noi-dung-traffic',
    status: 'Published',
    views: 169,
  },
];

export const BlogPreview = ({
  brandColor,
  secondary,
  mode = 'dual',
  postCount = 6,
  selectedStyle = 'layout1',
  onStyleChange,
  title = 'Bài viết',
  previewItems,
  categoryMap,
  fontStyle,
  fontClassName,
  subtitle,
  showAuthor = true,
  showExcerpt = true,
  showDate = true,
  // Header config
  hideHeader = false,
  showTitleHeader = true,
  showSubtitleHeader = true,
  showBadge = true,
  badgeText = '',
  headerAlign = 'left',
  titleColorPrimary = false,
  subtitleAboveTitle = false,
  uppercaseText = false,
  spacing,
  // Grid columns
  desktopColumns = 4,
  cornerRadius = 'lg',
}: BlogPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const previewDeviceWidthClass = deviceWidths[device];

  const tokens = React.useMemo(
    () => adaptTokensForDarkMode(getBlogColorTokens({ primary: brandColor, secondary, mode }), isDark),
    [brandColor, secondary, mode, isDark]
  );

  const validation = getBlogValidationResult({
    primary: brandColor,
    secondary,
    mode,
  });

  const displayPosts = React.useMemo(() => {
    if (previewItems && previewItems.length > 0) {
      return previewItems.map((post) => ({
        author: 'Admin',
        category: post.categoryName || (post.categoryId && categoryMap ? categoryMap[post.categoryId] : 'Tin tức'),
        date: post.publishedAt
          ? new Date(post.publishedAt).toLocaleDateString('vi-VN')
          : new Date(post._creationTime).toLocaleDateString('vi-VN'),
        excerpt: post.excerpt,
        id: post._id,
        thumbnail: post.thumbnail,
        title: post.title,
      }));
    }
    return MOCK_POSTS.slice(0, Math.max(postCount, 6)).map((post) => ({
      author: 'Admin',
      category: post.categoryId && categoryMap ? categoryMap[post.categoryId] : 'Tin tức',
      date: post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('vi-VN')
        : new Date(post._creationTime).toLocaleDateString('vi-VN'),
      excerpt: post.excerpt,
      id: post._id,
      thumbnail: post.thumbnail,
      title: post.title,
    }));
  }, [categoryMap, postCount, previewItems]);

  const warningMessages = React.useMemo(() => {
    if (mode === 'single') {
      return [] as string[];
    }

    const warnings: string[] = [];

    if (validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Độ tương phản thương hiệu thấp (ΔE=${validation.harmonyStatus.deltaE}). Nên tăng khác biệt giữa màu chính và màu phụ.`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA. minLc hiện tại: ${validation.accessibility.minLc.toFixed(1)}.`);
    }

    return warnings;
  }, [mode, validation]);

  return (
    <div className={cn('space-y-3', fontClassName)} style={fontStyle}>
      <PreviewWrapper
        title={`Preview Blog (${postCount} bài viết)`}
        device={device}
        setDevice={setDevice}
        previewStyle={selectedStyle}
        setPreviewStyle={(style) => {onStyleChange?.(style as BlogStyle);}}
        styles={BLOG_STYLES}
        info="desktop shell"
        deviceWidthClass={previewDeviceWidthClass}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/blog">
          <div className={getPreviewContentClassName(device)}>
            <div
              className={cn(isDark ? 'bg-slate-900' : 'bg-white', 'transition-all duration-300 relative flex flex-col', getDeviceFrameClassName(device))}
              style={{
                borderTopColor: tokens.primary.solid,
              } as React.CSSProperties}
            >
              <div className={getPreviewViewportClassName(device)}>
                <BlogSectionRuntime
                  items={displayPosts}
                  title={title}
                  subtitle={subtitle}
                  style={selectedStyle}
                  tokens={tokens}
                  context="preview"
                  device={device}
                  showAuthor={showAuthor}
                  showExcerpt={showExcerpt}
                  showDate={showDate}
                  fontClassName={fontClassName}
                  fontStyle={fontStyle}
                  hideHeader={hideHeader}
                  showTitleHeader={showTitleHeader}
                  showSubtitleHeader={showSubtitleHeader}
                  showBadge={showBadge}
                  badgeText={badgeText}
                  headerAlign={headerAlign}
                  titleColorPrimary={titleColorPrimary}
                  subtitleAboveTitle={subtitleAboveTitle}
                  uppercaseText={uppercaseText}
                  desktopColumns={desktopColumns}
                  spacing={spacing}
                  cornerRadius={cornerRadius}
                />
              </div>
            </div>
          </div>
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={validation.resolvedSecondary}
          description="Màu phụ áp dụng cho subtitle, badge, labels và accents."
        />
      )}

      {warningMessages.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <ul className="list-disc pl-4 space-y-1">
            {warningMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

