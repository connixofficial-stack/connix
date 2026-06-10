'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronDown, Heart, Package, Search, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { BulkActionBar, ColumnToggle, generatePaginationItems, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { usePersistedPageSize } from '../components/usePersistedPageSize';

const MODULE_KEY = 'wishlist';

// WL-007 FIX: Thêm requiredModules dependency cho customers và products
export default function WishlistListPage() {
  return (
    <ModuleGuard 
      moduleKey="wishlist" 
      requiredModules={["products", "customers"]} 
      requiredModulesType="all"
    >
      <WishlistContent />
    </ModuleGuard>
  );
}

function WishlistContent() {
  const customersData = useQuery(api.customers.listAll, { limit: 200 });
  const productsData = useQuery(api.products.listAll, { limit: 500 });
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const removeItem = useMutation(api.wishlist.remove);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState<Id<"customers"> | ''>('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem('admin_wishlist_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"wishlist">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);

  const isSelectAllActive = selectionMode === 'all';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    if (visibleColumns.length > 0) {
      window.localStorage.setItem('admin_wishlist_visible_columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const itemsPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'itemsPerPage');
    return (setting?.value as number) || 20;
  }, [settingsData]);

  const [resolvedItemsPerPage, setPageSizeOverride] = usePersistedPageSize('admin_wishlist_page_size', itemsPerPage);
  const offset = (currentPage - 1) * resolvedItemsPerPage;

  const wishlistData = useQuery(api.wishlist.listAdminWithOffset, {
    limit: resolvedItemsPerPage,
    offset,
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    customerId: filterCustomer || undefined,
  });

  const totalCountData = useQuery(api.wishlist.countAdmin, {
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    customerId: filterCustomer || undefined,
  });

  const selectAllData = useQuery(
    api.wishlist.listAdminIds,
    isSelectAllActive
      ? {
          search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
          customerId: filterCustomer || undefined,
        }
      : 'skip'
  );

  const isTableLoading = wishlistData === undefined || totalCountData === undefined || customersData === undefined || productsData === undefined || fieldsData === undefined;

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 wishlist phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const columns = useMemo(() => {
    const cols = [
      { key: 'select', label: 'Chọn' },
      { key: 'customer', label: 'Khách hàng', required: true },
      { key: 'product', label: 'Sản phẩm', required: true },
      { key: 'price', label: 'Giá' },
    ];
    if (enabledFields.has('note')) {cols.push({ key: 'note', label: 'Ghi chú' });}
    cols.push({ key: 'createdAt', label: 'Ngày thêm' });
    cols.push({ key: 'actions', label: 'Hành động', required: true });
    return cols;
  }, [enabledFields]);
  const resolvedVisibleColumns = visibleColumns.length > 0 ? visibleColumns : columns.map(c => c.key);

  const customerMap = useMemo(() => {
    const map: Record<string, { name: string; email: string }> = {};
    customersData?.forEach(c => { map[c._id] = { email: c.email, name: c.name }; });
    return map;
  }, [customersData]);

  const productMap = useMemo(() => {
    const map: Record<string, { name: string; price: number; salePrice?: number; image?: string }> = {};
    productsData?.forEach(p => { map[p._id] = { image: p.image, name: p.name, price: p.price, salePrice: p.salePrice }; });
    return map;
  }, [productsData]);

  const wishlistItems = useMemo(() => wishlistData?.map(item => ({
      ...item,
      id: item._id,
      customerName: customerMap[item.customerId]?.name || 'Không xác định',
      customerEmail: customerMap[item.customerId]?.email || '',
      productName: productMap[item.productId]?.name || 'Không xác định',
      productPrice: productMap[item.productId]?.price || 0,
      productSalePrice: productMap[item.productId]?.salePrice,
      productImage: productMap[item.productId]?.image,
    })) ?? [], [wishlistData, customerMap, productMap]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const handleCustomerChange = (value: string) => {
    setFilterCustomer(value as Id<"customers"> | '');
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const sortedData = useSortableData(wishlistItems, sortConfig);

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedItemsPerPage) : 1;
  const paginatedData = sortedData;
  const tableColumnCount = resolvedVisibleColumns.length;
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const applyManualSelection = (nextIds: Id<"wishlist">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterCustomer('');
    setCurrentPage(1);
    setPageSizeOverride(null);
    applyManualSelection([]);
  };

  const selectedOnPage = paginatedData.filter(item => selectedIds.includes(item._id));
  const isPageSelected = paginatedData.length > 0 && selectedOnPage.length === paginatedData.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedData.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedData.some(item => item._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedData.forEach(item => next.add(item._id));
    applyManualSelection(Array.from(next));
  };
  const toggleSelectItem = (id: Id<"wishlist">) =>{  
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const handleDelete = async (id: Id<"wishlist">) => {
    if (confirm('Xóa sản phẩm này khỏi wishlist?')) {
      try {
        await removeItem({ id });
        toast.success('Đã xóa khỏi wishlist');
      } catch {
        toast.error('Có lỗi khi xóa');
      }
    }
  };

  // WL-006 FIX: Sử dụng Promise.all thay vì sequential delete
  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} mục đã chọn?`)) {
      try {
        const count = selectedIds.length;
        await Promise.all(selectedIds.map( async id => removeItem({ id })));
        applyManualSelection([]);
        toast.success(`Đã xóa ${count} mục`);
      } catch {
        toast.error('Có lỗi khi xóa');
      }
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('vi-VN');

  // Stats
  const stats = useMemo(() => {
    const customerCounts: Record<string, number> = {};
    const productCounts: Record<string, number> = {};
    wishlistItems.forEach(item => {
      customerCounts[item.customerId] = (customerCounts[item.customerId] || 0) + 1;
      productCounts[item.productId] = (productCounts[item.productId] || 0) + 1;
    });
    return {
      mostWishlisted: (Object.entries(productCounts) as Array<[string, number]>).sort((a, b) => b[1] - a[1])[0],
      totalItems: wishlistItems.length,
      uniqueCustomers: Object.keys(customerCounts).length,
      uniqueProducts: Object.keys(productCounts).length,
    };
  }, [wishlistItems]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sản phẩm yêu thích</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý wishlist của khách hàng</p>
        </div>
        <div className="flex gap-2" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalItems}</p>
              <p className="text-sm text-slate-500">Tổng mục</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.uniqueCustomers}</p>
              <p className="text-sm text-slate-500">Khách hàng</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.uniqueProducts}</p>
              <p className="text-sm text-slate-500">Sản phẩm</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Heart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {stats.mostWishlisted ? productMap[stats.mostWishlisted[0]]?.name : 'N/A'}
              </p>
              <p className="text-xs text-slate-500">Được thích nhiều nhất ({stats.mostWishlisted?.[1] || 0})</p>
            </div>
          </div>
        </Card>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="wishlist"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedData.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedData.map(item => item._id)); }}
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
              <Input placeholder="Tìm khách hàng, sản phẩm..." className="pl-9 w-48" value={searchTerm} onChange={(e) =>{  handleSearchChange(e.target.value); }} />
            </div>
            <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterCustomer} onChange={(e) =>{  handleCustomerChange(e.target.value); }}>
              <option value="">Tất cả khách hàng</option>
              {customersData?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
          <ColumnToggle columns={columns} visibleColumns={resolvedVisibleColumns} onToggle={(key) =>{
            setVisibleColumns(prev => {
              const base = prev.length > 0 ? prev : columns.map(c => c.key);
              return base.includes(key) ? base.filter(col => col !== key) : [...base, key];
            });
          }} />
        </div>
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              {resolvedVisibleColumns.includes('select') && <TableHead className="w-[40px]"><SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} /></TableHead>}
              {resolvedVisibleColumns.includes('customer') && <SortableHeader label="Khách hàng" sortKey="customerName" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('product') && <SortableHeader label="Sản phẩm" sortKey="productName" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('price') && <SortableHeader label="Giá" sortKey="productPrice" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('note') && enabledFields.has('note') && <TableHead>Ghi chú</TableHead>}
              {resolvedVisibleColumns.includes('createdAt') && <SortableHeader label="Ngày thêm" sortKey="_creationTime" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: resolvedItemsPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell colSpan={tableColumnCount}>
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {paginatedData.map(item => (
                  <TableRow key={item._id} className={selectedIds.includes(item._id) ? 'bg-pink-500/5' : ''}>
                {resolvedVisibleColumns.includes('select') && <TableCell><SelectCheckbox checked={selectedIds.includes(item._id)} onChange={() =>{  toggleSelectItem(item._id); }} /></TableCell>}
                {resolvedVisibleColumns.includes('customer') && (
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.customerName}</p>
                      <p className="text-xs text-slate-500">{item.customerEmail}</p>
                    </div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('product') && (
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.productImage ? (
                        <Image src={item.productImage} width={40} height={40} className="w-10 h-10 object-cover rounded bg-slate-100" alt={item.productName} />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                          <Package size={16} className="text-slate-400" />
                        </div>
                      )}
                      <span className="font-medium max-w-[200px] truncate">{item.productName}</span>
                    </div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('price') && (
                  <TableCell>
                    {item.productSalePrice ? (
                      <div>
                        <span className="text-red-500 font-medium">{formatPrice(item.productSalePrice)}</span>
                        <span className="text-slate-400 line-through text-xs ml-1">{formatPrice(item.productPrice)}</span>
                      </div>
                    ) : (
                      formatPrice(item.productPrice)
                    )}
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('note') && enabledFields.has('note') && (
                  <TableCell className="text-slate-500 text-sm max-w-[150px] truncate">{item.note ?? '-'}</TableCell>
                )}
                {resolvedVisibleColumns.includes('createdAt') && <TableCell className="text-slate-500 text-sm">{formatDate(item._creationTime)}</TableCell>}
                {resolvedVisibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(item._id)}><Trash2 size={16}/></Button>
                  </TableCell>
                )}
                  </TableRow>
                ))}
              </>
            )}
            {!isTableLoading && paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="text-center py-8 text-slate-500">
                  {searchTerm || filterCustomer ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có sản phẩm yêu thích nào.'}
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
                  value={resolvedItemsPerPage}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số wishlist mỗi trang"
                >
                  {[10, 20, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>mục/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedItemsPerPage) + 1 : 0}–{Math.min(currentPage * resolvedItemsPerPage, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">wishlist</span>
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
                          ? 'bg-pink-600 text-white shadow-sm border font-medium'
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
    </div>
  );
}

