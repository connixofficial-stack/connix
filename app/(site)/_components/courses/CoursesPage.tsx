'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { BookOpen, Bookmark, ChevronDown, Clock, Filter, GraduationCap, Search, UserRound, X } from 'lucide-react';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { COURSE_LEVEL_OPTIONS, getCourseLevelLabel } from '@/lib/courses/labels';
import { useCoursesListConfig } from '@/lib/experiences';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { SharedListLayout } from '@/components/shared/SharedListLayout';
import { StorefrontCard } from '@/components/shared/StorefrontCard';

const formatPrice = (pricingType: string, price?: number) => {
  if (pricingType === 'free') {return 'Miễn phí';}
  if (pricingType === 'contact') {return 'Liên hệ';}
  if (!price) {return 'Liên hệ';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
};

const getRadiusClass = (radius?: 'none' | 'sm' | 'lg', type: 'card' | 'input' | 'panel' = 'card') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') {
    if (type === 'panel') return 'rounded-xl';
    return 'rounded-lg';
  }
  if (type === 'panel') return 'rounded-2xl';
  return 'rounded-xl';
};

function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = [];
  const siblingCount = 1;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftRange = 3 + 2 * siblingCount;
    for (let i = 1; i <= leftRange; i++) {
      items.push(i);
    }
    items.push('ellipsis');
    items.push(totalPages);
    return items;
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    items.push(firstPageIndex);
    items.push('ellipsis');
    const rightRange = 3 + 2 * siblingCount;
    for (let i = totalPages - rightRange + 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  items.push(firstPageIndex);
  items.push('ellipsis');
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    items.push(i);
  }
  items.push('ellipsis');
  items.push(lastPageIndex);

  return items;
}

type DropdownOption = {
  value: string;
  label: string;
};

