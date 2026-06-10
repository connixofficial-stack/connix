'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, cn } from '../../../components/ui';

interface FormFieldsSelectorProps {
  selected: string[];
  onChange: (fields: string[]) => void;
}

const FIELD_OPTIONS = [
  { value: 'name', label: 'Tên' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Số điện thoại' },
  { value: 'subject', label: 'Chủ đề' },
  { value: 'message', label: 'Tin nhắn' },
];

export function FormFieldsSelector({ selected, onChange }: FormFieldsSelectorProps) {
  const [draggedValue, setDraggedValue] = useState<string | null>(null);
  const [dragOverValue, setDragOverValue] = useState<string | null>(null);
  const availableFields = useMemo(() => FIELD_OPTIONS.filter((option) => !selected.includes(option.value)), [selected]);
  const [nextField, setNextField] = useState(availableFields[0]?.value ?? '');

  useEffect(() => {
    setNextField(availableFields[0]?.value ?? '');
  }, [availableFields]);

  const addField = () => {
    if (!nextField) {return;}
    onChange([...selected, nextField]);
  };

  const removeField = (fieldValue: string) => {
    if (selected.length <= 1) {return;}
    onChange(selected.filter((field) => field !== fieldValue));
  };

  const updateField = (currentValue: string, nextValue: string) => {
    if (currentValue === nextValue) {return;}
    onChange(selected.map((field) => (field === currentValue ? nextValue : field)));
  };

  const handleDragStart = (value: string) => { setDraggedValue(value); };
  const handleDragEnd = () => { setDraggedValue(null); setDragOverValue(null); };
  const handleDragOver = (event: React.DragEvent, value: string) => {
    event.preventDefault();
    if (draggedValue !== value) {setDragOverValue(value);}
  };
  const handleDrop = (event: React.DragEvent, targetValue: string) => {
    event.preventDefault();
    if (!draggedValue || draggedValue === targetValue) {return;}
    const nextFields = [...selected];
    const draggedIndex = nextFields.indexOf(draggedValue);
    const targetIndex = nextFields.indexOf(targetValue);
    const [moved] = nextFields.splice(draggedIndex, 1);
    nextFields.splice(targetIndex, 0, moved);
    onChange(nextFields);
    setDraggedValue(null);
    setDragOverValue(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Các trường trong form
      </label>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Kéo thả để sắp xếp thứ tự.</p>
        <div className="flex items-center gap-2">
          <select
            value={nextField}
            onChange={(event) => { setNextField(event.target.value); }}
            className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            disabled={availableFields.length === 0}
          >
            {availableFields.length === 0 ? (
              <option value="">Đã đủ trường</option>
            ) : (
              availableFields.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))
            )}
          </select>
          <Button type="button" variant="outline" size="sm" onClick={addField} disabled={!nextField}>
            <Plus size={14} className="mr-1" /> Thêm trường
          </Button>
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-4 py-6 text-center">
          <p className="text-sm text-slate-500">Chưa chọn trường nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selected.map((value) => {
            const option = FIELD_OPTIONS.find((item) => item.value === value);
            const isDisabled = selected.length === 1;

            return (
              <div
                key={value}
                draggable
                onDragStart={() => { handleDragStart(value); }}
                onDragEnd={handleDragEnd}
                onDragOver={(event) => { handleDragOver(event, value); }}
                onDrop={(event) => { handleDrop(event, value); }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  draggedValue === value && 'opacity-50',
                  dragOverValue === value && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20',
                  'border-slate-200 dark:border-slate-700'
                )}
              >
                <GripVertical size={16} className="text-slate-400 cursor-grab flex-shrink-0" />
                <select
                  value={value}
                  onChange={(event) => { updateField(value, event.target.value); }}
                  className="h-9 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                >
                  {FIELD_OPTIONS.map((field) => (
                    <option
                      key={field.value}
                      value={field.value}
                      disabled={selected.some((item) => item === field.value && item !== value)}
                    >
                      {field.label}
                    </option>
                  ))}
                </select>
                <div className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                  {option?.label ?? value}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { removeField(value); }}
                  disabled={isDisabled}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Phải chọn ít nhất 1 trường
      </p>
    </div>
  );
}
