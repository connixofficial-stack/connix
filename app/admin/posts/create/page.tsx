'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { LexicalEditor } from '../../components/LexicalEditor';
import { ImageUploader } from '../../components/ImageUploader';
import { QuickCreateCategoryModal } from '../../components/QuickCreateCategoryModal';
import { stripHtml, truncateText } from '@/lib/seo';
import { getMacroTemplate, getTemplateFieldSpec, type GeneratorFieldKey } from '@/lib/posts/generator/macro-templates';
import type { GeneratorRequest, GeneratedArticlePayload } from '@/lib/posts/generator/types';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { AiEntityImportDialog, type AiEntityImportPayload } from '@/app/admin/components/AiEntityImportDialog';
import { CategoryTagsInput } from '@/app/admin/components/AdditionalCategoriesSelect';

const MODULE_KEY = 'posts';
const COC_TARGET_OPTIONS: Array<{ key: GeneratorRequest['templateKey']; label: string; description: string }> = [
  { key: 'top_use_case', label: 'Theo nhu cầu', description: 'Gợi ý top sản phẩm theo mục tiêu sử dụng.' },
  { key: 'compare_two', label: 'So sánh 2 sản phẩm', description: 'So sánh A/B để ra quyết định nhanh.' },
  { key: 'top_under_budget', label: 'Theo ngân sách', description: 'Top sản phẩm trong một mức ngân sách.' },
  { key: 'top_between_budget', label: 'Theo khoảng giá', description: 'Top sản phẩm trong khoảng ngân sách.' },
  { key: 'top_best_sellers', label: 'Top bán chạy', description: 'Danh sách sản phẩm bán chạy, dễ chọn.' },
];

