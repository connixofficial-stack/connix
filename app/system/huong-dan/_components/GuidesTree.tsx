'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { GuideArticle } from '../_data/guides';

type GuideTreeNode = {
  chapter: string;
  items: Array<{
    section: string;
    items: Array<{
      subsection: string;
      items: GuideArticle[];
    }>;
  }>;
};

type GuidesTreeProps = {
  tree: readonly GuideTreeNode[];
};

export function GuidesTree({ tree }: GuidesTreeProps) {
  const [openChapter, setOpenChapter] = useState<string | null>(null);

  return (
    <section className="space-y-2">
      {tree.map((chapter, chapterIndex) => (
        <div
          key={chapter.chapter}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <button
            type="button"
            onClick={() => setOpenChapter((current) => (current === chapter.chapter ? null : chapter.chapter))}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                {chapterIndex + 1}
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{chapter.chapter}</h2>
            </div>
            <ChevronRight
              size={16}
              className={`text-slate-400 transition-transform ${openChapter === chapter.chapter ? 'rotate-90' : ''}`}
            />
          </button>

          {openChapter === chapter.chapter ? (
            <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
            {chapter.items.map((section, sectionIndex) => (
              <div key={section.section} className="mb-2 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  {chapterIndex + 1}.{sectionIndex + 1}. {section.section}
                </div>

                <div className="space-y-2 px-2 pb-2">
                  {section.items.map((subsection, subsectionIndex) => (
                    <div key={subsection.subsection} className="rounded-md bg-white px-3 py-2 dark:bg-slate-900">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {chapterIndex + 1}.{sectionIndex + 1}.{subsectionIndex + 1}. {subsection.subsection}
                      </div>

                      <div className="mt-2 space-y-1">
                        {subsection.items.map((article) => (
                          <Link
                            key={article.slug}
                            href={`/system/huong-dan/${article.slug}`}
                            className="block rounded-md border border-slate-200 px-3 py-2 text-sm transition-colors hover:border-cyan-400/40 hover:bg-cyan-50/60 dark:border-slate-800 dark:hover:border-cyan-500/30 dark:hover:bg-slate-800"
                          >
                            <div className="font-medium text-slate-900 dark:text-slate-100">{article.title}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}
