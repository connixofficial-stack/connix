'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';

interface TabItem {
  id: string;
  name: string;
}

interface CategoryTabSliderProps {
  tabs: TabItem[];
  activeTabId: string | null;
  onTabChange: (id: string | null) => void;
  brandColor: string;
  className?: string;
  showAllTab?: boolean;
  allTabLabel?: string;
  brandBgColor?: string; // Nền của cả section nếu có (ví dụ: style tabbed có nền brandColor)
}

export function CategoryTabSlider({
  tabs,
  activeTabId,
  onTabChange,
  brandColor,
  className,
  showAllTab = false,
  allTabLabel = 'Tất cả',
  brandBgColor,
}: CategoryTabSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const checkScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    // Bật nút Prev nếu đã cuộn sang phải quá 5px
    setShowPrev(scrollLeft > 5);
    // Bật nút Next nếu còn có thể cuộn tiếp sang phải quá 5px
    setShowNext(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    checkScroll();
    
    // Đăng ký listener sự kiện cuộn
    container.addEventListener('scroll', checkScroll);
    
    // Đăng ký ResizeObserver để cập nhật khi đổi kích thước màn hình (responsive)
    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(container);

    // Kiểm tra lại sau khi font/render hoàn tất một chút
    const t = setTimeout(checkScroll, 100);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
      clearTimeout(t);
    };
  }, [tabs]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.7; // Cuộn 70% chiều rộng khung nhìn
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Màu nền tiệp cho hiệu ứng gradient và nút bấm
  const isOnBrandBg = !!brandBgColor;
  const gradientLeftClass = isOnBrandBg
    ? 'from-inherit to-transparent'
    : 'from-white dark:from-slate-900 to-transparent';
  const gradientRightClass = isOnBrandBg
    ? 'from-transparent to-inherit'
    : 'from-transparent to-white dark:to-slate-900';

  const buttonStyle = isOnBrandBg
    ? { backgroundColor: '#ffffff', color: '#0f172a' }
    : { backgroundColor: brandColor, color: '#ffffff' };

  if (tabs.length === 0) return null;

  const allTabs = showAllTab ? [{ id: 'all-tabs-option', name: allTabLabel }, ...tabs] : tabs;

  return (
    <div className={cn('relative w-full group/slider', className)}>
      {/* Nút Prev bên trái */}
      {showPrev && (
        <div 
          className={cn(
            'absolute left-0 top-0 bottom-0 z-20 flex items-center pr-10 bg-gradient-to-r pointer-events-none transition-all duration-300',
            gradientLeftClass
          )}
        >
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full shadow-md hover:scale-105 active:scale-95 transition-all pointer-events-auto border border-slate-100 dark:border-slate-800"
            style={buttonStyle}
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}

      {/* Container cuộn các Tabs */}
      <div
        ref={containerRef}
        className="flex w-full overflow-x-auto gap-2 md:gap-3 py-1.5 scrollbar-none snap-x snap-mandatory"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {allTabs.map((tab) => {
          const isAllTab = tab.id === 'all-tabs-option';
          const isSelected = isAllTab ? activeTabId === null : activeTabId === tab.id;
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(isAllTab ? null : tab.id)}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold border transition-all snap-start whitespace-nowrap',
                isOnBrandBg
                  ? isSelected
                    ? 'bg-white text-slate-900 border-white shadow-md'
                    : 'bg-transparent text-white border-white/40 hover:border-white hover:bg-white/10'
                  : isSelected
                    ? 'text-white border-transparent'
                    : 'bg-transparent border-slate-200 dark:border-slate-700 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400'
              )}
              style={
                !isOnBrandBg && isSelected
                  ? { backgroundColor: brandColor, borderColor: brandColor }
                  : !isOnBrandBg
                    ? { color: brandColor, borderColor: `${brandColor}30` }
                    : undefined
              }
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Nút Next bên phải */}
      {showNext && (
        <div 
          className={cn(
            'absolute right-0 top-0 bottom-0 z-20 flex items-center pl-10 bg-gradient-to-l pointer-events-none transition-all duration-300',
            gradientRightClass
          )}
        >
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full shadow-md hover:scale-105 active:scale-95 transition-all pointer-events-auto border border-slate-100 dark:border-slate-800"
            style={buttonStyle}
            aria-label="Cuộn sang phải"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
