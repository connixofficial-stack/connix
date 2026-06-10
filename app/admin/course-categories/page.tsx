'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Edit, ExternalLink, FolderTree, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { ModuleGuard } from '../components/ModuleGuard';
import { AdminDragHandle, buildOrderUpdates, getReorderedItems, SelectCheckbox, SortableHeader, SortableTableRow, useAdminDndSensors, useSortableData } from '../components/TableUtilities';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export default function CourseCategoriesListPage() {
  return (
    <ModuleGuard moduleKey="courses">
      <CourseCategoriesContent />
    </ModuleGuard>
  );
}

function CourseCategoriesContent() {
  const categoriesData = useQuery(api.courseCategories.listAll, {});
  const coursesData = useQuery(api.courses.listAll, {});
  const deleteCategory = useMutation(api.courseCategories.remove);
  const reorderCategories = useMutation(api.courseCategories.reorder);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: 'order' });
  const [selectedIds, setSelectedIds] = useState<Id<'courseCategories'>[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<'courseCategories'> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const deleteInfo = useQuery(api.courseCategories.getDeleteInfo, deleteTargetId ? { id: deleteTargetId } : 'skip');
  const isLoading = categoriesData === undefined || coursesData === undefined;
  const dndSensors = useAdminDndSensors();

  const courseCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    coursesData?.forEach((course) => {
      map[course.categoryId] = (map[course.categoryId] || 0) + 1;
    });
    return map;
  }, [coursesData]);

  const categories = useMemo(() => categoriesData?.map((category) => ({
    ...category,
    count: courseCountMap[category._id] || 0,
    id: category._id,
  })) ?? [], [categoriesData, courseCountMap]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {return categories;}
    const lower = searchTerm.toLowerCase();
    return categories.filter((category) =>
      category.name.toLowerCase().includes(lower) ||
      category.slug.toLowerCase().includes(lower)
    );
  }, [categories, searchTerm]);

  const sortedData = useSortableData(filteredData, sortConfig);
  const isReorderEnabled = !searchTerm.trim() && (sortConfig.key === null || sortConfig.key === 'order');
  const isAllSelected = selectedIds.length === sortedData.length && sortedData.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedData.length;

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : sortedData.map((item) => item.id));
  };

  const toggleSelectItem = (id: Id<'courseCategories'>) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const handleDelete = (id: Id<'courseCategories'>) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const openFrontend = (slug: string) => {
    window.open(`/${slug}`, '_blank');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteCategory({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa danh mục');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Không thể xóa danh mục');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${selectedIds.length} danh mục đã chọn? Tất cả khóa học liên quan sẽ bị xóa.`)) {return;}
    try {
      for (const id of selectedIds) {
        await deleteCategory({ cascade: true, id });
      }
      setSelectedIds([]);
      toast.success(`Đã xóa ${selectedIds.length} danh mục`);
    } catch {
      toast.error('Không thể xóa danh mục');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(sortedData, event.active.id, event.over?.id, item => item.id);
    if (!reordered) {return;}

    try {
      await reorderCategories({
        items: buildOrderUpdates(
          reordered,
          sortedData.map(item => item.order),
          item => item.id,
          (_item, index) => index
        ),
      });
      setSortConfig({ direction: 'asc', key: 'order' });
      toast.success('Đã cập nhật thứ tự danh mục');
    } catch {
      toast.error('Không thể cập nhật thứ tự danh mục');
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
              <FolderTree className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh mục khóa học</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý phân loại khóa học</p>
            </div>
          </div>
          <Link href="/admin/course-categories/create">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500"><Plus size={16} /> Thêm danh mục</Button>
          </Link>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm dark:border-indigo-900 dark:bg-indigo-950/30">
            <span className="font-medium text-indigo-700 dark:text-indigo-200">Đã chọn {selectedIds.length} danh mục</span>
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
              <Input placeholder="Tìm kiếm danh mục..." className="pl-9" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); }} />
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
                <SortableHeader label="Tên danh mục" sortKey="name" sortConfig={sortConfig} onSort={(key) => { setSortConfig((prev) => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />
                <SortableHeader label="Slug" sortKey="slug" sortConfig={sortConfig} onSort={(key) => { setSortConfig((prev) => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />
                <SortableHeader label="Số khóa học" sortKey="count" sortConfig={sortConfig} onSort={(key) => { setSortConfig((prev) => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} className="text-center" />
                <SortableHeader label="Trạng thái" sortKey="active" sortConfig={sortConfig} onSort={(key) => { setSortConfig((prev) => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext items={sortedData.map(item => item.id)} strategy={verticalListSortingStrategy}>
            <TableBody>
              {sortedData.map((category) => (
                <SortableTableRow key={category.id} id={category.id} disabled={!isReorderEnabled} selected={selectedIds.includes(category.id)} selectedClassName="bg-indigo-500/5">
                  {({ attributes, disabled, listeners }) => (
                    <>
                  <TableCell className="w-[40px]">
                    <AdminDragHandle attributes={attributes} disabled={disabled} listeners={listeners} />
                  </TableCell>
                  <TableCell><SelectCheckbox checked={selectedIds.includes(category.id)} onChange={() => { toggleSelectItem(category.id); }} /></TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-500">{category.slug}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{category.count}</Badge></TableCell>
                  <TableCell><Badge variant={category.active ? 'default' : 'secondary'}>{category.active ? 'Hiện' : 'Ẩn'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" title="Xem trên web" onClick={() => { openFrontend(category.slug); }}>
                        <ExternalLink size={16} />
                      </Button>
                      <Link href={`/admin/course-categories/${category.id}/edit`}><Button variant="ghost" size="icon"><Edit size={16} /></Button></Link>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => { handleDelete(category.id); }}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                    </>
                  )}
                </SortableTableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                    {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có danh mục nào'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </SortableContext>
          </Table>
          </DndContext>
          {sortedData.length > 0 && (
            <div className="border-t border-slate-100 p-4 text-sm text-slate-500 dark:border-slate-800">
              Hiển thị {sortedData.length} / {categories.length} danh mục
            </div>
          )}
        </Card>
      </div>
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa danh mục khóa học"
        itemName={categories.find((category) => category.id === deleteTargetId)?.name ?? 'danh mục'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </>
  );
}
