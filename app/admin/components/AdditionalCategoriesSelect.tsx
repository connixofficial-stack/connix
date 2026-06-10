'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Input } from './ui';

interface CategoryOption {
  _id: string;
  name: string;
}

interface CategoryTagsInputProps {
  categories?: CategoryOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  onQuickCreate?: () => void;
  placeholder?: string;
}

export function CategoryTagsInput({
  categories = [],
  value,
  onChange,
  onQuickCreate,
  placeholder = 'Tìm và chọn danh mục...',
}: CategoryTagsInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(8);
  const selectedIds = new Set(value);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category._id, category])), [categories]);
  const selectedCategories = value.map((id) => categoryMap.get(id)).filter((item): item is CategoryOption => Boolean(item));

  const allFilteredCategories = useMemo(() => {
    return categories
      .filter((category) => !selectedIds.has(category._id))
      .filter((category) => category.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [categories, selectedIds, query]);

  const filteredCategories = useMemo(() => {
    return allFilteredCategories.slice(0, limit);
  }, [allFilteredCategories, limit]);

  useEffect(() => {
    setLimit(8);
  }, [query]);

  const removeCategory = (id: string) => onChange(value.filter((item) => item !== id));
  const addCategory = (id: string) => {
    onChange([...value, id]);
    setQuery('');
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {return;}
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
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const openDropdown = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex gap-2">
        <div
          className="flex min-h-[42px] flex-1 flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-2 focus-within:border-transparent focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
          onClick={openDropdown}
        >
          {selectedCategories.map((category, index) => (
            <span
              key={category._id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
            >
              {category.name}
              {index === 0 && <span className="text-[10px] uppercase tracking-wide text-blue-500">Chính</span>}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeCategory(category._id);
                }}
                className="rounded-full p-0.5 transition-colors hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            placeholder={selectedCategories.length === 0 ? placeholder : 'Tìm danh mục...'}
            className="min-w-[140px] flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
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
      {open && (
        <div className="max-h-52 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm danh mục..."
            className="mb-1"
          />
          {filteredCategories.length === 0 && (
            <div className="px-2 py-2 text-xs text-slate-500">Không còn danh mục phù hợp.</div>
          )}
          <div className="space-y-0.5">
            {filteredCategories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() => addCategory(category._id)}
                className="flex w-full rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {category.name}
              </button>
            ))}
          </div>
          {allFilteredCategories.length > limit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLimit((prev) => prev + 12);
              }}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-200 bg-slate-50/50 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Xem thêm (còn {allFilteredCategories.length - limit} danh mục khác)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
