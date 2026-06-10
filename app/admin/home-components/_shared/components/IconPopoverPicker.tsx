'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { Input, cn } from '../../../components/ui';

export interface IconOption {
  value: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

interface IconPopoverPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: IconOption[];
  brandColor?: string;
  /** Compact mode: smaller trigger button */
  compact?: boolean;
}

/**
 * Shared Popover Grid Icon Picker.
 * Displays a trigger button showing the current icon, clicking opens
 * a floating popover with search + grid of icons.
 */
export function IconPopoverPicker({ value, onChange, options, brandColor = '#3b82f6', compact }: IconPopoverPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<React.CSSProperties | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = ref.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 16);
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const belowTop = rect.bottom + 4;
      const popoverHeight = popoverRef.current?.offsetHeight ?? 320;
      const top = belowTop + popoverHeight > window.innerHeight - 8
        ? Math.max(8, rect.top - popoverHeight - 4)
        : belowTop;

      setPosition({ left, top, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(keyword) || opt.value.toLowerCase().includes(keyword),
    );
  }, [options, query]);

  const selected = options.find((opt) => opt.value === value);
  const SelectedIcon = selected?.Icon;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between gap-2 rounded-md border border-input bg-background text-left text-sm transition-colors hover:bg-slate-50',
          compact ? 'h-8 px-2' : 'h-10 w-full px-3',
          brandColor.toLowerCase() === '#ffffff' && 'bg-slate-950 text-white border-slate-800 hover:bg-slate-900',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {SelectedIcon && <SelectedIcon size={compact ? 14 : 16} style={{ color: brandColor }} />}
          <span className="truncate text-xs">{selected?.label ?? value}</span>
        </span>
        <Search size={12} className="shrink-0 text-slate-400" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[1000] rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95"
          style={position ?? { left: 0, top: 0, width: 320, visibility: 'hidden' }}
        >
          {/* Search */}
          <div className="border-b border-slate-200 p-2 dark:border-slate-700">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm icon..."
                className="h-8 pl-9 text-xs"
                autoFocus
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid max-h-60 grid-cols-5 gap-1 overflow-y-auto p-2">
            {filtered.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-center transition-all hover:bg-blue-50 hover:scale-105',
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30'
                      : 'border-slate-100 dark:border-slate-700 hover:border-blue-200',
                  )}
                  title={opt.label}
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <opt.Icon size={16} style={{ color: isActive ? brandColor : undefined }} className={isActive ? '' : 'text-slate-600 dark:text-slate-300'} />
                  </span>
                  <span className="w-full truncate text-[9px] leading-tight">{opt.label}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-5 rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                Không tìm thấy
              </div>
            )}
          </div>
        </div>
      , document.body)}
    </div>
  );
}
