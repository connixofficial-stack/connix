'use client';

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { BookOpen, ExternalLink, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { CategoryTagsInput } from '@/app/admin/components/AdditionalCategoriesSelect';
import { CourseFilterTagsInput } from '@/app/admin/components/CourseFilterTagsInput';
import { QuickCreateCourseCategoryModal } from '@/app/admin/components/QuickCreateCourseCategoryModal';
import { AiEntityImportDialog, type AiEntityImportPayload } from '@/app/admin/components/AiEntityImportDialog';
import { COURSE_LEVEL_OPTIONS, parseCourseLevel, type CourseLevel } from '@/lib/courses/labels';
import { stripHtml, truncateText } from '@/lib/seo';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '@/app/admin/components/ui';
import { CopyableInput } from '@/app/admin/components/CopyTextButton';
import { ImageUploader } from '@/app/admin/components/ImageUploader';
import { LexicalEditor } from '@/app/admin/components/LexicalEditor';
import { CourseCurriculumEditor } from '@/app/admin/courses/components/CourseCurriculumEditor';
import { CourseStudentsPanel } from '@/app/admin/courses/components/CourseStudentsPanel';

const MODULE_KEY = 'courses';

const generateSlug = (value: string) => value.toLowerCase()
  .normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd')
  .replaceAll(/[^a-z0-9\s]/g, '')
  .replaceAll(/\s+/g, '-');

const getEmbedUrl = (type: string, url: string) => {
  if (!url) return null;
  if (type === 'youtube') {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }
  if (type === 'drive') {
    return url.replace('/view', '/preview');
  }
  return url;
};

type CourseStatus = 'Draft' | 'Published' | 'Archived';
type PricingType = 'free' | 'paid' | 'contact';
type RenderType = 'content' | 'markdown' | 'html';
type VideoType = 'none' | 'youtube' | 'drive' | 'external';

export default function CourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const courseId = id as Id<'courses'>;

  const courseData = useQuery(api.courses.getById, { id: courseId });
  const additionalCategoryIdsData = useQuery(api.courses.getAdditionalCategoryIds, { id: courseId });
  const categoriesData = useQuery(api.courseCategories.listAll, {});
  const updateCourse = useMutation(api.courses.update);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const courseFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: MODULE_KEY, featureKey: 'enableCourseFilters' });
  const activeFilters = useQuery(api.courseFilters.listActive, {});
  const allFilterValues = useQuery(api.courseFilters.listAllValues, {});
  const assignedFilters = useQuery(api.courseFilters.listByCourse, { courseId });

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [thumbnailStorageId, setThumbnailStorageId] = useState<Id<'_storage'> | undefined | null>();
  const [status, setStatus] = useState<CourseStatus>('Draft');
  const [pricingType, setPricingType] = useState<PricingType>('free');
  const [priceAmount, setPriceAmount] = useState<number | undefined>();
  const [comparePriceAmount, setComparePriceAmount] = useState<number | undefined>();
  const [priceNote, setPriceNote] = useState('');
  const [isPriceVisible, setIsPriceVisible] = useState(true);
  const [instructorName, setInstructorName] = useState('');
  const [level, setLevel] = useState<CourseLevel | ''>('');
  const [durationText, setDurationText] = useState('');
  const [introVideoType, setIntroVideoType] = useState<VideoType>('none');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
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
  const [activeTab, setActiveTab] = useState<'general' | 'curriculum' | 'students'>('general');
  const [selectedValueIds, setSelectedValueIds] = useState<Id<'courseFilterValues'>[]>([]);

  // Curriculum dirty state (từ CourseCurriculumEditor)
  const [curriculumIsDirty, setCurriculumIsDirty] = useState(false);
  const curriculumSaveFnRef = useRef<(() => Promise<void>) | null>(null);

  const handleCurriculumDirtyChange = useCallback((isDirty: boolean) => {
    setCurriculumIsDirty(isDirty);
  }, []);

  // Ref & State for Dirty State (Phát hiện thay đổi)
  const initialSnapshotRef = useRef<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    categoryId: string;
    additionalCategoryIds: string[];
    thumbnail: string | undefined;
    thumbnailStorageId: Id<'_storage'> | undefined | null;
    status: CourseStatus;
    pricingType: PricingType;
    priceAmount: number | undefined;
    comparePriceAmount: number | undefined;
    priceNote: string;
    isPriceVisible: boolean;
    instructorName: string;
    level: CourseLevel | '';
    durationText: string;
    introVideoType: VideoType;
    introVideoUrl: string;
    featured: boolean;
    renderType: RenderType;
    markdownRender: string;
    htmlRender: string;
    metaTitle: string;
    metaDescription: string;
    valueIds: string[];
  } | null>(null);

  const [snapshotVersion, setSnapshotVersion] = useState(0);

  const currentSnapshot = useMemo(() => {
    return {
      title: title.trim(),
      slug: slug.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      categoryId: categoryId || '',
      additionalCategoryIds: [...additionalCategoryIds].sort(),
      thumbnail: thumbnail || '',
      thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
      status,
      pricingType,
      priceAmount,
      comparePriceAmount,
      priceNote: priceNote.trim(),
      isPriceVisible,
      instructorName: instructorName.trim(),
      level: level || '',
      durationText: durationText.trim(),
      introVideoType,
      introVideoUrl: introVideoUrl.trim(),
      featured,
      renderType,
      markdownRender: markdownRender.trim(),
      htmlRender: htmlRender.trim(),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      valueIds: [...selectedValueIds].sort(),
    };
  }, [
    title,
    slug,
    content,
    excerpt,
    categoryId,
    additionalCategoryIds,
    thumbnail,
    thumbnailStorageId,
    status,
    pricingType,
    priceAmount,
    comparePriceAmount,
    priceNote,
    isPriceVisible,
    instructorName,
    level,
    durationText,
    introVideoType,
    introVideoUrl,
    featured,
    renderType,
    markdownRender,
    htmlRender,
    metaTitle,
    metaDescription,
    selectedValueIds,
  ]);

  const generalHasChanges = useMemo(() => {
    if (!initialSnapshotRef.current) {return false;}
    return JSON.stringify(initialSnapshotRef.current) !== JSON.stringify(currentSnapshot);
  }, [currentSnapshot, snapshotVersion]);

  const hasChanges = generalHasChanges || curriculumIsDirty;

  const enabledFields = useMemo(() => new Set(fieldsData?.map((field) => field.fieldKey) ?? []), [fieldsData]);
  const multiCategoryEnabled = Boolean(settingsData?.find((setting) => setting.settingKey === 'enableMultipleCategories')?.value);
  const selectedCategorySlug = categoriesData?.find((category) => category._id === categoryId)?.slug;
  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRender = hasMarkdownRender || hasHtmlRender;



  useEffect(() => {
    if (!courseData || additionalCategoryIdsData === undefined || assignedFilters === undefined || initialized) {return;}
    setTitle(courseData.title);
    setSlug(courseData.slug);
    setContent(courseData.content);
    setExcerpt(courseData.excerpt ?? '');
    setCategoryId(courseData.categoryId);
    const loadedAddCategoryIds = additionalCategoryIdsData ?? [];
    setAdditionalCategoryIds(loadedAddCategoryIds);
    setThumbnail(courseData.thumbnail);
    setThumbnailStorageId(courseData.thumbnailStorageId);
    setStatus(courseData.status);
    setPricingType(courseData.pricingType);
    setPriceAmount(courseData.priceAmount);
    setComparePriceAmount(courseData.comparePriceAmount);
    setPriceNote(courseData.priceNote ?? '');
    setIsPriceVisible(courseData.isPriceVisible ?? true);
    setInstructorName(courseData.instructorName ?? '');
    setLevel(courseData.level ?? '');
    setDurationText(courseData.durationText ?? '');
    setIntroVideoType(courseData.introVideoType ?? 'none');
    setIntroVideoUrl(courseData.introVideoUrl ?? '');
    setFeatured(courseData.featured ?? false);
    setRenderType(courseData.renderType ?? 'content');
    setMarkdownRender(courseData.markdownRender ?? '');
    setHtmlRender(courseData.htmlRender ?? '');
    setMetaTitle(courseData.metaTitle ?? '');
    setMetaDescription(courseData.metaDescription ?? '');

    const valIds = assignedFilters.map((f) => f._id);
    setSelectedValueIds(valIds);

    initialSnapshotRef.current = {
      title: courseData.title.trim(),
      slug: courseData.slug.trim(),
      content: courseData.content.trim(),
      excerpt: (courseData.excerpt ?? '').trim(),
      categoryId: courseData.categoryId,
      additionalCategoryIds: [...loadedAddCategoryIds].sort(),
      thumbnail: courseData.thumbnail || '',
      thumbnailStorageId: courseData.thumbnail ? (courseData.thumbnailStorageId ?? null) : null,
      status: courseData.status,
      pricingType: courseData.pricingType,
      priceAmount: courseData.priceAmount,
      comparePriceAmount: courseData.comparePriceAmount,
      priceNote: (courseData.priceNote ?? '').trim(),
      isPriceVisible: courseData.isPriceVisible ?? true,
      instructorName: (courseData.instructorName ?? '').trim(),
      level: courseData.level ?? '',
      durationText: (courseData.durationText ?? '').trim(),
      introVideoType: courseData.introVideoType ?? 'none',
      introVideoUrl: (courseData.introVideoUrl ?? '').trim(),
      featured: courseData.featured ?? false,
      renderType: courseData.renderType ?? 'content',
      markdownRender: (courseData.markdownRender ?? '').trim(),
      htmlRender: (courseData.htmlRender ?? '').trim(),
      metaTitle: (courseData.metaTitle ?? '').trim(),
      metaDescription: (courseData.metaDescription ?? '').trim(),
      valueIds: [...valIds].sort(),
    };

    setEditorResetKey((prev) => prev + 1);
    setInitialized(true);
    setSnapshotVersion((prev) => prev + 1);
  }, [courseData, additionalCategoryIdsData, assignedFilters, initialized]);



  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const handleApplyAiCourse = (item: AiEntityImportPayload) => {
    const nextTitle = item.title?.trim() || item.name?.trim() || '';
    if (!nextTitle) {return;}

    const nextContent = item.content || item.description || item.htmlRender || item.markdownRender || '';
    const nextPrice = typeof item.price === 'number' ? item.price : undefined;
    const nextComparePrice = typeof item.comparePriceAmount === 'number'
      ? item.comparePriceAmount
      : item.salePrice;
    const nextPricingType: PricingType = item.pricingType === 'free' || item.pricingType === 'paid' || item.pricingType === 'contact'
      ? item.pricingType
      : (typeof nextPrice === 'number' ? 'paid' : pricingType);
    const nextLevel = parseCourseLevel(item.level);
    const nextIntroVideoType: VideoType = item.introVideoType === 'youtube' || item.introVideoType === 'drive' || item.introVideoType === 'external' || item.introVideoType === 'none'
      ? item.introVideoType
      : introVideoType;

    setTitle(nextTitle);
    setSlug(item.slug?.trim() || generateSlug(nextTitle));
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
    if (item.thumbnail || item.image) {
      setThumbnail(item.thumbnail || item.image);
      setThumbnailStorageId(undefined);
    }
    setPricingType(nextPricingType);
    if (typeof nextPrice === 'number') {setPriceAmount(nextPrice);}
    if (typeof nextComparePrice === 'number') {setComparePriceAmount(nextComparePrice);}
    if (item.priceNote) {setPriceNote(item.priceNote);}
    if (typeof item.isPriceVisible === 'boolean') {setIsPriceVisible(item.isPriceVisible);}
    if (item.instructorName) {setInstructorName(item.instructorName);}
    if (nextLevel) {setLevel(nextLevel);}
    if (item.durationText || item.duration) {setDurationText(item.durationText || item.duration || '');}
    setIntroVideoType(nextIntroVideoType);
    if (item.introVideoUrl) {setIntroVideoUrl(item.introVideoUrl);}
    if (typeof item.featured === 'boolean') {setFeatured(item.featured);}
    setEditorResetKey((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) {return;}

    setIsSubmitting(true);
    try {
      // Lưu thông tin chung nếu có thay đổi
      if (generalHasChanges) {
        const resolvedMetaTitle = truncateText(title.trim(), 60);
        const resolvedMetaDescription = truncateText(stripHtml(excerpt || content || ''), 160);
        await updateCourse({
          additionalCategoryIds: multiCategoryEnabled
            ? additionalCategoryIds.filter((item) => item !== categoryId) as Id<'courseCategories'>[]
            : undefined,
          categoryId: categoryId as Id<'courseCategories'>,
          comparePriceAmount: pricingType === 'paid' ? comparePriceAmount : undefined,
          content,
          durationText: durationText.trim() || undefined,
          excerpt: excerpt.trim() || undefined,
          featured,
          htmlRender: hasHtmlRender ? (htmlRender.trim() || undefined) : undefined,
          id: courseId,
          instructorName: instructorName.trim() || undefined,
          introVideoType,
          introVideoUrl: introVideoType !== 'none' ? (introVideoUrl.trim() || undefined) : undefined,
          isPriceVisible,
          level: level || undefined,
          markdownRender: hasMarkdownRender ? (markdownRender.trim() || undefined) : undefined,
          metaDescription: enabledFields.has('metaDescription') ? (metaDescription.trim() || resolvedMetaDescription || undefined) : undefined,
          metaTitle: enabledFields.has('metaTitle') ? (metaTitle.trim() || resolvedMetaTitle || undefined) : undefined,
          priceAmount: pricingType === 'paid' ? priceAmount : undefined,
          priceNote: priceNote.trim() || undefined,
          pricingType,
          renderType,
          slug: slug.trim() || generateSlug(title),
          status,
          thumbnail: thumbnail ?? '',
          thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
          title: title.trim(),
          valueIds: selectedValueIds,
        });

        // Reset snapshot sau khi lưu thành công
        initialSnapshotRef.current = {
          title: title.trim(),
          slug: slug.trim(),
          content: content.trim(),
          excerpt: excerpt.trim(),
          categoryId: categoryId || '',
          additionalCategoryIds: [...additionalCategoryIds].sort(),
          thumbnail: thumbnail || '',
          thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
          status,
          pricingType,
          priceAmount,
          comparePriceAmount,
          priceNote: priceNote.trim(),
          isPriceVisible,
          instructorName: instructorName.trim(),
          level: level || '',
          durationText: durationText.trim(),
          introVideoType,
          introVideoUrl: introVideoUrl.trim(),
          featured,
          renderType,
          markdownRender: markdownRender.trim(),
          htmlRender: htmlRender.trim(),
          metaTitle: metaTitle.trim(),
          metaDescription: metaDescription.trim(),
          valueIds: [...selectedValueIds].sort(),
        };
        setSnapshotVersion((prev) => prev + 1);
      }

      // Lưu lộ trình học nếu có thay đổi
      if (curriculumIsDirty && curriculumSaveFnRef.current) {
        await curriculumSaveFnRef.current();
      }

      if (generalHasChanges || curriculumIsDirty) {
        toast.success('Đã lưu thay đổi');
      }
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể lưu thay đổi'));
    } finally {
      setIsSubmitting(false);
    }
  };



  if (courseData === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (courseData === null) {
    return <div className="py-8 text-center text-slate-500">Không tìm thấy khóa học</div>;
  }

  return (
    <>
      <QuickCreateCourseCategoryModal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); }}
        onCreated={(createdId) => { setCategoryId(createdId); }}
      />
      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa khóa học</h1>
            <p className="mt-1 text-sm text-slate-500">Cập nhật nội dung, giá và lộ trình học.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors duration-200 focus:outline-none",
              activeTab === 'general'
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            )}
          >
            Thông tin chung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors duration-200 focus:outline-none",
              activeTab === 'curriculum'
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            )}
          >
            Lộ trình học
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors duration-200 focus:outline-none",
              activeTab === 'students'
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            )}
          >
            Học viên
          </button>
        </div>

        {/* Tab General */}
        <div className={activeTab === 'general' ? '' : 'hidden'}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                    <CopyableInput value={title} onChange={handleTitleChange} required copyLabel="tiêu đề" />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={slug} onChange={(e) => { setSlug(e.target.value); }} className="font-mono text-sm" />
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
                      <Label>Kiểu nội dung</Label>
                      <select value={renderType} onChange={(e) => { setRenderType(e.target.value as RenderType); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                        <option value="content">Nội dung thường</option>
                        {hasMarkdownRender && <option value="markdown">Markdown</option>}
                        {hasHtmlRender && <option value="html">HTML</option>}
                      </select>
                    </div>
                    {hasMarkdownRender && (
                      <div className="space-y-2">
                        <Label>Nội dung Markdown</Label>
                        <textarea value={markdownRender} onChange={(e) => { setMarkdownRender(e.target.value); }} className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800" />
                      </div>
                    )}
                    {hasHtmlRender && (
                      <div className="space-y-2">
                        <Label>Nội dung HTML</Label>
                        <textarea value={htmlRender} onChange={(e) => { setHtmlRender(e.target.value); }} className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-base">Giá khóa học</CardTitle></CardHeader>
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
                        <Label>Giá bán (VND)</Label>
                        <Input type="number" value={priceAmount ?? ''} onChange={(e) => { setPriceAmount(e.target.value ? Number(e.target.value) : undefined); }} />
                      </div>
                      <div className="space-y-2">
                        <Label>Giá gốc (VND)</Label>
                        <Input type="number" value={comparePriceAmount ?? ''} onChange={(e) => { setComparePriceAmount(e.target.value ? Number(e.target.value) : undefined); }} />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Ghi chú giá</Label>
                    <Input value={priceNote} onChange={(e) => { setPriceNote(e.target.value); }} />
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isPriceVisible} onChange={(e) => { setIsPriceVisible(e.target.checked); }} className="h-4 w-4 rounded border-slate-300" />
                    <span className="text-sm">Hiển thị giá</span>
                  </label>
                </CardContent>
              </Card>

              {(enabledFields.has('metaTitle') || enabledFields.has('metaDescription')) && (
                <Card>
                  <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {enabledFields.has('metaTitle') && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Tiêu đề SEO</Label>
                          <span className={`text-xs ${metaTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>{metaTitle.length}/60</span>
                        </div>
                        <Input value={metaTitle} onChange={(e) => { setMetaTitle(e.target.value); }} />
                      </div>
                    )}
                    {enabledFields.has('metaDescription') && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Mô tả SEO</Label>
                          <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>{metaDescription.length}/160</span>
                        </div>
                        <textarea value={metaDescription} onChange={(e) => { setMetaDescription(e.target.value); }} className="min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
                      </div>
                    )}
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <div className="truncate font-medium text-blue-600">{metaTitle.trim() || title || 'Tên khóa học'}</div>
                      <div className="text-xs text-emerald-600">/{selectedCategorySlug || 'khoa-hoc'}/{slug || 'khoa-hoc'}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-600">{metaDescription.trim() || excerpt || 'Mô tả ngắn sẽ hiển thị tại đây.'}</div>
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
                    <select value={status} onChange={(e) => { setStatus(e.target.value as CourseStatus); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
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
                          onQuickCreate={() => { setShowCategoryModal(true); }}
                          onChange={(ids) => {
                            setCategoryId(ids[0] ?? '');
                            setAdditionalCategoryIds(ids.slice(1));
                          }}
                        />
                        <p className="text-xs text-slate-500">Thẻ đầu tiên là danh mục chính.</p>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); }} className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                          {categoriesData?.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                        </select>
                        <Button type="button" variant="outline" size="icon" onClick={() => { setShowCategoryModal(true); }} title="Tạo danh mục mới">
                          <Plus size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                  {enabledFields.has('featured') && (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={featured} onChange={(e) => { setFeatured(e.target.checked); }} className="h-4 w-4 rounded border-slate-300" />
                      <span className="text-sm">Khóa học nổi bật</span>
                    </label>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Thông tin khóa học</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {enabledFields.has('instructorName') && (
                    <div className="space-y-2">
                      <Label>Giảng viên</Label>
                      <Input value={instructorName} onChange={(e) => { setInstructorName(e.target.value); }} />
                    </div>
                  )}
                  {enabledFields.has('level') && (
                    <div className="space-y-2">
                      <Label>Trình độ</Label>
                      <select value={level} onChange={(e) => { setLevel(e.target.value as CourseLevel | ''); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                        <option value="">Chọn trình độ</option>
                        {COURSE_LEVEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Thời lượng hiển thị</Label>
                    <Input value={durationText} onChange={(e) => { setDurationText(e.target.value); }} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Video giới thiệu</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Loại video</Label>
                    <select value={introVideoType} onChange={(e) => { setIntroVideoType(e.target.value as VideoType); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                      <option value="none">Không có</option>
                      <option value="youtube">YouTube</option>
                      <option value="drive">Google Drive</option>
                      <option value="external">Link ngoài</option>
                    </select>
                  </div>
                  {introVideoType !== 'none' && (
                    <div className="space-y-2">
                      <Label>URL video</Label>
                      <Input value={introVideoUrl} onChange={(e) => { setIntroVideoUrl(e.target.value); }} />
                      {getEmbedUrl(introVideoType, introVideoUrl) && (
                        <div className="mt-2 aspect-video w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                          <iframe
                            src={getEmbedUrl(introVideoType, introVideoUrl)!}
                            className="h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {courseFiltersFeature?.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Phần mềm liên quan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CourseFilterTagsInput
                      activeFilters={activeFilters}
                      allFilterValues={allFilterValues}
                      value={selectedValueIds}
                      onChange={setSelectedValueIds}
                      placeholder="Tìm và chọn phần mềm..."
                    />
                  </CardContent>
                </Card>
              )}

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
                    folder="courses"
                    naming={{ entityName: slug.trim() || 'course', style: 'slug-index', index: 1 }}
                    deleteMode="defer"
                    aspectRatio="video"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tab Curriculum — always mounted, hidden when not active */}
        <div className={activeTab === 'curriculum' ? '' : 'hidden'}>
          <CourseCurriculumEditor
            courseId={courseId}
            onDirtyChange={handleCurriculumDirtyChange}
            onSaveRef={curriculumSaveFnRef}
          />
        </div>

        {/* Tab Students */}
        <div className={activeTab === 'students' ? '' : 'hidden'}>
          <CourseStudentsPanel courseId={courseId} />
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          submitLabel="Lưu thay đổi"
          onCancel={() => { router.push('/admin/courses'); }}
          submitClassName="bg-indigo-600 hover:bg-indigo-500"
        >
          <>
            <Button type="button" variant="ghost" onClick={() => { router.push('/admin/courses'); }} disabled={isSubmitting}>Hủy bỏ</Button>
            <div className="flex flex-wrap justify-end gap-2">
              <AiEntityImportDialog kind="course" enabledFields={enabledFields} onApply={handleApplyAiCourse} />
              <Button
                type="button"
                variant="outline"
                onClick={() => { window.open(`/${selectedCategorySlug || 'khoa-hoc'}/${slug}`, '_blank'); }}
                disabled={!slug.trim()}
                className="gap-2"
              >
                <ExternalLink size={16} />
                Xem trên web
              </Button>
              <Button
                type="submit"
                variant="accent"
                disabled={isSubmitting || !title.trim() || !categoryId || !hasChanges}
                className={cn(
                  !hasChanges && !isSubmitting
                    ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (!hasChanges ? 'Đã lưu' : (
                  curriculumIsDirty && !generalHasChanges ? 'Lưu lộ trình' : 'Lưu thay đổi'
                ))}
              </Button>
            </div>
          </>
        </HomeComponentStickyFooter>
      </form>
    </>
  );
}
