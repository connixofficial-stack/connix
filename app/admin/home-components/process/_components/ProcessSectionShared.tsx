'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { deviceWidths, type PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { getProcessColors, getAPCATextColor, type ProcessColorTokens } from '../_lib/colors';
import {
  DEFAULT_PROCESS_CORNER_RADIUS,
  DEFAULT_PROCESS_SPACING,
  getProcessCornerRadiusClassName,
  getProcessSectionSpacingClassName,
  type ProcessBrandMode,
  type ProcessCornerRadius,
  type ProcessSpacing,
  type ProcessStyle,
} from '../_types';

type ProcessSectionContext = 'preview' | 'site';

type ProcessSharedStep = {
  key: string;
  icon: string;
  title: string;
  description: string;
};

interface ProcessSectionSharedProps {
  steps: ProcessSharedStep[];
  sectionTitle: string;
  style: ProcessStyle;
  brandColor: string;
  secondary: string;
  mode: ProcessBrandMode;
  context: ProcessSectionContext;
  previewDevice?: PreviewDevice;
  setPreviewDevice?: (device: PreviewDevice) => void;
  includePreviewWrapper?: boolean;
  previewStyle?: ProcessStyle;
  onPreviewStyleChange?: (style: ProcessStyle) => void;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
  circularCtaText?: string;
  circularCtaLink?: string;
  isDark?: boolean;
}

const PROCESS_STYLES: Array<{ id: ProcessStyle; label: string }> = [
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'stepper', label: 'Stepper' },
  { id: 'cards', label: 'Cards' },
  { id: 'accordion', label: 'Accordion' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'compactMinimal', label: 'Compact Minimal' },
  { id: 'grid', label: 'Grid' },
  { id: 'alternating', label: 'Alternating' },
  { id: 'circular', label: 'Circular (Builder.io)' },
];

const PREVIEW_MAX_VISIBLE_BY_STYLE: Record<ProcessStyle, Record<PreviewDevice, number>> = {
  horizontal: { desktop: 4, tablet: 4, mobile: 4 },
  stepper: { desktop: 8, tablet: 8, mobile: 8 },
  cards: { desktop: 4, tablet: 4, mobile: 4 },
  accordion: { desktop: 4, tablet: 4, mobile: 4 },
  minimal: { desktop: 4, tablet: 4, mobile: 4 },
  compactMinimal: { desktop: 4, tablet: 4, mobile: 4 },
  grid: { desktop: 4, tablet: 4, mobile: 4 },
  alternating: { desktop: 4, tablet: 4, mobile: 4 },
  circular: { desktop: 8, tablet: 8, mobile: 8 },
};

const getMaxVisible = (
  style: ProcessStyle,
  context: ProcessSectionContext,
  previewDevice: PreviewDevice,
) => {
  if (context === 'site') {
    return PREVIEW_MAX_VISIBLE_BY_STYLE[style].desktop;
  }
  return PREVIEW_MAX_VISIBLE_BY_STYLE[style][previewDevice];
};

const getSectionPadding = (context: ProcessSectionContext, device: PreviewDevice, spacing: ProcessSpacing = DEFAULT_PROCESS_SPACING) => {
  const spacingClass = getProcessSectionSpacingClassName(spacing);
  if (context === 'preview') {
    return cn(spacingClass, 'px-4', device === 'mobile' ? 'px-3' : 'md:px-6');
  }
  return cn(spacingClass, 'px-4');
};

const getResponsiveGridClass = (count: number, desktopColumns: 3 | 4 = 4) => {
  if (count <= 1) { return 'grid-cols-1'; }
  if (desktopColumns === 3) {
    // 3 cols desktop / 3 tablet / 1 mobile
    return 'grid-cols-1 md:grid-cols-3';
  }
  // 4 cols desktop / 2 tablet / 2 mobile
  if (count <= 2) { return 'grid-cols-2'; }
  return 'grid-cols-2 md:grid-cols-4';
};

const getSharedInfoText = (style: ProcessStyle, total: number, visible: number, mode: ProcessBrandMode) => {
  if (total === 0) {return `Chưa có bước nào • ${mode === 'dual' ? '2 màu' : '1 màu'}`;}

  const remaining = Math.max(total - visible, 0);
  const base = `${total} bước`;
  const styleLabel = PROCESS_STYLES.find((item) => item.id === style)?.label ?? 'Horizontal';
  const hiddenLabel = remaining > 0 ? ` • +${remaining} ẩn` : '';
  const modeLabel = mode === 'dual' ? ' • 2 màu' : ' • 1 màu';
  return `${base} • ${styleLabel}${hiddenLabel}${modeLabel}`;
};

const renderEmptyState = (tokens: ProcessColorTokens) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: tokens.emptyIconBg }}>
      <Layers size={32} style={{ color: tokens.emptyIconColor }} />
    </div>
    <h3 className="font-medium mb-1" style={{ color: tokens.bodyText }}>Chưa có bước nào</h3>
    <p className="text-sm" style={{ color: tokens.mutedText }}>Thêm bước đầu tiên để bắt đầu</p>
  </div>
);

