'use client';

import React from 'react';
import type { ContactStyle } from '../_types';
import { TEXT_FIELDS } from '../_lib/constants';

interface DynamicTextFieldsProps {
  style: ContactStyle;
  texts: Record<string, string>;
  onChange: (texts: Record<string, string>) => void;
}

export function DynamicTextFields({ style, texts, onChange }: DynamicTextFieldsProps) {
  const fields = TEXT_FIELDS[style];

  const handleChange = (key: string, value: string) => {
    onChange({
      ...texts,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label
            htmlFor={`text-field-${field.key}`}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            {field.label}
          </label>
          <input
            id={`text-field-${field.key}`}
            type="text"
            value={texts[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      ))}
    </div>
  );
}
