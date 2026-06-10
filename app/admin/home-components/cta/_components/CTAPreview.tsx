'use client';

import React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  getCTAAccentBalance,
  getCTAValidationResult,
} from '../_lib/colors';
import { CTASectionShared } from './CTASectionShared';
import type { CTAConfig, CTAStyle } from '../_types';

const CTA_STYLES: { id: CTAStyle; label: string }[] = [
  { id: 'banner', label: '(1) Thanh ngang' },
  { id: 'centered', label: '(2) Căn giữa' },
  { id: 'split', label: '(3) Chia đôi' },
  { id: 'floating', label: '(4) Khối nổi' },
  { id: 'gradient', label: '(5) Chuyển màu' },
  { id: 'minimal', label: '(6) Tối giản' },
];

const CTAPreviewContent = ({
  config,
  brandColor,
  secondary,
  mode,
  style,
}: {
  config: CTAConfig;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  style: CTAStyle;
}) => {
  const { isDark } = usePreviewDark();
  const { tokens } = React.useMemo(() => getCTAValidationResult({
    config,
    primary: brandColor,
    secondary,
    mode,
    style,
    isDark,
  }), [brandColor, config, isDark, mode, secondary, style]);

  return (
    <BrowserFrame url="yoursite.com">
      <CTASectionShared config={config} style={style} tokens={tokens} context="preview" />
    </BrowserFrame>
  );
};

export const CTAPreview = ({
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'banner',
  onStyleChange,
  fontStyle,
  fontClassName,
}: {
  config: CTAConfig;
  brandColor: string;
  secondary: string;
  mode?: 'single' | 'dual';
  selectedStyle?: CTAStyle;
  onStyleChange?: (style: CTAStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const style = selectedStyle;

  const {
    accessibility,
    harmonyStatus,
    resolvedSecondary,
  } = getCTAValidationResult({
    config,
    primary: brandColor,
    secondary,
    mode,
    style,
  });

  const accentBalance = getCTAAccentBalance(style);

  return (
    <>
      <PreviewWrapper
        title="Preview CTA"
        device={device}
        setDevice={setDevice}
        previewStyle={style}
        setPreviewStyle={(s) => onStyleChange?.(s as CTAStyle)}
        styles={CTA_STYLES}
        info={mode === 'single' ? '1 màu' : '2 màu'}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <CTAPreviewContent
          config={config}
          brandColor={brandColor}
          secondary={secondary}
          mode={mode}
          style={style}
        />
      </PreviewWrapper>

      {mode === 'dual' && harmonyStatus.isTooSimilar && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Hai màu quá giống nhau</p>
              <p>Màu chính và màu phụ đang quá giống nhau (deltaE = {harmonyStatus.deltaE}). Hệ thống sẽ chặn lưu cho đến khi bạn chọn màu khác biệt hơn.</p>
            </div>
          </div>
        </div>
      )}

      {mode === 'dual' && accessibility.failing.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <Eye size={14} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Màu chữ khó đọc</p>
              <p>Một số cặp màu chữ/nền chưa đủ độ tương phản (minLc: {accessibility.minLc.toFixed(1)}). Hệ thống sẽ chặn lưu cho đến khi bạn chọn màu khác.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">{mode === 'single' ? 'Màu thương hiệu' : 'Màu chính'}</span>
            <span className="h-5 w-5 rounded border" style={{ backgroundColor: brandColor }} />
            <span className="font-mono text-slate-600 dark:text-slate-300">{brandColor}</span>
          </div>
          {mode === 'dual' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Màu phụ</span>
              <span className="h-5 w-5 rounded border" style={{ backgroundColor: resolvedSecondary }} />
              <span className="font-mono text-slate-600 dark:text-slate-300">{resolvedSecondary}</span>
            </div>
          )}
          {mode === 'dual' && (
            <div className="text-slate-500 dark:text-slate-400">
              Tỉ lệ màu: Chính {accentBalance.primary}% · Phụ {accentBalance.secondary}% · Nền {accentBalance.neutral}%
            </div>
          )}
        </div>
      </div>
    </>
  );
};
