'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { ContactIconOption } from '../_lib/iconOptions';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, cn } from '../../../components/ui';

interface IconPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onSelect: (value: string) => void;
  options: ContactIconOption[];
}

export function IconPickerDialog({ open, onOpenChange, value, onSelect, options }: IconPickerDialogProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {return options;}
    return options.filter((option) => (
      option.label.toLowerCase().includes(keyword)
      || option.value.toLowerCase().includes(keyword)
    ));
  }, [options, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Chọn icon</DialogTitle>
          <DialogDescription>Chọn từ bộ 100 icon Lucide.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={query}
            onChange={(event) => { setQuery(event.target.value); }}
            placeholder="Tìm theo tên icon..."
          />

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 max-h-[60vh] overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="text-sm text-slate-500">Không tìm thấy icon phù hợp.</div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        onSelect(option.value);
                        onOpenChange(false);
                      }}
                      className={cn(
                        'h-10 w-10',
                        isSelected && 'border-blue-500 ring-2 ring-blue-200'
                      )}
                      title={option.label}
                      aria-label={option.label}
                    >
                      <option.Icon size={18} className="text-slate-700 dark:text-slate-200" />
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
