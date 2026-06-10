'use client';

import React from 'react';
import { Image as ImageIcon, X, icons } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, type PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { getPopupColorTokens } from '../_lib/colors';
import { POPUP_STYLES } from '../_lib/constants';
import type { PopupConfig, PopupStyle } from '../_types';
import { adaptTokensForDarkMode } from '@/components/site/home/utils/darkModeColorAdapter';

type PopupContext = 'preview' | 'site';

interface PopupSectionSharedProps {
  config: PopupConfig;
  brandColor: string;
  secondary?: string;
  mode?: 'single' | 'dual';
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  sectionTitle: string;
  context: PopupContext;
  includePreviewWrapper?: boolean;
  previewDevice?: PreviewDevice;
  setPreviewDevice?: (device: PreviewDevice) => void;
  previewStyle?: PopupStyle;
  onPreviewStyleChange?: (style: PopupStyle) => void;
  isDark?: boolean;
}

const getPopupStorageKey = (config: PopupConfig) => {
  const raw = `${config.style}:${config.heading}:${config.primaryButtonText}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return `vietadmin_home_popup_${hash.toString(36)}`;
};

const getTodayStorageKey = (config: PopupConfig) => `${getPopupStorageKey(config)}_today`;

const getTodayValue = () => new Date().toISOString().slice(0, 10);

const getHref = (value: string) => value.trim() || '#';

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

const getLinkProps = (hrefValue: string) => {
  const href = getHref(hrefValue);
  return {
    href,
    rel: isExternalHref(href) ? 'noopener noreferrer' : undefined,
    target: isExternalHref(href) ? '_blank' as const : undefined,
  };
};

function PopupIcon({ config, brandColor }: { config: PopupConfig; brandColor: string }) {
  if (!config.showIcon) {
    return null;
  }
  const IconComponent = icons[config.icon as keyof typeof icons] || icons.Bell;

  return (
    <div
      className={`mx-auto flex h-16 w-16 items-center justify-center border text-white ${roundedClass(config, 'rounded-3xl', 'rounded-xl')}`}
      style={{ backgroundColor: brandColor, borderColor: brandColor }}
    >
      <IconComponent className="h-7 w-7" />
    </div>
  );
}

function PopupImage({ config, className }: { config: PopupConfig; className?: string }) {
  if (!config.imageUrl.trim()) {
    return (
      <div className={className}>
        <div className={`flex h-full min-h-[180px] items-center justify-center border border-dashed border-slate-200 bg-slate-50 text-slate-300 ${roundedClass(config, 'rounded-[1.5rem]', 'rounded-xl')}`}>
          <ImageIcon className="h-10 w-10" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <img src={config.imageUrl} alt={config.heading || sectionImageAlt} className={`h-full min-h-[180px] w-full object-cover ${roundedClass(config, 'rounded-[1.5rem]', 'rounded-xl')}`} />
    </div>
  );
}

const sectionImageAlt = 'Popup image';

function SunburstPattern() {
  return (
    <div className="absolute inset-0 opacity-[0.08] pointer-events-none overflow-hidden select-none">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sunburst-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
          </radialGradient>
        </defs>
        <g fill="url(#sunburst-glow)">
          {Array.from({ length: 12 }).map((_, idx) => {
            const angle1 = (idx * 360) / 12;
            const angle2 = angle1 + 15;
            const rad1 = (angle1 * Math.PI) / 180;
            const rad2 = (angle2 * Math.PI) / 180;
            const x1 = 50 + 100 * Math.cos(rad1);
            const y1 = 50 + 100 * Math.sin(rad1);
            const x2 = 50 + 100 * Math.cos(rad2);
            const y2 = 50 + 100 * Math.sin(rad2);
            return (
              <path
                key={idx}
                d={`M 50 50 L ${x1} ${y1} L ${x2} ${y2} Z`}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

const parseDescription = (text: string, isDarkBg: boolean) => {
  if (!text) {return null;}
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      const clean = part.slice(1, -1);
      return (
        <span key={index} className={isDarkBg ? 'text-[#f59e0b] underline font-bold' : 'text-blue-600 underline font-bold'}>
          {clean}
        </span>
      );
    }
    return part;
  });
};

const getPopupBackgroundStyle = (config: PopupConfig, brandColor: string, secondary?: string) => {
  const mode = config.backgroundMode ?? 'solid';
  const secColor = secondary || brandColor;

  if (mode === 'brand' || mode === 'pattern-sunburst') {
    return { backgroundColor: brandColor };
  }
  if (mode === 'secondary-solid' || mode === 'pattern-sunburst-secondary') {
    return { backgroundColor: secColor };
  }
  if (mode === 'gradient-brand-to-secondary' || mode === 'pattern-sunburst-gradient') {
    return { backgroundImage: `linear-gradient(135deg, ${brandColor}, ${secColor})` };
  }
  if (mode === 'gradient-secondary-to-brand') {
    return { backgroundImage: `linear-gradient(135deg, ${secColor}, ${brandColor})` };
  }
  if (mode === 'gradient-brand-dark') {
    return { backgroundImage: `linear-gradient(135deg, ${brandColor}, #020617)` };
  }
  if (mode === 'gradient-secondary-dark') {
    return { backgroundImage: `linear-gradient(135deg, ${secColor}, #020617)` };
  }
  if (mode === 'glassmorphism') {
    return { 
      backgroundColor: 'rgba(255, 255, 255, 0.45)', 
      backdropFilter: 'blur(16px)', 
      WebkitBackdropFilter: 'blur(16px)',
      borderColor: 'rgba(255, 255, 255, 0.3)' 
    };
  }
  if (mode === 'dark-aesthetic') {
    return { 
      backgroundColor: '#0f172a', 
      borderColor: 'rgba(255, 255, 255, 0.1)' 
    };
  }
  return { backgroundColor: '#ffffff' };
};

