'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { ArrowLeft, GraduationCap, PlayCircle, Lock, ChevronRight, ChevronLeft, Download, ArrowRight, Eye, CheckCircle2, Circle } from 'lucide-react';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { convertToSlug, getRadiusClass, getSmallRadiusClass } from '@/lib/courses/courseUtils';
import { RichContent, withFormatMarker } from '@/components/common/RichContent';
import { useLessonDetailConfig } from '@/lib/experiences';
import { toast } from 'sonner';

type LessonPageProps = {
  params: Promise<{ slug: string; lessonSlugAndId: string }>;
};

export default function LessonDetailPage({ params }: LessonPageProps) {
  const { slug, lessonSlugAndId } = use(params);
  const router = useRouter();
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const config = useLessonDetailConfig();
  const { isAuthenticated, isLoading: authLoading, token } = useCustomerAuth();

  // Parse ID bài học từ slug lai (lessonSlugAndId) dạng tieu-de-bai-hoc--[id]
  const lessonId = useMemo(() => {
    if (!lessonSlugAndId) return '';
    if (lessonSlugAndId.includes('--')) {
      const parts = lessonSlugAndId.split('--');
      return parts[parts.length - 1];
    }
    return lessonSlugAndId;
  }, [lessonSlugAndId]);

  const course = useQuery(api.courses.getBySlug, { slug });
  const lesson = useQuery(api.courses.getLessonById, { id: lessonId as any, token: token ?? undefined });
  const chapters = useQuery(api.courses.listChapters, course?._id ? { courseId: course._id } : 'skip');
  const lessons = useQuery(api.courses.listPublicLessonsByCourse, course?._id ? { courseId: course._id } : 'skip');
  const courseAccess = useQuery(api.courses.getCourseAccess, course?._id ? { courseId: course._id, token: token ?? undefined } : 'skip');
  const courseProgress = useQuery(api.courses.getCourseProgress, course?._id ? { courseId: course._id, token: token ?? undefined } : 'skip');
  const setLessonCompletion = useMutation(api.courses.setLessonCompletion);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  const brandColor = brandColors.primary;
  const isCompactLayout = config.layoutStyle === 'compact';
  const isFocusLayout = config.layoutStyle === 'focus';
  const shouldShowSidebar = config.showSidebar || isFocusLayout || isCompactLayout;
  const radiusClass = getRadiusClass(config.cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(config.cornerRadius);
  const pageMaxClass = isFocusLayout || isCompactLayout ? 'max-w-[1720px]' : 'max-w-[1600px]';
  const directionClass = isCompactLayout ? 'lg:flex-col' : isFocusLayout ? 'lg:flex-row' : 'lg:flex-row-reverse';
  const sidebarWidthClass = isCompactLayout ? 'lg:w-full' : isFocusLayout ? 'lg:w-[320px]' : 'lg:w-[380px]';
  const sidebarPositionClass = isCompactLayout ? '' : 'lg:h-[calc(100vh-140px)] lg:sticky lg:top-24';

  // Trạng thái mở rộng accordion ở sidebar bài học
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  useEffect(() => {
    if (lesson?.chapterId) {
      setOpenChapters((prev) => ({ ...prev, [lesson.chapterId]: true }));
    }
  }, [lesson?.chapterId]);

  const lessonsByChapter = useMemo(() => {
    const map = new Map<string, typeof lessons>();
    lessons?.forEach((item) => {
      map.set(item.chapterId, [...(map.get(item.chapterId) ?? []), item]);
    });
    return map;
  }, [lessons]);

  // Tính bài học trước và bài sau
  const navigation = useMemo(() => {
    if (!lessons || !lesson) return { next: null, prev: null };
    const sortedLessons = [...lessons].sort((a, b) => {
      if (a.chapterId !== b.chapterId) {
        const chapterA = chapters?.find((c) => c._id === a.chapterId);
        const chapterB = chapters?.find((c) => c._id === b.chapterId);
        return (chapterA?.order ?? 0) - (chapterB?.order ?? 0);
      }
      return a.order - b.order;
    });

    const currentIndex = sortedLessons.findIndex((item) => item._id === lesson._id);
    return {
      next: currentIndex !== -1 && currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null,
      prev: currentIndex > 0 ? sortedLessons[currentIndex - 1] : null,
    };
  }, [lessons, lesson, chapters]);

  // Loading state
  const isDataLoading = course === undefined || lesson === undefined || (course ? chapters === undefined || lessons === undefined || courseAccess === undefined || courseProgress === undefined : false);
  if (isDataLoading || authLoading) {
    return <LessonDetailSkeleton />;
  }

  // Not Found state
  if (!course || !lesson || lesson.courseId !== course._id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-zinc-700" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f7]">Không tìm thấy bài học</h1>
          <p className="mt-2 text-slate-500 dark:text-[#86868b]">Bài học không tồn tại hoặc đã bị xóa.</p>
          <Link href="/khoa-hoc" className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium text-white" style={{ backgroundColor: brandColor }}>
            <ArrowLeft size={18} /> Quay lại trang khóa học
          </Link>
        </div>
      </div>
    );
  }

  // Kiểm tra quyền truy cập bài học
  const isFreeCourse = course.pricingType === 'free';
  const hasFullCourseAccess = Boolean(courseAccess?.hasAccess);
  const hasAccess = isAuthenticated && (isFreeCourse || lesson.isPreview || hasFullCourseAccess);
  const progress = courseProgress!;
  const completedLessonIdSet = new Set<string>(progress.completedLessonIds.map(String));
  const isLessonCompleted = completedLessonIdSet.has(String(lesson._id));
  const progressPercent = progress.progressPercent;
  const completedLessonsCount = progress.completedLessonsCount;
  const progressLessonCount = progress.lessonCount || course.lessonCount;

  const handleToggleLessonCompletion = async () => {
    if (!token || !hasAccess) {
      return;
    }
    setIsSavingProgress(true);
    try {
      const result = await setLessonCompletion({
        completed: !isLessonCompleted,
        lessonId: lesson._id,
        token,
      });
      toast.success(!isLessonCompleted ? 'Đã đánh dấu hoàn thành bài học' : 'Đã bỏ đánh dấu hoàn thành');
      if (result.progressPercent >= 100) {
        toast.success('Chúc mừng, bạn đã hoàn thành khóa học!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu tiến độ học.');
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Parse Video URL Embed
  const videoEmbedUrl = () => {
    if (!lesson.videoUrl) return null;
    if (lesson.videoType === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = lesson.videoUrl.match(regExp);
      const videoId = match && match[2].length === 11 ? match[2] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (lesson.videoType === 'drive') {
      return lesson.videoUrl.replace('/view', '/preview');
    }
    return lesson.videoUrl;
  };

  const embedUrl = videoEmbedUrl();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black flex justify-center pb-24 font-active" style={{ fontFamily: 'var(--font-be-vietnam-pro), sans-serif' }}>
      {/* Ẩn scrollbar thô của trình duyệt bằng CSS inline */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .no-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .no-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? '#3f3f46' : '#cbd5e1'};
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#52525b' : '#94a3b8'};
        }
      `}</style>

      <div className={`w-full flex flex-col ${shouldShowSidebar ? directionClass : ''} ${pageMaxClass} ${isCompactLayout ? 'gap-5 px-4 py-6' : 'gap-6 px-4 py-8'}`}>
        {/* Cột chính */}
        <section className={`flex-1 min-w-0 flex flex-col ${isCompactLayout ? 'gap-5' : 'gap-6'}`}>
          {config.showCourseBreadcrumb && !shouldShowSidebar && (
            <Link href={`/khoa-hoc/${course.slug}`} className="inline-flex w-fit items-center gap-1.5 text-xs text-slate-500 dark:text-[#86868b] hover:text-slate-900 dark:hover:text-[#f5f5f7] transition-colors">
              <ArrowLeft size={12} /> {course.title}
            </Link>
          )}

          {hasFullCourseAccess && (
            <div className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-4 ${radiusClass}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-[#86868b]">
                    <span>Tiến độ khóa học</span>
                    <span>{completedLessonsCount}/{progressLessonCount} bài · {progressPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: brandColor }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggleLessonCompletion()}
                  disabled={isSavingProgress}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white disabled:opacity-60 ${smallRadiusClass}`}
                  style={{ backgroundColor: isLessonCompleted ? '#16a34a' : brandColor }}
                >
                  {isLessonCompleted ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                  {isLessonCompleted ? 'Đã học xong bài này' : 'Đánh dấu đã học xong'}
                </button>
              </div>
            </div>
          )}

          {/* Video Player / Lock Wall */}
          <div className={`aspect-video bg-black ${radiusClass} overflow-hidden shadow-sm relative`}>
            {hasAccess ? (
              embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <PlayCircle size={48} className="text-slate-600" />
                  <p className="text-sm">Bài học không có video phát.</p>
                </div>
              )
            ) : (
              /* Lock Wall Screen */
              <div className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 ${config.lockWallStyle === 'card' ? 'bg-slate-100 dark:bg-[#1c1c1e] text-slate-900 dark:text-[#f5f5f7]' : 'bg-slate-900/90 text-white'}`}>
                <div className={`p-4 rounded-full mb-4 ${config.lockWallStyle === 'card' ? 'bg-white dark:bg-[#2c2c2e] shadow-sm' : 'bg-white/10 backdrop-blur-md'}`}>
                  <Lock size={32} className="text-amber-400" />
                </div>
                {!isAuthenticated ? (
                  <>
                    <h3 className="text-xl font-bold mb-2">Đăng nhập để xem bài học</h3>
                    <p className={`text-sm max-w-md mb-6 ${config.lockWallStyle === 'card' ? 'text-slate-500 dark:text-[#86868b]' : 'text-slate-300'}`}>
                      Để truy cập nội dung học tập và xem video học thử, vui lòng đăng nhập tài khoản của bạn.
                    </p>
                    <button
                      onClick={() => router.push(`/account/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
                      className={`px-6 py-2.5 font-bold text-sm text-white hover:opacity-90 transition-all flex items-center gap-2 shadow-lg ${smallRadiusClass}`}
                      style={{ backgroundColor: brandColor }}
                    >
                      Đăng nhập ngay <ArrowRight size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold mb-2">Bài học chưa được kích hoạt</h3>
                    <p className={`text-sm max-w-md mb-6 ${config.lockWallStyle === 'card' ? 'text-slate-500 dark:text-[#86868b]' : 'text-slate-300'}`}>
                      Đây là nội dung thuộc chương trình khóa học có phí. Vui lòng liên hệ ban quản trị để đăng ký kích hoạt tài khoản của bạn.
                    </p>
                    <Link
                      href={`/contact?subject=${encodeURIComponent(`Đăng ký khóa học: ${course.title}`)}`}
                      className={`px-6 py-2.5 font-bold text-sm text-white hover:opacity-90 transition-all flex items-center gap-2 shadow-lg ${smallRadiusClass}`}
                      style={{ backgroundColor: brandColor }}
                    >
                      Đăng ký khóa học <GraduationCap size={16} />
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Completion banner */}
          {progress.completedAt && (
            <div className={`border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-5 ${radiusClass}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Hoàn thành khóa học</p>
                  <h3 className="mt-1 text-lg font-bold text-emerald-950 dark:text-emerald-100">{course.title}</h3>
                  <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                    Ngày hoàn thành: {new Date(progress.completedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <Link
                  href={`/khoa-hoc/${course.slug}`}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white ${smallRadiusClass}`}
                  style={{ backgroundColor: brandColor }}
                >
                  Xem bằng hoàn thành <GraduationCap size={16} />
                </Link>
              </div>
            </div>
          )}

          {/* Lesson Details */}
          <div className={`bg-white dark:bg-[#161617] border border-slate-200 dark:border-zinc-800 ${isCompactLayout ? 'p-5 space-y-5' : 'p-6 space-y-6'} ${radiusClass} relative overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-[#6e6e73] uppercase tracking-wider">Bài học</span>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f7] mt-1">{lesson.title}</h1>
              </div>
              {config.showExerciseDownload && lesson.exerciseLink && hasAccess && (
                <a
                  href={lesson.exerciseLink}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-[#2c2c2e] text-xs font-medium text-slate-700 dark:text-[#f5f5f7] transition shadow-sm ${smallRadiusClass}`}
                >
                  <Download size={14} className="text-slate-500 dark:text-[#86868b]" /> Tải bài tập thử
                </a>
              )}
            </div>

            {/* Lock/Blur mô tả nếu không có quyền truy cập */}
            <div className="relative">
              <div className={!hasAccess ? 'blur-sm select-none pointer-events-none opacity-40' : ''}>
                {lesson.description ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-[#86868b] leading-relaxed">
                    <RichContent content={lesson.description} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-[#6e6e73] italic">Mô tả bài học đang được cập nhật.</p>
                )}
              </div>

              {!hasAccess && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-white/30 dark:bg-black/30 backdrop-blur-[2px]">
                  <div className="bg-white/80 dark:bg-[#161617]/90 border border-slate-200 dark:border-zinc-800 shadow-lg rounded-xl p-6 max-w-sm">
                    <Eye size={24} className="mx-auto mb-2 text-slate-400 dark:text-[#86868b]" />
                    <h4 className="font-bold text-slate-800 dark:text-[#f5f5f7] text-sm">Tài liệu đang bị khóa</h4>
                    <p className="text-xs text-slate-500 dark:text-[#86868b] mt-1 mb-4">
                      {!isAuthenticated
                        ? "Vui lòng đăng nhập tài khoản của bạn để mở khóa tài liệu và bài tập thực hành."
                        : "Khóa học này yêu cầu kích hoạt tài khoản để truy cập toàn bộ tài liệu giáo trình."}
                    </p>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push(`/account/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                        } else {
                          router.push(`/contact?subject=${encodeURIComponent(`Đăng ký khóa học: ${course.title}`)}`);
                        }
                      }}
                      className="px-4 py-2 text-xs font-bold text-white rounded-lg hover:opacity-90 transition-all"
                      style={{ backgroundColor: brandColor }}
                    >
                      {!isAuthenticated ? "Đăng nhập ngay" : "Liên hệ kích hoạt"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Navigation Control */}
          {config.showLessonNavigation && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-zinc-800 pt-6 mt-4">
              {navigation.prev ? (
                <Link
                  href={`/khoa-hoc/${course.slug}/bai-hoc/${convertToSlug(navigation.prev.title)}--${navigation.prev._id}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#86868b] hover:text-slate-900 dark:hover:text-[#f5f5f7] transition-colors"
                >
                  <ChevronLeft size={16} /> Bài trước
                </Link>
              ) : (
                <span className="text-xs text-slate-300 dark:text-zinc-700 cursor-not-allowed inline-flex items-center gap-2">
                  <ChevronLeft size={16} /> Bài trước
                </span>
              )}

              {navigation.next ? (
                <Link
                  href={`/khoa-hoc/${course.slug}/bai-hoc/${convertToSlug(navigation.next.title)}--${navigation.next._id}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#86868b] hover:text-slate-900 dark:hover:text-[#f5f5f7] transition-colors"
                >
                  Bài sau <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="text-xs text-slate-300 dark:text-zinc-700 cursor-not-allowed inline-flex items-center gap-2">
                  Bài sau <ChevronRight size={16} />
                </span>
              )}
            </div>
          )}
        </section>

        {/* Sidebar */}
        {shouldShowSidebar && (
          <aside className={`w-full ${sidebarWidthClass} shrink-0 bg-white dark:bg-[#111111] border border-slate-200 dark:border-zinc-800 ${radiusClass} shadow-sm flex flex-col h-auto ${sidebarPositionClass} overflow-y-auto no-scrollbar`}>
            <div className={`p-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#111111] sticky top-0 z-10 ${config.cornerRadius === 'none' ? 'rounded-none' : 'rounded-t-xl'}`}>
              {config.showCourseBreadcrumb && (
                <Link href={`/khoa-hoc/${course.slug}`} className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#86868b] hover:text-slate-900 dark:hover:text-[#f5f5f7] transition-colors mb-2">
                  <ArrowLeft size={12} /> {course.title}
                </Link>
              )}
              <h2 className="font-bold text-slate-950 dark:text-[#f5f5f7] text-sm">{isFocusLayout ? 'Khóa học & tiến độ' : 'Nội dung khóa học'}</h2>
              {hasFullCourseAccess && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-[#86868b]">
                    <span>Đã học</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: brandColor }} />
                  </div>
                </div>
              )}
              {isFocusLayout && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-[#86868b]">
                  <span className={`border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#1c1c1e] px-2 py-1.5 ${smallRadiusClass}`}>{chapters?.length ?? 0} chương</span>
                  <span className={`border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#1c1c1e] px-2 py-1.5 ${smallRadiusClass}`}>{lessons?.length ?? 0} bài học</span>
                </div>
              )}
            </div>

            <div className={`flex-1 ${isCompactLayout ? 'grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]' : 'divide-y divide-slate-100 dark:divide-zinc-800'}`}>
              {chapters?.map((chapter, chapterIndex) => {
                const chapterLessons = lessonsByChapter.get(chapter._id) ?? [];
                const isOpen = openChapters[chapter._id] ?? false;
                return (
                  <div key={chapter._id} className={`bg-white dark:bg-[#111111] ${isCompactLayout ? `${radiusClass} border border-slate-200 dark:border-zinc-800 overflow-hidden` : ''}`}>
                    <button
                      onClick={() => toggleChapter(chapter._id)}
                      className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-[#f5f5f7] hover:bg-slate-50/80 dark:hover:bg-[#1c1c1e]/80 transition-colors"
                    >
                      <span className="line-clamp-2 pr-2">{chapterIndex + 1}. {chapter.title}</span>
                      <ChevronRight size={14} className={`text-slate-400 dark:text-[#6e6e73] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className={`bg-slate-50/40 dark:bg-[#0a0a0a] pb-2 ${isCompactLayout ? 'max-h-[360px] overflow-y-auto no-scrollbar' : ''}`}>
                        {chapter.summary && (
                          <div className="mx-4 mb-3 text-[11px] leading-relaxed text-slate-600 dark:text-[#86868b] bg-white dark:bg-[#161617] p-3 rounded-lg border border-slate-200/60 dark:border-zinc-800">
                            <RichContent content={withFormatMarker('richtext', chapter.summary)} />
                          </div>
                        )}
                        {chapterLessons.map((item, itemIndex) => {
                          const isActive = item._id === lesson._id;
                          const itemCompleted = completedLessonIdSet.has(String(item._id));
                          return (
                            <Link
                              key={item._id}
                              href={`/khoa-hoc/${course.slug}/bai-hoc/${convertToSlug(item.title)}--${item._id}`}
                              className={`flex items-start gap-2.5 px-5 py-3 text-xs transition-colors border-l-4 ${
                                isActive
                                  ? 'bg-slate-100/80 dark:bg-[#1c1c1e] font-bold text-slate-950 dark:text-[#f5f5f7]'
                                  : 'text-slate-600 dark:text-[#86868b] hover:text-slate-950 dark:hover:text-[#f5f5f7] hover:bg-slate-100/30 dark:hover:bg-[#1c1c1e]/60 border-l-transparent'
                              }`}
                              style={isActive ? { borderLeftColor: brandColor } : undefined}
                            >
                              <span className="font-mono text-slate-400 dark:text-[#6e6e73] mt-0.5 shrink-0 w-6">{chapterIndex + 1}.{itemIndex + 1}</span>
                              <span className="flex-1 line-clamp-2 leading-relaxed">{item.title}</span>
                              {itemCompleted ? (
                                <span className="rounded bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">Đã học</span>
                              ) : hasFullCourseAccess ? (
                                <span className="rounded bg-sky-50 dark:bg-sky-900/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-400 shrink-0">Đã mở</span>
                              ) : item.isPreview ? (
                                <span className="rounded bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">Học thử</span>
                              ) : (
                                <Lock size={12} className="text-slate-400 dark:text-zinc-700 mt-0.5 shrink-0" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}

function LessonDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex justify-center pb-24">
      <div className="w-full max-w-[1600px] flex flex-col lg:flex-row-reverse gap-6 px-4 py-8">
        <section className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="aspect-video bg-slate-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          <div className="bg-white dark:bg-[#161617] p-6 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-4">
            <div className="h-4 w-20 bg-slate-200 dark:bg-zinc-700 animate-pulse rounded" />
            <div className="h-8 w-2/3 bg-slate-200 dark:bg-zinc-700 animate-pulse rounded" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full bg-slate-100 dark:bg-zinc-800 animate-pulse rounded" />
              <div className="h-4 w-full bg-slate-100 dark:bg-zinc-800 animate-pulse rounded" />
              <div className="h-4 w-5/6 bg-slate-100 dark:bg-zinc-800 animate-pulse rounded" />
            </div>
          </div>
        </section>

        <aside className="w-full lg:w-[380px] shrink-0 bg-white dark:bg-[#111111] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-700 animate-pulse rounded" />
          <div className="h-6 w-48 bg-slate-200 dark:bg-zinc-700 animate-pulse rounded" />
          <div className="space-y-3 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-full bg-slate-100 dark:bg-zinc-800 animate-pulse rounded" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
