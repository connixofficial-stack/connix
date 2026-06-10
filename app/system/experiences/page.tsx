'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CalendarDays,
  Columns,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  LayoutGrid,
  LayoutList,
  List,
  ListFilter,
  Loader2,
  Mail,
  Menu as MenuIcon,
  MessageSquare,
  Package,
  Save,
  Search,
  Settings,
  ShoppingCart,
  Sliders,
  Ticket,
  User,
  X,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { Button, Card, CardContent, Input } from '@/app/admin/components/ui';
import { api } from '@/convex/_generated/api';
import { useI18n } from '../i18n/context';
import { toast } from 'sonner';

type ExperienceGroup = 'content' | 'commerce' | 'user' | 'ui' | null;

const CONFIG_ITEMS = [
  {
    id: 'posts',
    title: 'Bài viết',
    key: 'posts_list_ui',
    description: 'Quản lý hiển thị danh sách tin tức, bài viết blog, thông báo.',
    icon: FileText,
    editorUrl: '/system/experiences/posts-list',
    previewUrl: '/posts',
  },
  {
    id: 'resources',
    title: 'Tài nguyên',
    key: 'resources_list_ui',
    description: 'Quản lý danh sách các tài nguyên tải xuống, tài liệu hướng dẫn.',
    icon: Briefcase,
    editorUrl: '/system/experiences/resources-list',
    previewUrl: '/resources',
  },
  {
    id: 'courses',
    title: 'Khóa học',
    key: 'courses_list_ui',
    description: 'Hiển thị danh sách khóa học trực tuyến, chương trình đào tạo.',
    icon: BookOpen,
    editorUrl: '/system/experiences/courses-list',
    previewUrl: '/khoa-hoc',
  },
  {
    id: 'services',
    title: 'Dịch vụ',
    key: 'services_list_ui',
    description: 'Hiển thị các gói dịch vụ kinh doanh, tư vấn, giải pháp công nghệ.',
    icon: Briefcase,
    editorUrl: '/system/experiences/services-list',
    previewUrl: '/services',
  },
  {
    id: 'projects',
    title: 'Dự án',
    key: 'projects_list_ui',
    description: 'Trưng bày các dự án đã thực hiện, danh mục portfolio khách hàng.',
    icon: FileText,
    editorUrl: '/system/experiences/projects-list',
    previewUrl: '/projects',
  },
  {
    id: 'products',
    title: 'Sản phẩm',
    key: 'products_list_ui',
    description: 'Danh sách sản phẩm e-commerce, thiết lập layout cho cửa hàng trực tuyến.',
    icon: Package,
    editorUrl: '/system/experiences/products-list',
    previewUrl: '/products',
  },
];

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CalendarDays,
  CreditCard,
  FileText,
  Heart,
  Mail,
  Menu: MenuIcon,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  Ticket,
  User,
};

type GroupConfig = {
  id: ExperienceGroup;
  label: string;
  color: string;
  activeClass: string;
  dotClass: string;
};

