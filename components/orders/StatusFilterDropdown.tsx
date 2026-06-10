'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type StatusFilterOption = {
  key: string;
  label: string;
};

type StatusFilterDropdownProps = {
  label?: string;
  options: StatusFilterOption[];
  activeKeys: string[];
  isAllActive: boolean;
  onToggleKey: (key: string) => void;
  onToggleAll: () => void;
  brandColor?: string;
  colors?: {
    buttonBorder: string;
    buttonText: string;
    buttonActiveBg: string;
    buttonActiveBorder: string;
    buttonActiveText: string;
    panelBg: string;
    panelBorder: string;
    panelText: string;
    panelMutedText: string;
    divider: string;
  };
};

export function StatusFilterDropdown({
  label = 'Trạng thái',
  options,
  activeKeys,
  isAllActive,
  onToggleKey,
  onToggleAll,
  brandColor,
  colors,
}: StatusFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonLabel = useMemo(() => {
    if (isAllActive) return 'Tất cả';
    if (activeKeys.length > 0) return `${label} (${activeKeys.length})`;
    return label;
  }, [activeKeys.length, isAllActive, label]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isAllActive ? 'shadow-sm' : ''}`}
        style={isAllActive
          ? {
            borderColor: colors?.buttonActiveBorder ?? brandColor ?? '#e2e8f0',
            color: colors?.buttonActiveText ?? brandColor ?? '#0f172a',
            backgroundColor: colors?.buttonActiveBg ?? '#ffffff',
          }
          : { borderColor: colors?.buttonBorder ?? '#e2e8f0', color: colors?.buttonText ?? '#64748b', backgroundColor: 'transparent' }
        }
      >
        <span className="inline-flex items-center gap-1.5">
          {buttonLabel}
          <ChevronDown size={12} />
        </span>
      </button>
      {open && (
        <div
          className="absolute left-0 mt-2 w-56 rounded-lg border shadow-lg p-3 z-10"
          style={{ borderColor: colors?.panelBorder ?? '#e2e8f0', backgroundColor: colors?.panelBg ?? '#ffffff' }}
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs" style={{ color: colors?.panelText ?? '#334155' }}>
              <input type="checkbox" checked={isAllActive} onChange={onToggleAll} />
              <span>Tất cả</span>
            </label>
            <div className="h-px" style={{ backgroundColor: colors?.divider ?? '#e2e8f0' }} />
            <div className="max-h-52 overflow-auto space-y-2">
              {options.map((option) => (
                <label key={option.key} className="flex items-center gap-2 text-xs" style={{ color: colors?.panelMutedText ?? '#475569' }}>
                  <input
                    type="checkbox"
                    checked={activeKeys.includes(option.key)}
                    onChange={() => onToggleKey(option.key)}
                  />
                  <span className="truncate">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
