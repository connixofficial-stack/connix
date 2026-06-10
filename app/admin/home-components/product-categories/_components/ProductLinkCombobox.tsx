'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/app/admin/components/ui';

interface ProductOption {
  _id: string;
  name: string;
  slug: string;
}

interface ProductLinkComboboxProps {
  products?: ProductOption[];
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
}

export function ProductLinkCombobox({
  products = [],
  value,
  onChange,
  placeholder = '-- Chọn sản phẩm --',
}: ProductLinkComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === value) ?? null,
    [products, value]
  );

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.slug}`.toLowerCase().includes(keyword)
    );
  }, [products, query]);

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
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <span className="truncate">
          {selectedProduct ? `${selectedProduct.name} (${selectedProduct.slug})` : placeholder}
        </span>
        <span className="text-xs text-slate-400">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-md border border-slate-200 bg-white p-2 shadow-md dark:border-slate-800 dark:bg-slate-900">
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm sản phẩm..."
            className="mb-2"
          />
          <div className="max-h-56 overflow-auto">
            {filteredProducts.length === 0 && (
              <div className="px-2 py-2 text-xs text-slate-500">Không tìm thấy sản phẩm phù hợp.</div>
            )}
            {filteredProducts.map((product) => (
              <button
                key={product._id}
                type="button"
                onClick={() => {
                  onChange(product._id);
                  setQuery('');
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="min-w-0">
                  <span className="block truncate">{product.name}</span>
                  <span className="block text-xs text-slate-400">{product.slug}</span>
                </span>
                {value === product._id && <span className="text-xs text-slate-400">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
