'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { Copy, Edit, ExternalLink, FileText, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AdminEntityImage } from '../components/AdminEntityImage';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { ModuleGuard } from '../components/ModuleGuard';
import { AdminDragHandle, buildOrderUpdates, BulkActionBar, generatePaginationItems, getReorderedItems, SelectCheckbox, SortableTableRow, useAdminDndSensors } from '../components/TableUtilities';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

type ResourceStatus = '' | 'Published' | 'Draft' | 'Archived';

const formatPrice = (pricingType: string, price?: number) => {
  if (pricingType === 'free') {return 'Miễn phí';}
  if (pricingType === 'contact') {return 'Liên hệ';}
  if (!price) {return '-';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
};

export default function ResourcesListPage() {
  return (
    <ModuleGuard moduleKey="resources">
      <ResourcesContent />
    </ModuleGuard>
  );
}

function ResourcesContent() {
  const categoriesData = useQuery(api.resourceCategories.listAll, {});
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'resources' });
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'resources' });
  const deleteResource = useMutation(api.resources.remove);
  const duplicateResource = useMutation(api.resources.duplicate);
  const bulkClearBrokenMedia = useMutation(api.resources.bulkClearBrokenMedia);
  const reorderResources = useMutation(api.resources.reorder);

  const enabledFields = useMemo(() => new Set(fieldsData?.map((field) => field.fieldKey) ?? []), [fieldsData]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ResourceStatus>('');
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<'resources'>[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<'resources'> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [cloningResourceId, setCloningResourceId] = useState<Id<'resources'> | null>(null);
  const [isClearingMedia, setIsClearingMedia] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dndSensors = useAdminDndSensors();
  const isSelectAllActive = selectionMode === 'all';

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 300);
    return () => { clearTimeout(timer); };
  }, [searchTerm]);

  const defaultPageSize = useMemo(() => {
    const setting = settingsData?.find((item) => item.settingKey === 'resourcesPerPage');
    return (setting?.value as number) || 10;
  }, [settingsData]);
  const [pageSize, setPageSizeOverride] = usePersistedPageSize('admin_resources_page_size', defaultPageSize);
  const offset = (currentPage - 1) * pageSize;

  const resourcesData = useQuery(api.resources.listAdminWithOffset, {
    limit: pageSize,
    offset,
    search: debouncedSearchTerm.trim() || undefined,
    status: filterStatus || undefined,
  });
  const totalCountData = useQuery(api.resources.countAdmin, {
    search: debouncedSearchTerm.trim() || undefined,
    status: filterStatus || undefined,
  });
  const deleteInfo = useQuery(api.resources.getDeleteInfo, deleteTargetId ? { id: deleteTargetId } : 'skip');

  const selectAllData = useQuery(
    api.resources.listAdminIds,
    isSelectAllActive
      ? {
          search: debouncedSearchTerm.trim() || undefined,
          status: filterStatus || undefined,
        }
      : 'skip'
  );

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; slug: string }> = {};
    categoriesData?.forEach((category) => {
      map[category._id] = { name: category.name, slug: category.slug };
    });
    return map;
  }, [categoriesData]);

  const resources = resourcesData ?? [];
  const isLoading = resourcesData === undefined || totalCountData === undefined || categoriesData === undefined;
  const isReorderEnabled = !debouncedSearchTerm.trim() && !filterStatus;
  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;

  const selectedOnPage = resources.filter(resource => selectedIds.includes(resource._id));
  const isPageSelected = resources.length > 0 && selectedOnPage.length === resources.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < resources.length;

  const applyManualSelection = (nextIds: Id<'resources'>[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 tài nguyên phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !resources.some(resource => resource._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    resources.forEach(resource => next.add(resource._id));
    applyManualSelection(Array.from(next));
  };

  const toggleSelectItem = (id: Id<'resources'>) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const openFrontend = (slug: string, categoryId: string) => {
    const categorySlug = categoryMap[categoryId]?.slug;
    window.open(categorySlug ? `/${categorySlug}/${slug}` : `/resources/${slug}`, '_blank');
  };

  const handleDuplicateResource = async (id: Id<'resources'>) => {
    setCloningResourceId(id);
    try {
      const result = await duplicateResource({ id });
      toast.success(`Đã tạo bản sao: ${result.title}`);
    } catch {
      toast.error('Không thể copy tài nguyên');
    } finally {
      setCloningResourceId(null);
    }
  };

  const handleDelete = (id: Id<'resources'>) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteResource({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa tài nguyên');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Không thể xóa tài nguyên');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} tài nguyên đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      setIsDeleting(true);
      try {
        for (const id of selectedIds) {
          await deleteResource({ cascade: true, id });
        }
        applyManualSelection([]);
        toast.success(`Đã xóa ${selectedIds.length} tài nguyên`);
      } catch {
        toast.error('Có lỗi khi xóa tài nguyên');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBulkClearBrokenMedia = async () => {
    setIsClearingMedia(true);
    try {
      const result = await bulkClearBrokenMedia({ ids: selectedIds });
      applyManualSelection([]);
      if (result.cleared > 0) {
        toast.success(`Đã xóa ${result.cleared} ảnh lỗi trong ${result.updated} tài nguyên`);
      } else {
        toast.info('Không tìm thấy ảnh lỗi trong tài nguyên đã chọn');
      }
    } catch {
      toast.error('Có lỗi khi xóa ảnh lỗi');
    } finally {
      setIsClearingMedia(false);
    }
  };

  const handleClearBrokenMedia = async () => {
    if (resources.length === 0) {return;}
    setIsClearingMedia(true);
    try {
      const result = await bulkClearBrokenMedia({ ids: resources.map((resource) => resource._id) });
      if (result.cleared > 0) {
        toast.success(`Đã xóa ${result.cleared} ảnh lỗi`);
      } else {
        toast.info('Không tìm thấy ảnh lỗi trên trang hiện tại');
      }
    } catch {
      toast.error('Không thể quét ảnh lỗi');
    } finally {
      setIsClearingMedia(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterStatus('');
    setCurrentPage(1);
    setPageSizeOverride(null);
    applyManualSelection([]);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(resources, event.active.id, event.over?.id, resource => resource._id);
    if (!reordered) {return;}

    try {
      await reorderResources({
        items: buildOrderUpdates(
          reordered,
          resources.map(resource => resource.order),
          resource => resource._id,
          (_resource, index) => offset + index
        ),
      });
      toast.success('Đã cập nhật thứ tự tài nguyên');
    } catch {
      toast.error('Không thể cập nhật thứ tự tài nguyên');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/10 p-2">
            <FileText className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản lý tài nguyên</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ebook, template, checklist và file tải xuống</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { void handleClearBrokenMedia(); }} disabled={isClearingMedia || resources.length === 0}>
            {isClearingMedia ? 'Đang quét...' : 'Dọn ảnh lỗi'}
          </Button>
          <Link href="/admin/resources/create">
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500"><Plus size={16} /> Thêm tài nguyên</Button>
          </Link>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="tài nguyên"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={resources.length}
        totalMatchingCount={totalCount}
        onSelectPage={() => { applyManualSelection(resources.map(resource => resource._id)); }}
        onSelectAllResults={() => { setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onClearBrokenMedia={() => { void handleBulkClearBrokenMedia(); }}
        isClearBrokenMediaLoading={isClearingMedia}
        onDelete={handleBulkDelete}
        onClearSelection={() => { applyManualSelection([]); }}
        isLoading={isDeleting}
      />

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm tài nguyên..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); applyManualSelection([]); }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as ResourceStatus); setCurrentPage(1); applyManualSelection([]); }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Published">Hiện</option>
              <option value="Draft">Ẩn</option>
              <option value="Archived">Lưu trữ</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
          </div>
        </div>

        {!isReorderEnabled && (
          <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
            Tắt tìm kiếm/lọc để kéo thả đổi vị trí.
          </div>
        )}
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              <TableHead className="w-[40px]"><SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} /></TableHead>
              <TableHead className="w-[40px]" />
              <TableHead className="w-[80px]">Ảnh</TableHead>
              <TableHead>Tài nguyên</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Lượt xem</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext items={resources.map(resource => resource._id)} strategy={verticalListSortingStrategy}>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell><div className="h-4 w-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-4 w-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-10 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" /></TableCell>
                  <TableCell><div className="ml-auto h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></TableCell>
                </TableRow>
              ))
            ) : resources.map((resource) => (
              <SortableTableRow key={resource._id} id={resource._id} disabled={!isReorderEnabled} selected={selectedIds.includes(resource._id)} selectedClassName="bg-cyan-500/5">
                {({ attributes, disabled, listeners }) => (
                  <>
                <TableCell><SelectCheckbox checked={selectedIds.includes(resource._id)} onChange={() => { toggleSelectItem(resource._id); }} /></TableCell>
                <TableCell className="w-[40px]">
                  <AdminDragHandle attributes={attributes} disabled={disabled} listeners={listeners} />
                </TableCell>
                <TableCell>
                  <AdminEntityImage
                    src={resource.thumbnail}
                    alt={resource.title}
                    variant="resource"
                    width={64}
                    height={40}
                    className="h-10 w-16"
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{resource.title}</div>
                  {enabledFields.has('excerpt') && (
                    <div className="text-xs text-slate-500">{resource.excerpt || 'Chưa có mô tả ngắn'}</div>
                  )}
                </TableCell>
                <TableCell>{categoryMap[resource.categoryId]?.name ?? 'Không có'}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">{formatPrice(resource.pricingType, resource.priceAmount)}</TableCell>
                <TableCell>{resource.views.toLocaleString('vi-VN')}</TableCell>
                <TableCell>
                  <Badge variant={resource.status === 'Published' ? 'success' : resource.status === 'Draft' ? 'secondary' : 'warning'}>
                    {resource.status === 'Published' ? 'Hiện' : resource.status === 'Draft' ? 'Ẩn' : 'Lưu trữ'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Xem tài nguyên" onClick={() => { openFrontend(resource.slug, resource.categoryId); }}>
                      <ExternalLink size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Copy tài nguyên"
                      onClick={() => { void handleDuplicateResource(resource._id); }}
                      disabled={cloningResourceId === resource._id}
                    >
                      {cloningResourceId === resource._id ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                    </Button>
                    <Link href={`/admin/resources/${resource._id}/edit`}><Button variant="ghost" size="icon"><Edit size={16} /></Button></Link>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => { handleDelete(resource._id); }}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
                  </>
                )}
              </SortableTableRow>
            ))}
            {!isLoading && resources.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-slate-500">
                  {searchTerm || filterStatus ? 'Không có tài nguyên phù hợp bộ lọc.' : 'Chưa có tài nguyên nào.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </SortableContext>
        </Table>
        </DndContext>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Hiển thị {totalCount === 0 ? 0 : offset + 1}–{Math.min(offset + resources.length, totalCount)} / {totalCountData?.hasMore ? `${totalCount}+` : totalCount} tài nguyên
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={pageSize}
              onChange={(e) => { setPageSizeOverride(Number(e.target.value)); setCurrentPage(1); applyManualSelection([]); }}
            >
              {[10, 20, 30, 50, 100].map((size) => <option key={size} value={size}>{size}/trang</option>)}
            </select>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Trước</Button>
              {generatePaginationItems(currentPage, totalPages).map((item, index) => item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-slate-400">…</span>
              ) : (
                <Button
                  key={item}
                  variant={item === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(item)}
                  className={item === currentPage ? 'bg-cyan-600 hover:bg-cyan-500' : ''}
                >
                  {item}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Sau</Button>
            </div>
          </div>
        </div>
      </Card>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Xóa tài nguyên"
        itemName="tài nguyên này"
        dependencies={deleteInfo?.dependencies ?? []}
        isLoading={isDeleteLoading || deleteInfo === undefined}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
