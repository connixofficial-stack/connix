'use client';

import React from 'react';
import { Settings2 } from 'lucide-react';
import { Label } from '../../../components/ui';
import { CollapsibleSubSection as SubSection } from './CollapsibleSubSection';
import { SectionSpacingControl } from './SectionSpacingControl';
import type { SectionSpacing } from '../types/sectionSpacing';

export type HomeComponentCornerRadius = 'none' | 'sm' | 'lg';

export function HomeComponentDisplaySettingsSection({
  open,
  onOpenChange,
  cornerRadius,
  onCornerRadiusChange,
  spacing,
  onSpacingChange,
  children,
  className,
  contentClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cornerRadius: HomeComponentCornerRadius;
  onCornerRadiusChange: (value: HomeComponentCornerRadius) => void;
  spacing: SectionSpacing;
  onSpacingChange: (value: SectionSpacing) => void;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <SubSection
      icon={Settings2}
      title="Cài đặt hiển thị"
      open={open}
      onOpenChange={onOpenChange}
      className={className}
      contentClassName={contentClassName}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Bo góc card</Label>
          <select
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={cornerRadius}
            onChange={(event) => onCornerRadiusChange(event.target.value as HomeComponentCornerRadius)}
          >
            <option value="none">Không bo góc</option>
            <option value="sm">Bo góc ít</option>
            <option value="lg">Bo góc nhiều</option>
          </select>
        </div>
        <SectionSpacingControl value={spacing} onChange={onSpacingChange} />
        {children}
      </div>
    </SubSection>
  );
}
