'use client';

/**
 * ProductImageWithOverlay
 * -----------------------
 * Shared component bọc ảnh sản phẩm + khung viền (Frame) + watermark (chữ + hình).
 *
 * Nguyên lý "Flattened Image" (scale cơ học như 1 bức ảnh thống nhất):
 * - Container bọc ngoài thiết lập `container-type: inline-size` (Container Queries)
 * - Khung viền (Frame): `width: 100%` + `height: 100%` — ôm khít theo container
 * - Watermark hình: `width: X%`, `left: Y%`, `top: Z%` — tỷ lệ theo container
 * - Watermark chữ: `font-size: calc(N * 0.25cqw)` — tỷ lệ theo chiều rộng container
 * - Khoảng cách thưa chữ: `gap: 1.5em` — tỷ lệ theo font-size (đồng bộ tuyệt đối)
 * => Dù resize container từ 1000px xuống 50px, toàn cụm scale đồng bộ cơ học hoàn hảo.
 *
 * API nhận config từ ngoài (từ component cha) để tránh N+1 queries Convex.
 * Nếu dùng standalone, dùng ProductImageWithOverlayAuto.
 */

import React, { useState, useEffect } from 'react';
import type { WatermarkConfig } from './ProductImageWatermarkOverlay';
import { useProductWatermarkConfig } from './ProductImageWatermarkOverlay';
import type { ProductFrameConfig } from './ProductImageFrameBox';
import { useProductFrameConfig } from './ProductImageFrameBox';

export type { WatermarkConfig };
export type { ProductFrameConfig };

type ProductImageWithOverlayProps = {
  children: React.ReactNode;
  /** Config khung viền — truyền từ cha để tránh N+1 queries */
  frameConfig?: ProductFrameConfig | null;
  /** Config watermark — truyền từ cha để tránh N+1 queries */
  watermarkConfig?: WatermarkConfig | null;
  /** Class cho container ngoài */
  className?: string;
  style?: React.CSSProperties;
};

/** Watermark overlay nội bộ — không đặt container-type lại vì cha đã set rồi */
function InlineWatermarkOverlay({ config }: { config: WatermarkConfig }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [config.image?.url]);

  if (!config.enabled) return null;
  const { image, text } = config;
  if (!image && !text) return null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
      {/* Watermark hình — vị trí tỷ lệ % theo container */}
      {image && !imageError && (
        <img
          src={image.url}
          alt=""
          aria-hidden="true"
          className="absolute object-contain pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${image.x}%`,
            top: `${image.y}%`,
            width: `${image.width}%`,
            opacity: image.opacity / 100,
          }}
          onError={() => setImageError(true)}
        />
      )}

      {/* Watermark chữ — font-size dùng cqw (tỷ lệ theo chiều rộng container) */}
      {text && (
        <div
          className="absolute left-0 right-0 transform -translate-y-1/2 whitespace-nowrap text-center select-none"
          style={{
            top: `${text.y}%`,
            opacity: text.opacity / 100,
            color: text.color,
            // cqw — Container Query Width: % chiều rộng của container ngoài cùng
            // => font-size co giãn hoàn toàn theo chiều rộng ảnh
            fontSize: `calc(${text.fontSize} * 0.25cqw)`,
            fontFamily: '"Be Vietnam Pro", sans-serif',
          }}
        >
          {text.repeat ? (
            // gap: 1.5em — tỷ lệ theo font-size (vì font-size co giãn cqw nên gap cũng co giãn)
            // => khoảng cách thưa chữ scale đồng bộ cùng font như 1 bức ảnh thống nhất
            <div className="w-full overflow-hidden inline-flex justify-center" style={{ gap: '1.5em' }}>
              {Array(15).fill(null).map((_, i) => (
                <span key={i}>{text.content}</span>
              ))}
            </div>
          ) : (
            <span>{text.content}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Component cốt lõi: nhận config từ cha (không tự query).
 * Dùng ở những nơi render nhiều item (danh sách SP, carousel...) để tránh N+1.
 */
export function ProductImageWithOverlay({
  children,
  frameConfig,
  watermarkConfig,
  className,
  style,
}: ProductImageWithOverlayProps) {
  const hasFrame = Boolean(frameConfig?.overlayUrl);
  const hasWatermark = Boolean(watermarkConfig?.enabled && (watermarkConfig.image || watermarkConfig.text));

  const isAbsolute = className?.includes('absolute');
  const baseClass = isAbsolute ? 'overflow-hidden' : 'relative overflow-hidden';
  const combinedClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <div
      className={combinedClass}
      style={{
        ...style,
        // container-type: inline-size — cqw bên trong tính theo chiều rộng của div này
        // Đây là "hệ tọa độ" chung cho Frame + Watermark, đảm bảo scale cơ học đồng bộ
        containerType: 'inline-size',
      } as React.CSSProperties}
    >
      {children}

      {/* Khung viền — z-10: nằm trên ảnh gốc, dưới watermark */}
      {hasFrame && (
        <img
          src={frameConfig!.overlayUrl!}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none z-10"
        />
      )}

      {/* Watermark — z-20: nằm trên tất cả, scale theo cqw và em từ container ngoài */}
      {hasWatermark && watermarkConfig && (
        <InlineWatermarkOverlay config={watermarkConfig} />
      )}
    </div>
  );
}

/**
 * Hook tổng hợp cả frame config và watermark config.
 * Dùng ở component cha để query 1 lần rồi truyền xuống nhiều item con.
 */
export function useProductImageOverlayConfigs(aspectRatio?: string) {
  const frameConfig = useProductFrameConfig(aspectRatio);
  const watermarkConfig = useProductWatermarkConfig();
  return { frameConfig, watermarkConfig };
}

/**
 * Standalone variant: tự query config bên trong.
 * Chỉ dùng khi render lẻ 1 ảnh (lightbox, ảnh chính trang detail...).
 * KHÔNG dùng trong vòng lặp danh sách — sẽ gây N+1 queries.
 */
export function ProductImageWithOverlayAuto({
  children,
  aspectRatio,
  className,
  style,
}: {
  children: React.ReactNode;
  aspectRatio?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { frameConfig, watermarkConfig } = useProductImageOverlayConfigs(aspectRatio);
  return (
    <ProductImageWithOverlay
      frameConfig={frameConfig}
      watermarkConfig={watermarkConfig}
      className={className}
      style={style}
    >
      {children}
    </ProductImageWithOverlay>
  );
}
