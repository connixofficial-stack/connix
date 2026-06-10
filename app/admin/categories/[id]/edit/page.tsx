'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Badge, Button, Card, CardContent, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import { buildCategoryPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { LexicalEditor } from '@/app/admin/components/LexicalEditor';
import { FaqForm } from '@/app/admin/home-components/faq/_components/FaqForm';
import type { FaqItem, FaqStyle, FaqConfig } from '@/app/admin/home-components/faq/_types';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { AiCategoryContentImport } from '../../_components/AiCategoryContentImport';

const MODULE_KEY = 'productCategories';

export default function CategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const categoryData = useQuery(api.productCategories.getById, { id: id as Id<"productCategories"> });
  const categoriesData = useQuery(api.productCategories.listAll, {});
  const relatedProducts = useQuery(api.products.listProductsByCategoryForAdmin, { categoryId: id as Id<"productCategories"> }) ?? [];
  const updateCategory = useMutation(api.productCategories.update);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const hierarchyFeature = useQuery(api.admin.modules.getModuleFeature, {
    featureKey: 'enableCategoryHierarchy',
    moduleKey: 'products',
  });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);

  // System settings toggles
  const showCategorySubtitleSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'showCategorySubtitle' });
  const enableCategoryFilterFooterContentSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableCategoryFilterFooterContent' });
  const enableCategoryProductDetailSuffixSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableCategoryProductDetailSuffix' });
  const enableCategoryProductDetailFaqSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableCategoryProductDetailFaq' });
  const enableProductTypesSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableProductTypes' });

  const showCategorySubtitle = showCategorySubtitleSetting?.value === true;
  const enableCategoryFilterFooterContent = enableCategoryFilterFooterContentSetting?.value === true;
  const enableCategoryProductDetailSuffix = enableCategoryProductDetailSuffixSetting?.value === true;
  const enableCategoryProductDetailFaq = enableCategoryProductDetailFaqSetting?.value === true;
  const enableProductTypes = enableProductTypesSetting?.value === true;
  const productTypesData = useQuery(api.productTypes.listAll, enableProductTypes ? {} : 'skip');
  const assignedProductTypesData = useQuery(
    api.productTypes.listAssignedTypesForCategory,
    enableProductTypes ? { categoryId: id as Id<"productCategories"> } : 'skip'
  );

  const [activeTab, setActiveTab] = useState('info');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [active, setActive] = useState(true);
  const [productTypeIds, setProductTypeIds] = useState<Id<"productTypes">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New fields state
  const [filterFooterContent, setFilterFooterContent] = useState('');
  const [productDetailSuffixContent, setProductDetailSuffixContent] = useState('');
  const [faqItems, setFaqItems] = useState<FaqItem[]>([{ id: Date.now(), question: '', answer: '' }]);
  const [faqStyle, setFaqStyle] = useState<FaqStyle>('accordion');
  const [faqConfig, setFaqConfig] = useState<FaqConfig>({ description: '', buttonText: '', buttonLink: '' });
  const [faqEnabled, setFaqEnabled] = useState(true);
  const [aiResetKey, setAiResetKey] = useState(0);

  const handleAiApply = (data: {
    filterFooterContent: string;
    productDetailSuffixContent: string;
    faqItems: FaqItem[];
  }) => {
    if (data.filterFooterContent) {
      setFilterFooterContent(data.filterFooterContent);
    }
    if (data.productDetailSuffixContent) {
      setProductDetailSuffixContent(data.productDetailSuffixContent);
    }
    if (data.faqItems && data.faqItems.length > 0) {
      setFaqItems(data.faqItems);
      setFaqEnabled(true);
    }
    setAiResetKey(prev => prev + 1);
  };

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);
  const isHierarchyEnabled = hierarchyFeature?.enabled === true;

  // Ref & State for Dirty State (Phát hiện thay đổi)
  const initialSnapshotRef = useRef<{
    name: string;
    slug: string;
    description: string;
    parentId: string;
    active: boolean;
    filterFooterContent: string;
    productDetailSuffixContent: string;
    faqItems: { id: string; question: string; answer: string; order: number }[];
    faqStyle: string;
    faqEnabled: boolean;
    productTypeIds: string[];
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [snapshotVersion, setSnapshotVersion] = useState(0);

  const currentSnapshot = useMemo(() => {
    const resolvedFaqItems = faqItems
      .filter(f => f.question.trim() || f.answer.trim())
      .map((f, idx) => ({
        id: String(f.id),
        question: f.question.trim(),
        answer: f.answer.trim(),
        order: idx,
      }));

    return {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      parentId: parentId || '',
      active,
      filterFooterContent: filterFooterContent.trim(),
      productDetailSuffixContent: productDetailSuffixContent.trim(),
      faqItems: resolvedFaqItems,
      faqStyle,
      faqEnabled,
      productTypeIds: [...productTypeIds].sort(),
    };
  }, [name, slug, description, parentId, active, filterFooterContent, productDetailSuffixContent, faqItems, faqStyle, faqEnabled, productTypeIds]);

  const hasChanges = useMemo(() => {
    if (!initialSnapshotRef.current) {return false;}
    return JSON.stringify(initialSnapshotRef.current) !== JSON.stringify(currentSnapshot);
  }, [currentSnapshot, snapshotVersion]);

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

  const generateSlugFromName = (value: string) => value.toLowerCase()
    .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
    .replaceAll(/[đĐ]/g, "d")
    .replaceAll(/[^a-z0-9\s]/g, '')
    .replaceAll(/\s+/g, '-');

  useEffect(() => {
    if (categoryData) {
      setName(categoryData.name);
      setSlug(categoryData.slug);
      setDescription(categoryData.description ?? '');
      setParentId(categoryData.parentId ?? '');
      setActive(categoryData.active);

      // Load new fields
      const loadedFilterFooterContent = categoryData.filterFooterContent ?? '';
      const loadedProductDetailSuffixContent = categoryData.productDetailSuffixContent ?? '';
      setFilterFooterContent(loadedFilterFooterContent);
      setProductDetailSuffixContent(loadedProductDetailSuffixContent);
      
      let loadedFaqItems: FaqItem[] = [];
      if (categoryData.productDetailFaqItems && categoryData.productDetailFaqItems.length > 0) {
        loadedFaqItems = categoryData.productDetailFaqItems.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
        })) as FaqItem[];
      } else {
        loadedFaqItems = [{ id: Date.now(), question: '', answer: '' }];
      }
      setFaqItems(loadedFaqItems);
      
      const loadedFaqStyle = (categoryData.productDetailFaqStyle as FaqStyle) ?? 'accordion';
      setFaqStyle(loadedFaqStyle);

      const loadedFaqEnabled = categoryData.productDetailFaqEnabled !== false;
      setFaqEnabled(loadedFaqEnabled);

      const resolvedFaqItems = loadedFaqItems
        .filter(f => f.question.trim() || f.answer.trim())
        .map((f, idx) => ({
          id: String(f.id),
          question: f.question.trim(),
          answer: f.answer.trim(),
          order: idx,
        }));

      initialSnapshotRef.current = {
        name: categoryData.name.trim(),
        slug: categoryData.slug.trim(),
        description: (categoryData.description ?? '').trim(),
        parentId: categoryData.parentId ?? '',
        active: categoryData.active,
        filterFooterContent: loadedFilterFooterContent.trim(),
        productDetailSuffixContent: loadedProductDetailSuffixContent.trim(),
        faqItems: resolvedFaqItems,
        faqStyle: loadedFaqStyle,
        faqEnabled: loadedFaqEnabled,
        productTypeIds: [...productTypeIds].sort(),
      };
      setSnapshotVersion(prev => prev + 1);
    }
  }, [categoryData]);

  useEffect(() => {
    if (!assignedProductTypesData) {return;}
    const nextProductTypeIds = assignedProductTypesData.map(type => type._id);
    setProductTypeIds(nextProductTypeIds);
    if (initialSnapshotRef.current) {
      initialSnapshotRef.current = {
        ...initialSnapshotRef.current,
        productTypeIds: [...nextProductTypeIds].sort(),
      };
      setSnapshotVersion(prev => prev + 1);
    }
  }, [assignedProductTypesData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(generateSlugFromName(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}

    setIsSubmitting(true);
    setSaveStatus('saving');
    try {
      const resolvedFaqItems = faqItems
        .filter(f => f.question.trim() || f.answer.trim())
        .map((f, idx) => ({
          id: String(f.id),
          question: f.question.trim(),
          answer: f.answer.trim(),
          order: idx,
        }));

      await updateCategory({
        active,
        description: description.trim() || undefined,
        id: id as Id<"productCategories">,
        name: name.trim(),
        parentId: isHierarchyEnabled && parentId ? parentId as Id<"productCategories"> : undefined,
        slug: slug.trim(),
        filterFooterContent: enableCategoryFilterFooterContent ? filterFooterContent.trim() : undefined,
        productDetailSuffixContent: enableCategoryProductDetailSuffix ? productDetailSuffixContent.trim() : undefined,
        productDetailFaqItems: enableCategoryProductDetailFaq ? resolvedFaqItems : undefined,
        productDetailFaqStyle: enableCategoryProductDetailFaq ? faqStyle : undefined,
        productDetailFaqEnabled: faqEnabled,
        productTypeIds: enableProductTypes ? productTypeIds : undefined,
      });

      // Reset snapshot to current values upon successful save
      initialSnapshotRef.current = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        parentId: parentId || '',
        active,
        filterFooterContent: filterFooterContent.trim(),
        productDetailSuffixContent: productDetailSuffixContent.trim(),
        faqItems: resolvedFaqItems,
        faqStyle,
        faqEnabled,
        productTypeIds: [...productTypeIds].sort(),
      };
      setSnapshotVersion(prev => prev + 1);
      setSaveStatus('saved');
      toast.success('Cập nhật danh mục thành công');
    } catch (error) {
      setSaveStatus('idle');
      toast.error(getAdminMutationErrorMessage(error, 'Không thể cập nhật danh mục'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoryData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (categoryData === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy danh mục</div>;
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa danh mục</h1>
          <Link href="/admin/categories" className="text-sm text-orange-600 hover:underline">Quay lại danh sách</Link>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() =>{  setActiveTab('info'); }}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'info' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Thông tin chung
        </button>
        <button
          onClick={() =>{  setActiveTab('products'); }}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'products' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Sản phẩm thuộc danh mục <Badge variant="secondary" className="ml-1">{relatedProducts.length}</Badge>
        </button>
      </div>

      {activeTab === 'info' ? (
        <form onSubmit={handleSubmit}>
          <Card className="w-full">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tên danh mục <span className="text-red-500">*</span></Label>
                    <CopyableInput value={name} onChange={handleNameChange} required placeholder="Ví dụ: Điện thoại, Áo sơ mi..." autoFocus copyLabel="tên danh mục" />
                  </div>

                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="slug" className="font-mono text-sm" />
                  </div>
                </div>

                <div className="space-y-4">
                  {isHierarchyEnabled && (
                    <div className="space-y-2">
                      <Label>Danh mục cha</Label>
                      <select 
                        value={parentId}
                        onChange={(e) =>{  setParentId(e.target.value); }}
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                      >
                        <option value="">-- Không có (Danh mục gốc) --</option>
                        {categoriesData?.filter(c => c._id !== id).map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <select 
                      value={active ? 'active' : 'inactive'}
                      onChange={(e) =>{  setActive(e.target.value === 'active'); }}
                      className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ẩn</option>
                    </select>
                  </div>
                </div>
              </div>

              {(enabledFields.has('description') || showCategorySubtitle) && (
                <div className="space-y-2">
                  <Label>Mô tả ngắn (Subtitle)</Label>
                  <textarea
                    value={description}
                    onChange={(e) =>{  setDescription(e.target.value); }}
                    placeholder="Mô tả ngắn hiển thị dưới tên danh mục..."
                    className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
              )}

              {enableProductTypes && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Label className="text-base font-semibold block">Phân loại & Thuộc tính</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Chọn duy nhất 1 kiểu sản phẩm cho danh mục này. Mỗi danh mục chỉ có thể liên kết với tối đa 1 kiểu để hiển thị các thuộc tính bộ lọc phù hợp.
                      </p>
                    </div>
                    <Link href="/admin/product-types" className="text-xs text-orange-600 hover:underline whitespace-nowrap">
                      Quản lý kiểu
                    </Link>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3 max-h-60 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-900/30">
                    {productTypesData === undefined ? (
                      <p className="text-sm text-slate-500 italic">Đang tải kiểu sản phẩm...</p>
                    ) : productTypesData.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">Chưa có kiểu sản phẩm nào.</p>
                    ) : (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-orange-600">
                          <input
                            type="radio"
                            name="productTypeId"
                            checked={productTypeIds.length === 0}
                            onChange={() => setProductTypeIds([])}
                            className="h-4 w-4 border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-slate-500 italic">Không gán kiểu sản phẩm (Bỏ chọn)</span>
                        </label>
                        {productTypesData.map(type => (
                          <label key={type._id} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-orange-600">
                            <input
                              type="radio"
                              name="productTypeId"
                              checked={productTypeIds.includes(type._id)}
                              onChange={() => setProductTypeIds([type._id])}
                              className="h-4 w-4 border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium">{type.name}</span>
                            <span className="text-xs text-slate-400 font-mono">({type.slug})</span>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {enableCategoryFilterFooterContent && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <Label className="text-base font-semibold block">Nội dung cuối trang danh mục</Label>
                  <LexicalEditor
                    key={`${id}:filterFooterContent:${aiResetKey}`}
                    resetKey={`${id}:filterFooterContent:${aiResetKey}`}
                    onChange={setFilterFooterContent}
                    initialContent={filterFooterContent}
                  />
                </div>
              )}

              {enableCategoryProductDetailSuffix && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <Label className="text-base font-semibold block">Nội dung nối đuôi chi tiết sản phẩm</Label>
                  <LexicalEditor
                    key={`${id}:productDetailSuffixContent:${aiResetKey}`}
                    resetKey={`${id}:productDetailSuffixContent:${aiResetKey}`}
                    onChange={setProductDetailSuffixContent}
                    initialContent={productDetailSuffixContent}
                  />
                </div>
              )}

              {enableCategoryProductDetailFaq && (
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold block">FAQ chi tiết sản phẩm</Label>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Bật hoặc tắt hiển thị các câu hỏi thường gặp cho danh mục này trên trang chi tiết sản phẩm.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={faqEnabled}
                        onClick={() => setFaqEnabled(!faqEnabled)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                          faqEnabled ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-700"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            faqEnabled ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span className={cn(
                        "text-sm font-medium",
                        faqEnabled ? "text-orange-600 dark:text-orange-400" : "text-slate-400"
                      )}>
                        {faqEnabled ? "Đang bật" : "Đã tắt"}
                      </span>
                    </div>
                  </div>

                  {faqEnabled ? (
                    <div className="space-y-4 pt-2">
                      <FaqForm
                        faqItems={faqItems}
                        setFaqItems={setFaqItems}
                        faqStyle={faqStyle}
                        brandColor="#f97316"
                        faqConfig={faqConfig}
                        setFaqConfig={setFaqConfig}
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center bg-slate-50/50 dark:bg-slate-900/50">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">FAQ chi tiết sản phẩm đã bị tắt cho danh mục này</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Các câu hỏi FAQ đã soạn thảo vẫn được lưu trữ an toàn nhưng sẽ không hiển thị ngoài giao diện web cho đến khi bạn bật lại.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <HomeComponentStickyFooter
            isSubmitting={isSubmitting}
            hasChanges={hasChanges}
            submitLabel="Lưu thay đổi"
          >
            <>
              <Button type="button" variant="ghost" onClick={() => router.push('/admin/categories')} disabled={isSubmitting}>Hủy bỏ</Button>
              <div className="flex flex-wrap justify-end gap-2">
                <AiCategoryContentImport 
                  categoryName={name}
                  categoryDescription={description}
                  onApply={handleAiApply}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(buildCategoryPath({ categorySlug: slug, mode: routeMode, moduleKey: 'products' }), '_blank')}
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
                  className={cn(
                    !hasChanges && !isSubmitting
                      ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                      : undefined
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Đang lưu...
                    </>
                  ) : (!hasChanges ? 'Đã lưu' : 'Lưu thay đổi')}
                </Button>
              </div>
            </>
          </HomeComponentStickyFooter>
        </form>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hình ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Giá bán</TableHead>
                <TableHead>Kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatedProducts.map(prod => (
                <TableRow key={prod._id}>
                  <TableCell>
                    {prod.image ? (
                      <Image src={prod.image} width={40} height={40} className="object-cover rounded bg-slate-100" alt="" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{prod.name}</TableCell>
                  <TableCell>
                    {prod.salePrice ? (
                      <span className="text-red-500">{formatPrice(prod.salePrice)}</span>
                    ) : (
                      formatPrice(prod.price)
                    )}
                  </TableCell>
                  <TableCell className={prod.stock < 10 ? 'text-red-500 font-medium' : ''}>{prod.stock}</TableCell>
                  <TableCell>
                    <Badge variant={prod.status === 'Active' ? 'success' : 'secondary'}>
                      {prod.status === 'Active' ? 'Đang bán' : (prod.status === 'Draft' ? 'Nháp' : 'Lưu trữ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/products/${prod._id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8">Sửa</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {relatedProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Chưa có sản phẩm nào trong danh mục này.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
