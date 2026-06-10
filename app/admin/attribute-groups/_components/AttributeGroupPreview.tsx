'use client';

import React, { useState, useEffect } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { getAttributeIconComponent } from '../_lib/iconRegistry';
import { Card, CardContent, cn } from '../../components/ui';
import { ChevronDown, Check } from 'lucide-react';

interface AttributeGroupPreviewProps {
  name: string;
  filterType: string;
  inputType: string;
  iconName?: string;
  iconColor?: string;
  terms?: {
    _id: string;
    name: string;
    slug: string;
    order: number;
  }[];
}

export type RangeConfig = {
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultMin: number;
  defaultMax: number;
};

const GENERIC_RANGE_CONFIG: RangeConfig = {
  min: 0,
  max: 100,
  step: 1,
  unit: '',
  defaultMin: 0,
  defaultMax: 100,
};

const normalizeText = (value: string) => value.toLowerCase()
  .normalize('NFD')
  .replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd');

export const getSmartRangeConfig = (name: string, terms: { name: string }[] = []): RangeConfig => {
  const source = normalizeText(`${name} ${terms.map(term => term.name).join(' ')}`);
  if (source.match(/gia|price|tien|cost|amount/)) {
    return { min: 0, max: 10000000, step: 100000, unit: '₫', defaultMin: 0, defaultMax: 5000000 };
  }
  if (source.match(/nong do|do con|abv|alcohol|con/)) {
    return { min: 1, max: 100, step: 1, unit: '%', defaultMin: 1, defaultMax: 15 };
  }
  if (source.match(/dung tich|the tich|volume|ml|lit|liter|litre|cl/)) {
    return { min: 1, max: 2000, step: 1, unit: 'ml', defaultMin: 1, defaultMax: 750 };
  }
  if (source.match(/trong luong|can nang|weight|kg|gram|gam/)) {
    return { min: 0, max: 100, step: 1, unit: 'kg', defaultMin: 0, defaultMax: 10 };
  }
  if (source.match(/nam|year|vintage|nien vu/)) {
    const year = new Date().getFullYear();
    return { min: 1900, max: year, step: 1, unit: '', defaultMin: year - 20, defaultMax: year };
  }
  if (source.match(/diem|score|rating|rank/)) {
    return { min: 0, max: 100, step: 1, unit: 'điểm', defaultMin: 80, defaultMax: 100 };
  }
  return GENERIC_RANGE_CONFIG;
};

const formatRangeValue = (value: number, unit: string) => {
  const formatted = Number.isInteger(value) ? value.toLocaleString('vi-VN') : value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  if (!unit) { return formatted; }
  return unit === '₫' ? `${formatted}${unit}` : `${formatted}${unit}`;
};

