import React from 'react';
import { Card } from '@/app/admin/components/ui';

export interface SummaryItem {
  label: string;
  value: string | boolean;
  format?: 'text' | 'boolean' | 'capitalize';
}

interface ExperienceSummaryGridProps {
  items: SummaryItem[];
}

function formatValue(item: SummaryItem): string {
  if (typeof item.value === 'boolean') {
    return item.value ? 'Bật' : 'Tắt';
  }
  
  if (item.format === 'capitalize') {
    return item.value.charAt(0).toUpperCase() + item.value.slice(1);
  }
  
  return item.value;
}

export function ExperienceSummaryGrid({ items }: ExperienceSummaryGridProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Tóm tắt áp dụng</h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {items.map((item, index) => (
          <div key={index} className="bg-slate-50 dark:bg-slate-800 rounded-md p-3">
            <p className="text-slate-500">{item.label}</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {formatValue(item)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
