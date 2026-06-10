import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/app/admin/components/ui';

interface FactoryResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
  isLoading: boolean;
  progress: null | {
    current: number;
    label: string;
    total: number;
  };
}

export function FactoryResetDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  progress,
}: FactoryResetDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep(1);
      setConfirmText('');
    }
    onOpenChange(nextOpen);
  };

  const isValidConfirm = useMemo(() => {
    return confirmText.trim().toLowerCase() === 'chac chan';
  }, [confirmText]);

  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={18} /> Factory Reset
          </DialogTitle>
          <DialogDescription>
            Hành động này sẽ xóa sạch toàn bộ dữ liệu trong hệ thống. Không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>Bạn chắc chắn muốn tiếp tục?</p>
            <p className="text-rose-600 font-medium">Tất cả bảng dữ liệu sẽ bị xóa sạch.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Nhập <span className="font-semibold text-rose-600">CHAC CHAN</span> để xác nhận.
            </p>
            <Input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="CHAC CHAN"
              className="uppercase"
              disabled={isLoading}
            />
          </div>
        )}

        {progress && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 text-sm">
            <p className="text-xs uppercase text-slate-500">Tiến trình</p>
            <p className="mt-1 text-slate-700 dark:text-slate-200">{progress.label}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{progress.current}/{progress.total}</span>
              <span>{Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-2 rounded-full bg-rose-500 transition-all"
                style={{ width: `${Math.min(100, (progress.current / Math.max(progress.total, 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          {step === 1 ? (
            <Button type="button" variant="destructive" onClick={() => setStep(2)}>
              Tiếp tục
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isValidConfirm || isLoading}
            >
              Xóa sạch
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
