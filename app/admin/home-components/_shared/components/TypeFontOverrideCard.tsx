'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Label, cn } from '../../../components/ui';
import { FONT_REGISTRY } from '@/lib/fonts/registry';

type TypeFontOverrideCardProps = {
  title: string;
  enabled: boolean;
  fontKey: string;
  onEnabledChange: (next: boolean) => void;
  onFontChange: (next: string) => void;
  disabled?: boolean;
  compact?: boolean;
  toggleLabel?: string;
  fontLabel?: string;
};

export function TypeFontOverrideCard({
  title,
  enabled,
  fontKey,
  onEnabledChange,
  onFontChange,
  disabled = false,
  compact = false,
  toggleLabel = 'Dùng font custom',
  fontLabel = 'Font chữ',
}: TypeFontOverrideCardProps) {
  return (
    <Card>
      <CardHeader className={compact ? 'pb-3' : undefined}>
        <CardTitle className={cn('text-base', compact && 'text-sm leading-5')}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn(compact ? 'space-y-3 pt-0' : 'space-y-4')}>
        <div className="flex items-center justify-between gap-3">
          <div className={cn('font-medium text-slate-700 dark:text-slate-200', compact ? 'text-xs' : 'text-sm')}>{toggleLabel}</div>
          <div
            className={cn(
              'cursor-pointer inline-flex items-center justify-center rounded-full w-10 h-5 transition-colors',
              enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
            onClick={() => {
              if (disabled) {return;}
              onEnabledChange(!enabled);
            }}
          >
            <div className={cn('w-4 h-4 bg-white rounded-full transition-transform', enabled ? 'translate-x-2' : '-translate-x-2')} />
          </div>
        </div>

        <div className={cn('space-y-2', compact && 'space-y-1.5')}>
          <Label className={cn(compact && 'text-xs')}>{fontLabel}</Label>
          <select
            value={fontKey}
            onChange={(event) => onFontChange(event.target.value)}
            disabled={!enabled || disabled}
            className={cn(
              'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
              compact && 'h-8 text-xs'
            )}
          >
            {FONT_REGISTRY.map((font) => (
              <option key={font.key} value={font.key}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
