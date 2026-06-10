type BuildListCanonicalParams = {
  baseUrl: string;
  pathname: string;
  pageParam?: string | string[];
};

const normalizeBaseUrl = (baseUrl: string): string => {
  if (!baseUrl) {
    return '';
  }
  return baseUrl.replace(/\/$/, '');
};

const normalizePathname = (pathname: string): string => {
  if (!pathname) {
    return '/';
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
};

const resolvePage = (pageParam?: string | string[]): number | null => {
  if (!pageParam) {
    return null;
  }
  const raw = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 2) {
    return null;
  }
  return Math.floor(parsed);
};

export const buildListCanonical = ({ baseUrl, pathname, pageParam }: BuildListCanonicalParams): string | undefined => {
  if (!baseUrl) {
    return undefined;
  }

  const normalizedBase = normalizeBaseUrl(baseUrl);
  const normalizedPath = normalizePathname(pathname);
  const page = resolvePage(pageParam);
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  if (page) {
    url.searchParams.set('page', String(page));
  }

  return url.toString();
};
