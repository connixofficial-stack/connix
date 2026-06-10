'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Edit, GripVertical, Layers, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../../../components/ui';
import { BulkActionBar, ColumnToggle, SelectCheckbox, SortableHeader, useSortableData } from '../../../components/TableUtilities';
import { ModuleGuard } from '../../../components/ModuleGuard';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MODULE_KEY = 'products';

interface SortableRowProps {
  editHref: string;
  isDraggingDisabled: boolean;
  isSelected: boolean;
  onDelete: () => void;
  onToggleSelect: () => void;
  optionSummary: string;
  priceDisplay: React.ReactNode;
  sku: string;
  status: 'Active' | 'Inactive';
  stockDisplay: React.ReactNode;
  variantId: Id<'productVariants'>;
  visibleColumns: string[];
}

function SortableRow({
  editHref,
  isDraggingDisabled,
  isSelected,
  onDelete,
  onToggleSelect,
  optionSummary,
  priceDisplay,
  sku,
  status,
  stockDisplay,
  variantId,
  visibleColumns,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: variantId, disabled: isDraggingDisabled });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <TableRow ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-60')}>
      {visibleColumns.includes('select') && (
        <TableCell><SelectCheckbox checked={isSelected} onChange={onToggleSelect} /></TableCell>
      )}
      {visibleColumns.includes('drag') && (
        <TableCell className="w-8">
          <button
            {...attributes}
            {...listeners}
            disabled={isDraggingDisabled}
            className={cn('p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800', isDraggingDisabled && 'cursor-not-allowed opacity-40')}
          >
            <GripVertical size={16} />
          </button>
        </TableCell>
      )}
      {visibleColumns.includes('sku') && <TableCell className="font-mono text-sm">{sku}</TableCell>}
      {visibleColumns.includes('options') && <TableCell className="text-sm text-slate-600">{optionSummary}</TableCell>}
      {visibleColumns.includes('price') && <TableCell>{priceDisplay}</TableCell>}
      {visibleColumns.includes('stock') && <TableCell>{stockDisplay}</TableCell>}
      {visibleColumns.includes('status') && (
        <TableCell>
          <Badge variant={status === 'Active' ? 'default' : 'secondary'}>{status === 'Active' ? 'Hiện' : 'Ẩn'}</Badge>
        </TableCell>
      )}
      {visibleColumns.includes('actions') && (
        <TableCell className="text-right space-x-1">
          <Link href={editHref}>
            <Button variant="ghost" size="icon"><Edit size={16} /></Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

export default function ProductVariantsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ModuleGuard moduleKey="products">
      <ProductVariantsContent params={params} />
    </ModuleGuard>
  );
}

function ProductVariantsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = id as Id<'products'>;

  const productData = useQuery(api.products.getById, { id: productId });
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const optionsData = useQuery(api.productOptions.listActive);
  const valuesData = useQuery(api.productOptionValues.listAll, { limit: 500 });
  const variantsData = useQuery(api.productVariants.listByProduct, { productId });

  const removeVariant = useMutation(api.productVariants.remove);
  const reorderVariants = useMutation(api.productVariants.reorder);
  const bulkUpsertVariants = useMutation(api.productVariants.bulkUpsertFromCombinations);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem(`admin_product_variants_visible_columns_${productId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [selectedIds, setSelectedIds] = useState<Id<'productVariants'>[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [skuPrefix, setSkuPrefix] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [defaultSalePrice, setDefaultSalePrice] = useState('');
  const [defaultStock, setDefaultStock] = useState('');
  const [defaultStatus, setDefaultStatus] = useState<'Active' | 'Inactive'>('Active');
  const [defaultAllowBackorder, setDefaultAllowBackorder] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [rows, setRows] = useState<CombinationRow[]>([]);
  const [selectedValueIdsByOption, setSelectedValueIdsByOption] = useState<Record<string, Set<Id<'productOptionValues'>>>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (productData?.sku && !skuPrefix) {
      setSkuPrefix(productData.sku);
    }
  }, [productData?.sku, skuPrefix]);

  useEffect(() => {
    if (visibleColumns.length > 0) {
      window.localStorage.setItem(`admin_product_variants_visible_columns_${productId}`, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, productId]);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const skuEnabled = enabledFields.has('sku');

  const variantEnabled = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantEnabled');
    return Boolean(setting?.value);
  }, [settingsData]);

  const variantSettings = useMemo(() => {
    const getSetting = (key: string, fallback: string) => {
      const setting = settingsData?.find(s => s.settingKey === key);
      return (setting?.value as string) || fallback;
    };
    return {
      variantImages: getSetting('variantImages', 'inherit'),
      variantPricing: getSetting('variantPricing', 'variant'),
      variantStock: getSetting('variantStock', 'variant'),
    };
  }, [settingsData]);

  const optionsMap = useMemo(() => {
    const map: Record<string, { name: string; order: number }> = {};
    optionsData?.forEach(option => {
      map[option._id] = { name: option.name, order: option.order };
    });
    return map;
  }, [optionsData]);

  const valuesMap = useMemo(() => {
    const map: Record<string, { label: string; optionId: Id<'productOptions'> }> = {};
    valuesData?.forEach(value => {
      map[value._id] = { label: value.label ?? value.value, optionId: value.optionId };
    });
    return map;
  }, [valuesData]);

  const productOptions = useMemo(() => {
    if (!productData?.optionIds || !optionsData) {return [];}
    const optionIdSet = new Set(productData.optionIds);
    return optionsData
      .filter(option => optionIdSet.has(option._id))
      .sort((a, b) => a.order - b.order);
  }, [productData?.optionIds, optionsData]);

  type VariantItem = NonNullable<typeof variantsData>[number];

  const buildOptionSummary = (variant: VariantItem) => {
    const summary = variant.optionValues
      .slice()
      .sort((a, b) => (optionsMap[a.optionId]?.order ?? 0) - (optionsMap[b.optionId]?.order ?? 0))
      .map((item) => {
        const optionName = optionsMap[item.optionId]?.name;
        const valueLabel = item.customValue?.trim() || valuesMap[item.valueId]?.label || 'N/A';
        return optionName ? `${optionName}: ${valueLabel}` : valueLabel;
      })
      .join(' / ');
    return summary || '—';
  };

  const filteredVariants = useMemo(() => {
    let data = variantsData ? [...variantsData] : [];
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      data = data.filter((variant) => {
        if (skuEnabled) {
          return variant.sku.toLowerCase().includes(searchLower);
        }
        const summary = buildOptionSummary(variant).toLowerCase();
        return summary.includes(searchLower);
      });
    }
    if (filterStatus !== 'all') {
      data = data.filter(variant => variant.status === filterStatus);
    }
    return data.sort((a, b) => a.order - b.order);
  }, [variantsData, searchTerm, filterStatus, skuEnabled, optionsMap, valuesMap]);

  type Column = { key: string; label: string; required?: boolean };

  const columns = useMemo(() => {
    const base: Column[] = [
      { key: 'select', label: 'Chọn' },
      { key: 'drag', label: '' },
    ];
    if (skuEnabled) {
      base.push({ key: 'sku', label: 'SKU', required: true });
    }
    base.push(
      { key: 'options', label: 'Tùy chọn' },
      { key: 'price', label: 'Giá bán' },
      { key: 'stock', label: 'Tồn kho' },
      { key: 'status', label: 'Trạng thái' },
      { key: 'actions', label: 'Hành động', required: true }
    );
    return base;
  }, [skuEnabled]);

  useEffect(() => {
    if (columns.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(columns.map(c => c.key));
    }
  }, [columns, visibleColumns.length]);

  useEffect(() => {
    if (!skuEnabled && visibleColumns.includes('sku')) {
      setVisibleColumns(prev => prev.filter(key => key !== 'sku'));
    }
  }, [skuEnabled, visibleColumns]);

  const sortedData = useSortableData(filteredVariants, sortConfig);
  const isReorderEnabled = !searchTerm.trim() && filterStatus === 'all' && (sortConfig.key === 'order' || sortConfig.key === null);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === sortedData.length ? [] : sortedData.map(item => item._id));
  };

  const toggleSelectItem = (variantId: Id<'productVariants'>) => {
    setSelectedIds(prev => prev.includes(variantId) ? prev.filter(id => id !== variantId) : [...prev, variantId]);
  };

  const handleDelete = async (variantId: Id<'productVariants'>) => {
    if (!confirm('Xóa phiên bản này?')) {return;}
    try {
      await removeVariant({ id: variantId });
      setSelectedIds(prev => prev.filter(id => id !== variantId));
      toast.success('Đã xóa phiên bản');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa phiên bản');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {return;}
    if (!confirm(`Xóa ${selectedIds.length} phiên bản đã chọn?`)) {return;}
    setIsDeleting(true);
    try {
      for (const variantId of selectedIds) {
        await removeVariant({ id: variantId });
      }
      setSelectedIds([]);
      toast.success(`Đã xóa ${selectedIds.length} phiên bản`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa phiên bản');
    } finally {
      setIsDeleting(false);
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
      await reorderVariants({ items: reordered.map((item, index) => ({ id: item._id, order: index })) });
      toast.success('Đã cập nhật thứ tự');
    } catch {
      toast.error('Không thể cập nhật thứ tự');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(value);

  const formatNumberHelper = (value: string) => {
    if (!value.trim()) {return null;}
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {return null;}
    return new Intl.NumberFormat('en-US').format(parsed);
  };

  type OptionValue = NonNullable<typeof valuesData>[number];
  type CombinationRow = {
    allowBackorder: boolean;
    custom: {
      allowBackorder: boolean;
      price: boolean;
      salePrice: boolean;
      status: boolean;
      stock: boolean;
    };
    existingVariant?: VariantItem;
    isExisting: boolean;
    key: string;
    label: string;
    optionValues: { optionId: Id<'productOptions'>; valueId: Id<'productOptionValues'> }[];
    price: string;
    salePrice: string;
    selected: boolean;
    status: 'Active' | 'Inactive';
    stock: string;
  };

  const optionValuesByOption = useMemo(() => {
    const map = new Map<string, OptionValue[]>();
    valuesData?.forEach((value) => {
      if (!value.active) {return;}
      const list = map.get(value.optionId) ?? [];
      list.push(value);
      map.set(value.optionId, list);
    });
    return map;
  }, [valuesData]);

  useEffect(() => {
    if (!isGeneratorOpen) {return;}
    const next: Record<string, Set<Id<'productOptionValues'>>> = {};
    productOptions.forEach((option) => {
      const values = optionValuesByOption.get(option._id) ?? [];
      next[option._id] = new Set(values.map((value) => value._id));
    });
    setSelectedValueIdsByOption(next);
  }, [isGeneratorOpen, productOptions, optionValuesByOption]);

  const buildCombinationKey = (optionValues: { optionId: string; valueId: string; customValue?: string }[]) =>
    optionValues
      .slice()
      .sort((a, b) => a.optionId.localeCompare(b.optionId))
      .map((item) => `${item.optionId}:${item.valueId}:${item.customValue ?? ''}`)
      .join('|');

  const buildCombinationLabel = (optionValues: { optionId: Id<'productOptions'>; valueId: Id<'productOptionValues'> }[]) =>
    optionValues
      .slice()
      .sort((a, b) => (optionsMap[a.optionId]?.order ?? 0) - (optionsMap[b.optionId]?.order ?? 0))
      .map((item) => {
        const optionName = optionsMap[item.optionId]?.name;
        const valueLabel = valuesMap[item.valueId]?.label ?? 'N/A';
        return optionName ? `${optionName}: ${valueLabel}` : valueLabel;
      })
      .join(' / ');

  const combinations = useMemo(() => {
    const combos: { optionId: Id<'productOptions'>; valueId: Id<'productOptionValues'> }[][] = [[]];
    for (const option of productOptions) {
      const values = optionValuesByOption.get(option._id) ?? [];
      const selectedSet = selectedValueIdsByOption[option._id] ?? new Set(values.map((value) => value._id));
      const filteredValues = values.filter((value) => selectedSet.has(value._id));
      if (filteredValues.length === 0) {
        return [];
      }
      const next: typeof combos = [];
      combos.forEach((combo) => {
        filteredValues.forEach((value) => {
          next.push([...combo, { optionId: option._id, valueId: value._id }]);
        });
      });
      combos.splice(0, combos.length, ...next);
    }
    return combos;
  }, [productOptions, optionValuesByOption, selectedValueIdsByOption]);

  const optionValueSelections = useMemo(() =>
    productOptions.map((option) => {
      const values = optionValuesByOption.get(option._id) ?? [];
      const selectedSet = selectedValueIdsByOption[option._id] ?? new Set(values.map((value) => value._id));
      const selectedValues = values.filter((value) => selectedSet.has(value._id));
      return {
        option,
        values,
        selectedSet,
        selectedValues,
      };
    }),
  [productOptions, optionValuesByOption, selectedValueIdsByOption]);

  const hasEmptySelection = optionValueSelections.some((item) => item.values.length > 0 && item.selectedValues.length === 0);
  const filterSummary = optionValueSelections
    .filter((item) => item.values.length > 0)
    .map((item) => `${item.selectedValues.length} ${item.option.name}`)
    .join(' × ');

  const existingCombinationMap = useMemo(() => {
    const map = new Map<string, VariantItem>();
    (variantsData ?? []).forEach((variant) => {
      map.set(buildCombinationKey(variant.optionValues), variant);
    });
    return map;
  }, [variantsData]);

  useEffect(() => {
    if (!isGeneratorOpen) {return;}
    const nextRows = combinations.map((combo) => {
      const key = buildCombinationKey(combo);
      const existing = existingCombinationMap.get(key);
      const isExisting = Boolean(existing);
      return {
        allowBackorder: isExisting ? Boolean(existing?.allowBackorder) : defaultAllowBackorder,
        custom: {
          allowBackorder: isExisting,
          price: isExisting,
          salePrice: isExisting,
          status: isExisting,
          stock: isExisting,
        },
        existingVariant: existing,
        isExisting,
        key,
        label: buildCombinationLabel(combo),
        optionValues: combo,
        price: isExisting && existing?.price != null ? String(existing.price) : defaultPrice,
        salePrice: isExisting && existing?.salePrice != null ? String(existing.salePrice) : defaultSalePrice,
        selected: !isExisting,
        status: isExisting ? existing!.status : defaultStatus,
        stock: isExisting && existing?.stock != null ? String(existing.stock) : defaultStock,
      } satisfies CombinationRow;
    });
    setRows(nextRows);
  }, [isGeneratorOpen, combinations, existingCombinationMap, defaultAllowBackorder, defaultPrice, defaultSalePrice, defaultStatus, defaultStock]);

  useEffect(() => {
    if (!isGeneratorOpen) {return;}
    setRows((prev) => prev.map((row) => {
      if (row.isExisting) {
        return overwriteExisting ? { ...row, selected: true } : { ...row, selected: false };
      }
      return row;
    }));
  }, [overwriteExisting, isGeneratorOpen]);

  useEffect(() => {
    if (!isGeneratorOpen) {return;}
    setRows((prev) => prev.map((row) => {
      if (row.isExisting) {return row;}
      return {
        ...row,
        allowBackorder: row.custom.allowBackorder ? row.allowBackorder : defaultAllowBackorder,
        price: row.custom.price ? row.price : defaultPrice,
        salePrice: row.custom.salePrice ? row.salePrice : defaultSalePrice,
        status: row.custom.status ? row.status : defaultStatus,
        stock: row.custom.stock ? row.stock : defaultStock,
      };
    }));
  }, [defaultAllowBackorder, defaultPrice, defaultSalePrice, defaultStatus, defaultStock, isGeneratorOpen]);

  const toggleOptionValue = (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) => {
    setSelectedValueIdsByOption((prev) => {
      const next = { ...prev };
      const current = new Set(next[optionId] ?? []);
      if (current.has(valueId)) {
        current.delete(valueId);
      } else {
        current.add(valueId);
      }
      next[optionId] = current;
      return next;
    });
  };

  const selectAllOptionValues = (optionId: Id<'productOptions'>, values: OptionValue[]) => {
    setSelectedValueIdsByOption((prev) => ({
      ...prev,
      [optionId]: new Set(values.map((value) => value._id)),
    }));
  };

  const clearOptionValues = (optionId: Id<'productOptions'>) => {
    setSelectedValueIdsByOption((prev) => ({
      ...prev,
      [optionId]: new Set<Id<'productOptionValues'>>(),
    }));
  };

  const updateRow = (index: number, updater: (row: CombinationRow) => CombinationRow) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? updater(row) : row)));
  };

  const handleSelectAll = () => {
    setRows((prev) => prev.map((row) => {
      if (row.isExisting && !overwriteExisting) {
        return { ...row, selected: false };
      }
      return { ...row, selected: true };
    }));
  };

  const handleClearAll = () => {
    setRows((prev) => prev.map((row) => ({ ...row, selected: false })));
  };

  const handleSelectNewOnly = () => {
    setRows((prev) => prev.map((row) => ({ ...row, selected: !row.isExisting })));
  };

  const hasInvalidPrices = useMemo(() => (
    rows.some((row) => {
      if (!row.selected) {return false;}
      if (!row.salePrice) {return false;}
      const parsedSalePrice = Number(row.salePrice);
      if (!Number.isFinite(parsedSalePrice) || parsedSalePrice <= 0) {return false;}
      if (!row.price || Number(row.price) <= 0) {return true;}
      return parsedSalePrice <= Number(row.price);
    })
  ), [rows]);

  const selectionSummary = useMemo(() => {
    const total = rows.length;
    const selected = rows.filter((row) => row.selected).length;
    const created = rows.filter((row) => row.selected && !row.isExisting).length;
    const updated = rows.filter((row) => row.selected && row.isExisting).length;
    return { total, selected, created, skipped: total - selected, updated };
  }, [rows]);

  const handleGenerate = async () => {
    if (skuEnabled && !skuPrefix.trim()) {
      toast.error('Vui lòng nhập SKU prefix');
      return;
    }
    if (productOptions.length === 0) {
      toast.error('Sản phẩm chưa có tùy chọn nào');
      return;
    }
    if (combinations.length === 0) {
      toast.error('Vui lòng chọn ít nhất một giá trị cho mỗi tùy chọn');
      return;
    }
    const selectedRows = rows.filter((row) => row.selected && (!row.isExisting || overwriteExisting));
    if (selectedRows.length === 0) {
      toast.info('Chưa chọn phiên bản cần tạo');
      return;
    }
    if (hasInvalidPrices) {
      toast.error('Giá so sánh phải lớn hơn giá bán');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await bulkUpsertVariants({
        overwriteExisting,
        productId,
        rows: rows.map((row) => ({
          allowBackorder: variantSettings.variantStock === 'variant' ? row.allowBackorder : undefined,
          optionValues: row.optionValues,
          price: variantSettings.variantPricing === 'variant' && row.price.trim() !== '' ? Number.parseInt(row.price) : undefined,
          salePrice: variantSettings.variantPricing === 'variant' && row.salePrice.trim() !== '' ? Number.parseInt(row.salePrice) : undefined,
          selected: row.selected && (!row.isExisting || overwriteExisting),
          status: row.status,
          stock: variantSettings.variantStock === 'variant' && row.stock.trim() !== '' ? Number.parseInt(row.stock) : undefined,
        })),
        skuEnabled,
        skuPrefix: skuEnabled ? skuPrefix.trim() : undefined,
      });

      const baseMessage = `Tạo mới ${result.created}, ghi đè ${result.updated}, bỏ qua ${result.skipped}`;
      if (result.errors.length > 0) {
        toast.error(`${baseMessage}. Lỗi ${result.errors.length} dòng.`);
      } else {
        toast.success(baseMessage);
      }
      setIsGeneratorOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo phiên bản');
    } finally {
      setIsGenerating(false);
    }
  };

  if (productData === undefined || fieldsData === undefined || settingsData === undefined || optionsData === undefined || valuesData === undefined || variantsData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!productData) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy sản phẩm</div>;
  }

  if (!variantEnabled) {
    return (
      <div className="text-center py-10 text-slate-500 space-y-2">
        <p>Tính năng phiên bản đang tắt. Vui lòng liên hệ quản trị viên để bật tính năng này.</p>
      </div>
    );
  }

  if (!productData.hasVariants || productData.optionIds?.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 space-y-2">
        <p>Sản phẩm chưa bật phiên bản hoặc chưa chọn tùy chọn.</p>
        <Link href={`/admin/products/${productId}/edit`} className="text-orange-600 hover:underline">Cập nhật sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Layers className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Phiên bản sản phẩm</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{productData.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() =>{  setIsGeneratorOpen(true); }}>Tạo nhanh</Button>
          <Link href={`/admin/products/${productId}/variants/create`}>
            <Button className="gap-2" variant="accent"><Plus size={16} /> Thêm phiên bản</Button>
          </Link>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="phiên bản"
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  setSelectedIds([]); }}
        isLoading={isDeleting}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative max-w-xs flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={skuEnabled ? "Tìm theo SKU..." : "Tìm theo tùy chọn..."}
                className="pl-9"
                value={searchTerm}
                onChange={(e) =>{  setSearchTerm(e.target.value); }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) =>{  setFilterStatus(e.target.value as 'all' | 'Active' | 'Inactive'); }}
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Active">Hiện</option>
              <option value="Inactive">Ẩn</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ColumnToggle columns={columns} visibleColumns={visibleColumns} onToggle={toggleColumn} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.includes('select') && (
                    <TableHead className="w-[40px]"><SelectCheckbox checked={selectedIds.length === sortedData.length && sortedData.length > 0} onChange={toggleSelectAll} indeterminate={selectedIds.length > 0 && selectedIds.length < sortedData.length} /></TableHead>
                  )}
                  {visibleColumns.includes('drag') && <TableHead className="w-[40px]" />}
                  {visibleColumns.includes('sku') && <SortableHeader label="SKU" sortKey="sku" sortConfig={sortConfig} onSort={(key) =>{  setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />}
                  {visibleColumns.includes('options') && <TableHead>Tùy chọn</TableHead>}
                  {visibleColumns.includes('price') && <SortableHeader label="Giá bán" sortKey="price" sortConfig={sortConfig} onSort={(key) =>{  setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />}
                  {visibleColumns.includes('stock') && <SortableHeader label="Tồn kho" sortKey="stock" sortConfig={sortConfig} onSort={(key) =>{  setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />}
                  {visibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={(key) =>{  setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key })); }} />}
                  {visibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext items={sortedData.map(item => item._id)} strategy={verticalListSortingStrategy}>
                  {sortedData.map(variant => (
                    <SortableRow
                      key={variant._id}
                      editHref={`/admin/products/${productId}/variants/${variant._id}/edit`}
                      isDraggingDisabled={!isReorderEnabled}
                      isSelected={selectedIds.includes(variant._id)}
                      onDelete={() =>{  void handleDelete(variant._id); }}
                      onToggleSelect={() =>{  toggleSelectItem(variant._id); }}
                      optionSummary={buildOptionSummary(variant)}
                      priceDisplay={
                        variantSettings.variantPricing === 'product'
                          ? (
                            (productData.salePrice ?? 0) > (productData.price ?? 0)
                              ? (
                                <div>
                                  <span className="text-red-500 font-medium">{formatPrice(productData.price ?? 0)}</span>
                                  <span className="text-slate-400 line-through text-xs ml-1">{formatPrice(productData.salePrice ?? 0)}</span>
                                </div>
                              )
                              : formatPrice(productData.price ?? 0)
                          )
                          : (
                            (variant.salePrice ?? 0) > (variant.price ?? 0)
                              ? (
                                <div>
                                  <span className="text-red-500 font-medium">{formatPrice(variant.price ?? 0)}</span>
                                  <span className="text-slate-400 line-through text-xs ml-1">{formatPrice(variant.salePrice ?? 0)}</span>
                                </div>
                              )
                              : formatPrice(variant.price ?? 0)
                          )
                      }
                      sku={variant.sku}
                      status={variant.status}
                      stockDisplay={variantSettings.variantStock === 'product' ? productData.stock : (variant.stock ?? 0)}
                      variantId={variant._id}
                      visibleColumns={visibleColumns}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>

        {sortedData.length === 0 && (
          <div className="text-center py-10 text-slate-500">Chưa có phiên bản nào</div>
        )}
      </Card>

      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() =>{  if (!isGenerating) {setIsGeneratorOpen(false);} }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-6xl mx-4 p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tạo nhanh phiên bản</h3>
                <p className="text-xs text-slate-500">Tổng tổ hợp: {selectionSummary.total} · Đã chọn: {selectionSummary.selected} · Mới: {selectionSummary.created} · Ghi đè: {selectionSummary.updated} · Bỏ qua: {selectionSummary.skipped}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() =>{  if (!isGenerating) {setIsGeneratorOpen(false);} }}>×</Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                {skuEnabled && (
                  <div className="space-y-2">
                    <Label>SKU prefix</Label>
                    <Input value={skuPrefix} onChange={(e) =>{  setSkuPrefix(e.target.value); }} placeholder="VD: PROD-RED" />
                  </div>
                )}
                {variantSettings.variantPricing === 'variant' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Giá bán</Label>
                      <Input type="number" value={defaultPrice} onChange={(e) =>{  setDefaultPrice(e.target.value); }} placeholder="0" min="0" />
                      {formatNumberHelper(defaultPrice) && (
                        <p className="text-[11px] text-slate-500">{formatNumberHelper(defaultPrice)}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Giá so sánh (trước giảm)</Label>
                      <Input type="number" value={defaultSalePrice} onChange={(e) =>{  setDefaultSalePrice(e.target.value); }} placeholder="Để trống nếu không KM" min="0" />
                      {formatNumberHelper(defaultSalePrice) && (
                        <p className="text-[11px] text-slate-500">{formatNumberHelper(defaultSalePrice)}</p>
                      )}
                    </div>
                  </div>
                )}
                {variantSettings.variantStock === 'variant' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tồn kho</Label>
                      <Input type="number" value={defaultStock} onChange={(e) =>{  setDefaultStock(e.target.value); }} placeholder="0" min="0" />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        id="bulk-allow-backorder"
                        checked={defaultAllowBackorder}
                        onChange={(e) =>{  setDefaultAllowBackorder(e.target.checked); }}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <Label htmlFor="bulk-allow-backorder" className="cursor-pointer">Cho phép đặt hàng khi hết</Label>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Trạng thái mặc định</Label>
                  <select
                    value={defaultStatus}
                    onChange={(e) =>{  setDefaultStatus(e.target.value as 'Active' | 'Inactive'); }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="Active">Hiện</option>
                    <option value="Inactive">Ẩn</option>
                  </select>
                </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bulk-overwrite"
                      checked={overwriteExisting}
                      onChange={(e) =>{  setOverwriteExisting(e.target.checked); }}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <Label htmlFor="bulk-overwrite" className="cursor-pointer">Ghi đè phiên bản đã có</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>Chọn tất cả</Button>
                    <Button variant="outline" size="sm" onClick={handleClearAll}>Bỏ chọn tất cả</Button>
                    <Button variant="outline" size="sm" onClick={handleSelectNewOnly}>Chỉ chọn phiên bản mới</Button>
                  </div>
                  {hasInvalidPrices && (
                    <p className="text-xs text-red-500">Giá so sánh phải lớn hơn giá bán.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Chọn giá trị để sinh tổ hợp</p>
                    {filterSummary && (
                      <p className="text-xs text-slate-500">Đang lọc: {filterSummary}</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Đổi bộ lọc sẽ làm mới danh sách tổ hợp.</p>
                </div>
                {hasEmptySelection && (
                  <p className="text-xs text-red-500">Vui lòng chọn ít nhất 1 giá trị cho mỗi tùy chọn.</p>
                )}
                <div className="space-y-3">
                  {optionValueSelections.map((item) => (
                    <div key={item.option._id} className="rounded-md border border-slate-200 dark:border-slate-700 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{item.option.name}</span>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Đã chọn {item.selectedValues.length}/{item.values.length}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => selectAllOptionValues(item.option._id, item.values)}
                          >
                            Chọn tất cả
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => clearOptionValues(item.option._id)}
                          >
                            Bỏ chọn
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {item.values.map((value) => {
                          const label = value.label ?? value.value ?? 'N/A';
                          const isSelected = item.selectedSet.has(value._id);
                          return (
                            <label
                              key={value._id}
                              title={label}
                              className={cn(
                                'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                                isSelected
                                  ? 'border-orange-500/50 bg-orange-500/10 text-slate-900 dark:text-slate-100'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500'
                              )}
                            >
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300"
                                checked={isSelected}
                                onChange={() => toggleOptionValue(item.option._id, value._id)}
                              />
                              <span className="truncate">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[420px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                      <TableRow>
                        <TableHead className="w-[40px]" />
                        <TableHead className="min-w-[220px]">Tổ hợp</TableHead>
                        <TableHead className="min-w-[120px]">Hiện có</TableHead>
                        {variantSettings.variantPricing === 'variant' && (
                          <>
                            <TableHead className="min-w-[140px]">Giá bán</TableHead>
                            <TableHead className="min-w-[170px]">Giá so sánh (trước giảm)</TableHead>
                          </>
                        )}
                        {variantSettings.variantStock === 'variant' && (
                          <>
                            <TableHead className="min-w-[120px]">Tồn kho</TableHead>
                            <TableHead className="min-w-[160px]">Đặt trước</TableHead>
                          </>
                        )}
                        <TableHead className="min-w-[120px]">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, index) => {
                        const isDisabled = row.isExisting && !overwriteExisting;
                        const priceHelper = formatNumberHelper(row.price);
                        const salePriceHelper = formatNumberHelper(row.salePrice);
                        return (
                          <TableRow key={row.key} className={isDisabled ? 'opacity-60' : ''}>
                            <TableCell>
                              <SelectCheckbox
                                checked={row.selected}
                                onChange={() => updateRow(index, (current) => ({ ...current, selected: !current.selected }))}
                                disabled={isDisabled}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{row.label}</p>
                                {row.isExisting ? (
                                  <Badge variant="secondary">Đã có{overwriteExisting ? ' (sẽ ghi đè)' : ''}</Badge>
                                ) : (
                                  <Badge variant="default">Mới</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-500">{row.isExisting ? 'Đã có dữ liệu' : 'Chưa tạo'}</span>
                            </TableCell>
                            {variantSettings.variantPricing === 'variant' && (
                              <>
                                <TableCell>
                                  <div className="space-y-1">
                                    <Input
                                      type="number"
                                      value={row.price}
                                      min="0"
                                      disabled={isDisabled}
                                      onChange={(e) => updateRow(index, (current) => ({
                                        ...current,
                                        price: e.target.value,
                                        custom: { ...current.custom, price: true },
                                      }))}
                                    />
                                    {priceHelper && (
                                      <p className="text-[11px] text-slate-500">{priceHelper}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <Input
                                      type="number"
                                      value={row.salePrice}
                                      min="0"
                                      disabled={isDisabled}
                                      onChange={(e) => updateRow(index, (current) => ({
                                        ...current,
                                        salePrice: e.target.value,
                                        custom: { ...current.custom, salePrice: true },
                                      }))}
                                    />
                                    {salePriceHelper && (
                                      <p className="text-[11px] text-slate-500">{salePriceHelper}</p>
                                    )}
                                  </div>
                                </TableCell>
                              </>
                            )}
                            {variantSettings.variantStock === 'variant' && (
                              <>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={row.stock}
                                    min="0"
                                    disabled={isDisabled}
                                    onChange={(e) => updateRow(index, (current) => ({
                                      ...current,
                                      stock: e.target.value,
                                      custom: { ...current.custom, stock: true },
                                    }))}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={row.allowBackorder}
                                      disabled={isDisabled}
                                      onChange={(e) => updateRow(index, (current) => ({
                                        ...current,
                                        allowBackorder: e.target.checked,
                                        custom: { ...current.custom, allowBackorder: true },
                                      }))}
                                      className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <span className="text-xs text-slate-600">Cho đặt trước</span>
                                  </div>
                                </TableCell>
                              </>
                            )}
                            <TableCell>
                              <select
                                value={row.status}
                                disabled={isDisabled}
                                onChange={(e) => updateRow(index, (current) => ({
                                  ...current,
                                  status: e.target.value as 'Active' | 'Inactive',
                                  custom: { ...current.custom, status: true },
                                }))}
                                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
                              >
                                <option value="Active">Hiện</option>
                                <option value="Inactive">Ẩn</option>
                              </select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() =>{  if (!isGenerating) {setIsGeneratorOpen(false);} }}>Hủy</Button>
              <Button variant="accent" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating && <Loader2 size={16} className="animate-spin mr-2" />}
                Tạo phiên bản
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
