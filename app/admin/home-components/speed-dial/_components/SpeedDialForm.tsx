'use client';

import React from 'react';
import {
  Calendar,
  Check,
  Download,
  Facebook,
  GripVertical,
  Headphones,
  HelpCircle,
  Instagram,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Send,
  Settings2,
  ShoppingCart,
  Trash2,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Button, Card, CardContent, Label, cn } from '../../../components/ui';
import { AiDemoSpeedDialImport } from '../../product-list/_components/AiDemoProductsImport';
import type { SpeedDialAction, SpeedDialPosition } from '../_types';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

/* ------------------------------------------------------------------ */
/*  Custom SVG icons (not in Lucide)                                   */
/* ------------------------------------------------------------------ */

const ZaloSvg = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" />
  </svg>
);

const TikTokSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const XSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const ShopeeSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.9414 17.9633c.229-1.879-.981-3.077-4.1758-4.0969-1.548-.528-2.277-1.22-2.26-2.1719.065-1.056 1.048-1.825 2.352-1.85a5.2898 5.2898 0 0 1 2.8838.89c.116.072.197.06.263-.039.09-.145.315-.494.39-.62.051-.081.061-.187-.068-.281-.185-.1369-.704-.4149-.983-.5319a6.4697 6.4697 0 0 0-2.5118-.514c-1.909.008-3.4129 1.215-3.5389 2.826-.082 1.1629.494 2.1078 1.73 2.8278.262.152 1.6799.716 2.2438.892 1.774.552 2.695 1.5419 2.478 2.6969-.197 1.047-1.299 1.7239-2.818 1.7439-1.2039-.046-2.2878-.537-3.1278-1.19l-.141-.11c-.104-.08-.218-.075-.287.03-.05.077-.376.547-.458.67-.077.108-.035.168.045.234.35.293.817.613 1.134.775a6.7097 6.7097 0 0 0 2.8289.727 4.9048 4.9048 0 0 0 2.0759-.354c1.095-.465 1.8029-1.394 1.9449-2.554zM11.9986 1.4009c-2.068 0-3.7539 1.95-3.8329 4.3899h7.6657c-.08-2.44-1.765-4.3899-3.8328-4.3899zm7.8516 22.5981-.08.001-15.7843-.002c-1.074-.04-1.863-.91-1.971-1.991l-.01-.195L1.298 6.2858a.459.459 0 0 1 .45-.494h4.9748C6.8448 2.568 9.1607 0 11.9996 0c2.8388 0 5.1537 2.5689 5.2757 5.7898h4.9678a.459.459 0 0 1 .458.483l-.773 15.5883-.007.131c-.094 1.094-.979 1.9769-2.0709 2.0059z"/>
  </svg>
);

/* Lazada & Tiki dùng PNG logo thật thay vì SVG tự vẽ */

const MessengerSvg = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13"/>
  </svg>
);

const AiChatSvg = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Anten */}
    <path d="M12 9V5h3" />
    {/* Mặt robot */}
    <rect x="6" y="9" width="12" height="8" rx="2" />
    {/* Hai mắt */}
    <path d="M10 12v2M14 12v2" />
    {/* Hai tai */}
    <path d="M4 13h2M18 13h2" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Icon registry with suggestions                                     */
/* ------------------------------------------------------------------ */

interface IconDef {
  value: string;
  label: string;
  brandColor: string;
  suggestedLabel: string;
  suggestedUrl: string;
  /** Nếu có, dùng <img> thay SVG */
  imageSrc?: string;
}

