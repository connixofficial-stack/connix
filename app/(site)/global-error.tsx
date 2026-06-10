'use client';

import React from 'react';
import { ErrorPageView } from '@/components/site/error/ErrorPageView';
import { DEFAULT_ERROR_PAGES_CONFIG } from '@/lib/experiences';

const FALLBACK_BRAND_COLOR = '#3b82f6';

export default function GlobalError({ error }: { error: Error }) {
  console.error(error);

  return (
    <html>
      <body>
        <ErrorPageView
          code={500}
          layoutStyle={DEFAULT_ERROR_PAGES_CONFIG.layoutStyle}
          brandColor={FALLBACK_BRAND_COLOR}
          secondaryColor=""
          colorMode="single"
          showGoHome={DEFAULT_ERROR_PAGES_CONFIG.showGoHome}
          showGoBack={DEFAULT_ERROR_PAGES_CONFIG.showGoBack}
          showShortApology={DEFAULT_ERROR_PAGES_CONFIG.showShortApology}
          customHeadline={DEFAULT_ERROR_PAGES_CONFIG.customHeadline}
          customMessage={DEFAULT_ERROR_PAGES_CONFIG.customMessage}
        />
      </body>
    </html>
  );
}
