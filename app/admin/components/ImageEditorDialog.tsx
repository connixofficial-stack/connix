'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Crop as CropIcon,
  Eraser,
  Loader2,
  RotateCcw,
  Check,
  Sparkles,
  X,
  PaintBucket,
  Minimize2,
} from 'lucide-react';
import { Button, cn } from './ui';
import { toast } from 'sonner';
import { startRemoveBg, type RemoveBgHandle, type RemoveBgMode } from '@/lib/image/removeBgWorker';
import { detectSmartLogoCropBox } from '@/lib/image/logoSmartCrop';
import {
  getProductImageAspectRatioLabel,
  getProductImageAspectRatioValue,
  type ImageAspectRatioInput,
} from '@/lib/products/image-aspect-ratio';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getExtensionFromMime(mime: string): string {
  if (!mime) return 'UNKNOWN';
  const parts = mime.split('/');
  if (parts.length > 1) {
    const ext = parts[1].toLowerCase();
    if (ext === 'jpeg') return 'JPG';
    return ext.toUpperCase();
  }
  return mime.toUpperCase();
}

async function compressImageToWebP(
  imageBlobOrUrl: Blob | string,
  quality = 1.0,
): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Không thể khởi tạo Canvas Context 2D'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Lỗi xuất ảnh WebP từ Canvas'));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        },
        'image/webp',
        quality,
      );
    };
    img.onerror = (err) => {
      reject(err);
    };
    if (typeof imageBlobOrUrl === 'string') {
      img.src = imageBlobOrUrl;
    } else {
      img.src = URL.createObjectURL(imageBlobOrUrl);
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ImageEditorDialogProps = {
  /** URL ảnh gốc đang hiển thị (Convex URL hoặc external) */
  imageUrl: string;
  /** Callback khi user apply ảnh đã chỉnh sửa – trả về File mới */
  onApply: (editedFile: File) => void;
  /** Đóng dialog */
  onClose: () => void;
  preferredCropAspectRatio?: ImageAspectRatioInput;
  enableSmartLogoCrop?: boolean;
};

type EditorTab = 'crop' | 'removebg' | 'addbg' | 'compress';

type CropRatio = {
  label: string;
  value: number | undefined;
};

const CROP_RATIOS: CropRatio[] = [
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:3', value: 4 / 3 },
  { label: 'Tự do', value: undefined },
];

const SMART_CROP_PADDING_RATIO = 0.08;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Lấy crop pixel chính xác từ ảnh hiển thị → canvas output.
 */
function getCroppedCanvas(
  image: HTMLImageElement,
  crop: PixelCrop,
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Scale giữa natural size và display size
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.round(crop.width * scaleX);
  canvas.height = Math.round(crop.height * scaleY);

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas;
}

/**
 * Fetch ảnh từ URL → Blob
 */
async function fetchImageAsBlob(url: string): Promise<Blob> {
  const normalizedUrl = url.trim();
  if (!normalizedUrl) {
    throw new Error('URL ảnh trống');
  }

  const res = await fetch(normalizedUrl);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? 'Không tìm thấy ảnh. Ảnh có thể đã bị xóa hoặc URL không còn hợp lệ.'
        : `Fetch ảnh thất bại: ${res.status}`,
    );
  }

  const blob = await res.blob();
  const mimeType = blob.type ? blob.type.toLowerCase() : '';
  if (mimeType && !mimeType.startsWith('image/') && mimeType !== 'application/octet-stream') {
    throw new Error('URL không trả về file ảnh hợp lệ');
  }

  return blob;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function makeCenteredAspectCrop(image: HTMLImageElement, aspect: number): Crop {
  const imageAspect = image.naturalWidth / image.naturalHeight;
  const width = imageAspect > aspect ? 80 * (aspect / imageAspect) : 80;
  const height = imageAspect > aspect ? 80 : 80 * (imageAspect / aspect);

  return {
    height,
    unit: '%',
    width,
    x: (100 - width) / 2,
    y: (100 - height) / 2,
  };
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ImageEditorDialog({
  imageUrl,
  onApply,
  onClose,
  preferredCropAspectRatio,
  enableSmartLogoCrop = true,
}: ImageEditorDialogProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('crop');
  const preferredCropRatio = preferredCropAspectRatio
    ? {
      label: getProductImageAspectRatioLabel(preferredCropAspectRatio),
      value: getProductImageAspectRatioValue(preferredCropAspectRatio),
    }
    : undefined;
  const cropRatios = preferredCropRatio && !CROP_RATIOS.some((ratio) => ratio.value === preferredCropRatio.value)
    ? [preferredCropRatio, ...CROP_RATIOS]
    : CROP_RATIOS;

  // Crop state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [cropAspect, setCropAspect] = useState<number | undefined>(preferredCropRatio?.value);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Remove BG state
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [removeBgProgress, setRemoveBgProgress] = useState(0);
  const [removeBgStage, setRemoveBgStage] = useState('');
  const [removedBgUrl, setRemovedBgUrl] = useState<string | null>(null);
  const [removedBgBlob, setRemovedBgBlob] = useState<Blob | null>(null);
  const removeBgHandleRef = useRef<RemoveBgHandle | null>(null);

  const [isSmartCropping, setIsSmartCropping] = useState(false);
  const [smartCropProgress, setSmartCropProgress] = useState(0);
  const [smartCropStage, setSmartCropStage] = useState('');

  // Add BG state
  type BgOption = 'transparent' | 'white' | 'black' | 'light-gray' | 'gradient';
  type CanvasAspectOption = 'original' | '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
  const [selectedBg, setSelectedBg] = useState<BgOption>('transparent');
  const [canvasAspect, setCanvasAspect] = useState<CanvasAspectOption>('original');

  // Shared
  const [isApplying, setIsApplying] = useState(false);

  // Metadata of the image being displayed
  const [imageMeta, setImageMeta] = useState<{ size: number; type: string } | null>(null);

  // Fetch metadata of original image
  useEffect(() => {
    let isMounted = true;
    if (!imageUrl) return;

    fetchImageAsBlob(imageUrl)
      .then((blob) => {
        if (isMounted) {
          setImageMeta({
            size: blob.size,
            type: blob.type,
          });
        }
      })
      .catch((err) => {
        console.error('[ImageEditor] Failed to fetch image metadata:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  const currentMeta = ((activeTab === 'removebg' || activeTab === 'compress') && removedBgBlob)
    ? { size: removedBgBlob.size, type: removedBgBlob.type }
    : imageMeta;

  const renderImageMetaInfo = () => {
    if (!currentMeta) return null;
    return (
      <div className="mt-2 text-center">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 inline-flex items-center gap-1.5 shadow-sm">
          <span>Định dạng: <strong className="text-slate-700 dark:text-slate-200">{getExtensionFromMime(currentMeta.type)}</strong></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>Dung lượng: <strong className="text-slate-700 dark:text-slate-200">{formatBytes(currentMeta.size)}</strong></span>
        </span>
      </div>
    );
  };

  // Cleanup blob URL + cancel on unmount
  useEffect(() => {
    return () => {
      if (removedBgUrl) URL.revokeObjectURL(removedBgUrl);
      removeBgHandleRef.current?.cancel();
    };
  }, [removedBgUrl]);

  // Compress state & handler
  const [isCompressing, setIsCompressing] = useState(false);

  const handleCompressToWebP = useCallback(async (quality: number) => {
    if (isCompressing) return;
    setIsCompressing(true);

    const source = removedBgBlob || imageUrl;
    const isLossless = quality === 1.0;

    try {
      const modeText = isLossless ? 'đẹp 100%' : 'giảm mạnh 90%';
      toast.loading(`Đang nén ảnh sang WebP (${modeText})...`);
      const result = await compressImageToWebP(source, quality);

      setRemovedBgUrl((prev) => {
        if (prev && prev !== imageUrl) URL.revokeObjectURL(prev);
        return result.url;
      });
      setRemovedBgBlob(result.blob);
      toast.dismiss();
      toast.success(`Nén ảnh WebP (${modeText}) thành công!`);
    } catch (err) {
      console.error('[WebP Compress] Error:', err);
      toast.dismiss();
      toast.error('Không thể nén ảnh sang WebP. Vui lòng thử lại.');
    } finally {
      setIsCompressing(false);
    }
  }, [imageUrl, removedBgBlob, isCompressing]);

  /* ---- Crop handlers ---- */

  const handleSetCropAspect = useCallback((aspect: number | undefined) => {
    setCropAspect(aspect);
    setCompletedCrop(undefined);
    if (!aspect || !imgRef.current) {
      return;
    }
    setCrop(makeCenteredAspectCrop(imgRef.current, aspect));
  }, []);

  const handleCropImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = event.currentTarget;
    if (cropAspect) {
      setCrop(makeCenteredAspectCrop(event.currentTarget, cropAspect));
    }
  }, [cropAspect]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
      toast.error('Chưa chọn vùng cắt');
      return;
    }

    setIsApplying(true);
    try {
      const canvas = getCroppedCanvas(imgRef.current, completedCrop);
      if (!canvas) {
        toast.error('Không thể tạo ảnh cắt');
        return;
      }

      canvas.toBlob(
        (blob) => {
          setIsApplying(false);
          if (!blob) {
            toast.error('Không thể tạo ảnh cắt');
            return;
          }
          const file = new File([blob], `logo-cropped-${Date.now()}.png`, {
            type: 'image/png',
          });
          onApply(file);
        },
        'image/png',
        1,
      );
    } catch {
      setIsApplying(false);
      toast.error('Lỗi khi cắt ảnh');
    }
  }, [completedCrop, onApply]);

  /* ---- Remove BG handlers ---- */

  const handleRemoveBg = useCallback(async (mode: RemoveBgMode) => {
    if (isRemovingBg) return;
    setIsRemovingBg(true);
    setRemoveBgProgress(0);
    setRemoveBgStage(mode === 'advanced' ? 'Đang tải ảnh cho chế độ nâng cao...' : 'Đang tải ảnh...');

    try {
      const imageBlob = await fetchImageAsBlob(imageUrl);

      const handle = startRemoveBg(imageBlob, {
        onProgress: (stage, percent) => {
          setRemoveBgStage(stage);
          setRemoveBgProgress(percent);
        },
        onDone: (blob) => {
          const url = URL.createObjectURL(blob);
          setRemovedBgUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
          setRemovedBgBlob(blob);
          setIsRemovingBg(false);
          setRemoveBgProgress(100);
          removeBgHandleRef.current = null;
          toast.success('Xóa nền thành công!');
        },
        onError: (error) => {
          console.error('[RemoveBG] Error:', error);
          toast.error('Không thể xóa nền ảnh. Vui lòng thử lại.');
          setIsRemovingBg(false);
          setRemoveBgProgress(0);
          removeBgHandleRef.current = null;
        },
      }, {
        mode,
      });

      removeBgHandleRef.current = handle;
    } catch (err) {
      console.error('[RemoveBG] Fetch error:', err);
      toast.error(getErrorMessage(err, 'Không thể tải ảnh để xử lý.'));
      setIsRemovingBg(false);
      setRemoveBgProgress(0);
    }
  }, [imageUrl, isRemovingBg]);

  const handleCancelRemoveBg = useCallback(() => {
    removeBgHandleRef.current?.cancel();
    removeBgHandleRef.current = null;
    setIsRemovingBg(false);
    setRemoveBgProgress(0);
    setRemoveBgStage('');
  }, []);

  const handleApplyRemovedBg = useCallback(() => {
    if (!removedBgBlob) {
      toast.error('Chưa thực hiện chỉnh sửa');
      return;
    }

    const isWebP = removedBgBlob.type === 'image/webp';
    const ext = isWebP ? 'webp' : 'png';
    const mime = isWebP ? 'image/webp' : 'image/png';

    const file = new File(
      [removedBgBlob],
      `logo-edited-${Date.now()}.${ext}`,
      { type: mime },
    );
    onApply(file);
  }, [removedBgBlob, onApply]);

  const handleResetRemoveBg = useCallback(() => {
    if (removedBgUrl) URL.revokeObjectURL(removedBgUrl);
    setRemovedBgUrl(null);
    setRemovedBgBlob(null);
    setRemoveBgProgress(0);
    setRemoveBgStage('');
  }, [removedBgUrl]);

  /* ---- Smart crop handlers ---- */

  const handleSmartCrop = useCallback(async (paddingRatio = 0) => {
    if (isSmartCropping || !imgRef.current) return;

    setIsSmartCropping(true);
    setSmartCropProgress(3);
    setSmartCropStage('Đang tải ảnh để auto crop...');

    try {
      const imageBlob = await fetchImageAsBlob(imageUrl);
      const sourceFile = new File([imageBlob], `smart-crop-source-${Date.now()}.png`, {
        type: imageBlob.type || 'image/png',
      });
      const box = await detectSmartLogoCropBox(sourceFile, {
        onProgress: ({ percent, stage }) => {
          setSmartCropProgress(percent);
          setSmartCropStage(stage);
        },
        useModelFallback: true,
      });
      if (!box || !imgRef.current) {
        toast.error('Không tìm thấy vùng crop phù hợp.');
        return;
      }

      const image = imgRef.current;
      const boxWidth = box.right - box.left + 1;
      const boxHeight = box.bottom - box.top + 1;
      const paddingX = boxWidth * paddingRatio;
      const paddingY = boxHeight * paddingRatio;
      const left = Math.max(0, box.left - paddingX);
      const top = Math.max(0, box.top - paddingY);
      const right = Math.min(image.naturalWidth - 1, box.right + paddingX);
      const bottom = Math.min(image.naturalHeight - 1, box.bottom + paddingY);
      const width = right - left + 1;
      const height = bottom - top + 1;
      const nextCrop: Crop = {
        height: (height / image.naturalHeight) * 100,
        unit: '%',
        width: (width / image.naturalWidth) * 100,
        x: (left / image.naturalWidth) * 100,
        y: (top / image.naturalHeight) * 100,
      };
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const nextCompletedCrop: PixelCrop = {
        height: height / scaleY,
        unit: 'px',
        width: width / scaleX,
        x: left / scaleX,
        y: top / scaleY,
      };

      setCropAspect(undefined);
      setCrop(nextCrop);
      setCompletedCrop(nextCompletedCrop);
      setSmartCropProgress(100);
      const successMessage = paddingRatio > 0
        ? 'Đã căn vùng crop có padding'
        : 'Đã căn vùng crop sát chủ thể';
      setSmartCropStage(successMessage);
      toast.success(successMessage);
    } catch (error) {
      console.error('[SmartCrop] Error:', error);
      toast.error(getErrorMessage(error, 'Không thể auto crop logo. Vui lòng thử lại.'));
      setSmartCropProgress(0);
      setSmartCropStage('');
    } finally {
      setIsSmartCropping(false);
    }
  }, [imageUrl, isSmartCropping]);

  /* ---- Add BG handlers ---- */

  const handleApplyAddBg = useCallback(async () => {
    setIsApplying(true);
    try {
      const imageBlob = await fetchImageAsBlob(imageUrl);
      const img = new window.Image();
      const url = URL.createObjectURL(imageBlob);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      let targetW = img.width;
      let targetH = img.height;

      if (canvasAspect !== 'original') {
        const [w, h] = canvasAspect.split(':').map(Number);
        const targetAspect = w / h;
        const imgAspect = img.width / img.height;

        if (imgAspect < targetAspect) {
          targetH = img.height;
          targetW = img.height * targetAspect;
        } else {
          targetW = img.width;
          targetH = img.width / targetAspect;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');

      if (selectedBg === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (selectedBg === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (selectedBg === 'light-gray') {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (selectedBg === 'gradient') {
        const gradient = ctx.createLinearGradient(0, 0, targetW, targetH);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, targetW, targetH);
      }

      const x = (targetW - img.width) / 2;
      const y = (targetH - img.height) / 2;
      ctx.drawImage(img, x, y);

      URL.revokeObjectURL(url);

      const isTransparent = selectedBg === 'transparent';
      const mimeType = isTransparent ? 'image/png' : 'image/jpeg';
      const ext = isTransparent ? 'png' : 'jpg';

      canvas.toBlob((blob) => {
        setIsApplying(false);
        if (!blob) {
          toast.error('Không thể tạo ảnh');
          return;
        }
        const file = new File([blob], `addbg-${Date.now()}.${ext}`, { type: mimeType });
        onApply(file);
      }, mimeType, 0.95);

    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Lỗi khi thêm nền'));
      setIsApplying(false);
    }
  }, [imageUrl, canvasAspect, selectedBg, onApply]);

  /* ---- Render ---- */

  const tabs: { key: EditorTab; label: string; icon: React.ReactNode }[] = [
    { key: 'crop', label: 'Cắt ảnh', icon: <CropIcon size={15} /> },
    { key: 'removebg', label: 'Xóa nền', icon: <Eraser size={15} /> },
    { key: 'addbg', label: 'Thêm nền', icon: <PaintBucket size={15} /> },
    { key: 'compress', label: 'Giảm dung lượng ảnh', icon: <Minimize2 size={15} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Chỉnh sửa ảnh
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-5 py-4">
          {activeTab === 'crop' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Kéo chuột trên ảnh để chọn vùng cần giữ lại, hoặc chọn nhanh tỉ lệ khung bên dưới.
              </p>
              <div className="flex flex-wrap gap-2">
                {enableSmartLogoCrop && (
                  <>
                    <button
                      type="button"
                      onClick={() => { void handleSmartCrop(); }}
                      disabled={isSmartCropping}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                        'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-950/30 dark:text-blue-300',
                      )}
                    >
                      {isSmartCropping ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Sparkles size={13} />
                      )}
                      Auto crop
                    </button>
                    <button
                      type="button"
                      onClick={() => { void handleSmartCrop(SMART_CROP_PADDING_RATIO); }}
                      disabled={isSmartCropping}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                        'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                      )}
                    >
                      {isSmartCropping ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Sparkles size={13} />
                      )}
                      Auto crop + padding
                    </button>
                  </>
                )}
                {cropRatios.map((ratio) => {
                  const selected = cropAspect === ratio.value;
                  return (
                    <button
                      key={ratio.label}
                      type="button"
                      onClick={() => handleSetCropAspect(ratio.value)}
                      className={cn(
                        'rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                        selected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                      )}
                    >
                      {ratio.label}
                    </button>
                  );
                })}
              </div>
              {isSmartCropping && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{smartCropStage || 'Đang auto crop ảnh...'}</span>
                    <span className="font-mono">{smartCropProgress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${smartCropProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                <ReactCrop
                  aspect={cropAspect}
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Chỉnh sửa"
                    className="max-h-[50vh] rounded"
                    crossOrigin="anonymous"
                    onLoad={handleCropImageLoad}
                  />
                </ReactCrop>
              </div>
              {renderImageMetaInfo()}
            </div>
          )}

          {activeTab === 'removebg' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                AI sẽ tự động nhận diện và tách vật thể/logo ra khỏi nền bằng mô hình học sâu chính xác cao.
              </p>

              <div className="flex justify-center bg-[repeating-conic-gradient(#e2e8f0_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#334155_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] rounded-lg p-3 min-h-[200px] items-center">
                {removedBgUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={removedBgUrl}
                    alt="Ảnh đã xóa nền"
                    className="max-h-[50vh] rounded"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl}
                    alt="Ảnh gốc"
                    className="max-h-[50vh] rounded"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              {renderImageMetaInfo()}

              {/* Progress bar khi đang xử lý */}
              {isRemovingBg && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" />
                      {removeBgStage || 'Đang tách nền...'}
                    </span>
                    <span className="font-mono">{removeBgProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${removeBgProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelRemoveBg}
                      className="text-xs text-slate-500"
                    >
                      <X size={14} className="mr-1" />
                      Hủy
                    </Button>
                  </div>
                </div>
              )}

              {!removedBgUrl && !isRemovingBg && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={() => handleRemoveBg('advanced')}
                    disabled={isRemovingBg}
                    className="gap-2"
                  >
                    <Eraser size={15} />
                    Xóa nền
                  </Button>
                </div>
              )}

              {removedBgUrl && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetRemoveBg}
                    className="gap-1.5 text-slate-500"
                  >
                    <RotateCcw size={14} />
                    Hoàn tác
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'addbg' && (
            <div className="space-y-6">
              <p className="text-xs text-slate-500">
                Thêm nền và điều chỉnh kích thước khung hình cho ảnh. Thích hợp cho ảnh đã có nền trong suốt.
              </p>

              <div className="flex justify-center bg-slate-50 dark:bg-slate-800/30 rounded-lg p-3">
                <div 
                  className={cn("relative flex items-center justify-center transition-all overflow-hidden", 
                    canvasAspect !== 'original' ? 'w-full max-w-[400px]' : '',
                    selectedBg === 'transparent' ? 'bg-[repeating-conic-gradient(#e2e8f0_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#334155_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]' : '',
                    selectedBg === 'white' ? 'bg-white border border-slate-200 dark:border-slate-700' : '',
                    selectedBg === 'black' ? 'bg-black' : '',
                    selectedBg === 'light-gray' ? 'bg-slate-100 dark:bg-slate-800' : '',
                    selectedBg === 'gradient' ? 'bg-gradient-to-br from-white to-slate-200 border border-slate-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700' : ''
                  )}
                  style={{
                    aspectRatio: canvasAspect !== 'original' ? canvasAspect.replace(':', '/') : undefined,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className={cn("max-h-[40vh] max-w-full", canvasAspect !== 'original' ? 'w-full h-full object-contain' : '')}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
              {renderImageMetaInfo()}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">Màu nền</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'transparent', label: 'Trong suốt' },
                      { id: 'white', label: 'Trắng' },
                      { id: 'black', label: 'Đen' },
                      { id: 'light-gray', label: 'Xám nhạt' },
                      { id: 'gradient', label: 'Gradient' }
                    ].map(bg => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setSelectedBg(bg.id as BgOption)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
                          selectedBg === bg.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        )}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">Kích thước khung</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'original', label: 'Giữ nguyên' },
                      { id: '1:1', label: 'Vuông 1:1' },
                      { id: '16:9', label: '16:9' },
                      { id: '9:16', label: '9:16' },
                      { id: '3:4', label: '3:4' },
                      { id: '4:3', label: '4:3' }
                    ].map(aspect => (
                      <button
                        key={aspect.id}
                        type="button"
                        onClick={() => setCanvasAspect(aspect.id as CanvasAspectOption)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
                          canvasAspect === aspect.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        )}
                      >
                        {aspect.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compress' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Giảm dung lượng ảnh nhưng giữ nguyên 100% độ nét ban đầu và nền trong suốt.
              </p>

              <div className="flex justify-center bg-[repeating-conic-gradient(#e2e8f0_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#334155_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] rounded-lg p-3 min-h-[200px] items-center">
                {removedBgUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={removedBgUrl}
                    alt="Ảnh tối ưu"
                    className="max-h-[50vh] rounded"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl}
                    alt="Ảnh gốc"
                    className="max-h-[50vh] rounded"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              {renderImageMetaInfo()}

              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  onClick={() => handleCompressToWebP(1.0)}
                  disabled={isCompressing}
                  className="gap-2"
                >
                  {isCompressing ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Minimize2 size={15} />
                  )}
                  Nén WebP (Đẹp 100%)
                </Button>

                <Button
                  type="button"
                  onClick={() => handleCompressToWebP(0.9)}
                  disabled={isCompressing}
                  variant="outline"
                  className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30"
                >
                  {isCompressing ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Minimize2 size={15} />
                  )}
                  Nén WebP (Giảm mạnh 90%)
                </Button>

                {removedBgUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetRemoveBg}
                    className="gap-1.5 text-slate-500"
                  >
                    <RotateCcw size={14} />
                    Hoàn tác
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>

          {activeTab === 'crop' && (
            <Button
              type="button"
              onClick={handleApplyCrop}
              disabled={!completedCrop || isApplying}
              className="gap-1.5"
            >
              {isApplying ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              Áp dụng cắt
            </Button>
          )}

          {activeTab === 'removebg' && (
            <Button
              type="button"
              onClick={handleApplyRemovedBg}
              disabled={!removedBgBlob}
              className="gap-1.5"
            >
              <Check size={15} />
              Áp dụng xóa nền
            </Button>
          )}

          {activeTab === 'addbg' && (
            <Button
              type="button"
              onClick={handleApplyAddBg}
              disabled={isApplying}
              className="gap-1.5"
            >
              {isApplying ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              Áp dụng thêm nền
            </Button>
          )}

          {activeTab === 'compress' && (
            <Button
              type="button"
              onClick={handleApplyRemovedBg}
              disabled={!removedBgBlob}
              className="gap-1.5"
            >
              <Check size={15} />
              Áp dụng tối ưu
            </Button>
          )}

        </div>
      </div>
    </div>
  );
}
