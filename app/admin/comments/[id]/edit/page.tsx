'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, FileText, Loader2, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input } from '../../../components/ui';
import { ModuleGuard } from '../../../components/ModuleGuard';

export default function EditCommentPage() {
  return (
    <ModuleGuard moduleKey="comments" requiredModules={['posts', 'products']} requiredModulesType="any">
      <EditCommentContent />
    </ModuleGuard>
  );
}

function EditCommentContent() {
  const params = useParams();
  const commentId = params.id as Id<"comments">;

  const commentData = useQuery(api.comments.getById, { id: commentId });
  const postsData = useQuery(api.posts.listAll, {});
  const productsData = useQuery(api.products.listAll, {});
  const updateComment = useMutation(api.comments.update);

  const [formData, setFormData] = useState({
    authorEmail: '',
    authorName: '',
    content: '',
    rating: '' as '' | number,
    status: 'Pending' as 'Pending' | 'Approved' | 'Spam',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const isLoading = commentData === undefined || postsData === undefined || productsData === undefined;

  // Initialize form with existing data
  useEffect(() => {
    if (commentData && !initialized) {
      setFormData({
        authorEmail: commentData.authorEmail ?? '',
        authorName: commentData.authorName,
        content: commentData.content,
        rating: commentData.rating ?? '',
        status: commentData.status,
      });
      setInitialized(true);
    }
  }, [commentData, initialized]);

  const targetName = useMemo(() => {
    if (!commentData) {return '';}
    if (commentData.targetType === 'post') {
      return postsData?.find(p => p._id === commentData.targetId)?.title ?? 'Bài viết không tồn tại';
    }
    return productsData?.find(p => p._id === commentData.targetId)?.name ?? 'Sản phẩm không tồn tại';
  }, [commentData, postsData, productsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.authorName.trim() || !formData.content.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateComment({
        authorEmail: formData.authorEmail.trim() || undefined,
        authorName: formData.authorName.trim(),
        content: formData.content.trim(),
        id: commentId,
        rating: formData.rating === '' ? undefined : formData.rating,
        status: formData.status,
      });
      toast.success('Đã cập nhật bình luận!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật');
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

  if (!commentData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy bình luận</p>
        <Link href="/admin/comments">
          <Button variant="outline" className="mt-4">Quay lại</Button>
        </Link>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa bình luận</h1>
          <p className="text-sm text-slate-500">Cập nhật thông tin bình luận</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Target info (readonly) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
            <p className="text-sm text-slate-500">Bình luận cho:</p>
            <div className="flex items-center gap-2">
              <Badge variant={commentData.targetType === 'post' ? 'secondary' : 'outline'} className="gap-1">
                {commentData.targetType === 'post' ? <FileText size={12} /> : <Package size={12} />}
                {commentData.targetType === 'post' ? 'Bài viết' : 'Sản phẩm'}
              </Badge>
              <span className="font-medium text-slate-900 dark:text-slate-100">{targetName}</span>
            </div>
            <p className="text-xs text-slate-400">
              Tạo lúc: {new Date(commentData._creationTime).toLocaleString('vi-VN')}
            </p>
          </div>

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
              Lưu thay đổi
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
