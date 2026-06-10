'use client';

import React, { use, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { RichContent, withFormatMarker } from '@/components/common/RichContent';
import { useProjectsDetailConfig } from '@/lib/experiences';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { ArrowLeft, Briefcase, ExternalLink, PlayCircle } from 'lucide-react';

type VideoType = 'none' | 'youtube' | 'drive' | 'external';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getEmbedUrl = (type: VideoType, url?: string) => {
  if (!url || type === 'none') {return null;}
  if (type === 'youtube') {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    const videoId = match && match[2]?.length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }
  if (type === 'drive') {
    return url.replace('/view', '/preview');
  }
  return url;
};

const resolveProjectContent = (project: {
  content: string;
  htmlRender?: string;
  markdownRender?: string;
  renderType?: 'content' | 'markdown' | 'html';
}) => {
  if (project.renderType === 'markdown') {
    return project.markdownRender?.trim() ? withFormatMarker('markdown', project.markdownRender) : '';
  }
  if (project.renderType === 'html') {
    return project.htmlRender?.trim() ? withFormatMarker('html', project.htmlRender) : '';
  }
  return project.content ? withFormatMarker('richtext', project.content) : '';
};

export default function ProjectDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { primary: brandColor } = useBrandColors();
  const detailConfig = useProjectsDetailConfig();
  const project = useQuery(api.projects.getBySlug, { slug });
  const category = useQuery(api.projectCategories.getById, project?.categoryId ? { id: project.categoryId } : 'skip');
  const categories = useQuery(api.projectCategories.listActive, { limit: 100 });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const incrementViews = useMutation(api.projects.incrementViews);
  const relatedProjects = useQuery(
    api.projects.searchPublished,
    project?.categoryId ? { categoryId: project.categoryId, limit: 4 } : 'skip'
  );

  const categorySlugMap = useMemo(() => new Map((categories ?? []).map((item) => [item._id, item.slug])), [categories]);

  useEffect(() => {
    if (project?._id) {
      void incrementViews({ id: project._id });
    }
  }, [incrementViews, project?._id]);

  if (project === undefined) {
    return <ProjectDetailSkeleton />;
  }

  if (project === null || project.status !== 'Published') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Briefcase size={32} className="text-slate-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-950 dark:text-white">Không tìm thấy dự án</h1>
          <p className="mx-auto mb-8 max-w-sm text-slate-500">Dự án này không tồn tại hoặc chưa được xuất bản.</p>
          <Link href="/projects" className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium text-white" style={{ backgroundColor: brandColor }}>
            <ArrowLeft size={18} />
            Xem tất cả dự án
          </Link>
        </div>
      </div>
    );
  }

  const resolvedContent = resolveProjectContent(project);
  const embedUrl = getEmbedUrl((project.introVideoType ?? 'none') as VideoType, project.introVideoUrl);
  const galleryImages = (project.images ?? []).filter(Boolean);
  const filteredRelated = detailConfig.showRelated
    ? (relatedProjects?.filter((item) => item._id !== project._id).slice(0, 3) ?? [])
    : [];

  return (
    <main className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="px-4 py-10 md:py-14">
        <div className="mx-auto max-w-5xl">
          <Link href="/projects" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft size={16} />
            Quay lại dự án
          </Link>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{category?.name ?? 'Dự án'}</span>
              {detailConfig.showClientName && project.clientName && <span className="text-sm text-slate-500">Khách hàng: {project.clientName}</span>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{project.title}</h1>
            {project.excerpt && <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{project.excerpt}</p>}
            {project.projectUrl && (
              <a href={project.projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: brandColor }}>
                Xem dự án
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          {project.thumbnail && (
            <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.thumbnail} alt={project.title} className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      {detailConfig.showIntroVideo && embedUrl && (
        <section className="px-4 pb-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center gap-2">
              <PlayCircle size={20} style={{ color: brandColor }} />
              <h2 className="text-xl font-semibold">Video giới thiệu</h2>
            </div>
            <div className="aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
              <iframe src={embedUrl} className="h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pb-12">
        <div className="mx-auto max-w-4xl">
          {resolvedContent && (
            <RichContent
              content={resolvedContent}
              className="prose prose-lg max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl dark:prose-invert"
            />
          )}
        </div>
      </section>

      {detailConfig.showGallery && galleryImages.length > 0 && (
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-5 text-2xl font-bold">Thư viện ảnh</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {galleryImages.map((image, index) => (
                <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={`${project.title} ${index + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {filteredRelated.length > 0 && (
        <section className="bg-slate-50 px-4 py-12 dark:bg-slate-900/50">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-6 text-2xl font-bold">Dự án liên quan</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {filteredRelated.map((item) => (
                <Link
                  key={item._id}
                  href={buildDetailPath({
                    categorySlug: categorySlugMap.get(item.categoryId),
                    mode: routeMode,
                    moduleKey: 'projects',
                    recordSlug: item.slug,
                  })}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800">
                    {item.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 font-semibold">{item.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-12">
      <div className="mb-8 h-4 w-32 rounded bg-slate-200" />
      <div className="space-y-4">
        <div className="h-5 w-24 rounded-full bg-slate-200" />
        <div className="h-12 w-full rounded bg-slate-200" />
        <div className="h-6 w-2/3 rounded bg-slate-200" />
        <div className="aspect-video rounded-3xl bg-slate-200" />
      </div>
    </div>
  );
}
