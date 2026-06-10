'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronDown, Edit, ExternalLink, FolderTree, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { AdminDragHandle, buildOrderUpdates, BulkActionBar, ColumnToggle, generatePaginationItems, getReorderedItems, SelectCheckbox, SortableHeader, SortableTableRow, useAdminDndSensors, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import { buildCategoryPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export default function CategoriesListPage() {
  return (
    <ModuleGuard moduleKey="products">
      <CategoriesContent />
    </ModuleGuard>
  );
}

function CategoriesContent() {
  const productsData = useQuery(api.products.listAll, { limit: 1000 });
  const categoriesAllData = useQuery(api.productCategories.listAll, { limit: 1000 });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: 'products' });
  const enableProductTypesSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableProductTypes' });
  const deleteCategory = useMutation(api.productCategories.remove);
  const reorderCategories = useMutation(api.productCategories.reorder);
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem('admin_categories_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"productCategories">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [resolvedPageSize, setPageSizeOverride] = usePersistedPageSize('admin_categories_page_size', 20);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"productCategories"> | null>(null);
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
      window.localStorage.setItem('admin_categories_visible_columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const offset = (currentPage - 1) * resolvedPageSize;

  const categoriesData = useQuery(api.productCategories.listAdminWithOffset, {
    limit: resolvedPageSize,
    offset,
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
  });

  const deleteInfo = useQuery(
    api.productCategories.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const totalCountData = useQuery(api.productCategories.countAdmin, {
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
  });

  const enableProductTypes = enableProductTypesSetting?.value === true;

  const selectAllData = useQuery(
    api.productCategories.listAdminIds,
    isSelectAllActive
      ? { search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined }
      : 'skip'
  );

  const categoryIds = useMemo(() => categoriesData?.map(category => category._id) ?? [], [categoriesData]);
  const assignedProductTypesData = useQuery(
    api.productTypes.listAssignedTypesForCategories,
    enableProductTypes && categoryIds.length > 0 ? { categoryIds } : 'skip'
  );

  const isTableLoading = categoriesData === undefined
    || totalCountData === undefined
    || productsData === undefined
    || categoriesAllData === undefined
    || featuresData === undefined
    || enableProductTypesSetting === undefined
    || (enableProductTypes && categoryIds.length > 0 && assignedProductTypesData === undefined);

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 danh mục phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  const columns = useMemo(() => [
    { key: 'select', label: 'Chọn' },
    { key: 'name', label: 'Tên danh mục', required: true },
    { key: 'slug', label: 'Slug' },
    ...(enableProductTypes ? [{ key: 'productTypes', label: 'Product Type' }] : []),
    { key: 'count', label: 'Số sản phẩm' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Hành động', required: true }
  ], [enableProductTypes]);
  const columnKeys = useMemo(() => columns.map(c => c.key), [columns]);
  const resolvedVisibleColumns = (visibleColumns.length > 0 ? visibleColumns : columnKeys)
    .filter(key => columnKeys.includes(key));

  useEffect(() => {
    if (!enableProductTypes || visibleColumns.length === 0 || visibleColumns.includes('productTypes') || typeof window === 'undefined') {
      return;
    }
    const migrationKey = 'admin_categories_product_types_column_seen';
    if (window.localStorage.getItem(migrationKey) === 'true') {
      return;
    }
    setVisibleColumns(prev => {
      const base = prev.length > 0 ? prev : columnKeys;
      const statusIndex = base.indexOf('status');
      const next = [...base];
      next.splice(statusIndex >= 0 ? statusIndex : next.length, 0, 'productTypes');
      return next;
    });
    window.localStorage.setItem(migrationKey, 'true');
  }, [columnKeys, enableProductTypes, visibleColumns]);

  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    productsData?.forEach(product => {
      map[product.categoryId] = (map[product.categoryId] || 0) + 1;
    });
    return map;
  }, [productsData]);

  const parentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesAllData?.forEach(category => {
      map[category._id] = category.name;
    });
    return map;
  }, [categoriesAllData]);

  const categoryProductTypesMap = useMemo(() => {
    const map: Record<string, { _id: Id<"productTypes">; name: string }[]> = {};
    assignedProductTypesData?.forEach(row => {
      map[row.categoryId] = row.types.map(type => ({ _id: type._id, name: type.name }));
    });
    return map;
  }, [assignedProductTypesData]);

  const hierarchyEnabled = featuresData
    ?.find(feature => feature.featureKey === 'enableCategoryHierarchy')
    ?.enabled ?? false;

  const categories = useMemo(() => categoriesData?.map(cat => ({
      ...cat,
      id: cat._id,
      count: productCountMap[cat._id] || 0,
    })) ?? [], [categoriesData, productCountMap]);

  const treeSortedCategories = useMemo(() => {
    if (!hierarchyEnabled || sortConfig.key !== null) {
      return categories;
    }

    const idSet = new Set(categories.map(category => category.id));
    const roots = categories.filter(category => !category.parentId || !idSet.has(category.parentId));
    const childrenMap = new Map<string, typeof categories>();

    categories.forEach(category => {
      if (!category.parentId || !idSet.has(category.parentId)) {
        return;
      }
      const list = childrenMap.get(category.parentId) ?? [];
      list.push(category);
      childrenMap.set(category.parentId, list);
    });

    const compareByOrder = (a: typeof categories[number], b: typeof categories[number]) =>
      (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name);

    const result: typeof categories = [];
    const dfs = (node: typeof categories[number]) => {
      result.push(node);
      const children = childrenMap.get(node.id) ?? [];
      children.sort(compareByOrder);
      children.forEach(dfs);
    };

    roots.sort(compareByOrder);
    roots.forEach(dfs);

    return result;
  }, [categories, hierarchyEnabled, sortConfig.key]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const sortedData = useSortableData(treeSortedCategories, sortConfig);
  const isReorderEnabled = !debouncedSearchTerm.trim() && (sortConfig.key === null || sortConfig.key === 'order');

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedPageSize) : 1;
  const paginatedData = sortedData;
  const tableColumnCount = resolvedVisibleColumns.length + 1;
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const applyManualSelection = (nextIds: Id<"productCategories">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
    setPageSizeOverride(null);
    setSortConfig({ direction: 'asc', key: null });
    applyManualSelection([]);
  };

  const selectedOnPage = paginatedData.filter(cat => selectedIds.includes(cat.id));
  const isPageSelected = paginatedData.length > 0 && selectedOnPage.length === paginatedData.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedData.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedData.some(cat => cat.id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedData.forEach(cat => next.add(cat.id));
    applyManualSelection(Array.from(next));
  };
  const toggleSelectItem = (id: Id<"productCategories">) =>{  
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const handleDelete = async (id: Id<"productCategories">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteCategory({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa danh mục');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa danh mục');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} danh mục đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      try {
        for (const id of selectedIds) {
          await deleteCategory({ cascade: true, id });
        }
        applyManualSelection([]);
        toast.success(`Đã xóa ${selectedIds.length} danh mục`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể xóa danh mục');
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(paginatedData, event.active.id, event.over?.id, category => category.id);
    if (!reordered) {return;}

    try {
      await reorderCategories({
        items: buildOrderUpdates(
          reordered,
          paginatedData.map(category => category.order),
          category => category.id,
          (_category, index) => offset + index
        ),
      });
      setSortConfig({ direction: 'asc', key: null });
      toast.success('Đã cập nhật thứ tự danh mục');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật thứ tự danh mục');
    }
  };

  const openFrontend = (slug: string) => {
    window.open(buildCategoryPath({ categorySlug: slug, mode: routeMode, moduleKey: 'products' }), '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh mục sản phẩm</h1>
          <p className="text-sm text-slate-500">Tổ chức cây thư mục cho cửa hàng</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/categories/create"><Button className="gap-2"><Plus size={16}/> Thêm danh mục</Button></Link>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="danh mục"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedData.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedData.map(cat => cat.id)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  applyManualSelection([]); }}
      />
      
      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Tìm kiếm danh mục..." className="pl-9" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); setCurrentPage(1); applyManualSelection([]); }} />
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
              {resolvedVisibleColumns.includes('select') && <TableHead className="w-[40px]"><SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} /></TableHead>}
              {resolvedVisibleColumns.includes('name') && <SortableHeader label="Tên danh mục" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('slug') && <SortableHeader label="Slug" sortKey="slug" sortConfig={sortConfig} onSort={handleSort} />}
              {resolvedVisibleColumns.includes('productTypes') && <TableHead>Product Type</TableHead>}
              {resolvedVisibleColumns.includes('count') && <SortableHeader label="Số sản phẩm" sortKey="count" sortConfig={sortConfig} onSort={handleSort} className="text-center" />}
              {resolvedVisibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="active" sortConfig={sortConfig} onSort={handleSort} />}
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
                {resolvedVisibleColumns.includes('select') && <TableCell><SelectCheckbox checked={selectedIds.includes(cat.id)} onChange={() =>{  toggleSelectItem(cat.id); }} /></TableCell>}
                {resolvedVisibleColumns.includes('name') && (
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <FolderTree size={16} className={cat.parentId ? 'text-slate-400' : 'text-orange-500'} />
                        <span>{cat.name}</span>
                        {hierarchyEnabled && cat.parentId && (
                          <Badge variant="outline" className="text-xs py-0 px-1.5 font-normal">Con</Badge>
                        )}
                      </div>
                      {hierarchyEnabled && cat.parentId && (
                        <span className="text-xs text-slate-400 pl-6">
                          ↳ {parentNameMap[cat.parentId] ?? 'Không rõ cha'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('slug') && <TableCell className="text-slate-500 font-mono text-sm">{cat.slug}</TableCell>}
                {resolvedVisibleColumns.includes('productTypes') && (
                  <TableCell>
                    <div className="flex max-w-[260px] flex-wrap gap-1">
                      {(categoryProductTypesMap[cat.id] ?? []).length > 0 ? (
                        categoryProductTypesMap[cat.id].map(type => (
                          <Badge key={type._id} variant="outline" className="text-xs font-normal">
                            {type.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('count') && <TableCell className="text-center"><Badge variant="secondary">{cat.count}</Badge></TableCell>}
                {resolvedVisibleColumns.includes('status') && (
                  <TableCell>
                    <Badge variant={cat.active ? 'success' : 'secondary'}>{cat.active ? 'Hiện' : 'Ẩn'}</Badge>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" title="Xem trên web" onClick={() =>{  openFrontend(cat.slug); }}><ExternalLink size={16}/></Button>
                      <Link href={`/admin/categories/${cat.id}/edit`}><Button variant="ghost" size="icon"><Edit size={16}/></Button></Link>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(cat.id)}><Trash2 size={16}/></Button>
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
                  {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có danh mục nào.'}
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
                  aria-label="Số danh mục mỗi trang"
                >
                  {[10, 20, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>danh mục/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedPageSize) + 1 : 0}–{Math.min(currentPage * resolvedPageSize, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">danh mục</span>
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
        title="Xóa danh mục sản phẩm"
        itemName={categories.find((cat) => cat.id === deleteTargetId)?.name ?? 'danh mục'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
