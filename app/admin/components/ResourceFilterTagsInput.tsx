'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { AdminImage as Image } from './AdminImage';

interface FilterValueOption {
  _id: Id<'resourceFilterValues'>;
  filterId: Id<'resourceFilters'>;
  name: string;
  slug: string;
  active: boolean;
  icon?: string;
}

interface FilterOption {
  _id: Id<'resourceFilters'>;
  name: string;
  slug: string;
  active: boolean;
}

interface ResourceFilterTagsInputProps {
  activeFilters?: FilterOption[];
  allFilterValues?: FilterValueOption[];
  value: Id<'resourceFilterValues'>[];
  onChange: (value: Id<'resourceFilterValues'>[]) => void;
  placeholder?: string;
}

export function ResourceFilterTagsInput({
  activeFilters = [],
  allFilterValues = [],
  value = [],
  onChange,
  placeholder = 'Tìm và chọn bộ lọc...',
}: ResourceFilterTagsInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedIds = useMemo(() => new Set(value), [value]);
  const valueMap = useMemo(() => new Map(allFilterValues.map((item) => [item._id, item])), [allFilterValues]);
  const selectedValues = useMemo(() => value.map((id) => valueMap.get(id)).filter((item): item is FilterValueOption => Boolean(item)), [value, valueMap]);

  const groupedUnselectedValues = useMemo(() => {
    const queryClean = query.trim().toLowerCase();
    const result: { filter: FilterOption; values: FilterValueOption[] }[] = [];
    activeFilters.forEach((filter) => {
      const values = allFilterValues.filter((item) =>
        item.filterId === filter._id &&
        item.active &&
        !selectedIds.has(item._id) &&
        item.name.toLowerCase().includes(queryClean)
      );
      if (values.length > 0) {
        result.push({ filter, values });
      }
    });
    return result;
  }, [activeFilters, allFilterValues, query, selectedIds]);

  const handleRemove = (id: Id<'resourceFilterValues'>) => {
    onChange(value.filter((item) => item !== id));
  };

  const handleAdd = (id: Id<'resourceFilterValues'>) => {
    onChange([...value, id]);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
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

  const totalFilteredCount = groupedUnselectedValues.reduce((sum, group) => sum + group.values.length, 0);

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <div
        className="flex min-h-[44px] w-full cursor-text flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:border-slate-300 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selectedValues.map((item) => (
          <div
            key={item._id}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            {item.icon ? (
              <div className="relative h-4 w-4 overflow-hidden rounded bg-white">
                <Image src={item.icon} alt={item.name} fill className="object-contain" />
              </div>
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded bg-slate-200 text-slate-400 dark:bg-slate-800">
                <Filter size={10} />
              </div>
            )}
            <span>{item.name}</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleRemove(item._id);
              }}
              className="ml-1 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={selectedValues.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 border-none bg-transparent py-0.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[300px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg dark:border-slate-800 dark:bg-slate-950">
          {query.trim() && (
            <div className="mb-2 flex items-center gap-1.5 rounded bg-slate-50 px-2 py-1.5 text-xs text-slate-500 dark:bg-slate-900">
              <Search size={12} />
              <span>Kết quả tìm kiếm cho &ldquo;{query}&rdquo;</span>
            </div>
          )}
          {totalFilteredCount === 0 && (
            <p className="py-3 text-center text-xs italic text-slate-500">
              {allFilterValues.length === 0 ? 'Chưa có cấu hình bộ lọc' : 'Không có bộ lọc phù hợp hoặc đã chọn hết'}
            </p>
          )}
          <div className="space-y-3">
            {groupedUnselectedValues.map(({ filter, values }) => (
              <div key={filter._id} className="space-y-1">
                <div className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {filter.name}
                </div>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {values.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleAdd(item._id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60"
                    >
                      {item.icon ? (
                        <div className="relative h-4 w-4 overflow-hidden rounded bg-white">
                          <Image src={item.icon} alt={item.name} fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-slate-100 text-slate-400 dark:bg-slate-800">
                          <Filter size={10} />
                        </div>
                      )}
                      <span className="font-medium">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
