'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminEntityImage } from '../components/AdminEntityImage';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Briefcase, ChevronDown, Copy, Edit, ExternalLink, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { AdminDragHandle, buildOrderUpdates, BulkActionBar, ColumnToggle, getReorderedItems, SelectCheckbox, SortableHeader, SortableTableRow, useAdminDndSensors, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

export default function ServicesListPage() {
  return (
    <ModuleGuard moduleKey="services">
      <ServicesContent />
    </ModuleGuard>
  );
}

function ServicesContent() {
  const categoriesData = useQuery(api.serviceCategories.listAll, {});
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'services' });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'services' });
  const deleteService = useMutation(api.services.remove);
  const duplicateService = useMutation(api.services.duplicate);
  const bulkClearBrokenMedia = useMutation(api.services.bulkClearBrokenMedia);
  const reorderServices = useMutation(api.services.reorder);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'Published' | 'Draft' | 'Archived'>('');
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"services">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"services"> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [cloningServiceId, setCloningServiceId] = useState<Id<"services"> | null>(null);
  const [isClearingBrokenMedia, setIsClearingBrokenMedia] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return ['category', 'price', 'status'];
    }
    try {
      const stored = window.localStorage.getItem('admin_services_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : ['category', 'price', 'status'];
      }
    } catch {
      return ['category', 'price', 'status'];
    }
    return ['category', 'price', 'status'];
  });
  const dndSensors = useAdminDndSensors();
  const isSelectAllActive = selectionMode === 'all';

  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    window.localStorage.setItem('admin_services_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const servicesPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'servicesPerPage');
    return (setting?.value as number) || 10;
  }, [settingsData]);

  const [resolvedServicesPerPage, setPageSizeOverride] = usePersistedPageSize('admin_services_page_size', servicesPerPage);
  const offset = (currentPage - 1) * resolvedServicesPerPage;

  const servicesData = useQuery(api.services.listAdminWithOffset, {
    limit: resolvedServicesPerPage,
    offset,
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    status: filterStatus || undefined,
  });

  const totalCountData = useQuery(api.services.countAdmin, {
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    status: filterStatus || undefined,
  });

  const deleteInfo = useQuery(
    api.services.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const selectAllData = useQuery(
    api.services.listAdminIds,
    isSelectAllActive
      ? {
          search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
          status: filterStatus || undefined,
        }
      : 'skip'
  );

  const isTableLoading = servicesData === undefined || totalCountData === undefined || fieldsData === undefined;

  const enabledFields = useMemo(() => new Set(fieldsData?.map(field => field.fieldKey) ?? []), [fieldsData]);
  const showThumbnail = enabledFields.has('thumbnail');
  const showCategory = enabledFields.has('categoryId');
  const showPrice = enabledFields.has('price');

  const columns = [
    ...(showThumbnail ? [{ key: 'thumbnail', label: 'Ảnh' }] : []),
    ...(showCategory ? [{ key: 'category', label: 'Danh mục' }] : []),
    ...(showPrice ? [{ key: 'price', label: 'Giá' }] : []),
    { key: 'status', label: 'Trạng thái' },
  ];

  const resolvedVisibleColumns = visibleColumns.filter(key => columns.some(col => col.key === key));

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 dịch vụ phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesData?.forEach(cat => { map[cat._id] = cat.name; });
    return map;
  }, [categoriesData]);

  const categorySlugMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesData?.forEach(cat => { map[cat._id] = cat.slug; });
    return map;
  }, [categoriesData]);

  const services = useMemo(() => servicesData?.map(service => ({
    ...service,
    id: service._id,
    category: categoryMap[service.categoryId] || 'Không có',
  })) ?? [], [servicesData, categoryMap]);

  const sortedServices = useSortableData(services, sortConfig);
  const isReorderEnabled = !debouncedSearchTerm.trim() && !filterStatus && (sortConfig.key === null || sortConfig.key === 'order');

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedServicesPerPage) : 1;
  const paginatedServices = sortedServices;
  const tableColumnCount = 4 + resolvedVisibleColumns.length;
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const applyManualSelection = (nextIds: Id<"services">[]) => {
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
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value as '' | 'Published' | 'Draft' | 'Archived');
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const selectedOnPage = paginatedServices.filter(service => selectedIds.includes(service._id));
  const isPageSelected = paginatedServices.length > 0 && selectedOnPage.length === paginatedServices.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedServices.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedServices.some(service => service._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedServices.forEach(service => next.add(service._id));
    applyManualSelection(Array.from(next));
  };
  const toggleSelectItem = (id: Id<"services">) =>{
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const handleDuplicateService = async (id: Id<"services">) => {
    setCloningServiceId(id);
    try {
      const result = await duplicateService({ id });
      toast.success(`Đã tạo bản sao: ${result.title}`);
    } catch {
      toast.error('Không thể copy dịch vụ');
    } finally {
      setCloningServiceId(null);
    }
  };

  const handleDelete = async (id: Id<"services">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteService({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa dịch vụ');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Không thể xóa dịch vụ');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} dịch vụ đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      try {
        for (const id of selectedIds) {
          await deleteService({ cascade: true, id });
        }
        applyManualSelection([]);
        toast.success(`Đã xóa ${selectedIds.length} dịch vụ`);
      } catch {
        toast.error('Có lỗi khi xóa dịch vụ');
      }
    }
  };

  const handleBulkClearBrokenMedia = async () => {
    setIsClearingBrokenMedia(true);
    try {
      const result = await bulkClearBrokenMedia({ ids: selectedIds });
      applyManualSelection([]);
      if (result.cleared > 0) {
        toast.success(`Đã xóa ${result.cleared} ảnh lỗi trong ${result.updated} dịch vụ`);
      } else {
        toast.info('Không tìm thấy ảnh lỗi trong dịch vụ đã chọn');
      }
    } catch {
      toast.error('Có lỗi khi xóa ảnh lỗi');
    } finally {
      setIsClearingBrokenMedia(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(paginatedServices, event.active.id, event.over?.id, service => service._id);
    if (!reordered) {return;}

    try {
      await reorderServices({
        items: buildOrderUpdates(
          reordered,
          paginatedServices.map(service => service.order),
          service => service._id,
          (_service, index) => offset + index
        ),
      });
      setSortConfig({ direction: 'asc', key: null });
      toast.success('Đã cập nhật thứ tự dịch vụ');
    } catch {
      toast.error('Không thể cập nhật thứ tự dịch vụ');
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) {return '-';}
    return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  };

  const openFrontend = (slug: string, categoryId: string) => {
    const categorySlug = categorySlugMap[categoryId];
    window.open(categorySlug ? `/${categorySlug}/${slug}` : `/services/${slug}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Briefcase className="w-6 h-6 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản lý dịch vụ</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/services/create"><Button className="gap-2 bg-teal-600 hover:bg-teal-500"><Plus size={16}/> Thêm mới</Button></Link>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="dịch vụ"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedServices.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedServices.map(service => service._id)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onClearBrokenMedia={() =>{  void handleBulkClearBrokenMedia(); }}
        isClearBrokenMediaLoading={isClearingBrokenMedia}
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  applyManualSelection([]); }}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Tìm kiếm dịch vụ..." className="pl-9" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); setCurrentPage(1); applyManualSelection([]); }} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterStatus} onChange={(e) =>{  handleFilterChange(e.target.value); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="Published">Hiện</option>
              <option value="Draft">Ẩn</option>
              <option value="Archived">Lưu trữ</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Xóa lọc
            </Button>
            <ColumnToggle
              columns={columns}
              visibleColumns={resolvedVisibleColumns}
              onToggle={(key) => {
                setVisibleColumns(prev => prev.includes(key) ? prev.filter(col => col !== key) : [...prev, key]);
              }}
            />
          </div>
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
              <TableHead className="w-[40px]"><SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} /></TableHead>
              <TableHead className="w-[40px]" />
              {resolvedVisibleColumns.includes('thumbnail') && <TableHead className="w-[80px]">Ảnh</TableHead>}
              <SortableHeader label="Tiêu đề" sortKey="title" sortConfig={sortConfig} onSort={handleSort} />
              {resolvedVisibleColumns.includes('category') && <SortableHeader label="Danh mục" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('price') && <SortableHeader label="Giá" sortKey="price" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />}
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext items={paginatedServices.map(service => service._id)} strategy={verticalListSortingStrategy}>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: resolvedServicesPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell>
                    <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                  {resolvedVisibleColumns.includes('thumbnail') && (
                    <TableCell>
                      <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                  {resolvedVisibleColumns.includes('category') && (
                    <TableCell>
                      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                  )}
                  {resolvedVisibleColumns.includes('price') && (
                    <TableCell>
                      <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                  )}
                  {resolvedVisibleColumns.includes('status') && (
                    <TableCell>
                      <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="ml-auto h-8 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {paginatedServices.map(service => (
                  <SortableTableRow key={service._id} id={service._id} disabled={!isReorderEnabled} selected={selectedIds.includes(service._id)} selectedClassName="bg-teal-500/5">
                    {({ attributes, disabled, listeners }) => (
                      <>
                    <TableCell><SelectCheckbox checked={selectedIds.includes(service._id)} onChange={() =>{  toggleSelectItem(service._id); }} /></TableCell>
                    <TableCell className="w-[40px]">
                      <AdminDragHandle attributes={attributes} disabled={disabled} listeners={listeners} />
                    </TableCell>
                    {resolvedVisibleColumns.includes('thumbnail') && (
                      <TableCell>
                        <AdminEntityImage
                          src={service.thumbnail}
                          alt={service.title}
                          variant="service"
                          width={48}
                          height={32}
                          className="h-8 w-12"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium max-w-[300px] truncate">{service.title}</TableCell>
                    {resolvedVisibleColumns.includes('category') && <TableCell>{service.category}</TableCell>}
                    {resolvedVisibleColumns.includes('price') && <TableCell className="text-slate-500">{formatPrice(service.price)}</TableCell>}
                    {resolvedVisibleColumns.includes('status') && (
                      <TableCell>
                        <Badge variant={service.status === 'Published' ? 'success' : (service.status === 'Draft' ? 'secondary' : 'warning')}>
                          {service.status === 'Published' ? 'Hiện' : (service.status === 'Draft' ? 'Ẩn' : 'Lưu trữ')}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="text-teal-600 hover:text-teal-700" title="Xem dịch vụ" onClick={() =>{  openFrontend(service.slug, service.categoryId); }}><ExternalLink size={16}/></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Copy dịch vụ"
                          onClick={() => { void handleDuplicateService(service._id); }}
                          disabled={cloningServiceId === service._id}
                        >
                          {cloningServiceId === service._id ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                        </Button>
                        <Link href={`/admin/services/${service._id}/edit`}><Button variant="ghost" size="icon"><Edit size={16}/></Button></Link>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(service._id)}><Trash2 size={16}/></Button>
                      </div>
                    </TableCell>
                      </>
                    )}
                  </SortableTableRow>
                ))}
              </>
            )}
            {!isTableLoading && paginatedServices.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="text-center py-8 text-slate-500">
                  {searchTerm || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có dịch vụ nào'}
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
                  value={resolvedServicesPerPage}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số dịch vụ mỗi trang"
                >
                  {[10, 20, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>dịch vụ/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedServicesPerPage) + 1 : 0}–{Math.min(currentPage * resolvedServicesPerPage, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">dịch vụ</span>
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
        title="Xóa dịch vụ"
        itemName={services.find((service) => service.id === deleteTargetId)?.title ?? 'dịch vụ'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
