'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { Briefcase, FileText, History, LayoutGrid, Package, Search, Users, X } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { cn } from './ui';

type MenuSuggestion = {
  id: string;
  title: string;
  href: string;
  keywords: string[];
};

type SuggestionItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ElementType;
  kind: 'menu' | 'posts' | 'products' | 'services' | 'users';
};

type SuggestionSection = {
  key: string;
  label: string;
  items: SuggestionItem[];
};

type RecentSearchItem = Omit<SuggestionItem, 'icon'>;

const ADMIN_RECENT_SEARCHES_KEY = 'admin_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const SUGGESTION_KIND_ICONS: Record<SuggestionItem['kind'], React.ElementType> = {
  menu: LayoutGrid,
  posts: FileText,
  products: Package,
  services: Briefcase,
  users: Users,
};

const ADMIN_MENU_ITEMS: MenuSuggestion[] = [
  { id: 'dashboard', title: 'Tổng quan', href: '/admin/dashboard', keywords: ['dashboard', 'tong quan', 'home'] },
  { id: 'posts', title: 'Bài viết', href: '/admin/posts', keywords: ['bai viet', 'posts', 'noi dung'] },
  { id: 'post-categories', title: 'Danh mục bài viết', href: '/admin/post-categories', keywords: ['danh muc bai viet', 'category post'] },
  { id: 'comments', title: 'Bình luận', href: '/admin/comments', keywords: ['binh luan', 'comment'] },
  { id: 'services', title: 'Dịch vụ', href: '/admin/services', keywords: ['dich vu', 'service'] },
  { id: 'service-categories', title: 'Danh mục dịch vụ', href: '/admin/service-categories', keywords: ['danh muc dich vu', 'service category'] },
  { id: 'products', title: 'Sản phẩm', href: '/admin/products', keywords: ['san pham', 'product'] },
  { id: 'product-categories', title: 'Danh mục sản phẩm', href: '/admin/categories', keywords: ['danh muc san pham', 'category'] },
  { id: 'orders', title: 'Đơn hàng', href: '/admin/orders', keywords: ['don hang', 'order'] },
  { id: 'customers', title: 'Khách hàng', href: '/admin/customers', keywords: ['khach hang', 'customer'] },
  { id: 'users', title: 'Người dùng', href: '/admin/users', keywords: ['nguoi dung', 'user'] },
  { id: 'roles', title: 'Phân quyền', href: '/admin/roles', keywords: ['phan quyen', 'roles'] },
  { id: 'menus', title: 'Website', href: '/admin/menus', keywords: ['website', 'menu'] },
  { id: 'home-components', title: 'Giao diện trang chủ', href: '/admin/home-components', keywords: ['giao dien', 'homepage'] },
  { id: 'trust-pages', title: 'Trang tin cậy', href: '/admin/trust-pages', keywords: ['trust pages', 'trang tin cay', 'chinh sach', 'policy', 'bao mat', 'dieu khoan'] },
  { id: 'media', title: 'Thư viện Media', href: '/admin/media', keywords: ['media', 'thu vien'] },
  { id: 'settings', title: 'Cài đặt', href: '/admin/settings', keywords: ['cai dat', 'settings'] },
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function scoreMatch(text: string, query: string) {
  if (!query) {
    return 0;
  }

  const target = normalizeText(text);
  const q = normalizeText(query);

  if (!target || !q) {
    return -1;
  }

  if (target === q) {
    return 100;
  }

  if (target.startsWith(q)) {
    return 80;
  }

  const includesIndex = target.indexOf(q);
  if (includesIndex >= 0) {
    return 60 - Math.min(includesIndex, 20);
  }

  let cursor = 0;
  for (const char of q) {
    const pos = target.indexOf(char, cursor);
    if (pos < 0) {
      return -1;
    }
    cursor = pos + 1;
  }

  return 20;
}

function isSuggestionKind(value: unknown): value is SuggestionItem['kind'] {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SUGGESTION_KIND_ICONS, value);
}

function isRecentSearchItem(value: unknown): value is RecentSearchItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<Record<keyof RecentSearchItem, unknown>>;
  return (
    typeof item.id === 'string'
    && typeof item.title === 'string'
    && (typeof item.subtitle === 'string' || item.subtitle === undefined)
    && typeof item.href === 'string'
    && isSuggestionKind(item.kind)
  );
}

function toRecentSearchItem(item: SuggestionItem): RecentSearchItem {
  return {
    href: item.href,
    id: item.id,
    kind: item.kind,
    subtitle: item.subtitle,
    title: item.title,
  };
}

