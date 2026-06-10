'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, cn } from './ui';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext, type ImageNamingContext } from '@/lib/image/uploadNaming';
import { ImageEditorDialog } from './ImageEditorDialog';
import { useFileDraftUploads } from './useFileDraftUploads';
import { getProductImageAspectRatioLabel, type ImageAspectRatioInput } from '@/lib/products/image-aspect-ratio';
import { ImageSourceActions } from './ImageSourceActions';

type InputMode = 'upload' | 'url';

interface SettingsImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined, storageId?: Id<'_storage'> | null) => void;
  storageId?: Id<'_storage'> | null;
  folder?: string;
  naming?: ImageNamingContext;
  className?: string;
  label?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  cropAspectRatio?: ImageAspectRatioInput;
  smartLogoCrop?: boolean;
}

export function SettingsImageUploader({
  value,
  onChange,
  storageId: _storageId,
  folder = 'settings',
  naming,
  className,
  label,
  previewSize = 'md',
  cropAspectRatio,
  smartLogoCrop = false,
}: SettingsImageUploaderProps) {
  const [mode, setMode] = useState<InputMode>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState<string | undefined>(value);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convex mutations
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const { trackDraftUpload } = useFileDraftUploads(`settings-image-uploader:${folder}`);

  useEffect(() => {
    setPreview(value);
    // If value is external URL, set to URL mode
    if (value && !value.includes('convex.cloud')) {
      setMode('url');
      setUrlInput(value);
    }
  }, [value]);

  const handleFileUpload = useCallback(async (file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const resolvedNaming = resolveNamingContext(naming, { entityName: folder, field: 'image', index: 1 });
      const prepared = await prepareImageForUpload(file, {
        naming: resolvedNaming,
        smartLogoCrop,
      });
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
      onChange(result.url ?? undefined, storageId as Id<'_storage'>);
      toast.success('Tải ảnh lên thành công');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, saveImage, folder, onChange, naming, smartLogoCrop, trackDraftUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {void handleFileUpload(file);}
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {void handleFileUpload(file);}
  }, [handleFileUpload]);

  // Đọc ảnh từ clipboard khi user click nút "Dán"
  const handleClipboardPaste = useCallback(async () => {
    if (isUploading) return;

    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File(
            [blob],
            `clipboard-${Date.now()}.${ext}`,
            { type: imageType },
          );
          void handleFileUpload(file);
          return;
        }
      }

      toast.error('Clipboard không có ảnh. Hãy copy ảnh trước.');
    } catch (err) {
      // Permission denied hoặc clipboard trống
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Trình duyệt chặn quyền đọc clipboard.');
      } else {
        toast.error('Không đọc được clipboard. Hãy copy ảnh trước.');
      }
    }
  }, [isUploading, handleFileUpload]);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) {return;}

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      if (!urlInput.startsWith('/')) {
        toast.error('URL không hợp lệ');
        return;
      }
    }

    setPreview(urlInput);
    onChange(urlInput, null);
    toast.success('Đã cập nhật URL');
  }, [urlInput, onChange]);

  const handleRemove = useCallback(() => {
    setPreview(undefined);
    setUrlInput('');
    onChange(undefined, null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onChange]);

  const previewSizes = {
    lg: 'w-32 h-32',
    md: 'w-24 h-24',
    sm: 'w-16 h-16',
  };
  const cropRatioLabel = cropAspectRatio ? getProductImageAspectRatioLabel(cropAspectRatio) : undefined;

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <ImageSourceActions
        mode={mode}
        onUpload={() => {
          setMode('upload');
          window.setTimeout(() => inputRef.current?.click(), 0);
        }}
        onUrl={() => setMode('url')}
        onPaste={handleClipboardPaste}
        onCrop={() => preview && setIsEditorOpen(true)}
        cropLabel={cropRatioLabel}
        cropDisabled={!preview || isUploading}
        disabled={isUploading}
        iconSize={14}
      />

      {/* Upload Mode */}
      {mode === 'upload' && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          {preview ? (
            <div className="flex items-start gap-4">
              <div className={cn('relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700', previewSizes[previewSize])}>
                <Image
                  src={preview}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 240px"
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23fef2f2" width="100" height="100"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%23ef4444" font-size="10" font-weight="bold">Ảnh lỗi</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" fill="%23991b1b" font-size="7">Hãy upload lại</text></svg>';
                  }}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload size={14} className="mr-1" />
                  Đổi ảnh
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 size={14} className="mr-1" />
                  Xóa
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !isUploading && inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all min-h-[120px]',
                isDragging
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
                isUploading && 'pointer-events-none opacity-60'
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
                  <span className="text-sm text-slate-500">Đang xử lý...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={24} className="text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">Kéo thả hoặc click để upload</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG, GIF → WebP 85%</span>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) =>{  setUrlInput(e.target.value); }}
              placeholder="https://example.com/image.png"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUrlSubmit();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
            >
              Áp dụng
            </Button>
          </div>

          {preview && (
            <div className="flex items-start gap-4">
              <div className={cn('relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700', previewSizes[previewSize])}>
                <Image
                  src={preview}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 240px"
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23fef2f2" width="100" height="100"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%23ef4444" font-size="10" font-weight="bold">Ảnh lỗi</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" fill="%23991b1b" font-size="7">Kiểm tra URL</text></svg>';
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 size={14} className="mr-1" />
                  Xóa
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Image Editor Dialog */}
      {isEditorOpen && preview && (
        <ImageEditorDialog
          imageUrl={preview}
          preferredCropAspectRatio={cropAspectRatio}
          onClose={() => setIsEditorOpen(false)}
          onApply={(editedFile) => {
            setIsEditorOpen(false);
            void handleFileUpload(editedFile);
          }}
        />
      )}
    </div>
  );
}

