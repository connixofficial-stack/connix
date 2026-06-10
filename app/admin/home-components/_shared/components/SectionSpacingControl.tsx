'use client';

import React from 'react';
import { Label } from '../../../components/ui';
import type { SectionSpacing } from '../types/sectionSpacing';

export const SectionSpacingControl = ({
  value,
  onChange,
  label = 'Spacing trên dưới',
}: {
  value: SectionSpacing;
  onChange: (value: SectionSpacing) => void;
  label?: string;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <select
      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      value={value}
      onChange={(event) => { onChange(event.target.value as SectionSpacing); }}
    >
      <option value="normal">Bình thường</option>
      <option value="compact">Hẹp</option>
      <option value="none">Bỏ spacing</option>
    </select>
  </div>
);