const ICON_DEFS: IconDef[] = [
  { value: 'phone', label: 'Điện thoại', brandColor: '#ef4444', suggestedLabel: 'Gọi ngay', suggestedUrl: 'tel:0123456789' },
  { value: 'mail', label: 'Email', brandColor: '#ea580c', suggestedLabel: 'Email', suggestedUrl: 'mailto:contact@example.com' },
  { value: 'messenger', label: 'Messenger', brandColor: '#0084ff', suggestedLabel: 'Messenger', suggestedUrl: 'https://m.me/yourpage' },
  { value: 'message-circle', label: 'Chat AI', brandColor: '#8b5cf6', suggestedLabel: 'Chat AI', suggestedUrl: '#ai-chatbot' },
  { value: 'map-pin', label: 'Địa chỉ', brandColor: '#f97316', suggestedLabel: 'Chỉ đường', suggestedUrl: 'https://maps.google.com/?q=your+address' },
  { value: 'zalo', label: 'Zalo', brandColor: '#0084ff', suggestedLabel: 'Chat Zalo', suggestedUrl: 'https://zalo.me/yourpage' },
  { value: 'facebook', label: 'Facebook', brandColor: '#1877f2', suggestedLabel: 'Facebook', suggestedUrl: 'https://facebook.com/yourpage' },
  { value: 'instagram', label: 'Instagram', brandColor: '#e1306c', suggestedLabel: 'Instagram', suggestedUrl: 'https://instagram.com/yourpage' },
  { value: 'youtube', label: 'Youtube', brandColor: '#ff0000', suggestedLabel: 'Youtube', suggestedUrl: 'https://youtube.com/@yourchannel' },
  { value: 'tiktok', label: 'TikTok', brandColor: '#000000', suggestedLabel: 'TikTok', suggestedUrl: 'https://tiktok.com/@yourpage' },
  { value: 'x', label: 'X (Twitter)', brandColor: '#000000', suggestedLabel: 'X', suggestedUrl: 'https://x.com/yourpage' },
  { value: 'telegram', label: 'Telegram', brandColor: '#26a5e4', suggestedLabel: 'Telegram', suggestedUrl: 'https://t.me/yourpage' },
  { value: 'shopee', label: 'Shopee', brandColor: '#ee4d2d', suggestedLabel: 'Shopee', suggestedUrl: 'https://shopee.vn/yourshop' },
  { value: 'lazada', label: 'Lazada', brandColor: '#0f1689', suggestedLabel: 'Lazada', suggestedUrl: 'https://lazada.vn/shop/yourshop', imageSrc: '/icons/lazada-logo.png' },
  { value: 'tiki', label: 'Tiki', brandColor: '#1a94ff', suggestedLabel: 'Tiki', suggestedUrl: 'https://tiki.vn/cua-hang/yourshop', imageSrc: '/icons/tiki-logo.png' },
  { value: 'calendar', label: 'Đặt lịch', brandColor: '#8b5cf6', suggestedLabel: 'Đặt lịch', suggestedUrl: 'https://example.com/booking' },
  { value: 'shopping-cart', label: 'Giỏ hàng', brandColor: '#f59e0b', suggestedLabel: 'Mua hàng', suggestedUrl: 'https://example.com/cart' },
  { value: 'headphones', label: 'Hỗ trợ', brandColor: '#06b6d4', suggestedLabel: 'Hỗ trợ', suggestedUrl: 'https://example.com/support' },
  { value: 'help-circle', label: 'FAQ', brandColor: '#64748b', suggestedLabel: 'FAQ', suggestedUrl: 'https://example.com/faq' },
];

const getIconDef = (value: string): IconDef =>
  ICON_DEFS.find((d) => d.value === value) ?? ICON_DEFS[0];

const getIconBrandColor = (value: string): string => getIconDef(value).brandColor;

const normalizePhoneUrl = (value: string) => value.startsWith('tel:') ? value : `tel:${value.replace(/\s+/g, '')}`;

const normalizeEmailUrl = (value: string) => value.startsWith('mailto:') ? value : `mailto:${value}`;

const normalizeMapUrl = (value: string) =>
  /^https?:\/\//.test(value) ? value : `https://maps.google.com/?q=${encodeURIComponent(value)}`;

