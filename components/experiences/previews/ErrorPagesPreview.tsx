import React from 'react';
import { ErrorPageView } from '@/components/site/error/ErrorPageView';
import type { ErrorPagesLayoutStyle } from '@/lib/experiences';
import type { ErrorPagesColorMode } from '@/components/site/error/colors';

type ErrorPagesPreviewProps = {
  layoutStyle: ErrorPagesLayoutStyle;
  statusCode: number;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: ErrorPagesColorMode;
  showGoHome: boolean;
  showGoBack: boolean;
  showShortApology: boolean;
  customHeadline?: string;
  customMessage?: string;
};

export function ErrorPagesPreview({
  layoutStyle,
  statusCode,
  brandColor = '#f97316',
  secondaryColor,
  colorMode = 'single',
  showGoHome,
  showGoBack,
  showShortApology,
  customHeadline,
  customMessage,
}: ErrorPagesPreviewProps) {
  return (
    <ErrorPageView
      code={statusCode}
      layoutStyle={layoutStyle}
      brandColor={brandColor}
      secondaryColor={secondaryColor}
      colorMode={colorMode}
      showGoHome={showGoHome}
      showGoBack={showGoBack}
      showShortApology={showShortApology}
      customHeadline={customHeadline}
      customMessage={customMessage}
      onGoHome={() => undefined}
      onGoBack={() => undefined}
    />
  );
}
