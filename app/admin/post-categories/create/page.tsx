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
import { ImageUploader } from '../../components/ImageUploader';

const MODULE_KEY = 'postCategories';

export default function PostCategoryCreatePage() {
  const router = useRouter();
  const createCategory = useMutation(api.postCategories.create);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check which fields are enabled
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
        active: true,
        description: description.trim() || undefined,
        name: name.trim(),
        slug: slug.trim(),
        thumbnail,
      });
      toast.success("Đã tạo danh mục mới");
      router.push('/admin/post-categories');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, "Không thể tạo danh mục"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm danh mục mới</h1>
          <Link href="/admin/post-categories" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        </div>
      </div>

      <Card className="max-w-md mx-auto md:mx-0">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            {/* Name - always shown (system field) */}
            <div className="space-y-2">
              <Label>Tên danh mục <span className="text-red-500">*</span></Label>
              <CopyableInput value={name} onChange={handleNameChange} required placeholder="Ví dụ: Công nghệ, Đời sống..." autoFocus copyLabel="tên danh mục" />
            </div>
            {/* Slug - always shown (system field) */}
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="tu-dong-tao-tu-ten" className="font-mono text-sm" />
            </div>
            {/* Description - conditional */}
            {enabledFields.has('description') && (
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={description} onChange={(e) =>{  setDescription(e.target.value); }} placeholder="Mô tả ngắn về danh mục..." />
              </div>
            )}
            {/* Thumbnail - conditional */}
            {enabledFields.has('thumbnail') && (
              <div className="space-y-2">
                <Label>Ảnh đại diện</Label>
                <ImageUploader
                  value={thumbnail}
                  onChange={(url) =>{  setThumbnail(url); }}
                  folder="post-categories"
                  aspectRatio="video"
                />
              </div>
            )}
          </CardContent>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/post-categories'); }}>Hủy bỏ</Button>
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
