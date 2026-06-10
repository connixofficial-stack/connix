'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Check, Copy, ExternalLink, Loader2, Sparkles, Plus, Trash, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../components/ui';
import { LexicalEditor } from '../../components/LexicalEditor';
import { ImageUploader } from '../../components/ImageUploader';
import type { ImageItem } from '../../components/MultiImageUploader';
import { MultiImageUploader } from '../../components/MultiImageUploader';
import { ModuleGuard } from '../../components/ModuleGuard';
import { DigitalCredentialsForm } from '@/components/orders/DigitalCredentialsForm';
import { stripHtml, truncateText } from '@/lib/seo';
import { ProductCategoryCombobox } from '@/app/admin/products/components/ProductCategoryCombobox';
import { QuickCreateCategoryModal } from '@/app/admin/products/components/QuickCreateCategoryModal';
import { resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { getAttributeIconComponent } from '@/app/admin/attribute-groups/_lib/iconRegistry';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { AiEntityImportDialog, type AiEntityImportPayload } from '@/app/admin/components/AiEntityImportDialog';
import { CategoryTagsInput } from '@/app/admin/components/AdditionalCategoriesSelect';
import { InlineMatrixBuilder, type OptionCatalogItem, type VariantOptionSelection, type VariantRow } from '@/app/admin/products/components/inline-matrix-builder';
import { normalizeVariantRows, normalizeVariantSelections, validateVariantPayload } from '@/app/admin/products/components/inline-variant-utils';

const MODULE_KEY = 'products';

// Hàm xóa dấu tiếng Việt phục vụ fuzzy search
const removeTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[đđ]/g, 'd')
    .replaceAll(/[ĐĐ]/g, 'D')
    .toLowerCase();
};

const normalizeAttributeText = (str: string): string => removeTones(str).normalize('NFC').trim();

// Hàm phân tách giá trị và đơn vị của term range
const parseTermValue = (termName: string) => {
  const match = termName.match(/^([\d.,]+)\s*(.*)$/);
  if (match) {
    return { value: match[1].replace(',', '.'), unit: match[2].trim() };
  }
  return { value: '', unit: '' };
};

// Hàm tìm đơn vị chủ đạo của group
const getDominantUnit = (terms: Array<{ name: string }>) => {
  const counts: Record<string, number> = {};
  terms.forEach(t => {
    const { unit } = parseTermValue(t.name);
    if (unit) {
      counts[unit] = (counts[unit] || 0) + 1;
    }
  });
  let dominant = '';
  let maxCount = 0;
  Object.entries(counts).forEach(([unit, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominant = unit;
    }
  });
  return dominant;
};

const findAttributeGroupByName = (groups: any[], groupName: string) => {
  const normalizedName = normalizeAttributeText(groupName);
  return groups.find((group) => normalizeAttributeText(group.name) === normalizedName);
};

const getAttributeValidationErrors = (
  formConfig: { groups: any[] } | null | undefined,
  attributeTermIds: Id<"attributeTerms">[],
  rangeInputs: Record<string, { value: string; unit: string }>
) => {
  if (!formConfig) {return [];}

  return formConfig.groups
    .filter((group) => {
      if (group.filterType === 'range') {
        return !rangeInputs[group._id]?.value?.trim();
      }
      return !group.terms.some((term: any) => attributeTermIds.includes(term._id));
    })
    .map((group) => group.name);
};

export default function ProductCreatePage() {
  return (
    <ModuleGuard moduleKey="products">
      <ProductCreateContent />
    </ModuleGuard>
  );
}

