'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { CalendarDays, ListTodo, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label, cn } from '../components/ui';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { BulkActionBar, SelectCheckbox } from '../components/TableUtilities';
import { SubscriptionModal } from './_components/SubscriptionModal';
import { useAdminAuth } from '../auth/context';

type SubscriptionStatus = Doc<'calendarTasks'>['status'];
type SubscriptionView = 'board' | 'list';

type SubscriptionRangeItem = {
  _id: string;
  customerId?: Id<'customers'>;
  dueDate?: number;
  productId?: Id<'products'>;
  sourceId: Id<'calendarTasks'>;
  status: SubscriptionStatus;
  title: string;
};

const MODULE_KEY = 'subscriptions';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  Todo: 'Chưa nhắc',
  Contacted: 'Đã liên hệ',
  Renewed: 'Đã gia hạn',
  Churned: 'Không gia hạn',
};

const STATUS_BADGES: Record<SubscriptionStatus, { variant: 'default' | 'warning' | 'secondary' | 'destructive' }> = {
  Todo: { variant: 'default' },
  Contacted: { variant: 'warning' },
  Renewed: { variant: 'secondary' },
  Churned: { variant: 'destructive' },
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getEffectiveDueDate(task: { dueDate?: number }) {
  return task.dueDate ?? 0;
}

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

export default function SubscriptionsPage() {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <SubscriptionsWorkspace />
    </ModuleGuard>
  );
}

