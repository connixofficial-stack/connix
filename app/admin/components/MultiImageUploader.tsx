'use client';

import type { DragEvent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ClipboardPaste, GripVertical, Image as ImageIcon, Link2, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, cn } from './ui';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { getVideoEmbedUrl, getVideoThumbnail, isVideoUrl } from '@/lib/utils/media';
import { resolveNamingContext, type ImageNamingContext } from '@/lib/image/uploadNaming';
import {
  DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  getProductImageAspectRatioCssValue,
  getProductImageAspectRatioLabel,
  type ImageAspectRatioInput,
} from '@/lib/products/image-aspect-ratio';
import { useFileDraftUploads } from './useFileDraftUploads';
import { ImageEditorDialog } from './ImageEditorDialog';
import { ImageSourceActions } from './ImageSourceActions';
export interface ImageItem {
  id: string | number;
  url: string;
  storageId?: Id<'_storage'> | null;
  [key: string]: unknown; // Allow extra fields like link, title, etc.
}

type ImageAspectRatioResolver<T extends ImageItem> = ImageAspectRatioInput | ((item: T, index: number) => ImageAspectRatioInput);

interface MultiImageUploaderProps<T extends ImageItem> {
  items: T[];
  onChange: (items: T[]) => void;
  folder?: string;
  naming?: ImageNamingContext;
  className?: string;
  imageKey?: keyof T; // Which field contains the image URL (default: 'url')
  extraFields?: {
    key: keyof T;
    placeholder: string;
    type?: 'text' | 'url';
  }[];
  maxItems?: number;
  minItems?: number;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  imageAspectRatio?: ImageAspectRatioInput;
  columns?: 1 | 2 | 3 | 4;
  showReorder?: boolean;
  addButtonText?: string;
  emptyText?: string;
  layout?: 'horizontal' | 'vertical'; // Vertical: image on top, fields below (better for cards)
  enableCrop?: boolean;
  cropOnUpload?: boolean;
  cropAspectRatio?: ImageAspectRatioResolver<T>;
  deleteMode?: 'immediate' | 'defer';
  namingIndexOffset?: number;
  onUploadComplete?: (info: { itemId: string | number; storageId: Id<'_storage'>; url: string; folder: string }) => void | Promise<void>;
  /** Khi bật, URL video (.mp4, .webm) sẽ render <video> thay vì <Image> */
  allowVideoUrl?: boolean;
  /** Bật editor dùng chung: crop + remove background như logo trong settings */
  enableImageEditor?: boolean;
  imageFit?: 'cover' | 'contain';
}

