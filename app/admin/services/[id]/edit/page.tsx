'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Briefcase, ExternalLink, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import { LexicalEditor } from '../../../components/LexicalEditor';
import { ImageUploader } from '../../../components/ImageUploader';
import { QuickCreateServiceCategoryModal } from '../../../components/QuickCreateServiceCategoryModal';
import { stripHtml, truncateText } from '@/lib/seo';
import { normalizeRichText } from '@/app/admin/lib/normalize-rich-text';
import {
  buildAutoSlotsFromWindow,
  normalizeSlotTemplate,
  normalizeSlotTemplateByWeekday,
  type BookingSlotTemplateByWeekday,
} from '@/lib/bookings/slotTemplate';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { AiEntityImportDialog, type AiEntityImportPayload } from '@/app/admin/components/AiEntityImportDialog';
import { CategoryTagsInput } from '@/app/admin/components/AdditionalCategoriesSelect';

const MODULE_KEY = 'services';

type ServiceSlotTemplateScope = 'default' | '0' | '1' | '2' | '3' | '4' | '5' | '6';

const SERVICE_SLOT_SCOPE_OPTIONS: Array<{ value: ServiceSlotTemplateScope; label: string }> = [
  { value: 'default', label: 'Mặc định (mọi ngày)' },
  { value: '1', label: 'Thứ 2' },
  { value: '2', label: 'Thứ 3' },
  { value: '3', label: 'Thứ 4' },
  { value: '4', label: 'Thứ 5' },
  { value: '5', label: 'Thứ 6' },
  { value: '6', label: 'Thứ 7' },
  { value: '0', label: 'Chủ nhật' },
];

const resolveServiceTemplateByScope = (params: {
  scope: ServiceSlotTemplateScope;
  defaultSlots: string[];
  byWeekday: BookingSlotTemplateByWeekday;
}) => {
  if (params.scope === 'default') {
    return normalizeSlotTemplate(params.defaultSlots);
  }
  return normalizeSlotTemplate(params.byWeekday[Number(params.scope)] ?? []);
};

const setServiceTemplateByScope = (params: {
  scope: ServiceSlotTemplateScope;
  nextSlots: string[];
  defaultSlots: string[];
  byWeekday: BookingSlotTemplateByWeekday;
}) => {
  if (params.scope === 'default') {
    return {
      defaultSlots: normalizeSlotTemplate(params.nextSlots),
      byWeekday: params.byWeekday,
    };
  }

  const day = Number(params.scope);
  return {
    defaultSlots: params.defaultSlots,
    byWeekday: {
      ...params.byWeekday,
      [day]: normalizeSlotTemplate(params.nextSlots),
    },
  };
};

