'use client';

import React from 'react';
import { ErrorPageView } from '@/components/site/error/ErrorPageView';
import { useBrandColors } from '@/components/site/hooks';
import { useErrorPagesConfig } from '@/lib/experiences';

export default function RootNotFound() {
  const config = useErrorPagesConfig();
  const brandColors = useBrandColors();

  return (
    <ErrorPageView
      code={404}
      layoutStyle={config.layoutStyle}
      brandColor={brandColors.primary}
      secondaryColor={brandColors.secondary}
      colorMode={brandColors.mode}
      showGoHome={config.showGoHome}
      showGoBack={config.showGoBack}
      showShortApology={config.showShortApology}
      customHeadline={config.customHeadline}
      customMessage={config.customMessage}
    />
  );
}
