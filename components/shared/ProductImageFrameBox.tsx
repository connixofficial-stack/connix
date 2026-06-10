'use client';

import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Simple overlay config - hỗ trợ 5 tỷ lệ khung hình (Aspect Ratio) overlay khác nhau
export function useProductFrameConfig(aspectRatio?: string) {
  const enabledSetting = useQuery(api.settings.getValue, {
    key: 'enable_product_frames',
    defaultValue: false,
  });

  // Query cả 5 cài đặt tỷ lệ khung hình
  const squareSetting = useQuery(api.settings.getValue, { key: 'product_frame_overlay_square_url' });
  const portrait916Setting = useQuery(api.settings.getValue, { key: 'product_frame_overlay_portrait916_url' });
  const portrait34Setting = useQuery(api.settings.getValue, { key: 'product_frame_overlay_portrait34_url' });
  const landscape43Setting = useQuery(api.settings.getValue, { key: 'product_frame_overlay_landscape43_url' });
  const wide169Setting = useQuery(api.settings.getValue, { key: 'product_frame_overlay_wide169_url' });

  // Query tỷ lệ ảnh mặc định của hệ thống
  const defaultImageAspectRatio = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'defaultImageAspectRatio',
  });

  const enabled = enabledSetting === true;
  const resolvedAr = aspectRatio || (typeof defaultImageAspectRatio === 'string' ? defaultImageAspectRatio : 'square');

  const overlayUrl = useMemo(() => {
    if (!enabled) return null;
    let url = null;
    switch (resolvedAr) {
      case 'square':
        url = squareSetting;
        break;
      case 'portrait916':
        url = portrait916Setting;
        break;
      case 'portrait34':
        url = portrait34Setting;
        break;
      case 'landscape43':
        url = landscape43Setting;
        break;
      case 'wide169':
        url = wide169Setting;
        break;
      default:
        url = squareSetting;
    }
    return (typeof url === 'string' && url) ? url : null;
  }, [enabled, resolvedAr, squareSetting, portrait916Setting, portrait34Setting, landscape43Setting, wide169Setting]);

  return useMemo(
    () => ({ enabled, overlayUrl }),
    [enabled, overlayUrl]
  );
}

// Export type để ProductImageWithOverlay có thể sử dụng
export type ProductFrameConfig = ReturnType<typeof useProductFrameConfig>;

type ProductImageFrameBoxProps = {
  overlayUrl?: string | null;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export function ProductImageFrameBox({
  overlayUrl,
  className,
  style,
  children,
}: ProductImageFrameBoxProps) {
  return (
    <div className={className ? `relative ${className}` : 'relative'} style={style}>
      {children}
      <ProductImageFrameOverlay overlayUrl={overlayUrl} />
    </div>
  );
}

export function ProductImageFrameOverlay({
  overlayUrl,
}: {
  overlayUrl?: string | null;
}) {
  if (!overlayUrl) {
    return null;
  }
  return (
    <img
      src={overlayUrl}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
    />
  );
}
