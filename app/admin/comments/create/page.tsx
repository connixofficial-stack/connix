'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, FileText, Loader2, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input } from '../../components/ui';
import { ModuleGuard } from '../../components/ModuleGuard';

export default function CreateCommentPage() {
  return (
    <ModuleGuard moduleKey="comments" requiredModules={['posts', 'products']} requiredModulesType="any">
      <CreateCommentContent />
    </ModuleGuard>
  );
}

function CreateCommentContent() {
  const router = useRouter();
  const postsData = useQuery(api.posts.listAll, {});
  const productsData = useQuery(api.products.listAll, {});
  const createComment = useMutation(api.comments.create);

  const [formData, setFormData] = useState({
    authorEmail: '',
    authorName: '',
    content: '',
    rating: '' as '' | number,
    status: 'Pending' as 'Pending' | 'Approved' | 'Spam',
    targetId: '',
    targetType: 'post' as 'post' | 'product',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = postsData === undefined || productsData === undefined;

  const targets = useMemo(() => {
    if (formData.targetType === 'post') {
      return postsData?.map(p => ({ id: p._id, name: p.title })) ?? [];
    }
    return productsData?.map(p => ({ id: p._id, name: p.name })) ?? [];
  }, [formData.targetType, postsData, productsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.authorName.trim() || !formData.content.trim() || !formData.targetId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);
    try {
      await createComment({
        authorEmail: formData.authorEmail.trim() || undefined,
        authorName: formData.authorName.trim(),
        content: formData.content.trim(),
        rating: formData.rating === '' ? undefined : formData.rating,
        status: formData.status,
        targetId: formData.targetId,
        targetType: formData.targetType,
      });
      toast.success('Đã tạo bình luận thành công!');
      router.push('/admin/comments');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo bình luận');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/comments">
          <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm bình luận</h1>
          <p className="text-sm text-slate-500">Tạo bình luận mới cho bài viết hoặc sản phẩm</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tên người bình luận <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.authorName}
                onChange={(e) =>{  setFormData({ ...formData, authorName: e.target.value }); }}
                placeholder="Nhập tên..."
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <Input
                type="email"
                value={formData.authorEmail}
                onChange={(e) =>{  setFormData({ ...formData, authorEmail: e.target.value }); }}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Loại bình luận</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.targetType === 'post' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() =>{  setFormData({ ...formData, targetType: 'post', targetId: '' }); }}
              >
                <FileText size={16} /> Bài viết
              </Button>
              <Button
                type="button"
                variant={formData.targetType === 'product' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() =>{  setFormData({ ...formData, targetType: 'product', targetId: '' }); }}
              >
                <Package size={16} /> Sản phẩm
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formData.targetType === 'post' ? 'Bài viết' : 'Sản phẩm'} <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={formData.targetId}
              onChange={(e) =>{  setFormData({ ...formData, targetId: e.target.value }); }}
              required
            >
              <option value="">-- Chọn {formData.targetType === 'post' ? 'bài viết' : 'sản phẩm'} --</option>
              {targets.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm resize-y"
              value={formData.content}
              onChange={(e) =>{  setFormData({ ...formData, content: e.target.value }); }}
              placeholder="Nhập nội dung bình luận..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Đánh giá (1-5)</label>
            <select
              className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={formData.rating === '' ? '' : String(formData.rating)}
              onChange={(e) =>{
                const value = e.target.value;
                setFormData({ ...formData, rating: value === '' ? '' : Number(value) });
              }}
            >
              <option value="">Không đánh giá</option>
              <option value="1">1 - Rất tệ</option>
              <option value="2">2 - Tệ</option>
              <option value="3">3 - Trung bình</option>
              <option value="4">4 - Tốt</option>
              <option value="5">5 - Rất tốt</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Trạng thái</label>
            <div className="flex gap-2">
              {(['Pending', 'Approved', 'Spam'] as const).map(status => (
                <Button
                  key={status}
                  type="button"
                  variant={formData.status === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>{  setFormData({ ...formData, status }); }}
                >
                  <Badge variant={status === 'Approved' ? 'default' : (status === 'Pending' ? 'secondary' : 'destructive')} className="pointer-events-none">
                    {status === 'Approved' ? 'Đã duyệt' : (status === 'Pending' ? 'Chờ duyệt' : 'Spam')}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link href="/admin/comments">
              <Button type="button" variant="outline">Hủy</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Tạo bình luận
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
