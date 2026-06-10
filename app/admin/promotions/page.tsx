'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Check, ChevronDown, Copy, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { AdminDragHandle, buildOrderUpdates, BulkActionBar, ColumnToggle, generatePaginationItems, getReorderedItems, SelectCheckbox, SortableHeader, SortableTableRow, useAdminDndSensors, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const MODULE_KEY = 'promotions';

export default function PromotionsListPage() {
  return (
    <ModuleGuard moduleKey="promotions">
      <PromotionsContent />
    </ModuleGuard>
  );
}

function PromotionsContent() {
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const deletePromotion = useMutation(api.promotions.remove);
  const reorderPromotions = useMutation(api.promotions.reorder);
  
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'Active' | 'Inactive' | 'Expired' | 'Scheduled'>('');
  const [filterType, setFilterType] = useState<'' | 'percent' | 'fixed' | 'buy_x_get_y' | 'buy_a_get_b' | 'tiered' | 'free_shipping' | 'gift'>('');
  const [filterPromotionType, setFilterPromotionType] = useState<'' | 'coupon' | 'campaign' | 'flash_sale' | 'bundle' | 'loyalty'>('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem('admin_promotions_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"promotions">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"promotions"> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const dndSensors = useAdminDndSensors();

  const isSelectAllActive = selectionMode === 'all';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    if (visibleColumns.length > 0) {
      window.localStorage.setItem('admin_promotions_visible_columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const promotionsPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'promotionsPerPage');
    return (setting?.value as number) || 20;
  }, [settingsData]);

  const [resolvedPromotionsPerPage, setPageSizeOverride] = usePersistedPageSize('admin_promotions_page_size', promotionsPerPage);
  const offset = (currentPage - 1) * resolvedPromotionsPerPage;

  const promotionsData = useQuery(api.promotions.listAdminWithOffset, {
    limit: resolvedPromotionsPerPage,
    offset,
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    promotionType: filterPromotionType || undefined,
    status: filterStatus || undefined,
    discountType: filterType || undefined,
  }) as Doc<'promotions'>[] | undefined;

  const deleteInfo = useQuery(
    api.promotions.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const totalCountData = useQuery(api.promotions.countAdmin, {
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    promotionType: filterPromotionType || undefined,
    status: filterStatus || undefined,
    discountType: filterType || undefined,
  });

  const selectAllData = useQuery(
    api.promotions.listAdminIds,
    isSelectAllActive
      ? {
          search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
          promotionType: filterPromotionType || undefined,
          status: filterStatus || undefined,
          discountType: filterType || undefined,
        }
      : 'skip'
  );

  const isTableLoading = promotionsData === undefined || totalCountData === undefined;

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 khuyến mãi phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  // Get enabled features from system config
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const promotions = useMemo(() => promotionsData?.map(p => ({
      ...p,
      id: p._id,
    })) ?? [], [promotionsData]);

  const columns = useMemo(() => {
    const cols = [
      { key: 'select', label: 'Chọn' },
      { key: 'name', label: 'Tên / Mã', required: true },
      { key: 'promotionType', label: 'Loại khuyến mãi' },
      { key: 'discount', label: 'Giảm giá' },
    ];
    if (enabledFeatures.enableSchedule) {cols.push({ key: 'schedule', label: 'Thời gian' });}
    if (enabledFeatures.enableUsageLimit) {cols.push({ key: 'usage', label: 'Đã dùng' });}
    cols.push({ key: 'status', label: 'Trạng thái' });
    cols.push({ key: 'actions', label: 'Hành động', required: true });
    return cols;
  }, [enabledFeatures]);
  const resolvedVisibleColumns = visibleColumns.length > 0 ? visibleColumns : columns.map(c => c.key);

  const sortedPromotions = useSortableData(promotions, sortConfig);
  const isReorderEnabled = !debouncedSearchTerm.trim() && !filterStatus && !filterType && !filterPromotionType && (sortConfig.key === null || sortConfig.key === 'order');

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedPromotionsPerPage) : 1;
  const paginatedPromotions = sortedPromotions;
  const tableColumnCount = resolvedVisibleColumns.length + 1;
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const applyManualSelection = (nextIds: Id<"promotions">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterStatus('');
    setFilterType('');
    setFilterPromotionType('');
    setCurrentPage(1);
    setPageSizeOverride(null);
    applyManualSelection([]);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const handleFilterChange = (type: 'status' | 'type' | 'promotionType', value: string) => {
    if (type === 'status') {setFilterStatus(value as '' | 'Active' | 'Inactive' | 'Expired' | 'Scheduled');}
    else if (type === 'type') {setFilterType(value as '' | 'percent' | 'fixed' | 'buy_x_get_y' | 'buy_a_get_b' | 'tiered' | 'free_shipping' | 'gift');}
    else {setFilterPromotionType(value as '' | 'coupon' | 'campaign' | 'flash_sale' | 'bundle' | 'loyalty');}
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const selectedOnPage = paginatedPromotions.filter(promo => selectedIds.includes(promo._id));
  const isPageSelected = paginatedPromotions.length > 0 && selectedOnPage.length === paginatedPromotions.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedPromotions.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedPromotions.some(promo => promo._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedPromotions.forEach(promo => next.add(promo._id));
    applyManualSelection(Array.from(next));
  };
  const toggleSelectItem = (id: Id<"promotions">) =>{  
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  // TICKET #10 FIX: Show detailed error message
  const handleDelete = async (id: Id<"promotions">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deletePromotion({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa khuyến mãi');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi xóa khuyến mãi');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // HIGH-006 FIX: Dùng Promise.all thay vì sequential
  // TICKET #10 FIX: Show detailed error message
  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} khuyến mãi đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      try {
        await Promise.all(selectedIds.map( async id => deletePromotion({ cascade: true, id })));
        applyManualSelection([]);
        toast.success(`Đã xóa ${selectedIds.length} khuyến mãi`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Có lỗi khi xóa khuyến mãi');
      }
    }
  };

  // TICKET #12 FIX: Handle clipboard API errors
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Đã copy mã voucher');
      setTimeout(() =>{  setCopiedCode(null); }, 2000);
    } catch {
      toast.error('Không thể copy, vui lòng copy thủ công');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(paginatedPromotions, event.active.id, event.over?.id, promo => promo._id);
    if (!reordered) {return;}

    try {
      await reorderPromotions({
        items: buildOrderUpdates(
          reordered,
          paginatedPromotions.map(promo => promo.order),
          promo => promo._id,
          (_promo, index) => offset + index
        ),
      });
      setSortConfig({ direction: 'asc', key: null });
      toast.success('Đã cập nhật thứ tự khuyến mãi');
    } catch {
      toast.error('Không thể cập nhật thứ tự khuyến mãi');
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  
  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) {return '-';}
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': {
        return <Badge variant="success">Hoạt động</Badge>;
      }
      case 'Inactive': {
        return <Badge variant="secondary">Tạm dừng</Badge>;
      }
      case 'Expired': {
        return <Badge variant="destructive">Hết hạn</Badge>;
      }
      case 'Scheduled': {
        return <Badge variant="warning">Chờ kích hoạt</Badge>;
      }
      default: {
        return <Badge variant="outline">{status}</Badge>;
      }
    }
  };

  const getPromotionTypeLabel = (type?: string) => {
    switch (type) {
      case 'coupon': return 'Coupon';
      case 'campaign': return 'Chương trình';
      case 'flash_sale': return 'Flash sale';
      case 'bundle': return 'Combo';
      case 'loyalty': return 'Loyalty';
      default: return type ?? 'Campaign';
    }
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case 'percent': return 'Giảm %';
      case 'fixed': return 'Giảm cố định';
      case 'buy_x_get_y': return 'Mua X tặng Y';
      case 'buy_a_get_b': return 'Mua A tặng B';
      case 'tiered': return 'Giảm theo bậc';
      case 'free_shipping': return 'Free ship';
      case 'gift': return 'Tặng quà';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Khuyến mãi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý voucher và mã giảm giá</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/promotions/create"><Button className="gap-2 bg-pink-600 hover:bg-pink-500"><Plus size={16}/> Thêm mới</Button></Link>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="khuyến mãi"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedPromotions.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedPromotions.map(promo => promo._id)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  applyManualSelection([]); }}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Tìm tên, mã voucher..." className="pl-9" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); setCurrentPage(1); applyManualSelection([]); }} />
          </div>
          <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterStatus} onChange={(e) =>{  handleFilterChange('status', e.target.value); }}>
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Hoạt động</option>
            <option value="Inactive">Tạm dừng</option>
            <option value="Expired">Hết hạn</option>
            <option value="Scheduled">Chờ kích hoạt</option>
          </select>
          <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterPromotionType} onChange={(e) =>{  handleFilterChange('promotionType', e.target.value); }}>
            <option value="">Tất cả chương trình</option>
            <option value="coupon">Coupon</option>
            <option value="campaign">Chương trình</option>
            <option value="flash_sale">Flash sale</option>
            <option value="bundle">Combo</option>
            <option value="loyalty">Loyalty</option>
          </select>
          <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterType} onChange={(e) =>{  handleFilterChange('type', e.target.value); }}>
            <option value="">Tất cả loại giảm</option>
            <option value="percent">Giảm theo %</option>
            <option value="fixed">Giảm cố định</option>
            <option value="buy_x_get_y">Mua X tặng Y</option>
            <option value="buy_a_get_b">Mua A tặng B</option>
            <option value="tiered">Giảm theo bậc</option>
            <option value="free_shipping">Miễn phí ship</option>
            <option value="gift">Tặng quà</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
          <ColumnToggle columns={columns} visibleColumns={resolvedVisibleColumns} onToggle={(key) =>{
            setVisibleColumns(prev => {
              const base = prev.length > 0 ? prev : columns.map(c => c.key);
              return base.includes(key) ? base.filter(col => col !== key) : [...base, key];
            });
          }} />
        </div>
        {!isReorderEnabled && (
          <div className="px-4 py-3 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
            Tắt tìm kiếm/lọc và quay về thứ tự mặc định để kéo thả đổi vị trí.
          </div>
        )}
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              <TableHead className="w-[40px]" />
              {resolvedVisibleColumns.includes('select') && (
                <TableHead className="w-[40px]"><SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} /></TableHead>
              )}
              {resolvedVisibleColumns.includes('name') && <SortableHeader label="Tên / Mã" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('promotionType') && <SortableHeader label="Loại KM" sortKey="promotionType" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('discount') && <SortableHeader label="Giảm giá" sortKey="discountValue" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('schedule') && enabledFeatures.enableSchedule && <TableHead>Thời gian</TableHead>}
              {resolvedVisibleColumns.includes('usage') && enabledFeatures.enableUsageLimit && <SortableHeader label="Đã dùng" sortKey="usedCount" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <SortableContext items={paginatedPromotions.map(promo => promo._id)} strategy={verticalListSortingStrategy}>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: resolvedPromotionsPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell colSpan={tableColumnCount}>
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {paginatedPromotions.map(promo => (
                  <SortableTableRow key={promo._id} id={promo._id} disabled={!isReorderEnabled} selected={selectedIds.includes(promo._id)} selectedClassName="bg-pink-500/5">
                    {({ attributes, disabled, listeners }) => (
                      <>
                <TableCell className="w-[40px]">
                  <AdminDragHandle attributes={attributes} disabled={disabled} listeners={listeners} />
                </TableCell>
                {resolvedVisibleColumns.includes('select') && (
                  <TableCell><SelectCheckbox checked={selectedIds.includes(promo._id)} onChange={() =>{  toggleSelectItem(promo._id); }} /></TableCell>
                )}
                {resolvedVisibleColumns.includes('name') && (
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{promo.name}</p>
                      {promo.code ? (
                        <div className="flex items-center gap-1 mt-1">
                          <code className="text-xs text-pink-600 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded font-mono">{promo.code}</code>
                          <button 
                            onClick={ async () => {
                              const promoCode = promo.code;
                              if (!promoCode) {return;}
                              await copyCode(promoCode);
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Copy mã"
                          >
                            {copiedCode === promo.code ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-slate-400" />}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1">Tự động áp dụng</p>
                      )}
                    </div>
                </TableCell>
                )}
                {resolvedVisibleColumns.includes('promotionType') && (
                  <TableCell>
                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-600">
                      {getPromotionTypeLabel(promo.promotionType ?? 'campaign')}
                    </Badge>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('discount') && (
                  <TableCell>
                  {promo.discountType === 'percent' ? (
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                      -{promo.discountValue ?? 0}%
                      {enabledFeatures.enableMaxDiscount && promo.maxDiscountAmount && (
                        <span className="text-xs ml-1">(max {formatPrice(promo.maxDiscountAmount)})</span>
                      )}
                    </Badge>
                  ) : promo.discountType === 'fixed' ? (
                    <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-600">
                      -{formatPrice(promo.discountValue ?? 0)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-500/10 text-slate-600">
                      {getDiscountTypeLabel(promo.discountType)}
                    </Badge>
                  )}
                  {enabledFeatures.enableMinOrder && promo.minOrderAmount && (
                    <p className="text-xs text-slate-500 mt-1">Đơn tối thiểu: {formatPrice(promo.minOrderAmount)}</p>
                  )}
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('schedule') && enabledFeatures.enableSchedule && (
                  <TableCell className="text-sm text-slate-500">
                    {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('usage') && enabledFeatures.enableUsageLimit && (
                  <TableCell>
                    {promo.usageLimit ? (
                      <span className={promo.usedCount >= promo.usageLimit ? 'text-red-500 font-medium' : ''}>
                        {promo.usedCount}/{promo.usageLimit}
                      </span>
                    ) : (
                      <span className="text-slate-500">{promo.usedCount}</span>
                    )}
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('status') && <TableCell>{getStatusBadge(promo.status)}</TableCell>}
                {resolvedVisibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/promotions/${promo._id}/edit`}><Button variant="ghost" size="icon"><Edit size={16}/></Button></Link>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(promo._id)}><Trash2 size={16}/></Button>
                  </div>
                  </TableCell>
                )}
                      </>
                    )}
                  </SortableTableRow>
                ))}
              </>
            )}
            {!isTableLoading && paginatedPromotions.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="text-center py-8 text-slate-500">
                  {searchTerm || filterStatus || filterType ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có khuyến mãi nào.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </SortableContext>
        </Table>
        </DndContext>
        {totalCount > 0 && !isTableLoading && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 flex w-full items-center justify-between text-sm text-slate-500 sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Hiển thị</span>
                <select
                  value={resolvedPromotionsPerPage}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số khuyến mãi mỗi trang"
                >
                  {[10, 20, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>khuyến mãi/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedPromotionsPerPage) + 1 : 0}–{Math.min(currentPage * resolvedPromotionsPerPage, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">khuyến mãi</span>
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
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa khuyến mãi"
        itemName={promotions.find((promo) => promo.id === deleteTargetId)?.name ?? 'khuyến mãi'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
