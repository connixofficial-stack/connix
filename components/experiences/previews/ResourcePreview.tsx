import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bookmark, ChevronDown, Download, FileText, Filter, Search, ShieldCheck, SlidersHorizontal, Star, X, Check } from 'lucide-react';
import { formatPrice, getRadiusClass, getSmallRadiusClass } from '@/lib/courses/courseUtils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ResourceListLayoutStyle = 'grid' | 'sidebar' | 'list';
type ResourceDetailLayoutStyle = 'classic' | 'modern' | 'minimal';
type PaginationType = 'pagination' | 'infiniteScroll';

type ResourceListPreviewProps = {
  layoutStyle: ResourceListLayoutStyle;
  gridColumns?: number;
  paginationType?: PaginationType;
  showSearch?: boolean;
  showCategories?: boolean;
  showResourceFilters?: boolean;
  hideEmptyCategories?: boolean;
  postsPerPage?: number;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

type ResourceDetailPreviewProps = {
  layoutStyle: ResourceDetailLayoutStyle;
  showGallery?: boolean;
  showRelated?: boolean;
  showStickyCta?: boolean;
  showResourceFilters?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  device?: DeviceType;
  cornerRadius?: 'none' | 'sm' | 'lg';
};

const getItemRadiusClass = (radius?: 'none' | 'sm' | 'lg') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') return 'rounded';
  return 'rounded-md';
};

type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
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
          {selectedOption?.icon ? (
            <img src={selectedOption.icon} alt={selectedOption.label} className="h-3.5 w-3.5 object-contain shrink-0" />
          ) : (
            icon
          )}
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
              {option.icon && (
                <img src={option.icon} alt={option.label} className="h-3.5 w-3.5 mr-1.5 object-contain shrink-0" />
              )}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type MultiSelectDropdownProps = {
  values: string[];
  onChange: (value: string) => void;
  onClear: () => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  cornerRadius?: 'none' | 'sm' | 'lg';
  brandColor?: string;
};

