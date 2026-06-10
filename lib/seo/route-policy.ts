/**
 * SEO Route Policy Contract
 * Convention-over-Configuration: định nghĩa policy cứng cho từng route type
 */

export type RouteType =
  | 'home'
  | 'list'
  | 'detail'
  | 'landing'
  | 'utility'
  | 'private'
  | 'system'
  | 'admin';

export type RoutePolicy = {
  indexable: boolean;
  canonicalRule: 'self' | 'clean' | 'parent' | 'noindex';
  includeInSitemap: boolean;
  revalidate?: number; // seconds, undefined = dynamic
  schemaTypes: string[];
};

const ROUTE_POLICIES: Record<RouteType, RoutePolicy> = {
  admin: {
    canonicalRule: 'noindex',
    includeInSitemap: false,
    indexable: false,
    revalidate: undefined,
    schemaTypes: [],
  },
  detail: {
    canonicalRule: 'self',
    includeInSitemap: true,
    indexable: true,
    revalidate: 3600, // 1 hour
    schemaTypes: ['Breadcrumb'], // + entity-specific schema
  },
  home: {
    canonicalRule: 'self',
    includeInSitemap: true,
    indexable: true,
    revalidate: 1800, // 30 minutes
    schemaTypes: ['WebSite', 'Organization'],
  },
  landing: {
    canonicalRule: 'self',
    includeInSitemap: true,
    indexable: true,
    revalidate: 3600, // 1 hour
    schemaTypes: ['Article', 'Breadcrumb'],
  },
  list: {
    canonicalRule: 'clean',
    includeInSitemap: true,
    indexable: true,
    revalidate: 1800, // 30 minutes
    schemaTypes: ['Breadcrumb'],
  },
  private: {
    canonicalRule: 'noindex',
    includeInSitemap: false,
    indexable: false,
    revalidate: undefined,
    schemaTypes: [],
  },
  system: {
    canonicalRule: 'noindex',
    includeInSitemap: false,
    indexable: false,
    revalidate: undefined,
    schemaTypes: [],
  },
  utility: {
    canonicalRule: 'self',
    includeInSitemap: true,
    indexable: true,
    revalidate: 86400, // 24 hours
    schemaTypes: ['Breadcrumb'],
  },
};

export const getRoutePolicy = (routeType: RouteType): RoutePolicy => {
  return ROUTE_POLICIES[routeType];
};

export const resolveRouteType = (pathname: string): RouteType => {
  // Admin routes
  if (pathname.startsWith('/admin')) {
    return 'admin';
  }

  // System routes
  if (pathname.startsWith('/system')) {
    return 'system';
  }

  // Private routes
  if (
    pathname.startsWith('/account') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/wishlist')
  ) {
    return 'private';
  }

  // Home
  if (pathname === '/') {
    return 'home';
  }

  // Landing pages (programmatic SaaS surface)
  if (
    pathname.startsWith('/features/') ||
    pathname.startsWith('/use-cases/') ||
    pathname.startsWith('/solutions/') ||
    pathname.startsWith('/compare/') ||
    pathname.startsWith('/integrations/') ||
    pathname.startsWith('/templates/') ||
    pathname.startsWith('/guides/')
  ) {
    return 'landing';
  }

  // Detail pages
  if (
    pathname.match(/^\/posts\/[^/]+$/) ||
    pathname.match(/^\/products\/[^/]+$/) ||
    pathname.match(/^\/services\/[^/]+$/) ||
    pathname.match(/^\/[^/]+\/[^/]+$/)
  ) {
    return 'detail';
  }

  // List pages
  if (
    pathname === '/posts' ||
    pathname === '/products' ||
    pathname === '/services' ||
    pathname === '/promotions' ||
    pathname === '/stores' ||
    pathname === '/features' ||
    pathname === '/use-cases' ||
    pathname === '/solutions' ||
    pathname === '/compare' ||
    pathname === '/integrations' ||
    pathname === '/templates' ||
    pathname === '/guides'
  ) {
    return 'list';
  }

  // Utility pages
  if (pathname === '/contact' || pathname === '/about') {
    return 'utility';
  }

  // Default to utility for unknown public routes
  return 'utility';
};

export const shouldIndex = (params: {
  routeType: RouteType;
  moduleEnabled?: boolean;
  entityExists?: boolean;
}): boolean => {
  const policy = getRoutePolicy(params.routeType);

  // Policy cứng: private/admin/system không bao giờ index
  if (!policy.indexable) {
    return false;
  }

  // Module disabled -> noindex
  if (params.moduleEnabled === false) {
    return false;
  }

  // Entity không tồn tại -> noindex
  if (params.entityExists === false) {
    return false;
  }

  return true;
};
