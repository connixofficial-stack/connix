'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Copy, Edit, Grid, GripVertical, History, Loader2, Plus, Search, Trash2, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../components/ui';
import { BulkActionBar, SelectCheckbox } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { COMPONENT_TYPES } from './create/shared';
import { getEditRoute as getEditRouteByType } from './_shared/lib/componentRoutes';
import { HomepageSnapshotDialog } from '@/components/modules/homepage/HomepageSnapshotDialog';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useComponentListFilter } from './_shared/hooks/useComponentListFilter';

export default function HomeComponentsPageWrapper() {
  return (
    <ModuleGuard moduleKey="homepage">
      <HomeComponentsPage />
    </ModuleGuard>
  );
}

const getEditRoute = (type: string, id: string) => (
  getEditRouteByType(type, id) ?? `/admin/home-components/${id}/edit`
);

interface SortableRowProps {
  comp: { _id: string; title: string; type: string; active: boolean; config?: { preview?: string; description?: string } };
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableRow({ comp, index, isSelected, onToggleSelect, onToggleActive, onDelete, onDuplicate }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: comp._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const TypeIcon = COMPONENT_TYPES.find(t => t.value === comp.type)?.icon ?? Grid;

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={cn(isSelected && 'bg-blue-500/5', isDragging && 'bg-slate-100 dark:bg-slate-800 opacity-80')}
    >
      <TableCell>
        <SelectCheckbox checked={isSelected} onChange={onToggleSelect} />
      </TableCell>
      <TableCell className="w-[50px]">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          <GripVertical size={16} className="text-slate-400" />
        </button>
      </TableCell>
      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
      <TableCell>
        <div className="font-medium">{comp.title}</div>
        <div className="text-xs text-slate-400 truncate max-w-[300px]">{(comp.config?.preview ?? comp.config?.description) ?? ''}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
            <TypeIcon size={14} className="text-slate-600 dark:text-slate-400" />
          </div>
          <span className="text-sm">{comp.type}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div 
          className={cn(
            "cursor-pointer inline-flex items-center justify-center rounded-full w-8 h-4 transition-colors",
            comp.active ? "bg-green-500" : "bg-slate-300"
          )}
          onClick={onToggleActive}
        >
          <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", comp.active ? "translate-x-2" : "-translate-x-2")}></div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Link href={getEditRoute(comp.type, comp._id)}>
            <Button variant="ghost" size="icon" title="Chỉnh sửa"><Edit size={16} /></Button>
          </Link>
          <Button variant="ghost" size="icon" title="Nhân bản" onClick={onDuplicate}>
            <Copy size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" title="Xóa" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function HomeComponentsPage() {
  const components = useQuery(api.homeComponents.listAll);
  const removeMutation = useMutation(api.homeComponents.remove);
  const toggleMutation = useMutation(api.homeComponents.toggle);
  const updateMutation = useMutation(api.homeComponents.update);
  const reorderMutation = useMutation(api.homeComponents.reorder);
  const duplicateMutation = useMutation(api.homeComponents.duplicate);
  const wizardSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'homepage', settingKey: 'enableSmartWizard' });
  const legacySnapshotQuickCreateSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'homepage', settingKey: 'enableLegacySnapshotQuickCreate' });

  const { filtered, search, setSearch, typeFilter, setTypeFilter, statusFilter, setStatusFilter, resetFilters, hasActiveFilter, availableTypes } =
    useComponentListFilter(components);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openWizard, setOpenWizard] = useState(false);
  const [openQuickCreate, setOpenQuickCreate] = useState(false);
  const [statusLoading, setStatusLoading] = useState<'show' | 'hide' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  if (components === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }
  
  const getSortWeight = (type: string) => {
    if (type === 'Footer') return 2;
    if (type === 'SpeedDial') return 1;
    return 0;
  };

  const sortedComponents = [...components].sort((a, b) => {
    const weightA = getSortWeight(a.type);
    const weightB = getSortWeight(b.type);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return a.order - b.order;
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {return;}

    const oldIndex = sortedComponents.findIndex(c => c._id === active.id);
    const newIndex = sortedComponents.findIndex(c => c._id === over.id);
    const reordered = arrayMove(sortedComponents, oldIndex, newIndex);

    try {
      await reorderMutation({ items: reordered.map((c, i) => ({ id: c._id, order: i })) });
      toast.success('Đã cập nhật thứ tự');
    } catch {
      toast.error('Lỗi khi cập nhật thứ tự');
    }
  };

  // sortedFiltered: lọc từ sortedComponents (đã có order) → không cần re-sort
  const sortedFilteredIds = new Set(filtered.map(c => c._id));
  const sortedFiltered = sortedComponents.filter(c => sortedFilteredIds.has(c._id));


  const toggleSelectAll = () =>{
    setSelectedIds(selectedIds.length === sortedFiltered.length ? [] : sortedFiltered.map(c => c._id));
  };
  const toggleSelectItem = (id: string) =>{  setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const handleDuplicate = async (id: Id<"homeComponents">) => {
    try {
      await duplicateMutation({ id });
      toast.success('Đã nhân bản component');
    } catch {
      toast.error('Lỗi khi nhân bản component');
    }
  };

  const handleDelete = async (id: Id<"homeComponents">) => {
    if (confirm('Xóa component này khỏi trang chủ?')) {
      try {
        await removeMutation({ id });
        toast.success('Đã xóa component');
      } catch {
        toast.error('Lỗi khi xóa component');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} component đã chọn?`)) {
      try {
        await Promise.all(selectedIds.map( async id => removeMutation({ id: id as Id<"homeComponents"> })));
        setSelectedIds([]);
        toast.success(`Đã xóa ${selectedIds.length} component`);
      } catch {
        toast.error('Lỗi khi xóa components');
      }
    }
  };

  const toggleActive = async (id: Id<"homeComponents">) => {
    try {
      await toggleMutation({ id });
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleBulkShow = async () => {
    setStatusLoading('show');
    try {
      await Promise.all(
        selectedIds.map( async id => {
          const comp = sortedComponents.find(c => c._id === id);
          if (comp && !comp.active) {
            await updateMutation({ id: id as Id<"homeComponents">, active: true });
          }
        })
      );
      setSelectedIds([]);
      toast.success(`Đã hiển thị ${selectedIds.length} component`);
    } catch {
      toast.error('Lỗi khi hiển thị components');
    } finally {
      setStatusLoading(null);
    }
  };

  const handleBulkHide = async () => {
    setStatusLoading('hide');
    try {
      await Promise.all(
        selectedIds.map( async id => {
          const comp = sortedComponents.find(c => c._id === id);
          if (comp && comp.active) {
            await updateMutation({ id: id as Id<"homeComponents">, active: false });
          }
        })
      );
      setSelectedIds([]);
      toast.success(`Đã ẩn ${selectedIds.length} component`);
    } catch {
      toast.error('Lỗi khi ẩn components');
    } finally {
      setStatusLoading(null);
    }
  };

  const showWizard = wizardSetting?.value !== false;
  const showLegacySnapshotQuickCreate = showWizard && legacySnapshotQuickCreateSetting?.value === true;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Giao diện Trang chủ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý các khối nội dung hiển thị trên trang chủ</p>
        </div>
        <div className="flex items-center gap-2">
          {showWizard && (
            <div className="relative">
              <Button className="gap-2" variant="outline" onClick={() => setOpenQuickCreate((open) => !open)}>
                <Wand2 size={16} /> Tạo nhanh <ChevronDown size={14} />
              </Button>
              {openQuickCreate && (
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => {
                      setOpenQuickCreate(false);
                      setOpenWizard(true);
                    }}
                  >
                    <Wand2 size={15} /> Tạo nhanh snapshot
                  </button>
                  {showLegacySnapshotQuickCreate && (
                    <Link
                      href="/admin/home-components/snapshots/clone"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setOpenQuickCreate(false)}
                    >
                      <History size={15} /> Từ snapshot cũ
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
          <Link href="/admin/home-components/create">
            <Button className="gap-2" variant="accent">
              <Plus size={16} /> Thêm Component
            </Button>
          </Link>
        </div>
      </div>

      {showWizard && <HomepageSnapshotDialog open={openWizard} onOpenChange={setOpenWizard} />}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Tìm theo tên, loại..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 w-52 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Tất cả loại</option>
          {availableTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Tất cả</option>
          <option value="active">Hiện</option>
          <option value="inactive">Ẩn</option>
        </select>
        {hasActiveFilter && (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Xóa filter" onClick={resetFilters}>
            <X size={14} />
          </Button>
        )}
        {hasActiveFilter && (
          <span className="text-xs text-slate-500">{sortedFiltered.length} / {components?.length ?? 0} kết quả</span>
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="component"
        onShow={handleBulkShow}
        onHide={handleBulkHide}
        isStatusLoading={statusLoading}
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  setSelectedIds([]); }}
      />

      <Card>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <SelectCheckbox
                    checked={selectedIds.length === sortedFiltered.length && sortedFiltered.length > 0}
                    onChange={toggleSelectAll}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < sortedFiltered.length}
                  />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[50px]">TT</TableHead>
                <TableHead>Tên Component</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={sortedFiltered.map(c => c._id)} strategy={verticalListSortingStrategy}>
                {sortedFiltered.map((comp, index) => (
                  <SortableRow
                    key={comp._id}
                    comp={comp as typeof comp & { config?: { preview?: string; description?: string } }}
                    index={index}
                    isSelected={selectedIds.includes(comp._id)}
                    onToggleSelect={() =>{ toggleSelectItem(comp._id); }}
                    onToggleActive={async () => toggleActive(comp._id)}
                    onDelete={async () => handleDelete(comp._id)}
                    onDuplicate={async () => handleDuplicate(comp._id)}
                  />
                ))}
              </SortableContext>
              {sortedFiltered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    {hasActiveFilter ? 'Không tìm thấy component phù hợp' : 'Chưa có component nào'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
        {sortedFiltered.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
            {hasActiveFilter
              ? `Lọc: ${sortedFiltered.length} / ${components?.length ?? 0} component`
              : `${sortedFiltered.length} component — Kéo thả để xếp thứ tự`}
          </div>
        )}
      </Card>
    </div>
  );
}
