export type RouteMode = 'unified' | 'namespace';
export type RoutableModuleKey = 'posts' | 'products' | 'services' | 'courses' | 'projects' | 'resources';

export const normalizeRouteMode = (value?: unknown): RouteMode => (
  value === 'namespace' ? 'namespace' : 'unified'
);

export const buildModuleListPath = (moduleKey: RoutableModuleKey): string => (
  moduleKey === 'courses' ? '/khoa-hoc' : `/${moduleKey}`
);

export const buildCategoryPath = (params: {
  mode: RouteMode;
  moduleKey: RoutableModuleKey;
  categorySlug: string;
}): string => {
  return `/${params.categorySlug}`;
};

export const buildDetailPath = (params: {
  mode: RouteMode;
  moduleKey: RoutableModuleKey;
  recordSlug: string;
  categorySlug?: string | null;
}): string => {
  if (params.categorySlug) {
    return `/${params.categorySlug}/${params.recordSlug}`;
  }
  return `/${params.moduleKey}/${params.recordSlug}`;
};

export const buildCategorySearchParamKey = (moduleKey: RoutableModuleKey): string => (
  moduleKey === 'posts' ? 'catpost' : 'category'
);
