'use client';

import { Redo2, Undo2 } from 'lucide-react';
import { Button } from '@/app/admin/components/ui';
import { cn } from '@/app/admin/components/ui';

interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  className?: string;
  /** Hiện tooltip hint phím tắt (default: true) */
  showHint?: boolean;
}

/**
 * UI component cho undo/redo — dùng kèm với useUndoRedo hook.
 *
 * Keyboard shortcut (Ctrl+Z / Ctrl+Y) đã được bind trong hook,
 * component này chỉ render 2 icon button.
 *
 * Usage:
 *   <UndoRedoToolbar
 *     canUndo={canUndo}
 *     canRedo={canRedo}
 *     onUndo={undo}
 *     onRedo={redo}
 *   />
 */
export function UndoRedoToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  className,
  showHint = true,
}: UndoRedoToolbarProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canUndo}
        onClick={onUndo}
        title={showHint ? 'Hoàn tác (Ctrl+Z)' : 'Hoàn tác'}
        aria-label="Hoàn tác"
        className="h-8 w-8"
      >
        <Undo2 size={15} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canRedo}
        onClick={onRedo}
        title={showHint ? 'Làm lại (Ctrl+Y)' : 'Làm lại'}
        aria-label="Làm lại"
        className="h-8 w-8"
      >
        <Redo2 size={15} />
      </Button>
    </div>
  );
}
