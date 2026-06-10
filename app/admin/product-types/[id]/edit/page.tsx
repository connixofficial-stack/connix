'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2, Plus, Trash2, ExternalLink, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, Input, Label, cn } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import { getAttributeIconComponent } from '../../../attribute-groups/_lib/iconRegistry';
import { useUnsavedGuard } from '@/app/admin/home-components/_shared/hooks/useUnsavedGuard';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';

const MODULE_KEY = 'productTypes';

interface PriceRange {
  label: string;
  slug: string;
  minPrice?: number;
  maxPrice?: number;
}

type AttributeGroupItem = {
  _id: Id<"attributeGroups">;
  name: string;
  code: string;
  iconPath?: string;
  displayConfig?: {
    iconColor?: string;
    color?: string;
  };
};

function SortableAssignedGroupRow({
  group,
  index,
  onRemove,
}: {
  group: AttributeGroupItem;
  index: number;
  onRemove: (id: Id<"attributeGroups">) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group._id });
  const IconComponent = getAttributeIconComponent(group.iconPath);
  const iconColor = group.displayConfig?.iconColor || group.displayConfig?.color || '#ea580c';
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid grid-cols-[32px_28px_1fr_auto] items-center gap-2 rounded-lg border bg-white px-2.5 py-2 text-sm shadow-sm dark:bg-slate-950',
        isDragging ? 'border-orange-300 shadow-md opacity-90' : 'border-slate-200 dark:border-slate-800',
      )}
    >
      <button
        type="button"
        className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-orange-600 active:cursor-grabbing dark:hover:bg-slate-800"
        {...attributes}
        {...listeners}
        aria-label={`Kéo thả ${group.name}`}
      >
        <GripVertical size={15} />
      </button>
      <input
        type="checkbox"
        checked
        onChange={() => onRemove(group._id)}
        className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
        aria-label={`Bỏ gán ${group.name}`}
      />
      <div className="min-w-0 flex items-center gap-2">
        <IconComponent size={15} style={{ color: iconColor }} className="shrink-0" />
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-800 dark:text-slate-100">{group.name}</div>
          <div className="truncate font-mono text-[11px] text-slate-400">{group.code}</div>
        </div>
      </div>
      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
        #{index + 1}
      </span>
    </div>
  );
}

