'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Filter, Loader2, Plus, Edit, Trash2, LayoutGrid, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, Input, Label, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '@/app/admin/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/admin/components/ui';
import { SettingsImageUploader } from '@/app/admin/components/SettingsImageUploader';
import { ModuleGuard } from '@/app/admin/components/ModuleGuard';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import type { Id } from '@/convex/_generated/dataModel';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { CopyableInput } from '@/app/admin/components/CopyTextButton';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function convertToSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^a-z0-9\s-]|_)+/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

interface SortableValueRowProps {
  valueItem: {
    _id: Id<'courseFilterValues'>;
    name: string;
    slug: string;
    active: boolean;
    icon?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

function SortableValueRow({ valueItem, onEdit, onDelete }: SortableValueRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: valueItem._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'bg-slate-100 dark:bg-slate-800 opacity-80')}
    >
      <TableCell className="w-[40px]">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      </TableCell>
      <TableCell>
        {valueItem.icon ? (
          <div className="relative h-8 w-8 rounded overflow-hidden bg-slate-50 border border-slate-200">
            <Image src={valueItem.icon} alt={valueItem.name} fill className="object-contain p-0.5" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            <Filter size={14} />
          </div>
        )}
      </TableCell>
      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{valueItem.name}</TableCell>
      <TableCell className="font-mono text-xs text-slate-500">{valueItem.slug}</TableCell>
      <TableCell>
        <Badge variant={valueItem.active ? 'success' : 'secondary'}>
          {valueItem.active ? 'Hiện' : 'Ẩn'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} title="Sửa">
            <Edit size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50/50" onClick={onDelete} title="Xóa">
            <Trash2 size={14} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function CourseFilterEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ModuleGuard moduleKey="courses">
      <CourseFilterEditContent id={id as Id<'courseFilters'>} />
    </ModuleGuard>
  );
}

