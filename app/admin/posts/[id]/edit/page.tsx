'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ExternalLink, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Input, Label } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import { LexicalEditor } from '../../../components/LexicalEditor';
import { ImageUploader } from '../../../components/ImageUploader';
import { QuickCreateCategoryModal } from '../../../components/QuickCreateCategoryModal';
import { stripHtml, truncateText } from '@/lib/seo';
import { normalizeRichText } from '@/app/admin/lib/normalize-rich-text';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { AiEntityImportDialog, type AiEntityImportPayload } from '@/app/admin/components/AiEntityImportDialog';
import { CategoryTagsInput } from '@/app/admin/components/AdditionalCategoriesSelect';

const MODULE_KEY = 'posts';

const toLocalDatetimeInput = (timestamp?: number) => {
  if (!timestamp) {return '';}
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toTimestamp = (value: string) => {
  if (!value) {return undefined;}
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function PostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const SCHEDULE_SKEW_MS = 30_000;

  const postData = useQuery(api.posts.getById, { id: id as Id<"posts"> });
  const additionalCategoryIdsData = useQuery(api.posts.getAdditionalCategoryIds, { id: id as Id<"posts"> });
  const categoriesData = useQuery(api.postCategories.listAll, {});
  const updatePost = useMutation(api.posts.update);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [renderType, setRenderType] = useState<'content' | 'markdown' | 'html'>('content');
  const [markdownRender, setMarkdownRender] = useState('');
  const [htmlRender, setHtmlRender] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [thumbnailStorageId, setThumbnailStorageId] = useState<Id<'_storage'> | undefined>();
  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Archived'>('Draft');
  const [publishAtLocal, setPublishAtLocal] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(0);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSnapshotReady, setIsSnapshotReady] = useState(false);
  const selectedCategorySlug = useMemo(
    () => categoriesData?.find((category) => category._id === categoryId)?.slug,
    [categoriesData, categoryId]
  );
  const initialSnapshotRef = useRef<{
    title: string;
    slug: string;
    content: string;
    renderType: 'content' | 'markdown' | 'html';
    markdownRender: string;
    htmlRender: string;
    excerpt: string;
    metaTitle: string;
    metaDescription: string;
    thumbnail: string;
    thumbnailStorageId?: Id<'_storage'> | null;
    categoryId: string;
    additionalCategoryIds: string[];
    authorName: string;
    status: 'Draft' | 'Published' | 'Archived';
    publishedAt?: number;
  } | null>(null);

  // Check which fields are enabled
  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRenderCard = hasMarkdownRender || hasHtmlRender;
  const schedulingFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableScheduling', moduleKey: MODULE_KEY });
  const schedulingEnabled = enabledFields.has('publish_date') && (schedulingFeature?.enabled ?? false);
  const multiCategoryEnabled = Boolean(settingsData?.find(s => s.settingKey === 'enableMultipleCategories')?.value);

  const normalizedContent = useMemo(() => normalizeRichText(content), [content]);
  const resolvedPublishedAt = useMemo(
    () => (status === 'Published' && !publishImmediately ? toTimestamp(publishAtLocal) : undefined),
    [publishAtLocal, publishImmediately, status],
  );

  const currentSnapshot = useMemo(() => ({
    authorName: authorName.trim(),
    categoryId,
    additionalCategoryIds,
    content: normalizedContent,
    renderType,
    markdownRender: markdownRender.trim(),
    htmlRender: htmlRender.trim(),
    excerpt: excerpt.trim(),
    metaDescription: metaDescription.trim(),
    metaTitle: metaTitle.trim(),
    slug: slug.trim(),
    status,
    publishedAt: resolvedPublishedAt,
    thumbnail: thumbnail ?? '',
    title: title.trim(),
    thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
  }), [authorName, categoryId, additionalCategoryIds, normalizedContent, renderType, markdownRender, htmlRender, excerpt, metaDescription, metaTitle, slug, status, resolvedPublishedAt, thumbnail, title, thumbnailStorageId]);

  const hasChanges = useMemo(() => {
    if (!isSnapshotReady || !initialSnapshotRef.current) {return false;}
    return JSON.stringify(initialSnapshotRef.current) !== JSON.stringify(currentSnapshot);
  }, [currentSnapshot, isSnapshotReady]);

  useEffect(() => {
    if (saveStatus === 'saving') {return;}
    if (hasChanges && saveStatus === 'saved') {
      setSaveStatus('idle');
      return;
    }
    if (!hasChanges && saveStatus === 'idle') {
      setSaveStatus('saved');
    }
  }, [hasChanges, saveStatus]);

  useEffect(() => {
    if (status !== 'Published') {
      setPublishImmediately(true);
      setPublishAtLocal('');
    }
  }, [status]);

  const generateSlugFromTitle = (value: string) => {
    return value.toLowerCase()
      .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
      .replaceAll(/[đĐ]/g, "d")
      .replaceAll(/[^a-z0-9\s]/g, '')
      .replaceAll(/\s+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(generateSlugFromTitle(val));
  };

  const handleApplyAiPost = (item: AiEntityImportPayload) => {
    const nextTitle = item.title?.trim() || item.name?.trim() || '';
    if (!nextTitle) {return;}

    setTitle(nextTitle);
    setSlug(item.slug?.trim() || generateSlugFromTitle(nextTitle));
    const nextContent = item.content || item.description || item.htmlRender || item.markdownRender || '';
    setContent(nextContent);
    if (item.content) {
      setRenderType('content');
      setHtmlRender(item.htmlRender || '');
      setMarkdownRender(item.markdownRender || '');
    } else if (item.htmlRender) {
      setRenderType('html');
      setHtmlRender(item.htmlRender);
      setMarkdownRender('');
    } else if (item.markdownRender) {
      setRenderType('markdown');
      setMarkdownRender(item.markdownRender);
      setHtmlRender('');
    }
    setExcerpt(item.excerpt || item.description || truncateText(stripHtml(nextContent), 180));
    setMetaTitle(item.metaTitle || truncateText(nextTitle, 60));
    setMetaDescription(item.metaDescription || truncateText(stripHtml(item.excerpt || nextContent), 160));
    if (item.thumbnail) {
      setThumbnail(item.thumbnail);
      setThumbnailStorageId(undefined);
    }
    if (item.authorName) {setAuthorName(item.authorName);}
    setEditorResetKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (postData && additionalCategoryIdsData !== undefined && !isDataLoaded) {
      setTitle(postData.title);
      setSlug(postData.slug);
      setContent(postData.content);
      const nextRenderType = postData.renderType ?? 'content';
      const allowedRenderTypes = new Set<'content' | 'markdown' | 'html'>(['content']);
      if (hasMarkdownRender) {allowedRenderTypes.add('markdown');}
      if (hasHtmlRender) {allowedRenderTypes.add('html');}
      const normalizedRenderType = allowedRenderTypes.has(nextRenderType) ? nextRenderType : 'content';
      setRenderType(normalizedRenderType);
      setMarkdownRender(postData.markdownRender ?? '');
      setHtmlRender(postData.htmlRender ?? '');
      setExcerpt(postData.excerpt ?? '');
      setMetaTitle(postData.metaTitle ?? '');
      setMetaDescription(postData.metaDescription ?? '');
      setThumbnail(postData.thumbnail);
      setThumbnailStorageId((postData as { thumbnailStorageId?: Id<'_storage'> }).thumbnailStorageId);
      setCategoryId(postData.categoryId);
      setAdditionalCategoryIds(additionalCategoryIdsData ?? []);
      setAuthorName(postData.authorName ?? '');
      setStatus(postData.status);
      const now = Date.now();
      const isScheduled = Boolean(postData.publishedAt && postData.publishedAt > now + SCHEDULE_SKEW_MS);
      setPublishImmediately(!isScheduled);
      setPublishAtLocal(isScheduled && postData.publishedAt ? toLocalDatetimeInput(postData.publishedAt) : '');
      setIsDataLoaded(true);
    }
  }, [postData, additionalCategoryIdsData, hasMarkdownRender, hasHtmlRender, isDataLoaded]);

  // Set initialSnapshotRef AFTER state has been committed (next render after isDataLoaded=true).
  // Using setIsSnapshotReady(true) to trigger a re-render so hasChanges useMemo re-computes
  // with the correct initialSnapshotRef.current, ensuring no false dirty state on initial load.
  useEffect(() => {
    if (isDataLoaded && !isSnapshotReady) {
      initialSnapshotRef.current = currentSnapshot;
      setIsSnapshotReady(true);
    }
  }, [isDataLoaded, isSnapshotReady, currentSnapshot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {return;}
    if (status === 'Published' && schedulingEnabled && !publishImmediately && !publishAtLocal) {
      toast.error('Vui lòng chọn thời gian xuất bản.');
      return;
    }

    setIsSubmitting(true);
    setSaveStatus('saving');
    try {
      const resolvedMetaTitle = truncateText(title.trim(), 60);
      const resolvedMetaDescription = truncateText(
        stripHtml(enabledFields.has('excerpt') && excerpt ? excerpt : content || ''),
        160
      );
      const resolvedMetaTitleValue = enabledFields.has('metaTitle')
        ? (metaTitle.trim() || resolvedMetaTitle || '')
        : metaTitle.trim();
      const resolvedMetaDescriptionValue = enabledFields.has('metaDescription')
        ? (metaDescription.trim() || resolvedMetaDescription || '')
        : metaDescription.trim();
      await updatePost({
        authorName: enabledFields.has('author_name') ? authorName.trim() || undefined : undefined,
        categoryId: categoryId as Id<"postCategories">,
        additionalCategoryIds: multiCategoryEnabled
          ? additionalCategoryIds.filter((category) => category !== categoryId) as Id<"postCategories">[]
          : undefined,
        content,
        renderType,
        markdownRender: markdownRender.trim() || undefined,
        htmlRender: htmlRender.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        id: id as Id<"posts">,
        metaDescription: enabledFields.has('metaDescription')
          ? (resolvedMetaDescriptionValue || undefined)
          : undefined,
        metaTitle: enabledFields.has('metaTitle')
          ? (resolvedMetaTitleValue || undefined)
          : undefined,
        publishImmediately: status === 'Published' ? publishImmediately : undefined,
        publishedAt: status === 'Published' ? resolvedPublishedAt : undefined,
        slug: slug.trim(),
        status,
        thumbnail: thumbnail ?? '',
        thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
        title: title.trim(),
      });
      const persistedSnapshot = {
        ...currentSnapshot,
        authorName: authorName.trim(),
        content: normalizeRichText(content),
        renderType,
        markdownRender: markdownRender.trim(),
        htmlRender: htmlRender.trim(),
        excerpt: excerpt.trim(),
        metaDescription: resolvedMetaDescriptionValue,
        metaTitle: resolvedMetaTitleValue,
        thumbnail: thumbnail ?? '',
        thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
      };
      if (enabledFields.has('metaTitle')) {
        setMetaTitle(resolvedMetaTitleValue);
      }
      if (enabledFields.has('metaDescription')) {
        setMetaDescription(resolvedMetaDescriptionValue);
      }
      initialSnapshotRef.current = persistedSnapshot;
      setSaveStatus('saved');
      toast.success("Cập nhật bài viết thành công");
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, "Không thể cập nhật bài viết"));
      setSaveStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (postData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (postData === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy bài viết</div>;
  }

  return (
    <>
    <QuickCreateCategoryModal 
      isOpen={showCategoryModal} 
      onClose={() =>{  setShowCategoryModal(false); }} 
      onCreated={(id) =>{  setCategoryId(id); }}
    />
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa bài viết</h1>
        <div className="text-sm text-slate-500 mt-1">Cập nhật nội dung bài viết hiện có</div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Title - always shown (system field) */}
              <div className="space-y-2">
                <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                <CopyableInput value={title} onChange={handleTitleChange} required copyLabel="tiêu đề" />
              </div>
              {/* Slug - always shown (system field) */}
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} className="font-mono text-sm" />
              </div>
              {/* Excerpt - conditional */}
              {enabledFields.has('excerpt') && (
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Input value={excerpt} onChange={(e) =>{  setExcerpt(e.target.value); }} />
                </div>
              )}
              {/* Content - always shown (system field) */}
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <LexicalEditor onChange={setContent} initialContent={content} resetKey={editorResetKey} />
              </div>
            </CardContent>
          </Card>

          {showAdvancedRenderCard && (
            <Card>
              <CardHeader><CardTitle className="text-base">Render nâng cao</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kiểu render</Label>
                  <select
                    value={renderType}
                    onChange={(e) =>{  setRenderType(e.target.value as 'content' | 'markdown' | 'html'); }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="content">Content (mặc định)</option>
                    {hasMarkdownRender && <option value="markdown">Markdown</option>}
                    {hasHtmlRender && <option value="html">HTML</option>}
                  </select>
                </div>
                {hasMarkdownRender && (
                  <div className="space-y-2">
                    <Label>Markdown render</Label>
                    <textarea
                      value={markdownRender}
                      onChange={(e) =>{  setMarkdownRender(e.target.value); }}
                      className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                      placeholder="Dán markdown để render..."
                    />
                  </div>
                )}
                {hasHtmlRender && (
                  <div className="space-y-2">
                    <Label>HTML render</Label>
                    <textarea
                      value={htmlRender}
                      onChange={(e) =>{  setHtmlRender(e.target.value); }}
                      className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                      placeholder="Dán HTML inline để render..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(enabledFields.has('metaTitle') || enabledFields.has('metaDescription')) && (
            <Card>
              <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {enabledFields.has('metaTitle') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Meta Title</Label>
                      <span className={`text-xs ${metaTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>
                        {metaTitle.length}/60
                      </span>
                    </div>
                    <Input
                      value={metaTitle}
                      onChange={(e) =>{  setMetaTitle(e.target.value); }}
                      placeholder="Tiêu đề hiển thị trên Google"
                    />
                  </div>
                )}
                {enabledFields.has('metaDescription') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Meta Description</Label>
                      <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                        {metaDescription.length}/160
                      </span>
                    </div>
                    <textarea
                      value={metaDescription}
                      onChange={(e) =>{  setMetaDescription(e.target.value); }}
                      className="w-full min-h-[90px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                      placeholder="Mô tả ngắn cho kết quả tìm kiếm"
                    />
                  </div>
                )}
                <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm">
                  <div className="text-blue-600 font-medium truncate">
                    {metaTitle.trim() || title || 'Tiêu đề bài viết'}
                  </div>
                  <div className="text-emerald-600 text-xs">
                    /{selectedCategorySlug || 'chua-phan-loai'}/{slug || 'bai-viet'}
                  </div>
                  <div className="text-slate-600 text-xs mt-1 line-clamp-2">
                    {metaDescription.trim() || excerpt || 'Mô tả ngắn sẽ hiển thị tại đây.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Xuất bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  value={status}
                  onChange={(e) =>{  setStatus(e.target.value as 'Draft' | 'Published' | 'Archived'); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="Draft">Bản nháp</option>
                  <option value="Published">Đã xuất bản</option>
                  <option value="Archived">Lưu trữ</option>
                </select>
              </div>
              {schedulingEnabled && status === 'Published' && (
                <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Checkbox
                      checked={publishImmediately}
                      onCheckedChange={(checked) => {
                        setPublishImmediately(checked);
                        if (checked) {setPublishAtLocal('');}
                      }}
                    />
                    Xuất bản ngay
                  </label>
                  {!publishImmediately && (
                    <div className="space-y-2">
                      <Label>Thời gian xuất bản</Label>
                      <Input
                        type="datetime-local"
                        value={publishAtLocal}
                        onChange={(e) =>{  setPublishAtLocal(e.target.value); }}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>Danh mục</Label>
                {multiCategoryEnabled ? (
                  <>
                  <CategoryTagsInput
                    categories={categoriesData}
                    value={[categoryId, ...additionalCategoryIds].filter(Boolean)}
                    onQuickCreate={() =>{  setShowCategoryModal(true); }}
                    onChange={(ids) => {
                      setCategoryId(ids[0] ?? '');
                      setAdditionalCategoryIds(ids.slice(1));
                    }}
                  />
                  <p className="text-xs text-slate-500">Thẻ đầu tiên là danh mục chính/canonical, các thẻ sau là danh mục phụ.</p>
                  </>
                ) : (
                  <div className="flex gap-2">
                  <select 
                    value={categoryId}
                    onChange={(e) =>{  setCategoryId(e.target.value); }}
                    className="flex-1 h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    {categoriesData?.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() =>{  setShowCategoryModal(true); }}
                    title="Tạo danh mục mới"
                  >
                    <Plus size={16} />
                  </Button>
                  </div>
                )}
              </div>
              {enabledFields.has('author_name') && (
                <div className="space-y-2">
                  <Label>Tác giả</Label>
                  <Input
                    value={authorName}
                    onChange={(e) =>{  setAuthorName(e.target.value); }}
                    placeholder="Nhập tên tác giả..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="text-base">Ảnh đại diện</CardTitle></CardHeader>
            <CardContent>
              <ImageUploader
                value={thumbnail}
                storageId={thumbnailStorageId}
                onChange={(url, storageId) => {
                  setThumbnail(url);
                  setThumbnailStorageId(storageId);
                }}
                folder="posts"
                naming={{ entityName: slug.trim() || 'post', style: 'slug-index', index: 1 }}
                deleteMode="defer"
                aspectRatio="video"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <HomeComponentStickyFooter
        isSubmitting={isSubmitting || saveStatus === 'saving'}
        hasChanges={hasChanges}
        submitLabel="Lưu thay đổi"
        align="end"
      >
        <>
          <AiEntityImportDialog kind="post" enabledFields={enabledFields} onApply={handleApplyAiPost} />
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(`/${selectedCategorySlug || 'chua-phan-loai'}/${slug}`, '_blank')}
            className="gap-2"
            disabled={!slug.trim()}
          >
            <ExternalLink size={16} />
            Xem trên web
          </Button>
          <Button
            type="submit"
            variant="accent"
            disabled={isSubmitting || !hasChanges}
            className={!hasChanges && !isSubmitting
              ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400'
              : undefined}
          >
            {isSubmitting || saveStatus === 'saving'
              ? 'Đang lưu...'
              : (saveStatus === 'saved' && !hasChanges ? 'Đã lưu' : 'Lưu thay đổi')}
          </Button>
        </>
      </HomeComponentStickyFooter>
    </form>
    </>
  );
}
