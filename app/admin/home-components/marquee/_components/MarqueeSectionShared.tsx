'use client';

import React, { useRef } from 'react';
import { cn } from '@/app/admin/components/ui';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import type { MarqueeColorTokens } from '../_lib/colors';
import type { MarqueeBrandMode, MarqueeCornerRadius, MarqueeDirection, MarqueeItem, MarqueeScale, MarqueeSpeed, MarqueeStyle, MarqueeTextStyle } from '../_types';
import { getMarqueeCornerRadiusClassName, getMarqueeSectionSpacingClassName, normalizeMarqueeCornerRadius, normalizeMarqueeSpacing, type MarqueeSpacing } from '../_types';
import { getSpeedDuration } from '../_lib/constants';
import type { PreviewDevice } from '../../_shared/hooks/usePreviewDevice';

interface MarqueeSectionSharedProps {
  items: MarqueeItem[];
  style: MarqueeStyle;
  direction: MarqueeDirection;
  speed: MarqueeSpeed;
  pauseOnHover: boolean;
  scale: MarqueeScale;
  uppercase?: boolean;
  tokens: MarqueeColorTokens;
  mode: MarqueeBrandMode;
  title?: string;
  subtitle?: string;
  context?: 'preview' | 'site';
  device?: PreviewDevice;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: MarqueeSpacing;
  cornerRadius?: MarqueeCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

// ── Scale system ─────────────────────────────────────────────────
const scaleConfig: Record<MarqueeScale, { fontSize: string; py: string; gap: string; strokeWidth: string }> = {
  1: { fontSize: 'text-sm md:text-base', py: 'py-2.5 md:py-3', gap: 'gap-5 md:gap-8', strokeWidth: '1px' },
  2: { fontSize: 'text-base md:text-xl', py: 'py-4 md:py-5', gap: 'gap-6 md:gap-10', strokeWidth: '1.5px' },
  3: { fontSize: 'text-xl md:text-2xl', py: 'py-5 md:py-7', gap: 'gap-8 md:gap-12', strokeWidth: '2px' },
  4: { fontSize: 'text-2xl md:text-3xl', py: 'py-6 md:py-9', gap: 'gap-10 md:gap-14', strokeWidth: '2.5px' },
  5: { fontSize: 'text-3xl md:text-4xl', py: 'py-8 md:py-12', gap: 'gap-12 md:gap-16', strokeWidth: '3px' },
  6: { fontSize: 'text-4xl md:text-5xl', py: 'py-10 md:py-14', gap: 'gap-14 md:gap-18', strokeWidth: '3.5px' },
  7: { fontSize: 'text-4xl md:text-6xl', py: 'py-12 md:py-16', gap: 'gap-16 md:gap-20', strokeWidth: '4px' },
  8: { fontSize: 'text-5xl md:text-7xl', py: 'py-14 md:py-20', gap: 'gap-18 md:gap-24', strokeWidth: '4.5px' },
  9: { fontSize: 'text-6xl md:text-8xl', py: 'py-16 md:py-24', gap: 'gap-20 md:gap-28', strokeWidth: '5px' },
  10: { fontSize: 'text-7xl md:text-9xl', py: 'py-20 md:py-28', gap: 'gap-24 md:gap-32', strokeWidth: '6px' },
};

// ── Text style renderer ──────────────────────────────────────────
function StyledText({ text, textStyle, color, strokeColor, strokeWidth }: {
  text: string;
  textStyle: MarqueeTextStyle;
  color: string;
  strokeColor?: string;
  strokeWidth: string;
}) {
  switch (textStyle) {
    case 'outlined':
      return (
        <span
          className="font-extrabold tracking-wider shrink-0 uppercase"
          style={{
            color: 'transparent',
            WebkitTextStroke: `${(parseFloat(strokeWidth) / 3).toFixed(2)}px ${strokeColor ?? color}`,
          }}
        >
          {text}
        </span>
      );
    case 'bold':
      return (
        <span className="font-black tracking-wide shrink-0 uppercase" style={{ color }}>
          {text}
        </span>
      );
    case 'shadow':
      return (
        <span
          className="font-semibold tracking-wide shrink-0"
          style={{
            color,
            textShadow: `2px 2px 4px rgba(0,0,0,0.3)`,
          }}
        >
          {text}
        </span>
      );
    case 'normal':
    default:
      return (
        <span className="font-semibold tracking-wide shrink-0" style={{ color }}>
          {text}
        </span>
      );
  }
}

// ── Build segments from items ────────────────────────────────────
const buildSegments = (items: MarqueeItem[]) => {
  const baseItems = items.filter((item) => item.text.trim().length > 0);
  if (baseItems.length === 0) { return []; }

  // Always repeat 4 times for seamless infinite loop
  const result: Array<{ text: string; separator: string; textStyle: MarqueeTextStyle }> = [];
  for (let r = 0; r < 4; r++) {
    for (const item of baseItems) {
      result.push({
        text: item.text,
        separator: item.separator ?? '✦',
        textStyle: item.textStyle ?? 'normal',
      });
    }
  }
  return result;
};

// ── Marquee Track (fixed pause-on-hover) ─────────────────────────
function MarqueeTrack({
  children,
  direction,
  duration,
  pauseOnHover,
}: {
  children: React.ReactNode;
  direction: MarqueeDirection;
  duration: number;
  pauseOnHover: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (pauseOnHover && trackRef.current) {
      trackRef.current.style.animationPlayState = 'paused';
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && trackRef.current) {
      trackRef.current.style.animationPlayState = 'running';
    }
  };

  const animationName = direction === 'right' ? 'marqueeRight' : 'marqueeLeft';

  return (
    <div
      className="relative"
      style={{ overflowX: 'clip', overflowY: 'visible' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap leading-relaxed"
        style={{
          animation: `${animationName} ${duration}s linear infinite`,
        }}
      >
        {children}
        {children}
      </div>
      <style>{`
        @keyframes marqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ── Shared segment renderer ──────────────────────────────────────
function SegmentList({ segments, textColor, separatorColor, strokeColor, scale }: {
  segments: ReturnType<typeof buildSegments>;
  textColor: string;
  separatorColor: string;
  strokeColor?: string;
  scale: MarqueeScale;
}) {
  const cfg = scaleConfig[scale];
  return (
    <div className={cn('flex items-center px-4', cfg.fontSize, cfg.gap)}>
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          <StyledText
            text={seg.text}
            textStyle={seg.textStyle}
            color={textColor}
            strokeColor={strokeColor}
            strokeWidth={cfg.strokeWidth}
          />
          <span className="shrink-0 opacity-50 whitespace-pre" style={{ color: separatorColor }}>
            {seg.separator}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Layout 1: Ribbon ─────────────────────────────────────────────
function RibbonLayout({ items, tokens, duration, direction, pauseOnHover, scale, cornerRadiusClassName }: LayoutProps) {
  const segments = buildSegments(items);
  const cfg = scaleConfig[scale];
  return (
    <div className={cn(cfg.py, 'overflow-hidden', cornerRadiusClassName)} style={{ backgroundColor: tokens.ribbonBg }}>
      <MarqueeTrack direction={direction} duration={duration} pauseOnHover={pauseOnHover}>
        <SegmentList segments={segments} textColor={tokens.ribbonText} separatorColor="rgba(255,255,255,0.5)" strokeColor={tokens.ribbonText} scale={scale} />
      </MarqueeTrack>
    </div>
  );
}

// ── Layout 2: Gradient ───────────────────────────────────────────
function GradientLayout({ items, tokens, duration, direction, pauseOnHover, scale, cornerRadiusClassName }: LayoutProps) {
  const segments = buildSegments(items);
  const cfg = scaleConfig[scale];
  return (
    <div
      className={cn(cfg.py, 'overflow-hidden', cornerRadiusClassName)}
      style={{ background: `linear-gradient(135deg, ${tokens.gradientFrom}, ${tokens.gradientVia}, ${tokens.gradientTo})` }}
    >
      <MarqueeTrack direction={direction} duration={duration} pauseOnHover={pauseOnHover}>
        <SegmentList segments={segments} textColor={tokens.gradientText} separatorColor="rgba(255,255,255,0.4)" strokeColor={tokens.gradientText} scale={scale} />
      </MarqueeTrack>
    </div>
  );
}

// ── Layout 3: Minimal ────────────────────────────────────────────
function MinimalLayout({ items, tokens, duration, direction, pauseOnHover, scale, cornerRadiusClassName }: LayoutProps) {
  const segments = buildSegments(items);
  const cfg = scaleConfig[scale];
  return (
    <div className={cn(cfg.py, 'overflow-hidden border-y', cornerRadiusClassName)} style={{ backgroundColor: tokens.minimalBg, borderColor: tokens.minimalBorder }}>
      <MarqueeTrack direction={direction} duration={duration} pauseOnHover={pauseOnHover}>
        <SegmentList segments={segments} textColor={tokens.minimalText} separatorColor={tokens.minimalBorder} strokeColor={tokens.minimalText} scale={scale} />
      </MarqueeTrack>
    </div>
  );
}

// ── Layout 4: Dark ───────────────────────────────────────────────
function DarkLayout({ items, tokens, duration, direction, pauseOnHover, scale, cornerRadiusClassName }: LayoutProps) {
  const segments = buildSegments(items);
  const cfg = scaleConfig[scale];
  return (
    <div 
      className={cn(cfg.py, 'overflow-hidden border-y', cornerRadiusClassName)} 
      style={{ 
        backgroundColor: tokens.darkBg,
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <MarqueeTrack direction={direction} duration={duration} pauseOnHover={pauseOnHover}>
        <SegmentList segments={segments} textColor={tokens.darkText} separatorColor={tokens.darkAccent} strokeColor={tokens.darkText} scale={scale} />
      </MarqueeTrack>
    </div>
  );
}

// ── Layout 5: Split ──────────────────────────────────────────────
function SplitLayout({ items, tokens, duration, direction, pauseOnHover, scale, cornerRadiusClassName }: LayoutProps) {
  const segments = buildSegments(items);
  const half = Math.ceil(segments.length / 2);
  const topSegments = segments.slice(0, half);
  const bottomSegments = segments.slice(half);
  const cfg = scaleConfig[scale];

  return (
    <div className={cn('space-y-0 overflow-hidden', cornerRadiusClassName)}>
      <div className={cfg.py} style={{ backgroundColor: tokens.splitBgTop }}>
        <MarqueeTrack direction={direction} duration={duration} pauseOnHover={pauseOnHover}>
          <SegmentList segments={topSegments} textColor={tokens.splitTextTop} separatorColor="rgba(255,255,255,0.4)" strokeColor={tokens.splitTextTop} scale={scale} />
        </MarqueeTrack>
      </div>
      <div className={cfg.py} style={{ backgroundColor: tokens.splitBgBottom }}>
        <MarqueeTrack direction={direction === 'left' ? 'right' : 'left'} duration={duration * 1.2} pauseOnHover={pauseOnHover}>
          <SegmentList segments={bottomSegments} textColor={tokens.splitTextBottom} separatorColor="rgba(255,255,255,0.4)" strokeColor={tokens.splitTextBottom} scale={scale} />
        </MarqueeTrack>
      </div>
    </div>
  );
}

// ── Layout 6: Stripe (alternating text colors) ──────────────────
function StripeLayout({ items, tokens, duration, direction, pauseOnHover, scale, cornerRadiusClassName }: LayoutProps) {
  const segments = buildSegments(items);
  const cfg = scaleConfig[scale];
  return (
    <div className={cn(cfg.py, 'overflow-hidden bg-white', cornerRadiusClassName)}>
      <MarqueeTrack direction={direction} duration={duration} pauseOnHover={pauseOnHover}>
        <div className={cn('flex items-center px-4', cfg.fontSize, cfg.gap)}>
          {segments.map((seg, i) => (
            <React.Fragment key={i}>
              <StyledText
                text={seg.text}
                textStyle={seg.textStyle}
                color={i % 2 === 0 ? '#1e293b' : tokens.primary}
                strokeColor={i % 2 === 0 ? '#1e293b' : tokens.primary}
                strokeWidth={cfg.strokeWidth}
              />
              <span className="shrink-0 opacity-40 whitespace-pre" style={{ color: tokens.primary }}>
                {seg.separator}
              </span>
            </React.Fragment>
          ))}
        </div>
      </MarqueeTrack>
    </div>
  );
}

// ── Shared layout props ──────────────────────────────────────────
interface LayoutProps {
  items: MarqueeItem[];
  tokens: MarqueeColorTokens;
  duration: number;
  direction: MarqueeDirection;
  pauseOnHover: boolean;
  scale: MarqueeScale;
  cornerRadiusClassName: string;
}

// ── Main Section ─────────────────────────────────────────────────
export function MarqueeSectionShared(props: MarqueeSectionSharedProps) {
  const {
    items, style, direction, speed, pauseOnHover, scale,
    tokens, title, subtitle, uppercase,
    hideHeader, showTitle, showSubtitle, headerAlign, titleColorPrimary,
    subtitleAboveTitle, uppercaseText, showBadge, badgeText,
    spacing, cornerRadius, noBorderRadius, noVerticalMargin, fontStyle, fontClassName,
  } = props;

  const duration = getSpeedDuration(speed, items.length);
  const normalizedSpacing = normalizeMarqueeSpacing(spacing, noVerticalMargin);
  const cornerRadiusClassName = getMarqueeCornerRadiusClassName(normalizeMarqueeCornerRadius(cornerRadius, noBorderRadius));
  const resolvedBadgeText = (badgeText ?? '').trim();
  const shouldShowBadge = showBadge !== false && resolvedBadgeText.length > 0;
  const hasHeaderContent = !hideHeader
    && ((showTitle !== false && (title ?? '').trim().length > 0)
      || (showSubtitle === true && (subtitle ?? '').trim().length > 0)
      || shouldShowBadge);

  const layoutProps: LayoutProps = { items, tokens, duration, direction, pauseOnHover, scale: scale ?? 1, cornerRadiusClassName };

  const renderLayout = () => {
    switch (style) {
      case 'gradient': return <GradientLayout {...layoutProps} />;
      case 'minimal': return <MinimalLayout {...layoutProps} />;
      case 'dark': return <DarkLayout {...layoutProps} />;
      case 'split': return <SplitLayout {...layoutProps} />;
      case 'stripe': return <StripeLayout {...layoutProps} />;
      case 'ribbon':
      default: return <RibbonLayout {...layoutProps} />;
    }
  };

  return (
    <section
      className={cn(fontClassName, getMarqueeSectionSpacingClassName(normalizedSpacing))}
      style={{ ...fontStyle, textTransform: uppercase ? 'uppercase' : 'none' }}
    >
      <div className="space-y-4 md:space-y-6">
        {hasHeaderContent && (
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader
              title={title}
              subtitle={subtitle}
              hideHeader={hideHeader}
              showTitle={showTitle}
              showSubtitle={showSubtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={shouldShowBadge}
              badgeText={resolvedBadgeText}
              brandColor={tokens.primary}
            />
          </div>
        )}
        {renderLayout()}
      </div>
    </section>
  );
}
