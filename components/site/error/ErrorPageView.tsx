'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, TriangleAlert } from 'lucide-react';
import { ERROR_CODE_COPY, type ErrorPagesLayoutStyle } from '@/lib/experiences';
import { getErrorPageColors, type ErrorPagesColorMode } from './colors';
import { useSiteSettings } from '@/components/site/hooks';

type ErrorPageViewProps = {
  code: number;
  layoutStyle: ErrorPagesLayoutStyle;
  brandColor: string;
  secondaryColor?: string;
  colorMode?: ErrorPagesColorMode;
  showGoHome: boolean;
  showGoBack: boolean;
  showShortApology: boolean;
  customHeadline?: string;
  customMessage?: string;
  onGoHome?: () => void;
  onGoBack?: () => void;
};

const DEFAULT_APOLOGY = 'Xin lỗi vì sự bất tiện. Chúng tôi sẽ xử lý nhanh nhất có thể.';

export function ErrorPageView({
  code,
  layoutStyle,
  brandColor,
  secondaryColor,
  colorMode = 'single',
  showGoHome,
  showGoBack,
  showShortApology,
  customHeadline,
  customMessage,
  onGoHome,
  onGoBack,
}: ErrorPageViewProps) {
  const { siteDarkMode } = useSiteSettings();
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const tokens = getErrorPageColors(brandColor, secondaryColor, colorMode, isDark);
  const copy = ERROR_CODE_COPY[code] ?? ERROR_CODE_COPY[404];
  const headline = customHeadline?.trim() || copy.headline;
  const message = customMessage?.trim() || copy.message;

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
      return;
    }
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const Actions = (
    <div className="flex flex-wrap items-center gap-3">
      {showGoHome && (
        <Link
          href="/"
          onClick={onGoHome}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
        >
          <Home size={16} />
          Về trang chủ
        </Link>
      )}
      {showGoBack && (
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors"
          style={{ borderColor: tokens.secondaryButtonBorder, color: tokens.secondaryButtonText }}
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      )}
    </div>
  );

  if (layoutStyle === 'split') {
    return (
      <div className="min-h-[520px] py-10 px-4">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: tokens.accentSurface, color: tokens.accentIcon }}
            >
              <TriangleAlert size={14} />
              Trạng thái hệ thống
            </div>
            <div className="text-5xl font-bold" style={{ color: tokens.codeColor }}>{code}</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold" style={{ color: tokens.headlineColor }}>{headline}</h1>
              <p className="text-sm" style={{ color: tokens.messageColor }}>{message}</p>
              {showShortApology && (
                <p className="text-xs" style={{ color: tokens.apologyColor }}>{DEFAULT_APOLOGY}</p>
              )}
            </div>
            {Actions}
          </div>
          <div className="rounded-2xl border p-6" style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
            <div
              className="flex h-full flex-col items-center justify-center rounded-xl border px-6 py-10 text-center"
              style={{ borderColor: tokens.accentBorder, backgroundColor: tokens.illustrationSurface }}
            >
              <TriangleAlert size={40} style={{ color: tokens.illustrationText }} />
              <p className="mt-4 text-sm font-semibold" style={{ color: tokens.illustrationText }}>
                Hệ thống đang ghi nhận sự cố
              </p>
              <p className="mt-2 text-xs" style={{ color: tokens.illustrationText }}>
                Bạn có thể quay lại hoặc về trang chủ để tiếp tục.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layoutStyle === 'illustrated') {
    return (
      <div className="min-h-[520px] py-10 px-4">
        <div className="mx-auto w-full max-w-3xl space-y-6 text-center">
          <div
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border"
            style={{ borderColor: tokens.accentBorder, backgroundColor: tokens.accentSurface }}
          >
            <TriangleAlert size={42} style={{ color: tokens.accentIcon }} />
          </div>
          <div className="space-y-3">
            <div className="text-5xl font-bold" style={{ color: tokens.codeColor }}>{code}</div>
            <h1 className="text-2xl font-semibold" style={{ color: tokens.headlineColor }}>{headline}</h1>
            <p className="text-sm" style={{ color: tokens.messageColor }}>{message}</p>
            {showShortApology && (
              <p className="text-xs" style={{ color: tokens.apologyColor }}>{DEFAULT_APOLOGY}</p>
            )}
          </div>
          <div className="flex justify-center">{Actions}</div>
          <div className="rounded-2xl border px-6 py-5" style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
            <p className="text-xs" style={{ color: tokens.messageColor }}>
              Nếu cần hỗ trợ gấp, vui lòng quay lại trang chủ hoặc thử tải lại sau ít phút.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[520px] py-10 px-4">
      <div className="mx-auto w-full max-w-3xl space-y-5 text-center">
        <div className="text-6xl font-bold" style={{ color: tokens.codeColor }}>{code}</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold" style={{ color: tokens.headlineColor }}>{headline}</h1>
          <p className="text-sm" style={{ color: tokens.messageColor }}>{message}</p>
          {showShortApology && (
            <p className="text-xs" style={{ color: tokens.apologyColor }}>{DEFAULT_APOLOGY}</p>
          )}
        </div>
        <div className="flex justify-center">{Actions}</div>
        <div className="mx-auto h-px w-16" style={{ backgroundColor: tokens.border }} />
        <p className="text-xs" style={{ color: tokens.messageColor }}>
          Mã lỗi hiển thị giúp chúng tôi xác định vấn đề nhanh hơn.
        </p>
      </div>
    </div>
  );
}