function CourseFilterEditContent({ id }: { id: Id<'courseFilters'> }) {
  const router = useRouter();
  
  // Queries & Mutations
  const filterData = useQuery(api.courseFilters.getById, { id });
  const updateFilter = useMutation(api.courseFilters.update);
  
  const filterValues = useQuery(api.courseFilters.listValuesByFilter, { filterId: id });
  const createValue = useMutation(api.courseFilters.createValue);
  const updateValue = useMutation(api.courseFilters.updateValue);
  const removeValue = useMutation(api.courseFilters.removeValue);
  const reorderValues = useMutation(api.courseFilters.reorderValue);

  // Group filter states (cha)
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const initialSnapshotRef = useRef<{ name: string; slug: string; active: boolean } | null>(null);

  // Modal states for Filter Values (con)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingValueId, setEditingValueId] = useState<Id<'courseFilterValues'> | null>(null);
  const [valName, setValName] = useState('');
  const [valSlug, setValSlug] = useState('');
  const [valActive, setValActive] = useState(true);
  const [valOrder, setValOrder] = useState(0);
  const [valIcon, setValIcon] = useState('');
  const [valIconStorageId, setValIconStorageId] = useState<Id<'_storage'> | null>(null);
  const [copyToPartner, setCopyToPartner] = useState(true);
  const [isSavingValue, setIsSavingValue] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !filterValues) return;

    const oldIndex = filterValues.findIndex(item => item._id === active.id);
    const newIndex = filterValues.findIndex(item => item._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(filterValues, oldIndex, newIndex);
    try {
      await reorderValues({ items: reordered.map((item, index) => ({ id: item._id, order: index })) });
      toast.success('Đã cập nhật thứ tự');
    } catch (error) {
      console.error(error);
      toast.error('Không thể cập nhật thứ tự');
    }
  };

  useEffect(() => {
    if (filterData && !initialized) {
      setName(filterData.name);
      setSlug(filterData.slug);
      setActive(filterData.active);
      initialSnapshotRef.current = {
        name: filterData.name,
        slug: filterData.slug,
        active: filterData.active,
      };
      setInitialized(true);
    }
  }, [filterData, initialized]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setSlug(convertToSlug(value));
  };

  const handleValNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValName(value);
    setValSlug(convertToSlug(value));
  };

  // Cha Dirty State
  const currentSnapshot = useMemo(() => ({
    name: name.trim(),
    slug: slug.trim(),
    active,
  }), [name, slug, active]);

  const hasChanges = useMemo(() => {
    if (!initialSnapshotRef.current) {return false;}
    return JSON.stringify(initialSnapshotRef.current) !== JSON.stringify(currentSnapshot);
  }, [currentSnapshot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Vui lòng điền đầy đủ tên và slug');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateFilter({
        id,
        active,
        name: name.trim(),
        slug: slug.trim(),
      });
      initialSnapshotRef.current = {
        name: name.trim(),
        slug: slug.trim(),
        active,
      };
      toast.success('Đã cập nhật nhóm bộ lọc thành công');
      router.push('/admin/courses/filters');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật bộ lọc');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal for creating new value
  const handleAddValue = () => {
    setEditingValueId(null);
    setValName('');
    setValSlug('');
    setValActive(true);
    setValOrder(0);
    setValIcon('');
    setValIconStorageId(null);
    setCopyToPartner(true);
    setIsModalOpen(true);
  };

  // Open modal for editing existing value
  const handleEditValue = (val: NonNullable<typeof filterValues>[number]) => {
    setEditingValueId(val._id);
    setValName(val.name);
    setValSlug(val.slug);
    setValActive(val.active);
    setValOrder(val.order);
    setValIcon(val.icon ?? '');
    setValIconStorageId(val.iconStorageId ?? null);
    setIsModalOpen(true);
  };

  // Save Filter Value (con)
  const handleSaveValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valName.trim() || !valSlug.trim()) {
      toast.error('Vui lòng điền đầy đủ tên và slug');
      return;
    }

    setIsSavingValue(true);
    try {
      if (editingValueId) {
        await updateValue({
          id: editingValueId,
          active: valActive,
          name: valName.trim(),
          order: valOrder,
          slug: valSlug.trim(),
          icon: valIcon || undefined,
          iconStorageId: valIconStorageId || undefined,
        });
        toast.success('Đã cập nhật giá trị bộ lọc thành công');
      } else {
        await createValue({
          filterId: id,
          active: valActive,
          name: valName.trim(),
          slug: valSlug.trim(),
          icon: valIcon || undefined,
          iconStorageId: valIconStorageId || undefined,
          copyToPartner,
        });
        toast.success('Đã thêm giá trị bộ lọc mới thành công');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu giá trị bộ lọc');
    } finally {
      setIsSavingValue(false);
    }
  };

  // Delete Filter Value (con)
  const handleDeleteValue = async (valId: Id<'courseFilterValues'>, valName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa giá trị "${valName}"? Các liên kết với khóa học cũng sẽ bị gỡ bỏ.`)) {
      return;
    }
    try {
      await removeValue({ id: valId });
      toast.success('Đã xóa giá trị bộ lọc thành công');
    } catch {
      toast.error('Không thể xóa giá trị bộ lọc');
    }
  };

  if (filterData === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (filterData === null) {
    return <div className="py-8 text-center text-slate-500">Không tìm thấy bộ lọc này</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2">
            <Filter className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa bộ lọc</h1>
            <Link href="/admin/courses/filters" className="text-sm text-indigo-600 hover:underline">Quay lại danh sách</Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card 1: Form thông tin chung nhóm bộ lọc (cha) */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Thông tin chung nhóm bộ lọc
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-name">Tên bộ lọc <span className="text-red-500">*</span></Label>
                  <CopyableInput
                    id="filter-name"
                    value={name}
                    onChange={handleNameChange}
                    copyLabel="tên bộ lọc"
                    placeholder="Ví dụ: Phần mềm, Cấp độ..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-slug">Slug <span className="text-red-500">*</span></Label>
                  <Input
                    id="filter-slug"
                    value={slug}
                    onChange={(e) => setSlug(convertToSlug(e.target.value))}
                    placeholder="ví dụ: phan-mem"
                    className="font-mono text-sm"
                    required
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          <HomeComponentStickyFooter
            isSubmitting={isSubmitting}
            submitLabel="Lưu thay đổi"
            active={active}
            onActiveChange={setActive}
          >
            <>
              <Button type="button" variant="ghost" onClick={() => router.push('/admin/courses/filters')} disabled={isSubmitting}>Hủy bỏ</Button>
              <Button
                type="submit"
                variant="accent"
                disabled={isSubmitting || !hasChanges}
                className={cn(
                  !hasChanges && !isSubmitting
                    ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                    : undefined
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Đang lưu...
                  </>
                ) : (!hasChanges ? 'Đã lưu' : 'Lưu thay đổi')}
              </Button>
            </>
          </HomeComponentStickyFooter>
        </form>

        {/* Card 2: Bảng quản lý giá trị con (Filter Values) */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <LayoutGrid size={18} className="text-slate-500" />
                  Danh sách giá trị của bộ lọc
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Thêm và chỉnh sửa các giá trị con (ví dụ: AutoCAD, Revit). Logo/Icon sẽ đi kèm với các giá trị này.
                </p>
              </div>
              <Button type="button" size="sm" onClick={handleAddValue} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white">
                <Plus size={14} /> Thêm giá trị
              </Button>
            </div>

            <div className="border border-slate-100 dark:border-slate-800 rounded-md overflow-hidden">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]" />
                      <TableHead className="w-[80px]">Logo/Icon</TableHead>
                      <TableHead>Tên giá trị</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="w-[120px]">Trạng thái</TableHead>
                      <TableHead className="w-[100px] text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext items={filterValues ? filterValues.map(item => item._id) : []} strategy={verticalListSortingStrategy}>
                    <TableBody>
                      {filterValues === undefined ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                            <span className="text-xs mt-1 block">Đang tải danh sách giá trị...</span>
                          </TableCell>
                        </TableRow>
                      ) : filterValues.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-slate-500 italic">
                            Chưa có giá trị bộ lọc nào. Hãy click "Thêm giá trị" để bắt đầu.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterValues.map((val) => (
                          <SortableValueRow
                            key={val._id}
                            valueItem={val}
                            onEdit={() => handleEditValue(val)}
                            onDelete={() => handleDeleteValue(val._id, val.name)}
                          />
                        ))
                      )}
                    </TableBody>
                  </SortableContext>
                </Table>
              </DndContext>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog thêm/sửa Giá trị bộ lọc (con) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg">
          <form onSubmit={handleSaveValue}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingValueId ? 'Chỉnh sửa giá trị bộ lọc' : 'Thêm giá trị bộ lọc mới'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="val-name">Tên giá trị <span className="text-red-500">*</span></Label>
                <Input
                  id="val-name"
                  value={valName}
                  onChange={handleValNameChange}
                  placeholder="Ví dụ: AutoCAD, Revit, 3DS Max..."
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="val-slug">Slug <span className="text-red-500">*</span></Label>
                <Input
                  id="val-slug"
                  value={valSlug}
                  onChange={(e) => setValSlug(convertToSlug(e.target.value))}
                  placeholder="ví dụ: autocad"
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="val-active">Trạng thái</Label>
                <select 
                  id="val-active"
                  value={valActive ? 'active' : 'inactive'}
                  onChange={(e) => setValActive(e.target.value === 'active')}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="active">Hiện</option>
                  <option value="inactive">Ẩn</option>
                </select>
              </div>



              <div className="space-y-1.5 pt-2">
                <Label>Logo / Icon giá trị</Label>
                <SettingsImageUploader
                  value={valIcon}
                  storageId={valIconStorageId}
                  onChange={(url, storageId) => {
                    setValIcon(url ?? '');
                    setValIconStorageId(storageId ?? null);
                  }}
                  folder="course-filter-values"
                  previewSize="sm"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSavingValue}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSavingValue} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {isSavingValue ? (
                  <span className="flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" />
                    Đang lưu...
                  </span>
                ) : 'Lưu giá trị'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
