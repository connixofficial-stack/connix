'use client';

import Link from 'next/link';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { SeoChecklistItem } from '@/lib/seo/checklist';

type SeoCriticalActionsProps = {
  items: SeoChecklistItem[];
};

export const SeoCriticalActions = ({ items }: SeoCriticalActionsProps) => {
  if (items.length === 0) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-700">
        ✅ Không còn lỗi critical, bạn đã sẵn sàng index tốt hơn.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-slate-700">
        <AlertTriangle size={18} className="text-red-600" />
        <h4 className="font-semibold">Critical First</h4>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border border-slate-200 rounded-md p-3">
            <p className="text-sm font-semibold text-slate-800">{item.title}</p>
            <p className="text-xs text-slate-500 mt-1">{item.whyItMatters}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {item.quickActions?.map((action) => (
                <Link
                  key={`${item.id}-${action.label}`}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-red-50 text-red-700"
                >
                  {action.label}
                  {action.external && <ExternalLink size={12} />}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
