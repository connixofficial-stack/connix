'use client';

import { ClipboardPaste, Crop, Link, Upload } from 'lucide-react';
import { cn } from './ui';

type ImageSourceMode = 'upload' | 'url';

type ImageSourceActionsProps = {
  mode?: ImageSourceMode;
  onUpload: () => void;
  onUrl: () => void;
  onPaste: () => void | Promise<void>;
  onCrop?: () => void;
  cropLabel?: string;
  cropDisabled?: boolean;
  disabled?: boolean;
  className?: string;
  iconSize?: number;
};

export function ImageSourceActions({
  mode,
  onUpload,
  onUrl,
  onPaste,
  onCrop,
  cropLabel,
  cropDisabled = false,
  disabled = false,
  className,
  iconSize = 12,
}: ImageSourceActionsProps) {
  const baseClass = 'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const inactiveClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700';
  const activeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <button
        type="button"
        onClick={onUpload}
        disabled={disabled}
        className={cn(baseClass, mode === 'upload' ? activeClass : inactiveClass)}
      >
        <Upload size={iconSize} /> Upload
      </button>
      <button
        type="button"
        onClick={onUrl}
        disabled={disabled}
        className={cn(baseClass, mode === 'url' ? activeClass : inactiveClass)}
      >
        <Link size={iconSize} /> URL
      </button>
      <button
        type="button"
        onClick={() => { void onPaste(); }}
        disabled={disabled}
        className={cn(baseClass, 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400')}
        title="Copy ảnh rồi click vào đây"
      >
        <ClipboardPaste size={iconSize} /> Dán
      </button>
      {onCrop ? (
        <button
          type="button"
          onClick={onCrop}
          disabled={disabled || cropDisabled}
          className={cn(baseClass, 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50')}
          title={cropLabel ? `Cắt đúng tỉ lệ ${cropLabel}` : 'Cắt ảnh'}
        >
          <Crop size={iconSize} /> Cắt{cropLabel ? ` ${cropLabel}` : ''}
        </button>
      ) : null}
    </div>
  );
}
