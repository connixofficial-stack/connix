'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, Input, Label, cn } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { LexicalEditor } from '../../components/LexicalEditor';
import { FaqForm } from '@/app/admin/home-components/faq/_components/FaqForm';
import type { FaqItem, FaqStyle, FaqConfig } from '@/app/admin/home-components/faq/_types';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { AiCategoryContentImport } from '../_components/AiCategoryContentImport';

const MODULE_KEY = 'productCategories';

export default function CategoryCreatePage() {
  const router = useRouter();
  const categoriesData = useQuery(api.productCategories.listAll, {});
  const createCategory = useMutation(api.productCategories.create);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const hierarchyFeature = useQuery(api.admin.modules.getModuleFeature, {
    featureKey: 'enableCategoryHierarchy',
    moduleKey: 'products',
  });
  void fieldsData; // Mark as intentionally unused for now

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
  const [faqStyle] = useState<FaqStyle>('accordion');
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val.toLowerCase()
      .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
      .replaceAll(/[đĐ]/g, "d")
      .replaceAll(/[^a-z0-9\s]/g, '')
      .replaceAll(/\s+/g, '-');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {return;}

    setIsSubmitting(true);
    try {
      const resolvedFaqItems = faqItems
        .filter(f => f.question.trim() || f.answer.trim())
        .map((f, idx) => ({
          id: String(f.id),
          question: f.question.trim(),
          answer: f.answer.trim(),
          order: idx,
        }));

      await createCategory({
        active,
        description: description.trim() || undefined,
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
      toast.success('Tạo danh mục thành công');
      router.push('/admin/categories');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo danh mục'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm danh mục mới</h1>
          <Link href="/admin/categories" className="text-sm text-orange-600 hover:underline">Quay lại danh sách</Link>
        </div>
      </div>

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
                  <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="tu-dong-tao-tu-ten" className="font-mono text-sm" />
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
                      {categoriesData?.filter(c => c.active).map(cat => (
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
                <LexicalEditor onChange={setFilterFooterContent} initialContent={filterFooterContent} resetKey={`create:filterFooterContent:${aiResetKey}`} />
              </div>
            )}

            {enableCategoryProductDetailSuffix && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Label className="text-base font-semibold block">Nội dung nối đuôi chi tiết sản phẩm</Label>
                <LexicalEditor onChange={setProductDetailSuffixContent} initialContent={productDetailSuffixContent} resetKey={`create:productDetailSuffixContent:${aiResetKey}`} />
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
          submitLabel="Tạo danh mục"
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
                type="submit"
                variant="accent"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Đang tạo...
                  </>
                ) : 'Tạo danh mục'}
              </Button>
            </div>
          </>
        </HomeComponentStickyFooter>
      </form>
    </div>
  );
}
