import type { SectionHeaderConfig } from '../../_shared/types/sectionHeader';
import {
  DEFAULT_SECTION_SPACING,
  getSectionSpacingClassName,
  normalizeSectionSpacing,
  type SectionSpacing,
} from '../../_shared/types/sectionSpacing';

export interface ProcessStep {
  icon: string;
  title: string;
  description: string;
  iconStorageId?: string | null;
}

export type ProcessStyle = 'horizontal' | 'stepper' | 'cards' | 'accordion' | 'minimal' | 'compactMinimal' | 'grid' | 'alternating' | 'circular';

export type ProcessBrandMode = 'single' | 'dual';
export type ProcessSpacing = SectionSpacing;
export type ProcessCornerRadius = 'none' | 'sm' | 'lg';

export interface ProcessConfig extends SectionHeaderConfig {
  steps: ProcessStep[];
  style: ProcessStyle;
  desktopColumns?: 3 | 4;
  spacing: ProcessSpacing;
  cornerRadius: ProcessCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  circularCtaText?: string;
  circularCtaLink?: string;
}

export const DEFAULT_PROCESS_SPACING: ProcessSpacing = DEFAULT_SECTION_SPACING;
export const DEFAULT_PROCESS_CORNER_RADIUS: ProcessCornerRadius = 'lg';

export const normalizeProcessSpacing = (value: unknown, noVerticalMargin?: unknown): ProcessSpacing => (
  noVerticalMargin === true ? 'none' : normalizeSectionSpacing(value)
);

export const getProcessSectionSpacingClassName = getSectionSpacingClassName;

export const normalizeProcessCornerRadius = (value: unknown, noBorderRadius?: unknown): ProcessCornerRadius => {
  if (noBorderRadius === true) {
    return 'none';
  }

  if (value === 'none' || value === 'sm' || value === 'lg') {
    return value;
  }

  return DEFAULT_PROCESS_CORNER_RADIUS;
};

export const getProcessCornerRadiusClassName = (value: ProcessCornerRadius = DEFAULT_PROCESS_CORNER_RADIUS) => {
  if (value === 'none') {
    return 'rounded-none';
  }

  if (value === 'sm') {
    return 'rounded-md';
  }

  return 'rounded-xl';
};
