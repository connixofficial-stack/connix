import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from './ui';

type BulkDeleteConfirmDialogProps = {
  confirmKeyword?: string;
  description: string;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function BulkDeleteConfirmDialog({
  confirmKeyword = 'XOA',
  description,
  isLoading,
  onConfirm,
  onOpenChange,
  open,
  title,
}: BulkDeleteConfirmDialogProps) {
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (!open) {
      setKeywordInput('');
    }
  }, [open]);

  const normalizedInput = keywordInput.trim().toUpperCase();
  const normalizedKeyword = confirmKeyword.trim().toUpperCase();
  const isConfirmed = normalizedInput === normalizedKeyword;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            Nhập <span className="font-semibold text-slate-900">{confirmKeyword}</span> để xác nhận.
          </p>
          <Input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder={`Nhập ${confirmKeyword}`}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirm()}
            disabled={!isConfirmed || isLoading}
          >
            {isLoading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