export function MultiImageUploader<T extends ImageItem>({
  items,
  onChange,
  folder = 'home-components',
  naming,
  className,
  imageKey = 'url' as keyof T,
  extraFields = [],
  maxItems = 20,
  minItems = 1,
  aspectRatio = 'video',
  imageAspectRatio,
  columns = 1,
  showReorder = true,
  addButtonText = 'Thêm ảnh',
  emptyText = 'Chưa có ảnh nào',
  layout = 'horizontal',
  enableCrop = false,
  cropOnUpload = enableCrop,
  cropAspectRatio = DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  deleteMode = 'immediate',
  namingIndexOffset = 0,
  onUploadComplete,
  allowVideoUrl = false,
  enableImageEditor = false,
  imageFit = 'cover',
}: MultiImageUploaderProps<T>) {
  const itemsRef = useRef(items);
  const reactInputId = React.useId();
  const applyItems = useCallback((nextItems: T[]) => {
    itemsRef.current = nextItems;
    onChange(nextItems);
  }, [onChange]);
  const [uploadingIds, setUploadingIds] = useState<Set<string | number>>(new Set());
  const [urlModeIds, setUrlModeIds] = useState<Set<string | number>>(new Set());
  const [brokenImageUrls, setBrokenImageUrls] = useState<Map<string | number, string>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverItemId, setDragOverItemId] = useState<string | number | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | number | null>(null);
  const [fileDragOverItemId, setFileDragOverItemId] = useState<string | number | null>(null); // For file drops on specific items
  const [cropItemId, setCropItemId] = useState<string | number | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [editItemId, setEditItemId] = useState<string | number | null>(null);
  const inputRefs = useRef<Map<string | number, HTMLInputElement>>(new Map());
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const deleteImage = useMutation(api.storage.deleteImage);
  const { trackDraftUpload } = useFileDraftUploads(`multi-image-uploader:${folder}`);

  const markBroken = useCallback((itemId: string | number, imageUrl: string) => {
    setBrokenImageUrls(prev => new Map(prev).set(itemId, imageUrl));
  }, []);

  const clearBroken = useCallback((itemId: string | number) => {
    setBrokenImageUrls(prev => {
      if (!prev.has(itemId)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl);
      }
    };
  }, [cropPreviewUrl]);

  const aspectClasses = {
    auto: 'min-h-[100px]',
    banner: 'aspect-[3/1]',
    square: 'aspect-square',
    video: 'aspect-video',
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  const resetCropState = useCallback(() => {
    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }
    setCropItemId(null);
    setCropFile(null);
    setCropPreviewUrl(null);
  }, [cropPreviewUrl]);

  const openCropper = useCallback((itemId: string | number, file: File) => {
    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }
    setCropItemId(itemId);
    setCropFile(file);
    setCropPreviewUrl(URL.createObjectURL(file));
  }, [cropPreviewUrl]);

  const handleFileUpload = useCallback(async (itemId: string | number, file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingIds(prev => new Set(prev).add(itemId));

    try {
      const itemIndex = itemsRef.current.findIndex(item => item.id === itemId);
      const resolvedNaming = resolveNamingContext(naming, {
        entityName: folder,
        field: 'image',
        index: (itemIndex >= 0 ? itemIndex + 1 : itemsRef.current.length + 1) + namingIndexOffset,
      });
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
        folder,
        height: prepared.height,
        mimeType: prepared.mimeType,
        size: prepared.size,
        storageId: storageId as Id<"_storage">,
        width: prepared.width,
      });
      await trackDraftUpload(storageId as Id<'_storage'>, folder);

      applyItems(itemsRef.current.map(item => 
        item.id === itemId 
          ? { ...item, [imageKey]: result.url ?? '', storageId: storageId as Id<'_storage'> } as T
          : item
      ));
      await onUploadComplete?.({
        folder,
        itemId,
        storageId: storageId as Id<'_storage'>,
        url: result.url ?? '',
      });
      clearBroken(itemId);

      toast.success('Tải ảnh lên thành công');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [generateUploadUrl, saveImage, folder, imageKey, onChange, onUploadComplete, trackDraftUpload, clearBroken, naming, namingIndexOffset]);

  const handleSelectedFile = useCallback((itemId: string | number, file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (enableCrop && cropOnUpload) {
      openCropper(itemId, file);
      return;
    }

    void handleFileUpload(itemId, file);
  }, [enableCrop, cropOnUpload, openCropper, handleFileUpload]);

  const handlePasteImage = useCallback(async (itemId: string | number) => {
    try {
      const clipItems = await navigator.clipboard.read();
      for (const ci of clipItems) {
        const imgType = ci.types.find(t => t.startsWith('image/'));
        if (imgType) {
          const blob = await ci.getType(imgType);
          const ext = imgType.split('/')[1] || 'png';
          const file = new File([blob], `clipboard-${Date.now()}.${ext}`, { type: imgType });
          handleSelectedFile(itemId, file);
          return;
        }
      }
      toast.error('Clipboard không có ảnh.');
    } catch {
      toast.error('Không đọc được clipboard.');
    }
  }, [handleSelectedFile]);

  const handleCropExistingImage = useCallback(async (itemId: string | number, imageUrl: string) => {
    if (!enableCrop || !imageUrl || isVideoUrl(imageUrl)) {
      return;
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Không thể tải ảnh hiện tại');
      }
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        toast.error('Ảnh hiện tại không hỗ trợ cắt.');
        return;
      }
      const extension = blob.type.split('/')[1] || 'jpg';
      const file = new File([blob], `hero-crop-${Date.now()}.${extension}`, { type: blob.type });
      openCropper(itemId, file);
    } catch (error) {
      console.error('Crop existing image error:', error);
      toast.error('Không thể mở ảnh để cắt. Hãy upload lại ảnh nếu ảnh lấy từ URL ngoài.');
    }
  }, [enableCrop, openCropper]);

  const resolveCropAspectRatio = useCallback((item: T | undefined, index: number): ImageAspectRatioInput => {
    if (typeof cropAspectRatio === 'function' && item) {
      return cropAspectRatio(item, index);
    }
    return typeof cropAspectRatio === 'function' ? DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO : cropAspectRatio;
  }, [cropAspectRatio]);

  const createUploaderItemId = useCallback((index = 0) => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `new-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;
  }, []);

  const handleMultipleFiles = useCallback(async (files: FileList) => {
    const filesToUpload = [...files];
    if (filesToUpload.length === 0) {
      return;
    }

    const currentItems = itemsRef.current;

    if (enableCrop && cropOnUpload) {
      if (filesToUpload.length > 1) {
        toast.message('Đang bật cắt ảnh theo tỉ lệ: vui lòng chọn từng ảnh để cắt chính xác.');
      }
      const targetItem = currentItems.find(item => !item[imageKey]);
      if (targetItem) {
        handleSelectedFile(targetItem.id, filesToUpload[0]);
        return;
      }

      if (currentItems.length >= maxItems) {
        toast.error(`Đã đạt giới hạn ${maxItems} ảnh`);
        return;
      }

      const newItem = {
        id: createUploaderItemId(0),
        [imageKey]: '',
      } as unknown as T;
      applyItems([...currentItems, newItem]);
      handleSelectedFile(newItem.id, filesToUpload[0]);
      return;
    }

    const firstEmptyItem = currentItems.find(item => !item[imageKey]);
    if (firstEmptyItem) {
      const firstUploadPromise = handleFileUpload(firstEmptyItem.id, filesToUpload[0]);
      const remainingFiles = filesToUpload.slice(1);
      if (remainingFiles.length > 0) {
        const remainingSlots = maxItems - currentItems.length;
        const filesToAdd = remainingFiles.slice(0, remainingSlots);

        if (filesToAdd.length > 0) {
          const newItems: T[] = filesToAdd.map((_, index) => ({
            id: createUploaderItemId(index),
            [imageKey]: '',
          } as unknown as T));
          applyItems([...currentItems, ...newItems]);

          await Promise.all([firstUploadPromise, ...filesToAdd.map(async (file, i) => handleFileUpload(newItems[i].id, file))]);
          return;
        }
      }
      await firstUploadPromise;
      return;
    }

    const remainingSlots = maxItems - currentItems.length;
    const filesToAdd = filesToUpload.slice(0, remainingSlots);

    if (filesToAdd.length < filesToUpload.length) {
      toast.warning(`Chỉ có thể thêm ${remainingSlots} ảnh nữa`);
    }

    if (filesToAdd.length === 0) {
      toast.error(`Đã đạt giới hạn ${maxItems} ảnh`);
      return;
    }

    const newItems: T[] = filesToAdd.map((_, index) => ({
      id: createUploaderItemId(index),
      [imageKey]: '',
    } as unknown as T));

    applyItems([...currentItems, ...newItems]);
    await Promise.all(filesToAdd.map(async (file, i) => handleFileUpload(newItems[i].id, file)));
  }, [maxItems, imageKey, applyItems, handleFileUpload, enableCrop, cropOnUpload, handleSelectedFile, createUploaderItemId]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if leaving the container entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
    setDragOverItemId(null);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, itemId?: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    if (itemId !== undefined) {
      setDragOverItemId(itemId);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent, itemId?: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragOverItemId(null);
    setFileDragOverItemId(null);
    
    const {files} = e.dataTransfer;
    if (files.length === 0) {return;}
    
    if (itemId !== undefined) {
      // Drop on specific item
      if (files[0]) {handleSelectedFile(itemId, files[0]);}
    } else {
      // Drop on container - add new items
      void handleMultipleFiles(files);
    }
  }, [handleSelectedFile, handleMultipleFiles]);

  // File drag handlers for individual items
  const handleItemFileDragEnter = useCallback((e: React.DragEvent, itemId: string | number) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverItemId(itemId);
  }, []);

  const handleItemFileDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverItemId(null);
  }, []);

  const handleItemFileDragOver = useCallback((e: React.DragEvent, itemId: string | number) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setFileDragOverItemId(itemId);
  }, []);

  const handleItemFileDrop = useCallback((e: React.DragEvent, itemId: string | number) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverItemId(null);
    setIsDragging(false);
    
    const {files} = e.dataTransfer;
    if (files.length > 0 && files[0]) {
      handleSelectedFile(itemId, files[0]);
    }
  }, [handleSelectedFile]);

  const handleUrlChange = useCallback((itemId: string | number, url: string) => {
    applyItems(itemsRef.current.map(item => 
      item.id === itemId ? { ...item, [imageKey]: url, storageId: null } as T : item
    ));
    clearBroken(itemId);
  }, [imageKey, applyItems, clearBroken]);

  const handleExtraFieldChange = useCallback((itemId: string | number, fieldKey: keyof T, value: string) => {
    applyItems(itemsRef.current.map(item => 
      item.id === itemId ? { ...item, [fieldKey]: value } as T : item
    ));
  }, [applyItems]);

  const handleRemove = useCallback(async (itemId: string | number) => {
    const currentItems = itemsRef.current;
    if (currentItems.length <= minItems) {
      toast.error(`Cần tối thiểu ${minItems} mục`);
      return;
    }

    const item = currentItems.find(i => i.id === itemId);
    if (deleteMode === 'immediate' && item?.storageId) {
      try {
        await deleteImage({ storageId: item.storageId as Id<"_storage"> });
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(error instanceof Error ? error.message : 'Không thể xóa ảnh vì đang được sử dụng ở nơi khác');
        return; // Dừng lại, không xóa khỏi UI
      }
    }

    const nextItems = currentItems.filter(i => i.id !== itemId);
    itemsRef.current = nextItems;
    clearBroken(itemId);
    applyItems(nextItems);
  }, [minItems, deleteImage, applyItems, deleteMode, clearBroken]);

  const handleItemDragStart = useCallback((e: React.DragEvent, itemId: string | number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(itemId));
    setDraggedItemId(itemId);
  }, []);

  const handleItemDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  }, []);

  const handleItemDragOver = useCallback((e: React.DragEvent, targetId: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItemId && draggedItemId !== targetId) {
      setDragOverItemId(targetId);
    }
  }, [draggedItemId]);

  const handleItemDrop = useCallback((e: React.DragEvent, targetId: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const dragIndex = itemsRef.current.findIndex(item => item.id === draggedItemId);
    const dropIndex = itemsRef.current.findIndex(item => item.id === targetId);

    if (dragIndex === -1 || dropIndex === -1) {return;}

    const newItems = [...itemsRef.current];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    applyItems(newItems);

    setDraggedItemId(null);
    setDragOverItemId(null);
  }, [draggedItemId, applyItems]);

  const handleAdd = useCallback(() => {
    const currentItems = itemsRef.current;
    if (currentItems.length >= maxItems) {
      toast.error(`Tối đa ${maxItems} mục`);
      return;
    }
    const newItem = {
      id: `new-${Date.now()}`,
      [imageKey]: '',
      ...extraFields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {}),
    } as unknown as T;
    applyItems([...currentItems, newItem]);
  }, [maxItems, imageKey, extraFields, applyItems]);

  const handleAddUrl = useCallback(() => {
    const currentItems = itemsRef.current;
    if (currentItems.length >= maxItems) {
      toast.error(`Tối đa ${maxItems} mục`);
      return;
    }
    const itemId = `new-url-${Date.now()}`;
    const newItem = {
      id: itemId,
      [imageKey]: '',
      ...extraFields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {}),
    } as unknown as T;
    applyItems([...currentItems, newItem]);
    setUrlModeIds(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  }, [maxItems, imageKey, extraFields, applyItems]);

  const toggleUrlMode = useCallback((itemId: string | number) => {
    setUrlModeIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const inputId = `multi-image-input-${reactInputId.replace(/:/g, '')}`;
  const isCropOpen = Boolean(cropItemId !== null && cropFile && cropPreviewUrl);
  const cropItemIndex = cropItemId === null ? -1 : items.findIndex(item => item.id === cropItemId);
  const activeCropAspectRatio = cropItemIndex >= 0 ? resolveCropAspectRatio(items[cropItemIndex], cropItemIndex) : resolveCropAspectRatio(undefined, 0);
  const resolvedImageAspectRatio = imageAspectRatio ? getProductImageAspectRatioCssValue(imageAspectRatio) : null;
  const imageClassName = cn(
    imageFit === 'contain' ? 'object-contain p-4' : 'object-cover',
    'transition-opacity'
  );
  const editedItem = editItemId === null ? undefined : items.find(item => item.id === editItemId);
  const editedImageUrl = editedItem?.[imageKey] as string | undefined;
  const renderVideoPreview = (videoUrl: string, className?: string) => {
    const embedUrl = getVideoEmbedUrl(videoUrl, { autoplay: false });
    const thumbnailUrl = getVideoThumbnail(videoUrl);

    if (thumbnailUrl) {
      return (
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className={cn(imageClassName, className)}
        />
      );
    }

    if (embedUrl) {
      return (
        <iframe
          src={embedUrl}
          title="Video preview"
          className={cn("w-full h-full border-0", className)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      );
    }

    return (
      <video
        src={videoUrl}
        className={cn("w-full h-full object-cover transition-opacity", className)}
        muted
        loop
        autoPlay
        playsInline
      />
    );
  };

  return (
    <>
    <div 
      ref={dropZoneRef}
      className={cn('space-y-4', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) =>{  handleDragOver(e); }}
      onDrop={(e) =>{  handleDrop(e); }}
    >
      {/* Drop zone for adding new images */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer",
          isDragging 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]" 
            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        )}
        onClick={() => {
          const input = document.getElementById(inputId) as HTMLInputElement | null;
          input?.click();
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleMultipleFiles(e.target.files)}
          className="hidden"
          id={inputId}
        />
        <Upload size={32} className={cn("mx-auto mb-3 transition-colors", isDragging ? "text-blue-500" : "text-slate-400")} />
        <p className={cn("text-sm font-medium", isDragging ? "text-blue-600" : "text-slate-600 dark:text-slate-300")}>
          {isDragging ? 'Thả ảnh vào đây!' : 'Kéo thả ảnh hoặc click để chọn'}
        </p>
        <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF - Tự động chuyển WebP</p>
      </div>

      {/* Clipboard paste button */}
      <button
        type="button"
        onClick={async () => {
          try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
              const imageType = item.types.find(t => t.startsWith('image/'));
              if (imageType) {
                const blob = await item.getType(imageType);
                const ext = imageType.split('/')[1] || 'png';
                const file = new File([blob], `clipboard-${Date.now()}.${ext}`, { type: imageType });
                const fakeFileList = Object.assign([file], { item: (i: number) => [file][i] || null }) as unknown as FileList;
                void handleMultipleFiles(fakeFileList);
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
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
        title="Copy ảnh rồi click vào đây"
      >
        <ClipboardPaste size={14} /> Dán ảnh từ clipboard
      </button>

      {/* Items grid */}
      {items.length > 0 ? (
        <div className={cn('grid gap-4', columnClasses[columns])}>
          {items.map((item, _idx) => {
            const itemKey = item.id != null ? String(item.id) : `idx-${_idx}`;
            const imageUrl = item[imageKey] as string;
            const isUploading = uploadingIds.has(item.id);
            const isUrlMode = urlModeIds.has(item.id);
            const isDraggedItem = draggedItemId === item.id;
            const isDragOverItem = dragOverItemId === item.id && draggedItemId !== null;
            const isFileDragOver = fileDragOverItemId === item.id;
            const isBroken = brokenImageUrls.get(item.id) === imageUrl;
            const itemCropAspectRatio = resolveCropAspectRatio(item, _idx);
            const itemCropRatioLabel = getProductImageAspectRatioLabel(itemCropAspectRatio);

            // Vertical layout - card style với ảnh trên, input bên dưới
            if (layout === 'vertical') {
              return (
                <div
                  key={itemKey}
                  draggable={showReorder}
                  onDragStart={(e) =>{  handleItemDragStart(e, item.id); }}
                  onDragEnd={handleItemDragEnd}
                  onDragOver={(e) =>{  handleItemDragOver(e, item.id); }}
                  onDrop={(e) =>{  handleItemDrop(e, item.id); }}
                  className={cn(
                    "bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden transition-all duration-200",
                    isDragOverItem && "ring-2 ring-blue-500 ring-offset-2 scale-[1.02]",
                    isDraggedItem && "opacity-50 scale-95",
                    showReorder && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  {/* Image area */}
                  <div
                    className={cn(
                      'relative w-full rounded-t-lg overflow-hidden border-2 border-b-0 transition-all duration-200',
                      isFileDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-slate-200 dark:border-slate-700',
                      imageFit === 'contain' && !isFileDragOver && 'bg-white dark:bg-slate-950',
                      aspectClasses[aspectRatio],
                      !isUrlMode && 'cursor-pointer hover:border-blue-400'
                    )}
                    style={resolvedImageAspectRatio ? { aspectRatio: resolvedImageAspectRatio } : undefined}
                    onClick={() => !isUploading && !isUrlMode && inputRefs.current.get(item.id)?.click()}
                    onDragEnter={(e) =>{  handleItemFileDragEnter(e, item.id); }}
                    onDragLeave={handleItemFileDragLeave}
                    onDragOver={(e) =>{  handleItemFileDragOver(e, item.id); }}
                    onDrop={(e) =>{  handleItemFileDrop(e, item.id); }}
                  >
                    {imageUrl && !isBroken ? (
                      allowVideoUrl && isVideoUrl(imageUrl) ? (
                        renderVideoPreview(imageUrl, isFileDragOver ? 'opacity-50' : undefined)
                      ) : (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className={cn(imageClassName, isFileDragOver && "opacity-50")}
                        onError={() => markBroken(item.id, imageUrl)}
                      />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 p-2 text-center text-slate-400">
                        {isBroken ? (
                          <div className="text-red-500 flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold">Lỗi tải ảnh</span>
                            <span className="text-[9px] break-all max-w-[100px] line-clamp-1">{imageUrl ? new URL(imageUrl).hostname : ''}</span>
                          </div>
                        ) : (
                          <ImageIcon size={32} />
                        )}
                      </div>
                    )}
                    {isFileDragOver && (
                      <div className="absolute inset-0 bg-blue-500/20 flex flex-col items-center justify-center">
                        <Upload size={24} className="text-blue-600 mb-1" />
                        <span className="text-sm font-medium text-blue-600">Thả ảnh</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                      </div>
                    )}
                    {/* Reorder & Delete buttons overlay */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between">
                      {showReorder && (
                        <div className="bg-white/90 dark:bg-slate-800/90 rounded p-1">
                          <GripVertical size={16} className="text-slate-500" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/90 dark:bg-slate-800/90 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); void handleRemove(item.id); }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <input
                      ref={(el) => { if (el) {inputRefs.current.set(item.id, el);} }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleSelectedFile(item.id, file);
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Bottom area: fields */}
                  <div className="p-3 space-y-2 border-2 border-t-0 border-slate-200 dark:border-slate-700 rounded-b-lg">
                    <div className="flex flex-wrap gap-1">
                      <ImageSourceActions
                        mode={isUrlMode ? 'url' : 'upload'}
                        onUpload={() => {
                          if (isUrlMode) {
                            toggleUrlMode(item.id);
                          }
                          inputRefs.current.get(item.id)?.click();
                        }}
                        onUrl={() => {
                          if (!isUrlMode) {
                            toggleUrlMode(item.id);
                          }
                        }}
                        onPaste={() => handlePasteImage(item.id)}
                        onCrop={enableCrop ? () => { void handleCropExistingImage(item.id, imageUrl); } : undefined}
                        cropLabel={itemCropRatioLabel}
                        cropDisabled={!imageUrl || isVideoUrl(imageUrl)}
                        iconSize={10}
                        className="gap-1"
                      />
                      {enableImageEditor && imageUrl && !isVideoUrl(imageUrl) && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditItemId(item.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300"
                          title="Chỉnh sửa logo: crop hoặc xóa nền"
                        >
                          <Pencil size={10} /> Sửa / xóa nền
                        </button>
                      )}
                    </div>
                    {isUrlMode && (
                      <Input
                        value={imageUrl}
                        onChange={(e) =>{  handleUrlChange(item.id, e.target.value); }}
                        placeholder="https://example.com/image.jpg"
                        className="h-8 text-sm"
                      />
                    )}
                    {extraFields.map((field) => (
                      <Input
                        key={String(field.key)}
                        value={String(item[field.key] || '')}
                        onChange={(e) =>{  handleExtraFieldChange(item.id, field.key, e.target.value); }}
                        placeholder={field.placeholder}
                        className="h-9 text-sm"
                      />
                    ))}
                  </div>
                </div>
              );
            }

            // Horizontal layout (default) - ảnh bên trái, fields bên phải
            return (
              <div
                key={itemKey}
                draggable={showReorder}
                onDragStart={(e) =>{  handleItemDragStart(e, item.id); }}
                onDragEnd={handleItemDragEnd}
                onDragOver={(e) =>{  handleItemDragOver(e, item.id); }}
                onDrop={(e) =>{  handleItemDrop(e, item.id); }}
                className={cn(
                  "bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-3 transition-all duration-200",
                  isDragOverItem && "ring-2 ring-blue-500 ring-offset-2 scale-[1.02]",
                  isDraggedItem && "opacity-50 scale-95",
                  showReorder && "cursor-grab active:cursor-grabbing"
                )}
              >
                {/* Image preview / upload area */}
                <div className="flex gap-3">
                  {showReorder && (
                    <div className="flex flex-col justify-center">
                      <GripVertical size={18} className="text-slate-400 hover:text-slate-600" />
                    </div>
                  )}

                  {/* Image drop zone - supports drag & drop files */}
                  <div
                    className={cn(
                      'relative flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all duration-200',
                      isFileDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-105 shadow-lg' 
                        : 'border-slate-200 dark:border-slate-700',
                      imageFit === 'contain' && !isFileDragOver && 'bg-white dark:bg-slate-950',
                      aspectClasses[aspectRatio],
                      !isUrlMode && 'cursor-pointer hover:border-blue-400'
                    )}
                    style={resolvedImageAspectRatio ? { aspectRatio: resolvedImageAspectRatio } : undefined}
                    onClick={() => !isUploading && !isUrlMode && inputRefs.current.get(item.id)?.click()}
                    onDragEnter={(e) =>{  handleItemFileDragEnter(e, item.id); }}
                    onDragLeave={handleItemFileDragLeave}
                    onDragOver={(e) =>{  handleItemFileDragOver(e, item.id); }}
                    onDrop={(e) =>{  handleItemFileDrop(e, item.id); }}
                  >
                    {imageUrl && !isBroken ? (
                      allowVideoUrl && isVideoUrl(imageUrl) ? (
                        renderVideoPreview(imageUrl, isFileDragOver ? 'opacity-50' : undefined)
                      ) : (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className={cn(imageClassName, isFileDragOver && "opacity-50")}
                        onError={() => markBroken(item.id, imageUrl)}
                      />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 p-2 text-center text-slate-400">
                        {isBroken ? (
                          <div className="text-red-500 flex flex-col items-center gap-0.5">
                            <span className="text-[10px] font-semibold leading-tight">Lỗi tải ảnh</span>
                            <span className="text-[8px] break-all max-w-[80px] line-clamp-1">{imageUrl ? new URL(imageUrl).hostname : ''}</span>
                          </div>
                        ) : (
                          <ImageIcon size={24} />
                        )}
                      </div>
                    )}
                    {/* File drag overlay */}
                    {isFileDragOver && (
                      <div className="absolute inset-0 bg-blue-500/20 flex flex-col items-center justify-center">
                        <Upload size={20} className="text-blue-600 mb-1" />
                        <span className="text-xs font-medium text-blue-600">Thả ảnh</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-blue-500" />
                      </div>
                    )}
                    <input
                      ref={(el) => { if (el) {inputRefs.current.set(item.id, el);} }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleSelectedFile(item.id, file);
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <ImageSourceActions
                        mode={isUrlMode ? 'url' : 'upload'}
                        onUpload={() => {
                          if (isUrlMode) {
                            toggleUrlMode(item.id);
                          }
                          inputRefs.current.get(item.id)?.click();
                        }}
                        onUrl={() => {
                          if (!isUrlMode) {
                            toggleUrlMode(item.id);
                          }
                        }}
                        onPaste={() => handlePasteImage(item.id)}
                        onCrop={enableCrop ? () => { void handleCropExistingImage(item.id, imageUrl); } : undefined}
                        cropLabel={itemCropRatioLabel}
                        cropDisabled={!imageUrl || isVideoUrl(imageUrl)}
                      />
                      {enableImageEditor && imageUrl && !isVideoUrl(imageUrl) && (
                        <button
                          type="button"
                          onClick={() => { setEditItemId(item.id); }}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300"
                          title="Chỉnh sửa logo: crop hoặc xóa nền"
                        >
                          <Pencil size={12} /> Sửa / xóa nền
                        </button>
                      )}
                    </div>

                    {isUrlMode && (
                      <Input
                        value={imageUrl}
                        onChange={(e) =>{  handleUrlChange(item.id, e.target.value); }}
                        placeholder="https://example.com/image.jpg"
                        className="h-8 text-sm"
                      />
                    )}

                    {/* Extra fields */}
                    {extraFields.map((field) => (
                      <Input
                        key={String(field.key)}
                        value={String(item[field.key] || '')}
                        onChange={(e) =>{  handleExtraFieldChange(item.id, field.key, e.target.value); }}
                        placeholder={field.placeholder}
                        className="h-8 text-sm"
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 flex-shrink-0"
                    onClick={ async () => handleRemove(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">{emptyText}</div>
      )}

      {/* Add button */}
      {items.length < maxItems && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="w-full gap-2">
            <Plus size={14} /> {addButtonText}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleAddUrl} className="w-full gap-2">
            <Link2 size={14} /> Thêm URL ảnh
          </Button>
        </div>
      )}
    </div>

    {isCropOpen && cropPreviewUrl && cropItemId !== null && (
      <ImageEditorDialog
        imageUrl={cropPreviewUrl}
        preferredCropAspectRatio={activeCropAspectRatio}
        onClose={resetCropState}
        onApply={(editedFile) => {
          const targetItemId = cropItemId;
          resetCropState();
          void handleFileUpload(targetItemId, editedFile);
        }}
      />
    )}
    {enableImageEditor && editedImageUrl && (
      <ImageEditorDialog
        imageUrl={editedImageUrl}
        onClose={() => setEditItemId(null)}
        onApply={(editedFile) => {
          const targetItemId = editItemId;
          setEditItemId(null);
          if (targetItemId !== null) {
            void handleFileUpload(targetItemId, editedFile);
          }
        }}
      />
    )}
    </>
  );
}

