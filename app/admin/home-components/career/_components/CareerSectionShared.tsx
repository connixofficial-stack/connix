'use client';

import React from 'react';
import { Briefcase, Clock, MapPin, Star } from 'lucide-react';
import { cn } from '../../../components/ui';
import { getSectionSpacingClassName, normalizeSectionSpacing, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import {
  DEFAULT_CAREER_TEXTS,
  normalizeCareerCornerRadius,
  normalizeCareerDesktopColumns,
  normalizeCareerLogoSize,
} from '../_lib/constants';
import type { CareerColorTokens } from '../_lib/colors';
import type { CareerCornerRadius, CareerStyle, CareerTexts } from '../_types';

type CareerSectionContext = 'preview' | 'site';
type CareerPreviewDevice = 'mobile' | 'tablet' | 'desktop';

export interface CareerSharedJob {
  key: string;
  id?: string | number;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
}

interface CareerSectionSharedProps {
  jobs: CareerSharedJob[];
  style: CareerStyle;
  tokens: CareerColorTokens;
  context: CareerSectionContext;
  title: string;
  device?: CareerPreviewDevice;
  texts?: CareerTexts;
  spacing?: SectionSpacing;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  desktopColumns?: 3 | 4;
  cornerRadius?: CareerCornerRadius;
  logoSize?: 'small' | 'medium' | 'large';
}

const PREVIEW_MAX_VISIBLE_BY_STYLE: Record<CareerStyle, Record<CareerPreviewDevice, number>> = {
  cards: { desktop: 6, tablet: 4, mobile: 4 },
  list: { desktop: 8, tablet: 6, mobile: 5 },
  minimal: { desktop: 6, tablet: 6, mobile: 4 },
  table: { desktop: 10, tablet: 8, mobile: 6 },
  featured: { desktop: 7, tablet: 6, mobile: 4 },
  timeline: { desktop: 10, tablet: 8, mobile: 6 },
};

const getSectionPadding = (context: CareerSectionContext, device: CareerPreviewDevice, spacing?: SectionSpacing) => {
  const vertical = context === 'preview' && spacing === undefined
    ? cn('py-7', device === 'mobile' ? 'py-6' : 'md:py-10')
    : getSectionSpacingClassName(normalizeSectionSpacing(spacing));
  return cn(vertical, context === 'preview' ? (device === 'mobile' ? 'px-3' : 'px-4 md:px-6') : 'px-4');
};

const getMaxVisible = (
  style: CareerStyle,
  context: CareerSectionContext,
  device: CareerPreviewDevice,
) => {
  if (context === 'site') {
    return PREVIEW_MAX_VISIBLE_BY_STYLE[style].desktop;
  }
  return PREVIEW_MAX_VISIBLE_BY_STYLE[style][device];
};

const getCareerGridClass = (device: CareerPreviewDevice, desktopColumns: 3 | 4) => {
  if (device === 'mobile') {
    return desktopColumns === 3 ? 'grid-cols-1' : 'grid-cols-2';
  }
  if (device === 'tablet') {
    return desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-2';
  }
  return desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
};

const getCareerRadiusClassName = (cornerRadius: CareerCornerRadius) => {
  if (cornerRadius === 'none') {return 'rounded-none';}
  if (cornerRadius === 'sm') {return 'rounded-lg';}
  return 'rounded-2xl';
};

const getCareerLogoSizeClassNames = (logoSize: 'small' | 'medium' | 'large') => {
  if (logoSize === 'small') {return { box: 'h-9 w-9', icon: 17 };}
  if (logoSize === 'large') {return { box: 'h-14 w-14', icon: 26 };}
  return { box: 'h-11 w-11', icon: 21 };
};

const renderEmptyState = (tokens: CareerColorTokens, texts: CareerTexts) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style={{ backgroundColor: tokens.emptyIconBackground }}
    >
      <Briefcase size={30} style={{ color: tokens.emptyIconColor }} />
    </div>
    <h3 className="font-medium mb-1" style={{ color: tokens.neutralText }}>
      {texts.emptyTitle || DEFAULT_CAREER_TEXTS.emptyTitle}
    </h3>
    <p className="text-sm" style={{ color: tokens.mutedText }}>
      {texts.emptyDescription || DEFAULT_CAREER_TEXTS.emptyDescription}
    </p>
  </div>
);

