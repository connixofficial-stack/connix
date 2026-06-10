'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  Upload, Trash2, Loader2, Image as ImageIcon,
  // Common category icons
  ShoppingBag, Shirt, Smartphone, Laptop, Watch, Home, Car, Utensils,
  Flower2, Baby, Dumbbell, Book, Music, Camera, Gamepad2, Plane,
  Heart, Gift, Sparkles, Crown, Diamond, Star, Sun, Moon,
  Coffee, Pizza, Cake, Wine, Apple, Leaf, TreeDeciduous,
  Dog, Cat, Bird, Fish, Palette, Brush, Scissors, Hammer,
  Wrench, Zap, Wifi, Headphones, Tv, Speaker, Package, Box,
  Truck, Building2, Store, Briefcase, GraduationCap, Stethoscope
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Label, cn } from './ui';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';
import { ImageEditorDialog } from './ImageEditorDialog';
import { getProductImageAspectRatioLabel, type ImageAspectRatioInput } from '@/lib/products/image-aspect-ratio';
import { ImageSourceActions } from './ImageSourceActions';
import { useFileDraftUploads } from './useFileDraftUploads';

// Available icons for categories
const CATEGORY_ICONS = [
  { icon: ShoppingBag, label: 'Túi mua sắm', name: 'shopping-bag' },
  { icon: Shirt, label: 'Thời trang', name: 'shirt' },
  { icon: Smartphone, label: 'Điện thoại', name: 'smartphone' },
  { icon: Laptop, label: 'Laptop', name: 'laptop' },
  { icon: Watch, label: 'Đồng hồ', name: 'watch' },
  { icon: Home, label: 'Nhà cửa', name: 'home' },
  { icon: Car, label: 'Xe cộ', name: 'car' },
  { icon: Utensils, label: 'Ẩm thực', name: 'utensils' },
  { icon: Flower2, label: 'Hoa', name: 'flower' },
  { icon: Baby, label: 'Mẹ & Bé', name: 'baby' },
  { icon: Dumbbell, label: 'Thể thao', name: 'dumbbell' },
  { icon: Book, label: 'Sách', name: 'book' },
  { icon: Music, label: 'Âm nhạc', name: 'music' },
  { icon: Camera, label: 'Máy ảnh', name: 'camera' },
  { icon: Gamepad2, label: 'Game', name: 'gamepad' },
  { icon: Plane, label: 'Du lịch', name: 'plane' },
  { icon: Heart, label: 'Yêu thích', name: 'heart' },
  { icon: Gift, label: 'Quà tặng', name: 'gift' },
  { icon: Sparkles, label: 'Làm đẹp', name: 'sparkles' },
  { icon: Crown, label: 'Cao cấp', name: 'crown' },
  { icon: Diamond, label: 'Trang sức', name: 'diamond' },
  { icon: Star, label: 'Nổi bật', name: 'star' },
  { icon: Sun, label: 'Mùa hè', name: 'sun' },
  { icon: Moon, label: 'Đêm', name: 'moon' },
  { icon: Coffee, label: 'Cà phê', name: 'coffee' },
  { icon: Pizza, label: 'Đồ ăn', name: 'pizza' },
  { icon: Cake, label: 'Bánh', name: 'cake' },
  { icon: Wine, label: 'Đồ uống', name: 'wine' },
  { icon: Apple, label: 'Trái cây', name: 'apple' },
  { icon: Leaf, label: 'Thiên nhiên', name: 'leaf' },
  { icon: TreeDeciduous, label: 'Cây cối', name: 'tree' },
  { icon: Dog, label: 'Thú cưng', name: 'dog' },
  { icon: Cat, label: 'Mèo', name: 'cat' },
  { icon: Bird, label: 'Chim', name: 'bird' },
  { icon: Fish, label: 'Cá', name: 'fish' },
  { icon: Palette, label: 'Nghệ thuật', name: 'palette' },
  { icon: Brush, label: 'Vẽ', name: 'brush' },
  { icon: Scissors, label: 'Cắt may', name: 'scissors' },
  { icon: Hammer, label: 'Dụng cụ', name: 'hammer' },
  { icon: Wrench, label: 'Sửa chữa', name: 'wrench' },
  { icon: Zap, label: 'Điện', name: 'zap' },
  { icon: Wifi, label: 'Công nghệ', name: 'wifi' },
  { icon: Headphones, label: 'Tai nghe', name: 'headphones' },
  { icon: Tv, label: 'TV', name: 'tv' },
  { icon: Speaker, label: 'Loa', name: 'speaker' },
  { icon: Package, label: 'Sản phẩm', name: 'package' },
  { icon: Box, label: 'Hộp', name: 'box' },
  { icon: Truck, label: 'Vận chuyển', name: 'truck' },
  { icon: Building2, label: 'Văn phòng', name: 'building' },
  { icon: Store, label: 'Cửa hàng', name: 'store' },
  { icon: Briefcase, label: 'Công việc', name: 'briefcase' },
  { icon: GraduationCap, label: 'Giáo dục', name: 'graduation' },
  { icon: Stethoscope, label: 'Y tế', name: 'medical' },
];