type CustomDropdownProps = {
  value: string;
  onChange: (value: any) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
  disabled,
  cornerRadius = 'lg',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto min-w-[170px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-full items-center justify-between gap-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] px-3 text-sm font-medium text-slate-700 dark:text-[#f5f5f7] transition hover:bg-slate-50 dark:hover:bg-[#2c2c2e] focus:border-slate-350 dark:focus:border-zinc-700 outline-none ${getRadiusClass(cornerRadius, 'input')}`}
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className={`absolute right-0 left-0 md:left-auto md:right-0 z-30 mt-1.5 max-h-60 min-w-[180px] overflow-y-auto border border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#161617] p-1 shadow-lg ${getRadiusClass(cornerRadius, 'input')}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors rounded-lg ${
                option.value === value
                  ? 'bg-slate-50 dark:bg-[#2c2c2e] font-semibold text-slate-900 dark:text-[#f5f5f7]'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type CategoryOption = {
  value: string | null;
  label: string;
};

type CategoryDropdownProps = {
  value: string | null;
  onChange: (value: any) => void;
  options: CategoryOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

function CategoryDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon,
  disabled,
  cornerRadius = 'lg',
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchTerm]);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto min-w-[170px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-full items-center justify-between gap-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] px-3 text-sm font-medium text-slate-700 dark:text-[#f5f5f7] transition hover:bg-slate-50 dark:hover:bg-[#2c2c2e] focus:border-slate-350 dark:focus:border-zinc-700 outline-none ${getRadiusClass(cornerRadius, 'input')}`}
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className={`absolute right-0 left-0 md:left-auto md:right-0 z-30 mt-1.5 max-h-72 min-w-[190px] overflow-y-auto border border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#161617] p-1 shadow-lg focus:outline-none ${getRadiusClass(cornerRadius, 'input')}`}>
          {options.length > 8 && (
            <div className="p-1.5 border-b border-slate-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-[#161617] z-10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm danh mục..."
                className={`h-8 w-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] px-2.5 text-xs text-slate-700 dark:text-[#f5f5f7] outline-none focus:border-slate-300 dark:focus:border-zinc-700 transition-colors ${getRadiusClass(cornerRadius, 'input')}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors rounded-lg ${
                    option.value === value
                      ? 'bg-slate-50 dark:bg-[#2c2c2e] font-semibold text-slate-900 dark:text-[#f5f5f7]'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 text-center">Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesSkeleton />}>
      <CoursesContent />
    </Suspense>
  );
}

function CoursesContent() {
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const config = useCoursesListConfig();
  const router = useRouter();
  const { token } = useCustomerAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const urlPage = Math.max(Number(searchParams.get('page')) || 1, 1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc' | 'title' | 'title_desc'>('newest');
  const [categoryQuery, setCategoryQuery] = useState('');
  const postsPerPage = config.postsPerPage ?? 12;
  const [visibleLimit, setVisibleLimit] = useState(postsPerPage);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  } as any);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setVisibleLimit(postsPerPage);
  }, [debouncedSearch, level, postsPerPage, sortBy]);

  const categories = useQuery(api.courseCategories.listActive, { limit: 100 });
  const nonEmptyCategoryIds = useQuery(
    api.courseCategories.listNonEmptyCategoryIds,
    config.hideEmptyCategories ? { limit: 100 } : 'skip'
  );
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>();
    categories?.forEach((category) => { map.set(category._id, { name: category.name, slug: category.slug }); });
    return map;
  }, [categories]);

  const visibleCategories = useMemo(() => {
    if (!categories) {return [];}
    if (!config.hideEmptyCategories || !nonEmptyCategoryIds) {return categories;}
    const allowed = new Set(nonEmptyCategoryIds);
    return categories.filter((category) => allowed.has(category._id));
  }, [categories, config.hideEmptyCategories, nonEmptyCategoryIds]);

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return visibleCategories;
    return visibleCategories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [visibleCategories, categoryQuery]);

  const categorySlugFromPath = useMemo(() => {
    if (routeMode !== 'unified') {return null;}
    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment || segment === 'courses' || segment === 'khoa-hoc') {return null;}
    return segment;
  }, [pathname, routeMode]);

  const activeCategoryId = useMemo(() => {
    const categorySlug = categorySlugFromPath ?? searchParams.get('category');
    if (!categorySlug || !categories) {return null;}
    return categories.find((category) => category.slug === categorySlug)?._id ?? null;
  }, [categories, categorySlugFromPath, searchParams]);

  const activeCategoryName = useMemo(() => {
    if (!activeCategoryId || !categories) return null;
    return categories.find((category) => category._id === activeCategoryId)?.name ?? null;
  }, [activeCategoryId, categories]);

  const courseFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'courses', featureKey: 'enableCourseFilters' });
  const activeFilters = useQuery(api.courseFilters.listActive, {});
  const allFilterValues = useQuery(api.courseFilters.listAllValues, {});

  const activeFilterSlugs = useMemo(() => {
    const raw = searchParams.get('filter');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const activeValueIds = useMemo(() => {
    if (activeFilterSlugs.length === 0 || !allFilterValues) return [];
    return activeFilterSlugs
      .map((slug) => allFilterValues.find((v) => v.slug === slug)?._id)
      .filter((id): id is Id<'courseFilterValues'> => id !== undefined);
  }, [activeFilterSlugs, allFilterValues]);

  const isSearchActive = debouncedSearch.length > 0;
  const isPaginationMode = config.paginationType === 'pagination' || isSearchActive || level.length > 0 || activeFilterSlugs.length > 0;
  const offset = isPaginationMode ? (urlPage - 1) * postsPerPage : 0;
  const coursesLimit = isPaginationMode ? postsPerPage : visibleLimit;
  const courses = useQuery(api.courses.listPublishedWithOffset, {
    categoryId: activeCategoryId ?? undefined,
    level: level ? level as 'Beginner' | 'Intermediate' | 'Advanced' : undefined,
    limit: coursesLimit,
    offset,
    search: debouncedSearch || undefined,
    sortBy,
    valueIds: activeValueIds.length > 0 ? activeValueIds : undefined,
  });
  const totalCount = useQuery(api.courses.countPublished, {
    categoryId: activeCategoryId ?? undefined,
    level: level ? level as 'Beginner' | 'Intermediate' | 'Advanced' : undefined,
    search: debouncedSearch || undefined,
    valueIds: activeValueIds.length > 0 ? activeValueIds : undefined,
  });

  const courseIds = useMemo(() => courses?.map((c) => c._id) ?? [], [courses]);
  const assignments = useQuery(api.courseFilters.listAssignmentsByCourses, { courseIds: courseIds.length > 0 ? courseIds : [] });
  const _courseFiltersMap = useMemo(() => {
    const map = new Map<string, any[]>();
    assignments?.forEach((item) => {
      map.set(item.courseId, item.values);
    });
    return map;
  }, [assignments]);

  useEffect(() => {
    if (urlPage === 1) {return;}
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [activeCategoryId, debouncedSearch, level, searchParams, pathname, router, sortBy, urlPage]);

  const handleCategoryChange = useCallback((nextCategoryId: Id<'courseCategories'> | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (nextCategoryId) {
      const category = categories?.find((item) => item._id === nextCategoryId);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'courses' }), { scroll: false });
          return;
        }
        params.set('category', category.slug);
      }
    } else {
      params.delete('category');
    }

    const nextUrl = params.toString()
      ? `${buildModuleListPath('courses')}?${params.toString()}`
      : buildModuleListPath('courses');
    router.push(nextUrl, { scroll: false });
  }, [categories, routeMode, router, searchParams]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname, router, searchParams]);

  const handleFilterChange = useCallback((filterSlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (filterSlug === null) {
      params.delete('filter');
    } else {
      const current = params.get('filter')?.split(',').filter(Boolean) ?? [];
      let next: string[];
      if (current.includes(filterSlug)) {
        next = current.filter((s) => s !== filterSlug);
      } else {
        next = [...current, filterSlug];
      }
      if (next.length > 0) {
        params.set('filter', next.join(','));
      } else {
        params.delete('filter');
      }
    }
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  const courseItems = courses ?? [];
  const progressSummaries = useQuery(
    api.courses.getCourseProgressSummaries,
    courseItems.length > 0 ? { courseIds: courseItems.map((course) => course._id), token: token ?? undefined } : 'skip'
  );
  const progressMap = useMemo(() => {
    return new Map((progressSummaries ?? []).map((progress) => [progress.courseId, progress]));
  }, [progressSummaries]);
  const totalCourses = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCourses / postsPerPage));

  const isLoading = courses === undefined || categories === undefined;
  const hasMore = visibleLimit < totalCourses;

  useEffect(() => {
    if (isPaginationMode) {
      return;
    }
    if (inView && hasMore) {
      setVisibleLimit((current) => current + postsPerPage);
    }
  }, [inView, hasMore, postsPerPage, isPaginationMode]);

  const CourseGridCard = ({ course }: { course: typeof courseItems[number] }) => {
    const category = categoryMap.get(course.categoryId);
    const href = buildDetailPath({
      categorySlug: category?.slug,
      mode: routeMode,
      moduleKey: 'courses',
      recordSlug: course.slug,
    });
    const showPrice = course.isPriceVisible !== false;
    const progress = progressMap.get(course._id);
    const hasLearningAccess = Boolean(progress?.hasAccess);
    const progressPercent = progress?.progressPercent ?? 0;
    const cardRadiusClass = getRadiusClass(config.cornerRadius);

    return (
      <StorefrontCard
        layout="grid"
        href={href}
        image={course.thumbnail}
        imageAlt={course.title}
        fallbackIcon={<GraduationCap size={42} style={{ color: brandColors.primary }} />}
        categoryName={category?.name ?? 'Khóa học'}
        title={course.title}
        leftMetadata={
          <div className="space-y-2.5 w-full">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-[#86868b]">
              <span className="inline-flex items-center gap-1"><BookOpen size={12} className="text-slate-400" />{course.lessonCount} bài học</span>
              {course.durationText && <span className="inline-flex items-center gap-1"><Clock size={12} className="text-slate-400" />{course.durationText}</span>}
            </div>
            {hasLearningAccess && (
              <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ backgroundColor: brandColors.primary, width: `${progressPercent}%` }} />
              </div>
            )}
            <div className="flex items-center justify-between pt-1 text-xs font-semibold border-t mt-2" style={{ borderColor: isDark ? '#27272a' : '#e2e8f0' }}>
              <span className="group-hover:text-[var(--title-hover-color)] transition-colors" style={{ color: brandColors.primary, '--title-hover-color': brandColors.primary } as React.CSSProperties}>
                {hasLearningAccess ? `Tiến độ: ${progressPercent}%` : 'Xem khóa học →'}
              </span>
              {course.level && <span className="text-slate-450 dark:text-zinc-500">{getCourseLevelLabel(course.level)}</span>}
            </div>
          </div>
        }
        rightDetails={
          showPrice ? (
            <div className="text-sm font-bold w-full" style={{ color: brandColors.secondary || brandColors.primary }}>
              {formatPrice(course.pricingType, course.priceAmount)}
            </div>
          ) : undefined
        }
        brandColor={brandColors.primary}
        radiusClass={cardRadiusClass}
        isDark={isDark}
      />
    );
  };

  const CourseListCard = ({ course }: { course: typeof courseItems[number] }) => {
    const category = categoryMap.get(course.categoryId);
    const href = buildDetailPath({
      categorySlug: category?.slug,
      mode: routeMode,
      moduleKey: 'courses',
      recordSlug: course.slug,
    });
    const showPrice = course.isPriceVisible !== false;
    const progress = progressMap.get(course._id);
    const hasLearningAccess = Boolean(progress?.hasAccess);
    const progressPercent = progress?.progressPercent ?? 0;
    const cardRadiusClass = getRadiusClass(config.cornerRadius);

    return (
      <StorefrontCard
        layout="list"
        href={href}
        image={course.thumbnail}
        imageAlt={course.title}
        fallbackIcon={<GraduationCap size={28} style={{ color: brandColors.primary }} />}
        categoryName={category?.name ?? 'Khóa học'}
        title={course.title}
        description={course.excerpt}
        leftMetadata={
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-[#86868b]">
              <span className="inline-flex items-center gap-1"><BookOpen size={12} className="text-slate-400" />{course.lessonCount} bài học</span>
              {course.durationText && <span className="inline-flex items-center gap-1"><Clock size={12} className="text-slate-400" />{course.durationText}</span>}
              {course.instructorName && <span className="inline-flex items-center gap-1"><UserRound size={12} className="text-slate-400" />{course.instructorName}</span>}
            </div>
            {hasLearningAccess && (
              <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ backgroundColor: brandColors.primary, width: `${progressPercent}%` }} />
              </div>
            )}
          </div>
        }
        rightDetails={
          <div className="flex flex-col items-start md:items-end justify-center gap-2 w-full">
            {hasLearningAccess ? (
              <span className="text-xs font-semibold" style={{ color: brandColors.primary }}>Tiến độ: {progressPercent}%</span>
            ) : showPrice ? (
              <span className="text-sm font-bold" style={{ color: brandColors.secondary || brandColors.primary }}>{formatPrice(course.pricingType, course.priceAmount)}</span>
            ) : null}
          </div>
        }
        ctaLabel={hasLearningAccess ? 'Vào học' : 'Xem khóa học'}
        brandColor={brandColors.primary}
        radiusClass={cardRadiusClass}
        isDark={isDark}
      />
    );
  };

  const sidebarFilters = () => (
    <div className="space-y-4">
      {config.showCategories && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2 dark:text-[#f5f5f7]">Danh mục</h3>
          {visibleCategories.length > 8 && (
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Tìm nhanh danh mục..."
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                className={`w-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-[#f5f5f7] py-2 pl-9 pr-9 text-xs outline-none transition-colors focus:border-slate-350 dark:focus:border-zinc-700 ${getRadiusClass(config.cornerRadius, 'input')}`}
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {categoryQuery && (
                <button type="button" onClick={() => setCategoryQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 opacity-60 hover:opacity-100">
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          <div className={`space-y-1 ${visibleCategories.length > 8 ? 'max-h-60 overflow-y-auto pr-1' : ''}`}>
            <button
              onClick={() => handleCategoryChange(null)}
              className={`w-full py-2 px-3.5 rounded-lg text-left text-sm transition-colors border border-transparent ${!activeCategoryId ? 'font-semibold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
              style={!activeCategoryId ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary, borderColor: isDark ? '#3a3a3c' : 'transparent' } : undefined}
            >
              Tất cả danh mục
            </button>
            {filteredCategories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleCategoryChange(cat._id)}
                className={`w-full py-2 px-3.5 rounded-lg text-left text-sm transition-colors border border-transparent ${activeCategoryId === cat._id ? 'font-semibold' : 'text-slate-600 dark:text-zinc-405 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                style={activeCategoryId === cat._id ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary, borderColor: isDark ? '#3a3a3c' : 'transparent' } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {config.showLevelFilter && (
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800/50">
          <h3 className="font-semibold text-sm flex items-center gap-2 dark:text-[#f5f5f7]">Trình độ</h3>
          <div className="space-y-1">
            {[
              { value: '', label: 'Tất cả trình độ' },
              ...COURSE_LEVEL_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLevel(opt.value)}
                className={`w-full py-2 px-3.5 rounded-lg text-left text-sm transition-colors border border-transparent ${level === opt.value ? 'font-semibold' : 'text-slate-600 dark:text-zinc-405 hover:bg-slate-100/55 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                style={level === opt.value ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary, borderColor: isDark ? '#3a3a3c' : 'transparent' } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {courseFiltersFeature?.enabled && activeFilters && allFilterValues && activeFilters.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800/50">
          <h3 className="font-semibold text-sm flex items-center gap-2 dark:text-[#f5f5f7]">Bộ lọc khóa học</h3>
          <div className="space-y-3">
            {activeFilters.map((filter) => {
              const childValues = allFilterValues.filter((v) => v.filterId === filter._id && v.active);
              if (childValues.length === 0) return null;
              return (
                <div key={filter._id} className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider px-1">
                    {filter.name}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {childValues.map((val) => {
                      const isValActive = activeFilterSlugs.includes(val.slug);
                      return (
                        <button
                          key={val._id}
                          onClick={() => handleFilterChange(val.slug)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition inline-flex items-center gap-1.5 ${isValActive ? '' : 'border-slate-205 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                          style={isValActive ? { backgroundColor: brandColors.primary, borderColor: brandColors.primary, color: '#fff' } : undefined}
                        >
                          {val.icon && (
                            <img src={val.icon} alt={val.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                          )}
                          <span>{val.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const toolbarFilters = () => (
    <div className="flex items-center gap-2">
      {config.showCategories && (
        <CategoryDropdown
          value={activeCategoryId}
          onChange={handleCategoryChange}
          options={[
            { value: null, label: 'Tất cả danh mục' },
            ...visibleCategories.map((category) => ({ value: category._id, label: category.name })),
          ]}
          icon={<Bookmark size={16} className="text-slate-400" />}
          cornerRadius={config.cornerRadius}
        />
      )}
      {config.showLevelFilter && (
        <CustomDropdown
          value={level}
          onChange={setLevel}
          options={[
            { value: '', label: 'Tất cả trình độ' },
            ...COURSE_LEVEL_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
          ]}
          icon={<GraduationCap size={16} className="text-slate-400" />}
          cornerRadius={config.cornerRadius}
        />
      )}
      {courseFiltersFeature?.enabled && allFilterValues && allFilterValues.filter(v => v.active).length > 0 && (
        <CustomDropdown
          value={activeFilterSlugs.length === 1 ? activeFilterSlugs[0] : ''}
          onChange={(value) => handleFilterChange(value || null)}
          options={[
            { value: '', label: 'Tất cả phần mềm' },
            ...allFilterValues.filter(v => v.active).map((val) => ({ value: val.slug, label: val.name })),
          ]}
          placeholder={activeFilterSlugs.length > 1 ? `Đã chọn (${activeFilterSlugs.length})` : 'Tất cả phần mềm'}
          icon={<Filter size={16} className="text-slate-400" />}
          cornerRadius={config.cornerRadius}
        />
      )}
    </div>
  );

  const mobileFilters = (closeSheet: () => void) => (
    <div className="space-y-5">
      {config.showCategories && (
        <div className="space-y-2">
          <h4 className="font-bold text-sm dark:text-[#f5f5f7]">Danh mục</h4>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { handleCategoryChange(null); closeSheet(); }}
              className={`w-full py-2 px-3.5 rounded-lg text-left text-sm transition-colors border border-transparent ${!activeCategoryId ? 'font-semibold' : 'text-slate-655 dark:text-zinc-400 hover:bg-slate-105'}`}
              style={!activeCategoryId ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary } : undefined}
            >
              Tất cả danh mục
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => { handleCategoryChange(cat._id); closeSheet(); }}
                className={`w-full py-2 px-3.5 rounded-lg text-left text-sm transition-colors border border-transparent ${activeCategoryId === cat._id ? 'font-semibold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-105'}`}
                style={activeCategoryId === cat._id ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {config.showLevelFilter && (
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <h4 className="font-bold text-sm dark:text-[#f5f5f7]">Trình độ</h4>
          <div className="flex flex-col gap-1">
            {[
              { value: '', label: 'Tất cả trình độ' },
              ...COURSE_LEVEL_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setLevel(opt.value); closeSheet(); }}
                className={`w-full py-2 px-3.5 rounded-lg text-left text-sm transition-colors border border-transparent ${level === opt.value ? 'font-semibold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-105'}`}
                style={level === opt.value ? { backgroundColor: isDark ? '#2c2c2e' : `${brandColors.primary}18`, color: brandColors.primary } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {courseFiltersFeature?.enabled && activeFilters && allFilterValues && activeFilters.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <h4 className="font-bold text-sm dark:text-[#f5f5f7]">Bộ lọc thuộc tính</h4>
          <div className="space-y-4">
            {activeFilters.map((filter) => {
              const childValues = allFilterValues.filter((v) => v.filterId === filter._id && v.active);
              if (childValues.length === 0) return null;
              return (
                <div key={filter._id} className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    {filter.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {childValues.map((val) => {
                      const isValActive = activeFilterSlugs.includes(val.slug);
                      return (
                        <button
                          key={val._id}
                          onClick={() => { handleFilterChange(val.slug); }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition inline-flex items-center gap-1.5 ${isValActive ? '' : 'border-slate-205 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100/55 dark:hover:bg-[#2c2c2e] hover:text-slate-900 dark:hover:text-[#f5f5f7]'}`}
                          style={isValActive ? { backgroundColor: brandColors.primary, borderColor: brandColors.primary, color: '#fff' } : undefined}
                        >
                          {val.icon && (
                            <img src={val.icon} alt={val.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                          )}
                          <span>{val.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const paginationBar = isPaginationMode && totalPages > 1 && (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <div className="order-2 flex w-full items-center justify-between text-sm sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-zinc-400">Hiển thị</span>
          <select
            value={postsPerPage}
            onChange={(_event) => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('page');
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] px-2 text-sm font-medium shadow-sm focus:outline-none text-slate-705 dark:text-[#f5f5f7]"
            aria-label="Số khóa học mỗi trang"
          >
            {[12, 20, 24, 48].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-slate-500 dark:text-zinc-400">khóa học/trang</span>
        </div>

        <div>
          <span className="font-medium text-slate-900 dark:text-[#f5f5f7]">
            {totalCourses ? ((urlPage - 1) * postsPerPage) + 1 : 0}–{Math.min(urlPage * postsPerPage, totalCourses)}
          </span>
          <span className="mx-1 text-slate-300 dark:text-zinc-700">/</span>
          <span className="font-medium text-slate-900 dark:text-[#f5f5f7]">{totalCourses}</span>
          <span className="ml-1 text-slate-500">khóa học</span>
        </div>
      </div>

      <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
        <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
          <button
            onClick={() => handlePageChange(urlPage - 1)}
            disabled={urlPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] text-slate-705 dark:text-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang trước"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>

          {generatePaginationItems(urlPage, totalPages).map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">
                  …
                </div>
              );
            }

            const pageNum = item as number;
            const isActive = pageNum === urlPage;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-sm border font-medium'
                    : 'text-slate-700 dark:text-[#f5f5f7] hover:bg-slate-50 dark:hover:bg-[#2c2c2e]'
                }`}
                style={isActive ? {
                  backgroundColor: brandColors.primary,
                  borderColor: brandColors.primary,
                  color: '#fff',
                } : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(urlPage + 1)}
            disabled={urlPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] text-slate-705 dark:text-[#f5f5f7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Trang sau"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </nav>
      </div>
    </div>
  );

  const infiniteScrollTrigger = !isPaginationMode && (
    <>
      {hasMore && (
        <div ref={loadMoreRef} className="text-center py-6 w-full animate-pulse">
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <div className="w-2 h-2 rounded-full bg-slate-400 delay-75" />
            <div className="w-2 h-2 rounded-full bg-slate-400 delay-150" />
          </div>
        </div>
      )}
      {!hasMore && courseItems.length > 0 && (
        <div className="text-center py-6 w-full">
          <p className="text-sm text-slate-450 dark:text-zinc-500">Đã hiển thị tất cả {courseItems.length} khóa học</p>
        </div>
      )}
    </>
  );

  return (
    <div className="flex-1 w-full font-active">
      <SharedListLayout
        items={courseItems}
        totalCount={totalCourses}
        isLoading={isLoading}
        unit="khóa học"
        layoutStyle={config.layoutStyle}
        gridColumns={config.gridColumns}
        cornerRadius={config.cornerRadius}
        showSearch={config.showSearch}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm khóa học..."
        sortBy={sortBy}
        onSortChange={(val) => setSortBy(val)}
        sortOptions={[
          { value: 'newest', label: 'Mới nhất' },
          { value: 'popular', label: 'Xem nhiều nhất' },
          { value: 'title', label: 'Tên A-Z' },
          { value: 'title_desc', label: 'Tên Z-A' },
          { value: 'price_asc', label: 'Giá tăng dần' },
          { value: 'price_desc', label: 'Giá giảm dần' },
        ]}
        hasActiveFilters={!!activeCategoryId || !!search || !!level || activeFilterSlugs.length > 0}
        onClearFilters={() => {
          setSearch('');
          setDebouncedSearch('');
          setLevel('');
          setSortBy('newest');
          handleCategoryChange(null);
          handleFilterChange(null);
        }}
        renderItem={(course) => config.layoutStyle === 'list' ? <CourseListCard key={course._id} course={course} /> : <CourseGridCard key={course._id} course={course} />}
        renderSkeleton={() => (
          config.layoutStyle === 'list' ? (
            <div className="space-y-4">
              {Array.from({ length: postsPerPage }).map((_, index) => (
                <div key={index} className={`h-28 animate-pulse border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] ${getRadiusClass(config.cornerRadius)}`} />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {Array.from({ length: postsPerPage }).map((_, index) => (
                <div key={index} className={`h-72 animate-pulse border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] ${getRadiusClass(config.cornerRadius)}`} />
              ))}
            </div>
          )
        )}
        renderSidebarFilters={sidebarFilters}
        renderToolbarFilters={toolbarFilters}
        renderMobileFilters={mobileFilters}
        paginationNode={paginationBar}
        infiniteScrollTriggerNode={infiniteScrollTrigger}
        headerTitle={activeCategoryName ?? 'Khóa học'}
        brandColor={brandColors.primary}
        isDark={isDark}
      />
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black px-4 py-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="mx-auto h-9 w-56 animate-pulse rounded bg-slate-200 dark:bg-[#161617]" />
        <div className="h-16 animate-pulse rounded-2xl bg-white dark:bg-[#161617] border border-slate-200 dark:border-zinc-800" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-xl bg-white dark:bg-[#161617] border border-slate-200 dark:border-zinc-800" />)}
        </div>
      </div>
    </main>
  );
}
