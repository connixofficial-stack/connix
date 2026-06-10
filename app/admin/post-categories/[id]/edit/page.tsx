'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Badge, Button, Card, CardContent, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import { ImageUploader } from '../../../components/ImageUploader';

const MODULE_KEY = 'postCategories';

export default function PostCategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const categoryData = useQuery(api.postCategories.getById, { id: id as Id<"postCategories"> });
  const postsData = useQuery(api.posts.listAll, {});
  const updateCategory = useMutation(api.postCategories.update);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  
  const [activeTab, setActiveTab] = useState('info');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check which fields are enabled - MUST be before any conditional returns
  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const relatedPosts = useMemo(() => postsData?.filter(p => p.categoryId === id) ?? [], [postsData, id]);

  useEffect(() => {
    if (categoryData) {
      setName(categoryData.name);
      setSlug(categoryData.slug);
      setDescription(categoryData.description ?? '');
      setThumbnail(categoryData.thumbnail);
      setActive(categoryData.active);
    }
  }, [categoryData]);

  if (categoryData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (categoryData === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy danh mục</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}

    setIsSubmitting(true);
    try {
      await updateCategory({
        active,
        description: description.trim() || undefined,
        id: id as Id<"postCategories">,
        name: name.trim(),
        slug: slug.trim(),
        thumbnail,
      });
      toast.success("Đã cập nhật danh mục");
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, "Không thể cập nhật danh mục"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa danh mục</h1>
          <Link href="/admin/post-categories" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.open(`https://example.com/category/${slug}`, '_blank')}>
          <ExternalLink size={16}/> Xem trên web
        </Button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() =>{  setActiveTab('info'); }}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'info' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Thông tin chung
        </button>
        <button
          onClick={() =>{  setActiveTab('posts'); }}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'posts' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Bài viết thuộc danh mục <Badge variant="secondary" className="ml-1">{relatedPosts.length}</Badge>
        </button>
      </div>

      {activeTab === 'info' ? (
        <Card className="max-w-md mx-auto md:mx-0">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-4">
              {/* Name - always shown (system field) */}
              <div className="space-y-2">
                <Label>Tên danh mục <span className="text-red-500">*</span></Label>
                <CopyableInput value={name} onChange={(e) =>{  setName(e.target.value); }} required placeholder="Ví dụ: Công nghệ, Đời sống..." autoFocus copyLabel="tên danh mục" />
              </div>
              {/* Slug - always shown (system field) */}
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="slug-cua-danh-muc" className="font-mono text-sm" />
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
              {/* Active - always shown (system field) */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={active} onChange={(e) =>{  setActive(e.target.checked); }} className="w-4 h-4" />
                <Label htmlFor="active">Hiển thị danh mục</Label>
              </div>
            </CardContent>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/post-categories'); }}>Hủy bỏ</Button>
              <Button type="submit" variant="accent" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hình ảnh</TableHead>
                <TableHead>Tiêu đề bài viết</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatedPosts.map(post => (
                <TableRow key={post._id}>
                  <TableCell>{post.thumbnail ? <Image src={post.thumbnail} width={40} height={32} className="w-10 h-8 object-cover rounded" alt={post.title} /> : <div className="w-10 h-8 bg-slate-200 rounded" />}</TableCell>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{new Date(post._creationTime).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/posts/${post._id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8">Sửa</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {relatedPosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Chưa có bài viết nào trong danh mục này.
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
