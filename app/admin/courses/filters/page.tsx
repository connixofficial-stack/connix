'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Edit, Loader2, Plus, Search, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  Badge, 
  Button, 
  Card, 
  Input, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
} from '../../components/ui';
import { DeleteConfirmDialog } from '../../components/DeleteConfirmDialog';
import { ModuleGuard } from '../../components/ModuleGuard';
import { AdminDragHandle, buildOrderUpdates, getReorderedItems, SelectCheckbox, SortableHeader, SortableTableRow, useAdminDndSensors, useSortableData } from '../../components/TableUtilities';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export default function CourseFiltersListPage() {
  return (
    <ModuleGuard moduleKey="courses">
      <CourseFiltersContent />
    </ModuleGuard>
  );
}

function CourseFiltersContent() {
  const router = useRouter();
  const filtersData = useQuery(api.courseFilters.listAll, {});
  const deleteFilter = useMutation(api.courseFilters.remove);
  const reorderFilters = useMutation(api.courseFilters.reorder);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: 'order' });
  const [selectedIds, setSelectedIds] = useState<Id<'courseFilters'>[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<'courseFilters'> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const deleteInfo = useQuery(api.courseFilters.getDeleteInfo, deleteTargetId ? { id: deleteTargetId } : 'skip');
  const isLoading = filtersData === undefined;
  const dndSensors = useAdminDndSensors();

  const filters = useMemo(() => {
    return filtersData?.map((f) => ({
      ...f,
      id: f._id,
    })) ?? [];
  }, [filtersData]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {return filters;}
    const lower = searchTerm.toLowerCase();
    return filters.filter((f) =>
      f.name.toLowerCase().includes(lower) ||
      f.slug.toLowerCase().includes(lower)
    );
  }, [filters, searchTerm]);

  const sortedData = useSortableData(filteredData, sortConfig);
  const isReorderEnabled = !searchTerm.trim() && (sortConfig.key === null || sortConfig.key === 'order');
  const isAllSelected = selectedIds.length === sortedData.length && sortedData.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedData.length;

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : sortedData.map((item) => item.id));
  };

  const toggleSelectItem = (id: Id<'courseFilters'>) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const handleDeleteClick = (id: Id<'courseFilters'>) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteFilter({ id: deleteTargetId });
      toast.success('Đã xóa bộ lọc thành công');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Không thể xóa bộ lọc');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} bộ lọc đã chọn?`)) {return;}
    try {
      for (const id of selectedIds) {
        await deleteFilter({ id });
      }
      setSelectedIds([]);
      toast.success(`Đã xóa ${selectedIds.length} bộ lọc thành công`);
    } catch {
      toast.error('Có lỗi xảy ra khi xóa hàng loạt');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(sortedData, event.active.id, event.over?.id, filter => filter.id);
    if (!reordered) {return;}

    try {
      await reorderFilters({
        items: buildOrderUpdates(
          reordered,
          sortedData.map((filter, index) => filter.order ?? index),
          filter => filter.id,
          (_filter, index) => index
        ),
      });
      setSortConfig({ direction: 'asc', key: 'order' });
      toast.success('Đã cập nhật thứ tự bộ lọc');
    } catch {
      toast.error('Không thể cập nhật thứ tự bộ lọc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2">
              <Filter className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bộ lọc khóa học</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý các bộ lọc phần mềm / công cụ liên quan đến khóa học</p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/courses/filters/create')} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus size={16} /> Thêm bộ lọc
          </Button>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm dark:border-indigo-900 dark:bg-indigo-950/30">
            <span className="font-medium text-indigo-700 dark:text-indigo-200">Đã chọn {selectedIds.length} bộ lọc</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setSelectedIds([]); }}>Bỏ chọn</Button>
              <Button variant="destructive" size="sm" onClick={() => { void handleBulkDelete(); }}>Xóa</Button>
            </div>
          </div>
        )}

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Tìm kiếm bộ lọc..." className="pl-9" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); }} />
            </div>
          </div>
          {!isReorderEnabled && (
            <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
              Tắt tìm kiếm và quay về thứ tự mặc định để kéo thả đổi vị trí.
            </div>
          )}
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead className="w-[40px]">
                  <SelectCheckbox checked={isAllSelected} onChange={toggleSelectAll} indeterminate={isIndeterminate} />
                </TableHead>
                <SortableHeader label="Tên bộ lọc" sortKey="name" sortConfig={sortConfig} onSort={(key) => { setSortConfig((prev) => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />
                <SortableHeader label="Slug" sortKey="slug" sortConfig={sortConfig} onSort={(key) => { setSortConfig((prev) => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />
                <SortableHeader label="Số giá trị" sortKey="valuesCount" sortConfig={sortConfig} onSort={(key) => { setSortConfig((prev) => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />
                <SortableHeader label="Trạng thái" sortKey="active" sortConfig={sortConfig} onSort={(key) => { setSortConfig((prev) => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext items={sortedData.map(filter => filter.id)} strategy={verticalListSortingStrategy}>
            <TableBody>
              {sortedData.map((filter) => (
                <SortableTableRow key={filter.id} id={filter.id} disabled={!isReorderEnabled} selected={selectedIds.includes(filter.id)} selectedClassName="bg-indigo-500/5">
                  {({ attributes, disabled, listeners }) => (
                    <>
                  <TableCell className="w-[40px]">
                    <AdminDragHandle attributes={attributes} disabled={disabled} listeners={listeners} />
                  </TableCell>
                  <TableCell><SelectCheckbox checked={selectedIds.includes(filter.id)} onChange={() => { toggleSelectItem(filter.id); }} /></TableCell>
                  <TableCell className="font-medium">{filter.name}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-500">{filter.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="tabular-nums">{filter.valuesCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={filter.active ? 'success' : 'secondary'}>
                      {filter.active ? 'Hiện' : 'Ẩn'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/courses/filters/${filter.id}/edit`)} title="Chỉnh sửa">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => { handleDeleteClick(filter.id); }} title="Xóa">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                    </>
                  )}
                </SortableTableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                    {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có bộ lọc nào'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </SortableContext>
          </Table>
          </DndContext>
          {sortedData.length > 0 && (
            <div className="border-t border-slate-100 p-4 text-sm text-slate-500 dark:border-slate-800">
              Hiển thị {sortedData.length} / {filters.length} bộ lọc
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa bộ lọc khóa học"
        itemName={filters.find((f) => f.id === deleteTargetId)?.name ?? 'bộ lọc'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </>
  );
}