export function AttributeGroupPreview({
  name,
  filterType,
  inputType,
  iconName = 'Wine',
  iconColor = '#ea580c',
  terms = []
}: AttributeGroupPreviewProps) {
  // Lấy Icon component động
  const IconComponent = getAttributeIconComponent(iconName);

  // States giả lập chọn trị thuộc tính
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const resolvedRangeConfig = getSmartRangeConfig(name, terms);
  const [minVal, setMinVal] = useState(resolvedRangeConfig.defaultMin);
  const [maxVal, setMaxVal] = useState(resolvedRangeConfig.defaultMax);

  // Reset selected terms khi đổi kiểu
  useEffect(() => {
    setSelectedTerms([]);
    setIsDropdownOpen(false);
  }, [filterType, inputType]);

  useEffect(() => {
    setMinVal(resolvedRangeConfig.defaultMin);
    setMaxVal(resolvedRangeConfig.defaultMax);
  }, [
    resolvedRangeConfig.defaultMin,
    resolvedRangeConfig.defaultMax,
    resolvedRangeConfig.min,
    resolvedRangeConfig.max,
    resolvedRangeConfig.step,
    resolvedRangeConfig.unit,
  ]);

  const displayGroupName = name.trim() || 'Tên nhóm thuộc tính';

  // Mockup data mặc định khi chưa có values thực tế
  const mockOptions = {
    select: [
      { id: '1', label: 'Tất cả', value: 'all' },
      { id: '2', label: 'Giá trị A', value: 'a' },
      { id: '3', label: 'Giá trị B', value: 'b' },
      { id: '4', label: 'Giá trị C', value: 'c' },
    ],
    buttons: [
      { id: 's', label: 'Size S', value: 'S' },
      { id: 'm', label: 'Size M', value: 'M' },
      { id: 'l', label: 'Size L', value: 'L' },
      { id: 'xl', label: 'Size XL', value: 'XL' },
    ],
    radio: [
      { id: 'r1', label: 'Dưới 500k', value: 'under-500' },
      { id: 'r2', label: 'Từ 500k - 1tr', value: '500-1000' },
      { id: 'r3', label: 'Trên 1tr', value: 'over-1000' },
    ]
  };

  const hasRealTerms = terms.length > 0;

  // Lấy danh sách options thực tế hoặc mockup
  const getResolvedOptions = () => {
    if (hasRealTerms) {
      if (inputType === 'select') {
        return [
          { id: 'all', label: 'Tất cả', value: 'all' },
          ...terms.map(t => ({ id: t._id, label: t.name, value: t.slug }))
        ];
      } else {
        return terms.map(t => ({ id: t._id, label: t.name, value: t.slug }));
      }
    }
    return mockOptions[inputType as keyof typeof mockOptions] || [];
  };

  const resolvedOptions = getResolvedOptions();

  const handleSelectTerm = (id: string) => {
    if (filterType === 'multiple') {
      setSelectedTerms(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else {
      setSelectedTerms(prev => prev.includes(id) ? [] : [id]);
    }
  };

  const getDropdownLabel = () => {
    if (selectedTerms.length === 0) return 'Chọn giá trị...';
    const found = resolvedOptions.filter(item => selectedTerms.includes(item.id));
    if (found.length === 0) return 'Chọn giá trị...';
    return found.map(f => 'label' in f ? f.label : '').filter(Boolean).join(', ');
  };

  const isWhiteColor = iconColor.toLowerCase() === '#ffffff';

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Xem trước giao diện bộ lọc (Live Preview)</h3>
          <p className="text-xs text-slate-500">Mô phỏng cách bộ lọc này hoạt động ngoài trang chủ</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider">Trực quan</span>
      </div>

      <CardContent className="p-6 space-y-6 flex flex-col justify-between h-[calc(100%-60px)]">
        {/* Giả lập Sidebar Filter Card */}
        <div className="border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 bg-white dark:bg-slate-950 shadow-sm space-y-4 max-w-sm mx-auto w-full">
          
          {/* Header nhóm thuộc tính */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/50">
            <div className={cn(
              "p-1.5 rounded-lg border transition-all",
              isWhiteColor 
                ? "bg-slate-950 text-white border-slate-800 shadow-inner" 
                : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
            )}>
              <IconComponent size={18} style={{ color: iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{displayGroupName}</h4>
              <p className="text-[10px] text-slate-400 font-medium">
                {filterType === 'range' ? 'Lọc theo khoảng giá trị' : filterType === 'multiple' ? 'Cho phép chọn nhiều' : 'Chỉ chọn một'}
              </p>
            </div>
          </div>

          {/* Body các kiểu hiển thị */}
          <div className="pt-1">
            {/* Kiểu RANGE SLIDER (Nếu filterType === 'range') */}
            {filterType === 'range' ? (
              <div className="space-y-6 py-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Dải chọn:</span>
                  <span className="px-2 py-0.5 rounded font-mono text-white" style={{ backgroundColor: iconColor }}>
                    {formatRangeValue(minVal, resolvedRangeConfig.unit)} - {formatRangeValue(maxVal, resolvedRangeConfig.unit)}
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Radix Slider */}
                  <SliderPrimitive.Root
                    className="relative flex items-center w-full touch-none select-none"
                    min={resolvedRangeConfig.min}
                    max={resolvedRangeConfig.max}
                    step={resolvedRangeConfig.step}
                    value={[minVal, maxVal]}
                    onValueChange={(values) => {
                      const [newMin, newMax] = values as [number, number];
                      setMinVal(newMin);
                      setMaxVal(newMax);
                    }}
                    minStepsBetweenThumbs={0}
                    style={{ height: 20 }}
                  >
                    {/* Background Track */}
                    <SliderPrimitive.Track 
                      className="relative w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                      style={{ height: 4 }}
                    >
                      {/* Active Range */}
                      <SliderPrimitive.Range 
                        className="absolute h-full rounded-full"
                        style={{ backgroundColor: iconColor, opacity: 0.8 }}
                      />
                    </SliderPrimitive.Track>

                    {/* Min Thumb */}
                    <SliderPrimitive.Thumb 
                      className="block rounded-full bg-white border-2 focus:outline-none relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11 after:rounded-full cursor-grab active:cursor-grabbing transition-transform active:scale-125"
                      style={{
                        width: 16,
                        height: 16,
                        borderColor: iconColor,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}
                      aria-label="Giá trị nhỏ nhất"
                    />

                    {/* Max Thumb */}
                    <SliderPrimitive.Thumb 
                      className="block rounded-full bg-white border-2 focus:outline-none relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11 after:rounded-full cursor-grab active:cursor-grabbing transition-transform active:scale-125"
                      style={{
                        width: 16,
                        height: 16,
                        borderColor: iconColor,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}
                      aria-label="Giá trị lớn nhất"
                    />
                  </SliderPrimitive.Root>

                  {/* Min / Max Labels */}
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    <span>{formatRangeValue(resolvedRangeConfig.min, resolvedRangeConfig.unit)}</span>
                    <span>{formatRangeValue(resolvedRangeConfig.max, resolvedRangeConfig.unit)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Kiểu DROPDOWN SELECT */}
                {inputType === 'select' && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between h-10 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-medium text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate">{getDropdownLabel()}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 z-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-1 space-y-0.5">
                        {resolvedOptions.map(opt => {
                          if (!('label' in opt)) return null;
                          const isSelected = selectedTerms.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                handleSelectTerm(opt.id);
                                if (filterType !== 'multiple') setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md text-left transition-all ${
                                isSelected 
                                  ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-semibold' 
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check size={14} className="text-orange-500" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Kiểu BUTTONS */}
                {inputType === 'buttons' && (
                  <div className="flex flex-wrap gap-2">
                    {resolvedOptions.map(opt => {
                      if (!('label' in opt)) return null;
                      const isSelected = selectedTerms.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectTerm(opt.id)}
                          className={`h-9 px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Kiểu RADIO */}
                {inputType === 'radio' && (
                  <div className="space-y-2">
                    {resolvedOptions.map(opt => {
                      if (!('label' in opt)) return null;
                      const isSelected = selectedTerms.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectTerm(opt.id)}
                          className="w-full flex items-center gap-3 py-1.5 text-xs text-left text-slate-700 dark:text-slate-300 group hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                          <div className={`w-4 h-4 flex items-center justify-center transition-all ${
                            filterType === 'multiple' 
                              ? 'rounded border' 
                              : 'rounded-full border'
                          } ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-500 text-white' 
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-slate-400'
                          }`}>
                            {isSelected && (
                              <div className={filterType === 'multiple' ? '' : 'w-1.5 h-1.5 rounded-full bg-white'} >
                                {filterType === 'multiple' && <Check size={12} className="stroke-[3]" />}
                              </div>
                            )}
                          </div>
                          <span className={`${isSelected ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}`}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Note chú thích bên dưới */}
        <div className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 rounded-lg p-3 max-w-sm mx-auto w-full italic">
          {filterType === 'range' ? (
            <span>⚡ **Kiểu Lọc Range:** Cho phép người dùng lọc sản phẩm theo khoảng giá trị số liên tục (ví dụ: {displayGroupName} từ {formatRangeValue(minVal, resolvedRangeConfig.unit)} đến {formatRangeValue(maxVal, resolvedRangeConfig.unit)}).</span>
          ) : hasRealTerms ? (
            <span>⚡ **Dữ liệu thật:** Preview đang hiển thị đúng {terms.length} giá trị thuộc tính đã lưu của bạn!</span>
          ) : (
            <span>💡 **Mẹo:** Bạn có thể nhấp chuột trực tiếp vào các nút hoặc dropdown xem trước ở trên để trải nghiệm thử cách admin/khách hàng tương tác với bộ lọc.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
