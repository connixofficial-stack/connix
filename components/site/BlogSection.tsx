'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import {
  getBlogColorTokens,
  type BlogBrandMode,
} from '@/app/admin/home-components/blog/_lib/colors';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import { sortBlogPosts } from '@/app/admin/home-components/blog/_lib/constants';
import { BlogSectionRuntime } from '@/app/admin/home-components/blog/_components/BlogSectionRuntime';
import { normalizeBlogConfig } from '@/app/admin/home-components/blog/_types';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';
import { getSectionSpacingClassName } from '@/app/admin/home-components/_shared/types/sectionSpacing';
import { useSnapshotDemoContext } from '@/components/modules/homepage/SnapshotDemoProvider';

interface BlogSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: BlogBrandMode;
  title: string;
  snapshotComponentKey?: string;
  isDark?: boolean;
}

export function BlogSection({ config, brandColor, secondary, mode, title, snapshotComponentKey, isDark }: BlogSectionProps) {
  const snapshotDemo = useSnapshotDemoContext();
  const normalizedConfig = React.useMemo(() => normalizeBlogConfig(config), [config]);
  const style = normalizedConfig.style;
  const itemCount = Math.min(normalizedConfig.itemCount || 6, 10);
  const sortBy = normalizedConfig.sortBy;
  const selectionMode = normalizedConfig.selectionMode;
  const selectedPostIds = normalizedConfig.selectedPostIds;
  const demoPosts = normalizedConfig.demoPosts;
  const headerConfig = extractSectionHeaderConfig(config);
  const sectionSpacingClassName = getSectionSpacingClassName(normalizedConfig.spacing);

  const tokens = adaptTokensForDarkMode(
    getBlogColorTokens({
      primary: brandColor,
      secondary,
      mode,
    }),
    isDark ?? false
  );

  const querySortBy = sortBy === 'popular'
    ? 'popular'
    : 'newest';

  const allPublished = useQuery(api.posts.searchPublished, {
    limit: 50,
    sortBy: querySortBy,
  });

  const categories = useQuery(api.postCategories.listActive, { limit: 40 });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const snapshotData = React.useMemo(() => {
    if (!snapshotDemo || !snapshotComponentKey) {return null;}
    const data = snapshotDemo.getComponentData(snapshotComponentKey);
    return data?.kind === 'blog' ? data : null;
  }, [snapshotDemo, snapshotComponentKey]);
  const routeMode = React.useMemo(
    () => normalizeRouteMode(snapshotData?.settings?.iaRouteMode ?? routeModeSetting),
    [routeModeSetting, snapshotData?.settings]
  );

  const categoryMap = React.useMemo(() => {
    if (snapshotData) {
      return new Map(snapshotData.categories.map((category) => [category.id, category.name]));
    }
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((category) => [category._id, category.name]));
  }, [categories, snapshotData]);

  const categorySlugMap = React.useMemo(() => {
    if (snapshotData) {
      return new Map(snapshotData.categories.map((category) => [category.id, category.slug ?? '']));
    }
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((category) => [category._id, category.slug]));
  }, [categories, snapshotData]);

  const getPostDetailHref = React.useCallback((post: { slug: string; categoryId: string }) => buildDetailPath({
    categorySlug: categorySlugMap.get(post.categoryId),
    mode: routeMode,
    moduleKey: 'posts',
    recordSlug: post.slug,
  }), [categorySlugMap, routeMode]);

  const orderedPosts = React.useMemo(() => {
    if (snapshotData) {
      return snapshotData.posts.slice(0, itemCount).map((post) => ({
        _id: post.id,
        categoryId: post.categoryId ?? '',
        excerpt: post.excerpt,
        publishedAt: post.publishedAt,
        slug: post.slug ?? '',
        thumbnail: post.image,
        title: post.title,
      }));
    }
    if (!allPublished) {return undefined;}

    const source = sortBlogPosts(allPublished, sortBy, title);

    if (selectionMode !== 'manual' || selectedPostIds.length === 0) {
      return source.slice(0, itemCount);
    }

    const postMap = new Map(source.map((post) => [String(post._id), post]));
    const manualOrdered = selectedPostIds
      .map((postId) => postMap.get(postId))
      .filter((post): post is NonNullable<typeof post> => post !== undefined);

    return manualOrdered.slice(0, itemCount);
  }, [allPublished, selectionMode, selectedPostIds, itemCount, sortBy, title, snapshotData]);

  if (!snapshotData && orderedPosts === undefined) {
    return (
      <section className={`${sectionSpacingClassName} px-4`} style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  const posts = orderedPosts ?? [];

  if (posts.length === 0) {
    return (
      <section className={`${sectionSpacingClassName} px-4`} style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4" style={{ color: tokens.heading }}>{title}</h2>
          <p style={{ color: tokens.mutedText }}>Chưa có bài viết nào được xuất bản.</p>
        </div>
      </section>
    );
  }

  // Demo mode: render directly from config, skip DB data
  if (selectionMode === 'demo' && demoPosts && demoPosts.length > 0) {
    const demoItems = demoPosts.map((item) => ({
      author: item.author || 'Admin',
      category: item.category || 'Tin tức',
      date: item.date || '',
      excerpt: item.excerpt,
      id: item.id,
      thumbnail: item.thumbnail,
      title: item.title || 'Bài viết demo',
    }));

    return (
      <BlogSectionRuntime
        items={demoItems}
        title={title}
        subtitle={headerConfig.subtitle || normalizedConfig.subtitle}
        style={style}
        tokens={tokens}
        context="site"
        showAuthor={normalizedConfig.showAuthor}
        showExcerpt={normalizedConfig.showExcerpt}
        showDate={normalizedConfig.showDate}
        viewAllHref="/posts"
        getItemHref={() => '/posts'}
        hideHeader={headerConfig.hideHeader}
        showTitleHeader={headerConfig.showTitle}
        showSubtitleHeader={headerConfig.showSubtitle}
        showBadge={headerConfig.showBadge}
        badgeText={headerConfig.badgeText}
        headerAlign={headerConfig.headerAlign}
        titleColorPrimary={headerConfig.titleColorPrimary}
        subtitleAboveTitle={headerConfig.subtitleAboveTitle}
        uppercaseText={headerConfig.uppercaseText}
        desktopColumns={normalizedConfig.desktopColumns}
        spacing={normalizedConfig.spacing}
        cornerRadius={normalizedConfig.cornerRadius}
      />
    );
  }

  return (
    <BlogSectionRuntime
      items={posts.map((post) => ({
        author: 'Admin',
        category: categoryMap.get(post.categoryId) ?? 'Tin tức',
        date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '',
        excerpt: post.excerpt,
        id: String(post._id),
        thumbnail: post.thumbnail,
        title: post.title,
      }))}
      title={title}
      subtitle={headerConfig.subtitle || normalizedConfig.subtitle}
      style={style}
      tokens={tokens}
      context="site"
      showAuthor={normalizedConfig.showAuthor}
      showExcerpt={normalizedConfig.showExcerpt}
      showDate={normalizedConfig.showDate}
      viewAllHref="/posts"
      getItemHref={(item) => {
        const post = posts.find((entry) => String(entry._id) === String(item.id));
        return post ? getPostDetailHref(post) : '/posts';
      }}
      hideHeader={headerConfig.hideHeader}
      showTitleHeader={headerConfig.showTitle}
      showSubtitleHeader={headerConfig.showSubtitle}
      showBadge={headerConfig.showBadge}
      badgeText={headerConfig.badgeText}
      headerAlign={headerConfig.headerAlign}
      titleColorPrimary={headerConfig.titleColorPrimary}
      subtitleAboveTitle={headerConfig.subtitleAboveTitle}
      uppercaseText={headerConfig.uppercaseText}
      desktopColumns={normalizedConfig.desktopColumns}
      spacing={normalizedConfig.spacing}
      cornerRadius={normalizedConfig.cornerRadius}
    />
  );
}
