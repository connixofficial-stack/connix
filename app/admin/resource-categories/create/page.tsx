'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { FolderTree, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';

const MODULE_KEY = 'resourceCategories';

const generateSlug = (value: string) => value.toLowerCase()
  .normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd')
  .replaceAll(/[^a-z0-9\s]/g, '')
  .replaceAll(/\s+/g, '-');

export default function ResourceCategoryCreatePage() {
  const router = useRouter();
  const createCategory = useMutation(api.resourceCategories.create);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enabledFields = useMemo(() => new Set(fieldsData?.map((field) => field.fieldKey) ?? []), [fieldsData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {return;}

    setIsSubmitting(true);
    try {
      await createCategory({
        active: true,
        description: description.trim() || undefined,
        name: name.trim(),
        slug: slug.trim(),
      });
      toast.success('Đã tạo danh mục tài nguyên');
      router.push('/admin/resource-categories');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo danh mục'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2">
            <FolderTree className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm danh mục tài nguyên</h1>
            <Link href="/admin/resource-categories" className="text-sm text-indigo-600 hover:underline">Quay lại danh sách</Link>
          </div>
        </div>
      </div>

      <Card className="mx-auto max-w-md md:mx-0">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>Tên danh mục <span className="text-red-500">*</span></Label>
              <CopyableInput value={name} onChange={handleNameChange} required placeholder="Ví dụ: Cơ bản, Luyện thi..." autoFocus copyLabel="tên danh mục" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => { setSlug(e.target.value); }} placeholder="tu-dong-tao-tu-ten" className="font-mono text-sm" />
            </div>
            {enabledFields.has('description') && (
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={description} onChange={(e) => { setDescription(e.target.value); }} placeholder="Mô tả ngắn về danh mục..." />
              </div>
            )}
          </CardContent>
          <div className="flex justify-end gap-3 rounded-b-lg border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
            <Button type="button" variant="ghost" onClick={() => { router.push('/admin/resource-categories'); }}>Hủy bỏ</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500">
              {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Tạo danh mục
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
