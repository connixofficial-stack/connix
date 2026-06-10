export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  Advanced: 'Nâng cao',
  Beginner: 'Cơ bản',
  Intermediate: 'Trung cấp',
};

export const COURSE_LEVEL_OPTIONS = [
  { label: COURSE_LEVEL_LABELS.Beginner, value: 'Beginner' },
  { label: COURSE_LEVEL_LABELS.Intermediate, value: 'Intermediate' },
  { label: COURSE_LEVEL_LABELS.Advanced, value: 'Advanced' },
] as const;

export const getCourseLevelLabel = (level?: string) =>
  level && level in COURSE_LEVEL_LABELS
    ? COURSE_LEVEL_LABELS[level as CourseLevel]
    : level;

export const parseCourseLevel = (value?: string): CourseLevel | '' => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {return '';}
  if (normalized === 'beginner' || normalized === 'cơ bản' || normalized === 'co ban') {return 'Beginner';}
  if (normalized === 'intermediate' || normalized === 'trung cấp' || normalized === 'trung cap') {return 'Intermediate';}
  if (normalized === 'advanced' || normalized === 'nâng cao' || normalized === 'nang cao') {return 'Advanced';}
  return '';
};
