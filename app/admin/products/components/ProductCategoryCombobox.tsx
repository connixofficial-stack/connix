'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Input } from '@/app/admin/components/ui';

interface ProductCategory {
  _id: string;
  name: string;
}

interface ProductCategoryComboboxProps {
  categories?: ProductCategory[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  onQuickCreate?: () => void;
}

export function ProductCategoryCombobox({
  categories = [],
  value,
  onChange,
  placeholder = '-- Chọn danh mục --',
  onQuickCreate,
}: ProductCategoryComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = useMemo(() => {
    return categories.find((category) => category._id === value) ?? null;
  }, [categories, value]);

  const filteredCategories = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return categories;
    }
    return categories.filter((category) => category.name.toLowerCase().includes(keyword));
  }, [categories, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="flex gap-2" ref={containerRef}>
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span className="truncate">
            {selectedCategory ? selectedCategory.name : placeholder}
          </span>
          <span className="text-xs text-slate-400">▼</span>
        </button>
        {open && (
          <div className="absolute left-0 right-0 z-50 mt-2 min-w-[240px] rounded-md border border-slate-200 bg-white p-2 shadow-md dark:border-slate-800 dark:bg-slate-900">
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm danh mục..."
              className="mb-2"
            />
            <div className="max-h-52 overflow-auto">
              {filteredCategories.length === 0 && (
                <div className="px-2 py-2 text-xs text-slate-500">Không tìm thấy danh mục phù hợp.</div>
              )}
              {filteredCategories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => {
                    onChange(category._id);
                    setQuery('');
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>{category.name}</span>
                  {value === category._id && <span className="text-xs text-slate-400">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {onQuickCreate && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onQuickCreate}
          title="Tạo danh mục mới"
        >
          <Plus size={16} />
        </Button>
      )}
    </div>
  );
}
