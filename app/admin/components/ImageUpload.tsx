'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ClipboardPaste, ImageOff, Loader2, Pencil, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, cn } from './ui';
import { prepareImageForUpload, type ImageCropSelection, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext, type ImageNamingContext } from '@/lib/image/uploadNaming';
import { ImageEditorDialog } from './ImageEditorDialog';
import {
  DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  getProductImageAspectRatioCssValue,
  type ProductImageAspectRatio,
} from '@/lib/products/image-aspect-ratio';
import { useFileDraftUploads } from './useFileDraftUploads';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  onStorageIdChange?: (storageId?: Id<'_storage'>) => void;
  storageId?: Id<'_storage'>;
  folder?: string;
  naming?: ImageNamingContext;
  className?: string;
  enableCrop?: boolean;
  cropAspectRatio?: ProductImageAspectRatio;
  deleteMode?: 'immediate' | 'defer';
}

export function ImageUpload({
  value,
  onChange,
  onStorageIdChange,
  storageId,
  folder = 'products',
  naming,
  className,
  enableCrop = false,
  cropAspectRatio = DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  deleteMode = 'defer',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [currentStorageId, setCurrentStorageId] = useState<Id<'_storage'> | undefined>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const deleteImage = useMutation(api.storage.deleteImage);
  const { trackDraftUpload } = useFileDraftUploads(`image-upload:${folder}`);
  const inputId = useMemo(() => `image-upload-input-${Math.random().toString(36).slice(2, 9)}`, []);
  const isCropOpen = Boolean(cropFile && cropPreviewUrl);

  useEffect(() => {
    setHasError(false);
    setCurrentStorageId(storageId);
  }, [value, storageId]);

  useEffect(() => {
    return () => {
      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl);
      }
    };
  }, [cropPreviewUrl]);

  const handleUpload = useCallback(async (file: File, crop?: ImageCropSelection) => {
    setIsUploading(true);
    try {
      const resolvedNaming = resolveNamingContext(naming, { entityName: folder, field: 'image', index: 1 });
      const prepared = await prepareImageForUpload(file, crop ? { crop, naming: resolvedNaming } : { naming: resolvedNaming });
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        body: prepared.file,
        headers: { 'Content-Type': prepared.mimeType },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

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

      if (result.url) {
      setCurrentStorageId(storageId as Id<'_storage'>);
      onStorageIdChange?.(storageId as Id<'_storage'>);
        onChange(result.url);
        toast.success('Tải ảnh lên thành công');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, saveImage, folder, onChange, naming, onStorageIdChange, trackDraftUpload]);

  const resetCropState = useCallback(() => {
    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }
    setCropFile(null);
    setCropPreviewUrl(null);
  }, [cropPreviewUrl]);

  const openCropper = useCallback((file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }

    setCropFile(file);
    setCropPreviewUrl(URL.createObjectURL(file));
  }, [cropPreviewUrl]);

  const handleSelectedFile = useCallback((file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (enableCrop) {
      openCropper(file);
      return;
    }

    void handleUpload(file);
  }, [enableCrop, handleUpload, openCropper]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  }, [handleSelectedFile]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Đọc ảnh từ clipboard
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
          handleSelectedFile(file);
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
  }, [isUploading, handleSelectedFile]);

  const handleRemove = async () => {
    if (deleteMode === 'immediate' && currentStorageId) {
      try {
        await deleteImage({ storageId: currentStorageId as Id<'_storage'> });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
    onChange(undefined);
    onStorageIdChange?.(undefined);
    setCurrentStorageId(undefined);
  };

  if (value) {
    return (
      <>
      <div
        className={cn(enableCrop ? "relative w-full max-w-[320px]" : "relative h-40 w-full", className)}
        style={enableCrop ? { aspectRatio: getProductImageAspectRatioCssValue(cropAspectRatio) } : undefined}
      >
        {!hasError ? (
          <Image
            src={value}
            alt="Uploaded"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover rounded-lg border border-slate-200 dark:border-slate-700"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <ImageOff size={24} />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 shadow-sm"
            title="Cắt / Xoá nền"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditorOpen(true);
            }}
          >
            <Pencil size={14} className="text-slate-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleRemove();
            }}
          >
            <X size={16} className="text-red-500" />
          </Button>
        </div>
      </div>
      {/* Image Editor Dialog (Crop + Remove BG) */}
      {isEditorOpen && (
        <ImageEditorDialog
          imageUrl={value}
          onClose={() => setIsEditorOpen(false)}
          onApply={(editedFile) => {
            setIsEditorOpen(false);
            void handleUpload(editedFile);
          }}
        />
      )}
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6",
          "flex flex-col items-center justify-center cursor-pointer",
          "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
          isUploading && "pointer-events-none opacity-50",
          className
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => {
          const input = document.getElementById(inputId) as HTMLInputElement | null;
          input?.click();
        }}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading ? (
          <>
            <Loader2 size={24} className="text-orange-500 animate-spin mb-2" />
            <span className="text-sm text-slate-500">Đang tải lên...</span>
          </>
        ) : (
          <>
            <Upload size={24} className="text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">Kéo thả hoặc click để tải lên</span>
            <span className="text-xs text-slate-400 mt-1">Tối đa 5MB, nén 85%</span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={handleClipboardPaste}
        disabled={isUploading}
        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 disabled:opacity-50"
        title="Copy ảnh rồi click vào đây"
      >
        <ClipboardPaste size={14} /> Dán ảnh từ clipboard
      </button>

      {isCropOpen && cropPreviewUrl && (
        <ImageEditorDialog
          imageUrl={cropPreviewUrl}
          preferredCropAspectRatio={cropAspectRatio}
          onClose={resetCropState}
          onApply={(editedFile) => {
            resetCropState();
            void handleUpload(editedFile);
          }}
        />
      )}
    </>
  );
}

