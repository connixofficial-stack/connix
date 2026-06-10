'use client';

import { useEffect } from 'react';
import { useBrandColor } from '@/components/site/hooks';

export function BrandColorProvider() {
  const brandColor = useBrandColor();
  
  useEffect(() => {
    document.documentElement.style.setProperty('--scrollbar-color', brandColor);
  }, [brandColor]);

  return null;
}