const isDarkBackground = (style: PopupStyle, backgroundMode?: string) => {
  if (style !== 'centered-advertisement') {return false;}
  if (!backgroundMode || backgroundMode === 'solid' || backgroundMode === 'glassmorphism') {
    return false;
  }
  return true;
};

const popupFontStyle = {
  fontFamily: 'var(--font-active, var(--font-be-vietnam-pro)), var(--font-be-vietnam-pro), sans-serif',
} as React.CSSProperties;

const roundedClass = (config: PopupConfig, large: string, small: string) => {
  if (config.cornerRadius === 'none') {return 'rounded-none';}
  if (config.cornerRadius === 'sm') {return small;}
  return large;
};

const getOverlayPaddingClass = (config: PopupConfig) => {
  if (config.spacing === 'none') {return 'p-0';}
  if (config.spacing === 'compact') {return 'p-2 sm:p-3';}
  return 'p-4';
};

function PopupActions({ config, brandColor, onClose, onDismissToday, forceStack = false, isDarkBg = false, isDark }: { config: PopupConfig; brandColor: string; onClose: () => void; onDismissToday: () => void; forceStack?: boolean; isDarkBg?: boolean; isDark?: boolean }) {
  const hasPrimaryLink = config.primaryButtonLink.trim().length > 0 && config.primaryButtonLink !== '#';
  const hasSecondaryLink = config.secondaryButtonLink.trim().length > 0 && config.secondaryButtonLink !== '#';
  const hasPrimaryText = config.primaryButtonText.trim().length > 0;
  const hasSecondaryText = config.secondaryButtonText.trim().length > 0;
  const tokens = adaptTokensForDarkMode(getPopupColorTokens(brandColor, config.colorIntensity), isDark ?? false);
  const secondaryClass = `inline-flex min-h-[46px] flex-1 items-center justify-center rounded-2xl border px-5 py-2.5 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 whitespace-normal break-words ${config.secondaryButtonDisabled ? 'cursor-not-allowed opacity-55' : isDarkBg ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-50 text-slate-700'}`;
  const primaryClass = `inline-flex min-h-[46px] flex-1 items-center justify-center rounded-2xl px-5 py-2.5 text-center text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 whitespace-normal break-words ${config.primaryButtonDisabled ? 'cursor-not-allowed opacity-55' : 'hover:brightness-95'}`;
  const wrapperClass = forceStack ? 'flex flex-col gap-2.5' : 'flex flex-col gap-2.5 sm:flex-row';

  return (
    <div className={wrapperClass}>
      {hasSecondaryText && (config.secondaryButtonDisabled ? (
        <button
          type="button"
          disabled
          className={secondaryClass}
          style={{ borderColor: isDarkBg ? 'rgba(255,255,255,0.25)' : tokens.primaryBorder, '--tw-ring-color': tokens.ring } as React.CSSProperties}
        >
          {config.secondaryButtonText}
        </button>
      ) : hasSecondaryLink ? (
        <a
          {...getLinkProps(config.secondaryButtonLink)}
          className={secondaryClass}
          style={{ borderColor: isDarkBg ? 'rgba(255,255,255,0.25)' : tokens.primaryBorder, '--tw-ring-color': tokens.ring } as React.CSSProperties}
        >
          {config.secondaryButtonText}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className={secondaryClass}
          style={{ borderColor: isDarkBg ? 'rgba(255,255,255,0.25)' : tokens.primaryBorder, '--tw-ring-color': tokens.ring } as React.CSSProperties}
        >
          {config.secondaryButtonText}
        </button>
      ))}

      {hasPrimaryText && (config.primaryButtonDisabled ? (
        <button
          type="button"
          disabled
          className={primaryClass}
          style={{ 
            backgroundColor: isDarkBg ? '#f59e0b' : brandColor, 
            color: isDarkBg ? '#0f172a' : '#ffffff', 
            '--tw-ring-color': tokens.ring 
          } as React.CSSProperties}
        >
          {config.primaryButtonText}
        </button>
      ) : hasPrimaryLink ? (
        <a
          {...getLinkProps(config.primaryButtonLink)}
          className={primaryClass}
          style={{ 
            backgroundColor: isDarkBg ? '#f59e0b' : brandColor, 
            color: isDarkBg ? '#0f172a' : '#ffffff', 
            '--tw-ring-color': tokens.ring 
          } as React.CSSProperties}
        >
          {config.primaryButtonText}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className={primaryClass}
          style={{ 
            backgroundColor: isDarkBg ? '#f59e0b' : brandColor, 
            color: isDarkBg ? '#0f172a' : '#ffffff', 
            '--tw-ring-color': tokens.ring 
          } as React.CSSProperties}
        >
          {config.primaryButtonText}
        </button>
      ))}
      {config.showDoNotShowToday && (
        <button
          type="button"
          onClick={onDismissToday}
          className={`min-h-[46px] rounded-2xl px-4 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 sm:flex-none whitespace-normal break-words ${isDarkBg ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          style={{ '--tw-ring-color': tokens.ring } as React.CSSProperties}
        >
          Không hiện lại hôm nay
        </button>
      )}
    </div>
  );
}

function PopupText({ config, brandColor, align = 'center', isDarkBg = false, isDark }: { config: PopupConfig; brandColor: string; align?: 'center' | 'left'; isDarkBg?: boolean; isDark?: boolean }) {
  const tokens = adaptTokensForDarkMode(getPopupColorTokens(brandColor, config.colorIntensity), isDark ?? false);

  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      {config.eyebrow && (
        <div className="mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white" style={{ backgroundColor: tokens.primary }}>
          {config.eyebrow}
        </div>
      )}
      <h2 className={`break-words text-balance text-2xl font-bold tracking-[-0.03em] sm:text-3xl ${isDarkBg ? 'text-white' : 'text-slate-950'}`}>{config.heading}</h2>
      {config.description && (
        <p className={`mt-3 break-words text-sm leading-6 sm:text-base whitespace-pre-wrap ${isDarkBg ? 'text-slate-100' : 'text-slate-600'}`}>{parseDescription(config.description, isDarkBg)}</p>
      )}
      {config.note && (
        <div className={`${roundedClass(config, 'rounded-2xl', 'rounded-lg')} mt-5 break-words border px-4 py-3 text-sm leading-5`} style={{ backgroundColor: isDarkBg ? 'rgba(255,255,255,0.08)' : tokens.primaryWash, borderColor: isDarkBg ? 'rgba(255,255,255,0.15)' : tokens.border, color: isDarkBg ? 'rgba(255,255,255,0.8)' : '#64748b' }}>
          {config.note}
        </div>
      )}
    </div>
  );
}

function CloseButton({ onClose, isDarkBg = false }: { onClose: () => void; isDarkBg?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng popup"
      className={`absolute right-4 top-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isDarkBg ? 'bg-transparent border-none text-white/80 hover:text-white' : 'border border-slate-200 bg-white/90 text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900'}`}
      style={isDarkBg ? undefined : { color: '#dc2626' }}
    >
      <X className="h-5 w-5" strokeWidth={1.5} />
    </button>
  );
}

function PopupCard({ config, brandColor, secondary, style, previewDevice, onClose, onDismissToday, isDark }: { config: PopupConfig; brandColor: string; secondary?: string; style: PopupStyle; previewDevice: PreviewDevice; onClose: () => void; onDismissToday: () => void; isDark?: boolean }) {
  const tokens = adaptTokensForDarkMode(getPopupColorTokens(brandColor, config.colorIntensity), isDark ?? false);
  const borderStyle = { borderColor: tokens.border };
  const isMobilePreview = previewDevice === 'mobile';
  const darkBg = isDarkBackground(style, config.backgroundMode);

  if (style === 'centered-advertisement') {
    const hasSunburst = config.backgroundMode === 'pattern-sunburst' 
      || config.backgroundMode === 'pattern-sunburst-secondary' 
      || config.backgroundMode === 'pattern-sunburst-gradient';

    return (
      <div 
        className={`relative flex w-full max-w-[320px] flex-col items-center justify-center p-6 border text-center overflow-hidden ${roundedClass(config, 'rounded-[2rem]', 'rounded-2xl')}`} 
        style={{ ...borderStyle, boxShadow: tokens.premiumShadow, ...getPopupBackgroundStyle(config, brandColor, secondary) }}
      >
        <CloseButton onClose={onClose} isDarkBg={darkBg} />
        {hasSunburst && <SunburstPattern />}
        <div className="relative z-10 w-full space-y-5">
          <PopupText config={config} brandColor={brandColor} align="center" isDarkBg={darkBg} isDark={isDark} />
          <div className="w-full overflow-hidden">
            {config.imageUrl.trim() ? (
              <img src={config.imageUrl} alt={config.heading || sectionImageAlt} className="mx-auto aspect-[3/4] w-[190px] rounded-full object-cover border-2 border-white/10 shadow-md" />
            ) : (
              <PopupImage config={config} className="min-h-[180px] p-2" />
            )}
          </div>
          <PopupActions config={config} brandColor={brandColor} onClose={onClose} onDismissToday={onDismissToday} forceStack={true} isDarkBg={darkBg} isDark={isDark} />
        </div>
      </div>
    );
  }

  if (style === 'split-visual') {
    return (
      <div className={`relative grid w-full ${isMobilePreview ? 'max-w-full gap-4 p-5' : 'max-w-4xl gap-5 p-5 sm:grid-cols-[0.95fr_1.05fr] sm:p-6'} border bg-white ${roundedClass(config, 'rounded-[2rem]', 'rounded-2xl')}`} style={{ ...borderStyle, boxShadow: tokens.premiumShadow }}>
        <CloseButton onClose={onClose} />
        <PopupImage config={config} className={isMobilePreview ? 'min-h-[150px] overflow-hidden' : 'min-h-[240px]'} />
        <div className={`flex flex-col justify-center space-y-5 ${isMobilePreview ? 'pr-10' : 'pr-0 sm:pr-6'}`}>
          <PopupText config={config} brandColor={brandColor} align="left" isDark={isDark} />
          <PopupActions config={config} brandColor={brandColor} onClose={onClose} onDismissToday={onDismissToday} forceStack={isMobilePreview} isDark={isDark} />
        </div>
      </div>
    );
  }

  if (style === 'bottom-sheet') {
    return (
      <div className={`relative mt-auto w-full ${isMobilePreview ? 'max-w-full p-5' : 'max-w-4xl p-5 sm:mb-6 sm:p-6'} border bg-white ${roundedClass(config, isMobilePreview ? 'rounded-t-[2rem]' : 'rounded-t-[2rem] sm:rounded-[2rem]', isMobilePreview ? 'rounded-t-2xl' : 'rounded-t-2xl sm:rounded-2xl')}`} style={{ ...borderStyle, boxShadow: tokens.premiumShadow }}>
        <CloseButton onClose={onClose} />
        <div className={`mx-auto mb-4 h-1.5 w-14 rounded-full ${isMobilePreview ? '' : 'sm:hidden'}`} style={{ backgroundColor: tokens.primaryBorder }} />
        <div className={`grid items-center gap-5 ${isMobilePreview ? '' : 'sm:grid-cols-[1fr_auto]'}`}>
          <PopupText config={config} brandColor={brandColor} align="left" isDark={isDark} />
          <div className={isMobilePreview ? 'min-w-0 w-full' : 'min-w-[260px]'}>
            <PopupActions config={config} brandColor={brandColor} onClose={onClose} onDismissToday={onDismissToday} forceStack={isMobilePreview} isDark={isDark} />
          </div>
        </div>
      </div>
    );
  }

  if (style === 'side-panel') {
    return (
      <div className={`relative ml-auto flex h-full w-full max-w-md flex-col justify-center border-l bg-white p-6 sm:p-8 ${roundedClass(config, 'sm:rounded-l-[2rem]', 'sm:rounded-l-2xl')}`} style={{ ...borderStyle, boxShadow: tokens.premiumShadow }}>
        <CloseButton onClose={onClose} />
        <div className="space-y-5">
          <PopupIcon config={config} brandColor={brandColor} />
          <PopupText config={config} brandColor={brandColor} align="left" isDark={isDark} />
          <PopupActions config={config} brandColor={brandColor} onClose={onClose} onDismissToday={onDismissToday} isDark={isDark} />
        </div>
      </div>
    );
  }

  if (style === 'minimal-alert') {
    const InlineIcon = icons[config.icon as keyof typeof icons] || icons.Bell;
    return (
      <div className={`relative w-full max-w-lg border bg-white p-5 ${roundedClass(config, 'rounded-3xl', 'rounded-xl')}`} style={{ ...borderStyle, boxShadow: tokens.shadow }}>
        <CloseButton onClose={onClose} />
        <div className="flex gap-4 pr-8">
          {config.showIcon && (
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center border text-white ${roundedClass(config, 'rounded-2xl', 'rounded-lg')}`} style={{ backgroundColor: tokens.primary, borderColor: tokens.primary }}>
              <InlineIcon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-4">
            <PopupText config={config} brandColor={brandColor} align="left" isDark={isDark} />
            <PopupActions config={config} brandColor={brandColor} onClose={onClose} onDismissToday={onDismissToday} isDark={isDark} />
          </div>
        </div>
      </div>
    );
  }

  if (style === 'full-screen') {
    return (
      <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden rounded-none p-5" style={{ backgroundColor: brandColor }}>
        <CloseButton onClose={onClose} />
        <div className={`mx-auto max-w-2xl space-y-6 bg-white p-6 text-center sm:p-8 ${roundedClass(config, 'rounded-[2rem]', 'rounded-2xl')}`} style={{ boxShadow: tokens.premiumShadow }}>
          <PopupIcon config={config} brandColor={brandColor} />
          <PopupText config={config} brandColor={brandColor} isDark={isDark} />
          <div className="mx-auto max-w-md">
            <PopupActions config={config} brandColor={brandColor} onClose={onClose} onDismissToday={onDismissToday} isDark={isDark} />
          </div>
        </div>
      </div>
    );
  }

  if (style === 'image-only') {
    return (
      <div className={`relative w-full max-w-2xl overflow-hidden border bg-white ${roundedClass(config, 'rounded-[2rem]', 'rounded-2xl')}`} style={{ ...borderStyle, boxShadow: tokens.premiumShadow }}>
        <CloseButton onClose={onClose} />
        {config.imageUrl.trim() ? (
          <img src={config.imageUrl} alt={config.heading || sectionImageAlt} className="block max-h-[78vh] w-full object-cover" />
        ) : (
          <PopupImage config={config} className="min-h-[360px] p-4" />
        )}
        {config.showDoNotShowToday && (
          <button
            type="button"
            onClick={onDismissToday}
            className="absolute bottom-4 left-1/2 min-h-[40px] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-white px-4 text-center text-sm font-medium text-slate-600 shadow-lg whitespace-normal break-words"
          >
            Không hiện lại hôm nay
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full max-w-xl border bg-white p-6 sm:p-8 ${roundedClass(config, 'rounded-[2rem]', 'rounded-2xl')}`} style={{ ...borderStyle, boxShadow: tokens.premiumShadow }}>
      <CloseButton onClose={onClose} />
      <div className="space-y-5">
        <PopupIcon config={config} brandColor={brandColor} />
        <PopupText config={config} brandColor={brandColor} isDark={isDark} />
        <PopupActions config={config} brandColor={brandColor} onClose={onClose} onDismissToday={onDismissToday} isDark={isDark} />
      </div>
    </div>
  );
}

function PopupOverlay({
  config,
  brandColor,
  secondary,
  mode,
  context,
  previewDevice,
  fontStyle,
  fontClassName,
  onClose,
  isDark,
}: {
  config: PopupConfig;
  brandColor: string;
  secondary?: string;
  mode?: 'single' | 'dual';
  context: PopupContext;
  previewDevice: PreviewDevice;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  onClose: () => void;
  isDark?: boolean;
}) {
  const tokens = adaptTokensForDarkMode(getPopupColorTokens(brandColor, config.colorIntensity), isDark ?? false);
  const isPreview = context === 'preview';
  const style = config.style;
  const positionClass = style === 'bottom-sheet'
    ? 'items-end justify-center'
    : style === 'side-panel'
      ? 'items-stretch justify-end'
      : style === 'centered-advertisement'
        ? 'items-end justify-end md:p-6 p-4'
        : 'items-center justify-center';

  const handleDismissToday = () => {
    if (context === 'site') {
      window.localStorage.setItem(getTodayStorageKey(config), getTodayValue());
    }
    onClose();
  };

  return (
    <div
      className={`${isPreview ? 'absolute' : 'fixed'} inset-0 z-50 flex ${positionClass} ${getOverlayPaddingClass(config)} ${fontClassName ?? ''} overflow-hidden`}
      style={{
        ...popupFontStyle,
        ...fontStyle,
        '--popup-secondary': secondary ?? brandColor,
        '--popup-color-mode': mode ?? 'single',
        backgroundColor: style === 'centered-advertisement' ? 'rgba(2, 6, 23, 0.4)' : tokens.overlay,
      } as React.CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={config.heading || 'Popup'}
      onClick={onClose}
    >
      <div onClick={(event) => event.stopPropagation()} className="contents">
        <PopupCard config={config} brandColor={brandColor} secondary={secondary} style={style} previewDevice={previewDevice} onClose={onClose} onDismissToday={handleDismissToday} isDark={isDark} />
      </div>
    </div>
  );
}

function PopupRuntime({
  config,
  brandColor,
  secondary,
  mode,
  context,
  previewDevice,
  fontStyle,
  fontClassName,
  isDark,
}: {
  config: PopupConfig;
  brandColor: string;
  secondary?: string;
  mode?: 'single' | 'dual';
  context: PopupContext;
  previewDevice: PreviewDevice;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
  isDark?: boolean;
}) {
  const [visible, setVisible] = React.useState(context === 'preview');
  const [wasShownInPageView, setWasShownInPageView] = React.useState(false);

  React.useEffect(() => {
    if (context === 'preview') {
      setVisible(true);
      return;
    }

    const storageKey = getPopupStorageKey(config);
    if (window.localStorage.getItem(getTodayStorageKey(config)) === getTodayValue()) {
      setVisible(false);
      return;
    }
    if (config.frequency === 'oncePerDevice' && window.localStorage.getItem(storageKey) === '1') {
      setVisible(false);
      return;
    }
    if (config.frequency === 'oncePerSession' && window.sessionStorage.getItem(storageKey) === '1') {
      setVisible(false);
      return;
    }
    if (config.frequency === 'oncePerPageView' && wasShownInPageView) {
      return;
    }

    const showPopup = () => {
      setWasShownInPageView(true);
      setVisible(true);
    };

    const timer = window.setTimeout(showPopup, config.trigger === 'delay' ? config.delaySeconds * 1000 : 0);

    return () => window.clearTimeout(timer);
  }, [config, context, wasShownInPageView]);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  const handleClose = () => {
    if (context === 'site') {
      const storageKey = getPopupStorageKey(config);
      if (config.frequency === 'oncePerDevice') {
        window.localStorage.setItem(storageKey, '1');
      }
      if (config.frequency === 'oncePerSession') {
        window.sessionStorage.setItem(storageKey, '1');
      }
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return <PopupOverlay config={config} brandColor={brandColor} secondary={secondary} mode={mode} context={context} previewDevice={previewDevice} fontStyle={fontStyle} fontClassName={fontClassName} onClose={handleClose} isDark={isDark} />;
}

export function PopupSectionShared({
  config,
  brandColor,
  secondary,
  mode,
  fontStyle,
  fontClassName,
  sectionTitle,
  context,
  includePreviewWrapper = false,
  previewDevice = 'desktop',
  setPreviewDevice,
  previewStyle,
  onPreviewStyleChange,
  isDark,
}: PopupSectionSharedProps) {
  const style = previewStyle ?? config.style;
  const nextConfig = { ...config, style };

  if (!includePreviewWrapper) {
    return <PopupRuntime config={nextConfig} brandColor={brandColor} secondary={secondary} mode={mode} context={context} previewDevice={previewDevice} fontStyle={fontStyle} fontClassName={fontClassName} isDark={isDark} />;
  }

  return (
    <div className="space-y-4">
      <PreviewWrapper
        title={`Preview ${sectionTitle}`}
        device={previewDevice}
        setDevice={setPreviewDevice ?? (() => undefined)}
        previewStyle={style}
        setPreviewStyle={(nextStyle) => onPreviewStyleChange?.(nextStyle as PopupStyle)}
        styles={POPUP_STYLES}
        deviceWidthClass={deviceWidths[previewDevice]}
      >
        <BrowserFrame>
          <div
            className="relative overflow-hidden rounded-xl border bg-slate-50"
            style={{ minHeight: previewDevice === 'mobile' ? 520 : 560 }}
          >
            <div className="p-5">
              <div className="h-7 w-44 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-72 max-w-full rounded bg-slate-100" />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="h-28 rounded-2xl bg-white" />
                <div className="h-28 rounded-2xl bg-white" />
              </div>
            </div>
            <PopupRuntime config={nextConfig} brandColor={brandColor} secondary={secondary} mode={mode} context="preview" previewDevice={previewDevice} fontStyle={fontStyle} fontClassName={fontClassName} isDark={isDark} />
          </div>
        </BrowserFrame>
      </PreviewWrapper>
    </div>
  );
}
