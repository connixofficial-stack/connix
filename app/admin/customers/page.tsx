'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronDown, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { BulkActionBar, ColumnToggle, generatePaginationItems, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { usePersistedPageSize } from '../components/usePersistedPageSize';

const MODULE_KEY = 'customers';

export default function CustomersListPage() {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <CustomersContent />
    </ModuleGuard>
  );
}

function CustomersContent() {
  // Convex queries
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });

  // Convex mutations
  const deleteCustomer = useMutation(api.customers.remove);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'Active' | 'Inactive'>('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem('admin_customers_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"customers">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"customers"> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const isSelectAllActive = selectionMode === 'all';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    if (visibleColumns.length > 0) {
      window.localStorage.setItem('admin_customers_visible_columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const customersPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'customersPerPage');
    return (setting?.value as number) || 20;
  }, [settingsData]);

  const [resolvedCustomersPerPage, setPageSizeOverride] = usePersistedPageSize('admin_customers_page_size', customersPerPage);

  const offset = (currentPage - 1) * resolvedCustomersPerPage;

  const customersData = useQuery(api.customers.listAdminWithOffset, {
    limit: resolvedCustomersPerPage,
    offset,
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    status: filterStatus || undefined,
  });

  const deleteInfo = useQuery(
    api.customers.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const totalCountData = useQuery(api.customers.countAdmin, {
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    status: filterStatus || undefined,
  });

  const selectAllData = useQuery(
    api.customers.listAdminIds,
    isSelectAllActive
      ? {
          search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
          status: filterStatus || undefined,
        }
      : 'skip'
  );

  const isTableLoading = customersData === undefined || totalCountData === undefined;

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 khách hàng phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  // Get enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const showAvatar = enabledFeatures.enableAvatar ?? true;

  const columns = [
    { key: 'select', label: 'Chọn' },
    { key: 'customer', label: 'Khách hàng', required: true },
    { key: 'contact', label: 'Liên hệ' },
    { key: 'city', label: 'Thành phố' },
    { key: 'orders', label: 'Đơn hàng' },
    { key: 'totalSpent', label: 'Tổng chi tiêu' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Hành động', required: true }
  ];
  const resolvedVisibleColumns = visibleColumns.length > 0 ? visibleColumns : columns.map(c => c.key);

  // Map customers data
  const customers = useMemo(() => customersData?.map(c => ({
      ...c,
      id: c._id,
    })) ?? [], [customersData]);

  const sortedData = useSortableData(customers, sortConfig);

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedCustomersPerPage) : 1;
  const paginatedData = sortedData;
  const tableColumnCount = resolvedVisibleColumns.length;
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const applyManualSelection = (nextIds: Id<"customers">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterStatus('');
    setCurrentPage(1);
    setPageSizeOverride(null);
    applyManualSelection([]);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value as '' | 'Active' | 'Inactive');
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const base = prev.length > 0 ? prev : columns.map(c => c.key);
      return base.includes(key) ? base.filter(k => k !== key) : [...base, key];
    });
  };

  const selectedOnPage = paginatedData.filter(customer => selectedIds.includes(customer._id));
  const isPageSelected = paginatedData.length > 0 && selectedOnPage.length === paginatedData.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedData.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedData.some(customer => customer._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedData.forEach(customer => next.add(customer._id));
    applyManualSelection(Array.from(next));
  };
  const toggleSelectItem = (id: Id<"customers">) =>{
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const handleDelete = async (id: Id<"customers">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteCustomer({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa khách hàng');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi khi xóa khách hàng';
      toast.error(message);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // CUST-007 FIX: Bulk delete with progress indicator
  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${selectedIds.length} khách hàng đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {return;}
    
    const total = selectedIds.length;
    let deleted = 0;
    let failed = 0;
    
    toast.loading(`Đang xóa 0/${total}...`);
    
    for (const id of selectedIds) {
      try {
        await deleteCustomer({ cascade: true, id });
        deleted++;
        toast.loading(`Đang xóa ${deleted}/${total}...`);
      } catch {
        failed++;
      }
    }
    
    toast.dismiss();
    applyManualSelection([]);
    
    if (failed === 0) {
      toast.success(`Đã xóa ${deleted} khách hàng`);
    } else {
      toast.warning(`Đã xóa ${deleted}/${total} khách hàng. ${failed} lỗi.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Khách hàng</h1>
          <p className="text-sm text-slate-500">Quản lý thông tin khách hàng và lịch sử mua hàng</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/customers/create">
            <Button className="gap-2"><Plus size={16} /> Thêm mới</Button>
          </Link>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="khách hàng"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedData.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedData.map(customer => customer._id)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  applyManualSelection([]); }}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm tên, email, SĐT..."
                className="pl-9 w-56"
                value={searchTerm}
                onChange={(e) =>{  handleSearchChange(e.target.value); }}
              />
            </div>
            <select
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) =>{  handleFilterChange(e.target.value); }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Đã khóa</option>
            </select>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
          </div>
          <ColumnToggle columns={columns} visibleColumns={resolvedVisibleColumns} onToggle={toggleColumn} />
        </div>

        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              {resolvedVisibleColumns.includes('select') && (
                <TableHead className="w-[40px]">
                  <SelectCheckbox
                    checked={isPageSelected}
                    onChange={toggleSelectAll}
                    indeterminate={isPageIndeterminate}
                  />
                </TableHead>
              )}
              {resolvedVisibleColumns.includes('customer') && <SortableHeader label="Khách hàng" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('contact') && <TableHead>Liên hệ</TableHead>}
              {resolvedVisibleColumns.includes('city') && <SortableHeader label="Thành phố" sortKey="city" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('orders') && <SortableHeader label="Đơn hàng" sortKey="ordersCount" sortConfig={sortConfig} onSort={handleSort} className="text-center" />}
              {resolvedVisibleColumns.includes('totalSpent') && <SortableHeader label="Tổng chi tiêu" sortKey="totalSpent" sortConfig={sortConfig} onSort={handleSort} className="text-right" />}
              {resolvedVisibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} className="text-center" />}
              {resolvedVisibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: resolvedCustomersPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell colSpan={tableColumnCount}>
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {paginatedData.map(customer => (
                  <TableRow key={customer._id} className={selectedIds.includes(customer._id) ? 'bg-blue-500/5' : ''}>
                {resolvedVisibleColumns.includes('select') && (
                  <TableCell>
                    <SelectCheckbox checked={selectedIds.includes(customer._id)} onChange={() =>{  toggleSelectItem(customer._id); }} />
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('customer') && (
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {showAvatar && (
                        customer.avatar ? (
                          <Image src={customer.avatar} width={36} height={36} className="w-9 h-9 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-medium text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                        )
                      )}
                      <div className="font-medium">{customer.name}</div>
                    </div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('contact') && (
                  <TableCell>
                    <div className="text-sm">{customer.email}</div>
                    <div className="text-xs text-slate-500">{customer.phone}</div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('city') && (
                  <TableCell className="text-slate-500">{customer.city ?? '-'}</TableCell>
                )}
                {resolvedVisibleColumns.includes('orders') && (
                  <TableCell className="text-center">
                    <Badge variant="secondary">{customer.ordersCount}</Badge>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('totalSpent') && (
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(customer.totalSpent)}
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('status') && (
                  <TableCell className="text-center">
                    <Badge variant={customer.status === 'Active' ? 'success' : 'secondary'}>
                      {customer.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/customers/${customer._id}/edit`}>
                        <Button variant="ghost" size="icon"><Edit size={16} /></Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={ async () => handleDelete(customer._id)}
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
            {!isTableLoading && paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="text-center py-8 text-slate-500">
                  {searchTerm || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có khách hàng nào'}
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
                  value={resolvedCustomersPerPage}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số khách hàng mỗi trang"
                >
                  {[10, 20, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>khách/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedCustomersPerPage) + 1 : 0}–{Math.min(currentPage * resolvedCustomersPerPage, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">khách hàng</span>
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
                  <ChevronDown className="h-4 w-4 rotate-90" />
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
                          ? 'bg-purple-600 text-white shadow-sm border font-medium'
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
                  <ChevronDown className="h-4 w-4 -rotate-90" />
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
        title="Xóa khách hàng"
        itemName={customers.find((customer) => customer.id === deleteTargetId)?.name ?? 'khách hàng'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}

