import {
  createCareerJob,
  DEFAULT_CAREER_CONFIG,
  DEFAULT_CAREER_TEXTS,
  normalizeCareerCornerRadius,
  normalizeCareerDesktopColumns,
  normalizeCareerHarmony,
  normalizeCareerLogoSize,
} from './constants';
import { normalizeSectionSpacing } from '../../_shared/types/sectionSpacing';
import type {
  CareerConfig,
  CareerStyle,
  JobPosition,
} from '../_types';

const CAREER_STYLE_SET = new Set<CareerStyle>([
  'cards',
  'list',
  'minimal',
  'table',
  'featured',
  'timeline',
]);

const coerceText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const coerceId = (value: unknown): string | number | undefined => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return undefined;
};

const coerceBoolean = (value: unknown, fallback: boolean) => (
  typeof value === 'boolean' ? value : fallback
);

const normalizeHeaderAlign = (value: unknown): 'left' | 'center' | 'right' => {
  if (value === 'left' || value === 'center' || value === 'right') {
    return value;
  }
  return 'center';
};

const normalizeCareerTexts = (value: unknown) => {
  const source = (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {};
  return {
    subtitle: coerceText(source.subtitle) || DEFAULT_CAREER_TEXTS.subtitle,
    emptyTitle: coerceText(source.emptyTitle) || DEFAULT_CAREER_TEXTS.emptyTitle,
    emptyDescription: coerceText(source.emptyDescription) || DEFAULT_CAREER_TEXTS.emptyDescription,
    ctaButton: coerceText(source.ctaButton) || DEFAULT_CAREER_TEXTS.ctaButton,
    remainingLabel: coerceText(source.remainingLabel) || DEFAULT_CAREER_TEXTS.remainingLabel,
  };
};

const toJobRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return {};
};

const getJobBaseKey = (
  source: Record<string, unknown>,
  index: number,
  title: string,
  department: string,
  location: string,
  type: string,
  salary: string,
  description: string,
) => {
  const keyCandidate = source.id ?? source.key ?? source.uiKey;

  if (typeof keyCandidate === 'string' && keyCandidate.trim().length > 0) {
    return `key:${keyCandidate.trim()}`;
  }

  if (typeof keyCandidate === 'number') {
    return `key:${keyCandidate}`;
  }

  const contentKey = `${title.trim()}|${department.trim()}|${location.trim()}|${type.trim()}|${salary.trim()}|${description.trim()}`;
  if (contentKey.replaceAll('|', '').trim().length > 0) {
    return `content:${contentKey}`;
  }

  return `idx:${index}`;
};

export interface CareerRenderableJob extends JobPosition {
  key: string;
}

export const normalizeCareerStyle = (value: unknown): CareerStyle => {
  if (typeof value === 'string' && CAREER_STYLE_SET.has(value as CareerStyle)) {
    return value as CareerStyle;
  }
  return 'cards';
};

export const normalizeCareerJobs = (input: unknown): CareerRenderableJob[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const duplicates = new Map<string, number>();

  return input.map((raw, index) => {
    const source = toJobRecord(raw);
    const title = coerceText(source.title);
    const department = coerceText(source.department);
    const location = coerceText(source.location);
    const type = coerceText(source.type);
    const salary = coerceText(source.salary);
    const description = coerceText(source.description);
    const id = coerceId(source.id);

    const baseKey = getJobBaseKey(
      source,
      index,
      title,
      department,
      location,
      type,
      salary,
      description,
    );

    const count = duplicates.get(baseKey) ?? 0;
    duplicates.set(baseKey, count + 1);

    return {
      ...createCareerJob({
        id,
        title,
        department,
        location,
        type,
        salary,
        description,
      }),
      key: count === 0 ? baseKey : `${baseKey}::${count}`,
    };
  });
};

export const toCareerJobsForConfig = (jobs: CareerRenderableJob[]): JobPosition[] => (
  jobs.map((job) => ({
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    type: job.type,
    salary: job.salary,
    description: job.description,
  }))
);

export const normalizeCareerConfig = (rawConfig: unknown): CareerConfig => {
  const config = (typeof rawConfig === 'object' && rawConfig !== null)
    ? rawConfig as Record<string, unknown>
    : {};

  const jobs = normalizeCareerJobs(config.jobs);
  const harmony = normalizeCareerHarmony(config.harmony as string | undefined);

  return {
    jobs: jobs.length > 0 ? toCareerJobsForConfig(jobs) : DEFAULT_CAREER_CONFIG.jobs,
    style: normalizeCareerStyle(config.style),
    harmony,
    spacing: config.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(config.spacing),
    texts: normalizeCareerTexts(config.texts),
    hideHeader: coerceBoolean(config.hideHeader, DEFAULT_CAREER_CONFIG.hideHeader ?? false),
    showTitle: coerceBoolean(config.showTitle, DEFAULT_CAREER_CONFIG.showTitle ?? true),
    subtitle: coerceText(config.subtitle) || DEFAULT_CAREER_CONFIG.subtitle,
    showSubtitle: coerceBoolean(config.showSubtitle, DEFAULT_CAREER_CONFIG.showSubtitle ?? true),
    headerAlign: normalizeHeaderAlign(config.headerAlign),
    titleColorPrimary: coerceBoolean(config.titleColorPrimary, DEFAULT_CAREER_CONFIG.titleColorPrimary ?? false),
    subtitleAboveTitle: coerceBoolean(config.subtitleAboveTitle, DEFAULT_CAREER_CONFIG.subtitleAboveTitle ?? false),
    uppercaseText: coerceBoolean(config.uppercaseText, DEFAULT_CAREER_CONFIG.uppercaseText ?? false),
    showBadge: coerceBoolean(config.showBadge, DEFAULT_CAREER_CONFIG.showBadge ?? false),
    badgeText: coerceText(config.badgeText),
    desktopColumns: normalizeCareerDesktopColumns(config.desktopColumns),
    cornerRadius: normalizeCareerCornerRadius(config.cornerRadius, config.noBorderRadius),
    noBorderRadius: config.noBorderRadius === true,
    noVerticalMargin: config.noVerticalMargin === true,
    logoSize: normalizeCareerLogoSize(config.logoSize),
  };
};
