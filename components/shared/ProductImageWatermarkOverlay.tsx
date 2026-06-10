'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useProductWatermarkConfig() {
  const moduleEnabledSetting = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'enableProductWatermark',
  });
  const globalEnabledSetting = useQuery(api.settings.getValue, {
    key: 'enable_product_watermark',
    defaultValue: false,
  });

  const moduleEnabled = moduleEnabledSetting?.value === true || moduleEnabledSetting?.value === 'true';
  const globalEnabled = globalEnabledSetting === true || globalEnabledSetting === 'true';
  const enabled = moduleEnabled || globalEnabled;

  // Image watermark query
  const imageEnabledSetting = useQuery(api.settings.getValue, { key: 'product_watermark_image_enabled' });
  const imageUrlSetting = useQuery(api.settings.getValue, { key: 'product_watermark_image_url' });
  const imageXSetting = useQuery(api.settings.getValue, { key: 'product_watermark_image_x' });
  const imageYSetting = useQuery(api.settings.getValue, { key: 'product_watermark_image_y' });
  const imageWidthSetting = useQuery(api.settings.getValue, { key: 'product_watermark_image_width' });
  const imageOpacitySetting = useQuery(api.settings.getValue, { key: 'product_watermark_image_opacity' });

  // Text watermark query
  const textEnabledSetting = useQuery(api.settings.getValue, { key: 'product_watermark_text_enabled' });
  const textContentSetting = useQuery(api.settings.getValue, { key: 'product_watermark_text_content' });
  const textYSetting = useQuery(api.settings.getValue, { key: 'product_watermark_text_y' });
  const textFontSizeSetting = useQuery(api.settings.getValue, { key: 'product_watermark_text_font_size' });
  const textColorSetting = useQuery(api.settings.getValue, { key: 'product_watermark_text_color' });
  const textOpacitySetting = useQuery(api.settings.getValue, { key: 'product_watermark_text_opacity' });
  const textRepeatSetting = useQuery(api.settings.getValue, { key: 'product_watermark_text_repeat' });

  return useMemo(() => {
    if (!enabled) {
      return {
        enabled: false,
        image: null,
        text: null,
      };
    }

    const imageEnabled = imageEnabledSetting === true || imageEnabledSetting === 'true';
    const textEnabled = textEnabledSetting === true || textEnabledSetting === 'true';

    const parseNum = (val: unknown, fallback: number) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const p = parseFloat(val);
        return isNaN(p) ? fallback : p;
      }
      return fallback;
    };

    return {
      enabled: true,
      image: imageEnabled && imageUrlSetting ? {
        url: imageUrlSetting as string,
        x: parseNum(imageXSetting, 80),
        y: parseNum(imageYSetting, 80),
        width: parseNum(imageWidthSetting, 28),
        opacity: parseNum(imageOpacitySetting, 40),
      } : null,
      text: textEnabled && textContentSetting ? {
        content: textContentSetting as string,
        y: parseNum(textYSetting, 80),
        fontSize: parseNum(textFontSizeSetting, 8),
        color: (textColorSetting as string) || '#64748B',
        opacity: parseNum(textOpacitySetting, 35),
        repeat: textRepeatSetting === true || textRepeatSetting === 'true',
      } : null,
    };
  }, [
    enabled,
    imageEnabledSetting,
    imageUrlSetting,
    imageXSetting,
    imageYSetting,
    imageWidthSetting,
    imageOpacitySetting,
    textEnabledSetting,
    textContentSetting,
    textYSetting,
    textFontSizeSetting,
    textColorSetting,
    textOpacitySetting,
    textRepeatSetting,
  ]);
}

export type WatermarkConfig = ReturnType<typeof useProductWatermarkConfig>;

type ProductImageWatermarkOverlayProps = {
  config: WatermarkConfig;
  className?: string;
  style?: React.CSSProperties;
};

export function ProductImageWatermarkOverlay({
  config,
  className,
  style,
}: ProductImageWatermarkOverlayProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [config.image?.url]);

  if (!config.enabled) return null;

  const { image, text } = config;

  if (!image && !text) return null;

  return (
    <div 
      className={className ? `absolute inset-0 pointer-events-none select-none z-10 overflow-hidden ${className}` : 'absolute inset-0 pointer-events-none select-none z-10 overflow-hidden'}
      style={{
        ...style,
        containerType: 'inline-size',
      }}
    >
      {/* Watermark hình */}
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

      {/* Watermark chữ */}
      {text && (
        <div
          className="absolute left-0 right-0 transform -translate-y-1/2 whitespace-nowrap text-center select-none"
          style={{
            top: `${text.y}%`,
            opacity: text.opacity / 100,
            color: text.color,
            fontSize: `calc(${text.fontSize} * 0.25cqw)`,
            fontFamily: '"Be Vietnam Pro", sans-serif',
          }}
        >
          {text.repeat ? (
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

export function ProductImageWatermarkBox() {
  const config = useProductWatermarkConfig();
  return <ProductImageWatermarkOverlay config={config} />;
}
