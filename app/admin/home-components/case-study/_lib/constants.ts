'use client';

import type { CaseStudyStyle } from '../_types';

export const CASE_STUDY_STYLES: { id: CaseStudyStyle; label: string }[] = [
  { id: 'grid', label: '(1) Dạng lưới' },
  { id: 'featured', label: '(2) Nổi bật' },
  { id: 'list', label: '(3) Xếp dọc' },
  { id: 'masonry', label: '(4) So le' },
  { id: 'carousel', label: '(5) Trượt ngang' },
  { id: 'timeline', label: '(6) Tiến trình' },
];
