'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { Eye, Loader2, Mail, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { BulkActionBar, ColumnToggle, generatePaginationItems, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { usePersistedPageSize } from '../components/usePersistedPageSize';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'warning' | 'success' | 'destructive' | 'info' }> = {
  new: { label: 'Mới', variant: 'warning' },
  in_progress: { label: 'Đang xử lý', variant: 'info' },
  resolved: { label: 'Đã xử lý', variant: 'success' },
  spam: { label: 'Spam', variant: 'destructive' },
};

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

export default function ContactInboxPage() {
  return (
    <ModuleGuard moduleKey="contactInbox">
      <ContactInboxContent />
    </ModuleGuard>
  );
}

function ContactInboxContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'new' | 'in_progress' | 'resolved' | 'spam'>('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'desc', key: 'createdAt' });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem('admin_contact_inbox_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<'contactInquiries'>[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<'contactInquiries'> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const updateStatus = useMutation(api.contactInbox.updateInquiryStatus);
  const deleteInquiry = useMutation(api.contactInbox.remove);
  const bulkRemove = useMutation(api.contactInbox.bulkRemove);
  const inboxAdminFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'contactInbox', featureKey: 'enableContactInboxAdmin' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => { clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    if (visibleColumns.length > 0) {
      window.localStorage.setItem('admin_contact_inbox_visible_columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  useEffect(() => {
    setCurrentPage(1);
    setManualSelectedIds([]);
    setSelectionMode('manual');
  }, [debouncedSearchTerm, filterStatus]);

  const [resolvedPageSize, setPageSizeOverride] = usePersistedPageSize('admin_contact_inbox_page_size', 20);
  const offset = (currentPage - 1) * resolvedPageSize;
  const resolvedSearch = debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined;
  const shouldLoadInbox = inboxAdminFeature?.enabled === true;

  const inquiries = useQuery(
    api.contactInbox.listInbox,
    shouldLoadInbox
      ? {
        limit: resolvedPageSize,
        offset,
        search: resolvedSearch,
        status: filterStatus || undefined,
      }
      : 'skip'
  );

  const stats = useQuery(api.contactInbox.getInboxStats, shouldLoadInbox ? {} : 'skip');
  const totalCountData = useQuery(
    api.contactInbox.countAdmin,
    shouldLoadInbox
      ? { search: resolvedSearch, status: filterStatus || undefined }
      : 'skip'
  );

  const selectAllData = useQuery(
    api.contactInbox.listAdminIds,
    shouldLoadInbox && selectionMode === 'all'
      ? { search: resolvedSearch, status: filterStatus || undefined }
      : 'skip'
  );

  const isTableLoading = shouldLoadInbox && (inquiries === undefined || totalCountData === undefined);
  const safeInquiries = useMemo(() => inquiries ?? [], [inquiries]);
  const safeStats = stats ?? { total: 0, new: 0, in_progress: 0, resolved: 0, spam: 0 };
  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedPageSize) : 1;

  const columns = useMemo(() => [
    { key: 'select', label: 'Chọn' },
    { key: 'contact', label: 'Khách liên hệ', required: true },
    { key: 'subject', label: 'Chủ đề', required: true },
    { key: 'status', label: 'Trạng thái' },
    { key: 'createdAt', label: 'Thời gian' },
    { key: 'actions', label: 'Hành động', required: true },
  ], []);

  useEffect(() => {
    if (columns.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(columns.map(column => column.key));
    }
  }, [columns, visibleColumns.length]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]);
  };

  const normalizedData = useMemo(() => safeInquiries.map((inquiry) => ({
    ...inquiry,
    id: inquiry._id,
  })), [safeInquiries]);

  const sortedData = useSortableData(normalizedData, sortConfig);
  const tableColumnCount = visibleColumns.length || columns.length;

  const isSelectAllActive = selectionMode === 'all';
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 tin nhắn phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  if (inboxAdminFeature === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!inboxAdminFeature?.enabled) {
    return (
      <Card className="p-6 text-center text-slate-500">
        Tính năng quản trị tin nhắn liên hệ đang tắt. Vui lòng liên hệ quản trị viên hệ thống để bật tính năng này.
      </Card>
    );
  }

  const applyManualSelection = (nextIds: Id<'contactInquiries'>[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const selectedOnPage = sortedData.filter((inquiry) => selectedIds.includes(inquiry._id));
  const isPageSelected = sortedData.length > 0 && selectedOnPage.length === sortedData.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < sortedData.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !sortedData.some(inquiry => inquiry._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    sortedData.forEach(inquiry => next.add(inquiry._id));
    applyManualSelection(Array.from(next));
  };

  const toggleSelectItem = (id: Id<'contactInquiries'>) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(item => item !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
  };

  const handleStatusChange = async (id: Id<'contactInquiries'>, status: 'new' | 'in_progress' | 'resolved' | 'spam') => {
    try {
      await updateStatus({ id, status });
      toast.success('Đã cập nhật trạng thái');
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleDelete = (id: Id<'contactInquiries'>) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteInquiry({ id: deleteTargetId });
      toast.success('Đã xóa tin nhắn');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Có lỗi khi xóa tin nhắn');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) {
      return;
    }
    if (!confirm(`Xóa ${selectedIds.length} tin nhắn đã chọn?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const count = await bulkRemove({ ids: selectedIds });
      toast.success(`Đã xóa ${count} tin nhắn`);
      applyManualSelection([]);
    } catch {
      toast.error('Có lỗi khi xóa tin nhắn');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedInquiryName = sortedData.find((item) => item._id === deleteTargetId)?.name ?? 'tin nhắn';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tin nhắn liên hệ</h1>
          <p className="text-sm text-slate-500">
            Danh sách tin nhắn khách gửi từ form liên hệ trên website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Tổng: {safeStats.total}</Badge>
          <Badge variant="warning">Mới: {safeStats.new}</Badge>
          <Badge variant="info">Đang xử lý: {safeStats.in_progress}</Badge>
          <Badge variant="success">Đã xử lý: {safeStats.resolved}</Badge>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="tin nhắn"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={sortedData.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(sortedData.map(inquiry => inquiry._id)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  applyManualSelection([]); }}
        isLoading={isDeleting}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tên, email, SĐT, chủ đề..."
                className="pl-9 w-56"
                value={searchTerm}
                onChange={(event) =>{  setSearchTerm(event.target.value); }}
              />
            </div>
            <select
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(event) =>{  setFilterStatus(event.target.value as typeof filterStatus); }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="new">Mới</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="resolved">Đã xử lý</option>
              <option value="spam">Spam</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>{
                setSearchTerm('');
                setDebouncedSearchTerm('');
                setFilterStatus('');
                setCurrentPage(1);
                setPageSizeOverride(null);
                applyManualSelection([]);
              }}
            >
              Xóa lọc
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <ColumnToggle columns={columns} visibleColumns={visibleColumns} onToggle={toggleColumn} />
          </div>
        </div>

        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              {visibleColumns.includes('select') && (
                <TableHead className="w-[40px]">
                  <SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} />
                </TableHead>
              )}
              {visibleColumns.includes('contact') && (
                <SortableHeader label="Khách liên hệ" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
              )}
              {visibleColumns.includes('subject') && (
                <SortableHeader label="Chủ đề" sortKey="subject" sortConfig={sortConfig} onSort={handleSort} />
              )}
              {visibleColumns.includes('status') && (
                <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              )}
              {visibleColumns.includes('createdAt') && (
                <SortableHeader label="Thời gian" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
              )}
              {visibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: resolvedPageSize }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell colSpan={tableColumnCount}>
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {sortedData.map((inquiry) => (
                  <TableRow key={inquiry._id} className={selectedIds.includes(inquiry._id) ? 'bg-blue-500/5' : ''}>
                {visibleColumns.includes('select') && (
                  <TableCell>
                    <SelectCheckbox checked={selectedIds.includes(inquiry._id)} onChange={() =>{  toggleSelectItem(inquiry._id); }} />
                  </TableCell>
                )}
                {visibleColumns.includes('contact') && (
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{inquiry.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        {inquiry.email && <span className="flex items-center gap-1"><Mail size={12} />{inquiry.email}</span>}
                        {inquiry.phone && <span>{inquiry.phone}</span>}
                      </div>
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes('subject') && (
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{inquiry.subject}</div>
                      <div className="text-xs text-slate-500 line-clamp-2" title={inquiry.message}>{inquiry.message}</div>
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes('status') && (
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge variant={STATUS_LABELS[inquiry.status]?.variant ?? 'secondary'}>
                        {STATUS_LABELS[inquiry.status]?.label ?? inquiry.status}
                      </Badge>
                      <select
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        value={inquiry.status}
                        onChange={(event) =>{ void handleStatusChange(inquiry._id, event.target.value as 'new' | 'in_progress' | 'resolved' | 'spam'); }}
                      >
                        <option value="new">Mới</option>
                        <option value="in_progress">Đang xử lý</option>
                        <option value="resolved">Đã xử lý</option>
                        <option value="spam">Spam</option>
                      </select>
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes('createdAt') && (
                  <TableCell className="text-sm text-slate-500">
                    {new Date(inquiry.createdAt).toLocaleString('vi-VN')}
                  </TableCell>
                )}
                {visibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/contact-inbox/${inquiry._id}`}>
                        <Button variant="ghost" size="icon" title="Xem chi tiết"><Eye size={16} /></Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() =>{  handleDelete(inquiry._id); }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                )}
                  </TableRow>
                ))}
              </>
            )}
            {!isTableLoading && sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="text-center py-8 text-slate-500">
                  {searchTerm || filterStatus ? 'Không tìm thấy tin nhắn phù hợp' : 'Chưa có tin nhắn nào.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalCount > 0 && !isTableLoading && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 flex w-full items-center justify-between text-sm text-slate-500 sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Hiển thị</span>
                <select
                  value={resolvedPageSize}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số tin nhắn mỗi trang"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>tin nhắn/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedPageSize) + 1 : 0}–{Math.min(currentPage * resolvedPageSize, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">tin nhắn</span>
              </div>
            </div>

            <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
              <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
                <button
                  onClick={() =>{  setCurrentPage((prev) => Math.max(1, prev - 1)); }}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Trang trước"
                >
                  <span className="sr-only">Trang trước</span>
                  <svg className="h-4 w-4 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>

                {generatePaginationItems(currentPage, totalPages).map((item, index) => {
                  if (item === 'ellipsis') {
                    return (
                      <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">
                        …
                      </div>
                    );
                  }

                  const pageNum = item as number;
                  const isActive = pageNum === currentPage;
                  const isMobileHidden = !isActive && pageNum !== 1 && pageNum !== totalPages;

                  return (
                    <button
                      key={pageNum}
                      onClick={() =>{  setCurrentPage(pageNum); }}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm border font-medium'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      } ${isMobileHidden ? 'hidden sm:inline-flex' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>{  setCurrentPage((prev) => Math.min(totalPages, prev + 1)); }}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Trang sau"
                >
                  <span className="sr-only">Trang sau</span>
                  <svg className="h-4 w-4 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
              </nav>
            </div>
          </div>
        )}
      </Card>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa tin nhắn"
        itemName={selectedInquiryName}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
