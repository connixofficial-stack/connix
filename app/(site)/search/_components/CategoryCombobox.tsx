'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
}

interface CategoryComboboxProps {
  categories?: Category[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  primaryColor?: string;
}

export function CategoryCombobox({
  categories = [],
  value,
  onChange,
  placeholder = 'Tất cả danh mục',
  primaryColor = '#ea580c',
}: CategoryComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = useMemo(() => {
    return categories.find((cat) => cat._id === value) ?? null;
  }, [categories, value]);

  const filteredCategories = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return categories;
    }
    return categories.filter((cat) => cat.name.toLowerCase().includes(keyword));
  }, [categories, query]);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    
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
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-[#f5f5f7] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-zinc-850 min-w-[180px] max-w-[240px] font-medium transition-all hover:bg-slate-50 dark:hover:bg-zinc-800 text-left"
      >
        <span className="truncate mr-2">
          {selectedCategory ? selectedCategory.name : placeholder}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} 
        />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#161617] p-2.5 shadow-xl dark:shadow-2xl animate-in fade-in-50 slide-in-from-top-1 duration-200">
          {/* Search Input Box */}
          <div className="relative mb-2 flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm danh mục..."
              className="w-full bg-slate-50 dark:bg-[#2c2c2e] border-0 rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200/50 dark:focus:ring-zinc-805 transition-all placeholder:text-slate-400 dark:placeholder-zinc-500 text-slate-800 dark:text-[#f5f5f7]"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-[#f5f5f7] rounded-full hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 transition-all"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Categories List */}
          <div className="max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {/* "Tất cả danh mục" Option */}
            {!query.trim() && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setQuery('');
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors font-medium text-left mb-0.5"
                style={!value ? { backgroundColor: primaryColor + '10', color: primaryColor } : undefined}
              >
                <span className="truncate">Tất cả danh mục</span>
                {!value && <Check size={14} className="shrink-0" style={{ color: primaryColor }} />}
              </button>
            )}

            {filteredCategories.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Không tìm thấy danh mục phù hợp
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = value === cat._id;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => {
                      onChange(cat._id);
                      setQuery('');
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors font-medium text-left mb-0.5"
                    style={isSelected ? { backgroundColor: primaryColor + '10', color: primaryColor } : undefined}
                  >
                    <span className="truncate mr-2">{cat.name}</span>
                    {isSelected && <Check size={14} className="shrink-0" style={{ color: primaryColor }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