const toTimestamp = (value: string) => {
  if (!value) {return undefined;}
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function PostCreatePage() {
  const router = useRouter();
  const categoriesData = useQuery(api.postCategories.listAll, {});
  const productCategoriesData = useQuery(api.productCategories.listActive);
  const productsData = useQuery(api.products.listAll, { limit: 100 });
  const createPost = useMutation(api.posts.create);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });

  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const schedulingFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableScheduling', moduleKey: MODULE_KEY });

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
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [publishAtLocal, setPublishAtLocal] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(0);

  const [generatorTemplateKey, setGeneratorTemplateKey] = useState(COC_TARGET_OPTIONS[0].key);
  const generatorProductLimit = 6;
  const [generatorBudgetMin, setGeneratorBudgetMin] = useState('');
  const [generatorBudgetMax, setGeneratorBudgetMax] = useState('');
  const [generatorKeyword, setGeneratorKeyword] = useState('');
  const [generatorCompareProductAId, setGeneratorCompareProductAId] = useState<Id<'products'> | ''>('');
  const [generatorCompareProductBId, setGeneratorCompareProductBId] = useState<Id<'products'> | ''>('');
  const [generatorSelectedProductIds, setGeneratorSelectedProductIds] = useState<Array<Id<'products'> | ''>>([]);
  const [generatorProductCategoryId, setGeneratorProductCategoryId] = useState<Id<'productCategories'> | ''>('');
  const [generatorRequest, setGeneratorRequest] = useState<GeneratorRequest | null>(null);
  const [galleryModal, setGalleryModal] = useState<{ images: string[]; index: number } | null>(null);

  // Sync default status from settings
  useEffect(() => {
    if (settingsData) {
      const defaultStatus = settingsData.find(s => s.settingKey === 'defaultStatus')?.value as string;
      if (defaultStatus === 'published') {
        setStatus('Published');
      }
    }
  }, [settingsData]);

  useEffect(() => {
    if (status !== 'Published') {
      setPublishImmediately(true);
      setPublishAtLocal('');
    }
  }, [status]);

  // Check which fields are enabled
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
  const schedulingEnabled = enabledFields.has('publish_date') && (schedulingFeature?.enabled ?? false);

  const generatorEnabled = Boolean(settingsData?.find(s => s.settingKey === 'enableAutoPostGenerator')?.value);
  const multiCategoryEnabled = Boolean(settingsData?.find(s => s.settingKey === 'enableMultipleCategories')?.value);
  const cocTarget = useMemo(
    () => COC_TARGET_OPTIONS.find((option) => option.key === generatorTemplateKey),
    [generatorTemplateKey],
  );
  const generatorTemplate = useMemo(() => getMacroTemplate(generatorTemplateKey), [generatorTemplateKey]);
  const templateFieldSpec = useMemo(() => getTemplateFieldSpec(generatorTemplateKey), [generatorTemplateKey]);
  const requiredFieldSet = useMemo(() => new Set<GeneratorFieldKey>(templateFieldSpec.required), [templateFieldSpec]);
  const isFieldActive = (fieldKey: GeneratorFieldKey) => requiredFieldSet.has(fieldKey);
  const requiresSelectedProducts = requiredFieldSet.has('selectedProducts');

  const activeProducts = useMemo(
    () => (productsData ?? []).filter((product) => product.status === 'Active'),
    [productsData],
  );
  const selectedProductIdSet = useMemo(
    () => new Set(generatorSelectedProductIds.filter(Boolean)),
    [generatorSelectedProductIds],
  );
  const productSlugMap = useMemo(() => {
    const map = new Map<string, string>();
    activeProducts.forEach((product) => map.set(product._id, product.slug));
    return map;
  }, [activeProducts]);

  useEffect(() => {
    const activeFields = new Set<GeneratorFieldKey>(templateFieldSpec.required);
    if (!activeFields.has('keyword')) {
      setGeneratorKeyword('');
    }
    if (!activeFields.has('budgetMin')) {
      setGeneratorBudgetMin('');
    }
    if (!activeFields.has('budgetMax')) {
      setGeneratorBudgetMax('');
    }
    if (!activeFields.has('categoryId')) {
      setGeneratorProductCategoryId('');
    }
    if (!activeFields.has('compareProducts')) {
      setGeneratorCompareProductAId('');
      setGeneratorCompareProductBId('');
    }
    if (!activeFields.has('selectedProducts')) {
      setGeneratorSelectedProductIds([]);
    }
  }, [templateFieldSpec]);

  useEffect(() => {
    if (!generatorCompareProductAId || !generatorCompareProductBId) {return;}
    if (generatorCompareProductAId === generatorCompareProductBId) {
      setGeneratorCompareProductBId('');
      toast.error('Hai sản phẩm so sánh không được trùng nhau');
    }
  }, [generatorCompareProductAId, generatorCompareProductBId]);

  useEffect(() => {
    if (!requiresSelectedProducts) {return;}
    setGeneratorSelectedProductIds((prev) => {
      const next = [...prev];
      if (next.length > generatorProductLimit) {
        return next.slice(0, generatorProductLimit);
      }
      if (next.length < generatorProductLimit) {
        return [...next, ...Array(generatorProductLimit - next.length).fill('')];
      }
      return next;
    });
  }, [generatorProductLimit, requiresSelectedProducts]);

  const generatorPreview = useQuery(
    api.posts.generateFromProductsPreview,
    generatorRequest ? { request: generatorRequest } : 'skip'
  ) as GeneratedArticlePayload | undefined;

  const isPreviewLoading = generatorRequest !== null && generatorPreview === undefined;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(generateSlugFromTitle(val));
  };

  const generateSlugFromTitle = (value: string) => {
    return value.toLowerCase()
      .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
      .replaceAll(/[đĐ]/g, "d")
      .replaceAll(/[^a-z0-9\s]/g, '')
      .replaceAll(/\s+/g, '-');
  };

  const handleGeneratePreview = () => {
    if (isFieldActive('keyword') && !generatorKeyword.trim()) {
      toast.error('Vui lòng nhập nhu cầu/keyword');
      return;
    }
    if (isFieldActive('budgetMin') && !generatorBudgetMin) {
      toast.error('Vui lòng nhập ngân sách tối thiểu');
      return;
    }
    if (isFieldActive('budgetMax') && !generatorBudgetMax) {
      toast.error('Vui lòng nhập ngân sách tối đa');
      return;
    }
    if (isFieldActive('categoryId') && !generatorProductCategoryId) {
      toast.error('Vui lòng chọn danh mục sản phẩm');
      return;
    }
    if (isFieldActive('compareProducts')) {
      if (!generatorCompareProductAId || !generatorCompareProductBId) {
        toast.error('Vui lòng chọn đủ 2 sản phẩm để so sánh');
        return;
      }
      if (generatorCompareProductAId === generatorCompareProductBId) {
        toast.error('Hai sản phẩm so sánh không được trùng nhau');
        return;
      }
    }
    if (isFieldActive('selectedProducts')) {
      const selectedIds = generatorSelectedProductIds.filter(Boolean) as Id<'products'>[];
      if (selectedIds.length !== generatorProductLimit) {
        toast.error('Vui lòng chọn đủ số lượng sản phẩm');
        return;
      }
      if (new Set(selectedIds).size !== selectedIds.length) {
        toast.error('Danh sách sản phẩm không được trùng nhau');
        return;
      }
    }
    const budgetMin = generatorBudgetMin ? Number(generatorBudgetMin) : undefined;
    const budgetMax = generatorBudgetMax ? Number(generatorBudgetMax) : undefined;
    if (Number.isFinite(budgetMin) && Number.isFinite(budgetMax) && (budgetMin as number) >= (budgetMax as number)) {
      toast.error('Ngân sách tối thiểu phải nhỏ hơn ngân sách tối đa');
      return;
    }
    const compareSlugs = isFieldActive('compareProducts')
      ? [generatorCompareProductAId, generatorCompareProductBId]
        .map((id) => (id ? productSlugMap.get(id) : undefined))
        .filter((slug): slug is string => Boolean(slug))
      : undefined;
    const selectedProductSlugs = isFieldActive('selectedProducts')
      ? generatorSelectedProductIds
        .map((id) => (id ? productSlugMap.get(id) : undefined))
        .filter((slug): slug is string => Boolean(slug))
      : undefined;
    if (isFieldActive('compareProducts') && (!compareSlugs || compareSlugs.length < 2)) {
      toast.error('Không tìm thấy slug sản phẩm để so sánh');
      return;
    }
    if (isFieldActive('selectedProducts') && (!selectedProductSlugs || selectedProductSlugs.length !== generatorProductLimit)) {
      toast.error('Không tìm thấy đủ sản phẩm đã chọn');
      return;
    }
    const nextRequest: GeneratorRequest = {
      templateKey: generatorTemplateKey,
      seed: `${Date.now()}`,
    };
    if (isFieldActive('productLimit')) {
      nextRequest.productLimit = generatorProductLimit;
    }
    if (isFieldActive('budgetMin')) {
      nextRequest.budgetMin = Number.isFinite(budgetMin) ? budgetMin : undefined;
    }
    if (isFieldActive('budgetMax')) {
      nextRequest.budgetMax = Number.isFinite(budgetMax) ? budgetMax : undefined;
    }
    if (isFieldActive('keyword')) {
      nextRequest.keyword = generatorKeyword.trim() || undefined;
      nextRequest.useCase = generatorKeyword.trim() || undefined;
    }
    if (isFieldActive('categoryId')) {
      nextRequest.categoryId = generatorProductCategoryId || undefined;
    }
    if (isFieldActive('compareProducts')) {
      nextRequest.compareSlugs = compareSlugs;
    }
    if (isFieldActive('selectedProducts')) {
      nextRequest.selectedProductSlugs = selectedProductSlugs;
    }
    nextRequest.tone = 'helpful';
    setGeneratorRequest(nextRequest);
  };

  const handleRegenerate = () => {
    if (!generatorRequest) {return;}
    setGeneratorRequest({
      ...generatorRequest,
      seed: `${Date.now()}-${Math.round(Math.random() * 1000)}`,
    });
  };

  const handlePreviewClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) {return;}
    const trigger = target.closest<HTMLElement>('[data-gallery-open]');
    if (!trigger) {return;}
    const container = trigger.closest<HTMLElement>('[data-gallery]');
    const payload = container?.getAttribute('data-gallery');
    if (!payload) {return;}
    try {
      const images = JSON.parse(payload) as string[];
      if (!Array.isArray(images) || images.length === 0) {return;}
      const rawIndex = Number(trigger.getAttribute('data-gallery-open') ?? 0);
      const index = Number.isFinite(rawIndex) ? Math.max(0, Math.min(images.length - 1, rawIndex)) : 0;
      setGalleryModal({ images, index });
    } catch {
      return;
    }
  };

  const handleCloseGallery = () => {
    setGalleryModal(null);
  };

  const handlePrevGallery = () => {
    setGalleryModal((prev) => {
      if (!prev || prev.images.length === 0) {return prev;}
      const nextIndex = (prev.index - 1 + prev.images.length) % prev.images.length;
      return { ...prev, index: nextIndex };
    });
  };

  const handleNextGallery = () => {
    setGalleryModal((prev) => {
      if (!prev || prev.images.length === 0) {return prev;}
      const nextIndex = (prev.index + 1) % prev.images.length;
      return { ...prev, index: nextIndex };
    });
  };

  useEffect(() => {
    if (!galleryModal) {return;}
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseGallery();
      }
      if (event.key === 'ArrowLeft') {
        handlePrevGallery();
      }
      if (event.key === 'ArrowRight') {
        handleNextGallery();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [galleryModal]);

  const handleApplyGenerated = () => {
    if (!generatorPreview) {return;}
    setTitle(generatorPreview.title);
    setSlug(generateSlugFromTitle(generatorPreview.title));
    setExcerpt(generatorPreview.excerpt);
    setContent('');
    setRenderType('html');
    setMarkdownRender('');
    setHtmlRender(generatorPreview.contentHtml);
    setMetaTitle(generatorPreview.metaTitle);
    setMetaDescription(generatorPreview.metaDescription);
    setThumbnail(generatorPreview.thumbnail);
    setThumbnailStorageId(undefined);
    setEditorResetKey((prev) => prev + 1);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) {return;}
    if (status === 'Published' && schedulingEnabled && !publishImmediately && !publishAtLocal) {
      toast.error('Vui lòng chọn thời gian xuất bản.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedMetaTitle = truncateText(title.trim(), 60);
      const resolvedMetaDescription = truncateText(stripHtml(excerpt || content || ''), 160);
      const resolvedPublishedAt = status === 'Published' && !publishImmediately
        ? toTimestamp(publishAtLocal)
        : undefined;
      await createPost({
        authorName: enabledFields.has('author_name') ? authorName.trim() || undefined : undefined,
        categoryId: categoryId as Id<"postCategories">,
        additionalCategoryIds: multiCategoryEnabled
          ? additionalCategoryIds.filter((id) => id !== categoryId) as Id<"postCategories">[]
          : undefined,
        content,
        renderType,
        markdownRender: markdownRender.trim() || undefined,
        htmlRender: htmlRender.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        metaDescription: enabledFields.has('metaDescription')
          ? (metaDescription.trim() || resolvedMetaDescription || undefined)
          : undefined,
        metaTitle: enabledFields.has('metaTitle')
          ? (metaTitle.trim() || resolvedMetaTitle || undefined)
          : undefined,
        slug: slug.trim() || title.toLowerCase().replaceAll(/\s+/g, '-'),
        publishImmediately: status === 'Published' ? publishImmediately : undefined,
        publishedAt: status === 'Published' ? resolvedPublishedAt : undefined,
        status,
        thumbnail,
        thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
        title: title.trim(),
      });
      toast.success("Tạo bài viết mới thành công");
      router.push('/admin/posts');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, "Không thể tạo bài viết"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <QuickCreateCategoryModal 
      isOpen={showCategoryModal} 
      onClose={() =>{  setShowCategoryModal(false); }} 
      onCreated={(id) =>{  setCategoryId(id); }}
    />
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm bài viết mới</h1>
          <div className="text-sm text-slate-500 mt-1">Tạo nội dung mới cho website</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {generatorEnabled && (
            <Card>
              <CardHeader><CardTitle className="text-base">Sinh tự động</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Mục tiêu bài</Label>
                    <select
                      value={generatorTemplateKey}
                      onChange={(e) =>{  setGeneratorTemplateKey(e.target.value as GeneratorRequest['templateKey']); }}
                      className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      {COC_TARGET_OPTIONS.map((template) => (
                        <option key={template.key} value={template.key}>{template.label}</option>
                      ))}
                    </select>
                    <div className="text-xs text-slate-500">{cocTarget?.description ?? generatorTemplate.description}</div>
                  </div>
                  {requiredFieldSet.has('selectedProducts') && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Chọn {generatorProductLimit} sản phẩm</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {generatorSelectedProductIds.map((selectedId, index) => (
                          <div key={`selected-product-${index}`} className="space-y-2">
                            <Label className="text-xs text-slate-500">Sản phẩm {index + 1}</Label>
                            <select
                              value={selectedId}
                              onChange={(e) => {
                                const nextId = e.target.value as Id<'products'> | '';
                                setGeneratorSelectedProductIds((prev) => {
                                  const next = [...prev];
                                  next[index] = nextId;
                                  return next;
                                });
                              }}
                              className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                            >
                              <option value="">-- Chọn sản phẩm --</option>
                              {activeProducts
                                .filter((product) => product._id === selectedId || !selectedProductIdSet.has(product._id))
                                .map((product) => (
                                  <option key={product._id} value={product._id}>{product.name}</option>
                                ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {requiredFieldSet.has('keyword') && (
                    <div className="space-y-2">
                      <Label>Nhu cầu / Keyword</Label>
                      <Input
                        value={generatorKeyword}
                        onChange={(e) =>{  setGeneratorKeyword(e.target.value); }}
                        placeholder="VD: chăm sóc tóc, gaming, tiết kiệm"
                      />
                    </div>
                  )}
                  {requiredFieldSet.has('categoryId') && (
                    <div className="space-y-2">
                      <Label>Danh mục sản phẩm</Label>
                      <select
                        value={generatorProductCategoryId}
                        onChange={(e) =>{  setGeneratorProductCategoryId(e.target.value as Id<'productCategories'>); }}
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {productCategoriesData?.map((category) => (
                          <option key={category._id} value={category._id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {requiredFieldSet.has('compareProducts') && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>So sánh 2 sản phẩm</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">Sản phẩm A</Label>
                          <select
                            value={generatorCompareProductAId}
                            onChange={(e) =>{  setGeneratorCompareProductAId(e.target.value as Id<'products'>); }}
                            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {activeProducts.map((product) => (
                              <option key={product._id} value={product._id}>{product.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">Sản phẩm B</Label>
                          <select
                            value={generatorCompareProductBId}
                            onChange={(e) =>{  setGeneratorCompareProductBId(e.target.value as Id<'products'>); }}
                            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {activeProducts
                              .filter((product) => product._id !== generatorCompareProductAId)
                              .map((product) => (
                                <option key={product._id} value={product._id}>{product.name}</option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                  {requiredFieldSet.has('budgetMin') && (
                    <div className="space-y-2">
                      <Label>Ngân sách từ</Label>
                      <Input
                        type="number"
                        value={generatorBudgetMin}
                        onChange={(e) =>{  setGeneratorBudgetMin(e.target.value); }}
                        placeholder="VD: 1000000"
                      />
                    </div>
                  )}
                  {requiredFieldSet.has('budgetMax') && (
                    <div className="space-y-2">
                      <Label>Ngân sách đến</Label>
                      <Input
                        type="number"
                        value={generatorBudgetMax}
                        onChange={(e) =>{  setGeneratorBudgetMax(e.target.value); }}
                        placeholder="VD: 3000000"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleGeneratePreview}>
                    {isPreviewLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    Preview
                  </Button>
                  <Button type="button" variant="outline" onClick={handleRegenerate} disabled={!generatorPreview}>
                    Sinh lại mạnh
                  </Button>
                  <Button type="button" variant="accent" onClick={handleApplyGenerated} disabled={!generatorPreview}>
                    Áp dụng vào form
                  </Button>
                </div>

                {generatorPreview && (
                  <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="text-sm text-slate-500">Preview</div>
                    {generatorPreview.qualityWarnings && generatorPreview.qualityWarnings.length > 0 && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <div className="font-medium mb-1">Lưu ý chất lượng dữ liệu</div>
                        <ul className="list-disc pl-4 space-y-1">
                          {generatorPreview.qualityWarnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{generatorPreview.title}</div>
                    {generatorPreview.thumbnail && (
                      <img src={generatorPreview.thumbnail} alt={generatorPreview.title} className="w-full max-h-64 object-cover rounded-md" />
                    )}
                    <div className="text-sm text-slate-600 dark:text-slate-400">{generatorPreview.excerpt}</div>
                    <div className="border-t border-slate-200 pt-3">
                      <div className="text-sm font-medium mb-2">Nội dung</div>
                      <div
                        className="generated-article-preview text-sm text-slate-700"
                        onClick={handlePreviewClick}
                        dangerouslySetInnerHTML={{ __html: generatorPreview.contentHtml }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Title - always shown (system field) */}
              <div className="space-y-2">
                <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                <CopyableInput value={title} onChange={handleTitleChange} required placeholder="Nhập tiêu đề bài viết..." copyLabel="tiêu đề" />
              </div>
              {/* Slug - always shown (system field) */}
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="tu-dong-tao-tu-tieu-de" className="font-mono text-sm" />
              </div>
              {/* Excerpt - conditional */}
              {enabledFields.has('excerpt') && (
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Input value={excerpt} onChange={(e) =>{  setExcerpt(e.target.value); }} placeholder="Tóm tắt nội dung bài viết..." />
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
                      placeholder="Lấy theo tiêu đề bài viết nếu để trống"
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
                    {metaTitle.trim() || title || 'Tiêu đề bài viết'}
                  </div>
                  <div className="text-emerald-600 text-xs">
                    /{categorySlugPreview}/{slug || 'bai-viet'}
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
        isSubmitting={isSubmitting}
        submitLabel="Đăng bài"
        align="end"
        disableSave={isSubmitting || !title.trim() || !categoryId}
      >
        <div className="flex flex-wrap justify-end gap-2">
          <AiEntityImportDialog kind="post" enabledFields={enabledFields} onApply={handleApplyAiPost} />
          <Button type="submit" variant="accent" disabled={isSubmitting || !title.trim() || !categoryId}>
            {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
            Đăng bài
          </Button>
        </div>
      </HomeComponentStickyFooter>
    </form>
    {galleryModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4" onClick={handleCloseGallery}>
        <div
          className="relative w-full max-w-4xl rounded-xl border border-slate-100 bg-white overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleCloseGallery}
            className="absolute right-3 top-3 rounded-md bg-slate-900/80 px-3 py-1 text-xs font-medium text-white"
          >
            Đóng
          </button>
          <div className="relative bg-black">
            <img
              src={galleryModal.images[galleryModal.index]}
              alt="Ảnh xem trước"
              className="w-full max-h-[75vh] object-contain"
            />
            {galleryModal.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevGallery}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-white/90 px-2 py-1 text-lg font-semibold text-slate-900"
                  aria-label="Ảnh trước"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextGallery}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/90 px-2 py-1 text-lg font-semibold text-slate-900"
                  aria-label="Ảnh sau"
                >
                  ›
                </button>
              </>
            )}
            <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
              {galleryModal.index + 1}/{galleryModal.images.length}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
