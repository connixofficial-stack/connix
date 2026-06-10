'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { 
  ChevronLeft, ChevronRight, Edit, Eye, EyeOff, FileText, 
  Home, ImageIcon, LayoutGrid, Loader2,
  Phone, Plus, Search, Trash2, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { AdminDragHandle, buildOrderUpdates, BulkActionBar, getReorderedItems, SelectCheckbox, SortableHeader, SortableTableRow, useAdminDndSensors, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const MODULE_KEY = 'homepage';

const TYPE_ICONS: Record<string, React.ElementType> = {
  about: FileText,
  contact: Phone,
  hero: ImageIcon,
  partners: Users,
  posts: FileText,
  products: LayoutGrid,
};

const TYPE_COLORS: Record<string, string> = {
  about: 'bg-emerald-500/10 text-emerald-600',
  contact: 'bg-pink-500/10 text-pink-600',
  hero: 'bg-blue-500/10 text-blue-600',
  partners: 'bg-amber-500/10 text-amber-600',
  posts: 'bg-cyan-500/10 text-cyan-600',
  products: 'bg-purple-500/10 text-purple-600',
};

const TYPE_LABELS: Record<string, string> = {
  about: 'Giới thiệu',
  contact: 'Liên hệ',
  hero: 'Hero Banner',
  partners: 'Đối tác',
  posts: 'Bài viết',
  products: 'Sản phẩm',
};

export default function HomepageListPage() {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <HomepageContent />
    </ModuleGuard>
  );
}

