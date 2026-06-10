'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Briefcase, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { stripHtml, truncateText } from '@/lib/seo';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { LexicalEditor } from '../../components/LexicalEditor';
import { ImageUploader } from '../../components/ImageUploader';
import type { ImageItem } from '../../components/MultiImageUploader';
import { MultiImageUploader } from '../../components/MultiImageUploader';
import { ModuleGuard } from '../../components/ModuleGuard';
import { CategoryTagsInput } from '@/app/admin/components/AdditionalCategoriesSelect';
import { QuickCreateProjectCategoryModal } from '@/app/admin/components/QuickCreateProjectCategoryModal';

const MODULE_KEY = 'projects';

type ProjectStatus = 'Draft' | 'Published';
type RenderType = 'content' | 'markdown' | 'html';
type VideoType = 'none' | 'youtube' | 'drive' | 'external';

const generateSlug = (value: string) => value.toLowerCase()
  .normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd')
  .replaceAll(/[^a-z0-9\s]/g, '')
  .replaceAll(/\s+/g, '-');

const getEmbedUrl = (type: VideoType, url: string) => {
  if (!url) {return null;}
  if (type === 'youtube') {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    const videoId = match && match[2]?.length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }
  if (type === 'drive') {
    return url.replace('/view', '/preview');
  }
  return type === 'external' ? url : null;
};

export default function ProjectCreatePage() {
  return (
    <ModuleGuard moduleKey="projects">
      <ProjectCreateContent />
    </ModuleGuard>
  );
}