export default function ServiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const serviceData = useQuery(api.services.getById, { id: id as Id<"services"> });
  const additionalCategoryIdsData = useQuery(api.services.getAdditionalCategoryIds, { id: id as Id<"services"> });
  const categoriesData = useQuery(api.serviceCategories.listAll, {});
  const updateService = useMutation(api.services.update);
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
  const [bookingSlotTemplateDefault, setBookingSlotTemplateDefault] = useState<string[]>([]);
  const [bookingSlotTemplateByWeekday, setBookingSlotTemplateByWeekday] = useState<BookingSlotTemplateByWeekday>({});
  const [activeSlotScope, setActiveSlotScope] = useState<ServiceSlotTemplateScope>('default');
  const [showAdvancedBooking, setShowAdvancedBooking] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Archived'>('Draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const selectedCategorySlug = useMemo(
    () => categoriesData?.find((category) => category._id === categoryId)?.slug,
    [categoriesData, categoryId]
  );
  const multiCategoryEnabled = Boolean(settingsData?.find(s => s.settingKey === 'enableMultipleCategories')?.value);
  const initialSnapshotRef = useRef<{
    categoryId: string;
    additionalCategoryIds: string[];
    content: string;
    renderType: 'content' | 'markdown' | 'html';
    markdownRender: string;
    htmlRender: string;
    duration: string;
    bookingEnabled: boolean;
    bookingDurationMin: number;
    bookingSlotIntervalMin: number;
    bookingCapacityPerSlot: number;
    bookingSlotTemplateDefault: string[];
    bookingSlotTemplateByWeekday: BookingSlotTemplateByWeekday;
    excerpt: string;
    featured: boolean;
    metaDescription: string;
    metaTitle: string;
    price: number | null;
    slug: string;
    status: 'Draft' | 'Published' | 'Archived';
    thumbnail: string;
    thumbnailStorageId?: Id<'_storage'> | null;
    title: string;
  } | null>(null);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRenderCard = hasMarkdownRender || hasHtmlRender;
  const normalizedContent = useMemo(() => normalizeRichText(content), [content]);
  const suggestedSlots = useMemo(() => buildAutoSlotsFromWindow({
    startHour: 9,
    endHour: 20,
    slotIntervalMin: bookingSlotIntervalMin,
    durationMin: bookingDurationMin,
  }), [bookingDurationMin, bookingSlotIntervalMin]);
  const activeScopeSlots = useMemo(() => resolveServiceTemplateByScope({
    scope: activeSlotScope,
    defaultSlots: bookingSlotTemplateDefault,
    byWeekday: bookingSlotTemplateByWeekday,
  }), [activeSlotScope, bookingSlotTemplateByWeekday, bookingSlotTemplateDefault]);
  const activeScopeSet = useMemo(() => new Set(activeScopeSlots), [activeScopeSlots]);

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

  const normalizedBookingSlotTemplateDefault = useMemo(
    () => normalizeSlotTemplate(bookingSlotTemplateDefault),
    [bookingSlotTemplateDefault],
  );
  const normalizedBookingSlotTemplateByWeekday = useMemo(
    () => normalizeSlotTemplateByWeekday(bookingSlotTemplateByWeekday),
    [bookingSlotTemplateByWeekday],
  );

  const currentSnapshot = useMemo(() => ({
    categoryId,
    additionalCategoryIds,
    content: normalizedContent,
    renderType,
    markdownRender: markdownRender.trim(),
    htmlRender: htmlRender.trim(),
    duration: duration.trim(),
    bookingEnabled,
    bookingDurationMin,
    bookingSlotIntervalMin,
    bookingCapacityPerSlot,
    bookingSlotTemplateDefault: normalizedBookingSlotTemplateDefault,
    bookingSlotTemplateByWeekday: normalizedBookingSlotTemplateByWeekday,
    excerpt: excerpt.trim(),
    featured,
    metaDescription: metaDescription.trim(),
    metaTitle: metaTitle.trim(),
    price: price ?? null,
    slug: slug.trim(),
    status,
    thumbnail: thumbnail ?? '',
    thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
    title: title.trim(),
  }), [
    categoryId,
    additionalCategoryIds,
    normalizedContent,
    renderType,
    markdownRender,
    htmlRender,
    duration,
    bookingEnabled,
    bookingDurationMin,
    bookingSlotIntervalMin,
    bookingCapacityPerSlot,
    normalizedBookingSlotTemplateDefault,
    normalizedBookingSlotTemplateByWeekday,
    excerpt,
    featured,
    metaDescription,
    metaTitle,
    price,
    slug,
    status,
    thumbnail,
    thumbnailStorageId,
    title,
  ]);

  const hasChanges = useMemo(() => {
    if (!isDataLoaded || !initialSnapshotRef.current) {return false;}
    return JSON.stringify(initialSnapshotRef.current) !== JSON.stringify(currentSnapshot);
  }, [currentSnapshot, snapshotVersion, isDataLoaded]);

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
    if (serviceData && additionalCategoryIdsData !== undefined && !isDataLoaded) {
      setTitle(serviceData.title);
      setSlug(serviceData.slug);
      setContent(serviceData.content);
      const nextRenderType = serviceData.renderType ?? 'content';
      const allowedRenderTypes = new Set<'content' | 'markdown' | 'html'>(['content']);
      if (hasMarkdownRender) {allowedRenderTypes.add('markdown');}
      if (hasHtmlRender) {allowedRenderTypes.add('html');}
      const normalizedRenderType = allowedRenderTypes.has(nextRenderType) ? nextRenderType : 'content';
      setRenderType(normalizedRenderType);
      setMarkdownRender(serviceData.markdownRender ?? '');
      setHtmlRender(serviceData.htmlRender ?? '');
      setExcerpt(serviceData.excerpt ?? '');
      setMetaTitle(serviceData.metaTitle ?? '');
      setMetaDescription(serviceData.metaDescription ?? '');
      setThumbnail(serviceData.thumbnail);
      setThumbnailStorageId((serviceData as { thumbnailStorageId?: Id<'_storage'> }).thumbnailStorageId);
      setCategoryId(serviceData.categoryId);
      setAdditionalCategoryIds(additionalCategoryIdsData ?? []);
      setPrice(serviceData.price);
      setDuration(serviceData.duration ?? '');
      setBookingEnabled(serviceData.bookingEnabled ?? false);
      setBookingDurationMin(serviceData.bookingDurationMin ?? 60);
      setBookingSlotIntervalMin(serviceData.bookingSlotIntervalMin ?? 30);
      setBookingCapacityPerSlot(serviceData.bookingCapacityPerSlot ?? 1);
      setBookingSlotTemplateDefault(normalizeSlotTemplate(serviceData.bookingSlotTemplateDefault));
      setBookingSlotTemplateByWeekday(normalizeSlotTemplateByWeekday(serviceData.bookingSlotTemplateByWeekday));
      setFeatured(serviceData.featured ?? false);
      setStatus(serviceData.status);
      initialSnapshotRef.current = {
        categoryId: serviceData.categoryId,
        additionalCategoryIds: additionalCategoryIdsData ?? [],
        content: normalizeRichText(serviceData.content),
        renderType: normalizedRenderType,
        markdownRender: (serviceData.markdownRender ?? '').trim(),
        htmlRender: (serviceData.htmlRender ?? '').trim(),
        duration: (serviceData.duration ?? '').trim(),
        bookingEnabled: serviceData.bookingEnabled ?? false,
        bookingDurationMin: serviceData.bookingDurationMin ?? 60,
        bookingSlotIntervalMin: serviceData.bookingSlotIntervalMin ?? 30,
        bookingCapacityPerSlot: serviceData.bookingCapacityPerSlot ?? 1,
        bookingSlotTemplateDefault: normalizeSlotTemplate(serviceData.bookingSlotTemplateDefault),
        bookingSlotTemplateByWeekday: normalizeSlotTemplateByWeekday(serviceData.bookingSlotTemplateByWeekday),
        excerpt: (serviceData.excerpt ?? '').trim(),
        featured: serviceData.featured ?? false,
        metaDescription: (serviceData.metaDescription ?? '').trim(),
        metaTitle: (serviceData.metaTitle ?? '').trim(),
        price: serviceData.price ?? null,
        slug: serviceData.slug.trim(),
        status: serviceData.status,
        thumbnail: serviceData.thumbnail ?? '',
        thumbnailStorageId: serviceData.thumbnail
          ? ((serviceData as { thumbnailStorageId?: Id<'_storage'> }).thumbnailStorageId ?? null)
          : null,
        title: serviceData.title.trim(),
      };
      setSnapshotVersion((prev) => prev + 1);
      setIsDataLoaded(true);
    }
  }, [serviceData, additionalCategoryIdsData, hasMarkdownRender, hasHtmlRender, isDataLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {return;}

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
      const resolvedBookingEnabled = isBookingsModuleEnabled ? bookingEnabled : false;
      await updateService({
        categoryId: categoryId as Id<"serviceCategories">,
        additionalCategoryIds: multiCategoryEnabled
          ? additionalCategoryIds.filter((category) => category !== categoryId) as Id<"serviceCategories">[]
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
        bookingSlotTemplateDefault: resolvedBookingEnabled ? normalizedBookingSlotTemplateDefault : undefined,
        bookingSlotTemplateByWeekday: resolvedBookingEnabled ? normalizedBookingSlotTemplateByWeekday : undefined,
        excerpt: excerpt.trim() || undefined,
        featured,
        id: id as Id<"services">,
        metaDescription: enabledFields.has('metaDescription')
          ? (resolvedMetaDescriptionValue || undefined)
          : undefined,
        metaTitle: enabledFields.has('metaTitle')
          ? (resolvedMetaTitleValue || undefined)
          : undefined,
        price,
        slug: slug.trim(),
        status,
        thumbnail: thumbnail ?? '',
        thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
        title: title.trim(),
      });
      const persistedSnapshot = {
        ...currentSnapshot,
        content: normalizeRichText(content),
        renderType,
        markdownRender: markdownRender.trim(),
        htmlRender: htmlRender.trim(),
        duration: duration.trim(),
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
      setSnapshotVersion((prev) => prev + 1);
      setSaveStatus('saved');
      toast.success("Cập nhật dịch vụ thành công");
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, "Không thể cập nhật dịch vụ"));
      setSaveStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (serviceData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    );
  }

  if (serviceData === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy dịch vụ</div>;
  }

  return (
    <>
    <QuickCreateServiceCategoryModal 
      isOpen={showCategoryModal} 
      onClose={() =>{  setShowCategoryModal(false); }} 
      onCreated={(id) =>{  setCategoryId(id); }}
    />
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-500/10 rounded-lg">
          <Briefcase className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa dịch vụ</h1>
           <div className="text-sm text-slate-500 mt-1">Cập nhật thông tin dịch vụ</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                <CopyableInput value={title} onChange={handleTitleChange} required copyLabel="tiêu đề" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} className="font-mono text-sm" />
              </div>
              {enabledFields.has('excerpt') && (
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Input value={excerpt} onChange={(e) =>{  setExcerpt(e.target.value); }} />
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

                  <div className="rounded-md border border-dashed border-slate-300 dark:border-slate-700 p-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedBooking((prev) => !prev)}
                      className="w-full text-left text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Cài đặt nâng cao: khung giờ theo ngày
                    </button>

                    {showAdvancedBooking && (
                      <div className="space-y-3 mt-3">
                        <div className="space-y-2">
                          <Label>Áp dụng cho</Label>
                          <select
                            value={activeSlotScope}
                            onChange={(e) => setActiveSlotScope(e.target.value as ServiceSlotTemplateScope)}
                            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                          >
                            {SERVICE_SLOT_SCOPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const next = setServiceTemplateByScope({
                                scope: activeSlotScope,
                                nextSlots: suggestedSlots,
                                defaultSlots: bookingSlotTemplateDefault,
                                byWeekday: bookingSlotTemplateByWeekday,
                              });
                              setBookingSlotTemplateDefault(next.defaultSlots);
                              setBookingSlotTemplateByWeekday(next.byWeekday);
                            }}
                          >
                            Chọn hết gợi ý
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const next = setServiceTemplateByScope({
                                scope: activeSlotScope,
                                nextSlots: [],
                                defaultSlots: bookingSlotTemplateDefault,
                                byWeekday: bookingSlotTemplateByWeekday,
                              });
                              setBookingSlotTemplateDefault(next.defaultSlots);
                              setBookingSlotTemplateByWeekday(next.byWeekday);
                            }}
                          >
                            Bỏ hết
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {suggestedSlots.map((slot) => (
                            <label key={slot} className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={activeScopeSet.has(slot)}
                                onChange={(e) => {
                                  const nextSet = new Set(activeScopeSlots);
                                  if (e.target.checked) {
                                    nextSet.add(slot);
                                  } else {
                                    nextSet.delete(slot);
                                  }
                                  const next = setServiceTemplateByScope({
                                    scope: activeSlotScope,
                                    nextSlots: Array.from(nextSet),
                                    defaultSlots: bookingSlotTemplateDefault,
                                    byWeekday: bookingSlotTemplateByWeekday,
                                  });
                                  setBookingSlotTemplateDefault(next.defaultSlots);
                                  setBookingSlotTemplateByWeekday(next.byWeekday);
                                }}
                                className="w-4 h-4 rounded border-slate-300"
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-200">{slot}</span>
                            </label>
                          ))}
                        </div>

                        <p className="text-xs text-slate-500">Đã chọn {activeScopeSlots.length} khung.</p>
                      </div>
                    )}
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
                    {metaTitle.trim() || title || 'Tên dịch vụ'}
                  </div>
                  <div className="text-emerald-600 text-xs">
                    /{selectedCategorySlug || 'chua-phan-loai'}/{slug || 'dich-vu'}
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
        isSubmitting={isSubmitting || saveStatus === 'saving'}
        hasChanges={hasChanges}
        onCancel={() =>{  router.push('/admin/services'); }}
        submitLabel="Lưu thay đổi"
      >
        <>
          <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/services'); }}>Hủy bỏ</Button>
          <div className="flex gap-2">
            <AiEntityImportDialog kind="service" enabledFields={enabledFields} onApply={handleApplyAiService} />
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
                : 'bg-teal-600 hover:bg-teal-500'}
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