const GROUPS: GroupConfig[] = [
  { id: null,       label: 'Tất cả',      color: '#06b6d4', activeClass: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',           dotClass: 'bg-slate-400' },
  { id: 'content',  label: 'Nội dung',    color: '#06b6d4', activeClass: 'bg-cyan-500 text-white',    dotClass: 'bg-cyan-500' },
  { id: 'commerce', label: 'Thương mại',  color: '#7c3aed', activeClass: 'bg-violet-600 text-white',  dotClass: 'bg-violet-500' },
  { id: 'user',     label: 'Người dùng',  color: '#d97706', activeClass: 'bg-amber-500 text-white',   dotClass: 'bg-amber-400' },
  { id: 'ui',       label: 'Giao diện',   color: '#e11d48', activeClass: 'bg-rose-500 text-white',    dotClass: 'bg-rose-500' },
];

const GROUP_ICON_COLOR: Record<string, string> = {
  content:  'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400',
  commerce: 'text-violet-600 bg-violet-500/10 dark:text-violet-400',
  user:     'text-amber-600 bg-amber-500/10 dark:text-amber-400',
  ui:       'text-rose-600 bg-rose-500/10 dark:text-rose-400',
};

const GROUP_HOVER_COLOR: Record<string, string> = {
  content:  'hover:border-cyan-500/60 group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
  commerce: 'hover:border-violet-500/60 group-hover:text-violet-600 dark:group-hover:text-violet-400',
  user:     'hover:border-amber-500/60 group-hover:text-amber-600 dark:group-hover:text-amber-400',
  ui:       'hover:border-rose-500/60 group-hover:text-rose-600 dark:group-hover:text-rose-400',
};

export default function ExperiencesPage() {
  const { t } = useI18n();
  const [activeMainTab, setActiveMainTab] = useState<'hub' | 'layout_config' | 'dark_mode'>('hub');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'layout_config' || tab === 'dark_mode') {
        setActiveMainTab(tab);
      }
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<ExperienceGroup>(null);
  const [subFilter, setSubFilter] = useState<'all' | 'list' | 'detail'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Settings Queries cho Cấu hình nhanh danh sách & Dark Mode
  const postsSetting = useQuery(api.settings.getByKey, { key: 'posts_list_ui' });
  const resourcesSetting = useQuery(api.settings.getByKey, { key: 'resources_list_ui' });
  const coursesSetting = useQuery(api.settings.getByKey, { key: 'courses_list_ui' });
  const servicesSetting = useQuery(api.settings.getByKey, { key: 'services_list_ui' });
  const projectsSetting = useQuery(api.settings.getByKey, { key: 'projects_list_ui' });
  const productsSetting = useQuery(api.settings.getByKey, { key: 'products_list_ui' });
  const darkModeSetting = useQuery(api.settings.getByKey, { key: 'site_dark_mode' });

  const setMultipleSettings = useMutation(api.settings.setMultiple);

  const [localLayouts, setLocalLayouts] = useState<Record<string, 'grid' | 'sidebar' | 'list'>>({});
  const [localGridColumns, setLocalGridColumns] = useState<Record<string, number>>({});
  const [localCornerRadius, setLocalCornerRadius] = useState<Record<string, 'none' | 'sm' | 'lg'>>({});
  const [localCartButtonsLayout, setLocalCartButtonsLayout] = useState<'stack' | 'grid-2'>('stack');
  const [localDarkMode, setLocalDarkMode] = useState<'light' | 'dark' | 'system'>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  const isLoaded = postsSetting !== undefined &&
    resourcesSetting !== undefined &&
    coursesSetting !== undefined &&
    servicesSetting !== undefined &&
    projectsSetting !== undefined &&
    productsSetting !== undefined &&
    darkModeSetting !== undefined;

  useEffect(() => {
    if (isLoaded && !isInitialized) {
      setLocalLayouts({
        posts: (postsSetting?.value as any)?.layoutStyle ?? 'grid',
        resources: (resourcesSetting?.value as any)?.layoutStyle ?? 'grid',
        courses: (coursesSetting?.value as any)?.layoutStyle ?? 'grid',
        services: (servicesSetting?.value as any)?.layoutStyle ?? 'grid',
        projects: (projectsSetting?.value as any)?.layoutStyle ?? 'grid',
        products: (productsSetting?.value as any)?.layoutStyle ?? 'grid',
      });
      setLocalGridColumns({
        posts: (postsSetting?.value as any)?.gridColumns ?? 3,
        resources: (resourcesSetting?.value as any)?.gridColumns ?? 3,
        courses: (coursesSetting?.value as any)?.gridColumns ?? 3,
        services: (servicesSetting?.value as any)?.gridColumns ?? 3,
        projects: (projectsSetting?.value as any)?.gridColumns ?? 3,
        products: (productsSetting?.value as any)?.gridColumns ?? 3,
      });
      setLocalCornerRadius({
        posts: (postsSetting?.value as any)?.cornerRadius ?? 'lg',
        resources: (resourcesSetting?.value as any)?.cornerRadius ?? 'lg',
        courses: (coursesSetting?.value as any)?.cornerRadius ?? 'lg',
        services: (servicesSetting?.value as any)?.cornerRadius ?? 'lg',
        projects: (projectsSetting?.value as any)?.cornerRadius ?? 'lg',
        products: (productsSetting?.value as any)?.cornerRadius ?? 'lg',
      });
      setLocalCartButtonsLayout((productsSetting?.value as any)?.cartButtonsLayout ?? 'stack');
      setLocalDarkMode((darkModeSetting?.value as any) ?? 'light');
      setIsInitialized(true);
    }
  }, [isLoaded, isInitialized, postsSetting, resourcesSetting, coursesSetting, servicesSetting, projectsSetting, productsSetting, darkModeSetting]);

  const hasChanges = React.useMemo(() => {
    if (!isLoaded) return false;
    return (
      localLayouts.posts !== ((postsSetting?.value as any)?.layoutStyle ?? 'grid') ||
      localLayouts.resources !== ((resourcesSetting?.value as any)?.layoutStyle ?? 'grid') ||
      localLayouts.courses !== ((coursesSetting?.value as any)?.layoutStyle ?? 'grid') ||
      localLayouts.services !== ((servicesSetting?.value as any)?.layoutStyle ?? 'grid') ||
      localLayouts.projects !== ((projectsSetting?.value as any)?.layoutStyle ?? 'grid') ||
      localLayouts.products !== ((productsSetting?.value as any)?.layoutStyle ?? 'grid') ||
      localGridColumns.posts !== ((postsSetting?.value as any)?.gridColumns ?? 3) ||
      localGridColumns.resources !== ((resourcesSetting?.value as any)?.gridColumns ?? 3) ||
      localGridColumns.courses !== ((coursesSetting?.value as any)?.gridColumns ?? 3) ||
      localGridColumns.services !== ((servicesSetting?.value as any)?.gridColumns ?? 3) ||
      localGridColumns.projects !== ((projectsSetting?.value as any)?.gridColumns ?? 3) ||
      localGridColumns.products !== ((productsSetting?.value as any)?.gridColumns ?? 3) ||
      localCornerRadius.posts !== ((postsSetting?.value as any)?.cornerRadius ?? 'lg') ||
      localCornerRadius.resources !== ((resourcesSetting?.value as any)?.cornerRadius ?? 'lg') ||
      localCornerRadius.courses !== ((coursesSetting?.value as any)?.cornerRadius ?? 'lg') ||
      localCornerRadius.services !== ((servicesSetting?.value as any)?.cornerRadius ?? 'lg') ||
      localCornerRadius.projects !== ((projectsSetting?.value as any)?.cornerRadius ?? 'lg') ||
      localCornerRadius.products !== ((productsSetting?.value as any)?.cornerRadius ?? 'lg') ||
      localCartButtonsLayout !== ((productsSetting?.value as any)?.cartButtonsLayout ?? 'stack') ||
      localDarkMode !== ((darkModeSetting?.value as any) ?? 'light')
    );
  }, [localLayouts, localGridColumns, localCornerRadius, localCartButtonsLayout, localDarkMode, isLoaded, postsSetting, resourcesSetting, coursesSetting, servicesSetting, projectsSetting, productsSetting, darkModeSetting]);

  const [isSaving, setIsSaving] = useState(false);
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const settings = [
        {
          group: 'experience',
          key: 'posts_list_ui',
          value: {
            ...(postsSetting?.value as any),
            layoutStyle: localLayouts.posts,
            gridColumns: localGridColumns.posts,
            cornerRadius: localCornerRadius.posts
          }
        },
        {
          group: 'experience',
          key: 'resources_list_ui',
          value: {
            ...(resourcesSetting?.value as any),
            layoutStyle: localLayouts.resources,
            gridColumns: localGridColumns.resources,
            cornerRadius: localCornerRadius.resources
          }
        },
        {
          group: 'experience',
          key: 'courses_list_ui',
          value: {
            ...(coursesSetting?.value as any),
            layoutStyle: localLayouts.courses,
            gridColumns: localGridColumns.courses,
            cornerRadius: localCornerRadius.courses
          }
        },
        {
          group: 'experience',
          key: 'services_list_ui',
          value: {
            ...(servicesSetting?.value as any),
            layoutStyle: localLayouts.services,
            gridColumns: localGridColumns.services,
            cornerRadius: localCornerRadius.services
          }
        },
        {
          group: 'experience',
          key: 'projects_list_ui',
          value: {
            ...(projectsSetting?.value as any),
            layoutStyle: localLayouts.projects,
            gridColumns: localGridColumns.projects,
            cornerRadius: localCornerRadius.projects
          }
        },
        {
          group: 'experience',
          key: 'products_list_ui',
          value: {
            ...(productsSetting?.value as any),
            layoutStyle: localLayouts.products,
            gridColumns: localGridColumns.products,
            cornerRadius: localCornerRadius.products,
            cartButtonsLayout: localCartButtonsLayout
          }
        },
        {
          group: 'site',
          key: 'site_dark_mode',
          value: localDarkMode
        }
      ];

      await setMultipleSettings({ settings });
      toast.success('Đã cập nhật cấu hình hệ thống thành công!');
      setIsInitialized(false);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyAll = (layout: 'grid' | 'sidebar' | 'list') => {
    setLocalLayouts({
      posts: layout,
      resources: layout,
      courses: layout,
      services: layout,
      projects: layout,
      products: layout,
    });
    toast.success(`Đã thay đổi tạm thời tất cả danh sách thành ${layout.toUpperCase()}. Nhớ bấm Lưu để áp dụng thực tế!`);
  };

  const handleApplyAllColumns = (cols: number) => {
    setLocalGridColumns({
      posts: cols,
      resources: cols,
      courses: cols,
      services: cols,
      projects: cols,
      products: cols,
    });
    toast.success(`Đã thay đổi tạm thời tất cả danh sách thành ${cols} cột. Nhớ bấm Lưu để áp dụng thực tế!`);
  };

  const handleApplyAllCornerRadius = (radius: 'none' | 'sm' | 'lg') => {
    setLocalCornerRadius({
      posts: radius,
      resources: radius,
      courses: radius,
      services: radius,
      projects: radius,
      products: radius,
    });
    toast.success(`Đã thay đổi tạm thời tất cả bo góc thành: ${radius === 'none' ? 'BỎ BO GÓC' : radius === 'sm' ? 'BO ÍT' : 'BO NHIỀU'}. Nhớ bấm Lưu để áp dụng thực tế!`);
  };

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setSearchQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const experiences = useQuery(api.experiences.search, {
    group: activeGroup ?? undefined,
    query: debouncedQuery,
  });

  const filteredExperiences = React.useMemo(() => {
    if (!experiences) return [];
    return experiences.filter((exp) => {
      if (subFilter === 'list') {
        return exp.title.toLowerCase().includes('danh sách');
      }
      if (subFilter === 'detail') {
        return exp.title.toLowerCase().includes('chi tiết');
      }
      return true;
    });
  }, [experiences, subFilter]);

  // Count per group (all experiences, no filter)
  const allExperiences = useQuery(api.experiences.search, { query: '' });
  const countByGroup = React.useMemo(() => {
    if (!allExperiences) return {} as Record<string, number>;
    const counts: Record<string, number> = { all: allExperiences.length };
    for (const exp of allExperiences) {
      counts[exp.group] = (counts[exp.group] ?? 0) + 1;
    }
    return counts;
  }, [allExperiences]);

  const handleGroupChange = useCallback((group: ExperienceGroup) => {
    setActiveGroup(group);
    setSearchQuery('');
    setSubFilter('all');
  }, []);

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-full bg-cyan-500 inline-block" />
              {t.pages.experiences}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cấu hình theo trải nghiệm người dùng, dễ quan sát và mở rộng.
          </p>
        </div>

        {/* Search — Ctrl+K */}
        <div className="relative w-full sm:w-72 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
          </div>
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh..."
            className="pl-9 pr-16 h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500 dark:focus-visible:border-cyan-400 transition-all rounded-lg text-sm"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                ⌘K
              </kbd>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 mt-1">
        <button
          onClick={() => setActiveMainTab('hub')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeMainTab === 'hub'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <LayoutList size={16} />
          Trải nghiệm Hub
        </button>
        <button
          onClick={() => setActiveMainTab('layout_config')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeMainTab === 'layout_config'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sliders size={16} />
          Cấu hình nhanh danh sách
        </button>
        <button
          onClick={() => setActiveMainTab('dark_mode')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeMainTab === 'dark_mode'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Moon size={16} />
          Cấu hình Chế độ tối
        </button>
      </div>

      {activeMainTab === 'hub' ? (
        <>
          {/* Group tabs */}
          <div className="flex flex-wrap gap-2">
            {GROUPS.map((group) => {
              const count = group.id === null ? countByGroup.all : countByGroup[group.id];
              const isActive = activeGroup === group.id;
              return (
                <button
                  key={String(group.id)}
                  type="button"
                  onClick={() => handleGroupChange(group.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? group.activeClass
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {!isActive && <span className={`w-2 h-2 rounded-full ${group.dotClass}`} />}
                  {group.label}
                  {count !== undefined && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-filter tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
              Bộ lọc phụ:
            </span>
            <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setSubFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  subFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <ListFilter size={12} />
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setSubFilter('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  subFilter === 'list'
                    ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <LayoutList size={12} />
                Danh sách
              </button>
              <button
                type="button"
                onClick={() => setSubFilter('detail')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  subFilter === 'detail'
                    ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Eye size={12} />
                Chi tiết
              </button>
            </div>
          </div>

          {/* Results */}
          {experiences === undefined ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
            </div>
          ) : filteredExperiences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3">
                <Search className="h-5 w-5 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                {debouncedQuery ? (
                  <>Không có kết quả cho &ldquo;<strong>{debouncedQuery}</strong>&rdquo;</>
                ) : subFilter !== 'all' ? (
                  <>Không có trải nghiệm nào dạng <strong>{subFilter === 'list' ? 'Danh sách' : 'Chi tiết'}</strong>.</>
                ) : (
                  'Nhóm này chưa có trải nghiệm nào.'
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredExperiences.map((exp) => {
                const Icon = iconMap[exp.icon] || FileText;
                const iconColorClass = GROUP_ICON_COLOR[exp.group] ?? GROUP_ICON_COLOR.content;
                const hoverColorClass = GROUP_HOVER_COLOR[exp.group] ?? GROUP_HOVER_COLOR.content;
                return (
                  <Link key={exp.href} href={exp.href} className="group">
                    <Card className={`border border-slate-200 dark:border-slate-800 ${hoverColorClass} hover:shadow-sm transition-all duration-200 rounded-xl h-full`}>
                      <CardContent className="p-3.5 flex gap-3 items-start h-full">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0 ${iconColorClass}`}>
                          <Icon size={16} />
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h3 className={`font-semibold text-slate-800 dark:text-slate-100 transition-colors text-sm leading-snug`}>
                            {exp.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {exp.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer count */}
          {experiences !== undefined && experiences.length > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-600 text-right pb-4">
              Hiển thị {filteredExperiences.length} {"/"} {experiences.length} trải nghiệm{activeGroup ? ` trong nhóm này` : ''}
              {debouncedQuery ? ` khớp "${debouncedQuery}"` : ''}
            </p>
          )}
        </>
      ) : activeMainTab === 'layout_config' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Apply Card */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <CardContent className="p-5 space-y-4">
              {/* Quick Layout & Columns */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200/40 dark:border-zinc-800/40">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-cyan-500 inline-block" />
                    Đồng bộ nhanh Layout cho tất cả danh sách
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                    Áp dụng nhanh một kiểu layout chung cho toàn bộ các trang danh sách (Bài viết, Khóa học, Tài nguyên, Dịch vụ, Dự án, Sản phẩm).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyAll('grid')}
                    className="text-xs font-semibold hover:border-cyan-500/50 hover:bg-cyan-500/5 hover:text-cyan-600 transition-all gap-1.5"
                  >
                    <LayoutGrid size={14} />
                    Tất cả Grid
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyAll('sidebar')}
                    className="text-xs font-semibold hover:border-cyan-500/5 hover:bg-cyan-500/5 hover:text-cyan-600 transition-all gap-1.5"
                  >
                    <Columns size={14} />
                    Tất cả Sidebar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyAll('list')}
                    className="text-xs font-semibold hover:border-cyan-500/5 hover:bg-cyan-500/5 hover:text-cyan-600 transition-all gap-1.5"
                  >
                    <List size={14} />
                    Tất cả List
                  </Button>
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyAllColumns(3)}
                    className="text-xs font-semibold hover:border-cyan-500/5 hover:bg-cyan-500/5 hover:text-cyan-600 transition-all gap-1.5"
                  >
                    Tất cả 3 Cột
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyAllColumns(4)}
                    className="text-xs font-semibold hover:border-cyan-500/5 hover:bg-cyan-500/5 hover:text-cyan-600 transition-all gap-1.5"
                  >
                    Tất cả 4 Cột
                  </Button>
                </div>
              </div>

              {/* Quick Corner Radius */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-cyan-500 inline-block" />
                    Đồng bộ nhanh Bo góc cho tất cả danh sách
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                    Cài đặt nhanh mức độ bo tròn viền (Border Radius) đồng nhất cho toàn bộ các trang danh sách.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyAllCornerRadius('none')}
                    className="text-xs font-semibold hover:border-cyan-500/5 hover:bg-cyan-500/5 hover:text-cyan-600 transition-all"
                  >
                    Bỏ bo góc
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyAllCornerRadius('sm')}
                    className="text-xs font-semibold hover:border-cyan-500/5 hover:bg-cyan-500/5 hover:text-cyan-600 transition-all"
                  >
                    Bo góc ít (sm)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyAllCornerRadius('lg')}
                    className="text-xs font-semibold hover:border-cyan-500/5 hover:bg-cyan-500/5 hover:text-cyan-600 transition-all"
                  >
                    Bo góc nhiều (lg)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Config Table Card */}
          <Card className="border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Danh sách cấu hình</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chọn kiểu hiển thị cho từng loại danh sách dữ liệu</p>
              </div>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={!hasChanges || isSaving}
                className={`gap-1.5 transition-all text-xs font-semibold ${
                  hasChanges
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{hasChanges ? 'Lưu cấu hình' : 'Đã lưu'}</span>
              </Button>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {!isLoaded ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-6 w-6 text-cyan-500 animate-spin" />
                  <p className="text-xs text-slate-400">Đang tải cấu hình...</p>
                </div>
              ) : (
                CONFIG_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const currentLayout = localLayouts[item.id] || 'grid';
                  const currentGridColumns = localGridColumns[item.id] || 3;
                  
                  return (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {item.title}
                            <span className="text-[10px] font-mono font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                              {item.key}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        {/* Links */}
                        <div className="flex items-center gap-3 text-xs mr-2">
                          <Link
                            href={item.editorUrl}
                            className="text-slate-500 hover:text-cyan-600 hover:underline flex items-center gap-1"
                          >
                            <Settings size={12} />
                            Chi tiết
                          </Link>
                          <a
                            href={item.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-cyan-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} />
                            Xem thử
                          </a>
                        </div>

                        {/* Bo góc (Corner Radius) */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bo góc</span>
                          <select
                            value={localCornerRadius[item.id] || 'lg'}
                            onChange={(e) => setLocalCornerRadius(prev => ({ ...prev, [item.id]: e.target.value as any }))}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all cursor-pointer h-9 w-28 shadow-sm"
                          >
                            <option value="none">Bỏ bo</option>
                            <option value="sm">Bo ít</option>
                            <option value="lg">Bo nhiều</option>
                          </select>
                        </div>

                        {/* Bố cục nút (chỉ render cho products) */}
                        {item.id === 'products' && (
                          <div className="flex flex-col gap-1 animate-in fade-in duration-200">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bố cục nút</span>
                            <select
                              value={localCartButtonsLayout}
                              onChange={(e) => setLocalCartButtonsLayout(e.target.value as any)}
                              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all cursor-pointer h-9 w-28 shadow-sm"
                            >
                              <option value="stack">Nút dọc</option>
                              <option value="grid-2">Nút ngang</option>
                            </select>
                          </div>
                        )}

                        {/* Column Selector */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Số cột</span>
                          <select
                            value={currentGridColumns}
                            onChange={(e) => setLocalGridColumns(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all cursor-pointer h-9 w-24 shadow-sm"
                          >
                            <option value={3}>3 Cột</option>
                            <option value={4}>4 Cột</option>
                          </select>
                        </div>

                        {/* Layout Selector */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Layout</span>
                          <select
                            value={currentLayout}
                            onChange={(e) => setLocalLayouts(prev => ({ ...prev, [item.id]: e.target.value as any }))}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all cursor-pointer h-9 w-24 shadow-sm"
                          >
                            <option value="grid">Grid</option>
                            <option value="sidebar">Sidebar</option>
                            <option value="list">List</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
          {/* Dark Mode configuration */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Thiết lập giao diện hiển thị</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lựa chọn chế độ hiển thị mặc định cho khách truy cập trang web public</p>
              </div>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={!hasChanges || isSaving}
                className={`gap-1.5 transition-all text-xs font-semibold px-4 h-9 ${
                  hasChanges
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{hasChanges ? 'Lưu cấu hình' : 'Đã lưu cấu hình'}</span>
              </Button>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Option cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Chế độ Sáng', icon: Sun, desc: 'Luôn hiển thị giao diện với tông màu sáng chủ đạo, mang lại cảm giác sạch sẽ, rõ ràng.' },
                  { id: 'dark', label: 'Chế độ Tối', icon: Moon, desc: 'Luôn hiển thị giao diện với tông màu tối huyền bí, dịu mắt và tiết kiệm năng lượng.' },
                  { id: 'system', label: 'Theo hệ thống', icon: Laptop, desc: 'Tự động chuyển đổi giữa giao diện Sáng và Tối dựa trên cấu hình hệ điều hành của thiết bị khách.' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = localDarkMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLocalDarkMode(item.id as any)}
                      className={`flex flex-col items-center text-center p-5 rounded-xl border transition-all cursor-default select-none group ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105 ${
                        isSelected
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <Icon size={20} strokeWidth={1.8} />
                      </div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${
                        isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {item.label}
                      </h4>
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-2 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Preview Simulator */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Xem thử trực quan (Simulator)</h4>
                
                {/* Simulated Web Page Container */}
                <div className={`border rounded-xl p-4 overflow-hidden transition-all duration-300 shadow-sm ${
                  localDarkMode === 'dark' || (localDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                    ? 'bg-slate-950 border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-250 text-slate-800'
                }`}>
                  {/* Web Header Sim */}
                  <div className="flex justify-between items-center border-b pb-2.5 mb-4 border-slate-200/40 dark:border-slate-800/40">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      <span className="text-[11px] font-bold tracking-tight">Dohy System</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-8 h-2 rounded bg-slate-200 dark:bg-slate-800" />
                      <span className="w-8 h-2 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>

                  {/* Web Body Sim */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[9px] font-bold uppercase tracking-wider">
                          Bài viết mới nhất
                        </span>
                        <h5 className="text-sm font-extrabold leading-snug">Hướng dẫn triển khai giao diện phẳng MacBook tối giản</h5>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-normal">
                          Khám phá các nguyên tắc Calm Productivity UI để tối ưu hóa không gian hiển thị và giảm nhiễu thị giác cho người dùng...
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <span>Admin</span>
                        <span>•</span>
                        <span>06/06/2026</span>
                      </div>
                    </div>

                    {/* Sidebar Sim */}
                    <div className="space-y-3 border-l pl-4 border-slate-200/40 dark:border-slate-800/40 md:block hidden">
                      <div className="space-y-2">
                        <h6 className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Tài nguyên liên quan</h6>
                        {[1, 2].map((i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <span className="text-[10px] truncate max-w-[130px]">Tài liệu hướng dẫn v{i}.0</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
