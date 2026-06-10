'use client';

import React from 'react';
import {
  ArrowUp,
  Calendar,
  Facebook,
  Headphones,
  HelpCircle,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareMore,
  Phone,
  Plus,
  Send,
  ShoppingCart,
  Youtube,
} from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, type PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  getAPCATextColor,
  getSpeedDialThemeTokens,
  normalizeSpeedDialActions,
  resolveActionBgColor,
  type SpeedDialColorTokens,
  type SpeedDialRenderableAction,
} from '../_lib/colors';
import { SPEED_DIAL_STYLES } from '../_lib/constants';
import type {
  SpeedDialAction,
  SpeedDialBrandMode,
  SpeedDialPosition,
  SpeedDialStyle,
} from '../_types';

type SpeedDialSectionContext = 'preview' | 'site';

const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const XIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const PinterestIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

const ShopeeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.9414 17.9633c.229-1.879-.981-3.077-4.1758-4.0969-1.548-.528-2.277-1.22-2.26-2.1719.065-1.056 1.048-1.825 2.352-1.85a5.2898 5.2898 0 0 1 2.8838.89c.116.072.197.06.263-.039.09-.145.315-.494.39-.62.051-.081.061-.187-.068-.281-.185-.1369-.704-.4149-.983-.5319a6.4697 6.4697 0 0 0-2.5118-.514c-1.909.008-3.4129 1.215-3.5389 2.826-.082 1.1629.494 2.1078 1.73 2.8278.262.152 1.6799.716 2.2438.892 1.774.552 2.695 1.5419 2.478 2.6969-.197 1.047-1.299 1.7239-2.818 1.7439-1.2039-.046-2.2878-.537-3.1278-1.19l-.141-.11c-.104-.08-.218-.075-.287.03-.05.077-.376.547-.458.67-.077.108-.035.168.045.234.35.293.817.613 1.134.775a6.7097 6.7097 0 0 0 2.8289.727 4.9048 4.9048 0 0 0 2.0759-.354c1.095-.465 1.8029-1.394 1.9449-2.554zM11.9986 1.4009c-2.068 0-3.7539 1.95-3.8329 4.3899h7.6657c-.08-2.44-1.765-4.3899-3.8328-4.3899zm7.8516 22.5981-.08.001-15.7843-.002c-1.074-.04-1.863-.91-1.971-1.991l-.01-.195L1.298 6.2858a.459.459 0 0 1 .45-.494h4.9748C6.8448 2.568 9.1607 0 11.9996 0c2.8388 0 5.1537 2.5689 5.2757 5.7898h4.9678a.459.459 0 0 1 .458.483l-.773 15.5883-.007.131c-.094 1.094-.979 1.9769-2.0709 2.0059z"/>
  </svg>
);

/* Lazada & Tiki dùng PNG logo thật */

const MessengerIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13"/>
  </svg>
);

interface SpeedDialSectionSharedProps {
  actions: SpeedDialAction[];
  style: SpeedDialStyle;
  position: SpeedDialPosition;
  brandColor: string;
  secondary: string;
  mode: SpeedDialBrandMode;
  sectionTitle: string;
  context: SpeedDialSectionContext;
  defaultOpen?: boolean;
  previewDevice?: PreviewDevice;
  setPreviewDevice?: (device: PreviewDevice) => void;
  includePreviewWrapper?: boolean;
  previewStyle?: SpeedDialStyle;
  onPreviewStyleChange?: (style: SpeedDialStyle) => void;
  enableShadow?: boolean;
  isDark?: boolean;
}

/** Icon dùng PNG logo (fill full nút, không cần bg color) */
const IMAGE_BRAND_ICONS = new Set(['lazada', 'tiki']);
const isImageBrandIcon = (name: string) => IMAGE_BRAND_ICONS.has(name.trim().toLowerCase());

const shadowClass = (enabled: boolean, className: string) => enabled ? className : '';

