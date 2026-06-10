'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Filter, Search } from 'lucide-react';
import { AdminImage as Image } from './AdminImage';
import { Id } from '@/convex/_generated/dataModel';

interface FilterValueOption {
  _id: Id<'courseFilterValues'>;
  filterId: Id<'courseFilters'>;
  name: string;
  slug: string;
  active: boolean;
  icon?: string;
}

interface FilterOption {
  _id: Id<'courseFilters'>;
  name: string;
  slug: string;
  active: boolean;
}

interface CourseFilterTagsInputProps {
  activeFilters?: FilterOption[];
  allFilterValues?: FilterValueOption[];
  value: Id<'courseFilterValues'>[];
  onChange: (value: Id<'courseFilterValues'>[]) => void;
  placeholder?: string;
}

export function CourseFilterTagsInput({
  activeFilters = [],
  allFilterValues = [],
  value = [],
  onChange,
  placeholder = 'Tìm và chọn phần mềm...',
}: CourseFilterTagsInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedIds = useMemo(() => new Set(value), [value]);

  // Map values by ID for fast lookup
  const valueMap = useMemo(() => {
    return new Map(allFilterValues.map((v) => [v._id, v]));
  }, [allFilterValues]);

  // Selected values
  const selectedValues = useMemo(() => {
    return value
      .map((id) => valueMap.get(id))
      .filter((v): v is FilterValueOption => Boolean(v));
  }, [value, valueMap]);

  // Group unselected values by filter group
  const groupedUnselectedValues = useMemo(() => {
    const queryClean = query.trim().toLowerCase();
    const result: { filter: FilterOption; values: FilterValueOption[] }[] = [];

    activeFilters.forEach((filter) => {
      // Find children values of this filter that are active, not selected yet, and match the query
      const matchValues = allFilterValues.filter(
        (v) =>
          v.filterId === filter._id &&
          v.active &&
          !selectedIds.has(v._id) &&
          v.name.toLowerCase().includes(queryClean)
      );

      if (matchValues.length > 0) {
        result.push({
          filter,
          values: matchValues,
        });
      }
    });

    return result;
  }, [activeFilters, allFilterValues, selectedIds, query]);

  const handleRemove = (id: Id<'courseFilterValues'>) => {
    onChange(value.filter((item) => item !== id));
  };

  const handleAdd = (id: Id<'courseFilterValues'>) => {
    onChange([...value, id]);
    setQuery('');
    // Keep focus to allow selecting more
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Click outside listener
  useEffect(() => {
    if (!open) return;
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

  const totalFilteredCount = useMemo(() => {
    return groupedUnselectedValues.reduce((acc, curr) => acc + curr.values.length, 0);
  }, [groupedUnselectedValues]);

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <div
        className="flex min-h-[44px] w-full flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:border-indigo-400 dark:focus-within:ring-indigo-400 dark:hover:border-slate-700 cursor-text"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selectedValues.map((val) => (
          <div
            key={val._id}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            {val.icon ? (
              <div className="relative h-4 w-4 overflow-hidden rounded bg-white">
                <Image src={val.icon} alt={val.name} fill className="object-contain" />
              </div>
            ) : (
              <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Filter size={10} />
              </div>
            )}
            <span>{val.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(val._id);
              }}
              className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder={selectedValues.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 border-none bg-transparent py-0.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-[300px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg dark:border-slate-800 dark:bg-slate-950">
          {query.trim() && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2 rounded bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
              <Search size={12} />
              <span>Kết quả tìm kiếm cho &ldquo;{query}&rdquo;</span>
            </div>
          )}

          {totalFilteredCount === 0 && (
            <p className="text-xs text-center text-slate-500 py-3 italic">
              {allFilterValues.length === 0
                ? 'Chưa có cấu hình phần mềm'
                : 'Không có phần mềm nào phù hợp hoặc đã chọn hết'}
            </p>
          )}

          <div className="space-y-3">
            {groupedUnselectedValues.map(({ filter, values }) => (
              <div key={filter._id} className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-0.5 tracking-wider">
                  {filter.name}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {values.map((val) => (
                    <button
                      key={val._id}
                      type="button"
                      onClick={() => handleAdd(val._id)}
                      className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60 transition-colors"
                    >
                      {val.icon ? (
                        <div className="relative h-4 w-4 overflow-hidden rounded bg-white">
                          <Image src={val.icon} alt={val.name} fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <Filter size={10} />
                        </div>
                      )}
                      <span className="font-medium">{val.name}</span>
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