function ProjectCreateContent() {
  const router = useRouter();
  const categoriesData = useQuery(api.projectCategories.listAll, {});
  const createProject = useMutation(api.projects.create);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [renderType, setRenderType] = useState<RenderType>('content');
  const [markdownRender, setMarkdownRender] = useState('');
  const [htmlRender, setHtmlRender] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [thumbnailStorageId, setThumbnailStorageId] = useState<Id<'_storage'> | undefined>();
  const [galleryItems, setGalleryItems] = useState<ImageItem[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [introVideoType, setIntroVideoType] = useState<VideoType>('none');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>('Draft');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const defaultStatus = settingsData?.find((setting) => setting.settingKey === 'defaultStatus')?.value;
    if (defaultStatus === 'published') {
      setStatus('Published');
    }
  }, [settingsData]);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach((field) => fields.add(field.fieldKey));
    return fields;
  }, [fieldsData]);

  const multiCategoryEnabled = Boolean(settingsData?.find((setting) => setting.settingKey === 'enableMultipleCategories')?.value);
  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRenderCard = hasMarkdownRender || hasHtmlRender;
  const showIntroVideo = enabledFields.has('introVideoUrl') || enabledFields.has('introVideoType');
  const showGallery = enabledFields.has('images');

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !categoryId) {return;}
    setIsSubmitting(true);
    try {
      const resolvedGalleryItems = galleryItems
        .map((item) => ({ storageId: item.storageId, url: item.url }))
        .filter((item) => Boolean(item.url));
      const resolvedMetaTitle = truncateText(title.trim(), 60);
      const resolvedMetaDescription = truncateText(stripHtml(excerpt || content || ''), 160);
      await createProject({
        additionalCategoryIds: multiCategoryEnabled
          ? additionalCategoryIds.filter((id) => id !== categoryId) as Id<'projectCategories'>[]
          : undefined,
        categoryId: categoryId as Id<'projectCategories'>,
        clientName: enabledFields.has('clientName') ? (clientName.trim() || undefined) : undefined,
        content,
        excerpt: excerpt.trim() || undefined,
        featured: enabledFields.has('featured') ? featured : undefined,
        htmlRender: hasHtmlRender ? (htmlRender.trim() || undefined) : undefined,
        images: showGallery ? resolvedGalleryItems.map((item) => item.url) : undefined,
        imageStorageIds: showGallery ? resolvedGalleryItems.map((item) => item.storageId ?? null) : undefined,
        introVideoType: showIntroVideo ? introVideoType : 'none',
        introVideoUrl: showIntroVideo && introVideoType !== 'none' ? (introVideoUrl.trim() || undefined) : undefined,
        markdownRender: hasMarkdownRender ? (markdownRender.trim() || undefined) : undefined,
        metaDescription: enabledFields.has('metaDescription') ? (metaDescription.trim() || resolvedMetaDescription || undefined) : undefined,
        metaTitle: enabledFields.has('metaTitle') ? (metaTitle.trim() || resolvedMetaTitle || undefined) : undefined,
        projectUrl: enabledFields.has('projectUrl') ? (projectUrl.trim() || undefined) : undefined,
        renderType,
        slug: slug.trim() || generateSlug(title.trim()),
        status,
        thumbnail,
        thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
        title: title.trim(),
      });
      toast.success('Tạo dự án thành công');
      router.push('/admin/projects');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo dự án'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <QuickCreateProjectCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCreated={(id) => setCategoryId(id)}
      />
      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-500/10 p-2">
              <Briefcase className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm dự án mới</h1>
              <p className="text-sm text-slate-500">Tạo case study/dự án cho website.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                  <CopyableInput value={title} onChange={handleTitleChange} required placeholder="Nhập tiêu đề dự án..." copyLabel="tiêu đề" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(event) => setSlug(event.target.value)} className="font-mono text-sm" />
                </div>
                {enabledFields.has('excerpt') && (
                  <div className="space-y-2">
                    <Label>Mô tả ngắn</Label>
                    <Input value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="Tóm tắt dự án..." />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <LexicalEditor onChange={setContent} initialContent={content} />
                </div>
              </CardContent>
            </Card>

            {showAdvancedRenderCard && (
              <Card>
                <CardHeader><CardTitle className="text-base">Render nâng cao</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kiểu render</Label>
                    <select value={renderType} onChange={(event) => setRenderType(event.target.value as RenderType)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                      <option value="content">Content</option>
                      {hasMarkdownRender && <option value="markdown">Markdown</option>}
                      {hasHtmlRender && <option value="html">HTML</option>}
                    </select>
                  </div>
                  {hasMarkdownRender && (
                    <div className="space-y-2">
                      <Label>Markdown render</Label>
                      <textarea value={markdownRender} onChange={(event) => setMarkdownRender(event.target.value)} className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                  )}
                  {hasHtmlRender && (
                    <div className="space-y-2">
                      <Label>HTML render</Label>
                      <textarea value={htmlRender} onChange={(event) => setHtmlRender(event.target.value)} className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800" />
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
                      <Label>Meta Title</Label>
                      <Input value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} placeholder="Lấy theo tiêu đề nếu để trống" />
                    </div>
                  )}
                  {enabledFields.has('metaDescription') && (
                    <div className="space-y-2">
                      <Label>Meta Description</Label>
                      <textarea value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} className="min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                  )}
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
                  <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                    <option value="Draft">Bản nháp</option>
                    <option value="Published">Đã xuất bản</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Danh mục <span className="text-red-500">*</span></Label>
                  {multiCategoryEnabled ? (
                    <>
                      <CategoryTagsInput
                        categories={categoriesData}
                        value={[categoryId, ...additionalCategoryIds].filter(Boolean)}
                        onQuickCreate={() => setShowCategoryModal(true)}
                        onChange={(ids) => {
                          setCategoryId(ids[0] ?? '');
                          setAdditionalCategoryIds(ids.slice(1));
                        }}
                      />
                      <p className="text-xs text-slate-500">Thẻ đầu tiên là danh mục chính/canonical.</p>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                        <option value="">-- Chọn danh mục --</option>
                        {categoriesData?.map((category) => (
                          <option key={category._id} value={category._id}>{category.name}</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setShowCategoryModal(true)}>
                        <Plus size={16} />
                      </Button>
                    </div>
                  )}
                </div>
                {enabledFields.has('featured') && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">Dự án nổi bật</span>
                  </label>
                )}
              </CardContent>
            </Card>

            {(enabledFields.has('clientName') || enabledFields.has('projectUrl')) && (
              <Card>
                <CardHeader><CardTitle className="text-base">Thông tin dự án</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {enabledFields.has('clientName') && (
                    <div className="space-y-2">
                      <Label>Khách hàng</Label>
                      <Input value={clientName} onChange={(event) => setClientName(event.target.value)} />
                    </div>
                  )}
                  {enabledFields.has('projectUrl') && (
                    <div className="space-y-2">
                      <Label>URL dự án</Label>
                      <Input value={projectUrl} onChange={(event) => setProjectUrl(event.target.value)} placeholder="https://..." />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {showIntroVideo && (
              <Card>
                <CardHeader><CardTitle className="text-base">Video giới thiệu</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Loại video</Label>
                    <select value={introVideoType} onChange={(event) => setIntroVideoType(event.target.value as VideoType)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                      <option value="none">Không có</option>
                      <option value="youtube">YouTube</option>
                      <option value="drive">Google Drive</option>
                      <option value="external">Link ngoài</option>
                    </select>
                  </div>
                  {introVideoType !== 'none' && (
                    <div className="space-y-2">
                      <Label>URL video</Label>
                      <Input value={introVideoUrl} onChange={(event) => setIntroVideoUrl(event.target.value)} placeholder="https://..." />
                      {getEmbedUrl(introVideoType, introVideoUrl) && (
                        <div className="mt-2 aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                          <iframe src={getEmbedUrl(introVideoType, introVideoUrl)!} className="h-full w-full border-0" allowFullScreen />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                  folder="projects"
                  naming={{ entityName: slug.trim() || 'project', style: 'slug-index', index: 1 }}
                  deleteMode="defer"
                  aspectRatio="video"
                />
              </CardContent>
            </Card>

            {showGallery && (
              <Card>
                <CardHeader><CardTitle className="text-base">Thư viện ảnh</CardTitle></CardHeader>
                <CardContent>
                  <MultiImageUploader<ImageItem>
                    items={galleryItems}
                    onChange={setGalleryItems}
                    folder="projects"
                    naming={{ entityName: slug.trim() || 'project', style: 'slug-index' }}
                    namingIndexOffset={1}
                    deleteMode="defer"
                    imageKey="url"
                    minItems={0}
                    maxItems={20}
                    aspectRatio="video"
                    columns={2}
                    addButtonText="Thêm ảnh"
                    emptyText="Chưa có ảnh trong thư viện"
                    layout="vertical"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-white py-4 dark:border-slate-800 dark:bg-slate-950">
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/projects')}>Hủy</Button>
          <Button type="submit" disabled={isSubmitting || !title.trim() || !categoryId} className="bg-teal-600 hover:bg-teal-500">
            {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
            Tạo dự án
          </Button>
        </div>
      </form>
    </>
  );
}
