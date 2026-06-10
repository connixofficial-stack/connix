'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, Input, Label } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';

const MODULE_KEY = 'notifications';

export default function NotificationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const notificationData = useQuery(api.notifications.getById, { id: id as Id<"notifications"> });
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const updateNotification = useMutation(api.notifications.update);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [targetType, setTargetType] = useState<'all' | 'customers' | 'users' | 'specific'>('all');
  const [sendEmail, setSendEmail] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = notificationData === undefined || fieldsData === undefined;

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  useEffect(() => {
    if (notificationData) {
      setTitle(notificationData.title);
      setContent(notificationData.content);
      setType(notificationData.type);
      setTargetType(notificationData.targetType);
      setSendEmail(notificationData.sendEmail ?? false);
      if (notificationData.scheduledAt) {
        const date = new Date(notificationData.scheduledAt);
        setScheduledAt(date.toISOString().slice(0, 16));
      }
    }
  }, [notificationData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateNotification({
        content,
        id: id as Id<"notifications">,
        scheduledAt: enabledFields.has('scheduledAt') && scheduledAt ? new Date(scheduledAt).getTime() : undefined,
        sendEmail: enabledFields.has('sendEmail') ? sendEmail : undefined,
        status: scheduledAt ? 'Scheduled' : 'Draft',
        targetType: enabledFields.has('targetType') ? targetType : undefined,
        title,
        type,
      });
      toast.success('Đã cập nhật thông báo');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
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

  if (!notificationData) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy thông báo</div>;
  }

  const isReadOnly = notificationData.status === 'Sent';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isReadOnly ? 'Chi tiết thông báo' : 'Chỉnh sửa thông báo'}
        </h1>
        <Link href="/admin/notifications" className="text-sm text-pink-600 hover:underline">Quay lại danh sách</Link>
      </div>

      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-sm">
          Thông báo này đã được gửi đi. Bạn đang xem chi tiết ở chế độ chỉ đọc.
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề <span className="text-red-500">*</span></Label>
              <CopyableInput
                required 
                placeholder="Nhập tiêu đề thông báo..." 
                value={title}
                copyLabel="tiêu đề"
                onChange={(e) =>{  setTitle(e.target.value); }}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label>Nội dung <span className="text-red-500">*</span></Label>
              <textarea 
                required
                className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-75 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500"
                placeholder="Nhập nội dung thông báo..."
                value={content}
                onChange={(e) =>{  setContent(e.target.value); }}
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại thông báo <span className="text-red-500">*</span></Label>
                <select 
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={type}
                  onChange={(e) =>{  setType(e.target.value as typeof type); }}
                  disabled={isReadOnly}
                >
                  <option value="info">Thông tin</option>
                  <option value="success">Thành công</option>
                  <option value="warning">Cảnh báo</option>
                  <option value="error">Lỗi</option>
                </select>
              </div>

              {enabledFields.has('targetType') && (
                <div className="space-y-2">
                  <Label>Đối tượng nhận</Label>
                  <select 
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    value={targetType}
                    onChange={(e) =>{  setTargetType(e.target.value as typeof targetType); }}
                    disabled={isReadOnly}
                  >
                    <option value="all">Tất cả</option>
                    <option value="customers">Khách hàng</option>
                    <option value="users">Admin</option>
                    <option value="specific">Cụ thể</option>
                  </select>
                </div>
              )}
            </div>

            {enabledFields.has('scheduledAt') && (
              <div className="space-y-2">
                <Label>Hẹn giờ gửi (để trống nếu lưu nháp)</Label>
                <Input 
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) =>{  setScheduledAt(e.target.value); }}
                  disabled={isReadOnly}
                />
              </div>
            )}

            {enabledFields.has('sendEmail') && (
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="sendEmail"
                  checked={sendEmail}
                  onChange={(e) =>{  setSendEmail(e.target.checked); }}
                  className="w-4 h-4 rounded border-slate-300"
                  disabled={isReadOnly}
                />
                <Label htmlFor="sendEmail" className="cursor-pointer">Gửi email kèm theo</Label>
              </div>
            )}
          </CardContent>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/notifications'); }}>
              {isReadOnly ? 'Quay lại' : 'Hủy bỏ'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" className="bg-pink-600 hover:bg-pink-500" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                Lưu thay đổi
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