export function getCategoryIcon(name: string) {
  return CATEGORY_ICONS.find(i => i.name === name);
}

export function renderCategoryIcon(name: string, size: number = 24, className?: string) {
  const iconData = getCategoryIcon(name);
  if (!iconData) {return null;}
  const IconComponent = iconData.icon;
  return <IconComponent size={size} className={className} />;
}

type ImageMode = 'product-image' | 'default' | 'icon' | 'upload' | 'url';

const resolveImageMode = (value: string): ImageMode => {
  if (!value) {return 'default';}
  if (value.startsWith('product:')) {return 'product-image';}
  if (value.startsWith('icon:')) {return 'icon';}
  if (value.startsWith('http') || value.startsWith('/')) {return 'url';}
  if (value.startsWith('data:') || value.includes('convex')) {return 'upload';}
  return 'default';
};

interface CategoryImageSelectorProps {
  value: string;
  onChange: (value: string, mode: ImageMode, storageId?: Id<'_storage'> | null) => void;
  categoryImage?: string;
  categoryId?: string;
  brandColor?: string;
  className?: string;
  cropAspectRatio?: ImageAspectRatioInput;
}

export function CategoryImageSelector({
  value,
  onChange,
  categoryImage,
  categoryId,
  brandColor = '#3b82f6',
  className,
  cropAspectRatio,
}: CategoryImageSelectorProps) {
  // Determine current mode from value
  const initialMode = resolveImageMode(value);
  const [mode, setMode] = useState<ImageMode>(initialMode);
  const [selectedIcon, setSelectedIcon] = useState<string>(initialMode === 'icon' ? value.replace('icon:', '') : '');
  const [urlInput, setUrlInput] = useState<string>(initialMode === 'url' ? value : '');
  const [uploadedUrl, setUploadedUrl] = useState<string>(initialMode === 'upload' ? value : '');
  const [selectedProductId, setSelectedProductId] = useState<string>(initialMode === 'product-image' ? value.replace('product:', '') : '');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const { trackDraftUpload } = useFileDraftUploads(`category-image-selector:${categoryId ?? 'new'}`);
  const productsByCategory = useQuery(
    api.products.listByCategory,
    categoryId ? { categoryId: categoryId as Id<"productCategories">, paginationOpts: { cursor: null, numItems: 50 }, status: 'Active' } : "skip"
  );
  const productsData = productsByCategory?.page ?? [];
  const selectedProduct = selectedProductId ? productsData.find(p => p._id === selectedProductId) : undefined;

  // Sync with value prop
  useEffect(() => {
    const newMode = resolveImageMode(value);
    setMode(newMode);
    if (newMode === 'product-image') {
      setSelectedProductId(value.replace('product:', ''));
    } else if (newMode === 'icon') {
      setSelectedIcon(value.replace('icon:', ''));
    } else if (newMode === 'url') {
      setUrlInput(value);
    } else if (newMode === 'upload') {
      setUploadedUrl(value);
    }
  }, [value]);

  const handleModeChange = (newMode: ImageMode) => {
    setMode(newMode);
    setShowIconPicker(false);
    if (newMode === 'default') {
      onChange('', 'default', null);
    } else if (newMode === 'product-image') {
      if (selectedProductId) {
        onChange(`product:${selectedProductId}`, 'product-image', null);
      } else {
        onChange('', 'product-image', null);
      }
    } else if (newMode === 'icon' && selectedIcon) {
      onChange(`icon:${selectedIcon}`, 'icon', null);
    } else if (newMode === 'url' && urlInput) {
      onChange(urlInput, 'url', null);
    } else if (newMode === 'upload' && uploadedUrl) {
      onChange(uploadedUrl, 'upload');
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    if (productId) {
      onChange(`product:${productId}`, 'product-image', null);
    } else {
      onChange('', 'product-image', null);
    }
  };

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    onChange(`icon:${iconName}`, 'icon', null);
    setShowIconPicker(false);
  };

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim(), 'url', null);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateImageFile(file, 10);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);
    try {
      const resolvedNaming = resolveNamingContext(undefined, { entityName: 'category', field: 'image', index: 1 });
      const prepared = await prepareImageForUpload(file, { naming: resolvedNaming });

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        body: prepared.file,
        headers: { 'Content-Type': prepared.mimeType },
        method: 'POST',
      });

      if (!response.ok) {throw new Error('Upload failed');}

      const { storageId } = await response.json();

      const result = await saveImage({
        filename: prepared.filename,
        folder: 'category-images',
        height: prepared.height,
        mimeType: prepared.mimeType,
        size: prepared.size,
        storageId: storageId as Id<"_storage">,
        width: prepared.width,
      });
      await trackDraftUpload(storageId as Id<'_storage'>, 'category-images');

      const imageUrl = result.url ?? '';
      setUploadedUrl(imageUrl);
      onChange(imageUrl, 'upload', storageId as Id<'_storage'>);
      toast.success('Tải ảnh lên thành công');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, saveImage, onChange, trackDraftUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setMode('upload');
      void handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleClipboardPaste = useCallback(async () => {
    if (isUploading) return;

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File([blob], `clipboard-${Date.now()}.${ext}`, { type: imageType });
          setMode('upload');
          void handleFileSelect(file);
          return;
        }
      }
      toast.error('Clipboard không có ảnh. Hãy copy ảnh trước.');
    } catch {
      toast.error('Không đọc được clipboard. Hãy copy ảnh trước.');
    }
  }, [isUploading, handleFileSelect]);

  const handleRemoveUpload = () => {
    setUploadedUrl('');
    onChange('', 'default', null);
    setMode('default');
  };

  const currentIconData = getCategoryIcon(selectedIcon);
  const currentCropSourceUrl = mode === 'upload'
    ? uploadedUrl
    : mode === 'url'
      ? urlInput || value
      : mode === 'product-image'
        ? selectedProduct?.image
        : mode === 'default'
          ? categoryImage
          : undefined;
  const cropRatioLabel = cropAspectRatio ? getProductImageAspectRatioLabel(cropAspectRatio) : undefined;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        <button
          type="button"
          onClick={() =>{  handleModeChange('product-image'); }}
          className={cn(
            "flex-1 min-w-[90px] px-2 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === 'product-image' 
              ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Từ sản phẩm
        </button>
        <button
          type="button"
          onClick={() =>{  handleModeChange('default'); }}
          className={cn(
            "flex-1 min-w-[70px] px-2 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === 'default' 
              ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Mặc định
        </button>
        <button
          type="button"
          onClick={() => { setMode('icon'); setShowIconPicker(true); }}
          className={cn(
            "flex-1 min-w-[70px] px-2 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === 'icon' 
              ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Icon
        </button>
        <button
          type="button"
          onClick={() =>{  handleModeChange('upload'); }}
          className={cn(
            "flex-1 min-w-[70px] px-2 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === 'upload' 
              ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() =>{  handleModeChange('url'); }}
          className={cn(
            "flex-1 min-w-[70px] px-2 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === 'url' 
              ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          URL
        </button>
      </div>

      <ImageSourceActions
        mode={mode === 'url' ? 'url' : 'upload'}
        onUpload={() => {
          setMode('upload');
          inputRef.current?.click();
        }}
        onUrl={() => handleModeChange('url')}
        onPaste={handleClipboardPaste}
        onCrop={() => currentCropSourceUrl && setCropSourceUrl(currentCropSourceUrl)}
        cropLabel={cropRatioLabel}
        cropDisabled={!currentCropSourceUrl || isUploading}
        disabled={isUploading}
        iconSize={12}
      />

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {void handleFileSelect(file);}
        }}
        className="hidden"
      />

      {/* Mode: Default - show category image preview */}
      {mode === 'default' && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            {categoryImage ? (
              <Image src={categoryImage} width={48} height={48} alt="" className="object-cover" />
            ) : (
              <ImageIcon size={20} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Sử dụng ảnh danh mục</p>
            <p className="text-xs text-slate-500">Lấy từ cài đặt danh mục gốc</p>
          </div>
        </div>
      )}

      {/* Mode: Product Image */}
      {mode === 'product-image' && (
        <div className="space-y-3">
          {selectedProductId && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                {selectedProduct?.image ? (
                  <Image src={selectedProduct.image} width={48} height={48} alt="" className="object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedProduct?.name ?? 'Sản phẩm'}</p>
                <p className="text-xs text-slate-500">Ảnh từ sản phẩm</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Chọn sản phẩm</Label>
            {categoryId && productsByCategory === undefined ? (
              <div className="text-xs text-slate-500">Đang tải sản phẩm...</div>
            ) : (productsData.length > 0 ? (
              <select
                value={selectedProductId}
                onChange={(e) =>{  handleProductSelect(e.target.value); }}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {productsData.map(product => (
                  <option key={product._id} value={product._id}>{product.name}</option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">Danh mục chưa có sản phẩm. Sẽ fallback về ảnh mặc định.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode: Icon picker */}
      {mode === 'icon' && (
        <div className="space-y-3">
          {/* Selected icon preview */}
          {selectedIcon && currentIconData && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: brandColor }}
              >
                {React.createElement(currentIconData.icon, { size: 24 })}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{currentIconData.label}</p>
                <p className="text-xs text-slate-500">Icon: {selectedIcon}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>{  setShowIconPicker(!showIconPicker); }}
              >
                Đổi
              </Button>
            </div>
          )}

          {/* Icon grid picker */}
          {(showIconPicker || !selectedIcon) && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 max-h-[240px] overflow-y-auto">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {CATEGORY_ICONS.map((iconData) => (
                  <button
                    key={iconData.name}
                    type="button"
                    onClick={() =>{  handleIconSelect(iconData.name); }}
                    title={iconData.label}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                      selectedIcon === iconData.name
                        ? "ring-2 ring-offset-2 text-white"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    )}
                    style={selectedIcon === iconData.name ? { '--tw-ring-color': brandColor, backgroundColor: brandColor } as React.CSSProperties : {}}
                  >
                    {React.createElement(iconData.icon, { size: 20 })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode: Upload */}
      {mode === 'upload' && (
        <div>
          {uploadedUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square w-24">
              <Image src={uploadedUrl} alt="" fill sizes="96px" className="object-cover" />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => inputRef.current?.click()}
                    className="h-8 w-8"
                  >
                    <Upload size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={handleRemoveUpload}
                    className="h-8 w-8"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
              className={cn(
                'border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all h-24',
                isDragOver 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
                isUploading && 'pointer-events-none'
              )}
            >
              {isUploading ? (
                <Loader2 size={24} className="animate-spin text-blue-500" />
              ) : (
                <>
                  <Upload size={24} className={cn(isDragOver ? "text-blue-500" : "text-slate-400")} />
                  <span className="text-xs text-slate-500 mt-1">Kéo thả hoặc click</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode: URL */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <Input 
            value={urlInput}
            onChange={(e) =>{  setUrlInput(e.target.value); }}
            placeholder="https://example.com/image.jpg"
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleUrlApply}
            disabled={!urlInput.trim()}
          >
            Áp dụng
          </Button>
        </div>
      )}
      {cropSourceUrl && (
        <ImageEditorDialog
          imageUrl={cropSourceUrl}
          preferredCropAspectRatio={cropAspectRatio}
          onClose={() => setCropSourceUrl(null)}
          onApply={(editedFile) => {
            setCropSourceUrl(null);
            setMode('upload');
            void handleFileSelect(editedFile);
          }}
        />
      )}
    </div>
  );
}

export { CATEGORY_ICONS };

