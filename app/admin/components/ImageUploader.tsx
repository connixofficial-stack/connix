'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ClipboardPaste, Link2, Loader2, Pencil, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, cn } from './ui';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext, type ImageNamingContext } from '@/lib/image/uploadNaming';
import { ImageEditorDialog } from './ImageEditorDialog';
import { useFileDraftUploads } from './useFileDraftUploads';
import type { ImageAspectRatioInput } from '@/lib/products/image-aspect-ratio';

type InputMode = 'upload' | 'url';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined, storageId?: Id<'_storage'>) => void;
  storageId?: Id<'_storage'>;
  folder?: string;
  naming?: ImageNamingContext;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  cropAspectRatio?: ImageAspectRatioInput;
  quality?: number;
  deleteMode?: 'immediate' | 'defer';
}

export function ImageUploader({
  value,
  onChange,
  storageId,
  folder = 'general',
  naming,
  className,
  aspectRatio = 'auto',
  cropAspectRatio,
  quality = 0.85,
  deleteMode = 'immediate',
}: ImageUploaderProps) {
  const [mode, setMode] = useState<InputMode>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const [hasError, setHasError] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const deleteImage = useMutation(api.storage.deleteImage);
  const { trackDraftUpload } = useFileDraftUploads(`image-uploader:${folder}`);
  
  const [currentStorageId, setCurrentStorageId] = useState<Id<'_storage'> | undefined>();

  // Sync preview with value prop when it changes
  useEffect(() => {
    setPreview(value);
    setHasError(false);
    setCurrentStorageId(storageId);
    if (value && !value.includes('convex.cloud')) {
      setUrlInput(value);
    }
  }, [value, storageId]);

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const resolvedNaming = resolveNamingContext(naming, { entityName: folder, field: 'image', index: 1 });
      const prepared = await prepareImageForUpload(file, { quality, naming: resolvedNaming });
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

      setPreview(result.url ?? undefined);
      setCurrentStorageId(storageId as Id<'_storage'>);
      onChange(result.url ?? undefined, storageId as Id<'_storage'>);
      toast.success('Tải ảnh lên thành công');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, saveImage, folder, quality, onChange, naming, trackDraftUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {void handleFileSelect(file);}
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {void handleFileSelect(file);}
  }, [handleFileSelect]);

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
          void handleFileSelect(file);
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
  }, [isUploading, handleFileSelect]);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) return;
    try { new URL(urlInput); } catch {
      if (!urlInput.startsWith('/')) { toast.error('URL không hợp lệ'); return; }
    }
    setPreview(urlInput);
    setCurrentStorageId(undefined);
    onChange(urlInput, undefined);
    toast.success('Đã cập nhật URL');
  }, [urlInput, onChange]);

  const handleRemove = useCallback(async () => {
    if (deleteMode === 'immediate' && currentStorageId) {
      try {
        await deleteImage({ storageId: currentStorageId as Id<"_storage"> });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
    setPreview(undefined);
    setUrlInput('');
    setCurrentStorageId(undefined);
    onChange(undefined, undefined);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [currentStorageId, deleteImage, deleteMode, onChange]);

  const aspectClasses = {
    auto: 'min-h-[160px]',
    square: 'aspect-square',
    video: 'aspect-video',
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Mode Toggle + Clipboard */}
      <div className="flex items-center gap-1.5">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5',
              mode === 'upload'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Upload size={12} /> Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5',
              mode === 'url'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Link2 size={12} /> URL
          </button>
        </div>
        <button
          type="button"
          onClick={handleClipboardPaste}
          disabled={isUploading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 disabled:opacity-50"
          title="Copy ảnh rồi click vào đây"
        >
          <ClipboardPaste size={12} /> Dán
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlSubmit(); } }}
          />
          <Button type="button" variant="outline" onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
            Áp dụng
          </Button>
        </div>
      )}

      {/* Preview / Upload area */}
      {preview ? (
        <div className={cn('relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700', aspectClasses[aspectRatio])}>
          {!hasError ? (
            <Image
              src={preview}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              onError={() => { setHasError(true); }}
            />
          ) : null}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex gap-2">
              {mode === 'upload' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => inputRef.current?.click()}
                  className="h-10 w-10"
                  title="Đổi ảnh"
                >
                  <Upload size={18} />
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setIsEditorOpen(true)}
                className="h-10 w-10"
                title="Cắt / Xoá nền"
              >
                <Pencil size={18} />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                className="h-10 w-10"
                title="Xóa ảnh"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          )}
        </div>
      ) : (mode === 'upload' ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); }}
          className={cn(
            'border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
            aspectClasses[aspectRatio],
            isUploading && 'pointer-events-none'
          )}
        >
          {isUploading ? (
            <Loader2 size={24} className="animate-spin text-slate-400 mb-2" />
          ) : (
            <Upload size={24} className="text-slate-400 mb-2" />
          )}
          <span className="text-sm text-slate-500">
            {isUploading ? 'Đang tải lên...' : 'Kéo thả hoặc click để tải lên'}
          </span>
          <span className="text-xs text-slate-400 mt-1">PNG, JPG tối đa 5MB</span>
        </div>
      ) : null)}

      {/* Image Editor Dialog (Crop + Remove BG) */}
      {isEditorOpen && preview && (
        <ImageEditorDialog
          imageUrl={preview}
          preferredCropAspectRatio={cropAspectRatio}
          onClose={() => setIsEditorOpen(false)}
          onApply={(editedFile) => {
            setIsEditorOpen(false);
            void handleFileSelect(editedFile);
          }}
        />
      )}
    </div>
  );
}

// Simple version without database tracking (for Lexical editor)
export async function uploadImageToStorage(
  file: File,
  generateUploadUrl: () => Promise<string>,
  quality: number = 0.85
): Promise<{ storageId: string; url: string }> {
  const prepared = await prepareImageForUpload(file, { quality });

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
  return { storageId, url: '' };
}
