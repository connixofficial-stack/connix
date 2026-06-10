'use client';

import React from 'react';
import { type ImageProps } from 'next/image';

type AdminImageProps = ImageProps & {
  alt?: string;
  unoptimized?: boolean;
  fallback?: React.ReactNode;
};

export function AdminImage({ alt = '', unoptimized: _unoptimized = true, fallback = null, onError, ...props }: AdminImageProps) {
  const [hasError, setHasError] = React.useState(false);
  const { src, ...imageProps } = props;

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return fallback;
  }

  // Trích xuất các props đặc thù của next/image để tránh truyền xuống thẻ <img>
  const {
    width,
    height,
    fill,
    quality: _quality,
    priority: _priority,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    loading: _loading,
    sizes: _sizes,
    ...restProps
  } = imageProps;

  // Giả lập style cho prop `fill` tương tự next/image
  const fillStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      }
    : {};

  const combinedStyle = fill
    ? { ...fillStyle, ...restProps.style }
    : restProps.style;

  if (typeof src === 'string') {
    const normalizedSrc = src.trim();

    if (
      !normalizedSrc
      || (!normalizedSrc.startsWith('/')
        && !normalizedSrc.startsWith('http://')
        && !normalizedSrc.startsWith('https://')
        && !normalizedSrc.startsWith('data:image/'))
    ) {
      return null;
    }

    return (
      <img
        alt={alt}
        src={normalizedSrc}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        style={combinedStyle}
        onError={(event) => {
          onError?.(event);
          setHasError(true);
        }}
        {...(restProps as any)}
      />
    );
  }

  if (!src) {
    return null;
  }

  // Xử lý trường hợp src là StaticImport (Object chứa thuộc tính src)
  const srcString = typeof src === 'object' && 'src' in src ? (src as any).src : '';

  return (
    <img
      alt={alt}
      src={srcString || (src as any)}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      style={combinedStyle}
      onError={(event) => {
        onError?.(event);
        setHasError(true);
      }}
      {...(restProps as any)}
    />
  );
}

