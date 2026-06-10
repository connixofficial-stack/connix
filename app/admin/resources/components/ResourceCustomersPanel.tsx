'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { ChevronDown, Search, Users, Download, Percent, Edit, Trash2 } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/app/admin/components/ui';
import { generatePaginationItems } from '@/app/admin/components/TableUtilities';
import { DeleteConfirmDialog } from '@/app/admin/components/DeleteConfirmDialog';
import { toast } from 'sonner';

const formatDate = (value?: number) => value
  ? new Date(value).toLocaleDateString('vi-VN') + ' ' + new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  : 'Chưa có';

type ResourceCustomersPanelProps = {
  resourceId?: Id<'resources'>;
  showResourceColumn?: boolean;
};

export function ResourceCustomersPanel({ resourceId, showResourceColumn = false }: ResourceCustomersPanelProps) {
  const [selectedResourceId, setSelectedResourceId] = useState<string>(resourceId ?? 'all');
  const [status, setStatus] = useState<'active' | 'revoked' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Queries
  const allResources = useQuery(api.resources.listAll, { limit: 500 });

  // Mutations
  const revokeAccess = useMutation(api.resources.revokeAccess);
  const activateAccess = useMutation(api.resources.activateAccess);
  const removeAccess = useMutation(api.resources.removeAccess);

  // States for Dialogs
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editStatus, setEditStatus] = useState<'active' | 'revoked'>('active');
  const [isEditLoading, setIsEditLoading] = useState(false);

  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => { clearTimeout(timer); };
  }, [searchTerm]);

  const offset = (currentPage - 1) * pageSize;

  const resolvedResourceId = selectedResourceId === 'all' ? undefined : (selectedResourceId as Id<'resources'>);

  const result = useQuery(api.resources.listResourceCustomersAdmin, {
    resourceId: resolvedResourceId,
    limit: pageSize,
    offset,
    search: debouncedSearchTerm.trim() || undefined,
    status: status === 'all' ? undefined : status,
  });

  const items = result?.items ?? [];
  const totalCount = result?.totalCount ?? 0;
  
  const totalCustomers = result?.stats?.totalCustomers ?? 0;
  const totalDownloads = result?.stats?.totalDownloads ?? 0;
  const averageDownloads = result?.stats?.averageDownloads ?? 0;

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatus('all');
    setSelectedResourceId(resourceId ?? 'all');
    setCurrentPage(1);
  };

  const handleOpenEdit = (customer: any) => {
    setEditingCustomer(customer);
    setEditStatus(customer.status);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    setIsEditLoading(true);
    try {
      if (editStatus === 'active') {
        await activateAccess({ accessId: editingCustomer.accessId });
      } else {
        await revokeAccess({ accessId: editingCustomer.accessId });
      }
      toast.success("Đã cập nhật trạng thái quyền tải");
      setEditingCustomer(null);
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleOpenDelete = (customer: any) => {
    setDeletingCustomer(customer);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    setIsDeleteLoading(true);
    try {
      await removeAccess({
        accessId: deletingCustomer.accessId,
      });
      toast.success("Đã xóa quyền truy cập của khách hàng");
      setDeletingCustomer(null);
    } catch {
      toast.error("Không thể xóa quyền truy cập");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const isTableLoading = result === undefined;

  return (
    <div className="space-y-4">
      {/* 3 Khối Thống kê Premium */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Khách có quyền</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {isTableLoading ? (
                  <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                ) : (
                  totalCustomers
                )}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Download size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Tổng lượt tải xuống</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {isTableLoading ? (
                  <span className="inline-block h-6 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                ) : (
                  totalDownloads
                )}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Percent size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Tải trung bình / Khách</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {isTableLoading ? (
                  <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                ) : (
                  averageDownloads
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm khách hàng..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showResourceColumn && allResources && (
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-slate-700 max-w-[200px]"
                value={selectedResourceId}
                onChange={(e) => { setSelectedResourceId(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">Tất cả tài nguyên</option>
                {allResources.map((res) => (
                  <option key={res._id} value={res._id}>{res.title}</option>
                ))}
              </select>
            )}
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-slate-700"
              value={status}
              onChange={(e) => { setStatus(e.target.value as typeof status); setCurrentPage(1); }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="revoked">Đã thu hồi</option>
            </select>
            <Button variant="outline" onClick={handleResetFilters}>Xóa lọc</Button>
          </div>
        </div>

        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              {showResourceColumn && <TableHead>Tài nguyên</TableHead>}
              <TableHead>Nguồn cấp</TableHead>
              <TableHead>Lượt tải</TableHead>
              <TableHead>Tải lần cuối</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell>
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-1.5 h-3 w-44 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-1 h-3 w-28 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  </TableCell>
                  {showResourceColumn && (
                    <TableCell>
                      <div className="h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-8 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                  </TableCell>
                  <TableCell>
                    <div className="ml-auto h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showResourceColumn ? 7 : 6} className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Chưa có người mua/tải phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.accessId}>
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.customerName}</div>
                    <div className="text-xs text-slate-500">{item.customerEmail || 'Không có email'}</div>
                    <div className="text-xs text-slate-400">{item.customerPhone || 'Không có số điện thoại'}</div>
                  </TableCell>
                  {showResourceColumn && (
                    <TableCell>
                      <Link href={`/admin/resources/${item.resourceId}/edit`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {item.resourceTitle}
                      </Link>
                    </TableCell>
                  )}
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    <Badge variant={item.sourceType === 'order' ? 'default' : item.sourceType === 'free' ? 'secondary' : 'outline'}>
                      {item.sourceType === 'order' ? 'Đơn hàng' : item.sourceType === 'free' ? 'Miễn phí' : 'Thủ công'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700 dark:text-slate-300">{item.downloadCount}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300 text-xs">
                    {item.lastDownloadAt ? formatDate(item.lastDownloadAt) : 'Chưa tải xuống'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'active' ? 'success' : 'secondary'}>
                      {item.status === 'active' ? 'Có quyền' : 'Đã thu hồi'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)} title="Chỉnh sửa trạng thái">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleOpenDelete(item)} title="Xóa quyền truy cập">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalCount > 0 && !isTableLoading && (
          <div className="flex flex-col gap-4 border-t border-slate-100 p-4 text-sm text-slate-500 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}
                className="h-8 w-[72px] rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {[10, 20, 30, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <span>kết quả/trang · {totalCount} kết quả</span>
            </div>
            <nav className="flex items-center gap-1" aria-label="Phân trang">
              <button
                onClick={() => { setCurrentPage((prev) => Math.max(1, prev - 1)); }}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
                aria-label="Trang trước"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>
              {generatePaginationItems(currentPage, totalPages).map((item, index) => item === 'ellipsis'
                ? <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">…</div>
                : (
                  <button
                    key={item}
                    onClick={() => { setCurrentPage(item); }}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm ${item === currentPage ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                    aria-current={item === currentPage ? 'page' : undefined}
                  >
                    {item}
                  </button>
                ))}
              <button
                onClick={() => { setCurrentPage((prev) => Math.min(totalPages, prev + 1)); }}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
                aria-label="Trang sau"
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            </nav>
          </div>
        )}
      </Card>

      {/* Dialog Chỉnh sửa trạng thái */}
      <Dialog open={editingCustomer !== null} onOpenChange={(open) => { if (!open) setEditingCustomer(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa trạng thái truy cập</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Khách hàng</label>
                <div className="font-medium text-slate-900 dark:text-slate-100">{editingCustomer.customerName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{editingCustomer.customerEmail}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tài nguyên</label>
                <div className="text-sm text-slate-700 dark:text-slate-300">{editingCustomer.resourceTitle}</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Trạng thái quyền tải</label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-slate-700"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                >
                  <option value="active">Có quyền tải</option>
                  <option value="revoked">Đã thu hồi</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCustomer(null)} disabled={isEditLoading}>Hủy</Button>
            <Button onClick={handleSaveEdit} disabled={isEditLoading}>
              {isEditLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Xóa quyền truy cập */}
      <DeleteConfirmDialog
        open={deletingCustomer !== null}
        onOpenChange={(open) => { if (!open) setDeletingCustomer(null); }}
        title="Xóa quyền tải tài nguyên"
        itemName={deletingCustomer?.customerName ?? "khách hàng"}
        dependencies={
          deletingCustomer && deletingCustomer.downloadCount > 0
            ? [
                {
                  label: "Lịch sử tải xuống (sẽ bị xóa vĩnh viễn)",
                  count: deletingCustomer.downloadCount,
                  preview: [
                    {
                      id: "download-history",
                      name: `Khách đã tải tài nguyên này ${deletingCustomer.downloadCount} lần`,
                    },
                  ],
                  hasMore: false,
                },
              ]
            : []
        }
        onConfirm={handleConfirmDelete}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
