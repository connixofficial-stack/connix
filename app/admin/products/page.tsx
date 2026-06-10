'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminEntityImage } from '../components/AdminEntityImage';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronDown, Copy, Edit, ExternalLink, Layers, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Popover, PopoverTrigger, PopoverContent, ScrollArea, cn } from '../components/ui';
import { AdminDragHandle, buildOrderUpdates, BulkActionBar, ColumnToggle, ExactSearchToggle, generatePaginationItems, getReorderedItems, SelectCheckbox, SortableHeader, SortableTableRow, useAdminDndSensors, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import { ImportExportModal } from './components/import-modal';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const MODULE_KEY = 'products';
const PAGE_SIZE_OPTIONS = [12, 20, 30, 50, 100];

export default function ProductsListPage() {
  return (
    <ModuleGuard moduleKey="products">
      <ProductsContent />
    </ModuleGuard>
  );
}

function ProductsContent() {
  const categoriesData = useQuery(api.productCategories.listActive);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  
  const deleteProduct = useMutation(api.products.remove);
  const duplicateProduct = useMutation(api.products.duplicate);
  const bulkRemove = useMutation(api.products.bulkRemove);
  const bulkUpdateStatus = useMutation(api.products.bulkUpdateStatus);
  const bulkClearBrokenMedia = useMutation(api.products.bulkClearBrokenMedia);
  const reorderProducts = useMutation(api.products.reorder);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [exactMode, setExactMode] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Id<"productCategories"> | ''>('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredCategories = useMemo(() => {
    if (!categoriesData) return [];
    return categoriesData.filter(c => 
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categoriesData, categorySearch]);
  const [filterStatus, setFilterStatus] = useState<'' | 'Active' | 'Archived' | 'Draft'>('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem('admin_products_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"products">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [cloningProductId, setCloningProductId] = useState<Id<"products"> | null>(null);
  const [bulkStatusLoading, setBulkStatusLoading] = useState<'publish' | 'unpublish' | null>(null);
  const [isClearingBrokenMedia, setIsClearingBrokenMedia] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"products"> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const dndSensors = useAdminDndSensors();

  const isSelectAllActive = selectionMode === 'all';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    if (visibleColumns.length > 0) {
      window.localStorage.setItem('admin_products_visible_columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);


  // Get productsPerPage from module settings
  const productsPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'productsPerPage');
    const value = Number(setting?.value);
    return PAGE_SIZE_OPTIONS.includes(value) ? value : 12;
  }, [settingsData]);

  const [resolvedProductsPerPage, setPageSizeOverride] = usePersistedPageSize('admin_products_page_size', productsPerPage);

  const variantEnabled = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantEnabled');
    return Boolean(setting?.value);
  }, [settingsData]);

  const variantPricing = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantPricing');
    return (setting?.value as string) || 'variant';
  }, [settingsData]);
  const saleMode = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'saleMode');
    const value = setting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [settingsData]);

  const isContactLikeMode = saleMode === 'contact' || saleMode === 'affiliate';

  const offset = (currentPage - 1) * resolvedProductsPerPage;
  const resolvedSearch = debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined;

  const productsData = useQuery(api.products.listAdminWithOffset, {
    limit: resolvedProductsPerPage,
    offset,
    search: resolvedSearch,
    categoryId: filterCategory || undefined,
    status: filterStatus || undefined,
    exactMode,
  });

  const deleteInfo = useQuery(
    api.products.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const totalCountData = useQuery(api.products.countAdmin, {
    search: resolvedSearch,
    categoryId: filterCategory || undefined,
    status: filterStatus || undefined,
    exactMode,
  });

  const selectAllData = useQuery(
    api.products.listAdminIds,
    isSelectAllActive
      ? {
          search: resolvedSearch,
          categoryId: filterCategory || undefined,
          status: filterStatus || undefined,
          exactMode,
        }
      : 'skip'
  );

  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const isTableLoading = productsData === undefined || totalCountData === undefined || categoriesData === undefined || fieldsData === undefined;

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 sản phẩm phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  // Get enabled fields from system config
  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  // Build columns based on enabled fields
  const columns = useMemo(() => {
    const cols = [
      { key: 'select', label: 'Chọn' },
      { key: 'drag', label: 'Kéo', required: true },
      { key: 'name', label: 'Tên sản phẩm', required: true },
    ];

    if (enabledFields.has('image')) {cols.push({ key: 'image', label: 'Ảnh' });}
    if (enabledFields.has('sku')) {cols.push({ key: 'sku', label: 'SKU' });}
    cols.push({ key: 'category', label: 'Danh mục' });
    cols.push({ key: 'price', label: 'Giá bán' });
    if (enabledFields.has('stock')) {cols.push({ key: 'stock', label: 'Tồn kho' });}
    cols.push({ key: 'status', label: 'Trạng thái' });
    cols.push({ key: 'actions', label: 'Hành động', required: true });
    
    return cols;
  }, [enabledFields]);

  // Initialize visible columns when columns change
  useEffect(() => {
    if (columns.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(columns.map(c => c.key));
    }
  }, [columns, visibleColumns.length]);

  // Update visible columns when fields change
  useEffect(() => {
    if (fieldsData !== undefined) {
      setVisibleColumns(prev => {
        const validKeys = new Set(columns.map(c => c.key));
        const requiredKeys = columns.filter(c => c.required).map(c => c.key);
        return Array.from(new Set([...requiredKeys, ...prev.filter(key => validKeys.has(key))]));
      });
    }
  }, [fieldsData, columns]);

  // Build category map for lookup (O(1) instead of O(n))
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesData?.forEach(cat => { map[cat._id] = cat.name; });
    return map;
  }, [categoriesData]);

  const categorySlugMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesData?.forEach(cat => { map[cat._id] = cat.slug; });
    return map;
  }, [categoriesData]);

  const products = useMemo(() => productsData?.map(p => ({
      ...p,
      id: p._id,
      category: categoryMap[p.categoryId] || 'Không có',
    })) || [], [productsData, categoryMap]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const sortedData = useSortableData(products, sortConfig);
  const isReorderEnabled = !resolvedSearch && !filterCategory && !filterStatus && !exactMode && (sortConfig.key === null || sortConfig.key === 'order');

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedProductsPerPage) : 1;
  const paginatedData = sortedData;
  const tableColumnCount = visibleColumns.length;

  const applyManualSelection = (nextIds: Id<"products">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterCategory('');
    setFilterStatus('');
    setExactMode(false);
    setCurrentPage(1);
    setPageSizeOverride(null);
    applyManualSelection([]);
  };

  const handleFilterChange = (type: 'category' | 'status', value: string) => {
    if (type === 'category') {
      setFilterCategory(value as Id<"productCategories"> | '');
    } else {
      setFilterStatus(value as '' | 'Active' | 'Archived' | 'Draft');
    }
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const selectedOnPage = paginatedData.filter(product => selectedIds.includes(product._id));
  const isPageSelected = paginatedData.length > 0 && selectedOnPage.length === paginatedData.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedData.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedData.some(product => product._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedData.forEach(product => next.add(product._id));
    applyManualSelection(Array.from(next));
  };

  const toggleSelectItem = (id: Id<"products">) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const openFrontend = (slug: string, categoryId: string) => {
    const categorySlug = categorySlugMap[categoryId];
    window.open(categorySlug ? `/${categorySlug}/${slug}` : `/products/${slug}`, '_blank');
  };

  const handleDelete = async (id: Id<"products">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteProduct({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa sản phẩm');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Có lỗi khi xóa sản phẩm');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDuplicateProduct = async (id: Id<"products">) => {
    setCloningProductId(id);
    try {
      const result = await duplicateProduct({ id });
      toast.success(`Đã tạo bản sao: ${result.name}`);
    } catch {
      toast.error('Không thể copy sản phẩm');
    } finally {
      setCloningProductId(null);
    }
  };

  const handleBulkStatusUpdate = async (mode: 'publish' | 'unpublish') => {
    const nextStatus = mode === 'publish' ? 'Active' : 'Draft';
    setBulkStatusLoading(mode);
    try {
      const result = await bulkUpdateStatus({ ids: selectedIds, status: nextStatus });
      applyManualSelection([]);
      if (result.updated > 0) {
        toast.success(`Đã cập nhật ${result.updated} sản phẩm${result.skipped > 0 ? `, bỏ qua ${result.skipped} sản phẩm` : ''}`);
      } else {
        toast.info('Không có sản phẩm nào cần cập nhật');
      }
    } catch {
      toast.error('Có lỗi khi cập nhật trạng thái');
    } finally {
      setBulkStatusLoading(null);
    }
  };

  // FIX #10: Add loading state for bulk delete
  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} sản phẩm đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      setIsDeleting(true);
      try {
        const count = await bulkRemove({ ids: selectedIds });
        applyManualSelection([]);
        toast.success(`Đã xóa ${count} sản phẩm`);
      } catch {
        toast.error('Có lỗi khi xóa sản phẩm');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBulkClearBrokenMedia = async () => {
    setIsClearingBrokenMedia(true);
    try {
      const result = await bulkClearBrokenMedia({ ids: selectedIds });
      applyManualSelection([]);
      const cleared = result.clearedPrimary + result.clearedGallery;
      if (cleared > 0) {
        toast.success(`Đã xóa ${cleared} ảnh lỗi trong ${result.updated} sản phẩm`);
      } else {
        toast.info('Không tìm thấy ảnh lỗi trong sản phẩm đã chọn');
      }
    } catch {
      toast.error('Có lỗi khi xóa ảnh lỗi');
    } finally {
      setIsClearingBrokenMedia(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isReorderEnabled) {return;}
    const reordered = getReorderedItems(paginatedData, event.active.id, event.over?.id, product => product._id);
    if (!reordered) {return;}

    try {
      await reorderProducts({
        items: buildOrderUpdates(
          reordered,
          paginatedData.map(product => product.order),
          product => product._id,
          (product) => product.order
        ),
      });
      toast.success('Đã cập nhật thứ tự sản phẩm');
    } catch {
      toast.error('Không thể cập nhật thứ tự sản phẩm');
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  const renderContactPrice = (resolvedPrice: number) => (
    isContactLikeMode && resolvedPrice <= 0
      ? <span className="text-slate-500">Giá liên hệ</span>
      : <span>{formatPrice(resolvedPrice)}</span>
  );

  const getInvalidPriceContext = (product: (typeof products)[number]) => {
    if (variantEnabled && variantPricing === 'variant' && product.hasVariants) {
      const meta = product as typeof product & { hasInvalidVariantComparePrice?: boolean };
      return meta.hasInvalidVariantComparePrice ? { scope: 'variant' as const } : null;
    }
    const salePrice = product.salePrice ?? 0;
    const price = product.price ?? 0;
    if (salePrice > 0 && salePrice <= price) {
      return { scope: 'product' as const };
    }
    return null;
  };

  const invalidPriceCount = useMemo(() =>
    paginatedData.reduce((count, product) => (getInvalidPriceContext(product) ? count + 1 : count), 0),
  [paginatedData, variantEnabled, variantPricing]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sản phẩm</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportExportModal />
          <Link href="/admin/products/create">
            <Button className="gap-2">
              <Plus size={16} /> Thêm sản phẩm
            </Button>
          </Link>
        </div>
      </div>

      <BulkActionBar 
        selectedCount={selectedIds.length} 
        entityLabel="sản phẩm"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedData.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedData.map(product => product._id)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onPublish={() =>{  void handleBulkStatusUpdate('publish'); }}
        onUnpublish={() =>{  void handleBulkStatusUpdate('unpublish'); }}
        isStatusLoading={bulkStatusLoading}
        onClearBrokenMedia={() =>{  void handleBulkClearBrokenMedia(); }}
        isClearBrokenMediaLoading={isClearingBrokenMedia}
        onDelete={handleBulkDelete} 
        onClearSelection={() =>{  applyManualSelection([]); }} 
        isLoading={isDeleting}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder={enabledFields.has('sku') ? "Tìm tên, SKU..." : "Tìm tên sản phẩm..."} 
                  className="pl-9 w-60 text-sm" 
                  value={searchTerm} 
                  onChange={(e) =>{  setSearchTerm(e.target.value); setCurrentPage(1); applyManualSelection([]); }} 
                  title="Gợi ý: Dùng dấu - ở trước từ để loại trừ (ví dụ: -[B])."
                />
              </div>
              <ExactSearchToggle
                checked={exactMode}
                onCheckedChange={(checked) => {
                  setExactMode(checked);
                  setCurrentPage(1);
                  applyManualSelection([]);
                }}
                title="Khớp chính xác từng ký tự (không dùng fuzzy)"
              />
            </div>
            <div className="relative" ref={categoryDropdownRef}>
              <Popover open={isCategoryDropdownOpen} onOpenChange={setIsCategoryDropdownOpen}>
                <PopoverTrigger>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCategoryDropdownOpen}
                    className="h-10 justify-between text-left font-normal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 w-[220px]"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  >
                    <span className="truncate">
                      {filterCategory === ''
                        ? "Tất cả danh mục"
                        : categoriesData?.find(c => c._id === filterCategory)?.name ?? "Tất cả danh mục"}
                    </span>
                    <span className="text-slate-400 text-xs shrink-0 ml-2">▼</span>
                  </Button>
                </PopoverTrigger>
                {isCategoryDropdownOpen && (
                  <PopoverContent className="w-[240px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg z-50" align="start">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <Input
                      placeholder="Tìm danh mục..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="h-8 text-xs w-full bg-slate-50 dark:bg-slate-800 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                  </div>
                  <ScrollArea className="max-h-[200px] overflow-y-auto pr-1 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
                    <button
                      type="button"
                      onClick={() => {
                        handleFilterChange('category', '');
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-2.5 py-1.5 rounded-md text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                        filterCategory === '' ? "bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      Tất cả danh mục
                    </button>
                    {filteredCategories.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy danh mục</p>
                    ) : (
                      filteredCategories.map(c => {
                        const isSelected = filterCategory === c._id;
                        return (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => {
                              handleFilterChange('category', c._id);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-2.5 py-1.5 rounded-md text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                              isSelected ? "bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                            )}
                          >
                            <span className="truncate block">{c.name}</span>
                          </button>
                        );
                      })
                    )}
                  </ScrollArea>
                </PopoverContent>
              )}
              </Popover>
            </div>
            <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterStatus} onChange={(e) =>{  handleFilterChange('status', e.target.value); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Hiện</option>
              <option value="Draft">Ẩn</option>
              <option value="Archived">Lưu trữ</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
          </div>
          <div className="flex items-center gap-2">
            {invalidPriceCount > 0 && (
              <Badge variant="destructive" className="text-[11px]">
                {invalidPriceCount} sản phẩm giá không hợp lệ
              </Badge>
            )}
            <ColumnToggle columns={columns} visibleColumns={visibleColumns} onToggle={toggleColumn} />
          </div>
        </div>
        {!isReorderEnabled && (
          <div className="px-4 py-3 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
            Tắt tìm kiếm/lọc và quay về thứ tự mặc định để kéo thả đổi vị trí.
          </div>
        )}
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              {visibleColumns.includes('select') && <TableHead className="w-[40px]"><SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} /></TableHead>}
              {visibleColumns.includes('drag') && <TableHead className="w-[40px]" />}
              {visibleColumns.includes('image') && <TableHead className="w-[60px]">Ảnh</TableHead>}
              {visibleColumns.includes('name') && <SortableHeader label="Tên sản phẩm" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('sku') && enabledFields.has('sku') && <SortableHeader label="SKU" sortKey="sku" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('category') && <SortableHeader label="Danh mục" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('price') && <SortableHeader label="Giá bán" sortKey="price" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('stock') && enabledFields.has('stock') && <SortableHeader label="Tồn kho" sortKey="stock" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <SortableContext items={paginatedData.map(product => product._id)} strategy={verticalListSortingStrategy}>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: resolvedProductsPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell colSpan={tableColumnCount}>
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {paginatedData.map(product => (
                  <SortableTableRow key={product._id} id={product._id} disabled={!isReorderEnabled} selected={selectedIds.includes(product._id)}>
                    {({ attributes, disabled, listeners }) => (
                      <>
                {visibleColumns.includes('select') && <TableCell><SelectCheckbox checked={selectedIds.includes(product._id)} onChange={() =>{  toggleSelectItem(product._id); }} /></TableCell>}
                {visibleColumns.includes('drag') && (
                  <TableCell className="w-[40px]">
                    <AdminDragHandle attributes={attributes} disabled={disabled} listeners={listeners} />
                  </TableCell>
                )}
                {visibleColumns.includes('image') && (
                  <TableCell>
                    <AdminEntityImage
                      src={product.image}
                      alt={product.name}
                      variant="product"
                      width={40}
                      height={40}
                      className="h-10 w-10"
                    />
                  </TableCell>
                )}
                {visibleColumns.includes('name') && <TableCell className="font-medium max-w-[200px] truncate">{product.name}</TableCell>}
                {visibleColumns.includes('sku') && enabledFields.has('sku') && <TableCell className="font-mono text-xs text-slate-500">{product.sku}</TableCell>}
                {visibleColumns.includes('category') && <TableCell>{product.category}</TableCell>}
                {visibleColumns.includes('price') && (
                  <TableCell>
                    {(() => {
                      const invalidContext = getInvalidPriceContext(product);
                      return (
                        <div>
                          {variantEnabled && variantPricing === 'variant' && product.hasVariants ? (() => {
                            const meta = product as typeof product & {
                              hasPricedActiveVariant?: boolean;
                              variantMinPrice?: number | null;
                            };
                            if (!meta.hasPricedActiveVariant) {
                              return <span className="text-slate-500">Chưa có giá</span>;
                            }
                            const resolvedPrice = meta.variantMinPrice ?? product.price ?? 0;
                            return renderContactPrice(resolvedPrice);
                          })() : (
                            (product.salePrice ?? 0) > (product.price ?? 0) && enabledFields.has('salePrice') ? (
                              <>
                                <span className="text-red-500 font-medium">{formatPrice(product.price ?? 0)}</span>
                                <span className="text-slate-400 line-through text-xs ml-1">{formatPrice(product.salePrice ?? 0)}</span>
                              </>
                            ) : (
                              renderContactPrice(product.price ?? 0)
                            )
                          )}
                          {invalidContext && (
                            <p className="text-xs text-red-500 mt-1">Giá so sánh không hợp lệ</p>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                )}
                {visibleColumns.includes('stock') && enabledFields.has('stock') && <TableCell className={product.stock < 10 ? 'text-red-500 font-medium' : ''}>{product.stock}</TableCell>}
                {visibleColumns.includes('status') && (
                  <TableCell>
                    <Badge variant={product.status === 'Active' ? 'success' : (product.status === 'Draft' ? 'secondary' : 'warning')}>
                      {product.status === 'Active' ? 'Hiện' : (product.status === 'Draft' ? 'Ẩn' : 'Lưu trữ')}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" title="Xem trên web" onClick={() =>{  openFrontend(product.slug, product.categoryId); }}><ExternalLink size={16}/></Button>
                      {variantEnabled && product.hasVariants && (
                        <Link href={`/admin/products/${product._id}/variants`}>
                          <Button variant="ghost" size="icon" title="Quản lý phiên bản"><Layers size={16} /></Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Copy sản phẩm"
                        onClick={() =>{  void handleDuplicateProduct(product._id); }}
                        disabled={cloningProductId === product._id}
                      >
                        {cloningProductId === product._id ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                      </Button>
                      <Link href={`/admin/products/${product._id}/edit`}><Button variant="ghost" size="icon"><Edit size={16}/></Button></Link>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(product._id)}><Trash2 size={16}/></Button>
                    </div>
                  </TableCell>
                )}
                      </>
                    )}
                  </SortableTableRow>
                ))}
              </>
            )}
            {!isTableLoading && paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="text-center py-8 text-slate-500">
                  {searchTerm || filterCategory || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có sản phẩm nào.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </SortableContext>
        </Table>
        </DndContext>
        {totalCount > 0 && !isTableLoading && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 flex w-full items-center justify-between text-sm text-slate-500 sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Hiển thị</span>
                <select
                  value={resolvedProductsPerPage}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số sản phẩm mỗi trang"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>sản phẩm/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedProductsPerPage) + 1 : 0}–{Math.min(currentPage * resolvedProductsPerPage, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">sản phẩm</span>
              </div>
            </div>

            <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
              <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
                <button
                  onClick={() =>{  setCurrentPage((prev) => Math.max(1, prev - 1)); }}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Trang trước"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>

                {generatePaginationItems(currentPage, totalPages).map((item, index) => {
                  if (item === 'ellipsis') {
                    return (
                      <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">
                        …
                      </div>
                    );
                  }

                  const pageNum = item as number;
                  const isActive = pageNum === currentPage;
                  const isMobileHidden = !isActive && pageNum !== 1 && pageNum !== totalPages;

                  return (
                    <button
                      key={pageNum}
                      onClick={() =>{  setCurrentPage(pageNum); }}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-orange-600 text-white shadow-sm border font-medium'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      } ${isMobileHidden ? 'hidden sm:inline-flex' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>{  setCurrentPage((prev) => Math.min(totalPages, prev + 1)); }}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Trang sau"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </Card>
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa sản phẩm"
        itemName={products.find((product) => product.id === deleteTargetId)?.name ?? 'sản phẩm'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
