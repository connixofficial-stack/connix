'use client';

import React from 'react';
import { Button, cn } from '@/app/admin/components/ui';
import { useSidebarState } from '@/app/admin/context/SidebarContext';
import { useHomeComponentFooterActions } from './HomeComponentFooterActions';
import { UndoRedoToolbar } from './UndoRedoToolbar';

type HomeComponentStickyFooterProps = {
  isSubmitting: boolean;
  hasChanges?: boolean;
  onCancel?: () => void;
  onClickSave?: () => void | Promise<void>;
  submitLabel: string;
  submittingLabel?: string;
  savedLabel?: string;
  disableSave?: boolean;
  align?: 'between' | 'end';
  cancelLabel?: string;
  submitVariant?: React.ComponentProps<typeof Button>['variant'];
  submitType?: 'submit' | 'button';
  submitClassName?: string;
  children?: React.ReactNode;
  /** Trạng thái active/inactive của component */
  active?: boolean;
  /** Callback khi toggle trạng thái */
  onActiveChange?: (value: boolean) => void;
  /**
   * Undo/Redo config — truyền vào để hiện 2 button Ctrl+Z/Y trong footer.
   * Keyboard shortcut đã được bind tại useUndoRedo hook — props này chỉ để hiện UI.
   */
  undoRedo?: {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
  };
};

export function HomeComponentStickyFooter({
  isSubmitting,
  hasChanges,
  onCancel,
  onClickSave,
  submitLabel,
  submittingLabel = 'Đang lưu...',
  savedLabel = 'Đã lưu',
  disableSave,
  align = 'between',
  cancelLabel = 'Hủy bỏ',
  submitVariant = 'accent',
  submitType = 'submit',
  submitClassName,
  children,
  active,
  onActiveChange,
  undoRedo,
}: HomeComponentStickyFooterProps) {
  const { isSidebarCollapsed } = useSidebarState();
  const footerActions = useHomeComponentFooterActions();
  const isDisabled = disableSave ?? (hasChanges === false || isSubmitting);
  const label = isSubmitting
    ? submittingLabel
    : hasChanges === false
      ? savedLabel
      : submitLabel;

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const sortedFooterActions = React.useMemo(() => {
    const actionPriority = ['toggle-all', 'ai-import'];
    return [...footerActions].sort((a, b) => {
      const indexA = actionPriority.indexOf(a.key);
      const indexB = actionPriority.indexOf(b.key);
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });
  }, [footerActions]);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 z-30',
        isSidebarCollapsed ? 'lg:left-[80px]' : 'lg:left-[280px]'
      )}
    >
      <div className={cn('flex items-center gap-3 w-full', align === 'between' ? 'justify-between' : 'justify-end')}>
        {!isMounted ? (
          <div className="h-9 w-full flex items-center justify-end gap-2">
            <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ) : (
          children ?? (
            <>
              <div className="flex items-center gap-3">
                {onCancel && (
                  <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                    {cancelLabel}
                  </Button>
                )}
                {active !== undefined && onActiveChange && (
                  <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Trạng thái</span>
                    <div
                      className={cn(
                         'cursor-pointer inline-flex items-center justify-center rounded-full w-10 h-5 transition-colors',
                        active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
                      )}
                      onClick={() => onActiveChange(!active)}
                    >
                      <div className={cn(
                        'w-4 h-4 bg-white rounded-full transition-transform shadow',
                        active ? 'translate-x-2' : '-translate-x-2',
                      )} />
                    </div>
                    <span className={cn(
                      'text-xs font-medium',
                      active ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500',
                    )}>
                      {active ? 'Bật' : 'Tắt'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {undoRedo && (
                  <UndoRedoToolbar
                    canUndo={undoRedo.canUndo}
                    canRedo={undoRedo.canRedo}
                    onUndo={undoRedo.onUndo}
                    onRedo={undoRedo.onRedo}
                    className="mr-1 border-r border-slate-200 dark:border-slate-700 pr-2"
                  />
                )}
                {sortedFooterActions.map((action) => (
                  <React.Fragment key={action.key}>{action.node}</React.Fragment>
                ))}
                <Button
                  type={submitType}
                  onClick={onClickSave}
                  variant={submitVariant}
                  disabled={isDisabled}
                  className={cn(
                    hasChanges === false && !isSubmitting && !disableSave
                      ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400'
                      : undefined,
                    submitClassName
                  )}
                >
                  {label}
                </Button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