const renderCards = ({
  jobs,
  title,
  tokens,
  context,
  device,
  texts,
}: {
  jobs: CareerSharedJob[];
  title: string;
  tokens: CareerColorTokens;
  context: CareerSectionContext;
  device: CareerPreviewDevice;
  texts: CareerTexts;
}) => {
  if (jobs.length === 0) {return renderEmptyState(tokens, texts);}

  const maxVisible = getMaxVisible('cards', context, device);
  const visibleJobs = jobs.slice(0, maxVisible);
  const remainingCount = jobs.length - visibleJobs.length;
  const display = texts as CareerTexts & {
    desktopColumns?: 3 | 4;
    cornerRadius?: CareerCornerRadius;
    logoSize?: 'small' | 'medium' | 'large';
  };
  const radiusClassName = getCareerRadiusClassName(display.cornerRadius ?? 'lg');
  const logoSizeClassNames = getCareerLogoSizeClassNames(display.logoSize ?? 'medium');

  return (
    <section className={getSectionPadding(context, device, (texts as CareerTexts & { spacing?: SectionSpacing }).spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-8">
        <h2 className={cn('font-bold tracking-tight', device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')} style={{ color: tokens.heading }}>
          {title}
        </h2>
        <p className="text-sm mt-2" style={{ color: tokens.mutedText }}>
          {texts.subtitle || DEFAULT_CAREER_TEXTS.subtitle}
        </p>
      </div>

      <div className={cn('grid gap-4 max-w-6xl mx-auto', getCareerGridClass(device, display.desktopColumns ?? 3))}>
        {visibleJobs.map((job) => (
          <article
            key={job.key}
            className={cn('border flex flex-col h-full', radiusClassName)}
            style={{
              backgroundColor: tokens.cardBackground,
              borderColor: tokens.cardBorder,
            }}
          >
            <div className={cn('flex-1', device === 'mobile' ? 'p-4' : 'p-5')}>
              <div className="flex items-start justify-between mb-3 gap-2">
                <span className={cn('flex shrink-0 items-center justify-center rounded-full', logoSizeClassNames.box)} style={{ backgroundColor: tokens.badgeBackground, color: tokens.badgeText }}>
                  <Briefcase size={logoSizeClassNames.icon} />
                </span>
                <span className="text-xs whitespace-nowrap" style={{ color: tokens.metaText }}>
                  {job.type || 'Full-time'}
                </span>
              </div>

              <span
                className="mb-3 inline-flex max-w-full break-words text-xs font-medium px-2 py-1 rounded border"
                style={{
                  backgroundColor: tokens.badgeBackground,
                  color: tokens.badgeText,
                  borderColor: tokens.badgeBorder,
                }}
              >
                {job.department || 'Đang cập nhật'}
              </span>

              <h3 className="font-semibold line-clamp-2 mb-2 min-h-[2.75rem]" style={{ color: tokens.neutralText }}>
                {job.title || 'Vị trí tuyển dụng'}
              </h3>

              {job.description && (
                <p className="text-xs line-clamp-2 mb-3" style={{ color: tokens.mutedText }}>
                  {job.description}
                </p>
              )}

              <div className="space-y-1.5 text-xs mb-4" style={{ color: tokens.mutedText }}>
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="flex-shrink-0" />
                  <span className="truncate">{job.location || 'Remote'}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium" style={{ color: tokens.salaryText }}>{job.salary}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={cn('border-t mt-auto', device === 'mobile' ? 'p-3' : 'p-4')} style={{ borderColor: tokens.neutralBorder }}>
              <button
                type="button"
                className={cn('w-full rounded-lg font-medium', device === 'mobile' ? 'py-3 text-sm' : 'py-3.5 text-sm')}
                style={{
                  backgroundColor: tokens.ctaBackground,
                  color: tokens.ctaText,
                }}
              >
                {texts.ctaButton || DEFAULT_CAREER_TEXTS.ctaButton}
              </button>
            </div>
          </article>
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="text-center mt-6">
          <span className="text-sm font-medium" style={{ color: tokens.sectionLabel }}>
            +{remainingCount} {texts.remainingLabel || DEFAULT_CAREER_TEXTS.remainingLabel}
          </span>
        </div>
      )}
    </section>
  );
};

const renderList = ({
  jobs,
  title,
  tokens,
  context,
  device,
  texts,
}: {
  jobs: CareerSharedJob[];
  title: string;
  tokens: CareerColorTokens;
  context: CareerSectionContext;
  device: CareerPreviewDevice;
  texts: CareerTexts;
}) => {
  if (jobs.length === 0) {return renderEmptyState(tokens, texts);}

  const maxVisible = getMaxVisible('list', context, device);
  const visibleJobs = jobs.slice(0, maxVisible);
  const remainingCount = jobs.length - visibleJobs.length;

  return (
    <section className={getSectionPadding(context, device, (texts as CareerTexts & { spacing?: SectionSpacing }).spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-8">
        <h2 className={cn('font-bold tracking-tight', device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')} style={{ color: tokens.heading }}>
          {title}
        </h2>
      </div>

      <div className="max-w-4xl mx-auto">
        <ul className="space-y-3" role="list" aria-label="Danh sách vị trí tuyển dụng">
          {visibleJobs.map((job) => (
            <li key={job.key}>
              <article
                className={cn(
                  'rounded-xl border transition-all',
                  device === 'mobile' ? 'p-4 flex flex-col gap-3' : 'p-5 flex items-center justify-between gap-4',
                )}
                style={{
                  backgroundColor: tokens.cardBackground,
                  borderColor: tokens.cardBorder,
                }}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold line-clamp-1" style={{ color: tokens.neutralText }}>
                    {job.title || 'Vị trí'}
                  </h3>
                  <div className={cn('text-sm mt-1 flex items-center gap-2', device === 'mobile' ? 'flex-wrap' : '')} style={{ color: tokens.mutedText }}>
                    <span className="whitespace-nowrap">{job.department || 'Đang cập nhật'}</span>
                    <span className="hidden md:inline">•</span>
                    <span className="whitespace-nowrap">{job.location || 'Remote'}</span>
                    <span className="hidden md:inline">•</span>
                    <span className="whitespace-nowrap">{job.type || 'Full-time'}</span>
                  </div>
                </div>
                <div className={cn('flex items-center gap-3', device === 'mobile' ? 'w-full' : '')}>
                  {job.salary && (
                    <span className="text-sm font-medium whitespace-nowrap" style={{ color: tokens.salaryText }}>
                      {job.salary}
                    </span>
                  )}
                  <button
                    type="button"
                    className={cn('rounded-lg font-medium whitespace-nowrap', device === 'mobile' ? 'flex-1 py-3 text-sm' : 'px-6 py-3 text-sm')}
                    style={{
                      backgroundColor: tokens.ctaBackground,
                      color: tokens.ctaText,
                    }}
                  >
                    {texts.ctaButton || DEFAULT_CAREER_TEXTS.ctaButton}
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {remainingCount > 0 && (
          <div className="text-center mt-6">
            <span className="text-sm font-medium" style={{ color: tokens.sectionLabel }}>
              +{remainingCount} {texts.remainingLabel || DEFAULT_CAREER_TEXTS.remainingLabel}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

const renderMinimal = ({
  jobs,
  title,
  tokens,
  context,
  device,
  texts,
}: {
  jobs: CareerSharedJob[];
  title: string;
  tokens: CareerColorTokens;
  context: CareerSectionContext;
  device: CareerPreviewDevice;
  texts: CareerTexts;
}) => {
  if (jobs.length === 0) {return renderEmptyState(tokens, texts);}

  const maxVisible = getMaxVisible('minimal', context, device);
  const visibleJobs = jobs.slice(0, maxVisible);

  return (
    <section className={getSectionPadding(context, device, (texts as CareerTexts & { spacing?: SectionSpacing }).spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="max-w-5xl mx-auto">
        <div className={cn('gap-8', device === 'mobile' ? 'flex flex-col' : 'flex md:flex-row md:gap-12')}>
          <div className={cn('text-center md:text-left', device === 'mobile' ? '' : 'md:w-1/3')}>
            <p className="text-sm font-medium mb-2 uppercase tracking-wide" style={{ color: tokens.sectionLabel }}>TUYỂN DỤNG</p>
            <h2 className={cn('font-bold mb-3', device === 'mobile' ? 'text-xl' : 'text-2xl')} style={{ color: tokens.heading }}>
              {title}
            </h2>
            <p className="text-sm" style={{ color: tokens.mutedText }}>Chúng tôi đang tìm kiếm những tài năng mới</p>
          </div>

          <div className="flex-1">
            <ul className="space-y-3" role="list">
              {visibleJobs.map((job) => (
                <li key={job.key}>
                  <article
                    className={cn('rounded-xl border flex items-center justify-between gap-4', device === 'mobile' ? 'p-4' : 'p-5')}
                    style={{
                      backgroundColor: tokens.cardBackground,
                      borderColor: tokens.cardBorder,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium line-clamp-1" style={{ color: tokens.neutralText }}>
                        {job.title || 'Vị trí'}
                      </h3>
                      <span className="text-sm" style={{ color: tokens.mutedText }}>
                        {job.location || 'Remote'} • {job.type || 'Full-time'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium whitespace-nowrap"
                      style={{ color: tokens.sectionLabel }}
                    >
                      Chi tiết →
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderTable = ({
  jobs,
  title,
  tokens,
  context,
  device,
  texts,
}: {
  jobs: CareerSharedJob[];
  title: string;
  tokens: CareerColorTokens;
  context: CareerSectionContext;
  device: CareerPreviewDevice;
  texts: CareerTexts;
}) => {
  if (jobs.length === 0) {return renderEmptyState(tokens, texts);}

  const maxVisible = getMaxVisible('table', context, device);
  const visibleJobs = jobs.slice(0, maxVisible);
  const isCompact = device === 'mobile';

  return (
    <section className={getSectionPadding(context, device, (texts as CareerTexts & { spacing?: SectionSpacing }).spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-8">
        <h2 className={cn('font-bold tracking-tight', device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')} style={{ color: tokens.heading }}>
          {title}
        </h2>
        <p className="text-sm mt-2" style={{ color: tokens.mutedText }}>Danh sách vị trí đang tuyển</p>
      </div>

      <div className="max-w-6xl mx-auto overflow-x-auto">
        <table className="w-full rounded-xl overflow-hidden border" style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder }}>
          <thead>
            <tr style={{ backgroundColor: tokens.tableHeaderBackground }}>
              <th className="text-left p-4 text-sm font-semibold" style={{ color: tokens.tableHeaderText }}>Vị trí</th>
              {!isCompact && <th className="text-left p-4 text-sm font-semibold" style={{ color: tokens.tableHeaderText }}>Phòng ban</th>}
              <th className="text-left p-4 text-sm font-semibold" style={{ color: tokens.tableHeaderText }}>Địa điểm</th>
              {!isCompact && <th className="text-left p-4 text-sm font-semibold" style={{ color: tokens.tableHeaderText }}>Loại hình</th>}
              {!isCompact && <th className="text-left p-4 text-sm font-semibold" style={{ color: tokens.tableHeaderText }}>Mức lương</th>}
              <th className="text-right p-4 text-sm font-semibold" style={{ color: tokens.tableHeaderText }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {visibleJobs.map((job) => (
              <tr key={job.key} className="border-b last:border-b-0" style={{ borderColor: tokens.tableRowBorder }}>
                <td className="p-4">
                  <h3 className="font-medium line-clamp-1" style={{ color: tokens.neutralText }}>{job.title || 'Vị trí tuyển dụng'}</h3>
                  {isCompact && job.description && (
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: tokens.mutedText }}>{job.description}</p>
                  )}
                </td>
                {!isCompact && <td className="p-4 text-sm" style={{ color: tokens.mutedText }}>{job.department || 'Đang cập nhật'}</td>}
                <td className="p-4 text-sm whitespace-nowrap" style={{ color: tokens.mutedText }}>{job.location || 'Remote'}</td>
                {!isCompact && <td className="p-4 text-sm" style={{ color: tokens.mutedText }}>{job.type || 'Full-time'}</td>}
                {!isCompact && <td className="p-4 text-sm font-medium" style={{ color: tokens.salaryText }}>{job.salary || 'Thỏa thuận'}</td>}
                <td className="p-4 text-right">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: tokens.ctaBackground,
                      color: tokens.ctaText,
                    }}
                  >
                    {texts.ctaButton || DEFAULT_CAREER_TEXTS.ctaButton}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const renderFeatured = ({
  jobs,
  title,
  tokens,
  context,
  device,
  texts,
}: {
  jobs: CareerSharedJob[];
  title: string;
  tokens: CareerColorTokens;
  context: CareerSectionContext;
  device: CareerPreviewDevice;
  texts: CareerTexts;
}) => {
  if (jobs.length === 0) {return renderEmptyState(tokens, texts);}

  const maxVisible = getMaxVisible('featured', context, device);
  const visibleJobs = jobs.slice(0, maxVisible);
  const [featuredJob, ...otherJobs] = visibleJobs;
  const display = texts as CareerTexts & {
    desktopColumns?: 3 | 4;
    cornerRadius?: CareerCornerRadius;
  };
  const radiusClassName = getCareerRadiusClassName(display.cornerRadius ?? 'lg');

  return (
    <section className={getSectionPadding(context, device, (texts as CareerTexts & { spacing?: SectionSpacing }).spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-8">
        <h2 className={cn('font-bold tracking-tight', device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')} style={{ color: tokens.heading }}>
          {title}
        </h2>
        <p className="text-sm mt-2" style={{ color: tokens.mutedText }}>Vị trí nổi bật đang tuyển gấp</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <article
          className={cn('border-2 p-6 md:p-8 mb-6 relative', radiusClassName)}
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.primary,
          }}
        >
          <div className="absolute top-4 right-4">
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: tokens.primary,
                color: tokens.ctaText,
              }}
            >
              <Star size={12} fill="currentColor" />
              HOT
            </span>
          </div>

          <div className="max-w-3xl">
            <span
              className="text-xs font-medium px-2 py-1 rounded border"
              style={{
                backgroundColor: tokens.badgeBackground,
                color: tokens.badgeText,
                borderColor: tokens.badgeBorder,
              }}
            >
              {featuredJob.department || 'Đang cập nhật'}
            </span>

            <h3 className={cn('font-bold mt-3 mb-2', device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')} style={{ color: tokens.neutralText }}>
              {featuredJob.title || 'Vị trí tuyển dụng'}
            </h3>

            {featuredJob.description && (
              <p className="mb-4" style={{ color: tokens.mutedText }}>{featuredJob.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm mb-6" style={{ color: tokens.mutedText }}>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{featuredJob.location || 'Remote'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{featuredJob.type || 'Full-time'}</span>
              </div>
              {featuredJob.salary && (
                <div className="flex items-center gap-2 font-medium" style={{ color: tokens.salaryText }}>
                  <span>{featuredJob.salary}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="px-8 py-3.5 rounded-lg font-semibold"
              style={{
                backgroundColor: tokens.ctaBackground,
                color: tokens.ctaText,
              }}
            >
              {texts.ctaButton || DEFAULT_CAREER_TEXTS.ctaButton}
            </button>
          </div>
        </article>

        {otherJobs.length > 0 && (
          <>
            <h4 className="font-semibold mb-4 text-lg" style={{ color: tokens.neutralText }}>Vị trí khác</h4>
            <div className={cn('grid gap-4', getCareerGridClass(device, display.desktopColumns ?? 3))}>
              {otherJobs.map((job) => (
                <article
                  key={job.key}
                  className={cn('border p-4', radiusClassName)}
                  style={{
                    backgroundColor: tokens.cardBackground,
                    borderColor: tokens.cardBorder,
                  }}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: tokens.badgeBackground,
                        color: tokens.badgeText,
                        borderColor: tokens.badgeBorder,
                      }}
                    >
                      {job.department || 'Đang cập nhật'}
                    </span>
                    <span className="text-xs whitespace-nowrap" style={{ color: tokens.metaText }}>{job.type || 'Full-time'}</span>
                  </div>
                  <h5 className="font-medium mb-2 line-clamp-2 min-h-[2.5rem]" style={{ color: tokens.neutralText }}>
                    {job.title || 'Vị trí'}
                  </h5>
                  <div className="flex items-center gap-2 text-xs mb-3" style={{ color: tokens.mutedText }}>
                    <MapPin size={12} />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  <button type="button" className="text-sm font-medium" style={{ color: tokens.sectionLabel }}>
                    Xem chi tiết →
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

const renderTimeline = ({
  jobs,
  title,
  tokens,
  context,
  device,
  texts,
}: {
  jobs: CareerSharedJob[];
  title: string;
  tokens: CareerColorTokens;
  context: CareerSectionContext;
  device: CareerPreviewDevice;
  texts: CareerTexts;
}) => {
  if (jobs.length === 0) {return renderEmptyState(tokens, texts);}

  const maxVisible = getMaxVisible('timeline', context, device);
  const visibleJobs = jobs.slice(0, maxVisible).map((job, index) => ({
    ...job,
    globalIdx: index + 1,
  }));

  const groupedJobs = visibleJobs.reduce<Record<string, Array<CareerSharedJob & { globalIdx: number }>>>((acc, job) => {
    const department = job.department || 'Đang cập nhật';
    if (!acc[department]) {acc[department] = [];}
    acc[department].push(job);
    return acc;
  }, {});

  return (
    <section className={getSectionPadding(context, device, (texts as CareerTexts & { spacing?: SectionSpacing }).spacing)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-8">
        <h2 className={cn('font-bold tracking-tight', device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')} style={{ color: tokens.heading }}>
          {title}
        </h2>
        <p className="text-sm mt-2" style={{ color: tokens.mutedText }}>Vị trí theo phòng ban</p>
      </div>

      <div className="max-w-4xl mx-auto relative">
        <div
          className={cn('absolute top-0 bottom-0 w-0.5', device === 'mobile' ? 'left-4' : 'left-6')}
          style={{ backgroundColor: tokens.timelineLine }}
        />

        <div className="space-y-8">
          {Object.entries(groupedJobs).map(([department, departmentJobs], deptIdx) => (
            <div key={`${department}-${deptIdx}`} className={cn('relative', device === 'mobile' ? 'pl-12' : 'pl-16')}>
              <div
                className={cn(
                  'absolute rounded-full border-4 flex items-center justify-center font-bold z-10',
                  device === 'mobile' ? 'w-8 h-8 left-0 text-xs' : 'w-12 h-12 left-0 text-sm',
                )}
                style={{
                  backgroundColor: tokens.neutralSurface,
                  borderColor: tokens.timelineDotBorder,
                  color: tokens.timelineDotText,
                }}
              >
                {department.charAt(0).toUpperCase()}
              </div>

              <div>
                <h4 className={cn('font-bold mb-4', device === 'mobile' ? 'text-base' : 'text-lg')} style={{ color: tokens.timelineDepartmentText }}>
                  {department}
                </h4>
                <ul className="space-y-3" role="list">
                  {departmentJobs.map((job) => (
                    <li key={job.key}>
                      <article
                        className="rounded-xl border p-4"
                        style={{
                          backgroundColor: tokens.cardBackground,
                          borderColor: tokens.cardBorder,
                        }}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                            style={{
                              backgroundColor: tokens.badgeBackground,
                              color: tokens.badgeText,
                            }}
                          >
                            {job.globalIdx}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold line-clamp-2 flex-1" style={{ color: tokens.neutralText }}>
                                {job.title || 'Vị trí'}
                              </h5>
                              <span className="text-xs whitespace-nowrap" style={{ color: tokens.metaText }}>
                                {job.type || 'Full-time'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs mb-3" style={{ color: tokens.mutedText }}>
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span>{job.location || 'Remote'}</span>
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1 font-medium" style={{ color: tokens.salaryText }}>
                              <span>{job.salary}</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className={cn('rounded-lg font-medium', device === 'mobile' ? 'w-full py-3 text-sm' : 'px-6 py-3 text-sm')}
                          style={{
                            backgroundColor: tokens.ctaBackground,
                            color: tokens.ctaText,
                          }}
                        >
                          {texts.ctaButton || DEFAULT_CAREER_TEXTS.ctaButton}
                        </button>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export function CareerSectionShared({
  jobs,
  style,
  tokens,
  context,
  title,
  device = 'desktop',
  texts = DEFAULT_CAREER_TEXTS,
  spacing,
  desktopColumns,
  cornerRadius,
  logoSize,
}: CareerSectionSharedProps) {
  const normalizedDesktopColumns = normalizeCareerDesktopColumns(desktopColumns);
  const normalizedCornerRadius = normalizeCareerCornerRadius(cornerRadius);
  const normalizedLogoSize = normalizeCareerLogoSize(logoSize);
  const mergedTexts = {
    ...DEFAULT_CAREER_TEXTS,
    ...texts,
    spacing,
    desktopColumns: normalizedDesktopColumns,
    cornerRadius: normalizedCornerRadius,
    logoSize: normalizedLogoSize,
  } as CareerTexts & {
    spacing?: SectionSpacing;
    desktopColumns: 3 | 4;
    cornerRadius: CareerCornerRadius;
    logoSize: 'small' | 'medium' | 'large';
  };

  if (style === 'cards') {
    return renderCards({ jobs, title, tokens, context, device, texts: mergedTexts });
  }

  if (style === 'list') {
    return renderList({ jobs, title, tokens, context, device, texts: mergedTexts });
  }

  if (style === 'minimal') {
    return renderMinimal({ jobs, title, tokens, context, device, texts: mergedTexts });
  }

  if (style === 'table') {
    return renderTable({ jobs, title, tokens, context, device, texts: mergedTexts });
  }

  if (style === 'featured') {
    return renderFeatured({ jobs, title, tokens, context, device, texts: mergedTexts });
  }

  return renderTimeline({ jobs, title, tokens, context, device, texts: mergedTexts });
}