function HomepageContent() {
  const componentsData = useQuery(api.homeComponents.listAll);
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  
  const deleteComponent = useMutation(api.homeComponents.remove);
  const toggleComponent = useMutation(api.homeComponents.toggle);
  const reorderComponents = useMutation(api.homeComponents.reorder);
  
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: 'order' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [selectedIds, setSelectedIds] = useState<Id<"homeComponents">[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const dndSensors = useAdminDndSensors();

  const isLoading = componentsData === undefined;

  const itemsPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'maxSections');
    return (setting?.value as number) || 10;
  }, [settingsData]);

  const components = useMemo(() => componentsData?.map(c => ({
      ...c,
      id: c._id,
      typeLabel: TYPE_LABELS[c.type] || c.type,
    })) ?? [], [componentsData]);

  const filteredComponents = useMemo(() => {
    let data = [...components];
    if (searchTerm) {
      data = data.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterType) {
      data = data.filter(c => c.type === filterType);
    }
    if (filterActive !== '') {
      data = data.filter(c => c.active === (filterActive === 'true'));
    }
    return data;
  }, [components, searchTerm, filterType, filterActive]);

  const sortedComponents = useSortableData(filteredComponents, sortConfig);
  const isReorderEnabled = !searchTerm.trim() && !filterType && !filterActive && (sortConfig.key === null || sortConfig.key === 'order');

  const totalPages = Math.ceil(sortedComponents.length / itemsPerPage);
  const paginatedComponents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedComponents.slice(start, start + itemsPerPage);
  }, [sortedComponents, currentPage, itemsPerPage]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string, type: 'type' | 'active') => {
    if (type === 'type') {setFilterType(value);}
    else {setFilterActive(value);}
    setCurrentPage(1);
  };

  const toggleSelectAll = () =>{  setSelectedIds(selectedIds.length === paginatedComponents.length ? [] : paginatedComponents.map(c => c._id)); };
  const toggleSelectItem = (id: Id<"homeComponents">) =>{  setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  // TICKET #10 FIX: Show detailed error message
  const handleDelete = async (id: Id<"homeComponents">) => {
    if (confirm('Xóa section này?')) {
      try {
        await deleteComponent({ id });
        toast.success('Đã xóa section');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Có lỗi khi xóa section');
      }
    }
  };

  // HIGH-006 FIX: Dùng Promise.all thay vì sequential
  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} section đã chọn?`)) {
      try {
        await Promise.all(selectedIds.map( async id => deleteComponent({ id })));
        setSelectedIds([]);
        toast.success(`Đã xóa ${selectedIds.length} section`);
      } catch {
        toast.error('Có lỗi khi xóa section');
      }
    }
  };

  // TICKET #10 FIX: Show detailed error message
  const handleToggle = async (id: Id<"homeComponents">) => {
    try {
      await toggleComponent({ id });
      toast.success('Đã cập nhật trạng thái');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi cập nhật trạng thái');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(paginatedComponents, event.active.id, event.over?.id, component => component._id);
    if (!reordered) {return;}

    try {
      await reorderComponents({
        items: buildOrderUpdates(
          reordered,
          paginatedComponents.map(component => component.order),
          component => component._id,
          (_component, index) => ((currentPage - 1) * itemsPerPage) + index
        ),
      });
      setSortConfig({ direction: 'asc', key: 'order' });
      toast.success('Đã cập nhật thứ tự section');
    } catch {
      toast.error('Không thể cập nhật thứ tự section');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Home className="w-6 h-6 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản lý trang chủ</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/homepage/create">
            <Button className="gap-2 bg-orange-600 hover:bg-orange-500">
              <Plus size={16}/> Thêm section
            </Button>
          </Link>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="section"
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  setSelectedIds([]); }}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Tìm kiếm section..." className="pl-9" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); }} />
          </div>
          <select 
            className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" 
            value={filterType} 
            onChange={(e) =>{  handleFilterChange(e.target.value, 'type'); }}
          >
            <option value="">Tất cả loại</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select 
            className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" 
            value={filterActive} 
            onChange={(e) =>{  handleFilterChange(e.target.value, 'active'); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hiện</option>
            <option value="false">Ẩn</option>
          </select>
        </div>
        {!isReorderEnabled && (
          <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
            Tắt tìm kiếm/lọc và sắp xếp theo thứ tự để kéo thả đổi vị trí.
          </div>
        )}
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <SelectCheckbox 
                  checked={selectedIds.length === paginatedComponents.length && paginatedComponents.length > 0} 
                  onChange={toggleSelectAll} 
                  indeterminate={selectedIds.length > 0 && selectedIds.length < paginatedComponents.length} 
                />
              </TableHead>
              <SortableHeader label="Thứ tự" sortKey="order" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Tên section" sortKey="title" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Loại" sortKey="type" sortConfig={sortConfig} onSort={handleSort} />
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext items={paginatedComponents.map(component => component._id)} strategy={verticalListSortingStrategy}>
          <TableBody>
            {paginatedComponents.map((component) => {
              const Icon = TYPE_ICONS[component.type] || LayoutGrid;
              const colorClass = TYPE_COLORS[component.type] || 'bg-slate-500/10 text-slate-600';
              return (
                <SortableTableRow key={component._id} id={component._id} disabled={!isReorderEnabled} selected={selectedIds.includes(component._id)}>
                  {({ attributes, disabled, listeners }) => (
                    <>
                  <TableCell>
                    <SelectCheckbox checked={selectedIds.includes(component._id)} onChange={() =>{  toggleSelectItem(component._id); }} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-slate-400">
                      <AdminDragHandle attributes={attributes} className="h-7 w-7" disabled={disabled} listeners={listeners} />
                      <span className="font-mono text-xs">{component.order + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{component.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${colorClass} gap-1`}>
                      <Icon size={12} />
                      {component.typeLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={component.active ? 'default' : 'secondary'}
                      className={component.active ? 'bg-emerald-500' : ''}
                    >
                      {component.active ? 'Hiện' : 'Ẩn'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-500 hover:text-slate-700"
                        onClick={ async () => handleToggle(component._id)}
                        title={component.active ? 'Ẩn section' : 'Hiện section'}
                      >
                        {component.active ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </Button>
                      <Link href={`/admin/homepage/${component._id}/edit`}>
                        <Button variant="ghost" size="icon" title="Sửa section">
                          <Edit size={16}/>
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600" 
                        onClick={ async () => handleDelete(component._id)}
                        title="Xóa section"
                      >
                        <Trash2 size={16}/>
                      </Button>
                    </div>
                  </TableCell>
                    </>
                  )}
                </SortableTableRow>
              );
            })}
            {paginatedComponents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  {searchTerm || filterType || filterActive ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có section nào'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </SortableContext>
        </Table>
        </DndContext>
        {sortedComponents.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedComponents.length)} / {sortedComponents.length} section
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() =>{  setCurrentPage(p => p - 1); }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() =>{  setCurrentPage(p => p + 1); }}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
