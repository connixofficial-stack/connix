'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { BookOpen, Briefcase, FileText, History, Package, Search, X } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import type { MenuColors } from './header/colors';

type SuggestionItem = {
  id: string;
  title: string;
  thumbnail?: string | null;
  type: 'post' | 'product' | 'service' | 'course' | 'resource';
  url: string;
};

type SuggestionGroup = {
  items: SuggestionItem[];
  total: number;
};

type AutocompleteResult = {
  posts: SuggestionGroup;
  products: SuggestionGroup;
  services: SuggestionGroup;
  courses: SuggestionGroup;
  resources: SuggestionGroup;
};

export type HeaderSearchAutocompleteProps = {
  placeholder?: string;
  tokens: MenuColors;
  searchProducts: boolean;
  searchPosts: boolean;
  searchServices: boolean;
  searchCourses?: boolean;
  searchResources?: boolean;
  className?: string;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  buttonClassName?: string;
  showButton?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

export function HeaderSearchAutocomplete({
  placeholder,
  tokens,
  searchProducts,
  searchPosts,
  searchServices,
  searchCourses = false,
  searchResources = false,
  className,
  inputClassName,
  inputStyle,
  buttonClassName,
  showButton = true,
  disabled = false,
  autoFocus = false,
}: HeaderSearchAutocompleteProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [locale, setLocale] = useState('vi');

  // Đồng bộ lịch sử tìm kiếm gần đây từ localStorage
  useEffect(() => {
    const stored = localStorage.getItem('site_recent_queries');
    if (stored) {
      try {
        setRecentQueries(JSON.parse(stored));
      } catch (e) {
        console.error('Lỗi khi parse lịch sử tìm kiếm:', e);
      }
    }

    // Đọc locale của trình duyệt/localStorage một cách an toàn
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('system-locale') || localStorage.getItem('locale') || 'vi';
      setLocale(saved);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

  const canSearch = searchProducts || searchPosts || searchServices || searchCourses || searchResources;
  const shouldSearch = !disabled && debouncedQuery.length >= 1 && canSearch;

  const results = useQuery(api.search.autocomplete, shouldSearch
    ? {
      query: debouncedQuery,
      searchPosts,
      searchProducts,
      searchServices,
      searchCourses,
      searchResources,
      limit: 5,
    }
    : 'skip');

  const isLoading = shouldSearch && results === undefined;
  const data = results as AutocompleteResult | undefined;

  const sections = useMemo(() => ([
    { key: 'products', label: 'Sản phẩm', icon: Package, items: data?.products?.items ?? [], total: data?.products?.total ?? 0 },
    { key: 'posts', label: 'Bài viết', icon: FileText, items: data?.posts?.items ?? [], total: data?.posts?.total ?? 0 },
    { key: 'services', label: 'Dịch vụ', icon: Briefcase, items: data?.services?.items ?? [], total: data?.services?.total ?? 0 },
    { key: 'courses', label: 'Khóa học', icon: BookOpen, items: data?.courses?.items ?? [], total: data?.courses?.total ?? 0 },
    { key: 'resources', label: 'Tài nguyên', icon: FileText, items: data?.resources?.items ?? [], total: data?.resources?.total ?? 0 },
  ]), [data?.courses, data?.posts, data?.products, data?.resources, data?.services]);

  const hasResults = sections.some(section => section.items.length > 0);
  
  const showRecent = isOpen && !disabled && query.trim() === '' && recentQueries.length > 0;
  const showDropdown = isOpen && !disabled && (shouldSearch || (query.trim() === '' && recentQueries.length > 0));

  const addToRecentQueries = (q: string) => {
    setRecentQueries((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== q.toLowerCase());
      const updated = [q, ...filtered].slice(0, 5);
      localStorage.setItem('site_recent_queries', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromRecentQueries = (q: string) => {
    setRecentQueries((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== q.toLowerCase());
      localStorage.setItem('site_recent_queries', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubmit = (targetValue?: string) => {
    const value = (targetValue ?? query).trim();
    if (!value) {
      return;
    }
    addToRecentQueries(value);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const handleSelect = (item: SuggestionItem) => {
    setIsOpen(false);
    router.push(item.url);
  };

  const dropdownStyle: React.CSSProperties = {
    backgroundColor: tokens.dropdownBg,
    borderColor: tokens.dropdownBorder,
    '--menu-search-hover-bg': tokens.dropdownItemHoverBg,
    '--menu-search-hover-text': tokens.dropdownItemHoverText,
  } as React.CSSProperties;

  const recentTitle = locale === 'en' ? 'Recent Searches' : 'Tìm kiếm gần đây';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onFocus={() => { if (!disabled) { setIsOpen(true); } }}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder ?? 'Tìm kiếm...'}
        disabled={disabled}
        className={cn('w-full', inputClassName)}
        style={inputStyle}
      />
      {!disabled && query.trim().length > 0 && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setDebouncedQuery('');
            setIsOpen(false);
            inputRef.current?.focus();
          }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors flex items-center justify-center hover:bg-slate-100/80 dark:hover:bg-slate-800/80 z-10",
            showButton ? "right-8" : "right-3"
          )}
          style={{ color: tokens.textSubtle }}
          aria-label="Xóa tìm kiếm"
        >
          <X size={12} />
        </button>
      )}
      {showButton && (
        <button
          type="button"
          onClick={() => handleSubmit()}
          className={buttonClassName}
          style={{ backgroundColor: tokens.searchButtonBg, color: tokens.searchButtonText }}
        >
          <Search size={14} />
        </button>
      )}
      {showDropdown && (
        <div
          className="absolute left-0 md:left-auto right-0 mt-2 w-full md:w-[380px] rounded-xl border z-50 overflow-hidden shadow-2xl animate-in fade-in-50 slide-in-from-top-1 duration-200"
          style={dropdownStyle}
        >
          {/* Render Lịch sử tìm kiếm gần đây */}
          {showRecent && (
            <div className="py-2">
              <div
                className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between"
                style={{ color: tokens.dropdownSectionLabel }}
              >
                <span>{recentTitle}</span>
              </div>
              <div className="space-y-0.5">
                {recentQueries.map((item) => (
                  <div
                    key={item}
                    onClick={() => {
                      setQuery(item);
                      handleSubmit(item);
                    }}
                    className="w-full group flex items-center justify-between px-4 py-2 transition-colors cursor-pointer text-left hover:bg-[var(--menu-search-hover-bg)] hover:text-[var(--menu-search-hover-text)]"
                    style={{ color: tokens.dropdownItemText }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <History
                        size={14}
                        className="text-slate-400 group-hover:text-[var(--menu-search-hover-text)] transition-colors shrink-0"
                      />
                      <span className="text-sm font-medium truncate">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromRecentQueries(item);
                      }}
                      className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                      title={locale === 'vi' ? 'Xóa lịch sử' : 'Remove history'}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render autocomplete tìm kiếm */}
          {!showRecent && isLoading && (
            <div className="px-4 py-3 text-sm" style={{ color: tokens.textSubtle }}>Đang tìm kiếm...</div>
          )}
          {!showRecent && !isLoading && !hasResults && (
            <div className="px-4 py-3 text-sm" style={{ color: tokens.textSubtle }}>Không có kết quả phù hợp.</div>
          )}
          {!showRecent && !isLoading && hasResults && (
            <div className="py-2">
              {sections.map((section) => (
                section.items.length > 0 ? (
                  <div key={section.key} className="pb-2 last:pb-0">
                    <div
                      className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between"
                      style={{ color: tokens.dropdownSectionLabel }}
                    >
                      <span>{section.label}</span>
                      <span className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded px-1.5 py-0.5 tracking-normal normal-case">
                        Hiển thị {section.items.length} / {section.total} kết quả
                      </span>
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = section.icon;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => { handleSelect(item); }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-[var(--menu-search-hover-bg)] hover:text-[var(--menu-search-hover-text)]"
                            style={{ color: tokens.dropdownItemText }}
                          >
                            <div
                              className="relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                              style={{ backgroundColor: tokens.surfaceMuted }}
                            >
                              {item.thumbnail ? (
                                <Image mode="thumb" src={item.thumbnail} alt={item.title} width={36} height={36} className="h-full w-full object-cover" />
                              ) : (
                                <Icon size={16} style={{ color: tokens.textSubtle }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: tokens.textPrimary }}>{item.title}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          )}
          {!showRecent && hasResults && (
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="w-full border-t border-slate-100 bg-slate-50/80 hover:bg-slate-100/80 px-4 py-3 text-[11px] text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5 font-semibold text-center mt-1"
              style={{ color: tokens.textSubtle }}
            >
              <span>
                Nhấp vào đây hoặc nhấn <Search size={11} className="inline-block text-slate-500 align-middle -mt-0.5 mx-0.5 shrink-0" /> để xem đầy đủ kết quả cho "{query}"
              </span>
              <span className="text-slate-400">→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