function AssignedAttributeGroupsManager({
  groups,
  selectedIds,
  onChange,
}: {
  groups: AttributeGroupItem[] | undefined;
  selectedIds: Id<"attributeGroups">[];
  onChange: (ids: Id<"attributeGroups">[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const groupMap = useMemo(() => new Map((groups ?? []).map((group) => [group._id, group])), [groups]);
  const selectedGroups = selectedIds
    .map((groupId) => groupMap.get(groupId))
    .filter((group): group is AttributeGroupItem => Boolean(group));
  const selectedSet = new Set(selectedIds);
  const unselectedGroups = (groups ?? []).filter((group) => !selectedSet.has(group._id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedIds.findIndex((groupId) => groupId === active.id);
    const newIndex = selectedIds.findIndex((groupId) => groupId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(selectedIds, oldIndex, newIndex));
  };

  if (groups === undefined) {
    return <p className="text-sm text-slate-500 italic">Đang tải...</p>;
  }

  if (groups.length === 0) {
    return <p className="text-sm text-slate-500 italic">Chưa có nhóm thuộc tính nào.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đã chọn & sắp xếp</p>
          <span className="text-[11px] text-slate-400">{selectedGroups.length} nhóm</span>
        </div>
        {selectedGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
            Chọn nhóm thuộc tính ở bảng dưới để thêm vào kiểu này.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {selectedGroups.map((group, index) => (
                  <SortableAssignedGroupRow
                    key={group._id}
                    group={group}
                    index={index}
                    onRemove={(groupId) => onChange(selectedIds.filter((id) => id !== groupId))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chưa chọn</p>
          <span className="text-[11px] text-slate-400">{unselectedGroups.length} nhóm</span>
        </div>
        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
          {unselectedGroups.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900/30">Tất cả nhóm đã được gán.</p>
          ) : (
            unselectedGroups.map((group) => {
              const IconComponent = getAttributeIconComponent(group.iconPath);
              const iconColor = group.displayConfig?.iconColor || group.displayConfig?.color || '#ea580c';
              return (
                <label
                  key={group._id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 hover:border-orange-200 hover:text-orange-700 dark:border-slate-800 dark:bg-slate-900/30"
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => onChange([...selectedIds, group._id])}
                    className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <IconComponent size={15} style={{ color: iconColor }} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm">{group.name}</span>
                  <span className="hidden font-mono text-[11px] text-slate-400 sm:inline">{group.code}</span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductTypeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const typeData = useQuery(api.productTypes.getById, { id: id as Id<"productTypes"> });
  const updateType = useMutation(api.productTypes.update);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const masterPriceRangesData = useQuery(api.settings.getValue, { key: 'global_price_ranges', defaultValue: [] });
  const updateSettings = useMutation(api.settings.set);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [attributeGroupIds, setAttributeGroupIds] = useState<Id<"attributeGroups">[]>([]);
  const [categoryIds, setCategoryIds] = useState<Id<"productCategories">[]>([]);
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);

  // Price range temporary states
  const [newRangeLabel, setNewRangeLabel] = useState('');
  const [newRangeSlug, setNewRangeSlug] = useState('');
  const [newRangeMin, setNewRangeMin] = useState('');
  const [newRangeMax, setNewRangeMax] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<{
    name: string;
    slug: string;
    description: string;
    active: boolean;
    attributeGroupIds: Id<"attributeGroups">[];
    categoryIds: Id<"productCategories">[];
    priceRanges: PriceRange[];
  } | null>(null);

  const attributeGroups = useQuery(api.attributeGroups.listAll, {});
  const productCategories = useQuery(api.productCategories.listAll, {});

  const masterPriceRanges = useMemo(() => {
    return (masterPriceRangesData as PriceRange[]) || [];
  }, [masterPriceRangesData]);

  const mergedPriceRanges = useMemo(() => {
    const masterMap = new Map(masterPriceRanges.map(r => [r.slug, r]));
    const result = [...masterPriceRanges];
    priceRanges.forEach(r => {
      if (!masterMap.has(r.slug)) {
        result.push(r);
      }
    });
    return result;
  }, [masterPriceRanges, priceRanges]);
  
  const assignedGroupsData = useQuery(api.productTypes.listAssignedGroups, { typeId: id as Id<"productTypes"> });
  const assignedCategoriesData = useQuery(api.productTypes.listAssignedCategories, { typeId: id as Id<"productTypes"> });

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  useEffect(() => {
    if (typeData) {
      setName(typeData.name);
      setSlug(typeData.slug);
      setDescription(typeData.description ?? '');
      setActive(typeData.active);
      setPriceRanges(typeData.priceRanges ?? []);
    }
  }, [typeData]);

  useEffect(() => {
    if (assignedGroupsData) {
      setAttributeGroupIds(assignedGroupsData.map(g => g._id));
    }
  }, [assignedGroupsData]);

  useEffect(() => {
    if (assignedCategoriesData) {
      setCategoryIds(assignedCategoriesData.map(c => c._id));
    }
  }, [assignedCategoriesData]);

  useEffect(() => {
    if (typeData && assignedGroupsData && assignedCategoriesData) {
      const initialGroups = assignedGroupsData.map(g => g._id);
      const initialCats = assignedCategoriesData.map(c => c._id);
      const initialRanges = typeData.priceRanges ?? [];
      
      setInitialData({
        name: typeData.name,
        slug: typeData.slug,
        description: typeData.description ?? '',
        active: typeData.active,
        attributeGroupIds: initialGroups,
        categoryIds: initialCats,
        priceRanges: initialRanges,
      });
      setHasChanges(false);
    }
  }, [typeData, assignedGroupsData, assignedCategoriesData]);

  const dirtySnapshot = JSON.stringify({
    name,
    slug,
    description,
    active,
    attributeGroupIds,
    categoryIds,
    priceRanges,
    initialData,
  });

  useEffect(() => {
    if (!initialData) return;

    const isGroupsChanged = JSON.stringify(attributeGroupIds) !== JSON.stringify(initialData.attributeGroupIds);
    const isCatsChanged = JSON.stringify([...categoryIds].sort()) !== JSON.stringify([...initialData.categoryIds].sort());
    const isRangesChanged = JSON.stringify([...priceRanges].sort((a,b) => a.slug.localeCompare(b.slug))) !== JSON.stringify([...initialData.priceRanges].sort((a,b) => a.slug.localeCompare(b.slug)));

    const changed = name !== initialData.name
      || slug !== initialData.slug
      || description !== initialData.description
      || active !== initialData.active
      || isGroupsChanged
      || isCatsChanged
      || isRangesChanged;

    setHasChanges(changed);
  }, [dirtySnapshot]);

  useUnsavedGuard(hasChanges);

  const handleRangeLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewRangeLabel(val);
    const generatedSlug = val.toLowerCase()
      .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
      .replaceAll(/[đĐ]/g, "d")
      .replaceAll(/[^a-z0-9\s]/g, '')
      .replaceAll(/\s+/g, '-');
    setNewRangeSlug(generatedSlug);
  };

  const handleTogglePriceRange = (range: PriceRange, checked: boolean) => {
    if (checked) {
      setPriceRanges(prev => {
        if (prev.some(r => r.slug === range.slug)) return prev;
        return [...prev, range];
      });
    } else {
      setPriceRanges(prev => prev.filter(r => r.slug !== range.slug));
    }
  };

  const handleAddPriceRange = async () => {
    if (!newRangeLabel.trim() || !newRangeSlug.trim()) {
      toast.error('Vui lòng nhập tên và slug nấc giá');
      return;
    }
    
    if (masterPriceRanges.some(r => r.slug === newRangeSlug)) {
      toast.error('Slug nấc giá đã tồn tại trong danh sách dùng chung');
      return;
    }

    const min = newRangeMin ? parseFloat(newRangeMin) : undefined;
    const max = newRangeMax ? parseFloat(newRangeMax) : undefined;

    if (min !== undefined && max !== undefined && min >= max) {
      toast.error('Giá tối thiểu phải nhỏ hơn giá tối đa');
      return;
    }

    const newRange: PriceRange = {
      label: newRangeLabel.trim(),
      slug: newRangeSlug.trim(),
      minPrice: min,
      maxPrice: max
    };

    try {
      const updatedMaster = [...masterPriceRanges, newRange];
      await updateSettings({
        group: 'productTypes',
        key: 'global_price_ranges',
        value: updatedMaster
      });

      // Tự động tích chọn local
      setPriceRanges(prev => [...prev, newRange]);
      toast.success('Đã thêm nấc giá mới dùng chung');

      setNewRangeLabel('');
      setNewRangeSlug('');
      setNewRangeMin('');
      setNewRangeMax('');
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật danh sách nấc giá dùng chung');
    }
  };

  const handleRemoveFromMaster = async (slug: string) => {
    try {
      const updatedMaster = masterPriceRanges.filter(r => r.slug !== slug);
      await updateSettings({
        group: 'productTypes',
        key: 'global_price_ranges',
        value: updatedMaster
      });

      // Đồng thời bỏ tích chọn local
      setPriceRanges(prev => prev.filter(r => r.slug !== slug));
      toast.success('Đã xóa nấc giá khỏi danh sách dùng chung');
    } catch (err) {
      console.error(err);
      toast.error('Không thể xóa nấc giá');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {return;}

    setIsSubmitting(true);
    try {
      await updateType({
        active,
        description: description.trim() || undefined,
        id: id as Id<"productTypes">,
        name: name.trim(),
        slug: slug.trim(),
        attributeGroupIds,
        categoryIds,
        priceRanges,
      });

      setInitialData({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        active,
        attributeGroupIds,
        categoryIds,
        priceRanges,
      });
      setHasChanges(false);

      toast.success('Cập nhật kiểu thành công');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể cập nhật kiểu'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (typeData === null) {
    return (
      <div className="text-center py-8 text-slate-500">
        Không tìm thấy kiểu
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa kiểu</h1>
          <Link href="/admin/product-types" className="text-sm text-orange-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Tên kiểu <span className="text-red-500">*</span></Label>
                <CopyableInput
                  value={name} 
                  onChange={(e) =>{  setName(e.target.value); }} 
                  copyLabel="tên kiểu"
                  required 
                  placeholder="Nhập tên kiểu..." 
                  autoFocus 
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input 
                  value={slug} 
                  onChange={(e) =>{  setSlug(e.target.value); }} 
                  placeholder="slug" 
                  className="font-mono text-sm" 
                />
              </div>

              {enabledFields.has('description') && (
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <textarea
                    value={description}
                    onChange={(e) =>{  setDescription(e.target.value); }}
                    placeholder="Mô tả ngắn về kiểu sản phẩm..."
                    className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  value={active ? 'active' : 'inactive'}
                  onChange={(e) =>{  setActive(e.target.value === 'active'); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ẩn</option>
                </select>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Label>Các nhóm thuộc tính (Được gán vào kiểu này)</Label>
                <p className="text-xs text-slate-500">
                  Kéo thả nhóm đã chọn để quyết định thứ tự hiển thị ngoài site. Trang /products và trang chi tiết sản phẩm sẽ ưu tiên hiển thị 4 bộ lọc đầu tiên trong danh sách này.
                </p>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/30">
                  <AssignedAttributeGroupsManager
                    groups={attributeGroups as AttributeGroupItem[] | undefined}
                    selectedIds={attributeGroupIds}
                    onChange={setAttributeGroupIds}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        <div className="space-y-6">
          {/* Gán danh mục sản phẩm */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Danh mục sản phẩm gán vào kiểu này</Label>
                <p className="text-xs text-slate-500">Các danh mục được gán sẽ hoạt động theo liên kết Phân loại & Thuộc tính sản phẩm.</p>
                <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-1 italic font-medium">Lưu ý: Mỗi danh mục chỉ thuộc tối đa một kiểu sản phẩm. Nếu bạn gán một danh mục đã thuộc kiểu sản phẩm khác vào kiểu này, liên kết cũ của danh mục đó sẽ được tự động thay thế bằng kiểu này.</p>
                <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3 max-h-60 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-900/30">
                  {productCategories === undefined ? (
                    <p className="text-sm text-slate-500 italic">Đang tải...</p>
                  ) : productCategories.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Chưa có danh mục sản phẩm nào.</p>
                  ) : (
                    productCategories.map(cat => (
                      <label key={cat._id} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-orange-600">
                        <input
                          type="checkbox"
                          checked={categoryIds.includes(cat._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCategoryIds(prev => [...prev, cat._id]);
                            } else {
                              setCategoryIds(prev => prev.filter(id => id !== cat._id));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className="text-xs text-slate-400 font-mono">({cat.slug})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CRUD Price Ranges */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Các nấc giá bán dùng chung</Label>
                <p className="text-xs text-slate-500">Tích chọn các mức khoảng giá dùng chung để áp dụng cho kiểu sản phẩm này.</p>
                
                {/* List Price Ranges with Checkbox */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800 rounded-md p-2 bg-slate-50/50 dark:bg-slate-900/10">
                  {mergedPriceRanges.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2 text-center">Chưa có nấc giá dùng chung nào. Hãy thêm ở dưới.</p>
                  ) : (
                    mergedPriceRanges.map((range) => {
                      const isChecked = priceRanges.some(r => r.slug === range.slug);
                      const isGlobal = masterPriceRanges.some(r => r.slug === range.slug);
                      return (
                        <div 
                          key={range.slug} 
                          className="flex justify-between items-center p-2 border border-slate-100 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                        >
                          <label className="flex items-start gap-2.5 cursor-pointer flex-1 py-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleTogglePriceRange(range, e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{range.label}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{range.slug}</div>
                              <div className="text-[10px] text-slate-500">
                                {range.minPrice !== undefined && `Từ: ${range.minPrice.toLocaleString()}đ`} 
                                {range.maxPrice !== undefined && ` - Đến: ${range.maxPrice.toLocaleString()}đ`}
                                {range.minPrice === undefined && range.maxPrice === undefined && 'Không giới hạn giá'}
                              </div>
                            </div>
                          </label>
                          {isGlobal && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveFromMaster(range.slug)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Xóa khỏi danh sách dùng chung"
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tạo nấc giá mới dùng chung</Label>
                  <p className="text-[10px] text-slate-400 mb-2">Thêm nấc giá mới vào thư viện dùng chung cho tất cả các kiểu sản phẩm.</p>
                  
                  {/* Form thêm Price Range */}
                  <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Tên nấc giá</Label>
                        <Input 
                          value={newRangeLabel} 
                          onChange={handleRangeLabelChange} 
                          placeholder="VD: Dưới 500k..." 
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Slug</Label>
                        <Input 
                          value={newRangeSlug} 
                          onChange={(e) => setNewRangeSlug(e.target.value)} 
                          placeholder="duoi-500k" 
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Giá tối thiểu (Đồng)</Label>
                        <Input 
                          type="number"
                          value={newRangeMin} 
                          onChange={(e) => setNewRangeMin(e.target.value)} 
                          placeholder="Trống = Không giới hạn" 
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Giá tối đa (Đồng)</Label>
                        <Input 
                          type="number"
                          value={newRangeMax} 
                          onChange={(e) => setNewRangeMax(e.target.value)} 
                          placeholder="Trống = Không giới hạn" 
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleAddPriceRange} 
                      className="w-full h-8 text-xs gap-1"
                    >
                      <Plus size={12} /> Thêm vào danh sách dùng chung
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        
        <HomeComponentStickyFooter isSubmitting={isSubmitting} submitLabel="Lưu thay đổi">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={() => router.push('/admin/product-types')} disabled={isSubmitting}>
                Hủy bỏ
              </Button>
              {slug && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(`/${slug}`, '_blank')}
                  disabled={isSubmitting}
                  className="h-9 w-9 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Mở trang nhóm sản phẩm"
                >
                  <ExternalLink size={16} />
                </Button>
              )}
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Trạng thái</span>
                <div
                  className={cn(
                    'cursor-pointer inline-flex items-center justify-center rounded-full w-10 h-5 transition-colors',
                    active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
                  )}
                  onClick={() => setActive(!active)}
                >
                  <div className={cn(
                    'w-4 h-4 bg-white rounded-full transition-transform shadow',
                    active ? 'translate-x-2' : '-translate-x-2',
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  active ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500',
                )}>
                  {active ? 'Bật' : 'Tắt'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={hasChanges === false || isSubmitting}
                variant="accent"
                className={cn(
                  hasChanges === false && !isSubmitting
                    ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400'
                    : undefined
                )}
              >
                {isSubmitting ? 'Đang lưu...' : hasChanges === false ? 'Đã lưu' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </HomeComponentStickyFooter>
      </form>
    </div>
  );
}
