'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, type PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { COUNTDOWN_STYLES } from '../_lib/constants';
import { getSectionSpacingClassName, normalizeSectionSpacing } from '../../_shared/types/sectionSpacing';
import type { CountdownColorTokens } from '../_lib/colors';
import type {
  CountdownBrandMode,
  CountdownConfigState,
  CountdownStyle,
} from '../_types';
import { getCountdownCornerRadiusClassName, normalizeCountdownCornerRadius } from '../_types';

type CountdownSharedContext = 'preview' | 'site';

interface CountdownTimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

interface CountdownSectionSharedProps {
  config: CountdownConfigState;
  title: string;
  mode: CountdownBrandMode;
  tokens: CountdownColorTokens;
  timeLeft: CountdownTimeLeft;
  context: CountdownSharedContext;
  isPopupDismissed?: boolean;
  onDismissPopup?: () => void;
  includePreviewWrapper?: boolean;
  previewDevice?: PreviewDevice;
  setPreviewDevice?: (device: PreviewDevice) => void;
  previewStyle?: CountdownStyle;
  onPreviewStyleChange?: (style: CountdownStyle) => void;
  showColorInfo?: boolean;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

const safeHref = (value: string) => {
  const href = value.trim();
  return href.length > 0 ? href : '#';
};

const renderAction = ({
  context,
  href,
  className,
  style,
  children,
  onClick,
}: {
  context: CountdownSharedContext;
  href: string;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  if (context === 'site') {
    return (
      <Link href={href} className={className} style={style} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
};

const TimeUnit = ({
  label,
  value,
  tokens,
  variant,
}: {
  label: string;
  value: number;
  tokens: CountdownColorTokens;
  variant: 'light' | 'solid' | 'outlined';
}) => {
  if (variant === 'light') {
    return (
      <div className="flex flex-col items-center">
        <div
          className="rounded-lg px-3 py-2 min-w-[52px] md:min-w-[62px] border border-white/20"
          style={{
            backgroundColor: tokens.stickyChipBg,
          }}
        >
          <span className="text-2xl md:text-3xl font-bold tabular-nums text-white">{String(value).padStart(2, '0')}</span>
        </div>
        <span className="text-xs mt-1 uppercase tracking-wider text-white/80">{label}</span>
      </div>
    );
  }

  if (variant === 'outlined') {
    return (
      <div className="flex flex-col items-center">
        <div
          className="rounded-lg px-3 py-2 min-w-[52px] md:min-w-[62px] border"
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.timerCardBorder,
          }}
        >
          <span className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: tokens.secondary }}>
            {String(value).padStart(2, '0')}
          </span>
        </div>
        <span className="text-xs mt-1 uppercase tracking-wider" style={{ color: tokens.timerLabel }}>{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-lg px-3 py-2 min-w-[52px] md:min-w-[62px] border"
        style={{
          backgroundColor: tokens.timerCardBg,
          borderColor: tokens.timerCardBorder,
        }}
      >
        <span className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: tokens.timerCardText }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs mt-1 uppercase tracking-wider" style={{ color: tokens.timerLabel }}>{label}</span>
    </div>
  );
};

const renderExpiredState = (light = false) => (
  <div
    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
    style={{
      backgroundColor: light ? 'rgba(255,255,255,0.2)' : '#fee2e2',
      color: light ? '#ffffff' : '#dc2626',
    }}
  >
    <span>Khuyến mãi đã kết thúc</span>
  </div>
);

const TimerDisplay = ({
  config,
  timeLeft,
  tokens,
  variant,
}: {
  config: CountdownConfigState;
  timeLeft: CountdownTimeLeft;
  tokens: CountdownColorTokens;
  variant: 'light' | 'solid' | 'outlined';
}) => {
  const parts: Array<{ key: string; label: string; value: number; show: boolean }> = [
    { key: 'days', label: 'Ngày', value: timeLeft.days, show: config.showDays },
    { key: 'hours', label: 'Giờ', value: timeLeft.hours, show: config.showHours },
    { key: 'minutes', label: 'Phút', value: timeLeft.minutes, show: config.showMinutes },
    { key: 'seconds', label: 'Giây', value: timeLeft.seconds, show: config.showSeconds },
  ].filter((item) => item.show);

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {parts.map((part, index) => (
        <React.Fragment key={part.key}>
          <TimeUnit label={part.label} value={part.value} tokens={tokens} variant={variant} />
          {index < parts.length - 1 ? (
            <span
              className="text-xl font-bold"
              style={{ color: variant === 'light' ? 'rgba(255,255,255,0.7)' : tokens.timerSeparator }}
            >
              :
            </span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
};

const CountdownContent = ({
  config,
  title,
  timeLeft,
  tokens,
  context,
  isPopupDismissed = false,
  onDismissPopup,
}: {
  config: CountdownConfigState;
  title: string;
  timeLeft: CountdownTimeLeft;
  tokens: CountdownColorTokens;
  context: CountdownSharedContext;
  isPopupDismissed?: boolean;
  onDismissPopup?: () => void;
}) => {
  const heading = config.heading.trim() || title;
  const subHeading = config.subHeading.trim();
  const description = config.description.trim();
  const buttonText = config.buttonText.trim();
  const discountText = config.discountText.trim();
  const buttonLink = safeHref(config.buttonLink);
  const backgroundImage = config.backgroundImage.trim();
  const style = config.style;
  const sectionSpacingClassName = getSectionSpacingClassName(normalizeSectionSpacing(config.spacing));
  const cardRadiusClassName = getCountdownCornerRadiusClassName(normalizeCountdownCornerRadius(config.cornerRadius, config.noBorderRadius));

  if (style === 'banner') {
    return (
      <section
        className={cn('relative w-full px-4 overflow-hidden', sectionSpacingClassName, cardRadiusClassName)}
        style={{
          background: backgroundImage
            ? `linear-gradient(rgba(2,6,23,0.62), rgba(2,6,23,0.62)), url(${backgroundImage}) center/cover`
            : tokens.sectionGradient,
        }}
      >
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {discountText ? (
            <span
              className="inline-flex mb-4 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
              style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}
            >
              {discountText}
            </span>
          ) : null}
          {subHeading ? <p className="text-white/80 text-sm md:text-base uppercase tracking-wider mb-2">{subHeading}</p> : null}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">{heading}</h2>
          {description ? <p className="text-white/90 mb-6 max-w-2xl mx-auto">{description}</p> : null}
          <div className="flex justify-center mb-6" role="timer" aria-live="polite">
            {timeLeft.isExpired ? renderExpiredState(true) : <TimerDisplay config={config} timeLeft={timeLeft} tokens={tokens} variant="light" />}
          </div>
          {buttonText && !timeLeft.isExpired
            ? renderAction({
              context,
              href: buttonLink,
              className: 'inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105',
              style: { backgroundColor: tokens.ctaGhostBg, color: tokens.ctaGhostText },
              children: (
                <>
                  {buttonText}
                  <ArrowRight size={16} />
                </>
              ),
            })
            : null}
        </div>
      </section>
    );
  }

  if (style === 'floating') {
    return (
      <section className={cn('px-4', sectionSpacingClassName)}>
        <div className="max-w-4xl mx-auto">
          <div
            className={cn('relative overflow-hidden shadow-2xl', cardRadiusClassName)}
            style={{
              background: backgroundImage
                ? `linear-gradient(rgba(2,6,23,0.5), rgba(2,6,23,0.5)), url(${backgroundImage}) center/cover`
                : tokens.floatingGradient,
            }}
          >
            {discountText ? (
              <div className="absolute -right-12 top-6 rotate-45 px-12 py-1 text-sm font-bold shadow-lg" style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}>
                {discountText}
              </div>
            ) : null}
            <div className="p-6 md:p-10 text-center">
              {subHeading ? (
                <span className="inline-flex mb-3 px-3 py-1 rounded-full text-xs md:text-sm font-medium uppercase tracking-wider border" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
                  {subHeading}
                </span>
              ) : null}
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3">{heading}</h2>
              {description ? <p className="text-white/80 mb-6 text-sm md:text-base">{description}</p> : null}
              <div className="flex justify-center mb-6" role="timer" aria-live="polite">
                {timeLeft.isExpired ? renderExpiredState(true) : <TimerDisplay config={config} timeLeft={timeLeft} tokens={tokens} variant="light" />}
              </div>
              {buttonText && !timeLeft.isExpired
                ? renderAction({
                  context,
                  href: buttonLink,
                  className: 'inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:shadow-lg',
                  style: { backgroundColor: tokens.ctaGhostBg, color: tokens.ctaGhostText },
                  children: buttonText,
                })
                : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'minimal') {
    return (
      <section className={cn('px-4', sectionSpacingClassName)} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-4xl mx-auto">
          <div className={cn('border p-6 md:p-10', cardRadiusClassName)} style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                {discountText ? (
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}>
                    {discountText}
                  </span>
                ) : null}
                {subHeading ? <p className="text-sm mb-1" style={{ color: tokens.mutedText }}>{subHeading}</p> : null}
                <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: tokens.heading }}>{heading}</h2>
                {description ? <p className="text-sm mb-4" style={{ color: tokens.mutedText }}>{description}</p> : null}
                {buttonText && !timeLeft.isExpired
                  ? renderAction({
                    context,
                    href: buttonLink,
                    className: 'hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-colors',
                    style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                    children: buttonText,
                  })
                  : null}
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs uppercase tracking-wider mb-3" style={{ color: tokens.timerLabel }}>Kết thúc sau</p>
                {timeLeft.isExpired ? renderExpiredState() : <TimerDisplay config={config} timeLeft={timeLeft} tokens={tokens} variant="outlined" />}
                {buttonText && !timeLeft.isExpired
                  ? renderAction({
                    context,
                    href: buttonLink,
                    className: 'md:hidden inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm mt-4 transition-colors',
                    style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                    children: buttonText,
                  })
                  : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'split') {
    return (
      <section className={cn('px-4', sectionSpacingClassName)}>
        <div className="max-w-5xl mx-auto">
          <div className={cn('overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-2', cardRadiusClassName)}>
            <div
              className="relative flex items-center justify-center min-h-[220px] md:min-h-[320px]"
              style={{
                background: backgroundImage
                  ? `url(${backgroundImage}) center/cover`
                  : tokens.splitGradient,
              }}
            >
              {!backgroundImage && discountText ? (
                <div className="text-center text-white p-6">
                  <div className="text-5xl md:text-7xl font-black mb-2">{discountText}</div>
                  <div className="text-lg md:text-xl font-medium opacity-90">GIẢM GIÁ</div>
                </div>
              ) : null}
              {backgroundImage && discountText ? (
                <span className="absolute top-4 left-4 px-4 py-2 rounded-lg font-bold text-xl" style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}>
                  {discountText}
                </span>
              ) : null}
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center" style={{ backgroundColor: tokens.neutralSurface }}>
              {subHeading ? <p className="text-sm uppercase tracking-wider mb-2" style={{ color: tokens.secondary }}>{subHeading}</p> : null}
              <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: tokens.heading }}>{heading}</h2>
              {description ? <p className="text-sm mb-5" style={{ color: tokens.mutedText }}>{description}</p> : null}
              <div className="mb-5">
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: tokens.timerLabel }}>Còn lại</p>
                {timeLeft.isExpired ? renderExpiredState() : <TimerDisplay config={config} timeLeft={timeLeft} tokens={tokens} variant="solid" />}
              </div>
              {buttonText && !timeLeft.isExpired
                ? renderAction({
                  context,
                  href: buttonLink,
                  className: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all w-full md:w-auto',
                  style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                  children: (
                    <>
                      {buttonText}
                      <ArrowRight size={16} />
                    </>
                  ),
                })
                : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'sticky') {
    return (
      <section className={cn('w-full px-4', sectionSpacingClassName, cardRadiusClassName)} style={{ backgroundColor: tokens.primary }} role="banner" aria-label="Khuyến mãi có thời hạn">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
              {discountText ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase" style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeText }}>
                  {discountText}
                </span>
              ) : null}
              <span className="font-semibold text-sm md:text-base" style={{ color: tokens.stickyText }}>{heading}</span>
            </div>
            <div className="flex items-center gap-2">
              {timeLeft.isExpired ? (
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Đã kết thúc</span>
              ) : (
                <div className="flex items-center gap-1.5 font-mono" role="timer" aria-live="polite" style={{ color: '#ffffff' }}>
                  {config.showDays ? (
                    <>
                      <span className="px-2 py-1 rounded text-sm font-bold" style={{ backgroundColor: tokens.stickyChipBg }}>
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-white/60">:</span>
                    </>
                  ) : null}
                  {config.showHours ? (
                    <>
                      <span className="px-2 py-1 rounded text-sm font-bold" style={{ backgroundColor: tokens.stickyChipBg }}>
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-white/60">:</span>
                    </>
                  ) : null}
                  {config.showMinutes ? (
                    <>
                      <span className="px-2 py-1 rounded text-sm font-bold" style={{ backgroundColor: tokens.stickyChipBg }}>
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      {config.showSeconds ? <span className="text-white/60">:</span> : null}
                    </>
                  ) : null}
                  {config.showSeconds ? (
                    <span className="px-2 py-1 rounded text-sm font-bold" style={{ backgroundColor: tokens.stickyChipBg }}>
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            {buttonText && !timeLeft.isExpired
              ? renderAction({
                context,
                href: buttonLink,
                className: 'px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap',
                style: { backgroundColor: tokens.ctaGhostBg, color: tokens.ctaGhostText },
                children: buttonText,
              })
              : null}
          </div>
        </div>
      </section>
    );
  }

  if (isPopupDismissed) {
    return null;
  }

  const dismiss = onDismissPopup ?? (() => undefined);
  const popupBody = (
    <div
      className={`inset-0 flex items-center justify-center p-4 ${context === 'preview' ? 'relative min-h-[420px]' : 'fixed z-[9999]'}`}
      style={{ backgroundColor: tokens.popupScrim }}
      role="dialog"
      aria-modal={context === 'site' ? 'true' : undefined}
      aria-labelledby="countdown-popup-title"
      onClick={dismiss}
    >
      <div
        className={cn('shadow-2xl overflow-hidden relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300', cardRadiusClassName)}
        style={{ backgroundColor: tokens.neutralSurface }}
        onClick={(event) => { event.stopPropagation(); }}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ backgroundColor: tokens.popupCloseBg, color: tokens.popupCloseText }}
        >
          <X size={16} />
        </button>

        <div
          className="h-36 md:h-44 flex items-center justify-center"
          style={{
            background: backgroundImage
              ? `linear-gradient(rgba(2,6,23,0.3), rgba(2,6,23,0.3)), url(${backgroundImage}) center/cover`
              : tokens.popupGradient,
          }}
        >
          {discountText ? (
            <div className="text-center text-white">
              <div className="text-5xl md:text-6xl font-black">{discountText}</div>
              <div className="text-sm font-medium opacity-80 mt-1">{subHeading || 'GIẢM GIÁ'}</div>
            </div>
          ) : null}
        </div>

        <div className="p-5 md:p-6 text-center">
          <h3 id="countdown-popup-title" className="text-xl md:text-2xl font-bold mb-2" style={{ color: tokens.heading }}>{heading}</h3>
          {description ? <p className="text-sm mb-4 line-clamp-2" style={{ color: tokens.mutedText }}>{description}</p> : null}
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: tokens.timerLabel }}>Còn lại</p>
            {timeLeft.isExpired ? renderExpiredState() : <TimerDisplay config={config} timeLeft={timeLeft} tokens={tokens} variant="solid" />}
          </div>
          {buttonText && !timeLeft.isExpired
            ? renderAction({
              context,
              href: buttonLink,
              className: 'inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg font-semibold transition-all',
              style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
              children: buttonText,
            })
            : null}
          <button type="button" onClick={dismiss} className="text-xs mt-3" style={{ color: tokens.mutedText }}>
            Để sau
          </button>
        </div>
      </div>
    </div>
  );

  if (context === 'preview') {
    return (
      <section className={cn('w-full px-4', sectionSpacingClassName)} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className={cn('mx-auto max-w-2xl border overflow-hidden', cardRadiusClassName)} style={{ borderColor: tokens.neutralBorder }}>
          {popupBody}
        </div>
      </section>
    );
  }

  return popupBody;
};

export function CountdownSectionShared({
  config,
  title,
  mode,
  tokens,
  timeLeft,
  context,
  isPopupDismissed,
  onDismissPopup,
  includePreviewWrapper = false,
  previewDevice = 'desktop',
  setPreviewDevice,
  previewStyle,
  onPreviewStyleChange,
  showColorInfo = false,
  fontStyle,
  fontClassName,
}: CountdownSectionSharedProps) {
  const countdownContent = (
    <CountdownContent
      config={config}
      title={title}
      timeLeft={timeLeft}
      tokens={tokens}
      context={context}
      isPopupDismissed={isPopupDismissed}
      onDismissPopup={onDismissPopup}
    />
  );

  if (!includePreviewWrapper || context !== 'preview') {
    return countdownContent;
  }

  const selectedStyle = previewStyle ?? config.style;

  return (
    <>
      <PreviewWrapper
        title="Preview Countdown"
        device={previewDevice}
        setDevice={(device) => { setPreviewDevice?.(device); }}
        previewStyle={selectedStyle}
        setPreviewStyle={(style) => { onPreviewStyleChange?.(style as CountdownStyle); }}
        styles={COUNTDOWN_STYLES}
        info={`Brand mode: ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        deviceWidthClass={deviceWidths[previewDevice]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="/countdown">
          {countdownContent}
        </BrowserFrame>
      </PreviewWrapper>
      {showColorInfo ? (
        <ColorInfoPanel
          brandColor={tokens.primary}
          secondary={tokens.secondary}
          description="Màu phụ được áp dụng cho CTA, accent timer, badge và nhấn mạnh ở 6 layout Countdown."
        />
      ) : null}
    </>
  );
}
