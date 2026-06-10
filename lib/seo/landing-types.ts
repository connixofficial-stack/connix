/**
 * Landing page types constants - single source of truth
 * Đồng bộ với Convex schema landingType union
 */

export const LANDING_TYPES = [
  'feature',
  'use-case',
  'solution',
  'compare',
  'integration',
  'template',
  'guide',
] as const;

export type LandingType = typeof LANDING_TYPES[number];

export const LANDING_TYPE_ROUTES: Record<LandingType, string> = {
  'feature': '/features',
  'use-case': '/use-cases',
  'solution': '/solutions',
  'compare': '/compare',
  'integration': '/integrations',
  'template': '/templates',
  'guide': '/guides',
};

export const LANDING_TYPE_LABELS: Record<LandingType, string> = {
  'feature': 'Tính năng',
  'use-case': 'Trường hợp sử dụng',
  'solution': 'Giải pháp',
  'compare': 'So sánh',
  'integration': 'Tích hợp',
  'template': 'Template',
  'guide': 'Hướng dẫn',
};

export const LANDING_TYPE_BREADCRUMBS: Record<LandingType, string> = {
  'feature': 'Tính năng',
  'use-case': 'Trường hợp sử dụng',
  'solution': 'Giải pháp',
  'compare': 'So sánh',
  'integration': 'Tích hợp',
  'template': 'Templates',
  'guide': 'Hướng dẫn',
};

export const LANDING_TYPE_RELATED_TITLES: Record<LandingType, string> = {
  'feature': 'Tính năng liên quan',
  'use-case': 'Trường hợp sử dụng liên quan',
  'solution': 'Giải pháp liên quan',
  'compare': 'So sánh liên quan',
  'integration': 'Tích hợp liên quan',
  'template': 'Templates liên quan',
  'guide': 'Hướng dẫn liên quan',
};
