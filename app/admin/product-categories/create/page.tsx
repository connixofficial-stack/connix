'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';

const MODULE_KEY = 'productCategories';

export default function ProductCategoryCreatePage() {
  const router = useRouter();
  const createCategory = useMutation(api.productCategories.create);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

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
      await createCategory({
        active,
        description: description.trim() || undefined,
        name: name.trim(),
        slug: slug.trim(),
      });
      toast.success('Tạo danh mục thành công');
      router.push('/admin/product-categories');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm danh mục sản phẩm</h1>
          <Link href="/admin/product-categories" className="text-sm text-orange-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
      </div>

      <Card className="max-w-md mx-auto md:mx-0">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Tên danh mục <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={name} 
                onChange={handleNameChange} 
                copyLabel="tên danh mục"
                required 
                placeholder="Nhập tên danh mục..." 
                autoFocus 
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input 
                value={slug} 
                onChange={(e) =>{  setSlug(e.target.value); }} 
                placeholder="tu-dong-tao-tu-ten" 
                className="font-mono text-sm" 
              />
            </div>

            {enabledFields.has('description') && (
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <textarea
                  value={description}
                  onChange={(e) =>{  setDescription(e.target.value); }}
                  placeholder="Mô tả ngắn về danh mục..."
                  className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                />
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
          </CardContent>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() =>{  router.push('/admin/product-categories'); }}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              Tạo danh mục
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
