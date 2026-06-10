'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Label } from '../../components/ui';
import { useAdminAuth } from '../../auth/context';

type SubscriptionFormMode = 'create' | 'edit';

type SubscriptionFormProps = {
  mode: SubscriptionFormMode;
  task?: Doc<'calendarTasks'> | null;
  onCancel: () => void;
  onSuccess: () => void;
};

const MODULE_KEY = 'subscriptions';

const STATUS_OPTIONS = [
  { value: 'Todo', label: 'Chưa nhắc' },
  { value: 'Contacted', label: 'Đã liên hệ' },
  { value: 'Churned', label: 'Không gia hạn' },
];

function parseDateInput(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  return new Date(`${value}T00:00:00`).getTime();
}

function formatDateInput(timestamp: number | undefined): string {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function SubscriptionForm({ mode, task, onCancel, onSuccess }: SubscriptionFormProps) {
  const { user } = useAdminAuth();
  const createTask = useMutation(api.subscriptions.createSubscription);
  const updateTask = useMutation(api.subscriptions.updateSubscription);
  const createCustomer = useMutation(api.customers.create);
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const customers = useQuery(api.customers.listAll, {});
  const products = useQuery(api.products.listAll, {});
  const defaultStatus = settingsData?.find(setting => setting.settingKey === 'defaultStatus')?.value as string | undefined;

  const [status, setStatus] = useState('Todo');
  const [dueDate, setDueDate] = useState('');
  const [customerMode, setCustomerMode] = useState<'db' | 'guest'>('db');
  const [customerId, setCustomerId] = useState<Id<'customers'> | ''>('');
  const [guestName, setGuestName] = useState('');
  const [productId, setProductId] = useState<Id<'products'> | ''>('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [customDays, setCustomDays] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'create') {
      if (defaultStatus) {
        setStatus(defaultStatus);
      }
      return;
    }
    if (!task) {
      return;
    }
    setStatus(task.status);
    setDueDate(formatDateInput(task.dueDate));
    if (task.customerId) {
      setCustomerMode('db');
      setCustomerId(task.customerId ?? '');
      setGuestName('');
    } else {
      const fallbackName = task.title.split('—').pop()?.trim() ?? '';
      setCustomerMode('guest');
      setCustomerId('');
      setGuestName(fallbackName);
    }
    setProductId(task.productId ?? '');
  }, [defaultStatus, mode, task]);

  const applyFromToday = (days: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDueDate(formatDateInput(today.getTime() + days * 24 * 60 * 60 * 1000));
  };

  const handleQuickAddCustomer = async () => {
    if (!quickName.trim() || !quickPhone.trim()) {
      toast.error('Vui lòng nhập tên và số điện thoại');
      return;
    }
    setQuickAddLoading(true);
    try {
      const email = `${quickPhone.trim()}@nhanh.vn`;
      const newId = await createCustomer({
        name: quickName.trim(),
        phone: quickPhone.trim(),
        email,
      });
      setCustomerId(newId as Id<'customers'>);
      setCustomerMode('db');
      setGuestName('');
      setQuickAddOpen(false);
      setQuickName('');
      setQuickPhone('');
      toast.success('Đã tạo khách hàng');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tạo khách hàng thất bại');
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleApplyCustomDays = () => {
    const days = Number(customDays);
    if (Number.isNaN(days)) {
      toast.error('Số ngày không hợp lệ');
      return;
    }
    applyFromToday(days);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'create' && !user?.id) {
      toast.error('Không xác định được tài khoản admin');
      return;
    }
    const dueDateValue = parseDateInput(dueDate);
    if (!dueDateValue) {
      toast.error('Vui lòng chọn ngày hết hạn');
      return;
    }
    if (customerMode === 'db' && !customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }
    if (customerMode === 'guest' && !guestName.trim()) {
      toast.error('Vui lòng nhập tên khách');
      return;
    }
    if (!productId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    const customerName = customerMode === 'guest'
      ? guestName.trim()
      : customers?.find(customer => customer._id === customerId)?.name ?? 'Khách hàng';
    const productName = products?.find(product => product._id === productId)?.name ?? 'Sản phẩm';
    const title = `Gia hạn ${productName} — ${customerName}`;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createTask({
          allDay: true,
          createdBy: user!.id as Id<'users'>,
          customerId: customerMode === 'db' ? customerId || undefined : undefined,
          dueDate: dueDateValue,
          productId: productId || undefined,
          status: status as 'Todo' | 'Contacted' | 'Churned',
          timezone: 'Asia/Ho_Chi_Minh',
          title: title.trim(),
        });
        toast.success('Đã tạo task');
      } else if (task) {
        await updateTask({
          allDay: true,
          customerId: customerMode === 'db' ? customerId || undefined : undefined,
          dueDate: dueDateValue,
          id: task._id,
          productId: productId || undefined,
          status: status as 'Todo' | 'Contacted' | 'Churned',
          timezone: 'Asia/Ho_Chi_Minh',
          title: title.trim(),
        });
        toast.success('Đã cập nhật task');
      }

      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lưu task thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'edit' && (
        <div className="space-y-2">
          <Label>Trạng thái</Label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Khách hàng</Label>
            <div className="inline-flex rounded-md border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setCustomerMode('db')}
                className={`px-3 py-1 text-xs ${customerMode === 'db' ? 'bg-slate-100 text-slate-700' : 'text-slate-500'}`}
              >
                Trong DB
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('guest')}
                className={`px-3 py-1 text-xs ${customerMode === 'guest' ? 'bg-slate-100 text-slate-700' : 'text-slate-500'}`}
              >
                Khách lẻ
              </button>
            </div>
          </div>
          {customerMode === 'db' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value as Id<'customers'> | '')}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">Chưa chọn</option>
                  {customers?.map(customer => (
                    <option key={customer._id} value={customer._id}>{customer.name}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => setQuickAddOpen(prev => !prev)}>
                  +
                </Button>
              </div>
              {quickAddOpen && (
                <div className="rounded-md border border-slate-200 p-3 space-y-2">
                  <div className="space-y-1">
                    <Label>Tên khách</Label>
                    <Input value={quickName} onChange={(event) => setQuickName(event.target.value)} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="space-y-1">
                    <Label>Số điện thoại</Label>
                    <Input value={quickPhone} onChange={(event) => setQuickPhone(event.target.value)} placeholder="090xxxx" />
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={handleQuickAddCustomer} disabled={quickAddLoading}>
                      {quickAddLoading ? 'Đang tạo...' : 'Tạo & chọn'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              placeholder="Nguyễn Văn A - 090xxxx"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label>Sản phẩm AI</Label>
          <div className="flex items-center gap-2">
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value as Id<'products'> | '')}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Chưa chọn</option>
              {products?.map(product => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
            {productId && (
              <a
                href={`/admin/products/${productId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-700"
                aria-label="Mở sản phẩm"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Ngày nhắc</Label>
        <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => applyFromToday(1)}>+1 ngày</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyFromToday(7)}>+1 tuần</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyFromToday(14)}>+2 tuần</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyFromToday(30)}>+1 tháng</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyFromToday(90)}>+3 tháng</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyFromToday(180)}>+6 tháng</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyFromToday(365)}>+1 năm</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={0}
            value={customDays}
            onChange={(event) => setCustomDays(event.target.value)}
            className="w-24"
            placeholder="0"
          />
          <span className="text-sm text-slate-500">ngày từ hôm nay</span>
          <Button type="button" variant="outline" size="sm" onClick={handleApplyCustomDays}>Áp dụng</Button>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button type="submit" variant="accent" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu task'}
        </Button>
      </div>
    </form>
  );
}
