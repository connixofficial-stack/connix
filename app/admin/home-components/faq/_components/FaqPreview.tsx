'use client';

import React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { cn } from '../../../components/ui';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewWrapper, usePreviewDark } from '../../_shared/components/PreviewWrapper';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { FAQ_STYLES } from '../_lib/constants';
import {
  calculateFaqAccentBalance,
  getFaqAccessibilityScore,
  getFaqColors,
  getFaqHarmonyStatus,
  resolveFaqSecondary,
} from '../_lib/colors';
import { FaqSectionShared } from './FaqSectionShared';
import {
  DEFAULT_FAQ_SPACING,
  getFaqSectionSpacingClassName,
  normalizeFaqDesktopColumns,
  normalizeFaqRounded,
  type FaqBrandMode,
  type FaqConfig,
  type FaqItem,
  type FaqStyle,
} from '../_types';

const DESCRIPTION_FONT_SIZE: Record<FaqStyle, number> = {
  accordion: 16,
  cards: 14,
  'two-column': 14,
  minimal: 16,
  timeline: 14,
  tabbed: 16,
  'wine-list': 16,
};

export const FaqPreview = ({
  items,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'wine-list',
  onStyleChange,
  config,
  title,
  fontStyle,
  fontClassName,
  hideHeader,
  showTitle,
  subtitle,
  showSubtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  spacing = DEFAULT_FAQ_SPACING,
}: {
  items: FaqItem[];
  brandColor: string;
  secondary: string;
  mode?: FaqBrandMode;
  selectedStyle?: FaqStyle;
  onStyleChange?: (style: FaqStyle) => void;
  config?: FaqConfig;
  title?: string;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const { isDark } = usePreviewDark();
  const style = selectedStyle;
  const maxVisible = device === 'mobile' ? 4 : 6;
  const sectionSpacingClassName = getFaqSectionSpacingClassName(spacing);
  const rounded = normalizeFaqRounded(config?.cornerRadius ?? config?.rounded, config?.noBorderRadius);
  const desktopColumns = normalizeFaqDesktopColumns(config?.desktopColumns);
  const hasSharedHeader = !hideHeader && (
    (showTitle && typeof title === 'string' && title.trim().length > 0)
    || (showSubtitle && typeof subtitle === 'string' && subtitle.trim().length > 0)
    || (showBadge && typeof badgeText === 'string' && badgeText.trim().length > 0)
  );

  const normalizedPrimary = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(brandColor.trim())
    ? brandColor.trim()
    : '#3b82f6';

  const tokens = React.useMemo(
    () => adaptTokensForDarkMode(getFaqColors({primary: normalizedPrimary, secondary, mode, style}), isDark),
    [normalizedPrimary, secondary, mode, style, isDark]
  );

  const resolvedSecondary = resolveFaqSecondary(normalizedPrimary, secondary, mode);
  const harmonyStatus = mode === 'dual'
    ? getFaqHarmonyStatus(normalizedPrimary, resolvedSecondary)
    : null;

  const accessibilityPairs = [
    { background: tokens.sectionBg, text: tokens.heading, fontSize: 32, fontWeight: 700, label: 'heading' },
    { background: tokens.panelBg, text: tokens.panelTitleText, fontSize: 18, fontWeight: 600, label: 'panelTitle' },
    { background: tokens.panelBgMuted, text: tokens.questionText, fontSize: 16, fontWeight: 500, label: 'question' },
    {
      background: tokens.panelBg,
      text: tokens.body,
      fontSize: DESCRIPTION_FONT_SIZE[style],
      fontWeight: 500,
      label: 'body',
    },
    { background: tokens.ctaBg, text: tokens.ctaText, fontSize: 14, fontWeight: 700, label: 'cta' },
    { background: tokens.badgeBg, text: tokens.badgeText, fontSize: 12, fontWeight: 700, label: 'badge' },
    { background: tokens.iconSolidBg, text: tokens.iconSolidText, fontSize: 12, fontWeight: 700, label: 'iconSolid' },
  ];

  if (style === 'tabbed') {
    accessibilityPairs.push(
      { background: tokens.tabInactiveBg, text: tokens.tabInactiveText, fontSize: 14, fontWeight: 500, label: 'tabInactive' },
      { background: tokens.tabActiveBg, text: tokens.tabActiveText, fontSize: 14, fontWeight: 600, label: 'tabActive' },
    );
  }

  const accessibility = getFaqAccessibilityScore(accessibilityPairs);

  const accentBalance = calculateFaqAccentBalance(style);

  return (
    <>
      <PreviewWrapper
        title="Preview FAQ"
        device={device}
        setDevice={setDevice}
        previewStyle={style}
        setPreviewStyle={(nextStyle) => onStyleChange?.(nextStyle as FaqStyle)}
        styles={FAQ_STYLES}
        info={`${items.length} câu hỏi • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/faq">
          <div className={cn('container mx-auto', style === 'cards' && device !== 'desktop' ? 'px-0' : 'px-4', sectionSpacingClassName)}>
            <SectionHeader
              title={title}
              subtitle={subtitle}
              badgeText={badgeText}
              hideHeader={hideHeader}
              showTitle={showTitle}
              showSubtitle={showSubtitle}
              showBadge={showBadge}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              brandColor={brandColor}
            />
            <FaqSectionShared
              items={items}
              title={title}
              style={style}
              config={config}
              tokens={tokens}
              context="preview"
              maxVisible={maxVisible}
              device={device}
              suppressInternalHeader={hasSharedHeader}
              spacingClassName="py-0"
              rounded={rounded}
              desktopColumns={desktopColumns}
            />
          </div>
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && harmonyStatus?.isTooSimilar && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Hai màu quá giống nhau</p>
              <p>Màu chính và màu phụ đang quá giống nhau (deltaE = {harmonyStatus.deltaE}). Nếu lưu, màu phụ sẽ bị tự động điều chỉnh.</p>
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
              <p>Một số cặp màu chữ/nền chưa đủ độ tương phản (minLc: {accessibility.minLc.toFixed(1)}).</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Màu chính</span>
            <span className="h-5 w-5 rounded border" style={{ backgroundColor: normalizedPrimary }} />
            <span className="font-mono text-slate-600 dark:text-slate-300">{normalizedPrimary}</span>
          </div>
          {mode === 'dual' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Màu phụ</span>
                <span className="h-5 w-5 rounded border" style={{ backgroundColor: resolvedSecondary }} />
                <span className="font-mono text-slate-600 dark:text-slate-300">{resolvedSecondary}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Tỉ lệ màu: Chính {accentBalance.primary}% · Phụ {accentBalance.secondary}% · Nền {accentBalance.neutral}%
              </div>
            </>
          )}
        </div>
      </div>

      {mode === 'dual' && (
        <ColorInfoPanel
          compact
          brandColor={normalizedPrimary}
          secondary={resolvedSecondary}
          description="Màu phụ đang được dùng cho tab, badge, accent và trạng thái active trong từng layout FAQ."
        />
      )}
    </>
  );
};
