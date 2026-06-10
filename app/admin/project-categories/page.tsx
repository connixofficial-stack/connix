'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Edit, FolderTree, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { ModuleGuard } from '../components/ModuleGuard';
import { AdminDragHandle, buildOrderUpdates, getReorderedItems, SortableTableRow, useAdminDndSensors } from '../components/TableUtilities';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export default function ProjectCategoriesListPage() {
  return (
    <ModuleGuard moduleKey="projects">
      <ProjectCategoriesContent />
    </ModuleGuard>
  );
}

function ProjectCategoriesContent() {
  const categoriesData = useQuery(api.projectCategories.listAll, {});
  const projectsData = useQuery(api.projects.listAll, {});
  const deleteCategory = useMutation(api.projectCategories.remove);
  const reorderCategories = useMutation(api.projectCategories.reorder);
  const [searchTerm, setSearchTerm] = useState('');
  const dndSensors = useAdminDndSensors();

  const projectCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    projectsData?.forEach((project) => {
      map[project.categoryId] = (map[project.categoryId] || 0) + 1;
    });
    return map;
  }, [projectsData]);

  const categories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return (categoriesData ?? [])
      .filter((category) => !keyword || category.name.toLowerCase().includes(keyword) || category.slug.toLowerCase().includes(keyword))
      .map((category) => ({ ...category, count: projectCountMap[category._id] || 0 }))
      .sort((a, b) => a.order - b.order);
  }, [categoriesData, projectCountMap, searchTerm]);
  const isReorderEnabled = !searchTerm.trim();

  const handleDelete = async (id: Id<'projectCategories'>) => {
    if (!confirm('Xóa danh mục dự án này và dữ liệu liên quan?')) {return;}
    try {
      await deleteCategory({ cascade: true, id });
      toast.success('Đã xóa danh mục dự án');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa danh mục');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(categories, event.active.id, event.over?.id, item => item._id);
    if (!reordered) {return;}

    try {
      await reorderCategories({
        items: buildOrderUpdates(
          reordered,
          categories.map(item => item.order),
          item => item._id,
          (_item, index) => index
        ),
      });
      toast.success('Đã cập nhật thứ tự danh mục');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật thứ tự danh mục');
    }
  };

  if (categoriesData === undefined || projectsData === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-500/10 p-2">
            <FolderTree className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh mục dự án</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý phân loại dự án.</p>
          </div>
        </div>
        <Link href="/admin/project-categories/create">
          <Button className="gap-2 bg-teal-600 hover:bg-teal-500"><Plus size={16} /> Thêm danh mục</Button>
        </Link>
      </div>

      <Card>
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              className="pl-9"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        {!isReorderEnabled && (
          <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
            Tắt tìm kiếm để kéo thả đổi vị trí.
          </div>
        )}
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Số dự án</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext items={categories.map(category => category._id)} strategy={verticalListSortingStrategy}>
          <TableBody>
            {categories.map((category) => (
              <SortableTableRow key={category._id} id={category._id} disabled={!isReorderEnabled}>
                {({ attributes, disabled, listeners }) => (
                  <>
                <TableCell className="w-[40px]">
                  <AdminDragHandle attributes={attributes} disabled={disabled} listeners={listeners} />
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="font-mono text-sm text-slate-500">{category.slug}</TableCell>
                <TableCell className="text-center"><Badge variant="secondary">{category.count}</Badge></TableCell>
                <TableCell>
                  <Badge variant={category.active ? 'default' : 'secondary'}>{category.active ? 'Hiện' : 'Ẩn'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/project-categories/${category._id}/edit`}>
                      <Button variant="ghost" size="icon"><Edit size={16} /></Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => { void handleDelete(category._id); }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
                  </>
                )}
              </SortableTableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                  {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có danh mục dự án nào'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </SortableContext>
        </Table>
        </DndContext>
      </Card>
    </div>
  );
}
