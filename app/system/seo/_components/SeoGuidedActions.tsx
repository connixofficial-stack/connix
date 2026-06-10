'use client';

import Link from 'next/link';
import { ExternalLink, Route } from 'lucide-react';
import type { SeoChecklistItem } from '@/lib/seo/checklist';

type SeoGuidedActionsProps = {
  items: SeoChecklistItem[];
};

export const SeoGuidedActions = ({ items }: SeoGuidedActionsProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-slate-700">
        <Route size={18} className="text-indigo-500" />
        <h4 className="font-semibold">Guided Actions (Ngoài hệ thống)</h4>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border border-slate-200 rounded-md p-3 space-y-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500">{item.whyItMatters}</p>
            </div>
            {item.steps && (
              <ol className="text-xs text-slate-600 list-decimal pl-4 space-y-1">
                {item.steps.map((step, index) => (
                  <li key={`${item.id}-step-${index}`}>{step}</li>
                ))}
              </ol>
            )}
            <div className="flex flex-wrap gap-2">
              {item.quickActions?.map((action) => (
                <Link
                  key={`${item.id}-${action.label}`}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700"
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