function restoreRecentSearchItem(item: RecentSearchItem): SuggestionItem {
  return {
    ...item,
    icon: SUGGESTION_KIND_ICONS[item.kind],
  };
}

export function AdminHeaderSearchAutocomplete(): React.ReactElement {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<SuggestionItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_RECENT_SEARCHES_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter(isRecentSearchItem).map(restoreRecentSearchItem));
      }
    } catch (error) {
      console.error('Lỗi khi parse lịch sử tìm kiếm admin:', error);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const shouldSearch = debouncedQuery.length >= 1;

  const contentResults = useQuery(
    api.search.autocomplete,
    shouldSearch
      ? {
        query: debouncedQuery,
        searchPosts: true,
        searchProducts: true,
        searchServices: true,
        limit: 4,
      }
      : 'skip'
  );

  const usersResults = useQuery(
    api.users.listAdminWithOffset,
    shouldSearch
      ? {
        limit: 4,
        offset: 0,
        search: debouncedQuery,
      }
      : 'skip'
  );

  const menuSuggestions = useMemo(() => {
    if (!debouncedQuery) {
      return [] as SuggestionItem[];
    }

    return ADMIN_MENU_ITEMS
      .map((item) => {
        const titleScore = scoreMatch(item.title, debouncedQuery);
        const keywordScore = Math.max(...item.keywords.map((keyword) => scoreMatch(keyword, debouncedQuery)));
        return { item, score: Math.max(titleScore, keywordScore) };
      })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ item }) => ({
        id: `menu-${item.id}`,
        title: item.title,
        subtitle: 'Mở trang quản trị',
        href: item.href,
        icon: LayoutGrid,
        kind: 'menu' as const,
      }));
  }, [debouncedQuery]);

  const dataSections = useMemo(() => {
    const results = contentResults as {
      posts?: { items: Array<{ id: string; title: string }>; total: number };
      products?: { items: Array<{ id: string; title: string }>; total: number };
      services?: { items: Array<{ id: string; title: string }>; total: number };
    } | undefined;

    const postItems: SuggestionItem[] = [
      {
        id: 'posts-list',
        title: 'Xem tất cả bài viết',
        subtitle: 'Danh sách bài viết',
        href: '/admin/posts',
        icon: FileText,
        kind: 'posts',
      },
      ...((results?.posts?.items ?? []).map((post) => ({
        id: `post-${post.id}`,
        title: post.title,
        subtitle: 'Sửa bài viết',
        href: `/admin/posts/${post.id}/edit`,
        icon: FileText,
        kind: 'posts' as const,
      }))),
    ];

    const productItems: SuggestionItem[] = [
      {
        id: 'products-list',
        title: 'Xem tất cả sản phẩm',
        subtitle: 'Danh sách sản phẩm',
        href: '/admin/products',
        icon: Package,
        kind: 'products',
      },
      ...((results?.products?.items ?? []).map((product) => ({
        id: `product-${product.id}`,
        title: product.title,
        subtitle: 'Sửa sản phẩm',
        href: `/admin/products/${product.id}/edit`,
        icon: Package,
        kind: 'products' as const,
      }))),
    ];

    const serviceItems: SuggestionItem[] = [
      {
        id: 'services-list',
        title: 'Xem tất cả dịch vụ',
        subtitle: 'Danh sách dịch vụ',
        href: '/admin/services',
        icon: Briefcase,
        kind: 'services',
      },
      ...((results?.services?.items ?? []).map((service) => ({
        id: `service-${service.id}`,
        title: service.title,
        subtitle: 'Sửa dịch vụ',
        href: `/admin/services/${service.id}/edit`,
        icon: Briefcase,
        kind: 'services' as const,
      }))),
    ];

    const userItems: SuggestionItem[] = [
      {
        id: 'users-list',
        title: 'Xem tất cả người dùng',
        subtitle: 'Danh sách người dùng',
        href: '/admin/users',
        icon: Users,
        kind: 'users',
      },
      ...((usersResults ?? []).map((user) => ({
        id: `user-${user._id}`,
        title: user.name,
        subtitle: `Sửa người dùng • ${user.email}`,
        href: `/admin/users/${user._id}/edit`,
        icon: Users,
        kind: 'users' as const,
      }))),
    ];

    return [
      { key: 'posts', label: 'Bài viết', items: postItems },
      { key: 'products', label: 'Sản phẩm', items: productItems },
      { key: 'services', label: 'Dịch vụ', items: serviceItems },
      { key: 'users', label: 'Người dùng', items: userItems },
    ] satisfies SuggestionSection[];
  }, [contentResults, usersResults]);

  const sections = useMemo(() => {
    const menuSection: SuggestionSection = {
      key: 'menu',
      label: 'Menu quản trị',
      items: menuSuggestions,
    };

    return [
      menuSection,
      ...dataSections,
    ].filter((section) => section.items.length > 0 || section.key !== 'menu');
  }, [dataSections, menuSuggestions]);

  const showRecent = query.trim() === '' && recentSearches.length > 0;
  const flatItems = useMemo(() => {
    if (showRecent) {
      return recentSearches;
    }

    return sections.flatMap((section) => section.items);
  }, [recentSearches, sections, showRecent]);
  const visibleSections = showRecent ? [] : sections;
  const hasResults = flatItems.length > 0;
  const isLoading = shouldSearch && !showRecent && (contentResults === undefined || usersResults === undefined);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery, showRecent]);

  useEffect(() => {
    if (!hasResults) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex > flatItems.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, flatItems.length, hasResults]);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const addToRecentSearches = (item: SuggestionItem) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((recentItem) => recentItem.href !== item.href);
      const updated = [item, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(ADMIN_RECENT_SEARCHES_KEY, JSON.stringify(updated.map(toRecentSearchItem)));
      return updated;
    });
  };

  const removeFromRecentSearches = (href: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.href !== href);
      localStorage.setItem(ADMIN_RECENT_SEARCHES_KEY, JSON.stringify(updated.map(toRecentSearchItem)));
      if (activeIndex >= updated.length && updated.length > 0) {
        setActiveIndex(updated.length - 1);
      }
      return updated;
    });
  };

  const handleSelect = (item: SuggestionItem) => {
    addToRecentSearches(item);
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    setActiveIndex(0);
    router.push(item.href);
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    setActiveIndex(0);
  };

  const handleSubmit = () => {
    if (hasResults) {
      const target = flatItems[activeIndex] ?? flatItems[0];
      if (target) {
        handleSelect(target);
      }
      return;
    }

    if (debouncedQuery) {
      handleNavigate('/admin/dashboard');
    }
  };

  return (
    <div ref={containerRef} className="relative w-64 lg:w-72">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={query}
        onFocus={() => {
          if (query.trim() || recentSearches.length > 0) {
            setIsOpen(true);
          }
        }}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          setIsOpen(Boolean(value.trim()) || recentSearches.length > 0);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              return;
            }
            if (flatItems.length > 0) {
              setActiveIndex((prev) => (prev + 1) % flatItems.length);
            }
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (flatItems.length > 0) {
              setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
            }
          }

          if (event.key === 'Escape') {
            setIsOpen(false);
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Tìm nhanh menu, list, edit..."
        className="h-9 w-full rounded-full border border-transparent bg-slate-100 py-1.5 pl-9 pr-10 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-800 dark:text-slate-200"
      />
      {query.trim() && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          aria-label="Xóa nhanh"
        >
          <X size={14} />
        </button>
      )}

      {isOpen && (shouldSearch || showRecent) && (
        <div className="absolute right-0 mt-2 w-[420px] max-h-[420px] overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900 z-50">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-slate-500">Đang tìm kiếm...</div>
          )}

          {!isLoading && !hasResults && (
            <div className="px-3 py-2 text-sm text-slate-500">Không có kết quả phù hợp.</div>
          )}

          {!isLoading && showRecent && (
            <div className="rounded-lg border border-slate-100 p-1.5 dark:border-slate-800">
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Tìm kiếm gần đây
              </div>

              <div className="space-y-0.5">
                {recentSearches.map((item, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <div
                      key={item.href}
                      role="button"
                      tabIndex={-1}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        'group flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          <History size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{item.title}</span>
                          {item.subtitle && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</span>}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFromRecentSearches(item.href);
                        }}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 opacity-0 transition-colors hover:bg-slate-200 hover:text-red-500 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-slate-700"
                        aria-label="Xóa lịch sử"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isLoading && !showRecent && hasResults && (
            <div className="space-y-2">
              {(() => {
                let currentIndex = -1;

                return visibleSections.map((section) => {
                  if (section.items.length === 0) {
                    return null;
                  }

                  return (
                    <div key={section.key} className="rounded-lg border border-slate-100 p-1.5 dark:border-slate-800">
                      <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {section.label}
                      </div>

                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          currentIndex += 1;
                          const itemIndex = currentIndex;
                          const Icon = item.icon;
                          const isActive = itemIndex === activeIndex;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onMouseEnter={() => setActiveIndex(itemIndex)}
                              onClick={() => handleSelect(item)}
                              className={cn(
                                'w-full rounded-md px-2 py-1.5 text-left transition-colors',
                                isActive
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                  <Icon size={14} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium">{item.title}</span>
                                  {item.subtitle && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</span>}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
