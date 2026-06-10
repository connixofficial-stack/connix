'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { BlogForm, type BlogPostItem } from '../../blog/_components/BlogForm';
import { BlogPreview } from '../../blog/_components/BlogPreview';
import { DEFAULT_BLOG_CONFIG, sortBlogPosts } from '../../blog/_lib/constants';
import type { BlogCardRadius, BlogSelectionMode, BlogStyle, DemoBlogItem } from '../../blog/_types';

const COMPONENT_TYPE = 'Blog';

export default function BlogCreatePage() {
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Tin tức / Blog', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const postsData = useQuery(api.posts.listAll, { limit: 100 });
  const postCategoriesData = useQuery(api.postCategories.listAll, { limit: 200 });
  const postsModuleData = useQuery(api.admin.modules.getModuleByKey, { key: 'posts' });
  const postsModuleFields = useQuery(api.admin.modules.listModuleFields, { moduleKey: 'posts' });

  const [blogStyle, setBlogStyle] = useState<BlogStyle>(DEFAULT_BLOG_CONFIG.style);
  const [selectionMode, setSelectionMode] = useState<BlogSelectionMode>(DEFAULT_BLOG_CONFIG.selectionMode);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [demoPosts, setDemoPosts] = useState<DemoBlogItem[]>([]);
  const [blogConfig, setBlogConfig] = useState({
    itemCount: DEFAULT_BLOG_CONFIG.itemCount,
    showAuthor: DEFAULT_BLOG_CONFIG.showAuthor,
    showDate: DEFAULT_BLOG_CONFIG.showDate,
    showExcerpt: DEFAULT_BLOG_CONFIG.showExcerpt,
    sortBy: DEFAULT_BLOG_CONFIG.sortBy,
    subtitle: DEFAULT_BLOG_CONFIG.subtitle,
  });

  // Header config state
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitleHeader, setShowTitleHeader] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [headerSubtitle, setHeaderSubtitle] = useState('');
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], true);
  const [desktopColumns, setDesktopColumns] = useState<3 | 4>(4);
  const [cornerRadius, setCornerRadius] = useState<BlogCardRadius>(DEFAULT_BLOG_CONFIG.cornerRadius);

  const canShowAuthor = useMemo(() => {
    if (postsModuleData === undefined || postsModuleFields === undefined) {
      return false;
    }

    if (!postsModuleData || postsModuleData.enabled === false) {
      return false;
    }

    return postsModuleFields.some((field) => field.fieldKey === 'author_name' && field.enabled);
  }, [postsModuleData, postsModuleFields]);

  const filteredPosts = useMemo(() => {
    if (!postsData) {return [];}
    return postsData
      .filter((post) => post.status === 'Published')
      .filter((post) => !searchTerm || post.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [postsData, searchTerm]);

  const selectedPosts = useMemo(() => {
    if (!postsData || selectedPostIds.length === 0) {return [];}
    const postMap = new Map(postsData.map((post) => [post._id, post]));
    return selectedPostIds
      .map((postId) => postMap.get(postId as Id<'posts'>))
      .filter((post): post is Doc<'posts'> => post !== undefined);
  }, [postsData, selectedPostIds]);

  const previewPosts = useMemo(() => {
    if (!postsData) {return undefined;}
    const published = postsData.filter((post) => post.status === 'Published');

    if (selectionMode === 'manual') {
      if (selectedPostIds.length === 0) {return [];}
      const postMap = new Map(published.map((post) => [post._id, post]));
      return selectedPostIds
        .map((postId) => postMap.get(postId as Id<'posts'>))
        .filter((post): post is Doc<'posts'> => post !== undefined);
    }

    const sorted = sortBlogPosts(published, blogConfig.sortBy, title);
    return sorted.slice(0, blogConfig.itemCount);
  }, [blogConfig.itemCount, blogConfig.sortBy, postsData, selectedPostIds, selectionMode, title]);

  const categoryMap = useMemo(() => {
    if (!postCategoriesData) {return undefined;}
    const map: Record<string, string> = {};
    postCategoriesData.forEach((category) => {
      map[category._id] = category.name;
    });
    return map;
  }, [postCategoriesData]);

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      itemCount: blogConfig.itemCount,
      showAuthor: blogConfig.showAuthor,
      showDate: blogConfig.showDate,
      showExcerpt: blogConfig.showExcerpt,
      sortBy: blogConfig.sortBy,
      style: blogStyle,
      selectionMode,
      selectedPostIds: selectionMode === 'manual' ? selectedPostIds : [],
      demoPosts: selectionMode === 'demo' ? demoPosts : [],
      // Header config fields
      hideHeader,
      showTitle: showTitleHeader,
      showSubtitle,
      subtitle: headerSubtitle,
      headerAlign,
      titleColorPrimary,
      subtitleAboveTitle,
      uppercaseText,
      showBadge,
      badgeText,
      spacing,
      noVerticalMargin: spacing === 'none',
      desktopColumns,
      cornerRadius,
      noBorderRadius: cornerRadius === 'none',
    });
  };

  const typedPreviewPosts = previewPosts as BlogPostItem[] | undefined;
  const typedCategoryMap = categoryMap as Record<string, string> | undefined;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  // Resolve preview items for demo mode
  const demoPreviewItems: BlogPostItem[] | undefined = selectionMode === 'demo' && demoPosts.length > 0
    ? demoPosts.map((item) => ({
      _id: item.id,
      _creationTime: Date.now(),
      title: item.title || 'Bài viết demo',
      excerpt: item.excerpt,
      thumbnail: item.thumbnail,
      categoryId: undefined,
      categoryName: item.category,
      status: 'Published',
      views: 0,
    }))
    : undefined;

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
      skipTitleInput
    >
      <HeaderConfigSection
        hideHeader={hideHeader}
        title={title}
        showTitle={showTitleHeader}
        subtitle={headerSubtitle}
        showSubtitle={showSubtitle}
        headerAlign={headerAlign}
        titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle}
        uppercaseText={uppercaseText}
        showBadge={showBadge}
        badgeText={badgeText}
        onHideHeaderChange={setHideHeader}
        onTitleChange={setTitle}
        onShowTitleChange={setShowTitleHeader}
        onSubtitleChange={setHeaderSubtitle}
        onShowSubtitleChange={setShowSubtitle}
        onHeaderAlignChange={setHeaderAlign}
        onTitleColorPrimaryChange={setTitleColorPrimary}
        onSubtitleAboveTitleChange={setSubtitleAboveTitle}
        onUppercaseTextChange={setUppercaseText}
        onShowBadgeChange={setShowBadge}
        onBadgeTextChange={setBadgeText}
        expanded={headerOpenSections.header}
        onExpandedChange={(open) => toggleHeaderSection('header', open)}
        titleLabel="Tiêu đề section"
        titlePlaceholder="VD: Tin tức mới nhất, Bài viết nổi bật..."
      />

      <BlogForm
        showAuthor={blogConfig.showAuthor}
        canShowAuthor={canShowAuthor}
        showDate={blogConfig.showDate}
        showExcerpt={blogConfig.showExcerpt}
        onDisplayConfigChange={(next) => {
          setBlogConfig((prev) => ({
            ...prev,
            showAuthor: next.showAuthor ?? prev.showAuthor,
            showDate: next.showDate ?? prev.showDate,
            showExcerpt: next.showExcerpt ?? prev.showExcerpt,
          }));
        }}
        selectionMode={selectionMode}
        onSelectionModeChange={setSelectionMode}
        itemCount={blogConfig.itemCount}
        sortBy={blogConfig.sortBy}
        onConfigChange={(next) => {
          setBlogConfig((prev) => ({
            itemCount: next.itemCount ?? prev.itemCount,
            showAuthor: prev.showAuthor,
            showDate: prev.showDate,
            showExcerpt: prev.showExcerpt,
            sortBy: next.sortBy ?? prev.sortBy,
            subtitle: prev.subtitle,
          }));
        }}
        selectedPosts={selectedPosts as BlogPostItem[]}
        selectedPostIds={selectedPostIds}
        onTogglePost={(postId) => {
          setSelectedPostIds((ids) => ids.includes(postId) ? ids.filter(idValue => idValue !== postId) : [...ids, postId]);
        }}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filteredPosts={filteredPosts as BlogPostItem[]}
        demoPosts={demoPosts}
        setDemoPosts={setDemoPosts}
        isLoading={postsData === undefined}
        defaultExpanded={true}
        desktopColumns={desktopColumns}
        onDesktopColumnsChange={setDesktopColumns}
        spacing={spacing}
        onSpacingChange={setSpacing}
        cornerRadius={cornerRadius}
        onCornerRadiusChange={setCornerRadius}
      />

      <BlogPreview
        brandColor={effectiveColors.primary}
        secondary={effectiveColors.secondary}
        mode={effectiveColors.mode}
        postCount={selectionMode === 'demo' ? demoPosts.length : (selectionMode === 'manual' ? selectedPostIds.length : blogConfig.itemCount)}
        selectedStyle={blogStyle}
        onStyleChange={setBlogStyle}
        title={title}
        subtitle={headerSubtitle}
        previewItems={demoPreviewItems ?? typedPreviewPosts}
        categoryMap={typedCategoryMap}
        showAuthor={blogConfig.showAuthor}
        showDate={blogConfig.showDate}
        showExcerpt={blogConfig.showExcerpt}
        fontStyle={fontStyle}
        fontClassName="font-active"
        hideHeader={hideHeader}
        showTitleHeader={showTitleHeader}
        showSubtitleHeader={showSubtitle}
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
    </ComponentFormWrapper>
  );
}
