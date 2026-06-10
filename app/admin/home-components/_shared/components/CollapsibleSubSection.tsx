'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';

export function CollapsibleSubSection({
  icon: Icon,
  title,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  badge,
  actions,
  className,
  contentClassName,
  children,
}: {
  icon: React.ElementType;
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const toggleOpen = () => {
    const nextOpen = !open;
    onOpenChange?.(nextOpen);
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
  };

  return (
    <div className={cn('rounded-lg border border-slate-200 dark:border-slate-700', className)}>
      <div className={cn(
        "flex w-full items-center gap-2 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800",
        open ? "rounded-t-lg" : "rounded-lg"
      )}>
        <button
          type="button"
          onClick={toggleOpen}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Icon size={15} className="shrink-0 text-slate-400" />
          <span className="flex-1 truncate">{title}</span>
        </button>
        {badge ? (
          <span className="text-xs font-normal text-slate-400">{badge}</span>
        ) : null}
        {actions ? (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        ) : null}
        <button type="button" onClick={toggleOpen} className="shrink-0">
          <ChevronDown
            size={15}
            className={cn(
              'text-slate-400 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      </div>
      {open && (
        <div className={cn('space-y-3 bg-white p-3 dark:bg-slate-900 rounded-b-lg', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}
