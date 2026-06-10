'use client';

import { useMemo, useState } from 'react';
import { BookOpenText } from 'lucide-react';
import { guideArticles, guideTree, searchGuideArticles } from './_data/guides';
import { GuidesSearch } from './_components/GuidesSearch';
import { GuidesTree } from './_components/GuidesTree';

export default function SystemGuidesPage() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchGuideArticles(query), [query]);
  const sectionCount = guideTree.reduce((sum, chapter) => sum + chapter.items.length, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-300">
              <BookOpenText size={14} />
              Kho hướng dẫn hệ thống
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
              Mục lục toàn hệ thống
            </h1>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{guideTree.length} chương</span>
            <span>•</span>
            <span>{sectionCount} mục</span>
            <span>•</span>
            <span>{guideArticles.length} bài</span>
          </div>
        </div>
      </section>

      <GuidesSearch query={query} results={results} onQueryChange={setQuery} />
      <GuidesTree tree={guideTree} />
    </div>
  );
}
