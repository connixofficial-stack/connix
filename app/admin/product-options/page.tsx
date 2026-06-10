'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Edit, GripVertical, Layers, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../components/ui';
import { BulkActionBar, ColumnToggle, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DISPLAY_TYPE_LABELS: Record<string, string> = {
  buttons: 'Buttons/Pills',
  color_picker: 'Color Picker',
  color_swatch: 'Color Swatch',
  dropdown: 'Dropdown',
  image_swatch: 'Image Swatch',
  number_input: 'Number Input',
  radio: 'Radio',
  text_input: 'Text Input',
};

interface SortableRowProps {
  isDraggingDisabled: boolean;
  isSelected: boolean;
  onDelete: () => void;
  onToggleSelect: () => void;
  option: {
    _id: Id<'productOptions'>;
    active: boolean;
    displayType: string;
    isPreset: boolean;
    name: string;
    order: number;
    slug: string;
    unit?: string;
  };
}

function SortableRow({ isDraggingDisabled, isSelected, onDelete, onToggleSelect, option }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: option._id, disabled: isDraggingDisabled });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isSelected && 'bg-orange-500/5', isDragging && 'bg-slate-100 dark:bg-slate-800 opacity-80')}
    >
      <TableCell className="w-[40px]">
        <SelectCheckbox checked={isSelected} onChange={onToggleSelect} />
      </TableCell>
      <TableCell className="w-[40px]">
        <button
          {...attributes}
          {...listeners}
          disabled={isDraggingDisabled}
          className={cn(
            'p-1 rounded transition-colors',
            isDraggingDisabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing'
          )}
        >
          <GripVertical size={16} />
        </button>
      </TableCell>
      <TableCell className="font-medium">{option.name}</TableCell>
      <TableCell className="text-slate-500 font-mono text-sm">{option.slug}</TableCell>
      <TableCell>
        <Badge variant="secondary">{DISPLAY_TYPE_LABELS[option.displayType] ?? option.displayType}</Badge>
      </TableCell>
      <TableCell className="text-slate-500 text-sm">{option.unit ?? '-'}</TableCell>
      <TableCell>
        <Badge variant={option.isPreset ? 'default' : 'secondary'}>{option.isPreset ? 'Preset' : 'Custom'}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={option.active ? 'default' : 'secondary'}>{option.active ? 'Hiện' : 'Ẩn'}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Link href={`/admin/product-options/${option._id}/values`}>
            <Button variant="ghost" size="sm">Giá trị</Button>
          </Link>
          <Link href={`/admin/product-options/${option._id}/edit`}>
            <Button variant="ghost" size="icon"><Edit size={16} /></Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ProductOptionsListPage() {
  return (
    <ModuleGuard moduleKey="products">
      <ProductOptionsContent />
    </ModuleGuard>
  );
}

