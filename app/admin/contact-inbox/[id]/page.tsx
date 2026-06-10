'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Badge, Button, Card, Input } from '../../components/ui';
import { ModuleGuard } from '../../components/ModuleGuard';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Mới' },
  { value: 'in_progress', label: 'Đang xử lý' },
  { value: 'resolved', label: 'Đã xử lý' },
  { value: 'spam', label: 'Spam' },
] as const;

export default function ContactInboxDetailPage() {
  return (
    <ModuleGuard moduleKey="contactInbox">
      <ContactInboxDetailContent />
    </ModuleGuard>
  );
}

function ContactInboxDetailContent() {
  const params = useParams();
  const inquiryId = params.id as Id<'contactInquiries'>;
  const inquiry = useQuery(api.contactInbox.getById, { id: inquiryId });
  const updateInquiry = useMutation(api.contactInbox.updateInquiry);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    status: 'new' as 'new' | 'in_progress' | 'resolved' | 'spam',
  });
  const [initialized, setInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!inquiry || initialized) {
      return;
    }
    setFormData({
      name: inquiry.name,
      email: inquiry.email ?? '',
      phone: inquiry.phone ?? '',
      subject: inquiry.subject,
      message: inquiry.message,
      status: inquiry.status,
    });
    setInitialized(true);
  }, [inquiry, initialized]);

  if (inquiry === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy tin nhắn</p>
        <Link href="/admin/contact-inbox">
          <Button variant="outline" className="mt-4">Quay lại</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error('Vui lòng nhập đầy đủ họ tên, chủ đề và nội dung');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateInquiry({
        email: formData.email.trim() || undefined,
        id: inquiryId,
        message: formData.message.trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        status: formData.status,
        subject: formData.subject.trim(),
      });
      toast.success('Đã cập nhật tin nhắn');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/contact-inbox">
          <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chi tiết tin nhắn</h1>
          <p className="text-sm text-slate-500">Cập nhật nội dung và trạng thái tin nhắn</p>
        </div>
      </div>

      <Card className="p-4 space-y-2 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-slate-600">Nguồn gửi: <span className="font-medium text-slate-800 dark:text-slate-200">{inquiry.sourcePath}</span></div>
          <Badge variant="secondary">Tạo lúc: {new Date(inquiry.createdAt).toLocaleString('vi-VN')}</Badge>
        </div>
        <div className="text-xs text-slate-500">
          Cập nhật lần cuối: {new Date(inquiry.updatedAt).toLocaleString('vi-VN')}
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Họ tên <span className="text-red-500">*</span></label>
              <Input
                value={formData.name}
                onChange={(event) =>{  setFormData({ ...formData, name: event.target.value }); }}
                placeholder="Nhập họ tên..."
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(event) =>{  setFormData({ ...formData, email: event.target.value }); }}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Số điện thoại</label>
              <Input
                value={formData.phone}
                onChange={(event) =>{  setFormData({ ...formData, phone: event.target.value }); }}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Trạng thái</label>
              <select
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                value={formData.status}
                onChange={(event) =>{  setFormData({ ...formData, status: event.target.value as typeof formData.status }); }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Chủ đề <span className="text-red-500">*</span></label>
            <Input
              value={formData.subject}
              onChange={(event) =>{  setFormData({ ...formData, subject: event.target.value }); }}
              placeholder="Nhập chủ đề..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nội dung <span className="text-red-500">*</span></label>
            <textarea
              className="w-full min-h-[140px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm resize-y"
              value={formData.message}
              onChange={(event) =>{  setFormData({ ...formData, message: event.target.value }); }}
              placeholder="Nhập nội dung..."
              required
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