const renderHorizontal = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
  headerConfig = {},
  desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig?: HeaderConfig;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('horizontal', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;
  const containerClass = getSectionPadding(context, previewDevice, spacing);
  const isSite = context === 'site';
  const isMobile = previewDevice === 'mobile';

  // Dot size: site uses responsive, admin uses JS
  const dotClass = isSite
    ? 'w-8 h-8 sm:w-10 sm:h-10'
    : (isMobile ? 'w-8 h-8' : 'w-10 h-10');

  const lineHeight = isSite ? 40 : (isMobile ? 32 : 40);
  const lineMarginTop = isSite ? -40 : (isMobile ? -32 : -40);

  return (
    <div className={containerClass} style={{ backgroundColor: tokens.neutralBackground }}>
      {renderSectionHeader({ tokens, sectionTitle, previewDevice, headerConfig, showBadgeInline: true })}

      <div className="relative">
        {/* Progress line behind dots */}
        <div className={cn('grid', getResponsiveGridClass(Math.min(visibleSteps.length, 5), desktopColumns))}>
          <div className="col-span-full relative" style={{ height: lineHeight }}>
            {/* Track line - from center of first col to center of last col */}
            <div
              className="absolute top-1/2 h-0.5 -translate-y-1/2"
              style={{
                backgroundColor: tokens.progressTrack,
                left: `${100 / (visibleSteps.length * 2)}%`,
                right: `${100 / (visibleSteps.length * 2)}%`,
              }}
            />
            <div
              className="absolute top-1/2 h-0.5 -translate-y-1/2"
              style={{
                backgroundColor: tokens.progressFill,
                left: `${100 / (visibleSteps.length * 2)}%`,
                right: `${100 / (visibleSteps.length * 2)}%`,
              }}
            />
          </div>
        </div>

        {/* Dots + text unified grid */}
        <div className={cn('grid gap-3', getResponsiveGridClass(Math.min(visibleSteps.length, 5), desktopColumns))} style={{ marginTop: lineMarginTop }}>
          {visibleSteps.map((step, idx) => (
            <div key={step.key} className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full font-bold text-xs border-2 relative z-10 mb-2',
                  dotClass,
                )}
                style={{
                  backgroundColor: tokens.stepDotBg,
                  color: tokens.stepDotText,
                  borderColor: tokens.neutralSurface,
                  boxShadow: `0 2px 8px ${tokens.stepDotShadow}`,
                }}
              >
                {step.icon || idx + 1}
              </div>
              <h4 className={cn('font-semibold mb-1', isSite ? 'text-xs sm:text-sm' : 'text-sm')} style={{ color: tokens.bodyText }}>
                {step.title || `Bước ${idx + 1}`}
              </h4>
              <p className="text-xs" style={{ color: tokens.mutedText }}>
                {step.description || 'Mô tả...'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {remainingCount > 0 && (
        <div className="text-center mt-4">
          <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
        </div>
      )}
    </div>
  );
};

const padNumber = (n: number) => String(n).padStart(2, '0');

const RenderStepper = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
  headerConfig = {},
  desktopColumns: _desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
  cornerRadius = DEFAULT_PROCESS_CORNER_RADIUS,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig?: HeaderConfig;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('stepper', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;

  const [activeStep, setActiveStep] = React.useState<number>(0);


  return (
    <div className={getSectionPadding(context, previewDevice, spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      {renderSectionHeader({ tokens, sectionTitle, previewDevice, headerConfig, showBadgeInline: true })}

      <div className={cn('mx-auto', previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl')}>
        {visibleSteps.map((step, idx) => {
          const isActive = activeStep === idx;
          const stepNum = step.icon && /^\d+$/.test(step.icon) ? padNumber(Number(step.icon)) : (step.icon || padNumber(idx + 1));

          return (
            <div
              key={step.key}
              className="flex items-center cursor-pointer group"
              onClick={() => setActiveStep(idx)}
            >
              {/* Step number + vertical line */}
              <div className="relative flex flex-col items-center justify-center flex-shrink-0 w-10 self-stretch">
                {/* Vertical line from center downward */}
                {idx < visibleSteps.length - 1 && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5"
                    style={{ backgroundColor: tokens.connectorLine, top: '50%' }}
                  />
                )}
                {/* Vertical line from top to center (from previous step) */}
                {idx > 0 && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5"
                    style={{ backgroundColor: tokens.connectorLine, bottom: '50%' }}
                  />
                )}
                {/* Step dot */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors duration-200 relative z-10"
                  style={{
                    backgroundColor: isActive ? tokens.stepDotBg : tokens.neutralSurface,
                    color: isActive ? tokens.stepDotText : tokens.stepDotBg,
                    border: `1px solid ${isActive ? tokens.stepDotBg : tokens.neutralBorder}`,
                  }}
                >
                  {stepNum}
                </div>
              </div>

              {/* Horizontal connector line (dot → card) */}
              <div className="w-4 h-0.5 flex-shrink-0" style={{ backgroundColor: tokens.connectorLine }} />

              {/* Card content */}
              <div
                className={cn(
                  'flex-1 border-2 p-4 transition-colors duration-200',
                  getProcessCornerRadiusClassName(cornerRadius),
                  previewDevice === 'mobile' && 'p-3',
                  idx < visibleSteps.length - 1 && 'mb-3',
                )}
                style={{
                  backgroundColor: tokens.neutralSurface,
                  borderColor: isActive ? tokens.stepDotBg : tokens.cardBorder,
                }}
              >
                <h4
                  className={cn(
                    'font-bold mb-1 tracking-tight',
                    previewDevice === 'mobile' ? 'text-base' : 'text-lg',
                  )}
                  style={{ color: tokens.bodyText }}
                >
                  {step.title || `Bước ${idx + 1}`}
                </h4>
                <p
                  className={cn(
                    'leading-relaxed',
                    previewDevice === 'mobile' ? 'text-xs' : 'text-sm',
                  )}
                  style={{ color: tokens.mutedText }}
                >
                  {step.description || 'Mô tả bước này...'}
                </p>
              </div>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div className="text-center mt-4">
            <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
          </div>
        )}
      </div>
    </div>
  );
};

const renderCards = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
  headerConfig = {},
  desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig?: HeaderConfig;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('cards', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const isMobile = previewDevice === 'mobile';
  const isTablet = previewDevice === 'tablet';
  const isSite = context === 'site';

  // Grid: responsive based on desktopColumns
  const gridClass = desktopColumns === 3
    ? (isSite
      ? 'grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-3'
      : cn('grid', isMobile ? 'grid-cols-1 gap-5' : 'grid-cols-3 gap-3'))
    : (isSite
      ? 'grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-2'
      : cn('grid', isMobile ? 'grid-cols-2 gap-4' : (isTablet ? 'grid-cols-2 gap-4' : 'grid-cols-4 gap-2')));

  // Circle: site uses responsive sizing, admin uses JS conditional
  const circleClass = isSite
    ? 'w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24'
    : (isMobile ? 'w-20 h-20' : 'w-24 h-24');

  const numberClass = isSite
    ? 'text-xl sm:text-2xl lg:text-3xl'
    : (isMobile ? 'text-2xl' : 'text-3xl');

  const titleClass = isSite
    ? 'text-sm lg:text-base'
    : (isMobile ? 'text-sm' : 'text-base');

  const descClass = isSite
    ? 'text-xs lg:text-sm'
    : (isMobile ? 'text-xs' : 'text-sm');

  return (
    <div className={getSectionPadding(context, previewDevice, spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      {renderSectionHeader({ tokens, sectionTitle, previewDevice, headerConfig, showBadgeInline: true })}

      <div className={gridClass}>
        {visibleSteps.map((step, idx) => {
          const stepNum = step.icon && /^\d+$/.test(step.icon) ? padNumber(Number(step.icon)) : padNumber(idx + 1);
          const isLast = idx === visibleSteps.length - 1;

          return (
            <div key={step.key} className="relative flex flex-col items-center text-center">
              {/* Dashed S-curve arrow connector — desktop only */}
              {!isLast && (
                <div className={cn(
                  'absolute top-10 left-[45%] w-[115%] z-0',
                  isSite ? 'hidden lg:block' : (!isMobile && !isTablet ? 'block' : 'hidden'),
                )}>
                  <svg
                    viewBox="0 0 140 50"
                    className="w-full h-14 overflow-visible"
                    fill="none"
                  >
                    <path
                      d="M5 38 C40 38, 45 8, 70 22 C95 38, 100 8, 135 8"
                      stroke={tokens.arrowIcon}
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M128 3 L136 8 L128 13"
                      stroke={tokens.arrowIcon}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              )}

              {/* Number circle */}
              <div className="relative mb-3 z-10">
                <div
                  className={cn('rounded-full flex items-center justify-center shadow-lg', circleClass)}
                  style={{ backgroundColor: tokens.primary }}
                >
                  <span
                    className={cn('font-bold', numberClass)}
                    style={{ color: tokens.stepDotText }}
                  >
                    {stepNum}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3
                className={cn('font-semibold mb-1 italic', titleClass)}
                style={{ color: tokens.bodyText }}
              >
                {step.title || `Bước ${idx + 1}`}
              </h3>

              {/* Description */}
              <p
                className={cn('leading-relaxed px-2', descClass)}
                style={{ color: tokens.mutedText }}
              >
                {step.description || 'Mô tả bước này...'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const renderAccordion = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
  headerConfig = {},
  desktopColumns: _desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig?: HeaderConfig;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('accordion', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const isMobile = previewDevice === 'mobile';
  const isTablet = previewDevice === 'tablet';
  const isSite = context === 'site';

  // Generate zigzag positions for N steps
  const stepCount = visibleSteps.length;
  const getStepPosition = (idx: number, total: number) => {
    const xPercent = total <= 1 ? 50 : 14 + (idx * (72 / (total - 1)));
    // Zigzag: even index = bottom (55%), odd index = top (15% — circle sits on the wave)
    const isTop = idx % 2 !== 0;
    const yPercent = isTop ? 26 : 55;
    return { x: xPercent, y: yPercent };
  };

  // Build SVG path — line oscillates between top and bottom rows
  const buildWavePath = (total: number) => {
    if (total <= 1) {return '';}
    const points = Array.from({ length: total }, (_, i) => {
      const pos = getStepPosition(i, total);
      return { x: pos.x * 10, y: pos.y === 26 ? 95 : 160 };
    });

    let path = `M${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.x + next.x) / 2;
      path += ` Q${midX} ${curr.y === 160 ? 35 : 220}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const wavePath = buildWavePath(stepCount);

  // Circle styles
  const circleSize = isMobile || isTablet ? 'w-16 h-16' : 'w-20 h-20';
  const circleTextSize = isMobile || isTablet ? 'text-2xl' : 'text-3xl';
  const siteCircleSize = 'w-16 h-16 lg:w-20 lg:h-20';
  const siteCircleText = 'text-2xl lg:text-3xl';

  const resolvedCircle = isSite ? siteCircleSize : circleSize;
  const resolvedText = isSite ? siteCircleText : circleTextSize;

  return (
    <div className={getSectionPadding(context, previewDevice, spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      {renderSectionHeader({ tokens, sectionTitle, previewDevice, headerConfig, showBadgeInline: true })}

      {/* Desktop Layout - Zigzag wave */}
      <div className={cn(
        'relative',
        isSite ? 'hidden md:block' : (isMobile || isTablet ? 'hidden' : 'block'),
      )} style={{ height: 420 }}>
        {/* Wavy dashed SVG line — behind circles */}
        {wavePath && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 1000 200"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d={wavePath}
              stroke={tokens.arrowIcon}
              strokeWidth="2.5"
              strokeDasharray="8 6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        )}

        {/* Step circles positioned along the wave */}
        {visibleSteps.map((step, idx) => {
          const pos = getStepPosition(idx, stepCount);
          const stepNum = step.icon && /^\d+$/.test(step.icon) ? step.icon : String(idx + 1);

          return (
            <div
              key={step.key}
              className="absolute flex flex-col items-center text-center z-10"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div
                className={cn(
                  'rounded-full bg-white flex items-center justify-center border-4 mb-2',
                  resolvedCircle,
                )}
                style={{
                  borderColor: tokens.primary,
                  boxShadow: `0 8px 20px ${tokens.primary}30`,
                }}
              >
                <span
                  className={cn('font-bold', resolvedText)}
                  style={{ color: tokens.primary }}
                >
                  {stepNum}
                </span>
              </div>
              <h4
                className="text-sm font-semibold leading-tight max-w-[220px] mb-1"
                style={{ color: tokens.bodyText }}
              >
                {step.title || `Bước ${idx + 1}`}
              </h4>
              <p
                className="text-xs leading-relaxed max-w-[220px]"
                style={{ color: tokens.mutedText }}
              >
                {step.description || 'Mô tả bước này...'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Mobile/Tablet Layout - Simple 2-col grid */}
      <div className={cn(
        isSite ? 'md:hidden' : (isMobile || isTablet ? 'block' : 'hidden'),
      )}>
        <div className={cn('grid gap-4', isSite ? 'grid-cols-2' : (isMobile ? 'grid-cols-1' : 'grid-cols-2'))}>
          {visibleSteps.map((step, idx) => {
            const stepNum = step.icon && /^\d+$/.test(step.icon) ? step.icon : String(idx + 1);

            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 mb-2"
                  style={{
                    borderColor: tokens.primary,
                    boxShadow: `0 6px 16px ${tokens.primary}30`,
                  }}
                >
                  <span className="text-2xl font-bold" style={{ color: tokens.primary }}>
                    {stepNum}
                  </span>
                </div>
                <h4 className="text-xs font-semibold leading-tight px-2 mb-1" style={{ color: tokens.bodyText }}>
                  {step.title || `Bước ${idx + 1}`}
                </h4>
                <p className="text-xs leading-relaxed px-2" style={{ color: tokens.mutedText }}>
                  {step.description || 'Mô tả bước này...'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const renderMinimal = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
  headerConfig = {},
  desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
  cornerRadius = DEFAULT_PROCESS_CORNER_RADIUS,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig?: HeaderConfig;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('minimal', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;

  const isSite = context === 'site';
  const isMobile = previewDevice === 'mobile';
  const isTablet = previewDevice === 'tablet';
  const isCompact = isMobile || isTablet;

  // Layout classes
  const outerPadding = isSite
    ? cn(getProcessSectionSpacingClassName(spacing), 'lg:py-14')
    : cn(getProcessSectionSpacingClassName(spacing), isCompact ? 'px-3' : 'px-4');

  // Cards grid: use desktopColumns setting
  const mdColsMap: Record<number, string> = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };
  const desktopColsClass = mdColsMap[desktopColumns] ?? 'md:grid-cols-4';
  const gridClass = desktopColumns === 3
    ? (isSite
      ? `grid-cols-1 ${desktopColsClass}`
      : (isCompact ? 'grid-cols-1' : desktopColsClass))
    : (isSite
      ? `grid-cols-2 ${desktopColsClass}`
      : (isCompact ? 'grid-cols-2' : desktopColsClass));

  const gapClass = isSite
    ? 'gap-3 md:gap-4'
    : (isCompact ? 'gap-3' : 'gap-3 md:gap-4');

  // Card sizing
  const cardPadding = isSite
    ? 'p-4 md:p-5'
    : (isCompact ? 'p-3' : 'p-4 md:p-5');

  const iconSize = isSite
    ? 'h-10 w-10 md:h-11 md:w-11'
    : (isCompact ? 'h-8 w-8' : 'h-10 w-10 md:h-11 md:w-11');

  const iconInner = isSite
    ? 'h-4 w-4 md:h-5 md:w-5'
    : (isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4 md:h-5 md:w-5');

  const cardMinH = isSite
    ? 'min-h-[190px] md:min-h-[220px]'
    : (isCompact ? 'min-h-[170px]' : 'min-h-[210px]');

  const titleSize = isSite
    ? 'text-sm md:text-base'
    : (isCompact ? 'text-xs' : 'text-sm md:text-base');

  const descSize = isSite
    ? 'text-xs md:text-[13px]'
    : (isCompact ? 'text-[10px]' : 'text-xs');

  return (
    <div className={outerPadding} style={{ backgroundColor: tokens.neutralBackground }}>
      {renderSectionHeader({ tokens, sectionTitle, previewDevice, headerConfig, showBadgeInline: true })}
      <div className="relative mx-auto w-full max-w-[1360px]">
        {/* Dark Background Band */}
        <div
          className={cn(
            'absolute left-0 right-0',
            isSite
              ? 'top-[18%] bottom-[18%] lg:right-4'
              : (isCompact
                ? 'top-[16%] bottom-[16%]'
                : 'top-[18%] bottom-[18%] right-4'),
          )}
          style={{ backgroundColor: '#0a0f18' }}
        />

        <div className="relative z-10 w-full px-4 md:px-6 lg:px-8">
          {/* Cards */}
          <div className={cn('grid', gridClass, gapClass)}>
            {visibleSteps.map((step, idx) => {
              const _stepNum = padNumber(step.icon && /^\d+$/.test(step.icon) ? Number(step.icon) : idx + 1);

              return (
                <div
                  key={step.key}
                  className={cn(
                    'flex flex-col relative border shadow-sm hover:shadow-md transition-shadow',
                    getProcessCornerRadiusClassName(cornerRadius),
                    cardPadding,
                    cardMinH,
                  )}
                  style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder }}
                >


                  {/* Icon circle */}
                  <div
                    className={cn('mb-4 mt-0 flex items-center justify-center rounded-full', iconSize)}
                    style={{ backgroundColor: tokens.neutralSurface, border: `1px solid ${tokens.neutralBorder}` }}
                  >
                    <span className={iconInner} style={{ color: tokens.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: isCompact ? '0.72rem' : '1rem' }}>
                      {step.icon || (idx + 1)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className={cn('mb-2 font-bold tracking-tight', titleSize)}
                    style={{ color: tokens.bodyText }}
                  >
                    {step.title || `Bước ${idx + 1}`}
                  </h3>

                  {/* Description */}
                  <p
                    className={cn('leading-[1.6] lg:leading-[1.65]', descSize)}
                    style={{ color: tokens.mutedText }}
                  >
                    {step.description || 'Mô tả bước này...'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {remainingCount > 0 && (
        <div className="text-center mt-4">
          <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
        </div>
      )}
    </div>
  );
};

const renderGrid = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
  headerConfig = {},
  desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
  cornerRadius = DEFAULT_PROCESS_CORNER_RADIUS,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig?: HeaderConfig;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('grid', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;

  return (
    <div className={getSectionPadding(context, previewDevice, spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      {renderSectionHeader({ tokens, sectionTitle, previewDevice, headerConfig, showBadgeInline: true })}

      <div className={cn(
        'grid gap-3',
        desktopColumns === 3
          ? (previewDevice === 'mobile' ? 'grid-cols-1' : 'grid-cols-3')
          : (previewDevice === 'mobile' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'),
      )}>
        {visibleSteps.map((step, idx) => (
          <div
            key={step.key}
            className={cn('border p-4', getProcessCornerRadiusClassName(cornerRadius))}
            style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm mb-3"
              style={{ backgroundColor: tokens.stepDotBg, color: tokens.stepDotText }}
            >
              {step.icon || idx + 1}
            </div>
            <h4 className="font-semibold text-sm mb-1.5" style={{ color: tokens.bodyText }}>
              {step.title || `Bước ${idx + 1}`}
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: tokens.mutedText }}>
              {step.description || 'Mô tả...'}
            </p>
          </div>
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="text-center mt-4">
          <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
        </div>
      )}
    </div>
  );
};

const isImageUrl = (value: string) => /^https?:\/\//i.test(value) || value.startsWith('/');

const renderCompactMinimal = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
  headerConfig = {},
  desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
  cornerRadius = DEFAULT_PROCESS_CORNER_RADIUS,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig?: HeaderConfig;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('compactMinimal', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;
  const isSite = context === 'site';
  const isMobile = previewDevice === 'mobile';
  const gridClass = isSite
    ? (desktopColumns === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4')
    : (desktopColumns === 3 ? (isMobile ? 'grid-cols-1' : 'grid-cols-3') : (isMobile ? 'grid-cols-2' : 'grid-cols-4'));
  const itemOffset = isSite ? 'md:translate-y-10' : 'translate-y-0 md:translate-y-10';

  return (
    <div className={cn(getSectionPadding(context, previewDevice, spacing), 'overflow-hidden')} style={{ backgroundColor: tokens.neutralSurface }}>
      {renderSectionHeader({ tokens, sectionTitle, previewDevice, headerConfig, showBadgeInline: true })}

      <div className="mx-auto max-w-7xl">
        <div className={cn('grid gap-x-5 gap-y-8', gridClass)}>
          {visibleSteps.map((step, idx) => {
            const stepNum = step.icon && /^\d+$/.test(step.icon) ? padNumber(Number(step.icon)) : padNumber(idx + 1);
            const iconIsImage = isImageUrl(step.icon);
            const isOffset = idx % 2 === 0;

            return (
              <article
                key={step.key}
                className={cn(
                  'relative min-w-0 pl-7',
                  !isMobile && isOffset && itemOffset,
                )}
              >
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-12 h-[calc(100%+42px)] w-px"
                  style={{ background: `linear-gradient(to bottom, ${tokens.neutralBorder}, ${tokens.bodyText})` }}
                />
                <div className="relative">
                  <h3
                    className={cn(
                      'mb-2 pr-2 text-lg font-bold leading-tight break-words md:text-xl',
                      isSite ? 'lg:text-2xl' : '',
                    )}
                    style={{ color: tokens.bodyText }}
                  >
                    {step.title || `Bước ${idx + 1}`}
                    <sup
                      className="ml-2 inline-flex h-8 w-8 -translate-y-2 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: tokens.primary, color: tokens.stepDotText }}
                    >
                      {stepNum}
                    </sup>
                  </h3>
                  <p className="text-sm leading-relaxed break-words" style={{ color: tokens.mutedText }}>
                    {step.description || 'Mô tả bước này...'}
                  </p>
                  {iconIsImage && (
                    <img
                      src={step.icon}
                      alt=""
                      className={cn('mt-3 h-10 w-10 object-contain', getProcessCornerRadiusClassName(cornerRadius))}
                      loading="lazy"
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {remainingCount > 0 && (
        <div className="mt-4 text-center">
          <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
        </div>
      )}
    </div>
  );
};

const renderAlternating = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
  headerConfig = {},
  desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
  cornerRadius = DEFAULT_PROCESS_CORNER_RADIUS,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig?: HeaderConfig;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('alternating', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;
  const isSite = context === 'site';
  const isMobile = previewDevice === 'mobile';
  const isTablet = previewDevice === 'tablet';
  const sectionBackground = tokens.neutralSurface;
  const sectionText = tokens.mutedText;
  const cardBackground = tokens.neutralSurface;
  const cardText = tokens.bodyText;
  const cardIconBackground = tokens.primary;
  const cardIconText = tokens.cardStepText;

  const outerPadding = isSite
    ? cn(getProcessSectionSpacingClassName(spacing), 'px-3')
    : cn(getProcessSectionSpacingClassName(spacing), isMobile ? 'px-3' : 'px-4');
  const trackClass = isSite
    ? cn('grid gap-4', desktopColumns === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4')
    : cn('grid gap-4', desktopColumns === 3 ? (isMobile ? 'grid-cols-1' : 'grid-cols-3') : (isMobile || isTablet ? 'grid-cols-2' : 'grid-cols-4'));
  const itemWidthClass = 'w-full min-w-0';
  const itemHeightClass = isMobile ? 'min-h-[250px]' : 'min-h-[320px]';

  return (
    <div className={cn('relative z-[1] overflow-hidden', outerPadding)} style={{ backgroundColor: sectionBackground }}>
      {renderSectionHeader({ tokens, sectionTitle, previewDevice, headerConfig, showBadgeInline: true })}

      <div className={trackClass}>
        {visibleSteps.map((step, idx) => {
          const inverted = idx % 2 === 1;
          const stepNum = step.icon && /^\d+$/.test(step.icon) ? step.icon : String(idx + 1);
          const iconIsImage = isImageUrl(step.icon);

          const rhythmSpacerEl = (
            <div aria-hidden="true" className={cn('shrink-0', isMobile ? 'h-5' : 'h-8')} />
          );

          const cardEl = (
            <div
              className={cn(
                'relative w-full min-w-0 text-center transition-all duration-300',
                getProcessCornerRadiusClassName(cornerRadius),
                inverted
                  ? (isMobile ? 'mb-6 pt-4 pb-14' : 'mb-8 pt-4 pb-14')
                  : (isMobile ? 'mt-6 pt-14 pb-4' : 'mt-8 pt-14 pb-4'),
                isMobile ? 'px-3' : 'px-4',
              )}
              style={{
                backgroundColor: cardBackground,
                border: `1px solid ${tokens.neutralBorder}`,
              }}
            >
              <div
                className={cn(
                  'absolute left-1/2 flex h-[72px] w-[72px] -translate-x-1/2 items-center justify-center rounded-full',
                  inverted ? 'bottom-[-32px]' : 'top-[-32px]',
                )}
                style={{ backgroundColor: cardIconBackground }}
              >
                {iconIsImage ? (
                  <img
                    src={step.icon}
                    alt={step.title || `Bước ${idx + 1}`}
                    className="max-h-11 max-w-11 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: cardIconText }}>
                    {step.icon || stepNum}
                  </span>
                )}
              </div>

              <h3 className="mb-2 break-words text-lg font-bold leading-6" style={{ color: cardText }}>
                {step.title || `Bước ${idx + 1}`}
              </h3>
              <p className="min-h-12 overflow-hidden break-words text-sm leading-5" style={{ color: cardText }}>
                {step.description || 'Mô tả bước này...'}
              </p>
            </div>
          );

          return (
            <div
              key={step.key}
              className={cn(
                'relative flex min-w-0 flex-col text-center',
                itemWidthClass,
                itemHeightClass,
                inverted ? 'justify-end' : 'justify-start',
              )}
            >
              {inverted ? (
                <>
                  {cardEl}
                  {rhythmSpacerEl}
                </>
              ) : (
                <>
                  {rhythmSpacerEl}
                  {cardEl}
                </>
              )}
            </div>
          );
        })}
      </div>

      {remainingCount > 0 && (
        <div className="mt-4 text-center">
          <span className="text-xs" style={{ color: sectionText }}>+{remainingCount} bước khác</span>
        </div>
      )}
    </div>
  );
};

type HeaderConfig = {
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
};

const renderSectionHeader = ({
  tokens,
  sectionTitle,
  headerConfig,
}: {
  tokens: ProcessColorTokens;
  sectionTitle: string;
  previewDevice: PreviewDevice;
  headerConfig: HeaderConfig;
  showBadgeInline?: boolean;
}) => {
  const {
    hideHeader = false,
    showTitle = true,
    showSubtitle = true,
    subtitle = '',
    headerAlign = 'center',
    titleColorPrimary = false,
    subtitleAboveTitle = false,
    uppercaseText = false,
    showBadge = true,
    badgeText = '',
  } = headerConfig;

  return (
    <SectionHeader
      title={sectionTitle}
      subtitle={subtitle}
      headerAlign={headerAlign}
      titleColorPrimary={titleColorPrimary}
      subtitleAboveTitle={subtitleAboveTitle}
      uppercaseText={uppercaseText}
      showTitle={showTitle}
      showSubtitle={showSubtitle}
      showBadge={showBadge}
      badgeText={badgeText}
      hideHeader={hideHeader}
      brandColor={tokens.primary}
    />
  );
};

const RenderCircular = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
  headerConfig = {},
  spacing = DEFAULT_PROCESS_SPACING,
  circularCtaText = '',
  circularCtaLink = '',
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig?: HeaderConfig;
  spacing?: ProcessSpacing;
  circularCtaText?: string;
  circularCtaLink?: string;
}) => {
  if (steps.length === 0) { return renderEmptyState(tokens); }

  const maxVisible = getMaxVisible('circular', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  
  const [activeIndex, setActiveIndex] = React.useState(0);
  
  React.useEffect(() => {
    if (activeIndex >= visibleSteps.length) {
      setActiveIndex(0);
    }
  }, [visibleSteps.length, activeIndex]);

  const activeStep = visibleSteps[activeIndex] || visibleSteps[0];

  if (!activeStep) { return renderEmptyState(tokens); }

  const N = visibleSteps.length;
  const R = 250;
  const buttonSize = 110;
  const center = 250;

  const getStepCoords = (i: number) => {
    const angle = -90 + i * (360 / N);
    const angleRad = (angle * Math.PI) / 180;
    const x = center + R * Math.cos(angleRad) - buttonSize / 2;
    const y = center + R * Math.sin(angleRad) - buttonSize / 2;
    return { left: `${x}px`, top: `${y}px` };
  };

  const subtitleText = headerConfig.subtitle || '';
  const primaryColor = tokens.primary;

  // Xác định độ tương phản: Nếu màu chính là màu sáng (ví dụ màu vàng, cần chữ tối #0f172a), 
  // hệ thống sẽ tự động dùng màu nền tối (đen/xám đậm) để tạo tương phản cao cực kỳ bắt mắt.
  const isPrimaryLight = getAPCATextColor(primaryColor, 16, 700) === '#0f172a';

  const bgCol = isPrimaryLight ? '#090d16' : tokens.neutralBackground;
  const surfaceCol = isPrimaryLight ? '#121824' : tokens.neutralSurface;
  const borderCol = isPrimaryLight ? '#1e293b' : tokens.neutralBorder;
  const textCol = isPrimaryLight ? '#ffffff' : tokens.bodyText;
  const mutedTextCol = isPrimaryLight ? '#94a3b8' : tokens.mutedText;

  // Lấy nhãn nút CTA từ circularCtaText, nếu không có mới fallback về text mặc định
  const ctaText = circularCtaText || "BẮT ĐẦU DỰ ÁN";

  return (
    <div 
      className={cn(getSectionPadding(context, previewDevice, spacing), "w-full py-16 px-4 md:px-8 transition-colors duration-300")}
      style={{ backgroundColor: bgCol }}
    >
      <div className="mx-auto max-w-[1140px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="text-center lg:text-left space-y-6">
            <h2 
              className="text-4xl sm:text-5xl lg:text-[61px] font-light leading-tight tracking-wide uppercase font-sans"
              style={{ color: textCol }}
            >
              {sectionTitle || "CÁCH CHÚNG TÔI LÀM VIỆC"}
            </h2>
            {subtitleText && (
              <p 
                className="text-lg sm:text-xl font-light leading-relaxed max-w-lg mx-auto lg:mx-0"
                style={{ color: mutedTextCol }}
              >
                {subtitleText}
              </p>
            )}
            <div className="pt-2 flex justify-center lg:justify-start">
              <a
                href={circularCtaLink || "#contact"}
                target="_self"
                className="inline-flex items-center justify-center px-8 py-4 border font-medium tracking-wide text-sm rounded-lg uppercase transition-all duration-300 hover:bg-opacity-10"
                style={{ 
                  color: primaryColor, 
                  borderColor: primaryColor,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColor;
                  e.currentTarget.style.color = tokens.stepDotText;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = primaryColor;
                }}
              >
                {ctaText}
              </a>
            </div>
          </div>

          <div className="flex justify-center items-center py-8 lg:py-0 overflow-visible">
            {/* Wrapper có kích thước vừa vặn chứa toàn bộ vòng tròn 500px + 2 nút lồi 55px (tổng cộng 610px) */}
            <div className="w-[315px] h-[315px] sm:w-[425px] sm:h-[425px] md:w-[480px] md:h-[480px] lg:w-[490px] lg:h-[490px] xl:w-[610px] xl:h-[610px] flex items-center justify-center overflow-visible relative">
              <div className="w-[500px] h-[500px] shrink-0 scale-[0.52] sm:scale-[0.70] md:scale-[0.79] lg:scale-[0.80] xl:scale-100 origin-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform">
                
                <div 
                  className="absolute inset-0 rounded-full border flex flex-col items-center justify-center p-12 text-center transition-all duration-500"
                  style={{ 
                    borderColor: primaryColor, 
                    backgroundColor: surfaceCol,
                    boxShadow: `0 10px 40px ${primaryColor}0f`,
                    borderWidth: '3px'
                  }}
                >
                  <div className="mb-4 flex items-center justify-center" style={{ color: primaryColor }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-medium tracking-wide uppercase mb-3" style={{ color: primaryColor }}>
                    {activeStep.title || `BƯỚC ${activeIndex + 1}`}
                  </h3>
                  <p className="text-sm font-light leading-relaxed max-w-xs" style={{ color: textCol }}>
                    {activeStep.description || "Mô tả bước này..."}
                  </p>
                </div>

                {visibleSteps.map((step, idx) => {
                  const isActive = activeIndex === idx;
                  const coords = getStepCoords(idx);
                  const isImg = step.icon && (/^https?:\/\//i.test(step.icon) || step.icon.startsWith('/'));

                  return (
                    <button
                      key={step.key}
                      onClick={() => setActiveIndex(idx)}
                      style={{ 
                        left: coords.left, 
                        top: coords.top,
                        borderColor: isActive ? primaryColor : (isPrimaryLight ? `${primaryColor}66` : borderCol),
                        color: isActive ? tokens.stepDotText : textCol,
                        backgroundColor: isActive ? primaryColor : surfaceCol,
                        boxShadow: isActive ? `0 8px 24px ${primaryColor}30` : 'none',
                        borderWidth: '3px'
                      }}
                      className="absolute w-[110px] h-[110px] rounded-full border flex items-center justify-center text-sm font-medium tracking-wider cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md z-20 focus:outline-none"
                      aria-label={`Step ${idx + 1}`}
                    >
                      {isImg ? (
                        <img 
                          src={step.icon} 
                          alt="" 
                          className={cn("w-8 h-8 object-contain transition-all", isActive ? "brightness-0 invert" : "")} 
                        />
                      ) : (
                        <span>{step.icon || `Step ${idx + 1}`}</span>
                      )}
                    </button>
                  );
                })}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const ProcessSectionContent = ({
  steps,
  sectionTitle,
  style,
  tokens,
  context,
  previewDevice,
  headerConfig,
  desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
  cornerRadius = DEFAULT_PROCESS_CORNER_RADIUS,
  circularCtaText = '',
  circularCtaLink = '',
}: {
  steps: ProcessSharedStep[];
  sectionTitle: string;
  style: ProcessStyle;
  tokens: ProcessColorTokens;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
  headerConfig: HeaderConfig;
  desktopColumns?: 3 | 4;
  spacing?: ProcessSpacing;
  cornerRadius?: ProcessCornerRadius;
  circularCtaText?: string;
  circularCtaLink?: string;
}) => {
  if (style === 'horizontal') {
    return renderHorizontal({ context, previewDevice, sectionTitle, steps, tokens, headerConfig, desktopColumns, spacing, cornerRadius });
  }

  if (style === 'stepper') {
    return (
      <RenderStepper
        context={context}
        previewDevice={previewDevice}
        sectionTitle={sectionTitle}
        steps={steps}
        tokens={tokens}
        headerConfig={headerConfig}
        desktopColumns={desktopColumns}
        spacing={spacing}
        cornerRadius={cornerRadius}
      />
    );
  }

  if (style === 'cards') {
    return renderCards({ context, previewDevice, sectionTitle, steps, tokens, headerConfig, desktopColumns, spacing, cornerRadius });
  }

  if (style === 'accordion') {
    return renderAccordion({ context, previewDevice, sectionTitle, steps, tokens, headerConfig, desktopColumns, spacing, cornerRadius });
  }

  if (style === 'minimal') {
    return renderMinimal({ context, previewDevice, sectionTitle, steps, tokens, headerConfig, desktopColumns, spacing, cornerRadius });
  }

  if (style === 'compactMinimal') {
    return renderCompactMinimal({ context, previewDevice, sectionTitle, steps, tokens, headerConfig, desktopColumns, spacing, cornerRadius });
  }

  if (style === 'alternating') {
    return renderAlternating({ context, previewDevice, sectionTitle, steps, tokens, headerConfig, desktopColumns, spacing, cornerRadius });
  }

  if (style === 'circular') {
    return (
      <RenderCircular
        context={context}
        previewDevice={previewDevice}
        sectionTitle={sectionTitle}
        steps={steps}
        tokens={tokens}
        headerConfig={headerConfig}
        spacing={spacing}
        circularCtaText={circularCtaText}
        circularCtaLink={circularCtaLink}
      />
    );
  }

  return renderGrid({ context, previewDevice, sectionTitle, steps, tokens, headerConfig, desktopColumns, spacing, cornerRadius });
};

import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

export function ProcessSectionShared({
  steps,
  sectionTitle,
  style,
  brandColor,
  secondary,
  mode,
  context,
  previewDevice = 'desktop',
  setPreviewDevice,
  includePreviewWrapper = false,
  previewStyle,
  onPreviewStyleChange,
  hideHeader = false,
  showTitle = true,
  showSubtitle = true,
  subtitle = '',
  headerAlign = 'center',
  titleColorPrimary = false,
  subtitleAboveTitle = false,
  uppercaseText = false,
  showBadge = true,
  badgeText = '',
  fontStyle,
  fontClassName,
  desktopColumns = 4,
  spacing = DEFAULT_PROCESS_SPACING,
  cornerRadius = DEFAULT_PROCESS_CORNER_RADIUS,
  circularCtaText = '',
  circularCtaLink = '',
  isDark,
}: ProcessSectionSharedProps) {
  const tokens = React.useMemo(() => adaptTokensForDarkMode(getProcessColors(brandColor, secondary, mode), isDark ?? false), [brandColor, secondary, mode, isDark]);
  const selectedStyle = previewStyle ?? style;
  const maxVisible = getMaxVisible(selectedStyle, context, previewDevice);
  const info = getSharedInfoText(selectedStyle, steps.length, Math.min(steps.length, maxVisible), mode);

  const headerConfig: HeaderConfig = { hideHeader, showTitle, showSubtitle, subtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText };

  if (!includePreviewWrapper || context === 'site') {
    return (
      <ProcessSectionContent
        steps={steps}
        sectionTitle={sectionTitle}
        style={selectedStyle}
        tokens={tokens}
        context={context}
        previewDevice={previewDevice}
        headerConfig={headerConfig}
        desktopColumns={desktopColumns}
        spacing={spacing}
        cornerRadius={cornerRadius}
        circularCtaText={circularCtaText}
        circularCtaLink={circularCtaLink}
      />
    );
  }

  return (
    <>
      <PreviewWrapper
        title="Preview Process"
        device={previewDevice}
        setDevice={(nextDevice) => { setPreviewDevice?.(nextDevice); }}
        previewStyle={selectedStyle}
        setPreviewStyle={(next) => onPreviewStyleChange?.(next as ProcessStyle)}
        styles={PROCESS_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[previewDevice]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          <ProcessSectionContent
            steps={steps}
            sectionTitle={sectionTitle}
            style={selectedStyle}
            tokens={tokens}
            context="preview"
            previewDevice={previewDevice}
            headerConfig={headerConfig}
            desktopColumns={desktopColumns}
            spacing={spacing}
            cornerRadius={cornerRadius}
            circularCtaText={circularCtaText}
            circularCtaLink={circularCtaLink}
          />
        </BrowserFrame>
      </PreviewWrapper>
      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={tokens.primary}
          secondary={tokens.secondary}
          description="Màu phụ được dùng tiết chế cho badge và accent phụ; màu chính giữ vai trò chủ đạo trong Process."
        />
      )}
      {mode === 'single' && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Màu chính:</span>
            <div
              className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 shadow-sm"
              style={{ backgroundColor: tokens.primary }}
              title={tokens.primary}
            />
            <span className="font-mono text-slate-600 dark:text-slate-400">{tokens.primary}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Chế độ 1 màu: mọi accent secondary của Process tự động dùng lại màu chính.
          </p>
        </div>
      )}
    </>
  );
}
