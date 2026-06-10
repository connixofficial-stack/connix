'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Eye, Layers, Search, LayoutGrid, List, Phone,
  Globe, Palette, FileText,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

const getSnapshotCategoryLabel = (category: string) =>
  category && category !== 'other' ? category : 'Khác';

type PublicSnapshot = {
  _id: string;
  label: string;
  category: string;
  createdAt: number;
  slug: string;
  brandName: string;
  tagline: string;
  logo: string;
  brandPrimary: string;
  brandSecondary: string;
  brandMode: string;
  phone: string;
  address: string;
  componentCount: number;
  componentTypes: string[];
  sectionTitles: string[];
  thumbnails: string[];
};

/* ─────────────── Thumbnail component ─────────────── */
function TemplateThumbnail({ item }: { item: PublicSnapshot }) {
  const hasImages = item.thumbnails.length > 0;
  const heroImage = item.thumbnails[0];
  const productImages = item.thumbnails.slice(1, 5);

  if (!hasImages) {
    // Fallback: color wireframe (only if no images at all)
    return (
      <div
        className="absolute inset-0 flex flex-col"
        style={{ background: `linear-gradient(135deg, ${item.brandPrimary}20 0%, ${item.brandPrimary}08 100%)` }}
      >
        <div className="h-8 flex items-center px-3 gap-2" style={{ background: item.brandPrimary }}>
          {item.logo && <img src={item.logo} alt="" className="h-4 w-4 rounded-sm object-contain bg-white/20" />}
          <span className="text-[9px] font-semibold text-white/90 truncate">{item.brandName || item.label}</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Palette className="h-8 w-8 text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Mini header bar with brand color */}
      <div className="h-7 flex items-center px-3 gap-2 shrink-0" style={{ background: item.brandPrimary }}>
        {item.logo && <img src={item.logo} alt="" className="h-4 w-4 rounded-sm object-contain bg-white/20" />}
        <span className="text-[9px] font-semibold text-white/90 truncate">{item.brandName || item.label}</span>
      </div>

      {/* Main hero image */}
      {heroImage && (
        <div className="relative flex-1 min-h-0">
          <img
            src={heroImage}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Product image strip (if have extra images) */}
      {productImages.length > 0 && (
        <div className="flex gap-px bg-slate-100 h-[42px] shrink-0">
          {productImages.map((img, i) => (
            <div key={i} className="flex-1 overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {/* Fill remaining slots with tinted blocks */}
          {productImages.length < 4 && Array.from({ length: 4 - productImages.length }).map((_, i) => (
            <div
              key={`fill-${i}`}
              className="flex-1"
              style={{ background: `${item.brandPrimary}10` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Grid Card ─────────────── */
function TemplateCard({ item }: { item: PublicSnapshot }) {
  const demoUrl = `/demo/${item.slug}`;
  const detailUrl = `${demoUrl}/thong-tin-chi-tiet`;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all duration-300 hover:shadow-xl">
      {/* Preview */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
        <TemplateThumbnail item={item} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Link href={detailUrl}>
            <button className="flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-slate-900 font-semibold text-sm shadow-xl hover:bg-slate-50 transition-colors transform group-hover:scale-100 scale-90 duration-300">
              <FileText className="h-4 w-4" />
              Chi tiết
            </button>
          </Link>
          <Link href={demoUrl} target="_blank">
            <button className="flex items-center gap-2 px-5 py-3 rounded-lg text-white font-semibold text-sm shadow-xl transition-colors transform group-hover:scale-100 scale-90 duration-300" style={{ background: item.brandPrimary }}>
              <Eye className="h-4 w-4" />
              Xem thử
            </button>
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Title + colors */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-slate-900 truncate">{item.label}</h3>
            {item.tagline && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{item.tagline}</p>
            )}
            <span className="mt-2 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {getSnapshotCategoryLabel(item.category)}
            </span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 mt-1">
            <div
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
              style={{ background: item.brandPrimary }}
            />
            {item.brandMode === 'dual' && item.brandSecondary && (
              <div
                className="w-5 h-5 rounded-full border-2 border-white shadow-sm -ml-1.5"
                style={{ background: item.brandSecondary }}
              />
            )}
          </div>
        </div>

        {/* Brand details */}
        {(item.brandName || item.phone) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            {item.brandName && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {item.brandName}
              </span>
            )}
            {item.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {item.phone}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Layers className="h-3 w-3" />
            {item.componentCount} section
          </span>
          <div className="flex items-center gap-3">
            <Link
              href={detailUrl}
              className="text-xs font-semibold hover:underline flex items-center gap-1 text-slate-600"
            >
              <FileText className="h-3 w-3" />
              Chi tiết
            </Link>
            <Link
              href={demoUrl}
              target="_blank"
              className="text-xs font-semibold hover:underline flex items-center gap-1"
              style={{ color: item.brandPrimary }}
            >
              <Eye className="h-3 w-3" />
              Xem thử
            </Link>
          </div>
        </div>

        {item.sectionTitles.length > 0 && (
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Có sẵn</p>
            <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-600">
              {item.sectionTitles.slice(0, 4).join(' · ')}
            </p>
          </div>
        )}

        {/* Component type tags */}
        <div className="flex flex-wrap gap-1">
          {item.componentTypes.slice(0, 5).map((type) => (
            <span
              key={type}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600"
            >
              {type}
            </span>
          ))}
          {item.componentTypes.length > 5 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
              +{item.componentTypes.length - 5}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── List Item ─────────────── */
function TemplateListItem({ item }: { item: PublicSnapshot }) {
  const demoUrl = `/demo/${item.slug}`;
  const detailUrl = `${demoUrl}/thong-tin-chi-tiet`;
  const heroImage = item.thumbnails[0];

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 hover:shadow-md transition-all">
      {/* Thumbnail */}
      <div className="w-28 h-20 rounded-lg shrink-0 overflow-hidden bg-slate-50 relative">
        {heroImage ? (
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `${item.brandPrimary}12` }}
          >
            {item.logo ? (
              <img src={item.logo} alt="" className="w-10 h-10 rounded object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-full" style={{ background: item.brandPrimary }} />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm text-slate-900 truncate">{item.label}</h3>
        {item.tagline && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{item.tagline}</p>
        )}
        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
          <span>{item.componentCount} section</span>
          <span>·</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {getSnapshotCategoryLabel(item.category)}
          </span>
          {item.brandName && (
            <>
              <span>·</span>
              <span className="truncate max-w-[200px]">{item.brandName}</span>
            </>
          )}
          {item.phone && (
            <>
              <span>·</span>
              <span>{item.phone}</span>
            </>
          )}
        </div>
        {item.sectionTitles.length > 0 && (
          <p className="mt-1 truncate text-[11px] text-slate-500">
            Gồm: {item.sectionTitles.slice(0, 4).join(' · ')}
          </p>
        )}
      </div>

      {/* Action */}
      <div className="flex shrink-0 items-center gap-2">
        <Link href={detailUrl}>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <FileText className="h-4 w-4" />
            Chi tiết
          </button>
        </Link>
        <Link href={demoUrl} target="_blank">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Eye className="h-4 w-4" />
            Xem thử
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ─────────────── Main Page ─────────────── */
export function ThemeGalleryClient({ initialSnapshots }: { initialSnapshots: PublicSnapshot[] }) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Real-time subscription — overrides server-side initialSnapshots khi Convex connection ready
  const liveSnapshots = useQuery(api.homepageSnapshots.listPublicSnapshots) as PublicSnapshot[] | undefined;
  const snapshots = liveSnapshots ?? initialSnapshots;

  const dbCategories = useQuery(api.snapshotCategories.listSnapshotCategories) ?? [];
  const galleryCategories = [
    { value: 'all', label: 'Tất cả' },
    ...dbCategories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  const filtered = snapshots.filter((s) => {
    const snapCat = getSnapshotCategoryLabel(s.category);
    if (categoryFilter !== 'all' && snapCat !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.label.toLowerCase().includes(q) ||
      s.brandName.toLowerCase().includes(q) ||
      s.tagline.toLowerCase().includes(q)
    );
  });

  // Count per category for badges
  const categoryCounts = galleryCategories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.value] = cat.value === 'all'
      ? snapshots.length
      : snapshots.filter((s) => {
          const snapCat = getSnapshotCategoryLabel(s.category);
          return snapCat === cat.value;
        }).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50" style={{ colorScheme: 'light' }}>
      {/* Standalone header — independent, not from site */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Kho giao diện</h2>
              <p className="text-[11px] text-slate-400">Mẫu website chuyên nghiệp</p>
            </div>
          </div>
          <span className="text-xs text-slate-400">{snapshots.length} mẫu có sẵn</span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Chọn giao diện cho website
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
            Duyệt qua các mẫu giao diện đã được thiết kế sẵn. Bấm &quot;Xem thử&quot; để trải nghiệm trực tiếp trên trình duyệt.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm giao diện..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-slate-500">{filtered.length} mẫu</span>
          </div>
          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2">
            {galleryCategories.filter((cat) => categoryCounts[cat.value]! > 0 || cat.value === 'all').map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  categoryFilter === cat.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {cat.label}
                {categoryCounts[cat.value]! > 0 && (
                  <span className={`ml-1 text-[10px] ${categoryFilter === cat.value ? 'text-indigo-200' : 'text-slate-400'}`}>
                    ({categoryCounts[cat.value]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grid / List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Layers className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {search ? 'Không tìm thấy giao diện phù hợp' : 'Chưa có giao diện nào'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <TemplateCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <TemplateListItem key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Standalone footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-slate-400">
          Bộ sưu tập giao diện website · Được tạo tự động từ hệ thống
        </div>
      </footer>
    </div>
  );
}
