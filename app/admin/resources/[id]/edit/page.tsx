'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { ExternalLink, FileText, Filter, Loader2, Plus } from 'lucide-react';
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
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/admin/components/ui';
import { CopyableInput } from '@/app/admin/components/CopyTextButton';

const MODULE_KEY = 'resources';

const generateSlug = (value: string) => value.toLowerCase()
  .normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd')
  .replaceAll(/[^a-z0-9\s]/g, '')
  .replaceAll(/\s+/g, '-');

type ResourceStatus = 'Draft' | 'Published' | 'Archived';
type PricingType = 'free' | 'paid' | 'contact';
type RenderType = 'content' | 'markdown' | 'html';

export default function ResourceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const resourceId = id as Id<'resources'>;

  const resourceData = useQuery(api.resources.getById, { id: resourceId });
  const additionalCategoryIdsData = useQuery(api.resources.getAdditionalCategoryIds, { id: resourceId });
  const categoriesData = useQuery(api.resourceCategories.listAll, {});
  const updateResource = useMutation(api.resources.update);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: MODULE_KEY, featureKey: 'enableResourceFilters' });
  const featuredFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: MODULE_KEY, featureKey: 'enableFeatured' });
  const activeFilters = useQuery(api.resourceFilters.listActive, {});
  const allFilterValues = useQuery(api.resourceFilters.listAllValues, {});
  const assignedFilters = useQuery(api.resourceFilters.listByResource, { resourceId });
  const resourceCustomers = useQuery(api.resources.listResourceCustomers, { resourceId, limit: 200 });
  const customersData = useQuery(api.customers.listAll, { limit: 100 });
  const grantAccess = useMutation(api.resources.grantAccess);
  const revokeAccess = useMutation(api.resources.revokeAccess);
  const removeAccess = useMutation(api.resources.removeAccess);
  const activateAccess = useMutation(api.resources.activateAccess);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [thumbnailStorageId, setThumbnailStorageId] = useState<Id<'_storage'> | undefined | null>();
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
  const [initialized, setInitialized] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'general' | 'customers'>('general');
  const [selectedValueIds, setSelectedValueIds] = useState<Id<'resourceFilterValues'>[]>([]);
  const [revokingId, setRevokingId] = useState<Id<'resourceCustomers'> | null>(null);
  const [deletingAccessId, setDeletingAccessId] = useState<Id<'resourceCustomers'> | null>(null);
  const [activatingAccessId, setActivatingAccessId] = useState<Id<'resourceCustomers'> | null>(null);
  const [grantCustomerId, setGrantCustomerId] = useState('');
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [snapshotVersion, setSnapshotVersion] = useState(0);

  const initialSnapshotRef = useRef<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    categoryId: string;
    additionalCategoryIds: string[];
    thumbnail: string;
    thumbnailStorageId: Id<'_storage'> | null | undefined;
    galleryImages: string[];
    downloadUrl: string;
    status: ResourceStatus;
    pricingType: PricingType;
    priceAmount: number | undefined;
    comparePriceAmount: number | undefined;
    priceNote: string;
    isPriceVisible: boolean;
    featured: boolean;
    renderType: RenderType;
    markdownRender: string;
    htmlRender: string;
    metaTitle: string;
    metaDescription: string;
    selectedValueIds: Id<'resourceFilterValues'>[];
  } | null>(null);

  const enabledFields = useMemo(() => new Set(fieldsData?.map((field) => field.fieldKey) ?? []), [fieldsData]);
  const multiCategoryEnabled = Boolean(settingsData?.find((setting) => setting.settingKey === 'enableMultipleCategories')?.value);
  const selectedCategorySlug = categoriesData?.find((category) => category._id === categoryId)?.slug;
  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRender = hasMarkdownRender || hasHtmlRender;
  const showGallery = enabledFields.has('images');
  const activeAccessCustomerIds = useMemo(
    () => new Set(resourceCustomers?.filter((item) => item.status === 'active').map((item) => item.customerId) ?? []),
    [resourceCustomers]
  );
  const grantableCustomers = useMemo(
    () => customersData?.filter((customer) => !activeAccessCustomerIds.has(customer._id)) ?? [],
    [activeAccessCustomerIds, customersData]
  );

  const currentSnapshot = useMemo(() => ({
    title: title.trim(),
    slug: slug.trim(),
    content,
    excerpt: excerpt.trim(),
    categoryId,
    additionalCategoryIds,
    thumbnail: thumbnail ?? '',
    thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
    galleryImages: galleryItems.map((item) => item.url).filter(Boolean),
    downloadUrl: downloadUrl.trim(),
    status,
    pricingType,
    priceAmount,
    comparePriceAmount,
    priceNote: priceNote.trim(),
    isPriceVisible,
    featured,
    renderType,
    markdownRender: markdownRender.trim(),
    htmlRender: htmlRender.trim(),
    metaTitle: metaTitle.trim(),
    metaDescription: metaDescription.trim(),
    selectedValueIds,
  }), [title, slug, content, excerpt, categoryId, additionalCategoryIds,
    thumbnail, thumbnailStorageId, galleryItems, downloadUrl, status,
    pricingType, priceAmount, comparePriceAmount, priceNote, isPriceVisible,
    featured, renderType, markdownRender, htmlRender, metaTitle, metaDescription,
    selectedValueIds]);

  const hasChanges = useMemo(() => {
    if (!initialized || !initialSnapshotRef.current) { return false; }
    return JSON.stringify(initialSnapshotRef.current) !== JSON.stringify(currentSnapshot);
  }, [currentSnapshot, snapshotVersion, initialized]);

  useEffect(() => {
    if (saveStatus === 'saving') { return; }
    if (hasChanges && saveStatus === 'saved') { setSaveStatus('idle'); return; }
    if (!hasChanges && saveStatus === 'idle') { setSaveStatus('saved'); }
  }, [hasChanges, saveStatus]);


  useEffect(() => {
    if (!resourceData || additionalCategoryIdsData === undefined || assignedFilters === undefined || initialized) {return;}
    setTitle(resourceData.title);
    setSlug(resourceData.slug);
    setContent(resourceData.content);
    setExcerpt(resourceData.excerpt ?? '');
    setCategoryId(resourceData.categoryId);
    setAdditionalCategoryIds(additionalCategoryIdsData);
    setThumbnail(resourceData.thumbnail);
    setThumbnailStorageId(resourceData.thumbnailStorageId ?? undefined);
    setGalleryItems((resourceData.images ?? []).map((url, index) => ({
      id: `${index}-${url}`,
      storageId: resourceData.imageStorageIds?.[index] ?? undefined,
      url,
    })));
    setDownloadUrl(resourceData.downloadUrl);
    setStatus(resourceData.status);
    setPricingType(resourceData.pricingType);
    setPriceAmount(resourceData.priceAmount);
    setComparePriceAmount(resourceData.comparePriceAmount);
    setPriceNote(resourceData.priceNote ?? '');
    setIsPriceVisible(resourceData.isPriceVisible !== false);
    setFeatured(resourceData.featured ?? false);
    setRenderType(resourceData.renderType ?? 'content');
    setMarkdownRender(resourceData.markdownRender ?? '');
    setHtmlRender(resourceData.htmlRender ?? '');
    setMetaTitle(resourceData.metaTitle ?? '');
    setMetaDescription(resourceData.metaDescription ?? '');
    setSelectedValueIds(assignedFilters.map((item) => item._id));
    setEditorResetKey((prev) => prev + 1);
    initialSnapshotRef.current = {
      title: resourceData.title.trim(),
      slug: resourceData.slug.trim(),
      content: resourceData.content,
      excerpt: (resourceData.excerpt ?? '').trim(),
      categoryId: resourceData.categoryId,
      additionalCategoryIds: additionalCategoryIdsData,
      thumbnail: resourceData.thumbnail ?? '',
      thumbnailStorageId: resourceData.thumbnail ? (resourceData.thumbnailStorageId ?? null) : null,
      galleryImages: (resourceData.images ?? []).filter(Boolean),
      downloadUrl: resourceData.downloadUrl.trim(),
      status: resourceData.status,
      pricingType: resourceData.pricingType,
      priceAmount: resourceData.priceAmount,
      comparePriceAmount: resourceData.comparePriceAmount,
      priceNote: (resourceData.priceNote ?? '').trim(),
      isPriceVisible: resourceData.isPriceVisible !== false,
      featured: resourceData.featured ?? false,
      renderType: resourceData.renderType ?? 'content',
      markdownRender: (resourceData.markdownRender ?? '').trim(),
      htmlRender: (resourceData.htmlRender ?? '').trim(),
      metaTitle: (resourceData.metaTitle ?? '').trim(),
      metaDescription: (resourceData.metaDescription ?? '').trim(),
      selectedValueIds: assignedFilters.map((item) => item._id),
    };
    setSnapshotVersion((prev) => prev + 1);
    setInitialized(true);
  }, [additionalCategoryIdsData, assignedFilters, initialized, resourceData]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTitle(value);
    if (!slug || slug === generateSlug(resourceData?.title ?? '')) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!title.trim() || !categoryId || !downloadUrl.trim()) {return;}

    setIsSubmitting(true);
    setSaveStatus('saving');
    try {
      const resolvedMetaTitle = truncateText(title.trim(), 60);
      const resolvedMetaDescription = truncateText(stripHtml(excerpt || content || ''), 160);
      const resolvedGalleryItems = showGallery ? galleryItems.filter((item) => item.url.trim()) : [];
      await updateResource({
        additionalCategoryIds: multiCategoryEnabled
          ? additionalCategoryIds.filter((item) => item !== categoryId) as Id<'resourceCategories'>[]
          : undefined,
        categoryId: categoryId as Id<'resourceCategories'>,
        comparePriceAmount: pricingType === 'paid' ? comparePriceAmount : undefined,
        content,
        downloadUrl: downloadUrl.trim(),
        excerpt: excerpt.trim() || undefined,
        featured,
        filterValueIds: selectedValueIds,
        htmlRender: hasHtmlRender ? (htmlRender.trim() || undefined) : undefined,
        id: resourceId,
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
      initialSnapshotRef.current = { ...currentSnapshot };
      setSnapshotVersion((prev) => prev + 1);
      setSaveStatus('saved');
      toast.success('Đã cập nhật tài nguyên');
    } catch (error) {
      setSaveStatus('idle');
      toast.error(getAdminMutationErrorMessage(error, 'Không thể cập nhật tài nguyên'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAccess = async (accessId: Id<'resourceCustomers'>) => {
    if (!confirm('Thu hồi quyền tải tài nguyên này?')) {return;}
    setRevokingId(accessId);
    try {
      await revokeAccess({ accessId });
      toast.success('Đã thu hồi quyền tải');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thu hồi quyền tải');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRemoveAccess = async (accessId: Id<'resourceCustomers'>) => {
    if (!confirm('Xóa hoàn toàn quyền truy cập này của khách hàng? Hành động này sẽ xóa bản ghi khỏi cơ sở dữ liệu.')) {return;}
    setDeletingAccessId(accessId);
    try {
      await removeAccess({ accessId });
      toast.success('Đã xóa quyền truy cập');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa quyền truy cập');
    } finally {
      setDeletingAccessId(null);
    }
  };

  const handleActivateAccess = async (accessId: Id<'resourceCustomers'>) => {
    if (!confirm('Cấp lại quyền tải tài nguyên cho khách hàng này?')) {return;}
    setActivatingAccessId(accessId);
    try {
      await activateAccess({ accessId });
      toast.success('Đã cấp lại quyền tải tài nguyên');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cấp lại quyền tải');
    } finally {
      setActivatingAccessId(null);
    }
  };

  const handleGrantAccess = async () => {
    if (!grantCustomerId) {return;}
    setIsGrantingAccess(true);
    try {
      await grantAccess({ customerId: grantCustomerId as Id<'customers'>, resourceId });
      toast.success('Đã cấp quyền tải tài nguyên');
      setGrantCustomerId('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cấp quyền tải');
    } finally {
      setIsGrantingAccess(false);
    }
  };

  if (resourceData === undefined || categoriesData === undefined || fieldsData === undefined || settingsData === undefined) {
    return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-slate-400" /></div>;
  }

  if (resourceData === null) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <FileText className="h-10 w-10 text-slate-300" />
        <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">Không tìm thấy tài nguyên</div>
        <Button onClick={() => router.push('/admin/resources')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const frontendHref = selectedCategorySlug ? `/${selectedCategorySlug}/${slug}` : `/resources/${slug}`;

  return (
    <>
      <QuickCreateResourceCategoryModal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); }}
        onCreated={(newCategoryId) => { setCategoryId(newCategoryId); }}
      />
      <form onSubmit={(event) => { void handleSubmit(event); }} className="space-y-6 pb-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <FileText className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sửa tài nguyên</h1>
              <p className="mt-1 text-sm text-slate-500">Cập nhật nội dung, link tải và danh sách khách đã có quyền.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {[
            { key: 'general', label: 'Thông tin' },
            { key: 'customers', label: 'Khách đã mua/tải' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key as typeof activeTab); }}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
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
                    <Input value={slug} onChange={(e) => { setSlug(e.target.value); }} className="font-mono text-sm" />
                    <p className="text-xs text-slate-500">Đường dẫn: {frontendHref}</p>
                  </div>
                  {enabledFields.has('excerpt') && (
                    <div className="space-y-2">
                      <Label>Mô tả ngắn</Label>
                      <Input value={excerpt} onChange={(e) => { setExcerpt(e.target.value); }} />
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
                      <select value={renderType} onChange={(e) => { setRenderType(e.target.value as RenderType); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
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
                        {frontendHref}
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
                      <option value="Archived">Lưu trữ</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Danh mục <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); }} required className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                        <option value="">-- Chọn danh mục --</option>
                        {categoriesData.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                      </select>
                      <Button type="button" variant="outline" size="icon" onClick={() => { setShowCategoryModal(true); }} title="Tạo danh mục mới"><Plus size={16} /></Button>
                    </div>
                  </div>
                  {multiCategoryEnabled && (
                    <div className="space-y-2">
                      <Label>Danh mục phụ</Label>
                      <CategoryTagsInput
                        categories={categoriesData}
                        value={additionalCategoryIds}
                        onChange={setAdditionalCategoryIds}
                        onQuickCreate={() => { setShowCategoryModal(true); }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {resourceFiltersFeature?.enabled && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Filter size={16} /> Bộ lọc</CardTitle></CardHeader>
                  <CardContent>
                    <ResourceFilterTagsInput
                      activeFilters={activeFilters ?? []}
                      allFilterValues={allFilterValues ?? []}
                      value={selectedValueIds}
                      onChange={setSelectedValueIds}
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-base">Link tải</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input value={downloadUrl} onChange={(e) => { setDownloadUrl(e.target.value); }} required placeholder="https://drive.google.com/..." />
                  <p className="text-xs text-slate-500">Link chỉ trả về qua mutation tải xuống sau khi kiểm tra quyền.</p>
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
                    <Input value={priceNote} onChange={(e) => { setPriceNote(e.target.value); }} />
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
                    storageId={thumbnailStorageId ?? undefined}
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
                  <CardContent>
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input type="checkbox" checked={featured} onChange={(e) => { setFeatured(e.target.checked); }} />
                      Đánh dấu nổi bật
                    </label>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Khách đã mua/tải ({resourceCustomers?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
                <select
                  value={grantCustomerId}
                  onChange={(event) => { setGrantCustomerId(event.target.value); }}
                  className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  disabled={customersData === undefined || grantableCustomers.length === 0}
                >
                  <option value="">
                    {customersData === undefined ? 'Đang tải khách hàng...' : grantableCustomers.length === 0 ? 'Không còn khách để cấp quyền' : 'Chọn khách hàng để cấp quyền'}
                  </option>
                  {grantableCustomers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} — {customer.email || customer.phone || 'Chưa có liên hệ'}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="gap-2"
                  disabled={!grantCustomerId || isGrantingAccess}
                  onClick={() => { void handleGrantAccess(); }}
                >
                  {isGrantingAccess ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Cấp quyền
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Lượt tải</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resourceCustomers === undefined ? (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">Đang tải...</TableCell></TableRow>
                  ) : resourceCustomers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">Chưa có khách hàng nào.</TableCell></TableRow>
                  ) : resourceCustomers.map((item) => (
                    <TableRow key={item.accessId}>
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{item.customerName}</div>
                        <div className="text-xs text-slate-500">{item.customerEmail || item.customerPhone || 'Chưa có thông tin liên hệ'}</div>
                      </TableCell>
                      <TableCell>
                        {item.sourceType === 'order' ? 'Đơn hàng' : item.sourceType === 'free' ? 'Tải miễn phí' : 'Thủ công'}
                      </TableCell>
                      <TableCell>{item.downloadCount}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'active' ? 'success' : 'secondary'}>
                          {item.status === 'active' ? 'Đang có quyền' : 'Đã thu hồi'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {item.status === 'active' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={revokingId === item.accessId}
                              onClick={() => { void handleRevokeAccess(item.accessId); }}
                            >
                              {revokingId === item.accessId ? 'Đang thu hồi...' : 'Thu hồi'}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={activatingAccessId === item.accessId}
                              onClick={() => { void handleActivateAccess(item.accessId); }}
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/30 dark:hover:bg-emerald-900/20"
                            >
                              {activatingAccessId === item.accessId ? 'Đang cấp lại...' : 'Cấp lại'}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={deletingAccessId === item.accessId}
                            onClick={() => { void handleRemoveAccess(item.accessId); }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            {deletingAccessId === item.accessId ? 'Đang xóa...' : 'Xóa'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          onCancel={() => router.push('/admin/resources')}
          submitLabel="Lưu thay đổi"
        >
          <>
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/resources')} disabled={isSubmitting}>Hủy bỏ</Button>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.open(frontendHref, '_blank')}
                disabled={!slug.trim()}
                title="Xem ngoài site"
              >
                <ExternalLink size={16} />
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
            </div>
          </>
        </HomeComponentStickyFooter>
      </form>
    </>
  );
}
