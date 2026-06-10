'use client';

import React, { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGuard } from '../../../../components/ModuleGuard';
import { VariantForm, type VariantFormPayload } from '../components/VariantForm';

const MODULE_KEY = 'products';

export default function ProductVariantCreatePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ModuleGuard moduleKey="products">
      <ProductVariantCreateContent params={params} />
    </ModuleGuard>
  );
}

function ProductVariantCreateContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = id as Id<'products'>;
  const router = useRouter();

  const productData = useQuery(api.products.getById, { id: productId });
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const optionsData = useQuery(api.productOptions.listActive);
  const valuesData = useQuery(api.productOptionValues.listAll, { limit: 500 });
  const createVariant = useMutation(api.productVariants.create);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const variantEnabled = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantEnabled');
    return Boolean(setting?.value);
  }, [settingsData]);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const variantSettings = useMemo(() => {
    const getSetting = (key: string, fallback: string) => {
      const setting = settingsData?.find(s => s.settingKey === key);
      return (setting?.value as string) || fallback;
    };
    return {
      variantImages: getSetting('variantImages', 'inherit'),
      variantPricing: getSetting('variantPricing', 'variant'),
      variantStock: getSetting('variantStock', 'variant'),
    };
  }, [settingsData]);

  const productOptions = useMemo(() => {
    if (!productData?.optionIds || !optionsData) {return [];}
    const optionIdSet = new Set(productData.optionIds);
    return optionsData
      .filter(option => optionIdSet.has(option._id))
      .sort((a, b) => a.order - b.order);
  }, [productData?.optionIds, optionsData]);

  const handleSubmit = async (payload: VariantFormPayload) => {
    setIsSubmitting(true);
    try {
      await createVariant({
        ...payload,
        productId,
      });
      toast.success('Tạo phiên bản thành công');
      router.push(`/admin/products/${productId}/variants`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo phiên bản');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (productData === undefined || fieldsData === undefined || settingsData === undefined || optionsData === undefined || valuesData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (!productData) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy sản phẩm</div>;
  }

  if (!variantEnabled) {
    return (
      <div className="text-center py-10 text-slate-500 space-y-2">
        <p>Tính năng phiên bản đang tắt. Vui lòng liên hệ quản trị viên để bật tính năng này.</p>
      </div>
    );
  }

  if (!productData.hasVariants || productData.optionIds?.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 space-y-2">
        <p>Sản phẩm chưa bật phiên bản hoặc chưa chọn tùy chọn.</p>
        <Link href={`/admin/products/${productId}/edit`} className="text-orange-600 hover:underline">Cập nhật sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tạo phiên bản mới</h1>
        <Link href={`/admin/products/${productId}/variants`} className="text-sm text-orange-600 hover:underline">Quay lại danh sách phiên bản</Link>
      </div>
      <VariantForm
        isSubmitting={isSubmitting}
        onCancel={() =>{  router.push(`/admin/products/${productId}/variants`); }}
        onSubmit={handleSubmit}
        options={productOptions}
        optionValues={valuesData}
        product={productData}
        settings={{ ...variantSettings, skuEnabled: enabledFields.has('sku'), barcodeEnabled: enabledFields.has('barcode') }}
        submitLabel="Tạo phiên bản"
      />
    </div>
  );
}
