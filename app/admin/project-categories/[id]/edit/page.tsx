'use client';

import React, { use, useEffect, useState } from 'react';
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
import { ModuleGuard } from '../../../components/ModuleGuard';

const generateSlug = (value: string) => value.toLowerCase()
  .normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd')
  .replaceAll(/[^a-z0-9\s]/g, '')
  .replaceAll(/\s+/g, '-');

export default function ProjectCategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ModuleGuard moduleKey="projects">
      <ProjectCategoryEditContent params={params} />
    </ModuleGuard>
  );
}

function ProjectCategoryEditContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const categoryData = useQuery(api.projectCategories.getById, { id: id as Id<'projectCategories'> });
  const categoriesData = useQuery(api.projectCategories.listAll, {});
  const updateCategory = useMutation(api.projectCategories.update);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (categoryData && !initialized) {
      setName(categoryData.name);
      setSlug(categoryData.slug);
      setDescription(categoryData.description ?? '');
      setParentId(categoryData.parentId ?? '');
      setActive(categoryData.active);
      setInitialized(true);
    }
  }, [categoryData, initialized]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) {return;}
    setIsSubmitting(true);
    try {
      await updateCategory({
        active,
        description: description.trim() || undefined,
        id: id as Id<'projectCategories'>,
        name: name.trim(),
        parentId: parentId ? parentId as Id<'projectCategories'> : undefined,
        slug: slug.trim(),
      });
      toast.success('Đã cập nhật danh mục dự án');
      router.push('/admin/project-categories');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể cập nhật danh mục dự án'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoryData === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (categoryData === null) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Không tìm thấy danh mục dự án</p>
        <Link href="/admin/project-categories" className="mt-2 inline-block text-teal-600 hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-teal-500/10 p-2">
          <FolderTree className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sửa danh mục dự án</h1>
          <Link href="/admin/project-categories" className="text-sm text-teal-600 hover:underline">Quay lại danh sách</Link>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label>Tên danh mục <span className="text-red-500">*</span></Label>
            <CopyableInput
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSlug(generateSlug(event.target.value));
              }}
              copyLabel="tên danh mục"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(event) => setSlug(event.target.value)} className="font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label>Danh mục cha</Label>
            <select
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Không có</option>
              {categoriesData?.filter((category) => category._id !== categoryData._id).map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            <span className="text-sm text-slate-700 dark:text-slate-200">Hoạt động</span>
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/project-categories')}>Hủy</Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()} className="bg-teal-600 hover:bg-teal-500">
          {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
}
