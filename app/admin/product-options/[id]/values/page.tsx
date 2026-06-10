'use client';

import React, { use, useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Edit, GripVertical, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../../../components/ui';
import { BulkActionBar, SelectCheckbox } from '../../../components/TableUtilities';
import { ModuleGuard } from '../../../components/ModuleGuard';
import { ImageUpload } from '../../../components/ImageUpload';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ValueFormState = {
  active: boolean;
  badge: string;
  colorCode: string;
  image?: string;
  isLifetime: boolean;
  label: string;
  numericValue: string;
  value: string;
};

type ProductOptionValueItem = {
  _id: Id<'productOptionValues'>;
  active: boolean;
  badge?: string;
  colorCode?: string;
  image?: string;
  isLifetime?: boolean;
  label?: string;
  numericValue?: number;
  order: number;
  value: string;
};

const buildValueDefaults = (): ValueFormState => ({
  active: true,
  badge: '',
  colorCode: '',
  image: undefined,
  isLifetime: false,
  label: '',
  numericValue: '',
  value: '',
});

interface SortableValueRowProps {
  isDraggingDisabled: boolean;
  isSelected: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggleSelect: () => void;
  showBadgeFields: boolean;
  showColorField: boolean;
  showImageField: boolean;
  value: {
    _id: Id<'productOptionValues'>;
    active: boolean;
    badge?: string;
    colorCode?: string;
    image?: string;
    isLifetime?: boolean;
    label?: string;
    numericValue?: number;
    order: number;
    value: string;
  };
}

function SortableValueRow({
  isDraggingDisabled,
  isSelected,
  onDelete,
  onEdit,
  onToggleSelect,
  showBadgeFields,
  showColorField,
  showImageField,
  value,
}: SortableValueRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: value._id, disabled: isDraggingDisabled });
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
      <TableCell className="font-medium">{value.value}</TableCell>
      <TableCell className="text-slate-500 text-sm">{value.label ?? '-'}</TableCell>
      {(showColorField || showImageField) && (
        <TableCell>
          <div className="flex items-center gap-2">
            {showColorField && value.colorCode && (
              <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: value.colorCode }} />
            )}
            {showImageField && value.image && (
              <div className="w-10 h-10 rounded overflow-hidden border border-slate-200">
                <Image src={value.image} alt={value.label ?? value.value} width={40} height={40} className="object-cover w-full h-full" />
              </div>
            )}
            {!showColorField && !showImageField && '-'}
          </div>
        </TableCell>
      )}
      {showBadgeFields && (
        <>
          <TableCell className="text-slate-500 text-sm">{value.numericValue ?? '-'}</TableCell>
          <TableCell>
            <Badge variant={value.isLifetime ? 'default' : 'secondary'}>{value.isLifetime ? 'Lifetime' : 'Thường'}</Badge>
          </TableCell>
          <TableCell className="text-slate-500 text-sm">{value.badge ?? '-'}</TableCell>
        </>
      )}
      <TableCell>
        <Badge variant={value.active ? 'default' : 'secondary'}>{value.active ? 'Hiện' : 'Ẩn'}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}><Edit size={16} /></Button>
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ProductOptionValuesPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ModuleGuard moduleKey="products">
      <ProductOptionValuesContent params={params} />
    </ModuleGuard>
  );
}

function ProductOptionValuesContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const optionId = id as Id<'productOptions'>;

  const optionData = useQuery(api.productOptions.getById, { id: optionId });
  const valuesData = useQuery(api.productOptionValues.listByOption, { optionId });
  const createValue = useMutation(api.productOptionValues.create);
  const updateValue = useMutation(api.productOptionValues.update);
  const removeValue = useMutation(api.productOptionValues.remove);
  const reorderValues = useMutation(api.productOptionValues.reorder);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedIds, setSelectedIds] = useState<Id<'productOptionValues'>[]>([]);
  const [newValue, setNewValue] = useState<ValueFormState>(buildValueDefaults());
  const [editingId, setEditingId] = useState<Id<'productOptionValues'> | null>(null);
  const [editingValue, setEditingValue] = useState<ValueFormState>(buildValueDefaults());
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isLoading = optionData === undefined || valuesData === undefined;
  const showColorField = optionData?.displayType === 'color_swatch' || optionData?.displayType === 'color_picker';
  const showImageField = optionData?.displayType === 'image_swatch';
  const showBadgeFields = optionData?.showPriceCompare ?? false;

  const filteredValues = useMemo(() => {
    let data = [...(valuesData ?? [])];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      data = data.filter(item => item.value.toLowerCase().includes(searchLower) || (item.label ?? '').toLowerCase().includes(searchLower));
    }

    if (filterActive !== 'all') {
      data = data.filter(item => item.active === (filterActive === 'active'));
    }

    return data.sort((a, b) => a.order - b.order);
  }, [valuesData, searchTerm, filterActive]);

  const isReorderEnabled = !searchTerm.trim() && filterActive === 'all';

  const toggleSelectAll = () =>{
    setSelectedIds(selectedIds.length === filteredValues.length ? [] : filteredValues.map(item => item._id));
  };
  const toggleSelectItem = (valueId: Id<'productOptionValues'>) =>{
    setSelectedIds(prev => prev.includes(valueId) ? prev.filter(i => i !== valueId) : [...prev, valueId]);
  };

  const handleCreate = async () => {
    if (!newValue.value.trim()) {return;}
    setIsSaving(true);
    try {
      await createValue({
        active: newValue.active,
        badge: newValue.badge || undefined,
        colorCode: showColorField ? newValue.colorCode || undefined : undefined,
        image: showImageField ? newValue.image : undefined,
        isLifetime: showBadgeFields ? newValue.isLifetime : undefined,
        label: newValue.label || undefined,
        numericValue: showBadgeFields && newValue.numericValue !== '' ? Number(newValue.numericValue) : undefined,
        optionId,
        value: newValue.value.trim(),
      });
      setNewValue(buildValueDefaults());
      toast.success('Đã thêm giá trị');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thêm giá trị');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (valueItem: ProductOptionValueItem) => {
    setEditingId(valueItem._id);
    setEditingValue({
      active: valueItem.active,
      badge: valueItem.badge ?? '',
      colorCode: valueItem.colorCode ?? '',
      image: valueItem.image,
      isLifetime: valueItem.isLifetime ?? false,
      label: valueItem.label ?? '',
      numericValue: valueItem.numericValue?.toString() ?? '',
      value: valueItem.value,
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !editingValue.value.trim()) {return;}
    setIsSaving(true);
    try {
      await updateValue({
        id: editingId,
        active: editingValue.active,
        badge: editingValue.badge || undefined,
        colorCode: showColorField ? editingValue.colorCode || undefined : undefined,
        image: showImageField ? editingValue.image : undefined,
        isLifetime: showBadgeFields ? editingValue.isLifetime : undefined,
        label: editingValue.label || undefined,
        numericValue: showBadgeFields && editingValue.numericValue !== '' ? Number(editingValue.numericValue) : undefined,
        value: editingValue.value.trim(),
      });
      setEditingId(null);
      toast.success('Đã cập nhật giá trị');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật giá trị');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (valueId: Id<'productOptionValues'>) => {
    if (!confirm('Xóa giá trị này?')) {return;}
    try {
      await removeValue({ id: valueId });
      toast.success('Đã xóa giá trị');
    } catch {
      toast.error('Không thể xóa giá trị');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {return;}
    if (!confirm(`Xóa ${selectedIds.length} giá trị đã chọn?`)) {return;}
    try {
      await Promise.all(selectedIds.map(async (valueId) => removeValue({ id: valueId })));
      setSelectedIds([]);
      toast.success(`Đã xóa ${selectedIds.length} giá trị`);
    } catch {
      toast.error('Không thể xóa giá trị');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const { active, over } = event;
    if (!over || active.id === over.id) {return;}

    const oldIndex = filteredValues.findIndex(item => item._id === active.id);
    const newIndex = filteredValues.findIndex(item => item._id === over.id);
    if (oldIndex < 0 || newIndex < 0) {return;}

    const reordered = arrayMove(filteredValues, oldIndex, newIndex);
    try {
      await reorderValues({ items: reordered.map((item, index) => ({ id: item._id, order: index })) });
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

  if (optionData === null) {
    return (
      <div className="text-center py-8 text-slate-500">
        Không tìm thấy option
      </div>
    );
  }

  const emptyColSpan = 6 + (showColorField || showImageField ? 1 : 0) + (showBadgeFields ? 3 : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/product-options" className="text-sm text-orange-600 hover:underline">
          Quay lại danh sách
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Giá trị: {optionData?.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý các giá trị cho option {optionData?.slug}</p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Thêm giá trị mới</h2>
            <p className="text-sm text-slate-500">Tạo nhanh giá trị option</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Value <span className="text-red-500">*</span></Label>
            <Input value={newValue.value} onChange={(e) =>{  setNewValue(prev => ({ ...prev, value: e.target.value })); }} placeholder="VD: Red, XL" />
          </div>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={newValue.label} onChange={(e) =>{  setNewValue(prev => ({ ...prev, label: e.target.value })); }} placeholder="Hiển thị (tuỳ chọn)" />
          </div>
          {showColorField && (
            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newValue.colorCode || '#ffffff'}
                  onChange={(e) =>{  setNewValue(prev => ({ ...prev, colorCode: e.target.value })); }}
                  className="h-10 w-16 p-1 rounded border border-slate-200"
                />
                <Input value={newValue.colorCode} onChange={(e) =>{  setNewValue(prev => ({ ...prev, colorCode: e.target.value })); }} placeholder="#FF0000" />
              </div>
            </div>
          )}
          {showImageField && (
            <div className="space-y-2">
              <Label>Ảnh swatch</Label>
              <ImageUpload value={newValue.image} onChange={(url) =>{  setNewValue(prev => ({ ...prev, image: url })); }} folder="product-options" />
            </div>
          )}
          {showBadgeFields && (
            <>
              <div className="space-y-2">
                <Label>Giá trị số</Label>
                <Input
                  type="number"
                  value={newValue.numericValue}
                  onChange={(e) =>{  setNewValue(prev => ({ ...prev, numericValue: e.target.value })); }}
                  placeholder="VD: 12"
                />
              </div>
              <div className="space-y-2">
                <Label>Badge</Label>
                <Input value={newValue.badge} onChange={(e) =>{  setNewValue(prev => ({ ...prev, badge: e.target.value })); }} placeholder="Best Value" />
              </div>
              <div className="space-y-2">
                <Label>Lifetime</Label>
                <select
                  value={newValue.isLifetime ? 'true' : 'false'}
                  onChange={(e) =>{  setNewValue(prev => ({ ...prev, isLifetime: e.target.value === 'true' })); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="false">Thường</option>
                  <option value="true">Lifetime</option>
                </select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <select
              value={newValue.active ? 'active' : 'inactive'}
              onChange={(e) =>{  setNewValue(prev => ({ ...prev, active: e.target.value === 'active' })); }}
              className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="active">Hiện</option>
              <option value="inactive">Ẩn</option>
            </select>
          </div>
        </div>
        <div>
          <Button variant="accent" className="gap-2" onClick={handleCreate} disabled={isSaving}>
            <Plus size={16} /> Thêm giá trị
          </Button>
        </div>
      </Card>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="giá trị"
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  setSelectedIds([]); }}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative max-w-xs flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Tìm kiếm giá trị..." className="pl-9" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); }} />
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
          </div>
        </div>

        {!isReorderEnabled && (
          <div className="px-4 py-3 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
            Tắt filter/tìm kiếm để kéo thả đổi vị trí.
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
              <TableRow>
                <TableHead className="w-[40px]">
                  <SelectCheckbox checked={selectedIds.length === filteredValues.length && filteredValues.length > 0} onChange={toggleSelectAll} indeterminate={selectedIds.length > 0 && selectedIds.length < filteredValues.length} />
                </TableHead>
                <TableHead className="w-[40px]" />
                <TableHead>Value</TableHead>
                <TableHead>Label</TableHead>
                {(showColorField || showImageField) && <TableHead>Preview</TableHead>}
                {showBadgeFields && (
                  <>
                    <TableHead>Giá trị số</TableHead>
                    <TableHead>Lifetime</TableHead>
                    <TableHead>Badge</TableHead>
                  </>
                )}
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext items={filteredValues.map(item => item._id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {filteredValues.map((valueItem) => {
                  if (editingId === valueItem._id) {
                    return (
                      <TableRow key={valueItem._id} className="bg-orange-500/5">
                        <TableCell />
                        <TableCell />
                        <TableCell>
                          <Input value={editingValue.value} onChange={(e) =>{  setEditingValue(prev => ({ ...prev, value: e.target.value })); }} />
                        </TableCell>
                        <TableCell>
                          <Input value={editingValue.label} onChange={(e) =>{  setEditingValue(prev => ({ ...prev, label: e.target.value })); }} />
                        </TableCell>
                        {(showColorField || showImageField) && (
                          <TableCell>
                            <div className="space-y-2">
                              {showColorField && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={editingValue.colorCode || '#ffffff'}
                                    onChange={(e) =>{  setEditingValue(prev => ({ ...prev, colorCode: e.target.value })); }}
                                    className="h-8 w-12 p-1 rounded border border-slate-200"
                                  />
                                  <Input value={editingValue.colorCode} onChange={(e) =>{  setEditingValue(prev => ({ ...prev, colorCode: e.target.value })); }} placeholder="#FF0000" />
                                </div>
                              )}
                              {showImageField && (
                                <ImageUpload value={editingValue.image} onChange={(url) =>{  setEditingValue(prev => ({ ...prev, image: url })); }} folder="product-options" />
                              )}
                            </div>
                          </TableCell>
                        )}
                        {showBadgeFields && (
                          <>
                            <TableCell>
                              <Input
                                type="number"
                                value={editingValue.numericValue}
                                onChange={(e) =>{  setEditingValue(prev => ({ ...prev, numericValue: e.target.value })); }}
                              />
                            </TableCell>
                            <TableCell>
                              <select
                                value={editingValue.isLifetime ? 'true' : 'false'}
                                onChange={(e) =>{  setEditingValue(prev => ({ ...prev, isLifetime: e.target.value === 'true' })); }}
                                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
                              >
                                <option value="false">Thường</option>
                                <option value="true">Lifetime</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input value={editingValue.badge} onChange={(e) =>{  setEditingValue(prev => ({ ...prev, badge: e.target.value })); }} />
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <select
                            value={editingValue.active ? 'active' : 'inactive'}
                            onChange={(e) =>{  setEditingValue(prev => ({ ...prev, active: e.target.value === 'active' })); }}
                            className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
                          >
                            <option value="active">Hiện</option>
                            <option value="inactive">Ẩn</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="accent" size="sm" onClick={handleUpdate} disabled={isSaving}>Lưu</Button>
                            <Button variant="ghost" size="sm" onClick={() =>{  setEditingId(null); }}>Hủy</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <SortableValueRow
                      key={valueItem._id}
                      value={valueItem}
                      isDraggingDisabled={!isReorderEnabled}
                      isSelected={selectedIds.includes(valueItem._id)}
                      onToggleSelect={() =>{  toggleSelectItem(valueItem._id); }}
                      onEdit={() =>{  handleEdit(valueItem); }}
                      onDelete={() =>{  void handleDelete(valueItem._id); }}
                      showBadgeFields={showBadgeFields}
                      showColorField={showColorField}
                      showImageField={showImageField}
                    />
                  );
                })}
                {filteredValues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={emptyColSpan} className="text-center py-8 text-slate-500">
                      {searchTerm ? 'Không tìm thấy giá trị phù hợp' : 'Chưa có giá trị nào'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>

        {filteredValues.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
            Hiển thị {filteredValues.length} / {valuesData?.length ?? 0} giá trị
          </div>
        )}
      </Card>
    </div>
  );
}
