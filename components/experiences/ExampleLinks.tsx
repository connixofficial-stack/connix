import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card } from '@/app/admin/components/ui';

type ExampleLink = {
  label: string;
  url: string;
  description?: string;
};

type ExampleLinksProps = {
  title?: string;
  links: ExampleLink[];
  color?: string;
  compact?: boolean;
};

export function ExampleLinks({ title = 'Xem ví dụ thực tế', links, color = '#0ea5e9', compact = false }: ExampleLinksProps) {
  if (compact) {
    return (
      <div className="space-y-1">
        {links.map((link, index) => (
          <a
            key={`${link.url}-${index}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:underline"
            style={{ color }}
          >
            <ExternalLink size={12} />
            {link.label}
          </a>
        ))}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-3">
        {title}
      </h3>
      <div className="space-y-2">
        {links.map((link, index) => (
          <Link
            key={`${link.url}-${index}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
          >
            <ExternalLink 
              size={16} 
              className="mt-0.5 flex-shrink-0 transition-colors"
              style={{ color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:opacity-80 transition-opacity">
                {link.label}
              </div>
              {link.description && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {link.description}
                </div>
              )}
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate font-mono">
                {link.url}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
