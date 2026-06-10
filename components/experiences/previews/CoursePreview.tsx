import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Bookmark, ChevronDown, ChevronLeft, ChevronRight, Clock, Download, Eye, FileText, Filter, GraduationCap, Lock, PlayCircle, Search, SlidersHorizontal, Star, UserRound, X, CheckCircle2 } from 'lucide-react';
import { getRadiusClass, getSmallRadiusClass, formatPrice } from '@/lib/courses/courseUtils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type CoursesListLayoutStyle = 'grid' | 'sidebar' | 'list';
type CourseDetailLayoutStyle = 'classic' | 'modern' | 'minimal';
type PaginationType = 'pagination' | 'infiniteScroll';

type CoursesListPreviewProps = {
  layoutStyle: CoursesListLayoutStyle;
  gridColumns?: number;
  paginationType?: PaginationType;
  showSearch?: boolean;
  showCategories?: boolean;
  showLevelFilter?: boolean;
  hideEmptyCategories?: boolean;
  postsPerPage?: number;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

const getItemRadiusClass = (radius?: 'none' | 'sm' | 'lg') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') return 'rounded';
  return 'rounded-lg';
};

type CourseDetailPreviewProps = {
  layoutStyle: CourseDetailLayoutStyle;
  showCurriculum?: boolean;
  showInstructor?: boolean;
  showRelated?: boolean;
  showStickyCta?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

type LessonDetailPreviewProps = {
  layoutStyle: 'classic' | 'focus' | 'compact';
  showSidebar?: boolean;
  showLessonNavigation?: boolean;
  showExerciseDownload?: boolean;
  showCourseBreadcrumb?: boolean;
  lockWallStyle?: 'overlay' | 'card';
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

const MOCK_COURSES = [
  { title: 'Lộ trình Revit Architecture thực chiến', category: 'Frontend', level: 'Trung cấp', lessons: 42, duration: '18 giờ', price: '2.900.000đ', featured: true, excerpt: 'Xây dựng bản vẽ kiến trúc 3D chuyên nghiệp bằng Revit từ cơ bản.', instructorName: 'Nguyễn Minh Đức', filters: [{ name: 'Revit' }, { name: 'Enscape' }] },
  { title: 'AutoCAD căn bản cho người mới', category: 'Cơ bản', level: 'Cơ bản', lessons: 28, duration: '10 giờ', price: 'Miễn phí', excerpt: 'Nắm vững kiến thức AutoCAD cơ bản triển khai bản vẽ 2D kỹ thuật.', instructorName: 'Trần Văn Sơn', filters: [{ name: 'AutoCAD' }] },
  { title: '3DS Max & Vray Render Nội Thất', category: 'Chuyên sâu', level: 'Nâng cao', lessons: 36, duration: '24 giờ', price: '4.500.000đ', excerpt: 'Tạo dựng phối cảnh 3D nội thất và render ánh sáng chân thực với Vray.', instructorName: 'Hoàng Anh Tuấn', filters: [{ name: '3DS Max' }, { name: 'Vray' }] },
  { title: 'SketchUp dựng hình nhanh', category: 'Frontend', level: 'Nâng cao', lessons: 31, duration: '14 giờ', price: '1.900.000đ', excerpt: 'Làm chủ SketchUp dựng hình kiến trúc ngoại thất cực kỳ nhanh chóng.', instructorName: 'Lê Huy Hoàng', filters: [{ name: 'SketchUp' }] },
];

const MOCK_CATEGORIES = [
  { label: 'Tất cả' },
  { label: 'Cơ bản' },
  { label: 'Frontend' },
  { label: 'Chuyên sâu' },
  { empty: true, label: 'Doanh nghiệp' },
];

const resolveSecondary = (primary: string, secondary?: string, mode?: 'single' | 'dual') =>
  mode === 'dual' && secondary ? secondary : primary;

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
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const buttonRadiusClass = getSmallRadiusClass(cornerRadius);
  const menuRadiusClass = getSmallRadiusClass(cornerRadius);
  const itemRadiusClass = getItemRadiusClass(cornerRadius);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto min-w-[155px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-full items-center justify-between gap-1.5 border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-slate-300 outline-none ${buttonRadiusClass}`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className={`absolute right-0 left-0 md:left-auto md:right-0 z-30 mt-1 max-h-60 min-w-[170px] overflow-y-auto border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${menuRadiusClass}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-2.5 py-1.5 text-left text-xs transition-colors ${itemRadiusClass} ${
                option.value === value
                  ? 'bg-slate-50 font-semibold text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
  value: string;
  label: string;
};

type CategoryDropdownProps = {
  value: string;
  onChange: (value: string) => void;
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
  }, []);

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

  const buttonRadiusClass = getSmallRadiusClass(cornerRadius);
  const menuRadiusClass = getSmallRadiusClass(cornerRadius);
  const searchRadiusClass = getItemRadiusClass(cornerRadius);
  const itemRadiusClass = getItemRadiusClass(cornerRadius);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto min-w-[155px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-full items-center justify-between gap-1.5 border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-slate-300 outline-none ${buttonRadiusClass}`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className={`absolute right-0 left-0 md:left-auto md:right-0 z-30 mt-1 max-h-72 min-w-[170px] overflow-y-auto border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${menuRadiusClass}`}>
          {options.length > 8 && (
            <div className="p-1 border-b border-slate-100 sticky top-0 bg-white z-10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm danh mục..."
                className={`h-7 w-full border border-slate-200 px-2 text-[10px] outline-none focus:border-slate-300 transition-colors ${searchRadiusClass}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-2.5 py-1.5 text-left text-xs transition-colors ${itemRadiusClass} ${
                    option.value === value
                      ? 'bg-slate-50 font-semibold text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-2 py-1.5 text-[10px] text-slate-400 text-center">Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCard({
  brandColor,
  className = '',
  course,
  secondaryColor,
  cornerRadius = 'lg',
  showFilters = false,
}: {
  brandColor: string;
  className?: string;
  course: typeof MOCK_COURSES[number];
  secondaryColor: string;
  cornerRadius?: 'none' | 'sm' | 'lg';
  showFilters?: boolean;
}) {
  const radiusClass = getRadiusClass(cornerRadius);
  return (
    <article className={`overflow-hidden ${radiusClass} border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer group ${className}`}>
      <div className="relative flex aspect-video items-center justify-center bg-slate-100" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${secondaryColor}22)` }}>
        <GraduationCap size={40} style={{ color: brandColor }} />
        {course.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white">
            <Star size={11} className="fill-current" /> Nổi bật
          </span>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full px-2 py-1 font-medium" style={{ backgroundColor: `${brandColor}18`, color: brandColor }}>{course.category}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{course.level}</span>
        </div>
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900 transition-colors group-hover:text-slate-700">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-500">{course.excerpt}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><BookOpen size={13} />{course.lessons} bài</span>
          <span className="inline-flex items-center gap-1"><Clock size={13} />{course.duration}</span>
          <span className="inline-flex items-center gap-1"><UserRound size={13} />{course.instructorName}</span>
        </div>
        {showFilters && course.filters && course.filters.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {course.filters.map((filter, index) => (
              <span key={index} className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 border border-slate-200">
                <span>{filter.name}</span>
              </span>
            ))}
          </div>
        )}
        {course.price && (
          <div className="border-t border-slate-100 pt-3 font-bold" style={{ color: secondaryColor || brandColor }}>
            {course.price}
          </div>
        )}
      </div>
    </article>
  );
}

function FeaturedCourseCard({
  brandColor,
  className = '',
  course,
  secondaryColor,
  cornerRadius = 'lg',
  showFilters = false,
}: {
  brandColor: string;
  className?: string;
  course: typeof MOCK_COURSES[number];
  secondaryColor: string;
  cornerRadius?: 'none' | 'sm' | 'lg';
  showFilters?: boolean;
}) {
  const radiusClass = getRadiusClass(cornerRadius);
  return (
    <article className={`overflow-hidden ${radiusClass} border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row transition hover:-translate-y-1 hover:shadow-md cursor-pointer group ${className}`}>
      {/* Thumbnail Area - ~42% width on desktop */}
      <div className="relative flex aspect-video md:aspect-auto md:w-[42%] items-center justify-center bg-slate-100 shrink-0 min-h-[200px]" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${secondaryColor}22)` }}>
        <GraduationCap size={48} style={{ color: brandColor }} />
        {course.featured && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            <Star size={12} className="fill-current" /> Nổi bật
          </span>
        )}
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-between p-5 md:p-6 space-y-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full px-2.5 py-1 font-semibold" style={{ backgroundColor: `${brandColor}18`, color: brandColor }}>{course.category}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{course.level}</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug group-hover:text-slate-700">{course.title}</h3>
          <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{course.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
            <span className="inline-flex items-center gap-1.5"><BookOpen size={14} className="text-slate-400" />{course.lessons} bài học</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-slate-400" />{course.duration}</span>
            <span className="inline-flex items-center gap-1.5"><UserRound size={14} className="text-slate-400" />{course.instructorName}</span>
          </div>
          {showFilters && course.filters && course.filters.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {course.filters.map((filter, index) => (
                <span key={index} className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 border border-slate-200">
                  <span>{filter.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Học phí</span>
            <span className="text-lg font-bold" style={{ color: secondaryColor }}>{course.price}</span>
          </div>
          <span className="rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow transition-all" style={{ backgroundColor: brandColor }}>Xem khóa học</span>
        </div>
      </div>
    </article>
  );
}

export function CoursesListPreview({
  layoutStyle,
  gridColumns = 3,
  paginationType = 'pagination',
  showSearch = true,
  showCategories = true,
  showLevelFilter = true,
  hideEmptyCategories = true,
  postsPerPage = 12,
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
  cornerRadius = 'lg',
}: CoursesListPreviewProps) {
  const accent = resolveSecondary(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';

  const courseFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'courses', featureKey: 'enableCourseFilters' });

  const [searchVal, setSearchVal] = useState('');
  const [activeCat, setActiveCat] = useState('Tất cả');
  const [levelVal, setLevelVal] = useState('');
  const [filterVal, setFilterVal] = useState('');
  const [sortByVal, setSortByVal] = useState('newest');
  const [categoryQuery, setCategoryQuery] = useState('');

  // Lọc khóa học giả lập cho Preview thêm sống động
  const processedCourses = useMemo(() => {
    let list = [...MOCK_COURSES];
    
    if (activeCat !== 'Tất cả') {
      list = list.filter(c => c.category === activeCat);
    }
    
    if (levelVal) {
      list = list.filter(c => c.level === levelVal);
    }

    if (filterVal) {
      list = list.filter(c => c.filters?.some(f => f.name === filterVal));
    }
    
    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q));
    }
    
    if (sortByVal === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortByVal === 'price_asc') {
      const getPriceVal = (p: string) => {
        if (p === 'Miễn phí') return 0;
        return Number(p.replace(/[^0-9]/g, '')) || 0;
      };
      list.sort((a, b) => getPriceVal(a.price) - getPriceVal(b.price));
    } else if (sortByVal === 'price_desc') {
      const getPriceVal = (p: string) => {
        if (p === 'Miễn phí') return 0;
        return Number(p.replace(/[^0-9]/g, '')) || 0;
      };
      list.sort((a, b) => getPriceVal(b.price) - getPriceVal(a.price));
    }
    
    return list;
  }, [activeCat, levelVal, filterVal, searchVal, sortByVal]);

  const courses = layoutStyle === 'list' ? processedCourses : processedCourses.slice(0, isMobile ? 2 : 4);
  const visibleCategories = hideEmptyCategories ? MOCK_CATEGORIES.filter((category) => !category.empty) : MOCK_CATEGORIES;

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return visibleCategories;
    return visibleCategories.filter((cat) => cat.label.toLowerCase().includes(query));
  }, [visibleCategories, categoryQuery]);

  const filterPanel = (showSearch || showCategories || showLevelFilter) ? (
    layoutStyle === 'sidebar' ? (
      <div className="space-y-4">
        {showSearch && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <Search size={12} className="text-slate-400" />
              Tìm kiếm
            </h3>
            <div className="relative">
              <input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className={`h-9 w-full border border-slate-200 pl-8 pr-2.5 text-xs outline-none focus:border-slate-300 transition-colors ${getSmallRadiusClass(cornerRadius)}`}
                placeholder="Tìm khóa học..."
              />
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}

        {showCategories && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <Bookmark size={12} className="text-slate-400" />
              Danh mục khóa học
            </h3>
            {visibleCategories.length > 8 && (
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Tìm nhanh danh mục..."
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  className={`w-full pl-8 pr-8 py-1.5 border border-slate-200 text-[10px] outline-none focus:border-slate-300 transition-colors ${getSmallRadiusClass(cornerRadius)}`}
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                {categoryQuery && (
                  <button
                    onClick={() => setCategoryQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 opacity-60 hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            <div className={`space-y-1 ${visibleCategories.length > 8 ? 'max-h-60 overflow-y-auto pr-1' : ''}`}>
              {(!categoryQuery || 'tất cả danh mục'.includes(categoryQuery.toLowerCase())) && (
                <button
                  onClick={() => setActiveCat('Tất cả')}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${activeCat === 'Tất cả' ? 'font-semibold' : ''}`}
                  style={activeCat === 'Tất cả'
                    ? { backgroundColor: `${brandColor}18`, color: brandColor }
                    : { backgroundColor: 'transparent', color: '#475569' }
                  }
                >
                  Tất cả danh mục
                </button>
              )}
              {filteredCategories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCat(cat.label)}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${activeCat === cat.label ? 'font-semibold' : ''}`}
                  style={activeCat === cat.label
                    ? { backgroundColor: `${brandColor}18`, color: brandColor }
                    : { backgroundColor: 'transparent', color: '#475569' }
                  }
                >
                  {cat.label}
                </button>
              ))}
              {visibleCategories.length > 8 && filteredCategories.length === 0 && (
                <div className="px-2 py-1.5 text-[10px] text-slate-400 text-center">
                  Không tìm thấy kết quả.
                </div>
              )}
            </div>
          </div>
        )}

        {showLevelFilter && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <GraduationCap size={12} className="text-slate-400" />
              Trình độ
            </h3>
            <div className="space-y-1">
              {[
                { value: '', label: 'Tất cả trình độ' },
                { value: 'Cơ bản', label: 'Cơ bản' },
                { value: 'Trung cấp', label: 'Trung cấp' },
                { value: 'Nâng cao', label: 'Nâng cao' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLevelVal(opt.value)}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${levelVal === opt.value ? 'font-semibold' : ''}`}
                  style={levelVal === opt.value
                    ? { backgroundColor: `${brandColor}18`, color: brandColor }
                    : { backgroundColor: 'transparent', color: '#475569' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {courseFiltersFeature?.enabled && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <Filter size={12} className="text-slate-400" />
              Phần mềm
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setFilterVal('')}
                className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${!filterVal ? 'font-semibold' : ''}`}
                style={!filterVal
                  ? { backgroundColor: `${brandColor}18`, color: brandColor }
                  : { backgroundColor: 'transparent', color: '#475569' }
                }
              >
                Tất cả phần mềm
              </button>
              {['Revit', 'AutoCAD', '3DS Max', 'SketchUp'].map((name) => (
                <button
                  key={name}
                  onClick={() => setFilterVal(name)}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${filterVal === name ? 'font-semibold' : ''}`}
                  style={filterVal === name
                    ? { backgroundColor: `${brandColor}18`, color: brandColor }
                    : { backgroundColor: 'transparent', color: '#475569' }
                  }
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className={`border border-slate-200 bg-white p-4 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
            {showSearch && (
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className={`h-9 w-full border border-slate-200 pl-8 pr-2.5 text-xs outline-none focus:border-slate-300 transition-colors ${getSmallRadiusClass(cornerRadius)}`}
                  placeholder="Tìm khóa học..."
                />
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {showCategories && (
              <CategoryDropdown
                value={activeCat}
                onChange={setActiveCat}
                options={[
                  { value: 'Tất cả', label: 'Tất cả danh mục' },
                  ...visibleCategories.map((category) => ({ value: category.label, label: category.label })),
                ]}
                icon={<Bookmark size={14} className="text-slate-400" />}
                cornerRadius={cornerRadius}
              />
            )}
            {showLevelFilter && (
              <CustomDropdown
                value={levelVal}
                onChange={setLevelVal}
                options={[
                  { value: '', label: 'Tất cả trình độ' },
                  { value: 'Cơ bản', label: 'Cơ bản' },
                  { value: 'Trung cấp', label: 'Trung cấp' },
                  { value: 'Nâng cao', label: 'Nâng cao' },
                ]}
                icon={<GraduationCap size={14} className="text-slate-400" />}
                cornerRadius={cornerRadius}
              />
            )}
            {courseFiltersFeature?.enabled && (
              <CustomDropdown
                value={filterVal}
                onChange={setFilterVal}
                options={[
                  { value: '', label: 'Tất cả phần mềm' },
                  ...['Revit', 'AutoCAD', '3DS Max', 'SketchUp'].map((name) => ({ value: name, label: name })),
                ]}
                icon={<Filter size={14} className="text-slate-400" />}
                cornerRadius={cornerRadius}
              />
            )}
            <CustomDropdown
              value={sortByVal}
              onChange={setSortByVal}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'popular', label: 'Xem nhiều' },
                { value: 'title', label: 'Tên A-Z' },
                { value: 'price_asc', label: 'Giá tăng dần' },
                { value: 'price_desc', label: 'Giá giảm dần' },
              ]}
              icon={<SlidersHorizontal size={14} className="text-slate-400" />}
              cornerRadius={cornerRadius}
            />
          </div>
        </div>
      </div>
    )
  ) : null;

  return (
    <div className="bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeCat === 'Tất cả' ? 'Khóa học' : activeCat}
          </h1>
        </div>

        {layoutStyle !== 'sidebar' && filterPanel}

        <div className={layoutStyle === 'sidebar' ? 'grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]' : ''}>
          {layoutStyle === 'sidebar' && filterPanel}
          
          <div className="space-y-4 flex-1 min-w-0">
            {/* Toolbar ngang */}
            <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 mb-2">
              <p className="text-xs text-slate-500 font-medium">
                Hiển thị <span className="font-semibold text-slate-700">{courses.length}</span>
                {processedCourses.length > courses.length && <> / <span className="font-semibold text-slate-700">{processedCourses.length}</span></>} khóa học
              </p>
              
              {layoutStyle === 'sidebar' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Sắp xếp:</span>
                  <CustomDropdown
                    value={sortByVal}
                    onChange={setSortByVal}
                    options={[
                      { value: 'newest', label: 'Mới nhất' },
                      { value: 'popular', label: 'Xem nhiều' },
                      { value: 'title', label: 'Tên A-Z' },
                      { value: 'price_asc', label: 'Giá tăng dần' },
                      { value: 'price_desc', label: 'Giá giảm dần' },
                    ]}
                    icon={<SlidersHorizontal size={12} className="text-slate-400" />}
                    cornerRadius={cornerRadius}
                  />
                </div>
              )}
            </div>

            <div className={
              layoutStyle === 'list'
                ? 'grid gap-5 grid-cols-1'
                : gridColumns === 4
                  ? 'grid gap-5 grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
                  : 'grid gap-5 grid-cols-1 md:grid-cols-3 lg:grid-cols-3'
            }>
              {courses.map((course) => {
                if (layoutStyle === 'list') {
                  return (
                    <FeaturedCourseCard
                      key={course.title}
                      course={course}
                      brandColor={brandColor}
                      secondaryColor={accent}
                      cornerRadius={cornerRadius}
                      showFilters={courseFiltersFeature?.enabled}
                    />
                  );
                }
                return (
                  <CourseCard
                    key={course.title}
                    course={course}
                    brandColor={brandColor}
                    secondaryColor={accent}
                    cornerRadius={cornerRadius}
                    showFilters={courseFiltersFeature?.enabled}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center">
          {paginationType === 'pagination' ? (
            <span className="inline-flex rounded-lg px-5 py-2 text-sm font-medium text-white" style={{ backgroundColor: brandColor }}>
              {postsPerPage} khóa học/trang · 1&nbsp;&nbsp;2&nbsp;&nbsp;3&nbsp;&nbsp;...
            </span>
          ) : (
            <span className="text-sm text-slate-500">Cuộn để xem thêm khóa học...</span>
          )}
        </div>
      </div>
    </div>
  );
}

type MockLesson = { order: number; title: string };
type MockChapter = { title: string; lessons: MockLesson[] };

const MOCK_CHAPTERS: MockChapter[] = [
  {
    title: 'Nền tảng xây dựng trang',
    lessons: [
      { order: 1, title: 'Giới thiệu khóa học & Lộ trình thực chiến' },
      { order: 2, title: 'Thiết lập dự án Next.js 15 mới nhất' },
      { order: 3, title: 'Cấu trúc thư mục App Router & Routing' }
    ]
  },
  {
    title: 'Kết nối và hiển thị dữ liệu',
    lessons: [
      { order: 1, title: 'Làm quen với Convex DB Serverless' },
      { order: 2, title: 'Viết Schema & kết nối Query dữ liệu động' },
      { order: 3, title: 'Xử lý Mutation & bảo mật dữ liệu đầu vào' }
    ]
  },
  {
    title: 'Đăng nhập, SEO và đưa lên online',
    lessons: [
      { order: 1, title: 'Tích hợp xác thực với Convex Auth' },
      { order: 2, title: 'Tối ưu SEO nâng cao & cấu hình Metadata' },
      { order: 3, title: 'Triển khai dự án lên Vercel sản xuất' }
    ]
  }
];

const MOCK_RELATED_PREVIEWS = [
  { slug: 'react-can-ban-cho-nguoi-moi', title: 'React căn bản cho người mới' },
  { slug: 'typescript-nang-cao', title: 'TypeScript nâng cao' },
  { slug: 'thiet-ke-he-thong-saas', title: 'Thiết kế hệ thống SaaS' }
];

export function CourseDetailPreview({
  layoutStyle,
  showCurriculum = true,
  showInstructor = true,
  showRelated = true,
  showStickyCta = true,
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
  cornerRadius = 'lg',
}: CourseDetailPreviewProps) {
  const accent = useMemo(() => {
    if (colorMode === 'single' || !secondaryColor) {
      return brandColor + 'dd';
    }
    return secondaryColor;
  }, [brandColor, secondaryColor, colorMode]);

  const isModern = layoutStyle === 'modern';
  const isMobile = device === 'mobile';

  const radiusClass = getRadiusClass(cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(cornerRadius);

  // Quản lý trạng thái Accordion cho Preview
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({ 0: true });
  const toggleChapter = (index: number) => {
    setOpenChapters((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const showAside = showStickyCta || showRelated;

  return (
    <div className="bg-white relative pb-16 lg:pb-0">
      <section className={`border-b border-slate-100 px-4 ${isModern ? 'py-10 text-white' : 'py-8'}`} style={isModern ? { background: `linear-gradient(135deg, ${brandColor}, ${accent})` } : undefined}>
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl space-y-4">
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: isModern ? 'rgba(255,255,255,.18)' : `${brandColor}12`, color: isModern ? '#fff' : '#334155' }}>
              Frontend · Trung cấp
            </span>
            <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold leading-tight mt-2 ${isModern ? 'text-white' : 'text-slate-900'}`}>Lộ trình Next.js thực chiến</h1>
            <p className={`max-w-2xl text-base mt-2.5 ${isModern ? 'text-white/80' : 'text-slate-600'}`}>Xây dựng website thực tế, biết cách tổ chức dữ liệu, tối ưu SEO và đưa sản phẩm lên online.</p>
            <div className={`flex flex-wrap gap-4 text-sm mt-3 ${isModern ? 'text-white/80' : 'text-slate-500'}`}>
              <span className="inline-flex items-center gap-1"><BookOpen size={16} />42 bài học</span>
              <span className="inline-flex items-center gap-1"><Clock size={16} />18 giờ</span>
              {showInstructor && <span className="inline-flex items-center gap-1"><UserRound size={16} />Nguyễn Minh Đức</span>}
            </div>
          </div>
        </div>
      </section>

      <main className={`mx-auto grid max-w-6xl gap-6 px-4 py-8 ${showAside ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'max-w-4xl mx-auto'}`}>
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Bạn sẽ học được gì?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Biết cách tổ chức dự án rõ ràng', 'Tối ưu SEO cho trang học', 'Kết nối dữ liệu động', 'Đưa website lên online'].map((item) => (
                <div key={item} className={`flex items-start gap-2 border border-slate-200 p-3 text-sm text-slate-700 ${smallRadiusClass}`}>
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: brandColor }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {showCurriculum && (
            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Nội dung khóa học</h2>
              <div className="space-y-3">
                {MOCK_CHAPTERS.map((chapter: MockChapter, index: number) => {
                  const isOpen = openChapters[index] ?? false;
                  return (
                    <div key={index} className={`border border-slate-200 bg-white overflow-hidden p-4 ${radiusClass}`}>
                      <button
                        type="button"
                        onClick={() => toggleChapter(index)}
                        className="flex w-full items-center justify-between text-left focus:outline-none py-1"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-900 text-base md:text-lg">
                            Chương {index + 1}: {chapter.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {chapter.lessons.length} bài học
                          </p>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      
                      {isOpen && (
                        <div className="mt-3 border-t border-slate-100 pt-3 space-y-3">
                          <div className="divide-y divide-slate-100 pl-4 md:pl-6">
                            {chapter.lessons.map((lesson: MockLesson) => (
                              <div
                                key={lesson.order}
                                className="flex items-center justify-between gap-3 py-2.5 text-sm text-slate-700 hover:text-slate-900 transition-colors cursor-pointer group/item"
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-slate-400 font-mono text-xs w-6 shrink-0">{index + 1}.{lesson.order}</span>
                                  <span className="group-hover/item:underline">{lesson.title}</span>
                                </span>
                                {lesson.order === 1 ? (
                                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0 group-hover/item:bg-emerald-100 transition-colors">
                                    Học thử
                                  </span>
                                ) : (
                                  <Lock size={12} className="text-slate-300 group-hover/item:text-slate-400 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {showAside && (
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {showStickyCta && (
              <div className={`border border-slate-200 bg-white p-5 group ${radiusClass}`}>
                {/* Thumbnail giả lập với Hover Zoom */}
                <div className={`mb-4 flex aspect-video items-center justify-center overflow-hidden bg-slate-100 relative ${smallRadiusClass}`}>
                  <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${accent}22)` }} />
                  <GraduationCap size={48} className="relative z-10 transition-transform duration-300 group-hover:scale-105" style={{ color: brandColor }} />
                </div>
                
                <p className="text-sm text-slate-500">Học trọn đời</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>{formatPrice('paid', 2900000)}</p>
                <button className={`mt-4 w-full px-5 py-3 font-semibold text-white transition hover:opacity-90`} style={{ backgroundColor: brandColor, borderRadius: cornerRadius === 'none' ? '0px' : cornerRadius === 'sm' ? '8px' : '12px' }}>
                  Đăng ký học
                </button>
              </div>
            )}
            {showRelated && (
              <div className={`border border-slate-200 bg-white p-5 ${radiusClass}`}>
                <h3 className="font-semibold text-slate-900">Khóa liên quan</h3>
                <div className="mt-3 space-y-3">
                  {MOCK_RELATED_PREVIEWS.map((item: { slug: string; title: string }) => (
                    <div key={item.slug} className="block text-sm text-slate-600 hover:text-slate-900 cursor-pointer hover:underline">
                      {item.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </main>

      {/* Sticky Bottom CTA cho Mobile */}
      {showStickyCta && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Học phí</p>
            <p className="text-lg font-bold" style={{ color: accent }}>{formatPrice('paid', 2900000)}</p>
          </div>
          <button className={`px-5 py-2.5 text-xs font-bold text-white shadow-sm`} style={{ backgroundColor: brandColor, borderRadius: cornerRadius === 'none' ? '0px' : cornerRadius === 'sm' ? '8px' : '12px' }}>
            Đăng ký học
          </button>
        </div>
      )}
    </div>
  );
}

export function LessonDetailPreview({
  layoutStyle,
  showSidebar = true,
  showLessonNavigation = true,
  showExerciseDownload = true,
  showCourseBreadcrumb = true,
  lockWallStyle = 'overlay',
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
  cornerRadius = 'lg',
}: LessonDetailPreviewProps) {
  const accent = resolveSecondary(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';
  const isCompact = layoutStyle === 'compact';
  const isFocus = layoutStyle === 'focus';
  const shouldShowSidebar = showSidebar || isFocus || isCompact;
  const radiusClass = getRadiusClass(cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(cornerRadius);
  const containerClass = isFocus
    ? 'max-w-7xl gap-6 px-5 py-7'
    : isCompact
      ? 'max-w-7xl gap-5 px-5 py-6'
      : 'max-w-6xl gap-5 px-4 py-6';
  const directionClass = isMobile || isCompact ? 'flex-col' : isFocus ? 'flex-row' : 'flex-row-reverse';
  const sidebarWidthClass = isCompact ? 'w-full' : isFocus ? 'w-[280px]' : 'w-[300px]';

  const lessonItems = [
    { title: 'Làm quen AutoCAD tiêu chuẩn bản vẽ', active: true, preview: true },
    { title: 'Thiết lập layer, dim và text style', active: false, preview: false },
    { title: 'Vẽ mặt bằng nội thất cơ bản', active: false, preview: false },
  ];
  const compactChapters = [
    { title: '1. AutoCAD kiến trúc', lessons: lessonItems },
    { title: '2. 3DS Max dựng khối', lessons: lessonItems.map((item) => ({ ...item, active: false, preview: false })) },
    { title: '3. V-Ray ánh sáng', lessons: lessonItems.map((item) => ({ ...item, active: false, preview: false })) },
    { title: '4. Render nội thất', lessons: lessonItems.map((item) => ({ ...item, active: false, preview: false })) },
  ];

  const lockContent = (
    <div className={`flex h-full flex-col items-center justify-center p-5 text-center ${lockWallStyle === 'card' ? 'bg-slate-100 text-slate-900' : 'bg-slate-900/90 text-white'}`}>
      <div className={`mb-3 ${smallRadiusClass} p-3 ${lockWallStyle === 'card' ? 'bg-white shadow-sm' : 'bg-white/10 backdrop-blur'}`}>
        <Lock size={24} className={lockWallStyle === 'card' ? 'text-amber-500' : 'text-amber-400'} />
      </div>
      <h3 className="text-sm font-bold">Đăng nhập để xem bài học</h3>
      <p className={`mt-1 max-w-sm text-xs ${lockWallStyle === 'card' ? 'text-slate-500' : 'text-slate-300'}`}>
        Mở khóa video, tài liệu và bài tập thực hành trong khóa học.
      </p>
      <span className={`mt-4 inline-flex px-4 py-2 text-xs font-bold text-white ${smallRadiusClass}`} style={{ backgroundColor: brandColor }}>
        Đăng nhập ngay
      </span>
    </div>
  );

  return (
    <div className="min-h-[640px] bg-slate-50">
      <div className={`mx-auto flex w-full ${containerClass} ${directionClass}`}>
        <section className={`min-w-0 flex-1 ${isCompact ? 'space-y-5' : 'space-y-6'}`}>
          {showCourseBreadcrumb && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <ArrowLeft size={13} /> Khóa học kiến trúc nội thất
            </div>
          )}

          <div className={`relative aspect-video overflow-hidden bg-black shadow-sm ${radiusClass}`}>
            {layoutStyle === 'classic' ? (
              lockContent
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-900 text-slate-400">
                <PlayCircle size={44} />
                <p className="text-xs">Preview video bài học</p>
              </div>
            )}
          </div>

          <div className={`relative space-y-5 border border-slate-200 bg-white ${isCompact ? 'p-5' : 'p-6'} ${radiusClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bài học</span>
                <h1 className={`${isCompact ? 'text-lg' : 'text-xl'} mt-1 font-bold text-slate-900`}>
                  Bài 1: Làm quen AutoCAD tiêu chuẩn bản vẽ
                </h1>
              </div>
              {showExerciseDownload && (
                <span className={`inline-flex items-center gap-1.5 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm ${smallRadiusClass}`}>
                  <Download size={13} /> Tải bài tập
                </span>
              )}
            </div>

            <div className="relative">
              <div className={layoutStyle === 'classic' ? 'blur-[1px] opacity-60' : ''}>
                <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600">
                  <p>Trong bài học này, học viên làm quen giao diện AutoCAD, quy chuẩn layer, nét vẽ và cách chuẩn bị bản vẽ nội thất theo giáo trình mới.</p>
                  <ul>
                    <li>Thiết lập đơn vị, template và workspace.</li>
                    <li>Nắm logic layer, lineweight và annotation scale.</li>
                  </ul>
                </div>
              </div>
              {layoutStyle === 'classic' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`border border-slate-200 bg-white/90 p-4 text-center shadow-lg ${radiusClass}`}>
                    <Eye size={20} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-xs font-bold text-slate-800">Tài liệu đang bị khóa</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showLessonNavigation && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2 text-slate-300"><ChevronLeft size={15} /> Bài trước</span>
              <span className="inline-flex items-center gap-2">Bài sau <ChevronRight size={15} /></span>
            </div>
          )}
        </section>

        {shouldShowSidebar && (
          <aside className={`${isMobile ? 'w-full' : sidebarWidthClass} shrink-0 overflow-hidden border border-slate-200 bg-white shadow-sm ${radiusClass}`}>
            <div className="border-b border-slate-100 p-4">
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                <BookOpen size={13} /> Giáo trình AutoCAD 2025
              </div>
              <h2 className="text-sm font-bold text-slate-950">{isFocus ? 'Khóa học & tiến độ' : 'Nội dung khóa học'}</h2>
              {isFocus && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                  <span className={`border border-slate-200 bg-slate-50 px-2 py-1.5 ${smallRadiusClass}`}>12 chương</span>
                  <span className={`border border-slate-200 bg-slate-50 px-2 py-1.5 ${smallRadiusClass}`}>58 bài học</span>
                </div>
              )}
            </div>
            <div className={isCompact ? 'grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]' : 'divide-y divide-slate-100'}>
              {(isCompact ? compactChapters : [{ title: '1. Nền tảng bản vẽ', lessons: lessonItems }]).map((chapter, chapterIndex) => (
                <div key={chapter.title} className={`${isCompact ? `${radiusClass} border border-slate-200 overflow-hidden` : ''} ${isFocus ? 'p-3' : 'p-4'}`}>
                  <h3 className="mb-3 text-xs font-bold text-slate-800">{chapter.title}</h3>
                  <div className={isCompact ? 'max-h-44 space-y-1 overflow-y-auto no-scrollbar' : 'space-y-1'}>
                    {chapter.lessons.map((item, index) => (
                      <div
                        key={`${chapter.title}-${item.title}`}
                        className={`flex items-start gap-2 border-l-4 px-3 py-2 text-xs ${item.active ? 'bg-slate-100 font-bold text-slate-950' : 'border-l-transparent text-slate-600'}`}
                        style={item.active ? { borderLeftColor: brandColor } : undefined}
                      >
                        <span className="font-mono text-slate-400">{chapterIndex + 1}.{index + 1}</span>
                        <span className="flex-1">{item.title}</span>
                        {item.preview ? <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] text-emerald-700">Học thử</span> : <Lock size={11} className="text-slate-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!isCompact && (
                <div className="p-4 text-xs text-slate-500">
                  <FileText size={14} className="mb-2" style={{ color: accent }} />
                  {isFocus ? 'Sidebar rút gọn giúp chọn bài nhanh mà vẫn giữ vùng video rộng.' : 'Sidebar đầy đủ giúp học viên biết đang ở đâu trong khóa học.'}
                </div>
              )}
              {isCompact && (
                <div className="p-4 text-xs text-slate-500 md:col-span-2 xl:col-span-full">
                  <FileText size={14} className="mb-2" style={{ color: accent }} />
                  Video full width ở trên, khung khóa học full width ở dưới để chọn bài nhanh.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
