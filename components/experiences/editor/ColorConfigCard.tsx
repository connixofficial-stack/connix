import React from 'react';
import { Input, Label } from '@/app/admin/components/ui';
import { ToggleRow } from './ControlCard';

type ColorMode = 'single' | 'dual';

type ColorConfigCardProps = {
  primary: string;
  secondary: string;
  mode: ColorMode;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  onModeChange: (mode: ColorMode) => void;
};

const isValidHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value.trim());

export function ColorConfigCard({
  primary,
  secondary,
  mode,
  onPrimaryChange,
  onSecondaryChange,
  onModeChange,
}: ColorConfigCardProps) {
  const normalizedPrimary = isValidHexColor(primary) ? primary : '#3b82f6';
  const normalizedSecondary = isValidHexColor(secondary) ? secondary : normalizedPrimary;

  return (
    <div className="space-y-3">
      <ToggleRow
        label="Hai màu"
        description={mode === 'dual' ? 'Đang bật' : 'Đơn sắc'}
        checked={mode === 'dual'}
        onChange={(checked) => onModeChange(checked ? 'dual' : 'single')}
        accentColor={normalizedPrimary}
      />

      <div className="space-y-2">
        <Label>Màu chính</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={normalizedPrimary}
            onChange={(e) => onPrimaryChange(e.target.value)}
            className="h-9 w-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
          />
          <Input
            value={(primary || '').toUpperCase()}
            onChange={(e) => onPrimaryChange(e.target.value)}
            className="w-28 font-mono text-xs uppercase"
            maxLength={7}
            placeholder="#000000"
          />
        </div>
      </div>

      {mode === 'dual' && (
        <div className="space-y-2">
          <Label>Màu phụ</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={normalizedSecondary}
              onChange={(e) => onSecondaryChange(e.target.value)}
              className="h-9 w-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
            />
            <Input
              value={(secondary || '').toUpperCase()}
              onChange={(e) => onSecondaryChange(e.target.value)}
              className="w-28 font-mono text-xs uppercase"
              maxLength={7}
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  );
}