function MultiSelectDropdown({
  values,
  onChange,
  onClear,
  options,
  placeholder,
  icon,
  cornerRadius = 'lg',
  brandColor = '#4f46e5',
}: MultiSelectDropdownProps) {
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

  const selectedOptions = options.filter((opt) => opt.value !== '' && values.includes(opt.value));
  const hasSelection = selectedOptions.length > 0;

  const displayLabel = useMemo(() => {
    if (!hasSelection) return placeholder;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `${selectedOptions[0].label} (+${selectedOptions.length - 1})`;
  }, [hasSelection, selectedOptions, placeholder]);

  const displayIcon = useMemo(() => {
    if (selectedOptions.length === 1 && selectedOptions[0].icon) {
      return <img src={selectedOptions[0].icon} alt="" className="h-3.5 w-3.5 object-contain shrink-0" />;
    }
    return icon;
  }, [selectedOptions, icon]);

  const buttonRadiusClass = getSmallRadiusClass(cornerRadius);
  const menuRadiusClass = getSmallRadiusClass(cornerRadius);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto min-w-[155px]">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-9 w-full items-center justify-between gap-1.5 border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-slate-300 outline-none ${buttonRadiusClass}`}
        >
          <span className="flex items-center gap-1.5 truncate">
            {displayIcon}
            <span className="truncate">{displayLabel}</span>
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {hasSelection && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Xóa bộ lọc"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition shadow-sm"
            style={{ borderRadius: cornerRadius === 'none' ? '0' : cornerRadius === 'sm' ? '4px' : '6px' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={`absolute right-0 left-0 md:left-auto md:right-0 z-30 mt-1 max-h-60 min-w-[180px] overflow-y-auto border border-slate-100 bg-white p-1.5 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${menuRadiusClass}`}>
          <button
            type="button"
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition-colors rounded ${!hasSelection ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <span className="truncate">Tất cả phần mềm</span>
            {!hasSelection && <Check size={12} style={{ color: brandColor }} className="shrink-0" />}
          </button>

          <div className="my-1 border-t border-slate-100" />

          {options
            .filter((opt) => opt.value !== '')
            .map((option) => {
              const isSelected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                  }}
                  className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition-colors rounded ${
                    isSelected ? 'font-semibold font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={isSelected ? { backgroundColor: `${brandColor}12`, color: brandColor } : undefined}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {option.icon && (
                      <img src={option.icon} alt={option.label} className="h-3.5 w-3.5 object-contain shrink-0" />
                    )}
                    <span className="truncate">{option.label}</span>
                  </span>
                  {isSelected && <Check size={12} style={{ color: brandColor }} className="shrink-0" />}
                </button>
              );
            })}
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

const MOCK_RESOURCES = [
  { title: 'Checklist ra mắt website', category: 'Checklist', pricingType: 'free', priceAmount: 0, excerpt: 'Danh sách việc cần kiểm tra trước khi public website.', featured: true, filters: [{ name: 'AutoCAD 2D', icon: 'https://img.icons8.com/color/48/autocad.png' }] },
  { title: 'Template kế hoạch nội dung', category: 'Template', pricingType: 'paid', priceAmount: 299000, excerpt: 'Bộ file lập lịch, phân nhóm và đo hiệu quả nội dung.', filters: [{ name: 'PR', icon: 'https://img.icons8.com/color/48/public-relations.png' }] },
  { title: 'Ebook tối ưu SEO cơ bản', category: 'Ebook', pricingType: 'paid', priceAmount: 199000, excerpt: 'Hướng dẫn nền tảng để tối ưu trang bán hàng và blog.', filters: [{ name: 'Blender', icon: 'https://img.icons8.com/color/48/blender-3d.png' }] },
  { title: 'Bộ mẫu brief dự án', category: 'Toolkit', pricingType: 'free', priceAmount: 0, excerpt: 'File mẫu thu thập yêu cầu, phạm vi và checklist nghiệm thu.', filters: [{ name: 'Adobe after effects', icon: 'https://img.icons8.com/color/48/adobe-after-effects.png' }] },
];

const CATEGORIES = ['Tất cả', 'Ebook', 'Template', 'Checklist', 'Toolkit'];
const MOCK_FILTERS = [
  { name: 'Blender', icon: 'https://img.icons8.com/color/48/blender-3d.png' },
  { name: 'Adobe after effects', icon: 'https://img.icons8.com/color/48/adobe-after-effects.png' },
  { name: 'PR', icon: 'https://img.icons8.com/color/48/public-relations.png' },
  { name: 'AutoCAD 2D', icon: 'https://img.icons8.com/color/48/autocad.png' },
];

const resolveSecondary = (primary: string, secondary?: string, mode?: 'single' | 'dual') =>
  mode === 'dual' && secondary ? secondary : primary;

export function ResourcesListPreview({
  layoutStyle,
  gridColumns = 3,
  paginationType = 'pagination',
  showSearch = true,
  showCategories = true,
  showResourceFilters = true,
  hideEmptyCategories = true,
  postsPerPage = 12,
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
  cornerRadius = 'lg',
}: ResourceListPreviewProps) {
  void hideEmptyCategories;
  const accent = resolveSecondary(brandColor, secondaryColor, colorMode);
  const radiusClass = getRadiusClass(cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(cornerRadius);

  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'resources', featureKey: 'enableResourceFilters' });

  const [searchVal, setSearchVal] = useState('');
  const [activeCat, setActiveCat] = useState('Tất cả');
  const [filterVals, setFilterVals] = useState<string[]>([]);
  const [sortByVal, setSortByVal] = useState('newest');
  const [categoryQuery, setCategoryQuery] = useState('');

  const handleFilterToggle = (val: string) => {
    setFilterVals((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const processedResources = useMemo(() => {
    let list = [...MOCK_RESOURCES];
    if (activeCat !== 'Tất cả') {
      list = list.filter(r => r.category === activeCat);
    }
    if (filterVals.length > 0) {
      list = list.filter(r => r.filters?.some(f => filterVals.includes(f.name)));
    }
    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.excerpt.toLowerCase().includes(q));
    }
    if (sortByVal === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortByVal === 'price_asc') {
      list.sort((a, b) => a.priceAmount - b.priceAmount);
    } else if (sortByVal === 'price_desc') {
      list.sort((a, b) => b.priceAmount - a.priceAmount);
    }
    return list;
  }, [activeCat, filterVals, searchVal, sortByVal]);

  const visibleItems = processedResources;
  const columns = device === 'mobile' ? 1 : layoutStyle === 'sidebar' ? 2 : Math.min(gridColumns, 4);

  const resourceCard = (resource: typeof MOCK_RESOURCES[number], index: number) => {
    const isList = layoutStyle === 'list';
    if (isList) {
      return (
        <div key={resource.title} className={`overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row ${radiusClass} w-full`}>
          <div className="relative flex aspect-video sm:aspect-auto sm:w-48 shrink-0 items-center justify-center bg-slate-100" style={{ background: index === 0 ? `linear-gradient(135deg, ${brandColor}1f, ${accent}33)` : undefined }}>
            <FileText size={34} style={{ color: index === 0 ? brandColor : '#64748b' }} />
            {resource.featured && (
              <span className={`absolute left-3 top-3 flex items-center gap-1 bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow ${smallRadiusClass}`}>
                <Star size={11} style={{ color: brandColor }} /> Nổi bật
              </span>
            )}
          </div>
          <div className="flex-1 space-y-3 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">{resource.category}</span>
                <span className="text-sm font-semibold" style={{ color: brandColor }}>{formatPrice(resource.pricingType, resource.priceAmount)}</span>
              </div>
              <h3 className="font-semibold text-slate-900 mt-1">{resource.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{resource.excerpt}</p>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {resourceFiltersFeature?.enabled && showResourceFilters && resource.filters && resource.filters.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {resource.filters.map((f) => (
                    <span key={f.name} className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 inline-flex items-center gap-1">
                      {f.icon && (
                        <img src={f.icon} alt={f.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                      )}
                      <span>{f.name}</span>
                    </span>
                  ))}
                </div>
              ) : <div />}
              <button className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white shrink-0 ${smallRadiusClass}`} style={{ backgroundColor: brandColor }}>
                Xem tài nguyên <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={resource.title} className={`overflow-hidden border border-slate-200 bg-white shadow-sm ${radiusClass}`}>
        <div className="relative flex aspect-[16/9] items-center justify-center bg-slate-100" style={{ background: index === 0 ? `linear-gradient(135deg, ${brandColor}1f, ${accent}33)` : undefined }}>
          <FileText size={34} style={{ color: index === 0 ? brandColor : '#64748b' }} />
          {resource.featured && (
            <span className={`absolute left-3 top-3 flex items-center gap-1 bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow ${smallRadiusClass}`}>
              <Star size={11} style={{ color: brandColor }} /> Nổi bật
            </span>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-500">{resource.category}</span>
            <span className="text-sm font-semibold" style={{ color: brandColor }}>{formatPrice(resource.pricingType, resource.priceAmount)}</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{resource.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{resource.excerpt}</p>
          </div>
          {resourceFiltersFeature?.enabled && showResourceFilters && resource.filters && resource.filters.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.filters.map((f) => (
                <span key={f.name} className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 inline-flex items-center gap-1">
                  {f.icon && (
                    <img src={f.icon} alt={f.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                  )}
                  <span>{f.name}</span>
                </span>
              ))}
            </div>
          )}
          <button className={`flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white ${smallRadiusClass}`} style={{ backgroundColor: brandColor }}>
            Xem tài nguyên <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  const filterPanel = (showSearch || showCategories) ? (
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
                placeholder="Tìm tài nguyên..."
              />
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}

        {showCategories && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <Bookmark size={12} className="text-slate-400" />
              Danh mục tài nguyên
            </h3>
            {CATEGORIES.length > 8 && (
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
                  <button onClick={() => setCategoryQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 opacity-60 hover:opacity-100">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setActiveCat('Tất cả')}
                className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${activeCat === 'Tất cả' ? 'font-semibold' : ''}`}
                style={activeCat === 'Tất cả' ? { backgroundColor: `${brandColor}18`, color: brandColor } : { backgroundColor: 'transparent', color: '#475569' }}
              >
                Tất cả danh mục
              </button>
              {CATEGORIES.slice(1).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent ${activeCat === cat ? 'font-semibold' : ''}`}
                  style={activeCat === cat ? { backgroundColor: `${brandColor}18`, color: brandColor } : { backgroundColor: 'transparent', color: '#475569' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {resourceFiltersFeature?.enabled && showResourceFilters && (
          <div className={`border border-slate-200 bg-white p-3.5 shadow-sm ${getRadiusClass(cornerRadius, 'panel')}`}>
            <h3 className="font-semibold text-xs text-slate-700 mb-2 flex items-center gap-2">
              <Filter size={12} className="text-slate-400" />
              Bộ lọc phần mềm
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setFilterVals([])}
                className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent flex items-center justify-between ${filterVals.length === 0 ? 'font-semibold' : ''}`}
                style={filterVals.length === 0 ? { backgroundColor: `${brandColor}18`, color: brandColor } : { backgroundColor: 'transparent', color: '#475569' }}
              >
                <span>Tất cả phần mềm</span>
                {filterVals.length === 0 && <Check size={12} style={{ color: brandColor }} className="shrink-0" />}
              </button>
              {MOCK_FILTERS.map((item) => {
                const isSelected = filterVals.includes(item.name);
                return (
                  <button
                    key={item.name}
                    onClick={() => handleFilterToggle(item.name)}
                    className={`w-full py-1.5 px-2.5 rounded text-left text-xs transition-colors border border-transparent flex items-center justify-between gap-1.5 ${isSelected ? 'font-semibold font-bold' : ''}`}
                    style={isSelected ? { backgroundColor: `${brandColor}18`, color: brandColor } : { backgroundColor: 'transparent', color: '#475569' }}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {item.icon && (
                        <img src={item.icon} alt={item.name} className="h-3.5 w-3.5 object-contain shrink-0" />
                      )}
                      <span className="truncate">{item.name}</span>
                    </span>
                    {isSelected && <Check size={12} style={{ color: brandColor }} className="shrink-0" />}
                  </button>
                );
              })}
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
                  placeholder="Tìm tài nguyên..."
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
                  ...CATEGORIES.slice(1).map((cat) => ({ value: cat, label: cat })),
                ]}
                icon={<Bookmark size={14} className="text-slate-400" />}
                cornerRadius={cornerRadius}
              />
            )}
            {resourceFiltersFeature?.enabled && showResourceFilters && (
              <MultiSelectDropdown
                values={filterVals}
                onChange={handleFilterToggle}
                onClear={() => setFilterVals([])}
                options={[
                  { value: '', label: 'Tất cả phần mềm' },
                  ...MOCK_FILTERS.map((item) => ({ value: item.name, label: item.name, icon: item.icon })),
                ]}
                placeholder="Bộ lọc"
                icon={<Filter size={14} className="text-slate-400" />}
                cornerRadius={cornerRadius}
                brandColor={brandColor}
              />
            )}
            <CustomDropdown
              value={sortByVal}
              onChange={setSortByVal}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'popular', label: 'Xem nhiều' },
                { value: 'price_asc', label: 'Giá tăng dần' },
                { value: 'price_desc', label: 'Giá giảm dần' },
                { value: 'title', label: 'Tên A-Z' },
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
    <div className="bg-slate-50 p-5 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className={`border border-slate-200 bg-white p-5 shadow-sm ${radiusClass}`}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: brandColor }}>Thư viện tài nguyên</p>
          <h2 className="mt-2 text-2xl font-bold">Tải checklist, template và ebook</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Tìm nhanh tài nguyên phù hợp để triển khai công việc nhanh hơn.</p>
        </div>

        {layoutStyle !== 'sidebar' && filterPanel}

        <div className={layoutStyle === 'sidebar' && device !== 'mobile' ? 'grid grid-cols-[280px_1fr] gap-5' : ''}>
          {layoutStyle === 'sidebar' && device !== 'mobile' && filterPanel}
          <div className="space-y-4 flex-1">
            <div className={layoutStyle === 'list' ? "space-y-4" : `grid gap-4 ${columns === 1 ? 'grid-cols-1' : columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              {visibleItems.map(resourceCard)}
            </div>
            <div className="text-center text-xs text-slate-500">
              {paginationType === 'infiniteScroll' ? 'Tải thêm khi cuộn xuống' : `Hiển thị ${postsPerPage} tài nguyên/trang`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ArrowLeft } from 'lucide-react';

const MOCK_GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1503387762-592dedb802d7?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&auto=format&fit=crop&q=60',
];

export function ResourceDetailPreview({
  layoutStyle,
  showGallery = true,
  galleryMode = 'grid',
  showRelated = true,
  showStickyCta = true,
  showResourceFilters = true,
  brandColor = '#4f46e5',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
  cornerRadius = 'lg',
}: ResourceDetailPreviewProps & { galleryMode?: 'scroll' | 'grid' }) {
  const accent = resolveSecondary(brandColor, secondaryColor, colorMode);
  const radiusClass = getRadiusClass(cornerRadius);
  const isMobile = device === 'mobile';
  
  const [activeImage, setActiveImage] = useState(MOCK_GALLERY_IMAGES[0]);

  useEffect(() => {
    setActiveImage(MOCK_GALLERY_IMAGES[0]);
  }, [showGallery]);

  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'resources', featureKey: 'enableResourceFilters' });

  // Component phụ hiển thị Gallery ảnh
  const GalleryBlock = () => {
    if (!showGallery) return null;
    return (
      <div className="space-y-3">
        <div className={`aspect-video overflow-hidden border border-slate-200 bg-slate-100 transition-all duration-300 shadow-sm ${radiusClass}`}>
          <img src={activeImage} alt="Preview chính" className="h-full w-full object-cover animate-fade-in" />
        </div>
        {galleryMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-2.5">
            {MOCK_GALLERY_IMAGES.map((img: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`aspect-video overflow-hidden border transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
                  activeImage === img 
                    ? 'border-2 ring-1' 
                    : 'border-slate-200 hover:border-slate-400'
                } ${radiusClass}`}
                style={activeImage === img ? { borderColor: brandColor, boxShadow: `0 0 0 1.5px ${brandColor}` } : undefined}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {MOCK_GALLERY_IMAGES.map((img: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`h-14 w-20 shrink-0 overflow-hidden border transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
                  activeImage === img 
                    ? 'border-2 ring-1' 
                    : 'border-slate-200 hover:border-slate-400'
                } ${radiusClass}`}
                style={activeImage === img ? { borderColor: brandColor, boxShadow: `0 0 0 1.5px ${brandColor}` } : undefined}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Component phụ hiển thị CtaCard (Tải tài nguyên)
  const CtaCard = ({ isModernLayout }: { isModernLayout?: boolean }) => (
    <div 
      className={`border bg-white p-4 transition-all duration-300 ${
        isModernLayout 
          ? 'border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-sm' 
          : `shadow-sm border-slate-200 ${radiusClass}`
      }`}
    >
      <div className={`mb-3 flex aspect-video items-center justify-center overflow-hidden bg-slate-100 ${isModernLayout ? 'rounded-sm' : radiusClass}`}>
        <img src={MOCK_GALLERY_IMAGES[0]} alt="Checklist" className="h-full w-full object-cover" />
      </div>
      <div className="space-y-0.5">
        <p className="text-[11px] text-zinc-400">Tải sau khi đăng nhập</p>
        <p className="text-xl font-bold" style={{ color: isModernLayout ? '#18181b' : accent }}>Miễn phí</p>
      </div>
      <button
        type="button"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white transition-all duration-300 hover:opacity-90 active:scale-[0.98] cursor-default select-none"
        style={{ 
          backgroundColor: isModernLayout ? '#27272a' : brandColor, 
          borderRadius: isModernLayout ? '4px' : (cornerRadius === 'none' ? '0px' : cornerRadius === 'sm' ? '8px' : '12px'),
          boxShadow: undefined
        }}
      >
        <Download size={14} />
        Tải tài nguyên
      </button>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <ShieldCheck size={14} className="shrink-0" />
        Đăng nhập để lưu quyền tải lại.
      </div>
    </div>
  );

  // Layout 1: CLASSIC (Cổ điển)
  if (layoutStyle === 'classic') {
    return (
      <div className="relative bg-white text-slate-900 font-sans shadow-sm rounded-lg overflow-hidden border border-slate-100">
        {/* Hero Banner */}
        <section className="bg-slate-50/70 border-b border-slate-100 p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ArrowLeft size={12} /> Quay lại
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-slate-200/60 text-slate-700">Checklist</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Checklist ra mắt website chuyên nghiệp</h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">Bộ checklist giúp rà soát nội dung, hiệu năng, SEO và tracking trước khi public.</p>
            {resourceFiltersFeature?.enabled && showResourceFilters && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[{ name: 'AutoCAD 2D', icon: 'https://img.icons8.com/color/48/autocad.png' }].map((item) => (
                  <span key={item.name} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    <img src={item.icon} alt="" className="h-3.5 w-3.5 object-contain shrink-0" />
                    <span>{item.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Content body */}
        <section className={`p-6 mx-auto grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-[1fr_280px]'}`}>
          <div className="space-y-6">
            <GalleryBlock />
            <article className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-slate-900">Bạn nhận được gì?</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                <li>Kiểm tra nội dung, SEO, form, tracking và performance.</li>
                <li>File mẫu có thể copy để sử dụng ngay cho dự án của bạn.</li>
                <li>Hệ thống hóa thứ tự ưu tiên tối ưu hóa tỷ lệ chuyển đổi.</li>
              </ul>
            </article>
          </div>

          <aside className="space-y-4">
            {showStickyCta && <CtaCard />}
            {showRelated && (
              <div className={`border border-slate-200 bg-white p-4 shadow-sm ${radiusClass}`}>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-2">Tài nguyên liên quan</h4>
                <div className="space-y-2 text-xs font-medium">
                  {MOCK_RESOURCES.slice(1, 4).map((item) => (
                    <div key={item.title} className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer truncate">
                      • {item.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    );
  }

  // Layout 2: MODERN (Hiện đại - phong cách tối giản phẳng macOS)
  if (layoutStyle === 'modern') {
    return (
      <div className="mx-auto max-w-7xl font-sans text-slate-900 bg-white">
        {/* Breadcrumb quay lại đặt tự nhiên ở trên */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-550 hover:text-zinc-900 transition-colors font-semibold">
            <ArrowLeft size={12} /> Quay lại tất cả tài nguyên
          </div>
        </div>

        {/* Bố cục 2 cột thông thoáng */}
        <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-[260px_1fr]'}`}>
          {/* Cột Trái: Sidebar thông tin tối giản phẳng */}
          <aside className="space-y-5 shrink-0">
            {/* Category & Status */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-sm bg-zinc-100 text-zinc-650 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase border border-zinc-200/60">
                Checklist
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-amber-500/10 text-amber-700 px-2 py-0.5 text-[10px] font-bold">
                <Star size={10} className="fill-current" /> Nổi bật
              </span>
            </div>

            {/* Title & Excerpt */}
            <div className="space-y-1.5">
              <h1 className="text-base font-bold text-zinc-900 leading-snug">Checklist ra mắt website chuyên nghiệp</h1>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-normal">
                Bộ checklist giúp rà soát nội dung, hiệu năng, SEO và tracking trước khi public.
              </p>
            </div>

            {/* Action Widget (CtaCard) */}
            {showStickyCta && (
              <div className="pt-1">
                <CtaCard isModernLayout={true} />
              </div>
            )}

            {/* Resource Filters */}
            {resourceFiltersFeature?.enabled && showResourceFilters && (
              <div className="space-y-1.5 pt-4 border-t border-zinc-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-450">Thông số</span>
                <div className="flex flex-wrap gap-1">
                  {[{ name: 'AutoCAD 2D', icon: 'https://img.icons8.com/color/48/autocad.png' }].map((item) => (
                    <span
                      key={item.name}
                      className="inline-flex items-center gap-1 rounded-sm border border-zinc-200 bg-zinc-50/50 px-2 py-0.5 text-[10px] text-zinc-700 font-medium"
                    >
                      <img src={item.icon} alt="" className="h-3 w-3 object-contain shrink-0" />
                      <span>{item.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Resources */}
            {showRelated && (
              <div className="space-y-2 pt-4 border-t border-zinc-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-455">Tài nguyên liên quan</span>
                <div className="space-y-1 text-xs">
                  {MOCK_RESOURCES.slice(1, 4).map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 px-2 py-1.5 rounded-sm transition-colors truncate cursor-default"
                    >
                      <FileText size={12} className="text-zinc-400 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Cột Phải: Main View (Gallery & Content) */}
          <section className="space-y-5">
            {/* Gallery Block */}
            <GalleryBlock />

            {/* Divider */}
            <div className="h-[1px] bg-zinc-150" />

            {/* Detail Content */}
            <article className="prose prose-zinc max-w-none">
              <h3 className="text-sm font-semibold text-zinc-800 border-l-2 pl-2 border-zinc-550">Bạn nhận được gì?</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-zinc-650 list-disc pl-4 leading-relaxed">
                <li>Kiểm tra nội dung, SEO, form, tracking và performance.</li>
                <li>File mẫu có thể copy để sử dụng ngay cho dự án của bạn.</li>
                <li>Hệ thống hóa thứ tự ưu tiên tối ưu hóa tỷ lệ chuyển đổi.</li>
              </ul>
            </article>
          </section>
        </div>
      </div>
    );
  }

  // Layout 3: MINIMAL (Tối giản - 1 cột căn giữa giống macOS/iOS app)
  return (
    <div className="relative bg-white text-slate-900 font-sans shadow-sm rounded-lg overflow-hidden border border-slate-100 py-6">
      <div className="max-w-2xl mx-auto px-4 md:px-0 space-y-6">
        {/* Title Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ArrowLeft size={12} /> Quay lại
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Checklist</span>
            {resourceFiltersFeature?.enabled && showResourceFilters && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                AutoCAD 2D
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Checklist ra mắt website chuyên nghiệp</h1>
          <p className="text-sm text-slate-500 leading-relaxed">Bộ checklist giúp rà soát nội dung, hiệu năng, SEO và tracking trước khi public.</p>
        </div>

        {/* Gallery */}
        <GalleryBlock />

        {/* Inline Cta Card (Kiểu tối giản ngang Apple) */}
        {showStickyCta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100 bg-slate-50/60 p-4 rounded-xl shadow-inner animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-12 w-16 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                <img src={MOCK_GALLERY_IMAGES[0]} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">Checklist ra mắt website</p>
                <p className="text-xs text-slate-500">Miễn phí • Đăng nhập để tải</p>
              </div>
            </div>
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
              style={{ backgroundColor: brandColor, borderRadius: '8px' }}
            >
              <Download size={15} /> Tải tài nguyên
            </button>
          </div>
        )}

        {/* Content Body */}
        <article className="prose prose-slate max-w-none pt-2">
          <h3 className="text-lg font-semibold text-slate-900">Bạn nhận được gì?</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-650 list-disc pl-5">
            <li>Kiểm tra nội dung, SEO, form, tracking và performance.</li>
            <li>File mẫu có thể copy để sử dụng ngay cho dự án của bạn.</li>
            <li>Hệ thống hóa thứ tự ưu tiên tối ưu hóa tỷ lệ chuyển đổi.</li>
          </ul>
        </article>

        {/* Related Section ở cuối */}
        {showRelated && (
          <div className="border-t border-slate-100 pt-6 mt-8">
            <h4 className="font-semibold text-sm text-slate-800 mb-3">Tài nguyên liên quan khác</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MOCK_RESOURCES.slice(1, 4).map((item) => (
                <div key={item.title} className="border border-slate-150 p-3 rounded-lg hover:border-slate-350 transition-colors cursor-pointer bg-slate-50/30">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.category}</p>
                  <h5 className="font-semibold text-xs text-slate-700 mt-1 truncate">{item.title}</h5>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
