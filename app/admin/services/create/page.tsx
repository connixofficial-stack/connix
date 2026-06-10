'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Briefcase, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { LexicalEditor } from '../../components/LexicalEditor';
import { ImageUploader } from '../../components/ImageUploader';
import { QuickCreateServiceCategoryModal } from '../../components/QuickCreateServiceCategoryModal';
import { stripHtml, truncateText } from '@/lib/seo';
import {
  normalizeSlotTemplate,
  normalizeSlotTemplateByWeekday,
} from '@/lib/bookings/slotTemplate';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { AiEntityImportDialog, type AiEntityImportPayload } from '@/app/admin/components/AiEntityImportDialog';
import { CategoryTagsInput } from '@/app/admin/components/AdditionalCategoriesSelect';

const MODULE_KEY = 'services';

export default function ServiceCreatePage() {
  const router = useRouter();
  const categoriesData = useQuery(api.serviceCategories.listAll, {});
  const createService = useMutation(api.services.create);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const bookingsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'bookings' });
  const isBookingsModuleEnabled = bookingsModule?.enabled ?? false;

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
  const [price, setPrice] = useState<number | undefined>();
  const [duration, setDuration] = useState('');
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [bookingDurationMin, setBookingDurationMin] = useState<number>(60);
  const [bookingSlotIntervalMin, setBookingSlotIntervalMin] = useState<number>(30);
  const [bookingCapacityPerSlot, setBookingCapacityPerSlot] = useState<number>(1);
  const [bookingSlotTemplateDefault] = useState<string[]>([]);
  const [bookingSlotTemplateByWeekday] = useState<Record<string, string[]>>({});
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(0);

  useEffect(() => {
    if (settingsData) {
      const defaultStatus = settingsData.find(s => s.settingKey === 'defaultStatus')?.value as string;
      if (defaultStatus === 'published') {
        setStatus('Published');
      }
    }
  }, [settingsData]);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const categoryData = categoriesData?.find((c) => c._id === categoryId);
  const categorySlugPreview = categoryData?.slug || 'chua-phan-loai';


  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRenderCard = hasMarkdownRender || hasHtmlRender;
  const multiCategoryEnabled = Boolean(settingsData?.find(s => s.settingKey === 'enableMultipleCategories')?.value);

  const generateSlugFromTitle = (value: string) => value.toLowerCase()
      .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
      .replaceAll(/[đĐ]/g, "d")
      .replaceAll(/[^a-z0-9\s]/g, '')
      .replaceAll(/\s+/g, '-');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(generateSlugFromTitle(val));
  };

  const handleApplyAiService = (item: AiEntityImportPayload) => {
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
      setMarkdownRender(item.markdownRender || '');
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
    if (typeof item.price === 'number') {setPrice(item.price);}
    if (item.duration) {setDuration(item.duration);}
    setEditorResetKey((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) {return;}

    setIsSubmitting(true);
    try {
      const resolvedMetaTitle = truncateText(title.trim(), 60);
      const resolvedMetaDescription = truncateText(stripHtml(excerpt || content || ''), 160);
      const resolvedBookingEnabled = isBookingsModuleEnabled ? bookingEnabled : false;
      await createService({
        categoryId: categoryId as Id<"serviceCategories">,
        additionalCategoryIds: multiCategoryEnabled
          ? additionalCategoryIds.filter((id) => id !== categoryId) as Id<"serviceCategories">[]
          : undefined,
        content,
        renderType,
        markdownRender: markdownRender.trim() || undefined,
        htmlRender: htmlRender.trim() || undefined,
        duration: duration.trim() || undefined,
        bookingEnabled: resolvedBookingEnabled,
        bookingDurationMin: resolvedBookingEnabled ? bookingDurationMin : undefined,
        bookingSlotIntervalMin: resolvedBookingEnabled ? bookingSlotIntervalMin : undefined,
        bookingCapacityPerSlot: resolvedBookingEnabled ? bookingCapacityPerSlot : undefined,
        bookingSlotTemplateDefault: resolvedBookingEnabled ? normalizeSlotTemplate(bookingSlotTemplateDefault) : undefined,
        bookingSlotTemplateByWeekday: resolvedBookingEnabled ? normalizeSlotTemplateByWeekday(bookingSlotTemplateByWeekday) : undefined,
        excerpt: excerpt.trim() || undefined,
        featured,
        metaDescription: enabledFields.has('metaDescription')
          ? (metaDescription.trim() || resolvedMetaDescription || undefined)
          : undefined,
        metaTitle: enabledFields.has('metaTitle')
          ? (metaTitle.trim() || resolvedMetaTitle || undefined)
          : undefined,
        price,
        slug: slug.trim() || title.toLowerCase().replaceAll(/\s+/g, '-'),
        status,
        thumbnail,
        thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
        title: title.trim(),
      });
      toast.success("Tạo dịch vụ mới thành công");
      router.push('/admin/services');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, "Không thể tạo dịch vụ"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <QuickCreateServiceCategoryModal 
      isOpen={showCategoryModal} 
      onClose={() =>{  setShowCategoryModal(false); }} 
      onCreated={(id) =>{  setCategoryId(id); }}
    />
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Briefcase className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm dịch vụ mới</h1>
            <div className="text-sm text-slate-500 mt-1">Tạo dịch vụ mới cho website</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                 <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                <CopyableInput value={title} onChange={handleTitleChange} required placeholder="Nhập tiêu đề dịch vụ..." copyLabel="tiêu đề" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="tu-dong-tao-tu-tieu-de" className="font-mono text-sm" />
              </div>
              {enabledFields.has('excerpt') && (
                 <div className="space-y-2">
                   <Label>Mô tả ngắn</Label>
                   <Input value={excerpt} onChange={(e) =>{  setExcerpt(e.target.value); }} placeholder="Tóm tắt nội dung dịch vụ..." />
                 </div>
               )}
              <div className="space-y-2">
                 <Label>Nội dung</Label>
                 <LexicalEditor onChange={setContent} initialContent={content} resetKey={editorResetKey} />
              </div>
            </CardContent>
          </Card>

          {isBookingsModuleEnabled && (
            <Card>
              <CardHeader><CardTitle className="text-base">Đặt lịch</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bookingEnabled}
                    onChange={(e) =>{  setBookingEnabled(e.target.checked); }}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Cho phép đặt lịch</span>
                </label>

                {bookingEnabled && (
                  <div className="space-y-4 rounded-md border border-slate-200 dark:border-slate-700 p-3">
                    <div className="space-y-2">
                      <Label>Thời lượng (phút)</Label>
                      <Input
                        type="number"
                        min={15}
                        step={5}
                        value={bookingDurationMin}
                        onChange={(e) =>{  setBookingDurationMin(Number(e.target.value || 60)); }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bước lịch (phút)</Label>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={bookingSlotIntervalMin}
                        onChange={(e) =>{  setBookingSlotIntervalMin(Number(e.target.value || 30)); }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Số khách / khung</Label>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={bookingCapacityPerSlot}
                        onChange={(e) =>{  setBookingCapacityPerSlot(Number(e.target.value || 1)); }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                      placeholder="Lấy theo tiêu đề dịch vụ nếu để trống"
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
                      placeholder="Lấy theo mô tả ngắn/nội dung nếu để trống"
                    />
                  </div>
                )}
                <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm">
                  <div className="text-blue-600 font-medium truncate">
                    {metaTitle.trim() || title || 'Tên dịch vụ'}
                  </div>
                  <div className="text-emerald-600 text-xs">
                    /{categorySlugPreview}/{slug || 'dich-vu'}
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
                  onChange={(e) =>{  setStatus(e.target.value as 'Draft' | 'Published'); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
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
                    required
                    className="flex-1 h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="">-- Chọn danh mục --</option>
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
              {enabledFields.has('featured') && (
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="featured" 
                    checked={featured} 
                    onChange={(e) =>{  setFeatured(e.target.checked); }}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="featured" className="cursor-pointer">Dịch vụ nổi bật</Label>
                </div>
              )}
            </CardContent>
          </Card>

          {(enabledFields.has('price') || enabledFields.has('duration')) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Thông tin dịch vụ</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {enabledFields.has('price') && (
                  <div className="space-y-2">
                    <Label>Giá dịch vụ (VND)</Label>
                    <Input 
                      type="number" 
                      value={price ?? ''} 
                      onChange={(e) =>{  setPrice(e.target.value ? Number(e.target.value) : undefined); }} 
                      placeholder="0"
                    />
                  </div>
                )}
                {enabledFields.has('duration') && (
                  <div className="space-y-2">
                    <Label>Thời gian thực hiện</Label>
                    <Input 
                      value={duration} 
                      onChange={(e) =>{  setDuration(e.target.value); }} 
                      placeholder="VD: 2-3 tuần"
                    />
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
                folder="services"
                naming={{ entityName: slug.trim() || 'service', style: 'slug-index', index: 1 }}
                deleteMode="defer"
                aspectRatio="video"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <HomeComponentStickyFooter
        isSubmitting={isSubmitting}
        submitLabel="Đăng"
        onCancel={() =>{  router.push('/admin/services'); }}
        disableSave={isSubmitting}
        submitClassName="bg-teal-600 hover:bg-teal-500"
      >
        <>
          <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/services'); }}>Hủy bỏ</Button>
          <div className="flex flex-wrap justify-end gap-2">
            <AiEntityImportDialog kind="service" enabledFields={enabledFields} onApply={handleApplyAiService} />
            <Button type="submit" variant="accent" disabled={isSubmitting || !title.trim() || !categoryId} className="bg-teal-600 hover:bg-teal-500">
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              Đăng
            </Button>
          </div>
        </>
      </HomeComponentStickyFooter>
    </form>
    </>
  );
}
