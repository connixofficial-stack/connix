'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { Check, ChevronsUpDown, Search, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Input, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui';
import { COMPONENT_TYPES } from './shared';

export default function HomeComponentCreatePage() {
  const router = useRouter();
  const components = useQuery(api.homeComponents.listAll);
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typeCounts = useMemo(() => {
    if (!components) {return {};}
    return components.reduce<Record<string, number>>((counts, component) => {
      counts[component.type] = (counts[component.type] ?? 0) + 1;
      return counts;
    }, {});
  }, [components]);

  const hiddenTypeSet = useMemo(() => new Set(systemConfig?.hiddenTypes ?? []), [systemConfig?.hiddenTypes]);
  const visibleTypes = useMemo(() => COMPONENT_TYPES.filter((type) => !hiddenTypeSet.has(type.value)), [hiddenTypeSet]);

  const recommendedTypes = visibleTypes.filter((type) => type.recommended);
  const otherTypes = visibleTypes.filter((type) => !type.recommended);
  const filteredTypes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {return visibleTypes;}

    return visibleTypes.filter((type) => {
      const haystack = `${type.label} ${type.description} ${type.route} ${type.value}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [query, visibleTypes]);

  useEffect(() => {
    if (!searchOpen) {return;}

    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    const handleMouseDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [searchOpen]);

  const showSearchResults = searchOpen || query.trim().length > 0;

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm Component mới</h1>
            <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">
              ← Quay lại danh sách
            </Link>
          </div>

          <div className="relative max-w-xl" ref={searchRef}>
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2 truncate">
                <Search size={16} className="text-slate-400" />
                {query.trim() ? `Tìm: ${query}` : 'Tìm nhanh component cần thêm'}
              </span>
              <ChevronsUpDown size={16} className="text-slate-400" />
            </button>

            {showSearchResults && (
              <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    if (!searchOpen) {
                      setSearchOpen(true);
                    }
                  }}
                  placeholder="Tìm theo tên, mô tả hoặc route..."
                  className="mb-2"
                />
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {filteredTypes.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-500">Không tìm thấy component phù hợp.</div>
                  )}
                  {filteredTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={(e) => {
                        const exists = (typeCounts[type.value] ?? 0) > 0;
                        if (type.singleton && exists) {
                          e.preventDefault();
                          toast.error(`Chỉ được phép tạo 1 ${type.label.toLowerCase()} trên trang.`);
                          return;
                        }
                        setSearchOpen(false);
                        setQuery('');
                        router.push(`/admin/home-components/create/${type.route}`);
                      }}
                      className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                          <span className="truncate">{type.label}</span>
                          {type.recommended ? (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Gợi ý
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {type.description} · /admin/home-components/create/{type.route}
                        </div>
                      </div>
                      {(typeCounts[type.value] ?? 0) > 0 ? (
                        <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-[11px] font-semibold text-white">
                          {typeCounts[type.value] ?? 0}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="text-yellow-500" size={18} />
              Gợi ý cho bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendedTypes.map((type) => (
                <ComponentCard key={type.value} type={type} count={typeCounts[type.value] ?? 0} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Các component còn lại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherTypes.map((type) => (
                <ComponentCard key={type.value} type={type} count={typeCounts[type.value] ?? 0} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

type ComponentType = (typeof COMPONENT_TYPES)[number];

function ComponentCard({ type, count }: { type: ComponentType; count: number }) {
  const Icon = type.icon;
  const exists = count > 0;
  const shouldWarn = type.singleton && exists;
  const tooltipText = shouldWarn
    ? `${type.label} đã được thêm (${count}). Thông thường chỉ nên có 1 ${type.label.toLowerCase()} trên trang.`
    : type.description;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/admin/home-components/create/${type.route}`}
          onClick={(e) => {
            if (shouldWarn) {
              e.preventDefault();
              void import('sonner').then(({ toast }) => {
                toast.error(`Chỉ được phép tạo 1 ${type.label.toLowerCase()} trên trang.`);
              });
            }
          }}
          className={cn(
            "relative cursor-pointer border-2 rounded-xl p-4 transition-all",
            "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10",
            "border-slate-200 dark:border-slate-700",
            shouldWarn && "opacity-60 hover:opacity-70 cursor-not-allowed"
          )}
        >
          {type.recommended && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Gợi ý
            </div>
          )}

          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 relative">
            <Icon size={24} className="text-slate-600 dark:text-slate-400" />
            {exists && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{count}</span>
              </div>
            )}
          </div>
          <h3 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
            {type.label}
            {exists && <Check size={14} className="text-green-600" />}
          </h3>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
