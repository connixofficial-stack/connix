'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/app/admin/components/ui';

type DayTone = 'default' | 'muted' | 'success' | 'warning' | 'danger';

type MonthCalendarProps = {
  month: Date;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
  onMonthChange: (nextMonth: Date) => void;
  onSelectDate: (date: string) => void;
  getDayTone?: (date: string) => DayTone;
  getDayBadge?: (date: string) => number | undefined;
  isDayDisabled?: (date: string) => boolean;
};

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const formatDateYmd = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getToneClass = (tone: DayTone) => {
  if (tone === 'success') {return 'border-emerald-200 bg-emerald-50 text-emerald-700';}
  if (tone === 'warning') {return 'border-amber-200 bg-amber-50 text-amber-700';}
  if (tone === 'danger') {return 'border-rose-200 bg-rose-50 text-rose-700';}
  if (tone === 'muted') {return 'border-slate-200 bg-slate-50 text-slate-400';}
  return 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
};

export function MonthCalendar({
  month,
  selectedDate,
  minDate,
  maxDate,
  onMonthChange,
  onSelectDate,
  getDayTone,
  getDayBadge,
  isDayDisabled,
}: MonthCalendarProps) {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthStartWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const canNavigateToMonth = (targetMonth: Date) => {
    const monthStart = formatDateYmd(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1));
    const monthEnd = formatDateYmd(new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0));

    if (minDate && monthEnd < minDate) {
      return false;
    }

    if (maxDate && monthStart > maxDate) {
      return false;
    }

    return true;
  };

  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const canGoPrevMonth = canNavigateToMonth(prevMonth);
  const canGoNextMonth = canNavigateToMonth(nextMonth);

  const calendarCells = useMemo(() => {
    const cells: Array<{ type: 'empty' } | { type: 'day'; date: string; dayNumber: number }> = [];

    for (let i = 0; i < monthStartWeekday; i += 1) {
      cells.push({ type: 'empty' });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      cells.push({ type: 'day', date: formatDateYmd(date), dayNumber: day });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ type: 'empty' });
    }

    return cells;
  }, [daysInMonth, month, monthStartWeekday]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoPrevMonth}
          onClick={() => onMonthChange(prevMonth)}
        >
          <ChevronLeft size={16} className="mr-1" /> Tháng trước
        </Button>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoNextMonth}
          onClick={() => onMonthChange(nextMonth)}
        >
          Tháng sau <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-slate-500 py-1">{label}</div>
        ))}

        {calendarCells.map((cell, index) => {
          if (cell.type === 'empty') {
            return <div key={`empty-${index}`} className="h-16 rounded-md bg-transparent" />;
          }

          const disabledByRange = (minDate && cell.date < minDate) || (maxDate && cell.date > maxDate);
          const disabledByPredicate = isDayDisabled?.(cell.date) ?? false;
          const isDisabled = Boolean(disabledByRange || disabledByPredicate);
          const isSelected = selectedDate === cell.date;
          const tone = getDayTone?.(cell.date) ?? 'default';
          const badgeValue = getDayBadge?.(cell.date);

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              disabled={isDisabled}
              className={`h-16 rounded-md border px-2 py-1 text-left transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : getToneClass(tone)} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-xs font-medium">{cell.dayNumber}</div>
              {typeof badgeValue === 'number' && badgeValue > 0 && (
                <div className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {badgeValue}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
