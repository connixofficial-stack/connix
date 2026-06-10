'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Input, cn } from '@/app/admin/components/ui';

interface InputWithClearProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function InputWithClear({ 
  value, 
  onChange, 
  placeholder, 
  required = false,
  className,
  autoFocus
}: InputWithClearProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={cn("pr-8", className)}
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}