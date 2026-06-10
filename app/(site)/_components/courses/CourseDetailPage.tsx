'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, GraduationCap, PlayCircle, Star, UserRound, ChevronDown, Lock, Play, ShoppingCart, Award } from 'lucide-react';
import { RichContent, withFormatMarker } from '@/components/common/RichContent';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { getCourseLevelLabel } from '@/lib/courses/labels';
import { useCoursesDetailConfig } from '@/lib/experiences';
import { getRadiusClass, getSmallRadiusClass, formatPrice, convertToSlug } from '@/lib/courses/courseUtils';
import { useCart } from '@/lib/cart';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { CertificateCard } from './CertificateCard';

type CourseContentSource = {
  content: string;
  htmlRender?: string;
  markdownRender?: string;
  renderType?: 'content' | 'markdown' | 'html';
};

const resolveCourseContent = (course: CourseContentSource) => {
  if (course.renderType === 'markdown') {
    return course.markdownRender ? withFormatMarker('markdown', course.markdownRender) : '';
  }
  if (course.renderType === 'html') {
    return course.htmlRender ? withFormatMarker('html', course.htmlRender) : '';
  }
  return course.content ? withFormatMarker('richtext', course.content) : '';
};

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const config = useCoursesDetailConfig();
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const { addItem, openDrawer } = useCart();
  const { customer, token } = useCustomerAuth();
  const course = useQuery(api.courses.getBySlug, { slug });
  const courseCommerceSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'courses', settingKey: 'commerceMode' });
  const category = useQuery(api.courseCategories.getById, course?.categoryId ? { id: course.categoryId } : 'skip');
  const chapters = useQuery(api.courses.listChapters, course?._id ? { courseId: course._id } : 'skip');
  const lessons = useQuery(api.courses.listPublicLessonsByCourse, course?._id ? { courseId: course._id } : 'skip');
  const courseAccess = useQuery(api.courses.getCourseAccess, course?._id ? { courseId: course._id, token: token ?? undefined } : 'skip');
  const courseProgress = useQuery(api.courses.getCourseProgress, course?._id ? { courseId: course._id, token: token ?? undefined } : 'skip');
  const relatedCourses = useQuery(api.courses.searchPublished, course?.categoryId ? { categoryId: course.categoryId, limit: 4 } : 'skip');
  const incrementViews = useMutation(api.courses.incrementViews);
  const courseFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'courses', featureKey: 'enableCourseFilters' });
  const assignedFilters = useQuery(api.courseFilters.listByCourse, course?._id ? { courseId: course._id } : 'skip');

  const brandColor = brandColors.primary;
  const secondaryColor = brandColors.secondary || '';
  const colorMode = brandColors.mode || 'single';



  // Tự sinh màu gradient Modern ở chế độ 1 màu
  const accent = useMemo(() => {
    if (colorMode === 'single' || !secondaryColor) {
      return brandColor + 'dd';
    }
    return secondaryColor;
  }, [brandColor, secondaryColor, colorMode]);

  const cornerRadius = config.cornerRadius ?? 'lg';
  const radiusClass = getRadiusClass(cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(cornerRadius);

  const [showPromoVideo, setShowPromoVideo] = useState(false);

  const promoVideoEmbedUrl = useMemo(() => {
    if (!course?.introVideoUrl || course.introVideoType === 'none') return null;
    if (course.introVideoType === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = course.introVideoUrl.match(regExp);
      const videoId = match && match[2].length === 11 ? match[2] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (course.introVideoType === 'drive') {
      return course.introVideoUrl.replace('/view', '/preview');
    }
    return course.introVideoUrl;
  }, [course?.introVideoUrl, course?.introVideoType]);

  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  useEffect(() => {
    if (chapters && chapters.length > 0 && Object.keys(openChapters).length === 0) {
      setOpenChapters({ [chapters[0]._id]: true });
    }
  }, [chapters, openChapters]);

  useEffect(() => {
    if (course?._id) {
      void incrementViews({ id: course._id });
    }
  }, [course?._id, incrementViews]);

  const lessonsByChapter = useMemo(() => {
    const map = new Map<string, typeof lessons>();
    lessons?.forEach((lesson) => {
      map.set(lesson.chapterId, [...(map.get(lesson.chapterId) ?? []), lesson]);
    });
    return map;
  }, [lessons]);
  const completedLessonIds = useMemo(() => new Set(courseProgress?.completedLessonIds ?? []), [courseProgress?.completedLessonIds]);

  if (course === undefined) {
    return <CourseDetailSkeleton />;
  }

  if (course === null || course.status !== 'Published') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-zinc-700" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f7]">Không tìm thấy khóa học</h1>
          <p className="mt-2 text-slate-500 dark:text-[#86868b]">Khóa học không tồn tại hoặc chưa được xuất bản.</p>
          <Link href="/khoa-hoc" className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium text-white" style={{ backgroundColor: brandColors.primary }}>
            <ArrowLeft size={18} /> Xem tất cả khóa học
          </Link>
        </div>
      </div>
    );
  }

  const related = config.showRelated ? (relatedCourses?.filter((item) => item._id !== course._id).slice(0, 3) ?? []) : [];
  const price = formatPrice(course.pricingType, course.priceAmount);
  const showPrice = course.isPriceVisible !== false;
  const courseContent = resolveCourseContent(course);
  const isModern = config.layoutStyle === 'modern';
  const commerceMode = courseCommerceSetting?.value === 'cart' ? 'cart' : 'contact';
  const hasCourseAccess = Boolean(courseAccess?.hasAccess);
  const progressPercent = courseProgress?.progressPercent ?? 0;
  const completedLessonsCount = courseProgress?.completedLessonsCount ?? 0;
  const progressLessonCount = courseProgress?.lessonCount ?? course.lessonCount;
  const firstLessonHref = hasCourseAccess && courseAccess?.firstLessonId && courseAccess.firstLessonTitle
    ? `/khoa-hoc/${course.slug}/bai-hoc/${convertToSlug(courseAccess.firstLessonTitle)}--${courseAccess.firstLessonId}`
    : null;

  const showAside = config.showStickyCta || (related.length > 0);

  const handleRegister = async () => {
    if (firstLessonHref) {
      router.push(firstLessonHref);
      return;
    }
    if (commerceMode === 'cart' && course.pricingType !== 'contact') {
      const ok = await addItem({ itemType: 'course', courseId: course._id, quantity: 1 });
      if (ok) {
        toast.success('Đã thêm khóa học vào giỏ hàng');
        openDrawer();
      }
      return;
    }
    router.push(`/contact?subject=${encodeURIComponent(`Đăng ký khóa học: ${course.title}`)}`);
  };

  const ctaLabel = firstLessonHref
    ? 'Vào học ngay'
    : commerceMode === 'cart' && course.pricingType !== 'contact'
    ? 'Thêm vào giỏ hàng'
    : (!showPrice || course.pricingType === 'contact' ? 'Liên hệ tư vấn' : 'Đăng ký học');

  const CtaCard = () => {
    const hasPromoVideo = !!promoVideoEmbedUrl;
    return (
      <div className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-5 group ${radiusClass}`}>
        {/* Thumbnail với hiệu ứng Hover Zoom */}
        <div
          onClick={hasPromoVideo ? () => setShowPromoVideo(true) : undefined}
          className={`mb-4 flex aspect-video items-center justify-center overflow-hidden bg-slate-100 dark:bg-[#2c2c2e] relative ${smallRadiusClass} ${hasPromoVideo ? 'cursor-pointer group/thumb' : ''}`}
        >
          {course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <>
              <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${brandColor}22, ${accent}22)` }} />
              <PlayCircle size={48} className="relative z-10 transition-transform duration-300 group-hover:scale-105" style={{ color: brandColor }} />
            </>
          )}

          {/* Overlay nút Play tròn lớn nếu có video giới thiệu */}
          {hasPromoVideo && (
            <div className="absolute inset-0 bg-black/35 group-hover/thumb:bg-black/50 transition-colors flex items-center justify-center z-10">
              <div
                className="bg-white/90 text-slate-900 rounded-full shadow-xl transition-all duration-300 group-hover/thumb:scale-110 group-hover/thumb:bg-white flex items-center justify-center w-14 h-14"
              >
                <Play size={22} fill={brandColor} style={{ color: brandColor }} className="translate-x-[2px]" />
              </div>
              <span className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm tracking-wide">
                Xem giới thiệu
              </span>
            </div>
          )}
        </div>
        {showPrice && (
          <>
            <p className="text-sm text-slate-500 dark:text-[#86868b]">{course.priceNote || 'Học trọn đời'}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>{price}</p>
          </>
        )}
        {showPrice && course.comparePriceAmount && course.pricingType === 'paid' && (
          <p className="text-sm text-slate-400 dark:text-[#6e6e73]">
            Giá gốc: <span className="line-through">{formatPrice('paid', course.comparePriceAmount)}</span>
          </p>
        )}
        {hasCourseAccess && (
          <div className="mt-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-[#1c1c1e] p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-[#86868b]">
              <span>Tiến độ học</span>
              <span>{completedLessonsCount}/{progressLessonCount} bài · {progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-zinc-800">
              <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: brandColor }} />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleRegister()}
          className="mt-4 w-full px-5 py-3 font-semibold text-white transition hover:opacity-90 inline-flex items-center justify-center gap-2"
          style={{ backgroundColor: brandColor, borderRadius: cornerRadius === 'none' ? '0px' : cornerRadius === 'sm' ? '8px' : '12px' }}
        >
          {firstLessonHref ? <PlayCircle size={18} /> : commerceMode === 'cart' && course.pricingType !== 'contact' && <ShoppingCart size={18} />}
          {ctaLabel}
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black pb-24 lg:pb-0 font-active" style={{ fontFamily: 'var(--font-be-vietnam-pro), sans-serif' }}>
      {/* Hero header */}
      <section
        className={`border-b border-slate-100 dark:border-zinc-800/60 px-4 ${isModern ? 'py-10 text-white' : 'py-8'}`}
        style={isModern ? { background: `linear-gradient(135deg, ${brandColor}, ${accent})` } : undefined}
      >
        {!isModern && <div className="absolute inset-0 pointer-events-none" />}
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl space-y-4">
            <Link href="/khoa-hoc" className={`inline-flex items-center gap-2 text-sm transition-colors ${isModern ? 'text-white/80 hover:text-white' : 'text-slate-500 dark:text-[#86868b] hover:text-slate-700 dark:hover:text-[#f5f5f7]'}`}>
              <ArrowLeft size={16} /> Tất cả khóa học
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {course.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                  <Star size={12} className="fill-current" /> Nổi bật
                </span>
              )}
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: isModern ? 'rgba(255,255,255,.18)' : isDark ? `${brandColor}20` : `${brandColor}12`,
                  color: isModern ? '#fff' : isDark ? '#f5f5f7' : '#334155',
                }}
              >
                {category?.name ?? 'Khóa học'}{course.level ? ` · ${getCourseLevelLabel(course.level)}` : ''}
              </span>
            </div>
            <h1 className={`max-w-4xl text-4xl font-bold leading-tight md:text-5xl mt-2 ${isModern ? 'text-white' : 'text-slate-900 dark:text-[#f5f5f7]'}`}>
              {course.title}
            </h1>
            {course.excerpt && (
              <p className={`max-w-2xl text-lg mt-2.5 ${isModern ? 'text-white/80' : 'text-slate-600 dark:text-[#86868b]'}`}>
                {course.excerpt}
              </p>
            )}
            <div className={`flex flex-wrap gap-4 text-sm mt-3 ${isModern ? 'text-white/80' : 'text-slate-500 dark:text-[#86868b]'}`}>
              <span className="inline-flex items-center gap-1"><BookOpen size={16} />{course.lessonCount} bài học</span>
              {course.durationText && <span className="inline-flex items-center gap-1"><Clock size={16} />{course.durationText}</span>}
              {config.showInstructor && course.instructorName && <span className="inline-flex items-center gap-1"><UserRound size={16} />{course.instructorName}</span>}
            </div>
            {courseFiltersFeature?.enabled && assignedFilters && assignedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {assignedFilters.map((filter) => (
                  <div
                    key={filter._id}
                    title={filter.name}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold backdrop-blur-sm transition-all duration-300 ${
                      isModern
                        ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#2c2c2e] text-slate-700 dark:text-[#f5f5f7] hover:bg-slate-100 dark:hover:bg-[#3a3a3c]'
                    }`}
                  >
                    {filter.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={filter.icon} alt={filter.name} className="h-4.5 w-4.5 object-contain shrink-0" />
                    )}
                    <span>{filter.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main content grid */}
      <section className={`mx-auto grid max-w-7xl gap-6 px-4 py-8 ${showAside ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'max-w-4xl mx-auto'}`}>
        <div className="space-y-8">
          {/* Rich content */}
          <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-[#f5f5f7] prose-p:text-slate-600 dark:prose-p:text-[#86868b]">
            <RichContent content={courseContent} />
          </article>

          {/* Chứng chỉ hoàn thành */}
          {courseProgress?.completedAt && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f7] flex items-center gap-2">
                    <Award className="text-amber-500" />
                    Chứng nhận hoàn thành của bạn
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#86868b] mt-1">
                    Bạn đã xuất sắc tốt nghiệp khóa học này. Dưới đây là chứng chỉ chính thức của bạn.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {courseProgress.certificateCode && (
                    <a
                      href={`/chung-nhan/${courseProgress.certificateCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-white border border-slate-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Mở trang chứng nhận riêng
                    </a>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl max-w-[1100px] mx-auto group">
                <CertificateCard
                  customerName={customer?.name || "Học viên"}
                  courseTitle={course.title}
                  completedAt={courseProgress.completedAt}
                  certificateCode={courseProgress.certificateCode || ""}
                  currentUrl={typeof window !== 'undefined' ? `${window.location.origin}/chung-nhan/${courseProgress.certificateCode || ""}` : ''}
                />
              </div>
            </section>
          )}

          {/* Bạn sẽ học được gì */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-[#f5f5f7]">Bạn sẽ học được gì?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Biết cách tổ chức dự án rõ ràng', 'Tối ưu SEO cho trang học', 'Kết nối dữ liệu động', 'Đưa website lên online'].map((item) => (
                <div key={item} className={`flex items-start gap-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-3 text-sm text-slate-700 dark:text-[#f5f5f7] ${smallRadiusClass}`}>
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: brandColor }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Nội dung khóa học */}
          {config.showCurriculum && (
            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-[#f5f5f7]">Nội dung khóa học</h2>
              <div className="space-y-3">
                {chapters?.map((chapter, chapterIndex) => {
                  const chapterLessons = lessonsByChapter.get(chapter._id) ?? [];
                  const isOpen = openChapters[chapter._id] ?? false;
                  const shouldShowSummary = !!chapter.summary;

                  return (
                    <div key={chapter._id} className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] overflow-hidden p-4 ${radiusClass}`}>
                      <button
                        type="button"
                        onClick={() => toggleChapter(chapter._id)}
                        className="flex w-full items-center justify-between text-left focus:outline-none py-1"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-[#f5f5f7] text-base md:text-lg">
                            {chapterIndex + 1}. {chapter.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-[#86868b] mt-0.5">
                            {chapterLessons.length} bài học
                          </p>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`text-slate-400 dark:text-[#6e6e73] transition-transform duration-200 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="mt-3 border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-3">
                          {shouldShowSummary && (
                            <div className="text-sm text-slate-600 dark:text-[#86868b] prose-sm prose dark:prose-invert max-w-none bg-slate-50 dark:bg-[#1c1c1e] p-3 rounded-lg border border-slate-100 dark:border-zinc-800">
                              <RichContent content={withFormatMarker('richtext', chapter.summary!)} />
                            </div>
                          )}

                          {chapterLessons.length > 0 && (
                            <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 pl-4 md:pl-6">
                              {chapterLessons.map((lesson, lessonIndex) => {
                                const isCompletedLesson = completedLessonIds.has(lesson._id);
                                return (
                                  <Link
                                    key={lesson._id}
                                    href={`/khoa-hoc/${course.slug}/bai-hoc/${convertToSlug(lesson.title)}--${lesson._id}`}
                                    className="flex items-center justify-between gap-3 py-2.5 text-sm text-slate-700 dark:text-[#86868b] hover:text-slate-900 dark:hover:text-[#f5f5f7] transition-colors group/item"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="text-slate-400 dark:text-[#6e6e73] font-mono text-xs w-6 shrink-0">{chapterIndex + 1}.{lessonIndex + 1}</span>
                                      <span className="group-hover/item:underline">{lesson.title}</span>
                                    </span>
                                    {isCompletedLesson ? (
                                      <span className="rounded bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 shrink-0 group-hover/item:bg-emerald-100 dark:group-hover/item:bg-emerald-900/30 transition-colors">
                                        Đã học
                                      </span>
                                    ) : hasCourseAccess ? (
                                      <span className="rounded bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-400 shrink-0 group-hover/item:bg-sky-100 dark:group-hover/item:bg-sky-900/30 transition-colors">
                                        Đã mở
                                      </span>
                                    ) : lesson.isPreview ? (
                                      <span className="rounded bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 shrink-0 group-hover/item:bg-emerald-100 dark:group-hover/item:bg-emerald-900/30 transition-colors">
                                        Học thử
                                      </span>
                                    ) : (
                                      <Lock size={12} className="text-slate-300 dark:text-zinc-700 group-hover/item:text-slate-400 dark:group-hover/item:text-zinc-600 shrink-0" />
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {chapters?.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 p-6 text-center text-slate-500 dark:text-[#86868b]">
                    Nội dung khóa học đang được cập nhật.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        {showAside && (
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {config.showStickyCta && <CtaCard />}
            {related.length > 0 && (
              <div className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-5 ${radiusClass}`}>
                <h3 className="font-semibold text-slate-900 dark:text-[#f5f5f7]">Khóa học liên quan</h3>
                <div className="mt-3 space-y-3">
                  {related.map((item) => (
                    <Link key={item._id} href={`/khoa-hoc/${item.slug}`} className="block text-sm text-slate-600 dark:text-[#86868b] hover:text-slate-900 dark:hover:text-[#f5f5f7] hover:underline transition-colors">
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </section>

      {/* Sticky Bottom CTA cho Mobile */}
      {config.showStickyCta && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111111] border-t border-slate-200 dark:border-zinc-800 p-4 shadow-lg dark:shadow-none flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-[#6e6e73] font-semibold uppercase tracking-wider">Học phí</p>
            <p className="text-lg font-bold" style={{ color: accent }}>{price}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleRegister()}
            className="px-5 py-2.5 text-xs font-bold text-white shadow-sm inline-flex items-center gap-2"
            style={{ backgroundColor: brandColor, borderRadius: cornerRadius === 'none' ? '0px' : cornerRadius === 'sm' ? '8px' : '12px' }}
          >
            {firstLessonHref ? <PlayCircle size={14} /> : commerceMode === 'cart' && course.pricingType !== 'contact' && <ShoppingCart size={14} />}
            {firstLessonHref ? 'Vào học' : commerceMode === 'cart' && course.pricingType !== 'contact' ? 'Thêm giỏ' : (!showPrice || course.pricingType === 'contact' ? 'Liên hệ' : 'Đăng ký')}
          </button>
        </div>
      )}

      {/* Promo Video Lightbox Modal */}
      {showPromoVideo && promoVideoEmbedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowPromoVideo(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`${promoVideoEmbedUrl}?autoplay=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <button
              onClick={() => setShowPromoVideo(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-2.5 rounded-full transition-colors font-medium text-xs flex items-center justify-center"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function CourseDetailSkeleton() {
  const config = useCoursesDetailConfig();
  const brandColors = useBrandColors();
  const brandColor = brandColors.primary;
  const secondaryColor = brandColors.secondary || '';
  const colorMode = brandColors.mode || 'single';

  const accent = useMemo(() => {
    if (colorMode === 'single' || !secondaryColor) {
      return brandColor + 'dd';
    }
    return secondaryColor;
  }, [brandColor, secondaryColor, colorMode]);

  const cornerRadius = (config as any).cornerRadius ?? 'lg';
  const radiusClass = getRadiusClass(cornerRadius);
  const smallRadiusClass = getSmallRadiusClass(cornerRadius);
  const isModern = config.layoutStyle === 'modern';
  const showAside = config.showStickyCta || config.showRelated;
  const pulseHeaderClass = isModern ? 'bg-white/20' : 'bg-slate-200 dark:bg-zinc-800';

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-16">
      {/* Header Skeleton */}
      <section
        className={`border-b border-slate-100 dark:border-zinc-800/60 px-4 ${isModern ? 'py-10 text-white' : 'py-8'}`}
        style={isModern ? { background: `linear-gradient(135deg, ${brandColor}, ${accent})` } : undefined}
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl space-y-4">
            <div className={`h-4 w-32 animate-pulse rounded ${pulseHeaderClass}`} />
            <div className="flex gap-2">
              <div className={`h-6 w-24 animate-pulse rounded-full ${pulseHeaderClass}`} />
              <div className={`h-6 w-16 animate-pulse rounded-full ${pulseHeaderClass}`} />
            </div>
            <div className="space-y-2.5 max-w-3xl">
              <div className={`h-10 w-full animate-pulse rounded-md ${pulseHeaderClass}`} />
              <div className={`h-10 w-2/3 animate-pulse rounded-md ${pulseHeaderClass}`} />
            </div>
            <div className="space-y-2 max-w-2xl pt-2">
              <div className={`h-5 w-full animate-pulse rounded ${pulseHeaderClass}`} />
              <div className={`h-5 w-5/6 animate-pulse rounded ${pulseHeaderClass}`} />
            </div>
            <div className="flex flex-wrap gap-4 pt-3">
              <div className={`h-5 w-24 animate-pulse rounded-full ${pulseHeaderClass}`} />
              <div className={`h-5 w-28 animate-pulse rounded-full ${pulseHeaderClass}`} />
              <div className={`h-5 w-32 animate-pulse rounded-full ${pulseHeaderClass}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Main grid skeleton */}
      <section className={`mx-auto grid max-w-7xl gap-6 px-4 py-8 ${showAside ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'max-w-4xl mx-auto'}`}>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
            </div>
          </div>

          <div className="pt-4">
            <div className="h-7 w-48 animate-pulse rounded bg-slate-200 dark:bg-zinc-800 mb-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex items-start gap-2 border border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#161617] p-3.5 ${smallRadiusClass}`}>
                  <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200 dark:bg-zinc-700 shrink-0 mt-0.5" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" />
                </div>
              ))}
            </div>
          </div>

          {config.showCurriculum && (
            <div className="pt-4">
              <div className="h-7 w-56 animate-pulse rounded bg-slate-200 dark:bg-zinc-800 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-5 flex items-center justify-between ${radiusClass}`}>
                    <div className="space-y-2 w-3/4">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" />
                      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" />
                    </div>
                    <div className="h-5 w-5 animate-pulse rounded bg-slate-200 dark:bg-zinc-700 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showAside && (
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {config.showStickyCta && (
              <div className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-5 space-y-4 ${radiusClass}`}>
                <div className={`aspect-video animate-pulse bg-slate-200 dark:bg-zinc-700 ${smallRadiusClass}`} />
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" />
                  <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" />
                </div>
                <div
                  className="h-12 w-full animate-pulse bg-slate-200 dark:bg-zinc-700"
                  style={{ borderRadius: cornerRadius === 'none' ? '0px' : cornerRadius === 'sm' ? '8px' : '12px' }}
                />
              </div>
            )}

            {config.showRelated && (
              <div className={`border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161617] p-5 space-y-3.5 ${radiusClass}`}>
                <div className="h-5 w-36 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-zinc-700" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" />
                </div>
              </div>
            )}
          </aside>
        )}
      </section>
    </div>
  );
}