/** Darken a hex color by a percentage (0-100) */
const darkenColor = (hex: string, pct: number): string => {
  const h = hex.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(h.substring(0, 2), 16) * (1 - pct / 100)));
  const g = Math.max(0, Math.round(parseInt(h.substring(2, 4), 16) * (1 - pct / 100)));
  const b = Math.max(0, Math.round(parseInt(h.substring(4, 6), 16) * (1 - pct / 100)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const getIconNode = (name: string, size = 18) => {
  const normalized = name.trim().toLowerCase();

  if (normalized === 'calendar') {return <Calendar size={size} />;}
  if (normalized === 'facebook') {return <Facebook size={size} />;}
  if (normalized === 'headphones') {return <Headphones size={size} />;}
  if (normalized === 'help-circle') {return <HelpCircle size={size} />;}
  if (normalized === 'instagram') {return <Instagram size={size} />;}
  if (normalized === 'mail') {return <Mail size={size} />;}
  if (normalized === 'map-pin') {return <MapPin size={size} />;}
  if (normalized === 'message-circle') {return <MessageCircle size={size} />;}
  if (normalized === 'shopping-cart') {return <ShoppingCart size={size} />;}
  if (normalized === 'telegram') {return <Send size={size} />;}
  if (normalized === 'tiktok') {return <TikTokIcon size={size} />;}
  if (normalized === 'x') {return <XIcon size={size} />;}
  if (normalized === 'pinterest') {return <PinterestIcon size={size} />;}
  if (normalized === 'shopee') {return <ShopeeIcon size={size} />;}
  if (normalized === 'lazada') {return <img src="/icons/lazada-logo.png" alt="Lazada" className="w-full h-full rounded-full object-cover" />;}
  if (normalized === 'tiki') {return <img src="/icons/tiki-logo.png" alt="Tiki" className="w-full h-full rounded-full object-contain p-1.5" style={{ background: '#fff', border: '1.5px solid #1A94FF' }} />;}
  if (normalized === 'messenger') {return <MessengerIcon size={size} />;}
  if (normalized === 'youtube') {return <Youtube size={size} />;}
  if (normalized === 'zalo') {const s = Math.round(size * 1.25); return <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor"><path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" /></svg>;}

  return <Phone size={size} />;
};

const AI_CHATBOT_URL = '#ai-chatbot';
const AI_CHATBOT_OPEN_EVENT = 'vietadmin:open-ai-chatbot';

const getLinkProps = (url: string) => {
  const href = url.trim().length > 0 ? url : '#';
  const isExternal = /^https?:\/\//i.test(href);
  const isAiChatbot = href === AI_CHATBOT_URL;

  return {
    href,
    onClick: isAiChatbot
      ? ((event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent(AI_CHATBOT_OPEN_EVENT));
      })
      : undefined,
    rel: isExternal ? 'noopener noreferrer' : undefined,
    target: isExternal ? '_blank' as const : undefined,
  };
};

const getStyleInfo = (
  style: SpeedDialStyle,
  actionCount: number,
  mode: SpeedDialBrandMode,
  context: SpeedDialSectionContext,
  previewDevice: PreviewDevice,
) => {
  const styleLabel = SPEED_DIAL_STYLES.find((item) => item.id === style)?.label ?? 'Layout 1';
  const countLabel = `${actionCount} action`;
  const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
  const contextLabel = context === 'preview' ? previewDevice : 'site';
  return `${styleLabel} • ${countLabel} • ${modeLabel} • ${contextLabel}`;
};

const renderPageMock = (tokens: SpeedDialColorTokens) => (
  <div className="min-h-[440px] sm:min-h-[520px] rounded-xl border p-4 sm:p-5 relative overflow-hidden" style={{ backgroundColor: tokens.neutralBackground, borderColor: tokens.neutralBorder }}>
    <div className="space-y-3">
      <div className="h-6 w-44 rounded" style={{ backgroundColor: tokens.pageMockLine }} />
      <div className="h-4 w-72 rounded" style={{ backgroundColor: tokens.pageMockLine }} />
    </div>

    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="h-24 rounded-lg border" style={{ backgroundColor: tokens.pageMockCard, borderColor: tokens.neutralBorder }} />
      <div className="h-24 rounded-lg border" style={{ backgroundColor: tokens.pageMockCard, borderColor: tokens.neutralBorder }} />
    </div>

  </div>
);

const renderFab = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen: _isOpen,
  onToggle: _onToggle,
  showBackToTop,
  onBackToTop,
  enableShadow,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
  enableShadow: boolean;
}) => {
  /* Layout 1: tất cả nút hiện luôn, không có toggle */
  const isPrev = context === 'preview';
  const btnSize = isPrev ? 'w-8 h-8' : 'w-11 h-11';
  const iconSize = isPrev ? 14 : 20;
  const gap = isPrev ? 'gap-1' : 'gap-[5px]';

  const sitePos = isRight ? 'right-2.5' : 'left-2.5';
  const previewPos = isRight ? 'right-1' : 'left-1';
  const posClass = isPrev
    ? `absolute bottom-3 z-30 ${previewPos}`
    : `fixed bottom-10 z-50 ${sitePos}`;

  return (
    <div
      className={`flex flex-col-reverse ${gap} ${posClass} ${isRight ? 'items-end' : 'items-start'}`}
      role="group"
      aria-label={groupLabel}
    >
      {/* Back to top — dưới cùng */}
      {showBackToTop && (
        <button
          type="button"
          onClick={onBackToTop}
          className={`${btnSize} rounded-full flex items-center justify-center ${shadowClass(enableShadow, 'shadow-md')} transition-transform hover:scale-105`}
          style={{ background: `linear-gradient(180deg, ${tokens.mainButtonBg} 50%, ${darkenColor(tokens.mainButtonBg, 15)} 100%)`, color: tokens.mainButtonText }}
          aria-label="Lên đầu trang"
        >
          <ArrowUp size={iconSize} />
        </button>
      )}

      {/* Action buttons */}
      {actions.map((action) => {
        const bg = resolveActionBgColor(action.bgColor, tokens, 'fab');
        const isImg = isImageBrandIcon(action.icon);

        return (
          <a
            key={action.key}
            {...getLinkProps(action.url)}
            className={`group relative flex items-center ${isRight ? 'flex-row' : 'flex-row-reverse'}`}
            aria-label={action.label || action.icon}
          >
            {/* Tooltip — hiện khi hover */}
            {action.label && (
              <span
                className={`absolute ${isRight ? 'right-full mr-2.5' : 'left-full ml-2.5'} top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-medium rounded-[5px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
                style={{ backgroundColor: tokens.tooltipBg, color: tokens.tooltipText }}
              >
                {action.label}
              </span>
            )}
            {/* Button circle */}
            <span
              className={`${btnSize} rounded-full ${shadowClass(enableShadow, 'shadow-md')} flex items-center justify-center transition-transform hover:scale-105 ${isImg ? 'overflow-hidden p-0' : ''}`}
              style={{
                background: isImg ? 'transparent' : `linear-gradient(180deg, ${bg} 50%, ${darkenColor(bg, 15)} 100%)`,
                color: isImg ? undefined : getAPCATextColor(bg, 14, 600),
              }}
            >
              {getIconNode(action.icon, iconSize)}
            </span>
          </a>
        );
      })}
    </div>
  );
};

const renderSidebar = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
  enableShadow,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
  enableShadow: boolean;
}) => {
  const wrapperClass = context === 'site'
    ? `fixed top-1/2 -translate-y-1/2 z-50 ${isRight ? 'right-[2px] md:right-0' : 'left-0'}`
    : `absolute top-1/2 -translate-y-1/2 z-30 ${isRight ? 'right-0' : 'left-0'}`;
  const panelRadius = isRight ? 'rounded-l-xl' : 'rounded-r-xl';
  const toggleRadius = isRight ? 'rounded-l-md' : 'rounded-r-md';

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      {showBackToTop && (
        <button
          type="button"
          onClick={onBackToTop}
          className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full border ${isRight ? 'mr-1' : 'ml-1'}`}
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
            color: tokens.bodyText,
          }}
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      )}
      <div className={`flex items-center ${isRight ? 'flex-row' : 'flex-row-reverse'}`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label="Toggle menu"
          className={`flex h-12 w-7 items-center justify-center border ${shadowClass(enableShadow, 'shadow-md')} ${toggleRadius}`}
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
            color: tokens.bodyText,
          }}
        >
          <Plus className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
        </button>
        {isOpen && (
          <div
            className={`flex flex-col gap-1.5 p-1.5 border ${shadowClass(enableShadow, 'shadow-sm')} backdrop-blur-md ${panelRadius} ${isRight ? '-ml-1' : '-mr-1'}`}
            style={{
              backgroundColor: tokens.neutralSurface,
              borderColor: tokens.neutralBorder,
            }}
          >
            {actions.map((action) => {
              const bg = resolveActionBgColor(action.bgColor, tokens, 'sidebar');
              const text = getAPCATextColor(bg, 14, 600);

              return (
                <a
                  key={action.key}
                  {...getLinkProps(action.url)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform border ${isImageBrandIcon(action.icon) ? 'overflow-hidden p-0' : ''}`}
                  style={{
                    backgroundColor: isImageBrandIcon(action.icon) ? 'transparent' : bg,
                    color: isImageBrandIcon(action.icon) ? undefined : text,
                    borderColor: tokens.actionStyleBorder.sidebar,
                  }}
                  aria-label={action.label || action.icon}
                >
                  {getIconNode(action.icon, 18)}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const renderPills = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
  enableShadow,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
  enableShadow: boolean;
}) => {
  /* Layout 3: card trắng popup + toggle cam + back-to-top (giống dola-construction) */
  const isPrev = context === 'preview';
  const toggleSize = isPrev ? 'w-9 h-9' : 'w-12 h-12';
  const toggleRadius = isPrev ? 'rounded-lg' : 'rounded-xl';
  const iconSize = isPrev ? 14 : 18;
  const circleSize = isPrev ? 'w-7 h-7' : 'w-10 h-10';
  const circleIconSize = isPrev ? 12 : 16;

  /* Dùng brand color cho toggle + back-to-top */
  const primaryColor = tokens.mainButtonBg;

  const sitePos = isRight ? 'right-3' : 'left-3';
  const previewPos = isRight ? 'right-1' : 'left-1';
  const posClass = isPrev
    ? `absolute bottom-2 z-30 ${previewPos}`
    : `fixed bottom-6 z-50 ${sitePos}`;

  return (
    <div
      className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} gap-2 ${posClass}`}
      role="group"
      aria-label={groupLabel}
    >
      {isOpen && (
        <div
          className={`${shadowClass(enableShadow, 'shadow-xl')} border overflow-hidden ${isPrev ? 'rounded-lg w-[160px]' : 'rounded-2xl w-[280px]'}`}
          style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder }}
        >
          {actions.map((action, idx) => {
            const bg = resolveActionBgColor(action.bgColor, tokens, 'pills');
            const text = getAPCATextColor(bg, 14, 600);
            const isImg = isImageBrandIcon(action.icon);

            return (
              <a
                key={action.key}
                {...getLinkProps(action.url)}
                className={`flex items-center gap-2 transition-colors ${isPrev ? 'px-2 py-1.5' : 'px-4 py-3'} ${idx < actions.length - 1 ? 'border-b' : ''}`}
                style={{ borderBottomColor: tokens.separatorColor }}
                aria-label={action.label || action.icon}
              >
                <span
                  className={`${circleSize} rounded-full flex items-center justify-center shrink-0 ${isImg ? 'overflow-hidden p-0' : ''}`}
                  style={{
                    backgroundColor: isImg ? 'transparent' : bg,
                    color: isImg ? undefined : text,
                  }}
                >
                  {getIconNode(action.icon, circleIconSize)}
                </span>
                {action.label && (
                  <span className={`${isPrev ? 'text-[9px]' : 'text-sm'} font-medium truncate`} style={{ color: tokens.bodyText }}>
                    {action.label}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      )}

      {/* ── Bottom buttons ── */}
      <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} gap-1.5`}>
        {/* Toggle button */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label="Toggle menu"
          className={`${toggleSize} ${toggleRadius} ${shadowClass(enableShadow, 'shadow-lg')} flex flex-col items-center justify-center transition-transform hover:scale-105`}
          style={{ backgroundColor: primaryColor, color: tokens.mainButtonText }}
        >
          {isOpen ? (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <>
              <MessageSquareMore size={isPrev ? 12 : 18} />
              <span className={`${isPrev ? 'text-[5px]' : 'text-[8px]'} font-medium leading-none mt-0.5`}>Liên hệ</span>
            </>
          )}
        </button>

        {/* Back to top */}
        {showBackToTop && (
          <button
            type="button"
            onClick={onBackToTop}
            className={`${toggleSize} ${toggleRadius} ${shadowClass(enableShadow, 'shadow-lg')} flex items-center justify-center transition-transform hover:scale-105`}
            style={{ backgroundColor: primaryColor, color: tokens.mainButtonText }}
            aria-label="Lên đầu trang"
          >
            <ArrowUp size={iconSize} />
          </button>
        )}
      </div>
    </div>
  );
};

const renderStack = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
  enableShadow,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
  enableShadow: boolean;
}) => {
  const siteRight = isRight ? 'right-[2px] md:right-0' : 'left-0';
  const previewRight = isRight ? (showBackToTop ? 'right-3' : 'right-1') : (showBackToTop ? 'left-3' : 'left-1');
  const wrapperClass = context === 'site'
    ? `fixed bottom-4 z-50 flex flex-col items-end gap-2 ${siteRight} ${isRight ? '' : 'items-start'}`
    : `absolute bottom-3 z-30 flex flex-col items-end gap-2 ${previewRight} ${isRight ? '' : 'items-start'}`;

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      {showBackToTop && (
        <button
          type="button"
          onClick={onBackToTop}
          className="flex h-8 w-8 items-center justify-center rounded-full border"
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
            color: tokens.bodyText,
          }}
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      )}
      {isOpen && (
        <div
          className={`rounded-2xl border p-2 ${shadowClass(enableShadow, 'shadow-lg')}`}
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
          }}
        >
          <div className="flex flex-col gap-2">
            {actions.map((action) => {
              const bg = resolveActionBgColor(action.bgColor, tokens, 'stack');
              const text = getAPCATextColor(bg, 14, 600);

              return (
                <a
                  key={action.key}
                  {...getLinkProps(action.url)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform ${isImageBrandIcon(action.icon) ? 'overflow-hidden p-0' : ''}`}
                  style={{
                    backgroundColor: isImageBrandIcon(action.icon) ? 'transparent' : bg,
                    color: isImageBrandIcon(action.icon) ? undefined : text,
                  }}
                  aria-label={action.label || action.icon}
                >
                  {getIconNode(action.icon, 16)}
                </a>
              );
            })}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
        className={`flex h-9 w-9 items-center justify-center rounded-full ${shadowClass(enableShadow, 'shadow-sm')}`}
        style={{
          backgroundColor: tokens.mainButtonBg,
          color: tokens.mainButtonText,
        }}
      >
        <Plus className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>
    </div>
  );
};

const renderDock = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  previewDevice,
  isOpen: _isOpen,
  onToggle: _onToggle,
  enableShadow,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  previewDevice: PreviewDevice;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
  enableShadow: boolean;
}) => {
  /* Layout 5: Desktop = thanh dọc icon-only, Mobile = bottom nav ngang (bean-construction) */
  const bg = tokens.mainButtonBg;
  const textColor = tokens.mainButtonText;
  const isPrev = context === 'preview';
  const showBottomNav = isPrev ? previewDevice !== 'desktop' : true;

  /** Zalo: bọc white circle chỉ ở Layout 5 */
  const getDockIcon = (icon: string, s: number) => {
    const n = icon.trim().toLowerCase();
    if (n === 'zalo') {
      return <span className="inline-flex items-center justify-center rounded-full" style={{ background: '#fff', padding: '3px', lineHeight: 0 }}><svg viewBox="0 0 24 24" width={s} height={s} fill="#1e293b"><path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" /></svg></span>;
    }
    return getIconNode(icon, s);
  };

  /* ── Bottom nav ngang (mobile + preview) ── */
  const bottomNav = (
    <div
      className={isPrev
        ? 'absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-1.5'
        : 'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 py-3 md:hidden'}
      style={{ backgroundColor: bg, boxShadow: enableShadow ? '0 -10px 30px rgba(15,23,42,0.18)' : undefined }}
      role="group"
      aria-label={groupLabel}
    >
      {actions.map((action) => (
        <a
          key={action.key}
          {...getLinkProps(action.url)}
          className="flex flex-col items-center gap-1 transition-opacity hover:opacity-80"
          style={{ color: textColor }}
          aria-label={action.label || action.icon}
        >
          <span className={`flex ${isPrev ? 'h-6 w-6' : 'h-8 w-8'} items-center justify-center rounded-full ${isImageBrandIcon(action.icon) ? 'overflow-hidden' : ''}`}>
            {getDockIcon(action.icon, isPrev ? 16 : 22)}
          </span>
          {action.label && (
            <span className="text-center leading-tight" style={{ fontSize: isPrev ? '7px' : '11px', fontWeight: 600, color: textColor }}>
              {action.label}
            </span>
          )}
        </a>
      ))}
    </div>
  );

  if (isPrev && showBottomNav) return bottomNav;

  /* ── Desktop sidebar dọc (hidden on mobile) ── */
  const waveR = 30;
  const waveW = 60;
  const barWidth = 65;
  const iconSize = 22;

  const wrapperClass = isPrev
    ? `absolute top-1/2 -translate-y-1/2 z-30 ${isRight ? 'right-0' : 'left-0'}`
    : `fixed top-1/2 -translate-y-1/2 z-50 hidden md:block ${isRight ? 'right-0' : 'left-0'}`;
  const borderRadius = isRight
    ? `${waveR}px 0 0 ${waveR}px`
    : `0 ${waveR}px ${waveR}px 0`;

  const waveTopStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${waveW}px`,
    height: `${waveR}px`,
    top: `-${waveR}px`,
    ...(isRight ? { right: 0 } : { left: 0 }),
    background: 'transparent',
    borderRadius: isRight ? '0 0 50px 0' : '0 0 0 50px',
    boxShadow: isRight
      ? `${waveR}px 1px 0 0 ${bg}`
      : `-${waveR}px 1px 0 0 ${bg}`,
  };

  const waveBotStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${waveW}px`,
    height: `${waveR}px`,
    bottom: `-${waveR}px`,
    ...(isRight ? { right: 0 } : { left: 0 }),
    background: 'transparent',
    borderRadius: isRight ? '0 50px 0 0' : '50px 0 0 0',
    boxShadow: isRight
      ? `${waveR}px -1px 0 0 ${bg}`
      : `-${waveR}px -1px 0 0 ${bg}`,
  };

  return (
    <>
      {/* Mobile bottom nav */}
      {showBottomNav && bottomNav}
      {/* Desktop sidebar */}
      <div className={wrapperClass} role="group" aria-label={groupLabel}>
        <div
          className="relative flex flex-col items-center gap-3 py-4 px-1"
          style={{ backgroundColor: bg, borderRadius, width: `${barWidth}px`, boxShadow: enableShadow ? '0 10px 30px rgba(15,23,42,0.22)' : undefined }}
        >
          <span style={waveTopStyle} aria-hidden="true" />
          {actions.map((action) => (
            <a
              key={action.key}
              {...getLinkProps(action.url)}
              className="flex flex-col items-center gap-0.5 transition-opacity hover:opacity-80"
              style={{ color: textColor }}
              aria-label={action.label || action.icon}
            >
              <span className={`flex h-7 w-7 items-center justify-center ${isImageBrandIcon(action.icon) ? 'overflow-hidden' : ''}`}>
                {getDockIcon(action.icon, iconSize)}
              </span>
              {action.label && (
                <span className="text-center leading-tight" style={{ fontSize: '10px', fontWeight: 600, color: textColor }}>
                  {action.label}
                </span>
              )}
            </a>
          ))}
          <span style={waveBotStyle} aria-hidden="true" />
        </div>
      </div>
    </>
  );
};

const renderBuilderBar = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  previewDevice,
  enableShadow,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  previewDevice: PreviewDevice;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
  enableShadow: boolean;
}) => {
  const isPrev = context === 'preview';
  const bg = tokens.actionStyleBg['builder-bar'];
  const text = tokens.actionStyleText['builder-bar'];
  const separator = tokens.actionStyleBorder['builder-bar'];
  const showBottomNav = isPrev ? previewDevice === 'mobile' : true;

  const bottomNav = (
    <nav
      className={isPrev
        ? 'absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-1.5'
        : 'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 py-3 md:hidden'}
      style={{ backgroundColor: bg, boxShadow: enableShadow ? '0 -10px 30px rgba(15,23,42,0.18)' : undefined }}
      aria-label={groupLabel}
    >
      {actions.map((action) => (
        <a
          key={action.key}
          {...getLinkProps(action.url)}
          className="flex flex-col items-center gap-1 text-center transition-opacity hover:opacity-80 pointer-events-auto"
          style={{ color: text }}
          aria-label={action.label || action.icon}
        >
          <span className={`flex ${isPrev ? 'h-6 w-6' : 'h-8 w-8'} items-center justify-center ${isImageBrandIcon(action.icon) ? 'overflow-hidden rounded-full' : ''}`}>
            {getIconNode(action.icon, isPrev ? 16 : 22)}
          </span>
          {action.label && (
            <span className="max-w-[54px] break-words text-center text-[6px] font-bold leading-none">
              {action.label}
            </span>
          )}
        </a>
      ))}
    </nav>
  );

  if (isPrev && showBottomNav) {
    return bottomNav;
  }

  const wrapperClass = isPrev
    ? `absolute bottom-4 z-30 w-14 pointer-events-none ${isRight ? 'right-4' : 'left-4'}`
    : `fixed bottom-4 z-50 hidden w-14 pointer-events-none md:block ${isRight ? 'right-4' : 'left-4'}`;

  return (
    <>
      {!isPrev && bottomNav}
      <nav className={wrapperClass} aria-label={groupLabel}>
        <ul className={`flex list-none flex-col overflow-hidden rounded-[10px] p-0 ${shadowClass(enableShadow, 'shadow-[0_6px_18px_rgba(0,0,0,0.25)]')}`}>
          {actions.map((action, index) => {
            const isLast = index === actions.length - 1;

            return (
              <li key={action.key} className="relative">
                <a
                  {...getLinkProps(action.url)}
                  className="flex min-h-14 w-14 flex-col items-center justify-center px-1.5 py-2 text-center transition-opacity hover:opacity-90 pointer-events-auto"
                  style={{ backgroundColor: bg, color: text }}
                  aria-label={action.label || action.icon}
                >
                  <span className={`flex h-6 w-6 items-center justify-center ${isImageBrandIcon(action.icon) ? 'overflow-hidden rounded-full' : ''}`}>
                    {getIconNode(action.icon, 24)}
                  </span>
                  {action.label && (
                    <span className="mt-1 max-w-full break-words text-[6px] font-bold leading-none">
                      {action.label}
                    </span>
                  )}
                </a>
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-1.5 right-1.5 h-px"
                    style={{ backgroundColor: separator }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};

const renderMinimal = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
  enableShadow,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
  enableShadow: boolean;
}) => {
  /* Layout 6: bean-spa style — toggle tròn + pulse, popup card trắng */
  const isPrev = context === 'preview';
  const primaryColor = tokens.mainButtonBg;

  const posClass = isPrev
    ? `absolute z-30 ${isRight ? 'right-2' : 'left-2'} bottom-2`
    : `fixed z-50 ${isRight ? 'right-4' : 'left-4'} bottom-10`;

  const toggleSize = isPrev ? 36 : 60;

  return (
    <div className={posClass} role="group" aria-label={groupLabel}>
      {/* Back-to-top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={onBackToTop}
          className={`flex items-center justify-center rounded-full ${shadowClass(enableShadow, 'shadow-md')} mb-2 transition-transform hover:scale-105 ${isPrev ? 'h-5 w-5' : 'h-7 w-7'}`}
          style={{ backgroundColor: primaryColor, color: tokens.mainButtonText }}
          aria-label="Lên đầu trang"
        >
          <ArrowUp size={isPrev ? 10 : 14} />
        </button>
      )}

      {/* Popup card */}
      {isOpen && (
        <div
          className={`mb-2 border ${shadowClass(enableShadow, 'shadow-xl')} overflow-hidden ${isPrev ? 'rounded-md w-[140px]' : 'rounded-lg w-[280px]'}`}
          style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder, boxShadow: enableShadow ? '0 0 10px rgba(0,0,0,0.2)' : undefined }}
        >
          <div
            className={`flex items-center justify-between ${isPrev ? 'px-2 py-1.5' : 'px-4 py-3'}`}
            style={{ backgroundColor: primaryColor, color: tokens.mainButtonText }}
          >
            <span className={`font-semibold ${isPrev ? 'text-[8px]' : 'text-sm'}`}>Liên hệ với chúng tôi</span>
            <button type="button" onClick={onToggle} aria-label="Đóng" style={{ color: tokens.mainButtonText }}>
              <svg width={isPrev ? 10 : 16} height={isPrev ? 10 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div className={isPrev ? 'py-1' : 'py-1'}>
            {actions.map((action, i) => {
              const bg = resolveActionBgColor(action.bgColor, tokens, 'minimal');
              const text = getAPCATextColor(bg, 14, 600);
              return (
                <a
                  key={action.key}
                  {...getLinkProps(action.url)}
                  className={`flex items-center gap-2 transition-colors ${isPrev ? 'px-2 py-1' : 'px-4 py-2.5'} ${i < actions.length - 1 ? 'border-b' : ''}`}
                  style={{ borderBottomColor: tokens.separatorColor }}
                  aria-label={action.label || action.icon}
                >
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-full ${isPrev ? 'h-5 w-5' : 'h-9 w-9'} ${isImageBrandIcon(action.icon) ? 'overflow-hidden p-0' : ''}`}
                    style={{
                      backgroundColor: isImageBrandIcon(action.icon) ? 'transparent' : bg,
                      color: isImageBrandIcon(action.icon) ? undefined : text,
                    }}
                  >
                    {getIconNode(action.icon, isPrev ? 10 : 18)}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className={`font-semibold truncate ${isPrev ? 'text-[7px]' : 'text-[13px]'}`} style={{ color: tokens.bodyText }}>
                      {action.label || action.icon}
                    </span>
                    {action.url && (
                      <span className={`truncate ${isPrev ? 'text-[6px]' : 'text-[11px]'}`} style={{ color: tokens.mutedText }}>
                        {action.url.replace(/^(https?:\/\/|tel:|mailto:)/, '').slice(0, 30)}
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Toggle button with pulse — only when closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-label="Toggle menu"
          className={`relative flex flex-col items-center justify-center rounded-full ${shadowClass(enableShadow, 'shadow-lg')} transition-transform hover:scale-105`}
          style={{
            backgroundColor: primaryColor,
            color: tokens.mainButtonText,
            width: `${toggleSize}px`,
            height: `${toggleSize}px`,
          }}
        >
          {!isPrev && (
            <>
              <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: primaryColor }} />
              <span className="absolute inset-[-4px] rounded-full animate-pulse opacity-15" style={{ backgroundColor: primaryColor }} />
            </>
          )}
          <MessageSquareMore size={isPrev ? 14 : 22} />
          <span className={`font-medium leading-none ${isPrev ? 'text-[5px] mt-0.5' : 'text-[9px] mt-1'}`}>Liên hệ</span>
        </button>
      )}
    </div>
  );
};

const SpeedDialSectionContent = ({
  actions,
  style,
  position,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
  enableShadow,
  previewDevice,
}: {
  actions: SpeedDialRenderableAction[];
  style: SpeedDialStyle;
  position: SpeedDialPosition;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
  enableShadow: boolean;
  previewDevice: PreviewDevice;
}) => {
  const isRight = position !== 'bottom-left';

  if (actions.length === 0) {
    return context === 'preview' ? renderPageMock(tokens) : null;
  }

  const floating = (
    <>
      {style === 'fab' && renderFab({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop, enableShadow })}
      {style === 'sidebar' && renderSidebar({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop, enableShadow })}
      {style === 'pills' && renderPills({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop, enableShadow })}
      {style === 'stack' && renderStack({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop, enableShadow })}
      {style === 'dock' && renderDock({ actions, isRight, tokens, context, groupLabel, previewDevice, isOpen, onToggle, showBackToTop, onBackToTop, enableShadow })}
      {style === 'minimal' && renderMinimal({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop, enableShadow })}
      {style === 'builder-bar' && renderBuilderBar({ actions, isRight, tokens, context, groupLabel, previewDevice, isOpen, onToggle, showBackToTop, onBackToTop, enableShadow })}
    </>
  );

  if (context === 'site') {
    return floating;
  }

  return (
    <div className="relative">
      {renderPageMock(tokens)}
      {floating}
    </div>
  );
};

export function SpeedDialSectionShared({
  actions,
  style,
  position,
  brandColor,
  secondary,
  mode,
  sectionTitle,
  context,
  defaultOpen = false,
  previewDevice = 'desktop',
  setPreviewDevice,
  includePreviewWrapper = false,
  previewStyle,
  onPreviewStyleChange,
  enableShadow = true,
  isDark,
}: SpeedDialSectionSharedProps) {
  const selectedStyle = previewStyle ?? style;
  const normalizedActions = React.useMemo(() => normalizeSpeedDialActions(actions), [actions]);
  const resolvedSectionTitle = sectionTitle.trim().length > 0 ? sectionTitle : 'Speed Dial';
  const tokens = React.useMemo(() => getSpeedDialThemeTokens({
      primary: brandColor,
      secondary,
      mode,
      isDark: isDark ?? false,
    }), [brandColor, secondary, mode, isDark]);
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {return;}

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleBackToTop = () => {
    if (typeof window === 'undefined') {return;}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const showBackToTop = context === 'preview' ? false : isScrolled;
  if (!includePreviewWrapper || context === 'site') {
    return (
      <SpeedDialSectionContent
        actions={normalizedActions}
        style={selectedStyle}
        position={position}
        tokens={tokens}
        context={context}
        groupLabel={resolvedSectionTitle}
        isOpen={isOpen}
        onToggle={() => { setIsOpen((prev) => !prev); }}
        showBackToTop={showBackToTop}
        onBackToTop={handleBackToTop}
        enableShadow={enableShadow}
        previewDevice={previewDevice}
      />
    );
  }

  const info = getStyleInfo(selectedStyle, normalizedActions.length, mode, context, previewDevice);
  const PreviewContent = ({ isDark = false }: { isDark?: boolean }) => {
    const previewTokens = getSpeedDialThemeTokens({
      primary: brandColor,
      secondary,
      mode,
      isDark,
    });

    return (
      <BrowserFrame>
        <SpeedDialSectionContent
          actions={normalizedActions}
          style={selectedStyle}
          position={position}
          tokens={previewTokens}
          context="preview"
          groupLabel={resolvedSectionTitle}
          isOpen={isOpen}
          onToggle={() => { setIsOpen((prev) => !prev); }}
          showBackToTop={showBackToTop}
          onBackToTop={handleBackToTop}
          enableShadow={enableShadow}
          previewDevice={previewDevice}
        />
      </BrowserFrame>
    );
  };

  return (
    <>
      <PreviewWrapper
        title="Preview Speed Dial"
        device={previewDevice}
        setDevice={(nextDevice) => { setPreviewDevice?.(nextDevice); }}
        previewStyle={selectedStyle}
        setPreviewStyle={(nextStyle) => { onPreviewStyleChange?.(nextStyle as SpeedDialStyle); }}
        styles={SPEED_DIAL_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[previewDevice]}
      >
        <PreviewContent />
      </PreviewWrapper>

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={tokens.primary}
          secondary={tokens.secondary}
          description="Màu phụ được áp dụng cho action button, border ngăn cách và accent hover của Speed Dial."
        />
      ) : (
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
            Chế độ 1 màu: các action Speed Dial tự động dùng monochromatic theo màu chính.
          </p>
        </div>
      )}
    </>
  );
}