const normalizeZaloUrl = (value: string) => {
  if (/^https?:\/\//.test(value)) return value;
  return `https://zalo.me/${value.replace(/\s+/g, '')}`;
};

const renderIcon = (value: string, size = 16) => {
  if (value === 'zalo') return <ZaloSvg size={size} />;
  if (value === 'tiktok') return <TikTokSvg size={size} />;
  if (value === 'x') return <XSvg size={size} />;
  if (value === 'shopee') return <ShopeeSvg size={size} />;
  if (value === 'messenger') return <MessengerSvg size={size} />;
  if (value === 'message-circle') return <AiChatSvg size={size} />;

  // Lazada & Tiki dùng PNG logo
  const def = ICON_DEFS.find((d) => d.value === value);
  if (def?.imageSrc) {
    return <img src={def.imageSrc} alt={def.label} width={size} height={size} className="object-contain" style={{ borderRadius: '50%' }} />;
  }

  const map: Record<string, React.ElementType> = {
    phone: Phone, mail: Mail, 'map-pin': MapPin,
    facebook: Facebook, instagram: Instagram, youtube: Youtube, telegram: Send,
    calendar: Calendar, 'shopping-cart': ShoppingCart, headphones: Headphones,
    'help-circle': HelpCircle,
  };
  const Icon = map[value] ?? Phone;
  return <Icon size={size} />;
};

/* ------------------------------------------------------------------ */
/*  Inline input with tiny clear button                                */
/* ------------------------------------------------------------------ */

function ClearInput({
  value,
  onChange,
  placeholder,
  className,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-8 w-full rounded-md border bg-white px-2.5 pr-7 text-sm dark:bg-slate-900',
          error
            ? 'border-red-500'
            : 'border-slate-200 dark:border-slate-700',
          className,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

const validateUrl = (url: string): { valid: boolean; message?: string } => {
  if (!url.trim()) return { valid: true };
  const t = url.trim();
  if (t === '#ai-chatbot') return { valid: true };
  if (/^tel:[0-9+\-() ]+$/.test(t)) return { valid: true };
  if (/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t)) return { valid: true };
  if (/^https?:\/\/.+/.test(t)) return { valid: true };
  return { valid: false, message: 'Dùng tel:, mailto:, https:// hoặc #ai-chatbot' };
};

/* ------------------------------------------------------------------ */
/*  Icon Picker Grid (inline, toggleable)                              */
/* ------------------------------------------------------------------ */

function IconPickerInline({
  selected,
  onSelect,
  onClose,
}: {
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800/50">
      <div className="grid grid-cols-5 sm:grid-cols-8 gap-1">
        {ICON_DEFS.map((def) => {
          const active = selected === def.value;
          return (
            <button
              key={def.value}
              type="button"
              onClick={() => { onSelect(def.value); onClose(); }}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-md p-1.5 text-[9px] font-medium transition-all',
                active
                  ? 'ring-2 ring-offset-1 bg-white dark:bg-slate-900'
                  : 'hover:bg-white dark:hover:bg-slate-900',
              )}
              style={active ? { '--tw-ring-color': def.brandColor } as React.CSSProperties : undefined}
              title={def.label}
            >
              {def.imageSrc ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden bg-white">
                  <img src={def.imageSrc} alt={def.label} width={24} height={24} className="object-contain" />
                </span>
              ) : (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: def.brandColor }}
                >
                  {renderIcon(def.value, 14)}
                </span>
              )}
              <span className="text-slate-500 dark:text-slate-400 truncate w-full text-center leading-tight">
                {def.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single action card                                                 */
/* ------------------------------------------------------------------ */

function ActionCard({
  action,
  idx,
  total,
  onUpdate,
  onRemove,
  dragProps,
  isDragged,
  isDragOver,
}: {
  action: SpeedDialAction;
  idx: number;
  total: number;
  onUpdate: (updater: (a: SpeedDialAction) => SpeedDialAction) => void;
  onRemove: () => void;
  dragProps: Record<string, unknown>;
  isDragged: boolean;
  isDragOver: boolean;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pendingIcon, setPendingIcon] = React.useState<string | null>(null);
  const [urlError, setUrlError] = React.useState('');

  const def = getIconDef(action.icon);
  const brandColor = def.brandColor;

  // Pending suggestion from icon change
  const pendingDef = pendingIcon ? getIconDef(pendingIcon) : null;

  const handleIconSelect = (newIcon: string) => {
    // Always update icon + bgColor immediately
    onUpdate((cur) => ({ ...cur, icon: newIcon, bgColor: getIconBrandColor(newIcon) }));
    // Show suggestion bar
    if (newIcon !== action.icon) {
      setPendingIcon(newIcon);
    }
  };

  const handleApplySuggestion = () => {
    if (!pendingDef) return;
    onUpdate((cur) => ({ ...cur, label: pendingDef.suggestedLabel, url: pendingDef.suggestedUrl }));
    setPendingIcon(null);
  };

  const handleDismissSuggestion = () => {
    setPendingIcon(null);
  };

  const handleUrlChange = (newUrl: string) => {
    onUpdate((cur) => ({ ...cur, url: newUrl }));
    const v = validateUrl(newUrl);
    setUrlError(!v.valid && v.message ? v.message : '');
  };

  return (
    <div
      {...dragProps}
      className={cn(
        'rounded-lg border transition-all cursor-grab active:cursor-grabbing overflow-hidden',
        'border-slate-200 dark:border-slate-700',
        isDragged && 'opacity-50 scale-[0.98]',
        isDragOver && 'ring-2 ring-blue-500 ring-offset-2',
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-2.5 py-1.5" style={{ backgroundColor: `${brandColor}08` }}>
        <GripVertical size={14} className="text-slate-400 shrink-0" />
        {def.imageSrc ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full overflow-hidden bg-white shrink-0">
            <img src={def.imageSrc} alt={def.label} width={20} height={20} className="object-contain" />
          </span>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-white shrink-0" style={{ backgroundColor: brandColor }}>
            {renderIcon(action.icon, 12)}
          </span>
        )}
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">
          {action.label || `Hành động ${idx + 1}`}
        </span>
        <button
          type="button"
          onClick={() => setPickerOpen(!pickerOpen)}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Đổi icon"
        >
          <Pencil size={13} />
        </button>
        <Button type="button" variant="ghost" size="icon" className="text-red-500 h-6 w-6" onClick={onRemove} disabled={total <= 1}>
          <Trash2 size={13} />
        </Button>
      </div>

      {/* ── Icon Picker (toggle) ── */}
      {pickerOpen && (
        <div className="px-2.5 pt-2 pb-1">
          <IconPickerInline selected={action.icon} onSelect={handleIconSelect} onClose={() => setPickerOpen(false)} />
        </div>
      )}

      {/* ── Suggestion bar ── */}
      {pendingDef && (
        <div className="mx-2.5 mt-1.5 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 px-2.5 py-1.5 text-xs">
          <span className="text-blue-700 dark:text-blue-300 flex-1 truncate">
            Gợi ý: <b>{pendingDef.suggestedLabel}</b> — {pendingDef.suggestedUrl}
          </span>
          <button type="button" onClick={handleApplySuggestion} className="flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-white text-[11px] font-medium hover:bg-blue-700 transition-colors">
            <Check size={11} /> Áp dụng
          </button>
          <button type="button" onClick={handleDismissSuggestion} className="p-0.5 text-blue-400 hover:text-blue-600">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Inputs ── */}
      <div className="px-2.5 py-2 space-y-1.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-400">Nhãn</Label>
            <ClearInput
              value={action.label}
              onChange={(v) => onUpdate((cur) => ({ ...cur, label: v }))}
              placeholder="VD: Gọi ngay"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-400">URL</Label>
            <ClearInput
              value={action.url}
              onChange={handleUrlChange}
              placeholder="tel:, mailto:, https://"
              error={!!urlError}
            />
            {urlError && <p className="text-[10px] text-red-500">{urlError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main form                                                          */
/* ------------------------------------------------------------------ */

interface SpeedDialFormProps {
  actions: SpeedDialAction[];
  onActionsChange: (actions: SpeedDialAction[]) => void;
  position: SpeedDialPosition;
  onPositionChange: (position: SpeedDialPosition) => void;
  defaultOpen: boolean;
  onDefaultOpenChange: (value: boolean) => void;
  showOnAllPages: boolean;
  onShowOnAllPagesChange: (value: boolean) => void;
  enableShadow: boolean;
  onEnableShadowChange: (value: boolean) => void;
  defaultActionColor: string;
  defaultExpanded?: boolean;
}

export function SpeedDialForm({
  actions,
  onActionsChange,
  position: _position,
  onPositionChange: _onPositionChange,
  defaultOpen,
  onDefaultOpenChange,
  showOnAllPages,
  onShowOnAllPagesChange,
  enableShadow,
  onEnableShadowChange,
  defaultActionColor,
  defaultExpanded = true,
}: SpeedDialFormProps) {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['settings', 'actions'],
    defaultExpanded
  );

  const speedDialSettings = useQuery(api.settings.getMultiple, {
    keys: [
      'contact_phone',
      'contact_email',
      'contact_address',
      'contact_zalo',
      'social_facebook',
      'social_instagram',
      'social_youtube',
      'social_tiktok',
    ],
  });
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const buildId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `action-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const ensureAction = (a: SpeedDialAction, i: number): SpeedDialAction => ({
    ...a,
    bgColor: getIconBrandColor(a.icon || 'phone'),
    icon: a.icon || 'phone',
    id: a.id ?? `legacy-${i}`,
    label: a.label ?? '',
    url: a.url ?? '',
  });

  const normalizedActions = React.useMemo(
    () => actions.map((a, i) => ensureAction(a, i)),
    [actions],
  );

  const needsNormalization = React.useMemo(() => {
    if (actions.length !== normalizedActions.length) return true;
    return normalizedActions.some((n, i) => {
      const c = actions[i];
      return !c || c.id !== n.id || c.icon !== n.icon || c.label !== n.label || c.url !== n.url || c.bgColor !== n.bgColor;
    });
  }, [actions, normalizedActions]);

  React.useEffect(() => {
    if (needsNormalization) onActionsChange(normalizedActions);
  }, [needsNormalization, normalizedActions, onActionsChange]);

  const handleAdd = () => {
    onActionsChange([...normalizedActions, { id: buildId(), icon: 'phone', label: '', url: '', bgColor: defaultActionColor || getIconBrandColor('phone') }]);
  };

  const buildSettingAction = (icon: string, label: string, url: string): SpeedDialAction => ({
    id: buildId(),
    bgColor: getIconBrandColor(icon),
    icon,
    label,
    url,
  });

  const getSettingValue = (key: string) => {
    const value = speedDialSettings?.[key];
    return typeof value === 'string' ? value.trim() : '';
  };

  const loadFromSettings = () => {
    if (!speedDialSettings) {
      toast.error('Dữ liệu settings chưa sẵn sàng');
      return;
    }

    const loadedActions: SpeedDialAction[] = [];
    const phone = getSettingValue('contact_phone');
    const zalo = getSettingValue('contact_zalo');
    const facebook = getSettingValue('social_facebook');
    const address = getSettingValue('contact_address');
    const email = getSettingValue('contact_email');
    const instagram = getSettingValue('social_instagram');
    const youtube = getSettingValue('social_youtube');
    const tiktok = getSettingValue('social_tiktok');

    if (phone) loadedActions.push(buildSettingAction('phone', 'Gọi ngay', normalizePhoneUrl(phone)));
    if (zalo) loadedActions.push(buildSettingAction('zalo', 'Zalo', normalizeZaloUrl(zalo)));
    if (facebook) loadedActions.push(buildSettingAction('facebook', 'Facebook', facebook));
    if (address) loadedActions.push(buildSettingAction('map-pin', 'Chỉ đường', normalizeMapUrl(address)));
    if (email) loadedActions.push(buildSettingAction('mail', 'Email', normalizeEmailUrl(email)));
    if (instagram) loadedActions.push(buildSettingAction('instagram', 'Instagram', instagram));
    if (youtube) loadedActions.push(buildSettingAction('youtube', 'Youtube', youtube));
    if (tiktok) loadedActions.push(buildSettingAction('tiktok', 'TikTok', tiktok));

    if (loadedActions.length === 0) {
      toast.error('Settings chưa có mạng xã hội hoặc thông tin liên hệ');
      return;
    }

    onActionsChange(loadedActions.slice(0, 6));
    toast.success(`Đã load ${Math.min(loadedActions.length, 6)} hành động từ Settings`);
  };

  const handleRemove = (id: string) => {
    if (normalizedActions.length <= 1) return;
    onActionsChange(normalizedActions.filter((a) => String(a.id) !== id));
  };

  const handleUpdate = (id: string, updater: (a: SpeedDialAction) => SpeedDialAction) => {
    onActionsChange(normalizedActions.map((a) => (String(a.id) === id ? updater(a) : a)));
  };

  const dragProps = (id: string) => ({
    draggable: true,
    onDragStart: () => setDraggedId(id),
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (draggedId !== id) setDragOverId(id); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) return;
      const si = normalizedActions.findIndex((a) => String(a.id) === draggedId);
      const ti = normalizedActions.findIndex((a) => String(a.id) === id);
      if (si < 0 || ti < 0) { setDraggedId(null); setDragOverId(null); return; }
      const next = [...normalizedActions];
      const [moved] = next.splice(si, 1);
      next.splice(ti, 0, moved);
      onActionsChange(next);
      setDraggedId(null); setDragOverId(null);
    },
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
  });

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-3">
        <FormSectionsToggleAllButton
          hasClosedSection={hasClosedSection}
          onToggleAll={handleToggleAll}
        />
        {/* ── Cấu hình hiển thị ── */}
        <SubSection
          icon={Settings2}
          title="Cấu hình hiển thị"
          open={openSections.settings}
          onOpenChange={(open) => toggleSection('settings', open)}
        >
          <div className="space-y-3">
            {/* Vị trí: luôn góc phải, ẩn khỏi UI */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDefaultOpenChange(!defaultOpen)}
                  className={cn('inline-flex items-center justify-center rounded-full w-10 h-5 transition-colors cursor-pointer', defaultOpen ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600')}
                  aria-pressed={defaultOpen}
                >
                  <div className={cn('w-4 h-4 bg-white rounded-full transition-transform shadow', defaultOpen ? 'translate-x-2' : '-translate-x-2')} />
                </button>
                <Label className="text-xs">Mở sẵn</Label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onShowOnAllPagesChange(!showOnAllPages)}
                  className={cn('inline-flex items-center justify-center rounded-full w-10 h-5 transition-colors cursor-pointer', showOnAllPages ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600')}
                  aria-pressed={showOnAllPages}
                >
                  <div className={cn('w-4 h-4 bg-white rounded-full transition-transform shadow', showOnAllPages ? 'translate-x-2' : '-translate-x-2')} />
                </button>
                <Label className="text-xs">Toàn site</Label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEnableShadowChange(!enableShadow)}
                  className={cn('inline-flex items-center justify-center rounded-full w-10 h-5 transition-colors cursor-pointer', enableShadow ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600')}
                  aria-pressed={enableShadow}
                >
                  <div className={cn('w-4 h-4 bg-white rounded-full transition-transform shadow', enableShadow ? 'translate-x-2' : '-translate-x-2')} />
                </button>
                <Label className="text-xs">Đổ bóng</Label>
              </div>
            </div>
          </div>
        </SubSection>

        {/* ── Hành động ── */}
        <SubSection
          icon={Zap}
          title={`Hành động (${normalizedActions.length})`}
          open={openSections.actions}
          onOpenChange={(open) => toggleSection('actions', open)}
        >
          <div className="space-y-2">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={loadFromSettings} className="h-7 text-xs gap-1.5">
                <Download size={13} /> Load từ Settings
              </Button>
              <AiDemoSpeedDialImport onApply={(items) => onActionsChange(items as SpeedDialAction[])} />
              <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={normalizedActions.length >= 6} className="h-7 text-xs gap-1.5">
                <Plus size={13} /> Thêm
              </Button>
            </div>

            {normalizedActions.map((action, idx) => {
              const id = String(action.id);
              return (
                <ActionCard
                  key={id}
                  action={action}
                  idx={idx}
                  total={normalizedActions.length}
                  onUpdate={(updater) => handleUpdate(id, updater)}
                  onRemove={() => handleRemove(id)}
                  dragProps={dragProps(id)}
                  isDragged={draggedId === id}
                  isDragOver={dragOverId === id}
                />
              );
            })}

            <p className="text-[11px] text-slate-400">
              Nhấn <Pencil size={10} className="inline" /> để đổi icon. Gợi ý sẽ hiện để áp dụng nhanh nhãn & URL.
            </p>
          </div>
        </SubSection>
      </CardContent>
    </Card>
  );
}
