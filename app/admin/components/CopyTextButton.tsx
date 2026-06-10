'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, cn } from './ui';

export function CopyTextButton({
  value,
  label = 'nội dung',
  successMessage,
  className,
}: {
  value: string;
  label?: string;
  successMessage?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const trimmedValue = value.trim();

  const handleCopy = async () => {
    if (!trimmedValue) {return;}
    try {
      await navigator.clipboard.writeText(trimmedValue);
      setCopied(true);
      toast.success(successMessage ?? `Đã copy ${label}`);
      setTimeout(() => { setCopied(false); }, 2000);
    } catch {
      toast.error('Không thể copy, vui lòng copy thủ công');
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className}
      onClick={handleCopy}
      disabled={!trimmedValue}
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
    </Button>
  );
}

export function CopyableInput({
  copyLabel,
  copySuccessMessage,
  wrapperClassName,
  buttonClassName,
  className,
  value,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  copyLabel: string;
  copySuccessMessage?: string;
  wrapperClassName?: string;
  buttonClassName?: string;
}) {
  return (
    <div className={cn("flex gap-2", wrapperClassName)}>
      <Input
        {...props}
        value={value}
        className={cn("flex-1", className)}
      />
      <CopyTextButton
        value={value}
        label={copyLabel}
        successMessage={copySuccessMessage}
        className={cn("shrink-0", buttonClassName)}
      />
    </div>
  );
}
