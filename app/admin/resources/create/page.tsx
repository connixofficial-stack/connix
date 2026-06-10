'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { FileText, Filter, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { CategoryTagsInput } from '@/app/admin/components/AdditionalCategoriesSelect';
import { ImageUploader } from '@/app/admin/components/ImageUploader';
import { LexicalEditor } from '@/app/admin/components/LexicalEditor';
import { MultiImageUploader, type ImageItem } from '@/app/admin/components/MultiImageUploader';
import { QuickCreateResourceCategoryModal } from '@/app/admin/components/QuickCreateResourceCategoryModal';
import { ResourceFilterTagsInput } from '@/app/admin/components/ResourceFilterTagsInput';
import { stripHtml, truncateText } from '@/lib/seo';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';

const MODULE_KEY = 'resources';

const generateSlug = (value: string) => value.toLowerCase()
  .normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd')
  .replaceAll(/[^a-z0-9\s]/g, '')
  .replaceAll(/\s+/g, '-');

type ResourceStatus = 'Draft' | 'Published';
type PricingType = 'free' | 'paid' | 'contact';
type RenderType = 'content' | 'markdown' | 'html';

export default function ResourceCreatePage() {
  const router = useRouter();
  const categoriesData = useQuery(api.resourceCategories.listAll, {});
  const createResource = useMutation(api.resources.create);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: MODULE_KEY, featureKey: 'enableResourceFilters' });
  const featuredFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: MODULE_KEY, featureKey: 'enableFeatured' });
  const activeFilters = useQuery(api.resourceFilters.listActive, {});
  const allFilterValues = useQuery(api.resourceFilters.listAllValues, {});

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [thumbnailStorageId, setThumbnailStorageId] = useState<Id<'_storage'> | undefined>();
  const [galleryItems, setGalleryItems] = useState<ImageItem[]>([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [status, setStatus] = useState<ResourceStatus>('Draft');
  const [pricingType, setPricingType] = useState<PricingType>('free');
  const [priceAmount, setPriceAmount] = useState<number | undefined>();
  const [comparePriceAmount, setComparePriceAmount] = useState<number | undefined>();
  const [priceNote, setPriceNote] = useState('');
  const [isPriceVisible, setIsPriceVisible] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [renderType, setRenderType] = useState<RenderType>('content');
  const [markdownRender, setMarkdownRender] = useState('');
  const [htmlRender, setHtmlRender] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorResetKey, _setEditorResetKey] = useState(0);
  const [selectedValueIds, setSelectedValueIds] = useState<Id<'resourceFilterValues'>[]>([]);

  const enabledFields = useMemo(() => new Set(fieldsData?.map((field) => field.fieldKey) ?? []), [fieldsData]);
  const multiCategoryEnabled = Boolean(settingsData?.find((setting) => setting.settingKey === 'enableMultipleCategories')?.value);
  const categorySlugPreview = categoriesData?.find((category) => category._id === categoryId)?.slug || 'resources';
  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRender = hasMarkdownRender || hasHtmlRender;
  const showGallery = enabledFields.has('images');

  useEffect(() => {
    if (!settingsData) {return;}
    const defaultStatus = settingsData.find((setting) => setting.settingKey === 'defaultStatus')?.value;
    const defaultPricingType = settingsData.find((setting) => setting.settingKey === 'defaultPricingType')?.value;
    if (defaultStatus === 'published') {setStatus('Published');}
    if (defaultPricingType === 'paid' || defaultPricingType === 'contact' || defaultPricingType === 'free') {
      setPricingType(defaultPricingType);
    }
  }, [settingsData]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !categoryId || !downloadUrl.trim()) {return;}

    setIsSubmitting(true);
    try {
      const resolvedMetaTitle = truncateText(title.trim(), 60);
      const resolvedMetaDescription = truncateText(stripHtml(excerpt || content || ''), 160);
      const resolvedGalleryItems = showGallery ? galleryItems.filter((item) => item.url.trim()) : [];
      const newResourceId = await createResource({
        additionalCategoryIds: multiCategoryEnabled
          ? additionalCategoryIds.filter((id) => id !== categoryId) as Id<'resourceCategories'>[]
          : undefined,
        categoryId: categoryId as Id<'resourceCategories'>,
        comparePriceAmount: pricingType === 'paid' ? comparePriceAmount : undefined,
        content,
        downloadUrl: downloadUrl.trim(),
        excerpt: excerpt.trim() || undefined,
        featured,
        filterValueIds: selectedValueIds,
        htmlRender: hasHtmlRender ? (htmlRender.trim() || undefined) : undefined,
        images: showGallery ? resolvedGalleryItems.map((item) => item.url) : undefined,
        imageStorageIds: showGallery ? resolvedGalleryItems.map((item) => item.storageId ?? null) : undefined,
        isPriceVisible,
        markdownRender: hasMarkdownRender ? (markdownRender.trim() || undefined) : undefined,
        metaDescription: enabledFields.has('metaDescription') ? (metaDescription.trim() || resolvedMetaDescription || undefined) : undefined,
        metaTitle: enabledFields.has('metaTitle') ? (metaTitle.trim() || resolvedMetaTitle || undefined) : undefined,
        priceAmount: pricingType === 'paid' ? priceAmount : undefined,
        priceNote: priceNote.trim() || undefined,
        pricingType,
        renderType,
        slug: slug.trim() || generateSlug(title),
        status,
        thumbnail,
        thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
        title: title.trim(),
      });
      toast.success('Đã tạo tài nguyên thành công');
      router.push(`/admin/resources/${newResourceId}/edit`);
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo tài nguyên'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <QuickCreateResourceCategoryModal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); }}
        onCreated={(id) => { setCategoryId(id); }}
      />
      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/10 p-2">
            <FileText className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm tài nguyên mới</h1>
            <p className="mt-1 text-sm text-slate-500">Tạo nội dung tải xuống, link Drive và quyền truy cập.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                  <CopyableInput value={title} onChange={handleTitleChange} required placeholder="Nhập tiêu đề tài nguyên..." copyLabel="tiêu đề" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) => { setSlug(e.target.value); }} className="font-mono text-sm" placeholder="tu-dong-tao-tu-tieu-de" />
                  <p className="text-xs text-slate-500">Xem trước: /{categorySlugPreview}/{slug || 'slug-tai-nguyen'}</p>
                </div>
                {enabledFields.has('excerpt') && (
                  <div className="space-y-2">
                    <Label>Mô tả ngắn</Label>
                    <Input value={excerpt} onChange={(e) => { setExcerpt(e.target.value); }} placeholder="Tóm tắt tài nguyên..." />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <LexicalEditor onChange={setContent} initialContent={content} resetKey={editorResetKey} />
                </div>
              </CardContent>
            </Card>

            {showAdvancedRender && (
              <Card>
                <CardHeader><CardTitle className="text-base">Nội dung nâng cao</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kiểu render</Label>
                    <select
                      value={renderType}
                      onChange={(e) => { setRenderType(e.target.value as RenderType); }}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="content">Lexical</option>
                      {hasMarkdownRender && <option value="markdown">Markdown</option>}
                      {hasHtmlRender && <option value="html">HTML</option>}
                    </select>
                  </div>
                  {hasMarkdownRender && (
                    <div className="space-y-2">
                      <Label>Nội dung Markdown</Label>
                      <textarea value={markdownRender} onChange={(e) => { setMarkdownRender(e.target.value); }} className="min-h-36 w-full rounded-md border border-slate-200 bg-white p-3 text-sm font-mono dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                  )}
                  {hasHtmlRender && (
                    <div className="space-y-2">
                      <Label>Nội dung HTML</Label>
                      <textarea value={htmlRender} onChange={(e) => { setHtmlRender(e.target.value); }} className="min-h-36 w-full rounded-md border border-slate-200 bg-white p-3 text-sm font-mono dark:border-slate-700 dark:bg-slate-800" />
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
                        onChange={(e) => { setMetaTitle(e.target.value); }}
                        placeholder="Lấy theo tiêu đề tài nguyên nếu để trống"
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
                        onChange={(e) => { setMetaDescription(e.target.value); }}
                        className="w-full min-h-[90px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                        placeholder="Lấy theo mô tả tài nguyên nếu bạn để trống"
                      />
                    </div>
                  )}
                  <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm">
                    <div className="text-blue-600 font-medium truncate">
                      {metaTitle.trim() || title || 'Tiêu đề tài nguyên'}
                    </div>
                    <div className="text-emerald-600 text-xs">
                      /{categorySlugPreview || 'resources'}/{slug || 'tai-nguyen'}
                    </div>
                    <div className="text-slate-600 text-xs mt-1 line-clamp-2">
                      {metaDescription.trim() || stripHtml(excerpt || content || '') || 'Mô tả ngắn sẽ hiển thị tại đây.'}
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
                  <select value={status} onChange={(e) => { setStatus(e.target.value as ResourceStatus); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                    <option value="Draft">Bản nháp</option>
                    <option value="Published">Đã xuất bản</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Danh mục <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); }} required className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                      <option value="">-- Chọn danh mục --</option>
                      {categoriesData?.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                    </select>
                    <Button type="button" variant="outline" size="icon" onClick={() => { setShowCategoryModal(true); }} title="Tạo danh mục mới"><Plus size={16} /></Button>
                  </div>
                </div>
                {multiCategoryEnabled && (
                  <div className="space-y-2">
                    <Label>Danh mục phụ</Label>
                    <CategoryTagsInput
                      categories={categoriesData ?? []}
                      value={additionalCategoryIds}
                      onChange={setAdditionalCategoryIds}
                      onQuickCreate={() => { setShowCategoryModal(true); }}
                      placeholder="Chọn thêm danh mục..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Link tải</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={downloadUrl} onChange={(e) => { setDownloadUrl(e.target.value); }} required placeholder="https://drive.google.com/..." />
                <p className="text-xs text-slate-500">Chỉ nhập Google Drive URL. Người dùng chỉ nhận link sau khi đăng nhập/mua.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Giá</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kiểu giá</Label>
                  <select value={pricingType} onChange={(e) => { setPricingType(e.target.value as PricingType); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                    <option value="free">Miễn phí</option>
                    <option value="paid">Trả phí</option>
                    <option value="contact">Liên hệ</option>
                  </select>
                </div>
                {pricingType === 'paid' && (
                  <>
                    <div className="space-y-2">
                      <Label>Giá bán</Label>
                      <Input type="number" min={0} value={priceAmount ?? ''} onChange={(e) => { setPriceAmount(e.target.value ? Number(e.target.value) : undefined); }} />
                    </div>
                    <div className="space-y-2">
                      <Label>Giá gốc</Label>
                      <Input type="number" min={0} value={comparePriceAmount ?? ''} onChange={(e) => { setComparePriceAmount(e.target.value ? Number(e.target.value) : undefined); }} />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Ghi chú giá</Label>
                  <Input value={priceNote} onChange={(e) => { setPriceNote(e.target.value); }} placeholder="VD: Tải trọn đời" />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={isPriceVisible} onChange={(e) => { setIsPriceVisible(e.target.checked); }} />
                  Hiển thị giá ngoài site
                </label>
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
                  folder="resources"
                  aspectRatio="video"
                  deleteMode="defer"
                />
              </CardContent>
            </Card>

            {showGallery && (
              <Card>
                <CardHeader><CardTitle className="text-base">Gallery</CardTitle></CardHeader>
                <CardContent>
                  <MultiImageUploader<ImageItem>
                    items={galleryItems}
                    onChange={setGalleryItems}
                    folder="resources"
                    naming={{ entityName: slug.trim() || 'resource', style: 'slug-index' }}
                    namingIndexOffset={1}
                    imageKey="url"
                    aspectRatio="video"
                    columns={2}
                    addButtonText="Thêm ảnh"
                    emptyText="Chưa có ảnh trong thư viện"
                    deleteMode="defer"
                    layout="vertical"
                  />
                </CardContent>
              </Card>
            )}

            {featuredFeature?.enabled && (
              <Card>
                <CardHeader><CardTitle className="text-base">Tuỳ chọn</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={featured} onChange={(e) => { setFeatured(e.target.checked); }} />
                    Đánh dấu nổi bật
                  </label>
                </CardContent>
              </Card>
            )}

            {resourceFiltersFeature?.enabled && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Filter size={16} /> Bộ lọc</CardTitle></CardHeader>
                <CardContent>
                  <ResourceFilterTagsInput
                    activeFilters={activeFilters ?? []}
                    allFilterValues={allFilterValues ?? []}
                    value={selectedValueIds}
                    onChange={setSelectedValueIds}
                    placeholder="Chọn bộ lọc tài nguyên..."
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <HomeComponentStickyFooter
          hasChanges={true}
          isSubmitting={isSubmitting}
          onCancel={() => router.push('/admin/resources')}
          onClickSave={() => {
            const form = document.querySelector('form');
            form?.requestSubmit();
          }}
          submitLabel="Tạo tài nguyên"
          submittingLabel="Đang tạo..."
          submitType="button"
        />
      </form>
    </>
  );
}
