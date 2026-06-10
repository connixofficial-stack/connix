import React, { useState } from 'react';
import { Input, Button, cn } from '@/app/admin/components/ui';
import { QuickRoutePickerModal } from '@/app/admin/components/QuickRoutePickerModal';
import { Link2 } from 'lucide-react';

interface QuickRouteInputProps extends React.ComponentProps<typeof Input> {
  value: string;
  onChangeValue: (value: string) => void;
  /** Nếu có, sẽ update cả label khi chọn từ picker */
  onChangeLabelValue?: (label: string) => void;
  inputClassName?: string;
}

export function QuickRouteInput({
  value,
  onChangeValue,
  onChangeLabelValue,
  className,
  inputClassName,
  placeholder = 'Vd: /lien-he',
  ...rest
}: QuickRouteInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div className={cn('flex items-center gap-1', className)}>
        <Input
          {...rest}
          placeholder={placeholder}
          className={cn('h-8 text-xs flex-1 min-w-0', inputClassName)}
          value={value ?? ''}
          onChange={e => onChangeValue(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setPickerOpen(true)}
          className="h-8 w-8 shrink-0 text-slate-400 hover:text-blue-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          title="Chọn link gợi ý"
        >
          <Link2 size={14} />
        </Button>
      </div>
      {pickerOpen && (
        <QuickRoutePickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={option => {
            onChangeValue(option.url);
            onChangeLabelValue?.(option.label);
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}
