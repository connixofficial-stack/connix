import React from 'react';
import { ToggleSwitch } from '@/components/modules/shared';

interface ExperienceBlockToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  color: string;
}

export function ExperienceBlockToggle({
  label,
  description,
  enabled,
  onChange,
  disabled,
  color,
}: ExperienceBlockToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <ToggleSwitch
        enabled={enabled}
        onChange={onChange}
        color={color}
        disabled={disabled}
      />
    </div>
  );
}
