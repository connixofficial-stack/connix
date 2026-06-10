'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { ModuleGuard } from '../../components/ModuleGuard';
import { OptionForm, type ProductOptionFormValues } from '../components/OptionForm';

type DisplayType = 'dropdown' | 'buttons' | 'radio' | 'color_swatch' | 'image_swatch' | 'color_picker' | 'number_input' | 'text_input';
type InputType = 'text' | 'number' | 'color';

export default function ProductOptionCreatePage() {
  return (
    <ModuleGuard moduleKey="products">
      <ProductOptionCreateContent />
    </ModuleGuard>
  );
}

function ProductOptionCreateContent() {
  const router = useRouter();
  const createOption = useMutation(api.productOptions.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ProductOptionFormValues) => {
    setIsSubmitting(true);
    try {
      await createOption({
        active: values.active,
        compareUnit: values.compareUnit || undefined,
        displayType: values.displayType as DisplayType,
        inputType: values.inputType ? (values.inputType as InputType) : undefined,
        isPreset: false,
        name: values.name,
        showPriceCompare: values.showPriceCompare || undefined,
        slug: values.slug,
        unit: values.unit || undefined,
      });
      toast.success('Đã tạo option');
      router.push('/admin/product-options');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo option'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/product-options" className="text-sm text-orange-600 hover:underline">
          Quay lại danh sách
        </Link>
      </div>
      <OptionForm
        title="Thêm loại tùy chọn"
        submitLabel="Tạo option"
        isSubmitting={isSubmitting}
        onCancel={() =>{  router.push('/admin/product-options'); }}
        onSubmit={handleSubmit}
        autoSlug
      />
    </div>
  );
}
