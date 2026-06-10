'use client';

import React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import { getSuggestedSecondary } from '../lib/typeColorOverride';

type TypeColorOverrideCardProps = {
  title: string;
  enabled: boolean;
  mode: 'single' | 'dual';
  primary: string;
  secondary: string;
  onEnabledChange: (next: boolean) => void;
  onModeChange: (next: 'single' | 'dual') => void;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
  toggleLabel?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
};

export function TypeColorOverrideCard({
  title,
  enabled,
  mode,
  primary,
  secondary,
  onEnabledChange,
  onModeChange,
  onPrimaryChange,
  onSecondaryChange,
  disabled = false,
  compact = false,
  toggleLabel = 'Dùng màu custom',
  primaryLabel = 'Màu chính',
  secondaryLabel = 'Màu phụ',
}: TypeColorOverrideCardProps) {
  return (
    <Card>
      <CardHeader className={compact ? 'pb-3' : undefined}>
        <CardTitle className={cn('text-base', compact && 'text-sm leading-5')}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn(compact ? 'space-y-3 pt-0' : 'space-y-4')}>
        <div className="flex items-center justify-between gap-3">
          <div className={cn('font-medium text-slate-700 dark:text-slate-200', compact ? 'text-xs' : 'text-sm')}>{toggleLabel}</div>
          <button
            type="button"
            className={cn(
              'cursor-pointer inline-flex items-center justify-center rounded-full w-10 h-5 transition-colors',
              enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
            onClick={() => {
              if (disabled) {return;}
              onEnabledChange(!enabled);
            }}
            aria-pressed={enabled}
            disabled={disabled}
          >
            <div className={cn('w-4 h-4 bg-white rounded-full transition-transform', enabled ? 'translate-x-2' : '-translate-x-2')} />
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'single' ? 'accent' : 'outline'}
            onClick={() => {
              if (disabled || !enabled) {return;}
              onModeChange('single');
              onSecondaryChange(primary);
            }}
            disabled={!enabled || disabled}
          >
            Single
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'dual' ? 'accent' : 'outline'}
            onClick={() => {
              if (disabled || !enabled) {return;}
              if (mode === 'single') {
                onSecondaryChange(getSuggestedSecondary(primary));
              }
              onModeChange('dual');
            }}
            disabled={!enabled || disabled}
          >
            Dual
          </Button>
        </div>

        <div className={cn('grid grid-cols-1 gap-4', mode === 'dual' && 'md:grid-cols-2', compact && 'gap-3')}>
          <div className={cn(compact ? 'space-y-1.5' : 'space-y-2')}>
            <Label className={cn(compact && 'text-xs')}>{primaryLabel}</Label>
            <div className={cn('flex items-center', compact ? 'gap-1.5' : 'gap-2')}>
              <input
                type="color"
                value={primary}
                onChange={(event) => {
                  onPrimaryChange(event.target.value);
                  if (mode === 'single') {
                    onSecondaryChange(event.target.value);
                  }
                }}
                disabled={!enabled || disabled}
                className={cn(compact && 'h-8 w-8')}
              />
              <Input
                value={primary}
                onChange={(event) => {
                  onPrimaryChange(event.target.value);
                  if (mode === 'single') {
                    onSecondaryChange(event.target.value);
                  }
                }}
                disabled={!enabled || disabled}
                className={cn(compact && 'h-8 text-xs')}
              />
            </div>
          </div>
          {mode === 'dual' && (
            <div className={cn(compact ? 'space-y-1.5' : 'space-y-2')}>
              <Label className={cn(compact && 'text-xs')}>{secondaryLabel}</Label>
              <div className={cn('flex items-center', compact ? 'gap-1.5' : 'gap-2')}>
                <input
                  type="color"
                  value={secondary}
                  onChange={(event) => onSecondaryChange(event.target.value)}
                  disabled={!enabled || disabled}
                  className={cn(compact && 'h-8 w-8')}
                />
                <Input
                  value={secondary}
                  onChange={(event) => onSecondaryChange(event.target.value)}
                  disabled={!enabled || disabled}
                  className={cn(compact && 'h-8 text-xs')}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
