'use client';

import React, { use, useMemo } from 'react';
import { ErrorPageView } from '@/components/site/error/ErrorPageView';
import { useBrandColors } from '@/components/site/hooks';
import { ERROR_STATUS_CODES, useErrorPagesConfig } from '@/lib/experiences';

const isValidStatusCode = (value: number) =>
  ERROR_STATUS_CODES.includes(value as (typeof ERROR_STATUS_CODES)[number]);

export default function ErrorCodePage({ params }: { params: Promise<{ code: string }> }) {
  const unwrappedParams = use(params);
  const config = useErrorPagesConfig();
  const brandColors = useBrandColors();

  const resolvedCode = useMemo(() => {
    const parsed = Number(unwrappedParams.code);
    if (!Number.isFinite(parsed)) {
      return 404;
    }
    return isValidStatusCode(parsed) ? parsed : 404;
  }, [unwrappedParams.code]);

  return (
    <ErrorPageView
      code={resolvedCode}
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
