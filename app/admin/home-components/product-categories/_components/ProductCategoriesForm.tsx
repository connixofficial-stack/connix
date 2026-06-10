'use client';

import React from 'react';
import { Bot, Database, GripVertical, Package, Plus, Trash2 } from 'lucide-react';
import { ToggleSwitch } from '@/components/modules/shared';
import { Button, Input, Label, cn } from '../../../components/ui';
import { CategoryImageSelector } from '../../../components/CategoryImageSelector';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';
import type { CategoryConfigItem, DemoProductCategoryItem, ProductCategoriesCornerRadius, ProductCategoriesDesktopColumns, ProductCategoriesSelectionMode, ProductCategoriesSpacing, ProductCategoriesStyle } from '../_types';
import { DEFAULT_DEMO_PRODUCT_CATEGORIES, getProductCategoriesCropAspectRatio } from '../_lib/constants';
import { normalizeDemoImageSrc } from '../_lib/imageSrc';
import { AiDemoProductCategoriesImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useDemoItemList } from '../../_shared/hooks/useDemoItemList';
import { DemoItemRowShell } from '../../_shared/components/DemoItemRowShell';
import { DemoPrimaryFields } from '../../_shared/components/DemoPrimaryFields';


const activeSections = ['settings', 'categories'];

export const ProductCategoriesForm = ({
  productCategoriesItems, setProductCategoriesItems,
  productCategoriesShowCount, setProductCategoriesShowCount,
  onAutoGenerate, autoGenerateReady, autoGenerateLoading,
  onAutoGenerateAllActive,
  productCategoriesData, brandColor,
  selectionMode = 'real', onSelectionModeChange,
  demoCategories = [], setDemoCategories,
  productCategoriesStyle = 'grid',
  spacing,
  setSpacing,
  cornerRadius,
  setCornerRadius,
  desktopColumns,
  setDesktopColumns,
  defaultExpanded = true,
}: {
  productCategoriesItems: CategoryConfigItem[];
  setProductCategoriesItems: (items: CategoryConfigItem[]) => void;
  productCategoriesShowCount: boolean;
  setProductCategoriesShowCount: (value: boolean) => void;
  onAutoGenerate?: () => void;
  autoGenerateReady?: boolean;
  autoGenerateLoading?: boolean;
  onAutoGenerateAllActive?: () => void;
  productCategoriesData: { _id: string; name: string; image?: string }[];
  brandColor: string;
  selectionMode?: ProductCategoriesSelectionMode;
  onSelectionModeChange?: (mode: ProductCategoriesSelectionMode) => void;
  demoCategories?: DemoProductCategoryItem[];
  setDemoCategories?: React.Dispatch<React.SetStateAction<DemoProductCategoryItem[]>>;
  productCategoriesStyle?: ProductCategoriesStyle;
  spacing?: ProductCategoriesSpacing;
  setSpacing?: (value: ProductCategoriesSpacing) => void;
  cornerRadius?: ProductCategoriesCornerRadius;
  setCornerRadius?: (value: ProductCategoriesCornerRadius) => void;
  desktopColumns?: ProductCategoriesDesktopColumns;
  setDesktopColumns?: (value: ProductCategoriesDesktopColumns) => void;
  defaultExpanded?: boolean;
}) => {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(activeSections, defaultExpanded);
  const cropAspectRatio = getProductCategoriesCropAspectRatio(productCategoriesStyle);
  // Duplicate detection for real mode
  const categoryIdCounts = productCategoriesItems.reduce<Record<string, number>>((acc, item) => {
    if (!item.categoryId) {return acc;}
    acc[item.categoryId] = (acc[item.categoryId] || 0) + 1;
    return acc;
  }, {});
  const duplicateCategoryIds = new Set(
    Object.entries(categoryIdCounts).filter(([, count]) => count > 1).map(([id]) => id)
  );
  const duplicateCount = duplicateCategoryIds.size;
  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    setProductCategoriesItems(productCategoriesItems.filter((item) => {
      if (!item.categoryId) {return true;}
      if (seen.has(item.categoryId)) {return false;}
      seen.add(item.categoryId);
      return true;
    }));
  };

  // Demo helpers
  const { add: addDemoItem, update: updateDemoItem, remove: removeDemoItem, loadDefault: loadDefaultDemo } = useDemoItemList(
    demoCategories,
    (setDemoCategories ?? (() => {})) as React.Dispatch<React.SetStateAction<DemoProductCategoryItem[]>>,
    {
      createEmpty: () => ({ name: '', image: '', productCount: 0, link: '' }),
      defaults: DEFAULT_DEMO_PRODUCT_CATEGORIES,
      minItems: 1,
    },
  );

  return (
    <>
      <AiDemoProductCategoriesImport onApply={(items) => setDemoCategories?.(items)} />
      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />
      <div className="mb-6 space-y-3">
        {spacing && setSpacing && cornerRadius && setCornerRadius ? (
          <HomeComponentDisplaySettingsSection
            open={openSections.settings}
            onOpenChange={(open) => toggleSection('settings', open)}
            cornerRadius={cornerRadius}
            onCornerRadiusChange={setCornerRadius}
            spacing={spacing}
            onSpacingChange={setSpacing}
          >
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 md:col-span-2">
              <div className="space-y-0.5">
                <Label className="text-sm">Hiển thị số lượng sản phẩm</Label>
                <p className="text-xs text-slate-500">Bật để hiện tổng số sản phẩm trong từng danh mục.</p>
              </div>
              <ToggleSwitch enabled={productCategoriesShowCount} onChange={() => setProductCategoriesShowCount(!productCategoriesShowCount)} />
            </div>
            {desktopColumns !== undefined && setDesktopColumns && (
              <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700 md:col-span-2">
                <Label className="text-sm">Số cột trên Desktop</Label>
                <div className="flex gap-2">
                  {[3, 4].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setDesktopColumns(col as 3 | 4)}
                      className={cn(
                        'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                        desktopColumns === col
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      )}
                    >
                      {col} cột
                    </button>
                  ))}
                </div>
              </div>
            )}
          </HomeComponentDisplaySettingsSection>
        ) : (
          <SubSection
          icon={Database}
          title="Cài đặt hiển thị"
          open={openSections.settings}
          onOpenChange={(open) => toggleSection('settings', open)}
        >
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
        <div className="space-y-0.5">
          <Label className="text-sm">Hiển thị số lượng sản phẩm</Label>
          <p className="text-xs text-slate-500">Bật để hiện tổng số sản phẩm trong từng danh mục.</p>
        </div>
        <ToggleSwitch enabled={productCategoriesShowCount} onChange={() => setProductCategoriesShowCount(!productCategoriesShowCount)} />
      </div>
    </SubSection>
        )}

    <SubSection
      icon={Database}
      title={selectionMode === 'demo' ? `Danh mục demo (${demoCategories.length})` : `Chọn danh mục (${productCategoriesItems.length})`}
      open={openSections.categories}
      onOpenChange={(open) => toggleSection('categories', open)}
      actions={(
        <>
            {selectionMode === 'real' && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => onAutoGenerateAllActive?.()} disabled={!productCategoriesData?.length} className="gap-1 border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-400">Sinh tất cả</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onAutoGenerate?.()} disabled={!autoGenerateReady || autoGenerateLoading} className="gap-1">Sinh có SP &gt; 0</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { const newId = Math.max(0, ...productCategoriesItems.map(c => c.id)) + 1; setProductCategoriesItems([...productCategoriesItems, { categoryId: '', customImage: '', id: newId }]); }} disabled={productCategoriesItems.length >= 12 || !productCategoriesData?.length} className="gap-1"><Plus size={12} /> Thêm</Button>
              </>
            )}
            {selectionMode === 'demo' && (
              <>
                <Button type="button" variant="outline" size="sm" className="gap-1 text-xs" onClick={loadDefaultDemo}><Bot size={11} /> Mẫu mặc định</Button>
                <AiDemoProductCategoriesImport onApply={(items) => setDemoCategories?.(items)} />
                <Button type="button" variant="outline" size="sm" className="gap-1 text-xs" onClick={addDemoItem}><Plus size={12} /> Thêm</Button>
              </>
            )}
        </>
      )}
    >
        {/* Mode toggle */}
        {onSelectionModeChange && (
          <div className="space-y-2">
            <Label>Nguồn dữ liệu</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => onSelectionModeChange('real')} className={cn("flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all", selectionMode === 'real' ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400" : "border-slate-200 dark:border-slate-700 hover:border-slate-300")}>Dữ liệu thật</button>
              <button type="button" onClick={() => onSelectionModeChange('demo')} className={cn("flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all", selectionMode === 'demo' ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-slate-200 dark:border-slate-700 hover:border-slate-300")}>Dữ liệu demo</button>
            </div>
            <p className="text-xs text-slate-500">{selectionMode === 'real' ? 'Chọn danh mục sản phẩm thật từ hệ thống' : 'Dữ liệu mẫu gắn theo component — không cần tạo danh mục thật'}</p>
          </div>
        )}

        {/* Real mode */}
        {selectionMode === 'real' && (
          <>
            <p className="text-xs text-slate-500">Sinh nhanh sẽ tự chọn tất cả danh mục có sản phẩm và có ít nhất 1 thumbnail sản phẩm để làm ảnh đại diện.</p>
            {duplicateCount > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <div className="flex items-center justify-between gap-3">
                  <div>⚠️ Có {duplicateCount} danh mục bị trùng lặp.</div>
                  <button type="button" className="text-amber-900 underline underline-offset-4" onClick={handleRemoveDuplicates}>Xóa trùng lặp</button>
                </div>
              </div>
            )}
            {!productCategoriesData?.length ? (
              <p className="text-sm text-slate-500 text-center py-4">Chưa có danh mục sản phẩm. Vui lòng tạo danh mục trước.</p>
            ) : (productCategoriesItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Chưa chọn danh mục nào. Nhấn &quot;Thêm&quot; để bắt đầu.</p>
            ) : (
              productCategoriesItems.map((item, idx) => (
                <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><GripVertical size={16} className="text-slate-400 cursor-move" /><Label>Danh mục {idx + 1}</Label></div>
                    <Button type="button" variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => setProductCategoriesItems(productCategoriesItems.filter(c => c.id !== item.id))}><Trash2 size={14} /></Button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">Danh mục</Label>
                      <select value={item.categoryId} onChange={(e) => setProductCategoriesItems(productCategoriesItems.map(c => c.id === item.id ? {...c, categoryId: e.target.value} : c))} className={`w-full h-9 rounded-md border bg-white dark:bg-slate-900 px-3 text-sm ${duplicateCategoryIds.has(item.categoryId) ? 'border-amber-400' : 'border-slate-200 dark:border-slate-700'}`}>
                        <option value="">-- Chọn danh mục --</option>
                        {productCategoriesData?.map(cat => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                      </select>
                      {duplicateCategoryIds.has(item.categoryId) && (<p className="text-xs text-amber-700">Danh mục này bị trùng, trang chủ sẽ chỉ hiển thị 1 lần.</p>)}
                    </div>
                    {item.categoryId && (
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Hình ảnh hiển thị</Label>
                        <CategoryImageSelector value={item.customImage || ''} onChange={(value, mode, storageId) => setProductCategoriesItems(productCategoriesItems.map(c => c.id === item.id ? {...c, customImage: value, imageMode: mode, storageId: storageId === undefined ? c.storageId ?? null : storageId} : c))} categoryId={item.categoryId} categoryImage={productCategoriesData?.find(cat => cat._id === item.categoryId)?.image} brandColor={brandColor} cropAspectRatio={cropAspectRatio} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ))}
            <p className="text-xs text-slate-500">Tối đa 12 danh mục. Mỗi danh mục có thể: sử dụng ảnh gốc, chọn icon, upload ảnh, hoặc nhập URL.</p>
          </>
        )}

        {/* Demo mode */}
        {selectionMode === 'demo' && setDemoCategories && (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {demoCategories.map((item, index) => (
                <DemoItemRowShell
                  key={item.id}
                  index={index}
                  image={normalizeDemoImageSrc(item.image)}
                  onRemove={() => removeDemoItem(item.id)}
                  placeholderIcon={<Package size={12} />}
                  footer={
                    <SettingsImageUploader
                      label="Ảnh đại diện"
                      value={item.image ?? ''}
                      onChange={(url, storageId) => updateDemoItem(item.id, { image: url ?? '', storageId: storageId ?? null })}
                      folder="home-components/product-categories"
                      naming={{ entityName: item.name || 'demo-category', field: 'image', index: index + 1 }}
                      previewSize="sm"
                      cropAspectRatio={cropAspectRatio}
                    />
                  }
                >
                  <DemoPrimaryFields
                    name={item.name}
                    namePlaceholder="Tên danh mục *"
                    onNameChange={(v) => updateDemoItem(item.id, { name: v })}
                    link={item.link ?? ''}
                    onLinkChange={(v) => updateDemoItem(item.id, { link: v })}
                  />
                  <Input
                    placeholder="SL"
                    type="number"
                    className="h-8 w-16 text-xs shrink-0"
                    value={item.productCount ?? ''}
                    onChange={(e) => updateDemoItem(item.id, { productCount: Number.parseInt(e.target.value) || 0 })}
                  />
                </DemoItemRowShell>
              ))}
            </div>
            {demoCategories.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-700">
                <Package size={24} className="mb-2 text-slate-300" />
                <p className="text-sm text-slate-500 mb-3">Chưa có danh mục demo</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={loadDefaultDemo}><Bot size={12} /> Tải mẫu</Button>
                  <AiDemoProductCategoriesImport buttonClassName="h-9" onApply={(items) => setDemoCategories?.(items)} />
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addDemoItem}><Plus size={12} /> Thêm mới</Button>
                </div>
              </div>
            )}
          </div>
        )}
    </SubSection>
  </div>
  </>
  );
};
