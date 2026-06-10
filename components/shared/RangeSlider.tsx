'use client';

/**
 * RangeSlider – Dual-thumb slider dựa trên Radix UI Slider primitive.
 *
 * Tại sao dùng Radix?
 * - Radix dùng một element duy nhất (không chồng 2 <input>), xử lý pointer
 *   capture đúng chuẩn → thumb không bao giờ bị "ẩn" khi kéo.
 * - Built-in keyboard navigation, ARIA, accessibility.
 * - Shadcn/ui, Vercel, Linear, Notion đều wrap Radix Slider.
 */

import * as SliderPrimitive from '@radix-ui/react-slider';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface RangeSliderProps {
  /** Giá trị min của toàn bộ dải */
  minLimit: number;
  /** Giá trị max của toàn bộ dải */
  maxLimit: number;
  /** Giá trị min hiện tại đang chọn */
  valueMin: number;
  /** Giá trị max hiện tại đang chọn */
  valueMax: number;
  /** Bước nhảy */
  step?: number;
  /** Màu chủ đạo (hex/rgb/hsl) */
  primaryColor: string;
  /** Màu track chưa chọn */
  trackColor?: string;
  /** Màu thumb border */
  thumbBorderColor?: string;
  /** Callback khi người dùng đang kéo (real-time) */
  onValueChange?: (min: number, max: number) => void;
  /** Callback khi thả tay (commit filter) */
  onValueCommit?: (min: number, max: number) => void;
  /** Đơn vị hiển thị (%, %, °C…) */
  unit?: string;
  /** Đang có bộ lọc hoạt động bên ngoài (dùng khi minLimit === maxLimit) */
  hasFilterActive?: boolean;
  /** Formatter tùy biến cho giá trị hiển thị */
  formatValue?: (value: number) => string;
}

export function RangeSlider({
  minLimit,
  maxLimit,
  valueMin,
  valueMax,
  step = 1,
  primaryColor,
  trackColor = '#e2e8f0',
  thumbBorderColor = '#ffffff',
  onValueChange,
  onValueCommit,
  unit = '',
  hasFilterActive = false,
  formatValue,
}: RangeSliderProps) {
  // Local state để hiển thị real-time mà không gây navigate
  const [localValues, setLocalValues] = useState<[number, number]>([valueMin, valueMax]);

  // Ref lưu giá trị tự trượt apply gần nhất để chống giật ngược khi URL update trễ
  const lastAppliedValuesRef = useRef<[number, number] | null>(null);

  // Sync khi props thay đổi từ bên ngoài (URL change)
  useEffect(() => {
    if (lastAppliedValuesRef.current) {
      const [appliedMin, appliedMax] = lastAppliedValuesRef.current;
      if (appliedMin === valueMin && appliedMax === valueMax) {
        lastAppliedValuesRef.current = null;
        return;
      }
    }
    setLocalValues([valueMin, valueMax]);
  }, [valueMin, valueMax]);

  const handleChange = useCallback(
    (values: number[]) => {
      const [minVal, maxVal] = values as [number, number];
      setLocalValues([minVal, maxVal]);
      onValueChange?.(minVal, maxVal);
    },
    [onValueChange]
  );

  const handleCommit = useCallback(
    (values: number[]) => {
      const [minVal, maxVal] = values as [number, number];
      setLocalValues([minVal, maxVal]);
      lastAppliedValuesRef.current = [minVal, maxVal];
      onValueCommit?.(minVal, maxVal);
    },
    [onValueCommit]
  );

  const handleReset = useCallback(() => {
    setLocalValues([minLimit, maxLimit]);
    lastAppliedValuesRef.current = [minLimit, maxLimit];
    onValueCommit?.(minLimit, maxLimit);
  }, [minLimit, maxLimit, onValueCommit]);

  const [min, max] = localValues;

  const formatVal = (val: number) => {
    if (formatValue) {
      return formatValue(val);
    }
    if (unit === 'đ' || unit === '₫' || val >= 1000) {
      return `${val.toLocaleString('vi-VN')}${unit}`;
    }
    return `${val}${unit}`;
  };

  return (
    <div className="space-y-3 py-1 select-none">
      {/* Radix Slider */}
      <SliderPrimitive.Root
        className="relative flex items-center w-full touch-none"
        min={minLimit}
        max={maxLimit}
        step={step}
        value={localValues}
        onValueChange={handleChange}
        onValueCommit={handleCommit}
        minStepsBetweenThumbs={0}
        style={{ height: 20 }}
      >
        {/* Track nền */}
        <SliderPrimitive.Track
          className="relative w-full rounded-full overflow-hidden"
          style={{ height: 6, backgroundColor: trackColor }}
        >
          {/* Vùng đã chọn */}
          <SliderPrimitive.Range
            className="absolute h-full rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
        </SliderPrimitive.Track>

        {/* Thumb MIN */}
        <SliderPrimitive.Thumb
          className="block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11 after:rounded-full"
          style={{
            width: 18,
            height: 18,
            backgroundColor: primaryColor,
            border: `2.5px solid ${thumbBorderColor}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            cursor: 'grab',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
          }}
          aria-label="Giá trị nhỏ nhất"
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)';
            (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px rgba(0,0,0,0.35)`;
            (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.25)';
            (e.currentTarget as HTMLElement).style.cursor = 'grab';
          }}
        />

        {/* Thumb MAX */}
        <SliderPrimitive.Thumb
          className="block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11 after:rounded-full"
          style={{
            width: 18,
            height: 18,
            backgroundColor: primaryColor,
            border: `2.5px solid ${thumbBorderColor}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            cursor: 'grab',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
          }}
          aria-label="Giá trị lớn nhất"
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)';
            (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px rgba(0,0,0,0.35)`;
            (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.25)';
            (e.currentTarget as HTMLElement).style.cursor = 'grab';
          }}
        />
      </SliderPrimitive.Root>

      {/* Min / Max hiển thị động giá trị đang chọn bên dưới, kèm nút Reset */}
      <div className="flex justify-between items-center text-xs font-mono font-semibold" style={{ color: '#64748b' }}>
        <span>{formatVal(min)}</span>
        
        {((min !== minLimit || max !== maxLimit || hasFilterActive)) ? (
          <button
            type="button"
            onClick={handleReset}
            className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 flex items-center gap-1 font-sans font-normal"
            title="Đặt lại khoảng lọc"
          >
            <X size={10} /> Đặt lại
          </button>
        ) : (
          <span className="text-slate-300 dark:text-slate-700 font-bold">-</span>
        )}

        <span>{formatVal(max)}</span>
      </div>
    </div>
  );
}