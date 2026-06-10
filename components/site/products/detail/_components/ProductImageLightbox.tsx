'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ProductImageWithOverlayAuto } from '@/components/shared/ProductImageWithOverlay';

type ProductImageLightboxProps = {
  images: string[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (nextIndex: number) => void;
  useNativeImage?: boolean;
  overlayUrl?: string | null;
  fallbackSrc?: string | null;
};

export function ProductImageLightbox({
  images,
  currentIndex,
  open,
  onClose,
  onIndexChange,
  useNativeImage = false,
  overlayUrl: _overlayUrl,
  fallbackSrc,
}: ProductImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const hasImages = images.length > 0;
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(images.length - 1, 0));
  const hasMultiple = images.length > 1;
  const normalizedFallback = typeof fallbackSrc === 'string' && fallbackSrc.trim() ? fallbackSrc.trim() : null;
  const [currentSrc, setCurrentSrc] = useState<string | null>(images[safeIndex] ?? normalizedFallback);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setCurrentSrc(images[safeIndex] ?? normalizedFallback);
  }, [images, normalizedFallback, safeIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (!hasMultiple) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        onIndexChange((safeIndex - 1 + images.length) % images.length);
      }
      if (event.key === 'ArrowRight') {
        onIndexChange((safeIndex + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasMultiple, images.length, onClose, onIndexChange, open, safeIndex]);

  if (!open || !hasImages || !mounted) {
    return null;
  }

  const handlePrev = (event: React.MouseEvent) => {
    event.stopPropagation();
    onIndexChange((safeIndex - 1 + images.length) % images.length);
  };

  const handleNext = (event: React.MouseEvent) => {
    event.stopPropagation();
    onIndexChange((safeIndex + 1) % images.length);
  };

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/95" />
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 p-2 rounded-full border border-white/20 text-white/90 transition-colors z-[10000]"
        aria-label="Đóng"
      >
        <X size={24} />
      </button>
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 text-white/90 flex items-center justify-center transition-colors z-[10000]"
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 text-white/90 flex items-center justify-center transition-colors z-[10000]"
            aria-label="Ảnh sau"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm z-[10000] px-3 py-1 rounded-full border border-white/15 bg-white/10 text-white/90">
          {safeIndex + 1} / {images.length}
        </div>
      )}
      <div className="relative z-[10000] w-full max-w-5xl h-[80vh] px-4 flex items-center justify-center" onClick={event => event.stopPropagation()}>
        {/* ProductImageWithOverlayAuto: tự query config, scale cơ học như 1 bức ảnh */}
        <ProductImageWithOverlayAuto className="aspect-square w-full max-w-[80vh] max-h-[80vh] flex items-center justify-center">
          {useNativeImage ? (
            <img
              src={currentSrc ?? ''}
              alt={`Ảnh sản phẩm ${safeIndex + 1}`}
              className="w-full h-full object-contain rounded-lg"
              onError={() => { setCurrentSrc(currentSrc !== normalizedFallback ? normalizedFallback : null); }}
            />
          ) : currentSrc ? (
            <Image
              src={currentSrc}
              alt={`Ảnh sản phẩm ${safeIndex + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 80vh"
              className="object-contain rounded-lg"
              mode="primary"
              onError={() => { setCurrentSrc(currentSrc !== normalizedFallback ? normalizedFallback : null); }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/60">Không có ảnh sản phẩm</div>
          )}
        </ProductImageWithOverlayAuto>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
