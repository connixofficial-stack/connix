'use client';

import React, { useState, useMemo } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { Check, GripVertical, Layers, Package, Plus, RotateCcw, Search, X } from 'lucide-react';
import { useDemoItemList } from '../../_shared/hooks/useDemoItemList';
import { DemoItemRowShell } from '../../_shared/components/DemoItemRowShell';
import { DemoPrimaryFields } from '../../_shared/components/DemoPrimaryFields';
import { Button, Input, Label, cn, Popover, PopoverTrigger, PopoverContent, ScrollArea, Checkbox } from '../../../components/ui';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';
import type { ProductGridSortBy, ProductGridSelectionMode } from '../_types';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { DemoProductItem, ProductListCardRadius } from '../../product-list/_types';
import { AiDemoProductsImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

import { DEFAULT_GRID_DEMO_PRODUCTS } from '../_lib/constants';

export const DEFAULT_DEMO_PRODUCTS: DemoProductItem[] = DEFAULT_GRID_DEMO_PRODUCTS;

export interface ProductGridProductItem {
  _id: string;
  name: string;
  slug?: string | null;
  image?: string | null;
  price?: number | null;
  salePrice?: number | null;
  hasVariants?: boolean;
  categoryId?: string; // Bổ sung để hỗ trợ đếm và lọc danh mục
  stock?: number;      // Bổ sung để check hết hàng
}

export interface CategoryTabItem {
  _id: string;
  name: string;
  image?: string;
  active: boolean;
}

export const ProductGridForm = ({
  setItemCount,
  desktopRows = 2,
  setDesktopRows,
  sortBy,
  setSortBy,
  selectionMode,
  setSelectionMode,
  selectedProductIds,
  setSelectedProductIds,
  productSearchTerm,
  setProductSearchTerm,
  selectedProducts,
  filteredProducts,
  allActiveProducts, // Danh sách tất cả sản phẩm Active đầy đủ để đếm
  isLoading,
  demoProducts,
  setDemoProducts,
  categoryTabIds,
  setCategoryTabIds,
  allCategories,
  desktopColumns = 4,
  onDesktopColumnsChange,
  spacing,
  setSpacing,
  cardRadius,
  setCardRadius,
  defaultExpanded = true,
  className,
  showAddToCartButton,
  setShowAddToCartButton,
  showBuyNowButton,
  setShowBuyNowButton,
  cartButtonsLayout,
  setCartButtonsLayout,
  categoryProductCountsMap, // Nhận map đếm số lượng từ DB
}: {
  itemCount: number;
  setItemCount: (value: number) => void;
  desktopRows?: number;
  setDesktopRows?: (value: number) => void;
  sortBy: ProductGridSortBy;
  setSortBy: (value: ProductGridSortBy) => void;
  selectionMode: ProductGridSelectionMode;
  setSelectionMode: (value: ProductGridSelectionMode) => void;
  selectedProductIds: string[];
  setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>;
  productSearchTerm: string;
  setProductSearchTerm: (value: string) => void;
  selectedProducts: ProductGridProductItem[];
  filteredProducts: ProductGridProductItem[];
  allActiveProducts?: ProductGridProductItem[];
  isLoading: boolean;
  demoProducts: DemoProductItem[];
  setDemoProducts: React.Dispatch<React.SetStateAction<DemoProductItem[]>>;
  categoryTabIds: string[];
  setCategoryTabIds: React.Dispatch<React.SetStateAction<string[]>>;
  allCategories?: CategoryTabItem[];
  categoryProductCountsMap?: Record<string, number>;
  desktopColumns?: 3 | 4 | 5 | 6;
  onDesktopColumnsChange?: (cols: 3 | 4 | 5 | 6) => void;
  spacing?: SectionSpacing;
  setSpacing?: (value: SectionSpacing) => void;
  cardRadius?: ProductListCardRadius;
  setCardRadius?: (value: ProductListCardRadius) => void;
  defaultExpanded?: boolean;
  className?: string;
  showAddToCartButton?: boolean;
  setShowAddToCartButton?: (value: boolean) => void;
  showBuyNowButton?: boolean;
  setShowBuyNowButton?: (value: boolean) => void;
  cartButtonsLayout?: 'stack' | 'grid-2';
  setCartButtonsLayout?: (value: 'stack' | 'grid-2') => void;
}) => {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['settings', 'columns', 'source'],
    defaultExpanded
  );

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  const selectedCategories = useMemo(() => {
    if (!allCategories) return [];
    return categoryTabIds.map(id => allCategories.find(c => c._id === id)).filter(Boolean) as CategoryTabItem[];
  }, [allCategories, categoryTabIds]);

  const { add: addDemoProduct, update: updateDemoProduct, remove: removeDemoProduct, loadDefault: loadDefaultDemo } = useDemoItemList(
    demoProducts,
    setDemoProducts,
    {
      createEmpty: () => ({ name: '', image: '', price: '', originalPrice: '', description: '', category: '', tag: '' as const, link: '' }),
      defaults: DEFAULT_DEMO_PRODUCTS,
    },
  );

  // Đếm số lượng sản phẩm Active của từng danh mục một cách chính xác
  const categoryProductCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (categoryProductCountsMap) {
      Object.entries(categoryProductCountsMap).forEach(([catId, count]) => {
        counts.set(catId, count);
      });
      return counts;
    }
    const source = allActiveProducts || filteredProducts;
    if (!source) return counts;
    source.forEach(p => {
      if (p.categoryId) {
        counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
      }
    });
    return counts;
  }, [categoryProductCountsMap, allActiveProducts, filteredProducts]);

  // Sắp xếp danh mục từ nhiều sản phẩm Active nhất xuống ít nhất
  const sortedCategories = useMemo(() => {
    if (!allCategories) return [];
    return [...allCategories]
      .filter(cat => cat.active)
      .sort((a, b) => {
        const countA = categoryProductCounts.get(a._id) ?? 0;
        const countB = categoryProductCounts.get(b._id) ?? 0;
        return countB - countA;
      });
  }, [allCategories, categoryProductCounts]);

  const filteredCategories = useMemo(() => {
    if (!sortedCategories) return [];
    return sortedCategories.filter(cat => 
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [sortedCategories, categorySearch]);

  // Bộ lọc sản phẩm thủ công theo danh mục chọn nhanh
  const finalFilteredProducts = useMemo(() => {
    if (!filteredProducts) return [];
    return filteredProducts.filter(p => selectedCategoryFilter === 'all' || p.categoryId === selectedCategoryFilter);
  }, [filteredProducts, selectedCategoryFilter]);

  // Cập nhật itemCount khi thay đổi số hàng hoặc số cột
  const handleColumnsChange = (cols: 3 | 4 | 5 | 6) => {
    if (onDesktopColumnsChange) {
      onDesktopColumnsChange(cols);
    }
    setItemCount(cols * desktopRows);
  };

  const handleRowsChange = (rows: number) => {
    if (setDesktopRows) {
      setDesktopRows(rows);
    }
    setItemCount(desktopColumns * rows);
  };

  return (
    <div className={cn('mb-6', className)}>
      <AiDemoProductsImport onApply={setDemoProducts} />
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
      <div className="space-y-3">
      {spacing && setSpacing && cardRadius && setCardRadius ? (
        <HomeComponentDisplaySettingsSection
            open={openSections.settings}
            onOpenChange={(open) => toggleSection('settings', open)}
            cornerRadius={cardRadius}
            onCornerRadiusChange={setCardRadius}
            spacing={spacing}
            onSpacingChange={setSpacing}
        >
          {setShowAddToCartButton && setShowBuyNowButton && setCartButtonsLayout && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Hiển thị nút Thêm vào giỏ</Label>
                  <p className="text-xs text-slate-500">Cho phép khách hàng thêm nhanh sản phẩm vào giỏ</p>
                </div>
                <input
                  type="checkbox"
                  checked={showAddToCartButton ?? true}
                  onChange={(e) => setShowAddToCartButton(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Hiển thị nút Mua ngay</Label>
                  <p className="text-xs text-slate-500">Khách hàng có thể nhấn mua và đi thẳng tới trang checkout</p>
                </div>
                <input
                  type="checkbox"
                  checked={showBuyNowButton ?? true}
                  onChange={(e) => setShowBuyNowButton(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {(showAddToCartButton ?? true) && (showBuyNowButton ?? true) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Bố cục nút hiển thị</Label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    value={cartButtonsLayout ?? 'stack'}
                    onChange={(e) => setCartButtonsLayout(e.target.value as 'stack' | 'grid-2')}
                  >
                    <option value="stack">Xếp dọc (Stack)</option>
                    <option value="grid-2">Xếp ngang (Grid 2)</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </HomeComponentDisplaySettingsSection>
      ) : null}

      {/* ── Bố cục hiển thị (Lưới & Số lượng) ── */}
      {onDesktopColumnsChange && setDesktopRows && (
        <div>
          <SubSection
            icon={Layers}
            title="Bố cục hiển thị (Lưới & Số lượng)"
            open={openSections.columns}
            onOpenChange={(open) => toggleSection('columns', open)}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Số cột trên Desktop</Label>
                <div className="grid grid-cols-4 gap-2">
                  {([3, 4, 5, 6] as const).map((option) => {
                    const selected = desktopColumns === option;
                    const info = option === 3 ? 'Tablet 3 · Mobile 1' : option === 4 ? 'Tablet 2 · Mobile 2' : option === 5 ? 'Tablet 3 · Mobile 2' : 'Tablet 3 · Mobile 3';
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleColumnsChange(option)}
                        className={cn(
                          'py-2 rounded-md border text-xs transition-colors text-center',
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                        )}
                      >
                        <div className="font-semibold">{option} cột</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{info}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Số dòng hiển thị</Label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    value={desktopRows}
                    onChange={(e) => handleRowsChange(Number.parseInt(e.target.value) || 2)}
                  >
                    {[1, 2, 3, 4, 5].map(rowVal => (
                      <option key={rowVal} value={rowVal}>{rowVal} dòng</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <Label className="text-xs text-slate-400">Số lượng hiển thị tối đa</Label>
                  <div className="h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-semibold flex items-center">
                    {desktopColumns * desktopRows} sản phẩm ({desktopColumns} cột × {desktopRows} dòng)
                  </div>
                </div>
              </div>
            </div>
          </SubSection>
        </div>
      )}

      {/* ── Nguồn dữ liệu & Tab danh mục ── */}
      <div>
        <SubSection
          icon={Package}
          title="Nguồn dữ liệu & Tab danh mục"
          open={openSections.source}
          onOpenChange={(open) => toggleSection('source', open)}
        >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Chế độ hiển thị chính</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectionMode('category')}
                className={cn(
                  "py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all text-center",
                  selectionMode === 'category'
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
                )}
              >
                Theo Danh mục
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('auto')}
                className={cn(
                  "py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all text-center",
                  selectionMode === 'auto'
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
                )}
              >
                Tự động
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('manual')}
                className={cn(
                  "py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all text-center",
                  selectionMode === 'manual'
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
                )}
              >
                Chọn thủ công
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('demo')}
                className={cn(
                  "py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all text-center",
                  selectionMode === 'demo'
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
                )}
              >
                Demo mẫu
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {selectionMode === 'category'
                ? 'Tự động hiển thị các Tab lọc theo danh mục đã chọn và tự lấy sản phẩm Active tương ứng.'
                : selectionMode === 'auto'
                  ? 'Hiển thị sản phẩm tự động, hệ thống tự gôm các danh mục của chúng thành tab lọc.'
                  : selectionMode === 'manual'
                    ? 'Chọn từng sản phẩm cụ thể để hiển thị, tự gôm danh mục sản phẩm đã chọn thành tab lọc.'
                    : 'Nhập dữ liệu demo trực tiếp, không cần sản phẩm thật.'}
            </p>
          </div>

          {/* CHẾ ĐỘ 1: THEO DANH MỤC */}
          {selectionMode === 'category' && (
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
              {selectedCategories.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Danh mục đã chọn ({selectedCategories.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map(cat => {
                      const count = categoryProductCounts.get(cat._id) ?? 0;
                      return (
                        <span
                          key={cat._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                        >
                          {cat.name} ({count})
                          <button
                            type="button"
                            onClick={() => setCategoryTabIds(prev => prev.filter(id => id !== cat._id))}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Chọn danh mục hiển thị</Label>
                {!allCategories ? (
                  <p className="text-xs text-slate-400">Đang tải danh mục...</p>
                ) : allCategories.length === 0 ? (
                  <p className="text-xs text-slate-400">Chưa có danh mục sản phẩm nào</p>
                ) : (
                  <div className="relative" ref={categoryDropdownRef}>
                    <Popover open={isCategoryDropdownOpen} onOpenChange={setIsCategoryDropdownOpen}>
                      <PopoverTrigger>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={isCategoryDropdownOpen}
                          className="w-full justify-between text-left font-normal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        >
                          <span className="truncate">
                            {categoryTabIds.length === 0
                              ? "Chọn danh mục hiển thị..."
                              : `Đã chọn ${categoryTabIds.length} danh mục`}
                          </span>
                          <span className="text-slate-400 text-xs shrink-0 ml-2">▼</span>
                        </Button>
                      </PopoverTrigger>
                      {isCategoryDropdownOpen && (
                        <PopoverContent className="w-[340px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg z-50" align="start">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <Search size={14} className="text-slate-400 shrink-0" />
                            <Input
                              placeholder="Tìm danh mục..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="h-8 text-xs w-full bg-slate-50 dark:bg-slate-800 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
                            />
                          </div>
                          <ScrollArea className="max-h-[220px] overflow-y-auto pr-1 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
                            {filteredCategories.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy danh mục</p>
                            ) : (
                              filteredCategories.map(cat => {
                                const isSelected = categoryTabIds.includes(cat._id);
                                const count = categoryProductCounts.get(cat._id) ?? 0;
                                return (
                                  <button
                                    key={cat._id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setCategoryTabIds(prev => prev.filter(id => id !== cat._id));
                                      } else {
                                        setCategoryTabIds(prev => [...prev, cat._id]);
                                      }
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                                      isSelected ? "bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                                    )}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => {}}
                                      className={cn(
                                        "h-3.5 w-3.5 shrink-0 border-slate-300",
                                        isSelected ? "border-blue-500 text-blue-600" : ""
                                      )}
                                    />
                                    <span className="flex-1 truncate">{cat.name}</span>
                                    <span className="text-[10px] text-slate-400 shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                                      {count} sp
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </ScrollArea>
                        </PopoverContent>
                      )}
                    </Popover>
                  </div>
                )}
              </div>

              {selectedCategories.length === 0 && allCategories && allCategories.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Chưa chọn danh mục nào — sẽ hiển thị tất cả danh mục active ngoài storefront.
                </p>
              )}
            </div>
          )}

          {/* CHẾ ĐỘ 2: TỰ ĐỘNG */}
          {selectionMode === 'auto' && (
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="space-y-2">
                <Label>Sắp xếp sản phẩm tự động theo</Label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ProductGridSortBy)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="bestseller">Bán chạy nhất</option>
                  <option value="random">Ngẫu nhiên</option>
                </select>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                ℹ️ Hệ thống sẽ tự động gôm các danh mục của các sản phẩm này để hiển thị thành các tab lọc ngoài storefront.
              </p>
            </div>
          )}

          {/* CHẾ ĐỘ 3: CHỌN THỦ CÔNG */}
          {selectionMode === 'manual' && (
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  <Label>Sản phẩm đã chọn ({selectedProducts.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedProducts.map((product, index) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group"
                      >
                        <div className="text-slate-400 cursor-move"><GripVertical size={16} /></div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">{index + 1}</span>
                        {product.image ? (
                          <Image src={product.image} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={16} className="text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.price?.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() => setSelectedProductIds(ids => ids.filter(id => id !== product._id))}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Thêm sản phẩm</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Tìm kiếm sản phẩm..."
                      className="pl-9"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                  </div>
                  {allCategories && allCategories.length > 0 && (
                    <select
                      className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm max-w-[160px]"
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    >
                      <option value="all">Tất cả DM</option>
                      {allCategories.map(cat => {
                        const count = categoryProductCounts.get(cat._id) ?? 0;
                        return (
                          <option key={cat._id} value={cat._id}>{cat.name} ({count})</option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {finalFilteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {isLoading ? 'Đang tải...' : 'Không tìm thấy sản phẩm'}
                    </div>
                  ) : (
                    finalFilteredProducts.map(product => {
                      const isSelected = selectedProductIds.includes(product._id);
                      return (
                        <div
                          key={product._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedProductIds(ids => ids.filter(id => id !== product._id));
                            } else {
                              setSelectedProductIds(ids => [...ids, product._id]);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors",
                            isSelected ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300 dark:border-slate-600"
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {product.image ? (
                            <Image src={product.image} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={14} className="text-slate-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              {/* Chỉ báo lỗi sản phẩm (Option A) */}
                              {(product.stock ?? 0) <= 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                  ⚠️ Hết hàng
                                </span>
                              )}
                              {!product.image && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                  🖼️ Thiếu ảnh
                                </span>
                              )}
                              {(!product.price || product.price === 0) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                  🏷️ Chưa có giá
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{product.price?.toLocaleString('vi-VN')}đ</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                ℹ️ Hệ thống sẽ tự động gôm các danh mục của các sản phẩm đã chọn để hiển thị thành các tab lọc ngoài storefront.
              </p>
            </div>
          )}

          {/* CHẾ ĐỘ 4: DEMO MẪU */}
          {selectionMode === 'demo' && (
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex items-center justify-between">
                <Label>Sản phẩm demo ({demoProducts.length})</Label>
                <div className="flex gap-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={loadDefaultDemo}>
                    <RotateCcw size={14} className="mr-1" /> Mặc định
                  </Button>
                  <AiDemoProductsImport onApply={setDemoProducts} />
                  <Button type="button" variant="outline" size="sm" onClick={addDemoProduct}>
                    <Plus size={14} className="mr-1" /> Thêm
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {demoProducts.map((item, index) => (
                  <DemoItemRowShell
                    key={item.id}
                    index={index}
                    image={item.image}
                    placeholderIcon={<Package size={12} />}
                    onRemove={() => removeDemoProduct(item.id)}
                    footer={
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Giá gốc (tùy chọn)" value={item.originalPrice ?? ''} className="h-7 text-xs"
                          onChange={(e) => updateDemoProduct(item.id, { originalPrice: e.target.value })} />
                        <Input placeholder="Danh mục" value={item.category ?? ''} className="h-7 text-xs"
                          onChange={(e) => updateDemoProduct(item.id, { category: e.target.value })} />
                        <SettingsImageUploader
                          label="Ảnh sản phẩm"
                          value={item.image ?? ''}
                          storageId={item.storageId as any}
                          onChange={(url, storageId) => updateDemoProduct(item.id, {
                            image: url ?? '',
                            storageId: storageId ? String(storageId) : undefined
                          })}
                          folder="home-components/product-grid"
                          naming={{ entityName: item.name || 'demo-product', field: 'image', index: index + 1 }}
                          previewSize="sm"
                        />
                      </div>
                    }
                  >
                    <DemoPrimaryFields
                      name={item.name}
                      namePlaceholder="Tên sản phẩm *"
                      onNameChange={v => updateDemoProduct(item.id, { name: v })}
                      link={item.link ?? ''}
                      onLinkChange={v => updateDemoProduct(item.id, { link: v })}
                    />
                    <Input placeholder="Giá (VD: 350.000đ)" value={item.price ?? ''} className="h-8 w-28 text-xs shrink-0"
                      onChange={(e) => updateDemoProduct(item.id, { price: e.target.value })} />
                  </DemoItemRowShell>
                ))}
              </div>
              {demoProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-700">
                  <Package size={24} className="mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500 mb-3">Chưa có sản phẩm demo</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={loadDefaultDemo}>
                      <RotateCcw size={12} /> Tải mẫu
                    </Button>
                    <AiDemoProductsImport buttonClassName="h-9" onApply={setDemoProducts} />
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addDemoProduct}>
                      <Plus size={12} /> Thêm mới
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </SubSection>
      </div>
      </div>
    </div>
  );
};
