'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui';
import { SubscriptionForm } from './SubscriptionForm';

type SubscriptionModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  taskId?: Id<'calendarTasks'> | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function SubscriptionModal({ open, mode, taskId, onClose, onSuccess }: SubscriptionModalProps) {
  const task = useQuery(
    api.subscriptions.getSubscription,
    mode === 'edit' && taskId ? { id: taskId } : 'skip'
  );

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) {onClose();} }}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Tạo task mới' : 'Cập nhật task'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Thiết lập công việc cần theo dõi.' : 'Chỉnh sửa thông tin công việc hiện có.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'edit' && task === undefined && (
          <div className="text-sm text-slate-400">Đang tải dữ liệu...</div>
        )}
        {mode === 'edit' && task === null && (
          <div className="text-sm text-slate-400">Task không tồn tại.</div>
        )}
        {(mode === 'create' || task) && (
          <SubscriptionForm
            mode={mode}
            task={task ?? undefined}
            onCancel={onClose}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
