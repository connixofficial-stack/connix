'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { Check, ChevronsUpDown, Loader2, Search, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { HomepageSnapshotPayload, SnapshotComponentPayload } from '@/lib/homepage-snapshot/types';
import { Card, CardContent, CardHeader, CardTitle, Input, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../../components/ui';
import { ModuleGuard } from '../../../../../components/ModuleGuard';
import { COMPONENT_TYPES } from '../../../../create/shared';

type ComponentType = (typeof COMPONENT_TYPES)[number];

const slugifyKey = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const createSnapshotComponent = (type: ComponentType, order: number): SnapshotComponentPayload => ({
  active: true,
  componentKey: `snapshot:${type.value}:${slugifyKey(type.label)}:${Date.now()}`,
  config: {},
  fallbackUsed: false,
  mediaRefs: [],
  order,
  title: type.label,
  type: type.value,
});

function SnapshotHomeComponentCreatePage({ snapshotId }: { snapshotId: string }) {
  const router = useRouter();
  const snapshot = useQuery(api.homepageSnapshots.getHomepageSnapshotById, { snapshotId: snapshotId as Id<'homeComponentSnapshots'> });
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const updateSnapshot = useMutation(api.homepageSnapshots.updateHomepageSnapshot);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isCreatingType, setIsCreatingType] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const payload = snapshot?.payload as HomepageSnapshotPayload | undefined;
  const typeCounts = useMemo(() => {
    if (!payload) {return {} as Record<string, number>;}
    return payload.homepage.components.reduce<Record<string, number>>((acc, component) => {
      acc[component.type] = (acc[component.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [payload]);

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

  const handleCreate = async (type: ComponentType) => {
    if (!snapshot || !payload) {
      toast.error('Snapshot chưa sẵn sàng');
      return;
    }

    setIsCreatingType(type.value);
    try {
      const nextComponent = createSnapshotComponent(type, payload.homepage.components.length);
      const nextComponents = [...payload.homepage.components, nextComponent];
      await updateSnapshot({
        label: snapshot.label,
        payload: {
          ...payload,
          manifest: {
            ...payload.manifest,
            componentCount: nextComponents.length,
            snapshotLabel: snapshot.label,
          },
          homepage: {
            ...payload.homepage,
            componentOrder: nextComponents.map((component) => component.componentKey),
            components: nextComponents,
          },
        },
        snapshotId: snapshotId as Id<'homeComponentSnapshots'>,
      });
      toast.success(`Đã thêm ${type.label}`);
      router.push(`/admin/home-components/snapshots/${snapshotId}/home-components/${encodeURIComponent(nextComponent.componentKey)}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thêm component');
    } finally {
      setIsCreatingType(null);
    }
  };

  if (snapshot === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (snapshot === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy snapshot</div>;
  }

  const showSearchResults = searchOpen || query.trim().length > 0;

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm Component mới</h1>
            <Link href={`/admin/home-components/snapshots/${snapshotId}/home-components`} className="text-sm text-blue-600 hover:underline">
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
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery('');
                        void handleCreate(type);
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
                          {type.description} · snapshot/{snapshot.label}
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
                <ComponentCard key={type.value} type={type} count={typeCounts[type.value] ?? 0} isCreating={isCreatingType === type.value} onCreate={() => { void handleCreate(type); }} />
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
                <ComponentCard key={type.value} type={type} count={typeCounts[type.value] ?? 0} isCreating={isCreatingType === type.value} onCreate={() => { void handleCreate(type); }} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

function ComponentCard({ type, count, isCreating, onCreate }: { type: ComponentType; count: number; isCreating: boolean; onCreate: () => void }) {
  const Icon = type.icon;
  const exists = count > 0;
  const shouldWarn = type.singleton && exists;
  const tooltipText = shouldWarn
    ? `${type.label} đã được thêm (${count}). Thông thường chỉ nên có 1 ${type.label.toLowerCase()} trên trang.`
    : type.description;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className={cn(
            'relative cursor-pointer border-2 rounded-xl p-4 transition-all text-left',
            'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10',
            'border-slate-200 dark:border-slate-700',
            shouldWarn && 'opacity-60 hover:opacity-70',
            isCreating && 'pointer-events-none opacity-70'
          )}
        >
          {type.recommended && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Gợi ý
            </div>
          )}
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 relative">
            {isCreating ? <Loader2 size={24} className="text-slate-500 animate-spin" /> : <Icon size={24} className="text-slate-600 dark:text-slate-400" />}
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
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function SnapshotHomeComponentCreatePageWrapper({ params }: { params: Promise<{ snapshotId: string }> }) {
  const { snapshotId } = use(params);

  return (
    <ModuleGuard moduleKey="homepage">
      <SnapshotHomeComponentCreatePage snapshotId={snapshotId} />
    </ModuleGuard>
  );
}
