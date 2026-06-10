'use client';

import React, { useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Edit, ExternalLink, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { AdminDragHandle, buildOrderUpdates, BulkActionBar, ColumnToggle, getReorderedItems, SelectCheckbox, SortableHeader, SortableTableRow, useAdminDndSensors, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export default function PostCategoriesListPage() {
  return (
    <ModuleGuard moduleKey="posts">
      <PostCategoriesContent />
    </ModuleGuard>
  );
}

function PostCategoriesContent() {
  const categoriesData = useQuery(api.postCategories.listAll, {});
  const postsData = useQuery(api.posts.listAll, {});
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'postCategories' });
  const deleteCategory = useMutation(api.postCategories.remove);
  const reorderCategories = useMutation(api.postCategories.reorder);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: 'order' });
  const [visibleColumns, setVisibleColumns] = useState(['select', 'drag', 'thumbnail', 'name', 'slug', 'count', 'status', 'actions']);
  const [selectedIds, setSelectedIds] = useState<Id<"postCategories">[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"postCategories"> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const dndSensors = useAdminDndSensors();

  const deleteInfo = useQuery(
    api.postCategories.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const isLoading = categoriesData === undefined || postsData === undefined || fieldsData === undefined;

  const enabledFields = useMemo(() => new Set(fieldsData?.map(field => field.fieldKey) ?? []), [fieldsData]);
  const showThumbnail = enabledFields.has('thumbnail');

  // Count posts per category
  const postCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    postsData?.forEach(post => {
      map[post.categoryId] = (map[post.categoryId] || 0) + 1;
    });
    return map;
  }, [postsData]);

  const categories = useMemo(() => categoriesData?.map(cat => ({
      ...cat,
      id: cat._id,
      count: postCountMap[cat._id] || 0,
    })) ?? [], [categoriesData, postCountMap]);

  const columns = [
    { key: 'select', label: 'Chọn' },
    { key: 'drag', label: 'Kéo', required: true },
    ...(showThumbnail ? [{ key: 'thumbnail', label: 'Ảnh' }] : []),
    { key: 'name', label: 'Tên danh mục', required: true },
    { key: 'slug', label: 'Slug' },
    { key: 'count', label: 'Số bài viết' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Hành động', required: true }
  ];

  const resolvedVisibleColumns = Array.from(new Set([
    ...columns.filter(c => c.required).map(c => c.key),
    ...visibleColumns.filter(key => columns.some(col => col.key === key)),
  ]));

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const filteredData = useMemo(() => {
    let data = [...categories];
    if (searchTerm) {
      data = data.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()) || cat.slug.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return data;
  }, [categories, searchTerm]);

  const sortedData = useSortableData(filteredData, sortConfig);
  const isReorderEnabled = !searchTerm.trim() && (sortConfig.key === null || sortConfig.key === 'order');

  const toggleSelectAll = () =>{  setSelectedIds(selectedIds.length === sortedData.length ? [] : sortedData.map(item => item.id as Id<"postCategories">)); };
  const toggleSelectItem = (id: Id<"postCategories">) =>{  setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const handleDelete = async (id: Id<"postCategories">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteCategory({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa danh mục thành công');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Không thể xóa danh mục');
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
        setSelectedIds([]);
        toast.success(`Đã xóa ${selectedIds.length} danh mục`);
      } catch {
        toast.error('Không thể xóa danh mục');
      }
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
          item => item.id as Id<"postCategories">,
          (_item, index) => index
        ),
      });
      setSortConfig({ direction: 'asc', key: 'order' });
      toast.success('Đã cập nhật thứ tự danh mục');
    } catch {
      toast.error('Không thể cập nhật thứ tự danh mục');
    }
  };

  const openFrontend = (slug: string) => {
    window.open(`https://example.com/category/${slug}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh mục bài viết</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý phân loại nội dung cho website</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/post-categories/create"><Button className="gap-2"><Plus size={16}/> Thêm danh mục</Button></Link>
          </div>
        </div>

        <BulkActionBar
          selectedCount={selectedIds.length}
          entityLabel="danh mục"
          onDelete={handleBulkDelete}
          onClearSelection={() =>{  setSelectedIds([]); }}
        />

        <Card>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative max-w-xs flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Tìm kiếm danh mục..." className="pl-9" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); }} />
              </div>
            </div>
            <ColumnToggle columns={columns} visibleColumns={resolvedVisibleColumns} onToggle={toggleColumn} />
          </div>
          {!isReorderEnabled && (
            <div className="px-4 py-3 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
              Tắt tìm kiếm và quay về thứ tự mặc định để kéo thả đổi vị trí.
            </div>
          )}
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                {resolvedVisibleColumns.includes('select') && (
                  <TableHead className="w-[40px]">
                    <SelectCheckbox checked={selectedIds.length === sortedData.length && sortedData.length > 0} onChange={toggleSelectAll} indeterminate={selectedIds.length > 0 && selectedIds.length < sortedData.length} />
                  </TableHead>
                )}
                {resolvedVisibleColumns.includes('drag') && <TableHead className="w-[40px]" />}
                {resolvedVisibleColumns.includes('thumbnail') && <TableHead className="w-[60px]">Ảnh</TableHead>}
                {resolvedVisibleColumns.includes('name') && <SortableHeader label="Tên danh mục" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />}
                {resolvedVisibleColumns.includes('slug') && <SortableHeader label="Slug" sortKey="slug" sortConfig={sortConfig} onSort={handleSort} />}
                {resolvedVisibleColumns.includes('count') && <SortableHeader label="Số bài viết" sortKey="count" sortConfig={sortConfig} onSort={handleSort} className="text-center" />}
                {resolvedVisibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />}
                {resolvedVisibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
              </TableRow>
            </TableHeader>
            <SortableContext items={sortedData.map(item => item.id)} strategy={verticalListSortingStrategy}>
            <TableBody>
              {sortedData.map(cat => (
                <SortableTableRow key={cat.id} id={cat.id} disabled={!isReorderEnabled} selected={selectedIds.includes(cat.id)} selectedClassName="bg-blue-500/5">
                  {({ attributes, disabled, listeners }) => (
                    <>
                  {resolvedVisibleColumns.includes('select') && (
                    <TableCell><SelectCheckbox checked={selectedIds.includes(cat.id)} onChange={() =>{  toggleSelectItem(cat.id); }} /></TableCell>
                  )}
                  {resolvedVisibleColumns.includes('drag') && (
                    <TableCell className="w-[40px]">
                      <AdminDragHandle attributes={attributes} disabled={disabled} listeners={listeners} />
                    </TableCell>
                  )}
                  {resolvedVisibleColumns.includes('thumbnail') && (
                    <TableCell>
                      {cat.thumbnail ? (
                        <Image src={cat.thumbnail} alt={cat.name} width={40} height={32} className="w-10 h-8 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-8 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs text-slate-400">-</div>
                      )}
                    </TableCell>
                  )}
                  {resolvedVisibleColumns.includes('name') && <TableCell className="font-medium">{cat.name}</TableCell>}
                  {resolvedVisibleColumns.includes('slug') && <TableCell className="text-slate-500 font-mono text-sm">{cat.slug}</TableCell>}
                  {resolvedVisibleColumns.includes('count') && <TableCell className="text-center"><Badge variant="secondary">{cat.count}</Badge></TableCell>}
                  {resolvedVisibleColumns.includes('status') && (
                    <TableCell>
                      <Badge variant={cat.active ? 'default' : 'secondary'}>{cat.active ? 'Hiện' : 'Ẩn'}</Badge>
                    </TableCell>
                  )}
                  {resolvedVisibleColumns.includes('actions') && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" title="Xem trên web" onClick={() =>{  openFrontend(cat.slug); }}><ExternalLink size={16}/></Button>
                        <Link href={`/admin/post-categories/${cat.id}/edit`}><Button variant="ghost" size="icon"><Edit size={16}/></Button></Link>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(cat.id as Id<"postCategories">)}><Trash2 size={16}/></Button>
                      </div>
                    </TableCell>
                  )}
                    </>
                  )}
                </SortableTableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={resolvedVisibleColumns.length} className="text-center py-8 text-slate-500">
                    {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có danh mục nào'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </SortableContext>
          </Table>
          </DndContext>
          {sortedData.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
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
        title="Xóa danh mục bài viết"
        itemName={categories.find((cat) => cat.id === deleteTargetId)?.name ?? 'danh mục'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </>
  );
}

