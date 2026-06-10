'use client';

export type SectionSpacing = 'normal' | 'compact' | 'none';

export const DEFAULT_SECTION_SPACING: SectionSpacing = 'normal';

export const normalizeSectionSpacing = (value: unknown): SectionSpacing => {
  if (value === 'normal' || value === 'compact' || value === 'none') {
    return value;
  }

  return DEFAULT_SECTION_SPACING;
};

export const getSectionSpacingClassName = (spacing: SectionSpacing = DEFAULT_SECTION_SPACING) => {
  if (spacing === 'none') {
    return 'py-0';
  }

  if (spacing === 'compact') {
    return 'py-4 md:py-6';
  }

  return 'py-8 md:py-12';
};
