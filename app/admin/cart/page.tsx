'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AlertTriangle, CheckCircle, Eye, Loader2, Search, ShoppingCart, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { ColumnToggle, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';

const MODULE_KEY = 'cart';

type CartStatus = 'Active' | 'Converted' | 'Abandoned';

const STATUS_COLORS: Record<CartStatus, 'default' | 'success' | 'destructive'> = {
  Abandoned: 'destructive',
  Active: 'default',
  Converted: 'success',
};

const STATUS_LABELS: Record<CartStatus, string> = {
  Abandoned: 'Bỏ dở',
  Active: 'Hoạt động',
  Converted: 'Đã đặt hàng',
};

export default function CartListPage() {
  return (
    <ModuleGuard moduleKey="cart">
      <CartContent />
    </ModuleGuard>
  );
}

function CartContent() {
  // FIX Issue #7: Use listAll with limit instead of fetching ALL
  const cartsData = useQuery(api.cart.listAll, { limit: 100 });
  const customersData = useQuery(api.customers.listAll, { limit: 100 });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  // FIX: Use getStats for efficient statistics instead of calculating from full list
  const statsData = useQuery(api.cart.getStats);
  const deleteCart = useMutation(api.cart.remove);
  const markAsAbandoned = useMutation(api.cart.markAsAbandoned);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'desc', key: '_creationTime' });
  const [customVisibleColumns, setCustomVisibleColumns] = useState<string[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Id<"carts">[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const isLoading = cartsData === undefined || customersData === undefined;

  // Get enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  // FIX Issue #9: Convert settings to Map for O(1) lookup instead of O(n) Array.find()
  const settingsMap = useMemo(() => new Map(settingsData?.map(s => [s.settingKey, s.value]) ?? []), [settingsData]);

  // Get cartsPerPage from settings using Map lookup
  const cartsPerPage = useMemo(() => (settingsMap.get('cartsPerPage') as number) || 20, [settingsMap]);

  const columns = useMemo(() => {
    const cols = [
      { key: 'select', label: 'Chọn' },
      { key: 'customer', label: 'Khách hàng / Session', required: true },
      { key: 'itemsCount', label: 'Số SP' },
      { key: 'totalAmount', label: 'Tổng tiền' },
      { key: 'status', label: 'Trạng thái' },
    ];
    if (enabledFeatures.enableExpiry) {cols.push({ key: 'expiresAt', label: 'Hết hạn' });}
    cols.push({ key: 'createdAt', label: 'Ngày tạo' });
    cols.push({ key: 'actions', label: 'Hành động', required: true });
    return cols;
  }, [enabledFeatures]);

  const visibleColumns = useMemo(() => customVisibleColumns ?? columns.map(c => c.key), [customVisibleColumns, columns]);

  const customerMap = useMemo(() => {
    const map: Record<string, string> = {};
    customersData?.forEach(c => { map[c._id] = c.name; });
    return map;
  }, [customersData]);

  const carts = useMemo(() => cartsData?.map(c => ({
      ...c,
      id: c._id,
      customerName: c.customerId ? customerMap[c.customerId] || 'Khách hàng' : null,
      sessionLabel: c.sessionId ? `Guest: ${c.sessionId.slice(0, 12)}...` : null,
    })) ?? [], [cartsData, customerMap]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
  };

  const toggleColumn = (key: string) => {
    setCustomVisibleColumns(prev => {
      const base = prev ?? columns.map(c => c.key);
      return base.includes(key) ? base.filter(k => k !== key) : [...base, key];
    });
  };

  const filteredData = useMemo(() => {
    let data = [...carts];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(c => 
        (c.customerName && c.customerName.toLowerCase().includes(term)) ??
        (c.sessionId && c.sessionId.toLowerCase().includes(term))
      );
    }
    if (filterStatus) {data = data.filter(c => c.status === filterStatus);}
    return data;
  }, [carts, searchTerm, filterStatus]);

  const sortedData = useSortableData(filteredData, sortConfig);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / cartsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * cartsPerPage;
    return sortedData.slice(start, start + cartsPerPage);
  }, [sortedData, currentPage, cartsPerPage]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const toggleSelectAll = () =>{  setSelectedIds(selectedIds.length === paginatedData.length ? [] : paginatedData.map(c => c._id)); };
  const toggleSelectItem = (id: Id<"carts">) =>{  setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const handleDelete = async (id: Id<"carts">) => {
    if (confirm('Xóa giỏ hàng này?')) {
      try {
        await deleteCart({ id });
        toast.success('Đã xóa giỏ hàng');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Có lỗi khi xóa giỏ hàng');
      }
    }
  };

  // FIX HIGH-003: Use Promise.all for parallel bulk delete
  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} giỏ hàng đã chọn?`)) {
      try {
        await Promise.all(selectedIds.map( async id => deleteCart({ id })));
        setSelectedIds([]);
        toast.success(`Đã xóa ${selectedIds.length} giỏ hàng`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Có lỗi khi xóa giỏ hàng');
      }
    }
  };

  // FIX HIGH-003: Use Promise.all for parallel bulk mark abandoned
  const handleBulkMarkAbandoned = async () => {
    if (confirm(`Đánh dấu ${selectedIds.length} giỏ hàng là bỏ dở?`)) {
      try {
        await Promise.all(selectedIds.map( async id => markAsAbandoned({ id })));
        setSelectedIds([]);
        toast.success(`Đã đánh dấu ${selectedIds.length} giỏ hàng là bỏ dở`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Có lỗi khi cập nhật');
      }
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('vi-VN');

  // FIX: Use statsData from server instead of calculating from full client-side list
  const stats = useMemo(() => ({
    abandoned: statsData?.abandoned ?? carts.filter(c => c.status === 'Abandoned').length,
    active: statsData?.active ?? carts.filter(c => c.status === 'Active').length,
    converted: statsData?.converted ?? carts.filter(c => c.status === 'Converted').length,
    total: statsData?.total ?? carts.length,
  }), [statsData, carts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Giỏ hàng</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý giỏ hàng của khách</p>
        </div>
        <div className="flex gap-2" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-500/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              <p className="text-sm text-slate-500">Tổng giỏ hàng</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              <p className="text-sm text-slate-500">Hoạt động</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.abandoned}</p>
              <p className="text-sm text-slate-500">Bỏ dở</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.converted}</p>
              <p className="text-sm text-slate-500">Đã đặt hàng</p>
            </div>
          </div>
        </Card>
      </div>

      {selectedIds.length > 0 && (
        <Card className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Đã chọn {selectedIds.length} giỏ hàng
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkMarkAbandoned} className="gap-1">
                <AlertTriangle size={14} /> Đánh dấu bỏ dở
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkDelete} className="gap-1 text-red-500 hover:text-red-600">
                <Trash2 size={14} /> Xóa
              </Button>
              <Button variant="ghost" size="sm" onClick={() =>{  setSelectedIds([]); }}>
                Bỏ chọn
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Tìm khách hàng, session..." className="pl-9 w-48" value={searchTerm} onChange={(e) =>{  handleSearchChange(e.target.value); }} />
            </div>
            <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterStatus} onChange={(e) =>{  handleFilterChange(e.target.value); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Hoạt động</option>
              <option value="Abandoned">Bỏ dở</option>
              <option value="Converted">Đã đặt hàng</option>
            </select>
          </div>
          <ColumnToggle columns={columns} visibleColumns={visibleColumns} onToggle={toggleColumn} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.includes('select') && <TableHead className="w-[40px]"><SelectCheckbox checked={selectedIds.length === paginatedData.length && paginatedData.length > 0} onChange={toggleSelectAll} indeterminate={selectedIds.length > 0 && selectedIds.length < paginatedData.length} /></TableHead>}
              {visibleColumns.includes('customer') && <SortableHeader label="Khách hàng / Session" sortKey="customerName" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('itemsCount') && <SortableHeader label="Số SP" sortKey="itemsCount" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('totalAmount') && <SortableHeader label="Tổng tiền" sortKey="totalAmount" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('expiresAt') &&  enabledFeatures.enableExpiry && <SortableHeader label="Hết hạn" sortKey="expiresAt" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('createdAt') && <SortableHeader label="Ngày tạo" sortKey="_creationTime" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map(cart => (
              <TableRow key={cart._id} className={selectedIds.includes(cart._id) ? 'bg-emerald-500/5' : ''}>
                {visibleColumns.includes('select') && <TableCell><SelectCheckbox checked={selectedIds.includes(cart._id)} onChange={() =>{  toggleSelectItem(cart._id); }} /></TableCell>}
                {visibleColumns.includes('customer') && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span className={cart.customerName ? 'font-medium' : 'text-slate-400 text-sm'}>
                        {(cart.customerName ?? cart.sessionLabel) ?? 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes('itemsCount') && (
                  <TableCell className="text-center">
                    <Badge variant="secondary">{cart.itemsCount}</Badge>
                  </TableCell>
                )}
                {visibleColumns.includes('totalAmount') && <TableCell className="font-medium">{formatPrice(cart.totalAmount)}</TableCell>}
                {visibleColumns.includes('status') && (
                  <TableCell>
                    <Badge variant={STATUS_COLORS[cart.status as CartStatus]}>
                      {STATUS_LABELS[cart.status as CartStatus]}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.includes('expiresAt') &&  enabledFeatures.enableExpiry && (
                  <TableCell className="text-slate-500 text-sm">
                    {cart.expiresAt ? formatDate(cart.expiresAt) : '-'}
                  </TableCell>
                )}
                {visibleColumns.includes('createdAt') && <TableCell className="text-slate-500 text-sm">{formatDate(cart._creationTime)}</TableCell>}
                {visibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/cart/${cart._id}`}><Button variant="ghost" size="icon" title="Xem chi tiết"><Eye size={16}/></Button></Link>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(cart._id)}><Trash2 size={16}/></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-slate-500">
                  {searchTerm || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có giỏ hàng nào.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {sortedData.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Hiển thị {(currentPage - 1) * cartsPerPage + 1} - {Math.min(currentPage * cartsPerPage, sortedData.length)} / {sortedData.length} giỏ hàng
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() =>{  setCurrentPage(p => p - 1); }}
                >
                  Trước
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() =>{  setCurrentPage(p => p + 1); }}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
