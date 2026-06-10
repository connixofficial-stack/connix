'use client';

import Link from 'next/link';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { ChevronRight, ExternalLink, FileText, Link2 } from 'lucide-react';
import { guideArticleMap, guideArticles } from '../_data/guides';

type GuideArticlePageProps = {
  params: Promise<{ slug: string }>;
};

const SMART_WIZARD_SLUG = 'admin-home-components-smart-wizard-toggle';

export default function GuideArticlePage({ params }: GuideArticlePageProps) {
  const { slug } = use(params);
  const article = guideArticleMap.get(slug);

  if (!article) {
    notFound();
  }

  const isSmartWizardGuide = article.slug === SMART_WIZARD_SLUG;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/system/huong-dan" className="hover:text-cyan-600 dark:hover:text-cyan-300">
            Hướng dẫn
          </Link>
          <ChevronRight size={14} />
          <span>{article.chapter}</span>
          <ChevronRight size={14} />
          <span>{article.section}</span>
          <ChevronRight size={14} />
          <span>{article.subsection}</span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300">
            <FileText size={14} />
            Bài hướng dẫn tĩnh
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{article.title}</h1>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{article.description}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {isSmartWizardGuide ? (
            <div className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
              <p>
                Bài này dành cho lúc anh muốn cho team dùng hoặc tạm ẩn nút <strong>Smart Wizard</strong> trong trang Home
                Components.
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Đi nhanh tới chỗ thao tác
                </div>
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/admin/home-components"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
                    >
                      Mở Home Components
                      <ExternalLink size={16} />
                    </Link>
                    <Link
                      href="/system/modules/homepage"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Mở Module Homepage
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cách bật Smart Wizard</h2>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Bấm <strong>Mở Module Homepage</strong>.</li>
                  <li>Tìm mục cài đặt của Smart Wizard.</li>
                  <li>Bật lại Smart Wizard nếu đang tắt.</li>
                  <li>Quay về trang Home Components để kiểm tra nút đã hiện chưa.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cách tắt Smart Wizard</h2>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Bấm <strong>Mở Module Homepage</strong>.</li>
                  <li>Tắt mục Smart Wizard.</li>
                  <li>Quay lại Home Components và kiểm tra nút đã ẩn.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nếu không thấy nút</h2>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Kiểm tra xem Smart Wizard có đang bị tắt trong Module Homepage không.</li>
                  <li>Sau khi đổi cài đặt, tải lại trang Home Components.</li>
                  <li>Nếu vẫn chưa thấy, mở lại đúng trang Home Components bằng nút ở trên rồi kiểm tra lại.</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Khung nội dung sẽ viết sau</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-4 dark:border-slate-700">
                  Mục này mới tạo khung bài. Khi viết nội dung thật, nên giữ format ngắn, chia nhỏ theo heading và tập trung
                  đúng bài này thay vì dồn quá nhiều thứ vào một trang.
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">Outline gợi ý</h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Bài này dùng để làm gì</li>
                    <li>Điểm vào trong system/admin/site</li>
                    <li>Luồng thao tác chính</li>
                    <li>Các nút, action, setting cần biết</li>
                    <li>Lỗi thường gặp và chỗ cần kiểm tra</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Route liên quan</h2>
            <div className="mt-3 space-y-2">
              {article.relatedRoutes.map((route) => (
                <div
                  key={route}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  {route}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Từ khóa search</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {article.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  <Link2 size={12} />
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Các bài cùng chương</h2>
            <div className="mt-3 space-y-2">
              {guideArticles
                .filter((candidate) => candidate.chapter === article.chapter && candidate.slug !== article.slug)
                .slice(0, 6)
                .map((candidate) => (
                  <Link
                    key={candidate.slug}
                    href={`/system/huong-dan/${candidate.slug}`}
                    className="block rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors hover:border-cyan-400/40 hover:bg-cyan-50/60 dark:border-slate-700 dark:hover:border-cyan-500/30 dark:hover:bg-slate-800"
                  >
                    {candidate.title}
                  </Link>
                ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
