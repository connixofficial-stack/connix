'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronDown, Edit, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAttributeIconComponent } from './_lib/iconRegistry';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { AdminDragHandle, buildOrderUpdates, BulkActionBar, ColumnToggle, generatePaginationItems, getReorderedItems, SelectCheckbox, SortableHeader, SortableTableRow, useAdminDndSensors, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const ATTRIBUTE_GROUP_COLUMNS_STORAGE_KEY = 'admin_attribute_groups_visible_columns_v2';

const FILTER_TYPE_LABELS: Record<string, string> = {
  multiple: 'Nhiều lựa chọn',
  range: 'Khoảng giá trị',
  single: 'Một lựa chọn',
};

const INPUT_TYPE_LABELS: Record<string, string> = {
  buttons: 'Nút bấm',
  radio: 'Radio',
  select: 'Dropdown',
};

export default function AttributeGroupsListPage() {
  return (
    <ModuleGuard moduleKey="products">
      <AttributeGroupsContent />
    </ModuleGuard>
  );
}

function AttributeGroupsContent() {
  const productsData = useQuery(api.products.listAll, { limit: 1000 });
  const deleteGroup = useMutation(api.attributeGroups.remove);
  const reorderGroups = useMutation(api.attributeGroups.reorder);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem(ATTRIBUTE_GROUP_COLUMNS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"attributeGroups">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [resolvedPageSize, setPageSizeOverride] = usePersistedPageSize('admin_product_categories_page_size', 20);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"attributeGroups"> | null>(null);
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
      window.localStorage.setItem(ATTRIBUTE_GROUP_COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const offset = (currentPage - 1) * resolvedPageSize;

  const categoriesData = useQuery(api.attributeGroups.listAdminWithOffset, {
    limit: resolvedPageSize,
    offset,
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
  });

  const deleteInfo = useQuery(
    api.attributeGroups.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const totalCountData = useQuery(api.attributeGroups.countAdmin, {
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
  });

  const selectAllData = useQuery(
    api.attributeGroups.listAdminIds,
    isSelectAllActive
      ? { search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined }
      : 'skip'
  );

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 nhóm thuộc tính phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  const categories = useMemo(() => categoriesData?.map(cat => ({
      ...cat,
      id: cat._id,
      count: 0,
    })) ?? [], [categoriesData]);
  const categoryIds = useMemo(() => categories.map(cat => cat.id as Id<"attributeGroups">), [categories]);
  const assignedTypesData = useQuery(
    api.attributeGroups.listAssignedProductTypesForGroups,
    categoryIds.length > 0 ? { groupIds: categoryIds } : 'skip'
  );
  const termCountsData = useQuery(
    api.attributeGroups.listTermCountsForGroups,
    categoryIds.length > 0 ? { groupIds: categoryIds } : 'skip'
  );
  const assignedTypesByGroup = useMemo(() => {
    const map = new Map<string, NonNullable<typeof assignedTypesData>[number]['productTypes']>();
    assignedTypesData?.forEach(row => {
      map.set(row.groupId, row.productTypes);
    });
    return map;
  }, [assignedTypesData]);
  const termCountByGroup = useMemo(() => {
    const map = new Map<string, number>();
    termCountsData?.forEach(row => {
      map.set(row.groupId, row.count);
    });
    return map;
  }, [termCountsData]);
  const isTableLoading = categoriesData === undefined || totalCountData === undefined || productsData === undefined || (categoryIds.length > 0 && (assignedTypesData === undefined || termCountsData === undefined));

  const columns = [
    { key: 'select', label: 'Chọn' },
    { key: 'name', label: 'Tên nhóm thuộc tính', required: true },
    { key: 'slug', label: 'Slug' },
    { key: 'code', label: 'Mã' },
    { key: 'attributeType', label: 'Kiểu thuộc tính' },
    { key: 'termCount', label: 'Số giá trị' },
    { key: 'productTypes', label: 'Loại sản phẩm' },
    { key: 'actions', label: 'Hành động', required: true }
  ];
  const resolvedVisibleColumns = visibleColumns.length > 0 ? visibleColumns : columns.map(c => c.key);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const sortedData = useSortableData(categories, sortConfig);
  const isReorderEnabled = !debouncedSearchTerm.trim() && (sortConfig.key === null || sortConfig.key === 'order');

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedPageSize) : 1;
  const paginatedData = sortedData;
  const tableColumnCount = resolvedVisibleColumns.length + 1;
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const applyManualSelection = (nextIds: Id<"attributeGroups">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
    setPageSizeOverride(null);
    applyManualSelection([]);
  };

  const selectedOnPage = paginatedData.filter(cat => selectedIds.includes(cat.id as Id<"attributeGroups">));
  const isPageSelected = paginatedData.length > 0 && selectedOnPage.length === paginatedData.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedData.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedData.some(cat => cat.id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedData.forEach(cat => next.add(cat.id as Id<"attributeGroups">));
    applyManualSelection(Array.from(next));
  };
  const toggleSelectItem = (id: Id<"attributeGroups">) =>{  
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const handleDelete = async (id: Id<"attributeGroups">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteGroup({ id: deleteTargetId });
      toast.success('Đã xóa nhóm thuộc tính thành công');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa nhóm thuộc tính');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} nhóm thuộc tính đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      try {
        for (const id of selectedIds) {
          await deleteGroup({ id });
        }
        applyManualSelection([]);
        toast.success(`Đã xóa ${selectedIds.length} nhóm thuộc tính`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể xóa nhóm thuộc tính');
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(paginatedData, event.active.id, event.over?.id, group => group.id);
    if (!reordered) {return;}

    try {
      await reorderGroups({
        items: buildOrderUpdates(
          reordered,
          paginatedData.map(group => group.order),
          group => group.id as Id<"attributeGroups">,
          (_group, index) => offset + index
        ),
      });
      setSortConfig({ direction: 'asc', key: null });
      toast.success('Đã cập nhật thứ tự nhóm thuộc tính');
    } catch {
      toast.error('Không thể cập nhật thứ tự nhóm thuộc tính');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nhóm thuộc tính</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý phân loại sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/attribute-groups/create"><Button className="gap-2"><Plus size={16}/> Thêm nhóm thuộc tính</Button></Link>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="nhóm thuộc tính"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedData.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedData.map(cat => cat.id as Id<"attributeGroups">)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  applyManualSelection([]); }}
      />
      
      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Tìm kiếm nhóm thuộc tính..." className="pl-9" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); setCurrentPage(1); applyManualSelection([]); }} />
            </div>
          </div>
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
            Tắt tìm kiếm và quay về thứ tự mặc định để kéo thả đổi vị trí.
          </div>
        )}
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              <TableHead className="w-[40px]" />
              {resolvedVisibleColumns.includes('select') && (
                <TableHead className="w-[40px]">
                  <SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} />
                </TableHead>
              )}
              {resolvedVisibleColumns.includes('name') && <SortableHeader label="Tên nhóm thuộc tính" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('slug') && <SortableHeader label="Slug" sortKey="slug" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('code') && <SortableHeader label="Mã" sortKey="code" sortConfig={sortConfig} onSort={handleSort} className="w-[120px] text-center [&>div]:justify-center" />}
              {resolvedVisibleColumns.includes('attributeType') && <SortableHeader label="Kiểu thuộc tính" sortKey="filterType" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('termCount') && <TableHead className="w-[110px] text-center">Số giá trị</TableHead>}
              {resolvedVisibleColumns.includes('productTypes') && <TableHead>Loại sản phẩm</TableHead>}
              {resolvedVisibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <SortableContext items={paginatedData.map(cat => cat.id)} strategy={verticalListSortingStrategy}>
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
                {paginatedData.map(cat => (
                  <SortableTableRow key={cat.id} id={cat.id} disabled={!isReorderEnabled} selected={selectedIds.includes(cat.id)}>
                    {({ attributes, disabled, listeners }) => (
                      <>
                <TableCell className="w-[40px]">
                  <AdminDragHandle attributes={attributes} disabled={disabled} listeners={listeners} />
                </TableCell>
                {resolvedVisibleColumns.includes('select') && (
                  <TableCell><SelectCheckbox checked={selectedIds.includes(cat.id)} onChange={() =>{  toggleSelectItem(cat.id); }} /></TableCell>
                )}
                {resolvedVisibleColumns.includes('name') && (
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = getAttributeIconComponent(cat.iconPath);
                        const iconColor = cat.displayConfig?.iconColor || cat.displayConfig?.color || '#ea580c';
                        return <IconComponent size={16} style={{ color: iconColor }} />;
                      })()}
                      {cat.name}
                    </div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('slug') && <TableCell className="text-slate-500 font-mono text-sm">{cat.slug}</TableCell>}
                {resolvedVisibleColumns.includes('code') && (
                  <TableCell className="w-[120px] text-center">
                    <Badge variant="secondary" className="inline-flex min-w-20 justify-center font-mono">{cat.code}</Badge>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('attributeType') && (
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {FILTER_TYPE_LABELS[cat.filterType] ?? cat.filterType}
                      </span>
                      {cat.filterType !== 'range' && (
                        <span className="text-xs text-slate-400">
                          {INPUT_TYPE_LABELS[cat.inputType] ?? cat.inputType}
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('termCount') && (
                  <TableCell className="w-[110px] text-center">
                    {cat.filterType === 'range' ? (
                      <span className="text-xs text-slate-400">Không áp dụng</span>
                    ) : (
                      <Badge variant="secondary" className="inline-flex min-w-10 justify-center">
                        {termCountByGroup.get(cat.id) ?? 0}
                      </Badge>
                    )}
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('productTypes') && (
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {(assignedTypesByGroup.get(cat.id) ?? []).slice(0, 3).map(type => (
                        <Link
                          key={type._id}
                          href={`/admin/product-types/${type._id}/edit`}
                          className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:border-orange-300 hover:text-orange-700"
                        >
                          {type.name}
                        </Link>
                      ))}
                      {(assignedTypesByGroup.get(cat.id)?.length ?? 0) > 3 && (
                        <Badge variant="secondary">+{(assignedTypesByGroup.get(cat.id)?.length ?? 0) - 3}</Badge>
                      )}
                      {assignedTypesData !== undefined && (assignedTypesByGroup.get(cat.id)?.length ?? 0) === 0 && (
                        <span className="text-xs text-slate-400">Chưa gán</span>
                      )}
                    </div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {(() => {
                        const firstType = assignedTypesByGroup.get(cat.id)?.find(type => type.active) ?? assignedTypesByGroup.get(cat.id)?.[0];
                        const href = firstType ? `/${firstType.slug}/${cat.slug}` : `/products/${cat.slug}`;
                        return (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={firstType ? 'Mở nhóm thuộc tính ngoài site' : 'Mở trang sản phẩm với filter group'}
                            onClick={() => window.open(href, '_blank')}
                          >
                            <ExternalLink size={16}/>
                          </Button>
                        );
                      })()}
                      <Link href={`/admin/attribute-groups/${cat.id}/edit`}><Button variant="ghost" size="icon"><Edit size={16}/></Button></Link>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(cat.id as Id<"attributeGroups">)}><Trash2 size={16}/></Button>
                    </div>
                  </TableCell>
                )}
                      </>
                    )}
                  </SortableTableRow>
                ))}
              </>
            )}
            {!isTableLoading && paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="text-center py-8 text-slate-500">
                  {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có nhóm thuộc tính nào.'}
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
                  value={resolvedPageSize}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số nhóm thuộc tính mỗi trang"
                >
                  {[10, 20, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>nhóm thuộc tính/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedPageSize) + 1 : 0}–{Math.min(currentPage * resolvedPageSize, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">nhóm thuộc tính</span>
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
                          ? 'bg-orange-600 text-white shadow-sm border font-medium'
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
        title="Xóa nhóm thuộc tính"
        itemName={categories.find((cat) => cat.id === deleteTargetId)?.name ?? 'nhóm thuộc tính'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
