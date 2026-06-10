'use client';

import React, { useCallback, useRef, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Bot, Check, GripVertical, Loader2, Package, Plus, Search, Upload, X } from 'lucide-react';
import { Button, Input, Label, cn } from '../../../components/ui';
import type { DemoProductItem, ProductListConfig, ProductSelectionMode } from '../_types';
import { DEFAULT_DEMO_PRODUCTS } from '../_lib/constants';
import { toast } from 'sonner';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { AiDemoProductsImport } from './AiDemoProductsImport';
import { useFileDraftUploads } from '@/app/admin/components/useFileDraftUploads';
import { ImageEditorDialog } from '@/app/admin/components/ImageEditorDialog';
import { ImageSourceActions } from '@/app/admin/components/ImageSourceActions';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useDemoItemList } from '../../_shared/hooks/useDemoItemList';
import { DemoItemRowShell } from '../../_shared/components/DemoItemRowShell';
import { DemoPrimaryFields } from '../../_shared/components/DemoPrimaryFields';

export interface ProductListFormProduct {
  _id: string;
  name: string;
  image?: string;
  price?: number;
}



export function DemoItemImageUploader({
  item,
  onImageChange,
}: {
  item: DemoProductItem;
  onImageChange: (url: string, storageId?: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const { trackDraftUpload } = useFileDraftUploads('product-list-demo-products');

  const handleFile = useCallback(async (file: File) => {
    const error = validateImageFile(file, 5);
    if (error) { toast.error(error); return; }

    setUploading(true);
    try {
      const prepared = await prepareImageForUpload(file, {
        naming: { entityName: 'demo-product', field: 'image', index: 1 },
      });
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        body: prepared.file,
        headers: { 'Content-Type': prepared.mimeType },
        method: 'POST',
      });
      if (!response.ok) { throw new Error('Upload failed'); }
      const { storageId } = await response.json();



      const result = await saveImage({
        filename: prepared.filename,
        folder: 'demo-products',
        height: prepared.height,
        mimeType: prepared.mimeType,
        size: prepared.size,
        storageId: storageId as Id<'_storage'>,
        width: prepared.width,
      });
      await trackDraftUpload(storageId as Id<'_storage'>, 'demo-products');
      onImageChange(result.url ?? '', storageId);
      toast.success('Tải ảnh thành công');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải ảnh');
    } finally {
      setUploading(false);
    }
  }, [generateUploadUrl, saveImage, item.storageId, onImageChange, trackDraftUpload]);

  const handleClipboardPaste = useCallback(async () => {
    if (uploading) return;
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipItem of clipboardItems) {
        const imageType = clipItem.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await clipItem.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File([blob], `clipboard-${Date.now()}.${ext}`, { type: imageType });
          void handleFile(file);
          return;
        }
      }
      toast.error('Clipboard không có ảnh. Hãy copy ảnh trước.');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Trình duyệt chặn quyền đọc clipboard.');
      } else {
        toast.error('Không đọc được clipboard. Hãy copy ảnh trước.');
      }
    }
  }, [uploading, handleFile]);

  const applyUrl = () => {
    const trimmed = urlDraft.trim();
    if (trimmed) {
      onImageChange(trimmed, undefined);
    }
    setShowUrlInput(false);
    setUrlDraft('');
  };

  // URL input popover
  if (showUrlInput) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <Input
          autoFocus
          placeholder="https://..."
          className="h-8 w-40 text-[11px]"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyUrl(); } if (e.key === 'Escape') { setShowUrlInput(false); setUrlDraft(''); } }}
        />
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-green-600" onClick={applyUrl}>
          <Check size={13} />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-slate-400" onClick={() => { setShowUrlInput(false); setUrlDraft(''); }}>
          <X size={13} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* Thumbnail — click to upload, drag-drop */}
      <div
        className={cn(
          'relative w-9 h-9 rounded overflow-hidden border cursor-pointer transition-colors',
          isDragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-400'
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400',
          uploading && 'pointer-events-none'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) { void handleFile(file); }
        }}
        title="Click hoặc kéo thả để upload ảnh"
      >
        {item.image ? (
          <Image src={item.image} alt="" width={36} height={36} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            <Upload size={12} className={isDragOver ? 'text-blue-500' : 'text-slate-400'} />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <Loader2 size={14} className="animate-spin text-blue-500" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { void handleFile(file); }
            e.target.value = '';
          }}
        />
      </div>
      <ImageSourceActions
        mode={showUrlInput ? 'url' : 'upload'}
        onUpload={() => inputRef.current?.click()}
        onUrl={() => { setShowUrlInput(true); setUrlDraft(item.image ?? ''); }}
        onPaste={handleClipboardPaste}
        onCrop={() => setIsEditorOpen(true)}
        cropLabel="1:1"
        cropDisabled={!item.image || uploading}
        disabled={uploading}
        iconSize={11}
        className="gap-1"
      />
      {isEditorOpen && item.image && (
        <ImageEditorDialog
          imageUrl={item.image}
          preferredCropAspectRatio="square"
          onClose={() => setIsEditorOpen(false)}
          onApply={(editedFile) => {
            setIsEditorOpen(false);
            void handleFile(editedFile);
          }}
        />
      )}
    </div>
  );
}

