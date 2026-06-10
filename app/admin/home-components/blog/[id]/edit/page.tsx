'use client';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { BlogForm, type BlogPostItem } from '../../_components/BlogForm';
import { BlogPreview } from '../../_components/BlogPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { getBlogValidationResult } from '../../_lib/colors';
import { DEFAULT_BLOG_CONFIG, sortBlogPosts } from '../../_lib/constants';
import { enforceToggleDisabled } from '@/lib/experiences/module-toggle-guards';
import {
  normalizeBlogConfig,
  type BlogCardRadius,
  type BlogSelectionMode,
  type BlogStyle,
  type DemoBlogItem,
} from '../../_types';

const COMPONENT_TYPE = 'Blog';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type BlogEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function BlogEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: BlogEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);
  const postsData = useQuery(api.posts.listAll, { limit: 100 });
  const postCategoriesData = useQuery(api.postCategories.listAll, { limit: 200 });
  const postsModuleData = useQuery(api.admin.modules.getModuleByKey, { key: 'posts' });
  const postsModuleFields = useQuery(api.admin.modules.listModuleFields, { moduleKey: 'posts' });

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [blogStyle, setBlogStyle] = useState<BlogStyle>('layout1');
  const [blogSelectionMode, setBlogSelectionMode] = useState<BlogSelectionMode>('auto');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [postSearchTerm, setPostSearchTerm] = useState('');
  const [demoPosts, setDemoPosts] = useState<DemoBlogItem[]>([]);
  const [blogConfig, setBlogConfig] = useState({
    itemCount: DEFAULT_BLOG_CONFIG.itemCount,
    showAuthor: DEFAULT_BLOG_CONFIG.showAuthor,
    showDate: DEFAULT_BLOG_CONFIG.showDate,
    showExcerpt: DEFAULT_BLOG_CONFIG.showExcerpt,
    sortBy: DEFAULT_BLOG_CONFIG.sortBy,
    subtitle: DEFAULT_BLOG_CONFIG.subtitle,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialState, setInitialState] = useState('');

  // Header config state (shared pattern)
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
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);
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
      .filter(post => post.status === 'Published')
      .filter(post => 
        !postSearchTerm || 
        post.title.toLowerCase().includes(postSearchTerm.toLowerCase())
      );
  }, [postsData, postSearchTerm]);

  const selectedPosts = useMemo(() => {
    if (!postsData || selectedPostIds.length === 0) {return [];}
    const postMap = new Map(postsData.map((post) => [post._id, post]));
    return selectedPostIds
      .map((postId) => postMap.get(postId as Id<'posts'>))
      .filter((post): post is Doc<'posts'> => post !== undefined);
  }, [postsData, selectedPostIds]);

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'Blog') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const nextConfig = normalizeBlogConfig(component.config ?? {});
      const guardedConfig = enforceToggleDisabled(nextConfig, 'showAuthor', canShowAuthor);
      setBlogConfig({
        itemCount: guardedConfig.itemCount,
        showAuthor: guardedConfig.showAuthor,
        showDate: guardedConfig.showDate,
        showExcerpt: guardedConfig.showExcerpt,
        sortBy: guardedConfig.sortBy,
        subtitle: guardedConfig.subtitle,
      });
      const nextStyle = guardedConfig.style;
      const nextSelectionMode = guardedConfig.selectionMode;
      const nextSelectedPostIds = guardedConfig.selectedPostIds;

      setBlogStyle(nextStyle);
      setBlogSelectionMode(nextSelectionMode);
      setSelectedPostIds(nextSelectedPostIds);
      setDemoPosts((guardedConfig.demoPosts as DemoBlogItem[]) ?? []);
      setDesktopColumns(guardedConfig.desktopColumns);
      setCornerRadius(guardedConfig.cornerRadius);

      // Load header config
      const config = component.config ?? {};
      const headerConfig = extractSectionHeaderConfig(config);
      setHideHeader(headerConfig.hideHeader ?? false);
      setShowTitleHeader(headerConfig.showTitle ?? true);
      setShowSubtitle(headerConfig.showSubtitle ?? true);
      setHeaderSubtitle(headerConfig.subtitle || '');
      setHeaderAlign(headerConfig.headerAlign ?? 'left');
      setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
      setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
      setUppercaseText(headerConfig.uppercaseText ?? false);
      setShowBadge(headerConfig.showBadge ?? true);
      setBadgeText(headerConfig.badgeText || '');
      setSpacing(headerConfig.spacing ?? DEFAULT_SECTION_SPACING);

      const snapshot = JSON.stringify({
        title: component.title,
        active: component.active,
        itemCount: nextConfig.itemCount,
        showAuthor: guardedConfig.showAuthor,
        showDate: guardedConfig.showDate,
        showExcerpt: guardedConfig.showExcerpt,
        sortBy: nextConfig.sortBy,
        style: nextStyle,
        selectionMode: nextSelectionMode,
        selectedPostIds: nextSelectionMode === 'manual' ? nextSelectedPostIds : [],
        demoPosts: nextSelectionMode === 'demo' ? (guardedConfig.demoPosts ?? []) : [],
        // Header fields
        hideHeader: headerConfig.hideHeader,
        showTitle: headerConfig.showTitle,
        showSubtitleHeader: headerConfig.showSubtitle,
        subtitle: headerConfig.subtitle || '',
        headerAlign: headerConfig.headerAlign,
        titleColorPrimary: headerConfig.titleColorPrimary,
        subtitleAboveTitle: headerConfig.subtitleAboveTitle,
        uppercaseText: headerConfig.uppercaseText,
        showBadge: headerConfig.showBadge,
        badgeText: headerConfig.badgeText || '',
        spacing: headerConfig.spacing ?? DEFAULT_SECTION_SPACING,
        desktopColumns: guardedConfig.desktopColumns,
        cornerRadius: guardedConfig.cornerRadius,
        noBorderRadius: guardedConfig.cornerRadius === 'none',
        noVerticalMargin: (headerConfig.spacing ?? DEFAULT_SECTION_SPACING) === 'none',
      });
      setInitialState(snapshot);
    }
  }, [canShowAuthor, component, id, router, snapshotComponent]);

  useEffect(() => {
    setBlogConfig((prev) => enforceToggleDisabled(prev, 'showAuthor', canShowAuthor));
  }, [canShowAuthor]);

  const previewPosts = useMemo(() => {
    if (!postsData) {return undefined;}

    const published = postsData.filter((post) => post.status === 'Published');

    if (blogSelectionMode === 'manual') {
      if (selectedPostIds.length === 0) {return [];}
      const postMap = new Map(published.map((post) => [post._id, post]));
      return selectedPostIds
        .map((postId) => postMap.get(postId as Id<'posts'>))
        .filter((post): post is Doc<'posts'> => post !== undefined);
    }

    const sorted = sortBlogPosts(published, blogConfig.sortBy, title);

    return sorted.slice(0, blogConfig.itemCount);
  }, [blogConfig.itemCount, blogConfig.sortBy, blogSelectionMode, postsData, selectedPostIds, title]);

  const categoryMap = useMemo(() => {
    if (!postCategoriesData) {return undefined;}
    const map: Record<string, string> = {};
    postCategoriesData.forEach((category) => {
      map[category._id] = category.name;
    });
    return map;
  }, [postCategoriesData]);

  const typedPreviewPosts = previewPosts as BlogPostItem[] | undefined;
  const typedCategoryMap = categoryMap as Record<string, string> | undefined;

  const currentState = useMemo(() => JSON.stringify({
    title,
    active,
    itemCount: blogConfig.itemCount,
    showAuthor: blogConfig.showAuthor,
    showDate: blogConfig.showDate,
    showExcerpt: blogConfig.showExcerpt,
    sortBy: blogConfig.sortBy,
    style: blogStyle,
    selectionMode: blogSelectionMode,
    selectedPostIds: blogSelectionMode === 'manual' ? selectedPostIds : [],
    demoPosts: blogSelectionMode === 'demo' ? demoPosts : [],
    // Header fields
    hideHeader,
    showTitle: showTitleHeader,
    showSubtitleHeader: showSubtitle,
    subtitle: headerSubtitle,
    headerAlign,
    titleColorPrimary,
    subtitleAboveTitle,
    uppercaseText,
    showBadge,
    badgeText,
    spacing,
    desktopColumns,
    cornerRadius,
    noBorderRadius: cornerRadius === 'none',
    noVerticalMargin: spacing === 'none',
  }), [active, badgeText, blogConfig.itemCount, blogConfig.showAuthor, blogConfig.showDate, blogConfig.showExcerpt, blogConfig.sortBy, blogSelectionMode, blogStyle, cornerRadius, demoPosts, desktopColumns, headerAlign, headerSubtitle, hideHeader, selectedPostIds, showBadge, showSubtitle, showTitleHeader, spacing, subtitleAboveTitle, title, titleColorPrimary, uppercaseText]);

  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
  const customChanged = enableTypeOverrides && showCustomBlock
    ? customState.enabled !== initialCustom.enabled
      || customState.mode !== initialCustom.mode
      || customState.primary !== initialCustom.primary
      || resolvedCustomSecondary !== initialCustom.secondary
    : false;
  const customFontChanged = enableTypeOverrides && showFontCustomBlock
    ? customFontState.enabled !== initialFontCustom.enabled
      || customFontState.fontKey !== initialFontCustom.fontKey
    : false;
  const hasChanges = initialState.length > 0 && (currentState !== initialState || customChanged || customFontChanged);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);

    const validation = getBlogValidationResult({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: effectiveColors.mode,
    });

    const warnings: string[] = [];
    if (effectiveColors.mode === 'dual') {
      if (validation.harmonyStatus.isTooSimilar) {
        warnings.push(`Độ tương phản thương hiệu thấp (ΔE=${validation.harmonyStatus.deltaE}).`);
      }
      if (validation.accessibility.failing.length > 0) {
        warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
      }
    }

    try {
      const nextConfig = {
        itemCount: blogConfig.itemCount,
        showAuthor: blogConfig.showAuthor,
        showDate: blogConfig.showDate,
        showExcerpt: blogConfig.showExcerpt,
        sortBy: blogConfig.sortBy,
        style: blogStyle,
        selectionMode: blogSelectionMode,
        selectedPostIds: blogSelectionMode === 'manual' ? selectedPostIds : [],
        demoPosts: blogSelectionMode === 'demo' ? demoPosts : [],
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
      };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig, title });
      } else {
        await updateMutation({
          active,
          config: nextConfig,
          id: id as Id<'homeComponents'>,
          title,
        });
      }
      if (enableTypeOverrides && showCustomBlock) {
        const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
        await setTypeColorOverride({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
          type: COMPONENT_TYPE,
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        await setTypeFontOverride({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
          type: COMPONENT_TYPE,
        });
      }
      toast.success('Đã cập nhật Blog');
      setInitialState(currentState);
      if (enableTypeOverrides && showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary),
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDisabled = isSubmitting || !hasChanges;

  if (component === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy component</div>;
  }

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  // Resolve preview items for demo mode
  const demoPreviewItems: BlogPostItem[] | undefined = blogSelectionMode === 'demo' && demoPosts.length > 0
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Blog</h1>
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        {snapshotLabel ? <p className="text-sm text-slate-500">Snapshot: {snapshotLabel}</p> : null}
      </div>


      <form onSubmit={handleSubmit}>
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
            setBlogConfig((prev) => {
              const nextConfig = {
                ...prev,
                showAuthor: next.showAuthor ?? prev.showAuthor,
                showDate: next.showDate ?? prev.showDate,
                showExcerpt: next.showExcerpt ?? prev.showExcerpt,
              };

              return enforceToggleDisabled(nextConfig, 'showAuthor', canShowAuthor);
            });
          }}
          selectionMode={blogSelectionMode}
          onSelectionModeChange={setBlogSelectionMode}
          itemCount={blogConfig.itemCount}
          sortBy={blogConfig.sortBy}
          onConfigChange={(next) =>{
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
          onTogglePost={(postId) =>{
            setSelectedPostIds((ids) => ids.includes(postId) ? ids.filter(idValue => idValue !== postId) : [...ids, postId]);
          }}
          searchTerm={postSearchTerm}
          onSearchTermChange={setPostSearchTerm}
          filteredPosts={filteredPosts as BlogPostItem[]}
          demoPosts={demoPosts}
          setDemoPosts={setDemoPosts}
          isLoading={postsData === undefined}
          defaultExpanded={false}
          desktopColumns={desktopColumns}
          onDesktopColumnsChange={setDesktopColumns}
          spacing={spacing}
          onSpacingChange={setSpacing}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={setCornerRadius}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Blog"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => setCustomState((prev) => {
                  if (next === prev.mode) {
                    return prev;
                  }
                  if (next === 'single') {
                    return { ...prev, mode: 'single', secondary: prev.primary };
                  }
                  const nextSecondary = prev.mode === 'single'
                    ? getSuggestedSecondary(prev.primary)
                    : prev.secondary;
                  return { ...prev, mode: 'dual', secondary: nextSecondary };
                })}
                onPrimaryChange={(value) => setCustomState((prev) => ({
                  ...prev,
                  primary: value,
                  secondary: prev.mode === 'single' ? value : prev.secondary,
                }))}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {enableTypeOverrides && showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Blog"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <BlogPreview
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              postCount={blogSelectionMode === 'demo' ? demoPosts.length : (blogSelectionMode === 'manual' ? selectedPostIds.length : blogConfig.itemCount)}
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
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          disableSave={saveDisabled}
          onCancel={() =>{  router.push(backHref); }}
          submitLabel="Lưu thay đổi"
        active={active}
        onActiveChange={setActive}
        />
      </form>
    </div>
  );
}
