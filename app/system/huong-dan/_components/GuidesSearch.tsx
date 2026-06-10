'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import type { GuideArticle } from '../_data/guides';

type GuidesSearchProps = {
  query: string;
  results: readonly GuideArticle[];
  onQueryChange: (value: string) => void;
};

export function GuidesSearch({ query, results, onQueryChange }: GuidesSearchProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
        <Search size={18} className="text-slate-400" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Tìm trong kho hướng dẫn: sản phẩm, seed, trust badge..."
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
      </div>

      {query.trim() ? (
        <div className="mt-3 space-y-2">

          {results.length > 0 ? (
            <div className="grid gap-2">
              {results.map((article) => (
                <Link
                  key={article.slug}
                  href={`/system/huong-dan/${article.slug}`}
                  className="rounded-md border border-slate-200 px-3 py-2 transition-colors hover:border-cyan-400/40 hover:bg-cyan-50/60 dark:border-slate-800 dark:hover:border-cyan-500/30 dark:hover:bg-slate-800"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{article.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {article.chapter} / {article.section} / {article.subsection}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Không tìm thấy bài phù hợp.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
