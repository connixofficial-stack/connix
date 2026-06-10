'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { FolderTree, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, Input, Label } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';

const MODULE_KEY = 'serviceCategories';

export default function ServiceCategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const categoryData = useQuery(api.serviceCategories.getById, { id: id as Id<"serviceCategories"> });
  const updateCategory = useMutation(api.serviceCategories.update);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  useEffect(() => {
    if (categoryData && !initialized) {
      setName(categoryData.name);
      setSlug(categoryData.slug);
      setDescription(categoryData.description ?? '');
      setActive(categoryData.active);
      setInitialized(true);
    }
  }, [categoryData, initialized]);

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
      await updateCategory({
        active,
        description: description.trim() || undefined,
        id: id as Id<"serviceCategories">,
        name: name.trim(),
        slug: slug.trim(),
      });
      toast.success("Đã cập nhật danh mục");
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, "Không thể cập nhật danh mục"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoryData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (categoryData === null) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy danh mục</p>
        <Link href="/admin/service-categories" className="text-teal-600 hover:underline mt-2 inline-block">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <FolderTree className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sửa danh mục dịch vụ</h1>
            <Link href="/admin/service-categories" className="text-sm text-teal-600 hover:underline">Quay lại danh sách</Link>
          </div>
        </div>
      </div>

      <Card className="max-w-md mx-auto md:mx-0">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Tên danh mục <span className="text-red-500">*</span></Label>
              <CopyableInput value={name} onChange={handleNameChange} required placeholder="Ví dụ: Tư vấn, Thiết kế..." autoFocus copyLabel="tên danh mục" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="tu-dong-tao-tu-ten" className="font-mono text-sm" />
            </div>
            {enabledFields.has('description') && (
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={description} onChange={(e) =>{  setDescription(e.target.value); }} placeholder="Mô tả ngắn về danh mục..." />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="active" 
                checked={active} 
                onChange={(e) =>{  setActive(e.target.checked); }}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor="active" className="cursor-pointer">Hoạt động</Label>
            </div>
          </CardContent>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/service-categories'); }}>Hủy bỏ</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-500">
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