export const ProductListForm = ({
  productSelectionMode,
  setProductSelectionMode,
  productListConfig,
  setProductListConfig,
  filteredProducts,
  selectedProducts,
  selectedProductIds,
  setSelectedProductIds,
  productSearchTerm,
  setProductSearchTerm,
  demoProducts,
  setDemoProducts,
  isLoading,
  defaultExpanded = true,
  className,
  openSections: openSectionsProp,
  onToggleSection: onToggleSectionProp,
  showToggleAll = true,
}: {
  productSelectionMode: ProductSelectionMode;
  setProductSelectionMode: (value: ProductSelectionMode) => void;
  productListConfig: ProductListConfig;
  setProductListConfig: (config: ProductListConfig) => void;
  filteredProducts: ProductListFormProduct[];
  selectedProducts: ProductListFormProduct[];
  selectedProductIds: string[];
  setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>;
  productSearchTerm: string;
  setProductSearchTerm: (value: string) => void;
  demoProducts: DemoProductItem[];
  setDemoProducts: React.Dispatch<React.SetStateAction<DemoProductItem[]>>;
  isLoading?: boolean;
  /** create = true (mở hết), edit = false (đóng hết) */
  defaultExpanded?: boolean;
  className?: string;
  openSections?: Record<string, boolean>;
  onToggleSection?: (key: any, open?: boolean) => void;
  showToggleAll?: boolean;
}) => {
  const localSectionsState = useFormSectionsState(
    ['products'],
    defaultExpanded
  );

  const activeOpenSections = openSectionsProp ?? localSectionsState.openSections;
  const activeToggleSection = onToggleSectionProp ?? ((key: string, open?: boolean) => localSectionsState.toggleSection(key as any, open));
  const activeHasClosedSection = openSectionsProp
    ? !activeOpenSections['products']
    : localSectionsState.hasClosedSection;
  const activeHandleToggleAll = openSectionsProp
    ? (() => activeToggleSection('products', activeHasClosedSection))
    : localSectionsState.handleToggleAll;

  const { add: addDemoItem, update: updateDemoItem, remove: removeDemoItem, loadDefault: loadDefaultDemo } = useDemoItemList(
    demoProducts,
    setDemoProducts,
    {
      createEmpty: () => ({ name: '', image: '', price: '', originalPrice: '', category: '', tag: '' as const, link: '' }),
      defaults: DEFAULT_DEMO_PRODUCTS,
    },
  );

  return (
    <div className={cn('mb-6 space-y-3', className)}>
      <AiDemoProductsImport onApply={setDemoProducts} />
      {showToggleAll && (
        <FormSectionsToggleAllButton hasClosedSection={activeHasClosedSection} onToggleAll={activeHandleToggleAll} />
      )}

        {/* ── Nguồn dữ liệu ── */}
        <SubSection
          icon={Package}
          title="Nguồn dữ liệu"
          open={activeOpenSections.products}
          onOpenChange={(open) => activeToggleSection('products', open)}
          actions={productSelectionMode === 'demo' ? (
            <>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={loadDefaultDemo}>
                <Bot size={11} /> Mẫu mặc định
              </Button>
              <AiDemoProductsImport onApply={setDemoProducts} />
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addDemoItem}>
                <Plus size={12} /> Thêm
              </Button>
            </>
          ) : undefined}
        >
          <div className="space-y-2">
            <Label>Chế độ chọn sản phẩm</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>{  setProductSelectionMode('auto'); }}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
                  productSelectionMode === 'auto'
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                Tự động
              </button>
              <button
                type="button"
                onClick={() =>{  setProductSelectionMode('manual'); }}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
                  productSelectionMode === 'manual'
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                Chọn thủ công
              </button>
              <button
                type="button"
                onClick={() =>{  setProductSelectionMode('demo'); }}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
                  productSelectionMode === 'demo'
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                Dữ liệu demo
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {productSelectionMode === 'auto'
                ? 'Hiển thị sản phẩm tự động theo số lượng và sắp xếp'
                : productSelectionMode === 'manual'
                  ? 'Chọn từng sản phẩm cụ thể để hiển thị'
                  : 'Dữ liệu mẫu gắn theo component — không cần tạo sản phẩm thật'}
            </p>
          </div>

          {productSelectionMode === 'auto' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số lượng hiển thị</Label>
                <Input
                  type="number"
                  value={productListConfig.itemCount}
                  onChange={(e) =>{  setProductListConfig({ ...productListConfig, itemCount: Number.parseInt(e.target.value) || 8 }); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Sắp xếp theo</Label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={productListConfig.sortBy}
                  onChange={(e) =>{  setProductListConfig({ ...productListConfig, sortBy: e.target.value }); }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="bestseller">Bán chạy nhất</option>
                  <option value="random">Ngẫu nhiên</option>
                </select>
              </div>
            </div>
          )}

          {productSelectionMode === 'manual' && (
            <div className="space-y-4">
              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  <Label>Sản phẩm đã chọn ({selectedProducts.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedProducts.map((product, index) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group"
                      >
                        <div className="text-slate-400 cursor-move">
                          <GripVertical size={16} />
                        </div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">
                          {index + 1}
                        </span>
                        {product.image ? (
                          <Image src={product.image} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                            <Package size={16} className="text-slate-400" />
                          </div>
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
                          onClick={() =>{  setSelectedProductIds(ids => ids.filter(id => id !== product._id)); }}
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
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    className="pl-9"
                    value={productSearchTerm}
                    onChange={(e) =>{  setProductSearchTerm(e.target.value); }}
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {isLoading ? 'Đang tải...' : 'Không tìm thấy sản phẩm'}
                    </div>
                  ) : (
                    filteredProducts.map(product => {
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
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-500/10"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-blue-500 bg-blue-500"
                              : "border-slate-300 dark:border-slate-600"
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {product.image ? (
                            <Image src={product.image} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                              <Package size={14} className="text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.price?.toLocaleString('vi-VN')}đ</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {productSelectionMode === 'demo' && (
            <div className="space-y-3">
              <Label>Sản phẩm demo ({demoProducts.length})</Label>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {demoProducts.map((item, index) => (
                  <DemoItemRowShell
                    key={item.id}
                    index={index}
                    image={item.image}
                    onRemove={() =>  removeDemoItem(item.id)}
                    placeholderIcon={<Package size={12} />}
                    footer={
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Giá gốc (tuỳ chọn)"
                          className="h-7 text-xs"
                          value={item.originalPrice ?? ''}
                          onChange={(e) => updateDemoItem(item.id, { originalPrice: e.target.value })}
                        />
                        <Input
                          placeholder="Danh mục"
                          className="h-7 text-xs"
                          value={item.category ?? ''}
                          onChange={(e) => updateDemoItem(item.id, { category: e.target.value })}
                        />
                      </div>
                    }
                  >
                    <DemoItemImageUploader
                      item={item}
                      onImageChange={(url, storageId) => updateDemoItem(item.id, { image: url, storageId })}
                    />
                    <DemoPrimaryFields
                      name={item.name}
                      namePlaceholder="Tên sản phẩm *"
                      onNameChange={v => updateDemoItem(item.id, { name: v })}
                      link={item.link ?? ''}
                      onLinkChange={v => updateDemoItem(item.id, { link: v })}
                    />
                    <Input
                      placeholder="Giá (VD: 1.990.000đ)"
                      className="h-8 w-28 text-xs shrink-0"
                      value={item.price ?? ''}
                      onChange={(e) => updateDemoItem(item.id, { price: e.target.value })}
                    />
                  </DemoItemRowShell>
                ))}
              </div>

              {demoProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-700">
                  <Package size={24} className="mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500 mb-3">Chưa có sản phẩm demo</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={loadDefaultDemo}>
                      <Bot size={12} /> Tải mẫu
                    </Button>
                    <AiDemoProductsImport buttonClassName="h-9" onApply={setDemoProducts} />
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addDemoItem}>
                      <Plus size={12} /> Thêm mới
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SubSection>
    </div>
  );
};
