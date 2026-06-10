'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button, Dialog, DialogContent, cn } from '@/app/admin/components/ui';
import { InputWithClear } from '@/app/admin/home-components/stats/_components/InputWithClear';
import {
  BookOpen,
  ChevronRight,
  FileArchive,
  FolderOpen,
  GraduationCap,
  Home,
  Loader2,
  Package,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import {
  buildCategoryPath,
  buildDetailPath,
  buildModuleListPath,
  normalizeRouteMode,
  type RoutableModuleKey,
} from '@/lib/ia/route-mode';

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuickRouteGroup = 'Trang cơ bản' | 'Module' | 'Danh mục' | 'Trang tin cậy';

export type QuickRouteOption = {
  group: QuickRouteGroup;
  label: string;
  source: string;
  url: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const CORE_ROUTE_OPTIONS: QuickRouteOption[] = [
  { label: 'Trang chủ', url: '/', source: 'Core', group: 'Trang cơ bản' },
  { label: 'Liên hệ', url: '/contact', source: 'Core', group: 'Trang cơ bản' },
];

const MODULE_SITE_ROUTE_CATALOG: Record<string, { label: string; url: string }[]> = {
  cart:        [{ label: 'Giỏ hàng', url: '/cart' }],
  customers:   [
    { label: 'Đăng nhập', url: '/account/login' },
    { label: 'Đăng ký', url: '/account/register' },
    { label: 'Tài khoản', url: '/account/profile' },
    { label: 'Đơn hàng', url: '/account/orders' },
  ],
  orders:      [
    { label: 'Đơn hàng', url: '/account/orders' },
    { label: 'Checkout', url: '/checkout' },
  ],
  posts:       [{ label: 'Tất cả bài viết', url: buildModuleListPath('posts') }],
  products:    [{ label: 'Tất cả sản phẩm', url: buildModuleListPath('products') }],
  promotions:  [{ label: 'Khuyến mãi', url: '/promotions' }],
  services:    [{ label: 'Tất cả dịch vụ', url: buildModuleListPath('services') }],
  projects:    [{ label: 'Tất cả dự án', url: buildModuleListPath('projects') }],
  courses:     [{ label: 'Tất cả khóa học', url: buildModuleListPath('courses') }],
  resources:   [{ label: 'Tất cả tài nguyên', url: buildModuleListPath('resources') }],
  wishlist:    [{ label: 'Wishlist', url: '/wishlist' }],
};

type PickerType = 'core' | 'module' | 'category' | 'trust' | 'detail';
type DetailModule = 'posts' | 'products' | 'services' | 'projects' | 'courses' | 'resources';

interface DetailModuleConfig {
  key: DetailModule;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const DETAIL_MODULE_CONFIGS: DetailModuleConfig[] = [
  { key: 'posts',     label: 'Bài viết',   description: 'Chọn 1 bài viết cụ thể',   icon: <BookOpen size={15} /> },
  { key: 'products',  label: 'Sản phẩm',   description: 'Chọn 1 sản phẩm cụ thể',  icon: <Package size={15} /> },
  { key: 'services',  label: 'Dịch vụ',    description: 'Chọn 1 dịch vụ cụ thể',   icon: <Wrench size={15} /> },
  { key: 'projects',  label: 'Dự án',      description: 'Chọn 1 dự án cụ thể',     icon: <FolderOpen size={15} /> },
  { key: 'courses',   label: 'Khóa học',   description: 'Chọn 1 khóa học cụ thể',  icon: <GraduationCap size={15} /> },
  { key: 'resources', label: 'Tài nguyên', description: 'Chọn 1 tài nguyên cụ thể', icon: <FileArchive size={15} /> },
];

// ─── Group badge styles ───────────────────────────────────────────────────────

const GROUP_BADGE: Record<QuickRouteGroup, string> = {
  'Trang cơ bản': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  'Module':        'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  'Danh mục':      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  'Trang tin cậy': 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface QuickRoutePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nhận QuickRouteOption gồm cả label + url */
  onSelect: (option: QuickRouteOption) => void;
  title?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function QuickRoutePickerModal({
  open,
  onOpenChange,
  onSelect,
  title = 'Chọn link',
}: QuickRoutePickerModalProps) {
  const [search, setSearch] = useState('');
  const [step, setStep]   = useState<1 | 2 | 3>(1);
  const [selectedType,   setSelectedType]   = useState<PickerType | null>(null);
  const [selectedModule, setSelectedModule] = useState<DetailModule | null>(null);

  // ── Data queries ────────────────────────────────────────────────────────────
  const enabledModules     = useQuery(api.admin.modules.listEnabledModules);
  const productCategories  = useQuery(api.productCategories.listActive);
  const postCategories     = useQuery(api.postCategories.listActive,    { limit: 100 });
  const serviceCategories  = useQuery(api.serviceCategories.listActive, { limit: 100 });
  const projectCategories  = useQuery(api.projectCategories.listActive, { limit: 100 });
  const courseCategories   = useQuery(api.courseCategories.listActive,  { limit: 100 });
  const resourceCategories = useQuery(api.resourceCategories.listActive,{ limit: 100 });
  const trustPageRoutes    = useQuery(api.menus.listTrustPageRoutesForPicker, {});
  const routeModeSetting   = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);

  // ── Detail item queries (lazy) ───────────────────────────────────────────────
  const detailPosts      = useQuery(api.menus.listPostsForPicker,
    selectedModule === 'posts'     && step === 3 ? { search, limit: 20 } : 'skip');
  const detailProducts   = useQuery(api.menus.listProductsForPicker,
    selectedModule === 'products'  && step === 3 ? { search, limit: 20 } : 'skip');
  const detailServices   = useQuery(api.menus.listServicesForPicker,
    selectedModule === 'services'  && step === 3 ? { search, limit: 20 } : 'skip');
  const detailProjects   = useQuery(api.menus.listProjectsForPicker,
    selectedModule === 'projects'  && step === 3 ? { search, limit: 20 } : 'skip');
  const detailCourses    = useQuery(api.menus.listCoursesForPicker,
    selectedModule === 'courses'   && step === 3 ? { search, limit: 20 } : 'skip');
  const detailResources  = useQuery(api.menus.listResourcesForPicker,
    selectedModule === 'resources' && step === 3 ? { search, limit: 20 } : 'skip');

  // ── Build route options ─────────────────────────────────────────────────────
  const enabledKeys = useMemo(
    () => new Set((enabledModules ?? []).map((m: { key: string }) => m.key)),
    [enabledModules],
  );

  const quickRouteOptions = useMemo<QuickRouteOption[]>(() => {
    const options: QuickRouteOption[] = [...CORE_ROUTE_OPTIONS];

    // Module list routes
    Object.entries(MODULE_SITE_ROUTE_CATALOG).forEach(([moduleKey, routes]) => {
      if (!enabledKeys.has(moduleKey)) return;
      routes.forEach(route => {
        options.push({ ...route, source: moduleKey, group: 'Module' });
      });
    });

    // Category routes — all routable modules
    const catModules: Array<{ key: RoutableModuleKey; categories: Array<{ name: string; slug: string }> | undefined }> = [
      { key: 'products',  categories: productCategories  as any },
      { key: 'posts',     categories: postCategories     as any },
      { key: 'services',  categories: serviceCategories  as any },
      { key: 'projects',  categories: projectCategories  as any },
      { key: 'courses',   categories: courseCategories   as any },
      { key: 'resources', categories: resourceCategories as any },
    ];
    catModules.forEach(({ key, categories }) => {
      if (!enabledKeys.has(key)) return;
      (categories ?? []).forEach(cat => {
        options.push({
          group: 'Danh mục',
          label: cat.name,
          source: key,
          url: buildCategoryPath({ categorySlug: cat.slug, mode: routeMode, moduleKey: key }),
        });
      });
    });

    // Trust pages
    (trustPageRoutes ?? []).forEach(route => {
      options.push({ group: 'Trang tin cậy', label: route.label, source: 'trust-pages', url: route.url });
    });

    // Dedup by URL
    const seen = new Map<string, QuickRouteOption>();
    options.forEach(o => { if (!seen.has(o.url)) seen.set(o.url, o); });
    return Array.from(seen.values());
  }, [enabledKeys, postCategories, productCategories, serviceCategories, projectCategories, courseCategories, resourceCategories, trustPageRoutes, routeMode]);

  // ── Filtered routes ─────────────────────────────────────────────────────────
  const keyword = search.trim().toLowerCase();
  const filteredRoutes = useMemo<QuickRouteOption[]>(() => {
    if (!keyword) return quickRouteOptions;
    return quickRouteOptions.filter(o =>
      o.label.toLowerCase().includes(keyword) ||
      o.url.toLowerCase().includes(keyword) ||
      o.source.toLowerCase().includes(keyword),
    );
  }, [quickRouteOptions, keyword]);

  // ── Group counts for Step-1 cards ───────────────────────────────────────────
  const groupCounts = useMemo(() => {
    const counts: Partial<Record<QuickRouteGroup, number>> = {};
    quickRouteOptions.forEach(o => { counts[o.group] = (counts[o.group] ?? 0) + 1; });
    return counts;
  }, [quickRouteOptions]);

  // ── Step-1 category cards ────────────────────────────────────────────────────
  type CardDef = {
    type: PickerType;
    label: string;
    desc: string;
    count: number | null;
    icon: React.ReactNode;
  };

  const pickerCards: CardDef[] = ([
    {
      type: 'core',
      label: 'Trang cơ bản',
      desc: 'Trang chủ, liên hệ',
      count: groupCounts['Trang cơ bản'] ?? 0,
      icon: <Home size={16} />,
    },
    {
      type: 'module',
      label: 'Module',
      desc: 'Bài viết, sản phẩm, dịch vụ…',
      count: groupCounts['Module'] ?? 0,
      icon: <Package size={16} />,
    },
    {
      type: 'category',
      label: 'Danh mục',
      desc: 'Danh mục thực từ dữ liệu',
      count: groupCounts['Danh mục'] ?? 0,
      icon: <FolderOpen size={16} />,
    },
    {
      type: 'trust',
      label: 'Chính sách',
      desc: 'Trang tin cậy đã xuất bản',
      count: groupCounts['Trang tin cậy'] ?? 0,
      icon: <ShieldCheck size={16} />,
    },
    {
      type: 'detail',
      label: 'Nội dung cụ thể',
      desc: 'Chọn bài, sản phẩm, dịch vụ…',
      count: null,
      icon: <FileArchive size={16} />,
    },
  ] as CardDef[]).filter(c => {
    // Ẩn trust nếu không có
    if (c.type === 'trust') return (groupCounts['Trang tin cậy'] ?? 0) > 0;
    return true;
  });

  // ── Detail module options (chỉ module enabled) ───────────────────────────────
  const availableDetailModules = DETAIL_MODULE_CONFIGS.filter(m => enabledKeys.has(m.key));
  const filteredDetailModules  = keyword
    ? availableDetailModules.filter(m =>
        m.label.toLowerCase().includes(keyword) ||
        m.description.toLowerCase().includes(keyword),
      )
    : availableDetailModules;

  // ── Route list (step 2 non-detail) ──────────────────────────────────────────
  const filteredPickerRoutes = useMemo(() => {
    const groupMap: Partial<Record<PickerType, QuickRouteGroup>> = {
      core:     'Trang cơ bản',
      module:   'Module',
      category: 'Danh mục',
      trust:    'Trang tin cậy',
    };
    const targetGroup = selectedType ? groupMap[selectedType] : undefined;
    if (!targetGroup) return [];
    return filteredRoutes.filter(o => o.group === targetGroup);
  }, [filteredRoutes, selectedType]);

  // ── Detail items (step 3) ────────────────────────────────────────────────────
  type RawDetailItem = { _id: string; slug: string; categorySlug: string };
  type LabeledDetail = RawDetailItem & { displayTitle: string };

  const isDetailLoading =
    step === 3 && (
      (selectedModule === 'posts'     && detailPosts     === undefined) ||
      (selectedModule === 'products'  && detailProducts  === undefined) ||
      (selectedModule === 'services'  && detailServices  === undefined) ||
      (selectedModule === 'projects'  && detailProjects  === undefined) ||
      (selectedModule === 'courses'   && detailCourses   === undefined) ||
      (selectedModule === 'resources' && detailResources === undefined)
    );

  const detailItems: LabeledDetail[] = useMemo(() => {
    if (!selectedModule) return [];
    if (selectedModule === 'posts')     return (detailPosts     ?? []).map(p => ({ _id: p._id, displayTitle: p.title,   slug: p.slug, categorySlug: p.categorySlug }));
    if (selectedModule === 'products')  return (detailProducts  ?? []).map(p => ({ _id: p._id, displayTitle: p.name,    slug: p.slug, categorySlug: p.categorySlug }));
    if (selectedModule === 'services')  return (detailServices  ?? []).map(p => ({ _id: p._id, displayTitle: p.title,   slug: p.slug, categorySlug: p.categorySlug }));
    if (selectedModule === 'projects')  return (detailProjects  ?? []).map(p => ({ _id: p._id, displayTitle: p.title,   slug: p.slug, categorySlug: p.categorySlug }));
    if (selectedModule === 'courses')   return (detailCourses   ?? []).map(p => ({ _id: p._id, displayTitle: p.title,   slug: p.slug, categorySlug: p.categorySlug }));
    if (selectedModule === 'resources') return (detailResources ?? []).map(p => ({ _id: p._id, displayTitle: p.title,   slug: p.slug, categorySlug: p.categorySlug }));
    return [];
  }, [selectedModule, detailPosts, detailProducts, detailServices, detailProjects, detailCourses, detailResources]);

  // ── Breadcrumb ───────────────────────────────────────────────────────────────
  const breadcrumbParts = useMemo(() => {
    const parts: string[] = [title];
    if (step >= 2 && selectedType) {
      const card = pickerCards.find(c => c.type === selectedType);
      if (card) parts.push(card.label);
    }
    if (step === 3 && selectedModule) {
      const mod = DETAIL_MODULE_CONFIGS.find(m => m.key === selectedModule);
      if (mod) parts.push(mod.label);
    }
    return parts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedType, selectedModule, title]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleClose = () => {
    setSearch('');
    setStep(1);
    setSelectedType(null);
    setSelectedModule(null);
    onOpenChange(false);
  };

  const handleSelect = (option: QuickRouteOption) => {
    onSelect(option);
    handleClose();
  };

  const handleBack = () => {
    setSearch('');
    if (step === 3) { setStep(2); setSelectedModule(null); }
    else            { setStep(1); setSelectedType(null); }
  };

  // ── Search placeholder ───────────────────────────────────────────────────────
  const searchPlaceholder =
    step === 1 ? 'Tìm loại trang...' :
    step === 2 && selectedType === 'detail' ? 'Lọc module...' :
    'Tìm tên hoặc URL...';

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="w-[92vw] max-w-xl p-0 gap-0 overflow-hidden rounded-xl shadow-2xl">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2.5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 min-w-0">
            {breadcrumbParts.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={11} className="shrink-0 text-slate-300 dark:text-slate-600" />}
                <span
                  className={cn(
                    'text-xs truncate',
                    i === breadcrumbParts.length - 1
                      ? 'font-semibold text-slate-700 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  {part}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Search */}
          <InputWithClear
            value={search}
            onChange={setSearch}
            placeholder={searchPlaceholder}
            className="h-9 text-sm"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="p-3 space-y-2 overflow-y-auto max-h-[70vh]">

          {/* Back link */}
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-0.5"
            >
              <ChevronRight size={11} className="rotate-180" />
              Quay lại
            </button>
          )}

          {/* ── STEP 1: Category cards ──────────────────────────────── */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pickerCards.map(card => (
                <button
                  key={card.type}
                  type="button"
                  onClick={() => { setSelectedType(card.type); setStep(2); setSearch(''); }}
                  className={cn(
                    'group flex flex-col items-start gap-2.5 rounded-lg border p-3 text-left',
                    'border-slate-200 dark:border-slate-700/60',
                    'hover:border-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 dark:hover:border-blue-600',
                    'transition-all duration-150',
                  )}
                >
                  {/* Icon row */}
                  <div className="flex w-full items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      {card.icon}
                    </span>
                    {card.count !== null && card.count > 0 && (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-px text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {card.count}
                      </span>
                    )}
                  </div>
                  {/* Label + desc */}
                  <div className="min-w-0 w-full">
                    <p className="text-[13px] font-semibold leading-tight text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-400 dark:text-slate-500 line-clamp-2">
                      {card.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── STEP 2a: Detail module selector ─────────────────────── */}
          {step === 2 && selectedType === 'detail' && (
            <div className="space-y-1">
              {(filteredDetailModules.length === 0 ? availableDetailModules : filteredDetailModules).length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Không có module nào được bật.</p>
              ) : (
                (filteredDetailModules.length === 0 ? availableDetailModules : filteredDetailModules).map(mod => (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => { setSelectedModule(mod.key); setStep(3); setSearch(''); }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left',
                      'border-slate-200 dark:border-slate-700/60',
                      'hover:border-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 dark:hover:border-blue-600',
                      'transition-all duration-150',
                    )}
                  >
                    <span className="shrink-0 text-slate-400 dark:text-slate-500">{mod.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{mod.label}</p>
                      <p className="text-xs text-slate-400">{mod.description}</p>
                    </div>
                    <ChevronRight size={13} className="shrink-0 text-slate-300 dark:text-slate-600" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── STEP 2b: Route list ─────────────────────────────────── */}
          {step === 2 && selectedType && selectedType !== 'detail' && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/60 overflow-hidden">
              {filteredPickerRoutes.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Không có gợi ý phù hợp.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredPickerRoutes.map(option => (
                    <button
                      key={`${option.url}-${option.source}`}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{option.label}</p>
                        <p className="truncate font-mono text-[11px] text-slate-400">{option.url}</p>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium',
                        GROUP_BADGE[option.group],
                      )}>
                        {option.source}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Detail items ─────────────────────────────────── */}
          {step === 3 && selectedModule && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/60 overflow-hidden">
              {isDetailLoading && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                  <Loader2 size={15} className="animate-spin" />
                  Đang tải...
                </div>
              )}
              {!isDetailLoading && detailItems.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">Không tìm thấy nội dung.</p>
              )}
              {!isDetailLoading && detailItems.length > 0 && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {detailItems.map(item => {
                    const url = buildDetailPath({
                      categorySlug: item.categorySlug,
                      mode: routeMode,
                      moduleKey: selectedModule as RoutableModuleKey,
                      recordSlug: item.slug,
                    });
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => handleSelect({ label: item.displayTitle, url, source: selectedModule, group: 'Module' })}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{item.displayTitle}</p>
                          <p className="truncate font-mono text-[11px] text-slate-400">{url}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer (cancel) ─────────────────────────────────────────── */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 py-2.5 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="text-xs h-7">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