function ProductCreateContent() {
  const router = useRouter();
  const categoriesData = useQuery(api.productCategories.listActive);
  const createProduct = useMutation(api.productsSmart.createProductWithVariants);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const optionsData = useQuery(api.productOptions.listActiveWithValues);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('0');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [renderType, setRenderType] = useState<'content' | 'markdown' | 'html'>('content');
  const [markdownRender, setMarkdownRender] = useState('');
  const [htmlRender, setHtmlRender] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [imageStorageId, setImageStorageId] = useState<Id<'_storage'> | undefined>();
  const [galleryItems, setGalleryItems] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<'Draft' | 'Active' | 'Archived'>('Draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNameCopied, setIsNameCopied] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantSelections, setVariantSelections] = useState<VariantOptionSelection[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [productType, setProductType] = useState<'physical' | 'digital'>('physical');
  const [digitalDeliveryType, setDigitalDeliveryType] = useState<'account' | 'license' | 'download' | 'custom'>('account');
  const [digitalCredentialsTemplate, setDigitalCredentialsTemplate] = useState<{
    username?: string;
    password?: string;
    licenseKey?: string;
    downloadUrl?: string;
    customContent?: string;
    expiresAt?: number;
  }>({});
  const generatedSku = useQuery(
    api.productsSmart.generateSmartSku,
    categoryId
      ? { name: name.trim() || 'Product', categoryId: categoryId as Id<"productCategories"> }
      : 'skip'
  );
  const resolvedSkuPreview = sku.trim() || generatedSku || '';
  const skuExists = useQuery(
    api.productsSmart.checkSkuExists,
    resolvedSkuPreview ? { sku: resolvedSkuPreview } : 'skip'
  );

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRenderCard = hasMarkdownRender || hasHtmlRender;

  // Apply defaultStatus from settings
  const defaultStatus = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'defaultStatus');
    return (setting?.value as string) || 'Draft';
  }, [settingsData]);

  const variantEnabled = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantEnabled');
    return Boolean(setting?.value);
  }, [settingsData]);

  const variantPricing = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantPricing');
    return (setting?.value as string) || 'variant';
  }, [settingsData]);

  const variantStock = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantStock');
    return (setting?.value as string) || 'variant';
  }, [settingsData]);

  const productTypeMode = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'productTypeMode');
    const value = setting?.value as 'physical' | 'digital' | 'both' | undefined;
    return value ?? 'both';
  }, [settingsData]);
  const multiCategoryEnabled = useMemo(() => (
    Boolean(settingsData?.find(s => s.settingKey === 'enableMultipleCategories')?.value)
  ), [settingsData]);

  const enableProductTypes = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'enableProductTypes');
    return setting?.value === true;
  }, [settingsData]);

  const productTypesData = useQuery(api.productTypes.listAll, enableProductTypes ? {} : 'skip');
  const categoryProductTypesData = useQuery(
    api.productTypes.listAssignedTypesForCategory,
    enableProductTypes && categoryId ? { categoryId: categoryId as Id<"productCategories"> } : 'skip'
  );
  const [productTypeId, setProductTypeId] = useState('');
  const [attributeTermIds, setAttributeTermIds] = useState<Id<"attributeTerms">[]>([]);
  const updateAttributeGroup = useMutation(api.attributeGroups.update);
  const createAttributeTerm = useMutation(api.attributeTerms.create);
  const [rangeInputs, setRangeInputs] = useState<Record<string, { value: string; unit: string }>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const formConfig = useQuery(api.productTypes.getFormConfig, productTypeId ? { typeId: productTypeId as Id<"productTypes"> } : 'skip');

  const handleAddStandardTerm = async (group: any) => {
    const termName = window.prompt(`Nhập giá trị mới cho nhóm thuộc tính "${group.name}":`);
    if (termName && termName.trim()) {
      const trimmedName = termName.trim();
      const exists = group.terms.some(
        (t: any) => t.name.toLowerCase().trim() === trimmedName.toLowerCase().trim()
      );
      if (exists) {
        toast.error("Giá trị thuộc tính này đã tồn tại.");
        return;
      }
      try {
        const newTermId = await createAttributeTerm({
          groupId: group._id,
          name: trimmedName,
          slug: trimmedName
            .toLowerCase()
            .normalize("NFD")
            .replaceAll(/[\u0300-\u036F]/g, "")
            .replaceAll(/[đĐ]/g, "d")
            .replaceAll(/[^a-z0-9\s-]/g, "")
            .trim()
            .replaceAll(/\s+/g, "-")
            .replaceAll(/-+/g, "-"),
          active: true
        });
        
        // Tự động tick chọn giá trị mới tạo
        const isSingle = group.inputType === 'radio' || group.filterType === 'single';
        if (isSingle) {
          const otherTermIds = group.terms.map((t: any) => t._id);
          setAttributeTermIds(prev => [...prev.filter(id => !otherTermIds.includes(id)), newTermId]);
        } else {
          setAttributeTermIds(prev => [...prev, newTermId]);
        }
        
        toast.success(`Đã thêm giá trị "${trimmedName}" thành công.`);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tạo giá trị thuộc tính mới.");
      }
    }
  };
  const availableProductTypes = useMemo(() => {
    if (categoryId && categoryProductTypesData && categoryProductTypesData.length > 0) {
      return categoryProductTypesData;
    }
    return productTypesData ?? [];
  }, [categoryId, categoryProductTypesData, productTypesData]);

  const selectedCategoryIds = useMemo(() => {
    return [categoryId, ...additionalCategoryIds].filter(Boolean) as Id<"productCategories">[];
  }, [categoryId, additionalCategoryIds]);

  const assignedTypesForSelectedCategories = useQuery(
    api.productTypes.listAssignedTypesForCategories,
    enableProductTypes && selectedCategoryIds.length > 0 ? { categoryIds: selectedCategoryIds } : 'skip'
  );

  const hasTaxonomyConflict = useMemo(() => {
    if (!enableProductTypes || !assignedTypesForSelectedCategories) return false;
    const uniqueTypeIds = new Set<string>();
    assignedTypesForSelectedCategories.forEach(row => {
      row.types.forEach(type => uniqueTypeIds.add(type._id));
    });
    return uniqueTypeIds.size > 1;
  }, [enableProductTypes, assignedTypesForSelectedCategories]);

  useEffect(() => {
    if (formConfig) {
      setRangeInputs(prev => {
        const next = { ...prev };
        let changed = false;
        formConfig.groups.forEach(group => {
          if (group.filterType === 'range' && !next[group._id]) {
            const dominant = getDominantUnit(group.terms) || '%';
            next[group._id] = { value: '', unit: dominant };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [formConfig]);

  const digitalEnabled = productTypeMode !== 'physical';

  const defaultDigitalDeliveryType = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'defaultDigitalDeliveryType');
    return (setting?.value as 'account' | 'license' | 'download' | 'custom') ?? 'account';
  }, [settingsData]);

  const saleMode = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'saleMode');
    const value = setting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [settingsData]);

  const enableCombos = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'enableCombos');
    return setting?.value === true;
  }, [settingsData]);

  const [combos, setCombos] = useState<any[]>([]);
  const allProducts = useQuery(api.products.listAll, { limit: 500 });
  const allActiveProducts = useMemo(() => {
    return allProducts?.filter(p => p.status === 'Active') ?? [];
  }, [allProducts]);
  const showCombosPanel = enableCombos && saleMode === 'contact' && !hasVariants;

  const enableImageCrop = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'enableImageCrop');
    return Boolean(setting?.value);
  }, [settingsData]);
  const defaultImageAspectRatio = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'defaultImageAspectRatio');
    return resolveProductImageAspectRatio(setting?.value);
  }, [settingsData]);

  const isAffiliateMode = saleMode === 'affiliate';
  const isPriceRequired = saleMode === 'cart';
  const showProductTypeSelector = productTypeMode === 'both';
  const hideBasePricing = variantEnabled && hasVariants && variantPricing === 'variant';
  const hideBaseStock = variantEnabled && hasVariants && variantStock === 'variant';
  const optionCatalog = useMemo<OptionCatalogItem[]>(() =>
    (optionsData ?? [])
      .map((option) => ({
        id: option._id,
        name: option.name,
        order: option.order,
        values: option.values
          .filter((value) => value.active)
          .sort((a, b) => a.order - b.order)
          .map((value) => ({
            id: value._id,
            label: value.label ?? value.value,
            order: value.order,
          })),
      }))
      .sort((a, b) => a.order - b.order),
  [optionsData]);
  const normalizedVariantSelections = useMemo(() => normalizeVariantSelections(variantSelections), [variantSelections]);
  const normalizedVariantRows = useMemo(() => normalizeVariantRows(variantRows), [variantRows]);

  useEffect(() => {
    if (defaultStatus) {
      setStatus(defaultStatus as 'Draft' | 'Active' | 'Archived');
    }
  }, [defaultStatus]);

  const categoryData = categoriesData?.find((c) => c._id === categoryId);
  const categorySlugPreview = categoryData?.slug || 'chua-phan-loai';


  useEffect(() => {
    if (defaultDigitalDeliveryType) {
      setDigitalDeliveryType(defaultDigitalDeliveryType);
    }
  }, [defaultDigitalDeliveryType]);

  useEffect(() => {
    if (productTypeMode === 'physical' || productTypeMode === 'digital') {
      setProductType(productTypeMode);
    }
  }, [productTypeMode]);

  useEffect(() => {
    setSku(generatedSku || '');
  }, [generatedSku]);

  useEffect(() => {
    if (!isAffiliateMode) {
      setAffiliateLink('');
    }
  }, [isAffiliateMode]);

  useEffect(() => {
    if (!enableProductTypes || !categoryId || !categoryProductTypesData || categoryProductTypesData.length === 0) {
      return;
    }
    if (categoryProductTypesData.length === 1) {
      const nextTypeId = categoryProductTypesData[0]._id;
      if (productTypeId !== nextTypeId) {
        setProductTypeId(nextTypeId);
        setAttributeTermIds([]);
      }
      return;
    }
    if (productTypeId && !categoryProductTypesData.some(type => type._id === productTypeId)) {
      setProductTypeId('');
      setAttributeTermIds([]);
    }
  }, [enableProductTypes, categoryId, categoryProductTypesData, productTypeId]);

  const resolveSalePrice = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }
    const parsedValue = Number.parseInt(trimmedValue);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return null;
    }
    return parsedValue;
  };

  const formatNumberHelper = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return '';
    }
    const parsedValue = Number.parseInt(trimmedValue);
    if (!Number.isFinite(parsedValue)) {
      return '';
    }
    return new Intl.NumberFormat('en-US').format(parsedValue);
  };

  const priceHelper = formatNumberHelper(price);
  const salePriceHelper = formatNumberHelper(salePrice);

  const generateSlugFromTitle = (value: string) => value.toLowerCase()
    .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
    .replaceAll(/[đĐ]/g, "d")
    .replaceAll(/[^a-z0-9\s]/g, '')
    .replaceAll(/\s+/g, '-');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(generateSlugFromTitle(val));
  };

  const handleCopyName = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {return;}
    try {
      await navigator.clipboard.writeText(trimmedName);
      setIsNameCopied(true);
      toast.success('Đã copy tên sản phẩm');
      setTimeout(() =>{  setIsNameCopied(false); }, 2000);
    } catch {
      toast.error('Không thể copy, vui lòng copy thủ công');
    }
  };

  const handleApplyAiProduct = (item: AiEntityImportPayload) => {
    const nextName = item.name?.trim() || item.title?.trim() || '';
    if (!nextName) {return;}

    setName(nextName);
    setSlug(item.slug?.trim() || generateSlugFromTitle(nextName));
    if (typeof item.price === 'number') {setPrice(String(item.price));}
    if (typeof item.salePrice === 'number') {setSalePrice(String(item.salePrice));}
    if (typeof item.stock === 'number') {setStock(String(item.stock));}
    const nextDescription = item.content || item.description || item.excerpt || item.htmlRender || item.markdownRender || '';
    setDescription(nextDescription);
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
    setMetaTitle(item.metaTitle || truncateText(nextName, 60));
    setMetaDescription(item.metaDescription || truncateText(stripHtml(nextDescription), 160));
    if (item.image) {
      setImage(item.image);
      setImageStorageId(undefined);
    }
    
    if (enableProductTypes && (item.attributeTermIds?.length || item.newAttributes || item.attributeRangeValues) && !formConfig) {
      toast.warning('Chưa tải được cấu hình kiểu sản phẩm nên chưa thể áp dụng thuộc tính AI.');
    }

    if (enableProductTypes && formConfig?.groups) {
      const validTermIds = new Set(
        formConfig.groups.flatMap((group: any) => group.filterType !== 'range' ? group.terms.map((term: any) => term._id) : [])
      );
      const nextTermIds = new Set<Id<"attributeTerms">>(
        (item.attributeTermIds ?? []).filter((termId) => validTermIds.has(termId)) as Id<"attributeTerms">[]
      );

      if (item.newAttributes) {
        Object.entries(item.newAttributes).forEach(([groupName, values]) => {
          const group = findAttributeGroupByName(formConfig.groups, groupName);
          if (!group || group.filterType === 'range') {return;}
          values.forEach((value) => {
            const existingTerm = group.terms.find((term: any) => normalizeAttributeText(term.name) === normalizeAttributeText(value));
            if (existingTerm) {
              nextTermIds.add(existingTerm._id);
            }
          });
        });
      }

      if (nextTermIds.size > 0) {
        setAttributeTermIds(Array.from(nextTermIds));
      }
    }

    // Gán các thuộc tính lọc Range từ AI
    if (enableProductTypes && item.attributeRangeValues && formConfig && formConfig.groups) {
      const nextRangeInputs = { ...rangeInputs };
      formConfig.groups.forEach((group: any) => {
        if (group.filterType === 'range') {
          const matchEntry = Object.entries(item.attributeRangeValues!).find(
            ([k]) => normalizeAttributeText(k) === normalizeAttributeText(group.name)
          );
          
          const aiValue = matchEntry ? matchEntry[1] : undefined;
          if (aiValue) {
            const parsed = parseTermValue(aiValue);
            if (parsed.value) {
              nextRangeInputs[group._id] = {
                value: parsed.value,
                unit: parsed.unit || getDominantUnit(group.terms) || '%'
              };
            }
          }
        }
      });
      setRangeInputs(nextRangeInputs);
    }

    // Gán các combo thường được AI đề xuất
    if (showCombosPanel && item.combos && item.combos.length > 0) {
      setCombos(item.combos);
    }

    setEditorResetKey((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!name.trim() || !categoryId || (!hideBasePricing && isPriceRequired && (!price || Number(price) <= 0))) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    const variantPayload = {
      options: variantEnabled && hasVariants ? normalizedVariantSelections : [],
      variants: variantEnabled && hasVariants ? normalizedVariantRows : [],
    };
    if (variantEnabled && hasVariants) {
      const variantError = validateVariantPayload(
        variantPayload.options,
        variantPayload.variants,
        variantPricing === 'variant'
      );
      if (variantError) {
        toast.error(variantError);
        return;
      }
    }
    if (isAffiliateMode && !affiliateLink.trim()) {
      toast.error('Vui lòng nhập link affiliate cho sản phẩm');
      return;
    }
    if (galleryItems.some(item => Boolean(item.url)) && !image) {
      toast.error('Vui lòng chọn ảnh chính trước khi thêm ảnh vào thư viện');
      return;
    }
    const resolvedProductSku = sku.trim() || generatedSku || `SKU-${Date.now()}`;
    if (resolvedProductSku && skuExists === true) {
      toast.error('Mã SKU đã tồn tại, vui lòng chọn mã khác');
      return;
    }
    if (!hideBasePricing && salePrice.trim() !== '') {
      const parsedSalePrice = resolveSalePrice(salePrice);
      if (parsedSalePrice) {
        const parsedPrice = Number.parseInt(price) || 0;
        if (parsedPrice <= 0 || parsedSalePrice <= parsedPrice) {
          toast.error('Giá so sánh phải lớn hơn giá bán');
          return;
        }
      }
    }
    if (hasTaxonomyConflict) {
      toast.error("Không thể lưu: Các danh mục được chọn phải thuộc cùng một kiểu sản phẩm.");
      return;
    }
    if (enableProductTypes && availableProductTypes.length > 0 && !productTypeId) {
      toast.error('Vui lòng chọn kiểu sản phẩm trước khi lưu.');
      return;
    }
    if (enableProductTypes && productTypeId && !formConfig) {
      toast.error('Đang tải cấu hình thuộc tính, vui lòng thử lại sau.');
      return;
    }
    const missingAttributes = enableProductTypes && productTypeId
      ? getAttributeValidationErrors(formConfig, attributeTermIds, rangeInputs)
      : [];
    if (missingAttributes.length > 0) {
      toast.error(`Vui lòng điền đủ thuộc tính trước khi lưu: ${missingAttributes.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Xử lý các thuộc tính Range
      const rangeTermIds: Id<"attributeTerms">[] = [];
      if (enableProductTypes && formConfig) {
        // Xác nhận đơn vị lệch chuẩn trước khi lưu
        for (const group of formConfig.groups) {
          if (group.filterType === 'range') {
            const input = rangeInputs[group._id];
            if (input && input.value.trim()) {
              const dominantUnit = getDominantUnit(group.terms);
              if (dominantUnit && input.unit !== dominantUnit) {
                const confirmMsg = `Đơn vị của thuộc tính '${group.name}' bạn chọn là '${input.unit}' khác với đơn vị phổ biến hiện tại là '${dominantUnit}'. Bạn có chắc chắn muốn lưu?`;
                if (!window.confirm(confirmMsg)) {
                  setIsSubmitting(false);
                  return;
                }
              }
            }
          }
        }

        // Tạo các term range chưa tồn tại và lấy ID
        for (const group of formConfig.groups) {
          if (group.filterType === 'range') {
            const input = rangeInputs[group._id];
            if (input && input.value.trim()) {
              const val = input.value.trim();
              const unit = input.unit.trim();
              const termName = `${val}${unit}`;
              
              // Tìm term sẵn có
              const existingTerm = group.terms.find(t => t.name === termName);
              if (existingTerm) {
                rangeTermIds.push(existingTerm._id);
              } else {
                try {
                  // Tạo mới term
                  const newTermId = await createAttributeTerm({
                    groupId: group._id,
                    name: termName,
                    slug: termName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    active: true
                  });
                  rangeTermIds.push(newTermId);
                } catch (err) {
                  console.error(err);
                  toast.error(`Không thể tạo giá trị thuộc tính "${termName}"`);
                  setIsSubmitting(false);
                  return;
                }
              }
            }
          }
        }
      }

      const resolvedStock = productType === 'digital' || hideBaseStock ? 0 : (Number.parseInt(stock) || 0);
      const resolvedMetaTitle = truncateText(name.trim(), 60);
      const resolvedMetaDescription = truncateText(stripHtml(description || ''), 160);
      const resolvedGalleryItems = galleryItems
        .map(item => ({ url: item.url, storageId: item.storageId }))
        .filter(item => Boolean(item.url));
      const resolvedImages = resolvedGalleryItems.map(item => item.url);
      const resolvedImageStorageIds = resolvedGalleryItems.map(item => item.storageId ?? null);
      const resolvedSalePrice = hideBasePricing ? undefined : resolveSalePrice(salePrice);
      await createProduct({
        ...(isAffiliateMode ? { affiliateLink: affiliateLink.trim() || undefined } : {}),
        categoryId: categoryId as Id<"productCategories">,
        additionalCategoryIds: multiCategoryEnabled
          ? additionalCategoryIds.filter((id) => id !== categoryId) as Id<"productCategories">[]
          : undefined,
        description: description.trim() || undefined,
        renderType,
        markdownRender: markdownRender.trim() || undefined,
        htmlRender: htmlRender.trim() || undefined,
        hasVariants: variantEnabled ? hasVariants : false,
        image,
        imageStorageId: image ? (imageStorageId ?? null) : null,
        images: enabledFields.has('images') ? resolvedImages : undefined,
        imageStorageIds: enabledFields.has('images') ? resolvedImageStorageIds : undefined,
        metaDescription: enabledFields.has('metaDescription')
          ? (metaDescription.trim() || resolvedMetaDescription || undefined)
          : undefined,
        metaTitle: enabledFields.has('metaTitle')
          ? (metaTitle.trim() || resolvedMetaTitle || undefined)
          : undefined,
        name: name.trim(),
        options: variantPayload.options,
        variants: variantPayload.variants,
        price: hideBasePricing ? 0 : (Number.parseInt(price) || 0),
        salePrice: resolvedSalePrice,
        sku: resolvedProductSku,
        slug: slug.trim() || name.toLowerCase().replaceAll(/\s+/g, '-'),
        status,
        stock: resolvedStock,
        productTypeId: enableProductTypes && productTypeId ? productTypeId as Id<"productTypes"> : undefined,
        attributeTermIds: enableProductTypes ? [...attributeTermIds, ...rangeTermIds] : undefined,
        productType: digitalEnabled ? productType : undefined,
        digitalDeliveryType: digitalEnabled && productType === 'digital' ? digitalDeliveryType : undefined,
        digitalCredentialsTemplate: digitalEnabled && productType === 'digital' && Object.keys(digitalCredentialsTemplate).length > 0
          ? digitalCredentialsTemplate
          : undefined,
        combos: showCombosPanel ? combos : undefined,
      });
      toast.success("Tạo sản phẩm mới thành công");
      router.push('/admin/products');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo sản phẩm'));
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm sản phẩm mới</h1>
          <Link href="/admin/products" className="text-sm text-orange-600 hover:underline">Quay lại danh sách</Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tên sản phẩm <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input value={name} onChange={handleNameChange} required placeholder="Nhập tên sản phẩm..." autoFocus />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={handleCopyName}
                    disabled={!name.trim()}
                    title="Copy tên sản phẩm"
                    aria-label="Copy tên sản phẩm"
                  >
                    {isNameCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>
              <div className={enabledFields.has('sku') ? "grid grid-cols-2 gap-4" : ""}>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="tu-dong-tao-tu-ten" className="font-mono text-sm" />
                </div>
                {enabledFields.has('sku') && (
                  <div className="space-y-2">
                    <Label>Mã gốc SKU / Prefix</Label>
                    <Input
                      value={sku || generatedSku || ''}
                      onChange={(e) =>{  setSku(e.target.value); }}
                      placeholder="Mã SKU được hệ thống tự động sinh..."
                      className="font-mono bg-slate-50 dark:bg-slate-900 cursor-not-allowed"
                      disabled={true}
                    />
                    {skuExists === true && (
                      <p className="text-xs text-red-500">SKU này đã tồn tại.</p>
                    )}
                    <p className="text-xs text-slate-500">Mã SKU được sinh tự động dựa trên danh mục chính và số thứ tự độc lập.</p>
                  </div>
                )}
              </div>
              {enabledFields.has('description') && (
                <div className="space-y-2">
                  <Label>Mô tả sản phẩm</Label>
                    <LexicalEditor onChange={setDescription} initialContent={description} resetKey={editorResetKey} />
                </div>
              )}
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

          <Card>
            <CardHeader><CardTitle className="text-base">Giá & Kho hàng</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!hideBasePricing && (
                <div className={enabledFields.has('salePrice') ? "grid grid-cols-2 gap-4" : ""}>
                  <div className="space-y-2">
                    <Label>
                      Giá bán (VNĐ)
                      {isPriceRequired && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) =>{  setPrice(e.target.value); }}
                      required={isPriceRequired}
                      placeholder="0"
                      min="0"
                    />
                    {priceHelper && (
                      <p className="text-xs text-slate-500">{priceHelper}</p>
                    )}
                  </div>
                  {enabledFields.has('salePrice') && (
                    <div className="space-y-2">
                      <Label>Giá so sánh (trước giảm)</Label>
                      <Input type="number" value={salePrice} onChange={(e) =>{  setSalePrice(e.target.value); }} placeholder="0" min="0" />
                      {salePriceHelper && (
                        <p className="text-xs text-slate-500">{salePriceHelper}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {enabledFields.has('stock') && productType !== 'digital' && !hideBaseStock && (
                <div className="space-y-2">
                  <Label>Số lượng tồn kho</Label>
                  <Input type="number" value={stock} onChange={(e) =>{  setStock(e.target.value); }} placeholder="0" min="0" />
                </div>
              )}
              {isAffiliateMode && (
                <div className="space-y-2">
                  <Label>Link Affiliate <span className="text-red-500">*</span></Label>
                  <Input
                    type="url"
                    value={affiliateLink}
                    onChange={(e) => { setAffiliateLink(e.target.value); }}
                    placeholder="https://..."
                    required
                  />
                  <p className="text-xs text-slate-500">Nút “Mua ngay” trên frontend sẽ mở link này.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {digitalEnabled && (
            <Card>
              <CardHeader><CardTitle className="text-base">Loại sản phẩm</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {showProductTypeSelector && (
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        checked={productType === 'physical'}
                        onChange={() => setProductType('physical')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Vật lý (cần giao hàng)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        checked={productType === 'digital'}
                        onChange={() => setProductType('digital')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Digital (giao qua mạng)</span>
                    </label>
                  </div>
                )}

                {productType === 'digital' && (
                  <>
                    <div className="space-y-2">
                      <Label>Loại giao hàng Digital</Label>
                      <select
                        value={digitalDeliveryType}
                        onChange={(e) => setDigitalDeliveryType(e.target.value as 'account' | 'license' | 'download' | 'custom')}
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                      >
                        <option value="account">Tài khoản (username/password)</option>
                        <option value="license">License Key</option>
                        <option value="download">File Download</option>
                        <option value="custom">Tùy chỉnh</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Template Credentials (tùy chọn)</Label>
                      <p className="text-xs text-slate-500">Nhập sẵn thông tin sẽ tự động giao khi xác nhận thanh toán</p>
                      <DigitalCredentialsForm
                        type={digitalDeliveryType}
                        value={digitalCredentialsTemplate}
                        onChange={setDigitalCredentialsTemplate}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {variantEnabled && (
            <Card>
              <CardHeader><CardTitle className="text-base">Phiên bản sản phẩm</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Quản lý tùy chọn</Label>
                  <Link href="/admin/product-options" target="_blank">
                    <Button type="button" variant="outline" className="h-7 px-2 text-xs gap-1">
                      <ExternalLink size={12} />
                      Mở
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="has-variants"
                    checked={hasVariants}
                    onChange={(e) =>{  setHasVariants(e.target.checked); }}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="has-variants" className="cursor-pointer">Sản phẩm có nhiều phiên bản</Label>
                </div>
                {hasVariants && (
                  <InlineMatrixBuilder
                    baseSku={resolvedSkuPreview || 'SP'}
                    basePrice={Number.parseInt(price) || 0}
                    optionCatalog={optionCatalog}
                    initialSelections={variantSelections}
                    initialVariants={variantRows}
                    onChange={(selections, variants) => {
                      setVariantSelections(selections);
                      setVariantRows(variants);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {showCombosPanel && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-orange-500 shrink-0" />
                  <div>
                    <CardTitle className="text-base">Cấu hình Combo</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">Để trống giá combo thì trang sản phẩm sẽ hiện "Liên hệ".</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCombos(prev => [
                        ...prev,
                        {
                          name: '',
                          type: 'standard',
                          standardConfig: {
                            minQty: 2,
                            rewardType: 'discount_percent',
                            rewardValue: 10,
                          }
                        }
                      ]);
                    }}
                    className="gap-1"
                  >
                    <Plus size={14} /> Thêm combo thường
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCombos(prev => [
                        ...prev,
                        {
                          name: '',
                          type: 'mix',
                          mixConfig: {
                            items: [],
                            rewardType: 'discount_percent',
                            rewardValue: 10,
                          }
                        }
                      ]);
                    }}
                    className="gap-1"
                  >
                    <Plus size={14} /> Thêm combo mix
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {combos.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/20 dark:bg-slate-900/10">
                    Chưa có cấu hình combo nào cho sản phẩm này.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {combos.map((combo, index) => (
                        <motion.div
                          key={combo.syncId || `combo-${index}`}
                          initial={{ opacity: 0, height: 0, y: 15 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -15 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          layout
                          className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/30 space-y-4 relative overflow-hidden"
                        >
                          {/* Header của Combo Card */}
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                combo.type === 'standard' 
                                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' 
                                  : 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400'
                              }`}>
                                {combo.type === 'standard' ? 'Combo thường' : 'Combo mix'}
                              </span>
                              {combo.type === 'mix' && combo.isSynced && (
                                <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  Đã đồng bộ
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md p-0 flex items-center justify-center"
                              onClick={() => {
                                setCombos(prev => prev.filter((_, i) => i !== index));
                              }}
                              title="Xóa combo"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>

                          {/* Nội dung Form tên và giá */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Tên combo (Tùy chọn)</Label>
                              <Input
                                value={combo.name}
                                onChange={(e) => {
                                  const next = [...combos];
                                  next[index].name = e.target.value;
                                  setCombos(next);
                                }}
                                placeholder="VD: Mua 5 chai nha, Set Quà Tết"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Giá combo (VND - Tùy chọn)</Label>
                              <Input
                                type="number"
                                value={combo.price ?? ''}
                                onChange={(e) => {
                                  const next = [...combos];
                                  next[index].price = e.target.value ? Number(e.target.value) : undefined;
                                  setCombos(next);
                                }}
                                placeholder="Liên hệ"
                              />
                            </div>
                          </div>

                          {/* Chi tiết từng loại combo: Standard */}
                          {combo.type === 'standard' && combo.standardConfig && (
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label className="text-xs">Số lượng mua tối thiểu <span className="text-red-500">*</span></Label>
                                <Input
                                  type="number"
                                  value={combo.standardConfig.minQty}
                                  onChange={(e) => {
                                    const next = [...combos];
                                    next[index].standardConfig.minQty = Math.max(1, Number(e.target.value));
                                    setCombos(next);
                                  }}
                                  min={1}
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Hình thức ưu đãi <span className="text-red-500">*</span></Label>
                                <select
                                  value={combo.standardConfig.rewardType}
                                  onChange={(e) => {
                                    const next = [...combos];
                                    next[index].standardConfig.rewardType = e.target.value;
                                    if (e.target.value === 'gift_self') {
                                      next[index].standardConfig.giftQty = 1;
                                      next[index].standardConfig.giftProductId = undefined;
                                      next[index].standardConfig.rewardValue = undefined;
                                    } else if (e.target.value === 'gift_other') {
                                      next[index].standardConfig.giftQty = 1;
                                      next[index].standardConfig.rewardValue = undefined;
                                    } else {
                                      next[index].standardConfig.rewardValue = 10;
                                      next[index].standardConfig.giftProductId = undefined;
                                      next[index].standardConfig.giftQty = undefined;
                                    }
                                    setCombos(next);
                                  }}
                                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                >
                                  <option value="discount_percent">Giảm giá theo %</option>
                                  <option value="discount_amount">Giảm số tiền cụ thể</option>
                                  <option value="gift_self">Tặng thêm chính sản phẩm này</option>
                                  <option value="gift_other">Tặng sản phẩm khác</option>
                                </select>
                              </div>

                              {/* Mức giảm giá */}
                              {(combo.standardConfig.rewardType === 'discount_percent' || combo.standardConfig.rewardType === 'discount_amount') && (
                                <div className="space-y-1 md:col-span-2">
                                  <Label className="text-xs">
                                    Mức giảm giá{' '}
                                    {combo.standardConfig.rewardType === 'discount_percent' ? '(%)' : '(VND)'}
                                  </Label>
                                  <Input
                                    type="number"
                                    value={combo.standardConfig.rewardValue ?? ''}
                                    onChange={(e) => {
                                      const next = [...combos];
                                      next[index].standardConfig.rewardValue = Number(e.target.value);
                                      setCombos(next);
                                    }}
                                    min={1}
                                    max={combo.standardConfig.rewardType === 'discount_percent' ? 100 : undefined}
                                    required
                                  />
                                </div>
                              )}

                              {/* Tặng chính sản phẩm */}
                              {combo.standardConfig.rewardType === 'gift_self' && (
                                <div className="space-y-1 md:col-span-2">
                                  <Label className="text-xs">Số lượng tặng <span className="text-red-500">*</span></Label>
                                  <Input
                                    type="number"
                                    value={combo.standardConfig.giftQty ?? 1}
                                    onChange={(e) => {
                                      const next = [...combos];
                                      next[index].standardConfig.giftQty = Math.max(1, Number(e.target.value));
                                      setCombos(next);
                                    }}
                                    min={1}
                                    required
                                  />
                                </div>
                              )}

                              {/* Tặng sản phẩm khác */}
                              {combo.standardConfig.rewardType === 'gift_other' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Sản phẩm tặng kèm <span className="text-red-500">*</span></Label>
                                    <select
                                      value={combo.standardConfig.giftProductId ?? ''}
                                      onChange={(e) => {
                                        const next = [...combos];
                                        next[index].standardConfig.giftProductId = e.target.value ? e.target.value : undefined;
                                        setCombos(next);
                                      }}
                                      className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                      required
                                    >
                                      <option value="">-- Chọn sản phẩm tặng --</option>
                                      {allActiveProducts.map((p: any) => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Số lượng tặng <span className="text-red-500">*</span></Label>
                                    <Input
                                      type="number"
                                      value={combo.standardConfig.giftQty ?? 1}
                                      onChange={(e) => {
                                        const next = [...combos];
                                        next[index].standardConfig.giftQty = Math.max(1, Number(e.target.value));
                                        setCombos(next);
                                      }}
                                      min={1}
                                      required
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Chi tiết từng loại combo: Mix */}
                          {combo.type === 'mix' && combo.mixConfig && (
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-xs">Số lượng của sản phẩm này trong combo <span className="text-red-500">*</span></Label>
                                  <Input
                                    type="number"
                                    value={combo.mixConfig.currentProductQty ?? 1}
                                    onChange={(e) => {
                                      const next = [...combos];
                                      next[index].mixConfig.currentProductQty = Math.max(1, Number(e.target.value));
                                      setCombos(next);
                                    }}
                                    min={1}
                                    required
                                  />
                                </div>
                                
                                {/* Checkbox đối xứng thẳng hàng */}
                                <div className="space-y-1 flex flex-col justify-end pb-2">
                                  <Label className="text-xs text-slate-400 dark:text-slate-500">Đồng bộ liên kết</Label>
                                  <div className="flex items-center gap-2 h-10 border border-slate-100 dark:border-slate-800/50 rounded-md px-3 bg-white dark:bg-slate-900/50">
                                    <input
                                      type="checkbox"
                                      id={`sync-combo-${index}`}
                                      checked={combo.isSynced ?? false}
                                      onChange={(e) => {
                                        const next = [...combos];
                                        next[index].isSynced = e.target.checked;
                                        if (e.target.checked && !next[index].syncId) {
                                          next[index].syncId = 'sync-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                                        }
                                        setCombos(next);
                                      }}
                                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <Label htmlFor={`sync-combo-${index}`} className="text-xs font-medium cursor-pointer select-none">
                                      Đồng bộ Combo sang các sản phẩm kèm
                                    </Label>
                                  </div>
                                </div>
                              </div>

                              {/* Danh sách sản phẩm mua kèm thêm */}
                              <div className="space-y-2 bg-white dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 p-3 rounded-lg">
                                <div className="flex justify-between items-center pb-1">
                                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sản phẩm mua kèm thêm (Tối đa 5 sản phẩm)</Label>
                                  {(combo.mixConfig.items?.length ?? 0) < 5 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[11px] gap-1 px-2"
                                      onClick={() => {
                                        const next = [...combos];
                                        const currentItems = next[index].mixConfig.items || [];
                                        next[index].mixConfig.items = [
                                          ...currentItems,
                                          { productId: '', quantity: 1 }
                                        ];
                                        setCombos(next);
                                      }}
                                    >
                                      <Plus size={11} /> Thêm sản phẩm kèm
                                    </Button>
                                  )}
                                </div>
                                
                                {(combo.mixConfig.items?.length ?? 0) === 0 ? (
                                  <p className="text-xs text-slate-400 py-1 italic">Chưa chọn sản phẩm kèm nào. Vui lòng bấm "Thêm sản phẩm kèm".</p>
                                ) : (
                                  <div className="space-y-2">
                                    <AnimatePresence initial={false}>
                                      {combo.mixConfig.items.map((item: any, itemIndex: number) => (
                                        <motion.div 
                                          key={itemIndex}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 10 }}
                                          transition={{ duration: 0.15 }}
                                          className="flex gap-2 items-center"
                                        >
                                          <select
                                            value={item.productId}
                                            onChange={(e) => {
                                              const next = [...combos];
                                              next[index].mixConfig.items[itemIndex].productId = e.target.value;
                                              setCombos(next);
                                            }}
                                            className="flex-1 h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs"
                                            required
                                          >
                                            <option value="">-- Chọn sản phẩm --</option>
                                            {allActiveProducts.map((p: any) => (
                                              <option key={p._id} value={p._id}>{p.name}</option>
                                            ))}
                                          </select>
                                          <div className="w-20 shrink-0">
                                            <Input
                                              type="number"
                                              value={item.quantity}
                                              onChange={(e) => {
                                                const next = [...combos];
                                                next[index].mixConfig.items[itemIndex].quantity = Math.max(1, Number(e.target.value));
                                                setCombos(next);
                                              }}
                                              min={1}
                                              className="h-9 text-xs"
                                              placeholder="SL"
                                              required
                                            />
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-slate-400 hover:text-red-500 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-md"
                                            onClick={() => {
                                              const next = [...combos];
                                              next[index].mixConfig.items = next[index].mixConfig.items.filter((_: any, i: number) => i !== itemIndex);
                                              setCombos(next);
                                            }}
                                          >
                                            <Trash size={14} />
                                          </Button>
                                        </motion.div>
                                      ))}
                                    </AnimatePresence>
                                  </div>
                                )}
                              </div>

                              {/* Hình thức ưu đãi mix */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-xs">Hình thức ưu đãi <span className="text-red-500">*</span></Label>
                                  <select
                                    value={combo.mixConfig.rewardType}
                                    onChange={(e) => {
                                      const next = [...combos];
                                      next[index].mixConfig.rewardType = e.target.value;
                                      if (e.target.value === 'gift_other') {
                                        next[index].mixConfig.giftQty = 1;
                                        next[index].mixConfig.rewardValue = undefined;
                                      } else {
                                        next[index].mixConfig.rewardValue = 10;
                                        next[index].mixConfig.giftProductId = undefined;
                                        next[index].mixConfig.giftQty = undefined;
                                      }
                                      setCombos(next);
                                    }}
                                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                  >
                                    <option value="discount_percent">Giảm giá theo %</option>
                                    <option value="discount_amount">Giảm số tiền cụ thể</option>
                                    <option value="gift_other">Tặng sản phẩm khác</option>
                                  </select>
                                </div>

                                {/* Mức giảm giá mix */}
                                {(combo.mixConfig.rewardType === 'discount_percent' || combo.mixConfig.rewardType === 'discount_amount') && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      Mức giảm giá{' '}
                                      {combo.mixConfig.rewardType === 'discount_percent' ? '(%)' : '(VND)'}
                                    </Label>
                                    <Input
                                      type="number"
                                      value={combo.mixConfig.rewardValue ?? ''}
                                      onChange={(e) => {
                                        const next = [...combos];
                                        next[index].mixConfig.rewardValue = Number(e.target.value);
                                        setCombos(next);
                                      }}
                                      min={1}
                                      max={combo.mixConfig.rewardType === 'discount_percent' ? 100 : undefined}
                                      required
                                    />
                                  </div>
                                )}

                                {/* Tặng sản phẩm khác mix */}
                                {combo.mixConfig.rewardType === 'gift_other' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Sản phẩm tặng kèm <span className="text-red-500">*</span></Label>
                                      <select
                                        value={combo.mixConfig.giftProductId ?? ''}
                                        onChange={(e) => {
                                          const next = [...combos];
                                          next[index].mixConfig.giftProductId = e.target.value ? e.target.value : undefined;
                                          setCombos(next);
                                        }}
                                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                        required
                                      >
                                        <option value="">-- Chọn sản phẩm tặng --</option>
                                        {allActiveProducts.map((p: any) => (
                                          <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Số lượng tặng <span className="text-red-500">*</span></Label>
                                      <Input
                                        type="number"
                                        value={combo.mixConfig.giftQty ?? 1}
                                        onChange={(e) => {
                                          const next = [...combos];
                                          next[index].mixConfig.giftQty = Math.max(1, Number(e.target.value));
                                          setCombos(next);
                                        }}
                                        min={1}
                                        required
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
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
                      placeholder="Lấy theo tên sản phẩm nếu để trống"
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
                      placeholder="Lấy theo mô tả sản phẩm nếu bạn để trống"
                    />
                  </div>
                )}
                <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm">
                  <div className="text-blue-600 font-medium truncate">
                    {metaTitle.trim() || name || 'Tên sản phẩm'}
                  </div>
                  <div className="text-emerald-600 text-xs">
                    /{categorySlugPreview}/{slug || 'san-pham'}
                  </div>
                  <div className="text-slate-600 text-xs mt-1 line-clamp-2">
                    {metaDescription.trim() || stripHtml(description || '') || 'Mô tả ngắn sẽ hiển thị tại đây.'}
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
                  onChange={(e) =>{  setStatus(e.target.value as 'Draft' | 'Active' | 'Archived'); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="Draft">Bản nháp</option>
                  <option value="Active">Đang bán</option>
                  <option value="Archived">Lưu trữ</option>
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
                  {hasTaxonomyConflict && (
                    <p className="text-xs font-semibold text-red-500 mt-1.5">
                      Lưu ý: Các danh mục được chọn đang thuộc các kiểu sản phẩm khác nhau. 
                      Vui lòng chọn các danh mục thuộc cùng một kiểu sản phẩm để đảm bảo bộ lọc thuộc tính đồng nhất.
                    </p>
                  )}
                  </>
                ) : (
                  <ProductCategoryCombobox
                    categories={categoriesData}
                    value={categoryId}
                    onChange={setCategoryId}
                    onQuickCreate={() =>{  setShowCategoryModal(true); }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
          
          {enableProductTypes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Phân loại chuyên sâu</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kiểu sản phẩm</Label>
                  <select
                    value={productTypeId}
                    onChange={(e) => {
                      setProductTypeId(e.target.value);
                      setAttributeTermIds([]); // Reset terms when type changes
                    }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="">Chọn kiểu sản phẩm...</option>
                    {availableProductTypes.map((type) => (
                      <option key={type._id} value={type._id}>{type.name}</option>
                    ))}
                  </select>
                  {categoryId && categoryProductTypesData && categoryProductTypesData.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Đang gợi ý theo danh mục đã chọn. Nếu danh mục chỉ có một kiểu, hệ thống tự chọn để hiện đúng thuộc tính.
                    </p>
                  )}
                </div>
                {formConfig && formConfig.groups.map(group => {
                    const isRange = group.filterType === 'range';
                    const IconComponent = getAttributeIconComponent(group.iconPath);
                    const iconColor = group.displayConfig?.iconColor || group.displayConfig?.color || '#ea580c';
                    
                    const renderLabelWithIcon = () => (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {group.iconPath && (
                            <span style={{ color: iconColor }} className="shrink-0">
                              <IconComponent size={16} />
                            </span>
                          )}
                          <Label className="text-sm font-semibold">{group.name}</Label>
                        </div>
                        {!isRange && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-500 hover:text-[#9B2C3B] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md shrink-0"
                            onClick={() => handleAddStandardTerm(group)}
                            title={`Thêm nhanh giá trị cho ${group.name}`}
                          >
                            <Plus size={14} />
                          </Button>
                        )}
                      </div>
                    );
                    
                    if (isRange) {
                    const currentInput = rangeInputs[group._id] || { value: '', unit: '%' };
                    const dominantUnit = getDominantUnit(group.terms);
                    const isUnitDifferent = dominantUnit && currentInput.value && currentInput.unit !== dominantUnit;
                    const configuredUnits = (group.displayConfig?.units as string[]) || ['%', 'ml', 'kg', 'g'];
                    const availableUnits = currentInput.unit && !configuredUnits.includes(currentInput.unit)
                      ? [...configuredUnits, currentInput.unit]
                      : configuredUnits;
                    
                    const handleAddUnit = async () => {
                      const newUnit = window.prompt(`Nhập đơn vị mới cho nhóm thuộc tính "${group.name}":`);
                      if (newUnit && newUnit.trim()) {
                        const trimmedUnit = newUnit.trim();
                        if (availableUnits.includes(trimmedUnit)) {
                          toast.error("Đơn vị này đã tồn tại.");
                          return;
                        }
                        const updatedUnits = [...availableUnits, trimmedUnit];
                        try {
                          await updateAttributeGroup({
                            id: group._id,
                            displayConfig: {
                              ...group.displayConfig,
                              units: updatedUnits
                            }
                          });
                          setRangeInputs(prev => ({
                            ...prev,
                            [group._id]: { ...prev[group._id], unit: trimmedUnit }
                          }));
                          toast.success(`Đã thêm đơn vị "${trimmedUnit}" thành công`);
                        } catch (err) {
                          console.error(err);
                          toast.error("Không thể lưu đơn vị mới");
                        }
                      }
                    };

                    return (
                      <div key={group._id} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {renderLabelWithIcon()}
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            step="any"
                            placeholder="Nhập giá trị số..."
                            value={currentInput.value}
                            onChange={(e) => {
                              setRangeInputs(prev => ({
                                ...prev,
                                [group._id]: { ...(prev[group._id] || { unit: dominantUnit || '%' }), value: e.target.value }
                              }));
                            }}
                            className="flex-1 h-9 text-sm"
                          />
                          <select
                            value={currentInput.unit}
                            onChange={(e) => {
                              setRangeInputs(prev => ({
                                ...prev,
                                [group._id]: { ...(prev[group._id] || { value: '' }), unit: e.target.value }
                              }));
                            }}
                            className="h-9 w-24 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                          >
                            {availableUnits.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddUnit}
                            className="h-9 w-9 px-0 shrink-0"
                            title="Thêm đơn vị mới"
                          >
                            +
                          </Button>
                        </div>
                        {isUnitDifferent && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            ⚠️ Đơn vị đang chọn ({currentInput.unit}) khác với đơn vị phổ biến ({dominantUnit}).
                          </p>
                        )}
                      </div>
                    );
                  }

                  const hasManyTerms = group.terms.length > 10;
                  const searchText = searchTerms[group._id] || '';
                  const filteredTerms = hasManyTerms && searchText.trim()
                    ? group.terms.filter(term => removeTones(term.name).includes(removeTones(searchText)))
                    : group.terms;

                  return (
                    <div key={group._id} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {renderLabelWithIcon()}
                      {hasManyTerms && (
                        <Input
                          type="text"
                          placeholder={`Tìm nhanh ${group.name.toLowerCase()}...`}
                          value={searchText}
                          onChange={(e) => {
                            setSearchTerms(prev => ({ ...prev, [group._id]: e.target.value }));
                          }}
                          className="h-8 text-xs mb-2 bg-white dark:bg-slate-800"
                        />
                      )}
                      <div className={`grid grid-cols-2 gap-2 mt-1 ${hasManyTerms ? 'max-h-48 overflow-y-auto pr-1' : ''}`}>
                        {filteredTerms.map(term => {
                          const isSelected = attributeTermIds.includes(term._id);
                          const isSingle = group.inputType === 'radio' || group.filterType === 'single';
                          
                          return (
                            <label
                              key={term._id}
                              className={`flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-lg border transition-all duration-200 select-none shadow-sm active:scale-[0.98] ${
                                isSelected
                                  ? 'bg-[#9B2C3B]/5 dark:bg-[#9B2C3B]/10 border-[#9B2C3B] dark:border-[#9B2C3B]'
                                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <input
                                type={isSingle ? 'radio' : 'checkbox'}
                                name={`attr_${group._id}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (isSingle) {
                                    const otherTermIds = group.terms.map(t => t._id).filter(id => id !== term._id);
                                    setAttributeTermIds(prev => [...prev.filter(id => !otherTermIds.includes(id)), term._id]);
                                  } else {
                                    if (e.target.checked) {
                                      setAttributeTermIds(prev => [...prev, term._id]);
                                    } else {
                                      setAttributeTermIds(prev => prev.filter(id => id !== term._id));
                                    }
                                  }
                                }}
                                className="sr-only"
                              />
                              
                              {/* Custom Indicator */}
                              {isSingle ? (
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all bg-white dark:bg-slate-950 shrink-0 ${
                                  isSelected ? 'border-[#9B2C3B]' : 'border-slate-300 dark:border-slate-700'
                                }`}>
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-[#9B2C3B] scale-100 transition-transform duration-200" />
                                  )}
                                </div>
                              ) : (
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                                  isSelected ? 'bg-[#9B2C3B] border-[#9B2C3B]' : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              )}
                              
                              <span className={`text-xs truncate ${
                                isSelected
                                  ? 'text-[#9B2C3B] dark:text-[#f43f5e] font-semibold'
                                  : 'text-slate-700 dark:text-slate-300 font-normal'
                              }`}>
                                {term.name}
                              </span>
                            </label>
                          );
                        })}
                        {filteredTerms.length === 0 && (
                          <p className="col-span-2 text-xs text-slate-400 italic text-center py-2">
                            Không tìm thấy kết quả
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Ảnh sản phẩm</CardTitle></CardHeader>
            <CardContent>
              <ImageUploader
                value={image}
                storageId={imageStorageId}
                onChange={(url, storageId) => {
                  setImage(url);
                  setImageStorageId(storageId);
                }}
                folder="products"
                naming={{ entityName: slug.trim() || 'product', style: 'slug-index', index: 1 }}
                deleteMode="defer"
                aspectRatio="square"
                cropAspectRatio={defaultImageAspectRatio}
              />
            </CardContent>
          </Card>

          {enabledFields.has('images') && image && (
            <Card>
              <CardHeader><CardTitle className="text-base">Thư viện ảnh</CardTitle></CardHeader>
              <CardContent>
                <MultiImageUploader<ImageItem>
                  items={galleryItems}
                  onChange={setGalleryItems}
                  folder="products"
                  naming={{ entityName: slug.trim() || 'product', style: 'slug-index' }}
                  namingIndexOffset={1}
                  deleteMode="defer"
                  imageKey="url"
                  minItems={0}
                  maxItems={20}
                  aspectRatio="square"
                  enableCrop={enableImageCrop}
                  cropAspectRatio={defaultImageAspectRatio}
                  imageAspectRatio={defaultImageAspectRatio}
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

      <HomeComponentStickyFooter
        isSubmitting={isSubmitting}
        submitLabel="Tạo sản phẩm"
        onCancel={() =>{  router.push('/admin/products'); }}
        disableSave={isSubmitting || hasTaxonomyConflict}
      >
        <>
          <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/products'); }}>Hủy bỏ</Button>
          <div className="flex flex-wrap justify-end gap-2">
            <AiEntityImportDialog
              kind="product"
              enabledFields={enabledFields}
              onApply={handleApplyAiProduct}
              enableProductTypes={enableProductTypes}
              enableCombos={enableCombos}
              formConfig={formConfig}
            />
            <Button type="button" variant="secondary" onClick={() =>{  setStatus('Draft'); }} disabled={isSubmitting || hasTaxonomyConflict}>Lưu nháp</Button>
            <Button type="submit" variant="accent" disabled={isSubmitting || hasTaxonomyConflict}>
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              Tạo sản phẩm
            </Button>
          </div>
        </>
      </HomeComponentStickyFooter>
    </form>
    </>
  );
}