function ProductOptionsContent() {
  const optionsData = useQuery(api.productOptions.listAll, { limit: 500 });
  const removeOption = useMutation(api.productOptions.remove);
  const reorderOptions = useMutation(api.productOptions.reorder);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterPreset, setFilterPreset] = useState<'all' | 'preset' | 'custom'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: 'order' });
  const [visibleColumns, setVisibleColumns] = useState(['select', 'drag', 'name', 'slug', 'displayType', 'unit', 'preset', 'status', 'actions']);
  const [selectedIds, setSelectedIds] = useState<Id<'productOptions'>[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<'productOptions'> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const deleteInfo = useQuery(
    api.productOptions.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isLoading = optionsData === undefined;

  const filteredOptions = useMemo(() => {
    let data = [...(optionsData ?? [])];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      data = data.filter(option => option.name.toLowerCase().includes(searchLower) || option.slug.toLowerCase().includes(searchLower));
    }

    if (filterActive !== 'all') {
      data = data.filter(option => option.active === (filterActive === 'active'));
    }

    if (filterPreset !== 'all') {
      data = data.filter(option => option.isPreset === (filterPreset === 'preset'));
    }

    return data.sort((a, b) => a.order - b.order);
  }, [optionsData, searchTerm, filterActive, filterPreset]);

  const columns = [
    { key: 'select', label: 'Chọn' },
    { key: 'drag', label: '' },
    { key: 'name', label: 'Tên option', required: true },
    { key: 'slug', label: 'Slug' },
    { key: 'displayType', label: 'Hiển thị' },
    { key: 'unit', label: 'Đơn vị' },
    { key: 'preset', label: 'Preset' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Hành động', required: true },
  ];

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
  };

  const sortedData = useSortableData(filteredOptions, sortConfig);
  const isReorderEnabled = !searchTerm.trim() && filterActive === 'all' && filterPreset === 'all' && (sortConfig.key === 'order' || sortConfig.key === null);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleSelectAll = () =>{
    setSelectedIds(selectedIds.length === sortedData.length ? [] : sortedData.map(item => item._id));
  };
  const toggleSelectItem = (id: Id<'productOptions'>) =>{
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (id: Id<'productOptions'>) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await removeOption({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa option');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa option');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {return;}
    if (!confirm(`Xóa ${selectedIds.length} option đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {return;}
    try {
      await Promise.all(selectedIds.map(async (id) => removeOption({ cascade: true, id })));
      setSelectedIds([]);
      toast.success(`Đã xóa ${selectedIds.length} option`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa option');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const { active, over } = event;
    if (!over || active.id === over.id) {return;}

    const oldIndex = sortedData.findIndex(item => item._id === active.id);
    const newIndex = sortedData.findIndex(item => item._id === over.id);
    if (oldIndex < 0 || newIndex < 0) {return;}

    const reordered = arrayMove(sortedData, oldIndex, newIndex);
    try {
      await reorderOptions({ items: reordered.map((item, index) => ({ id: item._id, order: index })) });
      toast.success('Đã cập nhật thứ tự');
    } catch {
      toast.error('Không thể cập nhật thứ tự');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Layers className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Loại tùy chọn sản phẩm</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý các option dùng cho phiên bản sản phẩm</p>
          </div>
        </div>
        <Link href="/admin/product-options/create">
          <Button className="gap-2" variant="accent">
            <Plus size={16} /> Thêm option
          </Button>
        </Link>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="tùy chọn"
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  setSelectedIds([]); }}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative max-w-xs flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Tìm kiếm option..." className="pl-9" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); }} />
            </div>
            <select
              value={filterActive}
              onChange={(e) =>{  setFilterActive(e.target.value as 'all' | 'active' | 'inactive'); }}
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hiện</option>
              <option value="inactive">Ẩn</option>
            </select>
            <select
              value={filterPreset}
              onChange={(e) =>{  setFilterPreset(e.target.value as 'all' | 'preset' | 'custom'); }}
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="all">Preset + Custom</option>
              <option value="preset">Preset</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <ColumnToggle columns={columns} visibleColumns={visibleColumns} onToggle={toggleColumn} />
        </div>

        {!isReorderEnabled && (
          <div className="px-4 py-3 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
            Tắt filter/tìm kiếm và sắp xếp theo thứ tự để kéo thả đổi vị trí.
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
              <TableRow>
                {visibleColumns.includes('select') && (
                  <TableHead className="w-[40px]">
                    <SelectCheckbox checked={selectedIds.length === sortedData.length && sortedData.length > 0} onChange={toggleSelectAll} indeterminate={selectedIds.length > 0 && selectedIds.length < sortedData.length} />
                  </TableHead>
                )}
                {visibleColumns.includes('drag') && <TableHead className="w-[40px]" />}
                {visibleColumns.includes('name') && <SortableHeader label="Tên option" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />}
                {visibleColumns.includes('slug') && <SortableHeader label="Slug" sortKey="slug" sortConfig={sortConfig} onSort={handleSort} />}
                {visibleColumns.includes('displayType') && <SortableHeader label="Hiển thị" sortKey="displayType" sortConfig={sortConfig} onSort={handleSort} />}
                {visibleColumns.includes('unit') && <SortableHeader label="Đơn vị" sortKey="unit" sortConfig={sortConfig} onSort={handleSort} />}
                {visibleColumns.includes('preset') && <SortableHeader label="Preset" sortKey="isPreset" sortConfig={sortConfig} onSort={handleSort} />}
                {visibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="active" sortConfig={sortConfig} onSort={handleSort} />}
                {visibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
              </TableRow>
            </TableHeader>
            <SortableContext items={sortedData.map(item => item._id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {sortedData.map(option => (
                  <SortableRow
                    key={option._id}
                    option={option}
                    isDraggingDisabled={!isReorderEnabled}
                    isSelected={selectedIds.includes(option._id)}
                    onToggleSelect={() =>{  toggleSelectItem(option._id); }}
                    onDelete={() =>{  void handleDelete(option._id); }}
                  />
                ))}
                {sortedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-slate-500">
                      {searchTerm ? 'Không tìm thấy option phù hợp' : 'Chưa có option nào'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>

        {sortedData.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
            Hiển thị {sortedData.length} / {optionsData?.length ?? 0} option
          </div>
        )}
      </Card>
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa option"
        itemName={sortedData.find((option) => option._id === deleteTargetId)?.name ?? 'option'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
