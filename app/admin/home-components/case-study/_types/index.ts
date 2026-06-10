'use client';

import type { SectionHeaderConfig } from '../../_shared/types/sectionHeader';
import {
  DEFAULT_SECTION_SPACING,
  getSectionSpacingClassName,
  normalizeSectionSpacing,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';

export type CaseStudyStyle = 'grid' | 'featured' | 'list' | 'masonry' | 'carousel' | 'timeline';
export type CaseStudyBrandMode = 'single' | 'dual';
export type CaseStudyHeaderAlign = 'left' | 'center' | 'right';
export type CaseStudyCornerRadius = 'none' | 'sm' | 'lg';
export type CaseStudySpacing = SectionSpacing;
export type CaseStudyDesktopColumns = 3 | 4;

export interface CaseStudyProject {
  id: number | string;
  title: string;
  category: string;
  image: string;
  description: string;
  link?: string;
}

export interface CaseStudyConfig extends SectionHeaderConfig {
  projects: CaseStudyProject[];
  style: CaseStudyStyle;
  cornerRadius: CaseStudyCornerRadius;
  desktopColumns: CaseStudyDesktopColumns;
  spacing: CaseStudySpacing;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}

export const DEFAULT_CASE_STUDY_CORNER_RADIUS: CaseStudyCornerRadius = 'lg';
export const DEFAULT_CASE_STUDY_DESKTOP_COLUMNS: CaseStudyDesktopColumns = 3;
export const DEFAULT_CASE_STUDY_SPACING: CaseStudySpacing = DEFAULT_SECTION_SPACING;

export const DEFAULT_CASE_STUDY_CONFIG: Partial<CaseStudyConfig> = {
  hideHeader: false,
  showTitle: true,
  showSubtitle: true,
  subtitle: '',
  headerAlign: 'center',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: 'Dự án thực tế',
  style: 'grid',
  cornerRadius: DEFAULT_CASE_STUDY_CORNER_RADIUS,
  desktopColumns: DEFAULT_CASE_STUDY_DESKTOP_COLUMNS,
  spacing: DEFAULT_CASE_STUDY_SPACING,
};

export const normalizeCaseStudyStyle = (value: unknown): CaseStudyStyle => {
  if (value === 'grid' || value === 'featured' || value === 'list' || value === 'masonry' || value === 'carousel' || value === 'timeline') {
    return value;
  }

  return 'grid';
};

export const normalizeCaseStudyCornerRadius = (
  value: unknown,
  legacyNoBorderRadius?: unknown,
): CaseStudyCornerRadius => {
  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  if (legacyNoBorderRadius === true) {
    return 'none';
  }

  return DEFAULT_CASE_STUDY_CORNER_RADIUS;
};

export const getCaseStudyCornerRadiusClassName = (value: CaseStudyCornerRadius = DEFAULT_CASE_STUDY_CORNER_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-xl';
};

export const normalizeCaseStudyDesktopColumns = (value: unknown): CaseStudyDesktopColumns => {
  if (value === 3 || value === '3') {
    return 3;
  }

  if (value === 4 || value === '4') {
    return 4;
  }

  return DEFAULT_CASE_STUDY_DESKTOP_COLUMNS;
};

export const normalizeCaseStudySpacing = (
  value: unknown,
  legacyNoVerticalMargin?: unknown,
): CaseStudySpacing => {
  if (legacyNoVerticalMargin === true && value === undefined) {
    return 'none';
  }

  return normalizeSectionSpacing(value);
};
export const getCaseStudySectionSpacingClassName = getSectionSpacingClassName;
