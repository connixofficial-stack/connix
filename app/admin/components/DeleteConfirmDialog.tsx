import React from 'react';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui';

export type DeleteDependency = {
  label: string;
  count: number;
  preview: { id: string; name: string }[];
  hasMore: boolean;
};

type DeleteConfirmDialogProps = {
  dependencies?: DeleteDependency[];
  isLoading?: boolean;
  itemName: string;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function DeleteConfirmDialog({
  dependencies = [],
  isLoading,
  itemName,
  onConfirm,
  onOpenChange,
  open,
  title,
}: DeleteConfirmDialogProps) {
  const activeDependencies = dependencies.filter((dep) => dep.count > 0);
  const totalCount = activeDependencies.reduce((sum, dep) => sum + dep.count, 0);
  const hasDependencies = activeDependencies.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {hasDependencies
              ? `Hành động này sẽ xóa ${totalCount}${totalCount >= 1000 ? '+' : ''} dữ liệu liên quan.`
              : `Bạn có chắc chắn muốn xóa ${itemName}?`}
          </DialogDescription>
        </DialogHeader>

        {hasDependencies && (
          <div className="space-y-3">
            {activeDependencies.map((dep) => (
              <div key={dep.label} className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>{dep.label}</span>
                  <Badge variant="destructive">{dep.count}{dep.hasMore ? '+' : ''}</Badge>
                </div>
                {dep.preview.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">
                    {dep.preview.map((item) => (
                      <li key={item.id}>• {item.name}</li>
                    ))}
                    {dep.hasMore && (
                      <li className="text-slate-400">... và {Math.max(0, dep.count - dep.preview.length)} mục khác</li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="button" variant="destructive" onClick={() => onConfirm()} disabled={isLoading}>
            {isLoading ? 'Đang xóa...' : hasDependencies ? `Xóa tất cả (${totalCount})` : 'Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
