'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';

export type PreviewImageProps = Omit<React.ComponentProps<typeof Image>, 'width' | 'height' | 'src'> & {
  src?: React.ComponentProps<typeof Image>['src'];
  width?: number | string;
  height?: number | string;
  fallback?: React.ReactNode;
};

export const PreviewImage = ({ src, alt = '', width = 1200, height = 800, fallback = null, onError, ...rest }: PreviewImageProps) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {return fallback;}

  const normalizedWidth = typeof width === 'string' ? Number.parseInt(width, 10) || 1200 : width;
  const normalizedHeight = typeof height === 'string' ? Number.parseInt(height, 10) || 800 : height;

  return (
    <Image
      src={src}
      {...rest}
      alt={alt}
      width={normalizedWidth}
      height={normalizedHeight}
      unoptimized
      onError={(event) => {
        onError?.(event);
        setHasError(true);
      }}
    />
  );
};

