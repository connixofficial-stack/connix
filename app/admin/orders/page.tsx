'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronDown, Copy, Edit, ExternalLink, Eye, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { BulkActionBar, ColumnToggle, generatePaginationItems, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { useOrderStatuses } from '@/lib/experiences';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import { buildAbsoluteWebUrl, buildPublicOrderLookupPath } from '@/lib/orders/links';

const MODULE_KEY = 'orders';

type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, 'secondary' | 'success' | 'destructive'> = {
  Failed: 'destructive',
  Paid: 'success',
  Pending: 'secondary',
  Refunded: 'secondary',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  Failed: 'Thất bại',
  Paid: 'Đã TT',
  Pending: 'Chờ TT',
  Refunded: 'Hoàn tiền',
};

export default function OrdersListPage() {
  return (
    <ModuleGuard moduleKey="orders">
      <OrdersContent />
    </ModuleGuard>
  );
}

function OrdersContent() {
  const customersData = useQuery(api.customers.listAll, { limit: 500 });
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const { statuses: orderStatuses } = useOrderStatuses();
  
  const deleteOrder = useMutation(api.orders.remove);
  const bulkDeleteOrders = useMutation(api.orders.bulkRemove);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'' | 'Pending' | 'Paid' | 'Failed' | 'Refunded'>('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem('admin_orders_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"orders">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"orders"> | null>(null);
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
      window.localStorage.setItem('admin_orders_visible_columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);
  const statusMap = useMemo(() => new Map(orderStatuses.map((status) => [status.key, status])), [orderStatuses]);
  const getStatusVariant = (statusKey: string) => {
    const key = statusKey.toLowerCase();
    if (key.includes('cancel')) return 'destructive';
    if (key.includes('refund')) return 'secondary';
    if (key.includes('deliver') || key.includes('complete')) return 'success';
    if (key.includes('ship') || key.includes('process')) return 'warning';
    return 'secondary';
  };

  const buildOrderLookupUrl = (orderNumber: string) => {
    const path = buildPublicOrderLookupPath(orderNumber);
    return typeof window === 'undefined'
      ? path
      : buildAbsoluteWebUrl(window.location.origin, path);
  };

  const handleCopyOrderLookupUrl = async (orderNumber: string) => {
    try {
      await navigator.clipboard.writeText(buildOrderLookupUrl(orderNumber));
      toast.success('Đã copy link tra cứu đơn hàng.');
    } catch {
      toast.error('Không thể copy link. Vui lòng copy thủ công.');
    }
  };

  const handleOpenOrderLookupUrl = (orderNumber: string) => {
    window.open(buildOrderLookupUrl(orderNumber), '_blank', 'noopener,noreferrer');
  };

  const columns = useMemo(() => {
    const cols = [
      { key: 'select', label: 'Chọn' },
      { key: 'orderNumber', label: 'Mã đơn', required: true },
      { key: 'customer', label: 'Khách hàng' },
      { key: 'items', label: 'Sản phẩm' },
      { key: 'totalAmount', label: 'Tổng tiền' },
      { key: 'status', label: 'Trạng thái' },
    ];
    if (enabledFields.has('paymentStatus')) {cols.push({ key: 'paymentStatus', label: 'Thanh toán' });}
    if (enabledFields.has('trackingNumber')) {cols.push({ key: 'trackingNumber', label: 'Mã vận đơn' });}
    cols.push({ key: 'createdAt', label: 'Ngày tạo' });
    cols.push({ key: 'actions', label: 'Hành động', required: true });
    return cols;
  }, [enabledFields]);

  useEffect(() => {
    if (columns.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(columns.map(c => c.key));
    }
  }, [columns, visibleColumns.length]);

  useEffect(() => {
    if (fieldsData !== undefined) {
      setVisibleColumns(prev => {
        const validKeys = new Set(columns.map(c => c.key));
        return prev.filter(key => validKeys.has(key));
      });
    }
  }, [fieldsData, columns]);

  // Lấy setting ordersPerPage từ module settings
  const ordersPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'ordersPerPage');
    return (setting?.value as number) || 20;
  }, [settingsData]);

  const [resolvedOrdersPerPage, setPageSizeOverride] = usePersistedPageSize('admin_orders_page_size', ordersPerPage);

  const offset = (currentPage - 1) * resolvedOrdersPerPage;

  const ordersData = useQuery(api.orders.listAdminWithOffset, {
    limit: resolvedOrdersPerPage,
    offset,
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    status: filterStatus || undefined,
    paymentStatus: filterPaymentStatus || undefined,
  });

  const totalCountData = useQuery(api.orders.countAdmin, {
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    status: filterStatus || undefined,
    paymentStatus: filterPaymentStatus || undefined,
  });

  const deleteInfo = useQuery(
    api.orders.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const selectAllData = useQuery(
    api.orders.listAdminIds,
    isSelectAllActive
      ? {
          search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
          status: filterStatus || undefined,
          paymentStatus: filterPaymentStatus || undefined,
        }
      : 'skip'
  );

  const isTableLoading = ordersData === undefined || totalCountData === undefined || customersData === undefined || fieldsData === undefined;

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 đơn hàng phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  // Build customer map using Map for O(1) lookup
  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customersData?.forEach(c => map.set(c._id, c.name));
    return map;
  }, [customersData]);

  const orders = useMemo(() => ordersData?.map(o => ({
      ...o,
      id: o._id,
      customerName: customerMap.get(o.customerId) ?? 'Không xác định',
      itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
    })) ?? [], [ordersData, customerMap]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const sortedData = useSortableData(orders, sortConfig);

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedOrdersPerPage) : 1;
  const paginatedData = sortedData;
  const tableColumnCount = visibleColumns.length;
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const applyManualSelection = (nextIds: Id<"orders">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterStatus('');
    setFilterPaymentStatus('');
    setCurrentPage(1);
    setPageSizeOverride(null);
    applyManualSelection([]);
  };

  const handleFilterChange = (type: 'status' | 'paymentStatus', value: string) => {
    if (type === 'status') {
      setFilterStatus(value);
    } else {
      setFilterPaymentStatus(value as '' | 'Pending' | 'Paid' | 'Failed' | 'Refunded');
    }
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const selectedOnPage = paginatedData.filter(order => selectedIds.includes(order._id));
  const isPageSelected = paginatedData.length > 0 && selectedOnPage.length === paginatedData.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedData.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedData.some(order => order._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedData.forEach(order => next.add(order._id));
    applyManualSelection(Array.from(next));
  };

  const toggleSelectItem = (id: Id<"orders">) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const handleDelete = async (id: Id<"orders">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteOrder({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa đơn hàng');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Có lỗi khi xóa đơn hàng');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} đơn hàng đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      setIsDeleting(true);
      try {
        const deletedCount = await bulkDeleteOrders({ cascade: true, ids: selectedIds });
        applyManualSelection([]);
        toast.success(`Đã xóa ${deletedCount} đơn hàng`);
      } catch {
        toast.error('Có lỗi khi xóa đơn hàng');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('vi-VN');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Đơn hàng</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý đơn hàng và vận chuyển</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/orders/create"><Button className="gap-2 bg-emerald-600 hover:bg-emerald-500"><Plus size={16}/> Tạo đơn hàng</Button></Link>
        </div>
      </div>

      <BulkActionBar 
        selectedCount={selectedIds.length} 
        entityLabel="đơn hàng"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedData.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedData.map(order => order._id)); }}
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
              <Input placeholder="Tìm mã đơn, khách hàng..." className="pl-9 w-48" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); setCurrentPage(1); applyManualSelection([]); }} />
            </div>
            <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterStatus} onChange={(e) =>{  handleFilterChange('status', e.target.value); }}>
              <option value="">Tất cả trạng thái</option>
              {orderStatuses.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
            {enabledFields.has('paymentStatus') && (
              <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterPaymentStatus} onChange={(e) =>{  handleFilterChange('paymentStatus', e.target.value); }}>
                <option value="">Tất cả TT toán</option>
                <option value="Pending">Chờ thanh toán</option>
                <option value="Paid">Đã thanh toán</option>
                <option value="Failed">Thất bại</option>
                <option value="Refunded">Hoàn tiền</option>
              </select>
            )}
            <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
          </div>
          <ColumnToggle columns={columns} visibleColumns={visibleColumns} onToggle={toggleColumn} />
        </div>
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              {visibleColumns.includes('select') && <TableHead className="w-[40px]"><SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} /></TableHead>}
              {visibleColumns.includes('orderNumber') && <SortableHeader label="Mã đơn" sortKey="orderNumber" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('customer') && <SortableHeader label="Khách hàng" sortKey="customerName" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('items') && <TableHead>Sản phẩm</TableHead>}
              {visibleColumns.includes('totalAmount') && <SortableHeader label="Tổng tiền" sortKey="totalAmount" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('paymentStatus') && enabledFields.has('paymentStatus') && <SortableHeader label="Thanh toán" sortKey="paymentStatus" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('trackingNumber') && enabledFields.has('trackingNumber') && <TableHead>Mã vận đơn</TableHead>}
              {visibleColumns.includes('createdAt') && <SortableHeader label="Ngày tạo" sortKey="_creationTime" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: resolvedOrdersPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell colSpan={tableColumnCount}>
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {paginatedData.map(order => (
                  <TableRow key={order._id} className={selectedIds.includes(order._id) ? 'bg-emerald-500/5' : ''}>
                {visibleColumns.includes('select') && <TableCell><SelectCheckbox checked={selectedIds.includes(order._id)} onChange={() =>{  toggleSelectItem(order._id); }} /></TableCell>}
                {visibleColumns.includes('orderNumber') && <TableCell className="font-mono text-sm font-medium text-emerald-600">{order.orderNumber}</TableCell>}
                {visibleColumns.includes('customer') && <TableCell>{order.customerName}</TableCell>}
                {visibleColumns.includes('items') && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ShoppingBag size={14} className="text-slate-400" />
                      <span>{order.itemsCount} sản phẩm</span>
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes('totalAmount') && <TableCell className="font-medium">{formatPrice(order.totalAmount)}</TableCell>}
                {visibleColumns.includes('status') && (
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {statusMap.get(order.status)?.label ?? order.status}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.includes('paymentStatus') && enabledFields.has('paymentStatus') && order.paymentStatus && (
                  <TableCell>
                    <Badge variant={PAYMENT_STATUS_COLORS[order.paymentStatus as PaymentStatus]}>
                      {PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.includes('trackingNumber') && enabledFields.has('trackingNumber') && (
                  <TableCell className="font-mono text-xs text-slate-500">{order.trackingNumber ?? '-'}</TableCell>
                )}
                {visibleColumns.includes('createdAt') && <TableCell className="text-slate-500 text-sm">{formatDate(order._creationTime)}</TableCell>}
                {visibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/orders/${order._id}/edit`}><Button variant="ghost" size="icon" title="Xem chi tiết"><Eye size={16}/></Button></Link>
                      <Link href={`/admin/orders/${order._id}/edit`}><Button variant="ghost" size="icon"><Edit size={16}/></Button></Link>
                      <Button variant="ghost" size="icon" title="Copy link tra cứu" onClick={async () => handleCopyOrderLookupUrl(order.orderNumber)}><Copy size={16}/></Button>
                      <Button variant="ghost" size="icon" title="Mở link tra cứu" onClick={() => handleOpenOrderLookupUrl(order.orderNumber)}><ExternalLink size={16}/></Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(order._id)}><Trash2 size={16}/></Button>
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
                  {searchTerm || filterStatus || filterPaymentStatus ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có đơn hàng nào.'}
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
                  value={resolvedOrdersPerPage}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số đơn hàng mỗi trang"
                >
                  {[10, 20, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>đơn/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedOrdersPerPage) + 1 : 0}–{Math.min(currentPage * resolvedOrdersPerPage, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">đơn hàng</span>
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
                          ? 'bg-emerald-600 text-white shadow-sm border font-medium'
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
        title="Xóa đơn hàng"
        itemName={orders.find((order) => order.id === deleteTargetId)?.orderNumber ?? 'đơn hàng'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
