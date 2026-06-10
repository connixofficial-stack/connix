'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import {
  ArrowLeft, Eye, ExternalLink, Globe, EyeOff, Loader2,
  Layers, Check, Search, LayoutGrid, List, Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button, Badge, Card, cn } from '../../components/ui';
import { ModuleGuard } from '../../components/ModuleGuard';

type ViewMode = 'grid' | 'list';

export default function TemplateGalleryPageWrapper() {
  return (
    <ModuleGuard moduleKey="homepage">
      <TemplateGalleryPage />
    </ModuleGuard>
  );
}

/** Extract site settings + thumbnail images from snapshot bundle for display */
function extractSiteInfo(payload: unknown) {
  const p = payload as Record<string, unknown> | null;
  const homepage = p?.homepage as Record<string, unknown> | undefined;
  const demoBundle = homepage?.demoBundle as Record<string, unknown> | undefined;
  const settings = demoBundle?.settings as Record<string, unknown> | undefined;
  const site = (settings?.site ?? {}) as Record<string, string>;
  const contact = (settings?.contact ?? {}) as Record<string, string>;
  const components = (homepage?.components ?? []) as Array<{
    type: string;
    title: string;
    active: boolean;
    config?: Record<string, unknown>;
  }>;

  // Extract images from component configs
  const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogg)([?#]|$)/i;
  const isUrl = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//.test(v) && !VIDEO_EXT.test(v);
  const images: string[] = [];
  for (const comp of components) {
    if (!comp.active || images.length >= 6) continue;
    const cfg = comp.config ?? {};
    if (comp.type === 'Hero') {
      if (isUrl(cfg.backgroundImage)) images.push(cfg.backgroundImage as string);
      if (isUrl(cfg.image)) images.push(cfg.image as string);
      if (Array.isArray(cfg.slides)) {
        for (const slide of (cfg.slides as Array<Record<string, unknown>>).slice(0, 3)) {
          if (isUrl(slide.backgroundImage)) images.push(slide.backgroundImage as string);
          if (isUrl(slide.image)) images.push(slide.image as string);
        }
      }
    }
    if ((comp.type === 'ProductList' || comp.type === 'ProductGrid') && Array.isArray(cfg.demoProducts)) {
      for (const pr of (cfg.demoProducts as Array<Record<string, unknown>>).slice(0, 4)) {
        if (isUrl(pr.image)) images.push(pr.image as string);
      }
    }
    if (comp.type === 'Blog' && Array.isArray(cfg.demoPosts)) {
      for (const pt of (cfg.demoPosts as Array<Record<string, unknown>>).slice(0, 3)) {
        if (isUrl(pt.image)) images.push(pt.image as string);
      }
    }
    if (comp.type === 'ServiceList' && Array.isArray(cfg.demoServices)) {
      for (const sv of (cfg.demoServices as Array<Record<string, unknown>>).slice(0, 3)) {
        if (isUrl(sv.image)) images.push(sv.image as string);
      }
    }
  }
  const logo = site.site_logo || '';
  if (images.length === 0 && isUrl(logo)) images.push(logo);

  return {
    brandName: site.site_name || '',
    tagline: site.site_tagline || '',
    logo,
    brandPrimary: site.site_brand_primary || '#3b82f6',
    brandSecondary: site.site_brand_secondary || '',
    brandMode: site.site_brand_mode || 'dual',
    phone: contact.contact_phone || '',
    componentCount: components.length,
    activeComponentCount: components.filter((c) => c.active).length,
    componentTypes: [...new Set(components.filter((c) => c.active).map((c) => c.type))],
    thumbnails: images.slice(0, 6),
  };
}

function TemplateCard({
  snapshot,
  onApply,
  isApplying,
}: {
  snapshot: {
    _id: string;
    label: string;
    createdAt: number;
    slug: string;
    publicEnabled: boolean;
    version: string;
    payload: unknown;
  };
  onApply: (id: string) => void;
  isApplying: boolean;
}) {
  const info = extractSiteInfo(snapshot.payload);
  const demoUrl = snapshot.publicEnabled && snapshot.slug
    ? `/demo/${snapshot.slug}`
    : `/admin/home-components/snapshots/${snapshot._id}/demo`;

  return (
    <Card className="group relative overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 hover:shadow-lg">
      {/* Preview area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 dark:bg-slate-900">
        <div className="absolute inset-0 flex flex-col bg-white dark:bg-slate-950">
          {/* Mini header bar */}
          <div className="h-7 flex items-center px-3 gap-2 shrink-0" style={{ background: info.brandPrimary }}>
            {info.logo && <img src={info.logo} alt="" className="h-4 w-4 rounded-sm object-contain bg-white/20" />}
            <span className="text-[9px] font-semibold text-white/90 truncate">{info.brandName || snapshot.label}</span>
          </div>

          {/* Main thumbnail */}
          {info.thumbnails[0] ? (
            <div className="relative flex-1 min-h-0">
              <img src={info.thumbnails[0]} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          ) : (
            <div className="flex-1 p-3 space-y-2" style={{ background: `${info.brandPrimary}08` }}>
              <div className="h-14 rounded-md" style={{ background: `${info.brandPrimary}15` }} />
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-8 rounded" style={{ background: `${info.brandPrimary}${10 + i * 5}` }} />
                ))}
              </div>
            </div>
          )}

          {/* Product image strip */}
          {info.thumbnails.length > 1 && (
            <div className="flex gap-px bg-slate-100 dark:bg-slate-800 h-[38px] shrink-0">
              {info.thumbnails.slice(1, 5).map((img, i) => (
                <div key={i} className="flex-1 overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {info.thumbnails.slice(1, 5).length < 4 && Array.from({ length: 4 - Math.min(info.thumbnails.length - 1, 4) }).map((_, i) => (
                <div key={`f${i}`} className="flex-1" style={{ background: `${info.brandPrimary}08` }} />
              ))}
            </div>
          )}
        </div>

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Link href={demoUrl} target="_blank">
            <Button size="sm" className="h-8 gap-1.5 bg-white text-slate-900 hover:bg-slate-100 shadow-lg">
              <Eye className="h-3.5 w-3.5" />
              Xem thử
            </Button>
          </Link>
          <Link href={`/admin/home-components/snapshots/${snapshot._id}/home-components`}>
            <Button size="sm" className="h-8 gap-1.5 bg-white text-slate-900 hover:bg-slate-100 shadow-lg">
              <Edit3 className="h-3.5 w-3.5" />
              Sửa
            </Button>
          </Link>
          <Button
            size="sm"
            className="h-8 gap-1.5 shadow-lg"
            variant="accent"
            onClick={() => onApply(snapshot._id)}
            disabled={isApplying}
          >
            {isApplying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Áp dụng
          </Button>
        </div>

        {/* Status badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {snapshot.publicEnabled ? (
            <Badge variant="success" className="text-[10px] px-1.5 py-0.5 shadow-sm">
              <Globe className="h-2.5 w-2.5 mr-0.5" />
              Public
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 shadow-sm bg-white/80 dark:bg-slate-800/80">
              <EyeOff className="h-2.5 w-2.5 mr-0.5" />
              Riêng tư
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {snapshot.label}
            </h3>
            {info.tagline && (
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{info.tagline}</p>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
            <div className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" style={{ background: info.brandPrimary }} />
            {info.brandMode === 'dual' && info.brandSecondary && (
              <div className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm -ml-1" style={{ background: info.brandSecondary }} />
            )}
          </div>
        </div>

        {(info.brandName || info.phone) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
            {info.brandName && <span>{info.brandName}</span>}
            {info.phone && <span>· {info.phone}</span>}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {info.activeComponentCount} section
          </span>
          <span>{new Date(snapshot.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>

        {/* Component type tags */}
        <div className="flex flex-wrap gap-1">
          {info.componentTypes.slice(0, 4).map((type) => (
            <span
              key={type}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {type}
            </span>
          ))}
          {info.componentTypes.length > 4 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              +{info.componentTypes.length - 4}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function TemplateListItem({
  snapshot,
  onApply,
  isApplying,
}: {
  snapshot: {
    _id: string;
    label: string;
    createdAt: number;
    slug: string;
    publicEnabled: boolean;
    version: string;
    payload: unknown;
  };
  onApply: (id: string) => void;
  isApplying: boolean;
}) {
  const info = extractSiteInfo(snapshot.payload);
  const demoUrl = snapshot.publicEnabled && snapshot.slug
    ? `/demo/${snapshot.slug}`
    : `/admin/home-components/snapshots/${snapshot._id}/demo`;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-800 p-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {/* Color dot + logo */}
      <div
        className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: `${info.brandPrimary}15` }}
      >
        {info.logo ? (
          <img src={info.logo} alt="" className="w-8 h-8 rounded object-contain" />
        ) : (
          <div
            className="w-6 h-6 rounded-full"
            style={{ background: info.brandPrimary }}
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
            {snapshot.label}
          </h3>
          {snapshot.publicEnabled && (
            <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
              <Globe className="h-2.5 w-2.5 mr-0.5" />
              Public
            </Badge>
          )}
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span>{info.activeComponentCount} section</span>
          <span>·</span>
          <span>{new Date(snapshot.createdAt).toLocaleDateString('vi-VN')}</span>
          {info.brandName && (
            <>
              <span>·</span>
              <span className="truncate max-w-[200px]">{info.brandName}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Link href={demoUrl} target="_blank">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            Xem thử
          </Button>
        </Link>
        <Link href={`/admin/home-components/snapshots/${snapshot._id}/home-components`}>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Edit3 className="h-3.5 w-3.5" />
            Sửa
          </Button>
        </Link>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs"
          variant="accent"
          onClick={() => onApply(snapshot._id)}
          disabled={isApplying}
        >
          {isApplying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Áp dụng
        </Button>
      </div>
    </div>
  );
}

function TemplateGalleryPage() {
  const snapshots = useQuery(api.homepageSnapshots.listHomepageSnapshotsWithPayload);
  const applySnapshot = useMutation(api.homepageSnapshots.applyHomepageSnapshot);

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isApplyingId, setIsApplyingId] = useState<string | null>(null);

  const handleApply = async (snapshotId: string) => {
    if (!confirm('Áp dụng giao diện này cho trang chủ? Trang chủ hiện tại sẽ được thay thế.')) return;
    setIsApplyingId(snapshotId);
    try {
      const result = await applySnapshot({
        snapshotId: snapshotId as Id<'homeComponentSnapshots'>,
        mode: 'replace_all',
      }) as { applied: boolean; created: number };
      if (!result.applied) {
        toast.error('Áp dụng giao diện bị chặn');
        return;
      }
      toast.success(`Đã áp dụng giao diện với ${result.created} component`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể áp dụng giao diện');
    } finally {
      setIsApplyingId(null);
    }
  };

  const filtered = (snapshots ?? []).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const info = extractSiteInfo(s.payload);
    return (
      s.label.toLowerCase().includes(q) ||
      info.brandName.toLowerCase().includes(q)
    );
  });

  if (snapshots === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/home-components"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Kho giao diện
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chọn giao diện và áp dụng cho trang chủ chỉ với 1 click
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm giao diện..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'grid'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'list'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Count */}
        <span className="text-sm text-slate-500">
          {filtered.length} giao diện
        </span>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Layers className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {search ? 'Không tìm thấy giao diện phù hợp' : 'Chưa có giao diện nào được lưu'}
          </p>
          {!search && (
            <Link href="/admin/home-components">
              <Button variant="outline" className="mt-3" size="sm">
                Quay lại trang chủ để lưu giao diện
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((snapshot) => (
            <TemplateCard
              key={snapshot._id}
              snapshot={snapshot}
              onApply={handleApply}
              isApplying={isApplyingId === snapshot._id}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((snapshot) => (
            <TemplateListItem
              key={snapshot._id}
              snapshot={snapshot}
              onApply={handleApply}
              isApplying={isApplyingId === snapshot._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