function SubscriptionsWorkspace() {
  const { user } = useAdminAuth();
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const customers = useQuery(api.customers.listAll, {});
  const products = useQuery(api.products.listAll, {});
  const deleteTask = useMutation(api.subscriptions.deleteSubscription);
  const markContacted = useMutation(api.subscriptions.markSubscriptionContacted);
  const renewTask = useMutation(api.subscriptions.renewSubscription);

  const subscriptionsPerPage = useMemo(() => {
    const raw = settingsData?.find(setting => setting.settingKey === 'subscriptionsPerPage')?.value as number | undefined;
    return Math.min(Math.max(raw ?? 20, 10), 100);
  }, [settingsData]);

  const warningDays = useMemo(() => {
    const raw = settingsData?.find(setting => setting.settingKey === 'warningDays')?.value as number | undefined;
    return Math.max(raw ?? 7, 1);
  }, [settingsData]);

  const [view, setView] = useState<SubscriptionView>('board');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [productFilter, setProductFilter] = useState<Id<'products'> | 'all'>('all');
  const [queryNow, setQueryNow] = useState(() => Date.now());

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: Id<'calendarTasks'>; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Id<'calendarTasks'>[]>([]);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTaskId, setEditingTaskId] = useState<Id<'calendarTasks'> | null>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewTargetId, setRenewTargetId] = useState<Id<'calendarTasks'> | null>(null);
  const [renewDate, setRenewDate] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);

  const refreshNow = () => setQueryNow(Date.now());

  const nowDate = useMemo(() => new Date(queryNow), [queryNow]);
  const todayStart = useMemo(() => startOfDay(nowDate).getTime(), [nowDate]);
  const todayEnd = useMemo(() => endOfDay(nowDate).getTime(), [nowDate]);
  const warnThreshold = useMemo(() => todayStart + warningDays * 24 * 60 * 60 * 1000, [todayStart, warningDays]);
  const monthEnd = useMemo(() => new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59, 999), [nowDate]);

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;
  const productParam = productFilter === 'all' ? undefined : productFilter;

  const overdueRangeItems = useQuery(api.subscriptions.listSubscriptionsRange, {
    from: 0,
    to: todayStart,
    status: statusParam,
    productId: productParam,
    limit: 300,
  });

  const upcomingRangeItems = useQuery(api.subscriptions.listSubscriptionsRange, {
    from: todayStart,
    to: monthEnd.getTime(),
    status: statusParam,
    productId: productParam,
    limit: 300,
  });

  const listData = useQuery(api.subscriptions.listSubscriptionsPage, {
    cursor: currentCursor ?? undefined,
    pageSize: subscriptionsPerPage,
    productId: productParam,
    status: statusParam,
  });

  const customersMap = useMemo(() => {
    const map = new Map<string, Doc<'customers'>>();
    customers?.forEach(customer => map.set(customer._id, customer));
    return map;
  }, [customers]);

  const productsMap = useMemo(() => {
    const map = new Map<string, Doc<'products'>>();
    products?.forEach(product => map.set(product._id, product));
    return map;
  }, [products]);

  const getTaskMeta = (task: { customerId?: Id<'customers'>; productId?: Id<'products'> }) => {
    const customerName = task.customerId ? customersMap.get(task.customerId)?.name : undefined;
    const productName = task.productId ? productsMap.get(task.productId)?.name : undefined;
    return {
      customerName,
      productName,
      label: [customerName, productName].filter(Boolean).join(' — '),
    };
  };

  const keywordLower = keyword.trim().toLowerCase();
  const filterByKeyword = (task: SubscriptionRangeItem | Doc<'calendarTasks'>) => {
    if (!keywordLower) {
      return true;
    }
    const meta = getTaskMeta(task);
    const searchText = [task.title, meta.customerName, meta.productName].filter(Boolean).join(' ').toLowerCase();
    return searchText.includes(keywordLower);
  };

  const filteredOverdueItems = useMemo(() => {
    return (overdueRangeItems ?? []).filter(filterByKeyword).sort((a, b) => getEffectiveDueDate(a) - getEffectiveDueDate(b));
  }, [overdueRangeItems, keywordLower, customersMap, productsMap]);

  const filteredUpcomingItems = useMemo(() => {
    return (upcomingRangeItems ?? []).filter(filterByKeyword).sort((a, b) => getEffectiveDueDate(a) - getEffectiveDueDate(b));
  }, [upcomingRangeItems, keywordLower, customersMap, productsMap]);

  const activeOverdueItems = useMemo(() => {
    return filteredOverdueItems.filter(item => item.status === 'Todo' || item.status === 'Contacted');
  }, [filteredOverdueItems]);

  const activeUpcomingItems = useMemo(() => {
    return filteredUpcomingItems.filter(item => item.status === 'Todo' || item.status === 'Contacted');
  }, [filteredUpcomingItems]);

  const todayItems = useMemo(() => {
    return activeUpcomingItems.filter(item => {
      const due = getEffectiveDueDate(item);
      return due >= todayStart && due <= todayEnd;
    });
  }, [activeUpcomingItems, todayStart, todayEnd]);

  const dueSoonItems = useMemo(() => {
    return activeUpcomingItems.filter(item => {
      const due = getEffectiveDueDate(item);
      return due > todayEnd && due <= warnThreshold;
    });
  }, [activeUpcomingItems, todayEnd, warnThreshold]);

  const laterItems = useMemo(() => {
    return activeUpcomingItems.filter(item => {
      const due = getEffectiveDueDate(item);
      return due > warnThreshold;
    });
  }, [activeUpcomingItems, warnThreshold]);

  const doneItems = useMemo(() => {
    return [...filteredOverdueItems, ...filteredUpcomingItems].filter(item => item.status === 'Renewed' || item.status === 'Churned');
  }, [filteredOverdueItems, filteredUpcomingItems]);

  const listItems = useMemo(() => {
    if (!listData?.items) {
      return [];
    }
    return listData.items.filter(filterByKeyword);
  }, [listData, keywordLower, customersMap, productsMap]);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteTask({ id: deleteTarget._id });
      toast.success('Đã xóa task');
      refreshNow();
      setDeleteTarget(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Xóa task thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkContacted = async (taskId: Id<'calendarTasks'>) => {
    try {
      await markContacted({ id: taskId });
      toast.success('Đã đánh dấu đã liên hệ');
      refreshNow();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cập nhật thất bại');
    }
  };

  const handleRenew = (taskId: Id<'calendarTasks'>) => {
    setRenewTargetId(taskId);
    setRenewDate('');
    setRenewModalOpen(true);
  };

  const applyRenewFromToday = (days: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setRenewDate(formatDateInput(today.getTime() + days * 24 * 60 * 60 * 1000));
  };

  const handleConfirmRenew = async () => {
    if (!renewTargetId) {
      return;
    }
    if (!user?.id) {
      toast.error('Không xác định được tài khoản admin');
      return;
    }
    const newDueDate = parseDateInput(renewDate);
    if (!newDueDate) {
      toast.error('Vui lòng chọn ngày gia hạn');
      return;
    }
    setIsRenewing(true);
    try {
      await renewTask({ id: renewTargetId, newDueDate, createdBy: user.id as Id<'users'> });
      toast.success('Đã tạo nhắc mới');
      setRenewModalOpen(false);
      setRenewTargetId(null);
      setRenewDate('');
      refreshNow();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cập nhật thất bại');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (listItems.length === 0) {
      return;
    }
    const allSelected = listItems.every(task => selectedIds.includes(task._id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !listItems.some(task => task._id === id)));
      return;
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      listItems.forEach(task => next.add(task._id));
      return Array.from(next);
    });
  };

  const handleToggleSelectItem = (taskId: Id<'calendarTasks'>) => {
    setSelectedIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => deleteTask({ id })));
      toast.success(`Đã xóa ${selectedIds.length} task`);
      setSelectedIds([]);
      setBulkDeleteDialogOpen(false);
      refreshNow();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Xóa task thất bại');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleNextPage = () => {
    if (!listData?.continueCursor) {
      return;
    }
    setCursorStack(prev => [...prev, currentCursor]);
    setCurrentCursor(listData.continueCursor);
    setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setCursorStack(prev => {
      if (prev.length === 0) {
        return prev;
      }
      const next = [...prev];
      const previousCursor = next.pop() ?? null;
      setCurrentCursor(previousCursor);
      setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
      return next;
    });
  };

  const listColSpan = 7;

  const summaryItems = [
    { key: 'overdue', label: 'Quá hạn', value: activeOverdueItems.length },
    { key: 'today', label: 'Hôm nay', value: todayItems.length },
    { key: 'soon', label: `Sắp hết hạn (${warningDays}n)`, value: dueSoonItems.length },
    { key: 'later', label: 'Sắp tới', value: laterItems.length },
  ];

  const boardColumns = [
    { key: 'overdue', label: 'Quá hạn', items: activeOverdueItems },
    { key: 'today', label: 'Hôm nay', items: todayItems },
    { key: 'soon', label: `Sắp hết hạn (${warningDays}n)`, items: dueSoonItems },
    { key: 'later', label: 'Sắp tới', items: laterItems },
    { key: 'done', label: 'Đã xử lý', items: doneItems },
  ];

  const isLoading = settingsData === undefined
    || customers === undefined
    || products === undefined
    || overdueRangeItems === undefined
    || upcomingRangeItems === undefined
    || listData === undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Quản lý gia hạn</h1>
          <p className="text-sm text-slate-500">Theo dõi và nhắc khách gia hạn subscription.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setModalMode('create');
              setEditingTaskId(null);
              setModalOpen(true);
            }}
          >
            Tạo nhắc
          </Button>
          <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setView('board')}
              className={cn('px-3 py-2 text-sm flex items-center gap-2', view === 'board' ? 'bg-blue-50 text-blue-600' : 'text-slate-500')}
            >
              <CalendarDays size={16} /> Board
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn('px-3 py-2 text-sm flex items-center gap-2', view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-500')}
            >
              <ListTodo size={16} /> List
            </button>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên khách hoặc sản phẩm"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as SubscriptionStatus | 'all')}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value as Id<'products'> | 'all')}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">Tất cả sản phẩm</option>
              {products?.map(product => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryItems.map(item => (
            <button
              key={item.key}
              type="button"
              className="rounded-md border border-slate-200 bg-white px-4 py-3 text-left text-sm hover:bg-slate-50"
            >
              <div className="text-xs text-slate-500">{item.label}</div>
              <div className="text-2xl font-semibold text-slate-900">{item.value}</div>
            </button>
          ))}
        </div>
      </Card>

      {view === 'board' && (
        <div className="grid gap-4 lg:grid-cols-5">
          {boardColumns.map(column => (
            <Card key={column.key} className="p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>{column.label}</span>
                <span className="text-xs text-slate-400">{column.items.length} nhắc</span>
              </div>
              <div className="mt-3 space-y-2">
                {column.items.length === 0 && (
                  <div className="text-sm text-slate-400">Không có nhắc</div>
                )}
                {column.items.map(task => {
                  const meta = getTaskMeta(task);
                  const cardClass = cn(
                    'rounded-md border px-3 py-2 text-sm',
                    column.key === 'overdue' && 'border-red-200 bg-red-50',
                    column.key === 'today' && 'border-blue-200 bg-blue-50',
                    column.key === 'soon' && 'border-yellow-200 bg-yellow-50'
                  );
                  return (
                    <div key={task._id} className={cardClass}>
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => {
                          setModalMode('edit');
                          setEditingTaskId(task.sourceId);
                          setModalOpen(true);
                        }}
                      >
                        <div className="font-medium text-slate-800 truncate">{meta.customerName ?? 'Khách hàng'}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {meta.productName && (
                            <Badge variant="secondary" className="text-[10px]">{meta.productName}</Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {new Date(getEffectiveDueDate(task)).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkContacted(task.sourceId)}
                          disabled={task.status === 'Contacted' || task.status === 'Renewed' || task.status === 'Churned'}
                        >
                          Đã liên hệ
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRenew(task.sourceId)}
                          disabled={task.status === 'Renewed' || task.status === 'Churned'}
                        >
                          Gia hạn ✓
                        </Button>
                        <button
                          type="button"
                          className="text-xs text-red-600 flex items-center gap-1"
                          onClick={() => {
                            setDeleteTarget({ _id: task.sourceId, title: task.title });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {view === 'list' && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Danh sách nhắc</div>
            <div className="text-xs text-slate-400">Trang {currentPage}</div>
          </div>
          <BulkActionBar
            selectedCount={selectedIds.length}
            entityLabel="nhắc"
            onDelete={() => setBulkDeleteDialogOpen(true)}
            onClearSelection={() => setSelectedIds([])}
            isLoading={isBulkDeleting}
          />
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-4 w-[40px]">
                    <SelectCheckbox
                      checked={listItems.length > 0 && listItems.every(task => selectedIds.includes(task._id))}
                      indeterminate={selectedIds.length > 0 && listItems.some(task => !selectedIds.includes(task._id))}
                      onChange={handleToggleSelectAll}
                      disabled={listItems.length === 0}
                      title="Chọn tất cả"
                    />
                  </th>
                  <th className="py-2 pr-4">Nhắc</th>
                  <th className="py-2 pr-4">Khách hàng</th>
                  <th className="py-2 pr-4">Sản phẩm</th>
                  <th className="py-2 pr-4">Ngày nhắc</th>
                  <th className="py-2 pr-4">Trạng thái</th>
                  <th className="py-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {listItems.length === 0 && (
                  <tr>
                    <td colSpan={listColSpan} className="py-6 text-center text-slate-400">Chưa có nhắc</td>
                  </tr>
                )}
                {listItems.map(task => (
                  <tr key={task._id} className="border-t border-slate-100">
                    <td className="py-3 pr-4">
                      <SelectCheckbox
                        checked={selectedIds.includes(task._id)}
                        onChange={() => handleToggleSelectItem(task._id)}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-800">{task.title}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {task.customerId ? customersMap.get(task.customerId)?.name ?? '---' : '---'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {task.productId ? productsMap.get(task.productId)?.name ?? '---' : '---'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {new Date(getEffectiveDueDate(task)).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={STATUS_BADGES[task.status].variant}>{STATUS_LABELS[task.status]}</Badge>
                    </td>
                    <td className="py-3 flex items-center gap-1">
                      <button
                        type="button"
                        className="text-xs text-blue-600"
                        onClick={() => {
                          setModalMode('edit');
                          setEditingTaskId(task._id);
                          setModalOpen(true);
                        }}
                      >
                        Sửa
                      </button>
                      {task.status !== 'Renewed' && task.status !== 'Churned' && (
                        <button
                          type="button"
                          className="text-xs text-emerald-600"
                          onClick={() => handleRenew(task._id)}
                        >
                          Gia hạn
                        </button>
                      )}
                      {task.status === 'Todo' && (
                        <button
                          type="button"
                          className="text-xs text-slate-600"
                          onClick={() => handleMarkContacted(task._id)}
                        >
                          Đã liên hệ
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-xs text-red-600 flex items-center gap-1"
                        onClick={() => {
                          setDeleteTarget({ _id: task._id, title: task.title });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 size={12} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={cursorStack.length === 0}>
              Trang trước
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={Boolean(listData?.isDone) || !listData?.continueCursor}>
              Trang sau
            </Button>
          </div>
        </Card>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa nhắc"
        itemName={deleteTarget?.title ?? 'nhắc'}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Xóa các nhắc đã chọn"
        itemName={`${selectedIds.length} nhắc`}
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
      />

      <SubscriptionModal
        open={modalOpen}
        mode={modalMode}
        taskId={editingTaskId ?? undefined}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          refreshNow();
        }}
      />

      <Dialog open={renewModalOpen} onOpenChange={(next) => { if (!next) {setRenewModalOpen(false);} }}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Gia hạn</DialogTitle>
            <DialogDescription>Chọn ngày gia hạn mới để tạo nhắc tiếp theo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ngày gia hạn mới</Label>
              <Input type="date" value={renewDate} onChange={(event) => setRenewDate(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => applyRenewFromToday(30)}>+1 tháng</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyRenewFromToday(90)}>+3 tháng</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyRenewFromToday(180)}>+6 tháng</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyRenewFromToday(365)}>+1 năm</Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRenewModalOpen(false)}>Hủy</Button>
              <Button type="button" variant="accent" onClick={handleConfirmRenew} disabled={isRenewing}>
                {isRenewing ? 'Đang lưu...' : 'Tạo nhắc mới'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading && (
        <div className="text-sm text-slate-400">Đang tải dữ liệu...</div>
      )}
    </div>
  );
}
